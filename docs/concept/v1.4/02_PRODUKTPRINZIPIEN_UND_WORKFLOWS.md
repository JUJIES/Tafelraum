# 2. Produktprinzipien und Kernworkflows

## 2.1 Verbindliche Produktprinzipien

### Frei erstellen. Später strukturieren.

- Eine neue Stunde öffnet direkt eine Arbeitsfläche.
- Keine verpflichtende Planungsmaske, Phasenwahl oder pädagogische Kategorisierung.
- Inhalte dürfen zunächst räumlich lose entstehen.
- Der optionale Stundenpfad wird dann angelegt, wenn er Nutzen bringt.

### Bedeutung und Darstellung trennen

- Eine Aktivität, ein Arbeitsauftrag oder ein Material kann semantisch beschrieben werden, ohne seine Boardposition festzulegen.
- Das Board ist eine editierbare Darstellung, nicht die alleinige fachliche Quelle der Stunde.
- Optionale Angaben wie Zweck, Auftrag oder erwartetes Ergebnis unterstützen spätere Agenten und alternative Darstellungen.
- Es gibt weiterhin keine verpflichtende Phasenwahl oder Planungsmaske.

### Möglichst wenig Reibung

- Häufige Aktionen benötigen wenige Klicks.
- Gute Standards sind wichtiger als viele früh sichtbare Optionen.
- Schreiben, Zeichnen, Anordnen und Zeigen bleiben in derselben Oberfläche.
- Das Produkt vermeidet unnötige Dialoge, Suchwege und App-Wechsel.

### Ort ist Teil der Aktion

Spätere Werkzeuge folgen einem räumlichen Muster:

- auf freien Raum klicken → dort etwas Neues erzeugen;
- Objekt auswählen → dieses Objekt bearbeiten oder transformieren.

Dieses Prinzip gilt später für Spracheingabe und Bildgenerierung, nicht nur für KI.

### Teacher-controlled

- Die Lehrkraft entscheidet über Sichtbarkeit und Veröffentlichung.
- Private Notizen und Lösungen gelangen nicht in öffentliche Payloads.
- Große KI-Änderungen sind Vorschläge beziehungsweise Vorschau-Revisionen.
- Manuelle Arbeit bleibt unabhängig von KI, Netzwerkjobs und externen APIs.

### Backstage und Bühne

- Lehrerkamera ist privat und frei.
- Öffentliche Kamera bewegt sich nur absichtlich.
- Die normale Maus bleibt privat.
- Ein flüchtiger öffentlicher Zeiger wird bewusst aktiviert.
- Lokale Tafel, Remote-Live und dauerhafte Veröffentlichung sind unterschiedliche Ausgabemodi.

### Oberflächen nach Nutzungssituation trennen

- In der Vorbereitung arbeitet die Lehrkraft allein am Mac; eine öffentliche Tafelansicht ist nicht geöffnet.
- In der Durchführung laufen private Lehreransicht am Mac und lokale Tafelansicht im erweiterten Bildschirmbetrieb als getrennte Clients.
- Beide Clients verwenden dieselbe Lesson- und Canvas-Grundlage, aber unterschiedliche Payloads, Viewports, Shells und Werkzeugzustände.
- Die lokale Tafelansicht ist die öffentliche Bühne im Raum. Sie ist keine persönliche Schüleransicht und kann von Lehrkraft oder Schülern am Board bedient werden.
- Eine spätere persönliche Schüleransicht auf iPad oder Browser bleibt ein eigener Viewer beziehungsweise eine isolierte Arbeitskopie.

### Touch-Unterricht zuerst

Entscheidend ist die Nutzung unter Zeitdruck:

- große Trefferflächen;
- zuverlässiger Stift;
- Finger-Pan;
- echtes Vollbild;
- schnelle Rückkehr zu einem gespeicherten Schritt;
- klarer öffentlicher Status;
- robustes Autosave und Restore.

### Gleiche Grundelemente für Mensch und spätere KI

Eine spätere KI erzeugt keine uneditierbaren Tafel-Screenshots. UI und Agent verwenden validierte Aktionen für dieselben Text-, Form-, Zeichen- und Pfadelemente. Die KI ist jedoch kein Phase-1-Bestandteil.

### Kanonische, portable Lesson-Daten

Das Lesson-Dokument ist Quelle der Wahrheit; die konkrete Canvas-Szene ist eine visuelle Darstellung hinter einer Adaptergrenze. Spätere Exporte werden aus den kanonischen Daten abgeleitet. Unterrichtsinhalt, Flow, Views, Assets und Runs bleiben unterscheidbar.

### Schrittweise aus OneNote lösen

- Aktive oder wiederverwendete Reihen werden zuerst gespiegelt.
- Quellenbeleg, semantischer Spiegel und lokaler Materialbestand werden getrennt dokumentiert.
- Nicht lokal übernommene Einbettungen bleiben mit ihrem Status sichtbar.
- Die Migration darf mit einem vorhandenen Reihenordner beginnen und benötigt keine vollständige OneNote-API.

## 2.2 Vorbereitung ohne vorgeschriebenen Start

Ein typischer freier Ablauf:

