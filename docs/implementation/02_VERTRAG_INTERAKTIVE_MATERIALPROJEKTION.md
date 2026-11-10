# Einbettungsvertrag – Material und interaktive Inhalte

**Releasefortschreibung 22.10.2026:** Der vollständige HTML-Medien-/Room-/native Vollbildpfad ist mit 0.1.70 signiert veröffentlicht. Die heutige direkte Autorsteuerleiste einschließlich bestätigtem Scrubbing bleibt paketlokal (D-286); vorbereitete Pakete verwenden denselben veröffentlichten Appvertrag. Keine automatische Materialinstallation, Produktivmigration oder Remote-Videosteuerung. Frühere Beschränkungen auf die separate Test-App sind für den Programmcode historisch. Prüfgrenzen und Belege: Desktop-Updatedokument und `output/release-0.1.70/`.

**Stand:** 7. September 2026  
**Status:** verbindlich für neue Materialrenderer, Audio-/Videoplayer, HTML-Artefakte und Website-Einbettungen

**D-272:** DOCX ist ein Importformat, kein neuer Projektions-/Canvasmaterialtyp. Die lokale Material-API erzeugt ein PDF und erhält Quelle/PDF gemeinsam im normalen Stundenmaterialbaum. Darstellung, Provenienz und Annotationen folgen danach dem unveränderten PDF-Rasterpfad. [Betrieb/Prüfung](39_DOCX_IMPORT_TEST.md).

## Zweck

D-277 ergänzt nur lokale HTML-Ressourcen um gestreamte MP4-/WebM-Medien und
erhaltene TXT-Quellennotizen; kein neuer Renderer oder Canvasobjekttyp. Die
Sandbox bleibt geschlossen. Behalten speichert pausierte semantische Positionen,
keinen laufenden Playbackzustand. D-278 ergänzt ausdrücklich deklarierte
`playback.protocol=room-v1`-Pakete. D-280 präzisiert den Ausgabeort: Ohne aktiven
Room spielt der vorhandene HTML-Player auf der Lehrerfläche; mit Room wird diese
zur leichten Steuerung und ausschließlich das Room-Fenster lädt den Player.
Vorschau bleibt passiv. Übergaben pausieren, erhalten den bestätigten semantischen
Stand und starten nichts automatisch. Kurzlebige, sichtbarkeits- und generationsgebundene Freigaben
pausieren bei Ausfall; Befehle/Status werden nicht archiviert. Gewöhnliches HTML
und native Video-/YouTube-Elemente bleiben unverändert. Nur getrennte Teststunden,
keine native/hardwarebezogene Freigabe. Siehe [Prüfstand 43](43_HTML_MEDIA_INTEGRATION_TEST.md).

D-281 erlaubt im selben Paket optional `playback.controllerEntry`: dieselbe
Präsentationshülle mit passiven Bildern und zentraler Lehrersteuerung statt
generischer Fernbedienfläche. Kein zweiter Player oder laufendes Spiegelvideo;
normales HTML, Geometrie, Fachzustand und Sandbox bleiben im bisherigen Vertrag.

D-283 ersetzt die CSS-Ersatzprojektion D-282: originale native Video-Vollbildtaste
und native API desselben Videoelements. Nur tatsächliche deklarierte Room-/lokale
Player-Entries und ihre Frames erhalten Fullscreen; gewöhnliches HTML und passive
Ansichten bleiben gesperrt. Rückkehr ohne Neustart zur gleichen Kamera/Clipansicht;
kein Zusatzknopf, zweite Medien-/Geometrie- oder Persistenzwahrheit.

D-285 vermittelt die native macOS-Aktivierung ausschließlich an den tatsächlich
anfragenden Room-Ausgabe-Subframe. Ein fester Callback erledigt nur einen noch
ausstehenden, gültigen Vollbildbefehl derselben Instanz; keine allgemeine native
JS-Bridge oder Gesten-Ausnahme. Autorcontrols bleiben über Statusupdates DOM-stabil.

Dieser Vertrag verhindert, dass neue Materialtypen als Sonderfall direkt in die Canvas-Engine eingebaut werden. Er ergänzt D-049, D-050, D-054 und D-135 und ist vor jeder neuen Audio-, Video-, HTML-, Website- oder vergleichbaren Einbettung zu lesen.

Die Leitfrage lautet zuerst:

> Ist der Inhalt statisch, von Tafelraum kontrolliertes interaktives HTML, eine freigegebene Unterrichts-App oder eine sonstige fremde Oberfläche?

Erst danach wird der Renderer gewählt. Nicht jeder Materialtyp verwendet denselben Renderer, aber alle folgen demselben Daten-, Geometrie- und Eingabevertrag.

## Unveränderliche Regeln

