# UI Brief – Live Canvas Bewegung, Vorschau und Zeiger

Stand: 5. September 2026. Umgesetzt gemäß D-102 als ausdrücklich beauftragter Anschluss an D-101; keine Schülerbearbeitung. Prüfstand und Release: [Betrieb/Test](../implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md).

## Handlung und Gestaltung

- Clipwechsel innerhalb derselben Stunde bewegt die begrenzte Kamera direkt auf der bereits geladenen bereinigten Szene; kein Ladezustand, Unmount oder Inhalts-Crossfade. Schnelle Gegenwechsel übernehmen ausschließlich das neueste Ziel. Rückruf innerhalb desselben Clips animiert die echte Kamera in etwa 300 ms; eigene Eingabe bricht ab. Reduzierte Bewegung verwendet direkte Zustandswechsel. Stundenwechsel und Clip ohne Auswahl bleiben echte leere Publikationsgrenzen.
- `Schülervorschau` ist ein optionales verschiebbares Fenster am aktiven Clip und im Livepanel. Tablet Hoch-/Querformat, Schließen; keine Clipbibliothek. Die gesamte freie Kopfzeile bleibt direkt verschiebbar, ohne einen sichtbaren Draggriff zu wiederholen. Ein sanfter Außenschatten hebt das Fenster von der Lehrerfläche ab. Innerhalb bilden Kopfzeile, sichere Projektion und Fußzeile eine durchgehende ruhige Fläche: kein zweiter Canvasrahmen, kein Innenabstand und keine abgerundete Karte um den Inhalt. Es zeigt den bestätigten öffentlichen Stand, nicht die private Lehrerfläche und nicht die individuelle Kamera eines Schülers. Quelle sind dieselben sicheren Projektionsdaten und derselbe Teilnehmerrenderer; keine zweite fachliche Publikation oder zusätzliche Teilnahme.
- Die Fensterhülle der Schüler- und Raumvorschau verwendet dieselben semantischen Theme-Werte, Kontur, Rundung, Schatten und Kopfzeilenhierarchie wie der Materialbereich. Nur die Bildschirmfläche innerhalb der Vorschau folgt dem publizierten Canvas-Hintergrund. So bleiben die Bedienelemente im gewählten Lehrer-Theme lesbar, auch wenn das gezeigte Material eine andere Grundfarbe hat.
- Ein einzelner Icon-Button `Auf Lehrerfläche zentrieren` liegt in der Kopfzeile vor Format und Schließen. Er passt die lokale Lehrerkamera auf genau den in der Vorschau bestätigten Clip beziehungsweise im freien Modus auf das aktuelle Rückrufziel ein. Kein verstecktes Clipwechseln, keine Teilnehmersteuerung und kein Eintrag im Undo-Verlauf.
- Werkzeug `Zeiger` in derselben Fluent-Werkzeugleiste. Y halten aktiviert flüchtig und zeigt das aktive Werkzeug in der Leiste; Loslassen stellt die vorherige Werkzeugwahl wieder her. Toolbarwahl hält das Werkzeug aktiv. Eingabefelder, eingebettete Inhalte und Cmd/Strg+Y bleiben unangetastet. Blur/Abbruch räumt die flüchtige Geste.
- Drei nachgeordnete Stile: `Komet` (klarer Kern, weicher Schweif), `Band` (fließende zweifarbige Spur), `Funken` (kurzer begrenzter Zerfall). Bewegung zeigt einen kurzen Schweif, Ziehen bleibt kurz als Unterstreichung stehen. Keine endlosen Partikel, Blinkeffekte, Audio oder gespeicherten Striche. Stileinstellung als lokale Gerätepräferenz.
- Normale Mausbewegung wird in keinem Live-Modus mehr angezeigt. Nur das explizite Zeigewerkzeug überträgt flüchtige Positionen. Im Clip strikt auf die freigegebene Grenze begrenzt; außerhalb und bei privaten Controls keine Übertragung. Kein Teilnehmerrecht daraus ableiten.

