import {appMirrorDescriptor} from "./embedded-app-mirror";
import {canMirrorEmbeddedApp} from "../embedded-apps";
import { readHtmlPageOrientation, type HtmlPageOrientation } from "./interactive-html-pages";
import { LIMITS, type JsonValue, type LiveInteractiveMaterial, type LiveMaterialAccess, type LiveMaterialAnnotation } from "../../../../shared/live-canvas/protocol";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { imageAnnotationGroupId } from "./image-annotation-selection";
import { constrainImageCoverRect, imageCoverBelongsTo, sceneCoverToImageRect } from "./image-cover";
import { projectInteractiveHtmlAnnotations } from "./interactive-html-annotations";
import { readInteractiveHtmlTextPresence, type InteractiveHtmlTextPresence } from "./interactive-html-focus";
import {validPlaybackCommand,type PlaybackCommand,type PlaybackStatus} from '../../interactive-html-playback.mjs';

type FrameDescriptor = { lessonId:string; materialId:string; entry:string; sourceUrl:string; title:string };
type FrameEntry = FrameDescriptor & { iframe:HTMLIFrameElement; initialState:JsonValue | null; state:JsonValue | null; stateRevision:number; waiters:Set<() => void> };
export type InteractiveHtmlPrintCapability = {
  entry:string;
  page:'A4';
  orientation:'portrait'|'landscape';
  mode:'template';
  layout?:'shared-pages';
};
type PackageDescriptor = {
  sentenceCheck?:{protocol:'video-lab-v1';projectId:string}|null;
  playback?:{protocol:'room-v1';initialState:JsonValue}|null;
  entry:string;
  title:string;
  live:{state:'v1'}|null;
  print:InteractiveHtmlPrintCapability|null;
  files:{path:string;mimeType:string;size:number;url:string}[];
};
export type LiveMaterialBundle = { id:string; files:{path:string;blob:Blob}[] };
export type RoomInteractiveMaterial = Omit<LiveInteractiveMaterial,'annotations'> & { roomAppChannel?:string; roomPlayback?:boolean; roomSourceUrl?: string; roomContentZoom?: number; roomPageOrientation?:HtmlPageOrientation|null; roomContentOnly?: boolean; roomLocalId?:string;
  annotations?: (LiveMaterialAnnotation & {roomScrollAnchor?:{x:number;y:number};roomObjectId?:string})[] };

