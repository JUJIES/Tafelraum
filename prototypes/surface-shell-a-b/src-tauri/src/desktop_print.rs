#[derive(serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum PrintPageOrientation {
    Portrait,
    Landscape,
}

#[tauri::command]
pub(crate) async fn print_desktop_webview(
    window: tauri::WebviewWindow,
    orientation: Option<PrintPageOrientation>,
) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    if let Some(orientation) = orientation {
        return print_a4_template(&window, orientation)
            .await
            .map(|()| false);
    }
    #[cfg(windows)]
    if let Some(orientation) = orientation {
        return windows_print::open_a4_preview(&window, orientation)
            .await
            .map(|()| true);
    }
    #[cfg(not(any(target_os = "macos", windows)))]
    let _ = orientation;
    window
        .print()
        .map(|()| false)
        .map_err(|error| format!("Druckdialog konnte nicht geöffnet werden: {error}"))
}

#[cfg(target_os = "macos")]
async fn print_a4_template(
    window: &tauri::WebviewWindow,
    orientation: PrintPageOrientation,
) -> Result<(), String> {
    use objc2_app_kit::{NSPaperOrientation, NSPrintInfo};
    use objc2_foundation::{NSCopying, NSSize};
    use objc2_web_kit::WKWebView;

    let (result, mut completed) = tauri::async_runtime::channel(1);
    window
        .with_webview(move |webview| {
            // Tauri provides a live WKWebView on the main thread for this callback.
            let webview = unsafe { &*webview.inner().cast::<WKWebView>() };
            let Some(window) = webview.window() else {
                let _ = result.try_send(Err("Kein Fenster für den Druckdialog verfügbar".into()));
                return;
            };

            // Keep the chosen printer, but scope paper settings to this job.
            let info = NSPrintInfo::sharedPrintInfo().copy();
            let points_per_mm = 72.0 / 25.4;
            info.setPaperSize(NSSize::new(210.0 * points_per_mm, 297.0 * points_per_mm));
            info.setOrientation(match orientation {
                PrintPageOrientation::Portrait => NSPaperOrientation::Portrait,
                PrintPageOrientation::Landscape => NSPaperOrientation::Landscape,
            });
            // As in Wry's default operation, the printable document controls margins.
            info.setTopMargin(0.0);
            info.setBottomMargin(0.0);
            info.setLeftMargin(0.0);
            info.setRightMargin(0.0);

            // This operation runs on the WebView's main thread; the app requires macOS 12+.
            unsafe {
                let operation = webview.printOperationWithPrintInfo(&info);
                operation.setCanSpawnSeparateThread(true);
                operation.runOperationModalForWindow_delegate_didRunSelector_contextInfo(
                    &window,
                    None,
                    None,
                    std::ptr::null_mut(),
                );
            }
            let _ = result.try_send(Ok(()));
        })
        .map_err(|error| format!("Druckdialog konnte nicht geöffnet werden: {error}"))?;
    completed
        .recv()
        .await
        .ok_or_else(|| "Druckdialog konnte nicht geöffnet werden".to_string())?
}
#[cfg(windows)]
#[path = "windows_print.rs"]
mod windows_print;
