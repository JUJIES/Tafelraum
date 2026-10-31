# Browserprüfungen

Der normale Einstieg steht in [CONTRIBUTING](../CONTRIBUTING.md). Alle folgenden
npm-Befehle laufen in `prototypes/surface-shell-a-b/` mit dessen Lockfile.
Playwright ist dort eine gepinnte Entwicklungsabhängigkeit, kein Produktionspaket.
Die bestehenden Node-Skripte bleiben erhalten; kein Wechsel des Testframeworks.
Skripte außerhalb des Appordners lösen Playwright über `createRequire` vom
App-`package.json` aus auf und laden es mit `require('playwright')`. Nicht den
CommonJS-Pfad aus `require.resolve` dynamisch als benannte ESM-Exporte importieren.

## Selbstständige Prüfungen

```sh
npm ci
npm run test:browser:install
npm run test:browser
```

| Prüfung | Einrichtung und Ausgabe |
| --- | --- |
| [Speichern/Stundenwechsel](storage-material-regression-browser-test.mjs) | Automatische synthetische API, echter Browsercache, eigener Vite-Server/Port. `output/storage-material-regression/`. Einzelaufruf: `npm run test:storage-material-browser`. |
| [Apphärtung](app-hardening-browser-test.mjs) | Leeres synthetisches Archiv, blockierte Fremdrequests, künstlicher Lerndeck-Anbieter und Desktop-IPC. Chromium/WebKit prüfen Verbindungsfreigabe, Abschalten, Reload, Remote-Einrichtung und fehlgeschlagenen/verzögerten Speicherabschluss. Keine native Prozessabnahme. `output/app-hardening-regression/`; `npm run test:hardening-browser`. |
| [Neutraler Agenteneinstieg](agent-onboarding-browser-test.mjs) | Leere Archivbasis ohne private Regeln/Fälle; echte CLIs und Lehreransicht, Demobildimport, native Objekte und Clips, Replay-/Revisionsschutz sowie bestätigte Speicherung/Reload in Chromium und WebKit. Kein Agentenmodell-/Druck-/Hardwaretest. `output/agent-onboarding/`; `npm run test:agent-onboarding`. |
| [Entwicklereinstieg](developer-start-browser-test.mjs) | Automatische Quellkopie, eigenes leeres Archiv, Build, Dev und Preview; Navigation anlegen/umbenennen/verwerfen/Papierkorb/wiederherstellen/reloaden einschließlich ganzer Lerngruppen, Abbruch und aktivem Stundenwechsel sowie echte Materialelemente mit Serialisierung und die reale Mermaid-/Sanitizer-Integration. Git muss verfügbar sein; keine ignorierten Unterrichtsmaterialien erforderlich. `output/developer-onboarding/`. Einzelaufruf: `npm run test:developer-start`. |
| [Clipnummern](clip-number-zoom-browser-test.mjs) | Automatisches synthetisches Archiv, echter Canvas/Room; Chromium und WebKit. Zuvor `npm run test:browser:install`, dann `npm run test:browser:clips`. `output/clip-number-zoom/`. |

`test:browser` prüft zuerst beide Browserstarts und führt dann Speichern,
Apphärtung und Entwicklereinstieg sequenziell aus. Keine Retries, übersprungenen Prüfungen oder
externen Dienstaufrufe als Erfolgsersatz. Einzeltests liefern ebenfalls einen
Fehlerstatus. Nicht mehrere Instanzen desselben Tests parallel starten: ihre
Berichtsordner sind bewusst fest. Die verwendeten Browserprofile sind flüchtig;
keinen produktiven Archivserver oder ein dauerhaftes Browserprofil verwenden.

`npm run test:browser:check` diagnostiziert einen fehlenden Browser vor dem
Erstellen von Servern/Testarchiven. Browserinstallation benötigt Internet und
Speicher im Playwright-Cache; `npm ci` allein lädt die Browser nicht herunter.
Für Linux-Systempakete und CI siehe Entwicklerleitfaden. Nach einem Update der
gepinnten Playwright-Version auch die Browser erneut installieren.

## CI

Der [GitHub-Actions-Workflow](../.github/workflows/ci.yml) verwendet die
Kernsuite unverändert auf macOS mit Node 24, zusätzlich zu Typprüfungen,
App-/Live-/Diensttests und Teilnehmerbuild. Er installiert Chromium und WebKit;
die optionale Clipprüfung in zwei Engines bleibt ein gesonderter Aufruf.
Bei Fehlern werden Logs und direkte JSON-/PNG-Ergebnisse der Kernchecks
sieben Tage gesichert. Keine rekursiven Quellkopien oder Archive hochladen.
Trigger, Statuscheck und aktuelle Aktivierungsgrenze stehen im
[Entwicklerleitfaden](../CONTRIBUTING.md). Erst der reale Actions-Lauf bestätigt
die Ausführung auf dem gehosteten Runner.

## Fachprüfungen mit eigenen Voraussetzungen

Diese vorhandenen Skripte sind gezielte Abnahmen. Ein frischer Checkout enthält
nicht automatisch ihre Materialien oder laufenden Dienste. Ihre bisherigen
CLI-Argumente bleiben kompatibel; einige erwarten weiterhin einen expliziten
Playwright-Modulpfad bzw. ein installiertes Chrome. Das ist kein zusätzlicher
Schritt für die oben beschriebene Kernprüfung.

