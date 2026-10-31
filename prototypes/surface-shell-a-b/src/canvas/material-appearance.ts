import type { ExcalidrawElement, ExcalidrawImageElement } from '@excalidraw/excalidraw/element/types';
import { interactiveHtmlCornerRadius } from './interactive-html-embed.ts';
import { getVideoPlayerViewportScale } from './video-embed.ts';

/** Match the native image clip, including adaptive roundness on small images. */
export function getImageCornerRadius(image: Pick<ExcalidrawImageElement, 'width' | 'height' | 'roundness'>) {
  const quarterEdge = Math.min(Math.abs(image.width), Math.abs(image.height)) / 4;
  return !image.roundness ? 0 : image.roundness.type === 3
    ? Math.min(image.roundness.value ?? 32, quarterEdge) : quarterEdge;
}

/** CSS radius of the visible host material, in viewport pixels. */
export function getMaterialBorderRadius(element: ExcalidrawElement, zoom: number): number | string {
  if (element.type === 'image') return getImageCornerRadius(element) * zoom;
  if (element.customData?.materialKind === 'interactive-html' || element.customData?.embeddedAppId) {
    return interactiveHtmlCornerRadius * zoom;
  }
  if (element.customData?.materialKind === 'video') {
    return 14 * getVideoPlayerViewportScale(element.width * zoom, element.height * zoom);
  }
  if (element.customData?.materialKind === 'youtube') return 'min(12px, 3%)';
  // Timers and legacy audio keep their rectangular clip envelope.
  return 4;
}
