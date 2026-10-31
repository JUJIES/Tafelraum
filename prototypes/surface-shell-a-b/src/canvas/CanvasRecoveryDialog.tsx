import { t, useUiLocale } from "../i18n";
import { useEffect, useRef } from "react";
import type { CanvasRecoveryChoice } from "./canvas-persistence";

export function CanvasRecoveryDialog({ resolve }: { resolve: ((choice: CanvasRecoveryChoice) => void) | null }) {
  useUiLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (resolve) { dialog.current?.showModal(); title.current?.focus(); }
    else dialog.current?.close();
  }, [resolve]);
  return <dialog ref={dialog} className="shortcut-help canvas-recovery-dialog" aria-labelledby="canvas-recovery-title" onCancel={event => event.preventDefault()}>
    <h2 id="canvas-recovery-title" ref={title} tabIndex={-1}>{t("Welche Fassung öffnen?")}</h2>
    <p>{t("Auf diesem Gerät liegt ein ungespeicherter Entwurf. Im Archiv wurde die Stunde inzwischen geändert.")}</p>
    <p>{t("Beim Wiederherstellen bleibt die bisherige Archivfassung in der Historie erhalten. „Archiv öffnen“ verwirft den lokalen Entwurf.")}</p>
    <div className="canvas-recovery-actions">
      <button className="action-button" type="button" onClick={() => resolve?.("archive")}>{t("Archiv öffnen")}</button>
      <button className="action-button" type="button" onClick={() => resolve?.("draft")}>{t("Entwurf wiederherstellen")}</button>
    </div>
  </dialog>;
}
