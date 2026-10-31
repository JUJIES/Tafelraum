# 14. Empfohlene nächste Schritte

## 14.1 Reihenfolge

Der erste technische Build prüft bewusst nur die Grundsubstanz auf echter Hardware:

```text
reales Spiegel-/Materialkorpus verstehen
→
grundlegende GUI/App-Shell
→ Canvas-Baseline und zeitlich begrenzter Gegenspike
→ Board, Touch und Stift auf echter Hardware
→ Bild- und PDF-Import
→ Beelink-Persistenz und Wiederöffnung
```

Erst danach folgt der frühe Presenter-Slice mit unabhängigen Kameras, Stundenpfad, LIVE/GEHALTEN und sicherer Public Projection. Video, Lesson Pack, KI und öffentliche Schülerfunktionen bleiben später.

## 14.2 Spike 0: Spiegel, Materialmanifest und reales Testkorpus

Prüfen:

- eine vorhandene Reihe aus dem Projekt `Unterricht` auswählen;
- `reihenspiegel.md` lesen;
- sichtbare, lokale, externe und fehlende Materialien unterscheiden;
- vorläufiges `spiegel.json` und `materialien.manifest.json` erzeugen;
- mindestens eine Stunde mit Activities, Flow und Materialreferenzen abbilden;
- ungesicherte Rekonstruktionen und unbekannten Bearbeitungsstand erhalten.

Ergebnis:

- erstes realistisches Importkorpus;
- validierte minimale Spiegel- und Assetfelder;
- dokumentierte Lücken der OneNote-Migration;
- keine Verpflichtung auf eine endgültige Produktionsdatenbank.

## 14.3 Spike A: App-Shell, Canvasentscheidung und echte Hardware

Prüfen:

- neue beziehungsweise vorhandene Stunde ohne Planungsformular öffnen;
- browserbasierte installierbare Web-App/PWA als erste Laufzeit;
- Excalidraw als eingebettete Baseline;
- Text/Formen/Freihand/Marker;
- Stift versus Finger-Pan;
- Auswahl und große Touchziele;
- Vollbild;
- Performance auf Mac plus großem Touchscreen;
- Browsergesten und Palm Rejection.

Anschließend wird derselbe bewusst kleine Slice zeitlich begrenzt mit tldraw geprüft. Der Gegenspike darf nicht zu einem zweiten Grundlagenbuild anwachsen. Zusätzlich vergleichen:

- stabile Referenzen von Canvasobjekten zu Activity und Asset;
- Speicherung, Reload und einfache Schemaänderung;
- Ausblendung beziehungsweise Compiler-Payload für Public Projection;
- unabhängige Viewports ohne Domänenlogik in der Engine;
- Integrationsaufwand und notwendige Sonderlogik;
- Bundle-/Laufzeitperformance auf der Zielhardware;
- Exportierbarkeit, Lock-in und Lizenzfolgen.

Ergebnis:

- grundlegender GUI-Entwurf;
- Hardware-/Browsermatrix;
- dokumentierte API-/UX- und Lizenzgrenzen;
- `CANVAS_ENGINE_DECISION.md` mit Excalidraw oder tldraw als begründeter Engine für den Grundlagenbuild;
- kleine bestätigte `canvas-port`-Oberfläche;
- kein Fork ohne konkreten, reproduzierbaren Blocker.

## 14.4 Spike B: Bild- und PDF-Materialworkflow

Prüfen:

- Bild per Drag-and-drop und Dateiauswahl importieren;
- Bild platzieren, skalieren, verschieben und wieder öffnen;
- PDF als unverändertes Originalasset importieren;
- Seitenwahl beziehungsweise minimale Seitennavigation;
- einzelne PDF-Seite scharf auf Mac und 75-Zoll-/4K-Fläche darstellen;
- PDF.js Display Layer als Rendering-Baseline prüfen;
- Stift, Marker, Text und Formen als getrennte Annotationen;
- Import/Rendering im Hintergrund, ohne Boardinteraktion zu blockieren;
- Assetreferenz statt großer Base64-Duplikate im Engine-Snapshot.

Ergebnis:

