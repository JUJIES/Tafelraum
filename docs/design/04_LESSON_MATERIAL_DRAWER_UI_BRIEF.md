# UI Brief – unterrichtsgebundener Materialbereich

**Stand:** 3. Oktober 2026
**Status:** verbindlich für den kleinen lokalen Material-Übergangsslice

**D-303 (29. Oktober 2026):** Beim Stundenwechsel gehören Liste, Vorschau,
Dialoge und laufende UI-Aktionen ausschließlich zu ihrer jeweiligen Lesson-ID.
Bis die neue Liste geladen ist, erscheint der vorhandene Zustand `Material wird
geladen`; alte Zeilen und ihre Aktionen sind nicht mehr erreichbar. Auch eine
spät abgeschlossene Entfernung mit anschließendem Nachladen darf die neue Liste
nicht ersetzen. Nachladen innerhalb derselben Stunde behält den bestehenden Flow.
Keine neue Bedienfläche, Änderung von Materialpfaden oder Canvas-Provenienz.

**D-272:** `.docx` darf über den bestehenden Geräte-/Dropimport eingehen. Während der lokalen Konvertierung `Word wird umgewandelt …`; danach ein gewöhnliches PDF-Material, keine zusätzliche Wordzeile oder Editoroberfläche. Quelle bleibt neben PDF in der Stundenbasis. Siehe UI-Brief 26.

## Kontext

**Unveröffentlichter Entwicklungspilot D-266:** Bei eingerichteter persönlicher Empfangskonfiguration ergänzt eine eigene sekundäre Footerzeile `Handy verbinden`. Der QR-Dialog, die feste Zielstunde und Empfangsgrenzen stehen in [UI Brief 23](23_MOBILE_CAPTURE_UI_BRIEF.md). Eingehende Aufnahmen aktualisieren nur den Materialbestand; Plus/Canvas/Präsentation behalten ihre bestehende Bedeutung. Ohne Konfiguration erscheint kein deaktivierter Einstieg.

- **Oberfläche/Zustand:** bestehende Surface-Lab-Arbeitsfläche mit geöffnetem, kontextuellem Materialbereich
- **Zielnutzer:** Lehrkraft bei der Vorbereitung einer konkreten Unterrichtsstunde am Mac
- **Nutzungssituation:** Codex oder die Lehrkraft hat Bilder, PDFs, Audio, MP4-Video, Links oder interaktive Pakete bereits im Materialordner der konkreten Stunde abgelegt oder ergänzt Material per Dateiauswahl, Drag-and-drop beziehungsweise Systemzwischenablage; die Stunde kann noch einen leeren Canvas besitzen
- **Eine primäre Handlung:** den vollständigen Materialbestand der aktiven Stunde überblicken, bereits auf der Fläche verwendetes Material sofort erkennen und Material an der gewünschten Stelle platzieren
- **Eine zu prüfende Designfrage:** Bleibt eine vollständige, kompakte Liste auch bei sichtbarer Canvasverwendung ruhig und unmittelbar verständlich, ohne eine zweite Materialverwaltung oder einen separat gespeicherten Verwendungsstatus vorzutäuschen?

Die Desktopablage bleibt rechts verankert, spannt sich aber nicht über die volle Arbeitsflächenhöhe. Sie ist höchstens 584 Pixel hoch, hält mindestens 42 Pixel Abstand zur oberen Canvas-Kante und sitzt auf höheren Arbeitsflächen vertikal mittig im verfügbaren rechten Bereich. Bei geringerem Platz oder einer realen Toolbar-/Verlaufskollision schrumpft ihre Höhe; Kopf und Importaktionen bleiben stehen, während ausschließlich die Materialliste intern scrollt.

Die Ablage und die optionale Schüler-/Raumvorschau verwenden dieselben semantischen Theme-Farben, Rahmen, Rundung und Kopfzeilenhierarchie. Die Vorschau färbt nur ihren eigentlichen Bildschirm nach der veröffentlichten Canvasfläche; ihre Bedienelemente bleiben Teil der Lehreroberfläche.

Undo und Redo behalten beim Öffnen der tiefer sitzenden Ablage ihre obere rechte Canvasposition, solange beide gemessenen Flächen getrennt bleiben. Nur bei einer tatsächlichen Überlagerung wechseln sie mit 12 Pixel Abstand links neben die Ablage; fehlt auch dafür der sichere Platz, beginnt die Ablage unterhalb der Verlaufsgruppe.

## Scope

### Muss sichtbar oder erreichbar sein

