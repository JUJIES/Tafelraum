# Sechs Textgriffe und Trackpadbedienung – D-265

16. Oktober 2026, nach 0.1.57. Vier Ecken skalieren proportional, zwei Seitengriffe ändern Breite/Umbruch; keine mittigen vertikalen Griffe. 48-px-Trefferflächen mit nächstem Griff bei Überlappung und reserviertem innerem Bewegungsbereich. Sichtbare Griffe und Tastaturfokus folgen Theme und Zoom. Textaktionen halten Abstand zu Transformationszielen. UI-Vertrag: `docs/design/22_TEXTBOX_HANDLES_UI_BRIEF.md`.

## Implementierung

Gemeinsame `TextBoxHandles` und `text-box-geometry`, native Textmessung beziehungsweise vorhandenes Rich-Text-Layout in `text-box-transform`. Lehrer-Geste nutzt bestehende native Revisionen und Restore/Commit für einen Undo-Schritt. Lokaler Room sendet validierte Absicht, Host misst kanonisch; keine Textwerte als Schreibbefehl. Größe/Drehung erhalten Gruppen und Scrollanker; kein Dropabschluss. Formtext/Mehrfachauswahl unverändert. Rich-Text-Rasterübergabe installiert Referenzen vor Dateien und heilt fehlende rekonstruierbare Bytes. Room blendet alte abgeleitete Raster während der bestehenden flüchtigen Vorschau aus und verwendet denselben Rich-Text-Painter.

## Geprüft

344 App-/Archivtests, 113 Live-/Room-Tests und beide Typprüfungen erfolgreich. Geometrie schützt alle Ecken bei Drehung, gegenüberliegende Anker, seitlichen Reflow, versetzten Griffstart ohne Sprung, Überlappungen/kleine Texte und Trefferfläche bei 25–400 % Zoom. Transformationsprüfungen schützen Rich-Text-Spannen, Bindung, erlaubte Absichten, echte Sperren sowie abgeleitete Vorschau/Rollback und fehlende Bildbytes.

Separate native ARM64-QA mit neutralem Zwei-Blatt-Profil: Griffstart neben sichtbarer Ecke skaliert Schrift 28 → 37,722 px; einmal Undo stellt 28 wieder her, Redo stellt Größe wieder her. Seitliche Verengung 215,556 → 171,111 bei gleicher Schrift. Kleine Textbox im Inneren um 60 Bildschirm-Pixel verschoben, Schrift24 unverändert. Keine Blattbewegung; Archivdatei bestätigt gespeicherte Geometrie und Bindung. Browser prüft zusätzlichen proportionalen und seitlichen Rich-Text-Transform bei erhaltenem Kursiv/Unterstrichen und gemischten Schriftgrößen.

Zwei getrennte Browseransichten mit lokalem Room-Kanal: Plain-Text-Seitengriff startet 14px neben sichtbarem Griff, ändert Umbruch bei Font28; Ecke skaliert auf37,454. Room-Undo/Redo und Hostdatei bestätigen Bindung/Geometrie. Rich-Text-Ecke startet13px neben Griff und skaliert alle Stile, Seitengriff und fokussierte Pfeiltasten ändern nur Breite; finale Darstellung bleibt ohne graue Ersatzbox oder doppelte alte Grafik. Bestätigter Host und Room zeigen dieselbe Schrift/Geometrie. Lehrer: Drehgriff per Pfeiltaste dreht15°, Undo stellt zurück; fokussierte Ecke vergrößert danach5% bei erhaltener Formatierung. Reload hat den über Room gespeicherten Stand erhalten. Helles/dunkles Theme zeigen kontrastreiche Griffe; Textaktionen überlappen den Drehgriff nicht. Belege unter `output/text-grips/`.

## Grenzen

Native QA deckt Text auf HTML sowie kleinen Text ab; die letzten Rich-Text-Cache-/Room-Korrekturen und Fokuspolitur sind zusätzlich im Browser geprüft. Das vorhandene Rich-Text-auf-HTML-Rendition-Layering war im synthetischen Ausgangsstand bereits auffällig; Rich-Text-Prüfung fand deshalb auf freier Fläche statt und bestätigt keinen Fix dieser separaten Darstellung. Native UI-Automation war zeitweise durch wechselnde aktive Fenster begrenzt; wirkungslose Automationsgesten zählen nicht als bestandene Tests. Reale Trackpad-Haptik, Touch/Stift/Smartboard und Zweitdisplay bleiben Hardwareabnahme. Keine produktiven Unterrichtsdaten geändert.

## Release

0.1.58 in Vorbereitung; Paket-/Signatur-/Datenerhaltprüfung und Veröffentlichungsstatus werden nach Abschluss hier ergänzt.


### Abschluss / Veröffentlichung

16. Oktober 2026: 413 eingefrorene Quellfingerprints unter `output/release-0.1.58/source/`; vor Paketbau keine Quelldrift. 344 App-/Archiv- und113 Live-/Room-Tests, Rust-Test, beide Typprüfungen und Builds bestanden. Signiertes ZIP ohne Laufzeitdaten, Codesign/Updater-Signatur gültig. Datenerhalt mit unveränderten Paketservern .57 → .58: sechs synthetische Dateien bytegleich.

Finale separate native QA mit allen207 Ressourcen bytegleich zum portablen Paket bestätigt Version0.1.58, Griffstart14px neben Quadrat, proportionale Vergrößerung Font28 →35,5 auf HTML und anschließende Seitengriffverengung bei gleicher Schrift. Freier Rich Text mit Kursiv/Unterstrichen/mischenden Größen ist im finalen Paket ebenfalls proportional skalierbar und wird ohne graue Ersatzgrafik dargestellt. Eine native Automationsgeste führte zu einem unerwarteten Kameraversatz; nach `Inhalt finden` blieb die Kamera bei der wiederholten Rich-Text-Geste stabil. Ursache nicht nachgewiesen, daher Beobachtungspunkt; keine behauptete Reparatur. Eine zunächst wirkungslose Geste begann an einer falsch abgelesenen Bildschirmhöhe.

Reguläres Beenden und echter Neustart erhalten alle fünf kanonischen Quellen einschließlich Text, Stilen, Geometrie, Gruppen/Scrollanker und Kamera exakt. Nur die rekonstruierbare Rich-Text-Rendition erhält neue technische Zufalls-/Versionswerte (`restart-check.json`). Das aktualisiert die oben vorläufige Browserbeschränkung für die letzte Rich-Text-Cachekorrektur: auch im finalen nativen Paket geprüft; Rich-Text-auf-HTML und Hardwaregrenzen bleiben wie beschrieben.

Atomar über bestehenden Beelink-Kanal veröffentlicht, öffentlicher Rückdownload und kryptografische Signatur geprüft (`publish.log`). Updater-SHA-256 `847ba004e5e006bf2ee6c65ff5a8d4188b855c45cea8e615f70057aa1e051390`. Produktive App nicht installiert/neu gestartet und kein produktives Archiv verändert. Nach Veröffentlichung ergänzte Test-/Releasedokumentation wird separat fingerprintet. Eine entfernte nachlaufende Leerstelle in JSX verändert den Build nicht; Bytegleichheit des erneuten Frontendbuilds wird separat belegt.
