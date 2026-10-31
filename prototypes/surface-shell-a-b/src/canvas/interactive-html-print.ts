import { t } from "../i18n/translate.ts";
import { getUiLocale } from "../i18n/locale.ts";
import type { PrintPageOrientation } from "./image-print";
import { printDocument } from "./print-dialog.ts";

const printCleanupTimeout = 120_000;
const printReadyTimeout = 10_000;
const printButtonId = "tafelraum-print-now";
const closeButtonId = "tafelraum-print-close";

export type InteractiveHtmlPrintStrategy = "popup" | "top-level";

export function getInteractiveHtmlPrintStrategy(
  userAgent: string,
  nativeApp = false,
): InteractiveHtmlPrintStrategy {
  if (nativeApp) return "top-level";
  const isSafari = /Safari\//.test(userAgent)
    && !/(?:Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS)\//.test(userAgent);
  return isSafari ? "top-level" : "popup";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function waitForPaint(targetWindow: Window) {
  return new Promise<void>((resolve) => {
    targetWindow.requestAnimationFrame(() => {
      targetWindow.requestAnimationFrame(() => resolve());
    });
  });
}

function loadingDocument(title: string) {
  return `<!doctype html><html lang="${getUiLocale()}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f3ef;color:#1b222b;font:600 15px/1.4 system-ui,sans-serif}
  </style></head><body>${escapeHtml(t("Druck wird vorbereitet …"))}</body></html>`;
}

function printableDocument(
  sourceHtml: string,
  sourceUrl: string,
  title: string,
  orientation: PrintPageOrientation,
) {
  const parsed = new DOMParser().parseFromString(sourceHtml, "text/html");
  parsed.querySelectorAll("script, base, meta[http-equiv='refresh' i], meta[http-equiv='content-security-policy' i]")
    .forEach((element) => element.remove());

  const base = parsed.createElement("base");
  base.href = new URL(".", new URL(sourceUrl, window.location.href)).href;

  const policy = parsed.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = [
    "default-src 'none'",
    "base-uri 'self'",
    "connect-src 'none'",
    "font-src 'self' data:",
    "form-action 'none'",
    "frame-src 'none'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; ");

  const printStyle = parsed.createElement("style");
  printStyle.dataset.tafelraumPrint = "true";
  printStyle.textContent = `
    @page { size: A4 ${orientation}; }
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #tafelraum-print-controls {
      position: fixed;
      z-index: 2147483647;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      padding: 8px;
      border: 1px solid rgba(27, 34, 43, .14);
      border-radius: 14px;
      background: rgba(255, 255, 255, .96);
      box-shadow: 0 10px 28px rgba(24, 32, 42, .18);
      font: 600 15px/1 system-ui, sans-serif;
    }
    #tafelraum-print-controls button {
      min-height: 44px;
      padding: 0 16px;
      border: 0;
      border-radius: 10px;
      color: #1b222b;
      background: #e9edf1;
      font: inherit;
      cursor: pointer;
    }
    #tafelraum-print-controls button:first-child {
      color: #fff;
      background: #247bb5;
    }
    @media print {
      #tafelraum-print-controls { display: none !important; }
    }
  `;

  const controls = parsed.createElement("aside");
  controls.id = "tafelraum-print-controls";
  controls.setAttribute("aria-label", "Druckansicht");
  const printButton = parsed.createElement("button");
  printButton.id = printButtonId;
  printButton.type = "button";
  printButton.textContent = "Drucken";
  const closeButton = parsed.createElement("button");
  closeButton.id = closeButtonId;
  closeButton.type = "button";
  closeButton.textContent = "Schließen";
  controls.append(printButton, closeButton);

  parsed.documentElement.lang ||= "de";
  parsed.title = title;
  parsed.head.prepend(policy, base);
  parsed.head.append(printStyle);
  parsed.body.append(controls);
  return `<!doctype html>${parsed.documentElement.outerHTML}`;
}

function absoluteUrl(value: string, sourceUrl: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(?:data|blob):/i.test(trimmed)) return value;
  if (/^(?:mailto|tel):/i.test(trimmed)) return value;
  if (/^javascript:/i.test(trimmed)) return "#";
  try {
    const source = new URL(sourceUrl, window.location.href);
    const resolved = new URL(value, source);
    return resolved.origin === source.origin ? resolved.href : "#";
  } catch {
    return "#";
  }
}

