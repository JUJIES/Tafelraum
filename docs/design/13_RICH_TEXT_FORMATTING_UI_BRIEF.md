# UI Brief – Textformatierung und verschiebbare Palette

**Stand:** 13. September 2026  
**Status:** D-182: Formtext behält seine Höhenlage beim Editierwechsel; Touchwirkung auf Zielhardware offen

## Kontext

- **Oberfläche/Zustand:** freier oder an eine Form gebundener Canvastext in der Surface-Lab-Shell
- **Zielnutzer:** Lehrkraft bei der schnellen Unterrichtsdurchführung und bei der Unterrichtsvorbereitung
- **Primäre Handlung:** Text schnell bearbeiten oder bei Bedarf ein Objekt beziehungsweise eine Textstelle gezielt formatieren
- **Designfrage:** Bleiben die häufigen Textaktionen erreichbar, ohne Unterrichtsinhalt mit der gesamten Palette zu verdecken?

## Scope

- Die Auswahl des gesamten Textobjekts formatiert den gesamten Text. Eine Auswahl im Texteditor formatiert nur die markierten Zeichen; Ausrichtung betrifft die berührten Absätze.
- Bei formgebundenem Text richtet `Textblock oben/mittig/unten` den gesamten Block innerhalb der Form aus, unabhängig von einer Zeichenmarkierung. Die Ausrichtung bleibt beim Wechsel zwischen Ansicht und Editor stabil.
- Farbe, Kursiv, Unterstreichen und Durchstreichen sind für eine Zeichenauswahl erreichbar. Schrift, Größe und Ausrichtung folgen derselben Auswahlregel, soweit das Textmodell die Eigenschaft trägt.
- Bei ausgewähltem oder bearbeitetem Text stehen drei runde Objektbuttons in einer Gruppe: `Text bearbeiten`, `Textgestaltung öffnen` und die bereits vorhandene Aktion `Abdeckung hinzufügen` beziehungsweise `Abdeckung entfernen`. Es gibt keine zweite kompakte Textleiste. Die vollständige Palette erscheint erst nach dem Öffnen und lässt sich über denselben Objektbutton wieder einklappen. Beim Wechsel des Textobjekts beginnt der Zustand wieder geschlossen.
- Die Objektbuttons nutzen die vorhandene Platzierungslogik der Canvas-Schnellaktionen. Ihre Dreiergruppe steht in einer Zeile oberhalb oder unterhalb der Textfläche, niemals seitlich über sichtbaren Zeichen. Bildschirmrand, Hauptwerkzeugleiste und geöffnete Palette beeinflussen die Wahl der Seite.
- Bei freiem Text im Editiermodus ist die sichtbare gepunktete Schreiblinie der Anker der Dreiergruppe. Seit D-193 behält das native Eingabefeld seine echte Textbreite, damit die Engine-Transformation bei anderem Zoom nicht springt. Nur die Platzierung der Aktionsgruppe reserviert mindestens die Breite ihrer drei Buttons plus Rand; längerer Text erweitert diesen Platz. Formgebundener Text behält die Platzierung außerhalb der Form.
- Die Palette verwendet einen eigenen, mindestens 48 Pixel großen Drag-Griff. Ihr verschobener Platz bleibt während der Bearbeitung erhalten; ein neues Textziel erhält wieder eine passende Ausgangsposition.
- Schrift und Größe stehen zusammen; Absatzaktionen und Zeichenaktionen sind getrennt gruppiert. Die Palette darf sich über zwei kurze Zeilen verteilen.
- Kein permanenter Eigenschafteninspektor, keine zusätzliche Werkzeugleiste und kein frei editierbarer HTML-/Websiteimport.
- Im Bearbeitungsmodus liegen Markierung und Cursor über den sichtbaren Zeichen. Sie nutzen dieselbe Zeilenberechnung wie die abgeleitete Rasterfassung; das native Eingabefeld hält weiter Tastatur, Zwischenablage und Undo. Auswählen erfolgt direkt auf dem sichtbaren freien oder formgebundenen Text.
- Ein Doppelklick in freien oder formgebundenen Text markiert den vollständigen geschriebenen Absatz. Bei Aufzählungen gehört das Aufzählungszeichen dazu; ein automatischer Zeilenumbruch teilt den Punkt nicht. Das gilt bereits beim Doppelklick zum Öffnen des Editors und bei weiterem Doppelklick im Editor. Mit Alt/Option plus Doppelklick bleibt die gezielte Wortauswahl erreichbar; einfacher Klick und Ziehen behalten ihre Cursor- und Bereichsauswahl.
- Ein automatisch umbrochener Aufzählungspunkt verwendet einen hängenden Einzug: Folgezeilen beginnen unter dem Text nach `• `, nicht unter dem Aufzählungszeichen. Das gilt für freie und formgebundene Texte sowie für bereits gespeicherte einfache Aufzählungen. Der Text bleibt als Klartext im nativen Eingabefeld editierbar; die gemeinsame Zeilenberechnung steuert Anzeige und Auswahl.
- Beim Tippen und Löschen zeichnet dieselbe flüchtige Ebene den Text direkt. Nach Abschluss bleibt sie bis zur fertigen technischen Bildfassung sichtbar; die lokale Bildübergabe darf kein Platzhaltersymbol zeigen. Die Live-Projektion zeigt die aktuelle Textfassung unabhängig von der lokalen Bearbeitungs-Transparenz.
- Beim Wechsel von der Objektauswahl in die Bearbeitung bleiben Zeichenpositionen und automatische Zeilenumbrüche unverändert. Die abgeleitete Textgrafik wird erst nach Registrierung und Laden der benutzten Schriften erstellt; bei später eintreffender Schrift wird sie erneuert.
- Beim Öffnen bleibt die ruhende Textgrafik bis zum ersten fertig gezeichneten Vorschau-Frame sichtbar. Die Vorschau wird erst mit geladenen Schriften gezeigt, damit weder ein leeres Zwischenbild noch eine kurz andere Schrift auftritt.

