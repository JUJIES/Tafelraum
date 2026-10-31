import { constants } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitLegacyLerMaterials } from "./split-legacy-ler-materials.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceArgument = process.argv[2];
if (!sourceArgument) {
  process.stderr.write("Die Unterrichtsportierung ist abgeschlossen. Für einen kontrollierten Wiederherstellungsimport muss ein Quellpfad ausdrücklich angegeben werden.\n");
  process.exit(2);
}
const sourceRoot = path.resolve(sourceArgument);
const archiveRoot = path.resolve(process.argv[3] ?? path.join(projectRoot, "data", "unterrichtsarchiv"));
const migratedAt = new Date().toISOString();
const semanticLinkMigrationId = "unterricht-mirror-links-v1";

const ignoredNames = new Set([".DS_Store", "__pycache__"]);
const subjects = [
  { sourceName: "Biologie", id: "subject-biologie", label: "Biologie" },
  { sourceName: "Deutsch", id: "subject-deutsch", label: "Deutsch" },
  { sourceName: "Englisch", id: "subject-english", label: "Englisch" },
  { sourceName: "LER", id: "subject-ler", label: "LER" },
  { sourceName: "WAT", id: "subject-wat", label: "WAT" },
  { sourceName: "Physik", id: "subject-physik", label: "Physik" },
];

const knownSeries = new Map([
  ["Englisch/Means of transport", { id: "series-means-of-transport", label: "Means of transport" }],
  ["LER/Reisen", { id: "series-ler-reisen", label: "Reisen" }],
]);

const englishMaterialBasis = {
  archiveSeriesId: "series-means-of-transport",
  archivePath: "faecher/subject-english/reihen/series-means-of-transport",
  scope: "series",
  sourceMirrorPath: "Englisch/Means of transport",
  sourceMapPath: "_migration/current-source-map.json",
};

function englishLessonMaterialBasis(lessonId) {
  return {
    archiveSeriesId: "series-means-of-transport",
    archivePath: `faecher/subject-english/reihen/series-means-of-transport/stunden/${lessonId}/material`,
    scope: "lesson",
  };
}

const lerMaterialBasis = {
  archiveSeriesId: "series-ler-reisen",
  archivePath: "faecher/subject-ler/reihen/series-ler-reisen",
  scope: "series",
  sourceMirrorPath: "LER/Reisen",
  sourceMapPath: "_migration/current-source-map.json",
};

const seededLessons = [
  {
    id: "means-of-transport",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Wortfeld und Bewertung",
    metadata: { scheduledFor: "2026-08-24" },
    materialBasis: englishLessonMaterialBasis("means-of-transport"),
    sourceReferences: [{ path: "Englisch/Means of transport/reihenspiegel.md", evidence: "observed" }],
    seed: {
      prompt: "Which means of transport is best\nfor a holiday?",
      showTransportImage: true,
    },
  },
  {
    id: "english-means-2026-08-27",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Private and public transport",
    metadata: { scheduledFor: "2026-08-27" },
    materialBasis: englishLessonMaterialBasis("english-means-2026-08-27"),
    sourceReferences: [{ path: "Englisch/Means of transport/reihenspiegel.md", evidence: "observed" }],
    seed: {
      prompt: "Which of these are private?\nWhich are public?",
      showTransportImage: true,
    },
  },
  {
    id: "english-means-2026-08-31-plan",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Language support & Transport Challenge",
    metadata: { scheduledFor: "2026-08-31" },
    materialBasis: englishLessonMaterialBasis("english-means-2026-08-31-plan"),
    sourceReferences: [{ path: "Englisch/Means of transport/reihenspiegel.md", evidence: "planned" }],
    seed: {
      prompt: "Language support",
      notes: "Sentence starters · model dialogue\nUseful vocabulary\n\nNext: Transport Challenge\nTrain · plane · bus · ferry",
      showTransportImage: true,
    },
  },
];

const pendingLessons = [
  {
    id: "lesson-ler-reisen-2026-08-25",
    classId: null,
    subjectId: "subject-ler",
    seriesId: "series-ler-reisen",
    title: "Einstieg: Warum reisen wir?",
    metadata: { scheduledFor: "2026-08-25" },
    materialBasis: lerMaterialBasis,
    sourceReferences: [{ path: "LER/Reisen/reihenspiegel.md", evidence: "observed" }],
    migration: {
      status: "pending-class-assignment",
      source: "LER/Reisen/reihenspiegel.md",
    },
  },
];

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "reihe";
}

