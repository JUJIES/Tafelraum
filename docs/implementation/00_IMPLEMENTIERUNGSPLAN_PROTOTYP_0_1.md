# Implementierungsplan – Prototyp 0.1 „Teaching Surface Lab“

**Lesart:** Ursprünglicher Baselineplan mit späteren Fortschreibungen. Für den
heutigen Entwicklungsstart [CONTRIBUTING.md](../../CONTRIBUTING.md) verwenden;
aktuelle Bereichsverträge im [Index](README.md), tatsächliche Installationen im
[Desktopprotokoll](09_DESKTOP_APP_UND_UPDATES.md) prüfen. Frühere Scopeausschlüsse
und Testkorpora unten sind nur zusammen mit den späteren Entscheidungen zu lesen.

D-304 ergänzt den lokalen Organisationsskill und gezielte Befehle zur bestehenden Archiv-/Lehreransicht. Kein neues Planungsmodell; Zielauflösung aus jedem Chat, Arbeitsblattpipeline unverändert. Umfang und Aktivierung: `47_TEACHING_AGENT.md`.

D-302 ergänzt auf ausdrücklichen Auftrag ausschließlich Kursnamen und private Stundennotizen als kleinen lokalen Slice. Dieser ersetzt den Schülerdaten-Ausschluss für die beschriebene Namens-/Notizdomäne; alle übrigen Verwaltungsfunktionen bleiben außerhalb des Scopes. Browser- und getrennte native ARM64-Abnahme bestanden; seit 0.1.84 lokal in der normalen App aktiviert. [Vertrag und Prüfung46](46_STUDENT_NOTES.md).

D-301: ausdrücklich beauftragter lokaler Agentanschluss für die Vorbereitung der geöffneten Lehrerfläche, über bestehenden Canvas-Port und Speicherung. Kein Archiv-/Canvas-Parallelmodell, keine Remote-Steuerung. [Vertrag und Prüfstand](45_CANVAS_AGENT.md).

**Releasefortschreibung 22.10.2026:** Der vollständige HTML-Medien-/Room-/native Vollbildpfad ist mit 0.1.70 signiert veröffentlicht. Die heutige direkte Autorsteuerleiste einschließlich bestätigtem Scrubbing bleibt paketlokal (D-286); vorbereitete Pakete verwenden denselben veröffentlichten Appvertrag. Keine automatische Materialinstallation, Produktivmigration oder Remote-Videosteuerung. Frühere Beschränkungen auf die separate Test-App sind für den Programmcode historisch. Prüfgrenzen und Belege: Desktop-Updatedokument und `output/release-0.1.70/`.

Nachtrag 21.10.2026: D-277 integriert lokale HTML-Pakete mit gestreamten Medien
über den bestehenden Archiv-/Canvasweg. gLT ausschließlich in separaten
Teststunden. D-278 setzt die opt-in HTML-Wiedergabe nur im Room mit leichter
Lehrersteuerung und Systemaudio-Ausgabe um. D-280 ergänzt ohne aktiven Room normale
lokale Lehrerwiedergabe und pausierte Übergaben zwischen beiden Zuständen.
Mit D-281 bleibt beim Room-Betrieb eine paketautorisierte passive HTML-Hülle mit
Cover/Abschnittsbild und Steuerung auf der Lehrerfläche statt eines zweiten Players.
Die separate gLT-Test-App enthält den Pilotstand; produktive Auslieferung und
Realtest am erweiterten Bildschirm bleiben offen.
Vertrag, Reproduktion und Prüfstand: [43_HTML_MEDIA_INTEGRATION_TEST.md](43_HTML_MEDIA_INTEGRATION_TEST.md).

**Stand:** 30. August 2026<br>
**Status:** Excalidraw-Baseline implementiert; begrenzter Englisch-Planungs- und lokaler PDF-Seitenimport-Slice für den ersten Unterrichtstest ergänzt<br>
**Ziel:** erste reale Oberfläche zum Testen, nicht erste vollständige App

**D-267, 17. Oktober 2026:** Persönlich konfigurierte lokale DocRes-Bildaufbereitung mit korrigierbarem rechteckigem Zuschnitt und Vorschau ergänzt die bestehende Scanaktion. Kein allgemeiner KI-Dienst oder neuer Archivpfad; Original/Undo bleiben erhalten. [Betrieb und Prüfstand](37_DOCUMENT_IMAGE_PILOT.md).

**D-268, 18. Oktober 2026:** Vier unabhängig bewegliche Ecken und lokale OpenCV-Perspektivvorschau erweitern D-267. Unbearbeitete Quelle und geometrisch identische Original-/DocRes-Renditionen bleiben im bestehenden Assetpfad erreichbar. [Vertrag und Prüfung](38_DOCUMENT_PERSPECTIVE_TEST.md).

**D-272, 18. Oktober 2026:** DOCX als zusätzlicher Importweg in die bestehende PDF-Projektion. Gemeinsame lokale Material-API für Geräteauswahl/Drop/QR, mitgeliefertes LibreOffice und Erhalt des Quellen-/PDF-Paars ohne neuen Canvas- oder Archivtyp. [Betrieb und Prüfung](39_DOCX_IMPORT_TEST.md).

**D-273, 18. Oktober 2026:** Integrierte Browserkamera auf der persönlichen QR-Seite vermeidet den externen Kamerawechsel; Mehrfachauswahl und bestehender Import bleiben erhalten. Kein Desktopupdate oder neuer Archivpfad. [Prüfung](35_MOBILE_CAPTURE_PILOT.md).

**D-274, 18. Oktober 2026:** Gespeicherte Materialreihenfolge an der vorhandenen Materialbasis mit internem Zeilendrag; Canvas-Drop bleibt Einfügen. [Vertrag und Prüfung](40_MATERIAL_ORDER_TEST.md).

**D-275, 18. Oktober 2026:** Neuer Text auf Raster-/HTML-Papier erhält passenden Schwarz-/Weiß-Kontrast; bestehende Materialbindung schützt die Farbe vor Canvas-Themewechseln. [Prüfung](41_TEXT_BACKGROUND_CONTRAST_TEST.md).

**D-276, 18. Oktober 2026:** Lehrer-Stift verwendet die gemeinsame Untergrundprobe beim Aufsetzen; Farbe bleibt pro Strich konstant. [Prüfung](42_PEN_BACKGROUND_CONTRAST_TEST.md).

Surface Lab ist eine bewusst vereinfachte Ein-Client-Test-Shell. Es bildet weder die spätere Vorbereitung am Mac noch die getrennte Lehrer-/Tafelarchitektur der Durchführung vollständig ab.

**Ergänzung vom 5. September 2026 (D-089/D-090/D-127):** Der ausdrücklich beauftragte Live-Canvas-POC ergänzt einen separaten lesenden Teilnehmerclient. QR-/Link-Beitritt, Namen, gemeinsamer Start, die Modi Frei/Clip und Moderation laufen über einen flüchtigen Beelink-Sitzungsdienst; das lokale Archiv und sein Autosave bleiben unverändert. Das ist weder gemeinsame Bearbeitung noch Beelink-Archivpersistenz oder Presenter-Regie. Aktueller Vertrag und Grenzen: [Live Canvas](05_LIVE_CANVAS_POC_PLAN.md), [Betrieb/Test](06_LIVE_CANVAS_BETRIEB_UND_TEST.md).

**Ergänzung vom 26. September 2026 (D-203):** Ein begrenzter Room-Canvas-Pilot ergänzt ein zweites, lesendes lokales Ausgabefenster für erweiterte Bildschirme. Die Hostbedienung heißt `Präsentieren` und zeigt Clips direkt per Nummer statt über einen Frei/Clip-Schalter; Remote-Teilnehmerkameras und Beelink-Vertrag bleiben unverändert. Room übernimmt keine Archivwahrheit und keinen allgemeinen Presenter. [Room-Pilotplan](21_ROOM_CANVAS_PILOT_PLAN.md).

**Fortschreibung vom 27. September 2026 (D-206/D-214/D-215):** Das Room-Fenster erlaubt lokale Stift-/Markeraktionen mit eigenem Verlauf sowie direkte Eingaben in interaktivem HTML. Die eine Hoststunde bleibt kanonisch; fachlicher HTML-Zustand wird zwischen Lehrer- und Rauminstanz zusammengeführt. Eingabefokus, Scrollen und Room-Werkzeugwahl sind fensterlokal. Remote Canvas erhält dadurch keine neuen Schreibrechte.

**D-093:** Der explizit gewünschte Host-Zeiger ergänzt diesen lesenden POC als flüchtigen, an die freigegebene Canvasfläche gebundenen Positionspunkt; gemäß Nachtrag keine Anzeige des ausgewählten Werkzeugs, keine globale Bildschirm-/Archivbewegung und keine Teilnehmerbearbeitung.

**D-095:** Der ausdrücklich freigegebene feste Treffpunkt ist unabhängig von der laufenden lokalen App erreichbar. Derselbe Einladungslink gilt für Browser, QR und Relution-Webclip; Teilnehmer warten bei `idle`, Hoststart zeigt den Canvas, Hostende räumt die Publikation und erhält den Treffpunkt. Kein Minigame, Account oder Archivsync. Das Hostpanel wird auf Teilen, Teilnehmer und Start/Ende reduziert. Aktueller Ablauf und Web-App-Einrichtung stehen in Betrieb/Test.

**D-104:** Die Schüleransicht im Clip-Modus enthält keinen eigenen Resetbutton. Erneuter Nummernaufruf durch die Lehrkraft bleibt der gemeinsame Rückruf; Begrenzung und individueller Zoom bleiben bestehen.

**D-102:** Bewusster Zeiger (Y halten oder Toolbar; Komet/Band/Funken) ersetzt automatische Mauspräsenz in allen Live-Modi. Öffentliche Schülervorschau nutzt denselben Viewer und nur bestätigte Projektionsdaten. Clipwechsel mit kurzer Einblendung, Rückruf mit begrenzter Kameraanimation. [UI Brief](../design/08_LIVE_CANVAS_MOTION_PREVIEW_POINTER_UI_BRIEF.md).

**D-101, vereinfacht durch D-127:** Der beauftragte Clip-Modus ergänzt nummerierte stundenlokale Ausschnitte, unabhängige Hostkamera und verbindlich begrenzte Schüleransicht. Im Modus Frei navigieren Teilnehmer unabhängig; `Zur Lehrkraft` und `Alle zu mir` übernehmen den Hostausschnitt nur einmal. Kleine Steuerbefehle laufen über den bestehenden WebSocket. Keine Teilnehmerbearbeitung. [Clip UI Brief](../design/07_LIVE_CANVAS_CLIP_UI_BRIEF.md).

## 1. Warum hier beginnen?