## Architektur und Prüfung

Bestehenden generationengebundenen Presence-Kanal mit validierter Stilangabe verwenden. Lokale und entfernte Darstellung teilen denselben begrenzten RAF-Renderer. Keine neue Engine/Animationsdependency, kein Archivinhalt für Vorschau oder Zeiger. Kamera, Inhaltsrevision und kosmetische Übergänge bleiben getrennt. Unterrichts- und Undo-Daten unverändert.

Synthetischer Browserflow: Y/Loslassen/Blur/Textfokus/Redo, dauerhafte Toolbarwahl und alle Stile, unveränderte Canvasdaten, Frei/Clipgrenze/einmaliger Rückruf, Reconnect/Ende; Vorschau mit späterem Inhalt und schnellem Clipwechsel; Kameraanimation, Abbruch, keine Pointerspuren nach Generationswechsel, sichere Abdeckungen, reduzierte Bewegung; Hell/Dunkel und Tabletviewport. Echte Tablet-/Stiftabnahme bleibt offen.

## Gestaltungsreferenzen

- https://tldraw.dev/blog/redesigning-lasers – flüchtige Zeichengesten und gemeinsames Ausblenden nach Aktivität; kein SDK-Wechsel.
- https://m1.material.io/motion/duration-easing.html – kurze, unterbrechbare Bewegung mit weichem Abbremsen; konkrete Zeiten werden in unserer Oberfläche geprüft.

Der weiche Außenschatten bleibt eine begrenzte Ausnahme zur allgemeinen visuellen Zurückhaltung; Lehrmaterial und zentrale Werkzeuge bleiben scharf. Innerhalb der Vorschau wird kein zusätzlicher Blur- oder Kartenrand eingesetzt.

## Korrektur nach Unterrichtsfeedback – 5. September 2026

- Y muss auch direkt nach einem Stift-/Markerzug und während aufgesetztem Stift aktivieren. Ein begonnener Inkzug wird am Übergang regulär abgeschlossen; Laserbewegung schreibt nicht weiter. Beim Loslassen kehrt das vorherige Werkzeug zurück, ein neuer Strich benötigt eine neue Aufsetzbewegung. Buchstabe Y gilt auf deutscher und englischer Belegung. Texteingabe und Redo bleiben geschützt.
- Aktueller Stand D-123: Die Schülerfläche bleibt dieselbe Bühne. Normale Clipwechsel bewegen nur die Kamera und zeigen keinen zentralen Ladetext oder Fokus-/Opacity-Wechsel. Erst ein echter Inhaltsaufbau darf bei längerer Wartezeit dezent gemeldet werden; Verbindungsausfälle und fehlende Clipwahl bleiben erkennbar. Abdeckungen und Stundenwechsel behalten ihre harte Pixel-/Generationsgrenze.

Temporäre Werkzeugwahl: Leertaste hat während des Haltens Vorrang vor Y und dauerhaftem Laser. Beim Loslassen erscheint das darunterliegende Werkzeug wieder. Der Toolbar-Klick wählt das Grundwerkzeug; er darf den Tastaturfokus nicht auf dem Button festhalten. Der Fokusverlauf verwendet 420 ms ohne vertikales Einschieben; lange Wartezeit wird erst nach 1,8 s am Live-Status kenntlich.

**Navigation D-111:** Der Laser blockiert keine Canvas-Kameraeingabe. Strg/Cmd + Mausrad verwendet die vorhandene Zoomsteuerung, normales Mausrad deren Pan-Verhalten; der Laser bleibt aktiv. Doppelklick auf ein Objekt beendet den dauerhaften oder gehaltenen Laser samt Stilmenü und selektiert das Objekt beziehungsweise seine bestehende Gruppe. Kein Texteditor und kein neues Textelement durch diesen Wechsel. Ein Doppelklick auf leere Fläche bleibt im Laser. Nach explizitem Wechsel darf gehaltenes Y durch Tastaturwiederholung nicht erneut aktivieren; erst ein neuer Tastendruck tut dies.
