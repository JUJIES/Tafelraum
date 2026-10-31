# Surface Lab – aktuelle Tafelraum-App

Dieses Verzeichnis enthält die heute verwendete Tafelraum-App. `surface-shell-a-b`
ist ein historischer Name, kein zweiter oder veralteter Appstand.

**Neu im Projekt:** zuerst den [Entwicklerleitfaden](../../CONTRIBUTING.md) für
Node-Version, Abhängigkeiten, eigenes Testarchiv und das mitgelieferte Demoasset
lesen. Es gibt kein npm-Workspace am Repository-Root.

## Laufzeiten

| Laufzeit | Start / Ausgabe | Datenbezug |
| --- | --- | --- |
| Gebaute Browserprobe | `npm run build`, dann `desktop-server.mjs` mit expliziten Testpfaden laut Entwicklerleitfaden | Derselbe HTTP-Dienst wie im nativen Host, getrennte Testdaten |
| Browserentwicklung | `npm run dev -- --port 5173 --strictPort` | Vite plus lokale API-Plugins, eigenes Entwicklungsarchiv |
| Vite-Produktionsprobe | `npm run start:local` | Baut `dist/` und startet Preview mit derselben Archivkonfiguration |
| Installierte macOS-App | Tauri-App öffnen; Ursprung `http://127.0.0.1:49317` | Gebündelter Node-Dienst, app-eigenes Datenprofil |
| Remote-Teilnehmer | `npm run build:live` → `dist-live/` | Separater Viewer ohne Archivnavigation/-API; benötigt den Live-Dienst |

Die Browserbefehle setzen das zuvor eingerichtete Testarchiv voraus. Der
Vite-Archivplugin erzeugt selbst kein leeres Archiv; ohne Konfiguration verwendet
er `../../data/unterrichtsarchiv/`. Archivinitialisierung und die
geprüften Startbefehle stehen im [Entwicklerleitfaden](../../CONTRIBUTING.md).
`start:local` ist eine Browserprobe, keine Installation oder Aktualisierung der
nativen App.

Der alte Chrome-/AppleScript-Starter in `../../scripts/start-tafelraum.sh` und
`install-tafelraum-desktop-app.sh` gehört zum früheren Betriebsweg. Er ist nicht
der aktuelle Installationsweg. Native Builds, Profile und Updates beschreibt
[Desktop-App und Updates](../../docs/implementation/09_DESKTOP_APP_UND_UPDATES.md).

## Orientierung im Code

| Einstieg | Zuständigkeit |
| --- | --- |
| [`src/App.tsx`](src/App.tsx) | Shell, Katalogaktionen, Stundenwechsel und Verbindung der Bereiche |
| [`src/ArchiveNavigation.tsx`](src/ArchiveNavigation.tsx) | Unterrichtsbaum, Inline-Eingaben, Kontextmenü, Sortier- und Kopierzustände; bestehende App-Callbacks für Änderungen |
| [`src/lesson-labels.ts`](src/lesson-labels.ts) | Gemeinsame Datums-/Titelanzeige einschließlich bestehender Browsercache-Kompatibilität |
| [`src/canvas/material-elements.ts`](src/canvas/material-elements.ts) | Engine-native Materialobjekte und Herkunftsangaben; keine Speicherung oder eigene Einfügepipeline |
| [`src/canvas/canvas-port.ts`](src/canvas/canvas-port.ts) | Grenze zwischen App und Canvas-Engine |
| [`src/canvas/CanvasSurface.tsx`](src/canvas/CanvasSurface.tsx) | Excalidraw-Adapter, Szenen-/Eingabelogik und Materialprojektionen |
| [`src/archive-file-persistence.ts`](src/archive-file-persistence.ts), [`src/canvas/canvas-persistence.ts`](src/canvas/canvas-persistence.ts) | Archivzugriff, Revisionen, Schreibqueues, Browsercache und Assetpersistenz |
| [`archive-server.mjs`](archive-server.mjs) | Lokaler Katalog-, Stunden- und Materialzugriff im Dateisystem |
| [`desktop-server.mjs`](desktop-server.mjs), [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs) | Gebündelter HTTP-Dienst und nativer Host mit eigenem Profil |
| [`src/live/`](src/live/) | Projektion, Remote-Host/Viewer und lokale Room-Kommunikation |
| [`src/widgets/`](src/widgets/) | Timerdarstellung und gemeinsame Hostlaufzeit |
| [`src/StudentNotes.tsx`](src/StudentNotes.tsx), [`student-notes-store.mjs`](student-notes-store.mjs) | Private Kursnamen/Stundennotizen, getrennt von Canvas und Präsentation |

