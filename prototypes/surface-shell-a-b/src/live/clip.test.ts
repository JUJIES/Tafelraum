import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedCamera } from './viewer-camera.ts';
import { assignMaterialClip, readClipFrames, nextClipNumber } from '../canvas/clip-frames.ts';
import { parseClientMessage } from '../../../../shared/live-canvas/protocol.ts';

test('clip framing letterboxes portrait/landscape and zoomed navigation cannot leave bounds', () => {
  const clip = {x:100,y:200,width:600,height:850};
  for (const [width,height] of [[820,1180],[1180,820],[1600,900]]) {
    const state = {width,height,scrollX:0,scrollY:0,zoom:{value:1}};
    const fit = boundedCamera(state,clip,true);
    assert.ok(clip.width*fit.zoom.value <= width-23.99);
    assert.ok(clip.height*fit.zoom.value <= height-23.99);
    for (const delta of [-100000,100000]) {
      const camera = boundedCamera({...state,scrollX:delta,scrollY:delta,zoom:{value:5}},clip);
      assert.ok(-camera.scrollX >= clip.x && -camera.scrollX+width/5 <= clip.x+clip.width);
      assert.ok(-camera.scrollY >= clip.y && -camera.scrollY+height/5 <= clip.y+clip.height);
    }
    assert.deepEqual(boundedCamera({...state,zoom:{value:.00001}},clip),fit);
  }
});
test('host focus can reuse clip framing with the local canvas zoom ceiling', () => {
  const clip={x:240,y:360,width:80,height:60}, state={width:1200,height:800,scrollX:-900,scrollY:-700,zoom:{value:.4}};
  const focused=boundedCamera(state,clip,true,64,3);
  assert.equal(focused.zoom.value,3);
  assert.equal(state.width/(2*focused.zoom.value)-focused.scrollX,clip.x+clip.width/2);
  assert.equal(state.height/(2*focused.zoom.value)-focused.scrollY,clip.y+clip.height/2);
});
test('old lessons remain valid; clips preserve stable numbering and reject invalid geometry', () => {
  assert.deepEqual(readClipFrames(undefined),[]);
  const a = {id:'a',number:1,x:0,y:0,width:200,height:300};
  assert.deepEqual(readClipFrames(JSON.parse(JSON.stringify([a]))),[a]);
  assert.equal(nextClipNumber([a,{...a,id:'b',number:3}]),2);
  for (const patch of [{width:0},{x:Infinity},{number:0},{id:'../secret'}]) assert.throws(()=>readClipFrames([{...a,...patch}]));
  assert.throws(()=>readClipFrames([a,a]));
});
test('material clips share the numbered lesson sequence without duplicating material geometry', () => {
  const area = {id:'area',number:1,x:0,y:0,width:200,height:300};
  const material = {id:'material-clip',number:2,kind:'material',elementId:'image-1'};
  assert.deepEqual(readClipFrames(JSON.parse(JSON.stringify([area,material]))),[area,material]);
  assert.equal(nextClipNumber([area,material]),3);
  assert.throws(()=>readClipFrames([area,{...material,number:1}]));
  assert.throws(()=>readClipFrames([{...material,elementId:'../image'}]));
  assert.throws(()=>readClipFrames([{...material,kind:'video'}]));
});
test('one material owns one clip number, including old snapshots and reassignment onto an occupied slot', () => {
  const area = {id:'area',number:2,x:0,y:0,width:200,height:300};
  const first = {id:'first',number:1,kind:'material' as const,elementId:'image-1'};
  const legacy = {id:'later',number:4,kind:'material' as const,elementId:'image-1'};
  assert.deepEqual(readClipFrames([first,area,legacy]),[area,legacy]);
  assert.deepEqual(readClipFrames([legacy,area,first]),[legacy,area]);
  const moved = assignMaterialClip([first,area],'image-1','moved',2);
  assert.deepEqual(moved?.displaced,[first,area]);
  assert.deepEqual(moved?.clips,[{id:'moved',number:2,kind:'material',elementId:'image-1'}]);
  assert.deepEqual(assignMaterialClip([first,area],'image-1','unused')?.clips,[first,area]);
  assert.equal(assignMaterialClip([first,area],'image-1','unused')?.changed,false);
  assert.deepEqual(assignMaterialClip([first,area],'image-2','new',2)?.clips,[first,{id:'new',number:2,kind:'material',elementId:'image-2'}]);
});
test('wire presentation strips obsolete permissions and unrelated metadata', () => {
  const message = parseClientMessage({type:'presentation',generation:2,presentation:{revision:1,mode:'clip',allowFree:true,reset:1,clip:{id:'clip',x:0,y:0,width:300,height:400,secret:'private'}}});
  assert.equal(message.type,'presentation');
  assert.doesNotMatch(JSON.stringify(message),/allowFree|private|secret/);
  assert.throws(()=>parseClientMessage({type:'presentation',generation:2,presentation:{revision:1,mode:'clip',clip:{x:0,y:0,width:0,height:400,id:'c'},reset:1}}));
});
test('former follow presentations migrate to the canonical free mode', () => {
  const message=parseClientMessage({type:'presentation',generation:2,presentation:{revision:1,mode:'follow',allowFree:false,clip:null,reset:1}});
  assert.equal(message.type,'presentation');
  if(message.type==='presentation')assert.deepEqual(message.presentation,{revision:1,mode:'free',clip:null,reset:1});
});

test('timer instances share the material-clip list without turning arbitrary shapes into material', async () => {
  const {canBeMaterialClipElement}=await import('../canvas/clip-frames.ts');
  const timer={id:'timer',type:'rectangle',isDeleted:false,customData:{surfaceKind:'timer-widget'}} as never;
  assert.equal(canBeMaterialClipElement(timer),true);
  assert.equal(canBeMaterialClipElement({id:'shape',type:'rectangle',isDeleted:false} as never),false);
  assert.equal(canBeMaterialClipElement({id:'timer',type:'rectangle',isDeleted:true,customData:{surfaceKind:'timer-widget'}} as never),false);
  const first=assignMaterialClip([], 'timer','cue-1',3)!;
  const moved=assignMaterialClip(first.clips,'timer','cue-2',7)!;
  assert.equal(moved.clips.length,1);assert.equal(moved.clips[0].number,7);
  assert.deepEqual(readClipFrames(JSON.parse(JSON.stringify(moved.clips))),moved.clips);
});
