import { useLayoutEffect, useRef } from "react";
import { viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { HostPointer } from "../../../../shared/live-canvas/protocol";
import type { HostPointerChannel } from "./host-pointer-channel";
import type { LiveHost } from "./live-host";

/** Only the actual canvas surface is public. In particular, neither archive,
 * tool popovers nor iframe interiors become a screen-wide mouse broadcast. */
export function useHostPointer(host: LiveHost, api: ExcalidrawImperativeAPI | null,
  enabled: boolean, tool: HostPointer["tool"], color: string, style?: HostPointer["style"], local?: HostPointerChannel) {
  const appearance = useRef({ tool, color, style });
  const active = useRef(enabled); active.current = enabled; appearance.current = { tool, color, style };
  const refresh = useRef<() => void>(() => {});
  // Observe before the ink hook consumes captured pointer events. Remember only
  // the current position locally; disabled tools never publish ordinary movement.
  useLayoutEffect(() => {
    if (!api) return;
    let last: { clientX: number; clientY: number; buttons: number } | null = null;
    let visible = false;
    const hide = () => { if(visible){host.pointer(null); local?.set(null); visible=false;} };
    const forget = () => { last=null; hide(); };
    const publish = () => {
      if (!active.current || !last || document.hidden) return hide();
      // Hit-test even under pointer capture: a drag leaving the canvas is private.
      const hit = document.elementFromPoint(last.clientX, last.clientY);
      if (!hit?.closest(".canvas-engine") || !hit.closest("canvas, .pan-cursor-guard, .laser-surface")) return hide();
      const state = api.getAppState();
      const point = viewportCoordsToSceneCoords(last, state);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || Math.abs(point.x) > 1e6 || Math.abs(point.y) > 1e6) return hide();
      const pointer = { ...point, ...appearance.current, pressed: last.buttons !== 0 };
      visible = true;
      local?.set({type:"pointer",generation:1,pointer}); host.pointer(pointer);
    };
    const move = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      last = { clientX: event.clientX, clientY: event.clientY, buttons: event.buttons };
      if(event.type === "pointerup" && event.pointerType !== "mouse") hide(); else if(active.current) publish();
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) forget(); };
    refresh.current = publish;
    const unsubscribe = api.onScrollChange(publish);
    for (const name of ["pointermove", "pointerdown", "pointerup"] as const) window.addEventListener(name, move, true);
    window.addEventListener("pointercancel", forget, true);
    window.addEventListener("pointerout", leave, true);
    window.addEventListener("blur", forget);
    document.addEventListener("visibilitychange", forget);
    return () => {
      refresh.current = () => {}; unsubscribe(); hide();
      for (const name of ["pointermove", "pointerdown", "pointerup"] as const) window.removeEventListener(name, move, true);
      window.removeEventListener("pointercancel", forget, true);
      window.removeEventListener("pointerout", leave, true);
      window.removeEventListener("blur", forget);
      document.removeEventListener("visibilitychange", forget);
    };
  }, [host, api, local]);
  useLayoutEffect(() => { refresh.current(); }, [enabled, tool, color, style]);
}
