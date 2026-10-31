import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {validPlaybackCommand,validPlaybackStatus,playbackCapability,playbackOutputScript,playbackSharedScript} from './interactive-html-playback.mjs';

test('playback is explicit and bounded; no inferred capability or persisted playing',()=>{
  assert.equal(playbackCapability(undefined),null);
  assert.throws(()=>playbackCapability({protocol:'unknown',initialState:{}}));
  assert.throws(()=>playbackCapability({protocol:'room-v1',initialState:'x'}));
  for(const controllerEntry of ['../controller.html','/controller.html','https://x/a.html','x//a.html','x.js'])
    assert.throws(()=>playbackCapability({protocol:'room-v1',initialState:{},controllerEntry}));
  assert.equal(playbackCapability({protocol:'room-v1',initialState:{},controllerEntry:'controller.html'}).controllerEntry,'controller.html');
  assert.equal(validPlaybackCommand({type:'play',value:true}),false);
  assert.equal(validPlaybackCommand({type:'volume',value:2}),false);
  assert.equal(validPlaybackCommand({type:'seek',value:NaN}),false);
  assert.equal(validPlaybackCommand({type:'seek',value:86401}),false);
  assert.equal(validPlaybackCommand({type:'play'}),true);
  assert.equal(validPlaybackCommand({type:'fullscreen',value:true}),true);
  assert.equal(validPlaybackCommand({type:'fullscreen',value:1}),false);
  assert.equal(validPlaybackCommand({type:'fullscreen',value:'false'}),false);
  const status={title:'Slide',position:0,duration:5,volume:1,playing:false,canNext:true,canPrevious:false};
  assert.equal(validPlaybackStatus(status),true);
  assert.equal(validPlaybackStatus({...status,extra:'unbounded'}),false);
});

