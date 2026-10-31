import { t } from "./i18n/translate.ts";
export type LessonSeed = {
  prompt: string;
  notes?: string;
  showTransportImage: boolean;
};

export type LessonMetadata = {
  scheduledFor: string | null;
};

export type ArchiveMaterialBasis = {
  archiveSeriesId: string;
  archivePath: string;
  scope?: "lesson" | "series";
  sourceMirrorPath?: string;
  sourceMapPath?: string;
};

export type ArchiveSourceReference = {
  path: string;
  evidence: "observed" | "user-confirmed" | "reconstructed" | "planned";
};

export type TestLesson = {
  id: string;
  classId: string;
  subjectId: string;
  seriesId: string;
  title: string;
  metadata: LessonMetadata;
  seed: LessonSeed;
  materialBasis?: ArchiveMaterialBasis;
  sourceReferences?: ArchiveSourceReference[];
};

export type LessonSeries = {
  id: string;
  label: string;
  lessons: TestLesson[];
  materialBasis?: ArchiveMaterialBasis;
  archiveRole?: "navigation" | "material-basis";
};

export type LessonSubject = {
  id: string;
  label: string;
  series: LessonSeries[];
};

export type LessonClass = {
  id: string;
  label: string;
  subjects: LessonSubject[];
};

export type ArchiveClassDefinition = Pick<LessonClass, "id" | "label">;

export type LocalLessonSeries = {
  id: string;
  classId: string;
  subjectId: string;
  label: string;
  materialBasis?: ArchiveMaterialBasis;
  archiveRole?: "navigation" | "material-basis";
};

export type LocalLessonSubject = {
  id: string;
  classId: string;
  label: string;
};

export type ArchiveTrashItem =
  | { kind: "class"; id: string; label: string; classId: string; deletedAt: string }
  | { kind: "subject"; id: string; label: string; classId: string; deletedAt: string }
  | { kind: "series"; id: string; label: string; classId: string; subjectId: string; deletedAt: string }
  | { kind: "lesson"; id: string; label: string; classId: string; subjectId: string; seriesId: string; deletedAt: string };

export type LocalLessonCatalog = {
  version: 1;
  subjects: LocalLessonSubject[];
  series: LocalLessonSeries[];
  lessons: TestLesson[];
  hiddenLessonIds: string[];
  trash: ArchiveTrashItem[];
  subjectOrderByClassId: Record<string, string[]>;
  seriesOrderBySubjectId: Record<string, string[]>;
  lessonOrderBySeriesId: Record<string, string[]>;
};

const localLessonCatalogStorageKey = "surface-lab-local-lesson-catalog-v1";
const emptyLocalLessonCatalog = (): LocalLessonCatalog => ({
  version: 1,
  subjects: [],
  series: [],
  lessons: [],
  hiddenLessonIds: [],
  trash: [],
  subjectOrderByClassId: {},
  seriesOrderBySubjectId: {},
  lessonOrderBySeriesId: {},
});

