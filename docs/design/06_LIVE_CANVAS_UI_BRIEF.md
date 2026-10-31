# UI Brief – Live Canvas POC

**Aktuelle Oberfläche ab D-203:** `Präsentieren` mit Room/Remote und direkter Clipwahl ersetzt die nachfolgend historisch beschriebene Host-Umschaltung `Frei`/`Clip`. Teilnehmernavigation, Einladung und Wire-Vertrag bleiben gemäß D-127 gültig. [Aktueller Room-UI-Brief](19_ROOM_CANVAS_PILOT_UI_BRIEF.md).

**Stand:** 5. September 2026  
**Status:** Umgesetzt als lesender POC; Browserprüfung und Grenzen siehe [Betrieb/Test](../implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md). Bestätigter Stundenwechsel im selben Raum, erlaubte Medienstaffelung, Teilnehmer-Vollbild, Abdeckungsübergang und Host-Zeiger gemäß D-089 bis D-093.

## Erweiterung D-101 – Clips

Der [Clip UI Brief](07_LIVE_CANVAS_CLIP_UI_BRIEF.md) ergänzt diesen POC. D-127 ersetzt Folgen/Frei durch die Hostmodi `Frei` und `Clip`: Im freien Modus navigieren Teilnehmer selbstständig; `Zur Lehrkraft` und `Alle zu mir` sind einmalige Rückrufe ohne Lock. Der Clip-Modus zeigt gemäß D-104 nur den begrenzten Ausschnitt ohne eigenen Resetbutton. Zahnrad, Freigabecheckbox und Teilnehmer-Modusschalter entfallen. Stundenwechsel im Clip-Modus wartet auf eine neue Clipwahl.

## Kontext

### Erweiterung D-095 – fester Treffpunkt

- Eine feste, nicht öffentlich aufgelistete Einladungsadresse führt per Link, QR oder verteiltem Webclip in denselben Teilnehmerclient. Keine Raumwahl, eigenen Canvasses oder Spieleinstellungen.
- Einstieg bleibt `Wer bist du?` / `Dein Name` / `Beitreten`. Ohne Host wartet die angemeldete Person bei `Noch kein Canvas gestartet.`; mit vorbereiteter Einladung bei `Gleich geht’s los.`. Verbindungsausfälle sind davon sichtbar getrennt.
- Nachgeordnete Aktion `Name ändern` am eigenen Namen verlässt die bisherige Teilnahme und kehrt zum leeren Namensfeld zurück; keine dauerhafte Identität auf geteilten Tablets.
- Hoststart öffnet die freigegebene Fläche automatisch. Beenden räumt Canvas/Assets und führt die Teilnehmer zurück in denselben Treffpunkt. Entfernen bleibt wirksam und wird nicht durch automatische Wiederaufnahme umgangen.
- Hostpanel: direkte Moduswahl `Frei`/`Clip`, im laufenden freien Modus `Alle zu mir`, Einladung mit `Link kopieren` und optional aufklappbarem `QR-Code`, Teilnehmer/Namen/Entfernen sowie genau ein zustandsabhängiger Sitzungsbutton. Vor Live steht dort das blaue `Starten` mit Play-Symbol, während Live an derselben Position das rote `Beenden` mit Stop-Symbol; beide dürfen nie gleichzeitig erscheinen. Kein Zahnrad, keine Domainzeile und keine Liste `Nur als Platzhalter sichtbar`. Die Schülervorschau bleibt darunter als getrennte nachgeordnete Aktion.
- Das bloße Öffnen dieses Panels ist ein lokaler Blick auf die Steuerung und erzeugt keinen Hostraum. Erst `Link kopieren`, das Aufklappen des `QR-Code` oder `Starten` bereitet den festen Treffpunkt vor. `Starten` führt diese Vorbereitung und die erste Veröffentlichung als eine einzige Nutzerhandlung fort; ein zweiter Klick nach dem Verbindungsaufbau ist nicht nötig.
- Installierter Standalone-/Webclipbetrieb fordert kein zusätzliches Fullscreen API-Vollbild an und zeigt dort keinen redundanten Vollbildbutton. Browserbeitritt behält den bisherigen Button. Keine Zusage zur realen iPad-Gestenbedienung ohne Hardwaretest.
- Ein späteres Spiel gehört in den Wartebereich, ist aber ausdrücklich nicht Teil dieses Ausbaus. Kein Spielplatzhalter, Spinner oder künstliches `Gleich geht’s los`, solange niemand eine Übertragung vorbereitet.
- Testfrage: Schafft dieselbe Person Name → Warten ohne Host → gemeinsamer Start → frei bewegen → `Zur Lehrkraft` → Ende → erneuter Start ohne neuen Link oder Reload? Zusätzlich `Alle zu mir`, Kick/Reload, Serverneustart, zwei Hosttabs, Tabletviewport und Standalone-Erkennung prüfen.


