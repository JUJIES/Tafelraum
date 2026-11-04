# Run the public source edition on Windows

Use PowerShell with Git and Node.js 22.18 or newer. From a public source checkout:

```powershell
Set-Location prototypes/surface-shell-a-b
npm.cmd ci
npm.cmd start
```

Open the loopback address printed in the terminal. The normal source start creates
`local-data/public-lessons/` inside this checkout. Stop with Ctrl+C, then run the
same start command next time. Keep a copy of that archive before moving or deleting
the checkout. `npm.cmd` explicitly selects npm's Windows command shim when a
PowerShell execution policy prevents the `npm.ps1` shim from running.

The normal `npm.cmd start` now builds the current source and serves the optimised
web app through the same archive server as the packaged app. Allow the build to
finish before opening the address. Stop and restart after source edits; no stale
bundle is reused. For automatic development reload, use `npm.cmd run dev`.
`npm.cmd run start:local` is an alias for the normal optimised start. All modes use
the same checkout-local archive. Bare Vite preview is not the browser-use entry
point. These commands do not build a Windows installer.

This is the browser source edition. It does not install a native Windows app.
Native packaging and the macOS DOCX conversion runtime are separate work; this
browser check does not establish their Windows compatibility. Image, PDF and HTML
material can be used without that DOCX runtime.

## Development checks

From the repository root, run `node scripts/check-distribution.mjs public`. From
the app directory, run `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd test`
and `npm.cmd run test:live`. The main unit-test command runs test files serially
to bound CPU competition on small machines. No assertions or timing budgets are
changed. This does not guarantee the existing marker performance budget: the
Intel N150 Windows check had an earlier 467/467 pass (marker 4.76 seconds), but
the final repeat was 466/467 with only that five-second guard failing at 6.91
seconds. The isolated profiled guard passed at 3.10 seconds. All functional
checks passed; the timing variability remains open. See the
[decision log](implementation/DECISION_LOG.md).

For the actual npm start/restart browser check using an installed Microsoft Edge:

```powershell
npm.cmd run test:source-browser -- msedge
```

The check copies source into its own directory under `output/source-browser-start/`,
copies installed dependencies, creates an empty synthetic archive and uses an
isolated browser profile. Port 5173 must be free. It starts the normal npm command,
inserts native objects and an image, checks archive persistence, stops only its
own npm process tree, restarts, and opens a new browser profile to test restoration
without an IndexedDB fallback. It also opens Room Canvas. Reports, source snapshots
and screenshots remain under that output directory. Run one instance at a time.

The existing agent/HTML workflow can use Edge with
`npm.cmd run test:agent-onboarding -- chromium msedge`. Other browser checks use
the pinned Playwright browsers unless their script documents an explicit path.
See [Browser tests](../scripts/BROWSER_TESTS.md).

Archive backup creation and verification use Windows' System32 `tar.exe`, avoiding
Git for Windows tar's interpretation of `C:` as a remote host. The same bounded
helper ships in the local agent kit. Checksums and restore verification still run.

Synthetic browser checks do not establish physical pen/touch input, an actual
second display, printing, native installer behaviour or a Windows DOCX converter.

The later integrated public working-source check on 2026-11-02 passed 472/472
main tests and 85/85 Room tests, source restart and the expanded Edge agent/HTML
workflow. Its marker stress case took 4.54 seconds; earlier variability is not
thereby resolved. The planned headed real-drawing measurement was stopped before
timed gestures by the desktop tool's Windows browser-URL policy verification.
There are no real-drawing frame/latency measurements from that attempt.

### Follow-up diagnosis, 2026-11-03

The affected Windows Codex chat gained regular in-app browser access after it
was opened directly in the host app's Codex area. With explicit localhost
developer-access approval, four instrumented solo drawing trials ran against
the integrated public source and a synthetic archive. Each saved one valid
native marker. The driver achieved only 5–21 mouse moves/s; observed frame
intervals reached 255 ms and individual geometry calls reached 59 ms. These are
diagnostic frame/CPU observations, not physical pen or input-to-paint latency.

Room comparisons were excluded because opening the popup changed the teacher
viewport and the planned paths could extend outside it. No valid control without
geometry instrumentation was obtained. A separate instrumented 5000-point CPU
probe took 7.29 seconds against the unchanged 5-second budget; this was not a
unit-suite rerun. The three marker implementation files retained identical
before/after hashes. The owned test server was stopped.

Smooth stylus input and Room performance remain unaccepted. Next, measure local
physical input with verified canvas bounds, an idle baseline and a confirmed
uninstrumented control. No marker optimisation or Windows installer follows
from this limited diagnosis.

A subsequent isolated run of the existing unchanged marker unit stress test on
the Beelink, with Node 24.22.1 and no browser instrumentation, passed in 3.30
seconds. This reinforces the need to separate runtime/load/instrumentation
effects from drawing responsiveness; it does not establish smooth rendering.

