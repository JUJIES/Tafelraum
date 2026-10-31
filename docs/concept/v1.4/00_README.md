# AI Teaching Workspace – Konzeptpaket

**Pack-Version:** 1.4.0<br>
**Arbeitsstand:** 30. August 2026<br>
**Sprache:** Deutsch<br>
**Status:** konsolidiertes Vorlaufkonzept; noch kein Produktionsbauplan<br>
**Arbeitsname:** Teaching Workspace; der endgültige Produktname ist offen.

## Zweck

Dieses Paket ist der eigenständige Übergabekontext für die weitere Produkt- und Architekturarbeit. Es dokumentiert:

- den realen Unterrichtsbedarf;
- bestätigte Leitplanken und bewusst spätere Funktionen;
- das Modell aus freiem Board, optionalem Stundenpfad und kontrollierter öffentlicher Ansicht;
- ein konzeptionelles Daten- und Zustandsmodell;
- technische Risiken und Spikes;
- aufgelöste Grundentscheidungen und die tatsächlich verbleibenden offenen Fragen.

Die Anwendung selbst wird mit diesem Paket noch nicht implementiert.

## Zentrale Produktaussage

> Das Teaching Workspace ist eine reibungsarme, kreative Unterrichts- und Präsentationsumgebung. Die Lehrkraft arbeitet frei auf einer potenziell unendlichen Fläche, ordnet ausgewählte Ansichten bei Bedarf zu einem Stundenpfad und steuert bewusst, was die lokale oder entfernte Schüleransicht sieht.

Interne Kurzformel:

> **Frei erstellen. Später strukturieren. Bewusst zeigen.**

Das Produkt ist weder ein generisches Whiteboard noch ein LMS, ein PowerPoint-Klon oder ein ChatGPT-Wrapper. Seine Differenzierung entsteht aus der Kombination:

- freies, editierbares Board;
- optionaler Stundenpfad aus Abschnitten und Schritten;
- unabhängige Lehrer- und öffentliche Kamera;
- private Lehreransicht und bereinigte Schüleransicht;
- touchgerechte Tafelregie;
- später ortsbezogene Sprach- und Generierungswerkzeuge;
- langfristig maschinenlesbare Stunden und Reihen;
- einen inkrementellen Übergang aus OneNote über semantische Spiegel und portable Materialmanifeste;
- später getrennte Remote-Live-Sitzungen und dauerhafte Veröffentlichungen.

Seit Version 1.3 wird zusätzlich klar getrennt:

```text
Unterrichtsinhalt und Aktivitäten
→ optionaler Unterrichtsfluss
→ eine oder mehrere Darstellungen, darunter das freie Board
→ konkrete Durchführung
```

Das Board bleibt die zentrale kreative Arbeits- und Präsentationsfläche, ist aber nicht die alleinige semantische Beschreibung einer Stunde.

Seit Version 1.4 wird außerdem die technische Arbeitsfläche ausdrücklich als austauschbare Engine hinter einem `canvas-port` behandelt. Excalidraw ist der lizenzoffene Baseline-Kandidat; tldraw wird in einem kleinen, identischen Vertikalschnitt als stärker erweiterbarer Gegenkandidat geprüft. Das ist kein beschlossener Wechsel. Unterrichtsmodell, Assets, Flow und Public Projection dürfen von keiner der beiden Canvas-Engines abhängig werden.

## Frühe Builds in einem Satz

Der erste technische Build validiert bewusst nur die Grundsubstanz: browserbasierte App-Shell, grundlegende GUI, freie Arbeitsfläche, Touch/Stift, Bildimport, PDF-Import sowie Speichern und Wiederöffnen auf dem Beelink. Ein vorgeschalteter kleiner Importspike nutzt eine vorhandene gespiegelte Reihe als reales Testkorpus. Vor der Bindung an eine Canvas-Engine wird Excalidraw als Baseline gegen einen zeitlich begrenzten tldraw-Gegenspike geprüft. Stundenpfad, zwei Kameras und LIVE/GEHALTEN folgen als früher Presenter-Slice. Video, OCR, generative KI, Lesson-Pack-Oberfläche, Schülerlinks und Remote-Live gehören noch nicht in diesen ersten Build.

## Angrenzende Systeme

### SheetifyIMG

- KI-gestützte Arbeitsblattgenerierung;
- derzeit image-first mit GPT Image 2;
- liefert Arbeitsblatt-Snapshot und PDF.

