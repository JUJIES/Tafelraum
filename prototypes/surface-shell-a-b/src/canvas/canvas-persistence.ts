import type { AppState, BinaryFileData, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { FileId, OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import {
  archiveFileCanvasFiles,
  archiveFileCanvasSnapshot,
  loadFileCanvasFiles,
  loadFileCanvasSnapshot,
  queueFileCanvasSnapshot,
  saveFileCanvasFiles,
  saveFileCanvasSnapshot,
  fileCanvasRevision,
  restoreFileCanvasRevision,
  flushFileCanvasSnapshot,
  reportCanvasSaveFailure,
  stageFileCanvasFiles,
} from "../archive-file-persistence";

import type { PresentationClip } from "./clip-frames";
import type { StoredInteractiveHtmlStates } from "./interactive-html-persistence";
import { referencedImageFileIds } from "./scan-enhancement";
import { withoutTemporaryEraserState } from "./eraser-policy";

export type StoredCanvasSnapshot = {
  clips?: PresentationClip[];
  interactiveHtmlStates?: StoredInteractiveHtmlStates;
  schemaVersion: 1;
  elements: readonly OrderedExcalidrawElement[];
  viewport: Pick<AppState, "scrollX" | "scrollY" | "zoom">;
};

const databaseName = "tafelraum-surface-lab";
const databaseVersion = 3;
const snapshotStore = "canvas-snapshots";
const legacyAssetStore = "canvas-assets";
const assetStore = "canvas-asset-records";
const assetLessonIndex = "lessonId";

type StoredCanvasAsset = {
  lessonId: string;
  fileId: FileId;
  file: BinaryFileData;
};

let databasePromise: Promise<IDBDatabase> | null = null;
type LocalSnapshotRecord = {
  snapshot: StoredCanvasSnapshot;
  sequence: string;
  pending: boolean;
  baseRevision?: string | null;
};
export type CanvasRecoveryChoice = "draft" | "archive";
export type ResolveCanvasRecovery = () => Promise<CanvasRecoveryChoice>;
const recoveryWrites = new Set<string>();
function readRecord(value: StoredCanvasSnapshot | LocalSnapshotRecord | undefined): LocalSnapshotRecord | null {
  if (!value) return null;
  // Older caches did not record acknowledgements. A differing legacy value
  // could be an unsent draft, so it must receive the same explicit recovery.
  return "snapshot" in value ? value : { snapshot: value, pending: true, sequence: "legacy" };
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains(snapshotStore)) {
        request.result.createObjectStore(snapshotStore);
      }
      if (!request.result.objectStoreNames.contains(legacyAssetStore)) {
        request.result.createObjectStore(legacyAssetStore);
      }
      if (!request.result.objectStoreNames.contains(assetStore)) {
        const store = request.result.createObjectStore(assetStore, { keyPath: ["lessonId", "fileId"] });
        store.createIndex(assetLessonIndex, "lessonId");
      }
    });
    request.addEventListener("success", () => {
      request.result.addEventListener("versionchange", () => {
        request.result.close();
        databasePromise = null;
      });
      resolve(request.result);
    }, { once: true });
    request.addEventListener("error", () => {
      databasePromise = null;
      reject(request.error);
    }, { once: true });
  });

  return databasePromise.catch(error => { databasePromise = null; throw error; });
}

async function loadLocalCanvasSnapshot(lessonId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(snapshotStore, "readonly");
  const snapshot = await requestResult(transaction.objectStore(snapshotStore).get(lessonId));
  return readRecord(snapshot)?.snapshot ?? null;
}

async function updateLocalSnapshot(lessonId: string, update: (current: LocalSnapshotRecord | null) => LocalSnapshotRecord | null) {
  const database = await openDatabase();
  const transaction = database.transaction(snapshotStore, "readwrite");
  const done = transactionDone(transaction);
  const store = transaction.objectStore(snapshotStore);
  const request = store.get(lessonId);
  let record: LocalSnapshotRecord | null = null;
  request.addEventListener("success", () => {
    record = update(readRecord(request.result));
    if (record) store.put(record, lessonId);
  }, { once: true });
  await done;
  return record;
}

async function localRecord(lessonId: string) {
  const database = await openDatabase();
  return readRecord(await requestResult(database.transaction(snapshotStore).objectStore(snapshotStore).get(lessonId)));
}

