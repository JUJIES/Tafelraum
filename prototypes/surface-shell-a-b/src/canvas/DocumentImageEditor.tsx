import { t, useUiLocale } from "../i18n";
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle } from 'lucide-react';
import type { DataURL } from '@excalidraw/excalidraw/types';
import type { NormalizedImageCropRect } from './image-crop';
import { documentPreviewGeometry, documentQuadFromRect, wholeDocumentQuad, moveDocumentCorner, isWholeDocumentQuad, type DocumentQuad } from './document-perspective';
import './document-image.css';

export type DocumentImageResult = { dataURL: DataURL; width: number; height: number; rect: NormalizedImageCropRect; uncertain: boolean };
export const wholeDocumentPhoto = { x: 0, y: 0, width: 1, height: 1 };

export async function requestDocumentImage(source: DataURL, signal: AbortSignal): Promise<DocumentImageResult> {
  const response = await fetch('/api/document-image/process', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tafelraum-Document-Image': '1' },
    body: JSON.stringify({ dataURL: source }), signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t("Bild konnte nicht verbessert werden."));
  if (!result.dataURL?.startsWith('data:image/png;base64,') || !Number.isInteger(result.width) || result.width <= 0
    || !Number.isInteger(result.height) || result.height <= 0 || !validDocumentRect(result.rect)) {
    throw new Error(t("Die Bildverbesserung hat ein ungültiges Ergebnis geliefert."));
  }
  return result;
}

function validDocumentRect(rect: NormalizedImageCropRect) {
  return rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    && rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0
    && rect.x + rect.width <= 1.000001 && rect.y + rect.height <= 1.000001;
}

export type DocumentImageSelection = { image: DocumentImageResult; originalDataURL?: DataURL };

async function requestPerspective(source: DataURL, enhanced: DataURL, quad: DocumentQuad, signal: AbortSignal): Promise<PerspectivePair> {
  const response = await fetch('/api/document-image/perspective', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tafelraum-Document-Image': '1' },
    body: JSON.stringify({ dataURL: enhanced, originalDataURL: source, quad }), signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t("Der Ausschnitt konnte nicht entzerrt werden."));
  if (!result.dataURL?.startsWith('data:image/png;base64,') || !result.originalDataURL?.startsWith('data:image/png;base64,')
    || !Number.isInteger(result.width) || result.width <= 0 || !Number.isInteger(result.height) || result.height <= 0) {
    throw new Error(t("Die Entzerrung hat ein ungültiges Ergebnis geliefert."));
  }
  return result;
}

type PerspectivePair = { dataURL: DataURL; originalDataURL: DataURL; width: number; height: number };
const cornerNames = ['Oben links', 'Oben rechts', 'Unten rechts', 'Unten links'];

