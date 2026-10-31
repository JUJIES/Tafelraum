import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/** Display-only translations between already authorized, identical content.
 * Never interpolate a changed bitmap/crop/cover, topology, scale or paint.
 * The final native scene remains the sole target; no persisted motion model. */
export function translationOrigins(previous: readonly ExcalidrawElement[], next: readonly ExcalidrawElement[]) {
  const old = new Map(previous.map(element => [element.id, element]));
  const content = (element: ExcalidrawElement) => JSON.stringify({
    ...element, x: 0, y: 0, version: 0, versionNonce: 0, updated: 0,
  });
  return next.map(element => {
    const before = old.get(element.id);
    return before && (before.x !== element.x || before.y !== element.y)
      && content(before) === content(element) ? { x: before.x, y: before.y } : null;
  });
}

export function interpolateTranslations(
  target: readonly ExcalidrawElement[], origins: ReturnType<typeof translationOrigins>, progress: number,
): ExcalidrawElement[] {
  if (progress >= 1) return [...target];
  const t = Math.max(0, progress);
  return target.map((element, index) => {
    const origin = origins[index];
    return origin ? { ...element, x: origin.x + (element.x - origin.x) * t, y: origin.y + (element.y - origin.y) * t } : element;
  });
}
