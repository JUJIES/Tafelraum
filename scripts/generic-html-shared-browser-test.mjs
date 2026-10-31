// Isolated real Canvas/Room, synthetic MP4 plus deterministic YouTube protocol double.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'output/all-html-shared/';await mkdir(out,{recursive:true});
const {createArchiveMiddleware}=await import('../prototypes/surface-shell-a-b/archive-server.mjs');
const {initializeEmptyArchive}=await import('../prototypes/surface-shell-a-b/desktop-server.mjs');
const archiveRoot=await mkdtemp(out+'archive-');await initializeEmptyArchive(archiveRoot);const archive=createArchiveMiddleware(archiveRoot);
const pkg=archiveRoot+'/faecher/subject-start/reihen/series-start/stunden/lesson-start/material/interaktiv/generic-html';await mkdir(pkg,{recursive:true});
await writeFile(pkg+'/manifest.json',JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,id:'generic-html',title:'Generische HTML-Animation',entry:'index.html',playback:{protocol:'room-v1',initialState:{version:1,chapter:0,position:0,answer:''},controllerEntry:'controller.html'}}));
await writeFile(pkg+'/tone.mp4',await readFile(out+'test.mp4'));
await writeFile(pkg+'/controller.html','<!doctype html><body>Veraltete Fernsteuerung</body>');
await writeFile(pkg+'/index.html',`<!doctype html><html><body><h1>HTML-Inhalt</h1><output id="visual"></output><button id="play">Abspielen</button><button id="next">Weiter</button><input aria-label="Antwort"><audio src="./tone.mp4"></audio><script>
let chapter=0,position=0,answer='',playing=false;const audio=document.querySelector('audio');
const render=()=>{document.getElementById('visual').textContent='Kapitel '+chapter+' / '+position.toFixed(1);document.getElementById('play').textContent=playing?'Pause':'Abspielen';};
const publish=()=>dispatchEvent(new CustomEvent('tafelraum:statechange'));
const play=()=>{playing=true;audio.play().catch(()=>{});render()};const pause=()=>{playing=false;audio.pause();render();publish()};
window.tafelraumLive={getState:()=>({version:1,chapter,position,answer}),applyState(s){chapter=s.chapter;position=s.position;answer=s.answer;document.querySelector('input').value=answer;playing=false;audio.pause();render()}};
window.tafelraumPlayback={getStatus:()=>({title:'Kapitel '+chapter,position,duration:20,playing,volume:audio.volume,canNext:true,canPrevious:chapter>0}),execute(c){if(c.type==='play')play();if(c.type==='pause')pause();if(c.type==='seek'){pause();position=c.value;publish()}if(c.type==='volume')audio.volume=c.value;render()}};
document.getElementById('play').onclick=()=>playing?pause():play();document.getElementById('next').onclick=()=>{chapter++;position=0;play();publish()};document.querySelector('input').oninput=e=>{answer=e.target.value;publish()};setInterval(()=>{if(playing){position+=.1;render()}},100);render();
</script></body></html>`);