1. Fach/Reihe/Stunde öffnen oder unmittelbar eine neue Stunde beginnen.
2. Text, Formen oder Zeichnungen frei anlegen.
3. Bilder oder PDFs importieren, Seiten platzieren und mit Boardelementen beziehungsweise Annotationen ergänzen.
4. Gewünschten öffentlichen Ausschnitt einstellen.
5. Mit einer kurzen Aktion als Schritt speichern.
6. Schritte benennen und optional in Abschnitte gruppieren.
7. Reihenfolge im Stundenpfad per Drag-and-drop ordnen.
8. Private Notizen oder Lösungen als nicht öffentlich kennzeichnen.
9. Stunde automatisch speichern und wieder öffnen können.

Der Stundenpfad entsteht häufig erst gegen Ende der Vorbereitung. Er kann aber jederzeit erweitert oder übersprungen werden.

## 2.3 Unterricht mit kontrollierter Abweichung

1. Lehreransicht auf dem Mac öffnen.
2. Tafelansicht einmal auf den erweiterten Bildschirm ziehen und vollflächig anzeigen.
3. Einen Schritt anklicken oder den öffentlichen Ausschnitt frei setzen.
4. Öffentliche Kamera bewusst auf das Ziel bewegen.
5. Gemeinsam erklären, schreiben oder markieren; öffentliche Änderungen werden als bereinigte Projektion auf der Tafel sichtbar.
6. Bei bewusster Steuerung vom Mac erscheint zusätzlich ein öffentlicher Zeiger, ohne die private Mac-Oberfläche zu spiegeln.
7. Für Arbeit direkt an der Tafel kann die Lehrkraft eine eigene, zunächst verborgene Werkzeugleiste freigeben.
8. Bei einer Arbeitsphase die Anzeige halten.
9. Auf dem Mac privat navigieren und weiterarbeiten; Eingaben am Smartboard können in einen vorbereiteten, noch nicht öffentlichen Draft geschrieben werden.
10. Einen neuen Ausschnitt beziehungsweise vorbereitete Änderungen gezielt zeigen.
11. Bei einer spontanen Abweichung frei arbeiten.
12. Mit einem Klick zum aktuellen oder nächsten gespeicherten Schritt zurückkehren.

Der Pfad ist Orientierung, kein Zwang. „Weiter“, direkte Schrittauswahl und freies Setzen des Tafelausschnitts verwenden denselben Kamerabefehl.

Während `GEHALTEN` bleibt der veröffentlichte Tafelstand unverändert. Ein Hinweis `Änderungen bereit` zeigt an, dass ein am Lehrergerät vorbereiteter Zustand abweicht; `BEREIT` ist kein dritter Modus. Im ersten Presenter-Slice ist das Smartboard während GEHALTEN read-only. Ob ausgewählte Smartboard-Eingaben später sinnvoll gepuffert werden können, bleibt eine nachgelagerte UX-Frage.

## 2.4 Nach der Stunde

Später sinnvoll, aber nicht Bestandteil des ersten technischen Builds:

1. sichtbaren Endzustand sichern;
2. kurze private Reflexionsnotiz ergänzen;
3. ausgewählte Ergebnisse oder Evidenz hinzufügen;
4. Vorbereitung und konkrete Durchführung getrennt halten;
5. daraus später eine Veröffentlichung oder ein Lesson Pack erzeugen;
6. freigegebenen Kontext für Analyse und Reihenplanung verwenden.

Eine lückenlose Replay-Aufzeichnung ist kein Ziel.

## 2.5 Spätere ortsbezogene Erstellung

### Sprache

Mikrofonwerkzeug wählen → Ort anklicken → sprechen → Transkript erscheint dort als Text/Notiz → optional in einen klaren Arbeitsauftrag oder schülergerechten Text glätten.

### Bild

`Bild erzeugen` öffnen → kurzen Wunsch eingeben → einen oder mehrere Jobs starten → parallel weiterarbeiten → fertige Ergebnisse aus der Materialablage per Drag-and-drop auf die Arbeitsfläche ziehen.

Alternativ kann ein Ort beziehungsweise Zielbereich gewählt werden: Wunsch tippen oder sprechen → Platzhalter bleibt sichtbar → Bild wird im Hintergrund erzeugt → Ergebnis dort übernehmen. Bei ausgewähltem Text oder Material darf Tafelraum eine editierbare Illustrationsidee vorschlagen, verwendet aber nur bewusst freigegebenen Kontext und startet keine Generierung ohne Bestätigung.

Mehrere Jobs dürfen parallel laufen; Fehler oder Wartezeiten blockieren das Board nicht. Ein generischer Chat ist nicht die primäre Oberfläche.

## 2.6 Spätere Schülernutzung

- dauerhafte read-only Veröffentlichung einer Stunde oder Reihe ohne Konto;
- getrennt davon temporäre Remote-Live-Sitzung;
- noch später isolierte persönliche Arbeitskopien mit reduzierten Werkzeugen.

Vorlagen-/Bausteinbibliothek, Generalprobenmodus und automatische pädagogische Phasen sind bewusst nicht Bestandteil der bestätigten Roadmap.