- der bestehende Toolbar-Einstieg `Material hinzufügen` öffnet und schließt einen kompakten Materialbereich; die Ablage blendet mit einer kurzen ruhigen Opazitäts- und Positionsbewegung von ihrer rechten Verankerung ein und aus, wird beim Schließen sofort nicht-interaktiv und gibt ihren Layoutplatz erst nach der Ausblendung frei; schnelle Wiederöffnung bricht das Ausblenden ohne Zwischenzustand ab, reduzierte Systembewegung wechselt direkt;
- ausschließlich Dateien aus der `materialBasis` der aktiven Stunde; neue Stunden erhalten immer `stunden/<lesson-id>/material/`;
- der Stundentitel steht direkt unter `Material`, sodass ein Stundenwechsel auch bei ähnlichem Dateibestand eindeutig erkennbar ist; noch nicht fachlich getrennte Altimporte tragen stattdessen sichtbar den Präfix `Reihenmaterial ·`;
- Bild-, PDF- und browserfähige Audiodateien mit eindeutigem Dateinamen und Herkunftsordner, lokale interaktive HTML-Pakete sowie gespeicherte `http`-/`https`-Links; Name, Herkunft beziehungsweise Linkziel bleiben die primäre Identifikation;
- alle Materialien der aktiven Stundenbasis bleiben sichtbar; `Im Canvas ✓` zeigt die abgeleitete Verwendung ohne Auswahlfläche. Nur tatsächlich fokussiertes Material erhält eine Akzentmarkierung, unabhängig davon, ob der Fokus über Archivzeile oder Canvas-Zielaktion gestartet wurde;
- kompakte Zeilen mit kleinem Bildthumbnail beziehungsweise PDF-/Audio-/Link-Icon und einer ruhigen direkten Plus-Aktion;
- `Vom Gerät` und `Link hinzufügen` stehen als zentrierte sekundäre Aktionsgruppe in einer festen Fußzone unter der scrollbaren Materialliste; `Link hinzufügen` öffnet direkt darüber im selben räumlichen Zusammenhang eine einzelne Eingabezeile `Link einfügen`; `Hinzufügen` speichert einen gültigen `http`-/`https`-Link in der aktiven Stundenbasis und platziert ihn ohne Dialog; YouTube wird zum bestehenden Player, andere Ziele zu einem nativen Canvas-Textlink und nie ungeprüft zu einem Website-Embed;
- eine alleinstehende `http`-/`https`-URL aus der Systemzwischenablage bietet denselben direkten Speichern-und-Platzieren-Pfad ohne geöffneten Materialbereich; Paste in einer Texteingabe bleibt normaler Text-Paste;
- auf Desktop-Maus beziehungsweise Tastaturfokus darf eine einzelne größere, nicht interaktive Hovervorschau außerhalb der Liste erscheinen; sie belegt keinen dauerhaften Platz und ist keine Voraussetzung für die Bedienung;
- `Auf Fläche` bleibt der zugängliche Name der Plus-Aktion und platziert Bilder, gerenderte PDF-Seiten, Audio, interaktives HTML, YouTube oder einen nativen Weblink in der Mitte des sichtbaren Canvas;
- der Audio-Player verwendet dieselben ruhigen semantischen Flächen und den sparsamen Akzent wie die Shell; Play/Pause, Zehn-Sekunden-Sprünge und Einstellungen verwenden Lucide-Symbole statt Unicode- oder nativer Browserzeichen, während Zeitleiste und Auswahlfelder visuell in dieselbe Controlsprache eingebunden sind; seine kompakte Oberfläche besitzt genau eine mäßig gerundete, rahmenlose Canvas-Kontur auf einer leicht vom Canvas abgesetzten semantischen Fläche; Excalidraw hält dafür ausschließlich ein transparentes natives Geometrieobjekt, während ein React/HTML-Overlay eine feste innere Geometrie von `460 × 88` als einzige oben links am Viewportrahmen verankerte und gemeinsam transformierte Einheit mit dem Canvaszoom skaliert; Titel und Zeit werden deshalb auch in extrem kleinen oder seitlich schmalen Zuständen niemals neu gegeneinander umbrochen oder unabhängig vergrößert, und die Oberfläche bleibt beim Hinein- wie Herauszoomen deckungsgleich mit Geometrie und Schatten; die Skalierung folgt ohne künstliche Mindeststufe dem tatsächlichen Elementrahmen, damit Zeit, Titel, Controls, Symbole und Abstände nie unabhängig voneinander ihre Proportionen verändern oder aus der Playerfläche laufen; eine Engine-Haarlinie, ein zusätzlicher Ring, eine helle eckige Einbettungsfläche oder zusätzlich abgerundete innere Karte erscheint nicht; der vorhandene abschaltbare `Materialschatten` darf wie bei Rastermaterial ausschließlich am äußeren Viewportrahmen wirken; beim Öffnen ersetzen Lautstärke und Geschwindigkeit Titel sowie Zeitleiste innerhalb derselben unverändert hohen Fläche, statt eine zweite Einstellungszeile anzuhängen;
- der lokale MP4-Player verwendet dieselbe ruhige Icon-, Flächen- und Akzentsprache in einer festen `640 × 360`-Innengeometrie. Die Videofläche bleibt dominant; ein zentraler Playbutton und eine einzelne untere Verlaufsebene tragen Play/Pause, Zehn-Sekunden-Sprünge, gekürzten Dateinamen, Zeitleiste, Zeit, Lautstärke und Vollbild. Native Browsercontrols, zweite Karte und Wiedergabestatus im Canvas entfallen. Ein neutraler Drag auf der Videofläche bewegt den Materialverbund, während Controls beim ersten Klick reagieren. Auswahl verwendet wie YouTube Zentrieren, Fokus und Abdeckung; große Dateien werden beim Upload und bei Byte-Ranges gestreamt;
- die Player-Controls reagieren am Desktop beim ersten Klick unabhängig vom aktiven Canvaswerkzeug oder einer vorherigen Objektselektion; die neutrale Titelzone bleibt weiterhin als Auswahl- und Verschiebefläche des Canvasobjekts erhalten;
- der YouTube-Player bleibt ein normales verschieb- und skalierbares Canvasmaterial; seine Videofläche bleibt auch nach Auswahl und während der Wiedergabe eine kombinierte Klick-/Dragzone: Ein Drag bewegt das Objekt ohne Wiedergabeaktion, ein kurzer Klick schaltet Play/Pause. Die schmale native Anbieter-Controlleiste am unteren Rand bleibt bei aktivem Player direkt bedienbar. Unterhalb von `100 %` behält der Iframe seine unskalierte innere Playergeometrie und wird einschließlich Video, Symbole, Zeit und Abständen als genau eine oben links verankerte Einheit heruntergerechnet; dadurch dürfen native Mindestgrößen nicht relativ zum Canvasobjekt anwachsen oder Inhalte überdecken. Ab `100 %` rendert der Iframe direkt in der tatsächlichen Viewportgröße und wird niemals künstlich hochskaliert. Bei Auswahl bietet der Player weiterhin die bildnahen Aktionen `Video zentrieren`, `Videofokus aktivieren` und `Abdeckung hinzufügen`;
- ein ausgewähltes lokales interaktives HTML-Material bietet analog ausschließlich `Interaktives Material zentrieren`, `Interaktives Material fokussieren` und `Abdeckung hinzufügen`; Drucken und Zuschneiden bleiben ausgeschlossen. Die Abdeckung ist ein persistierbares materialgebundenes Canvasobjekt: Eine Teilabdeckung verdeckt und sperrt ausschließlich ihr eigenes Rechteck, der übrige Fremdframe bleibt sichtbar und bedienbar; erst Vollabdeckung verbirgt und sperrt ihn vollständig. `Abdeckung entfernen` gibt denselben Frame wieder frei; Fokus und Zentrierung bleiben flüchtige Darstellungs- beziehungsweise Kameraaktionen;
- der Titelbalken eines lokalen interaktiven HTML-Materials enthält rechts den kompakten Inhaltszoom `−`, Prozentwert und `+`. Canvaszoom skaliert Rahmen, Titel, Schrift, Buttons, Bilder und Abstände stets gemeinsam, ohne den inneren responsiven Umbruch zu verändern. Der Inhaltszoom von `50 %` bis `200 %` verändert davon unabhängig den Maßstab innerhalb des vorhandenen Rahmens und wird als materialbezogener Darstellungsparameter am Canvasträger gespeichert; ein Klick auf den Prozentwert stellt `100 %` wieder her;
- `Ctrl` beziehungsweise `⌘` plus Trackpad-/Mausrad-Zoom bleibt über Audio-, lokalen Video- und YouTube-Flächen dieselbe Canvas-Kamerageste wie über freier Arbeitsfläche; eine unmodifizierte Zwei-Finger-Bewegung verschiebt dort entsprechend die Canvas-Kamera. Dafür routet die feste, selbst nicht scrollbare Medienprojektion beide Wheelvarianten an den bestehenden Canvas-Kamerapfad. Normale Klicks und Regler bleiben beim jeweiligen Medium; ein interaktiver Fremdframe wird für die Dauer des bereits gedrückten Zoommodifikators pointerdurchlässig. Die untere native YouTube-Controlleiste bleibt als echte Fremdframe-Fläche davon ausgenommen, damit ihre Anbietercontrols direkt bedienbar bleiben;
- auf dem Desktop kann dieselbe Materialkarte mit der Maus an eine konkrete Canvasposition gezogen werden;
- nach erfolgreicher Platzierung bleibt das Material sichtbar und wechselt unmittelbar in den abgeleiteten Verwendungszustand aus `Im Canvas ✓`; bei einem PDF genügt eine verbleibende gerenderte Seite, damit das PDF als verwendet gilt;
- sobald das letzte zugehörige Canvasobjekt gelöscht oder rückgängig gemacht wurde, entfällt die Zustandskennzeichnung unmittelbar; Redo stellt sie wieder her;
- die Plus-Aktion bleibt auch bei verwendetem Material erreichbar und darf bewusst eine weitere Canvasinstanz anlegen; ihr Tooltip lautet dann `Noch einmal auf Fläche`;
- `Vom Gerät`, Datei-Drop und externe Systemzwischenablage schreiben unterstützte Bilder, PDFs, Audio- und MP4-Dateien vor der Platzierung additiv in die Materialbasis der aktiven Stunde. Identische Bytes werden wiederverwendet; gleicher Name mit abweichendem Inhalt wird als Kopie erhalten. Das danach platzierte Canvasobjekt trägt sofort die Archivprovenienz;
- erneutes Öffnen, Stundenwechsel und Fensterfokus lesen den aktuellen Dateistand neu ein, damit extern durch Codex erzeugte Artefakte erscheinen;
- ein klarer Leer-, Lade- und Fehlerzustand ohne dauerhafte Bannerfläche.

