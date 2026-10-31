import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { SceneChangeTracker } from './scene-change-tracker.ts';

test('Room detects native mutations, ordering, deletion, image geometry and background without serializing ink', () => {
  const tracker = new SceneChangeTracker();
  const ink = {id:'ink',type:'freedraw',version:1,versionNonce:1,isDeleted:false,x:0,y:0,width:10,height:10,angle:0,points:[[0,0],[10,10]],pressures:[.5,.8]};
  const image = {...ink,id:'image',type:'image',status:'saved',crop:{x:0,y:0,width:10,height:10},scale:[1,1]};
  const scene = [ink,image] as unknown as ExcalidrawElement[];
  assert.equal(tracker.changed(scene,'white'),true);
  assert.equal(tracker.changed(scene,'white'),false);
  for (const mutate of [() => {ink.points[1][0]=12;}, () => {ink.pressures[0]=.7;}, () => {ink.x=5;},
    () => {image.crop.width=5;}, () => {image.scale[0]=-1;}, () => {ink.versionNonce++;}, () => {ink.isDeleted=true;},
    () => {scene.reverse();}, () => {scene.pop();}]) {
    mutate(); assert.equal(tracker.changed(scene,'white'),true); assert.equal(tracker.changed(scene,'white'),false);
  }
  assert.equal(tracker.changed(scene,'black'),true);
  assert.equal(tracker.changed(structuredClone(scene),'black'),false,'equivalent new references are not scene changes');
});
