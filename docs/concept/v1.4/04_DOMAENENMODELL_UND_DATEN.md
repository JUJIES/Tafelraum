# 4. Domänenmodell und Daten

## 4.1 Kanonische Einheit

**Starke Empfehlung:** Das Lesson-Dokument ist Quelle der Wahrheit. Die gewählte Canvas-Engine ist Editor und Renderer für einen Teil davon, nicht das vollständige Domänenmodell.

## 4.2 Konzeptionelle Hierarchie

```text
Workspace
└── Subject
    └── Unit
        └── LessonDefinition
            ├── Activity[]?            # optionale Unterrichtssemantik
            ├── LessonFlow?            # logische Reihenfolge
            ├── View[]                 # Board, später weitere Darstellungen
            │   └── BoardView
            ├── PresentationStep[]?    # Viewpoints auf eine View
            ├── Asset[]
            ├── TeacherNote[]
            ├── LessonRun[]
            ├── Publication[]
            └── LiveSession[]      # später
```

Das ist ein Zielmodell, keine bereits beschlossene Tabellenstruktur.

## 4.3 Optionale semantische Unterrichtsschicht

Eine Lesson kann optionale Aktivitäten enthalten. Sie beschreiben Bedeutung und Handlung unabhängig von der räumlichen Darstellung:

- Titel und freier Zweck;
- Arbeitsauftrag;
- mögliche Lehrer- und Schülerhandlung;
- erwartetes Ergebnis;
- Materialreferenzen;
- optional frei benannte Phase oder Kategorie;
- Evidenz- und Durchführungsstatus bei importierten Stunden.

Die Bedienung erzwingt diese Felder nicht. Eine Stunde darf weiterhin direkt auf einem leeren Board beginnen. Semantik kann später ergänzt, aus einem Spiegel importiert oder von einem Agenten vorgeschlagen werden.

## 4.4 Views und Board

Das Board ist eine zentrale View auf die Lesson. Standardmäßig reicht eine engine-gekapselte BoardView pro Stunde. Spätere Darstellungen können Präsentations-, Druck- oder Schüleransichten sein, ohne den fachlichen Inhalt zu duplizieren.

Räumliche Inhaltsinseln sind keine eigenen Pflichtobjekte. Sie können aus Bounds, Elementgruppen, Aktivitätsreferenzen und gespeicherten Viewpoints abgeleitet werden.

## 4.5 Board

Das Board ist eine potenziell unendliche, frei navigierbare Arbeitsfläche. Standardmäßig reicht ein Hauptboard pro Stunde. Mehrere Boards bleiben eine spätere technische Option, falls Performance, Trennung oder Organisation sie erfordern.

Boardelemente können optional auf eine Activity oder ein Asset verweisen. Nicht zugeordnete freie Elemente bleiben vollständig zulässig.

## 4.6 Optionaler Stundenpfad

### LessonFlow / LessonPath

- darf vollständig fehlen;
- enthält eine geordnete Folge von Schritten;
- kann Schritte optional durch Abschnitte gruppieren;
- bestimmt die logische Unterrichtsreihenfolge, nicht die Boardposition.
- kann Activities ordnen und PresentationSteps als konkrete Viewpoints referenzieren.

### Section / Abschnitt

Mindestens:

- `id`;
- optionaler, frei wählbarer `title`;
- `order`;
- geordnete Referenzen auf Schritte.

Offen:

- eigener Viewpoint oder Navigation zum ersten Schritt;
- öffentliche Farbe/Titel;
- dezente Fortschrittsanzeige.

Ein Abschnitt ist keine fest eingebaute didaktische Phase. „Einstieg“ oder „Sicherung“ sind mögliche Benennungen durch den Nutzer.

### Step / Schritt

Mindestens:

- `id`;
- optionaler `title`;
- `order`;
- optionale `sectionId`;
- `viewpoint`;
- optionales Thumbnail.

Ein Schritt speichert keinen Screenshot als Quelle der Wahrheit. Er verweist auf einen lebendigen Boardbereich. Freie Navigation überschreibt ihn nicht; eine Aktualisierung benötigt eine bewusste Aktion.

### Viewpoint

Ein Viewpoint beschreibt einen Ausschnitt im Boardkoordinatenraum, unabhängig von der konkreten Fenstergröße. Eine mögliche Darstellung ist ein Rechteck mit optionalem Fit-/Padding-Verhalten. Die genaue Kameraabstraktion ist offen.

Zu unterscheiden sind:

