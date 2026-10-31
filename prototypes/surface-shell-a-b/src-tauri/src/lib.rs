use std::{
    fs::{self, File},
    io::Write,
    process::{Child, Command},
    sync::{
        atomic::{AtomicU8, Ordering},
        Mutex,
    },
    time::Instant,
};
#[cfg(not(debug_assertions))]
use std::{
    io::{BufRead, BufReader},
    process::Stdio,
    time::Duration,
};
use tauri::{
    menu::{MenuBuilder, MenuItem, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder, Wry,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;
use url::Url;
mod ui_language;
use ui_language::{UiLanguage, set_ui_language};
mod persistence_exit;
use persistence_exit::{PersistenceExit, confirm_desktop_persistence};

#[cfg(target_os = "macos")]
mod room_fullscreen;

#[cfg(not(debug_assertions))]
const LOCAL_PORT: u16 = 49_317;

// Compile-time distribution selection; never a preference from a lesson/profile.
fn official_updates_enabled() -> bool {
    serde_json::from_str::<serde_json::Value>(include_str!("../../distribution.json"))
        .ok().and_then(|value| value["officialUpdates"].as_bool()).unwrap_or(false)
}

struct ServerProcess(Mutex<Option<Child>>);
struct UpdateMenuItem(MenuItem<Wry>);

const UPDATE_IDLE: u8 = 0;
const UPDATE_CHECKING: u8 = 1;
const UPDATE_AWAITING_CONFIRMATION: u8 = 2;
const UPDATE_INSTALLING: u8 = 3;
#[cfg(not(debug_assertions))]
const AUTOMATIC_UPDATE_INTERVAL: Duration = Duration::from_secs(6 * 60 * 60);

struct UpdateState {
    phase: AtomicU8,
    last_check: Mutex<Option<Instant>>,
    available_version: Mutex<Option<String>>,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateOverview {
    current_version: String,
    available_version: Option<String>,
    phase: &'static str,
}

impl UpdateState {
    fn new() -> Self {
        Self {
            phase: AtomicU8::new(UPDATE_IDLE),
            last_check: Mutex::new(None),
            available_version: Mutex::new(None),
        }
    }

    fn begin_check(&self) -> bool {
        if self
            .phase
            .compare_exchange(
                UPDATE_IDLE,
                UPDATE_CHECKING,
                Ordering::AcqRel,
                Ordering::Relaxed,
            )
            .is_err()
        {
            return false;
        }
        if let Ok(mut last_check) = self.last_check.lock() {
            *last_check = Some(Instant::now());
        }
        true
    }

    fn set_phase(&self, phase: u8) {
        self.phase.store(phase, Ordering::Release);
    }

    fn set_available_version(&self, version: Option<String>) {
        if let Ok(mut available_version) = self.available_version.lock() {
            *available_version = version;
        }
    }

    fn overview(&self, app: &AppHandle) -> UpdateOverview {
        let phase = match self.phase.load(Ordering::Acquire) {
            UPDATE_CHECKING => "checking",
            UPDATE_AWAITING_CONFIRMATION => "awaitingConfirmation",
            UPDATE_INSTALLING => "installing",
            _ => "idle",
        };
        UpdateOverview {
            current_version: app.package_info().version.to_string(),
            available_version: self
                .available_version
                .lock()
                .ok()
                .and_then(|version| version.clone()),
            phase,
        }
    }

    #[cfg(not(debug_assertions))]
    fn should_check_automatically(&self) -> bool {
        if self.phase.load(Ordering::Acquire) != UPDATE_IDLE {
            return false;
        }
        self.last_check
            .lock()
            .map(|last_check| {
                last_check
                    .map(|last_check| last_check.elapsed() >= AUTOMATIC_UPDATE_INTERVAL)
                    .unwrap_or(true)
            })
            .unwrap_or(false)
    }
}

fn emit_update_overview(app: &AppHandle) {
    let overview = app.state::<UpdateState>().overview(app);
    let _ = app.emit("tafelraum-update-overview", overview);
}

fn log_update(app: &AppHandle, message: impl AsRef<str>) {
    let Ok(log_dir) = app.path().app_log_dir() else {
        return;
    };
    if fs::create_dir_all(&log_dir).is_err() {
        return;
    }
    let Ok(mut file) = File::options()
        .create(true)
        .append(true)
        .open(log_dir.join("tafelraum-updater.log"))
    else {
        return;
    };
    let _ = writeln!(file, "{}", message.as_ref());
}

fn show_message(app: &AppHandle, title: &str, message: impl Into<String>, kind: MessageDialogKind) {
    let dialog = app
        .dialog()
        .message(ui_language::translate(app, &message.into()))
        .title(ui_language::translate(app, title))
        .kind(kind)
        .buttons(MessageDialogButtons::Ok);
    let dialog = if let Some(window) = app.get_webview_window("main") {
        dialog.parent(&window)
    } else {
        dialog
    };
    dialog.show(|_| {});
}

fn set_update_menu(app: &AppHandle, text: impl AsRef<str>, enabled: bool) {
    if let Some(item) = app.try_state::<UpdateMenuItem>() {
        if let Ok(mut label) = app.state::<UiLanguage>().update_label.lock() { *label = Some(text.as_ref().into()); }
        let _ = item.0.set_text(ui_language::translate(app, text.as_ref()));
        let _ = item.0.set_enabled(enabled);
    }
}

fn available_update_label(version: &str) -> String {
    format!("Update {version} verfügbar …")
}

fn check_for_updates(app: AppHandle, manual: bool) {
    if !official_updates_enabled() { return; }
    log_update(&app, format!("Updateprüfung gestartet (manuell={manual})."));
    let update_state = app.state::<UpdateState>();
    if !update_state.begin_check() {
        log_update(&app, "Updateprüfung läuft bereits.");
        return;
    }
    set_update_menu(&app, "Suche nach Updates …", false);
    emit_update_overview(&app);
    tauri::async_runtime::spawn(async move {
        let result = match app.updater() {
            Ok(updater) => updater.check().await.map_err(|error| error.to_string()),
            Err(error) => Err(error.to_string()),
        };
        match result {
            Ok(Some(update)) => {
                let version = update.version.clone();
                app.state::<UpdateState>()
                    .set_available_version(Some(version.clone()));
                log_update(&app, format!("Update {version} gefunden."));
                if !manual {
                    app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                    set_update_menu(&app, available_update_label(&version), true);
                    emit_update_overview(&app);
                    log_update(&app, "Update wartet auf die manuelle Prüfung im App-Menü.");
                    return;
                }
                app.state::<UpdateState>()
                    .set_phase(UPDATE_AWAITING_CONFIRMATION);
                set_update_menu(&app, available_update_label(&version), false);
                emit_update_overview(&app);
                let release_notes = update.body.clone().unwrap_or_default();
                let message = if release_notes.trim().is_empty() {
                    format!(
                        "Tafelraum {version} ist verfügbar. Jetzt installieren und neu starten?"
                    )
                } else {
                    format!("Tafelraum {version} ist verfügbar.\n\n{release_notes}\n\nJetzt installieren und neu starten?")
                };
                let install_app = app.clone();
                let dialog = app
                    .dialog()
                    .message(message)
                    .title(format!("Update {version}"))
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::YesNo);
                let dialog = if let Some(window) = app.get_webview_window("main") {
                    dialog.parent(&window)
                } else {
                    dialog
                };
                dialog.show(move |accepted| {
                    log_update(
                        &install_app,
                        format!("Updatedialog beantwortet (installieren={accepted})."),
                    );
                    if !accepted {
                        install_app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                        set_update_menu(&install_app, available_update_label(&version), true);
                        emit_update_overview(&install_app);
                        return;
                    }
                    install_app
                        .state::<UpdateState>()
                        .set_phase(UPDATE_INSTALLING);
                    set_update_menu(&install_app, "Update wird installiert …", false);
                    emit_update_overview(&install_app);
                    tauri::async_runtime::spawn(async move {
                        log_update(&install_app, "Updatedownload gestartet.");
                        let mut owns_persistence = false;
                        let install_result: Result<(), String> = async {
                            let bytes = update.download(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
                            if install_app.state::<PersistenceExit>().busy.swap(true, Ordering::SeqCst) {
                                return Err("Ein Speicherabschluss läuft bereits.".into());
                            }
                            owns_persistence = true;
                            persistence_exit::flush(&install_app).await?;
                            update.install(bytes).map_err(|e| e.to_string())
                        }.await;
                        if let Err(error) = install_result {
                            if owns_persistence {
                                persistence_exit::release(&install_app);
                                install_app.state::<PersistenceExit>().busy.store(false, Ordering::SeqCst);
                            }
                            log_update(
                                &install_app,
                                format!("Updateinstallation fehlgeschlagen: {error}"),
                            );
                            install_app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                            set_update_menu(&install_app, available_update_label(&version), true);
                            emit_update_overview(&install_app);
                            show_message(
                                &install_app,
                                "Update nicht installiert",
                                format!("Tafelraum konnte nicht aktualisiert werden: {error}"),
                                MessageDialogKind::Error,
                            );
                            return;
                        }
                        log_update(&install_app, "Update installiert; App wird neu gestartet.");
                        install_app.state::<PersistenceExit>().approved.store(true, Ordering::SeqCst);
                        install_app.restart();
                    });
                });
            }
            Ok(None) => {
                log_update(&app, "Kein Update gefunden.");
                app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                app.state::<UpdateState>().set_available_version(None);
                set_update_menu(&app, "Nach Updates suchen …", true);
                emit_update_overview(&app);
                if manual {
                    show_message(
                        &app,
                        "Keine Aktualisierung",
                        "Tafelraum ist auf dem neuesten Stand.",
                        MessageDialogKind::Info,
                    );
                }
            }
            Err(error) => {
                log_update(&app, format!("Updateprüfung fehlgeschlagen: {error}"));
                app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                set_update_menu(&app, "Nach Updates suchen …", true);
                emit_update_overview(&app);
                if manual {
                    show_message(
                        &app,
                        "Updateprüfung nicht möglich",
                        format!("Tafelraum konnte gerade nicht nach Updates suchen: {error}"),
                        MessageDialogKind::Error,
                    );
                }
            }
        }
    });
}

#[tauri::command]
fn desktop_update_overview(app: AppHandle) -> UpdateOverview {
    app.state::<UpdateState>().overview(&app)
}

#[tauri::command]
fn request_desktop_update_check(app: AppHandle) {
    check_for_updates(app, true);
}

#[tauri::command]
fn print_desktop_webview(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .print()
        .map_err(|error| format!("Druckdialog konnte nicht geöffnet werden: {error}"))
}

#[tauri::command]
fn open_external_web_url(url: String) -> Result<(), String> {
    let parsed = validate_external_web_url(&url)?;
    Command::new("/usr/bin/open")
        .arg("--")
        .arg(parsed.as_str())
        .spawn()
        .map_err(|error| format!("Link konnte nicht im Browser geöffnet werden: {error}"))?;
    Ok(())
}

#[tauri::command]
fn open_room_canvas(app: AppHandle, channel: String) -> Result<(), String> {
    if channel.len() != 36 || !channel.chars().all(|c| c.is_ascii_hexdigit() || c == '-') {
        return Err("Ungültige Raumansicht.".into());
    }
    if let Some(window) = app.get_webview_window("room-canvas") {
        window.show().map_err(|error| error.to_string())?;
        window.unminimize().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }
    #[cfg(debug_assertions)]
    let base = "http://127.0.0.1:5173";
    #[cfg(not(debug_assertions))]
    let base = "http://127.0.0.1:49317";
    let url = Url::parse(&format!("{base}/room.html?channel={channel}"))
        .map_err(|error| error.to_string())?;
    // Only choose a display automatically when the main window has one unambiguous alternative.
    let target_monitor = app.get_webview_window("main").and_then(|main| {
        let current = main.current_monitor().ok()??;
        let monitors = main.available_monitors().ok()?;
        if monitors.len() != 2 {
            return None;
        }
        monitors
            .into_iter()
            .find(|monitor| monitor.position() != current.position())
    });
    let mut builder = WebviewWindowBuilder::new(&app, "room-canvas", WebviewUrl::External(url))
        .title("Room Canvas")
        .inner_size(1280.0, 800.0)
        .min_inner_size(640.0, 400.0);
    if let Some(monitor) = &target_monitor {
        let position = monitor.position().to_logical::<f64>(monitor.scale_factor());
        builder = builder.position(position.x + 48.0, position.y + 48.0);
    }
    let window = builder
        .build()
        .map_err(|error| format!("Room Canvas konnte nicht geöffnet werden: {error}"))?;
    #[cfg(target_os = "macos")]
    room_fullscreen::install(&window)?;
    if target_monitor.is_some() {
        // Placement is established before macOS creates the window's fullscreen Space.
        if let Err(error) = window.set_fullscreen(true) {
            eprintln!("Room Canvas konnte nicht automatisch in Vollbild wechseln: {error}");
        }
    }
    Ok(())
}

#[tauri::command]
fn close_room_canvas(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("room-canvas") {
        window.close().map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn validate_external_web_url(url: &str) -> Result<Url, String> {
    let parsed = Url::parse(url).map_err(|_| "Link ist ungültig.".to_string())?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err("Nur Weblinks mit http oder https sind erlaubt.".to_string());
    }
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::{validate_external_web_url,official_updates_enabled};

    #[test]
    fn updater_is_bound_to_the_compiled_distribution() {
        let profile: serde_json::Value = serde_json::from_str(include_str!("../../distribution.json")).unwrap();
        assert_eq!(official_updates_enabled(), profile["profile"] == "personal");
        let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert_eq!(official_updates_enabled(), config["plugins"]["updater"]["endpoints"].as_array().is_some_and(|endpoints| !endpoints.is_empty()));
    }

    #[test]
    fn external_links_allow_only_http_and_https() {
        assert!(validate_external_web_url("https://example.org/material").is_ok());
        assert!(validate_external_web_url("http://example.org/material").is_ok());
        assert!(validate_external_web_url("file:///Users/test/material.pdf").is_err());
        assert!(validate_external_web_url("javascript:alert(1)").is_err());
        assert!(validate_external_web_url("not a url").is_err());
    }
}

fn install_menu(app: &tauri::App) -> tauri::Result<()> {
    let check_updates =
        MenuItemBuilder::with_id("check-updates", "Nach Updates suchen …").build(app)?;
    let mut app_menu = SubmenuBuilder::new(app, "Tafelraum").about_with_text("Über Tafelraum", None).separator();
    if official_updates_enabled() { app_menu = app_menu.item(&check_updates); }
    let app_menu = app_menu.text("open-data", "Lokalen Datenordner öffnen")
        .separator()
        .quit_with_text("Tafelraum beenden")
        .build()?;
    let edit_menu = SubmenuBuilder::new(app, "Bearbeiten")
        .undo_with_text("Rückgängig")
        .redo_with_text("Wiederholen")
        .separator()
        .cut_with_text("Ausschneiden")
        .copy_with_text("Kopieren")
        .paste_with_text("Einfügen")
        .select_all_with_text("Alles auswählen")
        .build()?;
    let window_menu = SubmenuBuilder::new(app, "Fenster")
        .minimize_with_text("Minimieren")
        .close_window_with_text("Fenster schließen")
        .build()?;
    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&edit_menu)
        .item(&window_menu)
        .build()?;
    app.set_menu(menu)?;
    app.manage(UpdateMenuItem(check_updates));
    Ok(())
}

#[cfg(not(debug_assertions))]
fn start_local_server(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();
    let resource_dir = app.path().resource_dir()?;
    let data_root = app.path().app_data_dir()?;
    let log_dir = app.path().app_log_dir()?;
    fs::create_dir_all(&data_root)?;
    fs::create_dir_all(&log_dir)?;

    let node_path = resource_dir.join("desktop-resources/runtime/node");
    let server_path = resource_dir.join("desktop-resources/server/desktop-server.mjs");
    let web_root = resource_dir.join("desktop-resources/web");
    let archive_root = data_root.join("unterrichtsarchiv");
    let log_path = log_dir.join("tafelraum-desktop.log");
    let stderr = File::options().create(true).append(true).open(log_path)?;

    let mut child = Command::new(node_path)
        .arg(server_path)
        .arg("--web-root")
        .arg(web_root)
        .arg("--archive-root")
        .arg(archive_root)
        .arg("--port")
        .arg(LOCAL_PORT.to_string())
        .arg("--parent-pid")
        .arg(std::process::id().to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::from(stderr))
        .spawn()?;
    let stdout = child
        .stdout
        .take()
        .ok_or("Lokaler Server liefert keinen Startstatus.")?;
    app.manage(ServerProcess(Mutex::new(Some(child))));

    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        let ready = reader.read_line(&mut line).is_ok()
            && line.trim() == format!("TAFELRAUM_READY {LOCAL_PORT}");
        if !ready {
            show_message(
                &handle,
                "Tafelraum konnte nicht starten",
                "Der lokale Tafelraum-Dienst konnte nicht geöffnet werden. Details stehen im lokalen Protokollordner.",
                MessageDialogKind::Error,
            );
            return;
        }
        let window_handle = handle.clone();
        let _ = handle.run_on_main_thread(move || {
            if let Some(window) = window_handle.get_webview_window("main") {
                if let Ok(url) = format!("http://127.0.0.1:{LOCAL_PORT}/").parse() {
                    let _ = window.navigate(url);
                }
            }
        });
    });
    Ok(())
}

#[cfg(debug_assertions)]
fn start_local_server(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

fn stop_local_server(app: &AppHandle) {
    if let Some(server) = app.try_state::<ServerProcess>() {
        if let Ok(mut child) = server.0.lock() {
            if let Some(mut child) = child.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(UpdateState::new())
        .manage(UiLanguage::default())
        .manage(PersistenceExit::default())
        .invoke_handler(tauri::generate_handler![
            desktop_update_overview,
            request_desktop_update_check,
            print_desktop_webview,
            open_external_web_url,
            open_room_canvas,
            close_room_canvas,
            confirm_desktop_persistence,
            set_ui_language,
        ])
        .setup(|app| {
            install_menu(app)?;
            start_local_server(app).map_err(|error| error.to_string())?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "check-updates" => check_for_updates(app.clone(), true),
            "open-data" => {
                if let Ok(path) = app.path().app_data_dir() {
                    let _ = fs::create_dir_all(&path);
                    let _ = Command::new("/usr/bin/open").arg(path).spawn();
                }
            }
            _ => {}
        });

    let builder = if official_updates_enabled() { builder.plugin(tauri_plugin_updater::Builder::new().build()) } else { builder };
    let app = builder
        .build(tauri::generate_context!())
        .expect("Tafelraum konnte nicht aufgebaut werden");
    app.run(|handle, event| {
        match &event {
            RunEvent::WindowEvent { label, event: tauri::WindowEvent::CloseRequested { api, .. }, .. }
                if label == "main" && !handle.state::<PersistenceExit>().approved.load(Ordering::SeqCst) => {
                    api.prevent_close();
                    request_saved_exit(handle);
                }
            RunEvent::ExitRequested { api, .. }
                if !handle.state::<PersistenceExit>().approved.load(Ordering::SeqCst) => {
                    api.prevent_exit();
                    request_saved_exit(handle);
                }
            _ => {}
        }
        if let RunEvent::WindowEvent { label, event: tauri::WindowEvent::Destroyed, .. } = &event {
            if label == "room-canvas" {
                let _ = handle.emit_to("main", "room-canvas-closed", ());
            } else if label == "main" {
                if let Some(room) = handle.get_webview_window("room-canvas") {
                    let _ = room.close();
                }
            }
        }
        #[cfg(not(debug_assertions))]
        match &event {
            RunEvent::Ready => check_for_updates(handle.clone(), false),
            RunEvent::WindowEvent {
                event: tauri::WindowEvent::Focused(true),
                ..
            } if handle.state::<UpdateState>().should_check_automatically() => {
                check_for_updates(handle.clone(), false)
            }
            _ => {}
        }
        if matches!(event, RunEvent::Exit) {
            stop_local_server(handle);
        }
    });
}

fn request_saved_exit(app: &AppHandle) {
    if app.state::<PersistenceExit>().busy.swap(true, Ordering::SeqCst) { return; }
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        match persistence_exit::flush(&app).await {
            Ok(()) => {
                app.state::<PersistenceExit>().approved.store(true, Ordering::SeqCst);
                app.exit(0);
            }
            Err(error) => {
                app.state::<PersistenceExit>().busy.store(false, Ordering::SeqCst);
                show_message(&app, "Nicht gespeichert", error, MessageDialogKind::Error);
            }
        }
    });
}
