// Historical D-278/D-281 controller-UI assertions; superseded by D-295.
// Current Room regression: generic-html-shared-browser-test, language-bites-shared-browser-test, room-video-controller-browser-test.
// Development fixture + real archive/Canvas ports. Only the marked test lesson.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
import {projectedFrameClick as click,projectedFramePoint} from './glt-playback-controller/browser-pointer.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'output/glt-html-integration');
const plan=JSON.parse(await readFile(path.join(output,'complete-unit.json'),'utf8'));
assert.equal(plan.archiveRoot,path.join(output,'test-archive'));
assert.equal(plan.lessonId,'test-glt-einheit-1-komplett');
const archive=JSON.parse(await readFile(path.join(plan.archiveRoot,'archive.json'),'utf8'));
assert.equal(archive.testPurpose,'glt-html-integration');
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const {createServer}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium}=await import(process.argv[2]);
const server=await createServer({configFile:false,cacheDir:path.join(output,'unit-vite-cache'),root:path.join(root,'prototypes/surface-shell-a-b'),
  server:{host:'127.0.0.1',port:5198,strictPort:true,watch:{ignored:['**/src-tauri/target/**']}},
  plugins:[react(),{name:'isolated-unit-archive',configureServer(server){server.middlewares.use(createArchiveMiddleware(plan.archiveRoot));}}]});
