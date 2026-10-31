# Room Canvas – erster lokaler Eingabetest

**Stand:** 27. September 2026  
**Gerät:** lokaler Test-Mac, Chromium-Testbrowser bei 1024 × 576 Pixeln; Room als 400 × 300 Pixel große eingebettete Testansicht. Die Teststunde `synthetic-clips` wurde in einem getrennten Archiv unter `output/room-ink-fixture-archive/` gespeichert. Das produktive App-Archiv wurde für die Zeichenprobe nicht verändert. Danach wurde das signierte Desktop-Bundle 0.1.23 installiert und die native Raumansicht ohne Zeichnung in einer produktiven Stunde geprüft.

## Aufgabe und Beobachtung

`Testinhalt → Room starten → Werkzeuge → Stift/Marker vorne → Lehrer wählt anderes Objekt → Clip 1 → vorne zeichnen → Lehrer markiert außerhalb und bewegt seine Kamera`.

- Stift und Marker erschienen im Room-Fenster sofort und nach Hostbestätigung auch auf der Lehrerfläche. Ein vor dem Raumstrich ausgewähltes Lehrerobjekt blieb ausgewählt. Der Raumstift blieb aktiv, während die Lehrkraft auf ihrem Canvas den Marker wählte.
- Clip 1 hielt die erste Testseite im Raumfenster. Ein neuer Raumstrich erschien auf beiden Flächen. Ein Lehrer-Markerzug auf der zweiten Seite und anschließendes Schwenken der Lehrerkamera änderten den gehaltenen Clipausschnitt vorne nicht.
- Nach Reload lud die Teststunde den Stift- und die Markerzüge aus ihrem Dateistand erneut. Ein Bildaufbau braucht einen Moment; eine unmittelbar beim Laden aufgenommene Momentaufnahme zeigte die Marker noch nicht, die nächste sichtbare Ansicht schon.
- Der erste Browserdurchlauf zeigte einen echten Fehler: Der lokale Strich wurde sichtbar, aber nicht bestätigt, weil die Eingabeprüfung nur UUIDs erlaubte. Excalidraw verwendet andere sichere Element-IDs. Die Prüfung akzeptiert nun dessen begrenztes ID-Format; der identische Strich wurde danach übernommen.
- Bei 400 Pixel Breite zeigt die aufgeklappte Leiste ihre bekannten Werkzeugicons ohne Text. Ihre Lage überdeckt den unteren linken Teil des Arbeitsblatts. Auf einem großen Raumdisplay ist die Position und Erreichbarkeit mit Touch noch zu beurteilen.
- In der nativen Version 0.1.23 öffnet sich Room Canvas als eigenes Fenster; die Leiste zeigt Hand, Stift und Marker, und der Room-Stift kann unabhängig vom Lehrerwerkzeug aktiviert werden. Schließen des Raumfensters brachte die unveränderte Lehrerstunde zurück. In dieser produktiven Stunde wurde bewusst kein Teststrich angelegt.

## Technische Grenze

Der Room-Empfänger rendert nur eine lokale Gestenvorschau. Der Host rekonstruiert aus validierten Punkten ein natives Stift- oder Markerobjekt, ergänzt Materialzuordnung, schreibt über den vorhandenen Autosave und sendet die bereinigte Projektion zurück. Room behält einen noch nicht projizierten Strich bis zur neueren bestätigten Revision. Eine alte Generation oder ein gewechseltes Anzeigeziel wird abgewiesen. Es werden keine öffentlichen Elementmetadaten als Stundendokument zurückgeschrieben.

## Automatische Checks und Paket

Typprüfung für Haupt- und Live-Build, 62 Live-Tests, 254 Projekttests, Haupt- und Live-Build sowie Rust-Tests bestanden. Das finale macOS-Bundle 0.1.23 und die Updater-Signatur wurden geprüft; die installierte App wurde nach dem letzten Build erneut geöffnet. Der Updatekanal wurde nicht veröffentlicht.

Objektwahl, Verschieben, Radierer, Room-Undo, HTML-Feldeingabe, Medienbedienung vorne und Konflikte beim gleichzeitigen Ändern desselben Bestandsobjekts wurden nicht implementiert oder abgenommen. HTML im Room bleibt ohne eigenständige Eingabe und Scrollbewegung, damit Annotationen an der vom Host geführten Materialposition hängen. Reale Stiftlatenz, Touchziele, Touchscreen am erweiterten Display, Vollbild und Fensterneustart in der gebauten nativen App bleiben gesondert zu prüfen.

## Entscheidung

Der Browserflow belegt den gemeinsamen Stundenstand und die getrennte Lehrerbedienung für neue Ink-Objekte. Der native Fenster- und Leistenfluss funktioniert im installierten Build. Die Handhabung am echten erweiterten Display mit Stift/Touch ist noch nicht bestätigt.

## Nachtest 0.1.24: Leiste und HTML-Markierung

**Gerät/Material:** lokaler Test-Mac, lokaler Chromium-Testbrowser mit eingebetteter 400 × 300 Pixel großer Room-Ansicht; kontrolliertes HTML-Paket aus `test-materials/live-canvas-html` in der getrennten Teststunde unter `output/room-ink-fixture-archive/`. Das produktive Unterrichtsarchiv blieb unverändert.

- Die Raumleiste sitzt mittig am unteren Rand. Hand, Stift und Marker verwenden die Fluent-Icons und die Icon-/Label-Anordnung der Lehrerleiste. Das Auge blendet die Leiste aus; das verbleibende Auge öffnet sie wieder mit Hand als aktivem Werkzeug.
- Während einer gezogenen Markierung über dem HTML-Material war der gelbe Strich bereits **vor dem Loslassen** zu sehen. Nach Hostbestätigung blieb er sichtbar; ein Reload stellte die Materialannotation aus dem Stundenstand wieder her.
- Die Sofortvorschau verwendet nur die flüchtige Geometrie des nativen Strichs oberhalb des HTML-Iframes. Der bestätigte Strich stammt weiterhin aus dem Hauptfenster; es entsteht kein zweites gespeichertes Zeichenmodell.
- Typprüfung beider Builds, 62 Live-Tests, 254 Projekttests, Haupt- und Live-Build sowie der signierte macOS-Release-Build 0.1.24 bestanden. Das Bundle wurde am Desktop-Ort installiert und die Codesignatur dort erneut geprüft. In der nativen App öffnete sich das Room-Fenster; die Leiste wurde visuell und per Bedienung des Auges zum Aus- und Wiedereinblenden geprüft. In der produktiven Stunde wurde kein Teststrich angelegt.

**Entscheidung:** Die gemeldete Verzögerung über HTML ist im isolierten Browserflow behoben. Stiftlatenz und Touchbedienung am erweiterten Bildschirm bleiben ein Hardwaretest.

## Nachtest D-210: HTML vorne scrollen

