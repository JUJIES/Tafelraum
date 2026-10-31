import { getInteractiveHtmlPlacementSize } from './interactive-html-embed.ts';

export type HtmlPageOrientation = 'portrait' | 'landscape';
export function readHtmlPageOrientation(value: unknown): HtmlPageOrientation | null {
  return value === 'portrait' || value === 'landscape' ? value : null;
}
/** CSS uses 96 pixels per inch; rounded manifest dimensions are not paper dimensions. */
export function htmlPageSize(orientation: HtmlPageOrientation) {
  const short = 210 * 96 / 25.4, long = 297 * 96 / 25.4;
  return orientation === 'portrait' ? {width:short,height:long} : {width:long,height:short};
}
export function htmlPageProjection(width:number, height:number, orientation:HtmlPageOrientation) {
  const page = htmlPageSize(orientation);
  const scale = width / page.width;
  return {scale,surfaceWidth:page.width,surfaceHeight:height/scale,viewportHeight:height};
}
export function htmlPagePlacement(orientation:HtmlPageOrientation) {
  return getInteractiveHtmlPlacementSize(htmlPageSize(orientation), {page:'A4',orientation});
}

/** Bottom-right gesture pins the opposite paper corner, including rotated sheets. */
export function resizeHtmlPageGeometry(base:{x:number;y:number;width:number;height:number;angle:number},dx:number,dy:number) {
  const c=Math.cos(base.angle),s=Math.sin(base.angle);
  const localX=dx*c+dy*s,localY=-dx*s+dy*c;
  const factor=Math.max(24/base.width,24/base.height,1+(localX*base.width+localY*base.height)/(base.width*base.width+base.height*base.height));
  const width=base.width*factor,height=base.height*factor;
  const cx=base.x+base.width/2+((width-base.width)*c-(height-base.height)*s)/2;
  const cy=base.y+base.height/2+((width-base.width)*s+(height-base.height)*c)/2;
  return {x:cx-width/2,y:cy-height/2,width,height,angle:base.angle};
}
