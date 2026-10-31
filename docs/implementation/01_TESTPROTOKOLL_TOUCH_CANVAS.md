# Testprotokoll – Touch-/Canvas-Surface

## Stabile Höhenlage beim Formtext-Editieren – 13. September 2026 (D-182)

- Prüfstand: Desktop-Browser/macOS, isolierte Stunde unter `output/vertical-text-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Der gespeicherte Formtext lag sichtbar oben, trug aber noch eine native Mittel-Ausrichtung. Nach dem Szenenabgleich blieb er beim Doppelklick und beim Schließen des Editors an derselben Stelle. Die Palette verschob den gesamten Textblock nach Mitte, unten und zurück nach oben. Eine markierte Wortauswahl blieb beim Wechsel erhalten. Reload, Undo/Redo und dunkler Modus wurden geprüft. Keine Browser-Laufzeitfehler.
- Checks: 229 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Build grün. Rechteck-, Ellipsen- und Rautengeometrie sind zusätzlich durch gezielte Tests abgedeckt. Die Bedienung auf realer Touch-/Stifthardware bleibt offen.

## Formtext beim Skalieren – 13. September 2026 (D-180)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Beschriftete Form über den oberen rechten Griff verbreitert und wieder gestaucht. Nach beiden Gesten war der umbrochene Text sichtbar; Doppelklick öffnete weiterhin den Editor. Nach Reload blieb der Text erhalten. Keine Browser-Laufzeitfehler. Der bekannte Platzhalter beim vollständigen Reload war kurz sichtbar und gehört nicht zur laufenden Skalierung.
- Checks: 227 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Produktionsbuild grün. Einzelne Zwischenframes während der Geste und echte Touch-/Stiftbedienung sind noch nicht instrumentiert.

## Formgebundene Stift- und Markerzüge – 13. September 2026 (D-179)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Auf eine beschriftete gerundete Form wurden ein neuer Stiftzug und ein neuer Markerzug gezeichnet. Beide folgten der Form bei zwei Verschiebungen und einer Größenänderung; nach Reload blieben sie zugeordnet. Ein zuvor ohne Bindung angelegter Marker blieb als Kontrolle an seiner alten Stelle. Der neue Marker wurde einzeln gewählt und auf der Form versetzt. Radieren entfernte nur ihn, nicht Form oder Formtext; Undo stellte ihn wieder her.
- Die Formpalette samt Abdeckungsaktion blieb bei Auswahl der markierten Form erreichbar. Vollabdeckung und Formverbund wurden gemeinsam bewegt; nach Aufdecken lagen die neuen Züge weiterhin auf dem Formtext. Doppelklick in den gebundenen Text öffnete den nativen Editor aus Auswahl und Hand. Ellipsen-/Rautenkonturen und Überlappung mit einem Bild sind durch gezielte Geometrietests abgedeckt, noch nicht einzeln im Browser geprüft.
- Checks: 227 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Produktionsbuild grün; Browser ohne Laufzeitfehler. Reale Touch-/Stiftbedienung offen.

## Hängender Einzug für Aufzählungen – 13. September 2026 (D-178)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- In einem aufgezogenen, schmalen Textbereich wurden zwei lange `• `-Absätze und ein normaler Absatz als zunächst einfacher nativer Text eingefügt. Noch während der Eingabe sowie nach Escape und Reload begannen die Folgezeilen unter dem Text nach dem Punkt; der normale Absatz blieb ohne Einzug. Doppelklick auf eine Fortsetzungszeile markierte den ganzen ersten Aufzählungspunkt einschließlich Zeichen. Ein bereits vorhandener Punkt im Formtext wurde verlängert: Seine Folgezeilen begannen ebenfalls unter dem Text, sowohl im Editor als auch nach Escape.
- Checks: 225 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Produktionsbuild grün. Touch/Stift auf Zielhardware offen.

## Geschlossene Formabdeckung – 13. September 2026 (D-177)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Vorher ragte die korallfarbene Außenkontur eines gerundeten Rechtecks als feiner Saum hinter der vollflächigen grauen Abdeckung hervor. Nach der Korrektur war die Außenkante einschließlich Rundungen geschlossen. Die Abdeckung wurde von ganz auf teilweise und zurück gezogen; die innere Teilkante blieb schmal. Nach Reload und Verschieben der abgedeckten Form blieb die vollständige Kante geschlossen. Reale Touch-/Stiftbedienung steht aus.
- Checks: 224 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Produktionsbuild grün.

## Gepunkteter Hauptgriff – 13. September 2026 (D-176)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Der Hauptgriff zeigte unten und rechts dasselbe gepunktete Symbol wie die Text- und Formpalette. Drag von unten nach rechts dockte die Hauptwerkzeugleiste unverändert an; das sichtbare Griffziel maß unten 48 × 56 und rechts etwa 54 × 54 CSS-Pixel. Touch/Stift auf Zielhardware offen.
- Checks: sechs relevante Dock-/Overflow-Tests, App-Typprüfung und App-Produktionsbuild grün; keine Browser-Laufzeitfehler.

## Bewegliche Formpalette – 13. September 2026 (D-175)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Die Formpalette ließ sich am Griff rechts andocken (168 × 290 Pixel), in die Mitte lösen und oben sowie unten rechts ablegen. Füll- und Farbbuttons blieben 48 × 48 Pixel groß; ein Farbwechsel im kompakten Seitenlayout änderte die Form. Beim Wechsel zur Raute blieb der Andockplatz erhalten. Unten endete die Palette bei y≈476 und damit oberhalb der Hauptwerkzeugleiste. Reale Touch-/Stiftbedienung und der Eindruck der Animation auf Zielhardware bleiben offen.
- Checks: 223 App-Tests, beide Typprüfungen und App-Produktionsbuild grün; keine Laufzeitfehler im Browser.

## Ruhiger Eintritt in den Rich-Text-Editor – 13. September 2026 (D-174)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Formtext und freier gemischt formatierter Text wurden per Doppelklick geöffnet. Nach dem Übergang blieben sichtbare Glyphen und Umbrüche an derselben Stelle; das native Eingabefeld war transparent, die Vorschau sichtbar. Im freien Text wurde ein ausgewählter Absatz ersetzt und der Editor geschlossen. Die ruhende Textgrafik wird nun erst nach dem ersten fertigen Vorschau-Frame verborgen. Eine zeitlich aufgelöste Aufnahme des ersten Frames sowie Touch-/Stiftprüfung auf Zielhardware stehen noch aus.
- Checks: 221 App-Tests, 56 Live-Tests, beide Typprüfungen und App-Produktionsbuild grün. Frisch geladener Browser ohne Laufzeitfehler.

## Konturschatten für Grundformen – 13. September 2026 (D-172)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Das vorhandene grüne, gerundete Rechteck erhielt einen weichen Schatten. Neu erzeugte gefüllte Ellipse und Raute zeigten Schatten entlang ihrer jeweiligen Kontur; bei leerer Ellipse blieb nur der Umriss ohne Flächenschatten.
- Der Schalter `Objektschatten` entfernte und erneuerte die Schatten. Eine Raute wurde um 20 × 20 Bildschirmpixel verschoben; ihre Schattengeometrie wanderte genau mit. Nach Reload war der Schatten wieder vorhanden. Hell und Dunkel geprüft; 221 App-Tests, 56 Live-Tests, beide Typprüfungen und Produktionsbuilds grün. Touch/Stift sowie viele gleichzeitige Formen auf Zielhardware offen.

## Textaktionen unter der Schreiblinie – 13. September 2026 (D-171)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Bei leerer freier Eingabe war die gepunktete Linie 134 Bildschirmpixel breit. Ihr Mittelpunkt (x≈703) und der mittlere der drei Buttons (x≈703) stimmten überein; die Buttonreihe hatte beidseitig etwa 12 Pixel Abstand zum Linienende.
- Mit `Schnelle Unterrichtsantwort` wuchs die Linie auf etwa 287 Pixel; beide Mittelpunkte folgten auf x≈763. Nach Kürzung auf `Ja` lagen beide wieder bei x≈701. Beim gebundenen Formtext blieb die Dreierreihe oberhalb der Form. 220 App-Tests einschließlich Desktop-/Touch-Zoomgeometrie, 56 Live-Tests, App-Produktionsbuild mit Typprüfung und Live-Typprüfung grün. Reale Touch-/Stiftprüfung offen.

## Gleiche Textposition vor und im Editor – 13. September 2026 (D-170)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Vor der Korrektur erschien der Formtext im Ruhemodus mit anderen Schriftmaßen als im Editor: `Bilder/Animation` begann sichtbar weiter rechts und der zentrierte Absatz sprang beim Doppelklick. Nach dem Neuladen mit der Korrektur begannen derselbe Formabsatz und `(Test)` in beiden Zuständen an derselben Stelle; der zweizeilige Umbruch blieb gleich.
- Auch `Motoren und Antrieb` im freien Rich Text behielt beim Wechsel über `Text bearbeiten` Anfangsposition und Zeilenumbruch. 219 App-Tests, 56 Live-Tests, App-Produktionsbuild mit Typprüfung sowie Live-Typprüfung grün. Touch/Stift auf Zielhardware offen.

## Doppelklick auf Absatz und Aufzählungspunkt – 13. September 2026 (D-169)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Rich Text auf Form: Erster Doppelklick auf `Motoren` öffnete den Editor mit Auswahl `• Motoren`; Doppelklick auf die erste sichtbare Zeile von `Bilder/Animation erklären zum Otto-Moor` markierte den ganzen geschriebenen Absatz über beide Anzeigezeilen.
- Freier Rich Text: Erster Doppelklick wählte `Motoren und Antrieb`; weiterer Doppelklick auf `Kraftstoffe` wählte `Kraftstoffe verstehen` einschließlich der umbrochenen zweiten Anzeigezeile. Die Palette blieb nach dem Öffnen auf der Auswahl; Durchstreichen betraf nur diesen Absatz.
- Einfacher nativer Text: Ein mehrzeiliger Testtext wurde ohne Rich-Text-Umwandlung per Doppelklick aus dem Handmodus absatzweise ausgewählt (`Eine schnelle Antwort`, danach `Noch eine Zeile`). 219 App-Tests, 56 Live-Tests, beide Typprüfungen und Produktionsbuilds grün. Touch/Stift auf Zielhardware offen.

## Textaktionen außerhalb der Schrift – 13. September 2026 (D-168)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Freier breiter Text: drei Aktionen unmittelbar unter der Textbox. Mehrzeiliger Formtext: drei Aktionen horizontal oberhalb der Form. Kurzer neuer Text nahe dem oberen Rand: drei Aktionen unterhalb des Textes mit Abstand zur Schrift, statt als seitliche Reihe über der Schreiblinie.
- Zusätzlicher Randfall im reinen Layouttest: Nahe dem unteren Rand oder vor der verschiebbaren Hauptwerkzeugleiste wechselt die Reihe nach oben. 218 App-Tests, 56 Live-Tests, beide Typprüfungen und Produktionsbuilds grün. Echte Touch-/Stiftbedienung auf Zielhardware offen.

## Kursiv auf Textobjekt und Zeichenauswahl – 13. September 2026 (D-167)

- Prüfstand: Desktop-Browser/macOS, isolierte `Texteditor-Prüfung` unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Markiertes `Bilder` im gebundenen Formtext über die geöffnete Palette kursiv gesetzt: nur die Auswahl neigte sich, der übrige Satz blieb aufrecht. Die kursive Aktion erschien zwischen Aufzählung und Unterstreichen mit 48-Pixel-Ziel und sichtbarem aktivem Zustand; keine Überlagerung in der zweiten Palettenzeile.
- Ein freies mehrzeiliges Textobjekt ohne Zeichenauswahl wurde vollständig kursiv. Rückgängig stellte die aufrechte Fassung wieder her, Wiederholen die kursive. Nach Reload blieben sowohl Teilspanne als auch ganzes Objekt kursiv. Touch/Stift und Fonts auf Zielhardware nicht geprüft.
- Automatisiert: 217 App-Tests einschließlich Rückwärtskompatibilität des optionalen Stilfelds, 56 Live-Tests, beide Typprüfungen und beide Produktionsbuilds grün.

## Rich-Text-Direktvorschau – 13. September 2026 (D-166)

- Prüfstand: Desktop-Browser/macOS, isolierte Stundenkopie unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert. Formgebundener mehrzeiliger Text mit Teilfarbe und freier Text bleiben im bestehenden Teststand.
- Vorher: Neue PNG-Kennung bei jeder Änderung; beim schnellen Tippen oder Löschen sowie unmittelbar nach einem schnellen Escape war kurz das native Bild-Platzhaltersymbol sichtbar.
- Nachher: Das ausgewählte Wort `Lernerfolgskontrolle` wurde direkt im offenen Editor durch `Test` ersetzt; die Zeichen waren auf der Canvas-Vorschau sofort sichtbar. Ersetzen von `Heute` durch `Schnell` und sofortiges Escape sowie Auswahl und sofortiges Löschen von `Schnell` mit Escape zeigten die endgültige Fassung ohne Platzhalter. Die direkte Ebene blieb während der Eingabe vorhanden und war nach der Übergabe verschwunden. Undo/Redo und Seitenreload erhielten den Inhalt. Beim vollständigen Seitenreload ist während der anfänglichen PNG-Rekonstruktion weiterhin kurz der Engine-Platzhalter zu sehen; diese Ladephase ist von der laufenden Bearbeitung getrennt.
- Checks: 216 App-Tests, 56 Live-Tests einschließlich Transparenz der öffentlichen Rich-Text-Projektion, App- und Live-Typprüfung sowie beide Produktionsbuilds grün. Hardware-Latenz, Touch/Stift und lange IME-Komposition offen.

## Rich-Text-Mausauswahl – 13. September 2026 (D-165)

- Prüfstand: Chrome/macOS, `1091 × 1055` CSS-Pixel, dunkle Surface-Lab-Shell, isolierte Kopie der Physik-Teststunde unter `output/text-editor-validation-2026-09-13/archive`; aktives Unterrichtsarchiv unverändert.
- Negativbefund vor Korrektur: Auf gemischt ausgerichtetem Formtext wählte Doppelklick auf `Motoren` nur `•`; Ziehen über `Antrieb` ergab eine leere Auswahl. Nach teilweiser Vergrößerung im freien Text traf Doppelklick auf das sichtbare `erklären` `Zeile` darunter. Einfacher, einheitlich formatierter freier Text funktionierte bei Wort, Zeile und Mehrfachauswahl.
- Nach Korrektur: Doppelklick auf Form-`Motoren` wählt `Motoren`; Zug über `Antrieb` wählt die sichtbaren Zeichen; ein Mehrabsatzzug von `Vorbereitung` bis in `Antrieb` trifft die dazwischenliegenden Zeilen. Doppelklick auf vergrößertes freies `erklären` wählt `erklären`. Die Palette bleibt beim Öffnen auf der Auswahl; Teilfarbe und Unterstreichen auf `Antrieb` bleiben nach Escape und Reload sichtbar. Änderung einer anderen Teilfarbe wurde per Undo entfernt und per Redo wiederhergestellt.
- Beim Ersetzen eines formatierten Wortes fiel zunächst die fortlaufende Eingabe nach dem ersten Buchstaben auf den Folgestil zurück; D-165 korrigiert die Stilübernahme. Die anschließende Browserprüfung mit `verstehen` zeigte die gesamte Ersatzspanne groß und unterstrichen. Regressionstests sichern diese Grenze sowie die Übertragung alter Umbruchspannen.
- Schneller Neuerstellungsweg: Mit `Text` frei `Hallo Welt` und eine zweite Zeile eingegeben, `Welt` im nativen Feld markiert und die bei Bedarf geöffnete Palette für Unterstreichen verwendet. Die sichtbare Auswahlebene erschien unmittelbar nach der ersten Teilformatierung; `Welt` blieb ausgewählt.
- Checks zum damaligen Stand: 216 App-Tests, 55 Live-Tests, App- und Live-Typprüfung sowie beide Produktionsbuilds grün. Das damals beim schnellen Rich-Text-Neuzeichnen sichtbare native Bild-Platzhaltersymbol wird in D-166 behoben. Touch, Stift, Rotation, lange IME-Komposition und das Verhalten auf echter Zielhardware sind mit diesem Desktop-Maustest nicht bestätigt.

## Pencil V2 – 5. September 2026 (D-100)

- Hypothese: Gleichmäßige dünnere Ink-Linie mit nativen runden Enden wirkt sauberer als die bisherige simulierte Druckvariation. Keine Brushtextur oder zusätzliche Positionsfilterung; native lokale Glättung bleibt.
- Prüfstand: Chrome/macOS, isolierte Archivkopie auf Port 5184; aktives Unterrichtsarchiv unverändert. `review/pen.html` vergleicht sechs identische synthetische Gesten (leichter Jitter, S-Kurve, Kreis, Richtungswechsel, Rückwärtsübermalen, Tap) mit alter Drucksimulation und neuer Monoline in nativen Hell-/Dunkel-Exports. V2 wirkt sichtbar feiner und gleichmäßiger, Umkehr erzeugt keine Dickenblöcke. Absichtliche scharfe Richtungswechsel bleiben erkennbar statt automatisch weichgebügelt.
- Native Renderprüfung: SVG-Kontur jedes Testzugs vor/nach JSON-Restore identisch, einschließlich Tap. Maus-Kernflow: Zeichnen auf PDF-Raster, einzelnes Undo/Redo, einfacher Auswahlrahmen, unabhängiges Verschieben des Strichs, Wechsel zu Marker, erneutes Laden bestanden.
- Automatisiert: 174 App-Tests einschließlich neuer Breiten-, Druck-, Endpunkt-, Stillstands-, Ereignisraten-/Zoom- und HTML-Projektionstests; 30 Live-Tests, App-Typprüfung und Produktionsbuild grün. Bestehende Bundlegrößen-/Dynamic-Import-Warnungen bleiben. Der zuvor protokollierte separate Live-Timingfehler tritt im Abschlusscheck nicht mehr auf; Live-Code in diesem Pencil-Auftrag unverändert.
- Architektur: `useInkInput.ts` und `stroke-sampling.ts` ersetzen die markerbenannten Eingabedateien; Markerabstand und Geometrie bleiben unverändert. Ink speichert nur native Freihandgeometrie, konstante Druckwerte und Versionsmetadaten. HTML-Annotierungen nutzen dieselbe native Kontur. Keine Migration von Altstrichen.
- Offen: iPad 9 mit Finger, Legamaster/Stift, langes Schreiben und reale End-to-End-Latenz. Kein 60-fps- oder Hardwarefreigabeversprechen. Bewusst vorerst keine Druckdynamik für aktive Stifte, Formenerkennung oder neue Brushes.

## Marker-Feinschliff – 5. September 2026 (D-099)

- Hypothese: Leicht nachgiebige Filzspitzenwirkung durch weichere Ecken und begrenzte Mitdrehung, ohne zusätzlichen Positionsfilter. Bestehende Kurvenglättung bleibt unverändert.
- Geometrie: zwölf Eck-/Rundungsvertices statt vier harter Ecken; vier lange flache Kanten bleiben. Winkelgrundstellung −40°, Abweichung maximal ±5°, distanzbasierte Orientierung über 1,5 Markerbreiten. Richtungsachse statt gerichteter Tangente verhindert 180°-Flips. Ruhende Spitze wird nicht zeitgesteuert nachgedreht. Gestenlokaler Cache speichert die abgeschlossene Orientierung; Live-Ende verändert diesen Zustand nicht.
- Prüfstand: Chrome/macOS, isolierte Archivkopie auf Port 5184; nativer Exportvergleich normal/breit in Hell/Dunkel sowie Zeichnen auf PDF-Raster und Ein-Schritt-Undo. Wirkung subtil weicher, keine zusätzliche Textur. 169 App-Tests und Typprüfung/Build grün. Live-Suite weiterhin 25/26: der bereits dokumentierte unabhängige Scheduler-Timingtest ist noch rot; Live-Code unangetastet.
- Reproduzierbare Geometrieläufe wie D-097, je 3.000 Eingaben/375 Updates: lokaler Kritzel p95 0,92 ms, max 5,31 ms, 331 Konturpunkte; langer Wellenzug p95 3,01 ms, max 3,48 ms, 2.136 Konturpunkte. Einzelmessung, kein Beleg für universelle Verbesserungen. 5.000-Sample-Zufallskritzel stabil; Tests sichern Winkelgrenze, Streckenunterteilung, Richtungsumkehr, Frame-Bündelung und Innenlöcher.
- Altmarker bleiben unverändert; nur neue Züge erhalten Geometrieversion 4. iPad-/Legamaster-Latenz und Gefühl weiterhin offen. Kein erneutes Voll-App-Framebenchmark in dieser Verfeinerung.

## Highlighter V2 – 5. September 2026

- Hypothese: Eine feste endlich dicke Meißelspitze mit direktem Strichende wirkt bewusster als das mitdrehende gleichbreite Band; keine zusätzlichen Effekte oder UI-Regler.
- Testumgebung: lokaler Chrome/macOS, Vite auf 5184 mit `TAFELRAUM_ARCHIVE_ROOT_URL` auf einer getrennten `/tmp/tafelraum-marker-0GvrBX/archive/`-Kopie. Aktives Archiv und laufender Live-Dienst unverändert.
- Visuell: `review/marker.html` rendert dieselben synthetischen Pfade in normal/breit und Hell/Dunkel über Excalidraws nativen Export. Schräge Enden und richtungsabhängige Kurvenbreite sind erkennbar; keine XOR-Löcher beim Übermalen. Native UI: neuer Zug auf Arbeitsblatt, Ein-Schritt-Undo/Redo, einfache Auswahl ohne Polygonpunkte, individuelles Verschieben und erneutes Laden bestanden.
- Regressionen: 168 App-Tests, App-/Live-Typprüfung und Produktionsbuild grün. Die Live-Suite bestand zunächst vollständig; beim Abschluss sind nach paralleler Schedulerarbeit 25/26 grün. `live-host.test.ts:262` erwartet keine Veröffentlichung nach 32 ms; `live-host.ts` berechnet inzwischen die verbleibende Wartezeit aus `lastInspectionAt` und darf früher veröffentlichen. Diese Dateien wurden im Markerauftrag nicht geändert. Bestehende Bundlegrößen-/Dynamic-Import-Warnungen bleiben. Neue Tests vergleichen 1/4/60/240 Eingabeunterteilungen einer Geraden, 1/8/32-Sample-Framebündelung eines gewellten Pfads, direkte Spitze vor dem ersten Abtastpunkt und tatsächliche Meißelbreite. 5.000-Sample-Zufallskritzel bleibt stabil.
- Geometriebenchmark (Node, jeweils 3.000 Eingaben / 375 Updates, Breite 17): enger periodischer Kritzel 1.105 stabile Samples / 381 Konturpunkte, p95 etwa 1,98 ms, max 5,23 ms; 1.200 Einheiten langer Wellenzug 524 Samples / 2.102 Konturpunkte, p95 2,99 ms, max 4,92 ms. Einzellauf, keine universelle Obergrenze.
- Vollständiger Pfad: `review/marker-performance.html` lädt die echte App und beobachtet ausschließlich rAF-Abstände während echter Pointergesten einschließlich Commit. Zwei kurze CUA-Mauszüge zeigten 10–11 Frames, maximal 39–40 ms und 2–3 Abstände über 25 ms. Das umfasst Surface/Engine/Browser, isoliert keine einzelne Ursache und misst nicht Input-to-photon. Ein stabiles 60-fps-Versprechen ist damit ausdrücklich nicht belegt.
- Feinjustierung: `stroke-sampling.ts` (bis D-100 `marker-sampling.ts`) enthält Abstand und Eckschwelle, `marker-stroke.ts` Spitzenwinkel, Dickenverhältnis, horizontale Kalibrierung und lokale Glättung. Keine zweite produktive Altimplementierung; vorhandene Altmarker bleiben als gespeicherte Polygone unverändert.
- Offen: echte Fingerzüge auf iPad 9, Legamaster/Stift, lange freie Kurven bei verschiedenen Zoomstufen und Live-Last. Desktopwirkung ist positiv; Hardwarefreigabe bleibt offen.

## Marker-Auswahl – visuelle Korrektur am 5. September 2026

- Nutzerbefund: Die Auswahl eines langen Markerbands zeigte jeden technischen Konturpunkt als weißen/violetten Griff und überlagerte den Inhalt mit einer dichten Punktwolke.
- Ursache: Das native Markerpolygon verwendet bewusst den Excalidraw-Typ `line`; die Engine aktivierte deshalb bei normaler Auswahl ihren Linieneditor für sämtliche vereinigten Konturpunkte.
- Korrektur: Nur für `customData.role = marker-ribbon` wird der flüchtige Linieneditor nach Auswahl zurückgesetzt. Begrenzungsrahmen, vier Größenpunkte und Drehgriff bleiben erhalten. Der ebenfalls unpassende native Punktbearbeitungshinweis wird ausschließlich in diesem Auswahlzustand verborgen. Elementdaten, Trefferfläche, Verschieben, Skalieren, Drehen, Undo und Persistenz bleiben unverändert.
- Prüfung: isolierter echter Chromium-Canvas im dunklen Theme mit neu gezeichnetem und nach Reload erneut ausgewähltem Marker; keine inneren Punkte und kein Linienhinweis, Auswahlrahmen und Drehgriff sichtbar. Normale Linien-/Pfeillogik ist von der Rollenprüfung ausgenommen. Keine Änderung am aktiven Archiv; Touch-/Stiftwirkung bleibt offen.

## Marker-Langzug – Performancekorrektur am 5. September 2026

- Nutzerbefund: langes Halten und Malen auf engem Raum wurde schnell spürbar träge.
- Ursache: Der erste D-088-Cache vermied einen Teil der Polygon-Union, erzeugte und serialisierte aber Glättung, Teilflächen und Cache-Signaturen der gesamten Rohspur in jedem Animationsbild erneut. Eine einzelne kalte 5.000-Punkte-Geometrie benötigte im reproduzierten Node-Test rund 12,1 Sekunden; enge Zufallskritzel konnten zusätzlich einen Rundungsfehler der Clipping-Sweepline auslösen.
- Korrektur: Ein gestenlokaler fortlaufender Builder schließt nur Kurvenabschnitte ab, deren Folgepunkt bekannt ist. Neue coalesced Pointer-Samples werden pro Renderbild gebündelt mit der fertigen Fläche vereinigt; die kleine bewegliche Endfläche bleibt flüchtig. Shift-/Halte-Begradigung verwendet eine getrennte Vorschau und verwirft den Freihandfortschritt nicht. Zwischenunionen werden subpixelgenau normalisiert.
- Prüfung: deterministisches enges 5.000-Punkte-Kritzel als Regression, native Evenodd-/Kreisloch-/Cachetests, Typprüfung sowie Browservergleich auf Weiß und Graphit. Ein zusätzlicher 12.000-Sample-Lauf lag bei durchschnittlich 1,86 ms und maximal 8,19 ms je Aktualisierung bei acht Samples pro simuliertem Frame; kein Clippingfehler. Im isolierten echten Canvas blieb Zeichnen und Ein-Schritt-Undo korrekt, ohne Browserfehler. Keine Änderung am aktiven Archiv.
- Grenze: Das ist eine Desktop-/Node-Messung, keine Legamaster-Freigabe. Echte Stiftfrequenz, Palm Rejection und die kombinierte 2×-Canvaslast bleiben auf der Zielhardware zu messen.

## Marker-Selbstüberschneidung – Korrektur am 5. September 2026

- Nutzerbefund: mehrfaches Hin-und-her-Malen spart dunkle Dreiecke aus und wirkt wie eine Farbinvertierung. Der erste Marker-Vergleich vom Vortag hat starke Selbstüberschneidungen nicht ausreichend abgedeckt.
- Ursache: RoughJS/Excalidraw füllt native Polygone mit `evenodd`; die ungeprüfte selbstüberschneidende Bandkontur verhält sich dadurch wie eine XOR-Fläche. Ein reiner Nichtnull-Treffertest konnte den Renderfehler nicht erkennen.
- Korrektur: einfache Flächen je Teilbewegung und geschlossene Kurvenanschlüsse werden vor dem Rendern vereinigt. Ein gestenlokaler hierarchischer Union-Cache hält unveränderte Teilflächen; er wird nicht gespeichert. Echte Löcher innerhalb von Kreisen bleiben erhalten. Absichtliche Umkehrpunkte werden nicht mehr durch die Kurvenglättung abgeschnitten.
- Prüfung: Regressionen für mehrfaches exaktes Zurückfahren, Kreuzungen, echten Kreisinnenraum und Cachegleichheit nach Weiterzeichnen/Begradigen. `/review/marker.html` enthält zusätzlich den wiederholt übermalten Pfad; native PNG-Ausgabe in Chrome auf Weiß und Graphit geprüft, ohne die bisherigen Aussparungen. Keine Änderungen am aktiven Archiv.
- Grenze: Bestehende fehlerhafte Konturen bleiben unverändert; die ursprüngliche Eingabespur ist nicht gespeichert. Neue Striche verwenden die korrigierte Geometrie. Reale Stift-/Touchvalidierung bleibt offen.

## Markerband – Desktopprüfung am 4. September 2026

- Gerät/Eingabe: Mac, Chrome, gesteuerte Maus; kein Stift-/Touch-Nachweis.
- Isolation: eigener Vite-Port 5184, vollständige temporäre Archivkopie; aktive Unterrichtsdaten bleiben unberührt.
- Aufgabe: Textzeile auf einem Arbeitsblatt markieren; mehrere unabhängige Züge zeichnen; einen Zug rückgängig machen und wiederholen; Marker radieren; Markierung auswählen und innerhalb des Blatts verschieben; Seite neu laden.
- Beobachtung: Flache schräge Enden, konstante Breite und 32 Prozent Deckkraft wirken ruhiger als der bisherige drucksimulierte Rundmarker. Text bleibt besser lesbar, wird bei normalem Alpha aber weiterhin leicht eingefärbt. Native Auswahl aus der gefüllten Mitte, Einzelverschiebung, Papierverbund, Radierer sowie Reload wurden geprüft. Die API-Vorschau benötigte einen expliziten Abschluss als native Einfügeaktion, damit Undo/Redo genau einen Strich behandelt.
- Exportprüfung: `/review/marker.html` rendert synthetische gerade, wellige, kreisförmige und abknickende Pfade mit dem echten Excalidraw-PNG-Export bei zweifacher Auflösung. Vorher/Nachher auf Weiß und Graphit visuell geprüft; keine runden Endknubbel oder Druckverdickung beim neuen Band. Glättung und Begradigungskriterium sind zusätzlich rein getestet.
- Entscheidung: Richtung für Desktop beibehalten. Keine künstliche Körnung, kein Glow. Echter materialabhängiger Multiply-/Screen-Modus bleibt ein separater Engine-Prüfpunkt; 32 Prozent Alpha nicht als solchen ausgeben.
- Offen: reale Haltegeste, Stiftlatenz, Palm Rejection, Mehrfinger-Pan und Langstrichperformance auf der Zielhardware. Die gesteuerte Browsermaus prüft normale Drags, nicht das Gefühl einer gehaltenen Stiftspitze.

## Desktop-Smoke-Test vor dem Hardwaretest – 30. August 2026

- Prototyp: Excalidraw-Baseline in `prototypes/surface-shell-a-b`
- Gerät: Mac-Entwicklungsumgebung
- Browser: Chromium im In-App-Browser
- Eingabe: simulierte Maus-/Pointereingabe; kein Touch- oder Stiftnachweis
- Testmaterial: Means of transport, Leitfrage und Transport-Illustration

| Prüfpunkt | Ergebnis | Beobachtung |
|---|:---:|---|
| Hand/Pan und Fit-to-content | △ | Kamera lässt sich verschieben und anschließend ruhig auf Inhalt zurückführen. Der native Cursorpfad funktioniert in Chrome: Leertaste zeigt die offene Hand, beim Drag folgt die geschlossene Hand und das zuvor gewählte Werkzeug bleibt erhalten. In Safari verschwindet der native Cursor bei gedrückter Leertaste und ruhender Maus bis zur nächsten Mausbewegung. Ein zusätzlicher Lucide-/DOM-Cursor wurde im direkten Nutzertest verworfen, weil er die native Hand doppelt beziehungsweise sichtbar ersetzt und damit unsauber wirkt. Tafelraum rendert deshalb bewusst keinen Ersatzcursor und blendet den Systemcursor nicht aus; die Safari-Abweichung bleibt als Browsergrenze vorläufig akzeptiert. Touch- und Stiftverhalten bleiben separat am Legamaster zu prüfen. |
| Handwerkzeug beim Start | ✓ | Beobachteter Zustandsversatz behoben: Die Shell zeigte zunächst `Hand`, während Excalidraw nach dem asynchronen Laden noch auf seinem Standardwerkzeug stand. `Hand` wird nun bereits im initialen Enginezustand gesetzt und ist bei Kaltstart sowie Reload ohne vorherigen Werkzeugwechsel aktiv. |
| Desktop-Werkzeugkürzel | ✓ | `S`, `U`, `R`, `T`, `F` und `V` wählen Stift, Marker, Radierer, Text, Form und Auswahl über denselben Shell-zu-Canvas-Pfad wie die Werkzeugleiste. Leertaste bleibt temporäres Pan; `P` aktiviert keinen verborgenen Engine-Pinsel. Tooltips und `aria-keyshortcuts` machen die Belegung auffindbar, ohne dauerhafte Zusatztexte. Text-/Formulareingaben und Kombinationen mit Systemmodifikatoren sind ausgenommen. |
| Hand → Auswahl per Doppelklick | ✓ | Im Handmodus wählt ein Doppelklick den kommentierten Bildverbund sowie einen einzelnen Markerstrich aus und synchronisiert die sichtbare Werkzeugleiste auf `Auswahl`. Doppelklick auf freie Fläche lässt den Handmodus unverändert. Desktop-Maus geprüft; Touch- und Stiftgeste sind damit nicht festgelegt. |
| Doppelklick und Textbearbeitung | ✓ | Die alte Handmodus-Regel wählte auch freie Texte zunächst nur aus und verlangte danach einen zweiten Doppelklick. Im isolierten Chromium-Flow ist die Reibung reproduziert und entfernt: Ein Doppelklick auf vorhandenen Text oder eine normale Grundform öffnet nun aus `Hand` und `Auswahl` unmittelbar den nativen Editor. Dasselbe gilt für Textannotation auf einem Bild oder einer PDF-Seite: Der kurze Pointerpfad bleibt für den nativen Doppelklick offen, während ein echter Drag weiterhin nur die Annotation innerhalb ihres Materialverbunds verschiebt. Audio-/YouTube-/Web-Einbettungen, Bilder, Freihand, technische Abdeckungen und bereits versehentlich an Audio gebundener Text bleiben blockiert. |
| Audioplayer auswählen und bedienen | ✓ | Ein einzelner realer Klick auf eine neutrale Stelle der Playerfläche wechselte bei `50 %` Zoom unmittelbar von `Hand` zu `Auswahl`. Direkt danach reagierten Play/Pause sowie die Zeitleiste weiterhin beim ersten Klick und ließen den Auswahlzustand bestehen; es entstand kein Texteditor und kein Browserfehler. Die gesamte nicht-interaktive Fläche ersetzt damit die zuvor zu schmale Titelzone als Auswahl- und Dragziel. Realer Drag sowie Touch und Stift bleiben separat zu prüfen. |
| Titel und Edit-Icon | ✓ | Das Stifticon folgte wegen einer groben `ch`-Schätzung mit zu viel Abstand. Das Feld verwendet nun seine reale Inhaltsbreite; kurzer, initialer und langer Titel wurden ohne Überlagerung geprüft. |
| Kopfzeilen-Utilities | ✓ | Der Speicherstatus ist durch genau eine Linie von der kompakten Utility-Gruppe getrennt. Im Development-Modus folgt sie der Reihenfolge Theme → Vollbild → Reset; ohne Development-Modus bleibt nur Vollbild. Vollbild und Reset sind transparente 48-Pixel-Iconziele ohne permanenten Buttonhintergrund. Dunkles und helles Theme, beide Modi sowie Ein- und Austritt aus dem Browser-Vollbild wurden ohne Browserfehler geprüft. |
| Auswahl und Verschieben | ✓ | Shift-Klick erweitert die bestehende Auswahl. Zwei Formen ließen sich durch Drag auf eine der Formen gemeinsam verschieben. Im materialkritischen Fall blieben eine Form und der kommentierte Bildverbund auch dann gemeinsam ausgewählt und bewegten sich pixelgleich, als der Drag direkt auf dem Bild begann; ein drittes nicht markiertes Element blieb stehen. Die materialbezogene Pointer-Korrektur überspringt dafür bereits ausgewählte Elemente und ersetzt Excalidraws Mehrfachauswahl nicht mehr. Desktop-Maus geprüft. |
| Bild und Annotationen verschieben und drehen | ✓ | Marker, Text und Rechteck auf dem Bild wurden beim Abschluss ihrer Erstellung als Materialverbund gruppiert und gemeinsam verschoben sowie über den runden Eckgriff gedreht. Ein außerhalb erzeugter Marker blieb auch nach dem Verschieben über das Bild unabhängig; die zuvor beobachtete nachträgliche Zuordnung anhand bloßer Überlappung wurde entfernt. Werkzeugwechsel zum Radierer und zurück sowie Reload erhielten die exakte Zugehörigkeit. Undo/Redo nahm jeweils die gesamte Transformation zurück. Excalidraw zeichnet zusätzlich seinen kleinen nativen Rotationspunkt oben mittig; diese Baseline-Eigenheit wurde nicht per Overlay oder Engine-Hack kaschiert. |
| Bild fokussieren | ✓ | Hover-Auge ohne vorherige Auswahl aktiviert die pointerdurchlässige Abdunklung. Hand-/Leertaste-Pan, Zoom, Zentrieren und `Inhalt finden` verändern ausschließlich die Kamera und lassen den Fokus stabil bestehen; erst echte Abwahl, Wechsel des Fokusziels, `Escape` oder erneuter Augenklick lösen ihn. Auge und Drehgriff überlagern sich nicht. Hell und Dunkel geprüft. |
| Bild zuschneiden | △ | Die erste native Variante von `Ränder trimmen` verlangte beim Mausdrag ein zu exaktes Treffen der schmalen Crop-Linie. Sie wurde durch einen bildgebundenen Rahmen ersetzt, dessen vollständige Kanten 36 Pixel tiefe Trefferzonen und dessen Ecken 44-Pixel-Felder besitzen, während die sichtbaren Griffe kompakt bleiben. Alle acht Bereiche und der aktive Zustand sind im Browser zugänglich und visuell geprüft; der präzise reale Mausdrag, Reload sowie Touch und Stift bleiben im Praxisflow offen. |
| Material drucken | △ | Das Lucide-Druckericon erscheint im Hand- und Auswahlmodus als kontextuelle 40-Pixel-Hover-Aktion. Gemessene rund 3,1 Sekunden bis zur Rückkehr des Druckaufrufs lagen auch ohne erneutes Excalidraw-Rendering bei rund 3,05 Sekunden und entstehen damit überwiegend im nativen Chromium-Druckdialog. In Safari verzögerte der unsichtbare iframe den sichtbaren Druckstart im realen Einsatz sogar um mehr als zehn Sekunden. Unverändertes Rastermaterial wird direkt übergeben; Safari verwendet nun eine sofort sichtbare vollflächige Materialvorschau im Hauptdokument und druckt von dort, Chromium behält den isolierten Frame. Während der Browserlaufzeit bleibt `Druck wird geöffnet` sichtbar und weitere Klicks sind gesperrt. Der Chromium-Browserlauf erzeugte ausschließlich das Rastermaterial ohne App-Chrome: waagerecht mit A4-Querformat und nach einer Vierteldrehung mit A4-Hochformat. Der isolierte Safari-Strategietest mit dem echten 1,5-MB-Transportmaterial bestätigte die sofortige vollflächige Vorschau ohne App-Chrome; der native Safari-Systemdialog und die Druckerauswahl müssen noch einmal am real verwendeten Setup bestätigt werden. PDF-Seiten verwenden im Surface Lab weiterhin ihre lokale PNG-Rendition. |
| Materialschatten | △ | Fünf Rastermaterialien wurden im lokalen Chromium-Browser mit dem standardmäßig aktiven Schatten geprüft. Der Schalter `Materialschatten` entfernte alle Effektflächen unmittelbar, blieb nach Reload ausgeschaltet und ließ sich wieder aktivieren. Zoom von `80 %` auf `90 %`, Pan und freie Rotation führten Geometrie und Winkel synchron mit; Undo nahm die Testrotation vollständig zurück. Hell und Dunkel verwenden getrennte zurückhaltende Schattenwerte, die Konsole blieb fehlerfrei. Wirkung und Renderkosten bei vielen Seiten bleiben am Legamaster offen. |
| Renderdichte bei Browser-Skalierung | ✓ | Nach einem ersten 1×-Vergleich blieb die Darstellung in der Nutzerprüfung sichtbar zu rau. Bei gemeldetem Displayfaktor `0,8` rendert der 1600 × 832 CSS-Pixel große Excalidraw-Canvas deshalb nun mit 3200 × 1664 Renderpixeln. Stiftzug, Canvaszoom, Auswahlkoordinaten und Bildfokus blieben funktionsfähig. |
| Zoomdiagnose | ✓ | Die Development-Kontrolle sitzt mit 18 Pixeln Abstand unten rechts. Minus und Plus wurden bei `60 %`, `70 %`, `80 %`, `90 %`, `100 %` und `130 %` geprüft; der Prozentwert setzt auf `100 %` zurück. Bei rechts angedockter Werkzeugleiste steht sie mit 12 Pixel Abstand unmittelbar links daneben und teilt deren Unterkante; Undo/Redo folgen oben demselben Abstand. Bei `60 %` bleiben feine Rasterdetails sichtbar begrenzt; die relevante Qualitätsschwelle muss im Nutzer- und Legamaster-Test festgehalten werden. |
| Stift und Marker | △ | Beide erzeugen getrennte Striche; Marker ist gelb und transparent. Das gemeinsame Werkzeug-Popover bietet für beide unabhängig `Fein`, `Normal`, `Breit` und `Sehr breit`; `Normal` bewahrt die bisherigen Enginewerte. Alle Ziele messen im Chromium-Flow 48 CSS-Pixel, Bottom- und Right-Docking sowie Hell/Dunkel sind visuell geprüft. Die reale Strichwirkung, Fehlwahlquote und Bedienung mit USB-Stift und Touch bleiben am Legamaster offen. |
| Radierer | ✓ | Einzelnen Markerstrich auf dem gruppierten Bild entfernt; das darunterliegende Bild blieb erhalten und die verbleibende Annotation wurde beim Werkzeugwechsel wieder mit dem Material bewegt. Reload während des Radiermodus stellte den normalen auswählbaren Materialzustand wieder her. |
| Text | ✓ | Text direkt auf der Fläche eingegeben und abgeschlossen. |
| Rechteck, Ellipse und Raute | ✓ | Alle drei Grundformen über die kontextuelle Formauswahl erzeugt. |
| Formfüllung und Grundfarben | ✓ | `Ohne Füllung`, echte transparente Füllung und `Deckend` sind als getrennte native Enginezustände erreichbar. Blau, Grün, Gelb, Koralle und Neutral lassen sich direkt für neue sowie eine ausgewählte bestehende Form setzen; Kontur und Füllung folgen derselben Farbe. Vertikale und horizontale Werkzeugleiste sowie die Kontextpalette wurden in Hell und Dunkel geprüft. Hardwarewirkung bleibt offen. |
| Undo/Redo | ✓ | Radieren sichtbar rückgängig gemacht und wiederholt. |
| IndexedDB-Reload | ✓ | Ergänzte Elemente und Löschung blieben nach Reload erhalten. |
| Reset der Teststunde | ✓ | Bestätigung stellt Leitfrage und Originalbild wieder her; Reload bleibt sauber. |
| Hell/Dunkel | ✓ | Identischer Inhalt in beiden Themes; Originalbild wird nicht invertiert. |
| Toolbar-Docking | ✓ | Per Drag von unten nach links und wieder zurück nach unten eingerastet. |
| Browserfehler | ✓ | Keine Console-Errors im geprüften Kernflow. |

Offen und entscheidend: echter Legamaster-Test mit USB-Stift, Touch, Palm Rejection, Zielauflösung, Skalierung und Renderperformance. Die Desktopprüfung ist nur ein technischer Smoke-Test und keine Produktentscheidung für eine Dockseite oder Canvas-Engine.

## Testkopf

- Datum:
- Prototyp/Commit:
- Gerät:
- Bildschirm/Größe/Auflösung:
- Betriebssystem:
- Browser:
- Eingabe: Maus / Finger / aktiver Stift / passiver Stift:
- getestete GUI-Variante: A unten / B links / Kombination:
- Testmaterial:

## Aufgaben

| Nr. | Aufgabe | Geschafft? | Reibung/Fehler | Beobachtung |
|---:|---|:---:|---|---|
| 1 | Teststunde öffnen |  |  |  |
| 2 | Zur Transport-Illustration navigieren |  |  |  |
| 3 | Zwei Begriffe mit Stift ergänzen |  |  |  |
| 4 | Einen Begriff markieren |  |  |  |
| 5 | Rechteck um ein Element setzen |  |  |  |
| 6 | Kommentiertes Bild verschieben und skalieren; Annotationen bleiben am Material |  |  |  |
| 7 | Mit Finger/Hand zu freier Fläche navigieren |  |  |  |
| 8 | Arbeitsanweisung als Text ergänzen |  |  |  |
| 9 | Aktion rückgängig machen |  |  |  |
| 10 | Vollbild/Reload/Zustand wiederfinden |  |  |  |

## Eingabeverhalten

- Stift schreibt zuverlässig:
- Finger navigiert zuverlässig:
- Palm Rejection:
- unbeabsichtigte Gesten:
- Latenz:
- Auswahl/Resize auf Touch:
- Radierer:
- Browsergesten oder Betriebssystemkonflikte:

## GUI-Beobachtungen

- zuerst gesuchtes Werkzeug:
- übersehene Funktion:
- unverständliches Symbol:
- zu kleines Ziel:
- schlecht erreichbares Ziel:
- verdeckter Inhalt:
- störende oder unnötige Information:
- fehlende Rückmeldung:

## Stärkste Reibungspunkte

1.
2.
3.

## Positive Beobachtungen

1.
2.
3.

## Entscheidung

- [ ] Oberfläche in dieser Richtung weiterführen
- [ ] mit klar benannten Änderungen erneut testen
- [ ] Grundannahme oder Canvas-Engine verwerfen

Begründung:

## Nächste Iteration

Nur die drei wichtigsten Änderungen:

1.
2.
3.

Nicht jetzt lösen:

-
