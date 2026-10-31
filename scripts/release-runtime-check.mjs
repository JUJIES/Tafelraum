// Production runtime probe. Temporary archive/build/profile; no private config.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initializeEmptyArchive} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),app=path.join(root,'prototypes/surface-shell-a-b');
const require=createRequire(path.join(app,'package.json'));
const {build,preview}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium}=require('playwright');
const cycles=Number(process.env.TAFELRAUM_ROOM_CYCLES ?? 60);
if(!Number.isInteger(cycles)||cycles<1||cycles>1000)throw Error('Room cycles must be 1–1000');
const temp=await mkdtemp(path.join(tmpdir(),'tafelraum-release-runtime-')),out=path.join(root,'output/release-runtime-check');await mkdir(out,{recursive:true});
await initializeEmptyArchive(path.join(temp,'archive'));
let server,browser;const report={starts:[],races:[],room:[],errors:[],limits:'Production browser fixture; no native updater, multi-hour media or physical board acceptance.'};
try{
 await build({configFile:false,root:app,plugins:[react()],define:{__TAFELRAUM_VERSION__:JSON.stringify('runtime-check')},build:{outDir:path.join(temp,'dist'),rollupOptions:{input:[path.join(app,'index.html'),path.join(app,'room.html'),path.join(app,'src/live/clip.browser.html')]}}});
 server=await preview({configFile:false,root:app,build:{outDir:path.join(temp,'dist')},preview:{host:'127.0.0.1',port:0},plugins:[{name:'isolated',configurePreviewServer(v){v.middlewares.use((req,res,next)=>{if(req.url?.startsWith('/api/')&&!req.url.startsWith('/api/archive')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:false,supported:false}));}else next();});v.middlewares.use(createArchiveMiddleware(path.join(temp,'archive')));}}]});
 const origin=`http://127.0.0.1:${server.httpServer.address().port}`;browser=await chromium.launch({headless:true});
 for(let i=0;i<5;i++){const context=await browser.newContext();const page=await context.newPage();const start=Date.now();await page.goto(origin);await page.getByRole('button',{name:'Widgets',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('button[aria-label="Widgets"]')?.disabled);report.starts.push(Date.now()-start);await context.close();}
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+'/src/live/clip.browser.html?inlineRoom&lesson=runtime-race');await page.waitForFunction(()=>window.clipFixture?.port&&!window.clipFixture.api.getAppState().isLoading);
 for(let i=0;i<50;i++){
  const result=await page.evaluate(async()=>{const f=window.clipFixture;const count=f.api.getSceneElements().length;f.port.placeTimer();const immediate=f.api.getSceneElements().length;await f.port.flushPersistence();const stored=await(await fetch('/api/archive/lessons/runtime-race/board')).json();return {count,immediate,saved:stored.elements.filter(e=>!e.isDeleted).length};});
  report.races.push(result);assert.equal(result.immediate,result.count+1,'placement must reach native scene synchronously');assert.equal(result.saved,result.immediate,'immediate flush must include the new element');
 }
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 for(let i=0;i<cycles;i++){
  await page.evaluate(()=>window.clipFixture.room.start());await page.waitForFunction(()=>window.clipFixture.room.state.ready);await page.evaluate(()=>window.clipFixture.room.stop());await page.locator('#clip-fixture-room').waitFor({state:'detached'});
  if(i%Math.max(10,Math.floor(cycles/10))===0||i===cycles-1){await cdp.send('HeapProfiler.collectGarbage');const {metrics}=await cdp.send('Performance.getMetrics');report.room.push({cycle:i,heap:metrics.find(m=>m.name==='JSHeapUsedSize').value,nodes:metrics.find(m=>m.name==='Nodes').value});}
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await server?.httpServer.close();await rm(temp,{recursive:true,force:true});}
console.log(JSON.stringify(report));
