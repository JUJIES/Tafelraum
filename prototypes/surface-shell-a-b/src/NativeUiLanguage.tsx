import { useEffect } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useUiLocale } from "./i18n";

// The web preference remains canonical; native menus hold only its live value.
export function NativeUiLanguage() {
  const language = useUiLocale();
  useEffect(() => {
    if (isTauri()) void invoke("set_ui_language", { language }).catch(error => console.error("Native UI language could not be applied.", error));
  }, [language]);
  return null;
}
