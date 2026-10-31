// Synthetic cover pipeline fixture. No archive, source material or app persistence.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CaptureUpdateAction, Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, DataURL } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import { LiveCanvasControls, useLiveCanvas } from "./LiveCanvasControls";
import "@excalidraw/excalidraw/index.css";

function Fixture() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const live = useLiveCanvas(api, "synthetic-cover");
  const [initialData] = useState(() => {
    const canvas = document.createElement("canvas"); canvas.width = 800; canvas.height = 500;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#e02020"; context.fillRect(0, 0, 800, 500);
    context.fillStyle = "#fff"; context.font = "48px sans-serif"; context.fillText("SYNTHETIC", 50, 140);
    return { elements: convertToExcalidrawElements([
      { type: "image", id: "material", fileId: "synthetic-image" as FileId, x: 100, y: 100, width: 400, height: 250, status: "saved" },
      { type: "rectangle", id: "unchanged", x: 600, y: 100, width: 180, height: 180, backgroundColor: "#0000ff", fillStyle: "solid", roughness: 0, strokeWidth: 0 },
      { type: "text", id: "label", x: 600, y: 320, text: "Bleibt unverändert", fontSize: 20 },
      { type: "rectangle", id: "cover-a", x: 100, y: 100, width: 200, height: 250, backgroundColor: "#3e4854", strokeColor: "#3e4854", fillStyle: "solid", roughness: 0, roundness: null,
        customData: { role: "image-cover", imageId: "material", coverEdge: "left" } },
      { type: "rectangle", id: "cover-b", x: 300, y: 100, width: 200, height: 250, backgroundColor: "#3e4854", strokeColor: "#3e4854", fillStyle: "solid", roughness: 0, roundness: null,
        customData: { role: "image-cover", imageId: "material", coverEdge: "right" } },
    ], { regenerateIds: false }), appState: { scrollX: 0, scrollY: 0 },
      files: { "synthetic-image": { id: "synthetic-image" as FileId, dataURL: canvas.toDataURL() as DataURL, mimeType: "image/png" as const, created: 1 } } };
  });
  const toggle = (id: string) => {
    if (!api) return;
    api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map(e => e.id === id
      ? { ...e, isDeleted: !e.isDeleted, version: e.version + 1, versionNonce: Math.floor(Math.random() * 1e9) } : e), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  };
  return <>
    <header style={{ display: "flex", gap: 16, padding: 12 }}>
      <LiveCanvasControls live={live}/>
      <button onClick={() => toggle("cover-a")}>Abdeckung A</button><button onClick={() => toggle("cover-b")}>Abdeckung B</button>
      <button onClick={() => { const s = api?.getAppState(); if (s) api!.updateScene({ appState: { scrollX: s.scrollX + 10 }, captureUpdate: CaptureUpdateAction.NEVER }); }}>Kamera bewegen</button>
      {live.state.session && <a href={`${live.state.session.baseUrl}/join/${live.state.session.inviteId}`} target="_blank">Teilnehmer öffnen</a>}
    </header>
    <div style={{ position: "absolute", inset: "80px 30px 30px" }}><Excalidraw excalidrawAPI={setApi} initialData={initialData}/></div>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
