import test from 'node:test';
import assert from 'node:assert/strict';
import {annotationAfterIndependentMove,independentAnnotationMovePatch} from './annotation-move.ts';
import {getMaterialBundleElements,translateMaterialBundleElements} from './material-bundle-drag.ts';
const group='tafelraum-image-annotations:sheet';
const sheet={id:'sheet',type:'rectangle',x:0,y:0,width:100,height:200,angle:0,customData:{materialKind:'interactive-html'}};
const text={id:'text',type:'text',x:20,y:20,width:20,height:40,angle:0,groupIds:[group,'ordinary-group'],customData:{other:'kept',interactiveHtmlScrollAnchor:{materialId:'sheet',x:0,y:0}}};
test('independent movement inside retains binding and source remains unchanged',()=>{
 const moved={...text,x:60};assert.equal(annotationAfterIndependentMove(moved,[sheet,moved]),moved);
 const source=[{...sheet,groupIds:[group]},moved];
 const bundle=getMaterialBundleElements(source,'sheet',group);
 const translated=translateMaterialBundleElements(source,bundle,30,40,(e,x,y)=>({...e,x,y}));
 assert.equal(translated.find(e=>e.id==='text')?.x,90);
 assert.deepEqual(text.groupIds,[group,'ordinary-group']);
});
test('release outside removes only old material binding and scroll anchor',()=>{
 const moved={...text,x:120};const released=annotationAfterIndependentMove(moved,[sheet,moved]);
 assert.deepEqual(released.groupIds,['ordinary-group']);assert.deepEqual(released.customData,{other:'kept'});assert.equal(released.x,120);
});
test('release uses visible translated center and keeps position after scrolling',()=>{
 const moved={...text,y:220};assert.equal(annotationAfterIndependentMove(moved,[sheet],{x:0,y:-100}),moved);
 const released=annotationAfterIndependentMove(moved,[sheet],{x:0,y:30});assert.equal(released.y,250);assert.deepEqual(released.groupIds,['ordinary-group']);
});
test('rotated material bounds and unrelated objects',()=>{
 const rotated={...sheet,angle:Math.PI/2};const moved={...text,x:130,y:90};assert.equal(annotationAfterIndependentMove(moved,[rotated]),moved);
 const outside={...text,y:210};assert.notEqual(annotationAfterIndependentMove(outside,[rotated]),outside);
 const unbound={...text,x:500,groupIds:[]};assert.equal(annotationAfterIndependentMove(unbound,[sheet]),unbound);
});
test('deliberate return attaches free text, takes current scroll anchor and follows sheet movement',()=>{
 const outside=annotationAfterIndependentMove({...text,x:120},[sheet]);
 const returned=annotationAfterIndependentMove({...outside,x:20},[sheet],{x:0,y:0},new Map([['sheet',{x:0,y:180}]]));
 assert.deepEqual(returned.groupIds,['ordinary-group',group]);
 assert.deepEqual(returned.customData.interactiveHtmlScrollAnchor,{materialId:'sheet',x:0,y:180});
 assert.equal(returned.x,20);assert.equal(returned.y,text.y);
 const source=[{...sheet,groupIds:[group]},returned];
 const bundle=getMaterialBundleElements(source,'sheet',group);
 assert.equal(translateMaterialBundleElements(source,bundle,40,0,(e,x,y)=>({...e,x,y}))[1].x,60);
});
test('deliberate transfer picks the uppermost sheet and leaves only one material binding',()=>{
 const moved={...text,x:140};const other={...sheet,id:'other',x:100};
 const result=annotationAfterIndependentMove(moved,[sheet,{...other,id:'lower'},other]);
 assert.deepEqual(result.groupIds,['ordinary-group','tafelraum-image-annotations:other']);
 assert.equal(result.customData.interactiveHtmlScrollAnchor.materialId,'other');
});
test('material moving under untouched text creates no binding; deliberate ink drop does',()=>{
 const free={...text,groupIds:[]};const before=[sheet,free];
 assert.equal(getMaterialBundleElements(before,'sheet',group).some(e=>e.id===free.id),false);
 const ink={...free,type:'freedraw'};assert.deepEqual(annotationAfterIndependentMove(ink,[sheet]).groupIds,[group]);
});


test('drag positions share native/HTML visible coordinates without changing the gesture origin',()=>{
 const scroll={materialId:'sheet',x:20,y:180};
 const patch=independentAnnotationMovePatch(text,{x:70,y:-15},{x:-10,y:-100},scroll);
 assert.equal(patch.x,80); assert.equal(patch.y,-95);
 assert.deepEqual(patch.customData?.interactiveHtmlScrollAnchor,scroll);
 assert.equal(text.x,20); assert.deepEqual(text.customData.interactiveHtmlScrollAnchor,{materialId:'sheet',x:0,y:0});
 const next=independentAnnotationMovePatch(text,{x:80,y:-25},{x:-10,y:-100},scroll);
 assert.equal(next.x,patch.x+10);assert.equal(next.y,patch.y-10);
 const moved={...text,...next};
 const settled=annotationAfterIndependentMove(moved,[sheet,moved]);
 assert.equal(settled.x,next.x); assert.equal(settled.y,next.y);
});

test('free text movement leaves metadata and binding to the explicit drop',()=>{
 const free={...text,groupIds:[],customData:{other:'kept'}};
 const patch=independentAnnotationMovePatch(free,{x:5,y:10},{x:0,y:0});
 assert.deepEqual(patch,{x:25,y:30});
 assert.deepEqual(free.groupIds,[]);
});

for(const kind of ['text','pen','marker'] as const){
 const annotation={...text,groupIds:[group],type:kind==='text'?'text':kind==='pen'?'freedraw':'line',
   customData:{role:kind==='marker'?'marker-ribbon':'ink-pen',interactiveHtmlScrollAnchor:{materialId:'sheet',x:0,y:0}}};
 test(`${kind}: inside, detach, return and transfer use one binding rule`,()=>{
   assert.equal(annotationAfterIndependentMove(annotation,[sheet]),annotation);
   const detached=annotationAfterIndependentMove({...annotation,x:130},[sheet]);
   assert.deepEqual(detached.groupIds,[]);assert.equal(detached.customData.interactiveHtmlScrollAnchor,undefined);
   const returned=annotationAfterIndependentMove({...detached,x:20},[sheet],{x:0,y:0},new Map([['sheet',{x:0,y:90}]]));
   assert.deepEqual(returned.groupIds,[group]);assert.equal(returned.customData.interactiveHtmlScrollAnchor.y,90);
   const other={...sheet,id:'other',x:100};
   const transferred=annotationAfterIndependentMove({...annotation,x:140},[sheet,other]);
   assert.deepEqual(transferred.groupIds,['tafelraum-image-annotations:other']);
 });
}
test('ink belonging to a shape never acquires a second material owner',()=>{
 const ink={...text,type:'freedraw',groupIds:['tafelraum-shape-annotations:shape']};
 assert.equal(annotationAfterIndependentMove(ink,[sheet]),ink);
});
