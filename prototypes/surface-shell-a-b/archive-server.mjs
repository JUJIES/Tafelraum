import { createStudentNotesMiddleware } from './student-notes-server.mjs';
import {createVideoLabSentenceGateway,createDirectSentenceGateway,sentenceCheckBridgeScript} from './interactive-html-sentence-check.mjs';
import {importOfficeDocument,isDocxName} from "./office-import.mjs";
import { constants, createReadStream, createWriteStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import {
  copyFile,
  link,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { installInteractiveHtmlStateBridge } from "./interactive-html-state-bridge.mjs";
import {playbackSharedScript,playbackSilentScript,playbackOutputScript} from './interactive-html-playback.mjs';
import {
  interactiveMaterialFolderName,
  interactiveMaterialMimeType,
  listInteractiveMaterialFiles,
  readInteractiveMaterialPackage,
  resolveInteractiveMaterialFile,
} from "./interactive-material.mjs";

import { pruneRemovedMaterials } from "./material-removal.mjs";

const archiveFormat = "tafelraum-unterrichtsarchiv";
const maxRequestBytes = 128 * 1024 * 1024;
const maxMaterialRequestBytes = 4 * 1024 * 1024 * 1024;
const boardHistoryIntervalMs = 5 * 60 * 1000;

class ArchiveHttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function jsonResponse(response, status, value) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(`${JSON.stringify(value)}\n`);
}

function parseByteRange(rangeHeader, size) {
  if (typeof rangeHeader !== "string") return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || size <= 0 || (!match[1] && !match[2])) return { valid: false };

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { valid: false };
    return { valid: true, start: Math.max(size - suffixLength, 0), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(requestedEnd)
    || start < 0
    || requestedEnd < start
    || start >= size
  ) return { valid: false };
  return { valid: true, start, end: Math.min(requestedEnd, size - 1) };
}

async function streamMaterialFile(request, response, filePath) {
  const size = (await stat(filePath)).size;
  const range = parseByteRange(request.headers.range, size);
  response.setHeader("Accept-Ranges", "bytes");
  if (range && !range.valid) {
    response.statusCode = 416;
    response.setHeader("Content-Range", `bytes */${size}`);
    response.setHeader("Content-Length", "0");
    response.end();
    return;
  }
  response.statusCode = range ? 206 : 200;
  if (range) response.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  response.setHeader("Content-Length", String(range ? range.end - range.start + 1 : size));
  const stream = createReadStream(filePath, range ? { start: range.start, end: range.end } : undefined);
  response.once("close", () => stream.destroy());
  stream.once("error", () => response.destroy());
  stream.pipe(response);
}

function safeSegment(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error("Ungültige Archiv-ID.");
  }
  return value;
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/svg+xml") return ".svg";
  if (mimeType === "application/pdf") return ".pdf";
  return ".bin";
}

function mergeById(existing, incoming) {
  const merged = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

function mergeOrderMap(existing, incoming) {
  const result = { ...existing };
  for (const [parentId, incomingIds] of Object.entries(incoming)) {
    result[parentId] = [...new Set([...incomingIds, ...(existing[parentId] ?? [])])];
  }
  return result;
}

function mergeCatalog(existing, incoming) {
  return {
    version: 1,
    subjects: mergeById(existing.subjects, incoming.subjects),
    series: mergeById(existing.series, incoming.series),
    lessons: mergeById(existing.lessons, incoming.lessons),
    hiddenLessonIds: [...new Set(incoming.hiddenLessonIds)],
    trash: [...incoming.trash],
    subjectOrderByClassId: mergeOrderMap(existing.subjectOrderByClassId, incoming.subjectOrderByClassId),
    seriesOrderBySubjectId: mergeOrderMap(existing.seriesOrderBySubjectId, incoming.seriesOrderBySubjectId),
    lessonOrderBySeriesId: mergeOrderMap(existing.lessonOrderBySeriesId, incoming.lessonOrderBySeriesId),
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readBoard(filePath) {
  const contents = await readFile(filePath);
  return {
    snapshot: JSON.parse(contents.toString("utf8")),
    revision: `"sha256-${createHash("sha256").update(contents).digest("hex")}"`,
  };
}

function requireCurrentBoardRevision(request, currentRevision) {
  const ifMatch = request.headers["if-match"];
  if (typeof ifMatch !== "string") {
    throw new ArchiveHttpError(
      428,
      "board_revision_required",
      "Canvasstand wurde nicht gespeichert: Die geladene Basisrevision fehlt.",
    );
  }
  if (ifMatch !== currentRevision) {
    throw new ArchiveHttpError(
      409,
      "board_revision_conflict",
      "Canvasstand wurde nicht gespeichert: Im Archiv liegt bereits ein neuerer Stand.",
    );
  }
}

function requireNewBoardRevision(request) {
  if (request.headers["if-none-match"] === "*") return;
  if (typeof request.headers["if-match"] === "string") {
    throw new ArchiveHttpError(
      409,
      "board_revision_conflict",
      "Canvasstand wurde nicht gespeichert: Der zuvor geladene Archivstand existiert nicht mehr.",
    );
  }
  throw new ArchiveHttpError(
    428,
    "board_revision_required",
    "Canvasstand wurde nicht gespeichert: Die Information für einen neuen Archivstand fehlt.",
  );
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function preserveCurrent(filePath, historyRoot, prefix, minimumIntervalMs = 0) {
  if (!(await exists(filePath))) return;
  await mkdir(historyRoot, { recursive: true });
  if (minimumIntervalMs > 0) {
    const entries = await readdir(historyRoot, { withFileTypes: true });
    const newest = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(prefix))
      .map(async (entry) => stat(path.join(historyRoot, entry.name))));
    if (newest.some((entry) => Date.now() - entry.mtimeMs < minimumIntervalMs)) return;
  }
  await copyFile(filePath, path.join(historyRoot, `${prefix}-${timestamp()}-${randomUUID()}.json`), constants.COPYFILE_EXCL);
}

async function writeAtomicJson(filePath, value, options = {}) {
  const nextContents = `${JSON.stringify(value, null, 2)}\n`;
  if (await exists(filePath)) {
    const currentContents = await readFile(filePath, "utf8");
    if (currentContents === nextContents) return false;
    if (options.historyRoot) {
      await preserveCurrent(
        filePath,
        options.historyRoot,
        options.historyPrefix ?? path.basename(filePath, ".json"),
        options.minimumHistoryIntervalMs ?? 0,
      );
    }
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporaryPath, nextContents, { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, filePath);
  return true;
}

async function readRequestJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxRequestBytes) throw new Error("Archivdatensatz ist zu groß.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function lessonRoot(archiveRoot, catalog, lessonId) {
  const safeLessonId = safeSegment(lessonId);
  const lesson = catalog.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) return path.join(archiveRoot, "_unassigned", "stunden", safeLessonId);
  return path.join(
    archiveRoot,
    "faecher",
    safeSegment(lesson.subjectId),
    "reihen",
    safeSegment(lesson.seriesId),
    "stunden",
    safeLessonId,
  );
}

function lessonMaterialArchivePath(lesson) {
  return path.posix.join(
    "faecher",
    safeSegment(lesson.subjectId),
    "reihen",
    safeSegment(lesson.seriesId),
    "stunden",
    safeSegment(lesson.id),
    "material",
  );
}

function ownLessonMaterialBasis(lesson) {
  return {
    archiveSeriesId: lesson.seriesId,
    archivePath: lessonMaterialArchivePath(lesson),
    scope: "lesson",
  };
}

function ensureLessonMaterialBases(catalog, currentCatalog = null) {
  const currentLessons = new Map((currentCatalog?.lessons ?? []).map((lesson) => [lesson.id, lesson]));
  return {
    ...catalog,
    lessons: catalog.lessons.map((lesson) => {
      const currentBasis = currentLessons.get(lesson.id)?.materialBasis;
      if (currentBasis?.scope === "lesson") return { ...lesson, materialBasis: currentBasis };
      const basis = lesson.materialBasis;
      const isExplicitLegacySeriesBasis = basis?.scope === "series"
        || Boolean(basis?.sourceMirrorPath && !basis.archivePath.includes(`/stunden/${lesson.id}/material`));
      return isExplicitLegacySeriesBasis ? lesson : { ...lesson, materialBasis: ownLessonMaterialBasis(lesson) };
    }),
  };
}

const materialMimeTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".pdf", "application/pdf"],
  [".mp3", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".oga", "audio/ogg"],
  [".opus", "audio/ogg"],
  [".webm", "audio/webm"],
  [".flac", "audio/flac"],
  [".mp4", "video/mp4"],
]);

function materialMimeType(filePath) {
  return materialMimeTypes.get(path.extname(filePath).toLocaleLowerCase("en-US")) ?? null;
}

function materialKind(mimeType) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

function resolveArchiveRelativePath(archiveRoot, relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim() || path.isAbsolute(relativePath)) {
    throw new Error("Ungültiger Materialpfad.");
  }
  const normalizedArchiveRoot = path.resolve(archiveRoot);
  const resolvedPath = path.resolve(normalizedArchiveRoot, relativePath);
  if (resolvedPath !== normalizedArchiveRoot && !resolvedPath.startsWith(`${normalizedArchiveRoot}${path.sep}`)) {
    throw new Error("Materialpfad liegt außerhalb des Unterrichtsarchivs.");
  }
  return resolvedPath;
}

function lessonMaterialBasis(archiveRoot, catalog, lessonId) {
  const lesson = catalog.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) return null;
  const series = catalog.series.find((candidate) => candidate.id === lesson.seriesId);
  const materialBasis = lesson.materialBasis ?? ownLessonMaterialBasis(lesson);
  const archivePath = materialBasis.archivePath;
  const scope = materialBasis.scope
    ?? (archivePath === lessonMaterialArchivePath(lesson) ? "lesson" : "series");
  return {
    archiveSeriesId: materialBasis.archiveSeriesId ?? lesson.seriesId,
    archivePath,
    label: scope === "lesson" ? lesson.title : series?.label ?? "Material",
    scope,
    root: resolveArchiveRelativePath(archiveRoot, archivePath),
  };
}

