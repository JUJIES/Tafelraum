import { canvasBackgrounds, defaultThemeVariants } from "../theme-preferences.ts";
import { SceneChangeTracker } from "./scene-change-tracker.ts";
import {reportRoomVideoStatus,clearRoomVideoStatus,pauseRoomVideoStatus,validRoomVideoStatus,validRoomVideoCommand,subscribeRoomVideoCommands,type RoomVideoCommand} from './room-video-status.ts';
import {setAppMirrorRoomActive} from "../canvas/embedded-app-mirror.ts";
import {withoutTemporaryEraserState,withTemporaryEraserState} from '../canvas/eraser-policy.ts';
import {isMaterialAnnotationTarget} from '../canvas/material-annotation-targets.ts';
import { timerIntersectsViewport, validRoomTimerCommand, type RoomTimerCommand } from "./room-timer.ts";
import { isTimerWidget, type TimerRuntime, type TimerWidget } from "../widgets/timer.ts";
import { invoke, isTauri } from '@tauri-apps/api/core';
import { isErasableInk } from '../canvas/eraser-policy.ts';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import { CaptureUpdateAction, newElementWith } from '@excalidraw/excalidraw';
import type { ClipFrame } from '../canvas/clip-frames.ts';
import { getInteractiveHtmlFocus, getInteractiveHtmlScroll, getInteractiveHtmlState, subscribeInteractiveHtmlFocus, subscribeInteractiveHtmlScroll, showInteractiveHtmlRoomFocus, type RoomInteractiveMaterial } from '../canvas/interactive-html-live.ts';
import { getPublicViewport, createPublicProjector, type PublicProjection } from './public-projection.ts';
import type { HostPointerChannel } from './host-pointer-channel.ts';
import type { InkPreviewPatch, PublicElement, Scene, Viewport } from '../../../../shared/live-canvas/protocol.ts';
import { boundedCamera } from './viewer-camera.ts';
import { createHostPointerChannel } from './host-pointer-channel.ts';
import type { PublicPreview } from './live-host.ts';
import { roomTargetContainsMedia, roomTargetMedia } from './room-media-presentation.ts';
import { isRoomMediaElement, roomMediaFromElement, type RoomMedia, type RoomMediaPlayback } from './room-media.ts';
import { attachNewAnnotationsToCanvasTargets } from '../canvas/image-annotation-groups.ts';
import { roomInkElement, validRoomInkCommand, type RoomInkCommand } from './room-ink.ts';
import { RoomActionHistory, validRoomHistoryCommand, type RoomHistoryCommand } from './room-history.ts';
import { mergeRoomMaterialState, validRoomMaterialStateCommand, type RoomMaterialStateCommand } from './room-material-state.ts';
import { transformRoomAnnotation, validRoomObjectCommand, type RoomObject, type RoomObjectCommand, type RoomVisibleObject } from './room-object-edit.ts';

import { readRoomHtmlFocusMessage, type RoomHtmlFocusMessage } from './room-html-focus.ts';
import {RoomHtmlPlaybackHost,type RoomPlaybackMessage} from './room-html-playback.ts';
import {prepareHtmlPlaybackRoom,setHtmlPlaybackRoomActive} from '../canvas/interactive-html-live.ts';

export type RoomTarget = { kind:'canvas' } | { kind:'clip'; clip:ClipFrame } | { kind:'material'; id:string; title:string; cueId?:string; number?:number };
export type RoomState = { active:boolean; ready:boolean; target:RoomTarget; mediaId:string|null; mediaFullscreenId:string|null; error:string|null; screen:{width:number;height:number}|null };
type RoomMessage = {type:'ready'; channel:string;width:number;height:number}|{type:'closed';channel:string}
  | {type:'media-status';channel:string;generation:number;revision:number;id:string;sequence:number;status:unknown}
  | {type:'size';channel:string;width:number;height:number}
  | {type:'media-fullscreen-exit';channel:string;generation:number;id:string}
  | {type:'media-error';channel:string;generation:number;id:string;message:string}
  | {type:'shown'; channel:string; generation:number; revision:number} | RoomInkCommand | RoomHistoryCommand | RoomObjectCommand | RoomMaterialStateCommand | RoomTimerCommand | RoomHtmlFocusMessage | RoomPlaybackMessage;
type RoomFrame = {type:'frame'; channel:string; scene:Scene; assets:{id:string;blob:Blob}[]; media?:RoomMedia|null;mediaFullscreen?:boolean;objects:RoomVisibleObject[];timers?:TimerWidget[]};

const canvasTarget:RoomTarget = {kind:'canvas'};

/** One local presenter and one receiver. All edits enter the canonical host scene. */
export class RoomCanvasHost {
  readonly previewPointer=createHostPointerChannel();
  state:RoomState = {active:false,ready:false,target:canvasTarget,mediaId:null,mediaFullscreenId:null,error:null,screen:null};
  private listeners = new Set<() => void>();
  private previewListeners=new Set<() => void>();
  private preview:PublicPreview|null=null;
  private api:ExcalidrawImperativeAPI|null = null;
  private lessonId = '';
  private unsubscribes:(() => void)[] = [];
  private channel:BroadcastChannel|null = null;
  private htmlPlayback:RoomHtmlPlaybackHost|null=null;
  private stopping:Promise<void>|null=null;
  private starting:Promise<void>|null=null;
  private channelId = '';
  private browserWindow:Window|null = null;
  private stopVideoCommands:(()=>void)|null=null;
  private mediaLeaseTimer:ReturnType<typeof setInterval>|undefined;
  private windowTimer:ReturnType<typeof setInterval>|undefined;
  private unlisten:UnlistenFn|null = null;
  private stopScroll:(()=>void)|null=null;
  private stopFocus:(()=>void)|null=null;
  private roomFocus:RoomHtmlFocusMessage|null=null;
  private stopPointer:(()=>void)|null=null;
  private projector = createPublicProjector(() => this.materialChanged(), () => ({mode:'locked',participantIds:[]}), 'room');
  private generation = 1;
  private revision = 0;
  private sceneVersion = 0;
  private fullProjection:{version:number;value:PublicProjection}|null = null;
  private materialProjection:{version:number;id:string;value:PublicProjection}|null = null;
  private sceneTracker = new SceneChangeTracker();
  private lastFiles = new Map<string,{version?:number;dataURL:string}>();
  private inspectionTimer:ReturnType<typeof setTimeout>|undefined;
  private lastInspectionAt:number|null=null;
  private inkPreviewId:string|null=null;
  private inkTimer:ReturnType<typeof setTimeout>|undefined;
  private lastInkAt=0;
  private inkWire:{localId:string;id:string;revision:number;element:PublicElement}|null=null;
  private receiverReady = false;
  private sentAssets = new Set<string>();
  private missingTarget = false;
  private neutralRevision = 0;
  private pendingPreview:{revision:number;value:PublicPreview}|null=null;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private projecting = false;
  private dirty = false;
  private epoch = 0;
  private sharedViewport:Viewport|null = null;
  private mediaPlayback = new Map<string,RoomMediaPlayback>();
  private mediaAttempt = 0;
  private pendingActions:{command:RoomInkCommand|RoomHistoryCommand|RoomObjectCommand|RoomTimerCommand;receivedAt:number}[]=[];
  private actionFlushTimer:ReturnType<typeof setTimeout>|undefined;
  private roomHistory=new RoomActionHistory();
  private roomHistoryState='';
  private roomObjects:RoomObject[]=[];
  private roomObjectsRevision=0;
  private timerRuntime:TimerRuntime|null=null;
  private stopTimers:(()=>void)|null=null;
  private roomTimerGeometry:NonNullable<PublicProjection['roomTimers']>=[];

