import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { RoomTarget } from './room-canvas-host';
import { isRoomMediaElement } from './room-media.ts';

/** A partial video in a crop remains a crop; Play must not replace its camera. */
export function roomTargetContainsMedia(target:RoomTarget, element:ExcalidrawElement):boolean {
  if(!isRoomMediaElement(element))return false;
  if(target.kind==='material')return target.id===element.id;
  if(target.kind!=='clip')return false;
  const {clip}=target;
  const c=Math.abs(Math.cos(element.angle)),s=Math.abs(Math.sin(element.angle));
  const width=element.width*c+element.height*s,height=element.width*s+element.height*c;
  const x=element.x+element.width/2-width/2,y=element.y+element.height/2-height/2;
  return x<clip.x+clip.width && x+width>clip.x && y<clip.y+clip.height && y+height>clip.y;
}
export function roomTargetMedia(elements:readonly ExcalidrawElement[],target:RoomTarget,preferredId:string|null) {
  const matches=elements.filter(element=>roomTargetContainsMedia(target,element));
  return matches.find(element=>element.id===preferredId)??matches[0]??null;
}
