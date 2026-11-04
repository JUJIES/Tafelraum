import { t, useUiLocale } from "../i18n";
import {useRoomVideoStatus} from '../live/room-video-status';
import {RoomVideoController} from './RoomVideoController';
import { useVideoFullscreen, type VideoFullscreenControls } from './useVideoFullscreen';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Expand, Minimize2, Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { getVideoPlayerViewportScale } from "./video-embed";

export type VideoCanvasPlayerFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  covered: boolean;
  elementId: string;
  fileName: string;
  height: number;
  sourceUrl: string;
  width: number;
};

type VideoCanvasPlayerProps = {
  frame: VideoCanvasPlayerFrame;
  materialShadow: boolean;
  fullscreenControls?:VideoFullscreenControls;
  presentedId?:string|null;
  initialPosition?:number;initialVolume?:number;
  onPlayback?(elementId:string,playing:boolean,position:number,volume?:number):void;
  onContextMenu(event: ReactMouseEvent<HTMLDivElement>, elementId: string): void;
  onMoveStart(event: ReactPointerEvent<HTMLDivElement>, elementId: string): void;
};

function displayTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value / 60) % 60;
  const seconds = Math.floor(value) % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function stopCanvasPointer(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function isVideoControlTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("button, input, label"));
}

function LocalVideoCanvasPlayer({ frame, materialShadow, presentedId, fullscreenControls, onContextMenu, onMoveStart, onPlayback, initialPosition=0, initialVolume=1 }: VideoCanvasPlayerProps) {
  useUiLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const fullscreen=useVideoFullscreen(frame.elementId,rootRef,fullscreenControls);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPresented=useRef(false);
  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;
    player.src = frame.sourceUrl;
    return () => {
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [frame.sourceUrl]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const scale = getVideoPlayerViewportScale(frame.width, frame.height);

  const syncTime = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume;
  }, [volume]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [frame.sourceUrl]);

  useEffect(()=>{
    if(presentedId===frame.elementId){wasPresented.current=true;return;}
    if(wasPresented.current){videoRef.current?.pause();wasPresented.current=false;}
  },[frame.elementId,presentedId]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setIsPlaying(false));
    else video.pause();
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = video.currentTime + seconds;
    video.currentTime = Math.max(0, Math.min(Number.isFinite(video.duration) ? video.duration : next, next));
    syncTime();
  }, [syncTime]);

  const progress = duration > 0 ? currentTime / duration * 100 : 0;
  const frameStyle = {
    "--video-player-scale": scale,
    height: frame.height,
    left: frame.centerX,
    top: frame.centerY,
    transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
    width: frame.width,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`local-video-canvas-player${materialShadow ? " has-material-shadow" : ""}${frame.covered ? " is-covered" : ""}`}
      style={frameStyle}
      data-canvas-element-id={frame.elementId}
    >
      <div
        className="local-video-canvas-player__surface"
        style={{ transform: `scale(${scale})` }}
        onContextMenu={(event) => {
          if (isVideoControlTarget(event.target)) return;
          onContextMenu(event, frame.elementId);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || isVideoControlTarget(event.target)) return;
          onMoveStart(event, frame.elementId);
        }}
      >
        <video
          ref={videoRef}
          preload="metadata"
          onVolumeChange={event=>onPlayback?.(frame.elementId,!event.currentTarget.paused,event.currentTarget.currentTime,event.currentTarget.volume)}
          onDurationChange={syncTime}
          onEnded={() => {
            setIsPlaying(false);
            syncTime();
            onPlayback?.(frame.elementId,false,videoRef.current?.currentTime??0);
          }}
          onLoadedMetadata={event=>{event.currentTarget.currentTime=initialPosition;syncTime();}}
          onPause={event => {setIsPlaying(false);onPlayback?.(frame.elementId,false,event.currentTarget.currentTime);}}
          onPlay={event => {setIsPlaying(true);onPlayback?.(frame.elementId,true,event.currentTarget.currentTime);}}
          onTimeUpdate={event => {syncTime();onPlayback?.(frame.elementId,!event.currentTarget.paused,event.currentTarget.currentTime);}}
          onSeeked={event => onPlayback?.(frame.elementId,!event.currentTarget.paused,event.currentTarget.currentTime)}
        />

        {!isPlaying && !frame.covered && (
          <button
            className="local-video-canvas-player__main-play"
            type="button"
            aria-label={t("Abspielen")}
            title={t("Abspielen")}
            onClick={togglePlayback}
            onPointerDown={stopCanvasPointer}
          >
            <Play aria-hidden="true"/>
          </button>
        )}

        <div className="local-video-canvas-player__controls">
          <button
            type="button"
            aria-label={isPlaying ? t("Pausieren") : t("Abspielen")}
            title={isPlaying ? t("Pausieren") : t("Abspielen")}
            onClick={togglePlayback}
            onPointerDown={stopCanvasPointer}
          >
            {isPlaying ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}
          </button>
          <button type="button" aria-label={t("10 Sekunden zurück")} title={t("10 Sekunden zurück")} onClick={() => skip(-10)} onPointerDown={stopCanvasPointer}>
            <RotateCcw aria-hidden="true"/>
            <span aria-hidden="true">10</span>
          </button>
          <button type="button" aria-label={t("10 Sekunden vor")} title={t("10 Sekunden vor")} onClick={() => skip(10)} onPointerDown={stopCanvasPointer}>
            <RotateCw aria-hidden="true"/>
            <span aria-hidden="true">10</span>
          </button>
          <span className="local-video-canvas-player__title" title={frame.fileName}>{displayTitle(frame.fileName)}</span>
          <input
            className="local-video-canvas-player__range local-video-canvas-player__timeline"
            type="range"
            min={0}
            max={Math.max(duration, 0)}
            step={0.1}
            value={Math.min(currentTime, Math.max(duration, 0))}
            aria-label={t("Wiedergabeposition")}
            style={{ "--video-progress": `${progress}%` } as CSSProperties}
            onChange={(event) => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = Number(event.currentTarget.value);
              syncTime();
            }}
            onPointerDown={stopCanvasPointer}
          />
          <span className="local-video-canvas-player__time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <label className="local-video-canvas-player__volume">
            <Volume2 aria-hidden="true"/>
            <span className="sr-only">{t("Lautstärke")}</span>
            <input
              className="local-video-canvas-player__range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label={t("Lautstärke")}
              style={{ "--video-progress": `${volume * 100}%` } as CSSProperties}
              onChange={(event) => setVolume(Number(event.currentTarget.value))}
              onPointerDown={stopCanvasPointer}
            />
          </label>
          <button
            type="button"
            aria-label={fullscreen.active?t("Vollbild verlassen"):t("Vollbild")}
            title={fullscreen.active?t("Vollbild verlassen"):t("Vollbild")}
            onClick={()=>void fullscreen.toggle()}
            onPointerDown={stopCanvasPointer}
          >
            {fullscreen.active?<Minimize2 aria-hidden="true"/>:<Expand aria-hidden="true"/>}
          </button>
        </div>
      </div>
      {fullscreen.error&&<div className="video-fullscreen-error" role="alert">{t(fullscreen.error)}</div>}
    </div>
  );
}

export function VideoCanvasPlayer(props:VideoCanvasPlayerProps){
  const position=useRef(0),volume=useRef(1);
  const status=useRoomVideoStatus(props.frame.elementId);
  if(props.fullscreenControls?.active&&status){position.current=status.position;volume.current=status.volume;}
  if(props.fullscreenControls?.active)return <RoomVideoController frame={props.frame} title={props.frame.fileName} position={position.current} initialVolume={volume.current}
    fullscreenControls={props.fullscreenControls} onPlayback={props.onPlayback}
    onContextMenu={(event,id)=>props.onContextMenu(event as never,id)}
    onMoveStart={(event,id)=>props.onMoveStart(event,id)}/>;
  return <LocalVideoCanvasPlayer {...props} initialPosition={position.current} initialVolume={volume.current} onPlayback={(id,playing,time,nextVolume)=>{position.current=time;if(nextVolume!==undefined)volume.current=nextVolume;props.onPlayback?.(id,playing,time,nextVolume);}}/>;
}