async function writeNewFile(targetPath, contents) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await writeFile(targetPath, contents, { encoding: "utf8", flag: "wx" });
    return "created";
  } catch (error) {
    if (error?.code === "EEXIST") return "kept";
    throw error;
  }
}

async function writeNewJson(targetPath, value) {
  return writeNewFile(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function mergeSourceReferences(existing = [], incoming = []) {
  const merged = new Map(existing.map((reference) => [reference.path, reference]));
  for (const reference of incoming) merged.set(reference.path, reference);
  return [...merged.values()];
}

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

function recordCurrentSourceFile(report, sourcePath, targetPath, status) {
  report.currentSourceFiles.push({
    sourcePath: path.relative(sourceRoot, sourcePath),
    archivePath: path.relative(archiveRoot, targetPath),
    status,
  });
}

async function copyTreeWithoutOverwrite(sourcePath, targetPath, report) {
  const sourceStat = await stat(sourcePath);
  if (sourceStat.isDirectory()) {
    await mkdir(targetPath, { recursive: true });
    const entries = await readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (ignoredNames.has(entry.name)) continue;
      await copyTreeWithoutOverwrite(path.join(sourcePath, entry.name), path.join(targetPath, entry.name), report);
    }
    return;
  }
  if (!sourceStat.isFile()) return;
  await mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);
    report.copiedFiles.push(path.relative(archiveRoot, targetPath));
    recordCurrentSourceFile(report, sourcePath, targetPath, "copied");
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const [sourceBytes, targetBytes] = await Promise.all([readFile(sourcePath), readFile(targetPath)]);
    if (sourceBytes.equals(targetBytes)) {
      report.keptFiles.push(path.relative(archiveRoot, targetPath));
      recordCurrentSourceFile(report, sourcePath, targetPath, "identical");
      return;
    }
    const conflictPrefix = `${path.basename(targetPath)}.migration-`;
    const existingConflictNames = (await readdir(path.dirname(targetPath)))
      .filter((name) => name.startsWith(conflictPrefix));
    for (const existingConflictName of existingConflictNames) {
      const existingConflictPath = path.join(path.dirname(targetPath), existingConflictName);
      const existingConflictBytes = await readFile(existingConflictPath);
      if (sourceBytes.equals(existingConflictBytes)) {
        report.keptFiles.push(path.relative(archiveRoot, existingConflictPath));
        recordCurrentSourceFile(report, sourcePath, existingConflictPath, "preserved-version");
        return;
      }
    }
    const conflictTarget = `${targetPath}.migration-${Date.now()}`;
    await copyFile(sourcePath, conflictTarget, constants.COPYFILE_EXCL);
    report.conflicts.push({
      source: sourcePath,
      preservedExisting: targetPath,
      copiedAs: conflictTarget,
    });
    recordCurrentSourceFile(report, sourcePath, conflictTarget, "preserved-version");
  }
}

async function writeCurrentSourceMap(report) {
  const mapPath = path.join(archiveRoot, "_migration", "current-source-map.json");
  const files = [...report.currentSourceFiles]
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath)
      || left.archivePath.localeCompare(right.archivePath));
  const existing = await pathExists(mapPath) ? JSON.parse(await readFile(mapPath, "utf8")) : null;
  const unchanged = existing && JSON.stringify(existing.files) === JSON.stringify(files);
  await writeAtomicJsonWithHistory(mapPath, {
    schemaVersion: 1,
    sourceRoot,
    generatedAt: unchanged ? existing.generatedAt : migratedAt,
    files,
  }, path.join(archiveRoot, "_history", "migration"), "current-source-map");
}

async function migrateSubject(subject, report) {
  const sourceSubjectRoot = path.join(sourceRoot, subject.sourceName);
  const targetSubjectRoot = path.join(archiveRoot, "faecher", subject.id);
  await mkdir(targetSubjectRoot, { recursive: true });
  await writeNewJson(path.join(targetSubjectRoot, "subject.json"), {
    schemaVersion: 1,
    id: subject.id,
    label: subject.label,
    migratedFrom: sourceSubjectRoot,
    migratedAt,
  });

  const entries = await readdir(sourceSubjectRoot, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (ignoredNames.has(entry.name)) continue;
    const sourcePath = path.join(sourceSubjectRoot, entry.name);
    if (!entry.isDirectory()) {
      await copyTreeWithoutOverwrite(sourcePath, path.join(targetSubjectRoot, entry.name), report);
      continue;
    }
    const sourceKey = `${subject.sourceName}/${entry.name}`;
    const series = knownSeries.get(sourceKey) ?? { id: `series-${slug(subject.label)}-${slug(entry.name)}`, label: entry.name };
    const targetSeriesRoot = path.join(targetSubjectRoot, "reihen", series.id);
    await copyTreeWithoutOverwrite(sourcePath, targetSeriesRoot, report);
    await writeNewJson(path.join(targetSeriesRoot, "series.json"), {
      schemaVersion: 1,
      id: series.id,
      subjectId: subject.id,
      label: series.label,
      migratedFrom: sourcePath,
      migratedAt,
    });
  }
}

