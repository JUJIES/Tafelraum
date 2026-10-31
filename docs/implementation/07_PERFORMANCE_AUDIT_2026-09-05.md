# Performance-Audit der lokalen und öffentlichen Darstellung

Stand: 5. September 2026. **Diagnose und Vorschläge, keine beschlossenen Produktänderungen.** Auftrag: sporadische Einbrüche entlang der gesamten Kette untersuchen, besonders interaktives HTML. Der parallel bearbeitete Clip-/Kachelpfad wurde gelesen, aber nicht verändert. Kein Deployment, kein Neustart der Unterrichts-App oder Beelink-Dienste, keine Änderung am Unterrichtsarchiv.

**Nachtrag D-123:** Der Audit bleibt als Messbasis erhalten. Sein Cliprandproblem ist inzwischen strukturell entfallen: Ein Clip begrenzt nur noch die Kamera auf derselben bereinigten öffentlichen Szene und erzeugt bei Wechsel oder Rahmenbewegung keine neuen Inhaltsraster. Die HTML-Capture-Befunde und übrigen Kettenpunkte bleiben unabhängig davon relevant.

**Nachtrag D-124:** Auch die HTML-Capturekette ist inzwischen abgelöst. Manifestierte Pakete mit `live.state = v1` laufen als isolierte Materialinstanz beim Teilnehmer und synchronisieren kleinen fachlichen JSON-Zustand. Die unten genannten Capturedateien, PNG-Zyklen und Rasterfallback-Vorschläge beschreiben ausschließlich den historischen Messstand; sie sind kein aktiver Implementierungspfad mehr.

## Ergebnis und Reihenfolge

Es gibt mehrere voneinander unabhängige Engpässe. Der derzeit deutlichste vermeidbare Engpass liegt im **HTML-Capture auf dem Lehrergerät**. Danach folgen unnötige Bildumwandlungen, eine sprunghafte Transportumschaltung und die Lebensdauer öffentlicher Bilddaten. Ein Enginewechsel oder eine pauschale Verringerung der Auflösung ist aus diesem Audit nicht begründet.

| Reihenfolge | Befund | Beleg | Kleinster sinnvoller Ansatz |
|---|---|---|---|
| 1 | Ruhendes HTML mit einem Canvas wird wiederholt vollständig kopiert | Gemessen: bei drei Flächen 895 ms Long Tasks in 1.600 ms, ohne neue Publikation | Visuelle Änderungen zuverlässig melden/erkennen; unveränderte Canvasinhalte vor DOM-Kopie erkennen |
| 2 | HTML wartet auf einen seriellen Aufnahmezyklus mit anschließender 250-ms-Pause | Code und Klickmessungen | Interaktion löst priorisierte Aufnahme aus; eine laufende Aufnahme plus genau ein neuester Nachfolger |
| 3 | Auch nicht sichtbare Scrollinhalte werden mit allen CSS-Eigenschaften kopiert | Gleiche Fläche: 80 KB → 1,62 MB SVG; 5–11 → 85–100 ms DOM-Kopie | Darstellungsabhängige Invalidierung und layouttreue Begrenzung der Aufnahme; weniger vollständige Stilkopien |
| 4 | HTML wird bereits als PNG kodiert und danach erneut dekodiert/gerastert/kodiert | Zwei Kodierstufen je gemessener Änderung | Flüchtige Pixelquelle bis zum sicheren Zuschnitt; erst endgültige öffentliche Pixel kodieren |
| 5 | 128-KiB-Grenze schaltet den gesamten neuen Bildsatz von Inline auf HTTP | Gemessen am selben HTML: Folgen ~124 KB inline, Clip ~134 KB über HTTP | Kleine Assets anteilig inline; danach binäre, priorisierte Bildübertragung prüfen |
| 6 | Ein langsamer Bildstand blockiert nachfolgende Darstellung | Serieller Host-Publisher und Viewer-Pump mit vollständiger Assetbarriere | Neueste Zustände vorbereiten, veraltete Downloads begrenzen; pixelgebundene Freigaben atomar halten |
| 7 | Bild-/Quellreferenzen werden nicht überall gleich konsequent freigegeben | Code: nativer Follow-Dateicache, Projektor-Stop, HTML-Bildcache | Zuständige Eigentümer und begrenzte Lebensdauer je Cache; gezielter Langzeittest |
| 8 | Lokale Änderungen berechnen viele unveränderte Ableitungen erneut | Code: CanvasSurface, HTML-Annotationen, Live-Signaturen | Inhaltsänderung, Geometrie, Kamera und Auswahl getrennt invalidieren |
| 9 | Verlustfreies WebP kann öffentliche Bildbytes erheblich verkleinern | Ein synthetisches Blatt: 604.405 → 125.840 Bytes, null abweichende Pixel | Expliziter verlustfreier Encoder, Pixeltests und PNG-Fallback; zuerst endgültige Live-Raster |
| 10 | PDF-Import und öffentliche App-Auslieferung haben zusätzliche Startkosten | Code: alle PDF-Seiten vor Rückgabe; no-store auch für versionierte JS-/Fontdateien | Renditionen wiederverwenden, Import staffeln; nur öffentliche Buildassets langfristig cachen |

