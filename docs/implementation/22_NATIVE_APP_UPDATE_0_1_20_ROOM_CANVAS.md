# Room Canvas 0.1.20 – Prüfstand und Montagstest

**Stand:** 26. September 2026  
**Aufgabe:** Einen Unterricht aus dem lokalen Archiv über Clips und einzelne Materialien auf einem erweiterten Bildschirm führen.  
**Testgerät:** lokaler Apple-Silicon-Test-Mac; während der Entwicklung war nur ein 2560 × 1440 Display online. Der echte Beamer-/Zweitbildschirmtest steht daher offen.

## Geprüfter Ablauf

- Browser mit Entwicklungsarchiv: `Präsentieren → Room Canvas → Starten` öffnete genau eine getrennte Ansicht. Fenster schließen setzte die Lehrersteuerung auf `Starten` zurück; erneuter Start öffnete eine neue Ausgabe. Clipanlage änderte die Ausgabe nicht. Clip 1 und Clip 3 ließen sich mit 1–9 direkt aufrufen; die öffentliche Ansicht zeigte jeweils den Ausschnitt, während die Lehreransicht den aktiven Clip benannte. Das × führte zur Canvasansicht.
- In einer Physik-Teststunde zeigte `Material zeigen` zunächst nur das ausgewählte HTML-Arbeitsblatt und danach direkt ein anderes HTML-Material. Die Raumansicht enthielt den jeweiligen Inhalt ohne Nachbarmaterial. Derselbe Materialbutton führte zur Canvasansicht zurück. Eine Testeingabe in ein Standardfeld erschien in Room und wurde anschließend auf beiden Seiten wieder geleert.
- Die Raumvorschau verwendete den zuletzt vom Empfänger bestätigten Stand und das gemeldete Fensterseitenverhältnis. Sie wurde mit HTML-Inhalt im Browser geöffnet und wieder geschlossen.
- Separat gebautes natives Testbundle mit eigener App-ID, eigenem Testarchiv und Loopback-Port: `Starten` öffnete ein echtes Tauri-Zweitfenster; dessen Vollbildbutton schaltete ein und aus, ohne die Präsentation zu beenden. Schließen des Raumfensters ließ Lehrerfenster und Unterricht offen; erneuter Start funktionierte. Ein Clip wurde in der isolierten Teststunde angelegt und im dortigen Stunden-Snapshot gespeichert. Die produktive Desktop-App und ihr kanonisches Archiv wurden dabei nicht verändert.

## Technische Checks

Abschlusscheck am 26. September: App- und Live-Typprüfung bestanden; 57 Live-Tests und 254 App-Tests bestanden; Live- und Produktionsbuild erfolgreich; `cargo check` und Rust-Test erfolgreich. Der ARM64-Release 0.1.20 ist signiert gebaut. Das entpackte ZIP bestand die macOS-Signaturprüfung; das Updaterarchiv wurde kryptografisch gegen den eingebauten öffentlichen Schlüssel verifiziert. Der Browser- und native Ein-Display-Test ersetzen weder den realen erweiterten Bildschirm noch einen Unterrichtsdurchlauf auf Touchhardware.

Der Empfänger behält bereits erhaltene Bildassets für die Dauer derselben Stunde im Raumfenster. Dadurch kann ein früher gezeigter Clip oder ein Bild nach zwischenzeitlichem Materialwechsel zuverlässig erneut erscheinen. Bei Stundenwechsel oder Fensterschluss werden die Objekt-URLs freigegeben. Entfernte Anzeigeziele leeren auch die Raumvorschau.

## Installation auf dem lokalen Test-Mac

Die bisherige App 0.1.18 wurde am 26. September regulär beendet. Das signaturgeprüfte 0.1.20-Bundle liegt nun am bisherigen Ort `~/Desktop/Tafelraum.app`; das vorherige Programmbundle liegt separat unter `~/Library/Application Support/Tafelraum Release/app-backups/Tafelraum-0.1.18-before-room-2026-09-26.app`. Die produktiven Archiv- und Notizordner wurden beim Austausch nicht verschoben oder verändert. Die neue App startete; ihr gebündelter lokaler Dienst lieferte `/room.html` mit HTTP 200. Der Mac war für die abschließende Sichtprüfung der installierten Hauptoberfläche gesperrt; dieser UI-Schritt bleibt offen. Eine Veröffentlichung auf dem Updatekanal erfolgte nicht.

