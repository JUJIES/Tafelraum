import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { pruneArchiveBackups } from "./prune-archive-backups.mjs";

const run = promisify(execFile);
const scripts = path.dirname(fileURLToPath(import.meta.url));

async function fixture(t, count = 6, sources = 1) {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum retention test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = path.join(root, "backups");
  const backups = [];
  for (let source = 0; source < sources; source += 1) {
    const archive = path.join(root, `archive-${source}`);
    await mkdir(archive);
    await writeFile(path.join(archive, "archive.json"), JSON.stringify({ format: "tafelraum-unterrichtsarchiv", schemaVersion: 1 }));
    await writeFile(path.join(archive, "lesson.txt"), "Unterricht erhalten");
    const group = [];
    for (let i = 0; i < count; i += 1) {
      const { stdout } = await run(process.execPath, [path.join(scripts, "create-archive-backup.mjs"),
        "--archive-root", archive, "--output-dir", output, "--label", `test-${i}`]);
      const metadata = JSON.parse(stdout);
      metadata.createdAt = new Date(Date.UTC(2026, 0, i + 1)).toISOString();
      await writeFile(`${metadata.backupPath}.json`, JSON.stringify(metadata));
      group.push(metadata.backupPath);
    }
    backups.push(group);
  }
  return { root, output, backups };
}

test("dry run preserves all files; apply retains five restored backups per source and leaves unknown files", async (t) => {
  const { root, output, backups } = await fixture(t, 6, 2);
  await writeFile(path.join(output, "unknown.tar.gz"), "unmanaged");
  const before = await readdir(output);
  const plan = await pruneArchiveBackups(output);
  assert.equal(plan.kept.length, 10);
  assert.equal(plan.removed.length, 2);
  assert.deepEqual(await readdir(output), before);
  const result = await pruneArchiveBackups(output, { apply: true });
  assert.equal(result.removed.length, 2);
  for (const group of backups) {
    await assert.rejects(readFile(group[0]), { code: "ENOENT" });
    for (const retained of group.slice(1)) assert.ok((await readFile(retained)).length);
  }
  assert.equal(await readFile(path.join(output, "unknown.tar.gz"), "utf8"), "unmanaged");
  assert.equal(await readFile(path.join(root, "archive-0/lesson.txt"), "utf8"), "Unterricht erhalten");
  assert.equal((await pruneArchiveBackups(output, { apply: true })).removed.length, 0);
});

test("corruption in a retained backup prevents every deletion and releases the lock", async (t) => {
  const { output, backups } = await fixture(t);
  const newest = backups[0].at(-1);
  const bytes = await readFile(newest);
  bytes[15] ^= 1;
  await writeFile(newest, bytes);
  await assert.rejects(pruneArchiveBackups(output, { apply: true }));
  assert.ok((await readFile(backups[0][0])).length);
  assert.equal((await readdir(output)).includes(".retention-lock"), false);
});

test("metadata path traversal and symlinked backups are refused before deletion", async (t) => {
  const { output, backups } = await fixture(t);
  const newest = backups[0].at(-1);
  const metadataPath = `${newest}.json`;
  const original = JSON.parse(await readFile(metadataPath, "utf8"));
  await writeFile(metadataPath, JSON.stringify({ ...original, archiveDirectoryName: "../archive-0" }));
  await assert.rejects(pruneArchiveBackups(output, { apply: true }), /Ungültige Backup-Metadaten/);
  await writeFile(metadataPath, JSON.stringify(original));
  await rm(newest);
  await symlink(backups[0][0], newest);
  await assert.rejects(pruneArchiveBackups(output, { apply: true }), /Ungültige Backupdatei/);
  assert.ok((await readFile(backups[0][0])).length);
});

test("an existing retention lock prevents concurrent deletion", async (t) => {
  const { output, backups } = await fixture(t, 1);
  await mkdir(path.join(output, ".retention-lock"));
  await assert.rejects(pruneArchiveBackups(output, { apply: true }), { code: "EEXIST" });
  assert.ok((await readFile(backups[0][0])).length);
});
