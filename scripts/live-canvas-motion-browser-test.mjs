#!/usr/bin/env node
// Run live-canvas-browser-check.mjs first. Actual projector/host/service/viewer,
// deterministic synthetic native input. Never publishes into the real meeting.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
const baseline=process.argv.includes('--baseline');
const output=process.argv.includes('--clips') ? 'output/live-canvas-clip-motion' : 'output/live-canvas-motion';
const selectedMode=process.argv.find(arg=>arg.startsWith('--mode='))?.slice(7);
try {
  for(const mode of (selectedMode ? [selectedMode] : process.argv.includes('--clips') ? ['clip-image','clip-cover','clip-edge'] : ['rectangle','image','cover'])) {
    const context=await browser.newContext();
    // A delayed ACK models a 90ms return trip. It must not set the motion rate.
    await context.addInitScript(() => {
      const NativeWebSocket=WebSocket;
      window.WebSocket=class extends NativeWebSocket {
        set onmessage(listener) {
          super.onmessage = event => {
            if (typeof event.data==='string' && JSON.parse(event.data).type==='published') setTimeout(()=>listener?.call(this,event),90);
            else listener?.call(this,event);
          };
        }
      };
    });
    const host=await context.newPage(), viewer=await context.newPage();
    await viewer.setViewportSize({width:1100,height:760});
    host.setDefaultTimeout(10000);viewer.setDefaultTimeout(10000);
    const updates=[],presentations=[],puts=[],gets=[],errors=[];
    host.on('request',r=>{if(r.method()==='PUT'&&r.url().includes('/assets/'))puts.push(Date.now());});
    viewer.on('request',r=>{if(r.url().includes('/assets/')&&!r.url().includes('.js'))gets.push({time:Date.now(),id:r.url().split('/').at(-1)});});
    viewer.on('websocket',socket=>socket.on('framereceived',frame=>{
      const m=JSON.parse(String(frame.payload));
      if(m.type==='snapshot'||m.type==='diff') updates.push({t:Date.now(),revision:m.revision,inline:m.rasters?.length??0,assetIds:m.assetIds});
      if(m.type==='presentation') presentations.push({t:Date.now(),revision:m.presentation.revision,x:m.presentation.clip?.x});
    }));
    for(const page of [host,viewer])page.on('pageerror',e=>errors.push(e.message));
    await host.goto('http://127.0.0.1:5174/src/live/motion.browser.html');
    await host.waitForFunction(()=>window.motionFixture);
    const invite=await host.evaluate(mode=>window.motionFixture.start(mode),mode);
    await viewer.goto(invite);await viewer.getByLabel('Dein Name',{exact:true}).fill('Synthetic motion');
    await viewer.getByRole('button',{name:'Beitreten',exact:true}).click();
    await host.evaluate(()=>window.motionFixture.begin());await viewer.getByText('Live',{exact:true}).waitFor();
    await viewer.waitForTimeout(500);
    // A fresh clip starts fitted. The former participant reset control is
    // intentionally absent; the host can recall the same clip when needed.
    if(mode.startsWith('clip-')) {
      assert.equal(await viewer.getByRole('button',{name:'Ganzer Clip',exact:true}).count(),0);
      await viewer.waitForTimeout(500);
    }
    await viewer.locator('canvas.excalidraw__canvas:not(.interactive)').waitFor({state:'visible'});
    const recording=viewer.evaluate(async mode=>{
      const canvas=document.querySelector('canvas.excalidraw__canvas:not(.interactive)');
      const ctx=canvas.getContext('2d'), rect=canvas.getBoundingClientRect();
      const scale=Math.min((1100-24)/1600,(760-24)/900), dx=(1100-1600*scale)/2,dy=(760-900*scale)/2;
      const px=x=>Math.round((dx+x*scale-rect.x)*canvas.width/rect.width);
      const py=y=>Math.round((dy+y*scale-rect.y)*canvas.height/rect.height);
      const blue=(r,g,b)=>b>180&&r<80&&g<80;
      const start=performance.now(),samples=[];
      while(performance.now()-start<2900){
        await new Promise(requestAnimationFrame);
        let edge=null,control=true;
        if(mode.endsWith('cover')){
          const data=ctx.getImageData(px(250),py(100),1,py(710)-py(100)).data;
          for(let y=0;y<data.length/4;y++){const i=y*4;if(data[i]>180&&data[i+1]<80&&data[i+2]<80){edge=y;break;}}
          const color=ctx.getImageData(px(1400),py(200),1,1).data;control=blue(...color);
        }else{
          const data=ctx.getImageData(px(50),py(250),px(800)-px(50),1).data;
          for(let x=0;x<data.length/4;x++){if(blue(...data.slice(x*4,x*4+3))){edge=x;if(mode!=='clip-edge'&&mode!=='clip-window')break;}}
        }
        samples.push({t:Math.round(performance.now()-start),edge,control,connected:canvas.isConnected});
      }
      return samples;
    },mode);
    const start=Date.now(),beforePuts=puts.length,beforeGets=gets.length;
    await host.evaluate(async()=>{
      const start=performance.now();
      await new Promise(resolve=>{
        const step=now=>{const t=Math.min(1,(now-start)/2000);window.motionFixture.move(t*240);if(t<1)requestAnimationFrame(step);else resolve();};
        requestAnimationFrame(step);
      });
    });
    const samples=await recording;
    const frames=updates.filter(e=>e.t>=start&&e.t<start+2200);
    const distinct=new Set(samples.map(s=>s.edge).filter(e=>e!==null));
    const cameraUpdates=presentations.filter(e=>e.t>=start&&e.t<start+2200);
    const result={mode,updates:frames.length,presentationUpdates:cameraUpdates.length,visiblePositions:distinct.size,httpUploads:puts.length-beforePuts,httpDownloads:gets.length-beforeGets,inlineFrames:frames.filter(f=>f.inline>0).length,blankControlFrames:samples.filter(s=>!s.control).length};
    results.push(result);console.log(JSON.stringify(result));
    await mkdir(output,{recursive:true});
    await writeFile(`${output}/${mode}-samples.json`,JSON.stringify(samples));
    await viewer.screenshot({path:`${output}/${mode}${baseline?'-baseline':''}.png`});
    assert.ok(samples.every(s=>s.connected&&s.control),'canvas remounted or unchanged content flashed');
    assert.equal((await host.evaluate(()=>window.motionFixture.state())).error,null);
    assert.deepEqual(errors,[]);
    if(!baseline) {
    if(mode==='clip-window') {
      assert.equal(frames.length,0,'clip camera motion must not republish content');
      assert.ok(cameraUpdates.length>=30,`${mode}: presentation transport stalled (${cameraUpdates.length} updates)`);
    } else assert.ok(frames.length>=30,`${mode}: transport stalled (${frames.length} updates)`);
    assert.ok(distinct.size>=25,`${mode}: visible pixels stalled (${distinct.size} positions)`);
    assert.equal(puts.length-beforePuts,0,'small motion must not upload HTTP assets');
    assert.equal(gets.length-beforeGets,0,'stable public assets must not trigger HTTP reloads');
    if(mode.endsWith('cover'))assert.ok(frames.some(f=>f.inline>0),'cover changes used no inline raster updates');
    else assert.ok(frames.every(f=>f.inline===0),'plain or camera motion retransmitted pixels');
    }
    await host.evaluate(()=>window.motionFixture.end());
    await context.close();
  }
  await writeFile(`${output}/${baseline?'baseline':'results'}.json`,JSON.stringify({results,scope:'Local Chromium; synthetic native input over 2s, 90ms artificial ACK delay. Pixel samples, not real iPad or school-network validation.'},null,2));
}finally{await browser.close();}
