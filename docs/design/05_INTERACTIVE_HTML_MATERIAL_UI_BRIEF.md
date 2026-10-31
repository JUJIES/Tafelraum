# UI Brief – lokales interaktives HTML-Material

**Stand:** 2. September 2026  
**Status:** verbindlich für den ersten lokalen HTML-Material-Slice in Surface Lab

## Kontext

- **Oberfläche/Zustand:** vorhandener Materialbereich und Canvas einer aktiven Stunde;
- **Zielnutzer:** Lehrkraft in der Vorbereitung beziehungsweise gemeinsame Bedienung an der Tafel;
- **Nutzungssituation:** Ein von Codex erzeugtes, lokal archiviertes HTML-Paket wird wie Bild, PDF oder Audio aus dem Stundenmaterial auf die Arbeitsfläche gesetzt und dort direkt bedient;
- **Eine primäre Handlung:** interaktives Material aus dem Materialbereich auf die Fläche setzen und darin arbeiten;
- **Eine zu prüfende Designfrage:** Bleiben Auswahl und Verschieben auf neutralen Flächen und am ausgewählten Außenrahmen verständlich von der direkten HTML-Bedienung getrennt?

Der Slice unterstützt ausschließlich lokale, manifestierte HTML-Pakete. Allgemeine Websites, URL-Eingabe und ZIP-Import sind nicht Teil dieser Prüfung. Der lokale Instanzzustand folgt D-134 und D-142 sowie dem gesonderten State-UI-Brief.

## Muss sichtbar oder erreichbar sein

- ein Filter `Interaktiv` im vorhandenen Materialbereich;
- eine Materialzeile im bestehenden Muster mit Icon, Manifesttitel, Typ `Interaktiv` und der vorhandenen Plus-Aktion;
- nach dem Einfügen genau eine sichtbare Materialfläche ohne Engine-Doppelkontur;
- bei Auswahl den vorhandenen Außenrahmen ohne separate Verschiebegriff- oder Inhaltszoom-Aktion;
- direkte Interaktion mit Controls, Links und Drag-and-drop-Zielen im Frame beim ersten Klick;
- Scrollen innerhalb des HTML-Inhalts;
- im Auswahlmodus Material auf neutralem Hintergrund mit einer Geste wählen und verschieben; bei Auswahl zusätzlich die geraden Außenrahmenabschnitte ziehen. Hand bewegt dort weiterhin die Canvas-Kamera;
- bei aktivem Stift, Marker, Radierer oder Text vollständige Übergabe der Frame-Trefferfläche an den nativen Canvas; Auswahl und die bewusst nicht materialgebundene Grundform lassen den HTML-Inhalt vollständig direkt bedienen; Hand lässt explizite HTML-Controls und Drag-and-drop-Ziele direkt bedienen, reicht aber Hintergrunddrags an die Canvas-Kamera weiter;
- Auswahl und Größenänderung über die vorhandene Canvasgeometrie;
- modifizierter Canvaszoom auch nach Interaktion im Frame;
- sichtbarer Fehlerzustand, wenn Paket oder Einstiegspunkt fehlen.
- bei Auswahl die drei bestehenden materialnahen Aktionen Zentrieren, Abdecken und Fokus in exakt derselben Aktionsgeometrie wie bei Bild und YouTube: auf Desktop `32 × 32` Pixel, auf groben Zeigern vorläufig `48 × 48` Pixel, jeweils mit `7` beziehungsweise `8` Pixel sichtbarem Abstand untereinander und zur Materialkante.

## Exakter UI-Text

- `Interaktiv`
- Fehlerüberschrift im Frame: `Material nicht verfügbar`
- Fehlertext im Frame: `Das interaktive Material wurde im Unterrichtsarchiv nicht gefunden.`

Der sichtbare Materialtitel kommt unverändert aus `manifest.json` und ist Unterrichtsinhalt beziehungsweise Materialmetadatum, kein zusätzlicher UI-Text.

## Darf nicht erscheinen

- allgemeine URL-Eingabe oder Websitebrowser;
- technischer Pfad, Paket-ID, Sandbox-, CSP- oder Iframe-Erklärung;
- Interaktionsmodus-Schalter, Aktivierungsbutton oder Tutorial;
- Reload-, Vollbild-, Download- oder Öffnen-in-neuem-Tab-Aktion;
- permanenter Spielstandsstatus, Netzwerkstatus oder externe Berechtigungsabfrage;
- zweite sichtbare Kontur aus Canvasplatzhalter und DOM-Projektion.

## Daten- und Darstellungsinvarianten

- Originalpaket und Manifest liegen ausschließlich in der stundenbezogenen `materialBasis`;
- das Canvasobjekt hält Geometrie, Typ, Archivprovenienz und den ausdrücklich beschlossenen materialbezogenen Inhaltszoom;
- Frameposition, Größe und Drehung werden aus dem Canvasobjekt abgeleitet;
- Nutzung im Materialbereich wird wie bei Bild, Audio und YouTube aus lebenden Canvasobjekten abgeleitet;
- HTML wird nicht als `srcdoc`, Base64 oder Engine-Embed gespeichert;
- Hell/Dunkel verändert den Materialinhalt nicht;
- der Frame besitzt eine stabile innere Layoutfläche: Canvaszoom skaliert Griffleiste, Schrift, Buttons, Bilder, Abstände und Inhalt stets als eine geschlossene Einheit und löst keinen eigenen responsiven Umbruch aus;
- der Inhaltszoom verändert unabhängig davon ausschließlich die innere Layoutfläche in Zehn-Prozent-Schritten zwischen `50 %` und `200 %`; ein Klick auf den Prozentwert stellt `100 %` wieder her;
- der Inhaltszoom liegt am nativen Canvasträger, folgt normalem Undo/Redo und Reload und erzeugt weder zweite Canvasgeometrie noch einen eigenen Inhaltsverlauf;
- der standardmäßig gespeicherte semantische Inhaltszustand liegt gemäß D-134/D-142 pro Instanz im bestehenden Stunden-Snapshot und erzeugt keinen Canvas-Undo-Schritt; bei bewusst ausgeschalteter Speicherung warnt nur eine echte Abweichung vom Startzustand vor dem Verlassen;
- eine deklarierte A4-Druckfähigkeit bestimmt gemäß D-143 zusätzlich die vollständige Papierproportion des äußeren Lehrer-Canvasframes; ohne diese Fähigkeit bleibt der allgemeine responsive Manifestviewport maßgeblich;
- die äußeren Materialaktionen verwenden dieselbe Größen-, Icon- und Abstandsklasse wie die entsprechenden Bild- und Videoaktionen; eine abweichende Sondergröße für interaktives HTML ist ausgeschlossen. Speicher- und Zurücksetzen-Aktion sind in `10_INTERACTIVE_HTML_LOCAL_STATE_UI_BRIEF.md` präzisiert;
- neu über dem HTML-Material erzeugte Stift-, Marker- und freie Textannotation trägt denselben bestehenden Materialverbund wie eine Annotation auf Bild oder PDF; die Annotation bleibt ein eigenständig auswählbares Canvasobjekt, während Bewegung über die Griffleiste den gesamten Verbund versetzt; beim inneren Dokumentscroll folgt ihre sichtbare Projektion der HTML-Stelle, an der sie erzeugt wurde;
- eine Teilabdeckung schneidet ausschließlich ihr normalisiertes Rechteck aus Griffleiste und HTML-Inhalt aus; der übrige Frame bleibt sichtbar und direkt bedienbar, während Zeigereingaben im ausgeschnittenen Bereich wieder der nativen Canvasabdeckung gehören;
- nur die geometrisch vollständige Abdeckung verbirgt und sperrt den gesamten Frame einschließlich seiner Zugänglichkeitsebene.

