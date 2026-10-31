import {agentKitPlugin} from './agent-kit-plugin.mjs';
import {localExcalidrawFonts} from "./excalidraw-fonts-plugin.ts";
import {canvasAgentPlugin,teachingAgentPlugin} from './canvas-agent-server.mjs';
import {aiSettingsPlugins} from './ai-settings-extension.mjs';
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { createArchivePlugin } from "./archive-server.mjs";
import { liveCanvasPlugin } from "./live-canvas-plugin.ts";
import { mobileCapturePlugin } from "./mobile-capture-plugin.mjs";
import { documentImagePlugin } from "./document-image-server.mjs";
import { fileURLToPath } from "node:url";

const pdfJsWasmAssetNames = [
  "jbig2.wasm",
  "jbig2_nowasm_fallback.js",
  "openjpeg.wasm",
  "openjpeg_nowasm_fallback.js",
  "qcms_bg.wasm",
] as const;
const pdfJsWasmRoot = new URL("./node_modules/pdfjs-dist/wasm/", import.meta.url);
const packageVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version as string;

function pdfJsWasmAssetsPlugin() {
  const assetForRequest = (requestUrl: string | undefined) => {
    if (!requestUrl) return null;
    const pathname = new URL(requestUrl, "http://tafelraum.local").pathname;
    const prefix = "/pdfjs-wasm/";
    if (!pathname.startsWith(prefix)) return null;
    const name = decodeURIComponent(pathname.slice(prefix.length));
    return pdfJsWasmAssetNames.find((candidate) => candidate === name) ?? null;
  };
  const serveAsset = (request: { url?: string }, response: { end(body: Buffer): void; statusCode: number; setHeader(name: string, value: string): void }, next: () => void) => {
    const name = assetForRequest(request.url);
    if (!name) {
      next();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", name.endsWith(".wasm") ? "application/wasm" : "text/javascript; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.end(readFileSync(new URL(name, pdfJsWasmRoot)));
  };

  return {
    name: "tafelraum-pdfjs-wasm-assets",
    configureServer(server: { middlewares: { use(handler: typeof serveAsset): void } }) {
      server.middlewares.use(serveAsset);
    },
    generateBundle(this: { emitFile(asset: { fileName: string; source: Buffer; type: "asset" }): void }) {
      for (const name of pdfJsWasmAssetNames) {
        this.emitFile({
          type: "asset",
          fileName: `pdfjs-wasm/${name}`,
          source: readFileSync(new URL(name, pdfJsWasmRoot)),
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const archiveRootUrl = env.TAFELRAUM_ARCHIVE_ROOT_URL
    ? new URL(env.TAFELRAUM_ARCHIVE_ROOT_URL)
    : new URL("../../data/unterrichtsarchiv/", import.meta.url);
  return {
    // Surface Lab deliberately supersamples Excalidraw at a minimum of 2x while
    build: { rolldownOptions: { input: { main: new URL('./index.html',import.meta.url).pathname, room: new URL('./room.html',import.meta.url).pathname } } },
    // image/text quality is being evaluated on desktop and the Legamaster.
    define: {
      "window.devicePixelRatio": "Math.max(window.devicePixelRatio, 2)",
      __TAFELRAUM_VERSION__: JSON.stringify(packageVersion),
    },
    plugins: [
      react(),
      localExcalidrawFonts(),
      agentKitPlugin(),
      canvasAgentPlugin(),
      teachingAgentPlugin(),
      ...aiSettingsPlugins(),
      pdfJsWasmAssetsPlugin(),
      documentImagePlugin({configPath: env.TAFELRAUM_DOCUMENT_IMAGE_CONFIG_PATH || fileURLToPath(new URL('../../local-data/document-image.json',import.meta.url))}),
      createArchivePlugin({ archiveRootUrl }),
      mobileCapturePlugin({configPath: env.TAFELRAUM_CAPTURE_CONFIG_PATH || fileURLToPath(new URL('../../local-data/mobile-capture.json',import.meta.url))}),
      liveCanvasPlugin(env),
    ],
  };
});
