import test from 'node:test';
import assert from 'node:assert/strict';
import {loadFileCanvasSnapshot,queueFileCanvasSnapshot,flushFileCanvasSnapshot,fileCanvasSaveStatus} from './archive-file-persistence.ts';

test('agent flush refuses failed archive writes and retains the pending snapshot for retry',async t=>{
 const fetchBefore=globalThis.fetch;const windowBefore=globalThis.window;
 // Browser timers, without canvas/engine mocks. This exercises the real archive queue.
 Object.assign(globalThis,{window:{setTimeout,clearTimeout}});
 t.after(()=>{globalThis.fetch=fetchBefore;Object.assign(globalThis,{window:windowBefore});});
 const lesson='agent-persistence-qa',snapshot={schemaVersion:1 as const,elements:[],viewport:{scrollX:0,scrollY:0,zoom:{value:1 as never}}};
 let mode='load';let writes=0;
 globalThis.fetch=async (_url,init)=>{
  if(!init?.method)return new Response(JSON.stringify(snapshot),{headers:{ETag:'"r1"'}});
  writes++;assert.equal((init.headers as Record<string,string>)['If-Match'],'"r1"');
  if(mode==='offline')throw Error('offline');
  if(mode==='conflict')return new Response(JSON.stringify({error:'newer revision'}),{status:409});
  return new Response(JSON.stringify({saved:true,revision:'"r2"'}));
 };
 await loadFileCanvasSnapshot(lesson);
 mode='offline';queueFileCanvasSnapshot(lesson,snapshot);await assert.rejects(flushFileCanvasSnapshot(lesson),/gespeichert/);
 assert.equal(fileCanvasSaveStatus(lesson).pending,true);
 mode='conflict';await assert.rejects(flushFileCanvasSnapshot(lesson),/newer revision/);
 assert.equal(fileCanvasSaveStatus(lesson).pending,true);
 mode='ok';await flushFileCanvasSnapshot(lesson);assert.equal(fileCanvasSaveStatus(lesson).archiveRevision,'"r2"');assert.equal(writes,3);
 // Queue settlement may run its bookkeeping microtask after the flush resolves.
 await Promise.resolve();assert.equal(fileCanvasSaveStatus(lesson).pending,false);
});
