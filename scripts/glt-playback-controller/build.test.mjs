import test from 'node:test';
import assert from 'node:assert/strict';
import {renderFilmController,renderWikiController,controllerIcons} from './build.mjs';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
async function surfaceHarness(kind='video'){
  const nodes=new Map(),events={},moves=[],commands=[];
  const node=id=>{
    if(kind==='video'&&['previous','next'].includes(id))return null;
    if(!nodes.has(id))nodes.set(id,{id,dataset:{},hidden:false,parentElement:null,value:'0',min:'0',max:'1',step:id==='volume'?'.01':'.1',style:{setProperty(){}},
      getBoundingClientRect(){return {left:0,width:320};},focus(){document.activeElement=this;},
      setPointerCapture(id){this.capture=id;},hasPointerCapture(id){return this.capture===id;},releasePointerCapture(){this.capture=null;},
      setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},closest(){return null;},
      append(...children){for(const child of children){moves.push(child.id);child.parentElement=this;}},
      querySelectorAll(){return ['play','stop','fullscreen','mute',...(kind==='frames'?['previous','next']:[])].map(node);}});
    return nodes.get(id);
  };
  const config={kind,icons:controllerIcons,fps:30,nextLabels:['One','Two','Three','Four'],scenes:[{startFrame:0,image:'intro.png',title:'Intro'},{startFrame:300,image:'task.png',title:'Task'}]};
  node('controller-config').textContent=JSON.stringify(config);
  const value={state:kind==='video'?{version:1,position:7}:kind==='frames'?{frame:330}:{slide:1,positions:[0,0]},
    status:{playing:false,position:7,duration:304,volume:1,canPrevious:true,canNext:true}};
  const play=node('play');play.dataset.playbackCommand='play';
  const stages=[node('stage-one'),node('stage-two')],slides=[0,1,2,3].map(i=>node(`slide-${i}`));
  const window={tafelraumPlaybackController:{getState:()=>value.state,getStatus:()=>value.status,command:c=>commands.push(c)},
    addEventListener:(name,handler)=>{const previous=events[name];events[name]=previous?event=>{previous(event);handler(event);}:handler;}};window.top=window;
  const document={getElementById:node,querySelector:()=>play,querySelectorAll:selector=>selector==='.slide'?slides:selector==='.video-stage'?stages:
    selector.includes('data-playback-command')?[play]:[],addEventListener(){},activeElement:null};
  const clock={now:Date.now()};
  vm.runInNewContext(await readFile(new URL('surface.js',import.meta.url),'utf8'),{window,document,Date:{now:()=>clock.now}});
  return {node,value,window,document,events,moves,commands,clock,render:events['tafelraum:controller-change']};
}
test('single-video output keeps one native media clock and validates paused restore',async()=>{
  const handlers={},events=[];
  const video={readyState:1,currentTime:0,duration:304,volume:1,paused:true,ended:false,
    addEventListener:(type,handler)=>{handlers[type]=handler;},pause(){this.paused=true;},async play(){this.paused=false;}};
  const window={dispatchEvent:event=>events.push(event.type)};
  const document={title:'Testvideo',querySelector:()=>video,getElementById:()=>({hidden:true})};
  vm.runInNewContext(await readFile(new URL('single-video.js',import.meta.url),'utf8'),{window,document,CustomEvent:class{constructor(type){this.type=type;}}});
  assert.equal(window.tafelraumPlayback.getFullscreenTarget(),video);
  await window.tafelraumPlayback.execute({type:'play'});assert.equal(video.paused,false);
  window.tafelraumLive.applyState({version:1,position:12});assert.equal(video.paused,true);assert.equal(video.currentTime,12);
  window.tafelraumLive.applyState({version:1,position:-1});assert.equal(video.currentTime,12);
  window.tafelraumLive.applyState({version:1,position:2,playing:true});assert.equal(video.currentTime,12,'autoplay is never restored');
  await window.tafelraumPlayback.execute({type:'volume',value:.5});assert.equal(video.volume,.5);
  handlers.pause();assert.ok(events.includes('tafelraum:statechange'));
  assert.equal(window.tafelraumPlayback.getStatus().position,12);
});
test('single-video passive controls need no dummy slide navigation',async()=>{
  const {node,render,commands}=await surfaceHarness();
  render();assert.equal(node('time').textContent,'0:07 / 5:04');
  node('fullscreen').onclick();assert.equal(commands.at(-1).type,'fullscreen');
  node('play').onclick();assert.equal(commands.at(-1).type,'play');
  assert.match(node('play').innerHTML,/lucide-play/);
  node('stop').onclick();assert.equal(commands.at(-1).value,0);
});
test('film controller preserves cover/template markup and removes both native players',()=>{
  const cover='<section class="cover"><h1>Ferris macht blau</h1><img src="cover.jpg"></section>';
  const html=renderFilmController(`<html><head><script src="player.js" defer></script></head><body><main>${cover}<video poster="one.jpg"><source src="one.mp4"></video><video poster="two.jpg"><source src="two.mp4"></video></main></body></html>`);
  assert.ok(html.includes(cover));assert.doesNotMatch(html,/<video|<source|player\.js/);
  assert.match(html,/one.jpg/);assert.match(html,/two.jpg/);assert.match(html,/id="play"/);
  assert.throws(()=>renderFilmController('<html></html>'),/genau zwei/);
});
test('playing chapter-relative time does not replace the selected section preview with the intro',async()=>{
  const {node,value,render}=await surfaceHarness('frames');value.status.playing=true;render();
  assert.equal(node('scene-preview').src,'task.png');assert.equal(node('connection').textContent,'Wiedergabe im Room Canvas');
  value.status.position=2;render();assert.equal(node('scene-preview').src,'task.png');
});
test('wiki controller has all navigation/status controls and only a static scene image',()=>{
  const html=renderWikiController({title:'Hattie <Wiki>',canvas:{fps:30}},[{title:'Start',startFrame:0,image:'controller-previews/start.png'}]);
  for(const id of ['previous','next','play','fullscreen','seek','volume','connection','time','scene-preview'])
    assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1,`${id} exists exactly once`);
  assert.doesNotMatch(html,/<(?:video|audio|canvas|iframe)\b|viewer\.js/);
  assert.match(html,/Hattie &lt;Wiki>/);
});