const materialNamesFileName = ".material-names.json";

const materialOrderFileName = ".material-order.json";
const validMaterialPaths = paths => Array.isArray(paths) && paths.length <= 10000
  && paths.every(item => typeof item === "string" && item.length > 0 && item.length <= 4096)
  && new Set(paths).size === paths.length;
async function readMaterialOrder(materialRoot) {
  const file = path.join(materialRoot, materialOrderFileName);
  if (!(await exists(file))) return [];
  const document = await readJson(file);
  if (document.schemaVersion !== 1 || !validMaterialPaths(document.paths)) {
    throw new Error("Materialreihenfolge im Archiv ist ungültig.");
  }
  return document.paths;
}

function validMaterialDisplayName(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 160
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

async function readMaterialNames(materialRoot) {
  const file = path.join(materialRoot, materialNamesFileName);
  if (!(await exists(file))) return { schemaVersion: 1, names: {} };
  const document = await readJson(file);
  if (document.schemaVersion !== 1 || !document.names || typeof document.names !== "object"
      || Array.isArray(document.names) || Object.values(document.names).some(value => !validMaterialDisplayName(value))) {
    throw new Error("Materialnamen im Archiv sind ungültig.");
  }
  return document;
}

async function listLessonMaterials(materialRoot) {
  if (!(await exists(materialRoot))) return [];
  const materials = [];

  async function visit(currentRoot, relativeRoot = "") {
    const entries = await readdir(currentRoot, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "de-DE", { numeric: true }));
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "_history" || entry.name === "stunden") continue;
      const relativePath = relativeRoot ? path.join(relativeRoot, entry.name) : entry.name;
      const absolutePath = path.join(currentRoot, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        const portablePath = relativePath.split(path.sep).join("/");
        const packageSegments = portablePath.split("/");
        if (packageSegments.length === 2 && packageSegments[0] === interactiveMaterialFolderName) {
          try {
            const interactive = await readInteractiveMaterialPackage(absolutePath, portablePath);
            materials.push({
              path: interactive.path,
              name: interactive.title,
              folder: interactiveMaterialFolderName,
              kind: "interactive",
              mimeType: "text/html",
              size: interactive.size,
              modifiedAt: interactive.modifiedAt,
              id: interactive.id,
              entry: interactive.entry,
              print: interactive.print,
              defaultViewport: interactive.defaultViewport,
            });
          } catch {
            // Ungültige Pakete sind kein teilweise verwendbares Material und werden nicht einzeln aufgelistet.
          }
          continue;
        }
        await visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const mimeType = materialMimeType(entry.name);
      if (!mimeType) continue;
      const metadata = await stat(absolutePath);
      const portablePath = relativePath.split(path.sep).join("/");
      const folder = path.posix.dirname(portablePath);
      materials.push({
        path: portablePath,
        name: entry.name,
        folder: folder === "." ? null : folder,
        kind: materialKind(mimeType),
        mimeType,
        size: metadata.size,
        modifiedAt: metadata.mtime.toISOString(),
      });
    }
  }

  await visit(materialRoot);
  const { names } = await readMaterialNames(materialRoot);
  const order = new Map((await readMaterialOrder(materialRoot)).map((item, index) => [item, index]));
  return [...materials, ...await listLessonMaterialLinks(materialRoot)].map(material => ({
    ...material,
    ...(Object.hasOwn(names, material.path) ? { displayName: names[material.path] } : {}),
  })).sort((left, right) => (order.get(left.path) ?? Infinity) - (order.get(right.path) ?? Infinity));
}

// Canonical removal records also prevent stale board/outbox saves resurrecting sources.
async function readMaterialRemovals(archiveRoot) {
  const file = path.join(archiveRoot, ".material-removals.json");
  if (!(await exists(file))) return [];
  const document = await readJson(file);
  if (document.schemaVersion !== 1 || !Array.isArray(document.removals)
      || document.removals.some(record => typeof record.archiveMaterialPath !== "string"
        || typeof record.lessonId !== "string" || typeof record.fileName !== "string"
        || record.lessonIds !== undefined && (!Array.isArray(record.lessonIds) || record.lessonIds.some(id => typeof id !== "string"))
        || record.elementIdsByLesson !== undefined && (!record.elementIdsByLesson || typeof record.elementIdsByLesson !== "object"
          || Object.values(record.elementIdsByLesson).some(ids => !Array.isArray(ids) || ids.some(id => typeof id !== "string"))))) {
    throw new Error("Material-Entfernungen im Archiv sind ungültig.");
  }
  return document.removals;
}
async function writeMaterialRemovals(archiveRoot, removals) {
  await writeAtomicJson(path.join(archiveRoot, ".material-removals.json"), {schemaVersion: 1, removals}, {
    historyRoot: path.join(archiveRoot, "_history", "material-removals"),
  });
}
async function reactivateMaterial(archiveRoot, archiveMaterialPath) {
  const removals = await readMaterialRemovals(archiveRoot);
  if (removals.some(record => record.archiveMaterialPath === archiveMaterialPath))
    await writeMaterialRemovals(archiveRoot, removals.filter(record => record.archiveMaterialPath !== archiveMaterialPath));
}

// A fresh file/package at a removed path is an explicit additive reimport.
async function reactivateRestoredSources(archiveRoot) {
  const removals = await readMaterialRemovals(archiveRoot);
  const retained = [];
  for (const record of removals) {
    if (record.archiveMaterialPath.includes("/@links/")
      || !(await exists(resolveArchiveRelativePath(archiveRoot, record.archiveMaterialPath)))) retained.push(record);
  }
  if (retained.length !== removals.length) await writeMaterialRemovals(archiveRoot, retained);
  return retained;
}

const interactiveMaterialCsp = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  "font-src 'self' data:",
  "form-action 'none'",
  "frame-ancestors 'self'",
  "frame-src 'none'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
].join("; ");

