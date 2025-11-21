import { getLocaleID, getString } from "../utils/locale";
import {
  ChatTurn,
  WorkspaceContext,
  collectContext,
  describeItems,
} from "./workspaceContext";
import { requestLLMCompletion, summarizeContextForHistory } from "./llmClient";

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

function updateStatus(doc: Document, text: string) {
  const status = doc.getElementById("ai-workspace-status");
  if (!status) return;
  status.textContent = text;
}

function synthesizeAnswer(
  question: string,
  context: WorkspaceContext,
  history: ChatTurn[],
) {
  const intro = getString("workspace-answer-intro");
  const contextText = describeItems(context.items, context.attachments);
  const followup = history.length
    ? getString("workspace-answer-followup")
    : getString("workspace-answer-first");
  return `${intro}\n${getString("workspace-answer-context")} ${contextText}\n${followup}\n\n${getString("workspace-answer-echo")} ${question}`;
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

  dialogHelper.addCell(4, 0, {
    tag: "div",
    namespace: "html",
    attributes: { id: "ai-workspace-status" },
    styles: {
      color: "var(--text-color-deemphasized)",
      minHeight: "20px",
    },
  });

  dialogHelper
    .addButton(getString("workspace-send"), "send", {
      callback: async () => {
        const doc = dialogHelper.window?.document;
        if (!doc) return false;
        const textarea = doc?.getElementById(
          "ai-workspace-question",
        ) as HTMLTextAreaElement | null;
        const question = textarea?.value.trim();
        if (!question) {
          updateStatus(doc, getString("workspace-error-empty-question"));
          return false;
        }
        const context = collectContext();
        addon.data.aiSession!.history.push({
          role: "user",
          content: question,
          contextLabel: context.label,
        });
        textarea!.value = "";
        const container = doc.getElementById(
          "ai-workspace-history",
        ) as HTMLElement | null;
        if (container) renderHistory(container, addon.data.aiSession!.history);
        updateStatus(doc, getString("workspace-status-waiting"));
        try {
          const answer = await requestLLMCompletion(
            question,
            context,
            addon.data.aiSession!.history,
          );
          addon.data.aiSession!.history.push({
            role: "assistant",
            content: answer,
            contextLabel: summarizeContextForHistory(context),
          });
          if (container)
            renderHistory(container, addon.data.aiSession!.history);
          updateStatus(doc, "");
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : getString("workspace-status-error");
          addon.data.aiSession!.history.push({
            role: "assistant",
            content: `${getString("workspace-error-generic")}: ${message}`,
            contextLabel: summarizeContextForHistory(context),
          });
          if (container)
            renderHistory(container, addon.data.aiSession!.history);
          updateStatus(doc, message);
        }
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
