import distribution from "../../distribution.json" with {type:"json"};
import { SceneChangeTracker } from "./scene-change-tracker.ts";
import { isTimerWidget, type TimerRuntime } from '../widgets/timer.ts';
import { createHostPointerChannel } from "./host-pointer-channel.ts";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { LIMITS, sanitizeElement, validId, defaultPresentation, parsePresentation, type Scene, type Presentation, type LiveClip, type CreateRoomResponse, type HostPointer, type InlineRaster, type Participant, type PublishMessage, type RoomState, type ServerMessage, type LiveMaterialAccess, type MaterialStatePatch, type InkPreviewPatch, type PublicElement } from "../../../../shared/live-canvas/protocol.ts";
import { createPublicProjector, getPublicViewport } from "./public-projection.ts";
import { planPublicProjection } from "./public-projection-plan.ts";

type Connection = CreateRoomResponse & { baseUrl: string };
export type PublicPreview = { scene: Scene; assets: {id:string;blob:Blob}[]; materialBaseUrl:string; renderVersion:number;
  roomTimers?: import('../widgets/timer').TimerWidget[];
  roomMedia?: import('./room-media').RoomMedia | null };
export type HostLiveState = {
  preview: PublicPreview | null;
  session: Connection | null; state: RoomState; connected: boolean;
  publicationReady: boolean; presentation: Presentation; supportsPresentation: boolean; supportsFreePresentation: boolean;
  busy: boolean; error: string | null; participants: Participant[]; unsupported: string[];
  materialAccess: Record<string,LiveMaterialAccess>;
};
const initialState: HostLiveState = { preview: null, presentation: { ...defaultPresentation }, supportsPresentation: false, supportsFreePresentation: false, session: null, state: "waiting", connected: false, publicationReady: false, busy: false, error: null, participants: [], unsupported: [], materialAccess:{} };
const resumeKey = "tafelraum.live-canvas.host.v1";
type SavedHost = { version: 1; session: Connection; allowedSourceId: string; generation: number; presentation?: Presentation; timerMaterialId?: string };

export function requiresLiveSourceChangeConfirmation(
  state: Pick<HostLiveState, "session" | "state" | "connected" | "participants">,
) {
  if (!state.session) return false;
  if (state.state === "live") return true;
  if (!state.connected) return true;
  return state.participants.length > 0;
}

function connection(value: unknown): Connection {
  const candidate = value as Partial<Connection> | null;
  if (!candidate || !validId(candidate.roomId) || !validId(candidate.hostToken)
    || !validId(candidate.inviteId) || typeof candidate.baseUrl !== "string") throw new Error("Ungültige Live-Sitzung.");
  const url = new URL(candidate.baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash
    || url.pathname !== "/") throw new Error("Ungültige Live-Adresse.");
  return { roomId: candidate.roomId, hostToken: candidate.hostToken, inviteId: candidate.inviteId, baseUrl: url.origin };
}