## Grenzen für die erste Stunde

- Room zeigt Canvas, Clips sowie ausgewählte Bilder, PDF-Seiten und lokale HTML-Pakete. Audio, lokales Video, YouTube, Apps und allgemeine Websites sind in der Projektion weiterhin Platzhalter. Für Unterricht mit solchen Inhalten den Projektionsweg vorher einzeln prüfen.
- Lokales HTML übernimmt fachlichen Paket-/Standardfeldzustand und Root-Scroll. Eigenes JavaScript ohne vollständige Zustands-API sowie innere Scrollcontainer können abweichen. Bei einem neuen Material vor dem Seminar kurz die gewünschte Interaktion im Raumfenster vergleichen.
- `Material zeigen` ist zunächst nur in Room verfügbar. Remote Canvas behält die bisherige freie Teilnehmernavigation, Einladung und HTML-Rechte; die neue Material-Einzelansicht und weitere Teilnehmerfreigaben folgen gesondert.
- Ein echter erweiterter Bildschirm war beim Abschluss dieses Prüfstands nicht angeschlossen. Vor dem Montagseinsatz: Room starten, Fenster auf den Beamer ziehen, dort Vollbild aktivieren und an genau diesem Material einmal `Canvas → Clip 1 → Material zeigen → ×` prüfen.

## Entscheidung

Der erste Room-Pilot ist für einen lokalen Ein-Bildschirm-Smoke und einen kleinen Unterrichtsversuch technisch vorbereitet. Die physische Beamerabnahme und die konkrete Stunde bleiben bewusst praktische Prüfungen am Einsatzort. Beobachtete Auflösungs-, Touch- oder HTML-Abweichungen werden hier zuerst als Testbefund ergänzt, bevor die Produktlogik verallgemeinert wird.

## Folgeprüfung D-204 am 27. September 2026

Die gemeinsame Nummerierung von Ausschnitt- und Materialclips ist lokal implementiert, aber weder als natives Update gebaut noch installiert. In einer isolierten Entwicklungsstunde wurde ein Canvasbild mit dem Auswahlwerkzeug markiert. `Clip` legte einen Materialclip auf Platz 1 an; `Strg + 2` legte dasselbe Bild gezielt auf Platz 2. Beide Einträge erschienen im Stunden-Snapshot als Referenzen auf dieselbe Element-ID ohne kopierte Geometrie. Der neue Materialrahmen und das kurzzeitige Rückgängig waren in der Browseransicht sichtbar. Der Browser-Test des Room-Fensters wurde durch dessen Fensterlebenszyklus in der Testumgebung nicht abgeschlossen; die öffentliche Materialanzeige über den nummerierten Aufruf und die reale Beamerbedienung sind noch praktisch zu prüfen. Beide Typprüfungen, 254 App- und 58 Live-Tests sowie der Produktionsbuild bestanden.

## Folgeprüfung: Raumvorschau und Zeichenfluss am 27. September 2026

**Befund:** Bei reiner Canvasbewegung folgte das Raumfenster, die Lehrer-Vorschau blieb dagegen auf dem vorherigen Ausschnitt. Während eines Stiftzugs wurde Room bisher wiederholt vollständig geprüft und projiziert; zugleich wechselte die Bereitschaftsanzeige des Präsentieren-Einstiegs unnötig. Ein Clipwechsel zurück zur freien Ansicht konnte die öffentliche Kamera auf dem alten Clipausschnitt stehenlassen.

**Korrektur:** Der Host hält die bestätigte öffentliche Vorschau in einem eigenen abonnierbaren Zustand. Kamerabewegungen aktualisieren deren Ausschnitt unmittelbar, ohne die gesamte Lehreroberfläche neu aufzubauen. Während eines aktiven Stiftzugs gehen begrenzte Punktänderungen an das Raumfenster; nach dem Loslassen übernimmt wie bisher die vollständige sichere Projektion. Der Präsentieren-Einstieg bleibt bei gewöhnlichen Szenenänderungen bereit. Der lokale Viewer startet beim Wechsel der Kameraregel zwischen Clip und Canvas neu, damit die freie Ansicht wieder ihren eigenen Ausschnitt erhält. Temporäre Diagnosetexte wurden entfernt.

