# Contributing to Tafelraum

Use the [README](README.md) to start your own local checkout. Create a branch for your change and use a lesson with invented content when reporting a problem or taking screenshots.

Read [the current architecture](docs/ARCHITECTURE.md) for state ownership and the
teacher/Room/archive/agent boundaries. Use npm and the app's `package-lock.json`
for the documented setup and CI workflow; do not refresh the historical pnpm
lockfile or change package managers incidentally. Cargo uses its own lockfile.

For shared/platform changes, use [the release matrix](docs/RELEASE_MATRIX.md) to
identify the corresponding resource, test, documentation and package updates.

Use `npm run dev` from the app directory for development with automatic reload.
Use `npm start` for an optimised browser-use build with the normal local archive
server. Each start rebuilds the source; both modes keep lessons in the same
checkout-local archive. Neither command packages or installs a desktop app.

From `prototypes/surface-shell-a-b/`, run `npm run typecheck`, `npm test` and `npm run build`. Run `node scripts/check-distribution.mjs public` from the repository root to verify the edition. The [UI style guide](docs/design/00_UI_UX_STYLEGUIDE.md) and [agent workflow](docs/AGENT_WORKFLOW.md) document the shared conventions. The [documentation index](docs/README.md) distinguishes current guides from the original engineering records.

By submitting a contribution, you confirm that you have the rights to offer it under the [project licence](LICENSE). You retain your copyright. Keep third-party attributions with their assets and list new dependencies in the [notices](THIRD_PARTY_NOTICES.md). Contact the maintainer at mail@jujies.app.
