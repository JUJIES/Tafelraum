# Project asset provenance

JUJIES maintains Tafelraum. Contact: mail@jujies.app.

| Asset | Source and provenance |
| --- | --- |
| Native app icon | The maintainer confirmed ImageGen as the source of `prototypes/surface-shell-a-b/src-tauri/app-icon.png`. Tauri generates the platform icon sizes under `src-tauri/icons/`. |
| Web icons | The maintainer confirmed the project icon group, including `prototypes/surface-shell-a-b/public/tafelraum-icon.svg` and the PNGs under `public/icons/`. Earlier vectorisation steps were not reconstructed. |
| Transport illustration | Created with ImageGen without a reference picture. The [asset note](prototypes/surface-shell-a-b/src/assets/demo/README.md) records the prompt and purpose. |
| Worksheet references | Thirteen HTML references include local illustrations, icons and accompanying licence texts. Their [provenance record](docs/agent-references/PROVENANCE.md) distinguishes project originals from third-party material. |
| Preview lessons | The eclipse diagram, survey map and harbour illustration are original inline SVGs from [illustrations.mjs](preview/lessons/illustrations.mjs). The starter pictures are original vector scenes from [pictures.mjs](preview/lessons/pictures.mjs). The routes, reports and teaching prompts were invented for the demo. |

The [public asset manifest](prototypes/surface-shell-a-b/public/licenses/tafelraum/provenance.json) records hashes for the core project assets. The build checks the files against that manifest. The maintainer’s ImageGen statement records provenance and does not establish exclusive rights to generated output. Original generation sessions for the project icons are unavailable.

The README screenshots show the bundled sample lessons in the teacher and Room windows, captured by the [preview browser check](preview/check.mjs). The optional NASA video streams from its original [YouTube publication](https://www.youtube.com/watch?v=hyf5JF_VxwM) after activation. No video bytes or third-party thumbnails are bundled.

The [project licence](LICENSE) applies to the project’s own assets where rights exist. Fluent and Lucide controls, fonts and other third-party components keep their [original notices and terms](THIRD_PARTY_NOTICES.md).
