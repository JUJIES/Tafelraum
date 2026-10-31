# Third-party notices

Tafelraum’s own code and assets are covered by the [project licence](LICENSE). Dependencies, fonts and third-party illustrations retain their own terms. The table lists direct app dependencies as recorded in the public source inventory. Consult the [app lockfile](prototypes/surface-shell-a-b/package-lock.json) for resolved packages and the original notices for their terms.

| Package | Recorded version | Package licence | Use |
| --- | --- | --- | --- |
| [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | 0.18.1 | MIT | App, dependencies |
| [@fluentui/svg-icons](https://github.com/microsoft/fluentui-system-icons) | 1.1.339 | MIT | App, dependencies |
| [@tauri-apps/api](https://github.com/tauri-apps/tauri) | 2.11.1 | Apache-2.0 OR MIT | App, dependencies |
| [lucide-react](https://github.com/lucide-icons/lucide) | 1.37.0 | ISC | App, dependencies |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | 6.3.289 | Apache-2.0 | App, dependencies |
| `polygon-clipping` | 0.15.7 | MIT | App, dependencies |
| `qrcode` | 1.5.4 | MIT | App, dependencies |
| [react](https://github.com/react/react) | 19.2.8 | MIT | App, dependencies |
| [react-dom](https://github.com/react/react) | 19.2.8 | MIT | App, dependencies |
| `rrweb` | 2.2.0 | MIT | App, dependencies |
| [@tauri-apps/cli](https://github.com/tauri-apps/tauri) | 2.11.4 | Apache-2.0 OR MIT | App, devDependencies |
| [@types/qrcode](https://github.com/DefinitelyTyped/DefinitelyTyped) | 1.5.6 | MIT | App, devDependencies |
| [@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped) | 19.2.18 | MIT | App, devDependencies |
| [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped) | 19.2.5 | MIT | App, devDependencies |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 6.1.1 | MIT | App, devDependencies |
| [playwright](https://github.com/microsoft/playwright) | 1.64.1 | Apache-2.0 | App, devDependencies |
| [typescript](https://github.com/microsoft/TypeScript) | 7.0.2 | Apache-2.0 | App, devDependencies |
| [vite](https://github.com/vitejs/vite) | 8.2.4 | MIT | App, devDependencies |

## Notices and source material

| Component | Notice or source | Scope |
| --- | --- | --- |
| Fluent icons | [Original MIT notice](prototypes/surface-shell-a-b/src/icons/NOTICE.md) | Preserve the notice when distributing the icon geometry. |
| rrweb | [Original MIT text](prototypes/surface-shell-a-b/public/licenses/rrweb-2.2.0-MIT.txt) | The recorded version is 2.2.0. |
| DocRes adapter | [Included licence](prototypes/surface-shell-a-b/document-image/LICENSE.DocRes), [upstream project](https://github.com/ZZZHANG-jx/DocRes) | The public source does not include the private Python runtime or model weights. |
| Project icons and demo illustrations | [Asset provenance](ASSET_PROVENANCE.md) | Includes the public preview illustrations and the original transport demo. |
| Web fonts | [Web licence inventory](prototypes/surface-shell-a-b/public/licenses/) | Retain font-specific terms. Liberation Sans 1.05 includes GPL v2 and an exception. Its original source and patch are identified in the source evidence. |
| PDF.js and WASM | [Notice manifest](prototypes/surface-shell-a-b/public/licenses/pdfjs-dist/provenance.json) | Seven original licence texts are checked as part of the build. |
| LibreOffice | [Pinned runtime and hashes](prototypes/surface-shell-a-b/office-import/runtime.json) | The runtime is distributed separately from this source tree and has its own component licences. |
| Worksheet references | [Reference provenance](docs/agent-references/PROVENANCE.md) | Some engine illustrations are CC BY-SA; the Lucide icons retain their ISC notices. |

## Verify an inventory

The native dependency declarations and resolution are in [Cargo.toml](prototypes/surface-shell-a-b/src-tauri/Cargo.toml) and [Cargo.lock](prototypes/surface-shell-a-b/src-tauri/Cargo.lock). The optional mobile capture relay has no external npm dependencies. The private remote participant service is outside this public edition.

The [source distribution guide](SOURCE_DISTRIBUTION.md) describes the hash checks for the third-party material actually shipped in Git. Build checks cover the web notices, project licence copies and declared asset hashes. An inventory of a source tree is distinct from an inventory of a packaged desktop application, its fonts, native runtimes and transitive libraries.

When updating a dependency, check the resolved version and licence, update affected notices and rerun the build checks. When adding an illustration or another copied asset, record its source, licence and modifications alongside it. Original notices and licence texts remain authoritative.
