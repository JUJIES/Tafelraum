import { t } from "./i18n/translate.ts";
export type Student = { id: string; displayName: string; archivedAt: string | null };
export type Roster = { archiveKey: string; classId: string; students: Student[]; revision: string | null };
export type NoteRow = { studentId: string; displayName: string; archived: boolean; text: string; revision: string | null };
export type LessonNotes = { archiveKey: string; lessonId: string; classId: string; rows: NoteRow[] };
export class NotesError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function notesRequest<T>(url: string, value?: unknown, revision?: string | null): Promise<T> {
  const response = await fetch(`/api/archive/${url}`, { method: value === undefined ? 'GET' : 'PUT',
    cache: 'no-store', signal: AbortSignal.timeout(15000), headers: {
      'X-Tafelraum-Student-Notes': '1', ...(value === undefined ? {} : { 'Content-Type': 'application/json',
        ...(revision === null ? { 'If-None-Match': '*' } : { 'If-Match': revision ?? '' }) }),
    }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
  const result = await response.json();
  if (!response.ok) throw new NotesError(result.error ?? 'Speichern fehlgeschlagen.', response.status);
  return result as T;
}

type Draft = { archiveKey: string; lessonId: string; classId: string; studentId: string; text: string; revision: string | null; sequence: string };
type Pending = { draft: Draft; timer?: ReturnType<typeof setTimeout>; busy: boolean; error: string; conflict: boolean };
const prefix = 'tafelraum-private-note-outbox-v1:';
const pending = new Map<string, Pending>();
const listeners = new Set<() => void>();
const keyOf = (d: Pick<Draft, 'archiveKey' | 'lessonId' | 'studentId'>) => `${prefix}${d.archiveKey}:${d.lessonId}:${d.studentId}`;
const emit = () => listeners.forEach(fn => fn());
export const subscribeNotes = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const notesStatus = () => [...pending.values()].some(p => p.error) ? 'error' : pending.size ? 'saving' : 'saved';
export function noteDraft(data: LessonNotes, row: NoteRow) { return pending.get(keyOf({ ...data, studentId: row.studentId })); }
export function recoverNotes(data: LessonNotes) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`${prefix}${data.archiveKey}:`) || pending.has(key)) continue;
    try {
      const d: Draft = JSON.parse(localStorage.getItem(key)!);
      if (key !== keyOf(d) || d.archiveKey !== data.archiveKey || typeof d.text !== 'string' || d.text.length > 10000
        || !/^[\w.-]+$/.test(d.lessonId) || !/^[\w.-]+$/.test(d.studentId)) continue;
      pending.set(key, { draft: d, busy: false, error: '', conflict: false });
      void send(key);
    } catch { /* Preserve an unreadable recovery record; never silently overwrite it. */ }
  }
  emit();
}
async function send(key: string) {
  const item = pending.get(key);
  if (!item || item.busy || item.conflict) return;
  clearTimeout(item.timer); item.busy = true; item.error = ''; emit();
  const sent = { ...item.draft };
  let followUp = false;
  try {
    const result = await notesRequest<NoteRow>(`lessons/${encodeURIComponent(sent.lessonId)}/student-notes/${encodeURIComponent(sent.studentId)}`, { text: sent.text }, sent.revision);
    // An acknowledgement of an older input never removes a newer draft.
    if (item.draft.sequence !== sent.sequence) {
      item.draft.revision = result.revision;
      localStorage.setItem(key, JSON.stringify(item.draft));
      followUp = true; return;
    }
    localStorage.removeItem(key); pending.delete(key);
    window.dispatchEvent(new CustomEvent('tafelraum-note-saved', { detail: { ...sent, revision: result.revision } }));
  } catch (error) {
    item.error = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
    item.conflict = error instanceof NotesError && error.status === 409;
  } finally { item.busy = false; emit(); if (followUp) void send(key); }
}
export function changeNote(data: LessonNotes, row: NoteRow, text: string) {
  const key = keyOf({ ...data, studentId: row.studentId });
  const item = pending.get(key) ?? { draft: { ...data, studentId: row.studentId, text, revision: row.revision, sequence: '' }, busy: false, error: '', conflict: false };
  item.draft = { archiveKey: data.archiveKey, lessonId: data.lessonId, classId: data.classId, studentId: row.studentId,
    text, revision: item.draft.revision, sequence: crypto.randomUUID() };
  pending.set(key, item);
  try { localStorage.setItem(key, JSON.stringify(item.draft)); if (!item.conflict) item.error = '';  }
  catch { item.error = 'Entwurf konnte nicht zwischengespeichert werden. Bitte dieses Fenster offen lassen.'; }
  clearTimeout(item.timer); item.timer = setTimeout(() => { void send(key); }, 650); emit();
}
export async function flushNotes() {
  await Promise.all([...pending.keys()].map(send));
  while ([...pending.values()].some(item => item.busy)) {
    await new Promise<void>(resolve => {
      const stop = subscribeNotes(() => {
        if (![...pending.values()].some(item => item.busy)) { stop(); resolve(); }
      });
    });
  }
  if (pending.size) throw new Error("Stundennotizen sind noch nicht gespeichert.");
}
export async function retryNote(data: LessonNotes, row: NoteRow) {
  const item = noteDraft(data, row); if (!item) return;
  if (item.conflict) {
    const latest = await notesRequest<LessonNotes>(`lessons/${encodeURIComponent(data.lessonId)}/student-notes`);
    const current = latest.rows.find(r => r.studentId === row.studentId);
    if (!current) throw new Error('Person wurde nicht gefunden.');
    if (!window.confirm(t("Inzwischen gespeicherter Text:\n{0}\n\nDiesen Text durch deinen angezeigten Entwurf ersetzen?", current.text || '(leer)'))) return;
    item.draft.revision = current.revision; item.conflict = false;
    localStorage.setItem(keyOf(item.draft), JSON.stringify(item.draft));
  }
  await send(keyOf(item.draft));
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushNotes().catch(() => {}); });
  window.addEventListener('beforeunload', event => { if (pending.size) { event.preventDefault(); } });
}