### Darf nicht erscheinen

- globale Materialbibliothek, Suche, Tags, Uploadverwaltung oder Dateimanager;
- Videoeditor, Videoschnitt, Video-Download, weitere lokale Videocontainer, Office-Einbettung oder eine ungeprüfte beliebige Webseiten-/HTML-Ausführung in diesem Slice; ein eigener validierter Website-/HTML-Objektslice ist durch D-054 als Folgeschritt vorgesehen, aber nicht Teil dieser Materiallisteniteration;
- automatische Platzierung aller vorhandenen Materialien auf dem Canvas;
- Bearbeiten, Umbenennen und freie Dateiverwaltung; bestätigtes Entfernen eines Materialeintrags ist seit D-242 erlaubt;
- zweite Kopie der `materialBasis` in Browserstores oder Canvasmetadaten;
- dauerhafte große Vorschau, ausgewählte Materialkarte oder PDF-Viewer-Chrome im Materialbereich;
- zusätzlicher Verwendungsfilter `Alle`, `Nicht verwendet` oder `Verwendet`; die vollständige Liste und `Im Canvas ✓` beantworten den Verwendungsstatus ohne weitere Bedienebene;
- Vorschau- oder Filterzustand als fachlich persistierte Lesson-Daten;
- separat persistierter `verwendet`-Status; die Anzeige wird ausschließlich aus den nicht gelöschten Canvasobjekten abgeleitet.

## Exakter UI-Text