1. **Eine fachliche Quelle:** Originaldatei oder kanonischer Materiallink liegt im Unterrichtsarchiv. Externe Dateien und Links werden deshalb vor ihrer ersten Canvasplatzierung additiv in die aktive Stundenbasis übernommen. Globale Unterrichts-Apps sind ausdrücklich kein Material: Ihre stabile App-ID wird aus einer codegeprüften Entwickler-Registry aufgelöst; URL, Icon und Anbieterfähigkeit stammen nie aus Stunden- oder Nutzerdaten. Canvas, DOM und Browserstores erzeugen keine zweite Materialbasis oder App-Registry.
2. **Eine Geometriewahrheit:** Position, Größe, Drehung, Auswahl, Löschen, Undo/Redo und Reload kommen aus dem nativen Canvasobjekt. Eine DOM-Projektion leitet ihren Viewportrahmen daraus ab und speichert keine parallele Geometrie.
3. **Provenienz statt Kopie:** Das Canvasobjekt hält bei Material nur stabilen Typ, Quellenreferenz, Archivprovenienz und ausdrücklich beschlossene materialbezogene Darstellungsparameter. Bei einer globalen App hält es ausschließlich Typ, registrierte App-ID und den optionalen manuellen Inhaltszoom. Originalbytes, URLs der App-Registry, vollständiges HTML, Konten, Passwörter, Sitzungstokens, Berechtigungen, Lern- oder Wiedergabestatus gehören nicht in Canvasmetadaten. Der Inhaltszoom ist ein kanonischer Darstellungsparameter am Träger und erzeugt keine zweite Canvasgeometrie.
4. **Interaktion bleibt live:** Bedienbare Inhalte werden nicht als Screenshot gerastert und nicht als `srcdoc`-Iframe innerhalb der Canvas-Engine ausgeführt. Die Engine zeichnet für projizierte Medien keine sichtbare zweite Playerfläche.
   **Live-Canvas-Regel D-124/D-133:** Eigene manifestierte Pakete laufen als getrennte isolierte Instanz bei Host und Teilnehmern. Ausschließlich ihr fachlich validierter JSON-Zustand wird revisionsgebunden synchronisiert; es gibt keinen HTML-Screenshot- oder Zwischenrasterpfad. Clip und Abdeckung begrenzen Kamera beziehungsweise Aufmerksamkeit, nicht Paket- oder Bildbytes. Live-Pakete dürfen deshalb keine vertraulichen Lösungen oder privaten Daten enthalten.
5. **Genau eine sichtbare Oberfläche:** Außenrahmen, Radius, Clip und Schatten gehören zu einer klar benannten Ebene. Enginekontur, Iframekontur und React-Karte dürfen nicht übereinander eine zweite Kante oder helle Ecken erzeugen. Lokale HTML-Pakete füllen deshalb ihren Bildschirmviewport selbst und bringen keinen zusätzlichen Browser-Vorschauboden oder äußeren Dokumentenschatten mit; der Tafelraum-Frame trägt die gemeinsame Materialkante.
6. **Deckungsgleiche Transformation:** Äußerer Viewportrahmen und innere Oberfläche beginnen an derselben oberen linken Kante. Skalierung, Rotation oder Schatten dürfen die Projektion nicht relativ zum Canvasobjekt verschieben.
7. **Kein unabhängiges Mindestmaß:** Titel, Zeit, Symbole, Controls und Abstände dürfen beim Herauszoomen nicht bei einer eigenen Mindestgröße stehen bleiben. Wenn eine Fläche als Einheit skaliert, folgt jedes sichtbare Detail exakt derselben Stufe.
8. **Keine künstliche Vergrößerung fremder Pixeloberflächen:** Ein fremder Iframe wird beim Hineinzoomen in der tatsächlichen Zielgröße layoutet und nicht aus einer kleineren gerenderten Fläche hochskaliert.

## Renderer auswählen

**Eingebaute Widgets (D-252):** Stundeneigene Widgetinstanzen sind keine Materialdateien und keine Anbieter-Apps. Ihr natives Canvasobjekt hält den geprüften Widgettyp und ausdrücklich beschlossene Konfiguration (Timer: Dauer/Ton), aber keine laufende Uhr. Der erste Timer verwendet eine eigene kleine React/SVG-Projektion nach der Regel für feste Tafelraum-Oberflächen. Direkte Bedienung bleibt bei jedem Werkzeug aktiv; Annotation, Textbinding und Abdeckung sind ausgeschlossen. Eine Hostlaufzeit verarbeitet Start/Pause/Reset atomar; Room erhält ausschließlich lokale Geometrie-/Laufzeitprojektionen und sendet revisionsgeprüfte Befehle. Das Endsignal entsteht einmal im Host. Der beauftragte Nachtrag vom 28.10.2026 ersetzt den Remote-Platzhalter für Timer durch eine passive öffentliche Uhr: explizit validierte Darstellung am öffentlichen Rechteck, serverseitiger Zeitanker, ausgehandeltes `supportsTimerWidgets`, keine Teilnehmeraktion oder Remote-Tonquelle. Timer dürfen über dieselbe Clip-Referenzliste isoliert in Room/Remote gezeigt werden; Start wechselt weiter kein Anzeigeziel. Siehe [Timer-Brief](../design/21_TIMER_WIDGET_UI_BRIEF.md).