**Beauftragter Entwicklungspilot vom 17. Oktober 2026 (D-266):** QR-gebundene persönliche Handyaufnahme über einen eigenen flüchtigen Relay, mit Speicherung über den bestehenden lokalen Stunden-Materialimport. Der eigene HTTPS-Relay auf Beelink und ein getrenntes dauerhaftes Mac-Testarchiv sind für den persönlichen Android-Heimtest eingerichtet; kein Schülerrollout, Cloudarchiv oder öffentlicher Archivzugang. Native Integration mit 0.1.59 am normalen Desktop-Ort lokal installiert, mit tatsächlichem Androidfoto geprüft und am 17. Oktober 2026 als signiertes Beelink-Update veröffentlicht. [Vertrag und Prüfstand](35_MOBILE_CAPTURE_PILOT.md).

**D-291 (28.10.2026, Entwicklung):** Der bestehende Timer erhält direkte Tipp-/Ziehbedienung am offenen Ring und eine einzelne genaue Zeiteingabe. Lokaler Gestenentwurf, ein revisionsgebundener Dauercommit, dieselbe Lehrer-/Room-Komponente; keine neue Laufzeit, Trägergeometrie oder Speicherung. Nach ausdrücklichem Folgeauftrag ergänzt der Timer passive Remote-Projektion, direkte Anzeige und Materialclips in der vorhandenen nummerierten Liste; serverseitiger Zeitanker und Capability-Aushandlung ohne Remote-Bedienung. Native/Boardabnahme sowie Dienst-/Teilnehmer-/Desktop-Auslieferung separat; UI-Brief21.

**Lokale Ergänzung vom 13. Oktober 2026 (D-252):** Der beauftragte Einstieg `Widgets` ergänzt zunächst einen fest eingebauten Countdown-Timer. Er teilt Canvasgeometrie, Auswahl und Stundenpersistenz mit der bestehenden Fläche, bleibt jedoch unbeschreibbar. Eine flüchtige Hostlaufzeit versorgt Lehrer- und Room-Anzeige über den bestehenden lokalen Kanal; konfigurierbare Dauer und Tonwahl bleiben gespeichert. Kein allgemeines Widgetframework, HTML-Materialimport oder Remote-Timer-Slice. [UI-Brief und Prüfstand](../design/21_TIMER_WIDGET_UI_BRIEF.md).

**D-124 (ersetzt D-109/D-122 für HTML):** Eigene HTML-Pakete mit `live.state = v1` laufen isoliert auf Host und Teilnehmern. Die Lehrkraft bleibt autoritativ; kleine fachlich validierte Zustände werden direkt synchronisiert. Pro Material sperrt oder öffnet ein Schloss die Teilnehmerbedienung. Der frühere HTML-PNG-Capture entfällt. Vertrag und Grenzen: [HTML-Materialien](04_INTERAKTIVE_HTML_MATERIALIEN.md).

**D-133:** Der aktuelle Live-Transport verwendet einen gemeinsamen revisionsgebundenen Patchumschlag für fachliche HTML-Zustände und flüchtige Stift-/Markerpreviews. HTML-Patches werden in den kanonischen Reconnect-Snapshot übernommen; Ink-Patches übertragen nur den exakten veränderten Punktbereich und werden durch den normalen endgültigen Szenencommit abgesichert. Langsame Geräte sammeln keine Zwischenstände an. Der letzte strikte Clip-Pixel-Legacyzweig ist entfernt; Clip und Abdeckung bleiben reine Kamera-/Aufmerksamkeitssteuerung. Details und Prüfstand: [Betrieb/Test](06_LIVE_CANVAS_BETRIEB_UND_TEST.md).

Die größte offene Produktfrage ist nicht, wie Fächer und Reihen verwaltet werden. Sie lautet:

> Kann die zentrale Unterrichtsfläche mit Stift, Finger, großen Werkzeugen und echtem Material so ruhig und selbstverständlich bedient werden, dass sie im Unterricht besser als der bisherige Workflow funktioniert?

Wenn die Fläche nicht trägt, helfen ein gutes Archiv, Beelink-Persistenz oder KI-Funktionen nicht. Deshalb beginnt die Umsetzung mit der Oberfläche, auf der später tatsächlich unterrichtet wird.

Unterrichtsorganisation und Umbenennung werden im aktuellen lokalen Slice über das einklappbare Archiv abgebildet. Der Schließen-Schalter sitzt in dessen fester oberer Zeile; geschlossen bleibt ein kleiner Wiederöffner an der linken Canvas-Kante erreichbar. Die Kopfzeile zeigt den aktiven Stundentitel zusätzlich mittig als reine, kompakte Orientierung, damit die Arbeitsfläche auch bei geschlossenem Archiv eindeutig bleibt. Das separate Unterrichtsdatum bleibt davon getrennt.

## 2. Hypothese des ersten Prototyps

Eine Lehrkraft kann ohne Einweisung:

1. eine vorbereitete Unterrichtsfläche öffnen;
2. mit Stift schreiben und markieren;
3. mit Finger oder Handwerkzeug navigieren;
4. Text und Formen ergänzen;
5. vorhandenes Bildmaterial bewegen und skalieren;
6. Fehler mit Undo korrigieren;
7. im Vollbild zehn Minuten sinnvoll arbeiten.

Der Prototyp ist erfolgreich, wenn er klare Beobachtungen erzeugt. Er muss nicht sofort angenehm genug für eine echte Unterrichtsstunde sein.

## 3. Reales Testkorpus

Als erste Teststunde dient Englisch, Klasse 9/10, „Means of transport“. Sie besitzt überschaubare, aber echte Materialien:

- Reihenspiegel (lokaler Beleg, nicht im öffentlichen Quellstand)
- Historischer privater Transportkorpus unter `test-materials/`; kein Checkout-Bestandteil.
  Aktive technische Demo: [versioniertes Transportbild](../../prototypes/surface-shell-a-b/src/assets/demo/transport-set.png).
- Arbeitsblatt Advantages/Disadvantages (lokaler Beleg, nicht im öffentlichen Quellstand)
- Language Support (lokaler Beleg, nicht im öffentlichen Quellstand)

Für den ersten realen Unterrichtseinsatz wurde die Reihenfolge nachträglich angepasst: Zusätzlich zur Transport-Illustration können lokale Bilder und PDFs hinzugefügt werden. PDF.js rendert jede Seite als eigenes Rasterbild; Seiten lassen sich danach unabhängig anordnen und annotieren. Browserfähige Audio- und MP4-Videodateien werden im stundenbezogenen Originalmaterial gehalten; transparente native Canvasobjekte halten ihre Geometrie und Provenienz, während eigene kompakte Player scharf als React/HTML-Oberfläche in der aktuellen Viewportgröße gerendert werden. Große lokale Medien werden bei Upload und Auslieferung gestreamt; Byte-Ranges ermöglichen Sprünge ohne vollständiges Puffern. Validierte YouTube-Links werden als stundenbezogenes Linkmaterial gespeichert. Auch ihr transparenter Canvasplatzhalter hält Geometrie und Provenienz, während der externe Player deckungsgleich als DOM-Oberfläche projiziert wird; YouTube-Videobytes werden nicht kopiert. Als kleinster D-054-Anschluss können zusätzlich ausdrücklich gespeicherte, manifestierte lokale HTML-Pakete aus der Stundenbasis als isolierter Live-Frame projiziert werden. Beliebige Websites und ZIP-Import bleiben außerhalb des Slices.

## 4. Umfang von Prototyp 0.1

### Muss funktionieren

- Start direkt in einer vorbereiteten Teststunde;
- potenziell unendliche freie Fläche;
- Hand/Pan beziehungsweise Finger-Navigation;
- Auswahl und Verschieben;
- Stift;
- Marker;
- Radierer;
- Text;
- einfache Form;
- Undo/Redo als zwei runde globale Canvasaktionen oben rechts auf der Arbeitsfläche;
- Bild auf der Fläche;
- das einzelne Rastermaterial über eine kontextuelle Desktop-Aktion ohne App-Chrome drucken;
- lokale Bilder per Dateiauswahl, Drag-and-drop oder Systemzwischenablage sowie PDFs per Dateiauswahl oder Drag-and-drop hinzufügen;
- jede PDF-Seite als unabhängiges Canvasbild platzieren, verschieben und annotieren;
- MP3, M4A, AAC, WAV, OGG/Opus, WebM-Audio und FLAC aus dem Stundenmaterial oder per Dateiauswahl als kleinen Canvas-Player mit Play/Pause, Zeitleiste, Vor/Zurück, Lautstärke und Tempo platzieren; dessen feste innere Geometrie von `460 × 88` wird als Einheit mit dem Canvaszoom skaliert, dessen Controls reagieren auf den ersten Desktop-Klick unabhängig vom aktiven Canvaswerkzeug, und die neutrale Titelzone bleibt als Auswahl- und Verschiebefläche erhalten;
- MP4 aus dem Stundenmaterial oder per Dateiauswahl als eigenen `640 × 360`-Canvas-Player mit Play/Pause, Zeitleiste, Zeit, Zehn-Sekunden-Sprüngen, Lautstärke und Vollbild platzieren; die neutrale Videofläche verschiebt den Materialverbund, Auswahl bietet Zentrieren, Fokus und Abdeckung, während Wiedergabestatus und Medienwerte flüchtig bleiben;
- YouTube-Link im Materialbereich oder als reine URL aus der Systemzwischenablage direkt auf dem Canvas einfügen, kanonisch in der aktiven Stunde speichern und als spielbaren, verschieb- und skalierbaren Canvas-Player mit Zentrieren, Fokus und Abdeckung platzieren; die drei kontextuellen Aktionen liegen dabei vollständig außerhalb der Anbieterfläche und wählen abhängig von Format, Canvasrand und benachbartem Material eine freie Seite; ein transparenter nativer Platzhalter bleibt Geometrie- und Verlaufswahrheit, die abgeleitete DOM-Projektion rendert den Anbieter-Player ohne zusätzliches Engine-Link-Icon; unter `100 %` schrumpft dessen unskalierte innere Iframe-Fläche als vollständige Einheit, ab `100 %` rendert sie ohne künstliche Hochskalierung direkt in der Viewportgröße; im aktiven Player bleiben responsive obere Anbietercontrols sowie Zeitleiste und Vollbild am unteren Rand direkt bedienbar, während die mittlere Videofläche weiterhin verschiebt und Play/Pause schaltet;
- ein validiertes lokales HTML-Paket unter `material/interaktiv/<id>/` als Materialtyp `Interaktiv` einfügen und als direkt bedienbaren, scrollbar reflowenden Frame über transparenter Canvasgeometrie platzieren; eine dauerhafte 48-Pixel-Griffleiste verschiebt den vollständigen Materialverbund einschließlich Abdeckung und zugehöriger Annotationen, die vorhandenen Canvasgriffe ändern seine Größe, der Canvaszoom skaliert Griffleiste und Inhalt ohne inneren Reflow als eine Einheit, und ein davon unabhängiger gespeicherter Inhaltszoom von `50 %` bis `200 %` passt die innere Layoutfläche an; aktive Canvaswerkzeuge zeichnen über dem Frame auf dem nativen Canvas, dabei bleibt die Annotation durch einen einmaligen Dokument-Scrollanker an ihrer HTML-Stelle und übernimmt nach direkter Auswahl den nativen Rücktaste-/Entf-Pfad; Auswahl bedient den vollständigen HTML-Inhalt, und Hand lässt explizite Controls sowie Drag-and-drop-Ziele beim HTML, reicht aber Hintergrunddrags als Canvas-Pan weiter; Reload stellt Geometrie und Inhaltszoom wieder her, der semantische Inhaltszustand wird pro Instanz standardmäßig im Stunden-Snapshot gehalten; bei bewusst ausgeschalteter Speicherung warnen echte Abweichungen vom Startzustand vor Stundenwechsel, Reload oder Schließen;
- eine alleinstehend eingefügte gewöhnliche `http`- oder `https`-URL am letzten Zeigerort zuerst knapp nach ihrem sichtbaren Linktext fragen, sie nach Bestätigung kanonisch in `material/links.json` übernehmen und als nativen, ausgewählten Canvas-Textlink mit verborgener Ziel-URL anlegen; Eingabefelder bleiben ausgenommen, YouTube behält ohne Beschriftigungsabfrage Vorrang als Player und gewöhnliche Links erzeugen kein Website-Embed;
- `Apps` als getrennten Toolbar-Einstieg mit ausschließlich codegeprüften Einträgen anbieten; der Pilot `Lerndeck` wird über seine registrierte App-ID als responsive authentifizierte Canvasoberfläche mit Markenicon, rahmenloser abgerundeter Inhaltsfläche, äußeren Auswahlcontrols, Annotation, Zentrierung, Fokus, Abdeckung und demselben gespeicherten Inhaltszoom von `50 %` bis `200 %` wie lokales HTML platziert. Neben den sichtbaren Controls verändern `⌘/Strg +`, `⌘/Strg −` und `⌘/Strg 0` diesen Wert für die eindeutig ausgewählte oder gerade bediente App. URL, Login und App-Zustand bleiben außerhalb des Stundenmaterials und des Canvasdokuments; D-294 ergänzt die lokale Room-Ausgabe derselben aktiven Lerndeck-Ansicht über eine explizite Registryfähigkeit und die bestehende Clipfolge; neutrale Auswahl-/Verschiebegesten folgen HTML. Freie URLs, App-Installation durch Lehrkräfte, Drucken, HTML-State-Aktionen und Remote-Canvas-Auslieferung bleiben ausgeschlossen;
- Zoom/Fit beziehungsweise „Inhalt finden“;
- `Ctrl` beziehungsweise `⌘` plus Trackpad-/Mausrad-Zoom auch dann, wenn der Zeiger über einem projizierten Audio-, lokalen Video-, YouTube- oder lokalen HTML-Material liegt;
- unmodifiziertes Zwei-Finger-Trackpad-Pan über den festen Audio- und YouTube-Flächen über denselben bestehenden Canvas-Kamerapfad; direkte Player-Klicks und Regler bleiben davon getrennt;
- Vollbild;
- lokaler Speicherstatus und Reload derselben Testfläche;
- große, auf Touch erreichbare Bedienelemente.
- helle und dunkle Grundfläche als umschaltbare Zustände derselben Shell.

