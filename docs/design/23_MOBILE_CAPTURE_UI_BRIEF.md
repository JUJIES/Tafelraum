# UI Brief – QR-Aufnahme in eine Stunde

18. Oktober 2026, Mehrfachaufnahme ergänzt D-266. Beauftragter persönlicher Pilot, noch keine Schülerfreigabe.

## Kontext

- **Oberfläche:** Materialbereich am Mac und separate mobile HTTPS-Abgabeseite.
- **Zielnutzer:** lokale Lehrkraft mit dem persönlichen Android-Testgerät; derselbe Webvertrag soll später auf iPhone/iPad geprüft werden.
- **Primäre Handlung:** eine Aufnahme ohne nachträgliches Einsortieren dauerhaft im Materialarchiv einer bestimmten Stunde speichern.
- **Designfrage:** Ist nach einmaligem QR-Beitritt eindeutig, wohin weitere Aufnahmen gehen und ob sie tatsächlich gespeichert wurden?

## Scope und Invarianten

- Im Materialbereich startet `Bild übertragen` (Lucide `ImageUp`) mit einem Klick den Empfang und öffnet direkt dessen QR-Ansicht; kein zusätzlicher Startbutton. Während des Starts `Verbinden …`, bei Fehler `Erneut versuchen`. Wiederöffnen verwendet die laufende Sitzung und denselben QR, ohne Neustart. Schließen der Ansicht beendet nicht unbemerkt den Empfang. `Empfang beenden` widerruft den QR-Zugang und schließt die Ansicht nach bestätigtem Erfolg; Fehler bleiben bedienbar.
- Der QR-Zugang ist an eine feste Lesson-ID gebunden. Ein Stundenwechsel leitet keine Aufnahme in eine andere Stunde um; die Empfangsansicht benennt ihr ursprüngliches Ziel und bietet Beenden. Eine neue Freigabe ersetzt die bisherige.
- Handy zeigt eine kompakte Ziel-/Verbindungszeile, zwei gleichbleibende Iconaktionen `Foto aufnehmen` (Lucide Camera) und `Datei auswählen` (Lucide Folder), eine gemeinsame Vorschauauswahl und Senden. Keine zusätzliche Marke, große Überschrift oder Anleitung. Kein Archivbrowser, Login, Name, Dashboard oder Einblick in andere Beiträge.
- Fotos (JPEG/PNG/WebP), vorhandene PDFs und bei `target.acceptsDocx` zusätzlich DOCX; maximal 20 MiB je Datei. Word erhält einen Dateiplatzhalter und wird am Mac lokal in PDF konvertiert; Speicherung erst nach deren Archivcommit. Kein DOC/DOCM-Import. `Foto aufnehmen` öffnet eine bildschirmfüllende Browserkamera über `getUserMedia` (Rückkamera bevorzugt, kein Audio). Livebild vollständig einpassen, kein beschnittener Sucher. `Auslösen` ergänzt ein JPEG in der gemeinsamen Auswahl, weitere Aufnahmen bleiben möglich; ein kurzer Zähler bestätigt die Aufnahme. `Fertig`/Schließen schaltet sämtliche Kameratracks ab und kehrt zur Auswahl zurück. Ebenso bei Hintergrundwechsel, Seitenende und beendeter Freigabe; verspätete Berechtigungsantworten dürfen die Kamera nicht wieder aktivieren. Fehler nennen Kamera-/Berechtigungsproblem und verweisen auf `Datei auswählen`, ohne automatischen Systemkamerawechsel. Keine Kameraumschaltung, Scannererkennung oder automatische Sendung. Aufnahme maximal 3200 Pixel lange Kante, JPEG-Qualität 0,94; Dateiimport bleibt unverändert.
- Aufnahme wird erst nach Bestätigung durch den kanonischen Materialimport als gespeichert gemeldet. Verbindungsabbruch erhält die Auswahl zum erneuten Senden, solange die Seite geöffnet bleibt. Kein Versprechen einer dauerhaften Handy-Outbox.
- Kameraaufnahmen und mehrfache Dateiauswahl ergänzen dieselbe Liste; bestehende Auswahl wird nie ersetzt. Pro Eintrag Vorschau/Dateiname, Speicherstatus und lokal entfernbarer Eintrag (kein Archivlöschen). Gemeinsames `Senden` überträgt die aktuelle Auswahl seriell; Auswahlaktionen bleiben währenddessen bedienbar. Während des Sendens hinzugefügte Dateien warten auf das nächste bewusste Senden. Erfolgreiche Dateien werden übersprungen, fehlgeschlagene mit derselben Übertragungs-ID erneut gesendet.
- Fotokachel öffnet eine fensterfüllende Vorschau ohne Upload oder Auswahländerung: Dateiname, `Vorschau schließen`, `Vergrößern` / `Einpassen`; vergrößert frei scrollbar. Schließen stellt den Fokus auf der Kachel wieder her. PDFs behalten ihren Dateiplatzhalter.
- Dateistatus kurz: `Bereit`, `Wird gesendet …`, `Gespeichert` mit Haken oder `Nicht bestätigt` mit eigener Aktion `Erneut senden`. Wiederholung betrifft nur diese Datei und hält ihre Transfer-ID; bestätigte Nachbarn bleiben unberührt.
- Auswahl bleibt flüchtig und begrenzt: 24 Vorschauen / 80 MiB Quellbytes pro geöffneter Seite, weiterhin 20 MiB je Datei. Vorschau entfernen gibt ihren lokalen Speicher frei, gespeicherte Archivdateien bleiben erhalten.
- Nach Erfolg ist die nächste Aufnahme direkt möglich. Keine automatische Canvasplatzierung, Kameraänderung oder Präsentation.
- Relay hält nur begrenzte verschlüsselte Übertragungsdaten im RAM, keine Dateiablage oder Archivkopie. Mac muss verbunden sein; kein Offline-Postfach. Freigabe endet spätestens nach zwei Stunden (Pilotparameter).
- Bekannte App-Styles und bestehendes QR-Modul am Mac wiederverwenden. Mobile Touchziele mindestens 48 CSS-px; Android-/Safari-Bedienung bleibt Hardwareabnahme.