const frames = new Map<string,FrameEntry>();
const playbackFrames=new Set<string>();
let playbackRoomActive=false;
const playbackModeListeners=new Set<()=>void>();
const playbackRestores=new Map<string,{id:string;state:JsonValue}>();
const playbackHandoffs=new Map<string,{source:Window;done:(state:unknown,error:boolean)=>void}>();
export function subscribeHtmlPlaybackMode(listener:()=>void){playbackModeListeners.add(listener);return()=>{playbackModeListeners.delete(listener);};}
export function htmlPlaybackRestoring(id:string){return playbackRestores.has(id);}
export function teacherHtmlPlaybackUrl(id:string,source:string){
  return playbackFrames.has(id)&&!playbackRoomActive?`${source}?tafelraum-playback=local`:source;
}
export function setHtmlPlaybackRoomActive(active:boolean){
  if(active===playbackRoomActive)return;
  playbackRoomActive=active;
  for(const id of playbackFrames){const state=frames.get(id)?.state;if(state!==null&&state!==undefined)playbackRestores.set(id,{id:crypto.randomUUID(),state:cloneState(state)});}
  playbackModeListeners.forEach(listener=>listener());
}
export async function prepareHtmlPlaybackRoom(){
  await Promise.all([...playbackFrames].map(async id=>{
    const source=frames.get(id)?.iframe.contentWindow;if(!source)return;
    const handoff=crypto.randomUUID();
    await new Promise<void>((resolve,reject)=>{
      // A quick Room restart may arrive while the local document is still loading.
      // Retry the same id, but never capture its un-restored initial state.
      const send=()=>{
        const current=frames.get(id)?.iframe.contentWindow,pending=playbackHandoffs.get(handoff);
        if(current&&pending&&!playbackRestores.has(id)){
          pending.source=current;current.postMessage({type:'tafelraum:playback-host',action:'handoff',handoff},'*');
        }
      };
      const retry=setInterval(send,100);
      const timer=setTimeout(()=>{clearInterval(retry);playbackHandoffs.delete(handoff);reject(new Error('Wiedergabe konnte nicht pausiert werden. Bitte erneut versuchen.'));},2000);
      playbackHandoffs.set(handoff,{source,done:(state,error)=>{
        clearTimeout(timer);clearInterval(retry);playbackHandoffs.delete(handoff);
        if(error){reject(new Error('Wiedergabe konnte nicht pausiert werden.'));return;}
        try{const entry=frames.get(id);if(entry)entry.state=cloneState(state);resolve();}catch{reject(new Error('Wiedergabeposition konnte nicht übernommen werden.'));}
      }});
      send();
    });
  }));
  setHtmlPlaybackRoomActive(true);
}
export function interactiveHtmlFrameLoaded(id:string){
  const restore=playbackRestores.get(id);
  if(restore)frames.get(id)?.iframe.contentWindow?.postMessage({type:'tafelraum:interactive-apply',state:restore.state,applyId:restore.id},'*');
  else requestInteractiveHtmlState(id);
}
const playbackListeners=new Set<(id:string,command:PlaybackCommand,state?:JsonValue)=>void>();
export function subscribeHtmlPlayback(listener:(id:string,command:PlaybackCommand,state?:JsonValue)=>void){playbackListeners.add(listener);return()=>{playbackListeners.delete(listener);};}
export function reportHtmlPlayback(id:string,status:PlaybackStatus|null){
  frames.get(id)?.iframe.contentWindow?.postMessage({type:'tafelraum:playback-status',connected:Boolean(status),status},'*');
}
const packageDescriptors = new Map<string,Promise<PackageDescriptor>>();
const printCapabilities = new Map<string,InteractiveHtmlPrintCapability>();
export type LiveMaterialStateChange = { instanceId:string; stateRevision:number; state:JsonValue };
export type InteractiveHtmlFrameStateChange = { elementId:string; lessonId:string; stateRevision:number; state:JsonValue };
export type InteractiveHtmlFocus = { elementId:string; key:string; active:boolean; presence:InteractiveHtmlTextPresence|null };
const liveListeners = new Set<(elementId:string,entry:FrameEntry) => void>();
const stateListeners = new Set<(change:InteractiveHtmlFrameStateChange) => void>();
const focusListeners = new Set<(focus:InteractiveHtmlFocus|null) => void>();
let teacherFocus:InteractiveHtmlFocus|null = null;
const printCapabilityListeners = new Set<(elementId:string) => void>();
const scrollListeners = new Set<(elementId:string,offset:{x:number;y:number}) => void>();
const scrollOffsets = new Map<string,{x:number;y:number}>();

function packageDescriptorUrl(entry:FrameDescriptor) {
  return entry.sourceUrl.slice(0, entry.sourceUrl.length - entry.entry.length).replace(/\/$/,"");
}

function loadPackageDescriptor(entry:FrameDescriptor) {
  const key = `${entry.lessonId}:${entry.materialId}`;
  let promise = packageDescriptors.get(key);
  if (!promise) {
    promise = fetch(packageDescriptorUrl(entry)).then(async response => {
      if (!response.ok) throw new Error("HTML-Paket konnte nicht gelesen werden.");
      return await response.json() as PackageDescriptor;
    });
    packageDescriptors.set(key,promise);
    void promise.catch(() => packageDescriptors.delete(key));
  }
  return promise;
}

function cloneState(value: unknown): JsonValue {
  const text = JSON.stringify(value);
  if (!text || new TextEncoder().encode(text).byteLength > LIMITS.interactiveStateBytes) throw new Error("HTML-Materialzustand ist ungültig oder zu groß.");
  return JSON.parse(text) as JsonValue;
}

