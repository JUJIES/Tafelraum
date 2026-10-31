import { useEffect, useSyncExternalStore } from "react";
import { getUiLocale, subscribeUiLocale } from "./locale";
export { getUiLocale, setUiLocale, uiLanguageTag } from "./locale";
export type { UiLocale } from "./locale";

export { t } from "./translate";
// Every localized component subscribes itself, including portals and Room roots.
// Keep labels in shared configuration as source keys; translate when displaying.
export function useUiLocale() {
  const locale = useSyncExternalStore(subscribeUiLocale, getUiLocale, () => "de" as const);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return locale;
}