## Text und Referenz

- Vorhandene Namen für Schrift, Größe, Ausrichtung, Aufzählung und Farbe bleiben bestehen.
- Neue zugängliche Namen: `Text bearbeiten`, `Textgestaltung öffnen`, `Textgestaltung schließen`, `Formatleiste verschieben`, `Rechtsbündig`, `Kursiv`, `Unterstreichen`, `Durchstreichen`, `Textblock oben`, `Textblock mittig`, `Textblock unten`; die Abdeckung behält ihre vorhandenen Namen.
- Die Iconbuttons verwenden die bereits eingebundene Lucide-Familie: `TextCursorInput` für Bearbeiten sowie `ALargeSmall` mit Chevron für Auf- und Zuklappen.
- Der bestehende Screenshot mit mehrzeiligem, zentriertem Text auf einer blauen Form ist die Referenz für verdeckte Textstellen.

## Abnahme

- Die Palette lässt sich am Griff aus dem Textbereich ziehen, ohne die Textauswahl zu verlieren.
- Bearbeiten sowie Öffnen und Schließen der Palette erhalten die bestehende Text- beziehungsweise Zeichenauswahl.
- Die drei Objektbuttons liegen in einer gemeinsamen Gruppe am Text; bei geöffneter Palette bleibt keiner von ihr verdeckt.
- Gesamtobjekt und Zeichenauswahl ergeben unterscheidbare, nach Reload und Undo stabile Resultate.
- Browserprüfung umfasst kleinen Viewport, Hell/Dunkel und mehrzeiligen Formtext. Touch und Stift bleiben am Legamaster zu prüfen.
- D-165 prüft zusätzlich per realem Mauszug und Doppelklick Wort, Zeile und mehrere Absätze bei gemischter Ausrichtung und Schriftgröße. Ein ausgewähltes Wort muss nach Formatieren, Ersetzen, Undo/Redo und Reload korrekt bleiben.
- D-167 prüft den Kursivbutton in derselben Gruppe wie Unterstreichen und Durchstreichen: ein markiertes Wort und ein ganzes freies Textobjekt müssen sich unabhängig formatieren und nach Undo/Redo sowie Reload erhalten bleiben.
- D-168 prüft einen kurzen freien Text nahe dem oberen Rand, mehrzeiligen Formtext und Text nahe der unteren Werkzeugleiste: Alle drei Buttons bleiben außerhalb der Schrift und erreichbar.
- D-169 prüft einfachen sowie teilweise formatierten Text: Der erste und ein weiterer Doppelklick wählen genau den getroffenen Absatz, ein Aufzählungszeichen gehört zur Auswahl, und ein umbrochener Absatz bleibt zusammen.
- D-170 vergleicht vor und nach dem Editierwechsel dieselben sichtbaren Glyphen und Umbrüche auf einer Form und in einem freien Textobjekt, sowohl nach dem Laden einer Stunde als auch über den Bearbeiten-Button.
- D-171 prüft leeren, längeren und wieder gekürzten freien Text: Die drei Buttons liegen unter der Schreiblinie, ihr mittlerer Button folgt deren Mitte; die Ausgangslinie lässt links und rechts etwas Raum. Eine Form zeigt ihre Aktionen weiterhin außerhalb der Textfläche.
- D-174 prüft den unmittelbaren Eintritt in den Editor bei Formtext und freiem Rich Text: Das ruhende Textbild bleibt bis zur gezeichneten Vorschau sichtbar; spätes Laden einer Schrift berechnet die Vorschaugeometrie neu.
- D-178 prüft lange Aufzählungspunkte während der Eingabe, nach Abschluss und nach Reload: Folgezeilen richten sich am Textanfang aus, normale Absätze bleiben unverändert und ein Doppelklick wählt weiterhin den ganzen Punkt.
- D-182 prüft Formtext mit bisher sichtbarer oberer Lage trotz gespeicherter Mittel-Ausrichtung: Ansicht und Editor zeigen denselben Block an derselben Stelle. Oben, Mitte und Unten gelten für den ganzen Block, erhalten eine Zeichenmarkierung und bleiben über Undo/Redo und Reload stabil.

