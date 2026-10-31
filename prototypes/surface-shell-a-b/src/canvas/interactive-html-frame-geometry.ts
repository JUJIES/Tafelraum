import { constrainImageCoverRect, imageCoverRectToScene, recallImageCover, rememberImageCover, sceneCoverToImageRect, type ImageCoverRect } from './image-cover.ts';
import { interactiveHtmlTitlebarHeight } from './interactive-html-embed.ts';

type ElementGeometry = { id: string; x: number; y: number; width: number; height: number; angle: number; version: number; versionNonce: number; customData?: Record<string, unknown>; };
export function hasContentOnlyHtmlFrame(element: { customData?: Record<string, unknown> }) {
  return (element.customData?.materialKind === 'interactive-html' || element.customData?.surfaceKind === 'embedded-app')
    && element.customData.interactiveHtmlFrameLayout === 'content';
}

// Change the carrier bounds, never the scene positions of its document annotations.
export function normalizeInteractiveHtmlFrameGeometry<T extends ElementGeometry>(elements: readonly T[]): readonly T[] {
  const migrated = new Map<string, { before: T; after: T; inset: number }>();
  for (const element of elements) {
    if ((element.customData?.materialKind !== 'interactive-html' && element.customData?.surfaceKind !== 'embedded-app')
      || hasContentOnlyHtmlFrame(element) || element.height <= 0) continue;
    const inset = Math.min(interactiveHtmlTitlebarHeight, Math.max(0, element.height - 1));
    const height = element.height - inset;
    const rectFor = (rect: ImageCoverRect) => remapRect(rect, element.height, inset);
    const memory = recallImageCover(element);
    const customData = memory ? rememberImageCover(element.customData, rectFor(memory.rect), memory.edge) : element.customData;
    const after = { ...element,
      x: element.x - Math.sin(element.angle) * inset / 2,
      y: element.y + (1 + Math.cos(element.angle)) * inset / 2,
      height, version: element.version + 1, versionNonce: element.versionNonce + 1,
      customData: { ...customData, interactiveHtmlFrameLayout: 'content' },
    } as T;
    migrated.set(element.id, { before: element, after, inset });
  }
  if (!migrated.size) return elements;
  return elements.map(element => {
    const own = migrated.get(element.id);
    if (own) return own.after;
    const target = element.customData?.role === 'image-cover' && typeof element.customData.imageId === 'string'
      ? migrated.get(element.customData.imageId) : null;
    if (!target) return element;
    const candidate = element.customData?.coverRect;
    const stored = candidate && typeof candidate === 'object' && !Array.isArray(candidate)
      && ['x','y','width','height'].every(key => typeof (candidate as Record<string,unknown>)[key] === 'number'
        && Number.isFinite((candidate as Record<string,unknown>)[key]))
      ? constrainImageCoverRect(candidate as ImageCoverRect) : sceneCoverToImageRect(target.before, element);
    const rect = remapRect(stored, target.before.height, target.inset);
    return { ...element, ...imageCoverRectToScene(target.after, rect),
      version: element.version + 1, versionNonce: element.versionNonce + 1,
      customData: { ...element.customData, coverRect: rect },
    } as T;
  });
}
function remapRect(rect: ImageCoverRect, height: number, inset: number) {
  const top = Math.max(inset, rect.y * height);
  const bottom = Math.max(top, Math.min(height, (rect.y + rect.height) * height));
  return constrainImageCoverRect({ ...rect, y: (top - inset) / (height - inset), height: (bottom - top) / (height - inset) });
}

/** Viewport obstacle for the selected HTML controls, rotated with the carrier. */
export function getInteractiveHtmlControlsBounds(centerX: number, centerY: number, width: number, height: number, angle: number, zoom: number) {
  const right = width / 2;
  const bottom = -height / 2 - 12 * zoom;
  const points = [[right - 168 * zoom, bottom - 58 * zoom], [right, bottom - 58 * zoom], [right, bottom], [right - 168 * zoom, bottom]].map(([x,y]) => ({
    x: centerX + x * Math.cos(angle) - y * Math.sin(angle),
    y: centerY + x * Math.sin(angle) + y * Math.cos(angle),
  }));
  return { left: Math.min(...points.map(p=>p.x)), right: Math.max(...points.map(p=>p.x)), top: Math.min(...points.map(p=>p.y)), bottom: Math.max(...points.map(p=>p.y)) };
}

/** Keep context actions reachable in canvas pixels, independently of paper zoom/rotation. */
export function interactiveHtmlControlsPosition(
  frame:{centerX:number;centerY:number;width:number;height:number;angle:number;viewportWidth:number;viewportHeight:number},
  controlsWidth:number,controlsHeight=56,
  occupied:readonly {left:number;top:number;width:number;height:number}[]=[],
) {
  const c=Math.cos(frame.angle),s=Math.sin(frame.angle);
  const cornerX=frame.centerX+frame.width/2*c+frame.height/2*s;
  const cornerY=frame.centerY+frame.width/2*s-frame.height/2*c;
  const clamp=(value:number,extent:number,size:number)=>Math.max(8,Math.min(value,extent-size-8));
  const base={left:clamp(cornerX-controlsWidth,frame.viewportWidth,controlsWidth),top:clamp(cornerY-controlsHeight-8,frame.viewportHeight,controlsHeight)};
  const candidates=[base,...occupied.flatMap(rect=>[
    {left:rect.left-controlsWidth-8,top:base.top},{left:rect.left+rect.width+8,top:base.top},
    {left:base.left,top:rect.top-controlsHeight-8},{left:base.left,top:rect.top+rect.height+8},
  ])].map(p=>({left:clamp(p.left,frame.viewportWidth,controlsWidth),top:clamp(p.top,frame.viewportHeight,controlsHeight)}));
  const available=candidates.filter(p=>occupied.every(rect=>p.left+controlsWidth+4<=rect.left||p.left>=rect.left+rect.width+4
    ||p.top+controlsHeight+4<=rect.top||p.top>=rect.top+rect.height+4));
  return available.sort((a,b)=>(a.left-base.left)**2+(a.top-base.top)**2-(b.left-base.left)**2-(b.top-base.top)**2)[0]??base;
}
