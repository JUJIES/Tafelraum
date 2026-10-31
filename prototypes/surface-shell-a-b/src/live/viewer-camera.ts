import type { Viewport } from '../../../../shared/live-canvas/protocol.ts';

type Camera = { width: number; height: number; scrollX: number; scrollY: number; zoom: { value: number } };
export function fitZoom(state: Pick<Camera, 'width' | 'height'>, bounds: Viewport, padding = 24, maximum = 30) {
  return Math.max(0.01, Math.min(maximum, Math.max(1, state.width - padding) / bounds.width, Math.max(1, state.height - padding) / bounds.height));
}
/** Letterbox on the shorter content axis; clamp pan only where zoom creates overflow. */
export function boundedCamera(state: Camera, bounds: Viewport, reset = false, padding = 24, maximum = 30) {
  const minimum = fitZoom(state, bounds, padding, maximum);
  const zoom = reset ? minimum : Math.max(minimum, Math.min(maximum, state.zoom.value));
  const axis = (start: number, size: number, screen: number, scroll: number) => {
    const visible = screen / zoom;
    if (reset || visible >= size) return -start + (visible - size) / 2;
    return -Math.max(start, Math.min(start + size - visible, -scroll));
  };
  return { zoom: { value: zoom }, scrollX: axis(bounds.x, bounds.width, state.width, state.scrollX), scrollY: axis(bounds.y, bounds.height, state.height, state.scrollY) };
}

/** Interpolate world center and logarithmic zoom; never reveal beyond clip bounds. */
export function recallCamera(start: Camera, bounds: Viewport, progress: number, padding = 24, maximum = 30) {
  const target=boundedCamera(start,bounds,true,padding,maximum), t=1-Math.pow(1-Math.max(0,Math.min(1,progress)),4);
  const zoom=Math.exp(Math.log(start.zoom.value)*(1-t)+Math.log(target.zoom.value)*t);
  const center=(size:number,scroll:number,z:number)=>size/(2*z)-scroll;
  const x=center(start.width,start.scrollX,start.zoom.value)*(1-t)+center(start.width,target.scrollX,target.zoom.value)*t;
  const y=center(start.height,start.scrollY,start.zoom.value)*(1-t)+center(start.height,target.scrollY,target.zoom.value)*t;
  return boundedCamera({...start,zoom:{value:zoom},scrollX:start.width/(2*zoom)-x,scrollY:start.height/(2*zoom)-y},bounds,false,padding,maximum);
}
