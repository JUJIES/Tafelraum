import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

class Element {
  constructor(){this.children=[];this.listeners={};this.hidden=false;this.dataset={};this.value='';this.classList={remove(){},toggle(){}};}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.();}
  removeAttribute(name){delete this[name];}
  focus(){this.focused=true;}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  setAttribute(name,value){this[name]=value;}
  addEventListener(name,callback){this.listeners[name]=callback;}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
  click(){return this.listeners.click?.();}
}
async function sender({fail=false,hold=false,acceptsDocx=false,camera}={}) {
  const elements=Object.fromEntries(['title','connection','capture','camera','choose','file','items','actions','feedback','send','error','viewer','viewer-name','viewer-close','viewer-image','viewer-stage','viewer-zoom','camera-view','camera-video','camera-close','camera-shoot','camera-note'].map(id=>[id,new Element()]));
  let counter=0, failed=false, release;
  const calls=[], receipts=new Map(), documentListeners={}, windowListeners={};
  elements['camera-video'].videoWidth=4000;elements['camera-video'].videoHeight=3000;elements['camera-video'].play=async()=>{};
  const canvases=[];let stopped=0;
  const track={stop(){stopped++;},addEventListener(){}};
  const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
  const context={document:{getElementById:id=>elements[id],createElement:tag=>{const element=new Element();if(tag==='canvas'){canvases.push(element);element.getContext=()=>({drawImage(){}});element.toBlob=callback=>callback(new Blob(['photo'],{type:'image/jpeg'}));}return element;},addEventListener:(name,fn)=>{documentListeners[name]=fn;}},
    location:{pathname:'/capture/session',hash:'#token.secret'},window:{addEventListener:(name,fn)=>{windowListeners[name]=fn;}},navigator:{mediaDevices:{getUserMedia:camera|| (async()=>stream)}},Blob,File,crypto:{subtle:{}},
    CAPTURE_LIMITS:{fileBytes:20*1024*1024},CAPTURE_TYPES:{'image/jpeg':1,'image/png':1,'application/pdf':1,'application/vnd.openxmlformats-officedocument.wordprocessingml.document':1},
    captureId:()=>true,newSecret:()=>`transfer-${++counter}`,encryptCapture:async(_,__,bytes)=>bytes,
    decryptCapture:async(_,key,value)=>key==='target'?{title:'Teststunde',acceptsDocx}:value,fromBase64:value=>value,parseBytes:value=>value,packCapture:(_,bytes)=>bytes,
    URL:{createObjectURL:()=>`blob:${counter}`,revokeObjectURL(){}},AbortSignal,Uint8Array,setInterval(){},
    fetch:async(url,options={})=>{
      if(options.method!=='PUT')return {ok:true,json:async()=>({target:{},receiverConnected:true})};
      calls.push(url);if(hold){hold=false;await new Promise(resolve=>{release=resolve;});}
      if(fail&&!failed){failed=true;throw Error('Lost acknowledgement');}
      receipts.set(url,true);return {ok:true,json:async()=>({saved:true,receipt:{saved:true}})};
    }};
  const source=(await readFile(new URL('../web/capture.js',import.meta.url),'utf8')).replace(/^import .*;\n/,'');
  vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
  return {ui:elements,calls,context,canvases,stopped:()=>stopped,documentListeners,windowListeners,release:()=>release(),add:(input,files)=>{elements[input].files=files;elements[input].listeners.change();}};
}
const file=(name,type)=>({name,type,size:12,arrayBuffer:async()=>new ArrayBuffer(12)});
const state=row=>row.children[2].textContent;
test('camera photos and multi-file selection accumulate; confirmed uploads are skipped on retry',async()=>{
  const {ui,add,calls}=await sender({fail:true});
  add('file',[file('camera-1.jpg','image/jpeg')]);add('file',[file('camera-2.jpg','image/jpeg')]);
  add('file',[file('sheet.pdf','application/pdf'),file('image.png','image/png')]);
  assert.equal(ui.items.children.length,4);assert.equal(ui.send.textContent,'4 Dateien senden');
  await ui.send.click();assert.match(state(ui.items.children[0]),/Nicht bestätigt/);
  await ui.send.click();assert.equal(calls[0],calls[1]);assert.equal(calls.length,5);
  assert.ok(ui.items.children.every(row=>state(row)==='Gespeichert'));
  add('file',[file('camera-3.jpg','image/jpeg')]);await ui.send.click();assert.equal(calls.length,6);
  assert.equal(ui.items.children.length,5);assert.equal(ui.actions.hidden,true);
});
test('selection stays usable during upload; additions await the next batch, removable previews never delete the archive',async()=>{
  const {ui,add,calls,release}=await sender({hold:true});
  add('file',[file('first.jpg','image/jpeg')]);const pending=ui.send.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(ui.camera.disabled,false);assert.equal(ui.choose.disabled,false);
  add('file',[file('next.pdf','application/pdf')]);release();await pending;
  assert.equal(calls.length,1);assert.equal(state(ui.items.children[1]),'Bereit');
  await ui.items.children[0].children[3].click();assert.equal(ui.items.children.length,1);assert.equal(calls.length,1);
  await ui.send.click();assert.equal(calls.length,2);
});
test('invalid files do not discard valid pending selections',async()=>{
  const {ui,add}=await sender();add('file',[file('ok.pdf','application/pdf'),file('bad.exe','application/exe')]);
  assert.equal(ui.items.children.length,1);assert.equal(ui.feedback.hidden,false);assert.equal(ui.send.disabled,false);
});