| Inhalt | Renderer | Zoomregel | Beispiele |
|---|---|---|---|
| Statisches Rastermaterial | vorhandener Canvas-Bildpfad | Canvas skaliert die Rendition; Auflösung kommt aus dem Assetpfad | PNG, JPEG, WebP, gerenderte PDF-Seite |
| Tafelraum-eigene, feste Bedienoberfläche | transparente Canvasgeometrie plus React/HTML-Projektion | eine feste innere Geometrie wird als vollständige Live-DOM-Einheit skaliert; keine Teilkomponente reflowt unabhängig | aktueller Audio-Player, lokaler MP4-Player |
| Fremder, nicht scrollbarer Player | transparente Canvasgeometrie plus isolierter Anbieter-Iframe in einer DOM-Projektion | unter `100 %` wird die vollständige Iframe-Oberfläche heruntergerechnet; ab `100 %` layoutet sie direkt in der Zielgröße, Darstellungsskala höchstens `1` | aktueller YouTube-Player |
| Interaktives lokales HTML | transparente Canvasgeometrie plus isolierter Frame in einer DOM-Projektion | stabile innere Layoutfläche; Canvaszoom skaliert Titel, Inhalt, Controls und Abstände als eine Einheit, ein separat gespeicherter manueller Inhaltszoom verändert ausschließlich den Maßstab innerhalb des Rahmens; Scrollen gehört dem Inhalt, Objektbewegung ausschließlich der Tafelraum-Griffleiste, Canvas-Pan im Handmodus zusätzlich dem neutralen Inhaltshintergrund | aktueller lokaler HTML-Paketslice |
| Entwicklerregistrierte Unterrichts-App | transparente Canvasgeometrie plus anbietergebundener Sandbox-Frame; App-ID wird ausschließlich über die feste Registry aufgelöst | stabile innere Layoutfläche; Canvaszoom skaliert App und Tafelraum-Griffleiste gemeinsam, der gespeicherte Inhaltszoom verändert nur den Appmaßstab; ein kleinerer sichtbarer Rahmen schneidet ab und lässt den Anbieter scrollen, statt seine Oberfläche still zu verkleinern; Rand-Chaining und neutraler Hintergrund folgen dem vereinbarten Bridge-Vertrag | Lerndeck-Pilot |
| Beliebige scrollbare Website | nicht freigegeben | benötigt eigenen Quellen-, Ladefehler-, Berechtigungs- und Interaktionsvertrag | kein aktueller Slice |

Ein PDF-Viewer, Audio-Player und Websiteobjekt sind deshalb nicht austauschbare Varianten desselben Iframes. Der Materialtyp bestimmt die passende Projektion.

## Gemeinsamer Eingabevertrag