const interactiveMaterialBridge = `<script>(()=>{
  if(window.__tafelraumBridge)return;
  window.__tafelraumBridge=true;
  const interactiveSelector=[
    "a[href]","button","input","label","select","summary","textarea",
    "[contenteditable='true']","[draggable='true']","[data-tafelraum-interactive]",
    "[role='button']","[role='checkbox']","[role='combobox']","[role='link']",
    "[role='listbox']","[role='option']","[role='radio']","[role='slider']",
    "[role='spinbutton']","[role='switch']","[role='tab']"
  ].join(",");
  let backgroundPanEnabled=false;
  let materialMoveEnabled=false;
  let movingMaterial=false;
  let roomInputEnabled=false;
  let roomTouch=null;
  let roomDrag=null;
  let panPointerId=null;
  let panTarget=null;
  let lastPoint={clientX:0,clientY:0,screenX:0,screenY:0};
  let lastRootScroll={x:-1,y:-1};
  const roomInnerScroll=new Map();
  const roomScrollPath=node=>{
    const path=[];let current=node;
    while(current&&current!==document.documentElement&&path.length<24){
      const parent=current.parentElement;if(!parent)return null;
      path.push(Array.prototype.indexOf.call(parent.children,current));current=parent;
    }
    return current===document.documentElement?path.reverse():null;
  };
  const contentOwnsPointer=target=>target instanceof Element&&Boolean(target.closest(interactiveSelector));
  const canScrollToward=(target,deltaX,deltaY)=>{
    const vertical=Math.abs(deltaY)>=Math.abs(deltaX);
    const delta=vertical?deltaY:deltaX;
    if(delta===0)return false;
    const root=document.scrollingElement;
    for(let node=target instanceof Element?target:null;node;node=node.parentElement){
      const style=getComputedStyle(node);
      const overflow=vertical?style.overflowY:style.overflowX;
      const viewport=vertical?node.clientHeight:node.clientWidth;
      const extent=vertical?node.scrollHeight:node.scrollWidth;
      const position=vertical?node.scrollTop:node.scrollLeft;
      const scrollable=(node===root||/^(auto|scroll|overlay)$/.test(overflow))&&extent>viewport+1;
      if(scrollable&&(delta<0?position>0.5:position<extent-viewport-0.5))return true;
    }
    return false;
  };
  const roomPan=(x,y,deltaX,deltaY)=>{
    const target=document.elementFromPoint(x,y);
    const root=document.scrollingElement;
    let changed=false;
    for(const axis of ["x","y"]){
      let remainder=axis==="x"?deltaX:deltaY;
      for(let node=target instanceof Element?target:null;node&&Math.abs(remainder)>.1;node=node.parentElement){
        const style=getComputedStyle(node);
        const overflow=axis==="x"?style.overflowX:style.overflowY;
        if(node!==root&&!/^(auto|scroll|overlay)$/.test(overflow))continue;
        const extent=axis==="x"?node.scrollWidth:node.scrollHeight;
        const viewport=axis==="x"?node.clientWidth:node.clientHeight;
        if(extent<=viewport+1)continue;
        const before=axis==="x"?node.scrollLeft:node.scrollTop;
        const after=Math.max(0,Math.min(extent-viewport,before+remainder));
        if(axis==="x")node.scrollLeft=after;else node.scrollTop=after;
        if(after!==before){
          changed=true;
          if(node!==root&&roomInnerScroll.size<64){
            const path=roomScrollPath(node);
            if(path)roomInnerScroll.set(path.join("."),{path,x:node.scrollLeft,y:node.scrollTop});
          }
        }
        remainder-=after-before;
      }
    }
    postRootScroll();
    if(changed){
      window.parent.postMessage({type:"tafelraum:interactive-room-user-scroll"},"*");
      window.parent.postMessage({type:"tafelraum:interactive-room-scroll-state",entries:[...roomInnerScroll.values()]},"*");
    }
  };
  const postRootScroll=()=>{
    const root=document.scrollingElement;
    const x=Math.max(0,root?.scrollLeft||0),y=Math.max(0,root?.scrollTop||0);
    if(x===lastRootScroll.x&&y===lastRootScroll.y)return;
    lastRootScroll={x,y};
    window.parent.postMessage({type:"tafelraum:interactive-scroll",scrollX:x,scrollY:y},"*");
  };
  const pointerPoint=event=>({clientX:event.clientX,clientY:event.clientY,screenX:event.screenX,screenY:event.screenY});
  const textOwnsPoint=event=>{
    // Hit the rendered character, not the bounding box of an entire paragraph.
    const caret=document.caretPositionFromPoint?.(event.clientX,event.clientY);
    const range=caret?document.createRange():document.caretRangeFromPoint?.(event.clientX,event.clientY);
    if(caret)range.setStart(caret.offsetNode,caret.offset);
    if(!range||range.startContainer.nodeType!==Node.TEXT_NODE)return false;
    const node=range.startContainer,offset=range.startOffset;
    if(getComputedStyle(node.parentElement).userSelect==="none")return false;
    for(const index of [offset-1,offset]){
      if(index<0||index>=node.textContent.length||/[\\r\\n\\t]/.test(node.textContent[index]))continue;
      const character=document.createRange();character.setStart(node,index);character.setEnd(node,index+1);
      for(const rect of character.getClientRects()){
        if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)return true;
      }
    }
    return false;
  };
  const scrollbarOwnsPoint=event=>{
    for(let node=event.target instanceof Element?event.target:null;node;node=node.parentElement){
      const rect=node.getBoundingClientRect();
      if(node===document.documentElement){
        if(event.clientX>=node.clientWidth||event.clientY>=node.clientHeight)return true;
      }else if((node.scrollHeight>node.clientHeight&&event.clientX>=rect.left+node.clientLeft+node.clientWidth)
        ||(node.scrollWidth>node.clientWidth&&event.clientY>=rect.top+node.clientTop+node.clientHeight))return true;
    }
    return false;
  };
  const materialContentOwnsPointer=event=>contentOwnsPointer(event.target)||textOwnsPoint(event)||scrollbarOwnsPoint(event)
    ||event.target instanceof Element&&Boolean(event.target.closest("canvas,video,audio,[role='textbox'],[contenteditable]:not([contenteditable='false'])"))
    ||event.target instanceof Element&&getComputedStyle(event.target).cursor==="pointer";
  const postPan=(phase,point=lastPoint)=>window.parent.postMessage({
    type:movingMaterial?"tafelraum:interactive-material-move":"tafelraum:interactive-pan",phase,pointerId:panPointerId,
    clientX:point.clientX,clientY:point.clientY,...(movingMaterial?{screenX:point.screenX,screenY:point.screenY}:{})
  },"*");
  const finishPan=(phase,event)=>{
    if(panPointerId===null||event&&event.pointerId!==panPointerId)return;
    if(event){lastPoint=pointerPoint(event);event.preventDefault();event.stopImmediatePropagation()}
    postPan(phase);
    const id=panPointerId,target=panTarget;panPointerId=null;panTarget=null;
    if(target?.hasPointerCapture?.(id))target.releasePointerCapture(id);
  };
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    if(event.data?.type==="tafelraum:interactive-room-input"){
      roomInputEnabled=true;backgroundPanEnabled=false;materialMoveEnabled=false;finishPan("cancel");
      document.documentElement.dataset.tafelraumRoomInput="true";
      return;
    }
    if(event.data?.type==="tafelraum:interactive-room-scroll"){
      const x=event.data.scrollX,y=event.data.scrollY;
      if([x,y].every(value=>typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=1000000)){
        const root=document.scrollingElement;if(root){root.scrollLeft=x;root.scrollTop=y;}
      }
      return;
    }
    if(event.data?.type==="tafelraum:interactive-room-pan"){
      const {clientX,clientY,deltaX,deltaY}=event.data;
      if([clientX,clientY,deltaX,deltaY].every(value=>typeof value==="number"&&Number.isFinite(value)&&Math.abs(value)<=100000)){
        roomPan(clientX,clientY,deltaX,deltaY);
      }
      return;
    }
    if(event.data?.type==="tafelraum:interactive-room-restore"&&Array.isArray(event.data.entries)){
      for(const entry of event.data.entries.slice(0,64)){
        if(!Array.isArray(entry.path)||entry.path.length>24||!entry.path.every(index=>Number.isInteger(index)&&index>=0&&index<1000))continue;
        if(![entry.x,entry.y].every(value=>typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=1000000))continue;
        let node=document.documentElement;
        for(const index of entry.path){node=node.children[index];if(!node)break;}
        if(node){node.scrollLeft=entry.x;node.scrollTop=entry.y;roomInnerScroll.set(entry.path.join("."),entry);}
      }
      return;
    }
    if(event.data?.type==="tafelraum:interactive-material-move-mode"){
      const enabled=event.data.enabled===true;
      if(materialMoveEnabled&&!enabled&&movingMaterial)finishPan("cancel");
      materialMoveEnabled=enabled;
      return;
    }
    if(event.data?.type!=="tafelraum:interactive-pan-mode")return;
    backgroundPanEnabled=event.data.enabled===true;
    if(!backgroundPanEnabled&&!materialMoveEnabled)finishPan("cancel");
  });
  window.addEventListener("pointerdown",event=>{
    if((!backgroundPanEnabled&&!materialMoveEnabled)||panPointerId!==null||!event.isPrimary||event.button!==0)return;
    movingMaterial=materialMoveEnabled&&!backgroundPanEnabled;
    if(movingMaterial?materialContentOwnsPointer(event):contentOwnsPointer(event.target))return;
    panPointerId=event.pointerId;
    panTarget=event.target instanceof Element?event.target:document.documentElement;
    lastPoint=pointerPoint(event);
    // A material gesture moves this iframe itself. Its host takes over pointer
    // routing; iframe capture would become stale as the browsing context moves.
    if(!movingMaterial)panTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopImmediatePropagation();
    postPan("start");
  },{capture:true});
  // Cancelling pointerdown alone does not prevent native touch scrolling.
  // Cancel only a neutral canvas/material gesture; controls and text keep their
  // native touch handling, without a blanket touch-action rule on the iframe.
  window.addEventListener("touchstart",event=>{
    if((!backgroundPanEnabled&&!materialMoveEnabled)||event.touches.length!==1)return;
    const touch=event.touches[0];
    const point={target:event.target,clientX:touch.clientX,clientY:touch.clientY};
    if(materialMoveEnabled&&!backgroundPanEnabled?materialContentOwnsPointer(point):contentOwnsPointer(event.target))return;
    event.preventDefault();
  },{capture:true,passive:false});
  window.addEventListener("pointermove",event=>{
    if(event.pointerId!==panPointerId)return;
    lastPoint=pointerPoint(event);
    event.preventDefault();
    event.stopImmediatePropagation();
    postPan("move");
  },{capture:true});
  window.addEventListener("pointerup",event=>finishPan("end",event),{capture:true});
  window.addEventListener("pointercancel",event=>finishPan("cancel",event),{capture:true});
  window.addEventListener("lostpointercapture",event=>finishPan("cancel",event),{capture:true});
  window.addEventListener("blur",()=>finishPan("cancel"));
  window.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&movingMaterial&&panPointerId!==null){finishPan("cancel");event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true});
  window.addEventListener("pointerdown",event=>{
    if(!roomInputEnabled||event.pointerType==="touch"||!event.isPrimary||event.button!==0||contentOwnsPointer(event.target))return;
    roomDrag={id:event.pointerId,x:event.clientX,y:event.clientY};
    event.target?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  },{capture:true});
  window.addEventListener("pointermove",event=>{
    if(!roomDrag||event.pointerId!==roomDrag.id)return;
    const deltaX=roomDrag.x-event.clientX,deltaY=roomDrag.y-event.clientY;
    roomDrag={id:event.pointerId,x:event.clientX,y:event.clientY};
    event.preventDefault();roomPan(event.clientX,event.clientY,deltaX,deltaY);
  },{capture:true});
  window.addEventListener("pointerup",event=>{if(roomDrag?.id===event.pointerId)roomDrag=null;},{capture:true});
  window.addEventListener("pointercancel",event=>{if(roomDrag?.id===event.pointerId)roomDrag=null;},{capture:true});
  window.addEventListener("touchstart",event=>{
    if(!roomInputEnabled||event.touches.length!==1||contentOwnsPointer(event.target))return;
    const touch=event.touches[0];roomTouch={id:touch.identifier,x:touch.clientX,y:touch.clientY};
  },{capture:true,passive:true});
  window.addEventListener("touchmove",event=>{
    if(!roomInputEnabled||!roomTouch||event.touches.length!==1)return;
    const touch=event.touches[0];if(touch.identifier!==roomTouch.id)return;
    const deltaX=roomTouch.x-touch.clientX,deltaY=roomTouch.y-touch.clientY;
    roomTouch={id:touch.identifier,x:touch.clientX,y:touch.clientY};
    event.preventDefault();roomPan(touch.clientX,touch.clientY,deltaX,deltaY);
  },{capture:true,passive:false});
  window.addEventListener("touchend",()=>{roomTouch=null;},{capture:true});
  window.addEventListener("touchcancel",()=>{roomTouch=null;},{capture:true});
  window.addEventListener("scroll",postRootScroll,{capture:true,passive:true});
  window.addEventListener("wheel",event=>{
    if(roomInputEnabled&&!event.ctrlKey&&!event.metaKey){
      event.preventDefault();
      const factor=event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1;
      roomPan(event.clientX,event.clientY,event.deltaX*factor,event.deltaY*factor);
      return;
    }
    if(event.ctrlKey||event.metaKey){
      event.preventDefault();
      window.parent.postMessage({type:"tafelraum:interactive-zoom",clientX:event.clientX,clientY:event.clientY,deltaMode:event.deltaMode,deltaX:event.deltaX,deltaY:event.deltaY},"*");
      return;
    }
    if(canScrollToward(event.target,event.deltaX,event.deltaY))return;
    event.preventDefault();
    window.parent.postMessage({type:"tafelraum:interactive-wheel-pan",clientX:event.clientX,clientY:event.clientY,deltaMode:event.deltaMode,deltaX:event.deltaX,deltaY:event.deltaY,shiftKey:event.shiftKey},"*");
  },{capture:true,passive:false});
  postRootScroll();
})()</script>`;

