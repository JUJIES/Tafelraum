import { t } from "./i18n/translate.ts";
import type { MaterialRemoval } from "../material-removal.mjs";
export const lessonMaterialDragMime = "application/x-tafelraum-lesson-material";

export type LessonAudioMimeType =
  | "audio/mpeg"
  | "audio/mp4"
  | "audio/aac"
  | "audio/wav"
  | "audio/ogg"
  | "audio/webm"
  | "audio/flac";

export type LessonVideoMimeType = "video/mp4";

type LessonMaterialBase = {
  displayName?: string;
  path: string;
  name: string;
  folder: string | null;
  size: number;
  modifiedAt: string;
};

export type LessonMaterial = LessonMaterialBase & (
  | { kind: "image"; mimeType: "image/png" | "image/jpeg" | "image/webp" }
  | { kind: "pdf"; mimeType: "application/pdf" }
  | { kind: "audio"; mimeType: LessonAudioMimeType }
  | { kind: "video"; mimeType: LessonVideoMimeType }
  | {
    kind: "interactive";
    mimeType: "text/html";
    id: string;
    entry: string;
    print: {
      entry: string;
      page: "A4";
      orientation: "portrait" | "landscape";
      mode: "template";
    layout?: "shared-pages";
    } | null;
    defaultViewport: { width: number; height: number };
  }
  | {
    kind: "link";
    mimeType: "text/uri-list";
    provider: "youtube";
    url: string;
    videoId: string;
  }
  | {
    kind: "link";
    mimeType: "text/uri-list";
    provider: "web";
    url: string;
  }
);

export function lessonMaterialDisplayName(material: Pick<LessonMaterial, "name" | "displayName">) {
  return material.displayName ?? material.name;
}

export async function renameLessonMaterial(lessonId: string, material: LessonMaterial, displayName: string) {
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: material.path, displayName, previousDisplayName: lessonMaterialDisplayName(material) }),
  });
  if (!response.ok) throw new Error(await materialError(response));
  return (await response.json() as { material: LessonMaterial }).material;
}

export function moveLessonMaterial(materials: readonly LessonMaterial[], sourcePath: string, targetPath: string, position: "before" | "after") {
  const source = materials.find(material => material.path === sourcePath);
  if (!source || sourcePath === targetPath || !materials.some(material => material.path === targetPath)) return [...materials];
  const next = materials.filter(material => material.path !== sourcePath);
  const index = next.findIndex(material => material.path === targetPath);
  next.splice(index + (position === "after" ? 1 : 0), 0, source);
  return next;
}

export async function reorderLessonMaterials(lessonId: string, paths: string[], previousPaths: string[]) {
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/order`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({paths, previousPaths}),
  });
  if (!response.ok) throw new Error(await materialError(response));
  return (await response.json() as {materials: LessonMaterial[]}).materials;
}

export type LessonMaterialCollection = {
  lessonId: string;
  basis: {
    archiveSeriesId: string;
    archivePath: string;
    label: string;
    scope: "lesson" | "series";
  };
  materials: LessonMaterial[];
};

export type LessonMaterialUsage = {
  archivePaths: readonly string[];
  legacyFileNames: readonly string[];
};

export type LessonMaterialWithUsage = {
  material: LessonMaterial;
  used: boolean;
};

export function lessonMaterialsWithUsage(
  materials: readonly LessonMaterial[],
  basisArchivePath: string,
  usage: LessonMaterialUsage,
): LessonMaterialWithUsage[] {
  const usedArchivePaths = new Set(usage.archivePaths);
  const fileNameCounts = new Map<string, number>();
  for (const material of materials) {
    fileNameCounts.set(material.name, (fileNameCounts.get(material.name) ?? 0) + 1);
  }
  const unambiguousLegacyFileNames = new Set(
    usage.legacyFileNames.filter((fileName) => fileNameCounts.get(fileName) === 1),
  );

  return materials.map((material) => ({
    material,
    used: usedArchivePaths.has(lessonMaterialArchivePath(basisArchivePath, material.path))
      || unambiguousLegacyFileNames.has(material.name),
  }));
}

export function lessonMaterialArchivePath(basisArchivePath: string, materialPath: string) {
  return `${basisArchivePath.replace(/\/+$/, "")}/${materialPath.replace(/^\/+/, "")}`;
}

async function materialError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? t("Materialzugriff fehlgeschlagen ({0}).", response.status);
}

export function lessonMaterialFileUrl(lessonId: string, materialPath: string) {
  const query = new URLSearchParams({ path: materialPath });
  return `/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/file?${query}`;
}

export function lessonInteractiveMaterialUrl(lessonId: string, materialId: string, resourcePath: string) {
  const resource = resourcePath.split("/").map(encodeURIComponent).join("/");
  return `/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/interactive/${encodeURIComponent(materialId)}/${resource}`;
}

export async function loadLessonMaterials(lessonId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials`, {
    signal, cache: "no-store",
  });
  if (!response.ok) throw new Error(await materialError(response));
  return await response.json() as LessonMaterialCollection;
}