- `Material hinzufügen`
- `Material`
- `PDF`
- `Audio`
- `Vom Gerät`
- `Link hinzufügen`
- `Link einfügen`
- `Hinzufügen`
- `Linkeingabe schließen`
- `Auf Fläche`
- `Im Canvas ✓`
- `Noch einmal auf Fläche`
- `Fokus beenden`
- `Interaktives Material fokussieren`
- `Fokus für interaktives Material beenden`
- `Interaktiven Inhalt verkleinern`
- `Interaktiven Inhalt vergrößern`
- `Inhaltszoom auf 100 Prozent zurücksetzen`
- `Abdeckung hinzufügen`
- `Abdeckung entfernen`
- `Material wird geladen`
- `Noch kein Material`
- `Noch kein Material`
- `Material neu laden`
- `Material schließen`
- `Abspielen`
- `Pausieren`
- `Video abspielen oder verschieben`
- `Video pausieren oder verschieben`
- `10 Sekunden zurück`
- `10 Sekunden vor`
- `Wiedergabe einstellen`
- `Wiedergabeposition`
- `Lautstärke`
- `Abspielgeschwindigkeit`

Dateinamen und Ordnernamen sind reale Inhaltsdaten.

## Inhalt und Referenzen

- **Reale Inhalte/Assets:** in der installierten App `~/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv/`, in der Entwicklungsreferenz `data/unterrichtsarchiv/`, jeweils mit der im aktiven Katalogeintrag referenzierten `materialBasis`
- **Visuelle Referenz:** ruhige, kompakte Dateiliste und ein kleiner, nur einmal mäßig gerundeter Canvas-Player in der bestehenden Tafelraum-Sprache; Dateinamen und direkte Lucide-Aktionen statt Mediengalerie, Wellenform, Unicode-Steuerzeichen, nativem Browser-Chrome oder doppelter Kartenkontur
- **Relevanter Produktflow:** Codex legt ein Artefakt in `stunden/<lesson-id>/material/` ab oder die Lehrkraft ergänzt Datei beziehungsweise Link → Material wird dort kanonisch gespeichert → Materialbereich zeigt den vollständigen Bestand → auf Canvas platzieren → dieselbe Zeile zeigt `Im Canvas ✓` → nach Entfernen der letzten Instanz entfallen nur diese Kennzeichnungen

## Vergleich und Invarianten

- **Gezielt veränderte Variable:** Materialbereich geschlossen oder als schmale, überlagernde rechte Ablage geöffnet
- **Muss zwischen Varianten identisch bleiben:** Quelldateien, Lesson-Metadaten, Werkzeugzustand, Archivnavigation und Speicherlogik; Einfügen und Canvas-Löschen ändern nur Canvasobjekte; die getrennte, bestätigte Archiv-Entfernung entfernt Quelle und sämtliche davon abhängigen Canvasinstanzen (D-242)
- **Nicht durch Desktop oder Mockup validierbar:** Touch-Drag, große Materialbestände, Codec-Abdeckung jenseits der Browserunterstützung, YouTube-Verfügbarkeit bei Schulnetz-/Kontobeschränkungen und spätere Beelink-Persistenz

## Abnahme

