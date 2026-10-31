# Gemeinsamer Performance-Plan: lokale Fläche und Live Canvas

Stand: 5. September 2026. **Phase 0 und 1A waren die D-122-Zwischenstufe. Der Kachelansatz 1B wurde durch D-123 ersetzt; D-124 hat anschließend den gesamten HTML-Capturepfad durch synchronisierte Materialinstanzen abgelöst. Verbleibende spätere Phasen sind Vorschläge.**

Grundlage: [lokaler Performance-Audit](07_PERFORMANCE_AUDIT_2026-09-05.md), aktueller Code und vom Nutzer beigesteuerte Untersuchung zu Clipkanten, objektfesten Kacheln und PDF-Renditions. Die fremden Messungen sind Vergleichshinweise, hier nicht erneut reproduziert. Kein Produktcode, Archiv oder laufender Dienst wurde für diesen Plan geändert.

## Ziel und Grenzen

Lokale Eingabe bleibt direkt; Teilnehmer sehen Änderungen zügig, ohne wachsenden Rückstand. Textschärfe, Annotationen, Abdeckungen und Freigabegrenzen bleiben erhalten. Kein Enginewechsel, kein neues UI, keine Teilnehmerbearbeitung und keine Auflösungsreduktion als erste Maßnahme.

PDF-Seiten bleiben **eigenständige Objekte**: einzeln platzieren, verschieben, zuschneiden, annotieren, abdecken, drucken und vom Canvas entfernen. Ein späterer anderer Renderer ändert diesen Workflow nicht. Originale bleiben im lokalen Archiv; Beelink erhält nur die sichere Sitzungsprojektion.

## Abgleich der Untersuchungen

| Thema | Gemeinsamer Befund | Konsequenz / Präzisierung |
|---|---|---|
| Bewegung an Clipkanten | Der strikte Pixelclip verpackte unveränderte Quellpixel wiederholt in neue PNGs | D-123 vermeidet diese Arbeit vollständig: Clip ist eine begrenzte Kamera auf derselben bereinigten Szene; Kacheln entfallen |
| HTML-Verzögerung | Vom Clipproblem unabhängig: Poll-Wartezeit, teure DOM-Kopie, doppelte Bildumwandlung | Eigener vorrangiger Arbeitspfad; ein PDF-/Kachelumbau löst ihn nicht |
| PNG / WebP | Komprimierte Größe und Kodierzeit stehen im Zielkonflikt | Erst Wiederverwendung, dann Codecwahl nach Lebensdauer: statische Kacheln anders bewerten als ständig wechselnde Ränder |
| Bildspeicher | Kleine Dateien sind nicht automatisch kleine dekodierte Bilder | Bei gleicher Pixelzahl bleibt der RGBA-Bedarf gleich; Entlastung benötigt begrenzte Auflösung, Sichtbarkeit und Cache-Lebensdauer |
| PDF-Seitenreferenzen | Original und Darstellung können sauber getrennt werden | Sinnvolle spätere Architektur, aber mit Persistenz-/Exportmigration; keine Voraussetzung für schnelle erste Verbesserungen |
| Worker / Streaming | Arbeit verlagern ersetzt nicht Arbeit vermeiden | Worker erst für verbleibende Pixel-/Codec-Arbeit; Streaming nicht als Standard für verlustfreie Arbeitsblätter |

Die Codecwerte widersprechen sich nicht: Der Audit fand beim synthetischen Blatt PNG 12,2 ms / WebP 19,7 ms, die beigesteuerte Untersuchung beim anderen Blatt 18,8 / 129,4 ms. Material, Encoder und Testbedingungen unterscheiden sich. Daraus folgt **keine universelle WebP-Empfehlung**, insbesondere nicht für bewegte Randstücke.

Auch die Angabe „PDF 2×, Live 4×“ muss anhand Quellpixeln, Objektgröße, Zuschnitt und tatsächlicher Ausgabeskalierung geprüft werden. Die Faktoren beziehen sich nicht zwangsläufig auf dieselben Koordinaten. Reine Vergrößerung erzeugt keine neuen PDF-Details; pauschales Halbieren der Live-Dichte kann dennoch die Darstellung ändern.

