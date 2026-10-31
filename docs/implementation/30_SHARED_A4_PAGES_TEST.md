# Gemeinsame interaktive A4-Seiten – Prüfstand D-259

**Stand:** 14. Oktober 2026. App-Unterstützung mit 0.1.50 veröffentlicht; fünf Drug-Harm-Vorlagen jetzt produktiv aktiviert.

## Entscheidung und Grenze

Die Nutzerentscheidung ist ein gemeinsames Papierlayout für Aufgaben, Antwortflächen und Seitenumbrüche im Lehrer-/Room Canvas und Ausdruck. Größenänderung skaliert das Blatt proportional. Der explizite optionale Paketvertrag `print.layout = shared-pages` verwendet denselben Bildschirm-/Druck-Entry und `data-tafelraum-page`-Abschnitte. Die App errät keine Seiten aus Titeln oder bisherigen CSS-Klassen.

Der innere Viewport entspricht A4 in CSS-Papiermaßen; initial zeigt der native Träger eine Seite. Weiterer Inhalt scrollt darin. Canvasgeometrie bleibt kanonisch, keine zusätzliche Zoompersistenz. Beide lokalen Ansichten verwenden dieselbe Eckskalierungsrechnung. Source-/Room-Befehle behalten ihre bestehenden Revisionsprüfungen und Materialverbünde.

## Umgebung

- macOS, Apple Silicon, native WKWebView in separat gebautem `Tafelraum QA Scrollbars.app`, eigene App-ID `app.jujies.tafelraum.qascrollbars` und Loopbackport 49349.
- Ausschließlich synthetische QA-Stunde/Archivbasis. Produktionsarchiv wurde gelesen, aber nicht verändert.
- Zusätzlich isolierter Desktopbrowser, 1024×576; native Lehreransicht 1440×900, Room 1280×800. Keine echte Touch-/Stift- oder Zweitdisplayabnahme.
- Source-Prüfstand nach Abnahme aus produktiven Sourcepfaden entfernt; Kopien unter `output/a4-pages/`. Normale Desktopressourcen anschließend neu gebaut.

## Tatsächliche Bedienprüfung

- Vollständige erste Drug-Harm-Seite inklusive Footer nach Einfügen und Zentrieren, ohne manuelles Raten der inneren Zoomstufe.
- Lehrer-Eckgriff: 509,0909×720 → 574,8245×812,9661, oberer linker Punkt bleibt stehen, Verhältnis 210:297. Aufgaben, Zeilenumbrüche und Formularpositionen wachsen gemeinsam.
- Ein Undo stellt 509,0909×720 wieder her und erhält das Blatt. Redo stellt exakt die größere Geometrie wieder her. Die frühere NEVER-Vorschau ließ Undo stattdessen die Einfügung zurücknehmen; EVENTUALLY-Vorschau plus Basisrückstellung und einmaliger IMMEDIATELY-Commit beheben die Ursache.
- Vergrößerung über den sichtbaren Canvasviewport hinaus: Papier und Auswahlkontur clippen an derselben Viewportgrenze. Kein zusätzlicher weißer Dokumentbereich.
- Room-Auswahl und echter Eckdrag: oben links bleibt fest, Blatt wächst proportional. Eigener Room-Undo stellt die Größe wieder her; Wiederholen wird angeboten. Der Griff wurde durch Verschieben der Room-Leiste freigelegt.
- Lehrer→Room `users`, Room→Lehrer `others` in verschiedenen Lücken; Werte blieben bei QA-App-Neustart erhalten.
- Zweiseitige Vorlage: innerhalb des Blatts zur zweiten Seite gescrollt, beide Antwortfelder bedient. Keine Neuordnung bei Größenänderung.

Belege: `output/a4-pages/teacher-a4-native.png`, `room-a4-eingaben.png`, `room-a4-resize.png`, `two-pages-native.png`.

## Druckabnahme

Zielpfad ist die tatsächliche native Aktion **Material drucken → macOS-Druckdialog → PDF**. Die PDFs wurden mit Poppler gerendert und vollständig gesichtet; Seitenzahl und Papiergröße zusätzlich maschinell geprüft. Druckausgabe bleibt gemäß bestehendem Vertrag eine frische leere Vorlage, kein Ausdruck des Canvas-Instanzzustands.

