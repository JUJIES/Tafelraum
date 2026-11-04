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
use tauri_plugin_updater::{Update, UpdaterExt};
use url::Url;
mod ui_language;
use ui_language::{UiLanguage, set_ui_language};
mod persistence_exit;
use persistence_exit::{PersistenceExit, confirm_desktop_persistence};

#[cfg(target_os = "macos")]
mod room_fullscreen;

mod system_open;
mod desktop_release;
use desktop_release::DesktopRelease;

fn official_updates_enabled(app: &AppHandle) -> bool {
    app.state::<DesktopRelease>().updates_enabled()
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
    available_update: Mutex<Option<Update>>,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateOverview {
    current_version: String,
    available_version: Option<String>,
    phase: &'static str,
    update_channel: &'static str,
}

impl UpdateState {
    fn new() -> Self {
        Self {
            phase: AtomicU8::new(UPDATE_IDLE),
            last_check: Mutex::new(None),
            available_update: Mutex::new(None),
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

    fn set_available_update(&self, update: Option<Update>) {
        if let Ok(mut available_version) = self.available_update.lock() {
            *available_version = update;
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
                .available_update
                .lock()
                .ok()
                .and_then(|entry| entry.as_ref().map(|update| update.version.clone())),
            phase,
            update_channel: app.state::<DesktopRelease>().channel,
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
    if !official_updates_enabled(&app) { return; }
    log_update(&app, format!("Updateprüfung gestartet (manuell={manual})."));
    let update_state = app.state::<UpdateState>();
    if !update_state.begin_check() {
        log_update(&app, "Updateprüfung läuft bereits.");
        return;
    }
    set_update_menu(&app, "Suche nach Updates …", false);
    emit_update_overview(&app);
    tauri::async_runtime::spawn(async move {
        let updater = app.updater_builder();
        #[cfg(windows)]
        let updater = {
            let exit_app = app.clone();
            updater.on_before_exit(move || {
                // Windows updater calls process::exit; RunEvent::Exit is skipped.
                // The canonical persistence flush still happens before install.
                stop_local_server(&exit_app);
                log_update(&exit_app, "Windows-Update: eigener lokaler Dienst beendet.");
                // Keep windows/resources alive if ShellExecute fails. A successful
                // handoff exits the process; failure below restarts only our server.
            })
        };
        let result = match updater.build() {
            Ok(updater) => updater.check().await.map_err(|error| error.to_string()),
            Err(error) => Err(error.to_string()),
        };
        match result {
            Ok(Some(update)) => {
                let version = update.version.clone();
                app.state::<UpdateState>()
                    .set_available_update(Some(update.clone()));
                log_update(&app, format!("Update {version} gefunden."));
                if !manual {
                    app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                    set_update_menu(&app, available_update_label(&version), true);
                    emit_update_overview(&app);
                    log_update(&app, "Update steht zur Bestätigung im Lehrerfenster bereit.");
                    return;
                }
                app.state::<UpdateState>().set_phase(UPDATE_AWAITING_CONFIRMATION);
                confirm_update(app, update);
            }
            Ok(None) => {
                log_update(&app, "Kein Update gefunden.");
                app.state::<UpdateState>().set_phase(UPDATE_IDLE);
                app.state::<UpdateState>().set_available_update(None);
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

fn confirm_update(app: AppHandle, update: Update) {
    let version = update.version.clone();
    set_update_menu(&app, available_update_label(&version), false);
    emit_update_overview(&app);
    let message = ui_language::translate(&app, "Tafelraum {0} ist verfügbar. Möchtest du das Update installieren und Tafelraum neu starten?").replace("{0}", &version);
    let install_app = app.clone();
    let dialog = app
        .dialog()
        .message(message)
        .title(ui_language::translate(&app, "Tafelraum aktualisieren"))
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(
            ui_language::translate(&app, "Installieren (empfohlen)"),
            ui_language::translate(&app, "Später"),
        ));
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
                #[cfg(windows)]
                let error = if owns_persistence {
                    let stopped = install_app.try_state::<ServerProcess>()
                        .and_then(|server| server.0.lock().ok().map(|child| child.is_none()))
                        .unwrap_or(false);
                    if stopped {
                        match start_local_server(&install_app) {
                            Ok(()) => { log_update(&install_app, "Windows-Update fehlgeschlagen; eigener Dienst wird wieder gestartet."); error }
                            Err(restart_error) => {
                                log_update(&install_app, format!("Lokaler Wiederanlauf fehlgeschlagen: {restart_error}"));
                                format!("{error}\nDie Änderungen wurden gespeichert. Bitte Tafelraum neu starten.")
                            }
                        }
                    } else { error }
                } else { error };
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

#[tauri::command]
fn desktop_update_overview(app: AppHandle) -> UpdateOverview {
    app.state::<UpdateState>().overview(&app)
}

#[tauri::command]
fn request_desktop_update_check(window: tauri::WebviewWindow, app: AppHandle, available_version: Option<String>) {
    if !official_updates_enabled(&app) || window.label() != "main" { return; }
    let Some(version) = available_version else { check_for_updates(app, true); return; };
    let state = app.state::<UpdateState>();
    let update = state.available_update.lock().ok().and_then(|entry| entry.clone());
    if let Some(update) = update.filter(|update| update.version == version) {
        if state.phase.compare_exchange(UPDATE_IDLE, UPDATE_AWAITING_CONFIRMATION, Ordering::AcqRel, Ordering::Relaxed).is_ok() {
            confirm_update(app, update);
        }
    }
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
    system_open::open(std::ffi::OsStr::new(parsed.as_str()))?;
    Ok(())
}

#[tauri::command]
// WebView2 creation must not block a synchronous command on Windows.
async fn open_room_canvas(app: AppHandle, channel: String) -> Result<(), String> {
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
    let base = format!("http://127.0.0.1:{}", app.state::<DesktopRelease>().port);
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
    use super::{validate_external_web_url};


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
    #[cfg(windows)]
    let about = Some(tauri::menu::AboutMetadata {
        name: Some("Tafelraum".into()),
        version: Some(app.package_info().version.to_string()),
        ..Default::default()
    });
    #[cfg(not(windows))]
    let about = None;
    let mut app_menu = SubmenuBuilder::new(app, "Tafelraum").about_with_text("Über Tafelraum", about).separator();
    if official_updates_enabled(app.handle()) { app_menu = app_menu.item(&check_updates); }
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
fn start_local_server(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.clone();
    if let Some(server) = app.try_state::<ServerProcess>() {
        if server.0.lock().map_err(|_| "Lokaler Dienst nicht verfügbar")?.is_some() {
            return Err("Lokaler Dienst läuft bereits".into());
        }
    }
    let local_port = app.state::<DesktopRelease>().port;
    let resource_dir = app.path().resource_dir()?;
    let data_root = app.path().app_data_dir()?;
    let log_dir = app.path().app_log_dir()?;
    fs::create_dir_all(&data_root)?;
    fs::create_dir_all(&log_dir)?;

    let node_path = resource_dir.join(if cfg!(target_os = "windows") { "desktop-resources/runtime/node.exe" } else { "desktop-resources/runtime/node" });
    let server_path = resource_dir.join("desktop-resources/server/desktop-server.mjs");
    let web_root = resource_dir.join("desktop-resources/web");
    let archive_root = data_root.join("unterrichtsarchiv");
    let log_path = log_dir.join("tafelraum-desktop.log");
    let stderr = File::options().create(true).append(true).open(log_path)?;

    let mut command = Command::new(node_path);
    #[cfg(target_os = "windows")]
    { use std::os::windows::process::CommandExt; command.creation_flags(0x08000000); }
    let mut child = command
        .arg(server_path)
        .arg("--web-root")
        .arg(web_root)
        .arg("--archive-root")
        .arg(archive_root)
        .arg("--port")
        .arg(local_port.to_string())
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
    if let Some(server) = app.try_state::<ServerProcess>() {
        *server.0.lock().map_err(|_| "Lokaler Dienst nicht verfügbar")? = Some(child);
    } else {
        app.manage(ServerProcess(Mutex::new(Some(child))));
    }

    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        let ready = reader.read_line(&mut line).is_ok()
            && line.trim() == format!("TAFELRAUM_READY {local_port}");
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
                if let Ok(url) = format!("http://127.0.0.1:{local_port}/").parse() {
                    let _ = window.navigate(url);
                }
            }
        });
    });
    Ok(())
}

#[cfg(debug_assertions)]
fn start_local_server(_app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
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
    let context = tauri::generate_context!();
    let release = DesktopRelease::from_config(context.config()).expect("Invalid desktop delivery configuration");
    let updates_enabled = release.updates_enabled();
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(release)
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
            start_local_server(app.handle()).map_err(|error| error.to_string())?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "check-updates" => check_for_updates(app.clone(), true),
            "open-data" => {
                let result = app.path().app_data_dir().map_err(|e| e.to_string())
                    .and_then(|path| {
                        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
                        system_open::open_folder(&path)
                    });
                if let Err(error) = result {
                    show_message(app, "Datenordner konnte nicht geöffnet werden", error, MessageDialogKind::Error);
                }
            }
            _ => {}
        });

    let builder = if updates_enabled { builder.plugin(tauri_plugin_updater::Builder::new().build()) } else { builder };
    let app = builder
        .build(context)
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
            RunEvent::Ready if official_updates_enabled(handle) => {
                check_for_updates(handle.clone(), false);
                let app = handle.clone();
                std::thread::spawn(move || loop {
                    std::thread::sleep(Duration::from_secs(60));
                    if app.state::<UpdateState>().should_check_automatically() {
                        check_for_updates(app.clone(), false);
                    }
                });
            }
            RunEvent::WindowEvent {
                event: tauri::WindowEvent::Focused(true),
                ..
            } if official_updates_enabled(handle) && handle.state::<UpdateState>().should_check_automatically() => {
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
