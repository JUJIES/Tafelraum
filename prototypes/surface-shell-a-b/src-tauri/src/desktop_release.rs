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

    pub fn updates_enabled(&self) -> bool { self.channel != "manual" }
}

#[cfg(test)]
mod tests {
    use super::*;
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
