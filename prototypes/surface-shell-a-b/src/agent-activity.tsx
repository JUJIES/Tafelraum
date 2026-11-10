import {useCallback,useEffect,useLayoutEffect,useRef,useState,type Ref} from 'react';
import {Bot,Check,ChevronRight,LoaderCircle,TriangleAlert} from 'lucide-react';
import {agentSuccessMs,createAgentWorkTracker,hasArchivedMaterial,type ActivityEvidence,type Work} from './agent-work';
import {t} from './i18n/translate';

type Phase = 'working'|'done'|'error';
type Activity = {id:string;lessonId:string;label:string;phase:Phase;until:number;imageCount?:number};
export type ShowActivity = (lessonId:string,id:string,label:string|null,phase?:Phase,deadline?:number,evidence?:ActivityEvidence)=>void;

export function useAgentActivity(){
  const [items,setItems]=useState<Activity[]>([]);
  const itemsRef=useRef(items);itemsRef.current=items;
  const tracker=useRef(createAgentWorkTracker());
  const [,setWorkRevision]=useState(0);
  const updateWork=useCallback(()=>setWorkRevision(v=>v+1),[]);
  const beginWork=(lessonId:string,start:()=>Work)=>{
    if(itemsRef.current.some(item=>item.lessonId===lessonId&&item.phase==='working'&&item.until>Date.now()))throw new Error('Vor Beginn laufenden Arbeitsschritt abschließen.');
    const work=start();
    setItems(old=>old.filter(item=>item.lessonId!==lessonId));
    return work;
  };
  const disconnectWork=useCallback(()=>{tracker.current.disconnect();updateWork();},[updateWork]);
  const show=useCallback<ShowActivity>((lessonId,id,label,phase='working',deadline=Date.now()+30000,evidence)=>{
    tracker.current.observe(lessonId,id,label,phase,deadline,evidence);
    const until=phase==='done'?Date.now()+agentSuccessMs:phase==='error'?Infinity:deadline;
    setItems(old=>{
      const next=old.filter(item=>{
        if(item.lessonId!==lessonId)return true;
        if(item.id===id)return false;
        return phase!=='working'||item.phase==='working';
      });
      return label?[...next,{lessonId,id,label,phase,until,imageCount:evidence?.imageCount}]:next;
    });
  },[]);
  useEffect(()=>{
    const expiry=Math.min(...items.map(item=>item.until));
    if(!Number.isFinite(expiry))return;
    const timer=setTimeout(()=>setItems(old=>old.flatMap(item=>{
      if(item.until>Date.now())return [item];
      if(item.phase==='done')return [];
      return [{...item,phase:'error' as const,label:'Ergebnis unbestätigt',until:Infinity}];
    })),Math.max(0,expiry-Date.now()));
    return ()=>clearTimeout(timer);
  },[items]);
  const works=tracker.current.visible();
  useEffect(()=>{
    const deadline=Math.min(...works.map(w=>w.until));
    if(!Number.isFinite(deadline))return;
    const timer=setTimeout(updateWork,Math.max(0,deadline-Date.now()));
    return ()=>clearTimeout(timer);
  });
  const byLesson=new Map<string,Activity>();
  for(const item of items){
    const previous=byLesson.get(item.lessonId);
    if(!previous || previous.phase!=='working' || item.phase==='working')byLesson.set(item.lessonId,item);
  }
  for(const work of works){
    const current=byLesson.get(work.lessonId);
    if(work.outcome!=='active'&&current&&!work.operations.has(current.id))continue;
    // A phase bridges successful steps; actual active/error steps take precedence.
    if(work.outcome!=='active'||!current||current.phase==='done'||(current.phase==='error'&&work.operations.has(current.id))){
      const failed=[...work.operations.values()].find(op=>op.phase==='error');
      const label=failed?.evidence?.source==='canvas'&&hasArchivedMaterial(work)
        ?'Material archiviert · Canvas noch nicht bestätigt':failed?.label;
      byLesson.set(work.lessonId,work.outcome==='active'&&label?{...work,phase:'error',label}:work);
    }
  }
  const visible=[...byLesson.values()];
  const featured=visible.find(item=>item.phase==='working')??
    visible.filter(item=>item.phase==='done').reduce<Activity|undefined>(
      (latest,item)=>!latest||latest.until<item.until?item:latest,undefined)??visible.at(-1);
  return {show,byLesson,featured,work:tracker.current,updateWork,disconnectWork,beginWork};
}

export function AgentActivityMark({item,compact=false,target}:{item:Activity;compact?:boolean;target?:string}){
  const Icon=item.phase==='error'?TriangleAlert:item.phase==='done'?Check:compact?LoaderCircle:Bot;
  const label=t(item.label,item.imageCount??0);
  return <span className={'agent-activity '+(compact?'agent-activity-row':'agent-activity-heading')} data-state={item.phase} title={target?`${label} · ${target}`:label} role={compact?undefined:'status'}>
    <Icon size={compact?15:17} className={compact&&item.phase==='working'?'agent-activity-spin':undefined} aria-hidden="true"/>
    {compact?<span className="agent-activity-sr">{label}</span>:<span className="agent-activity-copy">
      <span className="agent-activity-label">{label}</span>{target&&<small>{target}</small>}
    </span>}
  </span>;
}

export function AgentActivityDock({item,target,onOpenTarget,dockRef}:{
  item?: Activity;
  target?: string;
  onOpenTarget?: () => void;
  dockRef: Ref<HTMLDivElement>;
}){
  const [lastVisible,setLastVisible]=useState<{item:Activity;target?:string}>();
  useLayoutEffect(()=>{
    if(item){
      setLastVisible({item,target});
      return;
    }
    const exitDelay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:240;
    const timer=window.setTimeout(()=>setLastVisible(undefined),exitDelay);
    return ()=>window.clearTimeout(timer);
  },[item,target]);

  const shown=item?{item,target}:lastVisible;
  return <div className="agent-activity-dock" ref={dockRef} data-visible={Boolean(item)}
    aria-hidden={!item} inert={!item}>
    {shown&&(shown.target
      ?<button className="agent-activity-field" type="button" onClick={onOpenTarget}
          aria-label={t('Agentenziel öffnen: {0}',shown.target)}>
          <AgentActivityMark item={shown.item} target={shown.target}/>
          <ChevronRight size={14} className="agent-activity-arrow" aria-hidden="true"/>
        </button>
      :<div className="agent-activity-field"><AgentActivityMark item={shown.item}/></div>)}
  </div>;
}
export type LessonActivities = ReadonlyMap<string,Activity>;
