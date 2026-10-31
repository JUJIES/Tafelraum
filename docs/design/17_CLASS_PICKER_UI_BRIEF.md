# UI Brief – Klassen und Kurse

**D-302 (29.10.2026):** Zusätzliche Aktion `Schüler:innen bearbeiten` für den im Picker gewählten Kurs; kleiner zeilenweiser Editor gemäß [Brief30](30_STUDENT_NOTES_UI_BRIEF.md). Die interne Personen-ID bleibt bei Umbenennung erhalten. Freie letzte Zeile ergänzt Namen; geleerte bestehende Zeilen werden bei Übernahme archiviert. Kein neues Verwaltungsziel.

- Ziel: Lehrkraft legt für Unterricht oder Seminar eigene Klassen/Kurse an und wechselt zwischen ihnen.
- Designfrage: Bleibt die Navigation mit vielen Einträgen ruhig, wenn nur der aktive Name mit Chevron sichtbar ist?
- Änderung: Bestehende Klassenreiter werden durch einen flächenlosen Namensbutton ersetzt. Ein begrenztes Popover zeigt die Liste mit Auswahlhaken, darunter Anlegen und Umbenennen. Ein einziges Namensfeld ersetzt bei Bearbeitung die Liste.
- Texte: `Klassen & Kurse`, `Klasse oder Kurs anlegen`, `Umbenennen`, `Name`, `Anlegen`, `Speichern`, `Abbrechen`. Bestehende Namen sind Nutzerdaten.
- Pflicht: 48-Pixel-Ziele, sichtbarer Fokus, Escape/Abbruch, Scrollen langer Listen, Fehler direkt am Editor, keine Speicherung vor Bestätigung. Auswahl per Tastatur und Touch erreichbar.
- Invarianten: Klasse/Kurs ist dieselbe vorhandene Archivklasse mit stabiler ID. Fach/Reihe/Unterricht, Kopierziel und geöffnete Unterrichtsfläche behalten ihre Logik. Neue Einträge beginnen ohne Fächer; `Fach anlegen` ist der nächste Schritt. Keine globale Klassenverwaltung. Löschen folgt dem unten ergänzten Papierkorbvertrag.
- Daten: additive Anlage oder gezielte Umbenennung im lokalen Archiv. Keine Neuinitialisierung bestehender Profile; frische Profile behalten den neutralen Starter.
- Abnahme: Anlegen, Abbrechen, Umbenennen, Wechseln, Reload, lange Namen/Liste, Hell/Dunkel im Browser. Bestehendes und frisches isoliertes Profil prüfen. Reale Touchhardware bleibt gesonderte Abnahme.

Dieser Brief ersetzt die feste Zweiklassen-Reiterdarstellung aus Brief 03 für diesen freigegebenen Slice.


## Ergänzung 30.10.2026: Klasse oder Kurs in den Papierkorb

- Handlung: Im geöffneten Klassen-/Kurswähler die ausgewählte Lerngruppe über
  `Löschen` entfernen; dieselbe Lucide-Papierkorbaktion wie in der übrigen Navigation.
- Platzierung: letzte sekundäre Aktion nach `Umbenennen`, mit vorhandenem
  Gefahr-Farbtoken und mindestens 48 Pixel Höhe. Kein zusätzlicher Verwaltungsdialog.
- Bestätigung benennt die Gruppe und das gemeinsame Ausblenden aller Fächer,
  Reihen und Stunden. Abbruch verändert nichts.
- Bestehender Katalog-Papierkorb erhält `kind: class`, stabile Gruppen-ID und
  Label. Keine Dateien, Namen, Notizen oder Materialassets entfernen. Wiederherstellen
  hebt nur den Gruppeneintrag auf; zuvor separat entfernte Kinder bleiben entfernt.
- Der Papierkorb bleibt gruppenübergreifend in der Navigation erreichbar; Typ
  `Klasse / Kurs` unterscheidet ganze Gruppen von einzelnen Unterrichtseinträgen.
- Die letzte sichtbare Lerngruppe ist geschützt. Enthält die Gruppe die geöffnete
  Stunde, muss vor dem Ausblenden eine andere sichtbare Stunde über den normalen
  Speicher-/Präsentationswechsel geöffnet werden. Ohne Wechselziel bleibt die
  Aktion deaktiviert; der Titel nennt die erforderliche nächste Handlung.
- Auswahl und Wiederherstellung werden auch nach Reload respektiert. Bei
  Speicherkonflikten der geöffneten Stunde wird die Gruppe nicht entfernt.
- Prüfung: leere Gruppe, Gruppe mit Unterricht, Abbruch, Stundenwechsel,
  Wiederherstellen nach Reload, Erhalt der Nachfahren und des Kinderpapierkorbs.
  Browserbeobachtung bestätigt keine tatsächliche Touchhardware.

Prüfstand: Katalog-Unit-Tests, App-/Room-Tests, Typprüfung und echte Browserläufe
mit Dev/Production-Preview in persönlicher und öffentlicher Quellfassung bestanden.
Öffentlicher Produktionsbuild und Speicherausfall-/Stundenwechselregression bestanden.
Keine native Installation oder Veröffentlichung.