## Reihenfolge und Zuständigkeit

1. **Messbasis und kleine Lebensdauerfehler absichern.**
2. **Zwei getrennte Slices:** HTML-Aufnahme entlasten; laufende objektfeste Clipkacheln integrieren. Nicht dieselbe Clipänderung in zwei Tasks bauen.
3. **Gemeinsame Pixel-/Transportkette verkürzen**, sobald beide Slices separat messbar sind.
4. **Lokale Ableitungen und Langzeitstabilität gezielt optimieren.**
5. **Nachmessen und Architekturgrenze entscheiden:** öffentlicher HTML-Zustand bei weiter unzureichender Interaktionslatenz; PDF-Renditions separat für Import, Schärfe und Speicher.

HTML-Scheduler und Clipkacheln können unabhängig vorbereitet werden. Beide treffen anschließend in `public-projection.ts` zusammen. Dort Änderungen nacheinander integrieren und vorab dieselben Regeln für Pixelidentität, Dichte, Cachebudget und Generationsabbruch verwenden. Kein zweiter Projektor und kein zweites fachliches Assetmodell.

### 0 — Gemeinsame Messbasis und begrenzte Lebensdauer

**Arbeit:** Bestehende isolierte Produktionsprüfer wiederverwenden. Jede Änderung auf demselben Material und demselben Build vor/nachher vergleichen. Erfassen: lokale Eingabe/Long Tasks, Capture-Wartezeit, Capture, sichere Rasterung, Kodierung, neue Bytes, Transportwartezeit, Viewer-Dekodierung und tatsächliche Anzeige. Netzzeiten getrennt messen; Uhren verschiedener Geräte nicht unkalibriert subtrahieren.

Kleine eindeutige Freigabefehler separat korrigieren: Projektor-Maps bei Stop/Generation, Paketbildreferenzen nach Materialentfernung. Abgebrochene asynchrone Arbeit darf anschließend keinen Cache wieder befüllen. Follow-Dateicache wegen Engineintegration nicht mit einem ungetesteten Reset reparieren.

**Abnahme:** Keine produktiven Archivdaten als Testziel. Gemessener Build dokumentiert. Nach Stop keine verbleibenden projektoreigenen Pixel-/Quellreferenzen; Reconnect/Neustart funktioniert. Keine neue Performance-Telemetrie als dauerhaftes Produktfeature nötig.

### 1A — HTML: Änderungen auslösen, Leerlauf vermeiden

**Dateien:** `interactive-html-snapshot-bridge.mjs`, `src/canvas/interactive-html-capture.ts` im Surface-Shell-Prototyp.

- Visuelle Änderung aus der Sandbox an den Host melden; Klick-/Eingabeantworten priorisieren, nach dem zugehörigen Layout-/Darstellungsupdate aufnehmen. Asynchrone Antwortänderungen ebenfalls erfassen.
- Pro Material höchstens eine laufende Aufnahme und einen zusammengefassten neuesten Nachfolger; zusätzlich ein globales Arbeitsbudget. Nicht viele DOM-Kopien gleichzeitig starten.
- Fertige Bilder unmittelbar als geändert melden, nicht auf die vollständige Materialrunde plus 250 ms warten. Kein unbegrenzter Jobstau; Hintergrundmaterial nicht dauerhaft verhungern lassen.
- Statisches Canvas darf keine vollständige DOM-Kopie auslösen. Für eigene Pakete explizite visuelle Revisionen bevorzugen; für bestehende Pakete Canvas-/Animationsänderungen zuverlässig über einen begrenzten Fallback erkennen. MutationObserver allein genügt nicht. Auch Pixelvergleich/Readback kostet Zeit und braucht ein Budget.
- Unveränderte DOM-/Stilanteile wiederverwenden. Unsichtbare Scrollbereiche nur dann aus der Aufnahme entfernen, wenn Layout, Positionierung, Schatten und Scrollverhalten nachweislich identisch bleiben. Keine pauschale DOM-Kürzung.
- Bestehendes fail-closed Verhalten behalten. Ein eigener Fehlerplatzhalter pro Material wäre eine gesonderte Produktentscheidung.

