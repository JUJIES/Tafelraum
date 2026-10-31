fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new()
                .commands(&[
                    "desktop_update_overview",
                    "request_desktop_update_check",
                    "print_desktop_webview",
                    "open_external_web_url",
                    "open_room_canvas",
                    "close_room_canvas",
                    "confirm_desktop_persistence",
                    "set_ui_language",
                ]),
        ),
    )
    .expect("Tafelraum-Buildkonfiguration ist ungültig");
}
