import type { ExcalidrawElement, NonDeleted } from "@excalidraw/excalidraw/element/types";

export const youtubePlayerWidth = 640;
export const youtubePlayerHeight = 360;
export const youtubeProviderControlsHeight = 128;
export const youtubeProviderTopControlsHeight = 64;

export type YouTubeMaterialElement = NonDeleted<ExcalidrawElement> & {
  customData: Record<string, unknown> & { materialKind: "youtube" };
};

export function isYouTubeMaterialElement(
  element: ExcalidrawElement,
): element is YouTubeMaterialElement {
  return !element.isDeleted && element.customData?.materialKind === "youtube";
}

export function getYouTubePlayerProjectionSize(width: number, height: number, zoom: number) {
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const surfaceScale = Math.min(1, safeZoom);
  const viewportHeight = Math.abs(height) * safeZoom;
  const viewportWidth = Math.abs(width) * safeZoom;
  return {
    surfaceHeight: viewportHeight / surfaceScale,
    surfaceScale,
    surfaceWidth: viewportWidth / surfaceScale,
    viewportHeight,
    viewportWidth,
  };
}

export function getYouTubeProviderControlsHeight(surfaceHeight: number) {
  const safeHeight = Number.isFinite(surfaceHeight) ? Math.max(0, surfaceHeight) : 0;
  return Math.min(youtubeProviderControlsHeight, safeHeight * 0.5);
}

export function getYouTubeProviderTopControlsHeight(surfaceHeight: number) {
  const safeHeight = Number.isFinite(surfaceHeight) ? Math.max(0, surfaceHeight) : 0;
  return Math.min(youtubeProviderTopControlsHeight, safeHeight * 0.25);
}

export function getYouTubeEmbedUrl(videoId: string, origin: string) {
  const query = new URLSearchParams({
    enablejsapi: "1",
    origin,
    playsinline: "1",
    rel: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${query.toString()}`;
}

export function getYouTubePlayingStateFromMessage(data: unknown): boolean | null {
  let payload = data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload) as unknown;
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== "object" || !("event" in payload) || payload.event !== "infoDelivery") {
    return null;
  }
  const info = "info" in payload ? payload.info : null;
  if (!info || typeof info !== "object" || !("playerState" in info) || typeof info.playerState !== "number") {
    return null;
  }
  if (info.playerState === 1 || info.playerState === 3) return true;
  if (info.playerState === -1 || info.playerState === 0 || info.playerState === 2 || info.playerState === 5) return false;
  return null;
}

export function getYouTubeCurrentTimeFromMessage(data: unknown): number | null {
  let payload = data;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) as unknown; } catch { return null; }
  }
  if (!payload || typeof payload !== 'object' || !('event' in payload) || payload.event !== 'infoDelivery') return null;
  const info = 'info' in payload ? payload.info : null;
  if (!info || typeof info !== 'object' || !('currentTime' in info)) return null;
  const value = info.currentTime;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function getYouTubePlaybackCommand(isPlaying: boolean) {
  return isPlaying ? "pauseVideo" : "playVideo";
}

export function shouldToggleYouTubePlaybackAfterGesture(moved: boolean) {
  return !moved;
}

export function getYouTubePlaceholderPatch(element: ExcalidrawElement) {
  if (element.customData?.materialKind !== "youtube") return null;
  const archiveMaterialPath = element.customData.archiveMaterialPath;
  const title = element.customData.sourceTitle;
  const url = element.customData.sourceUrl;
  const videoId = element.customData.videoId;
  if (
    typeof archiveMaterialPath !== "string"
    || typeof title !== "string"
    || typeof url !== "string"
    || typeof videoId !== "string"
  ) return null;

  const hasLegacyRendererData = "generationData" in element.customData
    || "hideLinkIcon" in element.customData;
  const isCleanPlaceholder = element.type === "rectangle"
    && element.backgroundColor === "transparent"
    && element.strokeColor === "transparent"
    && element.fillStyle === "solid"
    && element.opacity === 100
    && element.roughness === 0
    && element.strokeWidth === 1
    && element.link === null
    && !hasLegacyRendererData;
  if (isCleanPlaceholder) return null;

  const {
    generationData: _generationData,
    hideLinkIcon: _hideLinkIcon,
    ...customData
  } = element.customData;
  return {
    type: "rectangle",
    backgroundColor: "transparent",
    customData,
    fillStyle: "solid",
    link: null,
    opacity: 100,
    roughness: 0,
    roundness: null,
    strokeColor: "transparent",
    strokeWidth: 1,
  } as const;
}

export function getYouTubeVolumeFromMessage(data:unknown):number|null{
  let payload:unknown=data;
  if(typeof payload==='string'){try{payload=JSON.parse(payload);}catch{return null;}}
  if(!payload||typeof payload!=='object'||!('info' in payload)||!payload.info||typeof payload.info!=='object'||!('volume' in payload.info))return null;
  const value=payload.info.volume;
  return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?value/100:null;
}
