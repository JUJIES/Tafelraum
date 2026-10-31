import { convertToExcalidrawElements, FONT_FAMILY, newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, FileId, NonDeleted } from "@excalidraw/excalidraw/element/types";
import type { CanvasAudioAsset, CanvasImageAsset, CanvasInteractiveHtmlAsset, CanvasLink, CanvasTheme, CanvasVideoAsset, CanvasYouTubeAsset } from "./canvas-port";
import { audioPlayerHeight, audioPlayerWidth, audioPlayerRoundness } from "./audio-embed";
import { videoPlayerHeight, videoPlayerWidth } from "./video-embed";
import { youtubePlayerHeight, youtubePlayerWidth, type YouTubeMaterialElement } from "./youtube-embed";
import { imageAnnotationGroupId } from "./image-annotation-groups";
import { canvasLinkPresentation } from "./canvas-link";

// Engine-native material creation only. Insertion, history, files and persistence
// remain with CanvasSurface and the existing CanvasPort.
const importedImageGap = 56;
const importedImageMaxHeight = 720;
const importedImageMaxWidth = 920;
const videoPlayerRoundness = { type: 3 as const, value: 14 };

export function displaySize(asset: CanvasImageAsset) {
  const scale = Math.min(
    importedImageMaxWidth / asset.pixelWidth,
    importedImageMaxHeight / asset.pixelHeight,
    1,
  );
  return {
    height: asset.pixelHeight * scale,
    width: asset.pixelWidth * scale,
  };
}

export function createImageElements(assets: readonly CanvasImageAsset[], x: number, y: number, centerY = false) {
  let nextX = x;
  return convertToExcalidrawElements(assets.map((asset) => {
          const size = displaySize(asset);
          const x = nextX;
          nextX += size.width + importedImageGap;
          return {
            type: "image" as const,
            x,
            y: centerY ? y - size.height / 2 : y,
            width: size.width,
            height: size.height,
            fileId: asset.id as FileId,
            status: "saved" as const,
            roundness: asset.source.kind === "image" ? { type: 3 as const, value: 20 } : null,
            customData: {
              archiveMaterialPath: asset.source.archiveMaterialPath,
              assetId: asset.id,
              sourceFileName: asset.source.fileName,
              sourceKind: asset.source.kind,
              sourcePageNumber: asset.source.pageNumber,
            },
          };
        }));
}

export function createAudioElement(asset: CanvasAudioAsset, x: number, y: number) {
  const [baseElement] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width: audioPlayerWidth,
    height: audioPlayerHeight,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    opacity: 100,
    roughness: 0,
    roundness: audioPlayerRoundness,
    strokeColor: "transparent",
    strokeWidth: 2,
  }]);
  return {
    ...baseElement,
    customData: {
      archiveMaterialPath: asset.archiveMaterialPath,
      materialKind: "audio",
      sourceFileName: asset.fileName,
      sourceLessonId: asset.lessonId,
      sourceMaterialPath: asset.materialPath,
      sourceMimeType: asset.mimeType,
    },
  } as NonDeleted<ExcalidrawElement>;
}

export function createVideoElement(asset: CanvasVideoAsset, x: number, y: number) {
  const [element] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width: videoPlayerWidth,
    height: videoPlayerHeight,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    opacity: 100,
    roughness: 0,
    roundness: videoPlayerRoundness,
    strokeColor: "transparent",
    strokeWidth: 1,
  }]);
  return {
    ...element,
    groupIds: [imageAnnotationGroupId(element.id)],
    customData: {
      archiveMaterialPath: asset.archiveMaterialPath,
      materialKind: "video",
      sourceFileName: asset.fileName,
      sourceLessonId: asset.lessonId,
      sourceMaterialPath: asset.materialPath,
      sourceMimeType: asset.mimeType,
      sourceTitle: asset.fileName,
    },
  } as NonDeleted<ExcalidrawElement>;
}

export function createInteractiveHtmlElement(
  asset: CanvasInteractiveHtmlAsset,
  x: number,
  y: number,
  size: { width: number; height: number },
) {
  const [element] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width: size.width,
    height: size.height,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    opacity: 100,
    roughness: 0,
    roundness: { type: 3 as const, value: 14 },
    strokeColor: "transparent",
    strokeWidth: 1,
  }]);
  return {
    ...element,
    customData: {
      archiveMaterialPath: asset.archiveMaterialPath,
      materialKind: "interactive-html",
      interactiveHtmlContentZoom: 1,
      interactiveHtmlFrameLayout: "content",
      ...(asset.print?.layout === "shared-pages" ? {interactiveHtmlPageOrientation:asset.print.orientation} : {}),
      interactiveHtmlId: asset.id,
      sourceEntry: asset.entry,
      sourceLessonId: asset.lessonId,
      sourceTitle: asset.title,
    },
  } as NonDeleted<ExcalidrawElement>;
}

export function createEmbeddedAppElement(appId: string, x: number, y: number, width: number, height: number) {
  const [element] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width,
    height,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    opacity: 100,
    roughness: 0,
    roundness: { type: 3 as const, value: 14 },
    strokeColor: "transparent",
    strokeWidth: 1,
  }]);
  return {
    ...element,
    groupIds: [imageAnnotationGroupId(element.id)],
    customData: {
      surfaceKind: "embedded-app",
      embeddedAppId: appId,
      embeddedAppContentZoom: 1,
      interactiveHtmlFrameLayout: "content",
    },
  } as NonDeleted<ExcalidrawElement>;
}

export function createYouTubeElement(asset: CanvasYouTubeAsset, x: number, y: number) {
  const [element] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width: youtubePlayerWidth,
    height: youtubePlayerHeight,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    opacity: 100,
    roughness: 0,
    roundness: null,
    strokeColor: "transparent",
    strokeWidth: 1,
  }]);
  return {
    ...element,
    groupIds: [imageAnnotationGroupId(element.id)],
    customData: {
      archiveMaterialPath: asset.archiveMaterialPath,
      materialKind: "youtube",
      sourceTitle: asset.title,
      sourceUrl: asset.url,
      videoId: asset.videoId,
    },
  } as YouTubeMaterialElement;
}

export function createCanvasLinkElements(link: CanvasLink, x: number, y: number, theme: CanvasTheme) {
  const presentation = canvasLinkPresentation(link.label, theme);
  const [container, text] = convertToExcalidrawElements([{
    type: "rectangle" as const,
    x,
    y,
    width: presentation.width,
    height: presentation.height,
    backgroundColor: presentation.backgroundColor,
    fillStyle: "solid" as const,
    link: link.url,
    opacity: 100,
    roughness: 0,
    roundness: { type: 3 as const, value: 14 },
    strokeColor: presentation.strokeColor,
    strokeWidth: 1,
    label: {
      text: presentation.text,
      fontFamily: FONT_FAMILY.Nunito,
      fontSize: presentation.fontSize,
      textAlign: "center" as const,
      verticalAlign: "middle" as const,
      strokeColor: presentation.textColor,
    },
  }]);
  const linkContainer = {
    ...container,
    ...(link.archiveMaterialPath ? {
      customData: {
        archiveMaterialPath: link.archiveMaterialPath,
        materialKind: "link",
        sourceTitle: link.label,
        sourceUrl: link.url,
      },
    } : {}),
  } as NonDeleted<ExcalidrawElement>;
  const linkText = newElementWith(text, { link: link.url }) as NonDeleted<ExcalidrawElement>;
  return [linkContainer, linkText] as const;
}