export async function loadCanvasSnapshot(lessonId: string, resolveConflict?: ResolveCanvasRecovery) {
  const local = await localRecord(lessonId).catch(() => null);
  const fileSnapshot = await loadFileCanvasSnapshot(lessonId);
  const revision = fileCanvasRevision(lessonId);
  if (local?.pending) {
    // A lost acknowledgement is not a conflict. Compare only during recovery.
    const alreadySaved = fileSnapshot && JSON.stringify(fileSnapshot) === JSON.stringify(local.snapshot);
    if (!alreadySaved) {
      const conflict = revision !== undefined && revision !== local.baseRevision;
      if (conflict && !resolveConflict) throw new Error("Ein ungespeicherter Entwurf und eine andere Archivfassung liegen vor. Bitte die Stunde öffnen und eine Fassung auswählen.");
      const choice = conflict ? await resolveConflict!() : "draft";
      if (choice === "draft") {
        if (revision === undefined && local.baseRevision !== undefined) restoreFileCanvasRevision(lessonId, local.baseRevision);
        if (conflict) recoveryWrites.add(lessonId);
        // Stage cached image bytes before any recovered board can be committed.
        const ids = [...new Set(local.snapshot.elements.flatMap(referencedImageFileIds))];
        const files = await loadLocalCanvasFiles(lessonId, ids).catch(() => ({}));
        stageFileCanvasFiles(lessonId, Object.values(files));
        return local.snapshot;
      }
      if (!fileSnapshot) {
        const db = await openDatabase();
        const transaction = db.transaction(snapshotStore, "readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore(snapshotStore).delete(lessonId);
        await done;
        return null;
      }
    }
  }
  if (fileSnapshot) {
    await updateLocalSnapshot(lessonId, () => ({ snapshot: fileSnapshot, baseRevision: revision, pending: false, sequence: crypto.randomUUID() })).catch(error => console.warn("Archiv geladen; Canvascache nicht verfügbar.", error));
    return fileSnapshot;
  }
  // An authoritative reset is different from an unreachable archive. A
  // confirmed cache must not resurrect a board which the archive removed.
  if (revision === null) return null;
  return local?.snapshot ?? null;
}

export async function saveCanvasSnapshot(lessonId: string, snapshot: StoredCanvasSnapshot) {
  snapshot = {...snapshot,elements:withoutTemporaryEraserState(snapshot.elements)};
  const sequence = crypto.randomUUID();
  let cached = true;
  try {
    await updateLocalSnapshot(lessonId, current => ({ snapshot, sequence, pending: true,
      baseRevision: recoveryWrites.has(lessonId) ? fileCanvasRevision(lessonId)
        : current?.pending ? current.baseRevision : fileCanvasRevision(lessonId) }));
  } catch { cached = false; }
  queueFileCanvasSnapshot(lessonId, snapshot, {
    preservePrevious: recoveryWrites.has(lessonId),
    confirmed: async (revision, previous) => {
      recoveryWrites.delete(lessonId);
      await updateLocalSnapshot(lessonId, current => {
        if (!current) return null;
        if (current.sequence === sequence) return { ...current, pending: false, baseRevision: revision };
        return (current.baseRevision ?? null) === previous ? { ...current, baseRevision: revision } : current;
      });
    },
  });
  // No durable browser fallback: wait for the actual canonical commit.
  if (!cached) {
    try { await flushFileCanvasSnapshot(lessonId); }
    catch (error) { reportCanvasSaveFailure(lessonId, error); throw error; }
  }
}

// Reload recovery is allowed only after the current scene has a durable draft.
// Do not queue another stale archive write or acknowledge the failed commit.
export async function cacheCanvasRecoveryDraft(lessonId: string, snapshot: StoredCanvasSnapshot) {
  await updateLocalSnapshot(lessonId, current => ({
    snapshot: { ...snapshot, elements: withoutTemporaryEraserState(snapshot.elements) },
    sequence: crypto.randomUUID(), pending: true,
    baseRevision: current?.pending ? current.baseRevision : fileCanvasRevision(lessonId),
  }));
}

export async function clearCanvasSnapshot(lessonId: string) {
  await archiveFileCanvasSnapshot(lessonId);
  recoveryWrites.delete(lessonId);
  try {
    const database = await openDatabase();
    const transaction = database.transaction(snapshotStore, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(snapshotStore).delete(lessonId);
    await done;
  } catch (error) { console.warn("Archivstand entfernt; Canvascache nicht verfügbar.", error); }
}

async function loadLocalCanvasFiles(lessonId: string, fileIds: readonly FileId[]) {
  if (fileIds.length === 0) return {};
  const database = await openDatabase();
  const transaction = database.transaction([legacyAssetStore, assetStore], "readwrite");
  const legacyStore = transaction.objectStore(legacyAssetStore);
  const recordStore = transaction.objectStore(assetStore);
  const requestedIds = new Set<FileId>(fileIds);
  const legacyFiles = (await requestResult(legacyStore.get(lessonId)) as BinaryFiles | undefined) ?? null;

  if (legacyFiles) {
    for (const file of Object.values(legacyFiles)) {
      recordStore.put({ lessonId, fileId: file.id, file } satisfies StoredCanvasAsset);
    }
    legacyStore.delete(lessonId);
  }

  const records = await Promise.all(fileIds.map((fileId) => (
    requestResult(recordStore.get([lessonId, fileId])) as Promise<StoredCanvasAsset | undefined>
  )));
  await transactionDone(transaction);

  const files: BinaryFiles = {};
  for (const record of records) {
    if (record) files[record.fileId] = record.file;
  }
  if (legacyFiles) {
    for (const file of Object.values(legacyFiles)) {
      if (requestedIds.has(file.id) && !files[file.id]) files[file.id] = file;
    }
  }
  return files;
}

async function saveLocalCanvasFiles(lessonId: string, files: readonly BinaryFileData[]) {
  if (files.length === 0) return;
  const database = await openDatabase();
  const transaction = database.transaction(assetStore, "readwrite");
  const store = transaction.objectStore(assetStore);
  for (const file of files) {
    store.put({ lessonId, fileId: file.id, file } satisfies StoredCanvasAsset);
  }
  await transactionDone(transaction);
}

export async function loadCanvasFiles(lessonId: string, fileIds: readonly FileId[]) {
  const localFiles = await loadLocalCanvasFiles(lessonId, fileIds).catch(() => ({} as BinaryFiles));
  const missingFileIds = fileIds.filter((fileId) => !localFiles[fileId]);
  if (missingFileIds.length === 0) return localFiles;
  const fileArchiveFiles = await loadFileCanvasFiles(lessonId, missingFileIds);
  const loadedFiles = Object.values(fileArchiveFiles);
  if (loadedFiles.length > 0) await saveLocalCanvasFiles(lessonId, loadedFiles).catch(error => console.warn("Archivmaterial geladen; Cache nicht verfügbar.", error));
  return { ...localFiles, ...fileArchiveFiles };
}

export async function saveCanvasFiles(lessonId: string, files: readonly BinaryFileData[]) {
  await saveLocalCanvasFiles(lessonId, files).catch(error => console.warn("Materialcache nicht verfügbar; direkt im Archiv speichern.", error));
  await saveFileCanvasFiles(lessonId, files);
}

export async function clearCanvasFiles(lessonId: string) {
  await archiveFileCanvasFiles(lessonId);
  try {
    const database = await openDatabase();
    const transaction = database.transaction([legacyAssetStore, assetStore], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(legacyAssetStore).delete(lessonId);
    const request = transaction.objectStore(assetStore).index(assetLessonIndex).openCursor(IDBKeyRange.only(lessonId));
    request.addEventListener("success", () => {
      const cursor = request.result;
      if (!cursor) return;
      cursor.delete(); cursor.continue();
    });
    await done;
  } catch (error) { console.warn("Archivmaterial entfernt; Canvascache nicht verfügbar.", error); }
}

async function localSnapshotLessonIds() {
  const database = await openDatabase();
  const transaction = database.transaction(snapshotStore, "readonly");
  const keys = await requestResult(transaction.objectStore(snapshotStore).getAllKeys());
  return keys.filter((key): key is string => typeof key === "string");
}

export async function syncLocalCanvasStateToFileArchive() {
  const lessonIds = await localSnapshotLessonIds();
  let savedSnapshots = 0;
  let savedAssets = 0;
  for (const lessonId of lessonIds) {
    const snapshot = await loadLocalCanvasSnapshot(lessonId);
    if (!snapshot) continue;
    const fileIds = [...new Set(snapshot.elements.flatMap(referencedImageFileIds))];
    const files = await loadLocalCanvasFiles(lessonId, fileIds);
    const assetFiles = Object.values(files);
    if (assetFiles.length > 0) {
      await saveFileCanvasFiles(lessonId, assetFiles);
      savedAssets += assetFiles.length;
    }
    await saveFileCanvasSnapshot(lessonId, snapshot);
    savedSnapshots += 1;
  }
  return { savedSnapshots, savedAssets };
}

export async function copyCanvasLessonState(sourceLessonId: string, targetLessonId: string) {
  const snapshot = await loadCanvasSnapshot(sourceLessonId);
  if (!snapshot) return;

  const fileIds = [...new Set(snapshot.elements.flatMap(referencedImageFileIds))];
  const files = await loadCanvasFiles(sourceLessonId, fileIds);
  await saveCanvasFiles(targetLessonId, Object.values(files));
  await saveCanvasSnapshot(targetLessonId, snapshot);
}
