import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const app=fileURLToPath(new URL('../prototypes/surface-shell-a-b/',import.meta.url));
const require=createRequire(app+'package.json');
const {createServer}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium,webkit}=require('playwright');
const server=await createServer({configFile:false,root:app,plugins:[react()],define:{__TAFELRAUM_VERSION__:JSON.stringify('channel-test')},server:{host:'127.0.0.1',port:0,watch:{ignored:['**/src-tauri/target/**','**/desktop-resources/**']}}});
const output=new URL('../output/desktop-update-channels/',import.meta.url);await mkdir(output,{recursive:true});
const checks=[];let browser;
try {
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]) {
  browser=await engine.launch();
  for(const channel of ['manual','public','colleagues']) {
   const context=await browser.newContext({viewport:{width:1100,height:800}});
   await context.addInitScript(channel=>{window.testUpdateChannel=channel;},channel);
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
   await page.goto(origin+'/src/desktop-update-prompt.browser.html');
   await page.waitForFunction(()=>window.setPresenting&&window.emitUpdate);
   await page.getByRole('button',{name:'Version und Updates',exact:true}).click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   assert.equal(await dialog.getByRole('button',{name:'Nach Updates suchen',exact:true}).count(),channel==='manual'?0:1);
   await page.screenshot({path:new URL(name+'-'+channel+'.png',output).pathname});
   await page.keyboard.press('Escape');
   await page.evaluate(()=>window.setPresenting(true));await page.evaluate(()=>window.emitUpdate({currentVersion:'channel-test',availableVersion:'9.9.9',phase:'idle',updateChannel:window.testUpdateChannel}));
   assert.equal(await page.evaluate(()=>window.updateCheckRequests??0),0);
   await page.evaluate(()=>window.setPresenting(false));
   if(channel!=='manual')await page.waitForFunction(()=>window.updateCheckRequests>0);
   await page.evaluate(()=>window.emitUpdate({currentVersion:'channel-test',availableVersion:'9.9.9',phase:'idle',updateChannel:window.testUpdateChannel}));await page.evaluate(()=>window.setPresenting(false));
   assert.equal(await page.evaluate(()=>window.updateCheckRequests??0),channel==='manual'?0:1);
   assert.deepEqual(errors,[]);checks.push(name+': '+channel+' UI, presentation guard and one-time offer');
   await context.close();
  }
  await browser.close();browser=null;
 }
 await writeFile(new URL('report.json',output),JSON.stringify(checks,null,2));console.log(checks.join('\n'));
} finally {await browser?.close();await server.close();}