**Isolierter nativer Kernflow:** Die getrennte `Tafelraum Room Test.app` mit eigener App-ID, eigenem Port und neutralem Testarchiv zeigte eine vorhandene Linie im Raumfenster. Nach `Clip 1 → ×` erschien sie erneut in Raumfenster und Raumvorschau. Eine Handbewegung der Lehrerfläche verschob die Linie in der Vorschau ohne neuen Szenencommit. Ein neuer Stiftstrich erschien auf der Lehrerfläche und in der Vorschau; der Präsentieren-Einstieg blieb nach der Geste stabil. Das produktive Archiv blieb unberührt. Diese Sichtprobe belegt die Zustandsübergänge; Stiftlatenz während einer echten längeren Geste und ein physischer Zweitbildschirm bleiben offen.

## Folgeprüfung D-205 am 27. September 2026

Der lokale Quellstand ergänzt nummerierte Materialclips und Room-Wiedergabe für Audio, MP4 und YouTube. In einer isolierten Browser-Teststunde mit MP4-Testdatei schaltete `Play` in der Lehreransicht ohne vorherigen Clipaufruf auf `Material · Testvideo`. Der Room-Empfänger zeigte das Video, während der Lehrerplayer hörbar und der Raumplayer stumm konfiguriert war; beide Player liefen. Der anfängliche Versatz von etwa 0,15 Sekunden wurde durch engere Positionskorrektur während der Wiedergabe in fünf unmittelbaren Stichproben auf etwa 0,02 Sekunden reduziert. Ein Start- oder Pufferungsversatz kann dennoch kurz sichtbar sein; bildgenaue Synchronität ist technisch nicht belegt. Eine lokale MP3-Testdatei startete ebenfalls per `Play`: Das Raumfenster zeigte Titel und laufende Zeit, der Lehrerplayer war hörbar konfiguriert. Nach × stoppte die Wiedergabe auf der Lehrerfläche. Für den Browser-Smoke wurde das Raumfenster nur in der synthetischen Testseite als eingebettete Ansicht geführt, weil die Testbrowser-Umgebung Popups unmittelbar schließt; das ist kein Ersatz für den nativen Zwei-Fenster-Test.

Der YouTube-Testclip schaltete den Room Canvas auf den zugehörigen Player um. Die Einbettung lieferte in der Testbrowser-Umgebung jedoch kein belastbares Bereit-Signal; nach acht Sekunden erschien korrekt der Ladefehler mit Wiederholungsaktion. YouTube-Wiedergabe ist damit noch **nicht abgenommen**.

Beide Typprüfungen, 254 App- und 60 Live-Tests sowie App- und Live-Build bestanden. Der Room-Fensterstart im echten nativen Bundle, Audio über den gewählten Mac-Ausgang beziehungsweise Bluetooth, YouTube mit realer Netzverbindung und die Anzeige auf einem physischen Zweitbildschirm sind noch offen. Das 0.1.20-Protokoll oben beschreibt den damaligen Releasezustand; D-205 ist weder installiert noch veröffentlicht.

## Installation und native Folgeprüfung 0.1.21 am 27. September 2026

Der gemeinsame Quellstand aus D-203 bis D-205 wurde nach Abschluss der Materialclip-Arbeit erneut geprüft: beide Typprüfungen, 254 App-Tests, 60 Live-Tests, Rust-Tests und Produktionsbuild bestanden. Das ARM64-Bundle 0.1.21 wurde signiert gebaut. Das entpackte ZIP bestand die macOS-Signaturprüfung; das Updaterarchiv wurde gegen den eingebauten öffentlichen Schlüssel verifiziert. Die Veröffentlichung auf dem Updatekanal ist nicht erfolgt.

