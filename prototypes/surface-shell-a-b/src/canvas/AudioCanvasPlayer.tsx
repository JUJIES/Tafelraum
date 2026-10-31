import { t, useUiLocale } from "../i18n";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  ChevronDown,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { getAudioPlayerViewportScale } from "./audio-embed";

export type AudioCanvasPlayerFrame = {
  angle: number;
  centerX: number;
  centerY: number;
  elementId: string;
  fileName: string;
  height: number;
  sourceUrl: string;
  width: number;
};

type AudioCanvasPlayerProps = {
  frame: AudioCanvasPlayerFrame;
  materialShadow: boolean;
  presentedId?:string|null;
  onPlayback?(elementId:string,playing:boolean,position:number):void;
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
  return `${Math.floor(value / 60)}:${String(Math.floor(value) % 60).padStart(2, "0")}`;
}

function stopCanvasPointer(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function isAudioControlTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("button, input, select, label"));
}

export function AudioCanvasPlayer({ frame, materialShadow, presentedId, onContextMenu, onMoveStart, onPlayback }: AudioCanvasPlayerProps) {
  useUiLocale();
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasPresented=useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const scale = getAudioPlayerViewportScale(frame.width, frame.height);

  const syncTime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.playbackRate = speed;
  }, [speed, volume]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [frame.sourceUrl]);

  useEffect(()=>{
    if(presentedId===frame.elementId){wasPresented.current=true;return;}
    if(wasPresented.current){audioRef.current?.pause();wasPresented.current=false;}
  },[frame.elementId,presentedId]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = audio.currentTime + seconds;
    audio.currentTime = Math.max(0, Math.min(Number.isFinite(audio.duration) ? audio.duration : next, next));
    syncTime();
  }, [syncTime]);

  const progress = duration > 0 ? currentTime / duration * 100 : 0;
  const volumeProgress = volume * 100;
  const frameStyle = {
    "--audio-player-scale": scale,
    height: frame.height,
    left: frame.centerX,
    top: frame.centerY,
    transform: `translate(-50%, -50%) rotate(${frame.angle}rad)`,
    width: frame.width,
  } as CSSProperties;
  const surfaceStyle = { transform: `scale(${scale})` } as CSSProperties;

  return (
    <div
      className={`audio-canvas-player${materialShadow ? " has-material-shadow" : ""}`}
      style={frameStyle}
      data-canvas-element-id={frame.elementId}
    >
      <div
        className="audio-canvas-player__surface"
        style={surfaceStyle}
        onContextMenu={(event) => {
          if (isAudioControlTarget(event.target)) return;
          onContextMenu(event, frame.elementId);
        }}
        onPointerDown={(event) => {
          if (isAudioControlTarget(event.target)) return;
          onMoveStart(event, frame.elementId);
        }}
      >
        <audio
          ref={audioRef}
          preload="metadata"
          src={frame.sourceUrl}
          onDurationChange={syncTime}
          onEnded={() => {
            setIsPlaying(false);
            syncTime();
            onPlayback?.(frame.elementId,false,audioRef.current?.currentTime??0);
          }}
          onLoadedMetadata={syncTime}
          onPause={event => {setIsPlaying(false);onPlayback?.(frame.elementId,false,event.currentTarget.currentTime);}}
          onPlay={event => {setIsPlaying(true);onPlayback?.(frame.elementId,true,event.currentTarget.currentTime);}}
          onTimeUpdate={event => {syncTime();onPlayback?.(frame.elementId,!event.currentTarget.paused,event.currentTarget.currentTime);}}
          onSeeked={event => onPlayback?.(frame.elementId,!event.currentTarget.paused,event.currentTarget.currentTime)}
        />
        <button
          className="audio-canvas-player__play"
          type="button"
          aria-label={isPlaying ? t("Pausieren") : t("Abspielen")}
          title={isPlaying ? t("Pausieren") : t("Abspielen")}
          onClick={togglePlayback}
          onPointerDown={stopCanvasPointer}
        >
          {isPlaying ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}
        </button>

        <div className="audio-canvas-player__center">
          {!settingsOpen ? (
            <>
              <div
                className="audio-canvas-player__meta"
              >
                <strong title={frame.fileName}>{displayTitle(frame.fileName)}</strong>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <input
                className="audio-canvas-player__range audio-canvas-player__timeline"
                type="range"
                min={0}
                max={Math.max(duration, 0)}
                step={0.1}
                value={Math.min(currentTime, Math.max(duration, 0))}
                aria-label={t("Wiedergabeposition")}
                style={{ "--audio-progress": `${progress}%` } as CSSProperties}
                onChange={(event) => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.currentTime = Number(event.currentTarget.value);
                  syncTime();
                }}
                onPointerDown={stopCanvasPointer}
              />
            </>
          ) : (
            <div className="audio-canvas-player__settings">
              <label className="audio-canvas-player__volume">
                <Volume2 aria-hidden="true"/>
                <span className="sr-only">{t("Lautstärke")}</span>
                <input
                  className="audio-canvas-player__range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  aria-label={t("Lautstärke")}
                  style={{ "--audio-progress": `${volumeProgress}%` } as CSSProperties}
                  onChange={(event) => setVolume(Number(event.currentTarget.value))}
                  onPointerDown={stopCanvasPointer}
                />
              </label>
              <label className="audio-canvas-player__speed">
                <Gauge aria-hidden="true"/>
                <span className="sr-only">{t("Abspielgeschwindigkeit")}</span>
                <select
                  value={speed}
                  aria-label={t("Abspielgeschwindigkeit")}
                  onChange={(event) => setSpeed(Number(event.currentTarget.value))}
                  onPointerDown={stopCanvasPointer}
                >
                  <option value={0.75}>0.75×</option>
                  <option value={1}>1×</option>
                  <option value={1.25}>1.25×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2×</option>
                </select>
                <ChevronDown aria-hidden="true" className="audio-canvas-player__chevron"/>
              </label>
            </div>
          )}
        </div>

        <div className="audio-canvas-player__actions">
          <button type="button" aria-label={t("10 Sekunden zurück")} title={t("10 Sekunden zurück")} onClick={() => skip(-10)} onPointerDown={stopCanvasPointer}>
            <RotateCcw aria-hidden="true"/>
            <span aria-hidden="true">10</span>
          </button>
          <button type="button" aria-label={t("10 Sekunden vor")} title={t("10 Sekunden vor")} onClick={() => skip(10)} onPointerDown={stopCanvasPointer}>
            <RotateCw aria-hidden="true"/>
            <span aria-hidden="true">10</span>
          </button>
          <button
            type="button"
            aria-label={t("Wiedergabe einstellen")}
            aria-expanded={settingsOpen}
            title={t("Wiedergabe einstellen")}
            onClick={() => setSettingsOpen((open) => !open)}
            onPointerDown={stopCanvasPointer}
          >
            <SlidersHorizontal aria-hidden="true"/>
          </button>
        </div>
      </div>
    </div>
  );
}
