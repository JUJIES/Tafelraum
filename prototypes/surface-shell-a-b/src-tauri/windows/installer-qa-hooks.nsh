; Pinned against Tauri CLI 2.11.4's standard NSIS template/utils.
; Override its process macro so every call (including reinstall) refuses a running app.
!macroundef CheckIfAppIsRunning
!macro CheckIfAppIsRunning executableName productName
  nsis_tauri_utils::FindProcessCurrentUser "${executableName}"
  Pop $R0
  ${If} $R0 != 1
    IfSilent +2
    MessageBox MB_OK|MB_ICONEXCLAMATION "Bitte ${productName} zuerst normal beenden und das Speichern abwarten."
    Abort
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; QA archives survive every uninstall. Normal source/Public installers keep
  ; Tauri's explicit user choice; leaving its checkbox clear retains lessons.
  !if "${BUNDLEID}" == "app.jujies.tafelraum.public.qa.windows.installer"
    StrCpy $DeleteAppDataCheckboxState 0
  !else if "${BUNDLEID}" == "app.jujies.tafelraum.public.qa.windows.update"
    StrCpy $DeleteAppDataCheckboxState 0
  !endif
!macroend