- **Oberflächen:** Host-Einladung/Teilnehmerliste; Teilnehmerbeitritt, Warten, Liveansicht, Unterbrechung und Ende.
- **Zielnutzer:** Kinder und nicht technikaffine Erwachsene am Tablet oder Laptop; Lehrkraft/Seminarleitung in der lokalen Tafelraum-App.
- **Primäre Handlung:** unkompliziert einer geteilten Unterrichtsfläche beitreten und sie selbstständig erkunden.
- **Designfrage:** Versteht eine Person ohne Erklärung Beitritt, Warten, freie Navigation und den einmaligen Rückweg zur Lehrkraft?
- **Leitlinie:** minimale sichtbare Texte und wenige Controls sind ein dauerhaftes Produktkriterium. Der [Styleguide](00_UI_UX_STYLEGUIDE.md) gilt, mit der ausdrücklich gewünschten Fluent-/Icon-Schalter-Ausnahme für diese Bedieneinheit.

## Erforderliche Elemente nach Zustand

| Zustand | Oberfläche |
|---|---|
| Host öffnet nur die Steuerung | `Live Canvas`, direkte Moduswahl, `Einladen` und blauer Hauptbutton `Starten`; noch kein Raum, keine Teilnehmerliste und keine Schülervorschau. Panel schließen bleibt vollständig folgenlos. |
| Host lädt ein | `Live Canvas`, direkte Moduswahl, kompakte Gruppe `Einladen` mit `Link kopieren` und optional aufklappbarem `QR-Code`, Namen und Zahl der verbundenen Personen; blauer Hauptbutton `Starten` mit Play-Symbol, kein `Beenden`. QR weiterhin erreichbar, wenn Liste wächst. Keine Domain-/Materialnamenszeile. |
| Teilnehmer tritt bei | `Wer bist du?`, ein beschriftetes Namensfeld, `Beitreten`; Enter bestätigt. Kein Accountdialog oder Onboarding. Vollbild ist oben rechts direkt erreichbar. |
| Teilnehmer wartet | Ohne Host `Noch kein Canvas gestartet.`, bei geöffneter Einladung `Gleich geht’s los.` und eigener Name; nachgeordnet `Name ändern`. Keine Canvasvorschau oder dauernder Ladespinner. Vollbild nur im Browser, nicht im eigenständigen Webclip. |
| Live | Dominante Canvasfläche; im freien Modus ein einzelner Button `Zur Lehrkraft`, feiner statischer Innenrahmen, kleine Live-Anzeige und Vollbild oben rechts. Im Clip kein Kamera-Control und keine Werkzeugleiste. |
| Host während Live | Kompakter Einstieg mit `Live Canvas`, direkt lesbarem Modus-Chip (`Frei`, `Clip` oder `Clip wählen`) und Teilnehmerzahl mit Personensymbol; dahinter direkte Moduswahl, im freien Modus `Alle zu mir`, Einladung und Teilnehmerliste. Keine zusätzlichen grünen Statuspunkte neben dem Archivstatus. An der Position des Startbuttons steht jetzt ausschließlich der breite rote Button `Beenden` mit Stop-Symbol; `Starten` ist nicht gleichzeitig sichtbar. `Schülervorschau` bleibt darunter nachgeordnet. Panel schließen beendet die Sitzung nicht. |
| Host wechselt Stunde | `Neue Stunde in Live Canvas zeigen?`, Zielstundentitel, `Abbrechen` / `Stunde zeigen`. Bestätigung erhält Sitzung und Teilnehmer; sobald bereit, erscheint die neue Fläche. |
| Unterbrochen | Letzter empfangener Inhalt bleibt sichtbar, Live-Puls stoppt; knapp `Verbindung wird hergestellt …` beziehungsweise `Verbindung zum Host unterbrochen`. |
| Ende/Entfernung | Im festen Treffpunkt zurück zu `Noch kein Canvas gestartet.`; nach Entfernen `Du wurdest aus Live Canvas entfernt.` ohne automatischen Wiederbeitritt. Der alte isolierte Diagnoseraum zeigt bei Ende weiterhin `Live Canvas wurde beendet.`. Gemeinsame Fläche immer räumen. |

