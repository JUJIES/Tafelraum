import { t } from "./i18n/translate.ts";
import {useEffect} from 'react';
import type {CanvasPort} from './canvas/canvas-port';
import {loadLessonMaterials} from './lesson-materials';
import {resolveAgentMaterials} from './canvas/agent-materials';
import {readCanvasAgentCommand} from '../canvas-agent-protocol.mjs';
const base='/api/canvas-agent';
async function request(path:string,body:unknown,token?:string,signal?:AbortSignal,method='POST'){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Tafelraum-Agent':'1',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
 if(!response.ok)throw new Error(t("Agentanschluss ({0})", response.status));return response.json();
}
/** Only mounted in the teacher shell. No connection or commands in Room/Remote/HTML. */
export function useCanvasAgent(port:CanvasPort|null,lessonId:string,title:string){
 useEffect(()=>{
  if(!port)return;
  let closed=false,session:{id:string;token:string}|null=null,retry:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();
  const run=async()=>{
   try{
    session=await request('/hosts',{lessonId,title},undefined,controller.signal);
    while(!closed&&session){
     const {job}=await request(`/sessions/${session.id}/poll`,{},session.token,controller.signal);
     if(!job)continue;
     let result;
     try{
      const command=readCanvasAgentCommand(job.command);
      if(closed||Date.now()>job.expiresAt)throw new Error('Agentauftrag ist abgelaufen oder die Stunde wurde gewechselt.');
      if(command.type==='inspect'){
       const collection=await loadLessonMaterials(lessonId);
       result={ok:true,applied:false,state:port.inspectAgentCanvas(),lessonId,title,materials:collection.materials.map(m=>({path:m.path,name:m.displayName??m.name,kind:m.kind}))};
      }else{
       const materials=await resolveAgentMaterials(lessonId,command.type==='apply'?command.operations.flatMap(op=>op.type==='material'?[op.path]:[]):[]);
       if(closed||Date.now()>job.expiresAt)throw new Error('Agentauftrag ist abgelaufen oder die Stunde wurde gewechselt.');
       result=await port.executeAgentCommand(command,materials,job.expiresAt);
      }
     }catch(error){result={ok:false,applied:false,persisted:false,error:error instanceof Error?error.message:String(error)};}
     if(closed)break;
     await request(`/sessions/${session.id}/jobs/${job.id}`,result,session.token,controller.signal,'PUT');
    }
   }catch{if(!closed)retry=setTimeout(()=>void run(),5000);}
  };
  void run();
  return ()=>{closed=true;clearTimeout(retry);controller.abort();if(session)void request(`/sessions/${session.id}/poll`,undefined,session.token,undefined,'DELETE').catch(()=>{});};
 },[port,lessonId,title]);
}
