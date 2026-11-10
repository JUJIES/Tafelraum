import type {WorkPhaseCommand} from '../teaching-agent-protocol.mjs';

export const workLeaseMs = 120_000;
export const agentSuccessMs = 6_000;
export type ActivityEvidence = {source:'material'|'canvas';workId?:string;materialPath?:string;imageCount?:number};
type WorkOperation = {phase:string;label:string;until:number;evidence?:ActivityEvidence};
export type Work = {id:string;lessonId:string;phase:'working'|'done'|'error';label:string;until:number;
  outcome:'active'|'finished'|'cancelled'|'unconfirmed';version:number;operations:Map<string,WorkOperation>;
  scope:'archive'|'canvas';imageCount?:number};
export const hasArchivedMaterial = (work:Work) => [...work.operations.values()].some(
  op=>op.phase==='done'&&op.evidence?.source==='material'&&op.evidence.materialPath);
/** Transient teacher-shell state only. No archive, canvas ownership or provider dependency. */
export function createAgentWorkTracker(now=()=>Date.now()){
  const works=new Map<string,Work>();
  function expire(){
    for(const work of works.values())if(work.outcome==='active'&&work.until<=now()){
      work.outcome='unconfirmed';work.phase='error';work.label='Ergebnis unbestätigt';work.until=Infinity;work.version++;
    }
  }
  function requireWork(lessonId:string,id:string){
    expire();const work=works.get(id);
    if(!work||work.lessonId!==lessonId)throw new Error('Arbeitsphase unbekannt oder falsche Zielstunde.');
    return work;
  }
  function requireActive(lessonId:string,id:string){
    const work=requireWork(lessonId,id);
    if(work.outcome!=='active')throw new Error('Arbeitsphase bereits beendet oder unbestätigt. Stand prüfen und neue Arbeitsphase starten.');
    return work;
  }
  function start(lessonId:string,id:string,scope:Work['scope'],preparation:WorkPhaseCommand['preparation']){
    expire();const existing=works.get(id);
    if(existing){
      if(existing.lessonId!==lessonId||existing.scope!==scope)throw new Error('Arbeitsphasen-ID gehört zu einer anderen Stunde oder einem anderen Umfang.');
      return existing;
    }
    if([...works.values()].some(w=>w.lessonId===lessonId&&w.outcome==='active'))throw new Error('Für diese Stunde läuft bereits eine Arbeitsphase.');
    if(works.size>=256)throw new Error('Sitzungsgrenze erreicht. Lehreransicht neu verbinden.');
    const work:Work={id,lessonId,scope,phase:'working',
      label:preparation==='images'?'Bereitet Bilder vor':'Bereitet Materialien vor',
      until:now()+workLeaseMs,outcome:'active',version:0,operations:new Map()};
    works.set(id,work);return work;
  }
  function observe(lessonId:string,id:string,label:string|null,phase:string,until:number,evidence?:ActivityEvidence){
    expire();
    for(const work of works.values())if(work.lessonId===lessonId&&work.outcome==='active'){
      if(phase!=='working'&&!work.operations.has(id))continue; // Ignore late results from another phase.
      if(evidence?.workId && evidence.workId!==work.id)continue;
      if(work.scope==='archive'&&(evidence?.source!=='material'||evidence.workId!==work.id))continue;
      // Successful later operations do not erase a failed operation in this work phase.
      work.operations.set(id,{phase:label===null?'done':phase,label:label??'',until,evidence});work.version++;
    }
  }
  function check(lessonId:string,id:string){
    const work=requireActive(lessonId,id);
    if([...work.operations.values()].some(op=>op.phase==='working'))throw new Error('Arbeitsschritte noch offen. Ergebnisse vor Abschluss prüfen.');
    if([...work.operations.values()].some(op=>op.phase==='error'))throw new Error('Arbeitsphase enthält fehlgeschlagene oder unbestätigte Schritte. Prüfen, abbrechen und neu beginnen.');
    return work.version;
  }
  function archivePaths(lessonId:string,id:string){
    const work=requireActive(lessonId,id);
    const paths=[...work.operations.values()].map(op=>op.evidence?.materialPath);
    if(!paths.length||paths.some(path=>!path))throw new Error('Kein bestätigter Materialnachweis für diese Arbeitsphase.');
    return paths as string[];
  }
  function finish(lessonId:string,id:string,version:number,confirmedPaths?:ReadonlySet<string>){
    if(check(lessonId,id)!==version)throw new Error('Arbeitsphase während des Abschlusses verändert. Erneut prüfen.');
    const work=requireActive(lessonId,id);
    if(work.scope==='archive'&&archivePaths(lessonId,id).some(path=>!confirmedPaths?.has(path)))
      throw new Error('Archiviertes Material konnte im aktuellen Bestand nicht bestätigt werden.');
    const imageCount=[...work.operations.values()].reduce((sum,op)=>sum+(op.evidence?.imageCount??0),0);
    work.outcome='finished';work.phase='done';work.imageCount=imageCount||undefined;
    work.label=work.scope==='archive'?'Material archiviert':imageCount===1?'Canvas gespeichert · 1 Bild':imageCount?'Canvas gespeichert · {0} Bilder':'Canvas gespeichert';
    work.until=now()+agentSuccessMs;
    return work;
  }
  function command(command:WorkPhaseCommand){
    const {lessonId,workId,action}=command;
    if(action==='start')return start(lessonId,workId,command.scope??'canvas',command.preparation);
    const work=requireWork(lessonId,workId);
    if(action==='cancel'){
      if(work.outcome==='finished')throw new Error('Arbeitsphase bereits abgeschlossen.');
      work.outcome='cancelled';work.phase='error';work.label='Vorbereitung abgebrochen';work.until=Infinity;work.version++;return work;
    }
    if(action!=='heartbeat')throw new Error('Abschluss benötigt bestätigte Speicherung.');
    requireActive(lessonId,workId);work.until=now()+workLeaseMs;return work;
  }
  function fail(lessonId:string,id:string,label:string){
    const work=requireWork(lessonId,id);
    if(work.outcome!=='active')return;
    work.outcome='unconfirmed';work.phase='error';work.label=label;work.until=Infinity;work.version++;
  }
  function disconnect(){for(const work of works.values())if(work.outcome==='active')work.until=now();expire();}
  function visible(){
    expire();const latest=new Map<string,Work>();
    for(const work of works.values())latest.set(work.lessonId,work);
    return [...latest.values()].filter(w=>w.until>now());
  }
  return {command,observe,check,finish,archivePaths,requireWork,visible,disconnect,fail};
}
