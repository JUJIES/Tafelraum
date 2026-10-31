import { t, useUiLocale } from "./i18n";
import {useCallback,useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import QRCode from 'qrcode';
import './mobile-capture.css';

type CaptureStatus={configured:boolean;revision:number;lastReceivedLessonId:string|null;session:null|{
  lessonId:string;title:string;expiresAt:number;inviteUrl:string;connected:boolean;savedCount:number;error:string|null;
}};
export function useMobileCapture() {
  const [state,setState]=useState<CaptureStatus>({configured:false,revision:0,lastReceivedLessonId:null,session:null});
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const commandRevision=useRef(0);
  const commandPending=useRef(false);
  const receiving=state.session!==null;
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    const poll=async()=>{
      const basis=commandRevision.current;
      try {
        const response=await fetch('/api/mobile-capture/status',{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error(t("Empfang nicht verfügbar."));
        const next=await response.json() as CaptureStatus;
        if(!controller.signal.aborted&&basis===commandRevision.current)setState(next);
        if(next.session&&!controller.signal.aborted)timer=setTimeout(poll,1500);
      } catch {if(!controller.signal.aborted)timer=setTimeout(poll,3000);}
    };
    void poll();return()=>{controller.abort();clearTimeout(timer);};
  },[receiving]);
  const change=useCallback(async(lessonId:string|null)=>{
    if(commandPending.current)return false;
    commandPending.current=true;
    commandRevision.current++;
    setBusy(true);setError(null);
    try{
      const response=await fetch('/api/mobile-capture/session',{
        method:lessonId?'POST':'DELETE',headers:{'Content-Type':'application/json'},
        ...(lessonId?{body:JSON.stringify({lessonId})}:{}),
      });
      const value=await response.json();
      if(!response.ok)throw new Error(value.error||t("Empfang nicht verfügbar."));
      setState(value as CaptureStatus);
      return true;
    }catch(cause){setError(cause instanceof Error?cause.message:"Empfang nicht verfügbar.");return false;}
    finally{commandRevision.current++;commandPending.current=false;setBusy(false);}
  },[]);
  return {state,busy,error,change};
}
export function MobileCaptureControls({capture,open,onClose,lessonId,lessonTitle}:{
  capture:ReturnType<typeof useMobileCapture>;open:boolean;onClose():void;lessonId:string;lessonTitle:string;
}){
  useUiLocale();
  const dialog=useRef<HTMLDialogElement>(null);
  const [qr,setQr]=useState<string|null>(null);
  const session=capture.state.session;
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(open&&!element.open)element.showModal();else if(!open&&element.open)element.close();
  },[open]);
  useEffect(()=>{
    let active=true;setQr(null);
    if(session?.inviteUrl)void QRCode.toDataURL(session.inviteUrl,{width:320,margin:2,errorCorrectionLevel:'M',color:{dark:'#152331',light:'#ffffff'}})
      .then(value=>{if(active)setQr(value);}).catch(()=>{});
    return()=>{active=false;};
  },[session?.inviteUrl]);
  return <dialog ref={dialog} className="mobile-capture-dialog" aria-labelledby="capture-dialog-title"
    onCancel={onClose} onClose={onClose} onKeyDown={event=>event.stopPropagation()}>
    <header><h2 id="capture-dialog-title">{t("Bild übertragen")}</h2><button type="button" onClick={onClose} aria-label={t("Schließen")}><X aria-hidden="true"/></button></header>
    <p className="mobile-capture-target">{session?.title??lessonTitle}</p>
    {session&&<>
      {qr&&<img className="mobile-capture-qr" src={qr} alt={t("QR-Code zum Senden von Aufnahmen in diese Stunde")}/>}
      <p role="status">{session.error?t(session.error):(session.connected?t("Verbunden"):t("Verbinden …"))}{session.savedCount>0&&t(" · {0} gespeichert", session.savedCount)}</p>
      <button className="mobile-capture-stop" type="button" disabled={capture.busy} onClick={async()=>{if(await capture.change(null))onClose();}}>{t("Empfang beenden")}</button>
    </>}
    {!session&&capture.busy&&<p role="status">{t("Verbinden …")}</p>}
    {!session&&capture.error&&<button className="mobile-capture-start" type="button" disabled={capture.busy} onClick={()=>void capture.change(lessonId)}>{t("Erneut versuchen")}</button>}
    {capture.error&&<p className="mobile-capture-error" role="alert">{t(capture.error)}</p>}
  </dialog>;
}
