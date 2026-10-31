import { t } from "./i18n/translate.ts";
import type { BinaryFileData, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import type { StoredCanvasSnapshot } from "./canvas/canvas-persistence";
import type { ArchiveClassDefinition, LocalLessonCatalog } from "./lesson-catalog";

export type ArchiveFileState = "checking" | "saving" | "saved" | "browser-only" | "error";

type ArchiveDocument = {
  format: "tafelraum-unterrichtsarchiv";
  schemaVersion: 1;
  classes: ArchiveClassDefinition[];
  catalog: LocalLessonCatalog;
};

const listeners = new Set<(state: ArchiveFileState) => void>();
type PendingSnapshot = { snapshot: StoredCanvasSnapshot; confirmed?: (revision: string, previous: string | null) => Promise<void>; preservePrevious?: boolean };
const pendingSnapshots = new Map<string, PendingSnapshot>();
const canvasFailures = new Map<string, string>();
const snapshotTimers = new Map<string, number>();
const boardRevisions = new Map<string, string | null>();
const canvasSaveQueues = new Map<string, Promise<void>>();
// Session-local retry state; IndexedDB remains the existing durable browser cache.
const pendingCanvasFiles = new Map<string, Map<FileId, BinaryFileData>>();
const canvasFileSaveQueues = new Map<string, Promise<void>>();
const canvasFileFailures = new Map<string, "browser-only" | "error">();
let archiveFileState: ArchiveFileState = "checking";
let activeWrites = 0;
let catalogSaveQueue: Promise<LocalLessonCatalog | null> = Promise.resolve(null);

function setArchiveFileState(state: ArchiveFileState) {
  // A successful unrelated request cannot confirm an outstanding asset upload.
  if (canvasFailures.size || [...canvasFileFailures.values()].includes("error")) state = "error";
  else if (canvasFileFailures.size > 0) state = "browser-only";
  else if (state === "saved" && (activeWrites > 0 || pendingSnapshots.size > 0 || pendingCanvasFiles.size > 0 || canvasFileSaveQueues.size > 0)) state = "saving";
  archiveFileState = state;
  for (const listener of listeners) listener(state);
}

function beginWrite() {
  activeWrites += 1;
  setArchiveFileState("saving");
}

function finishWrite() {
  activeWrites = Math.max(0, activeWrites - 1);
  if (activeWrites === 0) setArchiveFileState(pendingSnapshots.size === 0 ? "saved" : "saving");
}

function failRequest() {
  activeWrites = Math.max(0, activeWrites - 1);
  setArchiveFileState("error");
}

async function archiveRequest<T>(path: string, init?: RequestInit, missingIsNull = false): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(15000),
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    setArchiveFileState("browser-only");
    return null;
  }
  if (missingIsNull && response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? t("Archivzugriff fehlgeschlagen ({0}).", response.status));
  }
  return await response.json() as T;
}

async function writeArchiveRequest<T>(path: string, init: RequestInit): Promise<T | null> {
  beginWrite();
  try {
    const result = await archiveRequest<T>(path, init);
    if (result === null) {
      activeWrites = Math.max(0, activeWrites - 1);
      return null;
    }
    finishWrite();
    return result;
  } catch (error) {
    failRequest();
    throw error;
  }
}

export function fileCanvasSaveStatus(lessonId: string) {
  return {archiveRevision:boardRevisions.get(lessonId) ?? null,state:archiveFileState,
    pending:pendingSnapshots.has(lessonId) || canvasSaveQueues.has(lessonId)
      || pendingCanvasFiles.has(lessonId) || canvasFileSaveQueues.has(lessonId)};
}

export const fileCanvasRevision = (lessonId: string) => boardRevisions.get(lessonId);
export function restoreFileCanvasRevision(lessonId: string, revision: string | null) {
  if (!boardRevisions.has(lessonId)) boardRevisions.set(lessonId, revision);
}

