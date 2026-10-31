# HTML-Wiedergabe nur im Room – 21.10.2026

**Releasefortschreibung 22.10.2026:** Der vollständige HTML-Medien-/Room-/native Vollbildpfad ist mit 0.1.70 signiert veröffentlicht. Die heutige direkte Autorsteuerleiste einschließlich bestätigtem Scrubbing bleibt paketlokal (D-286); vorbereitete Pakete verwenden denselben veröffentlichten Appvertrag. Keine automatische Materialinstallation, Produktivmigration oder Remote-Videosteuerung. Frühere Beschränkungen auf die separate Test-App sind für den Programmcode historisch. Prüfgrenzen und Belege: Desktop-Updatedokument und `output/release-0.1.70/`.

## Direkte Medienleiste · 22.10.2026

Nutzerauftrag: vertraute moderne Icons und unmittelbar bedienbare Zeitleiste
statt großer Textbuttons und `Position und Ton`. Eine ruhige Ebene unter dem
Poster: Abspielen/Pause, Stopp (aktuellen Film/Abschnitt bei 0 pausieren),
bei Wiki Abschnitt zurück/weiter, Zeitleiste, aktuelle/Gesamtzeit, Ton und
Video-/Room-Vollbild. Unveränderte offizielle Lucide-Symbole, zugängliche Namen,
Tooltips und 48-px-Trefferhöhen. Normaler Room-Status knapp, Fehler sichtbar
direkt an derselben Leiste; kein zweiter Player oder neuer Transportvertrag.

Zeitleiste und Lautstärke: gemeinsame explizite Pointergeste auf semantischen
Range-Inputs, nicht zusätzlich die je nach Browser verschiedene native Mausgeste.
Nur primäres Drücken beginnt, Griffabstand bleibt beim Anfassen erhalten;
Pointer-Capture hält Ziehen außerhalb. Regler/Zeit reagieren sofort lokal,
Statusheartbeats überschreiben die Auswahl nicht. Genau ein Seek/Volume beim
Loslassen (Tastatur: Key-up, assistive Eingabe: Input/Change); kein nachlaufendes
Hover-Tracking. Abbruch/Escape/Blur/Captureverlust, fehlende Maustaste sowie
Verbindungs-/Abschnittswechsel verwerfen Entwürfe und lösen Capture. Bis zur
Bestätigung Ziel halten, dann realen Status anzeigen. Lautstärke in 1-%-Schritten,
Der zugrunde liegende Seek pausiert; nach bestätigtem Ziel folgt ein bestehender
Play-Befehl genau dann, wenn die Geste während laufender Wiedergabe begann.
Pausierte Gesten bleiben pausiert; Stopp, Abbruch/Timeout, explizite Pause,
Abschnitts-/Verbindungswechsel und das exakte Medienende starten nicht erneut.
Kein Timer-Play, keine zweite Uhr. Das vermeidet
Decoder-/Pufferneustarts und konkurrierende Statuswerte während des Ziehens.

Reichweite: gemeinsame gLT-Autorsteuerung für Filmszenen, Mittag und Wiki,
nur staged Pakete und bestehendes getrenntes Testarchiv. Standalone-/Room-
Originalplayer, native Appmedien, normale HTMLs und echte Stunden unverändert.
Abnahme: erste Klicks, Pointerdrag mit Zwischenheartbeats und einem Endbefehl,
Release außerhalb, Cancel/Escape/Blur, Tastatur, kleine/große Positionen,
verlorene Verbindung und Abschnittswechsel, bestätigte Position statt Rücksprung,
Vollbild/Navigation/Reload. Sichtprüfung bei 1280×720 und schmalerem Viewport;
Finger/Stift/Beamer bleiben echte Hardwareprüfung. Frühere Popup-Review unten
ist für diese neue Autorleiste abgelöst.

## Vollständige gLT-Teststunde / Michael Mittag

Auftrag: gleiche bestehende Steuerung für den lokalen Mittag-Film und eine
komplette Teststunde der vorhandenen Einheit (Teil 1 plus Klarheits-Workshop).
Nur Testarchiv, kein produktiver Import. Bestehende Aufgaben/Literatur unverändert.

Ein einzelnes Video im vorhandenen `room-v1`-Paketvertrag: Ohne Room native
Controls lokal; mit Room nur ruhendes Poster und dieselbe Play/Pause-, Positions-,
Ton- und Vollbildsteuerung. Titel „Die Hattie-Studie (2025)“, Unterzeile
„Michael Mittag · Erklärvideo“. Keine zweite Zeitachse, neue Stimme, Bearbeitung
des Films, neue Anbieterintegration oder Änderung aller nativen MP4-Player.
Keine zusätzliche Cover-/Auftragsfolie; kein Print-Anspruch für das Medienpaket.

