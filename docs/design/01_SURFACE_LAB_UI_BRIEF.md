# UI Brief – Prototyp 0.1 „Surface Lab“

**D-302 (29.10.2026):** Kleines `Stundennotizen`-Icon in der gemessenen oberen rechten Canvas-Aktionsgruppe neben Verlauf. Öffnet ausschließlich eine private Lehrkraftliste mit Namen und freien Notizzeilen; kein Canvasobjekt und keine Präsentation. [Brief30](30_STUDENT_NOTES_UI_BRIEF.md).

**Stand:** 30. August 2026  
**Status:** verbindliche Grundlage für die ersten ImageGen-Mockups und die gemeinsame Low-Fidelity-Shell

**D-307 (29.10.2026):** Allgemeine persönliche Merkliste samt Kopfzeileneinstieg entfernt. Nur kursbezogene `Stundennotizen` verbleiben am Canvas. D-309 bündelt die verbleibenden Canvasaktionen nach dem ausgewählten Mockup; übriger UI-Review unten bleibt Vorschlag.

## Kontext

- **Oberfläche/Zustand:** vereinfachte Ein-Client-Test-Shell einer vorbereiteten Teststunde; keine endgültige Vorbereitung-, Regie- oder Tafeloberfläche
- **Zielnutzer:** Lehrkraft beziehungsweise Testperson beim Canvas-, Touch- und Stiftspike
- **Nutzungssituation:** Mac mit Chrome/Chromium; Legamaster-Monitor und USB-Stift sind erstes reales Testgerät, genaue Hardwaredaten fehlen noch
- **Eine primäre Handlung:** ein Werkzeug wählen und unmittelbar auf der Unterrichtsfläche arbeiten
- **Vorgeschaltete Designfrage:** Welche ruhige visuelle Grundrichtung unterstützt die Arbeitsfläche, ohne selbst Aufmerksamkeit zu verlangen?
- **Anschließende Designfragen:** Funktioniert dieselbe Hierarchie in Hell und Dunkel, und an welcher angedockten Bildschirmseite ist die Werkzeuggruppe schneller auffindbar, besser erreichbar und weniger störend?

Desktop und Mockup dienen nur der visuellen Vorauswahl. Touch, Stift, Erreichbarkeit und endgültige Werkzeugposition bleiben bis zum Hardwaretest unvalidiert.

Die Shell bündelt für den technischen Test mehr Werkzeuge, als später in jeder Produktoberfläche gleichzeitig sichtbar sein müssen. Ihre Informationsarchitektur darf nicht als endgültige Lehrer- oder Schüleransicht übernommen werden. Die langfristige Oberflächenfamilie ist separat in `02_TEACHING_SURFACES_UI_BRIEF.md` beschrieben.

## Zu erzeugende Mockups

Für die erste Implementierung werden die ausgewählte helle Richtung und die explorative Dunkelrichtung „Calm Dusk“ als Themezustände derselben Shell übernommen. Der Themewechsel verändert keine Inhalte, Größen, Positionen oder Funktionen. Die Kontrolle dafür bleibt im Surface Lab eine getrennte Development-Funktion beziehungsweise ein Query-Parameter und ist noch keine fest platzierte Produkteinstellung.

Die Theme-Kontrolle verwendet einen einzelnen kompakten Zwei-Zustands-Schalter mit gleitendem Punkt statt separater Hell-/Dunkel-Buttons. Sonne und Mond kennzeichnen die beiden Zustände. Sie liegt in der ersten einheitlichen Einstellungszeile rechts neben der knappen Bezeichnung `Darstellung` und belastet die Kopfzeile nicht dauerhaft. Eine dezente Linie trennt den Live-Canvas-Einstieg von der gemeinsamen Utility-Gruppe `Einstellungen → Vollbild`. Vollbild und Einstellungen erscheinen als ruhige Lucide-Icons auf transparenten 48-Pixel-Zielen ohne permanente Kreisfläche oder Kontur; nur Hover, Fokus und der geöffnete Zustand geben eine lokale Fläche. `V` schaltet Vollbild als globales Desktop-Kürzel an und aus; der Hinweis bleibt im Tooltip und in zugänglichen Shortcut-Metadaten. Eine globale Aktion zum Zurücksetzen der Unterrichtsfläche erscheint nicht. Das ist eine testbare Hilfsanordnung und keine Festlegung für die spätere Produkteinstellung.

Seit 0.1.17 folgt direkt unter `Darstellung` die kompakte Auswahl `Design`. Sie zeigt nur die drei Varianten des aktuell gewählten Modus: hell `Warm`, `Klar`, `Salbei`; dunkel `Abend`, `Graphit`, `Nachtblau`. Die Palette vom 31.10.2026 trennt warme Papier-/Kupfertöne (Warm, Abend), kühles Weiß/Neutralgrau (Klar, Graphit) und Salbeigrün/Tintenblau (Salbei, Nachtblau). Die Auswahl pro Modus bleibt als lokale Gerätepräferenz erhalten. Sie darf ausschließlich Shell, Arbeitsflächenhintergrund, Linien, Akzent und Zustandsflächen verändern; Unterrichtsmaterial, Bilder, PDFs, Markerfarben, gespeicherte Elemente, Geometrie und Funktionen bleiben identisch. Der native Select vermeidet ein zweites Popover und bleibt per Tastatur erreichbar.

Die Kopfzeile teilt ihre Oberfläche mit dem Archiv. Die Werkzeugleiste liegt in Lehrer- und Room-Ansicht mit feiner Kontur und kurzem Schatten über der Tafel. In der aktiven Stundenzeile führen Titelgewicht und Akzentkante, das Datum bleibt sekundär. Primäre Aktionen wie der Präsentationsstart nutzen die Palettenfarbe mit kontrastierender Schrift. Die sechs Varianten werden an derselben Stunde mit weißem Blatt, Stift und Marker beurteilt. Alle sechs Tafelflächen sind einfarbig. Bei Warm und Abend erhält die Werkzeugleiste eine leicht getönte Kontur. Ein kurzer Strich unter dem aktiven Werkzeug macht die Auswahl auch bei Stift und Marker mit eigener Tintenfarbe erkennbar. Das gilt auf der Lehrerfläche und im Room.

Erfolgreiche Dateispeicherung ist der Normalfall und erzeugt keinen dauerhaften Kopfzeilentext. Prüfen oder Speichern erscheint erst nach einer Sekunde als kleine, über der Canvasfläche zentrierte Statusmeldung. `Nur im Browser gespeichert` und `Änderungen nicht gespeichert` erscheinen dagegen sofort und bleiben bestehen, auch während eines erneuten Versuchs, bis das Archiv den Erfolg bestätigt. Danach meldet `Wieder gespeichert` für 2,4 Sekunden die Wiederherstellung und verschwindet. Icon und Text unterscheiden die Zustände zusätzlich zur Farbe; reduzierte Systembewegung entfernt Einblendung und Spinner. Die Meldung blockiert keine Canvasinteraktion. Der zugrunde liegende Archivstatus und seine Speicherlogik bleiben unverändert.

Objektschatten sind in persönlicher und öffentlicher Fassung dauerhaft aktiv
(Nutzerauftrag31.10.2026); der Schalter und die Gerätepräferenz entfallen. Alte
`off`-Werte haben keine Wirkung mehr. Der Schatten hebt Rastermaterial wie Bilder
und gerenderte PDF-Seiten, Audio-/Videoplayer, lokale HTML-/Appflächen sowie
gefüllte Grundformen leicht von der Arbeitsfläche ab. Bei Rechteck, Ellipse und
Raute folgt er der Formkontur; ungefüllte Umrisse, native Link-Chips und YouTube
bleiben ohne zusätzlichen Flächenschatten. Der Effekt bleibt pointerdurchlässige
Darstellungs-UI und verändert weder Canvas-/Lesson-Daten noch Verlauf, Druck,
Export oder öffentliche Projektion. Einstellungen enthalten dafür keine Zeile.

### Runde 0 – Stilfindung

Drei visuell klar unterscheidbare Richtungen derselben Arbeitsoberfläche. Für einen fairen Vergleich verwenden alle drei zunächst die Werkzeuggruppe unten. Aufbau, Inhalt, Zustand, sichtbare Texte, Werkzeugreihenfolge und Canvas-Ausschnitt bleiben gleich.

Variiert werden dürfen ausschließlich:

- Temperatur und Abstufung der neutralen Flächen;
- typografischer Charakter innerhalb einer gut lesbaren Sans-Serif-Familie;
- Kontrast, Geometrie und Materialwirkung von Kopf- und Werkzeugleiste;
- zurückhaltende Art der Tiefenstaffelung;
- genaue Ausprägung der sparsamen blauen Akzentfarbe.

### Runde 1

Nach Auswahl beziehungsweise Kombination einer Grundrichtung entstehen zunächst zwei Referenzzustände derselben Arbeitsoberfläche:

1. Werkzeuggruppe unten;
2. Werkzeuggruppe links.

Nur die Position der Werkzeug- und Aktionsgruppen darf sich ändern. Inhalt, Stil, Größen, Farben, Zustand, sichtbare Texte und Canvas-Ausschnitt bleiben identisch.

Die implementierte Shell erweitert diesen Vergleich um oberes und rechtes Docking. Die Werkzeugleiste wird nicht über dauerhafte Positionsbuttons umgeschaltet, sondern folgt einem ausreichend großen Drag-Griff und rastet beim Loslassen an der nächstgelegenen Bildschirmseite ein. Query-Parameter bleiben als reproduzierbare Testhilfe erhalten.

Andock-Erkennung und Andockvorschau beziehen sich auf die sichtbare Canvasfläche, nicht auf das gesamte Browserfenster. Die Vorschau bleibt deshalb an allen vier Seiten innerhalb der Arbeitsfläche und passt Breite, Lage und Mittelpunkt beim Öffnen oder Schließen der Unterrichtsnavigation gemeinsam mit der Canvasfläche an.

Die Beschriftungsdichte folgt der Dockrichtung: Oben und unten bleiben die kurzen Werkzeug- und Aktionslabels sichtbar. Links und rechts bildet dieselbe Leiste eine schmale einzelne Icon-Spalte; dort werden die Labels visuell ausgeblendet, bleiben aber als Tooltip und zugänglicher Name erhalten. Der aktive Zustand muss auch ohne Text klar erkennbar bleiben.

### Werkzeugleiste kurz ausblenden – fokussierte UI-Probe

- **Handlung:** Die Lehrkraft räumt die Hauptwerkzeugleiste vorübergehend aus dem Blick und holt sie an derselben Dockseite zurück. Canvaswerkzeug, Dockposition, Stunde und Verlauf bleiben erhalten.
- **Designfrage:** Wirkt ein kurzer Übergang von örtlicher Unschärfe zu scharfer Leiste besonders, ohne die Arbeitsfläche oder das Material zu überlagern?
- **Bedienung:** `^` schaltet auf dem Desktop um; die deutsche tote Zirkumflextaste muss auch bei abweichendem Mac-ISO-Keycode erkannt werden. Texteingaben, offene Dialoge, Modifikator-Kombinationen und Tastenwiederholung bleiben unberührt. Eine kontextuelle 48-Pixel-Aktion an der Leiste blendet sie aus; ein einzelner ebenso großer Wiederöffner bleibt an ihrer Dockseite sichtbar. Keine zweite Werkzeugleiste oder dauerhafte Einstellung.
- **Bewegung:** Nur die Leiste selbst erhält für wenige hundert Millisekunden Unschärfe und Deckkraftwechsel. Kein großflächiger Backdrop-Blur, keine Partikel und keine Animation der Canvasinhalte. Bei reduzierter Systembewegung ist der Wechsel unmittelbar. Fokus und Pointertreffer folgen dem sichtbaren Zustand.
- **Prüfung:** Alle vier Dockseiten, Hell/Dunkel, offene Kontextoptionen, Wiederöffner, wiederholtes `^`, fokussierte Texteingabe und reduzierte Bewegung im Browser prüfen. Flüssigkeit auf MacBook Air und Touchziel am Legamaster bleiben Hardwareannahmen.

