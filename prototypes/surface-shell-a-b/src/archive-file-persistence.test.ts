import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;
const freshArchive = () => import(`./archive-file-persistence.ts?test=${++moduleId}`) as Promise<typeof import("./archive-file-persistence.ts")>;
const snapshot = { schemaVersion: 1 as const, elements: [], viewport: { scrollX: 0, scrollY: 0, zoom: { value: 1 as never } } };
const file = (id: string, data = "AA==") => ({ id: id as never, dataURL: `data:image/png;base64,${data}` as never, mimeType: "image/png" as const, created: 1 });
const ok = (body: unknown = { saved: true, revision: '"r2"' }) => new Response(JSON.stringify(body));

for (const failure of ["offline", "server"] as const) {
  test(`failed ${failure} asset writes reject and remain visible until their retry succeeds`, async t => {
    const archive = await freshArchive();
    let failing = true;
    const batches: string[][] = [];
    const states: string[] = [];
    archive.subscribeArchiveFileState(state => states.push(state));
    t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
      if (url.endsWith("/assets")) {
        batches.push(JSON.parse(String(init?.body)).files.map((entry: { id: string }) => entry.id));
        if (failing) {
          if (failure === "offline") throw new Error("offline");
          return new Response(JSON.stringify({ error: "Disk full" }), { status: 500 });
        }
      }
      return ok({ saved: true, revision: '"r2"', catalog: {}, classes: [] });
    });
    await assert.rejects(archive.saveFileCanvasFiles("source", [file("original")]));
    const expected = failure === "offline" ? "browser-only" : "error";
    assert.equal(states.at(-1), expected);
    assert.equal(archive.fileCanvasSaveStatus("source").pending, true);
    // Neither an unrelated board write nor a successful archive read repairs the missing image.
    await archive.saveFileCanvasSnapshot("other", snapshot);
    await archive.loadFileArchiveProfile();
    assert.equal(states.at(-1), expected);
    failing = false;
    // Confirm the failed batch separately before the new one (preserve request size bounds).
    await archive.saveFileCanvasFiles("source", [file("later")]);
    assert.deepEqual(batches, [["original"], ["original"], ["later"]]);
    assert.equal(states.at(-1), "saved");
    assert.equal(archive.fileCanvasSaveStatus("source").pending, false);
  });
}

test("board writes retry pending assets first and do not commit while assets still fail", async t => {
  const archive = await freshArchive();
  let failing = true;
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    paths.push(url.split("/").at(-1)!);
    if (url.endsWith("/assets") && failing) throw new Error("offline");
    return ok();
  });
  await assert.rejects(archive.saveFileCanvasFiles("source", [file("image")]));
  await assert.rejects(archive.saveFileCanvasSnapshot("source", snapshot));
  assert.deepEqual(paths, ["assets", "assets"]);
  failing = false;
  await archive.saveFileCanvasSnapshot("source", snapshot);
  assert.deepEqual(paths, ["assets", "assets", "assets", "board"]);
});

test("flush retries assets even when no snapshot is waiting", async t => {
  const archive = await freshArchive();
  let failing = true;
  t.mock.method(globalThis, "fetch", async () => {
    if (failing) throw new Error("offline");
    return ok();
  });
  await assert.rejects(archive.saveFileCanvasFiles("source", [file("image")]));
  await assert.rejects(archive.flushFileCanvasSnapshot("source"));
  failing = false;
  await archive.flushFileCanvasSnapshot("source");
  assert.equal(archive.fileCanvasSaveStatus("source").pending, false);
});

test("a confirmed asset batch cannot remove newer queued bytes for the same file", async t => {
  const archive = await freshArchive();
  const states: string[] = [];
  archive.subscribeArchiveFileState(state => states.push(state));
  let release!: () => void;
  let started!: () => void;
  const firstStarted = new Promise<void>(resolve => { started = resolve; });
  const firstReleased = new Promise<void>(resolve => { release = resolve; });
  const batches: unknown[] = [];
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    batches.push(JSON.parse(String(init.body)).files);
    if (batches.length === 1) { started(); await firstReleased; }
    return ok();
  });
  const original = file("image"), updated = file("image", "AQ==");
  const first = archive.saveFileCanvasFiles("source", [original]);
  await firstStarted;
  const second = archive.saveFileCanvasFiles("source", [updated, file("extra")]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(batches, [[original], [updated, file("extra")]]);
  assert.equal(archive.fileCanvasSaveStatus("source").pending, false);
  assert.equal(states.filter(state => state === "saved").length, 1, "only the drained queue may announce success");
});