Teststunde: 13 primäre Materialflächen in bestehender Ablaufreihenfolge,
nummerierte Materialclips, Papierphasen als vorhandene Aufträge. Lösungen nur
klar benannt im Materialarchiv, nicht automatisch auf dem Präsentationscanvas.
PDF-Druckfassungen, Word/PNG-Maildateien und Literatur als normale Stundenquellen.
Bestehende A4-Pakete behalten ihre Druckdeklaration; keine neue Druckfreigabe
durch Kopieren/technische Installation. QR-Abgabe, reale Word-Geräte und Beamer/
Ton bleiben getrennte Hardwareprüfungen.

Abnahme: Mittag lokal/Room/Übergabe/Vollbild/Pause/Seek; stumme passive Lehrerseite;
Material-/Clipwechsel stoppt vorherige Medien; Interaktion der Auflösung und
Reflexionsfelder in beiden Richtungen; kompletter Stand nach Reload erhalten.

## Lehrer-Fernaufruf – D-285

Bestehende Lehrer-Taste schaltet ausschließlich das vorhandene Room-Video.
Die native Mac-App vermittelt die Aktivierung eng an den geprüften Ausgabe-
Subframe, statt die asynchrone Cross-Window-Nachricht als echte Geste anzusehen.
Controls bleiben über Statusheartbeats DOM-stabil. Keine neue sichtbare Taste,
kein zweiter Player, kein CSS-Ersatz und kein Neustart. Native Lehrer-Taste und
Escape-Rückkehr mit weiterlaufendem Film am Mac bestätigt (Prüfstand 43);
physische Beamer-/Audio-/Langzeitprüfung offen. Ausschließlich gLT-Test-App/-stunden.

## Aktuell: originale Player-Taste – D-283

Kein zusätzlicher Vollbildknopf im Film. Originale native Video-Controls bleiben
unverändert. Tatsächliche deklarierte Room-/lokale Player erhalten ausschließlich
die erforderliche Fullscreen-Permission (Header plus Iframe); normale HTML-
Materialien und passive Vorschauen nicht. Sandbox und Geräte-/Netzsperren bleiben.
Native Fullscreen-API desselben Videoelements statt CSS-Ersatzprojektion D-282.
Kein Remount, Seek oder Pause beim normalen Wechsel. Lehrercontroller bleibt
passiv; sein Vollbildbefehl verwendet denselben nativen Zielplayer und meldet
eine tatsächliche Gestenblockade statt einer Ersatzvergrößerung. Room-Shell-
Vollbild bleibt separat. Die nachfolgenden früheren Vollbildvarianten sind
historisch und abgelöst. Originaltaste und Rückkehr ohne Neustart sind vom Nutzer
am Mac bestätigt; Beamer-/Audioübertragung bleibt separat zu testen.

## Korrektur Video-Vollbild (Nutzerfreigabe 21.10.)

Der Playerknopf zeigt ausschließlich das laufende Video bildschirmfüllend im
Room, nicht lediglich ein vergrößertes Room-Fenster. Lehrerfläche bleibt passive
Steuerung. `Video-Vollbild` / `Video-Vollbild verlassen` liegt direkt an der
Videofläche. Derselbe Iframe und dasselbe Video bleiben gemountet; weder Seek,
Pause noch Neustart beim Wechsel. Escape oder dieselbe Taste stellt vorherigen
Clip/Kamera/HTML-Aufbau und vorherigen Fenstervollbildzustand wieder her.
Paket benennt sein Vollbildziel explizit über `getFullscreenTarget()`; ohne Ziel
bleibt die gesamte HTML-Präsentation der Inhalt. Keine Sandboxlockerung, keine
gespeicherte Geometrie und kein zweiter Player. Widerruf/Unsichtbarkeit/Wechsel
beendet die temporäre Darstellung. Frühere Aussage „nur Room-Fenster“ unten ist
damit für Player-Vollbild abgelöst. Abnahme: laufender Film, beide Knöpfe,
Escape, Canvas und Clip, unveränderte Playeridentität/fortschreitende Zeit.

Fortschreibung: Paketautor kann eine leichte `playback.controllerEntry`-HTML-Datei
deklarieren. Im Room-Modus behält die Lehrerseite dieselbe Präsentationshülle,
Cover und Foliennavigation. Filmflächen zeigen nur Poster, bei Wiedergabe mit
`Wiedergabe im Room Canvas`; dort bleiben Play/Pause, Position, Lautstärke und
Room-Vollbild erreichbar. Remotion-Erklärungen zeigen vorbereitete ruhende Bilder
des aktuellen Abschnitts, keine zweite Komposition oder TTS-Instanz. Ohne Room
bleibt der Originalplayer. Bestehende Pakete ohne Autoransicht behalten die
allgemeine Steuerfläche. Normales HTML unverändert. Kein Runtime-Capture oder
neuer Zustandspfad; die Autoransicht nutzt dieselbe zentrale Befehls-/Statusbrücke.

