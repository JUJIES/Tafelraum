// Synthetic fixture: real import, crop, history, export and persistence paths.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CaptureUpdateAction, exportToBlob, newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { CanvasSurface } from "./CanvasSurface";
import type { CanvasPort, CanvasTheme } from "./canvas-port";
import { applyImageCropRect } from "./image-crop";
import { createPublicProjector } from "../live/public-projection";
import "@excalidraw/excalidraw/index.css";
import "../styles.css";
const noop = () => {};
function Fixture() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [port, setPort] = useState<CanvasPort | null>(null);
  const [theme, setTheme] = useState<CanvasTheme>("dark");
  const [shadows, setShadows] = useState(true);
  const [result, setResult] = useState("");
  document.documentElement.dataset.theme = theme;
  async function insert(kind: "image" | "pdf-page") {
    if (!port) return;
    const canvas = document.createElement("canvas"); canvas.width = 800; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = kind === "image" ? "#86b2ae" : "#ffffff"; ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = "#273c43"; ctx.font = "32px sans-serif"; ctx.fillText(kind === "image" ? "Eingefügtes Bild" : "PDF-Seite", 45, 80);
    await port.placeImages([{ id: crypto.randomUUID(), dataUrl: canvas.toDataURL(), mimeType: "image/png", pixelWidth:800, pixelHeight:400,
      source:{kind, fileName:kind === "image" ? "Testbild.png" : "Testblatt.pdf"} }], {clientX:500,clientY:310});
  }
  const image = () => api?.getSceneElements().find(e => e.type === "image" && e.customData?.sourceKind === "image");
  async function checkExport() {
    const e = image(); if (!api || e?.type !== "image") return;
    try {
      const blob = await exportToBlob({elements:[e],files:api.getFiles(),exportPadding:0,mimeType:"image/png",appState:{exportBackground:false}});
      const bitmap = await createImageBitmap(blob); const canvas=document.createElement("canvas"); canvas.width=bitmap.width;canvas.height=bitmap.height;
      const ctx=canvas.getContext("2d")!;ctx.drawImage(bitmap,0,0);bitmap.close();
      const corner=ctx.getImageData(0,0,1,1).data[3],center=ctx.getImageData(canvas.width/2,canvas.height/2,1,1).data[3];
      if(corner!==0 || center!==255) throw new Error(`Pixelprüfung ${corner}/${center}`);
      const projector = createPublicProjector();
      try { await projector.project(api, e.id); } finally { projector.stop(); }
      await port?.flushPersistence();
      setResult(`PNG-Ecken transparent, Bildmitte deckend; öffentliche Projektion und Speichern erfolgreich. Rundung ${JSON.stringify(e.roundness)}.`);
    } catch(error) {setResult(String(error));}
  }
  return <div className="app-shell" data-theme={theme}>
    <header style={{height:70,display:"flex",gap:10,alignItems:"center",padding:12,overflowX:"auto",whiteSpace:"nowrap"}}>
      <button onClick={()=>insert("image")}>Bild einfügen</button><button onClick={()=>insert("pdf-page")}>PDF einfügen</button>
      <button onClick={()=>setTheme(theme==="dark"?"light":"dark")}>Hell/Dunkel</button>
      <button onClick={()=>setShadows(!shadows)}>Schatten {shadows?"aus":"ein"}</button>
      <button onClick={()=>{const e=image();if(api&&e?.type==="image")api.updateScene({elements:api.getSceneElements().map(x=>x.id===e.id?newElementWith(e,applyImageCropRect(e,{x:.1,y:.1,width:.8,height:.8},{width:800,height:400})):x),captureUpdate:CaptureUpdateAction.IMMEDIATELY});}}>Zuschneiden</button>
      <button onClick={()=>{const e=image();if(api&&e)api.updateScene({elements:api.getSceneElements().map(x=>x.id===e.id?newElementWith(e,{angle:Math.PI/12}):x),captureUpdate:CaptureUpdateAction.IMMEDIATELY});}}>Drehen</button>
      <button onClick={()=>port?.fitToContent()}>Zentrieren</button>
      <button onClick={()=>port?.undo()}>Undo</button><button onClick={()=>port?.redo()}>Redo</button>
      <button onClick={checkExport}>Export prüfen</button>
    </header>
    <output style={{position:"fixed",bottom:10,left:20,zIndex:20,color:theme==="dark"?"white":"black"}}>{result}</output>
    <div style={{position:"absolute",inset:"70px 0 40px"}}><CanvasSurface activeShape="rectangle" activeTool="hand" canvasBackgroundColor={theme==="dark"?"#191919":"#f7f6f2"} lessonId="synthetic-image-appearance" lessonSeed={{prompt:"",showTransportImage:false}}
      markerColor="#ffff00" markerStrokeWidth={20} materialShadows={shadows} onMaterialUsageChange={noop} onPortReady={setPort} onLiveApiReady={setApi} onShapeColorChange={noop} onShapeFillChange={noop} onTemporaryPanChange={noop} onToolChange={noop} onZoomChange={noop}
      penColor="#000000" penStrokeWidth={2} shapeColor="#000000" shapeFill="empty" theme={theme}/></div>
  </div>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
