# Hilfsprogramme: Einstieg und Wirkung

Für den normalen Einstieg [CONTRIBUTING](../CONTRIBUTING.md) verwenden.
`scripts/` ist kein gemeinsames Installationsprogramm. Hier liegen wiederholbare
Entwicklerprüfungen, Fachabnahmen und Programme für den persönlichen Betrieb.
Die bestehenden Pfade bleiben stabil, weil Verträge und Skills darauf verweisen.

## Ohne persönliche Einrichtung

| Aufgabe | Einstieg | Wirkung / Voraussetzung |
| --- | --- | --- |
| App-, Live- und Diensttests | npm-Befehle in [CONTRIBUTING](../CONTRIBUTING.md) | Neutrale Fixtures; App-Lockfile bzw. Dienst-Lockfile installieren. |
| Browser-Kernsuite | `npm run test:browser` im Appordner | Eigene temporäre Daten, freie Loopback-Ports; Chromium installieren. Einzelprüfungen und Fachtests im [Browserkatalog](BROWSER_TESTS.md). |
| Lizenzinventar | [audit-dependency-licenses.mjs](audit-dependency-licenses.mjs) | Liest lokale Lockfiles/Cargo-Metadaten, schreibt eine neue Berichtsdatei. Keine Downloads oder rechtliche Freigabe. [Anleitung](../docs/implementation/51_LICENSE_EVIDENCE.md). |
| Eigene Projektbedingungen prüfen | [check-project-license.mjs](check-project-license.mjs) | Roottext, npm-/Cargo-Verweise, bytegleiche Webkopie und deklarierte Assethashes; `--built app`/`--built live` prüft fertige Builds. Automatisch in beiden Builds, keine juristische Freigabe. |
| PDF.js-Lizenztexte prüfen | [check-pdf-license-notices.mjs](check-pdf-license-notices.mjs) | Liest installierte Originale und `public/`; mit `--built` zusätzlich den bestehenden `dist/`-Stand. Auch Teil von `npm run build`. |
| Webschriften/Notices prüfen | [check-web-license-notices.mjs](check-web-license-notices.mjs) | Lesender Versions-/Font-/Texthashcheck, mit `--built app` oder `--built live` auch im echten Build; automatisch in den npm-Builds. [Vertrag](../docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md). |
| Mitgegebene Fremdtexte/-quellen prüfen | [check-source-distribution.mjs](check-source-distribution.mjs) | Lesende Hashprüfung der konkret im Quellrepository vorhandenen33 Nachweise; kein Binärinventar. [Umfang](../SOURCE_DISTRIBUTION.md). |
| Agenten-Erstlauf prüfen | [agent-onboarding-browser-test.mjs](agent-onboarding-browser-test.mjs) | Isolierter vollständiger CLI-/Browserablauf ohne private Regeln; im Appverzeichnis `npm run test:agent-onboarding`, auch Teil der Kernsuite. |
| Distributionsumfang prüfen | [check-distribution.mjs](check-distribution.mjs) | Prüft persönliche/öffentliche Adapter, Quellausschlüsse und native Updatekonfiguration vor Tests/Builds und in CI. |
| Lokalen Quellkandidaten erzeugen | [prepare-public-source.mjs](prepare-public-source.mjs) | Schreibt eine neue Kopie und ein Manifest unter `output/`; kein Überschreiben, Git-Commit oder Upload. [Grenzen](../docs/implementation/49_PUBLIC_SOURCE_PREPARATION.md). |

Die Quell-/Lizenzwerkzeuge erklären mit `--help` Aufruf und Wirkung,
ohne ihre eigentliche Arbeit auszuführen. Vom Repository-Root beispielsweise:

```sh
node scripts/prepare-public-source.mjs --help
node scripts/audit-dependency-licenses.mjs --help
node scripts/check-pdf-license-notices.mjs --help
node scripts/check-project-license.mjs --help
```

Tests immer über ihre dokumentierten npm-Einstiege starten. Die expliziten
Testlisten gehören in `prototypes/surface-shell-a-b/package.json`; ein neues
`*.test.*` wird nicht allein durch seinen Dateinamen Teil der Suite.

## Fachwerkzeuge mit bewusstem Datenziel