function rewriteCssUrls(css: string, sourceUrl: string) {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote: string, value: string) => {
    const rewritten = absoluteUrl(value, sourceUrl);
    return rewritten === value ? match : `url(${quote}${rewritten}${quote})`;
  }).replace(/(@import\s+)(["'])([^"']+)\2/gi, (_match, prefix: string, quote: string, value: string) =>
    `${prefix}${quote}${absoluteUrl(value, sourceUrl)}${quote}`);
}

export function prepareInteractiveHtmlStaticDocument(sourceHtml: string, sourceUrl: string) {
  const parsed = new DOMParser().parseFromString(sourceHtml, "text/html");
  parsed.querySelectorAll("script, base, meta[http-equiv='refresh' i], meta[http-equiv='content-security-policy' i], iframe, object, embed")
    .forEach((element) => element.remove());

  parsed.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach(({ name }) => {
      if (/^on/i.test(name) || name === "action" || name === "formaction") element.removeAttribute(name);
    });
  });

  parsed.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
    element.setAttribute("style", rewriteCssUrls(element.getAttribute("style") ?? "", sourceUrl));
  });
  parsed.querySelectorAll("style").forEach((style) => {
    style.textContent = rewriteCssUrls(style.textContent ?? "", sourceUrl);
  });
  parsed.querySelectorAll<HTMLElement>("[src], [poster], [href]").forEach((element) => {
    for (const attribute of ["src", "poster", "href"]) {
      const value = element.getAttribute(attribute);
      if (value !== null) element.setAttribute(attribute, absoluteUrl(value, sourceUrl));
    }
  });
  parsed.querySelectorAll<HTMLElement>("[srcset]").forEach((element) => {
    const value = element.getAttribute("srcset");
    if (!value) return;
    element.setAttribute("srcset", value.split(",").map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [absoluteUrl(url, sourceUrl), ...descriptor].join(" ");
    }).join(", "));
  });

  parsed.querySelectorAll("[autoplay], [autofocus]").forEach(element => {
    element.removeAttribute("autoplay");
    element.removeAttribute("autofocus");
  });
  return parsed;
}

function prepareTopLevelDocument(sourceHtml: string, sourceUrl: string, orientation: PrintPageOrientation) {
  const parsed = prepareInteractiveHtmlStaticDocument(sourceHtml, sourceUrl);
  const printStyle = parsed.createElement("style");
  printStyle.dataset.tafelraumPrint = "true";
  printStyle.textContent = `
    @page { size: A4 ${orientation}; }
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  `;
  parsed.head.append(printStyle);
  return parsed;
}

