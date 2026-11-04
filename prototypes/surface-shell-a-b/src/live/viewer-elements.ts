import type { PublicElement } from "../../../../shared/live-canvas/protocol";

type RenderedElement = { id: string };

/** Canonical content supersedes an expendable preview of the same object.
 * This makes the scene commit sufficient recovery when an ink `end` packet
 * was dropped under backpressure. Unrelated active previews remain visible. */
export function discardCommittedInkPreviews<T>(
  previews: Map<string,T>,
  upserts: readonly Pick<PublicElement,"id">[],
  removed: readonly string[],
) {
  for (const id of removed) previews.delete(id);
  for (const element of upserts) previews.delete(element.id);
}

/** Diff reconstruction retains object identity for unchanged wire elements.
 * If exactly one unbound ink/line element changed, the viewer can restore only
 * that element and retain every decoded image and native element identity. */
export function incrementalLinearElementIndex(
  previous: readonly PublicElement[] | null,
  next: readonly PublicElement[],
  rendered: readonly RenderedElement[] | null,
) {
  if (!previous || !rendered || previous.length !== next.length || rendered.length !== next.length) return null;
  let changed = -1;
  for (let index = 0; index < next.length; index++) {
    if (previous[index].id !== next[index].id || rendered[index].id !== next[index].id) return null;
    if (previous[index] === next[index]) continue;
    if (changed !== -1) return null;
    changed = index;
  }
  if (changed === -1) return null;
  const element = next[changed];
  const before = previous[changed];
  if ((element.type !== "freedraw" && element.type !== "line") || before.type !== element.type
    || before.boundElements?.length || element.boundElements?.length) return null;
  if(element.type==='line'&&[before,element].some(value=>value.points?.[0]?.[0]!==0||value.points?.[0]?.[1]!==0))return null;
  return changed;
}
