import type { HostPointer, LaserStyle } from '../../../../shared/live-canvas/protocol.ts';

export type TrailPoint = { x: number; y: number; at: number; stroke: number; pressed: boolean; style: LaserStyle };
export const laserStyles = [
  { id: 'comet', label: 'Komet', color: '#08a9da' },
  { id: 'ribbon', label: 'Band', color: '#8d69ee' },
  { id: 'spark', label: 'Funken', color: '#e39722' },
] as const;
export function trailLifetime(point: TrailPoint) { return point.pressed ? 1250 : 460; }
export function visibleTrail(points: TrailPoint[], now: number) {
  return points.filter(point => now - point.at < trailLifetime(point)).slice(-180);
}
export function withinClip(pointer: HostPointer | null, clip: { x: number; y: number; width: number; height: number } | null) {
  return !pointer || !clip || (pointer.x >= clip.x && pointer.y >= clip.y && pointer.x <= clip.x + clip.width && pointer.y <= clip.y + clip.height);
}