function commitFrameState(elementId:string,entry:FrameEntry,state:JsonValue) {
  if(JSON.stringify(state)===JSON.stringify(entry.state))return;
  entry.initialState??=state;
  entry.state=state;entry.stateRevision+=1;
  entry.waiters.forEach(resolve=>resolve());entry.waiters.clear();
  stateListeners.forEach(listener=>listener({elementId,lessonId:entry.lessonId,stateRevision:entry.stateRevision,state}));
  liveListeners.forEach(listener=>listener(elementId,entry));
}

function setTeacherFocus(focus:InteractiveHtmlFocus|null) {
  if (JSON.stringify(teacherFocus)===JSON.stringify(focus)) return;
  teacherFocus=focus;
  focusListeners.forEach(listener=>listener(focus));
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown",()=>setTeacherFocus(null),true);
  window.addEventListener("focusin",event=>{
    if(!(event.target instanceof HTMLIFrameElement))setTeacherFocus(null);
  },true);
  window.addEventListener("message", event => {
    if(event.data?.type==='tafelraum:playback-output'&&typeof event.data.handoff==='string'){
      const pending=playbackHandoffs.get(event.data.handoff);
      if(pending?.source===event.source)pending.done(event.data.state,event.data.error===true);
      return;
    }
    if(event.data?.type==='tafelraum:playback-command'){
      const found=[...frames].find(([id,entry])=>playbackFrames.has(id)&&entry.iframe.contentWindow===event.source);
      if(found&&validPlaybackCommand(event.data.command)){
        try{const state=event.data.state===undefined?undefined:cloneState(event.data.state);
          if(state!==undefined){
            commitFrameState(found[0],found[1],state);
            found[1].iframe.contentWindow?.postMessage({type:'tafelraum:interactive-apply',state},'*');
          }
          playbackListeners.forEach(listener=>listener(found[0],event.data.command,state));
        }catch{/* Oversized or invalid state cannot accompany playback. */}
      }
      return;
    }
    if (!event.data || !['tafelraum:interactive-state','tafelraum:interactive-scroll','tafelraum:interactive-focus'].includes(event.data.type)) return;
    const found = [...frames].find(([,entry]) => entry.iframe.contentWindow === event.source);
    if (!found) return;
    const [elementId,entry] = found;
    if(event.data.type==='tafelraum:interactive-focus') {
      const key=event.data.key;
      if(key===null){if(teacherFocus?.elementId===elementId)setTeacherFocus(null);}
      else if(typeof key==='string'&&key.length>0&&key.length<=200){
        const active=event.data.active!==false;
        // A delayed blur may update an existing marker, but must not restore a cleared field.
        if(!active&&(teacherFocus?.elementId!==elementId||teacherFocus.key!==key))return;
        setTeacherFocus({elementId,key,active,presence:readInteractiveHtmlTextPresence(event.data.presence)});
      }
      return;
    }
    if(event.data.type==='tafelraum:interactive-scroll') {
      const x=event.data.scrollX,y=event.data.scrollY;
      if(typeof x==='number'&&typeof y==='number'&&[x,y].every(value=>Number.isFinite(value)&&value>=0&&value<=1_000_000)) {
        const offset={x,y};scrollOffsets.set(elementId,offset);scrollListeners.forEach(listener=>listener(elementId,offset));
      }
      return;
    }
    try {
      const restore=playbackRestores.get(elementId);
      if(restore){
        if(event.data.origin!=='apply'||event.data.applyId!==restore.id){
          // An async package API can become ready after the iframe load event.
          // Its first state is readiness, not a replacement for the saved state.
          // Retry the same restoration and keep input locked until its ACK.
          if(event.data.origin==='local')interactiveHtmlFrameLoaded(elementId);
          return;
        }
        playbackRestores.delete(elementId);
        playbackModeListeners.forEach(listener=>listener());
      }
      const state = cloneState(event.data.state);
      commitFrameState(elementId,entry,state);
    } catch { /* The package cannot put unvalidated state on the live wire. */ }
  });
}

