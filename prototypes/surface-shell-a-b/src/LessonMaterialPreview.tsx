import { t, useUiLocale } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { CirclePlay, FileAudio, FileText, Link2, PanelsTopLeft } from "lucide-react";
import { lessonMaterialDisplayName, lessonInteractiveMaterialUrl, lessonMaterialFileUrl, type LessonMaterial } from "./lesson-materials";
import { renderPdfMaterialPreview } from "./material-import";
import { prepareInteractiveHtmlStaticDocument } from "./canvas/interactive-html-print";

type Dimensions = { width: number; height: number };

/** A passive, disposable archive view. It never joins the material state bridge. */
export function LessonMaterialPreview({ lessonId, material, thumbnail = false }: { lessonId: string; material: LessonMaterial; thumbnail?: boolean }) {
  useUiLocale();
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState<Dimensions | null>(null);
  const [available, setAvailable] = useState<Dimensions>({ width: 320, height: 440 });
  const [pdf, setPdf] = useState<{ src: string; pages: number } | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const fileUrl = lessonMaterialFileUrl(lessonId, material.path);
  const htmlWidth = material.kind === "interactive"
    ? material.print ? material.print.orientation === "landscape" ? 1123 : 794 : material.defaultViewport.width : 0;
  const htmlHeight = material.kind === "interactive"
    ? material.print ? material.print.orientation === "landscape" ? 794 : 1123 : material.defaultViewport.height : 0;

  useEffect(() => {
    const panel = thumbnail ? root.current : root.current?.parentElement;
    if (!panel) return;
    const measure = () => {
      const rect = panel.getBoundingClientRect();
      setAvailable(thumbnail ? { width: rect.width, height: rect.height }
        : { width: Math.max(1, Math.min(320, rect.left - 26)), height: Math.max(1, Math.min(480, window.innerHeight - rect.top - 182)) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [thumbnail]);

  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      if (material.kind === "pdf") {
        const response = await fetch(fileUrl, { signal: abort.signal });
        if (!response.ok) throw new Error(t("PDF nicht verfügbar"));
        const preview = await renderPdfMaterialPreview(await response.arrayBuffer(), abort.signal);
        if (abort.signal.aborted) return;
        setPdf(preview);
        setSize(preview);
      } else if (material.kind === "interactive") {
        const entry = material.print?.entry ?? material.entry;
        const url = lessonInteractiveMaterialUrl(lessonId, material.id, entry);
        const response = await fetch(url, { signal: abort.signal });
        if (!response.ok) throw new Error(t("Vorlage nicht verfügbar"));
        // Fetch may redirect the archive entry to its package-bound asset capability.
        // Opaque WKWebView srcdoc requests cannot load assets through archive APIs.
        const sourceUrl = response.url || new URL(url, window.location.href).href;
        const parsed = prepareInteractiveHtmlStaticDocument(await response.text(), sourceUrl);
        const policy = parsed.createElement("meta");
        policy.httpEquiv = "Content-Security-Policy";
        // Keep the whole package available when the print entry is in a subdirectory.
        const assets = new URL("../".repeat(entry.split("/").length - 1) || ".", new URL(".", sourceUrl)).href;
        const nonce = crypto.randomUUID();
        policy.content = `default-src 'none'; img-src ${assets} data: blob:; font-src ${assets} data:; style-src ${assets} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'none'; form-action 'none'; base-uri 'none'`;
        parsed.head.prepend(policy);
        const style = parsed.createElement("style");
        style.textContent = "html{overflow:hidden!important}body{overflow:visible!important}*{animation:none!important;transition:none!important}";
        parsed.head.append(style);
        // Only this host-owned measurement script can execute in the opaque iframe.
        const measure = parsed.createElement("script");
        measure.setAttribute("nonce", nonce);
        measure.textContent = `(() => {
          const report = () => parent.postMessage({type:'tafelraum:material-preview-size',
            width:Math.max(${htmlWidth},document.documentElement.scrollWidth,document.body.scrollWidth),
            height:Math.max(${htmlHeight},document.documentElement.scrollHeight,document.body.scrollHeight)},'*');
          window.addEventListener('load', () => document.fonts.ready.then(report), {once:true});
        })();`;
        parsed.body.append(measure);
        if (abort.signal.aborted) return;
        setHtml(`<!doctype html>${parsed.documentElement.outerHTML}`);
      }
    };
    void load().catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, [fileUrl, htmlHeight, htmlWidth, lessonId, material]);

  useEffect(() => {
    const measured = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "tafelraum:material-preview-size") return;
      const { width, height } = event.data;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width > 100_000 || height > 100_000) return;
      setSize({ width, height });
    };
    window.addEventListener("message", measured);
    return () => window.removeEventListener("message", measured);
  }, []);

  const scale = size ? Math.min(1, available.width / size.width, available.height / size.height) : 1;
  const visualSize = size ? { width: size.width * scale, height: size.height * scale } : thumbnail ? available : { width: Math.min(280, available.width), height: 140 };
  const card = material.kind === "audio" || material.kind === "link";
  const description = material.kind === "audio" ? "Audio"
    : material.kind === "link" ? material.provider === "youtube" ? "YouTube" : new URL(material.url).hostname
    : material.kind === "pdf" && pdf ? t("PDF · Seite 1 von {0}", pdf.pages)
    : material.kind === "interactive" ? material.print ? t("Arbeitsblatt") : t("Interaktiv") : null;

  return <div ref={root} className={thumbnail ? "lesson-material-thumbnail-preview" : "lesson-material-hover-preview"} aria-hidden="true" style={thumbnail ? undefined : { width: visualSize.width }}>
    <div className={`lesson-material-preview-content${card || failed ? " is-card" : ""}`} style={visualSize}>
      {!failed && material.kind === "image" && <img src={fileUrl} alt="" onLoad={event => {
        const image = event.currentTarget; setSize({ width: image.naturalWidth, height: image.naturalHeight });
      }} onError={() => setFailed(true)}/>}
      {!failed && material.kind === "pdf" && pdf && <img src={pdf.src} alt=""/>}
      {!failed && material.kind === "video" && <video src={fileUrl} muted playsInline preload="metadata" tabIndex={-1}
        onLoadedMetadata={event => { const video = event.currentTarget; setSize({ width: video.videoWidth, height: video.videoHeight }); video.currentTime = Math.min(.01, video.duration || 0); }}
        onError={() => setFailed(true)}/>}
      {!failed && material.kind === "interactive" && html && <iframe ref={frame} srcDoc={html} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="camera 'none'; microphone 'none'; geolocation 'none'"
        title={`${thumbnail ? t("Miniatur") : t("Vorschau")} ${lessonMaterialDisplayName(material)}`} tabIndex={-1} style={{ width: size?.width ?? htmlWidth, height: size?.height ?? htmlHeight,
          transform: `scale(${scale})`, transformOrigin: "top left", visibility: size ? "visible" : "hidden" }}/>}
      {(card || failed) && <>
        {material.kind === "audio" ? <FileAudio/> : material.kind === "link" ? material.provider === "youtube" ? <CirclePlay/> : <Link2/> : material.kind === "pdf" ? <FileText/> : <PanelsTopLeft/>}
        {!thumbnail && <strong>{failed ? t("Vorschau nicht verfügbar") : description}</strong>}
        {material.kind === "link" && <span>{material.url}</span>}
      </>}
      {!thumbnail && !card && !failed && !size && <span className="lesson-material-preview-loading">{t("Vorschau wird geladen…")}</span>}
    </div>
    {!thumbnail && <div className="lesson-material-preview-caption"><strong>{lessonMaterialDisplayName(material)}</strong>{!card && description && <span>{description}</span>}</div>}
  </div>;
}

/** Mount passive documents only while their archive row is visible. */
export function LessonMaterialThumbnail({ lessonId, material }: { lessonId: string; material: LessonMaterial }) {
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root: element.closest(".lesson-material-list"),
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={root} className="lesson-material-thumbnail" aria-hidden="true">
    {visible ? <LessonMaterialPreview key={`${lessonId}:${material.path}:${material.modifiedAt}`} lessonId={lessonId} material={material} thumbnail/>
      : material.kind === "pdf" ? <FileText/> : <PanelsTopLeft/>}
  </span>;
}
