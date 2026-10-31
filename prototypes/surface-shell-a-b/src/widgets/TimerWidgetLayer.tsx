import { t, useUiLocale } from "../i18n";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { sceneCoordsToViewportCoords, viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { MonitorUp } from 'lucide-react';
import { isTimerWidget, timerHeight, timerWidth,
  type TimerAction, type TimerRuntime, type TimerState, type TimerWidget } from './timer';
import { TimerFace } from './TimerFace';
import './timer-widget.css';

const emptyStates: readonly TimerState[] = [];
const noSubscribe = () => () => undefined;
const emptySnapshot = () => emptyStates;
export type TimerGeometry = Pick<TimerWidget, 'x' | 'y' | 'width' | 'height' | 'angle'>;
type Props = {
  api: ExcalidrawImperativeAPI;
  runtime?: TimerRuntime;
  widgets?: readonly TimerWidget[];
  disabled?: boolean;
  readOnly?: boolean;
  onShow?(id:string):void;
  onAction?(id: string, action: TimerAction, revision: number): void;
  onMoveStart?(event: ReactPointerEvent<HTMLElement>, id: string): void;
  onTransform?(id: string, version: number, geometry: TimerGeometry): void;
  onContextMenu?(event: React.MouseEvent<HTMLDivElement>, id: string): void;
};

/** Both windows derive every pixel from native scene geometry, never a second stored frame. */
export function TimerWidgetLayer({ api, runtime, widgets = [], onAction, onMoveStart, onTransform, onContextMenu, disabled = false, readOnly = false, onShow }: Props) {
  useUiLocale();
  const states = useSyncExternalStore(runtime?.subscribe ?? noSubscribe, runtime?.getSnapshot ?? emptySnapshot);
  const [, refresh] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ widget: TimerWidget; pointerId: number; startX: number; startY: number; dx: number; dy: number } | null>(null);
  useEffect(() => {
    const changed = () => refresh(version => version + 1);
    const change = api.onChange(changed), scroll = api.onScrollChange(changed);
    let gestureFrame = 0;
    const finishedGesture = () => {
      cancelAnimationFrame(gestureFrame);
      gestureFrame = requestAnimationFrame(changed);
    };
    window.addEventListener('pointerup', finishedGesture, true);
    window.addEventListener('pointercancel', finishedGesture, true);
    window.addEventListener('blur', finishedGesture);
    const observer = new ResizeObserver(changed);
    if (root.current) observer.observe(root.current);
    return () => {
      change(); scroll(); observer.disconnect(); cancelAnimationFrame(gestureFrame);
      window.removeEventListener('pointerup', finishedGesture, true);
      window.removeEventListener('pointercancel', finishedGesture, true);
      window.removeEventListener('blur', finishedGesture);
    };
  }, [api]);
  const statesById = new Map(states.map(state => [state.id, state]));
  const current = runtime ? api.getSceneElements().flatMap(element => {
    const state = statesById.get(element.id);
    return state && isTimerWidget(element) ? [{ ...state, x: element.x, y: element.y, width: element.width, height: element.height,
      angle: element.angle, version: element.version }] : [];
  }) : widgets;
  const state = api.getAppState();
  const rect = root.current?.getBoundingClientRect();
  return <div ref={root} className="timer-widget-layer">
    {current.map(widget => {
      const display = drag?.widget.id === widget.id ? { ...widget, x: widget.x + drag.dx, y: widget.y + drag.dy } : widget;
      const center = sceneCoordsToViewportCoords({ sceneX: display.x + display.width / 2, sceneY: display.y + display.height / 2 }, state);
      const scale = Math.min(display.width / timerWidth, display.height / timerHeight) * state.zoom.value;
      const style = { left: center.x - (rect?.left ?? 0), top: center.y - (rect?.top ?? 0),
        width: timerWidth, height: timerHeight,
        '--timer-edge-scale': 1 / scale,
        transform: `translate(-50%, -50%) rotate(${display.angle}rad) scale(${scale})` } as CSSProperties;
      const locked = api.getSceneElements().find(element => element.id === widget.id)?.locked ?? false;
      const movable = !readOnly && !disabled && !locked && Boolean(onMoveStart || onTransform);
      const selectionMode = onTransform ? true : state.activeTool.type === 'selection';
      const selected = Boolean(state.selectedElementIds[widget.id]);
      const startMove = (event: ReactPointerEvent<HTMLElement>) => {
        if (!movable || !selectionMode || event.button !== 0 || !event.isPrimary) return;
        event.preventDefault(); event.stopPropagation();
        if (onMoveStart) { onMoveStart(event, widget.id); return; }
        if (!onTransform) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = viewportCoordsToSceneCoords(event, api.getAppState());
        setDrag({ widget, pointerId: event.pointerId, startX: point.x, startY: point.y, dx: 0, dy: 0 });
      };
      return <div key={widget.id} className={`timer-widget${readOnly ? ' is-readonly' : ''}`} data-timer-id={widget.id} style={style}
        onPointerDownCapture={event => {
          const target = event.target as Element;
          if (target.closest('button,input,form,.timer-widget__move-edge')) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const matrix = new DOMMatrixReadOnly(getComputedStyle(event.currentTarget).transform);
          const inverse = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, 0, 0]).inverse();
          const point = new DOMPoint(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)).matrixTransform(inverse);
          const x = point.x + timerWidth / 2, y = point.y + timerHeight / 2;
          // Keep the complete dial and its labels reserved for time selection.
          if (y < 292 && Math.hypot(x - 150, y - 146) <= 150) return;
          startMove(event);
        }}
        onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
        onContextMenu={event => { event.preventDefault(); event.stopPropagation(); onContextMenu?.(event, widget.id); }}
        onPointerMove={event => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            const point = viewportCoordsToSceneCoords(event, api.getAppState());
            setDrag({ ...drag, dx: point.x - drag.startX, dy: point.y - drag.startY });
          }} onPointerUp={event => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            const point = viewportCoordsToSceneCoords(event, api.getAppState());
            const dx = point.x - drag.startX, dy = point.y - drag.startY;
            if (Math.hypot(dx, dy) * state.zoom.value > 3) onTransform?.(widget.id, drag.widget.version,
              { x: drag.widget.x + dx, y: drag.widget.y + dy, width: drag.widget.width, height: drag.widget.height, angle: drag.widget.angle });
            setDrag(null);
          }} onPointerCancel={() => setDrag(null)}>
        {movable && selectionMode && selected && <div className="timer-widget__move-outline" aria-hidden="true">
          {['n','e','s','w'].flatMap(edge => ['before','after'].map(half => <span key={`${edge}-${half}`}
            className={`timer-widget__move-edge at-${edge} is-${half}`} onPointerDown={startMove}/>))}
        </div>}
        {!readOnly&&onShow&&<button type="button" className="timer-widget__show" aria-label={t("Timer zeigen")} title={t("Timer zeigen")}
          disabled={disabled} onClick={()=>onShow(widget.id)}><MonitorUp aria-hidden="true"/></button>}
        <TimerFace widget={widget} readOnly={readOnly} disabled={disabled || !onAction} configurationDisabled={runtime?.isConfigurationBusy() ?? false} onAction={onAction}/>
      </div>;
    })}
  </div>;
}
