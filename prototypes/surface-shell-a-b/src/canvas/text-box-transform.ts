import * as engine from '@excalidraw/excalidraw';
import type {ExcalidrawTextElement} from '@excalidraw/excalidraw/element/types';
import {layoutRichText,readRichText,rebaseRichText,scaleRichText,type RichText} from './rich-text.ts';
import {anchoredTextBoxGeometry,textBoxGeometry,type TextBoxGeometry,type TextBoxHandle} from './text-box-geometry.ts';

/** Only the existing text content/style projected to the local Room, never a
 * second document. The host always resolves the canonical native source. */
export type TextBoxContent=Pick<ExcalidrawTextElement,'text'|'originalText'|'fontSize'|'fontFamily'|'lineHeight'|'textAlign'|'autoResize'> & {richText?:RichText};
export function textBoxContent(element:ExcalidrawTextElement):TextBoxContent {
  const richText=readRichText(element.customData?.richText);
  return {text:element.text,originalText:element.originalText,fontSize:element.fontSize,fontFamily:element.fontFamily,
    lineHeight:element.lineHeight,textAlign:element.textAlign,autoResize:element.autoResize,...(richText?{richText}:{})};
}

export function transformedTextBox(content:TextBoxContent,base:TextBoxGeometry,next:TextBoxGeometry,handle:TextBoxHandle) {
  if(handle==='rotate')return {geometry:{...textBoxGeometry(base),angle:next.angle},content};
  if(handle!=='w'&&handle!=='e'){
    const sizes=content.richText?.runs.map(run=>run.style.fontSize)??[];
    const minimum=sizes.length?8/Math.min(...sizes):1/content.fontSize;
    const maximum=sizes.length?256/Math.max(...sizes):10_000/content.fontSize;
    const factor=Math.max(minimum,Math.min(maximum,next.width/Math.max(1,base.width)));
    const geometry=anchoredTextBoxGeometry(base,handle,base.width*factor,base.height*factor);
    return {geometry,content:{...content,fontSize:content.fontSize*factor,...(content.richText?{richText:scaleRichText(content.richText,factor)}:{})}};
  }
  const width=Math.max(16,Math.min(100_000,next.width));
  const richText=content.richText&&rebaseRichText(content.richText,content.originalText??content.text);
  let height:number,text:string;
  if(richText){
    const layout=layoutRichText(richText,width,true,content.lineHeight);
    height=layout.height;text=layout.lines.map(line=>line.chars.map(char=>char.value).join('')).join('\n');
  }else{
    // Public engine API reuses its native font metrics and wrapping rules.
    const measured=engine.restoreElements(engine.convertToExcalidrawElements([{...content,type:'text',x:0,y:0,width,height:base.height,
      text:content.originalText??content.text,containerId:null,autoResize:false}]).map(element=>({...element,width,autoResize:false})),null,{refreshDimensions:true,repairBindings:true})[0];
    if(measured.type!=='text')throw new Error('Textbreite konnte nicht geändert werden.');
    height=measured.height;text=measured.text;
  }
  return {geometry:anchoredTextBoxGeometry(base,handle,width,height),content:{...content,text,autoResize:false,...(richText?{richText}:{})}};
}

export function textBoxTransformPatch(element:ExcalidrawTextElement,base:TextBoxGeometry,next:TextBoxGeometry,handle:TextBoxHandle):Omit<Partial<ExcalidrawTextElement>,'index'> {
  const result=transformedTextBox(textBoxContent(element),base,next,handle);
  const {richText,...content}=result.content;
  return {...result.geometry,...content,customData:richText?{...element.customData,richText}:element.customData};
}
