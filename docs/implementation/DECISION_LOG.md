# Public edition decisions

The public repository starts with an independently reviewed source snapshot. The local teacher canvas, Room Canvas, archive and agent kit are included. The [README](../../README.md) describes how to run this edition.

## Public documentation language

English is the working language for public guides. The [documentation index](../README.md) directs teachers and contributors to the English entry points. Detailed German implementation records keep stable paths, and teaching examples retain their classroom language.


## 2026-11-02 – separate official public and colleagues delivery

Public source contains the shared updater; its default build remains manual.
Official public Mac releases enable an independently signed GitHub update lane.
Public app identity/port/archive are separate from the unchanged colleagues lane.
Large public files are served by GitHub; fixed Beelink links remain entry points.
No silent full-archive migration or cross-edition updates. Operational rules and
verification contract: [65](65_DESKTOP_RELEASE_CHANNELS.md).


Native release follow-up: Public0.1.90 aligns the older public updater with
the full edition's shared confirmation, cached Update object and six-hour
background check. Public0.1.89 remains immutable. No unrelated canvas/agent
working changes are included.


## 2026-11-03 – smaller desktop package 0.1.91

Release based on the previous delivered edition, adding only pinned headless
Office resource selection, ZIP metadata/compression improvements and release
metadata. DOCX conversion code, fonts, dictionaries, archive format and updater
identity/key/endpoint remain unchanged. Verification: DOCX contract39.

## 2026-11-03 – Bound public canvas shadow rasterisation to the viewport

Safari/WebKit zoom stalls were isolated to the native shape SVG shadows, including with HTML, video and clip layers removed. The old -100%/300% filter region scaled with the entire zoomed shape. Shadow filters now use screen-space user units, intersect the rotated viewport with the shape, and retain 48px blur/offset support. Invisible shadows allocate no filter. No scene/persistence/agent/export format or new dependency. Four geometry tests, public typecheck/build, preview Room/reset tests and comparative WebKit/Chromium zoom measurements cover the change. This is a public source/hosted-preview correction; no native package or colleagues update is implied.

The direct worksheet-centred WebKit check showed that filter bounds alone were insufficient: SVG SourceAlpha still rasterised the oversized rectangle. Rectangle shadows now use the existing material CSS box-shadow path with matching blur/offset/opacity and rotation; ellipse/diamond shadows retain the bounded SVG path. The renderer test moves the pointer onto the worksheet before zooming, checks native card shadows and permits no filter when shadows are entirely offscreen. On the same 36-step Retina WebKit run, elapsed frame time fell from about9.3s to0.59s, with steady frames16–17ms. No global canvas prototype patches, browser sniffing, hidden materials or persistent changes.


## 2026-11-04 – open the hosted lesson directly

The README’s main live-demo link opens `/?lesson=volcanoes` directly. The lesson guide remains optional inside the preview. This removes the extra entry step without changing demo state, material permissions or desktop releases.


## 2026-11-04 – audit all public demo entry links

The examples overview and its documentation template now use the same direct
`/?lesson=volcanoes` entry as the README. A repository-wide text audit found no
other public documentation links to the intermediate guide. The in-demo
Lesson guide remains optional help, not a demo entry point. No app build changed.


## Public Mac/Windows integration — 2026-11-04

One public source and app version now cover macOS Apple Silicon and Windows x64.
Native resource staging shares server/Agent Kit selection; platform adapters own
runtime, window/file opening and packaging. Windows remains without the guarded
macOS DOCX converter. No alternate archive or Room data model was introduced.

The optimised browser start uses the normal archive server; development reload
remains separate. Room coalesces cosmetic work and avoids canonical projection
during unfinished ink gestures; final canonical state and acknowledgements stay
authoritative. Windows namespace paths and bounded atomic-write retries preserve
the existing persistence contract.

Official Windows updates use the existing signed Public channel, with an explicit
owned-server handoff and recovery if installer execution fails. Disposable local
QA identities verified installation, preserved archive, real two-version update,
bad-signature rejection and failed-launch recovery. These tests precede final
common-commit artifact acceptance. No production key enters Windows/Actions.

[Release matrix](../RELEASE_MATRIX.md) defines version surfaces, both-platform
checks, immutable artifacts, docs and deliberately independent full/demo states.
CI checks Mac/Windows source and produces a bounded Windows installer receipt.
Node pins are platform-specific to retain macOS12 compatibility. Full edition,
its installed app and colleagues update channel are separate release decisions.

Final Windows validation additionally found ordinary-user directory-symlink
limitations in the source-snapshot helper and an incomplete synthetic platform
fixture. Directory junctions now follow the existing Windows pattern; file-link
security subtests skip only on actual Windows EPERM. The rest of their assertions
remain active. Full unit suites run in both CI jobs. The installer receipt creates
its parent output folder but still refuses replacement of an existing candidate.

Repository-only CI follow-up: the browser onboarding flow now waits for the exact
lesson's canvas session after reload/material refresh. A rendered HTML frame and
the teaching connection can precede canvas-port registration. One shared bounded
readiness helper replaces the two existing loops and the premature array access.
Chromium/WebKit reference flows pass; no runtime app or packaged kit change.

The settings browser fixture likewise uses the existing canvas/teaching broker
plugins, as the language fixture already does. Its generic optional-service
response is not a valid host-registration response and previously caused
`sessions/undefined/poll` requests, including intermittent WebKit teardown errors.
Keep the page-error assertion; correct the fixture instead of suppressing errors.
Focus/hover animation waits settle cancellation as well as completion, while
retaining the assertions on final computed styles. First-lesson and architecture
entry points now describe both published platforms rather than the earlier
Windows packaging plan.
