# Browser tests

From `prototypes/surface-shell-a-b/`, install the app dependencies and the pinned Playwright browsers:

```sh
npm ci
npm run test:browser:install
npm run test:browser
```

The suite uses its own temporary archives, browser profiles and loopback servers. The app’s npm scripts resolve Playwright from the app lockfile. Installing npm packages alone does not download Chromium and WebKit. After changing Playwright versions, reinstall its browsers.

| Check | What it exercises |
| --- | --- |
| `test:storage-material-browser` | Archive writes, the browser cache, lesson switching and material recovery. |
| [Image clipboard](image-clipboard-browser-test.mjs) | Built app, isolated archive and simulated system clipboard. Covers external PNGs, same-lesson paste, cross-lesson asset write failure and retry, and reload without a browser cache. After `npm run build`, run `node scripts/image-clipboard-browser-test.mjs [chromium\|webkit]` from the repository root. |
| `test:hardening-browser` | Public settings, Room presentation, draft recovery and the native save handshake through a simulated bridge. |
| `test:developer-start` | A clean source checkout, explicit development start, Vite dev/preview, lesson/class navigation, material rendering, saving and reload. |
| `test:source-browser` | Real `npm start`, including the production build and normal local archive server, UI objects/image import, full server restart, restoration in a fresh profile and Room Canvas. Rejects a development-client entry page. Optional argument `msedge` or `chrome` selects an installed browser channel; port 5173 must be free. |
| `test:agent-onboarding` | The local agent kit, real command-line tools, material validation, canvas changes and Room input using synthetic lessons. Live marker previews must not repeat canonical readiness ACKs; cancellation and later scene/HTML readiness are exercised. |
| `test:ui-language`, `test:ui-settings`, `test:button-states` | Language switching, settings, keyboard and pointer behaviour, and teacher/Room controls. |
| `test:browser:clips` | Additional clip-number zoom, touch-target and keyboard checks. Run separately when changing clip behaviour. |

Use `npm run test:browser:check` to diagnose missing browsers. The tests write reports under `output/`. Run one instance of a test at a time because individual tests use fixed report directories. The [CI workflow](../.github/workflows/ci.yml) runs the core suite on a macOS runner with Node 24 and retains selected diagnostic files for seven days on failure.

CI also runs `test:source-browser` as a separate step. Locally, that check requires
port 5173 to be free; the core browser suite retains its existing port requirements.

Set `TAFELRAUM_AGENT_BROWSER_PRODUCTION=1` when running `test:agent-onboarding` to
exercise the same reference flow against a fresh production build and the normal
desktop HTTP/archive server, instead of Vite. It writes a separate report under
`output/source-agent-onboarding/`. Invoke it through npm; browser/channel arguments
remain unchanged. The default mode continues to cover development startup.

Specialised media, performance and hardware tests have additional requirements described in their script headers. Results from a browser fixture do not establish physical pen, projector, audio, print or native installer behaviour. Use synthetic data for testing.