### Darf zunächst simuliert oder sehr einfach sein

- im Archiv inline bearbeitbarer und lokal gespeicherter Stundentitel;
- lokaler Autosave;
- Werkzeugfarben und Strichstärken;

### Gehört ausdrücklich nicht in 0.1

- vollständige Archivverwaltung, Suche oder Klassenverwaltung über den lokalen Produktivslice hinaus;
- Login und echte Benutzerverwaltung;
- Beelink-Sync;
- produktive Speicherung des Original-PDFs und versionierte Renditions;
- Stundenpfad;
- Teacher-/Public-Kamera;
- LIVE/GEHALTEN;
- Videoeditor, Videoschnitt, Video-Download, weitere lokale Videocontainer, beliebige Webseiten-/HTML-Einbettung oder pauschaler ZIP-Import; der lokale MP4-Player und der manifestierte HTML-Paketslice sind davon getrennt;
- OneNote-Import;
- KI;
- Arbeitsblattgenerator;
- vollständiges Komponenten- und Token-Designsystem für die gesamte spätere App; die verbindlichen UI-/UX-Prinzipien gelten bereits.

### Bewusst vorgezogener lokaler Planungsslice

Wegen des unmittelbar bevorstehenden ersten Unterrichtseinsatzes wird eine einzelne spätere Annahme in klar begrenzter Form parallel getestet:

- eine einklappbare linke Navigation;
- Klassenumschalter `9/10 B-Kurs` und `Dinos` als reine lokale Testdaten;
- Hierarchie `Englisch` → `Means of transport` → drei vorhandene Unterrichtsstände;
- getrennte lokale Titel-, Terminmetadaten- und Canvasstände pro Teststunde;
- der bisherige `means-of-transport`-Canvasstand bleibt unter derselben ID dem rekonstruierten Einstieg vom 24. August zugeordnet, damit vorhandene lokale Arbeit nicht verschwindet oder die neue Planung überschreibt;
- direkter Start in die Vorbereitung `Language support & Transport Challenge` mit dem separaten Metadatum `scheduledFor: 2026-08-31`;
- Stundentitel bleiben inhaltsbezogen; das bei der Unterrichtserzeugung gesetzte Unterrichtsdatum ist organisatorische Metadaten und wird nur sekundär angezeigt;
- Fach und Reihe erscheinen als ruhige, farbige Lucide-Ordner; die Klassenebene bietet `Fach anlegen`, das Plus am Fach legt inline eine Reihe an und das Plus an einer Reihe zeigt sofort eine normale markierte Unterrichtskarte mit rahmenloser Titeleingabe;
- neue Teststunden starten auf einer leeren Arbeitsfläche, erhalten für diesen akuten Planungsslice automatisch den Folgetag als `scheduledFor` und werden unmittelbar geöffnet;
- Rechtsklick oder Kontextmenütaste auf Fach, Reihe oder Unterricht bietet `Umbenennen` direkt in derselben Zeile und bestätigtes `Löschen`; Löschen setzt ausschließlich eine lokale Papierkorbmarkierung, während Katalogdaten, Canvasstand und importierte Materialien erhalten bleiben; ein nur bei Inhalt sichtbarer Papierkorb bietet `Wiederherstellen`;
- Fächer innerhalb derselben Klasse, Reihen innerhalb desselben Fachs und Stunden innerhalb derselben Reihe lassen sich auf dem Desktop über ihre Zeile neu anordnen; `⌘/Strg`- beziehungsweise `Shift`-Auswahl bündelt mehrere Fächer derselben Klasse für einen gemeinsamen Drag, eine Akzentlinie zeigt die Einfügeposition und die Reihenfolge wird als ID-Overlay lokal gespeichert;
- Rechtsklick auf Fach, Reihe oder Stunde startet einen sitzungsgebundenen App-Kopiermodus; kompatible Zielklasse, Zielfach beziehungsweise Zielreihe bietet `Hier einfügen` und erzeugt einen unabhängigen Teilbaum mit neuen IDs einschließlich Canvasstand und lokaler Materialbytes;
- Rechtsklick auf Fach, Reihe oder Stunde bietet zusätzlich `Duplizieren`; der vollständige unabhängige Teilbaum wird ohne Zielauswahl innerhalb desselben Elternordners unmittelbar unter seiner Quelle einsortiert;
- lokale Ergänzungen werden mit den übernommenen Spiegeldaten im kanonischen dateibasierten Archiv zusammengeführt und nach Reload wieder eingelesen;
- `Material hinzufügen` öffnet als bewusst begrenzten Anschluss eine schlanke vollständige Liste für Bilder, PDFs, browserfähiges Audio, lokales MP4-Video, Web-/YouTube-Links und manifestierte lokale HTML-Pakete aus `stunden/<lesson-id>/material/` der aktiven Stunde; der Stundentitel kennzeichnet den Kontext eindeutig, kleine Bildthumbnails beziehungsweise Dateiicons, Dateiname, Herkunft und eine direkte Plus-Aktion bleiben sichtbar, während eine passive Materialvorschau nur flüchtig bei Desktop-Hover beziehungsweise Tastaturfokus erscheint (D-256): Bild und erste PDF-Seite im Originalformat, HTML als vollständige statische Vorlage, Video als stummes Standbild, Audio und Links als kompakte Typ-/Adresskarte; die vollständige Liste besitzt seit D-258 keine Kategorien-/Typfilterleiste; Archivzeile und Canvas-Zielaktion teilen Kamerafahrt, Fokus und abgeleitete Zeilenmarkierung; Bilder/PDFs, Audio und Video verwenden denselben Klick-/Desktop-Drag-Einstieg, Audio und Video erzeugen je ein transparentes persistierbares Canvas-Geometrieobjekt mit abgeleiteter React/HTML-Oberfläche, lokales HTML eine gleichartige Geometrie plus isolierten responsiven Frame; Material mit mindestens einem lebenden Canvasobjekt derselben Archivprovenienz bleibt sichtbar und erhält ausschließlich den abgeleiteten Zustand `Im Canvas ✓`, ohne eine zweite Verwendungsfilterzeile oder separate Persistenz; `Vom Gerät`, Datei-Drop und Systemzwischenablage speichern unterstützte Bilder, PDFs, Audio und MP4 vor der Platzierung additiv in der Stundenbasis und überschreiben bei Namenskonflikten nichts, gewöhnliche Weblinks werden wie YouTube in `material/links.json` dedupliziert, HTML-Pakete werden vorerst ausschließlich über den validierenden additiven Codex-Installer eingespielt;
- ausgewähltes lokales interaktives HTML bietet außerhalb liegende Aktionen für standardmäßig aktives Behalten und bestätigtes Zurücksetzen des Inhalts sowie Zentrieren, Fokus und materialgebundene Abdeckung; eine Teilabdeckung verdeckt und sperrt ausschließlich ihr eigenes Rechteck, der übrige Fremdframe bleibt sichtbar und bedienbar, erst Vollabdeckung verbirgt ihn vollständig; die Abdeckung bleibt ein normales persistierbares Canvasobjekt und wird nicht als zweiter HTML-Zustand gespeichert; ein Paket mit deklarierter A4-Druckvorlage erhält zusätzlich dieselbe direkte Druckaktion wie Rastermaterial und verwendet bereits auf dem Lehrercanvas die vollständige deklarierte Papierproportion, gewöhnliche HTML-Pakete nicht; Zuschneiden bleibt Rastermaterial vorbehalten;
- lokales interaktives HTML hält beim Canvaszoom dieselbe innere Layoutfläche und skaliert Titel, Inhalt, Buttons, Bilder und Abstände gemeinsam; der kompakte Titelbalken-Inhaltszoom `−`, Prozentwert, `+` verändert davon unabhängig nur den Inhalt in Zehn-Prozent-Schritten zwischen `50 %` und `200 %`, wird am Canvasträger gespeichert und folgt Undo/Redo sowie Reload;
- keine Suche, globale Materialbibliothek, Dateiverwaltung, endgültige Löschung oder Papierkorbleerung, Verschiebung in andere Fächer oder Reihen, allgemeine Ordnerverwaltung, Betriebssystem-Zwischenablage, automatische OneNote-Nachmigration oder Beelink-Persistenz.