async function createLessonFolders() {
  const englishSeriesRoot = path.join(
    archiveRoot,
    "faecher",
    "subject-english",
    "reihen",
    "series-means-of-transport",
  );
  for (const lesson of seededLessons) {
    await writeNewJson(path.join(englishSeriesRoot, "stunden", lesson.id, "lesson.json"), {
      schemaVersion: 1,
      ...lesson,
      migratedAt,
    });
  }

  const lerSeriesRoot = path.join(archiveRoot, "faecher", "subject-ler", "reihen", "series-ler-reisen");
  for (const lesson of pendingLessons) {
    await writeNewJson(path.join(lerSeriesRoot, "stunden", lesson.id, "lesson.json"), {
      schemaVersion: 1,
      ...lesson,
      migratedAt,
    });
  }
}

function resolveOrCreateDinosHierarchy(archiveDocument) {
  const dinosClass = archiveDocument.classes.find((lessonClass) => lessonClass.id === "class-dinos")
    ?? archiveDocument.classes.find((lessonClass) => lessonClass.label === "Dinos")
    ?? { id: "class-dinos", label: "Dinos" };
  if (!archiveDocument.classes.some((lessonClass) => lessonClass.id === dinosClass.id)) {
    archiveDocument.classes.push(dinosClass);
  }

  const catalog = archiveDocument.catalog;
  const subject = catalog.subjects.find((candidate) => candidate.classId === dinosClass.id && candidate.label === "LER/WAT")
    ?? { id: "subject-dinos-ler-wat", classId: dinosClass.id, label: "LER/WAT" };
  if (!catalog.subjects.some((candidate) => candidate.id === subject.id)) catalog.subjects.push(subject);

  const series = catalog.series.find((candidate) => candidate.subjectId === subject.id && candidate.label === "Reisen")
    ?? {
      id: "series-dinos-reisen",
      classId: dinosClass.id,
      subjectId: subject.id,
      label: "Reisen",
    };
  if (!catalog.series.some((candidate) => candidate.id === series.id)) catalog.series.push(series);
  return { classId: dinosClass.id, subjectId: subject.id, seriesId: series.id };
}

function withMaterialLink(lesson, materialBasis, sourceReferences = []) {
  return {
    ...lesson,
    materialBasis,
    sourceReferences: mergeSourceReferences(lesson.sourceReferences, sourceReferences),
  };
}

async function materializeLinkedCatalog(archiveDocument, linkedSeriesIds, linkedLessonIds) {
  for (const series of archiveDocument.catalog.series.filter((candidate) => linkedSeriesIds.has(candidate.id))) {
    const seriesRoot = path.join(archiveRoot, "faecher", series.subjectId, "reihen", series.id);
    const seriesPath = path.join(seriesRoot, "series.json");
    const existing = await pathExists(seriesPath) ? JSON.parse(await readFile(seriesPath, "utf8")) : {};
    await writeAtomicJsonWithHistory(seriesPath, {
      ...existing,
      schemaVersion: 1,
      ...series,
      updatedAt: archiveDocument.updatedAt,
    }, path.join(archiveRoot, "_history", "series", series.id), "series");
  }

  for (const lesson of archiveDocument.catalog.lessons.filter((candidate) => linkedLessonIds.has(candidate.id))) {
    const lessonRoot = path.join(
      archiveRoot,
      "faecher",
      lesson.subjectId,
      "reihen",
      lesson.seriesId,
      "stunden",
      lesson.id,
    );
    const lessonPath = path.join(lessonRoot, "lesson.json");
    await mkdir(path.join(lessonRoot, "material"), { recursive: true });
    const existing = await pathExists(lessonPath) ? JSON.parse(await readFile(lessonPath, "utf8")) : {};
    await writeAtomicJsonWithHistory(lessonPath, {
      ...existing,
      schemaVersion: 1,
      ...lesson,
      updatedAt: archiveDocument.updatedAt,
    }, path.join(lessonRoot, ".history"), "lesson");
  }
}