Das aktive Hauptwerkzeug erhält keine dauerhaft gefüllte Akzentkachel. Stattdessen wechselt seine Fluent-Silhouette ruhig zur blauen Akzentfarbe, das Icon wächst innerhalb des unveränderten Ziels um ungefähr zehn Prozent und ein sichtbares Werkzeuglabel erhält etwas mehr Gewicht. Stift, Marker und Form bewahren ihre fachliche Farbvorschau; Größe und gegebenenfalls Label bleiben deshalb das zusätzliche, nicht ausschließlich farbabhängige Aktivsignal. Der Wechsel läuft als kurze Ease-out-Transformation, bei reduzierter Systembewegung ohne sichtbare Animation. Hover- und Tastaturfokuszustände bleiben davon getrennt, und die aktive Trefferfläche behält ihre volle Größe.

### Erst nach Auswahl einer visuellen Richtung

- aktiver Stift mit kompakten Einstellungen;
- Arbeitsvollbild derselben Oberfläche.

Diese Zustände werden nicht in die erste A/B-Frage gemischt.

## Muss sichtbar sein

- ruhige, schmale Kopfzeile;
- mittig gekürzter aktiver Stundentitel als reine Anzeige aus derselben Lesson-Titelquelle wie das Archiv;
- sekundäres Unterrichtsdatum aus den Lesson-Metadaten in der Kopfzeile;
- bei normaler Speicherung kein dauerhafter Speicherstatus; bei Verzögerung oder Problem die zustandsabhängige Archivmeldung;
- dominante freie Arbeitsfläche;
- Werkzeuggruppe mit Hand, Auswahl, Stift, Marker, Radierer, Text und Form;
- ausschließlich die Tafelraum-Werkzeuggruppe; die native Excalidraw-Werkzeugleiste und deren responsive Varianten bleiben in jedem Viewport, Theme und Vollbildzustand unsichtbar;
- Undo und Redo zusammen mit Stundennotizen in der gemeinsamen flachen Aktionsgruppe oben rechts auf der Canvasfläche (D-309);
- Material hinzufügen und Inhalt finden als klar von den Werkzeugen getrennte Aktionen in der dockbaren Leiste;
- Hauptwerkzeuge, Drag-Griff und Leistenaktionen behalten ihre großen unsichtbaren Trefferflächen, verwenden bei Hover, Klick und aktivem Zustand aber keine einzelnen Kachelhintergründe; Farbe, leichte Iconskalierung und der vorhandene Tastaturfokusring tragen die Rückmeldung;
- Vollbild als globale Aktion rechts in der Kopfzeile;
- Transport-Illustration aus `test-materials/means-of-transport/assets/transport_set.png` als ein Bildobjekt;
- vorbereitete Leitfrage `Which means of transport is best for a holiday?`;
- ausreichend freie Fläche für Handschrift, Markierung, Form und später eingefügten Text.

## Exakter UI-Text

In App-Chrome sind nur diese Strings sichtbar; bei links oder rechts angedockter Werkzeugleiste werden deren Werkzeug- und Aktionslabels ausschließlich als Tooltip und zugänglicher Name geführt:

- das formatierte Unterrichtsdatum, sofern für die aktive Stunde vorhanden;
- nur nach mindestens einer Sekunde: `Archiv wird geprüft …`
- nur nach mindestens einer Sekunde: `Wird gespeichert …`
- bei Archiv-Ausfall: `Nur im Browser gespeichert`
- bei Schreibfehler oder Konflikt: `Änderungen nicht gespeichert`
- nach behobenem Ausfall kurz: `Wieder gespeichert`
- `Darstellung`
- `Materialschatten`
- `Hand`
- `Auswahl`
- `Stift`
- `Marker`
- `Radierer`
- `Text`
- `Form`
- `Material hinzufügen`
- nur während eines laufenden Imports: `Wird importiert`

Nur als zugänglicher Name der verborgenen Dateiauswahl:

- `Material auswählen`
- `Inhalt finden`
- `Vollbild`
- `Einstellungen`

Nur als Tooltip und zugänglicher Name des Drag-Griffs:

- `Werkzeugleiste verschieben`

Nur als zustandsabhängiger Tooltip und zugänglicher Name des Theme-Schalters:

- `Dunkles Design aktivieren`
- `Helles Design aktivieren`

Nur im Development-Modus steht unten rechts eine kompakte Zoomdiagnose `− 100 % +`. Minus und Plus verändern den Canvaszoom um zehn Prozentpunkte. Ein Klick auf den Prozentwert stellt `100 %` wieder her. Die sichtbare Zahl darf dynamisch von `10 %` bis `300 %` reichen; zugängliche Namen und Tooltips lauten:

- `Verkleinern`
- `Vergrößern`
- `Zoom auf 100 Prozent zurücksetzen`

Die Kontrolle sitzt mit identischem Abstand am rechten und unteren Rand. Bei rechts angedockter Werkzeugleiste weicht sie horizontal nur bis unmittelbar neben die Leiste aus: 12 Pixel Abstand trennen beide Flächen, ihre Unterkanten bleiben ausgerichtet. In einer ungewöhnlich schmalen Development-Ansicht darf sie der unteren Werkzeugleiste nach oben ausweichen, damit alle Ziele bedienbar bleiben. Sie ist Diagnose-UI für die Qualitätsprüfung und noch keine Festlegung für Lehrer-, Tafel- oder Teilnehmeransichten.

Canvas-Inhalt:

- `Which means of transport is best for a holiday?`

Undo und Redo dürfen als vertraute Icons ohne sichtbares Textlabel erscheinen. Tooltips und zugängliche Namen werden erst in der Implementierung sichtbar beziehungsweise technisch ergänzt.

Stift und Marker öffnen bei Auswahl jeweils ein kompaktes Werkzeug-Popover direkt an der Werkzeugleiste. Seine Mittelachse folgt an allen vier Dockseiten dem tatsächlich aktiven Werkzeugbutton statt dem Mittelpunkt der gesamten Leiste. Beim direkten Wechsel zwischen Stift und Marker gleitet dieselbe Popoverfläche in einer kurzen ruhigen Ease-out-Bewegung zur neuen Werkzeugposition; bei reduzierter Systembewegung wechselt sie ohne sichtbare Fahrt. Der Stift bietet fünf, der Marker vier Grundfarben. Direkt daneben stehen für beide Werkzeuge vier unabhängig gemerkte Strichstärken `Fein`, `Normal`, `Breit` und `Sehr breit`; `Normal` bewahrt die bisherigen Standarddicken. Die Stufen erscheinen als sichtbar stärker werdende Linien statt als dauerhafte Textlabels. Farb- und Strichstärkenziele bleiben mindestens `48 × 48 CSS-Pixel` groß und tragen zugängliche Namen. Ring beziehungsweise Akzentfläche und Haken kennzeichnen die Auswahl zusätzlich zu Farbe oder Dicke. Nach einer Wahl schließt das Popover; das Werkzeug bleibt aktiv. Außenklick und `Escape` schließen es ohne Änderung. Die Werkzeugaktionen der dockbaren Hauptleiste verwenden offizielle, MIT-lizenzierte Microsoft Fluent System Icons: `Hand Right`, `Cursor`, `Edit`, `Highlight`, `Eraser`, `Text Font`, die aktuell gewählte Grundform, `Document Add` und `Scan Object`. Der Verschiebegriff verwendet passend zu Text- und Formpalette das vorhandene gepunktete Lucide-`GripVertical`; Shell-, Archiv- und kontextuelle Materialaktionen bleiben beim projektweiten Lucide-Standard. Beim Fluent-`Edit 24 Color` trägt ausschließlich die im Original getrennte vordere Spitzenfläche die gewählte Stiftfarbe. Beim Fluent-`Highlight 24 Regular` übernimmt entsprechend die bereits als eigener Original-Unterpfad angelegte zeichnende Spitze die Markerfarbe; Körper und Band bleiben neutral. Formen spiegeln Grundform, Konturfarbe und Füllzustand über unveränderte reguläre beziehungsweise gefüllte Fluent-Masken. Es entstehen weder beschnittene Iconkopien noch selbst gezeichnete Geometrien; das offizielle SVG-Paket wird versionsgebunden verwendet.

Während der tatsächlichen Texteingabe kennzeichnet eine dezente gestrichelte Akzentlinie den Canvas-Editor als aktives Eingabefeld. Neue Texte starten eindeutig mit der aktiven Stufe `M`. Ein einfacher Klick erzeugt weiterhin frei wachsenden Text; Aufziehen mit dem Textwerkzeug definiert alternativ eine feste Textbreite, an der der Text bereits während der Eingabe umbricht. Bei ausgewähltem oder bearbeitetem Text stehen `Text bearbeiten` und `Textgestaltung öffnen` zusammen mit der vorhandenen Abdeckung als drei runde Objektbuttons neben dem Text. Der Gestaltungsbutton zeigt die vollständige Palette und klappt sie auch wieder ein. Ihr eigener Griff `Formatleiste verschieben` versetzt die geöffnete Palette unabhängig vom Text; der getrennte 48-Pixel-Griff `Text verschieben` positioniert bei freiem Text weiterhin das Objekt. Bei Platzmangel weicht die Palette aus und bleibt innerhalb des Viewports. Seit D-161 zeigt der native Editor gemischte Schriftgrößen und Schriftfamilien innerhalb einer Zeile nicht immer maßgetreu; die bestätigte Darstellung wird aus dem semantischen Text abgeleitet. [UI Brief 13](13_RICH_TEXT_FORMATTING_UI_BRIEF.md) beschreibt den aktuellen Zustand.

Formgebundener Text behält beim Öffnen des Editors seine sichtbare vertikale Lage. Die aufgeklappte Textpalette bietet für den gesamten Textblock `oben`, `mittig` und `unten`; eine markierte Zeichenfolge begrenzt diese Blockaktion nicht. Gespeicherte Formtexte mit abweichender alter Sichtposition werden einmalig auf die nächstliegende native Höhenlage abgestimmt.

Ein Doppelklick auf eine Grundform aktiviert den nativ an die Form gebundenen Text und ersetzt für die Dauer der Eingabe die Formenpalette durch dieselbe Textformatierung. Die Palette bleibt an der Form verankert; der Verschiebegriff entfällt hier, weil Position und Zentrierung durch den Container bestimmt werden. Der gebundene Editor übernimmt keine künstliche Mindestbreite der freien Texteingabe, damit Schrift und Cursor schon während des Schreibens in der Formmitte liegen und beim Bestätigen nicht springen. Neue Formenbeschriftungen erhalten abhängig von deckender Formfläche beziehungsweise Canvasgrund automatisch den kontraststärkeren Schwarz- oder Weißwert. Bereits gespeicherter gebundener Text mit identischer Form- und Textfarbe wird beim nächsten Bearbeiten auf diesen lesbaren Ausgangskontrast gebracht; jede anschließend bewusst gewählte Textfarbe bleibt eine unabhängige native Texteigenschaft.

Die Palette bietet zuerst drei lokal gebündelte, von der Engine nativ unterstützte Schriftfamilien: `Klar – Nunito` als scharf lesbaren Standard, `Whiteboard – Excalifont` als lockere Tafeloption und `Kompakt – Comic Shanns` als markantere Alternative. Jedes Ziel zeigt dasselbe kurze `Aa` in seiner tatsächlichen Schrift, damit die Wahl ohne dauerhaftes Textlabel vergleichbar bleibt. Externe Webfonts, Systemfont-Abhängigkeiten und eine lange Schriftliste entstehen nicht.

Danach folgen fünf wie Kleidergrößen geordnete Stufen `XS`, `S`, `M`, `L` und `XL`, links- beziehungsweise zentrierte Ausrichtung sowie eine Aufzählung für die aktuelle oder markierte Zeile. `XS` ist für kleinere Hinweise in der Desktop-Vorbereitung gedacht; `M` bleibt der Standard für neue Texte. Ein abschließendes `A` mit Farblinie öffnet eine kompakte zweite Ebene für Schwarz, Weiß, ein gedämpftes Rot, Grün und Ockergelb. Seit D-161 gilt die explizite Farbwahl bei Objektauswahl für das ganze Textobjekt und bei einer Zeichenauswahl nur für diese Spanne. Die zweite Ebene schließt danach; die Texteingabe bleibt aktiv. Alle Ziele sind mindestens `48 × 48 CSS-Pixel` groß. Aktive Zustände werden durch Fläche, Kontur und Haken zusätzlich zur Farbe vermittelt. Zugängliche Namen lauten:

- `Klar – Nunito`
- `Whiteboard – Excalifont`
- `Kompakt – Comic Shanns`

