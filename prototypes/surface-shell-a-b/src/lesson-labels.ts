import { uiLanguageTag } from "./i18n/locale.ts";
import type { TestLesson } from "./lesson-catalog";

// Shared lesson labels, including the existing browser-cache compatibility path.
const legacyLessonTitleStorageKey = "surface-lab-lesson-title";

const legacyDefaultTitlesByLessonId: Record<string, string[]> = {
  "means-of-transport": ["Means of transport", "Means of transport · Einstieg", "Wortfeld und Bewertung"],
  "english-means-2026-08-27": ["Private and public transport"],
  "english-means-2026-08-31-plan": ["Means of transport · 31.08.", "Language support & Transport Challenge"],
};

const lessonDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function lessonTitleStorageKey(lessonId: string) {
  return `surface-lab-lesson-title:${lessonId}`;
}

export function formatLessonDate(date: string) {
  return new Intl.DateTimeFormat(uiLanguageTag(), lessonDateOptions).format(new Date(`${date}T12:00:00`));
}

export function nextPlanningDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function storedLessonTitleOverride(lesson: TestLesson) {
  const legacyDefaults = legacyDefaultTitlesByLessonId[lesson.id] ?? [];
  const storedValue = window.localStorage.getItem(lessonTitleStorageKey(lesson.id))?.trim();
  if (storedValue && !legacyDefaults.includes(storedValue)) return storedValue;
  if (lesson.id === "means-of-transport") {
    const legacyValue = window.localStorage.getItem(legacyLessonTitleStorageKey)?.trim();
    if (legacyValue && !legacyDefaults.includes(legacyValue)) return legacyValue;
  }
  return null;
}

export function storedLessonTitle(lesson: TestLesson) {
  return storedLessonTitleOverride(lesson) ?? lesson.title;
}

