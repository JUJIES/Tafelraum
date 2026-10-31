import { t, useUiLocale } from "../i18n";
import { useEffect, useState } from "react";
import maximizeUrl from "@fluentui/svg-icons/icons/full_screen_maximize_24_regular.svg";
import minimizeUrl from "@fluentui/svg-icons/icons/full_screen_minimize_24_regular.svg";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function currentFullscreenElement() {
  return document.fullscreenElement ?? (document as WebkitDocument).webkitFullscreenElement ?? null;
}

function supportsFullscreen() {
  const root = document.documentElement as WebkitElement;
  return typeof root.requestFullscreen === "function" || typeof root.webkitRequestFullscreen === "function";
}

async function toggleFullscreen() {
  const webkitDocument = document as WebkitDocument;
  const root = document.documentElement as WebkitElement;
  if (currentFullscreenElement()) {
    if (typeof document.exitFullscreen === "function") await document.exitFullscreen();
    else await webkitDocument.webkitExitFullscreen?.();
    return;
  }
  if (typeof root.requestFullscreen === "function") await root.requestFullscreen({ navigationUI: "hide" });
  else await root.webkitRequestFullscreen?.();
}

function FullscreenIcon({ url }: { url: string }) {
  return <span aria-hidden="true" className="live-fluent" style={{ maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` }}/>
}

export function ViewerFullscreenButton() {
  useUiLocale();
  const [supported] = useState(supportsFullscreen);
  const [standalone] = useState(() => window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [active, setActive] = useState(Boolean(currentFullscreenElement()));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const update = () => { setActive(Boolean(currentFullscreenElement())); setFailed(false); };
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, []);

  if (!supported || standalone) return null;
  const label = active ? t("Vollbild verlassen") : t("Vollbild");
  return <>
    <button className="live-fullscreen" type="button" aria-label={t(label)} title={t(label)}
      onClick={() => { setFailed(false); void toggleFullscreen().catch(() => setFailed(true)); }}>
      <FullscreenIcon url={active ? minimizeUrl : maximizeUrl}/>
    </button>
    {failed && <span className="live-sr-only" role="status">{t("Vollbild ist in diesem Browser nicht verfügbar.")}</span>}
  </>;
}
