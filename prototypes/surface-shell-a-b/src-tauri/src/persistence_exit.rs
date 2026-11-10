use std::sync::{atomic::{AtomicBool, AtomicU64, Ordering}, mpsc, Mutex};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

#[derive(Default)]
pub struct PersistenceExit {
    pub approved: AtomicBool,
    pub busy: AtomicBool,
    sequence: AtomicU64,
    pending: Mutex<Option<(u64, mpsc::Sender<Result<(), String>>)>>,
}

#[tauri::command]
pub fn confirm_desktop_persistence(window: WebviewWindow, id: u64, saved: bool, error: Option<String>) -> Result<(), String> {
    if window.label() != "main" { return Err("Nur die Lehreransicht darf das Speichern bestätigen.".into()); }
    window.state::<PersistenceExit>().confirm(id, saved, error)
}

impl PersistenceExit {
  fn confirm(&self, id: u64, saved: bool, error: Option<String>) -> Result<(), String> {
    let mut pending = self.pending.lock().map_err(|_| "Speicherabschluss nicht verfügbar.")?;
    if pending.as_ref().map(|entry| entry.0) != Some(id) { return Err("Speicherauftrag abgelaufen.".into()); }
    if let Some((_, sender)) = pending.take() {
        let result = if saved { Ok(()) } else {
            Err(error.filter(|value| !value.trim().is_empty()).unwrap_or_else(|| "Änderungen konnten nicht vollständig gespeichert werden.".into()))
        };
        let _ = sender.send(result);
    }
    Ok(())
  }
}

pub async fn flush(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<PersistenceExit>();
    let id = state.sequence.fetch_add(1, Ordering::SeqCst) + 1;
    let (sender, receiver) = mpsc::channel();
    {
        let mut pending = state.pending.lock().map_err(|_| "Speicherabschluss nicht verfügbar.")?;
        if pending.is_some() { return Err("Speichern läuft bereits.".into()); }
        *pending = Some((id, sender));
    }
    let sent = app.emit_to("main", "tafelraum-flush-before-exit", id).is_ok();
    let result = if sent { tauri::async_runtime::spawn_blocking(move || {
        receiver.recv_timeout(std::time::Duration::from_secs(30))
            .unwrap_or_else(|_| Err("Der Speicherabschluss hat nicht rechtzeitig geantwortet.".into()))
    }).await.unwrap_or_else(|_| Err("Der Speicherabschluss wurde unterbrochen.".into())) }
    else { Err("Die Lehreransicht konnte zum Speichern nicht erreicht werden.".into()) };
    if let Ok(mut pending) = state.pending.lock() {
        if pending.as_ref().map(|entry| entry.0) == Some(id) { pending.take(); }
    }
    result.map_err(|error| {
        release(app);
        format!("{error}\nTafelraum bleibt geöffnet.")
    })
}

pub fn release(app: &AppHandle) { let _ = app.emit_to("main", "tafelraum-exit-released", ()); }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stale_and_duplicate_acknowledgements_cannot_approve_another_exit() {
        let state = PersistenceExit::default();
        let (sender, receiver) = mpsc::channel();
        *state.pending.lock().unwrap() = Some((42, sender));
        assert!(state.confirm(41, true, None).is_err());
        assert!(receiver.try_recv().is_err());
        assert!(state.confirm(42, true, None).is_ok());
        assert!(receiver.recv().unwrap().is_ok());
        assert!(state.confirm(42, true, None).is_err());
    }

    #[test]
    fn failed_commit_releases_the_request_without_approving_exit() {
        let state = PersistenceExit::default();
        let (sender, receiver) = mpsc::channel();
        *state.pending.lock().unwrap() = Some((7, sender));
        state.confirm(7, false, Some("Disk full".into())).unwrap();
        assert_eq!(receiver.recv().unwrap(), Err("Disk full".into()));
        assert!(!state.approved.load(Ordering::SeqCst));
        assert!(state.pending.lock().unwrap().is_none());
    }
}
