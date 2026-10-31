#!/usr/bin/env node
// Production React/Canvas fixture with a temporary archive. Never touches the real archive.
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createArchiveMiddleware } from '../prototypes/surface-shell-a-b/archive-server.mjs';

const require = createRequire(new URL('../prototypes/surface-shell-a-b/package.json', import.meta.url));
const { build, preview } = await import(require.resolve('vite'));
const { default: react } = await import(require.resolve('@vitejs/plugin-react'));
const root = fileURLToPath(new URL('../prototypes/surface-shell-a-b/', import.meta.url));
const port = Number(process.env.TAFELRAUM_INK_PERF_PORT ?? 5178);
const archiveRoot = await mkdtemp(join(tmpdir(),'tafelraum-ink-archive-'));
const outDir = await mkdtemp(join(tmpdir(),'tafelraum-ink-build-'));
await writeFile(join(archiveRoot,'archive.json'),JSON.stringify({format:'tafelraum-unterrichtsarchiv',schemaVersion:1,catalog:{version:1,subjects:[],series:[],lessons:[],hiddenLessonIds:[],trash:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}}));
await build({configFile:false,root,mode:'production',plugins:[react()],define:{'window.devicePixelRatio':'Math.max(window.devicePixelRatio, 2)'},
  build:{outDir,emptyOutDir:true,rollupOptions:{input:join(root,'src/live/clip.browser.html')}}});
const server=await preview({configFile:false,root,build:{outDir},preview:{host:'127.0.0.1',port,strictPort:true},
  plugins:[{name:'temporary-ink-archive',configurePreviewServer(vite){vite.middlewares.use(createArchiveMiddleware(archiveRoot));}}]});
console.log(`Production ink fixture: http://127.0.0.1:${port}/src/live/clip.browser.html`);
let stopping=false;
const stop=async()=>{if(stopping)return;stopping=true;await server.close();await rm(archiveRoot,{recursive:true,force:true});await rm(outDir,{recursive:true,force:true});process.exit(0);};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