- Direkte Controls reagieren beim ersten Klick, unabhängig vom aktiven Canvaswerkzeug.
- Eine ausdrücklich neutrale Fläche wählt und verschiebt das zugrunde liegende Canvasobjekt.
- Klick und Drag werden über eine gemeinsame Bewegungsschwelle getrennt; ein Drag löst anschließend keine Medienaktion aus.
- Rechtsklick auf der neutralen Fläche öffnet das vorhandene Canvas-Kontextmenü.
- `Ctrl` beziehungsweise `⌘` plus Trackpad-/Mausradbewegung verwendet über projizierten Medien denselben Canvas-Zoompfad wie auf freier Fläche.
- Die Browserkürzel `⌘/Strg +`, `⌘/Strg −` und `⌘/Strg 0` dürfen bei einer eindeutig ausgewählten registrierten App deren gespeicherten Inhaltszoom erhöhen, verringern beziehungsweise auf `100 %` setzen. Die Erkennung berücksichtigt neben dem ausgegebenen Zeichen die layoutstabile physische Plus-Taste (`BracketRight` auf dem deutschen Mac-Layout) und den Ziffernblock. Liegt der Tastaturfokus im Anbieterframe, reicht ausschließlich dessen registrierte Bridge dieselbe Absicht an den konkreten App-Träger weiter. Ohne eindeutiges App-Ziel werden die Kürzel nicht von Tafelraum übernommen.
- Nicht scrollbare, feste Medienflächen dürfen unmodifizierte Zwei-Finger-Bewegungen an Canvas-Pan weitergeben.
- Scrollbares lokales HTML und eine ausdrücklich registrierte Unterrichts-App behalten unmodifizierte Rad-/Trackpadbewegungen im Frame, solange ein innerer Scrollbereich in der Gestenrichtung noch bewegt werden kann. Am jeweiligen Rand oder bei nicht scrollbarem Inhalt reicht ihre jeweilige Bridge dieselbe Geste an den vorhandenen Canvas-Panpfad weiter, damit der Zeiger nicht im Iframe gefangen bleibt. Das Tafelraumobjekt wird über den äußeren Auswahlgriff verschoben (registrierte Apps verwenden dieselben äußeren Auswahlcontrols). Im Handmodus reicht der Bridge-Pfad zusätzlich einen Pointerdrag auf neutralem Inhaltshintergrund als Kamerabewegung an den Canvas weiter. Beliebige fremde Websites bleiben ausgeschlossen.
- Bei aktivem Zeichen-, Radierer- oder Textwerkzeug gibt lokales HTML seine gesamte sichtbare Trefferfläche an den nativen Canvas ab. Neu dort erzeugte Stift-, Marker- und freie Textannotation verwendet den bestehenden Materialverbund: Die Griffleiste bewegt Träger, Abdeckung und Annotation gemeinsam; eine direkt ausgewählte Annotation bleibt innerhalb dieses Verbunds unabhängig verschiebbar. Für den Dokument-Scroll speichert das Annotationselement einmalig den beim Erzeugen aktiven, materialgebundenen Scrollanker; der aktuelle Scrollstand bleibt flüchtiger Framezustand und verschiebt ausschließlich die abgeleitete SVG-Projektion. Dadurch bleibt das Canvasobjekt die einzige Geometrie- und Persistenzwahrheit. Ein direkter Klick auf eine projizierte Annotation fokussiert anschließend den Canvas, sodass dessen vorhandene Rücktaste-/Entf-, Undo- und Redologik greift; Enter bleibt nicht destruktiv. Auswahl stellt die vollständige direkte HTML-Interaktion her. Im Handmodus behalten native Controls, Links, Formularfelder, `draggable`-Flächen, passende ARIA-Controls und ausdrücklich mit `data-tafelraum-interactive` markierte eigene Pointerflächen die Eingabehoheit des Frames; nur der übrige neutrale Hintergrund dient dem Canvas-Pan.
- Anbietercontrols innerhalb eines fremden Frames bleiben nur in den ausdrücklich freigegebenen Zonen direkt bedienbar. Diese Zonen müssen die realen Trefferflächen des Anbieters vollständig umfassen, insbesondere responsive obere Controls sowie die über eine sichtbare untere Leiste hinausragenden Trefferflächen von Zeitleiste und Vollbild, und bei den festgelegten Zoomstufen praktisch geprüft werden. Eine transparente Vollflächenabdeckung darf nicht gleichzeitig Drag und fremde Interaktion vortäuschen.
- Wiedergabe-, Hover-, Fokus-, Filter- und Aktivierungszustände bleiben flüchtige UI-Zustände, solange keine eigene Produktentscheidung sie fachlich persistiert.

## Sicherheitsvertrag für fremdes HTML

- Nur validierte `https`-Quellen oder ausdrücklich gespeicherte lokale HTML-Artefakte kommen infrage.
- Fremdes HTML wird nie direkt in den App-DOM injiziert.
- Sandbox, erlaubte Berechtigungen, Referrer-Regel und Kommunikationskanal werden pro Renderer explizit festgelegt.
- `X-Frame-Options`- oder CSP-Blockaden werden als echter Ladefehler gezeigt. Tafelraum darf keine funktionierende Einbettung vortäuschen.
- Der Frame erhält weder Unterrichtsarchivpfade noch App-Geheimnisse oder mehr Berechtigungen als für den konkreten Inhalt nötig.
- Lokale HTML-Pakete laufen mit `sandbox="allow-scripts"` ohne `allow-same-origin`, `no-referrer`, gesperrten Geräteberechtigungen und einer CSP mit `default-src 'none'`; Netzverbindungen, Frames, Formulare, Objekte und externe Assets bleiben gesperrt. Lokale Paketassets sowie Inline-Code sind nur innerhalb dieses opaken Sandbox-Ursprungs erlaubt.
- Registrierte Apps erhalten nur die für ihren realen Flow erforderlichen Sandboxrechte. Lerndeck verwendet Skripte, Same-Origin, Formulare, Downloads, Popups und `clipboard-write`, aber keine Kamera-, Mikrofon- oder Standortfreigabe; Referrer bleibt `no-referrer`. Lerndeck erlaubt den Frame zusätzlich selbst per enger CSP-`frame-ancestors`-Liste.
- Authentifizierung bleibt vollständig beim Anbieter. Für Lerndeck verwendet der eingebettete Modus ein eigenes `HttpOnly`-, `Secure`-, `SameSite=None`- und partitioniertes Sitzungscookie; Tafelraum empfängt oder speichert weder Passwort noch Token.
- `postMessage`-Nachrichten einer App werden nur vom konkreten Framefenster und dessen registrierter Origin akzeptiert. Erlaubt sind ausschließlich die dokumentierten Bereitschafts-, Pan-, Canvaszoom- und App-Inhaltszoom-Nachrichten; letztere tragen zusätzlich die registrierte App-ID und genau eine der Aktionen `increase`, `decrease` oder `reset`.

