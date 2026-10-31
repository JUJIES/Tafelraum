import assert from 'node:assert/strict';
import test, {mock} from 'node:test';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';

mock.module('@excalidraw/excalidraw',{namedExports:{
  newElementWith:(element:ExcalidrawElement,patch:Partial<ExcalidrawElement>)=>({...element,...patch,version:element.version+1}),
}});
const {validRoomObjectCommand,roomObjectAtPoint,roomObjectsAlongEraser,transformRoomBundle}=await import('./room-object-edit.ts');
const base={type:'object-edit',channel:'room',generation:1,revision:5,target:{mode:'free',id:null},
  action:'transform',objects:[{id:'public_1',version:3}],geometry:{x:10,y:20,width:100,height:80,angle:0.5}};

test('Room object commands require a current bounded gesture',()=>{
  assert.equal(validRoomObjectCommand(base),true);
  assert.equal(validRoomObjectCommand({...base,geometry:{...base.geometry,width:-1}}),false);
  assert.equal(validRoomObjectCommand({...base,geometry:{...base.geometry,angle:Infinity}}),false);
  assert.equal(validRoomObjectCommand({...base,objects:[{id:'../native',version:3}]}),false);
  assert.equal(validRoomObjectCommand({...base,revision:0}),false);
  assert.equal(validRoomObjectCommand({...base,action:'erase',geometry:undefined}),true);
  assert.equal(validRoomObjectCommand({...base,action:'erase'}),false);
});

test('touch hit testing honors rotation and the frontmost visible object',()=>{
  const lower={id:'a',version:1,type:'rectangle' as const,x:0,y:0,width:100,height:20,angle:0,erasable:true};
  const upper={...lower,id:'b',angle:Math.PI/2};
  assert.equal(roomObjectAtPoint([lower,upper],{x:10,y:10},0)?.id,'a');
  assert.equal(roomObjectAtPoint([lower,upper],{x:50,y:50},0)?.id,'b');
});

test('eraser hit testing follows a drawn path instead of its empty bounding box',()=>{
  const stroke={id:'ink',version:1,type:'freedraw' as const,x:0,y:0,width:100,height:100,
    angle:0,erasable:true,path:[[0,0],[100,100]] as [number,number][],strokeWidth:3};
  assert.equal(roomObjectAtPoint([stroke],{x:50,y:50},4)?.id,'ink');
  assert.equal(roomObjectAtPoint([stroke],{x:10,y:90},4),null);
});

test('Room marker hit testing uses its filled ribbon, including rotation',()=>{
  const marker={id:'marker',version:1,type:'line' as const,x:0,y:0,width:120,height:120,
    angle:0,erasable:true,markerRibbon:true,path:[[0,0],[100,100],[120,100],[120,120],[100,120],[100,100],[0,0]] as [number,number][]};
  assert.equal(roomObjectAtPoint([marker],{x:50,y:50},4),null);
  assert.equal(roomObjectAtPoint([marker],{x:110,y:110},4)?.id,'marker');
  assert.equal(roomObjectAtPoint([{...marker,angle:Math.PI/2}],{x:10,y:110},4)?.id,'marker');
  assert.equal(roomObjectAtPoint([{...marker,angle:Math.PI/2}],{x:70,y:50},4),null);
});

test('moving a material also moves its attached annotation and can rotate it',()=>{
  const material={id:'image',type:'image',version:1,isDeleted:false,x:0,y:0,width:100,height:100,
    angle:0,groupIds:['tafelraum-image-annotations:image'],customData:{}} as ExcalidrawElement;
  const ink={id:'ink',type:'freedraw',version:1,isDeleted:false,x:10,y:20,width:10,height:10,
    angle:0,points:[[0,0],[10,10]],groupIds:['tafelraum-image-annotations:image'],customData:{}} as ExcalidrawElement;
  const changes=transformRoomBundle(material,[material,ink],{x:100,y:50,width:200,height:200,angle:Math.PI/2});
  assert.equal(changes.length,2);
  assert.equal(changes[0].updated.x,100);
  assert.equal(changes[1].updated.width,20);
  assert.equal(changes[1].updated.angle,Math.PI/2);
});


test('fast eraser sweeps hit intervening and overlapping ink but preserve material',()=>{
  const stroke={id:'ink',version:1,type:'freedraw' as const,x:45,y:0,width:1,height:100,
    angle:0,erasable:true,path:[[0,0],[0,100]] as [number,number][],strokeWidth:2};
  const upper={...stroke,id:'upper'};
  const material={...stroke,id:'material',erasable:false};
  assert.deepEqual(new Set(roomObjectsAlongEraser([stroke,upper,material],{x:0,y:50},{x:100,y:50},12).map(object=>object.id)),new Set(['ink','upper']));
  assert.equal(roomObjectsAlongEraser([stroke],{x:0,y:150},{x:100,y:150},12).length,0);
});


