import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { managedBackupDirectory, pruneArchiveBackups, verifyBackup } from "./prune-archive-backups.mjs";
import { archiveTar } from './archive-tar.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function optionValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} benötigt einen Wert.`);
  return value;
}

function safeLabel(value) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9äöüß_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalized) throw new Error("Das Backup-Label ist leer oder ungültig.");
  return normalized;
}

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

if (process.argv.includes("--help")) {
  console.log("node scripts/create-archive-backup.mjs [--label NAME] [--archive-root PFAD] [--output-dir PFAD]");
  process.exit(0);
}

const archiveRoot = path.resolve(optionValue("--archive-root", path.join(repositoryRoot, "data", "unterrichtsarchiv")));
const outputDirectory = path.resolve(optionValue(
  "--output-dir",
  path.join(path.dirname(archiveRoot), `${path.basename(archiveRoot)}-backups`),
));
const outputRelativeToArchive = path.relative(archiveRoot, outputDirectory);
if (outputRelativeToArchive === "" || (!outputRelativeToArchive.startsWith("..") && !path.isAbsolute(outputRelativeToArchive))) {
  throw new Error("Der Backup-Ordner muss außerhalb des aktiven Unterrichtsarchivs liegen.");
}
const label = safeLabel(optionValue("--label", "manual"));
const archiveDocument = JSON.parse(await readFile(path.join(archiveRoot, "archive.json"), "utf8"));
if (archiveDocument.format !== "tafelraum-unterrichtsarchiv" || archiveDocument.schemaVersion !== 1) {
  throw new Error("Die Quelle ist kein unterstütztes Tafelraum-Unterrichtsarchiv.");
}

await mkdir(outputDirectory, { recursive: true });
const createdAt = new Date().toISOString();
const timestamp = createdAt.replace(/[:.]/g, "-");
const fileName = `${path.basename(archiveRoot)}-${timestamp}-${label}.tar.gz`;
const backupPath = path.join(outputDirectory, fileName);
const temporaryPath = `${backupPath}.tmp-${process.pid}`;

try {
  await run(archiveTar, ["-czf", temporaryPath, "-C", path.dirname(archiveRoot), path.basename(archiveRoot)]);
  await rename(temporaryPath, backupPath);
  const checksum = await sha256(backupPath);
  const backupStat = await stat(backupPath);
  const metadata = {
    format: "tafelraum-unterrichtsarchiv-backup",
    schemaVersion: 1,
    createdAt,
    archiveRoot,
    archiveDirectoryName: path.basename(archiveRoot),
    backupPath,
    bytes: backupStat.size,
    sha256: checksum,
  };
  await writeFile(`${backupPath}.json`, `${JSON.stringify(metadata, null, 2)}\n`, { flag: "wx" });
  // A successful creation now also guarantees a tested restore. Keep stdout JSON-only
  // for migration callers. External backup destinations retain their own policy.
  await verifyBackup(backupPath);
  if (outputDirectory === managedBackupDirectory) {
    await pruneArchiveBackups(outputDirectory, { apply: true });
  }
  console.log(JSON.stringify(metadata, null, 2));
} catch (error) {
  await rm(temporaryPath, { force: true });
  throw error;
}
