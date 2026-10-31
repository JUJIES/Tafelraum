# UI Brief – Room Canvas Pilot

**Stand:** 25. September 2026  
**Status:** erster Room-Pilot umgesetzt; Hardwareabnahme am echten erweiterten Bildschirm offen.  
**Reviewurteil:** Browserfluss und natives Zweitfenster geprüft; konkrete Grenzen im [Testprotokoll](../implementation/22_NATIVE_APP_UPDATE_0_1_20_ROOM_CANVAS.md).

## Handlung und Designfrage

Eine Lehrkraft präsentiert mit vorhandenen Clips auf einem erweiterten Bildschirm. Versteht sie Room Canvas und Remote Canvas als dieselbe Regie mit einem anderen Ausgabeziel, ohne zweite Clipbedienung oder technische Einstellungen?

## Gemeinsame Lehrersteuerung

- `Clip aufnehmen` startet unabhängig von der aktuellen Auswahl eine Geste; `C` wählt dasselbe Werkzeug in der Lehreransicht. Ein Antippen von Bild, PDF-Seite, lokalem HTML, lokalem Video, YouTube oder Timer legt das Material auf den nächsten freien Platz; erneutes Antippen eines schon zugeordneten Materials belässt seine Nummer. Ziehen legt einen Ausschnittclip an, auch wenn die Geste auf Material beginnt. Ein leerer Tipp lässt das Werkzeug aktiv, Escape bricht ab. `Strg/⌃ + 1–9` legt ein mit `Auswahl` markiertes Material gezielt auf die jeweilige Nummer. Es verliert dabei seine alte Nummer; ein zuvor auf dem Zielplatz liegender Clip verliert seine Zuordnung. Ein einziges Rückgängig stellt beide Einträge wieder her. Die Zahl 1–9 zeigt unabhängig vom Typ den jeweiligen Eintrag. Materialclips referenzieren das lebende Canvasobjekt, sodass Bewegung und Größenänderung seiner Einzelansicht folgen. Sie erzeugen keinen künstlichen Ausschnitt und wechseln die Ausgabe beim Anlegen nicht.
- Materialclips bleiben grundsätzlich Room vorbehalten. Der ausdrückliche Timer-Nachtrag vom 28.10.2026 ergänzt ausschließlich Timer als isolierte passive Remote-Materialansicht in derselben nummerierten Folge; andere Remote-Materialclips bleiben ausgeschlossen. D-294 ergänzt ausdrücklich registrierte Apps mit `roomView.protocol=rrweb-2.2-v1` (aktuell Lerndeck) in derselben lokalen Materialclipfolge: Room rekonstruiert die aktive Lehrerinstanz einschließlich Menü, Setwahl und Lernen; Ausschnittclips begrenzen dieselbe Darstellung. Bedienung und Ton bleiben am Mac, kein zweiter Login oder Anbieterzustand. Remote-Apps bleiben ausgeschlossen. Der bestehende spontane Button `Material zeigen` bleibt als direkte Room-Aktion erhalten.
- Ein gerade gezeigter Platz kehrt beim Ersetzen oder Löschen zur Canvasansicht zurück. Fehlt das referenzierte Canvasobjekt vorübergehend, wird der Materialplatz nicht aufgerufen; seine Stundenreferenz bleibt für ein mögliches Canvas-Undo erhalten.

