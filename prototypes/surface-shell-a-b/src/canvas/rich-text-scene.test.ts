import assert from 'node:assert/strict';
import test, {mock} from 'node:test';
import type {ExcalidrawTextElement} from '@excalidraw/excalidraw/element/types';
import * as rich from './rich-text.ts';

mock.module('@excalidraw/excalidraw',{namedExports:{
  newElementWith:(element:object,patch:object)=>({...element,...patch}),
  convertToExcalidrawElements:(elements:object[])=>elements.map(element=>({...element,type:'image'})),
}});
// Deterministic font measurement: tests exercise scene/gesture ownership, not
// browser font rendering, which is covered by the real CanvasSurface fixture.
mock.module('./rich-text.ts',{namedExports:{...rich,rasterizeRichText:(document:rich.RichText,width:number,wrap:boolean,lineHeight:number)=>{
  const font=document.runs[0].style.fontSize;
  return {dataURL:'data:image/png;base64,test',width:wrap?width:document.text.length*font/2,
    height:Math.ceil(document.text.length*font/2/width)*font*lineHeight};
}}});
const {reconcileRichTextScene}=await import('./rich-text-scene.ts');
const source={id:'text',type:'text',x:100,y:100,width:420,height:144,angle:0,
  text:'Ein längerer Text. '.repeat(10),originalText:'Ein längerer Text. '.repeat(10),
  strokeColor:'#111111',fontSize:24,fontFamily:2,lineHeight:1.2,autoResize:false,
  verticalAlign:'top',containerId:null,isDeleted:false,customData:{}} as ExcalidrawTextElement;
const sourceOf=(elements:readonly {id:string}[])=>elements.find(element=>element.id==='text') as ExcalidrawTextElement;

test('rich resize leaves native gesture geometry intact and scales semantic spans',()=>{
  const initial={...source,customData:{richText:rich.richTextFromNative(source)}};
  const prepared=sourceOf(reconcileRichTextScene([initial]).elements);
  const resized={...prepared,width:prepared.width*1.06,height:prepared.height*1.06,fontSize:prepared.fontSize*1.06};
  const result=sourceOf(reconcileRichTextScene([resized],null,null,'text').elements);
  assert.equal(result.width,resized.width);
  assert.equal(result.height,resized.height);
  assert.equal(result.customData?.richText && rich.readRichText(result.customData.richText)?.runs[0].style.fontSize,24*1.06);
  const repeated=sourceOf(reconcileRichTextScene([result],null,null,'text').elements);
  assert.equal(repeated.width,result.width);
  assert.equal(repeated.height,result.height);
  assert.equal(repeated.fontSize,result.fontSize);
  const finished=sourceOf(reconcileRichTextScene([result]).elements);
  assert.equal(finished.width,resized.width);
  assert.ok(Math.abs(finished.height-resized.height)<1e-10);
});

test('palette edits and older text align the native baseline without rescaling authored spans',()=>{
  const document=rich.styleRichText(rich.richTextFromNative(source),0,5,{fontSize:48});
  const result=sourceOf(reconcileRichTextScene([{...source,customData:{richText:document}}]).elements);
  assert.equal(result.fontSize,48);
  assert.deepEqual(rich.readRichText(result.customData?.richText)?.runs.map(run=>run.style.fontSize),[48,24]);
});

test('side resizing reflows at the existing span size',()=>{
  const document=rich.richTextFromNative(source);
  const result=sourceOf(reconcileRichTextScene([{...source,width:210,customData:{richText:document}}],null,null,'text').elements);
  assert.equal(result.width,210);
  assert.equal(result.fontSize,24);
  assert.equal(rich.readRichText(result.customData?.richText)?.runs[0].style.fontSize,24);
});

test('new rendition references reach the scene before addFiles initializes their bitmap cache',async()=>{
  const {applyRichTextScene}=await import('./rich-text-scene.ts');
  const installed=new Set<string>(),files:Record<string,unknown>={},calls:string[]=[];
  const api={updateScene:({elements}:any)=>{calls.push('scene');for(const item of elements)if(item.fileId)installed.add(item.fileId);},
    getFiles:()=>files,addFiles:(added:any[])=>{calls.push('files');for(const file of added){assert.ok(installed.has(file.id));files[file.id]=file;}}};
  const file={id:'rendition',dataURL:'data:image/png;base64,test',mimeType:'image/png',created:1};
  applyRichTextScene(api as any,{changed:true,elements:[{type:'image',fileId:'rendition'}] as any,files:[file] as any},'NEVER' as any);
  assert.deepEqual(calls,['scene','files']);
  delete files.rendition;calls.length=0;
  applyRichTextScene(api as any,{changed:false,elements:[],files:[file] as any},'NEVER' as any);
  assert.deepEqual(calls,['files'],'unchanged geometry must still repair missing derived bytes');
});