## Pflichtprüfung vor Freigabe

Ein neuer Renderer ist erst bereit, wenn mindestens Folgendes geprüft ist:

- Zoom bei ungefähr `10 %`, `50 %`, `100 %`, `160 %` und `300 %`;
- keine wachsenden Symbole, Zeiten oder Abstände beim Herauszoomen;
- keine unscharfe künstliche Hochskalierung beim Hineinzoomen;
- keine helle Ecke, doppelte Kontur, Enginebeschriftung oder zurückbleibende Schattenkarte;
- unveränderte Position beim Rein- und Rauszoomen sowie nach Pan, Rotation und Größenänderung;
- erster Klick auf Controls, Drag auf neutraler Fläche und sichere Klick-/Drag-Trennung;
- Trackpad-Pan und modifizierter Zoom entsprechend dem Medientyp;
- Auswahl, Fokusübergabe, Rücktaste/Entf, Kontextmenü, Undo/Redo, Reload, Hell/Dunkel und Stundenwechsel; bei scrollbarem lokalem HTML zusätzlich stabile Bindung einer Annotation an ihre Dokumentstelle beim Vor- und Zurückscrollen;
- Materialverwendung wird aus lebenden Canvasobjekten und Provenienz abgeleitet, nicht separat gespeichert;
- bei fremden Frames zusätzlich erlaubte Quelle, blockierte Quelle, Sandbox und Fehlerzustand;
- Touch und Stift werden erst nach einem Test auf der Zielhardware als bestätigt bezeichnet.

Automatisierte Geometrie- und Gestentests ersetzen die Browserprüfung nicht. Ein Screenshot ersetzt weder Interaktions- noch Hardwareprüfung.

## Aktueller Stand

- **Bilder und PDF-Seiten:** nativer Rasterpfad; keine interaktive DOM-Projektion. Scanner-PDFs müssen mit den mitgelieferten PDF.js-Decodern vollständig einschließlich separater Schwarzweißmasken gerendert werden. Die optionale Aktion `Scan optimieren` darf ausschließlich ein abgeleitetes Rasterasset am vorhandenen Canvasobjekt wählen; Originaldatei, Geometrie, Crop, Annotationen und Archivprovenienz bleiben erhalten. Original und aktuelle Fassung werden gemeinsam über denselben vorhandenen Assetpfad persistiert und kopiert; es entsteht weder zweite fachliche Quelle noch eigener Renderer.
- **Bildkopie zwischen Stunden:** Die App speichert die ursprüngliche Bild- oder PDF-Datei im Materialarchiv der Zielstunde. Ohne zuordenbares Original verwendet sie das eingebettete Ausgangsraster. Alle vom Bildobjekt referenzierten Renditionen werden über den bestehenden Assetpfad der Zielstunde gespeichert. Erst danach fügt der native Canvas das bearbeitbare Objekt mit Provenienz der Zielstunde ein. Eine Kopie innerhalb derselben Stunde nutzt die vorhandenen Dateien.
- **Audio:** eigene React/HTML-Projektion über transparenter Canvasgeometrie; feste Innengeometrie `460 × 88`, vollständig gemeinsame Skalierung.
- **Lokales Video:** MP4-Stundenoriginal plus eigene React/HTML-Projektion über transparenter Canvasgeometrie; feste 16:9-Innengeometrie `640 × 360`, eigene Controls, gestreamter Upload und gestreamte Byte-Range-Auslieferung. Wiedergabe und Medienwerte bleiben flüchtig. D-205/D-245 zeigen das Medium zusätzlich in Room Canvas stumm, als Materialansicht oder innerhalb eines Ausschnittclips. Play, Pause und Position kommen ausschließlich vom Lehrerplayer. Temporäres Video-Vollbild verändert weder die gespeicherte Clipfolge noch den laufenden Lehrerplayer; beim Verlassen wird das unveränderte Basisziel erneut projiziert. Remote Canvas zeigt weiterhin nur den nicht unterstützten Platzhalter.
- **YouTube:** externer Privacy-Enhanced-Iframe über transparenter Canvasgeometrie; schärfeerhaltende Hybridprojektion und begrenzte direkte Anbieterzonen oben und unten einschließlich responsiver Controls, vollständiger Zeitleisten-Trefferfläche. D-245 ersetzt den Anbieter-Vollbildknopf durch denselben Tafelraum-Knopf wie beim lokalen Video; der unveränderte Iframe füllt dessen Fullscreen-Container. D-205 verwendet im Room-Fenster dieselbe validierte Video-ID in einem stummen zweiten Player; unterschiedliche Netzpufferung verhindert eine Zusage bildgenauer Synchronität.
- **Gewöhnliche Weblinks:** kanonischer Eintrag in `material/links.json` plus nativer Canvas-Textlink mit Archivprovenienz; keine Websiteprojektion und kein Iframe.
- **Lokale HTML-Artefakte:** manifestierter Stundenpaketslice umgesetzt; stabile innere Layoutfläche mit gemeinsamem Canvasmaßstab, randlose paketinterne Bildschirmoberfläche innerhalb der gemeinsamen gerundeten Materialkante, gespeicherter manueller Inhaltszoom, nur bei Auswahl eingeblendeter äußerer Verschiebegriff mit Inhaltszoom, direkter Inhalt und lokale Scrollhoheit. Eine optionale Manifestfähigkeit deklariert eine isoliert geladene A4-Druckvorlage; sie bestimmt zugleich die vollständige Hoch- oder Querformatproportion des Materialframes auf dem Lehrercanvas. Ohne diese Fähigkeit erscheinen weder Druckaktion noch Papierformatzwang. Die Druckvorlage wird frisch und skriptfrei aufbereitet. Chromium darf dafür eine kurzlebige Druckansicht öffnen; die native Mac-App projiziert sie nur für das Druckmedium in das bestehende Hauptdokument und ruft den Systemdialog über die kleine native Druckfreigabe auf. Der laufende Canvas und seine Material-Iframes bleiben in beiden Fällen unverändert. Semantischer Instanzzustand wird lokal standardmäßig im Stunden-Snapshot gehalten. Schaltet die Lehrkraft dies bewusst aus, bleiben Änderungen nur bis zum Verlassen der Stunde erhalten und lösen bei echter Abweichung vom Startzustand eine Verlustwarnung aus. Live-Pakete mit `live.state = v1` synchronisieren denselben validierten Fachzustand über D-124/D-133 und bleiben restriktiv ausgeliefert.
- **Unterrichts-Apps:** feste Entwickler-Registry und Lerndeck-Pilot umgesetzt. Apps sind stundenunabhängige Quellen, werden aber als persistierbare Canvasgeometrie mit rahmenloser abgerundeter Inhaltsfläche, äußeren Auswahlcontrols, Zentrieren, Fokus, Abdeckung, Annotationen und einem separaten Inhaltszoom von `50 %` bis `200 %` platziert. Dessen sichtbare Controls und die Browserkürzel `⌘/Strg +`, `⌘/Strg −`, `⌘/Strg 0` führen auf denselben gespeicherten Wert. App-Zustand und Login gehören dem Anbieter; Drucken, HTML-State-Speichern/-Zurücksetzen und Live Canvas sind ausgeschlossen.
- **Allgemeine Websites:** weiterhin nicht freigeschaltet. Freie URL-Eingabe, App-Installation durch Lehrkräfte und ein universeller Iframe-Renderer bleiben ausgeschlossen.

