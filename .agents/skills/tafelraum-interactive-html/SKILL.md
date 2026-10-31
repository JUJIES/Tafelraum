---
name: tafelraum-interactive-html
description: Create, revise, validate, or integrate local Tafelraum interactive HTML packages, including printable worksheets, quizzes, games, and simulations, under one subject-neutral technical contract. Use for local Tafelraum HTML material work in a checkout or bundled agent kit; do not decide subject content or pedagogy unless the user asks.
---

# Tafelraum Interactive HTML

Build different kinds of HTML material on one capability-based package contract without turning visual or instructional preferences into global restrictions.

For classroom content, also use `tafelraum-unterrichtsmaterial` to establish
the supplied teaching context and consult relevant examples when available.
A fresh archive needs no private rules, previous series or personal plugins; use
the shared teaching workflow and respect existing scoped rules when present. This skill governs
the HTML package and its technical checks; it does not prescribe the lesson.

## Required context

Before changing a package:

1. Read `AGENTS.md`.
2. Read `docs/implementation/02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md` and `docs/implementation/04_INTERAKTIVE_HTML_MATERIALIEN.md` completely.
3. For visible UI or interaction changes, also read `docs/design/00_UI_UX_STYLEGUIDE.md` and `docs/design/05_INTERACTIVE_HTML_MATERIAL_UI_BRIEF.md`, inspect the actual package in a browser. App-development review skills are not a prerequisite for authoring a material.
4. Read the teaching and series-local documents only when the request includes lesson content or didactic decisions. Do not infer those decisions from this technical skill.

## Shared local pipeline and examples

Use the `README.md` / `agent-kit.json` root named by the running app when working
from its bundled agent kit; otherwise use the opened checkout. The kit includes
the same validators and CLIs. Do not substitute a global OpenAI/MCP worksheet
plugin's rules or remote computation for this workflow. The neutral examples in
`docs/agent-examples/README.md` show a form-based shared A4 package and a scripted
Room state adapter; copy them to a writable work directory before changing them.
They are technical examples, not universal templates or print-approved worksheets.

## Layout references for worksheets

For new or substantially redesigned worksheets, read
[the shared layout guide](../../../docs/agent-references/LAYOUT.md) and select
two or three suitable different examples from
[the reference index](../../../docs/agent-references/README.md). Read their active
manifest entries, CSS and assets and inspect the complete selected pages visually.
These 13 maintained packages supply the same reference base in a checkout and
bundled kit. The minimal examples explain integration, not finished worksheet
layout. Small revisions preserve the established design without a new reference
round. Follow user choices; do not impose worksheet appearance on digital tools.
The shared layout guide owns reference selection and visual comparison; existing
package, Room and print checks below remain authoritative for technical acceptance.

## Model

Treat worksheet, quiz, game, simulation, and future formats as variants of the same `tafelraum-interactive-html` package. Do not add a material taxonomy or renderer branch merely to select behavior.

Declare only capabilities the package actually supports:

- base package: local responsive HTML on the teacher canvas;
- `print`: a fresh, script-free A4 template in portrait or landscape;
- `live.state = v1`: synchronized semantic state when Live Canvas needs real interaction.
- `playback.protocol = room-v1`: synchronized local HTML playback on both original teacher/Room views, with one audible output (D-295). No teacherView opt-in or controller replacement. Use the shared Mirror/getStatus/execute contract in implementation document04. Keep semantic paused position in `tafelraumLive`, live playback ephemeral; Remote publication remains unsupported.

For Room Canvas, every package with custom JavaScript interaction must also
expose the same `window.tafelraumLive.getState()` / `applyState(value)` state
contract and signal semantic changes, even when it does **not** declare
`live.state = v1` for Remote Canvas. The injected form bridge covers ordinary
fields, not a quiz's internal round, reveal phase, feedback or score. Check
teacher → Room and Room → teacher actions with the real package before updating
an installed copy. Do not add Remote capability merely to obtain Room sync:
Remote package bytes may expose teacher-only answers.
The shared intake check rejects new scripted HTML without the `getState` and
`applyState` interface before either validation or archive installation. This
source check cannot prove that every action signals `tafelraum:statechange`, so
the two-direction browser interaction check remains required.

