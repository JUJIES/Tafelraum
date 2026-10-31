import type { AgentCanvasState, AgentCanvasResult } from "./canvas-agent";
import type { AgentMaterial } from "./agent-materials";
import type { MaterialRemoval } from "../../material-removal.mjs";
export type CanvasTheme = "light" | "dark";

export type CanvasTool =
  | "hand"
  | "selection"
  | "pen"
  | "marker"
  | "eraser"
  | "text"
  | "shape";

export type BasicShape = "rectangle" | "ellipse" | "diamond";
export type ShapeFillMode = "empty" | "translucent" | "solid";
export type CanvasRotationDirection = "left" | "right";

export type CanvasToolContext = {
  markerColor: string;
  markerStrokeWidth: number;
  penColor: string;
  penStrokeWidth: number;
  shape: BasicShape;
  shapeColor: string;
  shapeFill: ShapeFillMode;
  theme: CanvasTheme;
};

export type CanvasImageAsset = {
  id: string;
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  pixelHeight: number;
  pixelWidth: number;
  source: {
    archiveMaterialPath?: string;
    fileName: string;
    kind: "image" | "pdf-page";
    pageNumber?: number;
  };
};

export type CanvasAudioAsset = {
  archiveMaterialPath: string;
  fileName: string;
  lessonId: string;
  materialPath: string;
  mimeType: "audio/mpeg" | "audio/mp4" | "audio/aac" | "audio/wav" | "audio/ogg" | "audio/webm" | "audio/flac";
};

export type CanvasVideoAsset = {
  archiveMaterialPath: string;
  fileName: string;
  lessonId: string;
  materialPath: string;
  mimeType: "video/mp4";
};

export type CanvasYouTubeAsset = {
  archiveMaterialPath: string;
  title: string;
  url: string;
  videoId: string;
};

export type CanvasInteractiveHtmlAsset = {
  archiveMaterialPath: string;
  id: string;
  title: string;
  lessonId: string;
  entry: string;
  print: {
    entry: string;
    page: "A4";
    orientation: "portrait" | "landscape";
    mode: "template";
    layout?: "shared-pages";
  } | null;
  defaultViewport: { width: number; height: number };
};

export type CanvasLink = {
  archiveMaterialPath?: string;
  label: string;
  url: string;
};

export type CanvasViewportPoint = {
  clientX: number;
  clientY: number;
};

export interface CanvasPort {
  inspectAgentCanvas(): AgentCanvasState;
  executeAgentCommand(command: unknown, materials?: Map<string, AgentMaterial>, expiresAt?: number): Promise<AgentCanvasResult>;
  selectTool(tool: CanvasTool, context: CanvasToolContext): void;
  rotateSelection(direction: CanvasRotationDirection): void;
  placeImages(assets: readonly CanvasImageAsset[], point?: CanvasViewportPoint): Promise<void>;
  placeAudio(asset: CanvasAudioAsset, point?: CanvasViewportPoint): void;
  placeVideo(asset: CanvasVideoAsset, point?: CanvasViewportPoint): void;
  placeInteractiveHtml(asset: CanvasInteractiveHtmlAsset, point?: CanvasViewportPoint): void;
  placeTimer(point?: CanvasViewportPoint): void;
  placeEmbeddedApp(appId: string, point?: CanvasViewportPoint): void;
  placeLink(link: CanvasLink, point?: CanvasViewportPoint): void;
  placeYouTube(asset: CanvasYouTubeAsset, point?: CanvasViewportPoint): void;
  applyArchiveMaterialRemovals(removals: readonly MaterialRemoval[]): Promise<void>;
  undo(): void;
  redo(): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  fitToContent(): void;
  hasArchiveMaterial(archivePath: string, legacyFileName?: string): boolean;
  focusArchiveMaterial(archivePath: string, legacyFileName?: string): boolean;
  getUnsavedInteractiveHtmlChangeCount(): number;
  flushPersistence(): Promise<void>;
}