**Gerät/Material:** lokaler Test-Mac, isolierte Chromium-Testseite `synthetic-clips` mit eingebettetem 400 × 300 Pixel großen Room-Fenster und kontrolliertem HTML aus `test-materials/live-canvas-html`. Kein produktives Unterrichtsarchiv wurde bearbeitet.

- Room Canvas zeigte dasselbe HTML in der Canvas- und Materialeinzelansicht. Auf der gelben inneren Scrollfläche bewegten Mausrad und eine gezogene Wischsimulation den Inhalt von `scrollTop=0` auf `71,27` beziehungsweise `16` Pixel. Die Lehrerinstanz blieb bei `scrollTop=0`.
- Eine neue Lehrerbild-Platzierung ließ die bereits gescrollte Room-Instanz bei `71,27` Pixel. Der Wechsel von Canvas zur Materialeinzelansicht setzte den lokalen Scrollstand wie vorgesehen zurück; dort konnte erneut unabhängig gescrollt werden.
- Die gesamte Materialfläche ist das Touchziel, ohne zusätzlichen Griff. Bei Stift/Marker liegt die vorhandene Raum-Zeichenschicht darüber. Root-Scrollanker werden für neue Room-Annotationen an den Host übertragen; verschachtelte Paket-Scroller besitzen weiterhin keinen allgemeingültigen Annotationsanker.
- Haupt- und Live-Typprüfung, Produktionsbuild, 63 Live-Tests und 254 App-Tests bestanden. Das finale Bundle 0.1.28 ist signiert; ZIP-Prüfsummen, gebündelte Scrollbrücke und Updater-Signatur wurden geprüft. Ein erster isolierter Archivtestlauf traf einen schon bestehenden seltenen Gleichzeitigkeitseffekt bei schnellen Klassenwrites (HTTP 500); der unveränderte Test bestand beim getrennten Wiederholungslauf und im vollständigen App-Lauf. Dieser Befund ist nicht als Room-Abnahme zu werten.

**Offen:** Echtes Finger-/Stiftgefühl, Palm Rejection und Lesbarkeit auf dem erweiterten Legamaster/Beamer sind noch nicht auf Zielhardware geprüft. HTML-Felder/Buttons werden vorne weiterhin nicht bedient.

## Nachtest D-211: gemeinsamer Leisten-Schalter

Im lokalen Browser wurden die Hauptleiste und die Room-Leiste jeweils ausgeblendet und wieder geöffnet. Beide Zustände verwendeten exakt dasselbe `Toolbox 24 Regular` aus dem vorhandenen Fluent-Set; die zugänglichen Namen wechselten passend zwischen `Werkzeugleiste ausblenden` und `Werkzeugleiste einblenden`. Die Hauptleiste wurde nach dem Test wiederhergestellt, die Room-Leiste in ihren anfänglich verborgenen Zustand gebracht. Beide Typprüfungen, Produktionsbuild und 14 fokussierte Toolbar-/Room-Tests bestanden. Das Icon wurde im eingebetteten 400 × 300-Pixel-Room visuell geprüft; Touchziel am großen Display bleibt die bestehende Hardwareabnahme.

## Nachtest D-212: Room-Leiste in Hell und Dunkel

**Gerät/Material:** lokaler Test-Mac, lokaler Chromium-Testbrowser mit derselben eingebetteten Room-Testansicht in Hell und Dunkel. Kein produktiver Stundenstand wurde geändert.

- In Hell öffnete sich die Raumleiste mit Hand, Stift und Marker; nach Ausblenden erschien nur der Wiederöffner. In Dunkel folgte das Raumfenster der publizierten Canvasfarbe `#1c222b`, die Leiste und der Wiederöffner verwendeten `#252c36` wie die Lehrerleiste.
- Die ausgeblendete Leiste blieb im DOM, war aber aus Zugänglichkeit und Pointerbedienung entfernt. Der Wechsel hatte `opacity`/`filter` über 240 ms; der Wiederöffner nutzte die kurze verzögerte Einblendung. Die CSS-Regel für reduzierte Bewegung deaktiviert beide Effekte.
- Haupt- und Live-Typprüfung, Produktionsbuild, 63 Live-Tests und 254 App-Tests bestanden. Das lokale macOS-Paket 0.1.28 wurde erneut signiert; Bundle und Updater-Signatur wurden verifiziert. Die laufende Desktop-App wurde nicht ausgetauscht. Die native Touch-/Zweitbildschirmprüfung bleibt offen.

## Nachtest D-214: eigener Verlauf für Raumstriche

**Gerät/Material:** lokaler Test-Mac, lokaler Chromium-Testbrowser mit `synthetic-clips` und eingebettetem 400 × 300 Pixel großen Room-Fenster. Die Teststunde liegt im getrennten Archiv `output/room-ink-fixture-archive/`; das produktive Unterrichtsarchiv wurde nicht bearbeitet.

- Die Room-Leiste zeigte zunächst deaktiviertes `Zurück` und `Vor`. Nach einem Raum-Stiftzug war `Zurück` aktiv. Ein danach am Lehrergerät gezeichneter Stiftzug verschwand durch Lehrer-Rückgängig; der Raumverlauf blieb bedienbar.
- Ein weiterer Raumstrich verschwand durch `Zurück` im Raumfenster und erschien durch `Vor` wieder. Der Lehrerstand wurde dabei nicht zurückgesetzt. Beide Befehle liefen über die bestehende Hostszene und ihre bestätigte Room-Projektion.
- Nach einem erneuten Raum-`Zurück` und Seitenreload blieb der Lehrerstrich vorhanden; der zurückgenommene Raumstrich erschien nicht wieder. Damit wurde auch der vorhandene lokale Speicherpfad für diesen Schritt geprüft.
- Automatische Verlaufstests prüfen Room-Zurück/Wiederholen zwischen Lehrerobjekten, die Ablehnung einer zwischenzeitlich durch die Lehrkraft bearbeiteten Raumfassung und die Befehlsvalidierung. Echtes gleichzeitiges Ziehen auf zwei physischen Displays, Touch/Stift und nativer Fensterneustart bleiben offen.
- Beide Typprüfungen, 66 Live-Tests, 254 App-Tests, Haupt-/Live-Build und nativer Release-Build bestanden. Das lokale Paket 0.1.28 wurde erneut signiert; ZIP und Updater-Signatur wurden verifiziert. Die laufende Desktop-App und der öffentliche Updatekanal wurden nicht verändert.

## Nachtest D-215: interaktives HTML von beiden Fenstern

**Gerät/Material:** lokaler Test-Mac, isolierte Browserstunde `synthetic-clips` mit dem kontrollierten `live-canvas-html`-Paket im eingebetteten Room-Fenster. Das produktive Unterrichtsarchiv blieb unverändert.

