import { config } from "../../package.json";

type PluginPrefsMap = _ZoteroTypes.Prefs["PluginPrefsMap"];

const PREFS_PREFIX = config.prefsPrefix;

/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 * @param key
 */
export function getPref<K extends keyof PluginPrefsMap | string>(key: K) {
  return Zotero.Prefs.get(`${PREFS_PREFIX}.${String(key)}`, true) as
    | PluginPrefsMap[Extract<K, keyof PluginPrefsMap>]
    | undefined
    | string
    | boolean;
}

/**
 * Set preference value.
 * Wrapper of `Zotero.Prefs.set`.
 * @param key
 * @param value
 */
export function setPref<K extends keyof PluginPrefsMap | string>(
  key: K,
  value: K extends keyof PluginPrefsMap ? PluginPrefsMap[K] : any,
) {
  return Zotero.Prefs.set(`${PREFS_PREFIX}.${String(key)}`, value, true);
}

/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 * @param key
 */
export function clearPref(key: string) {
  return Zotero.Prefs.clear(`${PREFS_PREFIX}.${key}`, true);
}
