#!/usr/bin/env node
// Run isolated live-canvas-browser-check.mjs first. Synthetic pixels only.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const baseline = process.argv.includes('--baseline');
const hostOrigin = `http://127.0.0.1:${Number(process.env.LIVE_CANVAS_HOST_PORT ?? 5174)}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const host = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const viewer = await browser.newPage({ viewport: { width: 1100, height: 760 } });
// Exercise the HTTP/older-client fallback, including deliberate asset failures.
// The motion browser test separately covers negotiated inline raster delivery.
await viewer.addInitScript(() => {
  const send = WebSocket.prototype.send;
  WebSocket.prototype.send = function(data) {
    if (typeof data === 'string') {
      const message = JSON.parse(data);
      if (message.type === 'auth') { message.supportsInlineRasters = false; data = JSON.stringify(message); }
    }
    return send.call(this,data);
  };
});
host.setDefaultTimeout(10000); viewer.setDefaultTimeout(10000);
const received = [], errors = [];
for (const page of [host,viewer]) page.on('pageerror', e => errors.push(e.message));
viewer.on('websocket', socket => socket.on('framereceived', frame => {
  const m = JSON.parse(String(frame.payload)); if (['snapshot','diff','camera'].includes(m.type)) received.push(m);
}));
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
const results = [];
try {
  await host.goto(`${hostOrigin}/src/live/cover.browser.html`);
  await host.getByRole('button', { name:'Live Canvas', exact:true }).click();
  await viewer.goto(await host.getByRole('link', { name:'Teilnehmer öffnen' }).getAttribute('href'));
  await viewer.getByLabel('Dein Name', { exact:true }).fill('Synthetic cover');
  await viewer.getByRole('button', { name:'Beitreten', exact:true }).click();
  await host.getByRole('button', { name:'Starten', exact:true }).click();
  await viewer.getByText('Live', { exact:true }).waitFor();
  await host.getByRole('button', { name:'Schließen', exact:true }).click();
  await delay(650);
  assert(received.some(m => m.type === 'snapshot' && m.elements.some(e => e.type === 'image')), 'fixture must publish its safe raster');
  const vp = received.filter(m => m.type === 'snapshot' || m.type === 'camera').at(-1).viewport;
  const zoom = Math.min((1100-24)/vp.width, (760-24)/vp.height);
  const point = (x,y) => ({x:(x-vp.x)*zoom+(1100-vp.width*zoom)/2,y:(y-vp.y)*zoom+(760-vp.height*zoom)/2});
  const coordinates = { blue:point(680,190), a:point(200,290), b:point(400,290) };
  const observe = () => viewer.evaluate(async coords => {
    const canvas = document.querySelector('canvas.excalidraw__canvas:not(.interactive)');
    if (!canvas) throw new Error('Static canvas absent');
    const context = canvas.getContext('2d'); const rect = canvas.getBoundingClientRect();
    const pixel = p => Array.from(context.getImageData(Math.floor((p.x-rect.x)*canvas.width/rect.width),Math.floor((p.y-rect.y)*canvas.height/rect.height),1,1).data).slice(0,3);
    const start = performance.now(), samples = [];
    while (performance.now()-start < 1000) {
      await new Promise(requestAnimationFrame);
      const overlay = document.querySelector('.live-cover-feedback-frame');
      samples.push({t:Math.round(performance.now()-start), blue:pixel(coords.blue), a:pixel(coords.a), b:pixel(coords.b), effect:overlay?.className ?? '', connected:canvas.isConnected});
    }
    return samples;
  }, coordinates);
  for (const [button, revealing, pixelKey] of [['Abdeckung A',true,'a'],['Abdeckung B',true,'b'],['Abdeckung A',false,'a'],['Abdeckung A',true,'a']]) {
    const before = received.length, recording = observe();
    await host.getByRole('button', {name:button,exact:true}).click();
    const samples = await recording;
    const changed = samples.find(s => revealing ? s[pixelKey][0] > 180 && s[pixelKey][1] < 80 : s[pixelKey][0] < 100 && s[pixelKey][1] > 40);
    const blankFrames = samples.filter(s => s.blue[2] < 150 || s.blue[0] > 80).length;
    const animatedFrames = samples.filter(s => s.effect).length;
    results.push({button,revealing,changedMs:changed?.t ?? null,blankFrames,animatedFrames,transitions:received.slice(before).filter(m => m.type !== 'camera').map(m => m.coverTransition?.type ?? null)});
    assert(samples.every(s => s.connected), 'canvas remounted');
    assert(changed, 'final material pixels missing');
    if (!baseline) { assert.equal(blankFrames,0,'unchanged blue content flashed'); assert(animatedFrames > 0,'cover transition missing'); }
  }
  if (!baseline) {
    await host.getByRole('button',{name:'Abdeckung A',exact:true}).click();
    const overlay = viewer.locator('.live-cover-feedback-frame');
    await overlay.waitFor({state:'visible'});
    const original = await overlay.elementHandle();
    const cameraCount = received.filter(m => m.type === 'camera').length;
    await host.getByRole('button',{name:'Kamera bewegen',exact:true}).click();
    for (let i=0;i<30 && received.filter(m => m.type === 'camera').length === cameraCount;i++) await delay(5);
    assert(received.filter(m => m.type === 'camera').length > cameraCount,'camera delivered during wipe');
    assert(await original.evaluate(node => node.isConnected),'camera cancelled or remounted wipe');
    await overlay.waitFor({state:'hidden'});
    results.push({check:'camera during cover wipe keeps the same overlay and cleans it up',ok:true});
    // A later content revision supersedes an unfinished transition, not its camera.
    await host.getByRole('button',{name:'Abdeckung A',exact:true}).click();
    await overlay.waitFor({state:'visible'});
    await host.getByRole('button',{name:'Abdeckung A',exact:true}).click();
    await delay(500); assert.equal(await overlay.count(),0,'superseded overlay remained');
    results.push({check:'rapid reversal leaves no orphan overlay',ok:true});
    await viewer.emulateMedia({reducedMotion:'reduce'});
    const recording = observe();
    await host.getByRole('button',{name:'Abdeckung A',exact:true}).click();
    const samples = await recording;
    assert(samples.every(s => !s.effect),'reduced motion must skip cover overlays');
    results.push({check:'reduced motion skips wipe and animation delay',ok:true});
    await viewer.emulateMedia({reducedMotion:'no-preference'});
    // A cover toggle is vector-only. Once the image is present, it must not
    // perform another asset request or enter the incomplete-publication state.
    let coverAssetRequests = 0;
    await viewer.route('**/api/live/rooms/*/assets/*',route => { coverAssetRequests++; return route.abort(); });
    await host.getByRole('button',{name:'Abdeckung A',exact:true}).click();
    await overlay.waitFor({state:'visible'});
    await overlay.waitFor({state:'hidden'});
    assert.equal(coverAssetRequests,0,'cover toggle fetched image bytes again');
    await viewer.getByText('Live',{exact:true}).waitFor();
    await viewer.unroute('**/api/live/rooms/*/assets/*');
    results.push({check:'cover toggle stays vector-only after initial image load',ok:true});
    const projector = await browser.newPage();
    await projector.goto(`${hostOrigin}/src/live/public-projection.browser.html`);
    const checks = await projector.evaluate(() => window.projectionChecks);
    assert.equal(checks.ok,true,checks.error);
    results.push({check:'native safe projector regression',count:checks.checks.length,ok:true});
  }
  await mkdir('output/live-canvas-cover', {recursive:true});
  await viewer.screenshot({path:`output/live-canvas-cover/${baseline?'before':'after'}.png`});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,baseline,results,measurement:'Synthetic local host commit to sampled viewer pixels; excludes school network and physical tablets.'},null,2));
  await host.getByRole('button', {name:/Live Canvas/}).click();
  // Browser contexts and test runner own these ephemeral rooms; never real lessons.
} finally { await browser.close(); }
