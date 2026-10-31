# 15. Migration, Spiegel und Unterrichtsspeichermodell

## 15.1 Zweck

Der lokale Unterrichtsspiegel ist die schrittweise Übergangsschicht zwischen OneNote und dem Teaching Workspace. Er soll nicht jedes OneNote-Tafelbild pixelgenau nachbauen. Er bewahrt stattdessen:

- Originalquellen und Materialien, soweit lokal verfügbar;
- Links und externe Herkunft;
- den fachlichen und didaktischen Zusammenhang;
- eine nachvollziehbare Stundenreihenfolge;
- den Unterschied zwischen Vorbereitung, Durchführung und Rekonstruktion;
- genügend stabile Referenzen für eine spätere App- oder Agentenübernahme.

Die Migration erfolgt nach Bedarf. Aktive und wiederverwendete Reihen werden zuerst gespiegelt; ein vollständiger Big-Bang-Export aller OneNote-Inhalte ist kein Ziel.

## 15.2 Drei komplementäre Ebenen

```text
Quellenbeleg
├── unveränderter OneNote-PDF-Export oder Screenshot
└── dokumentiert den damaligen sichtbaren Zustand

Semantischer Spiegel
├── Reihenspiegel und Stundenbeschreibungen
└── erklärt Inhalt, Ablauf, Status und Zusammenhänge

Portabler Materialbestand
├── Originaldateien, lokale Ableitungen und Links
└── macht Assets auffindbar und später importierbar
```

Keine Ebene ersetzt die anderen vollständig. Der PDF-Export erhält die historische Ansicht, der semantische Spiegel macht sie verständlich und das Materialmanifest macht Dateien und Quellen maschinenlesbar.

## 15.3 Vorläufige Ordnerstruktur

Bestehende Reihenordner dürfen schrittweise ergänzt werden:

```text
Fach/Reihe/
├── reihenspiegel.md
├── spiegel.json                    # optionaler maschinenlesbarer Index
├── stunden/                        # erst bei Bedarf
│   └── lesson-2026-08-27-01/
│       ├── stunde.md
│       └── lesson-mirror.json
├── arbeitsblaetter/
├── impulse/
├── medien-und-links/
├── quellen/
├── reflexion/
└── materialien.manifest.json       # Referenzen auf vorhandene Ordner/Dateien
```

Vorhandene Ordner wie `arbeitsblaetter/`, `impulse/` oder `quellen/` werden nicht zugunsten eines neuen Parallelarchivs verschoben. Das Manifest referenziert ihre bestehenden Pfade.

## 15.4 Menschliche und maschinenlesbare Darstellung

### `reihenspiegel.md`

Bleibt die gut lesbare fachliche Übersicht für Lehrkraft und KI. Er enthält nicht jedes technische Detail und darf erklärenden Fließtext verwenden.

### `spiegel.json`

Optionaler stabiler Reihenindex mit:

- Fach, Reihe und stabilen IDs;
- Reihenfolge und Referenzen auf Stunden;
- Quellenständen;
- Migrationsstatus;
- Referenz auf das Materialmanifest.

### `lesson-mirror.json`

Optionaler strukturierter Stundenstand mit:

- Quelle und Datum;
- Aktivitäten und möglicher Reihenfolge;
- optionalen semantischen Rollen;
- Materialreferenzen;
- Aussage- und Durchführungsstatus;
- späteren Views oder LessonRun-Referenzen.

Diese JSON-Dateien sind in Version 0.1 Importhilfen und noch nicht die endgültige Produktionsdatenbank.

## 15.5 Aussage- und Durchführungsstatus

Jede relevante Aussage beziehungsweise Aktivität kann getrennt kennzeichnen:

### Evidenz

- `observed` – direkt in OneNote oder einer Quelle sichtbar;
- `user-confirmed` – von der Lehrkraft bestätigt;
- `reconstructed` – plausibel abgeleitet;
- `planned` – vorbereitet oder vorgeschlagen.

### Durchführung

- `unknown` – Bearbeitungsstand nicht erkennbar;
- `prepared` – Material oder Aktivität vorbereitet;
- `used` – nachweislich eingesetzt;
- `partially-used` – begonnen oder teilweise eingesetzt;
- `skipped` – bewusst nicht durchgeführt;
- `continued` – in eine spätere Stunde verschoben.

Ein in OneNote eingefügtes Arbeitsblatt erhält ohne weitere Bestätigung nicht automatisch `used`.

## 15.6 Optionale Unterrichtssemantik

