#!/usr/bin/env node
// Start scripts/live-canvas-browser-check.mjs --clips first. Synthetic archive only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
// A passive synthetic document suffices: the bug is in host annotations, not package JS.
await page.route('**/materials/interactive/live-canvas-html/index.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><body style="margin:0;background:white"><h1>Testblatt</h1><p>Eigene Notiz darüber abdecken.</p></body>'}));
const origin=`http://127.0.0.1:${Number(process.env.LIVE_CANVAS_HOST_PORT??5174)}`;
const projectedCover=page.locator('.interactive-html-canvas-frame__annotations polyline[fill="#3e4854"]');
const waitForCover=async visible=>{
  await page.waitForFunction(visible=>Boolean(document.querySelector('.interactive-html-canvas-frame__annotations polyline[fill="#3e4854"]'))===visible,visible);
};
try {
  await page.goto(`${origin}/src/live/clip.browser.html`);
  await page.waitForFunction(()=>window.clipFixture?.api&&window.clipFixture?.port);
  await page.getByRole('button',{name:'Lange Textbox',exact:true}).click();
  const text=await page.evaluate(()=>window.clipFixture.api.getSceneElements().find(e=>e.type==='text'));
  await page.getByRole('button',{name:'Test-HTML',exact:true}).click();
  await page.waitForFunction(()=>window.clipFixture.api.getSceneElements().some(e=>e.customData?.materialKind==='interactive-html'));
  await page.evaluate(text=>{
    const api=window.clipFixture.api;
    const material=api.getSceneElements().find(e=>e.customData?.materialKind==='interactive-html');
    const note={...text,x:material.x+30,y:material.y+100,width:200,height:30,text:'Eigene Antwort',originalText:'Eigene Antwort',strokeColor:'#111111',customData:{},groupIds:[`tafelraum-image-annotations:${material.id}`]};
    api.updateScene({elements:[material,note],appState:{selectedElementIds:{[text.id]:true},selectedGroupIds:{},editingGroupId:null}});
  },text);
  await page.locator('.text-quick-actions').getByRole('button',{name:'Abdeckung hinzufügen',exact:true}).click();
  await waitForCover(true);
  await page.waitForTimeout(900); // Observe the committed state after the sweep has gone.
  assert.equal(await page.locator('.image-cover-feedback-frame').count(),0);
  assert.equal(await projectedCover.count(),1);
  const nativeCoverCount=()=>page.evaluate(()=>window.clipFixture.api.getSceneElements().filter(e=>!e.isDeleted&&e.customData?.role==='image-cover').length);
  assert.equal(await nativeCoverCount(),1);
  await page.evaluate(()=>window.clipFixture.port.undo());
  await waitForCover(false);
  await page.evaluate(()=>window.clipFixture.port.redo());
  await waitForCover(true);
  await page.evaluate(()=>window.clipFixture.port.flushPersistence());
  await page.reload();
  await waitForCover(true);
  assert.equal(await nativeCoverCount(),1,'reload must retain one native cover');
  await mkdir('output/html-text-cover',{recursive:true});
  await page.screenshot({path:'output/html-text-cover/covered-after-reload.png'});
  assert.deepEqual(errors,[]);
  console.log('HTML text cover: sweep commit, Undo/Redo and reload passed.');
} finally {await browser.close();}
