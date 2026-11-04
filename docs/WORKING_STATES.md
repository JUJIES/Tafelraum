# Public development and releases

This checkout is the public source edition. Run `node scripts/check-distribution.mjs public` before building or changing the application. Use `npm start` with a local test lesson. The maintainer’s classroom app and binary update service have a separate release process.

`npm start` rebuilds and serves the optimised browser app through the normal local
archive server. For code iteration with Vite reload, use `npm run dev`. Both use
`local-data/public-lessons/`; this does not change installed-app or release state.

Changes here are made on Git branches and reviewed against this repository’s current main branch. Import shared changes selectively, preserve public contributions and keep public-only documentation and assets. Never merge private history or copy personal archives, deployment credentials or release data into Git.


## Release download contract

A public desktop release includes the app matching the published Git commit,
its GitHub release assets and https://updates.jujies.app/tafelraum-public/download/.
The separate full-edition colleagues channel couples its updater and MDM ZIP.
Local builds do not advance these links. See [release workflow](RELEASE_WORKFLOW.md).