Die laufende 0.1.20-App wurde regulär beendet. Ihr Bundle liegt unter `~/Library/Application Support/Tafelraum Release/app-backups/Tafelraum-0.1.20-before-room-perf-2026-09-27.app`. Das signaturgeprüfte 0.1.21-Bundle wurde unter `~/Desktop/Tafelraum.app` installiert und gestartet. Die produktiven Archiv- und Notizordner wurden dabei nicht verschoben oder verändert. Die installierte Hauptoberfläche öffnete den vorhandenen Unterricht. `Präsentieren → Room Canvas → Starten` öffnete ein natives Room-Fenster mit den vorhandenen HTML-Materialien; das Schließen setzte den Einstieg auf `Starten` zurück und ließ den Lehrerunterricht offen. Dieser Smoke prüfte keine Änderungen an produktivem Unterrichtsmaterial.

Die Beurteilung der Stiftlatenz während einer längeren Geste, eines echten erweiterten Bildschirms und der gewählten Bluetooth-/Beamer-Tonausgabe bleibt für den Montagstest offen. YouTube öffnete im Browser-Test den passenden Raumplayer, die Wiedergabe selbst wurde dort nicht zuverlässig geladen und ist ebenfalls noch nicht abgenommen. Die obigen Aussagen „nicht installiert“ beziehen sich auf den jeweiligen Zwischenstand vor 0.1.21.

## UI-Folgeprüfung 0.1.22 am 27. September 2026

**Aufgabe:** Im Präsentieren-Panel Room Canvas und Remote Canvas anhand von Symbol und Name wählen. **Testgerät:** derselbe Apple-Silicon-Mac, Entwicklungsbrowser bei 1024 × 576 Pixeln und installierte native App im dunklen Theme. Monitor und Globus aus dem bestehenden Lucide-Set waren in beiden Browserzuständen und im nativen Panel lesbar. Der Wechsel Room → Remote → Room änderte nur die Ausgabewahl und zeigte die jeweils passenden nachgeordneten Aktionen. Das Panel ließ sich danach normal schließen. Ein eigener Touch- oder Beamerbefund entsteht aus dieser Iconprüfung nicht.

Beide Typprüfungen, 254 App-Tests, Rust-Test und Produktionsbuild bestanden. Das ARM64-Bundle 0.1.22 wurde signiert; ZIP-Signatur und Updaterarchiv wurden verifiziert. Die bisherige 0.1.21-App liegt als Rückfallkopie unter `~/Library/Application Support/Tafelraum Release/app-backups/Tafelraum-0.1.21-before-output-icons-2026-09-27.app`; 0.1.22 läuft unter `~/Desktop/Tafelraum.app`. Der Updatekanal blieb unverändert.

## Folgeprüfung D-208 am 27. September 2026

**Aufgabe und Gerät:** Im Entwicklungsbrowser auf dem Mac bei 1024 × 576 Pixeln ein Bild auswählen, per `Clip` in die gemeinsame Folge aufnehmen, mit `Strg + 4` dasselbe Bild nochmals zuordnen und danach ein anderes Canvasobjekt wählen. Die Nummern 3 und 4 blieben getrennt lesbar, obwohl beide auf dasselbe Bild zeigen. Der Materialrahmen blieb nach der Abwahl erhalten. Weil oberhalb und unterhalb des großen Bildes kein Platz war, standen die 48-Pixel-Bedienelemente seitlich außerhalb des Bildes. In der Vorbereitung waren die Materialnummern sichtbar, obwohl keine Präsentation lief. Die Lehrerauswahl und die Materialclip-Referenzen blieben voneinander getrennt.

**Checks:** App- und Live-Typprüfung, 62 Live-Tests und Produktionsbuild bestanden. Ein während des Browserchecks sichtbar gewordener Syntaxfehler in der Raumvorschau wurde korrigiert und anschließend erneut typgeprüft und gebaut. Die Änderung ist noch nicht als natives Bundle installiert. Echter Zweitbildschirm, Touchziele und Materialclips für Audio, Video und YouTube bleiben praktische Abnahmen im laufenden Room Canvas.

## Folgeprüfung D-209 am 27. September 2026

