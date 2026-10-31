import { constants } from "node:fs";
import { copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const navigationSubjectId = "subject-e5a92c1a-0a4b-4cae-83b2-5b030862a447";
const navigationSeriesId = "series-f76f5c48-7e6b-4646-a2a6-e058bb1d0426";
const legacySeriesPath = "faecher/subject-ler/reihen/series-ler-reisen";

const lessonMaterialPaths = new Map([
  ["lesson-ler-reisen-2026-08-25", [
    "arbeitsblaetter/AB01_Stimmungsbild_Warum_reisen_wir.png",
    "arbeitsblaetter/AB01_Warum_reisen_wir.png",
    "impulse/Impuls01_Wohin_reisen.png",
    "medien-und-links/Bikepacking_2024_Karte.png",
    "medien-und-links/Karte_Berlin_Ostseekueste.png",
    "medien-und-links/YouTube_Galileo_203_Laender.jpg",
    "quellen/OneNote_Einstieg_2026-08-25.pdf",
  ]],
  ["lesson-9f6f6a32-df81-4028-9178-2f629450d45d", []],
  ["lesson-72a58ac1-2ed8-4320-9d83-58049903cc49", []],
  ["lesson-e3951946-2226-4b17-a4a9-4116852d1149", [
    "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik_ImageGen-v2.png",
    "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik_ImageGen.png",
    "arbeitsblaetter/output/AB02_Arbeitsblatt_Reiseethik.pdf",
    "arbeitsblaetter/output/AB02_Materialtext_Reiseethik_ImageGen-v2.png",
    "arbeitsblaetter/output/AB02_Materialtext_Reiseethik_ImageGen.png",
    "arbeitsblaetter/output/AB02_Materialtext_Reiseethik.pdf",
    "impulse/Impuls02_Eco-Lodges_Nachhaltigkeit-v2.png",
    "impulse/Impuls02_Eco-Lodges_Nachhaltigkeit.png",
  ]],
]);

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function copyIdenticalOrNew(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);
    return "copied";
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const [sourceBytes, targetBytes] = await Promise.all([
      readFile(sourcePath),
      readFile(targetPath),
    ]);
    if (!sourceBytes.equals(targetBytes)) {
      throw new Error(`Zieldatei weicht vom belegten Altbestand ab: ${targetPath}`);
    }
    return "kept";
  }
}

async function writeAtomicJsonWithHistory(filePath, value, historyRoot, historyPrefix) {
  const nextContents = `${JSON.stringify(value, null, 2)}\n`;
  if (await pathExists(filePath)) {
    const currentContents = await readFile(filePath, "utf8");
    if (currentContents === nextContents) return false;
    await mkdir(historyRoot, { recursive: true });
    await copyFile(
      filePath,
      path.join(historyRoot, `${historyPrefix}-${timestamp()}-${process.pid}.json`),
      constants.COPYFILE_EXCL,
    );
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporaryPath, nextContents, { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, filePath);
  return true;
}

function lessonMaterialBasis(lessonId) {
  return {
    archiveSeriesId: navigationSeriesId,
    archivePath: `faecher/${navigationSubjectId}/reihen/${navigationSeriesId}/stunden/${lessonId}/material`,
    scope: "lesson",
  };
}

export async function splitLegacyLerMaterials(archiveRoot) {
  const resolvedArchiveRoot = path.resolve(archiveRoot);
  const archivePath = path.join(resolvedArchiveRoot, "archive.json");
  const archiveDocument = JSON.parse(await readFile(archivePath, "utf8"));
  const lessonsById = new Map(archiveDocument.catalog.lessons.map((lesson) => [lesson.id, lesson]));
  const report = { copied: [], kept: [], lessons: [] };
  let catalogChanged = false;

  for (const [lessonId, materialPaths] of lessonMaterialPaths) {
    const lesson = lessonsById.get(lessonId);
    if (!lesson) throw new Error(`Erwartete LER-Stunde fehlt im Archiv: ${lessonId}`);
    if (lesson.subjectId !== navigationSubjectId || lesson.seriesId !== navigationSeriesId) {
      throw new Error(`LER-Stunde liegt nicht in der erwarteten Dinos-Reihe: ${lessonId}`);
    }

    const materialBasis = lessonMaterialBasis(lessonId);
    const materialRoot = path.join(resolvedArchiveRoot, materialBasis.archivePath);
    await mkdir(materialRoot, { recursive: true });
    for (const relativePath of materialPaths) {
      const sourcePath = path.join(resolvedArchiveRoot, legacySeriesPath, relativePath);
      if (!await pathExists(sourcePath)) throw new Error(`Belegtes LER-Material fehlt: ${sourcePath}`);
      const targetPath = path.join(materialRoot, relativePath);
      const status = await copyIdenticalOrNew(sourcePath, targetPath);
      report[status].push(path.relative(resolvedArchiveRoot, targetPath));
    }

    if (JSON.stringify(lesson.materialBasis) !== JSON.stringify(materialBasis)) {
      lesson.materialBasis = materialBasis;
      catalogChanged = true;
    }
    const lessonRoot = path.join(
      resolvedArchiveRoot,
      "faecher",
      navigationSubjectId,
      "reihen",
      navigationSeriesId,
      "stunden",
      lessonId,
    );
    const lessonPath = path.join(lessonRoot, "lesson.json");
    const lessonDocument = await pathExists(lessonPath)
      ? JSON.parse(await readFile(lessonPath, "utf8"))
      : { schemaVersion: 1 };
    await writeAtomicJsonWithHistory(
      lessonPath,
      { ...lessonDocument, ...lesson, materialBasis },
      path.join(lessonRoot, ".history"),
      "lesson",
    );
    report.lessons.push({ id: lessonId, materialBasis, materialCount: materialPaths.length });
  }

  if (catalogChanged) {
    archiveDocument.updatedAt = new Date().toISOString();
    await writeAtomicJsonWithHistory(
      archivePath,
      archiveDocument,
      path.join(resolvedArchiveRoot, "_history", "archive"),
      "archive",
    );
  }
  report.catalogChanged = catalogChanged;
  return report;
}

async function main() {
  const archiveRoot = path.resolve(process.argv[2] ?? path.join(projectRoot, "data", "unterrichtsarchiv"));
  const report = await splitLegacyLerMaterials(archiveRoot);
  process.stdout.write(`${JSON.stringify({ archiveRoot, ...report }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