- `Textgröße XS`
- `Textgröße S`
- `Textgröße M`
- `Textgröße L`
- `Textgröße XL`
- `Linksbündig`
- `Zentriert`
- `Aufzählung`
- `Textfarbe`
- `Textfarbe Schwarz`
- `Textfarbe Weiß`
- `Textfarbe Rot`
- `Textfarbe Grün`
- `Textfarbe Gelb`
- `Text verschieben`

Die anfängliche Schriftwahl galt wie Größe, Ausrichtung und Textfarbe elementweit und nutzte die nativen Felder `fontFamily`, `lineHeight` und `strokeColor`. Nunito bleibt Standard für neue Texte. D-161 ersetzt den Ausschluss gemischter Formatierung: Das semantische Rich-Text-Dokument liegt ausschließlich am Textobjekt, die sichtbare Rasterfassung wird daraus abgeleitet. D-162 stellt die verschiebbare Zweizeilenpalette hinter zwei schnelle Textaktionen. Diese Zustände und die Grenze des nativen Editors bei gemischten Schriftgrößen beschreibt [UI Brief 13](13_RICH_TEXT_FORMATTING_UI_BRIEF.md). Die konkreten Größenwerte, Farbwerte und die Platzierung bleiben bis zum realen Whiteboardtest vorläufig.

Zugängliche Namen der Stiftfarben:

- `Stift: Schwarz`
- `Stift: Graphit` beziehungsweise im dunklen Theme `Stift: Kreide`
- `Stift: Tafelblau`
- `Stift: Pflaume`
- `Stift: Tafelgrün`

Zugängliche Namen der Markerfarben:

- `Marker: Sonnengelb`
- `Marker: Salbei`
- `Marker: Koralle`
- `Marker: Himmelblau`

Zugängliche Namen der Strichstärken:

- `Stift: Strichstärke Fein`
- `Stift: Strichstärke Normal`
- `Stift: Strichstärke Breit`
- `Stift: Strichstärke Sehr breit`
- `Marker: Strichstärke Fein`
- `Marker: Strichstärke Normal`
- `Marker: Strichstärke Breit`
- `Marker: Strichstärke Sehr breit`

Schwarz bleibt in beiden Themes als echte Materialfarbe verfügbar, insbesondere für helle Bilder und PDF-Seiten. Die übrigen Stiftfarben verwenden für helle und dunkle Canvasflächen kontraststarke Varianten derselben vier Farbfamilien. Markerfarben bleiben als breite, halbtransparente Hervorhebungsfarben themeübergreifend stabil. Alle konkreten Werte bleiben bis zum visuellen Test auf realem Material und dem Hardwaretest vorläufig.

Neue Markerzüge verwenden Highlighter V2 (D-097/D-099): Eine weichkantige Meißelspitze mit echter Dicke und 40°-Grundstellung erzeugt eine ruhige richtungsabhängige Breite und schräge Enden bei 32 Prozent Deckkraft. Die Spitzenhaltung folgt der Bewegungsachse über die zurückgelegte Strecke ruhig um höchstens ±5°, ohne Positionsnachlauf oder 180°-Flip beim Zurückmalen. Die horizontale Markierbreite bleibt erhalten; Tap und gezogener Strich verwenden dieselbe Spitze. Gleichmäßige Abtastung der zurückliegenden Spur und eine kurze lokale Glättung beruhigen die Kontur, während das sichtbare Strichende direkt zur Eingabeposition reicht. Mausgeschwindigkeit und Druck verändern die Breite nicht. Wer am Ende eines annähernd geraden Zugs etwa 420 ms gedrückt hält, erhält eine gerade Linie; absichtliche Kurven und Kreise werden nicht automatisch begradigt. Weiterzeichnen löst die Begradigung wieder. Shift während der Bewegung erzwingt die gerade Verbindung. Loslassen übernimmt die letzte Eingabeposition ohne nachträgliches Umformen oder neue Deckkraft. Keine zusätzlichen Toolbaroptionen, künstliche Textur, Positionsnachlauf oder Leuchteffekte; vorhandene Marker werden nicht nachträglich umgestaltet. Ein echter Multiply-/Screen-Mischmodus ist weiterhin nicht umgesetzt. Fingergefühl und Latenz benötigen insbesondere einen Test auf iPad 9, zusätzlich zum Legamaster.

Das aktive Formwerkzeug ergänzt die bestehende Auswahl aus Rechteck, Ellipse und Raute um die drei Füllzustände `Ohne Füllung`, `Transparent` und `Deckend`. Direkt danach stehen fünf ruhige Farbfelder für Blau, Grün, Gelb, Koralle und Neutral; die Farbfelder benötigen keine dauerhaft sichtbaren Beschriftungen, besitzen aber eindeutige zugängliche Namen und Tooltips. Der Hauptbutton zeigt statt des generischen Formsymbols stets die aktuell gewählte Fluent-Grundform; ihre Kontur trägt die gewählte Farbe, die Fläche bildet den Zustand ohne Füllung, transparent oder deckend unmittelbar ab. Damit bleibt die letzte Formkonfiguration wie bei Stift und Marker auch nach dem Schließen der Optionen sichtbar. Bei genau einer ausgewählten Form erscheint dieselbe kompakte Palette direkt oberhalb beziehungsweise bei Platzmangel unterhalb des Objekts. Sobald stattdessen ihr gebundener Text bearbeitet wird, wechselt dieser Ort eindeutig zur Textpalette. Die Füllzustände verwenden drei 48-Pixel-Iconziele mit Lucide-Symbolen und den zugänglichen Namen:

- `Form ohne Füllung`
- `Form transparent gefüllt`
- `Form deckend gefüllt`

Rahmen und Füllung bleiben getrennte native Engine-Eigenschaften. Die gewählte Grundfarbe steuert beide gemeinsam; `Transparent` verwendet davon eine echte, dezente Alphafüllung, damit darunterliegendes Unterrichtsmaterial lesbar bleibt, während `Deckend` die Vollfarbe verwendet. Neue Formen besitzen saubere Kanten ohne Excalidraw-Skizzenrauheit. Die aktive Formfüllung wird durch Fläche und Kontur zusätzlich zur Iconform vermittelt. Eine Änderung aktualisiert die ausgewählte Form unmittelbar und gilt zugleich als Vorgabe für die nächste Form. Mehrfachformatierung, freie oder benutzerdefinierte Farben und weitere Linienstile bleiben außerhalb dieses kleinen Slices.

Text und Form sind einmalige Platzierungswerkzeuge: Nach dem erfolgreichen Abschluss eines neuen, nicht leeren Textes beziehungsweise einer neuen Grundform wechselt die Shell unmittelbar zu `Auswahl` und lässt das erzeugte Objekt ausgewählt. Damit kann es ohne erneute Werkzeugwahl direkt verschoben oder weiterbearbeitet werden. Abbruch und leere Texte lösen den Wechsel nicht aus. Stift und Marker bleiben dagegen nach jedem Strich aktiv, weil zusammenhängendes Schreiben und Hervorheben mehrere Eingaben benötigt.

Für die Drehung bleibt ausschließlich der native runde Punktgriff oberhalb der Auswahl sichtbar. Der zusätzliche runde Iconbutton außerhalb der oberen rechten Ecke entfällt; die Eckpunkte bleiben eindeutig für die Größenänderung reserviert. Bei Bild-, PDF- und projiziertem Videomaterial übernimmt der kleine Canvas-Adapter den Pointerdrag desselben sichtbaren Punktgriffs, ohne einen zweiten Griff oder eine parallele Geometrie anzuzeigen.

Als ergänzende Kurzaktionen erscheinen beim Desktop-Hover über einem Bild sechs dezente 32-Pixel-Buttons vollständig außerhalb des Materials. Querformat bevorzugt die obere lange Seite, Hochformat die rechte lange Seite. Reicht dort der sichtbare Canvas nicht aus oder würde die Reihe ein benachbartes Rastermaterial überdecken, weicht sie zuerst auf die gegenüberliegende lange Seite und nötigenfalls auf eine freie kurze Seite aus. Die Reihe folgt auch der Rotation des Bildes und bleibt als Gruppe im sichtbaren Canvas. Nach Auswahl eines Bildes bleiben dieselben Aktionen auch ohne Hover sichtbar; dadurch sind sie im Auswahlwerkzeug per Antippen erreichbar. Auf Geräten mit grobem Zeiger wachsen die Ziele auf die vorläufige Untergrenze von 48 Pixeln. Das Bild muss für den Desktop-Hover nicht ausgewählt sein. Das Lucide-Auge ist ein Zwei-Zustands-Control und trägt abhängig vom Zustand ausschließlich als Tooltip und zugänglichen Namen:

- `Bildfokus aktivieren`
- `Bildfokus deaktivieren`

Ein Klick auf das Auge startet oder beendet ausschließlich den Fokusmodus am Bild. Außerhalb der fokussierten Elemente wird die Arbeitsfläche deutlich, aber weiterhin lesbar abgedunkelt; das Overlay nimmt keine Pointer-Ereignisse an. Das Blatt selbst bleibt unverändert hell und erhält ausdrücklich keine zusätzliche Fokusumrandung. Ein weich einblendender Dimmer und ein kurzer Helligkeitsübergang des Ausschnitts geben responsives Feedback, ohne die Elementgeometrie zu verändern. Der aktive Augenbutton verwendet zusätzlich zu `aria-pressed` eine vollständig deckende, gleichmäßige Akzentfläche.

Das Lucide-Kontrasticon ergänzt für Bilder und gerenderte PDF-Seiten einen weiteren Zwei-Zustands-Control mit den zugänglichen Namen `Scan optimieren` und `Originaldarstellung verwenden`. Die erste Aktion erzeugt lokal eine neue Rasterfassung, die blasse neutrale Schrift und Linien verstärkt, reines Papierweiß sowie Transparenz erhält und farbige Bildbereiche zurückhaltender behandelt. Die zweite Aktion schaltet dasselbe Canvasobjekt auf sein unverändertes Originalasset zurück. Geometrie, Crop, Materialgruppe und Annotationen bleiben identisch; der Wechsel ist ein normaler Undo-/Redo- und Persistenzschritt. Der aktive Zustand ist zusätzlich über `aria-pressed` und die vorhandene deckende Akzentfläche erkennbar. Es erscheinen weder Regler noch Dialog, und die Quelldatei im Materialordner wird nie überschrieben. Druck und Live-Projektion verwenden wie bisher die aktuell am Canvasobjekt gewählte Rasterfassung.

Solange der Fokusmodus aktiv ist, wechselt ein normaler Auswahlklick auf ein anderes Canvasobjekt den Fokus dorthin. `Shift`-Klick ergänzt oder entfernt einzelne Objekte, damit fachlich zusammengehörige Inhalte gemeinsam hervorgehoben werden können. Getrennte Ziele erhalten getrennte Ausschnitte; der Bereich dazwischen bleibt abgedunkelt. Gerade Blätter verwenden dafür wenige nicht überlappende Abdunklungsflächen statt einer permanenten vollflächigen Effektmaske; gedrehte Ziele behalten den geometrisch exakten Fallback. Bearbeitungsrahmen und Größenhandles einer vorhandenen Bildabdeckung werden während des Fokusmodus ausgeblendet; die Abdeckung selbst bleibt als vorbereiteter Canvasinhalt sichtbar. Ein echter Auswahlklick auf freie Fläche oder `Escape` beendet den Modus. Reine Kameraaktionen mit Hand, temporärem Leertaste-Pan, Zoom oder `Inhalt finden` lassen ihn dagegen stabil bestehen. Fokuswechsel und Dimmer laufen weich, bei reduzierter Systembewegung ohne Animation. Der Fokus verändert weder Kamera noch Canvasdaten und wird nicht gespeichert.

Direkt daneben trägt das Lucide-Icon `LocateFixed` ausschließlich als Tooltip und zugänglichen Namen:

- `Bild zentrieren`

Ein Klick zentriert das Bild unabhängig vom Fokuszustand mit einer ruhigen Kamerafahrt und einem moderaten Fit-Zoom, sodass Kontext an den Rändern sichtbar bleibt. Die Aktion schaltet den Bildfokus weder ein noch aus. `Inhalt finden` bleibt als sichtbarer globaler Rückweg erhalten. Bei reduzierter Systembewegung erfolgt der Kamerasprung ohne Animation.