| Paket / Prüffall | PDF unter `output/a4-pages/` | Ergebnis |
| --- | --- | --- |
| Drug Harm Diagramm | `chart-final.pdf` | 1× A4 Hochformat, vollständiges Diagramm, Aufgaben und Footer |
| Diagramm Lösung | `chart-solutions-final.pdf` | 1× A4 Hochformat, vollständige Lösung |
| Lesetext | `reading-final.pdf` | 1× A4 Hochformat, Text und Vokabular vollständig |
| Aufgaben | `comprehension-final.pdf` | 1× A4 Hochformat, Fragen und Schreiblinien vollständig |
| Aufgaben Lösung | `comprehension-solutions-final.pdf` | 1× A4 Hochformat, Antworten und Schreiblinien vollständig |
| Synthetische zwei Seiten | `two-pages-approved.pdf` | genau 2× A4 Hochformat, beide Seitenenden und Antwortflächen sichtbar |
| Synthetisches Querformat | `landscape-approved.pdf` | **nicht freigegeben**: Canvas hat Querformat, der bestehende native Druckdialog exportiert Hochformat; CSS-`@page size` allein stellt seine Papierorientierung hier nicht um |

Hochformat-PDF-Maße: 595,3×841,9 pt. `chart-erster-druck.pdf` und `two-pages-final.pdf` sind verworfene Diagnoseartefakte, keine Freigabe. Eine starre 297-mm-Druckbox plus Systemrand erzeugte eine zusätzliche Leerseite; gemeinsame Bildschirm-Innenränder und normale Printfragmenthöhe mit explizitem Seitenumbruch beheben dies. Die synthetische Vorlage hatte außerdem zunächst keine eigenen Formular-/Papierfarben und erbte dunkle Hostdefaults; sie erhielt ausdrückliche Paketstyles und wurde erneut vollständig gedruckt geprüft. Querformatmaterial benötigt vor Aktivierung eine gesonderte native Druckkorrektur und erneute Abnahme.

## Bestand und Aktivierung

Die fünf vorbereiteten Drug-Harm-Pakete liegen unter `output/interactive-materials/`. `pages.html`, `pages.css` und `page-layout.css` ergänzen die gemeinsamen Seiten; bisherige `index.html` und `style.css` bleiben bytegleich erhalten. Dadurch ändern bereits gespeicherte Instanzen ihren Entry und ihre Annotationpositionen nicht stillschweigend.

Die installierte Produktionsversion 0.1.48 versteht den neuen festen Seitenvertrag noch nicht. Deshalb weder Manifestumschaltung noch Materialinstallation durchgeführt. Aktivierung muss gemeinsam mit einer unterstützenden App erfolgen; vor produktivem Überschreiben Archivbackup erzeugen und verifizieren. Altinstanzen behalten ihre bisherigen Entries; neue Einfügungen können danach die neue Darstellung verwenden. 45 vorhandene druckbare Pakete wurden nur inventarisiert, nicht pauschal migriert: andere Seitentrennungen und drei separate Druck-Entries benötigen eine individuelle Umstellung/Abnahme.

Remote-Wire und dessen responsive Projektionsvertrag bleiben unverändert. Die fünf geprüften Pakete deklarieren kein Remote-Live; Shared-Pages-Remote ist nicht abgenommen. Annotation-/Abdeckverbünde sind über die gemeinsame vorhandene Transformation und Tests abgesichert; praktische kombinierte Rotation/Ink/Abdeckung sowie echte Touch-/Stiftabnahme bleiben offen.

## Checks

- 303 App-/Archivtests bestanden.
- 91 Live-/Room-Tests bestanden.
- Beide Typprüfungen erfolgreich; Haupt- und Livebuild erfolgreich über `prepare:desktop`.
- Alle fünf Stagingpakete erneut mit `check-interactive-material --require-print` erfolgreich geprüft.
- Native ARM64-QA-Bundle erfolgreich gebaut; keine Produktionsinstallation oder Veröffentlichung.
- `git diff --check` erfolgreich.

Änderungen betreffen Manifestvalidierung und Materialtypen, den zentralen Papierprojektions-/Transformationspfad, Lehrer-/Room-Frame und Auswahl, native Druckvorbereitung sowie die dokumentierte Autorenvorlage. Keine neue Dependency, zweite Persistenz oder Enginekopie. Die ARM64-Ressourcenprüfung kopiert bereits dünne ARM64-Node-Binaries; nur universelle Binaries werden weiterhin reduziert.

