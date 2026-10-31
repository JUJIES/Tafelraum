# 8. Lesson Pack und Maschinenlesbarkeit – später

## 8.1 Ziel

Langfristig sollen eine vollständige Stunde und optional eine ganze Unterrichtsreihe portabel und für Menschen, Skripte sowie unterschiedliche KI-Systeme lesbar sein.

Maschinenlesbar bedeutet:

- kanonische Lesson-Struktur;
- Boardelemente und räumliche Beziehungen;
- Stundenpfad, Abschnitte, Schritte und Viewpoints;
- alle digital sichtbaren Texte;
- Originalstriche und Formen;
- verwendete Originalassets;
- private Notizen nur bei bewusst privatem Export;
- sichtbarer Endzustand;
- optional bedeutende On-Air-Ereignisse und Lesson Runs.

Grenze:

> Was nur mündlich gesagt und weder notiert noch transkribiert wurde, gehört nicht zum digitalen Unterrichtskontext.

## 8.2 Kein Feature des ersten technischen Builds

Der erste technische Build benötigt strukturierte kanonische Daten, aber noch:

- keine Lesson-Pack-Oberfläche;
- keine OCR-Pipeline;
- kein automatisch erzeugtes `AI_CONTEXT.md`;
- keinen vollständigen Reihenexport.

Portabilität wird im Datenmodell mitgedacht und erst nach Validierung des manuellen Kerns umgesetzt.

Davon zu unterscheiden ist der frühe lokale Spiegelimport. Er benötigt keine Lesson-Pack-Oberfläche und kann einen normalen Reihenordner mit `reihenspiegel.md`, Materialmanifest und optionalen JSON-Indizes lesen.

## 8.3 Spiegelordner als Vorstufe

Vor einem vollständigen `.lessonpack` dient der bestehende Unterrichtsordner als transparente, agentenlesbare Vorstufe:

```text
Reihe/
├── reihenspiegel.md
├── spiegel.json                    # optional
├── materialien.manifest.json       # optional
├── arbeitsblaetter/
├── impulse/
├── medien-und-links/
├── quellen/
└── reflexion/
```

Der Spiegel darf unvollständig sein und fehlende Assets ausdrücklich markieren. Ein späterer Import überführt ihn in validierte Lesson-Daten. Das ZIP-basierte Lesson Pack bleibt Transport- und Austauschformat, nicht Voraussetzung für die Migration.

## 8.4 Formatidee

`.lessonpack` kann später eine benutzerfreundliche Dateiendung für einen ZIP-Container sein:

```text
beispiel.lessonpack
├── manifest.json
├── lesson.json
├── lesson.md                  # optionale lesbare Darstellung
├── AI_CONTEXT.md              # optionale Ableitung
├── board/
│   ├── scene.excalidraw
│   ├── structure.json
│   └── previews/
├── assets/
├── runs/                      # optional
├── evidence/                  # optional
└── schemas/
```

Das ZIP ist nur Transportbehälter. Beziehungen und Versionen stehen in strukturierten Daten.

## 8.5 Kombinierte Quelle

Für zuverlässiges Lesen werden drei Ebenen kombiniert:

1. **strukturierte Daten:** IDs, Pfad, Sichtbarkeit, Rollen und Beziehungen;
2. **visuelle Daten:** gekapselter Engine-Snapshot, Bounds und gerenderte Viewpoint-Vorschauen;
3. **Originalassets:** insbesondere PDFs, Bilder und später Videos.

Ein Original-PDF kann direkt visuell oder über seine Textschicht gelesen werden. OCR ist nur optionale Ableitung.

## 8.6 Stundenpfad als Lesereihenfolge

Der Stundenpfad liefert die primäre logische Reihenfolge:

```text
Reihe
→ Stunde
→ Abschnitt
→ Schritt
→ Viewpoint
→ sichtbare Elemente und Assets
```

Elemente außerhalb gespeicherter Schritte bleiben Teil des Boards und dürfen nicht verloren gehen; sie sind lediglich nicht automatisch Teil der präsentierten Reihenfolge.

## 8.7 `AI_CONTEXT.md`

Später möglich als kompakter Einstieg:

- Thema und freigegebener Kontext;
- Stundenpfad;
- wichtige Texte und Materialien;
- Runs/Evidence;
- Dateiverzeichnis mit stabilen Referenzen.

Es ist eine generierte Zusammenfassung beziehungsweise ein Index, nicht Quelle der Wahrheit und kein Pflichtbestandteil eines frühen Packs.

## 8.8 LessonDefinition, Run und Reihe

Ein Export kann später enthalten:

- eine vorbereitete Lesson;
- Lesson plus einen oder mehrere Runs;
- mehrere Lessons einer Reihe;
- Reihenfolge der Stunden;
- geteilte Assets ohne unnötige Duplikate.

Die relevante Durchführung kann als Endzustand plus wenige bedeutende Ereignisse gespeichert werden. Vollständiger Cursor-/Maus-Replay ist nicht vorgesehen.

## 8.9 Markierungen und Handschrift

Später sinnvolle Verknüpfung:

```json
{
  "type": "highlight",
  "sourceAssetId": "worksheet-01",
  "page": 2,
  "bounds": {"x": 120, "y": 340, "width": 410, "height": 55},
  "linkedText": "optional abgeleiteter Text",
  "createdDuringRunId": "run-01"
}
```

Für Handschrift:

- Originalvektorstriche erhalten;
- optional erkannten Text und Konfidenz ergänzen;
- Korrektur separat speichern;
- OCR ersetzt das Original nie.

## 8.10 Exportprofile

Spätere mögliche Profile:

- **Full Pack:** wieder importierbar, Originalassets, optional Runs;
- **AI Review Pack:** relevante Texte, Strukturen und ausgewählte Bilder, möglichst anonymisiert;
- **Share Pack:** private Inhalte und Schülerdaten entfernt;
- **Publication Package:** nur freigegebene Viewer-Daten.

Die Profile sind eine starke Richtung, aber noch keine finale Dateispezifikation.

## 8.11 Datenschutz

Vor Export:

- sichtbare Zusammenstellung anzeigen;
- private Notizen standardmäßig ausschließen;
- Namen/Gesichter beziehungsweise sensible Evidence warnen;
- externe Medienrechte berücksichtigen;
- Sensitivität und Publication-Policy technisch durchsetzen.

## 8.12 Versionierung und offene Fragen

Ein Manifest benötigt später Format- und Schema-Version, Erzeuger, enthaltene Lessons/Runs, Prüfsummen und Migrationshinweise.

Offen:

- selbsttragend oder externe Referenzen;
- Größenlimits und Standardumfang;
- Umgang mit Video;
- konkrete Reihenstruktur;
- OCR-/Transkriptformate;
- Migrationsstrategie;
- genaue Exportprofile;
- Umfang einer importierbaren Remotion-Erweiterung.