## Abnahme

- Das Paket erscheint als einzelne normale Materialzeile, bleibt nach dem Einfügen sichtbar und erhält den aus der Canvasprovenienz abgeleiteten Verwendungsakzent.
- Ein erster Klick oder Drag auf einem Control beziehungsweise Drag-and-drop-Ziel bedient das Spiel, nicht den Canvas.
- Im Handmodus verschiebt ein Drag auf neutraler Überschrift, Text- oder Layoutfläche die Canvas-Kamera, ohne das Materialobjekt innerhalb der Fläche zu versetzen; im Auswahlmodus bleibt derselbe Bereich beim HTML.
- Ein Drag auf der Griffleiste bewegt den vollständigen Materialverbund aus HTML-Träger, Abdeckung und zugehörigen Annotationen und löst keine Spielaktion aus.
- Stift und Marker zeichnen über dem sichtbaren HTML-Inhalt auf dem Canvas statt im Spiel; Auswahl macht denselben Inhalt vollständig direkt bedienbar, Hand erhält die direkte Spielinteraktion auf Controls und Drag-and-drop-Zielen.
- Eine auf dem HTML-Material erzeugte Annotation folgt dessen Griffleistenbewegung und der beim Erzeugen sichtbaren Dokumentstelle beim Vor- und Zurückscrollen. Sie bleibt danach einzeln auswählbar, lässt sich unabhängig auf der Fläche verschieben und kann nach dem direkten Klick mit Rücktaste beziehungsweise Entf über den vorhandenen Canvaspfad gelöscht werden; Enter löscht nicht.
- Scrollen bleibt im Frame, solange der getroffene innere Bereich in Gestenrichtung noch Inhalt besitzt. An seinem Rand oder bei nicht scrollbarem HTML geht dieselbe Rad-/Trackpadbewegung ohne Moduswechsel in den Canvas-Pan über; `Ctrl` beziehungsweise `⌘` plus Rad/Trackpad zoomt den Canvas immer.
- Derselbe Materialinhalt behält bei Canvaszoom `50 %`, `100 %` und `160 %` dieselbe innere Layoutbreite; allein die gemeinsame sichtbare Skalierung ändert sich.
- Minus und Plus verändern die innere Darstellung, ohne den äußeren Canvasrahmen zu verändern; Undo, Redo und Reload stellen den Prozentwert wieder her.
- Eine auf die untere Hälfte verkleinerte Abdeckung lässt die obere Hälfte sichtbar und bedienbar; der abgedeckte Bereich trifft den Canvas statt des Iframes. Vollabdeckung verbirgt den Frame vollständig. Reload erhält beide Zustände aus derselben nativen Abdeckungsgeometrie.
- Löschen, Undo/Redo, Größenänderung und Reload verwenden den bestehenden Canvas- und Provenienzpfad.
- Fehlendes oder ungültiges Material zeigt keinen scheinbar funktionierenden leeren Frame.
- Ein A4-Hochformatpaket zeigt auch bei wenig Inhalt die vollständige hochformatige Blattfläche; ein Paket ohne Druckfähigkeit behält seine freie responsive Geometrie.
- Touchziel, Stiftverhalten, Mehrpersonenbedienung und endgültige Griffleistenhöhe bleiben bis zum Legamaster-Test unbestätigt.

## Review 1. September 2026

**Verdikt:** Der Desktop- und Einbettungsflow ist für den ersten lokalen Slice ausreichend klar; Hardwareprüfung bleibt erforderlich.

Im lokalen Browser wurde das Physik-Zuordnungsspiel als echte Materialzeile eingefügt und in Hell/Dunkel sowie mit Materialschatten an/aus geprüft. Der Frame bildet eine einzelne ruhige Fläche, die dauerhafte Griffleiste ist als Tafelraumebene erkennbar und die Spieloberfläche bleibt direkt bedienbar. Antippzuordnung, Pointer-Drag, automatischer Rundenwechsel, Griffleistenbewegung, native Größenänderung, Reload, fehlendes Paket und die provenienzbasierte Rückkehr in den Materialvorrat wurden praktisch geprüft. Die zehn Paare erscheinen in zwei Fünfer-Runden; bei `1200 × 760` Manifestgröße sind pro Runde Karten und Ziele ohne internes Scrollen gleichzeitig sichtbar.

Die endgültige Griffleistenhöhe, Finger-/Stifttrennung zwischen Spiel-Drag und Objektbewegung, Mehrpersonenbedienung sowie `Ctrl`/`⌘`-Trackpadzoom bleiben am Legamaster zu bestätigen. Die punktzentrierte Zoomlogik ist automatisiert geprüft; die verwendete Browsersteuerung kann eine gehaltene Modifikatortaste während einer Scrollgeste nicht simulieren.

