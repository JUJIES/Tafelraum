import { t } from "./i18n/translate.ts";
import {useEffect,useRef} from 'react';
import {teachingAgentPrefix,readTeachingAgentCommand,type TeachingCommand} from '../teaching-agent-protocol.mjs';

/** App-lifetime connection: a lesson switch must not discard its own acknowledgement. */
export function useTeachingAgent(ready:boolean,execute:(command:TeachingCommand,expiresAt:number)=>Promise<unknown>){
  const latest=useRef(execute);latest.current=execute;
  useEffect(()=>{
    if(!ready)return;
    let closed=false,session:{id:string;token:string}|null=null,retry:ReturnType<typeof setTimeout>|undefined;
    const controller=new AbortController();
    async function request(path:string,body:unknown,token?:string,method='POST',signal:AbortSignal|undefined=controller.signal){
      const response=await fetch(teachingAgentPrefix+path,{method,headers:{'Content-Type':'application/json','X-Tafelraum-Agent':'1',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
      if(!response.ok)throw new Error(t("Organisationsanschluss ({0})", response.status));
      return response.json();
    }
    async function run(){
      try{
        session=await request('/hosts',{lessonId:'teacher',title:'Unterricht organisieren'});
        while(!closed&&session){
          const {job}=await request(`/sessions/${session.id}/poll`,{},session.token);
          if(!job)continue;
          let result;
          try{
            if(closed||Date.now()>job.expiresAt)throw new Error('Organisationsauftrag abgelaufen.');
            result=await latest.current(readTeachingAgentCommand(job.command),job.expiresAt);
          }catch(error){result={ok:false,error:error instanceof Error?error.message:String(error)};}
          if(closed)break;
          await request(`/sessions/${session.id}/jobs/${job.id}`,result,session.token,'PUT');
        }
      }catch{if(!closed)retry=setTimeout(()=>void run(),5000);}
    }
    void run();
    return()=>{closed=true;clearTimeout(retry);controller.abort();if(session)void request(`/sessions/${session.id}/poll`,undefined,session.token,'DELETE',AbortSignal.timeout(2000)).catch(()=>{});};
  },[ready]);
}