Als dritte Aktion trägt `RectangleHorizontal` abhängig vom Zustand ausschließlich als Tooltip und zugänglichen Namen:

- `Abdeckung hinzufügen`
- `Abdeckung entfernen`

Die Abdeckung erhält bei der Bearbeitung den Charakter einer matten Schiebeblende: vier kurze helle Griffleisten an den Seiten und kleine Eckwinkel ersetzen die runden Abdeckungs-Auswahlpunkte und den durchgehenden blauen Bearbeitungsrahmen. Die Seiten besitzen größere unsichtbare Trefferzonen als die sichtbaren Leisten. Eine sehr feine Oberflächenaufhellung, Lichtkante und ein schmaler Schatten vermitteln Tiefe; beim Anfassen verstärken sich Griff und Schatten kurz. Die native blickdichte Fläche bleibt darunter vollständig erhalten. Es gibt weder Transparenz zum Unterrichtsinhalt noch verzögert nachlaufende Ziehgeometrie. Normale Auswahlgriffe des Materials bleiben für dessen eigene Transformation erhalten. Bewegungs-, Begrenzungs-, Undo- und Speicherlogik bleiben identisch; grobe Pointer erhalten mindestens 48 Pixel große Trefferziele, deren praktische Eignung auf der Tafel offen bleibt.

Ein erster Klick verdeckt das gesamte Bild mit einer deckenden, ruhigen Abdeckung. Sie wischt dafür von der rechten Bildkante über das Material; die feste Startkante löst die geometrische Gleichlage der Vollabdeckung eindeutig. Die Abdeckung ist ein natives Canvasobjekt desselben Materialverbunds und bleibt dadurch bei Verschieben, Skalieren, Drehen, Undo/Redo und Reload am Bild. Solange ein Teil des Blatts sichtbar ist, verschiebt Ziehen direkt auf der Abdeckfläche nur die Abdeckung; Ziehen auf dem sichtbaren Blatt bewegt den gesamten Materialverbund. Deckt die Fläche das Blatt vollständig ab, fällt Ziehen auf ihrer Mitte automatisch auf das Material zurück und bewegt den gesamten Verbund, während Kanten und Ecken weiterhin die Abdeckungsgröße ändern. Bild, Abdeckung und zugehörige Annotationen werden dabei bereits während jedes Drag-Zwischenzustands gemeinsam versetzt; das verdeckte Material darf weder beim ersten Anfassen noch während der Bewegung kurz sichtbar werden. Alle Abdeckungsbewegungen werden in bildlokalen Koordinaten begrenzt; geladene oder durch eine Materialtransformation abweichende Geometrie wird anhand der stabilen Bild-ID wieder innerhalb des Bildformats ausgerichtet. Beim Entfernen merkt sich das Bild den letzten bildlokalen Ausschnitt und seine Andockkante. Ein erneutes Anlegen stellt genau diesen Ausschnitt wieder her, auch nachdem das Bild zwischenzeitlich verschoben oder skaliert wurde; der vollständige Anfangszustand gilt ausschließlich für ein Bild ohne frühere Abdeckung. Beim Anlegen streicht die Fläche kurz von der gespeicherten beziehungsweise nächstgelegenen Bildkante ein; beim Entfernen zieht sie sich zu exakt derselben Kante zurück. Rechts, links, oben und unten werden unterstützt. Bei einer geometrischen Gleichlage bleibt die zuletzt eindeutige Andockkante erhalten, sodass auch eine Vollabdeckung ihre Herkunft nicht verliert. Zusätzliche Lichtstreifen, Aufblitzen oder ein nachgelagerter Blattimpuls erscheinen nicht. Die Bewegung ist ein flüchtiger pointerdurchlässiger Darstellungszustand und entfällt bei reduzierter Systembewegung. Pro Bild existiert in diesem Slice höchstens eine Abdeckung. Die präzisen Griffe sind eine Desktop-Interaktion und keine bestätigte Touch- oder Stiftlösung.

Freie Texte sowie eigenständige Rechtecke, Ellipsen und Rauten erhalten nach Auswahl dieselbe einzelne `RectangleHorizontal`-Aktion. Bei der Form steht sie nach einem ruhigen Trenner am Ende ihrer bereits sichtbaren Formatierungsleiste, damit sie nicht von dieser größeren Leiste verdeckt wird; bei freiem Text und beim vollständig abgedeckten Verbund bleibt sie außerhalb des Objekts. Sie legt dieselbe gespeicherte graue Schiebeabdeckung an und entfernt sie wieder; es entsteht weder ein zweites Abdeckungsmodell noch eine zusätzliche dauerhafte Werkzeugleistenaktion. Bei Grundformen folgt die deckende Fläche der sichtbaren Kontur: Rechtecke übernehmen ihre Eckenrundung, Ellipsen und Rauten ihre Form. Das gilt auch für die dauerhaft verschobene oder verkleinerte Teilabdeckung: Ihr verstellbarer Bereich schneidet die unveränderte Zielform aus, statt selbst eine kleinere Form zu werden. Auch während des kurzen gerichteten Auf- und Zuwischens bleibt diese Außenkontur unverzerrt; ausschließlich der darin sichtbare Teil wächst oder schrumpft. Freier Text sowie rechteckiges Bild-, Video- oder HTML-Material behalten die rechteckige Abdeckung und dieselbe Bewegung. Bei beschrifteten Grundformen ist die Form das geometrische Ziel, ihr gebundener Text bleibt beim Verschieben als Teil desselben temporären Abdeckungsverbunds erhalten. Fremde Mehrfachauswahlen, technische Rechtecke und projizierte Materialien werden nicht als freie Canvasobjekte umgedeutet. Nach dem Aufdecken bleiben Text und Form vollständig normal editierbar.

Beim kompakten Audio-Player dient jede nicht-interaktive Stelle der sichtbaren Playerfläche unmittelbar als Auswahl- und Verschiebezone. Ein einzelner Klick genügt auch aus dem Handmodus zur Auswahl; ein Drag bewegt denselben nativen Canvasplatzhalter. Play/Pause, Zeitleiste, Sprünge, Lautstärke und Tempo bleiben davon ausgenommene direkte DOM-Controls und reagieren weiterhin beim ersten Klick. Es entsteht weder ein zusätzlicher Auswahlbutton noch eine rein über den Dateititel erreichbare schmale Trefferzone.

Ein ausgewählter YouTube-Player verwendet dieselbe ruhige Aktionssprache für Zentrieren, Fokus und Abdeckung. Die drei 32-Pixel-Aktionen liegen wie die Rasterbildaktionen vollständig außerhalb der Playerfläche, bevorzugen dessen lange Seite und weichen bei Viewportrand oder benachbartem Bild beziehungsweise Video auf eine freie Seite aus; auf groben Zeigern bleiben sie 48 Pixel groß. Damit überlagern Tafelraum-Aktionen weder Video noch Anbietercontrols. Ein transparentes natives Canvasrechteck hält ausschließlich Geometrie, Provenienz und Verlauf; der externe Player wird daraus deckungsgleich als DOM-Oberfläche projiziert. Die Abdeckung ist an denselben Materialverbund gebunden, bleibt innerhalb seiner lokalen Geometrie und wird ebenfalls pointerdurchlässig in die sichtbare Player-Ebene projiziert. Beide Projektionen sind ausschließlich Darstellung und führen weder zweiten Player- noch zweiten Abdeckungszustand. Bei vorhandener Abdeckung wird die Bedienebene des Players geschlossen; das Rechteck bleibt während Bewegung, Skalierung und nach Abwahl deckend. Zuschneiden und Drucken erscheinen nicht, weil weder die externe Videodatei noch eine lokale Rasterquelle vorliegt. Die mittlere Videofläche bleibt vor und nach der Aktivierung eine kombinierte Klick-/Dragzone: Ein bewusster kurzer Klick schaltet Play/Pause, ein Halten mit Bewegung verschiebt das Canvasobjekt und löst niemals zusätzlich Wiedergabe aus. Beim aktiven Player bleiben begrenzte Anbieterzonen am oberen und unteren Rand direkt dem Iframe überlassen. Sie umfassen YouTubes responsive Lautstärke-, Untertitel- und Einstellungsbuttons ebenso wie die vollständigen Trefferflächen von Zeitleiste und Vollbild; die transparente Tafelraum-Dragfläche darf keine sichtbare Anbieteraktion überdecken. Beim Herauszoomen wird die unskalierte innere Iframe-Geometrie als vollständige Einheit verkleinert, damit native Symbole und Zeitangaben proportional zum Canvasobjekt bleiben; beim Hineinzoomen rendert sie direkt in der Zielgröße und wird nicht hochskaliert. Auswahl und Größenänderung bleiben native Canvasinteraktionen. Ein zusätzliches Engine-Link-Icon entsteht nicht, weil die Engine keinen eigenen YouTube-Embed mehr rendert; gewöhnliche verlinkte Canvasobjekte behalten ihre Linkaktion.

Dieselbe kontextuelle Bildaktionsreihe bietet `Bild zuschneiden` mit dem vertrauten Lucide-Crop-Symbol. Der erste Klick öffnet direkt oberhalb der Aktion eine kompakte, auf die Arbeitsfläche begrenzte Zweierauswahl mit sichtbarem Icon und Kurzlabel: `Ausschnitt wählen` und `Ränder trimmen`. `Ausschnitt wählen` legt einen ruhigen Auswahlrahmen über das Bild; ein frei aufgezogener rechteckiger Bereich wird beim Loslassen unmittelbar zum sichtbaren Bildfenster. `Ränder trimmen` legt einen bildgebundenen Bearbeitungsrahmen mit vier vollständig ziehbaren Randzonen und vier großzügigen Eckzonen über das Material. Die aktiven Mausfelder sind deutlich größer als die sichtbaren ruhigen Griffe; dadurch muss keine schmale Linie exakt getroffen werden. Nach einem Randdrag bleibt der Modus für weitere Seiten aktiv. Es entsteht weder ein Dialog noch ein separates Seitenpanel. Beide Wege schreiben denselben nicht-destruktiven Cropzustand des vorhandenen Bildelements, während die Originaldatei unverändert bleibt. Ein weiterer Klick auf die aktive Hauptaktion oder Escape beendet den laufenden Modus. Verschwindet die zugehörige Bildaktionsreihe, weil weder dieses Bild ausgewählt noch mit dem Zeiger adressiert ist, schließen sich Zuschneidemenü und laufender Auswahl- beziehungsweise Trimmmodus ebenfalls automatisch; ein unsichtbarer Bearbeitungszustand bleibt nicht zurück. Der Zuschnitt ist ein normaler Undo-/Redo- und Persistenzschritt und wird beim Druck berücksichtigt. Der aktive Zustand ist wie Fokus und Abdeckung nicht nur über Farbe erkennbar. Die kleine Menübewegung dient nur der räumlichen Zuordnung und entfällt bei reduzierter Systembewegung. Die größeren eigenen Randzonen und das freie Aufziehen sind als Desktopbedienung geprüft; ihre endgültige Touch- und Stiftgröße bleibt bis zum Hardwaretest vorläufig.

Als vierte Aktion trägt das Lucide-Druckericon ausschließlich als Tooltip und zugänglichen Namen:

- `Material drucken`
- nur während der Browservorbereitung als knapper Status: `Druck wird geöffnet`

Ein Klick übergibt ein unverändertes Rastermaterial ohne erneutes Engine-Rendering direkt an die Druckansicht. Nur Drehung, Spiegelung oder Beschneidung erzeugen zuvor eine passende flüchtige Rendition. Die Aktivitätsanzeige `Druck wird geöffnet` erscheint unmittelbar, bleibt auch nach Verlassen des Bildes bestehen und sperrt Mehrfachklicks, bis der native System-Druckdialog bereit ist. Chromium verwendet dafür eine isolierte Druckansicht; Safari und die native Mac-App verwenden eine ruhige vollflächige Materialvorschau im Hauptfenster. Die Mac-App öffnet den Systemdialog über denselben nativen WebView-Befehl wie HTML-Druck (D-238), unabhängig vom User-Agent. Sie wartet auf das geladene Druckbild, nicht auf Bildschirm-Animationsframes, damit auch erneutes Drucken nach Abbruch funktioniert. Die Vorschau ist ausschließlich vorübergehendes Feedback und erscheint nicht auf dem Ausdruck. App-Chrome und separat editierbare Tafelraum-Annotationen werden nicht mitgedruckt, damit ein sauberes Arbeitsblatt entsteht. Hoch- oder Querformat folgt der Materialausrichtung. Die Rasterdruckfläche nutzt den verfügbaren A4-Seitenbereich proportional mit genau einem 10-mm-Seitenrand; sie ergänzt kein inneres Padding und übernimmt weder Vorschau-Schatten noch andere Bildschirmdekoration. Quelleigene Weißränder bleiben Bildinhalt (D-239). Für importierte PDF-Seiten verwendet dieser lokale Slice die vorhandene PNG-Seitenrendition; Original-PDF-Druck und eine spätere Option `Mit Annotationen` gehören erst zur Material Surface. Die Druckaktion verändert weder Canvas, Verlauf noch gespeicherten Zustand.

