# Script catalogue

For coordinated Mac/Windows artifacts, `public-release-set.mjs RELEASE_DIRECTORY
VERSION SOURCE_COMMIT` verifies the complete set, source/version agreement,
hashes, both updater targets and separate guides. It does not sign, install or
publish. See [release matrix](../docs/RELEASE_MATRIX.md).

Run these scripts from the repository root unless a command specifies the app directory. Use a synthetic lesson archive when testing.

| Task | Tool and effect |
| --- | --- |
| Verify the public edition | `node scripts/check-distribution.mjs public` checks the profile, native updater configuration and public adapters. |
| Test the app | From the app directory, run the [unit and browser checks](BROWSER_TESTS.md). |
| Check third-party evidence | [Source hashes](check-source-distribution.mjs), [PDF notices](check-pdf-license-notices.mjs), [web fonts and notices](check-web-license-notices.mjs), [project licence](check-project-license.mjs). The [inventory tool](audit-dependency-licenses.mjs) writes a report from installed dependencies and lockfiles. |
| Check a local agent workflow | Run `npm run test:agent-onboarding` from the app directory. The test supplies its own archive and uses real local commands and browser windows. |
| Organise a lesson or prepare its canvas | [Lesson commands](tafelraum-unterricht.mjs) and [canvas commands](tafelraum-canvas-agent.mjs). Specify the running app URL and confirm the target archive or teacher session. These tools can change the selected lesson. |
| Validate or install HTML material | [Package checker](check-interactive-material.mjs) and [additive installer](install-interactive-material.mjs). Checking a package does not install it. Use `--require-print` for printable worksheets. |
| Diagnose or back up an archive | [Archive doctor](archive-doctor.mjs), [create backup](create-archive-backup.mjs), [verify backup](verify-archive-backup.mjs), [prune backups](prune-archive-backups.mjs). Specify the intended data target. Backup creation writes files and can trigger retention at the configured destination. |
| Freeze or prune build outputs | [Source snapshot](snapshot-build-source.mjs) writes under `output/`. [Build retention](prune-build-artifacts.mjs) previews the selection by default; `--apply` removes eligible artifacts. Do not reinstall dependencies into a snapshot that links them. |
| Prepare runtime notices | [Runtime notices](prepare-runtime-notices.mjs) checks generated desktop resources and writes the complete Node licence into the build destination. |
| Check optional components | [Office runtime](prepare-office-runtime.mjs), [document image QA](document-image-qa.mjs) and [mobile capture QA](mobile-capture-qa.mjs) need their documented runtimes or configuration. They are outside the basic browser setup. |
| Inspect a font source | [Liberation source check](verify-liberation-source.py) uses Python and fontTools; the normal app startup does not need it. |

The public [preview build](../preview/README.md) has its own read-only hosting procedure. Interface language, settings and neutral button states have dedicated npm checks (`test:ui-language`, `test:ui-settings`, `test:button-states`). See the [source distribution guide](../SOURCE_DISTRIBUTION.md) for the distinction between source and packaged runtime evidence.


Headless Office selection: `prepare-headless-office.mjs`; pixel/text parity: `headless-office-qa.mjs`. Build-time only, vendor cache untouched. See DOCX contract39.
