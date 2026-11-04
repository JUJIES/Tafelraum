# Windows builds and isolated QA

The public source builds a per-user x64 NSIS installer on Windows. From `prototypes/surface-shell-a-b`, install the locked npm dependencies and run:

```powershell
npm.cmd ci
npm.cmd run tauri -- build
```

Prerequisites are Node/npm for the build, Rust stable with the `x86_64-pc-windows-msvc` target, MSVC Desktop C++ Build Tools, Windows SDK and WebView2. Tauri may download verified NSIS tools into its local build cache. This does not install build tools system-wide. The installer uses the installed Evergreen WebView2 runtime; when absent, its bootstrapper requires internet access and may invoke Microsoft's runtime installer.

`tauri.windows.conf.json` is selected automatically by Tauri. It chooses the Windows resource adapter, current-user NSIS installation and the Public loopback capability on port49318. A normal source build has manual updates. The shared server/agent-kit selection remains in `scripts/stage-desktop-common.mjs`; the Mac preparation path is unchanged.

## Reproducible Windows resources

`scripts/stage-windows-desktop.mjs` runs the full `npm run build`, including type and license checks, before staging. It obtains Node v24.22.2 x64 from the exact official URL in `scripts/desktop-node-runtime.json`, entry `win32-x64`. The archive checksum is pinned from the official SHASUMS256 file. Archive, node.exe and the original complete LICENSE are checked before use; a corrupted cache is rejected. Only node.exe and LICENSE are bundled. `runtime/windows-runtime.json` records provenance and Windows Office limitations.

Set `TAFELRAUM_WINDOWS_NODE_CACHE` to choose a local download cache. No system Node installation is needed by the packaged app. Existing generated resources are replaced only after a new stage succeeds, only at the selected known app resource directory, and only with a matching delivery-identity marker. Mac or another identity's resources are preserved. Tauri JSON merge-patch null entries explicitly remove inherited resource mappings so a QA bundle cannot accidentally include another channel's resource tree.

## Isolated local candidates

Use invented lessons only. Each test identity has its own AppData archive and its own origin:

| Override | Identity suffix | Port | Updater |
| --- | --- | --- | --- |
| tauri.windows-qa.conf.json | .qa.windows |49319| disabled, portable |
| tauri.windows-installer-qa.conf.json | .qa.windows.installer |49320| disabled, per-user NSIS |
| tauri.windows-update-qa.conf.json | .qa.windows.update |49321| disposable local QA only |

```powershell
npm.cmd run tauri -- build --config src-tauri/tauri.windows-qa.conf.json --no-bundle
npm.cmd run tauri -- build --config src-tauri/tauri.windows-installer-qa.conf.json
```

For a portable test folder, place the release executable beside the generated `desktop-resources`. Installer candidates use distinct product, binary and Start Menu names. The NSIS hook refuses replacement while that user's target app is running; close normally and wait for save completion. QA uninstallation retains the archive. The normal manual/Public installer retains Tauri's explicit checkbox choice; leave Delete app data unchecked to keep lessons. Never copy a productive archive into a test identity.

The update-QA configuration requires `http://127.0.0.1:49322/latest.json`, a disposable key different from both production public keys, passive current-user NSIS, the dedicated QA identity and port, and explicit loopback metadata. Generate a throwaway key outside the repository and replace the example public key in this QA configuration for a fresh test. Private keys never belong in source, logs, patches or transfer packages. Serve only the test manifest, signature and QA installer on loopback. Exercise rejection of an invalid signature before a real two-version transition. Native runtime and build validation reject other endpoints and production keys for this lane. Portable and installer QA cannot inherit it.

Tauri's generated runtime context intentionally omits bundler-only fields such as targets and NSIS options. Those constraints are enforced before staging; native validation checks the retained runtime identity, channel and origin. The Rust regression test uses the actual `generate_context!()` result in addition to raw configuration fixtures.

On Windows, the updater performs the existing canonical persistence flush, stops and waits for its owned local server in its pre-exit hook, then hands off through Tauri's standard updater. It preserves the UI/resources until installer launch succeeds, so a failed launch can restart its own server and release the persistence lock. No second installer implementation or delay-based process workaround is used.

## Official signing handoff

Only an explicit `tauri.public-release.conf.json` override enables the official Public key/endpoint and updater artifacts. Keep all official validation enabled. With pinned Tauri CLI2.11.4, `--no-sign` skips both platform code signing and updater signing while preserving the compiled updater configuration and `createUpdaterArtifacts:true`:

