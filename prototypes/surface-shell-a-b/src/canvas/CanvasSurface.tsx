import { t, useUiLocale, uiLanguageTag } from "../i18n";
import { displaySize, createImageElements, createAudioElement, createVideoElement, createInteractiveHtmlElement, createEmbeddedAppElement, createYouTubeElement, createCanvasLinkElements } from "./material-elements";
import { createCanvasAgent } from "./canvas-agent";
import { getImageCornerRadius } from "./material-appearance";
import type { AgentMaterial } from "./agent-materials";
import { annotationAfterIndependentMove, annotationScrollProjection, independentAnnotationMovePatch, isIndependentMaterialAnnotation } from "./annotation-move";
import { withoutTemporaryEraserState } from "./eraser-policy";
import { coverPolygonBounds, coverSweepPath } from "./cover-sweep-geometry";
import {normalizeHtmlPageFrames} from "./material-transform";
import {HtmlPageSelection} from "./HtmlPageSelection";
import { htmlPagePlacement, readHtmlPageOrientation } from "./interactive-html-pages";
import { dispatchWheelToCanvas } from "./projected-media-gestures";
import { TextBoxSelection } from "./TextBoxSelection";
import { TimerRuntime, timerConfig, timerHeight, timerWidth, defaultTimerDuration, isTimerWidget } from "../widgets/timer";
import { TimerWidgetLayer } from "../widgets/TimerWidgetLayer";
import { TimerSound } from "../widgets/timer-sound";
import { getInteractiveHtmlControlsBounds, hasContentOnlyHtmlFrame, normalizeInteractiveHtmlFrameGeometry } from "./interactive-html-frame-geometry";
import { pruneRemovedMaterials, type MaterialRemoval } from "../../material-removal.mjs";
import type { LaserToolState } from "../live/LaserTool";
import { HostPointerOverlay } from "../live/HostPointerOverlay";
import { ClipLayer, type ClipControls } from "../live/ClipLayer";
import { readClipFrames, type PresentationClip } from "./clip-frames";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  exportToBlob,
  FONT_FAMILY,
  getCommonBounds,
  getSceneVersion,
  newElementWith,
  sceneCoordsToViewportCoords,
  serializeAsJSON,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import { ALargeSmall, AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, Blend, Check, ChevronDown, ChevronUp, Copy, Crop, Eye, EyeOff, GripVertical, Italic, List, LoaderCircle, LocateFixed, Lock, LockOpen, MonitorUp, Move, Printer, RotateCcw, Save, Scan, Square, SquareSlash, Strikethrough, TextCursorInput, Trash2, TriangleAlert, Underline, WandSparkles } from "lucide-react";
import type {
  AppState,
  BinaryFileData,
  DataURL,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
  ExcalidrawTextElement,
  FileId,
  NonDeleted,
  TextAlign,
} from "@excalidraw/excalidraw/element/types";
import transportImage from "../assets/demo/transport-set.png";
import type {
  BasicShape,
  CanvasAudioAsset,
  CanvasPort,
  CanvasTheme,
  CanvasTool,
  CanvasToolContext,
  ShapeFillMode,
} from "./canvas-port";
import { rotateElementAroundSelectionCenter } from "./selection-rotation";
import {
  canvasCoverGroupId,
  canvasCoverShapeForTarget,
  canvasCoverStrokeWidth,
  canvasCoverTargetMembers,
  isPlainCanvasCoverTarget,
  resolvePlainCanvasCoverTarget,
} from "./canvas-cover-target";
import { CoverSweep } from "./cover-sweep";
import type { CoverSweepGeometry } from "./cover-sweep-geometry";
import { isMarkerRibbonElement, markerContainsPoint, markerOpacity, markerRole } from "./marker-stroke";
import { penRole } from "./pen-stroke";
import { useInkInput } from "./useInkInput";
import { audioPlayerHeight, audioPlayerWidth, audioPlayerRoundness } from "./audio-embed";
import { AudioCanvasPlayer, type AudioCanvasPlayerFrame } from "./AudioCanvasPlayer";
import { VideoCanvasPlayer, type VideoCanvasPlayerFrame } from "./VideoCanvasPlayer";
import { InteractiveHtmlCanvasFrame, type InteractiveHtmlCanvasFrameData } from "./InteractiveHtmlCanvasFrame";
import { YouTubeCanvasPlayer, type YouTubeCanvasPlayerFrame } from "./YouTubeCanvasPlayer";
import { isLocalVideoMaterialElement, videoPlayerHeight, videoPlayerWidth } from "./video-embed";
import { getInteractiveHtmlCanvasPan, getInteractiveHtmlCanvasZoom, getInteractiveHtmlPlacementSize, interactiveHtmlDefersToCanvasTool, isInteractiveHtmlMaterialElement, normalizeInteractiveHtmlContentZoom, type InteractiveHtmlMaterialMoveMessage, type InteractiveHtmlPanMessage, type InteractiveHtmlScrollOffset, type InteractiveHtmlWheelPanMessage, type InteractiveHtmlZoomMessage } from "./interactive-html-embed";
import {
  getYouTubePlaceholderPatch,
  getYouTubePlayerProjectionSize,
  getYouTubeProviderControlsHeight,
  getYouTubeProviderTopControlsHeight,
  isYouTubeMaterialElement,
  youtubePlayerHeight,
  youtubePlayerWidth,
} from "./youtube-embed";
import { allowsNativeTextDoubleClick, editableShapeAboveImageAtPoint, existingTextSelectionTarget, isBasicShapeType } from "./canvas-double-click";
import type { LessonSeed } from "../lesson-catalog";
import { loadMaterialRemovals, lessonInteractiveMaterialUrl, lessonMaterialFileUrl } from "../lesson-materials";
import { shouldPrepareTemporaryPan } from "../tool-shortcuts";
import {
  materialFocusCanvasOffsets,
  getElementFocusDimPanels,
  nextElementFocusIds,
  shouldRetargetElementFocus,
} from "./element-focus";
import {
  loadCanvasFiles,
  loadCanvasSnapshot,
  saveCanvasFiles,
  saveCanvasSnapshot,
  type StoredCanvasSnapshot,
} from "./canvas-persistence";
import { fileCanvasSaveStatus, flushFileCanvasSnapshot, loadFileCanvasSnapshot } from "../archive-file-persistence";
import { CanvasRecoveryDialog } from "./CanvasRecoveryDialog";
import type { CanvasRecoveryChoice, ResolveCanvasRecovery } from "./canvas-persistence";
import {
  attachNewAnnotationsToCanvasTargets,
  constrainImageCoversToImages,
  findTopmostImageAtPoint,
  getImageAnnotationBundle,
  getCanvasAnnotationSelectionIntent,
  getCanvasAnnotationEditingGroupId,
  imageAnnotationGroupId,
  isImageAnnotationGroupId,
  isShapeAnnotationGroupId,
  preservesIndependentImageAnnotationMultiSelection,
  prepareCanvasAnnotationGroups,
  prepareCanvasAnnotationsForEraser,
  gateMarkerEraserHits,
  shapeAnnotationGroupPrefix,
  restoreCanvasAnnotationsAfterEraser,
} from "./image-annotation-groups";
import { getMaterialBundleElements, translateMaterialBundleElements } from "./material-bundle-drag";
import { projectInteractiveHtmlAnnotations, createInteractiveHtmlAnnotationScene, type InteractiveHtmlAnnotationScene } from "./interactive-html-annotations";
import {
  applyInteractiveHtmlState,
  getInteractiveHtmlState,
  getInteractiveHtmlPrintCapability,
  requestInteractiveHtmlState,
  resetInteractiveHtmlState,
  subscribeInteractiveHtmlPrintCapabilities,
  subscribeInteractiveHtmlState,
} from "./interactive-html-live";
import {
  countUnsavedInteractiveHtmlChanges,
  readStoredInteractiveHtmlStates,
  withInteractiveHtmlState,
  withoutInteractiveHtmlState,
  type StoredInteractiveHtmlStates,
} from "./interactive-html-persistence";
import type { JsonValue } from "../../../../shared/live-canvas/protocol";
import { openExternalWebUrl } from "./external-link";
import { findTopmostMaterialAnnotationTargetAtPoint } from "./material-annotation-targets";
import { canPrintImageSourceDirectly, openImagePrintDialog } from "./image-print";
import { openInteractiveHtmlPrintDialog } from "./interactive-html-print";
import {
  applyImageCropRect,
  imageCropRectFromPoints,
  imageCropRectFromTrimHandle,
  shouldExitImageCropUi,
  type ImageCropTrimHandle,
  type NormalizedImageCropRect,
} from "./image-crop";
import { snapImageRotation } from "./rotation-snap";
import { nativeRotationHandleOffset, pointerHitsNativeRotationHandle } from "./image-rotation-handle";
import {textBoxRotationOffset,textBoxHandleSpacing} from "./text-box-geometry";
import { getImageQuickActionLayout, getTextEntryMinimumWidth } from "./image-quick-actions";
import { createScanEnhancedImage, readScanEnhancement, referencedImageFileIds, scanEnhancementKind, docResEnhancementKind, docResPerspectiveKind, isScanEnhancementActive } from "./scan-enhancement";
import { DocumentImageEditor, requestDocumentImage, wholeDocumentPhoto, type DocumentImageResult, type DocumentImageSelection } from "./DocumentImageEditor";
import { documentImageCropAllowed, documentImageTargetUnchanged, centeredDocumentPerspective } from "./document-image-state";
import { updateOneShotCreation, type PendingOneShotCreation } from "./one-shot-creation";
import {
  archiveMaterialElements,
  nextArchiveMaterialElement,
  canvasMaterialUsageFromElements,
  emptyCanvasMaterialUsage,
  sameCanvasMaterialUsage,
  type CanvasMaterialUsage,
} from "./material-usage";
import { canvasBackgrounds, defaultThemeVariants } from "../theme-preferences";
import { automaticTextColor, canvasBackgroundAtPoint, isNeutralTextColor, annotationColorFollowsCanvas } from "./text-background-color";
import { shapeBackgroundColor, shapeColorOptions, shapeTextColor } from "./shape-colors";
import { clampShapeToolbarPosition, shapeToolbarDockAt, shapeToolbarDockPosition, shapeToolbarHorizontalSize, shapeToolbarSideSize, type ShapeToolbarDock } from "./shape-toolbar-docking";
import { adaptiveTextColors, themeRichText, alignRichText, richTextAlignment, layoutRichText, rebaseRichText, richTextFromNative, styleRichText, type RichTextStyle } from "./rich-text";
import { applyRichTextScene, clearRichTextRasterCache, reconcileRichTextScene, richTextOf, richTextImageSourceId } from "./rich-text-scene";
import { boundTextY, type BoundTextVerticalAlign } from "./bound-text-vertical-align";
import { RichTextSelectionOverlay } from "./RichTextSelectionOverlay";
import { richTextOffsetAtPoint, richTextParagraphRange, richTextWordRange } from "./rich-text-selection";
import {
  embeddedAppById,
  shouldPreserveBrowserPlusShortcut,
  isEmbeddedAppElement,
} from "../embedded-apps";
import {
  getProjectedMediaWheelIntent,
  hasCanvasZoomModifier,
} from "./projected-media-gestures";
import { rememberInternalImageCopy } from "./internal-image-clipboard";
import { isExternalTextPaste } from "../clipboard-import";
import {
  forgetImageCover,
  imageCoverBelongsTo,
  imageCoverRectToScene,
  imageCoverRole,
  imagePointToNormalized,
  initialImageCoverEdge,
  initialImageCoverRect,
  isImageCoverElement,
  isImageCoverFull,
  nearestImageCoverEdge,
  recallImageCover,
  rememberImageCover,
  transformImageCoverRect,
  type ImageCoverHandle,
  type ImageCoverEdge,
  type ImageCoverRect,
} from "./image-cover";
import { coverRectForTarget, isShapedCoverTarget, shapedCoverGeometry } from "./canvas-cover-geometry";

type CanvasSurfaceProps = {
  canvasBackgroundColor?: string;
  clipControls?: ClipControls;
  interactiveLiveControls?: { accessFor(elementId:string):'locked'|'all'; setAccess(elementId:string,mode:'locked'|'all'):void };
  materialControls?: {timerActive?:boolean;showTimer?(id:string):void;mediaId?:string|null;fullscreen?:import('./useVideoFullscreen').VideoFullscreenControls;active:boolean;activeId:string|null;show(elementId:string):void;
    playback(elementId:string,playing:boolean,position:number,volume?:number):void};
  laserControls?: LaserToolState;
  activeShape: BasicShape;
  activeTool: CanvasTool;
  markerColor: string;
  markerStrokeWidth: number;
  materialShadows: boolean;
  lessonId: string;
  lessonSeed: LessonSeed;
  onMaterialUsageChange(usage: CanvasMaterialUsage): void;
  onMaterialFocusChange?(usage: CanvasMaterialUsage): void;
  getFocusViewport?(): { left: number; top: number; width: number; height: number } | undefined;
  onPortReady(port: CanvasPort | null): void;
  onTimerRuntimeReady?(runtime: TimerRuntime | null): void;
  onLiveApiReady?(api: ExcalidrawImperativeAPI | null): void;
  onLiveInkPreviewChange?(elementId: string | null): void;
  onShapeColorChange(color: string): void;
  onShapeFillChange(fillMode: ShapeFillMode): void;
  onTemporaryPanChange(active: boolean): void;
  onToolChange(tool: CanvasTool): void;
  onZoomChange(zoomPercent: number): void;
  penColor: string;
  penStrokeWidth: number;
  shapeColor: string;
  shapeFill: ShapeFillMode;
  theme: CanvasTheme;
};


type ImageControls = {
  imageId: ExcalidrawImageElement["id"];
  rotate: { x: number; y: number };
};

type ImageTransformDrag = {
  imageId: ExcalidrawImageElement["id"];
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startElement: ExcalidrawImageElement;
  startElements: readonly ExcalidrawElement[];
  centerScene: { x: number; y: number };
  centerViewport: { x: number; y: number };
  startPointerAngle: number;
};

type ImageTransformPreview = {
  angle: number;
  centerX: number;
  centerY: number;
  height: number;
  width: number;
};

type AnnotationMoveDrag = {
  elementId: ExcalidrawElement["id"];
  moved: boolean;
  onMoved?: () => void;
  pointerId: number;
  preservesNativeClick?: boolean;
  startElement: ExcalidrawElement;
  startPointer: { x: number; y: number };
};

type InteractiveHtmlPanDrag = {
  elementId: ExcalidrawElement["id"];
  lastViewportPoint: { x: number; y: number };
  pointerId: number;
};

type ImageQuickActions = {
  center: { x: number; y: number };
  cover: { x: number; y: number };
  crop: { x: number; y: number };
  enhance: { x: number; y: number };
  focus: { x: number; y: number };
  hasCover: boolean;
  isEnhanced: boolean;
  imageId: ExcalidrawImageElement["id"];
  isCropping: boolean;
  print: { x: number; y: number };
};

type VideoQuickActions = {
  center: { x: number; y: number };
  cover: { x: number; y: number };
  focus: { x: number; y: number };
  hasCover: boolean;
  kind: "video" | "app";
  videoId: ExcalidrawElement["id"];
};

type InteractiveHtmlQuickActions = {
  access?: { x: number; y: number };
  center: { x: number; y: number };
  cover: { x: number; y: number };
  focus: { x: number; y: number };
  print?: { x: number; y: number };
  persist: { x: number; y: number };
  reset: { x: number; y: number };
  hasCover: boolean;
  elementId: ExcalidrawElement["id"];
};

type CanvasCoverQuickAction = {
  cover: { x: number; y: number };
  edit?: { x: number; y: number };
  format?: { x: number; y: number };
  hasCover: boolean;
  targetId: ExcalidrawElement["id"];
};

type TextEditorBounds = { elementId: string; left: number; top: number; width: number; height: number };

type CoverTarget = ExcalidrawElement;

type ImageCoverFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  coverId: ExcalidrawElement["id"];
  height: number;
  imageId: ExcalidrawImageElement["id"];
  isFull: boolean;
  isProjectedMaterial: boolean;
  geometry: CoverSweepGeometry;
  width: number;
};

type ImageCoverDrag = {
  coverId: ExcalidrawElement["id"];
  handle: ImageCoverHandle;
  image: CoverTarget;
  moved: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startCover: ExcalidrawElement;
  startPointer: { x: number; y: number };
  startRect: ImageCoverRect;
};

type MaterialBundleMoveDrag = {
  htmlSource?: { elementId: string; screenX: number; screenY: number };
  moved: boolean;
  onMoved?: () => void;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startElements: readonly ExcalidrawElement[];
  startPointer: { x: number; y: number };
};

type ImageCoverFeedback = {
  cover: ImageCoverFrame;
  direction: ImageCoverEdge;
  key: number;
  mode: "added" | "revealed";
};

type ImageCropSelectionFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  height: number;
  imageId: ExcalidrawImageElement["id"];
  mode: "select" | "trim";
  naturalHeight: number;
  naturalWidth: number;
  rect: NormalizedImageCropRect | null;
  width: number;
};

type ImageCropSelectionDragBase = {
  image: ExcalidrawImageElement;
  naturalHeight: number;
  naturalWidth: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
};

type ImageCropSelectionDrag = ImageCropSelectionDragBase & ({
  mode: "select";
  startPoint: { x: number; y: number };
} | {
  handle: ImageCropTrimHandle;
  mode: "trim";
  startRect: NormalizedImageCropRect;
});

type ElementFocusFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  elementId: ExcalidrawElement["id"];
  height: number;
  viewportHeight: number;
  viewportWidth: number;
  width: number;
};

type ShapeShadowFrame = ElementFocusFrame & {
  cornerRadius: number;
  opacity: number;
  shapeType: "rectangle" | "ellipse" | "diamond";
};

type CanvasElementContextMenu = {
  selectionCount: number;
  x: number;
  y: number;
};

type TextFormattingContext = {
  containerId: ExcalidrawTextElement["containerId"];
  elementId: ExcalidrawTextElement["id"];
  fontFamily: number;
  fontSize: number;
  hasBullets: boolean;
  italic: boolean;
  placement: "above" | "below";
  strokeColor: string;
  strike: boolean;
  textAlign: TextAlign | null;
  hasTextSelection: boolean;
  underline: boolean;
  verticalAlign: ExcalidrawTextElement["verticalAlign"];
  x: number;
  y: number;
};

type TextMoveDrag = {
  elementId: ExcalidrawTextElement["id"];
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startElement: ExcalidrawTextElement;
  zoom: number;
};

type ShapeFormattingContext = {
  hasCover: boolean;
  color: string;
  elementId: ExcalidrawElement["id"];
  fillMode: ShapeFillMode;
  placement: "above" | "below";
  x: number;
  y: number;
};

type TextSizePreset = {
  label: "XS" | "S" | "M" | "L" | "XL";
  value: number;
};

type TextFontOption = {
  cssFamily: string;
  label: string;
  lineHeight: ExcalidrawTextElement["lineHeight"];
  value: number;
};

type TextColorOption = {
  label: string;
  value: string;
};

const transportFileId = "tafelraum-transport-set" as FileId;
const persistenceDelay = 160;
const transformDragThreshold = 2;
const imageCoverMinimumCssSize = 40;
const imageCoverAddedFeedbackDuration = 220;
const imageCoverRevealFeedbackDuration = 220;
const imageFocusDuration = 440;
const elementFocusPadding = 10;
const desktopMaterialQuickActionSize = 32;
const desktopMaterialQuickActionGap = 7;
const coarseMaterialQuickActionSize = 48;
const coarseMaterialQuickActionGap = 8;
const zoomStepPercent = 10;
const minZoomPercent = 10;
const maxZoomPercent = 300;
const textFormattingToolbarWidth = 550;
const shapeFormattingToolbarWidth = 550;
const contextFormattingToolbarHeight = 64;
const textFormattingToolbarHeight = 116;
const contextFormattingToolbarGap = 12;
const contextFormattingToolbarViewportInset = 10;
const textColorPaletteOuterHeight = 70;
const legacyTranslucentShapeColor = "rgba(98, 177, 230, 0.24)";
const legacySolidShapeColor = "#6aa6c5";
const defaultTextSize = 28;
const textSizePresets: readonly TextSizePreset[] = [
  { label: "XS", value: 14 },
  { label: "S", value: 20 },
  { label: "M", value: defaultTextSize },
  { label: "L", value: 36 },
  { label: "XL", value: 48 },
];
const textFontOptions: readonly TextFontOption[] = [
  { cssFamily: "Nunito", label: "Klar – Nunito", lineHeight: 1.35 as ExcalidrawTextElement["lineHeight"], value: FONT_FAMILY.Nunito },
  { cssFamily: "Excalifont", label: "Whiteboard – Excalifont", lineHeight: 1.25 as ExcalidrawTextElement["lineHeight"], value: FONT_FAMILY.Excalifont },
  { cssFamily: "Comic Shanns", label: "Kompakt – Comic Shanns", lineHeight: 1.25 as ExcalidrawTextElement["lineHeight"], value: FONT_FAMILY["Comic Shanns"] },
];
const textColorOptions: readonly TextColorOption[] = [
  { label: "Schwarz", value: "#111111" },
  { label: "Weiß", value: "#fffdf8" },
  { label: "Rot", value: "#a84f4b" },
  { label: "Grün", value: "#3f7461" },
  { label: "Gelb", value: "#9a7200" },
];

const foregroundColor: Record<CanvasTheme, string> = {
  light: "#1b222b",
  dark: "#f4f3ef",
};

const standardInkColors = new Set(["#1b1b1f", "#1b222b", "#26323f", "#f4f3ef"]);
const supportedAudioMimeTypes = new Set<CanvasAudioAsset["mimeType"]>([
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
]);
const legacyAudioPlayerHeight = 124;
const imageCoverHandles: readonly { handle: Exclude<ImageCoverHandle, "move">; label: string }[] = [
  { handle: "north-west", label: "Obere linke Ecke der Abdeckung ziehen" },
  { handle: "north", label: "Obere Kante der Abdeckung ziehen" },
  { handle: "north-east", label: "Obere rechte Ecke der Abdeckung ziehen" },
  { handle: "east", label: "Rechte Kante der Abdeckung ziehen" },
  { handle: "south-east", label: "Untere rechte Ecke der Abdeckung ziehen" },
  { handle: "south", label: "Untere Kante der Abdeckung ziehen" },
  { handle: "south-west", label: "Untere linke Ecke der Abdeckung ziehen" },
  { handle: "west", label: "Linke Kante der Abdeckung ziehen" },
];
const imageCropTrimHandles: readonly { handle: ImageCropTrimHandle; label: string }[] = [
  { handle: "north", label: "Oberen Bildrand trimmen" },
  { handle: "south", label: "Unteren Bildrand trimmen" },
  { handle: "west", label: "Linken Bildrand trimmen" },
  { handle: "east", label: "Rechten Bildrand trimmen" },
  { handle: "north-west", label: "Obere linke Ecke trimmen" },
  { handle: "north-east", label: "Obere rechte Ecke trimmen" },
  { handle: "south-west", label: "Untere linke Ecke trimmen" },
  { handle: "south-east", label: "Untere rechte Ecke trimmen" },
];
const fullImageCropRect: NormalizedImageCropRect = { height: 1, width: 1, x: 0, y: 0 };
let transportFilePromise: Promise<BinaryFileData> | null = null;

async function blobToDataUrl(blob: Blob) {
  return new Promise<DataURL>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as DataURL), { once: true });
    reader.addEventListener("error", () => reject(reader.error), { once: true });
    reader.readAsDataURL(blob);
  });
}

async function loadTransportFile(): Promise<BinaryFileData> {
  if (!transportFilePromise) {
    transportFilePromise = (async (): Promise<BinaryFileData> => {
      const response = await fetch(transportImage);
      if (!response.ok) throw new Error(t("Transportmaterial konnte nicht geladen werden ({0}).", response.status));

      const blob = await response.blob();
      return {
        id: transportFileId,
        mimeType: "image/png",
        dataURL: await blobToDataUrl(blob),
        created: Date.now(),
      };
    })().catch((error: unknown) => {
      transportFilePromise = null;
      throw error;
    });
  }
  return transportFilePromise!;
}

function refreshAudioPlayer(element: ExcalidrawElement) {
  if (element.customData?.materialKind !== "audio") return element;

  const archiveMaterialPath = element.customData.archiveMaterialPath;
  const fileName = element.customData.sourceFileName;
  const lessonId = element.customData.sourceLessonId;
  const materialPath = element.customData.sourceMaterialPath;
  const mimeType = element.customData.sourceMimeType;
  if (
    typeof archiveMaterialPath !== "string"
    || typeof fileName !== "string"
    || typeof lessonId !== "string"
    || typeof materialPath !== "string"
    || typeof mimeType !== "string"
    || !supportedAudioMimeTypes.has(mimeType as CanvasAudioAsset["mimeType"])
  ) return element;

  const hasLegacyDefaultGeometry = Math.abs(element.width - audioPlayerWidth) < 0.01
    && Math.abs(element.height - legacyAudioPlayerHeight) < 0.01;
  const hasCurrentRoundness = element.roundness?.type === audioPlayerRoundness.type
    && element.roundness.value === audioPlayerRoundness.value;
  const hasGenerationData = "generationData" in element.customData;
  const isCleanPlaceholder = element.type === "rectangle"
    && !hasLegacyDefaultGeometry
    && hasCurrentRoundness
    && element.backgroundColor === "transparent"
    && element.strokeColor === "transparent"
    && element.fillStyle === "solid"
    && element.opacity === 100
    && element.roughness === 0
    && element.strokeWidth === 2
    && !hasGenerationData;
  if (isCleanPlaceholder) return element;

  const { generationData: _generationData, ...customData } = element.customData;
  return newElementWith<ExcalidrawElement>(element, {
    type: "rectangle",
    ...(hasLegacyDefaultGeometry ? {
      height: audioPlayerHeight,
      y: element.y + (legacyAudioPlayerHeight - audioPlayerHeight) / 2,
    } : {}),
    backgroundColor: "transparent",
    customData,
    fillStyle: "solid",
    opacity: 100,
    roughness: 0,
    roundness: audioPlayerRoundness,
    strokeColor: "transparent",
    strokeWidth: 2,
  });
}

function refreshYouTubePlayer(element: ExcalidrawElement) {
  const patch = getYouTubePlaceholderPatch(element);
  return patch ? newElementWith<ExcalidrawElement>(element, patch) : element;
}

function applyThemeInk(elements: readonly ExcalidrawElement[], theme: CanvasTheme) {
  const strokeColor = foregroundColor[theme];
  return elements.map((element) => {
    if (!annotationColorFollowsCanvas(element)) return element;
    let themedElement = (standardInkColors.has(element.strokeColor)
      || (element.type === "text" && adaptiveTextColors.has(element.strokeColor.toLowerCase()))
      || (element.type === "freedraw" && element.customData?.role === penRole && isNeutralTextColor(element.strokeColor))) && element.strokeColor !== strokeColor
      ? newElementWith(element, { strokeColor })
      : element;
    const richText = richTextOf(element);
    if (richText) {
      const next = themeRichText(richText, strokeColor);
      if (next !== richText) themedElement = newElementWith(themedElement, {
        customData: { ...themedElement.customData, richText: next },
      });
    }
    return refreshYouTubePlayer(refreshAudioPlayer(themedElement));
  });
}

function createSeedElements(theme: CanvasTheme, seed: LessonSeed) {
  const elements = convertToExcalidrawElements([
    ...(seed.prompt.trim() ? [{
      type: "text",
      x: 110,
      y: 80,
      text: seed.prompt,
      fontFamily: FONT_FAMILY.Nunito,
      fontSize: 42,
      strokeColor: foregroundColor[theme],
      customData: { role: "lesson-prompt" },
    } as const, {
      type: "line",
      x: 110,
      y: 205,
      points: [[0, 0], [76, 0]],
      strokeColor: "#f0b800",
      strokeWidth: 4,
      roughness: 0,
      customData: { role: "lesson-prompt-accent" },
    } as const] : []),
    ...(seed.notes ? [{
      type: "text" as const,
      x: 110,
      y: 260,
      text: seed.notes,
      fontFamily: FONT_FAMILY.Nunito,
      fontSize: 26,
      strokeColor: foregroundColor[theme],
      customData: { role: "lesson-notes" },
    }] : []),
    ...(seed.showTransportImage ? [{
      type: "image",
      x: 760,
      y: 240,
      width: 640,
      height: 427,
      fileId: transportFileId,
      status: "saved",
      customData: { assetId: "transport-set" },
    } as const] : []),
  ]);
  return prepareCanvasAnnotationGroups(elements).elements;
}

async function buildInitialData(
  theme: CanvasTheme,
  canvasBackgroundColor: string,
  lessonId: string,
  seed: LessonSeed,
  receiveRemovals: (removals: MaterialRemoval[]) => void,
  receiveStoredState: (clips: PresentationClip[], interactiveHtmlStates: StoredInteractiveHtmlStates) => void,
  resolveRecovery?: ResolveCanvasRecovery,
): Promise<ExcalidrawInitialDataState> {
  const removals = await loadMaterialRemovals();
  receiveRemovals(removals);
  const loadedSnapshot = await loadCanvasSnapshot(lessonId, resolveRecovery);
  const snapshot = loadedSnapshot ? pruneRemovedMaterials(loadedSnapshot, removals, lessonId) : null;
  receiveStoredState(
    readClipFrames(snapshot?.clips),
    readStoredInteractiveHtmlStates(snapshot?.interactiveHtmlStates),
  );
  const snapshotElements = snapshot?.elements
    ? normalizeInteractiveHtmlFrameGeometry(restoreCanvasAnnotationsAfterEraser(snapshot.elements).elements)
    : null;
  const elements = (snapshotElements ? applyThemeInk(snapshotElements, theme) : createSeedElements(theme, seed))
    .filter(element => !richTextImageSourceId(element));
  const referencedFileIds = [...new Set(elements.flatMap((element) => (
    referencedImageFileIds(element).filter((fileId) => fileId !== transportFileId)
  )))];
  const needsTransportFile = elements.some((element) => (
    element.type === "image" && !element.isDeleted && element.fileId === transportFileId
  ));
  const [storedFiles, transportFile] = await Promise.all([
    loadCanvasFiles(lessonId, referencedFileIds),
    needsTransportFile ? loadTransportFile() : Promise.resolve(null),
  ]);

  return {
    elements: prepareCanvasAnnotationGroups(elements).elements,
    appState: {
      ...snapshot?.viewport,
      activeTool: {
        type: "hand",
        customType: null,
        lastActiveTool: null,
        locked: false,
      },
      currentItemFontSize: defaultTextSize,
      viewBackgroundColor: canvasBackgroundColor,
    },
    files: transportFile ? { ...storedFiles, [transportFileId]: transportFile } : storedFiles,
    scrollToContent: !snapshot,
  };
}

function dispatchHistoryShortcut(root: HTMLDivElement | null, redo: boolean) {
  dispatchCanvasKeyboardCommand(root, {
    code: "KeyZ",
    key: "z",
    shiftKey: redo,
    withPrimaryModifier: true,
  });
}

function dispatchCanvasKeyboardCommand(
  root: HTMLDivElement | null,
  command: {
    code: string;
    key: string;
    shiftKey?: boolean;
    withPrimaryModifier?: boolean;
  },
) {
  const editor = root?.querySelector<HTMLElement>(".excalidraw");
  editor?.focus();
  const isMac = navigator.userAgent.includes("Mac");
  const event = new KeyboardEvent("keydown", {
    key: command.key,
    code: command.code,
    bubbles: true,
    cancelable: true,
    ctrlKey: Boolean(command.withPrimaryModifier && !isMac),
    metaKey: Boolean(command.withPrimaryModifier && isMac),
    shiftKey: command.shiftKey,
  });
  (editor ?? document).dispatchEvent(event);
}

function setCenteredZoom(api: ExcalidrawImperativeAPI, root: HTMLDivElement | null, nextZoomPercent: number) {
  const appState = api.getAppState();
  const rootBounds = root?.getBoundingClientRect();
  const viewportX = rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2;
  const viewportY = rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2;
  const nextZoom = nextZoomPercent / 100;
  const appLayerX = viewportX - appState.offsetLeft;
  const appLayerY = viewportY - appState.offsetTop;
  const currentZoom = appState.zoom.value;
  const baseScrollX = appState.scrollX + appLayerX - appLayerX / currentZoom;
  const baseScrollY = appState.scrollY + appLayerY - appLayerY / currentZoom;

  api.updateScene({
    appState: {
      scrollX: baseScrollX - (appLayerX - appLayerX / nextZoom),
      scrollY: baseScrollY - (appLayerY - appLayerY / nextZoom),
      zoom: { value: nextZoom as AppState["zoom"]["value"] },
    },
    captureUpdate: CaptureUpdateAction.NEVER,
  });
}

function stepZoom(api: ExcalidrawImperativeAPI, root: HTMLDivElement | null, direction: -1 | 1) {
  const currentPercent = Math.round(api.getAppState().zoom.value * 100);
  const steppedPercent = direction === 1
    ? Math.floor(currentPercent / zoomStepPercent) * zoomStepPercent + zoomStepPercent
    : Math.ceil(currentPercent / zoomStepPercent) * zoomStepPercent - zoomStepPercent;
  setCenteredZoom(api, root, Math.min(maxZoomPercent, Math.max(minZoomPercent, steppedPercent)));
}

function applyTool(api: ExcalidrawImperativeAPI, tool: CanvasTool, context: CanvasToolContext) {
  const currentShapeBackgroundColor = shapeBackgroundColor(context.shapeFill, context.shapeColor);
  const standardStyle = {
    currentItemStrokeColor: tool === "shape" ? context.shapeColor : foregroundColor[context.theme],
    currentItemStrokeWidth: 2,
    currentItemOpacity: 100,
    currentItemBackgroundColor: tool === "shape" ? currentShapeBackgroundColor : "transparent",
    currentItemFillStyle: "solid" as const,
    currentItemFontFamily: FONT_FAMILY.Nunito,
    currentItemRoughness: tool === "shape" ? 0 : api.getAppState().currentItemRoughness,
  };

  if (tool === "eraser") {
    api.setActiveTool({ type: tool, locked: true });
    const prepared = prepareCanvasAnnotationsForEraser(api.getSceneElements());
    if (prepared.changed) {
      api.updateScene({
        elements: prepared.elements,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    }
    return;
  }

  const restored = restoreCanvasAnnotationsAfterEraser(api.getSceneElements());
  const prepared = prepareCanvasAnnotationGroups(restored.elements);
  if (restored.changed || prepared.changed) {
    api.updateScene({
      elements: prepared.elements,
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }

  if (tool === "hand" || tool === "selection") {
    api.setActiveTool({ type: tool });
    return;
  }

  if (tool === "marker") {
    api.updateScene({
      appState: {
        currentItemStrokeColor: context.markerColor,
        currentItemStrokeWidth: context.markerStrokeWidth,
        currentItemOpacity: markerOpacity,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    api.setActiveTool({ type: "freedraw", locked: true });
    return;
  }

  api.updateScene({
    appState: tool === "pen"
      ? {
          ...standardStyle,
          currentItemStrokeColor: context.penColor,
          currentItemStrokeWidth: context.penStrokeWidth,
        }
      : standardStyle,
    captureUpdate: CaptureUpdateAction.NEVER,
  });

  const engineTool = tool === "pen"
    ? "freedraw"
    : tool === "shape"
      ? context.shape
      : "text";
  api.setActiveTool({ type: engineTool, locked: true });
}

function rotateAroundCenter(point: { x: number; y: number }, center: { x: number; y: number }, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  return {
    x: center.x + deltaX * cos - deltaY * sin,
    y: center.y + deltaX * sin + deltaY * cos,
  };
}

function getImageControls(
  element: ExcalidrawImageElement,
  selectedElements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): ImageControls | null {
  if (!root) return null;

  const hasMultipleSelectedElements = selectedElements.length > 1;
  const selectionBounds = hasMultipleSelectedElements ? getCommonBounds(selectedElements) : null;
  const center = hasMultipleSelectedElements
    ? {
        x: (selectionBounds![0] + selectionBounds![2]) / 2,
        y: (selectionBounds![1] + selectionBounds![3]) / 2,
      }
    : { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const topCenter = hasMultipleSelectedElements
    ? { x: center.x, y: selectionBounds![1] }
    : rotateAroundCenter({ x: center.x, y: element.y }, center, element.angle);
  const topCenterViewport = sceneCoordsToViewportCoords({ sceneX: topCenter.x, sceneY: topCenter.y }, appState);
  const rootBounds = root.getBoundingClientRect();
  const selectionAngle = hasMultipleSelectedElements ? 0 : element.angle;
  const outward = { x: Math.sin(selectionAngle), y: -Math.cos(selectionAngle) };
  const offset = nativeRotationHandleOffset(hasMultipleSelectedElements);

  return {
    imageId: element.id,
    rotate: {
      x: topCenterViewport.x - rootBounds.left + outward.x * offset,
      y: topCenterViewport.y - rootBounds.top + outward.y * offset,
    },
  };
}

function sameImageControls(previous: ImageControls | null, next: ImageControls | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.imageId !== next.imageId) return false;
  return Math.abs(previous.rotate.x - next.rotate.x) < 0.1
    && Math.abs(previous.rotate.y - next.rotate.y) < 0.1;
}

function sameImageQuickActions(previous: ImageQuickActions | null, next: ImageQuickActions | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.imageId !== next.imageId) return false;
  return previous.hasCover === next.hasCover
    && previous.isCropping === next.isCropping
    && Math.abs(previous.focus.x - next.focus.x) < 0.1
    && Math.abs(previous.focus.y - next.focus.y) < 0.1
    && Math.abs(previous.center.x - next.center.x) < 0.1
    && Math.abs(previous.center.y - next.center.y) < 0.1
    && Math.abs(previous.crop.x - next.crop.x) < 0.1
    && Math.abs(previous.crop.y - next.crop.y) < 0.1
    && previous.isEnhanced === next.isEnhanced
    && Math.abs(previous.enhance.x - next.enhance.x) < 0.1
    && Math.abs(previous.enhance.y - next.enhance.y) < 0.1
    && Math.abs(previous.cover.x - next.cover.x) < 0.1
    && Math.abs(previous.cover.y - next.cover.y) < 0.1
    && Math.abs(previous.print.x - next.print.x) < 0.1
    && Math.abs(previous.print.y - next.print.y) < 0.1;
}

function sameCanvasCoverQuickAction(previous: CanvasCoverQuickAction | null, next: CanvasCoverQuickAction | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.targetId !== next.targetId) return false;
  return previous.hasCover === next.hasCover
    && Math.abs(previous.cover.x - next.cover.x) < 0.1
    && Math.abs(previous.cover.y - next.cover.y) < 0.1;
}

function sameVideoQuickActions(previous: VideoQuickActions | null, next: VideoQuickActions | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.videoId !== next.videoId) return false;
  return previous.kind === next.kind
    && previous.hasCover === next.hasCover
    && Math.abs(previous.focus.x - next.focus.x) < 0.1
    && Math.abs(previous.focus.y - next.focus.y) < 0.1
    && Math.abs(previous.center.x - next.center.x) < 0.1
    && Math.abs(previous.center.y - next.center.y) < 0.1
    && Math.abs(previous.cover.x - next.cover.x) < 0.1
    && Math.abs(previous.cover.y - next.cover.y) < 0.1;
}

function sameInteractiveHtmlQuickActions(previous: InteractiveHtmlQuickActions | null, next: InteractiveHtmlQuickActions | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.elementId !== next.elementId) return false;
  const sameOptionalPoint = (first: {x:number;y:number}|undefined, second: {x:number;y:number}|undefined) => (
    first === second || Boolean(first && second && Math.abs(first.x-second.x)<0.1 && Math.abs(first.y-second.y)<0.1)
  );
  return previous.hasCover === next.hasCover
    && sameOptionalPoint(previous.access,next.access)
    && sameOptionalPoint(previous.print,next.print)
    && Math.abs(previous.persist.x - next.persist.x) < 0.1
    && Math.abs(previous.persist.y - next.persist.y) < 0.1
    && Math.abs(previous.reset.x - next.reset.x) < 0.1
    && Math.abs(previous.reset.y - next.reset.y) < 0.1
    && Math.abs(previous.focus.x - next.focus.x) < 0.1
    && Math.abs(previous.focus.y - next.focus.y) < 0.1
    && Math.abs(previous.center.x - next.center.x) < 0.1
    && Math.abs(previous.center.y - next.center.y) < 0.1
    && Math.abs(previous.cover.x - next.cover.x) < 0.1
    && Math.abs(previous.cover.y - next.cover.y) < 0.1;
}

function sameImageCoverFrame(previous: ImageCoverFrame | null, next: ImageCoverFrame | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.coverId !== next.coverId || previous.imageId !== next.imageId) return false;
  return Math.abs(previous.angle - next.angle) < 0.001
    && Math.abs(previous.centerX - next.centerX) < 0.1
    && Math.abs(previous.centerY - next.centerY) < 0.1
    && Math.abs(previous.height - next.height) < 0.1
    && previous.isFull === next.isFull
    && previous.isProjectedMaterial === next.isProjectedMaterial
    && coverSweepPath(previous.geometry) === coverSweepPath(next.geometry)
    && Math.abs(previous.width - next.width) < 0.1;
}

function sameImageCoverFrames(previous: readonly ImageCoverFrame[], next: readonly ImageCoverFrame[]) {
  return previous.length === next.length
    && previous.every((frame, index) => sameImageCoverFrame(frame, next[index] ?? null));
}

function sameImageCropSelectionFrame(previous: ImageCropSelectionFrame | null, next: ImageCropSelectionFrame | null) {
  if (previous === next) return true;
  if (!previous || !next || previous.imageId !== next.imageId) return false;
  const sameRect = previous.rect === next.rect || Boolean(previous.rect && next.rect
    && Math.abs(previous.rect.x - next.rect.x) < 0.0001
    && Math.abs(previous.rect.y - next.rect.y) < 0.0001
    && Math.abs(previous.rect.width - next.rect.width) < 0.0001
    && Math.abs(previous.rect.height - next.rect.height) < 0.0001);
  return previous.mode === next.mode
    && sameRect
    && previous.naturalHeight === next.naturalHeight
    && previous.naturalWidth === next.naturalWidth
    && Math.abs(previous.angle - next.angle) < 0.001
    && Math.abs(previous.centerX - next.centerX) < 0.1
    && Math.abs(previous.centerY - next.centerY) < 0.1
    && Math.abs(previous.height - next.height) < 0.1
    && Math.abs(previous.width - next.width) < 0.1;
}

function sameElementFocusFrames(previous: readonly ElementFocusFrame[], next: readonly ElementFocusFrame[]) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((frame, index) => {
    const nextFrame = next[index];
    return frame.elementId === nextFrame.elementId
      && Math.abs(frame.angle - nextFrame.angle) < 0.001
      && Math.abs(frame.centerX - nextFrame.centerX) < 0.1
      && Math.abs(frame.centerY - nextFrame.centerY) < 0.1
      && Math.abs(frame.height - nextFrame.height) < 0.1
      && Math.abs(frame.viewportHeight - nextFrame.viewportHeight) < 0.1
      && Math.abs(frame.viewportWidth - nextFrame.viewportWidth) < 0.1
      && Math.abs(frame.width - nextFrame.width) < 0.1;
  });
}

type ImageAppearanceFrame = ElementFocusFrame & { cornerRadius: number; opacity: number };

function getImageAppearanceFrame(image: ExcalidrawImageElement, appState: AppState, root: HTMLDivElement | null): ImageAppearanceFrame | null {
  const frame = getElementFocusFrame(image, appState, root);
  if (!frame) return null;
  return { ...frame, cornerRadius: getImageCornerRadius(image) * appState.zoom.value, opacity: image.opacity / 100 };
}

function sameImageAppearanceFrames(previous: readonly ImageAppearanceFrame[], next: readonly ImageAppearanceFrame[]) {
  return sameElementFocusFrames(previous, next) && previous.every((frame, index) => (
    Math.abs(frame.cornerRadius - next[index].cornerRadius) < 0.1 && frame.opacity === next[index].opacity
  ));
}

function sameShapeShadowFrames(previous: readonly ShapeShadowFrame[], next: readonly ShapeShadowFrame[]) {
  return sameElementFocusFrames(previous, next) && previous.every((frame, index) =>
    frame.shapeType === next[index].shapeType
    && Math.abs(frame.cornerRadius - next[index].cornerRadius) < 0.1
    && frame.opacity === next[index].opacity);
}

function sameAudioPlayerFrames(previous: readonly AudioCanvasPlayerFrame[], next: readonly AudioCanvasPlayerFrame[]) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((frame, index) => {
    const nextFrame = next[index];
    return frame.elementId === nextFrame.elementId
      && frame.fileName === nextFrame.fileName
      && frame.sourceUrl === nextFrame.sourceUrl
      && Math.abs(frame.angle - nextFrame.angle) < 0.001
      && Math.abs(frame.centerX - nextFrame.centerX) < 0.1
      && Math.abs(frame.centerY - nextFrame.centerY) < 0.1
      && Math.abs(frame.height - nextFrame.height) < 0.1
      && Math.abs(frame.width - nextFrame.width) < 0.1;
  });
}

function sameVideoPlayerFrames(previous: readonly VideoCanvasPlayerFrame[], next: readonly VideoCanvasPlayerFrame[]) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((frame, index) => {
    const nextFrame = next[index];
    return frame.elementId === nextFrame.elementId
      && frame.fileName === nextFrame.fileName
      && frame.sourceUrl === nextFrame.sourceUrl
      && frame.covered === nextFrame.covered
      && Math.abs(frame.angle - nextFrame.angle) < 0.001
      && Math.abs(frame.centerX - nextFrame.centerX) < 0.1
      && Math.abs(frame.centerY - nextFrame.centerY) < 0.1
      && Math.abs(frame.height - nextFrame.height) < 0.1
      && Math.abs(frame.width - nextFrame.width) < 0.1;
  });
}

function sameInteractiveHtmlFrames(
  previous: readonly InteractiveHtmlCanvasFrameData[],
  next: readonly InteractiveHtmlCanvasFrameData[],
) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((frame, index) => {
    const nextFrame = next[index];
    const sameCoverRect = frame.coverRect === nextFrame.coverRect
      || Boolean(frame.coverRect && nextFrame.coverRect
        && Math.abs(frame.coverRect.x - nextFrame.coverRect.x) < 0.0001
        && Math.abs(frame.coverRect.y - nextFrame.coverRect.y) < 0.0001
        && Math.abs(frame.coverRect.width - nextFrame.coverRect.width) < 0.0001
        && Math.abs(frame.coverRect.height - nextFrame.coverRect.height) < 0.0001);
    return frame.elementId === nextFrame.elementId
      && frame.contentOnly === nextFrame.contentOnly
      && frame.selected === nextFrame.selected
      && frame.viewportWidth === nextFrame.viewportWidth
      && frame.viewportHeight === nextFrame.viewportHeight
      && frame.pageOrientation === nextFrame.pageOrientation
      && frame.locked === nextFrame.locked
      && frame.annotationKey === nextFrame.annotationKey
      && frame.sourceUrl === nextFrame.sourceUrl
      && frame.title === nextFrame.title
      && sameCoverRect
      && Math.abs(frame.contentZoom - nextFrame.contentZoom) < 0.001
      && Math.abs(frame.angle - nextFrame.angle) < 0.001
      && Math.abs(frame.centerX - nextFrame.centerX) < 0.1
      && Math.abs(frame.centerY - nextFrame.centerY) < 0.1
      && Math.abs(frame.height - nextFrame.height) < 0.1
      && Math.abs(frame.width - nextFrame.width) < 0.1
      && Math.abs(frame.zoom - nextFrame.zoom) < 0.001;
  });
}

function sameYouTubePlayerFrames(previous: readonly YouTubeCanvasPlayerFrame[], next: readonly YouTubeCanvasPlayerFrame[]) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((frame, index) => {
    const nextFrame = next[index];
    return frame.elementId === nextFrame.elementId
      && frame.covered === nextFrame.covered
      && frame.title === nextFrame.title
      && frame.videoId === nextFrame.videoId
      && Math.abs(frame.angle - nextFrame.angle) < 0.001
      && Math.abs(frame.centerX - nextFrame.centerX) < 0.1
      && Math.abs(frame.centerY - nextFrame.centerY) < 0.1
      && Math.abs(frame.height - nextFrame.height) < 0.1
      && Math.abs(frame.providerControlsHeight - nextFrame.providerControlsHeight) < 0.1
      && Math.abs(frame.providerTopControlsHeight - nextFrame.providerTopControlsHeight) < 0.1
      && Math.abs(frame.surfaceHeight - nextFrame.surfaceHeight) < 0.1
      && Math.abs(frame.surfaceScale - nextFrame.surfaceScale) < 0.001
      && Math.abs(frame.surfaceWidth - nextFrame.surfaceWidth) < 0.1
      && Math.abs(frame.width - nextFrame.width) < 0.1;
  });
}

function pointToUnrotatedElementSpace(element: ExcalidrawElement, point: { x: number; y: number }) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const deltaX = point.x - centerX;
  const deltaY = point.y - centerY;
  const cos = Math.cos(element.angle);
  const sin = Math.sin(element.angle);
  return {
    centerX: deltaX * cos + deltaY * sin,
    centerY: -deltaX * sin + deltaY * cos,
    x: deltaX * cos + deltaY * sin + element.width / 2,
    y: -deltaX * sin + deltaY * cos + element.height / 2,
  };
}

function distanceToSegment(point: { x: number; y: number }, start: readonly [number, number], end: readonly [number, number]) {
  const segmentX = end[0] - start[0];
  const segmentY = end[1] - start[1];
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared === 0) return Math.hypot(point.x - start[0], point.y - start[1]);
  const progress = Math.max(0, Math.min(1, (
    (point.x - start[0]) * segmentX + (point.y - start[1]) * segmentY
  ) / lengthSquared));
  return Math.hypot(
    point.x - (start[0] + progress * segmentX),
    point.y - (start[1] + progress * segmentY),
  );
}

function elementContainsPoint(element: ExcalidrawElement, point: { x: number; y: number }, padding: number) {
  if (element.isDeleted || element.type === "selection") return false;
  const local = pointToUnrotatedElementSpace(element, point);
  const strokePadding = padding + element.strokeWidth / 2;

  if (element.type === "freedraw" || element.type === "line" || element.type === "arrow") {
    if (element.points.length === 0) return false;
    if (element.customData?.role === markerRole && markerContainsPoint(element.points, local)) return true;
    if (element.points.length === 1) {
      return Math.hypot(local.x - element.points[0][0], local.y - element.points[0][1]) <= strokePadding;
    }
    return element.points.some((pointEntry, index) => (
      index > 0 && distanceToSegment(local, element.points[index - 1], pointEntry) <= strokePadding
    ));
  }

  const halfWidth = Math.abs(element.width) / 2;
  const halfHeight = Math.abs(element.height) / 2;
  if (element.type === "ellipse") {
    if (halfWidth === 0 || halfHeight === 0) return false;
    return (local.centerX / (halfWidth + padding)) ** 2 + (local.centerY / (halfHeight + padding)) ** 2 <= 1;
  }
  if (element.type === "diamond") {
    if (halfWidth === 0 || halfHeight === 0) return false;
    return Math.abs(local.centerX) / (halfWidth + padding) + Math.abs(local.centerY) / (halfHeight + padding) <= 1;
  }

  return local.x >= Math.min(0, element.width) - padding
    && local.x <= Math.max(0, element.width) + padding
    && local.y >= Math.min(0, element.height) - padding
    && local.y <= Math.max(0, element.height) + padding;
}

function topmostElementAtPoint(elements: readonly ExcalidrawElement[], point: { x: number; y: number }, padding: number) {
  return [...elements].reverse().find((element) => elementContainsPoint(element, point, padding)) ?? null;
}

function getTextFormattingContext(
  element: ExcalidrawTextElement,
  appState: AppState,
  root: HTMLDivElement | null,
  container: ExcalidrawElement | null,
): TextFormattingContext | null {
  if (!root) return null;

  const position = getContextFormattingPosition(container ?? element, appState, root, textFormattingToolbarWidth, textFormattingToolbarHeight);
  if (!position) return null;

  const sourceText = element.originalText || element.text;
  const nonEmptyLines = sourceText.split("\n").filter((line) => line.trim().length > 0);
  const richText = richTextOf(element);
  const editor = appState.editingTextElement?.id === element.id
    ? root.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg") : null;
  const selectedOffset = editor?.selectionStart ?? 0;
  const firstStyle = richText?.runs.find(run => run.start <= selectedOffset && selectedOffset < run.end)?.style
    ?? richText?.runs.at(-1)?.style;
  const hasTextSelection = Boolean(editor && editor.selectionEnd > editor.selectionStart);
  const selectedAlign = richText ? richTextAlignment(richText,
    hasTextSelection ? editor!.selectionStart : 0, hasTextSelection ? editor!.selectionEnd : 0) : element.textAlign;

  return {
    containerId: element.containerId,
    elementId: element.id,
    fontFamily: firstStyle?.fontFamily ?? element.fontFamily,
    fontSize: firstStyle?.fontSize ?? element.fontSize,
    hasBullets: nonEmptyLines.length > 0 && nonEmptyLines.every((line) => /^\s*•\s/.test(line)),
    italic: firstStyle?.italic ?? false,
    strokeColor: firstStyle?.color ?? element.strokeColor,
    strike: firstStyle?.strike ?? false,
    textAlign: selectedAlign,
    hasTextSelection,
    underline: firstStyle?.underline ?? false,
    verticalAlign: element.verticalAlign,
    ...position,
  };
}

function nativeTextDoubleClickRange(
  element: ExcalidrawTextElement,
  value: string,
  appState: AppState,
  clientX: number,
  clientY: number,
  wordOnly: boolean,
) {
  const document = rebaseRichText(richTextFromNative(element), value);
  const layout = layoutRichText(document, element.width, Boolean(element.containerId) || !element.autoResize, element.lineHeight);
  const point = viewportCoordsToSceneCoords({ clientX, clientY }, appState);
  const centerX = element.x + layout.width / 2, centerY = element.y + layout.height / 2;
  const dx = point.x - centerX, dy = point.y - centerY;
  const cos = Math.cos(-element.angle), sin = Math.sin(-element.angle);
  const offset = richTextOffsetAtPoint(layout,
    dx * cos - dy * sin + layout.width / 2,
    dx * sin + dy * cos + layout.height / 2);
  return wordOnly ? richTextWordRange(value, offset) : richTextParagraphRange(value, offset);
}

function getContextFormattingPosition(
  element: ExcalidrawElement,
  appState: AppState,
  root: HTMLDivElement | null,
  toolbarWidth: number,
  toolbarHeight = contextFormattingToolbarHeight,
): Pick<TextFormattingContext, "placement" | "x" | "y"> | null {
  if (!root) return null;

  const rootBounds = root.getBoundingClientRect();
  const topCenter = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y,
  }, appState);
  const bottomCenter = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height,
  }, appState);
  const localTop = topCenter.y - rootBounds.top;
  const localBottom = bottomCenter.y - rootBounds.top;
  const bottomReserved = toolbarHeight === textFormattingToolbarHeight ? 84 : 0;
  const availableAbove = localTop - contextFormattingToolbarGap;
  const availableBelow = rootBounds.height - localBottom - contextFormattingToolbarGap - bottomReserved;
  const hasSpaceAbove = availableAbove >= toolbarHeight + contextFormattingToolbarViewportInset
    || availableAbove >= availableBelow;
  const halfWidth = toolbarWidth / 2;
  const historyReserved = toolbarHeight === textFormattingToolbarHeight && hasSpaceAbove && localTop < 240 ? 140 : 0;
  const x = Math.min(
    rootBounds.width - halfWidth - contextFormattingToolbarViewportInset - historyReserved,
    Math.max(halfWidth + contextFormattingToolbarViewportInset, topCenter.x - rootBounds.left),
  );

  return {
    placement: hasSpaceAbove ? "above" : "below",
    x,
    y: hasSpaceAbove
      ? Math.max(toolbarHeight + contextFormattingToolbarViewportInset, localTop - contextFormattingToolbarGap)
      : Math.min(rootBounds.height - toolbarHeight - bottomReserved - contextFormattingToolbarViewportInset, localBottom + contextFormattingToolbarGap),
  };
}

function isBasicShapeElement(element: ExcalidrawElement | null | undefined): element is ExcalidrawElement {
  return Boolean(
    element
    && isBasicShapeType(element.type)
    && (!element.customData || Object.keys(element.customData).length === 0),
  );
}

function getShapeColor(element: ExcalidrawElement) {
  if (element.backgroundColor === legacyTranslucentShapeColor || element.backgroundColor === legacySolidShapeColor) {
    return shapeColorOptions[0].value;
  }
  return element.strokeColor;
}

function getShapeFillMode(element: ExcalidrawElement): ShapeFillMode {
  if (element.backgroundColor === "transparent") return "empty";
  if (element.backgroundColor === legacyTranslucentShapeColor || /^rgba\(.+,\s*0\.24\)$/i.test(element.backgroundColor)) {
    return "translucent";
  }
  return "solid";
}

function getShapeFormattingContext(
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): ShapeFormattingContext | null {
  const position = getContextFormattingPosition(element, appState, root, shapeFormattingToolbarWidth);
  if (!position) return null;
  return {
    hasCover: Boolean(getImageCover(elements, element.id)),
    color: getShapeColor(element),
    elementId: element.id,
    fillMode: getShapeFillMode(element),
    ...position,
  };
}

function shapedCoverElement(target: ExcalidrawElement, rect: ImageCoverRect, previous?: ExcalidrawElement,
  prepared?: ReturnType<typeof shapedCoverGeometry>): ExcalidrawElement {
  const geometry = prepared ?? shapedCoverGeometry(target, rect, canvasCoverStrokeWidth(target, rect) / 2);
  const { empty, ...position } = geometry;
  const template = previous?.type === "line" ? previous : convertToExcalidrawElements([{
    type: "line", ...position, backgroundColor: "#3e4854", fillStyle: "solid",
    strokeColor: "transparent", strokeWidth: 0, opacity: empty ? 0 : 100,
    roughness: 0, roundness: null, startArrowhead: null, endArrowhead: null,
  }])[0];
  const baseline = previous && previous.type !== "line"
    ? { ...template, id: previous.id, version: previous.version, versionNonce: previous.versionNonce,
      index: previous.index, seed: previous.seed, groupIds: previous.groupIds, customData: previous.customData }
    : template;
  return newElementWith(baseline, {
    ...position,
    backgroundColor: "#3e4854", fillStyle: "solid", strokeColor: "transparent",
    strokeWidth: 0, roughness: 0, roundness: null,
    customData: { ...previous?.customData, imageId: target.id, role: imageCoverRole, coverRect: rect },
    groupIds: previous?.groupIds ?? [coverBundleGroupId(target)],
    opacity: empty ? 0 : 100,
  });
}

function reconcileCanvasCoverContours(elements: readonly ExcalidrawElement[]) {
  const targets = new Map(elements.filter(element => isPlainCanvasCoverTarget(element) || isShapedCoverTarget(element)).map(element => [element.id, element]));
  let changed = false;
  const repaired = elements.map(element => {
    if (element.isDeleted || !isImageCoverElement(element)) return element;
    const targetId = element.customData?.imageId;
    const target = typeof targetId === "string" ? targets.get(targetId) : null;
    if (!target) return element;
    const rect = coverRectForTarget(target, element);
    if (isShapedCoverTarget(target)) {
      const geometry = shapedCoverGeometry(target, rect, canvasCoverStrokeWidth(target, rect) / 2);
      if (element.type === "line"
        && Math.abs(element.x - geometry.x) < 0.000001 && Math.abs(element.y - geometry.y) < 0.000001
        && Math.abs(element.width - geometry.width) < 0.000001 && Math.abs(element.height - geometry.height) < 0.000001
        && Math.abs(element.angle - geometry.angle) < 0.000001 && element.opacity === (geometry.empty ? 0 : 100)
        && element.strokeWidth === 0 && element.strokeColor === "transparent"
        && element.backgroundColor === "#3e4854" && element.fillStyle === "solid"
        && element.roughness === 0 && element.roundness === null
        && element.points.length === geometry.points.length
        && element.points.every((point, index) => Math.abs(point[0] - geometry.points[index][0]) < 0.000001
          && Math.abs(point[1] - geometry.points[index][1]) < 0.000001)
        && rect.x === (element.customData?.coverRect as ImageCoverRect | undefined)?.x
        && rect.y === (element.customData?.coverRect as ImageCoverRect | undefined)?.y
        && rect.width === (element.customData?.coverRect as ImageCoverRect | undefined)?.width
        && rect.height === (element.customData?.coverRect as ImageCoverRect | undefined)?.height) return element;
      changed = true;
      return shapedCoverElement(target, rect, element, geometry);
    }
    const width = canvasCoverStrokeWidth(target, rect);
    if (element.strokeWidth === width) return element;
    changed = true;
    return newElementWith(element, { strokeWidth: width });
  });
  return { changed, elements: repaired };
}

function sameTextFormattingContext(previous: TextFormattingContext | null, next: TextFormattingContext | null) {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return previous.elementId === next.elementId
    && previous.containerId === next.containerId
    && previous.fontFamily === next.fontFamily
    && previous.fontSize === next.fontSize
    && previous.hasBullets === next.hasBullets
    && previous.italic === next.italic
    && previous.placement === next.placement
    && previous.strokeColor === next.strokeColor
    && previous.strike === next.strike
    && previous.textAlign === next.textAlign
    && previous.hasTextSelection === next.hasTextSelection
    && previous.underline === next.underline
    && previous.verticalAlign === next.verticalAlign
    && Math.abs(previous.x - next.x) < 0.1
    && Math.abs(previous.y - next.y) < 0.1;
}

function sameShapeFormattingContext(previous: ShapeFormattingContext | null, next: ShapeFormattingContext | null) {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return previous.elementId === next.elementId
    && previous.color === next.color
    && previous.fillMode === next.fillMode
    && previous.hasCover === next.hasCover
    && previous.placement === next.placement
    && Math.abs(previous.x - next.x) < 0.1
    && Math.abs(previous.y - next.y) < 0.1;
}

function transformBulletedLines(value: string, selectionStart: number, selectionEnd: number) {
  const blockStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const blockEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const lines = value.slice(blockStart, blockEnd).split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const shouldRemoveBullets = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => /^\s*•\s/.test(line));
  const replacement = lines.map((line) => {
    if (line.trim().length === 0) return line;
    if (shouldRemoveBullets) return line.replace(/^(\s*)•\s?/, "$1");
    const indent = line.match(/^\s*/)?.[0] ?? "";
    return `${indent}• ${line.slice(indent.length)}`;
  }).join("\n");

  return { blockEnd, blockStart, replacement };
}

function isCoverTarget(element: ExcalidrawElement): element is CoverTarget {
  return (element.type === "image" && !element.isDeleted)
    || isVideoMaterialElement(element)
    || isInteractiveHtmlMaterialElement(element)
    || isEmbeddedAppElement(element)
    || isPlainCanvasCoverTarget(element);
}

function coverBundleGroupId(target: ExcalidrawElement) {
  return isPlainCanvasCoverTarget(target)
    ? canvasCoverGroupId(target.id)
    : imageAnnotationGroupId(target.id);
}

function getImageCover(elements: readonly ExcalidrawElement[], imageId: ExcalidrawElement["id"]) {
  return elements.find((element) => (
    !element.isDeleted
    && imageCoverBelongsTo(element, imageId)
  )) ?? null;
}

function getImageCoverEdge(element: ExcalidrawElement, rect: ImageCoverRect): ImageCoverEdge {
  const storedEdge = element.customData?.coverEdge;
  const fallback = storedEdge === "left" || storedEdge === "right" || storedEdge === "top" || storedEdge === "bottom"
    ? storedEdge
    : "right";
  return nearestImageCoverEdge(rect, fallback);
}

function getMaterialQuickActionObstacles(
  elementId: ExcalidrawElement["id"],
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  rootBounds: DOMRect,
) {
  return elements.flatMap((candidate) => {
    if (
      candidate.id === elementId
      || candidate.isDeleted
      || (candidate.type !== "image" && !isYouTubeMaterialElement(candidate) && !isInteractiveHtmlMaterialElement(candidate) && !isEmbeddedAppElement(candidate))
    ) return [];
    const candidateCenter = {
      x: candidate.x + candidate.width / 2,
      y: candidate.y + candidate.height / 2,
    };
    const corners = [
      { x: candidate.x, y: candidate.y },
      { x: candidate.x + candidate.width, y: candidate.y },
      { x: candidate.x + candidate.width, y: candidate.y + candidate.height },
      { x: candidate.x, y: candidate.y + candidate.height },
    ].map((corner) => rotateAroundCenter(corner, candidateCenter, candidate.angle))
      .map((corner) => sceneCoordsToViewportCoords({ sceneX: corner.x, sceneY: corner.y }, appState))
      .map((corner) => ({ x: corner.x - rootBounds.left, y: corner.y - rootBounds.top }));
    return [{
      bottom: Math.max(...corners.map((corner) => corner.y)),
      left: Math.min(...corners.map((corner) => corner.x)),
      right: Math.max(...corners.map((corner) => corner.x)),
      top: Math.min(...corners.map((corner) => corner.y)),
    }];
  });
}

function getImageQuickActions(
  element: ExcalidrawImageElement,
  hasCover: boolean,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): ImageQuickActions | null {
  if (!root) return null;

  const center = {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
  const centerViewport = sceneCoordsToViewportCoords({ sceneX: center.x, sceneY: center.y }, appState);
  const rootBounds = root.getBoundingClientRect();
  const coarsePointer = root.ownerDocument.defaultView?.matchMedia("(pointer: coarse)").matches ?? false;
  const layout = getImageQuickActionLayout({
    actionCount: 6,
    angle: element.angle,
    buttonSize: coarsePointer ? coarseMaterialQuickActionSize : desktopMaterialQuickActionSize,
    centerX: centerViewport.x - rootBounds.left,
    centerY: centerViewport.y - rootBounds.top,
    gap: coarsePointer ? coarseMaterialQuickActionGap : desktopMaterialQuickActionGap,
    height: Math.abs(element.height) * appState.zoom.value,
    alignToVisibleEnd: true,
    sidePreference: ["right", "left", "bottom", "top"],
    obstacles: getMaterialQuickActionObstacles(element.id, elements, appState, rootBounds),
    viewportHeight: rootBounds.height,
    viewportWidth: rootBounds.width,
    width: Math.abs(element.width) * appState.zoom.value,
  });
  const [print, enhance, cover, crop, centerAction, focus] = layout.points;
  return {
    center: centerAction,
    cover,
    crop,
    enhance,
    focus,
    hasCover,
    imageId: element.id,
    isEnhanced: isScanEnhancementActive(element),
    isCropping: appState.croppingElementId === element.id,
    print,
  };
}

function getCanvasCoverQuickAction(
  element: ExcalidrawElement,
  hasCover: boolean,
  appState: AppState,
  root: HTMLDivElement | null,
  actionCount = 1,
  obstacles: readonly { bottom: number; left: number; right: number; top: number }[] = [],
  editorBounds?: TextEditorBounds | null,
): CanvasCoverQuickAction | null {
  if (!root) return null;
  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const centerViewport = sceneCoordsToViewportCoords({ sceneX: center.x, sceneY: center.y }, appState);
  const rootBounds = root.getBoundingClientRect();
  const coarsePointer = root.ownerDocument.defaultView?.matchMedia("(pointer: coarse)").matches ?? false;
  const actionBounds = actionCount === 3 && element.type === "text" && !element.containerId
    && element.angle === 0 && editorBounds?.elementId === element.id ? editorBounds : null;
  const actionWidth = actionBounds ? Math.max(actionBounds.width, getTextEntryMinimumWidth(1,
    coarsePointer ? coarseMaterialQuickActionSize : desktopMaterialQuickActionSize,
    coarsePointer ? coarseMaterialQuickActionGap : desktopMaterialQuickActionGap)) : null;
  const layout = getImageQuickActionLayout({
    actionCount,
    angle: element.angle,
    buttonSize: coarsePointer ? coarseMaterialQuickActionSize : desktopMaterialQuickActionSize,
    centerX: (actionBounds ? actionBounds.left + actionWidth! / 2 : centerViewport.x) - rootBounds.left,
    centerY: (actionBounds ? actionBounds.top + actionBounds.height / 2 : centerViewport.y) - rootBounds.top,
    gap: coarsePointer ? coarseMaterialQuickActionGap : desktopMaterialQuickActionGap,
    height: actionBounds ? actionBounds.height : Math.abs(element.height) * appState.zoom.value,
    obstacles,
    sidePreference: actionCount === 3 ? ["bottom", "top"] : undefined,
    sideInsets: actionCount === 3 && element.type === "text" && !element.containerId && !appState.editingTextElement
      ? {top:textBoxRotationOffset+24,bottom:textBoxHandleSpacing+24}:undefined,
    viewportHeight: rootBounds.height,
    viewportWidth: rootBounds.width,
    width: actionWidth ?? Math.abs(element.width) * appState.zoom.value,
  });
  return {
    cover: layout.points[actionCount === 3 ? 2 : 0],
    ...(actionCount === 3 ? { edit: layout.points[0], format: layout.points[1] } : {}),
    hasCover,
    targetId: element.id,
  };
}

function isVideoMaterialElement(element: ExcalidrawElement | null | undefined): element is ExcalidrawElement {
  return Boolean(element && (isYouTubeMaterialElement(element) || isLocalVideoMaterialElement(element)));
}

function isVideoOrAppElement(element: ExcalidrawElement | null | undefined): element is ExcalidrawElement {
  return isVideoMaterialElement(element) || isEmbeddedAppElement(element);
}

function getVideoQuickActions(
  element: ExcalidrawElement,
  hasCover: boolean,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): VideoQuickActions | null {
  if (!root) return null;
  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const centerViewport = sceneCoordsToViewportCoords({ sceneX: center.x, sceneY: center.y }, appState);
  const rootBounds = root.getBoundingClientRect();
  const coarsePointer = root.ownerDocument.defaultView?.matchMedia("(pointer: coarse)").matches ?? false;
  const layout = getImageQuickActionLayout({
    actionCount: 3,
    angle: element.angle,
    buttonSize: coarsePointer ? coarseMaterialQuickActionSize : desktopMaterialQuickActionSize,
    centerX: centerViewport.x - rootBounds.left,
    centerY: centerViewport.y - rootBounds.top,
    gap: coarsePointer ? coarseMaterialQuickActionGap : desktopMaterialQuickActionGap,
    height: Math.abs(element.height) * appState.zoom.value,
    alignToVisibleEnd: true,
    sidePreference: ["right", "left", "bottom", "top"],
    obstacles: getMaterialQuickActionObstacles(element.id, elements, appState, rootBounds),
    viewportHeight: rootBounds.height,
    viewportWidth: rootBounds.width,
    width: Math.abs(element.width) * appState.zoom.value,
  });
  const [cover, centerAction, focus] = layout.points;
  return {
    center: centerAction,
    cover,
    focus,
    hasCover,
    kind: isEmbeddedAppElement(element) ? "app" : "video",
    videoId: element.id,
  };
}

function getInteractiveHtmlQuickActions(
  element: ExcalidrawElement,
  hasCover: boolean,
  showLiveAccess: boolean,
  showPrint: boolean,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): InteractiveHtmlQuickActions | null {
  if (!root || !isInteractiveHtmlMaterialElement(element)) return null;
  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const centerViewport = sceneCoordsToViewportCoords({ sceneX: center.x, sceneY: center.y }, appState);
  const rootBounds = root.getBoundingClientRect();
  const coarsePointer = root.ownerDocument.defaultView?.matchMedia("(pointer: coarse)").matches ?? false;
  const layout = getImageQuickActionLayout({
    actionCount: 5 + Number(showLiveAccess) + Number(showPrint),
    angle: element.angle,
    buttonSize: coarsePointer ? coarseMaterialQuickActionSize : desktopMaterialQuickActionSize,
    centerX: centerViewport.x - rootBounds.left,
    centerY: centerViewport.y - rootBounds.top,
    gap: coarsePointer ? coarseMaterialQuickActionGap : desktopMaterialQuickActionGap,
    height: Math.abs(element.height) * appState.zoom.value,
    alignToVisibleEnd: true,
    sidePreference: ["right", "left", "bottom", "top"],
    obstacles: [
      ...getMaterialQuickActionObstacles(element.id, elements, appState, rootBounds),
      ...(element.locked ? [getInteractiveHtmlControlsBounds(centerViewport.x - rootBounds.left, centerViewport.y - rootBounds.top,
        Math.abs(element.width) * appState.zoom.value, Math.abs(element.height) * appState.zoom.value,
        element.angle, appState.zoom.value)] : []),
    ],
    viewportHeight: rootBounds.height,
    viewportWidth: rootBounds.width,
    width: Math.abs(element.width) * appState.zoom.value,
  });
  const persist = layout.points[0]!;
  const reset = layout.points[1]!;
  const print = showPrint ? layout.points[2]! : undefined;
  const access = showLiveAccess ? layout.points[2 + Number(showPrint)]! : undefined;
  const actionOffset = Number(showPrint) + Number(showLiveAccess);
  const cover = layout.points[2 + actionOffset]!;
  const centerAction = layout.points[3 + actionOffset]!;
  const focus = layout.points[4 + actionOffset]!;
  return {
    ...(access ? { access } : {}),
    ...(print ? { print } : {}),
    center: centerAction,
    cover,
    elementId: element.id,
    focus,
    hasCover,
    persist,
    reset,
  };
}

function getSelectedInteractiveHtmlQuickActions(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
  showLiveAccess: boolean,
) {
  const selectedIds = Object.keys(appState.selectedElementIds).filter((id) => appState.selectedElementIds[id]);
  const selectedElements = selectedIds.flatMap((id) => {
    const element = elements.find((candidate) => candidate.id === id);
    return element ? [element] : [];
  });
  const selectedGroupId = Object.keys(appState.selectedGroupIds).find((groupId) => (
    elements.some((element) => isInteractiveHtmlMaterialElement(element) && element.groupIds.includes(groupId))
  ));
  const groupedSelection = selectedGroupId
    ? elements.find((element) => isInteractiveHtmlMaterialElement(element) && element.groupIds.includes(selectedGroupId))
    : null;
  const selected = groupedSelection && isInteractiveHtmlMaterialElement(groupedSelection)
    ? groupedSelection
    : selectedElements.length === 1 && isInteractiveHtmlMaterialElement(selectedElements[0])
      ? selectedElements[0]
      : null;
  if (appState.activeTool.type !== "selection" || !selected) return null;
  return getInteractiveHtmlQuickActions(
    selected,
    Boolean(getImageCover(elements, selected.id)),
    showLiveAccess,
    Boolean(getInteractiveHtmlPrintCapability(selected.id)),
    elements,
    appState,
    root,
  );
}

function getImageCoverFrame(
  image: CoverTarget,
  cover: ExcalidrawElement,
  appState: AppState,
  root: HTMLDivElement | null,
  forSweep = false,
): ImageCoverFrame | null {
  if (!root) return null;
  const rect = coverRectForTarget(image, cover);
  const aperture = imageCoverRectToScene(image, rect);
  const polygon = cover.type === "line" ? coverPolygonBounds(cover.points) : null;
  const bounds = forSweep ? { ...cover, x: cover.x + (polygon?.x ?? 0), y: cover.y + (polygon?.y ?? 0) } : aperture;
  const center = sceneCoordsToViewportCoords({
    sceneX: bounds.x + bounds.width / 2,
    sceneY: bounds.y + bounds.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  return {
    angle: bounds.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    coverId: cover.id,
    height: Math.abs(bounds.height) * appState.zoom.value,
    imageId: image.id,
    isFull: isImageCoverFull(rect),
    isProjectedMaterial: isVideoMaterialElement(image) || isInteractiveHtmlMaterialElement(image) || isEmbeddedAppElement(image),
    geometry: cover.type === "line"
      ? { type: "polygon", roundness: null, points: polygon!.points, strokeWidth: 0,
          width: Math.abs(bounds.width), height: Math.abs(bounds.height) }
      : { type: cover.type === "ellipse" || cover.type === "diamond" ? cover.type : "rectangle",
          roundness: cover.roundness, strokeWidth: cover.strokeWidth,
          width: Math.abs(bounds.width), height: Math.abs(bounds.height) },
    width: Math.abs(bounds.width) * appState.zoom.value,
  };
}

function getImageCropSelectionFrame(
  image: ExcalidrawImageElement,
  natural: { height: number; width: number },
  mode: ImageCropSelectionFrame["mode"],
  rect: NormalizedImageCropRect | null,
  appState: AppState,
  root: HTMLDivElement | null,
): ImageCropSelectionFrame | null {
  if (!root) return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: image.x + image.width / 2,
    sceneY: image.y + image.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  return {
    angle: image.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    height: Math.abs(image.height) * appState.zoom.value,
    imageId: image.id,
    mode,
    naturalHeight: natural.height,
    naturalWidth: natural.width,
    rect,
    width: Math.abs(image.width) * appState.zoom.value,
  };
}

function getImageCropTrimHandleStyle(
  handle: ImageCropTrimHandle,
  rect: NormalizedImageCropRect,
): CSSProperties {
  const left = `${rect.x * 100}%`;
  const right = `${(rect.x + rect.width) * 100}%`;
  const top = `${rect.y * 100}%`;
  const bottom = `${(rect.y + rect.height) * 100}%`;
  const width = `${rect.width * 100}%`;
  const height = `${rect.height * 100}%`;

  if (handle === "north" || handle === "south") {
    return { left, top: handle === "north" ? top : bottom, width };
  }
  if (handle === "west" || handle === "east") {
    return { height, left: handle === "west" ? left : right, top };
  }
  return {
    left: handle.includes("west") ? left : right,
    top: handle.includes("north") ? top : bottom,
  };
}

function loadImageDimensions(dataUrl: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve({ height: image.naturalHeight, width: image.naturalWidth }), { once: true });
    image.addEventListener("error", () => reject(new Error(t("Bildabmessungen konnten nicht gelesen werden."))), { once: true });
    image.src = dataUrl;
  });
}

async function getImagePrintScale(image: ExcalidrawImageElement, dataUrl: string) {
  const natural = await loadImageDimensions(dataUrl);
  const sourceWidth = image.crop?.width ?? natural.width;
  const sourceHeight = image.crop?.height ?? natural.height;
  const widthScale = sourceWidth / Math.max(1, Math.abs(image.width));
  const heightScale = sourceHeight / Math.max(1, Math.abs(image.height));
  return Math.max(1, Math.min(4, widthScale, heightScale));
}

function getImagePrintTitle(image: ExcalidrawImageElement) {
  const fileName = typeof image.customData?.sourceFileName === "string"
    ? image.customData.sourceFileName
    : t("Material");
  const pageNumber = typeof image.customData?.sourcePageNumber === "number"
    ? image.customData.sourcePageNumber
    : null;
  return pageNumber ? t("{0} – Seite {1}", fileName, pageNumber) : fileName;
}

function getElementFocusFrame(element: ExcalidrawElement, appState: AppState, root: HTMLDivElement | null, paddingOverride?: number): ElementFocusFrame | null {
  if (!root) return null;

  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  const padding = paddingOverride ?? (element.type === "image" ? 0 : elementFocusPadding);
  return {
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    elementId: element.id,
    height: Math.abs(element.height) * appState.zoom.value + padding * 2,
    viewportHeight: rootBounds.height,
    viewportWidth: rootBounds.width,
    width: Math.abs(element.width) * appState.zoom.value + padding * 2,
  };
}

function getShapeShadowFrames(elements: readonly ExcalidrawElement[], appState: AppState, root: HTMLDivElement | null): ShapeShadowFrame[] {
  return elements.flatMap(element => {
    if (!isBasicShapeElement(element) || element.isDeleted || element.link || element.opacity <= 0
      || getShapeFillMode(element) === "empty") return [];
    const frame = getElementFocusFrame(element, appState, root, 0);
    if (!frame || frame.width <= 0 || frame.height <= 0) return [];
    return [{
      ...frame,
      cornerRadius: element.roundness ? Math.min(24 * appState.zoom.value, frame.width / 8, frame.height / 8) : 0,
      opacity: element.opacity / 100,
      shapeType: element.type as ShapeShadowFrame["shapeType"],
    }];
  });
}

function getAudioPlayerFrame(
  element: ExcalidrawElement,
  appState: AppState,
  root: HTMLDivElement | null,
): AudioCanvasPlayerFrame | null {
  if (element.isDeleted || element.customData?.materialKind !== "audio") return null;
  const fileName = element.customData.sourceFileName;
  const lessonId = element.customData.sourceLessonId;
  const materialPath = element.customData.sourceMaterialPath;
  if (typeof fileName !== "string" || typeof lessonId !== "string" || typeof materialPath !== "string") return null;
  if (!root) return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  return {
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    elementId: element.id,
    fileName,
    height: Math.abs(element.height) * appState.zoom.value,
    sourceUrl: lessonMaterialFileUrl(lessonId, materialPath),
    width: Math.abs(element.width) * appState.zoom.value,
  };
}

function getVideoPlayerFrame(
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): VideoCanvasPlayerFrame | null {
  if (!isLocalVideoMaterialElement(element) || !root) return null;
  const fileName = element.customData.sourceFileName;
  const lessonId = element.customData.sourceLessonId;
  const materialPath = element.customData.sourceMaterialPath;
  if (typeof fileName !== "string" || typeof lessonId !== "string" || typeof materialPath !== "string") return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  return {
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    covered: Boolean(getImageCover(elements, element.id)),
    elementId: element.id,
    fileName,
    height: Math.abs(element.height) * appState.zoom.value,
    sourceUrl: lessonMaterialFileUrl(lessonId, materialPath),
    width: Math.abs(element.width) * appState.zoom.value,
  };
}

function getInteractiveHtmlFrame(
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
  pendingAnnotationIds: ReadonlySet<string>,
  currentScrollOffset?: InteractiveHtmlScrollOffset,
  movingAnnotationId?: string,
  annotationScene?: InteractiveHtmlAnnotationScene,
): InteractiveHtmlCanvasFrameData | null {
  if (element.isDeleted || element.customData?.materialKind !== "interactive-html" || !root) return null;
  const materialId = element.customData.interactiveHtmlId;
  const lessonId = element.customData.sourceLessonId;
  const entry = element.customData.sourceEntry;
  const title = element.customData.sourceTitle;
  if (
    typeof materialId !== "string"
    || typeof lessonId !== "string"
    || typeof entry !== "string"
    || typeof title !== "string"
  ) return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  const cover = getImageCover(elements, element.id);
  const transientAnnotationIds = new Set(elements.flatMap((candidate) => {
    if (!pendingAnnotationIds.has(candidate.id) || candidate.isDeleted) return [];
    const center = { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 };
    return findTopmostMaterialAnnotationTargetAtPoint(elements, center)?.id === element.id ? [candidate.id] : [];
  }));
  const annotationProjection = projectInteractiveHtmlAnnotations(
    element,
    elements,
    imageAnnotationGroupId(element.id),
    appState.selectedElementIds,
    transientAnnotationIds,
    currentScrollOffset,
    movingAnnotationId,
    annotationScene,
  );
  return {
    viewportWidth: rootBounds.width,
    viewportHeight: rootBounds.height,
    selected: Boolean(appState.selectedElementIds[element.id]),
    locked: element.locked,
    annotationKey: annotationProjection.key,
    annotations: annotationProjection.annotations,
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    contentZoom: normalizeInteractiveHtmlContentZoom(element.customData.interactiveHtmlContentZoom),
    contentOnly: hasContentOnlyHtmlFrame(element),
    pageOrientation: readHtmlPageOrientation(element.customData.interactiveHtmlPageOrientation),
    coverRect: cover ? coverRectForTarget(element, cover) : null,
    elementId: element.id,
    height: Math.abs(element.height) * appState.zoom.value,
    sceneHeight: Math.abs(element.height),
    sceneWidth: Math.abs(element.width),
    sourceUrl: lessonInteractiveMaterialUrl(lessonId, materialId, entry),
    lessonId,
    materialId,
    entry,
    title,
    width: Math.abs(element.width) * appState.zoom.value,
    zoom: appState.zoom.value,
  };
}

function getEmbeddedAppFrame(
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
  pendingAnnotationIds: ReadonlySet<string>,
  currentScrollOffset?: InteractiveHtmlScrollOffset,
  movingAnnotationId?: string,
  annotationScene?: InteractiveHtmlAnnotationScene,
): InteractiveHtmlCanvasFrameData | null {
  if (!isEmbeddedAppElement(element) || !root) return null;
  const app = embeddedAppById(element.customData?.embeddedAppId);
  if (!app) return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  const cover = getImageCover(elements, element.id);
  const transientAnnotationIds = new Set(elements.flatMap((candidate) => {
    if (!pendingAnnotationIds.has(candidate.id) || candidate.isDeleted) return [];
    const candidateCenter = { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 };
    return findTopmostMaterialAnnotationTargetAtPoint(elements, candidateCenter)?.id === element.id ? [candidate.id] : [];
  }));
  const annotationProjection = projectInteractiveHtmlAnnotations(
    element,
    elements,
    imageAnnotationGroupId(element.id),
    appState.selectedElementIds,
    transientAnnotationIds,
    currentScrollOffset,
    movingAnnotationId,
    annotationScene,
  );
  return {
    viewportWidth: rootBounds.width,
    viewportHeight: rootBounds.height,
    selected: Boolean(appState.selectedElementIds[element.id]),
    locked: element.locked,
    annotationKey: annotationProjection.key,
    annotations: annotationProjection.annotations,
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    contentZoom: normalizeInteractiveHtmlContentZoom(element.customData?.embeddedAppContentZoom),
    contentOnly: hasContentOnlyHtmlFrame(element),
    coverRect: cover ? coverRectForTarget(element, cover) : null,
    elementId: element.id,
    embeddedApp: app,
    height: Math.abs(element.height) * appState.zoom.value,
    sceneHeight: Math.abs(element.height),
    sceneWidth: Math.abs(element.width),
    sourceUrl: app.sourceUrl,
    lessonId: "",
    materialId: "",
    entry: "",
    title: app.name,
    width: Math.abs(element.width) * appState.zoom.value,
    zoom: appState.zoom.value,
  };
}

function getYouTubePlayerFrame(
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  root: HTMLDivElement | null,
): YouTubeCanvasPlayerFrame | null {
  if (!isYouTubeMaterialElement(element) || !root) return null;
  const title = element.customData?.sourceTitle;
  const videoId = element.customData?.videoId;
  if (typeof title !== "string" || typeof videoId !== "string") return null;
  const center = sceneCoordsToViewportCoords({
    sceneX: element.x + element.width / 2,
    sceneY: element.y + element.height / 2,
  }, appState);
  const rootBounds = root.getBoundingClientRect();
  const projectionSize = getYouTubePlayerProjectionSize(element.width, element.height, appState.zoom.value);
  return {
    angle: element.angle,
    centerX: center.x - rootBounds.left,
    centerY: center.y - rootBounds.top,
    covered: Boolean(getImageCover(elements, element.id)),
    elementId: element.id,
    height: projectionSize.viewportHeight,
    providerControlsHeight: getYouTubeProviderControlsHeight(projectionSize.surfaceHeight),
    providerTopControlsHeight: getYouTubeProviderTopControlsHeight(projectionSize.surfaceHeight),
    surfaceHeight: projectionSize.surfaceHeight,
    surfaceScale: projectionSize.surfaceScale,
    surfaceWidth: projectionSize.surfaceWidth,
    title,
    videoId,
    width: projectionSize.viewportWidth,
  };
}

export function CanvasSurface({ onMaterialFocusChange, getFocusViewport, onTimerRuntimeReady, laserControls, clipControls, interactiveLiveControls, materialControls, activeShape, activeTool, canvasBackgroundColor: requestedCanvasBackgroundColor, lessonId, lessonSeed, markerColor, markerStrokeWidth, materialShadows, onMaterialUsageChange, onPortReady, onLiveApiReady, onLiveInkPreviewChange, onShapeColorChange, onShapeFillChange, onTemporaryPanChange, onToolChange, onZoomChange, penColor, penStrokeWidth, shapeColor, shapeFill, theme }: CanvasSurfaceProps) {
  useUiLocale();
  const [recoveryResolver, setRecoveryResolver] = useState<((choice: CanvasRecoveryChoice) => void) | null>(null);
  const recoveryRequest = useRef<{ lessonId: string; choice: Promise<CanvasRecoveryChoice> } | null>(null);
  const resolveRecovery = useCallback<ResolveCanvasRecovery>(() => {
    // StrictMode may start initial loading twice. Both loads must wait on the
    // same decision, not leave the first promise stranded behind a second UI.
    if (recoveryRequest.current?.lessonId === lessonId) return recoveryRequest.current.choice;
    const choice = new Promise<CanvasRecoveryChoice>(resolve => {
      setRecoveryResolver(() => (value: CanvasRecoveryChoice) => { setRecoveryResolver(null); resolve(value); });
    });
    recoveryRequest.current = { lessonId, choice };
    return choice;
  }, [lessonId]);
  const resolvedCanvasBackgroundColor = requestedCanvasBackgroundColor ?? canvasBackgrounds[theme][defaultThemeVariants[theme]];
  const [clips, setClips] = useState<PresentationClip[]>([]);
  const clipsRef = useRef<PresentationClip[]>([]);
  const agentClipCommit = useRef<((clips: PresentationClip[]) => void) | null>(null);
  const agentActive = useRef(true);
  const committedAgentPort = useRef<CanvasPort | null>(null);
  useEffect(() => { agentActive.current = true; return () => { agentActive.current = false; }; }, []);
  const archiveRemovalClipControls = useRef(clipControls);
  archiveRemovalClipControls.current = clipControls;
  const removedArchiveMaterials = useRef<readonly MaterialRemoval[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const markerEraserPointer = useRef<{ id: number; point: { x: number; y: number } } | null>(null);
  const persistenceTimer = useRef<number | null>(null);
  const latestSnapshot = useRef<StoredCanvasSnapshot | null>(null);
  const interactiveHtmlStatesRef = useRef<StoredInteractiveHtmlStates>({});
  const interactiveHtmlInitialStatesRef = useRef(new Map<string, JsonValue>());
  const interactiveHtmlCurrentStatesRef = useRef(new Map<string, JsonValue>());
  const interactiveHtmlPersistenceDisabledIdsRef = useRef(new Set<string>());
  const hydratedInteractiveHtmlIds = useRef(new Set<string>());
  const readyInteractiveHtmlIds = useRef(new Set<string>());
  const annotationMoveDrag = useRef<AnnotationMoveDrag | null>(null);
  const interactiveHtmlPanDrag = useRef<InteractiveHtmlPanDrag | null>(null);
  const interactiveHtmlScrollOffsets = useRef(new Map<ExcalidrawElement["id"], InteractiveHtmlScrollOffset>());
  const projectedMediaMoveDrag = useRef<MaterialBundleMoveDrag | null>(null);
  const [projectedMediaMoveActive,setProjectedMediaMoveActive]=useState(false);
  const imageCoverDrag = useRef<ImageCoverDrag | null>(null);
  const materialBundleMoveDrag = useRef<MaterialBundleMoveDrag | null>(null);
  const imageCropSelectionDrag = useRef<ImageCropSelectionDrag | null>(null);
  const imageCropSelectionRef = useRef<ImageCropSelectionFrame | null>(null);
  const imageCoverFeedbackKey = useRef(0);
  const [projectedAnnotationDragId, setProjectedAnnotationDragId] = useState<string | null>(null);
  const pendingImageCoverAdd = useRef<{
    cover: ExcalidrawElement;
    forgetMemory: boolean;
    imageId: ExcalidrawElement["id"];
    rect: ImageCoverRect;
  } | null>(null);
  const pageTransformActive = useRef(false);
  const textBoxTransformActive = useRef(false);
  const [selectedPageId,setSelectedPageId] = useState<string|null>(null);
  const imageTransformDrag = useRef<ImageTransformDrag | null>(null);
  const textMoveDrag = useRef<TextMoveDrag | null>(null);
  const pendingBoundTextColor = useRef<{
    containerId: ExcalidrawTextElement["containerId"];
    elementId: ExcalidrawTextElement["id"] | null;
    strokeColor: string;
  } | null>(null);
  const pendingOneShotCreation = useRef<PendingOneShotCreation | null>(null);
  const snapshotSceneVersion = useRef<number | null>(null);
  const imageGroupUpdateScheduled = useRef(false);
  const imageCoverRepairScheduled = useRef(false);
  const markerSelectionCleanupScheduled = useRef(false);
  const knownElementIds = useRef(new Set<ExcalidrawElement["id"]>());
  const pendingNewAnnotationIds = useRef(new Set<ExcalidrawElement["id"]>());
  const inkPreviewId = useRef<string | null>(null);
  const sceneImages = useRef<ExcalidrawImageElement[]>([]);
  const materialUsage = useRef<CanvasMaterialUsage>(emptyCanvasMaterialUsage);
  const onToolChangeRef = useRef(onToolChange);
  const hoveredImageId = useRef<ExcalidrawImageElement["id"] | null>(null);
  const selectedImageId = useRef<ExcalidrawImageElement["id"] | null>(null);
  const focusedElementIds = useRef<ExcalidrawElement["id"][]>([]);
  const materialPrintPending = useRef(false);
  const scanEnhancementPending = useRef(false);
  const documentImageJob = useRef<{ controller: AbortController; image: ExcalidrawImageElement; cropAllowed: boolean } | null>(null);
  const [documentImageEditor, setDocumentImageEditor] = useState<{
    source: DataURL; result: DocumentImageResult | null; fixedRect: NormalizedImageCropRect | null; angle: number; mirrorX: boolean; mirrorY: boolean; saving: boolean; error: string | null;
  } | null>(null);
  useEffect(() => () => { documentImageJob.current?.controller.abort(); documentImageJob.current = null; }, []);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  useEffect(() => {
    onLiveApiReady?.(api);
    return () => onLiveApiReady?.(null);
  }, [api, onLiveApiReady]);
  const [canvasActionError, setCanvasActionError] = useState<string | null>(null);
  const timerApiRef = useRef(api); timerApiRef.current = api;
  const [timerSound] = useState(() => new TimerSound());
  const [timerRuntime] = useState(() => new TimerRuntime({
    onPrepareSound: () => { void timerSound.activate(); },
    isConfigurationBusy: () => {
      const state = timerApiRef.current?.getAppState();
      return Boolean(inkPreviewId.current || projectedMediaMoveDrag.current || annotationMoveDrag.current
        || pageTransformActive.current || textBoxTransformActive.current || imageCoverDrag.current || materialBundleMoveDrag.current || imageTransformDrag.current || textMoveDrag.current
        || imageCropSelectionDrag.current || state?.newElement || state?.editingTextElement
        || state?.selectedElementsAreBeingDragged || state?.isResizing || state?.isRotating);
    },
    onConfig: (config, origin) => {
      const currentApi = timerApiRef.current;
      if (!currentApi) return;
      currentApi.updateScene({ elements: currentApi.getSceneElementsIncludingDeleted().map(element => element.id === config.id && isTimerWidget(element)
        ? newElementWith(element, { customData: { ...element.customData, timerDurationSeconds: config.durationSeconds, timerSoundEnabled: config.soundEnabled } }) : element),
        captureUpdate: origin === 'room' ? CaptureUpdateAction.NEVER : CaptureUpdateAction.IMMEDIATELY });
    },
    onAlarm: id => {
      // Native deletion can precede its onChange notification by one frame.
      if (!timerApiRef.current?.getSceneElements().some(element => element.id === id && isTimerWidget(element))) return;
      if (!timerSound.play()) setCanvasActionError("Ton am Lehrergerät aktivieren");
    },
  }));
  useLayoutEffect(() => {
    onTimerRuntimeReady?.(timerRuntime);
    const wake = () => timerRuntime.checkDeadlines();
    window.addEventListener("focus", wake); document.addEventListener("visibilitychange", wake);
    return () => {
      onTimerRuntimeReady?.(null); timerRuntime.dispose(); timerSound.dispose();
      window.removeEventListener("focus", wake); document.removeEventListener("visibilitychange", wake);
    };
  }, [onTimerRuntimeReady, timerRuntime, timerSound]);
  useEffect(() => {
    if (!api) return;
    const sync = () => timerRuntime.reconcile(api.getSceneElements().flatMap(element => { const config = timerConfig(element); return config ? [config] : []; }));
    sync(); const stop = api.onChange(sync);
    const protectText = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.target instanceof Element && event.target.closest("button, input, textarea, [contenteditable=true]")) return;
      if (api.getSceneElements().some(element => isTimerWidget(element) && api.getAppState().selectedElementIds[element.id])) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", protectText, true);
    return () => { stop(); window.removeEventListener("keydown", protectText, true); };
  }, [api, timerRuntime]);
  const [elementContextMenu, setElementContextMenu] = useState<CanvasElementContextMenu | null>(null);
  const [imageCoverFrame, setImageCoverFrame] = useState<ImageCoverFrame | null>(null);
  const [projectedMaterialCoverFrames, setProjectedMaterialCoverFrames] = useState<ImageCoverFrame[]>([]);
  const [imageCoverFeedback, setImageCoverFeedback] = useState<ImageCoverFeedback | null>(null);
  const [imageCropMenuImageId, setImageCropMenuImageId] = useState<ExcalidrawImageElement["id"] | null>(null);
  const [imageCropSelection, setImageCropSelection] = useState<ImageCropSelectionFrame | null>(null);
  const [imageQuickActions, setImageQuickActions] = useState<ImageQuickActions | null>(null);
  const [canvasCoverQuickAction, setCanvasCoverQuickAction] = useState<CanvasCoverQuickAction | null>(null);
  const [enhancingImageId, setEnhancingImageId] = useState<ExcalidrawImageElement["id"] | null>(null);
  const [materialShadowFrames, setMaterialShadowFrames] = useState<ImageAppearanceFrame[]>([]);
  const [shapeShadowFrames, setShapeShadowFrames] = useState<ShapeShadowFrame[]>([]);
  const [audioPlayerFrames, setAudioPlayerFrames] = useState<AudioCanvasPlayerFrame[]>([]);
  const [videoPlayerFrames, setVideoPlayerFrames] = useState<VideoCanvasPlayerFrame[]>([]);
  const [interactiveHtmlFrames, setInteractiveHtmlFrames] = useState<InteractiveHtmlCanvasFrameData[]>([]);
  const [interactiveHtmlQuickActions, setInteractiveHtmlQuickActions] = useState<InteractiveHtmlQuickActions | null>(null);
  const [, setInteractiveHtmlStateVersion] = useState(0);
  const [interactiveHtmlPrintCapabilityRevision, setInteractiveHtmlPrintCapabilityRevision] = useState(0);
  const [interactiveHtmlResetTarget, setInteractiveHtmlResetTarget] = useState<string | null>(null);
  const [youtubePlayerFrames, setYouTubePlayerFrames] = useState<YouTubeCanvasPlayerFrame[]>([]);
  const [activeYouTubePlayerId, setActiveYouTubePlayerId] = useState<ExcalidrawElement["id"] | null>(null);
  const [projectedMediaZoomModifierActive, setProjectedMediaZoomModifierActive] = useState(false);
  const [videoQuickActions, setVideoQuickActions] = useState<VideoQuickActions | null>(null);
  const [elementFocusFrames, setElementFocusFrames] = useState<ElementFocusFrame[]>([]);
  const [imagePrintError, setImagePrintError] = useState<string | null>(null);
  const [printingImageId, setPrintingImageId] = useState<ExcalidrawImageElement["id"] | null>(null);
  const [printingInteractiveHtmlId, setPrintingInteractiveHtmlId] = useState<ExcalidrawElement["id"] | null>(null);
  const [imageControls, setImageControls] = useState<ImageControls | null>(null);
  const [imageTransformPreview, setImageTransformPreview] = useState<ImageTransformPreview | null>(null);
  const [spacePanReady, setSpacePanReady] = useState(false);
  const [panCursorDragging, setPanCursorDragging] = useState(false);
  const [textFormattingContext, setTextFormattingContext] = useState<TextFormattingContext | null>(null);
  const [textFormattingExpanded, setTextFormattingExpanded] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textEditorBounds, setTextEditorBounds] = useState<TextEditorBounds | null>(null);
  const [editingRichText, setEditingRichText] = useState(false);
  const [richEditorFrame, setRichEditorFrame] = useState<{ element: ExcalidrawTextElement; appState: AppState } | null>(null);
  const [richEditorSelectionRevision, setRichEditorSelectionRevision] = useState(0);
  const [richFontSourcesSeen, setRichFontSourcesSeen] = useState(false);
  const [richFontRevision, setRichFontRevision] = useState(0);
  const pendingTextDoubleClick = useRef<{ textId: string; clientX: number; clientY: number; altKey: boolean } | null>(null);
  const richReconcileScheduled = useRef(false);
  const richFontsReady = useRef(false);
  const richPreviewPaintedId = useRef<string | null>(null);
  const lastRichEditingId = useRef<string | null>(null);
  const lastRichResizingId = useRef<string | null>(null);
  const richHandoff = useRef<{ id: string; generation: number; phase: "loading" | "revealing" } | null>(null);
  const richHandoffGeneration = useRef(0);
  useEffect(() => {
    const pending = pendingTextDoubleClick.current;
    if (!pending || !api) return;
    let frame = 0;
    let attempts = 0;
    const apply = () => {
      const editing = api.getAppState().editingTextElement;
      const textarea = rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
      if (editing?.type === "text" && editing.id === pending.textId && !richTextOf(editing) && textarea) {
        const range = nativeTextDoubleClickRange(editing, textarea.value, api.getAppState(),
          pending.clientX, pending.clientY, pending.altKey);
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(range.start, range.end);
        pendingTextDoubleClick.current = null;
      } else if (attempts++ < 2 && pendingTextDoubleClick.current === pending) {
        frame = window.requestAnimationFrame(apply);
      } else if (pendingTextDoubleClick.current === pending) {
        pendingTextDoubleClick.current = null;
      }
    };
    apply();
    return () => window.cancelAnimationFrame(frame);
  }, [api, richEditorSelectionRevision]);
  const [textToolbarPosition, setTextToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const textToolbarDrag = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const [textColorMenuOpen, setTextColorMenuOpen] = useState(false);
  const [textFontMenuOpen, setTextFontMenuOpen] = useState(false);
  const [textVerticalMenuOpen, setTextVerticalMenuOpen] = useState(false);
  const [movingTextId, setMovingTextId] = useState<ExcalidrawTextElement["id"] | null>(null);
  const [shapeFormattingContext, setShapeFormattingContext] = useState<ShapeFormattingContext | null>(null);
  const [shapeToolbarPosition, setShapeToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [shapeToolbarDock, setShapeToolbarDock] = useState<ShapeToolbarDock | null>(null);
  const [shapeToolbarDockPreview, setShapeToolbarDockPreview] = useState<ShapeToolbarDock | null>(null);
  const [shapeToolbarFloatingCompact, setShapeToolbarFloatingCompact] = useState(false);
  const [shapeToolbarDragging, setShapeToolbarDragging] = useState(false);
  const [shapeToolbarViewport, setShapeToolbarViewport] = useState({ width: 0, height: 0 });
  const shapeToolbarDrag = useRef<{ pointerId: number; startClientX: number; startClientY: number; x: number; y: number; compact: boolean; moved: boolean; candidate: ShapeToolbarDock | null } | null>(null);
  const [simpleMarkerSelection, setSimpleMarkerSelection] = useState(false);
  const spacePanReadyRef = useRef(false);
  const surfaceBackgroundAtPoint = useCallback((clientX: number, clientY: number) => {
    if (!api) return resolvedCanvasBackgroundColor;
    const point = viewportCoordsToSceneCoords({clientX, clientY}, api.getAppState());
    const elements = api.getSceneElements();
    const hit = topmostElementAtPoint(elements, point, 0);
    const material = findTopmostMaterialAnnotationTargetAtPoint(elements, point);
    const htmlPaper = material?.customData?.materialKind === "interactive-html"
      && material.customData?.surfaceKind !== "embedded-app" && hit?.id === material.id;
    return htmlPaper ? "#ffffff" : canvasBackgroundAtPoint(
      rootRef.current?.querySelector<HTMLCanvasElement>("canvas.excalidraw__canvas.static") ?? null,
      clientX, clientY, resolvedCanvasBackgroundColor,
    );
  }, [api, resolvedCanvasBackgroundColor]);
  const resolvePenStartColor = useCallback((event: ReactPointerEvent<HTMLDivElement>, color: string) =>
    automaticTextColor(color, surfaceBackgroundAtPoint(event.clientX, event.clientY)), [surfaceBackgroundAtPoint]);
  const startInkStroke = useInkInput(api, !laserControls?.active && !clipControls?.creating && (activeTool === "pen" || activeTool === "marker") ? activeTool : null,
    activeTool === "marker" ? markerColor : penColor, activeTool === "marker" ? markerStrokeWidth : penStrokeWidth, inkPreviewId, onLiveInkPreviewChange,
    interactiveHtmlScrollOffsets, undefined, undefined, resolvePenStartColor);
  onToolChangeRef.current = onToolChange;
  const initialData = useMemo(() => () => buildInitialData(theme, resolvedCanvasBackgroundColor, lessonId, lessonSeed, removals => { removedArchiveMaterials.current = removals; }, (loadedClips, loadedInteractiveHtmlStates) => {
    clipsRef.current = loadedClips;
    interactiveHtmlStatesRef.current = loadedInteractiveHtmlStates;
    hydratedInteractiveHtmlIds.current.clear();
    readyInteractiveHtmlIds.current.clear();
    setClips(loadedClips);
    setInteractiveHtmlStateVersion(version => version + 1);
  }, resolveRecovery), [lessonId, resolveRecovery]);
  const elementFocusDimPanels = useMemo(() => {
    const viewport = elementFocusFrames[0];
    if (!viewport) return null;
    return getElementFocusDimPanels(
      elementFocusFrames,
      viewport.viewportWidth,
      viewport.viewportHeight,
    );
  }, [elementFocusFrames]);

  useEffect(() => {
    if (
      activeYouTubePlayerId
      && !youtubePlayerFrames.some((frame) => frame.elementId === activeYouTubePlayerId && !frame.covered)
    ) {
      setActiveYouTubePlayerId(null);
    }
  }, [activeYouTubePlayerId, youtubePlayerFrames]);

  const persistLatestSnapshot = useCallback(() => {
    persistenceTimer.current = null;
    const snapshot = latestSnapshot.current;
    if (!snapshot) return;
    void saveCanvasSnapshot(lessonId, snapshot).catch((error: unknown) => {
      console.error(t("Canvas-Snapshot konnte nicht gespeichert werden."), error);
    });
  }, [lessonId]);

  const storeInteractiveHtmlStates = useCallback((states: StoredInteractiveHtmlStates) => {
    interactiveHtmlStatesRef.current = states;
    setInteractiveHtmlStateVersion(version => version + 1);
    if (!latestSnapshot.current) return;
    latestSnapshot.current = {
      ...latestSnapshot.current,
      interactiveHtmlStates: Object.keys(states).length > 0 ? states : undefined,
    };
    if (persistenceTimer.current !== null) window.clearTimeout(persistenceTimer.current);
    persistenceTimer.current = window.setTimeout(persistLatestSnapshot, persistenceDelay);
  }, [persistLatestSnapshot]);

  const getUnsavedInteractiveHtmlChangeCount = useCallback(() => {
    if (!api) return 0;
    const activeInteractiveHtmlIds = new Set(api.getSceneElements().flatMap((element) => (
      isInteractiveHtmlMaterialElement(element) ? [element.id] : []
    )));
    const activeDisabledIds = new Set([...interactiveHtmlPersistenceDisabledIdsRef.current].filter((elementId) => (
      activeInteractiveHtmlIds.has(elementId)
    )));
    return countUnsavedInteractiveHtmlChanges(
      activeDisabledIds,
      interactiveHtmlInitialStatesRef.current,
      interactiveHtmlCurrentStatesRef.current,
    );
  }, [api]);

  useEffect(() => subscribeInteractiveHtmlState((change) => {
    if (change.lessonId !== lessonId) return;
    if (!interactiveHtmlInitialStatesRef.current.has(change.elementId)) {
      interactiveHtmlInitialStatesRef.current.set(change.elementId, change.state);
    }
    interactiveHtmlCurrentStatesRef.current.set(change.elementId, change.state);
    if (!readyInteractiveHtmlIds.current.has(change.elementId)) {
      readyInteractiveHtmlIds.current.add(change.elementId);
      setInteractiveHtmlStateVersion(version => version + 1);
    }
    const stored = interactiveHtmlStatesRef.current[change.elementId];
    if (!hydratedInteractiveHtmlIds.current.has(change.elementId)) {
      hydratedInteractiveHtmlIds.current.add(change.elementId);
      if (stored && applyInteractiveHtmlState(change.elementId, stored.state)) return;
    }
    if (interactiveHtmlPersistenceDisabledIdsRef.current.has(change.elementId)) return;
    storeInteractiveHtmlStates(withInteractiveHtmlState(
      interactiveHtmlStatesRef.current,
      change.elementId,
      change.state,
    ));
  }), [lessonId, storeInteractiveHtmlStates]);

  useEffect(() => subscribeInteractiveHtmlPrintCapabilities(() => {
    setInteractiveHtmlPrintCapabilityRevision((revision) => revision + 1);
  }), []);

  useEffect(() => {
    if (!api) return;
    const next = getSelectedInteractiveHtmlQuickActions(
      api.getSceneElements(),
      api.getAppState(),
      rootRef.current,
      Boolean(interactiveLiveControls),
    );
    setInteractiveHtmlQuickActions((previous) => (
      sameInteractiveHtmlQuickActions(previous, next) ? previous : next
    ));
  }, [api, interactiveHtmlPrintCapabilityRevision, interactiveLiveControls]);

  const toggleInteractiveHtmlPersistence = useCallback((elementId: string) => {
    setCanvasActionError(null);
    if (!interactiveHtmlPersistenceDisabledIdsRef.current.has(elementId)) {
      interactiveHtmlPersistenceDisabledIdsRef.current.add(elementId);
      storeInteractiveHtmlStates(withoutInteractiveHtmlState(interactiveHtmlStatesRef.current, elementId));
      return;
    }
    interactiveHtmlPersistenceDisabledIdsRef.current.delete(elementId);
    const state = getInteractiveHtmlState(elementId);
    if (state === null) {
      requestInteractiveHtmlState(elementId);
      setCanvasActionError("Das interaktive Material ist noch nicht bereit.");
      return;
    }
    hydratedInteractiveHtmlIds.current.add(elementId);
    storeInteractiveHtmlStates(withInteractiveHtmlState(interactiveHtmlStatesRef.current, elementId, state));
  }, [storeInteractiveHtmlStates]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (getUnsavedInteractiveHtmlChangeCount() === 0 && persistenceTimer.current === null
        && !fileCanvasSaveStatus(lessonId).pending) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [getUnsavedInteractiveHtmlChangeCount, lessonId]);

  const confirmInteractiveHtmlReset = useCallback(() => {
    if (!interactiveHtmlResetTarget) return;
    setCanvasActionError(null);
    if (!resetInteractiveHtmlState(interactiveHtmlResetTarget)) {
      setCanvasActionError("Das interaktive Material ist noch nicht bereit.");
    }
    setInteractiveHtmlResetTarget(null);
  }, [interactiveHtmlResetTarget]);

  const handleRichPreviewPainted = useCallback((textId: string) => {
    if (!api || (api.getAppState().editingTextElement?.id !== textId && lastRichResizingId.current !== textId)) return;
    if (richPreviewPaintedId.current === textId) return;
    richPreviewPaintedId.current = textId;
    queueMicrotask(() => {
      if (api.getAppState().editingTextElement?.id !== textId && lastRichResizingId.current !== textId) return;
      const scene = reconcileRichTextScene(api.getSceneElements(), textId, null, (api.getAppState().isResizing || textBoxTransformActive.current) ? textId : null);
      applyRichTextScene(api,scene,CaptureUpdateAction.NEVER);
    });
  }, [api]);

  useEffect(() => {
    if (!interactiveHtmlResetTarget) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setInteractiveHtmlResetTarget(null);
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [interactiveHtmlResetTarget]);

  const handleChange: NonNullable<ExcalidrawProps["onChange"]> = useCallback((elements, appState) => {
    const selected=elements.filter(element=>!element.isDeleted&&appState.selectedElementIds[element.id]);
    const page=selected.find(element=>!element.locked&&readHtmlPageOrientation(element.customData?.interactiveHtmlPageOrientation));
    const pageOnly=page&&selected.every(element=>element.id===page.id||element.groupIds.includes(imageAnnotationGroupId(page.id)));
    setSelectedPageId(pageOnly&&!appState.selectionElement&&appState.activeTool.type==='selection'?page.id:null);
    const normalizedHtml = normalizeHtmlPageFrames(normalizeInteractiveHtmlFrameGeometry(elements));
    if (normalizedHtml !== elements && api) {
      api.updateScene({ elements: normalizedHtml, captureUpdate: CaptureUpdateAction.NEVER });
      return;
    }
    const cleaned = pruneRemovedMaterials({elements, clips: clipsRef.current, interactiveHtmlStates: interactiveHtmlStatesRef.current}, removedArchiveMaterials.current, lessonId);
    if (cleaned.elements !== elements) {
      clipsRef.current = cleaned.clips;
      setClips(cleaned.clips);
      interactiveHtmlStatesRef.current = cleaned.interactiveHtmlStates;
      setInteractiveHtmlStateVersion(version => version + 1);
      api?.updateScene({elements: cleaned.elements, captureUpdate: CaptureUpdateAction.NEVER});
      return;
    }
    if (elements.some(element => richTextOf(element))) setRichFontSourcesSeen(true);
    const editingRichId = appState.editingTextElement?.type === "text"
      && elements.some(element => element.id === appState.editingTextElement?.id && richTextOf(element))
      ? appState.editingTextElement.id : null;
    const resizingRichTextCandidate = (appState.isResizing || textBoxTransformActive.current) && !editingRichId
      ? elements.find((element) => element.type === "text"
        && !element.isDeleted && richTextOf(element) !== null
        && (Boolean(appState.selectedElementIds[element.id])
          || Boolean(element.containerId && appState.selectedElementIds[element.containerId])))
      : null;
    const resizingRichText = resizingRichTextCandidate?.type === "text" ? resizingRichTextCandidate : null;
    const resizingRichId = resizingRichText?.id ?? null;
    const activeRichPreviewId = editingRichId ?? resizingRichId;
    if (richPreviewPaintedId.current !== activeRichPreviewId) richPreviewPaintedId.current = null;
    if (editingRichId) {
      lastRichEditingId.current = editingRichId;
      richHandoff.current = null;
    } else if (resizingRichId) {
      lastRichResizingId.current = resizingRichId;
      richHandoff.current = null;
    } else if ((lastRichEditingId.current || lastRichResizingId.current) && api && richFontsReady.current) {
      const id = lastRichEditingId.current ?? lastRichResizingId.current!;
      lastRichEditingId.current = null;
      lastRichResizingId.current = null;
      if (elements.some(element => element.id === id && richTextOf(element))) {
        const generation = ++richHandoffGeneration.current;
        richHandoff.current = { id, generation, phase: "loading" };
        queueMicrotask(() => {
          void (async () => {
            const hidden = reconcileRichTextScene(api.getSceneElements(), id);
            const rendition = hidden.elements.find(element => richTextImageSourceId(element) === id);
            const file = hidden.files.find(candidate => candidate.id === (rendition?.type === "image" ? rendition.fileId : null));
            applyRichTextScene(api,hidden,CaptureUpdateAction.NEVER);
            if (file) {
              const image = new Image();
              image.src = file.dataURL;
              await image.decode();
            }
            await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
            if (richHandoff.current?.generation !== generation || api.getAppState().editingTextElement?.id === id) return;
            richHandoff.current.phase = "revealing";
            const visible = reconcileRichTextScene(api.getSceneElements());
            applyRichTextScene(api,visible,CaptureUpdateAction.NEVER);
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
              if (richHandoff.current?.generation !== generation) return;
              richHandoff.current = null;
              setRichEditorFrame(previous => previous?.element.id === id ? null : previous);
            }));
          })().catch(error => {
            if (richHandoff.current?.generation !== generation) return;
            // Keep the direct text visible if decoding fails. A later edit or
            // lesson reload can regenerate the derived image from the source.
            setCanvasActionError(error instanceof Error ? error.message : "Textdarstellung fehlgeschlagen.");
          });
        });
      }
    }
    const hiddenRichId = (richPreviewPaintedId.current === activeRichPreviewId ? activeRichPreviewId : null)
      ?? (richHandoff.current?.phase === "loading" ? richHandoff.current.id : null);
    const deferredRichId = resizingRichId && richPreviewPaintedId.current !== resizingRichId ? resizingRichId : null;
    if (api && richFontsReady.current && !richReconcileScheduled.current && elements.some(element => richTextOf(element) || richTextImageSourceId(element))) {
      try {
        const candidate = reconcileRichTextScene(elements, hiddenRichId, deferredRichId, resizingRichId);
        if (candidate.changed || candidate.files.some(file=>!api.getFiles()[file.id])) {
          richReconcileScheduled.current = true;
          queueMicrotask(() => {
            richReconcileScheduled.current = false;
            const latestAppState = api.getAppState();
            const editingId = latestAppState.editingTextElement?.id;
            const resizingId = (latestAppState.isResizing || textBoxTransformActive.current) ? lastRichResizingId.current : null;
            const previewId = editingId ?? resizingId;
            const hiddenId = (richPreviewPaintedId.current === previewId ? previewId : null)
              ?? (richHandoff.current?.phase === "loading" ? richHandoff.current.id : null);
            const deferredId = resizingId && richPreviewPaintedId.current !== resizingId ? resizingId : null;
            const latest = reconcileRichTextScene(api.getSceneElements(), hiddenId, deferredId, resizingId);
            applyRichTextScene(api,latest,CaptureUpdateAction.EVENTUALLY);
          });
        }
      } catch (error: unknown) {
        setCanvasActionError(error instanceof Error ? error.message : "Textdarstellung fehlgeschlagen.");
      }
    }
    const transientAnnotationIds = new Set([
      ...pendingNewAnnotationIds.current,
      ...(inkPreviewId.current ? [inkPreviewId.current] : []),
    ]);
    const activeCreationElements = [appState.newElement, appState.editingTextElement].filter(
      (element): element is ExcalidrawElement => element !== null,
    );
    const oneShotCreation = updateOneShotCreation({
      activeCreationElements,
      activeTool,
      elements,
      knownElementIds: knownElementIds.current,
      pending: pendingOneShotCreation.current,
    });
    pendingOneShotCreation.current = oneShotCreation.pending;
    for (const element of activeCreationElements) {
      if (!knownElementIds.current.has(element.id)) pendingNewAnnotationIds.current.add(element.id);
    }
    let hasNewImage = false;
    const elementsById = new Map<ExcalidrawElement["id"], ExcalidrawElement>();
    const images: ExcalidrawImageElement[] = [];
    for (const element of elements) {
      elementsById.set(element.id, element);
      if (element.type === "image" && !element.isDeleted && !richTextImageSourceId(element)) images.push(element);
      if (!knownElementIds.current.has(element.id)) {
        knownElementIds.current.add(element.id);
        hasNewImage ||= element.type === "image" && !element.isDeleted && !richTextImageSourceId(element);
      }
    }
    sceneImages.current = images;
    const nextAudioPlayerFrames = elements.flatMap((element) => {
      const frame = getAudioPlayerFrame(element, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setAudioPlayerFrames((previous) => (
      sameAudioPlayerFrames(previous, nextAudioPlayerFrames) ? previous : nextAudioPlayerFrames
    ));
    const nextVideoPlayerFrames = elements.flatMap((element) => {
      const frame = getVideoPlayerFrame(element, elements, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setVideoPlayerFrames((previous) => (
      sameVideoPlayerFrames(previous, nextVideoPlayerFrames) ? previous : nextVideoPlayerFrames
    ));
    // Native erasing temporarily detaches ink. HTML keeps drawing its exact
    // canonical binding above the iframe throughout that adaptation.
    const projectionElements = withoutTemporaryEraserState(elements);
    const annotationScene = createInteractiveHtmlAnnotationScene(projectionElements);
    const nextInteractiveHtmlFrames = projectionElements.flatMap((element) => {
      const frame = getInteractiveHtmlFrame(
        element,
        projectionElements,
        appState,
        rootRef.current,
        transientAnnotationIds,
        interactiveHtmlScrollOffsets.current.get(element.id),
        annotationMoveDrag.current?.elementId,
        annotationScene,
      ) ?? getEmbeddedAppFrame(
        element,
        projectionElements,
        appState,
        rootRef.current,
        transientAnnotationIds,
        interactiveHtmlScrollOffsets.current.get(element.id),
        annotationMoveDrag.current?.elementId,
        annotationScene,
      );
      return frame ? [frame] : [];
    });
    setInteractiveHtmlFrames((previous) => (
      sameInteractiveHtmlFrames(previous, nextInteractiveHtmlFrames) ? previous : nextInteractiveHtmlFrames
    ));
    const nextYouTubePlayerFrames = elements.flatMap((element) => {
      const frame = getYouTubePlayerFrame(element, elements, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setYouTubePlayerFrames((previous) => (
      sameYouTubePlayerFrames(previous, nextYouTubePlayerFrames) ? previous : nextYouTubePlayerFrames
    ));
    const nextMaterialShadowFrames = images.flatMap((image) => {
      if (!materialShadows && !image.roundness) return [];
      const frame = getImageAppearanceFrame(image, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setMaterialShadowFrames((previous) => (
      sameImageAppearanceFrames(previous, nextMaterialShadowFrames) ? previous : nextMaterialShadowFrames
    ));
    const nextShapeShadowFrames = materialShadows ? getShapeShadowFrames(elements, appState, rootRef.current) : [];
    setShapeShadowFrames(previous => sameShapeShadowFrames(previous, nextShapeShadowFrames) ? previous : nextShapeShadowFrames);
    const nextProjectedMaterialCoverFrames = elements.flatMap((element) => {
      if (!isVideoMaterialElement(element) && !isInteractiveHtmlMaterialElement(element) && !isEmbeddedAppElement(element)) return [];
      const cover = getImageCover(elements, element.id);
      if (!cover) return [];
      const frame = getImageCoverFrame(element, cover, appState, rootRef.current, true);
      return frame ? [frame] : [];
    });
    setProjectedMaterialCoverFrames((previous) => (
      sameImageCoverFrames(previous, nextProjectedMaterialCoverFrames) ? previous : nextProjectedMaterialCoverFrames
    ));
    const nextMaterialUsage = canvasMaterialUsageFromElements(elements);
    if (!sameCanvasMaterialUsage(materialUsage.current, nextMaterialUsage)) {
      materialUsage.current = nextMaterialUsage;
      onMaterialUsageChange(nextMaterialUsage);
    }

    const nextZoomPercent = Math.round(appState.zoom.value * 100);
    onZoomChange(nextZoomPercent);

    const previousSnapshot = latestSnapshot.current;
    // Native transforms mutate elements inside the existing scene array.
    // Array identity alone misses resize/rotation changes and their final save.
    const sceneVersion = getSceneVersion(elements);
    const snapshotChanged = !previousSnapshot
      || snapshotSceneVersion.current !== sceneVersion
      || previousSnapshot.elements !== elements
      || previousSnapshot.viewport.scrollX !== appState.scrollX
      || previousSnapshot.viewport.scrollY !== appState.scrollY
      || previousSnapshot.viewport.zoom.value !== appState.zoom.value;
    if (snapshotChanged) {
      snapshotSceneVersion.current = sceneVersion;
      latestSnapshot.current = {
        schemaVersion: 1,
        clips: clipsRef.current,
        interactiveHtmlStates: Object.keys(interactiveHtmlStatesRef.current).length > 0
          ? interactiveHtmlStatesRef.current
          : undefined,
        elements,
        viewport: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      };

      if (persistenceTimer.current !== null) window.clearTimeout(persistenceTimer.current);
      persistenceTimer.current = window.setTimeout(persistLatestSnapshot, persistenceDelay);
    }

    const selectedIds = Object.keys(appState.selectedElementIds).filter((id) => appState.selectedElementIds[id]);
    const selectedElements = selectedIds.flatMap((id) => {
      const element = elementsById.get(id);
      return element ? [element] : [];
    });
    setSimpleMarkerSelection(selectedElements.length === 1 && isMarkerRibbonElement(selectedElements[0]));
    const selectedLinearElementId = appState.selectedLinearElement?.elementId;
    const selectedLinearElement = selectedLinearElementId
      ? elementsById.get(selectedLinearElementId)
      : null;
    if (api && selectedLinearElementId && isMarkerRibbonElement(selectedLinearElement)
      && !markerSelectionCleanupScheduled.current) {
      markerSelectionCleanupScheduled.current = true;
      queueMicrotask(() => {
        markerSelectionCleanupScheduled.current = false;
        const currentState = api.getAppState();
        if (currentState.selectedLinearElement?.elementId !== selectedLinearElementId) return;
        const currentElement = api.getSceneElements().find((element) => element.id === selectedLinearElementId);
        if (!isMarkerRibbonElement(currentElement)) return;
        api.updateScene({
          appState: {
            selectedLinearElement: null,
            editingLinearElement: currentState.editingLinearElement?.elementId === selectedLinearElementId
              ? null
              : currentState.editingLinearElement,
          },
          captureUpdate: CaptureUpdateAction.NEVER,
        });
      });
    }
    const editingText = appState.editingTextElement?.type === "text"
      ? elementsById.get(appState.editingTextElement.id) ?? appState.editingTextElement
      : null;
    setEditingTextId(editingText?.id ?? null);
    const pendingTextColor = pendingBoundTextColor.current;
    if (
      api
      && editingText?.type === "text"
      && pendingTextColor
      && editingText.containerId === pendingTextColor.containerId
      && (!pendingTextColor.elementId || editingText.id === pendingTextColor.elementId)
    ) {
      pendingBoundTextColor.current = null;
      if (!richTextOf(editingText) && editingText.strokeColor.toLowerCase() !== pendingTextColor.strokeColor.toLowerCase()) {
        window.requestAnimationFrame(() => {
          const currentElements = api.getSceneElements();
          const currentText = currentElements.find((element) => element.id === editingText.id);
          if (currentText?.type !== "text") return;
          const nextText = newElementWith(currentText, { strokeColor: pendingTextColor.strokeColor });
          api.updateScene({
            elements: currentElements.map((element) => element.id === nextText.id ? nextText : element),
            appState: {
              currentItemStrokeColor: pendingTextColor.strokeColor,
              editingTextElement: nextText,
            },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        });
      }
    }
    setEditingRichText(editingText?.type === "text" && richTextOf(editingText) !== null);
    const handoffElement = richHandoff.current
      ? elementsById.get(richHandoff.current.id) : null;
    const nextRichEditorElement = editingText?.type === "text" && richTextOf(editingText) ? editingText
      : resizingRichText ?? (handoffElement?.type === "text" && richTextOf(handoffElement) ? handoffElement : null);
    setRichEditorFrame(previous => {
      if (!nextRichEditorElement) return null;
      if (previous?.element === nextRichEditorElement
        && previous.appState.zoom.value === appState.zoom.value
        && previous.appState.scrollX === appState.scrollX
        && previous.appState.scrollY === appState.scrollY
        && previous.appState.editingTextElement?.id === appState.editingTextElement?.id) return previous;
      return { element: nextRichEditorElement, appState };
    });
    const selectedText = selectedElements.length === 1 && selectedElements[0].type === "text"
      ? selectedElements[0] : null;
    const activeText = editingText?.type === "text" ? editingText : selectedText;
    const nextTextFormattingContext = activeText?.type === "text"
      ? getTextFormattingContext(
        activeText,
        appState,
        rootRef.current,
        activeText.containerId ? elementsById.get(activeText.containerId) ?? null : null,
      )
      : null;
    setTextFormattingContext((previous) => (
      sameTextFormattingContext(previous, nextTextFormattingContext) ? previous : nextTextFormattingContext
    ));
    const selectedShapeGroupId = Object.keys(appState.selectedGroupIds).find((groupId) => (
      isShapeAnnotationGroupId(groupId) && appState.selectedGroupIds[groupId]
    ));
    const groupedShape = selectedShapeGroupId
      ? elementsById.get(selectedShapeGroupId.slice(shapeAnnotationGroupPrefix.length)) ?? null : null;
    const selectedShape = selectedElements.length === 1 && isBasicShapeElement(selectedElements[0])
      ? selectedElements[0]
      : isBasicShapeElement(groupedShape) ? groupedShape : null;
    const creatingShape = isBasicShapeElement(appState.newElement) ? appState.newElement : null;
    const nextShapeFormattingContext = !nextTextFormattingContext && (selectedShape || creatingShape)
      ? getShapeFormattingContext(selectedShape ?? creatingShape!, elements, appState, rootRef.current)
      : null;
    setShapeFormattingContext((previous) => (
      sameShapeFormattingContext(previous, nextShapeFormattingContext) ? previous : nextShapeFormattingContext
    ));
    const plainCanvasCoverTarget = appState.activeTool.type === "selection"
      ? resolvePlainCanvasCoverTarget(
        elements,
        selectedIds,
        Object.keys(appState.selectedGroupIds).filter((groupId) => appState.selectedGroupIds[groupId]),
      )
      : null;
    const plainCanvasCover = plainCanvasCoverTarget
      ? getImageCover(elements, plainCanvasCoverTarget.id)
      : null;
    const nextCanvasCoverQuickAction = plainCanvasCoverTarget
      ? getCanvasCoverQuickAction(
        plainCanvasCoverTarget,
        Boolean(plainCanvasCover),
        appState,
        rootRef.current,
      )
      : null;
    setCanvasCoverQuickAction((previous) => (
      sameCanvasCoverQuickAction(previous, nextCanvasCoverQuickAction)
        ? previous
        : nextCanvasCoverQuickAction
    ));
    const selectedImageGroupId = Object.keys(appState.selectedGroupIds).find((groupId) => isImageAnnotationGroupId(groupId));
    const groupedSelectedImage = selectedImageGroupId
      ? images.find((element) => element.groupIds.includes(selectedImageGroupId))
      : null;
    let selectedImage: ExcalidrawImageElement | null = groupedSelectedImage?.type === "image" ? groupedSelectedImage : null;
    if (!selectedImage && selectedElements.length === 1 && selectedElements[0].type === "image" && !richTextImageSourceId(selectedElements[0])) {
      selectedImage = selectedElements[0];
    }
    selectedImageId.current = selectedImage?.id ?? null;
    const selectingCropImageId = imageCropSelectionRef.current?.imageId ?? null;
    const nextImageControls = appState.activeTool.type === "selection" && selectedImage
      && appState.croppingElementId !== selectedImage.id
      && selectingCropImageId !== selectedImage.id
      ? getImageControls(selectedImage, selectedElements, appState, rootRef.current)
      : null;
    setImageControls((previous) => sameImageControls(previous, nextImageControls) ? previous : nextImageControls);

    const selectedVideoGroupId = Object.keys(appState.selectedGroupIds).find((groupId) => (
      elements.some((element) => isVideoOrAppElement(element) && element.groupIds.includes(groupId))
    ));
    const groupedSelectedVideo = selectedVideoGroupId
      ? elements.find((element) => isVideoOrAppElement(element) && element.groupIds.includes(selectedVideoGroupId))
      : null;
    const selectedVideo = groupedSelectedVideo && isVideoOrAppElement(groupedSelectedVideo)
      ? groupedSelectedVideo
      : selectedElements.length === 1 && isVideoOrAppElement(selectedElements[0])
        ? selectedElements[0]
        : null;
    const selectedVideoCover = selectedVideo ? getImageCover(elements, selectedVideo.id) : null;
    const nextVideoQuickActions = appState.activeTool.type === "selection" && selectedVideo
      ? getVideoQuickActions(selectedVideo, Boolean(selectedVideoCover), elements, appState, rootRef.current)
      : null;
    setVideoQuickActions((previous) => (
      sameVideoQuickActions(previous, nextVideoQuickActions) ? previous : nextVideoQuickActions
    ));

    const nextInteractiveHtmlQuickActions = getSelectedInteractiveHtmlQuickActions(
      elements,
      appState,
      rootRef.current,
      Boolean(interactiveLiveControls),
    );
    setInteractiveHtmlQuickActions((previous) => (
      sameInteractiveHtmlQuickActions(previous, nextInteractiveHtmlQuickActions)
        ? previous
        : nextInteractiveHtmlQuickActions
    ));

    const selectedInteractive = nextInteractiveHtmlQuickActions
      ? elementsById.get(nextInteractiveHtmlQuickActions.elementId) ?? null
      : null;
    const selectedInteractiveCover = selectedInteractive ? getImageCover(elements, selectedInteractive.id) : null;

    const hoveredImage = hoveredImageId.current
      ? elementsById.get(hoveredImageId.current)
      : null;
    const quickActionImage = hoveredImage?.type === "image" && !richTextImageSourceId(hoveredImage) ? hoveredImage : selectedImage;
    const hoveredImageCover = quickActionImage
      ? getImageCover(elements, quickActionImage.id)
      : null;
    const nextImageQuickActions = quickActionImage
      ? getImageQuickActions(quickActionImage, Boolean(hoveredImageCover), elements, appState, rootRef.current)
      : null;
    setImageQuickActions((previous) => sameImageQuickActions(previous, nextImageQuickActions) ? previous : nextImageQuickActions);
    const nextImageCoverFrame = quickActionImage && hoveredImageCover
      && appState.croppingElementId !== quickActionImage.id
      && selectingCropImageId !== quickActionImage.id
      ? getImageCoverFrame(quickActionImage, hoveredImageCover, appState, rootRef.current)
      : null;
    const nextVideoCoverFrame = selectedVideo && selectedVideoCover
      ? getImageCoverFrame(selectedVideo, selectedVideoCover, appState, rootRef.current)
      : null;
    const nextInteractiveCoverFrame = selectedInteractive && selectedInteractiveCover
      ? getImageCoverFrame(selectedInteractive, selectedInteractiveCover, appState, rootRef.current)
      : null;
    const nextCanvasObjectCoverFrame = plainCanvasCoverTarget && plainCanvasCover
      ? getImageCoverFrame(plainCanvasCoverTarget, plainCanvasCover, appState, rootRef.current)
      : null;
    const nextCoverFrame = nextImageCoverFrame ?? nextVideoCoverFrame ?? nextInteractiveCoverFrame ?? nextCanvasObjectCoverFrame;
    setImageCoverFrame((previous) => sameImageCoverFrame(previous, nextCoverFrame) ? previous : nextCoverFrame);

    const cropSelection = imageCropSelectionRef.current;
    if (cropSelection) {
      const cropImage = elementsById.get(cropSelection.imageId);
      const nextCropSelection = cropImage?.type === "image" && !cropImage.isDeleted
        ? getImageCropSelectionFrame(
          cropImage,
          { height: cropSelection.naturalHeight, width: cropSelection.naturalWidth },
          cropSelection.mode,
          cropSelection.rect,
          appState,
          rootRef.current,
        )
        : null;
      if (!sameImageCropSelectionFrame(cropSelection, nextCropSelection)) {
        imageCropSelectionRef.current = nextCropSelection;
        setImageCropSelection(nextCropSelection);
      }
    }

    if (focusedElementIds.current.length > 0) {
      const focusedElements = focusedElementIds.current.flatMap((id) => {
        const element = elementsById.get(id);
        return element && !element.isDeleted ? [element] : [];
      });
      const validFocusedIds = focusedElements.map((element) => element.id);
      if (validFocusedIds.length !== focusedElementIds.current.length) focusedElementIds.current = validFocusedIds;
      const nextElementFocusFrames = focusedElements.flatMap((element) => {
        const frame = getElementFocusFrame(element, appState, rootRef.current);
        return frame ? [frame] : [];
      });
      setElementFocusFrames((previous) => (
        sameElementFocusFrames(previous, nextElementFocusFrames) ? previous : nextElementFocusFrames
      ));
    }

    const canUpdateImageGroups = appState.activeTool.type !== "eraser"
      && !textBoxTransformActive.current
      && !appState.newElement
      && !inkPreviewId.current
      && !appState.editingTextElement
      && !appState.selectedElementsAreBeingDragged
      && !appState.isResizing
      && !appState.isRotating
      && !appState.isCropping
      && !appState.croppingElementId
      && !selectingCropImageId;
    if (api && canUpdateImageGroups && !imageCoverDrag.current && !materialBundleMoveDrag.current && !imageCoverRepairScheduled.current) {
      const materialPreview = constrainImageCoversToImages(elements);
      const preview = reconcileCanvasCoverContours(materialPreview.elements);
      if (materialPreview.changed || preview.changed) {
        imageCoverRepairScheduled.current = true;
        queueMicrotask(() => {
          imageCoverRepairScheduled.current = false;
          const constrained = constrainImageCoversToImages(api.getSceneElements());
          const repaired = reconcileCanvasCoverContours(constrained.elements);
          if (!constrained.changed && !repaired.changed) return;
          api.updateScene({
            elements: repaired.elements,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        });
      }
    }
    if (
      api
      && canUpdateImageGroups
      && !imageGroupUpdateScheduled.current
      && (hasNewImage || pendingNewAnnotationIds.current.size > 0)
    ) {
      const annotationIds = new Set(pendingNewAnnotationIds.current);
      const scrollOffsets = new Map(interactiveHtmlScrollOffsets.current);
      const preview = attachNewAnnotationsToCanvasTargets(elements, annotationIds, scrollOffsets);
      if (preview.changed) {
        pendingNewAnnotationIds.current.clear();
        imageGroupUpdateScheduled.current = true;
        queueMicrotask(() => {
          imageGroupUpdateScheduled.current = false;
          const updated = attachNewAnnotationsToCanvasTargets(api.getSceneElements(), annotationIds, scrollOffsets);
          if (!updated.changed) return;
          api.updateScene({
            elements: updated.elements,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        });
      } else if (annotationIds.size > 0) {
        pendingNewAnnotationIds.current.clear();
      }
    }
    if (api && oneShotCreation.completed) {
      const completed = oneShotCreation.completed;
      queueMicrotask(() => {
        const currentElement = api.getSceneElements().find((element) => (
          element.id === completed.elementId && !element.isDeleted
        ));
        if (!currentElement) return;

        const editingGroupId = getCanvasAnnotationEditingGroupId(currentElement);
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          appState: {
            editingGroupId,
            editingTextElement: null,
            selectedElementIds: { [currentElement.id]: true },
            selectedGroupIds: {},
            selectedLinearElement: null,
          },
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        onToolChangeRef.current("selection");
      });
    }
  }, [activeTool, api, interactiveLiveControls, materialShadows, onMaterialUsageChange, onToolChange, onZoomChange, persistLatestSnapshot]);

  const updateMarkerEraserHit = useCallback((event: ReactPointerEvent<HTMLDivElement>, phase: "down" | "move" | "up") => {
    if (!api || api.getAppState().activeTool.type !== "eraser") {
      markerEraserPointer.current = null;
      return;
    }
    const state = api.getAppState();
    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, state);
    const previous = phase !== "down" && markerEraserPointer.current?.id === event.pointerId
      ? markerEraserPointer.current.point : point;
    const gated = gateMarkerEraserHits(api.getSceneElements(), point, 4 / state.zoom.value, previous);
    if (gated.changed) api.updateScene({ elements: gated.elements, captureUpdate: CaptureUpdateAction.NEVER });
    markerEraserPointer.current = phase === "up" || !event.buttons ? null : { id: event.pointerId, point };
  }, [api]);

  const handleCanvasPointerMoveCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!api) return;
    if (imageCoverDrag.current) return;
    if (event.target instanceof Element && event.target.closest(".image-quick-action, .image-crop-mode-menu, .image-crop-selection-frame")) return;
    const appState = api.getAppState();
    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, appState);

    const engineTool = appState.activeTool.type;
    if (engineTool !== "hand" && engineTool !== "selection") {
      hoveredImageId.current = null;
      setImageQuickActions(null);
      setImageCoverFrame(null);
      return;
    }

    const image = findTopmostImageAtPoint(sceneImages.current, point);
    hoveredImageId.current = image?.id ?? null;
    const elements = api.getSceneElements();
    const selectedImage = selectedImageId.current
      ? elements.find((element) => element.id === selectedImageId.current && element.type === "image")
      : null;
    const quickActionImage = image ?? (selectedImage?.type === "image" ? selectedImage : null);
    const cover = quickActionImage ? getImageCover(elements, quickActionImage.id) : null;
    const nextImageQuickActions = quickActionImage
      ? getImageQuickActions(quickActionImage, Boolean(cover), elements, appState, rootRef.current)
      : null;
    setImageQuickActions((previous) => sameImageQuickActions(previous, nextImageQuickActions) ? previous : nextImageQuickActions);
    const nextImageCoverFrame = quickActionImage && cover
      ? getImageCoverFrame(quickActionImage, cover, appState, rootRef.current)
      : null;
    setImageCoverFrame((previous) => sameImageCoverFrame(previous, nextImageCoverFrame) ? previous : nextImageCoverFrame);
  }, [api]);

  const setFocusedElements = useCallback((elementIds: readonly ExcalidrawElement["id"][]) => {
    if (!api) return;
    const uniqueIds = [...new Set(elementIds)];
    const elementsById = new Map(api.getSceneElements().map((element) => [element.id, element]));
    const validElements = uniqueIds.flatMap((id) => {
      const element = elementsById.get(id);
      return element && !element.isDeleted ? [element] : [];
    });
    focusedElementIds.current = validElements.map((element) => element.id);
    const appState = api.getAppState();
    const nextFrames = validElements.flatMap((element) => {
      const frame = getElementFocusFrame(element, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setElementFocusFrames((previous) => sameElementFocusFrames(previous, nextFrames) ? previous : nextFrames);
  }, [api]);

  const clearImageFocus = useCallback(() => {
    focusedElementIds.current = [];
    setElementFocusFrames([]);
  }, []);

  const focusViewportRef = useRef(getFocusViewport);
  focusViewportRef.current = getFocusViewport;
  const reportedMaterialFocus = useRef<CanvasMaterialUsage | null>(null);
  useEffect(() => {
    const ids = new Set(elementFocusFrames.map(frame => frame.elementId));
    const usage = canvasMaterialUsageFromElements(api?.getSceneElements().filter(element => ids.has(element.id)) ?? []);
    if (!reportedMaterialFocus.current || !sameCanvasMaterialUsage(reportedMaterialFocus.current, usage)) {
      reportedMaterialFocus.current = usage;
      onMaterialFocusChange?.(usage);
    }
  }, [api, elementFocusFrames, onMaterialFocusChange]);

  const focusMaterial = useCallback((elementId: ExcalidrawElement["id"]) => {
    if (!api) return;
    // Keyboard/browser focus may have scrolled the shell without resizing it.
    // Re-measure before sharing one geometry between the camera and spotlight.
    flushSync(() => api.refresh());
    const target = api.getSceneElements().find(element => element.id === elementId && !element.isDeleted);
    if (!target) return;
    api.setActiveTool({ type: "selection" });
    api.updateScene({ appState: { selectedElementIds: { [target.id]: true }, croppingElementId: null }, captureUpdate: CaptureUpdateAction.NEVER });
    onToolChangeRef.current("selection");
    setFocusedElements([target.id]);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = api.getAppState();
    const viewport = focusViewportRef.current?.();
    api.scrollToContent(target, {
      fitToViewport: true,
      viewportZoomFactor: 0.68,
      maxZoom: 1.6,
      canvasOffsets: viewport ? materialFocusCanvasOffsets(viewport, state) : undefined,
      animate: !reduceMotion,
      duration: reduceMotion ? 0 : imageFocusDuration,
    });
  }, [api, setFocusedElements]);

  const toggleMaterialFocus = useCallback((elementId: string) => {
    if (focusedElementIds.current.length === 1 && focusedElementIds.current[0] === elementId) clearImageFocus();
    else focusMaterial(elementId);
  }, [clearImageFocus, focusMaterial]);

  const clearImageCropSelection = useCallback(() => {
    imageCropSelectionDrag.current = null;
    imageCropSelectionRef.current = null;
    setImageCropSelection(null);
  }, []);

  useEffect(() => {
    const visibleQuickActionImageId = imageQuickActions?.imageId ?? null;
    const cropSelectionImageId = imageCropSelectionRef.current?.imageId ?? null;
    if (shouldExitImageCropUi(cropSelectionImageId, visibleQuickActionImageId)) {
      clearImageCropSelection();
    }
    if (shouldExitImageCropUi(imageCropMenuImageId, visibleQuickActionImageId)) {
      setImageCropMenuImageId(null);
    }
  }, [clearImageCropSelection, imageCropMenuImageId, imageQuickActions]);

  const toggleImageCropMenu = useCallback((imageId: ExcalidrawImageElement["id"]) => {
    if (!api) return;
    const appState = api.getAppState();
    if (appState.croppingElementId === imageId) {
      api.updateScene({ appState: { croppingElementId: null }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
      return;
    }
    if (imageCropSelectionRef.current?.imageId === imageId) {
      clearImageCropSelection();
      return;
    }
    setImageCropMenuImageId((current) => current === imageId ? null : imageId);
  }, [api, clearImageCropSelection]);

  const startImageCropEditor = useCallback(async (
    imageId: ExcalidrawImageElement["id"],
    mode: ImageCropSelectionFrame["mode"],
  ) => {
    if (!api) return;
    const image = api.getSceneElements().find((element) => element.id === imageId && element.type === "image");
    if (!image || image.type !== "image" || image.isDeleted || !image.fileId) return;
    const file = api.getFiles()[image.fileId];
    if (!file) {
      setCanvasActionError("Bild konnte nicht zum Zuschneiden vorbereitet werden.");
      return;
    }
    try {
      const natural = image.crop
        ? { height: image.crop.naturalHeight, width: image.crop.naturalWidth }
        : await loadImageDimensions(file.dataURL);
      const frame = getImageCropSelectionFrame(
        image,
        natural,
        mode,
        mode === "trim" ? fullImageCropRect : null,
        api.getAppState(),
        rootRef.current,
      );
      if (!frame) return;
      if (api.getAppState().croppingElementId) {
        api.updateScene({ appState: { croppingElementId: null }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
      }
      setImageCropMenuImageId(null);
      imageCropSelectionRef.current = frame;
      setImageCropSelection(frame);
    } catch (error: unknown) {
      console.error(t("Bild konnte nicht zum Zuschneiden vorbereitet werden."), error);
      setCanvasActionError("Bild konnte nicht zum Zuschneiden vorbereitet werden.");
    }
  }, [api]);

  const startImageTrim = useCallback((imageId: ExcalidrawImageElement["id"]) => (
    startImageCropEditor(imageId, "trim")
  ), [startImageCropEditor]);

  const startImageCropSelection = useCallback((imageId: ExcalidrawImageElement["id"]) => (
    startImageCropEditor(imageId, "select")
  ), [startImageCropEditor]);

  const closeDocumentImageEditor = useCallback(() => {
    documentImageJob.current?.controller.abort();
    documentImageJob.current = null;
    scanEnhancementPending.current = false;
    setDocumentImageEditor(null); setEnhancingImageId(null);
  }, []);

  useEffect(() => {
    if (!api) return;
    return api.onChange(() => {
      const job = documentImageJob.current;
      if (job && !documentImageTargetUnchanged(job.image, api.getSceneElements().find(element => element.id === job.image.id))) {
        closeDocumentImageEditor();
        setCanvasActionError("Das Bild wurde während der Verarbeitung verändert. Bitte erneut öffnen.");
      }
    });
  }, [api, closeDocumentImageEditor]);

  const applyDocumentImage = useCallback(async (selection: DocumentImageSelection) => {
    const job = documentImageJob.current;
    const result = selection.image;
    if (!api || !job || !documentImageEditor || documentImageEditor.saving) return;
    setDocumentImageEditor(previous => previous ? { ...previous, saving: true, error: null } : previous);
    try {
      const validTarget = () => !job.controller.signal.aborted && documentImageJob.current === job
        && documentImageTargetUnchanged(job.image, api.getSceneElements().find(element => element.id === job.image.id))
        && (!job.cropAllowed || documentImageCropAllowed(job.image, api.getSceneElements()));
      if (!validTarget()) throw new Error(t("Das Bild oder seine Annotationen wurden verändert. Bitte erneut öffnen."));
      if (selection.originalDataURL && !job.cropAllowed) throw new Error(t("Dieses Bild besitzt gebundene Annotationen oder einen vorhandenen Zuschnitt."));
      const id = `tafelraum-scan-${crypto.randomUUID()}` as FileId;
      const file: BinaryFileData = { id, dataURL: result.dataURL, mimeType: 'image/png', created: Date.now() };
      const originalFile: BinaryFileData | null = selection.originalDataURL ? {id:`tafelraum-scan-${crypto.randomUUID()}` as FileId,
        dataURL:selection.originalDataURL,mimeType:'image/png',created:Date.now()} : null;
      const files = originalFile ? [file,originalFile] : [file];
      await saveCanvasFiles(lessonId, files);
      if (!validTarget()) throw new Error(t("Das Bild wurde verändert. Die Verbesserung wurde nicht angewandt."));
      api.addFiles(files);
      const image = job.image;
      const geometry = originalFile ? centeredDocumentPerspective(image,result) : {};
      documentImageJob.current = null; // This commit must not invalidate itself.
      api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map(element => element.id === image.id
        ? newElementWith(image, { ...geometry, fileId: id, customData: { ...image.customData, assetId: id,
          scanEnhancement: originalFile ? {kind:docResPerspectiveKind,originalAssetId:originalFile.id,originalFileId:originalFile.id,
            enhancedFileId:id,sourceOriginalFileId:image.fileId}
            : { kind: docResEnhancementKind, originalAssetId: typeof image.customData?.assetId === 'string' ? image.customData.assetId : image.fileId,
            originalFileId: image.fileId } } }) : element), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
      closeDocumentImageEditor();
    } catch (error) {
      if (documentImageJob.current === job) setDocumentImageEditor(previous => previous ? { ...previous, saving: false,
        error: error instanceof Error ? error.message : t("Das Bild konnte nicht gespeichert werden.") } : previous);
    }
  }, [api, documentImageEditor, lessonId, closeDocumentImageEditor]);

  const toggleScanEnhancement = useCallback(async (imageId: ExcalidrawImageElement["id"]) => {
    if (!api || scanEnhancementPending.current) return;
    const image = api.getSceneElements().find((element) => element.id === imageId && element.type === "image");
    if (!image || image.type !== "image" || image.isDeleted || !image.fileId) return;

    scanEnhancementPending.current = true;
    setEnhancingImageId(image.id);
    setCanvasActionError(null);
    const job = { controller: new AbortController(), image, cropAllowed: documentImageCropAllowed(image, api.getSceneElements()) };
    documentImageJob.current = job;
    let editorOpened = false;
    try {
      const currentEnhancement = readScanEnhancement(image);
      if (currentEnhancement) {
        const targetFileId = currentEnhancement.kind === docResPerspectiveKind && image.fileId === currentEnhancement.originalFileId
          ? currentEnhancement.enhancedFileId : currentEnhancement.originalFileId;
        if (!api.getFiles()[targetFileId]) {
          throw new Error(t("Die Originaldarstellung ist nicht mehr verfügbar."));
        }
        const { scanEnhancement: _scanEnhancement, ...customData } = image.customData ?? {};
        documentImageJob.current = null;
        api.updateScene({
          elements: api.getSceneElements().map((element) => element.id === image.id
            ? newElementWith(image, {
                customData: {
                  ...customData,
                  assetId: currentEnhancement.kind === docResPerspectiveKind ? targetFileId : currentEnhancement.originalAssetId,
                  ...(currentEnhancement.kind === docResPerspectiveKind ? {scanEnhancement:currentEnhancement} : {}),
                },
                fileId: targetFileId,
              })
            : element),
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        return;
      }

      const file = api.getFiles()[image.fileId];
      if (!file) throw new Error(t("Die Bilddaten sind nicht verfügbar."));
      const statusResponse = await fetch('/api/document-image/status', { signal: job.controller.signal });
      if (!statusResponse.ok) throw new Error(t("Die lokale Bildverbesserung ist nicht erreichbar."));
      const status = await statusResponse.json();
      if (job.controller.signal.aborted) return;
      if (status.configured) {
        const crop = image.crop;
        const fixedRect = job.cropAllowed ? null : crop ? { x: image.scale[0] === -1 ? 1-(crop.x+crop.width)/crop.naturalWidth : crop.x/crop.naturalWidth,
          y: image.scale[1] === -1 ? 1-(crop.y+crop.height)/crop.naturalHeight : crop.y/crop.naturalHeight,
          width: crop.width/crop.naturalWidth, height: crop.height/crop.naturalHeight } : wholeDocumentPhoto;
        setDocumentImageEditor({ source: file.dataURL, fixedRect, angle: image.angle, mirrorX: image.scale[0] === -1, mirrorY: image.scale[1] === -1, result: null, saving: false, error: null });
        editorOpened = true;
        const result = await requestDocumentImage(file.dataURL, job.controller.signal);
        if (documentImageJob.current === job && !job.controller.signal.aborted) {
          setDocumentImageEditor(previous => previous ? { ...previous, result } : previous);
        }
        return;
      }
      const enhanced = await createScanEnhancedImage(file.dataURL);
      if (job.controller.signal.aborted || !documentImageTargetUnchanged(image, api.getSceneElements().find(element => element.id === image.id))) return;
      const enhancedFileId = `tafelraum-scan-${crypto.randomUUID()}` as FileId;
      const enhancedFile: BinaryFileData = {
        created: Date.now(),
        dataURL: enhanced.dataURL,
        id: enhancedFileId,
        mimeType: "image/png",
      };
      await saveCanvasFiles(lessonId, [enhancedFile]);
      if (job.controller.signal.aborted || !documentImageTargetUnchanged(image, api.getSceneElements().find(element => element.id === image.id))) return;
      api.addFiles([enhancedFile]);
      documentImageJob.current = null;
      api.updateScene({
        elements: api.getSceneElements().map((element) => element.id === image.id
          ? newElementWith(image, {
              customData: {
                ...image.customData,
                assetId: enhancedFileId,
                scanEnhancement: {
                  kind: scanEnhancementKind,
                  originalAssetId: typeof image.customData?.assetId === "string" ? image.customData.assetId : image.fileId,
                  originalFileId: image.fileId,
                },
              },
              fileId: enhancedFileId,
            })
          : element),
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    } catch (error: unknown) {
      if (job.controller.signal.aborted) return;
      if (editorOpened) {
        setDocumentImageEditor(previous => previous ? { ...previous, error: error instanceof Error ? error.message : t("Bild konnte nicht verbessert werden.") } : previous);
        return;
      }
      console.error(t("Scan konnte nicht optimiert werden."), error);
      setCanvasActionError(error instanceof Error ? error.message : "Scan konnte nicht optimiert werden.");
    } finally {
      if (!editorOpened && (documentImageJob.current === job || !documentImageJob.current)) {
        documentImageJob.current = null;
        scanEnhancementPending.current = false;
        setEnhancingImageId(null);
      }
    }
  }, [api, lessonId]);

  const startImageCropSelectionDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!api || !imageCropSelection) return;
    const image = api.getSceneElements().find((element) => (
      element.id === imageCropSelection.imageId && element.type === "image" && !element.isDeleted
    ));
    if (!image || image.type !== "image") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState());
    imageCropSelectionDrag.current = {
      image,
      mode: "select",
      naturalHeight: imageCropSelection.naturalHeight,
      naturalWidth: imageCropSelection.naturalWidth,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPoint: imagePointToNormalized(image, point),
    };
  }, [api, imageCropSelection]);

  const startImageTrimDrag = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    handle: ImageCropTrimHandle,
  ) => {
    if (!api || imageCropSelection?.mode !== "trim" || !imageCropSelection.rect) return;
    const image = api.getSceneElements().find((element) => (
      element.id === imageCropSelection.imageId && element.type === "image" && !element.isDeleted
    ));
    if (!image || image.type !== "image") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    imageCropSelectionDrag.current = {
      handle,
      image,
      mode: "trim",
      naturalHeight: imageCropSelection.naturalHeight,
      naturalWidth: imageCropSelection.naturalWidth,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: imageCropSelection.rect,
    };
  }, [api, imageCropSelection]);

  useEffect(() => {
    const updateSelection = (drag: ImageCropSelectionDrag, clientX: number, clientY: number) => {
      if (!api) return null;
      const point = viewportCoordsToSceneCoords({ clientX, clientY }, api.getAppState());
      const normalizedPoint = imagePointToNormalized(drag.image, point);
      const rect = drag.mode === "select"
        ? imageCropRectFromPoints(drag.startPoint, normalizedPoint)
        : imageCropRectFromTrimHandle(drag.startRect, drag.handle, normalizedPoint);
      const current = imageCropSelectionRef.current;
      if (!current || current.imageId !== drag.image.id) return rect;
      const next = { ...current, rect };
      imageCropSelectionRef.current = next;
      setImageCropSelection(next);
      return rect;
    };

    const continueSelection = (event: PointerEvent) => {
      const drag = imageCropSelectionDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      updateSelection(drag, event.clientX, event.clientY);
    };

    const finishSelection = (event: PointerEvent) => {
      const drag = imageCropSelectionDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      const rect = updateSelection(drag, event.clientX, event.clientY);
      imageCropSelectionDrag.current = null;
      const moved = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (!rect || moved < transformDragThreshold || rect.width < 0.02 || rect.height < 0.02) return;
      const crop = applyImageCropRect(
        drag.image,
        rect,
        { height: drag.naturalHeight, width: drag.naturalWidth },
      );
      api.updateScene({
        elements: api.getSceneElements().map((element) => element.id === drag.image.id
          ? newElementWith(element, crop)
          : element),
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      if (drag.mode === "select") {
        clearImageCropSelection();
      } else {
        const current = imageCropSelectionRef.current;
        if (!current) return;
        const next = { ...current, rect: fullImageCropRect };
        imageCropSelectionRef.current = next;
        setImageCropSelection(next);
      }
    };

    const cancelSelection = (event: PointerEvent) => {
      const drag = imageCropSelectionDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      imageCropSelectionDrag.current = null;
      const current = imageCropSelectionRef.current;
      if (!current) return;
      const next = { ...current, rect: drag.mode === "trim" ? fullImageCropRect : null };
      imageCropSelectionRef.current = next;
      setImageCropSelection(next);
    };

    window.addEventListener("pointermove", continueSelection, true);
    window.addEventListener("pointerup", finishSelection, true);
    window.addEventListener("pointercancel", cancelSelection, true);
    return () => {
      window.removeEventListener("pointermove", continueSelection, true);
      window.removeEventListener("pointerup", finishSelection, true);
      window.removeEventListener("pointercancel", cancelSelection, true);
    };
  }, [api, clearImageCropSelection]);

  useEffect(() => {
    const closeCropUi = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setImageCropMenuImageId(null);
      if (imageCropSelectionRef.current) clearImageCropSelection();
    };
    window.addEventListener("keydown", closeCropUi, true);
    return () => window.removeEventListener("keydown", closeCropUi, true);
  }, [clearImageCropSelection]);

  const toggleImageCover = useCallback((imageId: ExcalidrawElement["id"]) => {
    if (!api) return;
    if (pendingImageCoverAdd.current?.imageId === imageId) return;
    const elements = api.getSceneElements();
    const image = elements.find((element) => element.id === imageId);
    if (!image || !isCoverTarget(image)) return;
    const groupId = coverBundleGroupId(image);
    const plainTargetMemberIds = isPlainCanvasCoverTarget(image)
      ? new Set(canvasCoverTargetMembers(elements, image.id).map((element) => element.id))
      : null;
    if (isYouTubeMaterialElement(image)) setActiveYouTubePlayerId(null);
    const existingCover = getImageCover(elements, image.id);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (existingCover) {
      const coverFrame = getImageCoverFrame(image, existingCover, api.getAppState(), rootRef.current, true);
      const coverRect = coverRectForTarget(image, existingCover);
      const coverEdge = getImageCoverEdge(existingCover, coverRect);
      if (coverFrame && !reduceMotion) {
        setImageCoverFeedback({
          cover: coverFrame,
          direction: coverEdge,
          key: ++imageCoverFeedbackKey.current,
          mode: "revealed",
        });
      }
      api.updateScene({
        elements: prepareCanvasAnnotationGroups(elements.map((element) => {
          if (element.id === existingCover.id) return newElementWith(element, { isDeleted: true });
          if (plainTargetMemberIds?.has(element.id)) {
            return newElementWith(element, {
              groupIds: element.groupIds.filter((candidate) => candidate !== groupId),
            });
          }
          if (element.id === image.id) {
            return newElementWith(element, {
              customData: rememberImageCover(element.customData, coverRect, coverEdge),
              groupIds: isYouTubeMaterialElement(element) || isInteractiveHtmlMaterialElement(element)
                ? element.groupIds.filter((groupId) => groupId !== imageAnnotationGroupId(element.id))
                : element.groupIds,
            });
          }
          return element;
        })).elements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      return;
    }

    const rememberedCover = isPlainCanvasCoverTarget(image) ? null : recallImageCover(image);
    const coverRect = rememberedCover?.rect ?? initialImageCoverRect;
    const coverEdge = rememberedCover?.edge ?? initialImageCoverEdge;
    const sceneCover = imageCoverRectToScene(image, coverRect);
    const coverShape = isPlainCanvasCoverTarget(image)
      ? canvasCoverShapeForTarget(image)
      : { roundness: null, type: "rectangle" as const };
    const [convertedCover] = convertToExcalidrawElements([{
      type: coverShape.type,
      ...sceneCover,
      backgroundColor: "#3e4854",
      fillStyle: "solid",
      opacity: 100,
      roughness: 0,
      strokeColor: "#3e4854",
      strokeWidth: canvasCoverStrokeWidth(image, coverRect),
      customData: {
        coverEdge,
        imageId: image.id,
        role: imageCoverRole,
      },
    }]);
    const cover = isShapedCoverTarget(image)
      ? shapedCoverElement(image, coverRect)
      : newElementWith(convertedCover, { roundness: coverShape.roundness ?? null });
    const groupedCover = newElementWith(cover, { groupIds: [groupId], customData: {
      ...cover.customData, coverEdge, coverRect,
    } });
    const coverFrame = getImageCoverFrame(image, groupedCover, api.getAppState(), rootRef.current, true);
    if (coverFrame && !reduceMotion) {
      pendingImageCoverAdd.current = {
        cover: groupedCover,
        forgetMemory: Boolean(rememberedCover),
        imageId: image.id,
        rect: coverRect,
      };
      setImageCoverFeedback({
        cover: coverFrame,
        direction: coverEdge,
        key: ++imageCoverFeedbackKey.current,
        mode: "added",
      });
      return;
    }
    const preparedElements = elements.map((element) => {
      const joinsCoverGroup = plainTargetMemberIds?.has(element.id) ?? element.id === image.id;
      if (!joinsCoverGroup) return element;
      return newElementWith(element, {
        customData: element.id === image.id && rememberedCover
          ? forgetImageCover(element.customData)
          : element.customData,
        groupIds: [...new Set([...element.groupIds, groupId])],
      });
    });
    api.updateScene({
      elements: prepareCanvasAnnotationGroups([...preparedElements, groupedCover]).elements,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  }, [api]);

  useEffect(() => {
    if (!imageCoverFeedback) return;
    const duration = imageCoverFeedback.mode === "revealed"
      ? imageCoverRevealFeedbackDuration
      : imageCoverAddedFeedbackDuration;
    const timeout = window.setTimeout(() => {
      const pending = pendingImageCoverAdd.current;
      if (imageCoverFeedback.mode === "added" && pending && api) {
        const elements = api.getSceneElements();
        const image = elements.find((element) => element.id === pending.imageId);
        const alreadyCovered = getImageCover(elements, pending.imageId);
        if (image && isCoverTarget(image) && !alreadyCovered) {
          const groupId = coverBundleGroupId(image);
          const plainTargetMemberIds = isPlainCanvasCoverTarget(image)
            ? new Set(canvasCoverTargetMembers(elements, image.id).map((element) => element.id))
            : null;
          const restoredCover = isShapedCoverTarget(image)
            ? shapedCoverElement(image, pending.rect, pending.cover)
            : newElementWith(pending.cover, {
                ...imageCoverRectToScene(image, pending.rect),
                strokeWidth: canvasCoverStrokeWidth(image, pending.rect),
                groupIds: [groupId],
              });
          const preparedElements = elements.map((element) => {
            const joinsCoverGroup = plainTargetMemberIds?.has(element.id) ?? element.id === image.id;
            if (!joinsCoverGroup) return element;
            return newElementWith(element, {
              customData: element.id === image.id && pending.forgetMemory
                ? forgetImageCover(element.customData)
                : element.customData,
              groupIds: [...new Set([...element.groupIds, groupId])],
            });
          });
          api.updateScene({
            elements: prepareCanvasAnnotationGroups([...preparedElements, restoredCover]).elements,
            captureUpdate: CaptureUpdateAction.IMMEDIATELY,
          });
        }
        pendingImageCoverAdd.current = null;
      }
      setImageCoverFeedback((current) => current?.key === imageCoverFeedback.key ? null : current);
    }, duration);
    return () => {
      window.clearTimeout(timeout);
      if (imageCoverFeedback.mode === "added" && pendingImageCoverAdd.current?.cover.id === imageCoverFeedback.cover.coverId) {
        pendingImageCoverAdd.current = null;
      }
    };
  }, [api, imageCoverFeedback]);

  const updateImageCoverDrag = useCallback((
    drag: ImageCoverDrag,
    clientX: number,
    clientY: number,
    captureUpdate: (typeof CaptureUpdateAction)[keyof typeof CaptureUpdateAction],
  ) => {
    if (!api) return;
    const appState = api.getAppState();
    const point = viewportCoordsToSceneCoords({ clientX, clientY }, appState);
    const normalizedPoint = imagePointToNormalized(drag.image, point);
    const minimumWidth = Math.min(1, imageCoverMinimumCssSize / (Math.abs(drag.image.width) * appState.zoom.value));
    const minimumHeight = Math.min(1, imageCoverMinimumCssSize / (Math.abs(drag.image.height) * appState.zoom.value));
    const rect = transformImageCoverRect(
      drag.startRect,
      drag.handle,
      normalizedPoint.x - drag.startPointer.x,
      normalizedPoint.y - drag.startPointer.y,
      minimumWidth,
      minimumHeight,
    );
    const nextCover = isShapedCoverTarget(drag.image)
      ? shapedCoverElement(drag.image, rect, drag.startCover)
      : newElementWith(drag.startCover, {
          ...imageCoverRectToScene(drag.image, rect),
          strokeWidth: canvasCoverStrokeWidth(drag.image, rect),
          customData: { ...drag.startCover.customData, coverRect: rect },
        });
    const coverWithEdge = newElementWith(nextCover, { customData: {
      ...nextCover.customData, coverEdge: getImageCoverEdge(drag.startCover, rect),
    } });
    api.updateScene({
      elements: api.getSceneElements().map((element) => element.id === drag.coverId ? coverWithEdge : element),
      captureUpdate,
    });
  }, [api]);

  const startImageCoverDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>, handle: ImageCoverHandle) => {
    if (!api || !imageCoverFrame || (event.pointerType === "mouse" && event.button !== 0)) return;
    const elements = api.getSceneElements();
    const image = elements.find((element) => element.id === imageCoverFrame.imageId);
    const cover = elements.find((element) => element.id === imageCoverFrame.coverId && !element.isDeleted);
    if (!image || !isCoverTarget(image) || !cover) return;

    event.preventDefault();
    event.stopPropagation();
    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState());
    imageCoverDrag.current = {
      coverId: cover.id,
      handle,
      image,
      moved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCover: cover,
      startPointer: imagePointToNormalized(image, point),
      startRect: coverRectForTarget(image, cover),
    };
  }, [api, imageCoverFrame]);

  useEffect(() => {
    const continueImageCoverDrag = (event: PointerEvent) => {
      const drag = imageCoverDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      drag.moved ||= Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) >= transformDragThreshold;
      if (!drag.moved) return;
      updateImageCoverDrag(drag, event.clientX, event.clientY, CaptureUpdateAction.EVENTUALLY);
    };

    const finishImageCoverDrag = (event: PointerEvent) => {
      const drag = imageCoverDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      if (drag.moved) updateImageCoverDrag(drag, event.clientX, event.clientY, CaptureUpdateAction.IMMEDIATELY);
      imageCoverDrag.current = null;
    };

    const cancelImageCoverDrag = (event: PointerEvent) => {
      const drag = imageCoverDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      if (drag.moved) {
        api.updateScene({
          elements: api.getSceneElements().map((element) => element.id === drag.coverId ? drag.startCover : element),
          captureUpdate: CaptureUpdateAction.NEVER,
        });
      }
      imageCoverDrag.current = null;
    };

    window.addEventListener("pointermove", continueImageCoverDrag, true);
    window.addEventListener("pointerup", finishImageCoverDrag, true);
    window.addEventListener("pointercancel", cancelImageCoverDrag, true);
    return () => {
      window.removeEventListener("pointermove", continueImageCoverDrag, true);
      window.removeEventListener("pointerup", finishImageCoverDrag, true);
      window.removeEventListener("pointercancel", cancelImageCoverDrag, true);
    };
  }, [api, updateImageCoverDrag]);

  const startCoveredMaterialDrag = useCallback((
    event: {
      clientX: number;
      clientY: number;
      pointerId: number;
      preventDefault(): void;
      stopPropagation(): void;
    },
    image: CoverTarget,
    cover: ExcalidrawElement,
    elements: readonly ExcalidrawElement[],
  ) => {
    if (!api) return;
    const groupId = coverBundleGroupId(image);
    const startElements = elements.filter((element) => (
      !element.isDeleted
      && (element.id === image.id || element.id === cover.id || element.groupIds.includes(groupId))
    ));
    if (startElements.length < 2) return;

    event.preventDefault();
    event.stopPropagation();
    materialBundleMoveDrag.current = {
      moved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElements,
      startPointer: viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState()),
    };
    api.updateScene({
      appState: {
        editingGroupId: null,
        selectedElementIds: Object.fromEntries(startElements.map((element) => [element.id, true])),
        selectedGroupIds: { [groupId]: true },
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, [api]);

  const startCoveredMaterialDragFromFrame = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!api || !imageCoverFrame || !imageCoverFrame.isFull || (event.pointerType === "mouse" && event.button !== 0)) return;
    const elements = api.getSceneElements();
    const image = elements.find((element) => element.id === imageCoverFrame.imageId);
    const cover = elements.find((element) => element.id === imageCoverFrame.coverId && !element.isDeleted);
    if (!image || !isCoverTarget(image) || !cover) return;
    startCoveredMaterialDrag(event, image, cover, elements);
  }, [api, imageCoverFrame, startCoveredMaterialDrag]);

  useEffect(() => {
    const translatedElements = (drag: MaterialBundleMoveDrag, event: PointerEvent) => {
      if (!api) return null;
      const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState());
      return translateMaterialBundleElements(
        api.getSceneElements(),
        drag.startElements,
        point.x - drag.startPointer.x,
        point.y - drag.startPointer.y,
        (element, x, y) => newElementWith<ExcalidrawElement>(element, { x, y }),
      );
    };

    const continueMaterialBundleMove = (event: PointerEvent) => {
      const drag = materialBundleMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      drag.moved ||= Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) >= transformDragThreshold;
      event.preventDefault();
      event.stopPropagation();
      if (!drag.moved) return;
      const elements = translatedElements(drag, event);
      if (!elements) return;
      api.updateScene({ elements, captureUpdate: CaptureUpdateAction.EVENTUALLY });
    };

    const finishMaterialBundleMove = (event: PointerEvent) => {
      const drag = materialBundleMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      if (drag.moved) {
        const elements = translatedElements(drag, event);
        if (elements) api.updateScene({ elements, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
      }
      materialBundleMoveDrag.current = null;
    };

    const cancelMaterialBundleMove = (event: PointerEvent) => {
      const drag = materialBundleMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      if (drag.moved) {
        api.updateScene({
          elements: translateMaterialBundleElements(
            api.getSceneElements(),
            drag.startElements,
            0,
            0,
            (element, x, y) => newElementWith<ExcalidrawElement>(element, { x, y }),
          ),
          captureUpdate: CaptureUpdateAction.NEVER,
        });
      }
      materialBundleMoveDrag.current = null;
    };

    window.addEventListener("pointermove", continueMaterialBundleMove, true);
    window.addEventListener("pointerup", finishMaterialBundleMove, true);
    window.addEventListener("pointercancel", cancelMaterialBundleMove, true);
    return () => {
      window.removeEventListener("pointermove", continueMaterialBundleMove, true);
      window.removeEventListener("pointerup", finishMaterialBundleMove, true);
      window.removeEventListener("pointercancel", cancelMaterialBundleMove, true);
    };
  }, [api]);

  const printImage = useCallback(async (imageId: ExcalidrawImageElement["id"]) => {
    if (!api || materialPrintPending.current) return;
    const image = api.getSceneElements().find((element) => element.id === imageId && element.type === "image");
    if (!image || image.type !== "image" || image.isDeleted || !image.fileId) return;
    const file = api.getFiles()[image.fileId];
    if (!file) {
      setImagePrintError("Material konnte nicht zum Drucken vorbereitet werden.");
      return;
    }

    materialPrintPending.current = true;
    setPrintingImageId(image.id);
    setImagePrintError(null);
    try {
      if (!("__TAURI_INTERNALS__" in window)) {
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
      if (canPrintImageSourceDirectly({
        angle: image.angle,
        cropped: image.crop !== null,
        scaleX: image.scale[0],
        scaleY: image.scale[1],
      })) {
        await openImagePrintDialog(file.dataURL, getImagePrintTitle(image));
        return;
      }

      const scale = await getImagePrintScale(image, file.dataURL);
      const blob = await exportToBlob({
        appState: {
          exportBackground: false,
          exportEmbedScene: false,
          exportScale: scale,
          exportWithDarkMode: false,
          viewBackgroundColor: "#ffffff",
        },
        elements: [image as NonDeleted<ExcalidrawImageElement>],
        exportPadding: 0,
        files: { [file.id]: file },
        getDimensions: (width: number, height: number) => ({ height: height * scale, scale, width: width * scale }),
        mimeType: "image/png",
      });
      await openImagePrintDialog(blob, getImagePrintTitle(image));
    } catch (error: unknown) {
      console.error(t("Material konnte nicht gedruckt werden."), error);
      setImagePrintError("Druckdialog konnte nicht geöffnet werden.");
    } finally {
      materialPrintPending.current = false;
      setPrintingImageId(null);
    }
  }, [api]);

  const printInteractiveHtml = useCallback(async (elementId: ExcalidrawElement["id"]) => {
    if (!api || materialPrintPending.current) return;
    const element = api.getSceneElements().find((candidate) => candidate.id === elementId);
    const print = getInteractiveHtmlPrintCapability(elementId);
    const materialId = element?.customData?.interactiveHtmlId;
    const sourceLessonId = element?.customData?.sourceLessonId;
    const title = element?.customData?.sourceTitle;
    if (
      !element
      || !isInteractiveHtmlMaterialElement(element)
      || !print
      || typeof materialId !== "string"
      || typeof sourceLessonId !== "string"
      || typeof title !== "string"
    ) return;

    materialPrintPending.current = true;
    setPrintingInteractiveHtmlId(elementId);
    setImagePrintError(null);
    try {
      await openInteractiveHtmlPrintDialog(
        lessonInteractiveMaterialUrl(sourceLessonId, materialId, print.entry),
        title,
        print.orientation,
      );
    } catch (error: unknown) {
      console.error(t("HTML-Material konnte nicht gedruckt werden."), error);
      setImagePrintError("Druckdialog konnte nicht geöffnet werden.");
    } finally {
      materialPrintPending.current = false;
      setPrintingInteractiveHtmlId(null);
    }
  }, [api]);

  useEffect(() => {
    if (!imagePrintError) return;
    const timer = window.setTimeout(() => setImagePrintError(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [imagePrintError]);

  useEffect(() => {
    if (!canvasActionError) return;
    const timer = window.setTimeout(() => setCanvasActionError(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [canvasActionError]);

  useEffect(() => {
    const targetsInteractiveControl = (target: EventTarget | null) => (
      target instanceof Element
      && Boolean(target.closest([
        "a[href]",
        "button",
        "iframe",
        "input",
        "select",
        "textarea",
        "[contenteditable='true']",
        "[role='button']",
        "[role='combobox']",
        "[role='slider']",
      ].join(", ")))
    );
    const setSpaceReady = (ready: boolean) => {
      spacePanReadyRef.current = ready;
      setSpacePanReady(ready);
      onTemporaryPanChange(ready);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const embedOwnsFocus = Boolean(
        activeYouTubePlayerId
        || rootRef.current?.querySelector(".youtube-canvas-player:hover"),
      );
      const interactiveControlOwnsFocus = targetsInteractiveControl(event.target)
        || targetsInteractiveControl(document.activeElement);
      if (!shouldPrepareTemporaryPan({
        code: event.code,
        embedOwnsFocus,
        interactiveControlOwnsFocus,
        key: event.key,
      })) {
        if (event.code === "Space" || event.key === " ") {
          setSpaceReady(false);
          setPanCursorDragging(false);
        }
        return;
      }
      setSpaceReady(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") setSpaceReady(false);
    };
    const resetPanCursor = () => {
      setSpaceReady(false);
      setPanCursorDragging(false);
    };
    const resetPanCursorForInteractiveFocus = (event: FocusEvent) => {
      if (targetsInteractiveControl(event.target)) resetPanCursor();
    };
    const finishPanCursorDrag = () => setPanCursorDragging(false);

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("focusin", resetPanCursorForInteractiveFocus, true);
    window.addEventListener("pointerup", finishPanCursorDrag, true);
    window.addEventListener("pointercancel", finishPanCursorDrag, true);
    window.addEventListener("blur", resetPanCursor);
    return () => {
      onTemporaryPanChange(false);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("focusin", resetPanCursorForInteractiveFocus, true);
      window.removeEventListener("pointerup", finishPanCursorDrag, true);
      window.removeEventListener("pointercancel", finishPanCursorDrag, true);
      window.removeEventListener("blur", resetPanCursor);
    };
  }, [activeYouTubePlayerId, onTemporaryPanChange]);

  const startImageTransform = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!api || !imageControls || (event.pointerType === "mouse" && event.button !== 0)) return;
    const image = api.getSceneElements().find((element) => element.id === imageControls.imageId);
    const rootBounds = rootRef.current?.getBoundingClientRect();
    if (!image || image.type !== "image" || !rootBounds) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const appState = api.getAppState();
    const centerViewport = sceneCoordsToViewportCoords({
      sceneX: image.x + image.width / 2,
      sceneY: image.y + image.height / 2,
    }, appState);
    const centerScene = {
      x: image.x + image.width / 2,
      y: image.y + image.height / 2,
    };
    imageTransformDrag.current = {
      imageId: image.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElement: image,
      startElements: getImageAnnotationBundle(api.getSceneElements(), image),
      centerScene,
      centerViewport,
      startPointerAngle: Math.atan2(event.clientY - centerViewport.y, event.clientX - centerViewport.x),
    };
    setImageTransformPreview({
      angle: image.angle,
      centerX: centerViewport.x - rootBounds.left,
      centerY: centerViewport.y - rootBounds.top,
      height: image.height * appState.zoom.value,
      width: image.width * appState.zoom.value,
    });
  }, [api, imageControls]);

  const handleCanvasPointerDownCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!api || (event.target instanceof Element && event.target.closest(".text-box-selection, .html-page-selection, .interactive-html-canvas-frame__floating-controls, input, textarea, [contenteditable='true']"))) return;
    if (startInkStroke(event, spacePanReadyRef.current)) return;
    const targetsInteractiveCanvas = event.target instanceof HTMLCanvasElement
      && event.target.classList.contains("interactive");
    if (
      event.button === 0
      && targetsInteractiveCanvas
      && (activeTool === "hand" || spacePanReadyRef.current)
    ) {
      setPanCursorDragging(true);
    }
    if (targetsInteractiveCanvas && event.button === 0 && !spacePanReadyRef.current
      && !event.altKey && !event.ctrlKey && !event.metaKey
      && activeTool === "text" && api.getAppState().activeTool.type === "text"
      && !api.getAppState().editingTextElement) {
      const state = api.getAppState();
      const point = viewportCoordsToSceneCoords({clientX: event.clientX, clientY: event.clientY}, state);
      const elements = api.getSceneElements();
      const hit = topmostElementAtPoint(elements, point, 0);
      // Reopening an existing text (including a rich-text rendition) retains its formatting.
      if (hit?.type !== "text" && !(hit && richTextImageSourceId(hit))) {
        const material = findTopmostMaterialAnnotationTargetAtPoint(elements, point);
        const background = surfaceBackgroundAtPoint(event.clientX, event.clientY);
        const color = material || isBasicShapeElement(hit)
          ? automaticTextColor(state.currentItemStrokeColor, background)
          : isNeutralTextColor(state.currentItemStrokeColor) ? foregroundColor[theme] : state.currentItemStrokeColor;
        // The native pointer handler creates the text immediately after capture.
        flushSync(() => api.updateScene({appState: {currentItemStrokeColor: color}, captureUpdate: CaptureUpdateAction.NEVER}));
      }
    }
    const targetsImageQuickAction = event.target instanceof Element && event.target.closest(".image-quick-action");
    const targetsImageCoverControl = event.target instanceof Element && event.target.closest(".image-cover-controls");
    const targetsImageCropControl = event.target instanceof Element && event.target.closest(".image-crop-mode-menu, .image-crop-selection-frame");
    const targetsElementContextMenu = event.target instanceof Element && event.target.closest(".canvas-element-context-menu");
    if (targetsElementContextMenu) return;
    if (imageCropMenuImageId && !targetsImageQuickAction && !targetsImageCropControl) setImageCropMenuImageId(null);

    const focusAppState = api.getAppState();
    if (focusAppState.croppingElementId) {
      const croppingImage = api.getSceneElements().find((element) => (
        element.id === focusAppState.croppingElementId && element.type === "image" && !element.isDeleted
      ));
      const cropPoint = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, focusAppState);
      if (!croppingImage || !elementContainsPoint(croppingImage, cropPoint, 12 / focusAppState.zoom.value)) {
        api.updateScene({
          appState: { croppingElementId: null },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
      return;
    }
    const rootBounds = rootRef.current?.getBoundingClientRect();
    if (
      imageControls
      && rootBounds
      && event.button === 0
      && activeTool === "selection"
      && focusAppState.activeTool.type === "selection"
      && pointerHitsNativeRotationHandle({
        clientX: event.clientX,
        clientY: event.clientY,
        handleClientX: rootBounds.left + imageControls.rotate.x,
        handleClientY: rootBounds.top + imageControls.rotate.y,
        pointerType: event.pointerType,
      })
    ) {
      startImageTransform(event);
      return;
    }
    const retargetsFocus = shouldRetargetElementFocus(
      focusAppState.activeTool.type,
      spacePanReadyRef.current,
    );
    if (focusedElementIds.current.length > 0 && !targetsImageQuickAction && !targetsImageCoverControl && event.button === 0 && retargetsFocus) {
      const focusPoint = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, focusAppState);
      const focusTarget = topmostElementAtPoint(api.getSceneElements(), focusPoint, 8 / focusAppState.zoom.value);
      const nextFocusedIds = nextElementFocusIds(focusedElementIds.current, focusTarget?.id ?? null, event.shiftKey);
      if (nextFocusedIds.length === 0) clearImageFocus();
      else setFocusedElements(nextFocusedIds);
    }

    if (
      targetsImageQuickAction
      || targetsImageCoverControl
      || targetsImageCropControl
      || event.button !== 0
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
    ) return;

    const appState = api.getAppState();
    if (activeTool !== "selection" || appState.activeTool.type !== "selection") return;

    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, appState);
    const elements = api.getSceneElements();
    const target = topmostElementAtPoint(elements, point, 8 / appState.zoom.value);
    if (!target) return;
    if (isImageCoverElement(target)) {
      const imageId = target.customData?.imageId;
      const image = typeof imageId === "string"
        ? elements.find((element) => element.id === imageId)
        : null;
      if (
        image
        && isCoverTarget(image)
        && isImageCoverFull(coverRectForTarget(image, target))
      ) {
        startCoveredMaterialDrag(event, image, target, elements);
        return;
      }
    }
    const selectionIntent = getCanvasAnnotationSelectionIntent(target);
    const independentAnnotation = !selectionIntent && isIndependentMaterialAnnotation(target)
      && target.groupIds.length === 0 && !target.locked
      && (Object.values(appState.selectedElementIds).filter(Boolean).length <= 1 || !appState.selectedElementIds[target.id]);
    if (!selectionIntent && !independentAnnotation) return;

    if (selectionIntent && preservesIndependentImageAnnotationMultiSelection(
      target.id,
      selectionIntent.groupId,
      appState.editingGroupId,
      appState.selectedElementIds,
      appState.selectedGroupIds,
    )) return;

    if (selectionIntent?.mode === "annotation" || independentAnnotation) {
      const groupId = selectionIntent?.groupId ?? null;
      if (target.locked) return;
      rootRef.current?.querySelector<HTMLElement>(".excalidraw")?.focus();
      const editingGroupId = getCanvasAnnotationEditingGroupId(target);
      const isIndividuallySelected = appState.editingGroupId === editingGroupId
        && appState.selectedElementIds[target.id]
        && (!groupId || !appState.selectedGroupIds[groupId]);
      if (isIndividuallySelected) {
        const textContainer = target.type === "text" && target.containerId
          ? elements.find((element) => element.id === target.containerId) ?? null
          : null;
        const preservesNativeClick = Boolean(existingTextSelectionTarget(target, textContainer, elements));
        if (!preservesNativeClick) event.preventDefault();
        // Keep the gesture in the parent document while crossing an HTML iframe.
        event.currentTarget.setPointerCapture(event.pointerId);
        event.stopPropagation();
        annotationMoveDrag.current = {
          elementId: target.id,
          moved: false,
          pointerId: event.pointerId,
          preservesNativeClick,
          startElement: target,
          startPointer: point,
        };
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      annotationMoveDrag.current = {
        elementId: target.id, moved: false, pointerId: event.pointerId,
        startElement: target, startPointer: point,
      };
      api.updateScene({
        appState: {
          editingGroupId,
          selectedElementIds: { [target.id]: true },
          selectedGroupIds: {},
          selectedLinearElement: null,
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      return;
    }

    if (!selectionIntent || appState.editingGroupId !== selectionIntent.groupId) return;
    const selectedElementIds: Record<string, true> = Object.fromEntries(api.getSceneElements()
      .filter((element) => !element.isDeleted && element.groupIds.includes(selectionIntent.groupId))
      .map((element) => [element.id, true as const]));
    api.updateScene({
      appState: {
        editingGroupId: null,
        selectedElementIds,
        selectedGroupIds: { [selectionIntent.groupId]: true },
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, [activeTool, api, clearImageFocus, imageControls, imageCropMenuImageId, setFocusedElements, startCoveredMaterialDrag, startImageTransform, startInkStroke, resolvedCanvasBackgroundColor, theme, surfaceBackgroundAtPoint]);

  const handleCanvasContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!api) return;
    if (event.target instanceof Element && event.target.closest("button, input, textarea, .context-formatting-toolbar, .image-cover-controls, .image-crop-selection-frame")) return;

    event.preventDefault();
    event.stopPropagation();
    const appState = api.getAppState();
    const elements = api.getSceneElements();
    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, appState);
    const target = topmostElementAtPoint(elements, point, 8 / appState.zoom.value);
    if (!target) {
      setElementContextMenu(null);
      return;
    }

    const currentSelectedIds = Object.keys(appState.selectedElementIds).filter((id) => appState.selectedElementIds[id]);
    let selectedElementIds: Record<string, true>;
    let selectedGroupIds: Record<string, true> = {};
    let editingGroupId: string | null = null;

    if (appState.selectedElementIds[target.id] && currentSelectedIds.length > 0) {
      selectedElementIds = Object.fromEntries(currentSelectedIds.map((id) => [id, true as const]));
      selectedGroupIds = Object.fromEntries(Object.keys(appState.selectedGroupIds)
        .filter((id) => appState.selectedGroupIds[id])
        .map((id) => [id, true as const]));
      editingGroupId = appState.editingGroupId;
    } else {
      const selectionIntent = getCanvasAnnotationSelectionIntent(target);
      if (selectionIntent?.mode === "annotation") {
        selectedElementIds = { [target.id]: true };
        editingGroupId = getCanvasAnnotationEditingGroupId(target);
      } else {
        const groupId = selectionIntent?.groupId ?? target.groupIds.at(-1);
        const selectedElements = groupId
          ? elements.filter((element) => !element.isDeleted && element.groupIds.includes(groupId))
          : [target];
        selectedElementIds = Object.fromEntries(selectedElements.map((element) => [element.id, true as const]));
        if (groupId && selectedElements.length > 1) selectedGroupIds = { [groupId]: true };
      }
    }

    clearImageFocus();
    api.setActiveTool({ type: "selection" });
    api.updateScene({
      appState: {
        editingGroupId,
        editingTextElement: null,
        selectedElementIds,
        selectedGroupIds,
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    onToolChange("selection");
    setElementContextMenu({
      selectionCount: Object.keys(selectedElementIds).length,
      x: Math.min(event.clientX, window.innerWidth - 194),
      y: Math.min(event.clientY, window.innerHeight - 126),
    });
  }, [api, clearImageFocus, onToolChange]);

  const handleProjectedMediaContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>, elementId: string) => {
    if (!api) return;
    const target = api.getSceneElements().find((element) => element.id === elementId && !element.isDeleted);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const appState = api.getAppState();
    const currentSelectedIds = Object.keys(appState.selectedElementIds).filter((id) => appState.selectedElementIds[id]);
    const selectedElementIds = appState.selectedElementIds[target.id] && currentSelectedIds.length > 0
      ? Object.fromEntries(currentSelectedIds.map((id) => [id, true as const]))
      : { [target.id]: true as const };
    clearImageFocus();
    api.setActiveTool({ type: "selection" });
    api.updateScene({
      appState: {
        editingGroupId: null,
        editingTextElement: null,
        selectedElementIds,
        selectedGroupIds: {},
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    onToolChange("selection");
    setElementContextMenu({
      selectionCount: Object.keys(selectedElementIds).length,
      x: Math.min(event.clientX, window.innerWidth - 194),
      y: Math.min(event.clientY, window.innerHeight - 126),
    });
  }, [api, clearImageFocus, onToolChange]);

  const beginProjectedMediaMove = useCallback((event: {clientX: number; clientY: number; pointerId: number; button: number}, elementId: string, onMoved?: () => void) => {
    if (!api || event.button !== 0) return;
    const elements = api.getSceneElements();
    const element = elements.find((candidate) => candidate.id === elementId && !candidate.isDeleted);
    if (!element || element.locked) return;
    const movesMaterialBundle = isInteractiveHtmlMaterialElement(element) || isYouTubeMaterialElement(element) || isEmbeddedAppElement(element);
    const groupId = movesMaterialBundle ? imageAnnotationGroupId(element.id) : null;
    const startElements = groupId
      ? getMaterialBundleElements(elements, element.id, groupId)
      : [element];
    const startPointer = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState());
    clearImageFocus();
    api.setActiveTool({ type: "selection" });
    api.updateScene({
      appState: {
        editingGroupId: null,
        editingTextElement: null,
        selectedElementIds: Object.fromEntries(startElements.map((candidate) => [candidate.id, true])),
        selectedGroupIds: groupId && startElements.length > 1 ? { [groupId]: true } : {},
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    onToolChange("selection");
    const drag: MaterialBundleMoveDrag = {
      moved: false,
      onMoved,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElements,
      startPointer,
    };
    projectedMediaMoveDrag.current = drag;
    flushSync(()=>setProjectedMediaMoveActive(true));
    return drag;
  }, [api, clearImageFocus, onToolChange]);

  const startProjectedMediaMove = useCallback((event: ReactPointerEvent<HTMLElement>, elementId: string, onMoved?: () => void) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginProjectedMediaMove(event, elementId, onMoved);
  }, [beginProjectedMediaMove]);

  const startProjectedAnnotationMove = useCallback((event: ReactPointerEvent<SVGElement>, elementId: string) => {
    if (!api || activeTool !== "selection" || (event.pointerType === "mouse" && event.button !== 0)) return;
    const elements = api.getSceneElements();
    const target = elements.find((element) => element.id === elementId && !element.isDeleted);
    if (!target || target.locked) return;
    const selectionIntent = getCanvasAnnotationSelectionIntent(target);
    if (selectionIntent?.mode !== "annotation") return;

    event.preventDefault();
    event.stopPropagation();
    rootRef.current?.querySelector<HTMLElement>(".excalidraw")?.focus();
    clearImageFocus();
    api.setActiveTool({ type: "selection" });
    onToolChange("selection");
    const appState = api.getAppState();
    const editingGroupId = getCanvasAnnotationEditingGroupId(target);
    const isIndividuallySelected = appState.editingGroupId === editingGroupId
      && appState.selectedElementIds[target.id]
      && !appState.selectedGroupIds[selectionIntent.groupId];
    const captureTarget = event.currentTarget.ownerSVGElement ?? event.currentTarget;
    if (!isIndividuallySelected) {
      captureTarget.setPointerCapture(event.pointerId);
      setProjectedAnnotationDragId(target.id);
      annotationMoveDrag.current = {
        elementId: target.id,
        moved: false,
        pointerId: event.pointerId,
        startElement: target,
        startPointer: viewportCoordsToSceneCoords(
          { clientX: event.clientX, clientY: event.clientY },
          appState,
        ),
      };
      api.updateScene({
        appState: {
          editingGroupId,
          selectedElementIds: { [target.id]: true },
          selectedGroupIds: {},
          selectedLinearElement: null,
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      return;
    }

    captureTarget.setPointerCapture(event.pointerId);
    setProjectedAnnotationDragId(target.id);
    annotationMoveDrag.current = {
      elementId: target.id,
      moved: false,
      pointerId: event.pointerId,
      startElement: target,
      startPointer: viewportCoordsToSceneCoords(
        { clientX: event.clientX, clientY: event.clientY },
        appState,
      ),
    };
  }, [activeTool, api, clearImageFocus, onToolChange]);

  useEffect(() => {
    if (!api) return;
    const routeAnnotationBackspace = (event: KeyboardEvent) => {
      if (
        event.key !== "Backspace"
        || event.defaultPrevented
        || event.altKey
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || (event.target instanceof Element && Boolean(event.target.closest("input, textarea, [contenteditable='true']")))
      ) return;
      const appState = api.getAppState();
      if (appState.editingTextElement) return;
      const selected = api.getSceneElements().filter((element) => appState.selectedElementIds[element.id]);
      if (selected.length !== 1) return;
      const selectionIntent = getCanvasAnnotationSelectionIntent(selected[0]);
      if (selectionIntent?.mode !== "annotation" || appState.editingGroupId !== getCanvasAnnotationEditingGroupId(selected[0])) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      dispatchCanvasKeyboardCommand(rootRef.current, { code: "Delete", key: "Delete" });
    };
    window.addEventListener("keydown", routeAnnotationBackspace, true);
    return () => window.removeEventListener("keydown", routeAnnotationBackspace, true);
  }, [api]);

  useEffect(() => {
    if (!elementContextMenu) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".canvas-element-context-menu")) return;
      setElementContextMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setElementContextMenu(null);
    };
    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [elementContextMenu]);

  const copySelectedCanvasElements = useCallback(async () => {
    setElementContextMenu(null);
    if (!api) return;
    const selectedIds = new Set(Object.keys(api.getAppState().selectedElementIds).filter((id) => (
      api.getAppState().selectedElementIds[id]
    )));
    const selectedElements = api.getSceneElements().filter((element) => selectedIds.has(element.id));
    if (selectedElements.length === 0) return;

    const selectedFileIds = new Set(selectedElements.flatMap((element) => (
      element.type === "image" && element.fileId ? [element.fileId] : []
    )));
    const selectedFiles = Object.fromEntries(Object.entries(api.getFiles()).filter(([fileId]) => (
      selectedFileIds.has(fileId as FileId)
    ))) as ReturnType<ExcalidrawImperativeAPI["getFiles"]>;
    const clipboardText = serializeAsJSON(selectedElements, {}, selectedFiles, "local");

    try {
      const hasImage = selectedElements.some(element => element.type === "image" && !richTextImageSourceId(element));
      if (hasImage) {
        // Pass the promise directly: WebKit requires clipboard.write within the user gesture.
        // Keep scene data in memory; text/plain would leak Excalidraw JSON to apps
        // which prefer text over the image representation.
        const png = exportToBlob({ elements: selectedElements, files: selectedFiles,
          appState: { exportBackground: false, exportEmbedScene: false, exportWithDarkMode: false },
          exportPadding: 0, mimeType: "image/png",
        });
        await navigator.clipboard.write([new ClipboardItem({
          "image/png": png,
        })]);
        rememberInternalImageCopy(clipboardText, png);
      } else {
        await navigator.clipboard.writeText(clipboardText);
      }
    } catch (error: unknown) {
      console.error(t("Canvasobjekt konnte nicht kopiert werden."), error);
      setCanvasActionError("Kopieren nicht möglich");
    }
  }, [api]);

  useEffect(() => {
    const copyImages = (event: ClipboardEvent) => {
      if (!api || api.getAppState().editingTextElement) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(".canvas-engine") || target.closest("input, textarea, [contenteditable='true']")) return;
      const selected = api.getAppState().selectedElementIds;
      if (!api.getSceneElements().some(element => selected[element.id] && element.type === "image" && !richTextImageSourceId(element))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void copySelectedCanvasElements();
    };
    window.addEventListener("copy", copyImages, true);
    return () => window.removeEventListener("copy", copyImages, true);
  }, [api, copySelectedCanvasElements]);

  const deleteSelectedCanvasElements = useCallback(() => {
    setElementContextMenu(null);
    dispatchCanvasKeyboardCommand(rootRef.current, { code: "Delete", key: "Delete" });
  }, []);

  const updateProjectedMediaMove = useCallback((phase: "move" | "end" | "cancel", point: {pointerId: number; clientX: number; clientY: number}, source: "native" | "html" = "native") => {
    const drag = projectedMediaMoveDrag.current;
    if (!api || !drag || drag.pointerId !== point.pointerId || Boolean(drag.htmlSource) !== (source === "html")) return false;
    const finish=()=>{
      projectedMediaMoveDrag.current=null;
      flushSync(()=>setProjectedMediaMoveActive(false));
      if(drag.htmlSource){
        // Clear the iframe-side gesture even for a tap, blur or host-side end.
        // Registered apps already implement this same mode contract.
        const iframe=rootRef.current?.querySelector<HTMLIFrameElement>(`.interactive-html-canvas-frame[data-canvas-element-id="${CSS.escape(drag.htmlSource.elementId)}"] iframe`);
        iframe?.contentWindow?.postMessage({type:"tafelraum:interactive-material-move-mode",enabled:false},"*");
        if(api.getAppState().activeTool.type==="selection"&&!spacePanReadyRef.current)
          iframe?.contentWindow?.postMessage({type:"tafelraum:interactive-material-move-mode",enabled:true},"*");
      }
      if(drag.startElements.some(element=>isInteractiveHtmlMaterialElement(element)||isEmbeddedAppElement(element)))
        rootRef.current?.querySelector<HTMLElement>(".excalidraw")?.focus();
    };
    if (phase === "cancel") {
      if (drag.moved) api.updateScene({
        elements: translateMaterialBundleElements(api.getSceneElements(), drag.startElements, 0, 0,
          (element, x, y) => newElementWith<ExcalidrawElement>(element, { x, y })),
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      finish();
      return true;
    }
    if (!drag.moved && Math.hypot(point.clientX - drag.startClientX, point.clientY - drag.startClientY) >= transformDragThreshold) {
      drag.moved = true;
      drag.onMoved?.();
    }
    if (drag.moved) {
      const scenePoint = viewportCoordsToSceneCoords(point, api.getAppState());
      const elements = translateMaterialBundleElements(api.getSceneElements(), drag.startElements,
        scenePoint.x - drag.startPointer.x, scenePoint.y - drag.startPointer.y,
        (element, x, y) => newElementWith<ExcalidrawElement>(element, { x, y }));
      if (phase === "end") {
        // Excalidraw excludes uncommitted API previews from IMMEDIATELY.
        // Restore only this gesture's base synchronously, then commit its result once.
        const base = new Map(drag.startElements.map(element => [element.id, element]));
        flushSync(() => api.updateScene({elements: api.getSceneElements().map(element => base.get(element.id) ?? element),
          captureUpdate: CaptureUpdateAction.EVENTUALLY}));
      }
      api.updateScene({elements,
        captureUpdate: phase === "end" ? CaptureUpdateAction.IMMEDIATELY : CaptureUpdateAction.EVENTUALLY});
    }
    if (phase === "end") finish();
    return drag.moved;
  }, [api]);

  useEffect(() => {
    const route = (phase: "move" | "end" | "cancel", event: PointerEvent) => {
      const drag=projectedMediaMoveDrag.current;
      if(!drag||drag.pointerId!==event.pointerId)return;
      // A moving iframe can pass underneath the pointer. Continue and finish
      // that same gesture when events arrive on the surrounding host instead.
      const htmlSource=drag.htmlSource;
      const point=htmlSource ? {pointerId:event.pointerId,
        clientX:drag.startClientX+event.screenX-htmlSource.screenX,
        clientY:drag.startClientY+event.screenY-htmlSource.screenY} : event;
      const moved=updateProjectedMediaMove(phase, point, htmlSource ? "html" : "native");
      if(!moved)return;
      event.preventDefault();
      event.stopPropagation();
    };
    const move = (event: PointerEvent) => route("move", event);
    const end = (event: PointerEvent) => route("end", event);
    const cancel = (event: PointerEvent) => route("cancel", event);
    const blur = () => {
      const drag = projectedMediaMoveDrag.current;
      if (drag) updateProjectedMediaMove("cancel", {pointerId:drag.pointerId,clientX:drag.startClientX,clientY:drag.startClientY}, drag.htmlSource ? "html" : "native");
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", cancel, true);
      window.removeEventListener("blur", blur);
    };
  }, [api, updateProjectedMediaMove]);

  const routeInteractiveHtmlMaterialMove = useCallback((elementId: string, message: InteractiveHtmlMaterialMoveMessage, viewportPoint: {x: number; y: number}) => {
    if (!api || !rootRef.current) return;
    if (message.phase === "start") {
      if (activeTool !== "selection" || spacePanReadyRef.current || projectedMediaMoveDrag.current) return;
      const target = api.getSceneElements().find(element => element.id === elementId && !element.isDeleted);
      if (!target || (!isInteractiveHtmlMaterialElement(target) && !isEmbeddedAppElement(target))) return;
      if (target.locked) {
        clearImageFocus();
        api.updateScene({appState:{editingGroupId:null,selectedElementIds:{[target.id]:true},selectedGroupIds:{},selectedLinearElement:null},captureUpdate:CaptureUpdateAction.NEVER});
        return;
      }
      const bounds = rootRef.current.getBoundingClientRect();
      const drag = beginProjectedMediaMove({clientX:bounds.left+viewportPoint.x,clientY:bounds.top+viewportPoint.y,pointerId:message.pointerId,button:0}, elementId);
      if (drag) drag.htmlSource = {elementId, screenX:message.screenX, screenY:message.screenY};
      return;
    }
    const drag = projectedMediaMoveDrag.current;
    if (drag?.htmlSource?.elementId !== elementId) return;
    // Screen coordinates do not change when the iframe itself follows the pointer.
    updateProjectedMediaMove(message.phase, {pointerId:message.pointerId,
      clientX:drag.startClientX+message.screenX-drag.htmlSource.screenX,
      clientY:drag.startClientY+message.screenY-drag.htmlSource.screenY}, "html");
    if (message.phase === "end") rootRef.current.querySelector<HTMLElement>(".excalidraw")?.focus();
  }, [activeTool, api, beginProjectedMediaMove, clearImageFocus, updateProjectedMediaMove]);

  useEffect(() => {
    if (!activeYouTubePlayerId) return;
    const deactivateOutsidePlayer = (event: PointerEvent) => {
      if (
        event.target instanceof Element
        && event.target.closest(`[data-canvas-element-id="${CSS.escape(activeYouTubePlayerId)}"]`)
      ) return;
      setActiveYouTubePlayerId(null);
    };
    const deactivateOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveYouTubePlayerId(null);
    };
    window.addEventListener("pointerdown", deactivateOutsidePlayer, true);
    window.addEventListener("keydown", deactivateOnEscape, true);
    return () => {
      window.removeEventListener("pointerdown", deactivateOutsidePlayer, true);
      window.removeEventListener("keydown", deactivateOnEscape, true);
    };
  }, [activeYouTubePlayerId]);

  useEffect(() => {
    const syncZoomModifier = (event: KeyboardEvent) => {
      // App-owned Undo/Redo dispatches a command, not a held physical modifier.
      if (!event.isTrusted) return;
      setProjectedMediaZoomModifierActive(hasCanvasZoomModifier(event));
    };
    const resetZoomModifier = () => setProjectedMediaZoomModifierActive(false);

    window.addEventListener("keydown", syncZoomModifier, true);
    window.addEventListener("keyup", syncZoomModifier, true);
    window.addEventListener("blur", resetZoomModifier);
    return () => {
      window.removeEventListener("keydown", syncZoomModifier, true);
      window.removeEventListener("keyup", syncZoomModifier, true);
      window.removeEventListener("blur", resetZoomModifier);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const routeProjectedMediaWheel = (event: WheelEvent) => {
      const fixedProjectedMediaTarget = event.target instanceof Element
        && Boolean(event.target.closest(".audio-canvas-player, .local-video-canvas-player, .youtube-canvas-player, .timer-widget"));
      const interactiveHtmlTarget = event.target instanceof Element
        && Boolean(event.target.closest(".interactive-html-canvas-frame"));
      const laserTarget = event.target instanceof Element && Boolean(event.target.closest(".laser-surface"));
      const intent = getProjectedMediaWheelIntent({
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        projectedMediaTarget: fixedProjectedMediaTarget || interactiveHtmlTarget || laserTarget,
      });
      if (!intent || (interactiveHtmlTarget && intent === "pan")) return;

      if (!dispatchWheelToCanvas(root, event)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("wheel", routeProjectedMediaWheel, { capture: true, passive: false });
    return () => root.removeEventListener("wheel", routeProjectedMediaWheel, true);
  }, []);

  const routeInteractiveHtmlWheelPan = useCallback((
    message: InteractiveHtmlWheelPanMessage,
    viewportPoint: { x: number; y: number },
  ) => {
    const root = rootRef.current;
    if (!root) return;
    const rootBounds = root.getBoundingClientRect();
    dispatchWheelToCanvas(root, {
      clientX: rootBounds.left + viewportPoint.x,
      clientY: rootBounds.top + viewportPoint.y,
      deltaMode: message.deltaMode,
      deltaX: message.deltaX,
      deltaY: message.deltaY,
      shiftKey: message.shiftKey,
    });
  }, []);

  const rememberInteractiveHtmlScroll = useCallback((
    elementId: ExcalidrawElement["id"],
    offset: InteractiveHtmlScrollOffset,
  ) => {
    interactiveHtmlScrollOffsets.current.set(elementId, offset);
  }, []);

  useEffect(() => {
    const preserveBrowserPlus = (event: KeyboardEvent) => {
      if (shouldPreserveBrowserPlusShortcut(event)) {
        // Stop Excalidraw's global Cmd+] layer action without canceling Chrome's page zoom.
        // Content zoom, when offered, belongs to the embed itself.
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", preserveBrowserPlus, true);
    return () => window.removeEventListener("keydown", preserveBrowserPlus, true);
  }, []);

  const routeInteractiveHtmlZoom = useCallback((
    message: InteractiveHtmlZoomMessage,
    viewportPoint: { x: number; y: number },
  ) => {
    const root = rootRef.current;
    if (!api || !root) return;
    const rootBounds = root.getBoundingClientRect();
    const clientX = rootBounds.left + viewportPoint.x;
    const clientY = rootBounds.top + viewportPoint.y;
    const zoomState = getInteractiveHtmlCanvasZoom(message, { clientX, clientY }, api.getAppState());
    api.updateScene({
      appState: {
        scrollX: zoomState.scrollX,
        scrollY: zoomState.scrollY,
        zoom: { value: zoomState.zoom.value as AppState["zoom"]["value"] },
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, [api]);

  const routeInteractiveHtmlBackgroundPan = useCallback((
    elementId: ExcalidrawElement["id"],
    message: InteractiveHtmlPanMessage,
    viewportPoint: { x: number; y: number },
  ) => {
    if (!api) return;
    if (message.phase === "start") {
      if (activeTool !== "hand" && !spacePanReadyRef.current) return;
      interactiveHtmlPanDrag.current = {
        elementId,
        lastViewportPoint: viewportPoint,
        pointerId: message.pointerId,
      };
      setPanCursorDragging(true);
      return;
    }

    const drag = interactiveHtmlPanDrag.current;
    if (!drag || drag.elementId !== elementId || drag.pointerId !== message.pointerId) return;
    if (message.phase === "move" || message.phase === "end") {
      const appState = api.getAppState();
      const nextPan = getInteractiveHtmlCanvasPan({
        x: viewportPoint.x - drag.lastViewportPoint.x,
        y: viewportPoint.y - drag.lastViewportPoint.y,
      }, appState);
      drag.lastViewportPoint = viewportPoint;
      api.updateScene({
        appState: nextPan,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    }
    if (message.phase === "end" || message.phase === "cancel") {
      interactiveHtmlPanDrag.current = null;
      setPanCursorDragging(false);
    }
  }, [activeTool, api]);

  useEffect(() => {
    if(!api)return;
    const nudge=(event:KeyboardEvent)=>{
      const delta=event.key==='ArrowLeft'?{x:-1,y:0}:event.key==='ArrowRight'?{x:1,y:0}
        :event.key==='ArrowUp'?{x:0,y:-1}:event.key==='ArrowDown'?{x:0,y:1}:null;
      if(!delta||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey
        ||(event.target instanceof Element&&event.target.closest('input,textarea,[contenteditable="true"],button,select'))
        ||!rootRef.current?.contains(event.target as Node))return;
      const state=api.getAppState();
      if(state.activeTool.type!=='selection'||state.editingTextElement||annotationMoveDrag.current)return;
      const elements=api.getSceneElements(), selected=elements.filter(e=>!e.isDeleted&&state.selectedElementIds[e.id]);
      const material=selected.find(element=>isInteractiveHtmlMaterialElement(element)||isEmbeddedAppElement(element));
      if(material&&!material.locked){
        const bundle=getMaterialBundleElements(elements,material.id,imageAnnotationGroupId(material.id));
        const ids=new Set(bundle.map(element=>element.id));
        if(!selected.every(element=>ids.has(element.id)))return;
        // Match pointer movement: carrier and bound annotations form one commit.
        // Native arrow previews alone do not create an API history increment.
        const step=event.shiftKey?10:1;
        event.preventDefault();event.stopImmediatePropagation();
        api.updateScene({elements:translateMaterialBundleElements(elements,bundle,delta.x*step,delta.y*step,
          (element,x,y)=>newElementWith(element,{x,y})),captureUpdate:CaptureUpdateAction.IMMEDIATELY});
        return;
      }
      if(selected.length!==1||selected[0].locked||!isIndependentMaterialAnnotation(selected[0])
        ||Object.values(state.selectedGroupIds).some(Boolean))return;
      const original=selected[0],projection=annotationScrollProjection(original,elements,interactiveHtmlScrollOffsets.current);
      const step=event.shiftKey?10:1;
      const moved=newElementWith(original,independentAnnotationMovePatch(original,{x:delta.x*step,y:delta.y*step},projection.translation,projection.currentScrollAnchor));
      const settled=annotationAfterIndependentMove(moved,elements,{x:0,y:0},interactiveHtmlScrollOffsets.current);
      const updated=settled===moved?moved:newElementWith(moved,{x:settled.x,y:settled.y,groupIds:[...settled.groupIds],customData:settled.customData});
      event.preventDefault();event.stopPropagation();
      api.updateScene({elements:elements.map(e=>e.id===original.id?updated:e),
        appState:{editingGroupId:getCanvasAnnotationEditingGroupId(updated),selectedGroupIds:{}},captureUpdate:CaptureUpdateAction.IMMEDIATELY});
    };
    window.addEventListener('keydown',nudge,true);
    return()=>window.removeEventListener('keydown',nudge,true);
  },[api]);

  useEffect(() => {
    const translatedElement = (drag: AnnotationMoveDrag, event: PointerEvent) => {
      if (!api) return null;
      const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, api.getAppState());
      const elements = api.getSceneElements();
      const current = elements.find(element => element.id === drag.elementId && !element.isDeleted);
      if (!current) return null;
      const projection = annotationScrollProjection(drag.startElement,elements,interactiveHtmlScrollOffsets.current);
      // Positions use the stable gesture origin, revisions use the latest
      // element. Reusing the origin's revision leaves the HTML cache key unchanged.
      return newElementWith(current, independentAnnotationMovePatch(drag.startElement,
        {x:point.x-drag.startPointer.x,y:point.y-drag.startPointer.y},
        projection.translation,projection.currentScrollAnchor));
    };

    const continueAnnotationMove = (event: PointerEvent) => {
      const drag = annotationMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      const movedElement = translatedElement(drag, event);
      if (!movedElement) return;
      const point = viewportCoordsToSceneCoords({clientX:event.clientX,clientY:event.clientY},api.getAppState());
      drag.moved ||= Math.hypot(
        point.x - drag.startPointer.x,
        point.y - drag.startPointer.y,
      ) >= transformDragThreshold;
      if (!drag.moved) {
        if (!drag.preservesNativeClick) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      flushSync(() => api.updateScene({
        elements: api.getSceneElements().map((element) => element.id === drag.elementId ? movedElement : element),
        // Binding remains until drop, but its engine group-edit rectangle must
        // not grow across the canvas while an annotation moves independently.
        appState:{editingGroupId:null,selectedGroupIds:{}},
        captureUpdate: CaptureUpdateAction.EVENTUALLY,
      }));
    };

    const finishAnnotationMove = (event: PointerEvent) => {
      const drag = annotationMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      let movedElement = translatedElement(drag, event);
      if (drag.moved && movedElement) {
        const elements = api.getSceneElements();
        const {translation} = annotationScrollProjection(movedElement,elements,interactiveHtmlScrollOffsets.current);
        const settled = annotationAfterIndependentMove(movedElement,elements,translation,interactiveHtmlScrollOffsets.current);
        if (settled !== movedElement) movedElement = newElementWith(movedElement,{
          x:settled.x,y:settled.y,groupIds:[...settled.groupIds],customData:settled.customData,
        });
        annotationMoveDrag.current = null;
        // Record the entire independent gesture (position and binding) as one undo step.
        flushSync(() => api.updateScene({
          elements: api.getSceneElements().map(element => element.id === drag.elementId ? drag.startElement : element),
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
        }));
        event.preventDefault();
        event.stopPropagation();
        api.updateScene({
          elements: api.getSceneElements().map((element) => element.id === drag.elementId ? movedElement! : element),
          appState: {editingGroupId: getCanvasAnnotationEditingGroupId(movedElement)},
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      } else if (!drag.preservesNativeClick) {
        event.preventDefault();
        event.stopPropagation();
      }
      annotationMoveDrag.current = null;
      setProjectedAnnotationDragId(null);
      if (!drag.moved) api.updateScene({appState:{selectedElementIds:{...api.getAppState().selectedElementIds}},captureUpdate:CaptureUpdateAction.NEVER});
    };

    const cancelAnnotationMove = (event: PointerEvent) => {
      const drag = annotationMoveDrag.current;
      if (!api || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      annotationMoveDrag.current = null;
      setProjectedAnnotationDragId(null);
      api.updateScene({
        elements: api.getSceneElements().map((element) => drag.moved && element.id === drag.elementId ? drag.startElement : element),
        appState:{selectedElementIds:{...api.getAppState().selectedElementIds}},
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    };

    window.addEventListener("pointermove", continueAnnotationMove, true);
    window.addEventListener("pointerup", finishAnnotationMove, true);
    window.addEventListener("pointercancel", cancelAnnotationMove, true);
    return () => {
      window.removeEventListener("pointermove", continueAnnotationMove, true);
      window.removeEventListener("pointerup", finishAnnotationMove, true);
      window.removeEventListener("pointercancel", cancelAnnotationMove, true);
    };
  }, [api]);

  const handleCanvasDoubleClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!api || event.button !== 0) return;
    const textarea = event.target instanceof Element
      ? event.target.closest<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg") : null;
    if (textarea) {
      const editing = api.getAppState().editingTextElement;
      if (editing?.type === "text" && !richTextOf(editing)) {
        event.preventDefault();
        event.stopPropagation();
        const range = nativeTextDoubleClickRange(editing, textarea.value, api.getAppState(),
          event.clientX, event.clientY, event.altKey);
        textarea.setSelectionRange(range.start, range.end);
      }
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, input")) return;
    const appState = api.getAppState();
    const isLaserMode = Boolean(laserControls?.active && event.target instanceof Element && event.target.closest(".laser-surface"));
    const isHandMode = !isLaserMode && activeTool === "hand" && appState.activeTool.type === "hand";
    const isSelectionMode = !isLaserMode && activeTool === "selection" && appState.activeTool.type === "selection";
    if (!isHandMode && !isSelectionMode && !isLaserMode) return;

    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, appState);
    const elements = api.getSceneElements();
    const hitTarget = topmostElementAtPoint(elements, point, 8 / appState.zoom.value);
    const richSourceId = hitTarget ? richTextImageSourceId(hitTarget) : null;
    const target = richSourceId
      ? elements.find((element) => element.id === richSourceId) ?? hitTarget
      : hitTarget?.type === "image"
      ? editableShapeAboveImageAtPoint(elements, hitTarget.id, point) ?? hitTarget
      : hitTarget;
    const textContainer = target?.type === "text" && target.containerId
      ? elements.find((element) => element.id === target.containerId) ?? null
      : null;
    const allowsTextEditing = allowsNativeTextDoubleClick(target, textContainer);
    const clickedText = target?.type === "text" ? target
      : isBasicShapeElement(target)
        ? elements.find(element => element.type === "text" && target.boundElements?.some(binding => binding.id === element.id))
        : null;
    pendingTextDoubleClick.current = clickedText
      ? { textId: clickedText.id, clientX: event.clientX, clientY: event.clientY, altKey: event.altKey } : null;
    if (pendingTextDoubleClick.current) {
      window.requestAnimationFrame(() => setRichEditorSelectionRevision(revision => revision + 1));
    }

    if (isSelectionMode && !target) {
      event.preventDefault();
      event.stopPropagation();
      clearImageFocus();
      api.setActiveTool({ type: "hand" });
      api.updateScene({
        appState: {
          editingGroupId: null,
          selectedElementIds: {},
          selectedGroupIds: {},
          selectedLinearElement: null,
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      onToolChange("hand");
      return;
    }

    if (isHandMode && allowsTextEditing) {
      clearImageFocus();
      api.setActiveTool({ type: "selection" });
      onToolChange("selection");
    }

    if (allowsTextEditing && clickedText?.type === "text"
      && (target?.groupIds.some(isShapeAnnotationGroupId) || clickedText.groupIds.some(isShapeAnnotationGroupId)
        || getCanvasAnnotationSelectionIntent(clickedText)?.mode === "annotation"
        || (!clickedText.containerId && clickedText.groupIds.length === 0))) {
      // Projected annotations and grouped shapes do not deliver a native canvas
      // double click. Open the same editor as the existing Text action.
      event.preventDefault();
      event.stopPropagation();
      api.updateScene({
        appState: {
          editingGroupId: getCanvasAnnotationEditingGroupId(clickedText),
          selectedElementIds: { [clickedText.id]: true },
          selectedGroupIds: {},
          selectedLinearElement: null,
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      window.requestAnimationFrame(() => dispatchCanvasKeyboardCommand(rootRef.current, { code: "Enter", key: "Enter" }));
      return;
    }

    if (isSelectionMode || (isHandMode && allowsTextEditing)) {
      if (!allowsTextEditing) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (isBasicShapeElement(target)) {
        const boundTextId = target.boundElements?.find((binding) => binding.type === "text")?.id;
        const boundText = boundTextId
          ? elements.find((element) => element.id === boundTextId && element.type === "text")
          : null;
        if (!boundText || boundText.strokeColor.toLowerCase() === getShapeColor(target).toLowerCase()) {
          const strokeColor = shapeTextColor(
            getShapeFillMode(target),
            getShapeColor(target),
            resolvedCanvasBackgroundColor,
          );
          pendingBoundTextColor.current = {
            containerId: target.id,
            elementId: boundText?.id ?? null,
            strokeColor,
          };
          api.updateScene({
            appState: { currentItemStrokeColor: strokeColor },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        }
      }
      if (target?.type === "text" && target.containerId) {
        const container = elements.find((element) => element.id === target.containerId);
        if (isBasicShapeElement(container) && target.strokeColor.toLowerCase() === getShapeColor(container).toLowerCase()) {
          const strokeColor = shapeTextColor(
            getShapeFillMode(container),
            getShapeColor(container),
            resolvedCanvasBackgroundColor,
          );
          pendingBoundTextColor.current = {
            containerId: target.containerId,
            elementId: target.id,
            strokeColor,
          };
          api.updateScene({
            appState: { currentItemStrokeColor: strokeColor },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        }
      }
      return;
    }
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    if (isLaserMode) laserControls?.cancel();
    clearImageFocus();
    const groupId = target.groupIds.at(-1);
    const groupElements = groupId
      ? elements.filter((element) => !element.isDeleted && element.groupIds.includes(groupId))
      : [target];
    const selectsGroup = Boolean(groupId && groupElements.length > 1);
    const selectedElements = selectsGroup ? groupElements : [target];
    api.setActiveTool({ type: "selection" });
    api.updateScene({
      appState: {
        editingGroupId: null,
        selectedElementIds: Object.fromEntries(selectedElements.map((element) => [element.id, true])),
        selectedGroupIds: selectsGroup && groupId ? { [groupId]: true } : {},
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    onToolChange("selection");
  }, [activeTool, api, clearImageFocus, onToolChange, theme, laserControls]);

  const openCanvasLink = useCallback((link: string) => {
    setCanvasActionError(null);
    void openExternalWebUrl(link).catch(() => {
      setCanvasActionError("Link konnte nicht geöffnet werden.");
    });
  }, []);

  const handleCanvasClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!api || event.button !== 0 || event.detail !== 1) return;
    if (event.target instanceof Element && event.target.closest("button, input, textarea")) return;

    const appState = api.getAppState();
    if (activeTool !== "hand" || appState.activeTool.type !== "hand") return;

    const point = viewportCoordsToSceneCoords({ clientX: event.clientX, clientY: event.clientY }, appState);
    const elements = api.getSceneElements();
    const target = topmostElementAtPoint(elements, point, 8 / appState.zoom.value);
    if (!target) return;
    const textContainer = target.type === "text" && target.containerId
      ? elements.find((element) => element.id === target.containerId) ?? null
      : null;
    const link = target.link ?? textContainer?.link;
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      openCanvasLink(link);
      return;
    }
    const selectionTarget = existingTextSelectionTarget(target, textContainer, elements);
    if (!selectionTarget) return;
    clearImageFocus();
    api.setActiveTool({ type: "selection" });
    api.updateScene({
      appState: {
        editingGroupId: null,
        selectedElementIds: { [selectionTarget.id]: true },
        selectedGroupIds: {},
        selectedLinearElement: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    onToolChange("selection");
  }, [activeTool, api, clearImageFocus, onToolChange, openCanvasLink]);

  const handleCanvasLinkOpen: NonNullable<ExcalidrawProps["onLinkOpen"]> = useCallback((element, event) => {
    event.preventDefault();
    if (!element.link) return;
    openCanvasLink(element.link);
  }, [openCanvasLink]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable='true'], form")) return;
      if (event.key === "Escape" && focusedElementIds.current.length > 0) clearImageFocus();
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [clearImageFocus]);

  const calculateImageTransform = useCallback((drag: ImageTransformDrag, clientX: number, clientY: number, snapRotation: boolean) => {
    if (!api) return;
    const pointerAngle = Math.atan2(clientY - drag.centerViewport.y, clientX - drag.centerViewport.x);
    const angle = drag.startElement.angle + pointerAngle - drag.startPointerAngle;
    const nextAngle = snapImageRotation(angle, snapRotation);
    return { angle: nextAngle, deltaAngle: nextAngle - drag.startElement.angle };
  }, [api]);

  const updateImagePreview = useCallback((drag: ImageTransformDrag, clientX: number, clientY: number, snapRotation: boolean) => {
    if (!api || !rootRef.current) return;
    const zoom = api.getAppState().zoom.value;
    const rootBounds = rootRef.current.getBoundingClientRect();
    const updates = calculateImageTransform(drag, clientX, clientY, snapRotation);
    if (!updates) return;

    setImageTransformPreview({
      angle: updates.angle,
      centerX: drag.centerViewport.x - rootBounds.left,
      centerY: drag.centerViewport.y - rootBounds.top,
      height: drag.startElement.height * zoom,
      width: drag.startElement.width * zoom,
    });
  }, [api, calculateImageTransform]);

  const commitImageTransform = useCallback((drag: ImageTransformDrag, clientX: number, clientY: number, snapRotation: boolean) => {
    if (!api) return;
    const elements = api.getSceneElements();
    const image = elements.find((element) => element.id === drag.imageId);
    const updates = calculateImageTransform(drag, clientX, clientY, snapRotation);
    if (!image || image.type !== "image" || !updates) return;

    const startElements = new Map(drag.startElements.map((element) => [element.id, element]));
    api.updateScene({
      elements: elements.map((element) => {
        const startElement = startElements.get(element.id);
        if (!startElement) return element;
        const startCenter = {
          x: startElement.x + startElement.width / 2,
          y: startElement.y + startElement.height / 2,
        };
        const rotatedCenter = rotateAroundCenter(startCenter, drag.centerScene, updates.deltaAngle);
        return newElementWith(startElement, {
          angle: startElement.angle + updates.deltaAngle,
          x: startElement.x + rotatedCenter.x - startCenter.x,
          y: startElement.y + rotatedCenter.y - startCenter.y,
        });
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  }, [api, calculateImageTransform]);

  useEffect(() => {
    const continueImageTransform = (event: PointerEvent) => {
      const drag = imageTransformDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      updateImagePreview(drag, event.clientX, event.clientY, event.shiftKey);
    };

    const finishImageTransform = (event: PointerEvent) => {
      const drag = imageTransformDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const dragDistance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (dragDistance >= transformDragThreshold) {
        commitImageTransform(drag, event.clientX, event.clientY, event.shiftKey);
      }
      imageTransformDrag.current = null;
      setImageTransformPreview(null);
    };

    const cancelImageTransform = (event: PointerEvent) => {
      const drag = imageTransformDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      imageTransformDrag.current = null;
      setImageTransformPreview(null);
    };

    window.addEventListener("pointermove", continueImageTransform, true);
    window.addEventListener("pointerup", finishImageTransform, true);
    window.addEventListener("pointercancel", cancelImageTransform, true);
    return () => {
      window.removeEventListener("pointermove", continueImageTransform, true);
      window.removeEventListener("pointerup", finishImageTransform, true);
      window.removeEventListener("pointercancel", cancelImageTransform, true);
    };
  }, [commitImageTransform, updateImagePreview]);

  useEffect(() => {
    if (imageControls) return;
    imageTransformDrag.current = null;
    setImageTransformPreview(null);
  }, [imageControls]);

  useEffect(() => {
    setTextColorMenuOpen(false);
    setTextFontMenuOpen(false);
    setTextVerticalMenuOpen(false);
    setTextToolbarPosition(null);
    setTextFormattingExpanded(false);
  }, [textFormattingContext?.elementId]);

  useLayoutEffect(() => {
    if (!editingTextId || !rootRef.current) {
      setTextEditorBounds(null);
      return;
    }
    const root = rootRef.current;
    let resizeObserver: ResizeObserver | null = null;
    const attach = () => {
      const editor = root.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
      if (!editor) return;
      mutationObserver.disconnect();
      const measure = () => {
        const { left, top, width, height } = editor.getBoundingClientRect();
        setTextEditorBounds(previous => previous?.elementId === editingTextId && previous.left === left
          && previous.top === top && previous.width === width && previous.height === height
          ? previous : { elementId: editingTextId, left, top, width, height });
      };
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(editor);
      resizeObserver.observe(root);
      measure();
    };
    const mutationObserver = new MutationObserver(attach);
    mutationObserver.observe(root, { childList: true, subtree: true });
    attach();
    return () => { mutationObserver.disconnect(); resizeObserver?.disconnect(); };
  }, [editingTextId, textFormattingContext?.x, textFormattingContext?.y]);

  const startTextToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!textFormattingContext || !rootRef.current) return;
    const toolbar = event.currentTarget.closest<HTMLElement>(".context-formatting-toolbar");
    const rootBounds = rootRef.current.getBoundingClientRect();
    const toolbarBounds = toolbar?.getBoundingClientRect();
    if (!toolbarBounds) return;
    event.preventDefault();
    event.stopPropagation();
    const x = textToolbarPosition?.x ?? toolbarBounds.left - rootBounds.left;
    const y = textToolbarPosition?.y ?? toolbarBounds.top - rootBounds.top;
    textToolbarDrag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setTextToolbarPosition({ x, y });
  }, [textFormattingContext, textToolbarPosition]);

  const continueTextToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = textToolbarDrag.current;
    const root = rootRef.current;
    if (!drag || !root || drag.pointerId !== event.pointerId) return;
    const toolbar = event.currentTarget.closest<HTMLElement>(".context-formatting-toolbar");
    const rootBounds = root.getBoundingClientRect();
    const width = toolbar?.offsetWidth ?? textFormattingToolbarWidth;
    const height = toolbar?.offsetHeight ?? textFormattingToolbarHeight;
    setTextToolbarPosition({
      x: Math.max(contextFormattingToolbarViewportInset, Math.min(rootBounds.width - width - contextFormattingToolbarViewportInset, drag.x + event.clientX - drag.startX)),
      y: Math.max(contextFormattingToolbarViewportInset, Math.min(rootBounds.height - height - 84 - contextFormattingToolbarViewportInset, drag.y + event.clientY - drag.startY)),
    });
  }, []);

  const finishTextToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (textToolbarDrag.current?.pointerId !== event.pointerId) return;
    textToolbarDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg")?.focus());
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const { width, height } = root.getBoundingClientRect();
      setShapeToolbarViewport(previous => previous.width === width && previous.height === height ? previous : { width, height });
      setShapeToolbarPosition(previous => previous
        ? clampShapeToolbarPosition(previous, { width, height }, shapeToolbarFloatingCompact ? shapeToolbarSideSize : shapeToolbarHorizontalSize)
        : null);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [shapeToolbarFloatingCompact]);

  useEffect(() => {
    shapeToolbarDrag.current = null;
    setShapeToolbarPosition(null);
    setShapeToolbarDock(null);
    setShapeToolbarDockPreview(null);
    setShapeToolbarFloatingCompact(false);
    setShapeToolbarDragging(false);
  }, [lessonId]);

  const startShapeToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const root = rootRef.current;
    const toolbar = event.currentTarget.closest<HTMLElement>(".context-formatting-toolbar.is-shape");
    if (!root || !toolbar) return;
    const rootBounds = root.getBoundingClientRect();
    const bounds = toolbar.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    shapeToolbarDrag.current = {
      pointerId: event.pointerId, startClientX: event.clientX, startClientY: event.clientY,
      x: bounds.left - rootBounds.left, y: bounds.top - rootBounds.top,
      compact: Boolean(shapeToolbarDock?.side === "left" || shapeToolbarDock?.side === "right" || shapeToolbarFloatingCompact),
      moved: false, candidate: null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [shapeToolbarDock, shapeToolbarFloatingCompact]);

  const continueShapeToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = shapeToolbarDrag.current;
    const root = rootRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !root) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - drag.startClientX, dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      setShapeToolbarDragging(true);
      setShapeToolbarDock(null);
      setShapeToolbarFloatingCompact(drag.compact);
    }
    const rootBounds = root.getBoundingClientRect();
    const viewport = { width: rootBounds.width, height: rootBounds.height };
    const position = clampShapeToolbarPosition({ x: drag.x + dx, y: drag.y + dy }, viewport,
      drag.compact ? shapeToolbarSideSize : shapeToolbarHorizontalSize);
    drag.candidate = shapeToolbarDockAt({ x: event.clientX - rootBounds.left, y: event.clientY - rootBounds.top }, viewport, drag.candidate);
    setShapeToolbarPosition(position);
    setShapeToolbarDockPreview(previous => previous?.side === drag.candidate?.side && previous?.align === drag.candidate?.align ? previous : drag.candidate);
  }, []);

  const finishShapeToolbarDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = shapeToolbarDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    shapeToolbarDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setShapeToolbarDragging(false);
    setShapeToolbarDockPreview(null);
    if (drag.moved && drag.candidate && event.type === "pointerup") {
      setShapeToolbarDock(drag.candidate);
      setShapeToolbarPosition(null);
      setShapeToolbarFloatingCompact(false);
    }
  }, []);

  const keepTextEditorFocused = useCallback((selection?: { elementId: string; start: number; end: number; direction: "forward" | "backward" | "none" }) => {
    window.requestAnimationFrame(() => {
      if (selection && api?.getAppState().editingTextElement?.id !== selection.elementId) return;
      const editor = rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
      editor?.focus();
      if (editor && selection) editor.setSelectionRange(selection.start, selection.end, selection.direction);
    });
  }, [api]);

  const editActiveText = useCallback(() => {
    if (!api || !textFormattingContext) return;
    if (api.getAppState().editingTextElement?.id === textFormattingContext.elementId) {
      keepTextEditorFocused();
      return;
    }
    dispatchCanvasKeyboardCommand(rootRef.current, { code: "Enter", key: "Enter" });
  }, [api, keepTextEditorFocused, textFormattingContext]);

  const toggleTextFormatting = useCallback(() => {
    setTextFormattingExpanded(expanded => !expanded);
    setTextColorMenuOpen(false);
    setTextFontMenuOpen(false);
    setTextVerticalMenuOpen(false);
    keepTextEditorFocused();
  }, [keepTextEditorFocused]);

  const applyRichTextFormatting = useCallback((action:
    | { kind: "style"; style: Partial<RichTextStyle> }
    | { kind: "align"; align: "left" | "center" | "right" }
    | { kind: "toggle"; mark: "italic" | "underline" | "strike" },
  ): boolean => {
    if (!api || !textFormattingContext) return false;
    const elements = api.getSceneElements();
    const textElement = elements.find(element => element.id === textFormattingContext.elementId);
    if (textElement?.type !== "text") return false;
    const editor = rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
    const editingThisText = api.getAppState().editingTextElement?.id === textElement.id && Boolean(editor);
    const value = editingThisText ? editor!.value : textElement.originalText ?? textElement.text;
    const selection = editingThisText ? { elementId: textElement.id, start: editor!.selectionStart, end: editor!.selectionEnd, direction: editor!.selectionDirection } : undefined;
    const hasTextSelection = editingThisText && editor!.selectionEnd > editor!.selectionStart;
    const start = hasTextSelection ? editor!.selectionStart : 0;
    const end = hasTextSelection ? editor!.selectionEnd : value.length;
    const partial = editingThisText && end > start && (start !== 0 || end !== value.length);
    const current = richTextOf(textElement);
    if (!current && !partial && action.kind !== "toggle") return false;
    let next = current ?? richTextFromNative(textElement);
    if (next.text !== value) next = rebaseRichText(next, value);
    if (action.kind === "style") next = styleRichText(next, start, end, action.style);
    else if (action.kind === "align") next = alignRichText(next, hasTextSelection ? start : 0, hasTextSelection ? end : 0, action.align);
    else {
      const selectedRuns = next.runs.filter(run => run.start < end && run.end > start);
      const enabled = selectedRuns.length > 0 && selectedRuns.every(run => run.style[action.mark]);
      next = styleRichText(next, start, end, { [action.mark]: !enabled });
    }
    const updatedText = newElementWith(textElement, {
      customData: { ...textElement.customData, richText: next },
      strokeColor: "transparent",
    });
    try {
      const scene = reconcileRichTextScene(elements.map(element => element.id === updatedText.id ? updatedText : element), editingThisText ? updatedText.id : null);
      api.addFiles(scene.files.filter(file => !api.getFiles()[file.id]));
      api.updateScene({
        elements: scene.elements,
        ...(editingThisText ? { appState: { editingTextElement: updatedText } } : {}),
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      if (editingThisText) keepTextEditorFocused(selection);
      return true;
    } catch (error: unknown) {
      setCanvasActionError(error instanceof Error ? error.message : "Textformatierung fehlgeschlagen.");
      return true;
    }
  }, [api, keepTextEditorFocused, textFormattingContext]);

  const moveActiveText = useCallback((
    drag: TextMoveDrag,
    clientX: number,
    clientY: number,
    captureUpdate: (typeof CaptureUpdateAction)[keyof typeof CaptureUpdateAction],
  ) => {
    if (!api) return;
    const nextTextElement = newElementWith(drag.startElement, {
      x: drag.startElement.x + (clientX - drag.startClientX) / drag.zoom,
      y: drag.startElement.y + (clientY - drag.startClientY) / drag.zoom,
    });
    api.updateScene({
      elements: api.getSceneElements().map((element) => (
        element.id === drag.elementId ? nextTextElement : element
      )),
      appState: { editingTextElement: nextTextElement },
      captureUpdate,
    });
  }, [api]);

  const startActiveTextMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!api || !textFormattingContext || (event.pointerType === "mouse" && event.button !== 0)) return;
    const textElement = api.getSceneElements().find((element) => (
      element.id === textFormattingContext.elementId && element.type === "text"
    ));
    if (!textElement || textElement.type !== "text") return;

    event.preventDefault();
    event.stopPropagation();
    setTextColorMenuOpen(false);
    textMoveDrag.current = {
      elementId: textElement.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElement: textElement,
      zoom: api.getAppState().zoom.value,
    };
    setMovingTextId(textElement.id);
  }, [api, textFormattingContext]);

  useEffect(() => {
    const continueTextMove = (event: PointerEvent) => {
      const drag = textMoveDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      moveActiveText(drag, event.clientX, event.clientY, CaptureUpdateAction.NEVER);
    };

    const finishTextMove = (event: PointerEvent) => {
      const drag = textMoveDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const dragDistance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (dragDistance >= transformDragThreshold) {
        moveActiveText(drag, event.clientX, event.clientY, CaptureUpdateAction.IMMEDIATELY);
      }
      textMoveDrag.current = null;
      setMovingTextId(null);
      keepTextEditorFocused();
    };

    const cancelTextMove = (event: PointerEvent) => {
      const drag = textMoveDrag.current;
      if (!drag || drag.pointerId !== event.pointerId || !api) return;
      event.preventDefault();
      event.stopPropagation();
      api.updateScene({
        elements: api.getSceneElements().map((element) => (
          element.id === drag.elementId ? drag.startElement : element
        )),
        appState: { editingTextElement: drag.startElement },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      textMoveDrag.current = null;
      setMovingTextId(null);
      keepTextEditorFocused();
    };

    window.addEventListener("pointermove", continueTextMove, true);
    window.addEventListener("pointerup", finishTextMove, true);
    window.addEventListener("pointercancel", cancelTextMove, true);
    return () => {
      window.removeEventListener("pointermove", continueTextMove, true);
      window.removeEventListener("pointerup", finishTextMove, true);
      window.removeEventListener("pointercancel", cancelTextMove, true);
    };
  }, [api, keepTextEditorFocused, moveActiveText]);

  useEffect(() => {
    if (textFormattingContext) return;
    textMoveDrag.current = null;
    setMovingTextId(null);
  }, [textFormattingContext]);

  const setActiveTextSize = useCallback((fontSize: number) => {
    if (!api || !textFormattingContext) return;
    if (applyRichTextFormatting({ kind: "style", style: { fontSize } })) return;
    const elements = api.getSceneElements();
    const textElement = elements.find((element) => (
      element.id === textFormattingContext.elementId && element.type === "text"
    ));
    if (!textElement || textElement.type !== "text" || textElement.fontSize === fontSize) return;

    const scale = fontSize / textElement.fontSize;
    const nextWidth = Math.max(1, textElement.width * scale);
    const nextHeight = Math.max(1, textElement.height * scale);
    const horizontalOffset = textElement.textAlign === "center"
      ? (textElement.width - nextWidth) / 2
      : textElement.textAlign === "right"
        ? textElement.width - nextWidth
        : 0;
    const nextTextElement = newElementWith(textElement, {
      fontSize,
      height: nextHeight,
      width: nextWidth,
      x: textElement.x + horizontalOffset,
    });
    api.updateScene({
      elements: elements.map((element) => element.id === nextTextElement.id ? nextTextElement : element),
      appState: {
        currentItemFontSize: fontSize,
        editingTextElement: api.getAppState().editingTextElement?.id === nextTextElement.id ? nextTextElement : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    keepTextEditorFocused();
  }, [api, applyRichTextFormatting, keepTextEditorFocused, textFormattingContext]);

  const setActiveTextFont = useCallback((option: TextFontOption) => {
    if (!api || !textFormattingContext) return;
    if (applyRichTextFormatting({ kind: "style", style: { fontFamily: option.value } })) return;
    const elements = api.getSceneElements();
    const textElement = elements.find((element) => (
      element.id === textFormattingContext.elementId && element.type === "text"
    ));
    if (!textElement || textElement.type !== "text" || textElement.fontFamily === option.value) return;

    const nextTextElement = newElementWith(textElement, {
      fontFamily: option.value,
      lineHeight: option.lineHeight,
    });
    api.updateScene({
      elements: elements.map((element) => element.id === nextTextElement.id ? nextTextElement : element),
      appState: {
        currentItemFontFamily: option.value,
        editingTextElement: api.getAppState().editingTextElement?.id === nextTextElement.id ? nextTextElement : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    window.requestAnimationFrame(() => {
      const editor = rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
      editor?.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
      editor?.focus();
    });
  }, [api, applyRichTextFormatting, textFormattingContext]);

  const setActiveTextAlign = useCallback((textAlign: TextAlign) => {
    if (!api || !textFormattingContext) return;
    if (textAlign === "left" || textAlign === "center" || textAlign === "right") {
      if (applyRichTextFormatting({ kind: "align", align: textAlign })) return;
    }
    const elements = api.getSceneElements();
    const textElement = elements.find((element) => (
      element.id === textFormattingContext.elementId && element.type === "text"
    ));
    if (!textElement || textElement.type !== "text" || textElement.textAlign === textAlign) return;

    const nextTextElement = newElementWith(textElement, { textAlign });
    api.updateScene({
      elements: elements.map((element) => element.id === nextTextElement.id ? nextTextElement : element),
      appState: {
        currentItemTextAlign: textAlign,
        editingTextElement: api.getAppState().editingTextElement?.id === nextTextElement.id ? nextTextElement : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    keepTextEditorFocused();
  }, [api, applyRichTextFormatting, keepTextEditorFocused, textFormattingContext]);

  const setActiveTextVerticalAlign = useCallback((verticalAlign: BoundTextVerticalAlign) => {
    setTextVerticalMenuOpen(false);
    if (!api || !textFormattingContext?.containerId) return;
    const elements = api.getSceneElements();
    const text = elements.find(element => element.id === textFormattingContext.elementId);
    const container = elements.find(element => element.id === textFormattingContext.containerId);
    if (text?.type !== "text" || !container || !["rectangle", "ellipse", "diamond"].includes(container.type)) return;
    const y = boundTextY(container, text.height, verticalAlign);
    if (text.verticalAlign === verticalAlign && Math.abs(text.y - y) < 0.01) return;
    const updated = newElementWith(text, {
      verticalAlign,
      y,
      ...(richTextOf(text) ? { customData: { ...text.customData, richTextVerticalAnchorV1: true } } : {}),
    });
    const nextElements = elements.map(element => element.id === text.id ? updated : element);
    const editingThisText = api.getAppState().editingTextElement?.id === text.id;
    const scene = richTextOf(updated)
      ? reconcileRichTextScene(nextElements, editingThisText ? text.id : null)
      : { elements: nextElements, files: [] };
    api.addFiles(scene.files.filter(file => !api.getFiles()[file.id]));
    api.updateScene({
      elements: scene.elements,
      ...(editingThisText ? { appState: { editingTextElement: updated } } : {}),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    keepTextEditorFocused();
  }, [api, keepTextEditorFocused, textFormattingContext]);

  const setActiveTextColor = useCallback((strokeColor: string) => {
    setTextColorMenuOpen(false);
    if (!api || !textFormattingContext) return;
    if (applyRichTextFormatting({ kind: "style", style: { color: strokeColor } })) return;
    const elements = api.getSceneElements();
    const textElement = elements.find((element) => (
      element.id === textFormattingContext.elementId && element.type === "text"
    ));
    if (!textElement || textElement.type !== "text") return;
    if (textElement.strokeColor === strokeColor) {
      keepTextEditorFocused();
      return;
    }

    const nextTextElement = newElementWith(textElement, { strokeColor });
    api.updateScene({
      elements: elements.map((element) => element.id === nextTextElement.id ? nextTextElement : element),
      appState: {
        currentItemStrokeColor: strokeColor,
        editingTextElement: api.getAppState().editingTextElement?.id === nextTextElement.id ? nextTextElement : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    keepTextEditorFocused();
  }, [api, applyRichTextFormatting, keepTextEditorFocused, textFormattingContext]);

  const toggleActiveTextBullets = useCallback(() => {
    const editor = rootRef.current?.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg");
    if (!editor) return;
    const transformed = transformBulletedLines(editor.value, editor.selectionStart, editor.selectionEnd);
    editor.setRangeText(
      transformed.replacement,
      transformed.blockStart,
      transformed.blockEnd,
      "select",
    );
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    editor.focus();
  }, []);

  const setActiveShapeFill = useCallback((fillMode: ShapeFillMode) => {
    if (!api || !shapeFormattingContext) return;
    const elements = api.getSceneElements();
    const shapeElement = elements.find((element) => (
      element.id === shapeFormattingContext.elementId && isBasicShapeElement(element)
    ));
    if (!shapeElement) return;

    const color = shapeFormattingContext.color;
    const backgroundColor = shapeBackgroundColor(fillMode, color);
    if (shapeElement.strokeColor === color && shapeElement.backgroundColor === backgroundColor && shapeElement.fillStyle === "solid" && shapeElement.roughness === 0) return;
    const nextShapeElement = newElementWith(shapeElement, {
      backgroundColor,
      fillStyle: "solid",
      roughness: 0,
      strokeColor: color,
    });
    api.updateScene({
      elements: elements.map((element) => element.id === nextShapeElement.id ? nextShapeElement : element),
      appState: {
        currentItemBackgroundColor: backgroundColor,
        currentItemFillStyle: "solid",
        currentItemStrokeColor: color,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    onShapeColorChange(color);
    onShapeFillChange(fillMode);
  }, [api, onShapeColorChange, onShapeFillChange, shapeFormattingContext]);

  const setActiveShapeColor = useCallback((color: string) => {
    if (!api || !shapeFormattingContext) return;
    const elements = api.getSceneElements();
    const shapeElement = elements.find((element) => (
      element.id === shapeFormattingContext.elementId && isBasicShapeElement(element)
    ));
    if (!shapeElement) return;

    const backgroundColor = shapeBackgroundColor(shapeFormattingContext.fillMode, color);
    if (shapeElement.strokeColor === color && shapeElement.backgroundColor === backgroundColor && shapeElement.fillStyle === "solid" && shapeElement.roughness === 0) return;
    const nextShapeElement = newElementWith(shapeElement, {
      backgroundColor,
      fillStyle: "solid",
      roughness: 0,
      strokeColor: color,
    });
    api.updateScene({
      elements: elements.map((element) => element.id === nextShapeElement.id ? nextShapeElement : element),
      appState: {
        currentItemBackgroundColor: backgroundColor,
        currentItemFillStyle: "solid",
        currentItemStrokeColor: color,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    onShapeColorChange(color);
  }, [api, onShapeColorChange, shapeFormattingContext]);

  const port = useMemo<CanvasPort | null>(() => {
    if (!api) return null;

    const flushPersistence = async () => {
      if (persistenceTimer.current !== null) { window.clearTimeout(persistenceTimer.current); persistenceTimer.current = null; }
      const a = api.getAppState();
      if (a.isLoading) throw new Error(t("Canvas ist noch nicht geladen."));
      const snapshot: StoredCanvasSnapshot = {schemaVersion:1,elements:api.getSceneElementsIncludingDeleted(),clips:clipsRef.current,
        interactiveHtmlStates:interactiveHtmlStatesRef.current,viewport:{scrollX:a.scrollX,scrollY:a.scrollY,zoom:a.zoom}};
      latestSnapshot.current = snapshot;
      await saveCanvasSnapshot(lessonId,snapshot);
      await flushFileCanvasSnapshot(lessonId);
    };
    const agent = createCanvasAgent({api, theme, flush:flushPersistence,
      persistence:() => ({...fileCanvasSaveStatus(lessonId),pending:fileCanvasSaveStatus(lessonId).pending || persistenceTimer.current !== null}),
      active:() => agentActive.current && committedAgentPort.current === port,
      busy:() => { const state=api.getAppState(); return Boolean(state.isLoading || state.editingTextElement || state.newElement
        || state.selectedElementsAreBeingDragged || state.isResizing || state.isRotating || inkPreviewId.current
        || pageTransformActive.current || textBoxTransformActive.current || imageCoverDrag.current || materialBundleMoveDrag.current
        || imageTransformDrag.current || textMoveDrag.current || projectedMediaMoveDrag.current || annotationMoveDrag.current
        || imageCropSelectionDrag.current || rootRef.current?.querySelector("textarea:focus, input:focus, [contenteditable=true]:focus")); },
      getClips:() => clipsRef.current, getHtmlState:() => interactiveHtmlStatesRef.current,
      commitClips:next => {if(!agentClipCommit.current)throw new Error(t("Clipsteuerung noch nicht bereit.")); agentClipCommit.current(next);},
      buildMaterial:(material:AgentMaterial,x,y) => {
        switch(material.kind){
          case 'audio':return [createAudioElement(material.asset,x,y)];
          case 'video':return [createVideoElement(material.asset,x,y)];
          case 'youtube':return [createYouTubeElement(material.asset,x,y)];
          case 'link':return [...createCanvasLinkElements(material.asset,x,y,theme)];
          case 'images':return createImageElements(material.assets,x,y);
          case 'interactive':{const a=material.asset;const size=a.print?.layout==='shared-pages'?htmlPagePlacement(a.print.orientation):getInteractiveHtmlPlacementSize(a.defaultViewport,a.print);return [createInteractiveHtmlElement(a,x,y,size)];}
        }
      },
      saveMaterials:async materials => {
        const files:BinaryFileData[]=materials.flatMap(m=>m.kind==='images'?m.assets.map(a=>({created:Date.now(),dataURL:a.dataUrl as DataURL,id:a.id as FileId,mimeType:a.mimeType})):[]);
        if(files.length){await saveCanvasFiles(lessonId,files);api.addFiles(files);}
      },
    });
    return {
      inspectAgentCanvas:agent.inspect,
      executeAgentCommand:agent.execute,
      selectTool: (tool, context) => applyTool(api, tool, context),
      rotateSelection: (direction) => {
        const elements = api.getSceneElements();
        const appState = api.getAppState();
        const explicitlySelectedIds = new Set(Object.keys(appState.selectedElementIds).filter((id) => (
          appState.selectedElementIds[id]
        )));
        if (explicitlySelectedIds.size === 0) return;

        const rotationIds = new Set(explicitlySelectedIds);
        for (const element of elements) {
          if (explicitlySelectedIds.has(element.id)) {
            for (const binding of element.boundElements ?? []) {
              if (binding.type === "text") rotationIds.add(binding.id);
            }
          }
          if (element.type === "text" && element.containerId && explicitlySelectedIds.has(element.containerId)) {
            rotationIds.add(element.id);
          }
        }
        const rotationElements = elements.filter((element) => (
          !element.isDeleted && !element.locked && rotationIds.has(element.id)
        ));
        if (rotationElements.length === 0) return;

        const [minimumX, minimumY, maximumX, maximumY] = getCommonBounds(rotationElements);
        const selectionCenter = {
          x: (minimumX + maximumX) / 2,
          y: (minimumY + maximumY) / 2,
        };
        api.updateScene({
          elements: elements.map((element) => {
            if (!rotationIds.has(element.id) || element.isDeleted || element.locked) return element;
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            return newElementWith(element, rotateElementAroundSelectionCenter({
              angle: element.angle,
              center: selectionCenter,
              direction,
              elementCenter: { x: centerX, y: centerY },
              x: element.x,
              y: element.y,
            }));
          }),
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      },
      placeImages: async (assets, point) => {
        if (assets.length === 0) return;
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const binaryFiles: BinaryFileData[] = assets.map((asset) => ({
          created: Date.now(),
          dataURL: asset.dataUrl as DataURL,
          id: asset.id as FileId,
          mimeType: asset.mimeType,
        }));
        await saveCanvasFiles(lessonId, binaryFiles);
        api.addFiles(binaryFiles);

        const imageElements = createImageElements(assets, anchor.x - displaySize(assets[0]).width / 2, anchor.y, true);
        api.updateScene({
          elements: prepareCanvasAnnotationGroups([...api.getSceneElements(), ...imageElements]).elements,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      },
      placeTimer: point => {
        clearImageFocus();
        void timerSound.activate();
        const appState = api.getAppState();
        const bounds = rootRef.current?.getBoundingClientRect();
        const anchor = viewportCoordsToSceneCoords(point ?? {
          clientX: bounds ? bounds.left + bounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: bounds ? bounds.top + bounds.height / 2 : appState.offsetTop + appState.height / 2,
        }, appState);
        const [element] = convertToExcalidrawElements([{ type: "rectangle", x: anchor.x - timerWidth / 2, y: anchor.y - timerHeight / 2,
          width: timerWidth, height: timerHeight, backgroundColor: "transparent", strokeColor: "transparent", strokeWidth: 0,
          roughness: 0, roundness: null, fillStyle: "solid" }]);
        const timer = { ...element, customData: { surfaceKind: "timer-widget", timerDurationSeconds: defaultTimerDuration, timerSoundEnabled: false } };
        api.setActiveTool({ type: "selection" });
        api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), timer], appState: { selectedElementIds: { [timer.id]: true } },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        onToolChangeRef.current("selection");
      },
      placeAudio: (asset, point) => {
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const audioElement = createAudioElement(
          asset,
          anchor.x - audioPlayerWidth / 2,
          anchor.y - audioPlayerHeight / 2,
        );
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), audioElement],
          appState: {
            selectedElementIds: { [audioElement.id]: true },
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      placeVideo: (asset, point) => {
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const videoElement = createVideoElement(
          asset,
          anchor.x - videoPlayerWidth / 2,
          anchor.y - videoPlayerHeight / 2,
        );
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), videoElement],
          appState: {
            selectedElementIds: { [videoElement.id]: true },
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      placeInteractiveHtml: (asset, point) => {
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const size = asset.print?.layout === "shared-pages" ? htmlPagePlacement(asset.print.orientation) : getInteractiveHtmlPlacementSize(asset.defaultViewport, asset.print);
        const interactiveElement = createInteractiveHtmlElement(
          asset,
          anchor.x - size.width / 2,
          anchor.y - size.height / 2,
          size,
        );
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), interactiveElement],
          appState: {
            selectedElementIds: { [interactiveElement.id]: true },
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      placeEmbeddedApp: (appId, point) => {
        const app = embeddedAppById(appId);
        if (!app) {
          setCanvasActionError("Diese App ist nicht für Tafelraum freigegeben.");
          return;
        }
        clearImageFocus();
        setCanvasActionError(null);
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const appElement = createEmbeddedAppElement(
          app.id,
          anchor.x - app.defaultViewport.width / 2,
          anchor.y - app.defaultViewport.height / 2,
          app.defaultViewport.width,
          app.defaultViewport.height,
        );
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), appElement],
          appState: { selectedElementIds: { [appElement.id]: true } },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      placeLink: (link, point) => {
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const initialElements = createCanvasLinkElements(link, anchor.x, anchor.y, theme);
        const [linkElement] = initialElements;
        const offsetX = linkElement.width / 2;
        const offsetY = linkElement.height / 2;
        const linkElements = initialElements.map((element) => newElementWith(element, {
          x: element.x - offsetX,
          y: element.y - offsetY,
        }));
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), ...linkElements],
          appState: {
            selectedElementIds: { [linkElement.id]: true },
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      placeYouTube: (asset, point) => {
        clearImageFocus();
        const appState = api.getAppState();
        const rootBounds = rootRef.current?.getBoundingClientRect();
        const viewportPoint = point ?? {
          clientX: rootBounds ? rootBounds.left + rootBounds.width / 2 : appState.offsetLeft + appState.width / 2,
          clientY: rootBounds ? rootBounds.top + rootBounds.height / 2 : appState.offsetTop + appState.height / 2,
        };
        const anchor = viewportCoordsToSceneCoords(viewportPoint, appState);
        const youtubeElement = createYouTubeElement(
          asset,
          anchor.x - youtubePlayerWidth / 2,
          anchor.y - youtubePlayerHeight / 2,
        );
        api.setActiveTool({ type: "selection" });
        api.updateScene({
          elements: [...api.getSceneElements(), youtubeElement],
          appState: {
            selectedElementIds: { [youtubeElement.id]: true },
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        onToolChangeRef.current("selection");
      },
      applyArchiveMaterialRemovals: async (removals) => {
        if (JSON.stringify(removedArchiveMaterials.current) === JSON.stringify(removals)) return;
        removedArchiveMaterials.current = removals;
        // Refresh the archive revision after the server's board cleanup before the next save.
        await loadFileCanvasSnapshot(lessonId);
        const cleaned = pruneRemovedMaterials({elements: api.getSceneElementsIncludingDeleted(), clips: clipsRef.current,
          interactiveHtmlStates: interactiveHtmlStatesRef.current}, removals, lessonId);
        for (const clip of clipsRef.current) if (!cleaned.clips.some(next => next.id === clip.id)) archiveRemovalClipControls.current?.removed(clip);
        clipsRef.current = cleaned.clips;
        setClips(cleaned.clips);
        interactiveHtmlStatesRef.current = cleaned.interactiveHtmlStates;
        setInteractiveHtmlStateVersion(version => version + 1);
        if (latestSnapshot.current) latestSnapshot.current = {...latestSnapshot.current, ...cleaned};
        const keptIds = new Set(cleaned.elements.map(element => element.id));
        const appState = api.getAppState();
        api.updateScene({elements: cleaned.elements, appState: {
          selectedElementIds: Object.fromEntries(Object.entries(appState.selectedElementIds).filter(([id]) => keptIds.has(id))),
          editingTextElement: appState.editingTextElement && keptIds.has(appState.editingTextElement.id) ? appState.editingTextElement : null,
        }, captureUpdate: CaptureUpdateAction.NEVER});
        const snapshot = latestSnapshot.current;
        if (snapshot) await saveCanvasSnapshot(lessonId, snapshot);
        await flushFileCanvasSnapshot(lessonId);
      },
      undo: () => dispatchHistoryShortcut(rootRef.current, false),
      redo: () => dispatchHistoryShortcut(rootRef.current, true),
      zoomIn: () => stepZoom(api, rootRef.current, 1),
      zoomOut: () => stepZoom(api, rootRef.current, -1),
      resetZoom: () => setCenteredZoom(api, rootRef.current, 100),
      hasArchiveMaterial: (path, legacyFileName) => archiveMaterialElements(api.getSceneElements(), path, legacyFileName).length > 0,
      focusArchiveMaterial: (path, legacyFileName) => {
        const target = nextArchiveMaterialElement(archiveMaterialElements(api.getSceneElements(), path, legacyFileName), focusedElementIds.current[0] ?? null);
        if (!target) return false;
        focusMaterial(target.id);
        return true;
      },
      fitToContent: () => {
        api.scrollToContent(undefined, {
          fitToContent: true,
          animate: true,
          duration: 260,
        });
      },
      getUnsavedInteractiveHtmlChangeCount,
      flushPersistence,
    };
  }, [api, focusMaterial, clearImageFocus, getUnsavedInteractiveHtmlChangeCount, lessonId, theme]);

  // Publish identity only after commit. StrictMode can evaluate useMemo twice;
  // an abandoned render must never invalidate the port actually used by the host.
  useLayoutEffect(() => {
    committedAgentPort.current = port;
    return () => { if (committedAgentPort.current === port) committedAgentPort.current = null; };
  }, [port]);

  useEffect(() => {
    onPortReady(port);
    return () => onPortReady(null);
  }, [onPortReady, port]);

  useEffect(() => {
    if (!api || !richFontSourcesSeen) return;
    setRichFontRevision(0);
    let cancelled = false;
    const refreshRenditions = () => {
      if (cancelled) return;
      clearRichTextRasterCache();
      richFontsReady.current = true;
      setRichFontRevision(revision => revision + 1);
      const editingId = api.getAppState().editingTextElement?.id;
      const scene = reconcileRichTextScene(api.getSceneElements(), richPreviewPaintedId.current === editingId ? editingId : null);
      applyRichTextScene(api,scene,CaptureUpdateAction.NEVER);
    };
    const onFontsLoaded = (event: Event) => {
      const faces = (event as FontFaceSetLoadEvent).fontfaces;
      if (faces?.some(face => /^(Nunito|Excalifont|Comic Shanns)$/i.test(face.family.replaceAll('"', "")))) refreshRenditions();
    };
    // Excalidraw registers its faces after the lesson scene arrives. Loading
    // before that point silently succeeds with a fallback canvas font.
    void (async () => {
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
      await document.fonts.ready;
      await Promise.all(["Nunito", "Excalifont", "Comic Shanns"].flatMap(family => [
        document.fonts.load(`28px "${family}"`),
        document.fonts.load(`italic 28px "${family}"`),
      ]));
      await document.fonts.ready;
      refreshRenditions();
      document.fonts.addEventListener("loadingdone", onFontsLoaded);
    })().catch(error => {
      if (!cancelled) setCanvasActionError(error instanceof Error ? error.message : "Schrift konnte nicht geladen werden.");
    });
    return () => {
      cancelled = true;
      richFontsReady.current = false;
      document.fonts.removeEventListener("loadingdone", onFontsLoaded);
    };
  }, [api, richFontSourcesSeen]);

  useEffect(() => {
    if (!api) return;
    const elements = applyThemeInk(api.getSceneElements(), theme);
    const editing = api.getAppState().editingTextElement;
    const nextEditing = editing && elements.find(element => element.id === editing.id);
    api.updateScene({
      elements,
      appState: { viewBackgroundColor: resolvedCanvasBackgroundColor,
        editingTextElement: nextEditing?.type === "text" ? nextEditing as NonDeleted<ExcalidrawTextElement> : editing },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, [api, resolvedCanvasBackgroundColor, theme]);

  useEffect(() => {
    if (!api) {
      setMaterialShadowFrames([]);
      setShapeShadowFrames([]);
      return;
    }
    const appState = api.getAppState();
    const nextFrames = api.getSceneElements().flatMap((element) => {
      if (element.type !== "image" || element.isDeleted || richTextImageSourceId(element)) return [];
      if (!materialShadows && !element.roundness) return [];
      const frame = getImageAppearanceFrame(element, appState, rootRef.current);
      return frame ? [frame] : [];
    });
    setMaterialShadowFrames((previous) => (
      sameImageAppearanceFrames(previous, nextFrames) ? previous : nextFrames
    ));
    const nextShapeFrames = materialShadows ? getShapeShadowFrames(api.getSceneElements(), appState, rootRef.current) : [];
    setShapeShadowFrames(previous => sameShapeShadowFrames(previous, nextShapeFrames) ? previous : nextShapeFrames);
  }, [api, materialShadows]);

  useEffect(() => {
    port?.selectTool(activeTool, {
      markerColor,
      markerStrokeWidth,
      penColor,
      penStrokeWidth,
      shape: activeShape,
      shapeColor,
      shapeFill,
      theme,
    });
  }, [activeShape, activeTool, markerColor, markerStrokeWidth, penColor, penStrokeWidth, port, shapeColor, shapeFill, theme]);

  useEffect(() => () => {
    if (persistenceTimer.current !== null) window.clearTimeout(persistenceTimer.current);
    persistLatestSnapshot();
  }, [persistLatestSnapshot]);

  const textToolbarPlacement = textFormattingContext && textFormattingExpanded && api
    ? (() => {
      const elements = api.getSceneElements();
      const text = elements.find(element => element.id === textFormattingContext.elementId);
      const container = text?.type === "text" && text.containerId
        ? elements.find(element => element.id === text.containerId) : null;
      return text ? getContextFormattingPosition(container ?? text, api.getAppState(), rootRef.current, textFormattingToolbarWidth, textFormattingToolbarHeight)
        ?? textFormattingContext : textFormattingContext;
    })()
    : textFormattingContext;
  const shapeDockedPosition = shapeToolbarDock && shapeToolbarViewport.width > 0
    ? shapeToolbarDockPosition(shapeToolbarDock, shapeToolbarViewport) : null;
  const shapePreviewPosition = shapeToolbarDockPreview && shapeToolbarViewport.width > 0
    ? shapeToolbarDockPosition(shapeToolbarDockPreview, shapeToolbarViewport) : null;
  const shapeToolbarCompact = shapeToolbarFloatingCompact
    || shapeToolbarDock?.side === "left" || shapeToolbarDock?.side === "right";
  const textQuickActions = textFormattingContext && api
    ? (() => {
      const elements = api.getSceneElements();
      const text = elements.find(element => element.id === textFormattingContext.elementId);
      if (text?.type !== "text") return null;
      const target = text.containerId ? elements.find(element => element.id === text.containerId) ?? text : text;
      const root = rootRef.current;
      const bounds = root?.getBoundingClientRect();
      const toolbarWidth = bounds ? Math.min(textFormattingToolbarWidth, bounds.width - 20) : textFormattingToolbarWidth;
      const paletteObstacle = textFormattingExpanded && textToolbarPlacement && bounds
        ? (() => {
          const left = textToolbarPosition ? textToolbarPosition.x : textToolbarPlacement.x - toolbarWidth / 2;
          const top = textToolbarPosition ? textToolbarPosition.y : textToolbarPlacement.placement === "above"
            ? textToolbarPlacement.y - textFormattingToolbarHeight : textToolbarPlacement.y;
          return [{ left: left - 8, top: top - 8, right: left + toolbarWidth + 8, bottom: top + textFormattingToolbarHeight + 8 }];
        })()
        : [];
      const mainToolbarBounds = root?.ownerDocument.querySelector<HTMLElement>("nav.toolbar")?.getBoundingClientRect();
      const mainToolbarObstacle = bounds && mainToolbarBounds
        ? [{
          left: mainToolbarBounds.left - bounds.left - 8,
          top: mainToolbarBounds.top - bounds.top - 8,
          right: mainToolbarBounds.right - bounds.left + 8,
          bottom: mainToolbarBounds.bottom - bounds.top + 8,
        }]
        : [];
      return getCanvasCoverQuickAction(target, Boolean(getImageCover(elements, target.id)), api.getAppState(), root, 3,
        [...paletteObstacle, ...mainToolbarObstacle], textEditorBounds);
    })()
    : null;

  return (
    <><CanvasRecoveryDialog resolve={recoveryResolver}/><div
      className={`canvas-engine${projectedMediaMoveActive ? " is-material-moving" : ""}${textFormattingContext?.containerId ? " is-editing-bound-text" : ""}${editingRichText ? " is-editing-rich-text" : ""}${simpleMarkerSelection ? " is-simple-marker-selection" : ""}${activeTool === "hand" || spacePanReady ? " is-pan-cursor-ready" : ""}${panCursorDragging ? " is-pan-cursor-dragging" : ""}${projectedMediaZoomModifierActive ? " is-projected-media-zooming" : ""}`}
      ref={rootRef}
      onSelectCapture={() => {
        if (!api) return;
        const appState = api.getAppState();
        const editing = appState.editingTextElement;
        if (editing?.type !== "text") return;
        const current = api.getSceneElements().find(element => element.id === editing.id);
        if (current?.type !== "text") return;
        const container = current.containerId ? api.getSceneElements().find(element => element.id === current.containerId) ?? null : null;
        const next = getTextFormattingContext(current, appState, rootRef.current, container);
        setTextFormattingContext(previous => sameTextFormattingContext(previous, next) ? previous : next);
        setRichEditorSelectionRevision(revision => revision + 1);
      }}
      onClickCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog, .clip-layer, .laser-surface, .rich-text-selection-overlay, .timer-widget"))) handleCanvasClickCapture(event); }}
      onContextMenuCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog, .clip-layer, .laser-surface, .rich-text-selection-overlay, .timer-widget"))) handleCanvasContextMenu(event); }}
      onDoubleClickCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog, .clip-layer, .rich-text-selection-overlay, .timer-widget"))) handleCanvasDoubleClickCapture(event); }}
      onPointerDownCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog, .clip-layer, .laser-surface, .rich-text-selection-overlay, .timer-widget"))) { updateMarkerEraserHit(event, "down"); handleCanvasPointerDownCapture(event); } }}
      data-page-selection={selectedPageId ? "true" : undefined}
      onPointerMoveCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog, .clip-layer, .laser-surface, .rich-text-selection-overlay, .timer-widget"))) { updateMarkerEraserHit(event, "move"); handleCanvasPointerMoveCapture(event); } }}
      onPointerUpCapture={event => { if (!(event.target instanceof Element && event.target.closest(".document-image-dialog"))) updateMarkerEraserHit(event, "up"); }}
      onPointerCancelCapture={() => { markerEraserPointer.current = null; }}
      onPointerLeave={() => {
        if (imageCoverDrag.current) return;
        hoveredImageId.current = null;
        if (selectedImageId.current) return;
        setImageCoverFrame(null);
        setImageQuickActions(null);
      }}
    >
      {api && selectedPageId && <div className="html-page-selection-layer">{interactiveHtmlFrames.filter(frame=>frame.elementId===selectedPageId).map(frame=><HtmlPageSelection key={frame.elementId} api={api} frame={frame} onBusy={active=>{pageTransformActive.current=active;}}/>)}</div>}
      {api && laserControls && <HostPointerOverlay api={api} channel={laserControls.channel} generation={1} enabled local/>}
      {laserControls?.active && <div className="laser-surface" onPointerDown={event=>{event.preventDefault();event.stopPropagation();rootRef.current?.querySelector<HTMLElement>(".excalidraw")?.focus();event.currentTarget.setPointerCapture(event.pointerId);}} onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}} onContextMenu={event=>event.preventDefault()}/>}
      {api && clipControls && <ClipLayer externalCommit={agentClipCommit} api={api} clips={clips} controls={clipControls} onChange={next => {
        clipsRef.current = readClipFrames(next); setClips(clipsRef.current);
        if (latestSnapshot.current) {
          latestSnapshot.current = { ...latestSnapshot.current, clips: clipsRef.current };
          persistLatestSnapshot();
        }
      }}/>}
      <Excalidraw
        autoFocus
        excalidrawAPI={setApi}
        handleKeyboardGlobally
        initialData={initialData}
        langCode={uiLanguageTag()}
        name="Means of transport"
        onChange={handleChange}
        onPaste={data => {
          // The engine reads its tool state immediately after this callback.
          // Commit text defaults before creation, retaining native paste/undo.
          if (api && isExternalTextPaste(data)) flushSync(() => api.updateScene({
            appState: { currentItemStrokeColor: foregroundColor[theme], currentItemOpacity: 100 },
            captureUpdate: CaptureUpdateAction.NEVER,
          }));
          return true;
        }}
        onLinkOpen={handleCanvasLinkOpen}
        theme="light"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
          tools: { image: false },
        }}
      />
      {api && rootRef.current && <TextBoxSelection api={api} root={rootRef.current} scrollOffsets={interactiveHtmlScrollOffsets.current} onError={setCanvasActionError} panReady={spacePanReady} onBusy={active=>{
        if(textBoxTransformActive.current===active)return;
        textBoxTransformActive.current=active;
        if(!active)queueMicrotask(()=>api.updateScene({appState:{selectedElementIds:{...api.getAppState().selectedElementIds}},captureUpdate:CaptureUpdateAction.NEVER}));
      }}/>}
      {richEditorFrame && rootRef.current && <RichTextSelectionOverlay
        element={richEditorFrame.element}
        appState={richEditorFrame.appState}
        root={rootRef.current}
        selectionRevision={richEditorSelectionRevision}
        initialDoubleClick={pendingTextDoubleClick.current}
        onInitialDoubleClickHandled={() => {
          if (pendingTextDoubleClick.current?.textId === richEditorFrame.element.id) pendingTextDoubleClick.current = null;
        }}
        fontRevision={richFontRevision}
        onPreviewPainted={handleRichPreviewPainted}
        onSelectionChange={() => {
          if (!api || !rootRef.current) return;
          const current = api.getSceneElements().find(element => element.id === richEditorFrame.element.id);
          if (current?.type !== "text") return;
          const container = current.containerId ? api.getSceneElements().find(element => element.id === current.containerId) ?? null : null;
          const next = getTextFormattingContext(current, api.getAppState(), rootRef.current, container);
          setTextFormattingContext(previous => sameTextFormattingContext(previous, next) ? previous : next);
        }}
      />}
      {panCursorDragging && <div className="pan-cursor-guard" aria-hidden="true" />}
      {api && <TimerWidgetLayer api={api} runtime={timerRuntime} onMoveStart={startProjectedMediaMove}
        onShow={materialControls?.timerActive?materialControls.showTimer:undefined}
        onContextMenu={handleProjectedMediaContextMenu} onAction={(id, action, revision) => {
          if ((action.type === 'duration' || action.type === 'sound') && timerRuntime.isConfigurationBusy()) {
            setCanvasActionError("Bearbeitung der Fläche zuerst beenden."); return;
          }
          if (!timerRuntime.apply(id, action, revision)) setCanvasActionError("Der Timer wurde inzwischen geändert.");
        }}/>}
      {audioPlayerFrames.length > 0 && (
        <div className="audio-canvas-player-layer">
          {audioPlayerFrames.map((frame) => (
            <AudioCanvasPlayer
              frame={frame}
              key={frame.elementId}
              materialShadow={materialShadows}
              presentedId={materialControls?.activeId}
              onPlayback={materialControls?.playback}
              onContextMenu={handleProjectedMediaContextMenu}
              onMoveStart={startProjectedMediaMove}
            />
          ))}
        </div>
      )}
      {videoPlayerFrames.length > 0 && (
        <div className="local-video-canvas-player-layer">
          {videoPlayerFrames.map((frame) => (
            <VideoCanvasPlayer
              frame={frame}
              key={frame.elementId}
              materialShadow={materialShadows}
              presentedId={materialControls?.mediaId}
              fullscreenControls={materialControls?.fullscreen}
              onPlayback={materialControls?.playback}
              onContextMenu={handleProjectedMediaContextMenu}
              onMoveStart={startProjectedMediaMove}
            />
          ))}
        </div>
      )}
      {interactiveHtmlFrames.length > 0 && (
        <div className="interactive-html-canvas-layer">
          {interactiveHtmlFrames.map((frame) => (
            <InteractiveHtmlCanvasFrame
              annotationDragActive={Boolean(
                projectedAnnotationDragId
                && frame.annotations.some((annotation) => annotation.id === projectedAnnotationDragId)
              )}
              canvasPanActive={activeTool === "hand" || spacePanReady}
              canvasSelectionActive={activeTool === "selection" && !spacePanReady}
              canvasToolActive={interactiveHtmlDefersToCanvasTool(activeTool)}
              frame={frame}
              key={frame.elementId}
              materialShadow={materialShadows}
              onUnlock={(elementId) => {
                api?.updateScene({elements:api.getSceneElements().map(element=>element.id===elementId?newElementWith(element,{locked:false}):element),captureUpdate:CaptureUpdateAction.IMMEDIATELY});
              }}
              onAnnotationPointerDown={startProjectedAnnotationMove}
              onBackgroundPan={routeInteractiveHtmlBackgroundPan}
              onMaterialMove={routeInteractiveHtmlMaterialMove}
              onContextMenu={handleProjectedMediaContextMenu}
              onMoveStart={startProjectedMediaMove}
              onPanWheel={routeInteractiveHtmlWheelPan}
              onScrollChange={rememberInteractiveHtmlScroll}
              onZoomWheel={routeInteractiveHtmlZoom}
            />
          ))}
        </div>
      )}
      {youtubePlayerFrames.length > 0 && (
        <div className="youtube-canvas-player-layer">
          {youtubePlayerFrames.map((frame) => (
            <YouTubeCanvasPlayer
              active={activeYouTubePlayerId === frame.elementId}
              frame={frame}
              key={frame.elementId}
              presentedId={materialControls?.mediaId}
              fullscreenControls={materialControls?.fullscreen}
              onActivate={setActiveYouTubePlayerId}
              onPlayback={materialControls?.playback}
              onContextMenu={handleProjectedMediaContextMenu}
              onMoveStart={startProjectedMediaMove}
            />
          ))}
        </div>
      )}
      {(materialShadowFrames.length > 0 || shapeShadowFrames.length > 0) && (
        <div className="material-shadow-layer" aria-hidden="true">
          {materialShadowFrames.map((frame) => (
            <div
              className={`material-shadow-frame${materialShadows ? " has-material-shadow" : ""}${frame.cornerRadius > 0 ? " has-image-border" : ""}`}
              key={`material-shadow-${frame.elementId}`}
              style={{
                borderRadius: frame.cornerRadius,
                opacity: frame.opacity,
                height: frame.height,
                left: frame.centerX,
                top: frame.centerY,
                transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
                width: frame.width,
              }}
            />
          ))}
          {shapeShadowFrames.map(frame => {
            const filterId = `shape-shadow-filter-${frame.elementId}`;
            return <svg
              className="shape-shadow-frame"
              height={frame.height}
              key={`shape-shadow-${frame.elementId}`}
              style={{
                left: frame.centerX,
                opacity: frame.opacity * (theme === "dark" ? 1 : 0.48),
                top: frame.centerY,
                transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
              }}
              viewBox={`0 0 ${frame.width} ${frame.height}`}
              width={frame.width}
            >
              <defs>
                <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="wide" />
                  <feOffset in="wide" dy="8" result="wideOffset" />
                  <feComponentTransfer in="wideOffset" result="wideAlpha"><feFuncA type="linear" slope="0.34" /></feComponentTransfer>
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="close" />
                  <feOffset in="close" dy="2" result="closeOffset" />
                  <feComponentTransfer in="closeOffset" result="closeAlpha"><feFuncA type="linear" slope="0.24" /></feComponentTransfer>
                  <feMerge result="shadows"><feMergeNode in="wideAlpha" /><feMergeNode in="closeAlpha" /></feMerge>
                  <feComposite in="shadows" in2="SourceAlpha" operator="out" />
                </filter>
              </defs>
              <g fill="black" filter={`url(#${filterId})`}>
                {frame.shapeType === "ellipse"
                  ? <ellipse cx={frame.width / 2} cy={frame.height / 2} rx={frame.width / 2} ry={frame.height / 2} />
                  : frame.shapeType === "diamond"
                    ? <polygon points={`${frame.width / 2},0 ${frame.width},${frame.height / 2} ${frame.width / 2},${frame.height} 0,${frame.height / 2}`} />
                    : <rect width={frame.width} height={frame.height} rx={frame.cornerRadius} ry={frame.cornerRadius} />}
              </g>
            </svg>;
          })}
        </div>
      )}
      {imageCoverFeedback && (
          <div
            className={`image-cover-feedback-frame is-${imageCoverFeedback.mode} from-${imageCoverFeedback.direction}`}
            aria-hidden="true"
            key={`cover-feedback-${imageCoverFeedback.key}`}
            style={{
              height: imageCoverFeedback.cover.height,
              left: imageCoverFeedback.cover.centerX,
              top: imageCoverFeedback.cover.centerY,
              transform: `translate(-50%, -50%) rotate(${imageCoverFeedback.cover.angle}rad)`,
              width: imageCoverFeedback.cover.width,
            }}
          >
            <CoverSweep
              direction={imageCoverFeedback.direction}
              geometry={imageCoverFeedback.cover.geometry}
              mode={imageCoverFeedback.mode === "added" ? "cover" : "reveal"}
            />
          </div>
      )}
      {elementFocusFrames.length > 0 && elementFocusDimPanels !== null && (
        <div className="element-focus-layer element-focus-panel-layer" aria-hidden="true">
          {elementFocusDimPanels.map((panel, index) => (
            <div
              className="element-focus-panel"
              key={`focus-panel-${index}`}
              style={{
                height: panel.height,
                transform: `translate3d(${panel.x}px, ${panel.y}px, 0)`,
                width: panel.width,
              }}
            />
          ))}
        </div>
      )}
      {elementFocusFrames.length > 0 && elementFocusDimPanels === null && (
        <svg className="element-focus-layer" aria-hidden="true">
          <defs>
            <mask id="tafelraum-element-focus-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect className="element-focus-mask-base" width="100%" height="100%"/>
              {elementFocusFrames.map((frame) => (
                <rect
                  className="element-focus-cutout"
                  key={`focus-cutout-${frame.elementId}`}
                  x={frame.centerX - frame.width / 2}
                  y={frame.centerY - frame.height / 2}
                  width={frame.width}
                  height={frame.height}
                  rx={Math.min(10, frame.width / 24, frame.height / 24)}
                  transform={frame.angle === 0
                    ? undefined
                    : `rotate(${frame.angle * 180 / Math.PI} ${frame.centerX} ${frame.centerY})`}
                />
              ))}
            </mask>
          </defs>
          <rect className="element-focus-dim" width="100%" height="100%" mask="url(#tafelraum-element-focus-mask)"/>
        </svg>
      )}
      {projectedMaterialCoverFrames.length > 0 && (
        <div className="projected-material-cover-display-layer" aria-hidden="true">
          {projectedMaterialCoverFrames.map((frame) => (
            <svg
              viewBox={`0 0 ${frame.geometry.width} ${frame.geometry.height}`}
              className="projected-material-cover-display-surface"
              key={`projected-cover-${frame.coverId}`}
              style={{
                height: frame.height,
                left: frame.centerX,
                top: frame.centerY,
                transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
                width: frame.width,
              }}
            >
              <path d={coverSweepPath(frame.geometry)} fill="#3e4854"/>
            </svg>
          ))}
        </div>
      )}
      {imageCoverFrame && elementFocusFrames.length === 0 && (
        <div
          className={`image-cover-controls${imageCoverFrame.isFull ? " is-full" : ""}`}
          aria-label={t("Abdeckung bearbeiten")}
          style={{
            height: imageCoverFrame.height,
            left: imageCoverFrame.centerX,
            top: imageCoverFrame.centerY,
            transform: `translate(-50%, -50%) rotate(${imageCoverFrame.angle}rad)`,
            width: imageCoverFrame.width,
          }}
        >
          {(!imageCoverFrame.isFull || activeTool === "selection") && (
            <button
              className="image-cover-move-surface"
              type="button"
              aria-label={imageCoverFrame.isFull ? t("Inhalt verschieben") : t("Abdeckung verschieben")}
              title={imageCoverFrame.isFull ? t("Inhalt verschieben") : t("Abdeckung verschieben")}
              onPointerDown={imageCoverFrame.isFull
                ? startCoveredMaterialDragFromFrame
                : (event) => startImageCoverDrag(event, "move")}
            />
          )}
          {imageCoverHandles.map(({ handle, label }) => (
            <button
              className={`image-cover-resize-handle is-${handle}`}
              type="button"
              aria-label={t(label)}
              title={t(label)}
              key={handle}
              onPointerDown={(event) => startImageCoverDrag(event, handle)}
            />
          ))}
        </div>
      )}
      {textFormattingContext && textFormattingExpanded && (
        <div
          className={`context-formatting-toolbar is-text is-expanded ${textToolbarPosition ? "is-detached" : `is-${textToolbarPlacement?.placement}`}${
            textFormattingExpanded && textColorMenuOpen
              && textToolbarPlacement?.placement === "above"
              && textToolbarPlacement.y < contextFormattingToolbarHeight + textColorPaletteOuterHeight + contextFormattingToolbarViewportInset
              ? " color-palette-toward-text"
              : ""
          }${
            textVerticalMenuOpen && textToolbarPlacement?.placement === "above"
              && textToolbarPlacement.y < textFormattingToolbarHeight + 64 + contextFormattingToolbarViewportInset
              ? " vertical-palette-toward-text"
              : ""
          }`}
          role="toolbar"
          aria-label={t("Textgestaltung")}
          style={{ left: textToolbarPosition ? textToolbarPosition.x : textToolbarPlacement?.x, top: textToolbarPosition ? textToolbarPosition.y : textToolbarPlacement?.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <button
            className="context-formatting-button text-toolbar-drag-handle"
            type="button"
            aria-label={t("Formatleiste verschieben")}
            title={t("Formatleiste verschieben")}
            onPointerDown={startTextToolbarDrag}
            onPointerMove={continueTextToolbarDrag}
            onPointerUp={finishTextToolbarDrag}
            onPointerCancel={finishTextToolbarDrag}
          >
            <GripVertical aria-hidden="true" strokeWidth={2}/>
          </button>
          <div className="text-formatting-rows">
            <div className="text-formatting-row">
          {!textFormattingContext.containerId && (
            <>
              <button
                className={`context-formatting-button text-move-handle${movingTextId === textFormattingContext.elementId ? " is-dragging" : ""}`}
                type="button"
                aria-label={t("Text verschieben")}
                title={t("Text verschieben")}
                onPointerDown={startActiveTextMove}
              >
                <Move aria-hidden="true" strokeWidth={2}/>
              </button>
              <span className="context-formatting-divider" aria-hidden="true"/>
            </>
          )}
          <div className="text-formatting-font-control">
            <button
              className="text-formatting-font-button"
              type="button"
              aria-label={t("Schriftart")}
              aria-expanded={textFontMenuOpen}
              aria-haspopup="true"
              title={t("Schriftart")}
              style={{ fontFamily: textFontOptions.find(option => option.value === textFormattingContext.fontFamily)?.cssFamily }}
              onClick={() => { setTextFontMenuOpen(open => !open); setTextColorMenuOpen(false); setTextVerticalMenuOpen(false); keepTextEditorFocused(); }}
            >Aa</button>
            {textFontMenuOpen && <div className="text-font-palette" role="group" aria-label={t("Schriftart auswählen")}>{textFontOptions.map((option) => (
              <button
                className="text-formatting-font-button"
                type="button"
                aria-label={t(option.label)}
                aria-pressed={textFormattingContext.fontFamily === option.value}
                title={t(option.label)}
                key={option.value}
                style={{ fontFamily: option.cssFamily }}
                onClick={() => { setActiveTextFont(option); setTextFontMenuOpen(false); }}
              >
                Aa
              </button>
            ))}</div>}
          </div>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <div className="text-formatting-size-group" role="group" aria-label={t("Textgröße")}>
            {textSizePresets.map((preset) => (
              <button
                className="text-formatting-size-button"
                type="button"
                aria-label={t("Textgröße {0}", t(preset.label))}
                aria-pressed={textFormattingContext.fontSize === preset.value}
                title={t("Textgröße {0}", t(preset.label))}
                key={preset.label}
                onClick={() => setActiveTextSize(preset.value)}
              >
                {t(preset.label)}
              </button>
            ))}
          </div>
          {textFormattingContext.containerId && <>
            <span className="context-formatting-divider" aria-hidden="true"/>
            <div className="text-vertical-control">
              <button
                className="context-formatting-button"
                type="button"
                aria-label={t("Textblock vertikal ausrichten")}
                aria-expanded={textVerticalMenuOpen}
                aria-haspopup="true"
                title={t("Textblock vertikal ausrichten")}
                onClick={() => {
                  setTextVerticalMenuOpen(open => !open);
                  setTextFontMenuOpen(false);
                  setTextColorMenuOpen(false);
                  keepTextEditorFocused();
                }}
              >
                {textFormattingContext.verticalAlign === "top" ? <AlignVerticalJustifyStart aria-hidden="true" strokeWidth={1.9}/>
                  : textFormattingContext.verticalAlign === "bottom" ? <AlignVerticalJustifyEnd aria-hidden="true" strokeWidth={1.9}/>
                    : <AlignVerticalJustifyCenter aria-hidden="true" strokeWidth={1.9}/>}
              </button>
              {textVerticalMenuOpen && <div className="text-vertical-palette" role="group" aria-label={t("Textblock ausrichten")}>
                {([
                  { value: "top", label: t("Textblock oben"), Icon: AlignVerticalJustifyStart },
                  { value: "middle", label: t("Textblock mittig"), Icon: AlignVerticalJustifyCenter },
                  { value: "bottom", label: t("Textblock unten"), Icon: AlignVerticalJustifyEnd },
                ] as const).map(({ value, label, Icon }) => <button
                  className="context-formatting-button"
                  type="button"
                  key={value}
                  aria-label={t(label)}
                  aria-pressed={textFormattingContext.verticalAlign === value}
                  title={t(label)}
                  onClick={() => setActiveTextVerticalAlign(value)}
                ><Icon aria-hidden="true" strokeWidth={1.9}/></button>)}
              </div>}
            </div>
          </>}
            </div>
            <div className="text-formatting-row">
          <span className="context-formatting-divider" aria-hidden="true"/>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Linksbündig")}
            aria-pressed={textFormattingContext.textAlign === "left"}
            title={textFormattingContext.hasTextSelection ? t("Markierte Absätze linksbündig") : t("Ganze Textbox linksbündig")}
            onClick={() => setActiveTextAlign("left")}
          >
            <AlignLeft aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Zentriert")}
            aria-pressed={textFormattingContext.textAlign === "center"}
            title={textFormattingContext.hasTextSelection ? t("Markierte Absätze zentrieren") : t("Ganze Textbox zentrieren")}
            onClick={() => setActiveTextAlign("center")}
          >
            <AlignCenter aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Rechtsbündig")}
            aria-pressed={textFormattingContext.textAlign === "right"}
            title={textFormattingContext.hasTextSelection ? t("Markierte Absätze rechtsbündig") : t("Ganze Textbox rechtsbündig")}
            onClick={() => setActiveTextAlign("right")}
          >
            <AlignRight aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Aufzählung")}
            aria-pressed={textFormattingContext.hasBullets}
            title={t("Aufzählung")}
            onClick={toggleActiveTextBullets}
          >
            <List aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Kursiv")}
            aria-pressed={textFormattingContext.italic}
            title={t("Kursiv")}
            onClick={() => applyRichTextFormatting({ kind: "toggle", mark: "italic" })}
          >
            <Italic aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Unterstreichen")}
            aria-pressed={textFormattingContext.underline}
            title={t("Unterstreichen")}
            onClick={() => applyRichTextFormatting({ kind: "toggle", mark: "underline" })}
          >
            <Underline aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Durchstreichen")}
            aria-pressed={textFormattingContext.strike}
            title={t("Durchstreichen")}
            onClick={() => applyRichTextFormatting({ kind: "toggle", mark: "strike" })}
          >
            <Strikethrough aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <div className="text-color-control">
            <button
              className="context-formatting-button text-color-trigger"
              type="button"
              aria-label={t("Textfarbe")}
              aria-expanded={textColorMenuOpen}
              aria-haspopup="true"
              title={t("Textfarbe")}
              onClick={() => {
                setTextColorMenuOpen((isOpen) => !isOpen);
                setTextFontMenuOpen(false);
                setTextVerticalMenuOpen(false);
                keepTextEditorFocused();
              }}
            >
              <span aria-hidden="true">A</span>
              <span
                className="text-color-trigger-line"
                aria-hidden="true"
                style={{ backgroundColor: textFormattingContext.strokeColor }}
              />
            </button>
            {textColorMenuOpen && (
              <div className="text-color-palette" role="group" aria-label={t("Textfarbe auswählen")}>
                {textColorOptions.map((option) => {
                  const currentColor = textFormattingContext.strokeColor.toLowerCase();
                  const isSelected = currentColor === option.value
                    || (option.label === "Schwarz" && currentColor === foregroundColor.light)
                    || (option.label === "Weiß" && currentColor === foregroundColor.dark);
                  return (
                    <button
                      className="text-color-swatch-button"
                      type="button"
                      aria-label={t("Textfarbe {0}", t(option.label))}
                      aria-pressed={isSelected}
                      title={t(option.label)}
                      key={option.value}
                      onClick={() => setActiveTextColor(option.value)}
                    >
                      <span
                        className={`text-color-swatch${option.label === "Weiß" ? " is-light" : ""}`}
                        aria-hidden="true"
                        style={{ backgroundColor: option.value }}
                      >
                        {isSelected && <Check strokeWidth={2.5}/>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      )}
      {shapeFormattingContext && shapePreviewPosition && shapeToolbarDockPreview && (
        <div
          className={`shape-toolbar-dock-preview${shapeToolbarDockPreview.side === "left" || shapeToolbarDockPreview.side === "right" ? " is-side" : ""}`}
          aria-hidden="true"
          style={{ left: shapePreviewPosition.x, top: shapePreviewPosition.y }}
        />
      )}
      {shapeFormattingContext && (
        <div
          className={`context-formatting-toolbar is-shape${shapeToolbarPosition || shapeDockedPosition ? " is-detached" : ` is-${shapeFormattingContext.placement}`}${shapeToolbarCompact ? " is-side-docked" : ""}${shapeToolbarDragging ? " is-dragging" : ""}`}
          role="toolbar"
          aria-label={t("Form formatieren")}
          style={{ left: shapeDockedPosition?.x ?? shapeToolbarPosition?.x ?? shapeFormattingContext.x,
            top: shapeDockedPosition?.y ?? shapeToolbarPosition?.y ?? shapeFormattingContext.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <button
            className="context-formatting-button text-toolbar-drag-handle shape-toolbar-drag-handle"
            type="button"
            aria-label={t("Formleiste verschieben")}
            title={t("Formleiste verschieben")}
            onPointerDown={startShapeToolbarDrag}
            onPointerMove={continueShapeToolbarDrag}
            onPointerUp={finishShapeToolbarDrag}
            onPointerCancel={finishShapeToolbarDrag}
          >
            <GripVertical aria-hidden="true" strokeWidth={2}/>
          </button>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={t("Form ohne Füllung")}
            aria-pressed={shapeFormattingContext.fillMode === "empty"}
            title={t("Ohne Füllung")}
            onClick={() => setActiveShapeFill("empty")}
          >
            <SquareSlash aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button is-translucent"
            type="button"
            aria-label={t("Form transparent gefüllt")}
            aria-pressed={shapeFormattingContext.fillMode === "translucent"}
            title={t("Transparent")}
            onClick={() => setActiveShapeFill("translucent")}
          >
            <Blend aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="context-formatting-button is-solid"
            type="button"
            aria-label={t("Form deckend gefüllt")}
            aria-pressed={shapeFormattingContext.fillMode === "solid"}
            title={t("Deckend")}
            onClick={() => setActiveShapeFill("solid")}
          >
            <Square aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <div className="shape-color-options" role="radiogroup" aria-label={t("Formfarbe")}>
            {shapeColorOptions.map((option) => {
              const isSelected = shapeFormattingContext.color.toLowerCase() === option.value.toLowerCase();
              return (
                <button
                  className="tool-color-option"
                  type="button"
                  key={option.id}
                  role="radio"
                  aria-label={t("Formfarbe: {0}", t(option.label))}
                  aria-checked={isSelected}
                  title={t(option.label)}
                  style={{ "--swatch-color": option.value } as CSSProperties}
                  onClick={() => setActiveShapeColor(option.value)}
                >
                  {isSelected && <Check aria-hidden="true" strokeWidth={2.6}/>} 
                </button>
              );
            })}
          </div>
          <span className="context-formatting-divider" aria-hidden="true"/>
          <button
            className="context-formatting-button"
            type="button"
            aria-label={shapeFormattingContext.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={shapeFormattingContext.hasCover}
            title={shapeFormattingContext.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            onClick={() => toggleImageCover(shapeFormattingContext.elementId)}
          >
            {shapeFormattingContext.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
        </div>
      )}
      {elementContextMenu && (
        <div
          className="archive-context-menu canvas-element-context-menu"
          role="menu"
          aria-label={elementContextMenu.selectionCount === 1 ? t("Aktionen für Element") : t("Aktionen für {0} Elemente", elementContextMenu.selectionCount)}
          style={{ left: elementContextMenu.x, top: elementContextMenu.y }}
        >
          <button type="button" role="menuitem" onClick={copySelectedCanvasElements}>
            <Copy aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Kopieren")}</span>
            <kbd>{navigator.userAgent.includes("Mac") ? "⌘C" : t("Strg+C")}</kbd>
          </button>
          <button className="is-destructive" type="button" role="menuitem" onClick={deleteSelectedCanvasElements}>
            <Trash2 aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Löschen")}</span>
            <kbd>{navigator.userAgent.includes("Mac") ? "⌫" : t("Entf")}</kbd>
          </button>
        </div>
      )}
      {imageTransformPreview && (
        <div
          className="image-transform-preview"
          aria-hidden="true"
          style={{
            height: imageTransformPreview.height,
            left: imageTransformPreview.centerX,
            top: imageTransformPreview.centerY,
            transform: `translate(-50%, -50%) rotate(${imageTransformPreview.angle}rad)`,
            width: imageTransformPreview.width,
          }}
        />
      )}
      {imageCropSelection && (
        <div
          className={`image-crop-selection-frame is-${imageCropSelection.mode}`}
          aria-label={imageCropSelection.mode === "trim" ? t("Bildränder trimmen") : t("Bildausschnitt auswählen")}
          style={{
            height: imageCropSelection.height,
            left: imageCropSelection.centerX,
            top: imageCropSelection.centerY,
            transform: `translate(-50%, -50%) rotate(${imageCropSelection.angle}rad)`,
            width: imageCropSelection.width,
          }}
        >
          {imageCropSelection.mode === "select" ? (
            <button
              className="image-crop-selection-surface"
              type="button"
              aria-label={t("Ausschnitt aufziehen")}
              onPointerDown={startImageCropSelectionDrag}
            />
          ) : (
            <div
              className="image-crop-trim-shield"
              aria-hidden="true"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            />
          )}
          {imageCropSelection.rect && (
            <span
              className="image-crop-selection-window"
              aria-hidden="true"
              style={{
                height: `${imageCropSelection.rect.height * 100}%`,
                left: `${imageCropSelection.rect.x * 100}%`,
                top: `${imageCropSelection.rect.y * 100}%`,
                width: `${imageCropSelection.rect.width * 100}%`,
              }}
            />
          )}
          {imageCropSelection.mode === "trim" && imageCropSelection.rect && imageCropTrimHandles.map(({ handle, label }) => (
            <button
              className={`image-crop-trim-handle is-${handle}`}
              type="button"
              key={handle}
              aria-label={t(label)}
              title={t(label)}
              style={getImageCropTrimHandleStyle(handle, imageCropSelection.rect!)}
              onPointerDown={(event) => startImageTrimDrag(event, handle)}
            />
          ))}
        </div>
      )}
      {imagePrintError && (
        <div className="image-print-error" role="alert">
          {t(imagePrintError)}
        </div>
      )}
      {canvasActionError && (
        <div className="image-print-error" role="alert">
          {t(canvasActionError)}
        </div>
      )}
      {(printingImageId || printingInteractiveHtmlId) && (
        <div className="image-print-status" role="status" aria-live="polite">
          <LoaderCircle className="image-print-spinner" aria-hidden="true" strokeWidth={2}/>
          <span>{t("Druck wird geöffnet")}</span>
        </div>
      )}
      {textQuickActions?.edit && textQuickActions.format && textFormattingContext && (
        <div className="image-quick-actions text-quick-actions" aria-label={t("Textaktionen")}>
          <button
            className="image-quick-action"
            type="button"
            aria-label={t("Text bearbeiten")}
            title={t("Text bearbeiten")}
            style={{ left: textQuickActions.edit.x, top: textQuickActions.edit.y }}
            onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
            onClick={editActiveText}
          >
            <TextCursorInput aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="image-quick-action text-formatting-toggle"
            type="button"
            aria-label={textFormattingExpanded ? t("Textgestaltung schließen") : t("Textgestaltung öffnen")}
            aria-expanded={textFormattingExpanded}
            title={textFormattingExpanded ? t("Textgestaltung schließen") : t("Textgestaltung öffnen")}
            style={{ left: textQuickActions.format.x, top: textQuickActions.format.y }}
            onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
            onClick={toggleTextFormatting}
          >
            <ALargeSmall aria-hidden="true" strokeWidth={1.9}/>
            {textFormattingExpanded
              ? <ChevronUp className="text-formatting-toggle-chevron" aria-hidden="true" strokeWidth={2.2}/>
              : <ChevronDown className="text-formatting-toggle-chevron" aria-hidden="true" strokeWidth={2.2}/>}
          </button>
          <button
            className="image-quick-action image-cover-button"
            type="button"
            aria-label={textQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={textQuickActions.hasCover}
            title={textQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            style={{ left: textQuickActions.cover.x, top: textQuickActions.cover.y }}
            onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
            onClick={() => toggleImageCover(textQuickActions.targetId)}
          >
            {textQuickActions.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
        </div>
      )}
      {canvasCoverQuickAction && !textQuickActions && !shapeFormattingContext && (
        <div className="image-quick-actions canvas-object-quick-actions" aria-label={t("Abdeckung für Canvasobjekt")}>
          <button
            className="image-quick-action image-cover-button"
            type="button"
            aria-label={canvasCoverQuickAction.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={canvasCoverQuickAction.hasCover}
            title={canvasCoverQuickAction.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            style={{ left: canvasCoverQuickAction.cover.x, top: canvasCoverQuickAction.cover.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => toggleImageCover(canvasCoverQuickAction.targetId)}
          >
            {canvasCoverQuickAction.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
        </div>
      )}
      {interactiveHtmlQuickActions && (
        <div className="image-quick-actions interactive-material-quick-actions" aria-label={t("Aktionen für interaktives Material")}>
          {(() => {
            const ready = readyInteractiveHtmlIds.current.has(interactiveHtmlQuickActions.elementId);
            const persisted = !interactiveHtmlPersistenceDisabledIdsRef.current.has(interactiveHtmlQuickActions.elementId);
            const label = ready
              ? persisted
                ? t("Inhalte werden beim Wiederöffnen behalten")
                : t("Inhalte beim Wiederöffnen behalten")
              : t("Inhalte werden vorbereitet");
            return <button
              className="image-quick-action interactive-persist-button"
              type="button"
              aria-label={t(label)}
              aria-pressed={persisted}
              disabled={!ready}
              title={t(label)}
              style={{left:interactiveHtmlQuickActions.persist.x,top:interactiveHtmlQuickActions.persist.y}}
              onPointerDown={event => {event.preventDefault();event.stopPropagation();}}
              onClick={() => toggleInteractiveHtmlPersistence(interactiveHtmlQuickActions.elementId)}
            >
              <Save aria-hidden="true" strokeWidth={1.9}/>
            </button>;
          })()}
          <button
            className="image-quick-action interactive-reset-button"
            type="button"
            aria-label={t("Inhalte zurücksetzen")}
            disabled={!readyInteractiveHtmlIds.current.has(interactiveHtmlQuickActions.elementId)}
            title={readyInteractiveHtmlIds.current.has(interactiveHtmlQuickActions.elementId)
              ? t("Inhalte zurücksetzen")
              : t("Inhalte werden vorbereitet")}
            style={{left:interactiveHtmlQuickActions.reset.x,top:interactiveHtmlQuickActions.reset.y}}
            onPointerDown={event => {event.preventDefault();event.stopPropagation();}}
            onClick={() => setInteractiveHtmlResetTarget(interactiveHtmlQuickActions.elementId)}
          >
            <RotateCcw aria-hidden="true" strokeWidth={1.9}/>
          </button>
          {interactiveHtmlQuickActions.print && (
            <button
              className="image-quick-action image-print-button"
              type="button"
              aria-busy={printingInteractiveHtmlId === interactiveHtmlQuickActions.elementId}
              aria-label={printingInteractiveHtmlId === interactiveHtmlQuickActions.elementId
                ? t("Druck wird vorbereitet")
                : t("Material drucken")}
              title={printingInteractiveHtmlId === interactiveHtmlQuickActions.elementId
                ? t("Druck wird vorbereitet")
                : t("Material drucken")}
              disabled={printingImageId !== null || printingInteractiveHtmlId !== null}
              style={{ left: interactiveHtmlQuickActions.print.x, top: interactiveHtmlQuickActions.print.y }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() => void printInteractiveHtml(interactiveHtmlQuickActions.elementId)}
            >
              {printingInteractiveHtmlId === interactiveHtmlQuickActions.elementId
                ? <LoaderCircle className="image-print-spinner" aria-hidden="true" strokeWidth={2}/>
                : <Printer aria-hidden="true" strokeWidth={1.9}/>} 
            </button>
          )}
          {interactiveLiveControls && interactiveHtmlQuickActions.access && (() => {
            const unlocked = interactiveLiveControls.accessFor(interactiveHtmlQuickActions.elementId) === 'all';
            const label = unlocked ? t("Für Schüler sperren") : t("Für Schüler freigeben");
            return <button className="image-quick-action interactive-live-lock-button" type="button" aria-label={t(label)}
              aria-pressed={unlocked} title={t(label)} style={{left:interactiveHtmlQuickActions.access.x,top:interactiveHtmlQuickActions.access.y}}
              onPointerDown={event => {event.preventDefault();event.stopPropagation();}}
              onClick={() => interactiveLiveControls.setAccess(interactiveHtmlQuickActions.elementId,unlocked?'locked':'all')}>
              {unlocked ? <LockOpen aria-hidden="true" strokeWidth={1.9}/> : <Lock aria-hidden="true" strokeWidth={1.9}/>}
            </button>;
          })()}
          <button
            className="image-quick-action image-center-button"
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") event.stopPropagation(); }}
            type="button"
            aria-label={elementFocusFrames.some(frame => frame.elementId === interactiveHtmlQuickActions.elementId) ? t("Fokus beenden") : t("Interaktives Material fokussieren")}
            title={elementFocusFrames.some(frame => frame.elementId === interactiveHtmlQuickActions.elementId) ? t("Fokus beenden") : t("Interaktives Material fokussieren")}
            style={{ left: interactiveHtmlQuickActions.center.x, top: interactiveHtmlQuickActions.center.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            aria-pressed={elementFocusFrames.some(frame => frame.elementId === interactiveHtmlQuickActions.elementId)}
            onClick={() => toggleMaterialFocus(interactiveHtmlQuickActions.elementId)}
          >
            <LocateFixed aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="image-quick-action image-cover-button"
            type="button"
            aria-label={interactiveHtmlQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={interactiveHtmlQuickActions.hasCover}
            title={interactiveHtmlQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            style={{ left: interactiveHtmlQuickActions.cover.x, top: interactiveHtmlQuickActions.cover.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => toggleImageCover(interactiveHtmlQuickActions.elementId)}
          >
            {interactiveHtmlQuickActions.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
          {materialControls?.active && <button
            className="image-quick-action image-focus-button"
            type="button"
            aria-label={materialControls.activeId===interactiveHtmlQuickActions.elementId?t("Material wird gezeigt"):t("Material zeigen")}
            aria-pressed={materialControls.activeId===interactiveHtmlQuickActions.elementId}
            disabled={materialControls.activeId===interactiveHtmlQuickActions.elementId}
            title={materialControls.activeId===interactiveHtmlQuickActions.elementId?t("Material wird gezeigt"):t("Material zeigen")}
            style={{ left: interactiveHtmlQuickActions.focus.x, top: interactiveHtmlQuickActions.focus.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => materialControls.show(interactiveHtmlQuickActions.elementId)}
          >
            <MonitorUp aria-hidden="true" strokeWidth={1.9}/>
          </button>}
        </div>
      )}
      {interactiveHtmlResetTarget && (
        <div
          className="interactive-reset-dialog-layer"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setInteractiveHtmlResetTarget(null);
          }}
        >
          <div
            className="interactive-reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interactive-reset-dialog-title"
            aria-describedby="interactive-reset-dialog-description"
          >
            <TriangleAlert className="interactive-reset-dialog__icon" aria-hidden="true" strokeWidth={1.8}/>
            <div className="interactive-reset-dialog__copy">
              <h2 id="interactive-reset-dialog-title">{t("Inhalte zurücksetzen?")}</h2>
              <p id="interactive-reset-dialog-description">{t("Alle Eingaben und Spielstände in diesem Material werden gelöscht.")}</p>
            </div>
            <div className="interactive-reset-dialog__actions">
              <button type="button" autoFocus onClick={() => setInteractiveHtmlResetTarget(null)}>{t("Abbrechen")}</button>
              <button className="is-danger" type="button" onClick={confirmInteractiveHtmlReset}>
                <RotateCcw aria-hidden="true" strokeWidth={1.9}/>
                {t("Zurücksetzen")}
              </button>
            </div>
          </div>
        </div>
      )}
      {videoQuickActions && (
        <div className="image-quick-actions video-material-quick-actions" aria-label={videoQuickActions.kind === "app" ? t("App-Aktionen") : t("Videoaktionen")}>
          <button
            className="image-quick-action image-center-button"
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") event.stopPropagation(); }}
            type="button"
            aria-label={elementFocusFrames.some(frame => frame.elementId === videoQuickActions.videoId) ? t("Fokus beenden") : videoQuickActions.kind === "app" ? t("App fokussieren") : t("Video fokussieren")}
            title={elementFocusFrames.some(frame => frame.elementId === videoQuickActions.videoId) ? t("Fokus beenden") : videoQuickActions.kind === "app" ? t("App fokussieren") : t("Video fokussieren")}
            style={{ left: videoQuickActions.center.x, top: videoQuickActions.center.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            aria-pressed={elementFocusFrames.some(frame => frame.elementId === videoQuickActions.videoId)}
            onClick={() => toggleMaterialFocus(videoQuickActions.videoId)}
          >
            <LocateFixed aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="image-quick-action image-cover-button"
            type="button"
            aria-label={videoQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={videoQuickActions.hasCover}
            title={videoQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            style={{ left: videoQuickActions.cover.x, top: videoQuickActions.cover.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => toggleImageCover(videoQuickActions.videoId)}
          >
            {videoQuickActions.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
          {videoQuickActions.kind==='app'&&materialControls?.active&&<button
            className="image-quick-action image-focus-button" type="button"
            aria-label={materialControls.activeId===videoQuickActions.videoId?t("Material wird gezeigt"):t("Material zeigen")}
            aria-pressed={materialControls.activeId===videoQuickActions.videoId}
            disabled={materialControls.activeId===videoQuickActions.videoId}
            title={t("Material zeigen")} style={{left:videoQuickActions.focus.x,top:videoQuickActions.focus.y}}
            onPointerDown={event=>{event.preventDefault();event.stopPropagation();}}
            onClick={()=>materialControls.show(videoQuickActions.videoId)}><MonitorUp aria-hidden="true" strokeWidth={1.9}/></button>}
        </div>
      )}
      {documentImageEditor && <DocumentImageEditor {...documentImageEditor} onCancel={closeDocumentImageEditor} onApply={rect => void applyDocumentImage(rect)}/>}
      {imageQuickActions && (
        <div className="image-quick-actions image-material-quick-actions" aria-label={t("Bildaktionen")}>
          <button
            className="image-quick-action image-print-button"
            type="button"
            aria-busy={printingImageId === imageQuickActions.imageId}
            aria-label={printingImageId === imageQuickActions.imageId ? t("Druck wird vorbereitet") : t("Material drucken")}
            title={printingImageId === imageQuickActions.imageId ? t("Druck wird vorbereitet") : t("Material drucken")}
            disabled={printingImageId !== null || printingInteractiveHtmlId !== null}
            style={{ left: imageQuickActions.print.x, top: imageQuickActions.print.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => void printImage(imageQuickActions.imageId)}
          >
            {printingImageId === imageQuickActions.imageId
              ? <LoaderCircle className="image-print-spinner" aria-hidden="true" strokeWidth={2}/>
              : <Printer aria-hidden="true" strokeWidth={1.9}/>
            }
          </button>
          <button
            className="image-quick-action image-enhance-button"
            type="button"
            aria-busy={enhancingImageId === imageQuickActions.imageId}
            aria-label={imageQuickActions.isEnhanced ? t("Originaldarstellung verwenden") : t("Bild verbessern")}
            aria-pressed={imageQuickActions.isEnhanced}
            title={imageQuickActions.isEnhanced ? t("Originaldarstellung verwenden") : t("Bild verbessern")}
            disabled={enhancingImageId !== null}
            style={{ left: imageQuickActions.enhance.x, top: imageQuickActions.enhance.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => void toggleScanEnhancement(imageQuickActions.imageId)}
          >
            {enhancingImageId === imageQuickActions.imageId
              ? <LoaderCircle className="image-print-spinner" aria-hidden="true" strokeWidth={2}/>
              : <WandSparkles aria-hidden="true" strokeWidth={1.9}/>
            }
          </button>
          <button
            className="image-quick-action image-center-button"
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") event.stopPropagation(); }}
            type="button"
            aria-label={elementFocusFrames.some(frame => frame.elementId === imageQuickActions.imageId) ? t("Fokus beenden") : t("Bild fokussieren")}
            title={elementFocusFrames.some(frame => frame.elementId === imageQuickActions.imageId) ? t("Fokus beenden") : t("Bild fokussieren")}
            style={{ left: imageQuickActions.center.x, top: imageQuickActions.center.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            aria-pressed={elementFocusFrames.some(frame => frame.elementId === imageQuickActions.imageId)}
            onClick={() => toggleMaterialFocus(imageQuickActions.imageId)}
          >
            <LocateFixed aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button
            className="image-quick-action image-crop-button"
            type="button"
            aria-label={imageQuickActions.isCropping || imageCropSelection?.imageId === imageQuickActions.imageId
              ? t("Zuschneiden beenden")
              : t("Bild zuschneiden")}
            aria-pressed={imageQuickActions.isCropping || imageCropSelection?.imageId === imageQuickActions.imageId}
            aria-expanded={imageCropMenuImageId === imageQuickActions.imageId}
            aria-haspopup="menu"
            title={imageQuickActions.isCropping || imageCropSelection?.imageId === imageQuickActions.imageId
              ? t("Zuschneiden beenden")
              : t("Bild zuschneiden")}
            style={{ left: imageQuickActions.crop.x, top: imageQuickActions.crop.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => toggleImageCropMenu(imageQuickActions.imageId)}
          >
            <Crop aria-hidden="true" strokeWidth={1.9}/>
          </button>
          {imageCropMenuImageId === imageQuickActions.imageId && (
            <div
              className="image-crop-mode-menu"
              role="menu"
              aria-label={t("Zuschneideart")}
              style={{
                left: Math.min(
                  Math.max(150, imageQuickActions.crop.x),
                  Math.max(150, (rootRef.current?.clientWidth ?? window.innerWidth) - 150),
                ),
                top: imageQuickActions.crop.y,
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button type="button" role="menuitem" onClick={() => void startImageCropSelection(imageQuickActions.imageId)}>
                <Scan aria-hidden="true" strokeWidth={1.9}/>
                <span>{t("Ausschnitt wählen")}</span>
              </button>
              <button type="button" role="menuitem" onClick={() => void startImageTrim(imageQuickActions.imageId)}>
                <Crop aria-hidden="true" strokeWidth={1.9}/>
                <span>{t("Ränder trimmen")}</span>
              </button>
            </div>
          )}
          <button
            className="image-quick-action image-cover-button"
            type="button"
            aria-label={imageQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            aria-pressed={imageQuickActions.hasCover}
            title={imageQuickActions.hasCover ? t("Abdeckung entfernen") : t("Abdeckung hinzufügen")}
            style={{ left: imageQuickActions.cover.x, top: imageQuickActions.cover.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => toggleImageCover(imageQuickActions.imageId)}
          >
            {imageQuickActions.hasCover ? <EyeOff aria-hidden="true" strokeWidth={1.9}/> : <Eye aria-hidden="true" strokeWidth={1.9}/>}
          </button>
          {materialControls?.active && <button
            className="image-quick-action image-focus-button"
            type="button"
            aria-label={materialControls.activeId===imageQuickActions.imageId?t("Material wird gezeigt"):t("Material zeigen")}
            aria-pressed={materialControls.activeId===imageQuickActions.imageId}
            disabled={materialControls.activeId===imageQuickActions.imageId}
            title={materialControls.activeId===imageQuickActions.imageId?t("Material wird gezeigt"):t("Material zeigen")}
            style={{ left: imageQuickActions.focus.x, top: imageQuickActions.focus.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => materialControls.show(imageQuickActions.imageId)}
          >
            <MonitorUp aria-hidden="true" strokeWidth={1.9}/>
          </button>}
        </div>
      )}
    </div></>
  );
}