## Ortsabhängige neutrale Textfarbe (D-275, 18. Oktober 2026)

Neue Textboxen über das Textwerkzeug wählen auf Rastermaterial lokal Schwarz oder
Weiß nach dem Median einer kleinen Pixelumgebung im vorhandenen Renderer. Zoom,
Drehung und Bildzuschnitt sind dadurch bereits enthalten; kein erneutes Laden oder
KI-/Netzwerkaufruf. Weiße lokale HTML-Arbeitsblätter verwenden ihren Papiergrund;
allgemeine eingebettete Apps erhalten keine behauptete Inhaltsanalyse. Akzentfarben
bleiben bewusst gewählt. Freier Canvastext behält die bestehende Themefarbe.

Vorhandene Texte, Objektkopien, Bearbeiten und normales Verschieben färben sich
nicht nachträglich um. Material-/formgebundener Text bleibt über die vorhandene
Bindung beim Themewechsel und Reload farbstabil, da das Blatt selbst ebenfalls
nicht invertiert wird. Freier neutraler Text folgt weiterhin dem Theme. Keine neue
Palette, Einstellung, gespeicherte Hintergrundanalyse oder zweite Materialbindung.
Externer Textpaste bleibt vorerst beim bestehenden Theme-Default.

Abnahme: Weißes/dunkles Rastermaterial, weiße HTML-Seite, freie Fläche, explizite
Akzentfarbe, bestehender Text, Themewechsel und Reload. Benutzerdefiniert dunkles
HTML ist durch die Weißpapier-Annahme nicht lokal pixelanalysiert und bleibt eine
bekannte Grenze; bei fehlendem/sicherheitsbedingt unlesbarem Raster fällt die
Erkennung auf den Canvasgrund zurück und blockiert die Eingabe nicht.
