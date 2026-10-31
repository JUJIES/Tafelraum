# Dokumentfoto verbessern – persönlicher lokaler Pilot

18. Oktober 2026, Vierpunkt-Erweiterung auf Nutzerauftrag. Ergänzt D-152 nur auf einem
persönlich eingerichteten Mac mit lokaler DocRes-Laufzeit; kein Cloud-/Schülerdienst.

- **Handlung:** Ein vorhandenes Bild als gut lesbares Blatt oder Textausschnitt
  aufbereiten, ohne das Archivoriginal zu überschreiben.
- **Einstieg:** `Bild verbessern` (zuvor `Scan optimieren`) mit Lucide
  `WandSparkles` in der bestehenden Bildaktionsleiste; gleiche Strichstärke und
  Touchfläche wie die Nachbaraktionen. Tooltip, zugänglicher Name und Dialogtitel
  verwenden dieselbe Benennung. Bei konfigurierter Laufzeit
  korrigierbarer Vorschlag, sonst unveränderte bisherige Kontrastfunktion.
- **Ausschnitt:** MBD-Blattmaske liefert einen vorsichtigen Startvorschlag mit
  Sicherheitsrand. Vier Ecken sind unabhängig beweglich, verbunden zu einem
  konvexen Viereck. 48-px-Griffe und Pfeiltasten erlauben Zeiger-, Touch- und Tastaturkorrektur.
  Keine numerischen Koordinatenfelder oder allgemeiner Anleitungsblock; die
  Vorschau erhält den frei werdenden Platz. `Ganzes Foto` liegt kompakt neben
  dem Originalvergleich; nur konkrete Rand-/Geometrieeinschränkungen bleiben als Hinweis. Kein Kreuzen oder Zusammenfallen der Ecken.
  `Ganzes Foto` stellt die volle Eingabe wieder her. Kein ungeprüfter neuronaler
  Dewarping-Standard: der Versuch schneidet an Randfotos tatsächlich Text ab.
- **Ausrichtung:** Vorschlag, Originalvergleich und entzerrte Vorschau übernehmen den vorhandenen Canvaswinkel. Quelle und perspektivische Quellpunkte bleiben unverändert; reine Vorschaurotation, keine erneute Rasterung bei Q/E. Bild, Maske und Eckgriffe verwenden dieselbe Drehung; Zeiger und Pfeiltasten werden in Quellkoordinaten zurückgerechnet. Gedrehte Ausschnitte bleiben tatsächlich geclippt.
- **Verarbeitung:** Einstieg startet die lokale Aufbereitung; Spinner
  `Bild wird verbessert …`, `Abbrechen`.
  Genau ein Prozess gleichzeitig. Original bleibt bis zur Übernahme sichtbar.
- **Ergebnis:** `Vorschau ansehen` entzerrt das gewählte Viereck lokal mit OpenCV
  zu einem Rechteck. `Original` / `Verbessert` vergleichen dieselbe Entzerrung.
  `Zuschnitt bearbeiten` kehrt zu den Ecken zurück. `Ganzes Foto`, `Abbrechen`,
  `Anwenden`; Übernahme erst nach Vorschau. Keine DocRes-Neuberechnung beim Ziehen,
  kein Textdetektor oder neuronales Verformen. Gewellte Blätter bleiben gewellt.
- **Bestehende Bearbeitung:** Bei Crop, Spiegelung oder gebundenen Annotationen
  bleibt Geometrie unverändert; nur Aufbereitung. Keine geometrische
  Verfälschung bestehender Schrift-/Markierungen. Hinweis erklärt diesen konkreten
  Grund statt einer scheinbar erfolgreich ausgeführten Blatterkennung.
- **Persistenz:** Bestehender Asset-/Snapshotpfad; Original, Undo/Redo und Reload
  bleiben erhalten. Nur die eine gewählte Bildinstanz ändert sich. Zentrieren
  bezieht sich auf den Bildinhalt und seinen bisherigen Canvasmittelpunkt;
  keine unverlangte Kamerafahrt oder Verschiebung anderer Objekte.
  Bei neuer Perspektivkorrektur bleiben unbearbeitete Quelle und die geometrisch
  identischen Original-/DocRes-Renditionen erreichbar. Umschaltung ändert nur die
  Bildaufbereitung; Annotationen verrutschen nicht. Alter nativer Crop bleibt
  kompatibel. Undo/Redo behandelt Aufbereitung und Entzerrung gemeinsam.
- **Sicherheit:** Unsichere Ränder anzeigen; keine behauptete Rekonstruktion
  fehlender Schrift. Jede Stufe abbrechbar. Stunden-/Zieländerung verwirft den
  verspäteten Commit. Laufzeit/Checkpoint bleiben außerhalb des Bundles.
- **Abnahme:** Beide echten Archivfotos als Originalkopien, korrigierte Vorschau,
  Abbruch/Fehler/Einzelprozess, kein veralteter Commit, Originalumschaltung,
  Undo/Redo, Reload und Paketressourcen. Grobe Touch-/Stiftbedienung bleibt
  Hardwareabnahme. Keine Veröffentlichung ohne separaten Releaseauftrag.