| Bereich | Vorhandene Skripte / Voraussetzungen |
| --- | --- |
| Remote/Clips/Timer | `live-canvas-*-browser-test.mjs`, `timer-remote-browser-test.mjs`, `timer-dial-browser-test.mjs`, `html-text-cover-browser-test.mjs`: je nach Skript zuvor synthetischen Host über `live-canvas-browser-check.mjs` starten; Teilnehmerbuild und Live-Dienstabhängigkeiten erforderlich. Ports/Modi im Skriptkopf und [Live-Betrieb](../docs/implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md). |
| Stift-/Projektionsleistung | `ink-performance-browser-test.mjs`, `live-ink-performance-browser-test.mjs`: eigener Performancehost und Parameter, kein allgemeiner Setupcheck. Ergebnisse sind geräteabhängig. |
| Video und generisches HTML | `room-video-controller-browser-test.mjs`, `generic-html-shared-browser-test.mjs`: vorbereitete synthetische MP4s in den jeweiligen Ausgabeordnern; Codec-/Audioabnahme. [Medienprüfstand](../docs/implementation/43_HTML_MEDIA_INTEGRATION_TEST.md). |
| GLT, Language Bites und Materialauswahl | `glt-*-browser-test.mjs`, `language-bites-shared-browser-test.mjs`, `html-playback-restore-browser-test.mjs`, `material-selection-browser-test.mjs`: jeweils vorbereitete Paket-/Archivkopien. [HTML-Vertrag](../docs/implementation/04_INTERAKTIVE_HTML_MATERIALIEN.md) und [Bite-Prüfstand](../docs/implementation/44_LANGUAGE_BITES_SENTENCE_CHECK_TEST.md). |
| Lerndeck | `lerndeck-*-browser-test.mjs`: zusätzliche Anbieterinstanz bzw. Anbieter-URL, kein Fixture aus privaten Unterrichtsdaten. [Apps-UI-Vertrag](../docs/design/12_EMBEDDED_APPS_UI_BRIEF.md). |

Vor Ausführung die konkreten Pfade/Ports und den zuständigen Prüfstand lesen.
Keine automatischen Kopien aus dem produktiven Archiv anlegen, um fehlende
Fixtures zu überbrücken. Weitere Fachtests schrittweise mit selbst erzeugten
oder versionierten neutralen Fixtures anschließen, statt sämtliche historischen
Abnahmen in einen irreführenden grünen Sammelbefehl aufzunehmen.

Der Entwicklereinstieg lädt die rein browserseitige Dependency-Prüfung erst im
Test. Ihre direkten Abhängigkeiten werden vorab im Test-Vite optimiert, damit
keine spätere Neuoptimierung einen beabsichtigten Reload mitten in einer
Prüfgeste auslöst. Produkt-Vite, Assertions und Fehlerstatus bleiben erhalten.


Der neutrale Agentenerstlauf liest das von der laufenden App bereitgestellte
Agentenpaket, prüft dessen Dialog und verwendet die enthaltenen CLIs. Zusätzlich
zur Bild-/Canvas-/Clipkette wird ein neutrales HTML-Beispiel über die normale
Archivpipeline übernommen; das AB-Beispiel durchläuft das technische Druckgate.
Keine automatische Agenten-/Modellinstallation und keine echte Druckfreigabe.

## Oberflächensprache

`npm run test:ui-language` ist ein selbstständiger Kerncheck für Deutsch/Englisch
und offene Room-Fenster. Eigenes leeres Testarchiv, keine privaten Dienste oder
Modelle. Chromium und WebKit wie in der Kernsuite installieren. Belege unter
`output/ui-language-browser/`; Bestandteil von `npm run test:browser`.


`npm run test:ui-settings` prüft Version in Einstellungen, Tastatur/Fokusrückgabe,
Hell/Dunkel und schmales Fenster, Room-Einklappen und Wiederöffnen sowie native
Updateevents, Fehler und Präsentationsschutz über simulierte IPC. Der öffentliche
Profilcheck verlangt Versionsinfo ohne Updatebefehle. Ausgabe:
`output/ui-settings-browser/`; Bestandteil von `npm run test:browser`. Kein echter
nativer Installationsversuch.

Der Agentenerstlauf prüft zusätzlich die Room-HTML-Eingabesperre bei zurückgehaltenen
Hostbestätigungen: Pointer-/Tastaturfreigabe erst für die bestätigte Ansicht,
Clipwechsel und unveränderte Speicherung/Reload. Keine pauschalen Wartezeiten
oder abgeschwächten Eingabeerwartungen.

Der Einstellungscheck umfasst auch die gruppierten Bereiche, das48px hohe
Design-Auswahlcontrol und interne Scrollbarkeit bei800×480px. Die Sprachprüfung
prüft das native Sprachdropdown mit Flagge und Namen einschließlich
Buchstabenauswahl, Reload und geöffneter Room-Ansicht. Der Einstellungscheck
vergleicht Höhe/Breite mit der vorhandenen Designauswahl.
