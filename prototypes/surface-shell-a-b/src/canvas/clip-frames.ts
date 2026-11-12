import {canMirrorEmbeddedApp} from "../embedded-apps.ts";
/** Lesson-owned presentation sequence: area geometry or a reference to a canvas material. */
import { isTimerWidget } from '../widgets/timer.ts';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { getInteractiveHtmlAnnotationScrollTranslation, type InteractiveHtmlScrollOffset } from './interactive-html-embed.ts';
import { htmlPageProjection, readHtmlPageOrientation } from './interactive-html-pages.ts';
import { materialContainsPoint } from './material-annotation-targets.ts';

export type ClipFrame = { id: string; number: number; x: number; y: number; width: number; height: number };
type MaterialAnchor = { elementId: string; x: number; y: number };
export type ClipScrollAnchor = InteractiveHtmlScrollOffset & { elementId: string };
type HtmlAnchor = MaterialAnchor & { scroll: InteractiveHtmlScrollOffset };
export type AreaClip = ClipFrame & { pdfAnchor?: MaterialAnchor | null; htmlAnchor?: HtmlAnchor | null };
type ReadScroll = (elementId: string) => InteractiveHtmlScrollOffset;
const zeroScroll = () => ({x:0,y:0});
export type MaterialClip = { id: string; number: number; kind: 'material'; elementId: string };
export type PresentationClip = AreaClip | MaterialClip;
type ClipTarget = Pick<ExcalidrawElement, 'id' | 'type' | 'customData' | 'isDeleted' | 'x' | 'y' | 'width' | 'height' | 'angle'>;

function isPdfPage(element: ClipTarget) {
  return !element.isDeleted && element.type === 'image'
    && (element.customData?.sourceKind === 'pdf-page' || element.customData?.sourceKind === 'pdf');
}

export function bindPdfAreaClip(clip: ClipFrame, elements: readonly ClipTarget[], preferredId?: string): AreaClip {
  const { id, number, x, y, width, height } = clip;
  const frame = { id, number, x, y, width, height };
  const corners = [{ x, y }, { x: x + width, y }, { x, y: y + height }, { x: x + width, y: y + height }];
  const pages = elements.filter(element => isPdfPage(element) && corners.every(point => materialContainsPoint(element, point)));
  const page = pages.find(element => element.id === preferredId) ?? (pages.length === 1 ? pages[0] : undefined);
  return { ...frame, pdfAnchor: page ? { elementId: page.id, x: page.x, y: page.y } : null };
}

function isScrollableHtml(element: ClipTarget) {
  return !element.isDeleted && element.customData?.materialKind === 'interactive-html';
}

export function areaClipElementId(clip: AreaClip) {
  return (clip.htmlAnchor ?? clip.pdfAnchor)?.elementId;
}

export function areaClipScrollAnchor(clip: AreaClip): ClipScrollAnchor | undefined {
  const anchor = clip.htmlAnchor;
  return anchor ? {elementId:anchor.elementId,...anchor.scroll} : undefined;
}

export function htmlClipMaterial<T extends ClipTarget>(clip: AreaClip, elements: readonly T[]) {
  return elements.find(element => element.id === clip.htmlAnchor?.elementId && isScrollableHtml(element));
}

function htmlClipTranslation(material: ClipTarget, anchor: InteractiveHtmlScrollOffset, current: InteractiveHtmlScrollOffset) {
  const page = readHtmlPageOrientation(material.customData?.interactiveHtmlPageOrientation);
  const zoom = material.customData?.interactiveHtmlContentZoom;
  const local = getInteractiveHtmlAnnotationScrollTranslation(anchor,current,typeof zoom === 'number' ? zoom : 1,
    page ? htmlPageProjection(material.width,material.height,page).scale : undefined);
  const cos = Math.cos(material.angle), sin = Math.sin(material.angle);
  return {x:local.x*cos-local.y*sin,y:local.x*sin+local.y*cos};
}

/** Edits use visible teacher coordinates. Retain the original document offset
 * when editing on the same sheet, so the room does not have to scroll. */
export function bindAreaClip(frame: ClipFrame, elements: readonly ClipTarget[], readScroll: ReadScroll = zeroScroll, previous?: AreaClip): AreaClip {
  const center = {x:frame.x+frame.width/2,y:frame.y+frame.height/2};
  const html = elements.filter(element => isScrollableHtml(element) && materialContainsPoint(element,center));
  const material = html.find(element => element.id === previous?.htmlAnchor?.elementId) ?? (html.length === 1 ? html[0] : undefined);
  if (!material) return {...bindPdfAreaClip(frame,elements,previous?.pdfAnchor?.elementId),htmlAnchor:null};
  const current = readScroll(material.id);
  const scroll = previous?.htmlAnchor?.elementId === material.id ? previous.htmlAnchor.scroll : current;
  const delta = htmlClipTranslation(material,scroll,current);
  return {...frame,x:frame.x-delta.x,y:frame.y-delta.y,pdfAnchor:null,
    htmlAnchor:{elementId:material.id,x:material.x,y:material.y,scroll}};
}

