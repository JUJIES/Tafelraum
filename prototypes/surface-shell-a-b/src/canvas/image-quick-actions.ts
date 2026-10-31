export type ImageQuickActionSide = "top" | "bottom" | "left" | "right";

export type ImageQuickActionLayout = {
  points: Array<{ x: number; y: number }>;
  side: ImageQuickActionSide;
};

type ImageQuickActionLayoutInput = {
  actionCount: number;
  angle: number;
  buttonSize: number;
  centerX: number;
  centerY: number;
  gap: number;
  height: number;
  obstacles?: readonly { bottom: number; left: number; right: number; top: number }[];
  sidePreference?: readonly ImageQuickActionSide[];
  sideInsets?: Partial<Record<ImageQuickActionSide, number>>;
  alignToVisibleEnd?: boolean;
  viewportHeight: number;
  viewportWidth: number;
  width: number;
};

const viewportMargin = 4;

/** Reserved action-row width; never apply this minimum to the engine textarea. */
export function getTextEntryMinimumWidth(zoom: number, buttonSize: number, gap: number): number {
  return (3 * buttonSize + 2 * gap + 24) / Math.max(0.1, zoom);
}

function overflowScore(points: readonly { x: number; y: number }[], radius: number, viewportWidth: number, viewportHeight: number) {
  const minX = Math.min(...points.map((point) => point.x - radius));
  const maxX = Math.max(...points.map((point) => point.x + radius));
  const minY = Math.min(...points.map((point) => point.y - radius));
  const maxY = Math.max(...points.map((point) => point.y + radius));
  return Math.max(0, viewportMargin - minX)
    + Math.max(0, maxX - (viewportWidth - viewportMargin))
    + Math.max(0, viewportMargin - minY)
    + Math.max(0, maxY - (viewportHeight - viewportMargin));
}

function obstacleOverlapScore(
  points: readonly { x: number; y: number }[],
  radius: number,
  obstacles: readonly { bottom: number; left: number; right: number; top: number }[],
) {
  return points.reduce((score, point) => score + obstacles.reduce((pointScore, obstacle) => {
    const overlapWidth = Math.max(0, Math.min(point.x + radius, obstacle.right) - Math.max(point.x - radius, obstacle.left));
    const overlapHeight = Math.max(0, Math.min(point.y + radius, obstacle.bottom) - Math.max(point.y - radius, obstacle.top));
    return pointScore + overlapWidth * overlapHeight;
  }, 0), 0);
}

function fitPointsToViewport(points: readonly { x: number; y: number }[], radius: number, viewportWidth: number, viewportHeight: number) {
  const minX = Math.min(...points.map((point) => point.x - radius));
  const maxX = Math.max(...points.map((point) => point.x + radius));
  const minY = Math.min(...points.map((point) => point.y - radius));
  const maxY = Math.max(...points.map((point) => point.y + radius));
  const shiftX = minX < viewportMargin
    ? viewportMargin - minX
    : maxX > viewportWidth - viewportMargin
      ? viewportWidth - viewportMargin - maxX
      : 0;
  const shiftY = minY < viewportMargin
    ? viewportMargin - minY
    : maxY > viewportHeight - viewportMargin
      ? viewportHeight - viewportMargin - maxY
      : 0;
  return points.map((point) => ({ x: point.x + shiftX, y: point.y + shiftY }));
}

export function getImageQuickActionLayout({
  actionCount,
  angle,
  buttonSize,
  centerX,
  centerY,
  gap,
  height,
  obstacles = [],
  sidePreference,
  sideInsets = {},
  alignToVisibleEnd = false,
  viewportHeight,
  viewportWidth,
  width,
}: ImageQuickActionLayoutInput): ImageQuickActionLayout {
  const safeCount = Math.max(1, Math.floor(actionCount));
  const radius = buttonSize / 2;
  const step = buttonSize + gap;
  const widthAxis = { x: Math.cos(angle), y: Math.sin(angle) };
  const heightAxis = { x: -Math.sin(angle), y: Math.cos(angle) };
  const portrait = height > width;
  const candidate = (side: ImageQuickActionSide) => {
    const verticalSide = side === "left" || side === "right";
    const along = verticalSide ? heightAxis : widthAxis;
    const normal = verticalSide ? widthAxis : heightAxis;
    const sign = side === "right" || side === "bottom" ? 1 : -1;
    const edgeDistance = (verticalSide ? width : height) / 2 + (sideInsets[side] ?? 0);
    const sideCenter = {
      x: centerX + normal.x * sign * (edgeDistance + radius + gap),
      y: centerY + normal.y * sign * (edgeDistance + radius + gap),
    };
    // Keep a material's actions near the lower/right end of a visible edge.
    // Slide along that edge, never toward the viewport independently, whenever
    // the whole group can fit. This also works for rotated objects.
    let centerOffset = 0;
    if (alignToVisibleEnd) {
      const halfGroup = (safeCount - 1) * step / 2;
      const edgeLength = verticalSide ? height : width;
      const desired = Math.max(0, edgeLength / 2 - radius - gap - 16 - halfGroup);
      let lower = -desired, upper = desired;
      for (const offset of [-halfGroup, halfGroup]) {
        for (const [base, axis, limit] of [
          [sideCenter.x + along.x * offset, along.x, viewportWidth],
          [sideCenter.y + along.y * offset, along.y, viewportHeight],
        ]) {
          const minimum = viewportMargin + radius, maximum = limit - viewportMargin - radius;
          if (Math.abs(axis) < 1e-9) {
            if (base < minimum || base > maximum) { lower = 1; upper = 0; }
          } else {
            const a = (minimum - base) / axis, b = (maximum - base) / axis;
            lower = Math.max(lower, Math.min(a, b));
            upper = Math.min(upper, Math.max(a, b));
          }
        }
      }
      centerOffset = lower <= upper ? Math.max(lower, Math.min(upper, desired)) : desired;
    }
    return Array.from({ length: safeCount }, (_, index) => {
      const offset = (index - (safeCount - 1) / 2) * step;
      return {
        x: sideCenter.x + along.x * (centerOffset + offset),
        y: sideCenter.y + along.y * (centerOffset + offset),
      };
    });
  };

  // Prefer a long edge, but let real viewport space and neighboring sheets win.
  const preferredSides: readonly ImageQuickActionSide[] = sidePreference ?? (portrait
    ? ["right", "left", "top", "bottom"]
    : ["top", "bottom", "right", "left"]);
  const score = (points: readonly { x: number; y: number }[]) => (
    overflowScore(points, radius, viewportWidth, viewportHeight) * 10_000
    + obstacleOverlapScore(points, radius, obstacles)
  );
  const best = preferredSides
    .map((side, preference) => ({ points: candidate(side), preference, side }))
    .reduce((current, next) => {
      const currentScore = score(current.points);
      const nextScore = score(next.points);
      return nextScore < currentScore || (nextScore === currentScore && next.preference < current.preference)
        ? next
        : current;
    });
  const points = fitPointsToViewport(best.points, radius, viewportWidth, viewportHeight);

  return { points, side: best.side };
}