## Nachprüfung der Nutzerklarstellung: digital mehr Antwortplatz

Die Initialdarstellung bleibt druckgleich; nachträgliches digitales Feldwachstum ist ausdrücklich erlaubt. Im nativen QA-Blatt `Aufgaben` wurde Frage 1 am eigenen Resizegriff um rund 130 Bildschirmpixel nach unten vergrößert. Frage 2 rückte darunter nach unten, die Papierbreite blieb erhalten und das Dokument wurde scrollbar. 25 Antwortzeilen wurden eingegeben; der vergrößerte Textbereich scrollte innen unabhängig. Beleg: `output/a4-pages/digital-answer-expanded.png`.

Danach wurde erneut über **Material drucken → Ziel-Druckdialog → PDF** gedruckt: `comprehension-expanded-digital-print.pdf`. Diese frische leere Vorlage behält die ursprünglichen zwei Schreibzeilen an Frage 1, alle übrigen Aufgaben und eine A4-Seite ohne Feldscrollbalken oder digitale Testantworten. Die initialen Schreibzeilen bleiben die Druckkapazität; mehr digitaler Platz ist keine Vergrößerung der Papierantwortfläche. Feldhöhe/innerer Scroll bleiben wie bisher lokale DOM-Bedienung und erhalten keinen neuen Persistenzpfad.

Die vorbereiteten `pages.html`/`pages.css`/`page-layout.css`, die Referenz `shared-pages.css`, UI Brief, D-259, Projektionsvertrag und HTML-Skill wurden entsprechend präzisiert. Alte Entry-/Styledateien und produktive Archive bleiben unberührt.

**Ergebnis der Nachprüfung:** Die gerenderte neue Druck-PDF ist pixelgleich zur zuvor abgenommenen `comprehension-final.pdf` (1000-px-Poppler-Render, kein Differenzrechteck), eine A4-Seite und ohne digitale Testantworten. Beide Typprüfungen, alle fünf `--require-print`-Paketprüfungen und `git diff --check` erneut bestanden. Keine Appcodeänderung in dieser Präzisierung.

## Release-Anschluss 0.1.50

Am 14. Oktober 2026 ist der unterstützende Appstand signiert veröffentlicht. Das Programmupdate installiert keine Unterrichtsmaterialien. Vor Aktivierung der Stagingmanifeste muss die tatsächlich laufende App mindestens 0.1.50 unterstützen und der aktuelle Paketinhalt erneut abgenommen werden, falls er seit den oben dokumentierten PDFs redaktionell verändert wurde. Native Release-Abnahme, Datenerhalt, Hash und Signatur stehen in `09_DESKTOP_APP_UND_UPDATES.md`.

## Produktive Aktivierung nach Nutzerfehlerbericht – 14. Oktober 2026

Der Nutzer lud nach Installation von 0.1.50 erneut das Leseblatt und erhielt weiterhin einen responsiven Ausschnitt mit Inhaltszoom und freien Seitengriffen. Ursache war die unvollständige Auslieferung: Die produktiven Paketmanifeste verwiesen noch auf `index.html` ohne `shared-pages`. Das Programmupdate allein stellte diese Inhalte nicht um. Auf den ausdrücklichen Fehlerbericht wurden die fünf aktuellen Drug-Harm-Vorlagen geprüft und aktiviert, statt weitere Canvas-Workarounds einzuführen.

Vor dem produktiven Überschreiben Vollbackup erstellt und verifiziert: `data/unterrichtsarchiv-backups/unterrichtsarchiv-2026-10-14T19-31-51-155Z-drug-harm-a4-activation.tar.gz`, SHA-256 `3ca38a839ec3c193bd7caf5346696bb0d7dece8dc41d8d2a7518c8f786ea7e84`, 43 Unterrichte/48 aktuelle Boards. Installierte Desktop-App und laufende Oberfläche sind 0.1.50.

Aktuelle Fassungen erneut über native Aktion **Material drucken → macOS-Dialog → PDF** in der getrennten 0.1.50-QA-App abgenommen. Alle fünf `activation-*.pdf` unter `output/a4-pages/` haben genau eine A4-Hochformatseite und wurden vollständig gerastert/gesichtet. Die beiden aktuellen Comprehension-Fassungen enthalten die fünf Fragen, sechs Antwortbereiche und 22 Schreibzeilen ohne den inzwischen auf anderen Nutzerauftrag entfernten Vergleichsblock. Diese neuen PDFs ersetzen für diese Fassungen die früheren Comprehension-Belege. Die Test-App benötigte die passende eigene Loopbackadresse in ihrem bestehenden Capability-Vertrag, damit der native Print-Befehl dort aufrufbar ist; Produktionsrechte wurden nicht geändert.