**Abnahme:** Drei ruhende Testmaterialien mit statischem Canvas erzeugen nach Einpendeln keine wiederholten vollständigen DOM-Kopien; echte Canvasänderungen, CSS-Animation, Formularzustand und Scrollen erscheinen weiterhin. Diskrete Antworten warten nicht auf einen festen Pollzyklus. Ein langsames Material verhindert nicht die Aufnahmeplanung anderer Materialien. Lokale Eingabe wird gegenüber der Baseline nicht schlechter.

### 1B — Historisch: objektfeste sichere Kacheln (durch D-123 ersetzt)

**Dateien:** bestehender Bildpfad in `src/live/public-projection.ts`, Rastertests und Teilnehmer-Rasterfläche. Mit der bereits laufenden Clip-Arbeit abgleichen.

- Unabhängige, geeignete ungedrehte Arbeitsblattbilder im eigenen Rasterkoordinatensystem kacheln. Pixelidentität hängt von Inhalt/Auflösung ab, nicht von Weltposition oder Clipursprung.
- Vollständig freigegebene Kacheln unverändert wiederverwenden und nur positionieren. Nur tatsächliche Randstücke schneiden und neu kodieren; vollständig ausgeschlossene Kacheln weder übertragen noch für die öffentliche Ausgabe kodieren.
- 128 Einheiten sind ein Testkandidat, kein universelles Token. Kachelgröße gegen neue Randbytes, Zahl der Draws, Nachrichtenmetadaten, Initialbeitritt und Tablet-Dekodierung abwägen. Aktuell existieren unter anderem 32-Job-/Element- und Pixelbudgets: zusätzliche kleine Kacheln müssen diese Budgets berücksichtigen, nicht stillschweigend umgehen.
- Rotation und Zuschnitt bleiben im eigenständigen Bildraster. D-129 entfernt Abdeckungsstapel aus dem Kompositionspfad: Das bereinigte Bild darf bereits geladen sein, während ein opakes öffentliches Rechteck die sichtbare Aufmerksamkeit steuert.
- Alte Assetrechte, Generationen, späte Beitritte und Reconnect unverändert absichern. Keine Freigabehistorie als Voraussetzung für die korrekte aktuelle Ansicht.

**Abnahme:** Identische freigegebene Pixel und keine Naht bei Ganzzahl- **und** Subpixelpositionen, Zoom und unterschiedlichen Pixeldichten; keine Pixel außerhalb der Freigabe. Der beigesteuerte Ganzzahlvergleich allein beweist dies noch nicht. Kein erneutes Kodieren unveränderter Innenkacheln; Randbytes und echte Anzeigeintervalle am iPad verbessern sich. Verbindlicher scharfer Endstand, keine nachlaufende Bewegungswarteschlange. Falls Subpixelgleichheit nicht erreichbar ist: gezielter sicherer Fallback statt stiller Qualitätsabweichung.

### 2 — Eine Pixelkette, danach bedarfsgerechter Transport

**Dateien:** HTML-Capture, `public-projection.ts`, `live-host.ts`, `LiveViewerCanvas.tsx`; Wire-/Serviceänderung nur als separat versionierter Transport-Slice.

**2a: Einmal endgültig kodieren.** Für Rasterbilder wird nur der echte Zuschnitt kodiert und über Abdeckungsänderungen wiederverwendet. D-124 hat den früheren HTML-PNG-Pfad entfernt; D-129 entfernt das Abdeckungs-Compositing. Keine allgemeine Rendererplattform oder privaten Zwischenbilder im Wire-Vertrag.

**2b: Wiederverwendung vor Codecwechsel.** Unveränderte sichere Assets behalten ihre Identität. Für häufig wechselnde Randbilder zunächst PNG; verlustfreies WebP für lange wiederverwendete Kacheln anhand mehrerer repräsentativer Materialien und Zielgeräte prüfen. MIME und tatsächliches Encoderergebnis validieren; `quality: 1` ist kein portabler Verlustfreiheitsvertrag. Keine automatische Neukodierung nach jedem Verschieben.

