import { getLocaleID, getString } from "../utils/locale";
import {
  ChatTurn,
  WorkspaceContext,
  collectContext,
  describeItems,
} from "./workspaceContext";
import { requestLLMCompletion, summarizeContextForHistory } from "./llmClient";

const PANEL_ID = "zotero-ai-workspace-pane";

function renderHistory(container: HTMLElement, history: ChatTurn[]) {
  const doc = container.ownerDocument;
  if (!doc) return;
  container.replaceChildren();

  const historyTitle = doc.createElement("div");
  historyTitle.classList.add("ai-workspace-subheading");
  historyTitle.textContent = getString("workspace-dialog-title");
  container.appendChild(historyTitle);

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
  const status = doc.getElementById(`${PANEL_ID}-status`);
  if (!status) return;
  status.textContent = text;
}

function getHistoryStore(): ChatTurn[] {
  addon.data.aiSession ??= { history: [] } as { history: ChatTurn[] };
  return addon.data.aiSession!.history;
}

function getWorkspaceBodies() {
  const data = addon.data as any;
  data.workspaceBodies ??= new WeakMap<Window, HTMLElement>();
  return data.workspaceBodies as WeakMap<Window, HTMLElement>;
}

function buildSectionBody(body: HTMLElement, context: WorkspaceContext) {
  body.replaceChildren();
  const doc = body.ownerDocument;
  if (!doc) return;

  if (doc.defaultView) {
    getWorkspaceBodies().set(doc.defaultView, body);
  }

  const panel = doc.createElement("div");
  panel.id = PANEL_ID;
  panel.classList.add("ai-workspace-pane");

  const toolbar = doc.createElement("div");
  toolbar.classList.add("ai-workspace-toolbar");

  const title = doc.createElement("div");
  title.classList.add("ai-workspace-heading");
  title.textContent = getString("workspace-section-title");

  const summary = doc.createElement("div");
  summary.classList.add("ai-workspace-summary");
  summary.textContent = `${getString("workspace-context")}: ${context.label}`;

  const toolbarActions = doc.createElement("div");
  toolbarActions.classList.add("ai-workspace-actions");

  const refreshBtn = doc.createElement("button");
  refreshBtn.textContent = getString("workspace-refresh-context");
  refreshBtn.addEventListener("click", () =>
    buildSectionBody(body, collectContext()),
  );

  const clearBtn = doc.createElement("button");
  clearBtn.textContent = getString("workspace-close");
  clearBtn.addEventListener("click", () => {
    const history = getHistoryStore();
    history.splice(0, history.length);
    renderHistory(historyContainer, history);
    updateStatus(doc, "");
  });

  toolbarActions.appendChild(refreshBtn);
  toolbarActions.appendChild(clearBtn);

  toolbar.appendChild(title);
  toolbar.appendChild(summary);
  toolbar.appendChild(toolbarActions);

  const historyContainer = doc.createElement("div");
  historyContainer.id = `${PANEL_ID}-history`;
  historyContainer.classList.add("ai-workspace-history");

  const statusLine = doc.createElement("div");
  statusLine.id = `${PANEL_ID}-status`;
  statusLine.classList.add("ai-workspace-status");

  const inputArea = doc.createElement("div");
  inputArea.classList.add("ai-workspace-input");

  const textarea = doc.createElement("textarea");
  textarea.id = `${PANEL_ID}-question`;
  textarea.placeholder = getString("workspace-question-placeholder");
  textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void sendHandler();
    }
  });

  const footer = doc.createElement("div");
  footer.classList.add("ai-workspace-footer");
  const sendButton = doc.createElement("button");
  sendButton.classList.add("ai-workspace-send");
  sendButton.textContent = getString("workspace-send");

  const history = getHistoryStore();
  renderHistory(historyContainer, history);

  const sendHandler = async () => {
    const question = textarea.value.trim();
    if (!question) {
      updateStatus(doc, getString("workspace-error-empty-question"));
      return;
    }
    const freshContext = collectContext();
    summary.textContent = `${getString("workspace-context")}: ${freshContext.label}`;

    history.push({
      role: "user",
      content: question,
      contextLabel: freshContext.label,
    });
    textarea.value = "";
    renderHistory(historyContainer, history);
    updateStatus(doc, getString("workspace-status-waiting"));
    try {
      const answer = await requestLLMCompletion(
        question,
        freshContext,
        history,
      );
      history.push({
        role: "assistant",
        content: answer,
        contextLabel: summarizeContextForHistory(freshContext),
      });
      renderHistory(historyContainer, history);
      updateStatus(doc, "");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : getString("workspace-status-error");
      history.push({
        role: "assistant",
        content: `${getString("workspace-error-generic")}: ${message}`,
        contextLabel: summarizeContextForHistory(freshContext),
      });
      renderHistory(historyContainer, history);
      updateStatus(doc, message);
    }
  };

  sendButton.addEventListener("click", () => void sendHandler());

  inputArea.appendChild(textarea);
  footer.appendChild(sendButton);

  panel.appendChild(toolbar);
  panel.appendChild(historyContainer);
  panel.appendChild(statusLine);
  panel.appendChild(inputArea);
  panel.appendChild(footer);

  // Quick context snapshot under the toolbar
  const contextSummary = doc.createElement("div");
  contextSummary.classList.add("ai-workspace-context-summary");
  contextSummary.textContent = describeItems(context.items, context.attachments);
  panel.insertBefore(contextSummary, historyContainer);

  body.appendChild(panel);
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
    commandListener: () => openWorkspacePanel(),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`,
  });
}

export function openWorkspacePanel() {
  const pane = ztoolkit.getGlobal("ZoteroPane");
  const doc = pane?.document;
  if (!doc) return;
  const win = doc.defaultView || undefined;
  const body =
    getWorkspaceBodies().get(win as Window) ||
    (doc.querySelector(`#${PANEL_ID}`)?.parentElement as HTMLElement | null) ||
    (doc.querySelector(
      `[data-section-id="ai-workspace"] .section-body`,
    ) as HTMLElement | null) ||
    (doc.querySelector(
      `[data-pane-id="ai-workspace"] .section-body`,
    ) as HTMLElement | null);
  if (!body) return;
  const section = body.closest(".section-container") as HTMLElement | null;
  section?.classList.remove("collapsed");
  body.scrollIntoView({ behavior: "smooth", block: "nearest" });
  buildSectionBody(body, collectContext());
}