- `teacherViewport`: flüchtig, privat;
- `onAirViewport`: aktueller öffentlicher Ausschnitt;
- `preparedViewport`: optional vorbereitetes Ziel während GEHALTEN;
- `stepViewport`: dauerhaft mit einem Schritt gespeichert.

Während `GEHALTEN` kann neben einem `preparedViewport` auch eine `preparedRevision` existieren. Sie enthält noch nicht veröffentlichte Änderungen vom Mac oder Smartboard. `Änderungen bereit` wird aus der Abweichung zwischen vorbereitetem und aktuellem On-Air-Zustand abgeleitet; es ist kein eigener Modus.

## 4.7 LessonDefinition und LessonRun

### LessonDefinition

Wiederverwendbare Vorbereitung mit:

- Titel und optionalen organisatorischen Angaben;
- optionalen Activities und LessonFlow;
- einer oder mehreren Views einschließlich Boardzustand;
- optionalen PresentationSteps und Viewpoints;
- Assets;
- privaten Notizen;
- vorbereiteten öffentlichen und verborgenen Inhalten.

Es gibt keine verpflichtenden Lernziel-, Dauer-, Sozialform- oder Phasenfelder.

### LessonRun

Spätere konkrete Durchführung:

- Basisrevision der Definition;
- Datum/Lerngruppe, soweit gewünscht;
- tatsächlicher sichtbarer Endzustand;
- relevante On-Air-Ereignisse;
- live ergänzte Inhalte;
- Beiträge aus einer freigegebenen Interaktion an der lokalen Tafel;
- Evidence und Reflexion.

Ein Run überschreibt die Vorbereitung nicht automatisch. Insbesondere Tafelbeiträge von Lehrkraft oder Schülern werden nicht stillschweigend in die wiederverwendbare LessonDefinition zurückgeschrieben. Ob ein Run bewusst gestartet oder aus Unterrichtsmodus-Ereignissen abgeleitet wird, ist offen. Eine lückenlose Bewegungsaufzeichnung ist kein Ziel.

## 4.8 Assets

Ein Asset ist generisch modelliert:

- stabile ID;
- Medientyp: Bild, PDF, Video, Audio oder Link;
- Originaldatei beziehungsweise Quelle;
- optionale Rolle, etwa Arbeitsblatt, Lösung, Illustration oder Erklärung;
- optionale Herkunft, etwa Upload, Bildgenerierung, SheetifyIMG, Remotion oder extern;
- optionale abgeleitete Daten wie Thumbnail, OCR, Transkript oder Spezifikation.

Für erzeugte Bilder kann die Herkunft zusätzlich Job-ID, Provider-/Modellhinweis, Erstellungszeit, ursprünglichen Prompt, ausdrücklich freigegebenen Kontext und Beziehungen zwischen Varianten beziehungsweise Renditions enthalten. Diese Provenienz bleibt verfügbar, wird aber nicht als dauerhafte UI-Erklärung auf dem Board angezeigt. Ein fertiges Generatorergebnis wird erst bei bewusster Übernahme zum Lesson-Asset.

Für importierte beziehungsweise gespiegelte Materialien zusätzlich sinnvoll:

- Verfügbarkeit: `local`, `external-link`, `onenote-only`, `source-export-only`, `missing` oder `unknown`;
- lokale Referenz und externe URL getrennt;
- Herkunftsseite und Importzeitpunkt;
- Rechte-/Weitergabestatus, soweit bekannt;
- Beziehungen wie `solutionFor`, `derivedFrom` oder `usedBy`.

Medientyp, didaktische Rolle und Herkunft sind getrennte Dimensionen. SheetifyIMG- oder Remotion-Metadaten sind optionale Erweiterungsblöcke.

## 4.9 Sichtbarkeit und Datenschutz

Nicht in einem einzigen `visibility`-Enum vermischen:

1. **Unterrichtszielgruppe:** `teacher`, `public`, `both`;
2. **aktueller Darstellungszustand:** sichtbar oder bewusst verborgen;
3. **Publication-Policy:** darf exportiert/veröffentlicht werden;
4. **Sensitivität:** etwa intern, Schülerdaten, anonymisiert.

Öffentliche Clients erhalten eine bereinigte Datenmenge. Private Inhalte werden nicht nur per CSS versteckt.

Private Lehrernotizen können räumlich auf dem Board liegen. Eine zusätzliche Bindung an Abschnitt oder Schritt ist möglich, aber UX-seitig offen.

## 4.10 Dokument-, Präsentations- und Sessionzustand

### Dauerhafter Dokumentzustand

- Boardelemente und Assets;
- Stundenpfad;
- Sichtbarkeits-/Sharing-Metadaten;
- Revisionen;
- vorbereitete Inhalte.