export async function lessonMaterialToFile(lessonId: string, material: LessonMaterial, signal?: AbortSignal) {
  if (material.kind === "link" || material.kind === "interactive") {
    throw new Error("Dieses Material ist keine einzelne lokale Datei.");
  }
  const response = await fetch(lessonMaterialFileUrl(lessonId, material.path), { signal, cache: "no-store" });
  if (!response.ok) throw new Error(await materialError(response));
  const blob = await response.blob();
  return new File([blob], material.name, {
    type: material.mimeType,
    lastModified: Date.parse(material.modifiedAt) || Date.now(),
  });
}

export async function uploadLessonMaterial(lessonId: string, file: File) {
  const query = new URLSearchParams({ name: file.name });
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/file?${query}`, {
    method: "PUT",
    headers: file.type ? { "Content-Type": file.type } : undefined,
    body: file,
  });
  if (!response.ok) throw new Error(await materialError(response));
  return await response.json() as { archiveMaterialPath: string; created: boolean; material: LessonMaterial };
}

export async function saveLessonMaterialLink(lessonId: string, url: string) {
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error(await materialError(response));
  return await response.json() as {
    archiveMaterialPath: string;
    created: boolean;
    material: Extract<LessonMaterial, { kind: "link" }>;
  };
}

export type LessonMaterialDragPayload = {
  legacyFileName?: string;
  archiveMaterialPath?: string;
  lessonId: string;
  material: LessonMaterial;
};

export function parseLessonMaterialDragPayload(value: string): LessonMaterialDragPayload | null {
  try {
    const candidate = JSON.parse(value) as Partial<LessonMaterialDragPayload>;
    if (typeof candidate.lessonId !== "string" || !candidate.material || typeof candidate.material.path !== "string") return null;
    if (candidate.archiveMaterialPath !== undefined && typeof candidate.archiveMaterialPath !== "string") return null;
    if (candidate.legacyFileName !== undefined && typeof candidate.legacyFileName !== "string") return null;
    return candidate as LessonMaterialDragPayload;
  } catch {
    return null;
  }
}

export async function loadMaterialRemovals(): Promise<MaterialRemoval[]> {
  const response = await fetch("/api/archive/material-removals", {cache: "no-store"});
  if (!response.ok) throw new Error(await materialError(response));
  return (await response.json()).removals;
}
export async function removeLessonMaterial(lessonId: string, materialPath: string): Promise<MaterialRemoval[]> {
  const response = await fetch(`/api/archive/lessons/${encodeURIComponent(lessonId)}/materials`, {
    method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify({path: materialPath}),
  });
  if (!response.ok) throw new Error(await materialError(response));
  return (await response.json()).removals;
}