## Review mit drei Materialtypen – 1. September 2026

**Verdikt:** Der Materialvertrag trägt drei parallele lokale Interaktionen; Hardwareprüfung bleibt erforderlich.

Zusätzlich zum Bild-Text-Zuordnungsspiel wurden ein Fünf-Fragen-Quiz und eine Reihenfolgeaufgabe zum Viertaktmotor über denselben Installer und Materialpfad eingebunden. Alle drei erscheinen als gewöhnliche Materialzeilen, bleiben nach dem Einfügen mit provenienzbasierter Verwendungsmarkierung sichtbar und bleiben nach Reload als getrennte Canvasobjekte erhalten. Der interne Lern- beziehungsweise Spielstand startet bewusst neu.

Der erste automatisch erzeugte Frame ist mit ungefähr `600 × 370` kleiner als die Manifestviewports. Quiz und Ablaufaufgabe besitzen deshalb einen kompakten Höhenmodus, der Inhalte ohne Scrollen zeigt und die Hauptziele mindestens 48 Pixel hoch hält. Die bildreiche Paaraufgabe darf in dieser kleinsten Größe intern scrollen; bei ihrer vorgesehenen größeren Arbeitsgröße zeigt sie Karten und Bildziele gleichzeitig.

Der eingebettete Antippweg ist für alle drei Muster bestanden. Pointer-Drag ist für die Paaraufgabe eingebettet und für die neue Ablaufaufgabe direkt im ausgelieferten Paket bestanden. Die Browsersteuerung konnte den Pointer-Release des neuen Drags im verschachtelten Frame nicht zuverlässig simulieren. Dieser Punkt sowie Finger, Stift und Mehrpersonenbedienung bleiben am Legamaster zu bestätigen.

Werden mehrere Materialien unmittelbar nacheinander eingefügt, ohne das vorherige zu verschieben, verwenden sie wie andere Materialtypen dieselbe neutrale Erstplatzierung und überlagern sich. Für den vorgesehenen Einsatz eines Spiels zur Zeit ist das kein Blocker. Falls mehrere Interaktionen regelmäßig parallel sichtbar bleiben sollen, wäre eine leicht versetzte allgemeine Materialplatzierung eine eigene, materialtypübergreifende Produkthypothese.

## Review der getrennten Zoomstufen – 1. September 2026

**Verdikt:** Canvaszoom und Inhaltszoom sind für den Desktop klar getrennt; Hardwareprüfung bleibt erforderlich.

Beim realen Physik-Zuordnungsspiel blieb die innere Iframebreite bei `50 %`, `100 %` und `160 %` Canvaszoom unverändert bei rund `1978` Layoutpixeln. Sichtbarer Rahmen, Griffleiste und Inhalt verwendeten gemeinsam die Faktoren `0,5`, `1` und `1,6`; das Spiel ordnete seine Karten deshalb nicht aufgrund der Kamerastufe neu an. Der Inhaltszoom `80 %` ließ den äußeren Rahmen unverändert, vergrößerte die innere Layoutbreite auf rund `2472` Pixel und projizierte diese vollständig mit Faktor `0,8` zurück in denselben Rahmen.

Die Grenzen `50 %` und `200 %` deaktivieren jeweils die passende Aktion, der Prozentklick stellt `100 %` her. Zwei Änderungen auf `80 %` ließen sich über `90 %` zu `100 %` rückgängig machen und vollständig wiederholen; Reload stellte `80 %` wieder her. Antippzuordnung, Zentrieren sowie vollständiges Abdecken und Aufdecken blieben funktionsfähig. Bei stark herausgezoomtem Canvas werden auch die Titelaktionen bewusst als Teil des Materials klein; endgültige Lesbarkeit und Bedienbarkeit mit Finger und Stift werden am Legamaster geprüft.

## Review der Teilabdeckung – 1. September 2026

**Verdikt:** Die Sicht- und Trefferflächen folgen auf Desktop derselben Abdeckungsgeometrie; Hardwareprüfung bleibt erforderlich.

Beim realen Physikspiel wurde eine Vollabdeckung auf die untere Hälfte verkleinert. Die obere Hälfte von Griffleiste und Spiel blieb sichtbar, eine dortige Textkarte ließ sich direkt auswählen. Die untere Hälfte zeigte ausschließlich die native graue Abdeckung. Browser-Hit-Testing traf oben den Iframe und unten den nativen Canvas; die ausgeblendete HTML-Fläche konnte daher keine verborgene Spielaktion mehr auslösen. Vollabdeckung entfernte weiterhin den vollständigen Frame aus Sicht- und Zugänglichkeitsebene, Reload stellte die Teilabdeckung wieder her. Drehung sowie Finger- und Stiftinteraktion bleiben am Legamaster zu bestätigen.

## Review der materialgebundenen Annotation – 1. September 2026

**Verdikt:** Der Desktopfluss aus Werkzeugwahl, sichtbarer Annotation und Materialbewegung ist funktional; Hardwareprüfung bleibt erforderlich.

Im realen Physikspiel wechselte die Trefferfläche bei aktivem Stift vom Iframe auf den nativen Excalidraw-Canvas und bei Auswahl wieder zurück. Zwei dort erzeugte Stiftzüge erhielten unmittelbar die bestehende Materialgruppe des HTML-Trägers und wurden aus denselben Canvasdaten als pointerdurchlässige SVG-Projektion über dem Spiel sichtbar. Die Projektion führt weder eigene Positionen noch Persistenz: Reload erzeugt sie erneut aus den gespeicherten Annotationselementen. Ein Griffleisten-Drag verwendet denselben vollständigen Materialverbund aus Träger, Abdeckung und Annotationen. Der direkte Klick auf einen projizierten Strich wechselte aus der Materialauswahl in die vorhandene unabhängige Annotationsauswahl; die endgültige Dragwirkung mit Finger und Stift bleibt am Legamaster zu bestätigen.

## Review der Annotationsauswahl – 2. September 2026

**Verdikt:** Die unabhängige Auswahl und Bewegung entspricht auf Desktop wieder dem vorhandenen Canvasmuster; Hardwareprüfung bleibt erforderlich.