test("successful asset removal clears failed uploads so later flush cannot resurrect them", async t => {
  const archive = await freshArchive();
  const methods: string[] = [];
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    methods.push(init.method!);
    if (init.method === "PUT") throw new Error("offline");
    return ok();
  });
  await assert.rejects(archive.saveFileCanvasFiles("source", [file("image")]));
  await archive.archiveFileCanvasFiles("source");
  await archive.flushFileCanvasSnapshot("source");
  assert.deepEqual(methods, ["PUT", "DELETE"]);
  assert.equal(archive.fileCanvasSaveStatus("source").state, "saved");
});

test("an upload queued after removal is written even when it reuses the same file object", async t => {
  const archive = await freshArchive();
  let release!: () => void;
  let started!: () => void;
  const firstStarted = new Promise<void>(resolve => { started = resolve; });
  const firstReleased = new Promise<void>(resolve => { release = resolve; });
  const methods: string[] = [];
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    methods.push(init.method!);
    if (methods.length === 1) { started(); await firstReleased; }
    return ok();
  });
  const image = file("image");
  const first = archive.saveFileCanvasFiles("source", [image]);
  await firstStarted;
  const removal = archive.archiveFileCanvasFiles("source");
  const later = archive.saveFileCanvasFiles("source", [image]);
  release();
  await Promise.all([first, removal, later]);
  assert.deepEqual(methods, ["PUT", "DELETE", "PUT"]);
});

test('failed board remains unsaved across unrelated success and flush retries the guarded recovery', async t => {
  const previousWindow=globalThis.window;
  Object.assign(globalThis,{window:{setTimeout,clearTimeout}});
  t.after(()=>{Object.assign(globalThis,{window:previousWindow});});
  const archive=await freshArchive();let fail=true;
  const headers:Record<string,string>[]=[];
  t.mock.method(globalThis,'fetch',async(url:string,init?:RequestInit)=>{
    if(url.includes('/draft/')){
      headers.push(init?.headers as Record<string,string>);
      if(fail)return new Response(JSON.stringify({error:'Disk full'}),{status:500});
    }
    return ok();
  });
  archive.restoreFileCanvasRevision('draft','"base"');
  archive.queueFileCanvasSnapshot('draft',snapshot,{preservePrevious:true});
  await assert.rejects(archive.flushFileCanvasSnapshot('draft'),/Disk full/);
  await archive.saveFileCanvasSnapshot('unrelated',snapshot);
  assert.equal(archive.fileCanvasSaveStatus('draft').state,'error');
  await assert.rejects(archive.flushArchiveWrites(),/Disk full/);
  fail=false;await archive.flushArchiveWrites();
  assert.equal(archive.fileCanvasSaveStatus('draft').state,'saved');
  assert.ok(headers.every(h=>h['If-Match']==='"base"'&&h['X-Tafelraum-Recovery']==='1'));
});

test('flush waits for an already-running board write and rejects its failure', async t => {
  const previousWindow=globalThis.window;
  Object.assign(globalThis,{window:{setTimeout,clearTimeout}});
  t.after(()=>{Object.assign(globalThis,{window:previousWindow});});
  const archive=await freshArchive();let release!:(r:Response)=>void;
  t.mock.method(globalThis,'fetch',()=>new Promise<Response>(resolve=>{release=resolve;}));
  archive.queueFileCanvasSnapshot('closing',snapshot);
  const first=archive.flushFileCanvasSnapshot('closing');
  const rejection=assert.rejects(first,/Disk full/);
  let settled=false;
  const second=archive.flushFileCanvasSnapshot('closing').finally(()=>{settled=true;});
  const secondRejection=assert.rejects(second,/Disk full/);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(settled,false);
  release(new Response(JSON.stringify({error:'Disk full'}),{status:500}));
  await Promise.all([rejection,secondRejection]);
});

test("only a coded board revision conflict offers recovery and remains typed through flush", async t => {
  const archive = await freshArchive();
  let conflict = true;
  t.mock.method(globalThis, "fetch", async () => conflict
    ? new Response(JSON.stringify({error:"Newer archive revision", code:"board_revision_conflict"}), {status:409})
    : ok());
  await assert.rejects(archive.saveFileCanvasSnapshot("lesson", snapshot), archive.CanvasRevisionConflict);
  assert.equal(archive.hasCanvasRevisionConflict("lesson"), true);
  await assert.rejects(archive.flushFileCanvasSnapshot("lesson"), archive.CanvasRevisionConflict);
  conflict = false;
  await archive.saveFileCanvasSnapshot("lesson", snapshot);
  assert.equal(archive.hasCanvasRevisionConflict("lesson"), false);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({error:"Other conflict",code:"other_conflict"}),{status:409}));
  await assert.rejects(archive.saveFileCanvasSnapshot("other",snapshot));
  assert.equal(archive.hasCanvasRevisionConflict("other"), false);
});
