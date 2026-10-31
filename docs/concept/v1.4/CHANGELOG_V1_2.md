# Changelog Version 1.2

## Aufgelöste Produktentscheidungen

- OneNote ist kein dauerhaft paralleles Zielsystem mehr. Das Teaching Workspace soll den relevanten OneNote-Workflow langfristig einschließlich Fach-/Reihenarchiv, Materialablage, Vorbereitung und Live-Unterricht ablösen.
- Der private Beelink im Zuhause ist Primärspeicher und kanonische Serverablage. Die Trennung von schulischer beziehungsweise arbeitgeberseitiger Infrastruktur ist bewusst gewollt.
- OneDrive wurde von einer offenen Primärspeicheroption zu einem höchstens optionalen Export-, Backup- oder Adapterweg herabgestuft.

## Erster technischer Build

- „Erster Build“ und „früher Presenter-Slice“ klar getrennt.
- Der erste Build testet grundlegende GUI/App-Shell, Board, Touch/Stift, Bildimport, PDF-Import sowie Speichern und Wiederöffnen auf dem Beelink.
- Bild- und PDF-Import sind nicht mehr zurückgestellt, sondern zentrale frühe Funktionen.
- PDF bleibt unverändertes Originalasset; Seitenrendering und Annotationen sind getrennt.
- Stundenpfad, zwei Kameras und LIVE/GEHALTEN folgen im direkt anschließenden Presenter-Slice.

## Tafelregie

- `BEREIT` ist kein dritter Zustand. `Änderungen bereit` ist ein abgeleiteter Hinweis innerhalb von `GEHALTEN`.
- Smartboard-Eingaben bleiben während `GEHALTEN` grundsätzlich möglich.
- Diese Eingaben schreiben in einen vorbereiteten Draft; `onAirRevision` ändert sich erst durch bewusste Freigabe.
- Die brauchbare Rückmeldung für gepufferte Eingaben auf der zugleich öffentlich sichtbaren Smartboard-Fläche bleibt ausdrücklich eine UX-Spike-Frage.

## Roadmap und Architektur

- Spike-Reihenfolge auf App-Shell/Hardware, Bild/PDF und Beelink-Persistenz vor der Presenter-Regie umgestellt.
- Beelink-Persistenz, lokaler Browsercache sowie Backup/Restore als unterschiedliche Verantwortlichkeiten beschrieben.
- Handoff-Prompt und Presentation-State-Beispiel an die beschlossenen Zustände angepasst.
