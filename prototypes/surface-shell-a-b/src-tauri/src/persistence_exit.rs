use std::sync::{atomic::{AtomicBool, AtomicU64, Ordering}, mpsc, Mutex};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

#[derive(Default)]
pub struct PersistenceExit {
    pub approved: AtomicBool,
    pub busy: AtomicBool,
    sequence: AtomicU64,
    pending: Mutex<Option<(u64, mpsc::Sender<bool>)>>,
}

#[tauri::command]
pub fn confirm_desktop_persistence(window: WebviewWindow, id: u64, saved: bool) -> Result<(), String> {
    if window.label() != "main" { return Err("Nur die Lehreransicht darf das Speichern bestätigen.".into()); }
    window.state::<PersistenceExit>().confirm(id, saved)
}

impl PersistenceExit {
  fn confirm(&self, id: u64, saved: bool) -> Result<(), String> {
    let mut pending = self.pending.lock().map_err(|_| "Speicherabschluss nicht verfügbar.")?;
    if pending.as_ref().map(|entry| entry.0) != Some(id) { return Err("Speicherauftrag abgelaufen.".into()); }
    if let Some((_, sender)) = pending.take() { let _ = sender.send(saved); }
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
    let saved = sent && tauri::async_runtime::spawn_blocking(move || {
        receiver.recv_timeout(std::time::Duration::from_secs(30)).unwrap_or(false)
    }).await.unwrap_or(false);
    if let Ok(mut pending) = state.pending.lock() {
        if pending.as_ref().map(|entry| entry.0) == Some(id) { pending.take(); }
    }
    if saved { Ok(()) } else {
        release(app);
        Err("Änderungen konnten nicht vollständig gespeichert werden. Tafelraum bleibt geöffnet.".into())
    }
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
        assert!(state.confirm(41, true).is_err());
        assert!(receiver.try_recv().is_err());
        assert!(state.confirm(42, true).is_ok());
        assert!(receiver.recv().unwrap());
        assert!(state.confirm(42, true).is_err());
    }

    #[test]
    fn failed_commit_releases_the_request_without_approving_exit() {
        let state = PersistenceExit::default();
        let (sender, receiver) = mpsc::channel();
        *state.pending.lock().unwrap() = Some((7, sender));
        state.confirm(7, false).unwrap();
        assert!(!receiver.recv().unwrap());
        assert!(!state.approved.load(Ordering::SeqCst));
        assert!(state.pending.lock().unwrap().is_none());
    }
}