- Der erste Durchlauf zeigte die Ursache des gemeldeten Fehlers: Eine transparente Room-Scrollfläche fing Klicks auf das HTML ab, und Room-Zustandsänderungen erreichten die Lehrerinstanz nicht. Nach Entfernung der Überlagerung aktualisierte ein Room-Buttonklick sowohl Room als auch Lehreransicht.
- Ein längerer Text (`Schüler schreibt schnell`) wurde im Room-Eingabefeld per Tastatur vollständig übernommen und zugleich im Lehrerfeld sichtbar. Ein erster Zwischenstand verlor Zeichen, weil bestätigte Zustände während des Tippens den aktiven Wert zurücksetzten; die Eingabebrücke bewahrt nun den fokussierten Wert und den Cursor bei fremden Feldänderungen. Ein Lehrer-Buttonklick änderte anschließend beide Ansichten; das Room-Feld blieb bearbeitbar und sein Text erhalten.
- Reine Zustands-Tests prüfen das Zusammenführen verschiedener Felder, gleichzeitiger Änderungen desselben Feldes nach Annahmereihenfolge sowie Größen- und Befehlsvalidierung. Das echte parallele Tippen an zwei physischen Eingabegeräten, Touchscrollen und die native Zweitdisplayansicht bleiben als Hardwareabnahme offen.
- Die kleine Raumvorschau ließ zuvor HTML-Klicks zu, obwohl sie keine Rückmeldung an den Host sendete. Ihr Bildinhalt ist nun mit `inert` und pointerfreier Materialfläche reine Anzeige; Fensterkopf und Zentrieraktion bleiben getrennt bedienbar.
- Im erneuten Browsertest blieb auch `1234567890 ABCDEFGHIJ` bei schneller Eingabe vollständig in beiden Fenstern erhalten. Nach einem Lehrer-Buttonklick konnte vorne `WEITER` angefügt werden. Die innere Scrollfläche bewegte sich trotz direkter Feldbedienung um rund 53 Pixel. Die Raumvorschau bot im Zugänglichkeitsbaum nur noch die Fensteraktionen, keine editierbaren Inhalte.
- Beide Typprüfungen, 69 Live-Tests, 254 App-Tests, Haupt- und Live-Build sowie der native Release-Build bestanden. Das lokale Paket 0.1.28 und seine Updater-Signatur wurden erneut geprüft. Die laufende Desktop-App wurde nicht ersetzt und der öffentliche Updatekanal blieb unverändert.

## Rollout und nativer Startcheck 0.1.28

**Gerät:** lokaler Apple-Silicon-Test-Mac mit der bestehenden produktiven Desktop-App und ihrer bisherigen Stunde. Keine Unterrichtsinhalte wurden für diesen Check bearbeitet.

- Das veröffentlichte Updaterarchiv entsprach dem lokalen Release bytegenau; die heruntergeladene Signatur wurde mit dem in der App hinterlegten öffentlichen Schlüssel geprüft.
- Die laufende App 0.1.26 bot 0.1.28 im Versionsfenster an. Die Installation über den normalen Updater startete die App neu; das Versionsfenster zeigte anschließend 0.1.28. Das Bundle bestand die macOS-Signaturprüfung.
- Die vorhandene Stunde wurde wieder geöffnet. `Präsentieren → Room Canvas → Starten` öffnete ein eigenes natives Fenster; die Raumseite war lokal erreichbar. Nach dem Laden der HTML-Materialien waren Hand, Stift und Marker in der Raumleiste verfügbar. `Zurück`/`Vor` blieben ohne eigene Raumaktion erwartungsgemäß deaktiviert.
- Es wurde weder ein produktiver Teststrich noch ein Testeintrag in einem Arbeitsblatt angelegt. Die Synchronisierung auf zwei physischen Displays, Touch-/Stiftgefühl und gleichzeitiges Tippen in beiden Fenstern bleiben für die Hardwareabnahme offen.

## Folgeprüfung D-218 am 27. September 2026

**Gerät/Aufgabe:** Mac-Browser, lokale Entwicklungsansicht. Offene Lehrerwerkzeugleiste schließen und mit dem einzelnen Wiederöffner wieder öffnen; denselben Iconzustand in Room prüfen.

**Beobachtung:** Die offene Lehrerleiste zeigte das rote Fluent-X. Nach Klick erschien der einzelne Werkzeugkoffer; er öffnete die Leiste wieder. Zugängliche Namen und vorhandener Tastenschalter blieben gleich. Das Room-Fenster ließ sich in dieser eingebetteten Browserumgebung wegen des Popup-Lebenszyklus nicht stabil visuell abnehmen; seine beiden Zustände verwenden dieselbe neue Iconzuordnung im Quellstand. Beide Typprüfungen, 70 Live-Tests und Produktionsbuild bestanden.

**Entscheidung/Grenze:** Visuelle Trennung für Lehrer und Room beibehalten. Room-Sichtprüfung und Touchziel am echten erweiterten Bildschirm bleiben offen. Es wurde kein natives Update installiert.

## Folgeprüfung D-219 am 27. September 2026

**Gerät/Aufgabe:** Mac-Browser, isolierte Live-Canvas-Teststunde mit Room-Empfänger. Room-Stiftfarbe und -größe wählen, Strich ziehen und im Lehrerfenster vergleichen; Markeroptionen und getrennte Werkzeugwahl prüfen.

**Beobachtung:** Lehrer- und Room-Stift zeigten dieselben fünf Farbfelder und vier Größen. In Room wurde `Tafelblau` und `Breit` gewählt; der sichtbare blaue Strich erschien vorne und auf der Lehrerfläche, und Room-Zurück wurde verfügbar. Der Marker zeigte dieselben vier Größen und seine vier Farben. `Salbei` und `Sehr breit` blieben nach Wechsel zum Stift und zurück am Marker ausgewählt; der Stift behielt `Tafelblau` und `Breit`. Das Auswahlmenü lag im Browser oberhalb der Room-Leiste. Beide Typprüfungen, 70 Live-Tests, 254 App-Tests und Produktionsbuild bestanden.

**Entscheidung/Grenze:** Eine gemeinsame Palette und Größenabbildung verwenden, Raumwahl nur flüchtig im Raumfenster halten. Echtes Stift-/Touchgefühl, Popover-Erreichbarkeit und Strichwirkung am erweiterten Display bleiben Hardwareabnahme.

## Folgeprüfung D-220 am 27. September 2026

**Gerät/Aufgabe:** lokaler Test-Mac, lokaler Chromium-Testbrowser mit isolierter `synthetic-clips`-Stunde und eingebetteter 400 × 300 Pixel großer Room-Ansicht. Die Leiste über den Griff von einem HTML-Embed wegziehen, schließen, wieder öffnen und die Stiftpalette nahe dem oberen Fensterrand prüfen. Das produktive Unterrichtsarchiv blieb unverändert.

**Beobachtung:** Die Leiste folgte dem Griff und blieb nach X und Werkzeugkoffer an der neuen Position. Oben öffnete die Farb- und Größenpalette unter der Leiste. Ziehen bei aktivem Stift bewegte nur die Leiste; `Zurück` blieb deaktiviert, es entstand kein Raumstrich. Der Positionstest deckt Fenstergrenzen und Größenänderung ab. Beide Typprüfungen, 71 Live-Tests, 254 App-Tests und der Produktionsbuild bestanden.

