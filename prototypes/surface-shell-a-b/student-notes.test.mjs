import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, symlink, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { createStudentNotesStore } from './student-notes-store.mjs';
import { createArchiveMiddleware } from './archive-server.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tafelraum-student-notes-'));
  const archive = { format: 'tafelraum-unterrichtsarchiv', schemaVersion: 1,
    classes: [{ id: 'course', label: 'Testkurs' }, { id: 'other', label: 'Anderer Kurs' }], catalog: {
      version: 1, subjects: [{ id: 'bio', classId: 'course', label: 'Biologie' }], series: [], hiddenLessonIds: [], trash: [],
      lessons: ['one', 'two', 'undated'].map(id => ({ id, classId: 'course', subjectId: 'bio', seriesId: 'nerves', title: id,
        metadata: { scheduledFor: id === 'undated' ? null : id === 'one' ? '2026-10-28' : '2026-10-29' } })) } };
  await writeFile(path.join(root, 'archive.json'), JSON.stringify(archive));
  const middleware = createArchiveMiddleware(root);
  const server = http.createServer((q, s) => { void middleware(q, s, () => { s.writeHead(404); s.end(); }); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise(r => server.close(r)); await rm(root, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function api(url, body, revision, extra = {}) {
    const response = await fetch(`${origin}/api/archive/${url}`, { method: body === undefined ? 'GET' : 'PUT', headers: {
      'X-Tafelraum-Student-Notes': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json',
        ...(revision === null ? { 'If-None-Match': '*' } : revision ? { 'If-Match': revision } : {}) }), ...extra,
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, value: await response.json() };
  }
  async function people() {
    const result = await api('classes/course/students', { students: [{ displayName: 'Alex' }, { displayName: 'Kim' }], requestId: 'initial' }, null);
    assert.equal(result.status, 200); return result.value;
  }
  return { root, archive, api, people, origin };
}
test('reads are side-effect free; exact teacher origin and custom header are required', async t => {
  const { root, api, origin } = await fixture(t);
  assert.equal((await api('classes/course/students')).status, 200);
  assert.equal((await api('lessons/one/student-notes')).status, 200);
  assert.deepEqual(await readdir(root), ['archive.json']);
  for (const extra of [{ Origin: 'null' }, { Origin: 'http://127.0.0.1:1' }, { 'Sec-Fetch-Site': 'same-site' }, { 'X-Tafelraum-Student-Notes': '' }]) {
    assert.equal((await api('classes/course/students', undefined, undefined, extra)).status, 403);
  }
  assert.equal((await api('classes/course/students', undefined, undefined, { Origin: origin })).status, 200);
});
test('rename and reorder retain identity, removal archives people and preserves their notes', async t => {
  const { api, people } = await fixture(t); const roster = await people();
  const [alex, kim] = roster.students;
  await api(`lessons/one/student-notes/${alex.id}`, { text: 'Synapse erklärt' }, null);
  const saved = await api('classes/course/students', { students: [{ id: kim.id, displayName: 'Kim' }, { id: alex.id, displayName: 'Alex neu' }], requestId: 'rename' }, roster.revision);
  assert.equal(saved.status, 200);
  assert.equal((await api('lessons/one/student-notes')).value.rows[1].text, 'Synapse erklärt');
  await api('classes/course/students', { students: [{ id: kim.id, displayName: 'Kim' }], requestId: 'remove' }, saved.value.revision);
  const old = (await api('lessons/one/student-notes')).value.rows.find(r => r.studentId === alex.id);
  assert.equal(old.archived, true); assert.equal(old.displayName, 'Alex neu');
  assert.equal((await api('lessons/two/student-notes')).value.rows.length, 1);
});
test('new person retries are idempotent, unknown IDs and stale roster revisions are rejected', async t => {
  const { api } = await fixture(t);
  const input = { students: [{ displayName: 'Alex' }], requestId: 'retry' };
  const first = await api('classes/course/students', input, null);
  const retry = await api('classes/course/students', input, null);
  assert.deepEqual(retry, first);
  assert.equal((await api('classes/course/students', { ...input, requestId: 'stale' }, null)).status, 409);
  assert.equal((await api('classes/course/students', { students: [{ id: 'unknown', displayName: 'Sam' }], requestId: 'bad' }, first.value.revision)).status, 400);
  assert.equal((await api('classes/course/students', { ...input, requestId: 'missing' })).status, 428);
});
test('per-person revisions allow independent saves and detect concurrent edits; blank notes create nothing', async t => {
  const { api, people, root } = await fixture(t); const { students } = await people();
  const a = students[0].id, b = students[1].id;
  await api(`lessons/one/student-notes/${a}`, { text: '' }, null);
  await assert.rejects(readFile(path.join(root, '_private/student-notes/lessons/one.json')), { code: 'ENOENT' });
  const [one, two] = await Promise.all([api(`lessons/one/student-notes/${a}`, { text: 'A' }, null), api(`lessons/one/student-notes/${b}`, { text: 'B' }, null)]);
  assert.equal(one.status, 200); assert.equal(two.status, 200);
  assert.equal((await api(`lessons/one/student-notes/${a}`, { text: 'stale' }, null)).status, 409);
  assert.equal((await api(`lessons/one/student-notes/${a}`, { text: 'A' }, null)).status, 200);
  assert.equal((await api(`lessons/one/student-notes/${a}`, { text: 'A2' }, one.value.revision)).status, 200);
  assert.equal((await api('lessons/one/student-notes/unknown', { text: 'bad' }, null)).status, 404);
  assert.equal((await api(`lessons/missing/student-notes/${a}`, { text: 'bad' }, null)).status, 404);
});
test('corrupt private files are not overwritten; symlinks and encoded traversal are denied', async t => {
  const { api, root } = await fixture(t);
  await mkdir(path.join(root, '_private/student-notes/classes'), { recursive: true });
  const target = path.join(root, '_private/student-notes/classes/course.json');
  await writeFile(target, '{broken');
  assert.equal((await api('classes/course/students')).status, 422);
  assert.equal((await api('classes/course/students', { students: [], requestId: 'no' }, null)).status, 422);
  assert.equal(await readFile(target, 'utf8'), '{broken');
  await rm(target); await symlink(path.join(root, 'archive.json'), target);
  assert.equal((await api('classes/course/students')).status, 403);
  assert.equal((await api('classes/..%2Farchive/students')).status, 400);
});
test('structured query filters, pagination, undated records and readonly CLI use the same domain', async t => {
  const { api, root, people } = await fixture(t); const { students } = await people();
  for (const lesson of ['one', 'two', 'undated']) await api(`lessons/${lesson}/student-notes/${students[0].id}`, { text: lesson }, null);
  const q = (await api('student-notes?classId=course&limit=1')).value;
  assert.equal(q.entries.length, 1); assert.ok(q.nextCursor); assert.equal(q.undatedCount, 1);
  const next = (await api(`student-notes?classId=course&limit=1&cursor=${encodeURIComponent(q.nextCursor)}`)).value;
  assert.notEqual(next.entries[0].lessonId, q.entries[0].lessonId);
  assert.equal((await api('student-notes?classId=course&from=2026-10-29')).value.entries.length, 1);
  assert.equal((await api('student-notes?classId=course&from=2026-02-30')).status, 400);
  const before = await readFile(path.join(root, 'archive.json'), 'utf8');
  const output = JSON.parse(execFileSync(process.execPath, ['../../scripts/read-student-notes.mjs', '--archive-root', root, '--class-id', 'course'], { encoding: 'utf8' }));
  assert.equal(output.entries.length, 3); assert.equal(output.entries[0].subjectName, 'Biologie');
  assert.equal(await readFile(path.join(root, 'archive.json'), 'utf8'), before);
  const catalog = await api('');
  assert.ok(!JSON.stringify(catalog.value).includes('Synapse erklärt'));
  assert.ok(!Object.hasOwn(catalog.value, 'students'));
});

test('full archive restore preserves private identities; trash and class scoping remain authoritative', async t => {
  const { api, root, archive, people, origin } = await fixture(t);
  const roster = await people(); const id = roster.students[0].id;
  await api(`lessons/one/student-notes/${id}`, { text: 'PRIVATE_NOTE_SENTINEL' }, null);
  const catalog = await (await fetch(`${origin}/api/archive`)).json();
  assert.ok(!JSON.stringify(catalog).includes('PRIVATE_NOTE_SENTINEL'));
  assert.ok(!JSON.stringify(catalog).includes(id));
  assert.equal((await api('student-notes?classId=other')).value.entries.length, 0);
  const target = await mkdtemp(path.join(os.tmpdir(), 'tafelraum-private-restore-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  await cp(root, target, { recursive: true });
  const restored = createStudentNotesStore({ archiveRoot: target });
  const recovered = await restored.getLessonNotes('one');
  assert.equal(recovered.rows[0].studentId, id); assert.equal(recovered.rows[0].text, 'PRIVATE_NOTE_SENTINEL');
  assert.equal(await readFile(path.join(target, '_private/student-notes/lessons/one.json'), 'utf8'),
    await readFile(path.join(root, '_private/student-notes/lessons/one.json'), 'utf8'));
  archive.catalog.trash.push({ kind: 'lesson', id: 'one' });
  await writeFile(path.join(root, 'archive.json'), JSON.stringify(archive));
  assert.equal((await api('lessons/one/student-notes')).status, 404);
  assert.equal((await api('student-notes?classId=course')).value.entries.length, 0);
  archive.catalog.trash = []; await writeFile(path.join(root, 'archive.json'), JSON.stringify(archive));
  assert.equal((await api('lessons/one/student-notes')).value.rows[0].text, 'PRIVATE_NOTE_SENTINEL');
});
