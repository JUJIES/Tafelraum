// Actual dialog components with synthetic inputs; never touches a running app or private services.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import distribution from '../prototypes/surface-shell-a-b/distribution.json' with {type:'json'};
const repository=fileURLToPath(new URL('../',import.meta.url)),app=path.join(repository,'prototypes/surface-shell-a-b');
const require=createRequire(path.join(app,'package.json'));
const {createServer}=await import(require.resolve('vite')),{default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium,webkit}=require('playwright');
const temporary=await mkdtemp(path.join(tmpdir(),'tafelraum-buttons-')),output=path.join(repository,'output/button-states-audit');
await mkdir(output,{recursive:true});
const html=`<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';
import {DocumentImageEditor} from '/src/canvas/DocumentImageEditor.tsx';
import {CanvasRecoveryDialog} from '/src/canvas/CanvasRecoveryDialog.tsx';
import {MobileCaptureControls} from '/src/MobileCaptureControls.tsx';
import {StudentNotes,CourseStudentsEditor} from '/src/StudentNotes.tsx';
import {ShortcutHelp} from '/src/ShortcutHelp.tsx';
import {DistributionSettings} from '/src/DistributionSettings.tsx';
import '/src/styles.css';
const h=React.createElement,kind=new URLSearchParams(location.search).get('kind'),noop=()=>{};
const canvas=document.createElement('canvas');canvas.width=400;canvas.height=240;
canvas.getContext('2d').fillRect(0,0,400,240);const source=canvas.toDataURL();
const result={dataURL:source,width:400,height:240,rect:{x:0,y:0,width:1,height:1},uncertain:false};
const anchor={left:30,right:450,top:70,bottom:90};
const components={
 document:()=>h(DocumentImageEditor,{source,result,fixedRect:null,angle:0,mirrorX:false,mirrorY:false,saving:false,error:null,onCancel:noop,onApply:noop}),
 recovery:()=>h(CanvasRecoveryDialog,{resolve:noop}),
 capture:()=>h(MobileCaptureControls,{capture:{state:{session:{title:'Synthetic lesson',connected:true,savedCount:0}},busy:false,error:null,change:async()=>true},open:true,onClose:noop,lessonId:'synthetic',lessonTitle:'Synthetic lesson'}),
 notes:()=>h(StudentNotes,{lessonId:'synthetic',anchor,onClose:noop,onEditStudents:noop}),
 roster:()=>h(CourseStudentsEditor,{classId:'synthetic',anchor,onClose:noop}),
 shortcuts:()=>h(ShortcutHelp),ai:()=>h(DistributionSettings),
};
createRoot(document.getElementById('root')).render(h('div',{className:'app-shell'},h(components[kind])));
</script></body></html>`;
const server=await createServer({configFile:false,root:app,cacheDir:path.join(temporary,'vite'),server:{host:'127.0.0.1',port:0,watch:{ignored:['**/agent-kit/**','**/.agent-kit-*/**']}},plugins:[react(),{name:'button-audit',configureServer(vite){vite.middlewares.use((req,res,next)=>{
 if(req.url?.startsWith('/audit.html')){void vite.transformIndexHtml('/audit.html',html).then(body=>{res.setHeader('Content-Type','text/html');res.end(body);});return;}
 if(req.url?.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url.includes('sentence-check')?{supported:true,configured:true}:req.url.includes('student-notes')?{lessonId:'synthetic',classId:'synthetic',rows:[]}: {classId:'synthetic',revision:'fixture',students:[]}));return;}next();
});}}]});
const results=[],errors=[];let browser;
async function state(button){return button.evaluate(el=>{const s=getComputedStyle(el);return {outline:s.outlineStyle,background:s.backgroundColor,border:s.borderColor,color:s.color,filter:s.filter};});}
async function settle(button){await button.evaluate(async el=>{while(el.getAnimations().some(a=>a.playState==='running'))await Promise.allSettled(el.getAnimations().map(a=>a.finished));});}
try{
 await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:1000}});
  await context.route('**/*',route=>route.request().url().startsWith(origin)||/^(data:|blob:)/.test(route.request().url())?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  for(const theme of ['light','dark'])for(const kind of ['document','recovery','capture','notes','roster','shortcuts',...(distribution.profile==='personal'?['ai']:[])]){
   await page.goto(origin+'/audit.html?kind='+kind);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(kind==='shortcuts')await page.getByRole('button',{name:'Tastenkürzel',exact:true}).click();
   if(kind==='ai')await page.getByRole('button',{name:'KI-Anschluss',exact:true}).click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   if(kind==='notes')await dialog.getByRole('button',{name:'Namen hinterlegen',exact:true}).waitFor();
   if(kind==='roster')await dialog.locator('input').first().waitFor();
   if(kind==='ai')await dialog.getByText('Hinterlegt',{exact:true}).waitFor();
   const buttons=dialog.locator('button:enabled:not(.document-image-handle):not([aria-pressed="true"])');
   let count=0;
   for(const button of await buttons.all()){
    if(!await button.isVisible())continue;
    await page.mouse.move(0,0);await button.evaluate(el=>el.blur());await settle(button);const idle=await state(button);
    await page.mouse.move(0,0);await page.keyboard.press('Tab');await button.focus();await settle(button);
    const focused=await state(button);assert.equal(focused.outline,'none',`${engineName}/${theme}/${kind}: ${await button.textContent()}`);
    if(!await button.evaluate(el=>el.matches('.document-image-primary')))assert.notEqual(focused.background,idle.background,kind+': focus must visibly differ from rest');
    await button.evaluate(el=>el.blur());await button.hover();await settle(button);const hovered=await state(button);
    assert.deepEqual(hovered,focused,`${engineName}/${theme}/${kind}: hover and keyboard focus differ`);count++;
   }
   for(const button of await dialog.locator('button:disabled').all()){
    if(!await button.isVisible())continue;
    await page.mouse.move(0,0);await settle(button);const idle=await state(button);
    await button.hover();await settle(button);assert.deepEqual(await state(button),idle,kind+': disabled buttons must not acquire an active hover');
   }
   assert.ok(count>0,kind);results.push({engine:engineName,theme,kind,buttons:count});
   await page.mouse.move(0,0);await page.screenshot({path:path.join(output,`${engineName}-${theme}-${kind}.png`),animations:'disabled'});
  }
  await browser.close();browser=null;
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(output,'report.json'),JSON.stringify({profile:distribution.profile,results},null,2)+'\n');
 console.log(`${distribution.profile}: ${results.length} actual dialog/theme/browser cases, ${results.reduce((n,r)=>n+r.buttons,0)} button checks passed`);
}finally{await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});}
