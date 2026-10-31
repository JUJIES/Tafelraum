/* Passive author surface. Only Room owns the media clock; drafts are local UI. */
(() => {
  const host=window.tafelraumPlaybackController;
  if(!host)return;
  if(window.top!==window)document.body.classList.add('is-embedded');
  const config=JSON.parse(document.getElementById('controller-config').textContent);
  const byId=id=>document.getElementById(id),seek=byId('seek'),volume=byId('volume');
  const slides=[...document.querySelectorAll('.slide')],tools=byId('controller-tools');
  const format=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
  let displayed=-1,lastVolume=1;
  const setIcon=(button,name)=>{
    if(button.dataset.icon===name)return;
    button.dataset.icon=name;button.innerHTML=config.icons[name];
  };
  const label=(button,text)=>{button.setAttribute('aria-label',text);button.title=text;};
  const send=command=>{if(host.getStatus())host.command(command);};
  const paintPosition=(position,duration)=>{
    if(Number(seek.value)!==position)seek.value=String(position);
    seek.style.setProperty('--progress',`${duration?100*position/duration:0}%`);
    seek.setAttribute('aria-valuetext',`${format(position)} von ${format(duration)}`);
    byId('time').textContent=`${format(position)} / ${format(duration)}`;
  };
  // One gesture owner for both ranges. Native range tracking differs across
  // WebKit/Chromium; keep its keyboard/accessibility semantics, not its mouse drag.
  function rangeEditor(input,type,available){
    let draft=null,pointer=null,keyEditing=false,pending=null,lastCommit=null,suppressChange=false,resume=false;
    const begin=()=>{resume=type==='seek'&&Boolean(host.getStatus()?.playing);};
    const release=()=>{
      const id=pointer?.id;pointer=null;
      if(id!==undefined&&input.hasPointerCapture?.(id))input.releasePointerCapture(id);
    };
    const cancel=()=>{draft=null;keyEditing=false;pending=null;suppressChange=true;resume=false;release();};
    const commit=()=>{
      const value=draft,continuePlaying=resume;draft=null;keyEditing=false;resume=false;release();
      if(value!==null&&available()){
        // Resume only after Room confirms the paused seek, not on a timer or
        // before the actual target arrives. The existing pending draft owns it.
        lastCommit=value;pending={value,until:Date.now()+2400,
          resume:continuePlaying&&value<host.getStatus().duration};send({type,value});
      }
      render();
    };
    const fromPointer=event=>{
      const box=input.getBoundingClientRect(),min=Number(input.min)||0,max=Number(input.max),step=Number(input.step)||1;
      // CSS thumb is 16 px. Coordinates are iframe-local even under Canvas zoom.
      const fraction=Math.max(0,Math.min(1,(event.clientX-box.left-8-(pointer?.offset||0))/Math.max(1,box.width-16)));
      return Math.max(min,Math.min(max,Number((min+Math.round(fraction*(max-min)/step)*step).toFixed(6))));
    };
    input.onpointerdown=event=>{
      if(input.disabled||event.button!==0||event.isPrimary===false||pointer)return;
      event.preventDefault();input.focus({preventScroll:true});
      begin();
      const box=input.getBoundingClientRect(),min=Number(input.min)||0,max=Number(input.max);
      const center=box.left+8+(Number(input.value)-min)/(max-min)*(box.width-16);
      pointer={id:event.pointerId,offset:Math.abs(event.clientX-center)<=10?event.clientX-center:0};
      keyEditing=false;pending=null;lastCommit=null;suppressChange=false;
      input.setPointerCapture(event.pointerId);draft=fromPointer(event);render();
    };
    input.onpointermove=event=>{
      if(event.pointerId!==pointer?.id)return;
      // A lost mouse-up must never leave the thumb attached to mere hovering.
      if(event.pointerType==='mouse'&&(event.buttons&1)===0){cancel();render();return;}
      event.preventDefault();draft=fromPointer(event);render();
    };
    window.addEventListener('pointerup',event=>{if(event.pointerId===pointer?.id)commit();},true);
    window.addEventListener('pointercancel',event=>{if(event.pointerId===pointer?.id){cancel();render();}},true);
    input.onlostpointercapture=event=>{if(event.pointerId===pointer?.id){cancel();render();}};
    input.oninput=()=>{
      if(pointer||input.disabled){render();return;}
      if(draft===null&&!keyEditing)begin();
      suppressChange=false;lastCommit=null;draft=Number(input.value);render();
    };
    input.onchange=()=>{
      if(pointer||keyEditing||suppressChange||input.disabled)return;
      const value=Number(input.value);if(lastCommit===value)return;
      if(draft===null)begin();
      draft=value;commit();
    };
    input.onkeydown=event=>{
      if(event.key==='Escape'){cancel();render();event.preventDefault();return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){
        if(!keyEditing)begin();
        keyEditing=true;pending=null;suppressChange=false;
      }
    };
    input.onkeyup=()=>{if(keyEditing)commit();};
    input.onblur=()=>{if(pointer){cancel();render();}else if(draft!==null)commit();};
    window.addEventListener('blur',()=>{cancel();render();});
    return {cancel,value(actual){
      const tolerance=type==='seek'?.05:.001;
      if(pending){
        const confirmed=Math.abs(actual-pending.value)<tolerance&&(!pending.resume||!host.getStatus()?.playing);
        const expired=Date.now()>pending.until;
        if(confirmed||expired){
          const shouldResume=confirmed&&!expired&&pending.resume&&!host.getStatus()?.playing;
          pending=null;
          if(shouldResume)send({type:'play'});
        }
      }
      return draft??pending?.value??actual;
    },hold(value){cancel();pending={value,until:Date.now()+2400};}};
  }
  const positionEditor=rangeEditor(seek,'seek',()=>Boolean(host.getStatus()?.duration));
  const volumeEditor=rangeEditor(volume,'volume',()=>Boolean(host.getStatus()));
  function render(){
    const state=host.getState(),status=host.getStatus();
    // Wiki time is chapter-relative. Canonical frame alone selects its preview.
    const index=config.kind==='slides'?state.slide:config.kind==='video'?0:Math.max(0,config.scenes.findLastIndex(scene=>scene.startFrame<=state.frame));
    const position=status?.position??(config.kind==='frames'?(state.frame-config.scenes[index].startFrame)/config.fps:config.kind==='video'?state.position:state.positions?.[state.slide===3?1:0]??0);
    if(index!==displayed){
      positionEditor.cancel();volumeEditor.cancel();displayed=index;
      slides.forEach((slide,i)=>{slide.hidden=i!==index;});
      document.querySelectorAll('[data-slide]').forEach(dot=>{
        if(Number(dot.dataset.slide)===index)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');
      });
      if(config.kind==='frames'){
        byId('scene-preview').src=config.scenes[index].image;
        byId('scene-preview').alt=`Ruhende Vorschau: ${config.scenes[index].title}`;
      }else if(config.kind==='slides'){
        byId('next-label').textContent=config.nextLabels[index];
        byId('position-label').textContent=`${index+1} / ${slides.length} · ${index%2?'Filmszene':'Filmvorstellung'}`;
      }
      if(config.kind==='slides'&&index%2){
        const stage=document.querySelectorAll('.video-stage')[Math.floor(index/2)];
        // Never detach active controls on a heartbeat (native pointer gestures).
        if(tools.parentElement!==stage)stage.append(tools,byId('connection'));
      }
    }
    if(!status){positionEditor.cancel();volumeEditor.cancel();}
    for(const button of tools.querySelectorAll('button'))button.disabled=!status;
    setIcon(byId('play'),status?.playing?'Pause':'Play');label(byId('play'),status?.playing?'Pause':'Abspielen');
    setIcon(byId('stop'),'Square');byId('stop').disabled=!status?.duration;
    if(byId('previous')){setIcon(byId('previous'),'ArrowLeft');byId('previous').disabled=!status||!status.canPrevious;}
    if(byId('next')){if(config.kind==='frames')setIcon(byId('next'),'ArrowRight');byId('next').disabled=!status||(config.kind==='frames'&&!status.canNext);}
    const fullscreen=byId('fullscreen');setIcon(fullscreen,status?.fullscreen?'Minimize':'Maximize');
    label(fullscreen,config.kind==='frames'?(status?.fullscreen?'Room-Vollbild verlassen':'Room-Vollbild'):(status?.fullscreen?'Video-Vollbild verlassen':'Video im Room als Vollbild'));
    fullscreen.setAttribute('aria-pressed',String(Boolean(status?.fullscreen)));
    const loudness=volumeEditor.value(status?.volume??1);
    setIcon(byId('mute'),loudness===0?'VolumeX':'Volume2');label(byId('mute'),loudness===0?'Ton einschalten':'Ton ausschalten');
    byId('mute').setAttribute('aria-pressed',String(loudness===0));
    document.querySelectorAll('[data-play]').forEach(button=>{button.hidden=Boolean(status?.playing);button.disabled=!status;});
    document.querySelectorAll('[data-slide]').forEach(button=>{button.disabled=!status;});
    tools.hidden=config.kind==='slides'&&index%2===0;
    const connection=byId('connection');
    connection.textContent=status?.error||(status?.playing?'Wiedergabe im Room Canvas':status?'Room-Wiedergabe pausiert':'Material im Room Canvas zeigen');
    connection.hidden=tools.hidden||Boolean(status&&!status.error);
    seek.disabled=!status?.duration;seek.max=String(status?.duration||1);
    paintPosition(positionEditor.value(position),status?.duration??0);
    volume.disabled=!status;
    if(Number(volume.value)!==loudness)volume.value=String(loudness);
  }
  if(byId('previous'))byId('previous').onclick=()=>send({type:'previous'});
  if(byId('next'))byId('next').onclick=()=>{if(config.kind==='slides'&&displayed===3)choose(0);else send({type:'next'});};
  byId('fullscreen').onclick=()=>send({type:'fullscreen',value:!host.getStatus()?.fullscreen});
  byId('stop').onclick=()=>{positionEditor.hold(0);send({type:'seek',value:0});render();};
  document.querySelectorAll('[data-playback-command="play"],[data-play]').forEach(button=>{button.onclick=()=>{
    positionEditor.cancel();send({type:host.getStatus()?.playing?'pause':'play'});
  };});
  byId('mute').onclick=()=>{
    const value=volumeEditor.value(host.getStatus()?.volume??1);if(value>0)lastVolume=value;
    const target=value===0?lastVolume:0;volumeEditor.hold(target);send({type:'volume',value:target});render();
  };
  function choose(slide){
    if(!host.getStatus())return;
    window.tafelraumLive.applyState({...host.getState(),slide});
    window.dispatchEvent(new CustomEvent('tafelraum:statechange'));
  }
  document.querySelectorAll('[data-slide]').forEach(button=>{button.onclick=()=>choose(Number(button.dataset.slide));});
  window.addEventListener('tafelraum:controller-change',render);
  document.addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,select,[contenteditable="true"]')||event.altKey||event.metaKey||event.ctrlKey)return;
    const button=event.key==='ArrowRight'?byId('next'):event.key==='ArrowLeft'?byId('previous'):event.key.toLowerCase()==='f'?byId('fullscreen')
      :event.key===' '&&!event.target.closest('button,a')&&!tools.hidden?byId('play'):null;
    if(button&&!button.disabled){event.preventDefault();button.click();}
  });
  render();
})();
