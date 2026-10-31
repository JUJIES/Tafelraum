import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { sceneCoordsToViewportCoords } from "@excalidraw/excalidraw";
import type { AppState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types";
import { layoutRichText, paintRichText, rebaseRichText } from "./rich-text";
import { richTextOf } from "./rich-text-scene";
import { richTextCaretRect, richTextLineAtY, richTextOffsetAtPoint, richTextParagraphRange, richTextSelectionRects, richTextWordRange } from "./rich-text-selection";

type Props = {
  element: ExcalidrawTextElement;
  appState: AppState;
  root: HTMLDivElement;
  selectionRevision: number;
  onSelectionChange: () => void;
  onPreviewPainted: (textId: string) => void;
  fontRevision: number;
  initialDoubleClick?: { textId: string; clientX: number; clientY: number; altKey: boolean } | null;
  onInitialDoubleClickHandled: () => void;
};

/** The native textarea owns keyboard input, IME, clipboard and undo. This layer
 * maps pointer selection to the same glyph positions used by the rendition. */
export function RichTextSelectionOverlay({ element, appState, root, selectionRevision, onSelectionChange, onPreviewPainted, fontRevision, initialDoubleClick, onInitialDoubleClickHandled }: Props) {
  const [pointerRevision, setPointerRevision] = useState(0);
  const dragAnchor = useRef<{ pointerId: number; offset: number } | null>(null);
  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const editor = appState.editingTextElement?.id === element.id
    ? root.querySelector<HTMLTextAreaElement>("textarea.excalidraw-wysiwyg") : null;
  const stored = richTextOf(element);
  const value = editor?.value ?? element.originalText ?? element.text;
  const richText = stored && stored.text !== value ? rebaseRichText(stored, value) : stored;
  const wrap = Boolean(element.containerId) || !element.autoResize;
  const layout = useMemo(() => richText ? layoutRichText(richText, element.width, wrap, element.lineHeight) : null,
    [richText, element.width, wrap, element.lineHeight, fontRevision]);
  const zoom = appState.zoom.value;
  const localPointFromClient = (clientX: number, clientY: number, bounds: DOMRect, width: number, height: number) => {
    const cx = bounds.left + bounds.width / 2, cy = bounds.top + bounds.height / 2;
    const dx = clientX - cx, dy = clientY - cy;
    const cos = Math.cos(-element.angle), sin = Math.sin(-element.angle);
    return { x: (dx * cos - dy * sin + width / 2) / zoom,
      y: (dx * sin + dy * cos + height / 2) / zoom };
  };
  useLayoutEffect(() => {
    const canvas = previewCanvas.current;
    if (!canvas || !layout || !fontRevision) return;
    const density = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.ceil(layout.width * zoom * density));
    canvas.height = Math.max(1, Math.ceil(layout.height * zoom * density));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(zoom * density, zoom * density);
    paintRichText(context, layout, element.lineHeight);
    onPreviewPainted(element.id);
  }, [layout, zoom, element.lineHeight, element.id, fontRevision, onPreviewPainted]);
  useLayoutEffect(() => {
    if (!editor || !layout || initialDoubleClick?.textId !== element.id || !overlay.current) return;
    const bounds = overlay.current.getBoundingClientRect();
    const point = localPointFromClient(initialDoubleClick.clientX, initialDoubleClick.clientY, bounds,
      overlay.current.offsetWidth, overlay.current.offsetHeight);
    const offset = richTextOffsetAtPoint(layout, point.x, point.y);
    const range = initialDoubleClick.altKey ? richTextWordRange(value, offset) : richTextParagraphRange(value, offset);
    editor.focus({ preventScroll: true });
    editor.setSelectionRange(range.start, range.end);
    onInitialDoubleClickHandled();
    setPointerRevision(revision => revision + 1);
    onSelectionChange();
  }, [editor, initialDoubleClick, layout, element.id, value, onInitialDoubleClickHandled, onSelectionChange]);
  if (!richText || !layout) return null;
  // Both revisions intentionally make textarea-only selection changes visible.
  void selectionRevision; void pointerRevision;
  const rootBounds = root.getBoundingClientRect();
  const topLeft = sceneCoordsToViewportCoords({ sceneX: element.x, sceneY: element.y }, appState);
  const start = editor?.selectionStart ?? 0, end = editor?.selectionEnd ?? 0;
  const rectangles = editor ? richTextSelectionRects(layout, start, end) : [];
  const caret = editor ? richTextCaretRect(layout, end) : null;

  const localPoint = (event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    return localPointFromClient(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(),
      event.currentTarget.offsetWidth, event.currentTarget.offsetHeight);
  };
  const updateSelection = (from: number, to: number) => {
    if (!editor) return;
    editor.focus({ preventScroll: true });
    editor.setSelectionRange(Math.min(from, to), Math.max(from, to), from > to ? "backward" : "forward");
    setPointerRevision(revision => revision + 1);
    onSelectionChange();
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!editor) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const point = localPoint(event);
    const offset = richTextOffsetAtPoint(layout, point.x, point.y);
    if (event.detail >= 3) {
      const line = richTextLineAtY(layout, point.y);
      updateSelection(line.start, line.end);
      dragAnchor.current = null;
    } else if (event.detail === 2) {
      const paragraph = event.altKey ? richTextWordRange(value, offset) : richTextParagraphRange(value, offset);
      updateSelection(paragraph.start, paragraph.end);
      dragAnchor.current = null;
    } else {
      const anchor = event.shiftKey ? editor.selectionStart : offset;
      updateSelection(anchor, offset);
      dragAnchor.current = { pointerId: event.pointerId, offset: anchor };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!editor) return;
    const drag = dragAnchor.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const point = localPoint(event);
    updateSelection(drag.offset, richTextOffsetAtPoint(layout, point.x, point.y));
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragAnchor.current?.pointerId !== event.pointerId) return;
    dragAnchor.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.stopPropagation();
  };

  return <div
    ref={overlay}
    className={`rich-text-selection-overlay${editor ? "" : " is-preview-only"}`}
    aria-hidden="true"
    style={{
      left: topLeft.x - rootBounds.left,
      top: topLeft.y - rootBounds.top,
      width: layout.width * zoom,
      height: layout.height * zoom,
      transform: `rotate(${element.angle}rad)`,
    }}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerEnd}
    onPointerCancel={onPointerEnd}
    onDoubleClick={event => {
      event.preventDefault(); event.stopPropagation();
      const point = localPoint(event);
      const offset = richTextOffsetAtPoint(layout, point.x, point.y);
      const paragraph = event.altKey ? richTextWordRange(value, offset) : richTextParagraphRange(value, offset);
      updateSelection(paragraph.start, paragraph.end);
    }}
  >
    <canvas className="rich-text-live-preview" ref={previewCanvas} style={{ width: layout.width * zoom, height: layout.height * zoom, visibility: fontRevision ? "visible" : "hidden" }}/>
    {rectangles.map((rect, index) => <div className="rich-text-selection-mark" key={index} style={{ left: rect.x * zoom, top: rect.y * zoom, width: rect.width * zoom, height: rect.height * zoom }}/>) }
    {editor && caret && start === end && <div className="rich-text-selection-caret" style={{ left: caret.x * zoom, top: caret.y * zoom, width: Math.max(1.5, caret.width * zoom), height: caret.height * zoom }}/>} 
  </div>;
}