function outputFixture(local=false){
  let now=1000,tick;
  const handlers={},calls=[],sent=[],timeouts=new Map();let timeoutId=0;
  const parent={postMessage:message=>sent.push(message)};
  const api={execute:command=>{calls.push(command);},getStatus:()=>({title:'Test',position:0,duration:10,playing:false,canNext:false,canPrevious:false,volume:1})};
  const window={parent,tafelraumPlayback:api,tafelraumLive:{getState:()=>({slide:1,position:7})},dispatchEvent(){},addEventListener:(type,handler)=>{handlers[type]=handler;}};
  const document={head:{append(){}},createElement:()=>({}),addEventListener:(type,handler)=>{handlers[type]=handler;}};
  const context=vm.createContext({window,document,CustomEvent:class{},Date:{now:()=>now},crypto:{randomUUID:()=>`a0000000-0000-4000-8000-${String(++timeoutId).padStart(12,'0')}`},
    setTimeout:callback=>{const id=++timeoutId;timeouts.set(id,callback);return id;},clearTimeout:id=>timeouts.delete(id),
    setInterval:callback=>{tick=callback;return 1;},clearInterval(){}});
  vm.runInContext(playbackOutputScript(local).replace(/^<script>|<\/script>$/g,''),context);
  return {calls,sent,api,document,window,tick:()=>tick(),advance:ms=>{now+=ms;tick?.();},
    nativeReply:id=>handlers['tafelraum:native-fullscreen']({detail:id}),timeout:()=>{for(const callback of timeouts.values())callback();timeouts.clear();},
    send:(data,source=parent)=>handlers.message({source,data:{type:'tafelraum:playback-host',...data}})};
}
const token='a0000000-0000-4000-8000-000000000000';
test('native video fullscreen uses the original target and reports native button state, without seek/play/pause',async()=>{
  const fixture=outputFixture();
  let entries=0,exits=0;
  const target={isConnected:true,ownerDocument:fixture.document,webkitDisplayingFullscreen:false,
    webkitEnterFullscreen(){entries++;this.webkitDisplayingFullscreen=true;},
    webkitExitFullscreen(){exits++;this.webkitDisplayingFullscreen=false;}};
  fixture.api.getFullscreenTarget=()=>target;
  await fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}});assert.equal(entries,0);
  await fixture.send({action:'lease',token});fixture.calls.length=0;
  await fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}},{});assert.equal(entries,0);
  await fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}});
  fixture.tick();assert.equal(fixture.sent.at(-1).status.fullscreen,true);
  fixture.calls.length=0;
  await fixture.send({action:'command',token,sequence:2,command:{type:'fullscreen',value:false}});
  assert.equal(exits,1);assert.equal(fixture.calls.length,0,'no media action on fullscreen exit');
  target.webkitDisplayingFullscreen=true;fixture.tick();assert.equal(fixture.sent.at(-1).status.fullscreen,true,'native button is observed, not simulated');
  fixture.advance(2500);assert.equal(target.webkitDisplayingFullscreen,false,'lease expiry exits native fullscreen');
  assert.equal(fixture.api.getFullscreenTarget(),target,'same original element');
});
test('native relay only completes a pending leased fullscreen command in the original frame',async()=>{
  const fixture=outputFixture(),requests=[];let entries=0;
  fixture.window.webkit={messageHandlers:{tafelraumFullscreen:{postMessage:id=>requests.push(id)}}};
  const target={isConnected:true,ownerDocument:fixture.document,webkitEnterFullscreen(){entries++;this.webkitDisplayingFullscreen=true;}};
  fixture.api.getFullscreenTarget=()=>target;
  fixture.nativeReply('unsolicited');assert.equal(entries,0);
  await fixture.send({action:'lease',token});fixture.calls.length=0;
  const pending=fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}});
  assert.equal(requests.length,1);assert.equal(entries,0,'async cross-window command does not call native fullscreen directly');
  fixture.nativeReply('foreign');assert.equal(entries,0);
  fixture.nativeReply(requests[0]);await pending;
  fixture.tick();assert.equal(fixture.sent.at(-1).status.fullscreen,true);assert.equal(entries,1);
  assert.equal(fixture.calls.length,0,'no new play, pause, or seek');
  fixture.nativeReply(requests[0]);assert.equal(entries,1,'callback cannot be replayed');
});
test('revoked, superseded and timed-out native fullscreen callbacks never open an obsolete player',async()=>{
  const fixture=outputFixture(),requests=[];let entries=0;
  fixture.window.webkit={messageHandlers:{tafelraumFullscreen:{postMessage:id=>requests.push(id)}}};
  fixture.api.getFullscreenTarget=()=>({isConnected:true,ownerDocument:fixture.document,webkitEnterFullscreen(){entries++;}});
  await fixture.send({action:'lease',token});
  let pending=fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}});
  await fixture.send({action:'command',token,sequence:2,command:{type:'pause'}});await pending;
  fixture.nativeReply(requests[0]);assert.equal(entries,0);fixture.tick();assert.equal(fixture.sent.at(-1).status.error,undefined);
  pending=fixture.send({action:'command',token,sequence:3,command:{type:'fullscreen',value:true}});
  await fixture.send({action:'release'});await pending;fixture.nativeReply(requests[1]);assert.equal(entries,0);
  await fixture.send({action:'lease',token});
  pending=fixture.send({action:'command',token,sequence:1,command:{type:'fullscreen',value:true}});
  fixture.timeout();await pending;fixture.nativeReply(requests[2]);fixture.tick();
  assert.equal(entries,0);assert.match(fixture.sent.at(-1).status.error,/Vollbild wurde blockiert/);
});
test('output accepts only its parent, active lease and strictly newer commands; expiry pauses',async()=>{
  const fixture=outputFixture();fixture.calls.length=0;
  await fixture.send({action:'command',token,sequence:1,command:{type:'play'}});
  assert.equal(fixture.calls.length,0);
  await fixture.send({action:'lease',token},{});
  await fixture.send({action:'command',token,sequence:1,command:{type:'play'}});
  assert.equal(fixture.calls.length,0);
  await fixture.send({action:'lease',token});fixture.calls.length=0;
  await fixture.send({action:'command',token,sequence:1,command:{type:'play'}});
  await fixture.send({action:'command',token,sequence:1,command:{type:'play'}});
  assert.equal(fixture.calls.filter(call=>call.type==='play').length,1);
  fixture.advance(2500);
  assert.equal(fixture.calls.at(-1).type,'pause');
  await fixture.send({action:'command',token,sequence:2,command:{type:'play'}});
  assert.equal(fixture.calls.filter(call=>call.type==='play').length,1);
});
test('local player is not polled into Pause; handoff pauses before returning semantic state and trusts only its parent',async()=>{
  const fixture=outputFixture(true);fixture.advance(5000);
  assert.equal(fixture.calls.length,0,'local controls are not governed by Room leases');
  await fixture.send({action:'handoff',handoff:'request'},{});
  assert.equal(fixture.sent.length,0);
  let finish;
  fixture.api.execute=command=>{fixture.calls.push(command);return new Promise(resolve=>{finish=resolve;});};
  const pending=fixture.send({action:'handoff',handoff:'request'});
  assert.equal(fixture.calls.at(-1).type,'pause');assert.equal(fixture.sent.length,0);
  finish();await pending;
  assert.equal(fixture.sent.at(-1).handoff,'request');
  assert.equal(JSON.stringify(fixture.sent.at(-1).state),JSON.stringify({slide:1,position:7}));
});
test('late asynchronous play cannot survive revocation; new leases never auto-resume',async()=>{
  const fixture=outputFixture();let settle;
  fixture.api.execute=command=>{fixture.calls.push(command);if(command.type==='play')return new Promise(resolve=>{settle=resolve;});};
  await fixture.send({action:'lease',token});
  const pending=fixture.send({action:'command',token,sequence:1,command:{type:'play'}});
  await fixture.send({action:'release'});settle();await pending;
  assert.equal(fixture.calls.at(-1).type,'pause');
  const plays=fixture.calls.filter(call=>call.type==='play').length;
  await fixture.send({action:'lease',token});fixture.tick();
  assert.equal(fixture.calls.filter(call=>call.type==='play').length,plays);
});

