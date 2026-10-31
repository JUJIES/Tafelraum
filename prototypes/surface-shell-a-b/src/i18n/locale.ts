export type UiLocale = "de" | "en";
export const uiLocaleStorageKey = "tafelraum-ui-language-v1";
export function parseUiLocale(value: unknown): UiLocale {
  return value === "en" ? "en" : "de";
}
let locale: UiLocale = "de";
let initialized = false;
const listeners = new Set<() => void>();
export function getUiLocale(): UiLocale {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try { locale = parseUiLocale(window.localStorage.getItem(uiLocaleStorageKey)); } catch { /* In-memory preference still works. */ }
  }
  return locale;
}
function publish(next: UiLocale) {
  if (next === getUiLocale()) return;
  locale = next;
  for (const listener of listeners) listener();
}
export function setUiLocale(next: UiLocale) {
  getUiLocale();
  try { window.localStorage.setItem(uiLocaleStorageKey, next); } catch { /* Storage may be unavailable. */ }
  publish(next);
}
function onStorage(event: StorageEvent) {
  if (event.key === uiLocaleStorageKey || event.key === null) {
    try { publish(parseUiLocale(window.localStorage.getItem(uiLocaleStorageKey))); } catch { /* Keep current choice. */ }
  }
}
export function subscribeUiLocale(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}
export function uiLanguageTag() { return getUiLocale() === "en" ? "en-GB" : "de-DE"; }