**2c: Transportklippe und veraltete Arbeit entfernen.** Neue kleine Assets innerhalb des bestehenden Gesamtbudgets anteilig inline schicken, statt bei knapp über 128 KiB den gesamten Satz auf Upload + späteren Download umzustellen. Dies nur verwenden, wenn der Empfängervertrag gemischte Sätze unterstützt; sonst abgestimmt erweitern. Keine pauschale Vergrößerung von JSON-/Base64-Paketen. Anschließend nur bei weiterhin relevantem Netzanteil binäre Assetübertragung prüfen.

Vorbereitungsarbeit für überholte kosmetische Zustände begrenzen/abbrechen. Publizierte Szene und ihre sicheren Assets weiterhin atomar übernehmen; Endstand, Coveränderung und Freigabewechsel dürfen weder übersprungen noch durch alte Ergebnisse überschrieben werden. Faire Verarbeitung verhindert Verhungern bei dauernder Bewegung. Service-Fanout nach erfolgreicher Validierung möglichst einmal je identischer Empfängergruppe serialisieren.

**Abnahme:** Eine endgültige Bildkodierung pro neuem sicheren Fragment statt HTML-PNG-Zwischenrunde; keine unzulässigen Inhalte im Wire. Kein unnötiger Ganzsatzwechsel bei 128 KiB; gemischter Empfang/Retry/Abbruch funktioniert. Mit künstlich langsamem Netz wächst die Warteschlange nicht fortlaufend. Codecwechsel nur bei besserem Ende-zu-Ende-Ergebnis und bestandenen Pixel-/Alpha-/Farbtests.

### 3 — Lokale Ableitungen und lange Stunden

**Dateien:** `CanvasSurface.tsx`, HTML-Annotationen, Live-Signaturen, Follow-Viewer und zugehörige Cache-Eigentümer.

Erst mit einer repräsentativen materialreichen Teststunde profilieren, dann Kamera/Auswahl, Objektgeometrie und Inhaltsänderung getrennt invalidieren. Kameraänderung darf nicht unveränderte Stiftpunktlisten neu aufbauen. Aufgebaute Ableitungen pro Objekt wiederverwenden; gesteninterne Änderungen beachten, die nicht zuverlässig über Engine-`version` erkennbar sind.

Folgeansicht auf wachsenden nativen Bildbestand bei vielen HTML-Zuständen prüfen und begrenzen. D-113 löst dies für Clips, nicht automatisch für gemischte Folgeszenen. Autosave, Undo und Archivrevisionen nicht durch Verzögern oder Abschalten vermeintlich optimieren; nur bei messbarem Anteil getrennt angehen.

**Abnahme:** Zehn Minuten wiederholte HTML-/Bildänderungen in Folgen und Clip: Bestände erreichen eine nachvollziehbare Obergrenze statt linear zu wachsen. Zweiter gleich langer Durchlauf wird nicht zunehmend langsamer. Stift/Marker, Undo, Speichern und Reload funktionieren unverändert.

### 4 — Gezielte Architekturfolgen, keine Voraussetzung für 1–3

**4a: Öffentlicher Zustand für eigene HTML-Aufgaben — mit D-124 umgesetzt.** Manifestierte Pakete liefern `getState`/`applyState`, werden einmal pro Generation in den flüchtigen Sitzungsdienst geladen und synchronisieren danach nur validierten JSON-Zustand. Es gibt keinen generischen HTML-Rasterfallback mehr. Weil Teilnehmer das Paket technisch abrufen können, dürfen Live-Pakete keine geheimen Lösungen oder privaten Daten enthalten. Sperre/Freigabe und der vorbereitete Teilnehmer-ID-Modus verwenden denselben Wire-Vertrag.

**4b: PDF-Renditions, Einzelseiten bleiben erhalten.** Zunächst vorhandene Import-Provenienz für wiederverwendbare Render-Ergebnisse nach Quelle, Seite und Renderparametern nutzen; gestaffelte Erzeugung nur mit konsistentem Import-/Undo-Verhalten. Danach separat versionierte PDF-Seitenreferenzen und sichtbarkeits-/zoomabhängigen Cache prüfen. Auflösungen aus dem Original erzeugen, nicht aus einer kleinen PNG-Seite hochskalieren. Teilrendern spart Rasterfläche, garantiert aber nicht, dass PDF.js sämtliche Seitenanalyse/-zeichenarbeit überspringt; mit realem Material messen.