function mergeById<T extends { id: string }>(existing: readonly T[], incoming: readonly T[]) {
  const merged = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

function mergeOrderMap(existing: Record<string, string[]>, incoming: Record<string, string[]>) {
  const merged = { ...existing };
  for (const [parentId, incomingIds] of Object.entries(incoming)) {
    merged[parentId] = [...new Set([...incomingIds, ...(existing[parentId] ?? [])])];
  }
  return merged;
}

/**
 * Additively combines the file archive with a browser catalog. Items from the
 * incoming catalog win on identical ids, while ids known only on either side
 * are retained. This is the migration boundary from the former browser-only
 * archive to the file archive.
 */
export function mergeLocalLessonCatalog(existing: LocalLessonCatalog, incoming: LocalLessonCatalog): LocalLessonCatalog {
  const trash = new Map(existing.trash.map((item) => [`${item.kind}:${item.id}`, item]));
  for (const item of incoming.trash) trash.set(`${item.kind}:${item.id}`, item);
  return {
    version: 1,
    subjects: mergeById(existing.subjects, incoming.subjects),
    series: mergeById(existing.series, incoming.series),
    lessons: mergeById(existing.lessons, incoming.lessons),
    hiddenLessonIds: [...new Set([...existing.hiddenLessonIds, ...incoming.hiddenLessonIds])],
    trash: [...trash.values()],
    subjectOrderByClassId: mergeOrderMap(existing.subjectOrderByClassId, incoming.subjectOrderByClassId),
    seriesOrderBySubjectId: mergeOrderMap(existing.seriesOrderBySubjectId, incoming.seriesOrderBySubjectId),
    lessonOrderBySeriesId: mergeOrderMap(existing.lessonOrderBySeriesId, incoming.lessonOrderBySeriesId),
  };
}

export function reconcileFileAndBrowserCatalog(
  fileCatalog: LocalLessonCatalog,
  browserCatalog: LocalLessonCatalog,
  browserHasUnsavedChanges: boolean,
) {
  const merged = browserHasUnsavedChanges
    ? mergeLocalLessonCatalog(fileCatalog, browserCatalog)
    : mergeLocalLessonCatalog(browserCatalog, fileCatalog);
  const authoritativeCatalog = browserHasUnsavedChanges ? browserCatalog : fileCatalog;
  return {
    ...merged,
    hiddenLessonIds: [...authoritativeCatalog.hiddenLessonIds],
    trash: [...authoritativeCatalog.trash],
  };
}

const englishLessons: TestLesson[] = [
  {
    id: "means-of-transport",
    classId: "class-9-10-b",
    subjectId: "subject-english",
    seriesId: "series-means-of-transport",
    title: "Wortfeld und Bewertung",
    metadata: { scheduledFor: "2026-08-24" },
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
    seed: {
      prompt: "Language support",
      notes: "Sentence starters · model dialogue\nUseful vocabulary\n\nNext: Transport Challenge\nTrain · plane · bus · ferry",
      showTransportImage: true,
    },
  },
];

export const lessonClasses: LessonClass[] = [
  {
    id: "class-9-10-b",
    label: "9/10 B-Kurs",
    subjects: [
      {
        id: "subject-english",
        label: "Englisch",
        series: [
          {
            id: "series-means-of-transport",
            label: "Means of transport",
            lessons: englishLessons,
          },
        ],
      },
    ],
  },
  {
    id: "class-dinos",
    label: "Dinos",
    subjects: [],
  },
];

export const defaultLesson = englishLessons[2];

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isArchiveMaterialBasis(value: unknown): value is ArchiveMaterialBasis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ArchiveMaterialBasis>;
  return isString(candidate.archiveSeriesId)
    && isString(candidate.archivePath)
    && (candidate.scope === undefined || candidate.scope === "lesson" || candidate.scope === "series")
    && (candidate.sourceMirrorPath === undefined || isString(candidate.sourceMirrorPath))
    && (candidate.sourceMapPath === undefined || isString(candidate.sourceMapPath));
}

function isArchiveSourceReference(value: unknown): value is ArchiveSourceReference {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ArchiveSourceReference>;
  return isString(candidate.path) && (
    candidate.evidence === "observed"
    || candidate.evidence === "user-confirmed"
    || candidate.evidence === "reconstructed"
    || candidate.evidence === "planned"
  );
}

function isLocalSeries(value: unknown): value is LocalLessonSeries {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalLessonSeries>;
  return isString(candidate.id)
    && isString(candidate.classId)
    && isString(candidate.subjectId)
    && isString(candidate.label)
    && (candidate.materialBasis === undefined || isArchiveMaterialBasis(candidate.materialBasis))
    && (candidate.archiveRole === undefined
      || candidate.archiveRole === "navigation"
      || candidate.archiveRole === "material-basis");
}

function isLocalSubject(value: unknown): value is LocalLessonSubject {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalLessonSubject>;
  return isString(candidate.id) && isString(candidate.classId) && isString(candidate.label);
}