Capabilities are independent. Never infer `print` or `live` from a title, subject, folder, or visual appearance.

## Authoring intent

Resolve the output from the user request. The worksheet print requirement below is binding; it is not a persisted material taxonomy or a visual template:

- **Digital-interactive:** When the user asks for an interactive element, tool, game, quiz, sorting task, or simulation without asking for a worksheet or printout, optimize a compact app-like surface for direct Canvas use. It does not need worksheet instructions, an A4 proportion, or a print capability. Keep the interaction self-explanatory, focused, and touch-usable so learners can operate it at the board.
- **Hybrid worksheet:** When the user asks for an `Arbeitsblatt` or `AB` without naming another output format, create one HTML package that is fillable on the Canvas and declares a printable blank A4 template. This is required unless the user explicitly requests a purely digital worksheet or a different output format. For new hybrid HTML worksheets, the default initial Canvas/Room layout shares the blank print template’s A4 proportions, task arrangement and page boundaries (D-259). Digital answer fields may subsequently grow vertically and scroll, moving later screen tasks down; these local changes never alter the fresh blank print template. Responsive legacy worksheets remain compatible, but are not the default authoring model for new hybrid worksheets. When the two uses compete, reliable A4 printing is the stricter acceptance constraint.
- An explicit request for `digital-only`, Word, PDF, a static image sheet, or another format overrides these defaults. Do not create HTML merely because the artifact is a worksheet, and do not add a print capability to a digital-interactive tool without a real paper use case.

Associated solution sheets, completed versions and model answers inherit the source material’s output/layout mode by default. A solution to a hybrid HTML worksheet also declares `shared-pages`, with the same paper orientation and a corresponding initial layout and task numbering. Its own screen and print entry must match; this does not mean sharing the student package’s entry or exposing teacher answers in a student live package. Preserve corresponding task/answer positions where feasible; longer model answers may need explicitly planned continuation pages rather than cropping or shrinking them. A solution to an explicitly digital tool does not automatically become an A4 worksheet.

These modes do not prescribe colors, page count, task type, amount of text, or a shared visual design. Choose those from the actual teaching purpose.

### Mandatory worksheet gate

For an `Arbeitsblatt`, `AB` or hybrid worksheet, record the intended print page count and target print path in the UI brief before composing it. An earlier digital-only example, current Canvas use, or a plan not to print today is not an explicit request to omit print support. Do not silently carry that assumption into a new or revised worksheet. Record a user-requested digital-only exception in the brief with its source.

Run both package checking and any authorized archive installation with `--require-print` for worksheets. A base-package success without this flag does not satisfy worksheet acceptance. The flag rejects a missing print declaration; the existing parser checks its A4 settings and local entry file. Never remove the flag to make a failed worksheet pass. Digital tools and explicitly digital-only worksheets retain the base check.

A declared print entry is only the technical gate. Before calling the worksheet print-ready, finish the binding target-dialog / exported-PDF review below, including every page and handwriting capacity. If the authorized stage does not permit the target test, deliver only a prechecked draft with print acceptance explicitly open; do not install or place it merely to run the test.

## Workflow

For an authorized archive handoff, use `tafelraum-unterricht-organisieren` to
resolve the target from any chat and bind the existing installer to the live
archive. A clear follow-up such as “füge hinzu” can authorize this stage from
conversation context; do not require repeated permission or a fixed series chat.
All package, Room and print requirements below remain unchanged.

