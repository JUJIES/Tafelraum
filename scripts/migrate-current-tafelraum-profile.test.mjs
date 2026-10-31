import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { migrateProfile } from "./migrate-current-tafelraum-profile.mjs";

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function archiveDocument(label, migrationSource = "test-source") {
  const timestamp = "2026-09-21T12:00:00.000Z";
  return {
    format: "tafelraum-unterrichtsarchiv",
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    classes: [{ id: "class-test", label: "Testklasse" }],
    catalog: {
      version: 1,
      subjects: [{ id: "subject-test", classId: "class-test", label }],
      series: [{ id: "series-test", classId: "class-test", subjectId: "subject-test", label: "Testreihe", archiveRole: "navigation" }],
      lessons: [{
        id: "lesson-test",
        classId: "class-test",
        subjectId: "subject-test",
        seriesId: "series-test",
        title: "Teststunde",
        metadata: { scheduledFor: null },
        seed: { prompt: "", showTransportImage: false },
        materialBasis: {
          archiveSeriesId: "series-test",
          archivePath: "faecher/subject-test/reihen/series-test/stunden/lesson-test/material",
          scope: "lesson",
        },
      }],
      hiddenLessonIds: [],
      trash: [],
      subjectOrderByClassId: { "class-test": ["subject-test"] },
      seriesOrderBySubjectId: { "subject-test": ["series-test"] },
      lessonOrderBySeriesId: { "series-test": ["lesson-test"] },
    },
    pendingClassAssignment: [],
    migrationState: { source: migrationSource, completedAt: timestamp },
  };
}

async function createValidArchive(root, label) {
  const timestamp = "2026-09-21T12:00:00.000Z";
  await writeJson(path.join(root, "archive.json"), archiveDocument(label));
  await writeJson(path.join(root, "faecher/subject-test/subject.json"), {
    schemaVersion: 1, id: "subject-test", classId: "class-test", label, updatedAt: timestamp,
  });
  await writeJson(path.join(root, "faecher/subject-test/reihen/series-test/series.json"), {
    schemaVersion: 1, id: "series-test", classId: "class-test", subjectId: "subject-test",
    label: "Testreihe", archiveRole: "navigation", updatedAt: timestamp,
  });
  await writeJson(path.join(root, "faecher/subject-test/reihen/series-test/stunden/lesson-test/lesson.json"), {
    schemaVersion: 1, id: "lesson-test", classId: "class-test", subjectId: "subject-test",
    seriesId: "series-test", title: "Teststunde", metadata: { scheduledFor: null },
    seed: { prompt: "", showTransportImage: false },
    materialBasis: {
      archiveSeriesId: "series-test",
      archivePath: "faecher/subject-test/reihen/series-test/stunden/lesson-test/material",
      scope: "lesson",
    },
    updatedAt: timestamp,
  });
  await mkdir(path.join(root, "faecher/subject-test/reihen/series-test/stunden/lesson-test/material"), { recursive: true });
}

test("copies a verified profile atomically and refuses to overwrite the activated archive", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tafelraum-profile-migration-"));
  const sourceArchive = path.join(root, "source-archive");
  const sourceNotes = path.join(root, "source-notes");
  const dataRoot = path.join(root, "app-data");
  const runtimeStateRoots = [path.join(root, "webkit-state"), path.join(root, "cache-state")];
  try {
    await createValidArchive(sourceArchive, "Übernommenes Fach");
    await writeJson(path.join(sourceNotes, "notes.json"), { version: 1, notes: [{ id: "note-1", text: "Testnotiz", screenshot: null }] });
    await mkdir(runtimeStateRoots[0], { recursive: true });
    await writeFile(path.join(runtimeStateRoots[0], "local-storage.bin"), "starter-outbox");
    await mkdir(runtimeStateRoots[1], { recursive: true });
    await writeFile(path.join(runtimeStateRoots[1], "cache.bin"), "starter-cache");
    await writeJson(path.join(dataRoot, "unterrichtsarchiv/archive.json"), {
      ...archiveDocument("Mein Fach", "fresh-desktop-installation"),
      classes: [{ id: "class-start", label: "Meine Klasse" }],
      catalog: {
        ...archiveDocument("Mein Fach").catalog,
        subjects: [{ id: "subject-start", classId: "class-start", label: "Mein Fach" }],
        series: [{ id: "series-start", classId: "class-start", subjectId: "subject-start", label: "Meine Reihe", archiveRole: "navigation" }],
        lessons: [{ id: "lesson-start", classId: "class-start", subjectId: "subject-start", seriesId: "series-start", title: "Erster Unterricht" }],
      },
    });

    let backupCreated = false;
    const result = await migrateProfile({
      sourceArchive,
      sourceNotes,
      dataRoot,
      runtimeStateRoots,
      createAndVerifyBackup: async () => { backupCreated = true; return "/verified/test-backup"; },
    });
    assert.equal(backupCreated, true);
    assert.equal(result.backup, "/verified/test-backup");
    assert.equal(result.sourceSummary.errors, 0);
    assert.equal(result.targetSummary.errors, 0);
    assert.equal(result.movedRuntimeState.length, 2);
    await assert.rejects(access(runtimeStateRoots[0]), /ENOENT/);
    await assert.rejects(access(runtimeStateRoots[1]), /ENOENT/);
    assert.equal(await readFile(path.join(result.movedRuntimeState[0].destination, "local-storage.bin"), "utf8"), "starter-outbox");
    assert.equal(await readFile(path.join(result.movedRuntimeState[1].destination, "cache.bin"), "utf8"), "starter-cache");
    const activated = JSON.parse(await readFile(path.join(dataRoot, "unterrichtsarchiv/archive.json"), "utf8"));
    assert.equal(activated.catalog.subjects[0].label, "Übernommenes Fach");
    const notes = JSON.parse(await readFile(path.join(dataRoot, "personal-notes/notes.json"), "utf8"));
    assert.equal(notes.notes[0].text, "Testnotiz");

    await assert.rejects(
      migrateProfile({ sourceArchive, sourceNotes, dataRoot, createAndVerifyBackup: async () => "/unused" }),
      /bereits ein benutztes Unterrichtsarchiv/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
