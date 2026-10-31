import { createHash, randomUUID } from 'node:crypto';
import { readFile, lstat, chmod } from 'node:fs/promises';
import path from 'node:path';

export class StudentNotesError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (message, status = 400) => { throw new StudentNotesError(status, message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export function studentNotesId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value)) fail('Ungültige Zuordnung.');
  return value;
}
export const studentNotesRevision = value => value === null ? null : `"${createHash('sha256').update(JSON.stringify(value)).digest('hex')}"`;
const timestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const unique = values => new Set(values).size === values.length;
function validPerson(p) {
  return object(p) && typeof p.id === 'string' && typeof p.displayName === 'string' && p.displayName.trim()
    && p.displayName.length <= 100 && timestamp(p.createdAt) && timestamp(p.updatedAt)
    && (p.archivedAt === null || timestamp(p.archivedAt));
}
function validateRoster(doc, classId) {
  if (!object(doc) || doc.schemaVersion !== 1 || doc.classId !== classId || !Array.isArray(doc.students)
    || !doc.students.every(validPerson) || !unique(doc.students.map(p => p.id))) fail('Die gespeicherte Namensliste ist ungültig.', 422);
  doc.students.forEach(p => studentNotesId(p.id));
  return doc;
}
function validateLesson(doc, lesson) {
  if (!object(doc) || doc.schemaVersion !== 1 || doc.lessonId !== lesson.id || doc.classId !== lesson.classId
    || !(doc.scheduledForAtFirstNote === null || validDate(doc.scheduledForAtFirstNote)) || !Array.isArray(doc.notes)
    || !doc.notes.every(n => object(n) && typeof n.text === 'string'
      && n.text.length <= 10000 && timestamp(n.createdAt) && timestamp(n.updatedAt)) || !unique(doc.notes.map(n => n.studentId))) fail('Die gespeicherten Stundennotizen sind ungültig.', 422);
  doc.notes.forEach(n => studentNotesId(n.studentId));
  return doc;
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function visible(archive, lesson) {
  const c = archive.catalog;
  return !(c.hiddenLessonIds ?? []).includes(lesson.id) && !(c.trash ?? []).some(item =>
    (item.kind === 'lesson' && item.id === lesson.id) || (item.kind === 'series' && item.id === lesson.seriesId)
      || (item.kind === 'subject' && item.id === lesson.subjectId));
}

/** One canonical private domain. A missing writer deliberately creates a readonly reader. */
export function createStudentNotesStore({ archiveRoot, readArchive, writeJson, now = () => new Date().toISOString() }) {
  const root = path.resolve(archiveRoot);
  const privateRoot = path.join(root, '_private', 'student-notes');
  const archiveKey = createHash('sha256').update(root).digest('hex');
  let queue = Promise.resolve();
  const transact = work => {
    const result = queue.then(work, work);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
  async function archive() {
    const result = readArchive ? await readArchive() : JSON.parse(await readFile(path.join(root, 'archive.json'), 'utf8'));
    if (result.format !== 'tafelraum-unterrichtsarchiv' || result.schemaVersion !== 1
      || !Array.isArray(result.classes) || !Array.isArray(result.catalog?.lessons)) fail('Das Unterrichtsarchiv ist ungültig.', 422);
    return result;
  }
  async function safeFile(kind, id) {
    studentNotesId(id);
    const target = path.join(privateRoot, kind, `${id}.json`);
    let current = root;
    for (const part of path.relative(root, target).split(path.sep)) {
      current = path.join(current, part);
      const info = await lstat(current).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
      if (info?.isSymbolicLink()) fail('Verknüpfte private Archivpfade sind nicht erlaubt.', 403);
    }
    return target;
  }
  async function read(kind, id) {
    try { return JSON.parse(await readFile(await safeFile(kind, id), 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return null; if (e instanceof SyntaxError) fail('Private Archivdatei ist beschädigt.', 422); throw e; }
  }
  async function write(kind, id, value) {
    if (!writeJson) fail('Dieser Zugriff ist nur lesend.', 405);
    const file = await safeFile(kind, id);
    await writeJson(file, value, { historyRoot: path.join(privateRoot, '.history', kind, id),
      historyPrefix: kind, minimumHistoryIntervalMs: kind === 'lessons' ? 30000 : 0 });
    await chmod(path.join(root, '_private'), 0o700);
    await chmod(file, 0o600);
  }
  function requireClass(a, classId) {
    studentNotesId(classId);
    if (!a.classes.some(c => c.id === classId)) fail('Klasse oder Kurs wurde nicht gefunden.', 404);
  }
  function requireLesson(a, id) {
    studentNotesId(id);
    const lesson = a.catalog.lessons.find(l => l.id === id);
    if (!lesson || !visible(a, lesson)) fail('Unterricht wurde nicht gefunden.', 404);
    requireClass(a, lesson.classId);
    return lesson;
  }
  async function roster(a, classId) {
    requireClass(a, classId);
    const doc = await read('classes', classId);
    return doc === null ? null : validateRoster(doc, classId);
  }
  function rosterView(doc, classId) { return { archiveKey, classId, students: doc?.students ?? [], revision: studentNotesRevision(doc) }; }
  async function getStudents(classId) {
    await queue;
    return rosterView(await roster(await archive(), classId), classId);
  }
  function requireRevision(expected, current) {
    if (expected === undefined) fail('Die geladene Basisrevision fehlt.', 428);
    if (expected !== current) fail('Der Eintrag wurde inzwischen geändert. Der eigene Entwurf bleibt erhalten.', 409);
  }
  async function putStudents(classId, input, expected) {
    return transact(async () => {
      const a = await archive(), old = await roster(a, classId);
      if (!object(input) || !Array.isArray(input.students) || input.students.length > 500
        || typeof input.requestId !== 'string' || !/^[\w-]{1,128}$/.test(input.requestId)) fail('Ungültige Namensliste.');
      const incoming = input.students.map(p => {
        if (!object(p) || typeof p.displayName !== 'string' || !p.displayName.trim() || p.displayName.trim().length > 100
          || /[\r\n]/.test(p.displayName)) fail('Bitte pro Zeile einen Namen mit höchstens 100 Zeichen eingeben.');
        return { ...(p.id ? { id: studentNotesId(p.id) } : {}), displayName: p.displayName.trim().normalize('NFC') };
      });
      if (!unique(incoming.flatMap(p => p.id ? [p.id] : []))) fail('Eine Person wurde mehrfach übergeben.');
      const hash = studentNotesRevision(incoming);
      if (old?.lastMutation?.requestId === input.requestId) {
        if (old.lastMutation.hash !== hash) fail('Dieser Speicherauftrag gehört zu einem anderen Entwurf.', 409);
        return rosterView(old, classId);
      }
      requireRevision(expected, studentNotesRevision(old));
      const previous = new Map((old?.students ?? []).map(p => [p.id, p]));
      const time = now(), included = new Set();
      const students = incoming.map(p => {
        const prior = p.id ? previous.get(p.id) : null;
        if (p.id && !prior) fail('Eine Person gehört nicht zu dieser Kursliste.');
        const id = prior?.id ?? randomUUID(); included.add(id);
        return prior ? { ...prior, displayName: p.displayName, archivedAt: null,
          updatedAt: prior.displayName === p.displayName && prior.archivedAt === null ? prior.updatedAt : time }
          : { id, displayName: p.displayName, archivedAt: null, createdAt: time, updatedAt: time };
      });
      for (const p of previous.values()) if (!included.has(p.id)) students.push(p.archivedAt ? p : { ...p, archivedAt: time, updatedAt: time });
      const next = { schemaVersion: 1, classId, students, lastMutation: { requestId: input.requestId, hash } };
      await write('classes', classId, next);
      return rosterView(next, classId);
    });
  }
  async function context(lessonId) {
    const a = await archive(), lesson = requireLesson(a, lessonId);
    const people = await roster(a, lesson.classId);
    const value = await read('lessons', lessonId);
    const doc = value === null ? null : validateLesson(value, lesson);
    if (doc && doc.notes.some(n => !people?.students.some(p => p.id === n.studentId))) fail('Eine Notiz hat keine gültige Personenzuordnung.', 422);
    return { lesson, people, doc };
  }
  function noteRow(p, note) { return { studentId: p.id, displayName: p.displayName, archived: p.archivedAt !== null,
    text: note?.text ?? '', revision: studentNotesRevision(note ?? null) }; }
  async function getLessonNotes(lessonId) {
    await queue;
    const { lesson, people, doc } = await context(lessonId);
    const notes = new Map((doc?.notes ?? []).map(n => [n.studentId, n]));
    return { archiveKey, lessonId, classId: lesson.classId, rows: (people?.students ?? [])
      .filter(p => p.archivedAt === null || notes.get(p.id)?.text).map(p => noteRow(p, notes.get(p.id))) };
  }
  async function putNote(lessonId, studentId, text, expected) {
    studentNotesId(studentId);
    if (typeof text !== 'string' || text.length > 10000) fail('Die Notiz darf höchstens 10.000 Zeichen enthalten.');
    return transact(async () => {
      const { lesson, people, doc } = await context(lessonId);
      const p = people?.students.find(p => p.id === studentId);
      if (!p) fail('Die Person gehört nicht zum Kurs dieser Stunde.', 404);
      const old = doc?.notes.find(n => n.studentId === studentId) ?? null;
      if ((old?.text ?? '') === text) return { archiveKey, lessonId, ...noteRow(p, old) };
      requireRevision(expected, studentNotesRevision(old));
      if (!old && p.archivedAt !== null) fail('Die Person ist nicht mehr im aktuellen Kurs.', 409);
      const time = now(), nextNote = { studentId, text, createdAt: old?.createdAt ?? time, updatedAt: time };
      const next = doc ?? { schemaVersion: 1, lessonId, classId: lesson.classId,
        scheduledForAtFirstNote: validDate(lesson.metadata?.scheduledFor) ? lesson.metadata.scheduledFor : null, notes: [] };
      next.notes = [...next.notes.filter(n => n.studentId !== studentId), nextNote];
      await write('lessons', lessonId, next);
      return { archiveKey, lessonId, ...noteRow(p, nextNote) };
    });
  }
  async function query(filters = {}) {
    await queue;
    const a = await archive(), classId = studentNotesId(filters.classId);
    const people = await roster(a, classId), byId = new Map((people?.students ?? []).map(p => [p.id, p]));
    for (const key of ['studentId', 'subjectId', 'seriesId']) if (filters[key] !== undefined) studentNotesId(filters[key]);
    for (const key of ['from', 'to']) if (filters[key] !== undefined && !validDate(filters[key])) fail('Ungültiger Datumsfilter.');
    if (filters.from && filters.to && filters.from > filters.to) fail('Ungültiger Zeitraum.');
    const limit = filters.limit === undefined ? 200 : Number(filters.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) fail('Das Abfragelimit muss zwischen 1 und 500 liegen.');
    const scopeHash = studentNotesRevision({ classId, studentId: filters.studentId, subjectId: filters.subjectId, seriesId: filters.seriesId, from: filters.from, to: filters.to });
    let after = '';
    if (filters.cursor) {
      try { const c = JSON.parse(Buffer.from(filters.cursor, 'base64url').toString());
        if (c.scope !== scopeHash || typeof c.after !== 'string') throw new Error(); after = c.after;
      } catch { fail('Ungültiger Abfragecursor.'); }
    }
    const entries = []; let undatedCount = 0;
    const lessons = a.catalog.lessons.filter(l => l.classId === classId && visible(a, l)
      && (!filters.subjectId || l.subjectId === filters.subjectId) && (!filters.seriesId || l.seriesId === filters.seriesId));
    for (const lesson of lessons) {
      const value = await read('lessons', lesson.id);
      if (value === null) continue;
      const doc = validateLesson(value, lesson);
      for (const n of doc.notes) {
        if (!n.text.trim() || (filters.studentId && filters.studentId !== n.studentId)) continue;
        const person = byId.get(n.studentId);
        if (!person) fail('Eine Notiz hat keine gültige Personenzuordnung.', 422);
        if (doc.scheduledForAtFirstNote === null) undatedCount++;
        if ((filters.from || filters.to) && (doc.scheduledForAtFirstNote === null
          || (filters.from && doc.scheduledForAtFirstNote < filters.from) || (filters.to && doc.scheduledForAtFirstNote > filters.to))) continue;
        const key = `${doc.scheduledForAtFirstNote ?? n.createdAt}\t${lesson.id}\t${n.studentId}`;
        entries.push({ ...n, displayName: person.displayName, archivedPerson: person.archivedAt !== null,
          classId, className: a.classes.find(c => c.id === classId)?.label, lessonId: lesson.id, lessonTitle: lesson.title,
          subjectId: lesson.subjectId, subjectName: a.catalog.subjects?.find(s => s.id === lesson.subjectId)?.label ?? '',
          seriesId: lesson.seriesId, scheduledForAtFirstNote: doc.scheduledForAtFirstNote,
          dateBasis: 'lesson-schedule-at-first-note', source: { lessonId: lesson.id, studentId: n.studentId }, key });
      }
    }
    entries.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
    const remaining = entries.filter(e => e.key > after), page = remaining.slice(0, limit);
    return { schemaVersion: 1, archiveKey, entries: page.map(({ key: _key, ...entry }) => entry), undatedCount,
      nextCursor: remaining.length > limit ? Buffer.from(JSON.stringify({ scope: scopeHash, after: page.at(-1).key })).toString('base64url') : null };
  }
  return { getStudents, putStudents, getLessonNotes, putNote, query };
}
