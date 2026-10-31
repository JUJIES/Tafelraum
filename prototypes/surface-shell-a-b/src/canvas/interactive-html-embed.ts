import {
  constrainImageCoverRect,
  isImageCoverFull,
  type ImageCoverRect,
} from "./image-cover.ts";
import type { CanvasTool } from "./canvas-port.ts";

export const interactiveHtmlTitlebarHeight = 48;
/** Scene-space radius shared by the HTML viewport and its native cover. */
export const interactiveHtmlCornerRadius = 14;
export const interactiveHtmlMaxPlacementWidth = 1000;
export const interactiveHtmlMaxPlacementHeight = 720;
export const interactiveHtmlContentZoomMinimum = 0.5;
export const interactiveHtmlContentZoomMaximum = 2;
export const interactiveHtmlContentZoomStep = 0.1;

export type InteractiveHtmlZoomMessage = {
  type: "tafelraum:interactive-zoom";
  clientX: number;
  clientY: number;
  deltaMode: number;
  deltaX: number;
  deltaY: number;
};

export type InteractiveHtmlWheelPanMessage = {
  type: "tafelraum:interactive-wheel-pan";
  clientX: number;
  clientY: number;
  deltaMode: number;
  deltaX: number;
  deltaY: number;
  shiftKey: boolean;
};

export type InteractiveHtmlScrollMessage = {
  type: "tafelraum:interactive-scroll";
  scrollX: number;
  scrollY: number;
};

export type InteractiveHtmlScrollOffset = Readonly<{
  x: number;
  y: number;
}>;

export type InteractiveHtmlPanMessage = {
  type: "tafelraum:interactive-pan";
  phase: "cancel" | "end" | "move" | "start";
  clientX: number;
  clientY: number;
  pointerId: number;
};

export type InteractiveHtmlMaterialMoveMessage = Omit<InteractiveHtmlPanMessage, "type"> & {
  type: "tafelraum:interactive-material-move";
  screenX: number;
  screenY: number;
};

export function parseInteractiveHtmlMaterialMoveMessage(value: unknown): InteractiveHtmlMaterialMoveMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<InteractiveHtmlMaterialMoveMessage>;
  if (!parseInteractiveHtmlPanMessage({ ...candidate, type: "tafelraum:interactive-pan" })
    || candidate.type !== "tafelraum:interactive-material-move"
    || ![candidate.screenX, candidate.screenY].every(number => typeof number === "number" && Number.isFinite(number) && Math.abs(number) <= 100_000)) return null;
  return candidate as InteractiveHtmlMaterialMoveMessage;
}

export type InteractiveHtmlCanvasZoomState = {
  offsetLeft: number;
  offsetTop: number;
  scrollX: number;
  scrollY: number;
  zoom: { value: number };
};

export function isInteractiveHtmlMaterialElement(element: {
  customData?: Record<string, unknown>;
  isDeleted?: boolean;
}) {
  return !element.isDeleted && element.customData?.materialKind === "interactive-html";
}

export function interactiveHtmlDefersToCanvasTool(tool: CanvasTool) {
  return tool === "pen" || tool === "marker" || tool === "eraser" || tool === "text";
}

export function getInteractiveHtmlPlacementSize(
  viewport: { width: number; height: number },
  print?: { page: "A4"; orientation: "portrait" | "landscape" } | null,
) {
  const safeWidth = Math.max(320, viewport.width);
  const paperRatio = print?.page === "A4"
    ? print.orientation === "portrait" ? 210 / 297 : 297 / 210
    : null;
  if (paperRatio !== null) {
    const paperHeight = safeWidth / paperRatio;
    const scale = Math.min(
      interactiveHtmlMaxPlacementWidth / safeWidth,
      interactiveHtmlMaxPlacementHeight / paperHeight,
      1,
    );
    return {
      width: safeWidth * scale,
      height: paperHeight * scale,
    };
  }
  const safeHeight = Math.max(240, viewport.height);
  const scale = Math.min(
    interactiveHtmlMaxPlacementWidth / safeWidth,
    interactiveHtmlMaxPlacementHeight / safeHeight,
    1,
  );
  return { width: safeWidth * scale, height: safeHeight * scale };
}