Die frühere zusätzliche Kontur entlang des ausgewählten Strichs wurde durch den vertrauten rechteckigen Auswahlrahmen mit Auswahlgriffen ersetzt. Rahmen und Griffe sind eine flüchtige Projektion derselben nativen Elementgeometrie, weil das sichtbare HTML die darunterliegende Enginezeichnung verdeckt. Nach Auswahl gibt der Frame seine Trefferfläche vollständig an die native Canvasauswahl ab; dadurch lässt sich die Annotation wie auf Bild- oder PDF-Material frei verschieben, während ihre Materialgruppe erhalten bleibt. Ein Teststrich über dem realen Physikspiel änderte beim Drag seine Canvasposition und erschien nach Reload deckungsgleich am verschobenen Ort. Die Browserkonsole blieb fehlerfrei. Touch, Stift, Griffgenauigkeit und Palm Rejection bleiben am Legamaster zu bestätigen.

## Review von Scrollbindung und Löschen – 7. September 2026

**Verdikt:** Für den Desktop bereit; reale Trackpad-, Touch- und Stiftabnahme bleibt erforderlich.

Im isolierten echten Luggage-Arbeitsblatt wurde zunächst ein Marker über der ersten Überschrift erzeugt. Beim Dokumentscroll von `0` auf `2366` Pixel verließ er gemeinsam mit seiner Textstelle den sichtbaren Frame und erschien nach der Rückkehr zu `0` wieder deckungsgleich. Ein zweiter Marker entstand bewusst erst bei Scrollposition `2366`; sein Canvasobjekt erhielt genau diesen materialgebundenen Anker, verschwand bei `0` und kehrte bei `2366` an seine Frage zurück. Der direkte Klick traf seine projizierte Auswahl, zeigte den vorhandenen Auswahlrahmen und gab den Tastaturfokus an den Canvas zurück. Die Mac-Rücktaste löschte anschließend den Marker über den normalen Canvaspfad. Der Test verwendete die reale Paketdarstellung, aber einen synthetischen Canvas und veränderte deshalb weder Stunde noch Unterrichtsarchiv.

### Nachprüfung im echten Rideable-Suitcases-Canvas

**Verdikt:** Für den Desktop bereit; der beobachtete Rückfall lag am gemischten Laufzeitstand, nicht am Material- oder Interaktionsmodell.

Ein Neuimport reproduzierte zunächst den stehenden Marker. Die ausgelieferte Paketdatei enthielt zu diesem Zeitpunkt trotz aktueller Oberfläche noch die ältere, im laufenden Archivserver geladene Bridge ohne Scrollmeldung. Nach kontrolliertem Serverneustart meldete dieselbe echte Karte `1563,75` Pixel Root-Scroll; die vorhandene Markerprojektion wanderte bei `70 %` Inhaltszoom um exakt `1094,625` Pixel mit. Es war weder eine Paketänderung noch ein zweiter Scrollcontainer oder eine neue sichtbare Bedienung nötig. D-153 verhindert künftig diesen Mischzustand beim regulären App-Start. Die Hardwareprüfung mit Trackpad, Touch und Stift bleibt offen.

## Review des Hintergrund-Pans – 2. September 2026

**Verdikt:** Die target-spezifische Werkzeughoheit passt auf Desktop zum freien Canvasworkflow; Hardwareprüfung bleibt erforderlich.

Im Handmodus verschob ein Drag auf der neutralen Kopf- beziehungsweise Textfläche des real eingebetteten Physik-Zuordnungsspiels die Canvas-Kamera um denselben Zeigerweg. Eine Textkarte blieb im selben Modus direkt auswählbar, das passende Bildziel nahm die Zuordnung an und der Rundenstand wechselte von `0 von 10` auf `1 von 10`. Im Auswahlmodus veränderte derselbe Hintergrunddrag die Kameraposition nicht; die Spielcontrols blieben trotzdem direkt bedienbar. Die Browserkonsole meldete keine Fehler.

Der Frame unterscheidet dafür semantische Controls, Links, Formularfelder, native Dragflächen, passende ARIA-Rollen und ausdrücklich mit `data-tafelraum-interactive` markierte eigene Pointerflächen von neutralem Inhalt. Die Klassifikation wird zentral mit dem vorhandenen Paket-Bridge-Code ausgeliefert und erzeugt weder Paketkopien noch einen materiallokalen Modus. Drag-and-drop mit Finger und Stift, Palm Rejection und das Gefühl der neutralen Trefferflächen bleiben am Legamaster zu bestätigen.

## Gemeinsame interaktive A4-Seiten (14. Oktober 2026)

Nutzerentscheidung: Arbeitsblätter zeigen in Lehrer- und Room Canvas dieselbe Seitengeometrie und Anordnung wie beim Ausdruck. Eine Seite bildet den initialen Viewport; weitere Seiten werden im Dokument gescrollt. Änderungen der Objektgröße skalieren Blatt und Eingaben proportional statt responsiv umzubrechen. Bestehende digitale HTML-Tools behalten ihre responsive Oberfläche.

Der neue optionale Vertrag `print.layout = shared-pages` verlangt denselben Entry für Bildschirm und Druck sowie ausdrücklich mit `data-tafelraum-page` markierte vollständige A4-Seiten. Die Vorlage enthält gemeinsame initiale Seitenregeln. Digital dürfen Eingabefelder anschließend nach unten vergrößert werden und innen scrollen; nachfolgende Aufgaben dürfen dadurch im Bildschirmdokument nach unten rücken. Die leere Druckvorlage bleibt mit ihren ursprünglichen Schreibflächen und Seitenumbrüchen unverändert. Keine automatisch geratenen Seiten anhand von Titeln oder CSS-Klassennamen. Vorhandene Vorlagen müssen dafür einzeln umgestellt und gedruckt geprüft werden. Bestandsinstanzen werden nicht still auf andere Seiten oder neue Annotationpositionen umgestellt.

Skalierung: native Materialgeometrie bleibt alleinige Positions-/Größenquelle; der feste innere A4-Viewport wird daraus abgeleitet. Kein separater Dokumentzoom, der das Blatt innerhalb seines Rahmens beschneidet. Proportionale Eckskalierung und Room-Geometrie verwenden denselben Vertrag. Zu prüfen: ein-/mehrseitige Vorlage, Feldwerte, Schrift und Seitenenden, proportionaler Resize, Rotation, Annotation/Abdeckung, Undo/Redo, Reload, Lehrer/Room sowie tatsächlicher Druckdialog.

