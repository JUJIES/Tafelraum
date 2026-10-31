import {useLayoutEffect,useRef} from 'react';
import {layoutRichText,paintRichText} from './rich-text';
import type {TextBoxContent} from './text-box-transform';
import type {TextBoxFrame} from './text-box-geometry';

/** Same layout and painter as the canonical rich-text rendition. Room uses
 * only this disposable view until the host confirms the new native source. */
export function RichTextCanvasPreview({content,frame,sceneWidth}:{content:TextBoxContent;frame:TextBoxFrame;sceneWidth:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  useLayoutEffect(()=>{
    if(!canvas.current||!content.richText)return;
    const layout=layoutRichText(content.richText,sceneWidth,!content.autoResize,content.lineHeight);
    const scale=Math.min(2,window.devicePixelRatio||1)*frame.width/Math.max(1,layout.width);
    canvas.current.width=Math.max(1,Math.ceil(layout.width*scale));canvas.current.height=Math.max(1,Math.ceil(layout.height*scale));
    const context=canvas.current.getContext('2d');if(!context)return;
    context.scale(scale,scale);paintRichText(context,layout,content.lineHeight);
  },[content,frame.width,frame.height,sceneWidth]);
  return <canvas ref={canvas} aria-hidden style={{position:'absolute',left:frame.centerX,top:frame.centerY,width:frame.width,height:frame.height,
    transform:`translate(-50%,-50%) rotate(${frame.angle}rad)`,pointerEvents:'none'}}/>;
}