export function registerInteractiveHtmlFrame(elementId:string, iframe:HTMLIFrameElement, descriptor:FrameDescriptor) {
  const previous = frames.get(elementId);
  const entry:FrameEntry = previous && (previous.iframe === iframe||playbackRestores.has(elementId))
    ? {...previous,...descriptor,iframe} : {...descriptor,iframe,initialState:null,state:null,stateRevision:0,waiters:new Set()};
  frames.set(elementId,entry);
  void loadPackageDescriptor(entry).then(packageDescriptor => {
    if (frames.get(elementId) !== entry) return;
    const print = packageDescriptor.print;
    const previousPlayback=playbackFrames.has(elementId);
    if(packageDescriptor.playback?.protocol==='room-v1')playbackFrames.add(elementId);else playbackFrames.delete(elementId);
    if(previousPlayback!==playbackFrames.has(elementId)){
      if(!playbackRoomActive&&entry.state!==null)playbackRestores.set(elementId,{id:crypto.randomUUID(),state:cloneState(entry.state)});
      playbackModeListeners.forEach(listener=>listener());
      liveListeners.forEach(listener=>listener(elementId,entry));
    }
    if (print?.page === 'A4' && print.mode === 'template') printCapabilities.set(elementId,print);
    else printCapabilities.delete(elementId);
    printCapabilityListeners.forEach(listener => listener(elementId));
  }).catch(() => undefined);
  return () => {
    // A mode change replaces the iframe but not its semantic instance. Its next
    // registration runs in this commit; real unmounts are cleaned afterwards.
    // StrictMode may register the same iframe again: only this entry owns cleanup.
    queueMicrotask(()=>{
    if (frames.get(elementId) !== entry) return;
    frames.delete(elementId);
    playbackFrames.delete(elementId);
    playbackRestores.delete(elementId);
    if(teacherFocus?.elementId===elementId)setTeacherFocus(null);
    scrollOffsets.delete(elementId);
    printCapabilities.delete(elementId);
    });
  };
}

export function getInteractiveHtmlPrintCapability(elementId:string) {
  return printCapabilities.get(elementId) ?? null;
}

export function subscribeInteractiveHtmlPrintCapabilities(listener:(elementId:string)=>void) {
  printCapabilityListeners.add(listener);
  return () => { printCapabilityListeners.delete(listener); };
}

export function requestInteractiveHtmlState(elementId:string) {
  frames.get(elementId)?.iframe.contentWindow?.postMessage({type:"tafelraum:interactive-request-state"},"*");
}

export function subscribeInteractiveHtmlState(listener:(change:InteractiveHtmlFrameStateChange)=>void) {
  stateListeners.add(listener);
  return () => { stateListeners.delete(listener); };
}
export function subscribeInteractiveHtmlFocus(listener:(focus:InteractiveHtmlFocus|null)=>void) {
  focusListeners.add(listener);
  return()=>{focusListeners.delete(listener);};
}
export function getInteractiveHtmlFocus():InteractiveHtmlFocus|null {return teacherFocus;}
/** Room presence only: never focuses a field or changes its semantic state. */
export function showInteractiveHtmlRoomFocus(focus:InteractiveHtmlFocus|null) {
  for (const [elementId,entry] of frames) {
    const current=focus?.elementId===elementId?focus:null;
    entry.iframe.contentWindow?.postMessage({type:'tafelraum:interactive-peer-focus',role:'student',
      key:current?.key??null,active:current?.active??false,presence:current?.presence??null},'*');
  }
}

export function subscribeInteractiveHtmlScroll(listener:(elementId:string,offset:{x:number;y:number})=>void) {
  scrollListeners.add(listener);return()=>{scrollListeners.delete(listener);};
}
export function getInteractiveHtmlScroll(elementId:string) {return scrollOffsets.get(elementId)??{x:0,y:0};}

export function getInteractiveHtmlState(elementId:string) {
  return frames.get(elementId)?.state ?? null;
}