| Bereich | Programme | Vertrag / Grenze |
| --- | --- | --- |
| Unterricht und Canvas | [tafelraum-unterricht.mjs](tafelraum-unterricht.mjs), [tafelraum-canvas-agent.mjs](tafelraum-canvas-agent.mjs), [read-student-notes.mjs](read-student-notes.mjs) | Stunden-/Canvasbefehle können im bezeichneten Archiv schreiben; Notizleser zeigt private Daten. [Unterrichtsagent](../docs/implementation/47_TEACHING_AGENT.md), [Canvas-Agent](../docs/implementation/45_CANVAS_AGENT.md), [Notizen](../docs/implementation/46_STUDENT_NOTES.md). |
| HTML-Material | [check-interactive-material.mjs](check-interactive-material.mjs), [install-interactive-material.mjs](install-interactive-material.mjs) | Prüfung und additive Installation sind verschiedene Aktionen. Paketvertrag und Druckfreigabe im [HTML-Vertrag](../docs/implementation/04_INTERAKTIVE_HTML_MATERIALIEN.md). |
| Archivdiagnose und Sicherung | [archive-doctor.mjs](archive-doctor.mjs), [create-archive-backup.mjs](create-archive-backup.mjs), [verify-archive-backup.mjs](verify-archive-backup.mjs), [prune-archive-backups.mjs](prune-archive-backups.mjs) | Diagnose ist lesend; Backup erzeugt Dateien und kann am festgelegten Standardziel alte Sicherungen ausdünnen. [Backupvertrag](../docs/implementation/03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md) zuerst lesen. |
| Eingefrorene Builds | [snapshot-build-source.mjs](snapshot-build-source.mjs), [prune-build-artifacts.mjs](prune-build-artifacts.mjs) | Snapshot schreibt unter `output/`; Prune zeigt standardmäßig nur die Vorschau, `--apply` bereinigt. Verlinkte Dependencies nicht im Snapshot neu installieren. [Desktopvertrag](../docs/implementation/09_DESKTOP_APP_UND_UPDATES.md). |
| Schriftquellen forensisch vergleichen | [verify-liberation-source.py](verify-liberation-source.py) | Optionales lesendes Analysewerkzeug mit Python/fontTools; normaler Start/Build braucht es nicht. Exakte Eingaben und Grenzen in [Prüfstand54](../docs/implementation/54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md). |
| Native Lizenztexte vorbereiten | [prepare-runtime-notices.mjs](prepare-runtime-notices.mjs) | Prüft generierte Desktopressourcen und kopiert den vollständigen Node-Lizenztext dorthin. Schreibt ausschließlich in das angegebene Buildziel; kein Aufruf gegen eine installierte App. [Vertrag](../docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md). |
| Optionale Laufzeiten | `prepare-office-runtime.mjs`, `provision-document-image.mjs`, `document-image-qa.mjs`, `mobile-capture-qa.mjs` | Benötigen ihre dokumentierten Laufzeiten bzw. Konfigurationen; kein allgemeines Onboarding. [DOCX](../docs/implementation/39_DOCX_IMPORT_TEST.md), [Bildaufbereitung](../docs/implementation/37_DOCUMENT_IMAGE_PILOT.md), [Aufnahme](../docs/implementation/35_MOBILE_CAPTURE_PILOT.md). |

`prepare-*-test.mjs`, `*-qa.mjs` und `*-browser-test.mjs` können Fachfixtures
oder bereits vorbereitete Archivkopien voraussetzen. Ihre Pfade und Argumente
vor Ausführung im Skriptkopf und zugehörigen Prüfstand lesen. Sie sind nicht
automatisch selbstständige Tests. Der Browserkatalog benennt diese Grenzen.

Die Apphärtungsprüfung `app-hardening-browser-test.mjs` ist Teil der Kernsuite;
Details und Ergebnispfade im [Browserkatalog](BROWSER_TESTS.md).

## Betriebs- und historische Programme

- `deploy-live-canvas.*`, `deploy-mobile-capture.*` sowie die nativen Build-/
  Publishskripte im Appordner greifen auf konfigurierte Zielsysteme zu.
  Sie gehören nicht zum Entwicklungsstart. Maßgeblich sind
  [Live-Betrieb](../docs/implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md) und
  [Desktopauslieferung](../docs/implementation/09_DESKTOP_APP_UND_UPDATES.md).
