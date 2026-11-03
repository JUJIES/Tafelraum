/** SVG shadow lengths are screen pixels. Cover the visible viewport plus blur
 * support, instead of allocating a bitmap proportional to the zoomed shape. */
export function shapeShadowRegion(
  frame:{centerX:number;centerY:number;width:number;height:number;angle:number},
  viewport:{width:number;height:number},
) {
  // Wide shadow: sigma 11, offset 8; 48px includes more than 3 sigma.
  const pad=48,c=Math.cos(frame.angle),s=Math.sin(frame.angle);
  const corners=[[0,0],[viewport.width,0],[0,viewport.height],[viewport.width,viewport.height]].map(([x,y])=>{
    const dx=x-frame.centerX,dy=y-frame.centerY;
    return {x:dx*c+dy*s+frame.width/2,y:-dx*s+dy*c+frame.height/2};
  });
  const x=Math.max(-pad,Math.min(...corners.map(p=>p.x))-pad);
  const y=Math.max(-pad,Math.min(...corners.map(p=>p.y))-pad);
  const right=Math.min(frame.width+pad,Math.max(...corners.map(p=>p.x))+pad);
  const bottom=Math.min(frame.height+pad,Math.max(...corners.map(p=>p.y))+pad);
  return {x,y,width:Math.max(0,right-x),height:Math.max(0,bottom-y)};
}
