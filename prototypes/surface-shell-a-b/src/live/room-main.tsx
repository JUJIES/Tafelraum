import { t, useUiLocale } from "../i18n";
import {validRoomVideoCommand,type RoomVideoCommand,type RoomVideoStatus} from './room-video-status';
import {previewRoomAnnotation,hideRoomAnnotations,type RoomObjectPreview} from './room-object-preview';
import {visibleRoomObject} from './room-object-edit';
import type { RoomTimerCommand, RoomTimerStateMessage } from "./room-timer";
import type { TimerAction, TimerWidget } from "../widgets/timer";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { ColoredPencilIcon } from '../icons/ColoredPencilIcon';
import { ToolInkOptions, markerColors, penColors, type ToolColorId } from '../ToolInkOptions';
import { defaultToolStrokeSizeId, toolStrokeWidth, type ToolStrokeSizeId } from '../canvas/tool-stroke-widths';
import { FluentHighlighterIcon, FluentToolbarIcon } from '../icons/FluentToolbarIcon';
import CanvasViewer from './LiveViewerCanvas';
import {installRoomHtmlPlaybackReceiver,type HostPlaybackMessage} from './room-html-playback';
import { RoomInkInput } from './RoomInkInput';
import { RoomObjectInput } from './RoomObjectInput';
import { clampRoomToolbarPosition, type RoomToolbarPosition, type RoomToolbarSize } from './room-toolbar-position';
import type { RoomInteractiveMaterial } from '../canvas/interactive-html-live';
import type { RoomHtmlFocusMessage } from './room-html-focus';
import { readInteractiveHtmlTextPresence, type InteractiveHtmlTextPresence } from '../canvas/interactive-html-focus';
import type { ExternalInkCommit } from '../canvas/useInkInput';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { RoomInkCommand } from './room-ink';
import type { RoomHistoryCommand, RoomHistoryState } from './room-history';
import type { RoomMedia } from './room-media';
import type { RoomObjectCommand, RoomObjectGeometry, RoomVisibleObject } from './room-object-edit';
import { createHostPointerChannel } from './host-pointer-channel';
import { canvasBackgrounds, type Theme, type ThemeVariant } from '../theme-preferences';
import { applyInkPreviewPatch, type InkPreviewPatch, type Scene, type Viewport, type HostPointer, type LiveInteractiveMaterial, type JsonValue } from '../../../../shared/live-canvas/protocol';
import type { RoomMaterialStateCommand } from './room-material-state';
import '@excalidraw/excalidraw/index.css';
import './live-viewer.css';
import './room-view.css';

type FrameMessage={type:'frame';channel:string;scene:Scene;assets:{id:string;blob:Blob}[];media?:RoomMedia|null;mediaFullscreen?:boolean;objects:RoomVisibleObject[];timers?:TimerWidget[]};
type MediaPlaybackMessage={type:'media-playback';channel:string;generation:number;id:string;playing:boolean;position:number;updatedAt:number;volume?:number};
type CameraMessage={type:'camera';channel:string;generation:number;viewport:Viewport};
type ScrollMessage={type:'html-scroll';channel:string;localId:string;offset:{x:number;y:number}};
type TeacherFocusMessage={type:'teacher-html-focus';channel:string;generation:number;localId:string|null;key:string|null;active:boolean;presence:InteractiveHtmlTextPresence|null};
type PointerMessage={type:'pointer';channel:string;generation:number;pointer:HostPointer|null};
type InkMessage={type:'ink';channel:string;patch:InkPreviewPatch};
type InkClearMessage={type:'ink-clear';channel:string;generation:number};
type InkResultMessage={type:'ink-result';channel:string;generation:number;id:string;accepted:boolean;error:string|null;afterRevision:number};
type HistoryStateMessage={type:'history-state';channel:string;generation:number}&RoomHistoryState;
type HistoryErrorMessage={type:'history-error';channel:string;generation:number;error:string};
type ObjectErrorMessage={type:'object-error';channel:string;generation:number;error:string};
type MaterialErrorMessage={type:'material-error';channel:string;generation:number;instanceId:string;error:string};
type InnerScroll={path:number[];x:number;y:number};
const channelId=new URLSearchParams(location.search).get('channel')??'';

