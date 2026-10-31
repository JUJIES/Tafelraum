// Synthetic native Excalidraw fixture: no lesson or archive writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CaptureUpdateAction, Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { shapedCoverGeometry } from "./canvas-cover-geometry";
import { canvasCoverStrokeWidth } from "./canvas-cover-target";
import "@excalidraw/excalidraw/index.css";

const diamond = { id: "diamond", type: "diamond" as const, groupIds: ["diamond-cover-group"], x: 110, y: 140, width: 320, height: 300,
  angle: 0.2, roundness: null, strokeWidth: 3 };
const ellipse = { id: "ellipse", type: "ellipse" as const, groupIds: ["ellipse-cover-group"], x: 530, y: 140, width: 300, height: 300,
  angle: 0, roundness: null, strokeWidth: 3 };
const left = { x: 0, y: 0, width: 0.5, height: 1 };
const right = { x: 0.5, y: 0, width: 0.5, height: 1 };
const cover = (target: typeof diamond | typeof ellipse, rect: typeof left) => {
  const { empty, ...geometry } = shapedCoverGeometry(target, rect, canvasCoverStrokeWidth(target, rect) / 2);
  return { type: "line" as const, id: `${target.id}-cover`, ...geometry, opacity: empty ? 0 : 100,
    backgroundColor: "#3e4854", fillStyle: "solid" as const, strokeColor: "transparent", strokeWidth: 0,
    roughness: 0, roundness: null, startArrowhead: null, endArrowhead: null, groupIds: target.groupIds };
};
const elements = convertToExcalidrawElements([
  { ...diamond, backgroundColor: "#529bc5", strokeColor: "#529bc5", fillStyle: "solid", roughness: 0 },
  cover(diamond, right),
  { ...ellipse, backgroundColor: "#8b4a46", strokeColor: "#b76960", fillStyle: "solid", roughness: 0 },
  cover(ellipse, left),
], { regenerateIds: false });
function Fixture() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const move = (rect: typeof left) => {
    if (!api) return;
    api.updateScene({ elements: api.getSceneElements().map(element => {
      const target = element.id === "diamond-cover" ? diamond : element.id === "ellipse-cover" ? ellipse : null;
      if (!target) return element;
      const { empty, ...geometry } = shapedCoverGeometry(target, rect, canvasCoverStrokeWidth(target, rect) / 2);
      return { ...element, ...geometry, opacity: empty ? 0 : 100,
        version: element.version + 1, versionNonce: Math.floor(Math.random() * 1e9) } as typeof element;
    }), captureUpdate: CaptureUpdateAction.NEVER });
  };
  return <div style={{ position: "fixed", inset: 0 }}>
    <div style={{ position: "absolute", zIndex: 5, top: 8, left: 60, display: "flex", gap: 8 }}>
      <button onClick={() => move(left)}>Links</button>
      <button onClick={() => move({ x: 0.25, y: 0, width: 0.5, height: 1 })}>Mitte</button>
      <button onClick={() => move(right)}>Rechts</button>
      <button onClick={() => move({ x: 0, y: 0, width: 1, height: 1 })}>Voll</button>
    </div>
    <Excalidraw excalidrawAPI={setApi} initialData={{ elements, appState: { scrollX: 0, scrollY: 0, viewBackgroundColor: "#1d242b" } }} theme="light" />
  </div>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
