// Synthetic browser fixture, never imported by either application entrypoint.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { HostPointer } from "../../../../shared/live-canvas/protocol";
import { useLiveCanvas, LiveCanvasControls } from "./LiveCanvasControls";
import { useHostPointer } from "./useHostPointer";
import "@excalidraw/excalidraw/index.css";

const initialData = { elements: convertToExcalidrawElements([
  { type: "rectangle", x: 100, y: 100, width: 200, height: 120, strokeColor: "#176eaa", roughness: 0 },
  { type: "text", x: 100, y: 250, text: "Synthetischer Zeigertest", fontSize: 24 },
]), appState: { scrollX: 0, scrollY: 0 } };
function Fixture() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const live = useLiveCanvas(api, "synthetic-pointer");
  const [tool, setTool] = useState<HostPointer["tool"]>("selection");
  useHostPointer(live.host, api, live.state.state === "live" && live.state.publicationReady, tool, tool === "marker" ? "#ffee00" : "#176eaa");
  useEffect(() => { api?.setActiveTool({ type: tool === "pen" || tool === "marker" ? "freedraw" : tool === "shape" ? "rectangle" : tool }); }, [api, tool]);
  return <>
    <header style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
      <LiveCanvasControls live={live}/>
      {(["selection", "pen", "marker", "eraser", "hand", "text", "shape"] as const).map(value => <button key={value} onClick={() => setTool(value)}>{value}</button>)}
      {live.state.session && <a href={`${live.state.session.baseUrl}/join/${live.state.session.inviteId}`} target="_blank">Teilnehmer öffnen</a>}
    </header>
    <div className="canvas-engine" style={{ position: "absolute", inset: "80px 30px 30px", border: "1px solid #ddd" }}>
      <Excalidraw excalidrawAPI={setApi} initialData={initialData} UIOptions={{ canvasActions: { loadScene: false } }}/>
    </div>
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Fixture/></StrictMode>);