Semantische Angaben helfen späteren Agenten und verschiedenen Darstellungen, bleiben aber optional:

- `purpose`: zum Beispiel Einstieg, Erarbeitung, Sicherung oder Reflexion;
- `instruction`;
- `teacherAction`;
- `studentActivity`;
- `expectedOutcome`;
- `socialForm`;
- `materialIds`;
- `solutionAssetIds`;
- `notes`.

Es gibt weder eine verpflichtende Phasenmaske noch eine fest vorgeschriebene Taxonomie. Werte können frei formuliert, von einem Agenten vorgeschlagen oder vollständig weggelassen werden.

Grundsatz:

> Keine Strukturpflicht in der Bedienung, aber Strukturfähigkeit im Datenmodell.

## 15.7 Materialmanifest

Ein Materialeintrag trennt mindestens:

- stabile ID;
- Medientyp;
- didaktische Rolle;
- lokalen Verfügbarkeitsstatus;
- lokale Datei oder externe Quelle;
- Herkunft und Importzeitpunkt;
- Rechte-/Weitergabestatus, soweit bekannt;
- optionale Beziehungen, etwa `solutionFor` oder `derivedFrom`;
- optionale Ableitungen wie Thumbnail, OCR oder Transkript.

Verfügbarkeitsstatus:

- `local`;
- `external-link`;
- `onenote-only`;
- `source-export-only`;
- `missing`;
- `unknown`.

Videos werden nicht automatisch kopiert. URL, Titel, Vorschaubild, verwendeter Ausschnitt und Abrufdatum können für eine Rekonstruktion genügen. Externe Materialien werden nur im rechtlich und organisatorisch zulässigen Umfang lokal übernommen.

## 15.8 Verhältnis zum späteren Lesson-Modell

Der Spiegel ist Import- und Rekonstruktionsformat. Die spätere Lesson-Struktur darf reichhaltiger sein:

```text
Mirror/Import
→ validierte Assets und Aktivitäten
→ LessonDefinition
→ LessonFlow
→ Board-/Presentation-Views
→ LessonRun
```

Das Board ist eine mögliche Darstellung der Lesson, nicht die alleinige semantische Quelle. Importierte Viewpoints oder Screenshots können als Ausgangslage dienen, müssen aber nicht die ursprüngliche OneNote-Geometrie bewahren.

## 15.9 Inkrementeller Migrationsworkflow

1. OneNote-Seite lesen.
2. Unveränderten PDF-Export oder geeigneten Quellenbeleg sichern.
3. sichtbare Materialien und Links inventarisieren.
4. lokal verfügbare Originaldateien übernehmen oder referenzieren.
5. nicht übertragene Einbettungen ausdrücklich markieren.
6. Reihenspiegel beziehungsweise Stundenbeschreibung aktualisieren.
7. optional `spiegel.json`, `lesson-mirror.json` und Materialmanifest erzeugen.
8. später den Spiegel in eine LessonDefinition importieren.

Alte Reihen werden erst migriert, wenn sie wieder genutzt oder bewusst archiviert werden.

## 15.10 Früher Produktspike

Vor einer breiten OneNote-Ablösung soll eine vorhandene Reihe, beispielsweise `LER/Reisen` oder `Englisch/Means of transport`, als reales Testkorpus dienen:

1. lokalen Reihenordner öffnen;
2. Spiegel und Materialmanifest lesen;
3. verfügbare und fehlende Assets anzeigen;
4. Aktivitäten und Reihenfolge übernehmen;
5. daraus eine erste Board- und Präsentationsansicht erzeugen;
6. Änderungen speichern und erneut öffnen.

Dieser Spike benötigt keine vollständige OneNote-API, OCR oder automatische Phasenerkennung.

## 15.11 Noch offene Fragen

- Ist `spiegel.json` dauerhaft kanonisch oder später nur Importartefakt?
- Wann wird eine Stunde in eine eigene Datei ausgelagert?
- Welche minimalen semantischen Felder bewähren sich über mehrere Fächer?
- Wie werden gemeinsam genutzte Assets reihenübergreifend referenziert?
- Wie werden Rechte, Löschfristen und personenbezogene Inhalte behandelt?
- Welche Teile des Spiegels erzeugt ein Agent automatisch und welche benötigen Bestätigung?
- Wie werden bestehende OneNote-Links und eingebettete Dateien technisch extrahiert?

Diese Fragen werden anhand realer Reihen und nicht allein durch Schemas entschieden.
