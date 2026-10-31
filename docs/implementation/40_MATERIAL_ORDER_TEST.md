# Materialreihenfolge – D-274

18. Oktober 2026 · lokaler Stand 0.1.67.

## Vertrag

Die Liste der vorhandenen Materialbasis erhält eine optionale `.material-order.json`:
`{schemaVersion: 1, paths: [...]}`. Pfade sind die vorhandenen stabilen Materialpfade
(Bilder/PDF/Medien, Paket- und Linkreferenzen), keine Anzeigenamen oder Canvas-IDs.
Ohne Metadaten bleibt die bisherige Scanreihenfolge. Bekannte Pfade werden geordnet,
neue Quellen hinten ergänzt, fehlende ausgelassen. Gemeinsam genutztes Reihenmaterial
teilt seine Reihenfolge zwischen den Stunden. Entfernte Quellen bleiben unsichtbar;
nach zwischenzeitlichem Neusortieren kann eine restaurierte Quelle hinten erscheinen.

`PUT /api/archive/lessons/:id/materials/order` erhält `paths` und `previousPaths`.
Die bestehende Materialqueue prüft die aktuelle sichtbare Reihenfolge einschließlich
Entfernungen. Nur eine vollständige eindeutige Permutation wird atomar mit History
unter `.history/material-order/` geschrieben. Konkurrenz oder neuer Eingang ergibt
409 und erneutes Laden. Keine zweite Persistenz im Browser, kein Canvas-Undo und
keine Änderungen an Quelldateien, Namen, Annotationen, Clips oder Boards.

## Bedienung

Zeile ziehen, Akzentlinie vor/hinter der Zielzeile beachten, loslassen. Ohne
Sortiermodus oder zusätzliche Iconspalte. Randscrollen bei Dragover. Vorhandener
Drag auf den Canvas bleibt eine Kopie über denselben MIME-Vertrag (`copyMove`);
interne Drops gelangen nicht zum Canvasimport. Escape/Abbruch schreibt nichts.
Alt+Pfeil hoch/runter bewegt die fokussierte Zeile jeweils einen Platz.

Ein interner Drop berechnet die Zielposition direkt aus seinem echten Eventziel,
nicht aus einem möglicherweise noch nicht gerenderten Dragover-Zustand. Zeilentext
ist außerhalb der Namenseingabe nicht selektierbar, damit Zeilendrags nicht als
Textmarkierung beginnen. Erfolgsstatus erst nach API-Commit; Fehler sichtbar, danach
Archiv neu laden. Operationen und verspätete Antworten sind an die aktive
Stunden-/Panelgeneration gebunden. Import/Entfernen/Umbenennen/Laden und laufende
Sortierspeicherung sperren neue Sortiergesten.

## Prüfung

- Neuer Integrationstest: gemischte Quellen einschließlich Link, geteilte Basis,
  Neustart des Middleware-Servers, neue/fehlende Quellen, doppelte/unbekannte/
  unvollständige Pfade und veraltete Anfragen. Quellen und Board bleiben bytegleich.
- Bewegungstest: vor/hinter, erste/letzte Position, No-op und fehlende Referenz;
  keine Mutation der Materialobjekte oder ursprünglichen Liste.
- Insgesamt 359 App-/Archivtests bestanden; Rust, Typprüfung und Vite-Build im
  Releaseprozess. Bestehende Warnung zu großen Build-Chunks bleibt.
- Reale Browserbedienung eines isolierten temporären QA-Archivs: Zeile per CUA-Drag
  nach unten und nach oben, Tastaturbewegung, gespeicherte Reihenfolge nach Reload.
  Gültiges neutrales JPEG auf Canvas gezogen, Verwendung markiert; Sortieren
  verändert weder diesen Materialträger noch die Materialanzahl.
- QA-Archiv und Testdateien sind vom kanonischen Produktivarchiv getrennt. Temporäre
  Eventinstrumentierung im ignorierten Prüfbuild wurde beim finalen regulären
  Neubau überschrieben; kein Diagnosecode im Produktbundle.
- Touch-/Stift-Drag auf dem Board/iPad und unterbrochene Gesten am echten Gerät
  bleiben Hardwareprüfung. Native Mausprüfung unten gesondert dokumentieren.

Belege: `output/material-order-qa/`, insbesondere `release-0.1.67.log` und
Browsernachweis der sortierten Liste.

## Lokaler Abschluss

Regulärer Releaseprozess 0.1.67 erfolgreich: 359 App-/Archivtests, Rust, Typprüfung,
Build, portable ZIP-Prüfung, Codesign und kryptografische Updatersignatur. Keine
private Konfiguration oder Unterrichtsdaten im Paket. Die App wurde regulär
beendet, durch das geprüfte Paket am normalen Desktop-Ort ersetzt und nativ neu
geöffnet; Drug-harm-Stunde samt Canvas und Materialliste wieder sichtbar. .66 als
Rückfallkopie unter `Tafelraum Release/app-backups/` erhalten. Installierte
Server-/HTML-Ressourcen bytegleich, keine QA-Eventinstrumentierung im Bundle.
Kein Testsortieren der produktiven Materialien; tatsächlicher nativer Sortierdrag
bleibt der Nutzerprüfung überlassen, Browserdrags wurden im QA-Archiv ausgeführt.
Öffentlicher Updatekanal bleibt .59. Kein produktiver Archivtestimport oder
manuelle Änderung bestehender Reihenfolge/Boards.