Im produktiven Materialarchiv wurden nur `pages.html`, `pages.css`, `page-layout.css` und die fünf Manifeste ergänzt/umgestellt. Vor und nach der Operation bleiben `index.html`/`style.css` bytegleich; alle fünf Zielpakete bestehen `--require-print`. Der additive Neuinstaller überschreibt bewusst keine Pakete; der bestehende gezielte Aktualisierungsweg erfolgt daher nach Backup und Validierung, mit Manifest zuletzt atomar. Protokoll: `production-activation.json`.

Im echten Drug-Harm-Canvas die Zuordnung neu geladen und ausschließlich das vom Nutzer gerade eingefügte Leseblatt reversibel über die normale UI ersetzt. Vorher geprüft: keine gebundenen Elemente, Gruppe, Annotationen oder Materialclips. Neue Einfügung verwendet `pages.html`, native Orientierung `portrait`, 509,0909×720 und Verhältnis 210:297. Vollständige Seite inklusive Vokabular/Footer sichtbar, keine separate 100-%-Leiste und keine freien Seiten-/Eckgriffe. Eckskalierung mit einem Undo zurück auf die ursprüngliche Größe bestätigt; seitlicher Drag verändert das Blatt nicht. Native Kamera wurde für die Abschlussansicht einmal auf das Blatt fokussiert und der Fokus danach beendet. Beleg: `production-a4-reading.png`.

Der danach gespeicherte kanonische Boardstand enthält genau ein aktives neues Leseblatt. Alle anderen Canvasobjekte sind vollständig byteinhaltlich unverändert, Clips identisch und vorhandene Feldzustände erhalten (`production-board-verification.json`). Andere bereits gespeicherte Altinstanzen werden nicht automatisch neu gesetzt; neue Archiv-Einfügungen der fünf Pakete verwenden A4. Kein weiterer Appbuild oder Programmupdate notwendig; keine Änderung an Unterrichtsinhalten in dieser Aktivierung. Touch/Stift und reale Zweitdisplayprüfung bleiben Hardwareabnahme.

## Auswahlprüfung Drug harm – 15. Oktober 2026

Nutzerbericht: eigene Canvastextbox über dem hybriden Leseblatt lässt sich zusammen mit dem Blatt schwer auswählen/verschieben. Produktiven Stundenstand ausschließlich gelesen; native Unterrichtsansicht unverändert angesehen. Das Leseblatt `af0I_GKemQfKXXxo3uw0H` ist mit `locked: true` gespeichert. Die eigene Vokabeltextbox `sk8Zl_0e0yHsjPnK8rrEo` ist selbst nicht gesperrt, trägt aber die Materialannotationsgruppe dieses Blatts und ragt über dessen Unterkante. Es handelt sich damit nicht um zwei unabhängig übereinanderliegende Objekte. Woher die gespeicherte Sperre stammt, wurde nicht nachgewiesen; keine automatische Entsperrung oder Datenreparatur.

Getrennte temporäre Browser-Testbasis mit genau dieser Geometrie, Sperre und Bindung sowie neutralem Testblatt: Text lässt sich sowohl innerhalb des Blatts über den projizierten Annotationstreffer als auch im sichtbaren überstehenden Teil über den nativen Canvas auswählen. Vor der zweiten Probe durch Klick auf freien Canvas abgewählt. Eine erste Klickprobe lag unterhalb der tatsächlichen Textbox und ist ausdrücklich kein Fehlernachweis. Direkter Drag konnte über die eingesetzte Browserautomation wegen ihrer Iframe-Koordinatengrenze nicht ausgeführt werden; deshalb keine bestätigte Aussage zum Dragfehler. Gesperrter HTML-Grund wird vom bestehenden Material-Movepfad ausdrücklich abgewiesen. Das eigene Elementkontextmenü bietet nur Kopieren/Löschen und keinen sichtbaren Entsperrweg.

