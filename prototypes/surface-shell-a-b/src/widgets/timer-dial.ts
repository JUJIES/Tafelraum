import { t } from "../i18n/translate.ts";
/** Nonlinear duration selection, deliberately separate from the linear countdown. */
export const timerDialStops = [10, 30, 60, 120, 180, 240, 300, 600, 900, 1800, 3600] as const;
export const timerDialLabels = ['10 s', '30 s', '1 m', '2 m', '3 m', '4 m', '5 m', '10 m', '15 m', '30 m', '60 m'] as const;
export const timerDialCenter = { x: 150, y: 146 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function timerDialFraction(seconds: number) {
  if (seconds <= timerDialStops[0]) return 0;
  for (let i = 0; i < timerDialStops.length - 1; i++) {
    if (seconds <= timerDialStops[i + 1]) return (i + (seconds - timerDialStops[i]) / (timerDialStops[i + 1] - timerDialStops[i])) / 10;
  }
  return 1;
}
export function timerDialDuration(fraction: number) {
  const index = clamp(fraction, 0, 1) * 10;
  const i = Math.min(9, Math.floor(index));
  const raw = timerDialStops[i] + (timerDialStops[i + 1] - timerDialStops[i]) * (index - i);
  const step = raw <= 60 ? 5 : raw <= 300 ? 15 : raw <= 900 ? 30 : 60;
  return clamp(Math.round(raw / step) * step, 10, 3600);
}
export function timerDialPoint(fraction: number, radius = 96) {
  const angle = (-225 + 270 * fraction) * Math.PI / 180;
  return { x: timerDialCenter.x + Math.cos(angle) * radius, y: timerDialCenter.y + Math.sin(angle) * radius };
}
export function timerDialArc(fraction: number) {
  const a = timerDialPoint(0), b = timerDialPoint(Math.max(0.000001, fraction));
  return `M ${a.x} ${a.y} A 96 96 0 ${fraction > 2 / 3 ? 1 : 0} 1 ${b.x} ${b.y}`;
}
/** Undo the native carrier's CSS rotation/scale before interpreting the pointer. */
export function timerDialLocalPoint(client: { x: number; y: number }, bounds: { left: number; top: number; width: number; height: number }, angle: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const scale = Math.min(bounds.width / (300 * Math.abs(c) + 292 * Math.abs(s)), bounds.height / (300 * Math.abs(s) + 292 * Math.abs(c)));
  const dx = client.x - bounds.left - bounds.width / 2, dy = client.y - bounds.top - bounds.height / 2;
  return { x: (dx * c + dy * s) / scale + 150, y: (-dx * s + dy * c) / scale + 146 };
}
/** Unwrap against the previous pointer angle so crossing the gap stays at the
 * same end until the finger reverses, rather than jumping 10s ↔ 60min. */
export function timerDialAngleAtPoint(point: { x: number; y: number }, previousAngle?: number) {
  let degrees = Math.atan2(point.y - timerDialCenter.y, point.x - timerDialCenter.x) * 180 / Math.PI;
  if (previousAngle === undefined) {
    if (degrees > 90) degrees -= 360;
  } else degrees += Math.round((previousAngle - degrees) / 360) * 360;
  return degrees;
}
export function timerDialFractionAtPoint(point: { x: number; y: number }, previousAngle?: number) {
  return clamp((timerDialAngleAtPoint(point, previousAngle) + 225) / 270, 0, 1);
}
export function parseTimerDuration(text: string): number | null {
  const parts = text.trim().match(/^(\d{1,4})(?::([0-5]?\d))?$/);
  if (!parts) return null;
  const seconds = Number(parts[1]) * 60 + Number(parts[2] ?? 0);
  return seconds >= 1 && seconds <= 86400 ? seconds : null;
}
export function timerDurationLabel(seconds: number) {
  return seconds < 60 ? t("{0} Sekunden", seconds) : seconds % 60 === 0 ? t("{0} Minuten", seconds / 60) : t("{0} Minuten {1} Sekunden", Math.floor(seconds / 60), seconds % 60);
}
