// Ephemeral playback only. Semantic position remains in the existing state bridge.
export function validPlaybackCommand(value) {
  if (!value || typeof value !== 'object') return false;
  if (['play','pause','previous','next'].includes(value.type)) return Object.keys(value).length === 1;
  if(value.type==='fullscreen')return Object.keys(value).length===2&&typeof value.value==='boolean';
  return ['seek','volume'].includes(value.type) && Object.keys(value).length === 2
    && Number.isFinite(value.value) && value.value >= 0 && value.value <= (value.type === 'volume' ? 1 : 86400);
}

export function validPlaybackStatus(value) {
  return Boolean(value && typeof value === 'object' && typeof value.title === 'string' && value.title.length <= 200
    && Object.keys(value).every(key=>['title','playing','canPrevious','canNext','position','duration','volume','fullscreen','error','timelinePosition'].includes(key))
    && (value.fullscreen===undefined||typeof value.fullscreen==='boolean')
    && ['playing','canPrevious','canNext'].every(key => typeof value[key] === 'boolean')
    && ['position','duration','volume'].every(key => Number.isFinite(value[key]) && value[key] >= 0)
    && (value.timelinePosition===undefined||Number.isFinite(value.timelinePosition)&&value.timelinePosition>=0&&value.timelinePosition<=86400)
    && value.position <= 86400 && value.duration <= 86400 && value.volume <= 1
    && (value.error === undefined || typeof value.error === 'string' && value.error.length <= 500));
}

export function playbackCapability(value) {
  if (value == null) return null;
  if (value.protocol !== 'room-v1' || !value.initialState || typeof value.initialState !== 'object'
    || Array.isArray(value.initialState) || JSON.stringify(value.initialState).length > 32768)
    throw new Error('HTML-Wiedergabe benötigt room-v1 und einen begrenzten initialState.');
  const entry=value.controllerEntry;
  if(entry!==undefined&&(typeof entry!=='string'||entry.length>200||!/^[-a-zA-Z0-9_./]+\.html$/.test(entry)
    ||entry.startsWith('/')||entry.split('/').some(part=>!part||part==='.'||part==='..')))
    throw new Error('HTML-Lehreransicht benötigt einen paketlokalen HTML-Pfad.');
  if(value.teacherView!==undefined&&value.teacherView!=='shared')throw new Error('Ungültige HTML-Lehreransicht.');
  return {teacherView:'shared',protocol:'room-v1',initialState:JSON.parse(JSON.stringify(value.initialState)),...(entry?{controllerEntry:entry}:{})};
}