App-Shell und Lesson-Domäne besitzen das Archiv, nicht die Canvas-Engine.
Bilder/PDF-Seiten verwenden Rasterassets. Audio, Video, YouTube, HTML und Widgets
halten persistierbare Canvasgeometrie; ihre sichtbare Oberfläche wird daraus
abgeleitet. Die Navigation besitzt keine zweite Katalogablage. `CanvasSurface` bleibt für
Einfügen, Verlauf und Szenenabgleich zuständig; die Materialfabrik erzeugt nur
Elemente für diese bestehenden Wege.

Öffentliche Ansichten erhalten bereinigte Projektionen und schreiben
sie nicht als Lehrerdokument zurück.

## Distributionsumfang

`distribution.json` und `node ../../scripts/check-distribution.mjs` beschreiben
und prüfen den Umfang: persönlicher Stand mit Experimenten oder öffentlicher
lokaler Kern mit Room Canvas und BYOA. Im öffentlichen Export fehlen Lerndeck,
KI-Anschluss, Remote-Dienst/Viewer und JUJIES-Updater. Die nachfolgenden Remote-
und Releaseangaben sind persönliche Erweiterungen, keine öffentlichen Startschritte.
[Vertrag61](../../docs/implementation/61_DISTRIBUTION_BOUNDARY.md).

## Prüfungen

Die vollständigen Befehle und Voraussetzungen stehen im
[Entwicklerleitfaden](../../CONTRIBUTING.md). Aus diesem Verzeichnis:

```sh
npm run typecheck
npm test
npm run typecheck:live
npm run test:live
npm run build
# Nur persönliche Distribution mit Remote-Dienst:
# npm run build:live
```

`build` und `build:live` prüfen über npm-Hooks auch die Original-Lizenztexte
und die tatsächlich ausgelieferten Schriftdateien. Native Ressourcen ergänzen
die passende Node-Lizenz. Nachweise und verbleibende Assetfragen in
[Prüfstand52](../../docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md).

`npm test` führt über `pretest` auch die HTML-Playbacktests aus. Live-/Roomtests
sind ein eigener Aufruf. `build:live` ersetzt `typecheck:live` nicht.
Die selbstständige Browser-Kernsuite startet nach `npm ci` mit
`npm run test:browser:install` und `npm run test:browser`, ohne externe Modulpfade
oder private Testdaten. Zusätzliche Clipprüfung und Fachtests sind im
[Browser-Testkatalog](../../scripts/BROWSER_TESTS.md) eingeordnet.

Browser-, native und echte Hardwareabnahmen werden zusätzlich nach betroffenem
Workflow gewählt; ein erfolgreicher Webbuild bestätigt keine Touchbedienung.

## Verträge vor Änderungen

- [Materialprojektion](../../docs/implementation/02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md)
  und [lokales HTML](../../docs/implementation/04_INTERAKTIVE_HTML_MATERIALIEN.md).
- [Materialbereich](../../docs/design/04_LESSON_MATERIAL_DRAWER_UI_BRIEF.md),
  [Room-Eingaben](../../docs/design/20_ROOM_CANVAS_INPUT_UI_BRIEF.md) und
  [Timer](../../docs/design/21_TIMER_WIDGET_UI_BRIEF.md).
- [Archiv, Sicherung und Wiederherstellung](../../docs/implementation/03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md).
- [Live-Betrieb](../../docs/implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md) und
  [gemeinsamer Wire-Vertrag](../../shared/live-canvas/protocol.ts).
- [KI-Satzprüfung](../../docs/implementation/44_LANGUAGE_BITES_SENTENCE_CHECK_TEST.md),
  [Canvas-Agent](../../docs/implementation/45_CANVAS_AGENT.md),
  [private Stundennotizen](../../docs/implementation/46_STUDENT_NOTES.md) und
  [Unterricht organisieren](../../docs/implementation/47_TEACHING_AGENT.md).

Aktuelle Installation/Veröffentlichung steht in der [Haupt-README](../../README.md)
und im Desktopprotokoll. Frühere Bedien- und Engineexperimente sind im
[Decision Log](../../docs/implementation/DECISION_LOG.md) nachvollziehbar; sie
werden hier nicht als heutige Produktlogik wiederholt.

## Sprache der Oberfläche

In den Einstellungen über `🇩🇪` / `🇬🇧` zwischen Deutsch und Englisch wechseln. Die Wahl bleibt lokal gespeichert und erreicht auch bereits geöffnete
Room-Fenster. Unterrichtsinhalte bleiben unverändert. Neue eigene UI-Texte über
`src/i18n/` pflegen; [Vertrag64](../../docs/implementation/64_UI_LANGUAGE.md).
`npm run test:ui-language` prüft den Ablauf isoliert in Chromium und WebKit und
ist auch Teil von `npm run test:browser`.