- Der Einstieg heißt `Präsentieren`. Das Panel bietet `Room Canvas` und `Remote Canvas`. Die bisherigen Modusbuttons `Frei`/`Clip` entfallen; das Anzeigeziel entsteht durch die jeweilige Handlung.
- Die Ausgabewahl verwendet zwei Lucide-SVGs derselben Shell-Sprache: Monitor für den lokalen erweiterten Bildschirm, Globus für den entfernten Beitritt. Die Namen bleiben sichtbar; bei laufender Ausgabe übernimmt der geschlossene Einstieg das gewählte Symbol. Die Icons ergänzen die Beschriftung und ändern keine Präsentationslogik.
- Zunächst läuft eine Ausgabe. Währenddessen ist die Ausgabewahl gesperrt; `Beenden` macht sie wieder wählbar. Panelöffnen allein startet, beendet oder übernimmt keine Sitzung.
- Die gemeinsame Hauptaktion heißt `Starten`, danach an derselben Stelle `Beenden`. Bei Room öffnet Start genau ein öffentliches Fenster in normaler Canvasansicht; dafür muss kein Clip vorhanden sein.
- Der geschlossene Einstieg zeigt bei laufender Präsentation neben dem Ausgabesymbol nur den aktuellen Anzeigemodus: `Canvas`, `Clip` oder `Material`. Auch ein nummerierter Materialclip heißt hier `Material`, weil die isolierte Materialansicht läuft. Die zusätzliche Zielzeile mit Clipnummer beziehungsweise Materialtitel und × im geöffneten Panel entfällt. Der zugängliche Name des Einstiegs behält Nummer beziehungsweise Titel zur Orientierung. Bei Clip und Material beendet ein zugängliches × mit Namen `Zur Canvasansicht` das Anzeigeziel. Es beendet nicht die Präsentation. Remote behält die ikonierte Teilnehmerzahl.
- Room bietet während der Ausgabe nachgeordnet `Fenster anzeigen`. Bei genau zwei erweiterten Bildschirmen startet das Fenster automatisch im Vollbild auf dem Bildschirm ohne Lehrerfenster. Andernfalls bleiben manuelles Verschieben und die vorhandene Vollbildaktion verfügbar.
- Remote behält Einladung, QR und Teilnehmer; Room zeigt diese Elemente nicht.
- Clipnummern, Kürzel und Rahmenaktionen bleiben direkt erreichbar. Die Nummer bleibt auch am aktiven Rahmen sichtbar; der aktive Zustand erscheint durch Hervorhebung am Nummernfeld. Während der Präsentation bleiben die Lehrerrahmen auch in Canvas- und Materialansicht zugänglich. Clip anlegen ist Vorbereitung; erst eine Nummer zeigt ihn. Aktive Rahmenbewegung, Abbruch und Rückgängig wirken auf beide Ansichten.
- Gespeicherte Ausschnitt- und Materialcliprahmen bleiben auch ohne laufende Präsentation auf der Lehrerfläche sichtbar, damit die gemeinsame Nummernfolge beim Vorbereiten unmittelbar lesbar ist. Rahmen und Nummer liegen dort oberhalb jeder Materialabdeckung und bleiben unabhängig von deren Zustand sichtbar und bedienbar; in Room und Remote erscheinen sie nicht. Der Materialrahmen folgt der aktuellen Geometrie des referenzierten Canvasobjekts und trägt genau eine Nummer. Die Nummer sitzt wie beim Ausschnittclip links oben innerhalb des Rahmens: gleich groß, ohne Materialsymbol. Linksklick zeigt den Clip; Rechtsklick oder Halten der Nummer öffnet ein kleines Menü mit `Nummer ändern` und `Entfernen`. Beim Ändern wird eine Nummer von 1 bis 99 eingegeben; ein belegter Platz wird ersetzt. Ein dauerhaft sichtbares Löschsymbol entfällt.
- Der Ausschnittclip hat rechts unten zwei kräftige, offene Ecklinien als Größen-Griff. Sie liegen über der Rahmenecke und rücken beim Hover leicht nach außen; keine gefüllte Kachel verdeckt den Canvas. Die unsichtbare Bedienfläche bleibt 48 × 48 px groß, und der Griff ist auch ohne Hover sichtbar.
- D-306: Die Kontur eines Materialclips folgt der sichtbaren Materialkante einschließlich typabhängiger Rundung, Canvaszoom und Drehung. Eckige Bilder/PDF-Seiten bleiben eckig; HTML/Apps verwenden ihren bestehenden Materialradius, Video/YouTube ihre Playerkontur. Nummer und ihre 48-px-Bedienfläche behalten die bisherige Position am äußeren Begrenzungsrahmen. Ausschnittclips behalten ihre rechteckige Kamerageometrie; die Kontur ist ausschließlich Lehrer-UI und wird nicht gespeichert oder übertragen.
- D-311: Beide Cliparten zeigen bei 100 Prozent Canvaszoom eine 24-px-Ziffer in einer 48-px-Kachel. Beim Hineinzoomen wächst sie nicht weiter; unter 100 Prozent schrumpft die sichtbare Kachel samt Ziffer und Innenabstand proportional. Die unsichtbare 48 × 48-px-Trefferfläche, Fokus und vorhandenen Clipaktionen bleiben erhalten. Größen sind allein Lehrer-UI, kein neuer Clipzustand.
- `Material zeigen` ersetzt die bisherige lokale Abdunkelaktion. Ein Präsentationssymbol und zugänglicher Name bezeichnen die sofortige Ausgabe ohne Clipaufnahme; die Werkzeugaktion heißt davon unterscheidbar `Clip aufnehmen`. Die Materialaktion ist bei laufender Ausgabe an unterstützten Materialien erreichbar; ein anderes Material ersetzt das Ziel. Beim bereits gezeigten Material ist sie ein sichtbarer, nicht erneut auslösbarer Zustand `Material wird gezeigt`. Das vorhandene × führt zur Canvasansicht zurück. Auswahl oder privates Navigieren löst keine Präsentationsaktion aus.
- In der normalen Room-Canvasansicht folgt der saubere öffentliche Ausschnitt der Lehrerkamera auch bei offener Room-Leiste. Deren Handmodus bedient HTML, bewegt aber die Canvas-Kamera nicht. Bei Material/Clip bleibt die Raumkamera unabhängig. Empfohlener Rückweg per ×: beide Kameras zum zuletzt gemeinsam gezeigten Ausschnitt zurückbringen und von dort Kamerafolgen fortsetzen. Remote behält in Canvas seine bisherige freie Teilnehmernavigation und `Alle zu mir` als einmaligen Rückruf.
- `Vorschau` bleibt nachgeordnet. Bei Room verwendet sie das echte Bildschirmformat und den bestätigten Ausgabestand. Beim Wechsel des Anzeigeziels wird der zuvor bestätigte Ausschnitt nicht als neues Material ausgegeben; bis zur Bestätigung des Raumfensters bleibt die Vorschau neutral. In einem niedrigen Lehrerfenster verkleinert sie sich proportional, statt nach oben über Rückgängig/Wiederholen zu springen; auch beim Verschieben bleiben diese Schalter frei.