**Prüfslice D-259:** fünf Drug-Harm-Vorlagen, jeweils eine A4-Hochformatseite, Zielpfad native Tafelraum-Aktion `Material drucken` → Systemdialog → PDF. Zusätzlich synthetische Zwei-Seiten- und Querformatvorlage. Staging erhält die bisherigen HTML-/CSS-Einstiege bytegleich. Produktionsaktivierung erst mit unterstützender App-Version, damit der derzeitige 0.1.48-Client die neuen festen Seiten nicht beschneidet.


## Abdeckungen folgen der Blattrundung (14. Oktober 2026)

Volle und teilweise Abdeckungen lokaler HTML-Materialien schneiden dieselbe kreisrunde Außenkontur wie der sichtbare Viewport (14 Canvas-Einheiten). Die innere Aufdeckkante bleibt gerade; Radius und Position werden bei Größe/Rotation neu aus der vorhandenen Materialgeometrie abgeleitet. Native Abdeckung und die notwendige Darstellung oberhalb des HTML-Iframes verwenden denselben Polygonpfad. Keine pauschale Rundung der beweglichen Abdeckungsbox: Das würde neue Rundungen an inneren Schnittkanten erzeugen. Bestehende Abdeckungen werden über den vorhandenen Konturabgleich aktualisiert; Apps bleiben bei ihrer eigenen Darstellung.

Browserprüfung im synthetischen Archiv: volle Abdeckung, gerade Teilöffnung, erhaltene Außenrundungen und Undo/Redo. 310 App-/Archivtests und 92 Live-/Room-Tests, beide Typprüfungen und Hauptbuild erfolgreich. Geometrie-/Projektionschecks schützen Rotation, kleine Größen, Altaperturen und Room-/Remote-Übergänge. Native WKWebView und Touch/Stift für diese Änderung noch nicht gesondert abgenommen. Beleg: `output/rounded-html-covers/partial.png`.

### Bewegte Abdeckkante / native Bildreste

Nutzerbericht: Beim Aufdecken von unten nach oben und anschließendem Canvas-Pan bleiben gelegentlich horizontale Linien stehen; Stundenreload entfernt sie. Für randgebundene Abdeckungen mit genau einem rechteckigen sichtbaren Rest verwendet die gemeinsame Lehrer-/Room-Projektion nun `inset()` statt einer Even-odd-Lochmaske mit deckungsgleichen Außen-/Innenkanten. Innenliegende Abdeckungen und disjunkte sichtbare Bereiche behalten den allgemeinen Ausschnitt. Fachliche Apertur, Rundung, Interaktion, Zustand und Druck bleiben unverändert; kein Iframe-Reload, künstlicher Versions-/Repaintimpuls oder Zurücksetzen als Reparatur.

Prüfung: 312 App-/Archivtests, 92 Live-/Room-Tests, beide Typprüfungen und Hauptbuild erfolgreich. Alle vier Randrichtungen, skalierte Room-Maße und echte Innenausschnitte automatisiert geprüft. Separate native WKWebView-QA mit aktuellen Web-/Serverressourcen auf vorhandenem QA-Wrapper: vergrößertes Leseblatt, Aufdecken von unten und Kameraänderungen ohne sichtbare Linien. Das sporadische ursprüngliche Linienmuster ließ sich vorher nicht zuverlässig reproduzieren; die Beseitigung in der betroffenen konkreten Produktivszene ist daher noch nicht abschließend bestätigt. Native QA-Archivstand und Beleg unter `output/cover-artifacts/`. Nicht veröffentlicht.

**Gemeinsame Releaseabnahme 0.1.52 (14. Oktober 2026):** Die Kontur- und Randmaskenkorrekturen sind enthalten. Finale native QA mit bytegleichen Web-/Serverressourcen zeigt volle und teilweise Abdeckung mit runden Außenkanten, gerader innerer Kante und sauberer Darstellung nach Fokus-Kamerafahrt sowie Undo/Redo. Room startet mit dem Paket. Die sporadische Produktivszene bleibt mangels zuverlässiger Reproduktion ein Beobachtungspunkt; keine weitergehende Heilungsbehauptung. Details/Belege in `09_DESKTOP_APP_UND_UPDATES.md` und `output/release-0.1.52/`.

## Korrektur: gebundene Textbox bewegen, gesperrtes Blatt wählen (15. Oktober 2026)

Primäre Handlung: eine eigene Textannotation mit einer Geste innerhalb oder aus dem Blatt ziehen. Bindung bleibt, solange ihr sichtbarer Mittelpunkt im bisherigen Material liegt (wie bei der ursprünglichen Zuordnung); beim Loslassen außerhalb wird nur diese Bindung entfernt, ohne neue Zuordnung zu darunterliegenden Blättern. Sichtbare Position bleibt auch bei Scroll/Rotation erhalten. Blattbewegung erhält gebundene Annotationpositionen. Auswahl/Drag verwenden bestehenden Canvaszustand und Undo, keine Paket-/Archivsonderdaten. Gesperrter Blattgrund bleibt auswählbar, bewegt sich aber erst nach explizitem Entsperren. Nur bei seiner Auswahl erscheint am vorhandenen Kontextort ein Schloss mit Aktion `Arbeitsblatt entsperren`, Tooltip `Gesperrt – Arbeitsblatt entsperren`. Keine automatische Entsperrung bestehender Szenen. Abnahme: Drag ab erster Auswahl, über Iframegrenzen, innen/außen, Undo, Zoom/Rotation/Scroll sowie gesperrt wählen/entsperren/bewegen. Formular- und Textauswahl im Material bleiben erhalten.

Bei ausgewähltem entsperrtem Blatt steht der vorhandene Material-Verschiebepfad zusätzlich über einen 48-px-Griff am bestehenden äußeren Kontrollort bereit, auch für gemeinsame A4-Seiten. Er bewegt das Material samt gebundener Annotationen und bleibt vom Iframe-Fokus unabhängig. Direkter Blattgrundpfad bleibt erhalten; Formulare und tatsächliche Textzeichen behalten ihren Interaktionsvorrang.

