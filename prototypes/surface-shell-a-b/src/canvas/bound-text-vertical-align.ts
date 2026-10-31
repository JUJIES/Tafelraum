export type BoundTextVerticalAlign = "top" | "middle" | "bottom";

type ShapeBounds = { type: string; x: number; y: number; width: number; height: number };

/** Matches Excalidraw 0.18's bound-text inset for the three native shapes. */
export function boundTextY(shape: ShapeBounds, textHeight: number, align: BoundTextVerticalAlign) {
  const inset = shape.type === "ellipse"
    ? 5 + shape.height / 2 * (1 - Math.SQRT2 / 2)
    : shape.type === "diamond" ? 5 + shape.height / 4 : 5;
  const innerHeight = shape.type === "ellipse"
    ? Math.round(shape.height / 2 * Math.SQRT2) - 10
    : shape.type === "diamond" ? Math.round(shape.height / 2) - 10 : shape.height - 10;
  return shape.y + inset + (align === "top" ? 0 : align === "bottom" ? innerHeight - textHeight : (innerHeight - textHeight) / 2);
}

/** A few old rich-text scenes changed text height without updating its native
 * vertical position. Keep the visually closest anchor when upgrading them. */
export function inferLegacyBoundTextAlign(shape: ShapeBounds, y: number, textHeight: number, stored: BoundTextVerticalAlign) {
  const distance = (align: BoundTextVerticalAlign) => Math.abs(y - boundTextY(shape, textHeight, align));
  const nearest = (["top", "middle", "bottom"] as const).reduce((best, align) =>
    distance(align) < distance(best) ? align : best, stored);
  return distance(stored) - distance(nearest) >= 8 ? nearest : stored;
}
