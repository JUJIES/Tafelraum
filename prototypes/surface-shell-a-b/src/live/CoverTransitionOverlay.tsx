import { useLayoutEffect, useRef } from "react";
import { sceneCoordsToViewportCoords } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { CoverTransition } from "../../../../shared/live-canvas/protocol";
import { CoverSweep } from "../canvas/cover-sweep";

export type CoverEffect = CoverTransition & { key: number; holding: boolean };

/** Geometry follows the viewer camera even during a wipe. No second camera state. */
export function CoverTransitionOverlay({ api, effect }: { api: ExcalidrawImperativeAPI; effect: CoverEffect }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const position = () => {
      const state = api.getAppState();
      const center = sceneCoordsToViewportCoords({ sceneX: effect.x + effect.width / 2, sceneY: effect.y + effect.height / 2 }, state);
      Object.assign(root.current!.style, {
        width: `${effect.width * state.zoom.value}px`, height: `${effect.height * state.zoom.value}px`,
        left: `${center.x - state.offsetLeft}px`, top: `${center.y - state.offsetTop}px`,
        transform: `translate(-50%, -50%) rotate(${effect.angle}rad)`,
      });
    };
    position();
    const scroll = api.onScrollChange(position), change = api.onChange(position);
    return () => { scroll(); change(); };
  }, [api, effect]);
  return <div ref={root} className="live-cover-feedback-frame" aria-hidden="true">
    <CoverSweep direction={effect.direction} mode={effect.type} holding={effect.holding}
      geometry={effect.shape === "polygon"
        ? { type: "polygon", roundness: null, points: effect.points ?? [], strokeWidth: 0, width: effect.width, height: effect.height }
        : { type: effect.shape ?? "rectangle", roundness: effect.roundness ?? null,
            strokeWidth: effect.strokeWidth ?? 1, width: effect.width, height: effect.height }} />
  </div>;
}
