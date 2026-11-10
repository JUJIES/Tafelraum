---
name: tafelraum-canvas-vorbereiten
description: "Prepare or revise a concrete Tafelraum lesson canvas: arrange archived materials, add native text and shapes, and configure presentation clips through the local running teacher app. Use for canvas preparation, not worksheet authoring or app development."
---

# Tafelraum-Canvas vorbereiten

Bereite die beauftragte Unterrichtsfläche über die **laufende Lehreransicht** vor.
Der Skill wählt Inhalt und Anordnung; Tafelraum besitzt Objekte, Materialbindungen,
Verlauf und Speicherung. Verwende den gemeinsamen Helfer
`scripts/tafelraum-canvas-agent.mjs` aus dem Checkout oder dem mitgelieferten
Agentenpaket. Appadresse und Node-Laufzeit aus dem Startauftrag verwenden; die
Adresse bei jedem Aufruf als `--url` angeben.

## Ziel und Zustand zuerst bestimmen

- Auftrag und Chat bestimmen Lerngruppe, Stunde und Änderungsumfang. Löse eine
  mehrdeutige Zuordnung anhand von Katalog/Hierarchie und dem genannten Kontext
  auf. Private Schülernotizen sind keine Quelle des Agenten-Inspect. Bei
  inhaltlichen Entscheidungen zusätzlich `tafelraum-unterrichtsmaterial` nutzen.
- `node scripts/tafelraum-canvas-agent.mjs sessions` zeigt verbundene
  Lehreransichten. Bei mehreren Instanzen explizit `--session <id>` verwenden;
  Titel und `lessonId` gegen die gewünschte Stunde prüfen. Die Desktopadresse
  ist standardmäßig `http://127.0.0.1:49317`, Testserver über `--url` wählen.
- Mit `inspect` die lebenden Objekte, Auswahl, Kamera, Clips, Materialpfade,
  Revision und Speicherstatus lesen. IDs aus dieser Antwort verwenden. Eine
  Datei auf der Festplatte beschreibt nicht zuverlässig die offene Szene.
- Die Zielstunde kann aus jedem Chat genannt werden. Aktueller ausdrücklicher
  Auftrag vor eindeutigem Gesprächsziel; die offene App-Stunde ersetzt beides
  nicht. Für Suche, Anlage und sicheres Öffnen den lokalen Skill
  `tafelraum-unterricht-organisieren` verwenden. Nach einem Wechsel `sessions`
  und `inspect` neu lesen. „Clippe die Materialien“ beauftragt die passende
  Clipzuordnung, nicht automatisch erneute Platzierung oder Präsentationsstart.


## Darstellung und Eingriff wählen

Kurze Aufträge, Überschriften, Fragen und gemeinsame Sicherung passen zu nativen
Texten/Formen. Antwortkästen sind beschreibbare Flächen, keine Formularfelder.
Für ein Arbeitsblatt oder eine komplexe Interaktion die vorhandenen Materialskills
verwenden; Materialinstallation und Canvasplatzierung bleiben getrennte Schritte.

Eine Ergänzung im betroffenen Bereich einpassen; vorhandene Antworten, Ink und
Materialpositionen berücksichtigen. Eine beauftragte Neuordnung darf mehr Fläche
umfassen. Material über seinen gelieferten Archivpfad platzieren, vorhandene
Instanzen über ihre Objekt-ID transformieren. Materialträger bewegen ihre
Annotationen/Abdeckungen gemeinsam. Gesperrte oder noch nicht unterstützte Inhalte
nicht durch rohe Engineobjekte oder neue Kopien ersetzen.

Entscheide Anordnung aus der Lernhandlung: Was wird gemeinsam angesehen, wo wird
gearbeitet und wo gesichert? Entscheidend sind Lesbarkeit und Schreibraum im
**späteren sichtbaren Ausschnitt**, nicht abstrakte Canvas-Schriftgrößen. Nutze
ruhige Abstände, klare Zuordnung von Frage und Antwort sowie passende Clipgrenzen.
Beispiele und Prüffragen bei Bedarf: [references/layout.md](references/layout.md).

## Gezielten Auftrag ausführen

Bei beauftragter Canvasänderung die
[sichtbare Arbeitsphase](../tafelraum-unterricht-organisieren/SKILL.md#sichtbare-arbeitsphase-in-tafelraum)
vor der eigentlichen Vorbereitung starten und bis zur bestätigten Speicherung
führen. Eine bereits gestartete Phase aus der Materialvorbereitung weiterführen.

1. JSON-Auftrag im Arbeitsordner erstellen. Die zuletzt gelesene
   `expectedRevision` mitsenden. Befehle/Beispiele:
   [Canvas-Agent-Vertrag](../../../docs/implementation/45_CANVAS_AGENT.md).
2. `validate --file <auftrag.json>` prüft das Format lokal.
3. Für das zusammengehörige Paket eine stabile `--request-id` wählen und
   `apply --file <auftrag.json> --session <id> --request-id <id>` ausführen.
   Ein `apply` bündelt native Objektänderungen in einem Undo-Schritt. Clips
   sind eigene Befehle mit der vorhandenen separaten Clip-Rücknahme.
4. Nur `ok: true` und `persisted: true` bestätigen die abgeschlossene Änderung.
   `created` ordnet eigene Schlüsselnamen echten Objekt-IDs zu. Wiederholungen
   mit derselben requestId und identischem Auftrag erzeugen keine Duplikate.

Bei `busy` die laufende Eingabe abwarten, erneut lesen und weiterarbeiten. Bei
veralteter Revision erneut lesen und die beabsichtigte Änderung auf den aktuellen
Stand beziehen. Bei `applied: true, persisted: false` sind Objekte bereits in der
App: Speicherproblem klären und **nicht erneut hinzufügen**. Bei Zeitüberschreitung
zuerst `job --session <id> --request-id <id>` prüfen; eine verlorene Bestätigung ist
kein Beweis, dass nichts ausgeführt wurde. Keine neue ID als blinden Retry verwenden.
Bei Sitzungswechsel ist die alte Revision ungültig.

Keine direkten `board/scene.json`- oder Board-PUT-Änderungen als automatischer
Fallback, kein Cache-/Outbox-Reset und kein Appneustart zur Konfliktkaschierung.
Bei notwendigem technischen Recovery den konkreten Zustand separat klären.
Die produktiven Sicherungsregeln in `AGENTS.md` gelten auch für Agentaufträge;
Code-/Testarbeit in getrennten Archiven benötigt kein Produktivvollbackup.

## Ergebnis prüfen

Den beauftragten Ausschnitt in der realen App ansehen: vollständige Texte,
Kontrast, freie Antwortflächen, Materialproportionen und Clipgrenzen. Eine
Sichtprüfung durch echtes UI ergänzen, wenn die Änderung Interaktion betrifft.
Erneutes `inspect` muss Objekte und plausiblen Speicherstatus zeigen. Erst dann
als eingerichtet melden. Tests/Replays nur in einer isolierten Teststunde.
Vorhandene vereinbarte Unterrichtsdokumentation bei einer Ablaufänderung knapp aktualisieren; keine zusätzlichen
Planungsmodelle oder Kopien der Canvasgeometrie in Dokumentation anlegen.