test('shared teacher view is the default, legacy controller metadata stays readable and timeline is bounded',()=>{
  assert.equal(playbackCapability({protocol:'room-v1',initialState:{},teacherView:'shared'}).teacherView,'shared');
  assert.throws(()=>playbackCapability({protocol:'room-v1',initialState:{},teacherView:'anything'}));
  assert.equal(playbackCapability({protocol:'room-v1',initialState:{},controllerEntry:'controller.html'}).teacherView,'shared');
  assert.equal(playbackCapability({protocol:'room-v1',initialState:{}}).teacherView,'shared');
  const base={title:'x',playing:false,canPrevious:false,canNext:false,position:0,duration:1,volume:1};
  assert.equal(validPlaybackStatus({...base,timelinePosition:123}),true);
  for(const timelinePosition of [-1,Infinity,86401,'5'])assert.equal(validPlaybackStatus({...base,timelinePosition}),false);
});

test('shared view preserves the package state API, fences parent status and stops delegation after timeout',()=>{
  const handlers={},sent=[];let now=0,tick;
  const parent={postMessage:value=>sent.push(value)};
  const live={getState:()=>({frame:1})};
  const window={parent,tafelraumLive:live,addEventListener:(type,fn)=>{handlers[type]=fn;},dispatchEvent:()=>{}};
  vm.runInContext(playbackSharedScript().replace(/^<script>|<\/script>$/g,''),vm.createContext({window,document:{querySelectorAll:()=>[],addEventListener:()=>{},documentElement:{}},MutationObserver:class{observe(){}disconnect(){}},TextEncoder,requestAnimationFrame:fn=>fn(),clearInterval:()=>{},Date:{now:()=>now},CustomEvent:class{},setInterval:fn=>{tick=fn;}}));
  assert.equal(window.tafelraumLive,live);
  const api=window.tafelraumPlaybackMirror;
  const status={title:'chapter',position:1,duration:2,volume:1,playing:true,canPrevious:false,canNext:true,timelinePosition:7};
  handlers.message({source:{},data:{type:'tafelraum:playback-status',connected:true,status}});assert.equal(api.getStatus(),null);
  handlers.message({source:parent,data:{type:'tafelraum:playback-status',connected:true,status}});
  api.command({type:'play'},{frame:2});assert.equal(sent.at(-1).state.frame,2);
  now=3000;tick();assert.equal(api.getStatus(),null);api.command({type:'play'});assert.equal(sent.length,1);
});