Die lokale kanonische Unterrichts- und Materialablage lag für den Browserprototyp unter `data/unterrichtsarchiv/`. D-189 verlegt die aktive lokale Ablage mit der installierten Desktop-App nach `~/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv/`; der Repository-Bestand bleibt Migrations- und Entwicklungsreferenz. Die additive Portierung aus `<frueherer-unterrichtsordner>` wurde nach vollständigem Datei- und Prüfsummenabgleich am 30. August 2026 abgeschlossen; der frühere Pfad ist keine aktive Parallelquelle mehr. Ein unveränderlicher, mit SHA-256 geprüfter Rückfall-Snapshot liegt ausschließlich als Wiederherstellungsartefakt unter `_migration/retired-source-snapshots/`. `scripts/migrate-unterricht-archive.mjs` verlangt deshalb nun einen expliziten Quellpfad und gehört nicht mehr zum normalen Unterrichtsworkflow. `archive.json` indiziert Klasse, Fach, Reihe, Stunde, Reihenfolge und Papierkorb. Fach-, Reihen- und Stundendokumente sowie Canvasstände und Assets liegen unter stabilen IDs im Dateibaum. Local Storage und IndexedDB bleiben schneller Browsercache und einmalige Migrationsquelle, aber nicht mehr die einzige fachliche Wahrheit. Schreibvorgänge ersetzen keine fremden IDs, erfolgen atomar und sichern vorherige Fassungen in `_history/` beziehungsweise stundenlokaler `.history/`. Canvaswrites werden zusätzlich gegen die beim Laden gelesene SHA-256-Dateirevision geprüft und pro Stunde serialisiert; eine fehlende oder veraltete Basisrevision darf den aktuellen Archivstand nicht überschreiben. Vollständige Codex-Sicherungen liegen ausschließlich außerhalb der aktiven Materialbasis, tragen Prüfsumme und Metadaten und werden durch einen isolierten Probe-Restore validiert. Der Papierkorb löscht keine Unterrichts-, Canvas- oder Materialdaten endgültig. Die Dateien unter `test-materials/` bleiben kontrollierte Entwicklungsfixtures und sind nicht das Unterrichtsarchiv.

Der semantische Migrationsschritt verbindet belegte Spiegelstunden nach stabilen IDs mit der sichtbaren App-Hierarchie und setzt an Reihe und Stunde eine `materialBasis`. Die tatsächlich gehaltene LER-Einstiegsstunde wird der vorhandenen Dinos-Reihe `LER/WAT → Reisen` zugeordnet. Der anfänglich gemeinsam verknüpfte LER-Reihenbestand wurde anschließend belegbasiert und ausschließlich additiv getrennt: Einstiegsmaterial vom 25. August liegt in der Einstiegsstunde, Eco-Lodge- und AB02-Reiseethik-Material liegt in `Schönste Ferienwohnungen`, und der alte Reihenordner bleibt unveränderter Herkunftsbestand. Vorbereitete Alternativen ohne bereits angelegten Unterricht werden nicht automatisch zu neuen Lesson-Einträgen. Die unveränderten Codex-Regeln bleiben unter `data/unterrichtsarchiv/_rules/source/` fachliche Grundlage; `docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md` beschreibt nur ihre Verbindung zur App.

Für neue Codex-Unterrichtsarbeit bleibt die unveränderte Arbeitsweise aus dem bisherigen Unterrichtsprojekt fachliche Grundlage; sie wird durch die Portierung nicht zu einer allgemeinen Material- oder Arbeitsblattregel umgedeutet. Der zusätzliche Anwendungsanschluss liegt in `scripts/create-archive-lesson.mjs`: Sobald Codex eine Stunde in einer bestehenden Archivreihe anlegt, erzeugt derselbe Auftrag atomar den Lesson-Eintrag, den stabilen Stundenordner und dessen eigene `materialBasis` unter `stunden/<lesson-id>/material/`. Der bisherige Reihenspiegelworkflow bleibt erhalten; neue Stundenartefakte entstehen jedoch im Stundenmaterial statt im gemeinsamen Reihenpool. Ein nicht bekannter Termin bleibt `scheduledFor: null` und erzeugt weder erfundenes Datum noch zusätzlichen UI-Hinweis.

Verbindliche UI-Grundlage sind der [UI Brief für den lokalen Archiv- und Planungsslice](../design/03_ARCHIVE_PLANNING_SIDEBAR_UI_BRIEF.md) und für dessen Materialanschluss der [UI Brief für den unterrichtsgebundenen Materialbereich](../design/04_LESSON_MATERIAL_DRAWER_UI_BRIEF.md). Für eine konsistente Kopie oder einen Stundenwechsel kann der aktive Canvas seinen ausstehenden Browser- und Dateisnapshot explizit flushen. Originalassets bleiben getrennt vom Canvasdokument; Lesson-/Asset-Architektur und Engine-Datenmodell bleiben ansonsten unverändert. Der Slice bestätigt keine Touchannahme.

## 5. Erste GUI-Elemente

### Immer sichtbar

- aktiver Stundentitel mittig in der Kopfzeile;
- Unterrichtsdatum, sofern vorhanden;
- knapper Speicherstatus;
- zentrale Arbeitsfläche;
- Werkzeuge: Hand, Auswahl, Stift, Marker, Radierer, Text, Form;
- Undo/Redo;
- Material hinzufügen;
- Vollbild;
- „Inhalt finden“ beziehungsweise Fit-to-content.

### Nur bei Bedarf sichtbar

- Farbe und Strichstärke des aktiven Werkzeugs;
- kleiner Materialdialog;
- technische Touch-/Pointeranzeige während des Spikes.

### Noch nicht sichtbar

- Fächerbaum;
- Reihenübersicht;
- Stundenpfad;
- öffentliche Kamera;
- AI-Chat;
- umfangreiche Einstellungen.

## 6. Vier Dockpositionen derselben Werkzeugleiste

Die Zustände unterscheiden sich nur in der Werkzeugposition. Die Leiste folgt einem ausreichend großen Drag-Griff und rastet beim Loslassen oben, rechts, unten oder links ein. Query-Parameter können diese Zustände für reproduzierbare Tests direkt setzen. Es entstehen keine getrennten Apps und keine parallelen Produktoberflächen. Gestaltung und UI-Texte folgen dem [verbindlichen UI/UX-Styleguide](../design/00_UI_UX_STYLEGUIDE.md) und dem [UI Brief für Surface Lab](../design/01_SURFACE_LAB_UI_BRIEF.md).

Die sichtbare Canvasfläche ist die gemeinsame Geometriequelle für die nächstgelegene Dockkante und deren Vorschau. Eine geöffnete oder geschlossene Unterrichtsnavigation verändert daher Canvas, Vorschau und horizontale Toolbarzentrierung gemeinsam; Viewportränder außerhalb der Arbeitsfläche sind keine Dockreferenz.

Die geöffnete Unterrichtsnavigation belegt die volle Höhe der App-Shell. Die globale Kopfzeile beginnt erst rechts daneben und wächst beim Einklappen zusammen mit der Arbeitsfläche wieder auf die volle Fensterbreite; beide verwenden dafür denselben Archiv-Offset statt getrennter Sonderpositionen.

Die Dockrichtung steuert nur die platzsparende Darstellung derselben Aktionen: Oben und unten erscheinen Icon und Kurzlabel; links und rechts werden Werkzeuge und globale Toolbaraktionen als schmale Icon-Spalte mit Tooltip und zugänglichem Namen gezeigt. Reihenfolge, aktiver Zustand und Funktionsumfang bleiben identisch.

Diese gemeinsame Shell ist ein Testinstrument für Canvas und Eingabe. Die langfristig getrennten Zustände Vorbereitung am Mac, Lehrerregie und lokale Tafel werden nur konzeptionell beschrieben und im späteren Presenter-Slice funktional verbunden. Prototyp 0.1 erhält weder zweiten Bildschirmclient noch LIVE/GEHALTEN oder Public Projection.

### Referenzzustand – Werkzeugleiste unten

```text
┌──────────────────────────────────────────────────────────────┐
│ 31. Aug. 2026               lokal gespeichert    ⛶ Vollbild │
├──────────────────────────────────────────────────────────────┤
│                                                   [↶] [↷]   │
│                                                              │
│                     FREIE ARBEITSFLÄCHE                       │
│                                                              │
│        Bildmaterial, Text, Formen und Handschrift             │
│                                                              │
│                                                              │
│     [Hand][Auswahl][Stift][Marker][Radierer][Text][Form]      │
│                    [+ Material] [Fit]                        │
└──────────────────────────────────────────────────────────────┘
```

Vermuteter Vorteil: auf einem großen Touchscreen von unten gut erreichbar und visuell näher an einer Werkzeugablage.

### Referenzzustand – Werkzeugleiste links

```text
┌──────────────────────────────────────────────────────────────┐
│ 31. Aug. 2026               lokal gespeichert    ⛶ Vollbild │
├───────┬──────────────────────────────────────────────────────┤
│ Hand  │                                           [↶] [↷]   │
│ Wahl  │                                                      │
│ Stift │              FREIE ARBEITSFLÄCHE                     │
│ Marker│                                                      │
│ Radier│                                                      │
│ Text  │                                                      │
│ Form  │                                                      │
│  +    │                                                      │
└───────┴──────────────────────────────────────────────────────┘
```

Vermuteter Vorteil: bekannte Whiteboard-Anordnung und weniger Überlagerung am unteren Rand.

Alle vier Dockzustände werden zunächst als einfache HTML/CSS-Oberfläche auf dem Mac betrachtet. Die Desktopansicht dient nur der Vorauswahl. Ohne reales Zielgerät fällt keine endgültige Entscheidung. Links-/Rechtshändigkeit, typische Position am Board sowie das Drag- und Einrastgefühl bleiben offene Testangaben.

## 7. Technischer Zuschnitt

Für den ersten funktionalen Baseline-Prototyp:

- Vite;
- React;
- TypeScript;
- Excalidraw als eingebettete Baseline;
- kleine eigene App-Shell;
- lokaler Zustand beziehungsweise IndexedDB für Reload;
- keine Backend-Abhängigkeit;
- keine produktive Datenmigration.

