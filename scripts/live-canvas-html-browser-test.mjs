// Isolated end-to-end flow for D-124. Never opens the canonical archive.
// node scripts/live-canvas-html-browser-test.mjs <playwright module> [Chrome executable]
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
import {createLiveCanvasService} from '../services/live-canvas/server.ts';
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const {createServer}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const playwright=await import(process.argv[2]);
const browserType=process.argv[4]==='webkit'?playwright.webkit:playwright.chromium;
const archive=await mkdtemp(join(tmpdir(),'tafelraum-html-state-'));
const materialPath='faecher/test/reihen/test/stunden/synthetic-html/material';
await mkdir(join(archive,materialPath,'interaktiv'),{recursive:true});
await cp(new URL('../test-materials/live-canvas-html',import.meta.url),join(archive,materialPath,'interaktiv/live-canvas-html'),{recursive:true});
await writeFile(join(archive,'archive.json'),JSON.stringify({format:'tafelraum-unterrichtsarchiv',schemaVersion:1,catalog:{version:1,
 subjects:[],series:[],lessons:[{id:'synthetic-html',title:'HTML-Test',classId:'test',subjectId:'test',seriesId:'test',seed:{prompt:'',showTransportImage:false},metadata:{scheduledFor:null},materialBasis:{scope:'lesson',archivePath:materialPath,archiveSeriesId:'test'}}],
 hiddenLessonIds:[],trash:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}}));
