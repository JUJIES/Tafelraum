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
 const frame=p=>p.frameLocator('.interactive-html-canvas-frame iframe').first();
 for(const [id,title,observation,answer] of [
   ['eclipse','Chasing the shadow','In line','The Moon'],
   ['map-room','The map room','Ridge trail','1.5 km'],
   ['dispatch','The midnight dispatch','Radio note','Two flashes were seen']
 ]){
   await page.goto(origin+'/?lesson='+id);
   await frame(page).getByRole('heading',{name:title}).waitFor();
   await frame(page).getByRole('button',{name:observation,exact:true}).click();
   await page.getByRole('button',{name:'Fit to content'}).click();
   await page.waitForTimeout(320);
   await page.screenshot({path:path.join(shots,id+'.png')});
   await frame(page).getByRole('button',{name:'Lesson plan'}).click();
   await frame(page).getByText(/45 MINUTES/).waitFor();
   await frame(page).getByRole('button',{name:'Quiz',exact:true}).click();
   await frame(page).getByRole('button',{name:answer,exact:true}).click();
   assert.match(await frame(page).getByRole('status').first().innerText(),/Correct/);
   await frame(page).getByRole('button',{name:'Exit ticket',exact:true}).click();
   await frame(page).getByRole('textbox').fill('This text stays in this tab.');
   await page.reload();
   await frame(page).getByRole('button',{name:'Exit ticket',exact:true}).click();
   assert.equal(await frame(page).getByRole('textbox').inputValue(),'');
 }
 await page.goto(origin+'/?lesson=eclipse');await frame(page).getByRole('button',{name:'In line',exact:true}).click();
 const other=await context.newPage();await other.goto(origin+'/?lesson=eclipse');
 await frame(other).getByRole('button',{name:'Before alignment',exact:true}).waitFor();
 assert.equal(await frame(other).getByRole('button',{name:'Before alignment',exact:true}).getAttribute('aria-pressed'),'true');
 await other.close();
 await page.getByRole('button',{name:'Present',exact:true}).click();const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Start',exact:true}).click();const room=await popup;
 const clip=page.getByRole('button',{name:/clip 1/i}).first();await clip.click();
 const roomFrame=room.frameLocator('iframe').first();
 await roomFrame.getByRole('button',{name:'In line',exact:true}).waitFor();
 await roomFrame.getByRole('button',{name:'Quiz',exact:true}).click();
 await roomFrame.getByRole('button',{name:'The Moon',exact:true}).click();
 await frame(page).getByText(/Correct\. The Moon/).waitFor();
 await roomFrame.getByRole('button',{name:'Explore',exact:true}).click();
 await roomFrame.getByRole('button',{name:'In line',exact:true}).click();
 await room.screenshot({path:path.join(shots,'room.png')});
 const dbs=await page.evaluate(()=>indexedDB.databases());assert.equal(dbs.length,0);
 assert.equal(traffic.filter(([m])=>!['GET','HEAD'].includes(m)).length,0);
 const methods=['POST','PUT','DELETE'];for(const method of methods)assert.equal((await fetch(origin+'/api/archive',{method})).status,405);
 for(const url of ['/api/agent-kit','/api/archive/status','/api/teaching-agent/sessions','/.git/config','/routes.json'])assert.equal((await fetch(origin+url)).status,404,url);
 console.log('PASS: three activities, quizzes, local Room input sync, reset, isolated tabs, zero IndexedDB databases, no browser writes to server, restricted HTTP routes.');
} finally {await browser.close()}
