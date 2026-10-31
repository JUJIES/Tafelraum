import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { splitLegacyLerMaterials } from "./split-legacy-ler-materials.mjs";

const subjectId = "subject-e5a92c1a-0a4b-4cae-83b2-5b030862a447";
const seriesId = "series-f76f5c48-7e6b-4646-a2a6-e058bb1d0426";
const lessonIds = [
  "lesson-ler-reisen-2026-08-25",
  "lesson-9f6f6a32-df81-4028-9178-2f629450d45d",
  "lesson-72a58ac1-2ed8-4320-9d83-58049903cc49",
  "lesson-e3951946-2226-4b17-a4a9-4116852d1149",
];

const legacyMaterialPaths = [
  "arbeitsblaetter/AB01_Stimmungsbild_Warum_reisen_wir.png",
  "arbeitsblaetter/AB01_Warum_reisen_wir.png",
  "impulse/Impuls01_Wohin_reisen.png",
  "medien-und-links/Bikepacking_2024_Karte.png",
  "medien-und-links/Karte_Berlin_Ostseekueste.png",
  "medien-und-links/YouTube_Galileo_203_Laender.jpg",
  "quellen/OneNote_Einstieg_2026-08-25.pdf",
  "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik_ImageGen-v2.png",
  "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik_ImageGen.png",
  "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik.pdf",
  "arbeitsblaetter/output/AB02_Materialtext_Reiseethik_ImageGen-v2.png",
  "arbeitsblaetter/output/AB02_Materialtext_Reiseethik_ImageGen.png",
  "arbeitsblaetter/output/AB02_Materialtext_Reiseethik.pdf",
  "impulse/Impuls02_Eco-Lodges_Nachhaltigkeit-v2.png",
  "impulse/Impuls02_Eco-Lodges_Nachhaltigkeit.png",
];

test("splits the known LER series pool additively into stable lesson material bases", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "tafelraum-ler-split-test-"));
  const lessonRoot = (lessonId) => path.join(
    archiveRoot,
    "faecher",
    subjectId,
    "reihen",
    seriesId,
    "stunden",
    lessonId,
  );
  try {
    const lessons = lessonIds.map((id) => ({
      id,
      classId: "class-dinos",
      subjectId,
      seriesId,
      title: id,
      materialBasis: {
        archiveSeriesId: "series-ler-reisen",
        archivePath: "faecher/subject-ler/reihen/series-ler-reisen",
        scope: "series",
      },
    }));
    await writeFile(path.join(archiveRoot, "archive.json"), `${JSON.stringify({
      format: "tafelraum-unterrichtsarchiv",
      schemaVersion: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      classes: [{ id: "class-dinos", label: "Dinos" }],
      catalog: { lessons },
    }, null, 2)}\n`);
    for (const lesson of lessons) {
      await mkdir(lessonRoot(lesson.id), { recursive: true });
      await writeFile(path.join(lessonRoot(lesson.id), "lesson.json"), `${JSON.stringify(lesson, null, 2)}\n`);
    }
    for (const relativePath of legacyMaterialPaths) {
      const filePath = path.join(archiveRoot, "faecher/subject-ler/reihen/series-ler-reisen", relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, `fixture:${relativePath}`);
    }

    const first = await splitLegacyLerMaterials(archiveRoot);
    const second = await splitLegacyLerMaterials(archiveRoot);
    assert.equal(first.copied.length, 15);
    assert.equal(first.catalogChanged, true);
    assert.equal(second.copied.length, 0);
    assert.equal(second.kept.length, 15);
    assert.equal(second.catalogChanged, false);

    const archive = JSON.parse(await readFile(path.join(archiveRoot, "archive.json"), "utf8"));
    for (const lesson of archive.catalog.lessons) {
      assert.equal(lesson.materialBasis.scope, "lesson");
      assert.match(lesson.materialBasis.archivePath, new RegExp(`/stunden/${lesson.id}/material$`));
    }
    assert.equal(first.lessons.find((lesson) => lesson.id === lessonIds[0]).materialCount, 7);
    assert.equal(first.lessons.find((lesson) => lesson.id === lessonIds[1]).materialCount, 0);
    assert.equal(first.lessons.find((lesson) => lesson.id === lessonIds[3]).materialCount, 8);
    assert.equal(
      await readFile(path.join(
        lessonRoot(lessonIds[0]),
        "material/medien-und-links/Karte_Berlin_Ostseekueste.png",
      ), "utf8"),
      "fixture:medien-und-links/Karte_Berlin_Ostseekueste.png",
    );
    assert.equal(
      await readFile(path.join(
        archiveRoot,
        "faecher/subject-ler/reihen/series-ler-reisen/medien-und-links/Karte_Berlin_Ostseekueste.png",
      ), "utf8"),
      "fixture:medien-und-links/Karte_Berlin_Ostseekueste.png",
    );
  } finally {
    await rm(archiveRoot, { recursive: true, force: true });
  }
});