  attachTimers(runtime:TimerRuntime|null) {
    this.stopTimers?.();this.stopTimers=null;this.timerRuntime=runtime;
    if(runtime)this.stopTimers=runtime.subscribe(()=>this.sendTimers());
    this.sendTimers();
  }
  private timerFrames():TimerWidget[] {
    if(this.state.target.kind==='material'&&!this.api?.getSceneElements().some(e=>e.id===(this.state.target as {id:string}).id&&isTimerWidget(e)))return [];
    return this.roomTimerGeometry.flatMap(geometry=>{
      if(this.state.target.kind==='clip'&&!timerIntersectsViewport(geometry,this.state.target.clip))return [];
      const object=this.roomObjects.find(object=>object.id===geometry.id);
      const state=object&&this.timerRuntime?.get(object.sourceId);
      return state?[{...state,...geometry}]:[];
    });
  }
  private applyTimerCommand(message:RoomTimerCommand) {
    const timer=this.timerFrames().find(timer=>timer.id===message.id);
    const object=timer&&this.roomObjects.find(object=>object.id===timer.id);
    const before=object&&this.api?.getSceneElements().find(element=>element.id===object.sourceId);
    if(!this.state.active||!this.state.ready||!this.api||message.generation!==this.generation||!object||!before||!isTimerWidget(before)
      ||!this.timerRuntime?.apply(object.sourceId,message.action,message.revision,'room')){
      this.channel?.postMessage({type:'timer-error',channel:this.channelId,generation:this.generation,error:'Der Timer wurde inzwischen geändert.'});
      this.sendTimers();return;
    }
    if(message.action.type==='duration'||message.action.type==='sound'){
      const after=this.api?.getSceneElements().find(element=>element.id===object.sourceId);
      if(before&&after&&before.version!==after.version){
        this.roomHistory.recordChanges([{before,after}]);this.sendRoomHistoryState(true);
      }
    }
  }
  private sendTimers() {
    const timers=this.timerFrames();
    if(this.state.active&&this.receiverReady)this.channel?.postMessage({type:'timer-state',channel:this.channelId,
      generation:this.generation,revision:this.revision,timers});
    if(this.preview)this.setPreview({...this.preview,roomTimers:timers});
    if(this.pendingPreview)this.pendingPreview={...this.pendingPreview,value:{...this.pendingPreview.value,roomTimers:timers}};
  }


  subscribe = (listener:() => void) => {this.listeners.add(listener);return () => this.listeners.delete(listener);};
  getSnapshot = () => this.state;
  subscribePreview=(listener:()=>void)=>{this.previewListeners.add(listener);return()=>this.previewListeners.delete(listener);};
  getPreviewSnapshot=()=>this.preview;
  private update(patch:Partial<RoomState>) {
    const wasActive=this.state.active;
    this.state={...this.state,...patch};
    if(wasActive!==this.state.active)setAppMirrorRoomActive(this.state.active);
    if(patch.ready===false&&this.state.active)this.channel?.postMessage({
      type:'input-ready',channel:this.channelId,generation:this.generation,revision:this.revision,ready:false,
    });
    this.listeners.forEach(listener=>listener());
  }
  private setPreview(preview:PublicPreview|null){
    this.preview=preview;
    if(this.roomFocus&&!this.focusMaterial(this.roomFocus.instanceId))this.clearRoomFocus();
    this.previewListeners.forEach(listener=>listener());
  }
  private focusMaterial(instanceId:string|null) {
    return this.preview?.scene.generation===this.generation
      ?(this.preview.scene.materials as RoomInteractiveMaterial[]|undefined)?.find(material=>material.instanceId===instanceId
        &&material.roomLocalId&&!(material.cover?.width===1&&material.cover?.height===1)):undefined;
  }
  private clearRoomFocus(){this.roomFocus=null;showInteractiveHtmlRoomFocus(null);}

  private sendRoomHistoryState(force=false) {
    if(!this.api||!this.channel)return;
    const state=this.roomHistory.state(this.api.getSceneElementsIncludingDeleted());
    const signature=`${state.undo}:${state.redo}`;
    if(!force&&signature===this.roomHistoryState)return;
    this.roomHistoryState=signature;
    this.channel.postMessage({type:'history-state',channel:this.channelId,generation:this.generation,...state});
  }

  attach(api:ExcalidrawImperativeAPI|null,lessonId:string) {
    this.unsubscribes.forEach(stop=>stop());this.unsubscribes=[];
    if (lessonId !== this.lessonId) {
      this.htmlPlayback?.clear();
      this.generation++;this.revision=0;this.sceneVersion++;this.fullProjection=null;this.materialProjection=null;
      this.sentAssets.clear();this.missingTarget=false;
      this.neutralRevision=0;
      this.projector.stop();this.projector=createPublicProjector(() => this.materialChanged(), () => ({mode:'locked',participantIds:[]}), 'room');
      this.sharedViewport=null;
      this.pendingPreview=null;
      this.mediaPlayback.clear();clearRoomVideoStatus();
      this.mediaAttempt=0;
      this.inkPreviewId=null;this.inkWire=null;clearTimeout(this.inkTimer);this.inkTimer=undefined;
      this.pendingActions=[];clearTimeout(this.actionFlushTimer);this.actionFlushTimer=undefined;
      this.roomHistory.clear();this.roomHistoryState='';
      this.roomTimerGeometry=[];this.roomObjects=[];
      this.update({target:canvasTarget,mediaId:null,mediaFullscreenId:null,ready:false,error:null});this.setPreview(null);
      if(this.state.active&&this.receiverReady) {
        const revision=++this.revision;
        this.neutralRevision=revision;
        this.channel?.postMessage({type:'frame',channel:this.channelId,scene:{
          generation:this.generation,revision,elements:[],assetIds:[],materials:[],
          viewport:{x:0,y:0,width:1,height:1},background:canvasBackgrounds.light[defaultThemeVariants.light],
          presentation:{mode:'free',clip:null,revision,reset:revision},
        },assets:[],objects:[]} satisfies RoomFrame);
      }
    }
    clearTimeout(this.inspectionTimer);this.inspectionTimer=undefined;
    this.api=api;this.lessonId=lessonId;this.sceneTracker=new SceneChangeTracker();this.lastFiles.clear();this.lastInspectionAt=null;
    if (api) this.unsubscribes=[api.onChange(()=>this.changed()),api.onScrollChange(()=>this.camera())];
    this.changed();
  }

