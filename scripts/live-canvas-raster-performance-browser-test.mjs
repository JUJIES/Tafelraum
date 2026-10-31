#!/usr/bin/env node
// Isolated browser-check runner. Synthetic high-resolution worksheet and growing
// native stroke; source-load counts are asserted, machine-dependent timings recorded.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let result;
try {
const page=await browser.newPage();await page.goto('http://127.0.0.1:5174/src/live/quality.browser.html');await page.waitForFunction(()=>window.qualityFixture);
result=await page.evaluate(async()=>{
const {createPublicProjector}=await import('/src/live/public-projection.ts');const convertToExcalidrawElements=values=>values.map(window.qualityFixture.native);
const c=document.createElement('canvas');c.width=1600;c.height=2240;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='black';ctx.font='32px sans-serif';for(let y=40;y<c.height;y+=45)ctx.fillText('Worksheet: explain the details 123456789',20,y);
const file={id:'sheet',dataURL:c.toDataURL(),mimeType:'image/png',created:1};const image=convertToExcalidrawElements([{type:'image',id:'sheet',fileId:'sheet',x:100,y:100,width:400,height:560,status:'saved'}],{regenerateIds:false})[0];
let elements=[image];const api={getSceneElements:()=>elements,getFiles:()=>({sheet:file}),getAppState:()=>({width:1000,height:900,scrollX:0,scrollY:0,zoom:{value:1},viewBackgroundColor:'#fff'})};
const results=[];
for(const mode of ['center','edge','stroke']){const projector=createPublicProjector();const times=[];let encodes=0,sourceLoads=0;const src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...src,set(value){if(value===file.dataURL)sourceLoads++;src.set.call(this,value);}});const old=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(...args){encodes++;return old.apply(this,args)};
for(let i=0;i<25;i++){elements=[{...image,x:mode==='center'?100+i:mode==='edge'?-100+i:100}];if(mode==='stroke'){const points=Array.from({length:300+i*80},(_,j)=>[j*.15,60*Math.sin(j*.03)]);elements.push({...convertToExcalidrawElements([{type:'rectangle',id:'ink',x:20,y:300,width:points.at(-1)[0],height:120,strokeWidth:2}],{regenerateIds:false})[0],type:'freedraw',points,pressures:points.map(()=>.5),simulatePressure:false,lastCommittedPoint:null});}const start=performance.now();await projector.project(api);times.push(performance.now()-start);}
HTMLCanvasElement.prototype.toBlob=old;Object.defineProperty(HTMLImageElement.prototype,'src',src);projector.stop();results.push({mode,encodes,sourceLoads,first:times[0],mean:times.slice(1).reduce((a,b)=>a+b)/24,last:times.slice(-5),max:Math.max(...times.slice(1))});}
return results;});console.log(JSON.stringify(result));
} finally {await browser.close();}
assert.ok(result.find(r=>r.mode==='edge').sourceLoads<=3,'moving the same sheet repeatedly decodes its source');
await mkdir('output/live-canvas-raster-lifetime',{recursive:true});await writeFile('output/live-canvas-raster-lifetime/projection.json',JSON.stringify(result,null,2));
