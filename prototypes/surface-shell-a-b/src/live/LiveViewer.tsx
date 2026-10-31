import { t, useUiLocale } from "../i18n";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { applyInkPreviewPatch, defaultPresentation, type JsonValue, type LiveInteractiveMaterial, type Presentation, type JoinResponse, type Scene, type ServerMessage } from "../../../../shared/live-canvas/protocol";
import { ViewerFullscreenButton } from "./ViewerFullscreenButton";
import { createHostPointerChannel } from "./host-pointer-channel";
import { ViewerStagePending } from "./ViewerStagePending";
import { discardCommittedInkPreviews } from "./viewer-elements";

const CanvasViewer = lazy(() => import("./LiveViewerCanvas"));

export function LiveViewer() {
  useUiLocale();
  const inviteId = /^\/join\/([A-Za-z0-9_-]{1,128})\/?$/.exec(window.location.pathname)?.[1] ?? "";
  const storageKey = `live-canvas-participant:${inviteId}`;
  const [name, setName] = useState("");
  const [participation, setParticipation] = useState<JoinResponse | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [renderVersion,setRenderVersion]=useState(0);
  const [presentation, setPresentation] = useState<Presentation>(defaultPresentation);
  const controlRef = useRef({ generation: 0, presentation: defaultPresentation });
  const sceneRef = useRef<Scene | null>(null);
  const inkPreviews=useRef(new Map<string,{revision:number;element:Scene['elements'][number]}>());
  const [hostPointer] = useState(createHostPointerChannel);
  const [state, setState] = useState<"join" | "idle" | "waiting" | "live" | "ended" | "removed">("join");
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [hostConnected, setHostConnected] = useState(true);
  const [publicationReady, setPublicationReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const join = useCallback(async (enteredName: string, resume?: JoinResponse) => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/live/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteId, name: enteredName.trim(), ...(resume ? { resumeToken: resume.token, resumeRoomId: resume.roomId } : {}) }) });
      if (!response.ok) {
        const failure = await response.json().catch(() => ({})) as { error?: string };
        if (failure.error === "participation_expired") {
          sessionStorage.removeItem(storageKey); setName(""); setState("join");
          setError("Bitte gib deinen Namen erneut ein."); return;
        }
        if ((response.status === 401 || response.status === 403) && resume) { setState("removed"); return; }
        throw new Error(response.status === 404 || response.status === 410 ? t("Dieser Link ist nicht mehr gültig.") : response.status === 429 ? t("Bitte versuche es gleich noch einmal.") : t("Beitreten fehlgeschlagen."));
      }
      const result = await response.json() as JoinResponse;
      try { sessionStorage.setItem(storageKey, JSON.stringify(result)); } catch { /* No durable identity is required to join. */ }
      setParticipation(result); setState("waiting");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Verbindung fehlgeschlagen."); }
    finally { setBusy(false); }
  }, [inviteId, storageKey]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as JoinResponse | null;
      if (saved?.token && saved.name) { setName(saved.name); void join(saved.name, saved); }
    } catch { /* A corrupt transient browser entry is not a participant identity. */ }
  }, [join, storageKey]);

  useEffect(() => {
    // Warm the renderer while the group gathers, keeping the name entry small.
    if (participation) void import("./LiveViewerCanvas").catch(() => {});
  }, [participation]);

  useEffect(() => {
    if (!participation) return;
    let disposed = false;
    let socket: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let frame = 0;
    let lastMessageAt = Date.now();
    const composeScene=(next:Scene)=>{
      if(!inkPreviews.current.size)return next;
      const present=new Set(next.elements.map(element=>element.id));
      return {...next,elements:[...next.elements.map(element=>inkPreviews.current.get(element.id)?.element??element),
        ...[...inkPreviews.current.values()].filter(preview=>!present.has(preview.element.id)).map(preview=>preview.element)]};
    };
    const queueScene=(bump=false)=>{
      if(bump)setRenderVersion(value=>value+1);
      if(!frame)frame=requestAnimationFrame(()=>{frame=0;setScene(sceneRef.current?composeScene(sceneRef.current):null);});
    };
    const updateScene = (next: Scene) => {
      if (next.presentation && next.generation >= controlRef.current.generation
        && next.presentation.revision >= controlRef.current.presentation.revision) {
        controlRef.current = {generation:next.generation,presentation:next.presentation};
        setPresentation(next.presentation);
      }
      if (next.generation !== sceneRef.current?.generation) {hostPointer.set(null);inkPreviews.current.clear();}
      sceneRef.current = next;
      queueScene();
    };
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/live/socket`);
      socketRef.current = socket;
      socket.onopen = () => {
        lastMessageAt = Date.now();
        socket.send(JSON.stringify({ type: "auth", roomId: participation.roomId, token: participation.token, protocolVersion: 1, supportsDiff: true, supportsInlineRasters: true, supportsPresentation: true, supportsClipMotion: true, supportsViewportClips: true, supportsInteractiveMaterials: true, supportsPatches:true, supportsTimerWidgets: true, supportsFreePresentation: true }));
        heartbeat = setInterval(() => {
          if (Date.now() - lastMessageAt > 45000) socket.close();
          else if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
        }, 15000);
      };
      socket.onmessage = (event) => {
        if (disposed) return;
        lastMessageAt = Date.now();
        let message: ServerMessage;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === "presentation") {
          const previous = controlRef.current;
          if (message.generation < previous.generation || message.presentation.revision < previous.presentation.revision) return;
          controlRef.current = message; setPresentation(message.presentation); hostPointer.set(null);
          if (sceneRef.current && message.generation > sceneRef.current.generation) {
            cancelAnimationFrame(frame); frame = 0; sceneRef.current = null; setScene(null); setPublicationReady(false);
          }
        } else if (message.type === "status") {
          if (message.state !== "live" || !message.hostConnected || !message.publicationReady) hostPointer.set(null);
          setConnected(true); setError(null); setHostConnected(message.hostConnected);
          setPublicationReady(message.publicationReady);
          if (message.state === "idle") {
            controlRef.current = { generation: 0, presentation: defaultPresentation }; setPresentation(defaultPresentation);
            inkPreviews.current.clear();
            cancelAnimationFrame(frame); frame = 0; sceneRef.current = null; setScene(null);
          }
          setState(message.state);
        } else if (message.type === "snapshot") {
          if (message.generation < controlRef.current.generation) return;
          if (message.presentation && message.presentation.revision >= controlRef.current.presentation.revision) {
            controlRef.current = {generation: message.generation, presentation: message.presentation}; setPresentation(message.presentation);
          }
          const current = sceneRef.current;
          if (!current || message.generation > current.generation || (message.generation === current.generation && message.revision >= current.revision)) {
            // A complete canonical snapshot is also the recovery boundary for
            // expendable ink previews, including when their end packet dropped.
            inkPreviews.current.clear(); updateScene(message);
          }
          setState("live"); setConnected(true); setError(null);
        } else if (message.type === "diff") {
          const current = sceneRef.current;
          if (!current || current.generation !== message.generation || current.revision !== message.baseRevision) {
            socket.send(JSON.stringify({ type: "resync" })); return;
          }
          const elements = new Map(current.elements.map((element) => [element.id, element]));
          message.removed.forEach((id) => elements.delete(id));
          message.elements.forEach((element) => elements.set(element.id, element));
          // A canonical upsert/removal for the same object supersedes its
          // transient preview even if the separate end packet is congested.
          discardCommittedInkPreviews(inkPreviews.current,message.elements,message.removed);
          updateScene({ ...message, elements: message.order.map((id) => elements.get(id)!).filter(Boolean) });
        } else if(message.type==='patch'){
          const current=sceneRef.current;
          if(!current||current.generation!==message.generation)return;
          if(message.channel==='material'){
            const materials=current.materials??[],index=materials.findIndex(material=>material.instanceId===message.id);
            if(index<0||materials[index].stateRevision!==message.baseRevision){socket.send(JSON.stringify({type:'resync'}));return;}
            const next=[...materials];next[index]={...next[index],stateRevision:message.revision,state:message.state};
            updateScene({...current,materials:next});
          }else{
            try{
              const next=applyInkPreviewPatch(inkPreviews.current.get(message.id),message);
              if(next)inkPreviews.current.set(message.id,next);else inkPreviews.current.delete(message.id);
            }catch{inkPreviews.current.delete(message.id);}
            queueScene(true);
          }
        } else if (message.type === "pointer") {
          if (message.generation === sceneRef.current?.generation) hostPointer.set(message);
        } else if (message.type === "camera") {
          const current = sceneRef.current;
          if (current && current.generation === message.generation && current.revision === message.revision) updateScene({ ...current, viewport: message.viewport });
        } else if (message.type === "ended" || message.type === "removed" || message.type === "left") {
          disposed = true; cancelAnimationFrame(frame); hostPointer.set(null); inkPreviews.current.clear();
          setState(message.type === "left" ? "join" : message.type); setScene(null); sceneRef.current = null; socket.close(); clearInterval(heartbeat);
          // Preserve revoked identity on removal, so refresh cannot silently rejoin.
          if (message.type !== "removed") { try { sessionStorage.removeItem(storageKey); } catch { /* Optional cache. */ } }
          if (message.type === "left") { setParticipation(null); setName(""); setError(null); }
        } else if (message.type === "error") {
          if (["unauthorized", "forbidden", "not_found"].includes(message.code)) {
            disposed = true; cancelAnimationFrame(frame); hostPointer.set(null); inkPreviews.current.clear();
            setState(message.code === "not_found" ? "ended" : "removed"); setScene(null); sceneRef.current = null; socket.close(); clearInterval(heartbeat);
            if (message.code === "not_found" && participation.meeting) {
              try { sessionStorage.removeItem(storageKey); } catch { /* Optional cache. */ }
              setParticipation(null); setName(""); setState("join"); setError("Bitte gib deinen Namen erneut ein.");
            }
          } else setError("Verbindung fehlgeschlagen.");
        }
      };
      socket.onclose = (event) => {
        hostPointer.set(null); inkPreviews.current.clear(); queueScene(true);
        clearInterval(heartbeat); setConnected(false);
        if (!disposed && event.code === 4002) {
          disposed = true; cancelAnimationFrame(frame); setScene(null); sceneRef.current = null;
          setState("ended"); setError("Bitte lade die Seite neu, um die aktuelle Live-Ansicht zu verwenden.");
        }
        if (!disposed && event.code === 4001) {
          disposed = true; cancelAnimationFrame(frame); setScene(null); sceneRef.current = null;
          setState("ended"); setError("Diese Teilnahme ist in einem anderen Fenster geöffnet.");
        }
        if (!disposed) retryTimer = setTimeout(connect, 1800);
      };
    };
    connect();
    return () => { disposed = true; socketRef.current = null; hostPointer.set(null); inkPreviews.current.clear(); clearTimeout(retryTimer); clearInterval(heartbeat); cancelAnimationFrame(frame); socket?.close(); };
  }, [participation, storageKey, attempt, hostPointer]);

  const preparing = <ViewerStagePending connected={connected} hostConnected={hostConnected} choosingClip={presentation.mode === "clip" && !presentation.clip} error={error}/>;
  const sendMaterialAction = (material:LiveInteractiveMaterial,nextState:JsonValue) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN || !sceneRef.current || sceneRef.current.generation !== scene?.generation) return;
    socketRef.current.send(JSON.stringify({type:'materialAction',generation:scene.generation,instanceId:material.instanceId,baseStateRevision:material.stateRevision,state:nextState}));
  };
  if (state === "live" && scene && participation) return <Suspense fallback={preparing}><CanvasViewer key={scene.generation} scene={scene} renderVersion={renderVersion} participation={participation} connected={connected} hostConnected={hostConnected} publicationReady={publicationReady} presentation={presentation} hostPointer={hostPointer} materialBaseUrl={`/api/live/rooms/${participation.roomId}/materials`} onMaterialAction={sendMaterialAction}/></Suspense>;
  if(state === "live" && !scene) return preparing;
  const terminal = state === "ended" || state === "removed";
  return <main className="live-entry">
    <div className="live-entry-brand"><span className="live-dot" aria-hidden="true"/>Live Canvas</div>
    {!terminal && inviteId && <ViewerFullscreenButton/>}
    <section className="live-entry-content">
      {state === "join" && inviteId ? <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) void join(name); }}>
        <h1>{t("Wer bist du?")}</h1>
        <label htmlFor="live-name">{t("Dein Name")}</label>
        <input id="live-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="given-name" maxLength={80} required autoFocus disabled={busy}/>
        <button className="live-primary" type="submit" disabled={!name.trim() || busy}>{busy ? t("Wird verbunden …") : t("Beitreten")}</button>
      </form> : <>
        <h1>{state === "removed" ? t("Du wurdest aus Live Canvas entfernt.") : state === "ended" ? t("Live Canvas wurde beendet.") : !inviteId ? t("Öffne deinen Einladungslink.") : state === "idle" ? t("Noch kein Canvas gestartet.") : state === "live" ? (presentation.mode === "clip" && !presentation.clip ? t("Der Host wählt einen Clip.") : t("Ansicht wird geladen …")) : t("Gleich geht’s los.")}</h1>
        {participation && !terminal && <p className="live-own-name">{participation.name}</p>}
        {participation && !terminal && <button className="live-change-name" disabled={!connected} onClick={() => socketRef.current?.send(JSON.stringify({ type: "leave" }))}>{t("Name ändern")}</button>}
        {(state === "idle" || state === "waiting") && !connected && <p className="live-muted" role="status">{t("Verbindung wird hergestellt …")}</p>}
      </>}
      {error && <div className="live-entry-error" role="alert">{t(error)}{participation && <button onClick={() => setAttempt((value) => value + 1)}>{t("Erneut versuchen")}</button>}</div>}
    </section>
  </main>;
}