```powershell
npm.cmd run tauri -- build --config src-tauri/tauri.public-release.conf.json --no-sign
```

This command is a build/signing handoff, not release completion. Transfer the exact installer, source commit/version and SHA256 receipt for signing on the maintainer's Mac with `tauri signer sign`. The final signature must verify against the embedded Public key. Do not publish an unsigned updater artifact or use the colleagues key/endpoint. Authenticode publisher signing and updater signatures serve different purposes. A build without an Authenticode certificate has no verified Windows publisher identity.

Source evidence: [Tauri CLI2.11.4 bundle/signing implementation](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.4/crates/tauri-cli/src/bundle.rs), [Tauri updater guide](https://v2.tauri.app/plugin/updater/), [Node v24.22.2 checksums](https://nodejs.org/dist/v24.22.2/SHASUMS256.txt).

## Test limits

Launch native QA from Explorer for archive persistence checks. On this host, Codex-child launches can see a virtualized Windows package AppData catalog under the same logical path; document the start route and active lesson. The installed Agent Kit must be tested from the path reported by `/api/agent-kit` with its embedded Node, including status, sessions and one explicitly chosen synthetic lesson. Namespace-path CLI regression tests cover silent entry-point skips.

Bundled Office/DOCX conversion is unavailable on Windows and retains its explicit platform message. Optional image enhancement depends on a separately available Python runtime. A physical pen, printer, multiple displays/DPI and a clean Windows machine require later hardware/praxis acceptance. A local candidate is not a published or fully accepted Windows release.


## Local acceptance on 4 November 2026

Windows11 x64/WebView2 tests used invented lessons. Portable native Room, pen/marker,
materials and save/restart checks passed. Per-user NSIS install/start/restart and
GUI uninstall retained the archive. The installed Agent Kit created/opened a test
lesson and imported a PNG through the local API. A genuine signed QA update from
0.1.91 to0.1.92 restarted the app with identical board, material index and PNG bytes.
A bad signature was rejected; failed installer execution restarted the owned local
server without losing the saved lesson. These are isolated QA results, not proof
that a later official installer is accepted. That exact common-source artifact
requires its own final native smoke test and release receipt.

An optional silent reinstall while running was blocked by automatic review before
execution. Running-instance refusal has source/compile coverage; that extra native
negative case remains open. Clean-machine/WebView2 bootstrap, physical devices
and school deployment are outside this acceptance.


## Common-source Public0.1.92 acceptance

The official Windows x64 NSIS candidate was built by GitHub Actions from clean
commit `c370dbba60a3d14989a41bc572e0d9caa9934b15`, the same source as the Mac
package. Installer: `Tafelraum-Public-0.1.92-Windows-x64-setup.exe`,
50,977,961 bytes, SHA256
`2e7939a89660af394d3c4f2f72784708d3614b3518989bf18be472f6bbb66def`.
Both full source CI jobs and11 compiled Windows native tests passed. The Windows
CI ran488 unit tests successfully, with one Mac-specific test skipped; file-link
protection executed there, including the cases unavailable on the local QA account.

The exact CI installer was installed per-user on a Windows11 x64 desktop with
no previous Public installation/archive. Explorer startup, native About version,
embedded source receipt and pinned Node matched. Tests used invented lessons: pen
and marker, PNG/PDF, WAV/AVC playback, a local HTML worksheet, clips, Room input
reaching the canonical teacher scene, data-folder opening, installed Agent Kit
(the121 files matched its manifest), Ctrl+Z/Redo, clipboard text and filenames
with spaces/umlauts. Quit with Room open ended both windows and the owned server;
Explorer restart preserved10 objects, two clips, materials and the HTML answer.
Three further native restarts confirmed the marker was visible immediately and
after waiting/zoom comparison. The earlier report of an invisible marker was
withdrawn after checking the original screenshots; no code workaround was added.

The installer bytes were then signed on the Mac for the Public updater and both
platform signatures were cryptographically verified against the embedded Public
key. This signing does not change the EXE or provide Authenticode. The real
two-version Windows update/invalid-signature/failed-launch tests above used the
separate disposable QA lane; there is no previous official Windows release to
claim as an official production upgrade. The tested Public app remains installed
and was closed normally. The HTML file-based installer in a packaged assistant's
virtualized AppData context was not separately accepted; the final HTML fixture
was validated then added through Explorer. [Agent context notes](AGENT_WORKFLOW.md#windows-agent-execution-context)
explain that boundary. Hardware, clean-machine and DOCX limits above remain.
