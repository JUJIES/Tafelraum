import { execFile } from "node:child_process";
import { lstat, mkdir, readFile, readdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const managedBackupDirectory = path.resolve(scriptDirectory, "../data/unterrichtsarchiv-backups");
export const backupsPerSource = 5;

export async function verifyBackup(backupPath) {
  await run(process.execPath, [path.join(scriptDirectory, "verify-archive-backup.mjs"), backupPath]);
}

// Only known archive/metadata pairs participate. Unknown files are never removed.
export async function pruneArchiveBackups(directory, { apply = false } = {}) {
  directory = await realpath(directory);
  const lock = path.join(directory, ".retention-lock");
  if (apply) await mkdir(lock);
  try {
    const groups = new Map();
    const ignored = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.name.endsWith(".tar.gz.json")) continue;
      const metadataPath = path.join(directory, entry.name);
      if (!entry.isFile()) throw new Error(`Keine regulären Backup-Metadaten: ${metadataPath}`);
      const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      if (metadata.format !== "tafelraum-unterrichtsarchiv-backup" || metadata.schemaVersion !== 1) {
        ignored.push(entry.name);
        continue;
      }
      const { archiveRoot, archiveDirectoryName, createdAt, bytes, sha256 } = metadata;
      if (typeof archiveRoot !== "string" || !path.isAbsolute(archiveRoot)
        || typeof archiveDirectoryName !== "string" || !archiveDirectoryName
        || archiveDirectoryName !== path.basename(archiveRoot)
        || !Number.isFinite(Date.parse(createdAt)) || !Number.isSafeInteger(bytes) || bytes <= 0
        || !/^[a-f0-9]{64}$/.test(sha256)
        || !entry.name.startsWith(`${archiveDirectoryName}-`)) {
        throw new Error(`Ungültige Backup-Metadaten: ${metadataPath}`);
      }
      const backupPath = metadataPath.slice(0, -5);
      const info = await lstat(backupPath);
      if (!info.isFile() || info.size !== bytes) throw new Error(`Ungültige Backupdatei: ${backupPath}`);
      const source = path.resolve(archiveRoot);
      if (!groups.has(source)) groups.set(source, []);
      groups.get(source).push({ backupPath, metadataPath, createdAt, bytes });
    }
    const kept = [];
    const removed = [];
    for (const backups of groups.values()) {
      backups.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.backupPath.localeCompare(a.backupPath));
      kept.push(...backups.slice(0, backupsPerSource));
      removed.push(...backups.slice(backupsPerSource));
    }
    if (apply && removed.length) {
      // Finish every restore check before deleting even the first old backup.
      for (const backup of kept) {
        console.error(`Prüfe verbleibendes Backup: ${path.basename(backup.backupPath)}`);
        await verifyBackup(backup.backupPath);
      }
      for (const backup of removed) {
        await rm(backup.backupPath);
        await rm(backup.metadataPath);
      }
    }
    return { applied: apply, backupsPerSource, kept: kept.map((b) => b.backupPath),
      removed: removed.map((b) => b.backupPath), bytes: removed.reduce((sum, b) => sum + b.bytes, 0), ignored };
  } finally {
    if (apply) await rm(lock, { recursive: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("node scripts/prune-archive-backups.mjs [--output-dir PFAD] [--apply] (sonst nur Vorschau; 5 je Quelle)");
  } else {
    const index = process.argv.indexOf("--output-dir");
    const directory = index === -1 ? managedBackupDirectory : process.argv[index + 1];
    if (!directory || directory.startsWith("--")) throw new Error("--output-dir benötigt einen Pfad.");
    console.log(JSON.stringify(await pruneArchiveBackups(directory, { apply: process.argv.includes("--apply") }), null, 2));
  }
}