- `migrate-unterricht-archive.mjs`, `migrate-current-tafelraum-profile.mjs` und
  `split-legacy-ler-materials.mjs` dienen bestimmten Datenübergängen. Ein frisches
  Entwicklungsarchiv wird über den Entwicklerleitfaden initialisiert.
- `start-tafelraum.sh`, `install-tafelraum-desktop-app.sh` und
  `tafelraum-desktop.applescript` sind historische persönliche Chrome-Starter.
  Sie bleiben als Altbestand erhalten und werden aus dem öffentlichen
  Quellkandidaten ausgeschlossen. Sie sind kein unterstützter Installationsweg.

Neue Helfer beschreiben am Einstieg Zweck, Voraussetzungen, Datenziel und
Schreibwirkung. Wiederholbare Prüfungen verwenden neutrale Daten und den
gepinnten lokalen Abhängigkeitspfad; Fachabnahmen behalten ihre ausdrücklich
benannten Voraussetzungen. Neue Parallelmodelle oder globale Werkzeuge sind
dafür nicht nötig.

## Produktions-Laufzeitprobe

`node scripts/release-runtime-check.mjs` baut die echte Shell und die bestehende
Canvas-/Room-Testseite im Produktionsmodus. Eigenes temporäres Archiv, freier
Loopback-Port und flüchtiges Chromiumprofil; keine persönliche Konfiguration.
Fünf Starts mit neuen Profilen,50 unmittelbare Einfüge-/Speicherfolgen und60
Room-Start-/Ende-Zyklen. Mit `TAFELRAUM_ROOM_CYCLES=600` verlängerbar (maximal1000).
Ergebnis unter `output/release-runtime-check/report.json`; vorherige Berichte vor
erneutem Lauf selbst sichern. Benötigt die vorhandenen App-Dependencies und
Playwright-Chromium. Kein nativer Update-/Touch- oder mehrstündiger Medientest.


`prepare-agent-kit.mjs AUSGABEORDNER` erzeugt ausschließlich das begrenzte lokale
Agentenpaket aus kanonischen Projektdateien. Vite und Desktop-Ressourcenbau nutzen
diesen gemeinsamen Weg. Kein Archivkontakt oder globaler Skillinstaller.
`agent-kit.test.mjs` prüft Paket, bestehende Prüfer/Installer und Discoverygrenze;
der echte Erstlauf verwendet die von der App gelieferten Helfer.

`ui-language-browser-test.mjs` prüft Sprache, lokale Präferenz, Inhalte und
Lehrer-/Room-Wechsel mit eigenem Testarchiv in Chromium und WebKit. Aufruf aus
dem Appordner: `npm run test:ui-language`; Teil der Browser-Kernsuite.


`ui-settings-browser-test.mjs` prüft die gemeinsamen Einstellungen/Versionsinfo
und das neutrale Room-Einklappen mit Chromium/WebKit in isolierten Archiven.
Native Updateevents werden ausschließlich an der IPC-Grenze simuliert; öffentlich
sind Updatebefehle ausgeschlossen. `npm run test:ui-settings` im Appordner.


`button-states-browser-test.mjs` prüft echte Dialogkomponenten mit synthetischen
Eingaben und abgefangenen lokalen API-Antworten: Bildverbesserung,
Entwurfswiederherstellung, Handyempfang, Notizen/Namensliste, Tastenkürzel sowie
persönlich KI-Einstellungen. Chromium/WebKit, Hell/Dunkel, Hover/Fokusgleichheit,
semantische Primäraktionen und deaktivierte Buttons. Keine laufende App, echten
Schlüssel oder Archive. `npm run test:button-states`; Teil der Browser-Kernsuite.
Die tatsächlichen Material-Duplikat-/Entfernen-Dialoge und Room werden zusätzlich
im Einstellungscheck geprüft. Belege unter `output/button-states-audit/`.


Im persönlichen Maintainer-Checkout zeigt `node scripts/dev.mjs status` die
tatsächlichen Entwicklungsquellen und ihre Abweichungen. `start beide` startet
die Vorschauen, `refresh public` aktualisiert die öffentliche Arbeitskopie.
Die getrennten Prüfwege für Unterrichtsinstallation, Kollegenupdate und Git
stehen im [Standregister](../docs/WORKING_STATES.md).