Der Host sieht Namen ohne Toast für jeden Beitritt; die Liste und Anzahl sind die Rückmeldung. Namensliste bleibt im POC privat beim Host. Leere Liste: `Noch niemand dabei`. Entfernen liegt eindeutig am gewählten Eintrag und ist kein dominantes Kreuz neben jedem Namen.

Der geschlossene Einstieg muss die aktuelle Regieentscheidung zeigen, weil sie den Navigationsraum bestimmt. `Frei` bleibt neutral, `Clip` erhält einen dezenten Akzent und `Clip wählen` eine zurückhaltende Warnfarbe. Eine sanft getönte Triggerfläche kennzeichnet die laufende Publikation; Verbindung und Speichern werden nicht als zwei gleichartige grüne Punkte nebeneinandergestellt.

## Frei und einmaliger Rückruf

- Der Host wählt über zwei direkt beschriftete Segmente `Frei` und `Clip`; Metaphern oder ein zusätzliches Einstellungsmenü sind nicht nötig.
- Teilnehmer sehen im freien Modus nur `Zur Lehrkraft` mit einem etablierten Zentrieren-/Zielsymbol. Der sichtbare Text ist für Kinder und neue Seminarteilnehmer eindeutiger als eine Taube oder ein abstrakter Icon-Schalter.
- Eigener Pan/Zoom bleibt immer frei. `Zur Lehrkraft` übernimmt den letzten Hostausschnitt lokal einmal; `Alle zu mir` sendet denselben einmaligen Rückruf an alle. Spätere Hostbewegung verschiebt niemanden automatisch.
- Innenrahmen signalisiert die gemeinsame Zuschauerfläche, blockiert keine Pointer und verändert nicht beim Zustandswechsel die Canvasgröße. `Live` bleibt auch im Freimodus bestehen, denn Inhalte sind weiterhin live.
- Auf- und Abdecken übernimmt den kurzen gerichteten Wisch der lokalen Fläche einschließlich der tatsächlichen Kontur von Rechteck mit Rundung, Ellipse und Raute. Die vollständige Kontur bleibt währenddessen geometrisch fest; nur der sichtbare Ausschnitt wandert, auch bei gedrehter Abdeckung. Das bereits geladene Material bleibt stehen; nur das opake Abdeckungsobjekt und sein lokaler Übergang wechseln. So entsteht weder Rasterwartezeit noch der Eindruck eines Seiten-Reloads. Bei reduzierter Bewegung wird unmittelbar gewechselt.
- Teilabdeckungen von Grundformen bleiben auch nach dem Wisch ein Ausschnitt der unveränderten Zielform, keine kleinere oder verschobene Zweitform. Die öffentliche Szene übernimmt dieselbe native Schnittkontur; der optionale Übergang verwendet genau diesen Umriss.
- Konkretisierung des Abdeckungsübergangs: Kameraänderungen dürfen die Animation nicht abbrechen. Aufdecken hält die opake Übergangsfläche bis zum passenden Vektorzustand und wischt sie dann lokal weg; Abdecken legt sie sofort lokal auf. Auch eine einzelne geänderte Abdeckung zwischen mehreren vorhandenen wird erkannt. Unveränderte Flächenbereiche dürfen nicht leer blitzen; kein zusätzliches UI oder künstlicher Ganzflächen-Fade.
- Vorschlag: kleiner Live-Punkt pulsiert langsam und schwach; Rahmen bleibt statisch. Keine Kamera-/Aufnahme-Symbolik. Bei `prefers-reduced-motion` statische Darstellung und unmittelbarer Moduswechsel.
- Späteres `Du bist dran` samt anderer Rahmenfarbe wird jetzt nicht dargestellt oder vorbereitet.

