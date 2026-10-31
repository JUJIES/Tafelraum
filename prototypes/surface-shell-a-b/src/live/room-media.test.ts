import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { canBeMaterialClipElement, readClipFrames } from '../canvas/clip-frames.ts';
import { isRoomMediaElement, roomMediaFromElement } from './room-media.ts';

function material(kind:'audio'|'video'|'youtube',customData:Record<string,unknown>) {
  return {id:`${kind}-1`,type:'rectangle',isDeleted:false,x:100,y:200,width:640,height:360,
    angle:0,groupIds:[],customData:{materialKind:kind,sourceTitle:'Unterrichtsmedium',...customData}} as unknown as ExcalidrawElement;
}

test('only visual media use numbered clips and Room playback projection',()=>{
  for(const kind of ['video','youtube'] as const) {
    const element=material(kind,{});
    assert.equal(canBeMaterialClipElement(element),true);
    assert.equal(isRoomMediaElement(element),true);
    assert.equal(canBeMaterialClipElement({...element,isDeleted:true}),false);
    assert.equal(isRoomMediaElement({...element,isDeleted:true}),false);
  }
  const audio=material('audio',{sourceLessonId:'lesson-1',sourceMaterialPath:'audio/test.mp3'});
  // Existing references remain readable; the clip frame still offers removal.
  const oldClip={id:'old-audio',number:1,kind:'material' as const,elementId:audio.id};
  assert.deepEqual(readClipFrames([oldClip]),[oldClip]);
  assert.equal(canBeMaterialClipElement(audio),false);
  assert.equal(isRoomMediaElement(audio),false);
  assert.equal(roomMediaFromElement(audio,[audio],{playing:true,position:4,updatedAt:1000}),null);
});

test('Room media derives local file URLs, canonical YouTube IDs and no archived playback state',()=>{
  const playback={playing:true,position:12.5,updatedAt:1000};
  for(const kind of ['video'] as const) {
    const element=material(kind,{sourceLessonId:'lesson-1',sourceMaterialPath:`material/${kind}/test.mp4`});
    const cue=roomMediaFromElement(element,[element],playback);
    assert.equal(cue?.sourceUrl,`/api/archive/lessons/lesson-1/materials/file?path=material%2F${kind}%2Ftest.mp4`);
    assert.equal(cue?.playing,true);
    assert.equal(cue?.position,12.5);
    assert.equal(cue?.videoId,undefined);
  }
  const youtube=material('youtube',{videoId:'M7lc1UVf-VE',sourceUrl:'https://www.youtube.com/watch?v=M7lc1UVf-VE'});
  const cue=roomMediaFromElement(youtube,[youtube],playback);
  assert.equal(cue?.videoId,'M7lc1UVf-VE');
  assert.equal(cue?.sourceUrl,undefined);
  assert.equal(roomMediaFromElement(material('youtube',{videoId:'invalid'}),[],playback),null);
  assert.equal(roomMediaFromElement(material('video',{}),[],playback),null);
});
