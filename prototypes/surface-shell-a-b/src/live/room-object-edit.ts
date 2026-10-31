import type {CanvasObjectGeometry} from "../canvas/material-transform.ts";
import {newElementWith} from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { markerRibbonHit } from '../canvas/marker-stroke.ts';
import {annotationAfterIndependentMove, annotationScrollProjection, isIndependentMaterialAnnotation} from '../canvas/annotation-move.ts';
import {imageAnnotationGroupId} from '../canvas/image-annotation-selection.ts';
import {transformMaterialBundle, transformCanvasObject} from '../canvas/material-transform.ts';
import type {RoomInteractiveMaterial} from '../canvas/interactive-html-live.ts';
import type {PublicElement} from '../../../../shared/live-canvas/protocol.ts';
import {textBoxTransformPatch,type TextBoxContent} from '../canvas/text-box-transform.ts';
import {textBoxResizeHandles,type TextBoxHandle} from '../canvas/text-box-geometry.ts';

export type RoomObject = {
  id:string; sourceId:string; version:number; type:ExcalidrawElement['type'];
  x:number;y:number;width:number;height:number;angle:number;erasable:boolean;pageOrientation?:'portrait'|'landscape'|null;
  path?:[number,number][];strokeWidth?:number;markerRibbon?:boolean;
  locked?:boolean;
  annotation?:{materialId?:string;scrollAnchor?:{x:number;y:number}};
  renderElement?:PublicElement;
  textContent?:TextBoxContent;
  renderElementIds?:string[];
};
export type RoomVisibleObject = Omit<RoomObject,'sourceId'>;
export type RoomObjectGeometry = CanvasObjectGeometry & {textHandle?:TextBoxHandle};
export type RoomObjectTarget = {mode:'free';id:null}|{mode:'clip';id:string};
export type RoomObjectCommand = {
  type:'object-edit';channel:string;generation:number;revision:number;target:RoomObjectTarget;
  action:'erase'|'transform';objects:{id:string;version:number}[];geometry?:RoomObjectGeometry;
  htmlScroll?:{materialId:string;offset:{x:number;y:number}}[];
};

export function roomObjectAtPoint(objects:readonly RoomVisibleObject[],point:{x:number;y:number},margin:number){
  return [...objects].reverse().find(object=>{
    if(object.locked)return false;
    const cx=object.x+object.width/2,cy=object.y+object.height/2;
    const dx=point.x-cx,dy=point.y-cy,c=Math.cos(object.angle),s=Math.sin(object.angle);
    const localX=dx*c+dy*s,localY=-dx*s+dy*c;
    if(Math.abs(localX)>Math.max(6,object.width/2)+margin
      ||Math.abs(localY)>Math.max(6,object.height/2)+margin)return false;
    if(!object.path?.length)return true;
    const x=localX+object.width/2,y=localY+object.height/2;
    if(object.markerRibbon)return markerRibbonHit(object.path,{x,y},margin);
    const radius=margin+Math.max(1,(object.strokeWidth??1)/2);
    for(let index=0;index<object.path.length;index++){
      const start=object.path[Math.max(0,index-1)],end=object.path[index];
      const dx=end[0]-start[0],dy=end[1]-start[1];
      const length=dx*dx+dy*dy;
      const fraction=length?Math.max(0,Math.min(1,((x-start[0])*dx+(y-start[1])*dy)/length)):0;
      if(Math.hypot(x-start[0]-fraction*dx,y-start[1]-fraction*dy)<=radius)return true;
    }
    return false;
  })??null;
}

/** Sweep between pointer samples so fast touch strokes cannot jump over ink. */
export function roomObjectsAlongEraser(objects:readonly RoomVisibleObject[],start:{x:number;y:number},end:{x:number;y:number},radius:number){
  const steps=Math.max(1,Math.ceil(Math.hypot(end.x-start.x,end.y-start.y)/Math.max(1,radius)));
  const hits=new Map<string,RoomVisibleObject>();
  for(let index=0;index<=steps;index++){
    const point={x:start.x+(end.x-start.x)*index/steps,y:start.y+(end.y-start.y)*index/steps};
    let hit:RoomVisibleObject|null;
    while((hit=roomObjectAtPoint(objects.filter(object=>object.erasable&&!hits.has(object.id)),point,radius)))hits.set(hit.id,hit);
  }
  return [...hits.values()];
}

