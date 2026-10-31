# Markerbindung und Radiererzustand – 15. Oktober 2026

## Befund

Nutzer meldet im Unterricht `Drug harm` gelbe Marker hinter einem HTML-Blatt, die sich weder verschieben noch radieren lassen. Die kanonische Desktop-Stunde enthält 17 lebende Marker mit `locked=true`, leerer `groupIds`-Liste und erhaltenem Scrollanker auf das Leseblatt. Historie desselben Vormittags belegt für exakt dieselben IDs `locked=false` und die ursprüngliche Materialgruppe. Die Geometrie der beschädigten Marker ist seit dem ersten gesicherten Schaden unverändert.

Letzter geprüfter guter Stand: 15. Oktober 2026, 09:18 UTC. Erster gesicherter beschädigter Stand: 11:46 UTC. Damit liegt der gespeicherte Schaden vor 0.1.54/0.1.55. Die konkret auslösende Benutzeraktion lässt sich aus diesen Snapshots nicht nachweisen. Ein Scrollanker allein rechtfertigt keine automatische Entsperrung oder neue Bindung.

## App-Korrektur

Der native Radiereradapter benötigt vorübergehend gelöste Gruppen und Hilfssperren. Diese Engine-Sicht wurde bislang direkt in die HTML-/Materialdarstellung und in gespeicherte Snapshots übernommen. Die gemeinsame reine Funktion `withoutTemporaryEraserState` führt nur belegte Adapter-Metadaten in die exakten ursprünglichen Gruppen und Sperren zurück. Echte Nutzersperren und unbekannte/fehlende Bindungen bleiben unangetastet.

- `eraser-policy.ts`: gemeinsame kanonische Lesesicht, keine Engine- oder Persistenzabhängigkeit.
- `image-annotation-groups.ts`: bestehende native Rückkehr nutzt dieselbe Ableitung mit regulärem Versionsupdate.
- `CanvasSurface.tsx`: HTML-/App-Annotationen bleiben beim Radieren oberhalb ihres Blatts sichtbar.
- `canvas-persistence.ts`: Browsercache und Datei-Outbox erhalten ausschließlich den kanonischen Snapshot.
- `public-projection.ts`: Room-/Remote-Materialauswahl liest dieselben ursprünglichen Bindungen; Freigabe-Allowlist bleibt bestehen.

Keine Änderung von Materialgeometrie, Radierbarkeit, Objektklassen, Undo-Reichweite oder Archivschema. Keine automatische Altbestandsreparatur und keine zusätzliche fachliche Wahrheit.

## Gezielte lokale Wiederherstellung

Die produktive App wurde regulär beendet. Vollständiges Archivbackup unter `data/unterrichtsarchiv-backups/` erstellt und vollständig verifiziert: 44 Katalogstunden, 49 vorhandene Boarddateien. Vor dem Schreiben zusätzlich die exakte zu reparierende Boarddatei aus diesem Backup per SHA-256 mit dem aktuellen Vorzustand verglichen.

Die Reparatur übernimmt nur für die 17 historisch belegten Marker Originalbindung und entsperrten Zustand. Ihre relative Geometrie aus dem ersten beschädigten Stand wird rotationsgerecht auf die heutige Position desselben, unverändert großen Leseblatts übertragen. Native Punkte/Farben und alle anderen Objekte bleiben erhalten; Version/Nonce/Zeit werden regulär erhöht. Optimistische SHA-Prüfung verhindert Überschreiben eines inzwischen geänderten Stands. Unmittelbarer Vorzustand zusätzlich in der Stundenhistorie; atomarer Dateiaustausch.

Danach produktive App wieder geöffnet. Die Marker liegen sichtbar auf dem Leseblatt und lassen sich einzeln auswählen. Nach Reload erneut geprüft: 17 entsperrte, korrekt gebundene Marker; alle anderen Objekte sowie HTML-Feldwerte und Clips unverändert. Für die Sichtprüfung nur über den vorhandenen Materialfokus zum Leseblatt navigiert; dabei darf sich die Kamera ändern. Kein produktives Probe-Radieren oder Löschen.

Backup, Diagnose, belegte IDs, Reparaturplan, vorheriger Zustand und Hashes liegen in `output/marker-binding-recovery/`: `backup.json`, `backup-verification.log`, `diagnosis.json`, `repair-plan.json`, `repair-result.json`, `final-verification.json`. Die einmaligen Reparaturskripte dort sind keine Appmigration. Keine vollständige frühere Stunde über aktuelle Schülerantworten zurückgespielt.

## Prüfung

331 App-/Archivtests, 95 Live-/Room-Tests, beide Typprüfungen, Desktop-Ressourcenbuild und nativer ARM64-QA-Build erfolgreich. Vier neue Tests prüfen kanonischen Snapshot ohne Hilfsfelder, originale Sperren ohne heuristische Reparatur, erhaltene HTML-Markerprojektion während des Radierens sowie gelöschte Striche/andere Gruppen/Metadaten.

Native macOS-QA mit eigener App-ID `app.jujies.tafelraum.qa-marker-recovery`, konsistentem Port 49524 und neutralem HTML bei ursprünglicher Blatt-/Markergeometrie. Alle 207 Ressourcen bytegleich zum abschließenden Hauptressourcenbuild (`qa-resources.json`).

- 17 rekonstruierte Marker sichtbar auf dem Blatt.
- Zwei Marker unabhängig um 21 beziehungsweise 15 Bildschirmpixel bewegt; gespeicherte Geometrie bestätigt.
- Radierer aktiviert: Marker bleiben sichtbar (`qa-eraser-visible.png`).
- Einen Marker gezielt radiert: 16 lebende Marker; Snapshot bei weiterhin aktivem Radierer enthält 16 originale Bindungen, keine Sperren und keine Hilfsmetadaten (`qa-active-eraser-snapshot.json`).
- Undo und Rückkehr zur Auswahl: 17 Marker entsperrt/gebunden, wieder einzeln beweglich (`qa-after-undo.json`, `qa-restored-marker-moved.png`).
- QA regulär beendet. Produktiver Reload, Sichtbarkeit und Einzelwahl separat bestätigt (`production-recovered.png`, `production-marker-selected.png`).

## Grenzen und Auslieferung

Die Bestandsreparatur ist lokal abgeschlossen. Die zusätzliche App-Korrektur ist noch nicht als Update veröffentlicht; die produktive App bleibt auf 0.1.55. Der Ursprung des früheren Verlusts der Hilfsmetadaten ist nicht lückenlos reproduziert; keine pauschale Heilung anderer Altstände behaupten. Die konkret belegte Übernahme des temporären Radiererzustands an Projektions-/Persistenzgrenzen ist korrigiert. Echte Touch-/Stift- und Zweitdisplayprüfung bleiben offen.


**Veröffentlicht mit 0.1.56, 15. Oktober 2026:** Die gemeinsame kanonische Radierersicht und D-264s einheitliche bewusste Einzelbewegung für Text/Stift/Marker in Lehrer und Room sind signiert veröffentlicht. 336 App-/106 Live-Tests, native QA mit 207 bytegleichen Ressourcen, Datenerhalt und öffentliche Hash-/Signaturprüfung erfolgreich. Prüfstand/Hardwaregrenzen in `32_UNIFIED_ANNOTATION_MOVEMENT_TEST.md`, Release in `09_DESKTOP_APP_UND_UPDATES.md`. Keine weitere produktive Archivänderung.
