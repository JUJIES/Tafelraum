# Tafelraum release and download workflow

2026-11-02. This is a release contract, not permission to publish a working tree.
An explicit colleagues-update or public-release request includes all corresponding
downloads below. A local build/install never advances a public pointer.

## Two editions, three delivery surfaces

| Edition | Source | Distribution |
| --- | --- | --- |
| Colleagues / MDM | Approved personal/full edition, identical to the locally tested signed bundle | Automatic updater AND manual ZIP on Beelink |
| Public | Clean, published public Git commit | Git source/tag + GitHub release package AND public manual ZIP on Beelink |

MDM is the full edition with a school-specific German installation guide, not
a third source fork. Public uses its own English guide and its own GitHub updater in official Mac
packages; source builds default to manual updates. It never consumes the
colleagues updater. Both ZIPs include Tafelraum.app and their installation guide.
Currently supported download target: macOS / Apple Silicon. Ad-hoc signing is
not Apple notarization. No Windows or Intel package is implied.

Fixed links:

- Colleagues: https://updates.jujies.app/tafelraum/download/
- Public: https://updates.jujies.app/tafelraum-public/download/
- Public Git releases: https://github.com/JUJIES/Tafelraum/releases/latest

The corresponding /releases/ pages retain older versioned packages.

Machine-readable channel definitions: scripts/downloads/release-policy.json.
The shared packager validates the embedded distribution profile, app version,
ARM64 binary and codesign, includes the correct guide, rejects private runtime
files and verifies the extracted ZIP. download.json binds version, edition,
filename, ZIP hash/size, guide hash and (for Public) the source commit.

## Colleagues release

1. Freeze and test the personal source. Build/sign the app with the normal
   release:mac script. It must create the MDM ZIP and download.json.
2. Install and verify that exact signed bundle locally. Keep the installation
   receipt and rollback copy required by WORKING_STATES and desktop protocol09.
3. On an authorized colleagues update, use the frozen build's publish-update.sh.
   It requires the updater archive/signature, latest.json, MDM ZIP, download.json
   and guide. It extracts both packages and compares their signed bundle identity
   with the verified local installation. Missing or mismatched files block publication.
4. The Beelink publisher validates hashes and profile/version, installs immutable
   versioned files, then advances latest.json. The download page follows that
   SAME updater manifest, so no separate manual-download latest can drift.
5. Verify the public updater archive/signature AND manually downloadable ZIP.
   A release is incomplete until both checks pass and the receipt is recorded.

A newer local app can legitimately precede the colleagues channel. Do not
silently publish it just to refresh a download page.

## Public Git release

1. Review/test the public source and release version. Commit/push the intended
   public source as explicitly authorized, preserving existing public content.
   Build from a clean checkout of that exact published commit.
2. Build the official public native bundle using tauri.public-release.conf.json,
   with its separate public updater and no personal integrations. Package it with scripts/package-desktop-download.mjs and the
   exact source commit. Do not rename a full-edition bundle to claim Public.
3. The maintainer's scripts/publish-public-desktop.mjs SOURCE RELEASE_DIRECTORY
   performs a read-only preflight. Add --publish only on an authorized release.
   It checks the published main commit and stages a GitHub draft release.
4. Upload the versioned ZIP, guide, download manifest, signed update archive,
   signature and Tauri latest.json. Existing assets are
   immutable: a retry must match their GitHub SHA-256 digests and source commit.
   Publish the GitHub release, then publish small metadata/guides on Beelink.
   Public binary downloads use GitHub; historical Beelink binary links redirect
   to the matching GitHub asset.
5. Verify the public download, guide, hashes and source commit. Record both URLs.
   Neither a source push alone nor a successful app build completes this flow.

Official server/colleagues publishers remain in the maintainer workspace;
public users need neither Beelink access nor signing credentials. Public source
can contain uncommitted development work; it must not leak into a tagged app.
Bump the release version for changed app bytes. A docs-only commit need not
silently republish an unchanged app; identify the current source release clearly.

## Server and recovery

scripts/beelink/Publish-TafelraumRelease.ps1 serves only the two Tafelraum
channels. It validates staged files, rejects different bytes under an existing
version and rejects a downgrade of latest. It never writes lesson archives.
The existing update HTTP service remains read-only; no upload endpoint or
directory browsing is exposed.

scripts/beelink/Deploy-TafelraumDownloads.ps1 installs the static download pages
and publisher. Changing those pages does not advance either version pointer.
The pages use a fresh manifest request and refuse mismatched editions/versions.

If publication stops between GitHub and Beelink, report it as incomplete and
resume the same verified version. Do not invent another version or overwrite
different files to hide the partial state. Preserve successful asset uploads.
Each channel's completion requires a download-publication-proof.json receipt.

## Initial activation

The initial MDM download reuses the already released 0.1.90 app unchanged; its
ZIP now includes the MDM guide. It does not publish the locally installed0.1.92.
The initial Public download is0.1.88, from published public Git commit
e9db7f8a562bebdeb8a210a58dddee67463e1ac0. Separate local agent/Room changes are not
part of that published Git version. Receipts live under output/download-workflow/
and output/public-desktop-first/ on the maintainer machine.


Official public channel rules and native identity: [contract65](implementation/65_DESKTOP_RELEASE_CHANNELS.md).
The maintainer uses scripts/build-public-release.mjs SOURCE NEW_RELEASE_DIRECTORY
for a clean signed build, then scripts/publish-public-desktop.mjs for publication.
Public download counts come from GitHub asset statistics; Beelink logs cover only
origin traffic and cannot count all cache hits.
