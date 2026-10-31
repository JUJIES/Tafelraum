import { convertToExcalidrawElements, newElementWith } from "@excalidraw/excalidraw";
import type { BinaryFileData, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, ExcalidrawImageElement, ExcalidrawTextElement, FileId } from "@excalidraw/excalidraw/element/types";
import { hasBulletedParagraph, scaleRichText, rasterizeRichText, readRichText, rebaseRichText, richTextFromNative, type RichText, type RichTextRaster } from "./rich-text.ts";
import { boundTextY, inferLegacyBoundTextAlign } from "./bound-text-vertical-align.ts";

export const richTextImageRole = "rich-text-rendition-v1";
const rasterCache = new Map<FileId, RichTextRaster>();

/** addFiles initializes the engine bitmap cache for images already in its
 * scene. Install new rendition references first, then their actual bytes. */
export function applyRichTextScene(api:ExcalidrawImperativeAPI,scene:ReturnType<typeof reconcileRichTextScene>,
  captureUpdate:Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['captureUpdate']) {
  if(scene.changed)api.updateScene({elements:scene.elements,captureUpdate});
  const missing=scene.files.filter(file=>!api.getFiles()[file.id]);
  if(missing.length)api.addFiles(missing);
}
let rasterGeneration = 0;
export function clearRichTextRasterCache() {
  rasterCache.clear();
  // A font can become available after the first raster was added to Excalidraw.
  // A new file ID also invalidates its image cache, not just our layout cache.
  rasterGeneration += 1;
}

export function richTextOf(element: ExcalidrawElement | null | undefined): RichText | null {
  if (element?.type !== "text") return null;
  const stored = readRichText(element.customData?.richText);
  return stored ?? (hasBulletedParagraph(element.originalText ?? element.text) ? richTextFromNative(element) : null);
}

export function richTextImageSourceId(element: ExcalidrawElement): string | null {
  return element.type === "image" && element.customData?.role === richTextImageRole
    && typeof element.customData.richTextSourceId === "string"
    ? element.customData.richTextSourceId : null;
}

function renditionFileId(sourceId: string, content: string): FileId {
  let first = 2166136261, second = 2246822519;
  for (let i = 0; i < content.length; i += 1) {
    first = Math.imul(first ^ content.charCodeAt(i), 16777619);
    second = Math.imul(second ^ content.charCodeAt(i), 3266489917);
  }
  return `rich-${sourceId}-${rasterGeneration}-${(first >>> 0).toString(16)}${(second >>> 0).toString(16)}` as FileId;
}

/** The semantic document lives only on the native text element. Image files are
 * deterministic, rebuildable renditions, never an independent text database. */