const {checkInteractiveMaterial}=await import('./check-interactive-material.mjs');await checkInteractiveMaterial({sourceDirectory:pkg});
const bytes=await readFile(out+'test.mp4'),require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const{createServer}=await import(require.resolve('vite'));const{default:react}=await import(require.resolve('@vitejs/plugin-react'));const{chromium}=await import(process.argv[2]);
const vite=await createServer({configFile:false,cacheDir:out+'vite-cache-video',root:root+'prototypes/surface-shell-a-b',server:{host:'127.0.0.1',port:5197,strictPort:true,hmr:false,watch:{ignored:['**/src-tauri/target/**','**/desktop-resources/**']}},plugins:[react(),{name:'synthetic-video',configureServer(s){s.middlewares.use((req,res,next)=>{
 if(req.url?.startsWith('/api/archive/lessons/synthetic-clips/materials/file')){
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range??'');const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(bytes.length-1,Number(range[2])):bytes.length-1;
  res.writeHead(range?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(range?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})});res.end(bytes.subarray(start,end+1));return;
 }
 archive(req,res,next);
 });}}]});await vite.listen();
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true});context.setDefaultTimeout(15000);
await context.route('https://www.youtube-nocookie.com/embed/**',route=>route.fulfill({contentType:'text/html',body:`<html><body>YouTube protocol fixture<script>
let playing=false,position=0,volume=100,muted=false;window.fixture={get playing(){return playing},get position(){return position},get muted(){return muted}};
const send=()=>parent.postMessage({event:'infoDelivery',info:{playerState:playing?1:2,currentTime:position,duration:40,volume}},'*');
addEventListener('message',e=>{let m;try{m=JSON.parse(e.data)}catch{return};if(m.event==='listening')send();if(m.event!=='command')return;if(m.func==='playVideo')playing=true;if(m.func==='pauseVideo')playing=false;if(m.func==='seekTo')position=m.args[0];if(m.func==='setVolume')volume=m.args[0];if(m.func==='mute')muted=true;if(m.func==='unMute')muted=false;send();});setInterval(()=>{if(playing)position+=.1;send()},100);
</script></body></html>`}));
const host=await context.newPage(),checks=[],errors=[];host.on('pageerror',e=>errors.push(e.message));host.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});let room;
const record=x=>{checks.push(x);console.log(x)};
try{
 await host.goto('http://127.0.0.1:5197/src/live/clip.browser.html?lesson=lesson-start&theme=dark');await host.waitForFunction(()=>window.clipFixture?.api&&window.clipFixture.port&&!window.clipFixture.api.getAppState().isLoading);await host.waitForTimeout(300);
 await host.evaluate(()=>window.clipFixture.port.placeInteractiveHtml({id:'generic-html',lessonId:'lesson-start',entry:'index.html',title:'Generische HTML-Animation',archiveMaterialPath:'faecher/subject-start/reihen/series-start/stunden/lesson-start/material/interaktiv/generic-html',defaultViewport:{width:900,height:600}}));
 const getFrame=async(page,selector)=>{const el=page.locator(selector);await el.waitFor();return(await el.elementHandle()).contentFrame()};
 let teacher=await getFrame(host,'.interactive-html-canvas-frame iframe[src*="playback=local"]');await teacher.waitForFunction(()=>window.tafelraumPlayback);
 const popup=context.waitForEvent('page');await host.evaluate(()=>window.clipFixture.room.start());room=await popup;room.on('pageerror',e=>errors.push(e.message));
 teacher=await getFrame(host,'.interactive-html-canvas-frame iframe:not([src*="playback=local"])');const front=await getFrame(room,'[data-room-material-id] iframe');await front.waitForFunction(()=>window.tafelraumPlayback);
 assert.equal(await teacher.locator('h1').textContent(),'HTML-Inhalt');assert.doesNotMatch(await teacher.locator('body').textContent(),/Veraltete Fernsteuerung/);record('Legacy controller metadata cannot replace the original HTML');
 await teacher.getByRole('button',{name:'Abspielen',exact:true}).click();await front.waitForFunction(()=>window.tafelraumPlayback.getStatus().playing);await host.waitForTimeout(900);
 const positions=await Promise.all([teacher,front].map(f=>f.evaluate(()=>window.tafelraumPlayback.getStatus().position)));assert.ok(Math.abs(positions[0]-positions[1])<.7);assert.equal(await teacher.locator('audio').evaluate(v=>v.muted),true);record('Legacy getStatus/execute API is synchronized without package-specific code, teacher media stays silent');
 await teacher.getByRole('button',{name:'Weiter',exact:true}).click();await front.waitForFunction(()=>window.tafelraumLive.getState().chapter===1&&window.tafelraumPlayback.getStatus().playing);record('Teacher chapter action reaches the Room and continues playback');
 await front.getByRole('button',{name:'Pause',exact:true}).click();await teacher.waitForFunction(()=>!window.tafelraumPlayback.getStatus().playing);record('Room Pause reaches the teacher');
 await teacher.getByLabel('Antwort',{exact:true}).fill('Mac');await front.waitForFunction(()=>window.tafelraumLive.getState().answer==='Mac');await front.getByLabel('Antwort',{exact:true}).fill('Vorne');await teacher.waitForFunction(()=>window.tafelraumLive.getState().answer==='Vorne');record('Semantic inputs still synchronize in both directions');
 await host.screenshot({path:out+'generic-html.png'});
 assert.deepEqual(errors,[]);await writeFile(out+'generic-html-checks.json',JSON.stringify({checks,errors},null,2));
}catch(e){await host.screenshot({path:out+'generic-html-failure.png'}).catch(()=>{});throw e;}finally{await host.evaluate(()=>window.clipFixture?.room.stop()).catch(()=>{});await browser.close();await vite.close();await rm(archiveRoot,{recursive:true,force:true});}