export function getInteractiveHtmlTitlebarProjection(frameHeight: number, zoom: number, titlebarHeight = interactiveHtmlTitlebarHeight) {
  const scale = Math.max(0.01, zoom);
  return {
    scale,
    viewportHeight: Math.min(Math.max(0, frameHeight), titlebarHeight * scale),
  };
}

export function normalizeInteractiveHtmlContentZoom(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.min(
    interactiveHtmlContentZoomMaximum,
    Math.max(interactiveHtmlContentZoomMinimum, Math.round(value * 10) / 10),
  );
}

export function getInteractiveHtmlContentProjection(
  frameWidth: number,
  frameHeight: number,
  canvasZoom: number,
  contentZoom: number,
  titlebarHeight = interactiveHtmlTitlebarHeight,
) {
  const safeCanvasZoom = Math.max(0.01, canvasZoom);
  const safeContentZoom = normalizeInteractiveHtmlContentZoom(contentZoom);
  const titlebar = getInteractiveHtmlTitlebarProjection(frameHeight, safeCanvasZoom, titlebarHeight);
  const viewportHeight = Math.max(0, frameHeight - titlebar.viewportHeight);
  const surface = getInteractiveHtmlSurfaceProjection(frameWidth, viewportHeight, safeCanvasZoom, safeContentZoom);
  return {
    ...surface,
    viewportHeight,
  };
}

export function getInteractiveHtmlSurfaceProjection(
  frameWidth: number,
  frameHeight: number,
  canvasZoom: number,
  contentZoom: number,
) {
  const scale = Math.max(0.01, canvasZoom) * normalizeInteractiveHtmlContentZoom(contentZoom);
  return {
    scale,
    surfaceHeight: Math.max(0, frameHeight) / scale,
    surfaceWidth: Math.max(0, frameWidth) / scale,
  };
}

function roundedProjectionValue(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function getInteractiveHtmlCoverProjection(
  frameWidth: number,
  frameHeight: number,
  coverRect: ImageCoverRect | null,
) {
  if (!coverRect) return { clipPath: undefined, fullyCovered: false };
  const cover = constrainImageCoverRect(coverRect);
  if (isImageCoverFull(cover)) return { clipPath: undefined, fullyCovered: true };

  const width = roundedProjectionValue(Math.max(0, frameWidth));
  const height = roundedProjectionValue(Math.max(0, frameHeight));
  const left = roundedProjectionValue(width * cover.x);
  const top = roundedProjectionValue(height * cover.y);
  const right = roundedProjectionValue(width * (cover.x + cover.width));
  const bottom = roundedProjectionValue(height * (cover.y + cover.height));
  // Edge-attached covers leave one visible rectangle. Use a rectangular clip
  // rather than an even-odd hole whose edges coincide with the outer frame.
  // This also avoids a moving compound mask across an iframe in WKWebView.
  const spansWidth = cover.x === 0 && cover.width === 1;
  const spansHeight = cover.y === 0 && cover.height === 1;
  const inset = spansWidth && cover.y === 0 ? [bottom, 0, 0, 0]
    : spansWidth && cover.y + cover.height === 1 ? [0, 0, height - top, 0]
    : spansHeight && cover.x === 0 ? [0, 0, 0, right]
    : spansHeight && cover.x + cover.width === 1 ? [0, width - left, 0, 0]
    : null;
  if (inset) return {
    clipPath: `inset(${inset.map(value => `${roundedProjectionValue(value)}px`).join(" ")})`,
    fullyCovered: false,
  };
  return {
    clipPath: `path(evenodd, "M 0 0 H ${width} V ${height} H 0 Z M ${left} ${top} H ${right} V ${bottom} H ${left} Z")`,
    fullyCovered: false,
  };
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseInteractiveHtmlZoomMessage(value: unknown): InteractiveHtmlZoomMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<InteractiveHtmlZoomMessage>;
  if (
    candidate.type !== "tafelraum:interactive-zoom"
    || !finiteNumber(candidate.clientX)
    || !finiteNumber(candidate.clientY)
    || !finiteNumber(candidate.deltaMode)
    || !finiteNumber(candidate.deltaX)
    || !finiteNumber(candidate.deltaY)
    || Math.abs(candidate.clientX!) > 100_000
    || Math.abs(candidate.clientY!) > 100_000
    || Math.abs(candidate.deltaX!) > 100_000
    || Math.abs(candidate.deltaY!) > 100_000
  ) return null;
  return candidate as InteractiveHtmlZoomMessage;
}

export function parseInteractiveHtmlWheelPanMessage(value: unknown): InteractiveHtmlWheelPanMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<InteractiveHtmlWheelPanMessage>;
  if (
    candidate.type !== "tafelraum:interactive-wheel-pan"
    || !finiteNumber(candidate.clientX)
    || !finiteNumber(candidate.clientY)
    || !finiteNumber(candidate.deltaMode)
    || !finiteNumber(candidate.deltaX)
    || !finiteNumber(candidate.deltaY)
    || typeof candidate.shiftKey !== "boolean"
    || Math.abs(candidate.clientX!) > 100_000
    || Math.abs(candidate.clientY!) > 100_000
    || Math.abs(candidate.deltaX!) > 100_000
    || Math.abs(candidate.deltaY!) > 100_000
  ) return null;
  return candidate as InteractiveHtmlWheelPanMessage;
}

