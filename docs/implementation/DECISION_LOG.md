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