  start(){return this.starting??=(this.beginStart().finally(()=>{this.starting=null;}));}
  private async beginStart() {
    if(this.stopping)await this.stopping;
    if (this.state.active) { await this.showWindow();return; }
    if (!this.api) return;
    const startEpoch=this.epoch;
    try{await prepareHtmlPlaybackRoom();}catch(error){
      this.update({error:error instanceof Error?error.message:'Wiedergabe konnte nicht übernommen werden.'});return;
    }
    if(startEpoch!==this.epoch||!this.api){setHtmlPlaybackRoomActive(false);return;}
    // Prepare host-only audio in this deliberate teacher gesture, before Room commands arrive.
    this.timerRuntime?.prepareSound();
    const channelId=crypto.randomUUID();this.channelId=channelId;this.receiverReady=false;
    const channel=new BroadcastChannel(`tafelraum-room-${channelId}`);this.channel=channel;
    this.htmlPlayback=new RoomHtmlPlaybackHost(channel,channelId,()=>this.state.active&&this.state.ready?this.preview?.scene??null:null);
    channel.onmessage=(event:MessageEvent<RoomMessage>)=>{
      const message=event.data;
      if (!message || message.channel!==this.channelId) return;
      if(message.type==='html-playback'){this.htmlPlayback?.receive(message);return;}
      if (message.type==='room-html-focus') {
        const focus=readRoomHtmlFocusMessage(message);
        if(!focus||!this.state.active||!this.state.ready||focus.generation!==this.generation
          ||focus.revision!==this.preview?.scene.revision)return;
        if(focus.instanceId===null){this.clearRoomFocus();return;}
        const material=this.focusMaterial(focus.instanceId);
        if(!material?.roomLocalId)return;
        // A delayed blur cannot restore a field cleared or replaced in Room.
        if(!focus.active&&(this.roomFocus?.instanceId!==focus.instanceId||this.roomFocus.key!==focus.key))return;
        this.roomFocus=focus;
        showInteractiveHtmlRoomFocus({elementId:material.roomLocalId,key:focus.key!,active:focus.active,presence:focus.presence});
        return;
      }
      if (message.type==='ready') {
        if(this.receiverReady&&this.state.ready)for(const [id,previous] of this.mediaPlayback){this.mediaPlayback.set(id,{...previous,playing:false,updatedAt:Date.now()});pauseRoomVideoStatus(id);}
        this.receiverReady=true;this.sentAssets.clear();this.update({screen:{width:message.width,height:message.height}});this.sendRoomHistoryState(true);this.schedule(0);}
      if (message.type==='size') this.update({screen:{width:message.width,height:message.height}});
      if (message.type==='shown' && message.generation===this.generation && message.revision===this.revision && message.revision!==this.neutralRevision && !this.missingTarget){
        const wasReady=this.state.ready;
        const preview=this.pendingPreview?.revision===message.revision?this.pendingPreview.value:null;
        if(preview&&this.inkWire&&preview.scene.elements.some(element=>element.id===this.inkWire?.id))this.inkWire=null;
        if(!wasReady||this.state.error)this.update({ready:true,error:null});
        if(preview&&this.preview?.scene.revision!==message.revision)this.setPreview(preview);
        this.channel?.postMessage({type:'input-ready',channel:this.channelId,generation:this.generation,revision:message.revision,ready:true});
        this.sendTeacherFocus();
        if(!wasReady){
          if(this.state.target.kind==='canvas')this.camera();
          this.scheduleInk(0);
        }
      }
      if(message.type==='media-status'&&message.generation===this.generation
        &&message.revision===this.preview?.scene.revision&&message.id===this.state.mediaId
        &&Number.isSafeInteger(message.sequence)&&message.sequence>=(this.mediaPlayback.get(message.id)?.commandSequence??0)
        &&validRoomVideoStatus(message.status)){
        this.mediaPlayback.set(message.id,{playing:message.status.playing,position:message.status.position,volume:message.status.volume,commandSequence:message.sequence,updatedAt:Date.now()});
        reportRoomVideoStatus(message.id,message.status);
      }
      if (message.type==='closed') this.stop(false);
      if(message.type==='media-fullscreen-exit'&&message.generation===this.generation
        &&message.id===this.state.mediaFullscreenId)this.setMediaFullscreen(message.id,false);
      if (message.type==='media-error' && message.generation===this.generation
        && this.state.mediaId===message.id)
        this.update({ready:false,error:message.message});
      if (message.type==='ink-commit' && validRoomInkCommand(message)) {
        if(this.pendingActions.length>=32){
          this.channel?.postMessage({type:'ink-result',channel:this.channelId,generation:message.generation,
            id:message.id,accepted:false,error:'Zu viele Striche warten auf die Übernahme.',afterRevision:this.revision});
          return;
        }
        this.pendingActions.push({command:message,receivedAt:Date.now()});
        this.flushRoomActions();
      }
      if (message.type==='history' && validRoomHistoryCommand(message)) {
        if(this.pendingActions.length>=32){
          this.channel?.postMessage({type:'history-error',channel:this.channelId,generation:message.generation,
            error:'Zu viele Schritte warten. Bitte kurz warten.'});
          return;
        }
        this.pendingActions.push({command:message,receivedAt:Date.now()});
        this.flushRoomActions();
      }
      if(message.type==='object-edit'&&validRoomObjectCommand(message)){
        if(this.pendingActions.length>=32){
          this.channel?.postMessage({type:'object-error',channel:this.channelId,generation:message.generation,
            error:'Zu viele Raumaktionen warten. Bitte kurz warten.'});
          return;
        }
        this.pendingActions.push({command:message,receivedAt:Date.now()});
        this.flushRoomActions();
      }
      if(message.type==='timer-action'&&validRoomTimerCommand(message)){
        if(message.action.type==='duration'||message.action.type==='sound'){
          if(this.pendingActions.length>=32){
            this.channel?.postMessage({type:'timer-error',channel:this.channelId,generation:this.generation,error:'Zu viele Raumaktionen warten. Bitte kurz warten.'});
            return;
          }
          this.pendingActions.push({command:message,receivedAt:Date.now()});this.flushRoomActions();
        }else this.applyTimerCommand(message);
      }
      if(message.type==='material-state'&&validRoomMaterialStateCommand(message)){
        let error:string|null=null;
        try{
          if(!this.state.active||!this.state.ready||message.generation!==this.generation)
            throw new Error('Die Raumansicht hat sich geändert.');
          const visible=this.preview?.scene.generation===this.generation
            ?(this.preview.scene.materials as RoomInteractiveMaterial[]|undefined)?.find(material=>material.instanceId===message.instanceId):null;
          if(!visible?.roomLocalId)throw new Error('Das Arbeitsblatt wird vorne nicht mehr gezeigt.');
          const current=getInteractiveHtmlState(visible.roomLocalId);
          if(current===null)throw new Error('Das Arbeitsblatt ist auf der Lehrerfläche noch nicht bereit.');
          const merged=mergeRoomMaterialState(message.baseState,message.state,current);
          if(JSON.stringify(merged)!==JSON.stringify(current)&&!this.projector.applyMaterialState(message.instanceId,merged))
            throw new Error('Das Arbeitsblatt konnte nicht aktualisiert werden.');
        }catch(failure){error=failure instanceof Error?failure.message:'Die Eingabe konnte nicht übernommen werden.';}
        if(error){
          this.channel?.postMessage({type:'material-error',channel:this.channelId,generation:message.generation,
            instanceId:message.instanceId,error});
          this.schedule(0);
        }
      }
    };
    this.stopVideoCommands=subscribeRoomVideoCommands((id,action)=>this.commandVideo(id,action));
    this.mediaLeaseTimer=setInterval(()=>{if(this.state.active&&this.state.mediaId&&!this.missingTarget&&!this.state.error
      &&this.api?.getSceneElements().some(element=>element.id===this.state.mediaId&&isRoomMediaElement(element)))this.channel?.postMessage({type:'media-lease',channel:this.channelId,generation:this.generation,id:this.state.mediaId});},500);
    this.sharedViewport=getPublicViewport(this.api);
    this.update({active:true,ready:false,target:canvasTarget,error:null});
    this.stopScroll=subscribeInteractiveHtmlScroll((localId,offset)=>this.sendScroll(localId,offset));
    this.stopFocus=subscribeInteractiveHtmlFocus(()=>this.sendTeacherFocus());
    try {
      if (isTauri()) {
        this.unlisten=await listen('room-canvas-closed',()=>this.stop(false));
        await invoke('open_room_canvas',{channel:channelId});
      } else {
        this.browserWindow=window.open(`/room.html?channel=${channelId}`,'tafelraum-room-canvas');
        if (!this.browserWindow) throw new Error('Das Raumfenster wurde blockiert.');
        this.windowTimer=setInterval(()=>{if(this.browserWindow?.closed)this.stop(false);},750);
      }
      this.schedule(0);
    } catch(error) {
      this.stop(false);
      this.update({error:error instanceof Error?error.message:'Fenster konnte nicht geöffnet werden.'});
    }
  }

