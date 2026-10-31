import assert from 'node:assert/strict';
import test from 'node:test';
import {textBoxResizeHandles,textBoxHandlePosition,textBoxHandleAtPoint,anchoredTextBoxGeometry,draggedTextBoxGeometry,textBoxHandleCursor} from './text-box-geometry.ts';

const base={x:50,y:80,width:160,height:210,angle:0};
test('six text grips separate proportional size from width; no vertical midpoint grips',()=>{
  assert.deepEqual(textBoxResizeHandles,['nw','ne','sw','se','w','e']);
});
test('48px grip targets accept an imprecise trackpad start at every zoom',()=>{
  for(const zoom of [.25,.8,1,2,4]){
    const frame={centerX:300,centerY:220,width:base.width*zoom,height:base.height*zoom,angle:0};
    const grip=textBoxHandlePosition(frame,'se');
    assert.equal(textBoxHandleAtPoint(frame,{x:grip.x+20,y:grip.y+20}),'se');
    assert.equal(textBoxHandleAtPoint(frame,{x:grip.x+25,y:grip.y+25}),null);
  }
});
test('overlapping targets choose the nearest side and preserve the body of small text',()=>{
  for(const size of [12,20,40]){
    const frame={centerX:100,centerY:100,width:size,height:size,angle:0};
    assert.equal(textBoxHandleAtPoint(frame,{x:100,y:100}),null);
    assert.equal(textBoxHandleAtPoint(frame,textBoxHandlePosition(frame,'e')),'e');
    assert.equal(textBoxHandleAtPoint(frame,textBoxHandlePosition(frame,'ne')),'ne');
  }
});
test('top and bottom midpoint are not resize targets on normal text',()=>{
  const frame={centerX:300,centerY:220,width:200,height:80,angle:0};
  assert.equal(textBoxHandleAtPoint(frame,{x:300,y:180}),null);
  assert.equal(textBoxHandleAtPoint(frame,{x:300,y:260}),null);
});
const corner=(box:typeof base,x:number,y:number)=>({x:box.x+box.width/2+x*box.width/2*Math.cos(box.angle)-y*box.height/2*Math.sin(box.angle),
  y:box.y+box.height/2+x*box.width/2*Math.sin(box.angle)+y*box.height/2*Math.cos(box.angle)});
test('all proportional corners keep the opposite corner fixed when rotated',()=>{
  for(const angle of [0,.4,Math.PI/2,-Math.PI/3])for(const handle of ['nw','ne','sw','se'] as const){
    const original={...base,angle},next=anchoredTextBoxGeometry(original,handle,240,315);
    const x=handle.includes('w')?1:-1,y=handle.includes('n')?1:-1;
    const before=corner(original,x,y),after=corner(next,x,y);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-8);
    assert.equal(next.width/next.height,original.width/original.height);
  }
});
test('width changes and reflow keep the opposite top edge fixed when rotated',()=>{
  for(const angle of [0,.4,Math.PI/2])for(const handle of ['w','e'] as const){
    const original={...base,angle},next=anchoredTextBoxGeometry(original,handle,80,420);
    const before=corner(original,handle==='w'?1:-1,-1),after=corner(next,handle==='w'?1:-1,-1);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-8);
  }
});
test('starting beside a grip uses only gesture delta, never snaps to pointer position',()=>{
  assert.deepEqual(draggedTextBoxGeometry(base,'se',{x:0,y:0}),base);
  const next=draggedTextBoxGeometry(base,'se',{x:80,y:105});
  assert.equal(next.width,240);assert.equal(next.height,315);assert.equal(next.x,base.x);assert.equal(next.y,base.y);
});
test('cursor follows the actual rotated grip direction',()=>{
  assert.equal(textBoxHandleCursor('e',0),'ew-resize');
  assert.equal(textBoxHandleCursor('e',Math.PI/2),'ns-resize');
  assert.equal(textBoxHandleCursor('ne',Math.PI/4),'ew-resize');
});
