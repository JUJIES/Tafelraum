import { createRoot } from "react-dom/client";
import { LiveViewer } from "./LiveViewer";
import "@excalidraw/excalidraw/index.css";
import "./viewer-base.css";
import "./live-viewer.css";

(window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = "/";
const invite = /^\/join\/([A-Za-z0-9_-]{1,128})\/?$/.exec(location.pathname)?.[1];
if (invite) {
  const manifest = document.createElement("link");
  manifest.rel = "manifest"; manifest.href = `/api/live/manifest/${invite}`;
  document.head.append(manifest);
}
createRoot(document.getElementById("root")!).render(<LiveViewer/>);
