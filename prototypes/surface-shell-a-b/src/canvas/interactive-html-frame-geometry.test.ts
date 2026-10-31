import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeInteractiveHtmlFrameGeometry } from './interactive-html-frame-geometry.ts';
import { imageCoverRectToScene, rememberImageCover, recallImageCover } from './image-cover.ts';
const frame = (angle=0) => ({id:'html',x:100,y:200,width:500,height:748,angle,version:1,versionNonce:5,customData:{materialKind:'interactive-html'}});
function world(e:ReturnType<typeof frame>, y:number) {
  return {x:e.x+e.width/2-Math.sin(e.angle)*(y-e.height/2),y:e.y+e.height/2+Math.cos(e.angle)*(y-e.height/2)};
}
test('fits native bounds to the existing visible document without moving rotated content or annotations',()=>{
  for(const angle of [0,Math.PI/2,Math.PI/6,Math.PI]) {
    const original=frame(angle);
    const annotation={...original,id:'ink',customData:{role:'pen'}};
    const result=normalizeInteractiveHtmlFrameGeometry([original,annotation]);
    assert.equal(result[0].height,700);
    const before=world(original,48),after=world(result[0],0);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-9);
    assert.equal(result[1],annotation);
    assert.equal(normalizeInteractiveHtmlFrameGeometry(result),result);
  }
});
test('remaps partial covers and remembered covers without changing their visible scene area',()=>{
  const rect={x:.1,y:.3,width:.7,height:.5};
  const original={...frame(Math.PI/6),customData:rememberImageCover(frame().customData,rect,'right')};
  const cover={...original,...imageCoverRectToScene(original,rect),id:'cover',customData:{role:'image-cover',imageId:'html',coverRect:rect}};
  const result=normalizeInteractiveHtmlFrameGeometry([original,cover]);
  for(const key of ['x','y','width','height'] as const)assert.ok(Math.abs(result[1][key]-cover[key])<1e-9);
  const memory=recallImageCover(result[0]);
  assert.deepEqual(memory?.rect,result[1].customData.coverRect);
});
test('full and legacy geometry-only covers match the smaller sheet',()=>{
  for(const stored of [true,false]){
    const original=frame();
    const cover={...original,id:'cover',customData:{role:'image-cover',imageId:'html',...(stored?{coverRect:{x:0,y:0,width:1,height:1}}:{})}};
    const result=normalizeInteractiveHtmlFrameGeometry([original,cover]);
    assert.equal(result[1].height,700);
    assert.equal(result[1].y,248);
  }
});
test('leaves unrelated elements and already normalized HTML unchanged',()=>{
  for(const customData of [{materialKind:'image'},{materialKind:'interactive-html',interactiveHtmlFrameLayout:'content'}]){
    const elements=[{...frame(),customData}];assert.equal(normalizeInteractiveHtmlFrameGeometry(elements),elements);
  }
});

test('positions a constrained top action row above the exterior HTML controls',async()=>{
  const {getInteractiveHtmlControlsBounds}=await import('./interactive-html-frame-geometry.ts');
  const {getImageQuickActionLayout}=await import('./image-quick-actions.ts');
  const obstacle=getInteractiveHtmlControlsBounds(550,540,460,660,0,1);
  const layout=getImageQuickActionLayout({actionCount:5,angle:0,buttonSize:32,centerX:550,centerY:540,gap:8,height:660,width:460,
    viewportWidth:1280,viewportHeight:610,obstacles:[obstacle],sideInsets:{top:70}});
  for(const point of layout.points)assert.ok(point.x+16<=obstacle.left || point.x-16>=obstacle.right || point.y+16<=obstacle.top || point.y-16>=obstacle.bottom);
});

import {interactiveHtmlControlsPosition} from './interactive-html-frame-geometry.ts';
test('material actions remain in the viewport for offscreen corners, zoom, rotation and resize',()=>{
 for(const width of [320,800,1600])for(const height of [240,700])for(const angle of [0,Math.PI/4,Math.PI])
 for(const centerX of [-2000,400,3000])for(const centerY of [-1800,300,2400]){
  const p=interactiveHtmlControlsPosition({centerX,centerY,width:2400,height:3400,angle,viewportWidth:width,viewportHeight:height},200);
  assert.ok(p.left>=8&&p.top>=8);assert.ok(p.left+200<=width-8&&p.top+56<=height-8);
 }
});
test('visible material actions retain their normal corner anchor',()=>{
 assert.deepEqual(interactiveHtmlControlsPosition({centerX:400,centerY:400,width:300,height:400,angle:0,viewportWidth:1000,viewportHeight:800},56),{left:494,top:136});
});
test('clamped material controls avoid history, toolbar and material drawer',()=>{
 const frame={centerX:1300,centerY:-300,width:2400,height:3400,angle:0,viewportWidth:1137,viewportHeight:800};
 const occupied=[{left:1015,top:18,width:104,height:48},{left:0,top:710,width:1137,height:90},{left:813,top:100,width:324,height:600}];
 for(const width of [56,200]){
  const p=interactiveHtmlControlsPosition(frame,width,56,occupied);
  assert.ok(p.left>=8&&p.top>=8&&p.left+width<=1129&&p.top+56<=792);
  assert.ok(occupied.every(r=>p.left+width<=r.left||p.left>=r.left+r.width||p.top+56<=r.top||p.top>=r.top+r.height));
 }
});


test('registered app migration keeps rotated content, ink and partial covers fixed and is idempotent',()=>{
  for(const angle of [0,Math.PI/6,Math.PI/2]) {
    const original={...frame(angle),customData:{surfaceKind:'embedded-app',embeddedAppId:'lerndeck',embeddedAppContentZoom:1.3}};
    const rect={x:.1,y:.3,width:.7,height:.5};
    const cover={...original,...imageCoverRectToScene(original,rect),id:'cover',customData:{role:'image-cover',imageId:original.id,coverRect:rect}};
    const ink={...original,id:'ink',customData:{role:'pen'}};
    const result=normalizeInteractiveHtmlFrameGeometry([original,cover,ink]);
    const before=world(original,48),after=world(result[0],0);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-9);
    assert.equal(result[0].height,700);
    assert.equal(result[0].customData.embeddedAppContentZoom,1.3);
    for(const key of ['x','y','width','height'] as const)assert.ok(Math.abs(result[1][key]-cover[key])<1e-9);
    assert.equal(result[2],ink);
    assert.equal(normalizeInteractiveHtmlFrameGeometry(result),result);
  }
});