**Aufgabe und Gerät:** Im Entwicklungsbrowser auf dem Mac bei 1024 × 576 Pixeln zwischen Material- und Ausschnittclip wechseln. `Clip aufnehmen` plus Bildtipp erzeugte ohne vorherige Auswahl einen Materialclip. Ein Zug auf freier Fläche und ein Zug, der auf dem Bild begann, erzeugten Ausschnittclips. Ein leerer Tipp legte nichts an und ließ das Werkzeug aktiv; Escape beendete es. Antippen eines lokalen HTML-Frames und eines lokalen Videoplayers erzeugte ebenfalls Materialclips. Die gestenbasierte Anlage nutzte weiterhin die vorhandene Clipfolge und änderte das aktuelle Anzeigeziel nicht.

**Regie und Checks:** Im gestarteten Room Canvas blieb die Nummer 5 am aktiven Materialclip sichtbar. Der Bildbutton `Material zeigen` zeigte ein Material sofort; am bereits gezeigten Material meldete er `Material wird gezeigt` und konnte nicht erneut ausgelöst werden. × führte zurück zur Canvasansicht. Nach der letzten Codekorrektur wurde ein weiterer Bildtipp geprüft; das Werkzeug beendete sich nach erfolgreicher Aufnahme. `Strg + 2` belegte einen gezielten Platz weiterhin mit dem ausgewählten Bild; Clip-Rückgängig stellte den vorherigen Zustand wieder her. Beide Typprüfungen, 254 App-Tests, 62 Live-Tests und Produktionsbuild bestanden. Der isolierte Browserbestand enthielt kein ladbares HTML-Paket; die Tippgeste traf dessen Frame, nicht dessen fachliche Interaktion. Ein natives Bundle wurde für D-209 nicht installiert. Reale Touch-/Stiftgesten und der zweite Bildschirm bleiben Hardwareabnahme.

## Folgeprüfung D-216 am 27. September 2026

**Aufgabe und Gerät:** Im isolierten Entwicklungsarchiv auf dem Mac hatte dasselbe Bild aus dem vorherigen Test mehrere Clipnummern. Nach dem Reload erschien nur noch seine höchste Nummer 10. Auswahl des Bildes und `Strg + 6` entfernten die alte Materialnummer 10 und den bisherigen Ausschnittclip 6; Materialclip 6 blieb als einziger Eintrag für dieses Bild sichtbar. Einmal `Clip-Änderung rückgängig` stellte Materialclip 10 und Ausschnittclip 6 gemeinsam wieder her. Erneutes Antippen des Bildes im Werkzeug `Clip aufnehmen` ließ Nummer 10 unverändert und legte keinen zweiten Materialclip an. Der normale Room-Fensterlebenszyklus des synthetischen Browsertests beendete die Ausgabe während einer weiteren aktiven Umnummerierungsprobe; daraus wird keine native Fensterabnahme abgeleitet.

**Checks:** Die Zuordnungsregel und das deterministische Lesen älterer Mehrfachnummern besitzen gezielte Tests. Beide Typprüfungen, 70 Live-Tests, 254 App-Tests und Produktionsbuild bestanden. Ein natives Bundle wurde für D-216 nicht installiert; Touch-, Stift- und Beamerprüfung bleiben Hardwareabnahme.

## UI-Folgeprüfung 0.1.26: Raumvorschau und Verlauf

**Aufgabe und Gerät:** Die Raumvorschau bei 1024 × 576 Pixeln im Entwicklungsbrowser und anschließend in der installierten nativen App auf dem lokalen Apple-Silicon-Test-Mac öffnen. Zuvor konnte eine hohe Vorschau im kurzen Browserfenster bis an den oberen Rand rutschen und dort Rückgängig/Wiederholen überdecken. Jetzt beginnt sie 12 Pixel unter den gemessenen Verlaufsbuttons; bei zu wenig Höhe wird ihre Bildschirmfläche proportional verkleinert. In der nativen App mit 1280 × 768-Raumausgabe blieben beide Buttons über der geöffneten Vorschau sichtbar. Die Vorschau zeigte denselben öffentlichen Canvas wie das gestartete Room-Fenster. Die produktive Stunde wurde für diesen Sichttest nicht bearbeitet.

**Checks:** App- und Live-Typprüfung, 254 App- und 62 Live-Tests, signierter nativer Build sowie Updater-Signatur bestanden. Die App 0.1.26 wurde lokal installiert; der Updatekanal blieb unverändert. Ein Test mit angeschlossenem Beamer und Touchbedienung ist weiterhin offen.