## Öffentliche Raumansicht

- Inhalt ohne Archiv, Werkzeugleiste, Cliprahmen, Materialgriffe, Eingaberechte oder eigene Pan-/Zoomsteuerung. In Materialansicht nur das gewählte Material samt zugehörigen Anmerkungen und Abdeckungen; Nachbarobjekte bleiben unsichtbar.
- Clip vollständig und unverzerrt einpassen. Außerhalb der sichtbaren Clipgrenze liegt neutraler Hintergrund über allen Inhaltsschichten.
- HTML übernimmt logischen Layoutviewport, Inhaltszoom und die Höhe der Material-Titelleiste vom Hauptfenster. Die Raumprojektion zeigt dort einen nicht bedienbaren Titel statt Materialgriff und Zoomtasten; der HTML-Inhalt beginnt damit an derselben Stelle innerhalb eines Ausschnittclips. Der fachliche Zustand ist in beiden Fenstern gemeinsam: Formulare, Buttons und deklarierte Paketinteraktionen können vorne und am Lehrergerät bedient werden. Der tatsächliche Eingabefokus und Cursor bleiben je Fenster unabhängig; D-247 zeigt den aktiven Lehrer-Schreibstrich und seine Textmarkierung zusätzlich als flüchtige Anzeige im Room-Feld. Room darf mit Fingerziehen oder Mausrad selbstständig scrollen; der Scrollstand ist vorne flüchtig und unabhängig. Neue Stift-/Markerannotation verwendet den dortigen Root-Scrollstand.
- Audio bleibt reine Wiedergabe am Lehrergerät: Play, Pause und Springen ändern niemals das Room-Anzeigeziel. Ausschnitt- und Materialclips bleiben sichtbar; neue Audio-Materialclips werden nicht angelegt. Alte Audio-Zuordnungen bleiben mit entfernbarer Nummer sichtbar, lassen sich aber nicht mehr zeigen. Lokales Video und YouTube werden im Hauptfenster bedient. Play erhält einen aktiven Materialclip oder Ausschnittclip, der das Video enthält; außerhalb eines solchen Ziels öffnet es die Materialansicht. Pause und Springen folgen. Ein verspäteter laufender Positionsbericht darf einen ausdrücklich neu gewählten Clip nicht ersetzen. Nur der Lehrerplayer ist hörbar und nutzt die am Mac gewählte Tonausgabe. Das Raumvideo läuft stumm; der Raumplayer korrigiert zeitliche Abweichungen, ohne eine eigene Bedienleiste einzublenden. YouTube benötigt Netz und kann kurz anders puffern; bildgenaue Synchronität ist dafür keine Zusage.
- Bei eindeutigem Zweitdisplay beginnt Room im Vollbild; die vorhandene zugängliche Fensteraktion kann es jederzeit verlassen oder erneut einschalten. Vollbild verlassen beendet die Präsentation nicht; Fenster schließen beendet Room Canvas.
- Erstes Laden und Stundenwechsel bleiben bis zum vollständigen Stand neutral. Bei Ausfall innerhalb derselben Stunde bleibt der letzte vollständige Stand mit knapper Unterbrechungsanzeige stehen; der Lehrerstatus markiert ihn nicht als aktuell.
- Ein bewusst ausgelöster Wechsel des Anzeigeziels erhält im Room-Fenster eine kurze räumliche Ankunft: Der neue, vollständig bereite Inhalt kommt mit geringer Skalierung und höchstens 26 px horizontaler beziehungsweise 18 px vertikaler Bewegung zur Ruhe. Bei zwei Ausschnittclips folgt die Richtung ihren Mittelpunkten; Canvas- und Materialwechsel bleiben zentriert. Dauer höchstens 360 ms, ohne Drehung, Partikel oder wiederholte Effekte. Ein weiterer Zielwechsel bricht die laufende Bewegung sofort ab. Das erste Laden und ein Stundenwechsel bleiben neutral; HTML wird für die Animation nicht neu geladen. Bei reduzierter Systembewegung erscheint das Ziel unmittelbar. Die normale Maus bleibt privat; der bewusste Zeiger wird gezeigt.

