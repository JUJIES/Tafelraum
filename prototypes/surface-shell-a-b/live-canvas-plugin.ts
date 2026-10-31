import distribution from "./distribution.json" with {type:"json"};
import type { Plugin } from "vite";
import { createLiveCanvasMiddleware } from "./live-canvas-provisioning.mjs";

export function liveCanvasPlugin(env: Record<string, string>): Plugin {
  if (!distribution.remoteCanvas) return {name:"tafelraum-room-only"};
  const middleware = createLiveCanvasMiddleware({configPath:new URL("../../local-data/live-canvas.json",import.meta.url),env});
  return {
    name:"tafelraum-live-canvas",
    configureServer(server) { server.middlewares.use((req,res,next) => { void middleware(req,res,next); }); },
    configurePreviewServer(server) { server.middlewares.use((req,res,next) => { void middleware(req,res,next); }); },
  };
}