## Was tatsächlich gemessen wurde

- Apple M4, Chromium headless, **Production-Builds** von echtem `CanvasSurface` und Teilnehmerclient; temporäres Archiv und lokaler Sitzungsdienst. Der vorherige React-Dev-Engpass D-120 war damit ausgeschlossen.
- Lehrer 1.440 × 1.000, Teilnehmer 820 × 1.180 CSS-Pixel. Das ist ein Desktop mit Tabletviewport, kein iPad-Leistungstest.
- Generierte HTML-Fläche 600 × 448. Ein Farbbereich wechselt durch denselben lokalen Button zwischen Rot und Grün. 8, 100 oder 240 wiederholte Aufgabenblöcke liegen in einem gleich großen Scrollcontainer; mehr DOM bedeutet fast gleiche sichtbare Pixelzahl.
- Je drei echte Zustandswechsel in Folgen und Clip: insgesamt 18 erfolgreiche Klick-zu-Pixel-Messungen, keine Browserfehler. Die Schülerpixel werden alle 40 ms klein abgetastet; Endzeiten enthalten diese Beobachtungsunschärfe. Die Instrumentierung fügt ebenfalls etwas Arbeit hinzu. Drei Versuche erlauben keine belastbaren p95-Aussagen.
- Aufgezeichnet: Anfrage an die HTML-Bridge, Antwortgröße/-zeit, SVG-/PNG-Dekodierung, PNG-Kodierung, Projektorlauf, Publikation, Teilnehmerempfang, tatsächliche Farbe auf dem Teilnehmercanvas und Long Tasks.
- Keine echte Klasse und kein WAN-Lasttest. Die folgenden Laufzeiten **enthalten keine Internet-/Schulnetzlatenz**.

| HTML-Aufgabenblöcke | Lokale SVG-Zwischenbeschreibung | DOM-Anfrage bis Antwort | Klick bis Schülerpixel, Folgen | Klick bis Schülerpixel, Clip |
|---|---:|---:|---:|---:|
| 8 | 79.644 Zeichen | 5–11 ms | 127–265 ms | 99–271 ms |
| 100 | 690.332 Zeichen | 36–70 ms | 121–351 ms | 174–316 ms |
| 240 | 1.619.722 Zeichen | 85–100 ms | 215–384 ms | 213–388 ms |

Beispiel, 240 Blöcke / Folgen: **194 ms Aufnahme-Warten + 100 ms DOM-Kopie + 56 ms nachfolgende Bildaufbereitung/Publikation + 3 ms lokaler Nachrichtentransport + 31 ms bis beobachtete Schülerpixel = 384 ms**. Der Projektoranteil innerhalb der Bildaufbereitung lag hier bei 20 ms. Zeiten nicht nochmals addieren: Teilmessungen überlappen beziehungsweise sind ineinander enthalten.

