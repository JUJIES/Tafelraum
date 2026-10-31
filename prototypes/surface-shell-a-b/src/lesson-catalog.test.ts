import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLessonClasses,
  copyArchiveItem,
  mergeLocalLessonCatalog,
  reconcileFileAndBrowserCatalog,
  moveArchiveItemToTrash,
  reorderSiblingGroupIds,
  reorderSiblingIds,
  restoreArchiveItem,
  type LocalLessonCatalog,
} from "./lesson-catalog.ts";

function emptyCatalog(): LocalLessonCatalog {
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

test("moves an item before or after a sibling without losing ids", () => {
  assert.deepEqual(reorderSiblingIds(["a", "b", "c"], "c", "a", "before"), ["c", "a", "b"]);
  assert.deepEqual(reorderSiblingIds(["a", "b", "c"], "a", "b", "after"), ["b", "a", "c"]);
  assert.deepEqual(reorderSiblingIds(["a", "b", "c"], "b", "b", "after"), ["a", "b", "c"]);
});

test("moves selected siblings as one stable block", () => {
  assert.deepEqual(
    reorderSiblingGroupIds(["a", "b", "c", "d", "e"], ["d", "b"], "e", "after"),
    ["a", "c", "e", "b", "d"],
  );
  assert.deepEqual(
    reorderSiblingGroupIds(["a", "b", "c", "d", "e"], ["b", "c"], "e", "before"),
    ["a", "d", "b", "c", "e"],
  );
  assert.deepEqual(
    reorderSiblingGroupIds(["a", "b", "c"], ["a", "b"], "b", "after"),
    ["a", "b", "c"],
  );
});

test("applies saved series and lesson order after merging local catalog entries", () => {
  const localCatalog: LocalLessonCatalog = {
    version: 1,
    subjects: [],
    series: [{
      id: "series-local",
      classId: "class-9-10-b",
      subjectId: "subject-english",
      label: "Local series",
    }],
    lessons: [{
      id: "lesson-local",
      classId: "class-9-10-b",
      subjectId: "subject-english",
      seriesId: "series-means-of-transport",
      title: "Local lesson",
      metadata: { scheduledFor: "2026-09-01" },
      seed: { prompt: "", showTransportImage: false },
    }],
    hiddenLessonIds: [],
    trash: [],
    subjectOrderByClassId: {},
    seriesOrderBySubjectId: {
      "subject-english": ["series-local", "series-means-of-transport"],
    },
    lessonOrderBySeriesId: {
      "series-means-of-transport": ["lesson-local", "english-means-2026-08-31-plan", "means-of-transport"],
    },
  };

  const english = buildLessonClasses(localCatalog)[0].subjects[0];
  assert.deepEqual(english.series.map((series) => series.id), ["series-local", "series-means-of-transport"]);
  assert.deepEqual(english.series[1].lessons.map((lesson) => lesson.id), [
    "lesson-local",
    "english-means-2026-08-31-plan",
    "means-of-transport",
    "english-means-2026-08-27",
  ]);
});

test("copies a complete subject into another class with fresh hierarchy ids", () => {
  const catalog = emptyCatalog();
  const classes = buildLessonClasses(catalog);
  let id = 0;
  const result = copyArchiveItem(
    catalog,
    classes,
    { kind: "subject", subject: classes[0].subjects[0] },
    { kind: "class", classId: "class-dinos" },
    (prefix) => `${prefix}-copy-${++id}`,
  );

  assert.equal(result.catalog.subjects[0].classId, "class-dinos");
  assert.equal(result.catalog.subjects[0].label, "Englisch");
  assert.equal(result.catalog.series.length, 1);
  assert.equal(result.catalog.lessons.length, 3);
  assert.equal(result.lessonCopies.length, 3);
  assert.equal(result.rootCopyId, result.catalog.subjects[0].id);
  assert.equal(new Set(result.catalog.lessons.map((lesson) => lesson.id)).size, 3);
  assert.ok(result.catalog.lessons.every((lesson) => lesson.classId === "class-dinos"));
});

test("adds a copy suffix only when the destination already contains the same label", () => {
  const catalog = emptyCatalog();
  const classes = buildLessonClasses(catalog);
  let id = 0;
  const result = copyArchiveItem(
    catalog,
    classes,
    { kind: "lesson", lesson: classes[0].subjects[0].series[0].lessons[0] },
    {
      kind: "series",
      classId: "class-9-10-b",
      subjectId: "subject-english",
      seriesId: "series-means-of-transport",
    },
    (prefix) => `${prefix}-copy-${++id}`,
  );

  assert.equal(result.catalog.lessons[0].title, "Wortfeld und Bewertung – Kopie");
  assert.equal(result.rootCopyId, result.catalog.lessons[0].id);
  assert.deepEqual(
    reorderSiblingIds(
      [...classes[0].subjects[0].series[0].lessons.map((lesson) => lesson.id), result.rootCopyId],
      result.rootCopyId,
      classes[0].subjects[0].series[0].lessons[0].id,
      "after",
    ).slice(0, 2),
    [classes[0].subjects[0].series[0].lessons[0].id, result.rootCopyId],
  );
});

test("uses local subject and series entries as rename overlays for seeded archive folders", () => {
  const catalog = emptyCatalog();
  catalog.subjects.push({ id: "subject-english", classId: "class-9-10-b", label: "English" });
  catalog.series.push({
    id: "series-means-of-transport",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    label: "Transport",
  });

  const english = buildLessonClasses(catalog)[0].subjects[0];
  assert.equal(english.label, "English");
  assert.equal(english.series[0].label, "Transport");
  assert.equal(english.series[0].lessons.length, 3);
});

test("keeps legacy series material explicit but lets copied lessons receive a new own basis", () => {
  const catalog = emptyCatalog();
  const materialBasis = {
    archiveSeriesId: "series-source",
    archivePath: "faecher/subject-source/reihen/series-source",
    sourceMirrorPath: "LER/Reisen",
    sourceMapPath: "_migration/current-source-map.json",
  };
  catalog.subjects.push({ id: "subject-dinos", classId: "class-dinos", label: "LER/WAT" });
  catalog.series.push({
    id: "series-dinos-reisen",
    classId: "class-dinos",
    subjectId: "subject-dinos",
    label: "Reisen",
    materialBasis,
  });
  catalog.lessons.push({
    id: "lesson-einstieg",
    classId: "class-dinos",
    subjectId: "subject-dinos",
    seriesId: "series-dinos-reisen",
    title: "Einstieg: Warum reisen wir?",
    metadata: { scheduledFor: "2026-08-25" },
    seed: { prompt: "", showTransportImage: false },
    materialBasis,
    sourceReferences: [{ path: "LER/Reisen/reihenspiegel.md", evidence: "observed" }],
  });

  const classes = buildLessonClasses(catalog);
  const series = classes[1].subjects[0].series[0];
  assert.deepEqual(series.materialBasis, materialBasis);
  assert.deepEqual(series.lessons[0].materialBasis, materialBasis);

  let id = 0;
  const copied = copyArchiveItem(
    catalog,
    classes,
    { kind: "series", series },
    { kind: "subject", classId: "class-9-10-b", subjectId: "subject-english" },
    (prefix) => `${prefix}-linked-copy-${++id}`,
  );
  assert.deepEqual(copied.catalog.series.at(-1)?.materialBasis, materialBasis);
  assert.equal(copied.catalog.lessons.at(-1)?.materialBasis, undefined);
  assert.deepEqual(copied.catalog.lessons.at(-1)?.sourceReferences, [
    { path: "LER/Reisen/reihenspiegel.md", evidence: "observed" },
  ]);
});

test("uses a file-catalog lesson as a complete overlay for a seeded lesson", () => {
  const catalog = emptyCatalog();
  catalog.lessons.push({
    id: "english-means-2026-08-31-plan",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Advantages and disadvantages",
    metadata: { scheduledFor: "2026-09-02" },
    seed: { prompt: "Updated", notes: "Archive state", showTransportImage: false },
  });

  const lesson = buildLessonClasses(catalog)[0].subjects[0].series[0].lessons
    .find((candidate) => candidate.id === "english-means-2026-08-31-plan");
  assert.equal(lesson?.title, "Advantages and disadvantages");
  assert.equal(lesson?.metadata.scheduledFor, "2026-09-02");
  assert.equal(lesson?.seed.notes, "Archive state");
});

test("keeps an imported or Codex-created lesson without an invented date", () => {
  const catalog = emptyCatalog();
  catalog.lessons.push({
    id: "english-means-open-date",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Offene Anschlussstunde",
    metadata: { scheduledFor: null },
    seed: { prompt: "", showTransportImage: false },
  });

  const lesson = buildLessonClasses(catalog)[0].subjects[0].series[0].lessons
    .find((candidate) => candidate.id === "english-means-open-date");
  assert.equal(lesson?.metadata.scheduledFor, null);
  assert.equal(lesson?.title, "Offene Anschlussstunde");
});

test("merges file and browser catalogs without dropping either side", () => {
  const fileCatalog = emptyCatalog();
  fileCatalog.subjects.push({ id: "subject-file", classId: "class-9-10-b", label: "File" });
  fileCatalog.lessonOrderBySeriesId["series-shared"] = ["lesson-file", "lesson-shared"];
  fileCatalog.trash.push({
    kind: "lesson",
    id: "lesson-file",
    label: "File lesson",
    classId: "class-9-10-b",
    subjectId: "subject-file",
    seriesId: "series-shared",
    deletedAt: "2026-08-30T12:00:00.000Z",
  });
  const browserCatalog = emptyCatalog();
  browserCatalog.subjects.push(
    { id: "subject-file", classId: "class-9-10-b", label: "Renamed in browser" },
    { id: "subject-browser", classId: "class-dinos", label: "Browser" },
  );
  browserCatalog.lessonOrderBySeriesId["series-shared"] = ["lesson-browser", "lesson-shared"];

  const merged = mergeLocalLessonCatalog(fileCatalog, browserCatalog);
  assert.deepEqual(merged.subjects.map((subject) => subject.id), ["subject-file", "subject-browser"]);
  assert.equal(merged.subjects[0].label, "Renamed in browser");
  assert.deepEqual(merged.lessonOrderBySeriesId["series-shared"], ["lesson-browser", "lesson-shared", "lesson-file"]);
  assert.equal(merged.trash.length, 1);
});

test("keeps the file version unless the browser has an unsaved outbox change", () => {
  const fileCatalog = emptyCatalog();
  const browserCatalog = emptyCatalog();
  const sharedLesson = {
    id: "lesson-shared",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    metadata: { scheduledFor: "2026-08-31" },
    seed: { prompt: "", showTransportImage: false },
  };
  fileCatalog.lessons.push({ ...sharedLesson, title: "Current file title" });
  fileCatalog.trash.push({
    kind: "lesson",
    id: "lesson-shared",
    label: "Current file title",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    deletedAt: "2026-08-30T14:00:00.000Z",
  });
  browserCatalog.lessons.push({ ...sharedLesson, title: "Stale browser title" });

  const cleanBrowserMerge = reconcileFileAndBrowserCatalog(fileCatalog, browserCatalog, false);
  const dirtyBrowserMerge = reconcileFileAndBrowserCatalog(fileCatalog, browserCatalog, true);
  assert.equal(cleanBrowserMerge.lessons[0].title, "Current file title");
  assert.equal(cleanBrowserMerge.trash.length, 1);
  assert.equal(dirtyBrowserMerge.lessons[0].title, "Stale browser title");
  assert.equal(dirtyBrowserMerge.trash.length, 0);
});

test("trashes and restores a complete subject without deleting its hierarchy", () => {
  const catalog = emptyCatalog();
  catalog.subjects.push({ id: "subject-local", classId: "class-dinos", label: "Sachkunde" });
  catalog.series.push({ id: "series-local", classId: "class-dinos", subjectId: "subject-local", label: "Fossilien" });
  catalog.lessons.push({
    id: "lesson-local",
    classId: "class-dinos",
    subjectId: "subject-local",
    seriesId: "series-local",
    title: "Spuren lesen",
    metadata: { scheduledFor: "2026-09-01" },
    seed: { prompt: "", showTransportImage: false },
  });
  const trashed = moveArchiveItemToTrash(catalog, {
    kind: "subject",
    id: "subject-local",
    label: "Sachkunde",
    classId: "class-dinos",
    deletedAt: "2026-08-30T12:00:00.000Z",
  });

  assert.equal(buildLessonClasses(trashed)[1].subjects.length, 0);
  assert.equal(trashed.subjects.length, 1);
  assert.equal(trashed.series.length, 1);
  assert.equal(trashed.lessons.length, 1);

  const restored = restoreArchiveItem(trashed, "subject", "subject-local");
  assert.equal(buildLessonClasses(restored)[1].subjects[0].series[0].lessons[0].title, "Spuren lesen");
  assert.equal(restored.trash.length, 0);
});

test("trashes only the selected series or lesson", () => {
  let catalog = emptyCatalog();
  catalog = moveArchiveItemToTrash(catalog, {
    kind: "lesson",
    id: "means-of-transport",
    label: "Wortfeld und Bewertung",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    deletedAt: "2026-08-30T12:00:00.000Z",
  });
  assert.equal(buildLessonClasses(catalog)[0].subjects[0].series[0].lessons.length, 2);

  catalog = moveArchiveItemToTrash(catalog, {
    kind: "series",
    id: "series-means-of-transport",
    label: "Means of transport",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    deletedAt: "2026-08-30T12:01:00.000Z",
  });
  assert.equal(buildLessonClasses(catalog)[0].subjects[0].series.length, 0);
});

test("class trash hides a whole hierarchy without mutating children; restore preserves separate child trash", () => {
  const catalog = emptyCatalog();
  const initial = buildLessonClasses(catalog);
  const group = initial[0];
  const subject = group.subjects[0];
  const childTrash = {kind: "subject" as const, id: subject.id, label: subject.label, classId: group.id, deletedAt: "2026-10-30"};
  const withChildTrash = moveArchiveItemToTrash(catalog, childTrash);
  const archived = moveArchiveItemToTrash(withChildTrash, {kind:"class", id:group.id, classId:group.id, label:group.label, deletedAt:"2026-10-30"});
  assert.equal(buildLessonClasses(archived).some(entry => entry.id === group.id), false);
  assert.deepEqual(archived.lessons, catalog.lessons);
  assert.deepEqual(archived.subjects, catalog.subjects);
  const restored = restoreArchiveItem(archived, "class", group.id);
  assert.deepEqual(buildLessonClasses(restored), buildLessonClasses(withChildTrash));
  assert.deepEqual(initial[0], group);
});

test("class removal protects the last class and active lesson while allowing unused empty classes", async () => {
  const {classTrashUnavailableReason} = await import("./lesson-catalog.ts");
  const classes = buildLessonClasses(emptyCatalog());
  const activeId = classes[0].subjects[0].series[0].lessons[0].id;
  const empty = {id:"empty", label:"Empty", subjects:[]};
  assert.ok(classTrashUnavailableReason([classes[0]], classes[0].id, activeId));
  assert.ok(classTrashUnavailableReason([classes[0], empty], classes[0].id, activeId));
  assert.equal(classTrashUnavailableReason([classes[0], empty], empty.id, activeId), undefined);
  const alternative = {...classes[0], id:"alternative"};
  assert.equal(classTrashUnavailableReason([classes[0], alternative], classes[0].id, activeId), undefined);
});

test("class tombstones survive the browser catalog reader; mismatched class identities are rejected", async () => {
  const {loadLocalLessonCatalog} = await import("./lesson-catalog.ts");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const catalog = emptyCatalog();
  const valid = {kind:"class",id:"group",classId:"group",label:"Group",deletedAt:"2026-10-30"};
  Object.defineProperty(globalThis,"window",{configurable:true,value:{localStorage:{getItem:()=>JSON.stringify({...catalog,trash:[valid,{...valid,id:"mismatch"}]})}}});
  try { assert.deepEqual(loadLocalLessonCatalog().trash,[valid]); }
  finally { if(previous)Object.defineProperty(globalThis,"window",previous);else Reflect.deleteProperty(globalThis,"window"); }
});
