const supportedClipboardImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Only new external text takes the current surface color. Scene copies retain styling. */
export function isExternalTextPaste(data: { text?: unknown; elements?: unknown; spreadsheet?: unknown }) {
  return typeof data.text === "string" && data.text.length > 0 && !data.elements && !data.spreadsheet;
}

type ClipboardFileItem = Pick<DataTransferItem, "getAsFile" | "kind" | "type">;
type ClipboardFileSource = {
  files?: ArrayLike<File>;
  items: ArrayLike<ClipboardFileItem>;
};

type ClipboardTextSource = {
  getData(type: string): string;
};

const youtubeHosts = new Set([
  "youtube.com",
  "m.youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

export function imageFilesFromClipboard(clipboardData: ClipboardFileSource) {
  const itemFiles = Array.from(clipboardData.items).flatMap((item) => {
    if (item.kind !== "file") return [];
    const file = item.getAsFile();
    return file && supportedClipboardImageTypes.has(file.type || item.type) ? [file] : [];
  });
  if (itemFiles.length > 0) return itemFiles;
  return Array.from(clipboardData.files ?? []).filter((file) => supportedClipboardImageTypes.has(file.type));
}

export function youtubeLinkFromClipboard(clipboardData: ClipboardTextSource) {
  const value = webLinkFromClipboard(clipboardData);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!youtubeHosts.has(url.hostname.toLowerCase())) return null;
    return value;
  } catch {
    return null;
  }
}

export function webLinkFromClipboard(clipboardData: ClipboardTextSource) {
  const value = (clipboardData.getData("text/uri-list") || clipboardData.getData("text/plain")).trim();
  if (!value || /[\r\n]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

/** Only the known engine formats take precedence over their PNG representation. */
export function hasCanvasClipboardData(text: string): boolean {
  try {
    const data = JSON.parse(text);
    return (data?.type === "excalidraw" || data?.type === "excalidraw/clipboard")
      && Array.isArray(data.elements) && data.elements.length > 0;
  } catch { return false; }
}
