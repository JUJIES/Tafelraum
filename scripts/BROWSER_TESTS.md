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
| `test:hardening-browser` | Public settings, Room presentation, draft recovery and the native save handshake through a simulated bridge. |
| `test:developer-start` | A clean source checkout, the documented start command, lesson and class navigation, material rendering, saving and reload. |
| `test:agent-onboarding` | The local agent kit, real command-line tools, material validation, canvas changes and Room input using synthetic lessons. |
| `test:ui-language`, `test:ui-settings`, `test:button-states` | Language switching, settings, keyboard and pointer behaviour, and teacher/Room controls. |
| `test:browser:clips` | Additional clip-number zoom, touch-target and keyboard checks. Run separately when changing clip behaviour. |

Use `npm run test:browser:check` to diagnose missing browsers. The tests write reports under `output/`. Run one instance of a test at a time because individual tests use fixed report directories. The [CI workflow](../.github/workflows/ci.yml) runs the core suite on a macOS runner with Node 24 and retains selected diagnostic files for seven days on failure.

Specialised media, performance and hardware tests have additional requirements described in their script headers. Results from a browser fixture do not establish physical pen, projector, audio, print or native installer behaviour. Use synthetic data for testing.
