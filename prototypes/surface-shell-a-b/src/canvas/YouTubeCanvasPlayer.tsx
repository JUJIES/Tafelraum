import { t, useUiLocale } from "../i18n";
import {useRoomVideoStatus} from '../live/room-video-status';
import {RoomVideoController} from './RoomVideoController';
import { Expand, Minimize2 } from 'lucide-react';
import { useVideoFullscreen, type VideoFullscreenControls } from './useVideoFullscreen';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  getYouTubeEmbedUrl,
  getYouTubePlaybackCommand,
  getYouTubePlayingStateFromMessage,
  getYouTubeCurrentTimeFromMessage,
  getYouTubeVolumeFromMessage,
  shouldToggleYouTubePlaybackAfterGesture,
} from "./youtube-embed";

export type YouTubeCanvasPlayerFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  covered: boolean;
  elementId: string;
  height: number;
  providerControlsHeight: number;
  providerTopControlsHeight: number;
  surfaceHeight: number;
  surfaceScale: number;
  surfaceWidth: number;
  title: string;
  videoId: string;
  width: number;
};

type YouTubeCanvasPlayerProps = {
  active: boolean;
  frame: YouTubeCanvasPlayerFrame;
  fullscreenControls?:VideoFullscreenControls;
  presentedId?:string|null;
  onActivate(elementId: string): void;
  initialPosition?:number;initialVolume?:number;
  onPlayback?(elementId:string,playing:boolean,position:number,volume?:number):void;
  onContextMenu(event: ReactMouseEvent<HTMLButtonElement>, elementId: string): void;
  onMoveStart(event: ReactPointerEvent<HTMLButtonElement>, elementId: string, onMoved: () => void): void;
};

const youtubePlayerOrigin = "https://www.youtube-nocookie.com";