// Serialized into the sandboxed output iframe. Only its actual parent grants a lease.
export function installPlaybackOutput(validCommand, validStatus, local = false) {
  let token = null, expires = 0, sequence = 0, error = '', lastApi = null, pendingFullscreen = null;
  const api = () => window.tafelraumPlayback;
  const target=()=>api()?.getFullscreenTarget?.()??document.documentElement;
  const isFullscreen=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement
    ||target()?.webkitDisplayingFullscreen||target()?.webkitPresentationMode==='fullscreen');
  const changeFullscreen=async active=>{
    if(active===isFullscreen())return;
    const element=target();
    if(!element?.isConnected||element.ownerDocument!==document)throw new Error('Ungültiges Vollbildziel');
    if(active){
      if(typeof element.webkitEnterFullscreen==='function')element.webkitEnterFullscreen();
      else await element.requestFullscreen();
    }else if(element.webkitDisplayingFullscreen||element.webkitPresentationMode==='fullscreen')element.webkitExitFullscreen();
    else if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.webkitFullscreenElement)document.webkitExitFullscreen();
  };
  const send = data => window.parent.postMessage({type:'tafelraum:playback-output',...data},'*');
  const cancelFullscreen=()=>{
    if(!pendingFullscreen)return;
    const pending=pendingFullscreen;pendingFullscreen=null;clearTimeout(pending.timer);
    pending.reject(new Error('Vollbildbefehl nicht mehr aktuell'));
  };
  const requestFullscreen=active=>{
    const native=window.webkit?.messageHandlers?.tafelraumFullscreen;
    if(!active||!native)return changeFullscreen(active);
    cancelFullscreen();
    return new Promise((resolve,reject)=>{
      const id=crypto.randomUUID();
      const timer=setTimeout(()=>{if(pendingFullscreen?.id===id){pendingFullscreen=null;reject(new Error('Native Vollbildantwort fehlt'));}},1800);
      pendingFullscreen={id,token,sequence,timer,resolve,reject};
      try{native.postMessage(id);}catch(error){pendingFullscreen=null;clearTimeout(timer);reject(error);}
    });
  };
  window.addEventListener('tafelraum:native-fullscreen',event=>{
    const pending=pendingFullscreen;
    if(!pending||event.detail!==pending.id)return;
    if(token!==pending.token||sequence!==pending.sequence||Date.now()>expires){cancelFullscreen();return;}
    pendingFullscreen=null;clearTimeout(pending.timer);
    // Runs synchronously inside WKWebView's frame-specific native callback.
    // Only this previously validated command can use the activation.
    changeFullscreen(true).then(pending.resolve,pending.reject);
  });
  const pause = () => { try { const result=api()?.execute({type:'pause'}); result?.catch?.(()=>{}); } catch {} };
  const revoke = () => {
    const owned=token;token=null;expires=0;
    cancelFullscreen();
    if(isFullscreen())void changeFullscreen(false).catch(()=>{});
    try {if(owned||api()?.getStatus().playing)pause();}catch{pause();}
  };
  window.addEventListener('message', async event => {
    if (event.source !== window.parent || event.data?.type !== 'tafelraum:playback-host') return;
    const message=event.data;
    if(local&&message.type==='tafelraum:playback-host'&&message.action==='handoff'){
      try {await api()?.execute({type:'pause'});
        send({handoff:message.handoff,state:window.tafelraumLive?.getState()});
      } catch {send({handoff:message.handoff,error:true});}
      return;
    }
    if(message.action==='release'){revoke();return;}
    if(message.action==='lease' && typeof message.token==='string' && /^[0-9a-f-]{36}$/i.test(message.token)) {
      if(token!==message.token){pause();sequence=0;error='';}
      token=message.token;expires=Date.now()+2400;
      return;
    }
    if(message.action!=='command'||!token||message.token!==token||Date.now()>expires
      ||!Number.isSafeInteger(message.sequence)||message.sequence<=sequence||!validCommand(message.command))return;
    cancelFullscreen();sequence=message.sequence;const owned=token;error='';
    try {
      if(message.command.type==='fullscreen')await requestFullscreen(message.command.value);
      else {
        if(message.state!==undefined){
          await window.tafelraumLive?.applyState(message.state);
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          if(token!==owned||sequence!==message.sequence||Date.now()>expires)return;
        }
        await api()?.execute(message.command,message.state);
      }
    }
    catch { if(token===owned&&sequence===message.sequence)error=message.command.type==='fullscreen'
      ?'Vollbild wurde blockiert. Bitte die Vollbildtaste im Videoplayer im Room verwenden.'
      :'Wiedergabe blockiert. Bitte einmal im Room-Fenster auf Abspielen klicken.'; }
    // A late play promise may settle after its owner disappeared.
    if(token!==owned||Date.now()>expires)pause();
  });
  const tick=()=>{
    const current=api();
    if(local)return;
    if(current!==lastApi){lastApi=current;pause();}
    if(!token||Date.now()>expires){revoke();send({ready:Boolean(current)});return;}
    try {
      const status=current?.getStatus();
      if(validStatus(status))send({token,status:{...status,fullscreen:isFullscreen(),...(error?{error}:{})}});
    } catch {send({token,error:'Der HTML-Player konnte nicht gelesen werden.'});}
  };
  const timer=local?null:setInterval(tick,100);tick();
  if(!local){window.tafelraumPresentation={isFullscreen,toggleFullscreen:()=>{
    // Direct package buttons retain the real Room user gesture. Teacher commands
    // still arrive through the bounded, source/token/sequence-checked host path.
    if(token&&Date.now()<=expires)void changeFullscreen(!isFullscreen()).catch(()=>{
      error='Vollbild wurde blockiert. Bitte die Vollbildtaste im Videoplayer im Room verwenden.';
    });
  }};
  const changed=()=>window.dispatchEvent(new CustomEvent('tafelraum:presentation-change'));
  for(const event of ['fullscreenchange','webkitfullscreenchange','webkitbeginfullscreen','webkitendfullscreen','webkitpresentationmodechanged'])document.addEventListener(event,changed,true);
  window.dispatchEvent(new CustomEvent('tafelraum:presentation-ready'));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&isFullscreen()){event.preventDefault();void changeFullscreen(false).catch(()=>{});}
  },true);
  }
  window.addEventListener('pagehide',()=>{clearInterval(timer);revoke();});
  // Direct interaction remains possible, but not after losing the output lease.
  document.addEventListener('play',()=>{if(!local&&(!token||Date.now()>expires))pause();},true);
}

export function playbackOutputScript(local = false) {
  return `<script>(${installPlaybackOutput.toString()})(${validPlaybackCommand.toString()},${validPlaybackStatus.toString()},${local})</script>`;
}

// Explicit shared packages keep their original UI. The package uses this bridge
// to render silently from the single Room output and delegate playback actions.
export function installSilentHtmlMedia(){
  const silent=()=>document.querySelectorAll('audio,video').forEach(media=>{if(!media.muted)media.muted=true;});
  document.addEventListener('play',silent,true);document.addEventListener('volumechange',silent,true);
  const Media=window.HTMLMediaElement;
  if(Media?.prototype.play){const play=Media.prototype.play;Media.prototype.play=function(...args){this.muted=true;return Reflect.apply(play,this,args);};}
  for(const name of ['AudioContext','webkitAudioContext']){
    const Native=window[name];if(typeof Native!=='function')continue;
    window[name]=class extends Native{
      constructor(...args){super(...args);void this.suspend().catch(()=>{});}
      resume(){return this.suspend();}
    };
  }
  const observer=new MutationObserver(silent);observer.observe(document.documentElement,{childList:true,subtree:true});silent();
  const dispose=()=>{observer.disconnect();document.removeEventListener('play',silent,true);document.removeEventListener('volumechange',silent,true);};
  window.addEventListener('pagehide',dispose);return dispose;
}
export function playbackSilentScript(){return `<script>(${installSilentHtmlMedia.toString()})()</script>`;}