  async showWindow() {
    if (!this.state.active) return;
    if (isTauri()) await invoke('open_room_canvas',{channel:this.channelId});
    else this.browserWindow?.focus();
  }

  stop(closeWindow=true) {
    return this.stopping??=(this.finishStop(closeWindow).finally(()=>{this.stopping=null;}));
  }
  private async finishStop(closeWindow:boolean){
    if (!this.state.active && !this.channel) return;
    if(this.htmlPlayback?.hasOutputs)await this.htmlPlayback.pauseAndFlush();
    this.htmlPlayback?.dispose();this.htmlPlayback=null;
    this.epoch++;clearTimeout(this.timer);this.timer=undefined;clearTimeout(this.inspectionTimer);this.inspectionTimer=undefined;
    clearTimeout(this.inkTimer);this.inkTimer=undefined;this.inkPreviewId=null;this.inkWire=null;
    clearTimeout(this.actionFlushTimer);this.actionFlushTimer=undefined;this.pendingActions=[];
    this.roomHistory.clear();this.roomHistoryState='';
    this.stopVideoCommands?.();this.stopVideoCommands=null;
    clearInterval(this.mediaLeaseTimer);this.mediaLeaseTimer=undefined;
    clearInterval(this.windowTimer);this.windowTimer=undefined;this.dirty=false;
    this.channel?.close();this.channel=null;this.receiverReady=false;
    this.unlisten?.();this.unlisten=null;
    this.stopScroll?.();this.stopScroll=null;
    this.stopFocus?.();this.stopFocus=null;
    this.previewPointer.set(null);
    if (closeWindow) {
      if (isTauri()) void invoke('close_room_canvas').catch(()=>undefined);
      else this.browserWindow?.close();
    }
    this.browserWindow=null;this.channelId='';this.sharedViewport=null;this.sentAssets.clear();this.missingTarget=false;this.neutralRevision=0;this.pendingPreview=null;
    this.mediaPlayback.clear();clearRoomVideoStatus();
    this.mediaAttempt=0;
    this.projector.stop();this.projector=createPublicProjector(() => this.materialChanged(), () => ({mode:'locked',participantIds:[]}), 'room');
    this.fullProjection=null;this.materialProjection=null;this.sceneTracker=new SceneChangeTracker();this.lastFiles.clear();this.generation++;this.revision=0;
    this.update({active:false,ready:false,target:canvasTarget,mediaId:null,mediaFullscreenId:null,screen:null});this.setPreview(null);
    setHtmlPlaybackRoomActive(false);
  }

