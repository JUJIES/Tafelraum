import { t, useUiLocale } from "./i18n";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { changeNote, flushNotes, noteDraft, notesRequest, recoverNotes, retryNote, subscribeNotes, type LessonNotes, type NoteRow, type Roster } from './student-notes';
import './student-notes.css';

export type NotesAnchor = { left: number; top: number; right: number; bottom: number };
function Popup({ anchor, title, onClose, children }: { anchor: NotesAnchor; title: string; onClose(): void; children: React.ReactNode }) {
  useUiLocale();
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const [position, setPosition] = useState({ left: 0, top: 0, maxHeight: 500 });
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const place = () => {
      const width = Math.min(360, window.innerWidth - 24);
      const top = Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - 220));
      setPosition({ left: Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12)),
        top, maxHeight: Math.max(0, window.innerHeight - top - 12) });
    };
    place(); window.addEventListener('resize', place);
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) closeRef.current(); };
    // Opening pointer must finish before installing the outside-click handler.
    const timer = setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    root.current?.focus();
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', place); previous?.focus(); };
  }, [anchor]);
  return createPortal(<div ref={root} className="student-notes-popup" role="dialog" aria-label={title} tabIndex={-1}
    style={position} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}>
    <header><strong>{title}</strong><button type="button" aria-label={t("Schließen")} onClick={onClose}><X size={18}/></button></header>{children}
  </div>, document.querySelector(".app-shell") ?? document.querySelector("#root") ?? document.body);
}

