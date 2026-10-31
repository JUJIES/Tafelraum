import test from 'node:test';
import {imageAnnotationGroupId} from './image-annotation-selection.ts';
import assert from 'node:assert/strict';
import {automaticTextColor, sampledBackgroundColor, canvasBackgroundAtPoint, annotationColorFollowsCanvas} from './text-background-color.ts';

test('neutral text adapts to paper and dark backgrounds; explicit accent colours stay intact',()=>{
 assert.equal(automaticTextColor('#f4f3ef','#ffffff'),'#111111');
 assert.equal(automaticTextColor('#1b222b','#1c222b'),'#fffdf8');
 assert.equal(automaticTextColor('#111111','#000000'),'#fffdf8');
 assert.equal(automaticTextColor('#a84f4b','#ffffff'),'#a84f4b');
});
test('background patch ignores minority printed ink and composites transparent image pixels',()=>{
 const patch=new Uint8ClampedArray([0,0,0,255,255,255,255,255,255,255,255,255]);
 assert.equal(sampledBackgroundColor(patch,'#1c222b'),'#ffffff');
 assert.equal(sampledBackgroundColor([0,0,0,0],'#1c222b'),'#1c222b');
 assert.equal(sampledBackgroundColor([],'#f4f3ef'),'#f4f3ef');
});
test('renderer sampling maps CSS coordinates to backing pixels and falls back on unavailable/security errors',()=>{
 let requested: number[]=[];
 const canvas={width:400,height:200,getBoundingClientRect:()=>({left:20,top:10,right:220,bottom:110,width:200,height:100}),
  getContext:()=>({getImageData:(...args:number[])=>{requested=args;return {data:new Uint8ClampedArray([255,255,255,255])};}})} as unknown as HTMLCanvasElement;
 assert.equal(canvasBackgroundAtPoint(canvas,120,60,'#1c222b'),'#ffffff');assert.deepEqual(requested,[184,84,33,33]);
 assert.equal(canvasBackgroundAtPoint(canvas,0,0,'#1c222b'),'#1c222b');
 assert.equal(canvasBackgroundAtPoint(null,0,0,'#1c222b'),'#1c222b');
 canvas.getContext=()=>{throw Error('SecurityError');};
 assert.equal(canvasBackgroundAtPoint(canvas,120,60,'#1c222b'),'#1c222b');
});

test('material and shape binding protects neutral annotation colour across theme changes and reload',()=>{
 assert.equal(annotationColorFollowsCanvas({type:'text',containerId:null,groupIds:[]}),true);
 assert.equal(annotationColorFollowsCanvas({type:'text',containerId:'shape',groupIds:[]}),false);
 assert.equal(annotationColorFollowsCanvas({type:'text',groupIds:[imageAnnotationGroupId('sheet')]}),false);
 assert.equal(annotationColorFollowsCanvas({type:'line',groupIds:[imageAnnotationGroupId('sheet')]}),true);
});

 test('pen annotations keep material contrast while free ink still follows the theme; markers are unchanged',()=>{
  assert.equal(annotationColorFollowsCanvas({type:'freedraw',customData:{role:'ink-pen'},groupIds:[imageAnnotationGroupId('sheet')]}),false);
  assert.equal(annotationColorFollowsCanvas({type:'freedraw',customData:{role:'ink-pen'},groupIds:[]}),true);
  assert.equal(annotationColorFollowsCanvas({type:'line',customData:{role:'marker-ribbon'},groupIds:[imageAnnotationGroupId('sheet')]}),true);
 });