test('retry action sends only its failed item and retains the original transfer identity',async()=>{
  const {ui,add,calls}=await sender({fail:true});
  add('file',[file('first.pdf','application/pdf'),file('later.pdf','application/pdf')]);
  await ui.send.click();assert.equal(ui.items.children[0].children[4].hidden,false);
  await ui.items.children[0].children[4].click();assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);
  assert.equal(state(ui.items.children[0]),'Gespeichert');assert.equal(state(ui.items.children[1]),'Bereit');
  assert.equal(ui.items.children[0].children[4].hidden,true);
});

test('large preview and zoom preserve selection and restore the thumbnail focus',async()=>{
  const {ui,add,calls}=await sender();add('file',[file('photo.jpg','image/jpeg')]);
  const thumbnail=ui.items.children[0].children[0];thumbnail.click();assert.equal(ui.viewer.open,true);
  assert.equal(ui['viewer-name'].textContent,'photo.jpg');assert.equal(ui['viewer-image'].alt,'photo.jpg');
  ui['viewer-zoom'].click();assert.equal(ui['viewer-zoom'].textContent,'Einpassen');
  ui['viewer-close'].click();assert.equal(ui.viewer.open,false);assert.equal(thumbnail.focused,true);
  assert.equal(ui.items.children.length,1);assert.equal(calls.length,0);assert.equal(state(ui.items.children[0]),'Bereit');
});

test('Word selection is enabled only by a capable receiver and stays a file placeholder',async()=>{
  const mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const old=await sender();old.add('file',[file('worksheet.docx',mime)]);assert.equal(old.ui.items.children.length,0);
  const current=await sender({acceptsDocx:true});current.add('file',[file('worksheet.docx','application/octet-stream')]);
  assert.equal(current.ui.items.children.length,1);assert.equal(current.ui.items.children[0].children[0].textContent,'Word');
  await current.ui.send.click();assert.equal(state(current.ui.items.children[0]),'Gespeichert');
});


test('integrated camera captures mixed batches without opening an external picker and releases tracks',async()=>{
  const app=await sender();const {ui,add,calls}=app;
  add('file',[file('worksheet.pdf','application/pdf')]);
  await ui.camera.click();assert.equal(ui['camera-view'].open,true);assert.equal(ui['camera-shoot'].disabled,false);
  await ui['camera-shoot'].click();await ui['camera-shoot'].click();
  assert.equal(ui.items.children.length,3);assert.equal(ui['camera-note'].textContent,'2 Fotos hinzugefügt');
  assert.equal(calls.length,0);assert.equal(app.canvases[0].width,0);assert.equal(app.canvases[0].height,0);
  ui['camera-close'].click();assert.ok(app.stopped()>0);assert.equal(ui['camera-video'].srcObject,null);
  await ui.send.click();assert.equal(calls.length,3);assert.ok(ui.items.children.every(row=>state(row)==='Gespeichert'));
});
test('permission denial keeps existing selections and the file picker usable',async()=>{
  const app=await sender({camera:async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'});}});
  app.add('file',[file('keep.pdf','application/pdf')]);await app.ui.camera.click();
  assert.equal(app.ui['camera-view'].open,false);assert.match(app.ui.feedback.textContent,/nicht erlaubt/);
  assert.equal(app.ui.items.children.length,1);assert.equal(app.ui.choose.disabled,false);
});
test('closing while camera permission is pending stops late streams; background and pagehide stop active camera',async()=>{
  let resolveCamera,stopped=0;const stream={getTracks:()=>[{stop(){stopped++;}}]};
  const pendingApp=await sender({camera:()=>new Promise(resolve=>{resolveCamera=resolve;})});
  const opening=pendingApp.ui.camera.click();pendingApp.ui['camera-close'].click();resolveCamera(stream);await opening;
  assert.equal(stopped,1);assert.equal(pendingApp.ui['camera-video'].srcObject,null);
  const active=await sender();await active.ui.camera.click();active.context.document.hidden=true;active.documentListeners.visibilitychange();
  assert.ok(active.stopped()>0);assert.equal(active.ui['camera-view'].open,false);
  active.context.document.hidden=false;await active.ui.camera.click();const count=active.stopped();active.windowListeners.pagehide({persisted:true});assert.ok(active.stopped()>count);
});
