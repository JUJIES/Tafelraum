import { useEffect, useRef } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { HostPointer, Viewport } from '../../../../shared/live-canvas/protocol';
import type { HostPointerChannel } from './host-pointer-channel';
import { laserStyles, trailLifetime, visibleTrail, type TrailPoint } from './laser-trail';
import './laser.css';

/** One bounded ephemeral renderer for local and remote presence. Never engine elements. */
export function HostPointerOverlay({ api, channel, generation, enabled, bounds, local = false }: {
  api: ExcalidrawImperativeAPI; channel: HostPointerChannel; generation: number; enabled: boolean;
  bounds?: Viewport | null; local?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current!, ctx = node.getContext('2d')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, expiry: ReturnType<typeof setTimeout>, points: TrailPoint[] = [];
    let lastSample: TrailPoint | null = null;
    let target: HostPointer | null = null, current: {x:number;y:number} | null = null;
    let from = {x:0,y:0}, started = 0, stroke = 0, pulse = -Infinity;
    const clear = () => {
      cancelAnimationFrame(frame); frame = 0; clearTimeout(expiry);
      points = []; lastSample = null; target = null; current = null; node.hidden = true;
    };
    const draw = (now: number) => {
      frame = 0;
      if (!enabled) return clear();
      if (target && !local && now - channel.receivedAt >= 3000) { target = null; current = null; stroke++; }
      const state = api.getAppState(), dpr = Math.min(2, devicePixelRatio || 1);
      const width = Math.round(state.width*dpr), height = Math.round(state.height*dpr);
      if (node.width !== width || node.height !== height) { node.width = width; node.height = height; }
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,state.width,state.height);
      ctx.save();
      const screen = (p:{x:number;y:number}) => ({x:(p.x+state.scrollX)*state.zoom.value,y:(p.y+state.scrollY)*state.zoom.value});
      if (bounds) { const p=screen(bounds);ctx.beginPath();ctx.rect(p.x,p.y,bounds.width*state.zoom.value,bounds.height*state.zoom.value);ctx.clip(); }
      let moving = false;
      if (target) {
        const t = local || reduced.matches ? 1 : Math.min(1,(now-started)/34);
        current = {x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t}; moving = t < 1;
        // Keep the sampling anchor after expiry so a resting head lets RAF sleep.
        const previous = lastSample;
        if (!reduced.matches && (!previous || previous.stroke !== stroke || Math.hypot(current.x-previous.x,current.y-previous.y)*state.zoom.value > 1.5)) {
          lastSample = {...current,at:now,stroke,pressed:target.pressed,style:target.style ?? 'comet'};
          points.push(lastSample);
        }
      }
      points = reduced.matches ? [] : visibleTrail(points,now);
      // Each stroke is filled once: overlapping translucent line caps would bead at joins.
      const groups: TrailPoint[][]=[];
      for(const point of points){const previous=groups.at(-1);if(previous?.[0].stroke===point.stroke)previous.push(point);else groups.push([point]);}
      for(const group of groups){
        if(group.length<2)continue;
        const style=group[0].style, color=laserStyles.find(item=>item.id===style)!.color;
        const centers=group.map(screen), head=centers.at(-1)!, tail=centers[0];
        const lastAge=Math.max(0,1-(now-group.at(-1)!.at)/trailLifetime(group.at(-1)!));
        const gradient=ctx.createLinearGradient(tail.x,tail.y,head.x+.01,head.y);
        gradient.addColorStop(0,style==='ribbon'?'#40bbdc22':color+'18');gradient.addColorStop(1,color);
        const outline=(spread:number)=>{
          const upper: {x:number;y:number}[]=[],lower: {x:number;y:number}[]=[];
          centers.forEach((p,i)=>{
            const before=centers[Math.max(0,i-1)],after=centers[Math.min(centers.length-1,i+1)];
            const dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1;
            const age=Math.max(0,1-(now-group[i].at)/trailLifetime(group[i]));
            const width=(style==='ribbon'?2.5:1.65)*age*spread+.15;
            upper.push({x:p.x-dy/len*width,y:p.y+dx/len*width});lower.push({x:p.x+dy/len*width,y:p.y-dx/len*width});
          });
          const edge=[...upper,...lower.reverse()];ctx.beginPath();ctx.moveTo(edge[0].x,edge[0].y);
          for(let i=1;i<edge.length;i++){const p=edge[i],next=edge[(i+1)%edge.length];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);}
          ctx.closePath();ctx.fill();
        };
        ctx.fillStyle=gradient;ctx.globalAlpha=lastAge*.16;outline(3.5);ctx.globalAlpha=lastAge*.95;outline(1);
        if(style==='spark')group.forEach((point,i)=>{if(i%4)return;const p=centers[i],age=Math.max(0,1-(now-point.at)/trailLifetime(point)),life=1-age,angle=i*2.39996;
          ctx.globalAlpha=age*age*.8;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x+Math.cos(angle)*life*18,p.y+Math.sin(angle)*life*18,1.2*age+.2,0,Math.PI*2);ctx.fill();});
      }
      if(current && target) {
        const p=screen(current), color=laserStyles.find(style=>style.id===(target!.style??'comet'))!.color;
        const halo=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,18);halo.addColorStop(0,color+'a0');halo.addColorStop(1,color+'00');
        ctx.globalAlpha=1;ctx.fillStyle=halo;ctx.fillRect(p.x-18,p.y-18,36,36);
        ctx.shadowColor='#14253699';ctx.shadowBlur=3;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,target.pressed?5:4,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,Math.PI*2);ctx.fill();
        const ring=(now-pulse)/420;
        if(!reduced.matches && ring>=0 && ring<1) {ctx.globalAlpha=(1-ring)*.65;ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,7+ring*18,0,Math.PI*2);ctx.stroke();moving=true;}
      }
      ctx.restore();node.hidden=!target && points.length===0;
      if(moving || points.length) frame=requestAnimationFrame(draw);
    };
    const schedule=()=>{if(!frame) frame=requestAnimationFrame(draw);};
    const receive=()=>{
      const message=channel.current;
      if(!enabled || (message && message.generation!==generation)) return clear();
      const next=message?.pointer;
      if(!next || next.tool!=='laser') {target=null;current=null;stroke++;schedule();return;}
      if(!target || target.style!==next.style || target.pressed!==next.pressed) stroke++;
      if(next.pressed && !target?.pressed) pulse=performance.now();
      from=current??next;target=next;started=performance.now();
      clearTimeout(expiry);expiry=setTimeout(schedule,3005);schedule();
    };
    const unsub=channel.subscribe(receive), scroll=api.onScrollChange(()=>{current=null;points=[];schedule();}), resize=api.onChange(schedule);
    receive();return()=>{unsub();scroll();resize();clear();};
  },[api,channel,generation,enabled,bounds,local]);
  return <canvas ref={canvas} className="live-laser-overlay" hidden aria-hidden="true"/>;
}