async function consolidateSemanticArchiveLinks(report) {
  const archivePath = path.join(archiveRoot, "archive.json");
  const archiveContents = await readFile(archivePath, "utf8");
  const archiveDocument = JSON.parse(archiveContents);
  const catalog = archiveDocument.catalog;
  const dinos = resolveOrCreateDinosHierarchy(archiveDocument);
  const linkedSeriesIds = new Set(["series-means-of-transport", "series-ler-reisen", dinos.seriesId]);
  const linkedLessonIds = new Set();

  catalog.series = catalog.series.map((series) => {
    if (series.id === "series-means-of-transport") return { ...series, archiveRole: "navigation", materialBasis: englishMaterialBasis };
    if (series.id === "series-ler-reisen") {
      return {
        ...series,
        archiveRole: "material-basis",
        materialBasis: lerMaterialBasis,
        linkedNavigationSeriesIds: [dinos.seriesId],
      };
    }
    if (series.id === dinos.seriesId) return { ...series, archiveRole: "navigation", materialBasis: lerMaterialBasis };
    return series;
  });

  const englishLessonById = new Map(seededLessons.map((lesson) => [lesson.id, lesson]));
  catalog.lessons = catalog.lessons.map((lesson) => {
    const englishSource = englishLessonById.get(lesson.id);
    if (englishSource) {
      linkedLessonIds.add(lesson.id);
      return withMaterialLink(lesson, englishSource.materialBasis, englishSource.sourceReferences);
    }
    if (lesson.seriesId === dinos.seriesId) {
      linkedLessonIds.add(lesson.id);
      const sourceReferences = lesson.id === "lesson-9f6f6a32-df81-4028-9178-2f629450d45d"
        || lesson.id === "lesson-e3951946-2226-4b17-a4a9-4116852d1149"
        ? [{ path: "LER/Reisen/reflexion/naechste_stunde.md", evidence: "planned" }]
        : [];
      return withMaterialLink(lesson, lerMaterialBasis, sourceReferences);
    }
    return lesson;
  });

  const pendingLesson = pendingLessons[0];
  const linkedPendingLesson = {
    ...pendingLesson,
    classId: dinos.classId,
    subjectId: dinos.subjectId,
    seriesId: dinos.seriesId,
    seed: { prompt: "", showTransportImage: false },
    migration: {
      status: "linked-to-navigation",
      source: "LER/Reisen/reihenspiegel.md",
    },
  };
  const pendingLessonIndex = catalog.lessons.findIndex((lesson) => lesson.id === pendingLesson.id);
  if (pendingLessonIndex === -1) catalog.lessons.push(linkedPendingLesson);
  else catalog.lessons[pendingLessonIndex] = {
    ...catalog.lessons[pendingLessonIndex],
    ...linkedPendingLesson,
    title: catalog.lessons[pendingLessonIndex].title || linkedPendingLesson.title,
  };
  linkedLessonIds.add(pendingLesson.id);

  const migrationWasApplied = Boolean(archiveDocument.migrationState?.[semanticLinkMigrationId]);
  const restoredLessonIds = migrationWasApplied ? [] : ["means-of-transport", "english-means-2026-08-27"];
  if (!migrationWasApplied) {
    catalog.trash = catalog.trash.filter((item) => item.kind !== "lesson" || !restoredLessonIds.includes(item.id));
  }
  archiveDocument.pendingClassAssignment = (archiveDocument.pendingClassAssignment ?? [])
    .filter((lessonId) => lessonId !== pendingLesson.id);
  archiveDocument.migrationState = {
    ...archiveDocument.migrationState,
    [semanticLinkMigrationId]: archiveDocument.migrationState?.[semanticLinkMigrationId] ?? migratedAt,
  };
  const semanticChanged = JSON.stringify(archiveDocument) !== JSON.stringify(JSON.parse(archiveContents));
  if (semanticChanged) archiveDocument.updatedAt = migratedAt;

  await writeAtomicJsonWithHistory(
    archivePath,
    archiveDocument,
    path.join(archiveRoot, "_history", "archive"),
    "archive",
  );
  await materializeLinkedCatalog(archiveDocument, linkedSeriesIds, linkedLessonIds);
  report.semanticLinks = {
    migrationId: semanticLinkMigrationId,
    dinos,
    linkedSeriesIds: [...linkedSeriesIds],
    linkedLessonIds: [...linkedLessonIds],
    restoredLessonIds,
    changed: semanticChanged,
  };
}

