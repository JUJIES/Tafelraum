# Nativer mehrseitiger HTML-Druck — 2. Oktober 2026

## Befund und Änderung

Testgerät: Mac, macOS 26.2, Apple Silicon. Separate gebaute App `app.jujies.tafelraum.printqa`, eigener Loopback-Port 49327 und neutrales Archiv mit einer Kopie von `transport-announcements-listening`. Die produktive Lehrersitzung und ihre Eingaben werden nicht für Tests bearbeitet.

1. Unveränderter App-Druckpfad: zwei `.sheet`-Abschnitte im HTML, nativer Dialog „Page 1 of 1“. Die Canvas-Shell setzt `html/body` auf `height:100%` und `overflow:hidden`.
2. Druckhöhe freigegeben: vier Seiten. Gegenprobe der Paketdatei direkt in Safari ebenfalls vier Seiten. Der native PDF-Export zeigt auf Seiten 2 und 4 ausschließlich die Fußzeilen.
3. Paketlokal im Druckmedium Definitionszeilen 14→13 mm, True/False-Zeilen 13→12 mm, Zahlenzeilen 14→13 mm: genau zwei vollständige A4-Seiten. Schrift und 10-mm-Antwortfelder bleiben gleich.
4. Während eines länger offenen nativen Dialogs entfernte der alte 120-Sekunden-Fallback die Vorlage; ein späterer PDF-Export enthielt App-Chrome. Der native Weg wartet jetzt ausschließlich auf `afterprint`.

## Nachweis

- App-Typprüfung und Hauptbuild bestanden. Druck bei 100 % und 90 % Inhaltszoom jeweils zwei Seiten. Elf relevante HTML-/Raster-Drucktests bestanden.
- Native Druckaktion mehrfach geöffnet; Abbruch beziehungsweise PDF-Speichern kehren zur bedienbaren Canvasansicht zurück.
- `output/image-print/html-overflow-fresh.pdf`: vier A4-Seiten, isolierte Fußzeilen.
- `output/image-print/html-two-pages-final.pdf`: zwei A4-Seiten (595,276 × 841,89 pt). Beide mit Poppler gerastert und visuell geprüft: alle Aufgaben, Antwortfelder und Fußzeilen vollständig, keine Leer- oder Zusatzseite, kein App-Chrome.
- Finales natives Bundle: Dialog länger als zwei Minuten offen gelassen, anschließend `output/image-print/html-two-pages-after-wait.pdf` gespeichert. Weiterhin zwei vollständige A4-Seiten ohne App-Chrome, beide gerastert und kontrolliert; 90 % Inhaltszoom bleibt erhalten.
- Paketprüfer bestanden; ein statischer WeasyPrint-Befund allein hätte den WebKit-Überlauf nicht erkannt.

## Daten und Grenzen

Paket-Layoutkorrektur vor produktiver Übernahme durch vollständiges Archivbackup und Probe-Restore abgesichert. Nur `style.css` des konkreten Pakets wird aktualisiert; kein Canvas-/Instanzzustand, Manifest oder Aufgabeninhalt. Die App-Korrektur ist in Update 0.1.40 am 2. Oktober 2026 veröffentlicht. Kein physischer Druckauftrag und kein Touchtest.

Backup: `data/unterrichtsarchiv-backups/unterrichtsarchiv-2026-10-02T19-12-40-381Z-html-druck-zwei-seiten.tar.gz`, Prüfsumme und isolierter Restore bestanden (`verified:true`, 35 Unterrichte, 40 aktuelle Boards). Die produktive CSS-Datei wurde vor dem Austausch zusätzlich gegen den geprüften Ausgangsstand verglichen.