### Ergänzung: bewusster Drop und sichtbare Materialaktionen

15. Oktober 2026, Nutzerfreigabe nach Gesamtprüfung: Eine einzeln gezogene freie Textbox wird beim Loslassen auf dem obersten Material anhand ihres Mittelpunkts gebunden; zwischen Blättern kann sie entsprechend wechseln. Nur die explizit bewegte Textbox wird neu zugeordnet, niemals ein Blatt beim Darunterschieben. Vorhandene andere Objektgruppen/Mehrfachauswahlen und Texte in Formen bleiben unverändert. Der aktuelle HTML-Scrollstand wird als vorhandener Anker übernommen, ohne Positionssprung. Ein Undo stellt Bewegung und Zuordnung zusammen zurück. Das erweitert bewusst die frühere Regel „Zuordnung nur bei Erstellung“ um diesen expliziten Einzel-Textdrag; kein kontinuierlicher Überlappungsabgleich.

Entsperren, Verschiebegriff und vorhandener Inhaltszoom bleiben am sichtbaren Canvasrand erreichbar, wenn ihre normale Position an der Blattkante außerhalb liegt. Die bestehende kontextuelle Aktionsgruppe wird dafür in Canvas-Viewportkoordinaten begrenzt, mit unverkleinerten 48-px-Zielen und ohne neue dauerhafte Leiste. Drehung, Zoom, Pan und Fenstergrößenänderung berücksichtigen. Kein Kamerasprung und kein fachlicher Speicherzustand.

### Korrektur der laufenden Einzel-Ziehgeste (nach 0.1.54)

Eine Textbox folgt während der gesamten Geste sichtbar der aktuellen Position, auch teilweise über einer Blattkante und beim Hineinziehen aus freiem Canvas. Kein stehen bleibender Ausgangstext, keine zweite versetzte Kopie und keine zusätzliche Fläche hinter dem Text. Der native Canvas zeichnet außerhalb der HTML-Flächen; deren bestehende, auf die Blattfläche begrenzte Annotationsprojektion ergänzt ausschließlich die durch den Iframe verdeckten Bereiche. Während der Einzelgeste gilt dies bereits bei Randüberlappung, unabhängig vom Textmittelpunkt. Sichtbare Scrollposition und aktuelle native Änderungsrevision bleiben deckungsgleich. Einzeln gewählter Text ohne native Containerform zeigt auch nach dem Loslassen nur seinen eigenen Rahmen; kein Bearbeitungsrahmen der ganzen Blattgruppe. Bindung wird weiterhin erst beim Loslassen nach D-263 entschieden. Abnahme umfasst mehrere Positionen innerhalb derselben noch gedrückten Geste, beide Richtungen, Blattrand, Scroll/Zoom und Undo/Redo. Keine neue UI oder sichtbare Copy.

### Marker bleiben beim Radieren auf dem HTML-Blatt

Der vorübergehende native Radiereradapter darf die sichtbare Materialzuordnung nicht verändern. Die bestehende HTML-Annotierung verwendet dabei die belegte ursprüngliche Bindung; nach Werkzeugwechsel bleiben Marker auswählbar und beweglich. Archiv, Browsercache und lokale/öffentliche Projektion verwenden ausschließlich die kanonische Sicht ohne vorübergehende Sperren und Gruppenlösung. Echte Nutzersperren bleiben erhalten. Verlorene Bindungen werden nicht anhand von Überlappung oder Scrollankern automatisch geraten; eine Bestandsreparatur benötigt einen belegten Vorzustand. Abnahme: vorhandene Marker auswählen/ziehen, Radiererwechsel ohne visuelles Verschwinden, einzeln radieren, Undo/Redo, Speichern während des Radierens und Reload. Keine neue UI oder Copy.


## Einheitliche Annotationbewegung – Nutzerauftrag 15. Oktober 2026

Text ohne Formcontainer sowie Stift- und Markerstriche verwenden bei bewusster Einzelbewegung dieselbe Blattbindung in Lehrer und Room: innerhalb bleibt sie erhalten, außerhalb wird sie gelöst, Zurücklegen beziehungsweise Wechsel auf ein anderes Blatt bindet neu. Der sichtbare Mittelpunkt entscheidet beim Abschluss; bloße Blattbewegung bindet nichts. Ziehen und Pfeiltasten verwenden dieselbe Entscheidung. Die vorhandene geclippte HTML-Projektion hält auch bewegte Stift-/Markerinhalte durchgehend sichtbar. Room erhält nur eine flüchtige, abgeleitete lokale Vorschau bis Bestätigung; kein zweiter Speicherpfad oder Remote-Vertrag. Echter Feldfokus und Textbearbeitung bleiben unverändert fensterlokal.

Room-Befehle und sein Undo arbeiten auf kanonischen Gruppen und echten Sperren, unabhängig vom Lehrer-Radierwerkzeug. Nur die native Engine erhält dessen Hilfszustand. Echte Objektsperren bleiben wirksam. Position und Bindung bilden einen gemeinsamen Verlaufsschritt; Ablehnung/Abbruch entfernt die Vorschau. Abnahme: alle drei Objektarten innen/außen/zurück/anderes Blatt, beide Fenster, Pfeiltasten, unterschiedliche HTML-Scrollstände, Zoom/Pan, Lehrer-Radierer während Room-Blattbewegung, Löschen, Undo/Redo, Reload. Mehrfachauswahl und in Formen gebundener Text behalten ihre bestehenden Gruppenwege; reale Touch-/Stiftabnahme bleibt separat.

### Korrektur der Text-Griffpriorität (0.1.57)

Die unabhängige Einzelbewegung darf vorhandene Größenänderungs- und Drehgriffe einer ausgewählten Textbox nicht abfangen. Eckskalierung, seitliche Breitenänderung und Drehung bleiben native Engine-Gesten mit bestehender Textgestaltung und Undo. Die passive HTML-Annotationsoberfläche reicht eine dort beginnende Griffgeste mit gleicher Zeiger-ID an den nativen Canvas weiter. Klick/Ziehen im Textinneren bleibt die unabhängige Bewegung nach D-264; kein neues Datenmodell, keine automatische Bindungsänderung durch Skalieren. Abnahme: gebundener und freier Text, größer/kleiner/Breite, Rotation, Zoom/Pan, Bearbeiten, Undo/Redo und anschließendes Lösen/Zurücklegen.


