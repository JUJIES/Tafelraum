# Schema-Beispiele

Diese Dateien sind Diskussionsgrundlagen, keine finalen APIs oder JSON Schemas.

## Aktuelle Konzeptbeispiele

- `lesson-v0.3.example.json`  
  LessonDefinition mit optionalen Activities, LessonFlow, getrennten Views, PresentationSteps und Importreferenz.

- `mirror-v0.1.example.json`  
  Inkrementeller Reihen-/Stundenspiegel mit Quellen-, Evidenz- und Durchführungsstatus.

- `material-manifest-v0.1.example.json`  
  Materialinventar mit lokaler Verfügbarkeit, externer Quelle, Herkunft, Rechten und Beziehungen.

- `presentation-state-v0.2.example.json`  
  Lehrer-, On-Air- und vorbereiteter Viewport sowie LIVE/HELD und flüchtiger Public Pointer.

- `live-session-v0.1.example.json`  
  Bewusst spätere Skizze einer temporären, accountlosen Remote-Live-Sitzung.

- `command-batch-v0.2.example.json`  
  Aktuelle Command-Skizze ohne verpflichtende Phasen und mit getrennten Audience-/Reveal-Aktionen.

- `publication-v0.2.example.json`  
  Dauerhafte, bereinigte read-only Release mit Stundenpfad statt Phasen-Replay.

## Historische Konzeptbeispiele

- `lesson-v0.2.example.json`
- `lesson-v0.1.example.json`
- `command-batch-v0.1.example.json`
- `publication-v0.1.example.json`

Diese Dateien bleiben unverändert nachvollziehbar, sind aber **deprecated concept examples**. Version 0.1 enthält das überholte Pflichtmodell aus Phasen/Frames beziehungsweise alte Visibility-Vermischungen. `lesson-v0.2` ist ein Zwischenschritt ohne eigenständige Activity-/View-Schicht. Sie dürfen nicht als Grundlage für einen neuen Build verwendet werden.

## Leitplanken für v0.2

Die folgenden Leitplanken gelten weiterhin; für neue Lesson-Diskussionen ist jedoch v0.3 führend.

- `lessonPath` ist optional;
- Abschnitte gruppieren Schritte, sind aber keine pädagogischen Pflichtphasen;
- Schritt referenziert einen gespeicherten Viewpoint;
- Teacher-, On-Air-, Prepared- und Step-Viewpoints haben verschiedene Lebenszyklen;
- Unterrichtszielgruppe, Reveal-Zustand, Publication-Policy und Sensitivität sind getrennt;
- Public Pointer ist flüchtig und gehört nicht ins Lesson-Dokument;
- Originalassets liegen außerhalb des Canvas-Payloads;
- die Canvas-Engine bleibt hinter einer Adaptergrenze;
- öffentliche Clients erhalten nur bereinigte Daten.

## Ergänzungen in v0.3 / Mirror v0.1

- Activities und LessonFlow sind von BoardViews getrennt;
- semantische Angaben bleiben optional;
- ein Board ist eine View, nicht die alleinige Lesson-Beschreibung;
- Spiegeldateien dürfen Unsicherheit und unvollständige Migration ausdrücken;
- Materialverfügbarkeit und externe Herkunft sind explizit;
- Beelink-Pfade werden nicht als dauerhafte Datenidentität verwendet.

## Noch offen

- endgültige Feldnamen;
- JSON Schema versus Zod;
- Rechteck- versus Kameraabstraktion für Viewpoints;
- Commands/Patches/Snapshots;
- Asset-URI- und Storage-Schema;
- Migrationsstrategie;
- genaue Engine-Metadaten nach der Canvasentscheidung;
- genaue LIVE/HELD-Zustandsmaschine und UX für den abgeleiteten Hinweis `Änderungen bereit`;
- Abschnitts-Viewpoints;
- Remote-Session-Transport.
