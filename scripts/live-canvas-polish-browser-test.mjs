import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]);
const browser=await chromium.launch({headless:true});
const hostOrigin=`http://127.0.0.1:${Number(process.env.LIVE_CANVAS_HOST_PORT??5174)}`;
const host=await browser.newPage({viewport:{width:1440,height:1000}}), tablet=await browser.newPage({viewport:{width:820,height:1180},deviceScaleFactor:2});
const out='output/live-canvas-polish';await mkdir(out,{recursive:true});
const errors=[];for(const p of [host,tablet]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));}
await host.addInitScript(()=>{window.laserFrames=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.classList.contains('live-laser-overlay'))window.laserFrames++;return clear.apply(this,args);};});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await host.goto(`${hostOrigin}/src/live/clip.browser.html`);await host.waitForFunction(()=>window.clipFixture?.api&&!window.clipFixture.api.getAppState().isLoading);
 await host.evaluate(async()=>{const r=await fetch('/api/archive/lessons/synthetic-clips/board');if(r.ok){const d=await r.json();await fetch('/api/archive/lessons/synthetic-clips/board',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':r.headers.get('ETag')},body:JSON.stringify({...d,clips:[]})});}});
 await host.reload();await host.waitForFunction(()=>window.clipFixture?.api&&!window.clipFixture.api.getAppState().isLoading);
 await host.getByRole('button',{name:'Testinhalt',exact:true}).click();
 for(const [x1,x2] of [[92,440],[512,860]]){await host.getByRole('button',{name:'Clip erstellen',exact:true}).click();await host.mouse.move(x1,162);await host.mouse.down();await host.mouse.move(x2,650,{steps:10});await host.mouse.up();}
 await host.getByRole('button',{name:'Clip 1 zeigen',exact:true}).click();
 await host.getByRole('button',{name:'Live Canvas',exact:true}).click();
 const invite=await host.getByRole('link',{name:'Teilnehmer öffnen'}).getAttribute('href');
 const payloads=[];tablet.on('websocket',ws=>ws.on('framereceived',e=>{try{payloads.push(JSON.parse(e.payload.toString()));}catch{}}));
 await tablet.goto(invite);await tablet.getByLabel('Dein Name').fill('Tablet Motion');await tablet.getByRole('button',{name:'Beitreten',exact:true}).click();
 await host.getByRole('button',{name:'Starten',exact:true}).click();await tablet.locator('.live-view-canvas.is-ready').waitFor();await sleep(500);
 assert.equal(await tablet.getByRole('button',{name:'Ganzer Clip',exact:true}).count(),0);
 await host.getByRole('button',{name:'Schülervorschau',exact:true}).click();
 await host.locator('.student-preview .live-view-canvas.is-ready').waitFor();await sleep(450);
 assert.equal(await host.locator('.student-preview-header > svg').count(),0,'draggable header needs no visible grip');
 const previewFrame=await host.evaluate(()=>{const windowStyle=getComputedStyle(document.querySelector('.student-preview')),screenStyle=getComputedStyle(document.querySelector('.student-preview-screen')),viewerStyle=getComputedStyle(document.querySelector('.student-preview-screen .live-view'));return {padding:windowStyle.padding,borderWidth:windowStyle.borderWidth,screenRadius:screenStyle.borderRadius,windowBackground:windowStyle.backgroundColor,screenBackground:screenStyle.backgroundColor,viewerBackground:viewerStyle.backgroundColor};});
 assert.equal(previewFrame.padding,'0px');assert.equal(previewFrame.borderWidth,'0px');assert.equal(previewFrame.screenRadius,'0px');
 assert.equal(previewFrame.screenBackground,previewFrame.windowBackground);assert.equal(previewFrame.viewerBackground,previewFrame.windowBackground,'preview is one continuous frameless surface');
 await host.screenshot({path:`${out}/preview-portrait.png`});
 const preview=await host.evaluate(()=>window.clipFixture.host.state.preview);
 assert.ok(preview.scene.elements.every(e=>e.type==='image'));assert.doesNotMatch(JSON.stringify(preview.scene.elements),/PRIVATE|LÖSUNG/);
 const originalHostCamera=await host.evaluate(()=>{const state=window.clipFixture.api.getAppState();return {scrollX:state.scrollX,scrollY:state.scrollY,zoom:state.zoom};});
 await host.evaluate(()=>window.clipFixture.api.updateScene({appState:{scrollX:-1400,scrollY:-900,zoom:{value:.4}}}));
 await host.getByRole('button',{name:'Auf Lehrerfläche zentrieren',exact:true}).click();
 const focused=await host.evaluate(()=>{const state=window.clipFixture.api.getAppState(),clip=window.clipFixture.host.state.preview.scene.presentation.clip;return {zoom:state.zoom.value,centerX:state.width/(2*state.zoom.value)-state.scrollX,centerY:state.height/(2*state.zoom.value)-state.scrollY,targetX:clip.x+clip.width/2,targetY:clip.y+clip.height/2};});
 assert.ok(focused.zoom<=3);assert.ok(Math.abs(focused.centerX-focused.targetX)<.01&&Math.abs(focused.centerY-focused.targetY)<.01,'preview focuses the local teacher camera on its published clip');
 await host.evaluate(camera=>window.clipFixture.api.updateScene({appState:camera}),originalHostCamera);
 await host.getByRole('button',{name:'Querformat',exact:true}).click();await sleep(350);await host.screenshot({path:`${out}/preview-landscape.png`});
 const grip=await host.locator('.student-preview-header').boundingBox();await host.mouse.move(grip.x+40,grip.y+20);await host.mouse.down();await host.mouse.move(1010,450,{steps:10});await host.mouse.up();
 await host.getByRole('button',{name:'Schülervorschau schließen',exact:true}).click();
 const geometry=await host.evaluate(()=>JSON.stringify(window.clipFixture.api.getSceneElements()));
 const pointerCount=()=>payloads.filter(m=>m.type==='pointer'&&m.pointer).length;
 const beforePointer=pointerCount();await host.mouse.move(220,300);await host.mouse.move(330,420,{steps:8});await sleep(80);assert.equal(pointerCount(),beforePointer,'normal mouse stays private');
 await host.keyboard.down('y');await host.getByRole('button',{name:'Zeiger',exact:true}).waitFor();assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'true');
 await host.mouse.move(160,370);await host.mouse.down();for(let i=0;i<30;i++){await host.mouse.move(160+i*7,370+Math.sin(i/5)*25);await sleep(12);}
 await tablet.screenshot({path:`${out}/laser-comet.png`});await host.screenshot({path:`${out}/laser-local.png`});
 await host.mouse.up();await host.keyboard.up('y');assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'false');
 assert.ok(pointerCount()>beforePointer);assert.ok(payloads.filter(m=>m.type==='pointer'&&m.pointer).every(m=>m.pointer.tool==='laser'));
 await sleep(1500);assert.equal(await tablet.locator('.live-laser-overlay').isHidden(),true,'trails clear after release');
 await host.getByRole('button',{name:'Zeiger',exact:true}).click();await host.getByRole('button',{name:'Zeiger',exact:true}).click();
 for(const [label,id] of [['Band','ribbon'],['Funken','spark']]){
  await host.getByRole('button',{name:label,exact:true}).click();await host.mouse.move(140,370);await host.mouse.down();for(let i=0;i<32;i++){await host.mouse.move(140+i*8,370+Math.sin(i/5)*30);await sleep(12);}await tablet.screenshot({path:`${out}/laser-${id}.png`});await host.mouse.up();
  if(id==='ribbon')await host.getByRole('button',{name:'Zeiger',exact:true}).click();
 }
 await sleep(1500);const restingFrames=await host.evaluate(()=>window.laserFrames);await sleep(650);assert.ok((await host.evaluate(()=>window.laserFrames))-restingFrames<6,'resting laser stops the continuous animation loop');
 await host.mouse.move(1000,350);await sleep(100);assert.equal(payloads.filter(m=>m.type==='pointer').at(-1).pointer,null,'private solution has no pointer');
 assert.equal(await host.evaluate(()=>JSON.stringify(window.clipFixture.api.getSceneElements())),geometry,'laser must not mutate canvas');
 await host.keyboard.down('y');await host.evaluate(()=>window.dispatchEvent(new Event('blur')));await host.keyboard.up('y');
 // Zoom, then observe actual recall frames rather than merely waiting for the destination.
 await tablet.mouse.move(410,500);await tablet.keyboard.down('Control');await tablet.mouse.wheel(0,-350);await tablet.keyboard.up('Control');await sleep(120);
 const crop={x:100,y:200,width:500,height:500};const zoomed=await tablet.screenshot({clip:crop});
 await host.keyboard.press('1');await sleep(80);const during=await tablet.screenshot({clip:crop});await sleep(350);const fitted=await tablet.screenshot({clip:crop});
 assert.ok(!zoomed.equals(during)&&!during.equals(fitted),'recall has intermediate camera frames');
 await tablet.evaluate(()=>{window.clipMotionFrames=[];const started=performance.now();const tick=()=>{const node=document.querySelector('.live-view-canvas');if(node){const s=getComputedStyle(node);window.clipMotionFrames.push({opacity:Number(s.opacity),filter:s.filter,transform:s.transform});}if(performance.now()-started<1800)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 await host.keyboard.press('2');await sleep(35);await host.keyboard.press('1');await sleep(35);await host.keyboard.press('2');
 await host.waitForFunction(()=>window.clipFixture.host.state.presentation.clip?.x>400&&window.clipFixture.host.state.publicationReady);await sleep(550);
 await tablet.screenshot({path:`${out}/clip-switch.png`});
 const motionFrames=await tablet.evaluate(()=>window.clipMotionFrames);
 assert.ok(motionFrames.some(f=>f.opacity>0&&f.opacity<1&&f.filter!=='none'&&f.filter!=='blur(0px)'),'new clip resolves through focus and fade');
 assert.equal(await tablet.locator('.live-entry, .live-stage-placeholder').count(),0,'normal clip switch never shows an entry/loading page');
 await writeFile(`${out}/clip-motion-frames.json`,JSON.stringify(motionFrames,null,2));
 await tablet.locator('.live-view-canvas').evaluate(el=>{const animation=el.getAnimations()[0];if(animation){animation.pause();animation.currentTime=90;}});
 await tablet.screenshot({path:`${out}/clip-focus-transition.png`});
 await tablet.locator('.live-view-canvas').evaluate(el=>el.getAnimations().forEach(a=>a.finish()));
 await tablet.emulateMedia({reducedMotion:'reduce'});await host.keyboard.press('1');await sleep(550);
 assert.equal(await tablet.locator('.live-view-canvas').evaluate(el=>getComputedStyle(el).animationName),'none');
 // The deliberate pointer remains independent from the free participant camera.
 await host.evaluate(()=>window.clipFixture.host.setFree());
 await host.waitForFunction(()=>window.clipFixture.host.state.publicationReady);
 await sleep(350);const count=pointerCount();await host.mouse.move(220,360);await host.mouse.move(320,390,{steps:8});await sleep(120);
 assert.ok(pointerCount()>count,'laser works in free mode');
 await host.getByRole('button',{name:'Live Canvas, Frei, 1 Teilnehmer',exact:true}).click();await host.getByRole('button',{name:'Beenden',exact:true}).click();
 await tablet.getByRole('heading',{name:'Live Canvas wurde beendet.'}).waitFor();
 // Real shell owns key routing and toolbar state. Keep its archive synthetic too.
 await host.goto(`${hostOrigin}/?theme=dark`);await host.getByRole('button',{name:'Zeiger',exact:true}).waitFor();await sleep(800);
 await host.getByRole('button',{name:'Stift',exact:true}).click();await host.keyboard.down('y');await sleep(40);
 assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await host.getByRole('button',{name:'Stift',exact:true}).getAttribute('aria-pressed'),'false');
 await host.keyboard.up('y');assert.equal(await host.getByRole('button',{name:'Stift',exact:true}).getAttribute('aria-pressed'),'true');
 await host.evaluate(()=>{const input=document.createElement('input');input.id='synthetic-text-guard';document.body.append(input);input.focus();});
 await host.keyboard.type('y');assert.equal(await host.locator('#synthetic-text-guard').inputValue(),'y');assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'false');await host.locator('#synthetic-text-guard').evaluate(el=>el.remove());
 await host.keyboard.press('Control+y');assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'false');
 await host.getByRole('button',{name:'Zeiger',exact:true}).click();
 await host.keyboard.down('Space');await sleep(30);assert.equal(await host.getByRole('button',{name:'Hand',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'false');
 await host.keyboard.up('Space');await sleep(30);assert.equal(await host.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed'),'true');
 await host.getByRole('button',{name:'Zeiger',exact:true}).click();
 const palette=host.getByRole('group',{name:'Zeigerstil'});await palette.waitFor();const paletteBounds=await palette.boundingBox();assert.ok(paletteBounds.x>=0&&paletteBounds.y>=0&&paletteBounds.y+paletteBounds.height<=1000,'style palette is inside viewport');
 await host.screenshot({path:`${out}/toolbar-dark.png`});
 await host.keyboard.press('Escape');assert.equal(await palette.count(),0);await host.keyboard.press('Escape');assert.equal(await host.getByRole('button',{name:'Stift',exact:true}).getAttribute('aria-pressed'),'true');
 assert.deepEqual(errors,[]);await writeFile(`${out}/checks.json`,JSON.stringify({ok:true,laserMessages:pointerCount(),errors},null,2));console.log('PASS preview, orientation/drag, intentional laser/styles/privacy, nonmutation, Y release/focus/redo, recall motion, fast switching, reduced motion');
}catch(error){await host.screenshot({path:`${out}/failure-host.png`}).catch(()=>{});await tablet.screenshot({path:`${out}/failure-tablet.png`}).catch(()=>{});console.error(errors);throw error;}finally{await browser.close();}