Die App-Domäne bleibt schon im Prototyp getrennt:

```text
TestLesson
├── id
├── title
├── boardSnapshot
└── assetReferences
```

Es wird kein allgemeines Produktionsschema aus diesem Testobjekt abgeleitet.

Nach dem Excalidraw-Test wird nur der kleinste relevante Slice mit tldraw reproduziert. Die GUI und die Unterrichtsaufgabe bleiben gleich; verglichen wird die Engine, nicht ein zweites Produktdesign.

## 8. Ablauf bis zur ersten testbaren Oberfläche

### Schritt 1 – Testbedingungen festhalten, etwa 15 Minuten

- konkreter Mac/Browser;
- vorhandener Stift und Touchscreen;
- Auflösung und Skalierung;
- ob heute nur Mac oder auch echtes Smartboard verfügbar ist;
- Testmaterial lokal erreichbar.

Ergebnis: Kopf des Testprotokolls ist ausgefüllt.

### Schritt 2 – Draggable Low-Fidelity-Shell, etwa 30–60 Minuten – umgesetzt

- keine Canvasfunktion;
- eine gemeinsame Shell mit draggable Werkzeugleiste und vier Dockpositionen;
- Hell und Dunkel über dieselben semantischen UI-Tokens, ohne doppeltes Layout;
- Query-Parameter nur als reproduzierbare Testhilfe;
- reale Bildschirmgröße;
- echte Buttonabmessungen;
- nur Werkzeugposition, sekundäres Unterrichtsdatum und Arbeitsfläche;
- auf Mac und wenn möglich auf dem Zielscreen öffnen.

Ergebnis ohne Zielhardware: dokumentierte Desktop-Vorauswahl, aber keine endgültige Positionsentscheidung. Entscheidung auf Zielhardware: bevorzugte Dockseite oder eine klar benannte kleine Kombination.

### Schritt 3 – Funktionaler Excalidraw-Baseline-Prototyp – Desktop-Smoke-Test bestanden

- gemeinsame Shell funktional umsetzen und alle vier Dockpositionen bis zum Hardwaretest per Drag erreichbar halten;
- Teststunde direkt laden;
- Kernwerkzeuge zugänglich machen;
- Bild platzieren;
- lokalen Reload ermöglichen;
- Pointer-/Touchdiagnose nur in einem Debugmodus.

Ergänzung Formfarben: Fünf direkt erreichbare Grundfarben steuern Kontur und – abhängig vom Füllzustand – transparente oder deckende Fläche. Dieselbe kompakte Auswahl formatiert eine einzeln ausgewählte bestehende Form; der Hauptbutton spiegelt Grundform, Farbe und Füllzustand als dauerhafte Werkzeugvorschau. Freie oder benutzerdefinierte Farben bleiben außerhalb dieses Slices.


Aktueller Stand: Excalidraw liegt hinter einem kleinen `canvas-port`. Hand, Auswahl, Stift, Marker, Radierer, Text, Rechteck, Ellipse und Raute sowie Undo/Redo und Fit funktionieren. Stift und Marker öffnen bei Auswahl ein touchgerechtes Werkzeug-Popover mit fünf Stift- beziehungsweise vier Markerfarben und vier unabhängig gewählten Strichstärken `Fein`, `Normal`, `Breit`, `Sehr breit`; `Normal` entspricht den bisherigen Enginewerten. Beim Stift zeigt die bereits im offiziellen Fluent-`Edit 24 Color`-Original getrennt angelegte vordere Spitzenfläche die gewählte Farbe; beim Marker übernimmt dies seine dafür geeignete Lucide-Spitze. Der bestehende Port wendet Farbe und native Strichstärke auf den nächsten Strich an. Lokale PNG-, JPEG- und WebP-Bilder sowie PDFs lassen sich per `Material hinzufügen` oder Drag-and-drop übernehmen und werden vor der Canvasplatzierung als Original in der aktiven Stundenbasis gespeichert. PDF.js wird erst für einen tatsächlichen PDF-Import geladen, bringt seine Decoderdateien im lokalen Build mit und rendert höchstens 20 Seiten pro Import mit Faktor 2 in PNG-Seitenbilder; dadurch bleiben auch separate Schwarzweißmasken typischer Scanner-PDFs vollständig erhalten. Jede Seite wird ohne gemeinsame Seitengruppe als unabhängiges Bild nebeneinander platziert. Canvas-Snapshot und Binärassets bleiben in getrennten IndexedDB-Stores derselben Teststunde. Binärassets werden dort einzeln adressiert; beim Öffnen gelangen nur die im aktiven Snapshot referenzierten Dateien in die Engine. Der frühere Sammeldatensatz wird beim ersten Öffnen verlustfrei migriert. Ein ausgewähltes Bild bleibt in der Desktop-Lehrerbearbeitung direkt an seiner Fläche verschiebbar. Zum Drehen bleibt ausschließlich der native Punktgriff oberhalb der Auswahl sichtbar; ein zusätzlicher runder Eckbutton entfällt. Der Canvas-Adapter übernimmt auf diesem Griff die ruhige blaue Transformationskontur und das Vierteldrehungsraster, beim Loslassen entsteht genau ein Verlaufsschritt. Die Eckpunkte bleiben der Skalierung vorbehalten. Das Formwerkzeug bietet `Ohne Füllung`, `Transparent` und `Deckend`; dieselbe dreistufige Palette erscheint an einer einzeln ausgewählten Grundform. Kontur und Füllung bleiben native Engine-Eigenschaften, die transparente Variante verwendet echte Alphatransparenz und Grundformen werden ohne Skizzenrauheit gezeichnet. Stift-, Marker-, Text- und Formobjekte, deren Mittelpunkt beim Erstellen innerhalb eines Bildes liegt, werden automatisch in dessen Engine-Gruppe aufgenommen. Der Materialverbund wird gemeinsam verschoben, skaliert, gedreht, im Verlauf behandelt und lokal geladen, während die Annotationen als editierbare Canvasobjekte vom Rasterasset getrennt bleiben. Bei überlappenden Bildern gewinnt das visuell oberste Bild. Als Desktop-Abkürzungen erscheinen beim Hover über einem Bild Lucide-Auge, `LocateFixed`, `RectangleHorizontal`, Kontrast-, Crop- und Druckericon. Die sechs 32-Pixel-Aktionen liegen vollständig außerhalb des Materials, bevorzugen dessen lange Seite und weichen bei Viewportrand oder benachbartem Material auf eine freie Seite aus; auf groben Zeigern bleiben sie 48 Pixel groß. Die Kontrastaktion `Scan optimieren` erzeugt für Bilder und PDF-Seiten eine reversible abgeleitete Rasterfassung und schaltet mit `Originaldarstellung verwenden` auf das unveränderte Ausgangsasset zurück; beide Fassungen bleiben über denselben Assetpfad erreichbar, ohne eine zweite fachliche Quelle zu bilden. Die drei gleich großen YouTube-Aktionen für Abdeckung, Zentrieren und Fokus verwenden dieselbe adaptive äußere Platzierung, statt den Anbieter-Player zu überlagern. Das Auge startet oder beendet ausschließlich den pointerdurchlässigen Elementfokus mit sichtbarem Aktivzustand, stärkerer Abdunklung und weich einblendendem, umrandungsfreiem Blattausschnitt; `LocateFixed` zentriert das Bild davon unabhängig mit moderatem Fit-Zoom und ruhiger Kamerafahrt. `RectangleHorizontal` legt beim ersten Verwenden eine vollständige, von rechts einwischende Abdeckung als natives Element desselben Materialverbunds an; sie lässt sich innerhalb des Bildformats direkt verschieben und an allen Kanten und Ecken skalieren. Ein erneuter Klick entfernt sie und merkt sich ihre letzte bildlokale Geometrie samt Andockkante; spätere Wiederherstellungen verwenden diesen Zustand statt des vollständigen Defaults. Undo/Redo und Reload erhalten den Zustand. Im aktiven Fokus wechselt ein normaler Klick das Ziel, `Shift` ergänzt oder entfernt getrennte Fokusziele; freie Fläche oder `Escape` beenden den Modus. `Inhalt finden` bleibt der globale Kamerarückweg. Das Druckericon rendert ausschließlich das saubere Rastermaterial mit seiner aktuellen Drehung, Spiegelung, Beschneidung und gegebenenfalls gewählten Scanoptimierung, passt die Druckseite an Hoch- oder Querformat an und öffnet den System-Druckdialog. App-Chrome, Abdeckung und Tafelraum-Annotationen bleiben ausgeschlossen; PDF-Seiten verwenden vorerst die lokale PNG-Rendition. Fokus, Zentrierung und Druck verändern weder Elemente noch Verlauf oder Persistenz; Scanoptimierung sowie das Hinzufügen, Bearbeiten und Entfernen der Abdeckung ist dagegen normaler gespeicherter Canvasverlauf. Excalidraw rendert in beiden Shell-Themes neutral; dunkle Canvasfläche, Standardtinte und der kontraststarke semantische Selektionsakzent werden explizit gesetzt, damit Rasterbilder beim Themewechsel farblich unverändert und Auswahlrahmen in beiden Themes klar erkennbar bleiben. Rastermaterial und der Audio-Player erhalten darüber einen leichten themeabhängigen, pointerdurchlässigen Materialschatten. Er wird aus der vorhandenen Viewportgeometrie abgeleitet, bleibt eine lokale abschaltbare Darstellungspräferenz und verändert weder Canvasdaten noch Verlauf, Druck oder Export. Für den aktuellen Qualitätsvergleich wird die Arbeitsfläche mit mindestens zwei Renderpixeln pro CSS-Pixel supersampelt; höhere native Displaydichten bleiben erhalten. Eine Development-Zoomkontrolle unten rechts zeigt die aktuelle Stufe, ändert sie in Zehn-Prozent-Schritten und setzt per Prozentklick auf `100 %` zurück. Der Canvas-Zustand wird lokal in IndexedDB gespeichert; das vorbereitete Bild bleibt ein separates Asset. Eine globale Aktion zum Zurücksetzen der Unterrichtsfläche gehört nicht mehr zur Shell. Diese Desktopprüfung bestätigt ausdrücklich noch kein Touch-, Stift- oder Palm-Rejection-Verhalten und legt keine Handles für Tafel- oder Teilnehmeransichten fest.
Ergänzende Werkzeugoptionen: Das Farbpopover richtet sich an allen vier Dockseiten an der Mittelachse des aktiven Stift- beziehungsweise Markerbuttons aus. Beim direkten Wechsel zwischen beiden Werkzeugen bleibt dieselbe Fläche geöffnet und gleitet ruhig zur neuen Position; die bestehende reduzierte Bewegungsvariante bleibt erhalten.

