# UI Brief – Bewegliche Formpalette

**Stand:** 13. September 2026  
**Status:** D-175, Desktop-Browser geprüft; Touch auf Zielhardware offen

## Kontext

- **Oberfläche:** Kontextpalette für eine ausgewählte einfache Form in Surface Lab.
- **Nutzung:** Eine Lehrkraft wechselt schnell zwischen Formen, Füllungen und Farben. Die Palette darf den Tafelinhalt nicht dauerhaft überdecken.
- **Primäre Handlung:** Palette am sichtbaren Griff wegziehen und bei Bedarf am Flächenrand ablegen.

## Verhalten

- Derselbe `GripVertical`-Griff wie bei der Textgestaltung startet den Drag; Farb- und Füllbuttons bleiben eigenständige Touchziele.
- Ohne Drag folgt die Palette wie bisher der gewählten Form. Nach einem Drag bleibt ihre flüchtige Position auch beim nächsten Formobjekt erhalten; ein Stundenwechsel beginnt wieder mit der kontextuellen Platzierung.
- Nahe den vier Flächenrändern erscheint eine ruhige Andockvorschau. Loslassen rastet in eine von drei festen Positionen je Rand ein. Links und rechts ordnen sich die vorhandenen Aktionen in einer kompakten, schmalen Palette; oben und unten bleiben sie horizontal. Die untere Position lässt Abstand zur Hauptwerkzeugleiste.
- Bewegung und Einrasten nutzen einen kurzen Positions- und Größenübergang. Während des Ziehens folgt die Palette unmittelbar; reduzierte Bewegung schaltet den Übergang ab. Keine neue Canvasgeometrie und keine persistierte Formeigenschaft.

## Abnahme

- Ziehen am Griff verändert weder Füllung noch Farbe und verliert die gewählte Form nicht.
- Rechts/links, oben/unten und freie Mitte sind erreichbar; die Palette bleibt im sichtbaren Flächenbereich.
- Nach Farbwechsel und Formwechsel bleibt der Andockplatz erhalten. Bei kleinem Viewport und auf echter Touchhardware sind Erreichbarkeit und Bewegungsgefühl gesondert zu prüfen.
