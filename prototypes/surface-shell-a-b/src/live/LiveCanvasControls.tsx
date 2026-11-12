import { t, useUiLocale } from "../i18n";
import distribution from "../../distribution.json" with {type:"json"};
import { isTimerWidget } from '../widgets/timer';
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { FluentToolbarIcon } from "../icons/FluentToolbarIcon";
import { canBeMaterialClipElement, isMaterialClip, type ClipScrollAnchor, type ClipFrame, type PresentationClip } from "../canvas/clip-frames";
import QRCode from "qrcode";
import { StudentPreview } from "./StudentPreview";
import { Eye, Copy, Globe, LocateFixed, Monitor, MonitorUp, Play, QrCode, Radio, ScanLine, Square, Trash2, UsersRound, X } from "lucide-react";
import { LiveHost, requiresLiveSourceChangeConfirmation } from "./live-host";
import { RoomCanvasHost } from './room-canvas-host';
import { boundedCamera } from "./viewer-camera";
import type { Viewport } from "../../../../shared/live-canvas/protocol";
import "./live-host.css";

export function useLiveCanvas(api: ExcalidrawImperativeAPI | null, lessonId: string) {
  const [host] = useState(() => new LiveHost());
  const state = useSyncExternalStore(host.subscribe, host.getSnapshot);
  const [room] = useState(() => new RoomCanvasHost());
  const roomState = useSyncExternalStore(room.subscribe,room.getSnapshot);
  const [output,setOutput] = useState<'room'|'remote'>('room');
  const [previewOpen,setPreviewOpen] = useState(false);
  useEffect(()=>{host.enablePreview(previewOpen);return()=>host.enablePreview(false);},[host,previewOpen]);
  const [creatingClip, setCreatingClip] = useState(false);
  const clipShortcut = useRef<((number: number) => boolean) | null>(null);
  const addSelectedClip = useRef<((number?: number) => boolean) | null>(null);
  useEffect(() => { setCreatingClip(false); }, [lessonId]);
  const [open, setOpen] = useState(false);
  const [remoteConfiguration, setRemoteConfiguration] = useState<'checking'|'configured'|'missing'|'error'>('checking');
  const [configurationRetry, setConfigurationRetry] = useState(0);
  useEffect(() => {
    if (!open || !distribution.remoteCanvas) return;
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setRemoteConfiguration('checking');
    void fetch('/api/live/config', {signal:controller.signal}).then(async response => {
      if (!response.ok) throw new Error(t("Konfiguration nicht erreichbar"));
      const config = await response.json();
      if (!disposed) setRemoteConfiguration(config.configured === true ? 'configured' : 'missing');
    }).catch(() => {if (!disposed) setRemoteConfiguration('error');}).finally(() => clearTimeout(timeout));
    return () => {disposed = true;clearTimeout(timeout);controller.abort();};
  }, [open, configurationRetry]);
  const [pendingLesson, setPendingLesson] = useState<{ title: string; resolve: (value: boolean) => void } | null>(null);
  useEffect(() => { host.attach(api, lessonId); return () => host.attach(null, lessonId); }, [api, host, lessonId]);
  useEffect(() => { host.activate(); return () => host.dispose(); }, [host]);
  useEffect(() => {room.attach(api,lessonId);return()=>room.attach(null,lessonId);},[api,lessonId,room]);
  useEffect(() => {const closing=()=>room.stop();window.addEventListener('beforeunload',closing);
    return()=>window.removeEventListener('beforeunload',closing);},[room]);
  const remoteActive=Boolean(state.session && state.state==='live');
  const presenting=roomState.active||remoteActive;
  return {
    previewOpen,setPreviewOpen, host, state, room, roomState, output,setOutput, remoteActive,presenting,
    open, setOpen, pendingLesson, creatingClip, setCreatingClip,
    remoteConfiguration, remoteAvailable: distribution.remoteCanvas && (Boolean(state.session) || remoteConfiguration === 'configured'),
    retryConfiguration: () => setConfigurationRetry(value => value + 1),
    materialControls: {
      timerActive: presenting,
      showTimer: (id:string) => {if(roomState.active)room.showMaterial(id,'Timer');else if(remoteActive)host.showTimerClip(id,crypto.randomUUID());},
      active:roomState.active,
      activeId:roomState.target.kind==='material'?roomState.target.id:null,
      show: (elementId:string) => {
        const element=api?.getSceneElements().find(candidate=>candidate.id===elementId&&!candidate.isDeleted);
        if(!element)return;
        const title=typeof element.customData?.sourceTitle==='string'?element.customData.sourceTitle:t("Material");
        room.showMaterial(elementId,title);
      },
      mediaId:roomState.mediaId,
      fullscreen:{active:roomState.active,id:roomState.mediaFullscreenId,
        change:(elementId:string,active:boolean)=>room.setMediaFullscreen(elementId,active)},
      playback:(elementId:string,playing:boolean,position:number,volume?:number)=>room.playMedia(elementId,playing,position,volume),
    },
    interactiveControls: {
      accessFor: (elementId:string) => state.materialAccess[elementId]?.mode === 'all' ? 'all' as const : 'locked' as const,
      setAccess: (elementId:string,mode:'locked'|'all') => host.setMaterialAccess(elementId,mode),
    },
    focusArea(bounds: Viewport) {
      if (!api) return;
      const appState = api.getAppState();
      if (!appState.width || !appState.height) return;
      api.updateScene({
        appState: boundedCamera(appState, bounds, true, 64, 3) as Pick<typeof appState,"scrollX"|"scrollY"|"zoom">,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    },
    clipControls: {
      creating: creatingClip, finish: () => setCreatingClip(false),
      created: () => undefined,
      show: (clip: PresentationClip, scrollAnchor?: ClipScrollAnchor) => {
        if (isMaterialClip(clip)) {
          const element = api?.getSceneElements().find(candidate => candidate.id === clip.elementId && canBeMaterialClipElement(candidate));
          if (!element) return;
          if(remoteActive && isTimerWidget(element)){host.showTimerClip(element.id,clip.id);return;}
          if(!roomState.active)return;
          const title = isTimerWidget(element) ? 'Timer' : typeof element.customData?.sourceTitle === 'string' ? element.customData.sourceTitle : t("Material");
          room.showMaterial(clip.elementId, title, clip.id, clip.number);
        } else if(roomState.active)room.showClip(clip,scrollAnchor);
        else if(remoteActive)host.showClip(clip);
      },
      move: (clip: ClipFrame, scrollAnchor?: ClipScrollAnchor) => {if(roomState.active)room.moveClip(clip,scrollAnchor);else if(remoteActive)host.moveClip(clip);},
      removed: (clip: PresentationClip) => {
        if (isMaterialClip(clip)) {
          if (room.state.target.kind === 'material' && room.state.target.cueId === clip.id) room.setCanvas();
          if(host.state.presentation.clip?.id===clip.id)host.setFree();
        } else {
          room.removed(clip.id);
          if(host.state.presentation.clip?.id===clip.id)host.setFree();
        }
      },
      replaced: (clip: PresentationClip) => {
        if (room.state.target.kind === 'clip' && room.state.target.clip.id === clip.id) room.setCanvas();
        if (room.state.target.kind === 'material' && room.state.target.cueId === clip.id) room.setCanvas();
        if (host.state.presentation.clip?.id === clip.id) host.setFree();
      },
      activeClip: roomState.active ? roomState.target.kind==='clip'?roomState.target.clip:null : state.presentation.mode==='clip'?state.presentation.clip:null,
      activeScrollAnchor: roomState.active && roomState.target.kind==='clip' ? roomState.target.scrollAnchor ?? null : undefined,
      activeId: roomState.active
        ? roomState.target.kind === 'clip' ? roomState.target.clip.id : roomState.target.kind === 'material' ? roomState.target.cueId ?? null : null
        : state.presentation.mode === 'clip' ? state.presentation.clip?.id ?? null : null,
      canShowMaterial: (elementId:string) => roomState.active || remoteActive && Boolean(api?.getSceneElements().some(e=>e.id===elementId&&isTimerWidget(e))),
      pending: roomState.active?!roomState.ready:state.busy,
      shown: roomState.active?roomState.ready:remoteActive&&state.connected&&state.publicationReady,
      shortcut: clipShortcut, addSelected: addSelectedClip,
    },
    ready: Boolean(api),
    async confirmSourceChange(title: string) {
      if (!roomState.active && !requiresLiveSourceChangeConfirmation(host.state)) return true;
      return new Promise<boolean>((resolve) => setPendingLesson({ title, resolve }));
    },
    resolveSourceChange(accepted: boolean) { pendingLesson?.resolve(accepted); setPendingLesson(null); },
  };
}

export function LiveClipTool({ live, iconOnly = false, header = false }: {live: ReturnType<typeof useLiveCanvas>; iconOnly?: boolean; header?: boolean}) {
  useUiLocale();
  return <button type="button" className="tool-button live-clip-tool" title={live.creatingClip ? t("Material antippen oder Ausschnitt aufziehen") : t("Clip aufnehmen (C)")} aria-label={t("Clip aufnehmen")} aria-keyshortcuts="C" aria-pressed={live.creatingClip} disabled={!live.ready}
    onClick={() => live.setCreatingClip(!live.creatingClip)}>
    {header ? <ScanLine aria-hidden="true" strokeWidth={1.8}/> : <FluentToolbarIcon name="clip"/>}{!iconOnly && <span className="tool-button-label">{t("Clip aufnehmen")}</span>}
  </button>;
}

function RoomPreview({room,screen,onFocus,onClose}:{room:RoomCanvasHost;screen:{width:number;height:number}|null;onFocus:(bounds:Viewport)=>void;onClose:()=>void}){
  const preview=useSyncExternalStore(room.subscribePreview,room.getPreviewSnapshot);
  return <StudentPreview room screen={screen} preview={preview} pointer={room.previewPointer} onFocus={onFocus} onClose={onClose}/>;
}

export function LiveCanvasControls({ live }: { live: ReturnType<typeof useLiveCanvas> }) {
  useUiLocale();
  const { state, host, room, roomState } = live;
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const count = state.participants.filter((person) => person.connected).length;
  const inviteUrl = state.session ? `${state.session.baseUrl}/join/${state.session.inviteId}` : null;
  const liveReady = state.state === "live" && state.connected && state.publicationReady;
  const selectedOutput=roomState.active?'room':state.session?'remote':live.output;
  const target=roomState.active?roomState.target:state.presentation.mode==='clip'&&state.presentation.clip
    ?{kind:'clip' as const,clip:state.presentation.clip}:{kind:'canvas' as const};
  const targetLabel=target.kind==='clip'?`Clip ${'number' in target.clip?target.clip.number:''}`.trim()
    :target.kind==='material'?(target.number ? t("Clip {0} · {1}", target.number, target.title) : t("Material · {0}", target.title)):'Canvas';
  const targetModeLabel=target.kind==='material'?t("Material"):target.kind==='clip'?'Clip':'Canvas';
  const roomStartupLabel=roomState.startup==='waiting'?t("Wird vorbereitet …"):roomState.startup==='failed'?t("Nicht bereit"):null;
  const roomError=roomState.startup==='failed'?"Room Canvas konnte nicht starten.":roomState.error;
  const presentationError=selectedOutput==='room'?roomError:state.error||localError;
  const hasTarget=target.kind!=='canvas';
  const copyInvitation = async () => {
    setLocalError(null);
    const url = inviteUrl ?? await host.prepareInvitation();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { setLocalError("Der Raum ist bereit. Link bitte erneut kopieren."); }
  };
  useEffect(() => {
    let cancelled = false;
    setQr(null);
    if (inviteUrl && showQr) void QRCode.toDataURL(inviteUrl, { width: 400, margin: 2, errorCorrectionLevel: "M", color: { dark: "#152331", light: "#ffffff" } })
      .then((result) => { if (!cancelled) setQr(result); }).catch(() => { if (!cancelled) setLocalError("QR-Code konnte nicht erstellt werden."); });
    return () => { cancelled = true; };
  }, [inviteUrl, showQr]);
  useEffect(() => {
    if (!live.open) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) live.setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !live.pendingLesson) { live.setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [live.open, live.pendingLesson, live.setOpen]);
  useEffect(() => {
    if (live.pendingLesson) dialogRef.current?.showModal(); else dialogRef.current?.close();
  }, [live.pendingLesson]);
  return <>
    {live.previewOpen && (selectedOutput==='room'
      ? <RoomPreview room={room} screen={roomState.screen} onFocus={live.focusArea} onClose={()=>live.setPreviewOpen(false)}/>
      : <StudentPreview preview={state.preview} pointer={host.previewPointer} onFocus={live.focusArea} onClose={()=>live.setPreviewOpen(false)}/>)}
    <button ref={triggerRef} type="button" className={`live-host-trigger ${live.presenting ? "has-session" : ""} ${liveReady||roomState.ready ? "is-live" : ""}`} aria-expanded={live.open} aria-controls="live-host-panel" title={t("Präsentieren")}
      aria-label={live.presenting ? `${selectedOutput==='room'?'Room Canvas':'Remote Canvas'}, ${roomStartupLabel??targetLabel}` : t("Präsentieren")}
      disabled={!live.ready}
      onClick={() => live.setOpen(!live.open)}>
      {live.presenting ? selectedOutput==='room' ? <Monitor aria-hidden="true"/> : <Globe aria-hidden="true"/> : <Radio aria-hidden="true"/>}
      <span className="live-host-title">{t("Präsentieren")}</span>
      {live.presenting && <span className="live-host-mode" data-mode={roomStartupLabel?'canvas':target.kind} data-empty={roomState.startup==='failed'}>{roomStartupLabel??targetModeLabel}</span>}
      {selectedOutput==='remote'&&state.session && <span className="live-host-count" aria-hidden="true"><UsersRound/>{count}</span>}
    </button>
    {live.presenting&&hasTarget&&<button type="button" className="live-target-clear" aria-label={t("Zur Canvasansicht")} title={t("Zur Canvasansicht")} onClick={()=>selectedOutput==='room'?room.setCanvas():host.setFree()}><X aria-hidden="true"/></button>}
    {live.open && <div id="live-host-panel" ref={panelRef} className="live-host-panel" role="region" aria-label={t("Präsentieren")}>
      <div className="live-host-heading"><h2>{t("Präsentieren")}</h2><button className="live-host-icon" aria-label={t("Schließen")} onClick={() => { live.setOpen(false); triggerRef.current?.focus(); }}><X/></button></div>
      <div className="live-host-modes" role="group" aria-label={t("Ausgabe")}>
        <button aria-pressed={selectedOutput==='room'} disabled={roomState.active||Boolean(state.session)} onClick={()=>live.setOutput('room')}><Monitor aria-hidden="true"/>Room Canvas</button>
        {distribution.remoteCanvas && <button aria-pressed={selectedOutput==='remote'} disabled={!live.remoteAvailable||roomState.active||Boolean(state.session)} onClick={()=>live.setOutput('remote')}><Globe aria-hidden="true"/>Remote Canvas</button>}
      </div>
      {distribution.remoteCanvas && !state.session && live.remoteConfiguration !== 'configured' && <p className="live-host-muted" role="status">
        {live.remoteConfiguration === 'checking' ? t("Remote Canvas wird geprüft …") : live.remoteConfiguration === 'missing'
          ? t("Remote Canvas ist auf diesem Gerät noch nicht eingerichtet.") : t("Remote Canvas konnte nicht geprüft werden.")}
        {live.remoteConfiguration === 'error' && <button className="live-host-copy" onClick={live.retryConfiguration}>{t("Erneut prüfen")}</button>}
      </p>}
      {selectedOutput==='remote'&&liveReady&&state.presentation.mode==='free'&&<button className="live-host-copy live-host-recall" onClick={() => host.recallAll()}><LocateFixed aria-hidden="true"/>{t("Alle zu mir")}</button>}
      {selectedOutput==='room'&&roomState.active&&<button className="live-host-copy live-host-recall" onClick={()=>void room.showWindow()}><MonitorUp aria-hidden="true"/>{t("Fenster anzeigen")}</button>}
      {selectedOutput==='remote'&&<div className="live-host-invite">
        <div className="live-host-section-title">{t("Einladen")}</div>
        <div className="live-host-share-actions">
        <button className="live-host-copy" disabled={!live.remoteAvailable || !state.session && state.busy} onClick={() => void copyInvitation()}><Copy aria-hidden="true"/>{copied ? t("Kopiert") : t("Link kopieren")}</button>
        <button className="live-host-copy" disabled={!live.remoteAvailable || !state.session && state.busy} aria-expanded={showQr} aria-controls="live-host-qr" onClick={() => {
          const next = !showQr; setShowQr(next); setLocalError(null);
          if (next && !state.session) void host.create();
        }}><QrCode aria-hidden="true"/>QR-Code</button>
        </div>
        {showQr && <div id="live-host-qr">{qr ? <img className="live-host-qr" src={qr} alt={t("QR-Code zum Beitreten")} width="200" height="200"/> : <p className="live-host-muted" role="status">{t("QR-Code wird vorbereitet …")}</p>}</div>}
      </div>}
      {selectedOutput==='remote'&&!state.session && state.busy && <p className="live-host-muted" role="status">{t("Wird verbunden …")}</p>}
      {selectedOutput==='remote'&&state.session && <>
        <div className="live-host-list-heading"><span>{t("Teilnehmer")}</span><span>{count}</span></div>
        <ul className="live-host-people">
          {state.participants.length === 0 && <li className="live-host-empty">{t("Noch niemand dabei")}</li>}
          {state.participants.map((person, index) => <li key={person.id}>
            <span className={`live-person-dot ${person.connected ? "is-connected" : ""}`} title={person.connected ? t("Verbunden") : t("Nicht verbunden")}/>
            <span className="live-person-name">{person.name}{state.participants.filter((p) => p.name === person.name).length > 1 ? ` · ${index + 1}` : ""}</span>
            <button className="live-host-icon live-host-remove" aria-label={t("{0} entfernen", person.name)} title={t("Entfernen")} onClick={() => host.kick(person.id)}><Trash2/></button>
          </li>)}
        </ul>
        {!state.connected && <p className="live-host-muted" role="status">{t("Verbindung wird hergestellt …")}</p>}
      </>}
      <div className="live-host-footer">
        {selectedOutput==='room'&&!roomState.active&&<button className="live-host-primary live-host-session-action" disabled={!live.ready} onClick={()=>void room.start()}><Play aria-hidden="true"/>{t("Starten")}</button>}
        {selectedOutput==='remote'&&state.state==='waiting'&&<button className="live-host-primary live-host-session-action" disabled={state.busy||!live.ready} onClick={()=>{host.setFree();host.start();}}><Play aria-hidden="true"/>{state.busy?t("Wird vorbereitet …"):t("Starten")}</button>}
        {selectedOutput==='room'&&roomState.active&&<button className="live-host-end live-host-session-action" onClick={()=>{room.stop();live.setOpen(false);}}><Square aria-hidden="true"/>{t("Beenden")}</button>}
        {selectedOutput==='remote'&&state.session&&state.state==='live'&&<button className="live-host-end live-host-session-action" onClick={() => { host.end(); live.setOpen(false); }}><Square aria-hidden="true"/>{t("Beenden")}</button>}
        {selectedOutput==='remote'&&state.session&&<button className="live-host-copy live-preview-toggle" aria-pressed={live.previewOpen} onClick={()=>{live.setPreviewOpen(!live.previewOpen);live.setOpen(false);}}><Eye/>{t("Schülervorschau")}</button>}
        {selectedOutput==='room'&&roomState.active&&<button className="live-host-copy live-preview-toggle" aria-pressed={live.previewOpen} onClick={()=>{live.setPreviewOpen(!live.previewOpen);live.setOpen(false);}}><Eye/>{t("Raumvorschau")}</button>}
      </div>
      {presentationError&&<div className="live-host-error" role="alert">{t(presentationError)}
        {!(selectedOutput==='room'&&roomError?.includes('wurde entfernt'))&&<button onClick={() => {setLocalError(null);if(selectedOutput==='room')void room.retry();else if(state.session)host.retryPublish();else void host.create();}}>{t("Erneut versuchen")}</button>}
      </div>}
    </div>}
    <dialog ref={dialogRef} className="live-switch-dialog" onCancel={(event) => { event.preventDefault(); live.resolveSourceChange(false); }}>
      <h2>{live.presenting ? t("Neue Stunde zeigen?") : t("Neue Stunde für Remote Canvas laden?")}</h2>
      <p>{live.pendingLesson?.title}</p>
      <div><button autoFocus onClick={() => live.resolveSourceChange(false)}>{t("Abbrechen")}</button><button className="live-host-primary" onClick={() => live.resolveSourceChange(true)}>{live.presenting ? t("Stunde zeigen") : t("Stunde laden")}</button></div>
    </dialog>
  </>;
}
