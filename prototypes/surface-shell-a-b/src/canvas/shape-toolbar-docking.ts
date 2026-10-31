export type ShapeToolbarDock = {
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};

export const shapeToolbarHorizontalSize = { width: 550, height: 64 };
export const shapeToolbarSideSize = { width: 168, height: 290 };
const inset = 12;
const topChrome = 72;
const bottomChrome = 100;
const snapDistance = 72;

export function shapeToolbarDockAt(pointer: { x: number; y: number }, viewport: { width: number; height: number }, previous: ShapeToolbarDock | null = null): ShapeToolbarDock | null {
  const edges = [
    { side: "top" as const, distance: pointer.y },
    { side: "right" as const, distance: viewport.width - pointer.x },
    { side: "bottom" as const, distance: viewport.height - pointer.y },
    { side: "left" as const, distance: pointer.x },
  ].sort((a, b) => a.distance - b.distance);
  const previousEdge = edges.find(edge => edge.side === previous?.side);
  const nearest = previousEdge && previousEdge.distance <= snapDistance && previousEdge.distance <= edges[0].distance + 14
    ? previousEdge : edges[0];
  if (nearest.distance > snapDistance) return null;
  const isHorizontal = nearest.side === "top" || nearest.side === "bottom";
  const along = isHorizontal ? pointer.x / viewport.width : pointer.y / viewport.height;
  return { side: nearest.side, align: along < 1 / 3 ? "start" : along > 2 / 3 ? "end" : "center" };
}

export function shapeToolbarDockPosition(dock: ShapeToolbarDock, viewport: { width: number; height: number }) {
  const side = dock.side === "left" || dock.side === "right";
  const size = side ? shapeToolbarSideSize : shapeToolbarHorizontalSize;
  const minX = inset, maxX = Math.max(minX, viewport.width - size.width - inset);
  const minY = dock.side === "top" || dock.side === "bottom" ? topChrome : inset;
  const maxY = Math.max(minY, viewport.height - size.height - bottomChrome);
  const along = dock.align === "start" ? 0 : dock.align === "end" ? 1 : 0.5;
  return {
    x: side ? (dock.side === "left" ? minX : maxX) : minX + (maxX - minX) * along,
    y: side ? minY + (maxY - minY) * along : (dock.side === "top" ? minY : maxY),
  };
}

export function clampShapeToolbarPosition(position: { x: number; y: number }, viewport: { width: number; height: number }, size = shapeToolbarHorizontalSize) {
  return {
    x: Math.max(inset, Math.min(position.x, viewport.width - size.width - inset)),
    y: Math.max(inset, Math.min(position.y, viewport.height - size.height - bottomChrome)),
  };
}
