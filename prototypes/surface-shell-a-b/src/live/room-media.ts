import type {RoomVideoCommand} from './room-video-status.ts';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { LiveMaterialAnnotation } from '../../../../shared/live-canvas/protocol';
import { lessonMaterialFileUrl } from '../lesson-materials.ts';
import { imageAnnotationGroupId } from '../canvas/image-annotation-selection.ts';
import { imageCoverBelongsTo, sceneCoverToImageRect, constrainImageCoverRect, type ImageCoverRect } from '../canvas/image-cover.ts';
import { projectInteractiveHtmlAnnotations } from '../canvas/interactive-html-annotations.ts';

export type RoomMediaPlayback = { playing: boolean; position: number; updatedAt: number; volume?:number;commandSequence?:number };
export type RoomMedia = RoomMediaPlayback & {
  id: string; kind: 'audio' | 'video' | 'youtube'; title: string;
  attempt?: number;suspended?:boolean;command?:{sequence:number;action:RoomVideoCommand};
  x: number; y: number; width: number; height: number; angle: number;
  sourceUrl?: string; videoId?: string;
  cover?: ImageCoverRect; annotations: LiveMaterialAnnotation[];
};

/** Audio stays audible at the teacher device and never controls the Room target. */
export function isRoomMediaElement(element: ExcalidrawElement): boolean {
  return !element.isDeleted && ['video', 'youtube'].includes(String(element.customData?.materialKind));
}

/** Local Room channel only. Archive URLs never enter the Remote Canvas wire. */
export function roomMediaFromElement(
  element: ExcalidrawElement, elements: readonly ExcalidrawElement[], playback: RoomMediaPlayback,
): RoomMedia | null {
  if (!isRoomMediaElement(element)) return null;
  const kind = element.customData!.materialKind as RoomMedia['kind'];
  const title = typeof element.customData?.sourceTitle === 'string' && element.customData.sourceTitle.trim()
    ? element.customData.sourceTitle : 'Material';
  let sourceUrl: string | undefined;
  let videoId: string | undefined;
  if (kind === 'youtube') {
    const candidate = element.customData?.videoId;
    if (typeof candidate !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(candidate)) return null;
    videoId = candidate;
  } else {
    const lessonId = element.customData?.sourceLessonId;
    const path = element.customData?.sourceMaterialPath;
    if (typeof lessonId !== 'string' || !lessonId || typeof path !== 'string' || !path) return null;
    sourceUrl = lessonMaterialFileUrl(lessonId, path);
  }
  const coverElement = elements.find(candidate => !candidate.isDeleted && candidate.type === 'rectangle' && imageCoverBelongsTo(candidate, element.id));
  const cover = coverElement ? constrainImageCoverRect(sceneCoverToImageRect(element, coverElement)) : undefined;
  const projected = projectInteractiveHtmlAnnotations(element, elements, imageAnnotationGroupId(element.id), {});
  const annotations: LiveMaterialAnnotation[] = projected.annotations.map(annotation => annotation.kind === 'stroke' ? {
    kind: 'stroke', x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height,
    angle: annotation.angle, opacity: annotation.opacity, strokeColor: annotation.strokeColor,
    strokeWidth: annotation.strokeWidth, points: annotation.points.map(point => [point.x, point.y]),
    ...(annotation.fillColor ? { fillColor: annotation.fillColor } : {}),
  } : {
    kind: 'text', x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height,
    angle: annotation.angle, opacity: annotation.opacity, color: annotation.color, fontSize: annotation.fontSize,
    lineHeight: annotation.lineHeight, text: annotation.text, textAlign: annotation.textAlign,
  });
  return { id: element.id, kind, title, x: element.x, y: element.y, width: element.width, height: element.height,
    angle: element.angle, ...(sourceUrl ? { sourceUrl } : {}), ...(videoId ? { videoId } : {}),
    ...(cover ? { cover } : {}), annotations, ...playback };
}

export function roomMediaPosition(playback:RoomMediaPlayback,now=Date.now()) {
  return playback.position+(playback.playing?Math.max(0,Math.min(10,(now-playback.updatedAt)/1000)):0);
}
