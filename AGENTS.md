# Working on Tafelraum

This repository is the public source edition. At the beginning of a task run `node scripts/check-distribution.mjs public` in the root. State the target edition, workspace and test archive. Ask if a request could refer to the maintainer’s classroom build, a binary update or another edition. A code change does not authorise a release.

Use the local teacher canvas, lesson archive, Room Canvas and agent kit as the shared product model. Preserve saved lessons and older snapshots. Keep the public edition independent of private services, credentials and release tooling. Scope tests to a synthetic archive. Never ask contributors for real lesson data to reproduce an issue.

Start with the [README](README.md) and [contributing guide](CONTRIBUTING.md). For UI changes read the [style guide](docs/design/00_UI_UX_STYLEGUIDE.md) and the relevant brief. For materials and canvas preparation use the repository-local skills. Test through the normal entry point and update the relevant guide when behaviour changes.

Use [the current architecture](docs/ARCHITECTURE.md) for runtime ownership and
the teacher/Room/archive/agent boundaries. User-facing storage and backup rules
are in [Data, privacy and backups](docs/DATA_AND_PRIVACY.md). Historical concept
documents do not override current local storage or delivery contracts.

Write public guides, README files and GitHub-facing instructions in English. Keep commands, identifiers and paths exact. Preserve upstream licence notices and the intended language of classroom examples. Label links to German technical records so readers can identify their language before opening them.


## Release completion includes the corresponding app download

Before a release, read [the release workflow](docs/RELEASE_WORKFLOW.md) and
scripts/downloads/release-policy.json. Public releases bind their clean,
published Git commit/tag to the Public app package, GitHub release and public
Beelink download, with the English guide. A source push alone does not complete
a desktop release. The colleagues updater and MDM download belong to the
separate full-edition channel; never use that package as a Public binary.
Report an explicitly omitted delivery step as pending. A local build does not
authorize publishing. Official publisher tools run from the maintainer workspace.

Before app/version/resource/installer changes also read
[the Mac/Windows release matrix](docs/RELEASE_MATRIX.md). Both public packages
must bind to the same app-release version and exact source commit. Never replace
the shared updater manifest with a single-platform manifest. Source-only docs
publication does not silently rebuild desktop artifacts.


## Official desktop delivery channels (2026-11-02)

Before desktop builds, updates or download operations read
[contract65](docs/implementation/65_DESKTOP_RELEASE_CHANNELS.md). Product profile
and delivery channel are separate: public source defaults to manual updates;
official Public Mac packages use the public GitHub update lane. Colleagues retain
the existing full-edition lane. Never switch an installed app between editions or
copy archives implicitly. Official public releases must include signed updater
artifacts and matching GitHub/download indexes, not just the source push or ZIP.
Public GitHub README offers public source and public Mac/Windows packages; the full MDM
package is a separate school distribution, not the public repository's default app.


## Download statistics and current public release (2026-11-04)

Public desktop release0.1.92 binds Mac Apple Silicon and Windows x64 to source
commit c370dbba60a3d14989a41bc572e0d9caa9934b15 and one signed GitHub updater
manifest with both platform targets. Check the actual release/tag and receipts
before delivery; newer documentation does not rebuild or relabel desktop bytes.
Native Windows coverage and hardware limits are in [Windows QA](docs/WINDOWS_QA.md).
The full-edition colleagues channel has an independent version and approval.
Public contributors do not mirror its changing installation numbers. Version
numbers never prove equal source profiles. Each later app release must pass the
[release matrix](docs/RELEASE_MATRIX.md) for both platforms before publication.

In the maintainer checkout, `node scripts/download-stats.mjs 14` reports fresh
GitHub asset counts and private Beelink aggregates. Raw origin logs omit client
IP/headers, rotate daily/by size and are bounded; daily summaries persist up to
one year. GitHub increments are sampled every six hours. Counts include tests,
retries and updates; never present them as unique users or installations.
Public source users need no Beelink access.