Die Sichtfläche bleibt klein. Schon die DOM-Kopie verursacht auf dem M4 wiederholt rund 80–100 ms lange Main-Thread-Aufgaben. PNG ist hier nicht die einzige und nicht die größte CPU-Ursache.

## HTML: vermeidbare Arbeit und harte Verzögerungsgrenzen

### Aufnahme wird gepollt und über alle Materialien serialisiert

`src/canvas/interactive-html-capture.ts:133` arbeitet alle gewünschten Materialien nacheinander ab und ruft `changed()` erst nach diesem Durchlauf auf. Danach folgen weitere 250 ms Pause. Deshalb bedeutet „höchstens vier Aufnahmen/s“ nicht einen festen 250-ms-Zyklus: Die Aufnahmezeiten aller Materialien kommen dazu. Eine neue Antwort kann außerdem hinter anderen Materialien warten. Bei einer nicht antwortenden Bridge gilt ein viersekündiger Timeout (`:31`), Fehler werden bisher global weitergegeben.

Verbesserung innerhalb des vorhandenen lesenden Vertrags:

- Die Bridge meldet eine visuelle Änderung unmittelbar an den Host. Klick, Antwortwechsel und Scrollen erhalten Vorrang vor Hintergrundprüfung.
- Aufnahme pro Material zusammenfassen: höchstens eine laufende Arbeit und ein Vermerk „neuester Zustand danach“. Kein Queueaufbau für jede einzelne Mutation.
- Bereits fertige Materialbilder müssen nicht bis zum Ende aller anderen Materialaufnahmen auf eine Publikationsanmeldung warten. Weiterhin nur zusammenpassende Clip-/Abdeckungspixel freigeben.
- Animationen und Canvas benötigen eine eigene zuverlässige Änderungsquelle beziehungsweise einen begrenzten Fallback. Ein MutationObserver allein sieht weder Canvaspixel noch sämtliche Animationszwischenstände.
- Fehler-/Timeoutisolation pro Material prüfen. Eine geänderte Fehlerdarstellung wäre eine Produktentscheidung; hier keine stillschweigende Freigabe unvollständiger Bilder empfehlen.

### Ein einziges statisches Canvas hält teure DOM-Kopien am Laufen

`interactive-html-snapshot-bridge.mjs:24` akzeptiert „unverändert“ nur, wenn **kein** `<canvas>` und **keine** laufende Webanimation im Dokument existieren. Die Canvasgröße oder tatsächliche Pixeländerung werden dabei nicht berücksichtigt. Erst nach erneutem Kopieren und Übertragen des SVGs kann der Host über die Signatur feststellen, dass nichts geändert wurde.

Gezielter Leerlauftest mit 240 Aufgabenblöcken; je 1.600 ms nach Einpendeln:

| Zustand | Vollständige DOM-Antworten | Long-Task-Zeit im Lehrerbrowser | Neue Publikationen |
|---|---:|---:|---:|
| Eine statische HTML-Fläche ohne Canvas | 0; sechs „unverändert“-Antworten | 0 ms | 0 |
| Dieselbe Fläche mit einem unveränderten 1×1-Canvas | 5 | 506 ms | 0 |
| Drei solche ruhenden HTML-Flächen | 10 | 895 ms | 0 |

Der dritte Fall verbringt rund 56 % des Beobachtungsfensters in langen Aufgaben, obwohl Schüler keinerlei neue Information bekommen. Das ist der stärkste reproduzierte unnötige Blocker. Einfach die Pollingrate zu erhöhen würde ihn verschärfen.

Für eigene Materialien ist eine explizite `visual-dirty`-Meldung nach tatsächlichem Zeichnen eine kleine und wartbare Ergänzung. Generische Pakete brauchen eine geprüfte Änderungsprüfung ihrer dynamischen Flächen. Unsichtbare Animationen sollten nicht pauschal das gesamte HTML invalidieren.

