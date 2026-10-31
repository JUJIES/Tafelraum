import { t, useUiLocale } from "../i18n";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { timerDisplayTime, timerRemainingMs, type TimerAction, type TimerWidget } from './timer';
import { parseTimerDuration, timerDialAngleAtPoint, timerDialArc, timerDialDuration, timerDialFraction, timerDialFractionAtPoint,
  timerDialLabels, timerDialLocalPoint, timerDialPoint, timerDialStops, timerDurationLabel } from './timer-dial';

type Props = { widget: TimerWidget; onAction?(id: string, action: TimerAction, revision: number): void;
  disabled: boolean; configurationDisabled: boolean; readOnly?: boolean };

/** Shared teacher/Room surface: gestures preview locally and commit once. */
export function TimerFace({ widget, onAction, disabled, configurationDisabled, readOnly = false }: Props) {
  useUiLocale();
  const [, refreshClock] = useState(0);
  const timeId = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);
  const gesture = useRef<{ pointerId: number; revision: number; seconds: number; angle: number } | null>(null);
  const latest = useRef({ widget, disabled, configurationDisabled, onAction });
  latest.current = { widget, disabled, configurationDisabled, onAction };
  const cancelGesture = () => { gesture.current = null; setDraft(null); };
  useEffect(() => {
    cancelGesture(); setEditing(false); setInvalid(false);
  }, [widget.id, widget.revision, disabled, configurationDisabled]);
  useEffect(() => {
    const cancel = () => { gesture.current = null; setDraft(null); };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);
  useEffect(() => {
    if (widget.status !== 'running') return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const tick = () => refreshClock(version => version + 1);
    let interval = setInterval(tick, motion.matches ? 1000 : 50);
    const change = () => { clearInterval(interval); interval = setInterval(tick, motion.matches ? 1000 : 50); };
    motion.addEventListener('change', change);
    return () => { clearInterval(interval); motion.removeEventListener('change', change); };
  }, [widget.status, widget.deadline]);

  const running = widget.status === 'running';
  const blocked = readOnly || disabled || configurationDisabled || running || editing;
  const now = Date.now();
  const remaining = timerRemainingMs(widget, now);
  const selection = draft ?? widget.durationSeconds;
  const fraction = timerDialFraction(selection);
  const knob = timerDialPoint(fraction);
  const circumference = 2 * Math.PI * 96;
  const display = draft === null ? timerDisplayTime(widget, now)
    : timerDisplayTime({ ...widget, status: 'ready', remainingMs: draft * 1000, deadline: null }, now);
  const action = (value: TimerAction, revision = widget.revision) => onAction?.(widget.id, value, revision);
  const commit = (seconds: number, revision = widget.revision) => {
    const current = latest.current;
    if (current.disabled || current.configurationDisabled || current.widget.status === 'running' || current.widget.revision !== revision) return;
    if (seconds === current.widget.durationSeconds && current.widget.status === 'ready') return;
    current.onAction?.(current.widget.id, { type: 'duration', seconds }, revision);
  };
  const pointerDuration = (event: ReactPointerEvent<HTMLDivElement>, previousAngle?: number) => {
    const point = timerDialLocalPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect(), widget.angle);
    return { seconds: timerDialDuration(timerDialFractionAtPoint(point, previousAngle)), angle: timerDialAngleAtPoint(point, previousAngle) };
  };
  return <>
    <div className={`timer-widget__dial${running ? ' is-running' : ''}${widget.status === 'finished' ? ' is-finished' : ''}`}
      onPointerDown={event => {
        if (blocked || gesture.current || !event.isPrimary || event.button !== 0
          || (event.target as Element).closest('.timer-widget__time, .timer-widget__editor')) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        const stop = (event.target as Element).closest<HTMLButtonElement>('[data-duration]');
        const selected = stop ? { seconds: Number(stop.dataset.duration), angle: -225 + timerDialFraction(Number(stop.dataset.duration)) * 270 } : pointerDuration(event);
        gesture.current = { pointerId: event.pointerId, revision: widget.revision, ...selected };
        setDraft(selected.seconds);
      }} onPointerMove={event => {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const next = pointerDuration(event, current.angle);
        current.seconds = next.seconds; current.angle = next.angle; setDraft(current.seconds);
      }} onPointerUp={event => {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        gesture.current = null; setDraft(null);
        event.currentTarget.releasePointerCapture(event.pointerId);
        commit(current.seconds, current.revision);
      }} onPointerCancel={cancelGesture} onLostPointerCapture={cancelGesture}>
      <svg viewBox="0 0 300 292" aria-hidden="true">
        <circle className="timer-widget__face" cx="150" cy="146" r="91"/>
        {running || readOnly ? <>
          <circle className="timer-widget__trail" cx="150" cy="146" r="96"/>
          <circle className="timer-widget__progress" cx="150" cy="146" r="96" strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, remaining / (widget.durationSeconds * 1000))))}
            transform="rotate(-90 150 146)"/>
        </> : <>
          <path className="timer-widget__trail" d={timerDialArc(1)}/>
          <path className="timer-widget__progress" d={timerDialArc(fraction)} opacity={fraction > 0 ? 1 : 0}/>
          {timerDialStops.map((seconds, index) => {
            const a = timerDialPoint(index / 10, 81), b = timerDialPoint(index / 10, 86);
            return <line key={seconds} className="timer-widget__tick" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>;
          })}
          <circle className="timer-widget__knob" cx={knob.x} cy={knob.y} r="8"/>
        </>}
      </svg>
      {!running && !readOnly && timerDialStops.map((seconds, index) => {
        const point = timerDialPoint(index / 10, 122);
        return <button key={seconds} type="button" className="timer-widget__stop" data-duration={seconds}
          style={{ left: point.x, top: point.y }} disabled={blocked}
          aria-label={timerDurationLabel(seconds)} aria-pressed={selection === seconds}
          onClick={event => { if (event.detail === 0) commit(seconds); }}>
          <span>{timerDialLabels[index]}</span>
        </button>;
      })}
      {editing ? <form className="timer-widget__editor" onSubmit={event => {
        event.preventDefault(); const seconds = parseTimerDuration(text);
        if (seconds === null) { setInvalid(true); return; }
        setEditing(false); commit(seconds);
      }} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') { setEditing(false); setInvalid(false); } }}>
        <input aria-label={t("Dauer in Minuten:Sekunden")} aria-invalid={invalid} aria-describedby={invalid ? `${timeId}-error` : undefined}
          autoFocus value={text} maxLength={7} onFocus={event => event.currentTarget.select()}
          disabled={disabled || configurationDisabled} onChange={event => { setText(event.target.value); setInvalid(false); }}/>
        <div className="timer-widget__editor-actions">
          <button type="submit" aria-label={t("Übernehmen")} disabled={disabled || configurationDisabled}><Check aria-hidden="true"/></button>
          <button type="button" aria-label={t("Abbrechen")} onClick={() => { setEditing(false); setInvalid(false); }}><X aria-hidden="true"/></button>
        </div>
        {invalid && <span id={`${timeId}-error`} className="timer-widget__validation" role="alert">{t("1 Sekunde bis 24 Stunden · Minuten:Sekunden")}</span>}
      </form> : <button type="button" className="timer-widget__time" role={readOnly?'timer':undefined} aria-label={readOnly?t("Verbleibende Zeit"):t("Dauer einstellen")} aria-describedby={timeId}
        disabled={readOnly || disabled || configurationDisabled || running || draft !== null} onClick={() => {
          setText(`${Math.floor(widget.durationSeconds / 60)}:${String(widget.durationSeconds % 60).padStart(2, '0')}`); setEditing(true);
        }}>
        <span id={timeId} role={readOnly?undefined:'timer'} aria-live="off" className={display.length > 5 ? 'is-long' : undefined}>{display}</span>
        <small>{widget.status === 'finished' ? t("Zeit abgelaufen") : widget.status === 'paused' && draft === null ? t("Pausiert") : t("Minuten")}</small>
      </button>}
    </div>
    {!readOnly && <div className="timer-widget__actions">
      <button className="timer-widget__secondary" type="button" aria-label={t("Zurücksetzen")} title={t("Zurücksetzen")}
        disabled={disabled || editing || draft !== null} onClick={() => action({ type: 'reset' })}><RotateCcw aria-hidden="true"/></button>
      <button className="timer-widget__start" type="button" disabled={disabled || editing || draft !== null}
        onClick={() => action({ type: running ? 'pause' : 'start' })}>{running ? 'Pause' : widget.status === 'paused' ? t("Weiter") : t("Starten")}</button>
      <button className="timer-widget__secondary" type="button" aria-label={widget.soundEnabled ? t("Ton ausschalten") : t("Ton einschalten")}
        title={widget.soundEnabled ? t("Ton ausschalten") : t("Ton einschalten")} aria-pressed={widget.soundEnabled}
        disabled={disabled || configurationDisabled || editing || draft !== null}
        onClick={() => action({ type: 'sound', enabled: !widget.soundEnabled })}>
        {widget.soundEnabled ? <Volume2 aria-hidden="true"/> : <VolumeX aria-hidden="true"/>}
      </button>
    </div>}
  </>;
}
