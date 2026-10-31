#!/usr/bin/env node

import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { readInteractiveMaterialPackage } from "../prototypes/surface-shell-a-b/interactive-material.mjs";

const archiveFormat = "tafelraum-unterrichtsarchiv";
const safeIdPattern = /^[a-zA-Z0-9._-]+$/;
const historyWarningThreshold = 100;

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function countFiles(directoryPath) {
  if (!(await exists(directoryPath))) return 0;
  let count = 0;
  for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) count += await countFiles(entryPath);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

async function findDirectoriesNamed(root, directoryName) {
  if (!(await exists(root))) return [];
  const matches = [];
  async function visit(currentPath) {
    for (const entry of await readdir(currentPath, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || entry.name === "_history" || entry.name === ".history") continue;
      const entryPath = path.join(currentPath, entry.name);
      if (!entry.isDirectory()) continue;
      if (entry.name === directoryName) {
        matches.push(entryPath);
        continue;
      }
      await visit(entryPath);
    }
  }
  await visit(root);
  return matches;
}

async function countNestedHistoryFiles(root) {
  if (!(await exists(root))) return 0;
  let count = 0;
  async function visit(currentPath) {
    for (const entry of await readdir(currentPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const entryPath = path.join(currentPath, entry.name);
      if (entry.name === ".history") count += await countFiles(entryPath);
      else await visit(entryPath);
    }
  }
  await visit(root);
  return count;
}

function stripMaterializedMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const { updatedAt: _updatedAt, ...rest } = value;
  return rest;
}

function issue(level, code, message, relativePath) {
  return { level, code, message, ...(relativePath ? { path: relativePath } : {}) };
}

function relativeToArchive(archiveRoot, filePath) {
  return path.relative(archiveRoot, filePath).split(path.sep).join("/") || ".";
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (item && typeof item.id === "string") {
      if (seen.has(item.id)) duplicates.add(item.id);
      seen.add(item.id);
    }
  }
  return [...duplicates];
}

function objectItems(items, kind, issues) {
  return items.filter((item, index) => {
    const valid = item && typeof item === "object" && !Array.isArray(item);
    if (!valid) issues.push(issue("error", "catalog.item-invalid", `${kind} an Position ${index + 1} ist kein gültiges Objekt.`));
    return valid;
  });
}

function validCatalogShape(catalog) {
  return catalog
    && catalog.version === 1
    && Array.isArray(catalog.subjects)
    && Array.isArray(catalog.series)
    && Array.isArray(catalog.lessons)
    && Array.isArray(catalog.hiddenLessonIds)
    && Array.isArray(catalog.trash)
    && catalog.subjectOrderByClassId && typeof catalog.subjectOrderByClassId === "object"
    && catalog.seriesOrderBySubjectId && typeof catalog.seriesOrderBySubjectId === "object"
    && catalog.lessonOrderBySeriesId && typeof catalog.lessonOrderBySeriesId === "object";
}

function resolveArchiveRelativePath(archiveRoot, archivePath) {
  if (typeof archivePath !== "string" || !archivePath.trim() || path.isAbsolute(archivePath)) return null;
  const resolvedRoot = path.resolve(archiveRoot);
  const resolvedPath = path.resolve(resolvedRoot, archivePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) return null;
  return resolvedPath;
}

async function checkMaterializedDocument({ archiveRoot, filePath, expected, kind, id, issues }) {
  const relativePath = relativeToArchive(archiveRoot, filePath);
  if (!(await exists(filePath))) {
    issues.push(issue("error", "catalog.document-missing", `${kind} ${id} besitzt kein materialisiertes Dokument.`, relativePath));
    return;
  }
  try {
    const actual = JSON.parse(await readFile(filePath, "utf8"));
    if (!isDeepStrictEqual(stripMaterializedMetadata(actual), expected)) {
      issues.push(issue(
        "warning",
        "catalog.document-drift",
        `${kind} ${id} weicht vom kanonischen Katalog ab.`,
        relativePath,
      ));
    }
  } catch (error) {
    issues.push(issue(
      "error",
      "catalog.document-invalid",
      `${kind} ${id} kann nicht gelesen werden: ${error instanceof Error ? error.message : String(error)}`,
      relativePath,
    ));
  }
}