async function openTopLevelInteractiveHtmlPrintDialog(
  sourceUrl: string,
  title: string,
  orientation: PrintPageOrientation,
) {
  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Druckvorlage konnte nicht geladen werden.");
  const parsed = prepareTopLevelDocument(await response.text(), sourceUrl, orientation);

  const originalTitle = document.title;
  const temporaryHeadNodes: Node[] = [];
  const temporaryBodyNodes: Node[] = [];
  let cleanupTimer: number | null = null;
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
    temporaryHeadNodes.forEach((node) => node.parentNode?.removeChild(node));
    temporaryBodyNodes.forEach((node) => node.parentNode?.removeChild(node));
    document.title = originalTitle;
  };

  try {
    document.title = title;

    // Read package CSS before mounting print-only styles. WKWebView can defer
    // media=print link loads until printing; waiting on those links delays the
    // dialog, while unscoped links temporarily resize the teacher canvas.
    const styles = await Promise.all([...parsed.head.children]
      .filter(element => element.matches("style, link[rel='stylesheet' i]"))
      .map(async element => {
        let imported: HTMLStyleElement;
        if (element.tagName === "LINK") {
          const stylesheetUrl = element.getAttribute("href");
          if (!stylesheetUrl) throw new Error("Druck-Stylesheet fehlt.");
          const css = await fetch(stylesheetUrl, {cache:"no-store"});
          if (!css.ok || css.headers.get("content-type")?.split(";")[0] !== "text/css") throw new Error("Druck-Stylesheet konnte nicht geladen werden.");
          imported = document.createElement("style");
          imported.textContent = rewriteCssUrls(await css.text(), stylesheetUrl);
          const media = element.getAttribute("media");
          if (media) imported.media = media;
        } else imported = document.importNode(element, true) as HTMLStyleElement;
        const media = imported.media.trim();
        if (!media || media === "all") imported.media = "print";
        return imported;
      }));
    for (const imported of styles) {
      temporaryHeadNodes.push(imported);
      document.head.append(imported);
    }

    const isolationStyle = document.createElement("style");
    isolationStyle.dataset.tafelraumPrintIsolation = "true";
    isolationStyle.textContent = `
      @media screen {
        body > .tafelraum-html-print-node { display: none !important; }
      }
      @media print {
        /* The canvas shell clips to one viewport. A print template must flow
           across pages; its own @page and page-break rules remain in charge. */
        html, body {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        body > :not(.tafelraum-html-print-node) { display: none !important; }
      }
    `;
    document.head.append(isolationStyle);
    temporaryHeadNodes.push(isolationStyle);

    [...parsed.body.childNodes].forEach((node) => {
      const imported = document.importNode(node, true);
      if (imported instanceof Element) {
        imported.classList.add("tafelraum-html-print-node");
        temporaryBodyNodes.push(imported);
        document.body.append(imported);
        return;
      }
      if (imported.textContent?.trim()) {
        const text = document.createElement("span");
        text.className = "tafelraum-html-print-node";
        text.textContent = imported.textContent;
        temporaryBodyNodes.push(text);
        document.body.append(text);
      }
    });
    await Promise.race([
      waitForPrintAssets(window),
      new Promise<void>((resolve) => window.setTimeout(resolve, printReadyTimeout)),
    ]);

    window.addEventListener("afterprint", cleanup, { once: true });
    // WKWebView opens a non-blocking native sheet. Keep its source mounted
    // until afterprint even if choosing a printer takes longer than two minutes.
    if (!("__TAURI_INTERNALS__" in window)) {
      cleanupTimer = window.setTimeout(cleanup, printCleanupTimeout);
    }
    await printDocument();
  } catch (error) {
    cleanup();
    throw error;
  }
}

function writeDocument(targetWindow: Window, html: string) {
  targetWindow.document.open();
  targetWindow.document.write(html);
  targetWindow.document.close();
}

async function waitForPrintAssets(targetWindow: Window) {
  const images = [...targetWindow.document.images];
  await Promise.all(images.map((image) => image.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      })));
  await targetWindow.document.fonts?.ready;
  await waitForPaint(targetWindow);
}

function closePrintWindow(targetWindow: Window) {
  if (!targetWindow.closed) targetWindow.close();
}

export async function openInteractiveHtmlPrintDialog(
  sourceUrl: string,
  title: string,
  orientation: PrintPageOrientation,
  userAgent = navigator.userAgent,
) {
  if (getInteractiveHtmlPrintStrategy(userAgent, "__TAURI_INTERNALS__" in window) === "top-level") {
    return openTopLevelInteractiveHtmlPrintDialog(sourceUrl, title, orientation);
  }

  // Open synchronously in the click stack. Browsers may otherwise suppress the
  // window after the package fetch, making the action appear to do nothing.
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Druckfenster wurde vom Browser blockiert.");
  printWindow.opener = null;
  writeDocument(printWindow, loadingDocument(title));

  let cleanupTimer: number | null = null;
  try {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Druckvorlage konnte nicht geladen werden.");
    writeDocument(printWindow, printableDocument(await response.text(), sourceUrl, title, orientation));

    const printAgain = printWindow.document.getElementById(printButtonId);
    const close = printWindow.document.getElementById(closeButtonId);
    printAgain?.addEventListener("click", () => {
      printWindow.focus();
      printWindow.print();
    });
    close?.addEventListener("click", () => closePrintWindow(printWindow));
    printWindow.addEventListener("afterprint", () => closePrintWindow(printWindow), { once: true });
    cleanupTimer = window.setTimeout(() => closePrintWindow(printWindow), printCleanupTimeout);

    await Promise.race([
      waitForPrintAssets(printWindow),
      new Promise<void>((resolve) => window.setTimeout(resolve, printReadyTimeout)),
    ]);
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    closePrintWindow(printWindow);
    throw error;
  } finally {
    if (cleanupTimer !== null && printWindow.closed) window.clearTimeout(cleanupTimer);
  }
}
