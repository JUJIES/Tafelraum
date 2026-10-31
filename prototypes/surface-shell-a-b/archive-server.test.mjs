import { Script } from "node:vm";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pruneRemovedMaterials } from "./material-removal.mjs";
import { createArchiveMiddleware } from "./archive-server.mjs";

function emptyCatalog() {
  return {
    version: 1,
    subjects: [],
    series: [],
    lessons: [],
    hiddenLessonIds: [],
    trash: [],
    subjectOrderByClassId: {},
    seriesOrderBySubjectId: {},
    lessonOrderBySeriesId: {},
  };
}

async function directoryEntries(directoryPath) {
  try {
    return await readdir(directoryPath);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

test("catalog saves keep unchanged entity documents and histories stable", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-catalog-noop-test-"));
  const archive = {
    format: "tafelraum-unterrichtsarchiv",
    schemaVersion: 1,
    createdAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    classes: [{ id: "class-test", label: "Test" }],
    catalog: emptyCatalog(),
  };
  await writeFile(path.join(archiveRoot, "archive.json"), `${JSON.stringify(archive, null, 2)}\n`);
  const middleware = createArchiveMiddleware(archiveRoot);
  const server = http.createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404;
      response.end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const catalog = emptyCatalog();
  catalog.subjects.push({ id: "subject-test", classId: "class-test", label: "Englisch" });
  catalog.series.push({
    id: "series-test",
    classId: "class-test",
    subjectId: "subject-test",
    label: "Travel",
  });
  catalog.lessons.push({
    id: "lesson-test",
    classId: "class-test",
    subjectId: "subject-test",
    seriesId: "series-test",
    title: "Transport",
    metadata: { scheduledFor: null },
    seed: { prompt: "", showTransportImage: false },
  });

  try {
    const firstResponse = await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    });
    assert.equal(firstResponse.status, 200);
    const firstArchive = await firstResponse.json();
    const subjectPath = path.join(archiveRoot, "faecher", "subject-test", "subject.json");
    const seriesPath = path.join(archiveRoot, "faecher", "subject-test", "reihen", "series-test", "series.json");
    const lessonRoot = path.join(
      archiveRoot,
      "faecher",
      "subject-test",
      "reihen",
      "series-test",
      "stunden",
      "lesson-test",
    );
    const lessonPath = path.join(lessonRoot, "lesson.json");
    const firstDocuments = await Promise.all([
      readFile(path.join(archiveRoot, "archive.json"), "utf8"),
      readFile(subjectPath, "utf8"),
      readFile(seriesPath, "utf8"),
      readFile(lessonPath, "utf8"),
    ]);

    const repeatedResponse = await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog: firstArchive.catalog }),
    });
    assert.equal(repeatedResponse.status, 200);
    assert.equal((await repeatedResponse.json()).updatedAt, firstArchive.updatedAt);
    assert.deepEqual(await Promise.all([
      readFile(path.join(archiveRoot, "archive.json"), "utf8"),
      readFile(subjectPath, "utf8"),
      readFile(seriesPath, "utf8"),
      readFile(lessonPath, "utf8"),
    ]), firstDocuments);
    assert.equal((await directoryEntries(path.join(archiveRoot, "_history", "archive"))).length, 1);
    assert.deepEqual(await directoryEntries(path.join(lessonRoot, ".history")), []);

    const changedCatalog = structuredClone(firstArchive.catalog);
    changedCatalog.lessons[0].title = "Transport und Mobilität";
    const changedResponse = await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog: changedCatalog }),
    });
    assert.equal(changedResponse.status, 200);
    assert.equal(await readFile(subjectPath, "utf8"), firstDocuments[1]);
    assert.equal(await readFile(seriesPath, "utf8"), firstDocuments[2]);
    assert.notEqual(await readFile(lessonPath, "utf8"), firstDocuments[3]);
    assert.equal((await directoryEntries(path.join(lessonRoot, ".history"))).length, 1);
    assert.equal((await directoryEntries(path.join(archiveRoot, "_history", "archive"))).length, 2);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(archiveRoot, { recursive: true, force: true });
  }
});

