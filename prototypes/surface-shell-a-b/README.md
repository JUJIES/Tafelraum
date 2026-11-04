# Tafelraum teacher app

This directory contains the public Tafelraum application. The historical directory name comes from Surface Lab, the original canvas and toolbar prototype.

## Run it

From this directory, use Node 22.18 or newer and run `npm ci`, then `npm start`.
Open the loopback URL printed by the local server. `npm start` builds the browser
app and serves it with the archive APIs; use `npm run dev` for Vite reload during
development. Both use `local-data/public-lessons/` at the repository root.
See [your first lesson](../../docs/GETTING_STARTED.md) and
[data and backups](../../docs/DATA_AND_PRIVACY.md).

## Source map

Start with the [current architecture](../../docs/ARCHITECTURE.md) for state
ownership, persistence and the boundaries between teacher, Room and agent.

- `src/App.tsx` hosts lesson navigation, settings, tools and presentation controls.
- `src/canvas/` implements drawing, material projections and the canvas operations used by agents.
- `src/live/` includes the local Room window, input handling and presentation clips. The presence of shared projection code does not enable the remote service.
- `desktop-server.mjs` and `archive-server.mjs` serve the local archive. `src-tauri/` contains the native host.
- `distribution.json` declares the edition. Verify it with `node ../../scripts/check-distribution.mjs public`.

## Check a change

```sh
npm run typecheck
npm test
npm run typecheck:live
npm run test:live
npm run build
```

The `live` checks include shared presentation and Room code. The public edition
does not enable the separate Remote Canvas service. Source/self-built desktop
apps default to manual updates; official Public Mac packages use the separate
public GitHub updater. See [release channels](../../docs/implementation/65_DESKTOP_RELEASE_CHANNELS.md).
For browser tests, install the pinned Playwright browsers with
`npm run test:browser:install`, then run `npm run test:browser`.
See the [browser test guide](../../scripts/BROWSER_TESTS.md).

The interface supports German and English under **Settings → Language**. Changing language translates app controls while preserving lesson titles, material contents and annotations. UI changes follow the [style guide](../../docs/design/00_UI_UX_STYLEGUIDE.md). Development and public source releases are described in [contributing](../../CONTRIBUTING.md).
