// Neutral browser fixture: uses the real engine without installing materials.
// Invoked by test:developer-start; never imported by a production entry point.
import * as f from "./material-elements";
import { serializeAsJSON, restoreElements } from "@excalidraw/excalidraw";

export function materialElementsFixture() {
  const images = f.createImageElements([
    {id:'test-image',dataUrl:'data:image/png;base64,',mimeType:'image/png',pixelWidth:1840,pixelHeight:1440,source:{kind:'image',fileName:'photo.png',archiveMaterialPath:'test/material/photo.png'}},
    {id:'test-pdf',dataUrl:'data:image/png;base64,',mimeType:'image/png',pixelWidth:200,pixelHeight:300,source:{kind:'pdf-page',fileName:'page.pdf',pageNumber:3,archiveMaterialPath:'test/material/page.pdf'}},
  ],40,500,true);
  const provenance = {archiveMaterialPath:'test/material/media',fileName:'media',lessonId:'lesson-start',materialPath:'material/media'};
  const media = [f.createAudioElement({...provenance,mimeType:'audio/mpeg'},0,0),
    f.createVideoElement({...provenance,mimeType:'video/mp4'},10,20),
    f.createInteractiveHtmlElement({archiveMaterialPath:'test/material/app',id:'neutral',title:'Neutral',lessonId:'lesson-start',entry:'index.html',
      defaultViewport:{width:840,height:594},print:{entry:'index.html',page:'A4',mode:'template',layout:'shared-pages',orientation:'landscape'}},20,30,{width:840,height:594}),
    f.createYouTubeElement({archiveMaterialPath:'test/material/links.json',title:'Link',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',videoId:'dQw4w9WgXcQ'},30,40),
    f.createEmbeddedAppElement('neutral-app',40,50,800,600)];
  const links = f.createCanvasLinkElements({label:'Dokumentation',url:'https://example.org',archiveMaterialPath:'test/material/links.json'},50,60,'light');
  const elements = [...images,...media,...links];
  const serialized = JSON.parse(serializeAsJSON(elements,{}, {},'local'));
  const restored = restoreElements(serialized.elements,null);
  return {images,media,links,restored};
}
