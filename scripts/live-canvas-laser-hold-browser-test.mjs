import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='output/live-canvas-refine';await mkdir(out,{recursive:true});
try {
 await page.goto('http://127.0.0.1:5174/src/live/clip.browser.html');await page.waitForFunction(()=>window.clipFixture?.api&&!window.clipFixture.api.getAppState().isLoading);
 await page.getByRole('button',{name:'Testinhalt',exact:true}).click();
 const cdp=await page.context().newCDPSession(page);
 const pen=async(type,x,y,pressed=false)=>cdp.send('Input.dispatchMouseEvent',{type,x,y,pointerType:'pen',button:type==='mouseMoved'?'none':'left',buttons:pressed?1:0,clickCount:type==='mouseMoved'?0:1,force:pressed?.5:0});
 const key=async(type,key='y',code='KeyZ')=>cdp.send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:89});
 const count=()=>page.evaluate(()=>window.clipFixture.api.getSceneElements().filter(e=>e.customData?.role==='ink-pen').length);
 const geometry=()=>page.evaluate(()=>JSON.stringify(window.clipFixture.api.getSceneElements()));
 const selected=()=>page.getByRole('button',{name:'Zeiger',exact:true}).getAttribute('aria-pressed');
 await page.getByRole('button',{name:'Stift',exact:true}).click();
 // A real pen pointer is still pressed when German-layout Y takes over.
 await pen('mouseMoved',210,390);await pen('mousePressed',210,390,true);await pen('mouseMoved',285,420,true);
 await key('keyDown');assert.equal(await selected(),'true','Y immediately takes over an active pen gesture');
 await page.waitForTimeout(50);const committed=await geometry();const before=await count();assert.ok(before>0);
 await page.locator('.live-laser-overlay').waitFor({state:'visible'});
 await pen('mouseMoved',360,460,true);await page.waitForTimeout(60);assert.equal(await geometry(),committed,'laser movement cannot extend ink');
 await key('keyUp','Y');assert.equal(await selected(),'false','release matches physical key even if letter case changes');
 await pen('mouseMoved',390,480,true);await pen('mouseReleased',390,480);assert.equal(await geometry(),committed,'release while pen touches cannot create a connecting stroke');
 await pen('mousePressed',240,500,true);await pen('mouseMoved',310,510,true);await pen('mouseReleased',310,510);assert.equal(await count(),before+1,'next pen contact draws normally');
 await page.evaluate(()=>window.clipFixture.port.undo());await page.waitForTimeout(80);assert.equal(await count(),before,'next stroke remains one undo step');
 await page.evaluate(()=>window.clipFixture.port.undo());await page.waitForTimeout(80);assert.equal(await count(),before-1,'interrupted stroke was committed as its own undo step');
 await page.evaluate(()=>window.clipFixture.port.redo());await page.waitForTimeout(80);assert.equal(await count(),before);
 await key('keyDown');assert.equal(await selected(),'true','Y after completed ink is never latched off');await key('keyUp');
 await key('keyDown','z','KeyY');assert.equal(await selected(),'false','German Z is not the Y shortcut');await key('keyUp','z','KeyY');
 await key('keyDown','y','KeyY');assert.equal(await selected(),'true','English Y works too');await key('keyUp','y','KeyY');
 await page.getByRole('button',{name:'Zeiger',exact:true}).click();assert.equal(await selected(),'true');
 const camera=()=>page.evaluate(()=>{const s=window.clipFixture.api.getAppState();return {x:s.scrollX,y:s.scrollY};});
 const oldCamera=await camera(), pinnedGeometry=await geometry();
 await page.keyboard.down('Space');assert.equal(await selected(),'false','Space suspends pinned laser immediately after toolbar click');
 await page.mouse.move(520,720);await page.mouse.down();await page.mouse.move(610,770,{steps:8});await page.mouse.up();
 assert.notDeepEqual(await camera(),oldCamera,'Space actually pans');assert.equal(await geometry(),pinnedGeometry,'pan cannot write ink');
 await page.keyboard.up('Space');assert.equal(await selected(),'true','release restores pinned laser');
 await page.keyboard.down('y');await page.keyboard.down('Space');assert.equal(await selected(),'false');await page.keyboard.up('y');assert.equal(await selected(),'false');await page.keyboard.up('Space');assert.equal(await selected(),'true','pinned base survives both temporary keys');
 await page.keyboard.press('Escape');await page.keyboard.down('Space');await page.keyboard.down('y');assert.equal(await selected(),'false');await page.keyboard.up('Space');assert.equal(await selected(),'true','Y held during Space becomes active when Space is released');await page.keyboard.up('y');assert.equal(await selected(),'false');
 for(const activation of ['pinned','held']) {
  await page.getByRole('button',{name:'Stift',exact:true}).click();
  if(activation==='pinned')await page.getByRole('button',{name:'Zeiger',exact:true}).click();else await page.keyboard.down('y');
  const beforeZoom=await page.evaluate(()=>window.clipFixture.api.getAppState().zoom.value), beforeGeometry=await geometry();
  await page.mouse.move(700,500);await page.keyboard.down('Control');await page.mouse.wheel(0,-200);await page.keyboard.up('Control');
  await page.waitForFunction(z=>window.clipFixture.api.getAppState().zoom.value>z,beforeZoom);
  const zoomed=await page.evaluate(()=>window.clipFixture.api.getAppState().zoom.value);
  await page.keyboard.down('Control');await page.mouse.wheel(0,150);await page.keyboard.up('Control');
  await page.waitForFunction(z=>window.clipFixture.api.getAppState().zoom.value<z,zoomed);
  assert.equal(await selected(),'true','zoom keeps laser active');assert.equal(await geometry(),beforeGeometry,'zoom changes no ink');
  const target=await page.evaluate(()=>{
   const api=window.clipFixture.api,s=api.getAppState(),e=api.getSceneElements().find(e=>e.type==='rectangle');
   return {id:e.id,x:(e.x+60+s.scrollX)*s.zoom.value+s.offsetLeft,y:(e.y+350+s.scrollY)*s.zoom.value+s.offsetTop};
  });
  await page.mouse.dblclick(target.x,target.y);
  await page.waitForFunction(id=>window.clipFixture.api.getAppState().activeTool.type==='selection'&&window.clipFixture.api.getAppState().selectedElementIds[id],target.id);
  assert.equal(await selected(),'false','double-click exits laser and selects object');
  if(activation==='held'){
   await page.keyboard.down('y');assert.equal(await selected(),'false','autorepeat cannot reactivate a cancelled held laser');
   await page.keyboard.up('y');assert.equal(await selected(),'false','keyup preserves explicit selection');
  }
  assert.equal(await page.evaluate(()=>Boolean(window.clipFixture.api.getAppState().editingTextElement)),false,'double-click selection creates no text');
 }
 await page.screenshot({path:out+'/pen-after-handoff.png'});assert.deepEqual(errors,[]);
 await writeFile(out+'/hold-checks.json',JSON.stringify({ok:true,checks:['German and English Y','active pen handoff','no movement required to show pointer','release while pen pressed','next stroke','no false Z shortcut','pinned laser to actual Space pan and back','both temporary-key release orders','pinned and held laser Ctrl+wheel zoom in/out','double-click selects object and exits laser','Y autorepeat and release preserve explicit selection'],errors},null,2));
 console.log('PASS German/English Y, pen handoff, Space pan, pinned/held laser Ctrl+wheel zoom and double-click selection');
} finally {await browser.close();}
