// Isolated real Canvas/Room, synthetic MP4 plus deterministic YouTube protocol double.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'output/all-html-shared/';await mkdir(out,{recursive:true});
const {createArchiveMiddleware}=await import('../prototypes/surface-shell-a-b/archive-server.mjs');
const {initializeEmptyArchive}=await import('../prototypes/surface-shell-a-b/desktop-server.mjs');
const archiveRoot=await mkdtemp(out+'archive-');await initializeEmptyArchive(archiveRoot);const archive=createArchiveMiddleware(archiveRoot);
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
const host=await context.newPage(),checks=[],errors=[];host.on('pageerror',e=>errors.push(e.message));let room;
const record=x=>{checks.push(x);console.log(x)};
try{
 await host.goto('http://127.0.0.1:5197/src/live/clip.browser.html?lesson=lesson-start&theme=dark');await host.waitForFunction(()=>window.clipFixture?.api&&window.clipFixture.port);
 await host.getByRole('button',{name:'Testvideo',exact:true}).click();await host.locator('.local-video-canvas-player video').waitFor();
 await host.waitForFunction(()=>document.querySelector('.local-video-canvas-player video')?.readyState>=1);
 await host.locator('.local-video-canvas-player video').evaluate(v=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=3;}));
 await host.locator('.local-video-canvas-player').getByRole('slider',{name:'Lautstärke',exact:true}).fill('0.45');
 const popup=context.waitForEvent('page');await host.evaluate(()=>window.clipFixture.room.start());room=await popup;room.on('pageerror',e=>errors.push(e.message));
 const controls=host.locator('.room-video-controller');await controls.waitFor();assert.equal(await host.locator('video,iframe[src*="youtube"]').count(),0);record('Room mode replaces teacher video with controls and unloads the teacher decoder');
 await controls.getByRole('button',{name:'Abspielen',exact:true}).tap();const video=room.locator('.room-media video');await video.waitFor();await room.waitForFunction(()=>document.querySelector('.room-media video')&&!document.querySelector('.room-media video').paused);await room.waitForTimeout(800);
 assert.equal(await video.evaluate(v=>v.muted),false);assert.ok(Math.abs(await video.evaluate(v=>v.volume)-.45)<.01,'volume survives handoff');assert.ok(await video.evaluate(v=>v.currentTime)>3);assert.equal(await controls.getByRole('button',{name:'Pausieren',exact:true}).count(),1);record('Exactly one audible Room player runs; its confirmed status drives teacher controls');
 await controls.getByRole('button',{name:'Pausieren',exact:true}).tap();await room.waitForFunction(()=>document.querySelector('.room-media video').paused);
 await controls.getByRole('slider',{name:'Wiedergabeposition',exact:true}).fill('8');await room.waitForTimeout(500);assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-8)<.3);
 await controls.getByRole('slider',{name:'Lautstärke',exact:true}).fill('0.35');await room.waitForTimeout(400);assert.ok(Math.abs(await video.evaluate(v=>v.volume)-.35)<.01);record('Pause, seek and volume control the Room player');await host.screenshot({path:out+'controller-dark.png'});await room.screenshot({path:out+'room-video.png'});
 await controls.getByRole('button',{name:'Abspielen',exact:true}).tap();await room.waitForTimeout(450);await room.evaluate(()=>window.originalVideo=document.querySelector('.room-media video'));
 await controls.getByRole('button',{name:'Vollbild',exact:true}).tap();await host.waitForFunction(()=>Boolean(window.clipFixture.room.state.mediaFullscreenId));await room.waitForTimeout(400);assert.equal(await room.evaluate(()=>window.originalVideo===document.querySelector('.room-media video')),true);
 await controls.getByRole('button',{name:'Vollbild verlassen',exact:true}).tap();record('Fullscreen keeps the same output player');
 // Reposition the active viewport repeatedly while the output is playing.
 await host.evaluate(()=>{
   const room=window.clipFixture.room,video=room.api.getSceneElements().find(e=>e.customData?.materialKind==='video');
   room.showClip({id:'moving-video',number:8,x:video.x,y:video.y,width:video.width,height:video.height});
 });
 await room.waitForTimeout(450);
 await room.evaluate(()=>{window.movingPlayer=document.querySelector('.room-media video');});
 const beforeMove=await video.evaluate(v=>v.currentTime);
 await host.evaluate(async()=>{
   const room=window.clipFixture.room,clip=room.state.target.clip;
   for(let i=1;i<=16;i++){room.moveClip({...clip,x:clip.x+i*2,y:clip.y+i});await new Promise(r=>setTimeout(r,35));}
 });
 assert.equal(await room.evaluate(()=>window.movingPlayer===document.querySelector('.room-media video')),true);
 assert.equal(await video.evaluate(v=>v.paused),false);
 assert.ok(await video.evaluate(v=>v.currentTime)>beforeMove);
 record('Moving the active clip keeps the same playing MP4 output');
 // Drop only the media heartbeat and all teacher commands, leaving the app and channel intact.
 await host.evaluate(()=>{const channel=window.clipFixture.room.channel;window.originalPost=channel.postMessage.bind(channel);channel.postMessage=m=>{if(m.type!=='media-lease')window.originalPost(m)};});
 await room.waitForTimeout(3400);assert.equal(await video.evaluate(v=>v.paused),true);record('An expired host lease pauses the output');
 await host.evaluate(()=>{window.clipFixture.room.channel.postMessage=window.originalPost;});
 await host.getByRole('button',{name:'Test-YouTube',exact:true}).click();const yt=host.locator('.room-video-controller').filter({hasText:'Test YouTube'});await yt.waitFor();assert.equal(await host.locator('iframe[src*="youtube"]').count(),0);
 await yt.getByRole('button',{name:'Abspielen',exact:true}).tap();const iframe=room.locator('.room-media iframe');await iframe.waitFor();const front=await(await iframe.elementHandle()).contentFrame();await front.waitForFunction(()=>window.fixture.playing&&!window.fixture.muted);await yt.getByRole('button',{name:'Pausieren',exact:true}).waitFor();record('YouTube uses the same controls and one output iframe (protocol fixture)');
 await host.evaluate(()=>window.clipFixture.room.stop());await host.locator('.room-video-controller').waitFor({state:'detached'});assert.equal(await host.locator('.local-video-canvas-player video').count(),1);assert.equal(await host.locator('.local-video-canvas-player video').evaluate(v=>v.paused),true);record('Room end restores paused local playback');
 assert.deepEqual(errors,[]);await writeFile(out+'video-checks.json',JSON.stringify({checks,errors},null,2));
}catch(e){await host.screenshot({path:out+'video-failure.png'}).catch(()=>{});throw e;}finally{await host.evaluate(()=>window.clipFixture?.room.stop()).catch(()=>{});await browser.close();await vite.close();await rm(archiveRoot,{recursive:true,force:true});}
