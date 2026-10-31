import type { NormalizedImageCropRect } from './image-crop.ts';
export type DocumentPoint = { x: number; y: number };
// Clockwise in image coordinates: top left, top right, bottom right, bottom left.
export type DocumentQuad = [DocumentPoint, DocumentPoint, DocumentPoint, DocumentPoint];
export const wholeDocumentQuad: DocumentQuad = [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
export function documentQuadFromRect(rect: NormalizedImageCropRect): DocumentQuad {
  return [{x:rect.x,y:rect.y},{x:rect.x+rect.width,y:rect.y},
    {x:rect.x+rect.width,y:rect.y+rect.height},{x:rect.x,y:rect.y+rect.height}];
}
export function validDocumentQuad(value: unknown): value is DocumentQuad {
  if (!Array.isArray(value) || value.length !== 4) return false;
  if (!value.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1)) return false;
  return value.every((a,index) => {
    const b=value[(index+1)%4], c=value[(index+2)%4];
    return (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>0.00001;
  });
}
export function moveDocumentCorner(quad: DocumentQuad, index: number, point: DocumentPoint): DocumentQuad {
  const candidate = quad.map((old,i) => i===index ? {x:Math.max(0,Math.min(1,point.x)),y:Math.max(0,Math.min(1,point.y))}:old) as DocumentQuad;
  return validDocumentQuad(candidate) ? candidate : quad;
}
export function isWholeDocumentQuad(quad: DocumentQuad) {
  return quad.every((point,i)=>point.x===wholeDocumentQuad[i].x && point.y===wholeDocumentQuad[i].y);
}

// Preview-only rotation. Source coordinates and the perspective request stay unchanged.
export function documentPreviewGeometry(area: {x:number;y:number;width:number;height:number}, angle: number) {
  const center={x:area.x+area.width/2,y:area.y+area.height/2};
  const cosine=Math.cos(angle),sine=Math.sin(angle);
  const rotate=(point:DocumentPoint,inverse=false):DocumentPoint=>{
    const dx=point.x-center.x,dy=point.y-center.y,s=inverse?-sine:sine;
    return {x:center.x+dx*cosine-dy*s,y:center.y+dx*s+dy*cosine};
  };
  const corners=[{x:area.x,y:area.y},{x:area.x+area.width,y:area.y},
    {x:area.x+area.width,y:area.y+area.height},{x:area.x,y:area.y+area.height}].map(point=>rotate(point));
  const x=Math.min(...corners.map(p=>p.x)),y=Math.min(...corners.map(p=>p.y));
  return {center,bounds:{x,y,width:Math.max(...corners.map(p=>p.x))-x,height:Math.max(...corners.map(p=>p.y))-y},
    toDisplay:(point:DocumentPoint)=>rotate(point),toSource:(point:DocumentPoint)=>rotate(point,true)};
}
