// Regression: playback document finishes loading before its async semantic API.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
import {initializeEmptyArchive} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'output/html-playback-restore/';await mkdir(out,{recursive:true});
const archiveRoot=await mkdtemp(out+'archive-');await initializeEmptyArchive(archiveRoot);
const pkg=archiveRoot+'/faecher/subject-start/reihen/series-start/stunden/lesson-start/material/interaktiv/async-html';await mkdir(pkg,{recursive:true});
await writeFile(pkg+'/manifest.json',JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,id:'async-html',title:'Async HTML',entry:'index.html',playback:{protocol:'room-v1',initialState:{version:1,position:0}}}));
await writeFile(pkg+'/index.html',`<!doctype html><body><button>Abspielen</button><output>Loading</output><script>
setTimeout(()=>{let position=location.search.includes("playback=local")?0:17,playing=false;const render=()=>{document.querySelector('button').textContent=playing?'Pause':'Abspielen';document.querySelector('output').textContent=String(position)};
window.tafelraumLive={getState:()=>({version:1,position}),applyState(s){position=s.position;playing=false;render()}};
window.tafelraumPlayback={getStatus:()=>({title:'Async',position,duration:50,playing,volume:1,canNext:false,canPrevious:false}),execute(c){if(c.type==='play')playing=true;if(c.type==='pause')playing=false;render()}};
document.querySelector('button').onclick=()=>{playing=!playing;render()};render();},300);
</script></body>`);
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));const{createServer}=await import(require.resolve('vite'));const{default:react}=await import(require.resolve('@vitejs/plugin-react'));const pw=await import(process.argv[2]),engine=process.env.BROWSER_ENGINE||'chromium';
const archive=createArchiveMiddleware(archiveRoot);const vite=await createServer({configFile:false,cacheDir:out+'vite-cache',root:root+'prototypes/surface-shell-a-b',server:{host:'127.0.0.1',port:5196,strictPort:true,hmr:false,watch:{ignored:['**/src-tauri/target/**','**/desktop-resources/**']}},plugins:[react(),{name:'async-html',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url==='/api/archive/lessons/lesson-start/materials/interactive/async-html'){setTimeout(()=>archive(req,res,next),700);return;}archive(req,res,next);});}}]});await vite.listen();
const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})}),context=await browser.newContext({viewport:{width:1440,height:1000}}),host=await context.newPage();host.setDefaultTimeout(5000);
try{
 await host.goto('http://127.0.0.1:5196/src/live/clip.browser.html?lesson=lesson-start');await host.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture.api&&!window.clipFixture.api.getAppState().isLoading);
 await host.evaluate(()=>window.clipFixture.port.placeInteractiveHtml({id:'async-html',lessonId:'lesson-start',entry:'index.html',title:'Async HTML',archiveMaterialPath:'faecher/subject-start/reihen/series-start/stunden/lesson-start/material/interaktiv/async-html',defaultViewport:{width:900,height:600}}));
 const iframe=host.locator('.interactive-html-canvas-frame iframe[src*="playback=local"]');await iframe.waitFor();const frame=await(await iframe.elementHandle()).contentFrame();await frame.waitForFunction(()=>window.tafelraumPlayback);
 console.log('Before user click:',await iframe.evaluate(el=>({inert:el.inert,src:el.src})));
 await frame.getByRole('button',{name:'Abspielen',exact:true}).click();await frame.waitForFunction(()=>window.tafelraumPlayback.getStatus().playing);assert.equal(await frame.locator('output').textContent(),'17');
 await frame.getByRole('button',{name:'Pause',exact:true}).click();await frame.waitForFunction(()=>!window.tafelraumPlayback.getStatus().playing);assert.equal(await iframe.evaluate(el=>el.inert),false);
 console.log(engine+': delayed semantic API restores state and accepts real Play/Pause clicks');
 await host.screenshot({path:out+engine+'.png'});
}finally{await browser.close();await vite.close();await rm(archiveRoot,{recursive:true,force:true});}
