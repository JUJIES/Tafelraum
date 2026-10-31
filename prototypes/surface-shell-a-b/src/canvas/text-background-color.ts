import { penRole } from "./pen-stroke.ts";
import { isCanvasAnnotationGroupId } from "./image-annotation-selection.ts";
import { adaptiveTextColors } from "./rich-text.ts";
import { shapeTextColor } from "./shape-colors.ts";

const monochrome = new Set([...adaptiveTextColors, "#000", "#fff", "#fffdf8"]);

export const isNeutralTextColor = (color: string) => monochrome.has(color.toLowerCase());

/** Explicit accent colours remain intentional; only a new neutral text default adapts. */
export function automaticTextColor(currentColor: string, backgroundColor: string) {
  return isNeutralTextColor(currentColor)
    ? shapeTextColor("solid", backgroundColor, backgroundColor) : currentColor;
}

/** Median of a small patch avoids choosing white because the pointer hit a printed glyph. */
export function sampledBackgroundColor(pixels: ArrayLike<number>, fallback: string) {
  const hex = fallback.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(hex)) return fallback;
  const base = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const samples: number[][] = [];
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / 255;
    samples.push([0, 1, 2].map(channel => Math.round(pixels[i + channel] * alpha + base[channel] * (1 - alpha))));
  }
  if (!samples.length) return fallback;
  samples.sort((a, b) => (a[0] * .2126 + a[1] * .7152 + a[2] * .0722) - (b[0] * .2126 + b[1] * .7152 + b[2] * .0722));
  return "#" + samples[Math.floor(samples.length / 2)].map(value => value.toString(16).padStart(2, "0")).join("");
}

export function canvasBackgroundAtPoint(canvas: HTMLCanvasElement | null, clientX: number, clientY: number, fallback: string) {
  if (!canvas || !canvas.width || !canvas.height) return fallback;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height || clientX < bounds.left || clientX >= bounds.right || clientY < bounds.top || clientY >= bounds.bottom) return fallback;
  const x = Math.floor((clientX - bounds.left) * canvas.width / bounds.width);
  const y = Math.floor((clientY - bounds.top) * canvas.height / bounds.height);
  const radiusX = Math.min(32, Math.ceil(8 * canvas.width / bounds.width));
  const radiusY = Math.min(32, Math.ceil(8 * canvas.height / bounds.height));
  const left = Math.max(0, x - radiusX), top = Math.max(0, y - radiusY);
  try {
    const data = canvas.getContext("2d")?.getImageData(left, top, Math.min(radiusX * 2 + 1, canvas.width - left), Math.min(radiusY * 2 + 1, canvas.height - top)).data;
    return data ? sampledBackgroundColor(data, fallback) : fallback;
  } catch { return fallback; } // Missing/tainted renderers never block text creation.
}

/** Material/shape text and pen annotations keep their own contrast when the surrounding canvas theme changes. */
export function annotationColorFollowsCanvas(element: {type: string; containerId?: string | null; groupIds: readonly string[]; customData?: Record<string, unknown>}) {
  const adapts = element.type === "text" || (element.type === "freedraw" && element.customData?.role === penRole);
  return !adapts || (!element.containerId && !element.groupIds.some(isCanvasAnnotationGroupId));
}
