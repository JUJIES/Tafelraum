# 3. MVP, Ausbaustufen und Nicht-Ziele

## 3.1 Zwei bewusst getrennte frühe Stufen

Der **erste technische Build** ist ein Grundlagenprototyp. Er prüft, ob die elementare Unterrichtsoberfläche auf der echten Hardware trägt:

> Eine Lehrkraft kann eine Stunde ohne Planungsformular öffnen, mit Touch/Stift arbeiten, Bilder und PDFs als zentrale Materialien verwenden und alles zuverlässig auf dem Beelink speichern und wieder öffnen.

Der unmittelbar folgende **Presenter-Slice** prüft die besondere Tafelthese:

> Die Lehrkraft kann aus dem freien Board optional einen Stundenpfad bauen und mit einer unabhängigen öffentlichen Kamera ruhig unterrichten.

Diese Trennung hält den ersten Build klein, ohne Bild- und PDF-Import künstlich nach hinten zu schieben. Beide sind zentrale Alltagsfunktionen und gehören deshalb bereits in den Grundlagenprototyp.

Vor beziehungsweise parallel zum Grundlagenprototyp wird ein kleiner **Spiegel- und Importspike** durchgeführt. Er liest eine vorhandene lokale Reihe, zeigt Materialverfügbarkeit und übernimmt mindestens eine Stunde als Testdaten. Das ist kein vollständiger OneNote-Importer und keine automatische Unterrichtsplanung.

## 3.2 Verbindlicher Umfang des ersten technischen Builds

### Grundlegende GUI/App-Shell

- neue beziehungsweise vorhandene Stunde öffnen;
- ruhige, einfache Arbeitsfläche ohne Planungsformular;
- grundlegende Werkzeugleiste und Importaktionen;
- minimale Ablageauswahl für Fach, Reihe und Stunde;
- sichtbarer Speicher-/Verbindungsstatus ohne technische Überladung.
- eine vorbereitete gespiegelte Testreihe öffnen beziehungsweise importieren.

### Arbeitsfläche

- eingebettete, potenziell unendliche Fläche hinter einem `canvas-port`; konkrete Engine nach Excalidraw-/tldraw-Spike;
- Text, Freihand, Marker, Formen, Pfeile;
- Auswahl, Verschieben, Skalieren;
- Undo/Redo;
- zuverlässige Stift-/Touch-Unterscheidung;
- Vollbild und große Touchziele.

### Persistenz und Ablage

- Autosave;
- Crash-/Reload-Wiederherstellung;
- Stunde vollständig erneut öffnen;
- grundlegende Zuordnung zu Fach, Reihe und Stunde;
- lokaler Cache für die aktive Stunde;
- Beelink als kanonischer Primärspeicher;
- keine Abhängigkeit von OneNote oder OneDrive.

### Zentrale Materialfunktionen

- einfacher Bildimport per Drag-and-drop und Dateiauswahl;
- Bild platzieren, skalieren und wieder öffnen;
- PDF als unverändertes Originalasset importieren;
- mindestens einzelne Seiten auswählen beziehungsweise platzieren;
- scharfe Seitendarstellung auf realer Hardware;
- Stift, Marker, Text und Formen als getrennte Annotationen über PDF-Seiten;
- Import und Rendering dürfen die restliche Boardarbeit nicht blockieren.

### Bewusst noch nicht im ersten technischen Build

- Stundenpfad;
- unabhängige Lehrer- und öffentliche Kamera;
- LIVE/GEHALTEN;
- vorbereiteter öffentlicher Draft;
- Zeigewerkzeug;
- Video, OCR, KI, Sharing und Lesson Pack.

Nicht gemeint ist der kleine lokale Spiegelimport. Dieser benötigt weder OCR noch generative KI und dient als realistischer Dateneingang.

Der erste Build ist damit kein komplettes Unterrichtssystem. Er testet GUI, Board, Touch, zentrale Materialien und verlässliche Persistenz als Fundament.

## 3.3 Früher Presenter-Slice

### Unterrichtsstruktur

- optionaler Stundenpfad;
- Schritte mit Name und gespeichertem öffentlichen Viewpoint;
- optional gruppierende Abschnitte;
- einklappbares Pfad-Panel;
- freie Navigation und schnelle Rückkehr;
- Drag-and-drop der logischen Reihenfolge ohne Verschieben der Boardinhalte.

### Tafelregie

- unabhängige Lehrer- und öffentliche Kamera;
- öffentlicher Ausschnitt als privater Rahmen in der Lehreransicht;
- bewusste Kamerafreigabe, keine rohe Spiegelung;
- LIVE und GEHALTEN;
- stabiler On-Air-Zustand bei Reconnect;
- private/public-Trennung im Datenmodell.

Während `GEHALTEN` ist das Smartboard im ersten Presenter-Slice read-only. Vorbereitete Änderungen entstehen zunächst am Lehrergerät und werden erst durch bewusste Freigabe öffentlich. Der UI-Hinweis `Änderungen bereit` ist aus `HELD + prepared change` abgeleitet; es gibt keinen dritten Zustand `BEREIT`. Gepufferte Smartboard-Eingaben bleiben eine mögliche spätere Erweiterung.

### Kandidat für frühen Presenter-Slice

- flüchtiges Zeigewerkzeug/Laserpointer.

Es ist bestätigt relevant, gehört aber nicht in den Grundlagenprototyp. Ob es bereits im ersten Presenter-Slice oder direkt danach folgt, bleibt ein kleiner Scope-Test.

## 3.4 Ausdrücklich nicht in den frühen Grund-/Presenter-Slices

