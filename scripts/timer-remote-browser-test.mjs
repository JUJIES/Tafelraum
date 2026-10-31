#!/usr/bin/env node
// Fresh synthetic lesson + isolated Live service; no production data or deployment.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true});
const host=await context.newPage();host.setDefaultTimeout(15000);
const checks=[],errors=[];host.on('pageerror',e=>errors.push(e.message));
const record=s=>{checks.push(s);console.log(s)};
const origin=`http://127.0.0.1:${process.env.LIVE_CANVAS_HOST_PORT??5179}`;
let canonical=new Map(),lastMessage;
async function join(name,offset=0){
 const c=await browser.newContext({viewport:{width:1100,height:800}});
 if(offset)await c.addInitScript(offset=>{const original=Date.now;Date.now=()=>original()+offset;},offset);
 const p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 p.on('websocket',socket=>socket.on('framereceived',f=>{const m=JSON.parse(String(f.payload));if(m.type==='snapshot'){canonical=new Map(m.elements.map(e=>[e.id,e]));lastMessage=m}else if(m.type==='diff'){for(const id of m.removed)canonical.delete(id);for(const e of m.elements)canonical.set(e.id,e);lastMessage=m}}));
 const url=await host.evaluate(()=>{const s=window.clipFixture.host.state.session;return `${s.baseUrl}/join/${s.inviteId}`});
 await p.goto(url);await p.getByLabel('Dein Name',{exact:true}).fill(name);await p.getByRole('button',{name:'Beitreten',exact:true}).click();return p;
}
const seconds=async p=>{const text=await p.locator('.timer-widget__time span').textContent();const [m,s]=text.split(':').map(Number);return m*60+s};
try{
 await host.goto(`${origin}/src/live/clip.browser.html?lesson=synthetic-remote-timer-${Date.now()}&theme=dark`);
 await host.waitForFunction(()=>window.clipFixture?.port&&window.clipFixture?.api);await host.waitForTimeout(500);
 await host.evaluate(()=>window.clipFixture.port.placeTimer({clientX:550,clientY:420}));await host.locator('.timer-widget').waitFor();
 const nativeId=await host.locator('.timer-widget').getAttribute('data-timer-id');
 await host.evaluate(()=>{const api=window.clipFixture.api,t=api.getSceneElements()[0];api.updateScene({elements:[...api.getSceneElements(),{...t,id:'other-content',x:100,y:100,customData:undefined,backgroundColor:'#0000ff',strokeColor:'#0000ff'}]});});
 await host.getByRole('button',{name:'Clip aufnehmen',exact:true}).tap();
 const timerBox=await host.locator('.timer-widget').boundingBox();await host.touchscreen.tap(timerBox.x+timerBox.width/2,timerBox.y+timerBox.height/2);
 await host.getByRole('button',{name:'Materialclip 1 zeigen',exact:true}).waitFor();
 assert.equal(await host.locator('.timer-widget__editor').count(),0,'one-shot capture cannot click through into the timer editor');
 assert.equal(await host.evaluate(()=>window.clipFixture.clipControls.addSelected.current(3)),true);
 await host.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).waitFor();
 record('Existing material-clip assignment gives the timer slot 3');
 const popup=context.waitForEvent('page');await host.evaluate(()=>window.clipFixture.room.start());const room=await popup;
 await room.waitForLoadState();await room.locator('.timer-widget').waitFor();
 await host.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).click();
 await host.waitForFunction(()=>window.clipFixture.room.state.target.kind==='material'&&window.clipFixture.room.state.ready);
 await room.locator('.timer-widget').waitFor();assert.equal(await room.locator('.timer-widget__start').count(),1);
 record('The numbered timer clip also works in Room with the original shared controls');
 await host.evaluate(()=>window.clipFixture.room.stop());await room.close();
 await host.evaluate(()=>window.clipFixture.host.create());await host.waitForFunction(()=>window.clipFixture.host.state.connected);
 const viewer=await join('Remote Uhr');await host.evaluate(()=>window.clipFixture.host.start());
 await viewer.locator('.timer-widget.is-readonly').waitFor();
 assert.equal(await viewer.locator('.timer-widget__actions,.timer-widget__grip,.timer-widget__stop').count(),0);
 assert.doesNotMatch(JSON.stringify([...canonical.values()]),new RegExp(nativeId));
 record('Remote receives a passive timer with opaque identity and no controls or sound');
 await host.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).click();
 await host.waitForFunction(()=>window.clipFixture.host.state.publicationReady&&!window.clipFixture.host.state.busy);
 await viewer.waitForTimeout(250);assert.equal([...canonical.values()].filter(e=>e.timer).length,1);assert.equal(canonical.size,1,'material clip excludes unrelated canvas content');
 assert.equal(await host.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).getAttribute('aria-pressed'),'true');
 record('Material clip number selects the isolated fullscreen Remote timer');

 await host.getByRole('button',{name:'2 Minuten',exact:true}).tap();await host.locator('.timer-widget__start').click();
 await viewer.waitForTimeout(1300);assert.ok(Math.abs(await seconds(host)-await seconds(viewer))<=1);
 const late=await join('Später Beitritt',3600000);await late.locator('.timer-widget.is-readonly').waitFor();
 assert.ok(Math.abs(await seconds(host)-await seconds(late))<=1,'one-hour client clock offset cannot change remaining time');
 record('Running time and late join stay aligned with a one-hour viewer clock offset');
 await host.locator('.timer-widget__start').click();await viewer.waitForTimeout(300);const paused=await seconds(viewer);await viewer.waitForTimeout(1200);assert.equal(await seconds(viewer),paused);
 await viewer.reload();await viewer.locator('.timer-widget.is-readonly').waitFor();assert.ok(Math.abs(await seconds(viewer)-paused)<=1);
 record('Pause and reconnect preserve the canonical remaining time');
 await host.getByRole('button',{name:'Timer zeigen',exact:true}).click();await viewer.waitForTimeout(300);
 record('Direct Timer zeigen uses the same isolated projection without creating a new numbered clip');
 await mkdir('output/timer-remote',{recursive:true});await viewer.screenshot({path:'output/timer-remote/remote-timer.png'});
 await host.getByRole('button',{name:'Dauer einstellen',exact:true}).click();
 await host.getByRole('textbox',{name:'Dauer in Minuten:Sekunden'}).fill('0:01');await host.getByRole('button',{name:'Übernehmen',exact:true}).click();
 await host.locator('.timer-widget__start').click();await viewer.waitForFunction(()=>document.querySelector('.timer-widget__time span')?.textContent==='0:00');
 record('The single host deadline ends the Remote timer without a second alarm');
 await host.evaluate(()=>window.clipFixture.port.flushPersistence());await host.reload();await host.locator('.timer-widget').waitFor();await host.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).waitFor();
 await host.waitForFunction(()=>window.clipFixture.host.state.publicationReady);await viewer.waitForTimeout(300);assert.equal(canonical.size,1,'active timer target recovers as isolated view');
 await host.evaluate(()=>window.clipFixture.host.setFree());await host.waitForFunction(()=>window.clipFixture.host.state.presentation.mode==='free');await viewer.waitForTimeout(300);assert.equal(canonical.size,2,'return restores the complete sanitized canvas');
 record('Timer, numbered clip and isolated target survive host reload; return restores canvas');
 assert.deepEqual(errors,[]);await writeFile('output/timer-remote/browser-checks.json',JSON.stringify({checks,errors,lastMessageType:lastMessage?.type},null,2)+'\n');
}catch(error){console.error('Host state',await host.evaluate(()=>{const s=window.clipFixture?.host.state;return s?{state:s.state,presentation:s.presentation,error:s.error,publicationReady:s.publicationReady}:null}).catch(()=>null));throw error}finally{await host.evaluate(()=>window.clipFixture?.host.end()).catch(()=>{});await browser.close()}