  dispose() {this.stop();this.unsubscribes.forEach(stop=>stop());this.unsubscribes=[];this.projector.stop();this.attachTimers(null);}
  private engineScene(elements:readonly ExcalidrawElement[]){
    return this.api?.getAppState().activeTool?.type==='eraser'?withTemporaryEraserState(elements):elements;
  }
  private flushRoomActions() {
    if(this.actionFlushTimer!==undefined)return;
    const api=this.api;
    if(api&&this.pendingActions.length){
      const state=api.getAppState();
      if(this.inkPreviewId||this.timerRuntime?.isConfigurationBusy()||state.newElement||state.editingTextElement||state.selectedElementsAreBeingDragged||state.isResizing||state.isRotating){
        const expired=this.pendingActions.filter(entry=>Date.now()-entry.receivedAt>5_000);
        if(expired.length){
          this.pendingActions=this.pendingActions.filter(entry=>Date.now()-entry.receivedAt<=5_000);
          for(const {command} of expired){
            if(command.type==='ink-commit')this.channel?.postMessage({type:'ink-result',channel:this.channelId,
              generation:command.generation,id:command.id,accepted:false,
              error:'Die Lehrkraft bearbeitet gerade die Fläche. Bitte erneut zeichnen.',afterRevision:this.revision});
            else this.channel?.postMessage({type:command.type==='object-edit'?'object-error':command.type==='timer-action'?'timer-error':'history-error',channel:this.channelId,generation:command.generation,
              error:'Die Lehrkraft bearbeitet gerade die Fläche. Bitte erneut versuchen.'});
          }
        }
        if(!this.pendingActions.length)return;
        this.actionFlushTimer=setTimeout(()=>{this.actionFlushTimer=undefined;this.flushRoomActions();},32);
        return;
      }
    }
    while(this.pendingActions.length){
      const {command}=this.pendingActions.shift()!;
      if(command.type==='timer-action'){this.applyTimerCommand(command);continue;}
      if(command.type==='history'){
        let error:string|null=null;
        try{
          if(!this.state.active||!api||command.generation!==this.generation)throw new Error('Die Raumansicht hat sich geändert.');
          const source=withoutTemporaryEraserState(api.getSceneElementsIncludingDeleted());
          const next=this.roomHistory.apply(command.action,source);
          if(next){
            api.updateScene({elements:this.engineScene(attachNewAnnotationsToCanvasTargets(next,new Set()).elements),
              captureUpdate:CaptureUpdateAction.NEVER});
            this.inspectChanged();
          }
        }catch(failure){error=failure instanceof Error?failure.message:'Der Schritt konnte nicht zurückgesetzt werden.';}
        if(error)this.channel?.postMessage({type:'history-error',channel:this.channelId,generation:command.generation,error});
        this.sendRoomHistoryState(true);
        continue;
      }
      if(command.type==='object-edit'){
        let error:string|null=null;
        try{
          if(!this.state.active||!api||command.generation!==this.generation||!this.state.ready)
            throw new Error('Die Raumansicht hat sich geändert.');
          const target=this.state.target;
          const targetId=target.kind==='clip'?target.clip.id:target.kind==='material'?target.id:null;
          if(this.missingTarget||command.target.mode!==(target.kind==='canvas'?'free':'clip')||command.target.id!==targetId
            ||command.revision!==this.roomObjectsRevision)
            throw new Error('Der gezeigte Ausschnitt hat sich geändert.');
          const visible=new Map(this.roomObjects.map(object=>[object.id,object]));
          const source=withoutTemporaryEraserState(api.getSceneElementsIncludingDeleted());
          const changes=command.objects.flatMap(({id,version})=>{
            const projected=visible.get(id);
            const original=projected&&source.find(element=>element.id===projected.sourceId&&!element.isDeleted);
            if(!projected||!original||original.version!==version||projected.version!==version)
              throw new Error('Das Objekt wurde inzwischen verändert. Bitte erneut auswählen.');
            if(command.action==='erase'){
              if(!projected.erasable||!isErasableInk(original))throw new Error('Der Radierer entfernt nur Stift- und Markerstriche.');
              return [{original,updated:newElementWith(original,{isDeleted:true})}];
            }
            const htmlIds=new Set(this.roomObjects.map(object=>object.sourceId));
            const scrollOffsets=new Map((command.htmlScroll??[]).map(entry=>{
              if(!htmlIds.has(entry.materialId)||!source.some(element=>element.id===entry.materialId&&element.customData?.materialKind==='interactive-html'))
                throw new Error('Das Arbeitsblatt ist nicht mehr sichtbar.');
              return [entry.materialId,entry.offset] as const;
            }));
            const targets=source.filter(element=>!isMaterialAnnotationTarget(element)||htmlIds.has(element.id));
            return transformRoomAnnotation(original,source,command.geometry!,scrollOffsets,targets);
          });
          const replacements=new Map(changes.map(({original,updated})=>[original.id,updated]));
          const next=source.map(element=>replacements.get(element.id)??element);
          api.updateScene({elements:this.engineScene(next),captureUpdate:CaptureUpdateAction.NEVER});
          this.roomHistory.recordChanges(changes.map(({original,updated})=>({before:original,after:updated})));
          this.sendRoomHistoryState(true);
          this.inspectChanged();
        }catch(failure){error=failure instanceof Error?failure.message:'Das Objekt konnte nicht bearbeitet werden.';}
        if(error)this.channel?.postMessage({type:'object-error',channel:this.channelId,generation:command.generation,error});
        continue;
      }
      let error:string|null=null;
      try{
        if(!this.state.active||!api||command.generation!==this.generation)throw new Error('Die Raumansicht hat sich geändert.');
        const target=this.state.target;
        const targetId=target.kind==='clip'?target.clip.id:target.kind==='material'?target.id:null;
        if(this.missingTarget||command.target.mode!==(target.kind==='canvas'?'free':'clip')||command.target.id!==targetId)
          throw new Error('Der gezeigte Ausschnitt hat sich geändert.');
        const source=withoutTemporaryEraserState(api.getSceneElementsIncludingDeleted());
        if(!source.some(element=>element.id===command.id)){
          const material=target.kind==='material'?source.find(element=>element.id===target.id&&!element.isDeleted):null;
          if(target.kind==='material'&&!material)throw new Error('Das Material ist nicht mehr auf der Fläche.');
          const bounds=target.kind==='clip'?target.clip:material;
          if(bounds&&command.points.some(([x,y])=>x<bounds.x-1||y<bounds.y-1
            ||x>bounds.x+bounds.width+1||y>bounds.y+bounds.height+1))
            throw new Error('Der Strich liegt außerhalb des gezeigten Bereichs.');
          const element=roomInkElement(command);
          const requested=command.htmlScroll;
          const scrollMaterial=requested&&source.find(candidate=>candidate.id===requested.materialId&&!candidate.isDeleted
            &&candidate.customData?.materialKind==='interactive-html'
            &&command.points[0][0]>=candidate.x&&command.points[0][0]<=candidate.x+candidate.width
            &&command.points[0][1]>=candidate.y&&command.points[0][1]<=candidate.y+candidate.height);
          const scrollOffsets=scrollMaterial?new Map([[scrollMaterial.id,requested!.offset]])
            :material?.customData?.materialKind==='interactive-html'
              ?new Map([[material.id,getInteractiveHtmlScroll(material.id)]]):undefined;
          const next=attachNewAnnotationsToCanvasTargets([...source,element],new Set([element.id]),scrollOffsets).elements;
          api.updateScene({elements:this.engineScene(next),captureUpdate:CaptureUpdateAction.NEVER});
          this.roomHistory.record(next.find(candidate=>candidate.id===element.id)!);
          this.sendRoomHistoryState(true);
          this.inspectChanged();
        }
      }catch(failure){error=failure instanceof Error?failure.message:'Der Strich konnte nicht übernommen werden.';}
      this.channel?.postMessage({type:'ink-result',channel:this.channelId,generation:command.generation,
        id:command.id,accepted:!error,error,afterRevision:this.revision});
    }
  }
  attachPointer(pointer:HostPointerChannel) {
    this.stopPointer?.();
    const send=()=>{
      const value=pointer.current?.pointer?.tool==='laser'?pointer.current.pointer:null;
      this.previewPointer.set(this.state.active?{type:'pointer',generation:this.generation,pointer:value}:null);
      if(!this.state.active||!this.receiverReady)return;
      this.channel?.postMessage({type:'pointer',channel:this.channelId,generation:this.generation,pointer:value});
    };
    this.stopPointer=pointer.subscribe(send);
    return()=>{this.stopPointer?.();this.stopPointer=null;};
  }

