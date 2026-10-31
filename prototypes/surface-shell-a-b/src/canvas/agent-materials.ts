import { t } from "../i18n/translate.ts";
import {loadLessonMaterials,lessonMaterialArchivePath,lessonMaterialToFile} from '../lesson-materials';
import {materialFilesToCanvasImages} from '../material-import';
import type {CanvasAudioAsset,CanvasVideoAsset,CanvasInteractiveHtmlAsset,CanvasYouTubeAsset,CanvasLink,CanvasImageAsset} from './canvas-port';
export type AgentMaterial = {kind:'audio';asset:CanvasAudioAsset}|{kind:'video';asset:CanvasVideoAsset}|{kind:'interactive';asset:CanvasInteractiveHtmlAsset}|{kind:'youtube';asset:CanvasYouTubeAsset}|{kind:'link';asset:CanvasLink}|{kind:'images';assets:CanvasImageAsset[]};
export async function resolveAgentMaterials(lessonId:string,paths:string[]) {
 const collection=await loadLessonMaterials(lessonId),result=new Map<string,AgentMaterial>();
 for(const path of new Set(paths)){
  const m=collection.materials.find(m=>m.path===path);if(!m)throw new Error(t("Material ist nicht im Stundenarchiv: {0}", path));
  const archiveMaterialPath=lessonMaterialArchivePath(collection.basis.archivePath,path);
  if(m.kind==='audio'||m.kind==='video'){
   const asset={archiveMaterialPath,fileName:m.name,lessonId,materialPath:m.path,mimeType:m.mimeType};
   result.set(path,m.kind==='audio'?{kind:'audio',asset:asset as CanvasAudioAsset}:{kind:'video',asset:asset as CanvasVideoAsset});
  }else if(m.kind==='interactive')result.set(path,{kind:'interactive',asset:{archiveMaterialPath,id:m.id,title:m.name,lessonId,entry:m.entry,print:m.print,defaultViewport:m.defaultViewport}});
  else if(m.kind==='link')result.set(path,m.provider==='youtube'?{kind:'youtube',asset:{archiveMaterialPath,title:m.name,url:m.url,videoId:m.videoId}}:{kind:'link',asset:{archiveMaterialPath,label:m.name,url:m.url}});
  else{
   const assets=await materialFilesToCanvasImages([await lessonMaterialToFile(lessonId,m)]);
   result.set(path,{kind:'images',assets:assets.map(asset=>({...asset,source:{...asset.source,archiveMaterialPath}}))});
  }
 }
 return result;
}