Ergänzender Toolbar-Iconstand: Die dockbare Hauptwerkzeugleiste verwendet als geschlossene Einheit die offiziellen 24-Pixel-Assets aus Microsoft Fluent System Icons; Shell und kontextuelle Aktionen bleiben bei Lucide. Damit ist die oben noch beschriebene einzelne Fluent-Ausnahme für den Stift und das dort genannte Lucide-Markericon ersetzt. Beim Stift trägt die Original-Spitzenfläche von `Edit 24 Color`, beim Marker der unveränderte Spitzen-Unterpfad von `Highlight 24 Regular` die jeweils gewählte Werkzeugfarbe. Die gewählte Grundform spiegelt Farbe und Füllzustand mit regulärer beziehungsweise gefüllter Fluent-Maske. Eigene oder beschnittene SVG-Geometrien entstehen nicht; das offizielle SVG-Paket ist versionsgebunden.

Ergänzender Werkzeugzustand: Die aktive Werkzeugwahl wird ohne großflächige Akzentfüllung vermittelt. Die Fluent-Silhouette wechselt zur Akzentfarbe und das Icon wächst weich um ungefähr zehn Prozent innerhalb des unveränderten 54-Pixel-Ziels; sichtbare Labels erhalten zusätzlich etwas mehr Gewicht. Fachliche Farbvorschauen von Stift, Marker und Form bleiben erhalten. `prefers-reduced-motion` entfernt die Umschaltbewegung.

Ergänzende Abdeckungsinteraktion: Bei Teilabdeckung verschiebt die Abdeckungsmitte nur die Fläche und der sichtbare Blattbereich den gesamten Materialverbund. Bei Vollabdeckung bewegt die Mitte automatisch den Materialverbund; die acht Griffe bleiben für die Größenänderung erreichbar. Bild, Vollabdeckung und Annotationen werden in jedem Drag-Zwischenzustand atomar um denselben Versatz bewegt, sodass keine erst beim Loslassen reparierte Freilegung entsteht. Abweichende gespeicherte oder transformierte Abdeckungsgeometrie wird über die stabile Bild-ID wieder innerhalb des Formats ausgerichtet. Anlegen und Entfernen verwenden denselben kurzen Wisch von beziehungsweise zu der nächstgelegenen Bildkante; eine gespeicherte Andockkante löst Gleichlagen bei Vollabdeckung. Lichtstreifen, Aufblitzen und zusätzlicher Blattimpuls entfallen. Die Animation ist pointerdurchlässig, verändert weder Canvasgeometrie noch Verlauf und entfällt bei reduzierter Systembewegung. Nach Auswahl eines Bildes bleiben die Bildaktionen auch ohne Hover sichtbar; auf groben Zeigern wachsen sie als vorläufiger Touchpfad auf 48 Pixel, ohne damit bereits die spätere Tafelinteraktion festzulegen.

Ergänzende Abdeckungsziele: Die vorhandene kontextuelle `RectangleHorizontal`-Aktion steht nach Auswahl auch für freien Text sowie eigenständige Rechtecke, Ellipsen und Rauten bereit. Bei einer Form sitzt sie als letzte Aktion in deren vorhandener Formatierungsleiste, bei freiem Text und beim abgedeckten Verbund außerhalb des Objekts. Beschriftete Grundformen behandeln Container und gebundenen Text als einen temporären Abdeckungsverbund. Die graue Fläche bleibt dasselbe persistierbare native Abdeckungselement mit Undo/Redo und Reload. Bei Grundformen ist ihre editierbare Geometrie ein ziellokaler rechteckiger Abdeckbereich; das native Element zeichnet dessen Schnitt mit der unveränderten Formkontur einschließlich Eckenrundung. Die sichtbaren Polygon-Bounds sind dabei nicht die Bearbeitungsgrenzen (D-186). Freier Text und rechteckige Materialien bleiben rechteckig abgedeckt; technische Rechtecke, fremde Mehrfachauswahlen und Materialprojektionen behalten ihre bisherigen Regeln. Nach dem Entfernen der Abdeckung bleibt kein technischer Gruppen- oder Sperrzustand am Text beziehungsweise an der Form zurück.

Ergänzender Bildzuschnitt: `Bild zuschneiden` sitzt als weitere kontextuelle Iconaktion in derselben Bildaktionsreihe. Ein Klick öffnet darüber die zwei beschrifteten Wege `Ausschnitt wählen` und `Ränder trimmen`. Der erste übernimmt ein frei innerhalb des Bildes aufgezogenes Rechteck unmittelbar als neuen Ausschnitt. Der zweite verwendet statt der schwer treffbaren nativen Linien eigene bildgebundene Trefferzonen: Jede vollständige Kante ist auf 36 CSS-Pixel Tiefe ziehbar, die vier Ecken besitzen 44-Pixel-Felder; sichtbar bleiben nur kompakte Akzentgriffe. Nach einem Drag bleibt der Trimmmodus für die nächste Seite aktiv. Auf groben Zeigern wachsen die vorläufigen Ziele mindestens auf 48 Pixel. Beide Wege verändern ausschließlich dieselbe nicht-destruktive Cropgeometrie des vorhandenen Bildelements und führen weder zweite Bilddatei noch paralleles Datenmodell, Modal oder zusätzliches Panel ein. Cropgeometrie wird von Undo/Redo, Reload, Rotation, Zentrierung und dem bereits transformfähigen Druckpfad berücksichtigt. Sobald die zugehörige Bildaktionsreihe mangels Auswahl oder Hover verschwindet, beendet die UI den flüchtigen Zuschneidemodus automatisch; Cropdaten und Verlauf bleiben erhalten. Die Menübewegung entfällt bei reduzierter Systembewegung. Die Mausbedienung ist prüfbar; die endgültige Touch-/Stiftgröße bleibt offen.

Ergänzende Materialauswahl: Das ausgewählte Bild bewegt, skaliert und dreht den gesamten Materialverbund. Eine direkt ausgewählte Annotation lässt sich innerhalb desselben Verbunds unabhängig neu positionieren; Verlauf und lokaler Reload erhalten ihre Materialzuordnung.

Ergänzende Formannotation (D-179): Neu auf einer normalen Grundform begonnene Stift- und Markerzüge erhalten beim Abschluss eine eigene native Formgruppe mit der Form und ihrem gebundenen Text. Die tatsächliche Rechteck-, Ellipsen- oder Rautenkontur und die sichtbare Ebenenfolge bestimmen das Ziel; eine Form über einem Bild gewinnt nur innerhalb ihrer Kontur. Die Form bleibt unabhängig von Material darunter. Auswahl, Skalieren, Drehen, direkte Einzelverschiebung der Annotation, Radierer, Abdeckung, Undo/Redo und Reload folgen demselben Canvasgruppenpfad. Frühere lose Striche werden nicht nachträglich anhand ihrer aktuellen Lage gebunden.

Textbild beim Formskalieren (D-180): Der lokale Canvas behält für den ersten Transformationsframe die bereits geladene Textgrafik. Sobald dieselbe direkte Rich-Text-Vorschau wie beim Editieren gezeichnet hat, wird die technische Grafik verdeckt. Nach dem Loslassen wird die finale rekonstruierbare PNG dekodiert und erst dann sichtbar; semantischer Text, Snapshot und öffentliche Projektion bleiben unverändert.

Ergänzender Clipboard-Import: Externe PNG-, JPEG- und WebP-Bilder aus der Systemzwischenablage werden vor dem verborgenen Engine-Bildwerkzeug abgefangen, zuerst additiv in der aktiven Stundenbasis gespeichert und anschließend durch denselben Tafelraum-Konvertierungs-, Platzierungs- und Assetpersistenzpfad wie Dateiauswahl und Drag-and-drop geführt. Eine alleinstehende `http`-/`https`-URL fragt am letzten Canvas-Zeigerort zuerst in einer kompakten Zeile nach ihrem sichtbaren Linktext und wird erst nach Bestätigung über denselben stundenbezogenen Linkpfad wie die Materialeingabe gespeichert und platziert; YouTube verwendet ohne diesen Zwischenschritt den Player, andere Ziele einen nativen Canvas-Textlink mit getrenntem Label und Ziel. Reine Canvas-Zwischenablagedaten, normaler Text und Paste innerhalb einer Texteingabe bleiben beim nativen Objekt- beziehungsweise Textpfad.

Ergänzender Textzustand: Neue Canvastexte starten mit der lokal gebündelten Nunito-Schrift und der eindeutig aktiven Größe `M`. Die Kontextpalette ordnet fünf Größen wie Kleidergrößen als `XS`, `S`, `M`, `L`, `XL`; `XS` ergänzt kleinere Hinweise, ohne den Standard zu verändern. Ein Klick erzeugt frei wachsenden Text; Aufziehen mit dem Textwerkzeug setzt alternativ eine feste Textbreite mit sofort sichtbarem Umbruch. Doppelklick auf einen vorhandenen Text oder eine Grundform öffnet auch aus dem Handmodus die native Bearbeitung; gebundener Formtext bleibt am Container verankert. Neue Formenbeschriftungen wählen Schwarz oder Weiß nach dem stärkeren Kontrast zu deckender Form beziehungsweise Canvas; gleichfarbiger Altbestand wird beim nächsten Bearbeiten lesbar migriert. Seit D-161 formatiert die Palette bei Objektauswahl den ganzen Text und bei Zeichenauswahl nur die gewählte Spanne; Ausrichtung wirkt auf die berührten Absätze. Farbe, Schrift, Größe, Kursiv, Unterstreichen und Durchstreichen stehen auf beiden Ebenen bereit. D-163 gruppiert `Text bearbeiten` und `Textgestaltung öffnen` mit der vorhandenen Abdeckung als drei gleichartige Objektbuttons ober- oder unterhalb der Textfläche; die vollständige Palette wird bei Bedarf aufgeklappt, ist über einen eigenen Griff frei verschiebbar und in zwei kurze Zeilen gegliedert. Unformatierter Text bleibt in nativen Engine-Feldern; gemischte Formatierung liegt semantisch am Textobjekt und erhält eine daraus abgeleitete Rasterfassung. Seit D-165 folgen sichtbare Markierung und Cursor bei gemischter Schrift, Größe und Absatzausrichtung derselben Zeilenberechnung wie die Rasterfassung; D-166 zeichnet Änderungen während der Bearbeitung mit derselben Routine unmittelbar in einer flüchtigen Ebene und hält sie bis zur fertigen Bildübergabe sichtbar. Das native Eingabefeld übernimmt weiterhin Tastatur, IME, Zwischenablage und Undo. D-169 markiert per Doppelklick den geschriebenen Absatz samt Aufzählungszeichen und automatischen Anzeigeumbrüchen, auch beim Öffnen des Editors; Alt/Option plus Doppelklick wählt weiterhin ein Wort. Desktop-Maus ist geprüft, Touch und Stift auf Zielhardware sind offen. Einzelheiten stehen in [D-161 bis D-169](DECISION_LOG.md) und [UI Brief 13](../design/13_RICH_TEXT_FORMATTING_UI_BRIEF.md).

