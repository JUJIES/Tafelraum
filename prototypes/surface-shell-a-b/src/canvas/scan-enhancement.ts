import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import type { DataURL } from "@excalidraw/excalidraw/types";

export const scanEnhancementKind = "scan-contrast-v1";
export const docResEnhancementKind = "docres-appearance-v1";
export const docResPerspectiveKind = "docres-perspective-v1";

export type ScanEnhancement = {
  originalAssetId: string;
  originalFileId: FileId;
} & ({kind: typeof scanEnhancementKind | typeof docResEnhancementKind}
  | {kind: typeof docResPerspectiveKind; sourceOriginalFileId: FileId; enhancedFileId: FileId});

function smoothStep(start: number, end: number, value: number) {
  const position = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return position * position * (3 - 2 * position);
}

export function enhanceScanPixels(pixels: Uint8ClampedArray) {
  const enhanced = new Uint8ClampedArray(pixels);
  for (let offset = 0; offset < enhanced.length; offset += 4) {
    const red = enhanced[offset];
    const green = enhanced[offset + 1];
    const blue = enhanced[offset + 2];
    if (enhanced[offset + 3] === 0) continue;

    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    if (luminance <= 96 || luminance >= 250) continue;

    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    const neutralWeight = 1 - Math.min(1, chroma / 80) * 0.55;
    const lightInkWeight = smoothStep(96, 180, luminance);
    const darkening = (255 - luminance) * 0.55 * neutralWeight * lightInkWeight;

    enhanced[offset] = Math.max(0, red - darkening);
    enhanced[offset + 1] = Math.max(0, green - darkening);
    enhanced[offset + 2] = Math.max(0, blue - darkening);
  }
  return enhanced;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<DataURL>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as DataURL), { once: true });
    reader.addEventListener("error", () => reject(reader.error), { once: true });
    reader.readAsDataURL(blob);
  });
}

export async function createScanEnhancedImage(source: DataURL) {
  const response = await fetch(source);
  if (!response.ok) throw new Error("Bilddaten konnten nicht gelesen werden.");
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!context) throw new Error("Bild konnte nicht bearbeitet werden.");
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    image.data.set(enhanceScanPixels(image.data));
    context.putImageData(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Bild konnte nicht gespeichert werden.")), "image/png");
    });
    return {
      dataURL: await blobToDataUrl(blob),
      height: canvas.height,
      width: canvas.width,
    };
  } finally {
    bitmap.close();
  }
}

export function readScanEnhancement(element: ExcalidrawElement | null | undefined): ScanEnhancement | null {
  const candidate = element?.customData?.scanEnhancement;
  if (!candidate || typeof candidate !== "object") return null;
  const record = candidate as Record<string, unknown>;
  return (record.kind === scanEnhancementKind || record.kind === docResEnhancementKind
      || record.kind === docResPerspectiveKind && typeof record.sourceOriginalFileId === 'string' && typeof record.enhancedFileId === 'string')
    && typeof record.originalFileId === "string"
    && typeof record.originalAssetId === "string"
    ? record as ScanEnhancement
    : null;
}

export function isScanEnhancementActive(element: ExcalidrawElement) {
  const enhancement=readScanEnhancement(element);
  return enhancement !== null && (enhancement.kind !== docResPerspectiveKind || element.type === 'image' && element.fileId !== enhancement.originalFileId);
}

export function referencedImageFileIds(element: ExcalidrawElement) {
  if (element.type !== "image" || element.isDeleted || !element.fileId
    || element.customData?.role === "rich-text-rendition-v1") return [];
  const enhancement = readScanEnhancement(element);
  return [...new Set([element.fileId, ...(enhancement ? [enhancement.originalFileId] : []),
    ...(enhancement?.kind === docResPerspectiveKind ? [enhancement.enhancedFileId, enhancement.sourceOriginalFileId] : [])])];
}