- Bei einer Stunde mit `materialBasis` erscheinen vorhandene Bilder, PDFs, MP3, M4A, AAC, WAV, OGG/Opus, WebM-Audio, FLAC und MP4, interaktive HTML-Pakete sowie gespeicherte Web- und YouTube-Links ohne erneuten Datei-Dialog.
- Ein neues Artefakt wird nach erneutem Öffnen, Fokuswechsel oder `Material neu laden` sichtbar.
- Hover-/Fokusvorschau verändert weder Quelldatei noch Canvas; der Materialbereich benötigt keinen dauerhaften Auswahlzustand.
- `Auf Fläche` und Drop teilen denselben Materialeinstieg. Externe Bilder und PDFs werden zuerst als Stundenoriginale gespeichert und erzeugen anschließend die vorgesehenen Raster-Assets; Audio und lokales MP4 bleiben Originale in der Stundenbasis und erzeugen je ein transparentes persistierbares Canvas-Geometrieobjekt mit einer daraus abgeleiteten, scharf im Viewport gerenderten React/HTML-Oberfläche. YouTube verwendet denselben Geometrie-/Projektionsgrundsatz für seinen externen Anbieter-Player und speichert fachlich nur die kanonische URL in `material/links.json`, nie YouTube-Videobytes.
- `⌘/Strg+V` mit genau einer `http`-/`https`-URL auf dem Canvas speichert beziehungsweise verwendet den deduplizierten Linkeintrag und platziert YouTube als Player, andere Ziele als nativen Canvas-Textlink am letzten Canvas-Zeigerort, ersatzweise in der sichtbaren Mitte. Mehrzeiliger oder gewöhnlicher Text, interne Canvas-Zwischenablagedaten und Paste während einer Texteingabe werden nicht übernommen.
- Jedes neu importierte Canvasbild trägt den archivwurzelrelativen, damit reihenübergreifend eindeutigen Pfad seiner Quelle als Provenienz. Diese Referenz kopiert keine Quelldatei und ist keine zweite Materialbasis.
- Solange mindestens ein nicht gelöschtes Canvasbild, Audio-, interaktives HTML-, YouTube- oder natives Linkelement auf einen Archivpfad verweist, bleibt dessen Materialkarte bis zur ausdrücklichen Archiv-Entfernung sichtbar und zeigt `Im Canvas ✓`. Nach Löschen oder Undo des letzten Objekts entfällt der Zustand; Redo stellt ihn wieder her.
- Ältere Canvasbilder ohne Archivpfad werden nur bei eindeutigem Dateinamen als verwendet gekennzeichnet. Bei Namenskonflikten bleibt das Material ohne Kennzeichnung sichtbar, statt eine falsche Verwendung zu behaupten.
- Drop verwendet die sichtbare Mausposition, nach Duplikatbestätigung denselben ursprünglichen Drop-Ort. Plus fügt in die sichtbare Canvasmitte ein; Zeilenklick auf verwendetes Material navigiert zu einer vorhandenen Instanz.
- PDFs bleiben für dokumentartige Materialien die Originalquelle und werden erst beim Import seitenweise in Canvas-Renditions überführt. Bilder bleiben die Quelle für bereits gerasterte oder bewusst gestaltete Materialien; ähnlich benannte PDF- und Bildfassungen werden nicht automatisch als Dubletten behandelt.
- Bei ausgewählten Bildern und PDF-Seiten bietet die bestehende äußere Canvas-Aktionsreihe optional `Scan optimieren`. Die Materialliste selbst verändert keine Quelle und erhält dafür weder Regler noch zweiten Bearbeitungsschritt. Die Aktion erzeugt eine stundenlokale abgeleitete Rasterfassung; `Originaldarstellung verwenden`, Undo/Redo und Reload führen wieder sicher zum unveränderten Ausgangsasset.
- Der Audio-Player bietet Play/Pause, Wiedergabeposition, aktuelle und gesamte Zeit sowie Zehn-Sekunden-Sprünge direkt. Diese Controls reagieren auf den ersten Desktop-Klick auch aus Hand-, Auswahl- oder Zeichenwerkzeugen; die neutrale Titelzone bleibt zum Auswählen und Verschieben verfügbar. Lautstärke und Geschwindigkeit liegen in einer nachgeordneten Einstellung, die keine zweite Fläche und keine Höhenänderung erzeugt. Im Ruhezustand sind weder eine native Engine-Beschriftung noch eine harte Außenlinie sichtbar; der Player speichert keinen parallelen Wiedergabestatus im Lesson-Dokument.
- YouTube-Links werden aus `youtu.be`, `youtube.com/watch`, `shorts`, `live` und offiziellen Embed-URLs auf eine Video-ID normalisiert. Ein erneutes Hinzufügen desselben Videos verwendet denselben Linkeintrag. Andere gültige `http`-/`https`-Links werden anhand ihrer normalisierten URL dedupliziert und als native Canvaslinks, nicht als HTML, ausgeführt. Unsichere Protokolle werden lokal abgelehnt.
- Der YouTube-Player schaltet per kurzem Klick auf die Videofläche Play/Pause und lässt sich per Drag auf derselben Fläche vor wie nach Aktivierung, Auswahl und Wiedergabestart verschieben. Sobald die Drag-Schwelle überschritten wurde, wird der nachfolgende Klick sicher verworfen. Die native Anbieter-Controlleiste am unteren Rand bleibt im aktiven Zustand für Zeitleiste, Lautstärke, Einstellungen und Vollbild erreichbar. Beim Herauszoomen skalieren Playerbild, Symbole, Zeit, Controls und Abstände gemeinsam; bei `50 %` misst die innere Iframe-Geometrie weiterhin die Canvasgröße bei `100 %`, während ihre einzige Darstellungsskala exakt `0,5` beträgt. Beim Hineinzoomen besitzt die Darstellungsskala höchstens `1`, sodass der Iframe in der vergrößerten Viewportgröße neu rendert statt hochskaliert zu werden. Zentrieren und Fokus ändern nur die Kamera beziehungsweise Darstellung. Player und Abdeckung werden aus ihren nativen Canvasobjekten stabil in dieselbe DOM-Ebene projiziert. Bei vorhandener Abdeckung ist die Player-Bedienebene geschlossen; die sichtbare Teilfläche wählt und bewegt trotzdem den vollständigen Materialverbund. Beide Projektionen bleiben reine Darstellung; Zuschneiden und Drucken bleiben bildspezifisch.
- Ein ausgewähltes interaktives HTML-Material zeigt dieselben drei außerhalb liegenden Aktionen für Zentrieren, Fokus und Abdeckung wie YouTube. Eine vollständige Abdeckung verdeckt Titel und Inhalt, nimmt dem Iframe alle Pointerinteraktion und bleibt gemeinsam mit dem Material auswählbar und verschiebbar. Entfernen, Undo, Redo und Reload stellen jeweils genau den aus Canvasobjekten abgeleiteten Zustand her; es gibt keinen zweiten HTML- oder React-Verdeckungsstatus. Drucken und Zuschneiden erscheinen nicht.
- Eine mit `Ctrl` beziehungsweise `⌘` modifizierte Trackpad-/Mausradgeste verändert über Audio, lokalem Video und YouTube denselben Canvas-Zoom um die aktuelle Zeigerposition wie auf der übrigen Arbeitsfläche. Ohne Modifikator verschiebt dieselbe Zwei-Finger-Geste die Canvas-Kamera, sofern sie auf der Tafelraum-kontrollierten Playerfläche beginnt. Beide Varianten verändern weder Wiedergabestatus noch Medienwerte; direkte Mediencontrols und die schmale native YouTube-Controlleiste bleiben unverändert bedienbar.
- Dateien außerhalb des Materialordners, Historien und nicht unterstützte Formate erscheinen nicht als Stundenmaterial.
- Bei fehlender oder leerer Materialbasis bleibt der Canvas vollständig benutzbar.
- Toolbar, Verlauf, Archivnavigation und Materialbereich überdecken ihre primären Aktionen in den vier Dockpositionen nicht. Der rechte Materialbereich behält auch bei oberer Werkzeugleiste zunächst seine obere Canvasverankerung; nur eine anhand der realen Elementgeometrie erkannte Kollision legt die betroffene Gruppe in die nächste ruhige Reihe. Browserzoom allein löst keinen festen Breakpointwechsel aus.

## Ergänzung D-242 – Material aus dem Archiv entfernen

