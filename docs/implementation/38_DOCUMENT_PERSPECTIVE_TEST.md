# Vierpunkt-Zuschnitt und Perspektivkorrektur

18. Oktober 2026 · D-268 · 0.1.61 lokal, ergänzt den persönlichen D-267-Piloten.

**UI-Nachtrag 0.1.62, 18. Oktober 2026:** Der Einstieg heißt jetzt `Bild verbessern`
und verwendet das bereits installierte Lucide-Icon `WandSparkles` statt `Contrast`.
Tooltip, zugänglicher Name und Dialogtitel folgen derselben Benennung;
Originalumschaltung und laufender Spinner bleiben erhalten. Keine Änderung an
DocRes, Vierpunktgeometrie oder Speicherlogik; UI-Brief 25 fortgeschrieben.
Toolbar, Tooltip und Dialog im isolierten Browser-Testarchiv geprüft; Screenshot
`output/image-enhance-wand-toolbar.png`. 353 App-Tests, Rust und Release-Build
bestanden. 214 Paketressourcen bytegleich, normale Desktop-App zeigt 0.1.62.

**UI-Nachtrag 0.1.63:** Numerische Eck-/Koordinatenfelder und der allgemeine
Anleitungstext entfallen. Die größere Vorschau bleibt direkt über die vier
Griffe und Pfeiltasten bedienbar; `Ganzes Foto` steht neben dem Originalvergleich.
Konkrete Randwarnungen und Geometriesperren bleiben erhalten. Verarbeitung,
Übernahme und Persistenz unverändert. Browserprüfung mit Originalvergleich,
Pfeiltastenkorrektur und tatsächlicher Perspektivvorschau bestanden; Screenshot
`output/image-preview-clean.png`. 353 App-Tests, Rust, Build und Signaturprüfung
bestanden. 214 Paketressourcen bytegleich; normale App zeigt 0.1.63.

## Bedienung und Geometrie

`Bild verbessern` (zuvor `Scan optimieren`) behält den DocRes-Einstieg. Danach sind die vier Ecken unabhängig
beweglich: oben links, oben rechts, unten rechts, unten links. 48-px-Griffe,
Pfeiltasten (Shift = 10 Pixel). Seit dem UI-Nachtrag entfallen die numerischen
Koordinatenfelder und allgemeine Anleitung zugunsten einer größeren Vorschau;
`Ganzes Foto` bleibt in der Vergleichsleiste. `Ganzes Foto` setzt zurück.
Nur konvexe, im Bild liegende Vierecke werden akzeptiert; Kreuzen oder Kollabieren
wird beim Verschieben abgefangen. Der MBD-Startvorschlag bleibt vorsichtig
rechteckig mit Sicherheitsrand, keine behauptete automatische Vierkant-Erkennung.

`Vorschau ansehen` berechnet lokal eine OpenCV-Homographie für genau diese vier
Punkte. Zielseiten folgen den jeweils längeren gegenüberliegenden Pixelkanten;
kein geratenes A4-Format. Pixelgrenzen inklusive, bilineare Abtastung, begrenzte
Ausgabegröße. Das richtet ein ebenes trapezförmiges Blatt gerade aus; gewelltes
Papier wird nicht geglättet. Fehlende Bildteile entstehen nicht neu. Erst nach
Vorschau ist `Anwenden` erreichbar; `Zuschnitt bearbeiten` kehrt zu den Punkten
zurück und Änderungen verwerfen die alte Vorschau. Die zwei Ansichten `Original` / `Verbessert` benutzen dieselbe Entzerrung.

DocRes `appearance` läuft weiterhin einmal auf dem vollständigen Foto. Der
anschließende Perspektivschritt braucht nur OpenCV, NumPy und Pillow, lädt weder
Torch noch Modellgewichte. Änderungen an Ecken starten DocRes nicht erneut.
Vorhandener nativer Crop, Spiegelung, fremde Gruppen, Annotationen und Abdeckungen
behalten die D-267-Geometriesperre: nur Aufbereitung. Alleinstehende eigene
Annotationsgruppen blockieren nicht.

## Daten und Kompatibilität

