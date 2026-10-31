# Tafelraum teacher app

This directory contains the public Tafelraum application. The historical directory name comes from Surface Lab, the original canvas and toolbar prototype.

## Run it

From this directory, use Node 22.18 or newer and run `npm ci`, then `npm start`. Open the loopback URL printed by Vite. The startup command creates the checkout’s own archive under `local-data/public-lessons/`. See the [first lesson](../../docs/GETTING_STARTED.md).

## Source map

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

The `live` checks include shared presentation and Room code. The public edition does not ship a remote participant service or an official desktop updater. For browser tests, install the pinned Playwright browsers with `npm run test:browser:install`, then run `npm run test:browser`. See the [browser test guide](../../scripts/BROWSER_TESTS.md).

The interface supports German and English under **Settings → Language**. Changing language translates app controls while preserving lesson titles, material contents and annotations. UI changes follow the [style guide](../../docs/design/00_UI_UX_STYLEGUIDE.md). Development and public source releases are described in [contributing](../../CONTRIBUTING.md).
