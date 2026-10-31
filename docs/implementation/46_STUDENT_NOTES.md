# Private Stundennotizen und Kursnamen

29.10.2026 · D-302 · Seit 0.1.84 lokal installiert und geprüft; mit 0.1.85 regulär veröffentlicht. Aktive UI: [Brief 30](../design/30_STUDENT_NOTES_UI_BRIEF.md).

## Produkt und Zuständigkeit

Kursmenü → **Schüler:innen bearbeiten**: eine kleine Liste mit einem Namen pro Zeile. Vorhandene Zeilen behalten ihre IDs; neue erhalten serverseitig UUIDs. Umbenennen und Umordnen verändern keine Zuordnung. Eine vorhandene Zeile leeren und übernehmen archiviert die Person. Abbrechen schreibt nichts. Mehrzeiliges Einfügen in die freie letzte Zeile ergänzt Personen; identische Anzeigenamen sind erlaubt.

**Stundennotizen** neben den Canvas-Verlaufsknöpfen öffnet Namen und freie Notizzeilen. Die Felder wachsen mit dem Text. Kursnamen gelten fächerübergreifend innerhalb derselben Klasse/Kurs-ID. Der Kurseditor bindet seine Ziel-ID beim Öffnen; Notizen binden immer die geöffnete Stunde, unabhängig von der links ausgewählten Klasse. Materialablage und Notizen öffnen wechselseitig. Kein Canvasobjekt und keine neue allgemeine Schülerverwaltung.

## Kanonische Daten und Speicherung

`<Archivwurzel>/_private/student-notes/classes/<classId>.json`:

- `schemaVersion: 1`, `classId`, `students` mit `id`, `displayName`, `createdAt`, `updatedAt`, `archivedAt`;
- `lastMutation` mit requestId und Inhaltshash für wiederholte Kurs-Speicheraufträge.

`<Archivwurzel>/_private/student-notes/lessons/<lessonId>.json`:

- `schemaVersion: 1`, `lessonId`, `classId`, `scheduledForAtFirstNote`;
- `notes` mit `studentId`, `text`, `createdAt`, `updatedAt`.

Keine parallele Katalog-/Canvasablage. Leeres Lesen legt nichts an; eine unberührte leere Notiz ebenfalls nicht. Der bei erster Notiz vorhandene Unterrichtstermin ist eine ausdrücklich bezeichnete Datumsbasis; unbekannte Termine bleiben unbekannt. Fehlende Daten werden nicht als Unterrichtsnachweis erfunden. Archivierte Personen bleiben in früheren Stunden mit Notizen sichtbar. Papierkorb-Stunden werden nicht in normalen Auswertungen berücksichtigt; Dateien bleiben für Wiederherstellung erhalten. Kopieren von Unterricht überträgt keine privaten Notizen. Vollständige Archivbackups nehmen `_private` mit; ein Material- oder Canvasexport enthält diese Domäne nicht.

`student-notes-store.mjs` ist der gemeinsame validierende Leser/Schreiber. Schreibvorgänge laufen seriell über die vorhandene atomare JSON-Funktion mit Historien unter `.history/`. Die Namensliste hat eine Basisrevision, einzelne Notizen je Person eigene Revisionen. Unterschiedliche Personen blockieren sich nicht; veraltete Änderungen derselben Person erhalten 409. Beschädigte Dateien werden nicht still ersetzt. Pfade/IDs und Symlinks werden geprüft.

`src/student-notes.ts` hält nur unbestätigte Entwürfe in einem originlokalen Local-Storage-Outboxbereich, getrennt nach Archivschlüssel, Stunde und Personen-ID. Kein zweiter bestätigter Datenbestand. Schreibstand wird erst nach bestätigter Dateispeicherung entfernt. Antworten älterer Eingaben löschen nie neuere Entwürfe. Debounce 650 ms, Flush bei Feldverlassen/Stundenwechsel, Timeout 15 s. Netzwerkfehler behalten den Entwurf; Konflikte werden vor einer ausdrücklichen Übernahme mit dem aktuellen gespeicherten Text angezeigt. Wiederherstellung erfolgt beim ersten Öffnen der Notizen im selben Archiv. Der native Server nutzt einen festen Origin/Port; bei einem anderen Browserorigin ist dessen Outbox nicht verfügbar. Ein vollständig abgestürzter Browser vor der synchronen Entwurfssicherung bleibt eine normale Systemgrenze.

