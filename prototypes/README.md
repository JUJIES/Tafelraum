# App und Prototypen

Die aktive Tafelraum-App liegt in
[`surface-shell-a-b/`](surface-shell-a-b/README.md). Der Ordnername stammt vom
frühen Shellvergleich; heute enthält er Lehrerfläche, Room Canvas, Teilnehmerbuild,
lokalen Archivserver und den nativen Tauri-Host.

Es gibt derzeit keine getrennten Appimplementierungen in
`surface-lab-excalidraw/` oder `surface-lab-tldraw/`. Diese Namen waren frühe
Planungen. Excalidraw ist die implementierte Engine hinter dem Canvas-Port;
ein möglicher späterer Vergleich ist kein bereits vorhandener zweiter Codepfad.

- [Entwicklerleitfaden](../CONTRIBUTING.md): lokales Setup und Prüfungen.
- [App-README](surface-shell-a-b/README.md): Laufzeiten und Codeeinstiege.
- [Dokumentationsindex](../docs/implementation/README.md): geltende Verträge.
- [Decision Log](../docs/implementation/DECISION_LOG.md): Entscheidungen und Historie.

Der historische Verzeichnisname ist kein Auftrag zum Umbenennen oder Aufteilen
der App. Größere Strukturänderungen brauchen einen konkreten Produkt- oder
Wartungsgrund.
