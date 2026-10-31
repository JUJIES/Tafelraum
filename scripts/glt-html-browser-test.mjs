// Historical D-278/D-281 controller-UI assertions; superseded by D-295.
// Current Room regression: generic-html-shared-browser-test, language-bites-shared-browser-test, room-video-controller-browser-test.
// Real CanvasSurface/Room, real archive middleware and real gLT packages.
// Only the dedicated test archive created by prepare-glt-html-test is opened.
import assert from 'node:assert/strict';
import {projectedFrameClick as roomClick,projectedFramePoint} from './glt-playback-controller/browser-pointer.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'output/glt-html-integration');
const archiveRoot=path.join(output,'test-archive');
const installation=JSON.parse(await readFile(path.join(output,'installation.json'),'utf8'));
const {compileProject}=await import(pathToFileURL(path.resolve(installation.wikiExport,'../../lib/project.ts')).href);
const archive=JSON.parse(await readFile(path.join(archiveRoot,'archive.json'),'utf8'));
assert.equal(archive.testPurpose,'glt-html-integration');
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const {createServer}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium}=await import(process.argv[2]);
await mkdir(output,{recursive:true});
const vite=await createServer({configFile:false,cacheDir:path.join(output,'vite-cache'),root:path.join(root,'prototypes/surface-shell-a-b'),
  server:{host:'127.0.0.1',port:5199,strictPort:true,watch:{ignored:['**/src-tauri/target/**']}},plugins:[react(),{name:'glt-test-archive',configureServer(server){server.middlewares.use(createArchiveMiddleware(archiveRoot));}}]});
