import {convertToExcalidrawElements,newElementWith,FONT_FAMILY,CaptureUpdateAction} from '@excalidraw/excalidraw';
import type {ExcalidrawImperativeAPI} from '@excalidraw/excalidraw/types';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import {readCanvasAgentCommand,type AgentCommand} from '../../canvas-agent-protocol.mjs';
import {transformMaterialBundle} from './material-transform';
import {canBeMaterialClipElement,assignMaterialClip,readClipFrames,type PresentationClip} from './clip-frames';
import {richTextOf,richTextImageSourceId} from './rich-text-scene';
import type {AgentMaterial} from './agent-materials';

export type AgentCanvasState = {
 revision:string;busy:boolean;persistence:{archiveRevision:string|null;state:string;pending:boolean};selectedIds:string[];viewport:{scrollX:number;scrollY:number;zoom:number;width:number;height:number};
 objects:{id:string;type:string;x:number;y:number;width:number;height:number;angle:number;locked:boolean;text?:string;materialPath?:string;groupIds:readonly string[]}[];
 clips:PresentationClip[];
};
export type AgentCanvasResult = {ok:boolean;applied:boolean;persisted:boolean;state:AgentCanvasState;created?:Record<string,string[]>;error?:string};
type Options={persistence():AgentCanvasState['persistence'];api:ExcalidrawImperativeAPI;busy():boolean;active():boolean;theme:'light'|'dark';flush():Promise<void>;
 getClips():PresentationClip[];getHtmlState():unknown;commitClips(clips:PresentationClip[]):void;
 revealCreated?(elements:readonly ExcalidrawElement[]):void;
 buildMaterial(material:AgentMaterial,x:number,y:number):ExcalidrawElement[];
 saveMaterials(materials:AgentMaterial[]):Promise<void>;
};
/** Operates exclusively on the live engine; all mutation drafts are validated before one commit. */
export function createCanvasAgent(o:Options){
 const generation=crypto.randomUUID();let revision=0,lastSignature='';
 const inspect=():AgentCanvasState=>{
  const elements=o.api.getSceneElementsIncludingDeleted();
  const signature=JSON.stringify([elements.map(e=>[e.id,e.version,e.versionNonce,e.isDeleted]),o.getClips(),o.getHtmlState()]);
  if(signature!==lastSignature){revision++;lastSignature=signature;}
  const a=o.api.getAppState();
  return {revision:`${generation}:${revision}`,busy:o.busy(),persistence:o.persistence(),selectedIds:Object.keys(a.selectedElementIds).filter(id=>a.selectedElementIds[id]),
   viewport:{scrollX:a.scrollX,scrollY:a.scrollY,zoom:a.zoom.value,width:a.width,height:a.height},clips:o.getClips(),
   objects:elements.filter(e=>!e.isDeleted&&!richTextImageSourceId(e)).map(e=>({id:e.id,type:e.customData?.materialKind?String(e.customData.materialKind):e.type,x:e.x,y:e.y,width:e.width,height:e.height,angle:e.angle,locked:e.locked,groupIds:e.groupIds,...(e.type==='text'?{text:e.originalText??e.text}:{}),...(typeof e.customData?.archiveMaterialPath==='string'?{materialPath:e.customData.archiveMaterialPath}:{})}))};
 };
 const guard=(command:Exclude<AgentCommand,{type:'inspect'}>,expiresAt:number)=>{
  if(Date.now()>expiresAt)throw new Error('Agentauftrag ist vor der Übernahme abgelaufen.');
  if(!o.active())throw new Error('Die Lehreransicht hat die Stunde gewechselt.');
  const state=inspect();if(state.busy)throw new Error('Canvas wird gerade bearbeitet. Nach Abschluss erneut lesen.');
  if(state.revision!==command.expectedRevision)throw new Error('Canvas wurde inzwischen verändert. Aktuellen Stand lesen und Auftrag neu planen.');
 };
 const execute=async(value:unknown,materials:Map<string,AgentMaterial>=new Map(),expiresAt=Date.now()+30000,onSaving?:()=>void):Promise<AgentCanvasResult>=>{
  let applied=false;
  try{
   const command=readCanvasAgentCommand(value);if(command.type==='inspect')return {ok:true,applied:false,persisted:false,state:inspect()};
   guard(command,expiresAt);
   await document.fonts.ready;
   await document.fonts.load('28px "Nunito"');
   await o.flush();guard(command,expiresAt); // refuses stale archive revisions before touching the scene
   if(command.type==='clip'){
    const current=o.getClips(),occupied=current.find(c=>c.number===command.number);
    if(occupied&&!command.replace)throw new Error('Clipnummer ist belegt. Eine Ersetzung muss ausdrücklich angefordert werden.');
    let next:PresentationClip[];
    if(command.elementId){
     if(!o.api.getSceneElements().some(e=>e.id===command.elementId&&canBeMaterialClipElement(e)))throw new Error('Material ist kein gültiges Clipziel.');
     const assignment=assignMaterialClip(current,command.elementId,crypto.randomUUID(),command.number);if(!assignment)throw new Error('Clip konnte nicht angelegt werden.');next=assignment.clips;
    }else next=readClipFrames([...current.filter(c=>c.number!==command.number),{id:occupied?.id??crypto.randomUUID(),number:command.number,...command.rect}]);
    o.commitClips(next);applied=true;onSaving?.();await o.flush();return {ok:true,applied,persisted:true,state:inspect()};
   }
   let elements:readonly ExcalidrawElement[]=[...o.api.getSceneElementsIncludingDeleted()];const created:Record<string,string[]>={};
   const target=(id:string)=>{const e=elements.find(e=>e.id===id&&!e.isDeleted);if(!e||e.locked)throw new Error('Objekt fehlt oder ist gesperrt: '+id);if(richTextImageSourceId(e))throw new Error('Rekonstruierbare Textgrafik ist kein Bearbeitungsziel.');return e;};
   const ink=o.theme==='dark'?'#f4f3ef':'#202b33';
   for(const op of command.operations){
    if(op.type==='transform'){
     const e=target(op.elementId);if(e.type==='text'&&(richTextOf(e)||e.containerId))throw new Error('Gebundenen oder formatierten Text über seinen Träger transformieren.');
     if(e.type==='text'&&Math.abs(op.width/e.width-op.height/e.height)>1e-5)throw new Error('Freien Text hier proportional skalieren; Umbruch über die Textgriffe bearbeiten.');
     const changes=transformMaterialBundle(e,elements,{x:op.x,y:op.y,width:op.width,height:op.height,angle:op.angle??e.angle});
     if(changes.some(c=>c.original.locked||c.original.type==='text'&&richTextOf(c.original)))throw new Error('Verbund enthält gesperrte oder formatierte Inhalte; Transformation hier noch nicht unterstützt.');
     const replacements=new Map(changes.map(c=>[c.original.id,c.updated]));elements=elements.map(e=>replacements.get(e.id)??e);
    }else if(op.type==='setText'){
     const e=target(op.elementId);if(e.type!=='text'||richTextOf(e)||e.containerId)throw new Error('Nur freier unformatierter Text kann direkt ersetzt werden.');
     const [measured]=convertToExcalidrawElements([{type:'text',x:e.x,y:e.y,text:op.text,fontFamily:e.fontFamily,fontSize:e.fontSize}]);
     const updated=newElementWith(e,{text:op.text,originalText:op.text,width:measured.width,height:measured.height,autoResize:true});elements=elements.map(item=>item.id===e.id?updated:item);
    }else{
     const added=op.type==='material'?(()=>{const m=materials.get(op.path);if(!m)throw new Error('Material wurde nicht aufgelöst.');return o.buildMaterial(m,op.x,op.y);})():convertToExcalidrawElements([op.type==='text'
      ?{type:'text',x:op.x,y:op.y,text:op.text,fontFamily:FONT_FAMILY.Nunito,fontSize:op.fontSize,strokeColor:op.color??ink}
      :{type:op.shape,x:op.x,y:op.y,width:op.width,height:op.height,strokeColor:op.color??ink,backgroundColor:op.fill,fillStyle:'solid',roughness:0,strokeWidth:1.5}]);
     created[op.key]=added.map(e=>e.id);elements=[...elements,...added];
    }
   }
   if(elements.length>20000)throw new Error('Canvasgrenze überschritten.');
   await o.saveMaterials([...materials.values()]);guard(command,expiresAt); // user edits during async asset work win
   o.api.updateScene({elements,appState:command.viewport?{scrollX:command.viewport.scrollX,scrollY:command.viewport.scrollY,zoom:{value:command.viewport.zoom as never}}:undefined,captureUpdate:command.operations.length?CaptureUpdateAction.IMMEDIATELY:CaptureUpdateAction.NEVER});
   applied=true;
   const addedIds=new Set(Object.values(created).flat());
   if(addedIds.size)o.revealCreated?.(elements.filter(element=>addedIds.has(element.id)));
   onSaving?.();
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));await o.flush();return {ok:true,applied,persisted:true,created,state:inspect()};
  }catch(e){return {ok:false,applied,persisted:false,error:e instanceof Error?e.message:String(e),state:inspect()};}
 };
 return {inspect,execute};
}