- frühes Assetmodell;
- PDF-Renderingentscheidung;
- Koordinatenmodell für Annotationen;
- realistische Performance- und Speichergrenzen.

## 14.5 Spike C: Beelink-Persistenz und Ausfallsicherheit

Prüfen:

- Stunde mit Board, Bild, PDF und Annotationen speichern/wieder öffnen;
- Beelink als kanonischer Primärspeicher;
- minimale Fach-/Reihen-/Stundenzuordnung;
- Autosave/Crash Recovery;
- lokaler Browsercache für die aktive Stunde;
- lokale Outbox mit Basisrevision;
- kurzer Verbindungsabbruch und anschließender Sync;
- zweite Schreibsession beziehungsweise veraltete Basisrevision erkennen, nicht still überschreiben;
- Asset-Integrität, Backup und Restore-Test;
- portablen Reihen-/Lessonimport erneut öffnen, ohne an einen absoluten Beelink-Pfad gebunden zu sein.

Ergebnis:

- minimaler dauerhafter Lesson-State;
- Asset-/Revisionsstrategie;
- Beelink-Speicherlayout;
- sichere Regel für lokale Warteschlange und Konfliktfälle;
- geklärte Rolle von versioniertem Lesson-Dokument, SQLite und Dateispeicher.

## 14.6 Erster technischer Build

```text
gespiegelte Testreihe öffnen oder neue Stunde beginnen
→ frei Text, Formen und Zeichnungen anlegen
→ Bild importieren und platzieren
→ PDF importieren und Seite auswählen
→ PDF-Seite annotieren
→ Stunde automatisch auf dem Beelink speichern
→ Browser neu laden oder kurz offline gehen
→ Stunde mit Assets und Annotationen vollständig wieder öffnen
```

Dieser Build enthält bewusst noch keinen Stundenpfad und keine Tafelregie. Die Canvas-Engine ist zu diesem Zeitpunkt durch Spike A entschieden, bleibt aber hinter dem `canvas-port`. Der Build soll zeigen, ob die grundlegende GUI, Materialarbeit und Persistenz schnell und verlässlich genug für den Alltag sind.

## 14.7 Spike D: zwei unabhängige Kameras

Prüfen:

- Teacher- und Presenterfenster;
- manueller Zweitbildschirm-/Vollbildablauf als verlässlicher Fallback;
- automatische Fensterplatzierung nur als progressive Verbesserung;
- identischer Boardinhalt, getrennte Viewports;
- Lehrerzoom verändert Tafel nicht;
- `onAirViewport` als privater Rahmen;
- Ziehen ohne öffentliche Bewegung;
- Kamerabefehl erst beim Loslassen;
- ruhiger Übergang;
- Reconnect auf letzten sicheren On-Air-Zustand.

Ergebnis:

- Viewpoint-Repräsentation;
- gemeinsames Presentation-Protokoll;
- lokaler Same-Origin- und serververmittelter Transport;
- erste LIVE/HELD-State-Machine;
- Erkenntnisse zu Seitenverhältnissen.

## 14.8 Spike E: Stundenpfad

Prüfen:

- Schritt aus aktuellem Tafelausschnitt speichern;
- Inline-Name und optional Thumbnail;
- Schritte anklicken;
- freie Navigation und Rückkehr;
- Drag-and-drop der Reihenfolge;
- optionale Abschnitte;
- Wechsel zwischen weit entfernten Inhaltsinseln.

Ergebnis:

- UX-Begriff;
- Abschnittsverhalten;
- Viewpoint-Update;
- Pfad-Panel auf kleiner und großer Fläche.

## 14.9 Spike F: GEHALTEN, vorbereitete Änderungen und Public Projection

Prüfen:

- LIVE/GEHALTEN;
- `Änderungen bereit` als abgeleiteter Hinweis, nicht als dritter Zustand;
- Mac-Änderungen während GEHALTEN bleiben privat;
- Smartboard ist während GEHALTEN im ersten Slice read-only;
- `Jetzt zeigen` veröffentlicht Revision und Viewport atomar;
- `Zeigen und live` veröffentlicht und wechselt zu LIVE;
- Public Projection enthält nie private Testelemente;
- Presenter-Reconnect bleibt auf dem letzten sicheren Stand;
- optional Public Pointer.

