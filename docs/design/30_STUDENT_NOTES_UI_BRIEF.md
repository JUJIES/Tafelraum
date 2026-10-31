# UI Brief – Kursnamen und private Stundennotizen

29.10.2026, ausdrücklich beauftragter lokaler Slice. Grundlage: die reduzierten Mockups 05/06 unter `output/feature-concepts/stundendokumentation/mockups/` und das dortige Umsetzungskonzept.

## Handlung und Umfang

Kursmenü → `Schüler:innen bearbeiten`: kleine Namensliste, ein Name je Zeile, `Abbrechen`/`Übernehmen`. Die optisch zusammengehörigen Zeilen behalten intern ihre Personen-ID; Umbenennen darf keine Notizen neu zuordnen. Eine freie letzte Zeile und mehrzeiliges Einfügen dort ergänzen Namen. Leer gemachte vorhandene Zeilen werden bei Übernahme für künftige Stunden archiviert, nicht samt Notizen gelöscht.

Seit D-309 liegen Notizen und Undo/Redo in einer gemeinsamen flachen Aktionsgruppe mit einem dezenten Trenner nach den Notizen. Ein kleiner Lucide-NotebookPen-Button `Stundennotizen` in den oberen rechten Canvasaktionen öffnet ein kompaktes privates Popover mit ausschließlich Namen und freien, zunächst einzeiligen Notizfeldern. Lange Texte wachsen. Leere Kursliste bietet `Namen hinterlegen`. Kein neuer Kopfzeilenbutton, Canvasobjekt, zweiter Materialeinstieg; die allgemeine persönliche Merkliste ist seit D-307 entfernt. Keine Anwesenheit, Kategorien, Status, Profile oder Verlaufsansicht. Namen gehören zum gewählten Kurs; Notizen stets zur geöffneten Stunde, auch wenn links ein anderer Kurs ausgewählt ist.

## Bedienung und Speicherung

Bestehende Theme-Tokens, klare Fokusflächen, 48-Pixel-Aktionsziele, höchstens eine dominante Aktion. Popover bleibt im Workspace; Namensliste scrollt bei Platzmangel. Notizen und Materialablage öffnen wechselseitig. Escape/Außenklick schließen Notizen ohne Entwurfsverlust; Eingaben lösen keine Canvas-Kürzel aus. Kursformular schreibt erst bei `Übernehmen`. Automatische Notizspeicherung meldet Erfolg erst nach Dateicommit; Fehler behalten den Entwurf. Im Normalzustand keine zusätzliche Erklärung/Statusfläche in der Liste. Seltene Konflikt-/Speicherfehler dürfen mit konkreter Wiederherstellungsaktion erscheinen.

## Privatheit und Abnahme

React-Lehreroberfläche und private Archivdomäne, niemals Szene, Room/Remote, Materialpaket oder allgemeiner Agent-Canvasinspect. Tests: stabile Namens-IDs, Abbrechen/Entfernen, Texteingabe/Tab/Escape, schneller Stundenwechsel, Neustart mit Entwürfen, Konflikte, größere Kurse, alle Toolbar-Docks und Hell/Dunkel. Browserprüfung ersetzt keine Touchhardwareabnahme. Der neue Slice erweitert ausdrücklich den bisherigen Schülerdaten-Ausschluss; keine allgemeine Schülerverwaltung oder externe KI-Freigabe.