test("persists catalog, canvas and assets additively and archives a reset", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-archive-test-"));
  const archive = {
    format: "tafelraum-unterrichtsarchiv",
    schemaVersion: 1,
    createdAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    classes: [{ id: "class-test", label: "Test" }],
    catalog: emptyCatalog(),
  };
  await mkdir(archiveRoot, { recursive: true });
  await writeFile(path.join(archiveRoot, "archive.json"), `${JSON.stringify(archive, null, 2)}\n`);
  const middleware = createArchiveMiddleware(archiveRoot);
  const server = http.createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404;
      response.end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const catalog = emptyCatalog();
    catalog.subjects.push({ id: "subject-test", classId: "class-test", label: "Englisch" });
    catalog.series.push({
      id: "series-test",
      classId: "class-test",
      subjectId: "subject-test",
      label: "Travel",
      materialBasis: {
        archiveSeriesId: "series-test",
        archivePath: "faecher/subject-test/reihen/series-test",
        sourceMirrorPath: "Englisch/Travel",
        sourceMapPath: "_migration/current-source-map.json",
      },
    });
    catalog.lessons.push({
      id: "lesson-test",
      classId: "class-test",
      subjectId: "subject-test",
      seriesId: "series-test",
      title: "Transport",
      metadata: { scheduledFor: "2026-08-31" },
      seed: { prompt: "", showTransportImage: false },
    });
    const catalogResponse = await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    });
    assert.equal(catalogResponse.status, 200);
    const savedCatalog = await catalogResponse.json();
    const savedLesson = savedCatalog.catalog.lessons.find((lesson) => lesson.id === "lesson-test");
    assert.equal(savedLesson.materialBasis.scope, "lesson");
    assert.equal(
      savedLesson.materialBasis.archivePath,
      "faecher/subject-test/reihen/series-test/stunden/lesson-test/material",
    );

    catalog.lessons[0].materialBasis = {
      archiveSeriesId: "series-test",
      archivePath: "faecher/subject-test/reihen/series-test",
      sourceMirrorPath: "Englisch/Travel",
      sourceMapPath: "_migration/current-source-map.json",
    };
    const staleBrowserResponse = await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    });
    const afterStaleBrowserSave = await staleBrowserResponse.json();
    assert.equal(
      afterStaleBrowserSave.catalog.lessons.find((lesson) => lesson.id === "lesson-test").materialBasis.archivePath,
      "faecher/subject-test/reihen/series-test/stunden/lesson-test/material",
    );
    delete catalog.lessons[0].materialBasis;

    const generatedLessonResponse = await fetch(`${origin}/api/archive/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classSelector: "Test",
        subjectSelector: "Englisch",
        seriesSelector: "Travel",
        title: "Offene Planung",
        sourceReferences: [{ path: "Englisch/Travel/reihenspiegel.md", evidence: "planned" }],
      }),
    });
    assert.equal(generatedLessonResponse.status, 201);
    const generatedLesson = await generatedLessonResponse.json();
    assert.equal(generatedLesson.created, true);
    assert.equal(generatedLesson.lesson.metadata.scheduledFor, null);
    assert.equal(generatedLesson.lesson.materialBasis.archiveSeriesId, "series-test");
    assert.equal(
      generatedLesson.lesson.materialBasis.archivePath,
      `faecher/subject-test/reihen/series-test/stunden/${generatedLesson.lesson.id}/material`,
    );
    assert.deepEqual(generatedLesson.lesson.sourceReferences, [
      { path: "Englisch/Travel/reihenspiegel.md", evidence: "planned" },
    ]);

    const repeatedLessonResponse = await fetch(`${origin}/api/archive/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classSelector: "class-test",
        subjectSelector: "subject-test",
        seriesSelector: "series-test",
        title: "Offene Planung",
      }),
    });
    assert.equal(repeatedLessonResponse.status, 200);
    assert.equal((await repeatedLessonResponse.json()).created, false);

    catalog.trash.push({
      kind: "lesson",
      id: "lesson-test",
      label: "Transport",
      classId: "class-test",
      subjectId: "subject-test",
      seriesId: "series-test",
      deletedAt: "2026-08-30T12:01:00.000Z",
    });
    await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    });
    catalog.trash = [];
    const restoredCatalog = await (await fetch(`${origin}/api/archive`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog }),
    })).json();
    assert.equal(restoredCatalog.catalog.trash.length, 0);

    const seriesRoot = path.join(archiveRoot, "faecher", "subject-test", "reihen", "series-test");
    const materialRoot = path.join(seriesRoot, "stunden", "lesson-test", "material");
    await mkdir(path.join(materialRoot, "arbeitsblaetter", "output"), { recursive: true });
    await mkdir(path.join(seriesRoot, "stunden", "lesson-test", "assets"), { recursive: true });
    await writeFile(path.join(seriesRoot, "Shared.png"), Buffer.from("legacy series image"));
    await writeFile(path.join(materialRoot, "arbeitsblaetter", "output", "Starter.png"), Buffer.from("source image"));
    await writeFile(path.join(materialRoot, "arbeitsblaetter", "Handout.pdf"), Buffer.from("source pdf"));
    await writeFile(path.join(materialRoot, "arbeitsblaetter", "Podcast.mp3"), Buffer.from("source audio"));
    await writeFile(path.join(materialRoot, "Film.mp4"), Buffer.from("source video"));
    await writeFile(path.join(materialRoot, "arbeitsblaetter", "Notizen.md"), "not listed");
    const interactiveRoot = path.join(materialRoot, "interaktiv", "motoren-quiz");
    await mkdir(path.join(interactiveRoot, "assets"), { recursive: true });
    await writeFile(path.join(interactiveRoot, "manifest.json"), `${JSON.stringify({
      format: "tafelraum-interactive-html",
      schemaVersion: 1,
      id: "motoren-quiz",
      title: "Motoren-Quiz",
      entry: "index.html",
      live: { state: "v1" },
      print: { entry: "index.html", page: "A4", orientation: "portrait", mode: "template" },
      defaultViewport: { width: 1200, height: 760 },
    }, null, 2)}\n`);
    await writeFile(path.join(interactiveRoot, "index.html"), "<!doctype html><html><body><button>Motor starten</button></body></html>");
    await writeFile(path.join(interactiveRoot, "assets", "motor.png"), Buffer.from("motor image"));
    await writeFile(path.join(interactiveRoot, "assets", "film.mp4"), Buffer.from("0123456789"));
    const invalidInteractiveRoot = path.join(materialRoot, "interaktiv", "ungueltig");
    await mkdir(invalidInteractiveRoot, { recursive: true });
    await writeFile(path.join(invalidInteractiveRoot, "manifest.json"), JSON.stringify({
      format: "tafelraum-interactive-html",
      schemaVersion: 1,
      id: "andere-id",
      title: "Ungültig",
      entry: "index.html",
    }));
    await writeFile(path.join(invalidInteractiveRoot, "index.html"), "<!doctype html><title>Ungültig</title>");
    await writeFile(path.join(seriesRoot, "stunden", "lesson-test", "assets", "canvas.png"), Buffer.from("canvas asset"));

    const materialsResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials`);
    assert.equal(materialsResponse.status, 200);
    const materials = await materialsResponse.json();
    assert.equal(materials.basis.archiveSeriesId, "series-test");
    assert.equal(materials.basis.scope, "lesson");
    assert.equal(materials.basis.label, "Transport");
    assert.deepEqual(materials.materials.map((material) => material.path), [
      "arbeitsblaetter/Handout.pdf",
      "arbeitsblaetter/output/Starter.png",
      "arbeitsblaetter/Podcast.mp3",
      "Film.mp4",
      "interaktiv/motoren-quiz",
    ]);
    assert.equal(materials.materials.find((material) => material.name === "Podcast.mp3").kind, "audio");
    assert.equal(materials.materials.find((material) => material.name === "Podcast.mp3").mimeType, "audio/mpeg");
    assert.equal(materials.materials.find((material) => material.name === "Film.mp4").kind, "video");
    assert.equal(materials.materials.find((material) => material.name === "Film.mp4").mimeType, "video/mp4");
    const interactiveMaterial = materials.materials.find((material) => material.kind === "interactive");
    assert.ok(interactiveMaterial);
    assert.deepEqual(interactiveMaterial, {
      path: "interaktiv/motoren-quiz",
      name: "Motoren-Quiz",
      folder: "interaktiv",
      kind: "interactive",
      mimeType: "text/html",
      size: interactiveMaterial.size,
      modifiedAt: interactiveMaterial.modifiedAt,
      id: "motoren-quiz",
      entry: "index.html",
      print: { entry: "index.html", page: "A4", orientation: "portrait", mode: "template" },
      defaultViewport: { width: 1200, height: 760 },
    });
    const interactiveEntryResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/interactive/motoren-quiz/index.html`,
    );
    assert.equal(interactiveEntryResponse.status, 200);
    assert.equal(interactiveEntryResponse.headers.get("content-type"), "text/html; charset=utf-8");
    assert.match(interactiveEntryResponse.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(interactiveEntryResponse.headers.get("content-security-policy"), /connect-src 'none'/);
    assert.equal(interactiveEntryResponse.headers.get("referrer-policy"), "no-referrer");
    const interactiveHtml = await interactiveEntryResponse.text();
    assert.match(interactiveHtml, /Motor starten/);
    assert.ok(interactiveHtml.indexOf("data-tafelraum-scrollbars") < interactiveHtml.indexOf("<body>"));
    assert.match(interactiveHtml, /data-tafelraum-scrollbars>@media screen/);
    assert.equal(await readFile(path.join(interactiveRoot, "index.html"), "utf8"), "<!doctype html><html><body><button>Motor starten</button></body></html>");
    for (const script of interactiveHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script[1]);
    assert.match(interactiveHtml, /tafelraum:interactive-zoom/);
    assert.match(interactiveHtml, /tafelraum:interactive-wheel-pan/);
    assert.match(interactiveHtml, /tafelraum:interactive-scroll/);
    assert.match(interactiveHtml, /postRootScroll/);
    assert.match(interactiveHtml, /canScrollToward/);
    assert.doesNotMatch(interactiveHtml, /tafelraum:interactive-print/);
    assert.match(interactiveHtml, /tafelraum:interactive-pan-mode/);
    assert.match(interactiveHtml, /data-tafelraum-interactive/);
    assert.match(interactiveHtml, /tafelraum:interactive-state/);
    assert.match(interactiveHtml, /contenteditable/);
    assert.match(interactiveHtml, /HTMLInputElement/);
    assert.match(interactiveHtml, /event.source!==window.parent/);
    const interactivePackageResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/interactive/motoren-quiz`,
    );
    assert.equal(interactivePackageResponse.status, 200);
    const interactivePackage = await interactivePackageResponse.json();
    assert.deepEqual(interactivePackage.live, { state: "v1" });
    assert.deepEqual(interactivePackage.print, { entry: "index.html", page: "A4", orientation: "portrait", mode: "template" });
    assert.deepEqual(interactivePackage.files.map((file) => file.path), ["assets/film.mp4", "assets/motor.png", "index.html", "manifest.json"]);
    const filmUrl = `${origin}/api/archive/lessons/lesson-test/materials/interactive/motoren-quiz/assets/film.mp4`;
    for (const [range, expected, contentRange] of [["bytes=2-5", "2345", "bytes 2-5/10"], ["bytes=-3", "789", "bytes 7-9/10"], ["bytes=7-", "789", "bytes 7-9/10"]]) {
      const part = await fetch(filmUrl, {headers: {Range: range}});
      assert.equal(part.status, 206);
      assert.equal(part.headers.get("content-type"), "video/mp4");
      assert.equal(part.headers.get("content-range"), contentRange);
      assert.equal(part.headers.get("accept-ranges"), "bytes");
      assert.match(part.headers.get("content-security-policy"), /connect-src 'none'/);
      assert.equal(await part.text(), expected);
    }
    const invalidRange = await fetch(filmUrl, {headers: {Range: "bytes=12-"}});
    assert.equal(invalidRange.status, 416);
    assert.equal(invalidRange.headers.get("content-range"), "bytes */10");
    assert.equal(await (await fetch(filmUrl)).text(), "0123456789");
    const interactiveAssetResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/interactive/motoren-quiz/assets/motor.png`,
    );
    assert.equal(interactiveAssetResponse.status, 200);
    assert.equal(interactiveAssetResponse.headers.get("content-type"), "image/png");
    assert.equal(Buffer.from(await interactiveAssetResponse.arrayBuffer()).toString(), "motor image");
    assert.equal((await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/interactive/motoren-quiz/${encodeURIComponent("assets/../index.html")}`,
    )).status, 404);
    const materialFileResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("arbeitsblaetter/output/Starter.png")}`,
    );
    assert.equal(materialFileResponse.status, 200);
    assert.equal(materialFileResponse.headers.get("content-type"), "image/png");
    assert.equal(materialFileResponse.headers.get("accept-ranges"), "bytes");
    assert.equal(Buffer.from(await materialFileResponse.arrayBuffer()).toString(), "source image");
    const rangedAudioResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("arbeitsblaetter/Podcast.mp3")}`,
      { headers: { Range: "bytes=7-11" } },
    );
    assert.equal(rangedAudioResponse.status, 206);
    assert.equal(rangedAudioResponse.headers.get("accept-ranges"), "bytes");
    assert.equal(rangedAudioResponse.headers.get("content-range"), "bytes 7-11/12");
    assert.equal(Buffer.from(await rangedAudioResponse.arrayBuffer()).toString(), "audio");
    const unsatisfiedRangeResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("arbeitsblaetter/Podcast.mp3")}`,
      { headers: { Range: "bytes=99-" } },
    );
    assert.equal(unsatisfiedRangeResponse.status, 416);
    assert.equal(unsatisfiedRangeResponse.headers.get("content-range"), "bytes */12");
    const rangedVideoResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("Film.mp4")}`,
      { headers: { Range: "bytes=7-11" } },
    );
    assert.equal(rangedVideoResponse.status, 206);
    assert.equal(rangedVideoResponse.headers.get("content-type"), "video/mp4");
    assert.equal(rangedVideoResponse.headers.get("content-range"), "bytes 7-11/12");
    assert.equal(Buffer.from(await rangedVideoResponse.arrayBuffer()).toString(), "video");
    const uploadResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?name=${encodeURIComponent("Hörtext.mp3")}`,
      { method: "PUT", headers: { "Content-Type": "audio/mpeg" }, body: Buffer.from("new audio") },
    );
    assert.equal(uploadResponse.status, 201);
    const uploaded = await uploadResponse.json();
    assert.equal(uploaded.material.kind, "audio");
    assert.equal(uploaded.material.mimeType, "audio/mpeg");
    assert.equal(
      uploaded.archiveMaterialPath,
      "faecher/subject-test/reihen/series-test/stunden/lesson-test/material/Hörtext.mp3",
    );
    assert.equal(Buffer.from(await (await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("Hörtext.mp3")}`,
    )).arrayBuffer()).toString(), "new audio");
    assert.equal((await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?name=${encodeURIComponent("Hörtext.mp3")}`,
      { method: "PUT", headers: { "Content-Type": "audio/mpeg" }, body: Buffer.from("new audio") },
    )).status, 200);
    const conflictUpload = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?name=${encodeURIComponent("Hörtext.mp3")}`,
      { method: "PUT", headers: { "Content-Type": "audio/mpeg" }, body: Buffer.from("different audio") },
    );
    assert.equal(conflictUpload.status, 201);
    assert.equal((await conflictUpload.json()).material.name, "Hörtext – Kopie.mp3");
    const videoUploadResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?name=${encodeURIComponent("Unterrichtsfilm.mp4")}`,
      { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: Buffer.from("new video") },
    );
    assert.equal(videoUploadResponse.status, 201);
    const uploadedVideo = await videoUploadResponse.json();
    assert.equal(uploadedVideo.material.kind, "video");
    assert.equal(uploadedVideo.material.mimeType, "video/mp4");
    const imageUploadResponse = await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?name=${encodeURIComponent("Tafelbild.png")}`,
      { method: "PUT", headers: { "Content-Type": "image/png" }, body: Buffer.from("new image") },
    );
    assert.equal(imageUploadResponse.status, 201);
    const uploadedImage = await imageUploadResponse.json();
    assert.equal(uploadedImage.material.kind, "image");
    assert.equal(
      uploadedImage.archiveMaterialPath,
      "faecher/subject-test/reihen/series-test/stunden/lesson-test/material/Tafelbild.png",
    );
    assert.equal((await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("../archive.json")}`,
    )).status, 404);
    assert.equal((await fetch(
      `${origin}/api/archive/lessons/lesson-test/materials/file?path=${encodeURIComponent("stunden/lesson-test/assets/canvas.png")}`,
    )).status, 404);

    const linkResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://youtu.be/M7lc1UVf-VE?t=12" }),
    });
    assert.equal(linkResponse.status, 201);
    const savedLink = await linkResponse.json();
    assert.equal(savedLink.created, true);
    assert.equal(savedLink.material.kind, "link");
    assert.equal(savedLink.material.provider, "youtube");
    assert.equal(savedLink.material.videoId, "M7lc1UVf-VE");
    assert.equal(savedLink.material.url, "https://www.youtube.com/watch?v=M7lc1UVf-VE");
    assert.match(savedLink.archiveMaterialPath, /\/material\/@links\//);

    const repeatedLinkResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=M7lc1UVf-VE&feature=share" }),
    });
    assert.equal(repeatedLinkResponse.status, 200);
    const repeatedLink = await repeatedLinkResponse.json();
    assert.equal(repeatedLink.created, false);
    assert.equal(repeatedLink.material.path, savedLink.material.path);

    const linkMaterials = await (await fetch(`${origin}/api/archive/lessons/lesson-test/materials`)).json();
    assert.equal(linkMaterials.materials.find((material) => material.path === savedLink.material.path).kind, "link");
    const linkDocument = JSON.parse(await readFile(path.join(materialRoot, "links.json"), "utf8"));
    assert.equal(linkDocument.schemaVersion, 1);
    assert.equal(linkDocument.links.length, 1);
    assert.equal(linkDocument.links[0].videoId, "M7lc1UVf-VE");

    const webLinkResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://vimeo.com/123456" }),
    });
    assert.equal(webLinkResponse.status, 201);
    const savedWebLink = await webLinkResponse.json();
    assert.equal(savedWebLink.material.provider, "web");
    assert.equal(savedWebLink.material.url, "https://vimeo.com/123456");
    assert.equal(savedWebLink.material.videoId, undefined);

    const repeatedWebLinkResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://vimeo.com/123456" }),
    });
    assert.equal(repeatedWebLinkResponse.status, 200);
    assert.equal((await repeatedWebLinkResponse.json()).material.path, savedWebLink.material.path);

    const invalidLinkResponse = await fetch(`${origin}/api/archive/lessons/lesson-test/materials/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "javascript:alert(1)" }),
    });
    assert.equal(invalidLinkResponse.status, 422);
    assert.match((await invalidLinkResponse.json()).error, /http/);

    const updatedLinkDocument = JSON.parse(await readFile(path.join(materialRoot, "links.json"), "utf8"));
    assert.equal(updatedLinkDocument.links.length, 2);

    const snapshot = { schemaVersion: 1, elements: [], viewport: { scrollX: 0, scrollY: 0, zoom: { value: 1 } } };
    const firstBoardSave = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-None-Match": "*" },
      body: JSON.stringify(snapshot),
    });
    assert.equal(firstBoardSave.status, 200);
    const firstRevision = (await firstBoardSave.json()).revision;
    assert.match(firstRevision, /^"sha256-[a-f0-9]{64}"$/);
    const firstBoardLoad = await fetch(`${origin}/api/archive/lessons/lesson-test/board`);
    assert.equal(firstBoardLoad.headers.get("ETag"), firstRevision);
    assert.deepEqual(await firstBoardLoad.json(), snapshot);

    const updatedSnapshot = { ...snapshot, elements: [{ id: "newer-element", type: "text" }] };
    const secondBoardSave = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-Match": firstRevision },
      body: JSON.stringify(updatedSnapshot),
    });
    assert.equal(secondBoardSave.status, 200);
    const secondRevision = (await secondBoardSave.json()).revision;
    assert.notEqual(secondRevision, firstRevision);

    const staleBoardSave = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-Match": firstRevision },
      body: JSON.stringify(snapshot),
    });
    assert.equal(staleBoardSave.status, 409);
    assert.equal((await staleBoardSave.json()).code, "board_revision_conflict");
    assert.deepEqual(await (await fetch(`${origin}/api/archive/lessons/lesson-test/board`)).json(), updatedSnapshot);

    const unguardedBoardSave = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    assert.equal(unguardedBoardSave.status, 428);
    assert.equal((await unguardedBoardSave.json()).code, "board_revision_required");

    const concurrentSnapshots = ["first-tab", "second-tab"].map((id) => ({
      ...snapshot,
      elements: [{ id, type: "text" }],
    }));
    const concurrentBoardSaves = await Promise.all(concurrentSnapshots.map((candidate) => fetch(
      `${origin}/api/archive/lessons/lesson-test/board`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": secondRevision },
        body: JSON.stringify(candidate),
      },
    )));
    assert.deepEqual(concurrentBoardSaves.map((response) => response.status).sort(), [200, 409]);
    const winningResponse = concurrentBoardSaves.find((response) => response.status === 200);
    assert.ok(winningResponse);
    let currentRevision = (await winningResponse.json()).revision;
    const storedConcurrentSnapshot = await (await fetch(`${origin}/api/archive/lessons/lesson-test/board`)).json();
    assert.ok(concurrentSnapshots.some((candidate) => candidate.elements[0].id === storedConcurrentSnapshot.elements[0].id));

    // An explicitly recovered draft must retain the competing archive version,
    // even while ordinary autosave history is still within its throttle window.
    const recovery = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "PUT", headers: {"Content-Type":"application/json", "If-Match":currentRevision, "X-Tafelraum-Recovery":"1"},
      body: JSON.stringify(snapshot),
    });
    assert.equal(recovery.status, 200);
    currentRevision = (await recovery.json()).revision;
    const historyRoot = path.join(archiveRoot, "faecher", "subject-test", "reihen", "series-test", "stunden", "lesson-test", ".history", "board");
    const versions = await Promise.all((await readdir(historyRoot)).map(name => readFile(path.join(historyRoot, name), "utf8")));
    assert.ok(versions.some(value => JSON.stringify(JSON.parse(value)) === JSON.stringify(storedConcurrentSnapshot)));
    const staleRecovery = await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method:"PUT",headers:{"Content-Type":"application/json","If-Match":secondRevision,"X-Tafelraum-Recovery":"1"},body:JSON.stringify(updatedSnapshot),
    });
    assert.equal(staleRecovery.status,409,'recovery never bypasses revision guards');

    const file = {
      id: "asset-test",
      mimeType: "image/png",
      dataURL: `data:image/png;base64,${Buffer.from("test image").toString("base64")}`,
      created: 123,
      lastRetrieved: 456,
    };
    assert.equal((await fetch(`${origin}/api/archive/lessons/lesson-test/assets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [file] }),
    })).status, 200);
    const loadedAssets = await (await fetch(`${origin}/api/archive/lessons/lesson-test/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: ["asset-test"] }),
    })).json();
    assert.equal(loadedAssets.files[0].dataURL, file.dataURL);
    assert.equal(loadedAssets.files[0].lastRetrieved, file.lastRetrieved);

    assert.equal((await fetch(`${origin}/api/archive/lessons/lesson-test/board`, {
      method: "DELETE",
      headers: { "If-Match": currentRevision },
    })).status, 200);
    assert.equal((await fetch(`${origin}/api/archive/lessons/lesson-test/board`)).status, 404);
    const lessonRoot = path.join(archiveRoot, "faecher", "subject-test", "reihen", "series-test", "stunden", "lesson-test");
    assert.ok((await readdir(path.join(lessonRoot, ".history", "board"))).some((name) => name.startsWith("scene-reset-")));
    assert.equal(JSON.parse(await readFile(path.join(lessonRoot, "lesson.json"), "utf8")).title, "Transport");
    const generatedLessonRoot = path.join(
      archiveRoot,
      "faecher",
      "subject-test",
      "reihen",
      "series-test",
      "stunden",
      generatedLesson.lesson.id,
    );
    assert.equal(
      JSON.parse(await readFile(path.join(generatedLessonRoot, "lesson.json"), "utf8")).metadata.scheduledFor,
      null,
    );
    assert.deepEqual(await readdir(path.join(generatedLessonRoot, "material")), []);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(archiveRoot, { recursive: true, force: true });
  }
});

test("class creation and rename preserve catalog, concurrent classes and stale catalog saves", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-classes-test-"));
  const catalog = emptyCatalog();
  const classes = [{ id: "class-dinos", label: "Dinos" }, { id: "class-9-10", label: "9/10 B-Kurs" }];
  await writeFile(path.join(archiveRoot, "archive.json"), JSON.stringify({
    format: "tafelraum-unterrichtsarchiv", schemaVersion: 1, classes, catalog,
  }));
  const middleware = createArchiveMiddleware(archiveRoot);
  const server = http.createServer((req, res) => void middleware(req, res, () => res.end()));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method, body) => fetch(origin + "/api/archive" + route, {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  try {
    const responses = await Promise.all([
      request("/classes", "POST", { id: "class-seminar", label: "GLT-Seminar" }),
      request("/classes", "POST", { id: "class-other", label: "Förderkurs" }),
    ]);
    for (const response of responses) assert.equal(response.status, 200);
    assert.equal((await request("/classes", "POST", { id: "class-seminar", label: "GLT-Seminar" })).status, 200);
    assert.equal((await request("/classes", "POST", { id: "class-duplicate", label: " dinos " })).status, 409);
    assert.equal((await request("/classes", "POST", { id: "class-empty", label: " " })).status, 400);
    assert.equal((await request("/classes/class-seminar", "PUT", { label: "Seminar", previousLabel: "veraltet" })).status, 409);
    assert.equal((await request("/classes/class-seminar", "PUT", { label: "Seminar", previousLabel: "GLT-Seminar" })).status, 200);
    assert.equal((await request("/classes/class-missing", "PUT", { label: "Neu", previousLabel: "Alt" })).status, 404);
    assert.equal((await request("", "PUT", { catalog, classes })).status, 200);
    const final = JSON.parse(await readFile(path.join(archiveRoot, "archive.json"), "utf8"));
    assert.deepEqual(final.catalog, catalog);
    assert.deepEqual(final.classes.slice(0, 2), classes);
    assert.equal(final.classes.length, 4);
    assert.equal(final.classes.find((entry) => entry.id === "class-seminar").label, "Seminar");
    assert.ok((await readdir(path.join(archiveRoot, "_history", "archive"))).length >= 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(archiveRoot, { recursive: true, force: true });
  }
});

test("archive material removal cleans all referencing boards and blocks stale resurrection", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-material-remove-"));
  const catalog = emptyCatalog();
  catalog.subjects = [{id: "subject-test", classId: "class-test", label: "Test"}];
  catalog.series = [{id: "series-test", classId: "class-test", subjectId: "subject-test", label: "Test"}];
  catalog.lessons = ["lesson-test", "lesson-copy"].map(id => ({id, classId: "class-test", subjectId: "subject-test", seriesId: "series-test", title: id,
    metadata: {scheduledFor: null}, seed: {prompt: "", showTransportImage: false}}));
  await writeFile(path.join(archiveRoot, "archive.json"), JSON.stringify({format: "tafelraum-unterrichtsarchiv", schemaVersion: 1,
    classes: [{id: "class-test", label: "Test"}], catalog}));
  const middleware = createArchiveMiddleware(archiveRoot);
  const server = http.createServer((req, res) => void middleware(req, res, () => {res.statusCode = 404; res.end();}));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}/api/archive`;
  const sourcePath = "faecher/subject-test/reihen/series-test/stunden/lesson-test/material/Audio.mp3";
  const root = path.join(archiveRoot, path.posix.dirname(sourcePath));
  await mkdir(root, {recursive: true});
  await writeFile(path.join(root, "Audio.mp3"), "source bytes");
  await writeFile(path.join(root, "Keep.png"), "other source");
  const snapshot = {schemaVersion: 1, elements: [
    {id: "audio", type: "rectangle", groupIds: [], customData: {materialKind: "audio", archiveMaterialPath: sourcePath}},
    {id: "annotation", type: "freedraw", groupIds: ["tafelraum-image-annotations:audio"]},
    {id: "cover", type: "rectangle", customData: {imageId: "audio"}, groupIds: []},
    {id: "unrelated", type: "text", groupIds: [], customData: {}},
  ], clips: [{id: "material-clip", number: 1, kind: "material", elementId: "audio"},
    {id: "area", number: 2, x: 0, y: 0, width: 100, height: 100}], interactiveHtmlStates: {audio: {state: 1}},
    viewport: {scrollX: 0, scrollY: 0, zoom: {value: 1}}};
  const remove = materialPath => fetch(`${origin}/lessons/lesson-test/materials`, {method: "DELETE",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify({path: materialPath})});
  try {
    for (const id of ["lesson-test", "lesson-copy"]) {
      const response = await fetch(`${origin}/lessons/${id}/board`, {method: "PUT", headers: {"Content-Type": "application/json", "If-None-Match": "*"}, body: JSON.stringify(snapshot)});
      assert.equal(response.status, 200);
    }
    assert.equal((await remove("../archive.json")).status, 404);
    assert.equal((await remove("Audio.mp3")).status, 200);
    assert.deepEqual((await (await fetch(`${origin}/lessons/lesson-test/materials`)).json()).materials.map(item => item.path), ["Keep.png"]);
    assert.equal((await fetch(`${origin}/lessons/lesson-test/materials/file?path=Audio.mp3`)).status, 404);
    for (const id of ["lesson-test", "lesson-copy"]) {
      const response = await fetch(`${origin}/lessons/${id}/board`);
      const board = await response.json();
      assert.deepEqual(board.elements.map(item => item.id), ["unrelated"]);
      assert.deepEqual(board.clips.map(item => item.id), ["area"]);
      assert.deepEqual(board.interactiveHtmlStates, {});
      const stale = await fetch(`${origin}/lessons/${id}/board`, {method: "PUT", headers: {"Content-Type": "application/json", "If-Match": response.headers.get("ETag")}, body: JSON.stringify(snapshot)});
      assert.equal(stale.status, 200);
      assert.deepEqual((await (await fetch(`${origin}/lessons/${id}/board`)).json()).elements.map(item => item.id), ["unrelated"]);
    }
    const histories = await readdir(path.join(root, ".history", "removed-materials"));
    assert.equal(histories.length, 1);
    assert.equal(await readFile(path.join(root, ".history", "removed-materials", histories[0], "Audio.mp3"), "utf8"), "source bytes");
    const upload = await fetch(`${origin}/lessons/lesson-test/materials/file?name=Audio.mp3`, {method: "PUT", body: "new source"});
    assert.equal(upload.status, 201);
    assert.equal((await (await fetch(`${origin}/material-removals`)).json()).removals.length, 0);
    const link = await (await fetch(`${origin}/lessons/lesson-test/materials/links`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: "https://example.com"})})).json();
    assert.equal((await remove(link.material.path)).status, 200);
    assert.ok(!(await (await fetch(`${origin}/lessons/lesson-test/materials`)).json()).materials.some(item => item.path === link.material.path));
    await mkdir(path.join(root, "interaktiv", "test"), {recursive: true});
    await writeFile(path.join(root, "interaktiv", "test", "manifest.json"), JSON.stringify({format: "tafelraum-interactive-html", schemaVersion: 1, id: "test", title: "Test", entry: "index.html", defaultViewport: {width: 800, height: 600}}));
    await writeFile(path.join(root, "interaktiv", "test", "index.html"), "<!doctype html><title>Test</title>");
    assert.equal((await remove("interaktiv/test")).status, 200);
    assert.equal((await fetch(`${origin}/lessons/lesson-test/materials/interactive/test/index.html`)).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(archiveRoot, {recursive: true, force: true});
  }
});