Ergebnis:

- Public Projection Contract;
- finalisierte frühe State-Machine;
- UX-Regel für read-only Smartboard während GEHALTEN und späteren Testbedarf;
- Persistenz-/Revisionsstrategie für On-Air und Prepared Draft.

## 14.10 Früher Presenter-Slice

```text
Vorhandene materialreiche Stunde öffnen
→ Schülerausschnitt setzen
→ Ansicht als Schritt speichern
→ weitere Inhaltsinsel und Schritt anlegen
→ Stundenpfad per Drag-and-drop ordnen
→ Tafelansicht starten
→ zwischen Schritten wechseln
→ Anzeige halten
→ auf dem Mac vorbereitete Änderung erzeugen
→ Hinweis „Änderungen bereit“ sehen
→ vorbereiteten Zustand bewusst veröffentlichen
→ Stunde und letzten sicheren On-Air-Stand wieder öffnen
```

## 14.11 Danach

Erst nach Validierung:

1. robuste Fach-/Reihen-/Stundenablage zur tatsächlichen OneNote-Ablösung;
2. Suche, Migration, Duplizieren und Backup-Komfort;
3. generisches Video;
4. Lesson Pack/Maschinenlesbarkeit;
5. dauerhafte Publications;
6. Remote-Live;
7. ortsbezogene Sprache/Bild/KI;
8. isolierte Schülerarbeitskopien.

## 14.12 Bereits getroffene Entscheidungen vor dem Bau

- OneNote soll langfristig abgelöst werden;
- Beelink ist Primärspeicher und kanonische Serverablage;
- Bild- und PDF-Import gehören in den ersten technischen Build;
- der erste Build bleibt auf grundlegende GUI, Board, Material und Persistenz begrenzt;
- `BEREIT` ist nur ein Hinweis innerhalb von `GEHALTEN`;
- Smartboard ist während GEHALTEN im ersten Presenter-Slice zunächst read-only; ein gepufferter Draft bleibt eine spätere Testfrage;
- Spiegel und Materialmanifest werden anhand einer realen vorhandenen Reihe vorläufig validiert;
- die Canvas-Engine bleibt bis zum identischen Excalidraw-/tldraw-Slice offen; Excalidraw ist die lizenzoffene Baseline, kein automatisch endgültiger Gewinner.

Noch vor Spike 0 konkret festzulegen:

- welche vorhandene Reihe als erstes Testkorpus dient;
- welche Quellen und Materialien dafür ohne Rechtekonflikt lokal genutzt werden dürfen.

Noch vor Spike A konkret festzulegen:

- Zielhardware und relevante Browser;
- minimale Sicherheits-/Authentifizierungsregel für Teststunden;
- Test-PDFs und Bildgrößen;
- akzeptabler Zeitrahmen und Entscheidungskriterien des tldraw-Gegenspikes;
- ob eine beantragte Hobby-/spätere kommerzielle tldraw-Lizenz grundsätzlich als Produktabhängigkeit akzeptabel wäre.

Nicht vorher nötig:

- Remotion-Schema;
- Lesson-Pack-Details;
- Remote-Moderation;
- KI-Provider.

## 14.13 Empfohlene Arbeitsartefakte

Während der Spikes:

- `DECISION_LOG.md`;
- `SPIKE_RESULTS.md`;
- `MVP_SCOPE.md`;
- `ASSET_AND_PDF_MODEL.md`;
- `BEELINK_STORAGE_AND_RECOVERY.md`;
- `PRESENTATION_STATE_MACHINE.md`;
- `CRITICAL_USER_FLOWS.md`;
- `PUBLIC_PROJECTION_CONTRACT.md`;
- `MIRROR_AND_MIGRATION_NOTES.md`;
- `MATERIAL_MANIFEST_V0_1.md`;
- `CANVAS_ENGINE_DECISION.md`;
- `RUNTIME_AND_DEPLOYMENT.md`;
- `LESSON_STORAGE_CONTRACT.md`.

Kein umfangreicher Produktionsbauplan vor den Hardware-, Asset-, Persistenz- und Kameraergebnissen.
