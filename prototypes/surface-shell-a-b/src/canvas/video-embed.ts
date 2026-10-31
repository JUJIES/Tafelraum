export const videoPlayerWidth = 640;
export const videoPlayerHeight = 360;

export type LocalVideoMaterialElement = {
  isDeleted?: boolean;
  customData?: Record<string, unknown> & { materialKind?: string };
};

export function isLocalVideoMaterialElement(
  element: LocalVideoMaterialElement | null | undefined,
): element is LocalVideoMaterialElement & { customData: { materialKind: "video" } } {
  return Boolean(element && !element.isDeleted && element.customData?.materialKind === "video");
}

export function getVideoPlayerViewportScale(width: number, height: number) {
  const scale = Math.min(width / videoPlayerWidth, height / videoPlayerHeight);
  if (!Number.isFinite(scale)) return 1;
  return Math.max(Number.EPSILON, scale);
}
