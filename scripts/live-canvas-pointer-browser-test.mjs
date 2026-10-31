#!/usr/bin/env node
// Compatibility entrypoint. D-102 replaced automatic tool/cursor presence with
// deliberate Y/toolbar laser gestures and a Canvas2D overlay. The current suite
// owns those assertions together with clip privacy and preview behavior.
// Start live-canvas-browser-check.mjs --clips; pass a Playwright ESM entrypoint.
await import('./live-canvas-polish-browser-test.mjs');