## Private Schnittstelle und KI-Auslesen

Neue Routen benötigen `X-Tafelraum-Student-Notes: 1`, einen lokalen Host und bei vorhandenem Origin exakt denselben Origin. Fremde Ports, `null`-Origin und cross-/same-site-Kontexte sind abgewiesen; auch im Vite-Pfad. Keine Freigabe für paketlokale Iframes, Room, Remote oder Canvas-Agent-Inspect.

- `GET/PUT /api/archive/classes/:classId/students`
- `GET /api/archive/lessons/:lessonId/student-notes`
- `PUT /api/archive/lessons/:lessonId/student-notes/:studentId`
- `GET /api/archive/student-notes?classId=…` mit optional `studentId`, `subjectId`, `seriesId`, `from`, `to`, `limit`, `cursor`.

PUTs verwenden `If-Match` oder bei fehlendem Datensatz `If-None-Match: *`. Eingabelimits: 500 aktive Personen, 100 Zeichen pro Name, 10.000 pro Notiz, 256 KiB Request. Eine Auswertung liefert Quell-IDs, Namen, Stunden-/Fachbezug, Datumsbasis, `undatedCount` und Pagination; Standardlimit 200, maximal 500. Filter müssen bei Cursorfortsetzung gleich bleiben.

Direktes lesendes Auslesen, ohne geöffnete App und ohne Computer Use:

```sh
node scripts/read-student-notes.mjs \
  --archive-root '~/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv' \
  --class-id KURS_ID --subject-id FACH_ID
```

Der CLI verwendet denselben Store ohne Schreibfunktion. Er setzt keinen KI-Dienst voraus und überträgt keine Daten. Die Auswahl eines externen KI-Dienstes ist eine separate bewusste Handlung.

## Prüfung und Grenzen

- Neue Backendtests: Identität/Rename/Reihenfolge/Archivierung; idempotente Kursanlage; Feldrevisionen, parallele Personen, Konflikt und Blank-Noop; Korruption/Symlinks/Traversal; Same-Origin-Schutz; Filter/Pagination/Datumsbasis und nur lesender CLI; bytegleiche private Dateien bei vollständiger Archivkopie/Wiederherstellung und Papierkorb/Restore.
- Frontend-Outboxtests: ältere Antwort nach neuer Eingabe, Stundenbindung, Netzwerkfehler/Retry, archivgebundene Wiederherstellung und Konfliktsperre.
- `npm test`: 415 bestanden, zusätzlich Playback-Vorlauf 15 bestanden. `npm run test:live`: 115 bestanden. Typecheck und Produktionsbuild bestanden (bestehende Chunkgrößenwarnung).
- Isolierter Desktopserver mit zwei Teststunden: Kurseditor, Eingabe/Übernahme, Notizschreiben, Blur/Autosave, Reload und Stundenwechsel im Browser geprüft. Hell/Dunkel visuell geprüft. Fiktive Namen Alex/Kim; kein produktives Archiv verändert.
- Screenshot: `output/feature-concepts/stundendokumentation/stundennotizen-implementiert.png`. Testarchiv/Server unter `prototypes/surface-shell-a-b/output/student-notes-qa/`.
- Neue Servermodule sind im Desktop-Ressourcenmanifest enthalten. Separate ARM64-Test-App mit eigener App-ID, Profil und Port gebaut und ad-hoc signiert; striktes Codesign bestanden. Native Eingabe, Dateicommit, direkter Reader, fünf Namen, mehrzeiliges Einfügen mit erhaltenem Fokus, Abbrechen und Neustart mit erhaltenen Namen/Notizen bestätigt. Testaufbau: `scripts/prepare-student-notes-native-test.mjs`, Belege unter `output/student-notes-qa/`; Screenshot `output/feature-concepts/stundendokumentation/stundennotizen-nativ.png`. Die nachgeprüfte Fokuskorrektur wurde als aktualisierter Webbuild in die geschlossene getrennte QA-App übernommen und diese erneut ad-hoc signiert. Am 29.10.2026 als 0.1.84 in der normalen Desktop-App installiert; Start, Versionsanzeige, Notiz- und Namenseditor geprüft. Reales Touchboard bleibt offen; die spätere reguläre Veröffentlichung erfolgt mit 0.1.85 (Desktopdokument09).
