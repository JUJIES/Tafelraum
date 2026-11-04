# Historical native Windows implementation plan

**Historical pre-implementation findings.** The toolchain and adapters described
below have since been implemented. For actual installed/update acceptance and
remaining limits, use [Windows QA](WINDOWS_QA.md); for future releases, use the
[release matrix](RELEASE_MATRIX.md).

2026-11-04. Public source edition only. This is a local development/test plan,
not authorisation to install tooling, replace an app, publish source or release
an installer. Read [working states](WORKING_STATES.md), the
[desktop channel contract](implementation/65_DESKTOP_RELEASE_CHANNELS.md) and
[release workflow](RELEASE_WORKFLOW.md) before implementation.

## Accepted browser baseline

The frozen public source was tested locally on Beelink and a second Windows 11
computer. The second machine verified the package and all342 audited source files,
built the optimised browser app, saved fixed marker workloads and passed a visible
pen/marker final-state/Room/save check. The user subsequently reported that their
own test worked sufficiently well to continue. This is subjective functional
confirmation, not a measured stylus-latency or comprehensive hardware acceptance.
Exact results and remaining limits: [Windows source checks](WINDOWS_SOURCE.md).

Keep the shared teacher canvas, Room protocol, geometry and archive paths. There
is no separate Windows product fork and no reason to change browser rendering
again merely to package the app.

## Read-only readiness check

On the second computer (i5-8400 / Windows 11 Home build26200):

| Requirement | Observed state |
| --- | --- |
| Rust / cargo / rustup / installed targets | Not found in checked locations |
| MSVC C++ build tools | No usable installation found |
| Windows SDK | Not found |
| WebView2 runtime | 156.0.4314.58 present |
| VC++ redistributable | 14.50.35719 present; not a compiler toolchain |

Unregistered tools at unusual paths are not ruled out. No toolchain installation
or native build was performed. Browser/user work was not interrupted.
Official prerequisites: [Tauri Windows setup](https://v2.tauri.app/start/prerequisites/#windows).

## Actual source blockers

- `scripts/prepare-desktop-resources.sh` is zsh/macOS-specific: `ditto`, `lipo`,
  an ARM64 Node binary and macOS Office preparation. It cannot serve as the
  Windows resource builder.
- `src-tauri/tauri.conf.json` selects the macOS `app` bundle. A Windows bundle
  target alone does not prepare the required resources.
- Native startup resolves `runtime/node`, not the Windows `node.exe`. External
  browser links and the data-folder menu invoke `/usr/bin/open` directly.
- Office metadata and preparation only describe macOS DMGs / `LibreOffice.app`.
  DOCX conversion explicitly requires macOS and uses `sandbox-exec`. Running a
  Windows converter without equivalent protection would violate its contract.
- The public build guide requests separate QA identities/archives, but the
  current JS/Rust release validators require the fixed edition identity/port,
  including manual builds. This documentation/code mismatch must be resolved at
  the channel boundary before a separately identified native QA app can start.
  Do not bypass validation or rewrite an official channel catalog to fake QA.

## Smallest maintainable sequence

1. **Explicit isolated test identity.** Resolve the QA identity/port/archive
   requirement in the existing release-validation path. Keep official public and
   colleagues identities fixed. Test builds must have updates disabled and must
   never read or migrate an installed app's archive. Add meaningful JS/Rust checks
   that reject official updater configuration for that isolated test identity.
2. **One resource preparation pipeline.** Move shared web/server/agent-kit copying
   and notices into a cross-platform Node entry point. Keep only binary selection,
   architecture checks and Office preparation in platform adapters. Stage before
   replacing generated output. Preserve Mac resources/behaviour with a comparison
   build; do not introduce a second maintained server-file list.
3. **Windows runtime/native adapters.** Use an explicitly versioned, officially
   checksum-verified x64 Node runtime. Resolve `node.exe` on Windows. Implement
   platform-specific external URL/data-folder opening behind the current validated
   commands, retaining URL allowlists and no user-controlled shell interpolation.
   Room, orderly save-before-exit and child-server shutdown use the shared paths.
4. **Account for DOCX explicitly.** Port the bundled converter, isolation and
   distribution notices before claiming feature parity. An earlier core-only QA
   build may test startup/canvas/Room/archive with the converter explicitly
   unavailable through its existing capability path; that limitation must be
   documented and must not silently become the Windows release specification.
5. **Build and accept locally on Windows.** After tooling is available, freeze
   the candidate, run locked Rust/unit checks and build the manual QA app with
   updates disabled. First test native executable startup, WebView2, links,
   Room, input, autosave/restart and orderly shutdown against its own archive.
   Only then produce/test a local per-user NSIS package; no public updater or
   signing-key access is needed for this local acceptance step.

Windows installer options: [official Tauri guide](https://v2.tauri.app/distribute/windows-installer/).
Building on Windows is preferred to adding a cross-compilation toolchain on the
Mac. Installer creation, installation and public delivery remain distinct steps.

## Acceptance and delivery limits

Require source/profile and resource manifests, meaningful JS/Rust checks,
unchanged Mac startup/resources, Windows native persistence/restart/Room tests,
an explicit Office capability result and the user's visible input check. Browser
acceptance does not establish WebView2/native installer acceptance. Do not claim
the screenshot-only checks measure live-preview latency.

No global tooling install, native QA app or installer has been produced by this
readiness investigation. Existing app/data/update channels remain unchanged.

### Shared resource preparation

The public Mac build now calls `scripts/stage-desktop-common.mjs` for the shared
web assets, server, release identity and agent kit. The destination must be new.
Mac-specific runtime and Office preparation still follow in the Mac script.
A recursive comparison against the former Mac copy steps found identical file
contents. The staged server opened the expected synthetic archive. The Windows
compiler/link test and a packaged WebView2 startup are separate acceptance gates.

The user subsequently authorised toolchain installation on the second Windows
host. Rust/Cargo 1.99.1, Visual Studio Build Tools 2022 17.14.44, MSVC
14.44.35207 and Windows SDK 10.0.26100.0 are installed on D:. A real
`x86_64-pc-windows-msvc` smoke program compiled, linked and ran successfully;
the installer requires no restart. The shared resource step also ran on Windows
and served the built page and its isolated archive.

The native QA executable compiled successfully in the isolated Windows copy.
Native startup exposed a Windows extended-path entry-point issue in the bundled
server; opening Room exposed WebView2's synchronous window-creation deadlock.
The QA copy corrects the entry-point comparison and uses an asynchronous Room
command. That candidate passed native startup, Room pen/marker display, saved
content restoration and normal shutdown of both app and child server.

Opening the data folder then exposed another extended-path incompatibility with
Explorer. The final candidate adds shell-path normalisation and passes all seven
Rust tests, but automatic approval review rejected its relaunch with
`blocked by policy`, without further explanation. Final-candidate relaunch,
external links and the corrected folder-opening behaviour remain unverified.
Four focused JavaScript tests also pass. The portable package,
patch and base-file hashes are saved under `D:\Tafelraum-Windows-QA\`.
Windows-native changes remain in that isolated QA copy pending review and
selective integration; DOCX conversion is unavailable. No regular application
installation or publication has been performed.