function LocalYouTubeCanvasPlayer({ active, frame, presentedId, fullscreenControls, onActivate, onContextMenu, onMoveStart, onPlayback, initialPosition=0, initialVolume=1 }: YouTubeCanvasPlayerProps) {
  useUiLocale();
  const rootRef=useRef<HTMLDivElement>(null);
  const fullscreen=useVideoFullscreen(frame.elementId,rootRef,fullscreenControls);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wasPresented=useRef(false);
  const gestureMovedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playingRef=useRef(false);
  const timeRef=useRef(initialPosition),volumeRef=useRef(initialVolume);
  const sourceUrl = useMemo(()=>{const url=new URL(getYouTubeEmbedUrl(frame.videoId,window.location.origin));url.searchParams.set('fs','0');return url.href;},[frame.videoId]);
  const frameStyle = {
    "--youtube-fullscreen-scale":Math.min(1,frame.width/640),
    height: frame.height,
    left: frame.centerX,
    top: frame.centerY,
    transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
    width: frame.width,
  } as CSSProperties;
  const surfaceStyle = {
    height: frame.surfaceHeight,
    transform: `scale(${frame.surfaceScale})`,
    width: frame.surfaceWidth,
  } as CSSProperties;

  const sendPlayerMessage = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), youtubePlayerOrigin);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!shouldToggleYouTubePlaybackAfterGesture(gestureMovedRef.current)) {
      gestureMovedRef.current = false;
      return;
    }
    onActivate(frame.elementId);
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    playingRef.current=nextPlaying;
    onPlayback?.(frame.elementId,nextPlaying,timeRef.current);
    sendPlayerMessage({
      event: "command",
      func: getYouTubePlaybackCommand(isPlaying),
      args: [],
    });
  }, [frame.elementId, isPlaying, onActivate, onPlayback, sendPlayerMessage]);

  const listenForPlayerState = useCallback(() => {
    sendPlayerMessage({ event: "listening", id: frame.elementId });
    sendPlayerMessage({event:'command',func:'setVolume',args:[initialVolume*100]});
    if(initialPosition>0)sendPlayerMessage({event:'command',func:'seekTo',args:[initialPosition,true]});
  }, [frame.elementId, sendPlayerMessage]);

  useEffect(()=>{
    if(presentedId===frame.elementId){wasPresented.current=true;return;}
    if(wasPresented.current){
      sendPlayerMessage({event:'command',func:'pauseVideo',args:[]});
      playingRef.current=false;setIsPlaying(false);wasPresented.current=false;
    }
  },[frame.elementId,presentedId,sendPlayerMessage]);

  useEffect(() => {
    const receivePlayerState = (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow
        || (event.origin !== youtubePlayerOrigin && event.origin !== "https://www.youtube.com")
      ) return;
      const playingState = getYouTubePlayingStateFromMessage(event.data);
      const position=getYouTubeCurrentTimeFromMessage(event.data);
      const volume=getYouTubeVolumeFromMessage(event.data);if(volume!==null)volumeRef.current=volume;
      if(position!==null)timeRef.current=position;
      if (playingState !== null) {playingRef.current=playingState;setIsPlaying(playingState);}
      if(playingState!==null||position!==null)onPlayback?.(frame.elementId,playingRef.current,timeRef.current,volumeRef.current);
    };
    window.addEventListener("message", receivePlayerState);
    return () => window.removeEventListener("message", receivePlayerState);
  }, [frame.elementId,onPlayback]);

  return (
    <div ref={rootRef}
      className={`youtube-canvas-player${active ? " is-active" : ""}${frame.covered ? " is-covered" : ""}`}
      data-canvas-element-id={frame.elementId}
      style={frameStyle}
    >
      <div className="youtube-canvas-player__surface" style={surfaceStyle}>
        <iframe
          ref={iframeRef}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={listenForPlayerState}
          src={sourceUrl}
          title={frame.title}
        />
        {!frame.covered && (
          <button
            className={`youtube-canvas-player__activation${active ? " is-active" : ""}`}
            style={active ? {
              bottom: frame.providerControlsHeight,
              top: frame.providerTopControlsHeight,
            } : undefined}
            type="button"
            aria-label={isPlaying ? t("Video pausieren oder verschieben") : t("Video abspielen oder verschieben")}
            onClick={togglePlayback}
            onContextMenu={(event) => onContextMenu(event, frame.elementId)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              gestureMovedRef.current = false;
              onMoveStart(event, frame.elementId, () => {
                gestureMovedRef.current = true;
              });
            }}
          />
        )}
      </div>
      {!frame.covered&&<button type="button" className="youtube-canvas-player__fullscreen"
        aria-label={fullscreen.active?t("Vollbild verlassen"):t("Vollbild")} title={fullscreen.active?t("Vollbild verlassen"):t("Vollbild")}
        onPointerDown={event=>event.stopPropagation()} onClick={()=>{onActivate(frame.elementId);void fullscreen.toggle();}}>
        {fullscreen.active?<Minimize2 aria-hidden="true"/>:<Expand aria-hidden="true"/>}
      </button>}
      {fullscreen.error&&<div className="video-fullscreen-error" role="alert">{t(fullscreen.error)}</div>}
    </div>
  );
}

export function YouTubeCanvasPlayer(props:YouTubeCanvasPlayerProps){
  const position=useRef(0),volume=useRef(1);
  const status=useRoomVideoStatus(props.frame.elementId);
  if(props.fullscreenControls?.active&&status){position.current=status.position;volume.current=status.volume;}
  if(props.fullscreenControls?.active)return <RoomVideoController frame={props.frame} title={props.frame.title} position={position.current} initialVolume={volume.current}
    fullscreenControls={props.fullscreenControls} onPlayback={props.onPlayback}
    onContextMenu={(event,id)=>props.onContextMenu(event as never,id)}
    onMoveStart={(event,id)=>props.onMoveStart(event as never,id,()=>{})}/>;
  return <LocalYouTubeCanvasPlayer {...props} initialPosition={position.current} initialVolume={volume.current} onPlayback={(id,playing,time,nextVolume)=>{position.current=time;if(nextVolume!==undefined)volume.current=nextVolume;props.onPlayback?.(id,playing,time,nextVolume);}}/>;
}