test("removal preserves unrelated groups and scopes remembered IDs to their lesson", () => {
  const record = {archiveMaterialPath: "material/a.png", lessonId: "lesson-a", fileName: "a.png",
    elementIdsByLesson: {"lesson-a": ["owner", "ink"]}};
  const original = {elements: [
    {id: "owner", type: "image", groupIds: ["user-group"], customData: {archiveMaterialPath: "material/a.png"}},
    {id: "ink", type: "text", groupIds: ["tafelraum-image-annotations:owner"]},
    {id: "rendition", type: "image", customData: {role: "rich-text-rendition-v1", richTextSourceId: "ink"}},
    {id: "independent", type: "rectangle", groupIds: ["user-group"]},
  ], clips: [{kind: "material", elementId: "owner"}, {number: 2}], interactiveHtmlStates: {owner: {x: 1}, independent: {x: 2}}};
  const cleaned = pruneRemovedMaterials(original, [record], "lesson-a");
  assert.deepEqual(cleaned.elements.map(element => element.id), ["independent"]);
  assert.deepEqual(cleaned.clips, [{number: 2}]);
  assert.deepEqual(cleaned.interactiveHtmlStates, {independent: {x: 2}});
  // A clip-only undo must not reclaim the removed slot.
  assert.deepEqual(pruneRemovedMaterials({...cleaned, clips: original.clips}, [record], "lesson-a").clips, [{number: 2}]);
  const other = {elements: [{id: "owner", type: "image", customData: {archiveMaterialPath: "material/b.png"}}]};
  assert.equal(pruneRemovedMaterials(other, [record], "lesson-b"), other);
});