let browser;const checks=[],errors=[];
async function scrubRunning(teacher,output,page){
  await teacher.waitForFunction(()=>window.tafelraumPlaybackController.getStatus()?.playing);
  const range=teacher.locator('#seek'),start=await projectedFramePoint(teacher,range,.2),end=await projectedFramePoint(teacher,range,.35);
  await output.evaluate(()=>{window.__scrubCommands=[];window.addEventListener('message',event=>{
    if(event.data?.type==='tafelraum:playback-host'&&event.data.action==='command'&&['seek','play'].includes(event.data.command.type))window.__scrubCommands.push(event.data.command.type);
  });});
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});
  const target=Number(await range.inputValue());assert.deepEqual(await output.evaluate(()=>window.__scrubCommands),[]);
  await page.mouse.up();
  await output.waitForFunction(target=>{const status=window.tafelraumPlayback.getStatus();return status.playing&&status.position>target+.4&&status.position<target+3;},target);
  assert.deepEqual(await output.evaluate(()=>window.__scrubCommands),['seek','play']);
  await teacher.waitForFunction(target=>Number(document.getElementById('seek').value)>target+.1,target);
}
try {
  await vite.listen();
  const origin='http://127.0.0.1:5199';
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  context.setDefaultTimeout(15000);
  const host=await context.newPage();
  const watch=page=>{page.on('pageerror',error=>{errors.push(error.message);console.error('Page:',error.message);});page.on('console',message=>{if(message.type()==='error')console.error('Console:',message.text());});page.on('response',response=>{if(response.status()===404)console.error('Missing:',response.url());});};watch(host);
  const open=async lesson=>{
    await host.goto(`${origin}/src/live/clip.browser.html?lesson=${lesson}`);
    await host.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture.api&&!window.clipFixture.api.getAppState().isLoading);
  };
  const state=frame=>frame.locator('body').evaluate(()=>window.tafelraumLive.getState());
  // This regression is deliberately the original three-package contract check.
  // The complete rehearsal lesson has its own multi-material integration test.
  for(const lesson of archive.catalog.lessons.filter(value=>['test-glt-lernszenen-player','test-glt-hattie-aufloesung','test-glt-hattie-wiki'].includes(value.id))){
    console.log('Testing',lesson.id);
    const response=await context.request.get(`${origin}/api/archive/lessons/${lesson.id}/materials`);
    assert.equal(response.status(),200);
    const materials=(await response.json()).materials;
    const material=materials.find(value=>value.kind==='interactive');assert.ok(material);
    const id=material.path.split('/').at(-1);
    const descriptor=await (await context.request.get(`${origin}/api/archive/lessons/${lesson.id}/materials/interactive/${id}`)).json();
    assert.equal(descriptor.live,null,'no implied Remote Canvas publication');
    await open(lesson.id);
    console.log('Canvas ready');
    await host.evaluate(()=>window.clipFixture.api.updateScene({elements:[]}));
    await host.evaluate(({lesson,id,descriptor,viewport})=>window.clipFixture.port.placeInteractiveHtml({id,lessonId:lesson.id,title:descriptor.title,
      entry:descriptor.entry,print:descriptor.print,archiveMaterialPath:`${lesson.materialBasis.archivePath}/interaktiv/${id}`,
      defaultViewport:viewport}),{lesson,id,descriptor,viewport:material.defaultViewport});
    await host.locator('.interactive-html-canvas-frame iframe').waitFor();
    const teacherFrame=async(local=false)=>{
      const locator=host.locator(local?'.interactive-html-canvas-frame iframe[src*="tafelraum-playback=local"]':'.interactive-html-canvas-frame iframe');
      await locator.waitFor();
      let frame;
      for(let attempt=0;attempt<10&&!frame;attempt++){
        frame=await (await locator.elementHandle()).contentFrame();
        if(!frame)await host.waitForFunction(()=>Boolean(document.querySelector('.interactive-html-canvas-frame iframe')?.contentWindow));
      }
      assert.ok(frame,'the current teacher document has an attached browsing context');
      return frame;
    };
    let frame=await teacherFrame(Boolean(descriptor.playback));
    await frame.waitForFunction(()=>Boolean(window.tafelraumLive),{timeout:15000});
    console.log('Package ready');
    const elementId=await host.evaluate(()=>window.clipFixture.api.getSceneElements().find(el=>el.customData?.materialKind==='interactive-html').id);
    await host.evaluate(id=>window.clipFixture.api.updateScene({appState:{selectedElementIds:{[id]:true}}}),elementId);
    await host.getByRole('button',{name:'Inhalte werden beim Wiederöffnen behalten',exact:true}).waitFor();
    console.log('State ready');
    // Native geometry is still the only source; reposition and proportionally resize.
    await host.evaluate(({id,viewport})=>{const api=window.clipFixture.api;api.updateScene({elements:api.getSceneElements().map(el=>el.id===id?{...el,x:80,y:40,width:960,height:960*viewport.height/viewport.width}:el)});},{id:elementId,viewport:material.defaultViewport});
    await host.getByRole('button',{name:'Hand',exact:true}).click();
    let localPosition=0;
    if(descriptor.playback){
      frame=await teacherFrame(true);
      await frame.waitForFunction(()=>location.search.includes('tafelraum-playback=local')&&Boolean(window.tafelraumPlayback));
      await host.locator('.interactive-html-canvas-frame iframe:not([inert])').waitFor();
      if(id==='glt-lernszenen-player'){
        await frame.getByRole('button',{name:'Zur ersten Szene',exact:true}).click();
        await frame.getByRole('button',{name:'Szene 1 abspielen',exact:true}).click();
        await frame.waitForFunction(()=>document.getElementById('video-ferris').currentTime>.5);
        localPosition=await frame.locator('#video-ferris').evaluate(video=>video.currentTime);
        checks.push('Without Room the original teacher player runs locally');
      }
    }
    const roomPagePromise=context.waitForEvent('page');
    await host.evaluate(()=>window.clipFixture.room.start());
    let room=await roomPagePromise;watch(room);await room.setViewportSize({width:1280,height:800});
    await host.waitForFunction(()=>window.clipFixture.room.state.ready);
    await host.evaluate(id=>window.clipFixture.room.showMaterial(id,'gLT Test'),elementId);
    await room.locator('.live-interactive-material iframe').waitFor();
    let front=await (await room.locator('.live-interactive-material iframe').elementHandle()).contentFrame();
    await front.waitForFunction(()=>Boolean(window.tafelraumLive));
    console.log('Room ready');
    if(descriptor.playback){
      frame=await teacherFrame();
      assert.equal(await frame.locator('video,audio,canvas').count(),0,'teacher contains controls, no media renderer');
      assert.ok(await frame.evaluate(()=>Boolean(window.tafelraumPlaybackController)&&!window.tafelraumPlayback),'authored surface uses only the host controller');
      assert.equal(await frame.locator('script[src*="viewer.js"],script[src="player.js"]').count(),0,'teacher never loads Remotion or the native media-player script');
      if(id==='glt-lernszenen-player')assert.equal(await front.locator('.video-fullscreen').count(),0,'no extra video fullscreen button');
      if(id==='glt-lernszenen-player'){
        assert.equal(await frame.locator('#ferris-intro').innerHTML(),await front.locator('#ferris-intro').innerHTML(),'film cover uses the unchanged original markup');
      }else assert.equal(await frame.locator('#scene-preview').count(),1,'wiki uses authored static scene previews');
      await frame.waitForFunction(()=>!document.getElementById('next').disabled);
      assert.ok(front.url().includes('tafelraum-playback=output'));
      await host.locator('.live-host-trigger').click();
      await host.getByRole('button',{name:'Raumvorschau',exact:true}).click();
      await host.locator('.student-preview-render iframe').waitFor();
      const preview=await (await host.locator('.student-preview-render iframe').elementHandle()).contentFrame();
      assert.ok(!preview.url().includes('tafelraum-playback=output'),'preview never becomes an output');
      assert.equal(await preview.locator('audio,video,canvas').count(),0,'preview has no second decoder/composition');
      await host.getByRole('button',{name:'Raumvorschau schließen',exact:true}).click();
    }
    if(id==='glt-lernszenen-player'){
      await front.evaluate(()=>{
        window.__fullscreenTrace=[];
        window.addEventListener('message',event=>{if(event.data?.type==='tafelraum:playback-host'&&event.data.action==='command')window.__fullscreenTrace.push(event.data.command);});
        document.addEventListener('play',()=>window.__fullscreenTrace.push('play'),true);document.addEventListener('pause',()=>window.__fullscreenTrace.push('pause'),true);
      });
      // preload=none keeps the retained time in package state until metadata loads.
      await front.waitForFunction(position=>document.getElementById('video-ferris').paused&&window.tafelraumLive.getState().positions[0]>=position,localPosition);
      await frame.locator('#previous').click();
      await frame.waitForFunction(()=>window.tafelraumLive.getState().slide===0);
      await frame.locator('#next').click();
      await front.locator('#ferris-video').waitFor({state:'visible'});
      console.log('Film slide synchronized');
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(()=>document.getElementById('video-ferris').currentTime>.4);
      console.log('First video playing');
      await scrubRunning(frame,front,host);checks.push('Film running scrub confirms target, resumes once and advances without another Play click');
      await frame.waitForFunction(()=>document.getElementById('connection').textContent==='Wiedergabe im Room Canvas');
      const teacherPoster=await frame.locator('#ferris-video .controller-image').getAttribute('src');
      await frame.waitForFunction(()=>document.getElementById('connection').textContent==='Wiedergabe im Room Canvas');
      assert.equal(await frame.locator('#ferris-video .controller-image').getAttribute('src'),teacherPoster,'running playback leaves the teacher image still');
      await host.screenshot({path:path.join(output,'matching-film-teacher.png')});
      await room.screenshot({path:path.join(output,'matching-film-room.png')});
      const fullscreenTarget=await host.evaluate(()=>JSON.stringify(window.clipFixture.room.state.target));
      const outputWindow=front;
      const videoHandle=await front.locator('#video-ferris').elementHandle();
      const timeBeforeFullscreen=await videoHandle.evaluate(video=>video.currentTime);
      // Hold through at least one output heartbeat: status must not reparent
      // the pressed control and swallow the eventual click (native WebKit bug).
      await frame.getByRole('button',{name:'Video im Room als Vollbild',exact:true}).click({delay:700});
      // Browser permissions may require the first click in Room. Either the
      // actual fullscreen status or an explicit blocked notice must arrive.
      await frame.waitForFunction(()=>document.getElementById('fullscreen').getAttribute('aria-pressed')==='true'
        ||document.getElementById('connection').textContent.includes('Vollbild wurde blockiert'));
      if(await room.evaluate(()=>Boolean(document.fullscreenElement))){
        await front.waitForFunction(()=>document.fullscreenElement===document.getElementById('video-ferris'));
        const rect=await front.locator('#video-ferris').evaluate(video=>{
          const b=video.getBoundingClientRect();return {width:b.width,height:b.height,vw:innerWidth,vh:innerHeight};
        });
        assert.ok(Math.abs(rect.width-rect.vw)<2&&Math.abs(rect.height-rect.vh)<2,'only video fills the output viewport');
        await room.screenshot({path:path.join(output,'video-fullscreen-room.png')});
        await frame.getByRole('button',{name:'Video-Vollbild verlassen',exact:true}).click();
        await room.waitForFunction(()=>!document.fullscreenElement);
        await front.waitForFunction(()=>!document.fullscreenElement);
        assert.ok(await videoHandle.evaluate(video=>video.currentTime)>=timeBeforeFullscreen,'time never restarts');
        assert.equal(await videoHandle.evaluate(video=>video===document.getElementById('video-ferris')&&!video.paused),true,'same running video after exit');
        await frame.waitForFunction(()=>document.getElementById('fullscreen').getAttribute('aria-pressed')==='false');
        await frame.getByRole('button',{name:'Video im Room als Vollbild',exact:true}).click();
        await front.waitForFunction(()=>Boolean(document.fullscreenElement));
        await room.keyboard.press('Escape');
        await front.waitForFunction(()=>!document.fullscreenElement);
      }
      assert.equal(front,outputWindow);
      assert.equal(await host.evaluate(()=>JSON.stringify(window.clipFixture.room.state.target)),fullscreenTarget,'fullscreen does not change the Room target');
      assert.equal(await frame.locator('video,audio').count(),0);
      checks.push('Teacher Room fullscreen command reports confirmed state or browser permission error without changing target/player');
      await frame.getByRole('button',{name:'Pause',exact:true}).click();
      await front.waitForFunction(()=>document.getElementById('video-ferris').paused);
      await frame.locator('#seek').focus();await frame.locator('#seek').press('Home');
      for(let i=0;i<20;i++)await frame.locator('#seek').press('ArrowRight');
      await frame.locator('#seek').press('Tab');
      await front.waitForFunction(()=>Math.abs(window.tafelraumLive.getState().positions[0]-2)<.11);
      console.log('Paused position synchronized');
      await frame.waitForFunction(()=>Math.abs(window.tafelraumLive.getState().positions[0]-2)<.11);
      await roomClick(front,room,front.getByRole('button',{name:'Zum zweiten Film',exact:true}));
      await frame.waitForFunction(()=>window.tafelraumLive.getState().slide===2);
      await roomClick(front,room,front.getByRole('button',{name:'Zur zweiten Szene',exact:true}));
      await frame.waitForFunction(()=>window.tafelraumLive.getState().slide===3);
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(()=>document.getElementById('video-karate').currentTime>.4);
      await frame.getByRole('button',{name:'Pause',exact:true}).click();
      await front.waitForFunction(()=>document.getElementById('video-karate').paused);
      await frame.getByRole('button',{name:'Abspielen',exact:true}).waitFor();
      // A cover revokes playback even though the package iframe remains mounted.
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(()=>!document.getElementById('video-karate').paused);
      await host.evaluate(id=>window.clipFixture.api.updateScene({appState:{selectedElementIds:{[id]:true}}}),elementId);
      await host.getByRole('button',{name:'HTML ganz abdecken',exact:true}).click();
      await front.waitForFunction(()=>document.getElementById('video-karate').paused);
      await host.evaluate(()=>{const api=window.clipFixture.api;api.updateScene({elements:api.getSceneElements().filter(el=>el.customData?.role!=='image-cover')});});
      await frame.waitForFunction(()=>!document.getElementById('play').disabled);
      assert.equal(await front.locator('#video-karate').evaluate(video=>video.paused),true,'uncover never auto-resumes');
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(()=>!document.getElementById('video-karate').paused);
      // Drop the owner heartbeat without closing the actual output: watchdog must pause.
      await host.evaluate(()=>{window.clipFixture.room.channel.postMessage=()=>{};});
      await front.waitForFunction(()=>document.getElementById('video-karate').paused,null,{timeout:5000});
      await frame.waitForFunction(()=>document.getElementById('play').disabled);
      checks.push('Full cover pauses, uncover does not resume, lost owner heartbeat pauses and disconnects controls');
      await host.evaluate(()=>window.clipFixture.room.stop(false));
      await room.close();
      frame=await teacherFrame(true);
      const reopened=context.waitForEvent('page');await host.evaluate(()=>window.clipFixture.room.start());
      room=await reopened;watch(room);await room.setViewportSize({width:1280,height:800});
      await host.waitForFunction(()=>window.clipFixture.room.state.ready);
      frame=await teacherFrame();
      await host.evaluate(id=>window.clipFixture.room.showMaterial(id,'gLT Test'),elementId);
      await room.locator('.live-interactive-material iframe').waitFor();
      front=await (await room.locator('.live-interactive-material iframe').elementHandle()).contentFrame();
      await frame.waitForFunction(()=>!document.getElementById('play').disabled);
      assert.equal(await front.locator('video').evaluateAll(videos=>videos.every(video=>video.paused)),true,'Room reopen restores position without playing');
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(()=>!document.getElementById('video-karate').paused);
      await frame.getByRole('button',{name:'Pause',exact:true}).click();
      await frame.getByRole('button',{name:'Abspielen',exact:true}).waitFor();
      checks.push('Room close/reopen restores the retained slide and remains paused until a deliberate teacher Play');
      checks.push('Both MP4s play only in Room; teacher Play/Pause/Seek and Room navigation retain paused semantic state');
    }else if(id==='glt-hattie-aufloesung'){
      await frame.locator('#keySection').click();
      await front.waitForFunction(()=>window.tafelraumLive.getState().revealedGroups===1);
      await roomClick(front,room,front.locator('#keySection'));
      await frame.waitForFunction(()=>window.tafelraumLive.getState().revealedGroups===2);
      await frame.locator('tbody tr.is-revealed').last().scrollIntoViewIfNeeded();
      for(const view of [frame,front])await view.locator('#keySection').evaluate(async element=>{
        await Promise.all(element.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})));
      });
      checks.push('Research reveal actions synchronize teacher ↔ Room');
    }else{
      await frame.locator('#next').click();
      await frame.waitForFunction(()=>window.tafelraumLive.getState().frame>0);
      const compiled=await front.locator('body').evaluate(()=>JSON.parse(document.getElementById('video-lab-project').textContent));
      // Scene start frames are compiled by Video Lab, never guessed from voice durations.
      const timing=compileProject(compiled);
      const worksheet=timing.scenes.find(scene=>scene.id==='arbeitsbogen');assert.ok(worksheet);
      for(const scene of timing.scenes.slice(2)){
        await frame.locator('#next').click();
        await frame.waitForFunction(start=>window.tafelraumLive.getState().frame>=start,scene.startFrame);
      }
      await frame.getByRole('button',{name:'Abspielen',exact:true}).click();
      await front.waitForFunction(target=>window.tafelraumLive.getState().frame>=target,worksheet.startFrame+5*compiled.canvas.fps);
      await frame.waitForFunction(()=>document.getElementById('scene-preview').getAttribute('src').includes('arbeitsbogen.png'));
      await front.waitForFunction(()=>[...document.querySelectorAll('audio')].some(audio=>audio.readyState>=2&&audio.currentTime>.1&&!audio.paused&&!audio.error));
      await scrubRunning(frame,front,host);checks.push('Wiki running scrub resumes animation/narration after target confirmation');
      await frame.getByRole('button',{name:'Pause',exact:true}).click();
      await front.locator('.worksheet-body').waitFor();
      const audio=await front.locator('audio').evaluateAll(elements=>elements.map(element=>({ready:element.readyState,error:element.error?.message??null})));
      assert.ok(audio.some(element=>!element.error),'local narration remains available after pause');
      assert.equal(await front.locator('iframe').count(),0,'no nested frame or relaxed CSP');
      assert.ok(await front.locator('.worksheet-body').count(),'real worksheet content rendered in Shadow DOM');
      await host.screenshot({path:path.join(output,'wiki-worksheet-canvas.png')});
      await room.screenshot({path:path.join(output,'wiki-worksheet-room.png')});
      const before=await state(frame);
      await front.waitForFunction(position=>window.tafelraumLive.getState().frame===position,before.frame);
      await frame.locator('#previous').click();
      const previous=timing.scenes.at(-2);
      await frame.waitForFunction(start=>window.tafelraumLive.getState().frame===start,previous.startFrame);
      checks.push('Wiki native player navigation and real worksheet snapshot run under unchanged frame-src none');
    }
    const expected=await state(frame);
    await host.evaluate(()=>window.clipFixture.port.flushPersistence());
    await host.screenshot({path:path.join(output,`${id}-canvas.png`)});
    await room.screenshot({path:path.join(output,`${id}-room.png`)});
    await host.evaluate(()=>window.clipFixture.room.stop());await room.close();
    if(descriptor.playback){
      frame=await teacherFrame(true);
      await frame.waitForFunction(()=>location.search.includes('tafelraum-playback=local')&&Boolean(window.tafelraumPlayback));
      await frame.waitForFunction(expected=>JSON.stringify(window.tafelraumLive.getState())===JSON.stringify(expected),expected);
      assert.equal(await frame.locator('video,audio').evaluateAll(media=>media.every(value=>value.paused)),true,'handoff back never autoplays');
      checks.push(`${id}: Room stop restores the original local player and retained paused state`);
    }
    await open(lesson.id);
    await host.locator('.interactive-html-canvas-frame iframe').waitFor();
    const restored=await teacherFrame(Boolean(descriptor.playback));
    await restored.waitForFunction(()=>Boolean(window.tafelraumLive));
    if(descriptor.playback)await restored.waitForFunction(()=>location.search.includes('tafelraum-playback=local')&&Boolean(window.tafelraumPlayback));
    await restored.waitForFunction(expected=>JSON.stringify(window.tafelraumLive.getState())===JSON.stringify(expected),expected);
    assert.deepEqual(await state(restored),expected,'keep + reload restores semantic state');
    assert.equal(await restored.locator('video').evaluateAll(videos=>videos.every(video=>video.paused)),true,'reload never starts video');
    checks.push(`${id}: archive listing, native geometry, keep/reload, no autoplay`);
    await host.getByRole('button',{name:'Auswahl',exact:true}).click();
    await host.evaluate(()=>{const api=window.clipFixture.api;const id=api.getSceneElements().find(el=>el.customData?.materialKind==='interactive-html').id;api.updateScene({appState:{selectedElementIds:{[id]:true}}});});
    await host.getByRole('button',{name:'Inhalte zurücksetzen',exact:true}).click();
    await host.getByRole('button',{name:'Zurücksetzen',exact:true}).click();
    await host.getByRole('button',{name:'HTML ganz abdecken',exact:true}).click();
    await host.locator('.interactive-html-canvas-frame.is-fully-covered').waitFor({state:'attached'});
    assert.equal(await host.locator('.interactive-html-canvas-frame.is-fully-covered').isVisible(),false,'full cover hides the HTML surface');
    await host.evaluate(()=>{const api=window.clipFixture.api;api.updateScene({elements:api.getSceneElements().filter(el=>el.customData?.role!=='image-cover')});});
    await host.evaluate(()=>window.clipFixture.port.flushPersistence());
  }
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'results.json'),JSON.stringify({ok:true,checks,errors,note:'Single-owner HTML playback: isolated browser/test archive only. Native extended-display/audio hardware acceptance remains open.'},null,2)+'\n');
  console.log(JSON.stringify({ok:true,checks},null,2));
}catch(error){
  if(browser)console.log('Host playback diagnostics',await browser.contexts()[0].pages()[0].evaluate(async()=>{
    const bridge=await import('/src/canvas/interactive-html-live.ts');
    return {room:window.clipFixture?.room.state,frames:[...document.querySelectorAll('.interactive-html-canvas-frame iframe')].map(frame=>({src:frame.src,
      computed:bridge.teacherHtmlPlaybackUrl(window.clipFixture.api.getSceneElements().find(el=>el.customData?.materialKind==='interactive-html')?.id,frame.src)}))};
  }).catch(()=>null));
  if(browser)for(const [i,page] of browser.contexts()[0].pages().entries()){
    await page.screenshot({path:path.join(output,`failure-${i}.png`)}).catch(()=>{});
    console.log('Failure frames',i,JSON.stringify(await Promise.all(page.frames().map(async frame=>({url:frame.url(),layout:await frame.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight,scroll:[scrollX,scrollY],fullscreenTrace:window.__fullscreenTrace,
      next:document.getElementById('next')?.getBoundingClientRect().toJSON(),video:document.querySelector('video')?.getBoundingClientRect().toJSON(),trace:JSON.stringify(window.__localTrace),state:window.tafelraumLive?.getState(),media:document.querySelector('video')?{paused:document.querySelector('video').paused,time:document.querySelector('video').currentTime,error:document.querySelector('video').error?.message}:null})).catch(()=>null)})))));
  }
  throw error;
}finally{await browser?.close();await vite.close();}