function isLocalLesson(value: unknown): value is TestLesson {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TestLesson>;
  return isString(candidate.id)
    && isString(candidate.classId)
    && isString(candidate.subjectId)
    && isString(candidate.seriesId)
    && isString(candidate.title)
    && Boolean(candidate.metadata
      && (candidate.metadata.scheduledFor === null || isString(candidate.metadata.scheduledFor)))
    && Boolean(candidate.seed && typeof candidate.seed.prompt === "string" && typeof candidate.seed.showTransportImage === "boolean")
    && (candidate.materialBasis === undefined || isArchiveMaterialBasis(candidate.materialBasis))
    && (candidate.sourceReferences === undefined
      || (Array.isArray(candidate.sourceReferences) && candidate.sourceReferences.every(isArchiveSourceReference)));
}

function isArchiveTrashItem(value: unknown): value is ArchiveTrashItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (!isString(candidate.kind) || !isString(candidate.id) || !isString(candidate.label)
    || !isString(candidate.classId) || !isString(candidate.deletedAt)) return false;
  if (candidate.kind === "class") return candidate.id === candidate.classId;
  if (candidate.kind === "subject") return true;
  if (!isString(candidate.subjectId)) return false;
  if (candidate.kind === "series") return true;
  return candidate.kind === "lesson" && isString(candidate.seriesId);
}

function readOrderMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, ids]) => isString(key) && Array.isArray(ids))
    .map(([key, ids]) => [key, [...new Set((ids as unknown[]).filter(isString))]]));
}

function orderBySavedIds<T extends { id: string }>(items: T[], savedIds: string[] | undefined) {
  if (!savedIds?.length) return items;
  const rank = new Map(savedIds.map((id, index) => [id, index]));
  return [...items].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank === undefined && rightRank === undefined) return 0;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return leftRank - rightRank;
  });
}

export type CatalogOrderLevel = "subject" | "series" | "lesson";
export type CatalogDropPosition = "before" | "after";

export type ArchiveClipboardItem =
  | { kind: "subject"; subject: LessonSubject }
  | { kind: "series"; series: LessonSeries }
  | { kind: "lesson"; lesson: TestLesson };

export type ArchivePasteTarget =
  | { kind: "class"; classId: string }
  | { kind: "subject"; classId: string; subjectId: string }
  | { kind: "series"; classId: string; subjectId: string; seriesId: string };

export type ArchiveCopyResult = {
  catalog: LocalLessonCatalog;
  rootCopyId: string;
  lessonCopies: Array<{ sourceLessonId: string; targetLessonId: string }>;
};

export function canPasteArchiveItem(item: ArchiveClipboardItem, target: ArchivePasteTarget) {
  return (item.kind === "subject" && target.kind === "class")
    || (item.kind === "series" && target.kind === "subject")
    || (item.kind === "lesson" && target.kind === "series");
}

function uniqueCopyLabel(label: string, existingLabels: string[]) {
  if (!existingLabels.includes(label)) return label;
  const copyLabel = t("{0} – Kopie", label);
  if (!existingLabels.includes(copyLabel)) return copyLabel;
  let copyNumber = 2;
  while (existingLabels.includes(`${copyLabel} ${copyNumber}`)) copyNumber += 1;
  return `${copyLabel} ${copyNumber}`;
}

