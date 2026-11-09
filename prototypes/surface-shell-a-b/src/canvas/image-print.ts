import { t } from "../i18n/translate.ts";
import { printDocument, type PrintPageOrientation } from "./print-dialog.ts";

export type PrintImageTransform = {
  angle: number;
  cropped: boolean;
  scaleX: number;
  scaleY: number;
};

const printFrameCleanupDelay = 120_000;
const safariPrintDelay = 80;

export type ImagePrintStrategy = "frame" | "top-level";

export function getPrintPageOrientation(width: number, height: number): PrintPageOrientation {
  return width > height ? "landscape" : "portrait";
}

export function canPrintImageSourceDirectly(transform: PrintImageTransform) {
  const fullTurn = Math.PI * 2;
  const normalizedAngle = ((transform.angle % fullTurn) + fullTurn) % fullTurn;
  const hasNoRotation = normalizedAngle < 0.001 || Math.abs(normalizedAngle - fullTurn) < 0.001;
  return hasNoRotation && !transform.cropped && transform.scaleX === 1 && transform.scaleY === 1;
}

export function getImagePrintStrategy(userAgent: string, nativeApp = false): ImagePrintStrategy {
  if (nativeApp) return "top-level";
  const isSafari = /Safari\//.test(userAgent)
    && !/(?:Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS)\//.test(userAgent);
  return isSafari ? "top-level" : "frame";
}

function printStyles(orientation: PrintPageOrientation) {
  return `
    @page { size: A4 ${orientation}; margin: 10mm; }
    html, body { width: 100%; height: 100%; margin: 0; }
    body {
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  `;
}

function topLevelPrintStyles(orientation: PrintPageOrientation) {
  return `
    @page { size: A4 ${orientation}; margin: 10mm; }
    @media print {
      html, body { width: 100%; height: 100%; margin: 0 !important; background: #fff !important; }
      body > :not(.material-print-surface) { display: none !important; }
      .material-print-surface {
        position: fixed !important;
        inset: 0 !important;
        display: grid !important;
        grid-template-rows: minmax(0, 1fr) !important;
        place-items: center !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        gap: 0 !important;
        overflow: hidden !important;
        background: #fff !important;
      }
      .material-print-surface-status { display: none !important; }
      .material-print-surface img {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
        box-shadow: none !important;
        border: 0 !important;
        border-radius: 0 !important;
      }
    }
  `;
}

function waitForPaint(targetWindow: Window, delay = 0) {
  return new Promise<void>((resolve) => {
    targetWindow.requestAnimationFrame(() => {
      targetWindow.requestAnimationFrame(() => {
        if (delay > 0) {
          targetWindow.setTimeout(resolve, delay);
          return;
        }
        resolve();
      });
    });
  });
}

function openTopLevelImagePrintDialog(imageUrl: string, objectUrl: string | null, title: string) {
  const surface = document.createElement("section");
  surface.className = "material-print-surface";
  surface.setAttribute("aria-label", t("Druckansicht"));
  surface.setAttribute("aria-live", "polite");

  const status = document.createElement("div");
  status.className = "material-print-surface-status";
  status.setAttribute("role", "status");
  const spinner = document.createElement("span");
  spinner.className = "material-print-surface-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const statusText = document.createElement("span");
  statusText.textContent = t("Druck wird geöffnet");
  status.append(spinner, statusText);

  const image = document.createElement("img");
  image.alt = title;
  surface.append(status, image);

  const style = document.createElement("style");
  style.dataset.materialPrintStyle = "true";
  style.textContent = topLevelPrintStyles("portrait");
  document.head.append(style);
  document.body.append(surface);

  return new Promise<void>((resolve, reject) => {
    let cleanupTimer: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
      window.removeEventListener("afterprint", cleanup);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      style.remove();
      surface.remove();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    image.addEventListener("error", () => fail(new Error("Druckbild konnte nicht geladen werden.")), { once: true });
    image.addEventListener("load", async () => {
      style.textContent = topLevelPrintStyles(getPrintPageOrientation(image.naturalWidth, image.naturalHeight));
      window.addEventListener("afterprint", cleanup, { once: true });
      cleanupTimer = window.setTimeout(cleanup, printFrameCleanupDelay);

      // Native printing performs its own print layout. Screen animation frames
      // can remain suspended after cancelling a WKWebView print sheet.
      if (!("__TAURI_INTERNALS__" in window)) await waitForPaint(window, safariPrintDelay);
      try {
        await printDocument();
        settled = true;
        resolve();
      } catch (error: unknown) {
        fail(error instanceof Error ? error : new Error("Druckdialog konnte nicht geöffnet werden."));
      }
    }, { once: true });
    image.src = imageUrl;
  });
}

function openFramedImagePrintDialog(imageUrl: string, objectUrl: string | null, title: string) {
  const frame = document.createElement("iframe");
  frame.className = "material-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.title = "Materialdruck";
  document.body.append(frame);

  return new Promise<void>((resolve, reject) => {
    let cleanupTimer: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      frame.remove();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const frameDocument = frame.contentDocument;
    const frameWindow = frame.contentWindow;
    if (!frameDocument || !frameWindow) {
      fail(new Error("Druckansicht konnte nicht geöffnet werden."));
      return;
    }

    frameDocument.open();
    frameDocument.write("<!doctype html><html><head></head><body></body></html>");
    frameDocument.close();
    frameDocument.documentElement.lang = "de";
    frameDocument.title = title;

    const style = frameDocument.createElement("style");
    style.textContent = printStyles("portrait");
    frameDocument.head.append(style);

    const image = frameDocument.createElement("img");
    image.alt = title;
    image.addEventListener("error", () => fail(new Error("Druckbild konnte nicht geladen werden.")), { once: true });
    image.addEventListener("load", async () => {
      style.textContent = printStyles(getPrintPageOrientation(image.naturalWidth, image.naturalHeight));
      frameWindow.addEventListener("afterprint", cleanup, { once: true });
      cleanupTimer = window.setTimeout(cleanup, printFrameCleanupDelay);

      // Offscreen child frames may suspend animation callbacks in WebKit.
      // The visible owner window provides the paint boundary for this gesture.
      await waitForPaint(window);
      try {
        await printDocument(frameWindow);
        settled = true;
        resolve();
      } catch (error: unknown) {
        fail(error instanceof Error ? error : new Error("Druckdialog konnte nicht geöffnet werden."));
      }
    }, { once: true });
    image.src = imageUrl;
    frameDocument.body.append(image);
  });
}

export async function openImagePrintDialog(
  source: Blob | string,
  title: string,
  userAgent = navigator.userAgent,
) {
  const imageUrl = typeof source === "string" ? source : URL.createObjectURL(source);
  const objectUrl = typeof source === "string" ? null : imageUrl;
  return getImagePrintStrategy(userAgent, "__TAURI_INTERNALS__" in window) === "top-level"
    ? openTopLevelImagePrintDialog(imageUrl, objectUrl, title)
    : openFramedImagePrintDialog(imageUrl, objectUrl, title);
}