### Local browser follow-up and Windows save correction

The next Beelink check ran directly on Windows in a fresh headless Edge profile,
at 1440×1000, with verified canvas bounds and Intel ANGLE/D3D11 acceleration.
There was no remote input transport or geometry wrapper. The source-development
server showed drawing stalls for both pen and marker while idle frames stayed
near 16.7 ms. A build served by the existing desktop HTTP server substantially
reduced those stalls. This comparison separates development-build overhead from
marker geometry; it is not a native Windows package test.

A further production-build run generated intermediate pointer moves inside the
page, between real pointer down/up events. These synthetic moves targeted 60 Hz
but achieved only 19–24 Hz for solo marker gestures. Solo marker frame p95/max
was 50/67 ms for a flowing stroke, 67/100 ms for loops and 33/67 ms for dense
overdraw. Thus residual pauses remain; smooth 60 Hz input is not established.
All nine pen/marker/Room-active trials saved one valid native element. With Room
open, teacher-frame pauses increased, but the headless popup produced no rAF
samples: its apparent zero-frame timings are invalid, and no second-display
responsiveness is claimed. At this diagnostic stage, normal source `npm start`
still used development code; the optimised launcher was separate pending work.

The check also reproduced Windows `EPERM` during atomic JSON replacement.
The archive writer now retries only Windows `EPERM`/`EACCES`/`EBUSY` rename
failures, with at most 785 ms of backoff. It never deletes the destination or
repeats/bypasses revision validation. Persistent errors remain visible and do not
acknowledge a save. An actual Windows deny-delete file lock verifies transient
recovery, preservation on persistent failure and continued stale-write rejection.
All 19 focused archive/desktop/private-note tests passed on Windows; macOS passed
18 with the Windows-only case skipped. The final browser series completed without
save failures. Marker implementation hashes were unchanged. No installer,
installation or publication is included.

### Optimised start and Room preview work, 2026-11-04

The normal source start now rebuilds the optimised web app and uses the existing
desktop HTTP/archive server. `npm run dev` retains Vite reload and the same archive.
The real npm start/stop/restart/fresh-profile check passed on macOS Chromium and
Windows Edge, including native objects, image pixels and Room opening. Development
startup remains covered separately. There is no new installer or archive model.

Room now acknowledges each ready canonical scene once, after its existing asset,
HTML and media barriers. Cosmetic ink updates do not repeat focus/scroll restore
or readiness traffic; explicit render retry can acknowledge again. Queued or
asynchronous full projections wait until a teacher stroke finishes or cancels,
while previews continue over the existing ink channel. Dirty work is retained.
Already restored, same-type unbound strokes use native element updates; type,
binding and unnormalised-origin changes retain full restoration. Geometry, point
budgets and the canonical save/undo model are unchanged.

The browser regression requires several real preview patches with zero repeated
scene ACKs/full frames during the held stroke, tests the cancel patch and then
requires a new scene ACK on clip change. Existing withheld-ACK HTML readiness,
bidirectional worksheet state, MP4 and reload checks remain part of acceptance.
The agent reference flow also passed against a fresh production build and the
normal archive server on Mac Chromium and Windows Edge, including kit delivery,
HTML/Room state, media, save failures and reload.
Headless Windows frame samples are diagnostic; Room's own missing rAF samples
cannot establish projector, physical stylus or native WebView responsiveness.

The final fixed-workload check used 180 identical intermediate input points,
confirmed initial Room readiness and waited for the final archive revision to
settle. Both variants saved the same 3254-point Room marker and identical bounds.
Ready messages fell from 128 to 2 while 126 ink patches still arrived. Teacher
frame p95 with Room changed from 200 to 150 ms; the largest pause did not improve
(533 versus 567 ms). This is a limited improvement, not smooth-input acceptance.
The new live-marker/cancel/next-scene regression passed in Chromium, WebKit and
Windows Edge alongside the existing HTML, media, save-failure and reload checks.

### Remaining Room stalls: local workload and paint backpressure, 2026-11-04

The next investigation ran the browser and input driver on Beelink itself, with
the Mac remote-desktop connection closed during the comparisons. Room uses the
local BroadcastChannel; its drawing previews do not travel via the Mac or the
home internet connection. Remote-desktop latency can additionally affect the
remote picture, but does not explain these locally measured frame gaps.

The N150 has four logical cores and about 16 GiB RAM; at least 4.7 GiB remained free
in the instrumented run. Process CPU deltas identified Edge as the largest
measured drawing workload. Node and the tunnel processes were small contributors;
Defender, Codex and Windows added variable background work. The sampling is an
observation, not a controlled server-load benchmark. No background service,
antivirus protection, power setting or installed application was disabled.
The temporarily failing SSH connection recovered without a service restart.

