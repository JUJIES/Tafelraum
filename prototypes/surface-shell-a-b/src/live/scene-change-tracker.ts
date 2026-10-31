import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

type Sample = { key: string; points?: readonly (readonly number[])[]; pressures?: readonly number[] };
const sameNumbers = (a: readonly number[] | undefined, b: readonly number[] | undefined) =>
  a === undefined ? b === undefined : b !== undefined && a.length === b.length && a.every((n, i) => n === b[i]);

// Native gestures can mutate point arrays before a version changes. Keep exact
// numeric copies, not object references or a lossy hash. Stable inspections do
// not serialize/copy all ink; only changed elements replace their sample.
export class SceneChangeTracker {
  private samples: Sample[] = [];
  private background: string | undefined;

  changed(elements: readonly ExcalidrawElement[], background: string) {
    let changed = this.background !== background || this.samples.length !== elements.length;
    this.background = background;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const key = `${element.id}:${element.version}:${element.versionNonce}:${element.isDeleted}:${element.x}:${element.y}:${element.width}:${element.height}:${element.angle}`
        + (element.type === "image" ? `:${element.status}:${JSON.stringify(element.crop)}:${element.scale}` : "");
      const points = "points" in element ? element.points : undefined;
      const pressures = "pressures" in element ? element.pressures : undefined;
      const previous = this.samples[i];
      if (previous?.key === key && sameNumbers(previous.pressures, pressures)
        && (points === undefined ? previous.points === undefined : previous.points?.length === points.length
          && points.every((point, index) => sameNumbers(previous.points![index], point)))) continue;
      this.samples[i] = { key, points: points?.map(point => [...point]), pressures: pressures && [...pressures] };
      changed = true;
    }
    this.samples.length = elements.length;
    return changed;
  }
}
