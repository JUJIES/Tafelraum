import { t, useUiLocale } from "./i18n";
import distribution from "../distribution.json" with {type:"json"};
import { getVersion } from "@tauri-apps/api/app";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Download, Info, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { shouldOpenAutomaticUpdatePrompt, type DesktopUpdatePhase } from "./desktop-update-prompt";

type UpdateOverview = {
  currentVersion: string;
  availableVersion: string | null;
  phase: DesktopUpdatePhase;
};

const initialOverview: UpdateOverview = {
  currentVersion: __TAFELRAUM_VERSION__,
  availableVersion: null,
  phase: "idle",
};

export function useDesktopUpdate(presenting: boolean) {
  useUiLocale();
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState(initialOverview);
  const [error, setError] = useState<string | null>(null);
  const promptedVersions = useRef(new Set<string>());
  const desktopApp = isTauri();
  const updatesEnabled = distribution.officialUpdates;

  useEffect(() => {
    if (!desktopApp || !updatesEnabled) return;
    let active = true;
    let stopListening = () => {};
    let latestEvent: UpdateOverview | null = null;
    void listen<UpdateOverview>("tafelraum-update-overview", (event) => {
      latestEvent = event.payload;
      if (active) setOverview(event.payload);
    }).then(async (unlisten) => {
      stopListening = unlisten;
      const [version, currentOverview] = await Promise.all([
        getVersion(),
        invoke<UpdateOverview>("desktop_update_overview"),
      ]);
      if (active) setOverview({ ...(latestEvent ?? currentOverview), currentVersion: version });
    }).catch(() => {
      // The packaged app remains usable even when the native bridge is unavailable.
    });
    return () => {
      active = false;
      stopListening();
    };
  }, [desktopApp, updatesEnabled]);

  useEffect(() => {
    if (presenting) {
      setOpen(false);
    }
  }, [presenting]);

  useEffect(() => {
    if (!desktopApp || !overview.availableVersion || !shouldOpenAutomaticUpdatePrompt(
      overview.availableVersion, promptedVersions.current, overview.phase, presenting,
    )) return;
    promptedVersions.current.add(overview.availableVersion);
    setOpen(true);
  }, [desktopApp, overview.availableVersion, overview.phase, presenting]);

  async function checkForUpdates() {
    if (!desktopApp || !updatesEnabled || overview.phase !== "idle") return;
    setError(null);
    setOverview((current) => ({ ...current, phase: "checking" }));
    try {
      await invoke("request_desktop_update_check");
    } catch (reason) {
      setOverview((current) => ({ ...current, phase: "idle" }));
      const detail = reason instanceof Error ? reason.message : String(reason);
      setError(detail || t("Die Updateprüfung konnte nicht gestartet werden."));
    }
  }

  const close = useCallback(() => setOpen(false), []);
  const show = () => {
    if (overview.availableVersion) promptedVersions.current.add(overview.availableVersion);
    setOpen(true);
  };
  return { open, overview, error, updatesEnabled, desktopApp, show, close, checkForUpdates };
}

// The native subscription lives in SettingsMenu even when its popover is closed.
export function DesktopUpdateMenu({ update, returnFocusRef }: {
  update: ReturnType<typeof useDesktopUpdate>;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  useUiLocale();
  const { open, overview, error, updatesEnabled, desktopApp, close, checkForUpdates } = update;
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    rootRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close();
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        returnFocusRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", closeOutside, true);
    window.addEventListener("keydown", closeWithEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOutside, true);
      window.removeEventListener("keydown", closeWithEscape, true);
    };
  }, [open, close, returnFocusRef]);
  if (!open) return null;
  const available = overview.availableVersion;
  const busy = overview.phase !== "idle";
  const dismiss = () => { close(); returnFocusRef.current?.focus(); };
  return <section ref={rootRef} className="desktop-update-popover" role="dialog" tabIndex={-1}
    aria-label={updatesEnabled ? t("Version und Updates") : t("Version")}>
  <button type="button" className="desktop-update-close" aria-label={t("Schließen")} onClick={dismiss}><X aria-hidden="true"/></button>
  <div className={`desktop-update-illustration${available ? " has-update" : ""}`} aria-hidden="true">
    {available ? <Download/> : <Info/>}
  </div>
  <div className="desktop-update-heading">
    <span>Tafelraum</span>
    <strong>Version {overview.currentVersion}</strong>
  </div>
  {updatesEnabled && <p className="desktop-update-status" role="status">
    {overview.phase === "checking" && t("Updates werden gesucht …")}
    {overview.phase === "awaitingConfirmation" && t("Updateentscheidung ist geöffnet.")}
    {overview.phase === "installing" && t("Update wird installiert …")}
    {overview.phase === "idle" && available && t("Version {0} ist verfügbar.", available)}
    {overview.phase === "idle" && !available && t("Du kannst jederzeit nach einer neuen Version suchen.")}
  </p>}
  {error && <p className="desktop-update-error" role="alert">{t(error)}</p>}
  {updatesEnabled && <button
    className="desktop-update-check"
    type="button"
    disabled={!desktopApp || busy}
    onClick={() => void checkForUpdates()}
  >
    <RefreshCw aria-hidden="true"/>
    {overview.phase === "checking"
      ? t("Wird geprüft …")
      : available ? t("Jetzt aktualisieren …") : t("Nach Updates suchen")}
  </button>}
  {available && overview.phase === "idle" && (
    <button className="desktop-update-later" type="button" onClick={dismiss}>
      {t("Später")}
    </button>
  )}
  </section>;
}