test('shared paper geometry rejects deformation while preserving canonical provenance',async()=>{
  const {htmlPagePlacement}=await import('../canvas/interactive-html-pages.ts');
  const size=htmlPagePlacement('portrait');
  const page={id:'page',type:'rectangle',x:10,y:20,...size,angle:0,version:1,groupIds:[],isDeleted:false,
    customData:{materialKind:'interactive-html',interactiveHtmlPageOrientation:'portrait',sourceEntry:'pages.html'}} as unknown as ExcalidrawElement;
  const enlarged=transformRoomBundle(page,[page],{x:5,y:10,width:size.width*2,height:size.height*2,angle:.2})[0].updated;
  assert.deepEqual(enlarged.customData,page.customData);
  assert.equal(enlarged.width,size.width*2);
  assert.throws(()=>transformRoomBundle(page,[page],{x:10,y:20,width:size.width/2,height:size.height,angle:0}),/proportional/);
  const {normalizeHtmlPageFrames}=await import('../canvas/material-transform.ts');
  assert.equal(normalizeHtmlPageFrames([page])[0],page);
  const squeezed={...page,width:page.width/2};
  const normalized=normalizeHtmlPageFrames([squeezed])[0];
  assert.ok(Math.abs(normalized.width/normalized.height-210/297)<1e-9);
});

const {transformRoomAnnotation,visibleRoomObject}=await import('./room-object-edit.ts');
const {withTemporaryEraserState,withoutTemporaryEraserState}=await import('../canvas/eraser-policy.ts');
const {RoomActionHistory}=await import('./room-history.ts');
const {previewRoomAnnotation,hideRoomAnnotations}=await import('./room-object-preview.ts');
const annotationGroup='tafelraum-image-annotations:page';
const page={id:'page',type:'rectangle',version:1,isDeleted:false,locked:false,x:0,y:0,width:100,height:200,angle:0,
  groupIds:[annotationGroup],customData:{materialKind:'interactive-html'}} as ExcalidrawElement;
