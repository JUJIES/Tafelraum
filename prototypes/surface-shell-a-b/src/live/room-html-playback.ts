import type {JsonValue,Scene} from '../../../../shared/live-canvas/protocol.ts';
import type {RoomInteractiveMaterial} from '../canvas/interactive-html-live.ts';
import {reportHtmlPlayback,subscribeHtmlPlayback} from '../canvas/interactive-html-live.ts';
import {validPlaybackCommand,validPlaybackStatus,type PlaybackCommand} from '../../interactive-html-playback.mjs';

export type RoomPlaybackMessage={type:'html-playback';channel:string;generation:number;instanceId:string;token?:string;status?:unknown;command?:unknown};
export type HostPlaybackMessage={type:'html-playback-host';channel:string;generation:number;instanceId:string;action:'lease'|'release'|'command';token?:string;sequence?:number;command?:PlaybackCommand;state?:JsonValue};
export function visiblePlaybackMaterials(scene:Scene|null):RoomInteractiveMaterial[]{
  if(!scene)return [];
  const bounds=scene.presentation?.mode==='clip'?scene.presentation.clip:scene.viewport;
  if(!bounds)return [];
  return (scene.materials as RoomInteractiveMaterial[]??[]).filter(material=>material.roomPlayback&&material.roomLocalId
    &&!(material.cover?.width===1&&material.cover?.height===1)
    &&material.x<bounds.x+bounds.width&&material.x+material.width>bounds.x
    &&material.y<bounds.y+bounds.height&&material.y+material.height>bounds.y);
}

/** One lease per visible output; teacher/preview never load the media renderer. */
export class RoomHtmlPlaybackHost {
  private leases=new Map<string,{localId:string;token:string;sequence:number;lastStatus:number}>();
  private timer:ReturnType<typeof setInterval>;
  private unsubscribe:()=>void;
  private channel:BroadcastChannel;
  private channelId:string;
  private getScene:()=>Scene|null;
  private paused=new Map<string,()=>void>();
  private draining=false;
  constructor(channel:BroadcastChannel,channelId:string,getScene:()=>Scene|null){
    this.channel=channel;this.channelId=channelId;this.getScene=getScene;
    this.unsubscribe=subscribeHtmlPlayback((localId,command,state)=>{
      if(this.draining)return;
      const found=[...this.leases].find(([,lease])=>lease.localId===localId);
      if(!found||!visiblePlaybackMaterials(this.getScene()).some(material=>material.instanceId===found[0]))return;
      const [instanceId,lease]=found;
      this.send({instanceId,action:'command',token:lease.token,sequence:++lease.sequence,command,...(state===undefined?{}:{state})});
    });
    this.timer=setInterval(()=>this.tick(),500);
  }
  private send(message:Omit<HostPlaybackMessage,'type'|'channel'|'generation'>){
    const scene=this.getScene();if(!scene)return;
    this.channel.postMessage({type:'html-playback-host',channel:this.channelId,generation:scene.generation,...message});
  }
  private tick(){
    const visible=visiblePlaybackMaterials(this.getScene());
    for(const [id,lease] of this.leases){
      if(!visible.some(material=>material.instanceId===id)){
        this.send({instanceId:id,action:'release'});reportHtmlPlayback(lease.localId,null);this.leases.delete(id);
      }else{
        this.send({instanceId:id,action:'lease',token:lease.token});
        if(Date.now()-lease.lastStatus>2000)reportHtmlPlayback(lease.localId,null);
      }
    }
  }
  receive(message:RoomPlaybackMessage){
    const scene=this.getScene();
    if(!scene||message.generation!==scene.generation)return;
    const material=visiblePlaybackMaterials(scene).find(material=>material.instanceId===message.instanceId);
    if(!material?.roomLocalId)return;
    let lease=this.leases.get(message.instanceId);
    if(lease&&message.token===lease.token&&validPlaybackCommand(message.command)&&message.command.type==='fullscreen'){
      this.send({instanceId:message.instanceId,action:'command',token:lease.token,sequence:++lease.sequence,command:message.command});return;
    }
    if(!message.token){
      if(this.draining)return;
      // An unloaded/reloaded output must get a new lease; delayed commands die with the old one.
      if(lease)reportHtmlPlayback(lease.localId,null);
      lease={localId:material.roomLocalId,token:crypto.randomUUID(),sequence:0,lastStatus:Date.now()};
      this.leases.set(message.instanceId,lease);
      this.send({instanceId:message.instanceId,action:'lease',token:lease.token});return;
    }
    if(lease&&message.token===lease.token&&validPlaybackStatus(message.status)){
      lease.lastStatus=Date.now();reportHtmlPlayback(lease.localId,message.status);
      if(!message.status.playing)this.paused.get(message.instanceId)?.();
    }
  }
  get hasOutputs(){return this.leases.size>0;}
  async pauseAndFlush(){
    this.draining=true;
    await Promise.all([...this.leases].map(([instanceId,lease])=>new Promise<void>(resolve=>{
      const finish=()=>{clearTimeout(timer);this.paused.delete(instanceId);resolve();};
      const timer=setTimeout(finish,650);this.paused.set(instanceId,finish);
      this.send({instanceId,action:'command',token:lease.token,sequence:++lease.sequence,command:{type:'pause'}});
    })));
  }
  clear(){
    for(const [id,lease] of this.leases){this.send({instanceId:id,action:'release'});reportHtmlPlayback(lease.localId,null);}
    this.leases.clear();
  }
  dispose(){this.clear();clearInterval(this.timer);this.unsubscribe();}
}

