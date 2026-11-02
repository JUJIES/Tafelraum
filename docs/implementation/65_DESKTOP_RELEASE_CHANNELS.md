# Desktop release channels and download operations

2026-11-02. Public and full are product profiles. Manual, public and colleagues
are desktop delivery channels. A source checkout is not an installed desktop app.

## Fixed boundaries

| Product profile | Default desktop build | Official release build |
| --- | --- | --- |
| personal | colleagues updater, existing identifier/port/archive | same colleagues channel |
| public | manual updates | public updater, enabled by tauri.public-release.conf.json |

The public source includes the complete shared updater implementation and a
reviewable official-build configuration. Self-built public apps do not contact
an official updater unless deliberately built with that configuration. Browser
source use remains npm start / git pull; a source ZIP does not install an app.

`distribution/desktop-channels.json` binds each official lane to one identifier,
loopback port, HTTPS update endpoint and public signature key. The native host
validates the effective compiled Tauri config before startup. Address/key/identity
mismatches fail closed. The UI learns delivery from native overview IPC, never
from a lesson, browser preference or the public feature profile alone.

Personal keeps app.jujies.tafelraum, port49317 and its current archive/key/endpoint.
Public uses app.jujies.tafelraum.public and port49318, including Room URLs and
native capabilities. Its archive is separate. No silent copying of full-edition
archives, credentials, browser drafts or service configuration. Public0.1.88 used
the old identity; its guide requires a deliberate migration if that archive holds
lessons. Original data are never removed by installing the new public app.

## Release integrity

The resource build writes desktop-release.json from the same Tauri config used
for compilation. It records profile, channel, identity, version and source commit;
the signed bundle and ZIP packager validate it. Official public releases require
a clean published commit, exact source tag, separate signing key, ZIP/guide,
updater archive/signature, download.json and Tauri latest.json. Secrets stay in
the maintainer's external encrypted key file and macOS Keychain, never Git.

The public updater checks GitHub Releases/latest/download/latest.json. Large
public ZIP/update files are served by GitHub. Beelink holds stable landing pages,
small manifests/guides and fixed redirects for historical public file links.
Public links must identify the exact repository/tag/filename: no open redirects.
The colleagues updater and MDM download continue to use their existing Beelink
channel. A local full-edition installation does not advance either release.

Both official channels share startup/background checks, confirmation, signature
verification, presentation deferral and the canonical flush-before-install path.
Do not implement a second installer or bypass a failed save. An unavailable
update server leaves the app usable. No automatic switch between editions.

## Operational protection and statistics

Download service exposes only a dedicated artifact root with GET/HEAD, directory
listing disabled, loopback listener, no public admin/upload API and hidden staging
paths. Logs are size/age bounded; private reports aggregate bytes, status codes
and package requests. Origin bytes are not total visitor bytes when Cloudflare
serves cached files. GitHub asset download_count is a separate source, not a count
of unique people or successful installations. HEAD/latest polling and our release
verification are not user installations.

Cloudflare rules must be limited to the update hostname and tolerate school NAT,
resumes and retries. Never put a browser CAPTCHA in front of native updater URLs.
Audit actual rule activation separately; unavailable dashboard access is not an
active rate limiter. Emergency binary-download pause must retain manifests/pages
and must not alter other products hosted on the same service.

## Checks

- desktop-release-config.test.mjs: manual/official builds, wrong key/URL/identity.
- Rust desktop_release tests: same native channel boundaries.
- desktop-update-channels-browser-test.mjs: both official channels and manual,
  once-per-version hints and presentation deferral in Chromium/WebKit.
- Clean official public build: native overview, separate origin/archive, signed
  package and real update from a disposable previous-version probe.
- After publication: exact Git commit/tag, asset digests, HTTPS ZIP/update/signature,
  stable redirects and unchanged colleagues manifest. Record actual results in09.

[Release workflow](../RELEASE_WORKFLOW.md) remains the delivery checklist.
