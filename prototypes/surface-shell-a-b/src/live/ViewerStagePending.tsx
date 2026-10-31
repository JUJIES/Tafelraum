import { t, useUiLocale } from "../i18n";
import { ViewerFullscreenButton } from './ViewerFullscreenButton';

/** Loading is a transient state of the live surface, not a separate entry page. */
export function ViewerLiveStatus({ connected, hostConnected, pending = false, error = false }: {
  connected: boolean; hostConnected: boolean; pending?: boolean; error?: boolean;
}) {
  useUiLocale();
  return <div className="live-view-status" role="status">
    <span className={`live-dot ${connected && hostConnected && !error ? 'is-live' : ''}`} aria-hidden="true"/>
    {!connected ? t("Verbindung wird hergestellt …") : !hostConnected ? t("Verbindung zum Host unterbrochen") : error ? t("Übertragung unvollständig") : <>
      Live{pending && <span className="live-loading-detail"> {t("· Ansicht wird geladen …")}</span>}
    </>}
  </div>;
}

export function ViewerStagePending({ connected, hostConnected, choosingClip = false, error }: {
  connected: boolean; hostConnected: boolean; choosingClip?: boolean; error?: string | null;
}) {
  useUiLocale();
  return <main className="live-view live-stage-wait" aria-busy={!choosingClip}>
    <div className="live-view-frame is-live" aria-hidden="true"/>
    <ViewerLiveStatus connected={connected} hostConnected={hostConnected} pending={!choosingClip} error={Boolean(error)}/>
    <ViewerFullscreenButton/>
    {choosingClip && <div className="live-stage-placeholder" role="status">{t("Der Host wählt einen Clip.")}</div>}
    {error && <div className="live-view-error" role="alert">{t(error)}</div>}
  </main>;
}
