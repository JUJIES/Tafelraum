# UI Brief – lokaler Zustand interaktiver HTML-Materialien

## Anlass und Ziel

Interaktive HTML-Materialien sollen ihren aktuellen Eingabe- oder Spielstand verlässlich mit der Stunde behalten. Speicherung ist deshalb der sichere Standard; die Lehrkraft kann sie weiterhin pro konkreter Canvas-Instanz bewusst ausschalten. Tafelraum unterscheidet nicht zwischen Arbeitsblatt, Quiz oder Spiel.

## Produktlogik

- Neue und bestehende HTML-Instanzen aktivieren ihre Inhaltsspeicherung beim Bereitwerden standardmäßig.
- Nach Auswahl stehen zwei materialnahe Iconaktionen bereit:
  - `Save`: „Inhalte beim Wiederöffnen behalten“. Der standardmäßig gedrückte Zustand zeigt an, dass Änderungen dieser Instanz mit dem Stunden-Snapshot gespeichert werden.
  - `RotateCcw`: „Inhalte zurücksetzen“. Die Aktion setzt die aktuell sichtbaren Eingaben beziehungsweise den Spielstand auf den Startzustand der Instanz zurück.
- Das Zurücksetzen verlangt eine Bestätigung, weil bereits erarbeitete Eingaben verloren gehen. Die Bestätigung nennt genau diese Folge und bietet `Abbrechen` und `Zurücksetzen`.
- Ausschalten der Speicherung löscht den gespeicherten Inhaltsstand, verändert aber die aktuell sichtbare Instanz nicht. Beim nächsten Öffnen startet sie wieder im Ausgangszustand und verwendet erneut den sicheren Standard.
- Solange eine bewusst nicht gespeicherte Instanz wirklich vom beim Laden erfassten Startzustand abweicht, erscheint vor einem Stundenwechsel eine bestätigbare Verlustwarnung. Abbrechen behält Stunde und Eingaben; Bestätigen verwirft sie durch den Wechsel.
- Reload und Schließen verwenden für denselben Zustand die native Browserwarnung, weil Browser dort keinen verlässlichen eigenen Dialogtext zulassen. Unveränderte beziehungsweise zurückgesetzte Instanzen warnen nicht.
- Jede Platzierung desselben Pakets bleibt eine eigene Instanz mit eigenem Zustand.

## Platzierung und Darstellung

- Beide Aktionen verwenden die bestehende runde, externe Materialaktionsleiste. Dadurch bleibt der HTML-Titelbalken frei für Titel und Inhaltszoom.
- Der Speicherzustand verwendet dieselbe ruhige Akzentfüllung wie andere gedrückte Materialaktionen (`aria-pressed`).
- Beide Schaltflächen haben Lucide-Icons, zugängliche Namen und Tooltips. Es entsteht kein zusätzlicher Textkasten auf der Arbeitsfläche.
- Auf groben Zeigern gelten weiter die bestehenden größeren Touchziele und Abstände.
- Die Verlustwarnung ist kein dauerhafter Status oder Badge. Sie erscheint ausschließlich an der tatsächlich verlustbehafteten Navigation.

## Daten- und Zustandsgrenze

- Der gespeicherte Fachzustand liegt optional und nach Canvas-Element-ID im bestehenden kanonischen Stunden-Snapshot. Er erzeugt keinen Excalidraw-Verlaufsschritt und keine zweite Browserwahrheit.
- Der ausgeschaltete Speicherwunsch und der Vergleich zum Startzustand sind flüchtige Sitzungsinformation. Es entsteht kein zweites persistiertes Präferenzmodell; nach einem bestätigten Verlassen gilt beim nächsten Laden wieder der sichere Standard.
- Position, Größe, Drehung, Abdeckung und Inhaltszoom bleiben unverändert in der bestehenden Canvasgeometrie.
- Ein Material kann seinen semantischen Zustand über `window.tafelraumLive` bereitstellen. Für einfache `input`-, `textarea`-, `select`- und `contenteditable`-Felder stellt die injizierte Bridge einen generischen Adapter bereit.
- Zustand bleibt auf 64 KiB validiertes JSON begrenzt. Das Zurücksetzen verwendet den beim Laden erfassten Startzustand derselben Instanz.

## Nicht Teil dieses Slices

- automatische Materialklassifizierung;
- globale Voreinstellung für alle Materialien;
- Versionierung einzelner Eingaben oder ein eigener Inhaltsverlauf;
- Synchronisierung des lokalen Speicherwunsches mit Teilnehmern;
- persistierter Audio-/Video-Fortschritt.

## Prüffälle

1. Ein einfaches Arbeitsblatt ohne vorherige Speicheraktion ausfüllen, Stunde wechseln und erneut öffnen: Eingaben bleiben erhalten und die Speicheraktion ist gedrückt.
2. Speicherung ausschalten, Inhalt unverändert lassen und Stunde wechseln: keine Warnung; beim erneuten Öffnen gilt wieder der aktive Speicherstandard.
3. Speicherung ausschalten, Inhalt ändern und den Stundenwechsel abbrechen: Warnung erscheint, Stunde und Eingaben bleiben erhalten.
4. Denselben Wechsel bestätigen: Ausgangszustand erscheint beim erneuten Öffnen und Speicherung ist wieder aktiv.
5. Bei derselben ungespeicherten Änderung Reload beziehungsweise Schließen versuchen: native Browserwarnung erscheint.
6. Zurücksetzen abbrechen: sichtbarer und gespeicherter Stand bleiben unverändert.
7. Zurücksetzen bestätigen: sichtbarer Stand wird geleert; bei aktiver Speicherung bleibt auch nach Reload der Ausgangszustand erhalten.
8. Dasselbe Paket zweimal platzieren: Speicherwahl, Warnung und Inhalt bleiben pro Instanz getrennt.
9. Ein komplexes Paket mit eigenem Zustandsvertrag behält dessen semantischen Zustand; einfache Formfelder funktionieren ohne Paketanpassung.