function inspectOrderMap({ map, parentIds, itemById, expectedParentKey, code, issues }) {
  for (const [parentId, ids] of Object.entries(map)) {
    if (!parentIds.has(parentId)) {
      issues.push(issue("warning", `${code}.unknown-parent`, `Sortierung verweist auf unbekanntes Elternobjekt ${parentId}.`));
    }
    if (!Array.isArray(ids)) {
      issues.push(issue("error", `${code}.invalid`, `Sortierung für ${parentId} ist keine Liste.`));
      continue;
    }
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) {
      issues.push(issue("warning", `${code}.duplicates`, `Sortierung für ${parentId} enthält doppelte IDs: ${[...new Set(duplicates)].join(", ")}.`));
    }
    for (const id of ids) {
      const item = itemById.get(id);
      if (!item) {
        issues.push(issue("warning", `${code}.unknown-item`, `Sortierung für ${parentId} verweist auf unbekannte ID ${id}.`));
      } else if (item[expectedParentKey] !== parentId) {
        issues.push(issue("warning", `${code}.wrong-parent`, `${id} ist unter ${parentId} einsortiert, gehört aber zu ${item[expectedParentKey]}.`));
      }
    }
  }
}

async function inspectInteractivePackages(archiveRoot, issues) {
  const interactiveRoots = await findDirectoriesNamed(path.join(archiveRoot, "faecher"), "interaktiv");
  let packageCount = 0;
  for (const interactiveRoot of interactiveRoots) {
    for (const entry of await readdir(interactiveRoot, { withFileTypes: true })) {
      const packageRoot = path.join(interactiveRoot, entry.name);
      const relativePath = relativeToArchive(archiveRoot, packageRoot);
      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        issues.push(issue("warning", "html.unexpected-entry", "Der Ordner interaktiv enthält einen Eintrag außerhalb eines Paketordners.", relativePath));
        continue;
      }
      packageCount += 1;
      try {
        await readInteractiveMaterialPackage(packageRoot, relativePath);
      } catch (error) {
        issues.push(issue(
          "error",
          "html.package-invalid",
          error instanceof Error ? error.message : String(error),
          relativePath,
        ));
      }
    }
  }
  return packageCount;
}

async function inspectHistory(archiveRoot, catalog, issues) {
  const locations = [];
  const globalHistoryRoot = path.join(archiveRoot, "_history");
  const globalCount = await countFiles(globalHistoryRoot);
  if (globalCount) locations.push({ path: relativeToArchive(archiveRoot, globalHistoryRoot), count: globalCount });

  for (const lesson of catalog.lessons) {
    if (!safeIdPattern.test(lesson.id ?? "") || !safeIdPattern.test(lesson.subjectId ?? "") || !safeIdPattern.test(lesson.seriesId ?? "")) continue;
    const historyRoot = path.join(
      archiveRoot,
      "faecher",
      lesson.subjectId,
      "reihen",
      lesson.seriesId,
      "stunden",
      lesson.id,
      ".history",
    );
    const count = await countFiles(historyRoot);
    if (count) locations.push({ path: relativeToArchive(archiveRoot, historyRoot), count });
  }

  const unassignedHistoryCount = await countNestedHistoryFiles(path.join(archiveRoot, "_unassigned"));
  const total = locations.reduce((sum, location) => sum + location.count, 0) + unassignedHistoryCount;
  const heavyLocations = locations
    .filter((location) => location.count >= historyWarningThreshold)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  if (heavyLocations.length) {
    issues.push(issue(
      "warning",
      "history.volume",
      `${total.toLocaleString("de-DE")} Historien-Dateien; besonders groß: ${heavyLocations.map((entry) => `${entry.path} (${entry.count})`).join(", ")}.`,
    ));
  } else {
    issues.push(issue("info", "history.volume", `${total.toLocaleString("de-DE")} Historien-Dateien gefunden.`));
  }
  return total;
}

