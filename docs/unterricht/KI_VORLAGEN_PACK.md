# Teilbares KI-Vorlagenpack für Hybridarbeitsblätter

**Stand:** 13. Oktober 2026 · Version 1 · vom Nutzer beauftragter Kolleg:innen-Export.

## Heutiger Einstieg

Dieser Text dokumentiert einen historischen lokalen Export. Seine `output/`-
Dateien werden nicht mit dem öffentlichen Quellstand verteilt. Der heutige
mitgelieferte Weg sind die [13 Layoutreferenzen](../agent-references/README.md)
und das [lokale Agentenpaket](../agent-kit/START.md). Neue Arbeiten verwenden
deren aktuellen Shared-Pages-Vertrag; die alten getrennten Bildschirm-/Print-
Entries dieses Packs sind kein technischer Standard für neue Arbeitsblätter.

## Historischer Zweck und Umfang

Ein modellneutrales Anhangpaket erklärt einem externen Coding-Assistenten,
wie er anhand passender Referenzen vollständige offlinefähige,
digital ausfüllbare und leer druckbare HTML-Arbeitsblätter erstellt.
Anleitung, Startprompt, drei vollständige Beispiele, getrennte Lehrkraftnotizen,
Qualitätscheck und Beispielaufträge bilden den Export.

- Exportordner: `output/ki-vorlagen-pack-v1/`.
- Weitergabe: `output/KI-Vorlagenpack-Hybridarbeitsblaetter-v1.zip`.
- Alternative für KI-Chats ohne ZIP-Zugriff: `KI_ANHANG_KOMPLETT.txt` im Exportordner; enthält die Anweisungen und vollständige Textdateien aller Beispiele.
- Bearbeitete Beispielquellen: `output/interactive-materials/pack-library-listening/`, `pack-club-timetable/`, `pack-schulhof-entscheidung/`. Kopien im Export sind eigenständige Weitergabeartefakte, keine neue Unterrichtsarchivbasis.

## Auswahlentscheidung

Die dokumentierten Fälle City Bikes, Transport Announcements und Opioide
liefern Gestaltungsbegründungen: Antwortform und Feldkapazität, getrennte
Auftragsblöcke sowie eigenständig ausgebbare Materialteile. Das Pack übernimmt
keine fremden Originalaufgaben oder Audiodateien. Neue fiktive Inhalte nutzen
die Layoutprinzipien. Die Varianten sind nicht im Unterricht erprobt; die
Bestätigung der Ausgangsfälle wird nicht übertragen. Farben und Aufgabenraster
bleiben ausdrücklich variabel.

Der vorhandene HTML-Paketvertrag und D-244/D-246 bleiben maßgeblich. Skriptfreie
Standardfelder reichen für die Beispiele. `print.html` liefert eine statische
leere Vorlage; keine neue Remote-Fähigkeit, Archivinstallation oder Appfunktion.
Im Standalone-Browser wird keine dauerhafte Antwortspeicherung versprochen.

## Prüfstand und Pflege

Alle drei Pakete mit `--require-print` validiert. Chromium-Eingabe-/Auswahlprobe,
Reflow bei 360/900/1400 Pixeln und Sichtprüfung aller vier A4-PDF-Vorprüfseiten
bestanden. Interaktives Öffnen einer lokalen Datei wurde von der
Browser-Sicherheitsprüfung abgewiesen. Ziel-Druckdialog und daraus gespeicherte
aktuelle Prüf-PDF bleiben deshalb offen; keine native Tafelraum-Freigabe oder
Hardware-/Unterrichtserprobung behaupten. Vollständiger Stand im Pack unter
`PRUEFSTAND.md`.

Bei einer Überarbeitung erst die betroffene Beispielquelle ändern, im Browser
und Druckweg prüfen, dann Exportkopien, Einzelanhang und ZIP zusammen erneuern.
Keine aktiven Unterrichtsdateien durch die Weitergabe ersetzen. Das Pack wird
nicht automatisch in das Fallarchiv als erprobter Fall aufgenommen.

**Änderungsnotiz v1:** Erster ausdrücklich beauftragter Kolleg:innen-Export;
keine Änderung an App, Datenmodell, kanonischem Archiv oder allgemeinen
Gestaltungsregeln. Daher keine neue Produktentscheidung im Decision Log.
