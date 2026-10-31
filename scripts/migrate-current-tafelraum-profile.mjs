import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectArchive } from "./archive-doctor.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSourceArchive = path.join(repositoryRoot, "data", "unterrichtsarchiv");
const defaultSourceNotes = path.join(repositoryRoot, "local-data", "personal-notes");
const defaultDataRoot = path.join(os.homedir(), "Library", "Application Support", "app.jujies.tafelraum");
const defaultRuntimeStateRoots = [
  path.join(os.homedir(), "Library", "WebKit", "app.jujies.tafelraum"),
  path.join(os.homedir(), "Library", "Caches", "app.jujies.tafelraum"),
];

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: options.stdio ?? "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} ist fehlgeschlagen (${signal ?? code}).`)));
  });
}

async function exists(filePath) {
  try { await stat(filePath); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

export async function freshInstallation(archiveRoot) {
  try {
    const document = JSON.parse(await readFile(path.join(archiveRoot, "archive.json"), "utf8"));
    if (document?.migrationState?.source !== "fresh-desktop-installation") return false;
    const counts = [
      document.classes?.length,
      document.catalog?.subjects?.length,
      document.catalog?.series?.length,
      document.catalog?.lessons?.length,
    ];
    const legacyEmptyProfile = counts.every((count) => count === 0);
    const neutralStarterProfile = counts.every((count) => count === 1)
      && document.classes[0]?.id === "class-start"
      && document.catalog.lessons[0]?.id === "lesson-start";
    return legacyEmptyProfile || neutralStarterProfile;
  } catch { return false; }
}

async function createAndVerifyProductionBackup() {
  const backupOutput = [];
  await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(repositoryRoot, "scripts", "create-archive-backup.mjs"), "--label", "vor-desktop-uebernahme"], { stdio: ["ignore", "pipe", "inherit"] });
  child.stdout.on("data", (chunk) => backupOutput.push(chunk));
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("Die Sicherung vor der Übernahme ist fehlgeschlagen.")));
  });
  const backup = JSON.parse(Buffer.concat(backupOutput).toString("utf8"));
  await run(process.execPath, [path.join(repositoryRoot, "scripts", "verify-archive-backup.mjs"), backup.backupPath]);
  return backup.backupPath;
}

export async function moveRuntimeStateAside(runtimeStateRoots, suffix) {
  const moved = [];
  for (const runtimeStateRoot of runtimeStateRoots) {
    if (!(await exists(runtimeStateRoot))) continue;
    const destination = `${runtimeStateRoot}.vor-desktop-uebernahme-${suffix}`;
    await rename(runtimeStateRoot, destination);
    moved.push({ source: runtimeStateRoot, destination });
  }
  return moved;
}

export async function migrateProfile({
  sourceArchive = defaultSourceArchive,
  sourceNotes = defaultSourceNotes,
  dataRoot = defaultDataRoot,
  runtimeStateRoots = defaultRuntimeStateRoots,
  createAndVerifyBackup = createAndVerifyProductionBackup,
} = {}) {
  const targetArchive = path.join(dataRoot, "unterrichtsarchiv");
  const targetNotes = path.join(dataRoot, "personal-notes");
  if (await exists(targetArchive) && !(await freshInstallation(targetArchive))) {
    throw new Error(`Im Ziel liegt bereits ein benutztes Unterrichtsarchiv. Es wird nicht überschrieben: ${targetArchive}`);
  }
  if (await exists(targetNotes)) {
    const targetDocument = JSON.parse(await readFile(path.join(targetNotes, "notes.json"), "utf8").catch(() => "null"));
    if (targetDocument?.notes?.length) throw new Error(`Im Ziel liegen bereits persönliche Notizen. Sie werden nicht überschrieben: ${targetNotes}`);
  }

  const sourceReport = await inspectArchive(sourceArchive);
  if (sourceReport.summary.errors) throw new Error(`Das bestehende Archiv hat ${sourceReport.summary.errors} Fehler und wird nicht übernommen.`);
  const backupPath = await createAndVerifyBackup();

  await mkdir(dataRoot, { recursive: true });
  const suffix = new Date().toISOString().replace(/[:.]/g, "-");
  const temporaryArchive = path.join(dataRoot, `.unterrichtsarchiv-import-${suffix}`);
  await rm(temporaryArchive, { recursive: true, force: true });
  await cp(sourceArchive, temporaryArchive, { recursive: true, preserveTimestamps: true, errorOnExist: true });
  const targetReport = await inspectArchive(temporaryArchive);
  if (targetReport.summary.errors) {
    await rm(temporaryArchive, { recursive: true, force: true });
    throw new Error(`Die kopierte Fassung hat ${targetReport.summary.errors} Fehler und wurde nicht aktiviert.`);
  }

  // The fixed desktop origin deliberately preserves cache/outbox data across
  // normal app updates. During the one-time profile migration that old state
  // belongs to the neutral starter profile and must not be replayed into the
  // imported archive. Keep it as a reversible sibling instead of deleting it.
  const movedRuntimeState = await moveRuntimeStateAside(runtimeStateRoots, suffix);
  if (await exists(targetArchive)) await rename(targetArchive, path.join(dataRoot, `.leeres-archiv-${suffix}`));
  await rename(temporaryArchive, targetArchive);
  if (await exists(sourceNotes)) {
    if (await exists(targetNotes)) await rename(targetNotes, path.join(dataRoot, `.leere-notizen-${suffix}`));
    await cp(sourceNotes, targetNotes, { recursive: true, preserveTimestamps: true, errorOnExist: true });
  }

  return {
    activatedArchive: targetArchive,
    copiedNotes: await exists(targetNotes),
    backup: backupPath,
    movedRuntimeState,
    sourceSummary: sourceReport.summary,
    targetSummary: targetReport.summary,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await migrateProfile();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
