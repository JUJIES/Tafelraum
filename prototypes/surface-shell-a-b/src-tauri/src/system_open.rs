use std::ffi::OsStr;

#[cfg(windows)]
fn explorer_argument(path: &std::path::Path) -> Result<std::ffi::OsString, String> {
    use std::os::windows::ffi::OsStringExt;
    if !path.is_absolute() || !path.is_dir() {
        return Err(format!("Kein erreichbarer Datenordner: {}", path.display()));
    }
    Ok(std::ffi::OsString::from_wide(&shell_target(path.as_os_str())))
}

#[cfg(windows)]
pub fn open_folder(path: &std::path::Path) -> Result<(), String> {
    let windows = std::env::var_os("SystemRoot").ok_or("Windows-Verzeichnis fehlt")?;
    let explorer = std::path::PathBuf::from(windows).join("explorer.exe");
    std::process::Command::new(explorer).arg(explorer_argument(path)?)
        .spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[cfg(not(windows))]
pub fn open_folder(path: &std::path::Path) -> Result<(), String> {
    open(path.as_os_str())
}

#[cfg(target_os = "windows")]
fn shell_target(target: &OsStr) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    let value: Vec<u16> = target.encode_wide().collect();
    let prefix: Vec<u16> = "\\\\?\\".encode_utf16().collect();
    let unc: Vec<u16> = "UNC\\".encode_utf16().collect();
    if let Some(rest) = value.strip_prefix(prefix.as_slice()) {
        if let Some(rest) = rest.strip_prefix(unc.as_slice()) {
            return "\\\\".encode_utf16().chain(rest.iter().copied()).collect();
        }
        return rest.to_vec();
    }
    value
}

#[cfg(target_os = "windows")]
pub fn open(target: &OsStr) -> Result<(), String> {
    use std::ptr;
    #[link(name = "shell32")]
    extern "system" {
        fn ShellExecuteW(hwnd: *mut std::ffi::c_void, operation: *const u16, file: *const u16,
            parameters: *const u16, directory: *const u16, show: i32) -> isize;
    }
    let value = shell_target(target);
    if value.contains(&0) { return Err("Invalid system-open target".into()); }
    let value: Vec<u16> = value.into_iter().chain(Some(0)).collect();
    let operation: Vec<u16> = "open\0".encode_utf16().collect();
    let result = unsafe { ShellExecuteW(ptr::null_mut(), operation.as_ptr(), value.as_ptr(), ptr::null(), ptr::null(), 1) };
    if result > 32 { Ok(()) } else { Err(format!("System open failed ({result})")) }
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::*;
    #[test]
    fn explorer_receives_an_existing_absolute_directory() {
        let namespaced = std::env::temp_dir().canonicalize().unwrap();
        let argument = explorer_argument(&namespaced).unwrap();
        assert_eq!(std::path::Path::new(&argument).canonicalize().unwrap(), namespaced);
        assert!(explorer_argument(std::path::Path::new(".")).is_err());
        assert!(explorer_argument(&std::env::current_exe().unwrap()).is_err());
    }
    #[test]
    fn shell_paths_remove_only_the_windows_namespace_prefix() {
        for (input,expected) in [(r"\\?\C:\QA\Daten",r"C:\QA\Daten"),
            (r"\\?\UNC\host\QA",r"\\host\QA"),("https://example.com/","https://example.com/")] {
            assert_eq!(String::from_utf16(&shell_target(OsStr::new(input))).unwrap(),expected);
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn open(target: &OsStr) -> Result<(), String> {
    let program = if cfg!(target_os = "macos") { "/usr/bin/open" } else { "xdg-open" };
    std::process::Command::new(program).arg("--").arg(target).spawn().map_err(|e| e.to_string())?;
    Ok(())
}