- Jede Zeile zeigt neben Plus ein kleines rotes Lucide-`X`, Tooltip `Aus Materialarchiv entfernen`; sichtbare Geometrie 16 px, aktives Desktopziel 32 × 40 px, auf groben Zeigern 48 × 48 px. Kein Hoverzwang.
- Klick öffnet einen echten modalen Dialog `Material aus dem Archiv entfernen?`, nennt das konkrete Material und die Entfernung aus allen verwendenden Unterrichtsflächen einschließlich Annotationen und Materialclips. Bei gemeinsamem Reihenmaterial wird die Wirkung auf andere Stunden ausdrücklich genannt.
- `Abbrechen` erhält Quelle und Canvas; `Entfernen` führt den Archivbefehl aus. Initialfokus liegt auf Abbrechen; Escape bricht ab. Während des Befehls ist keine zweite Bestätigung möglich.
- Archivzugehörigkeit ist Voraussetzung für Canvasmaterial. Archiv-Entfernen wirkt stärker als normales Canvas-Undo. Andere Materialien, eigenständiger Tafelinhalt und Ausschnittclips bleiben erhalten.
- Testaufgabe: Material platzieren, Entfernung abbrechen, erneut bestätigen, Undo und Reload prüfen; verwandte Materialclips und gebundene Annotationen dürfen nicht wieder erscheinen. Desktopbeobachtung bestätigt keine Smartboard-Touchbedienung.

- Dialoggeometrie: inhaltshohe, zentrierte Bestätigung, etwa 430 px breit; keine viewporthohe Fläche oder gestreckten Aktionsbuttons. Bei knappem Viewport scrollt der Dialog innerhalb seiner begrenzten Höhe.

## Rahmenlose lokale HTML-Blätter (13. Oktober 2026)

- Primäre Handlung: HTML-Arbeitsblatt lesen und bearbeiten; nur bei Auswahl seinen Inhaltszoom ändern oder das Material verschieben.
- D-250 beschrieb zunächst folgende Controls; D-254 entfernt den Verschiebegriff. Lokales HTML zeigt keinen dauerhaften Titelbalken. Die vorhandenen Aktionen erscheinen als kompakte Gruppe rechts oberhalb der sichtbaren Blattkante: Lucide-Verschiebegriff, `−`, Prozentwert (Reset auf `100 %`) und `+`. Ohne Materialauswahl ist die Gruppe unsichtbar, ohne Trefferfläche und ohne Tastaturziele. Einblendung 160 ms, reduzierte Bewegung unmittelbar. Apps behalten ihre Anbieterleiste.
- Historischer Stand D-250, durch D-251 ersetzt: Die bisherige obere Geometriezone blieb als transparenter Außenraum erhalten: Blattbeginn, Annotationen, Abdeckungen, gespeicherte A4-Proportion und vorhandene Stunden springen nicht. Schatten und Rundung folgen ausschließlich dem sichtbaren Blatt. Room zeigt in derselben Zone ebenfalls keinen Titel. Keine Paket-, Druck-, Archiv- oder Remote-Vertragsänderung.
- Abnahme: Auswählen/Abwählen, Inhaltszoom/Reset, Verschieben mit Annotation, Undo/Redo, Hell/Dunkel und Room-Ausschnitt; Eingaben und Scrollen bleiben unverändert. Touch-/Stiftprüfung am Board steht separat aus.

### Auswahlrand an der sichtbaren Blattkante (D-251)

Primäre Handlung: HTML-Blatt auswählen und über die vorhandenen nativen Griffe verschieben, skalieren und drehen. Die native Materialgeometrie umfasst nun ausschließlich den sichtbaren Inhalt, ohne frühere 48-Einheiten-Titelzone. Ältere Träger werden einmalig und rotationsgerecht auf diese Inhaltsgeometrie umgestellt; der Dokumentbeginn und Szene-Annotationen bleiben ortsfest. Voll-/Teilabdeckung und gespeicherte Abdeckausschnitte werden auf die neue Blattgeometrie umgerechnet. Ein Layoutkennzeichen verhindert wiederholte Umstellung, ohne zweite Positionswahrheit. Apps behalten ihre Griffleiste. Die Zoomcontrols schweben weiter außerhalb des Blatts; D-254 ersetzt den separaten Verschiebegriff durch freien Hintergrund-Drag. Abnahme: alter und neuer Träger, Annotation, Abdeckung, Reload, Zoom, Rotation und neue A4-Proportion; Touch/Stift separat.

### Einheitliche Blattkante und HTML-Scrollleisten (14. Oktober 2026)

Die äußere HTML-Sichtfläche clippt iframe und native Scrollleisten gemeinsam an allen vier gerundeten Ecken. Radius folgt dem Canvasmaßstab, unabhängig vom Inhaltszoom. Lokale HTML-Frames und ihr Dokument starten mit hellem Grund-Farbschema; ein niedrig priorisierter CSS-Layer erhält explizite paketinterne Farbschemata. Die gemeinsame Paket-Auslieferung ergänzt dezente graue Scrollleisten mit dokumentfarbenem Hintergrund für Spur/Ecke, nur für Bildschirmdarstellung. Die native Scrollmechanik bleibt erhalten: WebKit/Chromium verwenden ihre Scrollbar-Pseudoelemente, Browser ohne diese Schnittstelle die standardisierten Scrollbar-Eigenschaften. Keine neue Scrollinstanz oder Dependency. Apps und Originaldateien bleiben unverändert. Abnahme: vertikale/horizontale Scrollleiste gleichzeitig, untere/rechte Ecken, erstes Einfügen in Hell/Dunkel, Inhaltszoom, Scrollen, Teilabdeckung und Room. Native Darstellung separat prüfen; kein Touchnachweis.

### Direktes Verschieben auf freier HTML-Fläche (14. Oktober 2026)

