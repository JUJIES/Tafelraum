// Measure the actual renderer independently of browser-driver wheel dispatch latency.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {webkit,chromium}=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url))('playwright');
const origin=process.argv[2]??'http://127.0.0.1:5987';
for(const [name,engine] of [['WebKit',webkit],['Chromium',chromium]]){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await page.goto(origin);await page.locator('.interactive-html-canvas-frame iframe').waitFor();
  const result=await page.evaluate(()=>new Promise(resolve=>{
   const canvas=document.querySelector('.excalidraw canvas');
   const delays=[];let last=performance.now(),n=0;
   function tick(now){
    delays.push(Math.max(0,now-last));last=now;
    canvas.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-90,clientX:1020,clientY:400}));
    if(++n<36)requestAnimationFrame(tick);
    else resolve({delays,filters:[...document.querySelectorAll('.shape-shadow-frame filter')].map(f=>({units:f.getAttribute('filterUnits'),width:Number(f.getAttribute('width')),height:Number(f.getAttribute('height'))}))});
   }
   requestAnimationFrame(tick);
  }));
  for(const f of result.filters){assert.equal(f.units,'userSpaceOnUse');assert.ok(f.width<2600&&f.height<2600);}
  assert.ok(result.filters.length>0);
  console.log(JSON.stringify({engine:name,frames:result.delays.length,totalMs:result.delays.reduce((a,b)=>a+b,0),maxMs:Math.max(...result.delays),steadyFrameMs:result.delays.slice(-12),filterRegions:result.filters}));
 }finally{await browser.close()}
}
