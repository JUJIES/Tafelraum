import assert from "node:assert/strict";
import test from "node:test";
import { formatLessonDate, lessonTitleStorageKey, nextPlanningDate, storedLessonTitle, storedLessonTitleOverride } from "./lesson-labels.ts";
import { defaultLesson } from "./lesson-catalog.ts";

test("shared lesson labels preserve authored titles and ignore historical demo defaults", (t) => {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: (key: string) => values.get(key) ?? null },
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
  const demo = { ...defaultLesson, id: "means-of-transport", title: "Aktueller Archivtitel" };
  values.set(lessonTitleStorageKey(demo.id), "Means of transport");
  assert.equal(storedLessonTitleOverride(demo), null);
  assert.equal(storedLessonTitle(demo), demo.title);
  values.set("surface-lab-lesson-title", "  Eigener alter Titel  ");
  assert.equal(storedLessonTitle(demo), "Eigener alter Titel");
  values.set(lessonTitleStorageKey(demo.id), "  Neuer Titel  ");
  assert.equal(storedLessonTitle(demo), "Neuer Titel");
  const other = { ...demo, id: "other", title: "Andere Stunde" };
  assert.equal(storedLessonTitle(other), "Andere Stunde", "legacy key applies only to the original demo");
  values.set(lessonTitleStorageKey(other.id), "   ");
  assert.equal(storedLessonTitle(other), "Andere Stunde");
});

test("planning date follows the local calendar across month and year boundaries", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date(2026, 11, 31, 23, 30) });
  assert.equal(nextPlanningDate(), "2027-01-01");
  t.mock.timers.setTime(new Date(2028, 1, 28, 23, 30).getTime());
  assert.equal(nextPlanningDate(), "2028-02-29");
  assert.match(formatLessonDate("2028-02-29"), /^29\. Feb\.? 2028$/);
});