export async function inspectArchive(archiveRoot) {
  const resolvedRoot = await realpath(path.resolve(archiveRoot));
  const issues = [];
  const archivePath = path.join(resolvedRoot, "archive.json");
  let archive;
  try {
    archive = JSON.parse(await readFile(archivePath, "utf8"));
  } catch (error) {
    return {
      archiveRoot: resolvedRoot,
      summary: { errors: 1, warnings: 0, info: 0, subjects: 0, series: 0, lessons: 0, htmlPackages: 0, historyFiles: 0 },
      issues: [issue("error", "archive.unreadable", error instanceof Error ? error.message : String(error), "archive.json")],
    };
  }

  if (archive.format !== archiveFormat || archive.schemaVersion !== 1) {
    issues.push(issue("error", "archive.format", "Archivformat oder Schema-Version wird nicht unterstützt.", "archive.json"));
  }
  if (!Array.isArray(archive.classes) || !validCatalogShape(archive.catalog)) {
    issues.push(issue("error", "archive.shape", "Archivklassen oder Katalogstruktur sind ungültig.", "archive.json"));
    const summary = {
      errors: issues.filter((entry) => entry.level === "error").length,
      warnings: 0,
      info: 0,
      subjects: 0,
      series: 0,
      lessons: 0,
      htmlPackages: 0,
      historyFiles: 0,
    };
    return { archiveRoot: resolvedRoot, summary, issues };
  }

  const catalog = archive.catalog;
  const classes = objectItems(archive.classes, "Klasse", issues);
  const subjects = objectItems(catalog.subjects, "Fach", issues);
  const seriesItems = objectItems(catalog.series, "Reihe", issues);
  const lessons = objectItems(catalog.lessons, "Stunde", issues);
  const classById = new Map(classes.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const seriesById = new Map(seriesItems.map((item) => [item.id, item]));
  const lessonById = new Map(lessons.map((item) => [item.id, item]));

  for (const [kind, items] of [["Klasse", classes], ["Fach", subjects], ["Reihe", seriesItems], ["Stunde", lessons]]) {
    for (const id of duplicateIds(items)) issues.push(issue("error", "catalog.duplicate-id", `${kind}-ID ${id} ist doppelt vorhanden.`));
    for (const item of items) {
      if (!safeIdPattern.test(item?.id ?? "")) issues.push(issue("error", "catalog.invalid-id", `${kind} besitzt eine ungültige ID.`));
    }
  }

  for (const subject of subjects) {
    if (!classById.has(subject.classId)) issues.push(issue("error", "catalog.subject-class", `Fach ${subject.id} verweist auf unbekannte Klasse ${subject.classId}.`));
    if (safeIdPattern.test(subject.id ?? "")) {
      await checkMaterializedDocument({
        archiveRoot: resolvedRoot,
        filePath: path.join(resolvedRoot, "faecher", subject.id, "subject.json"),
        expected: { schemaVersion: 1, ...subject },
        kind: "Fach",
        id: subject.id,
        issues,
      });
    }
  }

  for (const series of seriesItems) {
    const subject = subjectById.get(series.subjectId);
    if (!subject) issues.push(issue("error", "catalog.series-subject", `Reihe ${series.id} verweist auf unbekanntes Fach ${series.subjectId}.`));
    else if (subject.classId !== series.classId) issues.push(issue("error", "catalog.series-class", `Reihe ${series.id} und Fach ${series.subjectId} gehören zu verschiedenen Klassen.`));
    if (safeIdPattern.test(series.id ?? "") && safeIdPattern.test(series.subjectId ?? "")) {
      await checkMaterializedDocument({
        archiveRoot: resolvedRoot,
        filePath: path.join(resolvedRoot, "faecher", series.subjectId, "reihen", series.id, "series.json"),
        expected: { schemaVersion: 1, ...series },
        kind: "Reihe",
        id: series.id,
        issues,
      });
    }
  }

  for (const lesson of lessons) {
    const subject = subjectById.get(lesson.subjectId);
    const series = seriesById.get(lesson.seriesId);
    if (!subject) issues.push(issue("error", "catalog.lesson-subject", `Stunde ${lesson.id} verweist auf unbekanntes Fach ${lesson.subjectId}.`));
    if (!series) issues.push(issue("error", "catalog.lesson-series", `Stunde ${lesson.id} verweist auf unbekannte Reihe ${lesson.seriesId}.`));
    if (subject && subject.classId !== lesson.classId) issues.push(issue("error", "catalog.lesson-class", `Stunde ${lesson.id} und Fach ${lesson.subjectId} gehören zu verschiedenen Klassen.`));
    if (series && (series.subjectId !== lesson.subjectId || series.classId !== lesson.classId)) {
      issues.push(issue("error", "catalog.lesson-hierarchy", `Stunde ${lesson.id} passt nicht zur Hierarchie ihrer Reihe ${lesson.seriesId}.`));
    }

    const basis = lesson.materialBasis;
    if (!basis || basis.scope !== "lesson") {
      issues.push(issue("warning", "material.legacy-basis", `Stunde ${lesson.id} verwendet noch keine eindeutige stundenlokale Materialbasis.`));
    }
    if (basis) {
      const basisPath = resolveArchiveRelativePath(resolvedRoot, basis.archivePath);
      if (!basisPath) issues.push(issue("error", "material.path-invalid", `Stunde ${lesson.id} besitzt einen ungültigen Materialpfad.`));
      else if (!(await exists(basisPath))) issues.push(issue("error", "material.path-missing", `Materialbasis der Stunde ${lesson.id} fehlt.`, relativeToArchive(resolvedRoot, basisPath)));
    }

    if (/\b(?:cli[ -]?test|live canvas test|teststunde)\b/i.test(lesson.title ?? "")) {
      issues.push(issue("warning", "catalog.test-like-lesson", `Stunde „${lesson.title}“ wirkt ausdrücklich als Testbestand; Zugehörigkeit prüfen.`));
    }

    if (safeIdPattern.test(lesson.id ?? "") && safeIdPattern.test(lesson.subjectId ?? "") && safeIdPattern.test(lesson.seriesId ?? "")) {
      await checkMaterializedDocument({
        archiveRoot: resolvedRoot,
        filePath: path.join(resolvedRoot, "faecher", lesson.subjectId, "reihen", lesson.seriesId, "stunden", lesson.id, "lesson.json"),
        expected: { schemaVersion: 1, ...lesson },
        kind: "Stunde",
        id: lesson.id,
        issues,
      });
    }
  }

  for (const hiddenId of catalog.hiddenLessonIds) {
    if (!lessonById.has(hiddenId)) issues.push(issue("warning", "catalog.hidden-unknown", `Verborgene Lesson-ID ${hiddenId} existiert nicht im Katalog.`));
  }

  const lessonsBySubjectAndTitle = new Map();
  for (const lesson of lessons) {
    const key = `${lesson.subjectId}\u0000${String(lesson.title ?? "").trim().toLocaleLowerCase("de-DE")}`;
    const matches = lessonsBySubjectAndTitle.get(key) ?? [];
    matches.push(lesson);
    lessonsBySubjectAndTitle.set(key, matches);
  }
  for (const matches of lessonsBySubjectAndTitle.values()) {
    if (matches.length < 2) continue;
    issues.push(issue(
      "warning",
      "catalog.duplicate-title",
      `Der Stundentitel „${matches[0].title}“ kommt im selben Fach mehrfach vor: ${matches.map((lesson) => lesson.id).join(", ")}.`,
    ));
  }
  inspectOrderMap({
    map: catalog.subjectOrderByClassId,
    parentIds: new Set(classById.keys()),
    itemById: subjectById,
    expectedParentKey: "classId",
    code: "order.subject",
    issues,
  });
  inspectOrderMap({
    map: catalog.seriesOrderBySubjectId,
    parentIds: new Set(subjectById.keys()),
    itemById: seriesById,
    expectedParentKey: "subjectId",
    code: "order.series",
    issues,
  });
  inspectOrderMap({
    map: catalog.lessonOrderBySeriesId,
    parentIds: new Set(seriesById.keys()),
    itemById: lessonById,
    expectedParentKey: "seriesId",
    code: "order.lesson",
    issues,
  });

  const unassignedRoot = path.join(resolvedRoot, "_unassigned");
  const unassignedFiles = await countFiles(unassignedRoot);
  if (unassignedFiles) {
    issues.push(issue("warning", "archive.unassigned", `${unassignedFiles} Dateien liegen unter _unassigned und sind keinem aktuellen Katalogpfad zugeordnet.`, "_unassigned"));
  }

  const htmlPackages = await inspectInteractivePackages(resolvedRoot, issues);
  const historyFiles = await inspectHistory(resolvedRoot, { ...catalog, lessons }, issues);
  issues.push(issue("info", "archive.inventory", `${catalog.subjects.length} Fächer, ${catalog.series.length} Reihen, ${catalog.lessons.length} Stunden und ${htmlPackages} HTML-Pakete geprüft.`));

  return {
    archiveRoot: resolvedRoot,
    summary: {
      errors: issues.filter((entry) => entry.level === "error").length,
      warnings: issues.filter((entry) => entry.level === "warning").length,
      info: issues.filter((entry) => entry.level === "info").length,
      subjects: catalog.subjects.length,
      series: catalog.series.length,
      lessons: catalog.lessons.length,
      htmlPackages,
      historyFiles,
    },
    issues,
  };
}

export function formatArchiveDoctorReport(report) {
  const labels = { error: "FEHLER", warning: "PRÜFEN", info: "INFO" };
  const lines = [
    "Tafelraum Archive Doctor",
    `Archiv: ${report.archiveRoot}`,
    `Status: ${report.summary.errors} Fehler · ${report.summary.warnings} prüfen · ${report.summary.info} Info`,
    "",
  ];
  for (const level of ["error", "warning", "info"]) {
    for (const entry of report.issues.filter((candidate) => candidate.level === level)) {
      lines.push(`${labels[level]} [${entry.code}] ${entry.message}${entry.path ? ` (${entry.path})` : ""}`);
    }
  }
  lines.push("", "Nur Diagnose: Es wurden keine Archivdateien verändert.");
  return `${lines.join("\n")}\n`;
}

function parseArguments(argv) {
  let archiveRoot = path.resolve("data/unterrichtsarchiv");
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") json = true;
    else if (argument === "--archive") {
      if (!argv[index + 1]) throw new Error("Nach --archive fehlt der Archivpfad.");
      archiveRoot = path.resolve(argv[index + 1]);
      index += 1;
    } else if (!argument.startsWith("-")) archiveRoot = path.resolve(argument);
    else throw new Error(`Unbekannte Option: ${argument}`);
  }
  return { archiveRoot, json };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const { archiveRoot, json } = parseArguments(process.argv.slice(2));
    const report = await inspectArchive(archiveRoot);
    process.stdout.write(json ? `${JSON.stringify(report, null, 2)}\n` : formatArchiveDoctorReport(report));
    if (report.summary.errors) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`Archive Doctor konnte nicht starten: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
