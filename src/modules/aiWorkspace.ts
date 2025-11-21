import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  contextLabel?: string;
}

interface WorkspaceContext {
  items: Zotero.Item[];
  label: string;
  attachments: number;
}

function resolveTone(): string {
  const tonePref = (getPref("agentTone") as string) || "concise";
  switch (tonePref) {
    case "creative":
      return getString("workspace-tone-creative");
    case "detailed":
      return getString("workspace-tone-detailed");
    default:
      return getString("workspace-tone-concise");
  }
}

function collectContext(): WorkspaceContext {
  const pane = ztoolkit.getGlobal("ZoteroPane");
  const items: Zotero.Item[] = pane?.getSelectedItems?.() || [];
  const collection = pane?.getSelectedCollection?.();
  const collectionItems = collection?.getChildItems?.();
  const mode = (getPref("conversationMode") as string) || "auto";

  let combined: Zotero.Item[] = [];
  if (mode === "item") {
    combined = items;
  } else if (mode === "collection" && Array.isArray(collectionItems)) {
    combined = collectionItems as Zotero.Item[];
  } else if (items.length) {
    combined = items;
  } else if (Array.isArray(collectionItems)) {
    combined = collectionItems as Zotero.Item[];
  }

  const labelParts: string[] = [];
  if (collection?.name) {
    labelParts.push(`${collection.name}`);
  }
  if (combined.length) {
    labelParts.push(`${combined.length} ${getString("workspace-items")}`);
  }

  const attachments = combined.reduce((acc, item) => {
    if (typeof (item as any).getAttachments === "function") {
      return acc + ((item as any).getAttachments() as number[]).length;
    }
    return acc;
  }, 0);

  return {
    items: combined,
    label: labelParts.join(" · ") || getString("workspace-empty"),
    attachments,
  };
}

function renderHistory(container: HTMLElement, history: ChatTurn[]) {
  const doc = container.ownerDocument;
  if (!doc) return;
  container.replaceChildren();
  history.forEach((turn) => {
    const row = doc.createElement("div");
    row.classList.add("ai-workspace-line");
    row.textContent = `${turn.role === "user" ? "🧑" : "🤖"} ${turn.content}`;
    if (turn.contextLabel) {
      const detail = doc.createElement("div");
      detail.classList.add("ai-workspace-context");
      detail.textContent = turn.contextLabel;
      row.appendChild(detail);
    }
    container.appendChild(row);
  });
}

function describeItems(items: Zotero.Item[], attachments: number) {
  if (!items.length) return getString("workspace-empty");
  const topItems = items.slice(0, 3).map((item) => {
    const title = item.getField("title") || item.getDisplayTitle?.() || "";
    const creators = (item as any).getCreators?.()?.slice?.(0, 2) || [];
    const names = creators
      .map(
        (creator: any) => creator.name || creator.lastName || creator.firstName,
      )
      .filter(Boolean);
    return `${title}${names.length ? ` — ${names.join(", ")}` : ""}`;
  });
  const more = items.length > 3 ? ` +${items.length - 3}` : "";
  const attachmentText = attachments
    ? ` · ${attachments} ${getString("workspace-pdfs")}`
    : "";
  return `${topItems.join(" | ")}${more}${attachmentText}`;
}

function synthesizeAnswer(
  question: string,
  context: WorkspaceContext,
  history: ChatTurn[],
) {
  const tone = resolveTone();
  const intro = getString("workspace-answer-intro");
  const contextText = describeItems(context.items, context.attachments);
  const followup = history.length
    ? getString("workspace-answer-followup")
    : getString("workspace-answer-first");
  return `${intro} ${tone}\n${getString("workspace-answer-context")} ${contextText}\n${followup}\n\n${getString("workspace-answer-echo")} ${question}`;
}