## Folgeprüfung 0.1.27: Materialclip in der Raumvorschau

**Befund:** Beim Wechsel vom freien Canvas auf einen Materialclip konnte die Lehrervorschau bis zur Bestätigung des neuen Raumstands noch den vorherigen, größeren Canvas zeigen. Damit wirkte benachbartes Material fälschlich wie Teil des gewählten Materialclips. Im nativen 0.1.26-Test war das Room-Fenster auf das Material isoliert; die Vorschau zeigte während des Zielwechsels einen abweichenden Zustand und nach Minimieren des Raumfensters zeitweise eine leere Fläche.

**Korrektur und Browserprüfung:** Ein Zielwechsel leert den bisherigen bestätigten Vorschaustand. Erst die Bestätigung des Raumfensters zeigt die neue Projektion. Die kleine Vorschau führt für Clipzustände keine eigene Clip-Einblendanimation aus. Im isolierten Browserflow mit benachbarten Canvasobjekten zeigte der Materialclip danach in Room und Vorschau genau eine HTML-Materialinstanz; die Vorschau behielt Bildschirmformat und Clipgrenze. Beide Typprüfungen und 62 Live-Tests bestanden. Das signierte Bundle 0.1.27 ist gebaut; native Installation und Sichtprüfung folgen.

## UI-Folgeprüfung D-213: Vorschau und Materialbereich

**Aufgabe und Gerät:** Auf dem lokalen Test-Mac den Materialbereich im Entwicklungsbrowser bei 1024 × 576 Pixeln in Hell und Dunkel öffnen; in der isolierten Clip-Testseite die Raumvorschau neben der eingebetteten Ausgabe anzeigen. Das produktive Unterrichtsarchiv wurde nicht geändert.

- Die Vorschau verwendet für ihre Fensterhülle dieselbe semantische Oberfläche, Kontur und Textfarbe wie der Materialbereich. Im dunklen Standardtheme meldeten beide als berechnete Werte `color(srgb 0.0901961 0.105882 0.133333 / 0.97)`, `rgba(230, 235, 241, 0.11)` und `rgb(242, 241, 236)`; die innere Raumprojektion blieb unabhängig bei `rgb(28, 34, 43)`.
- In Hell waren Kopfzeile und Fuß wie beim Materialbereich hell, mit gleicher Titelhierarchie und klaren Aktionsbuttons. Das veröffentlichte HTML-Material blieb unverändert; die Vorschau erhielt weder einen zweiten Innenrahmen noch einen eigenen gespeicherten Themezustand.
- Beide Typprüfungen, Produktionsbuild, 63 Live-Tests und 254 App-Tests bestanden. Das lokale macOS-Paket 0.1.28 wurde erneut signiert, das Bundle und die Updater-Signatur wurden verifiziert. Die laufende Desktop-App wurde nicht ausgetauscht; native Sichtprüfung und echter erweiterter Bildschirm sind weiterhin offen.

## Folgeprüfung D-217 am 27. September 2026

Die Nummernschaltfläche für Ausschnitt- und Materialclips verwendet jetzt dieselben 48 × 48 CSS-Pixel links oben innerhalb des Rahmens, ohne Materialsymbol und ohne dauerhaftes Löschen. Rechtsklick oder Halten der Nummer öffnet `Nummer ändern` und `Entfernen`; Linksklick zeigt weiter den Clip. In der lokalen Browser-Testoberfläche wurde ein Ausschnittclip angelegt, per Rechtsklick das Menü geöffnet und die Nummer von 1 auf 3 geändert; die neue Nummer und die gemeinsame Rückgängig-Aktion erschienen. Über dasselbe Menü wurde der Clip wieder entfernt; anschließend war nur die Rückgängig-Aktion sichtbar. Die identische Materialplatzierung folgt derselben Komponente und CSS-Regel, wurde in diesem Browserdurchlauf aber nicht an einem Materialclip visuell bestätigt. Beide Typprüfungen, 70 Live-Tests, 254 App-Tests und der Produktionsbuild bestanden. Native Darstellung und Haltegeste auf Zielhardware bleiben offen.