function readResume(durable = false): SavedHost | null {
  try {
    const raw = (durable ? localStorage : sessionStorage).getItem(resumeKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedHost;
    if (saved.version !== 1 || typeof saved.allowedSourceId !== "string" || !saved.allowedSourceId
      || !Number.isSafeInteger(saved.generation) || saved.generation < 1) throw new Error("Ungültiger Live-Stand.");
    if(saved.timerMaterialId!==undefined&&!validId(saved.timerMaterialId))throw new Error("Ungültiges Timerziel.");
    return { ...(saved.timerMaterialId?{timerMaterialId:saved.timerMaterialId}:{}), version: 1, session: connection(saved.session), allowedSourceId: saved.allowedSourceId, generation: saved.generation, presentation: saved.presentation ? parsePresentation(saved.presentation) : { ...defaultPresentation } };
  } catch {
    try { (durable ? localStorage : sessionStorage).removeItem(resumeKey); } catch { /* Storage may be disabled. */ }
    return null;
  }
}

function clearResume(session: Connection | null, preserveRecovery = false) {
  try { sessionStorage.removeItem(resumeKey); } catch { /* Session storage may be disabled. */ }
  if (!preserveRecovery && session) {
    try {
      const saved = readResume(true);
      // An old tab must not delete credentials belonging to a newer session.
      if (saved?.session.hostToken === session.hostToken && saved.session.roomId === session.roomId
        && saved.session.baseUrl === session.baseUrl) localStorage.removeItem(resumeKey);
    } catch { /* Local storage may be disabled. */ }
  }
}

export class LiveHost {
  readonly previewPointer = createHostPointerChannel();
  state: HostLiveState = initialState;
  private listeners = new Set<() => void>();
  private socket: WebSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inspectionTimer: ReturnType<typeof setTimeout> | undefined;
  private lastInspectionAt: number | null = null;
  private cameraTimer: ReturnType<typeof setTimeout> | undefined;
  private pointerTimer: ReturnType<typeof setTimeout> | undefined;
  private inkTimer: ReturnType<typeof setTimeout> | undefined;
  private materialPatchTimer: ReturnType<typeof setTimeout> | undefined;
  private hostPointer: HostPointer | null = null;
  private supportsHostPointer = false;
  private supportsLaserPointer = false;
  private supportsInlineRasters = false;
  private supportsClipMotion = false;
  private supportsViewportClips = false;
  private supportsInteractiveMaterials = false;
  private supportsPatches = false;
  private lastPointerAt = -Infinity;
  private api: ExcalidrawImperativeAPI | null = null;
  private sourceId = "";
  private allowedSourceId = "";
  private unsubscribes: (() => void)[] = [];
  private timerRuntime: TimerRuntime | null = null;
  private stopTimers: (()=>void) | null = null;
  private timerMaterialId: string | null = null;
  private supportsTimerWidgets = false;
  attachTimers(runtime: TimerRuntime | null) {
    this.stopTimers?.(); this.timerRuntime = runtime;
    this.stopTimers = runtime?.subscribe(()=>{this.dirty=true;this.schedule(0);}) ?? null;
    this.dirty=true;this.schedule(0);
  }
  showTimerClip(elementId:string, cueId:string) {
    const element=this.api?.getSceneElements().find(e=>e.id===elementId&&isTimerWidget(e));
    if(!element)return;
    const c=Math.abs(Math.cos(element.angle)),s=Math.abs(Math.sin(element.angle));
    const width=element.width*c+element.height*s,height=element.width*s+element.height*c;
    const clip={id:cueId,x:element.x+(element.width-width)/2,y:element.y+(element.height-height)/2,width,height};
    const before=this.state.presentation.clip;
    if(this.timerMaterialId===elementId&&before&&JSON.stringify(before)===JSON.stringify(clip))return;
    this.showClip(clip,elementId);
  }
  private projector = this.newProjector();
  private generation = 1;
  private revision = 0;
  private uploaded = new Set<string>();
  private uploadedBundles = new Set<string>();
  private publishing = false;
  private dirty = false;
  private starting = false;
  private stopped = true;
  private resumeLoaded = false;
  private recovering = false;
  private ending = false;
  private endTimer: ReturnType<typeof setTimeout> | undefined;
  private epoch = 0;
  private serverGeneration = 0;
  private sourceConflict = false;
  private uploadAbort: AbortController | null = null;
  private createAbort: AbortController | null = null;
  private createPromise: Promise<Connection | null> | null = null;
  private startRequested = false;
  private lastFiles = new Map<string, { version: number | undefined; dataURL: string }>();
  private sceneTracker = new SceneChangeTracker();
  private lastCameraAt = 0;
  private recallPending = false;
  private lastMessageAt = 0;
  private acknowledged: PublishMessage | null = null;
  private lastSent: PublishMessage | null = null;
  private previewEnabled = false;
  private previewAssets: {id:string;blob:Blob}[] = [];
  private pending = new Map<number, { assets: {id:string;blob:Blob}[]; snapshot: PublishMessage; timeout: ReturnType<typeof setTimeout> }>();
  private inkPreviewId: string | null = null;
  private inkWire: { localId:string; id:string; revision:number; element:PublicElement } | null = null;
  private pendingInkEnd: { id:string; baseRevision:number; commitRevision?:number } | null = null;
  private lastInkAt = -Infinity;
  private pendingMaterialPatches = new Map<string,{instanceId:string;stateRevision:number;state:import("../../../../shared/live-canvas/protocol.ts").JsonValue}>();
  private previewRenderVersion = 0;

  private newProjector() {
    return createPublicProjector(change => this.materialChanged(change), elementId => this.state.materialAccess[elementId] ?? {mode:"locked",participantIds:[]},'remote',id=>this.timerRuntime?.get(id));
  }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private update(patch: Partial<HostLiveState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach((listener) => listener()); }

  setMaterialAccess(elementId:string, mode:'locked'|'all') {
    const next = {...this.state.materialAccess,[elementId]:{mode,participantIds:[]} as LiveMaterialAccess};
    this.update({materialAccess:next}); this.dirty = true; this.schedule(0);
  }

  enablePreview(enabled: boolean) { this.previewEnabled = enabled; this.refreshPreview(); }
  private refreshPreview() {
    const committed = this.acknowledged?.presentation;
    const presentation = committed && JSON.stringify(committed.clip) !== JSON.stringify(this.state.presentation.clip)
      ? committed : this.state.presentation;
    const preview = this.previewEnabled && this.acknowledged && this.state.session && this.state.state === "live" && this.state.publicationReady
      ? {scene:this.previewScene(this.acknowledged,presentation), assets:this.previewAssets,materialBaseUrl:`${this.state.session.baseUrl}/api/live/rooms/${this.state.session.roomId}/materials`,renderVersion:this.previewRenderVersion} : null;
    if (preview || this.state.preview) this.update({preview});
  }

  /** Effect setup, deliberately separate from construction and reversible dispose.
   * React StrictMode can setup/cleanup/setup the same instance without ending it. */
  activate() {
    if (!distribution.remoteCanvas) return;
    if (!this.stopped) return;
    this.stopped = false;
    if (!this.resumeLoaded) {
      this.resumeLoaded = true;
      const saved = readResume();
      if (saved) {
        this.timerMaterialId = saved.timerMaterialId ?? null;
        this.allowedSourceId = saved.allowedSourceId;
        this.generation = saved.generation;
        this.update({ session: saved.session, publicationReady: false, presentation: saved.presentation ?? { ...defaultPresentation } });
      }
    }
    if (this.state.session) this.connect();
    this.changed();
  }

  private saveResume() {
    if (!this.state.session || !this.allowedSourceId) return;
    const saved = JSON.stringify({ version: 1, session: this.state.session,
      allowedSourceId: this.allowedSourceId, generation: this.generation, presentation: this.state.presentation,
      ...(this.timerMaterialId?{timerMaterialId:this.timerMaterialId}:{}) } satisfies SavedHost);
    try {
      // Credentials and the local approval boundary only; never scene/assets or archive writes.
      sessionStorage.setItem(resumeKey, saved);
    } catch { /* Publishing still works when tab-scoped storage is unavailable. */ }
    try { localStorage.setItem(resumeKey, saved); } catch { /* Reload can still use the tab record. */ }
  }

  private markUnavailable() {
    this.update({ publicationReady: false });
    if (this.state.connected && !this.send({ type: "availability", available: false })) this.socket?.close();
  }

  /** The editor's native stroke remains the only geometry source. While it is
   * growing, exact public point ranges bypass whole-scene projection. */
  setInkPreview = (elementId: string | null) => {
    if (this.inkPreviewId === elementId) return;
    const previousId = this.inkPreviewId;
    if (!this.api || this.stopped || !this.state.session) {
      this.inkPreviewId = elementId;
      return;
    }
    clearTimeout(this.inspectionTimer); this.inspectionTimer = undefined;
    clearTimeout(this.inkTimer); this.inkTimer = undefined;
    this.lastInspectionAt = null;
    if (elementId) {
      this.inkPreviewId = elementId;
      if (this.inkWire && this.inkWire.localId !== elementId) this.closeInkPreview("cancel");
      this.scheduleInk(0);
      return;
    }
    // Keep the old id until the last native pointer-up geometry was sent.
    // The canonical scene commit then replaces this preview atomically.
    this.flushInkPreview();
    this.inkPreviewId = null;
    const committed = previousId && this.api.getSceneElements().some(element => element.id === previousId && !element.isDeleted);
    if (this.inkWire) {
      if (committed) this.pendingInkEnd = {id:this.inkWire.id,baseRevision:this.inkWire.revision};
      else this.closeInkPreview("cancel");
    }
    // The canonical commit/cancel is still reconciled through one complete
    // public projection and remains the snapshot/reconnect truth.
    this.inspectionTimer = setTimeout(() => {
      this.inspectionTimer = undefined;
      this.lastInspectionAt = Date.now();
      this.inspectChanged();
    }, 0);
  };

  private scheduleInk(delay?:number) {
    if (!this.inkPreviewId || this.inkTimer !== undefined || !this.supportsPatches || this.state.state !== "live"
      || !this.state.publicationReady || !this.state.connected) return;
    const wait = delay ?? Math.max(0,34-(performance.now()-this.lastInkAt));
    this.inkTimer=setTimeout(()=>{this.inkTimer=undefined;this.flushInkPreview();},wait);
  }

  private flushInkPreview() {
    if (!this.api || !this.inkPreviewId || !this.supportsPatches || (this.socket?.bufferedAmount ?? 0) >= 64*1024) return;
    const source=this.api.getSceneElements().find(element=>element.id===this.inkPreviewId&&!element.isDeleted);
    if (!source) return;
    let element:PublicElement;
    try { element=this.projector.projectInk(source); } catch { return; }
    const previous=this.inkWire?.localId===source.id?this.inkWire:null;
    let pointStart=0;
    let beforeEnd=0;
    let afterEnd=element.points?.length??0;
    if (previous && previous.element.type===element.type) {
      const before=previous.element.points??[],after=element.points??[];
      const same=(beforeIndex:number,afterIndex:number)=>before[beforeIndex][0]===after[afterIndex][0]
        &&before[beforeIndex][1]===after[afterIndex][1]
        &&previous.element.pressures?.[beforeIndex]===element.pressures?.[afterIndex];
      while(pointStart<before.length&&pointStart<after.length&&same(pointStart,pointStart))pointStart++;
      beforeEnd=before.length;afterEnd=after.length;
      while(beforeEnd>pointStart&&afterEnd>pointStart&&same(beforeEnd-1,afterEnd-1)){beforeEnd--;afterEnd--;}
    }
    const revision=(previous?.revision??0)+1;
    const replacement:PublicElement={...element,points:(element.points??[]).slice(pointStart,afterEnd),
      ...(element.pressures?{pressures:element.pressures.slice(pointStart,afterEnd)}:{})};
    const patch:InkPreviewPatch={type:"patch",channel:"ink",generation:this.generation,id:element.id,
      baseRevision:previous?.revision??0,revision,operation:"upsert",pointStart,
      pointDeleteCount:previous?beforeEnd-pointStart:0,element:replacement};
    if(!this.send(patch))return;
    this.inkWire={localId:source.id,id:element.id,revision,element};
    this.lastInkAt=performance.now();this.previewRenderVersion++;this.refreshPreview();
  }

  private closeInkPreview(operation:"end"|"cancel") {
    const wire=this.inkWire;if(!wire)return;
    const patch:InkPreviewPatch={type:"patch",channel:"ink",generation:this.generation,id:wire.id,
      baseRevision:wire.revision,revision:wire.revision+1,operation};
    this.send(patch);this.inkWire=null;this.pendingInkEnd=null;this.previewRenderVersion++;this.refreshPreview();
  }

  private previewScene(scene:PublishMessage,presentation:Presentation):Scene {
    const preview = this.inkWire?.element;
    if (!preview) return {...scene,presentation};
    const found = scene.elements.some(element => element.id === preview.id);
    return {...scene,presentation,elements:found ? scene.elements.map(element => element.id === preview.id ? preview : element) : [...scene.elements,preview]};
  }

  private materialChanged(change:{instanceId:string;stateRevision:number;state:import("../../../../shared/live-canvas/protocol.ts").JsonValue}) {
    if (!this.supportsPatches || !this.state.connected || this.state.state !== "live" || !this.state.publicationReady) {
      this.dirty = true; this.schedule(0); return;
    }
    this.pendingMaterialPatches.set(change.instanceId,change);
    if (this.materialPatchTimer === undefined) this.materialPatchTimer = setTimeout(() => {
      this.materialPatchTimer = undefined; this.flushMaterialPatches();
    },33);
  }

  private flushMaterialPatches() {
    for (const [instanceId,change] of this.pendingMaterialPatches) {
      const source = this.lastSent ?? this.acknowledged;
      const material = source?.materials?.find(candidate => candidate.instanceId === instanceId);
      if (!source || source.generation !== this.generation || !material || change.stateRevision <= material.stateRevision) {
        this.dirty = true; this.schedule(0); continue;
      }
      const patch:MaterialStatePatch = {type:"patch",channel:"material",generation:this.generation,id:instanceId,
        baseRevision:material.stateRevision,revision:change.stateRevision,state:change.state};
      if (!this.send(patch)) { this.dirty = true; this.schedule(0); continue; }
      const updateSnapshot = (snapshot:PublishMessage|null) => snapshot?.generation === this.generation ? {...snapshot,
        materials:snapshot.materials?.map(candidate => candidate.instanceId === instanceId
          ? {...candidate,stateRevision:change.stateRevision,state:change.state} : candidate)} : snapshot;
      this.lastSent=updateSnapshot(this.lastSent);this.acknowledged=updateSnapshot(this.acknowledged);
      this.refreshPreview();
    }
    this.pendingMaterialPatches.clear();
  }

  private invalidatePublication() {
    this.projector.stop?.();
    this.previewPointer.set(null);
    this.previewAssets = []; if(this.state.preview) this.update({preview:null});
    clearTimeout(this.pointerTimer); this.pointerTimer = undefined; this.hostPointer = null;
    clearTimeout(this.inkTimer); this.inkTimer=undefined;this.inkWire=null;this.pendingInkEnd=null;
    clearTimeout(this.materialPatchTimer);this.materialPatchTimer=undefined;this.pendingMaterialPatches.clear();
    this.epoch++;
    clearTimeout(this.timer); this.timer = undefined;
    clearTimeout(this.inspectionTimer); this.inspectionTimer = undefined;
    this.lastInspectionAt = null;
    clearTimeout(this.cameraTimer); this.cameraTimer = undefined;
    this.recallPending = false;
    this.uploadAbort?.abort(); this.uploadAbort = null;
    for (const entry of this.pending.values()) clearTimeout(entry.timeout);
    this.pending.clear(); this.lastSent = null;
    this.acknowledged = null;
    this.publishing = false;
    this.uploaded.clear();
    this.uploadedBundles.clear();
  }

  attach(api: ExcalidrawImperativeAPI | null, lessonId: string) {
    if (api !== this.api || lessonId !== this.sourceId) {
      this.markUnavailable();
      this.invalidatePublication();
    }
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
    if(this.sourceId!==lessonId)this.timerMaterialId=null;
    this.api = api;
    this.sourceId = lessonId;
    this.inkPreviewId = null;
    this.sceneTracker = new SceneChangeTracker();
    this.lastFiles.clear();
    if (!this.state.session) this.allowedSourceId = lessonId;
    if (api) {
      this.unsubscribes = [api.onChange(() => this.changed()), api.onScrollChange(() => this.camera())];
      this.changed();
    }
  }

  private changed() {
    // The local editor pays no scene/file inspection cost until a room exists.
    if (!this.api || this.stopped || !this.state.session) return;
    this.camera();
    if (this.inkPreviewId && this.supportsPatches && this.state.state === "live" && this.state.publicationReady) {
      this.scheduleInk();
      return;
    }
    if (this.inspectionTimer) return;
    const interval = 33;
    const delay = this.lastInspectionAt === null ? interval : Math.max(0, Math.min(interval, interval - (Date.now() - this.lastInspectionAt)));
    this.inspectionTimer = setTimeout(() => {
      this.inspectionTimer = undefined;
      this.lastInspectionAt = Date.now();
      this.inspectChanged();
    }, delay);
  }

  private inspectChanged() {
    if (!this.api || this.stopped || !this.state.session) return;
    if (this.sourceId !== this.allowedSourceId || this.sourceConflict) {
      this.markUnavailable();
      this.update({ busy: false, error: "Diese Stunde ist nicht für die laufende Live-Sitzung freigegeben. Öffne die freigegebene Stunde oder bestätige einen Stundenwechsel." });
      return;
    }
    const elements = this.api.getSceneElements();
    let unsupported: string[];
    try { unsupported = planPublicProjection(elements).unsupported; } catch (error) {
      this.markUnavailable();
      this.invalidatePublication();
      this.update({ busy: false, error: error instanceof Error ? error.message : "Die Live-Projektion ist nicht verfügbar." });
      return;
    }
    if (unsupported.join("\n") !== this.state.unsupported.join("\n")) this.update({ unsupported });
    const files = this.api.getFiles();
    const fileEntries = Object.entries(files);
    const filesChanged = this.lastFiles.size !== fileEntries.length
      || fileEntries.some(([id, file]) => {
        const previous = this.lastFiles.get(id);
        return !previous || previous.version !== file.version || previous.dataURL !== file.dataURL;
      });
    const sceneChanged = this.sceneTracker.changed(elements, this.api.getAppState().viewBackgroundColor);
    if (sceneChanged || filesChanged) {
      if(this.timerMaterialId&&this.state.presentation.clip){
        if(elements.some(e=>e.id===this.timerMaterialId&&isTimerWidget(e)))this.showTimerClip(this.timerMaterialId,this.state.presentation.clip.id);
        else this.setFree();
      }
      this.lastFiles = new Map(fileEntries.map(([id, file]) => [id, { version: file.version, dataURL: file.dataURL }]));
      this.dirty = true;
      this.schedule(0);
    }
  }

  showClip(clip: LiveClip, timerMaterialId: string | null = null) {
    if(this.timerMaterialId!==timerMaterialId){this.timerMaterialId=timerMaterialId;this.dirty=true;this.schedule(0);}
    clip = parsePresentation({...this.state.presentation,mode:"clip",clip}).clip!;
    if (this.supportsClipMotion && this.state.state === "live" && this.state.presentation.clip?.id === clip.id
      && JSON.stringify(this.acknowledged?.presentation?.clip ?? this.state.presentation.clip) !== JSON.stringify(clip)) {
      this.moveClip(clip, true); return;
    }
    this.setPresentation({ mode: "clip", clip }, true);
  }
  moveClip(clip: LiveClip, recall = false) {
    const before = this.state.presentation;
    if (before.mode !== "clip" || before.clip?.id !== clip.id) return;
    if (!recall && ["x", "y", "width", "height"].every(key => before.clip![key as keyof LiveClip] === clip[key as keyof LiveClip])) return;
    if (this.state.session && !this.supportsViewportClips) {
      this.update({ error: "Der Live-Dienst muss für flüssige Clips aktualisiert werden." }); return;
    }
    if (this.state.state !== "live") { this.setPresentation({mode:"clip",clip}, true); return; }
    const presentation = parsePresentation({...before,clip,revision:before.revision+1,reset:before.reset+Number(recall)});
    this.update({presentation,error:null});
    this.saveResume(); this.sendPresentation();
    if (this.acknowledged) {
      this.acknowledged = {...this.acknowledged,presentation,viewport:clip};
      if (this.lastSent?.generation === this.acknowledged.generation) this.lastSent = {...this.lastSent,presentation,viewport:clip};
      this.refreshPreview();
    }
  }
  setFree() { if(this.timerMaterialId){this.timerMaterialId=null;this.dirty=true;this.schedule(0);} this.setPresentation({ mode: "free", clip: null }); }
  enableClips() { this.setPresentation({ mode: "clip", clip: null }); }
  recallAll() {
    if (this.state.presentation.mode !== "free" || this.state.state !== "live") return;
    this.recallPending = true;
    this.camera();
  }
  private sendPresentation() {
    if (this.state.connected && this.state.supportsPresentation) this.send({ type: "presentation", generation: this.generation, presentation: this.state.presentation });
  }
  private setPresentation(patch: Pick<Presentation, "mode" | "clip">, recall = false) {
    if (this.state.session && (!this.state.supportsPresentation || !this.state.supportsFreePresentation)) {
      this.update({ error: "Der Live-Dienst muss für Frei und Clip aktualisiert werden." }); return;
    }
    const before = this.state.presentation;
    if (before.mode !== patch.mode) this.recallPending = false;
    const presentation = parsePresentation({ ...patch, revision: before.revision + 1, reset: before.reset + Number(recall) });
    const boundary = before.mode !== presentation.mode || JSON.stringify(before.clip) !== JSON.stringify(presentation.clip);
    // With viewport clips the public scene is identical in both modes. A mode,
    // clip or geometry change therefore moves only the presentation camera.
    // A clip without a selected frame remains a real blank publication boundary.
    if (this.supportsViewportClips && (presentation.mode === "free" || presentation.clip)) {
      this.update({ presentation, error: null });
      this.saveResume(); this.sendPresentation();
      if (this.acknowledged) {
        const viewport = presentation.mode === "clip" ? presentation.clip!
          : this.api ? getPublicViewport(this.api) : this.acknowledged.viewport;
        this.acknowledged = {...this.acknowledged,presentation,viewport};
        if (this.lastSent?.generation === this.acknowledged.generation) this.lastSent = {...this.lastSent,presentation,viewport};
        this.refreshPreview();
      } else if (this.state.state === "live") {
        // A deliberately blank clip state (for example after deleting the live
        // frame) has no reusable scene. Rebuild once when a valid view returns.
        this.dirty = true; this.update({busy:true}); this.schedule(0);
      }
      if (presentation.mode === "free") this.camera();
      return;
    }
    if (boundary) {
      this.markUnavailable(); this.invalidatePublication();
      this.generation = Math.max(this.generation, this.serverGeneration) + 1;
      this.revision = 0; this.projector = this.newProjector(); this.sceneTracker = new SceneChangeTracker(); this.dirty = true;
    }
    this.update({ presentation, error: null, ...(boundary ? { busy: Boolean(this.state.session && this.state.state === "live" && (presentation.mode === "free" || presentation.clip)) } : {}) });
    this.saveResume(); this.sendPresentation(); this.refreshPreview();
    if (boundary) this.schedule(0);
  }

  prepareSource(lessonId: string) {
    // Must precede changing the approval boundary, including while an old ACK/export is pending.
    this.markUnavailable();
    this.invalidatePublication();
    this.allowedSourceId = lessonId;
    this.generation = Math.max(this.generation, this.serverGeneration) + 1;
    this.sourceConflict = false;
    this.starting = false; this.startRequested = false;
    this.update({ presentation: { ...this.state.presentation, clip: null, revision: this.state.presentation.revision + 1, reset: this.state.presentation.reset + 1 } });
    this.sendPresentation();
    this.revision = 0;
    this.acknowledged = null;
    this.projector.stop?.(); this.projector = this.newProjector();
    this.sceneTracker = new SceneChangeTracker();
    this.dirty = true;
    this.saveResume();
    if (this.state.session && this.state.state === "live") this.update({ busy: true, error: null });
    this.schedule();
  }

  create(): Promise<Connection | null> {
    if (this.stopped) return Promise.resolve(null);
    if (this.state.session) return Promise.resolve(this.state.session);
    if (this.createPromise) return this.createPromise;
    this.createPromise = this.createSession().finally(() => { this.createPromise = null; });
    return this.createPromise;
  }

  async prepareInvitation() {
    const session = await this.create();
    return session ? `${session.baseUrl}/join/${session.inviteId}` : null;
  }

  private async createSession(): Promise<Connection | null> {
    if (!distribution.remoteCanvas) return null;
    // A new window only reclaims the shared browser session on an explicit Live
    // Canvas action. Merely opening the panel must not displace its host.
    const saved = readResume(true);
    if (saved) {
      this.allowedSourceId = saved.allowedSourceId;
      this.generation = saved.generation;
      this.recovering = true;
      this.timerMaterialId=saved.timerMaterialId??null;
      this.update({ session: saved.session, presentation: saved.presentation ?? { ...defaultPresentation },
        publicationReady: false, error: null });
      this.connect(); this.changed();
      return saved.session;
    }
    const request = new AbortController(); this.createAbort = request;
    this.update({ busy: true, error: null });
    try {
      const response = await fetch("/api/live/rooms", { method: "POST", headers: { "X-Live-Canvas": "create" }, signal: request.signal });
      const body = await response.json();
      if (request.signal.aborted || this.stopped) return null;
      if (!response.ok) throw new Error(body.error ?? "Live Canvas konnte nicht geöffnet werden.");
      this.generation = 1; this.revision = 0; this.acknowledged = null;
      this.serverGeneration = 0; this.sourceConflict = false;
      this.allowedSourceId = this.sourceId;
      this.uploaded.clear(); this.uploadedBundles.clear(); this.projector.stop?.(); this.projector = this.newProjector();
      const session = connection(body);
      this.update({ session, state: "waiting", publicationReady: false, participants: [], busy: false });
      this.saveResume();
      this.changed();
      this.connect();
      return session;
    } catch (error) {
      if (!request.signal.aborted && !this.stopped) this.update({ busy: false, error: error instanceof Error ? error.message : "Verbindung fehlgeschlagen." });
      return null;
    } finally { if (this.createAbort === request) this.createAbort = null; }
  }

  private connect() {
    const session = this.state.session;
    if (!session || this.stopped || this.socket) return;
    clearTimeout(this.retry); this.retry = undefined;
    const url = new URL("/api/live/socket", session.baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      if (socket !== this.socket || this.stopped) return;
      this.lastMessageAt = Date.now();
      socket.send(JSON.stringify({ type: "auth", roomId: session.roomId, token: session.hostToken, protocolVersion: 1, supportsPresentation: true, supportsViewportClips: true, supportsInteractiveMaterials: true, supportsPatches:true, supportsTimerWidgets:true, supportsFreePresentation: true }));
      clearInterval(this.heartbeat);
      this.heartbeat = setInterval(() => {
        if (socket !== this.socket || this.stopped) return;
        if (Date.now() - this.lastMessageAt > 45000) socket.close();
        else this.send({ type: "ping" });
      }, 15000);
    };
    socket.onmessage = (event) => {
      if (socket !== this.socket || this.stopped) return;
      this.lastMessageAt = Date.now();
      let message: ServerMessage;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === "room") {
        this.recovering = false;
        this.update({ supportsPresentation: message.supportsPresentation === true, supportsFreePresentation: message.supportsFreePresentation === true });
        if (!this.state.connected && message.presentation && message.presentation.revision > this.state.presentation.revision) {
          this.update({ presentation: message.presentation });
        }
        this.supportsHostPointer = message.supportsHostPointer === true;
        this.supportsLaserPointer = message.supportsLaserPointer === true;
        this.supportsInlineRasters = message.supportsInlineRasters === true;
        this.supportsClipMotion = message.supportsClipMotion === true;
        this.supportsViewportClips = message.supportsViewportClips === true;
        this.supportsInteractiveMaterials = message.supportsInteractiveMaterials === true;
        this.supportsPatches = message.supportsPatches === true;
        this.supportsTimerWidgets = message.supportsTimerWidgets === true;
        if (message.state === "ended") { this.closeSession(); return; }
        if (this.ending) { this.send({ type: "end" }); return; }
        this.serverGeneration = Math.max(this.serverGeneration, (message.presentationGeneration ?? message.generation));
        if (message.generation > this.generation) {
          // A newer server generation has no trustworthy lesson mapping in this tab.
          this.sourceConflict = true;
          this.invalidatePublication();
        }
        this.revision = Math.max(this.revision, message.generation === this.generation ? message.revision : 0);
        const wasConnected = this.state.connected;
        this.update({ connected: true, state: message.state, participants: message.participants,
          publicationReady: message.publicationReady && Boolean(this.acknowledged) });
        if (!wasConnected) {
          this.generation = Math.max(this.generation, message.presentationGeneration ?? 0);
          // A disconnected drag may be newer than the last server commit.
          // Resume that desired boundary with the normal recovery barrier.
          if (message.presentation && JSON.stringify(message.presentation.clip) !== JSON.stringify(this.state.presentation.clip)
            && message.presentationGeneration === this.generation) {
            this.invalidatePublication(); this.generation++; this.revision = 0; this.projector = this.newProjector();
          }
          this.acknowledged = null; this.dirty = true; this.markUnavailable(); this.sendPresentation();
        }
        if (!this.sourceConflict) this.saveResume();
        this.refreshPreview();
        if (this.sourceConflict || this.sourceId !== this.allowedSourceId) this.changed();
        else if (this.startRequested) this.startWhenReady();
        else if (!wasConnected) this.schedule();
      } else if (message.type === "published") {
        const entry = this.pending.get(message.revision);
        if (entry && message.generation === this.generation && entry.snapshot.generation === message.generation) {
          clearTimeout(entry.timeout); this.pending.delete(message.revision);
          if (!this.acknowledged || message.revision > this.acknowledged.revision) { this.acknowledged = entry.snapshot; this.previewAssets = entry.assets; }
          if (this.pendingInkEnd?.commitRevision !== undefined && message.revision >= this.pendingInkEnd.commitRevision) this.closeInkPreview("end");
          if (this.starting) { this.send({ type: "start" }); this.starting = false; }
          this.update({ busy: false, publicationReady: true, error: null }); this.refreshPreview();
          this.saveResume();
          this.camera();
          if (this.dirty) this.schedule(0);
        }
      } else if (message.type === "materialAction") {
        if (message.generation === this.generation) this.projector.applyMaterialState(message.instanceId,message.state);
      } else if (message.type === "error") {
        const retryExpiredRecovery = this.recovering && ["unauthorized", "not_found"].includes(message.code);
        const resumeRequestedStart = retryExpiredRecovery && this.startRequested;
        this.invalidatePublication();
        this.markUnavailable();
        this.update({ error: message.code === "not_found" ? "Live Canvas wurde beendet." : "Die Live-Übertragung wurde unterbrochen.", busy: false });
        if (["unauthorized", "not_found", "forbidden", "version_mismatch"].includes(message.code)) this.closeSession();
        // The old publication may have expired while the browser was closed.
        // Its rejected credential is removed before making one fresh request.
        if (retryExpiredRecovery) {
          this.startRequested = resumeRequestedStart;
          void this.create().then((session) => {
            if (!session) this.startRequested = false;
            else this.startWhenReady();
          });
        }
      } else if (message.type === "ended") {
        this.ending = false; clearTimeout(this.endTimer); this.endTimer = undefined;
        this.closeSession();
      }
    };
    socket.onclose = (event) => {
      if (socket !== this.socket) return;
      if (event.code === 4001) {
        // Duplicated tabs may inherit sessionStorage. Yield to the replacement
        // publisher instead of reconnecting and fencing it in an endless loop.
        // This clears only our tab's resume; it never sends a room-end command.
        this.closeSession(true);
        this.update({ error: "Diese Live-Sitzung wird in einem anderen Tab fortgesetzt." });
        return;
      }
      this.socket = null;
      clearInterval(this.heartbeat); this.heartbeat = undefined;
      this.invalidatePublication();
      this.update({ connected: false, publicationReady: false });
      if (!this.stopped && this.state.session) this.retry = setTimeout(() => this.connect(), this.ending ? 100 : 1800);
    };
  }

  private send(message: unknown) {
    if (this.stopped || this.socket?.readyState !== WebSocket.OPEN) return false;
    if (this.socket.bufferedAmount > 4 * 1024 * 1024) return false;
    try { this.socket.send(JSON.stringify(message)); return true; } catch { return false; }
  }

  /** Latest-only 30 Hz presence. Independent of raster export/upload/scene ACK.
   * A low-rate refresh keeps stationary pointers alive and reaches late joiners. */
  pointer(pointer: HostPointer | null) {
    if (this.stopped || !this.state.session) return;
    const clip = this.state.presentation.mode === "clip" ? this.state.presentation.clip : null;
    this.hostPointer = pointer?.tool !== "laser" || (this.state.presentation.mode === "clip" && (!clip || pointer.x < clip.x || pointer.y < clip.y || pointer.x > clip.x+clip.width || pointer.y > clip.y+clip.height)) ? null : pointer;
    clearTimeout(this.pointerTimer); this.pointerTimer = undefined;
    this.pointerTimer = setTimeout(() => this.sendPointer(), Math.max(0, 34 - (performance.now() - this.lastPointerAt)));
  }

  private sendPointer() {
    this.pointerTimer = undefined;
    if ((this.hostPointer && !this.supportsLaserPointer) || this.stopped || !this.supportsHostPointer || !this.state.connected || this.state.state !== "live"
      || !this.state.publicationReady || this.sourceConflict || this.sourceId !== this.allowedSourceId
      || this.acknowledged?.generation !== this.generation) return;
    if (this.socket && this.socket.bufferedAmount < 64 * 1024) {
      const message = { type: "pointer" as const, generation: this.generation, pointer: this.hostPointer };
      if(this.send(message)) this.previewPointer.set(message);
      this.lastPointerAt = performance.now();
    }
    // Retry a dropped hide as well; don't leave a stale pressed pointer behind.
    if (this.hostPointer || (this.socket?.bufferedAmount ?? 0) >= 64 * 1024) {
      this.pointerTimer = setTimeout(() => this.sendPointer(), 1000);
    }
  }

  start() {
    if (this.state.presentation.mode === "clip" && !this.state.presentation.clip) return;
    if (!this.api || this.sourceConflict) return;
    this.startRequested = true;
    if (!this.state.session) {
      void this.create().then((session) => {
        if (!session) this.startRequested = false;
        else this.startWhenReady();
      });
      return;
    }
    this.startWhenReady();
  }

  private startWhenReady() {
    if (!this.startRequested || !this.api || !this.state.connected || this.state.busy
      || this.sourceConflict || this.sourceId !== this.allowedSourceId) return;
    this.startRequested = false;
    this.starting = true; this.dirty = true;
    this.update({ busy: true, error: null });
    this.schedule();
  }

  private schedule(delay = 50) {
    if (this.state.connected && (!this.state.supportsPresentation || !this.state.supportsFreePresentation)) {
      this.update({ busy: false, error: "Der Live-Dienst muss für diese Ansicht aktualisiert werden." }); return;
    }
    if (this.state.connected && this.state.presentation.mode === "clip" && !this.supportsViewportClips) {
      this.update({ busy: false, error: "Der Live-Dienst muss für flüssige Clips aktualisiert werden." }); return;
    }
    if (this.state.presentation.mode === "clip" && !this.state.presentation.clip) { this.update({ busy: false }); return; }
    if (this.stopped || this.timer || this.publishing || !this.api || this.sourceConflict
      || this.pending.size >= 4 || (this.starting && this.pending.size > 0)
      || this.sourceId !== this.allowedSourceId || !this.state.connected || (!this.starting && this.state.state !== "live")) return;
    this.timer = setTimeout(() => { this.timer = undefined; void this.publish(); }, delay);
  }

  private async publish() {
    const api = this.api, session = this.state.session, generation = this.generation;
    if (this.stopped || !api || !session || !this.dirty || this.sourceConflict || this.sourceId !== this.allowedSourceId || !this.state.connected) return;
    if (api.getAppState().isLoading) { this.schedule(); return; }
    this.publishing = true; this.dirty = false;
    const epoch = this.epoch, socket = this.socket;
    const current = () => !this.stopped && epoch === this.epoch && generation === this.generation
      && api === this.api && session === this.state.session && socket === this.socket
      && this.sourceId === this.allowedSourceId && !this.sourceConflict;
    const request = new AbortController(); this.uploadAbort = request;
    try {
      const projection = await this.projector.project(api,this.timerMaterialId??undefined);
      if (!current()) return;
      if (projection.materials.length && !this.supportsInteractiveMaterials) throw new Error("Der Live-Dienst muss für interaktive HTML-Materialien aktualisiert werden.");
      if(projection.elements.some(e=>(e as unknown as PublicElement).timer) && !this.supportsTimerWidgets) throw new Error("Der Live-Dienst muss für Timer aktualisiert werden.");
      const presentation = this.state.presentation;
      const clip = presentation.mode === "clip" ? presentation.clip : null;
      const viewport = clip ? {x:clip.x,y:clip.y,width:clip.width,height:clip.height} : projection.viewport;
      if (projection.unsupported.join("\n") !== this.state.unsupported.join("\n")) this.update({ unsupported: projection.unsupported });
      // Reuse the latest public asset set while clip mode is active. D-123 keeps
      // camera-only clip motion out of this content path altogether.
      const knownAssets = clip && this.supportsClipMotion ? new Set((this.lastSent ?? this.acknowledged)?.assetIds ?? []) : this.uploaded;
      let uploads = projection.assets.filter(asset => !knownAssets.has(asset.id));
      let rasters: InlineRaster[] | undefined;
      if (this.supportsInlineRasters && uploads.length && uploads.reduce((sum, asset) => sum + asset.blob.size, 0) <= LIMITS.inlineRasterBytes) {
        rasters = await Promise.all(uploads.map(async asset => {
          const bytes = new Uint8Array(await asset.blob.arrayBuffer());
          let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
          return { id: asset.id, data: btoa(binary) };
        }));
        uploads = [];
      }
      for (let offset = 0; offset < uploads.length; offset += 4) {
        await Promise.all(uploads.slice(offset, offset + 4).map(async asset => {
        const response = await fetch(`${session.baseUrl}/api/live/rooms/${session.roomId}/assets/${asset.id}`, {
          method: "PUT", headers: { Authorization: `Bearer ${session.hostToken}`, "Content-Type": asset.blob.type },
          body: asset.blob, signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
        });
        if (!current()) return;
        if (!response.ok) throw new Error("Material konnte nicht übertragen werden.");
        this.uploaded.add(asset.id);
        }));
      }
      const bundles = (projection.materialBundles ?? []).filter(bundle => !this.uploadedBundles.has(bundle.id));
      for (const bundle of bundles) {
        for (let offset = 0; offset < bundle.files.length; offset += 4) {
          await Promise.all(bundle.files.slice(offset,offset+4).map(async file => {
            const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
            const response = await fetch(`${session.baseUrl}/api/live/rooms/${session.roomId}/materials/${bundle.id}/${encodedPath}`, {
              method:"PUT", headers:{Authorization:`Bearer ${session.hostToken}`,"Content-Type":file.blob.type}, body:file.blob,
              signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)]),
            });
            if (!current()) return;
            if (!response.ok) throw new Error("HTML-Material konnte nicht übertragen werden.");
          }));
        }
        this.uploadedBundles.add(bundle.id);
      }
      if (!current()) return;
      // Raster/package uploads can take time. Sample this same host clock only
      // immediately before sending, so a slow asset cannot freeze the timer.
      let elements = projection.elements.map(sanitizeElement);
      elements = this.projector.sampleTimers?.(elements) ?? elements;
      const revision = ++this.revision;
      const previous = this.lastSent ?? this.acknowledged;
      const full: PublishMessage = { type: "publish", replace: true, generation, revision, elements, assetIds: projection.assetIds, materials:projection.materials ?? [], viewport, background: projection.background, ...(projection.coverTransition ? { coverTransition: projection.coverTransition } : {}) };
      if (this.pendingInkEnd && elements.some(element=>element.id===this.pendingInkEnd!.id)) this.pendingInkEnd.commitRevision=revision;
      let message = full;
      if (previous && previous.generation === generation) {
        const old = new Map(previous.elements.map((e) => [e.id, JSON.stringify(e)]));
        const ids = new Set(elements.map((e) => e.id));
        message = { ...full, replace: false, baseRevision: previous.revision, elements: elements.filter((e) => old.get(e.id) !== JSON.stringify(e)), removed: previous.elements.filter((e) => !ids.has(e.id)).map((e) => e.id), order: elements.map((e) => e.id) };
      }
      // WebSocket preserves order. A bounded window allows motion to advance
      // without one network roundtrip per frame; ACK still gates readiness,
      // recovery and camera revisions. No unbounded backlog of old positions.
      const timeout = setTimeout(() => {
        if (!current()) return;
        this.invalidatePublication(); this.markUnavailable();
        this.update({ busy: false, error: "Die Live-Übertragung antwortet nicht." });
      }, 15000);
      this.pending.set(revision, { snapshot: full, timeout, assets: projection.assets });
      if (!this.send(rasters ? { ...message, rasters } : message)) throw new Error("Verbindung unterbrochen.");
      this.lastSent = full;
      this.uploaded = new Set([...projection.assetIds, ...[...this.pending.values()].flatMap(entry => entry.snapshot.assetIds)]);
    } catch (error) {
      if (!current()) return;
      const hasSafeScene = this.state.state === "live" && this.state.publicationReady
        && this.acknowledged?.generation === generation;
      this.starting = false;
      if (!hasSafeScene) {
        this.invalidatePublication();
        this.markUnavailable();
      }
      // A rejected transient frame must never revoke an already acknowledged
      // safe scene. A later native change (including erase/undo) retries from
      // that same confirmed base instead of trapping viewers in loading state.
      this.update({ busy: false, error: error instanceof Error ? error.message : "Live Canvas konnte nicht aktualisiert werden." });
    } finally {
      if (epoch === this.epoch) {
        this.publishing = false;
        if (this.uploadAbort === request) this.uploadAbort = null;
        // Flush the latest viewport against the newly acknowledged revision.
        // Camera events during projection/upload/ACK waiting are deliberately coalesced.
        if (current()) this.camera();
        if (this.dirty) this.schedule(0);
      }
    }
  }

  private camera() {
    if (this.state.presentation.mode === "clip") return;
    if (this.stopped || this.sourceConflict || this.publishing || this.pending.size || !this.state.publicationReady || !this.api || !this.state.connected || this.state.state !== "live" || !this.acknowledged
      || this.acknowledged.generation !== this.generation || this.sourceId !== this.allowedSourceId) return;
    const now = performance.now();
    if (now - this.lastCameraAt < 45) {
      if (!this.cameraTimer) this.cameraTimer = setTimeout(() => { this.cameraTimer = undefined; this.camera(); }, 50);
      return;
    }
    this.lastCameraAt = now;
    this.sendCamera();
  }

  /** Publish the latest teacher viewport without coupling it to participant
   * cameras. A queued recall follows it on the same ordered WebSocket. */
  private sendCamera() {
    if (this.state.presentation.mode === "clip") return false;
    if (this.stopped || this.sourceConflict || this.publishing || this.pending.size || !this.state.publicationReady || !this.api || !this.state.connected || this.state.state !== "live" || !this.acknowledged
      || this.acknowledged.generation !== this.generation || this.sourceId !== this.allowedSourceId) return false;
    try {
      const viewport = getPublicViewport(this.api);
      if (!this.send({ type: "camera", generation: this.generation, revision: this.acknowledged.revision, viewport })) return false;
      this.lastCameraAt = performance.now();
      this.acknowledged = {...this.acknowledged,viewport};
      if (this.lastSent?.generation === this.generation) this.lastSent = {...this.lastSent,viewport};
      if(this.previewEnabled) this.refreshPreview();
      if (this.recallPending) {
        this.recallPending = false;
        const before = this.state.presentation;
        const presentation = parsePresentation({...before,revision:before.revision+1,reset:before.reset+1});
        this.update({presentation,error:null});
        this.saveResume(); this.sendPresentation(); this.refreshPreview();
      }
      return true;
    } catch (error) {
      this.markUnavailable();
      this.update({ error: error instanceof Error ? error.message : "Der Live-Bildausschnitt ist nicht verfügbar." });
      return false;
    }
  }

  retryPublish() {
    if (this.sourceConflict || this.sourceId !== this.allowedSourceId) { this.changed(); return; }
    this.starting = this.state.state === "waiting";
    this.dirty = true; this.update({ error: null, busy: true }); this.schedule();
  }
  kick(participantId: string) { this.send({ type: "kick", participantId }); }
  end() {
    if (!this.state.session || this.ending) return;
    this.ending = true;
    clearResume(this.state.session);
    if (!this.send({ type: "end" })) this.connect();
    clearTimeout(this.endTimer);
    this.endTimer = setTimeout(() => {
      this.ending = false; this.endTimer = undefined;
      this.closeSession();
    }, 5000);
  }
  private closeSession(preserveRecovery = false) {
    clearResume(this.state.session, preserveRecovery);
    this.recovering = false;
    this.timerMaterialId = null;
    this.invalidatePublication();
    this.createAbort?.abort(); this.createAbort = null;
    clearTimeout(this.retry); clearTimeout(this.timer); clearTimeout(this.endTimer); clearInterval(this.heartbeat);
    this.timer = undefined; this.retry = undefined; this.endTimer = undefined; this.heartbeat = undefined;
    this.ending = false;
    const socket = this.socket; this.socket = null; socket?.close();
    this.starting = false; this.startRequested = false; this.uploaded.clear(); this.uploadedBundles.clear(); this.acknowledged = null;
      this.supportsTimerWidgets = false;
      this.supportsViewportClips = false;
      this.supportsInteractiveMaterials = false;
      this.supportsPatches = false;
    this.update({ ...initialState, presentation: this.state.presentation, unsupported: this.state.unsupported });
    this.allowedSourceId = this.sourceId; this.sourceConflict = false;
  }
  dispose() {
    this.stopped = true;
    this.startRequested = false;
    this.invalidatePublication();
    this.createAbort?.abort(); this.createAbort = null;
    clearTimeout(this.retry); clearInterval(this.heartbeat);
    this.retry = undefined; this.heartbeat = undefined;
    const socket = this.socket; this.socket = null; socket?.close();
    this.unsubscribes.forEach((fn) => fn()); this.unsubscribes = [];
    this.update({ connected: false, publicationReady: false, busy: false });
    // Retain reload and browser recovery credentials on a closed window. Only
    // explicit end or a terminal server rejection clears the resume record.
  }
}