Perspektive verändert die Pixelgeometrie; sie darf deshalb nicht als gewöhnlicher
nativer Rechteck-Crop oder als Streckung der alten Datei gespeichert werden.
Nach Übernahme liegen zwei gleich große Renditionen im bestehenden Assetpfad:
entzerrte Originalpixel und entzerrtes DocRes-Ergebnis. Das unbearbeitete Foto
bleibt zusätzlich referenziert. `scanEnhancement.kind = docres-perspective-v1`
erweitert den vorhandenen Vertrag um `sourceOriginalFileId` und `enhancedFileId`;
`originalFileId` bezeichnet hier die entzerrte Originalfassung. Kein zweites Modell,
keine Base64-Originale im Snapshot und kein neuer Archivspeicherpfad.

Die ursprüngliche Quelle sowie beide Renditionen bleiben in beiden Anzeigezuständen
über `referencedImageFileIds` erreichbar, auch bei Reload, Stundenkopie und Export.
Originalumschaltung wechselt nur Pixelaufbereitung, nie die Geometrie: später
angefügte Annotationen bleiben ausgerichtet. Undo/Redo stellt einschließlich
Canvasgröße und File-ID auch das unbearbeitete Foto wieder her. Perspektivbild
wird proportional in den bisherigen Bildrahmen eingepasst, Mittelpunkt und Winkel
bleiben erhalten. `crop` wird für die neue Rendition null. Alte `scan-contrast-v1`
und `docres-appearance-v1` bleiben unverändert lesbar und bedienbar.

`/api/document-image/perspective` nutzt dieselbe abgesicherte Loopback-Middleware,
private Konfiguration, Einzelprozessreservierung, Abbruch und Timeout wie D-267.
Nur dieser Schritt erhält bis 80 MB JSON für das Bildpaar, Ausgabe maximal 180 MB;
weiterhin maximal 16 MP / 10000 Pixel je Eingabebild, gleich große Eingaben und
validierte Punkte. `/process` bleibt auf 24 MB beschränkt und akzeptiert keinen
vom Request eingeschleusten Operationswechsel. Keine Archivschreibrechte im
Worker. PNG-Paar bis zur bewussten Übernahme ausschließlich im RAM.

## Betroffene Pfade

- `DocumentImageEditor.tsx`, `document-perspective.ts`, `document-image.css`:
  Eckbedienung, validierte Geometrie und Vorschauzustand.
- `document-image/perspective.py`, `worker.py`, `document-image-server.mjs`:
  deterministischer Perspektivschritt im vorhandenen lokalen Dienst.
- `scan-enhancement.ts`, `document-image-state.ts`, `CanvasSurface.tsx`:
  drei erreichbare Dateien, Originalumschaltung, proportionaler Commit.
- Desktop-Paketliste und Versionsdateien: 0.1.61, neue Pythondatei im Bundle;
  bestehende private Laufzeit bleibt unverändert.

## Prüfstand

- Drei Pythonprüfungen: Ganzbild identisch, echte trapezförmige Koordinaten auf
  Rechteckecken abgebildet, ungültige/degenerierte Geometrie und ungleiche Bildpaare
  abgewiesen. Lauf mit der privaten lokalen Pythonumgebung.
- Neue TS-Prüfungen für unabhängige Ecken, konvexe Grenzen, Mittelpunkt/Seitenverhältnis
  und drei erreichbare Dateien in beiden Anzeigezuständen.
- 353 App-Tests, 113 Live-/Room-Tests, Rust, Typprüfung und signierter Mac-Build grün.
- Echte Foto-2-Kopie im isolierten Apparchiv: drei Ecken per Zeiger verändert,
  Vorschau entzerrt, beide Darstellungen verglichen, übernommen; Mittelpunkt und
  Metadaten im Archiv geprüft. Original-/Verbessert-Umschaltung, Undo bis zur
  unbearbeiteten Kameraaufnahme und Redo im Browser bestätigt.
- Direkter Worker-Test mit Foto 2 liefert ein 1597 × 926 großes Paar, beide Ausgaben
  mit derselben Geometrie. Sichtprüfung bestätigt die erwartete Entzerrung.