**Entscheidung/Grenze:** Griffposition nur im laufenden Raumfenster halten. Echtes Ziehen per Touch/Stift und die Sichtbarkeit auf dem erweiterten Display bleiben Hardwareabnahme. Es wurde kein natives Update installiert.

## Release-Nachtest 0.1.29 am 27. September 2026

Das gebaute ARM64-Paket startete seinen gebündelten lokalen Dienst mit einem isolierten neutralen Testarchiv. Haupt- und Room-Seite antworteten mit HTTP 200; die gebaute Oberfläche zeigte 0.1.29. Signatur und Updaterarchiv wurden geprüft. Das öffentliche Archiv entsprach bytegenau dem lokalen Build und bestand nach dem Download erneut die Updater-Signaturprüfung. Die bestehende Desktop-App installierte 0.1.29 über ihren eingebauten Updater, startete neu und öffnete den vorhandenen Unterricht. Das native Room-Fenster ließ sich wieder starten und zeigte den neuen Griff. Ein produktiver Teststrich oder Materialeintrag wurde nicht angelegt. Verschieben am echten Touchdisplay und Prüfung auf dem erweiterten Bildschirm bleiben offen.

## Folgeprüfung D-221 am 27. September 2026

**Gerät/Aufgabe:** Mac-Browser, isolierte `synthetic-clips`-Stunde mit eingebetteter 400 × 300 Pixel großer Room-Ansicht. In freier Canvasansicht die Room-Leiste öffnen, mit Hand über freie Fläche ziehen, die Lehrerkamera bewegen, vorne zeichnen und das kontrollierte HTML-Arbeitsblatt anklicken. Danach Clip 1 aufrufen.

**Beobachtung:** Die Handgeste im Room-Fenster verschob die freie Canvasansicht nicht. Nach einer Bewegung der Lehrerkamera änderten sich bei weiterhin offener Room-Leiste die Positionen derselben Arbeitsblätter vorne. Ein Room-Stiftzug machte `Zurück` verfügbar; der Zeichenpfad blieb bedienbar. Ein Buttonklick im Room-HTML aktualisierte den fachlichen Zustand sowohl im Room- als auch im Lehrerfenster. Clip 1 ließ sich anschließend anzeigen. Beide Typprüfungen und 71 Live-Tests bestanden. Das produktive Unterrichtsarchiv wurde für diese Probe nicht bearbeitet.

**Entscheidung/Grenze:** Die freie Room-Kamera bleibt dauerhaft an die Lehrerkamera gekoppelt; die Hand bleibt für HTML-Bedienung vorhanden. Eigenständige Navigation in Clip/Material bleibt unverändert. Gleichzeitige Lehrerkamerabewegung während eines laufenden Raumstrichs und Touch-/Stiftgefühl am echten Zweitdisplay bleiben praktisch zu prüfen.

## Folgeprüfung D-226 am 27. September 2026

**Gerät/Aufgabe:** Mac-Browser, isolierte `synthetic-clips`-Stunde im eingebetteten Room-Fenster. Ein HTML-Material vorne auswählen, verschieben, skalieren und drehen; einen Raumstrich auf einem Arbeitsblatt radieren und zurückholen; Radierer über ein Bild ziehen. Das produktive Unterrichtsarchiv blieb unberührt.

**Beobachtung:** `Radierer` und `Auswahl` erschienen mit den vorhandenen Fluent-Icons in der verschiebbaren Room-Leiste. Die Auswahl zeigte einen Rahmen und zwei Griffe; drei Gesten änderten Position, Größe und Drehung des HTML-Materials sowohl vorne als auch auf der Lehrerfläche. Ein Room-Stiftzug erschien in beiden Fenstern; Wischen mit dem Radierer entfernte ihn und ließ das Arbeitsblatt stehen. `Zurück` stellte den Strich wieder her und nahm anschließend dessen ursprüngliche Anlage zurück. Ein Wisch über Bildmaterial entfernte das Bild nicht. Im ersten Durchlauf wurde nach mehreren Änderungen desselben Objekts nur der letzte Schritt rückgängig; die Versionen benachbarter Raumaktionen werden nun beim Room-Undo/Redo fortgeführt. Der anschließende Verlaufstest prüft mehrere Transformationen desselben Objekts in beiden Richtungen.

**Technischer Prüfstand:** Haupt- und Live-Typprüfung, Live-Tests einschließlich Befehlsgrenzen, Materialverbund und Objektverlauf sowie Live-Produktionsbuild bestanden. Der Room-Empfänger sendet nur opake ID, bestätigte Revision und begrenzte Aktion; der Host prüft die aktuelle native Version und schreibt allein in die gemeinsame Szene. Echte Touchziele, Stift-/Fingergefühl, gleichzeitige Lehrergesten und nativer Zweitbildschirm bleiben Hardwareabnahme.

**Release-Nachtest 0.1.33:** 254 App-Tests, 78 Live-Tests, Rust-Test, beide Typprüfungen und Haupt-/Live-Build bestanden. Das signierte ARM64-Bundle meldete 0.1.33; sein gebündelter Dienst lieferte Lehrer- und Room-Seite mit HTTP 200. Der Updatekanal lieferte das bytegleiche Archiv (SHA-256 `7abb04ebb73eef972657c233dc3c17b090b09917bc95387d79794c62e6bd61a9`) mit gültiger Updater-Signatur. Die laufende App blieb offen; der reale Touchtest ist weiterhin ausstehend.

## Folgeprüfung D-227: HTML-Quizzustand in beiden lokalen Fenstern

**Gerät/Material:** Mac, lokaler Chrome-Testbrowser mit isolierter `synthetic-clips`-Stunde und eingebettetem Room-Fenster. Das installierte Englisch-Paket „Find the Problem – Transport Writing“ wurde als Kopie in der Teststunde geladen; produktive Stundenstände wurden im Browser nicht verändert.

**Ursache:** Das Paket hatte eigene Variablen für Satznummer und Aufdeckstufe, aber keine `tafelraumLive`-API und keine Formfelder. Deshalb sah die vorhandene Tafelraum-Brücke nach `Next sentence` keine Zustandsänderung.

**Beobachtung:** Nach Ergänzung des semantischen Paketstatus zeigten Lehrer- und Room-Instanz nach Lehrerklick gemeinsam die Problemstelle und die verbesserte Fassung. Ein Klick auf `Next sentence` im Room-Fenster stellte beide auf `2 / 7`; derselbe Klick später auf der Lehrerfläche stellte beide auf `3 / 7`. Die Paketprüfung und JavaScript-Syntaxprüfung bestanden. Das zweite bei der Bestandsprüfung gefundene Paket `ottomotor-fachsprache` teilt nach derselben API Auswahlwerte und das Ergebnis von `Auswahl prüfen`; der Browser zeigte die Rückmeldung `0 von 16 passen. 16 Felder sind noch offen.` in beiden Fenstern. Beide produktiven Paketkopien wurden nach dem verifizierten Vollbackup `unterrichtsarchiv-2026-09-27T17-50-43-965Z-room-html-zustand.tar.gz` aktualisiert und erneut validiert. Die laufende native App wurde für den Test nicht neu geladen; die beiden Iframes übernehmen die geänderten Paketdateien erst beim nächsten Öffnen.