Für das Teaching Workspace ist das Ergebnis zunächst ein generisches Bild- oder PDF-Asset. SheetifyIMG-interne Spezifikationen oder QC-Daten dürfen später optional mitgeliefert werden, sind aber keine Voraussetzung.

### Erklärvideo-/Tutorial-Pipeline

- KI → Code → Video;
- Remotion als Engine;
- Excalidraw, Rough Notation und eventuell Vivus als visuelle Bausteine.

Video und Remotion werden später generisch integriert. Das Workspace-Konzept schreibt der noch entstehenden Pipeline kein festes Szenen- oder Packformat vor.

### Betrieb und Ablage

Der private Beelink-Heimserver ist der bestätigte Primärspeicher und die kanonische Serverablage. Diese bewusste Trennung von schulischer beziehungsweise arbeitgeberseitiger Infrastruktur ist Teil des Produktziels. Ein lokaler Browsercache schützt die aktive Stunde bei Verbindungsabbrüchen. OneDrive kann später höchstens als optionaler Export-, Backup- oder Adapterweg hinzukommen; es ist nicht Quelle der Wahrheit.

Langfristig soll das Teaching Workspace den relevanten OneNote-Workflow einschließlich Fach-/Reihenarchiv, Materialablage, Vorbereitung und Unterrichtsdurchführung ersetzen. OneNote bleibt nur Übergangssystem, solange notwendige Funktionen noch fehlen.

## Dokumente und führende Zuständigkeiten

1. `01_AUSGANGSLAGE_UND_VISION.md` – Unterrichtskontext und Zielbild
2. `02_PRODUKTPRINZIPIEN_UND_WORKFLOWS.md` – Leitprinzipien und reale Abläufe
3. `03_MVP_UND_ROADMAP.md` – Phasenabgrenzung
4. `04_DOMAENENMODELL_UND_DATEN.md` – kanonische Begriffe und Objekte
5. `05_WHITEBOARD_TOUCH_UND_MATERIALIEN.md` – Board-, Touch- und Pfad-UX
6. `06_TAFELREGIE_LIVE_HOLD.md` – öffentliche Kamera und Presenter-State
7. `07_ARTIFACTS_PDF_VIDEO_REMOTION.md` – spätere Materialintegrationen
8. `08_LESSON_PACK_UND_MASCHINENLESBARKEIT.md` – späteres Austauschformat
9. `09_KI_ARCHITEKTUR_SPAETER.md` – spätere KI-Assistenz
10. `10_TEILEN_SCHUELERANSICHT_UND_AUFGABEN.md` – drei öffentliche Ausgabemodi
11. `11_TECHNISCHE_ARCHITEKTUR.md` – reversible technische Richtung
12. `12_ENTSCHEIDUNGEN_UND_OFFENE_FRAGEN.md` – maßgebliches Entscheidungsregister
13. `13_REFERENZPROJEKTE.md` – Inspirationsquellen
14. `14_NAECHSTE_SCHRITTE.md` – Spike-Reihenfolge und vertikaler Slice
15. `15_MIGRATION_SPIEGEL_UND_UNTERRICHTSSPEICHERMODELL.md` – inkrementelle OneNote-Migration, Spiegel und Materialmanifest
16. `16_ARCHITEKTUR_STACK_UND_CANVAS_ENTSCHEIDUNG.md` – Umsetzungsarchitektur, offene Gates und Canvasvergleich
17. `CHANGELOG_V1_1.md` – historische Änderungen gegenüber Version 1.0
18. `CHANGELOG_V1_2.md` – aufgelöste Grundentscheidungen und Scope-Korrekturen
19. `CHANGELOG_V1_3.md` – semantische Lesson-Schicht und Migrationsfundament
20. `CHANGELOG_V1_4.md` – Stackpräzisierung und reversible Canvasentscheidung
21. `99_HANDOFF_PROMPT.md` – direkt nutzbarer Auftrag an eine weitere KI

`schemas/` enthält nur Diskussionsbeispiele, keine finale API.

## Statusklassen

- **Bestätigte Leitplanke:** klar beabsichtigt oder wiederholt bestätigt.
- **Starke Empfehlung:** aus den Anforderungen abgeleitet, aber reversibel.
- **Vorläufige Annahme:** plausibler Startpunkt, der prototypisch geprüft werden muss.
- **Offen:** benötigt eine Entscheidung oder einen Spike.

Bei Widersprüchen ist `12_ENTSCHEIDUNGEN_UND_OFFENE_FRAGEN.md` das maßgebliche Register.
