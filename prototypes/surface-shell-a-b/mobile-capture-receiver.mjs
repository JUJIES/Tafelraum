import { readFile } from 'node:fs/promises';
import {
  CAPTURE_LIMITS, CAPTURE_TYPES, captureId, newSecret, encryptCapture, decryptCapture,
  toBase64, fromBase64, jsonBytes, parseBytes, unpackCapture,
} from './mobile-capture-protocol.mjs';

const sleep = ms => new Promise(resolve => { const timer = setTimeout(resolve,ms); timer.unref(); });
async function readJson(request) {
  let text = '';
  for await (const chunk of request) { text += chunk; if (text.length > 4096) throw new Error('Ungültige Anfrage.'); }
  return JSON.parse(text);
}
function reply(response,status,value) {
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  response.end(JSON.stringify(value));
}
function captureLesson(archive,id) {
  const catalog=archive.catalog;
  const lesson=catalog?.lessons?.find(item=>item.id===id);
  if(!lesson||catalog.hiddenLessonIds?.includes(id))return null;
  if(catalog.trash?.some(item=>item.kind==='lesson'?item.id===id:item.kind==='series'?item.id===lesson.seriesId:item.kind==='subject'&&item.id===lesson.subjectId))return null;
  return lesson;
}
export function createMobileCaptureReceiver({configPath,getArchiveUrl,fetchImpl = fetch}) {
  let session = null, revision = 0, lastReceivedLessonId = null, commands = Promise.resolve(), disposed = false;
  const config = readFile(configPath,'utf8').then(text => {
    const value = JSON.parse(text);
    const url = new URL(value.baseUrl);
    if (!captureId(value.adminKey) || url.pathname !== '/' || url.search || url.hash || url.username || url.password
      || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)))) throw new Error('Invalid configuration.');
    return {baseUrl:url.origin,adminKey:value.adminKey};
  }).catch(() => null);
  const status = async () => ({
    configured:Boolean(await config), revision, lastReceivedLessonId,
    session:session ? {
      lessonId:session.lessonId,title:session.title,expiresAt:session.expiresAt,
      inviteUrl:session.inviteUrl,connected:session.connected,savedCount:session.savedCount,
      error:session.error,
    } : null,
  });
  async function stop() {
    const previous = session; session = null;
    if (!previous) return;
    previous.controller.abort();
    try {
      await fetchImpl(previous.url,{method:'DELETE',headers:{Authorization:`Bearer ${previous.hostToken}`},signal:AbortSignal.timeout(5000)});
    } catch { /* An offline receiver cannot accept new transfers; relay expiry is bounded. */ }
  }
  async function acknowledge(current,id,value) {
    for (let attempt = 0; attempt < 3 && session === current; attempt++) {
      try {
        const response = await fetchImpl(`${current.url}/transfers/${id}/ack`,{
          method:'POST',headers:{Authorization:`Bearer ${current.hostToken}`,'Content-Type':'application/json'},
          body:JSON.stringify(value),signal:AbortSignal.any([current.controller.signal,AbortSignal.timeout(8000)]),
        });
        if (response.ok || response.status === 409) return;
        if (response.status === 410) throw new Error('closed');
      } catch { if (current.controller.signal.aborted) return; }
      await sleep(500 * (attempt + 1));
    }
  }
  async function receive(current) {
    while (!disposed && session === current && !current.controller.signal.aborted) {
      if (Date.now() >= current.expiresAt) { await stop(); return; }
      try {
        // The relay holds this request until a transfer arrives, or for 15 s.
        const response = await fetchImpl(`${current.url}/next`,{
          headers:{Authorization:`Bearer ${current.hostToken}`},
          signal:AbortSignal.any([current.controller.signal,AbortSignal.timeout(25_000)]),
        });
        if (session !== current) return;
        if (response.status === 410 || response.status === 403) { await stop(); return; }
        if (response.status === 204) { current.connected = true; current.error = null; continue; }
        if (!response.ok) throw new Error('relay_unavailable');
        current.connected = true; current.error = null;
        const id = response.headers.get('x-capture-transfer');
        if (!captureId(id)) throw new Error('invalid_transfer');
        if (current.completed.has(id)) {
          await response.body?.cancel();
          await acknowledge(current,id,{status:'saved',receipt:current.completed.get(id)}); continue;
        }
        let receipt, rejectionMessage;
        try {
          const ciphertext = new Uint8Array(await response.arrayBuffer());
          if (ciphertext.length > CAPTURE_LIMITS.encryptedBytes) throw new Error('too_large');
          const file = unpackCapture(await decryptCapture(current.secret,`file:${current.id}:${id}`,ciphertext));
          if (session !== current || current.controller.signal.aborted || Date.now() >= current.expiresAt) return;
          const latest=await fetchImpl(`${getArchiveUrl()}/api/archive`,{signal:AbortSignal.any([current.controller.signal,AbortSignal.timeout(8000)])});
          if(!latest.ok)throw new Error('archive_unavailable');
          if(!captureLesson(await latest.json(),current.lessonId)){await stop();return;}
          const stamp = new Date(file.capturedAt).toISOString().slice(0,19).replace('T',' ').replaceAll(':','.');
          const name = file.name && CAPTURE_TYPES[file.mime]==='.docx' ? `${file.name.replace(/\.docx$/i,'')}-${id.slice(0,12)}.docx` : `Aufnahme ${stamp}Z-${id.slice(0,12)}${CAPTURE_TYPES[file.mime]}`;
          // Exact existing archive command: one writer queue, additive file write,
          // source reactivation and bytewise deduplication. No direct archive writes.
          const saved = await fetchImpl(`${getArchiveUrl()}/api/archive/lessons/${encodeURIComponent(current.lessonId)}/materials/file?${new URLSearchParams({name})}`,{
            method:'PUT',headers:{'Content-Type':file.mime},body:file.bytes,
            signal:AbortSignal.any([current.controller.signal,AbortSignal.timeout(CAPTURE_LIMITS.transferMs)]),
          });
          if (!saved.ok) {
            const failure=await saved.json().catch(()=>null);
            if(typeof failure?.error==='string')rejectionMessage=failure.error.slice(0,500);
            throw new Error('archive_unavailable');
          }
          const result = await saved.json();
          receipt = toBase64(await encryptCapture(current.secret,`receipt:${current.id}:${id}`,jsonBytes({saved:true,name:result.material.name})));
          current.completed.set(id,receipt); current.savedCount++;
          revision++; lastReceivedLessonId = current.lessonId;
          current.error = null;
        } catch {
          if (session !== current || current.controller.signal.aborted) return;
          current.error = rejectionMessage || 'Aufnahme konnte nicht gespeichert werden. Bitte erneut senden.';
          await acknowledge(current,id,{status:'rejected'}); continue;
        }
        await acknowledge(current,id,{status:'saved',receipt});
      } catch {
        if (session !== current || current.controller.signal.aborted) return;
        current.connected = false; current.error = 'Verbindung unterbrochen';
        await sleep(1500);
      }
    }
  }
  async function start(lessonId) {
    if (typeof lessonId !== 'string' || !/^[A-Za-z0-9._-]{1,160}$/.test(lessonId)) throw new Error('Ungültige Stunde.');
    if (session?.lessonId === lessonId) return status();
    const settings = await config;
    if (!settings) throw new Error('Der Handy-Empfang ist noch nicht eingerichtet.');
    const [archiveResponse,materialsResponse] = await Promise.all([
      fetchImpl(`${getArchiveUrl()}/api/archive`,{signal:AbortSignal.timeout(8000)}),
      fetchImpl(`${getArchiveUrl()}/api/archive/lessons/${encodeURIComponent(lessonId)}/materials`,{signal:AbortSignal.timeout(8000)}),
    ]);
    if (!archiveResponse.ok || !materialsResponse.ok) throw new Error('Stunde ist nicht verfügbar.');
    const archive = await archiveResponse.json(), materials = await materialsResponse.json();
    const lesson = captureLesson(archive,lessonId);
    if (!lesson || materials.basis?.scope !== 'lesson') throw new Error('Diese Stunde benötigt eine verfügbare eigene Materialablage.');
    const secret = newSecret();
    const target = toBase64(await encryptCapture(secret,'target',jsonBytes({title:lesson.title,acceptsDocx:true})));
    const response = await fetchImpl(`${settings.baseUrl}/api/capture/sessions`,{
      method:'POST',headers:{Authorization:`Bearer ${settings.adminKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({target}),signal:AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Empfang konnte nicht gestartet werden.');
    const created = await response.json();
    if (!captureId(created.id) || !captureId(created.hostToken) || !captureId(created.senderToken)
      || !Number.isFinite(created.expiresAt) || created.expiresAt <= Date.now() || created.expiresAt > Date.now()+CAPTURE_LIMITS.sessionMs+30_000) throw new Error('Ungültige Empfangsantwort.');
    await stop();
    const current = {...created,secret,lessonId,title:lesson.title,url:`${settings.baseUrl}/api/capture/sessions/${created.id}`,
      inviteUrl:`${settings.baseUrl}/capture/${created.id}#${created.senderToken}.${secret}`,
      connected:false,savedCount:0,error:null,completed:new Map(),controller:new AbortController()};
    session = current;
    try {
      const ready=await fetchImpl(current.url,{method:'HEAD',headers:{Authorization:`Bearer ${current.hostToken}`},signal:AbortSignal.timeout(8000)});
      current.connected=ready.ok;
    } catch { current.connected=false; }
    void receive(current);
    return status();
  }
  const middleware = async (request,response,next) => {
    const path = new URL(request.url,'http://localhost').pathname;
    if (!path.startsWith('/api/mobile-capture/')) { next(); return; }
    // Also protect the Vite entry point; native server has its own same guard.
    if (!['127.0.0.1','localhost'].includes((request.headers.host ?? '').split(':')[0])
      || request.headers['sec-fetch-site'] === 'cross-site') { reply(response,403,{error:'Zugriff nicht erlaubt.'}); return; }
    try {
      if (path === '/api/mobile-capture/status' && request.method === 'GET') { reply(response,200,await status()); return; }
      if (path === '/api/mobile-capture/session' && ['POST','DELETE'].includes(request.method)) {
        const value = request.method === 'POST' ? await readJson(request) : null;
        const run = async () => { if (request.method === 'POST') return start(value.lessonId); await stop(); return status(); };
        const result = commands.then(run,run); commands = result.catch(() => undefined);
        reply(response,200,await result); return;
      }
      reply(response,404,{error:'Unbekannter Empfangspfad.'});
    } catch (error) { reply(response,400,{error:error instanceof Error ? error.message : 'Empfang nicht verfügbar.'}); }
  };
  return {middleware,status,start,stop,async close() { disposed = true; await stop(); }};
}