Als symmetrischer Desktop-Schnellweg wechselt ein Doppelklick im aktiven Handmodus auf ein sichtbares Canvasobjekt unmittelbar zu `Auswahl` und wählt dieses Objekt beziehungsweise seinen äußersten Materialverbund. Bei einem bereits vorhandenen Textobjekt oder einer normalen Grundform geht derselbe Doppelklick ohne zweiten Zwischenschritt direkt in die native Textbearbeitung; das gilt auch für freien Text, der als Annotation zu einem Bild oder einer PDF-Seite gehört, ohne dessen Materialzuordnung zu lösen. Eine eigenständige Grundform bleibt auch dann das Doppelklickziel, wenn ihre transparente Innenfläche vor einem Bild liegt; Rechteck, Ellipse und Raute verwenden dafür ihre vollständige, gegebenenfalls gedrehte Geometrie statt nur der sichtbaren Konturlinie. Die Werkzeugleiste folgt dabei auf `Auswahl`. Im aktiven Auswahlmodus wechselt ein Doppelklick auf freie Canvasfläche zurück zu `Hand`, statt dort die native Textanlage zu starten. Audio-, Video-/Web-, Bild-, Freihand-, Abdeckungs- und andere technische Canvasobjekte legen per Doppelklick ausdrücklich keinen Text an. Die sichtbare Werkzeugleiste folgt den Moduswechseln sofort; es erscheint kein Hinweistext oder zusätzlicher Button. Der Schnellweg ergänzt die weiterhin direkt erreichbaren Werkzeugaktionen und legt ausdrücklich keine spätere Touch- oder Stiftgeste fest.

Hand und temporäres Leertaste-Pan verwenden auf dem Desktop denselben stabilen Cursorablauf: Bereit zeigt die Arbeitsfläche die offene Hand, während eines Drags durchgängig die geschlossene Hand. Der Ziehcursor bleibt auch dann bestehen, wenn der Zeiger während der Kamerabewegung über Canvasobjekte, kontextuelle Aktionen oder Einbettungen läuft. Loslassen entfernt nur den flüchtigen Ziehzustand; nach Leertaste-Pan bleibt das zuvor gewählte Werkzeug aktiv. Das temporäre Pan beginnt ausschließlich, wenn die Arbeitsfläche selbst den Tastaturfokus besitzt. Texteingaben, native Bedienelemente und ein aktiv bedienter YouTube-Player behalten die Leertaste für ihre eigene Eingabe beziehungsweise Wiedergabesteuerung; dabei erscheinen weder Handcursor noch Pan-Abdeckung. Es entsteht weder ein zusätzlicher Button noch ein gespeicherter Zustand.

Die native Desktop-Trackpadnavigation bleibt davon unabhängig: Eine unmodifizierte Zwei-Finger-Bewegung verschiebt die Canvas-Kamera auch dann, wenn sie über einer festen, selbst nicht scrollbaren Audio- oder YouTube-Projektionsfläche beginnt; `Ctrl` beziehungsweise `⌘` macht daraus wie auf freier Fläche den Canvas-Zoom. Direkte Klicks und Medienregler bleiben bedienbar. Ein späteres scrollbares Websiteobjekt erhält dafür einen eigenen Interaktionsvertrag statt diese feste-Player-Regel automatisch zu erben.

Für die Desktop-Vorbereitung ergänzt ein fokussicheres Werkzeugkürzelsystem die direkte Leiste: `A` wählt Auswahl, `S` Stift, `M` Marker, `R` Radierer und `T` Text. Die Leertaste bleibt auf der Arbeitsfläche ausschließlich temporäres Pan und verändert das zuvor gewählte Werkzeug nicht. Solange sie gehalten und vom Canvas angenommen wird, übernimmt der Handbutton den sichtbaren Aktivzustand; beim Loslassen oder Fokusverlust springt die Hervorhebung auf das dauerhaft gewählte Werkzeug zurück. Form besitzt bewusst kein Tastenkürzel. Bei vorhandener Auswahl drehen `Q` links und `E` rechts in 15-Grad-Schritten; der normale Tastatur-Repeat setzt die Drehung beim Halten fort. Die Auswahlmitte bleibt dabei stabil, mehrere Elemente drehen gemeinsam um ihre Mitte, und jeder Schritt bleibt über denselben Canvasverlauf rückgängig machbar. Sämtliche verborgenen nativen Engine-Werkzeugkürzel – insbesondere Ziffern sowie Linie, Pfeil, Grundformen, Pinsel, Frame, Laser und Sperren – werden vor der Engine abgefangen und bleiben ohne Wirkung. Die Buchstabenkürzel reagieren weder während einer Text- oder Formulareingabe noch zusammen mit `⌘`, `Strg`, `Alt` oder `Shift`. Sie erscheinen nicht als dauerhafte Zusatzbeschriftung; die bestehenden Werkzeugkürzel stehen nur im Tooltip des vorhandenen Werkzeugbuttons, etwa `Stift (S)`, und werden zusätzlich über `aria-keyshortcuts` ausgezeichnet.

Ein Rechtsklick auf ein Canvasobjekt wählt dieses nach denselben Materialregeln wie ein normaler Auswahlklick und öffnet ein kleines Tafelraum-Kontextmenü mit `Kopieren` und `Löschen`. Eine bereits bestehende Mehrfachauswahl bleibt erhalten, wenn eines ihrer Elemente rechts angeklickt wird. Daneben stehen die plattformgerechten Kürzel `⌘C` beziehungsweise `Strg+C` und `⌫` beziehungsweise `Entf`; die nativen Tastaturwege `⌘/Strg+C`, `⌘/Strg+V`, `Backspace` und `Entfernen` bleiben parallel wirksam. Löschen benötigt keine Bestätigung, weil es vollständig über Undo reversibel bleibt. Das umfangreiche native Engine-Kontextmenü erscheint nicht. Rechtsklick bleibt der bestätigte Desktopzugang; Touch und Stift benötigen weiterhin einen eigenen Hardwaretest.

Eine alleinstehend auf freie Canvasfläche eingefügte `http`- oder `https`-URL öffnet am letzten Zeigerort zuerst eine kompakte einzeilige Eingabe `Was soll angezeigt werden?`. Enter beziehungsweise der Haken bestätigt, Escape beziehungsweise das Schließen verwirft. Erst nach Bestätigung wird die URL im stundenbezogenen `material/links.json` dedupliziert und als ausgewählter nativer Link-Chip an derselben Position angelegt. Der Chip besteht ausschließlich aus einem nativen ruhigen Rechteck mit sanfter Akzenttönung, feiner blauer Kontur und gebundener Nunito-Beschriftung; ein kleines vorangestelltes `↗` macht seine Linkfunktion bereits ohne Hover erkennbar. Er bleibt deutlich leichter als ein App-Button und besitzt weder Schatten noch zusätzliche Aktionsleiste. Auf der Fläche ist ausschließlich die eingegebene Beschriftung sichtbar; die unveränderte Ziel-URL bleibt in der nativen `link`-Eigenschaft von Container und Text und dadurch über Excalidraws Linkaktion beziehungsweise Hover erreichbar. Aus dem Materialarchiv erneut platzierte Weblinks verwenden ihren ruhigen Materialtitel statt der ausgeschriebenen URL. Es entsteht weder eine eigene Linkkarte noch eine Websitevorschau. Paste innerhalb einer Text- oder Formulareingabe bleibt reine Texteingabe. Erkannte YouTube-URLs verwenden weiterhin ohne Beschriftigungsabfrage vorrangig den eigenen stundenbezogenen Playerpfad. Andere URLs bleiben native Links und werden nicht als Website eingebettet.

Die Hover-Buttons bleiben eine Desktop-Abkürzung; die nach Auswahl stehenbleibenden 48-Pixel-Aktionen bilden nur den kleinsten groben Pointerpfad dieses Slices. Die präzisen Abdeckgriffe sind weiterhin Desktop-Controls. Ob Touch und Stift später dieselben Aktionen oder ein kontextuelles Bildmenü verwenden, wird erst am Legamaster entschieden.

`Material hinzufügen` öffnet eine Mehrfachauswahl für PNG, JPEG, WebP, PDF, browserfähiges Audio und MP4-Video. Dieselben Dateien können auf die Arbeitsfläche gezogen werden; während des Ziehens genügt eine ruhige Akzentkontur ohne erklärenden Overlaytext. Dateien aus Auswahl und Drop sowie PNG-, JPEG- und WebP-Bilder aus der Systemzwischenablage werden ohne zusätzlichen Dialog zuerst additiv in der aktiven Stundenbasis gespeichert und anschließend über denselben Canvaspfad platziert. Ein PDF wird lokal in Seitenbilder umgewandelt und horizontal platziert. Jede Seite ist ein eigenständiges Bild und erhält keine gemeinsame Seitengruppe. Während der Umwandlung ersetzt `Wird importiert` kurz das Aktionslabel; Fehler erscheinen knapp und flüchtig nahe der Arbeitsfläche.

Das Bild wird direkt an seiner Fläche verschoben; ein zusätzlicher Verschiebe-Handle wäre redundant. Beim Ziehen des nativen Punktgriffs bleibt das Material selbst ruhig und eine feine blaue Kontur zeigt das Ziel; die dunkle native Zwischenprojektion wird für diesen Materialpfad nicht verwendet. Erst Loslassen übernimmt die Transformation als einen rückgängig machbaren Schritt. Ohne Zusatztaste rastet die Drehung in einer kleinen Toleranz magnetisch bei `0°`, `90°`, `180°` und `270°` ein, damit die ursprüngliche gerade Lage zuverlässig wiedergefunden wird. Außerhalb dieser Toleranz bleibt die Drehung frei. Mit `Shift` rastet sie weiterhin durchgehend in 15-Grad-Schritten. Der Punktgriff bleibt ein erkennbares Desktop-Mausziel; seine endgültige Touch- und Stiftwirkung ist auf der Zielhardware zu prüfen.

Annotationen werden weder in ein Rasterbild noch in interaktives HTML eingebrannt. Stift, Marker und freier Text, deren Mittelpunkt beim Erstellen innerhalb eines Bildes, einer PDF-Seite oder eines lokalen HTML-Materials liegt, werden ohne zusätzlichen Dialog mit dem visuell obersten annotierbaren Material an dieser Stelle gruppiert. Bei aktivem Canvaswerkzeug gibt die HTML-Projektion ihre Trefferfläche vollständig an den Canvas ab; mit Hand oder Auswahl bleibt der HTML-Inhalt direkt bedienbar. Wird das Material ausgewählt oder interaktives HTML an seiner Griffleiste bewegt, folgt dieser Materialverbund. Ein direkter Klick auf eine solche Annotation wählt dagegen dieses einzelne Canvasobjekt innerhalb des Verbunds aus, sodass es unabhängig auf dem Material neu positioniert werden kann, ohne seine Zuordnung zu verlieren. Grundformen sind davon bewusst ausgenommen: Rechteck, Ellipse und Raute dürfen optisch auf Material liegen, bleiben einschließlich ihres gebundenen Formtexts aber eigenständige Canvasobjekte und bewegen sich nicht mit. Bereits gespeicherte Formen verlieren beim Laden ausschließlich die frühere spezielle Bildgruppenzuordnung; normale Benutzergruppen und die Form-Text-Bindung bleiben erhalten. Skalieren und Drehen eines nativen Materialverbunds, Undo/Redo und lokaler Reload behandeln nur die tatsächlich materialgebundenen Annotationen als Verbund. Andere Inhalte außerhalb eines annotierbaren Materials oder einer normalen Form bleiben unabhängige Canvasobjekte. Bei Überlappung gewinnt für neue freie Textannotationen das visuell oberste annotierbare Material; für Stift und Marker entscheidet die visuell oberste geeignete Form oder das Material darunter; vollständiges Ablösen dieser Annotationen und manuelles Umordnen sind noch offene Material-Surface-Interaktionen.