**Release-Nachtest 0.1.30:** Das signierte ARM64-Paket bestand 254 App-Tests, 71 Live-Tests, Rust-Test, beide Typprüfungen sowie Haupt- und Live-Build. Der gebündelte lokale Dienst antwortete mit isoliertem Testarchiv auf Haupt- und Room-Route mit HTTP 200. Die öffentliche Update-Datei entsprach bytegenau dem lokalen Paket (SHA-256 `d9654edfc1303648a156f45534f54fe7b0518d6e0b704ca6fff6945e0a52a586`) und bestand die Updater-Signaturprüfung. Die native Installation wurde wegen der geöffneten Unterrichtssitzung verschoben; sie ist noch nicht praktisch abgenommen.

## Folgeprüfung D-230: Lehrerfokus auf HTML-Feldern

**Gerät/Aufgabe:** Mac-Browser, isolierte `synthetic-clips`-Stunde mit eingebetteter 400 × 300 Pixel großer Room-Ansicht und kontrolliertem HTML-Paket. Lehrerfeld fokussieren, dasselbe Feld vorne anklicken und beschreiben, anschließend außerhalb des Lehrer-HTML klicken und einen Clip aufrufen. Für den Feldwechsel wurde dem isolierten Testpaket vorübergehend ein zweites Eingabefeld im inneren Scrollbereich ergänzt und danach die ursprüngliche Datei wiederhergestellt. Das produktive Unterrichtsarchiv blieb unberührt.

**Beobachtung:** Nach dem Lehrerklick erschien am entsprechenden Room-Feld eine warme Kontur mit `Lehrkraft`-Label. Ein Klick und die Eingabe `X` vorne ließen das Label stehen; der Wert `AnfangX` erschien gleichzeitig in beiden Fenstern. Ein Lehrer-Klick auf das Handwerkzeug entfernte das Label. Ein erneuter Fokus und Wechsel zu Clip 1 hinterließ dort keine alte Markierung. In der zweiten Probe wechselte die Kontur vom ersten zum zweiten Feld im inneren Scrollbereich; am ersten Feld blieb kein Label zurück. Beide Typprüfungen, 78 Live-Tests, 257 App-Tests und der Produktionsbuild bestanden.

**Entscheidung/Grenze:** Nur der flüchtige lokale Fokus des Lehrer-HTML wird gespiegelt; Room behält eigenen Cursor und Scrollstand. Der 400-Pixel-Browserempfänger bestätigt Funktion und relative Platzierung, nicht Lesbarkeit und Touchgefühl am echten Raumdisplay. Ein eigenständiger Room-Scrollwechsel bei gehaltenem Lehrerfokus bleibt als praktische Materialprobe offen; die technische Zuordnung verwendet denselben stabilen Feldschlüssel wie der vorhandene Formularzustand. Die Funktion ist im signierten und veröffentlichten Paket 0.1.34 enthalten; die laufende Desktop-App wurde dafür noch nicht ersetzt.

## Folgeprüfung HTML-Abdeckung am 27. September 2026

**Gerät/Aufgabe:** Mac-Browser mit isolierter synthetischer Stunde und eingebettetem Room-Fenster. Ein HTML-Arbeitsblatt zuerst vollständig, dann zur Hälfte mit dem bestehenden Canvas-Cover abdecken.

**Befund/Ursache:** Bei voller Abdeckung blendete die Projektion bisher nur das Iframe aus; der weiße Hintergrund seiner umgebenden Sichtbarkeitsebene blieb über dem grauen Cover stehen. Teilabdeckung schnitt diese Ebene bereits korrekt aus.

**Änderung/Beobachtung:** Die gesamte Sichtbarkeitsebene wird nur bei vollständiger Abdeckung verborgen. Im Room-Screenshot war die volle Fläche grau; nach Wechsel auf halbe Abdeckung erschien die freie Hälfte wieder als HTML-Arbeitsblatt. Die bestehende Abdeckungsgeometrie, Archivdaten und Teilabdeckung wurden nicht verändert. Beide Typprüfungen, 254 App-Tests, 71 Live-Tests, Rust-Test sowie Haupt- und Live-Build bestanden. Das gebaute 0.1.31-Bundle startete mit isoliertem Archiv; Haupt- und Room-Seite antworteten mit HTTP 200. Der öffentliche Updaterstand 0.1.31 entsprach bytegenau dem lokalen Paket (SHA-256 `e84d7797e114a43a80dc9c81890884a59437859e4e66c2594b30385cdfba7a16`) und bestand die Signaturprüfung. Echte Touch- und Zweitdisplayprüfung sowie die Installation in der laufenden Desktop-App bleiben offen.


## 30. September 2026 — D-231: direkte Radier-Rückmeldung

- Beobachtung vom Nutzer: vorne mit Touch großer wahrgenommener Delay, kein sichtbarer Radierer. Ursache im Room-Eingabepfad: Treffer wurden ausschließlich gesammelt und erst auf Pointer-up an den Host gesendet; lokale Rückmeldung und Radierkreis fehlten.
- Room zeigt nun einen 48-CSS-Pixel-Kreis und blendet Treffer während der Geste lokal aus. Der Host übernimmt weiterhin eine einzige validierte Objektänderung auf Pointer-up. Schnelle Wischbewegungen prüfen Zwischenstrecken und überlappende Objekte; Materialschutz bleibt erhalten. Abbruch/Wechsel/Ablehnung/Bestätigungs-Timeout verwerfen die flüchtige Vorschau.
- Automatisch: beide Typprüfungen, 79 Live-/Room-Tests und App-Produktionsbuild bestanden. Neuer Regressionstest: schnelle Bewegung über dazwischenliegende und überlappende Striche, geschütztes Material und leere Strecke.
- Manuell: isolierte synthetische Szene im In-App-Browser, Room als lokales Testiframe; Radiergeste mit Maus, sichtbarer Kreis, Übernahme in die Lehreransicht und gemeinsames Rückgängig bestanden. Kein produktives Archiv verändert. Screenshot: `output/room-eraser-feedback/eraser-circle.png`.
- Noch offen: tatsächlicher Finger-/Stifttest am Board, insbesondere gefühlte Latenz und Sichtbarkeit um den Finger. Browserprüfung ist keine Touch-Hardwareabnahme. Die Änderung ist im signierten App-Paket 0.1.35 enthalten und am 30. September 2026 als Update veröffentlicht. Die laufende Desktop-App wurde dabei nicht ersetzt.