### Wiederherstellbarer Presentation-State

- `lessonId`;
- `onAirRevision`;
- `onAirViewport`;
- optional `preparedRevision`;
- optional `preparedViewport`;
- `LIVE` oder `HELD`;
- aktiver Schritt;
- relevante Medienzustände, soweit später benötigt.

### Flüchtiger Session-State

- Auswahl und Hover;
- Lehrercursor;
- Public Pointer/Laserpointer;
- flüchtiger Aufmerksamkeitsimpuls an einer öffentlichen Zeigerposition;
- bewusste öffentliche Steuerung durch die Lehrkraft;
- aktives Werkzeug, Sichtbarkeit, Dockingzone und laufende Drag-Position der lokalen Tafelwerkzeugleiste;
- laufende Drag-Position vor dem Loslassen;
- Verbindungsstatus.

Für eine spätere interaktive Remote-Live-Sitzung zusätzlich:

- pseudonyme Sessionteilnehmer mit eindeutiger Teilnehmer-ID und selbst gewähltem Anzeigenamen;
- allgemeiner Beitrittslink, QR-/Teilnahmecode und optional persönlicher zeitlich begrenzter Wiederaufnahmecode;
- Bearbeitungsanfragen mit Teilnehmer-ID, Zeitpunkt und Status `pending`, `granted`, `rejected`, `cancelled` oder `expired`;
- aktueller Werkzeughalter, Clientart `teacher`, `local-board` oder `remote` und aktives öffentliches Werkzeug;
- freigegebener Bearbeitungsumfang, etwa Viewport, Bereich, Objekt oder Feldmenge;
- Zeitpunkt, Ablauf beziehungsweise Lease-Status der Werkzeugübergabe;
- flüchtige Präsenz- und Übergabehinweise.

Der Werkzeug-Token ist Sessionzustand, kein Lesson-Element. Beiträge können Herkunft und Teilnehmerreferenz im LessonRun tragen; die Selbstauskunft eines Anzeigenamens wird nicht zur verifizierten Personenidentität hochgestuft.

Eine später semantisch ausfüllbare Tabelle ist kein beliebiges Bild und keine PDF-Rendition. Sie benötigt ein strukturiertes Activity-/Unterrichtsobjekt mit stabilen Feld- beziehungsweise Zell-IDs. Antworten werden über begrenzte Commands gespeichert und können als Beitrag im LessonRun referenziert werden; die Canvas-Engine bleibt Darstellung und Eingabefläche, nicht Eigentümerin der Tabellenlogik.

Lehrer- und Tafelclient besitzen voneinander unabhängige Auswahl- und Werkzeugzustände. Eine Werkzeugwahl an der Tafel verändert weder das aktive Werkzeug noch die Shell der Lehreransicht. Öffentlicher Zeiger und Tafelwerkzeugleiste können gleichzeitig sichtbar sein. Zeiger und Aufmerksamkeitsimpuls sind keine Lesson-Elemente und werden nicht exportiert.

## 4.11 Drei öffentliche Lebenszyklen

- **Lokale Tafelansicht:** während einer Stunde im Raum.
- **Remote-Live-Sitzung:** später temporär und synchron.
- **Publication:** später dauerhafte, versionierte, bereinigte Release.

Diese Objekte können denselben öffentlichen Rendering-Payload verwenden, besitzen aber getrennte Tokens, Rechte und Lebenszyklen.

## 4.12 Änderungen und Commands

**Starke Empfehlung:** Dauerhafte Mutationen laufen durch validierte Commands:

- undo-fähig;
- atomar gruppierbar;
- mit Herkunft;
- für UI und spätere KI gleich;
- durch einen Canvas-Adapter in die gewählte Engine übersetzt.

Snapshots plus wenige nachvollziehbare Commands/Patches sind wahrscheinlicher als vollständiges Event Sourcing. Alle Pointerbewegungen müssen nicht gespeichert werden.

Neben Canvas-Commands benötigt die spätere Domänenschicht semantische Aktionen wie `createActivity`, `linkAssetToActivity`, `setMaterialRole`, `setLessonFlow`, `recordRunOutcome` oder `createReflection`. UI und Agent verwenden auch dafür dieselbe validierte Schicht.

## 4.13 Spiegel und Import

`Mirror`, `LessonMirror` und `MaterialManifest` sind vorläufige Importobjekte. Sie dürfen unvollständig sein und Unsicherheit ausdrücken. Ein Importer validiert und überführt sie später in LessonDefinition, Activities, Assets, Flow und Views. Sie sind nicht mit einer fertigen Produktionsdatenbank gleichzusetzen.