export function installSharedPlayback(validStatus,validCommand,silence) {
  const stopSilence=silence();
  let status=null,lastSeen=0,packageFollowsStatus=false,following=false,interaction=0,followInteraction=0;
  let previousPlaying=null,intentScheduled=false,expected=null;
  let pending=[];
  const changed=()=>window.dispatchEvent(new CustomEvent('tafelraum:mirror-change'));
  let delegatedInteraction=-1;
  const send=(command,state)=>{
    if(!validCommand(command))return;
    if(state!==undefined){try{if(new TextEncoder().encode(JSON.stringify(state)).byteLength>65536)return;}catch{return;}}
    if(!status){pending.push({command,state,at:Date.now()});pending=pending.slice(-4);return;}
    if(['play','pause'].includes(command.type))expected={playing:command.type==='play',title:window.tafelraumPlayback?.getStatus()?.title,until:Date.now()+2500};
    window.parent.postMessage({type:'tafelraum:playback-command',command,state},'*');
  };
  const mirror={isApplying:()=>!packageFollowsStatus&&following&&interaction===followInteraction,getStatus:()=>{packageFollowsStatus=true;return status;},command(command,state){
    delegatedInteraction=interaction;send(command,state);
  }};
  window.tafelraumPlaybackMirror=mirror;
  window.tafelraumPresentation={isFullscreen:()=>Boolean(status?.fullscreen),toggleFullscreen:()=>{
    window.tafelraumPlaybackMirror.command({type:'fullscreen',value:!status?.fullscreen});
  }};
  // Older packages already expose getStatus/execute and semantic state. Adapt
  // that same API centrally; packages consuming Mirror status use their native
  // renderer integration instead. No package-name or DOM snapshot special case.
  const intent=()=>{
    if(packageFollowsStatus||interaction===delegatedInteraction)return;
    const api=window.tafelraumPlayback,current=api?.getStatus();if(!validStatus(current))return;
    send({type:current.playing?'play':'pause'},window.tafelraumLive?.getState());
    if(status&&current.volume!==status.volume)send({type:'volume',value:current.volume});
  };
  const follow=()=>{
    if(packageFollowsStatus||intentScheduled||pending.length)return;
    if(expected&&Date.now()<expected.until){if(expected.playing!==status?.playing||expected.title!==status?.title)return;expected=null;}else expected=null;
    const api=window.tafelraumPlayback,current=api?.getStatus();if(!validStatus(current))return;
    following=true;followInteraction=interaction;
    if(!status){void api.execute({type:'pause'});}
    else if(current.title===status.title){
      if(Math.abs(current.position-status.position)>(status.playing ? .6 : .1))void api.execute({type:'seek',value:status.position});
      if(status.playing!==api.getStatus().playing)void api.execute({type:status.playing?'play':'pause'});
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>{following=false;}));
  };
  for(const type of ['pointerdown','keydown','input'])document.addEventListener(type,()=>{interaction++;},true);
  for(const type of ['click','change','keydown'])document.addEventListener(type,event=>{
    if(!packageFollowsStatus&&(event.target?.closest?.('button,input[type=range],select,video')||type==='keydown'&&[' ','ArrowLeft','ArrowRight'].includes(event.key))){
      intentScheduled=true;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{intentScheduled=false;intent();}));
    }
  },true);
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.data?.type!=='tafelraum:playback-status')return;
    status=event.data.connected===true&&validStatus(event.data.status)?event.data.status:null;
    lastSeen=Date.now();
    if(status&&pending.length){const queued=pending;pending=[];for(const entry of queued)if(Date.now()-entry.at<2500)send(entry.command,entry.state);}
    follow();changed();
  });
  const timer=setInterval(()=>{
    if(status&&Date.now()-lastSeen>2500){status=null;follow();changed();}
    const waiting=pending.length;pending=pending.filter(entry=>Date.now()-entry.at<2500);
    if(waiting&&!pending.length&&!status)follow();
    if(!packageFollowsStatus&&!following&&!expected){
      const local=window.tafelraumPlayback?.getStatus();
      if(validStatus(local)&&previousPlaying!==null&&previousPlaying!==local.playing&&local.playing!==status?.playing)intent();
      previousPlaying=local?.playing??null;
    }
  },350);
  window.addEventListener('pagehide',()=>{clearInterval(timer);stopSilence();});
}
export function playbackSharedScript(){
  return `<script>(${installSharedPlayback.toString()})(${validPlaybackStatus.toString()},${validPlaybackCommand.toString()},${installSilentHtmlMedia.toString()})</script>`;
}