function buildSectionBody(body: HTMLElement, context: WorkspaceContext) {
  body.replaceChildren();
  const doc = body.ownerDocument;
  if (!doc) return;
  const card = doc.createElement("div");
  card.classList.add("ai-workspace-card");

  const heading = doc.createElement("div");
  heading.classList.add("ai-workspace-heading");
  heading.textContent = getString("workspace-section-title");

  const summary = doc.createElement("div");
  summary.classList.add("ai-workspace-summary");
  summary.textContent = `${getString("workspace-context")}: ${context.label}`;

  const features = doc.createElement("ul");
  features.classList.add("ai-workspace-list");
  [
    getString("workspace-feature-pdf"),
    getString("workspace-feature-collection"),
    getString("workspace-feature-dialog"),
  ].forEach((text) => {
    const li = doc.createElement("li");
    li.textContent = text;
    features.appendChild(li);
  });

  const buttons = doc.createElement("div");
  buttons.classList.add("ai-workspace-actions");

  const openBtn = doc.createElement("button");
  openBtn.textContent = getString("workspace-open-dialog");
  openBtn.addEventListener("click", () => openWorkspaceDialog());

  const refreshBtn = doc.createElement("button");
  refreshBtn.textContent = getString("workspace-refresh-context");
  refreshBtn.addEventListener("click", () =>
    buildSectionBody(body, collectContext()),
  );

  buttons.appendChild(openBtn);
  buttons.appendChild(refreshBtn);

  card.appendChild(heading);
  card.appendChild(summary);
  card.appendChild(features);
  card.appendChild(buttons);
  body.appendChild(card);
}

export function registerWorkspaceSection() {
  Zotero.ItemPaneManager.registerSection({
    paneID: "ai-workspace",
    pluginID: addon.data.config.addonID,
    header: {
      l10nID: getLocaleID("workspace-section-label"),
      icon: "chrome://zotero/skin/16/universal/highlights.svg",
    },
    sidenav: {
      l10nID: getLocaleID("workspace-section-tooltip"),
      icon: "chrome://zotero/skin/20/universal/note.svg",
    },
    onRender: ({ body }) => {
      buildSectionBody(body as HTMLElement, collectContext());
    },
  });
}

export function registerWorkspaceMenu() {
  ztoolkit.Menu.register("item", {
    tag: "menuitem",
    id: "zotero-ai-workspace-open",
    label: getString("workspace-menuitem-label"),
    commandListener: () => openWorkspaceDialog(),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`,
  });
}

export function openWorkspaceDialog() {
  addon.data.aiSession ??= { history: [] } as { history: ChatTurn[] };
  const dialogHelper = new ztoolkit.Dialog(12, 1);
  dialogHelper
    .addCell(0, 0, {
      tag: "h1",
      properties: { innerHTML: getString("workspace-dialog-title") },
    })
    .addCell(1, 0, {
      tag: "p",
      properties: {
        innerHTML: getString("workspace-dialog-desc"),
      },
    });

  dialogHelper.addCell(2, 0, {
    tag: "div",
    namespace: "html",
    attributes: { id: "ai-workspace-history" },
    styles: {
      border: "1px solid var(--fill-section-border)",
      padding: "8px",
      height: "180px",
      overflowY: "auto",
      borderRadius: "6px",
    },
  });

  dialogHelper.addCell(3, 0, {
    tag: "textarea",
    namespace: "html",
    attributes: { id: "ai-workspace-question" },
    styles: {
      width: "100%",
      height: "96px",
    },
    properties: {
      placeholder: getString("workspace-question-placeholder"),
    },
  });

  dialogHelper
    .addButton(getString("workspace-send"), "send", {
      callback: () => {
        const doc = dialogHelper.window?.document;
        if (!doc) return false;
        const textarea = doc?.getElementById(
          "ai-workspace-question",
        ) as HTMLTextAreaElement | null;
        const question = textarea?.value.trim();
        if (!question) return false;
        const context = collectContext();
        addon.data.aiSession!.history.push({
          role: "user",
          content: question,
          contextLabel: context.label,
        });
        const answer = synthesizeAnswer(
          question,
          context,
          addon.data.aiSession!.history,
        );
        addon.data.aiSession!.history.push({
          role: "assistant",
          content: answer,
          contextLabel: describeItems(context.items, context.attachments),
        });
        textarea!.value = "";
        const container = doc.getElementById(
          "ai-workspace-history",
        ) as HTMLElement | null;
        if (container) renderHistory(container, addon.data.aiSession!.history);
        return false;
      },
    })
    .addButton(getString("workspace-close"), "cancel");

  dialogHelper.open(getString("workspace-dialog-title"));
  const container = dialogHelper.window?.document?.getElementById(
    "ai-workspace-history",
  ) as HTMLElement | null;
  if (container) renderHistory(container, addon.data.aiSession.history);
  addon.data.dialog = dialogHelper;
}