### Nicht sichtbarer DOM und vollständige CSS-Kopie

Die Bridge kopiert rekursiv alle Kinder außer `display:none`, liest für jedes Element sämtliche berechneten CSS-Eigenschaften und zusätzlich Pseudoelemente (`interactive-html-snapshot-bridge.mjs:48–137`). Kinder unterhalb des sichtbaren Scrollausschnitts bleiben Teil des serialisierten Dokuments. Die 240-Blöcke-Probe enthält daher rund zwanzigmal mehr SVG-Text als die kleine Probe, bei beinahe identischem Endbild.

Ansatz: gecachte statische Darstellungsstruktur plus gezielte Invalidierung. Eine Begrenzung auf den sichtbaren Ausschnitt muss Grid/Flex, Scrollhöhe, Vererbung, Pseudoelemente und überstehende Effekte erhalten; blindes Entfernen „offscreen“ liegender Knoten wäre kein sauberer Fix. Ein kontrollierter öffentlicher Renderer eigener Aufgaben kann dieses Problem später grundsätzlich umgehen.

### Mehrfache Pixel-/Stringumwandlung

Aktueller Weg:

```text
HTML-DOM + alle berechneten Stile
→ serialisiertes SVG + postMessage-Stringkopie
→ SVG als Image dekodieren
→ Canvas mit Griffleiste zeichnen
→ synchrones PNG + Base64-String
→ PNG erneut als Image dekodieren
→ native sichere Rasterung / Zuschnitt
→ endgültiges PNG + Hash
→ Inline-Base64 oder HTTP-Blob
→ Teilnehmer: gegebenenfalls Blob → Base64 → Image.decode
→ sichtbares Canvas
```

Im 600×448-Fall wird das erste PNG aus 1.075.200 Pixeln kodiert; danach folgen im Folgemodus 1.178.112 Ausgabepixel, im Clip zwei Teilbilder. Allein die erste synchrone PNG-Kodierung kostete typischerweise 4–8 ms, die zweite asynchrone Kodierung je nach Fall etwa 5–19 ms, plus Dekodierung und Kopien.

Langfristig sollte die lokale Capturequelle eine kurzlebige Pixeloberfläche mit eindeutiger Revision liefern. Diese geht direkt in den **bestehenden sicheren** Compositor; nur dessen endgültiges öffentliches Ergebnis braucht einen Codec. Blob-/ImageBitmap-Lebensdauer explizit halten. Worker können sichere Rasteroperationen, Hashes und Kodierung entlasten; DOM und `getComputedStyle` bleiben auf ihrem zuständigen Browserthread. Das erfordert einen begrenzten Umbau der Quellübergabe, keinen Engine-Fork. Die Sandboxgrenze bleibt erhalten.

MDN empfiehlt für große Bilder Blob-/Object-URL-Pfade gegenüber vollständigen Data-URL-Strings; OffscreenCanvas erlaubt Canvasarbeit einschließlich Blob-Erzeugung im Worker: [toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL), [OffscreenCanvas.convertToBlob](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob).

## Transport und Schülerdarstellung

### Die 128-KiB-Umschaltung ist eine echte Leistungskante

`live-host.ts:514–535`: Nur wenn **alle** neuen Raster zusammen höchstens 128 KiB groß sind, geht der gesamte Satz inline. Sonst werden sämtliche Assets per HTTP in Vierergruppen hochgeladen; erst anschließend wird die Szene publiziert. Der Teilnehmer lädt neue Assets danach selbst herunter.

Die 100-Blöcke-Probe sendet in Folgen etwa 123.904 PNG-Bytes direkt; im Clip werden daraus etwa 134.053 Bytes und damit HTTP-Uploads/Downloads. Selbst das kleine zweite Teilbild mit etwa 27 KB wird dann nicht mehr inline mitgegeben. Ein schmaler Unterschied in Bildinhalt oder Zerlegung wechselt dadurch den Transportweg.