## UI-Text im jeweiligen Zustand

`Präsentieren`, `Room Canvas`, `Remote Canvas`, `Starten`, `Wird vorbereitet …`, `Beenden`, `Fenster anzeigen`, `Canvas`, `Clip`, `Material` (geschlossener Einstieg), `Clip aufnehmen`, `Material zeigen`, `Material wird gezeigt`, `Zur Canvasansicht`, `Alle zu mir` (Remote), `Vorschau`, `Vollbild`, `Vollbild verlassen`, `Fenster konnte nicht geöffnet werden.`, `Ansicht konnte nicht aktualisiert werden.`, `Verbindung unterbrochen`, `Erneut versuchen`.

Bestehende Clip-, Einladungs- und Bestätigungstexte gelten weiter, soweit der [Plan](../implementation/21_ROOM_CANVAS_PILOT_PLAN.md) sie nicht präzisiert. Materialfehler benennen nur das konkrete Problem und den nötigen nächsten Schritt.

## Abnahme

### Eingebauter Timer (D-252)

Canvas und Ausschnittclips zeigen den nicht annotierbaren Timer an seiner kanonischen Canvasposition. Start/Pause, Dauer und Tonwahl werden auch vorne bedient; Room sendet kleine validierte Befehle an die eine Hostlaufzeit. Verschieben am Widgetgriff verwendet den vorhandenen revisionsgeprüften Objektpfad und Room-Verlauf. Ein Start wechselt kein Anzeigeziel. Materialeinzelansicht und Video-Vollbild zeigen weiterhin allein das gewählte Material; der Timer läuft im Host weiter. Raumvorschau zeigt denselben bestätigten Widgetzustand; ihr Kopfbuttonstil gilt ausschließlich für die Kopfcontrols und verändert keine Widgetbuttons im dargestellten Canvas. Endsignal ausschließlich am Lehrergerät. [Widget-Vertrag und Abnahme](21_TIMER_WIDGET_UI_BRIEF.md).

