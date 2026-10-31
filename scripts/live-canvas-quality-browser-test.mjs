#!/usr/bin/env node
// Isolated browser-check runner required. Synthetic high-resolution worksheet.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const baseline=process.argv.includes('--baseline'),results=[];
try{
  for(const mode of ['follow','follow-cover','clip','clip-cover','clip-edge',...baseline?[]:['follow-pdf','clip-cover-pdf']]){
    const context=await browser.newContext({viewport:{width:820,height:1180},deviceScaleFactor:2});
    const host=await context.newPage(),viewer=await context.newPage();
    const errors=[];for(const page of [host,viewer])page.on('pageerror',e=>errors.push(e.message));
    await host.goto('http://127.0.0.1:5174/src/live/quality.browser.html');
    await host.waitForFunction(()=>window.qualityFixture);
    const result=await host.evaluate(mode=>window.qualityFixture.prepare(mode),mode);
    const invite=await host.evaluate(()=>window.qualityFixture.start());
    await viewer.goto(invite);await viewer.getByLabel('Dein Name',{exact:true}).fill('Synthetic quality');
    await viewer.getByRole('button',{name:'Beitreten',exact:true}).click();
    const started=Date.now();await host.evaluate(()=>window.qualityFixture.begin());
    // The Live badge is session status, not a rendering acknowledgement.
    await viewer.locator('.live-view-canvas.is-ready').waitFor();result.readyMs=Date.now()-started;
    // Watch the static scene for five seconds. There is no quality-upgrade message
    // or second image download; sampling native canvas excludes CSS entrance blur.
    const samples=await viewer.evaluate(async()=>{
      const canvas=document.querySelector('canvas.excalidraw__canvas:not(.interactive)');
      const ctx=canvas.getContext('2d'),start=performance.now(),samples=[];
      for(const delay of [0,500,1500,5000]){
        await new Promise(r=>setTimeout(r,Math.max(0,start+delay-performance.now())));
        const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let hash=2166136261;for(let i=0;i<data.length;i+=16)hash=Math.imul(hash^data[i],16777619);
        samples.push({ms:Math.round(performance.now()-start),hash});
      }return samples;
    });
    result.samples=samples;
    assert.equal(samples[1].hash,samples[3].hash,'static worksheet unexpectedly sharpens/changes after 500ms');
    assert.ok(result.reused,'unchanged worksheet rerasterized');
    assert.deepEqual(errors,[]);assert.equal(await host.evaluate(()=>window.qualityFixture.state().error),null);
    if(!baseline)assert.ok(result.contrast>75,`${mode}: fine source lines lost (${result.contrast})`);
    await mkdir('output/live-canvas-quality',{recursive:true});
    await viewer.screenshot({path:`output/live-canvas-quality/${mode}${baseline?'-baseline':''}.png`});
    results.push(result);console.log(JSON.stringify(result));
    await host.evaluate(()=>window.qualityFixture.end());await context.close();
  }
  await writeFile(`output/live-canvas-quality/${baseline?'baseline':'results'}.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