/** Actual Room window only. Source identity is matched to a visible package iframe. */
export function installRoomHtmlPlaybackReceiver(channel:BroadcastChannel,channelId:string,getScene:()=>Scene|null){
  const materialFrame=(id:string)=>{
    const material=visiblePlaybackMaterials(getScene()).find(material=>material.instanceId===id);
    if(!material)return null;
    return [...document.querySelectorAll<HTMLIFrameElement>('[data-room-material-id] iframe')]
      .find(frame=>frame.closest<HTMLElement>('[data-room-material-id]')?.dataset.roomMaterialId===material.roomLocalId)??null;
  };
  const receive=(event:MessageEvent)=>{
    if(event.data?.type!=='tafelraum:playback-output')return;
    const scene=getScene();if(!scene)return;
    const material=visiblePlaybackMaterials(scene).find(value=>materialFrame(value.instanceId)?.contentWindow===event.source);
    if(!material)return;
    if(!event.data.token&&event.data.ready!==true)return;
    const fullscreenCommand=validPlaybackCommand(event.data.command)&&event.data.command.type==='fullscreen';
    if(event.data.token&&!fullscreenCommand&&!validPlaybackStatus(event.data.status))return;
    channel.postMessage({type:'html-playback',channel:channelId,generation:scene.generation,instanceId:material.instanceId,
      ...(event.data.token?{token:event.data.token,...(fullscreenCommand?{command:event.data.command}:{status:event.data.status})}:{})});
  };
  window.addEventListener('message',receive);
  return {
    receive(message:HostPlaybackMessage){
      if(message.generation!==getScene()?.generation)return;
      // Releases also reach newly hidden frames, before React removes them.
      const frame=message.action==='release'
        ?[...document.querySelectorAll<HTMLIFrameElement>('[data-room-material-id] iframe')].find(frame=>{
          const material=(getScene()?.materials as RoomInteractiveMaterial[]??[]).find(value=>value.instanceId===message.instanceId);
          return material&&frame.closest<HTMLElement>('[data-room-material-id]')?.dataset.roomMaterialId===material.roomLocalId;
        }):materialFrame(message.instanceId);
      frame?.contentWindow?.postMessage({...message,type:'tafelraum:playback-host'},'*');
    },
    dispose(){window.removeEventListener('message',receive);},
  };
}
