import { t, useUiLocale } from "./i18n";
import { Keyboard, X } from "lucide-react";
import { useRef } from "react";
import { desktopToolShortcuts } from "./tool-shortcuts";
import type { CanvasTool } from "./canvas/canvas-port";

export function ShortcutHelp() {
  useUiLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const command = mac ? "⌘" : t("Strg");
  const toolNames: Partial<Record<CanvasTool, string>> = {
    selection: t("Auswahl"), pen: t("Stift"), marker: t("Marker"), eraser: t("Radierer"), text: "Text", hand: t("Fläche verschieben"),
  };
  const groups = [
    { title: t("Werkzeuge"), rows: [
      ...Object.entries(desktopToolShortcuts).map(([tool, shortcut]) => [toolNames[tool as CanvasTool]!, `${shortcut.display}${shortcut.mode === "temporary" ? t(" halten") : ""}`]),
      [t("Clip aufnehmen"), "C"],
      [t("Zeiger"), t("Y halten")],
    ] },
    { title: t("Bearbeiten"), rows: [
      [t("Rückgängig"), `${command} Z`], [t("Wiederholen"), `${command} ⇧ Z`],
      [t("Kopieren · auch Bilder für andere Apps"), `${command} C`], [t("Einfügen · auch Bilder aus anderen Apps"), `${command} V`],
      [t("Auswahl löschen"), mac ? "⌫" : t("Entf")], [t("Auswahl drehen"), "Q / E"],
    ] },
    { title: t("Ansicht"), rows: [
      [t("Vollbild an / aus"), "V"], [t("Werkzeugleiste ein / aus"), "^"],
      [t("Fläche zoomen"), t("{0} + Mausrad", command)], [t("Clip zeigen"), "1–9"],
      [t("Markiertes Material als Clip zuweisen"), mac ? "⌃ 1–9" : t("Strg 1–9")],
    ] },
  ];
  return <>
    <button className="settings-option" type="button" onClick={() => dialog.current?.showModal()}>
      <span>{t("Tastenkürzel")}</span><Keyboard size={21} aria-hidden="true"/>
    </button>
    <dialog className="shortcut-help" ref={dialog} aria-labelledby="shortcut-help-title"
      onKeyDown={event => {
        event.stopPropagation();
        if (event.key === "Escape") { event.preventDefault(); dialog.current?.close(); }
      }}>
      <header><h2 id="shortcut-help-title">{t("Tastenkürzel")}</h2><button type="button" className="action-button icon-only" aria-label={t("Tastenkürzel schließen")} onClick={() => dialog.current?.close()}><X size={22}/></button></header>
      <div className="shortcut-help__body">
        {groups.map(group => <section key={group.title}><h3>{t(group.title)}</h3><dl>{group.rows.map(([label, keys]) => <div key={label}><dt>{t(label)}</dt><dd><kbd>{t(keys)}</kbd></dd></div>)}</dl></section>)}
        <p>{t("Werkzeugkürzel gelten auf der Arbeitsfläche, nicht während der Texteingabe.")}</p>
      </div>
    </dialog>
  </>;
}