Ergänzender Werkzeugabschluss: Text und Form wechseln erst nach einer erfolgreich abgeschlossenen Neuerstellung automatisch zu `Auswahl`; das neue Objekt bleibt für unmittelbares Verschieben selektiert. Abbruch und leer bestätigter Text gelten nicht als Erstellung. Stift und Marker bleiben als fortlaufende Werkzeuge aktiv. Der Wechsel wird aus dem nativen Engine-Abschluss abgeleitet und führt keinen zusätzlichen Canvaszustand ein.

Formtext-Höhenlage (D-182): Die native vertikale Ausrichtung des gebundenen Textobjekts ist für Vorschau und Editor verbindlich. Eine sichtbare Altlage, die nicht zu ihrem gespeicherten Wert passt, wird beim Szenenabgleich einmalig auf die nächstliegende native Position gebracht; spätere Höhenänderungen verschieben den Text entsprechend. Die aufgeklappte Textpalette steuert oben, mittig und unten für den ganzen Formtext, nicht für eine Zeichenmarkierung. Details in [D-182](DECISION_LOG.md) und [UI Brief 13](../design/13_RICH_TEXT_FORMATTING_UI_BRIEF.md).

Ergänzender Desktop-Schnellweg: Im Handmodus wechselt ein Doppelklick auf ein sichtbares Canvasobjekt direkt zu `Auswahl` und übernimmt das Objekt beziehungsweise seinen Materialverbund. Symmetrisch wechselt ein Doppelklick auf freie Canvasfläche im Auswahlmodus zurück zu `Hand` und unterdrückt dort die native Textanlage; vorhandene Objekte behalten ihre native Doppelklickbearbeitung. Das ist keine Festlegung der späteren Touch- oder Stiftgeste.

Ergänzender Pan-Cursor: Das dauerhaft gewählte Handwerkzeug und das temporäre Halten der Leertaste verwenden denselben stabilen Desktop-Cursorzustand. Die systemeigene offene Drag-Hand kennzeichnet Pan-Bereitschaft und bleibt über der gesamten Canvas- und Enginefläche einschließlich ihrer nachträglich eingeblendeten Aktions- und Einbettungsebenen auch ohne Mausbewegung sichtbar; es wird kein eigener Cursor darübergelegt. Ab primärem Pointer-Down bleibt die systemeigene geschlossene Hand bis Pointer-Up oder Abbruch bestehen, auch wenn Canvasobjekte oder kontextuelle DOM-Aktionen unter dem Zeiger wechseln. Temporäres Leertaste-Pan wird nur vorbereitet, wenn die Arbeitsfläche den Tastaturfokus besitzt; fokussierte Texteingaben, native Controls und ein aktiv bedienter YouTube-Player behalten die Taste und lösen weder Handcursor noch Pan-Abdeckung aus. Die Kamera bleibt vollständig im nativen Excalidraw-Panpfad; Tafelraum stabilisiert ausschließlich dessen flüchtigen CSS-Cursorbereich und führt weder eigene Kameralogik noch gespeicherten Zustand ein.

Ergänzende Desktop-Kürzel: Die Shell ordnet ausschließlich `A` Auswahl, `S` Stift, `M` Marker, `R` Radierer und `T` Text zu. Leertaste bleibt bei Canvasfokus das vorhandene temporäre Pan; Form besitzt kein Kürzel. Als getrennte globale Shell-Aktion schaltet `V` den Vollbildmodus an und aus. Bei einer vorhandenen Canvasauswahl drehen `Q` links und `E` rechts in denselben 15-Grad-Schritten wie das vorhandene feine Drehgriffraster; gehaltene Tasten wiederholen die Drehung über den normalen Tastatur-Repeat. Die Shell fängt diese Belegungen und sämtliche verborgenen nativen Engine-Werkzeugkürzel vor Excalidraw ab, ignoriert sie aber in Text- und Formulareingaben sowie zusammen mit Systemmodifikatoren. Hinweise stehen ausschließlich in Tooltips und zugänglichen Shortcut-Metadaten; Werkzeugleiste und Kopfzeile erhalten keine zusätzliche sichtbare Beschriftungsreihe.

Ergänzende Objektaktionen: Rechtsklick auf ein Canvasobjekt öffnet statt des umfangreichen Engine-Menüs ein kleines Tafelraum-Menü `Kopieren` / `Löschen`. Beide Aktionen verwenden dieselben nativen Canvasaktionen wie `⌘/Strg+C`, `⌘/Strg+V`, `Backspace` und `Entfernen`. Materialverbünde, unabhängige Annotationen, Mehrfachauswahl und Undo behalten ihre bestehenden Regeln. Touch-/Stiftzugang bleibt am Legamaster zu prüfen.

### Schritt 4 – Zehn-Minuten-Aufgabentest – als Nächstes am Legamaster

Das Testprotokoll aus `01_TESTPROTOKOLL_TOUCH_CANVAS.md` durchführen. Nicht währenddessen umbauen. Erst beobachten und anschließend priorisieren.

### Schritt 5 – Erste Iteration

Nur die drei stärksten Reibungspunkte verändern. Danach denselben Test wiederholen.

### Schritt 6 – tldraw-Gegenspike

Nur wenn der Excalidraw-Slice stabil genug ist, um fair verglichen zu werden. Keine zweite App-Shell, kein neuer Workflow und keine Zusatzfeatures.

## 9. Testaufgabe

In höchstens zehn Minuten:

1. Teststunde öffnen.
2. Zur Transport-Illustration navigieren.
3. Mit dem Stift zwei Begriffe ergänzen.
4. Einen Begriff markieren.
5. Ein Rechteck um ein Transportmittel setzen.
6. Das kommentierte Bild verschieben und skalieren; Annotationen müssen am Material bleiben.
7. Mit Finger oder Handwerkzeug zu einer freien Fläche navigieren.
8. Eine kurze Arbeitsanweisung eintippen.
9. Eine Aktion rückgängig machen.
10. Vollbild verlassen, neu laden und den Zustand wiederfinden.

## 10. Beobachtung statt Wunschliste

Erfasst werden:

- Wo entsteht eine sichtbare Pause oder Suche?
- Welches Werkzeug wird versehentlich gewählt?
- Schreibt der Stift, während der Finger zuverlässig navigiert?
- Entstehen Palm-/Touch-Fehleingaben?
- Sind Buttons erreichbar und groß genug?
- Verdeckt die Werkzeugleiste relevanten Inhalt?
- Bleibt die Fläche ruhig oder fühlt sie sich technisch an?
- Wird das Material als Unterrichtsobjekt oder als fremder Dateiimport erlebt?
- Würde die Lehrkraft diese Oberfläche morgen zehn Minuten vor einer Klasse einsetzen?

Ein einzelner Kommentar erzeugt noch keine allgemeine Regel. Wiederholte Beobachtungen und deutliche Workflowblocker erhalten höheres Gewicht.

## 11. Abnahmekriterium für 0.1

Prototyp 0.1 ist abgeschlossen, wenn:

- die Testaufgabe auf mindestens einem realen Zielgerät durchgeführt wurde;
- Stift-, Finger- und Auswahlverhalten dokumentiert sind;
- eine GUI-Variante als vorläufige Baseline benannt ist;
- die drei stärksten Reibungspunkte bekannt sind;
- eine Entscheidung `beibehalten`, `ändern` oder `verwerfen` für Excalidraw als Baseline möglich ist;
- keine späteren Features zur Kaschierung ungelöster Kernprobleme eingebaut wurden.

## 12. Danach, nicht gleichzeitig

### Prototyp 0.2 – Material Surface

- Original-PDF als dauerhaftes Asset;
- versionierte PDF-Seitenrenditions und reproduzierbare Zuordnung zum Original;
- Annotationen getrennt vom Original;
- Materialtray beziehungsweise Materialeinfügung testen.

### Prototyp 0.3 – Persistenz

- versioniertes Lesson-Dokument;
- IndexedDB-Outbox;
- einfacher Beelink-Speicher;
- Reload, Offline und Konfliktfall.

### Prototyp 0.4 – Unterrichtsorganisation

- minimale Fach-/Reihen-/Stundenauswahl;
- neue Stunde, öffnen, duplizieren;
- Spiegelimport einer vorhandenen Reihe;
- noch keine umfangreiche Bibliothek oder Sucharchitektur.

### Prototyp 0.5 – Presenter

- zweites Fenster;
- unabhängige Kamera;
- manuelles Vollbild;
- später LIVE/GEHALTEN und Public Projection.

Die Nummern sind Arbeitsreihenfolge, keine Releases. Erkenntnisse dürfen die Reihenfolge ändern.

## 13. Iterationsrhythmus

```text
eine Annahme
→ kleiner Prototyp
→ reale Unterrichtsaufgabe
→ Beobachtungen dokumentieren
→ beibehalten / ändern / verwerfen
→ nächste Annahme
```

Nach jeder Iteration werden nur dann Konzept oder Entscheidungsregister angepasst, wenn sich eine belastbare Produktentscheidung geändert hat. Rohes Feedback bleibt zunächst im Spike-Protokoll.


### Ergänzung D-192: lokale Klassen-/Kurswahl

Die oberste Archivebene ist nun über eine kompakte Auswahl selbst anlegbar und umbenennbar. Derselbe lokale Profilbestand bleibt die Wahrheit; Programmupdates liefern keine persönlichen Klassen aus. Brief 17 beschreibt Wechsel und Namenseditor. Erst der bewusste Unterrichtsklick wechselt die Arbeitsfläche. Löschen ganzer Klassen bleibt außerhalb dieser Erweiterung.

### Ergänzung D-193: native Grundfunktionen

0.1.10 ergänzt die aufrufbare Tastenkürzelhilfe und PNG-Zwischenablage, stabilisiert die bestehende Text-/Annotationsgeometrie und korrigiert die im nativen Grundfunktionstest belegten Laufzeitunterschiede. Kein neues Archivmodell. Maßgeblich sind Brief 18 und das Update-Testprotokoll 12; Browsergrün allein reicht für Desktopreleases nicht aus.

### Druckgleiche A4-Arbeitsblätter – D-259

Der explizite HTML-Druckvertrag `shared-pages` ergänzt responsive digitale Materialien um feste, interaktive A4-Seiten. Objektgröße skaliert den gemeinsamen Inhalt proportional, statt die Aufgaben neu anzuordnen. Neue Instanzen zeigen zunächst eine vollständige Seite; weitere Seiten scrollen innerhalb des Blatts. Die fünf Drug-Harm-Vorlagen sind separat vorbereitet und im nativen Prüfstand gedruckt geprüft. Bestands-Entries bleiben erhalten. App-Unterstützung mit 0.1.50 veröffentlicht; fünf Drug-Harm-Pakete nach verifiziertem Backup und erneuter nativer Druckabnahme produktiv umgestellt; Prüfstand und Aktivierungsgrenze stehen in [A4-Seitentest](30_SHARED_A4_PAGES_TEST.md).

