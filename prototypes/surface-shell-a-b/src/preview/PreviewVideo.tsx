// Included only by the public preview build. Both windows wait for a visitor gesture.
import { useState, type ComponentProps, type CSSProperties } from 'react';
import { YouTubeCanvasPlayer as Player } from '../canvas/YouTubeCanvasPlayer';
import { RoomMediaLayer as RoomMedia } from '../live/RoomMediaLayer';

function Invitation({style, load}: {style: CSSProperties; load: () => void}) {
  return <div className="preview-film" style={style}>
    <span>USGS · KĪLAUEA</span>
    <strong>Kīlauea Volcano — Fissure 8</strong>
    <button type="button" onClick={load}>▶ Load YouTube video</button>
    <a href="https://www.youtube.com/watch?v=Av_NEjoeyUM" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
  </div>;
}
export function YouTubeCanvasPlayer(props: ComponentProps<typeof Player>) {
  const [enabled,setEnabled]=useState(false);
  const f=props.frame;
  if(enabled)return <Player {...props}/>;
  if(f.covered)return null;
  return <Invitation load={()=>setEnabled(true)} style={{left:f.centerX,top:f.centerY,width:f.width,height:f.height,transform:`translate(-50%, -50%) rotate(${f.angle}rad)`}}/>;
}
export function RoomMediaLayer(props: ComponentProps<typeof RoomMedia>) {
  const [enabled,setEnabled]=useState(false);
  if(props.media.kind!=='youtube'||enabled)return <RoomMedia {...props}/>;
  return <Invitation load={()=>setEnabled(true)} style={{inset:'25%',zIndex:4}}/>;
}