**Befund: revise.** Bestätigt sind gespeicherte Blattsperre und bestehende Annotationsbindung; ein allgemeiner Hit-Test-Fehler frei überlagerter Objekte ist nicht belegt. Nächster sinnvoller Eingriff: sichtbare kontrollierte Entsperrung über den bestehenden Elementaktionspfad, danach denselben nativen Auswahl-/Dragflow erneut prüfen. Keine globale Auflösung von Annotationsgruppen: diese tragen bewusst gemeinsame Bewegung und Projektion. Keine Appcode- oder produktive Archivänderung in dieser reinen Prüfung; daher keine neue Typ-/Testsuite erforderlich. Reale Touch-/Stiftbedienung weiterhin offen. Lokale Belege: `output/html-overlap-review/fixture.json`, `selected-inside.png`; neutrale Testbasis anschließend beendet.


## Umsetzung und native Gegenprüfung D-262 – 15. Oktober 2026

Die Folgeprüfung erweitert den vorstehenden Befund: Die Browserauswahl war kein ausreichender Nachweis für WKWebView. Auf dem Mac traf ein Klick/Drag auf sichtbaren Text im SVG-`foreignObject` wiederholt das darunterliegende HTML-Blatt. Nach Austausch allein der Texttrefferfläche durch ein transparentes SVG-Rechteck lässt sich dieselbe Geometrie mit der ersten Geste auswählen und verschieben. Der Text selbst wird unverändert projiziert. Pointercapture am Parent hält den Kontakt beim Wechsel zwischen Material und freiem Canvas. Doppelklick öffnet über die bestehende Textaktion den nativen Editor; native Wortauswahl `contribute` bestätigt.

Der neue unabhängige Dragabschluss behält die Materialbindung innen und löst sie außerhalb anhand des sichtbaren Mittelpunkts. Scrollversatz wird bei einer Lösung in Szenengeometrie überführt, damit der Text nicht springt. Materialbewegung nutzt unverändert die bestehende Bundleliste. Kein automatisches Zuordnen bereits vorhandener freier Texte und keine Bestandsmigration. Undo stellt Startposition und Bindung als gemeinsame Geste wieder her.

**Automatisch:** 317 App-/Archivtests und 95 Live-/Room-Tests erfolgreich, Haupt-/Live-Typprüfung und Haupt-/Desktop-Ressourcenbuild erfolgreich, nativer ARM64-QA-Build erfolgreich, Diffprüfung sauber. Vier neue Tests: Innenbindung inklusive anschließender Bundletranslation, Lösen ohne neue Zuordnung/Verlust anderer Gruppen, sichtbarer Scrollversatz, gedrehte Grenzen und ungebundene Elemente.

**Nativ:** Eigene App-ID `app.jujies.tafelraum.qa-peer-focus`, Port 49523, ausschließlich separate neutrale Archivbasis. Geometrie/Bindung aus der betroffenen Szene kopiert, neutrales Blatt verwendet. Anfangs responsive Darstellung, abschließend A4-Projektion mit identischer Szene. Text zuerst auf dem Blatt verschoben; danach rechts herausgezogen: gespeicherte Materialgruppe entfernt, Blatt unverändert. Ein Undo im finalen Build stellt vorherige Textposition und Gruppe wieder her (`native-final-release.png`, `native-final-undo.png`). Doppelklick zeigt den echten Texteditor. Gesperrtes Blatt anwählbar; Schlossaktion setzt nur dessen `locked` auf false. A4-Blatt über den äußeren Griff um 133,333 × 108,333 Szeneneinheiten bewegt; gebundener Text bewegt sich exakt um dieselben Werte (`native-sheet-moved-state.json`). Dies bestätigt die gemeinsame Bewegung ohne Fixierung der einzelnen Textbox.

**Grenzen:** Der direkte Iframe-Blattgrunddrag ließ sich mit der nativen Automation nach dem Entsperren nicht verlässlich bestätigen; er bleibt im vorhandenen Bridgepfad erhalten. Die native Materialbewegung ist über den zusätzlich sichtbaren Griff abgenommen. Visuelles Dunkelthema zeigte die kopierte sehr helle Textfarbe auf weißem Material; keine automatische Farbänderung im Rahmen dieses Auswahlauftrags. Scroll-/Rotationsauflösung ist geometrisch getestet, reale Touch-/Stiftgesten und ein echtes Zweitdisplay bleiben Geräteprüfung. Room-Objektbefehle/Tastaturbewegungen erhalten keinen neuen Detachabschluss. Keine produktiven Archiv-, Paket- oder Canvasdateien geändert. Keine Veröffentlichung; D-262 ist Entwicklungsstand. Der kurzzeitig im QA-Bundle verwendete passive Nachrichtenlogger ist im abschließenden Build entfernt.