## Verbotene Abkürzungen

- kein sichtbarer `srcdoc`-/Engine-Embed für einen interaktiven Player;
- kein Base64-Original oder vollständiges HTML im Lesson-/Canvasdokument;
- keine zweite Positions-, Größen- oder Verwendungswahrheit im React-State;
- keine CSS-Mindestskalierung, die nur Teile des Inhalts vor dem Canvaszoom schützt;
- kein allgemeiner `iframe`-Materialtyp ohne validierten Provider- oder HTML-Vertrag;
- kein globales Wheel-/Pointer-Hijacking, das scrollbare Inhalte unbedienbar macht;
- kein neuer Renderer ohne denselben Canvas-Port-, Provenienz- und Reloadpfad.

**D-250:** Bei lokalem HTML ist die bisherige Titelzone transparenter Außenraum. Dokumentursprung, Annotationen und persistierte Trägergeometrie bleiben stabil. Die Auswahlsteuerung liegt rechts oberhalb des sichtbaren Blatts und gehört nicht zur öffentlichen Room-/Remote-Projektion. Im Auswahlwerkzeug wählt der erste Klick ein unmarkiertes Blatt über den vorhandenen Materialgestenpfad; nach Auswahl sind HTML-Eingaben direkt verfügbar. Handmodus behält die bestehende Scroll-/Panhoheit.

**D-251 ersetzt D-250s oberen Geometrierest:** Lokales HTML verwendet Inhaltsgeometrie ohne Titelzone. `interactiveHtmlFrameLayout = content` kennzeichnet den bereits umgestellten Träger. Der Adapter normalisiert Legacy-Geometrie rotationsgerecht und idempotent, einschließlich Abdeckungen und Memory; Dokumentpunkte und native Annotationen bleiben ortsfest. Lehrer und Room leiten daraus Auswahl, Inhalt, Clipprojektion und äußere Controls ab. Keine separate Auswahlbox oder Enginekorrektur.

### Lokale HTML-Blattkante und Scrollleisten (D-253)

