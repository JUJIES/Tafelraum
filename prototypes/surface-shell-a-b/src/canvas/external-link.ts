export function normalizeExternalWebUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function openExternalWebUrl(value: string) {
  const url = normalizeExternalWebUrl(value);
  if (!url) throw new Error("Dieser Link kann nicht geöffnet werden.");

  if ("__TAURI_INTERNALS__" in window) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_external_web_url", { url });
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) throw new Error("Der Browser hat das Öffnen des Links blockiert.");
}