  /** The editor's live stroke is sent as a bounded public point delta. A full
   * projection at pointer-up remains the authoritative scene. */
  setInkPreview=(id:string|null)=>{
    if(this.inkPreviewId===id)return;
    if(!this.state.active){this.inkPreviewId=id;return;}
    const previous=this.inkPreviewId;
    clearTimeout(this.inkTimer);this.inkTimer=undefined;
    clearTimeout(this.inspectionTimer);this.inspectionTimer=undefined;
    if(id){this.inkPreviewId=id;this.scheduleInk(0);return;}
    this.flushInk();this.inkPreviewId=null;
    if(previous&&!this.api?.getSceneElements().some(element=>element.id===previous&&!element.isDeleted)
      &&this.inkWire?.localId===previous){
      this.channel?.postMessage({type:'ink',channel:this.channelId,patch:{type:'patch',channel:'ink',generation:this.generation,
        id:this.inkWire.id,baseRevision:this.inkWire.revision,revision:this.inkWire.revision+1,operation:'cancel'} satisfies InkPreviewPatch});
      this.inkWire=null;
    }
    this.lastInspectionAt=Date.now();
    this.inspectionTimer=setTimeout(()=>{
      this.inspectionTimer=undefined;this.inspectChanged();
      if(this.dirty)this.schedule(0);
    },0);
  };

  private scheduleInk(delay?:number){
    if(!this.inkPreviewId||this.inkTimer!==undefined||!this.state.active||!this.receiverReady||!this.state.ready
      ||this.state.target.kind==='material')return;
    const wait=delay??Math.max(0,34-(performance.now()-this.lastInkAt));
    this.inkTimer=setTimeout(()=>{this.inkTimer=undefined;this.flushInk();},wait);
  }

  private flushInk(){
    if(!this.api||!this.inkPreviewId||!this.state.active||!this.receiverReady||!this.state.ready
      ||this.state.target.kind==='material')return;
    const source=this.api.getSceneElements().find(element=>element.id===this.inkPreviewId&&!element.isDeleted);
    if(!source||!('points' in source))return;
    let element:PublicElement;
    try{element=this.projector.projectInk(source);}catch{return;}
    const previous=this.inkWire?.localId===source.id?this.inkWire:null;
    let start=0,endBefore=0,endAfter=element.points?.length??0;
    if(previous&&previous.element.type===element.type){
      const before=previous.element.points??[],after=element.points??[];
      const same=(index:number)=>before[index][0]===after[index][0]&&before[index][1]===after[index][1]
        &&previous.element.pressures?.[index]===element.pressures?.[index];
      while(start<before.length&&start<after.length&&same(start))start++;
      endBefore=before.length;endAfter=after.length;
      if(start===before.length&&start===after.length&&previous.element.version===element.version)return;
    }
    const revision=(previous?.revision??0)+1;
    const replacement:PublicElement={...element,points:(element.points??[]).slice(start,endAfter),
      ...(element.pressures?{pressures:element.pressures.slice(start,endAfter)}:{})};
    const patch:InkPreviewPatch={type:'patch',channel:'ink',generation:this.generation,id:element.id,
      baseRevision:previous?.revision??0,revision,operation:'upsert',pointStart:start,
      pointDeleteCount:previous?endBefore-start:0,element:replacement};
    this.channel?.postMessage({type:'ink',channel:this.channelId,patch});
    this.inkWire={localId:source.id,id:element.id,revision,element};this.lastInkAt=performance.now();
  }