## Vollständiger Einzel-Textkreislauf und sichtbare Aktionen – D-263 (15. Oktober 2026)

Nach ausdrücklicher Nutzerfreigabe die beiden Lücken der Gesamtprüfung geschlossen: Bewusster Einzel-Textdrop kann wieder binden; Materialaktionen bleiben bei außerhalb liegender Blattkante erreichbar. Der D-262-Stand ohne Rückzuordnung wird dadurch gezielt erweitert, ohne einen automatischen Überlappungsabgleich einzuführen.

**Automatisch:** 323 App-/Archivtests, 95 Live-/Room-Tests, beide Typprüfungen, Haupt-/Desktop-Ressourcenbuild und nativer ARM64-QA-Build erfolgreich. Zusätzliche Tests schützen Rücklegen mit aktuellem Scrollanker und anschließender Bundletranslation, Wechsel auf das oberste getrennte Material, keine Bindung durch Blattbewegung/gewöhnlichen Ink-Drag sowie Kontrollerreichbarkeit bei großen/offscreen/gedrehten Blättern, schmalen/kleinen Viewports und Hindernissen (Verlauf, Toolbar, Materialdrawer).

**Native Mac-Prüfung:** Weiterhin eigene QA-App-ID `app.jujies.tafelraum.qa-peer-focus`, Port 49523 und neutrale eigene Archivbasis. Testtextbox zur besseren Prüfung blau statt der zuvor kopierten hellen Schrift. Vom Blatt nach rechts gezogen, dann zurück auf das Blatt: gespeicherte Materialgruppe und aktueller HTML-Scrollanker wieder vorhanden (`native-rebound.json`). Undo legt die Textbox wieder frei daneben, Redo bindet sie wieder. Danach das Blatt über den sichtbaren Griff bewegt: zurückgelegte Textbox folgt. Beleg `native-rebound-move.png`. Im finalen Build auch nach vorheriger Blattauswahl die ungewählte freie Textbox direkt zurückgezogen; `native-final-return.png` bestätigt die bindende Projektion. Doppelklick auf der freien Textbox öffnet den bestehenden echten Texteditor mit Wortauswahl, Escape schließt ihn ohne neue Zuordnung.

**Zoom-/Überdeckungsprüfung:** Synthetischer gespeicherter Kamerastand 200 %, obere und rechte Blattkante außerhalb des Canvas. Auswahl zeigt das Schloss trotzdem innerhalb der sichtbaren Fläche und unterhalb des Verlaufs; keine Überdeckung der Undo-/Redo-Buttons (`native-zoom-lock.png`). Entsperren wechselt an derselben erreichbaren Stelle zum Griff; native Ziehgeste bewegt das große Blatt (`native-zoom-grip.png`). Materialarchiv geöffnet: Aktionsgruppe bleibt oberhalb beziehungsweise neben den vorhandenen UI-Rechtecken bedienbar. Die Gruppe wird nicht mit dem Blatt skaliert, sondern behält ihre 48-px-Ziele. Kein Kamerawechsel durch Auswahl/Entsperren; Rückkehr zur Vollansicht ausschließlich über die bewusst betätigte vorhandene Aktion Inhalt finden.

**Architektur/Grenzen:** Aktionsgruppe ist nur eine Portalprojektion der vorhandenen Frameaktionen auf derselben Canvas-Layerebene, keine zweite Auswahl oder Persistenz. Kontrollposition folgt aktuellen UI-Rechtecken. Nur der unabhängige Lehrer-Einzel-Textdrag bindet erneut; normale Objektgruppen/Mehrfachauswahl, Room-Befehle und Tastaturbewegung sind nicht erweitert. Direkte Material-Hintergrundgeste behält die D-262-Prüfgrenze; Griffpfad nativ abgenommen. Scroll-/Drehfälle sind geometrisch geprüft, reale Touch-/Stift- und Zweitdisplayprüfung weiterhin offen. Keine produktiven Unterrichtsdateien geändert und noch kein Update veröffentlicht. Belege/Logs unter `output/annotation-roundtrip/`.