Bestehende PNG-Seiten und ältere Stunden bleiben lesbar. Referenzen nicht aus Dateinamen erraten; fehlende Provenienz behält ihren Rasterfallback. Druck, Export, Kopieren/Duplizieren, Offline-Reload, Backup und Wiederherstellung gemeinsam migrieren. Cacheverlust muss reparierbar sein; Original und Seitenidentität bleiben dauerhaft. Beim Entfernen eines Canvasobjekts nicht das geteilte Original oder noch anderweitig benötigte Renditions löschen.

**Entscheidungsgrenze:** Der öffentliche HTML-Zustand ist mit D-124 entschieden. PDF-Persistenzmigration bleibt eine eigene spätere Architekturentscheidung. Weniger Auflösung während Bewegung, verlustbehafteter Text oder Videostream sind nicht Teil dieses qualitätserhaltenden Plans.

## Testumfang und Rollout

- Pro Slice nur relevante Typ-/Vertragstests und ein fokussierter isolierter Browserflow. Nicht für jeden Versuch die gesamte Suite wiederholen.
- Gemeinsame Integrationsabnahme: Clipkante/Subpixel/Abdeckung, HTML-Klick/Scroll/Animation, lange Stift-/Markerzüge, Vorschau, Clipwechsel, Stundenwechsel, Ende und Reconnect. Für statistische Aussagen mehr als die bisherigen drei Klicks je Zustand verwenden.
- Vorgeschlagene Arbeitsziele, **noch keine nachgewiesenen Zusagen**: diskrete HTML-Antworten im lokalen Produktionsaufbau p95 unter 150 ms bei repräsentativen kleinen Aufgaben; lokale Eingabe möglichst im 16,7-ms-Framebudget und keine wiederholten Capture-Long-Tasks über 50 ms; Clipbewegung auf iPad 9 möglichst gleichmäßige mindestens 30 sichtbare Aktualisierungen/s ohne sinkende Schärfe. Bei Nichterreichen Phasenanteile bewerten, nicht Sicherheit lockern.
- Danach reale Abnahme auf iPad 9, MacBook und über Beelink/Tunnel. Zunächst wenige echte Renderer, anschließend synthetischer Fanout mit ungefähr einer Klasse; simulierte WebSocket-Empfänger beweisen keine iPad-Renderleistung. Netzanteil separat ausweisen. Chrome mit Tabletviewport ersetzt keinen iPad-Test.
- In kleinen Releases bereitstellen: zuerst Host-only, sofern mit bestehendem Viewer kompatibel; Viewer/Service/Wire später abgestimmt. Eine aktive Unterrichtssitzung nicht ungefragt für Tests beenden. Beelink nicht durch bloße Vermutung als Hauptursache behandeln.

## Dokumentation bei späterer Umsetzung

Audit bleibt historischer Messstand. Umgesetzte Änderungen mit neuen Vergleichswerten und Hardwaregrenzen in Betrieb/Test ergänzen. D-109 bei Änderung des HTML-Aufnahmevertrags, D-113 beim Kachel-/Cacheausbau und betroffene Wire-/Materialverträge ausdrücklich fortschreiben; bestätigte Architekturänderungen im Decision Log festhalten. Historische UI-Aussagen im README/AGENTS nicht nebenbei als Teil des Performance-Slices umschreiben.

**Nächster konkreter Auftrag:** 1A umsetzen, die parallel vorbereitete 1B-Änderung separat abnehmen und integrieren; kleine Cache-Freigaben aus 0 dazunehmen, soweit eindeutig isolierbar. Kein vorgeschalteter PDF-Großumbau und kein pauschaler Formatwechsel.

## Umsetzungsstand D-122 / D-123