Erster Ansatz: kleine neue Raster bis zum bestehenden Budget inline auswählen und nur den Rest hochladen. Größerer Ansatz: binäre Assetnachrichten und ein priorisierter Scheduler; Sender, Service und Viewer müssen dafür denselben validierten Vertrag beherrschen. Ein höheres Pauschallimit allein vergrößert die JSON-/Base64-Last und den Rückstau.

### Veraltete Arbeit und gemeinsame Assetbarrieren

Der Host hat schon eine sinnvolle begrenzte Pipeline mit vier offenen ACKs. Aber `publishing` bleibt während Rasterung und Upload aktiv; neuere Eingaben können nur `dirty` setzen. Eine langsame alte HTTP-Publikation blockiert also den Start einer aktuelleren Aufbereitung. Im Viewer wartet `Promise.all(content.assetIds...)` auf alle Bilder. Sein Pump beendet eine begonnene Revision, bevor er die neueste anwendet; Generationswechsel werden gesondert abgefangen. Innerhalb dieser Revision kann ein langsamer Download andere sichtbare Änderungen verzögern.

Ansatz: Aufbereitung, Übertragung und Commit getrennt planen; neue Revisionen vorladen, überholte Arbeit begrenzen und die neueste **vollständig vorbereitete** sichere Ansicht bevorzugen. Nicht jede fertige Revision blind verwerfen, sonst droht bei Dauerbewegung Aushungern der Anzeige. Clipgrenze, Abdeckung und Pixel müssen weiterhin atomar zusammenpassen. Die jetzige Barriere erfüllt eine fachliche Funktion, ihre Warteschlange ist optimierbar.

### Verteilung und Netz

Der Beelink rastert aktuell keine Unterrichtsinhalte; er validiert und verteilt Hostdaten. Eine stärkere Server-CPU beseitigt daher keine DOM-Kopie auf dem Lehrer-Mac. `rooms.ts:30–36` serialisiert allerdings dieselbe Nachricht erneut pro Teilnehmer; ein vorserialisierter Payload je kompatibler Empfängergruppe spart diese CPU-Arbeit verlustfrei. Die tatsächliche Bedeutung unter Klassenlast wurde hier nicht gemessen.

Bandbreitenbeispiel, kein Lastmessergebnis: 300 KB geänderte Bilddaten × 4 Updates/s × 30 Teilnehmer sind ungefähr **36 MB/s beziehungsweise 288 Mbit/s** Serverausgabe vor Protokolloverhead. Der Host lädt nur einmal hoch; der Server sendet dennoch an jedes Gerät. Unveränderte Bilder wiederverwenden und nur geänderte sichere Pixel übertragen skaliert deshalb besser als pauschal höhere Frequenz.

Zwei öffentliche `/health`-Abrufe brauchten 221–237 ms einschließlich neuer Verbindung und TLS. Das ist weder eine WebSocket-RTT-Messung noch die Schüler-Endlatenz. Eine reine Bestandsabfrage zeigte Intel N150 / vier logische CPUs, momentan 25 % CPU und rund 1,59 GiB freien physischen Speicher bei etwa 15,8 GiB gesamt; beide Live-Dienste liefen. Daraus lässt sich weder der Dienst als Speicherverschwender noch eine Kapazität für 30 Tablets ableiten. Kein Serverlasttest und keine fremden Prozesse verändert.

## Lokale Darstellung, Speicher und Import

### Wiederholte Ableitungen auf dem Lehrergerät

`CanvasSurface.tsx:1885–1950` leitet Audio-, HTML-, YouTube-, Schatten-, Cover- und Verwendungszustände bei Engineänderungen erneut aus der Szene ab. `getInteractiveHtmlFrame` berechnet Annotationen vor dem späteren Gleichheitsvergleich. `interactive-html-annotations.ts:109–127` transformiert und kopiert ganze Strichpunktlisten, auch wenn eine Kameraänderung die gespeicherte Geometrie nicht verändert hat.

