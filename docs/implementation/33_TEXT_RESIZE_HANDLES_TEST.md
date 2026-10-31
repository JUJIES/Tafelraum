# Textbox-Größenänderung – Korrektur nach D-264

16. Oktober 2026. Nutzerbefund nach 0.1.56: Eckgriff einer einzeln ausgewählten Textbox verschiebt den Text statt ihn zu skalieren. Eigene native QA-App mit neutralem Zwei-Blatt-Archiv reproduziert dies; Schriftgröße bleibt 28, Position verändert sich. Die Bewegungsabnahme von D-264 hatte native Text-Größenänderungen nicht abgedeckt.

## Korrektur

Der Capture-Handler der unabhängigen Annotationbewegung gibt native Text-Griffgesten vor dem Fokus-/Treffertest frei. Über HTML reicht die passive SVG-Oberfläche den Zeigerstart mit unveränderter ID, Position und Modifikatortasten an dieselbe interaktive Enginefläche weiter. Kein eigener Skalierungsweg. Sichtbare HTML-Textgriffe und ihre Trefferflächen teilen die nativen Abstände einschließlich Drehgriff; die vorhandenen SVG-Griffe nehmen die Geste an, ohne das darunterliegende Eingabefeld auszulösen. Textinneres bleibt nach D-264 unabhängig beweglich.

Native Transformationen können Elemente innerhalb derselben Szenenliste verändern. Die Speicherentscheidung berücksichtigt zusätzlich die öffentliche Engine-Szenenversion; Listenidentität allein verpasste diese Änderungen. Archivschema, Bindungen, Browser-Outbox und Room-Vertrag bleiben unverändert. Keine Bestandsmigration.

## Prüfstand

Fünf gezielte Geometrieprüfungen für Ecken, Seiten, Drehung, kleine Textbox, Zoom/Pan sowie Maus/Stift/Touch-Trefferflächen. Nativer ARM64-Test über eigene App-ID `app.jujies.tafelraum.qa-marker-recovery`, Port 49524; produktives Profil unberührt. Bereits beobachtet: Wiederholtes Vergrößern/Verkleinern am HTML-Text, seitliche Breitenänderung mit Zeilenumbruch. Abgeschlossen mit den finalen, bytegleichen 207 Paketressourcen: Eckgriff auf HTML skaliert 28 → 39,67 → 31,89 px ohne Blattbewegung. Seitengriff ändert Breite/Umbruch bei gleicher Schriftgröße; sichtbare Verlaufstasten nehmen zurück, stellen wieder her und nehmen erneut zurück. Danach Text vom Blatt in freien Canvas gezogen, dort per Eckgriff vergrößert und auf A zurückgebunden. Drehgriff und anschließende Skalierung am gedrehten Text erfolgreich; danach beide Transformationen zurückgenommen. Bearbeiten ergänzt `✓`. Pan und Zoom 90 → 80 %, danach erneute Eckskalierung auf 48,04 px. Größenänderung wird ohne weitere Canvasaktion in der Stundendatei gespeichert. Nach Beenden und echtem Neustart sind sämtliche Elemente, Text, Geometrie, Bindung und Kamera exakt gleich (`restart-check.json`, `native-before-restart.json`, `native-after-restart.json`, `native-after-restart.png`).

Die erste native Automation war teils im Hintergrund: Eine dort wirkungslose Folgegeste wurde nach expliziter Finder-Aktivierung erneut erfolgreich durchgeführt. Ein Browser-Drag war durch die UI-Automation an fraktional skalierten Iframe-Eingabekoordinaten blockiert; die Funktionsabnahme erfolgte tatsächlich in der nativen WebView. Keine unbeobachtete Browser-/Touch-Abnahme behauptet. Belege unter `output/text-resize/` und `output/release-0.1.57/`. Reale Smartboard-Berührung/Stift bleiben Hardwareabnahme; Geometrieprüfungen ersetzen diese nicht.

## Freigabe 0.1.57

341 App-/Archivtests, 106 Live-/Room-Tests, ein Rust-Test, beide Typprüfungen und Builds bestanden. Native QA-Ressourcen bytegleich zum finalen portablen Paket. 399 eingefrorene Sourcefingerprints und 14 Änderungen gegenüber dem eingefrorenen 0.1.56-Stand; die schon veröffentlichte ältere Release-Dokumentation ist darin enthalten. Keine unzugehörige Funktionsänderung. Die Dokumentation des abgeschlossenen Tests wird nach Publikation separat fortgeschrieben.

0.1.56 → 0.1.57 mit den beiden signierten portablen Paketen: alter Paketserver erzeugt synthetische Katalog-/Board-/Bild-/Notizdaten, neuer Paketserver liest sie unverändert; alle sechs Dateien bytegleich. ZIP ohne Laufzeitdaten, Codesign und Updater-Signatur erfolgreich. 16. Oktober 2026 atomar über den bestehenden Beelink-Kanal veröffentlicht; öffentlicher Rückdownload und Signatur geprüft. Updater-SHA-256 `d0fdb2f96435bbb04f447fb51370250822b6afc2df7e99392831ce5f21893594`. Produktive App nicht installiert oder neu gestartet; produktives Archiv unverändert.

Betroffene Implementierung: `CanvasSurface.tsx` (Griffpriorität und Szenenversion), `text-transform-handles.ts` plus fünf Regressionstests (kleiner Engine-Eingabeadapter), `projected-media-gestures.ts` (Weiterleitung), `InteractiveHtmlCanvasFrame.tsx`/`styles.css` (bestehende projizierte Textgriffe). README, UI-Brief 05, D-264-Korrektur, Implementierungsplan und Releaseprotokolle aktualisiert. Keine neue UI, Abhängigkeit oder zweite Speicherlogik.


Nachfolge 0.1.58: D-265 ersetzt den hier historisch beschriebenen nativen Adapter durch sechs gemeinsame, größere Textgriffe. Der Szenenversion-Speichercheck bleibt erhalten. Aktueller Prüfstand: `34_TEXTBOX_TRACKPAD_HANDLES_TEST.md`.