Lokales HTML erscheint auf der Lehrerfläche als eine einzige Materialoberfläche. Der Tafelraum-Frame übernimmt dieselbe ruhige Rundung und denselben optionalen Materialschatten wie der lokale Videoplayer; Iframe und Paket ergänzen weder Kontur noch helle Ecke oder zweiten Außenschatten. Das Paket reicht im Bildschirmmedium bis an diese Kante. Bei ausdrücklich deklarierter A4-Druckfähigkeit verwendet bereits dieser äußere Frame die vollständige Hoch- oder Querformatproportion des späteren Blatts; ungenutzter Raum bleibt als Blattfläche sichtbar. Es entsteht dennoch kein zusätzlicher heller Browser-Vorschauboden um das Papier. Pakete ohne Druckfähigkeit bleiben frei responsiv. Die dauerhafte Griff- und Zoomleiste bleibt als funktionale Tafelraum-Ebene erhalten und skaliert weiterhin gemeinsam mit dem Canvasobjekt.

Deklariert ein HTML-Paket eine A4-Druckvorlage, erscheint bei Auswahl das vorhandene Lucide-Druckericon `Material drucken` in derselben äußeren Materialaktionsreihe. Es öffnet ohne Zwischendialog eine frische, saubere Vorlageninstanz im Systemdruckdialog; der aktuelle Eingabe- oder Spielstand wird nicht übernommen. Pakete ohne Druckfähigkeit zeigen weder ein ausgegrautes Icon noch erklärenden Text. Damit bleibt die Oberfläche gleichartig, ohne Spiele pauschal als Arbeitsblatt zu behandeln. Zuschneiden bleibt ausschließlich Rastermaterial vorbehalten.

Neue Stift- und Markerzüge auf einer normalen Form bilden mit Form und gebundenem Text einen eigenen Canvasverbund. Der Mittelpunkt des Zugs muss innerhalb der tatsächlichen Formkontur liegen; bei einer Form über einem Bild gewinnt die Form. Verschieben, Skalieren, Drehen, Undo/Redo und Reload behalten diese Zuordnung. Die Formauswahl zeigt weiterhin ihre Formatpalette und Abdeckungsaktion; ein direkt gewählter Zug bleibt einzeln versetzbar, und Doppelklick öffnet den Formtext auch aus dem Handmodus. Eine vorhandene volle Abdeckung nimmt diese Züge beim Verschieben mit und löst beim Entfernen nur ihre vorübergehende Gruppe. Bereits vorhandene lose Striche werden nicht allein wegen räumlicher Überlappung rückwirkend zugeordnet.

Beim Ziehen eines Größenhandles an einer beschrifteten Form bleibt der Text durchgehend sichtbar. Die schon geladene Textgrafik überbrückt den ersten Frame; anschließend zeichnet die vorhandene direkte Vorschau den neuen Umbruch. Erst nach dem Loslassen und Laden der endgültigen Grafik übernimmt wieder die Canvasdarstellung. Ein technischer Bildplatzhalter gehört nicht in diese laufende Transformation.

Der Radierer entfernt einzelne Annotationen, nicht das darunterliegende Bildmaterial oder die beschriftete Form. Das ist keine zusätzliche sichtbare Betriebsart: Der Canvas-Adapter schützt Rasterbilder und gebundene Formtexte während des Radierens und stellt den verbleibenden Annotationsverbund beim Werkzeugwechsel automatisch wieder her.

Undo und Redo bleiben als globale Verlaufsaktionen unabhängig von der Dockposition stabil und immer horizontal nebeneinander oben rechts auf der Canvasfläche. Sie gehören nicht zur beweglichen Werkzeuggruppe und stehen bei geöffnetem Materialbereich mit 12 Pixel Abstand unmittelbar links neben dessen Ablage. Werkzeugleiste, Verlauf und Materialbereich werden anhand ihrer tatsächlich belegten Rechtecke angeordnet: Solange die obere Reihe ausreicht, bleiben alle Kontrollen dort; erst eine reale Überlagerung verschiebt die betroffene Gruppe unter die obere Leiste. Während die Werkzeugleiste frei gezogen wird und in ihre Dockposition gleitet, bleiben Verlauf und Materialbereich an ihrer zuletzt gültigen Position; erst nach dem Einrasten wird ihre Geometrie einmalig aus der Endposition neu geplant. Es gibt dafür keinen pauschalen Viewport-Breakpoint und der Materialbereich rutscht bei oberem oder unterem Dock nicht grundsätzlich aus dem Weg. Bei rechter Dockposition stehen Verlauf und Materialbereich entsprechend links neben der Leiste; die Development-Zoomkontrolle folgt spiegelbildlich an der Unterkante. Dadurch verändern Browserzoom und vertikales Docking weder Leserichtung noch Gruppierung und erzeugen keine unruhige große Lücke.

Reicht die verfügbare Länge der angedockten Werkzeugleiste bei Browserzoom, kleinem Tablet oder niedrigem Board-Viewport nicht für alle Werkzeuge, bleibt die Leiste selbst eine geschlossene Fläche. Werkzeuge und Labels werden weder verkleinert noch aus der Rundung herausgeschoben. Stattdessen scrollt ausschließlich die geordnete Werkzeugspur horizontal beziehungsweise vertikal; Wischen funktioniert direkt auf der Spur. Ein dezenter Fluent-Chevron mit mindestens `48 × 48 CSS-Pixel` Zielgröße erscheint nur an einer Richtung, in der weitere Werkzeuge liegen, und blättert einen gut überlappenden Abschnitt weiter. Ziehgriff und sichtbare Kontextflächen bleiben außerhalb der geschnittenen Spur. Damit bleibt dieselbe Werkzeugreihenfolge an allen vier Dockseiten erhalten; ein zweites Menü oder eine responsive Ersatzleiste entsteht nicht.

Der Stundentitel wird im lokalen Planungsslice über das bestehende Kontextmenü im Archiv inline umbenannt. Die Kopfzeile zeigt denselben aktiven Titel mittig und einzeilig als reine Anzeige; lange Titel werden dort gekürzt, ohne einen zweiten Bearbeitungsort zu erzeugen. Das separate Unterrichtsdatum bleibt links als knappe zeitliche Orientierung sichtbar, sofern es für die aktive Stunde vorhanden ist.

Pencil V2 (D-100): Neue Stiftzüge wirken wie ein sauberer Monoline-Fineliner, nicht wie ein texturierter Bleistift. Vier vorhandene Breitenstufen entsprechen ungefähr 2/4/8/14 Canvas-Einheiten Durchmesser. Feste Breite unabhängig von Eingabegeschwindigkeit und Druck, runde Enden und Verbindungen, volle Deckkraft. Keine zusätzliche Positionsträgheit, automatische Formkorrektur, Breitenanimation oder Regler; native lokale Freihandglättung bleibt. Loslassen darf keine neue Kontur erzeugen. Bestehende Striche werden nicht verändert. Mausprüfung ersetzt keinen Finger-/Stifttest auf iPad 9 und Legamaster.

Marker-Invariante (Nachprüfung 5. September 2026): Mehrfaches Überfahren innerhalb desselben Zugs vereinigt die gemalten Flächen bei gleichbleibender Deckkraft; Überkreuzungen dürfen keine Aussparungen erzeugen. Tatsächlich unbemalte Innenräume, beispielsweise innerhalb eines Kreises, bleiben frei. Getrennte Markerzüge bleiben getrennte Objekte und dürfen sich entsprechend ihrer Transparenz farblich überlagern.

Ein ausgewähltes Markerband zeigt ausschließlich den ruhigen nativen Begrenzungsrahmen mit Größen- und Drehgriffen. Seine vielen technisch notwendigen Polygonpunkte sind keine fachlich sinnvollen Einzelgriffe und bleiben ebenso verborgen wie der native Hinweis zur Linienpunktbearbeitung. Gewöhnliche Linien- und Pfeilobjekte werden dadurch nicht umgedeutet.

## Darf nicht erscheinen

- Begrüßung, Einleitung, Tutorial oder erklärender Absatz;
- Dashboard, Startseite, Fächerbaum, Reihen- oder Stundenarchiv;
- Sidebar-Navigation außerhalb der getesteten Werkzeugleiste;
- Videoeditor, Presenter-, Schüler-, Kamera-, LIVE-/GEHALTEN- oder KI-Funktion; der stundenlokale MP4-Player ist gemäß D-135 ausdrücklich Teil des Materialslices;
- globale Materialbibliothek, Vorlagenbereich oder umfangreiche Einstellungen; ausgenommen ist der ausdrücklich in `04_LESSON_MATERIAL_DRAWER_UI_BRIEF.md` begrenzte aktive Stundenmaterialbereich;
- deaktivierte Vorschau späterer Funktionen;
- mehrere Karten, Statistikflächen, Badges oder Marketingelemente;
- Glas-/Blur-Schichten auf zentralen Bedienelementen;
- zusätzliche erfundene Buttons, Texte oder Unterrichtsinhalte;
- sichtbarer Development-Umschalter innerhalb der Produktoberfläche.

Das Toolbar-Docking ist eine Surface-Lab-Testinteraktion und wird nicht als Produktnavigation gestaltet. Dauerhafte Positionsbuttons erscheinen nicht. Query-Parameter dürfen reproduzierbare Testzustände direkt setzen.

## Gemeinsamer visueller Rahmen

- ruhig, professionell und minimalistisch;
- je Theme überwiegend neutrale helle beziehungsweise warme graphitfarbene Flächen;
- dunkles Graphit im hellen Theme und gebrochenes Weiß im dunklen Theme für Text und Icons;
- Selektionsrahmen und Auswahlgriffe verwenden in beiden Themes den jeweiligen semantischen Akzent und bleiben insbesondere auf der dunklen Canvasfläche klar erkennbar;
- eine sparsame blaue Akzentfarbe;
- Gelb nur als funktionale Marker-/Hervorhebungsfarbe;
- große, klar getrennte Touchziele;
- konsistente, nicht übermäßig runde Bedienelemente;
- subtile Tiefe nur zur Trennung von Controls und Canvas;
- keine verspielte oder kindliche Whiteboard-Optik.

Warme und kühlere Neutraltöne, eine helle oder kontrastreiche Werkzeugleiste sowie flachere oder leicht räumliche Controls dürfen in Runde 0 bewusst verglichen werden. Konkrete Farbwerte, Schatten, Radien und endgültige Größen bleiben bis zum Mockupvergleich und Hardwaretest vorläufig.

Originalmaterial bleibt in beiden Themes fachlich unverändert. Helle Bilder oder PDFs dürfen auf der dunklen Grundfläche als klar begrenzte Papierobjekte erscheinen; automatische Invertierung oder Umfärbung ist ausgeschlossen.

Text, Stiftzüge und Material werden während des Qualitätsvergleichs mindestens mit zwei Renderpixeln pro CSS-Pixel gezeichnet; höhere native Displaydichten bleiben erhalten. Die höhere Dichte ist eine Surface-Lab-Testentscheidung und muss hinsichtlich Renderperformance am Legamaster validiert werden.

## Invarianten der Stilrichtungen in Runde 0

- Werkzeuggruppe unten;
- identischer Seitenaufbau und identische Informationsarchitektur;
- identische Werkzeug- und Aktionsreihenfolge;
- identische Texte und Unterrichtsinhalte;
- identischer Canvas-Ausschnitt und identische Objektpositionen;
- identischer aktiver Zustand: Hand ausgewählt, kein Werkzeugkontext geöffnet;
- identische ungefähre Touchzielgrößen und Abstände;
- identisches Seitenverhältnis und vergleichbare Bildqualität.

## Invarianten zwischen Dockpositionen in Runde 1

- identischer Canvas-Ausschnitt und identische Objektpositionen;
- identische Kopfzeile;
- identische Werkzeugreihenfolge;
- identische Aktionsreihenfolge;
- identische Touchzielgrößen und Abstände;
- identische visuelle Hierarchie;
- identischer aktiver Zustand: kein Werkzeugkontext geöffnet;
- identisches Seitenverhältnis und identische Bildqualität.

## Abnahme der Mockups