let browser,page;const errors=[],checks=[];let room;
try{
  await server.listen();const origin='http://127.0.0.1:5198';
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  context.setDefaultTimeout(20000);
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const materials=(await (await context.request.get(`${origin}/api/archive/lessons/${plan.lessonId}/materials`)).json()).materials;
  assert.equal(materials.filter(material=>material.kind==='interactive').length,15);
  // Use the same compare-before-write order API as the material drawer.
  const first=plan.primary.map(item=>`interaktiv/${item.id}`),previousPaths=materials.map(item=>item.path);
  const order=await context.request.put(`${origin}/api/archive/lessons/${plan.lessonId}/materials/order`,{data:{previousPaths,paths:[...first,...previousPaths.filter(value=>!first.includes(value))]}});
  assert.equal(order.status(),200);
  const boardBefore=await context.request.get(`${origin}/api/archive/lessons/${plan.lessonId}/board`);
  await page.goto(`${origin}/src/live/clip.browser.html?lesson=${plan.lessonId}`);
  await page.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture?.clipControls?.addSelected.current&&!window.clipFixture.api.getAppState().isLoading);
  if(boardBefore.status()===404){
    for(const item of plan.primary){
      const descriptor=await (await context.request.get(`${origin}/api/archive/lessons/${plan.lessonId}/materials/interactive/${item.id}`)).json();
      await page.evaluate(({item,descriptor,lessonId,materialPath})=>{
        window.clipFixture.port.placeInteractiveHtml({id:item.id,title:descriptor.title,entry:descriptor.entry,lessonId,print:descriptor.print,
          archiveMaterialPath:`${materialPath}/interaktiv/${item.id}`,defaultViewport:item.viewport});
      },{item,descriptor,lessonId:plan.lessonId,materialPath:archive.catalog.lessons.find(lesson=>lesson.id===plan.lessonId).materialBasis.archivePath});
      await page.waitForFunction(id=>window.clipFixture.api.getSceneElements().some(el=>el.customData?.interactiveHtmlId===id||el.customData?.sourceMaterialPath===`interaktiv/${id}`),item.id);
      const elementId=await page.evaluate(({item,index})=>{
        const {api}=window.clipFixture;
        const el=api.getSceneElements().find(el=>el.customData?.interactiveHtmlId===item.id||el.customData?.sourceMaterialPath===`interaktiv/${item.id}`);
        const width=item.viewport.width===794?620:1000,height=width*item.viewport.height/item.viewport.width;
        api.updateScene({elements:api.getSceneElements().map(value=>value.id===el.id?{...value,x:80+(index%3)*1300,y:100+Math.floor(index/3)*1350,width,height}:value),
          appState:{selectedElementIds:{[el.id]:true}}});return el.id;
      },{item,index:plan.primary.indexOf(item)});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(number=>window.clipFixture.clipControls.addSelected.current(number),item.number),true);
      item.elementId=elementId;console.log('Placed',item.number,item.id);
    }
  }else{
    assert.equal(boardBefore.status(),200);
    for(const item of plan.primary)item.elementId=await page.evaluate(id=>window.clipFixture.api.getSceneElements().find(el=>el.customData?.interactiveHtmlId===id||el.customData?.sourceMaterialPath===`interaktiv/${id}`)?.id,item.id);
  }
  assert.ok(plan.primary.every(item=>item.elementId));
  const frame=async id=>{
    const locator=page.locator(`.interactive-html-canvas-frame iframe[src*="/${id}/"]`);await locator.waitFor({state:'attached'});
    const frame=await (await locator.elementHandle()).contentFrame();assert.ok(frame);return frame;
  };
  const focus=async id=>{
    await page.evaluate(({id,materialPath})=>window.clipFixture.port.focusArchiveMaterial(`${materialPath}/interaktiv/${id}`),
      {id,materialPath:archive.catalog.lessons.find(lesson=>lesson.id===plan.lessonId).materialBasis.archivePath});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    // Material focus intentionally selects its object; switch to content interaction.
    await page.getByRole('button',{name:'Hand',exact:true}).click();
    await page.evaluate(()=>new Promise(resolve=>{
      let last='',stable=0;const tick=()=>{const s=window.clipFixture.api.getAppState(),value=JSON.stringify([s.scrollX,s.scrollY,s.zoom.value]);
        stable=value===last?stable+1:0;last=value;if(stable>=8)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);
    }));
  };
  for(const item of plan.primary){await (await frame(item.id)).locator('body').waitFor();}
  // Selection mode moves materials; Hand mode deliberately interacts with HTML.
  await page.getByRole('button',{name:'Hand',exact:true}).click();
  checks.push('All 13 current presentation materials loaded; no solution on the Canvas');
  assert.equal(await page.locator('iframe[src*="glt-filmvergleich-musterloesung"]').count(),0);
  await focus('glt-hattie-mittag');let teacher=await frame('glt-hattie-mittag');
  await teacher.waitForFunction(()=>Boolean(window.tafelraumPlayback));
  const beforePlay=await teacher.locator('video').evaluate(video=>video.currentTime);
  await teacher.locator('video').focus();await teacher.locator('video').press('Space');
  await teacher.waitForFunction(time=>document.querySelector('video').currentTime>time+.4&&!document.querySelector('video').paused,beforePlay);
  const localTime=await teacher.locator('video').evaluate(video=>video.currentTime);
  checks.push('Mittag uses the original native player locally without Room');
  const popup=context.waitForEvent('page');await page.evaluate(()=>window.clipFixture.room.start());room=await popup;
  room.on('pageerror',error=>errors.push(error.message));await room.setViewportSize({width:1280,height:800});
  await page.waitForFunction(()=>window.clipFixture.room.state.ready);
  const show=async id=>{
    const item=plan.primary.find(value=>value.id===id);assert.ok(item);
    await focus(id);
    await page.evaluate(item=>window.clipFixture.room.showMaterial(item.elementId,item.title,`unit-${item.number}`,item.number),item);
    const locator=room.locator(`.live-interactive-material iframe[src*="/${id}/"]`);await locator.waitFor();
    const front=await (await locator.elementHandle()).contentFrame();assert.ok(front);await front.locator('body').waitFor();return front;
  };
  let front=await show('glt-hattie-mittag');teacher=await frame('glt-hattie-mittag');
  await teacher.waitForFunction(()=>Boolean(window.tafelraumPlaybackController?.getStatus()));
  assert.equal(await teacher.locator('video,audio,canvas').count(),0);
  await front.waitForFunction(t=>document.querySelector('video').paused&&Math.abs(window.tafelraumLive.getState().position-t)<.1,localTime);
  const videoHandle=await front.locator('video').elementHandle();
  await click(teacher,page,teacher.getByRole('button',{name:'Abspielen',exact:true}));
  await front.waitForFunction(t=>document.querySelector('video').currentTime>t+.4&&!document.querySelector('video').paused,localTime);
  await page.screenshot({path:path.join(output,'mittag-teacher.png')});await room.screenshot({path:path.join(output,'mittag-room.png')});
  await click(teacher,page,teacher.getByRole('button',{name:'Video im Room als Vollbild',exact:true}));
  await teacher.waitForFunction(()=>document.getElementById('fullscreen').getAttribute('aria-pressed')==='true'||document.getElementById('connection').textContent.includes('Vollbild wurde blockiert'));
  if(await front.evaluate(()=>Boolean(document.fullscreenElement))){
    assert.ok(await videoHandle.evaluate(video=>document.fullscreenElement===video));
    await room.keyboard.press('Escape');await front.waitForFunction(()=>!document.fullscreenElement);
    assert.ok(await videoHandle.evaluate(video=>!video.paused&&video.currentTime>0));
  }
  await teacher.waitForFunction(()=>window.tafelraumPlaybackController.getStatus()?.playing);
  const runningSeek=teacher.locator('#seek');
  const runningStart=await projectedFramePoint(teacher,runningSeek,.2),runningEnd=await projectedFramePoint(teacher,runningSeek,.35);
  await page.mouse.move(runningStart.x,runningStart.y);await page.mouse.down();await page.mouse.move(runningEnd.x,runningEnd.y,{steps:12});
  const runningTarget=Number(await runningSeek.inputValue());await page.mouse.up();
  await front.waitForFunction(target=>!document.querySelector('video').paused&&document.querySelector('video').currentTime>target+.4&&document.querySelector('video').currentTime<target+3,runningTarget);
  assert.ok(await videoHandle.evaluate(video=>video===document.querySelector('video')));
  await teacher.waitForFunction(target=>Number(document.getElementById('seek').value)>target+.1,runningTarget);
  checks.push('Mittag running seek resumes automatically at the confirmed target; same video, timeline follows again');
  await click(teacher,page,teacher.getByRole('button',{name:'Pause',exact:true}));await front.waitForFunction(()=>document.querySelector('video').paused);
  await teacher.locator('#seek').focus();await teacher.locator('#seek').press('Home');
  for(let index=0;index<20;index++)await teacher.locator('#seek').press('ArrowRight');
  await teacher.locator('#seek').press('Tab');
  await front.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-2)<.15);
  await front.evaluate(()=>{window.__seekCommands=[];window.addEventListener('message',event=>{
    if(event.data?.type==='tafelraum:playback-host'&&event.data.action==='command'&&event.data.command.type==='seek')window.__seekCommands.push(event.data.command);
  });});
  const slider=teacher.locator('#seek'),start=await projectedFramePoint(teacher,slider,.2),end=await projectedFramePoint(teacher,slider,.65);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:16});
  const draft=Number(await slider.inputValue());assert.ok(draft>100);
  await teacher.evaluate(()=>{window.__statusChanges=0;window.addEventListener('tafelraum:controller-change',()=>window.__statusChanges++);});
  await teacher.waitForFunction(()=>window.__statusChanges>=2);
  assert.equal(Number(await slider.inputValue()),draft);assert.equal(await front.evaluate(()=>window.__seekCommands.length),0);
  assert.ok(await front.locator('video').evaluate(video=>video.paused&&Math.abs(video.currentTime-2)<.15));
  await page.mouse.up();await front.waitForFunction(target=>Math.abs(document.querySelector('video').currentTime-target)<.15,draft);
  assert.equal(await front.evaluate(()=>window.__seekCommands.length),1);
  await front.evaluate(()=>{window.__volumeCommands=[];window.addEventListener('message',event=>{
    if(event.data?.type==='tafelraum:playback-host'&&event.data.action==='command'&&event.data.command.type==='volume')window.__volumeCommands.push(event.data.command);
  });});
  const loudness=teacher.locator('#volume');
  for(const fraction of [.3,.7]){
    const current=Number(await loudness.inputValue());
    const thumbFraction=await loudness.evaluate((input,current)=>{const width=input.getBoundingClientRect().width;return (8+current*(width-16))/width;},current);
    const grab=await projectedFramePoint(teacher,loudness,thumbFraction),target=await projectedFramePoint(teacher,loudness,fraction);
    const before=await front.evaluate(()=>window.__volumeCommands.length);
    await page.mouse.move(grab.x,grab.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:14});
    const draft=Number(await loudness.inputValue());
    await teacher.evaluate(()=>{window.__volumeTicks=0;window.addEventListener('tafelraum:controller-change',()=>window.__volumeTicks++);});
    await teacher.waitForFunction(()=>window.__volumeTicks>=2);
    assert.equal(Number(await loudness.inputValue()),draft);assert.equal(await front.evaluate(()=>window.__volumeCommands.length),before);
    await page.mouse.up();await front.waitForFunction(v=>Math.abs(document.querySelector('video').volume-v)<.001,draft);
    assert.equal(await front.evaluate(()=>window.__volumeCommands.length),before+1);
    await page.mouse.move(grab.x,grab.y,{steps:8});assert.equal(Number(await loudness.inputValue()),draft);
  }
  // Restore test volume through the same release gesture.
  // Keep the hit point inside the element, not exactly on its excluded right edge.
  const volumeEnd=await projectedFramePoint(teacher,loudness,.99);
  await page.mouse.click(volumeEnd.x,volumeEnd.y);await front.waitForFunction(()=>document.querySelector('video').volume===1);
  await click(teacher,page,teacher.getByRole('button',{name:'Stoppen und zum Anfang',exact:true}));
  await front.waitForFunction(()=>document.querySelector('video').paused&&document.querySelector('video').currentTime<.15);
  checks.push('Real Room scrubbing: immediate local draft survives heartbeats, no seeks while dragging, exactly one on release; Stop returns to 0 paused');
  checks.push('Real Room volume: two thumb drags survive heartbeats, one command on release, idle hover never changes volume');
  checks.push('Mittag handoff preserves position, only Room plays, teacher Play/Pause/Seek/fullscreen controls the same video');
  // Walk every material using the same Room material path as the stored clips.
  for(const item of plan.primary){front=await show(item.id);assert.ok((await front.locator('body').innerText()).trim().length>0);}
  assert.equal(await room.locator('video').count(),0,'no orphan native video outside output frames');
  front=await show('glt-hattie-aufloesung');teacher=await frame('glt-hattie-aufloesung');
  const oldReveal=await teacher.evaluate(()=>window.tafelraumLive.getState());
  await click(teacher,page,teacher.locator('#keySection'));
  const revealed=await teacher.evaluate(()=>window.tafelraumLive.getState());
  await front.waitForFunction(value=>JSON.stringify(window.tafelraumLive.getState())===value,JSON.stringify(revealed));
  await teacher.evaluate(value=>{window.tafelraumLive.applyState(value);window.dispatchEvent(new CustomEvent('tafelraum:statechange'));},oldReveal);
  front=await show('glt-hattie-teamreflexion');teacher=await frame('glt-hattie-teamreflexion');
  const field=teacher.locator('textarea').first();
  const previousForm=await field.inputValue();
  const originalForm=/^Test: (Klarheit|gegenseitig)$/.test(previousForm)?'':previousForm;
  await field.fill('Test: Klarheit');
  await front.waitForFunction(()=>document.querySelector('textarea').value==='Test: Klarheit');
  // A focused teacher field intentionally protects an unfinished local edit.
  await field.press('Tab');
  await front.locator('textarea').first().fill('Test: gegenseitig');
  await teacher.waitForFunction(()=>document.querySelector('textarea').value==='Test: gegenseitig');
  await front.locator('textarea').first().press('Tab');
  await field.fill(originalForm);await front.waitForFunction(value=>document.querySelector('textarea').value===value,originalForm);
  checks.push('Full material sequence works; research reveal and reflection fields synchronize, including Room → teacher');
  await show('glt-hattie-mittag');teacher=await frame('glt-hattie-mittag');
  await teacher.evaluate(()=>window.tafelraumPlaybackController.command({type:'seek',value:0}));
  await page.evaluate(()=>window.clipFixture.room.stop());await page.waitForFunction(()=>!window.clipFixture.room.state.active);
  teacher=await frame('glt-hattie-mittag');await teacher.waitForFunction(()=>Boolean(window.tafelraumPlayback));
  assert.equal(await teacher.locator('video').evaluate(video=>video.paused),true);
  await focus('glt-lernszenen-player');
  await page.evaluate(()=>window.clipFixture.api.updateScene({appState:{selectedElementIds:{},scrollX:0,scrollY:0,zoom:{value:1}}}));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>window.clipFixture.port.flushPersistence());
  const stored=await (await context.request.get(`${origin}/api/archive/lessons/${plan.lessonId}/board`)).json();
  assert.equal(stored.clips.length,13);assert.equal(stored.elements.filter(el=>!el.isDeleted&&el.customData?.materialKind==='interactive-html').length,13);
  await page.reload();await page.waitForFunction(()=>window.clipFixture?.port&&!window.clipFixture.api.getAppState().isLoading);
  assert.equal(await page.evaluate(()=>window.clipFixture.api.getSceneElements().filter(el=>el.customData?.materialKind==='interactive-html').length),13);
  checks.push('13 material clips and all Canvas objects persist; Room stop returns to a paused local player');
  await page.screenshot({path:path.join(output,'complete-unit-start.png')});
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'complete-unit-results.json'),JSON.stringify({ok:true,lessonId:plan.lessonId,checks,errors,note:'Only test archive; native/beamer/audio/print/QR acceptance separate.'},null,2)+'\n');
  console.log(JSON.stringify({ok:true,checks},null,2));
}catch(error){
  if(page){await page.screenshot({path:path.join(output,'complete-unit-failure.png')}).catch(()=>{});
    if(room)for(const frame of room.frames().filter(frame=>frame.url().includes('glt-hattie-mittag')))console.error('Room diagnostic',await frame.evaluate(()=>({state:window.tafelraumLive?.getState(),status:window.tafelraumPlayback?.getStatus(),visibility:document.visibilityState})).catch(()=>null));
    for(const frame of page.frames().filter(frame=>frame.url().includes('glt-hattie-mittag')))console.error('Mittag diagnostic',await frame.evaluate(()=>({url:location.href,focused:document.activeElement?.tagName,
      video:[...document.querySelectorAll('video')].map(v=>({paused:v.paused,ready:v.readyState,time:v.currentTime,error:v.error?.message})),status:window.tafelraumPlayback?.getStatus(),controller:window.tafelraumPlaybackController?.getStatus()})).catch(()=>null));}
  console.error(error);throw error;
}
finally{await browser?.close();await server.close();}