### Video-Regie vom Lehrergerät (5. Oktober 2026)

Primäre Handlung: Video im gewählten Material- oder Ausschnittclip abspielen und vorübergehend in beiden lokalen Ansichten bildschirmfüllend zeigen, ohne zur Maus auf dem Board zu wechseln. Play bei einem im Ausschnitt enthaltenen Video erhält den Clip. Lokales Video und YouTube verwenden denselben Tafelraum-Vollbildknopf (`Vollbild` / `Vollbild verlassen`, Lucide Expand/Minimize); YouTube erhält ihn unten rechts am Player und keinen konkurrierenden Anbieterknopf. Escape beziehungsweise der Knopf beendet das Video-Vollbild in beiden Fenstern. Room kehrt zum vorherigen Clip zurück, die Lehrerkamera bleibt unverändert; Wiedergabe läuft weiter. Video-Vollbild ist flüchtige Regie, kein neuer gespeicherter Clip. Ton ausschließlich Lehrergerät; Room stumm. Ein bewusst gewählter anderer Clip beendet den temporären Zustand und ersetzt das Ziel. Audio und Remote bleiben unverändert. Abnahme: lokales MP4 und YouTube, beide Cliparten, Play/Pause/Seek, Vollbild/Escape wiederholt, Zielwechsel und Stundenwechsel; tatsächlichen Gleichlauf mit Ton am erweiterten Board prüfen.

Präsentieren → Room Canvas → Starten ohne Clip → automatischen Vollbildstart auf dem zweiten Display prüfen → Canvas bewegen → Material im Clipwerkzeug antippen → Ausschnitt aufziehen → Nummern 1 und 2 aufrufen → privat navigieren → Material zeigen → HTML bedienen/scrollen → × zurück zu Canvas → Fenster schließen → erneut starten. Leeren Tipp, Escape, Ziehen über Material, den nicht erneut auslösbaren aktiven Materialbutton, fehlendes/gelöschtes Ziel und reduzierte Bewegung zusätzlich prüfen. Danach die gemeinsamen Anzeigeaktionen mit Remote prüfen; dessen freie Teilnehmerkamera bleibt ausdrücklich eine eigene Ausgaberegel.

Invarianten: gleiche Clipdaten/-aktionen, unabhängige Lehrerkamera, passender HTML-Zustand und Rückmeldung des tatsächlich angezeigten Stands. Schnelle Nummernwechsel und reduzierte Bewegung zusätzlich prüfen. An 16:9-, 16:10- und Hochformatflächen Nachbarobjekte außerhalb des Clips prüfen. Browserbefunde bestätigen keine native Fenster-, Touch- oder Beamerabnahme. Der echte erweiterte Bildschirm ist die letzte Freigabebedingung für den Montagstest.

