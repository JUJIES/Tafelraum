export type RoomToolbarPosition = { x: number; y: number };
export type RoomToolbarSize = { width: number; height: number };

/** Keep the complete Room toolbar reachable after dragging or resizing its window. */
export function clampRoomToolbarPosition(
  position: RoomToolbarPosition,
  toolbar: RoomToolbarSize,
  viewport: RoomToolbarSize,
  margin = 8,
): RoomToolbarPosition {
  return {
    x: Math.max(margin, Math.min(position.x, Math.max(margin, viewport.width - toolbar.width - margin))),
    y: Math.max(margin, Math.min(position.y, Math.max(margin, viewport.height - toolbar.height - margin))),
  };
}