export async function flushArchiveWrites() {
  await catalogSaveQueue;
  for (const lessonId of new Set([...pendingSnapshots.keys(), ...canvasSaveQueues.keys(), ...pendingCanvasFiles.keys(), ...canvasFileSaveQueues.keys()])) {
    await flushFileCanvasSnapshot(lessonId);
  }
  if (canvasFailures.size || canvasFileFailures.size || archiveFileState === "error" || archiveFileState === "browser-only") {
    throw new Error("Änderungen sind noch nicht im Archiv gespeichert.");
  }
}

export function reportCanvasSaveFailure(lessonId: string, error: unknown) {
  canvasFailures.set(lessonId, error instanceof Error ? error.message : "Canvas konnte nicht gespeichert werden.");
  setArchiveFileState("error");
}

export function stageFileCanvasFiles(lessonId: string, files: readonly BinaryFileData[]) {
  if (!files.length) return;
  const pending = pendingCanvasFiles.get(lessonId) ?? new Map<FileId, BinaryFileData>();
  for (const file of files) pending.set(file.id, file);
  pendingCanvasFiles.set(lessonId, pending);
}

export function subscribeArchiveFileState(listener: (state: ArchiveFileState) => void) {
  listeners.add(listener);
  listener(archiveFileState);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadFileArchiveCatalog() {
  try {
    const archive = await archiveRequest<ArchiveDocument>("/api/archive");
    if (archive) setArchiveFileState("saved");
    return archive?.catalog ?? null;
  } catch (error) {
    setArchiveFileState("error");
    console.error("Unterrichtsarchiv konnte nicht gelesen werden.", error);
    return null;
  }
}

export async function loadFileArchiveProfile() {
  try {
    const archive = await archiveRequest<ArchiveDocument>("/api/archive");
    if (archive) setArchiveFileState("saved");
    return archive ? { classes: archive.classes ?? [], catalog: archive.catalog } : null;
  } catch (error) {
    setArchiveFileState("error");
    console.error("Unterrichtsarchiv konnte nicht gelesen werden.", error);
    return null;
  }
}

export function saveFileArchiveCatalog(catalog: LocalLessonCatalog) {
  const save = async () => {
    const archive = await writeArchiveRequest<ArchiveDocument>("/api/archive", {
      method: "PUT",
      body: JSON.stringify({ catalog }),
    });
    return archive?.catalog ?? null;
  };
  const result = catalogSaveQueue.then(save, save);
  catalogSaveQueue = result.catch(() => null);
  return result;
}

export async function loadFileCanvasSnapshot(lessonId: string) {
  let response: Response;
  try {
    response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/board`, { signal: AbortSignal.timeout(15000) });
  } catch {
    setArchiveFileState("browser-only");
    return null;
  }
  if (response.status === 404) {
    boardRevisions.set(lessonId, null);
    return null;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? t("Archivzugriff fehlgeschlagen ({0}).", response.status));
  }
  const revision = response.headers.get("ETag");
  if (!revision) throw new Error("Archivzugriff fehlgeschlagen: Canvasrevision fehlt.");
  boardRevisions.set(lessonId, revision);
  return await response.json() as StoredCanvasSnapshot;
}

export async function saveFileCanvasSnapshot(lessonId: string, snapshot: StoredCanvasSnapshot, options: Omit<PendingSnapshot, "snapshot"> = {}) {
  const save = async () => {
    await flushFileCanvasFiles(lessonId);
    const revision = boardRevisions.get(lessonId);
    const result = await writeArchiveRequest<{ saved: true; revision: string }>(
      `/api/archive/lessons/${encodeURIComponent(lessonId)}/board`,
      {
        method: "PUT",
        headers: { ...(revision ? { "If-Match": revision } : { "If-None-Match": "*" }), ...(options.preservePrevious ? { "X-Tafelraum-Recovery": "1" } : {}) },
        body: JSON.stringify(snapshot),
      },
    );
    if (!result) throw new Error("Canvas konnte nicht im lokalen Archiv gespeichert werden.");
    boardRevisions.set(lessonId, result.revision);
    // The archive commit is canonical even when its cache acknowledgement fails.
    await options.confirmed?.(result.revision, revision ?? null).catch(error => console.warn("Canvascache konnte nicht bestätigt werden.", error));
    canvasFailures.delete(lessonId);
    setArchiveFileState("saved");
  };
  const previous = canvasSaveQueues.get(lessonId) ?? Promise.resolve();
  const result = previous.then(save, save);
  const settled = result.then(() => undefined, error => { reportCanvasSaveFailure(lessonId, error); });
  canvasSaveQueues.set(lessonId, settled);
  void settled.finally(() => {
    if (canvasSaveQueues.get(lessonId) === settled) canvasSaveQueues.delete(lessonId);
  });
  return result;
}

export function queueFileCanvasSnapshot(lessonId: string, snapshot: StoredCanvasSnapshot, options: Omit<PendingSnapshot, "snapshot"> = {}) {
  pendingSnapshots.set(lessonId, { snapshot, ...options, preservePrevious: options.preservePrevious || pendingSnapshots.get(lessonId)?.preservePrevious });
  setArchiveFileState("saving");
  const currentTimer = snapshotTimers.get(lessonId);
  if (currentTimer !== undefined) window.clearTimeout(currentTimer);
  snapshotTimers.set(lessonId, window.setTimeout(() => {
    snapshotTimers.delete(lessonId);
    void flushFileCanvasSnapshot(lessonId).catch((error: unknown) => {
      console.error("Canvasstand konnte nicht im Unterrichtsarchiv gespeichert werden.", error);
    });
  }, 800));
}

export async function flushFileCanvasSnapshot(lessonId: string) {
  const currentTimer = snapshotTimers.get(lessonId);
  if (currentTimer !== undefined) window.clearTimeout(currentTimer);
  snapshotTimers.delete(lessonId);
  const pending = pendingSnapshots.get(lessonId);
  if (!pending) {
    await canvasSaveQueues.get(lessonId); await flushFileCanvasFiles(lessonId);
    if (canvasFailures.has(lessonId)) throw new Error(canvasFailures.get(lessonId));
    return;
  }
  pendingSnapshots.delete(lessonId);
  try { await saveFileCanvasSnapshot(lessonId, pending.snapshot, pending); }
  catch (error) {
    if (!pendingSnapshots.has(lessonId)) pendingSnapshots.set(lessonId, pending);
    else if (pending.preservePrevious) pendingSnapshots.get(lessonId)!.preservePrevious = true;
    reportCanvasSaveFailure(lessonId, error); throw error;
  }
}

export async function archiveFileCanvasSnapshot(lessonId: string) {
  await canvasSaveQueues.get(lessonId);
  pendingSnapshots.delete(lessonId);
  const currentTimer = snapshotTimers.get(lessonId);
  if (currentTimer !== undefined) window.clearTimeout(currentTimer);
  snapshotTimers.delete(lessonId);
  const revision = boardRevisions.get(lessonId);
  const result = await writeArchiveRequest(`/api/archive/lessons/${encodeURIComponent(lessonId)}/board`, {
    method: "DELETE",
    headers: revision ? { "If-Match": revision } : undefined,
  });
  if (!result) throw new Error("Canvasstand konnte nicht archiviert werden.");
  boardRevisions.set(lessonId, null);
  canvasFailures.delete(lessonId);
  setArchiveFileState("saved");
}

export async function loadFileCanvasFiles(lessonId: string, fileIds: readonly FileId[]) {
  if (fileIds.length === 0) return {};
  const response = await archiveRequest<{ files: BinaryFileData[] }>(
    `/api/archive/lessons/${encodeURIComponent(lessonId)}/assets`,
    { method: "POST", body: JSON.stringify({ fileIds }) },
  );
  const files: BinaryFiles = {};
  for (const file of response?.files ?? []) files[file.id] = file;
  return files;
}

export async function saveFileCanvasFiles(lessonId: string, files: readonly BinaryFileData[]) {
  if (files.length === 0) return;
  await queueCanvasFileWrite(lessonId, async () => {
    // Retry the original batch separately; merging imports could exceed the API body limit.
    await writePendingCanvasFiles(lessonId);
    // Register this batch in queue order, including relative to an asset reset.
    const pending = pendingCanvasFiles.get(lessonId) ?? new Map<FileId, BinaryFileData>();
    for (const file of files) pending.set(file.id, file);
    pendingCanvasFiles.set(lessonId, pending);
    await writePendingCanvasFiles(lessonId);
  });
}

function queueCanvasFileWrite(lessonId: string, write: () => Promise<void>) {
  const previous = canvasFileSaveQueues.get(lessonId) ?? Promise.resolve();
  const result = previous.then(write, write);
  let succeeded = false;
  const settled = result.then(() => { succeeded = true; }, () => undefined);
  canvasFileSaveQueues.set(lessonId, settled);
  void settled.finally(() => {
    if (canvasFileSaveQueues.get(lessonId) !== settled) return;
    canvasFileSaveQueues.delete(lessonId);
    if (succeeded) setArchiveFileState(canvasSaveQueues.size > 0 ? "saving" : "saved");
  });
  return result;
}

function confirmCanvasFiles(lessonId: string, files: readonly BinaryFileData[]) {
  const pending = pendingCanvasFiles.get(lessonId);
  for (const file of files) {
    // An older acknowledgement must not discard bytes queued during its request.
    if (pending?.get(file.id) === file) pending.delete(file.id);
  }
  if (!pending?.size) {
    pendingCanvasFiles.delete(lessonId);
    canvasFileFailures.delete(lessonId);
  }
}

function flushFileCanvasFiles(lessonId: string) {
  if (!pendingCanvasFiles.has(lessonId) && !canvasFileSaveQueues.has(lessonId)) return Promise.resolve();
  return queueCanvasFileWrite(lessonId, () => writePendingCanvasFiles(lessonId));
}

async function writePendingCanvasFiles(lessonId: string) {
  const files = [...(pendingCanvasFiles.get(lessonId)?.values() ?? [])];
  if (files.length === 0) return;
  let failureState: "browser-only" | "error" = "error";
  try {
    // Recovery may stage a whole lesson, larger than one ordinary import.
    // Bound batches below the server's 128 MiB body limit (also for UTF-8).
    const encoded = files.map(file => ({ file, json: JSON.stringify(file) }));
    for (let index = 0; index < encoded.length;) {
      const batch = [encoded[index++]];
      let characters = batch[0].json.length;
      while (index < encoded.length && characters + encoded[index].json.length < 32 * 1024 * 1024) {
        characters += encoded[index].json.length; batch.push(encoded[index++]);
      }
      const result = await writeArchiveRequest(`/api/archive/lessons/${encodeURIComponent(lessonId)}/assets`, {
        method: "PUT", body: `{"files":[${batch.map(entry => entry.json).join(",")}]}`,
      });
      if (!result) {
        failureState = "browser-only";
        throw new Error("Material konnte nicht im lokalen Archiv gespeichert werden. Bitte erneut versuchen.");
      }
      confirmCanvasFiles(lessonId, batch.map(entry => entry.file));
    }
  } catch (error) {
    canvasFileFailures.set(lessonId, failureState);
    setArchiveFileState(failureState);
    throw error;
  }
}

export async function archiveFileCanvasFiles(lessonId: string) {
  await queueCanvasFileWrite(lessonId, async () => {
    const files = [...(pendingCanvasFiles.get(lessonId)?.values() ?? [])];
    const result = await writeArchiveRequest(`/api/archive/lessons/${encodeURIComponent(lessonId)}/assets`, { method: "DELETE" });
    if (!result) throw new Error("Material konnte nicht im lokalen Archiv entfernt werden.");
    confirmCanvasFiles(lessonId, files);
  });
}


export async function saveFileArchiveClass(id: string, label: string, previousLabel?: string) {
  const result = await archiveRequest<{ classes: ArchiveClassDefinition[] }>(
    previousLabel === undefined ? "/api/archive/classes" : `/api/archive/classes/${encodeURIComponent(id)}`,
    { method: previousLabel === undefined ? "POST" : "PUT", body: JSON.stringify({ id, label, previousLabel }) },
  );
  if (!result) throw new Error("Klasse oder Kurs konnte nicht gespeichert werden. Bitte erneut versuchen.");
  return result.classes;
}