## Folgeprüfung D-222 am 27. September 2026

**Befund:** Beim HTML-Arbeitsblatt zeigte der blaue Ausschnittclip auf der Lehrerfläche oben die Material-Titelleiste. Room Canvas und Raumvorschau ließen diese 48 Canvaspixel hohe Leiste aus und begannen den Iframe direkt an der oberen Trägerkante. Dadurch erschien der HTML-Inhalt nach oben versetzt und unten zusätzlicher Inhalt, obwohl die Clipkamera den Rahmen korrekt einpasste. Ein synthetischer Clip mit einfachen Canvasobjekten zeigte keinen solchen Kameraversatz.

**Änderung und Browserprobe:** Room und seine Vorschau verwenden nun dieselbe vorhandene HTML-Inhaltsprojektion wie die Lehrerfläche. Ein nicht bedienbarer Titel hält die Leistenhöhe ein; Materialgriff und Zoomtasten werden nicht projiziert. Im isolierten `synthetic-clips`-Browserflow wurde ein HTML-Arbeitsblatt unter einem Ausschnittclip in Lehrerfläche, Room und Raumvorschau verglichen. Bei Hostzoom 1 begann der Iframe 48 Pixel unter der Trägerkante; der Room-Inhalt begann bei Zoom 0,682 ebenfalls um 32,76 Bildschirmpixel tiefer, die Vorschau bei Zoom 0,755 um 36,26 Pixel. Beide Typprüfungen, 254 App-Tests, 71 Live-Tests, Rust-Test sowie Haupt- und Live-Build bestanden. Der gebündelte Dienst lieferte mit isoliertem Archiv Haupt- und Room-Seite mit HTTP 200. Das veröffentlichte Update 0.1.32 entsprach dem lokalen Paket bytegenau (SHA-256 `877235d3b5b98323908260f70b4e4db26d114a6b9ce1fe3ed86fd82a03a4fdee`) und bestand die Updater-Signaturprüfung. Die Prüfung am nativen Zweitdisplay steht aus. Wenn die Lehrkraft HTML im Room danach bewusst selbst scrollt, darf der sichtbare Inhalt gegenüber dem statischen Lehrerrahmen abweichen.

## Vorprüfung D-223: räumlicher Room-Zielwechsel

**Gerät/Aufgabe:** Lokaler Chromium-Testbrowser, getrennte `synthetic-clips`-Archivkopie unter `output/room-motion-fixture-archive/`. Room im eingebetteten Testfenster starten und Clip 1 mit interaktivem HTML aufrufen. Das produktive Unterrichtsarchiv blieb unangetastet.

**Beobachtung:** Room startete in Canvas und zeigte nach der Clipaktion Clip 1 samt HTML. Die kurze Zwischenanimation ließ sich mit dem Browserwerkzeug nicht zuverlässig als Einzelbild erfassen; Wirkung, Lesbarkeit und Bildrate auf dem echten erweiterten Bildschirm sind daher noch nicht visuell abgenommen. Alle 71 Live-Tests, beide Typprüfungen und der Produktionsbuild bestanden. Zwei kurzzeitige Typfehler aus parallel bearbeiteten Room-Dateien (`public-projection.ts`, `room-canvas-host.ts`) wurden während dieser Prüfung unabhängig behoben. Schnelles Weiterschalten, Materialvideo und reduzierte Systembewegung bleiben praktische Prüfungen.

## Vorprüfung D-225: Cliprahmen über Materialabdeckung

**Gerät/Aufgabe:** Lokaler Chromium-Testbrowser mit isolierter `synthetic-clips`-Archivkopie. Das HTML-Material unter Clip 1 erst vollständig, dann halb abdecken; Nummer und Rahmen auf der Lehrerfläche lesen und den Clip in Room aufrufen.

**Beobachtung:** Auf der Vollabdeckung blieben Ziffer, Rahmen und Verschiebegriff sichtbar. Nach Verstärkung der vorhandenen Kontur war der gestrichelte Rahmen auch auf dem dunklen Cover deutlich erkennbar. Bei Teilabdeckung blieb er über der dunklen und hellen Hälfte lesbar. Die Nummer rief weiterhin Clip 1 auf; im eingebetteten Room-Fenster gab es keine private Clipbedienebene. Beide Typprüfungen, 77 Live-Tests und `git diff --check` bestanden. Das produktive Unterrichtsarchiv wurde nicht berührt. Touchziel und Lesbarkeit am echten erweiterten Bildschirm bleiben Hardwareprüfung.

