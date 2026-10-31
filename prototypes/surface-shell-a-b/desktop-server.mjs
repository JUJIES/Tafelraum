import {createAgentKitMiddleware} from './agent-kit-server.mjs';
import distribution from "./distribution.json" with {type:"json"};
import {createCanvasAgentBroker,createTeachingAgentBroker} from './canvas-agent-server.mjs';
import { createLiveCanvasMiddleware } from "./live-canvas-provisioning.mjs";
import {createDesktopAiServices} from './ai-settings-extension.mjs';
import { createHmac, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createArchiveMiddleware } from "./archive-server.mjs";
import { createMobileCaptureReceiver } from "./mobile-capture-receiver.mjs";
import { createDocumentImageProcessor } from "./document-image-server.mjs";

const archiveFormat = "tafelraum-unterrichtsarchiv";
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requireOption(name) {
  const value = option(name);
  if (!value) throw new Error(`Startoption fehlt: ${name}`);
  return path.resolve(value);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function initializeEmptyArchive(archiveRoot, now = new Date()) {
  const archivePath = path.join(archiveRoot, "archive.json");
  if (await exists(archivePath)) return false;
  await mkdir(archiveRoot, { recursive: true });
  const timestamp = now.toISOString();
  const document = {
    format: archiveFormat,
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    classes: [{ id: "class-start", label: "Meine Klasse" }],
    catalog: {
      version: 1,
      subjects: [{ id: "subject-start", classId: "class-start", label: "Mein Fach" }],
      series: [{ id: "series-start", classId: "class-start", subjectId: "subject-start", label: "Meine Reihe", archiveRole: "navigation" }],
      lessons: [{
        id: "lesson-start",
        classId: "class-start",
        subjectId: "subject-start",
        seriesId: "series-start",
        title: "Erster Unterricht",
        metadata: { scheduledFor: null },
        seed: { prompt: "", showTransportImage: false },
      }],
      hiddenLessonIds: [],
      trash: [],
      subjectOrderByClassId: { "class-start": ["subject-start"] },
      seriesOrderBySubjectId: { "subject-start": ["series-start"] },
      lessonOrderBySeriesId: { "series-start": ["lesson-start"] },
    },
    pendingClassAssignment: [],
    migrationState: { source: "fresh-desktop-installation", completedAt: timestamp },
  };
  const temporaryPath = `${archivePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  await import("node:fs/promises").then(({ rename }) => rename(temporaryPath, archivePath));
  return true;
}

function json(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(`${JSON.stringify(value)}\n`);
}

function localRequestOnly(request, response) {
  const hostname = (request.headers.host ?? "").split(":")[0];
  if (["127.0.0.1", "localhost"].includes(hostname) && request.headers["sec-fetch-site"] !== "cross-site") return true;
  json(response, 403, { error: "Zugriff nicht erlaubt." });
  return false;
}

async function serveStatic(webRoot, request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    json(response, 405, { error: "Methode nicht erlaubt." });
    return;
  }
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  let requestedPath;
  try {
    requestedPath = decodeURIComponent(url.pathname);
  } catch {
    json(response, 400, { error: "Ungültiger Pfad." });
    return;
  }
  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
  let filePath = path.resolve(webRoot, relativePath);
  if (path.relative(webRoot, filePath).startsWith("..")) {
    json(response, 403, { error: "Zugriff nicht erlaubt." });
    return;
  }
  let fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    filePath = path.join(webRoot, "index.html");
    fileStat = await stat(filePath).catch(() => null);
  }
  if (!fileStat?.isFile()) {
    json(response, 404, { error: "Datei nicht gefunden." });
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
    "Content-Length": fileStat.size,
    "Cache-Control": path.basename(filePath) === "index.html" ? "no-store" : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(filePath).pipe(response);
}

export async function createDesktopServer({ archiveRoot, webRoot, port = 0, aiKeyStore, sentenceRequest = fetch, liveRequest = fetch, liveConfigPath = path.join(path.dirname(archiveRoot), "live-canvas.json"), captureConfigPath = path.join(path.dirname(archiveRoot), 'mobile-capture.json'), documentImageConfigPath = path.join(path.dirname(archiveRoot), 'document-image.json') }) {
  const resolvedWebRoot = path.resolve(webRoot);
  const agentKit = createAgentKitMiddleware({kitRoot:path.join(resolvedWebRoot,"..","agent-kit")});
  await access(path.join(resolvedWebRoot, "index.html"));
  await initializeEmptyArchive(archiveRoot);
  const {settings:aiSettings,gateway} = createDesktopAiServices({aiKeyStore,sentenceRequest});
  const archive = createArchiveMiddleware(path.resolve(archiveRoot),{directSentenceGateway:gateway});
  const canvasAgent = createCanvasAgentBroker();
  const teachingAgent = createTeachingAgentBroker();
  const live = distribution.remoteCanvas ? createLiveCanvasMiddleware({configPath:liveConfigPath,request:liveRequest}) : null;
  // Sandboxed HTML has an opaque origin. WebKit labels its relative asset
  // requests cross-site; grant only a scoped, unguessable read-only package URL.
  const materialSecret = randomBytes(32);
  let capture;
  const documentImage = createDocumentImageProcessor({ configPath: documentImageConfigPath });
  const materialToken = (lesson, material) => createHmac("sha256", materialSecret).update(`${lesson}/${material}`).digest("hex");
  const server = createServer((request, response) => {
    if(aiSettings && new URL(request.url??"/","http://local").pathname==="/api/settings/sentence-check"){void aiSettings(request,response);return;}
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname;
    if(pathname==="/api/agent-kit"){void agentKit(request,response,()=>json(response,404,{error:"Agentenpaket nicht verfügbar."}));return;}
    const capability = /^\/__material\/([a-f0-9]{64})\/([^/]+)\/([^/]+)\/(.+)$/.exec(pathname);
    if (capability) {
      const [, token, lesson, material, resource] = capability;
      const hostname = (request.headers.host ?? "").split(":")[0];
      if (request.method !== "GET" || !["127.0.0.1", "localhost"].includes(hostname)
        || token !== materialToken(lesson, material)) {
        json(response, 403, { error: "Zugriff nicht erlaubt." });
        return;
      }
      // Explicit package source for CSP: WebKit does not consistently match
      // 'self' inside an opaque sandbox. This never grants the archive API.
      request.interactiveAssetSource = `http://${request.headers.host}/__material/${token}/${lesson}/${material}/`;
      request.url = `/api/archive/lessons/${lesson}/materials/interactive/${material}/${resource}${requestUrl.search}`;
      archive(request, response, () => json(response, 404, { error: "Material nicht gefunden." }));
      return;
    }
    if (!localRequestOnly(request, response)) return;
    if (pathname.startsWith('/api/teaching-agent/')) { void teachingAgent.middleware(request,response,()=>json(response,404,{error:'Unbekannter Organisationspfad.'})); return; }
    if (pathname.startsWith('/api/canvas-agent/')) { void canvasAgent.middleware(request,response,()=>json(response,404,{error:'Unbekannter Agentpfad.'})); return; }
    if (pathname === "/api/live/config" || pathname === "/api/live/rooms") {
      if (!live) { json(response,404,{error:"Unbekannter API-Pfad."}); return; }
      void live(request,response,() => json(response,404,{error:"Unbekannter Live-Pfad."}));
      return;
    }
    if (pathname.startsWith('/api/document-image/')) {
      void documentImage.middleware(request, response, () => json(response,404,{error:'Unbekannter Bildpfad.'}));
      return;
    }
    if (pathname.startsWith('/api/mobile-capture/')) {
      void capture.middleware(request,response,() => json(response,404,{error:'Unbekannter Empfangspfad.'}));
      return;
    }
    const materialEntry = /^\/api\/archive\/lessons\/([^/]+)\/materials\/interactive\/([^/]+)\/(.+)$/.exec(pathname);
    if (materialEntry && request.method === "GET") {
      const [, lesson, material, resource] = materialEntry;
      response.writeHead(302, {
        Location: `/__material/${materialToken(lesson, material)}/${lesson}/${material}/${resource}${requestUrl.search}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      });
      response.end();
      return;
    }
    const nextAfterArchive = () => {
      if (pathname === "/api/desktop/health" && request.method === "GET") {
        json(response, 200, { ready: true, archiveFormat });
        return;
      }
      if (pathname.startsWith("/api/")) {
        json(response, 404, { error: "Unbekannter API-Pfad." });
        return;
      }
      void serveStatic(resolvedWebRoot, request, response).catch((error) => {
        if (!response.headersSent) json(response, 500, { error: error instanceof Error ? error.message : "Dateifehler." });
        else response.destroy(error instanceof Error ? error : undefined);
      });
    };
    archive(request, response, nextAfterArchive);
  });
  capture = createMobileCaptureReceiver({configPath:captureConfigPath,getArchiveUrl:() => `http://127.0.0.1:${server.address().port}`});
  server.once('close',() => void capture.close());
  server.once('close',() => documentImage.close());
  server.once('close',() => {canvasAgent.close();teachingAgent.close();});
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return server;
}

export function stopWhenParentExits(server, parentPid, intervalMs = 1_000) {
  if (!Number.isInteger(parentPid) || parentPid <= 1) throw new Error("Ungültige Elternprozess-ID.");
  const timer = setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch (error) {
      if (error?.code !== "ESRCH") return;
      clearInterval(timer);
      server.close(() => process.exit(0));
    }
  }, intervalMs);
  timer.unref();
  server.once("close", () => clearInterval(timer));
}

async function main() {
  const webRoot = requireOption("--web-root");
  const archiveRoot = requireOption("--archive-root");
  const requestedPort = Number(option("--port", "0"));
  if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) throw new Error("Ungültiger Port.");
  const parentPid = Number(option("--parent-pid", "0"));
  if (!Number.isInteger(parentPid) || parentPid <= 1) throw new Error("Ungültige Elternprozess-ID.");
  const server = await createDesktopServer({ archiveRoot, webRoot, port: requestedPort, ...(option('--capture-config') ? {captureConfigPath:path.resolve(option('--capture-config'))} : {}) });
  stopWhenParentExits(server, parentPid);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Lokaler Server konnte nicht gestartet werden.");
  process.stdout.write(`TAFELRAUM_READY ${address.port}\n`);
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  });
}
