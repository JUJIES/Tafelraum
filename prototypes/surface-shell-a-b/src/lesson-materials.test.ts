import assert from "node:assert/strict";
import test from "node:test";
import { moveLessonMaterial, lessonMaterialsWithUsage, type LessonMaterial } from "./lesson-materials.ts";

function material(path: string, name = path.split("/").at(-1) ?? path): LessonMaterial {
  return {
    path,
    name,
    folder: path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : null,
    kind: path.endsWith(".pdf") ? "pdf" : "image",
    mimeType: path.endsWith(".pdf") ? "application/pdf" : "image/png",
    size: 1,
    modifiedAt: "2026-08-30T00:00:00.000Z",
  };
}

test("keeps material visible and marks archive paths already present on the canvas", () => {
  const materials = [material("impulse/nachhaltigkeit.png"), material("arbeitsblaetter/reiseethik.pdf")];
  assert.deepEqual(lessonMaterialsWithUsage(materials, "faecher/ler/reisen", {
    archivePaths: ["faecher/ler/reisen/impulse/nachhaltigkeit.png"],
    legacyFileNames: [],
  }), [
    { material: materials[0], used: true },
    { material: materials[1], used: false },
  ]);
});

test("removes only the usage mark when an archive path is no longer used", () => {
  const materials = [material("impulse/nachhaltigkeit.png")];
  assert.deepEqual(
    lessonMaterialsWithUsage(materials, "faecher/ler/reisen", { archivePaths: [], legacyFileNames: [] }),
    [{ material: materials[0], used: false }],
  );
});

test("uses legacy filenames only when they identify one archive material", () => {
  const unique = material("impulse/nachhaltigkeit.png", "nachhaltigkeit.png");
  const duplicateA = material("a/karte.png", "karte.png");
  const duplicateB = material("b/karte.png", "karte.png");
  assert.deepEqual(lessonMaterialsWithUsage([unique, duplicateA, duplicateB], "faecher/ler/reisen", {
    archivePaths: [],
    legacyFileNames: ["nachhaltigkeit.png", "karte.png"],
  }), [
    { material: unique, used: true },
    { material: duplicateA, used: false },
    { material: duplicateB, used: false },
  ]);
});


test("custom archive names never change source matching or stable material order", async () => {
  const { lessonMaterialDisplayName } = await import("./lesson-materials.ts");
  const first = { ...material("01.png", "01.png"), displayName: "Start" };
  const second = { ...material("02.png", "02.png"), displayName: "Start" };
  const entries = lessonMaterialsWithUsage([first, second], "material", {
    archivePaths: [], legacyFileNames: ["01.png"],
  });
  assert.deepEqual(entries.map(entry => entry.used), [true, false]);
  assert.deepEqual(entries.map(entry => entry.material.path), ["01.png", "02.png"]);
  assert.equal(lessonMaterialDisplayName(first), "Start");
  assert.equal(lessonMaterialDisplayName(material("03.png", "03.png")), "03.png");
});


test("material moves insert before or after stable paths without changing source objects", () => {
  const original = [material("a.png"), material("b.png"), material("c.png")];
  assert.deepEqual(moveLessonMaterial(original, "a.png", "c.png", "after"), [original[1], original[2], original[0]]);
  assert.deepEqual(moveLessonMaterial(original, "c.png", "a.png", "before"), [original[2], original[0], original[1]]);
  assert.deepEqual(moveLessonMaterial(original, "a.png", "b.png", "before"), original);
  assert.deepEqual(moveLessonMaterial(original, "a.png", "a.png", "after"), original);
  assert.deepEqual(moveLessonMaterial(original, "missing", "a.png", "before"), original);
  assert.deepEqual(original.map(item => item.path), ["a.png", "b.png", "c.png"]);
});