async function main() {
  const report = {
    sourceRoot,
    archiveRoot,
    migratedAt,
    copiedFiles: [],
    keptFiles: [],
    conflicts: [],
    currentSourceFiles: [],
  };
  await mkdir(archiveRoot, { recursive: true });

  for (const subject of subjects) await migrateSubject(subject, report);
  await createLessonFolders();

  const initialCatalog = {
    version: 1,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      classId: "class-9-10-b",
      label: subject.label,
    })),
    series: [
      {
        id: "series-means-of-transport",
        classId: "class-9-10-b",
        subjectId: "subject-english",
        label: "Means of transport",
      },
      {
        id: "series-ler-reisen",
        classId: "class-9-10-b",
        subjectId: "subject-ler",
        label: "Reisen",
      },
    ],
    lessons: seededLessons,
    hiddenLessonIds: [],
    trash: [],
    subjectOrderByClassId: {},
    seriesOrderBySubjectId: {},
    lessonOrderBySeriesId: {},
  };
  await writeNewJson(path.join(archiveRoot, "archive.json"), {
    format: "tafelraum-unterrichtsarchiv",
    schemaVersion: 1,
    createdAt: migratedAt,
    updatedAt: migratedAt,
    classes: [
      { id: "class-9-10-b", label: "9/10 B-Kurs" },
      { id: "class-dinos", label: "Dinos" },
    ],
    catalog: initialCatalog,
    pendingClassAssignment: pendingLessons.map((lesson) => lesson.id),
  });
  await consolidateSemanticArchiveLinks(report);
  report.lerLessonMaterialSplit = await splitLegacyLerMaterials(archiveRoot);
  await writeNewJson(path.join(archiveRoot, "_migration", "source-inventory.json"), {
    schemaVersion: 1,
    migratedAt,
    sourceRoot,
    subjects: subjects.map(({ id, label, sourceName }) => ({ id, label, sourceName })),
    pendingLessons,
  });
  await copyTreeWithoutOverwrite(
    path.join(sourceRoot, "ARBEITSWEISE_UNTERRICHT.md"),
    path.join(archiveRoot, "_migration", "original-docs", "ARBEITSWEISE_UNTERRICHT.md"),
    report,
  );
  await copyTreeWithoutOverwrite(
    path.join(sourceRoot, "ARBEITSWEISE_UNTERRICHT.md"),
    path.join(archiveRoot, "_rules", "source", "ARBEITSWEISE_UNTERRICHT.md"),
    report,
  );
  await copyTreeWithoutOverwrite(
    path.join(sourceRoot, "SPIEGELMODELL_V0_1.md"),
    path.join(archiveRoot, "_rules", "source", "SPIEGELMODELL_V0_1.md"),
    report,
  );
  await copyTreeWithoutOverwrite(
    path.join(sourceRoot, "README.md"),
    path.join(archiveRoot, "_rules", "source", "README.md"),
    report,
  );
  await writeCurrentSourceMap(report);
  await copyTreeWithoutOverwrite(
    path.join(sourceRoot, "SPIEGELMODELL_V0_1.md"),
    path.join(archiveRoot, "_migration", "original-docs", "SPIEGELMODELL_V0_1.md"),
    report,
  );
  await writeNewFile(path.join(archiveRoot, "README.md"), `# Tafelraum-Unterrichtsarchiv

Dieser Ordner ist die lokale kanonische Unterrichts- und Materialablage von Tafelraum. Ein ausdrücklich angegebener Altdatenbestand wurde additiv übernommen; die Importquelle wird dadurch nicht zur aktiven Parallelquelle.

- \`archive.json\` enthält Klassen, Hierarchie, Reihenfolge und Papierkorbmarkierungen.
- \`faecher/\` enthält stabile Fach-, Reihen- und Stundenordner.
- Jede Stunde verweist mit \`materialBasis\` auf ihren eigenen Ordner unter \`stunden/<lesson-id>/material/\`.
- Belegte Altmaterialien werden additiv in diese Stundenordner übernommen; der frühere Reihenbestand bleibt als Herkunftsnachweis erhalten.
- Canvasstände liegen pro Stunde in \`board/scene.json\`; importierte lokale Assets liegen unter \`assets/\`.
- \`_history/\` und stundenlokale \`.history/\` bewahren frühere Dateistände.
- \`_migration/\` dokumentiert jeden additiven Importlauf aus \`${sourceRoot}\`.
- \`_migration/current-source-map.json\` löst jede aktuelle Quelldatei auf ihre bytegleiche Archivfassung auf, auch wenn eine abweichende Fassung konfliktfrei zusätzlich erhalten wurde.
- \`_rules/source/\` bewahrt die unveränderten Unterrichts- und Spiegelregeln als fachliche Grundlage; \`docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md\` beschreibt nur ihren Anschluss an Tafelraum.

Das Skript ist nach dem Portierungsabschluss nur ein kontrolliertes Wiederherstellungswerkzeug und verlangt einen expliziten Quellpfad. Es löscht, verschiebt oder überschreibt nichts in der Importquelle. Browser-IndexedDB bleibt Cache und Migrationsquelle, nicht das einzige Archiv.
`);
  await writeNewFile(path.join(archiveRoot, "ARBEITSWEISE_ARCHIV.md"), `# Arbeitsweise im Tafelraum-Unterrichtsarchiv

## Quelle der Wahrheit

Das dateibasierte Archiv ist die kanonische lokale Quelle. Browserdaten werden beim Start zusammengeführt und anschließend als Cache weitergeführt. Bestehende IDs werden erhalten; Konflikte und frühere Stände werden versioniert statt stillschweigend verworfen.

## Hierarchie

\`Klasse → Fach → Reihe → Unterricht\` wird in \`archive.json\` indiziert. Die stabilen Ordner unter \`faecher/\` enthalten die fachlichen Daten, Canvasstände und Materialien. Der technische Index darf aus den Dateien rekonstruiert werden und ersetzt nicht die Lesson-Dokumente oder Originalassets.

## Materialien

Jede Stunde besitzt unter \`stunden/<lesson-id>/material/\` ihre eigene Originalmaterialbasis. Importierte Reihenordner bleiben unveränderte Herkunftsbestände. Für den bekannten Dinos-Bestand \`LER/WAT → Reisen\` übernimmt der Wiederherstellungslauf die eindeutig belegten Dateien additiv in die Einstieg- beziehungsweise Ferienwohnungsstunde; \`Gewinnerticket\` behält seinen Canvas und einen leeren Materialordner.

\`sourceReferences\` hält entsprechend dem unveränderten Spiegelmodell fest, ob der Beleg beobachtet, vom lokalen Auftraggeber bestätigt, rekonstruiert oder geplant ist. Die additive Stundenzuordnung entfernt oder überschreibt keine Datei des Herkunftsbestands.

Weicht eine aktuelle Quelldatei von einer bereits importierten Fassung ab, bleiben beide erhalten. \`materialBasis.sourceMapPath\` verweist auf \`_migration/current-source-map.json\`; diese Datei benennt für jeden Quellenpfad die bytegleiche gegenwärtige Archivfassung und verhindert eine stillschweigende Wahl einer älteren Datei.

## Codex-Unterrichtsworkflow

Die unveränderten Grundlagendokumente unter \`_rules/source/\` bleiben für Unterrichtsplanung sowie Material- und Arbeitsblattarbeit maßgeblich. \`docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md\` verallgemeinert sie nicht, sondern ergänzt ausschließlich den App-Anschluss: Eine von Codex angelegte Stunde wird gleichzeitig mit \`scripts/create-archive-lesson.mjs\` im Tafelraum-Archiv sichtbar gemacht.

## Sicherheit

Löschen in der App setzt eine Papierkorbmarkierung. Dateistände werden nicht endgültig entfernt. Schreibvorgänge sind atomar; bei Änderungen werden wiederherstellbare Vorgängerversionen abgelegt.

Der Import läuft ausschließlich nach ausdrücklicher Angabe einer Wiederherstellungsquelle und nie als Dateiwatcher. Jeder Lauf schreibt einen Bericht unter \`_migration/\`; die angegebene Quelle bleibt unverändert und wird nicht als neue fachliche Wahrheit geführt.
`);

  await writeNewJson(path.join(archiveRoot, "_migration", `report-${Date.now()}.json`), report);
  process.stdout.write(`${JSON.stringify({ archiveRoot, copiedFiles: report.copiedFiles.length, keptFiles: report.keptFiles.length, conflicts: report.conflicts.length }, null, 2)}\n`);
}

await main();