// Use browser scrollbars: WebKit chrome stays inside the clipped iframe;
// standardized colors/width provide the fallback without a second scroll engine.
const interactiveMaterialScrollbarStyle = `<style data-tafelraum-scrollbars>@media screen {
  @layer tafelraum-material-base { :root { color-scheme: light; } }
  @supports not selector(::-webkit-scrollbar) {
    :root, * { scrollbar-color: #92999f Canvas; scrollbar-width: thin; }
  }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: Canvas; }
  ::-webkit-scrollbar-thumb { background: #92999f; border: 2px solid transparent; background-clip: padding-box; border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background-color: #737d85; }
}</style>`;

function injectInteractiveMaterialBridge(html, playbackOutput = false, playbackLocal = false, sentenceCheck = false) {
  // Apply scrollbar chrome before the first paint; package colors remain its own.
  // Packages may omit an explicit head; insert before body content in that case.
  const insertionPoint = html.search(/<\/head\s*>|<body\b/i);
  const doctypeEnd = html.match(/^\s*<!doctype[^>]*>/i)?.[0].length ?? 0;
  const styleOffset = insertionPoint >= 0 ? insertionPoint : doctypeEnd;
  html = `${html.slice(0, styleOffset)}${interactiveMaterialScrollbarStyle}${html.slice(styleOffset)}`;
  const bridge = interactiveMaterialBridge
    + `<script>(${installInteractiveHtmlStateBridge.toString()})()</script>`
    + (playbackOutput || playbackLocal ? playbackOutputScript(playbackLocal) : '')
    + (sentenceCheck ? sentenceCheckBridgeScript() : '');
  const bodyEnd = html.toLowerCase().lastIndexOf("</body>");
  return bodyEnd >= 0
    ? `${html.slice(0, bodyEnd)}${bridge}${html.slice(bodyEnd)}`
    : `${html}${bridge}`;
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function interactiveMaterialErrorResponse(response, status, detail = "Das interaktive Material wurde im Unterrichtsarchiv nicht gefunden.") {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Material nicht verfügbar</title><style>html{color-scheme:light dark}body{box-sizing:border-box;display:grid;min-height:100vh;margin:0;padding:32px;place-items:center;background:#f4f3ef;color:#1b222b;font:16px/1.45 system-ui,sans-serif;text-align:center}main{max-width:520px}h1{margin:0 0 8px;font-size:24px}p{margin:0;color:#65717b}</style></head><body><main><h1>Material nicht verfügbar</h1><p>${escapeHtml(detail)}</p></main></body></html>`;
  response.statusCode = status;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", interactiveMaterialCsp);
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(html);
}

function setInteractiveMaterialHeaders(response, mimeType, assetSource) {
  response.setHeader("Content-Type", mimeType);
  response.setHeader("Cache-Control", "no-store");
  const csp = assetSource
    ? interactiveMaterialCsp.replace(/(font|img|media|script|style)-src 'self'/g, `$1-src 'self' ${assetSource}`)
    : interactiveMaterialCsp;
  response.setHeader("Content-Security-Policy", csp);
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), display-capture=(), fullscreen=()");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

const lessonMaterialLinksFileName = "links.json";
const youtubeVideoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

function youtubeLink(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("YouTube-Link fehlt.");
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("Bitte einen vollständigen YouTube-Link einfügen.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Bitte einen gültigen YouTube-Link einfügen.");
  }

  const host = parsed.hostname.toLocaleLowerCase("en-US").replace(/^www\./, "");
  let videoId = null;
  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
    else {
      const [kind, id] = parsed.pathname.split("/").filter(Boolean);
      if (kind === "embed" || kind === "shorts" || kind === "live") videoId = id ?? null;
    }
  } else if (host === "youtube-nocookie.com") {
    const [kind, id] = parsed.pathname.split("/").filter(Boolean);
    if (kind === "embed") videoId = id ?? null;
  }

  if (!videoId || !youtubeVideoIdPattern.test(videoId)) {
    throw new Error("Der Link enthält keine unterstützte YouTube-Video-ID.");
  }
  return {
    provider: "youtube",
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
  };
}

function normalizedMaterialLink(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Link fehlt.");
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("Bitte einen vollständigen Link einfügen.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Nur http- und https-Links werden unterstützt.");
  }

  const host = parsed.hostname.toLocaleLowerCase("en-US").replace(/^www\./, "");
  if (["youtu.be", "youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    return youtubeLink(parsed.toString());
  }
  return {
    provider: "web",
    url: parsed.toString(),
  };
}

function webLinkTitle(value) {
  const parsed = new URL(value);
  const host = parsed.hostname.replace(/^www\./i, "");
  const rawLeaf = parsed.pathname.split("/").filter(Boolean).at(-1) ?? "";
  let leaf = rawLeaf;
  try {
    leaf = decodeURIComponent(rawLeaf);
  } catch {
    // Keep the encoded path segment when it cannot be decoded safely.
  }
  return leaf ? `${host} · ${leaf.slice(0, 64)}` : host;
}

async function readLessonMaterialLinkDocument(materialRoot) {
  const filePath = path.join(materialRoot, lessonMaterialLinksFileName);
  if (!(await exists(filePath))) return { schemaVersion: 1, links: [] };
  const document = await readJson(filePath);
  if (document?.schemaVersion !== 1 || !Array.isArray(document.links)) {
    throw new Error("Unbekanntes Materiallink-Format.");
  }
  return document;
}

function lessonMaterialLinkEntry(link) {
  return {
    path: `@links/${link.id}`,
    name: link.title,
    folder: null,
    kind: "link",
    mimeType: "text/uri-list",
    size: Buffer.byteLength(link.url, "utf8"),
    modifiedAt: link.updatedAt,
    provider: link.provider,
    url: link.url,
    ...(link.provider === "youtube" ? { videoId: link.videoId } : {}),
  };
}

async function listLessonMaterialLinks(materialRoot) {
  const document = await readLessonMaterialLinkDocument(materialRoot);
  return document.links.map(lessonMaterialLinkEntry);
}

async function saveLessonMaterialLink(materialRoot, value) {
  const normalized = normalizedMaterialLink(value);
  await mkdir(materialRoot, { recursive: true });
  const current = await readLessonMaterialLinkDocument(materialRoot);
  const existing = current.links.find((link) => (
    link.provider === normalized.provider
    && (normalized.provider === "youtube"
      ? link.videoId === normalized.videoId
      : link.url === normalized.url)
  ));
  if (existing) return { created: false, material: lessonMaterialLinkEntry(existing) };

  const now = new Date().toISOString();
  const link = {
    id: randomUUID(),
    kind: "link",
    provider: normalized.provider,
    url: normalized.url,
    ...(normalized.provider === "youtube" ? { videoId: normalized.videoId } : {}),
    title: normalized.provider === "youtube"
      ? `YouTube · ${normalized.videoId}`
      : webLinkTitle(normalized.url),
    createdAt: now,
    updatedAt: now,
  };
  await writeAtomicJson(path.join(materialRoot, lessonMaterialLinksFileName), {
    schemaVersion: 1,
    links: [...current.links, link],
  }, {
    historyRoot: path.join(materialRoot, "_history", "links"),
    historyPrefix: "links",
  });
  return { created: true, material: lessonMaterialLinkEntry(link) };
}

function safeMaterialFileName(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Materialname fehlt.");
  const fileName = value.trim();
  if (fileName !== path.basename(fileName) || fileName.startsWith(".") || fileName.includes("\0")) {
    throw new Error("Ungültiger Materialname.");
  }
  if (!materialMimeType(fileName) && !isDocxName(fileName)) throw new Error("Materialformat wird nicht unterstützt.");
  return fileName;
}