### Rahmenloses lokales HTML (D-250)

Room-Canvas und Vorschau zeigen in der bisher titeltragenden oberen Zone keinen Materialtitel mehr. Die Zone ist transparenter Außenraum; Inhalt, Annotationen und Clipkoordinaten behalten ihren Ursprung. Blattkante und Schatten beginnen am sichtbaren Inhalt. Keine Lehrer-Zoom-/Verschiebecontrols vorne. Die isolierte HTML-Materialansicht und Remote behalten ihre vorhandene Geometrie.

**D-251:** Bei umgestellten lokalen HTML-Trägern entfällt auch die frühere transparente Titelzone. Room verwendet dieselbe aktuelle Inhaltsgeometrie wie Lehrer, Auswahl und Abdeckung. Altträger werden zuerst im kanonischen Host umgerechnet; keine zweite Room-Migration. Die lokale Projektionsangabe `roomContentOnly` wird aus dem Trägerkennzeichen abgeleitet und gehört nicht zum Remote-Wire.

**Touch-Abschluss der Clipaufnahme (28.10.2026):** Der nach Pointerup erzeugte Kompatibilitätsklick darf nach Ende der einmaligen Aufnahme nicht in das darunterliegende Material/Widget fallen. Ein koordinatengebundener einmaliger Click-Guard verwirft nur diesen Abschluss; jeder neue Pointerdown beendet ihn sofort, damit die nächste bewusste Bedienung erhalten bleibt.

## D-295 – HTML-Inhalt, Video-Fernsteuerung

HTML vollständig auf Lehrer/Room bedienbar und zustandsgekoppelt; laufende HTML-Ausgabe/Ton einmal über die bestehende Lease. Nur native MP4-/YouTube-Objekte entladen im Room-Modus den Lehrerplayer und zeigen Play/Pause, Zeitleiste, Lautstärke und Room-Vollbild. Vorne läuft ein hörbarer Player; passive Vorschau zeigt den Medienstatus ohne weiteren Decoder. Lautstärke ändert keine Position, schnelles Pause→Seek darf nicht Play auslösen. Clip/Vollbild erhält denselben Player. Room-Ende stellt lokale Pause mit bestätigter Position/Lautstärke her; neue Quelle startet nie von selbst.

## Verfügbarkeit von Remote (29.10.2026)

Die bestehende lokale Konfigurationsauskunft bestimmt die Verfügbarkeit des
Remote-Ziels. Ohne Einrichtung bleibt „Remote Canvas“ deaktiviert, daneben steht
„Remote Canvas ist auf diesem Gerät noch nicht eingerichtet.“ Während Prüfung
„Remote Canvas wird geprüft …“; fehlgeschlagene Prüfung erhält „Erneut prüfen“.
Ein wiederaufgenommener berechtigter Remote-Raum bleibt bedienbar. Room benötigt
weiterhin keine Dienstkonfiguration und bleibt unabhängig verfügbar.


## Distributionsumfang D-330 (29.10.2026)

Die persönlichen Funktionen dieses Briefs bleiben im persönlichen Build erhalten.
Der öffentliche Export bietet keine Appauswahl/Lerndeck-Verbindung, keinen
KI-Anschluss und keine Remote-Auswahl/-Einrichtung. Präsentieren bietet weiterhin
Room Canvas mit denselben Clip-, Material- und Eingabepfaden. Die Versionsanzeige
heißt dort `Version` und bietet keine Updateprüfung. Keine leeren/deaktivierten
Vorschauen dieser entfernten Anschlüsse; kein neuer Erklärtext auf der Arbeitsfläche.
Browserabnahme in Hell/Dunkel; Hardwareabnahmen bleiben separat. Umfang und
Prüfweg in [Vertrag61](../implementation/61_DISTRIBUTION_BOUNDARY.md).
