export type ToolbarPosition = "top" | "right" | "bottom" | "left";

export type DockBounds = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

export function nearestDock(x: number, y: number, bounds: DockBounds): ToolbarPosition {
  const distances: Record<ToolbarPosition, number> = {
    top: Math.abs(y - bounds.top),
    right: Math.abs(bounds.right - x),
    bottom: Math.abs(bounds.bottom - y),
    left: Math.abs(x - bounds.left),
  };

  return (Object.entries(distances) as Array<[ToolbarPosition, number]>).reduce(
    (nearest, current) => current[1] < nearest[1] ? current : nearest,
  )[0];
}
