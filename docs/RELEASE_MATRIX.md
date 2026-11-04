# Keeping source, desktop packages and updates aligned

This public Mac/Windows checklist complements the [release workflow](RELEASE_WORKFLOW.md).
Until installer and real-update acceptance pass, Windows remains a candidate.
Never move the stable feed to a partial or unaccepted release.

## One source release, two platform builds

Each app-changing public release has one version and one exact clean Git commit
for Mac Apple Silicon and Windows x64. Build both from that commit. Native
adapters and runtime binaries differ; the product source stays shared. If either
required platform fails, fix/rebuild or defer publication. Do not announce a new
shared version while retaining old Mac bytes. Independently advancing platform
versions would require a deliberate change to the manifest/version contract.

Colleagues/full edition remains a separate release decision, source profile,
archive identity and signing channel. A public release never advances it. Review
shared fixes for applicability there; record deferred synchronisation explicitly.
Never copy private integrations/history into Public or infer source equality
from matching version numbers.

## Corresponding updates

| Change | Required work |
| --- | --- |
| Common app/runtime | Relevant regression tests; Mac and Windows build/runtime checks; both packages for an app release |
| Version | App `package.json`, root/app entries in `package-lock.json`, Tauri config, own Cargo package in `Cargo.toml`/`Cargo.lock`, versioned release notes |
| Server/agent/material resource | Shared `stage-desktop-common.mjs`, kit/runtime notices as applicable; verify files in both packaged outputs |
| Platform adapter | Targeted native check and other-platform regression check; document capability differences |
| Storage/import | Saved-data compatibility, Room commands/projection, save/restart and backup implications |
| Installer/updater | First install, preserved archive, orderly exit, actual previous-to-candidate update and rejected bad signature using isolated QA identity |
| User-facing setup/capability | README, first lesson, data guide and platform installation guide as applicable; release notes |
| Shared canvas/Room code used by the hosted demo | Review demo applicability, run its constrained demo/Room checks, then deliberately deploy it or record its older source and the reason for deferral |
| Docs only | Links/content checks; no implicit rebuild/relabel of an unchanged binary |

Main may contain newer documentation than the latest desktop build. Keep the
desktop source commit identifiable. Preserve historical migration versions.

`node scripts/check-public-versions.mjs` checks the source version surfaces and
release notes. Its regression checks run in both Mac and Windows CI. Both CI jobs run the
complete shared unit suite. Directory-link tests use Windows junctions; only
file-link subtests may skip after an actual Windows EPERM capability failure,
with the missing coverage reported explicitly. Never skip other assertions in
their parent tests or enable system-wide link privileges just to obtain green tests.

## Acceptance and release set

1. Select/review changes against current public main, preserving unrelated work.
   Check profile, types, tests and synthetic browser flows on Mac/Windows. npm is
   the documented JavaScript workflow; native checks use locked Cargo dependencies.
2. Freeze version/source. Both build receipts identify commit, profile, platform,
   runtime version and hashes. No productive archive, key or private configuration
   enters a package. Use separate QA identities/archives for native/install/update
   tests. State hardware/OS and missing stylus, offline or fresh-machine checks.
3. Official packages use Public identity/key/endpoint, never QA or colleagues.
   Private signing keys stay on the signing host. Verify signatures against the
   embedded public key. Tauri signatures do not establish Apple notarization or
   Windows Authenticode/SmartScreen reputation; state actual signing status.
4. Stage a complete GitHub draft with the following files:

| File | Role |
| --- | --- |
| `download.json` | Existing Mac metadata retained for compatibility |
| `windows-download.json` | Windows metadata for the same version/commit |
| `INSTALLATIONSANLEITUNG.txt`, `WINDOWS-INSTALLATION.txt` | Separate English platform guides |
| Versioned Mac ZIP, Windows `-setup.exe` | Direct downloads |
| Mac `.app.tar.gz`, Windows installer, both `.sig` files | Update artifacts |
| `latest.json` | Both `darwin-aarch64` and `windows-x86_64` targets |

Run `node scripts/public-release-set.mjs RELEASE_DIRECTORY VERSION SOURCE_COMMIT`.
It rejects missing platforms, mixed version/source/channel, unsafe filenames,
hash/guide drift and inconsistent updater links/signatures. This complements
cryptographic verification (`verify_update` with platform argument) and actual
install/update tests; it does not replace them.

The manually dispatched `Windows release candidate` GitHub workflow builds the
exact selected branch commit using locked dependencies and `--no-sign`. It uploads
only installer, guide and `windows-build.json`, and publishes no release. Download
that artifact on the maintainer host; `assemble-public-release.mjs` there validates
its commit/version/hashes, signs the unchanged installer with the Public key and
combines it with the matching Mac artifacts. Private signing keys never enter
Windows or Actions. A candidate artifact is not a native acceptance receipt.

Bundled Node pins are explicit per platform in `scripts/desktop-node-runtime.json`.
Mac retains the Node22 LTS line compatible with the app's macOS12 minimum;
Windows uses Node24 LTS. These runtime versions are deliberately different, not
separate application source versions. Verify vendor checksums and complete
licences on every pin change. The Mac builder checks the actual Mach-O minimum
against the declared app minimum; Node24's macOS13.5 requirement must not silently
exclude existing Macs. Re-run native/material/save tests after a runtime change.

The maintainer publisher requires and verifies the complete two-platform set. Upload immutable assets, verify their bytes, then publish the
GitHub release and corresponding Beelink download metadata/pages. Preserve both
update targets; never replace the shared feed with a Windows-only manifest.
Download pages must expose both choices and their exact guides.

After publication, download and verify both platform artifacts, signatures,
stable update targets, source/tag and download choices. Confirm the colleagues
manifest is unchanged. Record a publication receipt and open limits; retain
rollback artifacts. Source push, successful build or draft upload alone is not
release completion.

## Deliberately independent states

Track source commit and actual deployment separately for the hosted read-only
demo, local development previews, installed apps and the full-edition colleagues
channel. Do not redeploy them merely because Public advances. For each shared
fix, record applied / not applicable / pending with its target source. Embedded
agent kits and server resources are regenerated as part of both desktop builds;
they must not be updated independently inside an already released package.
