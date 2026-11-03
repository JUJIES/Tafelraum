import assert from 'node:assert/strict';
import test from 'node:test';
import {shapeShadowRegion} from './shape-shadow-region.ts';
test('a huge zoomed shape has a viewport-sized filter, not a shape-sized bitmap',()=>{
 const r=shapeShadowRegion({centerX:700,centerY:450,width:30000,height:20000,angle:0},{width:1400,height:900});
 assert.equal(r.width,1496);assert.equal(r.height,996);
});
test('an ordinary fully visible shape keeps the full blur support',()=>{
 assert.deepEqual(shapeShadowRegion({centerX:400,centerY:300,width:200,height:100,angle:0},{width:1400,height:900}),{x:-48,y:-48,width:296,height:196});
});
test('fully offscreen shadows do not allocate a filter',()=>{
 const r=shapeShadowRegion({centerX:-2000,centerY:-2000,width:200,height:100,angle:0},{width:1400,height:900});
 assert.equal(r.width,0);assert.equal(r.height,0);
});
test('rotation conservatively covers all viewport corners with blur padding',()=>{
 const f={centerX:700,centerY:450,width:30000,height:20000,angle:Math.PI/4};
 const r=shapeShadowRegion(f,{width:1400,height:900});
 for(const [x,y] of [[0,0],[1400,0],[0,900],[1400,900]]){
  const dx=x-f.centerX,dy=y-f.centerY,c=Math.cos(f.angle),s=Math.sin(f.angle);
  const px=dx*c+dy*s+f.width/2,py=-dx*s+dy*c+f.height/2;
  assert.ok(px>=r.x+47.99&&px<=r.x+r.width-47.99);
  assert.ok(py>=r.y+47.99&&py<=r.y+r.height-47.99);
 }
 assert.ok(r.width<1800&&r.height<1800);
});