1. Resolve the authoring intent, package source, and authorized stage. A request to create, revise, review, or prepare material authorizes a draft in a writable work directory (in a checkout normally `output/interactive-materials/<id>/`). A bundled agent kit is read-only source material, never the output directory. It does not authorize creating a lesson, installing into a lesson archive, or placing anything on a Canvas. Treat archive installation and Canvas placement as two separate later stages unless the user explicitly requested either one.
2. Preserve one package ID and one manifest. Keep assets local and references package-relative.
3. Decide whether original visual material would materially improve the package. If so, use an available suitable image tool/skill (`imagegen` is one optional adapter) for the smallest useful asset: a full illustration, an isolated object, a vignette, a texture, or a small content-bearing pictogram. Image generation is optional, not a default requirement.
4. For new hybrid A4 worksheets, follow the user's shared-page decision D-259: declare `print.layout = "shared-pages"`, use the same entry for screen and print, and mark complete pages with `data-tafelraum-page`. Keep initial task arrangement, typography and page proportions aligned with the blank print template. Digital answer fields may be manually enlarged vertically and scroll; later tasks may move down in the screen document. Those local interaction changes must never alter blank print writing space or page breaks. The Canvas scales the full page proportionally; further pages scroll. Digital tools remain responsive. Existing packages without this capability remain compatible and need individual conversion/print acceptance; do not infer pagination from titles or CSS class names. `shared-pages.css` beside this skill is a technical example for the tested 12-mm-margin Drug-Harm slice, not a universal style or margin rule. Preserve old entry/style files for stored instances when converting and activate the new manifest only with a supporting app.
5. Add optional capabilities only when the requested behavior is implemented and testable.
6. Validate the staged package before presenting it for review:

   ```sh
   node scripts/check-interactive-material.mjs --source-dir <paketordner> --require-print
   ```

   The command above is required for worksheets; omit `--require-print` only for digital tools or a documented user-requested digital-only exception.

