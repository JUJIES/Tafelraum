// Real author surfaces; deterministic host status for draft/ack race checks.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),staged=path.join(root,'output/interactive-materials');
const engine=process.argv[3]||'chromium';assert.ok(['chromium','webkit'].includes(engine));
const output=path.join(root,'output/glt-html-integration/controls',engine==='webkit'?'webkit':'');await mkdir(output,{recursive:true});
const ids=['glt-lernszenen-player','glt-hattie-mittag','glt-hattie-wiki'];
const server=createServer(async(req,res)=>{
  try{
    const [id,...parts]=new URL(req.url,'http://localhost').pathname.slice(1).split('/');assert.ok(ids.includes(id));
    const name=parts.join('/')||'controller.html',file=path.resolve(staged,id,name);assert.ok(file.startsWith(path.join(staged,id)+path.sep));
    let bytes=await readFile(file);
    if(name==='controller.html'){
      const state=id.includes('wiki')?{frame:0}:id.includes('mittag')?{version:1,position:0}:{slide:1,positions:[0,0]};
      const stub=`<script>window.__state=${JSON.stringify(state)};window.__status={playing:false,position:0,duration:70,volume:1,canPrevious:true,canNext:true};window.__commands=[];window.tafelraumLive={getState:()=>window.__state,applyState:s=>{window.__state=s;window.dispatchEvent(new Event('tafelraum:controller-change'));}};window.tafelraumPlaybackController={getState:()=>window.__state,getStatus:()=>window.__status,command:c=>window.__commands.push(c)};</script>`;
      bytes=Buffer.from(bytes.toString().replace('</head>',stub+'</head>'));
    }
    res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(bytes);
  }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const engines=await import(process.argv[2]);const browser=await engines[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
  for(const id of ids){
    await page.goto(`http://127.0.0.1:${server.address().port}/${id}/controller.html`);
    await page.locator('#play svg').waitFor();
    assert.equal(await page.locator('details').count(),0);assert.equal(await page.locator('#fullscreen').count(),1);
    const boxes=await page.locator('#controller-tools > button,#seek,#time,#volume').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {id:el.id,cy:b.y+b.height/2,h:b.height,w:b.width};}));
    assert.ok(boxes.every(b=>Math.abs(b.cy-boxes[0].cy)<1),'all controls on one line');
    assert.ok(boxes.filter(b=>b.id!=='time').every(b=>b.h>=48));assert.ok(boxes.find(b=>b.id==='seek').w>160);
    const seek=page.locator('#seek'),box=await seek.boundingBox(),y=box.y+box.height/2;
    await page.mouse.move(box.x+8,y);await page.mouse.down();await page.mouse.move(box.x+box.width*.72,y,{steps:16});
    const target=Number(await seek.inputValue());assert.ok(target>30);
    await page.evaluate(()=>{window.__status.position=2;window.dispatchEvent(new Event('tafelraum:controller-change'));});
    assert.equal(Number(await seek.inputValue()),target);assert.equal(await page.evaluate(()=>window.__commands.length),0);
    await page.screenshot({path:path.join(output,id+'-drag.png')});
    await page.mouse.up();assert.equal(await page.evaluate(()=>window.__commands.length),1);
    await page.evaluate(()=>{window.__status.position=3;window.dispatchEvent(new Event('tafelraum:controller-change'));});
    assert.equal(Number(await seek.inputValue()),target,'old status cannot bounce the selected position');
    await page.evaluate(t=>{window.__status.position=t;window.dispatchEvent(new Event('tafelraum:controller-change'));window.__status.position=t+1;window.dispatchEvent(new Event('tafelraum:controller-change'));},target);
    assert.equal(Number(await seek.inputValue()),target+1,'focused idle slider follows acknowledged playback');
    // Abort a real second gesture with Escape, then release: no new command.
    await page.mouse.move(box.x+box.width*.3,y);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,y,{steps:8});
    await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await page.evaluate(()=>window.__commands.length),1);
    await page.mouse.move(box.x+box.width*.3,y);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.5,box.y-90,{steps:10});
    const outsideTarget=Number(await seek.inputValue());await page.mouse.up();
    assert.equal(await page.evaluate(()=>window.__commands.length),2,'release outside the range still commits exactly once');
    assert.equal(await page.evaluate(()=>window.__commands.at(-1).value),outsideTarget);
    // Both actual range thumbs must survive repeated grabs, stale Room ticks,
    // release outside and idle mouse movement (not just a click on the track).
    for(const control of ['seek','volume']){
      const input=page.locator('#'+control),b=await input.boundingBox(),cy=b.y+b.height/2;
      for(const fraction of [.25,.8,.45]){
        const before=await page.evaluate(()=>window.__commands.length);
        const old=Number(await input.inputValue()),max=Number(await input.getAttribute('max'));
        const thumb=b.x+8+old/max*(b.width-16);
        await page.mouse.move(thumb+2,cy);await page.mouse.down();
        assert.equal(Number(await input.inputValue()),old,'thumb grab preserves offset');
        await page.mouse.move(b.x+8+(b.width-16)*fraction,cy,{steps:12});
        const chosen=Number(await input.inputValue());
        await page.evaluate(()=>{window.__status.position=1;window.__status.volume=1;window.dispatchEvent(new Event('tafelraum:controller-change'));});
        assert.equal(Number(await input.inputValue()),chosen,'Room heartbeat cannot overwrite either held thumb');
        assert.equal(await page.evaluate(()=>window.__commands.length),before,'no commands during either drag');
        await page.mouse.up();assert.equal(await page.evaluate(()=>window.__commands.length),before+1);
        await page.mouse.move(b.x+b.width*.95,cy,{steps:8});await page.mouse.move(b.x+b.width*.05,cy,{steps:8});
        assert.equal(Number(await input.inputValue()),chosen,'hover after release never tracks mouse');
        await page.evaluate(({control,chosen})=>{
          window.__status[control==='seek'?'position':'volume']=chosen;
          window.dispatchEvent(new Event('tafelraum:controller-change'));
        },{control,chosen});
      }
    }
    await page.getByRole('button',{name:'Stoppen und zum Anfang',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__commands.at(-1).value),0);
    await page.evaluate(()=>{window.__status.position=0;window.dispatchEvent(new Event('tafelraum:controller-change'));});
    await page.screenshot({path:path.join(output,id+'-1280.png')});
    await page.locator('#controller-tools').screenshot({path:path.join(output,id+'-bar.png')});
    await page.setViewportSize({width:720,height:540});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(output,id+'-720.png')});await page.setViewportSize({width:1280,height:720});
    console.log(engine+' '+id+': single row, repeated thumb drag/release/hover, position and volume ACKs, Escape and stop passed');
  }
  assert.deepEqual(errors,[]);await writeFile(path.join(output,'results.json'),JSON.stringify({ok:true,engine,packages:ids,errors},null,2)+'\n');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
