export type PrintPageOrientation = "landscape" | "portrait";

/** Use the existing native WebView command; browsers keep their own dialog. */
export async function printDocument(targetWindow: Window = window, orientation?: PrintPageOrientation) {
  targetWindow.focus();
  if (targetWindow === window && "__TAURI_INTERNALS__" in window) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<boolean>("print_desktop_webview", orientation ? { orientation } : undefined);
  } else {
    targetWindow.print();
    return false;
  }
}