function RoomView() {
  useUiLocale();
  const [scene,setScene]=useState<Scene|null>(null);
  const [timers,setTimers]=useState<TimerWidget[]>([]);
  const [media,setMedia]=useState<RoomMedia|null>(null);
  const [mediaFullscreen,setMediaFullscreen]=useState(false);
  const mediaFullscreenRef=useRef(false);mediaFullscreenRef.current=mediaFullscreen;
  const mediaLease=useRef(0);
  const mediaRef=useRef(media);mediaRef.current=media;
  const windowFullscreenBeforeVideo=useRef<boolean|null>(null);
  const windowFullscreenQueue=useRef(Promise.resolve());
  const [renderVersion,setRenderVersion]=useState(0);
  const [urls,setUrls]=useState<Record<string,string>>({});
  const [fullscreen,setFullscreen]=useState(false);
  const fullscreenRef=useRef(false);fullscreenRef.current=fullscreen;
  const setRoomFullscreen=useCallback((active:boolean)=>{
    const operation=windowFullscreenQueue.current.catch(()=>{}).then(async()=>{
      if(isTauri()){
        const room=getCurrentWindow();await room.setFullscreen(active);
        fullscreenRef.current=await room.isFullscreen();setFullscreen(fullscreenRef.current);
      }else{
        if(active&&!document.fullscreenElement)await document.documentElement.requestFullscreen();
        else if(!active&&document.fullscreenElement)await document.exitFullscreen();
        fullscreenRef.current=Boolean(document.fullscreenElement);setFullscreen(fullscreenRef.current);
      }
    });
    windowFullscreenQueue.current=operation.catch(()=>{});return operation;
  },[]);
  const [toolsOpen,setToolsOpen]=useState(false);
  const [tool,setTool]=useState<'hand'|'pen'|'marker'|'eraser'|'selection'>('hand');
  const [editableObjects,setEditableObjects]=useState<RoomVisibleObject[]>([]);
  const objectPreview=useRef<RoomObjectPreview|null>(null);
  const previewSequence=useRef(0);
  const transformTimeout=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const [penColorId,setPenColorId]=useState<ToolColorId>('neutral');
  const [markerColorId,setMarkerColorId]=useState<ToolColorId>('yellow');
  const [penSizeId,setPenSizeId]=useState<ToolStrokeSizeId>(defaultToolStrokeSizeId);
  const [markerSizeId,setMarkerSizeId]=useState<ToolStrokeSizeId>(defaultToolStrokeSizeId);
  const [openInkTool,setOpenInkTool]=useState<'pen'|'marker'|null>(null);
  const [toolbarPosition,setToolbarPosition]=useState<RoomToolbarPosition|null>(null);
  const [toolbarDragging,setToolbarDragging]=useState(false);
  const toolbarRef=useRef<HTMLDivElement>(null);
  const toolbarDrag=useRef<{pointerId:number;startX:number;startY:number;origin:RoomToolbarPosition;size:RoomToolbarSize}|null>(null);
  const [roomReady,setRoomReady]=useState(false);
  const [htmlInputReady,setHtmlInputReady]=useState(false);
  const [inkError,setInkError]=useState<string|null>(null);
  const [historyState,setHistoryState]=useState<RoomHistoryState>({undo:false,redo:false});
  const [pendingInkIds,setPendingInkIds]=useState<string[]>([]);
  const [viewerApi,setViewerApi]=useState<ExcalidrawImperativeAPI|null>(null);
  const [activeInkId,setActiveInkId]=useState<string|null>(null);
  const channelRef=useRef<BroadcastChannel|null>(null);
  const assets=useRef(new Map<string,string>());
  const scroll=useRef(new Map<string,{x:number;y:number}>());
  const roomScroll=useRef(new Map<string,{x:number;y:number}>());
  const innerScroll=useRef(new Map<string,InnerScroll[]>());
  const locallyScrolled=useRef(new Set<string>());
  const pointer=useRef(createHostPointerChannel());
  const sceneRef=useRef<Scene|null>(null);
  const roomFocus=useRef<Pick<RoomHtmlFocusMessage,'instanceId'|'key'|'active'|'presence'>|null>(null);
  const teacherFocus=useRef<{localId:string;key:string;active:boolean;presence:InteractiveHtmlTextPresence|null}|null>(null);
  const targetMotion=useRef<{generation:number;revision:number;dx:number;dy:number}|null>(null);
  const runningTargetMotion=useRef<Animation|null>(null);
  const inkPreviews=useRef(new Map<string,{revision:number;element:Scene['elements'][number]}>());
  const pendingInk=useRef(new Map<string,{timer:ReturnType<typeof setTimeout>;afterRevision:number|null}>());
  const eraseDraft=useRef(new Map<string,number>());
  const pendingErase=useRef(new Map<string,{version:number;timer:ReturnType<typeof setTimeout>}>());
  const clearErase=()=>{
    eraseDraft.current.clear();
    for(const entry of pendingErase.current.values())clearTimeout(entry.timer);
    pendingErase.current.clear();
  };
  const compose=(base:Scene):Scene=>{
    const hidden=new Set([...eraseDraft.current.keys(),...pendingErase.current.keys()]);
    base=hideRoomAnnotations(previewRoomAnnotation(base,objectPreview.current,new Map([...scroll.current,...roomScroll.current])),hidden);
    if(!inkPreviews.current.size)return base;
    const present=new Set(base.elements.map(element=>element.id));
    return {...base,elements:[...base.elements.map(element=>inkPreviews.current.get(element.id)?.element??element),
      ...[...inkPreviews.current.values()].filter(preview=>!present.has(preview.element.id)).map(preview=>preview.element)]};
  };
  const refreshErasePreview=()=>{
    if(sceneRef.current)setScene({...compose(sceneRef.current),coverTransition:undefined});
    setRenderVersion(value=>value+1);
  };
  const onErasePreview=(objects:RoomVisibleObject[])=>{
    eraseDraft.current=new Map(objects.map(object=>[object.id,object.version]));
    refreshErasePreview();
  };
  const onObjectPreview=(object:RoomVisibleObject|null,geometry?:RoomObjectGeometry)=>{
    if(!object&&!objectPreview.current)return;
    if(!object)clearTimeout(transformTimeout.current);
    objectPreview.current=object&&geometry?{object,geometry,revision:++previewSequence.current}:null;
    refreshErasePreview();
  };
  const sendRoomFocus=useCallback((focus:typeof roomFocus.current)=>{
    roomFocus.current=focus;
    const current=sceneRef.current;
    if(!current||!channelRef.current)return;
    channelRef.current.postMessage({type:'room-html-focus',channel:channelId,generation:current.generation,revision:current.revision,
      instanceId:focus?.instanceId??null,key:focus?.key??null,active:focus?.active??false,presence:focus?.presence??null} satisfies RoomHtmlFocusMessage);
  },[]);
  const showTeacherFocus=useCallback(()=>{
    const focus=teacherFocus.current;
    for(const frame of document.querySelectorAll<HTMLIFrameElement>('[data-room-material-id] iframe')){
      const localId=frame.closest<HTMLElement>('[data-room-material-id]')?.dataset.roomMaterialId;
      frame.contentWindow?.postMessage({type:'tafelraum:interactive-teacher-focus',
        key:focus&&localId===focus.localId?focus.key:null,
        active:focus&&localId===focus.localId?focus.active:false,
        presence:focus&&localId===focus.localId?focus.presence:null},'*');
    }
  },[]);
  const onReady=useCallback((generation:number,revision:number)=>{
    if(sceneRef.current?.generation===generation&&sceneRef.current.revision===revision){
      setRoomReady(true);
      const motion=targetMotion.current;
      if(motion?.generation===generation&&revision>=motion.revision){
        targetMotion.current=null;
        const canvas=document.querySelector<HTMLElement>('.room-view .live-view-canvas');
        if(canvas&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
          runningTargetMotion.current?.cancel();
          const animation=canvas.animate([
            {opacity:0.42,transform:`translate(${motion.dx}px, ${motion.dy}px) scale(1.025)`},
            {opacity:1,transform:'translate(0, 0) scale(1)'}
          ],{duration:360,easing:'cubic-bezier(.18,.72,.22,1)',fill:'none'});
          runningTargetMotion.current=animation;
          animation.onfinish=()=>{if(runningTargetMotion.current===animation)runningTargetMotion.current=null;};
        }
      }
    }
    for(const [id,offset] of scroll.current){
      const frame=document.querySelector<HTMLElement>(`[data-room-material-id="${CSS.escape(id)}"] iframe`) as HTMLIFrameElement|null;
      const local=locallyScrolled.current.has(id);
      const position=local?roomScroll.current.get(id)??offset:offset;
      frame?.contentWindow?.postMessage({type:'tafelraum:interactive-room-scroll',scrollX:position.x,scrollY:position.y},'*');
      if(local)frame?.contentWindow?.postMessage({type:'tafelraum:interactive-room-restore',entries:innerScroll.current.get(id)??[]},'*');
    }
    showTeacherFocus();
    channelRef.current?.postMessage({type:'shown',channel:channelId,generation,revision});
    sendRoomFocus(roomFocus.current);
  },[showTeacherFocus,sendRoomFocus]);
  const onVideoStatus=useCallback((id:string,status:RoomVideoStatus,sequence:number)=>{
    setMedia(current=>current?.id===id&&sequence>=(current.command?.sequence??current.commandSequence??0)&&current.playing!==status.playing?{...current,playing:status.playing}:current);
    const current=sceneRef.current;
    if(current)channelRef.current?.postMessage({type:'media-status',channel:channelId,generation:current.generation,revision:current.revision,id,status,sequence});
  },[]);
  const onMediaError=useCallback((id:string,message:string)=>{
    const current=sceneRef.current;
    if(current)channelRef.current?.postMessage({type:'media-error',channel:channelId,generation:current.generation,id,message});
  },[]);
  const onRoomInkCommit=useCallback((stroke:ExternalInkCommit)=>{
    const current=sceneRef.current;
    if(!current||!channelRef.current)return;
    setInkError(null);
    const hit=(current.materials as RoomInteractiveMaterial[]|undefined)?.find(material=>material.roomLocalId&&stroke.points[0]
      &&stroke.points[0][0]>=material.x&&stroke.points[0][0]<=material.x+material.width
      &&stroke.points[0][1]>=material.y&&stroke.points[0][1]<=material.y+material.height);
    const materialId=hit?.roomLocalId;
    const command:RoomInkCommand={type:'ink-commit',channel:channelId,generation:current.generation,
      target:current.presentation?.mode==='clip'
        ?{mode:'clip',id:current.presentation.clip?.id??null}:{mode:'free',id:null},...stroke,
      ...(materialId&&roomScroll.current.has(materialId)
        ?{htmlScroll:{materialId,offset:roomScroll.current.get(materialId)!}}:{})};
    if(command.target.mode==='clip'&&!command.target.id)return;
    channelRef.current.postMessage(command);
    setPendingInkIds(ids=>[...ids,command.id]);
    const timer=setTimeout(()=>{
      const acknowledged=typeof pendingInk.current.get(command.id)?.afterRevision==='number';
      pendingInk.current.delete(command.id);
      setPendingInkIds(ids=>ids.filter(id=>id!==command.id));
      setInkError(acknowledged?"Strich übernommen. Die Raumansicht konnte nicht aktualisiert werden."
        :"Der Strich wurde nicht bestätigt. Bitte erneut zeichnen.");
      setRenderVersion(value=>value+1);
    },10_000);
    pendingInk.current.set(command.id,{timer,afterRevision:null});
  },[]);
  const onMaterialAction=useCallback((material:LiveInteractiveMaterial,state:JsonValue,baseState:JsonValue|null)=>{
    const current=sceneRef.current;
    if(!current||!channelRef.current||baseState===null)return;
    setInkError(null);
    channelRef.current.postMessage({type:'material-state',channel:channelId,generation:current.generation,
      instanceId:material.instanceId,baseState,state} satisfies RoomMaterialStateCommand);
  },[]);
  const objectCommand=useCallback((action:RoomObjectCommand['action'],objects:RoomVisibleObject[],geometry?:RoomObjectGeometry)=>{
    const current=sceneRef.current;
    if(!current||!channelRef.current||!objects.length)return;
    setInkError(null);
    const command:RoomObjectCommand={type:'object-edit',channel:channelId,generation:current.generation,
      revision:current.revision,target:current.presentation?.mode==='clip'
        ?{mode:'clip',id:current.presentation.clip?.id??''}:{mode:'free',id:null},
      action,objects:objects.map(({id,version})=>({id,version})),...(geometry?{geometry,htmlScroll:[...(current.materials as RoomInteractiveMaterial[]??[])].filter(material=>material.roomLocalId).slice(0,64).map(material=>({materialId:material.roomLocalId!,offset:roomScroll.current.get(material.roomLocalId!)??scroll.current.get(material.roomLocalId!)??{x:0,y:0}}))}:{})};
    if(command.target.mode==='clip'&&!command.target.id)return;
    if(action==='erase'){
      const timer=setTimeout(()=>{
        for(const object of objects)if(pendingErase.current.get(object.id)?.timer===timer)pendingErase.current.delete(object.id);
        setInkError("Radieren wurde noch nicht bestätigt. Bitte erneut versuchen.");
        refreshErasePreview();
      },10_000);
      for(const object of objects)pendingErase.current.set(object.id,{version:object.version,timer});
      eraseDraft.current.clear();
    }
    if(action==='transform'&&geometry){
      objectPreview.current={object:objects[0],geometry,revision:++previewSequence.current};
      refreshErasePreview();
      clearTimeout(transformTimeout.current);
      transformTimeout.current=setTimeout(()=>{objectPreview.current=null;refreshErasePreview();setInkError("Verschieben wurde noch nicht bestätigt. Bitte erneut versuchen.");},10_000);
    }
    channelRef.current.postMessage(command);
  },[]);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.data?.type!=='tafelraum:interactive-focus')return;
      const frame=[...document.querySelectorAll<HTMLIFrameElement>('[data-room-material-id] iframe')]
        .find(candidate=>candidate.contentWindow===event.source);
      const localId=frame?.closest<HTMLElement>('[data-room-material-id]')?.dataset.roomMaterialId;
      const material=(sceneRef.current?.materials as RoomInteractiveMaterial[]|undefined)?.find(item=>item.roomLocalId===localId);
      if(!frame||!material||material.cover?.width===1&&material.cover?.height===1)return;
      const key=event.data.key,previous=roomFocus.current;
      if(key===null){if(previous?.instanceId===material.instanceId)sendRoomFocus(null);return;}
      if(typeof key!=='string'||!key.length||key.length>200||typeof event.data.active!=='boolean')return;
      if(!event.data.active&&(previous?.instanceId!==material.instanceId||previous.key!==key))return;
      sendRoomFocus({instanceId:material.instanceId,key,active:event.data.active,
        presence:readInteractiveHtmlTextPresence(event.data.presence)});
    };
    const outside=(event:Event)=>{if(!(event.target instanceof HTMLIFrameElement))sendRoomFocus(null);};
    window.addEventListener('message',receive);
    window.addEventListener('pointerdown',outside,true);window.addEventListener('focusin',outside,true);
    return()=>{window.removeEventListener('message',receive);window.removeEventListener('pointerdown',outside,true);window.removeEventListener('focusin',outside,true);};
  },[sendRoomFocus]);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.data?.type!=='tafelraum:interactive-scroll'&&event.data?.type!=='tafelraum:interactive-room-scroll-state'
        &&event.data?.type!=='tafelraum:interactive-room-user-scroll')return;
      const frame=[...document.querySelectorAll<HTMLIFrameElement>('[data-room-material-id] iframe')]
        .find(candidate=>candidate.contentWindow===event.source);
      const id=frame?.closest<HTMLElement>('[data-room-material-id]')?.dataset.roomMaterialId;
      if(!id)return;
      if(event.data.type==='tafelraum:interactive-room-user-scroll'){
        locallyScrolled.current.add(id);return;
      }
      if(event.data.type==='tafelraum:interactive-room-scroll-state'){
        const entries=event.data.entries;
        if(Array.isArray(entries)&&entries.length<=64&&entries.every(entry=>Array.isArray(entry.path)&&entry.path.length<=24
          &&entry.path.every((index:unknown)=>typeof index==='number'&&Number.isInteger(index)&&index>=0&&index<1000)
          &&[entry.x,entry.y].every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000)))
          innerScroll.current.set(id,entries);
        return;
      }
      const x=event.data.scrollX,y=event.data.scrollY;
      if([x,y].every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000))
        {roomScroll.current.set(id,{x,y});setRenderVersion(value=>value+1);}
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[]);
  useEffect(()=>{
    if(!/^[0-9a-f-]{36}$/i.test(channelId))return;
    const channel=new BroadcastChannel(`tafelraum-room-${channelId}`);channelRef.current=channel;
    const playback=installRoomHtmlPlaybackReceiver(channel,channelId,()=>sceneRef.current);
    let received=false;
    channel.onmessage=(event:MessageEvent<{type:'input-ready';channel:string;generation:number;revision:number;ready:boolean}|{type:'media-command';channel:string;generation:number;id:string;sequence:number;action:RoomVideoCommand}|{type:'media-lease';channel:string;generation:number;id:string}|HostPlaybackMessage|FrameMessage|MediaPlaybackMessage|CameraMessage|ScrollMessage|TeacherFocusMessage|PointerMessage|InkMessage|InkClearMessage|InkResultMessage|HistoryStateMessage|HistoryErrorMessage|ObjectErrorMessage|MaterialErrorMessage|RoomTimerStateMessage|{type:"timer-error";channel:string;generation:number;error:string}>)=>{
      const message=event.data;if(!message||message.channel!==channelId)return;
      if(message.type==='media-lease'){if(message.generation===sceneRef.current?.generation&&message.id===mediaRef.current?.id)mediaLease.current=Date.now();return;}
      if(message.type==='html-playback-host'){playback.receive(message);return;}
      if(message.type==='input-ready'){
        const current=sceneRef.current;
        if(current&&message.generation===current.generation&&(!message.ready||message.revision===current.revision))setHtmlInputReady(message.ready===true);
        return;
      }
      if(message.type==='timer-state'){
        const current=sceneRef.current;
        if(current&&message.generation===current.generation&&message.revision===current.revision)setTimers(message.timers);
      }
      if(message.type==='timer-error'&&message.generation===sceneRef.current?.generation)setInkError(message.error);
      if(message.type==='frame'){
        received=true;
        const previous=sceneRef.current;
        if(previous&&(message.scene.generation<previous.generation
          ||message.scene.generation===previous.generation&&message.scene.revision<=previous.revision))return;
        if(previous&&message.scene.generation!==previous.generation){
          runningTargetMotion.current?.cancel();runningTargetMotion.current=null;targetMotion.current=null;
          setHistoryState({undo:false,redo:false});
          for(const url of assets.current.values())URL.revokeObjectURL(url);
          assets.current.clear();scroll.current.clear();roomScroll.current.clear();innerScroll.current.clear();locallyScrolled.current.clear();inkPreviews.current.clear();
          setRoomReady(false);setHtmlInputReady(false);setTool('hand');
          for(const entry of pendingInk.current.values())clearTimeout(entry.timer);
          pendingInk.current.clear();setPendingInkIds([]);
        }
        const targetChanged=Boolean(previous&&previous.generation===message.scene.generation
          &&(previous.presentation?.mode!==message.scene.presentation?.mode
          ||previous.presentation?.clip?.id!==message.scene.presentation?.clip?.id));
        if(previous&&(targetChanged||previous.generation!==message.scene.generation)){
          clearErase();teacherFocus.current=null;showTeacherFocus();sendRoomFocus(null);
        }
        if(targetChanged){
          runningTargetMotion.current?.cancel();runningTargetMotion.current=null;
          const from=previous?.presentation?.clip,to=message.scene.presentation?.clip;
          const deltaX=from&&to?(from.x+from.width/2)-(to.x+to.width/2):0;
          const deltaY=from&&to?(from.y+from.height/2)-(to.y+to.height/2):0;
          targetMotion.current={generation:message.scene.generation,revision:message.scene.revision,
            dx:Math.sign(deltaX)*Math.min(26,Math.abs(deltaX)/20),
            dy:Math.sign(deltaY)*Math.min(18,Math.abs(deltaY)/20)};
          objectPreview.current=null;clearTimeout(transformTimeout.current);setRoomReady(false);setHtmlInputReady(false);setTool('hand');locallyScrolled.current.clear();roomScroll.current.clear();innerScroll.current.clear();
        }
        for(const asset of message.assets)if(!assets.current.has(asset.id))assets.current.set(asset.id,URL.createObjectURL(asset.blob));
        const nextUrls=Object.fromEntries(message.scene.assetIds.flatMap(id=>assets.current.has(id)?[[id,assets.current.get(id)!]]:[]));
        if(message.scene.assetIds.some(id=>!nextUrls[id]))return;
        if(targetChanged)inkPreviews.current.clear();
        for(const element of message.scene.elements)inkPreviews.current.delete(element.id);
        const nextScene=message.scene;
        if(roomFocus.current&&!(nextScene.materials as RoomInteractiveMaterial[]|undefined)?.some(material=>material.instanceId===roomFocus.current?.instanceId
          &&!(material.cover?.width===1&&material.cover?.height===1)))sendRoomFocus(null);
        setTimers(message.timers??[]);
        const completed=[...pendingInk.current].filter(([,entry])=>entry.afterRevision!==null
          &&message.scene.revision>entry.afterRevision).map(([id])=>id);
        if(completed.length){
          for(const id of completed){clearTimeout(pendingInk.current.get(id)!.timer);pendingInk.current.delete(id);}
          setPendingInkIds(ids=>ids.filter(id=>!completed.includes(id)));
        }
        const visibleObjects=new Map((message.objects??[]).map(object=>[object.id,object.version]));
        const draft=objectPreview.current;
        if(draft&&(nextScene.generation!==sceneRef.current?.generation||nextScene.presentation?.clip?.id!==sceneRef.current?.presentation?.clip?.id||visibleObjects.get(draft.object.id)!==draft.object.version)){
          objectPreview.current=null;clearTimeout(transformTimeout.current);
        }
        for(const [id,entry] of pendingErase.current)if(visibleObjects.get(id)!==entry.version){
          pendingErase.current.delete(id);
          if(![...pendingErase.current.values()].some(other=>other.timer===entry.timer))clearTimeout(entry.timer);
        }
        const publicElements=new Map(nextScene.elements.map(element=>[element.id,element]));
        const objects=(message.objects??[]).map(object=>{
          const element=publicElements.get(object.id);
          return element?.points?.length&&(element.strokeColor!=='transparent'||object.markerRibbon)
            ?{...object,path:element.points,strokeWidth:element.strokeWidth}:object;
        });
        mediaLease.current=Date.now();sceneRef.current=nextScene;setUrls(nextUrls);setMedia(message.media??null);setMediaFullscreen(Boolean(message.mediaFullscreen));if(message.mediaFullscreen)setTool('hand');setEditableObjects(objects);setScene(compose(nextScene));
      }else if(message.type==='media-command'&&sceneRef.current?.generation===message.generation&&Number.isSafeInteger(message.sequence)&&validRoomVideoCommand(message.action)){
        mediaLease.current=Date.now();
        setMedia(current=>current?.id===message.id&&message.sequence>(current.command?.sequence??current.commandSequence??0)
          ?{...current,suspended:message.action.type==='play'?false:current.suspended,command:{sequence:message.sequence,action:message.action}}:current);
      }else if(message.type==='media-playback'&&sceneRef.current?.generation===message.generation){
        mediaLease.current=Date.now();
        setMedia(current=>current?.id===message.id?{...current,playing:message.playing,position:message.position,updatedAt:message.updatedAt,volume:message.volume??current.volume}:current);
      }else if(message.type==='camera'&&sceneRef.current?.generation===message.generation&&sceneRef.current.presentation?.mode==='free'){
        sceneRef.current={...sceneRef.current,viewport:message.viewport};setScene(compose(sceneRef.current));
      }else if(message.type==='ink-result'&&sceneRef.current?.generation===message.generation){
        const pending=pendingInk.current.get(message.id);
        if(pending){
          if(message.accepted)pending.afterRevision=message.afterRevision;
          else{clearTimeout(pending.timer);pendingInk.current.delete(message.id);
            setPendingInkIds(ids=>ids.filter(id=>id!==message.id));}
        }
        if(!message.accepted){setInkError(message.error??"Der Strich konnte nicht übernommen werden.");setRenderVersion(value=>value+1);}
      }else if(message.type==='history-state'&&(!sceneRef.current||sceneRef.current.generation===message.generation)){
        setHistoryState({undo:message.undo,redo:message.redo});
      }else if(message.type==='history-error'&&sceneRef.current?.generation===message.generation){
        objectPreview.current=null;clearTimeout(transformTimeout.current);refreshErasePreview();setInkError(message.error);
      }else if(message.type==='object-error'&&sceneRef.current?.generation===message.generation){
        clearErase();objectPreview.current=null;clearTimeout(transformTimeout.current);refreshErasePreview();setInkError(message.error);
      }else if(message.type==='material-error'&&sceneRef.current?.generation===message.generation){
        objectPreview.current=null;clearTimeout(transformTimeout.current);refreshErasePreview();setInkError(message.error);
        const material=(sceneRef.current.materials as RoomInteractiveMaterial[]|undefined)
          ?.find(candidate=>candidate.instanceId===message.instanceId);
        if(material?.roomLocalId&&material.state!==null){
          const frame=document.querySelector<HTMLIFrameElement>(`[data-room-material-id="${CSS.escape(material.roomLocalId)}"] iframe`);
          frame?.contentWindow?.postMessage({type:'tafelraum:interactive-apply',state:material.state},'*');
        }
      }else if(message.type==='ink'&&sceneRef.current?.generation===message.patch.generation){
        try{
          const current=inkPreviews.current.get(message.patch.id);
          const next=applyInkPreviewPatch(current,message.patch);
          if(next)inkPreviews.current.set(message.patch.id,next);else inkPreviews.current.delete(message.patch.id);
        }catch{inkPreviews.current.delete(message.patch.id);}
        setScene(compose(sceneRef.current));setRenderVersion(value=>value+1);
      }else if(message.type==='ink-clear'&&sceneRef.current?.generation===message.generation){
        inkPreviews.current.clear();setScene(sceneRef.current);setRenderVersion(value=>value+1);
      }else if(message.type==='html-scroll'){
        scroll.current.set(message.localId,message.offset);
        if(locallyScrolled.current.has(message.localId))return;
        roomScroll.current.set(message.localId,message.offset);
        const frame=document.querySelector(`[data-room-material-id="${CSS.escape(message.localId)}"] iframe`) as HTMLIFrameElement|null;
        frame?.contentWindow?.postMessage({type:'tafelraum:interactive-room-scroll',scrollX:message.offset.x,scrollY:message.offset.y},'*');
      }else if(message.type==='teacher-html-focus'&&sceneRef.current?.generation===message.generation){
        const visible=(sceneRef.current.materials as RoomInteractiveMaterial[]|undefined)
          ?.some(material=>material.roomLocalId===message.localId);
        if(message.localId===null&&message.key===null)teacherFocus.current=null;
        else if(visible&&typeof message.localId==='string'&&typeof message.key==='string'
          &&message.key.length>0&&message.key.length<=200)
          teacherFocus.current={localId:message.localId,key:message.key,active:message.active===true,
            presence:readInteractiveHtmlTextPresence(message.presence)};
        else return;
        showTeacherFocus();
      }else if(message.type==='pointer'&&sceneRef.current?.generation===message.generation){
        pointer.current.set({type:'pointer',generation:message.generation,pointer:message.pointer});
      }
    };
    const size=()=>channel.postMessage({type:'size',channel:channelId,width:innerWidth,height:innerHeight});
    const hello=()=>{if(!received)channel.postMessage({type:'ready',channel:channelId,width:innerWidth,height:innerHeight});};
    hello();const timer=setInterval(()=>{hello();if(mediaRef.current?.playing&&Date.now()-mediaLease.current>2500){setMedia(current=>current?{...current,playing:false,suspended:true}:null);}},600);
    window.addEventListener('resize',size);
    const closing=()=>channel.postMessage({type:'closed',channel:channelId});
    window.addEventListener('beforeunload',closing);
    return()=>{closing();playback.dispose();clearInterval(timer);window.removeEventListener('beforeunload',closing);window.removeEventListener('resize',size);channel.close();channelRef.current=null;
      runningTargetMotion.current?.cancel();runningTargetMotion.current=null;targetMotion.current=null;
      for(const url of assets.current.values())URL.revokeObjectURL(url);assets.current.clear();inkPreviews.current.clear();
      clearErase();
      for(const pending of pendingInk.current.values())clearTimeout(pending.timer);pendingInk.current.clear();};
  },[showTeacherFocus,sendRoomFocus]);
  useEffect(()=>{
    if(!isTauri())return;
    const room=getCurrentWindow();let stop=()=>{};
    void room.isFullscreen().then(setFullscreen);
    void room.onResized(()=>{void room.isFullscreen().then(setFullscreen);}).then(unlisten=>{stop=unlisten;});
    return()=>stop();
  },[]);
  useEffect(()=>{
    if(isTauri())return;
    const update=()=>setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',update);
    return()=>document.removeEventListener('fullscreenchange',update);
  },[]);
  const exitVideoFullscreen=useCallback(()=>{
    const current=sceneRef.current,player=mediaRef.current;
    if(current&&player&&mediaFullscreenRef.current)channelRef.current?.postMessage({
      type:'media-fullscreen-exit',channel:channelId,generation:current.generation,id:player.id});
  },[]);
  useEffect(()=>{
    if(!isTauri())return;
    // Serialize enter/restore so a quick Escape cannot leave a stale window transition.
    windowFullscreenQueue.current=windowFullscreenQueue.current.then(async()=>{
      const room=getCurrentWindow();
      if(mediaFullscreen){
        if(windowFullscreenBeforeVideo.current===null)windowFullscreenBeforeVideo.current=await room.isFullscreen();
        await room.setFullscreen(true);
      }else if(windowFullscreenBeforeVideo.current!==null){
        const previous=windowFullscreenBeforeVideo.current;windowFullscreenBeforeVideo.current=null;
        await room.setFullscreen(previous);
      }
    }).catch(()=>{exitVideoFullscreen();});
  },[mediaFullscreen,exitVideoFullscreen]);
  useEffect(()=>{
    const key=(event:globalThis.KeyboardEvent)=>{
      if(event.key==='Escape'&&mediaFullscreenRef.current){event.preventDefault();event.stopImmediatePropagation();exitVideoFullscreen();}
      else if(event.key==='Escape'&&document.fullscreenElement instanceof HTMLIFrameElement
        &&document.fullscreenElement.closest('[data-room-material-id]')){
        event.preventDefault();void document.exitFullscreen().catch(()=>{});
      }
    };
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
  },[exitVideoFullscreen]);
  const toggleFullscreen=()=>setRoomFullscreen(!fullscreenRef.current).catch(()=>{
    setInkError("Vollbild konnte nicht geöffnet werden. Bitte erneut versuchen.");
  });
  const toggleTools=()=>{
    const next=!toolsOpen;
    setToolsOpen(next);setTool('hand');setOpenInkTool(null);setInkError(null);
  };
  const toolbarSize=():RoomToolbarSize=>({width:toolbarRef.current?.offsetWidth??0,height:toolbarRef.current?.offsetHeight??0});
  const viewportSize=():RoomToolbarSize=>({width:window.innerWidth,height:window.innerHeight});
  const startToolbarDrag=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if(event.button!==0||!toolbarRef.current)return;
    event.preventDefault();event.stopPropagation();
    const rect=toolbarRef.current.getBoundingClientRect();
    toolbarDrag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
      origin:{x:rect.left,y:rect.top},size:{width:rect.width,height:rect.height}};
    event.currentTarget.setPointerCapture(event.pointerId);
    setToolbarPosition({x:rect.left,y:rect.top});setToolbarDragging(true);setOpenInkTool(null);
  };
  const moveToolbar=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const drag=toolbarDrag.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    setToolbarPosition(clampRoomToolbarPosition({x:drag.origin.x+event.clientX-drag.startX,
      y:drag.origin.y+event.clientY-drag.startY},drag.size,viewportSize()));
  };
  const finishToolbarDrag=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if(toolbarDrag.current?.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    toolbarDrag.current=null;setToolbarDragging(false);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const moveToolbarWithKeyboard=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
    const direction:Record<string,RoomToolbarPosition>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};
    const step=direction[event.key];
    if(!step||!toolbarRef.current)return;
    event.preventDefault();setOpenInkTool(null);
    const rect=toolbarRef.current.getBoundingClientRect(),distance=event.shiftKey?48:24;
    setToolbarPosition(clampRoomToolbarPosition({x:rect.left+step.x*distance,y:rect.top+step.y*distance},
      {width:rect.width,height:rect.height},viewportSize()));
  };
  useEffect(()=>{
    const keepVisible=()=>setToolbarPosition(position=>position
      ?clampRoomToolbarPosition(position,toolbarSize(),viewportSize()):null);
    window.addEventListener('resize',keepVisible);
    return()=>window.removeEventListener('resize',keepVisible);
  },[]);
  const changeHistory=(action:RoomHistoryCommand['action'])=>{
    const current=sceneRef.current;
    if(!current||!channelRef.current)return;
    setInkError(null);
    channelRef.current.postMessage({type:'history',channel:channelId,generation:current.generation,action} satisfies RoomHistoryCommand);
  };
  const palette=(Object.entries(canvasBackgrounds) as [Theme,Record<ThemeVariant,string>][]) 
    .flatMap(([theme,variants])=>(Object.entries(variants) as [ThemeVariant,string][])
      .map(([variant,background])=>({theme,variant,background})))
    .find(({background})=>background.toLowerCase()===scene?.background.toLowerCase());
  const currentPenColors=penColors[palette?.theme??(scene&&/^#[0-4][0-9a-f][0-4][0-9a-f][0-4][0-9a-f]$/i.test(scene.background)?'dark':'light')];
  const penColor=currentPenColors.find(color=>color.id===penColorId)??currentPenColors[0];
  const markerColor=markerColors.find(color=>color.id===markerColorId)??markerColors[0];
  const inkColor=tool==='marker'?markerColor.value:penColor.value;
  const inkWidth=toolStrokeWidth(tool==='marker'?'marker':'pen',tool==='marker'?markerSizeId:penSizeId);
  useEffect(()=>{
    if(!openInkTool)return;
    const outside=(event:PointerEvent)=>{if(!(event.target instanceof Element&&event.target.closest('.room-tools')))setOpenInkTool(null);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpenInkTool(null);};
    window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',escape,true);
    return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',escape,true);};
  },[openInkTool]);
  useEffect(()=>{
    if(eraseDraft.current.size){eraseDraft.current.clear();refreshErasePreview();}
  },[tool,toolsOpen]);
  const cameraIndependent=!mediaFullscreen&&toolsOpen&&scene?.presentation?.mode==='clip';
  return <div className={`room-view${fullscreen?' is-fullscreen':''}${mediaFullscreen?' is-video-fullscreen':''}${cameraIndependent?' is-camera-independent':''}${toolsOpen&&tool!=='hand'?' is-inking':''}`}
    data-theme={palette?.theme??'light'} data-theme-variant={palette?.variant??'calm'}>
    {scene?<CanvasViewer key={scene.presentation?.mode} scene={scene} renderVersion={renderVersion} connected hostConnected publicationReady hostPointer={pointer.current}
      presentation={scene.presentation} previewAssets={urls} materialBaseUrl="/" room roomPlaybackOutput roomMedia={media} onSceneReady={onReady} onRoomMediaError={onMediaError} onRoomVideoStatus={onVideoStatus}
      onMaterialAction={onMaterialAction} roomInputReady={htmlInputReady} roomTimers={timers}
      onTimerAction={(id:string,action:TimerAction,revision:number)=>{
        const current=sceneRef.current;
        if(!current||!channelRef.current||!roomReady)return;
        setInkError(null);
        channelRef.current.postMessage({type:'timer-action',channel:channelId,generation:current.generation,id,revision,action} satisfies RoomTimerCommand);
      }} onTimerTransform={(id,version,geometry)=>{
        const object=editableObjects.find(object=>object.id===id&&object.version===version);
        if(object)objectCommand('transform',[object],geometry);
      }}
      roomCameraIndependent={cameraIndependent} roomPendingInkIds={pendingInkIds} roomActiveInkId={activeInkId} onRoomApi={setViewerApi}
      roomInkOverlay={toolsOpen&&roomReady&&viewerApi
        ?tool==='pen'||tool==='marker'
          ?<RoomInkInput api={viewerApi} tool={tool} color={inkColor} width={inkWidth} materials={scene.materials??[]}
            pendingInkIds={pendingInkIds} onCommit={onRoomInkCommit} onPreviewChange={setActiveInkId}/>
          :tool==='eraser'||tool==='selection'
            ?<RoomObjectInput pendingPreview={objectPreview.current} key={`${scene.generation}:${scene.presentation?.clip?.id??'canvas'}`} api={viewerApi} mode={tool} objects={editableObjects.filter(object=>!pendingErase.current.has(object.id)).map(object=>visibleRoomObject(object,scene.materials as RoomInteractiveMaterial[]??[],new Map([...scroll.current,...roomScroll.current])))} onPreview={onObjectPreview} onErasePreview={onErasePreview}
              onErase={objects=>objectCommand('erase',objects)}
              onTransform={(object,geometry)=>objectCommand('transform',[object],geometry)}/>:null:null}/>
      :<div className="room-wait" role="status">{t("Wird vorbereitet …")}</div>}
    {scene&&<div ref={toolbarRef} className={`room-tools${toolsOpen?' is-open':''}${toolbarDragging?' is-dragging':''}${toolbarPosition&&toolbarPosition.y<76?' is-near-top':''}`}
      style={toolbarPosition?{left:toolbarPosition.x,top:toolbarPosition.y,bottom:'auto',transform:'none'}:undefined}>
      <div className="room-tools__items" role="toolbar" aria-label={t("Werkzeuge vorne")} aria-hidden={!toolsOpen} inert={!toolsOpen}>
        <button className="room-tools__drag" type="button" aria-label={t("Werkzeugleiste verschieben")} title={t("Werkzeugleiste verschieben")}
          onPointerDown={startToolbarDrag} onPointerMove={moveToolbar} onPointerUp={finishToolbarDrag} onPointerCancel={finishToolbarDrag}
          onKeyDown={moveToolbarWithKeyboard}><GripVertical aria-hidden="true" strokeWidth={2}/></button>
        <button type="button" aria-label={t("Hand")} title={t("Hand")} aria-pressed={tool==='hand'} onClick={()=>{setTool('hand');setOpenInkTool(null);}}>
          <FluentToolbarIcon name="hand"/><span>{t("Hand")}</span>
        </button>
        <button type="button" aria-label={t("Stift")} title={t("Stift")} aria-pressed={tool==='pen'} aria-haspopup="dialog" aria-expanded={openInkTool==='pen'} disabled={!roomReady} onClick={()=>{setTool('pen');setOpenInkTool('pen');}}>
          <span className="room-tools__ink-icon is-pen" style={{'--tool-color':penColor.value} as CSSProperties} aria-hidden="true"><ColoredPencilIcon/></span><span>{t("Stift")}</span>
        </button>
        <button type="button" aria-label={t("Marker")} title={t("Marker")} aria-pressed={tool==='marker'} aria-haspopup="dialog" aria-expanded={openInkTool==='marker'} disabled={!roomReady} onClick={()=>{setTool('marker');setOpenInkTool('marker');}}>
          <span className="room-tools__ink-icon is-marker" style={{'--tool-color':markerColor.value} as CSSProperties} aria-hidden="true"><FluentHighlighterIcon/></span><span>{t("Marker")}</span>
        </button>
        <button type="button" aria-label={t("Radierer")} title={t("Radierer")} aria-pressed={tool==='eraser'} disabled={!roomReady} onClick={()=>{setTool('eraser');setOpenInkTool(null);}}>
          <FluentToolbarIcon name="eraser"/><span>{t("Radierer")}</span>
        </button>
        <button type="button" aria-label={t("Auswahl")} title={t("Objekte auswählen, verschieben, skalieren und drehen")} aria-pressed={tool==='selection'} disabled={!roomReady} onClick={()=>{setTool('selection');setOpenInkTool(null);}}>
          <FluentToolbarIcon name="selection"/><span>{t("Auswahl")}</span>
        </button>
        <span className="room-tools__divider" aria-hidden="true"/>
        <button type="button" aria-label={t("Rückgängig")} title={t("Eigene Aktion rückgängig")} disabled={!roomReady||!historyState.undo} onClick={()=>changeHistory('undo')}>
          <FluentToolbarIcon name="undo"/><span>{t("Zurück")}</span>
        </button>
        <button type="button" aria-label={t("Wiederholen")} title={t("Eigene Aktion wiederholen")} disabled={!roomReady||!historyState.redo} onClick={()=>changeHistory('redo')}>
          <FluentToolbarIcon name="redo"/><span>{t("Vor")}</span>
        </button>
        <span className="room-tools__divider" aria-hidden="true"/>
        <button className="room-tools__visibility" type="button" onClick={toggleTools} aria-label={t("Werkzeugleiste ausblenden")} title={t("Werkzeugleiste ausblenden")}>
          <FluentToolbarIcon name="chevronDown"/>
        </button>
      </div>
      {toolsOpen&&openInkTool&&<ToolInkOptions anchor={{x:0,y:0}} tool={openInkTool}
        colors={openInkTool==='pen'?currentPenColors:markerColors}
        selectedColor={openInkTool==='pen'?penColor.id:markerColor.id}
        selectedStrokeSize={openInkTool==='pen'?penSizeId:markerSizeId}
        onColorSelect={color=>{if(openInkTool==='pen')setPenColorId(color.id);else setMarkerColorId(color.id);setOpenInkTool(null);}}
        onStrokeSizeSelect={size=>{if(openInkTool==='pen')setPenSizeId(size);else setMarkerSizeId(size);setOpenInkTool(null);}}/>}
      {!toolsOpen&&<button className="room-tools__recall" type="button" onClick={toggleTools} aria-label={t("Werkzeugleiste einblenden")} title={t("Werkzeugleiste einblenden")}>
        <FluentToolbarIcon name="toolbarToggle"/>
      </button>}
      {inkError&&<div className="room-tools__error" role="alert">{t(inkError)}</div>}
    </div>}
    <button className="room-fullscreen" type="button" onClick={()=>mediaFullscreen?exitVideoFullscreen():void toggleFullscreen()}
      aria-label={fullscreen||mediaFullscreen?t("Vollbild verlassen"):t("Vollbild")} title={fullscreen||mediaFullscreen?t("Vollbild verlassen"):t("Vollbild")}>
      {fullscreen||mediaFullscreen?<Minimize2 aria-hidden="true"/>:<Maximize2 aria-hidden="true"/>}
    </button>
  </div>;
}

createRoot(document.getElementById('root')!).render(<RoomView/>);