### Bewegungsqualität D-098

- Prüffrage: Bleiben Bild-/Elementbewegung und individuelles Abdeckungsziehen kontinuierlich sichtbar, ohne Ganzflächenwechsel oder neue Bedienelemente?
- Reine Positionsänderungen bereits identischer freigegebener Inhalte erhalten maximal 40 ms Glättung, keine Trägheit/Vorhersage. Bei reduzierter Bewegung unmittelbar. Bildinhalte werden bei Abdeckungsänderungen nicht neu erzeugt.
- Neue zugeschnittene Bildassets erst bereitstellen und dann übernehmen; Abdeckungsänderungen bleiben vektorbasiert. Freie Kamera, einmaliger Rückruf, Pointer, Start/Ende und der bestehende Cover-Wisch sind Invarianten.
- Zielhardware: iPad 9 sowie MacBook. Synthetischer Pixeltest mit verzögerten ACKs prüft Übertragung und sichtbare Zwischenpositionen; reale Touch-/Netz-/Speicherabnahme bleibt erforderlich.

### Host-Zeiger (historischer Darstellungsvertrag D-093)

**Ersetzt durch D-102:** Normale Maus privat, bewusster Zeiger über Y/Toolbar mit drei flüchtigen Spuren. Vorschau und Bewegung gemäß [ergänzendem UI Brief](08_LIVE_CANVAS_MOTION_PREVIEW_POINTER_UI_BRIEF.md). Die folgenden Punkte dokumentieren die vorherige Ausführung.

- Designfrage: Ist sofort erkennbar, wohin der Host zeigt, ohne zusätzliche Teilnehmerbedienung?
- Ein kleiner präziser Positionspunkt; Farbe und gedrückter Zustand bleiben erkennbar. Auf ausdrücklichen Nutzerwunsch kein Symbol des ausgewählten Werkzeugs. Keine Namenblase, Spur oder neue Toolbar.
- Bewegung kurz glätten, ohne lange Nachlaufanimation; reduzierte Bewegung folgt unmittelbar. Die Zeigerposition bleibt unabhängig von der freien Kamera an derselben Canvasstelle und ist außerhalb des eigenen Ausschnitts unsichtbar.
- Nur Hostbewegung auf der freigegebenen Canvasfläche, nie Archiv/Menüs. Bei Verlassen, Unterbrechung oder Quellenwechsel ausblenden. Keine Teilnehmercursor, Kontrolle oder gespeicherten Bewegungen.
- Prüfung: Zeigen, Stift/Marker/Radierer wechseln, drücken/loslassen, freier Pan/Zoom und einmaliger Rückruf; danach Fläche verlassen und Verbindung unterbrechen. Desktopprüfung ersetzt keine echte Tablet-/Stiftvalidierung.

## Desktop und Tablet

- Eine Oberfläche, kein Gerätemodus; Layout reagiert auf tatsächlich verfügbaren Platz.
- Unsichtbare Touchflächen mindestens 48 × 48 CSS-Pixel pro Aktion, ausreichender Abstand trotz kompakter Optik.
- Kein Kernflow benötigt Hover. Tastaturfokus und aktueller Modus sind zusätzlich zu Farbe erkennbar.
- Tablet: Finger-Pan und Pinch-Zoom; keine Browser-Seitengeste beim Navigieren auf dem Canvas. Laptop: Maus und Trackpad über vorhandene Engine-Navigation.
- Hoch-/Querformat, Safe Areas und Bildschirmtastatur berücksichtigen. Der Joinbutton darf durch die Tastatur nicht unerreichbar werden.
- `Zur Lehrkraft` bleibt unten mittig stabil, gut erreichbar und mindestens 48 CSS-Pixel hoch. Endgültige Position im Browser vergleichen und auf echten Geräten testen.
- Vollbild ist eine bewusste Iconaktion mit 48 × 48 CSS-Pixeln oben rechts. Es wird nie automatisch angefordert, wechselt sichtbar zwischen Maximieren und Verlassen und bleibt von Beitritt, Sitzung und Kamerarückruf unabhängig. Unterstützt der Browser die API nicht, erscheint kein funktionsloses Control.
- Keine weichen Übergänge auf Kosten unmittelbarer Eingabe; Kamera folgt ohne lange nachlaufende Animation.