## Exakte Kerntexte

`Auslösen`, `Fertig`, `Kamera wird geöffnet …`, `Bild übertragen`, `Erneut versuchen`, `Empfang beenden`, `Verbinden …`, `Verbunden`, `Verbindung unterbrochen`, `Empfang beendet`, `Aufnahme senden`, `Foto aufnehmen`, `Datei auswählen`, `Senden`, `Wird gesendet …`, `Bereit`, `Gespeichert`, `Nicht bestätigt`, `Erneut senden`, `Vergrößern`, `Einpassen`, `Vorschau schließen`, `Mac nicht erreichbar`, `Diese Freigabe ist beendet.`, `Bitte eine JPEG-, PNG-, WebP- oder PDF-Datei bis 20 MB auswählen.`

Nach Erfolg bleiben die beiden vorhandenen Aufnahmeaktionen erreichbar; kein zusätzlicher Button für die nächste Aufnahme.

## Abnahme

Mit neutralem Testarchiv: QR/URL öffnen, Foto auswählen, senden, korrektes Stundenmaterial am Mac ohne Reload sehen, Datei bytegleich prüfen und nach App-Neustart wiederfinden. Abbruch vor/nach Archivcommit, erneutes Senden mit derselben Übertragungs-ID, falscher Schlüssel, geschlossene/abgelaufene Freigabe und Stundenwechsel prüfen. Echte Handyaufnahme und Netzwechsel ausdrücklich separat protokollieren.


Native Abnahme am 17. Oktober 2026 mit separatem Profil und 209 bytegleichen Paketressourcen bestanden: QR, geschlossener Dialog, fester Zielbezug trotz Navigation, automatische Materialzeile, bewusste Canvasplatzierung und Neustart. Seit lokal installierter 0.1.59 auch in der regulär installierten App; tatsächlicher Android-Heimtest mit QR/Kamera/Senden inzwischen vom Nutzer bestätigt und am empfangenen JPEG geprüft; Safari/Touch weiterhin Hardwareabnahme. Bei anderer gewünschter Zielstunde bisherigen Empfang beenden und neu starten. Keine automatische Umleitung bestehender QR-Links.