- Videoimport, YouTube und Remotion;
- OCR und Transkription;
- KI- und Bildgenerierungsfunktionen;
- Lesson-Pack-Exportoberfläche und `AI_CONTEXT.md`;
- dauerhafte Schülerlinks;
- Remote-Live-Sitzungen;
- Schülerbearbeitung oder Kollaboration;
- Vorlagen-/Bausteinbibliothek;
- eigener Generalproben-/„Stunde durchgehen“-Modus;
- automatische Qualitätsprüfung oder pädagogische Phasengenerierung.

## 3.5 Nachgelagerte Ausbaustufen

### Stufe 2: OneNote-Ablösung im praktischen Material- und Archivworkflow

- robuste Fach-/Reihen-/Stundenablage;
- Suche, Wiederauffindbarkeit, Duplizieren und Verschieben;
- zuverlässige Assetverwaltung und Backups;
- generisches Video;
- Lehrernotizen und vorbereitete Lösungen;
- Migration beziehungsweise bewusster Übergang bisheriger OneNote-Inhalte, soweit sinnvoll.
- Ausbau des frühen Spiegelimports zu einem robusten inkrementellen Migrationsworkflow.

Diese Stufe macht den Workspace zum tatsächlichen primären Unterrichtsarchiv. OneNote bleibt danach höchstens Altdatenquelle beziehungsweise Exportziel.

### Stufe 3: Maschinenlesbarkeit und Portabilität

- LessonDefinition/Run vertiefen;
- Lesson Pack für Stunde und Reihe;
- Originalassets;
- optionale Text-/OCR-/Transkript-Ableitungen;
- optionales `AI_CONTEXT.md`;
- Exportprofile und Datenschutzvorschau.

### Stufe 4: öffentliche Ausgaben

- dauerhafte read-only Veröffentlichungen für Stunden und Reihen;
- temporäre accountlose Remote-Live-Sitzungen;
- gleicher bereinigter Presentation-State, aber getrennte Lebenszyklen.
- nach einem read-only Slice gezielt freigeschaltete Zuschauerwerkzeuge;
- Teilnahme im Raum oder außerhalb über denselben Link-, QR- und Sessionworkflow;
- Bearbeitungsanfrage, bewusste Lehrerfreigabe und sichtbare exklusive Werkzeugübergabe;
- optionaler persönlicher Wiederaufnahmecode für Gerätewechsel innerhalb der Session;
- Remote-Beiträge zunächst nur im LessonRun beziehungsweise Session-Layer.
- später strukturierte ausfüllbare Aufgaben, wenn Annotation und Textüberlagerung für reale Tabellenworkflows nicht genügen.

### Stufe 5: ortsbezogene KI-Assistenz

- Spracheingabe und Textglättung am gewählten Ort;
- feste Vorbereitungsaktion `Bild erzeugen` für eingeloggte Lehrkräfte;
- kompakter Prompt, parallele Warteschlange und mehrere Bildvarianten;
- fertige Ergebnisse als vorbereitete Bildassets in einer Materialablage, von dort per Drag-and-drop auf das Board;
- alternativ ortsgebundene Bildgenerierung mit Platzhaltern;
- editierbare Illustrationsvorschläge aus bewusst freigegebener Auswahl;
- ausgewählte Objekte verändern;
- später Analyse von Lesson Runs und Reihenplanung.

### Stufe 6: isolierte Schülerarbeit

- reduzierte persönliche Arbeitskopien;
- anonyme Persistenz;
- explizit freigeschaltete Werkzeuge;
- Beiträge verändern niemals unkontrolliert das Lehreroriginal.

Die Stufen sind Reihenfolge, kein fester Releaseplan. Erkenntnisse können kleinere Funktionen verschieben.

## 3.6 Bewusste Nicht-Ziele

- vollständiges LMS, Notenbuch oder Klassenverwaltung;
- Schüler- oder Elternkonten im MVP;
- eigener Videokonferenzdienst;
- generischer KI-Chat als Hauptoberfläche;
- automatische Komplettplanung jeder Stunde;
- fest eingebaute Unterrichtsphasen;
- frühes Plugin-System oder Marketplace;
- eigene Canvas-Engine;
- vollständiges CRDT/Klassencollaboration;
- lückenlose Maus-, Stift- oder Audioaufzeichnung;
- vollständiger Ersatz von SheetifyIMG oder Remotion.

## 3.7 Erfolgskriterien

Der erste technische Build ist erfolgreich, wenn:

1. Text, Formen und Zeichnungen auf echter Hardware zuverlässig funktionieren.
2. Eine Stunde ohne Planungsformular sofort begonnen werden kann.
3. Bilder schnell importiert, platziert, skaliert und erneut geöffnet werden können.
4. PDFs als Originalassets importiert und einzelne Seiten scharf auf dem Board genutzt werden können.
5. Annotationen das Original-PDF nicht verändern.
6. Autosave, Browsercache und Beelink-Persistenz Reload und kurze Verbindungsabbrüche überstehen.
7. Der Nutzer die Grundoberfläche als schnell genug für reale Vorbereitung empfindet.
8. Eine vorhandene gespiegelte Reihe samt mindestens einem lokalen Asset ohne manuelle Neuerfassung geöffnet werden kann.

Der Presenter-Slice ist erfolgreich, wenn zusätzlich:

1. räumlich getrennte Inhaltsinseln als Schritte geordnet werden können;
2. der private Lehrerzoom die öffentliche Kamera nicht verändert;
3. ein Arbeitsauftrag stabil sichtbar bleibt, während privat weitergearbeitet wird;
4. vorbereitete Mac-Änderungen während GEHALTEN erst nach Freigabe erscheinen und das Smartboard in diesem frühen Zustand read-only bleibt;
5. private Elemente niemals an den Presenter übertragen werden;
6. On-Air-Zustand und Stundenpfad Reload/Reconnect überstehen.
