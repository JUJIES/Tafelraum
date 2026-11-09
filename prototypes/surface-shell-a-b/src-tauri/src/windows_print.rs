use std::{
    os::windows::ffi::OsStrExt,
    path::Path,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Mutex,
    },
};
use tauri::{
    webview::{NewWindowResponse, PlatformWebview},
    Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use webview2_com::{
    Microsoft::Web::WebView2::Win32::{
        ICoreWebView2Environment6, ICoreWebView2_7, COREWEBVIEW2_PRINT_ORIENTATION_LANDSCAPE,
        COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT,
    },
    PrintToPdfCompletedHandler,
};
use windows_core::{Interface, PCWSTR};

use super::PrintPageOrientation;

static NEXT_PREVIEW: AtomicUsize = AtomicUsize::new(0);

pub(super) async fn open_a4_preview(
    window: &WebviewWindow,
    orientation: PrintPageOrientation,
) -> Result<(), String> {
    let temp = tempfile::Builder::new()
        .prefix("tafelraum-print-")
        .tempdir()
        .map_err(|error| error.to_string())?;
    let pdf = temp.path().join("Tafelraum.pdf");
    let target = pdf.clone();
    let (sender, mut completed) = tauri::async_runtime::channel(1);
    window
        .with_webview(move |webview| {
            if let Err(error) = render_a4_pdf(webview, &target, orientation, sender.clone()) {
                let _ = sender.try_send(Err(error.to_string()));
            }
        })
        .map_err(|error| error.to_string())?;
    completed
        .recv()
        .await
        .ok_or("Druck-PDF konnte nicht erstellt werden")??;

    let url = url::Url::from_file_path(&pdf).map_err(|()| "Ungültiger Pfad zur Druck-PDF")?;
    let preview = WebviewWindowBuilder::new(
        window.app_handle(),
        format!(
            "material-print-{}",
            NEXT_PREVIEW.fetch_add(1, Ordering::Relaxed)
        ),
        WebviewUrl::External(url.clone()),
    )
    .title(crate::ui_language::translate(
        window.app_handle(),
        "Druckvorschau",
    ))
    .inner_size(960.0, 720.0)
    .parent(window)
    .map_err(|error| error.to_string())?
    .on_navigation(move |target| target == &url)
    .on_new_window(|_, _| NewWindowResponse::Deny)
    .build()
    .map_err(|error| error.to_string())?;
    let temp = Mutex::new(Some(temp));
    preview.on_window_event(move |event| {
        if matches!(event, WindowEvent::Destroyed) {
            let _ = temp.lock().expect("print preview temp directory").take();
        }
    });
    Ok(())
}

fn render_a4_pdf(
    webview: PlatformWebview,
    target: &Path,
    orientation: PrintPageOrientation,
    sender: tauri::async_runtime::Sender<Result<(), String>>,
) -> windows_core::Result<()> {
    let target: Vec<u16> = target.as_os_str().encode_wide().chain([0]).collect();
    // Tauri calls this closure on the WebView2 controller's owning thread.
    unsafe {
        let environment = webview.environment().cast::<ICoreWebView2Environment6>()?;
        let core = webview
            .controller()
            .CoreWebView2()?
            .cast::<ICoreWebView2_7>()?;
        let settings = environment.CreatePrintSettings()?;
        settings.SetPageWidth(210.0 / 25.4)?;
        settings.SetPageHeight(297.0 / 25.4)?;
        settings.SetOrientation(match orientation {
            PrintPageOrientation::Portrait => COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT,
            PrintPageOrientation::Landscape => COREWEBVIEW2_PRINT_ORIENTATION_LANDSCAPE,
        })?;
        // The same CSS as on macOS defines the sheet's margins and page breaks.
        settings.SetMarginTop(0.0)?;
        settings.SetMarginBottom(0.0)?;
        settings.SetMarginLeft(0.0)?;
        settings.SetMarginRight(0.0)?;
        settings.SetShouldPrintHeaderAndFooter(false)?;
        settings.SetShouldPrintBackgrounds(true)?;
        let handler = PrintToPdfCompletedHandler::create(Box::new(move |status, written| {
            let result = status.map_err(|error| error.to_string()).and_then(|()| {
                written
                    .then_some(())
                    .ok_or_else(|| "Druck-PDF konnte nicht erstellt werden".into())
            });
            let _ = sender.try_send(result);
            Ok(())
        }));
        core.PrintToPdf(PCWSTR(target.as_ptr()), &settings, &handler)
    }
}