## Veröffentlichung D-262/D-263 – 0.1.54 (15. Oktober 2026)

Die oben noch als unveröffentlicht beschriebenen Änderungen sind mit 0.1.54 veröffentlicht. Erneut 323 App-/Archivtests, 95 Live-/Room-Tests, Rust-Test, Typprüfungen und Haupt-/Live-Builds erfolgreich. Separater nativer Versions-/Reloadcheck zeigt 0.1.54 und das erhaltene Testblatt; alle 207 QA-Ressourcen sind bytegleich zum finalen portablen Paket. Der vorstehende native Kernflow bleibt unverändert: Vergleich zum vorherigen geprüften QA-Frontend ergibt ausschließlich die Versionskonstante und den daraus abgeleiteten Assetnamen. Eine erneute Koordinaten-Ziehprüfung im Releaseabschluss war wegen `noWindowsAvailable` der UI-Automation nicht möglich; kein neuer Produktfehler daraus abgeleitet. Die vorherigen nativen Bewegungsbelege und Prüfgrenzen gelten weiter. QA regulär beendet.

Datenerhalt 0.1.53 → 0.1.54 für sechs synthetische Archiv-/Asset-/Notizdateien bytegleich; öffentlicher Updaterdownload stimmt per Hash und Signatur mit dem lokalen Release überein. Buildquelle, Gleichheitsnachweise, Versionsbild und Logs unter `output/release-0.1.54/`. Keine produktive Appinstallation, Paketinstallation oder Archivänderung.


## Regression nach 0.1.54: Text während der Geste sichtbar halten

**Anlass:** Nutzerprüfung vom 15. Oktober 2026: Textinhalt bleibt während der Bewegung zunächst auf dem Blatt, erscheint beim Überschreiten doppelt und wird beim Hineinziehen vorübergehend vom Iframe verdeckt. Zusätzlich wächst ein dunkler Rahmen mit. Die vorherige Abnahme belegt den Drop-Endzustand, deckt diese laufenden Zwischenzustände aber nicht ausreichend ab.

**Ursachen und Korrektur:** Der Drag leitete jedes Element aus derselben Startrevision ab; der Annotationsschlüssel änderte sich nach dem ersten Schritt nicht mehr. Position weiterhin aus dem Start berechnen, Revision dagegen aus dem aktuellen Szenelement fortschreiben. Ein synchroner Commit hält native und HTML-Zeichnung zusammen. Die bestehende, auf die Blattfläche begrenzte Projektion ergänzt den gezogenen Text bereits bei Randüberlappung; außerhalb zeichnet weiterhin der native Canvas. Sichtbarer HTML-Scrollversatz wird mit aktuellem Scrollanker in dieselben Szenenkoordinaten überführt. Der zusätzliche dunkle Rahmen ist die Engine-Gruppenbearbeitung: Standalone-Text wird jetzt direkt über die vorhandenen Element-IDs ausgewählt, ohne die ganze Blattgruppe in Bearbeitung zu versetzen. Bindung und Bundlebewegung bleiben unverändert. Dieselbe Auswahlableitung gilt bei Erstellung, Klick, Kontextmenü, Doppelklick, Backspace und Dragabschluss. Ende/Abbruch löschen die flüchtige Projektionszuordnung vor dem Szenencommit. Keine neue Datenstruktur, Migration oder UI.

**Automatisch:** 327 App-/Archivtests, 95 Live-/Room-Tests, beide Typprüfungen, Desktop-Ressourcenbuild und nativer ARM64-Build erfolgreich. Neue Tests schützen sichtbare Dragposition/Scrollanker, unveränderte Gestenbasis und Dropbindung, Randprojektion vor Eintritt des Mittelpunkts, deren Ende sowie direkte Textauswahl bei unveränderter Blattgruppe. Bestehende gedrehte Geometrie-/Zoom- und Material-Bundletests bleiben grün.

**Laufende Browsergeste:** Isolierte neutrale Archivkopie und eigene lokale Testports, dunkles Design. Für beide Richtungen jeweils acht Zwischenpositionen bei gedrückter Maustaste aufgezeichnet (`buttons=1`). Native Szenenposition und DOM-Textprojektion stimmen an jedem Schritt auf <0,01 px überein; Revisionen steigen; `editingGroupId=null`. Beim Rückweg beginnt die geclippte Darstellung bereits bei erster Randüberlappung vor Eintritt des Mittelpunkts. Danach Undo legt den Text wieder frei daneben, Redo stellt die Bindung her. `held-pointer-roundtrip.json` und maschinell geprüfter `held-pointer-result.json` unter `output/annotation-drag-display/`. Die Messhilfe war temporär und ist aus dem abschließenden Quellstand und Build entfernt.

