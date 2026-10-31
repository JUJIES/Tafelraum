import assert from 'node:assert/strict';
import {test} from 'node:test';
import {visibleTrail,withinClip} from './laser-trail.ts';
import {boundedCamera,recallCamera} from './viewer-camera.ts';
import {parseClientMessage} from '../../../../shared/live-canvas/protocol.ts';

test('recall approaches full clip continuously without escaping bounds',()=>{
  const clip={x:150,y:250,width:300,height:600};
  const start={width:820,height:1180,scrollX:-150,scrollY:-250,zoom:{value:4}};
  let last=start.zoom.value;
  for(let i=0;i<=100;i++) {const next=recallCamera(start,clip,i/100);assert.ok(next.zoom.value<=last+1e-8);last=next.zoom.value;assert.deepEqual(boundedCamera({...start,...next},clip),next);}
  const end=recallCamera(start,clip,1), expected=boundedCamera(start,clip,true);
  assert.ok(Math.abs(end.zoom.value-expected.zoom.value)<1e-8);assert.ok(Math.abs(end.scrollX-expected.scrollX)<1e-8);
});
test('ephemeral trails expire while annotation trails briefly survive and buffers stay bounded',()=>{
  const point={x:0,y:0,at:0,stroke:0,style:'comet' as const,pressed:false};
  assert.equal(visibleTrail([point,{...point,pressed:true}],500).length,1);
  assert.equal(visibleTrail([point,{...point,pressed:true}],1300).length,0);
  assert.equal(visibleTrail(Array.from({length:1000},()=>point),100).length,180);
});
test('laser styles and clip boundary are explicit; private properties never enter wire',()=>{
  const pointer={x:20,y:30,tool:'laser' as const,style:'spark',color:'#e39722',pressed:true};
  const parsed=parseClientMessage({type:'pointer',generation:1,pointer:{...pointer,archivePath:'secret'}});
  assert.deepEqual(parsed,{type:'pointer',generation:1,pointer});
  assert.throws(()=>parseClientMessage({type:'pointer',generation:1,pointer:{...pointer,style:'arbitrary-script'}}));
  assert.equal(withinClip({...pointer,style:'spark'},{x:0,y:0,width:100,height:100}),true);
  assert.equal(withinClip({...pointer,x:200,style:'spark'},{x:0,y:0,width:100,height:100}),false);
});