Fortschreibung 21.10.: Ohne aktiven Room zeigt das Lehrercanvas den ursprünglichen
Player und erlaubt normale lokale Wiedergabe. Nur während Room aktiv ist wird es
zur Fernsteuerung. Übergaben pausieren und erhalten den bestätigten semantischen
Stand; kein automatisches Fortsetzen und niemals zwei aktive Wiedergabeorte.
Vorschau bleibt passiv, gewöhnliches interaktives HTML unverändert. Dies ersetzt
die bisher auch ohne Room dauerhaft angezeigte Fernsteuerung.

Auftrag: zunächst ausschließlich getrennte gLT-Teststunden. Kein produktives Archiv ändern.

Ergänzung Vollbild: Lehrersteuerung erhält `Room-Vollbild` / `Room-Vollbild verlassen`
mit bestätigtem aktivem Zustand. Das tatsächliche Room-Fenster wechselt über
seine bestehende native/browserseitige Vollbildfunktion; Canvas-Verfolgung,
Materialclip oder Ausschnittclip bleiben unverändert. Kein Materialzoom,
Projektionswechsel, Iframe-Neuladen oder gespeichertes Vollbild. Paketinterne
Vollbildtasten nutzen einen expliziten Hostadapter statt der gesperrten
Iframe-Fullscreen-API. Fehler sichtbar melden; Browser können einen ersten
direkten Room-Klick verlangen. Native Test-App erneut separat bauen/prüfen.

- Opt-in `playback.protocol=room-v1` im HTML-Paket; gewöhnliche HTML-Materialien bleiben unverändert.
- Lehrerfläche: leichte Fernsteuerung statt zweitem Medien-/Remotion-Player. Titel, aktueller Abschnitt, Zurück, Abspielen/Pause, Weiter, Position, Lautstärke und ehrlicher Verbindungs-/Fehlerstatus. Kein Autostart.
- Tatsächliches Room-Fenster: unveränderte HTML-Präsentation mit vorhandenem Player. Lehrervorschau bleibt passiv und verwendet ebenfalls keinen vollständigen Player.
- Laufender Status/Kommandos sind flüchtig. Bestehender `tafelraumLive`-Zustand bleibt für Position, Folie, Behalten und Zurücksetzen zuständig; kein gespeichertes „playing“.
- Room-Kanal, Generation, sichtbare Instanz und kurzlebige Freigabe begrenzen Wiedergabe. Schließen, Wechsel, Abdeckung oder ausbleibende Freigaben pausieren; keine automatische Wiederaufnahme.
- Ton kommt vom Room-Player über das vom Mac gewählte Systemausgabegerät. Keine automatische Änderung der Audioeinstellungen.

Risiken/Abnahme: Browser können eine erste Benutzerinteraktion im Room verlangen. Das wird sichtbar gemeldet, nicht umgangen. Automatisierte Browserprüfungen ersetzen weder native WebKit-Abnahme noch echten erweiterten Bildschirm, Beamer und Ton. Native Video-/YouTube-Elemente und Remote Canvas werden in diesem Schritt nicht umgebaut.

Review: **hardware validation required**. Lehrersteuerung und Room-Bildfläche im Browser sichtbar geprüft; Controls behalten klare Hierarchie und 52-px-Tasten vor Canvas-Skalierung. Keine zusätzlichen Arbeitsaufträge oder Inhaltsänderungen. Native Controls ohne Autoplay-Ausnahme bedient; Abdeckung/Ausfall-Pause erfolgreich. Mac-/Beamer-Audio und lang laufende native Wiedergabe bleiben offen.

Review Autoransicht: Filmcover behalten identisches HTML/CSS; Medienbereich zeigt
Poster, Play/Pause und kurzen Room-Status. Seltenere Regler liegen unter
`Position und Ton`. Wiki verwendet echte Abschnittsbilder der Komposition mit
denselben Lucide-Playericons, ohne Remotion-/TTS-Instanz auf der Lehrerfläche.
Standbild ist eine Abschnittsvorschau, keine Zusage framegenauer Spiegelung.
Native/gezeigte Ausgangsansicht und weiterhin unveränderte gewöhnliche HTML-
Interaktion gesondert prüfen. Touch-/Beamerabnahme bleibt offen.
