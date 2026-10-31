import {CAPTURE_LIMITS,CAPTURE_TYPES,captureId,newSecret,encryptCapture,decryptCapture,fromBase64,packCapture,parseBytes} from '/protocol.mjs';

const ui = Object.fromEntries(['title','connection','capture','camera','choose','file','items','actions','feedback','send','error','viewer','viewer-name','viewer-close','viewer-image','viewer-stage','viewer-zoom','camera-view','camera-video','camera-close','camera-shoot','camera-note'].map(id => [id,document.getElementById(id)]));
const id = location.pathname.split('/').at(-1);
const [token,secret] = location.hash.slice(1).split('.');
const base = `/api/capture/sessions/${id}`;
const items = [];
const docxMime="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
let acceptsDocx=false;
let sending = false, connected = false, closed = false;
const headers = () => ({Authorization:`Bearer ${token}`});
const feedback = message => {ui.feedback.textContent=message;ui.feedback.hidden=!message;};
function update() {
  const pending=items.filter(item=>item.state!=='saved');
  ui.actions.hidden = !pending.length;
  ui.send.disabled = sending || !connected || closed;
  ui.send.textContent = sending ? 'Wird gesendet …' : pending.length===1 ? 'Senden' : `${pending.length} Dateien senden`;
  ui.camera.disabled = ui.choose.disabled = closed;
  for (const item of items) {
    item.status.textContent=({ready:'Bereit',sending:item.mime===docxMime?'Wird umgewandelt …':'Wird gesendet …',saved:'Gespeichert',error:'Nicht bestätigt'})[item.state];
    item.status.dataset.error=String(item.state==='error');
    item.row.dataset.state=item.state;
    item.retry.hidden=item.state!=='error';
    item.retry.disabled=sending||!connected||closed;
    item.remove.disabled=item.state==='sending';
  }
}
function end() {
  closeCamera();closed=true;connected=false;ui.connection.textContent='Empfang beendet';
  ui.error.hidden=false;ui.error.textContent='Diese Freigabe ist beendet.';update();
}
async function status() {
  if (closed) return;
  try {
    const response = await fetch(base,{headers:headers(),cache:'no-store',signal:AbortSignal.timeout(8000)});
    if (response.status===410 || response.status===403) {end();return;}
    if (!response.ok) throw new Error('unavailable');
    const value = await response.json();
    const target = parseBytes(await decryptCapture(secret,'target',fromBase64(value.target)));
    if (typeof target.title !== 'string' || target.title.length>1000) throw new Error('invalid_target');
    acceptsDocx=target.acceptsDocx===true;
    ui.file.accept='image/jpeg,image/png,image/webp,application/pdf'+(acceptsDocx?',.docx,'+docxMime:'');
    ui.title.textContent=target.title;document.title=`${target.title} · Tafelraum`;
    connected=value.receiverConnected===true;
    ui.connection.textContent=connected?'Verbunden':'Mac nicht erreichbar';
    ui.capture.hidden=false;ui.error.hidden=true;
  } catch {
    connected=false;ui.connection.textContent='Verbindung unterbrochen';
  }
  update();
}
function choose(files) {
  feedback('');
  for (const file of files) {
    const mime = /\.docx$/i.test(file.name)&&['','application/octet-stream','application/zip'].includes(file.type)?docxMime:file.type || ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',docx:docxMime}[file.name.split('.').at(-1).toLowerCase()]);
    if (!CAPTURE_TYPES[mime] || (mime===docxMime&&!acceptsDocx) || !file.size || file.size>CAPTURE_LIMITS.fileBytes) {
      feedback(acceptsDocx?'Bitte ein Bild, eine PDF- oder DOCX-Datei bis 20 MB auswählen.':'Bitte ein Bild oder eine PDF-Datei bis 20 MB auswählen.');continue;
    }
    if (items.length>=24 || items.reduce((sum,item)=>sum+item.size,0)+file.size>80*1024*1024) {
      feedback('Auswahl voll. Entferne gespeicherte Vorschauen, um weitere Dateien hinzuzufügen.');break;
    }
    const row=document.createElement('li');row.className='capture-item';
    const url=mime==='application/pdf'||mime===docxMime?null:URL.createObjectURL(file);
    const thumbnail=document.createElement(url?'button':'div');thumbnail.className='thumbnail';
    if(url){thumbnail.type='button';thumbnail.setAttribute('aria-label',`Foto ansehen: ${file.name}`);thumbnail.addEventListener('click',()=>openPreview(item,thumbnail));}
    if(url){const image=document.createElement('img');image.src=url;image.alt=file.name;thumbnail.append(image);}else{thumbnail.textContent=mime===docxMime?'Word':'PDF';}
    const name=document.createElement('p');name.className='filename';name.textContent=file.name;name.title=file.name;
    const status=document.createElement('p');status.className='item-status';status.setAttribute('role','status');
    const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';
    remove.setAttribute('aria-label',`Vorschau entfernen: ${file.name}`);
    const retry=document.createElement('button');retry.type='button';retry.className='retry';retry.textContent='Erneut senden';retry.setAttribute('aria-label',`Erneut senden: ${file.name}`);
    const item={file,mime,size:file.size,url,row,status,remove,retry,state:'ready',prepared:null};
    retry.addEventListener('click',()=>sendBatch([item]));
    remove.addEventListener('click',()=>{if(item.state==='sending')return;const index=items.indexOf(item);if(index<0)return;items.splice(index,1);if(url)URL.revokeObjectURL(url);row.remove();update();});
    row.append(thumbnail,name,status,remove,retry);items.push(item);ui.items.append(row);
  }
  update();
}
let previewTrigger=null, zoomed=false;
function openPreview(item,trigger) {
  if(!item.url)return;
  previewTrigger=trigger;zoomed=false;
  ui['viewer-image'].src=item.url;ui['viewer-image'].alt=item.row.children[1].textContent;
  ui['viewer-name'].textContent=ui['viewer-image'].alt;
  ui['viewer-stage'].classList.remove('zoomed');ui['viewer-zoom'].textContent='Vergrößern';
  ui.viewer.showModal();ui['viewer-stage'].scrollTop=ui['viewer-stage'].scrollLeft=0;
}
ui['viewer-close'].addEventListener('click',()=>ui.viewer.close());
ui.viewer.addEventListener('close',()=>{ui['viewer-image'].removeAttribute('src');previewTrigger?.focus();});
ui['viewer-zoom'].addEventListener('click',()=>{
  zoomed=!zoomed;ui['viewer-stage'].classList.toggle('zoomed',zoomed);
  ui['viewer-zoom'].textContent=zoomed?'Einpassen':'Vergrößern';
});
// Keep camera ownership local to this page; late permission results must be stopped.
let cameraStream=null, cameraGeneration=0, cameraBusy=false, cameraCount=0;
function stopCamera() {
  cameraGeneration++;
  cameraStream?.getTracks().forEach(track=>track.stop());cameraStream=null;
  ui['camera-video'].srcObject=null;ui['camera-shoot'].disabled=true;cameraBusy=false;
}
function closeCamera() {
  stopCamera();
  if(ui['camera-view'].open)ui['camera-view'].close();
}
async function openCamera() {
  if(closed||ui['camera-view'].open)return;
  feedback('');cameraCount=0;const generation=++cameraGeneration;
  ui['camera-note'].textContent='Kamera wird geöffnet …';
  ui['camera-shoot'].disabled=true;ui['camera-view'].showModal();
  try {
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('unavailable');
    const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:2560},height:{ideal:1920}}});
    if(generation!==cameraGeneration||closed||document.hidden){stream.getTracks().forEach(track=>track.stop());return;}
    cameraStream=stream;ui['camera-video'].srcObject=stream;
    stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{
      if(generation!==cameraGeneration)return;
      closeCamera();feedback('Kamera wurde beendet. Bitte erneut öffnen oder Datei auswählen.');
    }));
    await ui['camera-video'].play();
    if(generation!==cameraGeneration)return;
    ui['camera-note'].textContent='';
    ui['camera-shoot'].disabled=!ui['camera-video'].videoWidth;
  } catch(error) {
    if(generation!==cameraGeneration)return;
    closeCamera();
    feedback(error.name==='NotAllowedError'?'Kamerazugriff nicht erlaubt. Bitte im Browser freigeben oder Datei auswählen.':'Kamera nicht verfügbar. Bitte erneut versuchen oder Datei auswählen.');
  }
}
ui.camera.addEventListener('click',openCamera);
ui['camera-close'].addEventListener('click',closeCamera);
ui['camera-view'].addEventListener('close',()=>{if(!ui['camera-view'].open){stopCamera();ui.camera.focus();}});
ui['camera-view'].addEventListener('cancel',closeCamera);
ui['camera-video'].addEventListener('loadeddata',()=>{
  if(cameraStream&&!cameraBusy)ui['camera-shoot'].disabled=!ui['camera-video'].videoWidth;
});
ui['camera-shoot'].addEventListener('click',async()=>{
  if(!cameraStream||cameraBusy||closed)return;
  const video=ui['camera-video'];if(!video.videoWidth||!video.videoHeight)return;
  const generation=cameraGeneration;cameraBusy=true;ui['camera-shoot'].disabled=true;
  const canvas=document.createElement('canvas');
  try {
    const scale=Math.min(1,3200/Math.max(video.videoWidth,video.videoHeight));
    canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
    canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.94));
    if(generation!==cameraGeneration||closed)return;
    if(!blob)throw new Error('capture_failed');
    const before=items.length;
    choose([new File([blob],`Aufnahme-${new Date().toISOString().replace(/[:.]/g,'-')}.jpg`,{type:'image/jpeg'})]);
    if(items.length>before){cameraCount++;ui['camera-note'].textContent=cameraCount===1?'1 Foto hinzugefügt':`${cameraCount} Fotos hinzugefügt`;}
    else ui['camera-note'].textContent=ui.feedback.textContent;
  } catch {
    if(generation===cameraGeneration)ui['camera-note'].textContent='Aufnahme nicht möglich. Bitte erneut versuchen oder Datei auswählen.';
  } finally {
    canvas.width=canvas.height=0;
    if(generation===cameraGeneration){cameraBusy=false;ui['camera-shoot'].disabled=!cameraStream;}
  }
});
ui.choose.addEventListener('click',()=>ui.file.click());
for (const input of [ui.file]) input.addEventListener('change',()=>{choose(Array.from(input.files));input.value='';});
async function sendBatch(batch) {
  if (sending || !connected || closed) return;
  sending=true;feedback('');update();
  // Serialize bounded transfers; new selections stay usable during this batch.
  batch=batch.filter(item=>item.state!=='saved'&&items.includes(item));
  try {
    for(const item of batch) {
      if(closed || !items.includes(item))continue;
      item.state='sending';update();
      let rejected=false;
      try {
        if (!item.prepared) {
          const transferId=newSecret();
          const bytes=packCapture({mime:item.mime,...(item.mime===docxMime?{name:item.file.name}:{})},new Uint8Array(await item.file.arrayBuffer()));
          item.prepared={id:transferId,bytes:await encryptCapture(secret,`file:${id}:${transferId}`,bytes)};
        }
        const response=await fetch(`${base}/transfers/${item.prepared.id}`,{
          method:'PUT',headers:{...headers(),'Content-Type':'application/octet-stream'},body:item.prepared.bytes,
          signal:AbortSignal.timeout(105_000),
        });
        if (response.status===410 || response.status===403) {item.state='error';end();break;}
        const result=await response.json();
        if (!response.ok || result.saved!==true) {rejected=result.error==='rejected';throw new Error(result.error);}
        const receipt=parseBytes(await decryptCapture(secret,`receipt:${id}:${item.prepared.id}`,fromBase64(result.receipt)));
        if (receipt.saved!==true) throw new Error('invalid_receipt');
        item.state='saved';item.prepared=null;item.file=null;
      } catch {
        item.state='error';feedback(rejected?'Die Datei konnte am Mac nicht übernommen werden. Bitte Datei und Fehlermeldung am Mac prüfen.':'Speicherung nicht bestätigt. Bitte Verbindung prüfen und erneut senden.');
        break;
      } finally {update();}
    }
  } finally {sending=false;update();void status();}
}
ui.send.addEventListener('click',()=>sendBatch(items.filter(item=>item.state!=='saved')));
window.addEventListener('pagehide',event=>{closeCamera();if(!event.persisted)for(const item of items)if(item.url)URL.revokeObjectURL(item.url);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)closeCamera();else void status();});
if (!captureId(id)||!captureId(token)||!captureId(secret)||!crypto.subtle) end();
else {void status();setInterval(()=>{if(!sending&&!document.hidden)void status();},3000);}
