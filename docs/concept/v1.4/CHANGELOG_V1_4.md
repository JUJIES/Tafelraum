# Changelog Version 1.4

## Anlass

Version 1.4 prüft, ob die bisherige Produktarchitektur bereits einen technischen Build trägt und ob Excalidraw weiterhin die passende Canvas-Grundlage ist. Sie ändert nicht die Produktthese und schreibt noch keine Produktionsbibliothek endgültig fest.

## Neu

- Neues Kapitel `16_ARCHITEKTUR_STACK_UND_CANVAS_ENTSCHEIDUNG.md`.
- Browserbasierte installierbare Web-App/PWA als vorläufige erste Laufzeit präzisiert.
- `canvas-port` von konkreten Engine-Adaptern getrennt.
- Excalidraw als MIT-lizenzierter Baseline-Kandidat eingeordnet.
- tldraw als zeitlich begrenzter technischer Gegenkandidat aufgenommen.
- Aktuelle tldraw-Produktionslizenz als Architektur- und Lock-in-Faktor dokumentiert.
- Einheitlicher Excalidraw-/tldraw-Vergleichsslice mit realer Unterrichtsstunde definiert.
- PDF.js als Baseline für den PDF-Rendering-Spike ergänzt.
- Presentation-Protokoll von Same-Origin- und WebSocket-Transport getrennt.
- Manueller Zweitbildschirm-/Vollbildablauf als verlässlicher Fallback festgehalten.
- Versioniertes Lesson-Dokument, SQLite-Index/Revisionen und Asset-Dateispeicher als getrennte Verantwortlichkeiten präzisiert.
- Outbox, Basisrevision, Single-Writer-Start und sichtbarer Konflikt statt stillem `last write wins` aufgenommen.
- Führende Runtime-/Schemaquelle als noch zu treffende Entscheidung markiert.
- Oberflächenfamilie aus Vorbereitung am Mac, privater Lehreransicht in der Durchführung und separater lokaler Tafelansicht präzisiert.
- Lokale Tafel ausdrücklich von persönlicher Schüleransicht und Bildschirmspiegelung abgegrenzt.
- Bewusste öffentliche Steuerung mit flüchtigem Zeiger ergänzt; der normale Mac-Cursor bleibt privat.
- Unabhängige, standardmäßig verborgene Tafelwerkzeugleiste und getrennte Werkzeugzustände festgehalten.
- Beiträge aus Tafelinteraktionen zunächst LessonRun beziehungsweise Session-Layer statt automatischer Änderung der wiederverwendbaren Vorbereitung zugeordnet.
- Gleichzeitige Darstellung von öffentlichem Zeiger und freigegebenen Tafelwerkzeugen bestätigt.
- Flüchtigen kreisförmigen Aufmerksamkeitsimpuls für bewusste öffentliche Klicks ergänzt.
- Direkte Drag-Bewegung der Tafelwerkzeugleiste mit Einrasten oben, unten, links oder rechts festgelegt; konkrete Bewegungsparameter bleiben Hardwarefrage.
- `Bild erzeugen` als feste spätere Vorbereitungsfunktion für eingeloggte Lehrkräfte präzisiert: kompakter Prompt, nicht blockierende Mehrfachjobs, Ergebnisablage und Drag-and-drop-Übernahme als normale Bildassets.
- Kontextuelle Illustrationsvorschläge auf bewusst freigegebene Auswahl begrenzt; keine automatische Generierung oder implizite Weitergabe der gesamten Stunde.
- OpenAI Responses API mit Bildgenerierung beziehungsweise Image Generation als plausiblen, aber austauschbaren Provideradapter eingeordnet.
- Spätere Zuschauerwerkzeuge für Remote-Live bestätigt: bewusste Hostfreigabe, selbst gewählter Anzeigename und sichtbare Werkzeugübergabe.
- Ersten interaktiven Hybrid-Slice auf genau einen aktiven Werkzeughalter begrenzt; Lehrkraft und lokale Tafel können kontrolliert zurückübernehmen.
- Werkzeug-Lease und Teilnehmerberechtigung als serverseitig validierten Sessionzustand statt freie Mehrbenutzerbearbeitung festgehalten.
- Remote-Beiträge zunächst dem LessonRun beziehungsweise Session-Layer zugeordnet; Anzeigename ausdrücklich nicht als geprüfte Identität behandelt.
- Teilnahme im Klassenraum und außerhalb auf denselben Link-/QR-/Sessionworkflow vereinheitlicht; alle persönlichen Geräte starten im Zustand `Folgen`.
- Freie Werkzeugübernahme durch Teilnehmer verworfen: `Mitarbeit anfragen` benötigt immer eine bewusste Lehrerfreigabe und kann mit `Beenden` sofort entzogen werden.
- Allgemeinem Teilnahmecode einen optionalen persönlichen, sessiongebundenen Wiederaufnahmecode für Gerätewechsel gegenübergestellt; beide sind keine verifizierte Identität.
- Bild-/PDF-Tabellenannotation von semantisch ausfüllbaren Tabellenobjekten mit stabilen Zell-IDs getrennt.

## Nicht beschlossen

- Kein Wechsel von Excalidraw zu tldraw.
- Keine produktive tldraw-Lizenz.
- Kein Excalidraw- oder tldraw-Fork.
- Kein Desktop-Wrapper.
- Keine eigene Canvas-Engine.
- Keine konkrete Node-, UI-, Datenzugriffs- oder Jobbibliothek.
- Kein CRDT und keine frühe Mehrbenutzerbearbeitung.

## Entscheidungskriterium

Die Canvas-Engine wird nicht nach Demo-Eindruck gewählt. Maßgeblich ist derselbe reale, hardwaregetestete Slice aus freiem Board, Bild/PDF, Annotation, Activity-/Assetreferenzen, Speicherung, Public Projection und unabhängigen Viewports.