**Release-Nachtest 0.1.35:** 257 App-Tests, 79 Live-/Room-Tests, ein Rust-Test, Haupt-/Live-Typprüfung und Haupt-/Live-Build bestanden. Bundle-Version 0.1.35, gebündelter Dienst mit neutralem Testprofil sowie Haupt-/Room-Route geprüft; der veröffentlichte ARM64-Updaterstand wurde atomar aktiviert. Öffentliches Archiv bytegleich zum lokalen Paket, Updater-Signatur nach dem HTTPS-Download erneut gültig (SHA-256 `6139f6b512f0fa26c846e5d6ec7d407a357980aea807c70470d41fc0886c4bbf`). Keine Unterrichtsdaten oder Browserprofile verändert.


## 30. September 2026 — D-234: Radierer nur für Stift und Marker

- Isolierte synthetische Stunde im Mac-Browser: Stiftstrich über einer Rechteckform und Marker über Text gezeichnet. Radieren in der Lehreransicht entfernte beide Striche, ließ Text und Form einschließlich eines Wischs über deren Rand stehen.
- Dieselbe Szene im lokalen Room-Testiframe: beide Striche verschwanden vorne und auf der Lehrerfläche; Text und Form blieben erhalten. Room-Rückgängig stellte den Marker in beiden Ansichten wieder her.
- Gemeinsame Regel zusätzlich gegen Text, Formen, gewöhnliche Linien, Material, gesperrte und gelöschte Striche geprüft. Beide Typprüfungen, 259 App-Tests und 82 Live-/Room-Tests bestanden. Screenshot: `output/ink-only-eraser/protected-text-and-shape.png`.
- Produktives Archiv unverändert. Reales Touchgefühl und native WebView bleiben Hardwareprüfung; die Änderung ist noch nicht veröffentlicht.


## 30. September 2026 — D-235: Marker-Trefferfläche

- Isolierte synthetische Stunde im Mac-Browser: schrägen Marker zeichnen, im leeren unteren Bereich seines Rahmens wischen und tippen. In Lehreransicht und Room blieb die Markierung bestehen; direkter Kontakt entfernte sie in beiden Ansichten. Lehrer-Undo stellte sie wieder her. Die Lehreransicht blieb während der Room-Probe im Radierwerkzeug; dessen temporäre Markersperre verhinderte die berechtigte Room-Löschung nicht.
- Geometrietests prüfen leere Rahmenbereiche, sichtbare Füllfläche, Randkontakt, echte Innenlöcher, retracierte unsichtbare Brücken und Rotation im Room. Bestehende Stift- und Sweep-Tests bleiben grün. Beide Typprüfungen, 260 App- und 83 Live-/Room-Tests bestanden. Screenshot: `output/marker-eraser-hit/empty-area-preserves-marker.png`.
- Produktives Archiv unverändert. Touch-/Stiftgefühl im nativen Boardbetrieb bleibt Hardwareprüfung; noch nicht veröffentlicht.


## Veröffentlichung 0.1.36

D-234 und D-235 sind im signierten und veröffentlichten App-Paket 0.1.36 enthalten. Releaseprüfungen, Paket-Smoke-Test und öffentliche Hash-/Signaturprüfung stehen in [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md).


## Audio ohne Anzeigewechsel – 1. Oktober 2026 (D-240)

Isolierter Vite-Test auf Port 49329 mit eigenem Archiv unter `/tmp/tafelraum-audio-clip-qa/`; synthetische 30-Sekunden-Audiodatei, kein produktives Unterrichtsmaterial. Echte CanvasSurface, Lehrerplayer, Room-Host und BroadcastChannel; Room als Iframe der vorhandenen `clip.browser.html?inlineRoom`-Fixture.

- Ausschnittclip 1 oberhalb des Audioplayers erstellt und gezeigt. `Abspielen` wechselt auf `Pausieren`, der Zeitstand läuft bis 0:27 und die Room-Regie bleibt auf Clip 1.
- Bild durch Materialtipp als Clip 2 aufgenommen und gezeigt. Audio um zehn Sekunden zurückgesetzt und erneut gestartet: Room bleibt auf `Clip 2 · Material`, der Bildclip bleibt aktiv.
- Screenshot: `output/audio-clip/room-material-with-audio.png`.
- Regression prüft Audioausschluss von Materialclip-Eignung und Room-Medienprojektion, lesbare alte Referenzen sowie weiterhin gültige Video-/YouTube-Clips.

266 App-Tests, 83 Live-/Room-Tests und beide Typprüfungen bestanden. Hauptbuild bestand ebenfalls. Native Bluetooth-Ausgabe und Touch nicht neu geprüft; Audioplayer und Tonausgabepfad sind unverändert. Noch kein veröffentlichtes Folgeupdate.

**Release D-240:** Audio ohne Room-Zielwechsel ist in Update 0.1.40 am 2. Oktober 2026 veröffentlicht. Video und YouTube behalten ihre Materialansicht.

## Folgeprüfung D-247: Lehrer-Schreibstrich und Textmarkierung in Room

**Datum/Gerät:** 7. Oktober 2026, Mac/Chrome und gebautes ARM64-Tauri/WKWebView-Testpaket. Browser: echte `CanvasSurface`-/Room-Kette über `clip.browser.html?inlineRoom`, eigener Loopback-Server und temporäres synthetisches Archiv. Native: separate Bundle-ID `app.jujies.tafelraum.writingqa`, eigener Port 49332 und ausschließlich kontrollierte Testfelder. Das produktive Unterrichtsarchiv und die installierte App blieben unverändert.

**Aufgabe/Beobachtung:**

- Lehrerklick und Eingabe mitten im Wort: beide Fenster zeigen denselben Text. Room erhält einen blinkenden warmen Schreibstrich an der Lehrereingabeposition; sein eigenes Feld ist dabei nicht fokussiert und seine DOM-Auswahl wird nicht gesetzt.
- Pfeiltasten und Shift-Auswahl im Browser: der Schreibstrich wird durch die passende Textmarkierung ersetzt. Textarea-Auswahl über mehrere Zeilen erzeugt mehrere begrenzte Rechtecke; beim Feldwechsel bleibt am alten Feld keine Markierung zurück.
- `contenteditable`, einschließlich eines leeren Felds, zeigt ebenfalls eine Schreibposition. Bei vorne noch außerhalb der inneren Scrollfläche liegendem Feld erscheint kein Strich; nach eigenständigem Room-Scrollen erscheint er am sichtbaren Feld. Die Lehrerfläche behält ihren eigenen Dokument-Scrollstand.
- Eigene Room-Eingabe: der native Cursor übernimmt, der projizierte Strich ist ausgeblendet, das `Lehrkraft`-Label bleibt erhalten und der Text erscheint am Host. Ein zunächst verlorener Hinweis bei `contenteditable`-Fensterwechsel wurde korrigiert: die Brücke bewahrt den gewählten Feldschlüssel bei Fokusverlust, ohne einen explizit entfernten Hinweis wiederherzustellen. Zurück im Lehrerfeld erscheint dessen Projektion wieder.
- Native Eingabe im Lehrerfeld (`GemeinsamY schreibenX`) und anschließend vorne (`GemeinsamY schreibenXZ`) wurde in beiden Fenstern übernommen und nach App-Neustart wiederhergestellt.
- Eine ausschließlich im synthetischen nativen Testpaket ergänzte passive Diagnose hielt die tatsächlich erzeugte letzte aktive Room-Projektion fest. Schreibstrich: ein Rechteck, `tafelraum-teacher-blink`, Room-Feldfokus `false`, circa 1,98 × 23 CSS-Pixel. Tastaturmarkierung: ein Auswahlrechteck, kein Schreibstrich und weiterhin Feldfokus `false`. Damit ist auch der native Empfang bei unfokussiertem Raumfenster bestätigt; die Diagnose ist kein Produktbestandteil oder zusätzlicher Zustandspfad.