const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=1_000_000;
export function validRoomObjectCommand(value:unknown):value is RoomObjectCommand {
  if(!value||typeof value!=='object')return false;
  const command=value as Partial<RoomObjectCommand>;
  return command.type==='object-edit'&&typeof command.channel==='string'&&command.channel.length<=64
    &&Number.isSafeInteger(command.generation)&&command.generation!>0
    &&Number.isSafeInteger(command.revision)&&command.revision!>0
    &&(command.target?.mode==='free'&&command.target.id===null
      ||command.target?.mode==='clip'&&typeof command.target.id==='string'&&command.target.id.length<=128)
    &&(command.action==='erase'||command.action==='transform')
    &&Array.isArray(command.objects)&&command.objects.length>0&&command.objects.length<=64
    &&command.objects.every(object=>typeof object.id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(object.id)
      &&Number.isSafeInteger(object.version)&&object.version>=0)
    &&new Set(command.objects.map(object=>object.id)).size===command.objects.length
    &&(command.htmlScroll===undefined||(Array.isArray(command.htmlScroll)&&command.htmlScroll.length<=64
      &&new Set(command.htmlScroll.map(entry=>entry?.materialId)).size===command.htmlScroll.length
      &&command.htmlScroll.every(entry=>entry&&typeof entry.materialId==='string'&&entry.materialId.length<=128
        &&entry.offset&&[entry.offset.x,entry.offset.y].every(value=>finite(value)&&value>=0))))
    &&(command.action==='erase'&&command.geometry===undefined
      ||command.action==='transform'&&command.objects.length===1&&command.geometry!==undefined
        &&[command.geometry.x,command.geometry.y,command.geometry.width,command.geometry.height,command.geometry.angle].every(finite)
        &&command.geometry.width>=0&&command.geometry.height>=0&&Math.abs(command.geometry.angle)<=Math.PI*8
        &&(command.geometry.textHandle===undefined||[...textBoxResizeHandles,'rotate'].includes(command.geometry.textHandle)));
}

/** Room sends visible geometry. Store it with this window's current scroll
 * anchor, then use the same deliberate-drop decision as the teacher. */
export function transformRoomAnnotation(element:ExcalidrawElement,source:readonly ExcalidrawElement[],next:RoomObjectGeometry,
  scrollOffsets:ReadonlyMap<string,{x:number;y:number}>=new Map(),targets:readonly ExcalidrawElement[]=source){
  if(element.locked)throw new Error('Das Objekt ist gesperrt.');
  if(element.type!=='freedraw'&&element.type!=='line'&&(next.width<1||next.height<1))
    throw new Error('Die Objektgröße ist ungültig.');
  if(next.textHandle){
    if(element.type!=='text'||element.containerId)throw new Error('Der Textgriff gehört nicht zu diesem Objekt.');
    const projection=annotationScrollProjection(element,source,scrollOffsets);
    const base={...element,x:element.x+projection.translation.x,y:element.y+projection.translation.y,
      customData:{...element.customData,...(projection.currentScrollAnchor?{interactiveHtmlScrollAnchor:projection.currentScrollAnchor}:{})}};
    return [{original:element,updated:newElementWith(element,textBoxTransformPatch(base,base,next,next.textHandle))}];
  }
  if(!isIndependentMaterialAnnotation(element))return transformMaterialBundle(element,source,next);
  let updated=transformCanvasObject(element,next);
  const projection=annotationScrollProjection(element,source,scrollOffsets);
  if(projection.currentScrollAnchor)updated=newElementWith(updated,{customData:{...updated.customData,interactiveHtmlScrollAnchor:projection.currentScrollAnchor}});
  const settled=annotationAfterIndependentMove(updated,targets,{x:0,y:0},scrollOffsets);
  if(settled!==updated)updated=newElementWith(updated,{x:settled.x,y:settled.y,groupIds:[...settled.groupIds],customData:settled.customData});
  return [{original:element,updated}];
}

export function visibleRoomObject(object:RoomVisibleObject,materials:readonly RoomInteractiveMaterial[],scroll:ReadonlyMap<string,{x:number;y:number}>):RoomVisibleObject {
  if(!object.annotation?.materialId)return object;
  const material=materials.find(item=>item.roomLocalId===object.annotation!.materialId);
  if(!material)return object;
  const id=material.roomLocalId!;
  const {translation}=annotationScrollProjection({...object,groupIds:[imageAnnotationGroupId(id)],
    customData:{interactiveHtmlScrollAnchor:object.annotation.scrollAnchor}},[{...material,id,type:'rectangle',
      customData:{materialKind:'interactive-html',interactiveHtmlContentZoom:material.roomContentZoom,interactiveHtmlPageOrientation:material.roomPageOrientation}}],scroll);
  return {...object,x:object.x+translation.x,y:object.y+translation.y};
}


export {transformCanvasObject as transformRoomObject, transformMaterialBundle as transformRoomBundle} from '../canvas/material-transform.ts';