export function DocumentImageEditor({ source, result, fixedRect, angle, mirrorX, mirrorY, saving, error, onCancel, onApply }: {
  source: DataURL; result: DocumentImageResult | null; fixedRect: NormalizedImageCropRect | null;
  angle: number; mirrorX: boolean; mirrorY: boolean;
  saving: boolean; error: string | null; onCancel(): void;
  onApply(selection: DocumentImageSelection): void;
}) {
  useUiLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const [quad, setQuad] = useState<DocumentQuad>(wholeDocumentQuad);
  const [activeCorner, setActiveCorner] = useState(0);
  const [original, setOriginal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pair, setPair] = useState<PerspectivePair | null>(null);
  const [warping, setWarping] = useState(false);
  const [warpError, setWarpError] = useState<string | null>(null);
  const warpJob = useRef<AbortController | null>(null);
  const drag = useRef<number | null>(null);
  useEffect(() => { if (result) { setQuad(documentQuadFromRect(fixedRect ?? result.rect)); setPair(null); setPreview(false); } }, [result, fixedRect]);
  useEffect(() => {
    const element = dialog.current; const previous = document.activeElement;
    element?.showModal();
    return () => { warpJob.current?.abort(); element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const width = result?.width ?? 1, height = result?.height ?? 1;
  const blocked = saving || warping;
  const busy = !result && !error;
  const changeCorner = (index: number, x: number, y: number) => {
    const next = moveDocumentCorner(quad, index, {x,y});
    if (next === quad) return;
    setQuad(next); setPreview(false); setPair(null); setWarpError(null);
  };
  const makePreview = async () => {
    if (!result || blocked || warpJob.current) return;
    if (fixedRect || isWholeDocumentQuad(quad) || pair) { setPreview(true); return; }
    const controller = new AbortController(); warpJob.current = controller;
    setWarping(true); setWarpError(null);
    try {
      const transformed = await requestPerspective(source, result.dataURL, quad, controller.signal);
      if (!controller.signal.aborted) { setPair(transformed); setPreview(true); }
    } catch (reason) {
      if (!controller.signal.aborted) setWarpError(reason instanceof Error ? reason.message : "Der Ausschnitt konnte nicht entzerrt werden.");
    } finally { if (warpJob.current===controller) { warpJob.current=null; setWarping(false); } }
  };
  const displayWidth = preview && pair ? pair.width : width;
  const displayHeight = preview && pair ? pair.height : height;
  const area = preview && fixedRect ? {x:fixedRect.x*width,y:fixedRect.y*height,width:fixedRect.width*width,height:fixedRect.height*height}
    : {x:0,y:0,width:displayWidth,height:displayHeight};
  const geometry = documentPreviewGeometry(area, angle);
  const bounds = geometry.bounds;
  const displayed = preview && pair ? (original ? pair.originalDataURL : pair.dataURL) : original || !result ? source : result.dataURL;
  const path = quad.map((point,index)=>`${index===0?'M':'L'}${point.x*width},${point.y*height}`).join(' ')+'Z';
  const apply = () => {
    if (!result || blocked || !preview) return;
    onApply(pair ? {image:{...result,dataURL:pair.dataURL,width:pair.width,height:pair.height},originalDataURL:pair.originalDataURL} : {image:result});
  };
  return createPortal(<dialog ref={dialog} className="document-image-dialog" aria-labelledby="document-image-title"
    onCancel={event => { event.preventDefault(); if (!saving) onCancel(); }} onKeyDown={event => event.stopPropagation()}>
    <form onSubmit={event => { event.preventDefault(); if (preview) apply(); else void makePreview(); }}>
      <h2 id="document-image-title">{t("Bild verbessern")}</h2>
      {busy ? <div className="document-image-loading" role="status"><LoaderCircle aria-hidden="true"/><span>{t("Bild wird verbessert …")}</span></div>
        : result && <>
          <div className="document-image-options">
            <div role="group" aria-label={t("Darstellung")}>
              <button type="button" disabled={blocked} aria-pressed={original} onClick={() => setOriginal(true)}>Original</button>
              <button type="button" disabled={blocked} aria-pressed={!original} onClick={() => setOriginal(false)}>{t("Verbessert")}</button>
            </div>
            {preview ? <button type="button" disabled={blocked} onClick={() => setPreview(false)}>{t("Zuschnitt bearbeiten")}</button>
              : !fixedRect && <button type="button" disabled={blocked} onClick={()=>{setQuad(wholeDocumentQuad);setPair(null);setWarpError(null);}}>{t("Ganzes Foto")}</button>}
          </div>
          <div className="document-image-stage">
            <div className="document-image-stage-inner" ref={stage}
              style={{ aspectRatio: bounds.width / bounds.height, width: `min(100%, ${64 * bounds.width / bounds.height}vh, calc((100dvh - 360px) * ${bounds.width / bounds.height}))` }}>
              <svg viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label={preview ? t("Vorschau des gerade ausgerichteten Blatts") : t("Bild mit vier einzeln verschiebbaren Ecken")}>
                <defs><clipPath id={clipId}><rect x={area.x} y={area.y} width={area.width} height={area.height}/></clipPath></defs>
                <g transform={`rotate(${angle * 180 / Math.PI} ${geometry.center.x} ${geometry.center.y})`}><g clipPath={`url(#${clipId})`}>
                <image href={displayed} width={displayWidth} height={displayHeight} transform={`translate(${mirrorX ? displayWidth : 0} ${mirrorY ? displayHeight : 0}) scale(${mirrorX ? -1 : 1} ${mirrorY ? -1 : 1})`}/>
                {!preview && <>
                  <path fill="rgba(0,0,0,.5)" fillRule="evenodd" d={`M0,0H${width}V${height}H0Z ${path}`}/>
                  <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                </>}
                </g></g>
              </svg>
              {!preview && !fixedRect && !blocked && quad.map((point,index) => {
                const displayedPoint=geometry.toDisplay({x:point.x*width,y:point.y*height});
                return <button type="button" key={index}
                className="document-image-handle" aria-label={t("Zuschnitt: {0}", cornerNames[index])} aria-pressed={activeCorner===index}
                style={{ left: `${(displayedPoint.x-bounds.x)/bounds.width * 100}%`, top: `${(displayedPoint.y-bounds.y)/bounds.height * 100}%` }}
                onFocus={()=>setActiveCorner(index)}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); drag.current=index; setActiveCorner(index); }}
                onPointerMove={event => {
                  if (drag.current!==index || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const bounds=stage.current?.getBoundingClientRect(); if (!bounds) return;
                  const sourcePoint=geometry.toSource({x:geometry.bounds.x+(event.clientX-bounds.left)/bounds.width*geometry.bounds.width,
                    y:geometry.bounds.y+(event.clientY-bounds.top)/bounds.height*geometry.bounds.height});
                  changeCorner(index,sourcePoint.x/width,sourcePoint.y/height);
                }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
                onKeyDown={event => {
                  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
                  event.preventDefault(); const step=event.shiftKey?10:1;
                  const sourcePoint=geometry.toSource({x:displayedPoint.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),
                    y:displayedPoint.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)});
                  changeCorner(index,sourcePoint.x/width,sourcePoint.y/height);
                }}><span/></button>;})}
            </div>
          </div>
          {fixedRect && <p>{t("Vorhandener Zuschnitt, Spiegelung und Annotationen bleiben an ihrer Position. Nur das Bild wird verbessert.")}</p>}
          {!fixedRect && !preview && result.uncertain && <p>{t("Blattrand teilweise außerhalb des Fotos.")}</p>}
        </>}
      {warping && <p role="status">{t("Blatt wird gerade ausgerichtet …")}</p>}
      {(error || warpError) && <p role="alert">{t(error || warpError || "")}</p>}
      <footer><button type="button" onClick={onCancel} disabled={saving}>{t("Abbrechen")}</button>
        <button type="submit" className="document-image-primary" disabled={!result || blocked || Boolean(error)}>
          {saving?t("Wird gespeichert …"):warping?t("Wird ausgerichtet …"):preview?t("Anwenden"):t("Vorschau ansehen")}
        </button></footer>
    </form>
  </dialog>, document.body);
}