**Checks:** 273 App-/Archivtests und 85 Live-/Room-Tests, beide Typprüfungen, JavaScript-Syntax, Frontend-/Desktop-Ressourcenbuild, nativer ARM64-Build und strikte Codesign-Prüfung bestanden. Neue Regressionstests sichern begrenzte Feldgeometrie und den gewählten Feldhinweis über Fensterfokuswechsel. Die vorhandene Warnung zu großen Frontend-Chunks bleibt.

**Grenze:** Der erweiterte Legamaster-/Beamerbildschirm mit tatsächlich weitergereichter Mac-Tastatur ist noch praktisch zu prüfen, einschließlich Lesbarkeit des Strichs, reduzierter Bewegung, langem horizontalem Feldinhalt und schnellen Clipwechseln. Browser- und native Testfelder ersetzen diese Hardwareabnahme nicht. Keine neue Remote-Funktion, Archivmutation oder Veröffentlichung; der öffentliche Appstand bleibt 0.1.42.

**Veröffentlichung D-247:** Seit 8. Oktober 2026 im signierten App-Update 0.1.43 enthalten. Paketprüfung, Datenerhalt beim Dienstwechsel 0.1.42 → 0.1.43 und öffentliche Hash-/Signaturprüfung sind in [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md#update-0143-room-schreibposition-und-video-regie) festgehalten. Die native Funktionsprüfung oben bleibt maßgeblich; der reale Zweitbildschirm-/Tastaturtest steht weiter aus.

## Cursorgeometrie bei responsiven Lückenfeldern (D-255, 14. Oktober 2026)

- **Reproduktion:** Zwei isolierte iframe-Instanzen desselben synthetischen Pakets mit der tatsächlich ausgelieferten HTML-Zustandsbridge. Lehrerlayout 900 px / Feld 88 px, Roomlayout 600 px / Feld 75 px; Schrift in beiden Arial 18 px. `users` endet bei rund 48,0 px, die alte proportionale Projektion stand bei 40,7 px innerhalb des letzten Zeichens.
- **Korrektur:** Auswahloffsets kommen über den bestehenden flüchtigen Präsenzvertrag. Die Room-Instanz misst sie lokal. Endposition 47,8 px; mittlere Position nach `us` 22,8 px gegenüber 23,0 px Vergleichsbreite. Bei der mittleren Projektion und einer Zeichenmarkierung bleibt die eigene Room-DOM-Auswahl unverändert bei `[5,5]`, das Feld erhält keinen Fokus.
- **Weitere Browserfälle:** Rechts/zentriert unter 0,3 px Abweichung; langer Inhalt scrollt nur innerhalb des Room-Felds und hält den Strich sichtbar. Textarea am letzten Wort innerhalb des vertikal gescrollten Viewports; editierbarer Fließtext wird ebenso lokal vermessen. Refreshs aus dem eigenen Messspiegel sind ausgeschlossen.
- **Grenze:** Die isolierte Geometrieprobe setzt die weitergereichte Präsenz ausdrücklich aktiv, weil der Hintergrundbrowser den echten Fensterfokus nicht erhält. Native Fensterfokus-/Room-Eingabeprobe und tatsächlicher Unterrichtsbildschirm bleiben offen: Der Mac war beim Start der nativen Prüfung gesperrt. Das produktive Archiv wurde ausschließlich zur Einsicht in die Feld-CSS gelesen und nicht geändert. Noch kein Release.

- **Beleg/Fixture:** `output/room-caret/room-cursor-korrigiert.png`, `caret-qa.browser.html` und das synthetische Paket `caret-test/`. Für den Positionsscreenshot steht der blinkende Strich ausschließlich im Prüfpaket statisch; das Produkt-Blinken bleibt unverändert.

- **Checks:** 296 App-/Archivtests und 90 Live-/Room-Tests, beide Typprüfungen, Haupt-/Desktop-Ressourcenbuild sowie separates ARM64-QA-Bundle erfolgreich. Kein nativer Sichttest wegen Macsperre.

## Native Endposition des Lehrer-Schreibstrichs (D-255/D-247, 14. Oktober 2026)

- **Nutzerbefund:** Nur am Textende steht die Room-Projektion im letzten Buchstaben; Zurücksetzen zwischen Zeichen ist korrekt, der echte Room-Cursor ebenso.
- **Ursache und Reproduktion:** Die frühere D-255-Probe hatte keine native Sichtabnahme. Im getrennten Mac-QA-Bundle reproduziert dieselbe Bridge bei `sdsdsd` eine Endposition von 56 px statt rund 61,03 px. WKWebView formt das angehängte Zero-Width-Space mit dem letzten Glyphencluster; die Range-Grenze liegt dadurch innerhalb des letzten Zeichens. Im Chromium-Prüffeld trat diese Abweichung nicht auf.
- **Korrektur:** Das vorhandene Messdiv enthält den unveränderten Textknoten und einen getrennten, nullbreiten Inline-Block als Endmarker. Nur die kollabierte Auswahl am Textende misst diesen Marker. Zwischenpositionen und Zeichenmarkierung bleiben DOM-Ranges im Textknoten; Lehrer-/Room-Fokus, Offsetvertrag, Datenzustand und Persistenz bleiben unverändert. Kein Pixelkorrekturwert und kein Browser-Sonderzweig.
- **Native Sichtabnahme:** Separate lokale QA-App (`app.jujies.tafelraum.qa0151`, Port 49521), ausschließlich synthetische HTML-Prüffelder. Zwei isolierte Instanzen mit 900/600 px Layout und unterschiedlichen Feldbreiten. Endposition hinter dem letzten `d`, Position vor dem letzten Zeichen, Textmarkierung, langes horizontal gescrolltes Feld, zentrierte/rechtsbündige Eingabe und Textarea mit abschließendem Zeilenumbruch geprüft. Der projizierte Strich steht auf der leeren Folgezeile; direkte Room-Eingabe erhält weiterhin den nativen Cursor. Das Fixture setzt die weitergereichte Präsenz absichtlich aktiv; echter Mehrfenster-/Touchbetrieb am Board bleibt separat offen.
- **Checks:** 310 App-/Archivtests, 91 Live-/Room-Tests, beide Typprüfungen und Hauptbuild erfolgreich. Zwei neue Bridge-Regressionstests schützen isolierten Endmarker für Input/Textarea einschließlich leerem Text und abschließendem Zeilenumbruch sowie unveränderte Zwischenpositionen/Markierung. Ein parallel neu hinzugekommener extensionloser Import von `cover-sweep-geometry` in `public-projection-plan.ts` verhinderte den Node-Live-Teststart; auf die vorhandene `.ts`-Importkonvention korrigiert, ohne Geometrieänderung. Anschließend alle Live-Tests erfolgreich.
- **Belege:** `output/caret-end/native-before.png`, `native-fixed-end.png`, `native-fixed-newline.png`, Prüfskripte und Testlogs im selben Ordner. Produktives Archiv und produktive App unverändert. Diese Korrektur ist noch nicht als Appupdate veröffentlicht.

## Gegenseitiger HTML-Feldfokus (D-261, 14. Oktober 2026)

**Aufgabe:** Room-Feldwahl muss schon vor dem ersten Zeichen auf der Lehrerfläche sichtbar werden. Die bestehende Lehrer-Markierung vorne und beide echten Eingabefokusse bleiben erhalten.

**Browser, reales Host-/Room-Paar mit synthetischem Archiv:**

- Klick in leeres Room-Input: Lehrerfeld bleibt leer und unfokussiert, erhält sofort `student`-Kontur und Badge `Schüler`. Wechsel ins leere Notizfeld entfernt die vorige Kontur und markiert nur das neue Feld. Klick auf die HTML-Überschrift entfernt sie.
- Room-Eingabe `sdsdsd` erscheint im vorhandenen Lehrerfeld; blauer projizierter Schreibstrich am Textende. Der Lehrer-Iframe erhält keinen echten Fokus. Lokale Lehrerwahl im Notizfeld zeigt vorne weiterhin `Lehrkraft`; die nächste Room-Wahl im Antwortfeld zeigt beim Lehrer `Schüler`, während dessen lokale Notizfeld-Auswahl erhalten bleibt. Beide Feldmarkierungen sind unabhängig.
- Room-Ende räumt die Schüler-Markierung vollständig auf. Keine zusätzliche Archivänderung allein für die Feldwahl.

**Native Mac-App:** eigener ARM64-QA-Wrapper `app.jujies.tafelraum.qa-peer-focus`, Port 49523, eigene neutrale Archivbasis und aktuelle gebaute Web-/Serverressourcen. Native Room-Feldwahl im leeren Antwortfeld zeigt den eigenen blauen Room-Fokus. Nach Minimieren des Raumfensters ist am Lehrerbildschirm sofort die blaue Kontur mit `Schüler` sichtbar, Feld weiter leer. Wiederöffnen vorne, echte Eingabe `Schülereingabe`, Wechsel ins weiterhin leere Notizfeld: Lehrerfeldwert synchronisiert, Markierung folgt ausschließlich dem Notizfeld. `Material zeigen` wechselt das Ausgabeziel und entfernt den alten Schülerhinweis sofort. Room wurde normal beendet; kein Profil-/Outbox-Reset und keine produktiven Unterrichtsdaten berührt.

**Checks:** 313 App-/Archivtests, 95 Live-/Room-Tests, beide Typprüfungen, Hauptbuild, Desktop-Ressourcenbuild und nativer QA-Build erfolgreich. Bridge-Test sichert Rollenlabel und unveränderten lokalen Fokus/Wert. Host-Integration schützt bestätigte Revision/Generation, unbekannte Instanzen, verspätetes Blur, Entfernen, volle Abdeckung und Stop. Das Testmodell erhöht bei Sichtbarkeitsänderungen die native Elementversion entsprechend dem echten Canvas-Änderungsfluss; eine unveränderte Szene löst richtigerweise keine neue Projektion aus.

**Belege:** `output/room-peer-focus/teacher-sees-student.png`, `native-room-local-focus.png`, `native-teacher-empty-field.png`, `native-teacher-field-switch.png`, Build-/Testlogs und synthetische Fixture im selben Ordner. Touch/Stift am Board, echter Zweitdisplaybetrieb und größere Unterrichtssequenzen bleiben Hardware-/Praxisprüfung. Noch kein Apprelease für D-261.


### Auslieferung D-261 – 0.1.53

Am 14. Oktober 2026 mit 0.1.53 veröffentlicht. Finale native QA verwendet alle 207 Ressourcen bytegleich zum portablen Release und bestätigt nach erhaltenem Archivstart die Room-Auswahl als blaue Schüler-Markierung auf der Lehrerfläche. Versionsnachweis und Screenshot unter `output/release-0.1.53/`. Datenerhalt 0.1.52 → 0.1.53 und öffentliche Hash-/Signaturprüfung erfolgreich. Geräteprüfgrenzen bleiben bestehen.


**Veröffentlicht mit 0.1.56, 15. Oktober 2026:** Die gemeinsame kanonische Radierersicht und D-264s einheitliche bewusste Einzelbewegung für Text/Stift/Marker in Lehrer und Room sind signiert veröffentlicht. 336 App-/106 Live-Tests, native QA mit 207 bytegleichen Ressourcen, Datenerhalt und öffentliche Hash-/Signaturprüfung erfolgreich. Prüfstand/Hardwaregrenzen in `32_UNIFIED_ANNOTATION_MOVEMENT_TEST.md`, Release in `09_DESKTOP_APP_UND_UPDATES.md`. Keine weitere produktive Archivänderung.

## HTML-Eingabe während Ansichtswechseln (30.10.2026)

Ein Arbeitsblatttest fand vor der bestätigten Room-Ansicht eine Eingabelücke:
Das Feld war sichtbar, der Host noch `ready: false`; sehr frühe Eingaben wurden
abgewiesen und zurückgesetzt. Der neue lokale Bereitschafts-ACK bindet die
HTML-Eingabe an die akzeptierte Generation/Revision. Native `inert`-Sperre um
den Frame und innerhalb des Paketdokuments verhindern Pointer-/Tastatureingaben
und beenden alten Fokus. Gedämpfte HTML-Fläche und `aria-busy` kennzeichnen die Wartephase.
Keine Speicherung, Konfliktprüfung oder Remote-Freigabe gelockert.

Der Agentenerstlauf hält Host-ACKs gezielt zurück: sichtbares AB bleibt gesperrt,
Fokussieren und Tippen verändern keinen Wert. Nach Freigabe folgen Eingaben in
beiden Richtungen, Clipwechsel mit alten und aktuellen Bestätigungen sowie
bestätigte Archivspeicherung und Reload. Dieselben Checks für personal/public,
Chromium/WebKit. Der Brückentest prüft Elternfensterbindung, Sperre und Blur.
Belege liegen lokal unter output/room-input-ready/. Quelländerung, keine neue
Installation, Systemdruck-, Touch- oder native Hardwareabnahme.
