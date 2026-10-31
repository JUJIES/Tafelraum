# UI Brief – lokales Video als Stundenmaterial

**Stand:** 6. September 2026  
**Status:** verbindliche Grundlage für den ersten lokalen Desktop-Slice; Touch und Stift bleiben praktisch zu prüfen

## Kontext

- **Oberfläche/Zustand:** lokales Video im stundenbezogenen Materialbereich und als verschieb- und skalierbarer Player auf der Surface-Lab-Fläche
- **Zielnutzer:** Lehrkraft in Vorbereitung und Unterricht
- **Nutzungssituation:** Ein externer YouTube-Player ist nicht verfügbar oder ein rechtmäßig vorliegendes Video soll ohne Anbieterabhängigkeit aus dem Stundenarchiv abgespielt werden.
- **Eine primäre Handlung:** ein lokales Video aus dem Materialbereich auf die Fläche setzen und dort abspielen
- **Eine zu prüfende Designfrage:** Bleibt ein eigener Player direkt bedienbar und als Video erkennbar, ohne native Browserleiste, doppelte Canvas-Kontur oder dauerhaft sichtbare Zusatzfläche?

## Scope

### Muss sichtbar oder erreichbar sein

- MP4 als eigener Materialtyp `Video`; die Datei bleibt Original in `stunden/<lesson-id>/material/`. WebM bleibt wegen der ohne Zusatzmetadaten nicht eindeutig unterscheidbaren Audio-/Videocontainer vorerst im bestehenden Audiopfad.
- `Vom Gerät`, Desktop-Drop und Materialliste verwenden denselben additiven Archiv- und Platzierungspfad wie Audio.
- Eine feste innere 16:9-Geometrie von `640 × 360`, die gemeinsam mit dem Canvasobjekt skaliert und gedreht wird.
- Die Videofläche selbst, ein zentraler Play-/Pause-Button sowie eine ruhige untere Bedienleiste mit Zeitleiste, Zeit, 10-Sekunden-Sprüngen, Lautstärke und Vollbild.
- Der Dateiname erscheint knapp in der unteren Leiste und wird bei Platzmangel gekürzt.
- Neutrale Videoflächen wählen und verschieben das Canvasobjekt; Controls reagieren beim ersten Klick.
- Auswahl bietet dieselben externen Aktionen wie YouTube: Zentrieren, Fokus und Abdeckung.
- Wiedergabezeit, Lautstärke, Vollbild und Abspielzustand bleiben flüchtig und werden nicht in der Stunde gespeichert.
- HTTP-Byte-Ranges werden direkt aus der Datei gestreamt, damit große Videos nicht vollständig im Serverspeicher landen und Sprünge möglich bleiben.

### Darf nicht erscheinen

- Videoeditor, Schnitt, Downloadfunktion, Playlist, Autoplay oder globales Videoarchiv;
- Providerlogo, YouTube-Nachbau, dekorativer Verlauf oder dauerhaft eingeblendete große Titelkarte;
- native Browsercontrols zusätzlich zur Tafelraum-Bedienleiste;
- zweite Assetkopie in Canvas, IndexedDB oder `customData`;
- behauptete Live-Canvas-Wiedergabe für Teilnehmer; lokale Videos bleiben dort zunächst ein ausdrücklich nicht unterstütztes Medium.

## Exakter UI-Text

- `Videos`
- `Video`
- `Abspielen`
- `Pausieren`
- `10 Sekunden zurück`
- `10 Sekunden vor`
- `Wiedergabeposition`
- `Lautstärke`
- `Vollbild`
- `Video zentrieren`
- `Videofokus aktivieren`
- `Videofokus deaktivieren`
- `Abdeckung hinzufügen`
- `Abdeckung entfernen`

Dateinamen und Zeitwerte sind reale Inhalts- beziehungsweise Laufzeitdaten.

## Inhalt und Referenzen

- **Reale Inhalte/Assets:** der rechtmäßig vorliegende Film `ON HER OWN - Bikepacking Hamburg to North Cape [OV6836VprNI].mp4` in der neuen LER-Stunde `On Her Own`
- **Visuelle Referenz:** vorhandener Tafelraum-Audioplayer für Farben, Icongewicht, Rundung und direkte Controls; vorhandener YouTube-Träger für 16:9-Geometrie, Fokus, Zentrieren, Abdeckung und Materialverbund
- **Relevanter Produktflow:** Datei liegt im Stundenmaterial oder wird über `Vom Gerät` ergänzt → Materialbereich zeigt `Video` → auf Fläche platzieren → lokal abspielen, verschieben, skalieren, fokussieren oder abdecken → Reload stellt nur Geometrie und Provenienz wieder her

## Vergleich und Invarianten

- **Gezielt veränderte Variable:** lokales Video statt externer YouTube-Anbieterprojektion
- **Muss zwischen Varianten identisch bleiben:** stundenbezogene Materialbasis, Archivprovenienz, Canvasgeometrie, Auswahl, Verschieben, Skalieren, Rotation, Löschen, Undo/Redo, Fokus und Abdeckung
- **Nicht durch Desktop validierbar:** Touch-/Stiftbedienung, schulische Zielhardware, weitere Browsercodecs sowie Wiedergabe- und Speicherleistung auf dem späteren Beelink

## Abnahme

- Der Materialbereich führt MP4 als `Video`; Einfügen und Desktop-Drop erzeugen genau einen lokalen Player mit derselben Archivprovenienz.
- Play/Pause, Zeitleiste, Sprünge, Lautstärke und Vollbild reagieren direkt; ein neutraler Pointerdrag verschiebt den vollständigen Materialverbund.
- Bei 10, 50, 100, 160 und 300 Prozent bleiben Video, Leiste, Icons und Abstände eine deckungsgleiche 16:9-Einheit ohne doppelte Kontur.
- Löschen, Undo, Redo, Reload, Stundenwechsel, Hell/Dunkel, Fokus und Teil-/Vollabdeckung erhalten die bestehende Materiallogik.
- Eine große MP4-Datei wird bei normaler und bereichsweiser Auslieferung gestreamt; der Server puffert nicht die vollständige Datei.
- Das lokale Video wird im Live Canvas weiterhin klar als nicht unterstütztes Medium behandelt, ohne Archivpfad oder Videobytes an Teilnehmer zu senden.
