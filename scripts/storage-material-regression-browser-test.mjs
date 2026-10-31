// Isolated real React/IndexedDB regression check. Every archive request is synthetic.
// From the app directory: npm run test:storage-material-browser
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../prototypes/surface-shell-a-b/package.json', import.meta.url));
const {createServer} = await import(require.resolve('vite'));
const {default: react} = await import(require.resolve('@vitejs/plugin-react'));
const {chromium} = process.argv[2]
  ? await import(pathToFileURL(path.resolve(process.argv[2])).href)
  : require('playwright');
const cacheDir = await mkdtemp(path.join(tmpdir(), 'tafelraum-storage-material-'));
const output = path.join(root, 'output/storage-material-regression');
await mkdir(output, {recursive: true});

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div>
<script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {LessonMaterialPanel} from '/src/LessonMaterialPanel.tsx';
import {CanvasRecoveryDialog} from '/src/canvas/CanvasRecoveryDialog.tsx';
import * as persistence from '/src/canvas/canvas-persistence.ts';
import * as archive from '/src/archive-file-persistence.ts';
import '/src/styles.css';
document.documentElement.dataset.theme='light';
const root=createRoot(document.getElementById('root'));
const usage={archivePaths:[],legacyFileNames:[]};
window.actions=[];window.persistence=persistence;window.archive=archive;
window.mountLesson=lessonId=>flushSync(()=>root.render(React.createElement(LessonMaterialPanel,{
 lessonId,open:true,importing:false,materialUsage:usage,focusedMaterialUsage:usage,refreshRevision:0,
 onAddLink:async()=>{},onRemove:async material=>{
  const response=await fetch('/api/archive/lessons/'+lessonId+'/materials',{method:'DELETE',body:JSON.stringify({path:material.path})});
  if(!response.ok)throw Error('Entfernen fehlgeschlagen');
 },onClose:()=>{},onLocate:()=>{},onInsert:(material,archivePath)=>window.actions.push({lessonId,path:material.path,archivePath}),
 onPickDevice:()=>{},style:{position:'fixed',top:20,right:20,bottom:20,width:360}
})));
window.mountRecovery=resolve=>flushSync(()=>root.render(React.createElement(CanvasRecoveryDialog,{resolve:choice=>{root.render(null);resolve(choice);}})));
window.ready=true;
</script></body></html>`;
const server = await createServer({
  configFile: false, root: path.join(root, 'prototypes/surface-shell-a-b'), cacheDir,
  define: {__TAFELRAUM_VERSION__: JSON.stringify('regression')},
  server: {host: '127.0.0.1', port: 0, watch: {ignored: ['**/src-tauri/**', '**/desktop-resources/**']}},
  plugins: [react(), {name: 'isolated-regression', configureServer(vite) {
    vite.middlewares.use((req, res, next) => {
      if (req.url === '/regression.html') {
        void vite.transformIndexHtml(req.url, html).then(body => {res.setHeader('Content-Type','text/html');res.end(body);});
      } else if (req.url?.startsWith('/api/')) { res.statusCode=404;res.end('No real archive in this fixture'); }
      else next();
    });
  }}],
});
let browser;
const checks = [], errors = [];
const record = label => {checks.push(label);console.log(label);};
const material = lesson => ({kind:'audio',mimeType:'audio/mpeg',path:'shared.mp3',name:`${lesson} material`,folder:null,size:1,modifiedAt:'2026-10-29'});
const collection = lesson => ({lessonId:lesson,basis:{archiveSeriesId:'series',archivePath:`lessons/${lesson}/material`,label:`Stunde ${lesson}`,scope:'lesson'},materials:[material(lesson)]});
const reply = (route, body, status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
const held = new Map();
let holdLoad = null, holdRemoval = false, failAssets = false;
const writes = [];
const boards = new Map();
const archiveAssets = new Map();
const failBoards = new Set();
let boardRevision = 0;
const archiveRoute = async route => {
    const request = route.request(), url = new URL(request.url());
    const lesson = url.pathname.split('/')[4], resource = url.pathname.split('/').at(-1);
    if (resource === 'materials') {
      if (request.method() === 'DELETE' && holdRemoval) {held.set('remove', route);return;}
      if (request.method() === 'GET' && holdLoad === lesson) {held.set(lesson, route);return;}
      return reply(route, collection(lesson));
    }
    if (resource === 'assets' && request.method() === 'PUT') {
      writes.push({lesson,resource,files:request.postDataJSON().files});
      if(!failAssets)archiveAssets.set(lesson,new Map([...(archiveAssets.get(lesson)??[]),...request.postDataJSON().files.map(file=>[file.id,file])]));
      return reply(route, failAssets ? {error:'Simulated disk failure'} : {saved:true}, failAssets ? 500 : 200);
    }
    if(resource==='assets' && request.method()==='POST')return reply(route,{files:request.postDataJSON().fileIds.flatMap(id=>archiveAssets.get(lesson)?.has(id)?[archiveAssets.get(lesson).get(id)]:[])});
    if(request.method()==='DELETE') {if(resource==='board')boards.delete(lesson);else archiveAssets.delete(lesson);return reply(route,{saved:true});}
    if (resource === 'board' && request.method() === 'GET') {
      const saved = boards.get(lesson);
      return saved ? route.fulfill({status:200,contentType:'application/json',headers:{ETag:saved.revision},body:JSON.stringify(saved.snapshot)}) : reply(route,{},404);
    }
    if (resource === 'board') {
      const entry={lesson,resource,headers:request.headers(),snapshot:request.postDataJSON()};writes.push(entry);
      if(failBoards.has(lesson))return reply(route,{error:'Simulated board failure'},500);
      const previous=boards.get(lesson);
      if(previous ? entry.headers['if-match']!==previous.revision : entry.headers['if-none-match']!=='*')return reply(route,{error:'Conflict'},409);
      const revision='"r'+(++boardRevision)+'"';boards.set(lesson,{snapshot:entry.snapshot,revision});
      if(holdLoad===lesson){held.set(lesson,{route,revision});return;}
      return reply(route,{saved:true,revision});
    }
    return reply(route, {files:[]});
};
try {
  await server.listen();
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1100,height:800}});
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/archive/**', archiveRoute);
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  await page.goto(origin+'/regression.html');
  await page.waitForFunction(()=>window.ready);
  const mount = lesson => page.evaluate(lesson=>window.mountLesson(lesson),lesson);
  await mount('A');
  await page.getByRole('button',{name:'A material auf die Fläche',exact:true}).waitFor();
  holdLoad='B';
  const requestedB = page.waitForRequest(request=>request.url().endsWith('/B/materials'));
  await mount('B');
  await requestedB;
  assert.equal(await page.locator('.lesson-material-item').count(),0,'old lesson rows must disappear before the new request finishes');
  await page.getByText('Material wird geladen',{exact:true}).waitFor();
  await page.locator('aside').evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
  await page.screenshot({path:path.join(output,'lesson-loading.png')});
  assert.ok(held.has('B'));
  holdLoad=null;await reply(held.get('B'),collection('B'));held.delete('B');
  await page.getByRole('button',{name:'B material auf die Fläche',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.actions),[{lessonId:'B',path:'shared.mp3',archivePath:'lessons/B/material/shared.mp3'}]);
  record('Slow lesson switch hides old rows and inserts only the new lesson material');

  // A removal started in A may finish after navigation to B and call its captured refresh.
  await mount('A');
  await page.getByRole('button',{name:'A material aus dem Materialarchiv entfernen',exact:true}).click();
  holdRemoval=true;
  await page.getByRole('button',{name:'Entfernen',exact:true}).click();
  await page.getByRole('button',{name:'Wird entfernt…',exact:true}).waitFor();
  await mount('B');
  await page.getByRole('button',{name:'B material auf die Fläche',exact:true}).waitFor();
  assert.equal(await page.locator('dialog[open]').count(),0);
  assert.ok(held.has('remove'));
  holdRemoval=false;
  const oldRefresh = page.waitForResponse(response=>response.url().endsWith('/A/materials')&&response.request().method()==='GET');
  await reply(held.get('remove'),{});held.delete('remove');await oldRefresh;
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.lesson-material-item strong').textContent(),'B material');
  assert.equal(await page.getByRole('button',{name:'B material auf die Fläche',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'Material neu laden',exact:true}).click();
  await page.getByRole('button',{name:'B material auf die Fläche',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'lesson-ready.png')});
  record('Late removal completion and refresh from the old lesson cannot replace the current list');

  failAssets=true;
  const asset={id:'regression-image',mimeType:'image/png',dataURL:'data:image/png;base64,AA==',created:1};
  const result=await page.evaluate(async asset=>{
    try {await window.persistence.saveCanvasFiles('storage',[asset]);return 'unexpected success';}
    catch(error){return error.message;}
  },asset);
  assert.equal(result,'Simulated disk failure');
  const cached=await page.evaluate(async()=>window.persistence.loadCanvasFiles('storage',['regression-image']));
  assert.deepEqual(cached['regression-image'],asset);
  await page.evaluate(async()=>window.archive.saveFileCanvasSnapshot('unrelated',{schemaVersion:1,elements:[],viewport:{scrollX:0,scrollY:0,zoom:{value:1}}}));
  assert.equal(await page.evaluate(()=>window.archive.fileCanvasSaveStatus('storage').state),'error');
  failAssets=false;
  await page.evaluate(()=>window.archive.flushFileCanvasSnapshot('storage'));
  assert.equal(await page.evaluate(()=>window.archive.fileCanvasSaveStatus('storage').state),'saved');
  assert.deepEqual(writes.filter(write=>write.lesson==='storage').map(write=>write.files),[[asset],[asset]]);
  record('Real IndexedDB cache survives failed asset upload; facade rejects, warning persists, retry confirms original bytes');

  // Copy must not queue a target snapshot before its images have been confirmed.
  await page.evaluate(async asset=>{
    await window.persistence.saveCanvasFiles('copy-source',[asset]);
    await window.persistence.saveCanvasSnapshot('copy-source',{schemaVersion:1,elements:[{type:'image',fileId:asset.id}],viewport:{scrollX:0,scrollY:0,zoom:{value:1}}});
    await window.archive.flushFileCanvasSnapshot('copy-source');
  },asset);
  failAssets=true;
  assert.equal(await page.evaluate(async()=>{
    try {await window.persistence.copyCanvasLessonState('copy-source','copy-target');return false;}catch{return true;}
  }),true);
  assert.equal(writes.some(write=>write.lesson==='copy-target'&&write.resource==='board'),false);
  failAssets=false;
  await page.evaluate(async()=>{
    await window.persistence.copyCanvasLessonState('copy-source','copy-target');
    await window.archive.flushFileCanvasSnapshot('copy-target');
  });
  assert.deepEqual(writes.filter(write=>write.lesson==='copy-target').map(write=>write.resource),['assets','assets','assets','board']);
  record('Lesson copy waits for assets, rejects failures, and retries assets before its target board');

  const original={schemaVersion:1,elements:[],viewport:{scrollX:11,scrollY:0,zoom:{value:1}}};
  const draft={...original,elements:[{type:'image',id:'draft-image',fileId:asset.id}],viewport:{...original.viewport,scrollX:22}};
  boards.set('recovery',{snapshot:original,revision:'"original"'});
  await page.evaluate(()=>window.persistence.loadCanvasSnapshot('recovery'));
  failAssets=true;
  await page.evaluate(async asset=>{try{await window.persistence.saveCanvasFiles('recovery',[asset]);}catch{}},asset);
  failAssets=false;failBoards.add('recovery');
  await page.evaluate(async draft=>{
    await window.persistence.saveCanvasSnapshot('recovery',draft);
    try{await window.archive.flushFileCanvasSnapshot('recovery');}catch{}
  },draft);
  await page.reload();await page.waitForFunction(()=>window.ready);
  assert.deepEqual(await page.evaluate(()=>window.persistence.loadCanvasSnapshot('recovery')),draft);
  failBoards.delete('recovery');
  const recoveryStart=writes.length;
  await page.evaluate(async draft=>{await window.persistence.saveCanvasSnapshot('recovery',draft);await window.archive.flushFileCanvasSnapshot('recovery');},draft);
  assert.deepEqual(writes.slice(recoveryStart).map(write=>write.resource),['assets','board']);
  await page.reload();await page.waitForFunction(()=>window.ready);
  assert.deepEqual(await page.evaluate(()=>window.persistence.loadCanvasSnapshot('recovery')),draft);
  record('Failed board survives reload; recovered cached images commit before the draft; acknowledged draft reloads cleanly');

  for(const choice of ['draft','archive']) {
    const lesson='conflict-'+choice;
    boards.set(lesson,{snapshot:original,revision:'"initial"'});
    await page.evaluate(lesson=>window.persistence.loadCanvasSnapshot(lesson),lesson);
    failBoards.add(lesson);
    await page.evaluate(async({lesson,draft})=>{await window.persistence.saveCanvasSnapshot(lesson,draft);try{await window.archive.flushFileCanvasSnapshot(lesson);}catch{}},{lesson,draft});
    boards.set(lesson,{snapshot:original,revision:'"external"'});
    failBoards.delete(lesson);
    await page.reload();await page.waitForFunction(()=>window.ready);
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,choice==='draft'?'light':'dark');
    const loading=page.evaluate(lesson=>window.persistence.loadCanvasSnapshot(lesson,()=>new Promise(resolve=>window.mountRecovery(resolve))),lesson);
    await page.getByRole('heading',{name:'Welche Fassung öffnen?'}).waitFor();
    assert.equal(writes.filter(write=>write.lesson===lesson&&write.headers?.['x-tafelraum-recovery']).length,0);
    await page.screenshot({path:path.join(output,'recovery-'+choice+'.png')});
    await page.getByRole('button',{name:choice==='draft'?'Entwurf wiederherstellen':'Archiv öffnen',exact:true}).click();
    assert.deepEqual(await loading,choice==='draft'?draft:original);
    if(choice==='draft') {
      await page.evaluate(async({lesson,draft})=>{await window.persistence.saveCanvasSnapshot(lesson,draft);await window.archive.flushFileCanvasSnapshot(lesson);},{lesson,draft});
      const last=writes.filter(write=>write.lesson===lesson&&write.resource==='board').at(-1);
      assert.equal(last.headers['x-tafelraum-recovery'],'1');assert.equal(last.headers['if-match'],'"external"');
    }
  }
  record('Conflicting archive revisions require explicit choice; restore preserves history and still binds If-Match');

  // A slow acknowledgement may only confirm its own sequence, never a newer edit.
  await page.reload();await page.waitForFunction(()=>window.ready);
  boards.set('race',{snapshot:original,revision:'"race0"'});
  await page.evaluate(()=>window.persistence.loadCanvasSnapshot('race'));
  holdLoad='race';
  await page.evaluate(async snapshot=>{await window.persistence.saveCanvasSnapshot('race',snapshot);window.raceFlush=window.archive.flushFileCanvasSnapshot('race');},draft);
  for(let attempt=0;!held.has('race')&&attempt<100;attempt++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.ok(held.has('race'));
  const latest={...draft,viewport:{...draft.viewport,scrollX:33}};
  await page.evaluate(snapshot=>window.persistence.saveCanvasSnapshot('race',snapshot),latest);
  const delayed=held.get('race');holdLoad=null;held.delete('race');
  await reply(delayed.route,{saved:true,revision:delayed.revision});
  await page.evaluate(()=>window.raceFlush);
  failBoards.add('race');
  await page.evaluate(async()=>{try{await window.archive.flushFileCanvasSnapshot('race');}catch{}});
  await page.reload();await page.waitForFunction(()=>window.ready);
  assert.deepEqual(await page.evaluate(()=>window.persistence.loadCanvasSnapshot('race')),latest);
  failBoards.delete('race');
  await page.evaluate(async snapshot=>{await window.persistence.saveCanvasSnapshot('race',snapshot);await window.archive.flushFileCanvasSnapshot('race');},latest);
  record('A late ACK advances the newer draft revision without discarding it or causing a false recovery conflict');

  // A cache from an older app has no acknowledgement metadata: never assume
  // that a differing raw snapshot was already committed.
  await page.evaluate(async snapshot=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('tafelraum-surface-lab',3);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    await new Promise((resolve,reject)=>{const tx=db.transaction('canvas-snapshots','readwrite');tx.objectStore('canvas-snapshots').put(snapshot,'legacy-draft');tx.oncomplete=resolve;tx.onerror=reject;});db.close();
  },draft);
  boards.set('legacy-draft',{snapshot:original,revision:'"legacy-base"'});
  let legacyChoices=await page.evaluate(async()=>{
    let asked=0;const snapshot=await window.persistence.loadCanvasSnapshot('legacy-draft',async()=>{asked++;return 'draft';});return {asked,snapshot};
  });
  assert.equal(legacyChoices.asked,1);assert.deepEqual(legacyChoices.snapshot,draft);
  boards.set('legacy-draft',{snapshot:draft,revision:'"lost-ack"'});
  assert.deepEqual(await page.evaluate(()=>window.persistence.loadCanvasSnapshot('legacy-draft')),draft);
  record('Legacy raw cache prompts before overwrite; identical archive bytes resolve a lost acknowledgement without a false conflict');
  boards.delete('legacy-draft');
  assert.equal(await page.evaluate(()=>window.persistence.loadCanvasSnapshot('legacy-draft')),null,'confirmed cache must not resurrect an authoritative archive reset');

  const broken=await browser.newPage();
  broken.on('pageerror',error=>errors.push(error.message));
  await broken.route('**/api/archive/**',archiveRoute);
  await broken.addInitScript(()=>{IDBFactory.prototype.open=function(){throw new DOMException('Unavailable cache','QuotaExceededError');};});
  await broken.goto(origin+'/regression.html');await broken.waitForFunction(()=>window.ready);
  boards.set('no-cache',{snapshot:original,revision:'"cache0"'});
  assert.deepEqual(await broken.evaluate(()=>window.persistence.loadCanvasSnapshot('no-cache')),original);
  await broken.evaluate(async({draft,asset})=>{await window.persistence.saveCanvasFiles('no-cache',[asset]);await window.persistence.saveCanvasSnapshot('no-cache',draft);},{draft,asset});
  assert.deepEqual(boards.get('no-cache').snapshot,draft);
  assert.deepEqual(await broken.evaluate(()=>window.persistence.loadCanvasFiles('no-cache',['regression-image'])),{[asset.id]:asset});
  failBoards.add('no-cache');
  assert.equal(await broken.evaluate(async snapshot=>{try{await window.persistence.saveCanvasSnapshot('no-cache',snapshot);return false;}catch{return true;}},latest),true);
  assert.equal(await broken.evaluate(()=>window.archive.fileCanvasSaveStatus('no-cache').state),'error');
  failBoards.delete('no-cache');
  await broken.evaluate(async()=>{await window.persistence.clearCanvasSnapshot('no-cache');await window.persistence.clearCanvasFiles('no-cache');});
  assert.equal(boards.has('no-cache'),false);assert.equal(archiveAssets.has('no-cache'),false);
  await broken.close();
  record('Unavailable IndexedDB does not block archive load, image save or confirmed board writes; double failure rejects visibly');
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'verification.json'),JSON.stringify({checks,errors},null,2)+'\n');
} finally {
  await browser?.close();
  await server.close();
  await rm(cacheDir,{recursive:true,force:true});
}
