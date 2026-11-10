import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import {sentenceCheckCapability} from './sentence-check-contract.mjs';
import {playbackCapability} from './interactive-html-playback.mjs';

export const interactiveMaterialFormat = "tafelraum-interactive-html";
export const interactiveMaterialFolderName = "interaktiv";
export const interactiveMaterialManifestName = "manifest.json";
export const interactiveMaterialMaxFiles = 256;
export const interactiveMaterialMaxBytes = 64 * 1024 * 1024;
// Local media are streamed, never loaded into a Remote Canvas bundle by implication.
export const interactiveMaterialMaxMediaBytes = 512 * 1024 * 1024;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".mp3", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".oga", "audio/ogg"],
  [".opus", "audio/ogg"],
  [".webm", "video/webm"],
  [".mp4", "video/mp4"],
  [".flac", "audio/flac"],
]);

function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} fehlt.`);
  return value.trim();
}

function safeRelativePath(value, label) {
  const normalized = nonEmptyString(value, label).replaceAll("\\", "/");
  if (
    normalized.startsWith("/")
    || normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) throw new Error(`${label} ist ungültig.`);
  return normalized;
}

function viewportDimension(value, fallback, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}

function printCapability(value) {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Druckfähigkeit ist ungültig.");
  }
  const entry = safeRelativePath(value.entry, "Druck-Einstiegspunkt");
  if (path.posix.extname(entry).toLowerCase() !== ".html") {
    throw new Error("Druck-Einstiegspunkt muss eine HTML-Datei sein.");
  }
  if (value.page !== "A4" || !["portrait", "landscape"].includes(value.orientation) || value.mode !== "template") {
    throw new Error("Druckfähigkeit muss A4, Hoch- oder Querformat und den Vorlagenmodus verwenden.");
  }
  if (value.layout !== undefined && value.layout !== "shared-pages") throw new Error("Seitenlayout wird nicht unterstützt.");
  return { entry, page: "A4", orientation: value.orientation, mode: "template", ...(value.layout ? {layout:value.layout} : {}) };
}

export function parseInteractiveMaterialManifest(value, directoryName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Manifest ist ungültig.");
  if (value.format !== interactiveMaterialFormat || value.schemaVersion !== 1) {
    throw new Error("Manifestformat wird nicht unterstützt.");
  }
  const id = nonEmptyString(value.id, "Material-ID");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id) || id !== directoryName) {
    throw new Error("Material-ID muss dem Paketordner entsprechen.");
  }
  const title = nonEmptyString(value.title, "Materialtitel");
  if (title.length > 160) throw new Error("Materialtitel ist zu lang.");
  const entry = safeRelativePath(value.entry, "Einstiegspunkt");
  if (path.posix.extname(entry).toLowerCase() !== ".html") {
    throw new Error("Einstiegspunkt muss eine HTML-Datei sein.");
  }
  const viewport = value.defaultViewport && typeof value.defaultViewport === "object"
    ? value.defaultViewport
    : {};
  const print = printCapability(value.print);
  if (print?.layout === "shared-pages" && print.entry !== entry) throw new Error("Gemeinsame Seiten benötigen denselben Bildschirm- und Druck-Einstiegspunkt.");
  return {
    format: interactiveMaterialFormat,
    schemaVersion: 1,
    id,
    title,
    entry,
    live: value.live?.state === "v1" ? { state: "v1" } : null,
    print,
    playback: playbackCapability(value.playback),
    sentenceCheck: sentenceCheckCapability(value.sentenceCheck),
    defaultViewport: {
      width: viewportDimension(viewport.width, 960, 320, 3840),
      height: viewportDimension(viewport.height, 640, 240, 2160),
    },
  };
}

export function interactiveMaterialMimeType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) ?? null;
}

function checkPackageBudget(files) {
  if (files.length > interactiveMaterialMaxFiles) throw new Error("HTML-Paket enthält zu viele Dateien.");
  let contentBytes = 0, mediaBytes = 0;
  for (const file of files) {
    if (/^(audio|video)\//.test(file.mimeType)) mediaBytes += file.size;
    else contentBytes += file.size;
  }
  if (contentBytes > interactiveMaterialMaxBytes || mediaBytes > interactiveMaterialMaxMediaBytes) {
    throw new Error("HTML-Paket überschreitet das lokale Inhalts- oder Medienbudget.");
  }
}

export async function resolveInteractiveMaterialFile(packageRoot, resourcePath) {
  const relativePath = safeRelativePath(resourcePath, "Ressourcenpfad");
  if (!interactiveMaterialMimeType(relativePath)) throw new Error("Dateityp wird nicht unterstützt.");
  const resolvedRoot = path.resolve(packageRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Ressourcenpfad liegt außerhalb des Pakets.");
  const [realRoot, realFile] = await Promise.all([realpath(resolvedRoot), realpath(resolvedPath)]);
  if (!realFile.startsWith(`${realRoot}${path.sep}`)) throw new Error("Ressourcenpfad liegt außerhalb des Pakets.");
  if (!(await stat(realFile)).isFile()) throw new Error("Ressource ist keine Datei.");
  return realFile;
}

export async function listInteractiveMaterialFiles(packageRoot) {
  const resolvedRoot = path.resolve(packageRoot);
  const files = [];
  async function visit(currentRoot) {
    const entries = await readdir(currentRoot, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name.startsWith(".") || entry.isSymbolicLink()) throw new Error("Ungültige Paketdatei.");
      const entryPath = path.join(currentRoot, entry.name);
      if (entry.isDirectory()) { await visit(entryPath); continue; }
      const mimeType = interactiveMaterialMimeType(entryPath);
      if (!entry.isFile() || !mimeType) throw new Error(`Dateityp im HTML-Paket wird nicht unterstützt: ${entry.name}`);
      const metadata = await stat(entryPath);
      files.push({ path: path.relative(resolvedRoot, entryPath).split(path.sep).join("/"), mimeType, size: metadata.size });
    }
  }
  await visit(resolvedRoot);
  checkPackageBudget(files);
  return files;
}

async function packageStats(packageRoot) {
  let fileCount = 0;
  let size = 0;
  let modifiedAt = 0;
  const files = [];

  async function visit(currentRoot) {
    const entries = await readdir(currentRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) throw new Error("Versteckte Paketdateien werden nicht unterstützt.");
      if (entry.isSymbolicLink()) throw new Error("Symbolische Links sind in HTML-Paketen nicht erlaubt.");
      const entryPath = path.join(currentRoot, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile() || !interactiveMaterialMimeType(entry.name)) {
        throw new Error(`Dateityp im HTML-Paket wird nicht unterstützt: ${entry.name}`);
      }
      const metadata = await stat(entryPath);
      fileCount += 1;
      size += metadata.size;
      files.push({mimeType: interactiveMaterialMimeType(entry.name), size: metadata.size});
      modifiedAt = Math.max(modifiedAt, metadata.mtimeMs);
      checkPackageBudget(files);
    }
  }

  await visit(packageRoot);
  return { fileCount, size, modifiedAt: new Date(modifiedAt || Date.now()).toISOString() };
}

export async function validateRoomStateContract(packageRoot) {
  const files = await listInteractiveMaterialFiles(packageRoot);
  const sources = await Promise.all(files
    .filter((file) => /\.(?:html|m?js)$/i.test(file.path))
    .map(async (file) => ({ path: file.path, text: await readFile(path.join(packageRoot, file.path), "utf8") })));
  const hasScript = sources.some(({ path, text }) => {
    if (!path.endsWith(".html")) return false;
    return [...text.matchAll(/<script\b([^>]*)>/gi)].some(([, attributes]) => {
      const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
      return !type || !["application/json", "application/ld+json", "importmap"].includes(type);
    });
  });
  const source = sources.map(({ text }) => text).join("\n");
  const manifest=JSON.parse(await readFile(path.join(packageRoot,interactiveMaterialManifestName),'utf8'));
  if(manifest.playback && (!/window\.tafelraumPlayback\s*=/.test(source)||!/\bgetStatus\s*[:(]/.test(source)||!/\bexecute\s*[:(]/.test(source)))
    throw new Error('HTML-Wiedergabe benötigt window.tafelraumPlayback mit getStatus und execute.');
  if (!hasScript) return;
  if (!/window\.tafelraumLive\s*=/.test(source)
    || !/\bgetState\s*[:(]/.test(source)
    || !/\bapplyState\s*[:(]/.test(source)) {
    throw new Error("HTML-Pakete mit Skripten benötigen window.tafelraumLive mit getState und applyState für Room Canvas.");
  }
}

export async function readInteractiveMaterialPackage(packageRoot, relativePath, { requirePrint = false } = {}) {
  const manifestPath = path.join(packageRoot, interactiveMaterialManifestName);
  const manifest = parseInteractiveMaterialManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
    path.basename(packageRoot),
  );
  if (requirePrint && !manifest.print) {
    throw new Error("Arbeitsblatt benötigt eine deklarierte A4-Druckvorlage (manifest.print); --require-print ist nicht erfüllt.");
  }
  const entryPath = await resolveInteractiveMaterialFile(packageRoot, manifest.entry);
  if (path.extname(entryPath).toLowerCase() !== ".html") throw new Error("Einstiegspunkt ist keine HTML-Datei.");
  // Legacy controllerEntry is readable metadata; HTML always uses its original entry.
  if (manifest.print) await resolveInteractiveMaterialFile(packageRoot, manifest.print.entry);
  // Strict authoring/import gate; ordinary runtime reads retain legacy compatibility.
  if (requirePrint && manifest.print.layout !== "shared-pages") {
    throw new Error("Neue Arbeitsblätter benötigen gemeinsame A4-Seiten (print.layout: shared-pages). Eine reine Druckvorlage reicht für --require-print nicht aus; Altmaterial vor dem Import gezielt umstellen.");
  }
  if (manifest.print?.layout === "shared-pages" && !/\bdata-tafelraum-page(?:\s|=|>)/.test(await readFile(entryPath,"utf8"))) {
    throw new Error("Gemeinsame A4-Seiten benötigen explizite data-tafelraum-page-Seiten.");
  }
  const stats = await packageStats(packageRoot);
  return {
    ...manifest,
    path: relativePath.replaceAll(path.sep, "/"),
    ...stats,
  };
}