Ein Mockup ist für die Diskussion geeignet, wenn:

- die Arbeitsfläche klar dominiert;
- die primären Werkzeuge ohne erklärenden Text auffindbar sind;
- Werkzeugwahl und globale Aktionen als unterschiedliche Gruppen erkennbar sind;
- kein sichtbarer Text redundant ist;
- keine Funktion außerhalb von Prototyp 0.1 dargestellt wird;
- die Dockzustände tatsächlich nur die Werkzeugposition vergleichen;
- die Darstellung keine Aussage über validiertes Touch-/Stiftverhalten behauptet.
- es ausdrücklich als Surface-Lab-Test-Shell und nicht als endgültige Unterrichtsrolle verstanden wird.


## Textgeometrie beim Skalieren (D-232)

Ein Eckzug an einer formatierten Textbox skaliert Rahmen und alle Zeichenspannen gemeinsam; gemischte Schriftgrößen behalten ihr Verhältnis. Seitliche Griffe ändern Breite und Umbruch bei unveränderter Schriftgröße. Während der Geste darf die abgeleitete Rich-Text-Sichtfassung die native Gestengeometrie nicht zurücksetzen. Inhalt, Absatzstruktur und Formatierungsmerkmale bleiben erhalten; Rückgängig umfasst die ganze Größenänderung. Keine zusätzlichen Bedienelemente.

### Radierer (D-234)

Der Radierer entfernt ausschließlich Stift- und Markerstriche. Text, Formen und Material bleiben erhalten; zum Entfernen solcher Objekte dient die bestehende Auswahl. Die Regel gilt gleichermaßen in Lehreransicht und Room Canvas.

Marker-Radierkontakt folgt seit D-235 der sichtbaren Kontur mit vier CSS-Pixel Toleranz. Leere Rahmenbereiche, echte Innenlöcher und unsichtbare Brückenkanten lösen keine Löschung aus. Ganze Striche bleiben die kleinste Radieraktion.

## Absatzweise Textausrichtung (D-236)

- Ohne Zeichenmarkierung richten Links/Zentriert/Rechts die ganze Textbox aus, auch bei einer einzelnen Einfügemarke. Mit Zeichenmarkierung gelten sie für alle berührten Absätze; eine Teilmarkierung richtet den gesamten betreffenden Absatz aus. Endet die Markierung genau am Beginn des nächsten Absatzes, bleibt dieser unverändert.
- Absätze werden durch Enter getrennt. Automatischer Zeilenumbruch erzeugt keinen neuen Absatz und bleibt bei Breitenänderung flexibel. Keine erzwungenen Umbrüche durch Ausrichten.
- Die vorhandenen drei Ausrichtungstasten bleiben erhalten. Bei gemischtem Zielzustand ist keine Taste aktiv. Tooltips benennen `Markierte Absätze …` beziehungsweise `Ganze Textbox …`. Die Zeichenmarkierung bleibt nach Formatieren erhalten; kein zusätzlicher Dialog oder Modus.


## Textfarben beim Einfügen und Themewechsel (D-237)

- Neuer externer Clipboardtext erhält die aktuelle neutrale Schriftfarbe und volle Deckkraft, unabhängig vom zuvor benutzten Zeichenwerkzeug.
- Bei Hell/Dunkel-Wechsel folgen freie neutrale Textfarben automatisch, auch innerhalb formatierter Textboxen. D-275 nimmt material-/formgebundene Annotationen aus: deren Farbe bleibt passend zum unverändert dargestellten Material erhalten. Akzentfarben und sonstige Formatierungen bleiben erhalten.
- Canvasobjekt-Kopien behalten ihre Formatierung; Einfügen in einer bereits geöffneten Texteingabe folgt deren vorhandener Formatierung. Keine zusätzliche Einstellung oder sichtbare Pasteoption.

## Abgerundete eingefügte Bilder (D-248)

- Neu über Dateiauswahl, Drop, Zwischenablage oder Stundenmaterial eingefügte Bilder erhalten native adaptive Ecken mit 20 Canvas-Einheiten Radius, bei kleinen Bildern höchstens ein Viertel der kürzeren Kante. Eine pointerdurchlässige feine Innenkontur folgt demselben Radius, Canvaszoom, Rotation und Deckkraft. Sie bleibt auch bei ausgeschaltetem Materialschatten sichtbar.
- PDF-Seiten behalten ihre rechteckige Blattkante. Bestehende Objekte werden nicht nachträglich umgestaltet; Objektkopien behalten ihre gespeicherte Rundung. Keine weitere Einstellung, kein zusätzlicher Rahmen als Canvasobjekt.
- Rundung liegt im vorhandenen nativen `roundness`-Feld und folgt Crop, Undo/Redo, Reload, PNG-Clipboard und sicherer Room-/Remote-Rasterprojektion. Kontur und optionaler Schatten sind lokale Darstellungs-UI; Originaldateien bleiben unverändert.
- Prüfflow: Bild und PDF platzieren, Schatten aus/ein, Hell/Dunkel, Zuschneiden, Drehen, Größenänderung, Undo/Redo und Reload. Desktopprüfung ersetzt keine Legamaster-Abnahme.

**Prüfstand 10. Oktober 2026:** Typprüfung, allgemeine App-Tests, Live-Tests, Webbuild und lokaler nativer Appbuild erfolgreich. Isolierter Browser-Kernflow mit synthetischem Bild prüft Schatten aus/ein, Hell/Dunkel, Crop, Rotation, Undo/Redo und Reload. PNG-Pixelprüfung bestätigt transparente Ecke und deckende Bildmitte; öffentliche Materialprojektion und Stundenflush erfolgreich. Wiederholbarer Einstieg: `node scripts/live-canvas-browser-check.mjs --clips` mit Node ≥22.18, danach `/src/canvas/image-appearance.browser.html`. Kein produktives Archiv verwendet. Die anschließende native WebKit-Bedienprüfung und Veröffentlichung sind im Release-Nachtrag unten dokumentiert; reale Touch-/Stiftprüfung bleibt offen.

### Abdeckung gerundeter Bilder (Ergänzung D-248)

Die graue Abdeckung folgt der kreisförmigen Bildkontur einschließlich adaptivem Radius. Beim Verschieben/Verkleinern bleibt sie der Schnitt dieser festen Kontur mit dem bisherigen Abdeckrechteck; die innere Aufdeckkante bleibt gerade. Die vorhandene native Polygonabdeckung, Sweep-Animation und öffentliche Projektion werden wiederverwendet. `coverRect` bleibt die einzige normalisierte Abdeckgeometrie; Polygonpunkte sind daraus abgeleitet. PDF-Seiten und eckige Altbilder behalten rechteckige Abdeckungen.

**Abdeckprüfung 10. Oktober 2026:** 276 allgemeine App-Tests, 85 Live-Tests und Typprüfung erfolgreich; drei zusätzliche Geometrietests sichern Kreisradius, gerade Aufdeckkante und adaptive Rundung kleiner Bilder. Browser-Kernflow über die tatsächliche Bildaktion: Vollabdeckung, Kante ziehen zur Teilabdeckung, Bildzuschnitt, Undo/Redo, Speichern, Reload und öffentliche Materialprojektion erfolgreich. Visuelle Evidenz: `output/image-appearance/rounded-cover.png`. Lokaler nativer Appbuild geprüft. Anschließend im getrennten ARM64-WKWebView-Bundle mit neutralem Profil über die echte Dateiauswahl ein Bild importiert, ausgewählt, vollständig abgedeckt und durch Ziehen der Kante teilweise aufgedeckt: gerundete Außenkante und gerade Aufdeckkante bestätigt. Prüfbeleg: `output/release-0.1.44/native-rounded-cover.png`. Seit 10. Oktober 2026 in Update 0.1.44 veröffentlicht; reale Touch-/Stifthardware bleibt praktische Abnahme.

### Abdeckungsicon als wechselndes Auge (13. Oktober 2026)

Nach Vergleich mit einer Jalousie wählt der Nutzer Lucide `Eye` / `EyeOff` für sämtliche Abdeckungsaktionen bei Bild/PDF, lokalem HTML, Video, freiem Text und Formen. Das Symbol zeigt den Zustand: ohne Abdeckung offenes Auge, mit vorhandener Abdeckung durchgestrichenes Auge. Klick wechselt weiterhin zwischen `Abdeckung hinzufügen` und `Abdeckung entfernen`; Tooltip und zugänglicher Name benennen die nächste Aktion, `aria-pressed` den vorhandenen Abdeckungszustand. Auch bei Teilabdeckung gilt `EyeOff`, solange eine Abdeckung vorhanden ist. Formauswahl behält ihr Rechtecksymbol. Die beschrifteten Vorschauaktionen dürfen weiterhin `Eye` nutzen; Werkzeugleisten werden weiterhin über X geschlossen. Keine Änderung von Touchzielen, Abdeckungsgeometrie, Animation oder Speicherung. Prüffrage: Sind beide Zustände unmittelbar unterscheidbar und wechselt das Symbol nach Klick, Undo und Redo? Desktopprüfung bestätigt keine Board-Abnahme.

## Neutrale Stiftfarbe am Startpunkt (D-276, 18. Oktober 2026)

Auf der Lehrerfläche wählen neutrale Schwarz-/Weiß-Stiftfarben beim Aufsetzen den
passenden Kontrast aus derselben lokalen Untergrundprobe wie neue Texte. Helle
Bild-/PDF-Fläche und weiße lokale HTML-Papierfläche ergeben Schwarz, dunkler Grund
Weiß. Akzentfarben bleiben explizit. Der gesamte Strich behält die am Startpunkt
gewählte Farbe, auch über Blattkanten hinweg. Kein kontinuierliches Umfärben,
neuer Modus oder zusätzliches Farbsystem; Marker unverändert.

Die Auswahl in der Palette bleibt die bevorzugte neutrale beziehungsweise explizite
Farbe; die tatsächlich gespeicherte Strichfarbe ist die einmalig gewählte Farbe.
Material-/formgebundene native Stiftstriche behalten sie beim Themewechsel/Reload.
Freie neutrale Striche folgen weiterhin dem Theme. Bestehende Striche werden nicht
nachträglich anhand ihrer Pixelposition analysiert. Room erhält in diesem Slice
keine eigene Startpunktanalyse; gemeinsamer Commit-/Wirepfad bleibt unverändert.

## D-299 – Materialaktionen an der unteren sichtbaren Seite

28.10.2026, Nutzerbeobachtung: Die Aktionsgruppe soll näher am sichtbaren Material
liegen. Bilder, HTML, Videos und registrierte Apps bevorzugen die rechte, dann die
linke Außenkante; die Gruppe sitzt möglichst im unteren sichtbaren Teil dieser
Kante. Reicht der Platz nicht oder liegt dort anderes Material, entscheidet die
beste verfügbare Seite; die Gruppe bleibt im Viewport. Derselbe Layoutpfad erhält
Rotation und die vorhandenen32-/48-px-Ziele. Textaktionen behalten ihren eigenen
Oben-/Unten-Vertrag. Keine neue Geometrie, Archiv-/Clip-/Persistenzänderung.

Der frühere zusätzliche HTML-Abstand von70×Canvaszoom sowie das Hindernis für die
seit D-298 entfernte Zoomleiste entfallen. Ein bei gesperrtem HTML weiterhin
vorhandenes Entsperren bleibt als Hindernis berücksichtigt. Tests: partielle
Sichtbarkeit, Rotation/Nachbarn, Bild/Arbeitsblatt/Language Bite im Browser und
Touchsimulation; Zielhardware bleibt separat zu prüfen. Entwicklungsstand, noch
nicht in der Desktop-App installiert oder veröffentlicht.


## UI-Review 29.10.2026 – Aktionshierarchie (Vorschlag, noch nicht umgesetzt)

Urteil: **überarbeiten**. Grundlage: installierte0.1.84, Screenshot der Stunde
„Achmed“, aktuelle Shell und deren CSS. Dies ist keine Latenzmessung.

- Kopfzeile: Präsentation steht neben vier gleichrangigen Utilitysymbolen.
  Die allgemeine Merkliste ist mit D-307 entfernt. Version/Updates wird selten
  gebraucht und sollte später im vorhandenen Einstellungsmenü erreichbar sein;
  verfügbare Updates müssen weiterhin auffindbar bleiben.
