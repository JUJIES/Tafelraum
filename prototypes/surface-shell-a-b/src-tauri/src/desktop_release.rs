// Build configuration selects delivery; lesson/profile preferences cannot change it.
use serde_json::Value;

#[derive(Clone, Debug)]
pub struct DesktopRelease {
    pub channel: &'static str,
    pub port: u16,
}

impl DesktopRelease {
    pub fn from_config(config: &tauri::Config) -> Result<Self, String> {
        let distribution: Value = serde_json::from_str(include_str!("../../distribution.json")).unwrap();
        Self::validate(distribution["profile"].as_str().unwrap_or(""), &serde_json::to_value(config).map_err(|e| e.to_string())?)
    }

    fn validate(profile: &str, config: &Value) -> Result<Self, String> {
        if config["identifier"] == "app.jujies.tafelraum.public.qa.windows.update" {
            let updater = &config["plugins"]["updater"];
            let catalog: Value = serde_json::from_str(include_str!("../../distribution/desktop-channels.json")).unwrap();
            let disposable_key = updater["pubkey"].as_str().map(|key| key.len() > 100
                && catalog.as_object().unwrap().values().all(|lane| lane["publicKey"] != key)).unwrap_or(false);
            if !cfg!(windows) || profile != "public"
                || config["plugins"]["tafelraum-qa"] != serde_json::json!({"platform":"windows","port":49321,"package":"nsis","update":"loopback"})
                || updater["endpoints"] != serde_json::json!(["http://127.0.0.1:49322/latest.json"])
                || updater["dangerousInsecureTransportProtocol"] != true
                || updater["windows"]["installMode"] != "passive" || !disposable_key
                || config["bundle"]["active"] != true
                || config["mainBinaryName"] != "Tafelraum-Update-QA" {
                return Err("Invalid isolated Windows update QA configuration".into());
            }
            return Ok(Self {channel:"qa-update",port:49321});
        }
        if config["identifier"] == "app.jujies.tafelraum.public.qa.macos" {
            if !cfg!(target_os = "macos") || profile != "public"
                || config["plugins"]["tafelraum-qa"] != serde_json::json!({"platform":"macos","port":49321})
                || !config["plugins"]["updater"].is_null() {
                return Err("Invalid isolated Mac QA configuration".into());
            }
            return Ok(Self {channel:"qa-macos",port:49321});
        }
        if config["identifier"] == "app.jujies.tafelraum.public.qa.windows.installer" {
            // Tauri omits NSIS/targets from its generated context. Enforce those
            // bundler-only fields in desktop-release-config.mjs before staging.
            if !cfg!(target_os = "windows") || profile != "public"
                || config["plugins"]["tafelraum-qa"] != serde_json::json!({"platform":"windows","port":49320,"package":"nsis"})
                || !config["plugins"]["updater"].is_null()
                || config["bundle"]["createUpdaterArtifacts"] != false
                || config["bundle"]["active"] != true
                || config["mainBinaryName"] != "Tafelraum-Installer-QA" {
                return Err("Invalid isolated Windows installer QA configuration".into());
            }
            return Ok(Self {channel:"qa-installer", port:49320});
        }
        if config["identifier"] == "app.jujies.tafelraum.public.qa.windows" {
            if !cfg!(target_os = "windows") || profile != "public"
                || config["plugins"]["tafelraum-qa"] != serde_json::json!({"platform":"windows","port":49319})
                || !config["plugins"]["updater"].is_null()
                || config["bundle"]["createUpdaterArtifacts"] != false
                || config["bundle"]["active"] != false {
                return Err("Invalid isolated Windows QA configuration".into());
            }
            return Ok(Self {channel:"qa", port:49319});
        }
        if !config["plugins"]["tafelraum-qa"].is_null() { return Err("QA metadata requires QA identity".into()); }
        let catalog: Value = serde_json::from_str(include_str!("../../distribution/desktop-channels.json")).unwrap();
        let lane = &catalog[profile];
        if lane.is_null() || config["identifier"] != lane["identifier"] {
            return Err("App identity does not match its source edition".into());
        }
        let updater = &config["plugins"]["updater"];
        let channel = if updater.is_null() {
            "manual"
        } else {
            if updater["endpoints"] != serde_json::json!([lane["endpoint"]]) || updater["pubkey"] != lane["publicKey"] {
                return Err("Updater address or signing key belongs to another channel".into());
            }
            if profile == "public" { "public" } else { "colleagues" }
        };
        Ok(Self { channel, port: lane["port"].as_u64().ok_or("Missing desktop port")? as u16 })
    }

