use base64::{engine::general_purpose::STANDARD, Engine as _};
use minisign_verify::{PublicKey, Signature};
use serde_json::Value;
use std::{env, fs};

fn decoded_text(value: &str) -> Result<String, String> {
    let bytes = STANDARD.decode(value).map_err(|error| error.to_string())?;
    String::from_utf8(bytes).map_err(|error| error.to_string())
}

fn main() -> Result<(), String> {
    let mut arguments = env::args().skip(1);
    let archive_path = arguments
        .next()
        .ok_or_else(|| "Updater-Archiv fehlt.".to_string())?;
    let manifest_path = arguments
        .next()
        .ok_or_else(|| "Update-Manifest fehlt.".to_string())?;
    let config_path = arguments
        .next()
        .ok_or_else(|| "Tauri-Konfiguration fehlt.".to_string())?;
    if arguments.next().is_some() {
        return Err("Zu viele Argumente.".into());
    }

    let archive = fs::read(archive_path).map_err(|error| error.to_string())?;
    let manifest: Value =
        serde_json::from_slice(&fs::read(manifest_path).map_err(|error| error.to_string())?)
            .map_err(|error| error.to_string())?;
    let config: Value =
        serde_json::from_slice(&fs::read(config_path).map_err(|error| error.to_string())?)
            .map_err(|error| error.to_string())?;
    let public_key = config["plugins"]["updater"]["pubkey"]
        .as_str()
        .ok_or_else(|| "Öffentlicher Updater-Schlüssel fehlt.".to_string())?;
    let signature = manifest["platforms"]["darwin-aarch64"]["signature"]
        .as_str()
        .ok_or_else(|| "Updater-Signatur fehlt.".to_string())?;

    let public_key =
        PublicKey::decode(&decoded_text(public_key)?).map_err(|error| error.to_string())?;
    let signature =
        Signature::decode(&decoded_text(signature)?).map_err(|error| error.to_string())?;
    public_key
        .verify(&archive, &signature, true)
        .map_err(|error| error.to_string())?;
    println!("Updater-Signatur ist mit dem eingebauten öffentlichen Schlüssel gültig.");
    Ok(())
}