Primäre Handlung: Mit dem Auswahlwerkzeug ein HTML-Blatt an einer freien Hintergrundstelle auswählen und ziehen. Bereits der erste Klick in Eingabefelder, semantische beziehungsweise markierte Interaktionen oder auf sichtbare Textzeichen bleibt im Dokument; Text kann normal markiert/kopiert werden. Scrollleisten bleiben bedienbar. Nach einer freien Auswahlgeste geht der Tastaturfokus an den Canvas; Text-/Eingabegesten behalten ihn im Dokument. Der flächige Auswahl-Overlay und der zusätzliche Verschiebegriff entfallen für lokale HTML-Blätter, die äußeren Zoomknöpfe bleiben nur bei Auswahl sichtbar. Apps und Hand-/Room-Scrollbedienung behalten ihre bisherigen Wege. Die HTML-Bridge meldet validierte Gesten an denselben Materialverbund-/Undo-Pfad wie der bisherige Griff; kein eigener Geometriespeicher. Abnahme: freier Drag vor/nach Auswahl, Textdrag/-kopie, Eingaben/Buttons/custom-markierte Interaktionen beim ersten Klick, beide Scrollleisten, Inhalts-/Canvaszoom, Rotation, Annotation/Abdeckung, Undo/Redo und Abbruch.

### Materialvorschau nach Format (14. Oktober 2026)

- Aufgabe: Material vor dem Einfügen durch Überfahren oder Tastaturfokus erkennen.
- Bilder und die erste PDF-Seite vollständig im tatsächlichen Seitenverhältnis zeigen. Keine feste A4-Box und kein über dem Inhalt liegender Dateiname.
- Lokales HTML zeigt eine isolierte, skriptfreie Ausgangsansicht; deklarierte Druckvorlagen haben Vorrang. Vorlage vollständig verkleinern, bei mehrseitigen Vorlagen entsprechend höheres Format. Allgemeines HTML verwendet die deklarierte Ausgangsbreite.
- Video zeigt ein stummes Standbild, Audio und Web-/YouTube-Links eine kompakte Typ-/Adressvorschau ohne externe Anbieteranfrage oder Wiedergabe.
- Zustand flüchtig; keine Archiv-/Canvasänderung, keine Formulareingabe oder automatische Wiedergabe. Vorschaugröße durch verfügbaren Platz begrenzen, kleine Bilder nicht hochskalieren.
- Prüfung: Quer-/Hochformatbild, A4-Vorlage, mehrseitiges PDF, interaktives HTML, Audio, Video und beide Linktypen; Materialwechsel und Schließen dürfen keine veraltete Vorschau zeigen.

### Material im Canvas finden und bewusst duplizieren (14. Oktober 2026)

- Primäre Handlung: Bereits platziertes Material in der Lehrerfläche wiederfinden. Sichtbarer Zustand `Im Canvas ✓` ersetzt den kleinen Haken; die Zeilenlabels `Bild` und `Interaktiv` entfallen. Vorschaubilder bleiben; D-258 entfernt anschließend die Typfilter.
- Zeilenklick/Enter/Leertaste auf verwendetes Material zentriert und fokussiert eine lebende Instanz; weitere Klicks durchlaufen die Instanzen in Szenenreihenfolge (bei PDFs auch deren Seiten). Unverwendete Zeilen behalten Vorschau/Fokus ohne Einfügen. Plus bleibt die explizite Einfügeaktion.
- Erneuter Archiv-Drop öffnet vor jeder Canvasänderung einen kompakten modalen Dialog: `Material [Name] ist bereits im Canvas. Nochmal hinzufügen?`, `Abbrechen`, `Nochmal hinzufügen`. Initialfokus Abbrechen, Escape bricht ab. Bestätigung verwendet den ursprünglichen Drop-Ort; Stundenwechsel verwirft die Anfrage. Keine neue Archiv-/Verwendungswahrheit.
- Abnahme: Abbruch ohne Duplikat, Bestätigung mit genau einer Einfügeaktion, wiederholte Instanznavigation, gelöschte Instanzen/Undo, Zoom/Pan, eindeutige Legacy-Provenienz, Hell/Dunkel und Tastatur. Touch/Stift bleiben Hardwareprüfung.

### Gemeinsamer Materialfokus ohne Kategorien (14. Oktober 2026)

- Primäre Handlung: Ein Material über Archivzeile oder vorhandene Zielaktion am Canvas fokussieren. Beide verwenden denselben flüchtigen Fokus, dieselbe native Auswahl und animierte Enginekamera; die offene Ablage wird beim Einpassen berücksichtigt. Reduzierte Bewegung schaltet die Kamerafahrt aus.
- Die komplette Kategorien-/Typfilterleiste entfällt einschließlich Filterzustand und Chevrons. Der gewonnene Platz gehört der vollständigen Materialliste. Typicons und vorhandene kompakte Metadaten bleiben zur Orientierung.
- `Im Canvas ✓` bleibt ein reiner Verwendungshinweis ohne Hintergrund oder Auswahlrahmen. Nur die Zeile des tatsächlich fokussierten Materials trägt eine Akzentmarkierung; Hover und Tastaturfokus bleiben davon unterscheidbar. Mehrere Instanzen derselben Quelle teilen die Zeilenmarkierung, weitere Archivaktivierungen durchlaufen ihre Instanzen.
- Fokus erhält den vorhandenen Ausschnitt im Abdunklungs-Layer, die Umgebung wird stärker und damit andere Materialien zurückgenommen. Keine Veränderung von Materialdeckkraft, Archivdaten oder öffentlicher Projektion. Controls bleiben lesbar und Inhalte bedienbar. Kein zweiter Canvasrenderer oder Blurfilter.
- Aktive Zielaktion erneut antippen, Escape oder freie Fläche im Auswahlwerkzeug beendet den Fokus und die Archivmarkierung. Löschen der letzten fokussierten Instanz und Stundenwechsel räumen die abgeleitete Markierung auf. Normale Auswahl allein aktiviert keinen Fokus.
- Abnahme: Mehrere verwendete, aber nicht fokussierte Einträge neutral; beide Einstiege synchron; Fokuswechsel/Beenden, Kamera bei offenem/geschlossenem Archiv, Rotation, HTML/Bild, Zoom/Pan, Undo/Redo und reduzierte Bewegung. Touch/Stift am Board separat.