**Finale native Gegenprüfung:** Eigene QA-App-ID `app.jujies.tafelraum.qa-peer-focus`, Port 49523, vorhandenes neutrales Testprofil mit Formularfeld und leicht gedrehtem Blatt. Alle 207 Ressourcen bytegleich zum abschließenden Hauptressourcenbuild (`qa-resources-final.json`). Herausziehen und Zurücklegen funktionieren; Text auf der Blattkante bleibt durchgehend zusammengesetzt, ohne versetzte Kopie. Nach Auswahl und Loslassen nur eigener Textrahmen, keine vergrößerte dunkle Blattbox (`native-edge-final.png`, `native-final-clean.png`). Backspace entfernt ausschließlich Text; Blatt bleibt. Undo stellt Text wieder her; erneuter Hin-/Rückdrag und Doppelklick öffnen den vorhandenen Texteditor mit Wortauswahl, Escape beendet ihn. Undo/Redo des Rücklegens ebenfalls nativ geprüft. Abschließend genau zwei lebende Objekte und eine gebundene Textbox im QA-Snapshot (`native-final-state.json`). QA regulär beendet; Testbrowser und eigene Server geschlossen.

**Grenzen/Auslieferung:** Laufende Zwischenpositionen sind im Browser gemessen; native Screenshots belegen End-/Rand- und Bearbeitungszustände, keine native Zeitlupenaufnahme. Scroll-/Rotationsauflösung geometrisch geprüft, reale Touch-/Stift- und Zweitdisplayprüfung weiterhin offen. Keine Erweiterung von Room-Befehlen oder Mehrfachauswahl; keine produktiven Unterrichtsdateien verändert. Dies ist eine noch unveröffentlichte Korrektur nach 0.1.54; die öffentliche 0.1.54 bleibt unverändert.


## Veröffentlichung der Ziehkorrektur – 0.1.55 (15. Oktober 2026)

Die oben als unveröffentlicht beschriebene Korrektur ist mit 0.1.55 veröffentlicht. Eingefrorener Quellstand und vollständiger Vergleich gegen 0.1.54 unter `output/release-0.1.55/`; keine Quelldrift vor Veröffentlichung. Erneut 327 App-/Archivtests, 95 Live-/Room-Tests, Rust-Test, beide Typprüfungen sowie Haupt-/Live-Builds erfolgreich. Datenerhalt zwischen den unveränderten signierten Paketen 0.1.54 und 0.1.55: alle sechs synthetischen Archiv-/Board-/Asset-/Notizdateien bytegleich.

Finale native QA im vorhandenen eigenen Profil, App-ID `app.jujies.tafelraum.qa-peer-focus`, Port 49523: Version 0.1.55, erhaltenes Testblatt, Herausziehen und Zurücklegen sowie ausschließlich eigener Textrahmen bestätigt. Alle 207 Ressourcen bytegleich zum finalen portablen Paket (`qa-resource-equality.json`); Bilder `native-version.png`, `native-outside.png`, `native-returned.png`. Die vorstehende detaillierte Browser-/Native-Abnahme bleibt unverändert gültig: der Vergleich zum dort geprüften Frontend ergibt ausschließlich die Versionskonstante (`previous-native-qa-equality.json`). QA regulär beendet. Öffentliche Hash-/Signaturprüfung in `publish.log` erfolgreich. Keine produktive Appinstallation oder Unterrichtsdatenänderung; Hardware- und Zwischenzustands-Prüfgrenzen bleiben bestehen.


**Folgebeobachtung Marker (15. Oktober 2026):** Der Nutzerfund gesperrter, abgelöster Marker war bereits vor 0.1.54/0.1.55 im Stundenstand enthalten. Historisch belegte Einzelreparatur und Korrektur des temporären Radiererzustands an Projektions-/Persistenzgrenzen separat in `31_MARKER_BINDING_RECOVERY_TEST.md`. Keine erneute Änderung der Text-Drop-Regel.
