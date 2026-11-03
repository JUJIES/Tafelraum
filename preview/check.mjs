import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url))('playwright');
const origin=process.argv[2]||'http://127.0.0.1:5987';
await mkdir(new URL('../output/public-preview/screens/',import.meta.url),{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await ctx.newPage();page.setDefaultTimeout(20000);
 await page.goto(origin+'/?lesson=map-room');
 const data=await page.evaluate(async()=>{const r=await fetch('/api/archive');return r.json()});
 assert.deepEqual(data.catalog.lessons.map(l=>l.id),['volcanoes']);
 const board=await page.evaluate(async()=>(await fetch('/api/archive/lessons/volcanoes/board')).json());
 assert.deepEqual(board.clips.map(c=>c.number).sort(),[1,2,3,4]);
 assert.ok(board.elements.filter(e=>e.type==='text').length>=15);
 const sheet=page.frameLocator('iframe[src*="/interactive/volcanoes-field-sheet/"]').first();
 await sheet.locator('textarea').first().waitFor();
 await page.getByRole('button',{name:'Fit to content',exact:true}).click();
 await sheet.locator('textarea').first().fill('A benefit and a risk');
 const other=await ctx.newPage();await other.goto(origin);
 assert.equal(await other.frameLocator('iframe[src*="/interactive/volcanoes-field-sheet/"]').first().locator('textarea').first().inputValue(),'');await other.close();
 await page.getByRole('button',{name:'Present',exact:true}).click();
 const popup=ctx.waitForEvent('page');await page.getByRole('button',{name:'Start',exact:true}).click();const room=await popup;
 await page.getByRole('button',{name:'Show material clip 2',exact:true}).first().click();
 const rs=room.frameLocator('iframe').first();await rs.locator('textarea').first().waitFor();
 assert.equal(await rs.locator('textarea').first().inputValue(),'A benefit and a risk');
 for(const i of [3,4])await page.getByRole('button',{name:'Show clip '+i,exact:true}).first().click();
 await page.screenshot({path:new URL('../output/public-preview/screens/volcanoes.png',import.meta.url).pathname});
 await room.close();await page.reload();assert.equal(await page.frameLocator('iframe[src*="/interactive/volcanoes-field-sheet/"]').first().locator('textarea').first().inputValue(),'');
 const code=await page.evaluate(async()=>(await fetch('/api/archive',{method:'POST',body:'{}'})).status);assert.equal(code,405);
 for(const name of ['volcanoes-field-sheet','volcanoes-teacher-answers']){
  const p=await ctx.newPage();await p.goto(origin+'/api/archive/lessons/volcanoes/materials/interactive/'+name+'/index.html');await p.getByRole('heading',{level:1}).waitFor();await p.close();
 }
 const response=await fetch(origin+'/api/archive/lessons/volcanoes/board',{method:'PUT',body:'{}'});assert.equal(response.status,405);
 await ctx.close();console.log('PASS: lesson, worksheet, Room clips, inputs, tab isolation, reset, legacy URL and read-only server');
}finally{await browser.close()}