    pub fn updates_enabled(&self) -> bool { matches!(self.channel, "public" | "colleagues" | "qa-update") }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_os = "macos")]
    #[test]
    fn mac_qa_runtime_is_separate_and_cannot_enable_updates() {
        let config: tauri::Config = serde_json::from_str(include_str!("../tauri.macos-qa.conf.json")).unwrap();
        let runtime = serde_json::to_value(config).unwrap();
        let release=DesktopRelease::validate("public",&runtime).unwrap();
        assert_eq!(release.port,49321);
        assert!(!release.updates_enabled());
        assert!(DesktopRelease::validate("personal",&runtime).is_err());
        let mut bad=runtime.clone();bad["plugins"]["updater"]=serde_json::json!({});
        assert!(DesktopRelease::validate("public",&bad).is_err());
        let mut bad=runtime.clone();bad["plugins"]["tafelraum-qa"]["port"]=serde_json::json!(49318);
        assert!(DesktopRelease::validate("public",&bad).is_err());
    }
    #[cfg(windows)]
    #[test]
    fn generated_windows_context_keeps_its_delivery_identity() {
        // generate_context deliberately drops bundler-only fields (NSIS, targets,
        // resources). Those are enforced by desktop-release-config.mjs before
        // staging. Exercise the real compiled context, not just JSON roundtrips.
        let context: tauri::Context<tauri::Wry> = tauri::generate_context!();
        let release = DesktopRelease::from_config(context.config()).unwrap();
        let selected: Value = serde_json::from_str(option_env!("TAURI_CONFIG").unwrap_or("{}")).unwrap();
        if let Some(identifier) = selected["identifier"].as_str() {
            assert_eq!(context.config().identifier, identifier);
        }
        if context.config().identifier == "app.jujies.tafelraum.public.qa.windows.installer" {
            assert_eq!(release.port, 49320);
            assert_eq!(release.channel, "qa-installer");
            assert!(!release.updates_enabled());
        }
        if context.config().identifier == "app.jujies.tafelraum.public.qa.windows.update" {
            assert_eq!(release.port, 49321);
            assert_eq!(release.channel, "qa-update");
            assert!(release.updates_enabled());
        }
    }
    #[cfg(windows)]
    #[test]
    fn local_update_qa_refuses_remote_transport_and_production_keys() {
        let config: Value = serde_json::from_str(include_str!("../tauri.windows-update-qa.conf.json")).unwrap();
        assert_eq!(DesktopRelease::validate("public", &config).unwrap().channel, "qa-update");
        assert!(DesktopRelease::validate("personal", &config).is_err());
        for endpoint in ["http://localhost:49322/latest.json", "https://example.com/latest.json"] {
            let mut bad = config.clone();
            bad["plugins"]["updater"]["endpoints"] = serde_json::json!([endpoint]);
            assert!(DesktopRelease::validate("public", &bad).is_err());
        }
        let lanes: Value = serde_json::from_str(include_str!("../../distribution/desktop-channels.json")).unwrap();
        for lane in lanes.as_object().unwrap().values() {
            let mut bad = config.clone();
            bad["plugins"]["updater"]["pubkey"] = lane["publicKey"].clone();
            assert!(DesktopRelease::validate("public", &bad).is_err());
        }
    }
    #[cfg(windows)]
    #[test]
    fn installer_qa_has_its_own_identity_and_cannot_enable_updates() {
        let config: Value = serde_json::from_str(include_str!("../tauri.windows-installer-qa.conf.json")).unwrap();
        let release = DesktopRelease::validate("public", &config).unwrap();
        assert_eq!(release.port, 49320);
        assert!(!release.updates_enabled());
        assert!(DesktopRelease::validate("personal", &config).is_err());
        for field in ["active", "createUpdaterArtifacts"] {
            let mut bad = config.clone();
            bad["bundle"][field] = serde_json::json!(field != "active");
            assert!(DesktopRelease::validate("public", &bad).is_err());
        }
        let mut bad = config.clone();
        bad["plugins"]["updater"] = serde_json::json!({});
        assert!(DesktopRelease::validate("public", &bad).is_err());
        let mut bad = config.clone();
        bad["plugins"]["tafelraum-qa"]["port"] = serde_json::json!(49319);
        assert!(DesktopRelease::validate("public", &bad).is_err());
    }
    #[cfg(target_os = "windows")]
    #[test]
    fn windows_qa_refuses_updates_and_official_identity() {
        let qa=serde_json::json!({"identifier":"app.jujies.tafelraum.public.qa.windows",
            "plugins":{"tafelraum-qa":{"platform":"windows","port":49319}},
            "bundle":{"active":false,"createUpdaterArtifacts":false}});
        let release=DesktopRelease::validate("public", &qa).unwrap();
        assert_eq!(release.port,49319);
        assert!(!release.updates_enabled());
        assert!(DesktopRelease::validate("personal", &qa).is_err());
        let mut bad=qa.clone();bad["plugins"]["updater"]=serde_json::json!({});
        assert!(DesktopRelease::validate("public", &bad).is_err());
        let mut bad=qa.clone();bad["identifier"]=serde_json::json!("app.jujies.tafelraum.public");
        assert!(DesktopRelease::validate("public", &bad).is_err());
        let mut bad=qa.clone();bad["plugins"]["tafelraum-qa"]["port"]=serde_json::json!(49318);
        assert!(DesktopRelease::validate("public", &bad).is_err());
    }
    #[test]
    fn official_channels_are_bound_to_profile_identity_address_and_key() {
        let lanes: Value = serde_json::from_str(include_str!("../../distribution/desktop-channels.json")).unwrap();
        for profile in ["personal", "public"] {
            let lane = &lanes[profile];
            let mut config = serde_json::json!({"identifier":lane["identifier"]});
            assert_eq!(DesktopRelease::validate(profile, &config).unwrap().channel, "manual");
            config["plugins"] = serde_json::json!({"updater":{"endpoints":[lane["endpoint"]],"pubkey":lane["publicKey"]}});
            assert_eq!(DesktopRelease::validate(profile, &config).unwrap().channel, lane["channel"].as_str().unwrap());
            let other = if profile == "public" { "personal" } else { "public" };
            assert!(DesktopRelease::validate(other, &config).is_err());
            config["plugins"]["updater"]["pubkey"] = serde_json::json!(lanes[other]["publicKey"]);
            assert!(DesktopRelease::validate(profile, &config).is_err());
            config["plugins"]["updater"]["pubkey"] = lane["publicKey"].clone();
            config["plugins"]["updater"]["endpoints"] = serde_json::json!([lanes[other]["endpoint"]]);
            assert!(DesktopRelease::validate(profile, &config).is_err());
        }
        assert_ne!(lanes["personal"]["port"], lanes["public"]["port"]);
        assert_ne!(lanes["personal"]["publicKey"], lanes["public"]["publicKey"]);
    }
}