export function reconcileRichTextScene(elements: readonly ExcalidrawElement[], hiddenTextId?: string | null, deferRenditionForTextId?: string | null, resizingTextId?: string | null): {
  changed: boolean;
  elements: ExcalidrawElement[];
  files: BinaryFileData[];
} {
  const sources = new Map(elements.filter((element): element is ExcalidrawTextElement => (
    element.type === "text" && !element.isDeleted && richTextOf(element) !== null
  )).map(element => [element.id, element]));
  const shapes = new Map(elements.filter((element) => !element.isDeleted
    && (element.type === "rectangle" || element.type === "ellipse" || element.type === "diamond"))
    .map(element => [element.id, element]));
  const existing = new Map(elements.flatMap(element => {
    const id = richTextImageSourceId(element);
    return id ? [[id, element as ExcalidrawImageElement] as const] : [];
  }));
  const files: BinaryFileData[] = [];
  const renditions = new Map<string, ExcalidrawImageElement>();
  const nextSources = new Map<string, ExcalidrawTextElement>();
  for (const source of sources.values()) {
    const original = richTextOf(source)!;
    const rebased = rebaseRichText(original, source.originalText ?? source.text);
    const resizing = source.id === resizingTextId;
    // Native corner gestures scale fontSize. Keep that baseline aligned with
    // the first semantic span between gestures, then scale all spans together.
    const richText = resizing && rebased.runs.length
      ? scaleRichText(rebased, source.fontSize / rebased.runs[0].style.fontSize) : rebased;
    const nativeFontSize = richText.runs[0]?.style.fontSize ?? source.fontSize;
    const wrap = Boolean(source.containerId) || !source.autoResize;
    const nextFileId = renditionFileId(source.id, JSON.stringify([richText, wrap ? source.width : null, source.lineHeight]));
    let raster = rasterCache.get(nextFileId);
    if (!raster) {
      raster = rasterizeRichText(richText, source.width, wrap, source.lineHeight);
      rasterCache.set(nextFileId, raster);
      if (rasterCache.size > 64) rasterCache.delete(rasterCache.keys().next().value!);
    }
    const previous = existing.get(source.id);
    // During a resize the direct preview is not painted on the first frame.
    // Keep the already loaded image until it can take over; a fresh fileId
    // would otherwise make Excalidraw draw its missing-image placeholder.
    const retainedFileId = source.id === deferRenditionForTextId ? previous?.fileId : null;
    const fileId: FileId = retainedFileId ?? nextFileId;
    const deferNewFile = fileId !== nextFileId;
    if (!deferNewFile) files.push({ id: fileId, dataURL: raster.dataURL, mimeType: "image/png", created: Date.now() });
    const shape = source.containerId ? shapes.get(source.containerId) : null;
    const storedAlign = source.verticalAlign === "top" || source.verticalAlign === "bottom" ? source.verticalAlign : "middle";
    const normalizedAlign = shape && source.customData?.richTextVerticalAnchorV1 !== true
      ? inferLegacyBoundTextAlign(shape, source.y, raster.height, storedAlign)
      : storedAlign;
    const targetY = !resizing && shape ? boundTextY(shape, raster.height, normalizedAlign) : source.y;
    const normalizedSource = shape && source.customData?.richTextVerticalAnchorV1 !== true;
    const positionedSource = !resizing && (source.width !== (wrap ? source.width : raster.width) || source.height !== raster.height
      || Math.abs(source.y - targetY) > 0.01 || normalizedAlign !== source.verticalAlign || normalizedSource)
      ? newElementWith(source, {
        width: wrap ? source.width : raster.width,
        height: raster.height,
        y: targetY,
        verticalAlign: normalizedAlign,
        ...(normalizedSource ? { customData: { ...source.customData, richTextVerticalAnchorV1: true } } : {}),
      })
      : source;
    const common = {
      x: positionedSource.x, y: positionedSource.y, width: raster.width, height: raster.height,
      angle: positionedSource.angle, fileId, status: "saved" as const, scale: [1, 1] as [1, 1],
      opacity: source.id === hiddenTextId ? 0 : 100,
      customData: { role: richTextImageRole, richTextSourceId: source.id },
      groupIds: [],
      locked: true,
    };
    const rendition = previous
      ? newElementWith(previous, common)
      : convertToExcalidrawElements([{ type: "image", id: `rich-image-${source.id}`, ...common }], { regenerateIds: false })[0] as ExcalidrawImageElement;
    renditions.set(source.id, rendition);
    nextSources.set(source.id, positionedSource.strokeColor === "transparent" && original === richText && positionedSource.fontSize === nativeFontSize
      ? positionedSource : newElementWith(positionedSource, { strokeColor: "transparent", fontSize: nativeFontSize, customData: { ...positionedSource.customData, richText } }));
  }
  const output: ExcalidrawElement[] = [];
  let changed = false;
  for (const element of elements) {
    const imageSourceId = richTextImageSourceId(element);
    if (imageSourceId) {
      if (!sources.has(imageSourceId)) changed = true;
      continue;
    }
    const source = nextSources.get(element.id);
    if (source) {
      const rendition = renditions.get(element.id)!;
      const previous = existing.get(element.id);
      if (!previous || previous.fileId !== rendition.fileId || previous.x !== rendition.x || previous.y !== rendition.y
        || previous.width !== rendition.width || previous.height !== rendition.height || previous.angle !== rendition.angle
        || previous.opacity !== rendition.opacity
        || previous.groupIds.length !== 0
        || source !== element) changed = true;
      output.push(rendition, source);
    } else output.push(element);
  }
  return { changed, elements: output, files };
}