Die vorhandene Sichtfläche begrenzt auch die native Scrollleistendarstellung auf die gerundete Blattgeometrie. Lokale HTML-Auslieferung ergänzt frühes, ausschließlich bildschirmwirksames Scrollbar-CSS; native Scrollposition, Mausradweitergabe und Room-Synchronisierung bleiben im bestehenden Vertrag. Ein niedrig priorisiertes helles Dokumentfarbschema verhindert die Übernahme der dunklen App-Chrome, erlaubt aber explizite Paket-Farbschemata. Keine Paketdatei-/Druckänderung und keine zusätzliche Scrollengine.

### Auswahlgesten auf freiem HTML-Hintergrund (D-254)

Lokales HTML meldet in der Lehrerauswahl freie Hintergrundgesten über einen validierten flüchtigen Material-Move-Vertrag an seinen eigenen Host. Der Host verwendet denselben nativen Materialverbund-/Undo-Pfad wie projizierte Medien. Tatsächlich getroffene Textzeichen, Eingaben, semantische/markierte Interaktionen und Scrollleisten bleiben im Dokument, auch vor Materialauswahl. Apps und Room behalten ihre bisherigen Eingabepfade. Die native Vorschau wird nach Excalidraws bestehendem API-Vertrag synchron auf ihre Startobjekte zurückgesetzt und einmal bestätigt; dadurch entsteht genau ein rücknehmbarer Geometrieeintrag, kein zusätzlicher Verlauf oder Speicherzustand.

### Lokale Room-Schreibposition (D-255)

Die flüchtige Lehrer-Textpräsenz enthält zusätzlich validierte UTF-16-Auswahloffsets. Room vermisst diese an seiner eigenen Eingabe-/Schriftgeometrie; normierte Lehrerrechtecke bleiben nur als kompatibler Altbericht erhalten. Nur ein ruhendes Feld darf für die sichtbare Schreibposition innen scrollen. Eigener Room-Fokus, DOM-Auswahl und Dokumentscroll bleiben fensterlokal; Auswahl-/Fokusdaten gelangen weder in das Archiv noch in Remote Canvas.

### Passive Archivvorschau (D-256)

Die flüchtige HTML-Vorschau verwendet bevorzugt die deklarierte Druckvorlage, sonst das Paket-Entry an dessen Ausgangsbreite. Die bestehende skriptfreie Druckaufbereitung entfernt Paketskripte, Handler, Fremdframes, Autofokus und Autoplay und löst lokale Assetadressen auf. Die Vorschau bleibt opak (`sandbox="allow-scripts"`, ohne `allow-same-origin`); ausschließlich ein noncefreigegebenes Tafelraum-Messskript meldet nach Laden der Assets und Fonts die Dokumentmaße. Der Parent akzeptiert nur begrenzte Maße seiner eigenen Vorschauinstanz. CSP erlaubt Styles, Bilder und Fonts ausschließlich aus diesem Paket sowie Inline-Styles und Datenbilder, keine Fachzustandsbridge, Netzwerkverbindungen oder Wiedergabe. Die Vorschau führt keine paketinternen JavaScript-Aufbauten aus; eine rein skripterzeugte Oberfläche benötigt für eine inhaltliche Vorschau eine statische Vorlage. Kein Capture, neuer Archivstand oder Druckdialog.

### Gemeinsame Papierseiten (D-259)

`print.layout = shared-pages` verwendet denselben Einstieg und explizite `data-tafelraum-page`-Abschnitte für interaktiven Bildschirm und Papier. Ein neuer Träger hält `interactiveHtmlPageOrientation`; der feste innere A4-Viewport und sein Maßstab werden aus seiner vorhandenen nativen Geometrie abgeleitet. Eine Seite ist zunächst vollständig sichtbar, weitere Seiten scrollen. Größenänderung des äußeren Objekts löst kein responsives Reflow aus; Ecke unten rechts skaliert den gesamten Materialverbund proportional. Davon unabhängig dürfen digitale Antwortfelder vertikal wachsen und innen scrollen. Der Bildschirmabschnitt darf über seine anfängliche A4-Höhe hinaus wachsen, damit Folgeaufgaben und weitere Seiten nicht überlappen. Die frische Druckvorlage behält ihre ursprünglichen Schreibräume und Seitenumbrüche. Room nutzt dieselbe Layout- und Größenberechnung; eigene Eingabe und Scrollhoheit bleiben bestehen. Native Auswahl-/Undo- und gespeicherte Source-/Annotationsdaten bleiben maßgeblich. Allgemeine Canvas-/Room-Objektmathematik ist gemeinsam in `material-transform.ts`, kein zusätzlicher Room-Renderer.

Diese Opt-in-Fähigkeit setzt die gemeinsame Seitenvorlage voraus; eine frühere responsive Oberfläche wird nicht anhand ihrer Druckfähigkeit automatisch umgebrochen. Bestands-Entries müssen bei der Vorlagenumstellung erhalten bleiben. Die Material-Metadaten erst nach einer unterstützenden App-Version umschalten. Remote ist für diese neue Seitenfähigkeit noch nicht abgenommen; daraus keine neue Remote-Freigabe ableiten. Bildschirm-/Papierabstände gehören der Vorlage, nicht dem Canvas. Muster für das gemeinsame Seitenbox-/Fragmentmodell: `.agents/skills/tafelraum-interactive-html/shared-pages.css`.