`LiveHost.inspectChanged` serialisiert alle Punkte und Drucklisten etwa alle 33 ms; `project()` klont die Szene, erzeugt Raster-Signaturen und validiert sie; Host und Service berechnen jeweils noch einmal Elementdifferenzen. Das schützt aktuell auch Zwischenstände, deren Enginezähler nicht zuverlässig steigen. Trotzdem muss eine Änderung an einem Objekt nicht alle unveränderten Striche wieder durch diese Arbeit schicken.

Ansatz: gecachte Ableitungen nach tatsächlichem Inhalt/Geometrie, gesonderte Kamera-/Auswahlprojektion und gestenlokale Änderungskennung. Nicht einfach nur auf `version` prüfen: der bestehende Vertrag nennt explizit Gegenfälle. Diese Hotspots sind aus dem Code abgeleitet; ihr Anteil an einer materialreichen realen Stunde ist noch separat zu profilieren. Der Audit rechtfertigt kein großflächiges Canvas-Refactoring ohne diese Messung.

Autosave läuft verzögert (lokal 160 ms, Datei-Outbox zusätzlich 800 ms). Er ist kein bestätigter Verursacher der HTML-Verzögerung. Bei langen Stunden bleiben vollständige Snapshot-Serialisierung, IndexedDB-Kopien und aufeinander folgende Dateiwrites als nachgeordnete Prüfpunkte; Speicherschutz und Revisionen erhalten.

### Cache-Lebensdauer und Langzeitverhalten

- Clip und Vorschau besitzen bereits den verbesserten begrenzten Rasterrenderer aus D-113. Das im anderen Task bearbeitete Kachelproblem nicht nochmals parallel implementieren.
- Im **Folgemodus** werden neue Raster-IDs weiterhin über `api.addFiles` in Excalidraw eingefügt. Der eigene `assets`-Cache wird gekürzt, der native Dateibestand an dieser Stelle nicht. Häufige HTML-Screenshots sind deshalb auch ein möglicher Langzeit-Speichertreiber außerhalb des Clip-Modus.
- `createPublicProjector.stop()` räumt HTML und Paintcache, aber nicht die Maps `cache` und `decodedSources`. Diese halten sichere Blobs und Quell-Data-URLs, solange die Instanz erreichbar bleibt. `closeSession()` hält dieselbe Instanz zunächst weiter. Explizite Freigabe beim Stop ist ein kleiner, qualitätsneutraler Ansatz; die gemessene RAM-Wirkung ist noch offen.
- Der HTML-Paketbildcache hält URLs bis Stop; entfernte Materialien räumen Views/Raster, nicht ihre Paketbildbytes. Das 32-MB-Limit zählt heruntergeladene Bildbytes, nicht zusätzlich gehaltene Base64-/dekodierte Daten. Innerhalb einer langen Generation kann historische Nutzung das Limit ausschöpfen.
- `createPublicIds` merkt jede Bildhash→ID-Zuordnung für die ganze Generation. Das ist kleiner als Bildspeicher, wächst aber mit jedem einzigartigen Raster. Lebensdauer und eventuell generationengesalzene deterministische IDs prüfen, ohne öffentliche private Quellhashes einzuführen.

### PNG, WebP und echte PDFs

Ein anderes Quellformat allein verändert den Live-Datenweg nicht: Der öffentliche Projektor erzeugt momentan ohnehin PNGs. Insbesondere bringt ein JPEG-/WebP-Import keinen automatischen Wechsel des Live-Codecs.

Verlustfreier Formatversuch mit einem eigens erzeugten Textarbeitsblatt, 1.191×1.684 Pixel; ein Durchlauf, keine allgemeine Codec-Rangliste:

| Encoder | Datei | Kodierdauer | Pixelabweichungen | Dekodiertes RGBA-Bild |
|---|---:|---:|---:|---:|
| Browser-PNG | 604.405 B | 12,2 ms | 0 | 8.022.576 B |
| Chromium-WebP, Qualität 1 | 125.840 B | 19,7 ms | 0 | 8.022.576 B |
| cwebp 1.6.0, explizit lossless, `-q 0 -m 1` | 298.000 B | 29,2 ms einschließlich Prozessstart/PNG-Lesen | 0 | 8.022.576 B |