export function copyArchiveItem(
  catalog: LocalLessonCatalog,
  classes: LessonClass[],
  item: ArchiveClipboardItem,
  target: ArchivePasteTarget,
  makeId: (prefix: "subject" | "series" | "lesson") => string,
): ArchiveCopyResult {
  if (!canPasteArchiveItem(item, target)) throw new Error("Kopiertes Element und Ziel passen nicht zusammen.");

  const nextCatalog: LocalLessonCatalog = {
    ...catalog,
    subjects: [...catalog.subjects],
    series: [...catalog.series],
    lessons: [...catalog.lessons],
  };
  const lessonCopies: ArchiveCopyResult["lessonCopies"] = [];

  const copyLesson = (source: TestLesson, classId: string, subjectId: string, seriesId: string, title = source.title) => {
    const targetLessonId = makeId("lesson");
    const lessonCopy: TestLesson = {
      ...source,
      id: targetLessonId,
      classId,
      subjectId,
      seriesId,
      title,
      metadata: { ...source.metadata },
      seed: { ...source.seed },
    };
    delete lessonCopy.materialBasis;
    nextCatalog.lessons.push(lessonCopy);
    lessonCopies.push({ sourceLessonId: source.id, targetLessonId });
    return targetLessonId;
  };

  const copySeries = (source: LessonSeries, classId: string, subjectId: string, label = source.label) => {
    const targetSeriesId = makeId("series");
    nextCatalog.series.push({
      id: targetSeriesId,
      classId,
      subjectId,
      label,
      ...(source.materialBasis ? { materialBasis: { ...source.materialBasis } } : {}),
      archiveRole: "navigation",
    });
    for (const lesson of source.lessons) copyLesson(lesson, classId, subjectId, targetSeriesId);
    return targetSeriesId;
  };

  let rootCopyId: string;
  if (item.kind === "subject" && target.kind === "class") {
    const targetClass = classes.find((candidate) => candidate.id === target.classId);
    if (!targetClass) throw new Error("Zielklasse wurde nicht gefunden.");
    const targetSubjectId = makeId("subject");
    const label = uniqueCopyLabel(item.subject.label, targetClass.subjects.map((subject) => subject.label));
    nextCatalog.subjects.push({ id: targetSubjectId, classId: target.classId, label });
    for (const series of item.subject.series) copySeries(series, target.classId, targetSubjectId);
    rootCopyId = targetSubjectId;
  } else if (item.kind === "series" && target.kind === "subject") {
    const targetSubject = classes
      .find((candidate) => candidate.id === target.classId)
      ?.subjects.find((candidate) => candidate.id === target.subjectId);
    if (!targetSubject) throw new Error("Zielfach wurde nicht gefunden.");
    const label = uniqueCopyLabel(item.series.label, targetSubject.series.map((series) => series.label));
    rootCopyId = copySeries(item.series, target.classId, target.subjectId, label);
  } else if (item.kind === "lesson" && target.kind === "series") {
    const targetSeries = classes
      .find((candidate) => candidate.id === target.classId)
      ?.subjects.find((candidate) => candidate.id === target.subjectId)
      ?.series.find((candidate) => candidate.id === target.seriesId);
    if (!targetSeries) throw new Error("Zielreihe wurde nicht gefunden.");
    const label = uniqueCopyLabel(item.lesson.title, targetSeries.lessons.map((lesson) => lesson.title));
    rootCopyId = copyLesson(item.lesson, target.classId, target.subjectId, target.seriesId, label);
  } else {
    throw new Error("Kopiertes Element und Ziel passen nicht zusammen.");
  }

  return { catalog: nextCatalog, rootCopyId, lessonCopies };
}

export function reorderSiblingIds(ids: string[], sourceId: string, targetId: string, position: CatalogDropPosition) {
  return reorderSiblingGroupIds(ids, [sourceId], targetId, position);
}

export function reorderSiblingGroupIds(ids: string[], sourceIds: string[], targetId: string, position: CatalogDropPosition) {
  const sourceIdSet = new Set(sourceIds.filter((id) => ids.includes(id)));
  if (sourceIdSet.size === 0 || sourceIdSet.has(targetId) || !ids.includes(targetId)) return ids;
  const orderedSourceIds = ids.filter((id) => sourceIdSet.has(id));
  const withoutSource = ids.filter((id) => !sourceIdSet.has(id));
  const targetIndex = withoutSource.indexOf(targetId);
  const insertionIndex = position === "before" ? targetIndex : targetIndex + 1;
  withoutSource.splice(insertionIndex, 0, ...orderedSourceIds);
  return withoutSource;
}