- Canvas: Schülernotizen sind ein nacktes Icon neben zwei gerahmten,
  schattierten Kreisen. Funktionale Nachbarschaft wirkt dadurch zufällig.
  Nächste einzelne Designhypothese: eine kleine ruhige Aktionsgruppe mit gleichen
  sichtbaren Buttonformen und getrennten Bereichen für Notizen und Undo/Redo.
  Bestehende48-px-Ziele, stabile Position und Kollisionsmessung behalten.
- Untere Leiste: Werkzeugwahl, Präsentationsgeste, Material, Apps, Widgets und
  Inhaltsnavigation werden gleichrangig angeboten; im Screenshot entsteht bereits
  horizontaler Überlauf. Später zuerst Einfügeaktionen bündeln und Clipaufnahme
  näher an Präsentation prüfen, statt alle Labels zu entfernen. Mehrklickkosten
  und Auffindbarkeit separat bewerten; keine zusätzliche dauerhafte Leiste.
- Rotes X zum Ausblenden wirkt wie eine destruktive Aktion. In einer späteren
  eigenen Iteration ein neutrales Einklappsignal prüfen, Lehrer und Room gemeinsam.

Keine dieser weiteren Hypothesen ist bereits implementiert. Keine neue
Dependency, Layoutengine, Datenmigration oder automatische Funktionsverlagerung.
Browservergleich mit Hell/Dunkel, schmalem Fenster und allen Docks erforderlich;
Touch-/Stiftabnahme bleibt separat.


## D-309 – Gemeinsame flache Canvasaktionen

29.10.2026, ausgewählter ImageGen-Entwurf auf ausdrücklichen Nutzerauftrag.
Handlung: Stundennotizen und Undo/Redo direkt erreichen. Drei48×48-px-Ziele
in einer gemeinsamen neutralen Fläche, Reihenfolge `Stundennotizen`,
`Rückgängig`, `Wiederholen`; keine dauerhaft sichtbaren Labels. Tooltip und
zugängliche Namen bleiben. Ein kurzer dezenter Trenner nach dem Notizbutton.
12-px-Außenradius, feine Kontur, flache Themefläche ohne Schatten oder Blur;
8-px-Buttonradius, gleiche Icongröße/-stärke. Hover/Fokus und geöffnete Notizen
bleiben lokal erkennbar. Ausreichende kontrastreiche Tastaturkontur.

Das vorhandene gemessene Chrome-Layout positioniert die gesamte Gruppe weiterhin
abhängig von Werkzeugdock und Materialablage. Keine neue Geometrie oder eigene
Positionierung der Einzelbuttons. Keine Änderung an Notizpersistenz, Canvas-
Undo/Redo, Room/Remote oder der unteren Leiste. Allgemeine Merkliste entfällt
wie in D-307. Der übrige UI-Review bleibt Vorschlag.

Referenz: `output/canvas-ui-review-2026-10-29/mockup/canvas-actions.png`.
Abnahme: Hell/Dunkel, alle vier Docks, schmaler Desktop, Materialablage,
Tastaturfokus, Notiz-Autosave und Undo/Redo in getrennten Testdaten. Desktop-
und simulierte Touchprüfung ersetzen kein reales Touchboard.

## D-314 – Kompakte Werkzeugleiste und Aktionsorte

29.10.2026, ausgewähltes Gesamtmockup und ausdrücklicher Umsetzungsauftrag.
Die dockbare Lehrerleiste enthält sieben Grundwerkzeuge und direkte Einstiege
`Material`, `Apps`, `Widgets`; Material behält den zugänglichen Namen
`Material hinzufügen`. Abstände nach Auswahl und Radierer gliedern die Werkzeuge.
Ein neutraler, zur Dockkante gerichteter Chevron blendet die Leiste aus.
Bisheriger Wiederöffner und `^` bleiben. Die Room-Leiste ist nicht betroffen.

`Zeiger` und `Clip aufnehmen` stehen mit `Präsentieren` in der Kopfzeile;
`Inhalt finden` steht vor Notizen/Undo/Redo in der flachen Canvasaktionsgruppe.
Dieselben Komponenten, Befehle, Tastenkürzel und Zustände bleiben maßgeblich.
Die Kopfzeile verwendet dort Lucide, die dockbare Leiste weiterhin Fluent.
Der Titel erhält den verfügbaren Platz und wird nötigenfalls gekürzt.
Containerabfragen berücksichtigen auch die geöffnete Archivnavigation:
unter1050px verfügbarem Kopfzeilen-Innenraum entfallen Datum und die sichtbaren
Labels für Zeiger/Clip, unter620px auch das Präsentationslabel. Vollständige
zugängliche Namen, Tooltips, aktive Zustände und48-px-Ziele bleiben erhalten.
Keine neue Einstellung oder automatische Umordnung der Werkzeuge.
Die vorhandene Überlaufnavigation hält bei sehr engem Canvas alle Werkzeuge
und Einfügeaktionen erreichbar. Die bestehende Rechteckplanung berücksichtigt
die größere Canvasaktionsgruppe gemeinsam mit Materialablage und allen Docks.

Referenz: `output/toolbar-mockup-2026-10-29/selected-layout.png`.
Browserprüfung: beide Themes, Chromium/WebKit, alle Docks,1440/960/800px,
Materialablage, Notizen, Menüs, Präsentationspanel, Zeigerstil und Clipgeste.
Reale Touch-/Stiftabnahme bleibt separat; Mockupabstände sind keine Pixelspezifikation.

## Speicherabschluss und Entwurfswiederherstellung (29.10.2026)

Bei abweichendem Archivstand und ausstehendem lokalen Entwurf erscheint vor
Canvasfreigabe ein Dialog „Welche Fassung öffnen?“ mit „Archiv öffnen“ und
„Entwurf wiederherstellen“. Der Text nennt das Verwerfen des Entwurfs und die
Sicherung der ersetzten Archivfassung in der Historie. Keine automatische Wahl
bei Konflikt; gleiche bestätigte Revision erlaubt automatische Entwurfsaufnahme.
Native Beenden-/Updateaktionen zeigen während des abschließenden Speicherns
„Wird gespeichert …“. Fehler lassen die App geöffnet und nennen den Fehler.
Kein zusätzlicher Speicherbutton, Datenmodell oder konkurrierender Speicherpfad.
Abnahme: Wiederherstellung, beide Konfliktentscheidungen, Cacheausfall, Speichern
mit laufender Notizanforderung; Dialoge in Hell/Dunkel mit Tastatur prüfen.


## Distributionsumfang D-330 (29.10.2026)

Die persönlichen Funktionen dieses Briefs bleiben im persönlichen Build erhalten.
Der öffentliche Export bietet keine Appauswahl/Lerndeck-Verbindung, keinen
KI-Anschluss und keine Remote-Auswahl/-Einrichtung. Präsentieren bietet weiterhin
Room Canvas mit denselben Clip-, Material- und Eingabepfaden. Die Versionsanzeige
heißt dort `Version` und bietet keine Updateprüfung. Keine leeren/deaktivierten
Vorschauen dieser entfernten Anschlüsse; kein neuer Erklärtext auf der Arbeitsfläche.
Browserabnahme in Hell/Dunkel; Hardwareabnahmen bleiben separat. Umfang und
Prüfweg in [Vertrag61](../implementation/61_DISTRIBUTION_BOUNDARY.md).

## Sprache der Oberfläche (30.10.2026)

Die bestehende Einstellungsfläche erhält die ausdrücklich beauftragte Auswahl
`Deutsch` / `English`; sichtbare Texte dieses Briefs sind deutsche
Quelltexte mit englischen Entsprechungen im zentralen Katalog. Sofortiger Wechsel
ohne Veränderung von Stunde, Kamera oder Werkzeug. Inhalte bleiben unverändert.
[Sprachbrief32](32_UI_LANGUAGE_UI_BRIEF.md) und [Vertrag64](../implementation/64_UI_LANGUAGE.md).


## Einstellungen und einheitliches Einklappen (30.10.2026)

Beauftragte Handlung: Version/Updates gezielt öffnen und Werkzeuge ausblenden.
Die Kopfzeile enthält neben Präsentationsaktionen nur Einstellungen und Vollbild
als Utilities. `Einstellungen → Version und Updates` öffnet den bestehenden
Versionshinweis; öffentlich heißt der Eintrag ausschließlich `Version`. Kein
separater Infobutton. Ein verfügbarer persönlicher Updatefund markiert den
Einstellungsbutton mit einem ruhigen Akzentpunkt sowie Tooltip/zugänglicher
Beschreibung. Keine wiederkehrende Pulsanimation. Native Statusverwaltung bleibt
dauerhaft eingebunden, unabhängig vom geöffneten Einstellungsmenü. Automatischer
Hinweis weiterhin einmal je gefundener Version und erst außerhalb einer
Präsentation; Installation erst über den vorhandenen nativen Entscheidungsweg.
Escape/Schließen kehrt zum Einstellungsbutton zurück.

Room verwendet zum Ausblenden denselben neutralen Fluent-Chevron wie die unten
angedockte Lehrerleiste; Wiederöffner, Position und Werkzeuge bleiben erhalten.
Keine neue Einstellung, Persistenz oder Änderung der Materialaktionen.
Abnahme: Chromium/WebKit, Hell/Dunkel, schmale Fenster, Tastatur, Room
aus-/einblenden, Updatefund/Fehler/Präsentationsschutz mit simulierter nativer
Schnittstelle und öffentliche Abwesenheit der Updatebefehle. Quelle ist kein
Appupdate; echter nativer Updateversuch und Touchboard bleiben separate Abnahmen.


## Geordnetes Einstellungsmenü (30.10.2026)

Nutzerauftrag: Sprachwahl eleganter und gesamte Einstellungen übersichtlicher.
Die aktuelle Sprachpräzisierung verwendet einen eigenen Eintrag `Sprache`
mit nativem Dropdown `Deutsch 🇩🇪`/`English 🇬🇧` oben im Darstellungsblock.
Gleiche48-px-Geometrie und Chevron wie Design; kein neues Sprachmodell oder
Speichern/Übernehmen-Schritt.
Darunter gruppiert `Darstellung` die Zeilen `Hell / Dunkel`, `Design` und
`Sprache`; `Verbindungen` enthält Agentenzugang und je Profil vorhandene
persönliche Anschlüsse. Ein letzter, abgetrennter Block enthält `Tastenkürzel`
und `Version und Updates` beziehungsweise öffentlich `Version`. Keine leeren
privaten Einträge, Karten oder zusätzlichen Untermenüs.

Gemeinsame Einzüge und Kontrollbreiten, ruhige Gruppentitel,48-px-Ziele und
sichtbarer Tastaturfokus. Das Popover passt sich der verfügbaren Fensterbreite
an und scrollt intern in niedrigen Fenstern; alle Aktionen bleiben erreichbar.
Bestehende Dialoge, Theme-/Sprachpräferenzen, Updatehinweise und Datenschutzgrenzen
bleiben erhalten. Abnahme: DE/EN, Hell/Dunkel, Desktop und schmal/niedrig,
Tastatur, geöffneter Room, unveränderte gespeicherte Szene und beide Profile.
Hardwareannahmen für Touch/Stift bleiben separat.


## Kompakte gemeinsame Dropdowns (31.10.2026)

Persönlich und öffentlich verwenden dieselbe Reihenfolge oben: `Hell / Dunkel`,
`Design`, `Sprache`. Nur die tatsächlich angebotenen Anschlüsse und Updateaktionen
unterscheiden sich. Dropdowns stehen in einer gemeinsamen rechten Spalte mit
maximal128px Breite innerhalb ihrer Zeile; das Popover ist maximal280px breit
und berücksichtigt auch bei320px Fensterbreite den rechten Toolbarabstand.
Die Bedienhöhe bleibt mindestens48px. Kein zusätzlicher Einstellungszustand,
keine neue Sprach-/Themelogik. Browserabnahme in beiden Profilen: bündige Controls,
kein horizontaler Überstand, Desktop/schmal/niedrig sowie unveränderte Bedienung.


Nachtrag31.10.2026: Design- und Sprachdropdown zeigen eine36px hohe sichtbare
Fläche, mittig in der48px-Einstellungszeile. Das native Select behält seine48px
aktive Höhe; Hintergrund, Kontur, Hover und Fokus zeichnen sich an der flacheren
Fläche. Beide Profile nutzen dieselbe Darstellung und Reihenfolge.