export function restoreAreaClip(clip: AreaClip, elements: readonly ClipTarget[]): AreaClip {
  if (clip.htmlAnchor !== undefined || clip.pdfAnchor) return clip;
  return bindAreaClip(clip,elements);
}

/** Without a scroll reader, resolve in the saved document view for output.
 * The teacher overlay uses the current local scroll instead. */
export function resolveAreaClip(clip: AreaClip, elements: readonly ClipTarget[], readScroll?: ReadScroll): ClipFrame | null {
  const { pdfAnchor, htmlAnchor, ...frame } = clip;
  const anchor = htmlAnchor ?? pdfAnchor;
  if (!anchor) return frame;
  const material = htmlAnchor ? htmlClipMaterial(clip,elements) : elements.find(element => element.id === anchor.elementId && isPdfPage(element));
  if (!material) return null;
  const delta = htmlAnchor && readScroll ? htmlClipTranslation(material,htmlAnchor.scroll,readScroll(material.id)) : {x:0,y:0};
  return { ...frame, x:frame.x+material.x-anchor.x+delta.x, y:frame.y+material.y-anchor.y+delta.y };
}
export function isMaterialClip(clip: PresentationClip): clip is MaterialClip {
  return 'kind' in clip && clip.kind === 'material';
}
export function canBeMaterialClipElement(element: ExcalidrawElement): boolean {
  return !element.isDeleted && (canMirrorEmbeddedApp(element) || isTimerWidget(element) || (element.type === 'image' && element.customData?.role !== 'rich-text-rendition-v1')
    || ['interactive-html', 'video', 'youtube'].includes(String(element.customData?.materialKind)));
}
export function readClipFrames(value: unknown): PresentationClip[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 99) throw new Error('Ungültige Clip-Rahmen.');
  const ids = new Set<string>(), numbers = new Set<number>();
  const clips: PresentationClip[] = value.map(v => {
    if (!v || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v.id) || ids.has(v.id)
      || !Number.isInteger(v.number) || v.number < 1 || v.number > 99 || numbers.has(v.number))
      throw new Error('Ungültige Clips.');
    ids.add(v.id); numbers.add(v.number);
    if (v.kind === 'material') {
      if (typeof v.elementId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v.elementId))
        throw new Error('Ungültiger Materialclip.');
      return {id:v.id, number:v.number, kind:'material' as const, elementId:v.elementId};
    }
    if (v.kind !== undefined || ![v.x,v.y,v.width,v.height].every(n => Number.isFinite(n) && Math.abs(n) <= 1_000_000)
      || v.width < 20 || v.height < 20) throw new Error('Ungültige Clip-Rahmen.');
    const anchor = v.pdfAnchor, html = v.htmlAnchor;
    const validAnchor = (a: MaterialAnchor) => typeof a.elementId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(a.elementId)
      && [a.x,a.y].every(n => Number.isFinite(n) && Math.abs(n) <= 1_000_000);
    if (anchor != null && !validAnchor(anchor)) throw new Error('Ungültige PDF-Clipbindung.');
    if (html != null && (anchor != null || !validAnchor(html) || !html.scroll
      || ![html.scroll.x,html.scroll.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1_000_000))) throw new Error('Ungültige HTML-Clipbindung.');
    return {id:v.id, number:v.number, x:v.x, y:v.y, width:v.width, height:v.height,
      ...(anchor === undefined ? {} : {pdfAnchor:anchor === null ? null : {elementId:anchor.elementId,x:anchor.x,y:anchor.y}}),
      ...(html === undefined ? {} : {htmlAnchor:html === null ? null : {elementId:html.elementId,x:html.x,y:html.y,scroll:{x:html.scroll.x,y:html.scroll.y}}})};
  });
  // Older snapshots could assign several slots to one material. Keep the
  // highest slot deterministically until the normalized list is next saved.
  const materialNumbers = new Map<string, number>();
  for (const clip of clips) if (isMaterialClip(clip))
    materialNumbers.set(clip.elementId, Math.max(materialNumbers.get(clip.elementId) ?? 0, clip.number));
  return clips.filter(clip => !isMaterialClip(clip) || materialNumbers.get(clip.elementId) === clip.number);
}
export function nextClipNumber(clips: readonly PresentationClip[]) {
  let number = 1;
  while (clips.some(clip => clip.number === number)) number++;
  return number;
}
export function assignMaterialClip(clips: readonly PresentationClip[], elementId: string, id: string, number?: number) {
  const existing = clips.find(clip => isMaterialClip(clip) && clip.elementId === elementId);
  const slot = number ?? existing?.number ?? nextClipNumber(clips);
  if (slot < 1 || slot > 99) return null;
  if (existing?.number === slot) return {clips: [...clips], displaced: [] as PresentationClip[], changed: false};
  const displaced = clips.filter(clip => clip.number === slot || isMaterialClip(clip) && clip.elementId === elementId);
  const next = [...clips.filter(clip => !displaced.includes(clip)), {id,number:slot,kind:'material' as const,elementId}]
    .sort((a,b) => a.number-b.number);
  return {clips: next, displaced, changed: true};
}
