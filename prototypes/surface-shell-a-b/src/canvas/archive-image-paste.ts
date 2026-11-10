import type { ExcalidrawElement, ExcalidrawImageElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import { t } from "../i18n/translate";
import { lessonMaterialArchivePath, lessonMaterialToFile, loadLessonMaterials, uploadLessonMaterial } from "../lesson-materials";
import { saveCanvasFiles } from "./canvas-persistence";
import { docResPerspectiveKind, readScanEnhancement, referencedImageFileIds } from "./scan-enhancement";

type ImageClipboardScene = {
  elements: ExcalidrawElement[];
  files?: BinaryFiles;
};

function isClipboardImage(element: ExcalidrawElement): element is ExcalidrawImageElement {
  return element?.type === "image" && !element.isDeleted && element.customData?.role !== "rich-text-rendition-v1";
}

export function readImageClipboardScene(sceneText: string): ImageClipboardScene | null {
  const scene = JSON.parse(sceneText) as ImageClipboardScene | null;
  return Array.isArray(scene?.elements) && scene.elements.some(isClipboardImage) ? scene : null;
}

/** Commit the material and canvas renditions before handing the editable scene to native paste. */
export async function archiveImagePaste(scene: ImageClipboardScene, targetLessonId: string, sourceLessonId?: string) {
  const images = scene.elements.filter(isClipboardImage);
  const unavailable = () => new Error(t("Die Bilddaten sind nicht verfügbar."));
  const files = new Map([...new Set(images.flatMap(referencedImageFileIds))].map(id => {
    const file = scene.files && Object.hasOwn(scene.files, id) ? scene.files[id] : undefined;
    if (file?.id !== id || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(file.dataURL)) throw unavailable();
    return [id, file] as const;
  }));
  if (images.some(image => !image.fileId)) throw unavailable();

  const lookupLessonId = sourceLessonId ?? targetLessonId;
  const source = images.some(image => typeof image.customData?.archiveMaterialPath === "string")
    ? await loadLessonMaterials(lookupLessonId)
    : null;
  const originals = new Map(source?.materials
    .filter(material => material.kind === "image" || material.kind === "pdf")
    .map(material => [lessonMaterialArchivePath(source.basis.archivePath, material.path), material]));
  const archived = new Map<string, Awaited<ReturnType<typeof uploadLessonMaterial>>>();
  const rebound = new Map<string, ExcalidrawImageElement>();
  for (const image of images) {
    const sourcePath = image.customData?.archiveMaterialPath;
    const original = typeof sourcePath === "string" ? originals.get(sourcePath) : undefined;
    if (original && lookupLessonId === targetLessonId) continue;
    const enhancement = readScanEnhancement(image);
    const renditionId = enhancement?.kind === docResPerspectiveKind
      ? enhancement.sourceOriginalFileId
      : enhancement?.originalFileId ?? image.fileId!;
    const key = original ? String(sourcePath) : renditionId;
    let saved = archived.get(key);
    if (!saved) {
      let material: File;
      if (original) {
        material = await lessonMaterialToFile(lookupLessonId, original);
      } else {
        const rendition = files.get(renditionId);
        if (!rendition) throw unavailable();
        const blob = await (await fetch(rendition.dataURL)).blob();
        const extension = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : null;
        if (!extension) throw unavailable();
        const name = image.customData?.sourceFileName;
        const base = typeof name === "string" ? name.replace(/\.[^.]+$/, "") : "image";
        material = new File([blob], `${base}.${extension}`, { type: blob.type });
      }
      saved = await uploadLessonMaterial(targetLessonId, material);
      archived.set(key, saved);
    }
    rebound.set(image.id, {
      ...image,
      customData: {
        ...image.customData,
        archiveMaterialPath: saved.archiveMaterialPath,
        sourceFileName: saved.material.name,
        sourceKind: saved.material.kind,
        sourcePageNumber: saved.material.kind === "pdf" ? image.customData?.sourcePageNumber : undefined,
      },
    });
  }

  await saveCanvasFiles(targetLessonId, [...files.values()]);
  return JSON.stringify({ ...scene, elements: scene.elements.map(element => rebound.get(element.id) ?? element) });
}