## Copy-Ergänzungen nur im passenden Kontext

- Feldlabel: `Dein Name`; ungültige/leere Eingabe: `Gib deinen Namen ein.`
- Nach erfolgreichem Kopieren vorübergehend `Kopiert` am bestehenden Button.
- D-095 entfernt auf Nutzerwunsch die Freigabeorientierung und Material-Platzhalterliste aus dem reduzierten Hostpanel. Die gesamte Fläche bleibt freigegeben, nicht nur der Hostausschnitt; Medien sind weiterhin technisch Platzhalter.
- Nicht mehr gültiger Link: `Dieser Link ist nicht mehr gültig.`
- Ladefehler: `Verbindung fehlgeschlagen.` mit `Erneut versuchen`.
- Bestätigter Stundenwechsel gemäß P2: `Neue Stunde in Live Canvas zeigen?` mit Zielstundentitel, `Abbrechen` und `Stunde zeigen`. Bei einem noch wartenden Raum mit mindestens einem Teilnehmer: `Neue Stunde für Live Canvas laden?` mit `Abbrechen` und `Stunde laden`; Teilnehmer bleiben im Wartebereich. Ein sicher verbundener leerer Warteraum übernimmt die neue Stunde dagegen ohne Dialog. Ist sein Verbindungszustand unklar, bleibt die Bestätigung als Sicherheitsgrenze erhalten.
- Während eines Quellenwechsels oder einer fehlgeschlagenen Publikation: `Übertragung pausiert`; bei Asset-Ladefehler `Übertragung unvollständig` mit Wiederholungsaktion. Die bisherige freigegebene Fläche bleibt erhalten und wird nicht fälschlich als aktuell markiert.
- Erst mit implementiertem YouTube-Anschluss und tatsächlich blockierter Wiedergabe im betroffenen Player: `Video starten`. Kein zusätzlicher Medienbutton im Canvas-Chrome.

## Darf nicht erscheinen

Archiv, Bearbeitungswerkzeuge, Login/Passwort, Chat, Spiele, Rangliste, Kontrollanfrage, Rechtekonfiguration, Aufnahme, Kamera-/Mikrofonfreigabe, Teilnehmercursor, deaktivierte spätere Funktionen, Tutorial, werblicher Text oder technische Verbindungsdaten. Keine neue Dependency nur für Schalter, Rahmen oder Animation.

## Referenzen und Abnahme

- Vorhandenes Muster: `ThemeSwitch` in `src/App.tsx`, `.theme-switch*` in `src/styles.css`, Fluent-Masken in `src/icons/FluentToolbarIcon.tsx` unter `prototypes/surface-shell-a-b/`.
- Reale Testaufgabe: QR scannen, Vollbild aktivieren, Namen eingeben, warten, automatischen Start erkennen, frei bewegen, `Zur Lehrkraft` und `Alle zu mir` prüfen; Host sieht vor Live nur Play/`Starten` und während Live an derselben Position nur Stop/`Beenden`, wechselt nach Bestätigung die Stunde ohne neuen Beitritt, entfernt eine Testperson und beendet die Sitzung. Beim erfolgreichen Stundenwechsel beginnt die neue Fläche einmalig am Hostausschnitt.
- Zwischen visuellen Varianten bleiben Inhalt, Rechte, Ablauf und Texte identisch; pro Iteration nur Symbolpaar, Platzierung oder Konturwirkung verändern.
- **Reviewurteil:** Hardwarevalidierung erforderlich. Der implementierte Browserablauf einschließlich festem Treffpunkt, wiederholtem Start/Ende und reduziertem Hostpanel ist geprüft; Iconverständnis durch Kinder, echter Relution-Webclip/Pan/Pinch, QR-Lesbarkeit vom Unterrichtsdisplay und wahrgenommene Flüssigkeit im Schulnetz sind noch nicht bestätigt.
- Erfolg: Kind beziehungsweise wenig technikaffine Testperson schafft den Ablauf ohne mündliche Anleitung, versteht `Frei`/`Clip` und findet den Rückweg zur Lehrkraft.
