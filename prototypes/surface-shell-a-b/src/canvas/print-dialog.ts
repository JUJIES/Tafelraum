/** Use the existing native WebView command; browsers keep their own dialog. */
export async function printDocument(targetWindow: Window = window) {
  targetWindow.focus();
  if (targetWindow === window && "__TAURI_INTERNALS__" in window) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("print_desktop_webview");
  } else {
    targetWindow.print();
  }
}