test('film status ticks keep controls attached, so a pointer gesture is not interrupted',async()=>{
  const {node,value,moves,render,commands}=await surfaceHarness('slides');
  assert.deepEqual(moves,['controller-tools','connection']);moves.length=0;
  const button=node('fullscreen'),handler=button.onclick;
  render();render();render();
  assert.deepEqual(moves,[],'status updates must not detach controls while mouse/touch is down');
  assert.equal(button.onclick,handler);button.onclick();assert.equal(commands.at(-1).type,'fullscreen');
  value.state.slide=3;render();assert.deepEqual(moves,['controller-tools','connection'],'only a real scene switch moves the toolbar');
});

const mouse=(pointerId,clientX,buttons=1)=>({pointerId,clientX,button:0,buttons,pointerType:'mouse',preventDefault(){}});
test('scrub previews immediately, ignores old status, commits once in either change/up order',async()=>{
  const {node,value,events,commands,render,document}=await surfaceHarness(),seek=node('seek');
  document.activeElement=seek;seek.onpointerdown(mouse(4,100));seek.onpointermove(mouse(4,38));
  value.status.position=8;render();assert.equal(seek.value,'30');assert.equal(node('time').textContent,'0:30 / 5:04');assert.equal(commands.length,0);
  seek.onchange();assert.equal(commands.length,0);events.pointerup({pointerId:4});seek.onchange();assert.equal(commands.length,1);
  assert.equal(commands[0].value,30);render();assert.equal(seek.value,'30','hold target while acknowledgement is in flight');
  value.status.position=29.9;render();assert.equal(seek.value,'30','a nearby older seek is not the latest acknowledgement');
  value.status.position=30;render();value.status.position=31;render();assert.equal(seek.value,'31','focused but idle slider follows real playback');
  seek.onpointerdown(mouse(5,8));seek.onpointermove(mouse(5,68));events.pointerup({pointerId:5});seek.onchange();assert.equal(commands.length,2);
});
test('scrub cancellation, disconnect and section changes never send a stale seek',async()=>{
  const {node,value,events,commands,render}=await surfaceHarness('frames'),seek=node('seek');
  const drag=()=>{seek.onpointerdown(mouse(3,8));seek.onpointermove(mouse(3,24));};
  drag();events.pointercancel({pointerId:3});events.pointerup({pointerId:3});assert.equal(commands.length,0);
  drag();seek.onkeydown({key:'Escape',preventDefault(){}});events.pointerup({pointerId:3});assert.equal(commands.length,0);
  drag();value.state.frame=0;render();seek.onpointermove(mouse(3,25));seek.onchange();events.pointerup({pointerId:3});assert.equal(commands.length,0);
  drag();value.status=null;render();events.pointerup({pointerId:3});assert.equal(commands.length,0);
});
test('both ranges drag repeatedly without hover tracking; volume holds drafts and pending ACKs',async()=>{
  for(const id of ['seek','volume']){
    const {node,value,events,commands,render}=await surfaceHarness(),input=node(id);
    input.onpointerdown(mouse(1,8));input.onpointermove(mouse(1,160));const target=Number(input.value);
    value.status.position=2;value.status.volume=.9;render();assert.equal(Number(input.value),target);
    assert.equal(commands.length,0,'no media updates while dragging');
    events.pointerup(mouse(1,160,0));input.onchange();assert.equal(commands.length,1);
    assert.equal(input.capture,null,'capture explicitly released');render();assert.equal(Number(input.value),target);
    for(const x of [10,300,100])input.onpointermove(mouse(1,x,0));
    assert.equal(Number(input.value),target,'hover after release cannot move thumb');
    value.status[id==='seek'?'position':'volume']=target;render();
    input.onpointerdown(mouse(2,160));assert.equal(Number(input.value),target,'grabbing the thumb does not jump');
    input.onpointermove(mouse(2,221));const second=Number(input.value);events.pointerup(mouse(2,221,0));
    assert.equal(commands.length,2);assert.equal(commands.at(-1).value,second);
    input.onpointerdown(mouse(3,100));input.onpointermove(mouse(3,250));
    input.onpointermove(mouse(3,260,0));events.pointerup(mouse(3,260,0));assert.equal(commands.length,2,'lost mouse-up cancels instead of sticky hover');
    input.onpointerdown(mouse(4,100));input.onlostpointercapture({pointerId:4});events.pointerup({pointerId:4});assert.equal(commands.length,2);
  }
});
test('both ranges reject secondary mouse buttons and cancel blur; keyboard/accessibility stay supported',async()=>{
  for(const id of ['seek','volume']){
    const {node,events,commands}=await surfaceHarness(),input=node(id);
    input.onpointerdown({...mouse(1,100),button:2});input.onpointermove(mouse(1,200));events.pointerup({pointerId:1});assert.equal(commands.length,0);
    input.onpointerdown(mouse(2,100));events.blur();events.pointerup({pointerId:2});assert.equal(commands.length,0);
    input.onkeydown({key:'ArrowRight'});input.value=id==='seek'?'9':'.5';input.oninput();input.onchange();assert.equal(commands.length,0);
    input.onkeyup();assert.equal(commands.length,1);
    input.value=id==='seek'?'12':'.75';input.oninput();input.onchange();assert.equal(commands.length,2,'assistive input/change supported');
  }
});
test('keyboard repeats are local until keyup; stop and mute use existing commands',async()=>{
  const {node,commands,value,render}=await surfaceHarness(),seek=node('seek');
  seek.onkeydown({key:'ArrowRight'});seek.value='8';seek.oninput();seek.onchange();seek.value='9';seek.oninput();seek.onchange();assert.equal(commands.length,0);
  seek.onkeyup();assert.equal(commands.length,1);assert.equal(commands[0].value,9);
  node('mute').onclick();assert.equal(commands.at(-1).value,0);value.status.volume=0;render();node('mute').onclick();assert.equal(commands.at(-1).value,1);
});
test('completed seek preserves gesture-start playback; paused seeks, Stop, volume and cancellation never auto-start',async()=>{
  for(const kind of ['video','slides','frames']){
    const {node,value,events,commands,render}=await surfaceHarness(kind),seek=node('seek');
    value.status.playing=true;render();
    seek.onpointerdown(mouse(1,100));seek.onpointermove(mouse(1,160));
    assert.equal(commands.length,0);events.pointerup(mouse(1,160,0));
    assert.deepEqual(commands.map(c=>c.type),['seek'],'wait for the confirmed target before resuming');
    value.status.position=commands[0].value;value.status.playing=false;render();render();
    assert.deepEqual(commands.map(c=>c.type),['seek','play'],'one seek followed by existing Play');
    value.status.playing=false;render();
    seek.onpointerdown(mouse(2,100));seek.onpointermove(mouse(2,210));events.pointerup(mouse(2,210,0));
    assert.equal(commands.at(-1).type,'seek');assert.equal(commands.filter(c=>c.type==='play').length,1);
    value.status.playing=true;render();
    seek.onkeydown({key:'ArrowRight'});seek.value='11';seek.oninput();seek.onkeyup();
    value.status.position=11;value.status.playing=false;render();
    assert.deepEqual(commands.slice(-2).map(c=>c.type),['seek','play']);
    value.status.playing=true;render();
    const count=commands.length;
    seek.onpointerdown(mouse(3,100));events.pointercancel({pointerId:3});events.pointerup({pointerId:3});assert.equal(commands.length,count);
    seek.onpointerdown(mouse(4,100));node('play').onclick();events.pointerup({pointerId:4});
    assert.deepEqual(commands.slice(count).map(c=>c.type),['pause'],'explicit pause cancels an unfinished seek/resume');
    node('stop').onclick();assert.equal(commands.at(-1).type,'seek');assert.equal(commands.at(-1).value,0);
    const volume=node('volume');volume.onpointerdown(mouse(5,100));volume.onpointermove(mouse(5,160));events.pointerup({pointerId:5});
    assert.equal(commands.at(-1).type,'volume');
  }
});
test('pending resume is discarded on explicit pause, disconnection and section change; end does not restart',async()=>{
  for(const abort of ['pause','disconnect','section','end']){
    const {node,value,events,commands,render}=await surfaceHarness('slides'),seek=node('seek');
    value.status.playing=true;render();seek.onpointerdown(mouse(1,100));seek.onpointermove(mouse(1,abort==='end'?320:160));events.pointerup({pointerId:1});
    const target=commands[0].value;
    if(abort==='pause')node('play').onclick();
    if(abort==='section'){value.state.slide=3;render();}
    if(abort==='disconnect'){value.status=null;render();value.status={playing:false,position:target,duration:304,volume:1};}
    value.status.playing=false;value.status.position=target;render();
    assert.equal(commands.filter(c=>c.type==='play').length,0,abort+' never resurrects playback');
  }
});
test('same-position seek waits for paused confirmation, not the old still-playing status',async()=>{
  const {node,value,events,commands,render}=await surfaceHarness(),seek=node('seek');
  value.status.position=152;value.status.playing=true;render();
  seek.onpointerdown(mouse(1,160));events.pointerup({pointerId:1});render();
  assert.deepEqual(commands.map(c=>c.type),['seek']);
  value.status.playing=false;render();render();assert.deepEqual(commands.map(c=>c.type),['seek','play']);
});
test('a delayed confirmation after the pending deadline never starts playback',async()=>{
  const {node,value,events,commands,clock,render}=await surfaceHarness(),seek=node('seek');
  value.status.playing=true;render();seek.onpointerdown(mouse(1,100));seek.onpointermove(mouse(1,160));events.pointerup({pointerId:1});
  clock.now+=2401;value.status.position=commands[0].value;value.status.playing=false;render();render();
  assert.deepEqual(commands.map(c=>c.type),['seek']);
});
