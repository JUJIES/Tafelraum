use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex, OnceLock,
};
use tauri::{menu::MenuItemKind, AppHandle, Manager, WebviewWindow, Wry};

#[derive(Default)]
pub struct UiLanguage {
    english: AtomicBool,
    pub update_label: Mutex<Option<String>>,
}
fn catalogue() -> &'static serde_json::Map<String, serde_json::Value> {
    static CATALOGUE: OnceLock<serde_json::Map<String, serde_json::Value>> = OnceLock::new();
    CATALOGUE.get_or_init(|| {
        serde_json::from_str(include_str!("../../src/i18n/en.json")).expect("UI language catalogue")
    })
}
pub fn translate(app: &AppHandle, source: &str) -> String {
    translate_text(
        source,
        app.state::<UiLanguage>().english.load(Ordering::SeqCst),
    )
}
fn translate_text(text: &str, english: bool) -> String {
    let catalogue = catalogue();
    // Menu handles contain their current label. Resolve back to the source key
    // before switching, without storing a second native preference or menu tree.
    let source = if catalogue.contains_key(text) {
        text
    } else {
        catalogue
            .iter()
            .find_map(|(source, value)| (value.as_str() == Some(text)).then_some(source.as_str()))
            .unwrap_or(text)
    };
    if english {
        if let Some(value) = catalogue.get(source).and_then(|value| value.as_str()) {
            return value.into();
        }
        if let Some(version) = source
            .strip_prefix("Update ")
            .and_then(|value| value.strip_suffix(" verfügbar …"))
        {
            return format!("Update {version} available …");
        }
    }
    source.into()
}
fn translate_items(app: &AppHandle, items: Vec<MenuItemKind<Wry>>) -> tauri::Result<()> {
    for item in items {
        match item {
            MenuItemKind::MenuItem(item) => item.set_text(translate(app, &item.text()?))?,
            MenuItemKind::Predefined(item) => item.set_text(translate(app, &item.text()?))?,
            MenuItemKind::Submenu(item) => {
                item.set_text(translate(app, &item.text()?))?;
                translate_items(app, item.items()?)?;
            }
            _ => {}
        }
    }
    Ok(())
}
#[tauri::command]
pub fn set_ui_language(window: WebviewWindow, language: String) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only the teacher view can set the app language.".into());
    }
    let english = match language.as_str() {
        "en" => true,
        "de" => false,
        _ => return Err("Unsupported UI language.".into()),
    };
    let app = window.app_handle();
    app.state::<UiLanguage>()
        .english
        .store(english, Ordering::SeqCst);
    if let Some(menu) = app.menu() {
        translate_items(app, menu.items().map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
    }
    if let Some(label) = app
        .state::<UiLanguage>()
        .update_label
        .lock()
        .map_err(|e| e.to_string())?
        .as_ref()
    {
        if let Some(item) = app.try_state::<crate::UpdateMenuItem>() {
            item.0
                .set_text(translate(app, label))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn native_menu_copy_uses_the_shared_catalogue_in_both_directions() {
        for source in [
            "Bearbeiten",
            "Fenster",
            "Tafelraum beenden",
            "Lokalen Datenordner öffnen",
            "Fenster schließen",
            "Ausschneiden",
            "Einfügen",
            "Alles auswählen",
            "Minimieren",
        ] {
            let english = translate_text(source, true);
            assert_ne!(english, source);
            assert_eq!(translate_text(&english, false), source);
        }
        assert_eq!(
            translate_text("Update 0.1.88 verfügbar …", true),
            "Update 0.1.88 available …"
        );
        assert_eq!(
            translate_text("Unknown diagnostic", true),
            "Unknown diagnostic"
        );
    }
}