const origin='http://127.0.0.1:5176';let baseUrl='';
const output=fileURLToPath(new URL('../output/live-canvas-html-state/',import.meta.url));await mkdir(output,{recursive:true});
let vite,service,browser;
try {
 service=await createLiveCanvasService({adminKey:'synthetic-html-state',allowedOrigins:[origin],distDir:fileURLToPath(new URL('../prototypes/surface-shell-a-b/dist-live',import.meta.url))});const servicePort=await service.listen(0);baseUrl=`http://127.0.0.1:${servicePort}`;
 vite=await createServer({configFile:false,cacheDir:join(archive,'vite-cache'),root:fileURLToPath(new URL('../prototypes/surface-shell-a-b/',import.meta.url)),server:{host:'127.0.0.1',port:5176,strictPort:true},plugins:[react(),{name:'html-state-fixture',configureServer(server){
  server.middlewares.use(createArchiveMiddleware(archive));
  server.middlewares.use('/api/live/rooms',(req,res)=>{if(req.method!=='POST'||req.headers['x-live-canvas']!=='create'){res.statusCode=403;res.end();return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...service.store.create(),baseUrl}));});
 }}]});await vite.listen();
 browser=await browserType.launch({headless:true,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
 const host=await browser.newPage({viewport:{width:1440,height:1000}}),viewer=await browser.newPage({viewport:{width:820,height:1180},hasTouch:true}),second=await browser.newPage({viewport:{width:820,height:1180},hasTouch:true});
 const errors=[];for(const page of [host,viewer,second]){page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>{if(!request.url().includes('/fonts/'))errors.push(`request: ${request.url()} ${request.failure()?.errorText}`)});page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/api/archive/lessons/synthetic-clips/board'))errors.push(`response: ${response.status()} ${response.url()}`)});}
 await host.goto(`${origin}/src/live/clip.browser.html`);await host.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture.api&&!window.clipFixture.api.getAppState().isLoading);
 await host.evaluate(()=>window.clipFixture.port.placeInteractiveHtml({id:'live-canvas-html',lessonId:'synthetic-html',title:'Gemeinsame Aufgabe',entry:'index.html',archiveMaterialPath:'interaktiv/live-canvas-html',defaultViewport:{width:600,height:448}}));
 const hostFrame=host.frameLocator('.interactive-html-canvas-frame iframe');await hostFrame.locator('#choose').waitFor();
 const initialHostCamera=await host.evaluate(()=>{const state=window.clipFixture.api.getAppState();return {scrollX:state.scrollX,scrollY:state.scrollY,zoom:{value:state.zoom.value}};});
 await hostFrame.locator('body').evaluate(body=>{const scroller=document.createElement('div');scroller.id='wheel-chain-test';scroller.style.cssText='position:fixed;inset:12px auto auto 12px;width:180px;height:110px;overflow:auto;z-index:99999;background:white';const content=document.createElement('div');content.style.height='440px';content.textContent='Scrolltest';scroller.append(content);body.append(scroller);});
 const scroller=hostFrame.locator('#wheel-chain-test');const scrollerBox=await scroller.boundingBox();assert.ok(scrollerBox);
 await host.mouse.move(scrollerBox.x+60,scrollerBox.y+55);await host.mouse.wheel(0,90);await host.waitForTimeout(100);
 assert.ok(await scroller.evaluate(element=>element.scrollTop)>0,'a scrollable HTML region keeps an unmodified wheel gesture');
 assert.deepEqual(await host.evaluate(()=>{const state=window.clipFixture.api.getAppState();return [state.scrollX,state.scrollY,state.zoom.value];}),[initialHostCamera.scrollX,initialHostCamera.scrollY,initialHostCamera.zoom.value],'internal HTML scrolling must not move the canvas');
 await scroller.evaluate(element=>{element.scrollTop=element.scrollHeight;});
 await host.mouse.wheel(0,90);await host.waitForFunction(before=>window.clipFixture.api.getAppState().scrollY!==before,initialHostCamera.scrollY);
 const chainedPan=await host.evaluate(()=>window.clipFixture.api.getAppState().scrollY);assert.notEqual(chainedPan,initialHostCamera.scrollY,'wheel at the HTML scroll boundary continues on the canvas');
 const zoomBefore=await host.evaluate(()=>window.clipFixture.api.getAppState().zoom.value);await host.keyboard.down('Control');await host.mouse.wheel(0,-90);await host.keyboard.up('Control');await host.waitForFunction(before=>window.clipFixture.api.getAppState().zoom.value!==before,zoomBefore);
 await host.evaluate(camera=>window.clipFixture.api.updateScene({appState:camera}),initialHostCamera);await scroller.evaluate(element=>element.remove());
 await host.evaluate(()=>window.clipFixture.host.create());await host.waitForFunction(()=>window.clipFixture.host.state.connected);const invite=await host.evaluate(()=>{const s=window.clipFixture.host.state.session;return `${s.baseUrl}/join/${s.inviteId}`});
 for(const [page,name] of [[viewer,'Mira'],[second,'Noah']]){await page.goto(invite);await page.getByLabel('Dein Name').fill(name);await page.getByRole('button',{name:'Beitreten',exact:true}).click();}
 await host.waitForFunction(()=>window.clipFixture.host.state.participants.filter(participant=>participant.connected).length===2);
 await host.evaluate(()=>window.clipFixture.host.start());
 await host.waitForFunction(()=>window.clipFixture.host.state.publicationReady);
 await viewer.locator('.live-interactive-material.is-locked iframe').waitFor();await second.locator('.live-interactive-material.is-locked iframe').waitFor();
 await viewer.frameLocator('.live-interactive-material iframe').locator('#choose').waitFor();
 assert.equal(await viewer.getByRole('group',{name:'HTML-Inhaltszoom',exact:true}).count(),0,'HTML has no external content-zoom controls');
 const logicalWidthBefore=await viewer.frameLocator('.live-interactive-material iframe').locator('html').evaluate(element=>element.clientWidth);
 const outerWidthBefore=await viewer.locator('.live-interactive-material').evaluate(element=>element.getBoundingClientRect().width);
 const hostCamera=await host.evaluate(()=>{const state=window.clipFixture.api.getAppState();const camera={scrollX:state.scrollX,scrollY:state.scrollY,zoom:{value:state.zoom.value}};window.clipFixture.api.updateScene({appState:{...camera,zoom:{value:camera.zoom.value/2}}});return camera;});
 await host.evaluate(()=>window.clipFixture.host.recallAll());
 await viewer.waitForFunction(width=>document.querySelector('.live-interactive-material').getBoundingClientRect().width<width*.75,outerWidthBefore);
 const logicalWidthAfter=await viewer.frameLocator('.live-interactive-material iframe').locator('html').evaluate(element=>element.clientWidth);
 const outerWidthAfter=await viewer.locator('.live-interactive-material').evaluate(element=>element.getBoundingClientRect().width);
 assert.equal(logicalWidthBefore,600,'HTML starts at its logical material width');assert.equal(logicalWidthAfter,600,'canvas zoom must not reflow HTML');assert.ok(outerWidthAfter<outerWidthBefore,'canvas zoom still scales the material frame');
 assert.equal(await viewer.getByText('Nur ansehen',{exact:true}).count(),1);
 await viewer.waitForTimeout(250);
 await viewer.screenshot({path:join(output,'viewer-locked.png')});
 await host.evaluate(()=>{const material=window.clipFixture.api.getSceneElements().find(element=>element.customData?.materialKind==='interactive-html');window.clipFixture.host.showClip({id:'tight-html-clip',x:material.x,y:material.y,width:material.width,height:material.height});});
 await viewer.locator('.live-view-canvas.is-clip.is-ready').waitFor();
 assert.equal(await viewer.getByRole('group',{name:'HTML-Inhaltszoom',exact:true}).count(),0,'tight clips need no extra content-zoom toolbar');
 await viewer.waitForTimeout(500);
 await viewer.screenshot({path:join(output,'viewer-tight-clip.png')});
 await host.evaluate(camera=>window.clipFixture.api.updateScene({appState:camera}),hostCamera);
 await hostFrame.locator('#choose').click();
 await viewer.frameLocator('.live-interactive-material iframe').locator('#answer').getByText('Gemeinsam gelöst',{exact:true}).waitFor();
 await second.frameLocator('.live-interactive-material iframe').locator('#answer').getByText('Gemeinsam gelöst',{exact:true}).waitFor();
 const materialId=await host.evaluate(()=>window.clipFixture.api.getSceneElements().find(element=>element.customData?.materialKind==='interactive-html').id);
 await host.evaluate(id=>window.clipFixture.api.updateScene({appState:{selectedElementIds:{[id]:true}}}),materialId);
 const unlock=host.getByRole('button',{name:'Für Schüler freigeben'});await unlock.waitFor();await unlock.click();
 await viewer.locator('.live-interactive-material.is-unlocked').waitFor();assert.equal(await viewer.getByText('Nur ansehen',{exact:true}).count(),0);
 assert.equal(await viewer.frameLocator('.live-interactive-material iframe').locator('html').evaluate(element=>element.clientWidth),600,'unlocking keeps the logical HTML viewport');
 await viewer.screenshot({path:join(output,'viewer-html-default.png')});
 await viewer.frameLocator('.live-interactive-material iframe').locator('#choose').tap();
 await hostFrame.locator('#answer').getByText('Noch offen',{exact:true}).waitFor();
 await second.frameLocator('.live-interactive-material iframe').locator('#answer').getByText('Noch offen',{exact:true}).waitFor();
 await viewer.frameLocator('.live-interactive-material iframe').locator('input').fill('Vom iPad');
 await hostFrame.locator('input').waitFor({state:'visible'});
 await host.waitForTimeout(250);assert.equal(await hostFrame.locator('input').inputValue(),'Vom iPad');
 await viewer.reload();await viewer.locator('.live-interactive-material.is-unlocked iframe').waitFor();assert.equal(await viewer.frameLocator('.live-interactive-material iframe').locator('input').inputValue(),'Vom iPad');
 await host.screenshot({path:join(output,'host-lock-control.png')});await viewer.screenshot({path:join(output,'viewer-unlocked.png')});
 const room=[...service.store.rooms.values()][0];assert.equal(room.scene?.materials?.length,1);assert.equal(room.scene?.assetIds.length,0,'HTML state does not use PNG assets');
 assert.deepEqual(errors,[]);const result={ok:true,checks:['scrollable host HTML keeps wheel input and chains it to canvas pan at its boundary','Ctrl+wheel over host HTML reaches canvas zoom','teacher state reaches both viewers','canvas zoom scales HTML without responsive reflow','no external content-zoom controls, including in a tight clip','locked viewer has a visible input shield','unlock permits direct touch interaction without changing the logical HTML viewport','viewer state returns through host to peers','reload restores authoritative state','HTML uses no PNG assets']};
 await writeFile(join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser?.close();await vite?.close();await service?.close();await rm(archive,{recursive:true,force:true});}
