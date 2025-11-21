import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";

type AISettingKey =
  | "openaiKey"
  | "openaiModel"
  | "deepseekKey"
  | "deepseekModel"
  | "conversationMode"
  | "agentTone";

type AISettings = Record<AISettingKey, string>;

const DEFAULT_SETTINGS: AISettings = {
  openaiKey: "",
  openaiModel: "gpt-4o-mini",
  deepseekKey: "",
  deepseekModel: "deepseek-chat",
  conversationMode: "auto",
  agentTone: "concise",
};

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  const settings = loadSettingsFromPrefs();

  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 140,
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail"),
        },
      ],
      rows: buildCapabilityRows(),
      settings,
    };
  } else {
    addon.data.prefs.window = _window;
    addon.data.prefs.settings = settings;
    addon.data.prefs.rows = buildCapabilityRows();
  }
  updatePrefsUI();
  bindPrefEvents();
}

function loadSettingsFromPrefs(): AISettings {
  const merged: Partial<AISettings> = { ...DEFAULT_SETTINGS };
  Object.entries(DEFAULT_SETTINGS).forEach(([key, fallback]) => {
    const value = getPref(key);
    if (value === undefined || value === null || value === "") {
      setPref(key, fallback);
      merged[key as AISettingKey] = fallback;
    } else {
      merged[key as AISettingKey] = String(value);
    }
  });
  return merged as AISettings;
}

function buildCapabilityRows() {
  return [
    {
      title: getString("prefs-row-dialog"),
      detail: getString("prefs-row-dialog-desc"),
    },
    {
      title: getString("prefs-row-collection"),
      detail: getString("prefs-row-collection-desc"),
    },
    {
      title: getString("prefs-row-pdf"),
      detail: getString("prefs-row-pdf-desc"),
    },
    {
      title: getString("prefs-row-tone"),
      detail: getString("prefs-row-tone-desc"),
    },
  ];
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          title: "no data",
          detail: "no data",
        },
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      const selected = addon.data.prefs?.rows
        .filter((_, i) => selection.isSelected(i))
        .map((row) => row.title);
      if (!selected?.length) return true;
      new ztoolkit.ProgressWindow(config.addonName)
        .createLine({
          text: selected.join(", "),
          progress: 100,
        })
        .show();
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].title || "",
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  const prefs = addon.data.prefs;
  if (!prefs?.window) return;
  const doc = prefs.window.document;
  if (!doc) return;
  if (!prefs.settings) {
    prefs.settings = { ...DEFAULT_SETTINGS };
  }
  const settings = prefs.settings;
  const bindings: Array<{
    selector: string;
    key: AISettingKey;
    prop?: "value" | "checked";
  }> = [
    {
      selector: `#zotero-prefpane-${config.addonRef}-openai-key`,
      key: "openaiKey",
    },
    {
      selector: `#zotero-prefpane-${config.addonRef}-openai-model`,
      key: "openaiModel",
    },
    {
      selector: `#zotero-prefpane-${config.addonRef}-deepseek-key`,
      key: "deepseekKey",
    },
    {
      selector: `#zotero-prefpane-${config.addonRef}-deepseek-model`,
      key: "deepseekModel",
    },
    {
      selector: `#zotero-prefpane-${config.addonRef}-conversation-mode`,
      key: "conversationMode",
    },
    {
      selector: `#zotero-prefpane-${config.addonRef}-agent-tone`,
      key: "agentTone",
    },
  ];

  bindings.forEach(({ selector, key }) => {
    const element = doc.querySelector(selector) as HTMLInputElement | null;
    if (!element) return;
    element.value = settings[key] ?? "";
    element.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const nextValue = target.value;
      settings[key] = nextValue;
      if (prefs.settings) {
        prefs.settings[key] = nextValue;
      }
      setPref(key, nextValue);
    });
  });
}
