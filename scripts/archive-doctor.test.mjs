import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectArchive } from "./archive-doctor.mjs";

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function archiveFixture() {
  const subject = { id: "subject-test", classId: "class-test", label: "Englisch" };
  const series = { id: "series-test", classId: "class-test", subjectId: subject.id, label: "Travel" };
  const lesson = {
    id: "lesson-test",
    classId: "class-test",
    subjectId: subject.id,
    seriesId: series.id,
    title: "Transport",
    metadata: { scheduledFor: null },
    seed: { prompt: "", showTransportImage: false },
    materialBasis: {
      archiveSeriesId: series.id,
      archivePath: "faecher/subject-test/reihen/series-test/stunden/lesson-test/material",
      scope: "lesson",
    },
  };
  return {
    archive: {
      format: "tafelraum-unterrichtsarchiv",
      schemaVersion: 1,
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T10:00:00.000Z",
      classes: [{ id: "class-test", label: "Test" }],
      catalog: {
        version: 1,
        subjects: [subject],
        series: [series],
        lessons: [lesson],
        hiddenLessonIds: [],
        trash: [],
        subjectOrderByClassId: { "class-test": [subject.id] },
        seriesOrderBySubjectId: { [subject.id]: [series.id] },
        lessonOrderBySeriesId: { [series.id]: [lesson.id] },
      },
    },
    subject,
    series,
    lesson,
  };
}

async function createFixtureRoot() {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-doctor-test-"));
  const fixture = archiveFixture();
  const seriesRoot = path.join(archiveRoot, "faecher", fixture.subject.id, "reihen", fixture.series.id);
  const lessonRoot = path.join(seriesRoot, "stunden", fixture.lesson.id);
  await writeJson(path.join(archiveRoot, "archive.json"), fixture.archive);
  await writeJson(path.join(archiveRoot, "faecher", fixture.subject.id, "subject.json"), {
    schemaVersion: 1,
    ...fixture.subject,
    updatedAt: fixture.archive.updatedAt,
  });
  await writeJson(path.join(seriesRoot, "series.json"), {
    schemaVersion: 1,
    ...fixture.series,
    updatedAt: fixture.archive.updatedAt,
  });
  await writeJson(path.join(lessonRoot, "lesson.json"), {
    schemaVersion: 1,
    ...fixture.lesson,
    updatedAt: fixture.archive.updatedAt,
  });
  await mkdir(path.join(lessonRoot, "material"), { recursive: true });
  return { archiveRoot, fixture, lessonRoot };
}

test("Archive Doctor accepts a consistent archive without mutating it", async () => {
  const { archiveRoot } = await createFixtureRoot();
  try {
    const report = await inspectArchive(archiveRoot);
    assert.equal(report.summary.errors, 0);
    assert.equal(report.summary.warnings, 0);
    assert.equal(report.summary.subjects, 1);
    assert.equal(report.summary.lessons, 1);
  } finally {
    await rm(archiveRoot, { recursive: true, force: true });
  }
});

test("Archive Doctor reports broken references, residue and invalid HTML packages", async () => {
  const { archiveRoot, fixture, lessonRoot } = await createFixtureRoot();
  try {
    fixture.archive.catalog.subjects.push(null);
    fixture.archive.catalog.lessons.push({
      ...fixture.lesson,
      title: "Live Canvas Test A",
      seriesId: "missing-series",
    });
    await writeJson(path.join(archiveRoot, "archive.json"), fixture.archive);
    await mkdir(path.join(archiveRoot, "_unassigned", "stunden", "old", "board"), { recursive: true });
    await writeFile(path.join(archiveRoot, "_unassigned", "stunden", "old", "board", "scene.json"), "{}\n");
    const packageRoot = path.join(lessonRoot, "material", "interaktiv", "broken-package");
    await mkdir(packageRoot, { recursive: true });
    await writeJson(path.join(packageRoot, "manifest.json"), {
      format: "tafelraum-interactive-html",
      schemaVersion: 1,
      id: "different-id",
      title: "Broken",
      entry: "index.html",
    });
    await writeFile(path.join(packageRoot, "index.html"), "<!doctype html><title>Broken</title>");

    const report = await inspectArchive(archiveRoot);
    const codes = new Set(report.issues.map((entry) => entry.code));
    assert.ok(report.summary.errors > 0);
    assert.ok(report.summary.warnings > 0);
    assert.ok(codes.has("catalog.item-invalid"));
    assert.ok(codes.has("catalog.duplicate-id"));
    assert.ok(codes.has("catalog.lesson-series"));
    assert.ok(codes.has("catalog.test-like-lesson"));
    assert.ok(codes.has("archive.unassigned"));
    assert.ok(codes.has("html.package-invalid"));
  } finally {
    await rm(archiveRoot, { recursive: true, force: true });
  }
});