export function withCatalogOrder(catalog: LocalLessonCatalog, level: CatalogOrderLevel, parentId: string, orderedIds: string[]): LocalLessonCatalog {
  const normalizedIds = [...new Set(orderedIds.filter(isString))];
  if (level === "subject") {
    return { ...catalog, subjectOrderByClassId: { ...catalog.subjectOrderByClassId, [parentId]: normalizedIds } };
  }
  if (level === "series") {
    return { ...catalog, seriesOrderBySubjectId: { ...catalog.seriesOrderBySubjectId, [parentId]: normalizedIds } };
  }
  return { ...catalog, lessonOrderBySeriesId: { ...catalog.lessonOrderBySeriesId, [parentId]: normalizedIds } };
}

// The current shell requires a class and an active lesson; avoid a new empty-app mode.
export function classTrashUnavailableReason(classes: LessonClass[], classId: string, activeLessonId: string): string | undefined {
  if (classes.length <= 1) return "Die letzte Klasse oder der letzte Kurs bleibt erhalten.";
  const hasActiveLesson = (entry: LessonClass) => entry.subjects.some(subject => subject.series.some(series => series.lessons.some(lesson => lesson.id === activeLessonId)));
  const target = classes.find(entry => entry.id === classId);
  const hasOtherLesson = classes.some(entry => entry.id !== classId && entry.subjects.some(subject => subject.series.some(series => series.lessons.length > 0)));
  if (target && hasActiveLesson(target) && !hasOtherLesson) return "Lege zuerst einen Unterricht in einer anderen Klasse oder einem anderen Kurs an.";
  return undefined;
}

export function moveArchiveItemToTrash(catalog: LocalLessonCatalog, item: ArchiveTrashItem): LocalLessonCatalog {
  const trash = catalog.trash.filter((candidate) => candidate.kind !== item.kind || candidate.id !== item.id);
  return { ...catalog, trash: [...trash, item] };
}

export function restoreArchiveItem(catalog: LocalLessonCatalog, kind: ArchiveTrashItem["kind"], id: string): LocalLessonCatalog {
  return { ...catalog, trash: catalog.trash.filter((candidate) => candidate.kind !== kind || candidate.id !== id) };
}

export function loadLocalLessonCatalog(): LocalLessonCatalog {
  if (typeof window === "undefined") return emptyLocalLessonCatalog();
  const storedValue = window.localStorage.getItem(localLessonCatalogStorageKey);
  if (!storedValue) return emptyLocalLessonCatalog();

  try {
    const parsed = JSON.parse(storedValue) as Partial<LocalLessonCatalog>;
    if (parsed.version !== 1 || !Array.isArray(parsed.series) || !Array.isArray(parsed.lessons)) return emptyLocalLessonCatalog();
    return {
      version: 1,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects.filter(isLocalSubject) : [],
      series: parsed.series.filter(isLocalSeries),
      lessons: parsed.lessons.filter(isLocalLesson),
      hiddenLessonIds: Array.isArray(parsed.hiddenLessonIds) ? parsed.hiddenLessonIds.filter(isString) : [],
      trash: Array.isArray(parsed.trash) ? parsed.trash.filter(isArchiveTrashItem) : [],
      subjectOrderByClassId: readOrderMap(parsed.subjectOrderByClassId),
      seriesOrderBySubjectId: readOrderMap(parsed.seriesOrderBySubjectId),
      lessonOrderBySeriesId: readOrderMap(parsed.lessonOrderBySeriesId),
    };
  } catch {
    return emptyLocalLessonCatalog();
  }
}

export function saveLocalLessonCatalog(catalog: LocalLessonCatalog) {
  window.localStorage.setItem(localLessonCatalogStorageKey, JSON.stringify(catalog));
}

