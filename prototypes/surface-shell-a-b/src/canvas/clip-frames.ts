import {canMirrorEmbeddedApp} from "../embedded-apps.ts";
/** Lesson-owned presentation sequence: area geometry or a reference to a canvas material. */
import { isTimerWidget } from '../widgets/timer.ts';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

export type ClipFrame = { id: string; number: number; x: number; y: number; width: number; height: number };
export type MaterialClip = { id: string; number: number; kind: 'material'; elementId: string };
export type PresentationClip = ClipFrame | MaterialClip;
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
    return {id:v.id, number:v.number, x:v.x, y:v.y, width:v.width, height:v.height};
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
