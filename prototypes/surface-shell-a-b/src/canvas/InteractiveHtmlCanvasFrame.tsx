import { t, useUiLocale } from "../i18n";
import {registerAppMirrorFrame,appMirrorFrameReady,receiveAppMirror} from "./embedded-app-mirror";
import {bindSentenceCheckFrame} from './interactive-html-sentence-check';
import { createPortal } from "react-dom";
import { interactiveHtmlControlsPosition } from "./interactive-html-frame-geometry";
import { Lock } from "lucide-react";
import {htmlPageProjection, type HtmlPageOrientation} from "./interactive-html-pages";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { registerInteractiveHtmlFrame, interactiveHtmlFrameLoaded, subscribeHtmlPlaybackMode, teacherHtmlPlaybackUrl,htmlPlaybackRestoring } from "./interactive-html-live";
import { getFreeDrawSvgPath } from "@excalidraw/excalidraw";
import type { ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types";
import {
  getInteractiveHtmlCoverProjection,
  getInteractiveHtmlContentProjection,
  getInteractiveHtmlAnnotationScrollTranslation,
  getInteractiveHtmlTitlebarProjection,
  interactiveHtmlTitlebarHeight,
  interactiveHtmlCornerRadius,
  parseInteractiveHtmlMaterialMoveMessage,
  parseInteractiveHtmlPanMessage,
  parseInteractiveHtmlScrollMessage,
  parseInteractiveHtmlWheelPanMessage,
  parseInteractiveHtmlZoomMessage,
  type InteractiveHtmlMaterialMoveMessage,
  type InteractiveHtmlPanMessage,
  type InteractiveHtmlScrollOffset,
  type InteractiveHtmlWheelPanMessage,
  type InteractiveHtmlZoomMessage,
} from "./interactive-html-embed";
import type { ImageCoverRect } from "./image-cover";
import type { InteractiveHtmlAnnotation } from "./interactive-html-annotations";
import {
  type EmbeddedAppId,
  embeddedAppById,
} from "../embedded-apps";

export type InteractiveHtmlCanvasFrameData = {
  viewportWidth:number;
  viewportHeight:number;
  selected?: boolean;
  locked?: boolean;
  contentOnly?: boolean;
  pageOrientation?: HtmlPageOrientation | null;
  annotationKey: string;
  annotations: readonly InteractiveHtmlAnnotation[];
  angle: number;
  centerX: number;
  centerY: number;
  contentZoom: number;
  coverRect: ImageCoverRect | null;
  elementId: string;
  height: number;
  sceneHeight: number;
  sceneWidth: number;
  sourceUrl: string;
  lessonId: string;
  materialId: string;
  entry: string;
  title: string;
  width: number;
  zoom: number;
  embeddedApp?: {
    id: EmbeddedAppId;
    directUrl: string;
    iconUrl: string;
  };
};

type InteractiveHtmlCanvasFrameProps = {
  annotationDragActive: boolean;
  canvasPanActive: boolean;
  canvasSelectionActive?: boolean;
  canvasToolActive: boolean;
  frame: InteractiveHtmlCanvasFrameData;
  materialShadow: boolean;
  onBackgroundPan(elementId: string, message: InteractiveHtmlPanMessage, viewportPoint: { x: number; y: number }): void;
  onMaterialMove(elementId: string, message: InteractiveHtmlMaterialMoveMessage, viewportPoint: { x: number; y: number }): void;
  onUnlock(elementId:string):void;
  onAnnotationPointerDown(event: ReactPointerEvent<SVGElement>, elementId: string): void;
  onContextMenu(event: ReactMouseEvent<HTMLDivElement>, elementId: string): void;
  onMoveStart(event: ReactPointerEvent<HTMLElement>, elementId: string): void;
  onPanWheel(message: InteractiveHtmlWheelPanMessage, viewportPoint: { x: number; y: number }): void;
  onScrollChange(elementId: string, offset: InteractiveHtmlScrollOffset): void;
  onZoomWheel(message: InteractiveHtmlZoomMessage, viewportPoint: { x: number; y: number }): void;
};

const selectionHandlePositions = [
  [-0.5, -0.5], [0, -0.5], [0.5, -0.5],
  [-0.5, 0], [0.5, 0],
  [-0.5, 0.5], [0, 0.5], [0.5, 0.5],
] as const;

function AnnotationSelectionBox({ annotation, zoom }: {
  annotation: InteractiveHtmlAnnotation;
  zoom: number;
}) {
  const handleSize = 8 / zoom;
  const rotationOffset = 24 / zoom;
  const halfWidth = annotation.width / 2;
  const halfHeight = annotation.height / 2;
  const margin = 0;
  return (
    <g
      className="interactive-html-canvas-frame__annotation-selection"
      transform={`translate(${annotation.x} ${annotation.y}) rotate(${annotation.angle * 180 / Math.PI})`}
    >
      <rect
        className="interactive-html-canvas-frame__annotation-selection-box"
        x={-halfWidth - margin}
        y={-halfHeight - margin}
        width={annotation.width + 2 * margin}
        height={annotation.height + 2 * margin}
      />
      <line
        className="interactive-html-canvas-frame__annotation-selection-line"
        x1={0}
        y1={-halfHeight}
        x2={0}
        y2={-halfHeight - rotationOffset}
      />
      <circle
        className="interactive-html-canvas-frame__annotation-selection-handle"
        cx={0}
        cy={-halfHeight - rotationOffset}
        r={handleSize / 2}
      />
      {selectionHandlePositions.map(([relativeX, relativeY]) => (
        <rect
          key={`${relativeX}:${relativeY}`}
          className="interactive-html-canvas-frame__annotation-selection-handle"
          x={relativeX * (annotation.width + 2 * margin) - handleSize / 2}
          y={relativeY * (annotation.height + 2 * margin) - handleSize / 2}
          width={handleSize}
          height={handleSize}
          rx={1 / zoom}
        />
      ))}
    </g>
  );
}

export function InteractiveHtmlCanvasFrame({ annotationDragActive, canvasPanActive, canvasSelectionActive, canvasToolActive, frame, materialShadow, onAnnotationPointerDown, onBackgroundPan, onContextMenu, onMaterialMove, onMoveStart, onUnlock, onPanWheel, onScrollChange, onZoomWheel }: InteractiveHtmlCanvasFrameProps) {
  useUiLocale();
  // Registry membership is the distribution boundary; no per-device connection gate.
  const appAllowed = !frame.embeddedApp || Boolean(embeddedAppById(frame.embeddedApp.id));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [,setPlaybackModeRevision]=useState(0);
  useEffect(()=>subscribeHtmlPlaybackMode(()=>setPlaybackModeRevision(value=>value+1)),[]);
  const sourceUrl=frame.embeddedApp?frame.sourceUrl:teacherHtmlPlaybackUrl(frame.elementId,frame.sourceUrl);
  const [appLoadState, setAppLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [scrollOffset, setScrollOffset] = useState<InteractiveHtmlScrollOffset>({ x: 0, y: 0 });
  const [occupiedControls, setOccupiedControls] = useState<{left:number;top:number;width:number;height:number}[]>([]);
  useLayoutEffect(() => {
    if (!frame.selected) return;
    const layer=iframeRef.current?.closest(".interactive-html-canvas-layer");
    if (!layer) return;
    const bounds=layer.getBoundingClientRect();
    const workspace=layer.closest(".workspace");
    const nodes=[workspace?.querySelector(".canvas-history-actions"),workspace?.querySelector('.lesson-material-panel[data-state="open"]'),
      layer.ownerDocument.querySelector('.toolbar:not(.is-concealed)')];
    const occupied=nodes.flatMap(node=>{
      if(!node)return [];
      const rect=node.getBoundingClientRect();
      return rect.right>bounds.left&&rect.left<bounds.right&&rect.bottom>bounds.top&&rect.top<bounds.bottom
        ? [{left:rect.left-bounds.left,top:rect.top-bounds.top,width:rect.width,height:rect.height}] : [];
    });
    setOccupiedControls(previous=>JSON.stringify(previous)===JSON.stringify(occupied)?previous:occupied);
  });
  useLayoutEffect(() => {
    if (frame.embeddedApp) return;
    const iframe = iframeRef.current;
    if (iframe) return registerInteractiveHtmlFrame(frame.elementId, iframe, {
      lessonId:frame.lessonId, materialId:frame.materialId, entry:frame.entry, sourceUrl:frame.sourceUrl, title:frame.title,
    });
  }, [frame.elementId, frame.embeddedApp, frame.entry, frame.lessonId, frame.materialId, frame.sourceUrl, frame.title,sourceUrl]);
  useLayoutEffect(()=>{
    if(frame.embeddedApp&&iframeRef.current)return registerAppMirrorFrame(frame.elementId,frame.embeddedApp.id,iframeRef.current);
  },[frame.elementId,frame.embeddedApp,sourceUrl,appAllowed]);
  const titlebar = getInteractiveHtmlTitlebarProjection(frame.height, frame.zoom, frame.contentOnly ? 0 : interactiveHtmlTitlebarHeight);
  const content = frame.pageOrientation ? htmlPageProjection(frame.width,frame.height,frame.pageOrientation) : getInteractiveHtmlContentProjection(
    frame.width,
    frame.height,
    frame.zoom,
    frame.contentZoom,
    frame.contentOnly ? 0 : interactiveHtmlTitlebarHeight,
  );
  const cover = getInteractiveHtmlCoverProjection(frame.width, frame.height, frame.coverRect);
  const frameStyle = {
    "--interactive-html-canvas-scale": frame.zoom,
    "--interactive-html-corner-radius": `${interactiveHtmlCornerRadius}px`,
    "--interactive-html-content-zoom": frame.contentZoom,
    "--interactive-html-titlebar-height": `${titlebar.viewportHeight}px`,
    height: frame.height,
    left: frame.centerX,
    top: frame.centerY,
    transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
    width: frame.width,
  } as CSSProperties;
  const visibilityStyle = { clipPath: cover.clipPath } as CSSProperties;
  const contentStyle = {
    height: content.surfaceHeight,
    top: titlebar.viewportHeight,
    transform: `scale(${content.scale})`,
    width: content.surfaceWidth,
  } as CSSProperties;
  const hasSelectedAnnotation = frame.annotations.some((annotation) => annotation.selected);
  useEffect(()=>{
    if(frame.embeddedApp||cover.fullyCovered||!iframeRef.current)return;
    return bindSentenceCheckFrame(iframeRef.current,sourceUrl);
  },[sourceUrl,frame.embeddedApp,cover.fullyCovered]);
  const annotationClipId = `interactive-html-annotation-clip-${frame.elementId}`;
  const annotationClipUrl = `url(#${annotationClipId})`;

  const geometry = useMemo(() => ({
    angle: frame.angle,
    centerX: frame.centerX,
    centerY: frame.centerY,
    contentScale: content.scale,
    height: frame.height,
    titlebarHeight: titlebar.viewportHeight,
    width: frame.width,
  }), [content.scale, frame.angle, frame.centerX, frame.centerY, frame.height, frame.width, titlebar.viewportHeight]);

  const syncPanMode = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: "tafelraum:interactive-pan-mode",
      enabled: canvasPanActive,
    }, "*");
    iframeRef.current?.contentWindow?.postMessage({
      type: "tafelraum:interactive-material-move-mode", enabled: Boolean(canvasSelectionActive && !canvasToolActive),
    }, "*");
  }, [canvasPanActive, canvasSelectionActive, canvasToolActive, frame.embeddedApp]);

  useEffect(() => syncPanMode(), [syncPanMode]);

  useEffect(() => {
    const reset = { x: 0, y: 0 };
    setScrollOffset(reset);
    onScrollChange(frame.elementId, reset);
  }, [frame.elementId, frame.sourceUrl, onScrollChange]);

  useEffect(() => {
    if (!frame.embeddedApp || !appAllowed) return;
    setAppLoadState("loading");
    const timeout = window.setTimeout(() => setAppLoadState((current) => current === "ready" ? current : "unavailable"), 10_000);
    return () => window.clearTimeout(timeout);
  }, [frame.embeddedApp, frame.sourceUrl, appAllowed]);

  useEffect(() => {
    const receiveBridgeMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (frame.embeddedApp) {
        if (event.origin !== new URL(frame.sourceUrl).origin) return;
        if(event.data?.type==='tafelraum:app-view'){receiveAppMirror(frame.elementId,event.data);return;}
        if (event.data?.type === "tafelraum:app-ready" && event.data?.appId === frame.embeddedApp.id) {
          setAppLoadState("ready");
          appMirrorFrameReady(frame.elementId);
          syncPanMode();
          return;
        }
      }
      const zoomMessage = parseInteractiveHtmlZoomMessage(event.data);
      const wheelPanMessage = parseInteractiveHtmlWheelPanMessage(event.data);
      const panMessage = parseInteractiveHtmlPanMessage(event.data);
      const materialMoveMessage = parseInteractiveHtmlMaterialMoveMessage(event.data);
      const scrollMessage = parseInteractiveHtmlScrollMessage(event.data);
      if (scrollMessage && !frame.embeddedApp) {
        const nextOffset = { x: scrollMessage.scrollX, y: scrollMessage.scrollY };
        setScrollOffset(nextOffset);
        onScrollChange(frame.elementId, nextOffset);
        return;
      }
      const message = zoomMessage ?? wheelPanMessage ?? panMessage ?? materialMoveMessage;
      if (!message) return;
      const localX = message.clientX * geometry.contentScale;
      const localY = geometry.titlebarHeight + message.clientY * geometry.contentScale;
      const offsetX = localX - geometry.width / 2;
      const offsetY = localY - geometry.height / 2;
      const cosine = Math.cos(geometry.angle);
      const sine = Math.sin(geometry.angle);
      const viewportPoint = {
        x: geometry.centerX + offsetX * cosine - offsetY * sine,
        y: geometry.centerY + offsetX * sine + offsetY * cosine,
      };
      if (materialMoveMessage) onMaterialMove(frame.elementId, materialMoveMessage, viewportPoint);
      else if (zoomMessage) onZoomWheel(zoomMessage, viewportPoint);
      else if (wheelPanMessage) onPanWheel(wheelPanMessage, viewportPoint);
      else if (panMessage) onBackgroundPan(frame.elementId, panMessage, viewportPoint);
    };
    window.addEventListener("message", receiveBridgeMessage);
    return () => window.removeEventListener("message", receiveBridgeMessage);
  }, [frame.contentZoom, frame.elementId, frame.embeddedApp, frame.sourceUrl, geometry, onBackgroundPan, onMaterialMove, onPanWheel, onScrollChange, onZoomWheel, syncPanMode]);

  const controlsLayer = iframeRef.current?.closest(".interactive-html-canvas-layer");
  return (
    <div
      className={`interactive-html-canvas-frame is-borderless${frame.embeddedApp ? " is-embedded-app" : ""}${frame.selected ? " is-selected" : ""}${frame.locked ? " is-locked" : ""}${materialShadow ? " has-material-shadow" : ""}${cover.fullyCovered ? " is-fully-covered" : ""}${canvasToolActive ? " defers-to-canvas-tool" : ""}${hasSelectedAnnotation && !annotationDragActive ? " has-selected-annotation" : ""}`}
      data-canvas-element-id={frame.elementId}
      style={frameStyle}
    >
      {frame.selected && canvasSelectionActive && !canvasToolActive && !frame.locked && !cover.fullyCovered &&
        <div className="interactive-html-canvas-frame__move-outline" aria-hidden="true">
          {['n','e','s','w'].flatMap(edge=>['before','after'].map(half=><span
            key={`${edge}-${half}`} className={`interactive-html-canvas-frame__move-edge at-${edge} is-${half}`}
            onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();onMoveStart(event,frame.elementId);}}
          />))}
        </div>}
      {frame.selected && !canvasToolActive && !cover.fullyCovered && (frame.locked || frame.embeddedApp) && controlsLayer && createPortal(
        <div className="interactive-html-canvas-frame__floating-controls is-viewport-control" role="group" aria-label={frame.embeddedApp ? frame.title : t("Interaktives Material")}
          style={interactiveHtmlControlsPosition(frame,58,58,occupiedControls)}
          onContextMenu={event=>onContextMenu(event,frame.elementId)}>
          {frame.locked ? <button type="button" className="interactive-html-canvas-frame__unlock"
            aria-label={t("Arbeitsblatt entsperren")} title={t("Gesperrt – Arbeitsblatt entsperren")}
            onPointerDown={event=>{event.preventDefault();event.stopPropagation();}}
            onClick={()=>onUnlock(frame.elementId)}><Lock aria-hidden="true" size={20}/></button> : <>
            {frame.embeddedApp && <a className="interactive-html-canvas-frame__open-app" href={frame.embeddedApp.directUrl} target="_blank" rel="noreferrer"
              aria-label={t("{0} im Browser öffnen", frame.title)} title={t("{0} im Browser öffnen", frame.title)}><ExternalLink aria-hidden="true" size={20}/></a>}
          </>}
        </div>,controlsLayer)}
      <div className="interactive-html-canvas-frame__visibility" style={visibilityStyle}>
        {appAllowed && frame.embeddedApp && appLoadState !== "ready" && <span
          className={`interactive-html-canvas-frame__app-status is-${appLoadState} is-overlay`} role="status">
          {appLoadState === "loading" ? <LoaderCircle aria-hidden="true"/> : <TriangleAlert aria-hidden="true"/>}
          {appLoadState === "loading" ? t("Wird verbunden") : t("Nicht erreichbar")}
          {appLoadState === "unavailable" && <a href={frame.embeddedApp.directUrl} target="_blank" rel="noreferrer"
            aria-label={t("{0} im Browser öffnen", frame.title)} title={t("{0} im Browser öffnen", frame.title)}><ExternalLink aria-hidden="true"/></a>}
        </span>}
        <div className="interactive-html-canvas-frame__layout-surface" style={frame.pageOrientation ? contentStyle : {display:"contents"}}>
        {appAllowed && <iframe
          key={sourceUrl}
          inert={!frame.embeddedApp&&htmlPlaybackRestoring(frame.elementId)}
          ref={iframeRef}
          className="interactive-html-canvas-frame__content"
          style={frame.pageOrientation ? {width:content.surfaceWidth,height:content.surfaceHeight,top:0} : contentStyle}
          sandbox={frame.embeddedApp
            ? "allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
            : "allow-scripts"}
          allow={frame.embeddedApp ? "clipboard-write" : sourceUrl.includes('tafelraum-playback=local')?'fullscreen *':undefined}
          allowFullScreen={!frame.embeddedApp&&sourceUrl.includes('tafelraum-playback=local')}
          referrerPolicy="no-referrer"
          src={sourceUrl}
          title={frame.title}
          onLoad={() => {
            syncPanMode();
            if(frame.embeddedApp)appMirrorFrameReady(frame.elementId);
            if (!frame.embeddedApp) interactiveHtmlFrameLoaded(frame.elementId);
          }}
        />}
        </div>
      </div>
      {frame.annotations.length > 0 && (
        <svg
          className="interactive-html-canvas-frame__annotations"
          viewBox={`0 0 ${frame.sceneWidth} ${frame.sceneHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <clipPath id={annotationClipId}>
              <rect y={titlebar.viewportHeight / frame.zoom} width={frame.sceneWidth} height={Math.max(0, frame.sceneHeight - titlebar.viewportHeight / frame.zoom)}/>
            </clipPath>
          </defs>
          <g clipPath={annotationClipUrl}>
          {frame.annotations.map((annotation) => {
            const scrollTranslation = getInteractiveHtmlAnnotationScrollTranslation(
              annotation.scrollAnchor,
              scrollOffset,
              frame.contentZoom,
              frame.pageOrientation ? content.scale / frame.zoom : undefined,
            );
            if (annotation.kind === "stroke") {
              const points = annotation.points.length > 1
                ? annotation.points.map((point) => `${point.x},${point.y}`).join(" ")
                : `${annotation.points[0]?.x ?? 0},${annotation.points[0]?.y ?? 0} ${(annotation.points[0]?.x ?? 0) + 0.01},${(annotation.points[0]?.y ?? 0) + 0.01}`;
              return (
                <g key={annotation.id} transform={`translate(${scrollTranslation.x} ${scrollTranslation.y})`}>
                  <g key="stroke-content">
                    {annotation.nativeInk ? <path
                      // The public 0.18.1 helper only reads the five fields in
                      // nativeInk. Reuse its actual outline rather than drawing
                      // a thinner, differently smoothed HTML polyline.
                      d={getFreeDrawSvgPath(annotation.nativeInk as ExcalidrawFreeDrawElement)}
                      transform={`translate(${annotation.x} ${annotation.y}) rotate(${annotation.angle * 180 / Math.PI}) translate(${-annotation.width / 2} ${-annotation.height / 2})`}
                      fill={annotation.strokeColor}
                      opacity={annotation.opacity}
                    /> : <polyline
                      fill={annotation.fillColor ?? "none"}
                      opacity={annotation.opacity}
                      points={points}
                      stroke={annotation.strokeColor}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={annotation.strokeWidth}
                    />}
                    <polyline
                      className={`interactive-html-canvas-frame__annotation-hit${annotation.fillColor ? " interactive-html-canvas-frame__annotation-hit--filled" : ""}`}
                      fill={annotation.fillColor ? "transparent" : "none"}
                      points={points}
                      strokeWidth={Math.max(annotation.strokeWidth, 18 / frame.zoom)}
                      onPointerDown={(event) => onAnnotationPointerDown(event, annotation.id)}
                    />
                  </g>
                  {annotation.selected && <AnnotationSelectionBox annotation={annotation} zoom={frame.zoom}/>}
                </g>
              );
            }
            return (
              <g key={annotation.id} transform={`translate(${scrollTranslation.x} ${scrollTranslation.y})`}>
                <g
                  key="text-content"
                  transform={`translate(${annotation.x} ${annotation.y}) rotate(${annotation.angle * 180 / Math.PI}) translate(${-annotation.width / 2} ${-annotation.height / 2})`}
                >
                  <foreignObject
                    pointerEvents="none"
                    width={annotation.width}
                    height={annotation.height}
                    opacity={annotation.opacity}
                  >
                    <div
                      className="interactive-html-canvas-frame__annotation-text"
                      style={{
                        color: annotation.color,
                        fontSize: annotation.fontSize,
                        lineHeight: annotation.lineHeight,
                        textAlign: annotation.textAlign,
                      }}
                    >
                      {annotation.text}
                    </div>
                  </foreignObject>
                  {/* WebKit does not reliably hit a foreignObject with passive HTML children. */}
                  <rect className="interactive-html-canvas-frame__annotation-text-hit"
                    width={annotation.width} height={annotation.height} fill="transparent"
                    onPointerDown={(event) => onAnnotationPointerDown(event, annotation.id)}/>
                </g>
                {/* Single-text handles are shared above the material and native canvas. */}
              </g>
            );
          })}
          </g>
        </svg>
      )}
    </div>
  );
}
