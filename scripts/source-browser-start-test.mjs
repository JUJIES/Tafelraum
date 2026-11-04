// Real npm start, browser edits and a full server restart in a source snapshot.
// npm run test:source-browser -- [msedge|chrome] (omit for pinned Chromium).
import assert from 'node:assert/strict';
import {spawn, execFile} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile, lstat, unlink, cp} from 'node:fs/promises';
import {createServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {snapshotBuildSource} from './snapshot-build-source.mjs';

const repository=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(repository,'output/source-browser-start');
const source=path.join(output,`source-${process.pid}`);
const app=path.join(source,'prototypes/surface-shell-a-b');
const archive=path.join(source,'local-data/public-lessons');
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const {chromium}=require('playwright');
const run=promisify(execFile);
const channel=process.argv[2];
if(channel&&!['msedge','chrome'].includes(channel))throw Error('Expected msedge or chrome');
if(!process.env.npm_execpath)throw Error('Run through npm run test:source-browser');
const environment={...process.env};
for(const key of Object.keys(environment))if(key.startsWith('TAFELRAUM_'))delete environment[key];
const origin='http://127.0.0.1:5173';
const report={platform:process.platform,node:process.version,channel:channel||'chromium',source,archive,checks:[],errors:[]};
let child,browser,page,log='',stage='setup';
function observe(target){
  target.on('pageerror',error=>report.errors.push(error.message));
  target.on('response',response=>{if(/\.woff2(?:\?|$)/.test(response.url())&&!response.ok())report.errors.push(`Font ${response.status()}: ${response.url()}`);});
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check,label,attempts=150){
  for(let i=0;i<attempts;i++){const result=await check();if(result)return result;await pause(200);}
  throw Error(`Timed out: ${label}`);
}
async function start(){
  // Never attach this check to an existing service or another task's server.
  const probe=createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(5173,'127.0.0.1',resolve);});
  await new Promise(resolve=>probe.close(resolve));
  child=spawn(process.execPath,[process.env.npm_execpath,'start'],{cwd:app,env:environment,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
  child.stdout.on('data',bytes=>{log+=bytes;});child.stderr.on('data',bytes=>{log+=bytes;});
  child.on('error',error=>{log+=error.stack;});
  await waitFor(async()=>{
    if(child.exitCode!==null)throw Error(`npm start exited ${child.exitCode}: ${log}`);
    try{return (await fetch(origin+'/api/archive/status')).ok;}catch{return false;}
  },'normal npm start (including production build)',600);
  const status=await(await fetch(origin+'/api/archive/status')).json();
  assert.equal(status.archiveRoot,archive);
  const html=await(await fetch(origin)).text();
  assert(!html.includes('/@vite/client'),'Normal start must serve the built app');
  assert.match(html,/\/assets\/.*\.js/);
}
async function stop(){
  if(!child)return;
  const running=child;child=null;
  // Only this test's own npm process tree. Vite must release its Windows
  // handles before the next start; killing npm alone leaves its child alive.
  if(running.exitCode===null){
    if(process.platform==='win32')await run('taskkill',['/PID',String(running.pid),'/T','/F']);
    else process.kill(-running.pid,'SIGTERM');
  }
  await waitFor(async()=>{try{await fetch(origin+'/api/archive/status');return false;}catch{return true;}},'server shutdown');
}
async function board(){const response=await fetch(origin+'/api/archive/lessons/lesson-start/board');return response.ok?response.json():null;}
async function assets(scene){
  const fileIds=scene.elements.filter(item=>item.type==='image'&&!item.isDeleted).map(item=>item.fileId);
  return (await(await fetch(origin+'/api/archive/lessons/lesson-start/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileIds})})).json()).files;
}
async function waitForPaint(target){
  await target.waitForFunction(()=>[...document.querySelectorAll('canvas')].some(canvas=>{
    const context=canvas.getContext('2d');if(!context||!canvas.width||!canvas.height)return false;
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let colored=0;
    for(let i=0;i<pixels.length;i+=16)if(pixels[i+3]>200&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>60)colored++;
    return colored>2000;
  }));
}
try{
  await mkdir(output,{recursive:true});
  await snapshotBuildSource(repository,source,{includeLocalFixtures:false});
  // npm start must also serve real font paths. A dependency junction into the
  // outer checkout puts those paths outside Vite's normal filesystem boundary.
  // Copy the installed dependencies for this check instead of relaxing it.
  const dependencies=path.join(app,'node_modules');
  assert.ok(dependencies.startsWith(source+path.sep));
  assert.ok((await lstat(dependencies)).isSymbolicLink());
  await unlink(dependencies);
  await cp(path.join(repository,'prototypes/surface-shell-a-b/node_modules'),dependencies,{recursive:true});
  report.dependencyMode='copied installed dependencies; default Vite filesystem restrictions';
  await start();report.checks.push('Normal npm start creates its own public lesson archive');
  browser=await chromium.launch({headless:true,...(channel?{channel}:{})});
  report.browserVersion=browser.version();
  let context=await browser.newContext({viewport:{width:1440,height:1000},locale:'de-DE'});
  page=await context.newPage();page.setDefaultTimeout(45000);
  observe(page);
  stage='open starter lesson';
  await page.goto(origin);await page.getByRole('button',{name:'Erster Unterricht',exact:true}).click();
  await page.locator('.excalidraw canvas').first().waitFor();
  await page.screenshot({path:path.join(output,'starter.png')});
  stage='native shape';
  await page.getByRole('button',{name:'Form',exact:true}).click();
  await page.mouse.move(760,380);await page.mouse.down();await page.mouse.move(950,490,{steps:10});await page.mouse.up();
  await waitFor(async()=>{const scene=await board();return scene?.elements?.some(item=>item.type==='rectangle'&&!item.isDeleted);},'rectangle autosave');
  stage='native text';
  await page.keyboard.press('Escape');await page.keyboard.press('t');await page.mouse.click(760,560);
  await page.keyboard.type('Synthetic Windows lesson');await page.keyboard.press('Escape');
  await waitFor(async()=>{const scene=await board();return scene?.elements?.some(item=>item.type==='text'&&item.text==='Synthetic Windows lesson'&&!item.isDeleted);},'text autosave');
  stage='image drop';
  const image=await readFile(path.join(app,'src/assets/demo/transport-set.png'));
  const transfer=await page.evaluateHandle(async bytes=>{
    const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=213;
    canvas.getContext('2d').drawImage(bitmap,0,0,320,213);bitmap.close();
    const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const data=new DataTransfer();data.items.add(new File([png],'synthetic-transport.png',{type:'image/png'}));return data;
  },[...image]);
  await page.locator('.excalidraw').dispatchEvent('drop',{dataTransfer:transfer,clientX:1000,clientY:650});
  await waitFor(async()=>{const scene=await board();return scene?.elements?.some(item=>item.type==='image'&&!item.isDeleted)?scene:null;},'image autosave');
  await pause(1000);
  const saved=await board();
  const savedAssets=await assets(saved);assert.equal(savedAssets.length,1);assert.match(savedAssets[0].dataURL,/^data:image\/png;base64,/);
  await waitForPaint(page);
  await writeFile(path.join(output,'saved-board.json'),JSON.stringify(saved,null,2));
  await page.screenshot({path:path.join(output,'edited.png')});
  report.checks.push('Starter lesson: native rectangle, text and PNG inserted through browser UI and autosaved');
  stage='restart';
  await context.close();await stop();await start();
  // A fresh profile cannot satisfy restoration from the old IndexedDB cache.
  context=await browser.newContext({viewport:{width:1440,height:1000},locale:'de-DE'});
  page=await context.newPage();observe(page);
  await page.goto(origin);await page.getByRole('button',{name:'Erster Unterricht',exact:true}).click();
  await page.locator('.excalidraw canvas').first().waitFor();
  const restored=await board();assert.deepEqual(restored,saved);
  assert.deepEqual(await assets(restored),savedAssets);
  await waitForPaint(page);
  report.checks.push('Full npm server stop/restart and reload preserves board JSON and image files');
  await page.screenshot({path:path.join(output,'reloaded.png')});
  stage='Room';
  await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  const popup=context.waitForEvent('page');
  await page.getByRole('button',{name:'Starten',exact:true}).click();
  const room=await popup;await room.waitForLoadState();await room.locator('canvas').first().waitFor();
  observe(room);
  await waitForPaint(room);
  await room.screenshot({path:path.join(output,'room.png')});
  report.checks.push('Room Canvas opens in a second browser window and renders a canvas');
  assert.deepEqual(report.errors,[]);
  report.status='passed';console.log(JSON.stringify(report,null,2));
}catch(error){
  report.status='failed';report.stage=stage;report.failure=error.stack;
  await page?.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
  if(page)await writeFile(path.join(output,'failure.html'),await page.content()).catch(()=>{});
  console.error(error);process.exitCode=1;
}finally{
  await browser?.close();
  try{await stop();}catch(error){report.status='failed';report.cleanupFailure=error.stack;process.exitCode=1;}
  await writeFile(path.join(output,'server.log'),log);
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
}