test("material display names persist by source path for every kind without changing sources, order or boards", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-material-names-"));
  const catalog = emptyCatalog();
  catalog.subjects.push({id: "subject-test", classId: "class-test", label: "Test"});
  catalog.series.push({id: "series-test", classId: "class-test", subjectId: "subject-test", label: "Test"});
  catalog.lessons.push(...["lesson-test", "lesson-shared"].map(id => ({id, classId: "class-test",
    subjectId: "subject-test", seriesId: "series-test", title: id, metadata: {scheduledFor: null}, seed: {},
    materialBasis: {archiveSeriesId: "series-test", archivePath: "shared-material", scope: "series"}})));
  await writeFile(path.join(archiveRoot, "archive.json"), JSON.stringify({format: "tafelraum-unterrichtsarchiv", schemaVersion: 1, classes: [{id: "class-test", label: "Test"}], catalog}));
  const materialRoot = path.join(archiveRoot, "shared-material");
  await mkdir(path.join(materialRoot, "interaktiv", "test"), {recursive: true});
  const originalSources = {
    "links.json": JSON.stringify({schemaVersion: 1, links: [
      {id: "web", title: "Website", url: "https://example.com/", provider: "web", updatedAt: "2026-10-14T10:00:00Z"},
      {id: "youtube", title: "Video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", videoId: "dQw4w9WgXcQ", updatedAt: "2026-10-14T10:00:00Z"},
    ]}),
    "01.png": "original image", "02.pdf": "original pdf", "03.mp3": "original audio", "04.mp4": "original video",
    "interaktiv/test/manifest.json": JSON.stringify({format: "tafelraum-interactive-html", schemaVersion: 1,
      id: "test", title: "Original quiz", entry: "index.html", defaultViewport: {width: 800, height: 600}}),
    "interaktiv/test/index.html": "<!doctype html><title>Original quiz</title>",
  };
  for (const [file, bytes] of Object.entries(originalSources)) await writeFile(path.join(materialRoot, file), bytes);
  const servers = [];
  const open = async () => {
    const middleware = createArchiveMiddleware(archiveRoot);
    const server = http.createServer((req, res) => void middleware(req, res, () => {res.statusCode = 404; res.end();}));
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); servers.push(server);
    return `http://127.0.0.1:${server.address().port}/api/archive`;
  };
  let origin = await open();
  const list = async (lesson = "lesson-test") => (await (await fetch(`${origin}/lessons/${lesson}/materials`)).json()).materials;
  const renameMaterial = (materialPath, displayName, previousDisplayName, lesson = "lesson-test") => fetch(`${origin}/lessons/${lesson}/materials`, {
    method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({path: materialPath, displayName, previousDisplayName}),
  });
  try {
    const board = {schemaVersion: 1, elements: [{id: "one", type: "image", customData: {archiveMaterialPath: "shared-material/01.png"}},
      {id: "two", type: "image", customData: {archiveMaterialPath: "shared-material/01.png"}},
      {id: "cover", type: "rectangle", customData: {imageId: "one"}}], clips: [{id: "clip", kind: "material", number: 1, elementId: "one"}],
      viewport: {scrollX: 5, scrollY: 10, zoom: {value: 0.5}}};
    assert.equal((await fetch(`${origin}/lessons/lesson-test/board`, {method: "PUT", headers: {"Content-Type": "application/json", "If-None-Match": "*"}, body: JSON.stringify(board)})).status, 200);
    const boardUrl = `${origin}/lessons/lesson-test/board`;
    const originalBoard = await (await fetch(boardUrl)).text();
    const original = await list();
    assert.equal(original.length, 7);
    // Independent concurrent renames share the existing serialized material-write path.
    const responses = await Promise.all(original.map(item => renameMaterial(item.path, "  Start  ", item.name)));
    assert.ok(responses.every(response => response.status === 200));
    const namesFile = path.join(materialRoot, ".material-names.json");
    const named = await list();
    assert.deepEqual(named.map(item => item.path), original.map(item => item.path));
    assert.deepEqual(named.map(item => item.name), original.map(item => item.name));
    assert.ok(named.every(item => item.displayName === "Start"));
    assert.deepEqual(await list("lesson-shared"), named);
    assert.equal(await (await fetch(boardUrl)).text(), originalBoard);
    for (const [file, bytes] of Object.entries(originalSources)) assert.equal(await readFile(path.join(materialRoot, file), "utf8"), bytes);
    const namesBefore = await readFile(namesFile, "utf8");
    assert.equal((await renameMaterial("01.png", "Stale", "01.png")).status, 409);
    assert.equal((await renameMaterial("../archive.json", "Escape", "Start")).status, 404);
    for (const invalid of ["", "  ", "x".repeat(161), "a\nb", "bad\u0000name", 1, null]) {
      assert.equal((await renameMaterial("01.png", invalid, "Start")).status, 400);
    }
    assert.equal(await readFile(namesFile, "utf8"), namesBefore);
    const historyBefore = await directoryEntries(path.join(materialRoot, ".history", "material-names"));
    assert.equal((await renameMaterial("01.png", "Start", "Start")).status, 200);
    assert.deepEqual(await directoryEntries(path.join(materialRoot, ".history", "material-names")), historyBefore);
    // A fresh server reads the same names; restoring the source name removes only its override.
    origin = await open();
    assert.deepEqual(await list(), named);
    assert.equal((await renameMaterial("01.png", "01.png", "Start")).status, 200);
    assert.equal((await list()).find(item => item.path === "01.png").displayName, undefined);
    assert.ok((await list()).filter(item => item.path !== "01.png").every(item => item.displayName === "Start"));
    assert.ok((await directoryEntries(path.join(materialRoot, ".history", "material-names"))).length > 0);
    // Corrupt metadata must be visible as an error and never silently overwritten.
    await writeFile(namesFile, '{"schemaVersion":99,"names":{}}');
    assert.equal((await renameMaterial("01.png", "New", "01.png")).status, 500);
    assert.equal(await readFile(namesFile, "utf8"), '{"schemaVersion":99,"names":{}}');
  } finally {
    for (const server of servers) await new Promise(resolve => server.close(resolve));
    await rm(archiveRoot, {recursive: true, force: true});
  }
});

