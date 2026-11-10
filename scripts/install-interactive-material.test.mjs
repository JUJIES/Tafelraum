import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readInteractiveMaterialPackage } from "../prototypes/surface-shell-a-b/interactive-material.mjs";
import { checkInteractiveMaterial } from "./check-interactive-material.mjs";
import { installInteractiveMaterial } from "./install-interactive-material.mjs";

async function writePackage(root, body = "<h1>Hallo</h1>") {
  const packageRoot = path.join(root, "motoren-quiz");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(path.join(packageRoot, "manifest.json"), JSON.stringify({
    format: "tafelraum-interactive-html",
    schemaVersion: 1,
    id: "motoren-quiz",
    title: "Motoren-Quiz",
    entry: "index.html",
    defaultViewport: { width: 900, height: 600 },
  }));
  await writeFile(path.join(packageRoot, "index.html"), body);
  return packageRoot;
}

async function writeArchive(root) {
  const materialPath = "faecher/physik/reihen/motoren/stunden/stunde-1/material";
  await mkdir(path.join(root, materialPath), { recursive: true });
  await writeFile(path.join(root, "archive.json"), JSON.stringify({
    catalog: {
      lessons: [{
        id: "stunde-1",
        materialBasis: { scope: "lesson", archivePath: materialPath },
      }],
    },
  }));
}