### Nachfolge D-265 (0.1.58)

Der native Griffadapter aus 0.1.57 ist durch die gemeinsame sechsgriffige Textbedienung aus [UI-Brief 22](22_TEXTBOX_HANDLES_UI_BRIEF.md) abgelöst. Einzeltext auf HTML erhält dieselben festen Treffergrößen wie freier Text. Seiten ändern nur Umbruch/Breite, Ecken proportional, keine oberen/unteren Mittelgriffe. Scrollanker/Bindung und vorhandener Texteditor bleiben erhalten. Die vorherige Aussage „kein eigener Skalierungsweg“ beschreibt nur 0.1.57.


## Gemeinsame HTML-Wiedergabeansicht (D-293,28.10.2026)

`playback.teacherView: "shared"` wählt ausdrücklich den Originalinhalt auf Lehrerfläche
und Room; ohne das Feld bleibt D-278/D-281s leichte Lehrersteuerung erhalten.
`controllerEntry` und `teacherView: shared` schließen sich aus. Keine Ableitung aus
Paketname, Satzprüffähigkeit oder Dateityp. Native MP4/YouTube unverändert.

Der Room-Ausgabeframe behält seine bestehende erneuerte Wiedergabe-Lease und ist
die einzige hörbare Quelle. Die gemeinsame Lehreransicht erhält vor Paketcode
`tafelraumPlaybackMirror.getStatus()/command(command,state?)` und das Ereignis
`tafelraum:mirror-change`. Sie muss ihre eigene Medienausgabe dauerhaft stummschalten,
Hintergrundton unterdrücken und nach Statusverlust pausieren. Der Language-Bites-
Player folgt mit derselben nativen Remotion-Zeitachse dem bestätigten optionalen
`timelinePosition`-Status; keine frameweisen Archivwrites oder zweite Animationsuhr.
Vorschauen erhalten keine Output-Lease und bleiben stumm.

Wiedergabebefehle können begrenzten semantischen Zustand begleiten: Quellframe
und bestehende Capability werden geprüft, Zustand zuerst im kanonischen Hostpfad
übernommen, dann mit token-/sequenzgeprüftem Befehl an denselben Room ausgegeben.
Der Paketadapter `execute(command,state?)` übernimmt bei Bedarf zunächst über
`tafelraumLive.applyState` die Szene und führt den Befehl erst nach dem nativen
Bereichscommit aus. Bestätigungen desselben Zustands dürfen laufende Wiedergabe
nicht wieder pausieren. Antworten/fertige Bewertungen bleiben im vorhandenen
semantischen Vertrag; laufende Prüfungen nicht replizieren. Fokus/Scrollen bleiben
fensterlokal. Ein inaktives Fenster darf einen fremd geänderten Wert nicht über
die Schutzregel für aktuell bearbeitete Felder zurückhalten.

Room-Start pausiert/übergibt weiterhin den lokalen Player; Room-Ende stellt den
bestätigten Inhalt ohne Autostart lokal wieder her. Keine Remote-Freigabe für diese
Pakete und keine neue Persistenz. Test: `scripts/language-bites-shared-browser-test.mjs`
mit Playwright-Modulpfad; temporäres Testarchiv, echtes installiertes Paket als
Inhaltsreferenz, nur neuer generischer Player und Manifestfähigkeit im Test.

## D-295 – verbindlicher Standard für lokales HTML

HTML bleibt im Room-Modus Originalinhalt auf beiden Seiten, auch mit Playback. Keine automatische allgemeine/Autoren-Fernsteuerfläche, kein nötiges teacherView-Opt-in und keine Sonderregel nach Paketnamen. Gleicher Fachzustand, ein Ton, Fokus/Scrollen unabhängig. Native Videoobjekte MP4/YouTube besitzen stattdessen eine gemeinsame ruhige Mediensteuerung am Mac, vorne den einzigen Player. Die historischen D-278/D-281/D-293-Ausnahmen sind damit ersetzt. Vertrag04 und Desktopprüfstand09.

## D-297 – Einheitliche Materialauswahl ohne separaten Verschiebegriff

28.10.2026, ausdrücklicher Nutzerauftrag nach Bedienreview. Lokales HTML einschließlich
Language Bites, gemeinsame A4-Blätter und registrierte Anbieter nutzen denselben
bestehenden Materialbewegungspfad. Im Auswahlmodus wählt ein neutraler Tipp; Ziehen
wählt und bewegt direkt in einer Geste. Buttons, Felder, echte Textzeichen,
Scrollleisten, Medien-/Zeichenflächen und ausdrücklich interaktive Ziele behalten
Vorrang. Hand bedient auf neutralem Grund weiterhin die Kamera. Keine zusätzliche
Aktivierungsstufe und keine paketnamenspezifische Bewegung.

Die separate HTML-/App-Griffaktion entfällt. Bei Auswahl liegen unsichtbare
Trefferflächen ausschließlich außerhalb der vorhandenen geraden Rahmenabschnitte;
Ecken und Seitenmitten bleiben für Skalieren/Drehen frei. Die Trefferflächen sind
16px tief am Desktop und48px bei grobem Zeiger. Sie malen keine zweite Kontur und
verdecken keine HTML-Controls. Inhaltszoom/Browseröffnung und gesperrte Blätter mit
explizitem Entsperren bleiben; A4 erhält keine leere Griff-/Zoomleiste. Pfeiltasten bewegen dasselbe Materialbundle über den vorhandenen Übersetzer mit
einem bestätigten API-Commit, damit ein Undo auch diesen Schritt zurücknimmt.
Der bloße native Pfeiltasten-Preview erzeugte bisher keinen solchen Verlaufsschritt.
Feld-/Textcursortasten und native Mehrfachauswahlen bleiben bei ihrem bisherigen Pfad.
Timer-Griff unverändert.