**Beobachtung außerhalb dieses Slices:** Ein sofortiger Browserreload direkt in
derselben Automationsfolge nach mehreren Redos traf die bestehende verzögerte
Canvas-/Archivschreibqueue vor ihrem Commit und lud den älteren Archivstand.
Kein Modell- oder Assetverlust; allgemeine Autosave-/Unload-Grenze separat prüfen,
nicht durch Cache-Reset oder geänderte Testerwartung verdecken. Ein Reloadnachweis
für dieses Feature muss ausdrücklich den tatsächlich abgeschlossenen Archivcommit
einschließlich der drei Bildreferenzen prüfen.

Nach bestätigt abgeschlossenem Archivcommit sind alle drei Bilddateien lesbar,
die unbearbeitete PNG bytegleich zur Eingabe; Reload erhält Bild-ID und
Perspektivmetadaten. Belege `document-perspective-committed-proof.json` und
`document-perspective-reload-proof.json`.

0.1.61 am normalen Desktop-App-Ort installiert, 0.1.60 regulär beendet und außerhalb
des Desktop-Orts als Rückfallkopie erhalten. Codesign und alle 214 Paketressourcen
bytegleich geprüft. Native Versionsanzeige bestätigt 0.1.61; echter Durchlauf über
installierte Desktop-API, gebündelten Worker und unveränderte private Laufzeit
liefert dasselbe Original-/DocRes-Paar wie der direkte Worker-Test. Keine produktive
Testübernahme und kein Testmaterialimport. Direkt nach Start waren Katalog und
48 von 49 Boarddateien bytegleich; die geöffnete `Drug harm`-Stunde normalisierte bei zwei
Bildern `boundElements: null` zu `[]`. Gegen den vorherigen Historienstand geprüft:
zu diesem Messzeitpunkt keine sonstige Inhalts-, Geometrie- oder Zustandsänderung. Keine Rückschreibung
zur Kaschierung dieser Beobachtung. Beide echten Archivfoto-Originale unverändert.

Belege: `output/document-perspective-*.json`, `document-perspective-corners.png`,
`document-perspective-preview.png`, Build-/Live-Testlogs. Touch/Stift auf realer
Hardware bleibt offen; keine öffentliche Beelink-Veröffentlichung.


## Vorschauwinkel – 18. Oktober 2026 / D-271 / 0.1.65

`DocumentImageEditor` übernimmt den beim Start geprüften Canvaswinkel. Die reine
SVG-Vorschau dreht Bild, Maske und Viereck gemeinsam um den Ausschnittmittelpunkt;
ViewBox und HTML-Griffe folgen derselben berechneten Hüllbox. Ein Clip auf dem
ursprünglichen Ausschnitt verhindert außerhalb liegende Pixel in gedrehten Ecken.
Zeigerposition und Bildschirm-Pfeiltasten werden invers in Quellpunkte übersetzt.
Die Perspektiv-API erhält weiterhin dieselben ungedrehten Quellkoordinaten;
Originaldatei, bestehender Canvaswinkel, Archivmodell und Q/E bleiben unverändert.
Keine zusätzliche Rasterung oder Bildinterpolation pro Drehung.

Geometrietest mit 0°, ±90°, 15° und freiem Winkel: alle Ecken innerhalb der Hüllbox,
Vorwärts-/Rücktransformation und Bildschirmverschiebung konsistent, Seitenwechsel
bei 90°. Browser: Q/E-Drehung um 15°, DocRes, Eckziehen/Pfeiltaste, Originalvergleich,
tatsächliche Perspektivvorschau und Übernahme; kanonisches Board hält den identischen
Winkel und verweist weiter auf die unbearbeitete Quelldatei. Belege
`output/document-rotated-corners.png`, `document-rotation-proof.json`.

Undo stellt rohe Quelle mit identischem Winkel wieder her; Redo wurde vor Reload
im kanonischen Board bestätigt, Reload zeigt weiterhin dieselbe Drehung und
entzerrte Rendition. 354 App-Tests, Rust, Build, Codesign und Updatersignatur
bestanden; 214 Paketressourcen bytegleich, .65 lokal installiert/nativ gestartet.
Kein öffentlicher Desktop-Release. Vorheriger Testhinweis zur ignorierten
Canvasdrehung ist damit behoben; Autosavegrenze bleibt unverändert.