WebP ist damit ein guter **Transportkandidat**, aber kein kostenloser CPU-/RAM-Gewinn. Ein fester verlustfreier Vertrag und Tests für Text, Alpha, Farbprofile und Zielbrowser sind nötig. Chromium schaltet bei Qualitätswert 1 auf lossless; das ist eine Implementierungseigenschaft, kein browserübergreifendes Versprechen des allgemeinen Canvas-Qualitätsparameters. [Chromium-Encoder](https://chromium.googlesource.com/chromium/src/+/0aee4434a4dba42a42abaea9bfbc0cd196a63bc1/third_party/blink/renderer/platform/image-encoders/image_encoder.cc), [WebP-Modi](https://developers.google.com/speed/webp).

Der HTTP-Assetvalidator und Teilnehmerdecoder kennen WebP bereits. Projektor, Inline-Rastervertrag und Service-Inlinepfad sind dagegen noch PNG-spezifisch; ein Wechsel erfordert deren abgestimmte Erweiterung. Verlustfreie Kodierung nur einmal pro endgültigem Bild, nicht zusätzlich auf jeder Zwischenstufe.

Die Original-PDFs werden beim normalen Materialimport bereits in der Stundenbasis erhalten. Ihre Canvasdarstellung wird in `material-import.ts` mit PDF.js bei Faktor 2 in PNG-Seiten gerendert. Ein PDF-Viewer muss ebenfalls Pixel erzeugen; gleiche gerenderte Seitenauflösung benötigt weiterhin Speicher. Die PDF.js-Dokumentation begründet deshalb das Rendern/Halten nur benötigter Seiten: [PDF.js FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions).

Sinnvolle spätere Verbesserungen: Renditionen nach Quelldatei/Page/Rendererparametern wiederverwenden, Seiten gestaffelt importieren, nur benötigte Auflösungen dekodiert halten und höher auflösende lokale Renditionen aus dem Original bei Bedarf nachladen. Heute werden bis zu 20 Seiten vollständig erzeugt und gesammelt, bevor der Aufruf sie zurückgibt. Allein 20 RGBA-Seiten der Beispielgröße entsprechen rund 160 MB Pixeln, zusätzlich zu komprimierten Dateien, Engine-/Canvaspuffern und zeitweiligen Kopien. Ein direkter öffentlicher PDF-Download würde außerdem versteckte Texte/weitere Seiten freigeben und ersetzt den jetzigen Clip-/Abdeckungsvertrag nicht.

### Laden der öffentlichen App

`services/live-canvas/server.ts` setzt `Cache-Control: no-store` auch für gehashte öffentliche JS-/CSS-Dateien und Fonts. Das verursacht unnötige erneute Downloads beim Öffnen/Reload; es erklärt keine Verzögerung eines bereits laufenden HTML-Klicks. Nur unveränderliche, versionierte öffentliche Buildassets dürfen langfristig gecacht werden; noch unversionierte Fontpfade vorher entsprechend adressieren. Einstieg/Manifest müssen aktualisierbar bleiben, Sitzungsbilder und autorisierte Inhalte behalten ihre bisherige Zugriffskontrolle. Großes Enginebundle als getrennten Startkostenpunkt behandeln.

## Architekturoptionen jenseits der kleinen Korrekturen

**Eigene HTML-Materialien mit explizitem öffentlichem Zustand:** Für Quiz, Zuordnung und andere kontrollierte Aufgaben können Frage, freigegebene Auswahl, Aufdeckzustand und Scroll-/Ansichtsstand übertragen werden. Ein lesender Teilnehmerrenderer stellt dieselbe Aufgabe lokal dar. Dann läuft ein Klick über eine kleine Zustandsänderung statt über DOM→SVG→PNG. Das passt zu späterer kontrollierter Mitarbeit, ist aber ein neuer öffentlicher Materialvertrag. Nicht das ganze HTML-Paket samt versteckter Lösungen übertragen. Einheitliche Layouts, Schriftdateien, Animationen, Reconnect und exakt dieselbe erlaubte Information müssen definiert werden; pixelidentische Darstellung verschiedener Browser ist keine automatische Zusage. Generisches HTML behält einen optimierten Rasterfallback.

**Video-/WebRTC-Pfad:** Für echte kontinuierliche Animation kann ein Stream einer ausschließlich sicheren öffentlichen Kompositionsfläche sinnvoll sein. Das heutige PNG-Slideshowmodell ist dafür strukturell ungeeignet. Video ist allerdings typischerweise verlustbehaftet, hat andere Textschärfe-, Transport- und Betriebsanforderungen und löst die Aufnahme von DOM nicht automatisch. Deshalb keine erste Maßnahme für verlustfreie Arbeitsblätter und Antwortwechsel.

**Enginewechsel:** tldraw könnte andere Dokument-/Shapeverträge bieten, beseitigt aber weder die aktuelle HTML-Screenshotkette noch den Upload-/Downloadweg durch einen Austausch allein. Dafür gibt es in diesem Audit keinen ausreichenden Produktbeleg.

Empfohlene nächste Arbeit: zunächst die gemessenen HTML-Leerlauf- und Capture-Wartezeiten beheben, danach eine einzige sichere Pixelpipeline und verlustfreien Transport erproben. Parallel laufende Clipoptimierung anschließend mit demselben Ende-zu-Ende-Messschema integrieren. Erst wenn diese Grundlagen stehen, einen kleinen öffentlichen Zustandsvertrag für **eine** reale HTML-Aufgabenart prüfen.

## Reproduktion und verbleibende Abnahme

Vom Repositoryroot mit Node ≥22.18 und vorhandener Playwright-Laufzeit:

```sh
node --experimental-strip-types scripts/performance-audit.mjs /absoluter/pfad/playwright/index.mjs
TAFELRAUM_AUDIT_NODES=240 TAFELRAUM_AUDIT_IDLE=1 node --experimental-strip-types scripts/performance-audit.mjs /absoluter/pfad/playwright/index.mjs
node scripts/performance-audit-codecs.mjs /absoluter/pfad/playwright/index.mjs
```

Der erste Prüfer baut Host/Viewer in temporäre Ordner, nutzt ausschließlich Port 5186/5853 und entfernt Archiv/Builds/Dienst nach Abschluss. Keine Produktdatei wird dafür umgebaut. Der Codecprüfer verwendet die bereits installierte `/opt/homebrew/bin/cwebp`-CLI; keine neue Projektdependency. Ergebnisse in `output/performance-audit/chain-results.json`, `idle-results.json` und `codec-results.json`; Quellhashes dokumentieren den untersuchten Stand. Die fünf erfassten Quelldateien waren am Ende unverändert.

Offen: tatsächliches iPad 9 und Lehrer-Touchscreen, echte problematische Unterrichtsfläche, 20–30 rendernde Geräte im Schulnetz, längere Follow-Sitzung mit wechselndem HTML sowie Klick-zu-Pixel-Messung über den echten Tunnel. Der Audit reproduziert vermeidbare lokale Ursachen; er behauptet nicht, die gesamte berichtete Verzögerung unter allen Praxisbedingungen bereits erklärt zu haben.

Dokumentationsdrift: README/ältere Betriebsabschnitte enthalten weiterhin einzelne historische Auge-Einstiege und alte Aussagen zum allgemeinen nativen Viewer-Bildcache; D-117 beziehungsweise D-113 sind spezifischer. Diese UI-/Betriebspassagen wurden wegen paralleler Arbeiten hier nicht umgeschrieben. Dieses Audit ergänzt Beobachtungen; es überschreibt keine Entscheidung im Decision Log.
