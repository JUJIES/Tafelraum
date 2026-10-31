# Neutrale Beispiele für lokale Tafelraum-Materialien

Diese eigenen technischen Minimalbeispiele stehen unter der Projektlizenz. Sie
enthalten keine echten Unterrichts- oder Personendaten, keine fremden Assets und
keine Anbieterzugänge. Sie sind Orientierung für die gemeinsame lokale Pipeline;
keine Kopien der separat entwickelten OpenAI-/MCP-Plugins.

- `starter-worksheet/`: gewöhnliche Eingabefelder, gemeinsame initiale A4-Seite
  für Bildschirm und leere Druckvorlage; Zustand über die bestehende Formularbrücke.
- `starter-interactive/`: ein digitales Element mit eigenem JavaScript-Zustand,
  `getState`/`applyState` und `tafelraum:statechange` für Lehrer/Room. Keine Druckfähigkeit.

In einen eigenen Arbeitsordner kopieren, neue Paket-ID vergeben und Inhalt
entwickeln. Nicht die mitgelieferte Kopie im Appbundle verändern oder ungefragt
archivieren. Seitenränder, Farben, Aufgaben und Gestaltung sind keine universelle
Vorgabe. Die Beispiele sind technisch validierbare Vorlagen, keine fachlich
freigegebenen Arbeitsblätter. Die tatsächliche Ziel-Druckabnahme ist offen.

Prüfen aus dem Checkout oder Agentenpaket:

```sh
node scripts/check-interactive-material.mjs --source-dir docs/agent-examples/starter-worksheet --require-print
node scripts/check-interactive-material.mjs --source-dir docs/agent-examples/starter-interactive
```

Für ausgearbeitete Arbeitsblattgestaltung den [Referenzindex](../agent-references/README.md)
und seine Layoutanleitung verwenden. Diese Minimalbeispiele ergänzen den Korpus
für Paket-/Zustandsintegration; sie ersetzen dessen visuelle Orientierung nicht.
