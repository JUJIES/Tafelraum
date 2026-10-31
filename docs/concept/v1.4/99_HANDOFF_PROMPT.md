# Übergabeprompt für eine weiterarbeitende KI

Du erhältst Version 1.4 des Konzeptpakets für ein browserbasiertes AI Teaching Workspace.

Lies zuerst `00_README.md`, danach alle nummerierten Dateien, die Changelogs bis `CHANGELOG_V1_4.md`, `PACK_INDEX.json` und `schemas/`.

Deine Aufgabe ist zunächst nicht, Produktionscode oder einen vollständigen Bauplan zu erzeugen. Arbeite als kritischer Produkt- und Architekturpartner.

Verbindliche Ausgangslage:

- freies, potenziell unendliches Board;
- keine verpflichtenden Phasen, Folien oder pädagogischen Kategorien;
- Activities, LessonFlow und Views sind getrennte Ebenen; semantische Angaben bleiben optional;
- das Board ist eine zentrale View, aber nicht die alleinige semantische Lesson-Beschreibung;
- optionaler Stundenpfad aus frei benennbaren Abschnitten und Schritten;
- Schritt referenziert einen lebendigen öffentlichen Viewpoint;
- Lehrerkamera und öffentliche Kamera sind unabhängig;
- öffentlicher Ausschnitt ist als privater Rahmen in der Lehreransicht sichtbar;
- öffentliche Kamerabewegung erst nach bewusster Aktion/Loslassen;
- LIVE und GEHALTEN; `Änderungen bereit` ist nur ein abgeleiteter Hinweis innerhalb von GEHALTEN;
- im ersten Presenter-Slice ist das Smartboard während GEHALTEN read-only; vorbereitete Änderungen erfolgen am Lehrergerät;
- gepufferte Smartboard-Eingaben bleiben eine mögliche spätere UX-Prüfung;
- normale Maus privat, bewusst aktivierter flüchtiger Pointer;
- erster technischer Build: grundlegende GUI, Board/Touch, Bildimport, PDF-Import sowie Speichern/Wiederöffnen auf dem Beelink;
- Stundenpfad, zwei Kameras und LIVE/GEHALTEN folgen als früher Presenter-Slice;
- Video, OCR, KI, Lesson Pack, Sharing und Remote-Live nicht im ersten technischen Build;
- langfristig ersetzt der Workspace den relevanten OneNote-Workflow einschließlich Archiv;
- lokale Reihenspiegel und Materialmanifeste bilden die inkrementelle Migrationsschicht aus OneNote;
- Quellenbeleg, semantischer Spiegel und portabler Materialbestand werden getrennt;
- eine vorhandene reale Unterrichtsreihe dient als frühes Import- und Vertikaltestkorpus;
- privater Beelink ist Primärspeicher und kanonische Serverablage; OneDrive ist höchstens optionaler Export-/Backupweg;
- stabile IDs und portable Manifeste bleiben unabhängig von einer bestimmten Beelink-Installation;
- browserbasierte installierbare Web-App/PWA ist die vorläufige erste Laufzeit; ein Desktop-Wrapper folgt nur bei nachgewiesenem Browserblocker;
- die Canvas-Engine liegt hinter einem `canvas-port`;
- Excalidraw ist der MIT-lizenzierte Baseline-Kandidat, tldraw ein zeitlich begrenzter Gegenkandidat im identischen Slice;
- es ist weder ein Wechsel zu tldraw noch ein Engine-Fork beschlossen;
- versioniertes Lesson-Dokument, SQLite-Index/Revisionen und Asset-Dateispeicher haben getrennte Verantwortlichkeiten;
- lokale Outbox und Serverrevision schützen vor stillen Überschreibungen;
- PDF.js ist Baseline für den PDF-Rendering-Spike;
- Same-Origin- und WebSocket-Transport teilen dasselbe Presentation-Protokoll;
- spätere ortsbezogene Spracheingabe und Bildgenerierung;
- Remote-Live und dauerhafte Publication sind getrennt;
- Maschinenlesbarkeit wird im Datenmodell vorbereitet, ohne frühe KI.

Bitte:

1. Rekonstruiere die Kernidee in eigenen Worten.
2. Nutze `12_ENTSCHEIDUNGEN_UND_OFFENE_FRAGEN.md` als maßgebliches Register.
3. Erfinde keine Funktionen, Kategorien oder Entscheidungen.
4. Prüfe besonders:
   - Board → LessonPath → Section/Step/Viewpoint;
   - Activities/Flow → Views → PresentationSteps;
   - Spiegel/Materialmanifest → validierter Lesson-Import;
   - unabhängige Teacher-/On-Air-/Prepared-Viewports;
   - sichere private/public-Projektion;
   - Drag-and-release und Kameratransitionen;
   - LIVE/GEHALTEN und abgeleiteter Hinweis `Änderungen bereit`;
   - verständliches read-only Verhalten des Smartboards während GEHALTEN und späterer Testbedarf für gepufferte Eingaben;
   - LessonDefinition versus späterer LessonRun;
   - lokale Tafel versus Remote-Live versus Publication;
   - frühe inkrementelle Portabilität ohne OCR/KI;
   - Status lokaler, externer, nur in OneNote vorhandener oder fehlender Assets.
   - `canvas-port` versus Engine-Adapter und die identischen Excalidraw-/tldraw-Kriterien;
   - führende Schemaquelle, versioniertes Lesson-Dokument, SQLite-Rolle, Outbox und Konfliktregel;
   - manueller Zweitbildschirm-Fallback versus optionale automatische Fensterplatzierung.
5. Priorisiere offene Fragen als:
   - vor Spike A;
   - vor erstem vertikalen Slice;
   - erst vor späterer Stufe.
6. Schlage technische Alternativen nur mit konkretem Nutzen für den realen Unterricht vor.
7. Behandle Bild und PDF als frühe zentrale Materialien, aber Video nicht als Kern des ersten Builds.
8. Deute das Produkt nicht als LMS, Miro-/Prezi-/Slide-Klon oder Chat-Wrapper um.

Ziel des nächsten Schritts ist zuerst ein kleiner Spiegel-/Importspike mit einer realen vorhandenen Reihe. Danach folgen ein hardwaregetesteter Excalidraw-Baseline-Slice und ein zeitlich begrenzter identischer tldraw-Gegenspike. Erst die dokumentierte Canvasentscheidung führt in den abgegrenzten Grundlagenbuild aus GUI, Board/Touch, Bild/PDF und Beelink-Persistenz. Die spätere Tafelregie darf vorbereitet, aber nicht unbemerkt in diesen Build hineingezogen werden.