7. Before installation, inspect the staged package in a local browser. For declared print templates, use the [binding print acceptance workflow](../../../docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md#verbindliche-druckfreigabe-für-unterrichtsmaterial): the intended real print dialog is authoritative, and every page of the PDF exported from that dialog must be rendered and visually inspected. Headless PDFs and screen screenshots are preflight evidence only. Keep an unavailable final print check explicitly open; do not mutate a lesson merely to enable it.
8. Install only when explicitly requested, through `scripts/tafelraum-unterricht.mjs install-html --lesson <id> --source-dir <package> --mode worksheet|digital --url <app-url> --archive-root <confirmed-root>`. `worksheet` enforces the existing installer's `--require-print` gate. The underlying additive installer is unchanged; never let its historical default select an archive. Before overwriting or jointly updating existing material, follow the backup rule in `AGENTS.md`.
9. Place a material on the Canvas only when the user explicitly requests Canvas placement. After installation, a request limited to the material archive ends with the package listed there.
10. Once installed or placed as requested, inspect the real package in Tafelraum. For new hybrid worksheets, confirm that the installed archive manifest still declares `shared-pages` and that a fresh archive insertion shows a complete first A4 page with only proportional corner sizing, without the legacy inner zoom bar. A prepared output package or published App update alone does not prove archive activation. If Canvas placement is not authorized, use an isolated QA profile and leave the productive insertion check explicitly pending. Test interaction, reflow, Canvas pan/zoom handoff, reload behavior, and declared optional capabilities. For `print`, use the actual `Material drucken` action at two content or Canvas zoom levels when the user has authorized the required installation or placement. Export the current template through that target system dialog to a QA PDF and inspect all its pages before reporting print acceptance; a different browser or renderer does not substitute for native Tafelraum.

## Worksheet composition

The print capability requirement above is binding. The composition suggestions below are starting points, not a mandatory visual template:

- As a binding capability requirement, a `hybrid` worksheet means one HTML package that is fillable on screen and declares a fresh printable A4 template. Do not create a parallel PDF merely to make the result hybrid unless the user asks for another format.
- Decide `digital-only` versus `hybrid` before composing the page. A digital-only material may rely on reflow, scrolling, or growing/editable fields and omits the `print` capability. A hybrid worksheet must remain independently usable on paper; screen auto-growth or textarea resizing never counts as print writing space.
- For open written responses, prefer generous bordered response areas that work with keyboard, pen, and print. Use ruled writing lines only when the task or user specifically benefits from them.
- Size every hybrid print field from the expected handwritten response, not from the remaining layout space. Useful starting estimates are about `10–12 mm` for a term or short phrase, `20–25 mm` for one sentence, `35–50 mm` for two or three sentences, and `45–60 mm` for multi-sentence notes. Adjust for age, handwriting, and task; these are capacity checks, not fixed visual tokens.
- Render and visually inspect every page of the blank A4 PDF exported from the target print dialog, and perform a response-capacity review with a representative answer before calling a hybrid worksheet print-ready. White space elsewhere on the page does not compensate for a writing box that is too small at the point of use.
- Treat a PDF render with zero page margins as insufficient print evidence. Declare realistic page margins, print at `100 %` through the intended real print path, and check every page edge for clipping. If adequate handwriting space and printer-safe margins do not fit comfortably, use a deliberate second page instead of relying on browser scaling.
- Audit every scaffold against the intended learning action. If learners are meant to find, mark, order, label, or infer something, avoid typography, word banks, headings, or image labels that silently reveal that result. Keep scaffolds when they serve a different intentional purpose.

## Generated visual assets

- An available image-generation tool may create complete scenes or small modular assets. Do not enlarge the assignment into a full-page illustration when one freestanding object or compact visual cue is enough.
- For cutouts, stickers, object cards, and similar elements, request a genuinely transparent background and preserve the alpha channel. Background extraction or removal is an appropriate image edit when the source asset is otherwise suitable.
- Move every selected project asset into the package `assets/` directory before referencing it. Never leave a package dependency in a temporary or tool-owned output folder.
- Size and compress the final raster for its actual screen and print use while retaining sufficient print resolution. Keep discarded variants outside the package.
- Generated pictograms may communicate subject content or decorate the material. Do not use generated raster icons for Tafelraum controls or familiar actions; those continue to use the established product icon system and accessible HTML labels.
- Keep exact words, numbers, and answer-critical labels in HTML whenever possible rather than baking them into generated pixels.
- When useful for later revision or provenance, record the final prompt and generation date in the package README. This is authoring documentation, not runtime metadata.

## Compatibility invariants

- No external CDN, font, tracker, frame, or network dependency. A package must work offline under the existing sandbox and CSP.
- Manifest ID and directory name match; entry points and assets remain inside the package.
- Canvas geometry and archival provenance remain Tafelraum-owned. Do not create a second geometry or persistence truth inside the package.
- Screen layout must not emulate a second browser card or paper preview. Tafelraum owns the outer radius, clipping, shadow, title bar, content zoom controls and—for declared A4 print templates—the full paper proportion of the teacher-canvas frame.
- Printable output is a clean template. It does not depend on package scripts or the current Canvas instance state and does not silently include answers, annotations, covers, or App chrome.
- A multi-page print template uses stable page boundaries and is checked in the target system print dialog and the PDF exported from it. Tafelraum supplies the safe print path; the package owns its page composition.
- `live.state = v1` publishes only bounded semantic JSON. Do not place secret solutions or private data in a participant-downloadable live package.
- Semantic controls stay directly interactive. Custom pointer areas use `data-tafelraum-interactive`; neutral layout areas remain available for Canvas navigation.

## Freedom and extension

Typography, color, composition, number of pages, interaction model, subject, language, instructional structure, and whether generated imagery is used remain package-specific. Reuse patterns when useful, but do not require every package to share one stylesheet or visual template.

When a new capability is genuinely needed, extend the manifest and central renderer contract first. Do not encode it as a filename convention, folder meaning, title keyword, or one-off package workaround.

Für native Druckabnahme müssen Paketstyles ihre Papierfarben und Formularfelder ausdrücklich bestimmen; die gemeinsame Vorlage darf sich nicht auf die Bildschirm-Sandbox oder ein helles Host-Theme verlassen. Die Referenz `shared-pages.css` zeigt Seitengröße und Rand, ersetzt aber nicht die paketeigene Typografie. Querformat ist im Canvas technisch vorgesehen; native Systemdruckorientierung separat im Ziel-Druckdialog abnehmen (siehe D-259-Teststand).
