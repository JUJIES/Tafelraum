# Changelog Version 1.3

## Semantisches Unterrichtsmodell

- Unterrichtsinhalt, Unterrichtsfluss und Darstellungen werden deutlicher getrennt.
- Das Board bleibt zentrale Arbeits- und Präsentationsfläche, ist aber nicht mehr die alleinige semantische Sicht auf eine Lesson.
- Aktivitäten können optionale Angaben zu Zweck, Auftrag, Lehrer-/Schülerhandlung und erwartetem Ergebnis tragen, ohne verpflichtende Planungsmaske.

## OneNote-Übergang und Spiegel

- Der lokale Reihenspiegel wird als inkrementelle Migrations- und Rekonstruktionsschicht beschrieben.
- Quellenbeleg, semantischer Spiegel und portabler Materialbestand werden getrennt.
- `spiegel.json`, `lesson-mirror.json` und `materialien.manifest.json` werden als vorläufige Importhilfen eingeführt.
- Materialverfügbarkeit unterscheidet lokal, externer Link, nur OneNote, nur Quellenexport, fehlend und unbekannt.
- Eine vorhandene Unterrichtsreihe wird als frühes reales Import- und Vertikaltestkorpus vorgesehen.

## Produkt- und Technikrichtung

- Der Beelink bleibt primärer Speicherort; die Identität der Unterrichtsdaten liegt jedoch im portablen Format und nicht in einer bestimmten Serverinstallation.
- Die gemeinsame Command-Schicht wird um semantische Unterrichtsaktionen ergänzt.
- Der gepufferte Smartboard-Draft während `GEHALTEN` ist nicht mehr als frühe feste Produktentscheidung gesetzt. Im ersten Presenter-Slice bleibt das Smartboard während `GEHALTEN` zunächst read-only; vorbereitete Änderungen erfolgen am Lehrergerät.

## Schema-Beispiele

- `lesson-v0.3.example.json` ergänzt Activities, Flow und getrennte Views.
- `mirror-v0.1.example.json` beschreibt einen inkrementellen Reihen-/Stundenimport.
- `material-manifest-v0.1.example.json` beschreibt Verfügbarkeit, Herkunft, Rechte und Materialbeziehungen.

Alle neuen Schemas bleiben Diskussionsbeispiele und keine finalen APIs.
