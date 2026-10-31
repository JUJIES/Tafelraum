export const audioPlayerRoundness = { type: 3 as const, value: 14 };
export const audioPlayerWidth = 460;
export const audioPlayerHeight = 88;

export function getAudioPlayerViewportScale(width: number, height: number) {
  const scale = Math.min(width / audioPlayerWidth, height / audioPlayerHeight);
  if (!Number.isFinite(scale)) return 1;
  return Math.max(Number.EPSILON, scale);
}
