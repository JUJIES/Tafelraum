import {sceneCoordsToViewportCoords} from '@excalidraw/excalidraw';
import type {ExcalidrawImperativeAPI} from '@excalidraw/excalidraw/types';
import type {PendingMaterial} from './agent-materials';
import {t} from '../i18n/translate';

const labels={image:'Bild',pdf:'PDF',interactive:'HTML',video:'Video',audio:'Audio',link:'Link'};

/** Teacher-only markers. Their anchors are scene coordinates; no preview enters the saved scene. */
export function previewAgentMaterials(api:ExcalidrawImperativeAPI,root:HTMLElement|null,items:PendingMaterial[]){
  if(!root)return ()=>{};
  const layer=document.createElement('div');
  layer.className='agent-material-previews';
  layer.inert=true;
  const cards=items.map(item=>{
    const card=document.createElement('div');
    card.className='agent-material-preview';
    const status=document.createElement('small');
    status.textContent=t(labels[item.kind])+' · '+t('Wird vorbereitet');
    const name=document.createElement('strong');
    name.textContent=item.name;
    card.append(status,name);
    layer.append(card);
    return {item,card};
  });
  root.append(layer);
  function position(){
    const rect=layer.getBoundingClientRect();
    const state=api.getAppState();
    for(const {item,card} of cards){
      const point=sceneCoordsToViewportCoords({sceneX:item.x,sceneY:item.y},state);
      card.style.transform='translate('+Math.round(point.x-rect.left)+'px,'+Math.round(point.y-rect.top)+'px)';
    }
  }
  position();
  const unsubscribe=api.onScrollChange(position);
  const observer=new ResizeObserver(position);
  observer.observe(root);
  let cleared=false;
  return ()=>{
    if(cleared)return;
    cleared=true;
    observer.disconnect();
    unsubscribe();
    layer.remove();
  };
}
