export type CanvasZoomModifierState = {
  ctrlKey: boolean;
  metaKey: boolean;
};

export function hasCanvasZoomModifier(state: CanvasZoomModifierState) {
  return state.ctrlKey || state.metaKey;
}

export type ProjectedMediaWheelIntent = "pan" | "zoom";

export function getProjectedMediaWheelIntent(
  state: CanvasZoomModifierState & { projectedMediaTarget: boolean },
): ProjectedMediaWheelIntent | null {
  if (!state.projectedMediaTarget) return null;
  return hasCanvasZoomModifier(state) ? "zoom" : "pan";
}

type RoutedCanvasWheel = {
  altKey?: boolean;
  clientX: number;
  clientY: number;
  ctrlKey?: boolean;
  deltaMode: number;
  deltaX: number;
  deltaY: number;
  metaKey?: boolean;
  shiftKey?: boolean;
};

export function dispatchPointerDownToCanvas(root: HTMLElement, event: PointerEvent) {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas.interactive");
  if (!canvas) return false;
  canvas.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, cancelable: true, composed: true,
    clientX: event.clientX, clientY: event.clientY,
    pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary,
    button: event.button, buttons: event.buttons, pressure: event.pressure,
    altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey,
  }));
  return true;
}

export function dispatchWheelToCanvas(root: HTMLElement, wheel: RoutedCanvasWheel) {
  const interactiveCanvas = root.querySelector<HTMLCanvasElement>("canvas.interactive");
  if (!interactiveCanvas) return false;
  interactiveCanvas.dispatchEvent(new PointerEvent("pointermove", {
    bubbles: true,
    cancelable: true,
    clientX: wheel.clientX,
    clientY: wheel.clientY,
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
  }));
  interactiveCanvas.dispatchEvent(new WheelEvent("wheel", {
    altKey: wheel.altKey,
    bubbles: true,
    cancelable: true,
    clientX: wheel.clientX,
    clientY: wheel.clientY,
    composed: true,
    ctrlKey: wheel.ctrlKey,
    deltaMode: wheel.deltaMode,
    deltaX: wheel.deltaX,
    deltaY: wheel.deltaY,
    metaKey: wheel.metaKey,
    shiftKey: wheel.shiftKey,
  }));
  return true;
}
