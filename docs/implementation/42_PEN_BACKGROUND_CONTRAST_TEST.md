# Stiftkontrast am Aufsetzpunkt – D-276

18. Oktober 2026 · lokale Lehrerfläche 0.1.69.

## Produkt und Architektur

Neutrale Stiftfarben nutzen am Pointerdown dieselbe lokale Helligkeitsprobe wie
D-275: helle Raster-/weiße HTML-Papierfläche → Schwarz, dunkler Untergrund → Weiß.
Die Neutralpalette bleibt gemeinsam mit dem Text definiert. Explizite Akzentfarben
und Marker behalten ihre bisherige Farbe. Keine neue Palette oder Einstellung.

`CanvasSurface.surfaceBackgroundAtPoint` bündelt die Ermittlung für Text und Stift.
Der optionale Startfarben-Resolver des bestehenden `useInkInput` läuft ausschließlich
für einen gültigen Stiftbeginn. Die gewählte Farbe liegt am nativen Freedraw-Strich
und wird in der flüchtigen Geste eingefroren; Bewegung, Shift, Zwischenvorschau und
Finish führen keine erneute Hintergrundprobe oder Umfärbung aus. ExternalInkCommit
verwendet ebenfalls die Gestenfarbe statt einer möglicherweise später geänderten
Werkzeugfarbe. Kein neuer Wirevertrag, Strichrenderer oder fachlicher Farbspeicher.

Bestehende Material-/Formbindung schützt die gespeicherte Stiftfarbe beim Laden
und Themewechsel; freie neutrale Stiftstriche folgen weiterhin dem Canvas-Theme.
Keine automatische Pixelanalyse alter Striche oder beim nachträglichen Verschieben.
Die Bindung bleibt allein nach dem bestehenden Annotationsvertrag bestimmt: Ein
weit über Blattgrenzen reichender Strich kann frei bleiben und damit beim nächsten
Theme-/Ladevorgang wieder der freien Themeregel unterliegen. Kein Raten einer
zweiten Startpunkt-Bindung. Normale Undo-/Redo-/Archiv- und öffentliche Projektion
verwenden den vorhandenen nativen Farbwert.

## Grenzen

Wie D-275: begrenzte Rasterheuristik, kein AI-/OCR-/Netzwerkzugriff; weiße lokale
HTML-Papierannahme analysiert keine beliebigen dunklen HTML-Inhalte. Fehlende oder
unlesbare Raster fallen auf den Canvasgrund zurück. Die neue Startpunktanalyse gilt
für die Lehrerfläche. Room-Stift behält seine bisherige gewählte Startfarbe, nutzt
aber denselben unveränderten Commitvertrag mit eingefrorener Gestenfarbe. Keine
Remote-Schreibrechte oder Erweiterung des öffentlichen Wirevertrags.

## Prüfung

- Gemeinsame Kontrasttests erhalten: neutrales Schwarz/Weiß, explizite Akzente,
  Median/Alphakomposition, DPR-/CSS-Pixelabbildung und Rendererfehlerfallback.
  Neuer Test schützt materialgebundene native Stifte bei Theme/Reload, freie Stifte
  bleiben adaptiv und Marker bleiben außerhalb dieser Änderung.
- Isolierter Browserprüfstand mit temporärem Archiv, realen CUA-Mauszügen:
  Schwarz auf weißem Rasterblatt; derselbe Strich über die Blattkante bleibt
  einheitlich schwarz. Separater Strich auf dunklem Canvas weiß. Blauer Stift bleibt
  `#2f6f92`, Marker bleibt gelb `#ffff00` mit seinem bisherigen nativen Farbvertrag.
- Themewechsel erhält den schwarzen gebundenen Strich und ändert freien weißen
  Stift auf `#1b222b`. Auf dunklem Raster im hellen Theme entsteht `#fffdf8`.
- Undo entfernt genau den letzten Strich, Redo stellt dessen weiße Farbe wieder her.
  Reload erhält die gebundenen Farben, Blau und Marker; freier Stift folgt wieder
  dem dunklen Theme. `archive-proof.json` bestätigt vier native Stifte und einen
  Marker mit den geprüften gespeicherten Farben. Kein produktiver Archivtest.
- 364 App-/Archivtests und 113 Live-/Room-Tests bestanden; Typprüfung erfolgreich.
  Native Stift-/Touchhaptik auf Board/iPad bleibt Hardwareprüfung. Browsercheck vor
  nativem Build beendet, damit generierte Bundles keine Vite-Reloads verursachen.

Belege: `output/pen-color-qa/` (`archive-proof.json`, `contrast-reload.png`,
`live-tests.log`, `release-0.1.69.log`).

## Lokaler Abschluss 0.1.69

Regulärer Releaseprozess erfolgreich: 364 App-/Archivtests, Rust, Typprüfung,
Vite-Build, ZIP-Privatdatenprüfung, Codesign und kryptografische Updatersignatur.
Zusätzlich 113 Live-/Room-Tests bestanden. Bekannte Build-Chunkwarnung unverändert.
Die normale Desktop-App wurde regulär beendet, .69 am bisherigen Ort installiert
und nativ mit geladener Drug-harm-Stunde wieder geöffnet. 215 installierte
Web-/Serverdateien bytegleich zum geprüften Build; Codesign nach dem Kopieren gültig.
.68 bleibt als Rückfallkopie im bestehenden App-Backup-Ordner. Kein Teststrich im
produktiven Archiv, keine manuelle Bestandsmigration oder produktive Sortierung.
Öffentlicher Updatekanal bleibt .59. `installation-proof.json` hält den Paketvergleich
fest. Die neue Startpunktanalyse auf Room/realer Touch-/Stifthardware bleibt offen.
