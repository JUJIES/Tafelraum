import {releaseAgentSession} from './agent-session';
import { t } from "./i18n/translate.ts";
import {useEffect} from 'react';
import type {CanvasPort} from './canvas/canvas-port';
import {loadLessonMaterials} from './lesson-materials';
import {resolveAgentMaterials} from './canvas/agent-materials';
import {readCanvasAgentCommand} from '../canvas-agent-protocol.mjs';
import type {ShowActivity} from './agent-activity';
const base='/api/canvas-agent';
async function request(path:string,body:unknown,token?:string,signal?:AbortSignal,method='POST'){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Tafelraum-Agent':'1',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
 if(!response.ok)throw new Error(t("Agentanschluss ({0})", response.status));return response.json();
}
/** Only mounted in the teacher shell. No connection or commands in Room/Remote/HTML. */
export function useCanvasAgent(port:CanvasPort|null,lessonId:string,title:string,show:ShowActivity){
 useEffect(()=>{
  if(!port)return;
  let closed=false,session:{id:string;token:string}|null=null,retry:ReturnType<typeof setTimeout>|undefined;
  let clearPreview:(()=>void)|undefined;
  let activeJob:string|null=null;
  const controller=new AbortController();
  const release=()=>{if(session){releaseAgentSession(base,session);session=null;}};
  const onPageHide=(event:PageTransitionEvent)=>{if(!event.persisted)release();};
  window.addEventListener('pagehide',onPageHide);
  const run=async()=>{
   try{
    session=await request('/hosts',{lessonId,title},undefined,AbortSignal.timeout(5000));
    if(closed){release();return;}
    while(!closed&&session){
     const {job}=await request(`/sessions/${session.id}/poll`,{},session.token,controller.signal);
     if(!job)continue;
     let result,imageCount=0;
     try{
      const command=readCanvasAgentCommand(job.command);
      if(closed||Date.now()>job.expiresAt)throw new Error('Agentauftrag ist abgelaufen oder die Stunde wurde gewechselt.');
      if(command.type==='inspect'){
       const collection=await loadLessonMaterials(lessonId);
       result={ok:true,applied:false,state:port.inspectAgentCanvas(),lessonId,title,materials:collection.materials.map(m=>({path:m.path,name:m.displayName??m.name,kind:m.kind}))};
      }else{
       activeJob=job.id;
       show(lessonId,job.id,command.type==='clip'?'Ordnet die Clips':'Ordnet den Canvas','working',job.expiresAt);
       const materialSignal=AbortSignal.any([controller.signal,AbortSignal.timeout(Math.max(1,job.expiresAt-Date.now()))]);
       const placements=command.type==='apply'?command.operations.filter(op=>op.type==='material'):[];
       const materials=await resolveAgentMaterials(lessonId,placements,items=>{
         if(closed||Date.now()>=job.expiresAt)return;
         if(items.length&&items.every(item=>item.kind==='image')){
           const count=items.length;
           show(lessonId,job.id,count===1?'Platziert 1 Bild':'Platziert {0} Bilder','working',job.expiresAt,{source:'canvas',imageCount:count});
         }
         clearPreview=port.previewAgentMaterials(items);
         window.setTimeout(clearPreview,Math.max(0,job.expiresAt-Date.now()));
       },materialSignal);
       if(closed||Date.now()>job.expiresAt)throw new Error('Agentauftrag ist abgelaufen oder die Stunde wurde gewechselt.');
       const pictureKeys=placements.filter(op=>{
         const material=materials.get(op.path);
         return material?.kind==='images'&&material.assets.every(asset=>asset.source.kind==='image');
       }).map(op=>op.key);
       const applied=await port.executeAgentCommand(command,materials,job.expiresAt,()=>{
         clearPreview?.();clearPreview=undefined;
         show(lessonId,job.id,'Speichert den Canvas','working',job.expiresAt);
       });
       imageCount=pictureKeys.reduce((sum,key)=>sum+(applied.created?.[key]?.length??0),0);
       result=applied;
      }
     }catch(error){result={ok:false,applied:false,persisted:false,error:error instanceof Error?error.message:String(error)};}
     clearPreview?.();clearPreview=undefined;
     if(closed)break;
     if(activeJob){
       const saved=result.ok&&result.persisted;
       show(lessonId,activeJob,saved?(imageCount===1?'Canvas gespeichert · 1 Bild':imageCount?'Canvas gespeichert · {0} Bilder':'Canvas gespeichert'):
         result.applied?'Übernommen · noch nicht gespeichert':'Nicht übernommen',saved?'done':'error',undefined,
         {source:'canvas',imageCount:saved?imageCount:undefined});
       activeJob=null;
     }
     await request(`/sessions/${session.id}/jobs/${job.id}`,result,session.token,controller.signal,'PUT');
    }
   }catch{if(!closed)retry=setTimeout(()=>void run(),5000);}
  };
  void run();
  return ()=>{closed=true;clearPreview?.();if(activeJob)show(lessonId,activeJob,'Ergebnis unbestätigt','error');clearTimeout(retry);controller.abort();window.removeEventListener('pagehide',onPageHide);release();};
 },[port,lessonId,title,show]);
}