### Materialien im Archiv benennen (14. Oktober 2026)

- Aufgabe: Materialien unabhängig von Dateinamen wiedererkennen und anschließend über den gemeinsamen Fokus anspringen, auch bei verdecktem Canvasmaterial.
- Jede Zeile zeigt drei gleichmäßig ausgerichtete Lucide-Aktionen: Plus, `Pencil`, rotes X. `Material umbenennen` öffnet ein Inline-Namensfeld in derselben Zeile; die Editierzeile nutzt den Platz von Name und Aktionen. `Name speichern` (Check) und `Abbrechen` (X) bleiben direkt erreichbar. Enter speichert, Escape bricht ab; Canvas-Shortcuts und Drag bleiben während der Eingabe fern.
- Das Inline-Namensfeld verwendet die mitwechselnden UI-Farben `--canvas` und `--text`, damit Eingabe und Schreibstrich in hellen und dunklen Varianten lesbar bleiben. Der bewusst helle Materialtoken `--paper` ist dafür ungeeignet.
- Anzeigename: 1–160 Zeichen nach Trimmen, keine Steuerzeichen. Leere Eingabe speichert nicht. Gleiche Namen für unterschiedliche Quellen sind erlaubt. Gleicher Name wie die Quelle setzt die eigene Benennung zurück. Fehler bleiben an der Eingabe, ein konkurrierender Namenswechsel wird nicht überschrieben.
- Eigene Namen gehören als optionale Metadaten zur vorhandenen Materialbasis; sie ändern weder Quelle, Manifest, URL, Materialpfad noch Canvasobjekte. Sie erscheinen in Liste, Vorschau und Archivdialogen. Reihenmaterial teilt die Benennung mit allen Stunden derselben Basis; keine zusätzliche stundenlokale Aliasverwaltung. Die bestehende Reihenfolge und Canvas-Provenienz bleiben erhalten.
- Abnahme: Bild/PDF/HTML/Audio/Video/Links benennen; Speichern, Abbrechen, Escape/Enter, Reload, doppelte Anzeigenamen, unveränderte Verwendung/Fokus/Mehrfachinstanzen und Quellen, Konkurrenz, lange Namen, Fehler sowie Stundenwechsel während einer Anfrage. Touchziele mindestens 48 px auf groben Zeigern; Boardtest separat.

### Inhaltsminiaturen in der Materialliste (14. Oktober 2026)

- Aufgabe: Ein HTML-Arbeitsblatt oder PDF bereits in der 44-px-Kachel wiedererkennen, ohne zuerst die große Hovervorschau zu öffnen.
- Bildminiaturen bleiben erhalten; HTML und PDF nutzen denselben passiven, proportional eingepassten Inhalt wie die vorhandene große Vorschau (HTML-Druckentry, falls deklariert; PDF-Seite 1). Audio, Video und Links behalten ihre Typicons, da hier noch kein eigenes Vorschaubild vereinbart ist.
- Nur sichtbare Zeilen laden Dokumentvorschauen; außerhalb der Liste werden sie abgebaut. Keine ausgeführten Paketskripte, Medienwiedergabe, Eingaben, Bridge, Canvasinstanzen oder gespeicherten Vorschauartefakte. Fehler fallen auf das Typicon zurück. Miniaturen fangen weder Klick, Drag noch Tastaturfokus ab.
- Abnahme: HTML mit relativen Assets und verschachteltem Druckentry, PDF, Bild und Fehlerfall; Scrollen in längerer Liste, Hovervorschau, Umbenennen und Canvasfokus bleiben erhalten. Hell/dunkel prüfen; Touch/Stift separat.

### Materialien in der Liste sortieren (18. Oktober 2026, D-274)

- Die bestehende Zeile bleibt die Ziehfläche, kein permanenter Sortiermodus und
  keine zusätzliche Iconspalte. Innerhalb der Liste zeigt eine Akzentlinie ober-
  oder unterhalb der Zielzeile die Einfügeposition. Am Listenrand scrollt die Liste.
  Loslassen speichert die Reihenfolge; Escape/Abbruch verändert nichts.
- Ziehen aus der Liste auf den Canvas bleibt die bestehende Kopier-/Einfügeaktion.
  Interne Drops werden vollständig im Materialbereich behandelt. Plus, Umbenennen,
  Entfernen, Verwendung und Fokus behalten ihre Bedeutung. Während Umbenennen,
  Import, Entfernen, Laden oder Speichern der Reihenfolge kein weiterer Sortierdrag.
- Tastatur: fokussierte Zeile mit Alt+Pfeil hoch/runter um einen Platz bewegen.
  Erfolg wird unaufdringlich für Assistenztechnik gemeldet; Fehler sichtbar mit
  erneut geladenem Archivstand, keine falsche Erfolgsmeldung oder stille Abweichung.
- Reihenfolge wird nach stabilen Materialpfaden an derselben Materialbasis
  gespeichert. Gemeinsam genutztes Reihenmaterial teilt diese Reihenfolge; neue
  Quellen erscheinen hinten, entfernte fehlen. Keine Dateienumbenennung oder
  Änderung von Canvas, Annotationen, Clips, Originalen oder Materialtypen.
- Abnahme: nach oben/unten/vorne/hinten sortieren, Reload, Konkurrenz/neuer Eingang,
  Abbruch, Tastatur und Canvas-Drop getrennt prüfen. Nativer Mac-Drag und Touch
  bleiben gesonderte Hardwareprüfung, soweit nicht tatsächlich ausgeführt.