Geometrie, gebundene Annotationen/Abdeckungen und ein Undo bleiben kanonisch.
Ab dem neutralen HTML-Gestenstart übernimmt der Host dieselbe laufende Geste
mit ihren vorhandenen Screenkoordinaten. Iframes sind nur bis Loslassen/Abbruch
hittest-passiv; der Inhalt wird nicht entladen. Kein Pointercapture in einem
mitbewegten HTML-Browsingcontext. Auch ein reiner Auswahltipp räumt den lokalen
Brückenzustand auf. Die normale HTML-Bedienung wird synchron wieder freigegeben. Der bestehende
Restore-vor-Commit wird synchron ausgeführt. Synthetische UI-Befehle wie Undo/Redo
setzen keinen gehaltenen physischen Zoommodifier mehr; sonst blieb der Iframe
bis zur nächsten echten Taste nicht bedienbar. Für neutrale HTML-Touchgesten wird
nur deren touchstart-Default unterbunden, da pointerdown.preventDefault allein
natives Scrollen nicht verhindert. Keine globale touch-action-Sperre des Inhalts;
Controls/Text behalten native Touchbehandlung. Fremde Anbieter behalten ihre
explizite eigene Bridge; kein Zugriff auf deren DOM oder generischer Scriptimport.

Keine Persistenz-/Export-/Remote-Wire-Änderung, keine Materialmigration oder
Anbieteraktivierung. Der normale Desktop- und Updatekanal bleiben bei diesem
Entwicklungsauftrag unverändert. Prüfscript material-selection-browser-test.mjs,
Belege output/material-selection/. Physisches Board/Touch/Stift weiterhin separat.

Abschlussprüfung D-297:395 App- und115 Live-/Roomtests sowie Typprüfung und
Frontendbuild bestanden. Chromium, WebKit und echte Chromium-Touch-Eingabesimulation
prüfen neutrales Direktziehen, mehrere Gesten, erst Tippen/dann Ziehen, Außenrahmen,
Pfeiltasten und jeweils Undo, Felder/Buttons/Language-Bite-Play sowie native
Textauswahl und A4-Eckskalierung. Registrierter App-Host mit neutralem Anbieterfixture
prüft Rahmenbewegung/Undo ohne neuen Griff; reale Anbieterbridge unverändert.
Browser-Compositor-Hitprüfung vor Eingabe wie beim vorhandenen Projektionshelper,
keine DOM-Klicksimulation oder erzwungenen Interaktionen. Belege und Quellfingerprint
in `output/material-selection/verification.json`. Desktop-App0.1.79 und öffentlicher
Kanal0.1.78 unverändert; keine Material-/Archivoperation. Physische Boardabnahme offen.

## D-298 – Inhaltszoom gehört bei Bedarf ins Embed

28.10.2026, ausdrücklicher Folgeauftrag: Die äußeren Minus/Prozent/Plus-Controls
entfallen bei lokalem HTML, registrierten Apps und Remote-HTML gleichermaßen.
Tafelraum bietet dafür auch keine App-Zoomkürzel oder schreibende
app-content-zoom-Brücke mehr. Der deutsche Browser-Plus-Tastenschutz gegen die
Excalidraw-Ebenenaktion bleibt; er ist keine Inhaltszoomfunktion.

Neue Platzierungen verwenden weiterhin ihre normale responsive Layoutfläche mit
Inhaltsskala1. Alte interactiveHtmlContentZoom/embeddedAppContentZoom-Werte bleiben
rein lesbare Darstellungskompatibilität für vorhandene Geometrie, Annotationen,
Room und Reload; kein Reset/Migration, kein neuer Speicherpfad. Room übernimmt
weiterhin die vorhandene bestätigte Projektion, Remote behält seine logische
Layoutbreite ohne lokale Inhaltszoom-UI. Externe Anbieter können eine frühere
Brückennachricht weiter senden; sie verändert keinen Tafelraumzustand mehr.

Inhaltseigene Zoom-/Darstellungsfunktionen können künftig vom Embed selbst
angeboten werden. Canvaszoom, Materialfokus und Clips bleiben unverändert für
Präsentation und Ausschnitte. HTML erhält keine leere äußere Leiste. Apps behalten
Browseröffnung, gesperrte Objekte die vorhandene Entsperraktion. D-297s gemeinsame
Auswahl/Rahmenbewegung und der Timer bleiben erhalten. Diese Regel ersetzt ältere
Griff-/Inhaltszoom-UI-Aussagen in den Briefen05/12 und im HTML-Vertrag.

Entwicklungsstand, kein Desktop-/Remote-Deployment oder öffentlicher Release.

D-298 geprüft:392 App-/15 Playback-/115 Live-/Roomtests, beide Typprüfungen und
Host-/Teilnehmerbuild bestanden. Drei Tests der ausdrücklich entfernten App-Zoom-
Schreibfunktion entfallen; Browser-Plus- und alte Geometrie-/Skalenprüfungen bleiben.
Chromium/WebKit prüfen fehlende äußere Zoomleisten, alte Skala1,3 ohne Änderung,
ignorierte Alt-Zoomnachrichten/Kürzel und unveränderte Auswahl/Controls/Play.
Getrennter Live-Dienst mit zwei Teilnehmern prüft HTML-Zustand, Touch-Eingabe,
Canvaszoom ohne Reflow, enge Clips ohne Zoomleiste und Reload. Das ältere Prüfscript
verwendet dazu den heutigen synthetischen Host-Start statt der historischen
Live-Canvas-UI. Language Bites auf Lehrer/Room einschließlich Position/Kapiteln/
Antworten/Feedback und einmaligem Ton bestanden. Belege
`output/material-selection/no-content-zoom-verification.json`. Keine Installation,
Anbieter-/Remote-Aktivierung oder Materialmigration.

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

D-299 geprüft:395 App-Tests und Frontendbuild/Typprüfung bestanden;12 gezielte
Layoutprüfungen einschließlich sichtbarem Teil einer großen Fläche, Drehung und
benachbartem Material. Chromium/WebKit und Chromium-Touchsimulation prüfen Bild,
Arbeitsblatt und Language Bite mit den Aktionen seitlich im unteren Bereich sowie
die bestehenden Auswahl-, Eingabe-, Play-, Undo- und Skalierungsgesten. Das
Language-Bite-Screenshot wurde visuell geprüft. Belege
`output/material-selection/action-position-proof.json`. Physische Boardprüfung
bleibt offen; bisher keine Installation oder Veröffentlichung.