## Folgeprüfung D-224: automatischer Vollbildstart auf zweitem Display

**Gerät/Aufgabe:** lokaler Test-Mac mit internem Retina-Display als Lehrerbildschirm und erweitertem Philips PHL 275E1 mit 2560 × 1440 Pixeln. Eine getrennte lokale Test-App mit eigener Bundle-ID öffnete über `Präsentieren → Room Canvas → Starten` genau ein Room-Fenster. Die installierte Tafelraum-App und ihr produktives Archiv wurden nicht verändert.

**Beobachtung:** Das Room-Fenster erschien auf dem Philips-Display mit 2560 × 1440 Pixeln und zeigte unmittelbar `Vollbild verlassen`. Nach Schließen des Room-Fensters blieb das Lehrerfenster offen. `cargo check --locked`, Rust-Test, Frontend-Typprüfung und Produktionsbuild bestanden. Eine erste Frontend-Typprüfung traf eine parallel bearbeitete Room-Datei; der spätere Gesamtlauf bestand. Die Raumprojektion blieb in zwei Starts bei `Wird vorbereitet …`; das Lehrerpanel meldete danach `Live Canvas: Bildmaterial ist noch nicht verfügbar.` Der Test verwendete die bereits laufende Entwicklungsseite mit ihrer bisherigen Teststunde. Er bestätigt Bildschirmwahl und Vollbild, nicht die Inhaltsprojektion oder einen gebauten Release.

**Offen:** Ein nativer Release-Build und dessen Room-Kernflow müssen nach Abschluss der parallelen Frontend-Änderung geprüft werden. Fallback mit nur einem oder mehr als zwei Displays sowie Trennen des externen Displays während der Präsentation sind noch nicht auf Hardware geprüft.

## Folgeprüfung 0.1.34: offener Griff am Ausschnittclip

**Gerät/Aufgabe:** Mac-Browser, lokale `synthetic-clips`-Testseite bei 1024 × 576 Pixeln. Den sichtbaren rechten unteren Größen-Griff ansehen, ziehen und die Teständerung unmittelbar über Clip-Rückgängig zurücknehmen.

**Beobachtung:** Zwei offene blaue Ecklinien lagen an der Rahmenecke, während der Inhalt im Griffbereich sichtbar blieb. Der Griff war ohne Hover zu erkennen. Ziehen vergrößerte den Cliprahmen und bot die vorhandene Rückgängig-Aktion; diese stellte den vorherigen Rahmen wieder her. Die aktive Bedienfläche blieb bei 48 × 48 CSS-Pixeln. Die Browserprobe bestätigt weder Touchgefühl noch Erreichbarkeit am echten Board. Die Änderung ist im signierten und veröffentlichten Paket 0.1.34 enthalten.

## Vorprüfung D-233: Präsentieren-Panel ohne zusätzliche Zielzeile

**Gerät/Aufgabe:** Mac-Browser mit isoliertem Testarchiv, Room starten, Clip 1 zeigen und das Präsentieren-Panel prüfen. Anschließend `Beenden` auslösen.

**Beobachtung:** Das Panel zeigte Ausgabe, `Fenster anzeigen`, `Beenden` und Raumvorschau ohne zusätzliche Clipnummer-/×-Zeile. Der zugängliche Name des Einstiegs benannte weiterhin Clip 1; das bestehende × am Einstieg blieb vorhanden. `Beenden` beendete die Präsentation und schloss das Panel. Beide Typprüfungen, alle 82 Live-/Room-Tests und `git diff --check` bestanden. Das produktive Archiv blieb unangetastet. Die Änderung wurde noch nicht als App-Update veröffentlicht.


## Veröffentlichung 0.1.36

D-233 ist im signierten und veröffentlichten App-Paket 0.1.36 enthalten. Releaseprüfungen, Paket-Smoke-Test und öffentliche Hash-/Signaturprüfung stehen in [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md).
