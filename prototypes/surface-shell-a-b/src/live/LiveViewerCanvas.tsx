import { t, useUiLocale, uiLanguageTag } from "../i18n";
import type {RoomVideoStatus} from './room-video-status';
import { remoteTimerWidgets } from "./remote-timer";
import { dispatchWheelToCanvas } from "../canvas/projected-media-gestures";
import { TimerWidgetLayer, type TimerGeometry } from "../widgets/TimerWidgetLayer";
import type { TimerAction, TimerWidget } from "../widgets/timer";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CaptureUpdateAction, Excalidraw, restoreElements } from "@excalidraw/excalidraw";
import { LocateFixed } from "lucide-react";
import type { BinaryFileData, DataURL, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import type { JsonValue, JoinResponse, LiveInteractiveMaterial, Scene, Viewport, Presentation } from "../../../../shared/live-canvas/protocol";
import { ViewerFullscreenButton } from "./ViewerFullscreenButton";
import { ViewerLiveStatus } from "./ViewerStagePending";
import { HostPointerOverlay } from "./HostPointerOverlay";
import type { HostPointerChannel } from "./host-pointer-channel";
import { CoverTransitionOverlay, type CoverEffect } from "./CoverTransitionOverlay";
import { boundedCamera, recallCamera } from "./viewer-camera";
import { interpolateTranslations, translationOrigins } from "./viewer-motion";
import { LiveInteractiveMaterialLayer } from "./LiveInteractiveMaterialLayer";
import { RoomMediaLayer } from './RoomMediaLayer';
import type { RoomMedia } from './room-media';
import { incrementalLinearElementIndex } from "./viewer-elements";

function fit(api: ExcalidrawImperativeAPI, viewport: Viewport, preview = false) {
  const state = api.getAppState();
  if (!state.width || !state.height) return;
  const padding = preview ? 24*state.width/(state.width>state.height?1093:820) : 24;
  const zoom = Math.max(0.1, Math.min(30, (state.width - padding) / viewport.width, (state.height - padding) / viewport.height));
  const scrollX = -viewport.x + (state.width / zoom - viewport.width) / 2;
  const scrollY = -viewport.y + (state.height / zoom - viewport.height) / 2;
  if (Math.abs(scrollX-state.scrollX)<.001 && Math.abs(scrollY-state.scrollY)<.001 && Math.abs(zoom-state.zoom.value)<.00001) return;
  api.updateScene({ appState: {
    zoom: { value: zoom as typeof state.zoom.value },
    scrollX, scrollY,
  }, captureUpdate: CaptureUpdateAction.NEVER });
}

const viewerInitial = { appState: { activeTool: { type: "hand" as const, customType: null, lastActiveTool: null, locked: false } } };
const coverTransitionDuration = 180;
type PreparedFile = { file: BinaryFileData; decoded: HTMLImageElement };

export default function CanvasViewer({ scene, renderVersion=0, participation, connected, hostConnected, publicationReady, hostPointer, presentation, previewAssets, materialBaseUrl, onMaterialAction, roomInputReady=true, room=false, roomPlaybackOutput=false, roomMedia, onRoomVideoStatus, onRoomMediaError, onSceneReady, roomCameraIndependent=false, roomPendingInkIds=[], roomActiveInkId=null, roomInkOverlay, onRoomApi, roomTimers=[], onTimerAction, onTimerTransform }: {
  scene: Scene; participation?: JoinResponse; connected: boolean; hostConnected: boolean; publicationReady: boolean;
  renderVersion?:number;
  hostPointer: HostPointerChannel; presentation?: Presentation; previewAssets?: Record<string,string>; materialBaseUrl?:string;
  onMaterialAction?(material:LiveInteractiveMaterial,state:JsonValue,baseState:JsonValue|null):void;
  roomInputReady?:boolean; room?:boolean; roomPlaybackOutput?:boolean; roomMedia?:RoomMedia|null; onRoomMediaError?(id:string,message:string):void; onRoomVideoStatus?(id:string,status:RoomVideoStatus,sequence:number):void;
  onSceneReady?(generation:number,revision:number):void;
  roomCameraIndependent?:boolean;
  roomPendingInkIds?:readonly string[];
  roomActiveInkId?:string|null;
  roomInkOverlay?:ReactNode;
  roomTimers?:readonly TimerWidget[];
  onTimerAction?(id:string,action:TimerAction,revision:number):void;
  onTimerTransform?(id:string,version:number,geometry:TimerGeometry):void;
  onRoomApi?(api:ExcalidrawImperativeAPI|null):void;
}) {
  useUiLocale();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const roomActiveInkIdRef=useRef(roomActiveInkId);roomActiveInkIdRef.current=roomActiveInkId;
  const roomPendingInkIdsRef=useRef(new Set(roomPendingInkIds));roomPendingInkIdsRef.current=new Set(roomPendingInkIds);
  useEffect(()=>{
    if(room)onRoomApi?.(api);
    return()=>{if(room)onRoomApi?.(null);};
  },[api,room,onRoomApi]);
  const [clip,setClip] = useState(presentation?.mode === "clip" ? presentation.clip : null);
  const clipRef = useRef(clip); clipRef.current = clip;
  const sceneRef = useRef(scene);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [activeCoverEffect, setActiveCoverEffect] = useState<CoverEffect | null>(null);
  const assets = useRef(new Map<string, Promise<PreparedFile>>());
  const effectSequence = useRef(0);
  const rendered = useRef({ generation: 0, revision: 0, renderVersion:0 });
  const renderVersionRef=useRef(renderVersion);renderVersionRef.current=renderVersion;
  const renderedWireElements = useRef<Readonly<Scene["elements"]> | null>(null);
  const renderedNativeElements = useRef<readonly ExcalidrawElement[] | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const [clipInset,setClipInset] = useState<string | undefined>();
  useEffect(() => {
    const node = root.current;
    if (!node || !room) return;
    const wheel = (event: WheelEvent) => {
      if (!(event.target instanceof Element && event.target.closest('.timer-widget'))) return;
      if (roomCameraIndependent) dispatchWheelToCanvas(node, event);
      event.preventDefault(); event.stopPropagation();
    };
    node.addEventListener('wheel', wheel, { capture: true, passive: false });
    return () => node.removeEventListener('wheel', wheel, true);
  }, [room, roomCameraIndependent]);
  const previewAssetsRef = useRef(previewAssets);
  previewAssetsRef.current = previewAssets;
  const requestContent = useRef<() => void>(() => {});
  const loadedRoomMaterials=useRef(new Set<string>());
  const loadedRoomMedia=useRef<string|null>(null);
  const reportRoomReady=useCallback(()=>{
    if(!onSceneReady)return;
    const current=sceneRef.current;
    if(rendered.current.generation!==current.generation||rendered.current.revision!==current.revision)return;
    if(room&&current.materials?.some(material=>!loadedRoomMaterials.current.has(material.instanceId)))return;
    if(roomMedia&&loadedRoomMedia.current!==`${current.generation}:${roomMedia.id}:${roomMedia.attempt??0}`)return;
    onSceneReady(current.generation,current.revision);
  },[onSceneReady,room,roomMedia?.id]);
  const materialLoaded=useCallback((id:string)=>{loadedRoomMaterials.current.add(id);reportRoomReady();},[reportRoomReady]);
  const mediaLoaded=useCallback(()=>{
    if(roomMedia)loadedRoomMedia.current=`${sceneRef.current.generation}:${roomMedia.id}:${roomMedia.attempt??0}`;
    reportRoomReady();
  },[roomMedia?.id,roomMedia?.attempt,reportRoomReady]);
  const recallFrame=useRef(0);
  const cancelRecall=useCallback(()=>{cancelAnimationFrame(recallFrame.current);recallFrame.current=0;},[]);
  const recall=useCallback((bounds:Viewport,animate=true)=>{
    cancelRecall();if(!api)return;
    const start=api.getAppState(), started=performance.now();
    const duration=animate && !matchMedia("(prefers-reduced-motion: reduce)").matches ? 320 : 0;
    const tick=(now:number)=>{const t=duration?Math.min(1,(now-started)/duration):1;
      api.updateScene({appState:recallCamera(start,bounds,t,previewAssets ? 24*start.width/(start.width>start.height?1093:820) : 24) as Pick<typeof start,"scrollX"|"scrollY"|"zoom">,captureUpdate:CaptureUpdateAction.NEVER});
      recallFrame.current=t<1?requestAnimationFrame(tick):0;};
    tick(started);
  },[api,cancelRecall,Boolean(previewAssets)]);
  useEffect(()=>cancelRecall,[cancelRecall]);
  sceneRef.current = scene;

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    let running = false;
    let frame = 0, motionFrame = 0, timer: ReturnType<typeof setTimeout>;
    let finishWait: (() => void) | undefined;
    const nextFrame = () => new Promise<void>(resolve => { frame = requestAnimationFrame(() => resolve()); });
    const wait = (ms: number) => new Promise<void>(resolve => { finishWait = resolve; timer = setTimeout(() => { finishWait = undefined; resolve(); }, ms); });
    const apply = async (content: Scene,contentVersion:number) => {
      if (rendered.current.revision === content.revision && rendered.current.generation === content.generation&&rendered.current.renderVersion===contentVersion) return;
      const key = ++effectSequence.current;
      const canTransition = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        && rendered.current.generation === content.generation && rendered.current.revision > 0;
      const effect: CoverEffect | null = canTransition && content.coverTransition
        ? { ...content.coverTransition, key, holding: content.coverTransition.type === "reveal" } : null;
      const started = performance.now();
      // Cover feedback may overlap fetching already-authorized safe assets.
      // Reveal must remain fully covered until those assets are ready to paint.
      if (effect?.type === "cover") setActiveCoverEffect(effect);
      const inline = new Map(content.rasters?.map(raster => [raster.id, raster.data]));
      const previewAssets = previewAssetsRef.current;
      const prepared = await Promise.all(content.assetIds.map((id) => {
        if (!assets.current.has(id)) {
          const data = inline.get(id);
          const source = previewAssets ? (previewAssets[id] ? Promise.resolve(previewAssets[id] as DataURL) : Promise.reject(new Error(t("Vorschau wird geladen.")))) : data ? Promise.resolve(`data:image/png;base64,${data}` as DataURL) : fetch(`/api/live/rooms/${participation!.roomId}/assets/${id}`, {
            headers: { Authorization: `Bearer ${participation!.token}` }, cache: "no-store",
          }).then(async (response) => {
            if (!response.ok) throw new Error(t("Material konnte nicht geladen werden."));
            const blob = await response.blob();
            return new Promise<DataURL>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as DataURL); reader.onerror = () => reject(new Error(t("Material konnte nicht geladen werden.")));
              reader.readAsDataURL(blob);
            });
          });
          const loading = source.then(async dataURL => {
            const decoded = new Image(); decoded.src = dataURL;
            await decoded.decode();
            return { file: { id: id as FileId, dataURL, mimeType: (dataURL.startsWith("data:image/webp;") ? "image/webp" : "image/png") as BinaryFileData["mimeType"], created: Date.now() }, decoded };
          }).catch((failure) => { assets.current.delete(id); throw failure; });
          assets.current.set(id, loading);
        }
        return assets.current.get(id)!;
      }));
      if (cancelled || content.generation !== sceneRef.current.generation) return;
      // A queued newer revision supersedes cosmetic wipes, never the safe asset
      // barrier. Finish one prepared frame so a slow download cannot starve paint.
      const superseded = sceneRef.current.revision > content.revision;
      const incrementalIndex = rendered.current.generation === content.generation
        ? incrementalLinearElementIndex(renderedWireElements.current, content.elements, renderedNativeElements.current)
        : null;
      const elements = incrementalIndex === null
        ? restoreElements(content.elements as unknown as ExcalidrawElement[], null, { refreshDimensions: false, repairBindings: true })
        : renderedNativeElements.current!.map((element, index) => index === incrementalIndex
          ? restoreElements([content.elements[index] as unknown as ExcalidrawElement], null, { refreshDimensions: false, repairBindings: false })[0]
          : element);
      if (effect?.type === "reveal" && !superseded) {
        setActiveCoverEffect(effect);
        await nextFrame();
      } else if (effect && !superseded) {
        await wait(Math.max(0, coverTransitionDuration - (performance.now() - started)));
      }
      if (cancelled || content.generation !== sceneRef.current.generation) return;
      // addFiles scans the CURRENT scene to start native image-cache loading.
      // Reversing these calls falls back to Excalidraw's 500ms image-refresh timer.
      cancelAnimationFrame(motionFrame);
      const origins = canTransition && !effect ? translationOrigins(api.getSceneElements(), elements) : [];
      const moving = origins.some(Boolean);
      const display = (next: ExcalidrawElement[]) => {
        const localInk=room ? api.getSceneElements().filter(element=>element.id===roomActiveInkIdRef.current
          ||roomPendingInkIdsRef.current.has(element.id)) : [];
        api.updateScene({ elements: localInk.length
          ? [...next,...localInk.filter(element=>!next.some(candidate=>candidate.id===element.id))] : next,
          appState: { viewBackgroundColor: content.background }, captureUpdate: CaptureUpdateAction.NEVER });
      };
      display(moving ? interpolateTranslations(elements, origins, 0) : elements);
      renderedWireElements.current = content.elements;
      renderedNativeElements.current = elements;
      // Stable asset identities on moves avoid needless native image cache work.
      const existingFiles = api.getFiles();
      const additions = prepared.map(asset => asset.file).filter(file => !existingFiles[file.id]);
      if (additions.length) api.addFiles(additions);
      if (moving) {
        const motionStart = performance.now();
        const animate = (now: number) => {
          if (cancelled || content.generation !== sceneRef.current.generation) return;
          const progress = Math.min(1, (now - motionStart) / 40);
          display(interpolateTranslations(elements, origins, progress));
          if (progress < 1) motionFrame = requestAnimationFrame(animate);
        };
        motionFrame = requestAnimationFrame(animate);
      }
      const firstCommit = rendered.current.revision === 0;
      rendered.current = { generation: content.generation, revision: content.revision,renderVersion:contentVersion };
      // The API callback precedes native initialData hydration. A mount-time
      // recall alone can be overwritten by that hydration's default camera.
      // Establish the initial clip only once the first safe scene is applied;
      // subsequent content updates must preserve the participant's own zoom.
      const currentClip = clipRef.current;
      if (firstCommit) {
        const state = api.getAppState();
        const target = currentClip ?? sceneRef.current.viewport;
        const padding = previewAssets ? 24*state.width/(state.width>state.height?1093:820) : 24;
        api.updateScene({ appState: boundedCamera(state, target, true, padding) as Pick<typeof state, "scrollX" | "scrollY" | "zoom">,
          captureUpdate: CaptureUpdateAction.NEVER });
      }
      if(firstCommit) { await nextFrame();if(cancelled)return;await nextFrame();if(cancelled)return; }
      setError(null); setReady(true);
      reportRoomReady();
      // Prune on content commit, not after an interruptible visual transition.
      // Rapid toggles must not retain a growing trail of decoded safe rasters.
      for (const id of assets.current.keys()) if (!content.assetIds.includes(id) && !sceneRef.current.assetIds.includes(id)) assets.current.delete(id);
      if (effect && !superseded) {
        // Let the native cache's already-decoded image load and paint before the
        // reveal wipe starts. No whole-canvas fade or source-image prepublication.
        await nextFrame(); if (cancelled) return;
        await nextFrame(); if (cancelled) return;
        if (effect.type === "reveal") {
          setActiveCoverEffect({ ...effect, holding: false });
          await wait(coverTransitionDuration); if (cancelled) return;
        }
        setActiveCoverEffect(current => current?.key === key ? null : current);
      } else if (effect) setActiveCoverEffect(null);
    };
    const pump = async () => {
      if (running || cancelled) return;
      running = true;
      try {
        while (!cancelled) {
          const content = sceneRef.current;
          const contentVersion=renderVersionRef.current;
          if (rendered.current.generation === content.generation && rendered.current.revision === content.revision&&rendered.current.renderVersion===contentVersion) break;
          try { await apply(content,contentVersion); }
          catch {
            if (cancelled) break;
            setActiveCoverEffect(null);
            // A superseded raster may have aged out of the bounded handover
            // window. Go directly to the newest complete state, not an error loop.
            if (sceneRef.current.generation !== content.generation || sceneRef.current.revision !== content.revision) continue;
            setError("Material konnte nicht geladen werden."); break;
          }
        }
      } finally { running = false; }
    };
    requestContent.current = () => {
      clearTimeout(timer); finishWait?.(); finishWait = undefined;
      void pump();
    };
    void pump();
    return () => {
      cancelled = true; cancelAnimationFrame(frame); cancelAnimationFrame(motionFrame); clearTimeout(timer);
      finishWait?.(); requestContent.current = () => {};
      setActiveCoverEffect(null);
    };
    // Camera envelopes may share this revision. They must not restart asset
    // application, cancel an animation, or leave an orphaned cover overlay.
  }, [api, participation, retry]);

  useEffect(() => { requestContent.current(); }, [scene.generation, scene.revision,renderVersion]);

  useEffect(() => {
    if (previewAssets && !clip && !roomCameraIndependent && api && rendered.current.generation === scene.generation && rendered.current.revision === scene.revision) fit(api, scene.viewport, true);
  }, [clip, api, scene.viewport, scene.generation, scene.revision, Boolean(previewAssets), roomCameraIndependent]);
  useEffect(() => {
    if (!api || !root.current) return;
    const observer = new ResizeObserver(() => requestAnimationFrame(() => {
      if (previewAssets && !clipRef.current && !roomCameraIndependent) fit(api, sceneRef.current.viewport, true);
    }));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [api, roomCameraIndependent]);

  useEffect(() => {
    const next = presentation?.mode === "clip" ? presentation.clip : null;
    if (JSON.stringify(next) === JSON.stringify(clipRef.current)) return;
    cancelRecall();
    clipRef.current = next;
    setClip(next);
    if (!api) return;
    if (next) {
      const state = api.getAppState();
      const padding = previewAssets ? 24*state.width/(state.width>state.height?1093:820) : 24;
      api.updateScene({ appState: boundedCamera(state, next, true, padding) as Pick<typeof state, "scrollX" | "scrollY" | "zoom">,
        captureUpdate: CaptureUpdateAction.NEVER });
    }
  }, [api, presentation?.mode, presentation?.clip?.id, presentation?.clip?.x, presentation?.clip?.y,
    presentation?.clip?.width, presentation?.clip?.height, cancelRecall, Boolean(previewAssets)]);

  useEffect(() => {
    if (!api || roomCameraIndependent) return;
    const target=clipRef.current ?? sceneRef.current.viewport;
    recall(target,rendered.current.revision > 0 && !previewAssets);
  }, [api, presentation?.reset, recall, previewAssets, roomCameraIndependent]);
  useEffect(() => {
    if (!api || !clip) return;
    let updating = false;
    const constrain = () => {
      if (updating) return;
      const state = api.getAppState(), next = boundedCamera(state, clip, Boolean(previewAssets), previewAssets ? 24*state.width/(state.width>state.height?1093:820) : 24);
      if (Math.abs(next.scrollX-state.scrollX) < .001 && Math.abs(next.scrollY-state.scrollY) < .001 && Math.abs(next.zoom.value-state.zoom.value) < .00001) return;
      updating = true;
      try { api.updateScene({appState: next as Pick<typeof state, "scrollX" | "scrollY" | "zoom">, captureUpdate: CaptureUpdateAction.NEVER}); } finally { updating = false; }
    };
    const unsubscribe = api.onScrollChange(constrain);
    const resize = new ResizeObserver(() => {cancelRecall();requestAnimationFrame(constrain);});
    if (root.current) resize.observe(root.current);
    constrain(); return () => { unsubscribe(); resize.disconnect(); };
  }, [api, clip]);

  useEffect(() => {
    if (!api || !clip) {setClipInset(undefined);return;}
    const update = () => {
      const state=api.getAppState(),zoom=state.zoom.value;
      const left=Math.max(0,(clip.x+state.scrollX)*zoom),top=Math.max(0,(clip.y+state.scrollY)*zoom);
      const right=Math.max(0,state.width-(clip.x+clip.width+state.scrollX)*zoom);
      const bottom=Math.max(0,state.height-(clip.y+clip.height+state.scrollY)*zoom);
      setClipInset(`inset(${top}px ${right}px ${bottom}px ${left}px)`);
    };
    const stop=api.onScrollChange(update);
    const observer=new ResizeObserver(update);if(root.current)observer.observe(root.current);
    update();return()=>{stop();observer.disconnect();};
  },[api,clip]);

  // Unrelated ink/camera projections must not re-anchor an old time sample.
  const remoteTimerKey = JSON.stringify([scene.generation, scene.serverTime, scene.elements.filter(e=>e.timer)]);
  const remoteTimers = useMemo(() => remoteTimerWidgets(scene), [remoteTimerKey]);
  const dark = /^#[0-4][0-9a-f][0-4][0-9a-f][0-4][0-9a-f]$/i.test(scene.background);
  const live = connected && hostConnected && publicationReady && ready && !error;
  return <main className={`live-view ${dark ? "is-dark" : ""}`} style={{ background: scene.background } as CSSProperties}>
    <div className={`live-view-canvas ${clip ? "is-clip" : ""} ${ready ? "is-ready" : "is-preparing"}`} ref={root} style={clipInset?{clipPath:clipInset}:undefined}
      onWheelCapture={() => cancelRecall()}
      onPointerDownCapture={() => cancelRecall()}
      onContextMenu={(event) => event.preventDefault()}
      onDropCapture={(event) => { event.preventDefault(); event.stopPropagation(); }}>
      <Excalidraw autoFocus={!previewAssets} excalidrawAPI={setApi} initialData={viewerInitial} viewModeEnabled zenModeEnabled
        langCode={uiLanguageTag()} theme="light" handleKeyboardGlobally={false}
        onLinkOpen={(_element, event) => event.preventDefault()}
        UIOptions={{ canvasActions: { clearCanvas: false, export: false, loadScene: false, saveAsImage: false, saveToActiveFile: false, toggleTheme: false, changeViewBackgroundColor: false }, tools: { image: false } }}/>
      {api && materialBaseUrl && scene.materials?.length ? <LiveInteractiveMaterialLayer materials={scene.materials} baseUrl={materialBaseUrl} api={api} participant={participation} onAction={onMaterialAction} inputReady={roomInputReady} room={room} playbackOutput={roomPlaybackOutput} onReady={room?materialLoaded:undefined}/> : null}
      {api && room && roomMedia ? <RoomMediaLayer key={`${roomMedia.id}:${roomMedia.attempt??0}`} media={roomMedia} api={api}
        output={roomPlaybackOutput} onStatus={(status,sequence)=>onRoomVideoStatus?.(roomMedia.id,status,sequence)} onReady={mediaLoaded} onError={message=>onRoomMediaError?.(roomMedia.id,message)}/> : null}
      {/* RoomView gates input on its confirmed target. A cosmetic native
          re-render of that same scene must not unmount the active gesture. */}
      {room&&roomInkOverlay}
      {api&&!room&&ready&&remoteTimers.length>0&&<TimerWidgetLayer api={api} widgets={remoteTimers} readOnly/>}
      {api&&room&&ready&&roomTimers.length>0&&<TimerWidgetLayer api={api} widgets={roomTimers} disabled={!publicationReady}
        onAction={onTimerAction} onTransform={onTimerTransform}/>}
    </div>
    {api && <HostPointerOverlay api={api} channel={hostPointer} generation={scene.generation} enabled={live} bounds={clip}/>}
    {!previewAssets && <>
    <div className={`live-view-frame ${live ? "is-live" : ""}`} aria-hidden="true"/>
    {api && activeCoverEffect && <CoverTransitionOverlay key={activeCoverEffect.key} api={api} effect={activeCoverEffect}/>}
    <ViewerLiveStatus connected={connected} hostConnected={hostConnected} pending={!ready || !publicationReady || room&&!roomInputReady} error={Boolean(error)}/>
    <ViewerFullscreenButton/>
    {presentation?.mode !== "clip" && <button className="live-return-to-host" type="button" onClick={() => recall(sceneRef.current.viewport)}><LocateFixed aria-hidden="true"/>{t("Zur Lehrkraft")}</button>}
    </>}
    {error && <div className="live-view-error" role="alert">{t(error)}<button onClick={() => setRetry((value) => value + 1)}>{t("Erneut versuchen")}</button></div>}
  </main>;
}