- 1A: HTML meldet visuelle Änderungen direkt und zusammengefasst; diskrete Interaktionen warten nicht mehr auf den seriellen 250-ms-Rundlauf. Ruhende Canvasmaterialien werden nicht mehr vollständig kopiert. Gängige 2D-/WebGL-Zeichenaufrufe melden Pixeländerungen; laufende CSS-Animationen behalten den begrenzten 250-ms-Fallback. Transiente Fehler werden materialbezogen erneut versucht.
- 1B wurde zunächst als objektfeste Kachelung umgesetzt und gemessen. D-123 entfernt diesen Sonderpfad: Da Clip fachlich nur gewöhnliches Peeken verhindern muss, bleibt die vollständige bereinigte Szene geladen und ausschließlich die begrenzte Kamera bewegt sich. D-129 überträgt dieselbe Aufmerksamkeitslogik auf Abdeckungen; nur echte Crops bleiben eingebrannte Pixelgrenzen.
- Phase 0: Projektor-Caches und Quellreferenzen werden bei Stop vollständig freigegeben.
- Gemessener HTML-Stand mit 240 synthetischen Aufgabenblöcken: Folgen 204–222 ms, Clip 215–226 ms vom Klick bis zum beobachteten Schülerpixel; zuvor bis 384/388 ms. Drei ruhende Canvasmaterialien: 0 statt 895 ms Long-Task-Zeit in 1,6 Sekunden. Die vollständige DOM-Kopie einer tatsächlichen Änderung bleibt mit ungefähr 84–105 ms der nächste HTML-Hotspot.
- Aktueller D-123-Stand: zwei Sekunden aktive Clipbewegung ergeben 122 sichtbare Positionen aus 122 Präsentationsupdates bei 0 Inhaltsupdates, 0 Uploads, 0 Downloads und 0 Leerframes. Der frühere Kachelwert von 5,9 statt 22,7 ms bleibt historischer Vergleich, beschreibt aber nicht mehr den aktiven Renderer.

Der frühere Satz „Nächster konkreter Auftrag“ beschreibt den Ausgangspunkt dieses Plans. D-123 beseitigt die Cliprasterung, D-124 die HTML-DOM-/PNG-Kopie. Als nächste HTML-Prüfung gilt deshalb reale iPad-/Schulnetzlatenz und Klassen-Fanout; PDF-Persistenzmigration und pauschaler Codecwechsel bleiben zurückgestellt.

## Umsetzungsstand D-125 / D-133 – Live-Ink

- D-125s 80-ms-Vollszenen-Zwischenstand ist durch den gemeinsam ausgehandelten D-133-Patchkanal ersetzt. Aktive Stift-/Markerzüge senden ungefähr alle 34 ms nur den exakten veränderten Bereich ihrer bereits berechneten öffentlichen Punktliste; unveränderter Anfang und unverändertes Ende bleiben beim Empfänger. Andere Inhaltsbewegungen behalten den normalen 33-ms-Szenenpfad.
- Der Teilnehmer rekonstruiert die flüchtige Vorschau revisionsgebunden und rendert sie mit demselben nativen Excalidraw-Pfad. Es gibt keinen zweiten Ink-Renderer und keine abweichende lokale, persistierte oder endgültige Geometrie.
- Pointer-up erzeugt weiterhin einen normalen vollständigen Szenencommit. Erst dessen ACK beendet die Vorschau. Unter Backpressure dürfen Zwischenpatches entfallen; dadurch wächst keine Ink-Warteschlange und der Endcommit stellt den exakten gültigen Stand wieder her.
- D-125s öffentliche Extrempunktbegrenzung bleibt als Sicherheitsgrenze bestehen. Im wiederholbaren isolierten Production-Browserprofil desselben 520-Schritt-Markerzugs übertrug D-133 zwei kanonische Publikationen plus 466 Bereichspatches mit zusammen 5.514.704 Byte. Das sind rund 77 Prozent weniger als D-125 (23.479.662 Byte) und rund 91 Prozent weniger als die ursprüngliche Baseline (59.947.650 Byte), obwohl der Vorschautakt von 80 auf ungefähr 34 ms verkürzt wurde. Der synthetische Tabletviewport blieb mit 18,1 ms Frame-p95, ohne Long Tasks und ohne Ladezustand stabil; der 24.004-Punkte-Extremfall wurde nach 111 ms mit 9.582 Wirepunkten bestätigt.

Damit ist der vorher als optional beschriebene inkrementelle Wirekanal umgesetzt und quantitativ gegen die beiden vorhandenen Production-Browserstände verglichen. Offen bleiben die iPad-9-/Schulnetzabnahme und ein längerer Klassen-Fanout.
