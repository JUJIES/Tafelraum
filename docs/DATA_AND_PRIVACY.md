# Data, privacy and backups

This guide describes the public edition. The demo, a source checkout and an
installed app have different storage locations. A local archive does not mean
every optional service or assistant works offline.

## Where are my lessons?

| Route | Confirmed lesson storage | Before removing it |
| --- | --- | --- |
| Online demo | Temporary example state in the current tab; reload resets it | Do not use it as your lesson archive. |
| Browser app from source | `local-data/public-lessons/` at the repository root, shared by `npm start` and `npm run dev` | Copy the complete archive before deleting the checkout. |
| Official Public Mac app | `~/Library/Application Support/app.jujies.tafelraum.public/unterrichtsarchiv/` | Back up this folder separately from the application. |
| Official Public Windows app | `%APPDATA%\app.jujies.tafelraum.public\unterrichtsarchiv\` | Use **Open local data folder** to confirm the actual Explorer-visible location; back up separately from the program. |

In the desktop app, **Open local data folder** opens the containing app-data
folder; `unterrichtsarchiv` is the lesson archive inside it. Self-built apps may
use a different identity. The early Public 0.1.88 package used the older identity;
its [installation guide](../prototypes/surface-shell-a-b/distribution/public/INSTALLATIONSANLEITUNG.txt)
explains the separate archive and deliberate migration required.

The archive keeps the catalogue, saved boards, original imported materials and
associated files. Browser storage also holds caches and unconfirmed drafts.
Clearing browser data can discard those drafts. Changing browser, profile or
origin can make a pending draft unavailable even when the saved archive remains.

## What does “private lesson notes” mean?

Course names and lesson notes are stored separately under
`_private/student-notes/` inside the archive. They are excluded from Room Canvas,
canvas/material exports and ordinary canvas-agent inspection. Copying a lesson
does not copy its private notes. A **complete archive backup includes them**.

“Private” describes these application boundaries. It does not promise encrypted
files or protection from someone or another program with access to your account,
archive or backups. Use your institution's rules for personal data and protect
the device and backup destinations accordingly.

Ordinary canvas text and imported documents are not private notes. Room receives
a presentation projection of the board. A clip or an answer cover is not a
confidentiality boundary; content outside the visible view or beneath a cover
must not be treated as secret.

## Can an AI assistant read my data?

Tafelraum does not require an AI account. Connecting an assistant provides local
instructions and tools; it does not itself choose a cloud provider. The normal
canvas tools do not expose private lesson notes. However, an assistant with file
access may read archive files, including private notes, through that separate
permission. A cloud-backed assistant may send content it reads to its provider.

Choose its working directory and permissions deliberately, use invented names
for trials and public bug reports, and review the provider's own data settings.
See [agent access and privacy](AGENT_WORKFLOW.md#compatibility-and-privacy).

## When does the app contact other services?

- The local archive server listens on the local computer; it is not an online
  archive-sync service. Room is a second local presentation window.
- Online demos, YouTube embeds and links contact their respective hosts. Opening
  an external link uses your browser; that site's own rules apply.
- Official desktop updates contact the configured release service. Public desktop
  updates and binaries use GitHub; the stable download page is on
  `updates.jujies.app`. Update delivery does not synchronise your lesson archive.
- Optional phone capture needs a separately configured relay. Optional local
  document/image processing has its own setup and availability. These are not
  prerequisites for ordinary drawing, local material use or Room.

## How do I back up and restore?

1. Finish editing, wait for saving, resolve warnings, then close Tafelraum and
   other tabs or programs writing to that archive. For source use, stop its
   local server after the saved teacher tab is closed.
2. Copy the **whole archive folder**, including hidden files and `_private`, to
   a dated folder outside the active archive. Keep another copy on a separately
   protected device or backup destination. A second folder on the same disk does
   not protect against device failure.
3. Check that the copy contains `archive.json`, lesson files and material files.
   Keep the original until you have checked the restored copy.
4. To restore, keep the app closed, preserve the current archive as another dated
   copy and restore the complete backup to the same edition's archive location.
   Replace the folder deliberately; do not merge archives or overwrite a running
   archive. Reopen and check the lessons and materials you need.

For scripted backups, developers can use the existing
[backup tools](../scripts/README.md) with an **explicit** `--archive-root` and
external output directory. Detailed integrity and isolated restore checks are
in the [backup contract (German)](implementation/03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md).

Canvas exports, browser caches and per-file histories are not full backups.
Ordinary app replacement keeps the separate archive, but builds and updates do
not automatically create full lesson backups. Deleting the source checkout
deletes its default archive too. An app-removal or cleanup tool may remove app
data: make the copy before using one. Do not assume a Windows QA result proves
the behaviour of a future installer or uninstaller.