D-259 präzisiert: Diese Druckproportionen gelten initial. Digitale Antwortfelder dürfen danach manuell vertikal wachsen und scrollen; die frische leere Druckvorlage bleibt unverändert.

### Lokale Ergänzung D-260 – eigene Materialnamen

Der Stift zwischen Plus und Entfernen öffnet eine Inline-Benennung. Optionale Anzeigenamen folgen dem stabilen Materialpfad in `.material-names.json` derselben Materialbasis und werden atomar mit Historie geschrieben. Ein Vergleich des vorherigen Anzeigenamens schützt vor konkurrierendem Überschreiben. Quelle/Manifest, Reihenfolge, Provenienz und Canvasstände bleiben unverändert; Reihenmaterial teilt seine Benennung weiterhin über die gemeinsame Basis. Kein zusätzlicher Canvas- oder Browser-Speicherpfad.

### Lokaler Nachtrag: Inhaltsminiaturen im Materialarchiv (14. Oktober 2026)

HTML- und PDF-Zeilen verwenden in der vorhandenen 44-px-Kachel die passive Darstellung aus `LessonMaterialPreview` statt eines dauerhaften Typicons. `LessonMaterialThumbnail` baut die Darstellung anhand der Listensichtbarkeit auf/ab; die Vorschau erhält weder Paket-JavaScript noch Materialzustand. Keine neue Ablage, Rasterpersistenz oder Canvasgeometrie. Audio/Video/Links behalten Typicons. UI-/Prüfstand im Materialdrawer-Brief und Decision Log; noch nicht veröffentlicht.

**Gemeinsame Auslieferung 0.1.52, 14. Oktober 2026:** Die seit 0.1.51 offenen Korrekturen an Materialminiaturen, Namensfeldkontrast, Room-Cursor-Endposition und HTML-Abdeckungen sind im eingefrorenen Hauptarbeitsstand gemeinsam geprüft und veröffentlicht. Frühere offene Releasevermerke sind damit historisch. Prüfstand und Beobachtungsgrenze des sporadischen Linienmusters: `09_DESKTOP_APP_UND_UPDATES.md`.

### Lokaler Anschluss D-261: gegenseitige HTML-Feldpräsenz

Room → Lehrer ergänzt die vorhandene Lehrer → Room-Markierung im selben Renderer. Die Lehrerfläche zeigt vorne gewählte Felder sofort blau mit `Schüler`, auch vor Wertänderungen. Nachrichten bleiben flüchtig, an den bestätigten Room-Stand gebunden und von fachlichen Eingaben getrennt. Keine Archiv-/Remote-Präsenz. Browser/native QA und 313 App-/95 Live-Tests erfolgreich; am 14. Oktober 2026 als 0.1.53 veröffentlicht. Vertrag und Prüfstand: `20_ROOM_CANVAS_INPUT_UI_BRIEF.md`, `23_ROOM_CANVAS_INPUT_TEST.md`, Decision Log D-261.


### D-262 – Unabhängige Annotationbewegung und HTML-Blattsperre

Eigene Textannotation bleibt auf ihrem Blatt frei verschiebbar und folgt weiterhin dessen Bewegung. Explizites Herausziehen löst beim Loslassen die Bindung anhand des sichtbaren Mittelpunkts, ohne automatische neue Zuordnung. WebKit erhält eine verlässliche SVG-Trefferfläche; Zeigerkontakt und Undo bleiben im vorhandenen Canvaspfad. Gesperrtes HTML bleibt auswählbar und zeigt eine explizite Entsperraktion; entsperrte Blätter besitzen einen äußeren Griff für denselben Bundle-Movepfad. Keine Bestandsreparatur oder Archivmigration. Am 15. Oktober 2026 zusammen mit D-263 als 0.1.54 veröffentlicht; Grenzen/Prüfung: `30_SHARED_A4_PAGES_TEST.md`, Decision Log D-262.


### Ergänzung D-263 – Text zurücklegen und kontextuelle Aktionen im Viewport

Bewusstes Ablegen einer einzeln bewegten Textbox stellt die Materialbindung wieder her beziehungsweise überträgt sie auf das oberste getrennte Ziel. Blattbewegung unter freiem Text bindet weiterhin nichts. Bestehende Gruppen, Scrollanker, Szene und Undo bleiben der Datenpfad. HTML-Materialaktionen liegen als dieselbe kontextuelle Aktionsgruppe auf Canvas-Viewportebene, mit unverkleinerten Touchzielen und Kollisionsprüfung gegen vorhandene Werkzeuge/Verlauf/Materialpanel. Der frühere D-262-Vermerk ohne neue Zuordnung ist durch diesen freigegebenen Anschluss erweitert. Am 15. Oktober 2026 als 0.1.54 veröffentlicht; Prüfstand `30_SHARED_A4_PAGES_TEST.md`.


**Korrektur nach 0.1.54:** D-263s Bindungslogik bleibt erhalten; der Einzel-Textdrag verwendet nun aktuelle native Revisionen, synchrone sichtbare Positionen und bereits bei Randüberlappung die bestehende geclippte HTML-Projektion. Kein mitwachsender Engine-Gruppenrahmen während der Geste. Siehe D-263-Nachtrag und `30_SHARED_A4_PAGES_TEST.md`; am 15. Oktober 2026 als 0.1.55 veröffentlicht.


**Marker-/Radierer-Korrektur nach 0.1.55:** Temporäre Engine-Sperren und Gruppenlösung werden vor HTML-/Live-Projektion und Snapshot-Persistenz über dieselbe reine kanonische Ableitung zurückgeführt. Keine automatische Entsperrung oder Überlappungszuordnung. Historisch belegte 17 Drug-harm-Marker separat nach vollständiger verifizierter Sicherung repariert. 331 App-/95 Live-Tests und native Kernflows erfolgreich; App-Korrektur noch unveröffentlicht. Prüfstand `31_MARKER_BINDING_RECOVERY_TEST.md`, D-234/D-235-Nachtrag.


**D-264 – einheitliche Annotationbewegung:** Die D-263-Ausnahme gilt für Text/Stift/Marker und bewusste Einzelbewegung per Ziehen/Pfeiltasten in Lehrer und Room. Gemeinsamer Bindungsabschluss und sichtbare Scrollkoordinaten; Room arbeitet auch bei aktivem Lehrer-Radierer kanonisch und leitet nur die native Engine-Sicht ab. Kein neuer Archiv- oder Remote-Vertrag. Prüfung/Release in `32_UNIFIED_ANNOTATION_MOVEMENT_TEST.md`.

16. Oktober 2026: 0.1.57 korrigiert die durch D-264 abgefangenen Text-Griffgesten, gleicht projizierte Textgriffe ab und erkennt native Änderungen beim Speichern über die öffentliche Szenenversion. Native Abnahme mit finalen Ressourcen, Neustart und Paket-Datenerhalt erfolgreich; siehe `33_TEXT_RESIZE_HANDLES_TEST.md`. Keine neue Produktfunktion oder Migration.


16. Oktober 2026, D-265 / 0.1.58: Gemeinsame sechs Textgriffe für Lehrer und Room ersetzen den kleinen nativen 0.1.57-Adapter. Größere zoomunabhängige Trefferziele, proportionale Ecken, reine Seitengriffe, sichtbarer Fokus und bestehende Text-/Rich-Text-Messung. Keine vertikalen Mittelgriffe. Bestehende native Szene, Materialbindung und Undo; lokale Room-Absicht statt ungeprüfter Textwerte. UI-Brief 22, Prüfstand 34.


**Begrenzter Anschluss D-288,27.10.2026:** Auf ausdrücklichen Nutzerauftrag lokale Satzprüfung für deklarierte Language-Bites-HTML-Pakete umgesetzt. Kein allgemeiner KI-Scope: quellgebundene Lehrer-/Room-Brücke an bestehenden Video-Lab-Dienst, private Projekt-Allowlist und unveränderte Sandbox. Nur isolierter Teststand, keine native Veröffentlichung/Produktivaktivierung. Prüfstand44.

### D-289 – beauftragte persönliche Satzprüfung

Word Families darf ohne laufendes Video Lab über denselben lokalen Materialanschluss
prüfen. Nur sechs kanonische Aufgaben, keine allgemeine KI-Oberfläche. Key separat
im macOS-Schlüsselbund; Settings nur Präsenz/Schreiben/Löschen. Programmupdates und
Materialpakete enthalten keine Credentials. Bestehender Fachzustand/Sandbox/Room
bleiben erhalten; Remote ausgeschlossen. Stand und Aktivierung siehe Prüfstand44.

D-289 auf Nutzerauftrag27.10.2026 lokal in der normalen App0.1.71 aktiviert; BiB-Stunde mit Bite, Translation Drill und Lösung archiviert. Kein öffentlicher Release, Details in Prüfstand44.

D-290: Derselbe0.1.71-Stand auf Folgeauftrag27.10.2026 im regulären Updatekanal veröffentlicht; Downloadhash und Signatur geprüft, persönliche Keys und Unterrichtsmaterialien außen. Belege output/release-0.1.71/.

**28.10.2026 D-293 /0.1.76 lokal:** Language Bites explizit auf beiden lokalen Flächen sichtbar/bedienbar, Room einzige hörbare Ausgabe. Gemeinsamer Zustands-/Leasepfad, keine allgemeine Remote-Wiedergabe. Vertrag04, lokale Abnahme09.

**D-295 /0.1.78 lokal (28.10.2026):** HTML bleibt immer vollständiger gemeinsamer Inhalt; nur native MP4-/YouTube-Objekte besitzen Room-Fernsteuerung bei einem hörbaren Player. Vertrag04, UI-Briefe05/19, lokale Auslieferung09. Remote-Wire und produktive Unterrichtspakete unverändert.

D-297 (28.10.2026, Entwicklungsstand): gemeinsame HTML-/App-Auswahl und Rahmenbewegung ohne separaten Verschiebegriff, bestehender Bundle-/Undo-Pfad. Kein Desktop-/Remote-Release; UI-Brief05 und Decision Log.

Aktueller Härtungsnachtrag29.10.2026: D-325/[Prüfstand56](56_APP_STABILITY_AND_PERFORMANCE.md)
präzisiert Browserentwürfe, geordneten Desktopabschluss, gemeinsame Projektions-
änderungserkennung und optionale Verbindungen. Arbeitsbaumstand ohne Auslieferung;
keine Erweiterung der Archiv-/Teilnehmerrechte oder des fachlichen Prototypscope.
