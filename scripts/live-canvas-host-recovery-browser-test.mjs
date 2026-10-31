#!/usr/bin/env node
// Run live-canvas-browser-check.mjs --clips --meeting. No real archive/session.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
const route='http://127.0.0.1:5174/src/live/clip.browser.html';
const ready=page=>page.waitForFunction(()=>window.clipFixture?.api&&!window.clipFixture.api.getAppState().isLoading);
try{
  for(const mode of ['follow','clip']){
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    let host=await context.newPage();const tablet=await context.newPage();
    await tablet.setViewportSize({width:820,height:1180});
    const errors=[];context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
    const frames=[];tablet.on('websocket',ws=>ws.on('framereceived',e=>frames.push(JSON.parse(String(e.payload)))));
    await host.goto(route);await ready(host);await host.getByRole('button',{name:'Testinhalt',exact:true}).click();
    await host.evaluate(()=>window.clipFixture.port.flushPersistence());
    if(mode==='clip')await host.evaluate(()=>window.clipFixture.host.showClip({id:'recovery-clip',x:95,y:95,width:350,height:490}));
    await host.getByRole('button',{name:'Live Canvas',exact:true}).click();
    await host.waitForFunction(()=>window.clipFixture.host.state.connected);
    const invite=await host.getByRole('link',{name:'Teilnehmer öffnen'}).getAttribute('href');
    await tablet.goto(invite);await tablet.getByLabel('Dein Name').fill('Recovery test');
    await tablet.getByRole('button',{name:'Beitreten',exact:true}).click();
    await host.getByRole('button',{name:'Starten',exact:true}).click();
    await tablet.locator('.live-view-canvas.is-ready').waitFor();
    await tablet.locator('.live-view-canvas').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
    const participant=await host.evaluate(()=>window.clipFixture.host.state.participants.find(p=>p.connected).id);
    const generation=frames.filter(f=>f.type==='snapshot'||f.type==='diff').at(-1).generation;
    const snapshot=await tablet.screenshot({clip:{x:100,y:200,width:500,height:500}});
    const marker=frames.length;
    await host.close();
    await tablet.waitForTimeout(200);
    assert.ok(snapshot.equals(await tablet.screenshot({clip:{x:100,y:200,width:500,height:500}})),'host close cleared student content');
    host=await context.newPage();await host.goto(route);await ready(host);
    assert.equal(await host.evaluate(()=>sessionStorage.getItem('tafelraum.live-canvas.host.v1')),null,'fresh window inherited tab credentials');
    assert.equal(await host.evaluate(()=>window.clipFixture.host.state.session),null,'app mount silently reclaimed host');
    let provisions=0;host.on('request',r=>{if(r.url().endsWith('/api/live/rooms')&&r.method()==='POST')provisions++;});
    const start=Date.now();await host.getByRole('button',{name:'Live Canvas',exact:true}).click();
    await host.waitForFunction(()=>window.clipFixture.host.state.connected&&window.clipFixture.host.state.publicationReady);
    const resumeMs=Date.now()-start;
    assert.equal(provisions,0,'recovery attempted second room');assert.ok(resumeMs<5000,'recovery waited for server grace timeout');
    assert.equal(await host.evaluate(()=>window.clipFixture.host.state.presentation.mode),mode);
    assert.equal(await host.evaluate(()=>window.clipFixture.host.state.participants.find(p=>p.connected).id),participant);
    assert.equal(frames.filter(f=>f.type==='snapshot'||f.type==='diff').at(-1).generation,generation);
    assert.ok(!frames.slice(marker).some(f=>f.type==='ended'||f.type==='status'&&f.state!=='live'),'student left live session');
    assert.equal(await tablet.getByRole('button',{name:'Beitreten',exact:true}).count(),0);
    // Explicit handoff from another window: old publisher yields once and must
    // not erase shared recovery or reconnect to reclaim it.
    const next=await context.newPage();await next.goto(route);await ready(next);
    await next.getByRole('button',{name:'Live Canvas',exact:true}).click();
    await next.waitForFunction(()=>window.clipFixture.host.state.publicationReady);
    await host.waitForFunction(()=>window.clipFixture.host.state.session===null);
    assert.ok(await next.evaluate(()=>localStorage.getItem('tafelraum.live-canvas.host.v1')));
    await next.evaluate(()=>window.clipFixture.host.end());
    assert.equal(await next.evaluate(()=>localStorage.getItem('tafelraum.live-canvas.host.v1')),null);
    await tablet.getByRole('heading',{name:'Noch kein Canvas gestartet.',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    results.push({mode,resumeMs,provisions,sameParticipant:true,sameGeneration:true});
    await context.close();
  }
  await mkdir('output/live-canvas-recovery',{recursive:true});
  await writeFile('output/live-canvas-recovery/results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
}finally{await browser.close();}