function copyFileName(fileName, copyNumber) {
  const extension = path.extname(fileName);
  const stem = path.basename(fileName, extension);
  return `${stem} – Kopie${copyNumber > 1 ? ` ${copyNumber}` : ""}${extension}`;
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function saveLessonMaterialStream(materialRoot, requestedName, request) {
  const contentLength = Number(request.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxMaterialRequestBytes) {
    throw new ArchiveHttpError(413, "material_too_large", "Materialdatei ist zu groß.");
  }

  await mkdir(materialRoot, { recursive: true });
  const temporaryPath = path.join(materialRoot, `.upload-${randomUUID()}`);
  const hash = createHash("sha256");
  let size = 0;
  const checksumStream = new Transform({
    transform(chunk, _encoding, callback) {
      size += chunk.length;
      if (size > maxMaterialRequestBytes) {
        callback(new ArchiveHttpError(413, "material_too_large", "Materialdatei ist zu groß."));
        return;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(request, checksumStream, createWriteStream(temporaryPath, { flags: "wx" }));
    if (size === 0) throw new Error("Materialdatei ist leer.");
    const checksum = hash.digest("hex");
    let fileName = requestedName;
    for (let copyNumber = 1; ; copyNumber += 1) {
      const filePath = path.join(materialRoot, fileName);
      if (await exists(filePath)) {
        const metadata = await stat(filePath);
        if (metadata.size === size && await sha256File(filePath) === checksum) {
          await unlink(temporaryPath);
          return { created: false, fileName };
        }
        fileName = copyFileName(requestedName, copyNumber);
        continue;
      }
      try {
        await link(temporaryPath, filePath);
        await unlink(temporaryPath);
        return { created: true, fileName };
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        fileName = copyFileName(requestedName, copyNumber);
      }
    }
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function resolveMaterialFile(materialRoot, relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim() || path.isAbsolute(relativePath)) return null;
  const segments = relativePath.split(/[\\/]/);
  if (segments.some((segment) => !segment || segment.startsWith(".") || segment === "_history" || segment === "stunden")) return null;
  const normalizedMaterialRoot = path.resolve(materialRoot);
  const resolvedPath = path.resolve(normalizedMaterialRoot, relativePath);
  if (resolvedPath !== normalizedMaterialRoot && !resolvedPath.startsWith(`${normalizedMaterialRoot}${path.sep}`)) return null;
  return resolvedPath;
}

function withoutUpdatedAt(value) {
  const { updatedAt: _updatedAt, ...rest } = value;
  return rest;
}

async function materializedEntityDocument(filePath, nextDocument, changedAt) {
  if (!(await exists(filePath))) return { ...nextDocument, updatedAt: changedAt };
  try {
    const currentDocument = await readJson(filePath);
    if (isDeepStrictEqual(withoutUpdatedAt(currentDocument), withoutUpdatedAt(nextDocument))) {
      return {
        ...nextDocument,
        updatedAt: typeof currentDocument.updatedAt === "string" ? currentDocument.updatedAt : changedAt,
      };
    }
  } catch {
    // A malformed materialized document is replaced from the canonical catalog below.
  }
  return { ...nextDocument, updatedAt: changedAt };
}

async function writeMaterializedEntity(filePath, nextDocument, changedAt, historyOptions) {
  return writeAtomicJson(
    filePath,
    await materializedEntityDocument(filePath, nextDocument, changedAt),
    historyOptions,
  );
}

async function materializeCatalog(archiveRoot, archiveDocument) {
  const catalog = archiveDocument.catalog;
  for (const subject of catalog.subjects) {
    const subjectPath = path.join(archiveRoot, "faecher", safeSegment(subject.id), "subject.json");
    await writeMaterializedEntity(subjectPath, {
      schemaVersion: 1,
      ...subject,
    }, archiveDocument.updatedAt, {
      historyRoot: path.join(archiveRoot, "_history", "subjects", safeSegment(subject.id)),
      historyPrefix: "subject",
    });
  }
  for (const series of catalog.series) {
    const seriesPath = path.join(
      archiveRoot,
      "faecher",
      safeSegment(series.subjectId),
      "reihen",
      safeSegment(series.id),
      "series.json",
    );
    await writeMaterializedEntity(seriesPath, {
      schemaVersion: 1,
      ...series,
    }, archiveDocument.updatedAt, {
      historyRoot: path.join(archiveRoot, "_history", "series", safeSegment(series.id)),
      historyPrefix: "series",
    });
  }
  for (const lesson of catalog.lessons) {
    const root = lessonRoot(archiveRoot, catalog, lesson.id);
    await mkdir(path.join(root, "material"), { recursive: true });
    const lessonPath = path.join(root, "lesson.json");
    await writeMaterializedEntity(lessonPath, {
      schemaVersion: 1,
      ...lesson,
    }, archiveDocument.updatedAt, {
      historyRoot: path.join(root, ".history"),
      historyPrefix: "lesson",
    });
  }
}

async function readArchive(archiveRoot) {
  const archivePath = path.join(archiveRoot, "archive.json");
  const document = await readJson(archivePath);
  if (document.format !== archiveFormat || document.schemaVersion !== 1) {
    throw new Error("Unbekanntes Unterrichtsarchivformat.");
  }
  return document;
}

async function saveArchive(archiveRoot, incomingCatalog) {
  const archivePath = path.join(archiveRoot, "archive.json");
  const current = await readArchive(archiveRoot);
  const catalog = ensureLessonMaterialBases(mergeCatalog(current.catalog, incomingCatalog), current.catalog);
  if (isDeepStrictEqual(current.catalog, catalog)) {
    await materializeCatalog(archiveRoot, current);
    return current;
  }
  const updated = {
    ...current,
    updatedAt: new Date().toISOString(),
    catalog,
  };
  await writeAtomicJson(archivePath, updated, {
    historyRoot: path.join(archiveRoot, "_history", "archive"),
    historyPrefix: "archive",
  });
  await materializeCatalog(archiveRoot, updated);
  return updated;
}

// Class mutations share the catalog queue and change only the selected class.
// A stale catalog save must never replace the independently maintained class list.
async function saveArchiveClass(archiveRoot, input, renameId = null) {
  const { id = renameId, label, previousLabel } = input ?? {};
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(id)
      || typeof label !== "string" || !label.trim() || label.trim().length > 100) {
    throw new ArchiveHttpError(400, "invalid_class", "Bitte einen Namen mit 1 bis 100 Zeichen eingeben.");
  }
  const name = label.trim();
  const current = await readArchive(archiveRoot);
  const classes = current.classes ?? [];
  const existing = classes.find((entry) => entry.id === id);
  if (renameId && (!existing || id !== renameId)) {
    throw new ArchiveHttpError(404, "class_not_found", "Klasse oder Kurs wurde nicht gefunden.");
  }
  if (existing && existing.label === name) return { classes };
  if (existing && (!renameId || previousLabel !== existing.label)) {
    throw new ArchiveHttpError(409, "class_conflict", "Der Name wurde inzwischen geändert. Bitte die App neu laden.");
  }
  if (classes.some((entry) => entry.id !== id && entry.label.toLocaleLowerCase("de-DE") === name.toLocaleLowerCase("de-DE"))) {
    throw new ArchiveHttpError(409, "duplicate_class", "Eine Klasse oder ein Kurs mit diesem Namen existiert bereits.");
  }
  const nextClasses = existing
    ? classes.map((entry) => entry.id === id ? { ...entry, label: name } : entry)
    : [...classes, { id, label: name }];
  await writeAtomicJson(path.join(archiveRoot, "archive.json"), {
    ...current, classes: nextClasses, updatedAt: new Date().toISOString(),
  }, { historyRoot: path.join(archiveRoot, "_history", "archive"), historyPrefix: "archive" });
  return { classes: nextClasses };
}

function resolveUniqueArchiveItem(items, selector, kind) {
  if (typeof selector !== "string" || !selector.trim()) throw new Error(`${kind} fehlt.`);
  const normalizedSelector = selector.trim().toLocaleLowerCase("de-DE");
  const matches = items.filter((item) => item.id === selector
    || (typeof item.label === "string" && item.label.toLocaleLowerCase("de-DE") === normalizedSelector));
  if (matches.length === 0) throw new Error(`${kind} „${selector}“ wurde im Archiv nicht gefunden.`);
  if (matches.length > 1) throw new Error(`${kind} „${selector}“ ist nicht eindeutig; bitte die stabile ID verwenden.`);
  return matches[0];
}

function normalizeScheduledFor(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Unterrichtsdatum muss YYYY-MM-DD sein oder fehlen.");
  }
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Unterrichtsdatum ist ungültig.");
  }
  return value;
}

function normalizeSourceReferences(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Quellenreferenzen müssen eine Liste sein.");
  return value.map((reference) => {
    if (!reference || typeof reference !== "object" || typeof reference.path !== "string" || !reference.path.trim()) {
      throw new Error("Quellenreferenz benötigt einen Pfad.");
    }
    if (!["observed", "user-confirmed", "reconstructed", "planned"].includes(reference.evidence)) {
      throw new Error(
        "Quellenreferenz benötigt evidence observed, user-confirmed, reconstructed oder planned.",
      );
    }
    return { path: reference.path.trim(), evidence: reference.evidence };
  });
}

export async function createArchiveLesson(archiveRoot, input) {
  const archiveDocument = await readArchive(archiveRoot);
  const catalog = archiveDocument.catalog;
  const lessonClass = resolveUniqueArchiveItem(archiveDocument.classes, input.classSelector, "Klasse");
  const subject = resolveUniqueArchiveItem(
    catalog.subjects.filter((candidate) => candidate.classId === lessonClass.id),
    input.subjectSelector,
    "Fach",
  );
  const series = resolveUniqueArchiveItem(
    catalog.series.filter((candidate) => candidate.subjectId === subject.id && candidate.archiveRole !== "material-basis"),
    input.seriesSelector,
    "Reihe",
  );
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) throw new Error("Unterrichtstitel fehlt.");
  if (title.length > 80) throw new Error("Unterrichtstitel darf höchstens 80 Zeichen lang sein.");
  const scheduledFor = normalizeScheduledFor(input.scheduledFor);
  const sourceReferences = normalizeSourceReferences(input.sourceReferences);
  const requestedLessonId = input.lessonId === undefined ? null : safeSegment(input.lessonId);
  const trashedLessonIds = new Set(catalog.trash
    .filter((item) => item.kind === "lesson")
    .map((item) => item.id));

  const existingLesson = requestedLessonId
    ? catalog.lessons.find((lesson) => lesson.id === requestedLessonId)
    : input.allowDuplicate
      ? undefined
      : catalog.lessons.find((lesson) => !trashedLessonIds.has(lesson.id)
        && lesson.classId === lessonClass.id
        && lesson.subjectId === subject.id
        && lesson.seriesId === series.id
        && lesson.title.trim().toLocaleLowerCase("de-DE") === title.toLocaleLowerCase("de-DE")
        && lesson.metadata?.scheduledFor === scheduledFor);
  if (existingLesson) {
    const isSameLesson = existingLesson.classId === lessonClass.id
      && existingLesson.subjectId === subject.id
      && existingLesson.seriesId === series.id
      && existingLesson.title === title
      && existingLesson.metadata?.scheduledFor === scheduledFor;
    if (!isSameLesson && requestedLessonId) {
      throw new Error(`Lesson-ID ${requestedLessonId} gehört bereits zu einem anderen Unterricht.`);
    }
    return { created: false, lesson: existingLesson, archive: archiveDocument };
  }

  const lessonId = requestedLessonId ?? `lesson-${randomUUID()}`;
  const lesson = {
    id: lessonId,
    classId: lessonClass.id,
    subjectId: subject.id,
    seriesId: series.id,
    title,
    metadata: { scheduledFor },
    seed: { prompt: "", showTransportImage: false },
    materialBasis: ownLessonMaterialBasis({
      id: lessonId,
      subjectId: subject.id,
      seriesId: series.id,
    }),
    ...(sourceReferences.length ? { sourceReferences } : {}),
  };
  catalog.lessons.push(lesson);
  const existingOrder = catalog.lessonOrderBySeriesId[series.id] ?? [];
  const siblingIds = catalog.lessons
    .filter((candidate) => candidate.seriesId === series.id)
    .map((candidate) => candidate.id);
  catalog.lessonOrderBySeriesId[series.id] = [...new Set([...existingOrder, ...siblingIds])];
  const updatedArchive = {
    ...archiveDocument,
    updatedAt: new Date().toISOString(),
    catalog,
  };
  await writeAtomicJson(path.join(archiveRoot, "archive.json"), updatedArchive, {
    historyRoot: path.join(archiveRoot, "_history", "archive"),
    historyPrefix: "archive",
  });
  await materializeCatalog(archiveRoot, updatedArchive);
  return { created: true, lesson, archive: updatedArchive };
}

async function archiveCurrentPath(filePath, historyRoot, prefix) {
  if (!(await exists(filePath))) return false;
  await mkdir(historyRoot, { recursive: true });
  await rename(filePath, path.join(historyRoot, `${prefix}-${timestamp()}${path.extname(filePath)}`));
  return true;
}

function assetPayloadToBuffer(file) {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(file.dataURL);
  if (!match) throw new Error("Material enthält keine unterstützten Binärdaten.");
  return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
}

async function saveAssets(lessonDirectory, files) {
  const assetsRoot = path.join(lessonDirectory, "assets");
  const manifestPath = path.join(assetsRoot, "manifest.json");
  const manifest = (await exists(manifestPath)) ? await readJson(manifestPath) : { schemaVersion: 1, assets: [] };
  const assetsById = new Map(manifest.assets.map((asset) => [asset.fileId, asset]));
  await mkdir(assetsRoot, { recursive: true });

  for (const file of files) {
    const fileId = safeSegment(file.id);
    const { mimeType, bytes } = assetPayloadToBuffer(file);
    const fileName = `${fileId}${extensionForMimeType(mimeType)}`;
    const filePath = path.join(assetsRoot, fileName);
    if (await exists(filePath)) {
      const currentBytes = await readFile(filePath);
      if (!currentBytes.equals(bytes)) {
        const conflictRoot = path.join(lessonDirectory, ".history", "asset-conflicts");
        await mkdir(conflictRoot, { recursive: true });
        await writeFile(path.join(conflictRoot, `${fileId}-${timestamp()}${extensionForMimeType(mimeType)}`), bytes, { flag: "wx" });
        throw new Error(`Materialkonflikt für ${fileId}; beide Fassungen wurden erhalten.`);
      }
    } else {
      await writeFile(filePath, bytes, { flag: "wx" });
    }
    const { dataURL: _dataURL, id: _id, ...metadata } = file;
    assetsById.set(fileId, {
      ...metadata,
      fileId,
      fileName,
      mimeType,
      updatedAt: Date.now(),
    });
  }
  await writeAtomicJson(manifestPath, {
    schemaVersion: 1,
    assets: [...assetsById.values()],
  }, {
    historyRoot: path.join(lessonDirectory, ".history", "assets"),
    historyPrefix: "manifest",
  });
}

async function loadAssets(lessonDirectory, fileIds) {
  const manifestPath = path.join(lessonDirectory, "assets", "manifest.json");
  if (!(await exists(manifestPath))) return [];
  const manifest = await readJson(manifestPath);
  const requested = new Set(fileIds);
  const result = [];
  for (const asset of manifest.assets) {
    if (!requested.has(asset.fileId)) continue;
    const bytes = await readFile(path.join(lessonDirectory, "assets", asset.fileName));
    const { fileId, fileName: _fileName, updatedAt: _updatedAt, ...metadata } = asset;
    result.push({
      ...metadata,
      id: fileId,
      dataURL: `data:${asset.mimeType};base64,${bytes.toString("base64")}`,
    });
  }
  return result;
}

export function createArchiveMiddleware(archiveRoot, {convertOffice,sentenceConfigPath=path.join(path.dirname(archiveRoot),'sentence-check.json'),sentenceGateway,directSentenceGateway} = {}) {
  const studentNotes = createStudentNotesMiddleware({ archiveRoot, readArchive: () => readArchive(archiveRoot), writeJson: writeAtomicJson });
  const companion=sentenceGateway??createVideoLabSentenceGateway({configPath:sentenceConfigPath});
  const direct=directSentenceGateway??createDirectSentenceGateway();
  const assessSentence=(capability,data,signal)=>(capability.protocol==='tafelraum-v1'?direct:companion)(capability,data,signal);
  let catalogWriteQueue = Promise.resolve();
  let materialWriteQueue = Promise.resolve();
  function queueMaterialWrite(write) {
    const result = materialWriteQueue.then(write, write);
    materialWriteQueue = result.then(() => undefined, () => undefined);
    return result;
  }
  const boardWriteQueues = new Map();

  function queueBoardWrite(boardPath, write) {
    const previous = boardWriteQueues.get(boardPath) ?? Promise.resolve();
    const result = previous.then(write, write);
    const settled = result.then(() => undefined, () => undefined);
    boardWriteQueues.set(boardPath, settled);
    void settled.finally(() => {
      if (boardWriteQueues.get(boardPath) === settled) boardWriteQueues.delete(boardPath);
    });
    return result;
  }

  return async function archiveMiddleware(request, response, next) {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (!requestUrl.pathname.startsWith("/api/archive")) {
      next();
      return;
    }
    try {
      let privateHandled = true;
      await studentNotes(request, response, () => { privateHandled = false; });
      if (privateHandled) return;
      if (request.method === "GET" && requestUrl.pathname === "/api/archive/status") {
        await stat(path.join(archiveRoot, "archive.json"));
        jsonResponse(response, 200, { available: true, archiveRoot });
        return;
      }
      if (requestUrl.pathname === "/api/archive" && request.method === "GET") {
        jsonResponse(response, 200, await readArchive(archiveRoot));
        return;
      }
      const classRoute = requestUrl.pathname.match(/^\/api\/archive\/classes(?:\/([a-z0-9._-]+))?$/i);
      if (classRoute && ((!classRoute[1] && request.method === "POST")
          || (classRoute[1] && request.method === "PUT"))) {
        const body = await readRequestJson(request);
        const save = () => saveArchiveClass(archiveRoot, body, classRoute[1] ?? null);
        const result = catalogWriteQueue.then(save, save);
        catalogWriteQueue = result.then(() => undefined, () => undefined);
        jsonResponse(response, 200, await result);
        return;
      }
      if (requestUrl.pathname === "/api/archive" && request.method === "PUT") {
        const body = await readRequestJson(request);
        const save = () => saveArchive(archiveRoot, body.catalog);
        const result = catalogWriteQueue.then(save, save);
        catalogWriteQueue = result.then(() => undefined, () => undefined);
        jsonResponse(response, 200, await result);
        return;
      }
      if (requestUrl.pathname === "/api/archive/lessons" && request.method === "POST") {
        const body = await readRequestJson(request);
        const create = () => createArchiveLesson(archiveRoot, body);
        const result = catalogWriteQueue.then(create, create);
        catalogWriteQueue = result.then(() => undefined, () => undefined);
        const createdLesson = await result;
        jsonResponse(response, createdLesson.created ? 201 : 200, createdLesson);
        return;
      }

      if (requestUrl.pathname === "/api/archive/material-removals" && request.method === "GET") {
        const removals = await queueMaterialWrite(() => reactivateRestoredSources(archiveRoot));
        jsonResponse(response, 200, {removals});
        return;
      }
      const materialOrderMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/order$/.exec(requestUrl.pathname);
      if (materialOrderMatch && request.method === "PUT") {
        const lessonId = decodeURIComponent(materialOrderMatch[1]);
        const body = await readRequestJson(request);
        if (!validMaterialPaths(body?.paths) || !validMaterialPaths(body?.previousPaths)) {
          throw new ArchiveHttpError(400, "invalid-material-order", "Materialreihenfolge ist ungültig.");
        }
        const result = await queueMaterialWrite(async () => {
          const archive = await readArchive(archiveRoot);
          const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
          if (!basis) throw new ArchiveHttpError(404, "lesson-not-found", "Unterricht wurde nicht gefunden.");
          const removals = await reactivateRestoredSources(archiveRoot);
          const materials = (await listLessonMaterials(basis.root)).filter(material => !removals.some(record =>
            record.archiveMaterialPath === path.posix.join(basis.archivePath, material.path)));
          const current = materials.map(material => material.path);
          if (JSON.stringify(current) !== JSON.stringify(body.previousPaths)) {
            throw new ArchiveHttpError(409, "material-order-conflict", "Materialliste wurde inzwischen geändert. Bitte neu laden und erneut sortieren.");
          }
          if (body.paths.length !== current.length || body.paths.some(item => !current.includes(item))) {
            throw new ArchiveHttpError(400, "invalid-material-order", "Die Reihenfolge muss alle vorhandenen Materialien genau einmal enthalten.");
          }
          if (JSON.stringify(current) !== JSON.stringify(body.paths)) {
            await writeAtomicJson(path.join(basis.root, materialOrderFileName), {schemaVersion: 1, paths: body.paths}, {
              historyRoot: path.join(basis.root, ".history", "material-order"), historyPrefix: "order",
            });
          }
          const byPath = new Map(materials.map(material => [material.path, material]));
          return {materials: body.paths.map(item => byPath.get(item))};
        });
        jsonResponse(response, 200, result);
        return;
      }

      const materialListMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials$/.exec(requestUrl.pathname);
      if (materialListMatch && request.method === "GET") {
        const lessonId = decodeURIComponent(materialListMatch[1]);
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        if (!basis) {
          jsonResponse(response, 404, { error: "Unterricht wurde im Archiv nicht gefunden." });
          return;
        }
        const removals = await queueMaterialWrite(() => reactivateRestoredSources(archiveRoot));
        jsonResponse(response, 200, {
          lessonId,
          basis: {
            archiveSeriesId: basis.archiveSeriesId,
            archivePath: basis.archivePath,
            label: basis.label,
            scope: basis.scope,
          },
          materials: (await listLessonMaterials(basis.root)).filter(material => !removals.some(record =>
            record.archiveMaterialPath === path.posix.join(basis.archivePath, material.path))),
        });
        return;
      }

      if (materialListMatch && request.method === "PATCH") {
        const lessonId = decodeURIComponent(materialListMatch[1]);
        const body = await readRequestJson(request);
        if (!validMaterialDisplayName(body?.displayName) || typeof body?.previousDisplayName !== "string") {
          throw new ArchiveHttpError(400, "invalid-material-name", "Bitte einen Namen mit 1 bis 160 Zeichen ohne Zeilenumbrüche eingeben.");
        }
        const result = await queueMaterialWrite(async () => {
          const archive = await readArchive(archiveRoot);
          const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
          if (!basis) throw new ArchiveHttpError(404, "lesson-not-found", "Unterricht wurde nicht gefunden.");
          const material = (await listLessonMaterials(basis.root)).find(item => item.path === body.path);
          const removals = await readMaterialRemovals(archiveRoot);
          if (!material || removals.some(item => item.archiveMaterialPath === path.posix.join(basis.archivePath, material.path))) {
            throw new ArchiveHttpError(404, "material-not-found", "Material wurde nicht gefunden.");
          }
          if ((material.displayName ?? material.name) !== body.previousDisplayName) {
            throw new ArchiveHttpError(409, "material-name-conflict", "Der Materialname wurde inzwischen geändert. Bitte abbrechen und Material neu laden.");
          }
          if (body.displayName.trim() === (material.displayName ?? material.name)) return { material };
          const document = await readMaterialNames(basis.root);
          const names = { ...document.names };
          const displayName = body.displayName.trim();
          if (displayName === material.name) delete names[material.path];
          else names[material.path] = displayName;
          await writeAtomicJson(path.join(basis.root, materialNamesFileName), { schemaVersion: 1, names }, {
            historyRoot: path.join(basis.root, ".history", "material-names"), historyPrefix: "names",
          });
          const { displayName: _previousName, ...source } = material;
          return { material: { ...source, ...(displayName !== material.name ? { displayName } : {}) } };
        });
        jsonResponse(response, 200, result);
        return;
      }

      if (materialListMatch && request.method === "DELETE") {
        const lessonId = decodeURIComponent(materialListMatch[1]);
        const body = await readRequestJson(request);
        const result = await queueMaterialWrite(async () => {
          const archive = await readArchive(archiveRoot);
          const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
          if (!basis) throw new ArchiveHttpError(404, "lesson-not-found", "Unterricht wurde nicht gefunden.");
          const materials = await listLessonMaterials(basis.root);
          const material = materials.find(item => item.path === body.path);
          if (!material) throw new ArchiveHttpError(404, "material-not-found", "Material wurde nicht gefunden.");
          const archiveMaterialPath = path.posix.join(basis.archivePath, material.path);
          const previous = await readMaterialRemovals(archiveRoot);
          const record = {archiveMaterialPath, lessonId,
            lessonIds: archive.catalog.lessons.filter(lesson =>
              lessonMaterialBasis(archiveRoot, archive.catalog, lesson.id)?.archivePath === basis.archivePath).map(lesson => lesson.id),
            fileName: materials.filter(item => item.name === material.name).length === 1 ? material.name : "",
          };
          const elementIdsByLesson = {};
          for (const lesson of archive.catalog.lessons) {
            const boardPath = path.join(lessonRoot(archiveRoot, archive.catalog, lesson.id), "board", "scene.json");
            if (!(await exists(boardPath))) continue;
            const board = (await readBoard(boardPath)).snapshot;
            const next = pruneRemovedMaterials(board, [record], lesson.id);
            const kept = new Set(next.elements?.map(element => element.id));
            elementIdsByLesson[lesson.id] = (board.elements ?? []).filter(element => !kept.has(element.id)).map(element => element.id);
          }
          record.elementIdsByLesson = elementIdsByLesson;
          const removals = [...previous.filter(item => item.archiveMaterialPath !== archiveMaterialPath), record];
          // Commit the guard first: interrupted cleanup remains recoverable and cannot resurrect a board.
          await writeMaterialRemovals(archiveRoot, removals);
          try {
            if (material.kind === "link") {
              const document = await readLessonMaterialLinkDocument(basis.root);
              await writeAtomicJson(path.join(basis.root, lessonMaterialLinksFileName), {
                ...document, links: document.links.filter(link => `@links/${link.id}` !== material.path),
              }, {historyRoot: path.join(basis.root, "_history", "links")});
            } else {
              const source = resolveArchiveRelativePath(basis.root, material.path);
              const resolved = await realpath(source);
              const resolvedRoot = await realpath(basis.root);
              if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Materialpfad liegt außerhalb des Archivs.");
              const history = path.join(basis.root, ".history", "removed-materials", randomUUID());
              await mkdir(history, {recursive: true});
              await rename(source, path.join(history, path.basename(source)));
            }
          } catch (error) {
            await writeMaterialRemovals(archiveRoot, previous);
            throw error;
          }
          // Copies in other lessons share source provenance; clean their persisted boards too.
          for (const lesson of archive.catalog.lessons) {
            const root = lessonRoot(archiveRoot, archive.catalog, lesson.id);
            const boardPath = path.join(root, "board", "scene.json");
            await queueBoardWrite(boardPath, async () => {
              if (!(await exists(boardPath))) return;
              const board = await readBoard(boardPath);
              const next = pruneRemovedMaterials(board.snapshot, removals, lesson.id);
              if (next !== board.snapshot) await writeAtomicJson(boardPath, next, {
                historyRoot: path.join(root, ".history", "board"), historyPrefix: "material-removal",
              });
            });
          }
          return {removed: true, removals};
        });
        jsonResponse(response, 200, result);
        return;
      }

      const materialFileMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/file$/.exec(requestUrl.pathname);
      if (materialFileMatch && request.method === "PUT") {
        const lessonId = decodeURIComponent(materialFileMatch[1]);
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        if (!basis) {
          jsonResponse(response, 404, { error: "Unterricht wurde im Archiv nicht gefunden." });
          return;
        }
        if (basis.scope !== "lesson") {
          jsonResponse(response, 409, { error: "Neue Dateien benötigen eine stundenbezogene Materialbasis." });
          return;
        }
        const requestedName = safeMaterialFileName(requestUrl.searchParams.get("name"));
        const controller = new AbortController();
        const cancel = () => { if (!response.writableEnded) controller.abort(); };
        response.once("close", cancel);
        let saved;
        try {
          saved = await queueMaterialWrite(async () => {
            const result = isDocxName(requestedName)
              ? await importOfficeDocument(basis.root, requestedName, request, {convert:convertOffice,signal:controller.signal,beforeCommit:async()=>{
                  const latest = await readArchive(archiveRoot);
                  const lesson = latest.catalog.lessons.find(item=>item.id===lessonId);
                  const latestBasis = lessonMaterialBasis(archiveRoot,latest.catalog,lessonId);
                  if(!lesson || latestBasis?.root!==basis.root || latest.catalog.hiddenLessonIds.includes(lessonId)
                    || latest.catalog.trash.some(item=>item.kind==="lesson"?item.id===lessonId:item.kind==="series"?item.id===lesson.seriesId:item.kind==="subject"?item.id===lesson.subjectId:item.kind==="class"&&item.id===lesson.classId)) {
                    throw new Error("Die Zielstunde ist nicht mehr verfügbar. Die Word-Datei wurde nicht übernommen.");
                  }
                }})
              : await saveLessonMaterialStream(basis.root, requestedName, request);
            await reactivateMaterial(archiveRoot, path.posix.join(basis.archivePath, result.fileName));
            return result;
          });
        } catch (error) {
          if (isDocxName(requestedName)) throw new ArchiveHttpError(422, "word_conversion_failed", error instanceof Error ? error.message : "Word-Datei konnte nicht umgewandelt werden.");
          throw error;
        } finally { response.off("close", cancel); }
        const materials = await listLessonMaterials(basis.root);
        const material = materials.find((candidate) => candidate.path === saved.fileName);
        if (!material) throw new Error("Gespeichertes Material konnte nicht gelesen werden.");
        jsonResponse(response, saved.created ? 201 : 200, {
          material,
          created: saved.created,
          archiveMaterialPath: path.posix.join(basis.archivePath, material.path),
        });
        return;
      }

      const sentenceMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/interactive\/([^/]+)\/sentence-check$/.exec(requestUrl.pathname);
      if(sentenceMatch&&request.method==='POST'){
        const host=request.headers.host??'';
        if(!/^(?:127\.0\.0\.1|localhost)(?::[0-9]+)?$/.test(host)||request.headers.origin!==`http://${host}`||request.headers['sec-fetch-site']==='cross-site'){
          jsonResponse(response,403,{error:'Sentence check requires the local Tafelraum host.'});return;
        }
        if(!request.headers['content-type']?.startsWith('application/json')){jsonResponse(response,415,{error:'JSON required.'});return;}
        const lessonId=decodeURIComponent(sentenceMatch[1]),materialId=decodeURIComponent(sentenceMatch[2]);
        const archive=await readArchive(archiveRoot),basis=lessonMaterialBasis(archiveRoot,archive.catalog,lessonId);
        if(!basis||!/^[a-z0-9][a-z0-9._-]*$/i.test(materialId)){jsonResponse(response,404,{error:'Activity unavailable.'});return;}
        const interactive=await readInteractiveMaterialPackage(path.join(basis.root,interactiveMaterialFolderName,materialId),path.posix.join(interactiveMaterialFolderName,materialId));
        if(!interactive.sentenceCheck){jsonResponse(response,403,{error:'This activity does not support sentence checks.'});return;}
        const chunks=[];let bytes=0;
        for await(const chunk of request){bytes+=chunk.length;if(bytes>4096){jsonResponse(response,413,{error:'Sentence request is too large.'});return;}chunks.push(chunk);}
        let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{jsonResponse(response,400,{error:'Invalid sentence check.'});return;}
        const controller=new AbortController();const closed=()=>{if(!response.writableEnded)controller.abort();};response.once('close',closed);
        try{jsonResponse(response,200,await assessSentence(interactive.sentenceCheck,data,controller.signal));}
        catch(error){jsonResponse(response,[400,409,429,502,503].includes(error.status)?error.status:503,{error:'AI check is unavailable. Please ask your teacher to check the connection.'});}
        finally{response.off('close',closed);}
        return;
      }

      const interactivePackageMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/interactive\/([^/]+)$/.exec(requestUrl.pathname);
      if (interactivePackageMatch && request.method === "GET") {
        const lessonId = decodeURIComponent(interactivePackageMatch[1]);
        const materialId = decodeURIComponent(interactivePackageMatch[2]);
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        if (!basis || !/^[a-z0-9][a-z0-9._-]*$/i.test(materialId)) throw new ArchiveHttpError(404, "not_found", "Material nicht gefunden.");
        const packageRoot = path.join(basis.root, interactiveMaterialFolderName, materialId);
        const interactive = await readInteractiveMaterialPackage(packageRoot, path.posix.join(interactiveMaterialFolderName, materialId));
        const files = await listInteractiveMaterialFiles(packageRoot);
        const base = `/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/interactive/${encodeURIComponent(materialId)}`;
        jsonResponse(response, 200, { entry: interactive.entry, title: interactive.title, live:interactive.live, print:interactive.print, playback:interactive.playback, sentenceCheck:interactive.sentenceCheck,
          files: files.map(file => ({ ...file, url: `${base}/${file.path.split("/").map(encodeURIComponent).join("/")}` })) });
        return;
      }

      const interactiveMaterialMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/interactive\/([^/]+)\/(.+)$/.exec(requestUrl.pathname);
      if (interactiveMaterialMatch && request.method === "GET") {
        const lessonId = decodeURIComponent(interactiveMaterialMatch[1]);
        const materialId = decodeURIComponent(interactiveMaterialMatch[2]);
        const resourcePath = interactiveMaterialMatch[3].split("/").map(decodeURIComponent).join("/");
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        if (!basis || !/^[a-z0-9][a-z0-9._-]*$/i.test(materialId)) {
          interactiveMaterialErrorResponse(response, 404);
          return;
        }
        try {
          const packageRoot = path.join(basis.root, interactiveMaterialFolderName, materialId);
          const interactive = await readInteractiveMaterialPackage(
            packageRoot,
            path.posix.join(interactiveMaterialFolderName, materialId),
          );
          const filePath = await resolveInteractiveMaterialFile(packageRoot, resourcePath);
          const mimeType = interactiveMaterialMimeType(filePath);
          if (!mimeType) throw new Error("Dateityp wird nicht unterstützt.");
          setInteractiveMaterialHeaders(response, mimeType, request.interactiveAssetSource);
          if (/^(audio|video)\//.test(mimeType)) {
            await streamMaterialFile(request, response, filePath);
            return;
          }
          const playback = resourcePath === interactive.entry ? interactive.playback : null;
          const output = Boolean(playback && requestUrl.searchParams.get('tafelraum-playback') === 'output');
          const local = Boolean(playback && requestUrl.searchParams.get('tafelraum-playback') === 'local');
          // Only an actual declared player, never ordinary HTML or passive previews.
          if(output||local)response.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), display-capture=(), fullscreen=*');
          let html;
          if(mimeType.startsWith('text/html')){
            html=await readFile(filePath,'utf8');
            const passive=!playback&&requestUrl.searchParams.get('tafelraum-playback')==='passive';
            if(playback&&!output&&!local||passive){
              const at=html.search(/<script\b|<\/head\s*>|<body\b/i);
              const offset=at<0?(html.match(/^\s*<!doctype[^>]*>/i)?.[0].length??0):at;
              html=html.slice(0,offset)+(passive?playbackSilentScript():playbackSharedScript())+html.slice(offset);
            }
          }
          const bytes = mimeType.startsWith("text/html")
            ? Buffer.from(injectInteractiveMaterialBridge(html, output, local, Boolean(interactive.sentenceCheck)), "utf8")
            : await readFile(filePath);
          response.statusCode = 200;
          response.setHeader("Content-Length", String(bytes.length));
          response.end(bytes);
        } catch {
          interactiveMaterialErrorResponse(response, 404);
        }
        return;
      }

      const materialLinkMatch = /^\/api\/archive\/lessons\/([^/]+)\/materials\/links$/.exec(requestUrl.pathname);
      if (materialLinkMatch && request.method === "POST") {
        const lessonId = decodeURIComponent(materialLinkMatch[1]);
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        if (!basis) {
          jsonResponse(response, 404, { error: "Unterricht wurde im Archiv nicht gefunden." });
          return;
        }
        if (basis.scope !== "lesson") {
          jsonResponse(response, 409, { error: "Neue Links benötigen eine stundenbezogene Materialbasis." });
          return;
        }
        const body = await readRequestJson(request);
        const resultPromise = queueMaterialWrite(async () => {
          const result = await saveLessonMaterialLink(basis.root, body.url);
          await reactivateMaterial(archiveRoot, path.posix.join(basis.archivePath, result.material.path));
          return result;
        });
        try {
          const result = await resultPromise;
          jsonResponse(response, result.created ? 201 : 200, {
            ...result,
            archiveMaterialPath: path.posix.join(basis.archivePath, result.material.path),
          });
        } catch (error) {
          jsonResponse(response, 422, {
            error: error instanceof Error ? error.message : "Link konnte nicht gespeichert werden.",
          });
        }
        return;
      }
      if (materialFileMatch && request.method === "GET") {
        const lessonId = decodeURIComponent(materialFileMatch[1]);
        const archive = await readArchive(archiveRoot);
        const basis = lessonMaterialBasis(archiveRoot, archive.catalog, lessonId);
        const relativePath = requestUrl.searchParams.get("path");
        const requestedFilePath = basis ? resolveMaterialFile(basis.root, relativePath) : null;
        const mimeType = requestedFilePath ? materialMimeType(requestedFilePath) : null;
        let filePath = null;
        if (basis && requestedFilePath && mimeType && await exists(requestedFilePath) && (await stat(requestedFilePath)).isFile()) {
          const realMaterialRoot = await realpath(basis.root);
          const realFilePath = await realpath(requestedFilePath);
          if (realFilePath.startsWith(`${realMaterialRoot}${path.sep}`)) filePath = realFilePath;
        }
        if (!filePath || !mimeType) {
          jsonResponse(response, 404, { error: "Material wurde im Unterrichtsarchiv nicht gefunden." });
          return;
        }
        response.setHeader("Content-Type", mimeType);
        response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(path.basename(filePath))}`);
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        await streamMaterialFile(request, response, filePath);
        return;
      }

      const canvasMatch = /^\/api\/archive\/lessons\/([^/]+)\/board$/.exec(requestUrl.pathname);
      if (canvasMatch) {
        const lessonId = decodeURIComponent(canvasMatch[1]);
        const archive = await readArchive(archiveRoot);
        const root = lessonRoot(archiveRoot, archive.catalog, lessonId);
        const boardPath = path.join(root, "board", "scene.json");
        if (request.method === "GET") {
          if (!(await exists(boardPath))) {
            jsonResponse(response, 404, { error: "Kein archivierter Canvasstand." });
            return;
          }
          const board = await readBoard(boardPath);
          response.setHeader("ETag", board.revision);
          jsonResponse(response, 200, pruneRemovedMaterials(board.snapshot, await readMaterialRemovals(archiveRoot), lessonId));
          return;
        }
        if (request.method === "PUT") {
          const incomingSnapshot = await readRequestJson(request);
          const result = await queueBoardWrite(boardPath, async () => {
            if (await exists(boardPath)) {
              requireCurrentBoardRevision(request, (await readBoard(boardPath)).revision);
            } else {
              requireNewBoardRevision(request);
            }
            const snapshot = pruneRemovedMaterials(incomingSnapshot, await readMaterialRemovals(archiveRoot), lessonId);
            await writeAtomicJson(boardPath, snapshot, {
              historyRoot: path.join(root, ".history", "board"),
              historyPrefix: "scene",
              minimumHistoryIntervalMs: request.headers["x-tafelraum-recovery"] === "1" ? 0 : boardHistoryIntervalMs,
            });
            return readBoard(boardPath);
          });
          response.setHeader("ETag", result.revision);
          jsonResponse(response, 200, { saved: true, revision: result.revision });
          return;
        }
        if (request.method === "DELETE") {
          const archived = await queueBoardWrite(boardPath, async () => {
            if (!(await exists(boardPath))) return false;
            requireCurrentBoardRevision(request, (await readBoard(boardPath)).revision);
            return archiveCurrentPath(boardPath, path.join(root, ".history", "board"), "scene-reset");
          });
          jsonResponse(response, 200, { archived });
          return;
        }
      }

      const assetMatch = /^\/api\/archive\/lessons\/([^/]+)\/assets$/.exec(requestUrl.pathname);
      if (assetMatch) {
        const lessonId = decodeURIComponent(assetMatch[1]);
        const archive = await readArchive(archiveRoot);
        const root = lessonRoot(archiveRoot, archive.catalog, lessonId);
        if (request.method === "POST") {
          const body = await readRequestJson(request);
          jsonResponse(response, 200, { files: await loadAssets(root, body.fileIds ?? []) });
          return;
        }
        if (request.method === "PUT") {
          const body = await readRequestJson(request);
          await saveAssets(root, body.files ?? []);
          jsonResponse(response, 200, { saved: true });
          return;
        }
        if (request.method === "DELETE") {
          const assetsRoot = path.join(root, "assets");
          if (!(await exists(assetsRoot))) {
            jsonResponse(response, 200, { archived: false });
            return;
          }
          const historyRoot = path.join(root, ".history", "assets-reset");
          await mkdir(historyRoot, { recursive: true });
          await rename(assetsRoot, path.join(historyRoot, `assets-${timestamp()}`));
          jsonResponse(response, 200, { archived: true });
          return;
        }
      }

      jsonResponse(response, 404, { error: "Unbekannter Archivpfad." });
    } catch (error) {
      jsonResponse(response, error instanceof ArchiveHttpError ? error.status : 500, {
        error: error instanceof Error ? error.message : "Archivfehler",
        ...(error instanceof ArchiveHttpError ? { code: error.code } : {}),
      });
    }
  };
}

export function createArchivePlugin({ archiveRootUrl }) {
  const archiveRoot = fileURLToPath(archiveRootUrl);
  const middleware = createArchiveMiddleware(archiveRoot);
  return {
    name: "tafelraum-local-archive",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