export function buildLessonClasses(
  localCatalog: LocalLessonCatalog,
  baseClasses: readonly (ArchiveClassDefinition | LessonClass)[] = lessonClasses,
): LessonClass[] {
  const hiddenLessonIds = new Set(localCatalog.hiddenLessonIds);
  const trashedSubjectIds = new Set(localCatalog.trash.filter((item) => item.kind === "subject").map((item) => item.id));
  const trashedSeriesIds = new Set(localCatalog.trash.filter((item) => item.kind === "series").map((item) => item.id));
  const trashedLessonIds = new Set(localCatalog.trash.filter((item) => item.kind === "lesson").map((item) => item.id));
  const trashedClassIds = new Set(localCatalog.trash.filter((item) => item.kind === "class").map((item) => item.id));
  const classes = baseClasses.filter((entry) => !trashedClassIds.has(entry.id)).map((lessonClass) => ({
    ...lessonClass,
    subjects: ("subjects" in lessonClass ? lessonClass.subjects : []).map((subject) => ({
      ...subject,
      series: subject.series.map((series) => ({
        ...series,
        lessons: series.lessons.filter((lesson) => !hiddenLessonIds.has(lesson.id)),
      })),
    })),
  }));

  for (const localSubject of localCatalog.subjects) {
    const lessonClass = classes.find((candidate) => candidate.id === localSubject.classId);
    if (!lessonClass) continue;
    const existingSubject = lessonClass.subjects.find((candidate) => candidate.id === localSubject.id);
    if (existingSubject) existingSubject.label = localSubject.label;
    else lessonClass.subjects.push({ id: localSubject.id, label: localSubject.label, series: [] });
  }

  for (const localSeries of localCatalog.series) {
    if (localSeries.archiveRole === "material-basis") continue;
    const lessonClass = classes.find((candidate) => candidate.id === localSeries.classId);
    const subject = lessonClass?.subjects.find((candidate) => candidate.id === localSeries.subjectId);
    if (!subject) continue;
    const existingSeries = subject.series.find((candidate) => candidate.id === localSeries.id);
    if (existingSeries) {
      existingSeries.label = localSeries.label;
      existingSeries.materialBasis = localSeries.materialBasis ? { ...localSeries.materialBasis } : undefined;
      existingSeries.archiveRole = localSeries.archiveRole;
    } else {
      subject.series.push({
        id: localSeries.id,
        label: localSeries.label,
        lessons: [],
        ...(localSeries.materialBasis ? { materialBasis: { ...localSeries.materialBasis } } : {}),
        archiveRole: localSeries.archiveRole,
      });
    }
  }

  for (const localLesson of localCatalog.lessons) {
    if (hiddenLessonIds.has(localLesson.id)) continue;
    const lessonClass = classes.find((candidate) => candidate.id === localLesson.classId);
    const subject = lessonClass?.subjects.find((candidate) => candidate.id === localLesson.subjectId);
    const series = subject?.series.find((candidate) => candidate.id === localLesson.seriesId);
    if (!series) continue;
    const existingLessonIndex = series.lessons.findIndex((candidate) => candidate.id === localLesson.id);
    if (existingLessonIndex === -1) series.lessons.push(localLesson);
    else series.lessons[existingLessonIndex] = {
      ...localLesson,
      metadata: { ...localLesson.metadata },
      seed: { ...localLesson.seed },
    };
  }

  for (const lessonClass of classes) {
    lessonClass.subjects = orderBySavedIds(lessonClass.subjects, localCatalog.subjectOrderByClassId[lessonClass.id]);
    for (const subject of lessonClass.subjects) {
      subject.series = orderBySavedIds(subject.series, localCatalog.seriesOrderBySubjectId[subject.id]);
      for (const series of subject.series) {
        series.lessons = orderBySavedIds(series.lessons, localCatalog.lessonOrderBySeriesId[series.id]);
      }
    }
  }

  for (const lessonClass of classes) {
    lessonClass.subjects = lessonClass.subjects
      .filter((subject) => !trashedSubjectIds.has(subject.id))
      .map((subject) => ({
        ...subject,
        series: subject.series
          .filter((series) => !trashedSeriesIds.has(series.id))
          .map((series) => ({
            ...series,
            lessons: series.lessons.filter((lesson) => !trashedLessonIds.has(lesson.id)),
          })),
      }));
  }

  return classes;
}

export function findLesson(lessonId: string, classes: LessonClass[] = lessonClasses) {
  for (const lessonClass of classes) {
    for (const subject of lessonClass.subjects) {
      for (const series of subject.series) {
        const lesson = series.lessons.find((candidate) => candidate.id === lessonId);
        if (lesson) return lesson;
      }
    }
  }
  return defaultLesson;
}
