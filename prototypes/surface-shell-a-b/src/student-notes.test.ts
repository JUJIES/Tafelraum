import test from 'node:test';
import assert from 'node:assert/strict';

// The outbox is origin-local draft storage; the archive remains authoritative.
const storage = new Map<string, string>();
Object.assign(globalThis, { localStorage: {
  get length() { return storage.size; }, key: (i: number) => [...storage.keys()][i] ?? null,
  getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k),
}, window: new EventTarget() });
const notes = await import('./student-notes.ts');
const row = { studentId: 'alex', displayName: 'Alex', archived: false, text: '', revision: null };
const lesson = { archiveKey: 'archive', lessonId: 'one', classId: 'course', rows: [row] };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

test('autosave acknowledges only the sent sequence and keeps a newer draft bound to the old lesson', async () => {
  const sent: { url: string; value: { text: string }; revision: string | null }[] = [];
  let release!: (r: Response) => void;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sent.push({ url, value: JSON.parse(init.body as string), revision: (init.headers as Record<string, string>)['If-Match'] ?? null });
    if (sent.length === 1) return new Promise<Response>(resolve => { release = resolve; });
    return response({ ...row, revision: 'rev2', text: 'new' });
  }) as typeof fetch;
  notes.changeNote(lesson, row, 'old');
  const saving = notes.flushNotes();
  notes.changeNote(lesson, row, 'new');
  assert.equal(storage.size, 1);
  release(response({ ...row, text: 'old', revision: 'rev1' }));
  await saving; await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(sent.length, 2); assert.equal(sent[1].revision, 'rev1');
  assert.equal(sent[1].value.text, 'new'); assert.match(sent[1].url, /lessons\/one\//);
  assert.equal(storage.size, 0); assert.equal(notes.notesStatus(), 'saved');
});
test('network failures retain the complete draft; retry confirms only after the archive commit', async () => {
  globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
  notes.changeNote(lesson, row, 'must survive'); await assert.rejects(notes.flushNotes(), /noch nicht gespeichert/);
  assert.equal(notes.notesStatus(), 'error'); assert.equal(storage.size, 1);
  const draft = JSON.parse([...storage.values()][0]);
  assert.equal(draft.lessonId, 'one'); assert.equal(draft.classId, 'course'); assert.equal(draft.text, 'must survive');
  assert.ok(!JSON.stringify(draft).includes('displayName'));
  globalThis.fetch = (async () => response({ ...row, text: 'must survive', revision: 'rev3' })) as typeof fetch;
  await notes.flushNotes(); assert.equal(storage.size, 0);
});
test('final flush waits for an existing autosave and its newer follow-up', async () => {
  const releases: ((r: Response) => void)[]=[];
  globalThis.fetch=(async()=>new Promise<Response>(resolve=>releases.push(resolve))) as typeof fetch;
  notes.changeNote(lesson,row,'first');
  const saving=notes.flushNotes();
  notes.changeNote(lesson,row,'latest');
  let complete=false;
  const closing=notes.flushNotes().then(()=>{complete=true;});
  releases[0](response({...row,revision:'r4'}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(releases.length,2);assert.equal(complete,false);
  releases[1](response({...row,revision:'r5'}));
  await Promise.all([saving,closing]);assert.equal(complete,true);assert.equal(storage.size,0);
});
test('recovery is archive scoped and stale revisions never silently overwrite', async () => {
  const key = 'tafelraum-private-note-outbox-v1:archive:one:alex';
  storage.set(key, JSON.stringify({ archiveKey: 'archive', lessonId: 'one', classId: 'course', studentId: 'alex', text: 'recovered', revision: null, sequence: 's1' }));
  storage.set('tafelraum-private-note-outbox-v1:other:one:alex', JSON.stringify({ archiveKey: 'other', text: 'private other archive' }));
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return response({ error: 'Conflict' }, 409); }) as typeof fetch;
  notes.recoverNotes(lesson); await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(calls, 1); assert.equal(notes.noteDraft(lesson, row)?.conflict, true);
  notes.changeNote(lesson, row, 'still mine'); await assert.rejects(notes.flushNotes(), /noch nicht gespeichert/);
  assert.equal(calls, 1); assert.equal(notes.notesStatus(), 'error'); assert.equal(storage.size, 2);
});
