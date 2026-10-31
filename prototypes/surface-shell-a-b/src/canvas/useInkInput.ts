import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { CaptureUpdateAction, convertToExcalidrawElements, newElementWith, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawLinearElement, ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types";
import { attachNewAnnotationsToCanvasTargets } from "./image-annotation-groups";
import type { InteractiveHtmlScrollOffset } from "./interactive-html-embed";
import { canStraightenMarker, markerGeometry, markerOpacity, markerRole, type MarkerUnionCache } from "./marker-stroke";
import { createStrokeSampler, sampleStrokePoint, type StrokeSampler } from "./stroke-sampling";
import { penDiameter, penEngineWidth, penGeometry, penRole } from "./pen-stroke";
import type { StrokePoint } from "./stroke-sampling";

export type ExternalInkCommit = {
  id: string;
  kind: "pen" | "marker";
  color: string;
  width: number;
  points: readonly StrokePoint[];
};

type InkGesture = {
  kind: "pen" | "marker";
  color: string;
  geometryCache: MarkerUnionCache;
  element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement;
  pointerId: number;
  sampler: StrokeSampler;
  target: HTMLDivElement;
  width: number;
  straight: boolean;
};

export function useInkInput(
  api: ExcalidrawImperativeAPI | null,
  tool: "pen" | "marker" | null,
  color: string,
  strokeWidth: number,
  previewId: RefObject<string | null>,
  onLivePreviewChange?: (elementId: string | null) => void,
  interactiveHtmlScrollOffsets?: RefObject<ReadonlyMap<string, InteractiveHtmlScrollOffset>>,
  onExternalCommit?: (stroke: ExternalInkCommit) => void,
  onTransientElement?: (element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement) => void,
  resolveStartColor?: (event: ReactPointerEvent<HTMLDivElement>, color: string) => string,
) {
  const enabled = tool !== null;
  const gesture = useRef<InkGesture | null>(null);
  const animation = useRef<number | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    if (hold.current !== null) clearTimeout(hold.current);
    animation.current = null;
    hold.current = null;
  }, []);

  const render = useCallback(() => {
    animation.current = null;
    const current = gesture.current;
    if (!api || !current) return;
    const { points: sampled, tip } = current.sampler;
    const points = current.straight ? [sampled[0], tip] : sampled;
    const existing = api.getSceneElements().find((element) => element.id === current.element.id);
    // Straight preview is a separate transient view. It must not evict the
    // incrementally built freehand surface when Shift is released again.
    if (current.element.type === "freedraw") {
      current.element = newElementWith(current.element, penGeometry(points, tip));
    } else {
      const geometry = markerGeometry(points, current.width, current.straight ? undefined : current.geometryCache, tip);
      current.element = newElementWith(current.element, {
        ...geometry, points: geometry.points as ExcalidrawLinearElement["points"],
      });
    }
    api.updateScene({
      elements: existing
        ? api.getSceneElements().map((element) => element.id === current.element.id ? current.element : element)
        : [...api.getSceneElements(), current.element],
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    });
    onTransientElement?.(current.element);
  }, [api, onTransientElement]);

  const finish = useCallback((cancel = false) => {
    const current = gesture.current;
    if (!api || !current) return;
    clearTimers();
    // The last preview is the final shape: never snap or restyle on pointerup.
    if (!cancel) render();
    gesture.current = null;
    previewId.current = null;
    if (current.target.hasPointerCapture(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
    if (!cancel && onExternalCommit) {
      const points = current.straight
        ? [current.sampler.points[0], current.sampler.tip]
        : [...current.sampler.points, current.sampler.tip];
      onLivePreviewChange?.(null);
      onExternalCommit({
        id: current.element.id, kind: current.kind,
        color: current.color, width: current.width, points,
      });
      return;
    }
    const elements = !cancel ? attachNewAnnotationsToCanvasTargets(
      api.getSceneElements(),
      new Set([current.element.id]),
      interactiveHtmlScrollOffsets?.current,
    ).elements : [];
    // Excalidraw's external updateScene excludes already-present uncommitted
    // elements from IMMEDIATELY. Withdraw the transient preview and insert the
    // same native element as one committed addition, synchronously before paint.
    api.updateScene({
      elements: api.getSceneElements().filter((element) => element.id !== current.element.id),
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    });
    if (!cancel) api.updateScene({ elements, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    onLivePreviewChange?.(null);
  }, [api, clearTimers, interactiveHtmlScrollOffsets, onExternalCommit, onLivePreviewChange, previewId, render]);

  useEffect(() => {
    if (!api || !enabled) return;
    const move = (event: PointerEvent) => {
      const current = gesture.current;
      if (!current || event.pointerId !== current.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const samples = event.getCoalescedEvents?.() ?? [];
      let changed = false;
      for (const sample of samples.length ? samples : [event]) {
        const point = viewportCoordsToSceneCoords(sample, api.getAppState());
        changed = sampleStrokePoint(current.sampler, [point.x, point.y]) || changed;
      }
      if (!changed) return;
      current.straight = current.kind === "marker" && event.shiftKey;
      if (hold.current !== null) clearTimeout(hold.current);
      if (current.kind === "marker") hold.current = setTimeout(() => {
        if (gesture.current === current && canStraightenMarker([...current.sampler.points, current.sampler.tip], current.width)) {
          current.straight = true;
          render();
        }
      }, 420);
      if (animation.current === null) animation.current = requestAnimationFrame(render);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== gesture.current?.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === "pointerup" && gesture.current) {
        const point = viewportCoordsToSceneCoords(event, api.getAppState());
        sampleStrokePoint(gesture.current.sampler, [point.x, point.y]);
      }
      finish(event.type === "pointercancel");
    };
    const key = (event: KeyboardEvent) => {
      if (!gesture.current) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        finish();
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finish(true);
    };
    const blur = () => finish();
    window.addEventListener("pointermove", move, { capture: true, passive: false });
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("blur", blur);
    return () => {
      finish(Boolean(onExternalCommit));
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("blur", blur);
    };
  }, [api, enabled, tool, finish, onExternalCommit, render]);

  return useCallback((event: ReactPointerEvent<HTMLDivElement>, temporaryPan: boolean) => {
    if (enabled && gesture.current && event.target instanceof HTMLCanvasElement) {
      // A second contact must not start an unrelated native freedraw gesture.
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    if (!api || !enabled || temporaryPan || gesture.current || event.button !== 0
      || !event.isPrimary || event.ctrlKey || event.metaKey || event.altKey
      || !(event.target instanceof HTMLCanvasElement) || !event.target.classList.contains("interactive")) return false;
    event.preventDefault();
    event.stopPropagation();
    const point = viewportCoordsToSceneCoords(event, api.getAppState());
    const startColor = tool === "pen" ? resolveStartColor?.(event, color) ?? color : color;
    const width = tool === "pen" ? penDiameter(strokeWidth) : strokeWidth * 4.25;
    const sampler = createStrokeSampler([point.x, point.y], api.getAppState().zoom.value, width, tool === "pen" ? 1 : 2.5);
    const element: InkGesture["element"] = tool === "pen" ? {
      // The skeleton converter doesn't initialize freedraw base fields. Use
      // its public base constructor, then supply the native freedraw contract.
      ...convertToExcalidrawElements([{ type: "rectangle", x: point.x, y: point.y,
        width: 0, height: 0, strokeColor: startColor, strokeWidth: penEngineWidth(width),
        backgroundColor: "transparent", roughness: 0, roundness: null, opacity: 100,
        customData: { role: penRole, penGeometryVersion: 2 },
      }])[0],
      type: "freedraw", ...penGeometry(sampler.points),
    } : convertToExcalidrawElements([{
      type: "line", ...markerGeometry(sampler.points, width),
      backgroundColor: color, fillStyle: "solid", strokeColor: "transparent", strokeWidth: 0,
      roughness: 0, roundness: null, opacity: markerOpacity,
      startArrowhead: null, endArrowhead: null, customData: { role: markerRole, markerGeometryVersion: 4 },
    }])[0] as ExcalidrawLinearElement;
    gesture.current = { kind: tool!, color: startColor, element, geometryCache: new Map(), pointerId: event.pointerId, sampler, target: event.currentTarget,
      width, straight: false };
    previewId.current = element.id;
    onLivePreviewChange?.(element.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.querySelector<HTMLElement>(".excalidraw")?.focus();
    api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {}, editingGroupId: null }, captureUpdate: CaptureUpdateAction.EVENTUALLY });
    render();
    return true;
  }, [api, color, enabled, tool, onLivePreviewChange, previewId, render, strokeWidth, resolveStartColor]);
}
