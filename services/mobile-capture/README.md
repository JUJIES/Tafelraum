# QR capture relay – personal pilot

Separate from public updates and Live Canvas. Node >=22, built-in HTTP/crypto only;
no database, file uploads on disk, archive API, directory listing or content logs.

## Run

`CAPTURE_ADMIN_KEY` (random 32-byte base64url secret) and `CAPTURE_PUBLIC_URL`
(the exact HTTPS origin) are required. `CAPTURE_PORT` defaults to 5841; listener is
loopback-only behind a dedicated HTTPS tunnel. Run `node server.mjs`. No key in
arguments, frontend code, Git, releases or normal logs.

Mac's private `mobile-capture.json` contains `{ "baseUrl": "https://…", "adminKey": "…" }`.
Development reads `local-data/mobile-capture.json` or `TAFELRAUM_CAPTURE_CONFIG_PATH`;
native app reads beside its canonical `unterrichtsarchiv/`. This file is not copied
into a release. Personal provisioning is a separate deployment step.

## Contract

- Admin `POST /api/capture/sessions` with encrypted `target` returns opaque session,
  host and sender capabilities, expiry. No lesson ID, title, archive path or AES key
  is held by the relay. QR's URL fragment holds sender capability and AES key.
- Sender `GET /api/capture/sessions/:id` returns encrypted target and receiver
  availability. Sender cannot list sessions, download other submissions or modify
  the destination. Host `HEAD` announces availability; host `GET …/next` long-polls
  for at most 15 s and receives binary ciphertext with `X-Capture-Transfer`.
- Sender `PUT …/transfers/:id` accepts at most 20 MiB plus envelope overhead.
  Response waits for host `POST …/transfers/:id/ack`. Only a completed canonical
  archive import produces `saved`; ACK is not merely delivery to RAM.
- Each transfer has authenticated AES-GCM purpose binding to session and transfer
  ID. Saved receipts are encrypted too. Mac uses a stable per-transfer filename;
  retries share the existing archive dedupe path. Same ID with different ciphertext
  is rejected; successful retries reuse a bounded in-memory receipt.
- One pending transfer/session, eight sessions, 64 MiB total reserved ciphertext,
  two waiting responses/transfer, 1000 receipts/session. After 90 s an uncommitted
  transfer fails and releases its buffer. Session lifetime <=2 h. Host DELETE
  revokes it immediately; restart forgets everything.
- No HTTP cache, request-body logs or application-level spool/backup files. RAM-only
  is not a guarantee about OS swap, memory dumps or transport-provider metadata.
- AES-GCM protects bytes from a passive relay; it does not prove that dynamically
  served frontend code cannot be modified by its operator. QR possession is an
  upload capability, not an identity check. No student rollout is approved.

## Checks

`node --test services/mobile-capture/test/*.test.mjs prototypes/surface-shell-a-b/mobile-capture.test.mjs`
from repository root. Neutral browser QA after the main app build:
`node scripts/mobile-capture-qa.mjs`. For a real phone use the same command with
`--capture-config <private-config-path>` pointing to a deployed HTTPS relay.
Neither command uses the productive archive. Actual Android/iPhone/iPad camera,
Safari, school network and interrupted mobile transfers require hardware checks.

## Mobile selection (D-269)

Camera and multiple file selection append to one transient list. A send snapshots
the pending batch and uploads serially, preserving the relay single-transfer limit.
Selection stays available; later additions await the next send. Retries keep the
same encrypted bytes/ID, saved items are skipped. Preview removal never deletes
an archived file. Maximum 24 entries / 80 MiB source blobs (20 MiB per file);
no persistent browser outbox. Camera/Folder SVG paths are copied unchanged from
installed Lucide 1.37.0 with ISC notice in HTML, no frontend dependency or CDN.

Photo thumbnails open a local modal with fit/original-size scrolling and restore
focus on close. No upload or selection change. Status is short; an explicit retry
action sends only that failed item, preserving transfer ID/ciphertext. PDF entries
remain placeholders; no third-party viewer is loaded.

## DOCX capability (D-272)

A new receiver encrypts `acceptsDocx: true` in the target. Only those sessions offer
DOCX selection. The encrypted envelope optionally keeps a bounded DOCX filename;
the relay still sees only opaque bytes. Mac uses the existing material import,
converts locally, and ACKs only after source/PDF publication. Word remains a file
placeholder; it is never a mobile image preview. Rejected input directs the user
to file/Mac error details; detailed archive messages stay local. Existing image/PDF
sessions and receivers remain compatible. No converter or office files on Beelink.

## Integrated camera (D-273)

`getUserMedia` replaces the external `capture=environment` input. Prefer the rear
camera, no audio; contain the entire video frame. Capture serial JPEG snapshots
(maximum 3200 px long edge, quality .94), append via the existing selection path,
and explicitly send afterwards. Close/cancel, pagehide, background and expired
session stop tracks; late permission results cannot reactivate the camera. Existing
file selection remains available on denial/failure. No automatic system-camera
fallback, new dependency, persistent outbox or server-side media processing.
Synthetic browser/VM checks do not replace actual Android/iPhone/iPad validation.
