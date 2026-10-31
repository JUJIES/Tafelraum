# Build a desktop edition

The public sources include the local teacher app and Room Canvas. They do not configure an official JUJIES binary updater or remote participant service.

Start with the browser setup and tests in the repository README. Native packaging additionally needs Rust, Tauri, Xcode tools and the pinned runtime resources. The packaging path has been tested on macOS ARM64. Windows and Linux builds require separate verification.

From the app directory:

```sh
node ../../scripts/check-distribution.mjs public
npm ci
npm run prepare:desktop
cd src-tauri
cargo test --locked --lib
```

`prepare:desktop` builds the web app and prepares Node, LibreOffice and the original runtime licences. Missing LibreOffice resources are obtained from the pinned official source. The recorded bundled Node version is 22.18.0; changing it requires updated matching licence evidence. CI uses Node 24 for its tests.

Use the Tauri CLI to create your own bundle after checking the prerequisites. Test with a separate app identifier, port and archive. Signing, redistribution and operating an update channel are separate decisions. The public repository contains no private publisher or signing keys. See the root `SOURCE_DISTRIBUTION.md` and `THIRD_PARTY_NOTICES.md` before redistributing a build.