**D-288 (27.10.2026, noch nicht nativ ausgeliefert):** Deklarierte lokale HTML-Materialien können eine begrenzte Satzprüfung des vorhandenen Video-Lab-Diensts über eine quellgebundene Lehrer-/Room-Brücke anfordern. Kein freier Netzzugang des Pakets, Schlüssel oder allgemeiner KI-Prompt. `sentenceCheck` ist eine unabhängige optionale Fähigkeit, keine neue Materialklasse. Nicht im Remote Canvas. [Vertrag/Betrieb](44_LANGUAGE_BITES_SENTENCE_CHECK_TEST.md).

## Persönlicher direkter Satzprüfer – D-289

`sentenceCheck: {protocol: "tafelraum-v1", projectId: "words-in-context-01"}`
verwendet dieselbe isolierte Framebrücke und lokale Satzroute. Ausschließlich die
sechs appseitig freigegebenen Word-Families-Aufgaben; Browserdaten werden mit
kanonischen Wortart-/Formregeln verglichen. Providerkern/Modell/Prompt bleiben
Hostcode, persönlicher Schlüssel bleibt im macOS-Schlüsselbund. Einstellungen
liefern nur Präsenz und erlauben explizites Speichern/Entfernen. Kein Key im
Paket, Archiv, Browserstore oder Update, keine freie Netz-API. `connect-src 'none'`
und Remote-Ausschluss unverändert. Kein laufendes Video Lab erforderlich;
Internet wird nur für explizite Satzchecks benötigt. Der alte `video-lab-v1`-Weg
bleibt separat kompatibel, wird nicht automatisch gewählt. Prüfstand44 enthält
Betrieb, Entwicklungs-/Aktivierungsgrenzen und Tests.

D-289 präzisiert den **KI-Anschluss** als gemeinsame persönliche Schlüsselverwaltung
für freigegebene Hostfunktionen. Künftige HTML-Embeds/Widgets verwenden denselben
Key ausschließlich mittelbar über einzeln implementierte, validierende Fähigkeiten;
kein Credentialzugriff und keine freie Netz-/Provider-API. Bisher ist nur die
Satzprüfung angeschlossen. Der Erweiterungsvertrag steht in Dokument04 unter
„Gemeinsamer persönlicher KI-Anschluss“; Sandbox/Remote-Grenzen bleiben erhalten.


### Registrierte App im lokalen Room (Entwicklung28.10.2026)

Lerndeck verwendet im Room dieselbe lokale Materialprojektion und Clipgeometrie
wie HTML, mit einer anbietergebundenen, lesenden visuellen Ausgabe statt zweiter
Appinstanz. Die optionale lokale `roomAppChannel`-Capabilty wird nur in der
Room-Projektion erzeugt und niemals als Canvasfeld oder Remote-Wire versendet.
`embedded-app-mirror.ts` hält begrenzte flüchtige Baseline/Ereignisse, Leases,
Sequenz/Quelle und Widerruf; `AppMirrorSurface` rendert mit rrweb2.2.0 in dessen
skriptgesperrtem Frame. 2MiB je Paket,8MiB/6000 Ereignisse laufender Puffer,
höchstens4 lokale Empfänger; Capture nur mit Empfängerlease. Anbieterbilder
bleiben referenziert (`inlineImages:false`), damit versteckte/preloadete Bilder
nicht als zusätzliche Base64-Originalpixel die Paketquote sprengen. Keine
Übertragung von Cookies oder zweiter Anbieterlogin. Passwort-/Hidden-
felder vor Sendung maskiert/blockiert, keine Cookies/Tokens/Provider-API.
Room bleibt lesend für Appbedienung; native Annotationen/Abdeckungen werden weiter
über die vorhandene öffentliche Geometrie projiziert. Remote bleibt ausgeschlossen.

**D-293:** Ausdrücklich deklarierte `playback.teacherView: "shared"` zeigt interaktive HTML-Inhalte auf Lehrerfläche und Room. Eine hörbare Room-Ausgabe, stumme statusgeführte Lehreransicht und derselbe semantische Zustandsweg. Bestehende reduzierte HTML-Filmsteuerung bleibt Standard. Vollständiger Vertrag in Dokument04.

**D-295 löst die bisherigen Lehrer-/Room-Ausnahmen ab:** Lokales HTML bleibt immer vollständig bedienbar auf beiden Flächen, einschließlich programmierter Animationen. Playback verwendet automatisch die gemeinsame Brücke; alte Controllerdateien ersetzen keinen Inhalt. Nur angehängte native MP4-/YouTube-Objekte haben im Room-Modus Fernsteuerungscontrols am Lehrer und einen hörbaren Room-Player. Zustands-/Lease-/Sequenzdetails stehen aktuell in Dokument04.
