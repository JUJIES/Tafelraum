# Download pages

2026-11-02. Companion distribution pages, separate from the teaching app shell.

Users choose one app download from an explicitly identified edition. MDM is
German and follows the colleagues updater; Public is English and follows the
published Git source. The question is whether a shared link makes the edition,
released version and correct installation guide immediately clear.

One primary action: download the current package for Mac / Apple Silicon.
Secondary links: installation guide, version archive, public source where relevant.
Keep checksums under a disclosure. No upload, login, teaching archive, tracking,
dashboard, platform promises or security-settings controls. Loading/unavailable
states must hide the download link rather than guess a filename.

Copy: "Kollegen / MDM · Vollfassung", "Tafelraum herunterladen",
"Version {version} für Mac herunterladen", "MDM-Installationsanleitung lesen",
"Ältere Versionen"; Public uses "Public Edition", "Download Tafelraum",
"Download {version} for Mac", "Read the installation guide", "Older releases".
The error state names download unavailability and a next action.

Use the same calm typography, spacing and single emphasized button in both
editions. Validate desktop and narrow mobile widths, real links and profile
mismatch rejection. Browser checks do not establish smartboard/touch acceptance.

## Public Mac/Windows extension (2026-11-04)

For an accepted combined release, Public adds one labelled `Platform` selector:
`Mac · Apple Silicon` / `Windows · x64`. Keep one download button. The selection
changes its exact artifact, guide and disclosed checksum together. Preselect
Windows only when the browser identifies Windows; the user can always change it.
Mac-only historical releases and MDM retain their existing appearance.
Windows copy: `Download {version} for Windows`; guide remains
`Read the installation guide`. No unavailable platform option or guessed asset.
If a combined manifest is incomplete/mismatched, hide download controls and show
the existing unavailable state. Test both selections, narrow layout and tampered
metadata before deployment. This extension does not itself publish a release.
