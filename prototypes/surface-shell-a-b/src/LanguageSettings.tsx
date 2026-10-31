import { setUiLocale, t, useUiLocale } from "./i18n";
import { ChevronDown } from "lucide-react";

export function LanguageSettings() {
  const locale = useUiLocale();
  return <label className="settings-select-row settings-language">
    <span>{t("Sprache")}</span>
    <span className="settings-select-control">
      <select value={locale} onChange={event => setUiLocale(event.target.value === "en" ? "en" : "de")}>
        <option value="de" lang="de" aria-label="Deutsch">Deutsch 🇩🇪</option>
        <option value="en" lang="en" aria-label="English">English 🇬🇧</option>
      </select>
      <ChevronDown aria-hidden="true"/>
    </span>
  </label>;
}
