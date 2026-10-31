// Synthetic opaque worksheet: exact-pixel codec comparison, no teaching assets.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
const exec=promisify(execFile);
const {chromium}=await import(process.argv[2]);
const output=fileURLToPath(new URL('../output/performance-audit/',import.meta.url));
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const source=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=1191;canvas.height=1684;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1191,1684);
  ctx.fillStyle='#182739';ctx.font='bold 34px sans-serif';ctx.fillText('Synthetic worksheet — Text and diagrams',60,70);
  ctx.font='18px sans-serif';for(let row=0;row<60;row++){ctx.fillStyle=row%3?'#263344':'#7c385c';ctx.fillText(`${row+1}. Beschreibe die Abbildung und ordne die Begriffe zu. ABC 0123456789`,60,110+row*24);}
  const data=ctx.getImageData(0,0,1191,1684).data;window.codecCanvas=canvas;window.codecPixels=data;
  const results=[];for(const type of ['image/png','image/webp']){const start=performance.now();const blob=await new Promise(r=>canvas.toBlob(r,type,1));const elapsed=performance.now()-start;const dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});results.push({type,bytes:blob.size,ms:elapsed,dataURL});}return results;
 });
 await writeFile(`${output}codec-worksheet.png`,Buffer.from(source[0].dataURL.split(',')[1],'base64'));
 const started=performance.now();await exec('/opt/homebrew/bin/cwebp',['-quiet','-lossless','-q','0','-m','1',`${output}codec-worksheet.png`,'-o',`${output}codec-worksheet-lossless.webp`]);
 const elapsed=performance.now()-started,lossless=await readFile(`${output}codec-worksheet-lossless.webp`);
 source.push({type:'image/webp explicit lossless -q0 -m1',bytes:lossless.length,ms:elapsed,dataURL:`data:image/webp;base64,${lossless.toString('base64')}`});
 const results=[];for(const item of source){const check=await page.evaluate(async({dataURL})=>{const image=new Image();image.src=dataURL;const start=performance.now();await image.decode();const decodeMs=performance.now()-start;const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let changedPixels=0,maxDifference=0;for(let i=0;i<d.length;i+=4){let changed=false;for(let j=0;j<4;j++){const delta=Math.abs(d[i+j]-window.codecPixels[i+j]);if(delta)changed=true;maxDifference=Math.max(maxDifference,delta);}if(changed)changedPixels++;}return{decodeMs,changedPixels,maxDifference,width:c.width,height:c.height,rgbaBytes:d.length};},item);results.push({...item,dataURL:undefined,...check});}
 await writeFile(`${output}codec-results.json`,JSON.stringify({environment:'Chromium browser encoder; cwebp 1.6.0 explicit lossless includes process launch/PNG read; one synthetic worksheet, single timings not a codec ranking',results},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
