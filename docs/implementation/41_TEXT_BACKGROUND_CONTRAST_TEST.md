# Textkontrast am Erstellort – D-275

18. Oktober 2026 · lokaler Appstand 0.1.68.

## Datenfluss

CanvasSurface prüft vor der nativen neuen Textgeste im Pointer-Capture den echten
Erstellort. Auf Material wird aus dem vorhandenen statischen Excalidraw-Renderer
eine kleine, DPR-/CSS-korrekte Umgebung gelesen (ca. 17 CSS-px, begrenzt auf 65
Backingpixel je Achse). Transparenz wird gegen den Canvasgrund komponiert, die
Medianhelligkeit unterdrückt einzelne gedruckte Zeichen. Der vorhandene
`shapeTextColor`-Kontrastvergleich wählt `#111111` oder `#fffdf8`. Native Szene-
Rotation, Zoom, Crop und Flip sind bereits im vorhandenen Renderer enthalten.
Kein zusätzlicher Bilderdecode, Screenshotdienst oder laufendes Pointer-Sampling.

Die neutrale Farberkennung verwendet die vorhandene Rich-Text-Neutralpalette plus
kurze Schwarz-/Weißnotation und die bisherige Formtext-Weißfarbe. Akzentfarben
werden nicht überschrieben. Die neue Farbe wird vor dem nativen Erstellen gesetzt;
vorhandene Texte/Rich-Text-Renditionen werden beim erneuten Editieren ausgelassen.
Keine nachträgliche Textmutation oder eigene Undoaktion.

Freie Fläche behält ausdrücklich den bisherigen Theme-Vordergrund. Weiße lokale
HTML-Papierträger erhalten Schwarz, solange keine andere Form oder Annotation am
Ort darüber liegt. Isoliertes HTML wird nicht ausgelesen oder gerastert. Beliebiges
benutzerdefiniert dunkles HTML kann deshalb noch falsch eingeschätzt werden;
allgemeine eingebettete Apps erhalten keine Weißpapier-Sonderbehandlung. Fehlende
oder sicherheitsbedingt unlesbare Canvaspixel blockieren Text nicht und verwenden
den Canvasgrund als Fallback. Externer Textpaste bleibt beim Theme-Default.

## Persistenz und Theme

Die bestehende Material-/Formbindung entscheidet, ob ein Text dem Canvas-Theme
folgt. Material-/formgebundener Text einschließlich formatierter Zeichenspannen
behält seine gespeicherte Farbe beim Themewechsel und Reload. Freier neutraler Text
behält seine bisherige Themeanpassung. Kein neuer Marker in `customData`, keine
Helligkeitsdaten, keine neue Bindungs-/Speicherlogik. Der vorhandene Renderer und
Undo-/Archiv-/Room-Pfad führen die normale Farbe mit. Bestehende unlesbare Texte
werden nicht still korrigiert; bewusstes Verschieben löst keine Farbanalyse aus.

## Prüfung

- Vier neue Tests: neutral/kontrastreich und explizite Akzente, Median gegen
  gedruckte Pixel und Alphakomposition, CSS-/Backing-Koordinaten und Fehlerfallback,
  vorhandene Bindung als Schutz vor Themeanpassung.
- Isolierter Browserprüfstand `src/canvas/text-background.browser.html` über
  `scripts/live-canvas-browser-check.mjs --clips`, ausschließlich temporäres Archiv.
  Echte Textgesten auf synthetischem weißen Raster im dunklen Theme: `#111111` mit
  Materialbindung; freie dunkle Fläche: `#f4f3ef` ohne Bindung. Themewechsel erhält
  Blatttext und ändert freien Text auf `#1b222b`.
- Dunkles Raster im hellen Theme: `#fffdf8` mit Materialbindung. Reload erhält
  dunklen/hellen Materialtext und passt freien Text an das aktuelle Theme an.
- Separater synthetischer HTML-Träger ohne überlagerte Alttexte: neue Texte werden
  schwarz und materialgebunden. Diese Geometrieprüfung verwendet bewusst einen
  fehlenden Paketentry mit vorhandener heller Fehlerfläche; sie ist keine Abnahme
  eines neuen HTML-Pakets oder beliebiger HTML-Farbschemata. Bereits überlagerter
  Text bleibt beim erneuten Bearbeiten absichtlich in seiner alten Farbe.
- Neue Funktion lokal und synchron; keine AI-/Cloudabhängigkeit. Pixelproben von
  stark strukturierten Fotos bleiben eine begrenzte Kontrastheuristik, keine
  garantierte Texterkennung oder semantische Papiersegmentierung.

Belege unter `output/text-color-qa/`: `white-sheet-dark-canvas.png` und
`release-0.1.68.log`. Native Installation und Releaseprüfung im Abschluss unten.

Hinweis für Wiederholungen: Den Vite-Prüfstand vor einem nativen Build beenden.
Der generische Browsercheck beobachtet sonst auch die umfangreichen generierten
LibreOffice-/Tauri-Bundlebäume und erzeugt unnötige Reloads und Logs. Das ist kein
Produktlog; der temporäre QA-Dienst wurde nach der Prüfung regulär beendet.

## Abschluss 0.1.68

363 App-/Archivtests sowie Rust, Typprüfung und regulärer Build bestanden; ZIP-
Privatdatenprüfung, Codesign und kryptografische Updatersignatur erfolgreich.
Normaler Desktop-Ort auf .68 aktualisiert und nativ gestartet; Unterricht und
Materialprojektionen wieder sichtbar. 215 installierte Web-/Serverdateien bytegleich
zum geprüften Build, Codesign nach Kopieren gültig (`installation-proof.json`).
.67 bleibt als Rückfallkopie unter dem bestehenden App-Backup-Ort. Keine Testtexte
im produktiven Archiv erzeugt und keine manuelle Bestandskorrektur/Archivmigration.
`archive-proof.json` bestätigt die gespeicherten QA-Farben und Materialbindungen.
Öffentlicher Desktopupdatekanal unverändert (.59); Touch/Stift und beliebige dunkle
HTML-Inhalte bleiben gesonderte Grenzen.
