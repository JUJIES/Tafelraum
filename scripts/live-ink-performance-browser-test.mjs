#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2]);
const hostOrigin=`http://127.0.0.1:${Number(process.env.TAFELRAUM_LIVE_INK_HOST_PORT??5178)}`;
const browser=await chromium.launch({headless:true});
const host=await browser.newPage({viewport:{width:1440,height:1000}});
const tablet=await browser.newPage({viewport:{width:820,height:1180},deviceScaleFactor:2,hasTouch:true});
for(const page of [host,tablet]) page.setDefaultTimeout(30000);
const sent=[],received=[];
host.on('websocket',socket=>socket.on('framesent',event=>{try{sent.push({at:performance.now(),bytes:event.payload.length,message:JSON.parse(event.payload.toString())});}catch{}}));
tablet.on('websocket',socket=>socket.on('framereceived',event=>{try{received.push({at:performance.now(),bytes:event.payload.length,message:JSON.parse(event.payload.toString())});}catch{}}));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const output='output/live-ink-performance';await mkdir(output,{recursive:true});
try{
  await host.goto(`${hostOrigin}/src/live/clip.browser.html`);
  await host.waitForFunction(()=>window.clipFixture?.api&&!window.clipFixture.api.getAppState().isLoading);
  // The production fixture persists like the real editor. Reset only its
  // isolated temporary board so repeated benchmark runs remain comparable.
  await host.evaluate(()=>window.clipFixture.api.updateScene({elements:[]}));await sleep(100);
  await host.getByRole('button',{name:'Live Canvas',exact:true}).click();
  const invite=await host.getByRole('link',{name:'Teilnehmer öffnen'}).getAttribute('href');
  await tablet.goto(invite);await tablet.getByLabel('Dein Name').fill('Tablet');await tablet.getByRole('button',{name:'Beitreten',exact:true}).click();
  await host.getByRole('button',{name:'Starten',exact:true}).click();await tablet.locator('.live-view-canvas.is-ready').waitFor();
  await host.getByRole('button',{name:'Marker',exact:true}).click();
  await tablet.evaluate(()=>{window.liveInkMeasure={frames:[],longTasks:[],active:true};const tick=t=>{if(!window.liveInkMeasure.active)return;window.liveInkMeasure.frames.push(t);requestAnimationFrame(tick)};requestAnimationFrame(tick);window.liveInkMeasure.observer=new PerformanceObserver(list=>window.liveInkMeasure.longTasks.push(...list.getEntries().map(entry=>entry.duration)));window.liveInkMeasure.observer.observe({type:'longtask'});});
  const bounds=await host.locator('.canvas-engine').boundingBox();
  const center={x:bounds.x+bounds.width*.5,y:bounds.y+bounds.height*.5};
  const samples=[];await host.mouse.move(center.x,center.y);await host.mouse.down();
  const steps=Number(process.env.LIVE_INK_STEPS??520),delay=Number(process.env.LIVE_INK_DELAY_MS??10);
  for(let index=1;index<=steps;index++){
    const row=index%24,side=Math.floor(index/24)%2?1:-1;
    const x=center.x+side*bounds.width*(.18+.012*row),y=center.y+Math.sin(index*.41)*bounds.height*.34;
    await host.mouse.move(x,y);await sleep(delay);
    if(index%65===0)samples.push(await host.evaluate(()=>{const element=window.clipFixture.api.getSceneElements().at(-1);return{points:element?.points?.length??0,error:window.clipFixture.host.state.error,ready:window.clipFixture.host.state.publicationReady}}));
  }
  await host.mouse.up();await sleep(800);
  const tabletPerf=await tablet.evaluate(()=>{window.liveInkMeasure.active=false;window.liveInkMeasure.observer.disconnect();const frames=window.liveInkMeasure.frames,deltas=frames.slice(1).map((value,index)=>value-frames[index]);const sorted=[...deltas].sort((a,b)=>a-b);return{frames:deltas.length,p95:sorted[Math.floor(sorted.length*.95)]??0,max:Math.max(0,...deltas),longTasks:window.liveInkMeasure.longTasks.length,longTaskMs:window.liveInkMeasure.longTasks.reduce((a,b)=>a+b,0),canvasReady:Boolean(document.querySelector('.live-view-canvas.is-ready')),heading:document.querySelector('.live-entry-content h1')?.textContent??null};});
  const contentSent=sent.filter(frame=>frame.message.type==='publish');const inkSent=sent.filter(frame=>frame.message.type==='patch'&&frame.message.channel==='ink');
  const contentReceived=received.filter(frame=>frame.message.type==='snapshot'||frame.message.type==='diff');const inkReceived=received.filter(frame=>frame.message.type==='patch'&&frame.message.channel==='ink');
  const extremeStarted=performance.now(),extremeBefore=contentSent.length;
  await host.evaluate(()=>{const api=window.clipFixture.api,elements=api.getSceneElements(),element=elements.at(-1);
    const outline=Array.from({length:24_001},(_,index)=>{const angle=index/24_000*Math.PI*2,radius=350+45*Math.sin(angle*73);return[400+Math.cos(angle)*radius,400+Math.sin(angle)*radius]});
    const points=[[0,0],...outline,outline[0],[0,0]];api.updateScene({elements:elements.map(candidate=>candidate.id===element.id?{...element,x:0,y:0,width:800,height:800,points,version:element.version+1,versionNonce:element.versionNonce+1}:candidate)});});
  for(let attempt=0;attempt<120&&sent.filter(frame=>frame.message.type==='publish').length===extremeBefore;attempt++)await sleep(50);
  const extremePublishLatencyMs=performance.now()-extremeStarted;
  await sleep(300);
  const extremePublishes=sent.filter(frame=>frame.message.type==='publish'),extremeFrame=extremePublishes.at(-1),extreme={publishLatencyMs:extremePublishLatencyMs,published:extremePublishes.length>extremeBefore,
    wirePoints:extremeFrame?.message.elements?.find(element=>element.type==='line')?.points?.length??0,
    ...await host.evaluate(()=>({ready:window.clipFixture.host.state.publicationReady,error:window.clipFixture.host.state.error})),
    canvasReady:await tablet.locator('.live-view-canvas.is-ready').count()===1};
  const result={samples,final:await host.evaluate(()=>{const element=window.clipFixture.api.getSceneElements().at(-1);return{points:element?.points?.length??0,error:window.clipFixture.host.state.error,ready:window.clipFixture.host.state.publicationReady}}),tabletPerf,
    transport:{publishesSent:contentSent.length,publishesReceived:contentReceived.length,inkPatchesSent:inkSent.length,inkPatchesReceived:inkReceived.length,
      publishBytes:contentSent.reduce((sum,frame)=>sum+frame.bytes,0),inkPatchBytes:inkSent.reduce((sum,frame)=>sum+frame.bytes,0),
      totalInkTransportBytes:[...contentSent,...inkSent].reduce((sum,frame)=>sum+frame.bytes,0),maxInkPatchBytes:Math.max(0,...inkSent.map(frame=>frame.bytes)),
      lastSentPoints:contentSent.at(-1)?.message.elements?.at(-1)?.points?.length??0},extreme};
  await writeFile(`${output}/result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  assert.equal(result.final.ready,true,'live publication became unavailable during a long marker stroke');
  assert.ok(result.transport.publishesSent<=4,'active ink fell back to repeated canonical scene publications');
  assert.ok(result.transport.inkPatchesSent>0&&result.transport.inkPatchesReceived===result.transport.inkPatchesSent,'ink range patches did not reach the tablet exactly once');
  assert.ok(result.transport.totalInkTransportBytes<10_000_000,'ink range transport regressed beyond its measured budget');
  assert.equal(result.tabletPerf.canvasReady,true,'tablet viewer left the ready canvas');
  assert.ok(result.extreme.wirePoints>0&&result.extreme.wirePoints<=12_000,'extreme public stroke was not bounded');
  assert.equal(result.extreme.published,true,'extreme public stroke did not publish');
  assert.equal(result.extreme.ready,true,'extreme public stroke revoked the current scene');
  assert.equal(result.extreme.error,null,'extreme public stroke left a host projection error');
  assert.equal(result.extreme.canvasReady,true,'tablet viewer left the canvas for extreme ink');
}finally{await browser.close();}