for(const kind of ['text','pen','marker'] as const){
 const item={id:kind,type:kind==='text'?'text':kind==='pen'?'freedraw':'line',version:1,isDeleted:false,locked:false,
  x:20,y:20,width:20,height:10,angle:0,fontSize:20,text:'word',points:[[0,0],[20,10]],
  groupIds:[annotationGroup],customData:{role:kind==='marker'?'marker-ribbon':'ink-pen',interactiveHtmlScrollAnchor:{materialId:'page',x:0,y:0}}} as ExcalidrawElement;
 test(`${kind}: Room transforms retain, detach, reattach and undo binding together`,()=>{
   const offsets=new Map([['page',{x:0,y:50}]]);
   const inner=transformRoomAnnotation(item,[page,item],{...item,x:30,y:20},offsets)[0].updated;
   assert.deepEqual(inner.groupIds,[annotationGroup]);assert.equal((inner.customData?.interactiveHtmlScrollAnchor as any).y,50);
   const out=transformRoomAnnotation(inner,[page,inner],{...inner,x:130},offsets)[0].updated;
   assert.deepEqual(out.groupIds,[]);assert.equal(out.customData?.interactiveHtmlScrollAnchor,undefined);
   const back=transformRoomAnnotation(out,[page,out],{...out,x:20},offsets)[0].updated;
   assert.deepEqual(back.groupIds,[annotationGroup]);
   const history=new RoomActionHistory();history.recordChanges([{before:out,after:back}]);
   const engine=withTemporaryEraserState([page,back]);
   const undo=history.apply('undo',withoutTemporaryEraserState(engine))!;
   assert.deepEqual(undo.find(e=>e.id===kind)!.groupIds,[]);
   const redo=history.apply('redo',withoutTemporaryEraserState(withTemporaryEraserState(undo)))!;
   assert.deepEqual(redo.find(e=>e.id===kind)!.groupIds,[annotationGroup]);
   assert.ok(!JSON.stringify(withoutTemporaryEraserState(withTemporaryEraserState(redo))).includes('tafelraumEraser'));
 });
 test(`${kind}: a Room page move uses its canonical bundle while teacher eraser is active`,()=>{
   const engine=withTemporaryEraserState([page,item]);
   const canonical=withoutTemporaryEraserState(engine);
   const changes=transformRoomAnnotation(canonical[0],canonical,{...page,x:100});
   assert.equal(changes.length,2);assert.equal(changes[1].updated.x,120);
   const native=withTemporaryEraserState(changes.map(change=>change.updated));
   assert.equal(native[1].version,changes[1].updated.version);
   const saved=withoutTemporaryEraserState(native);
   assert.equal(saved[1].locked,false);assert.deepEqual(saved[1].groupIds,[annotationGroup]);
 });
}
test('Room rejects true locks and forged or unbounded local scroll data',()=>{
 assert.throws(()=>transformRoomAnnotation({...page,locked:true},[page],{...page,x:10}),/gesperrt/);
 for(const htmlScroll of [[{materialId:'page',offset:{x:-1,y:0}}],[{materialId:'page',offset:{x:NaN,y:0}}],new Array(65).fill({materialId:'page',offset:{x:0,y:0}})])
  assert.equal(validRoomObjectCommand({...base,htmlScroll}),false);
 assert.equal(validRoomObjectCommand({...base,htmlScroll:[{materialId:'page',offset:{x:0,y:200}}]}),true);
});
test('Room hit geometry follows its own rotated HTML scroll, including paper scale',()=>{
 const material={...page,roomLocalId:'page',roomContentZoom:1,roomPageOrientation:null};
 const object={id:'ink',version:1,type:'freedraw',x:20,y:100,width:20,height:10,angle:0,erasable:true,
  annotation:{materialId:'page',scrollAnchor:{x:0,y:0}}};
 const visible=visibleRoomObject(object as any,[material as any],new Map([['page',{x:0,y:80}]]));
 assert.equal(visible.y,20);assert.equal(object.y,100);
 const rotated=visibleRoomObject(object as any,[{...material,angle:Math.PI/2} as any],new Map([['page',{x:0,y:80}]]));
 assert.ok(Math.abs(rotated.x-100)<1e-8);assert.ok(Math.abs(rotated.y-100)<1e-8);
});
test('Room annotation preview uses both existing render surfaces and disappears on rollback',()=>{
 const renderElement={id:'ink',type:'line',x:20,y:20,width:20,height:10,angle:0,points:[[0,0],[20,10]],opacity:40,strokeColor:'#ff0',backgroundColor:'#ff0',strokeWidth:0,version:2};
 const object={...renderElement,erasable:true,markerRibbon:true,annotation:{materialId:'page'},renderElement};
 const material={...page,instanceId:'html',roomLocalId:'page',annotations:[{kind:'stroke',roomObjectId:'ink',points:[]} ]};
 const scene={generation:1,revision:2,elements:[],materials:[material],assetIds:[],viewport:{x:0,y:0,width:800,height:600},background:'#fff'};
 const draft=previewRoomAnnotation(scene as any,{object:object as any,geometry:{...object,x:90},revision:5},new Map());
 assert.equal(draft.elements.length,1);assert.equal(draft.elements[0].x,90);assert.equal(draft.elements[0].version,7);
 assert.equal((draft.materials![0].annotations as any[]).filter(a=>a.roomObjectId==='ink').length,1,'old annotation replaced, never duplicated');
 assert.equal((scene.materials[0].annotations as any[])[0].points.length,0,'confirmed scene untouched');
 const erased=hideRoomAnnotations(draft,new Set(['ink']));
 assert.equal(erased.elements.length,0);assert.equal(erased.materials![0].annotations!.length,0);
 assert.equal(previewRoomAnnotation(scene as any,null,new Map()),scene);
});

test('horizontal and vertical pen strokes remain movable without inventing area',()=>{
 for(const [width,height] of [[0,20],[20,0]]){
  const ink={...page,id:'pen',type:'freedraw',width,height,points:[[0,0],[width,height]],customData:{role:'ink-pen'}} as ExcalidrawElement;
  const next={...ink,x:150};assert.equal(validRoomObjectCommand({...base,geometry:next}),true);
  const moved=transformRoomAnnotation(ink,[page,ink],next)[0].updated;
  assert.equal(moved.width,width);assert.equal(moved.height,height);assert.deepEqual(moved.groupIds,[]);
 }
 assert.throws(()=>transformRoomAnnotation(page,[page],{...page,width:0}),/Objektgröße/);
});


test('Room text preview replaces its derived bitmap without deleting unrelated material',()=>{
 const renderElement={id:'text-public',type:'text',x:20,y:20,width:120,height:30,angle:0,fontSize:24,text:'Rich text',strokeColor:'transparent',version:2};
 const object={...renderElement,erasable:false,annotation:{},renderElement,renderElementIds:['text-public','rich-raster']};
 const raster={id:'rich-raster',type:'image',x:20,y:20,width:120,height:30};
 const other={...raster,id:'unrelated-image'};
 const scene={generation:1,revision:2,elements:[renderElement,raster,other],materials:[],assetIds:[],viewport:{x:0,y:0,width:800,height:600},background:'#fff'};
 const draft=previewRoomAnnotation(scene as any,{object:object as any,geometry:{x:40,y:60,width:240,height:60,angle:0},revision:3},new Map());
 assert.deepEqual(draft.elements.map(item=>item.id),['unrelated-image','text-public']);
 assert.equal(draft.elements[1].x,40);assert.equal(draft.elements[1].fontSize,48);
 assert.equal(scene.elements.length,3,'confirmed projection remains available for cancellation');
 assert.equal(previewRoomAnnotation(scene as any,null,new Map()),scene);
});