CPU profiles contain substantial marker polygon union, native rough-path/bounds
calculation and garbage collection. Teacher/Room CDP profiles overlap, so they
must not be treated as independent per-window CPU attribution. A separate-tab
diagnostic relieved the teacher but let Room lag; it is not the shipped launch
path and did not justify replacing the window lifecycle.

The targeted public patch instead schedules only cosmetic native viewer updates
on the next animation frame. Received ink deltas still validate and update the
latest complete preview immediately. Painting may coalesce intermediate views;
it never removes input points. A new canonical generation/revision preempts a
queued preview without waiting for that frame. Existing asset/HTML/media barriers,
readiness, cancellation and the final archive/undo flow remain authoritative.

Fresh fixed 180-input comparisons, without CPU profiling during the timed gesture:

| Local Edge diagnostic | Before | After |
| --- | --- | --- |
| Headless, Room: teacher frame p95 / maximum | 117 / 217ms | 83 / 183ms |
| Headless, Room: input workload duration | 17.84s | 14.14s |
| Headed repeat, Room: teacher frame p95 / maximum | 283 / 550ms | 100 / 150ms |
| Headed repeat, Room: input workload duration | 21.95s | 14.26s |
| Solo, frame p95 in both comparisons | 83ms | 83ms |

The final saved 3253-point contour, bounds and paint properties match exactly.
These are diagnostic runs with a hidden/background Room: its own animation-frame
observer produced no samples, even in the headed SSH run. They demonstrate less
wasted background work, not displayed Room FPS or physical stylus latency. The
repeated-run variation also rules out promising a fixed speedup. The teacher
still has about83–100ms p95 gaps under this stress workload; smooth 60 Hz remains
unaccepted. A visible physical second display and native Windows package remain
separate acceptance steps.

88 Room tests passed on Mac and Windows; production builds/typechecking and
Chromium/Windows Edge production and WebKit development reference flows passed.
Local evidence and source
hashes: `output/room-stalls-2026-11-04/`. No installation or publication.

### Second Windows computer, 2026-11-04

The same frozen package and all 342 audited source files were verified on a
second Windows 11 computer: Intel i5-8400, six cores, 15.92 GiB RAM. A locally
verified portable Node 24.22.2 runtime and installed Chrome 156.0.8078.80 were
used; no global runtime replacement or native Tafelraum installation. Lockfile
installation and the optimised production build passed. Only a separate copy of
the measurement driver selected Chrome instead of Beelink's Edge; application,
geometry, sampling and save validation stayed unchanged.

The fixed 180-input workload took 4.79 s solo and 5.03 s with Room; teacher-frame
p95 was 33.4 ms in both. Both markers saved successfully; the Room contour had
3253 points. The corresponding Beelink patch runs took about 12 s solo / 14 s
with Room, with p95 about 83 / 83–100 ms. Hardware, browser and background-load
differences prevent treating this as a controlled CPU-only comparison. These
results support a substantial machine/runtime contribution to the remaining
local stress-case stalls; they do not measure network-picture latency.

Room again produced no animation-frame samples in the automated background run.
The first additional visible-window check was not completed: Computer Use could not
reliably determine the browser URL, and automatic approval review separately
rejected the shell launch of a visible browser as blocked by policy. Neither
restriction was bypassed. Test servers and measurement browsers were stopped.
Visible extended-display/stylus acceptance remains open. The exact package was
transferred privately, without publishing the source or advancing any release
or update channel. Local receipt: `output/room-stalls-2026-11-04/desktop-comparison-result.md`.

#### Visible-window follow-up

The user entered `http://127.0.0.1:5173/` directly in Chrome's address bar and
confirmed that Tafelraum loaded. Claiming that already-open tab through the
supported Chrome extension then worked, without the earlier server-side403 page.
No origin checks, app/browser policies, security settings or application source
were changed. The exact request-header cause of the earlier403 was not captured;
the manual navigation and rebinding establish a working access procedure, not a
general repair of automatic navigation or the previously rejected launch paths.

Teacher and Room were visibly placed side by side. Pen and marker gestures were
performed without and with Room active; their final strokes visibly matched in
both views. All six test elements were confirmed in the stable synthetic archive,
and all342 audited source files remained unchanged. Room was ended and the window
layout restored; the user's Tafelraum tab and isolated local testserver remained
open. Screenshot/report evidence is recorded in the local comparison receipt.

The screenshot sequence did not clearly capture an intermediate state while the
pointer was down. Live-preview progression, perceived smoothness and physical
stylus latency therefore remain unconfirmed. This passes a visible final-state
and save check; it does not establish displayed Room FPS or native Windows app
acceptance. Nothing was published.

The user subsequently reported that their own visible test worked sufficiently
well to continue. This is recorded as subjective functional confirmation; it does
not replace measured live-preview/stylus latency or native acceptance. The next
step is the [local native Windows test plan](WINDOWS_NATIVE_PLAN.md), which records
the remaining packaging/QA-identity blockers and read-only toolchain inventory.
