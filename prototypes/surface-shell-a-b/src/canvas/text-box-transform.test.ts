import assert from 'node:assert/strict';
import {mock,test} from 'node:test';
import {richTextFromNative,styleRichText} from './rich-text.ts';
import type {ExcalidrawTextElement} from '@excalidraw/excalidraw/element/types';
mock.module('@excalidraw/excalidraw',{namedExports:{newElementWith:(element:object,patch:object)=>({...element,...patch}),
  convertToExcalidrawElements:(elements:object[])=>elements,
  restoreElements:(elements:any[],_:unknown,options:any)=>{
    assert.equal(options.refreshDimensions,true);assert.equal(options.repairBindings,true);
    return elements.map(e=>({...e,text:'Alpha\nBeta',height:60}));
  },
}});
const {textBoxContent,transformedTextBox,textBoxTransformPatch}=await import('./text-box-transform.ts');
const {transformRoomAnnotation,validRoomObjectCommand}=await import('../live/room-object-edit.ts');
const base={id:'text',type:'text',x:10,y:20,width:100,height:30,angle:0,fontSize:24,fontFamily:6,lineHeight:1.25,
  text:'Alpha Beta',originalText:'Alpha Beta',autoResize:true,textAlign:'left',strokeColor:'#111111',containerId:null,
  groupIds:['tafelraum-image-annotations:page'],customData:{interactiveHtmlScrollAnchor:{materialId:'page',x:0,y:0}}} as ExcalidrawTextElement;

test('side reflows authored text with native metrics, retaining font size and source text',()=>{
  const result=transformedTextBox(textBoxContent(base),base,{...base,width:50},'e');
  assert.equal(result.content.fontSize,24);assert.equal(result.content.originalText,'Alpha Beta');
  assert.equal(result.content.text,'Alpha\nBeta');assert.equal(result.content.autoResize,false);
  assert.equal(result.geometry.height,60);assert.equal(result.geometry.x,10);assert.equal(result.geometry.y,20);
});
test('corner scales all rich spans proportionally and preserves marks, text and paragraphs',()=>{
  const rich=styleRichText(richTextFromNative(base),0,5,{fontSize:36,italic:true,underline:true});
  const content={...textBoxContent(base),fontSize:36,richText:rich};
  const result=transformedTextBox(content,base,{...base,width:200,height:60},'se');
  assert.deepEqual(result.content.richText!.runs.map(run=>run.style.fontSize),[72,48]);
  assert.equal(result.content.richText!.runs[0].style.italic,true);
  assert.deepEqual(result.content.richText!.paragraphs,rich.paragraphs);
  assert.equal(result.content.originalText,base.originalText);assert.equal(result.geometry.width/result.geometry.height,base.width/base.height);
});
test('rich side wrapping changes neither authored spans nor paragraph alignment',()=>{
  const previous=globalThis.document;
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({getContext:()=>({measureText:()=>({width:10})})})}});
  try{
    const rich=richTextFromNative(base),content={...textBoxContent(base),richText:rich};
    const result=transformedTextBox(content,base,{...base,width:30},'w');
    assert.deepEqual(result.content.richText,rich);assert.equal(result.content.fontSize,base.fontSize);
    assert.ok(result.geometry.height>base.height);assert.equal(result.geometry.x+result.geometry.width,base.x+base.width);
  }finally{if(previous)Object.defineProperty(globalThis,'document',{configurable:true,value:previous});else delete (globalThis as {document?:Document}).document;}
});
test('native patches retain provenance and material binding; resize never invokes drop rebinding',()=>{
  const page={id:'page',type:'rectangle',x:0,y:0,width:100,height:100,angle:0,customData:{materialKind:'interactive-html'}} as any;
  const result=transformRoomAnnotation(base,[page,base],{...base,width:500,textHandle:'se'})[0].updated;
  assert.deepEqual(result.groupIds,base.groupIds);assert.equal((result.customData?.interactiveHtmlScrollAnchor as any).materialId,'page');
  const patch=textBoxTransformPatch(base,base,{...base,width:200},'se');
  assert.equal(patch.originalText,base.originalText);assert.equal(patch.fontSize,48);
  assert.equal('groupIds' in patch,false);
});
test('Room validates the text handle and rejects its use on other object types',()=>{
  const command={type:'object-edit',channel:'room',generation:1,revision:1,target:{mode:'free',id:null},action:'transform',
    objects:[{id:'public_1',version:1}],geometry:{...base,textHandle:'e'}};
  assert.equal(validRoomObjectCommand(command),true);
  assert.equal(validRoomObjectCommand({...command,geometry:{...base,textHandle:'n'}}),false);
  assert.throws(()=>transformRoomAnnotation({...base,type:'rectangle'} as any,[],{...base,textHandle:'e'}),/Textgriff/);
  assert.throws(()=>transformRoomAnnotation({...base,locked:true},[],{...base,textHandle:'e'}),/gesperrt/);
});
