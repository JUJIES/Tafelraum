// Isolated audit: production host/viewer, generated HTML, temporary archive.
// node scripts/performance-audit.mjs /absolute/path/to/playwright/index.mjs
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createArchiveMiddleware } from '../prototypes/surface-shell-a-b/archive-server.mjs';
import { createLiveCanvasService } from '../services/live-canvas/server.ts';
const require = createRequire(new URL('../prototypes/surface-shell-a-b/package.json', import.meta.url));
const { build, preview } = await import(require.resolve('vite'));
const { default: react } = await import(require.resolve('@vitejs/plugin-react'));
const { chromium } = await import(process.argv[2]);
const root = fileURLToPath(new URL('../prototypes/surface-shell-a-b/', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'tafelraum-chain-audit-'));
const archive = join(scratch, 'archive'), hostDist = join(scratch, 'host'), viewerDist = join(scratch, 'viewer');
const materialPath = 'faecher/test/reihen/test/stunden/synthetic-clips/material';
const hostOrigin = 'http://127.0.0.1:5186', baseUrl = 'http://127.0.0.1:5853';
const output = fileURLToPath(new URL('../output/performance-audit/', import.meta.url));
await mkdir(output, { recursive: true });
const watched = ['src/canvas/interactive-html-live.ts', 'interactive-html-state-bridge.mjs', 'src/live/public-projection.ts', 'src/live/live-host.ts', 'src/live/LiveViewerCanvas.tsx'];
const sourceHashes = Object.fromEntries(await Promise.all(watched.map(async p => [p, createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
const html = count => `<!doctype html><html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box}body{margin:0;font:14px system-ui;background:white}#signal{height:150px;background:rgb(255,0,0);padding:12px}button{padding:12px}#items{height:180px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:4px}.item{padding:4px;border:1px solid #999;background:#f8f8f8}
</style></head><body><div id="signal"><button id="choose">Antwort zeigen</button></div><div id="items">${Array.from({length:count},(_,i)=>`<div class="item">Aufgabe ${i}: Ordne den passenden Begriff zu.</div>`).join('')}</div><script>let green=false;document.querySelector('#choose').onclick=()=>{green=!green;document.querySelector('#signal').style.backgroundColor=green?'rgb(0,128,0)':'rgb(255,0,0)';window.lastClick={at:performance.timeOrigin+performance.now(),green};};</script></body></html>`;
for (const count of [8,100,240]) {
  const dir = join(archive, materialPath, 'interaktiv', `audit-${count}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir,'manifest.json'), JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,id:`audit-${count}`,title:`Audit ${count}`,entry:'index.html',defaultViewport:{width:600,height:448}}));
  await writeFile(join(dir,'index.html'),html(count));
}
await writeFile(join(archive,'archive.json'),JSON.stringify({format:'tafelraum-unterrichtsarchiv',schemaVersion:1,catalog:{version:1,subjects:[],series:[],lessons:[{id:'synthetic-clips',title:'Audit',classId:'test',subjectId:'test',seriesId:'test',seed:{prompt:'',showTransportImage:false},metadata:{scheduledFor:null},materialBasis:{scope:'lesson',archivePath:materialPath,archiveSeriesId:'test'}}],hiddenLessonIds:[],trash:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}}));
let server, service, browser;
const results = [];
const idleResults = [];
const counts = process.env.TAFELRAUM_AUDIT_NODES ? process.env.TAFELRAUM_AUDIT_NODES.split(',').map(Number) : [8,100,240];
const resultName = process.env.TAFELRAUM_AUDIT_IDLE ? 'idle' : 'chain';
function instrumentation() {
  const now=()=>performance.timeOrigin+performance.now();
  const logs=window.audit=[];
  const record=(kind,detail={})=>logs.push({kind,at:now(),...detail});
  window.addEventListener('message',e=>{
    if(e.data?.type==='tafelraum:html-view:request')record('view-request',{id:e.data.id});
    if(e.data?.type==='tafelraum:html-view')record('view-response',{id:e.data.id,chars:e.data.svg?.length??0,unchanged:!!e.data.unchanged,error:e.data.error});
  });
  const encode=HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL=function(...args){const start=now(),value=encode.apply(this,args);record('png-sync',{start,ms:now()-start,pixels:this.width*this.height,chars:value.length});return value;};
  const toBlob=HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob=function(callback,...args){const start=now(),pixels=this.width*this.height;return toBlob.call(this,blob=>{record('png-async',{start,ms:now()-start,pixels,bytes:blob?.size});callback(blob);},...args);};
  const decode=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=async function(){const start=now();const value=await decode.call(this);record('decode',{start,ms:now()-start,pixels:this.naturalWidth*this.naturalHeight,format:this.src.slice(0,24)});return value;};
  const ws=WebSocket.prototype.send;
  WebSocket.prototype.send=function(data){try{const m=JSON.parse(data);if(m.type==='publish')record('publish',{revision:m.revision,bytes:data.length,assets:m.assetIds.length,inlineBytes:(m.rasters??[]).reduce((n,r)=>n+r.data.length*3/4,0)});}catch{}return ws.call(this,data);};
  const NativeWS=WebSocket;
  window.WebSocket=class extends NativeWS{constructor(...args){super(...args);this.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(['snapshot','diff','published'].includes(m.type))record(m.type,{revision:m.revision,bytes:e.data.length});}catch{}});}};
  const fetchOriginal=window.fetch;
  window.fetch=async(...args)=>{const start=now();const r=await fetchOriginal(...args);if(String(args[0]).includes('/assets/'))record('asset-http',{start,ms:now()-start,method:args[1]?.method??'GET',bytes:Number(r.headers.get('content-length'))});return r;};
  try{new PerformanceObserver(list=>list.getEntries().forEach(e=>record('longtask',{start:performance.timeOrigin+e.startTime,ms:e.duration}))).observe({type:'longtask'});}catch{}
}
try {
  await build({configFile:false,root,logLevel:'warn',plugins:[react()],define:{'window.devicePixelRatio':'Math.max(window.devicePixelRatio, 2)'},build:{outDir:hostDist,rollupOptions:{input:join(root,'src/live/clip.browser.html')}}});
  await build({configFile:join(root,'vite.live.config.ts'),root:join(root,'viewer'),logLevel:'warn',build:{outDir:viewerDist}});
  service=await createLiveCanvasService({adminKey:'synthetic-audit',allowedOrigins:[hostOrigin],publicOrigin:baseUrl,distDir:viewerDist});await service.listen(5853);
  server=await preview({configFile:false,root,build:{outDir:hostDist},preview:{host:'127.0.0.1',port:5186,strictPort:true},plugins:[{name:'audit-archive',configurePreviewServer(v){v.middlewares.use(createArchiveMiddleware(archive));v.middlewares.use('/api/live/rooms',(req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...service.store.create(),baseUrl}));});}}]});
  browser=await chromium.launch({headless:true});
  for(const count of counts) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(instrumentation);
    const host=await context.newPage(), viewer=await context.newPage();await viewer.setViewportSize({width:820,height:1180});
    const errors=[];host.on('pageerror',e=>errors.push(e.message));viewer.on('pageerror',e=>errors.push(e.message));
    await host.goto(`${hostOrigin}/src/live/clip.browser.html`);await host.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture.api&&!window.clipFixture.api.getAppState().isLoading);
    await host.evaluate(()=>window.clipFixture.api.updateScene({elements:[]}));
    await host.waitForFunction(()=>document.querySelectorAll('iframe').length===0);
    await host.evaluate(count=>window.clipFixture.port.placeInteractiveHtml({id:`audit-${count}`,lessonId:'synthetic-clips',title:`Audit ${count}`,entry:'index.html',archiveMaterialPath:`interaktiv/audit-${count}`,defaultViewport:{width:600,height:448}}),count);
    const frame=host.frameLocator('iframe').first();await frame.locator('#choose').waitFor();
    await host.getByRole('button',{name:'Live Canvas',exact:true}).click();
    await viewer.goto(await host.getByRole('link',{name:'Teilnehmer öffnen'}).getAttribute('href'));await viewer.getByLabel('Dein Name').fill('Audit');await viewer.getByRole('button',{name:'Beitreten',exact:true}).click();await host.getByRole('button',{name:'Starten',exact:true}).click();await viewer.locator('.live-view-canvas.is-ready').waitFor();
    // Observe actual painted pixels at 40ms resolution; only a 32x32 readback.
    await viewer.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d',{willReadFrequently:true});window.auditPaint=[];setInterval(()=>{let red=0,green=0;for(const source of document.querySelectorAll('.live-view-canvas canvas')){if(!source.width||!source.height)continue;ctx.clearRect(0,0,32,32);ctx.drawImage(source,0,0,32,32);const d=ctx.getImageData(0,0,32,32).data;for(let i=0;i<d.length;i+=4){if(d[i]>245&&d[i+1]<10&&d[i+2]<10)red++;if(d[i]<10&&d[i+1]>120&&d[i+1]<138&&d[i+2]<10)green++;}}const color=green>3?'green':red>3?'red':'none';if(window.auditPaint.at(-1)?.color!==color)window.auditPaint.push({color,at:performance.timeOrigin+performance.now()});},40);});
    for(const mode of process.env.TAFELRAUM_AUDIT_IDLE ? [] : ['follow','clip']) {
      if(mode==='clip'){await host.evaluate(()=>{const h=window.clipFixture.api.getSceneElements().find(e=>e.customData?.materialKind==='interactive-html');window.clipFixture.host.showClip({id:'audit-clip',x:h.x-5,y:h.y-5,width:h.width+10,height:h.height+10});});await viewer.locator('.live-view-canvas.is-clip.is-ready').waitFor();}
      await host.evaluate(()=>{const p=window.clipFixture.host.projector,original=p.project.bind(p);p.project=async(...args)=>{const start=performance.timeOrigin+performance.now();const r=await original(...args);window.audit.push({kind:'project',start,at:performance.timeOrigin+performance.now(),ms:performance.timeOrigin+performance.now()-start,bytes:r.assets.reduce((n,a)=>n+a.blob.size,0),assets:r.assets.length});return r;};});
      for(const pause of [30,130,230]){
        await host.waitForTimeout(pause);
        await frame.locator('#choose').evaluate(e=>e.click());const click=await frame.locator('body').evaluate(()=>window.lastClick);
        await viewer.waitForFunction(click=>window.auditPaint.some(p=>p.at>=click.at&&p.color===(click.green?'green':'red')),click,{timeout:20000});
        const paint=await viewer.evaluate(click=>window.auditPaint.find(p=>p.at>=click.at&&p.color===(click.green?'green':'red')),click);
        const hostLogs=await host.evaluate(({start,end})=>window.audit.filter(e=>e.at>=start-100&&e.at<=end),{start:click.at,end:paint.at});
        const frameLogs=await frame.locator('body').evaluate((_,{start,end})=>window.audit.filter(e=>e.at>=start-100&&e.at<=end),{start:click.at,end:paint.at});
        const viewerLogs=await viewer.evaluate(({start,end})=>window.audit.filter(e=>e.at>=start&&e.at<=end),{start:click.at,end:paint.at});
        results.push({nodes:count,mode,clickAt:click.at,paintMs:paint.at-click.at,hostLogs,frameLogs,viewerLogs});
        console.log(JSON.stringify({nodes:count,mode,paintMs:Math.round(paint.at-click.at),captureChars:hostLogs.find(e=>e.kind==='view-response'&&!e.unchanged)?.chars,projectMs:hostLogs.filter(e=>e.kind==='project').map(e=>Math.round(e.ms))}));
      }
    }
    if(process.env.TAFELRAUM_AUDIT_IDLE){
      const idle=async(label)=>{
        await host.waitForTimeout(450);
        const start=await host.evaluate(()=>performance.timeOrigin+performance.now());
        await host.waitForTimeout(1600);
        const logs=await host.evaluate(start=>window.audit.filter(e=>e.at>=start),start);
        const row={label,nodes:count,windowMs:1600,fullSnapshots:logs.filter(e=>e.kind==='view-response'&&e.chars).length,unchanged:logs.filter(e=>e.kind==='view-response'&&e.unchanged).length,pngEncodes:logs.filter(e=>e.kind==='png-sync').length,longTasks:logs.filter(e=>e.kind==='longtask').map(e=>e.ms),publications:logs.filter(e=>e.kind==='publish').length};idleResults.push(row);console.log(JSON.stringify(row));
      };
      await idle('plain-static');
      await frame.locator('body').evaluate(body=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;body.append(canvas);});
      await idle('one-static-canvas');
      for(let index=0;index<2;index++)await host.evaluate(count=>window.clipFixture.port.placeInteractiveHtml({id:`audit-${count}`,lessonId:'synthetic-clips',title:`Audit ${count}`,entry:'index.html',archiveMaterialPath:`interaktiv/audit-${count}`,defaultViewport:{width:600,height:448}}),count);
      await host.waitForFunction(()=>document.querySelectorAll('iframe').length===3);
      for(const f of host.frames().filter(f=>f!==host.mainFrame())){await f.waitForSelector('#choose');await f.evaluate(()=>{if(!document.querySelector('canvas')){const c=document.createElement('canvas');c.width=c.height=1;document.body.append(c);}});}
      await host.waitForFunction(()=>window.clipFixture.host.state.publicationReady&&!window.clipFixture.host.state.error);
      await idle('three-static-canvases');
    }
    await host.evaluate(()=>window.clipFixture.host.end());await host.waitForTimeout(100);
    console.log(JSON.stringify({nodes:count,errors}));await context.close();
  }
  await writeFile(join(output,`${resultName}-results.json`),JSON.stringify({measuredAt:new Date().toISOString(),sourceHashes,environment:'Production Chromium, loopback, 1440x1000 host / 820x1180 viewer; actual paint sampled every 40ms; synthetic DOM count; no WAN or actual iPad',results,idleResults},null,2));
} finally {
  await writeFile(join(output,`${resultName}-partial-results.json`),JSON.stringify({sourceHashes,results,idleResults},null,2));
  await browser?.close();await server?.close();await service?.close();await rm(scratch,{recursive:true,force:true});
}
