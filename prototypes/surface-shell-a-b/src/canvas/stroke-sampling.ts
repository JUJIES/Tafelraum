export type StrokePoint = readonly [number, number];

/** Gesture-only, append-only centerline plus an immediately following live tip. */
export type StrokeSampler = {
  points: StrokePoint[];
  tip: StrokePoint;
  spacing: number;
  remaining: number;
  direction: StrokePoint | null;
};

export function createStrokeSampler(start: StrokePoint, zoom: number, width: number, screenSpacing = 2.5): StrokeSampler {
  const spacing = Math.min(screenSpacing / zoom, width / 4);
  return { points: [start], tip: start, spacing, remaining: spacing, direction: null };
}

export function sampleStrokePoint(state: StrokeSampler, point: StrokePoint) {
  const previous = state.tip;
  const dx = point[0] - previous[0], dy = point[1] - previous[1];
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1e-8) return false;
  const direction: StrokePoint = [dx / length, dy / length];
  // Retain deliberate corners/reversals; tiny angle noise adds no extra points.
  if (state.direction && length >= state.spacing / 4
    && direction[0] * state.direction[0] + direction[1] * state.direction[1] < 0.5) {
    const last = state.points.at(-1)!;
    if (Math.hypot(last[0] - previous[0], last[1] - previous[1]) >= state.spacing / 4) {
      state.points.push(previous);
      state.remaining = state.spacing;
    }
  }
  let distance = state.remaining;
  while (distance <= length + 1e-8) {
    const t = Math.min(1, distance / length);
    state.points.push([previous[0] + dx * t, previous[1] + dy * t]);
    distance += state.spacing;
  }
  state.remaining = distance - length;
  state.tip = point;
  if (length >= state.spacing / 4) state.direction = direction;
  return true;
}