type NameRow = { key: string; id?: string; displayName: string };
export function CourseStudentsEditor({ classId, anchor, onClose }: { classId: string; anchor: NotesAnchor; onClose(): void }) {
  useUiLocale();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [rows, setRows] = useState<NameRow[]>([]);
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const request = useRef({ id: crypto.randomUUID(), body: '' });
  const dirty = useRef(false), savingRef = useRef(false);
  useEffect(() => { let cancelled = false;
    void notesRequest<Roster>(`classes/${encodeURIComponent(classId)}/students`).then(value => {
      if (cancelled) return; setRoster(value); setRows([...value.students.filter(p => !p.archivedAt).map(p => ({ key: p.id, id: p.id, displayName: p.displayName })), { key: crypto.randomUUID(), displayName: '' }]);
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [classId]);
  function close() { if (!savingRef.current && (!dirty.current || window.confirm(t("Änderungen an der Namensliste verwerfen?")))) onClose(); }
  return <Popup anchor={anchor} title={t("Schüler:innen bearbeiten")} onClose={close}>
    <p className="student-notes-hint">{t("Ein Name pro Zeile")}</p>
    <form onSubmit={async e => {
      e.preventDefault(); if (!roster || saving) return;
      const students = rows.filter(r => r.displayName.trim()).map(({ id, displayName }) => ({ ...(id ? { id } : {}), displayName }));
      const body = JSON.stringify(students);
      if (body !== request.current.body) request.current = { id: crypto.randomUUID(), body };
      setSaving(true); savingRef.current = true; setError('');
      try { await notesRequest(`classes/${encodeURIComponent(classId)}/students`, { students, requestId: request.current.id }, roster.revision);
        dirty.current = false; onClose();
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen."); }
      finally { setSaving(false); savingRef.current = false; }
    }}>
      <div className="student-names-list">{rows.map((row, index) => <input key={row.key} aria-label={t("Name {0}", index + 1)} maxLength={100} disabled={saving}
        value={row.displayName} placeholder={index === rows.length - 1 ? t("Name hinzufügen") : t("Name")} autoComplete="off"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault();
          const fields = e.currentTarget.parentElement?.querySelectorAll('input');
          fields?.[index + 1]?.focus();
        } }}
        onPaste={e => {
          const names = e.clipboardData.getData('text').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          if (!row.id && !row.displayName && names.length > 1) { e.preventDefault(); dirty.current = true;
            setRows(current => [...current.slice(0, index), ...names.map((displayName, offset) => ({ key: offset === 0 ? row.key : crypto.randomUUID(), displayName })), { key: crypto.randomUUID(), displayName: '' }, ...current.slice(index + 1)]);
          }
        }}
        onChange={e => { dirty.current = true; const value = e.target.value;
          setRows(current => [...current.map(r => r.key === row.key ? { ...r, displayName: value } : r), ...(index === current.length - 1 && value ? [{ key: crypto.randomUUID(), displayName: '' }] : [])]);
        }}/>)}</div>
      {!roster && !error && <p role="status">{t("Wird geladen…")}</p>}
      {error && <p className="student-notes-error" role="alert">{t(error)}</p>}
      <footer><button type="button" disabled={saving} onClick={() => { dirty.current = false; onClose(); }}>{t("Abbrechen")}</button>
        <button className="student-notes-primary" type="submit" disabled={!roster || saving}>{saving ? t("Speichern…") : t("Übernehmen")}</button></footer>
    </form>
  </Popup>;
}
function GrowingNote({ row, data }: { row: NoteRow; data: LessonNotes }) {
  useUiLocale();
  const field = useRef<HTMLTextAreaElement>(null);
  const draft = noteDraft(data, row), value = draft?.draft.text ?? row.text;
  useEffect(() => { const el = field.current; if (el) { el.style.height = '0px'; el.style.height = `${el.scrollHeight}px`; } }, [value]);
  return <div className="student-note-row"><label><span>{row.displayName}{row.archived && <small> {t("(ehemalig)")}</small>}</span>
    <textarea ref={field} rows={1} value={value} maxLength={10000} aria-label={t("Notiz für {0}", row.displayName)} placeholder={t("Notiz…")}
      onChange={e => changeNote(data, row, e.target.value)} onBlur={() => { void flushNotes(); }}/></label>
    {draft?.error && <div className="student-notes-error" role="alert">{t(draft.error)} <button type="button" onClick={() => {
      void retryNote(data, row).catch(e => window.alert(e.message));
    }}>{draft.conflict ? t("Konflikt prüfen") : t("Erneut versuchen")}</button></div>}
  </div>;
}
export function StudentNotes({ lessonId, anchor, onClose, onEditStudents }: { lessonId: string; anchor: NotesAnchor; onClose(): void; onEditStudents(classId: string): void }) {
  useUiLocale();
  const [data, setData] = useState<LessonNotes | null>(null), [error, setError] = useState('');
  const [, update] = useState(0);
  useEffect(() => subscribeNotes(() => update(n => n + 1)), []);
  useEffect(() => { let cancelled = false;
    void notesRequest<LessonNotes>(`lessons/${encodeURIComponent(lessonId)}/student-notes`).then(result => {
      if (!cancelled) { setData(result); recoverNotes(result); }
    }).catch(e => { if (!cancelled) setError(e.message); });
    const saved = (event: Event) => { const d = (event as CustomEvent).detail;
      if (d.lessonId === lessonId) setData(current => current && ({ ...current, rows: current.rows.map(row => row.studentId === d.studentId ? { ...row, text: d.text, revision: d.revision } : row) }));
    };
    window.addEventListener('tafelraum-note-saved', saved);
    return () => { cancelled = true; window.removeEventListener('tafelraum-note-saved', saved); void flushNotes(); };
  }, [lessonId]);
  return <Popup title={t("Stundennotizen")} anchor={anchor} onClose={onClose}>
    {!data && !error && <p role="status">{t("Wird geladen…")}</p>}
    {error && <p className="student-notes-error" role="alert">{t(error)}</p>}
    {data && (data.rows.length ? <div className="student-notes-list">{data.rows.map(row => <GrowingNote key={row.studentId} row={row} data={data}/>)}</div>
      : <div className="student-notes-empty"><button type="button" onClick={() => onEditStudents(data.classId)}>{t("Namen hinterlegen")}</button></div>)}
  </Popup>;
}
