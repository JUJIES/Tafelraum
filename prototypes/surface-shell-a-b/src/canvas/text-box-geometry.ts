export type TextBoxGeometry = { x:number; y:number; width:number; height:number; angle:number };
export const textBoxResizeHandles = ["nw", "ne", "sw", "se", "w", "e"] as const;
export type TextBoxHandle = typeof textBoxResizeHandles[number] | "rotate";
export type TextBoxFrame = {centerX:number;centerY:number;width:number;height:number;angle:number};
export const textBoxHandleSpacing = 6;
export const textBoxRotationOffset = 36;
export function textBoxGeometry(box:TextBoxGeometry):TextBoxGeometry {
  return {x:box.x,y:box.y,width:box.width,height:box.height,angle:box.angle};
}

export function textBoxHandlePosition(frame:TextBoxFrame,handle:TextBoxHandle) {
  const x=handle.includes('w')?-frame.width/2-textBoxHandleSpacing:handle.includes('e')&&handle!=='rotate'?frame.width/2+textBoxHandleSpacing:0;
  const y=handle==='rotate'?-frame.height/2-textBoxRotationOffset:handle.includes('n')?-frame.height/2-textBoxHandleSpacing:handle.includes('s')?frame.height/2+textBoxHandleSpacing:0;
  return {x:frame.centerX+x*Math.cos(frame.angle)-y*Math.sin(frame.angle),y:frame.centerY+x*Math.sin(frame.angle)+y*Math.cos(frame.angle)};
}

/** Overlapping 48px targets choose the nearest grip, while the central body
 * stays available for moving even a small textbox. Coordinates are CSS pixels. */
export function textBoxHandleAtPoint(frame:TextBoxFrame,point:{x:number;y:number}):TextBoxHandle|null {
  const dx=point.x-frame.centerX,dy=point.y-frame.centerY,c=Math.cos(frame.angle),s=Math.sin(frame.angle);
  const x=dx*c+dy*s,y=-dx*s+dy*c;
  if(Math.abs(x)<Math.max(1,frame.width/2-Math.min(12,frame.width/3))
    &&Math.abs(y)<Math.max(1,frame.height/2-Math.min(12,frame.height/3)))return null;
  return [...textBoxResizeHandles,'rotate' as const].map(handle=>({handle,point:textBoxHandlePosition(frame,handle)}))
    .filter(item=>Math.abs(point.x-item.point.x)<=24&&Math.abs(point.y-item.point.y)<=24)
    .sort((a,b)=>Math.hypot(point.x-a.point.x,point.y-a.point.y)-Math.hypot(point.x-b.point.x,point.y-b.point.y))[0]?.handle??null;
}

/** Keep the opposite corner (or the opposite top edge for width changes)
 * fixed, including when wrapping changes the height of rotated text. */
export function anchoredTextBoxGeometry(base:TextBoxGeometry,handle:Exclude<TextBoxHandle,'rotate'>,width:number,height:number):TextBoxGeometry {
  const sx=handle.includes('w')?-1:1,sy=handle==='w'||handle==='e'?1:handle.includes('n')?-1:1;
  const c=Math.cos(base.angle),s=Math.sin(base.angle);
  const dx=sx*(width-base.width)/2,dy=sy*(height-base.height)/2;
  const cx=base.x+base.width/2+dx*c-dy*s,cy=base.y+base.height/2+dx*s+dy*c;
  return {x:cx-width/2,y:cy-height/2,width,height,angle:base.angle};
}

export function draggedTextBoxGeometry(base:TextBoxGeometry,handle:TextBoxHandle,delta:{x:number;y:number}):TextBoxGeometry {
  const c=Math.cos(base.angle),s=Math.sin(base.angle),dx=delta.x*c+delta.y*s,dy=-delta.x*s+delta.y*c;
  if(handle==='rotate')return textBoxGeometry(base);
  if(handle==='w'||handle==='e')return anchoredTextBoxGeometry(base,handle,Math.max(16,base.width+(handle==='w'?-dx:dx)),base.height);
  const scale=Math.max(.05,Math.max((base.width+(handle.includes('w')?-dx:dx))/Math.max(1,base.width),
    (base.height+(handle.includes('n')?-dy:dy))/Math.max(1,base.height)));
  return anchoredTextBoxGeometry(base,handle,base.width*scale,base.height*scale);
}

export function textBoxHandleCursor(handle:TextBoxHandle,angle:number) {
  if(handle==='rotate')return 'grab';
  const direction=(handle==='w'||handle==='e'?0:handle==='nw'||handle==='se'?45:-45)+angle*180/Math.PI;
  return ['ew-resize','nwse-resize','ns-resize','nesw-resize'][((Math.round(direction/45)%4)+4)%4];
}
