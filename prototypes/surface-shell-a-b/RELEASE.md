# Build a public desktop app

Official downloads: [Public Mac app](https://updates.jujies.app/tafelraum-public/download/)
· [GitHub releases](https://github.com/JUJIES/Tafelraum/releases/latest).
Each package includes the English installation guide. The public edition has
no colleagues updater or personal integrations. Room Canvas remains included.

For browser setup and tests, start with CONTRIBUTING.md at the repository root.
The verified native target is macOS / Apple Silicon. Windows, Linux and Intel
packages require separate validation. Native builds additionally require Rust,
Xcode tools and pinned runtimes. The Mac builder fetches checksum-verified
Node22 LTS independently of the host's PATH. Platform pins and licence evidence
are described in [the release matrix](../../docs/RELEASE_MATRIX.md).

From the app directory:

```sh
node ../../scripts/check-distribution.mjs
npm ci
npm run prepare:desktop
cd src-tauri
cargo test --locked --lib
cd ..
npm exec -- tauri build --target aarch64-apple-darwin --bundles app
```

`prepare:desktop` builds the web app and prepares Node and LibreOffice with their
original licenses. It does not need personal credentials. Test native builds with
a separate app identifier, port and temporary archive; never use a live teaching
archive as the test target. A custom build is not an official JUJIES release.

For a reproducible manual ZIP, start from a clean committed public checkout.
From the repository root:

```sh
node scripts/package-desktop-download.mjs "/absolute/path/Tafelraum Public.app" /absolute/path/new-release-directory VERSION PUBLIC_COMMIT_SHA
node scripts/verify-desktop-download.mjs /absolute/path/new-release-directory public VERSION
```

Replace the example version and SHA with that exact source release. The packager
checks source cleanliness, embedded public profile, app version, ARM64 binary and
codesign. It includes the English guide and writes download.json with hashes.
This step creates local files only. Official GitHub/Beelink publication is a
separate maintainer action under docs/RELEASE_WORKFLOW.md. Signing and notarization
are separate concerns; an ad-hoc signature does not provide Apple notarization.


## Official Public Mac packages

Default source builds have manual updates. Official public packages use
`npm exec -- tauri build --config src-tauri/tauri.public-release.conf.json --bundles app --target aarch64-apple-darwin`.
Final updater artifacts require the official private signing key, which is not
distributed. Build hosts may explicitly use `--no-sign` and transfer the unchanged
artifact for separate signing/verification; such output is a candidate, not a
complete official release. See [the coordinated release workflow](../../docs/RELEASE_MATRIX.md).
The public key and channel configuration are in the repository for review.
The official bundle is Tafelraum Public.app; it uses a separate archive and
port49318. Read the included installation guide before migrating from0.1.88.
