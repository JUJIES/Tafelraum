# Desktop app and local development

Tafelraum uses Tauri, React, Excalidraw and a local Node service. In a desktop installation, lessons live in the user profile outside the app bundle. Replacing a program and changing a lesson archive are separate operations.

For a local browser checkout, follow the [project README](../../README.md). The native packaging path has been tested on macOS with Apple Silicon. Other platforms require their own runtime and packaging checks. A native test build needs a separate identifier, port and archive. Signing keys and personal configuration stay outside Git.

This public edition includes Room Canvas. It has no official JUJIES binary update channel or remote participant service. See the [desktop build guide](../../prototypes/surface-shell-a-b/RELEASE.md) and [distribution scope](../../SOURCE_DISTRIBUTION.md).
