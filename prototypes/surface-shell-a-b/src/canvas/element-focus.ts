export type FocusFrameGeometry = {
  angle: number;
  centerX: number;
  centerY: number;
  height: number;
  width: number;
};

export type FocusDimPanel = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const geometryEpsilon = 0.01;
const angleEpsilon = 0.0001;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getElementFocusDimPanels(
  frames: readonly FocusFrameGeometry[],
  viewportWidth: number,
  viewportHeight: number,
): FocusDimPanel[] | null {
  if (viewportWidth <= 0 || viewportHeight <= 0) return null;
  if (frames.some((frame) => Math.abs(Math.sin(frame.angle)) > angleEpsilon)) return null;

  const holes = frames.flatMap((frame) => {
    const left = clamp(frame.centerX - frame.width / 2, 0, viewportWidth);
    const right = clamp(frame.centerX + frame.width / 2, 0, viewportWidth);
    const top = clamp(frame.centerY - frame.height / 2, 0, viewportHeight);
    const bottom = clamp(frame.centerY + frame.height / 2, 0, viewportHeight);
    return right - left > geometryEpsilon && bottom - top > geometryEpsilon
      ? [{ bottom, left, right, top }]
      : [];
  });

  if (holes.length === 0) return [{ height: viewportHeight, width: viewportWidth, x: 0, y: 0 }];

  const xBoundaries = [...new Set([
    0,
    viewportWidth,
    ...holes.flatMap((hole) => [hole.left, hole.right]),
  ])].sort((a, b) => a - b);
  const panels: FocusDimPanel[] = [];

  for (let index = 1; index < xBoundaries.length; index += 1) {
    const x = xBoundaries[index - 1];
    const right = xBoundaries[index];
    const width = right - x;
    if (width <= geometryEpsilon) continue;

    const visibleIntervals = holes
      .filter((hole) => hole.left < right - geometryEpsilon && hole.right > x + geometryEpsilon)
      .map((hole) => ({ bottom: hole.bottom, top: hole.top }))
      .sort((a, b) => a.top - b.top);
    const mergedIntervals = visibleIntervals.reduce<Array<{ bottom: number; top: number }>>((merged, interval) => {
      const previous = merged.at(-1);
      if (!previous || interval.top > previous.bottom + geometryEpsilon) {
        merged.push({ ...interval });
      } else {
        previous.bottom = Math.max(previous.bottom, interval.bottom);
      }
      return merged;
    }, []);

    let y = 0;
    mergedIntervals.forEach((interval) => {
      if (interval.top - y > geometryEpsilon) panels.push({ height: interval.top - y, width, x, y });
      y = Math.max(y, interval.bottom);
    });
    if (viewportHeight - y > geometryEpsilon) panels.push({ height: viewportHeight - y, width, x, y });
  }

  return panels;
}

export function nextElementFocusIds(
  currentIds: readonly string[],
  targetId: string | null,
  additive: boolean,
) {
  if (!targetId) return [];
  if (!additive) return [targetId];
  return currentIds.includes(targetId)
    ? currentIds.filter((id) => id !== targetId)
    : [...currentIds, targetId];
}

export function shouldRetargetElementFocus(activeTool: string, temporaryPan: boolean) {
  return activeTool === "selection" && !temporaryPan;
}

/** Convert the shell's free viewport into the engine's supported camera insets. */
export function materialFocusCanvasOffsets(
  viewport: { left: number; top: number; width: number; height: number },
  canvas: { offsetLeft: number; offsetTop: number; width: number; height: number },
) {
  return {
    left: Math.max(0, viewport.left - canvas.offsetLeft),
    top: Math.max(0, viewport.top - canvas.offsetTop),
    right: Math.max(0, canvas.offsetLeft + canvas.width - viewport.left - viewport.width),
    bottom: Math.max(0, canvas.offsetTop + canvas.height - viewport.top - viewport.height),
  };
}
