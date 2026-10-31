// One native media element in local/Room output; passive controller uses surface.js.
(() => {
  const video=document.querySelector('video'),error=document.getElementById('video-error');
  let position=0,applying=false;
  const publish=()=>{if(!applying)window.dispatchEvent(new CustomEvent('tafelraum:statechange'));};
  const snapshot=()=>({version:1,position:video.readyState?video.currentTime:position});
  const seek=value=>{position=value;if(video.readyState)video.currentTime=Math.min(value,video.duration);};
  video.addEventListener('loadedmetadata',()=>seek(position));
  for(const event of ['pause','seeked','ended'])video.addEventListener(event,publish);
  video.addEventListener('error',()=>{error.hidden=false;});
  window.tafelraumLive={getState:snapshot,applyState(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1
      ||Object.keys(value).some(key=>!['version','position'].includes(key))
      ||!Number.isFinite(value.position)||value.position<0||value.position>86400)return;
    applying=true;video.pause();
    if(Math.abs(snapshot().position-value.position)>.1)seek(value.position);
    applying=false;
  }};
  window.tafelraumPlayback={getFullscreenTarget:()=>video,getStatus(){
    return {title:document.title,playing:!video.paused&&!video.ended,canPrevious:false,canNext:false,
      position:snapshot().position,duration:Number.isFinite(video.duration)?video.duration:0,volume:video.volume,
      ...(video.error?{error:'Die Filmdatei konnte nicht abgespielt werden.'}:{})};
  },async execute(command){
    if(command.type==='play'){if(video.ended)seek(0);await video.play();}
    else if(command.type==='pause')video.pause();
    else if(command.type==='seek'){video.pause();seek(command.value);}
    else if(command.type==='volume')video.volume=command.value;
  }};
})();
