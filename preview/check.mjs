// Smoke-test the exact public origin. Screenshots contain only the bundled sample lessons.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(path.join(root,'prototypes/surface-shell-a-b/package.json'))('playwright');
const origin=process.argv[2] || 'http://127.0.0.1:5987';
const shots=path.join(root,'output/public-preview/screens');await mkdir(shots,{recursive:true});
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:1500,height:950}});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const traffic=[];context.on('request',r=>traffic.push([r.method(),r.url()]));
 const frame=(p,id)=>p.frameLocator('.interactive-html-canvas-frame iframe[src*="/interactive/'+id+'/"]');
 for(const [id,title,observation,answer] of [
   ['eclipse','LIGHT LAB 01','In line','The Moon'],
   ['map-room','SURVEY SHEET 02','Ridge trail','1.5 km'],
   ['dispatch','ARCHIVE FILE 03','Radio note','Two flashes were seen']
 ]){
   await page.goto(origin+'/?lesson='+id);
   await frame(page,id).getByRole('heading',{name:title}).waitFor();
   await frame(page,id).getByRole('button',{name:observation,exact:true}).click();
   await page.getByRole('button',{name:'Fit to content'}).click();
   await page.waitForTimeout(320);
   await page.screenshot({path:path.join(shots,id+'.png')});
   const board=await page.evaluate(async lesson=>(await fetch('/api/archive/lessons/'+lesson+'/board')).json(),id);
   assert.deepEqual(board.clips.filter(c=>!c.kind).map(c=>c.number),[1,2,3,4]);
   assert.ok(board.elements.some(e=>e.type==='image'));
   assert.ok(board.elements.filter(e=>e.type==='text').length>=15);
   await frame(page,id).getByRole('button',{name:'Quiz',exact:true}).click();
   await frame(page,id).getByRole('button',{name:answer,exact:true}).click();
   assert.match(await frame(page,id).getByRole('status').first().innerText(),/Correct/);
   if(id==='map-room'){
     const sheet=frame(page,'trail-sheet');
     await sheet.getByRole('img',{name:/Topographic grid map/}).waitFor();
     assert.equal(await sheet.getByRole('heading',{level:2}).count(),3);

     await sheet.getByRole('textbox',{name:'Ridge edges'}).fill('6');
     await sheet.getByText('Compare your measurements').click();
     await sheet.getByText(/6 edges = 1.5 km/).waitFor();
     await page.reload();
     assert.equal(await sheet.getByRole('textbox',{name:'Ridge edges'}).inputValue(),'');
   }
 }
 await page.goto(origin+'/?lesson=eclipse');await frame(page,'eclipse').getByRole('button',{name:'In line',exact:true}).click();
 const other=await context.newPage();await other.goto(origin+'/?lesson=eclipse');
 await frame(other,'eclipse').getByRole('button',{name:'Before alignment',exact:true}).waitFor();
 assert.equal(await frame(other,'eclipse').getByRole('button',{name:'Before alignment',exact:true}).getAttribute('aria-pressed'),'true');
 await other.close();
 await page.getByRole('button',{name:'Present',exact:true}).click();const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Start',exact:true}).click();const room=await popup;
 const clip=page.getByRole('button',{name:/clip 5/i}).first();await clip.click();
 const roomFrame=room.frameLocator('iframe').first();
 await roomFrame.getByRole('button',{name:'In line',exact:true}).waitFor();
 await roomFrame.getByRole('button',{name:'Quiz',exact:true}).click();
 await roomFrame.getByRole('button',{name:'The Moon',exact:true}).click();
 await frame(page,'eclipse').getByText(/Correct\. The Moon/).waitFor();
 await roomFrame.getByRole('button',{name:'Explore',exact:true}).click();
 await roomFrame.getByRole('button',{name:'In line',exact:true}).click();
 const oldRoomWidth = await room.locator('iframe').first().evaluate(el=>el.getBoundingClientRect().width);
 await page.getByRole('button',{name:/^Show clip 2$/i}).click();
 await room.waitForFunction(width=>{
   const frame=document.querySelector('iframe');
   return frame && frame.getBoundingClientRect().width < width * .97;
 },oldRoomWidth);
 await roomFrame.getByRole('button',{name:'In line',exact:true}).waitFor();
 await room.screenshot({path:path.join(shots,'room.png'),animations:'disabled'});
 assert.equal(traffic.some(([,u])=>u.startsWith('https://www.youtube-nocookie.com')),false,'Video must wait for activation');
 await room.close();
 await page.goto(origin+'/?lesson=eclipse');
 await page.getByRole('button',{name:'Load YouTube video'}).click();
 await page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/hyf5JF_VxwM"]').waitFor({state:'attached'});
 await page.goto(origin+'/?lesson=map-room');
 await frame(page,'trail-sheet').getByRole('textbox',{name:'Ridge edges'}).waitFor();
 await page.getByRole('button',{name:'Present',exact:true}).click();
 const sheetPopup=page.waitForEvent('popup');
 await page.getByRole('button',{name:'Start',exact:true}).click();
 const sheetRoom=await sheetPopup;
 await page.getByRole('button',{name:/material clip 6/i}).click();
 const sheetOutput=sheetRoom.frameLocator('iframe').first();
 await sheetOutput.getByRole('textbox',{name:'Ridge edges'}).fill('6');
 const fieldLocator=frame(page,'trail-sheet').locator('#re');
 for(let i=0;i<40 && await fieldLocator.inputValue()!=='6';i++)await page.waitForTimeout(100);
 assert.equal(await fieldLocator.inputValue(),'6','Room worksheet input reaches the teacher');
 await sheetRoom.close();
 const dbs=await page.evaluate(()=>indexedDB.databases());assert.equal(dbs.length,0);
 assert.equal(traffic.filter(([m,u])=>u.startsWith(origin+'/')&&!['GET','HEAD'].includes(m)).length,0);
 const methods=['POST','PUT','DELETE'];for(const method of methods)assert.equal((await fetch(origin+'/api/archive',{method})).status,405);
 for(const url of ['/api/agent-kit','/api/archive/status','/api/teaching-agent/sessions','/.git/config','/routes.json'])assert.equal((await fetch(origin+url)).status,404,url);
 console.log('PASS: three activities, quizzes, local Room input sync, reset, isolated tabs, zero IndexedDB databases, no browser writes to server, restricted HTTP routes.');
} finally {await browser.close()}
