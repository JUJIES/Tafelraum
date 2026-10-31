import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CAPTURE_LIMITS, captureId, newSecret } from '../../shared/mobile-capture/protocol.mjs';

class CaptureError extends Error {
  constructor(status, code) { super(code); this.status = status; }
}
const same = (a,b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left=Buffer.from(a),right=Buffer.from(b);
  return left.length===right.length&&timingSafeEqual(left,right);
};
function json(response,status,value) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});
  response.end(JSON.stringify(value));
}
async function body(request,maximum) {
  const advertised = Number(request.headers['content-length']);
  if (Number.isFinite(advertised) && (advertised < 1 || advertised > maximum)) throw new CaptureError(413,'too_large');
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximum) throw new CaptureError(413,'too_large');
    chunks.push(chunk);
  }
  if (!size) throw new CaptureError(400,'invalid_request');
  return Buffer.concat(chunks,size);
}
const jsonBody = async request => {
  try { return JSON.parse((await body(request,12_288)).toString('utf8')); }
  catch (error) { if (error instanceof CaptureError) throw error; throw new CaptureError(400,'invalid_request'); }
};

export function createCaptureRelay({adminKey,publicUrl,now = Date.now,limits = CAPTURE_LIMITS}) {
  if (!captureId(adminKey)) throw new Error('Invalid capture configuration.');
  let origin = new URL(publicUrl).origin;
  const sessions = new Map();
  let reservedBytes = 0;
  const auth = (request,token) => {
    if (!same(request.headers.authorization,`Bearer ${token}`)) throw new CaptureError(403,'forbidden');
  };
  const finishTransfer = (session,status,value) => {
    const pending = session.pending;
    if (!pending) return;
    session.pending = null;
    reservedBytes -= pending.bytes.length;
    for (const response of pending.waiters) json(response,status,value);
  };
  const end = (session,code = 'closed') => {
    sessions.delete(session.id);
    finishTransfer(session,410,{error:code});
    if (session.poll) { json(session.poll,410,{error:code}); session.poll = null; }
  };
  const connected = session => Boolean(session.poll) || session.lastSeen + limits.receiverGraceMs > now();
  const deliver = session => {
    if (!session.poll || !session.pending) return;
    const response = session.poll; session.poll = null;
    session.lastSeen = now();
    response.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':session.pending.bytes.length,'X-Capture-Transfer':session.pending.id});
    response.end(session.pending.bytes);
  };
  const maintain = () => {
    for (const session of sessions.values()) {
      if (session.expiresAt <= now()) { end(session,'expired'); continue; }
      if (session.poll && session.pollAt + limits.pollMs <= now()) { json(session.poll,204,null); session.poll = null; }
      if (session.pending && session.pending.startedAt + limits.transferMs <= now()) finishTransfer(session,504,{error:'transfer_timeout'});
    }
  };
  const timer = setInterval(maintain,250); timer.unref();
  const staticFiles = new Map([
    ['/capture.js',new URL('./web/capture.js',import.meta.url)],
    ['/capture.css',new URL('./web/capture.css',import.meta.url)],
    ['/protocol.mjs',new URL('../../shared/mobile-capture/protocol.mjs',import.meta.url)],
  ]);
  const handle = async (request,response) => {
    response.setHeader('Cache-Control','no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Referrer-Policy','no-referrer');
    response.setHeader('X-Frame-Options','DENY');
    response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' blob:; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    response.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
    try {
      if (request.headers.origin && request.headers.origin !== origin) throw new CaptureError(403,'forbidden');
      const path = new URL(request.url,'http://relay.local').pathname;
      if (path === '/health' && request.method === 'GET') { json(response,200,{ok:true}); return; }
      if (path === '/api/capture/sessions' && request.method === 'POST') {
        auth(request,adminKey); maintain();
        if (sessions.size >= limits.sessions) throw new CaptureError(429,'capacity');
        const value = await jsonBody(request);
        if (typeof value.target !== 'string' || !/^[A-Za-z0-9_-]{28,8192}$/.test(value.target)) throw new CaptureError(400,'invalid_request');
        const session = {id:newSecret(),hostToken:newSecret(),senderToken:newSecret(),target:value.target,expiresAt:now()+limits.sessionMs,lastSeen:-Infinity,receipts:new Map(),pending:null,poll:null};
        sessions.set(session.id,session);
        json(response,201,{id:session.id,hostToken:session.hostToken,senderToken:session.senderToken,expiresAt:session.expiresAt}); return;
      }
      const match = /^\/api\/capture\/sessions\/([A-Za-z0-9_-]{22,80})(?:\/(next|transfers)(?:\/([A-Za-z0-9_-]{22,80})(?:\/(ack))?)?)?$/.exec(path);
      if (match) {
        maintain();
        const [,id,route,transferId,ack] = match;
        const session = sessions.get(id);
        if (!session) throw new CaptureError(410,'closed');
        const host = route === 'next' || ack || request.method === 'DELETE' || request.method === 'HEAD';
        auth(request,host ? session.hostToken : session.senderToken);
        if (!route && request.method === 'HEAD') { session.lastSeen=now(); response.writeHead(200); response.end(); return; }
        if (!route && request.method === 'GET') { json(response,200,{target:session.target,expiresAt:session.expiresAt,receiverConnected:connected(session)}); return; }
        if (!route && request.method === 'DELETE') { end(session); json(response,200,{closed:true}); return; }
        if (route === 'next' && request.method === 'GET') {
          if (session.poll) json(session.poll,409,{error:'superseded'});
          session.lastSeen = now(); session.pollAt = now(); session.poll = response;
          response.on('close',() => { if (session.poll === response) session.poll = null; });
          deliver(session); return;
        }
        if (route === 'transfers' && transferId && ack && request.method === 'POST') {
          session.lastSeen = now();
          const value = await jsonBody(request);
          if (!['saved','rejected'].includes(value.status) || (value.status === 'saved' && (typeof value.receipt !== 'string' || !/^[A-Za-z0-9_-]{28,4096}$/.test(value.receipt)))) throw new CaptureError(400,'invalid_request');
          if (session.pending?.id !== transferId) throw new CaptureError(409,'unknown_transfer');
          const result = value.status === 'saved' ? {saved:true,receipt:value.receipt} : {error:'rejected'};
          if (value.status === 'saved') session.receipts.set(transferId,{digest:session.pending.digest,result});
          finishTransfer(session,value.status === 'saved' ? 200 : 422,result);
          json(response,200,{accepted:true}); return;
        }
        if (route === 'transfers' && transferId && !ack && request.method === 'PUT') {
          if (!connected(session) && !session.receipts.has(transferId)) throw new CaptureError(503,'receiver_offline');
          if ((session.receipts.size >= 1000 && !session.receipts.has(transferId)) || (session.pending && session.pending.id !== transferId) || session.reading) throw new CaptureError(429,'busy');
          const reservation = Number(request.headers['content-length'] ?? limits.encryptedBytes);
          if (!Number.isSafeInteger(reservation) || reservation < 28 || reservation > limits.encryptedBytes) throw new CaptureError(413,'too_large');
          if (reservedBytes + reservation > limits.totalBytes) throw new CaptureError(429,'capacity');
          session.reading = true; reservedBytes += reservation;
          let bytes;
          try { bytes = await body(request,reservation); }
          finally { session.reading = false; reservedBytes -= reservation; }
          maintain();
          if (!sessions.has(id)) throw new CaptureError(410,'closed');
          const digest = createHash('sha256').update(bytes).digest('hex');
          const receipt = session.receipts.get(transferId);
          if (receipt) {
            if (receipt.digest !== digest) throw new CaptureError(409,'transfer_conflict');
            json(response,200,receipt.result); return;
          }
          if (session.pending) {
            if (session.pending.digest !== digest) throw new CaptureError(409,'transfer_conflict');
            if (session.pending.waiters.size >= 2) throw new CaptureError(429,'busy');
          } else {
            reservedBytes += bytes.length;
            session.pending = {id:transferId,bytes,digest,startedAt:now(),waiters:new Set()};
          }
          const pending = session.pending;
          pending.waiters.add(response);
          response.on('close',() => pending.waiters.delete(response));
          deliver(session); return;
        }
        throw new CaptureError(405,'method_not_allowed');
      }
      if (request.method === 'GET' && (staticFiles.has(path) || /^\/capture\/[A-Za-z0-9_-]{22,80}$/.test(path))) {
        const file = staticFiles.get(path) ?? new URL('./web/index.html',import.meta.url);
        const content = await readFile(file);
        response.writeHead(200,{'Content-Type':path.endsWith('.css') ? 'text/css; charset=utf-8' : path.endsWith('.js') || path.endsWith('.mjs') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8'});
        response.end(content); return;
      }
      throw new CaptureError(404,'not_found');
    } catch (error) {
      if (!response.headersSent) json(response,error instanceof CaptureError ? error.status : 500,{error:error instanceof CaptureError ? error.message : 'unavailable'});
      else response.destroy();
    }
  };
  const server = createServer((request,response) => void handle(request,response));
  server.requestTimeout = 110_000;
  return {
    server, maintain,
    get publicUrl() { return origin; },
    diagnostics: () => ({sessions:sessions.size,bytes:reservedBytes}),
    async listen(port = 5841,host = '127.0.0.1') {
      await new Promise((resolve,reject) => { server.once('error',reject); server.listen(port,host,resolve); });
      if (new URL(publicUrl).port === '0') origin = `http://${host}:${server.address().port}`;
      return server.address().port;
    },
    async close() { clearInterval(timer); for (const session of sessions.values()) end(session); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const relay = createCaptureRelay({adminKey:process.env.CAPTURE_ADMIN_KEY,publicUrl:process.env.CAPTURE_PUBLIC_URL});
    await relay.listen(Number(process.env.CAPTURE_PORT ?? '5841'));
    process.stdout.write('Capture relay ready.\n');
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal,() => void relay.close().then(() => process.exit(0)));
  } catch { process.stderr.write('Capture relay failed to start.\n'); process.exitCode = 1; }
}