  showClip(clip:ClipFrame) {this.setTarget({kind:'clip',clip});}
  moveClip(clip:ClipFrame) {if(this.state.target.kind==='clip'&&this.state.target.clip.id===clip.id)this.setTarget({kind:'clip',clip});}
  showMaterial(id:string,title:string,cueId?:string,number?:number) {
    this.setTarget({kind:'material',id,title,...(cueId?{cueId,number}:{})});
  }
  setMediaFullscreen(id:string,active:boolean) {
    if(!this.state.active||!this.api)return;
    const element=this.api.getSceneElements().find(element=>element.id===id&&!element.isDeleted);
    if(active&&(!element||!isRoomMediaElement(element)))return;
    if(!active&&this.state.mediaFullscreenId!==id)return;
    if(active)this.selectMedia(id);
    this.update({mediaFullscreenId:active?id:null,ready:false,error:null});
    this.schedule(0);
  }
  private commandVideo(id:string,action:RoomVideoCommand){
    if(!this.state.active||!this.api||!validRoomVideoCommand(action))return;
    const element=this.api.getSceneElements().find(e=>e.id===id&&isRoomMediaElement(e));if(!element)return;
    if(action.type==='play')this.startMedia(element);
    const previous=this.mediaPlayback.get(id)??{playing:false,position:0,updatedAt:Date.now(),volume:1};
    const sequence=(previous.commandSequence??0)+1;
    const position=action.type==='seek'?Math.max(0,Math.min(86400,action.value))
      :previous.position+(previous.playing?Math.max(0,(Date.now()-previous.updatedAt)/1000):0);
    const next={playing:action.type==='play'?true:action.type==='pause'?false:action.type==='seek'?action.playing:previous.playing,
      position,volume:action.type==='volume'?Math.max(0,Math.min(1,action.value)):previous.volume??1,
      updatedAt:Date.now(),commandSequence:sequence};
    this.mediaPlayback.set(id,next);
    if(this.state.mediaId===id)this.channel?.postMessage({type:'media-command',channel:this.channelId,generation:this.generation,id,sequence,action});
  }
  playMedia(id:string,playing:boolean,position:number,volume?:number) {
    if(!this.state.active||!this.api)return;
    const element=this.api.getSceneElements().find(element=>element.id===id&&!element.isDeleted);
    if(!element||!isRoomMediaElement(element))return;
    if(playing&&!this.mediaPlayback.get(id)?.playing)this.startMedia(element);
    this.setMediaPlayback(id,playing,position,volume);
  }
  private startMedia(element:ExcalidrawElement){
    if(this.state.mediaId===element.id)return;
    if(!roomTargetContainsMedia(this.state.target,element)||this.state.mediaFullscreenId)
      this.showMaterial(element.id,String(element.customData?.sourceTitle??'Material'));
    this.selectMedia(element.id);
  }
  private selectMedia(id:string|null){
    const previousId=this.state.mediaId;
    if(previousId===id)return;
    if(previousId){
      const previous=this.mediaPlayback.get(previousId);
      if(previous?.playing){
        const now=Date.now();
        this.mediaPlayback.set(previousId,{...previous,playing:false,
          position:previous.position+Math.max(0,(now-previous.updatedAt)/1000),updatedAt:now});
      }
      pauseRoomVideoStatus(previousId);
    }
    this.update({mediaId:id});
    this.schedule(0);
  }
  setMediaPlayback(id:string, playing:boolean, position:number,volume?:number) {
    if(!this.state.active || !Number.isFinite(position) || position<0)return;
    const playback={playing,position,updatedAt:Date.now(),volume:Math.max(0,Math.min(1,volume??this.mediaPlayback.get(id)?.volume??1))};
    this.mediaPlayback.set(id,playback);
    if(this.state.mediaId!==id)return;
    this.channel?.postMessage({type:'media-playback',channel:this.channelId,generation:this.generation,id,...playback});
    if(this.preview?.roomMedia?.id===id)this.setPreview({...this.preview,roomMedia:{...this.preview.roomMedia,...playback}});
    if(this.pendingPreview?.value.roomMedia?.id===id)this.pendingPreview={...this.pendingPreview,
      value:{...this.pendingPreview.value,roomMedia:{...this.pendingPreview.value.roomMedia,...playback}}};
  }
  removed(id:string) {
    if(this.state.target.kind==='clip'&&this.state.target.clip.id===id) {
      this.missingTarget=true;this.update({ready:false,error:'Der gezeigte Clip wurde entfernt.'});this.setPreview(null);this.schedule(0);
    }
    if(this.state.target.kind==='material'&&this.state.target.id===id) {
      this.missingTarget=true;this.update({ready:false,error:'Das gezeigte Material wurde entfernt.'});this.setPreview(null);this.schedule(0);
    }
  }
  setCanvas() {this.setTarget(canvasTarget);}
  retry() {
    if(!this.state.active||this.missingTarget)return;
    this.mediaAttempt++;
    this.fullProjection=null;this.materialProjection=null;
    this.update({ready:false,error:null});this.schedule(0);
  }
  private setTarget(target:RoomTarget) {
    if(!this.state.active)return;
    const current=this.state.target;
    const targetChanged=current.kind!==target.kind
      || current.kind==='material'&&target.kind==='material'&&current.id!==target.id
      || current.kind==='clip'&&target.kind==='clip'&&current.clip.id!==target.clip.id;
    // Moving/resizing the same clip only changes its camera bounds. Keep live
    // HTML leases and the confirmed output intact until its next frame arrives.
    if(targetChanged)this.htmlPlayback?.clear();
    this.missingTarget=false;
    if(targetChanged){this.inkWire=null;this.channel?.postMessage({type:'ink-clear',channel:this.channelId,generation:this.generation});}
    // A preview is the last confirmed receiver frame. Once its display target
    // changes it must not masquerade as the currently selected material/clip.
    if(targetChanged){this.pendingPreview=null;this.setPreview(null);}
    if(this.state.target.kind==='canvas'&&target.kind!=='canvas'&&this.api)this.sharedViewport=getPublicViewport(this.api);
    if(this.state.target.kind!=='canvas'&&target.kind==='canvas'&&this.api&&this.sharedViewport){
      const appState=this.api.getAppState();
      if(appState.width&&appState.height)this.api.updateScene({
        appState:boundedCamera(appState,this.sharedViewport,true,0,3) as Pick<typeof appState,'scrollX'|'scrollY'|'zoom'>,
        captureUpdate:CaptureUpdateAction.NEVER,
      });
    }
    const elements=this.api?.getSceneElements()??[];
    const currentMedia=elements.find(element=>element.id===this.state.mediaId&&isRoomMediaElement(element));
    const visibleMedia=roomTargetMedia(elements,target,this.state.mediaId);
    // A clip changes the view. Keep the selected output available for Pause/Play
    // even when its video is outside the crop. Opening a specific video selects it.
    const keepOutput=currentMedia&&(!targetChanged||this.mediaPlayback.get(currentMedia.id)?.playing);
    this.selectMedia(target.kind==='material'&&visibleMedia?visibleMedia.id
      :keepOutput?currentMedia.id:visibleMedia?.id??null);
    this.update({target,mediaFullscreenId:null,ready:targetChanged?false:this.state.ready,error:null});this.schedule(0);
  }