test("installiert ein validiertes HTML-Paket additiv und erkennt bytegleiche Wiederholung", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-interactive-install-"));
  try {
    const archiveRoot = path.join(root, "archive");
    await writeArchive(archiveRoot);
    const sourceDirectory = await writePackage(path.join(root, "source"));
    const first = await installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory });
    const second = await installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory });
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(await readFile(path.join(first.targetDirectory, "index.html"), "utf8"), "<h1>Hallo</h1>");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("überschreibt ein vorhandenes Paket mit abweichendem Inhalt nicht", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-interactive-conflict-"));
  try {
    const archiveRoot = path.join(root, "archive");
    await writeArchive(archiveRoot);
    const sourceDirectory = await writePackage(path.join(root, "source"));
    const installed = await installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory });
    await writeFile(path.join(sourceDirectory, "index.html"), "<h1>Geändert</h1>");
    await assert.rejects(
      installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory }),
      /anderem Inhalt/,
    );
    assert.equal(await readFile(path.join(installed.targetDirectory, "index.html"), "utf8"), "<h1>Hallo</h1>");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("lehnt Skriptpakete ohne Room-Zustandsvertrag vor der Archivübernahme ab", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-interactive-state-contract-"));
  try {
    const archiveRoot = path.join(root, "archive");
    await writeArchive(archiveRoot);
    const sourceDirectory = await writePackage(path.join(root, "source"),
      '<button id="next">Weiter</button><script src="app.js"></script>');
    await writeFile(path.join(sourceDirectory, "app.js"),
      'document.getElementById("next").onclick = () => { window.round = 2; };');
    assert.equal((await readInteractiveMaterialPackage(sourceDirectory, "motoren-quiz")).id, "motoren-quiz");
    await assert.rejects(checkInteractiveMaterial({ sourceDirectory }), /getState und applyState/);
    await assert.rejects(installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory }), /getState und applyState/);
    await writeFile(path.join(sourceDirectory, "app.js"),
      'let round = 1; window.tafelraumLive = { getState: () => ({ round }), applyState(value) { round = value.round; } };');
    await checkInteractiveMaterial({ sourceDirectory });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("lässt skriptfreie Formularpakete und nicht ausführbare JSON-Daten zu", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-interactive-form-contract-"));
  try {
    const sourceDirectory = await writePackage(root,
      '<input name="antwort"><script type="application/json">{"hinweis":"statisch"}</script>');
    await checkInteractiveMaterial({ sourceDirectory });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("blockiert ein Arbeitsblatt ohne Druckfähigkeit in Prüfung und Installation vor Archivmutation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-required-print-"));
  try {
    const archiveRoot = path.join(root, "archive");
    await writeArchive(archiveRoot);
    const sourceDirectory = await writePackage(path.join(root, "source"), '<textarea id="answer"></textarea>');
    await assert.rejects(checkInteractiveMaterial({ sourceDirectory, requirePrint: true }), /A4-Druckvorlage/);
    await assert.rejects(installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory, requirePrint: true }), /A4-Druckvorlage/);
    await assert.rejects(readdir(path.join(archiveRoot, "faecher/physik/reihen/motoren/stunden/stunde-1/material/interaktiv")), { code: "ENOENT" });
    for (const [script, args] of [
      ["check-interactive-material.mjs", []],
      ["install-interactive-material.mjs", ["--lesson-id", "stunde-1", "--archive-root", archiveRoot]],
    ]) {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), "--require-print", "--source-dir", sourceDirectory, ...args], { encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /A4-Druckvorlage/);
    }
    // The runtime and an intentionally digital tool still accept a base package.
    assert.equal((await checkInteractiveMaterial({ sourceDirectory })).print, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("akzeptiert ein druckbares Arbeitsblatt und verweigert einen fehlenden Druck-Einstiegspunkt", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-print-template-"));
  try {
    const archiveRoot = path.join(root, "archive");
    await writeArchive(archiveRoot);
    const sourceDirectory = await writePackage(path.join(root, "source"));
    const manifestPath = path.join(sourceDirectory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.print = { entry: "print.html", page: "A4", orientation: "portrait", mode: "template" };
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(checkInteractiveMaterial({ sourceDirectory, requirePrint: true }), { code: "ENOENT" });
    await assert.rejects(installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory, requirePrint: true }), { code: "ENOENT" });
    await writeFile(path.join(sourceDirectory, "print.html"), "<h1>Leere Druckvorlage</h1>");
    // Existing legacy packages stay readable, but cannot pass the new worksheet intake.
    assert.equal((await readInteractiveMaterialPackage(sourceDirectory, "motoren-quiz")).print.entry, "print.html");
    await assert.rejects(checkInteractiveMaterial({ sourceDirectory, requirePrint: true }), /gemeinsame A4-Seiten/);
    await assert.rejects(installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory, requirePrint: true }), /gemeinsame A4-Seiten/);
    await assert.rejects(readdir(path.join(archiveRoot, "faecher/physik/reihen/motoren/stunden/stunde-1/material/interaktiv")), { code: "ENOENT" });
    manifest.print = { entry: "index.html", page: "A4", orientation: "portrait", mode: "template", layout: "shared-pages" };
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(checkInteractiveMaterial({ sourceDirectory, requirePrint: true }), /data-tafelraum-page/);
    await writeFile(path.join(sourceDirectory, "index.html"), '<main data-tafelraum-page="1"><h1>Leere Druckvorlage</h1></main>');
    assert.equal((await checkInteractiveMaterial({ sourceDirectory, requirePrint: true })).print.layout, "shared-pages");
    const result = await installInteractiveMaterial({ archiveRoot, lessonId: "stunde-1", sourceDirectory, requirePrint: true });
    assert.equal(result.created, true);
    assert.equal(await readFile(path.join(result.targetDirectory, "print.html"), "utf8"), "<h1>Leere Druckvorlage</h1>");
    const cli = spawnSync(process.execPath, [fileURLToPath(new URL("check-interactive-material.mjs", import.meta.url)), "--source-dir", sourceDirectory, "--require-print"], { encoding: "utf8" });
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(JSON.parse(cli.stdout).print.page, "A4");
    const installCli = spawnSync(process.execPath, [fileURLToPath(new URL("install-interactive-material.mjs", import.meta.url)), "--source-dir", sourceDirectory, "--lesson-id", "stunde-1", "--archive-root", archiveRoot, "--require-print"], { encoding: "utf8" });
    assert.equal(installCli.status, 0, installCli.stderr);
    assert.equal(JSON.parse(installCli.stdout).created, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
