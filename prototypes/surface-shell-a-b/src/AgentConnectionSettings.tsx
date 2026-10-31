import { t, useUiLocale } from "./i18n";
import {useRef,useState} from 'react';
import {Bot,X} from 'lucide-react';
export function AgentConnectionSettings(){
  useUiLocale();
 const dialog=useRef<HTMLDialogElement>(null),text=useRef<HTMLTextAreaElement>(null);
 const [kit,setKit]=useState<{prompt:string;promptTemplate?:string;promptValues?:string[]}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 const prompt=kit?.promptTemplate&&kit.promptValues?t(kit.promptTemplate,...kit.promptValues):kit?.prompt??'';
 const open=async()=>{
  dialog.current?.showModal();setKit(null);setError('');setCopied(false);setBusy(true);
  try{
   const response=await fetch('/api/agent-kit',{headers:{'X-Tafelraum-Agent':'1'},signal:AbortSignal.timeout(10000)});
   const data=await response.json();
   if(!response.ok)throw Error(data.error??t("Agentenpaket nicht verfügbar."));
   if(data.protocol!=='tafelraum-agent-kit-v1'||typeof data.prompt!=='string')throw Error(t("Agentenpaket nicht verfügbar."));
   setKit({prompt:data.prompt,...(typeof data.promptTemplate==='string'&&Array.isArray(data.promptValues)&&data.promptValues.every((value:unknown)=>typeof value==='string')?{promptTemplate:data.promptTemplate,promptValues:data.promptValues}:{})});
  }catch(reason){setError(reason instanceof Error?reason.message:"Agentenpaket nicht verfügbar.");}
  finally{setBusy(false);}
 };
 const copy=async()=>{
  try{await navigator.clipboard.writeText(prompt);setCopied(true);}
  catch{text.current?.focus();text.current?.select();setError("Bitte den ausgewählten Text kopieren.");}
 };
 return <>
  <button className="settings-option" type="button" onClick={()=>void open()}><span>{t("Agent verbinden")}</span><Bot size={21} aria-hidden="true"/></button>
  <dialog className="shortcut-help agent-connection-dialog" ref={dialog} aria-labelledby="agent-connection-title" onKeyDown={event=>{event.stopPropagation();}}>
   <header><h2 id="agent-connection-title">{t("Agent verbinden")}</h2><button className="action-button icon-only" type="button" aria-label={t("Agentenverbindung schließen")} onClick={()=>dialog.current?.close()}><X size={22}/></button></header>
   <div className="agent-connection-body">
   <p>{t("Gib den Startauftrag einem Agenten mit Datei- und Werkzeugzugriff auf diesen Rechner. Tafelraum liefert Anleitungen, HTML-Prüfer und Beispiele mit.")}</p>
   {busy&&<p role="status">{t("Wird geladen …")}</p>}
   {prompt&&<><label htmlFor="agent-start-prompt">{t("Startauftrag für deinen Agenten")}</label><textarea ref={text} id="agent-start-prompt" readOnly value={prompt} spellCheck={false}/><p>{t("Der erste Schritt liest nur die Verbindung. Materialerstellung, Archivübernahme und Canvasvorbereitung beauftragst du danach. Ein Cloudchat allein kann nicht auf deine lokale App zugreifen.")}</p></>}
   {error&&<p role="alert">{t(error)}</p>}
   <footer><button className="action-button" type="button" disabled={!prompt||busy} onClick={()=>void copy()}>{copied?t("Kopiert"):t("Startauftrag kopieren")}</button></footer>
   </div>
  </dialog>
 </>;
}
