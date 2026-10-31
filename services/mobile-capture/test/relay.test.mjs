import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureRelay} from '../server.mjs';
import {CAPTURE_LIMITS,newSecret,encryptCapture,decryptCapture,jsonBytes,packCapture,unpackCapture,toBase64} from '../../../shared/mobile-capture/protocol.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ioAAAAASUVORK5CYII=','base64');
const bearer=token=>({Authorization:`Bearer ${token}`});
async function fixture(options={}) {
  const adminKey=newSecret();
  const relay=createCaptureRelay({adminKey,publicUrl:'http://127.0.0.1:0',...options});
  await relay.listen(0);
  const create=async()=>{
    const response=await fetch(`${relay.publicUrl}/api/capture/sessions`,{method:'POST',headers:{...bearer(adminKey),'Content-Type':'application/json'},body:JSON.stringify({target:'a'.repeat(50)})});
    assert.equal(response.status,201);return response.json();
  };
  return {relay,adminKey,create};
}
async function waitFor(predicate) {
  for(let tries=0;tries<100;tries++){if(await predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.fail('Timed out waiting for receiver.');
}

test('capture encryption authenticates the session, transfer, metadata and file type',async()=>{
  const secret=newSecret(),payload=packCapture({mime:'image/png'},png);
  const encrypted=await encryptCapture(secret,'file:session:one',payload);
  assert.equal(Buffer.from(encrypted).includes(png),false);
  const decoded=unpackCapture(await decryptCapture(secret,'file:session:one',encrypted));
  assert.deepEqual(Buffer.from(decoded.bytes),png);assert.equal(decoded.mime,'image/png');
  await assert.rejects(decryptCapture(secret,'file:session:two',encrypted));
  await assert.rejects(decryptCapture(newSecret(),'file:session:one',encrypted));
  assert.throws(()=>unpackCapture(packCapture({mime:'application/pdf'},png)),/unsupported_file/);
});

test('relay requires capabilities and an active receiver; confirms only after receiver ACK',async()=>{
  const {relay,create}=await fixture();
  try{
    assert.equal((await fetch(`${relay.publicUrl}/api/capture/sessions`,{method:'POST'})).status,403);
    const session=await create(),base=`${relay.publicUrl}/api/capture/sessions/${session.id}`;
    assert.equal((await fetch(base)).status,403);
    assert.equal((await fetch(base,{headers:{...bearer(session.senderToken),Origin:'https://foreign.invalid'}})).status,403);
    const id=newSecret(),bytes=Buffer.from('encrypted-data-not-a-public-file'.repeat(4));
    const send=body=>fetch(`${base}/transfers/${id}`,{method:'PUT',headers:bearer(session.senderToken),body});
    assert.equal((await send(bytes)).status,503);
    const next=fetch(`${base}/next`,{headers:bearer(session.hostToken)});
    await waitFor(async()=> (await (await fetch(base,{headers:bearer(session.senderToken)})).json()).receiverConnected);
    let settled=false;
    const upload=send(bytes).then(response=>{settled=true;return response;});
    const delivered=await next;
    assert.equal(delivered.headers.get('x-capture-transfer'),id);
    assert.deepEqual(Buffer.from(await delivered.arrayBuffer()),bytes);
    assert.equal(settled,false);assert.equal(relay.diagnostics().bytes,bytes.length);
    const receipt=toBase64(await encryptCapture(newSecret(),'receipt',jsonBytes({saved:true})));
    assert.equal((await fetch(`${base}/transfers/${id}/ack`,{method:'POST',headers:bearer(session.senderToken),body:JSON.stringify({status:'saved',receipt})})).status,403);
    const ack=await fetch(`${base}/transfers/${id}/ack`,{method:'POST',headers:bearer(session.hostToken),body:JSON.stringify({status:'saved',receipt})});
    assert.equal(ack.status,200);assert.deepEqual(await (await upload).json(),{saved:true,receipt});
    assert.equal(relay.diagnostics().bytes,0);
    assert.deepEqual(await (await send(bytes)).json(),{saved:true,receipt});
    assert.equal((await send(Buffer.from('different-encrypted-content'.repeat(4)))).status,409);
    assert.equal((await fetch(base,{method:'DELETE',headers:bearer(session.hostToken)})).status,200);
    assert.equal((await send(bytes)).status,410);assert.deepEqual(relay.diagnostics(),{sessions:0,bytes:0});
    assert.equal((await fetch(`${relay.publicUrl}/api/archive`)).status,404);
    assert.equal((await fetch(`${relay.publicUrl}/capture/../server.mjs`)).status,404);
  }finally{await relay.close();}
});

test('expiry releases pending encrypted bytes and never reports an uncommitted transfer as saved',async()=>{
  let now=Date.now();
  const {relay,create}=await fixture({now:()=>now});
  try{
    const session=await create(),base=`${relay.publicUrl}/api/capture/sessions/${session.id}`;
    const next=fetch(`${base}/next`,{headers:bearer(session.hostToken)});
    await waitFor(async()=>(await(await fetch(base,{headers:bearer(session.senderToken)})).json()).receiverConnected);
    const upload=fetch(`${base}/transfers/${newSecret()}`,{method:'PUT',headers:bearer(session.senderToken),body:Buffer.alloc(100,9)});
    await (await next).arrayBuffer();
    now+=CAPTURE_LIMITS.transferMs+1;relay.maintain();
    assert.equal((await upload).status,504);assert.equal(relay.diagnostics().bytes,0);
    now+=CAPTURE_LIMITS.sessionMs;relay.maintain();
    assert.deepEqual(relay.diagnostics(),{sessions:0,bytes:0});
    assert.equal((await fetch(base,{headers:bearer(session.senderToken)})).status,410);
  }finally{await relay.close();}
});

test('revocation closes a pending transfer and oversized uploads reserve no memory',async()=>{
  const {relay,create}=await fixture({limits:{...CAPTURE_LIMITS,encryptedBytes:256}});
  try{
    const session=await create(),base=`${relay.publicUrl}/api/capture/sessions/${session.id}`;
    await fetch(base,{method:'HEAD',headers:bearer(session.hostToken)});
    assert.equal((await fetch(`${base}/transfers/${newSecret()}`,{method:'PUT',headers:bearer(session.senderToken),body:Buffer.alloc(257)})).status,413);
    assert.equal(relay.diagnostics().bytes,0);
    const next=fetch(`${base}/next`,{headers:bearer(session.hostToken)});
    const upload=fetch(`${base}/transfers/${newSecret()}`,{method:'PUT',headers:bearer(session.senderToken),body:Buffer.alloc(100,8)});
    await(await next).arrayBuffer();
    await fetch(base,{method:'DELETE',headers:bearer(session.hostToken)});
    assert.equal((await upload).status,410);
    assert.deepEqual(relay.diagnostics(),{sessions:0,bytes:0});
  }finally{await relay.close();}
});

test('DOCX envelope preserves a bounded source filename and validates ZIP signature',async()=>{
  const protocol=await import('../../../shared/mobile-capture/protocol.mjs');
  const mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const bytes=new Uint8Array([80,75,3,4,1,2,3]);
  const restored=protocol.unpackCapture(protocol.packCapture({mime,name:'Arbeitsblatt.docx'},bytes));
  assert.equal(restored.name,'Arbeitsblatt.docx');assert.equal(restored.mime,mime);
  assert.throws(()=>protocol.packCapture({mime,name:'../bad.docx'},bytes));
  assert.throws(()=>protocol.unpackCapture(protocol.packCapture({mime},new Uint8Array([1,2,3]))));
});


test('camera page permits local media streams without microphone or external scripts',async()=>{
  const {relay}=await fixture();
  try {
    const response=await fetch(`${relay.publicUrl}/capture/${newSecret()}`);
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy'),/media-src 'self' blob:/);
    assert.match(response.headers.get('content-security-policy'),/script-src 'self';/);
    assert.equal(response.headers.get('permissions-policy'),'camera=(self), microphone=(), geolocation=()');
    const html=await response.text();assert.match(html,/<video[^>]*playsinline/);assert.doesNotMatch(html,/capture="environment"/);
  } finally {await relay.close();}
});