export function parseInteractiveHtmlScrollMessage(value: unknown): InteractiveHtmlScrollMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<InteractiveHtmlScrollMessage>;
  if (
    candidate.type !== "tafelraum:interactive-scroll"
    || !finiteNumber(candidate.scrollX)
    || !finiteNumber(candidate.scrollY)
    || candidate.scrollX! < 0
    || candidate.scrollY! < 0
    || candidate.scrollX! > 1_000_000
    || candidate.scrollY! > 1_000_000
  ) return null;
  return candidate as InteractiveHtmlScrollMessage;
}

export function getInteractiveHtmlAnnotationScrollTranslation(
  anchor: InteractiveHtmlScrollOffset | null | undefined,
  current: InteractiveHtmlScrollOffset,
  contentZoom: number,
  pageScale?: number,
) {
  const safeAnchor = anchor ?? { x: 0, y: 0 };
  const scale = pageScale ?? normalizeInteractiveHtmlContentZoom(contentZoom);
  return {
    x: (safeAnchor.x - current.x) * scale,
    y: (safeAnchor.y - current.y) * scale,
  };
}

export function parseInteractiveHtmlPanMessage(value: unknown): InteractiveHtmlPanMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<InteractiveHtmlPanMessage>;
  if (
    candidate.type !== "tafelraum:interactive-pan"
    || !["cancel", "end", "move", "start"].includes(candidate.phase ?? "")
    || !finiteNumber(candidate.clientX)
    || !finiteNumber(candidate.clientY)
    || !finiteNumber(candidate.pointerId)
    || Math.abs(candidate.clientX!) > 100_000
    || Math.abs(candidate.clientY!) > 100_000
    || candidate.pointerId! < 0
    || candidate.pointerId! > 1_000_000
  ) return null;
  return candidate as InteractiveHtmlPanMessage;
}

export function getInteractiveHtmlCanvasPan(
  delta: { x: number; y: number },
  appState: Pick<InteractiveHtmlCanvasZoomState, "scrollX" | "scrollY" | "zoom">,
) {
  const zoom = Math.max(0.01, appState.zoom.value);
  return {
    scrollX: appState.scrollX + delta.x / zoom,
    scrollY: appState.scrollY + delta.y / zoom,
  };
}

export function getInteractiveHtmlCanvasZoom(
  message: InteractiveHtmlZoomMessage,
  viewportPoint: { clientX: number; clientY: number },
  appState: InteractiveHtmlCanvasZoomState,
) {
  const sign = Math.sign(message.deltaY);
  const absoluteDelta = Math.abs(message.deltaY);
  const limitedDelta = Math.min(10, absoluteDelta) * sign;
  const currentZoom = appState.zoom.value;
  const acceleratedDelta = Math.log10(Math.max(1, currentZoom))
    * -sign
    * Math.min(1, absoluteDelta / 20);
  const nextZoom = Math.min(30, Math.max(0.1, Number((currentZoom - limitedDelta / 100 + acceleratedDelta).toFixed(6))));
  const appLayerX = viewportPoint.clientX - appState.offsetLeft;
  const appLayerY = viewportPoint.clientY - appState.offsetTop;
  return {
    scrollX: appState.scrollX - appLayerX / currentZoom + appLayerX / nextZoom,
    scrollY: appState.scrollY - appLayerY / currentZoom + appLayerY / nextZoom,
    zoom: { value: nextZoom },
  };
}