test("material order persists in the basis, rejects stale/invalid writes and appends new sources without changing boards", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tafelraum-material-order-"));
  const catalog = emptyCatalog();
  catalog.subjects.push({id:"subject",classId:"class-test",label:"Test"});
  catalog.series.push({id:"series",classId:"class-test",subjectId:"subject",label:"Test"});
  catalog.lessons.push(...["one","two"].map(id=>({id,classId:"class-test",subjectId:"subject",seriesId:"series",title:id,
    metadata:{scheduledFor:null},seed:{},materialBasis:{archiveSeriesId:"series",archivePath:"shared-material",scope:"series"}})));
  await writeFile(path.join(root,"archive.json"),JSON.stringify({format:"tafelraum-unterrichtsarchiv",schemaVersion:1,classes:[{id:"class-test",label:"Test"}],catalog}));
  const materialRoot=path.join(root,"shared-material");await mkdir(materialRoot);
  for (const name of ["a.png","b.pdf","c.mp3"]) await writeFile(path.join(materialRoot,name),name);
  await writeFile(path.join(materialRoot,"links.json"),JSON.stringify({schemaVersion:1,links:[{id:"web",title:"Web",url:"https://example.com/",provider:"web",updatedAt:"2026-10-18T08:00:00Z"}]}));
  const servers=[];
  const open=async()=>{
    const middleware=createArchiveMiddleware(root),server=http.createServer((req,res)=>void middleware(req,res,()=>res.writeHead(404).end()));
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));servers.push(server);return `http://127.0.0.1:${server.address().port}/api/archive/lessons`;
  };
  let origin=await open();
  const list=async(id="one")=>(await(await fetch(`${origin}/${id}/materials`)).json()).materials;
  const reorder=(paths,previousPaths,id="one")=>fetch(`${origin}/${id}/materials/order`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({paths,previousPaths})});
  try {
    const board={schemaVersion:1,elements:[],files:{}};
    assert.equal((await fetch(`${origin}/one/board`,{method:"PUT",headers:{"Content-Type":"application/json","If-None-Match":"*"},body:JSON.stringify(board)})).status,200);
    const originalBoard=await(await fetch(`${origin}/one/board`)).text();
    const initial=(await list()).map(item=>item.path),reversed=[...initial].reverse();
    assert.equal(initial.length,4);
    assert.equal((await reorder(reversed,initial)).status,200);
    assert.deepEqual((await list("two")).map(item=>item.path),reversed);
    assert.equal((await reorder(initial,initial)).status,409);
    assert.equal((await reorder([reversed[0],reversed[0]],reversed)).status,400);
    assert.equal((await reorder(["../outside",...reversed.slice(1)],reversed)).status,400);
    assert.equal((await reorder(reversed.slice(1),reversed)).status,400);
    assert.equal((await reorder(reversed,reversed,"missing")).status,404);
    origin=await open();assert.deepEqual((await list()).map(item=>item.path),reversed);
    await writeFile(path.join(materialRoot,"00-new.png"),"new");
    assert.deepEqual((await list()).map(item=>item.path),[...reversed,"00-new.png"]);
    assert.equal((await reorder(initial,reversed)).status,409);
    await unlink(path.join(materialRoot,"b.pdf"));
    assert.deepEqual((await list()).map(item=>item.path),[...reversed.filter(item=>item!=="b.pdf"),"00-new.png"]);
    for (const name of ["a.png","c.mp3"])assert.equal(await readFile(path.join(materialRoot,name),"utf8"),name);
    assert.equal(await(await fetch(`${origin}/one/board`)).text(),originalBoard);
    assert.equal(JSON.parse(await readFile(path.join(materialRoot,".material-order.json"),"utf8")).schemaVersion,1);
  } finally {
    for(const server of servers)await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});
  }
});
