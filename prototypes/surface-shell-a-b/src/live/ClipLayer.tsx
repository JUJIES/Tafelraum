import { t, useUiLocale } from "../i18n";
import { useEffect, useRef, useState, type CSSProperties, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { getCommonBounds } from '@excalidraw/excalidraw';
import { Grip, X } from 'lucide-react';
import { assignMaterialClip, canBeMaterialClipElement, isMaterialClip, nextClipNumber, type ClipFrame, type PresentationClip } from '../canvas/clip-frames';
import { materialContainsPoint } from '../canvas/material-annotation-targets';
import { getMaterialBorderRadius } from '../canvas/material-appearance';
import './clip-layer.css';

export type ClipControls = {
  creating: boolean; finish(): void; created(): void; show(clip: PresentationClip): void; removed(clip: PresentationClip): void; replaced(clip: PresentationClip): void;
  move(clip: ClipFrame): void;
  activeClip: Omit<ClipFrame, "number"> | null; activeId: string | null; canShowMaterial(elementId:string): boolean; pending: boolean; shown: boolean;
  shortcut: RefObject<((number: number) => boolean) | null>;
  addSelected: RefObject<((number?: number) => boolean) | null>;
};
type Drag = { pointer: number; x: number; y: number; before: ClipFrame; kind: 'create' | 'move' | 'resize'; materialId?: string };
export function ClipLayer({api, clips, onChange, controls, externalCommit}: {
  externalCommit?: RefObject<((clips: PresentationClip[]) => void) | null>;
  api: ExcalidrawImperativeAPI; clips: PresentationClip[]; onChange(clips: PresentationClip[]): void; controls: ClipControls;
}) {
  useUiLocale();
  const [camera, setCamera] = useState(() => api.getAppState());
  const [draft, setDraft] = useState<ClipFrame | null>(null);
  const [undo, setUndo] = useState<PresentationClip[] | null>(null);
  const [menu, setMenu] = useState<{clipId: string; x: number; y: number; editing: boolean} | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const press = useRef<{timer: number; x: number; y: number} | null>(null);
  const suppressClick = useRef(false);
  // Finishing one-shot capture removes its hit surface before the browser's
  // compatibility click. Consume that click, never the next deliberate press.
  const capturedClick = useRef<{x:number;y:number;until:number}|null>(null);
  useEffect(()=>{
    const press=()=>{capturedClick.current=null;};
    const click=(event:MouseEvent)=>{
      const capture=capturedClick.current;capturedClick.current=null;
      if(capture&&Date.now()<=capture.until&&Math.hypot(event.clientX-capture.x,event.clientY-capture.y)<12){
        event.preventDefault();event.stopImmediatePropagation();
      }
    };
    window.addEventListener('pointerdown',press,true);window.addEventListener('click',click,true);
    return()=>{window.removeEventListener('pointerdown',press,true);window.removeEventListener('click',click,true);};
  },[]);
  const [, setMaterialRevision] = useState(0);
  useEffect(() => { if (!undo) return; const timer = setTimeout(()=>setUndo(null),8000); return ()=>clearTimeout(timer); }, [undo]);
  const change = (next: PresentationClip[]) => {
    onChange(next);
    const active = next.find(clip => clip.id === controls.activeClip?.id);
    if (active && !isMaterialClip(active)) controls.move(active);
  };
  const commit = (next: PresentationClip[]) => { setUndo(clips); change(next); };
  const drag = useRef<Drag | null>(null), layer = useRef<HTMLDivElement>(null);
  const latest = useRef({clips, controls, onChange}); latest.current = {clips, controls, onChange};
  const addMaterial = (elementId: string, number?: number) => {
    const state = latest.current;
    if (!api.getSceneElements().some(element => element.id === elementId && canBeMaterialClipElement(element))) return false;
    const assignment = assignMaterialClip(state.clips, elementId, crypto.randomUUID(), number);
    if (!assignment) return false;
    if (!assignment.changed) return true;
    assignment.displaced.forEach(state.controls.replaced);
    setUndo(state.clips);
    state.onChange(assignment.clips);
    return true;
  };
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); setMenu(null); } };
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('keydown', escape, true);
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('keydown', escape, true); };
  }, [menu]);
  const reassign = (clip: PresentationClip, number: number) => {
    if (!Number.isInteger(number) || number < 1 || number > 99 || number === clip.number) { setMenu(null); return; }
    const displaced = clips.find(item => item.number === number);
    if (displaced) controls.replaced(displaced);
    controls.replaced(clip);
    commit(clips.filter(item => item.id !== displaced?.id).map(item => item.id === clip.id ? {...item, number} : item).sort((a,b) => a.number-b.number));
    setMenu(null);
  };
  const openMenu = (clip: PresentationClip, clientX: number, clientY: number) => {
    const rect = layer.current!.getBoundingClientRect();
    setNewNumber(String(clip.number));
    setMenu({clipId:clip.id,x:Math.max(4,Math.min(clientX-rect.left,rect.width-196)),y:Math.max(4,Math.min(clientY-rect.top,rect.height-128)),editing:false});
  };
  const clearPress = () => { if (press.current) window.clearTimeout(press.current.timer); press.current = null; };
  useEffect(() => {
    let materialGeometrySignature = '';
    const refresh = () => {
      const state = api.getAppState();
      setCamera(previous => previous.scrollX === state.scrollX && previous.scrollY === state.scrollY && previous.zoom.value === state.zoom.value
        && previous.width === state.width && previous.height === state.height ? previous : {...state});
    };
    const unsub = api.onScrollChange(refresh), changed = api.onChange(() => {
      refresh();
      const ids = latest.current.clips.filter(isMaterialClip).map(clip => clip.elementId);
      if (ids.length === 0) return;
      const materialIds = new Set(ids);
      const geometry = api.getSceneElements().filter(element => materialIds.has(element.id))
        .map(element => [element.id,element.x,element.y,element.width,element.height,element.angle,element.isDeleted,element.roundness]);
      const signature = JSON.stringify(geometry);
      if (signature !== materialGeometrySignature) {
        materialGeometrySignature = signature;
        setMaterialRevision(value => value + 1);
      }
    });
    const observer = new ResizeObserver(refresh);
    if (layer.current) observer.observe(layer.current);
    return () => { unsub(); changed(); observer.disconnect(); };
  }, [api]);
  useEffect(() => {
    if (!externalCommit) return;
    externalCommit.current = next => {
      const current = latest.current;
      current.clips.filter(c => !next.some(n => n.id === c.id && JSON.stringify(n) === JSON.stringify(c))).forEach(current.controls.replaced);
      setUndo(current.clips);
      current.onChange(next);
      const active = next.find(c => c.id === current.controls.activeId);
      if (active && !isMaterialClip(active)) current.controls.move(active);
    };
    return () => { externalCommit.current = null; };
  }, [externalCommit]);
  useEffect(() => {
    controls.shortcut.current = number => {
      const current = latest.current;
      const clip = current.clips.find(clip => clip.number === number);
      if (!clip || current.controls.creating || api.getAppState().editingTextElement
        || (isMaterialClip(clip) && (!current.controls.canShowMaterial(clip.elementId)
          || !api.getSceneElements().some(element => element.id === clip.elementId && canBeMaterialClipElement(element))))) return false;
      current.controls.show(clip); return true;
    };
    controls.addSelected.current = number => {
      if (api.getAppState().editingTextElement) return false;
      const selected = api.getAppState().selectedElementIds;
      const materials = api.getSceneElements().filter(element => selected[element.id] && canBeMaterialClipElement(element));
      if (materials.length !== 1) return false;
      const added = addMaterial(materials[0].id, number);
      if (added) latest.current.controls.finish();
      return added;
    };
    return () => { controls.shortcut.current = null; controls.addSelected.current = null; };
  }, [api, controls.shortcut, controls.addSelected]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || (!drag.current && !latest.current.controls.creating)) return;
      event.preventDefault(); event.stopPropagation();
      if (drag.current?.kind !== 'create' && drag.current) latest.current.controls.move(drag.current.before);
      if (drag.current && layer.current?.hasPointerCapture(drag.current.pointer)) layer.current.releasePointerCapture(drag.current.pointer);
      drag.current = null; setDraft(null); latest.current.controls.finish();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, []);
  const point = (event: ReactPointerEvent) => {
    const bounds = layer.current!.getBoundingClientRect(), state = api.getAppState();
    return {x:(event.clientX-bounds.left)/state.zoom.value-state.scrollX, y:(event.clientY-bounds.top)/state.zoom.value-state.scrollY};
  };
  const begin = (event: ReactPointerEvent, before: ClipFrame, kind: Drag['kind'], materialId?: string) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const p = point(event); drag.current = {pointer:event.pointerId, ...p, before, kind, materialId};
    layer.current!.setPointerCapture(event.pointerId); setDraft(before);
  };
  const finish = (event: ReactPointerEvent, cancelled = false) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointer) return;
    event.stopPropagation(); drag.current = null;
    const end = point(event);
    let completed = cancelled || current.kind !== 'create';
    if (!cancelled && current.kind === 'create' && current.materialId
      && Math.hypot(end.x-current.x,end.y-current.y)*api.getAppState().zoom.value < 10) {
      completed = addMaterial(current.materialId);
    } else if (!cancelled && draft && draft.width >= 20 && draft.height >= 20) {
      commit(current.kind === 'create' ? [...clips, draft] : clips.map(clip => clip.id === draft.id ? draft : clip));
      if (current.kind === 'create') controls.created();
      completed = true;
    } else if (current.kind !== 'create') controls.move(current.before);
    setDraft(null);
    if (completed) {
      if(!cancelled&&current.kind==='create')capturedClick.current={x:event.clientX,y:event.clientY,until:Date.now()+600};
      controls.finish();
    }
    if (layer.current?.hasPointerCapture(event.pointerId)) layer.current.releasePointerCapture(event.pointerId);
  };
  const placed = (clip: Pick<ClipFrame,"x"|"y"|"width"|"height">) => ({left:(clip.x+camera.scrollX)*camera.zoom.value,top:(clip.y+camera.scrollY)*camera.zoom.value,width:clip.width*camera.zoom.value,height:clip.height*camera.zoom.value});
  const visible = draft ? [...clips.filter(clip => clip.id !== draft.id), draft] : clips;
  return <div ref={layer} className={`clip-layer ${controls.creating ? 'is-creating' : ''}`}
    style={{'--clip-number-scale': Math.min(1, camera.zoom.value)} as CSSProperties}
    onPointerDown={event => {
      if (!controls.creating || clips.length >= 99) return;
      const p = point(event);
      const material = [...api.getSceneElements()].reverse().find(element => canBeMaterialClipElement(element) && materialContainsPoint(element,p));
      begin(event, {id:crypto.randomUUID(),number:nextClipNumber(clips),...p,width:0,height:0}, 'create', material?.id);
    }}
    onPointerMove={event => {
      const current = drag.current;
      if (!current || event.pointerId !== current.pointer) return;
      event.preventDefault(); event.stopPropagation();
      const p = point(event), dx = p.x-current.x, dy = p.y-current.y, b = current.before;
      const next = current.kind === 'create' ? {...b,x:Math.min(current.x,p.x),y:Math.min(current.y,p.y),width:Math.abs(dx),height:Math.abs(dy)}
        : current.kind === 'move' ? {...b,x:b.x+dx,y:b.y+dy}
        : {...b,width:Math.max(20,b.width+dx),height:Math.max(20,b.height+dy)};
      setDraft(next);
      if (current.kind !== 'create') controls.move(next);
    }} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event,true)}>
    {undo && !controls.creating && <div className="clip-undo"><button onClick={() => {change(undo);setUndo(null);}}>{t("Clip-Änderung rückgängig")}</button><button aria-label={t("Rückgängig-Hinweis schließen")} onClick={()=>setUndo(null)}><X/></button></div>}
    {visible.map(clip => {
      const material = isMaterialClip(clip)
        ? api.getSceneElements().find(element => element.id === clip.elementId && !element.isDeleted
          && (canBeMaterialClipElement(element) || element.customData?.materialKind === "audio")) : null;
      if (isMaterialClip(clip) && !material) return null;
      // Keep older audio frames removable without creating or presenting new audio clips.
      const audioClip = material?.customData?.materialKind === "audio";
      const canShow = !isMaterialClip(clip) || (controls.canShowMaterial(isMaterialClip(clip)?clip.elementId:'') && !audioClip);
      const bounds = material ? getCommonBounds([material]) : null;
      const geometry = bounds
        ? {x:bounds[0],y:bounds[1],width:bounds[2]-bounds[0],height:bounds[3]-bounds[1]}
        : clip as ClipFrame;
      const position = placed(geometry);
      const selected = controls.activeId === clip.id;
      const live = selected && controls.shown;
      return <div key={clip.id} className={`clip-frame ${isMaterialClip(clip) ? 'is-material' : ''} ${live ? 'is-active' : selected ? 'is-selected' : ''}`}
      style={position as CSSProperties}>
      {material && <div className="clip-material-outline" aria-hidden="true" style={{
        left: (material.x - geometry.x) * camera.zoom.value,
        top: (material.y - geometry.y) * camera.zoom.value,
        width: material.width * camera.zoom.value,
        height: material.height * camera.zoom.value,
        transform: `rotate(${material.angle}rad)`,
        borderRadius: getMaterialBorderRadius(material, camera.zoom.value),
      }}/>}
      <div className="clip-frame-status" onContextMenu={event => {
        event.preventDefault(); event.stopPropagation();
        clearPress();
        openMenu(clip,event.clientX,event.clientY);
      }}>
        <button className={`clip-number ${live ? 'is-live' : ''}`} aria-label={t(isMaterialClip(clip) ? "Materialclip {0} zeigen" : "Clip {0} zeigen", clip.number)} aria-description={live ? 'Live' : undefined} aria-pressed={selected}
          title={audioClip ? t("Audio spielt ohne Materialansicht") : isMaterialClip(clip) && !controls.canShowMaterial(clip.elementId) ? t("Materialclip nur in Room Canvas") : t("Clip {0} zeigen{1}", clip.number, clip.number < 10 ? ` (${clip.number})` : '')}
          aria-disabled={!canShow}
          onPointerDown={event => {
            event.stopPropagation(); clearPress();
            if (event.pointerType === 'touch' || event.pointerType === 'pen') {
              const {clientX,clientY} = event;
              press.current = {x:clientX,y:clientY,timer:window.setTimeout(() => {suppressClick.current = true; openMenu(clip,clientX,clientY); press.current = null;},550)};
            }
          }} onPointerMove={event => {if (press.current && Math.hypot(event.clientX-press.current.x,event.clientY-press.current.y)>8) clearPress();}}
          onPointerUp={clearPress} onPointerCancel={clearPress}
          onClick={event => {event.stopPropagation(); if (suppressClick.current) {suppressClick.current = false; return;} if (canShow) controls.show(clip);}}><span className="clip-number-badge">{clip.number}{selected && controls.pending && <span className="clip-pending"/>}</span></button>
      </div>
      {!isMaterialClip(clip) && <div className="clip-frame-actions">
        <button aria-label={t("Clip {0} verschieben", clip.number)} title={t("Verschieben")} className="clip-move" onPointerDown={event => begin(event,clip,'move')}><Grip/></button>
      </div>}
      {!isMaterialClip(clip) && <button className="clip-resize" aria-label={t("Clip {0} Größe ändern", clip.number)} onPointerDown={event => begin(event,clip,'resize')}/>}
    </div>;})}
    {menu && (() => {
      const clip = clips.find(item => item.id === menu.clipId);
      if (!clip) return null;
      return <div ref={menuRef} className="clip-context-menu" style={{left:menu.x,top:menu.y}} role="menu" aria-label={t("Clip {0} bearbeiten", clip.number)} onPointerDown={event => event.stopPropagation()}>
        {menu.editing ? <form onSubmit={event => {event.preventDefault(); reassign(clip,Number(newNumber));}}>
          <label htmlFor="clip-new-number">{t("Neue Nummer")}</label>
          <div className="clip-context-row"><input id="clip-new-number" autoFocus type="number" min="1" max="99" step="1" value={newNumber} onChange={event => setNewNumber(event.target.value)}/><button type="submit" disabled={!/^\d+$/.test(newNumber) || Number(newNumber)<1 || Number(newNumber)>99}>{t("Übernehmen")}</button></div>
        </form> : <>
          <button role="menuitem" onClick={() => setMenu({...menu,editing:true})}>{t("Nummer ändern")}</button>
          <button role="menuitem" onClick={() => {controls.removed(clip); commit(clips.filter(item=>item.id!==clip.id)); setMenu(null);}}>{t("Entfernen")}</button>
        </>}
      </div>;
    })()}
  </div>;
}
