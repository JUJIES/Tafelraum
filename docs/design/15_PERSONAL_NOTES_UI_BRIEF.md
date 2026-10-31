# UI Brief – persönliche Merkliste

## Kontext

- **Oberfläche/Zustand:** kleines Popover in der Kopfzeile des lokalen Surface Lab
- **Zielnutzer:** Lehrkraft am eigenen Mac
- **Nutzungssituation:** während Vorbereitung oder Unterricht fällt eine spätere Verbesserung ein
- **Eine primäre Handlung:** einen Gedanken sofort notieren und später wiederfinden
- **Designfrage:** Bleibt die Notizaktion erreichbar, ohne die Unterrichtsfläche zu belasten?

## Scope

### Muss sichtbar oder erreichbar sein

- Ein ruhiges Lucide-Notizsymbol zwischen Einstellungen und Vollbild; 48 × 48 Pixel Ziel, Tooltip und zugänglicher Name `Notizen`. Das Label erscheint im Popover, damit die schmale Kopfzeile nicht weiter wächst.
- Kleines Popover mit kompakten, zweizeiligen Texteinträgen. Ein Klick auf einen Eintrag zeigt bei Bedarf den ganzen Text; ein Stiftbutton öffnet die Bearbeitung.
- `Neue Notiz` öffnet dasselbe einzelne Eingabefeld. Dort fügt `⌘V` einen Screenshot aus der Zwischenablage hinzu; pro Notiz gibt es höchstens einen Screenshot. PNG, JPEG und WebP bis 8 MB sind zulässig. Text ist bei einem Screenshot optional.
- In der Liste steht ein kleines Bild neben genau seinem Texteintrag. Hover, Tastaturfokus oder Antippen zeigen das Bild größer, ohne den Listeneintrag dauerhaft aufzublähen.
- `Speichern` übernimmt Text und Bild gemeinsam in lokale Projektdateien, `Abbrechen` verwirft den Entwurf. Ein Speicherfehler wird im Popover angezeigt.
- Außenklick schließt das Popover und verwirft einen offenen Entwurf. Escape verwirft zuerst den Entwurf und schließt beim nächsten Mal das Popover. Tastatureingaben im Feld dürfen keine Canvas-Kürzel auslösen.

### Darf nicht erscheinen

- Unterrichts-, Archiv- oder Live-Canvas-Verknüpfung, Synchronisierung, Prioritäten, Aufgabenstatus oder Benachrichtigungen.
- Persönliche Notizen oder Screenshots in Schüleransicht, Canvas, Export, Materialbestand oder Beelink-Dienst.

## Exakter UI-Text

- `Notizen`, `Neue Notiz`, `Noch keine Notizen`, `Notiz bearbeiten`, `Notiz löschen`, `Notiz löschen?`, `Abbrechen`, `Speichern`, `Screenshot mit ⌘V einfügen`, `Screenshot angehängt`, `Screenshot entfernen`, `Screenshot vergrößern`, `Notizen konnten nicht gespeichert werden`.

## Inhalt und Referenzen

- **Reale Inhalte:** kurze freie Verbesserungsgedanken mit optionalem Screenshot der beobachteten Oberfläche.
- **Visuelle Referenz:** bestehendes Einstellungs-Popover und die ruhigen Utility-Aktionen der Kopfzeile.
- **Produktflow:** notieren, Popover schließen, später erneut öffnen und Eintrag bearbeiten oder löschen.

## Vergleich und Invarianten

- **Gezielt verändert:** genau eine Kopfzeilenaktion und ihr Popover.
- **Unverändert:** Canvas, Unterrichtsarchiv, Live Canvas, Werkzeugleiste, Vollbild und Einstellungen.
- **Nicht durch Desktop validierbar:** Erreichbarkeit mit Touch/Stift auf Zielhardware.

## Abnahme

- Ohne Anleitung sind die Liste, das Aufklappen langer Texte und der Stiftbutton erkennbar. Im Normalzustand sind keine Eingabefelder sichtbar.
- Text und Screenshot bleiben nach Schließen und Reload gemeinsam lesbar. Die lokale Datei `local-data/personal-notes/notes.json` verweist pro Eintrag auf genau seine Bilddatei unter `images/`, sodass ein Agent beides zusammen prüfen kann.
- Im Desktop-Browser werden Hell/Dunkel, Fokus, Escape und Außenklick geprüft; Touch/Stift bleiben offen.
