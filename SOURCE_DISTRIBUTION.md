# What this source distribution contains

This repository contains the public teacher canvas, lesson archive, Room Canvas, interactive material support and local agent tools. The hosted preview ships separately as compiled assets. The source tree includes neither private lesson archives nor a desktop installer, office runtime or model weights.

## Third-party material shipped in source

| Material | Where to check it |
| --- | --- |
| Fluent icon geometry | The [icon notice](prototypes/surface-shell-a-b/src/icons/NOTICE.md) preserves the MIT copyright and licence. |
| Web dependencies and fonts | Notices under `prototypes/surface-shell-a-b/public/licenses/` accompany the code and font inventories. The web build obtains Excalidraw fonts from the pinned npm dependency. |
| Liberation fonts | The source archive, original licence and exception, Debian patch and descriptor belong together. Keep their original terms when redistributing them. |
| PDF.js and WASM | Seven original licence texts have version and hash records. The source distribution supplies notices. The web build performs additional checks on the assets it ships. |
| Node, LibreOffice and DocRes | The source tree includes runtime notices, pinned provenance and the original DocRes licence. Packaging an executable or models requires checking the contents of that actual distribution. |

The [source evidence manifest](third-party/source-distribution.json) records the selected third-party files and their SHA-256 hashes. Run `node scripts/check-source-distribution.mjs` in the repository root to verify them. See the [third-party inventory](THIRD_PARTY_NOTICES.md) and [project asset provenance](ASSET_PROVENANCE.md) for details.

The npm and Cargo lockfiles identify dependencies. Project-specific terms apply to Tafelraum’s own work. Third-party files retain their original licences and notices. Checks on this source tree do not establish the contents or licence obligations of a future binary distribution.
