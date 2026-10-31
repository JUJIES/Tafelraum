#!/usr/bin/env node
// Production host fixture + real Live Canvas service/viewer with temporary data.
// Never touches the canonical archive or the fixed public meeting.
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createArchiveMiddleware } from '../prototypes/surface-shell-a-b/archive-server.mjs';
import { createLiveCanvasService } from '../services/live-canvas/server.ts';

const require = createRequire(new URL('../prototypes/surface-shell-a-b/package.json', import.meta.url));
const { build, preview } = await import(require.resolve('vite'));
const { default: react } = await import(require.resolve('@vitejs/plugin-react'));
const root = fileURLToPath(new URL('../prototypes/surface-shell-a-b/', import.meta.url));
const hostPort = Number(process.env.TAFELRAUM_LIVE_INK_HOST_PORT ?? 5178);
const servicePort = Number(process.env.TAFELRAUM_LIVE_INK_SERVICE_PORT ?? 5843);
const hostOrigin = `http://127.0.0.1:${hostPort}`;
const serviceOrigin = `http://127.0.0.1:${servicePort}`;
const archiveRoot = await mkdtemp(join(tmpdir(),'tafelraum-live-ink-archive-'));
const outDir = await mkdtemp(join(tmpdir(),'tafelraum-live-ink-build-'));
await writeFile(join(archiveRoot,'archive.json'),JSON.stringify({format:'tafelraum-unterrichtsarchiv',schemaVersion:1,catalog:{version:1,subjects:[],series:[],lessons:[],hiddenLessonIds:[],trash:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}}));
await build({configFile:false,root,mode:'production',plugins:[react()],
  build:{outDir,emptyOutDir:true,rollupOptions:{input:join(root,'src/live/clip.browser.html')}}});
const service = await createLiveCanvasService({adminKey:'synthetic-live-ink',allowedOrigins:[hostOrigin,serviceOrigin],publicOrigin:serviceOrigin,
  distDir:fileURLToPath(new URL('../prototypes/surface-shell-a-b/dist-live',import.meta.url))});
await service.listen(servicePort);
const server=await preview({configFile:false,root,build:{outDir},preview:{host:'127.0.0.1',port:hostPort,strictPort:true},plugins:[
  {name:'temporary-live-ink',configurePreviewServer(vite){
    vite.middlewares.use(createArchiveMiddleware(archiveRoot));
    vite.middlewares.use('/api/live/rooms',(req,res)=>{
      if(req.method!=='POST'||req.headers['x-live-canvas']!=='create'){res.statusCode=403;res.end();return;}
      res.setHeader('Content-Type','application/json');
      try{res.end(JSON.stringify({...service.store.create(),baseUrl:serviceOrigin}));}
      catch{res.statusCode=409;res.end(JSON.stringify({error:'Live Canvas ist bereits geöffnet.'}));}
    });
  }},
]});
console.log(`Production Live Ink host: ${hostOrigin}/src/live/clip.browser.html`);
let stopping=false;
const stop=async()=>{if(stopping)return;stopping=true;await server.close();await service.close();await rm(archiveRoot,{recursive:true,force:true});await rm(outDir,{recursive:true,force:true});process.exit(0);};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