export function applyInteractiveHtmlState(elementId:string,state:JsonValue) {
  const entry = frames.get(elementId);
  if (!entry) return false;
  entry.iframe.contentWindow?.postMessage({type:"tafelraum:interactive-apply",state:cloneState(state)},"*");
  return true;
}

export function resetInteractiveHtmlState(elementId:string) {
  const entry = frames.get(elementId);
  if (!entry?.initialState) return false;
  entry.iframe.contentWindow?.postMessage({type:"tafelraum:interactive-apply",state:cloneState(entry.initialState)},"*");
  return true;
}

async function waitForState(entry:FrameEntry):Promise<JsonValue> {
  if (entry.state !== null) return entry.state;
  await new Promise<void>((resolve,reject) => {
    const timer = window.setTimeout(() => { entry.waiters.delete(done); reject(new Error("HTML-Material ist noch nicht bereit.")); },3000);
    const done = () => { window.clearTimeout(timer); resolve(); };
    entry.waiters.add(done);
    entry.iframe.contentWindow?.postMessage({type:"tafelraum:interactive-request-state"},"*");
  });
  if (entry.state === null) throw new Error("HTML-Material ist noch nicht bereit.");
  return entry.state;
}

export function createInteractiveMaterialSource(onChange:(change:LiveMaterialStateChange)=>void, accessFor:(elementId:string)=>LiveMaterialAccess, output:'remote'|'room'='remote') {
  const publicIds = new Map<string,string>();
  const bundles = new Map<string,Promise<LiveMaterialBundle>>();
  const notify = (elementId:string,entry:FrameEntry) => {
    const instanceId = publicIds.get(elementId);
    if (instanceId && entry.state !== null) onChange({instanceId,stateRevision:entry.stateRevision,state:entry.state});
  };
  const unsubscribe = () => liveListeners.delete(notify);
  liveListeners.add(notify);
  const publicId = (localId:string) => {
    let value = publicIds.get(localId); if (!value) { value = crypto.randomUUID(); publicIds.set(localId,value); } return value;
  };
  const loadBundle = (entry:FrameEntry) => {
    const key = `${entry.lessonId}:${entry.materialId}`;
    let promise = bundles.get(key);
    if (!promise) {
      const id = crypto.randomUUID();
      promise = loadPackageDescriptor(entry).then(async descriptor => {
        if(descriptor.sentenceCheck)throw new Error('KI-Satzprüfung unterstützt nur den lokalen Lehrer-/Room-Betrieb.');
        if(descriptor.playback)throw new Error('Room-Wiedergabe unterstützt noch keine Remote-Canvas-Veröffentlichung.');
        if (descriptor.entry !== entry.entry || descriptor.live?.state !== 'v1' || !Array.isArray(descriptor.files) || descriptor.files.length > LIMITS.interactivePackageFiles) throw new Error("HTML-Material unterstützt noch keine Live-Zustände.");
        if (descriptor.files.some(file => !Number.isSafeInteger(file.size) || file.size < 0)
          || descriptor.files.reduce((total, file) => total + file.size, 0) > LIMITS.interactivePackageBytes) {
          throw new Error("HTML-Paket ist für Remote Canvas zu groß; die lokale Room-Nutzung bleibt möglich.");
        }
        const files = await Promise.all(descriptor.files.map(async file => {
          const resource = await fetch(file.url);
          if (!resource.ok) throw new Error("HTML-Paketdatei konnte nicht gelesen werden.");
          const blob = await resource.blob();
          if (blob.size !== file.size && !file.mimeType.startsWith("text/html")) throw new Error("HTML-Paketdatei hat sich während der Freigabe geändert.");
          return {path:file.path,blob:new Blob([blob],{type:file.mimeType})};
        }));
        return {id,files};
      });
      bundles.set(key,promise);
    }
    return promise;
  };
  return {
    async read(elements:readonly ExcalidrawElement[], roomAnnotationId:(id:string)=>string=id=>id) {
      const materials:RoomInteractiveMaterial[] = []; const usedBundles = new Map<string,LiveMaterialBundle>(); const projectedElementIds = new Set<string>();
      for (const element of elements.filter(candidate => candidate.customData?.materialKind === "interactive-html" || output==='room'&&canMirrorEmbeddedApp(candidate))) {
        const app=output==='room'&&canMirrorEmbeddedApp(element)?appMirrorDescriptor(element.id):null;
        const entry = frames.get(element.id);
        if (!entry&&!app) throw new Error("Material ist auf der Fläche noch nicht bereit.");
        const state = app ? {} : output === 'room' ? entry!.state : await waitForState(entry!);
        const bundle = output === 'room' ? null : await loadBundle(entry!);
        if(app)projectedElementIds.add(element.id);
        if (bundle) usedBundles.set(bundle.id,bundle);
        const coverElement = elements.find(candidate => !candidate.isDeleted && candidate.type === "rectangle" && imageCoverBelongsTo(candidate,element.id));
        const cover = coverElement ? constrainImageCoverRect(sceneCoverToImageRect(element,coverElement)) : undefined;
        const projected = projectInteractiveHtmlAnnotations(element,elements,imageAnnotationGroupId(element.id),{});
        projected.annotations.forEach(annotation => projectedElementIds.add(annotation.id));
        const annotations:LiveMaterialAnnotation[] = projected.annotations.map(annotation => annotation.kind === "stroke" ? {
          kind:"stroke",x:annotation.x,y:annotation.y,width:annotation.width,height:annotation.height,angle:annotation.angle,
          opacity:annotation.opacity,strokeColor:annotation.strokeColor,strokeWidth:annotation.strokeWidth,
          points:annotation.points.map(point => [point.x,point.y]),...(annotation.fillColor?{fillColor:annotation.fillColor}:{}),
          ...(output==='room'&&annotation.scrollAnchor?{roomScrollAnchor:annotation.scrollAnchor}:{}),
          ...(output==='room'?{roomObjectId:roomAnnotationId(annotation.id)}:{}),
        } : {
          kind:"text",x:annotation.x,y:annotation.y,width:annotation.width,height:annotation.height,angle:annotation.angle,
          opacity:annotation.opacity,color:annotation.color,fontSize:annotation.fontSize,lineHeight:annotation.lineHeight,
          text:annotation.text,textAlign:annotation.textAlign,
          ...(output==='room'&&annotation.scrollAnchor?{roomScrollAnchor:annotation.scrollAnchor}:{}),
          ...(output==='room'?{roomObjectId:roomAnnotationId(annotation.id)}:{}),
        });
        materials.push({instanceId:publicId(element.id),bundleId:bundle?.id ?? entry?.materialId ?? app!.app.id,entry:entry?.entry??"app",title:entry?.title??app!.app.name,
          x:element.x,y:element.y,width:element.width,height:element.height,angle:element.angle,
          stateRevision:entry?.stateRevision??0,state,access:accessFor(element.id),...(cover?{cover}:{}),...(annotations.length?{annotations}:{}),
          ...(output === 'room' ? {roomPlayback:playbackFrames.has(element.id),roomPageOrientation:readHtmlPageOrientation(element.customData?.interactiveHtmlPageOrientation),roomContentOnly:element.customData?.interactiveHtmlFrameLayout === "content",...(app?{roomAppChannel:app.channel}:{roomSourceUrl:entry!.sourceUrl}),roomLocalId:element.id,roomContentZoom:app?Number(element.customData?.embeddedAppContentZoom)||1:typeof element.customData?.interactiveHtmlContentZoom === 'number' ? element.customData.interactiveHtmlContentZoom : 1} : {})});
      }
      return {materials,bundles:[...usedBundles.values()],projectedElementIds};
    },
    apply(instanceId:string,state:JsonValue) {
      const localId = [...publicIds].find(([,id]) => id === instanceId)?.[0]; if (!localId) return false;
      const entry = frames.get(localId); if (!entry) return false;
      entry.iframe.contentWindow?.postMessage({type:"tafelraum:interactive-apply",state:cloneState(state),
        ...(output==='room'?{preserveFocusedValue:true}:{})},"*"); return true;
    },
    stop:unsubscribe,
  };
}
