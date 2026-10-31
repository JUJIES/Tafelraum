import { t } from "./i18n/translate.ts";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { CanvasImageAsset } from "./canvas/canvas-port";

const maxPdfPages = 20;
const pdfRenderScale = 2;
const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
let pdfJsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export class MaterialImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaterialImportError";
  }
}

function assetId() {
  return `tafelraum-import-${crypto.randomUUID()}`;
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), { once: true });
    reader.addEventListener("error", () => reject(reader.error), { once: true });
    reader.readAsDataURL(blob);
  });
}

async function canvasToPngDataUrl(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new MaterialImportError("Die PDF-Seite konnte nicht als PNG gespeichert werden."));
    }, "image/png");
  });
  return blobToDataUrl(blob);
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfJs) => {
      // Version the URL as well: 0.1.9 cached the worker with an invalid MIME type.
      pdfJs.GlobalWorkerOptions.workerSrc = `${pdfWorkerUrl}?v=${encodeURIComponent(__TAFELRAUM_VERSION__)}`;
      return pdfJs;
    }).catch((error: unknown) => {
      pdfJsPromise = null;
      throw error;
    });
  }
  return pdfJsPromise;
}

async function imageFileToAsset(file: File): Promise<CanvasImageAsset> {
  const bitmap = await createImageBitmap(file);
  const asset: CanvasImageAsset = {
    id: assetId(),
    dataUrl: await blobToDataUrl(file),
    mimeType: file.type as CanvasImageAsset["mimeType"],
    pixelHeight: bitmap.height,
    pixelWidth: bitmap.width,
    source: {
      fileName: file.name,
      kind: "image",
    },
  };
  bitmap.close();
  return asset;
}

async function pdfFileToAssets(file: File): Promise<CanvasImageAsset[]> {
  const { getDocument } = await loadPdfJs();
  const wasmUrl = new URL(`${import.meta.env.BASE_URL}pdfjs-wasm/`, window.location.origin).href;
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    wasmUrl,
  });
  const document = await loadingTask.promise;

  try {
    if (document.numPages > maxPdfPages) {
      throw new MaterialImportError(t("Das PDF hat {0} Seiten. Bitte höchstens {1} Seiten auf einmal importieren.", document.numPages, maxPdfPages));
    }

    const assets: CanvasImageAsset[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const viewport = page.getViewport({ scale: pdfRenderScale });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new MaterialImportError("Die PDF-Seite konnte nicht als Bild gerendert werden.");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        assets.push({
          id: assetId(),
          dataUrl: await canvasToPngDataUrl(canvas),
          mimeType: "image/png",
          pixelHeight: canvas.height,
          pixelWidth: canvas.width,
          source: {
            fileName: file.name,
            kind: "pdf-page",
            pageNumber,
          },
        });
      } finally {
        page.cleanup();
      }
    }
    return assets;
  } finally {
    await loadingTask.destroy();
  }
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function materialFilesToCanvasImages(files: readonly File[]) {
  const assets: CanvasImageAsset[] = [];

  for (const file of files) {
    if (isPdf(file)) {
      assets.push(...await pdfFileToAssets(file));
      continue;
    }
    if (supportedImageTypes.has(file.type)) {
      assets.push(await imageFileToAsset(file));
      continue;
    }
    throw new MaterialImportError(t("„{0}“ ist kein unterstütztes Bild oder PDF.", file.name));
  }

  return assets;
}

/** First-page rendition for a transient archive preview; never imports canvas assets. */
export async function renderPdfMaterialPreview(data: ArrayBuffer, signal: AbortSignal) {
  const { getDocument } = await loadPdfJs();
  signal.throwIfAborted();
  const task = getDocument({
    data: new Uint8Array(data),
    wasmUrl: new URL(`${import.meta.env.BASE_URL}pdfjs-wasm/`, window.location.origin).href,
  });
  const cancel = () => { void task.destroy(); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const pdf = await task.promise;
    signal.throwIfAborted();
    const page = await pdf.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, 960 / Math.max(original.width, original.height)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new MaterialImportError("PDF-Vorschau konnte nicht gerendert werden.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    signal.throwIfAborted();
    return { src: await canvasToPngDataUrl(canvas), width: original.width, height: original.height, pages: pdf.numPages };
  } finally {
    signal.removeEventListener("abort", cancel);
    await task.destroy();
  }
}
