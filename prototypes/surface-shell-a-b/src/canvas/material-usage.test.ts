import assert from "node:assert/strict";
import test from "node:test";
import { canvasMaterialUsageFromElements, sameCanvasMaterialUsage } from "./material-usage.ts";

test("derives archive material usage from live canvas materials", () => {
  const usage = canvasMaterialUsageFromElements([
    { type: "image", customData: { archiveMaterialPath: "faecher/ler/reisen/impulse/nachhaltigkeit.png", sourceFileName: "nachhaltigkeit.png" } },
    { type: "image", customData: { archiveMaterialPath: "faecher/ler/reisen/impulse/nachhaltigkeit.png", sourceFileName: "nachhaltigkeit.png" } },
    { type: "image", customData: { archiveMaterialPath: "faecher/ler/reisen/arbeitsblaetter/reiseethik.pdf", sourceKind: "pdf-page", sourcePageNumber: 1 } },
    { type: "image", isDeleted: true, customData: { archiveMaterialPath: "faecher/ler/reisen/arbeitsblaetter/reiseethik.pdf", sourceKind: "pdf-page", sourcePageNumber: 2 } },
    { type: "embeddable", customData: { archiveMaterialPath: "faecher/ler/reisen/audio/hoertext.mp3", materialKind: "audio" } },
    { type: "iframe", customData: { archiveMaterialPath: "faecher/ler/reisen/audio/dialog.mp3", materialKind: "audio" } },
    { type: "rectangle", customData: { archiveMaterialPath: "faecher/ler/reisen/audio/player.mp3", materialKind: "audio" } },
    { type: "rectangle", customData: { archiveMaterialPath: "faecher/ler/reisen/video/film.mp4", materialKind: "video" } },
    { type: "iframe", customData: { archiveMaterialPath: "faecher/ler/reisen/material/@links/video", materialKind: "youtube" } },
    { type: "rectangle", customData: { archiveMaterialPath: "faecher/ler/reisen/material/@links/projected-video", materialKind: "youtube" } },
    { type: "text", customData: { archiveMaterialPath: "faecher/ler/reisen/material/@links/quelle", materialKind: "link" } },
    { type: "rectangle", customData: { archiveMaterialPath: "faecher/ler/reisen/material/interaktiv/motoren", materialKind: "interactive-html" } },
    { type: "embeddable", isDeleted: true, customData: { archiveMaterialPath: "faecher/ler/reisen/audio/alt.mp3", materialKind: "audio" } },
    { type: "embeddable", customData: { archiveMaterialPath: "ignored-embed", materialKind: "website" } },
    { type: "text", customData: { archiveMaterialPath: "ignored.png" } },
  ]);

  assert.deepEqual(usage, {
    archivePaths: [
      "faecher/ler/reisen/arbeitsblaetter/reiseethik.pdf",
      "faecher/ler/reisen/audio/dialog.mp3",
      "faecher/ler/reisen/audio/hoertext.mp3",
      "faecher/ler/reisen/audio/player.mp3",
      "faecher/ler/reisen/impulse/nachhaltigkeit.png",
      "faecher/ler/reisen/material/@links/projected-video",
      "faecher/ler/reisen/material/@links/quelle",
      "faecher/ler/reisen/material/@links/video",
      "faecher/ler/reisen/material/interaktiv/motoren",
      "faecher/ler/reisen/video/film.mp4",
    ],
    legacyFileNames: [],
  });
});

test("keeps a filename fallback for images saved before archive provenance existed", () => {
  assert.deepEqual(canvasMaterialUsageFromElements([
    { type: "image", customData: { sourceFileName: "AB02_Reiseethik.pdf", sourceKind: "pdf-page" } },
    { type: "image", customData: { sourceFileName: "AB02_Reiseethik.pdf", sourceKind: "pdf-page" } },
  ]), {
    archivePaths: [],
    legacyFileNames: ["AB02_Reiseethik.pdf"],
  });
});

test("compares stable material usage projections", () => {
  assert.equal(sameCanvasMaterialUsage(
    { archivePaths: ["a.png"], legacyFileNames: ["old.png"] },
    { archivePaths: ["a.png"], legacyFileNames: ["old.png"] },
  ), true);
  assert.equal(sameCanvasMaterialUsage(
    { archivePaths: ["a.png"], legacyFileNames: [] },
    { archivePaths: [], legacyFileNames: ["a.png"] },
  ), false);
});


test("archive navigation resolves live instances and cycles deterministically without using annotations or foreign provenance", async () => {
  const { archiveMaterialElements, nextArchiveMaterialElement } = await import("./material-usage.ts");
  const scene = [
    { id: "page1", type: "image", customData: { archiveMaterialPath: "lesson/a.pdf" } },
    { id: "ink", type: "freedraw", customData: { archiveMaterialPath: "lesson/a.pdf" } },
    { id: "deleted", type: "image", isDeleted: true, customData: { archiveMaterialPath: "lesson/a.pdf" } },
    { id: "page2", type: "image", customData: { archiveMaterialPath: "lesson/a.pdf" } },
    { id: "other", type: "image", customData: { archiveMaterialPath: "other/a.pdf", sourceFileName: "a.pdf" } },
    { id: "legacy", type: "image", customData: { sourceFileName: "a.pdf" } },
    { id: "html", type: "rectangle", customData: { materialKind: "interactive-html", archiveMaterialPath: "lesson/html" } },
  ];
  const matches = archiveMaterialElements(scene, "lesson/a.pdf");
  assert.deepEqual(matches.map(e => e.id), ["page1", "page2"]);
  assert.equal(nextArchiveMaterialElement(matches, null)?.id, "page1");
  assert.equal(nextArchiveMaterialElement(matches, "page1")?.id, "page2");
  assert.equal(nextArchiveMaterialElement(matches, "page2")?.id, "page1");
  assert.equal(nextArchiveMaterialElement(matches.slice(1), "page1")?.id, "page2");
  assert.equal(nextArchiveMaterialElement([], "page1"), null);
  assert.deepEqual(archiveMaterialElements(scene, "lesson/a.pdf", "a.pdf").map(e => e.id), ["page1", "page2", "legacy"]);
  assert.deepEqual(archiveMaterialElements(scene, "lesson/html").map(e => e.id), ["html"]);
});
