import {releaseAgentSession} from './agent-session';
import { t } from "./i18n/translate.ts";
import {useEffect,useRef} from 'react';
import {teachingAgentPrefix,readTeachingAgentCommand,type TeachingCommand} from '../teaching-agent-protocol.mjs';

/** App-lifetime connection: a lesson switch must not discard its own acknowledgement. */
export function useTeachingAgent(ready:boolean,execute:(command:TeachingCommand,expiresAt:number)=>Promise<unknown>,disconnected:()=>void){
  const latest=useRef(execute);latest.current=execute;
  useEffect(()=>{
    if(!ready)return;
    let closed=false,session:{id:string;token:string}|null=null,retry:ReturnType<typeof setTimeout>|undefined;
    const controller=new AbortController();
    const release=()=>{if(session){releaseAgentSession(teachingAgentPrefix,session);session=null;}};
    const onPageHide=(event:PageTransitionEvent)=>{if(!event.persisted)release();};
    window.addEventListener('pagehide',onPageHide);
    async function request(path:string,body:unknown,token?:string,method='POST',signal:AbortSignal|undefined=controller.signal){
      const response=await fetch(teachingAgentPrefix+path,{method,headers:{'Content-Type':'application/json','X-Tafelraum-Agent':'1',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
      if(!response.ok)throw new Error(t("Organisationsanschluss ({0})", response.status));
      return response.json();
    }
    async function run(){
      try{
        session=await request('/hosts',{lessonId:'teacher',title:'Unterricht organisieren'},undefined,'POST',AbortSignal.timeout(5000));
        if(closed){release();return;}
        while(!closed&&session){
          const {job,activities=[]}=await request(`/sessions/${session.id}/poll`,{},session.token);
          if(closed)break;
          for(const value of activities){const notice=readTeachingAgentCommand(value);if(notice.type==='materialActivity')await latest.current(notice,Date.now()+30000);}
          if(!job)continue;
          let result;
          try{
            if(closed||Date.now()>job.expiresAt)throw new Error('Organisationsauftrag abgelaufen.');
            result=await latest.current(readTeachingAgentCommand(job.command),job.expiresAt);
          }catch(error){result={ok:false,error:error instanceof Error?error.message:String(error)};}
          if(closed)break;
          await request(`/sessions/${session.id}/jobs/${job.id}`,result,session.token,'PUT');
        }
      }catch{release();disconnected();if(!closed)retry=setTimeout(()=>void run(),5000);}
    }
    void run();
    return()=>{closed=true;clearTimeout(retry);controller.abort();window.removeEventListener('pagehide',onPageHide);release();disconnected();};
  },[ready,disconnected]);
}
