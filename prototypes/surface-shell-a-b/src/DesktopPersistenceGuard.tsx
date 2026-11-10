import { t, useUiLocale } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { flushSync } from "react-dom";

export function DesktopPersistenceGuard({ flush }: { flush: () => Promise<void> }) {
  useUiLocale();
  const current = useRef(flush); current.current = flush;
  const dialog = useRef<HTMLDialogElement>(null);
  const activeRequest = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (saving) dialog.current?.showModal(); else dialog.current?.close(); }, [saving]);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    const subscriptions = Promise.all([
      listen<number>("tafelraum-flush-before-exit", async event => {
        if (disposed) return;
        activeRequest.current = event.payload;
        flushSync(() => setSaving(true));
        // Modal focus commits native text editing before the final snapshot.
        // A minimized WebView may suspend animation frames, including on Quit.
        await new Promise<void>(resolve => window.setTimeout(resolve, 0));
        let saved = false;
        let failure: string | undefined;
        try { await current.current(); saved = true; }
        catch (error) { failure = error instanceof Error ? error.message : String(error); console.error(t("Speichern vor dem Beenden fehlgeschlagen."), error); }
        if (disposed || activeRequest.current !== event.payload) return;
        try { await invoke("confirm_desktop_persistence", { id: event.payload, saved, ...(failure ? { error: failure } : {}) }); }
        catch { saved = false; }
        if (!saved && !disposed && activeRequest.current === event.payload) { activeRequest.current = null; setSaving(false); }
      }),
      listen("tafelraum-exit-released", () => { activeRequest.current = null; if (!disposed) setSaving(false); }),
    ]);
    void subscriptions.catch(error => console.error(t("Speicherabschluss konnte nicht registriert werden."), error));
    return () => { disposed = true; void subscriptions.then(stops => stops.forEach(stop => stop())).catch(() => {}); };
  }, []);
  return <dialog ref={dialog} className="shortcut-help canvas-recovery-dialog" aria-label={t("Speichern vor dem Beenden")} onCancel={event => event.preventDefault()}>
    <p role="status">{t("Wird gespeichert …")}</p>
  </dialog>;
}