  private changed() {
    if(!this.state.active||!this.api)return;
    if(this.inkPreviewId){this.scheduleInk();return;}
    if(this.inspectionTimer!==undefined)return;
    const elapsed=this.lastInspectionAt===null?33:Math.max(0,33-(Date.now()-this.lastInspectionAt));
    this.inspectionTimer=setTimeout(()=>{this.inspectionTimer=undefined;this.lastInspectionAt=Date.now();this.inspectChanged();},elapsed);
  }
  private inspectChanged() {
    if(!this.state.active||!this.api)return;
    this.sendRoomHistoryState();
    const elements=this.api.getSceneElements();const files=this.api.getFiles();
    if(this.state.mediaFullscreenId&&!elements.some(element=>element.id===this.state.mediaFullscreenId&&!element.isDeleted))
      this.setMediaFullscreen(this.state.mediaFullscreenId,false);
    const currentTarget=this.state.target;
    if(currentTarget.kind==='material'&&!elements.some(element=>element.id===currentTarget.id&&!element.isDeleted)){
      this.missingTarget=true;this.update({ready:false,error:'Das gezeigte Material wurde entfernt.'});this.setPreview(null);
    }
    const fileEntries=Object.entries(files);
    const filesChanged=this.lastFiles.size!==fileEntries.length||fileEntries.some(([id,file])=>{
      const previous=this.lastFiles.get(id);
      return !previous||previous.version!==file.version||previous.dataURL!==file.dataURL;
    });
    const sceneChanged=this.sceneTracker.changed(elements,this.api.getAppState().viewBackgroundColor);
    if(!sceneChanged&&!filesChanged)return;
    this.lastFiles=new Map(fileEntries.map(([id,file])=>[id,{version:file.version,dataURL:file.dataURL}]));
    this.sceneVersion++;this.fullProjection=null;this.materialProjection=null;
    this.schedule();
  }
  private materialChanged() {
    if(!this.state.active)return;
    this.sceneVersion++;this.fullProjection=null;this.materialProjection=null;
    this.schedule(0);
  }
  private camera() {
    if(!this.state.active||!this.receiverReady||!this.api||this.state.target.kind!=='canvas')return;
    const viewport=getPublicViewport(this.api);
    this.sharedViewport=viewport;
    this.channel?.postMessage({type:'camera',channel:this.channelId,generation:this.generation,viewport});
    const preview=this.preview;
    if(preview&&preview.scene.generation===this.generation&&preview.scene.presentation?.mode==='free')
      this.setPreview({...preview,scene:{...preview.scene,viewport}});
    if(this.pendingPreview?.value.scene.presentation?.mode==='free')
      this.pendingPreview={...this.pendingPreview,value:{...this.pendingPreview.value,
        scene:{...this.pendingPreview.value.scene,viewport}}};
  }
  private sendScroll(localId:string,offset:{x:number;y:number}) {
    if(!this.state.active||!this.receiverReady)return;
    this.channel?.postMessage({type:'html-scroll',channel:this.channelId,localId,offset});
  }
  private sendTeacherFocus() {
    if(!this.state.active||!this.receiverReady||!this.state.ready)return;
    const focus=getInteractiveHtmlFocus();
    const visible=this.preview?.scene.generation===this.generation
      ?(this.preview.scene.materials as RoomInteractiveMaterial[]|undefined)?.find(material=>material.roomLocalId===focus?.elementId):null;
    this.channel?.postMessage({type:'teacher-html-focus',channel:this.channelId,generation:this.generation,
      localId:visible?.roomLocalId??null,key:visible?focus?.key??null:null,
      active:visible?focus?.active??false:false,presence:visible?focus?.presence??null:null});
  }
  private schedule(delay=45) {
    if(!this.state.active||!this.receiverReady||!this.api)return;
    this.dirty=true;
    if(this.timer!==undefined)return;
    this.timer=setTimeout(()=>{this.timer=undefined;void this.publish();},delay);
  }
  private async publish() {
    if(this.projecting||!this.dirty||!this.api||!this.receiverReady||!this.state.active)return;
    // A queued/asynchronous full projection must not publish an unfinished
    // teacher stroke as canonical content. Keep dirty work for pointer-up;
    // the existing ink channel carries its expendable previews meanwhile.
    if(this.inkPreviewId)return;
    this.projecting=true;this.dirty=false;
    const epoch=this.epoch,api=this.api,baseTarget=this.state.target,fullscreenId=this.state.mediaFullscreenId,version=this.sceneVersion;
    const target:RoomTarget=fullscreenId?{kind:'material',id:fullscreenId,title:'Video'}:baseTarget;
    try {
      if(this.missingTarget){
        const bounds=target.kind==='clip'?target.clip:target.kind==='material'
          ? this.sharedViewport??getPublicViewport(api):getPublicViewport(api);
        const revision=++this.revision;
        const scene:Scene={generation:this.generation,revision,elements:[],assetIds:[],viewport:bounds,
          background:api.getAppState().viewBackgroundColor,materials:[],presentation:{mode:'clip',clip:{id:'missing',...bounds},revision,reset:revision}};
        this.pendingPreview=null;
        this.roomObjects=[];this.roomObjectsRevision=revision;
        this.channel?.postMessage({type:'frame',channel:this.channelId,scene,assets:[],objects:[]} satisfies RoomFrame);
        return;
      }
      let projection:PublicProjection;
      if(target.kind==='material') {
        if(this.materialProjection?.version===version&&this.materialProjection.id===target.id)projection=this.materialProjection.value;
        else {projection=await this.projector.project(api,target.id);this.materialProjection={version,id:target.id,value:projection};}
      } else if(this.fullProjection?.version===version)projection=this.fullProjection.value;
      else {projection=await this.projector.project(api);this.fullProjection={version,value:projection};}
      if(epoch!==this.epoch||!this.state.active||this.inkPreviewId||version!==this.sceneVersion||JSON.stringify(baseTarget)!==JSON.stringify(this.state.target)||fullscreenId!==this.state.mediaFullscreenId) {this.dirty=true;return;}
      const selected=target.kind==='material'?api.getSceneElements().find(element=>element.id===target.id&&!element.isDeleted):null;
      if(target.kind==='material'&&!selected){this.removed(target.id);return;}
      const elements=api.getSceneElements();
      const mediaElement=elements.find(element=>element.id===this.state.mediaId&&isRoomMediaElement(element))
        ??roomTargetMedia(elements,target,null);
      const currentMedia=mediaElement?roomMediaFromElement(mediaElement,elements,this.mediaPlayback.get(mediaElement.id)??{playing:false,position:0,updatedAt:Date.now()}):null;
      const outsideTarget=Boolean(mediaElement&&!roomTargetContainsMedia(target,mediaElement)
        &&(target.kind!=='canvas'||currentMedia?.kind==='youtube'));
      // A docked YouTube embed must stay visible. Do not reveal an intentional
      // cover just to move the player into the dock.
      const canShowMedia=currentMedia&&!(outsideTarget&&currentMedia.kind==='youtube'&&currentMedia.cover);
      const media=canShowMedia?{...currentMedia,attempt:this.mediaAttempt,outsideTarget}:null;
      this.selectMedia(media?.id??null);
      if(selected && ['audio','video','youtube'].includes(String(selected.customData?.materialKind)) && media?.id!==selected.id)
        throw new Error('Das Medium konnte nicht für Room Canvas vorbereitet werden.');
      const bounds:Viewport=target.kind==='clip'?target.clip:selected
        ? {x:selected.x,y:selected.y,width:selected.width,height:selected.height}:getPublicViewport(api);
      const revision=++this.revision;
      const scene:Scene={generation:this.generation,revision,elements:projection.elements as unknown as Scene['elements'],
        assetIds:projection.assetIds,viewport:bounds,background:projection.background,materials:projection.materials,
        presentation:target.kind==='canvas'?{mode:'free',clip:null,revision,reset:revision}
          :{mode:'clip',clip:{id:target.kind==='clip'?target.clip.id:target.id,x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},revision,reset:revision}};
      const newAssets=projection.assets.filter(asset=>!this.sentAssets.has(asset.id));
      this.roomObjects=projection.roomObjects??[];this.roomObjectsRevision=revision;
      this.roomTimerGeometry=projection.roomTimers??[];
      const timers=this.timerFrames();
      this.pendingPreview={revision,value:{scene,assets:projection.assets,materialBaseUrl:'/',renderVersion:revision,roomMedia:media,roomTimers:timers}};
      this.channel?.postMessage({type:'frame',channel:this.channelId,scene,assets:newAssets,media,mediaFullscreen:Boolean(fullscreenId),
        objects:this.roomObjects.map(({sourceId:_sourceId,...object})=>object),timers} satisfies RoomFrame);
      newAssets.forEach(asset=>this.sentAssets.add(asset.id));
      if(target.kind==='canvas')this.camera();
      for(const material of projection.materials)if(material.roomLocalId)this.sendScroll(material.roomLocalId,getInteractiveHtmlScroll(material.roomLocalId));
    } catch(error) {
      console.error('Room Canvas projection failed',error);
      if(epoch===this.epoch)this.update({ready:false,error:error instanceof Error?error.message:'Ansicht konnte nicht aktualisiert werden.'});
    } finally {this.projecting=false;if(this.dirty&&!this.inkPreviewId)this.schedule(0);}
  }
}
