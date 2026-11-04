import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { archiveTar } from './archive-tar.mjs';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ist fehlgeschlagen (${signal ?? code}).`));
    });
  });
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", () => resolve(hash.digest("hex")));
  });
}

const backupArgument = process.argv[2];
if (!backupArgument || backupArgument === "--help") {
  console.log("node scripts/verify-archive-backup.mjs /absoluter/pfad/unterrichtsarchiv-….tar.gz");
  process.exit(backupArgument === "--help" ? 0 : 1);
}

const backupPath = path.resolve(backupArgument);
const metadata = JSON.parse(await readFile(`${backupPath}.json`, "utf8"));
if (metadata.format !== "tafelraum-unterrichtsarchiv-backup" || metadata.schemaVersion !== 1) {
  throw new Error("Unbekanntes Backup-Metadatenformat.");
}
const backupStat = await stat(backupPath);
if (backupStat.size !== metadata.bytes) throw new Error("Backupgröße stimmt nicht mit den Metadaten überein.");
const checksum = await sha256(backupPath);
if (checksum !== metadata.sha256) throw new Error("SHA-256-Prüfsumme des Backups stimmt nicht.");

const restoreRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-backup-verify-"));
try {
  await run(archiveTar, ["-xzf", backupPath, "-C", restoreRoot]);
  const extractedArchiveRoot = path.join(restoreRoot, metadata.archiveDirectoryName);
  const archiveDocument = JSON.parse(await readFile(path.join(extractedArchiveRoot, "archive.json"), "utf8"));
  if (archiveDocument.format !== "tafelraum-unterrichtsarchiv" || archiveDocument.schemaVersion !== 1) {
    throw new Error("Extrahiertes Archiv besitzt kein unterstütztes Archivformat.");
  }
  const entries = await readdir(extractedArchiveRoot, { recursive: true });
  const boardCount = entries.filter((entry) => entry.endsWith(path.join("board", "scene.json"))).length;
  console.log(JSON.stringify({
    verified: true,
    backupPath,
    bytes: backupStat.size,
    sha256: checksum,
    lessons: archiveDocument.catalog?.lessons?.length ?? 0,
    currentBoards: boardCount,
  }, null, 2));
} finally {
  await rm(restoreRoot, { recursive: true, force: true });
}
