# Lokale HTML-Medien · gLT-Teststunden

**Veröffentlicht am 22.10.2026 – 0.1.70:** Vollständiger aktueller Appstand seit 0.1.59 einschließlich D-277 bis D-286. Die Freigabe hebt die bisherige Beschränkung auf die separate Test-App für den Programmcode auf. Die heutige Autorsteuerleiste bleibt Bestandteil der deklarierten HTML-Pakete; ein Appupdate installiert oder migriert keine Unterrichtsmaterialien. Keine Veröffentlichung privater Pakete, Medien, Modelle oder Konfiguration. Beamer-/Audio-/Touchabnahme bleibt offen. Prüf- und Veröffentlichungsbelege: `output/release-0.1.70/`. Ältere lokale/unveröffentlichte Vermerke unten sind historische Stände.

Stand: 21.10.2026. Nutzerfreigabe: ausschließlich Teststunden in einem getrennten
Archiv. Kein produktiver Archivzugriff, kein UI-Importer, keine native Installation.

## Direkte Steuerleiste / Scrubbing · 22.10.2026 · D-286

Bestehende gLT-Autorflächen (Filmclips, Mittag, Wiki) aktualisiert, nicht die
originalen lokalen/Room-Player. Eine Ebene mit offiziellen Lucide-Icons,
48-px-Zielen, Play/Pause, Stopp, direkter Zeitleiste/Zeit, Ton und Vollbild.
Kein `Position und Ton`-Popup oder zusätzlicher Playknopf auf dem Lehrerposter.
Icons entstehen beim Author-Build aus der bereits vorhandenen Bibliothek;
Pakete enthalten nur statisches SVG samt Lizenz, keine Reactlaufzeit/CDN.

Ursachen/Interaktion: Der alte fokussierte Range folgte nach der Bedienung
nicht mehr dem Status. Neue flüchtige Pointer-/Tastaturentwürfe sind ausdrücklich
von bestätigter Position getrennt; ein ruhender fokussierter Regler läuft wieder
mit. Genau ein Seek am Gestenende, kein Room-Puffern für jede Pointerbewegung.
ACK-Toleranz unterhalb eines 0,1-s-Eingabeschritts verhindert, dass ein verspäteter
naher Seek den neueren Zielwert überschreibt. Stopp nutzt vorhandenen Seek auf
0; der zugrunde liegende Seek bleibt pausierend. Abgebrochene/ungültig
gewordene Zeigergesten können auch nach weiterem Ziehen keinen alten Seek senden.

Nach Nutzerrückmeldung zu klebendem Scrubber und springender Lautstärke am
22.10.: Beide Ranges teilen jetzt eine explizite Pointergeste statt nativer
Range-Mausverfolgung plus eigener Capture-/Change-Behandlung. Der Tonregler
hatte zuvor nur einen Fokuscheck statt eigenem Entwurf/ACK-Schutz; Fokus ist
kein verlässlicher Dragzustand. Beide halten jetzt einen lokalen Entwurf und
kurz den gesendeten Zielwert. Kein Überschreiben durch Zwischenstatus,
Griffabstand bleibt beim Anfassen erhalten, Maus-Hover nach Loslassen wirkt
nicht. Explizite Capturefreigabe; Escape/Blur/Cancel/Captureverlust/fehlende
Maustaste/Abschnittswechsel brechen ab. Tastatur/assistive Eingabe bleiben.
Auch Volume sendet erst bei Release; 1-%-Schritte statt 5 %. Kein neues
Medienmodell, keine zweite Uhr oder geänderte Ausgabe-/Standalone-Controls.

Weitere Nutzerkorrektur 22.10.: Laufendes Video soll nach Scrubbing weiterlaufen.
Die Autorhilfe merkt den Wiedergabezustand beim Anfassen (auch Tastatur/assistive
Eingabe). Nach einem Seek wartet der vorhandene Pending-Entwurf auf tatsächliche
pausierte Zielbestätigung und sendet dann genau einmal den vorhandenen Play-Befehl.
Keine feste Verzögerung und kein paralleler Player oder geänderter Wire-Vertrag.
Der alte noch laufende Status am selben Ziel ist ausdrücklich keine Bestätigung.
Timeout/Cancel/Blur, explizite Pause, Stopp, Abschnitts-/Verbindungswechsel und
Seek ans exakte Ende starten nicht erneut. Pausiertes Scrubbing bleibt pausiert.
Diese Freigabe ersetzt ausschließlich die bisher stets pausierende Reglergeste,
nicht das Autoplay-Verbot bei Reload, Übergabe, Aufdecken oder Wiederverbindung.

`scripts/refresh-glt-controls.mjs` prüft zuerst drei staged Pakete. Nur mit
`--install-test` aktualisiert es ausschließlich ausgewählte Controllerdateien
der fünf bereits vorhandenen Paketkopien im explizit markierten Testarchiv.
Vorzustände mit Hashprotokoll unter dessen `.history/glt-controls/`; keine
Board-/Katalog-/Videobyteänderung durch den Updater und keine normale App.

Prüfung: 15 Autor-/Gestentests, 14 Playbackvertragtests, Typecheck und Diffcheck
grün. `scripts/glt-controls-browser-test.mjs` prüft alle drei echten Autorflächen
bei 1280×720 und 720×540: eine Ebene, sichtbare Icons/Zeitleiste, Pointerdrag mit
Zwischenstatus, genau ein Release-Befehl, Release außerhalb, Escape, verspätete
Statusbestätigung und Stopp. Wiederholte echte Griffdrags beider Regler und
anschließende reine Mausbewegung in Chromium und Playwright-WebKit 26 geprüft.
Screenshots/Ergebnis in `output/glt-html-integration/controls/` sowie `webkit/`,
Leiste visuell gesichtet. Vollständige
13-Material-Stunde zusätzlich mit echtem Room-Video geprüft: kein Seek während
des Ziehens über mehrere Heartbeats, genau einer beim Loslassen, bestätigte
Zielposition und Stopp bei 0. Auch zwei Lautstärke-Griffdrags über mehrere
Heartbeats: kein Zwischenbefehl, ein Release-Volume, tatsächliche Room-Lautstärke
bestätigt; danach kein Hover-Tracking. Alle 13 Materialien und Reload grün.
Laufendes Scrubbing zusätzlich mit echtem Mittag-Video, Filmclip und Wiki-
Animation/Stimme geprüft: bestätigter Zielwert, genau ein anschließendes Play,
fortschreitende tatsächliche Ausgabe und wieder mitlaufende Lehrerzeitleiste.
Pausiertes Scrubbing/Stopp bleiben pausiert. Unitfälle schützen gleiches Ziel,
explizite Pause, Abschnitts-/Verbindungswechsel und verspätete Bestätigung nach
Timeout vor unbeabsichtigtem Neustart. Ursprüngliche Dreipaketregression erneut grün
(einschließlich Wiki-Stimme, Navigation, Vollbildpfad, Pause bei Abdeckung und
Rückkehr lokal). Kein neuer Protokoll- oder nativer Appbuild nötig. Native
WebKit-Bediengefühl und physischer Beamer/Touch/Stift bleiben separat offen.

## Produktweg

- Bestehendes HTML-Paket → additiver Installer → Stundenmaterial → vorhandener
  Canvasrahmen. Interaktion, Geometrie, Abdecken, Annotationen und Behalten bleiben
  im vorhandenen Material-/Snapshotmodell. Kein zusätzlicher Videomaterialtyp.
- MP4 und WebM sind lokale Videoressourcen; TXT erhält Quellen-/Lizenznotizen.
  Höchstens 256 Dateien, 64 MiB Nichtmedien plus 512 MiB Audio/Video je Paket.
  Medien werden unter unveränderter Sandbox/CSP mit Range/206/416 gestreamt.
- Remote Canvas bleibt bei 64 MiB insgesamt und expliziter `live.state`-Freigabe.
  Der Client lehnt größere Pakete bereits vor dem Blob-Download ab. Lokale
  Unterstützung bedeutet ausdrücklich keine Online-Veröffentlichung. Die
  Server-MIME-Liste bleibt mit MP4/WebM/TXT kompatibel; insbesondere werden
  bestehende explizit veröffentlichte WebM-Audiopakete nicht durch die präzisere
  lokale Containerzuordnung unbrauchbar. Kein Service-Deployment ausgeführt.
- Video Lab exportiert denselben bestehenden Remotion-Player. Der Wiki-Bogen
  wird aus dem unveränderten generierten HTML-Snapshot in einem isolierten
  Shadow DOM gezeigt, nicht durch Lockerung von `frame-src`/`allow-same-origin`.
- Paketstatus enthält Folie bzw. pausierte Frame-/Filmposition. Wiederherstellen
  startet keine Wiedergabe. Laufende Medienzustände sind keine Archivdaten.

## Reproduktion

Frischen Video-Lab-HTML-Export erzeugen, dann:

```sh
node scripts/prepare-glt-html-test.mjs <gLT-Einheitsordner> <Video-Lab-Export>
node scripts/glt-html-browser-test.mjs <Playwright-Modul>
```

Staging: `output/interactive-materials/`; separates Testarchiv:
`output/glt-html-integration/test-archive/`. Drei Teststunden für Filmszenen,
Forschungsauflösung und Wiki-Tutorial. Der normale Installer verweigert andere
Inhalte unter einer schon installierten ID; keine stille Aktualisierung.

## Browser-Prüfstand

- Drei Pakete erfolgreich über denselben Parser und additiven Installer
  übernommen. Lokale Archivliste, reale CanvasSurface und Room Canvas geprüft.
- Beide MP4s im HTML abgespielt, Folien und pausierte Filmpositionen in beide
  Richtungen abgeglichen. Forschungsauflösung in beide Richtungen bedient.
- Wiki über seine echte Tastaturnavigation bis zur Original-Arbeitsbogenansicht
  durchgegangen, keine verschachtelten Frames und keine gelockerte CSP.
- Native Materialgeometrie verändert, Behalten und Reload ohne Autoplay,
  bestätigtes Zurücksetzen und vollständiges Abdecken geprüft.
- 365 Tafelraum-Tests inklusive des neuen Medienbudgettests, 39 gezielte HTML-/Room-Checks, zusätzliche
  Medienbudget-/Range-/Installerprüfungen sowie Typprüfung und Builds bestanden.
  Live-Service: alle 17 Tests einschließlich MIME-/Autorisierungsprüfung bestanden.
  Video Lab: Typprüfung, 85 bestehende Tests, Timeline-Smoke und Build erfolgreich.
- Browserwerkzeug-Besonderheit: Chrome liefert bei skalierten Room-Iframes
  unskalierte innere Control-Quads. Der Test verwendet deshalb reale projizierte
  Bildschirmkoordinaten mit normalem Pointer-Hit-Test, kein force/DOM-Klick.
- Ergebnisdatei und Screenshots: `output/glt-html-integration/`. Kein Nachweis
  der installierten nativen App, von Safari/iPad oder des physischen Displays.
- Alle acht Canvas-/Room-Standbilder geprüft; Filmnavigation bleibt frei,
  Originalbogen und Marker sichtbar. Standalone-Filmfolge zusätzlich mit zwei
  MP4s, Vollbild, Zustandsvalidierung und drei Fenstergrößen geprüft. Das aktive
  Testarchiv bleibt mit zurückgesetztem Inhalt ohne Testabdeckungen nutzbar.

## D-278: ein Wiedergabeort umgesetzt – nur Teststunden

Opt-in `playback.protocol=room-v1`: vollständiges HTML einschließlich Medien
ausschließlich im tatsächlichen Room-Fenster; Lehrerfläche und Lehrervorschau
erhalten eine leichte Fernsteuerung ohne Paketplayer/Medientags. Vorhandene
Film-/Remotion-Player behalten Zeitachse und HTML-Kontext. Systemaudio-Auswahl
bleibt beim Mac; keine erzwungene Lautsprecher-/HDMI-Umschaltung.

Flüchtige Freigaben/Befehle/Status verwenden den bestehenden Room-Kanal,
Generation und sichtbare Materialinstanz. 500-ms-Erneuerung, Ausgabestopp nach
2,4 Sekunden ohne Freigabe. Abdeckung/Zielwechsel/Stop widerrufen; verspätetes
Play wird erneut pausiert. Keine automatische Wiederaufnahme. Semantischer
Positions-/Folienzustand bleibt im bestehenden Behalten-/Resetpfad.

Ergänzende Prüfungen: echte Lehrerbuttons für beide MP4s und Wiki-Navigation,
Play/Pause/Seek, tatsächlich fortschreitende Wiki-Sprache, keine Medienrenderer
in Lehrerframes oder der geöffneten Raumvorschau, vollständige Abdeckung pausiert, Aufdecken startet nicht,
unterbrochener Host-Ausgang pausiert und deaktiviert Steuerung. Forschungsauflösung
weiter in beide Richtungen; Behalten/Reload, Reset und Geometrie unverändert.
Room geschlossen/neu geöffnet: Folie/Position bleiben erhalten, Wiedergabe erst
nach erneutem Lehrer-Play. Keine Autoplay-Policy-Ausnahme im Chrome-Test.
Fünf neue Protokoll-/Lifecycle-Tests: Quellenidentität, Grenzen, Sichtbarkeit,
Generation, alte Freigabe/Sequenz, Timeout und verspätetes Play. Bestehende
365 Basistests, 113 Room-/Live-Tests, Typprüfung und Build bestanden; Video Lab
85 Tests, Timeline-Smoke, Typprüfung und Build grün. Details/Screenshots in
`output/glt-html-integration/`, reproduzierbar mit den obigen Befehlen.

Voriger Testbestand vor der neuen Installation separat erhalten unter
`output/glt-html-integration/before-room-playback-2026-10-21/`. Aktives Testarchiv
enthält weiterhin genau die drei Teststunden; keine produktiven Archivschreibwege.
Keine neue native Version installiert, keine Veröffentlichung ausgeführt.

Reale Abnahme bleibt nötig: erweiterter Bildschirm, Mac-Lautsprecher vs. HDMI,
lange Wiedergabe, Seek/Pause, Folienwechsel, Room schließen/neu öffnen, mehrere
HTML-Materialien, Eingaben/Annotationen und Vergleich zur Spiegelung. Ein
Browser- oder Pakettest beweist weder ruckelfreie Übertragung noch den Grund
des zuvor beobachteten Ruckelns.

## Separate native Test-App – 21.10.2026

Auf ausdrücklichen Auftrag als **Tafelraum gLT Test.app** gebaut und geöffnet.
Eigene Kennung `app.jujies.tafelraum.qa-glt-html`, eigener Loopback-Port 49627
und eigenes WebView-/Notizprofil. Dessen `unterrichtsarchiv` ist eine geprüfte
Verknüpfung ausschließlich auf `output/glt-html-integration/test-archive`.
Normale Desktop-App, produktives Profil und öffentlicher Updatekanal unverändert.

`scripts/prepare-glt-native-test.mjs` erzeugt nach bestehendem QA-Workspace-Pattern
eine abgeleitete native Buildkopie: aktuelle kanonische Rustquellen, zwei
abgesicherte Portersetzungen, separate Bundlekonfiguration und auf den Testport
beschränkte native Rechte. Keine Testpfade oder Portänderungen im produktiven
Rust. Danach reguläre Desktopressourcen vorbereiten und mit Tauri `--bundles app`
im ausgegebenen Workspace bauen. Keine Updaterartefakte oder Veröffentlichung.
Artefakt: `output/glt-html-integration/native-test/Tafelraum gLT Test.app`.

Bei der nativen Vorbereitung gefunden und behoben: Der Desktopdienst verlor
Queryparameter an der paketgebundenen GET-Weiterleitung. Er erhält jetzt
`tafelraum-playback=output` sowohl am Redirect als auch an der internen
Weitergabe; Token-/Paket-/Cross-Site-Grenzen bleiben unverändert. Regressionstest
prüft leichte Steueransicht gegen Original-Ausgabeseite unter derselben Capability.
Alle 365 Basistests plus fünf Playbacktests, Rusttest, Build und tiefe strikte
Codesign-Prüfung bestanden.

Nativ sichtbar: nur die drei gLT-Teststunden; Filmstunde **gLT Test · Zwei
Lernszenen** geöffnet. Room gestartet und Ferris-Wiedergabe mit fortschreitender
Position (8–9 s) im reinen Lehrercontroller bestätigt. Nutzer probiert die
geöffneten Fenster selbst aus. Kein Nachweis eines physischen erweiterten
Bildschirms, der tatsächlichen Audioausgabe oder langfristiger Ruckelfreiheit;
Wiki-Wiedergabe in dieser nativen Test-App noch separat abzunehmen.

## Room-Vollbild – 21.10.2026

Lehrercontroller um bestätigtes `Room-Vollbild` an/aus ergänzt; Filmplayer und
Video-Lab-Viewer verwenden im Room den expliziten Hosthelfer statt der gesperrten
Iframe-Fullscreen-API. Native Room-Fenstervollbildfunktion bleibt der gemeinsame
Ausführungspfad, ohne Neuladen oder Änderung des gezeigten Ziels.

365 Basistests, acht Playbacktests, 113 Room-/Live-Tests, Typprüfung,
Desktopvorbereitung und separater nativer Build bestanden. Browserintegration
prüft Lehrerbutton, bestätigten Status oder sichtbaren Browser-Berechtigungsfehler
und unverändertes Ziel. Drei Empfängertests prüfen Canvas-Verfolgung, Materialansicht
und Ausschnittclip einschließlich alter Generation/Sequenz und unverändertem Scenezustand.

Native Paket-Vollbildtaste: Ein-/Ausschalten des Room-Fensters sichtbar bestätigt.
Auch Lehrerbutton im Auswahlwerkzeug nativ bestätigt: Room meldet anschließend
`Vollbild verlassen`, Film/Folie bleiben erhalten. Vorherige erfolglose Klicks im
Handwerkzeug waren dessen bestehender Canvas-Panpfad, kein bestätigter Fehler des
minimierten Room-Fensters. HTML-Steuerungen mit Auswahlwerkzeug bedienen.
Keine Aussage über Zweibildschirmhardware oder ruckelfreie Audio-/Videoübertragung
daraus ableiten.

Test-App unter dem bekannten separaten Pfad aktualisiert und signaturgeprüft.
Voriger Appstand `Tafelraum gLT Test-before-fullscreen.app`, Archivklon
`before-fullscreen-2026-10-21` und vorherige Film-/Wikipakete bleiben wiederherstellbar.

## Adaptiver Wiedergabeort – D-280, 21.10.2026

Ohne aktiven Room wird der Originalplayer im Lehrercanvas geladen; nur mit aktivem
Room wird daraus eine leichte Fernsteuerung. Deklarierte `room-v1`-Pakete behalten
denselben Fachzustands-/Archivpfad. Normal interaktives HTML unverändert.

Geprüft: lokaler Film mit fortschreitender Zeit → bestätigter Pause-Handshake →
Room am übernommenen Stand; keine Medienrenderer im Lehrercontroller oder in der
Vorschau. Reguläres Ende pausiert Room vor der Freigaberücknahme. Rückkehr zu lokal,
schnelles Schließen/Neuöffnen, Behalten/Reload und Zurücksetzen für beide Player;
Forschungsauflösung weiterhin bidirektional bedienbar. Initiale Zustandsmeldungen
eines Ersatzframes werden bis zur bestätigten Restore-Apply-ID nicht übernommen.
Unerwarteter Fensterausfall bleibt beim zuletzt bestätigten Fachzustand.

365 Basistests, zehn Playback-/Übergabetests, 113 Live-/Roomtests, Typprüfung und
Frontend-/Desktopressourcenvorbereitung bestanden. Reproduzierbarer Browsercheck
mit allen drei echten Paketen grün (`adaptive-browser-test.log`, `results.json`).
Native Test-App: lokale Filmwiedergabe sichtbar bei 19–23 Sekunden, Room-Start
übernimmt dieselbe Filmszene pausiert; Schließen bringt den Originalplayer ins
Lehrercanvas zurück. Zum Schluss Filmstunde lokal ohne aktiven Room offen.

Erneuter nativer Rustbuild scheiterte beim Linken an vollem Datenträger (`errno=28`),
nicht an Quellfehlern. Kein Rustcode für D-280 geändert. Stattdessen den bestehenden
geprüften isolierten QA-Wrapper verwendet: nur `desktop-resources/web` und `server`
aus dem aktuellen Desktopbuild ersetzt, ad hoc neu signiert, tief/strikt geprüft;
beide Entry-/Serverhashpaare identisch. Bundle-ID/Port/Profil unverändert. Voriger
Test-Appstand als APFS-Klon `Tafelraum gLT Test-before-adaptive.app` erhalten.
Nur das erneut erzeugbare Bundle im Cargo-Buildverzeichnis entfernt, keine
Unterrichtsdatei. Normale installierte App, produktives Archiv und öffentlicher
Updatekanal unverändert. Erweiterter Bildschirm, Audioausgang und längere
ruckelfreie Wiedergabe benötigen weiterhin reale Hardwareabnahme.

## Passive gleiche HTML-Oberfläche – D-281, 21.10.2026

Film- und Wiki-Testpaket deklarieren jetzt `playback.controllerEntry`. Filmhülle
aus derselben HTML-/CSS-Vorlage abgeleitet: Cover und Navigation bleiben erhalten,
Videos werden durch Poster plus `Wiedergabe im Room Canvas` und Steuerung ersetzt.
Wiki verwendet zwölf einmalig im pausierten Originalplayer erzeugte Abschnittsbilder.
Diese sind repräsentative Standbilder, keine framegenaue Spiegelung. Auswahl aus
dem kanonischen semantischen Frame; die Abspielzeit ist kapitelrelativ und darf
dafür nicht als globale Zeit interpretiert werden. Keine Änderung an Video-Lab-
Komposition, Stimme, Projektdatei oder den kanonischen gLT-Unterrichtsmaterialien.

Autoransichten verwenden denselben zentralen Controller-/Zustandsvertrag.
Keine Audio-/Video-/Canvas-/Iframe-Elemente und kein `viewer.js`/`player.js` in der
Lehreransicht; Dokument-CSP zusätzlich `media-src 'none'`. Ursprünglicher Entry
bleibt lokale/Room-Ausgabe. Fehlt eine deklarierte Autoransicht, echter Fehler
statt stiller Ersatz; Altmaterial ohne Deklaration behält die allgemeine Steuerung.
Restore-Frames bleiben bis zur bestätigten Apply-ID inert, damit kein erster
Klick vor dem Wiederherstellen seines Zustands arbeitet.

Prüfungen: 365 Basistests, elf Playbacktests, 113 Room-/Live-Tests, drei Tests für
die Autorvorlagen/Abschnittsauswahl, beide Paketprüfungen, Typen und Hauptbuild grün.
Vollständiger Browserlauf mit drei echten Paketen zweimal grün: lokaler Filmstart,
Room-Übergabe, identisches Filmcover-Markup, unverändertes Lehrer-Standbild während
Room-Play, Play/Pause/Seek/Lautstärkefähigkeit, Room-Vollbild, Abdeckung/Ausfall,
Schließen/Neuöffnen, Rückkehr zum Originalplayer und Behalten/Reload. Wiki-Stimme
läuft nur im Room, passende Arbeitsbogen-Vorschau bleibt auf der Lehrerfläche.
Forschungsauflösung weiterhin bidirektional unverändert. Eigene Produktoberfläche
visuell über `matching-film-teacher.png`, `matching-film-room.png` und die
Wiki-Screenshots geprüft; Canvas-Testfixture ist keine native App-Shell-Abnahme.

Die Test-App wurde ausschließlich über ihre bestehenden Web-/Serverressourcen
aktualisiert, ohne Änderung an Rust, Kennung, Port oder Profil. Web-Entry und
Playbackmodul hashgleich zum aktuellen Build/Quellmodul; neu ad hoc signiert und
tief/strikt verifiziert. Voriger Appstand `Tafelraum gLT Test-before-matching-surfaces.app`,
Archivklon `before-matching-surfaces-2026-10-21` und vorige Film-/Wikipakete erhalten.
Produktive App, Archiv und Updatekanal unverändert. Native Sichtprüfung nach
manuellem Entsperren bestätigt: Filmcover im Room, ruhende Filmvorschau mit
Play/Pause-Status im Lehrerfenster, laufendes Original-MP4 im Room (28 Sekunden),
danach Rückkehr zum pausierten lokalen Originalplayer. Auch das Wiki zeigt im
Lehrerfenster ein statisches Abschnittsbild mit Steuerung; im Room läuft der
Original-Erklärungsplayer, nach Beenden erscheint wieder der lokale Player.
Bei minimiertem Room erfolgte die Wiki-Statusaktualisierung merklich verzögert;
dieser Sichttest ist keine Latenz-, Audioausgabe- oder Beamerabnahme. Erweiterter
Bildschirm mit sichtbarem Room und tatsächlichem Mac-Ton bleibt vor Ort zu prüfen.

Reproduktion der Ableitung nach gesicherter Paketaktualisierung:
`node scripts/prepare-glt-html-test.mjs <Einheitsordner> <bestehender-Wiki-Export> <Playwright-Modulpfad>`.
Der dritte Parameter aktiviert die Autoransichten. Stills bleiben reine
Buildartefakte im Paket; bei anderem Export neu ableiten. Nicht den produktiven
Archivpfad verwenden. Runtime und Quellen bleiben voneinander getrennt.

### Native Player-Vollbild und Lehrer-Fernsteuerung (D-283, 21.10.2026)

Die ursprüngliche Player-Taste nutzt wieder das native Video-Vollbild. Der
zusätzliche Overlayknopf und die CSS-Vollbildprojektion wurden entfernt. Ursache
der Sperre war die fehlende Fullscreen-Delegation: Nur validierte lokale bzw.
Room-Playback-Entries erhalten diese Freigabe; passive Steueransicht, gewöhnliche
HTML-Pakete und Vorschauen bleiben gesperrt. Sandbox und Gerätezugriffe unverändert.

Die vorhandene Lehrer-Taste sendet denselben Vollbildbefehl an die laufende
Room-Instanz. Das Lehrerfenster bleibt Steuerung, kein zweiter Player und kein
Neuladen beim Verlassen. Browserprüfung mit drei echten Paketen grün, einschließlich
Video als tatsächlichem Vollbildziel, unveränderter Elementinstanz, fortlaufender
Abspielzeit und Escape. 365 Basistests, zwölf Playbacktests, 113 Live-Tests sowie
Typprüfung und Build grün.

Der Nutzer bestätigt die originale Taste direkt im nativen Room ausdrücklich:
„Funktioniert ohne Neustart“. Der native Fernaufruf aus dem Lehrerfenster ist
noch **nicht abgenommen**: Im automatisierten Sichttest blieb die Vollbildanzeige
aus; das Room-Fenster war minimiert. Daraus weder Erfolg noch eine gesicherte
macOS-Ursache ableiten. Nächster Handtest: sichtbares Room auf erweitertem Display,
Vollbildtaste im Lehrer-Player, danach Rückkehr ohne Neustart und Mac-Ton prüfen.

Nur Ressourcen der getrennten Test-App und das Testarchiv aktualisiert; App erneut
ad hoc signiert. Sicherungen `before-native-player-fullscreen-2026-10-21` und
`Tafelraum gLT Test-before-native-player-fullscreen.app` bleiben erhalten.
Produktive App, echte Stunden und Updatekanal unverändert.

### Lehrer-Fernvollbild repariert – D-285 (21.10.2026)

Native Diagnose nach D-283: Die Vollbildtaste meldet nach stabilisierter
Autoroberfläche tatsächlich `Vollbild wurde blockiert`. Die vorherige Vermutung
„nur minimiertes Room“ reicht damit nicht als Erklärung. Cross-Window-
`postMessage` transportiert die Benutzeraktivierung nicht; direkte Originaltaste
im Room und Browser-Harness waren daher kein Nachweis des Mac-Fernaufrufs.

Zwei gezielte Korrekturen:

- Autoransicht hängt Vollbildknopf und Steuerleiste nur beim tatsächlichen
  Zielwechsel um, nicht alle 350 ms. Regressionstest schlug vorher mit sechs
  unerwarteten DOM-Versetzungen fehl und ist nachher grün. Browser-Integration
  hält die Vollbildtaste bewusst 700 ms über einen Statusheartbeat gedrückt.
- Neuer macOS-Adapter `src-tauri/src/room_fullscreen.rs`: öffentlicher
  `WKScriptMessageHandler` ausschließlich in Room; nur Ausgabe-Subframes des
  eigenen Loopback-Ursprungs und eine UUID. Feste frame-spezifische Evaluation,
  kein übermittelter JavaScripttext. Der Callback kann nur einen ausstehenden
  lease-/token-/sequenzgeprüften Vollbildbefehl ausführen. 1,8-s-Timeout,
  alte/ersetzte/widerrufene Callbacks ohne Wirkung. Kein Playerneustart, keine
  zusätzliche Filmtaste oder globale Rechte-/Sandboxlockerung.

Prüfungen: 369 Basistests, 14 Playbacktests, 113 Live-Tests, vier Autoransichttests,
zwei Rusttests, Typprüfung/Build und kompletter Browserlauf mit drei echten
Paketen grün. Ein Marker-Laufzeittest überschritt während paralleler Rustbuilds
das bestehende 5-s-Limit; unveränderter kompletter Wiederholungslauf nach den
Builds grün (369/369). Kein Testgrenzwert verändert. Paketprüfung: 18 Dateien.

Separate QA-App mit bestehender Kennung/Port/Profil neu gebaut, signiert und
tief/strikt verifiziert. Nur deren Binary und Playback-Servermodul ersetzt;
Film-Autoroberfläche nur im staged Paket und Testarchiv aktualisiert. Native
Steuerprüfung zunächst durch minimiertes Room nicht belastbar. Danach hat der
Nutzer das Lehrerfenster nach vorne geholt und Room sichtbar gelassen. Der
anschließende native Test ist bestanden: Lehrer-Play startet den Room-Film;
Lehrer-Vollbildtaste öffnet das native Video-Vollbild (AX-Dialog enthält nur
denselben MP4-Player, Screenshot bildschirmfüllendes Video ohne Folienrahmen).
Escape stellt die vorige Room-Folienansicht wieder her, Player zeigt weiterhin
Pause/laufend bei 17 Sekunden statt Neustart bei null. Danach bei 25 Sekunden
pausiert. Kein App-/Iframe-Neustart im Vollbildzyklus. Lehrerfenster bleibt
Steueransicht, nur das native Room-Video wurde vergrößert. Physischer Beamer,
Audioausgabe und Langzeitstabilität bleiben getrennte Hardwareprüfungen.
Playbackmodul hashgleich zum geprüften Quellstand; Binary aus dem
separaten nativen QA-Build übernommen und mit dem Bundle erneut signiert.
Quellmaterialien, echte Stunden und normale App
bleiben unverändert. Sicherungen `before-teacher-fullscreen-2026-10-21` und
`Tafelraum gLT Test-before-teacher-fullscreen.app` erhalten.

## Vollständige Einheit / Mittag-Film · 21.10.2026

`scripts/prepare-glt-unit-test.mjs` ergänzt ausschließlich das markierte
`output/glt-html-integration/test-archive`: vierte Stunde
`test-glt-einheit-1-komplett`, Titel **gLT Test · Einheit 1 komplett**.
Vorhandene drei Teststunden bleiben erhalten. Kein Produktivimport, keine
Änderung der normalen App und kein neuer nativer Build erforderlich.

13 primäre HTML-Flächen und nummerierte Materialclips: Filmszenen, Filmvergleich,
Lernerfahrungen, Paarsuche, Rangfolge, bisherige Hattie-Einführung, Mittag-Film,
Forschungsauflösung, Wiki, Reflexionsbogen, Klarheitsauftrag, A/B-Lesetexte,
Workshopauftrag. Zwei weitere HTML-Pakete nur im Materialarchiv (Kursleitungs-
Musterlösung und Memory-Alternative). 32 normale Quellen: vorhandene Druck-PDFs,
Fuchs-DOCX/PNG, getrennte Lösungen und 22 Literatur-PDFs. Keine neuen Lerninhalte;
noch offene Einführung/Reserveaufgaben nicht als fertig ausgegeben.

Der Einzelvideo-Autorpfad in `scripts/glt-playback-controller/` verwendet den
bestehenden `room-v1`-Vertrag, dieselbe passive Steuerfläche und denselben
nativen Videoplayer. `single-video.js` hält nur die pausiert wiederherstellbare
Position, keine zweite Uhr. Keine App-Sonderbehandlung für Mittag. Filmdatei
bytegleich zur freigegebenen lokalen MP4, kein neuer Download/Transcode.

Reproduktion: `scripts/glt-unit-browser-test.mjs <Playwright-Modul>` prüft den
echten Canvas-/Archiv-/Room-Pfad am isolierten Port 5198. Die originale
Dreipaketregression bleibt separat unter `scripts/glt-html-browser-test.mjs`.
Beide nutzen dieselbe sichtbare Pointerprojektion für CSS-skalierte Iframes:
Chromium liefert dort unskalierte Locator-Koordinaten; Hover-Hit-Test und
echte Pointerklicks statt DOM-Dispatch/Force. Materialfokus wählt bewusst das
Canvasobjekt; für Inhaltsinteraktion wird anschließend auf Hand gewechselt.
Bei Formular-Rückübertragung zuerst das Lehrerfeld verlassen: Der vorhandene
Schutz unfertiger lokaler Eingaben ist keine fehlende Synchronisation.

Material- und Dateiplan: `output/glt-html-integration/complete-unit.json`;
Ergebnisse/Sichtbilder im selben Ausgabeordner. Keine neue native A4-Druck-
Freigabe durch Kopieren. Beamer, Mac-Audio, QR-Fotoabgabe und Mail-/Word-/
Druckablauf mit realen Teilnehmergeräten bleiben separat abzunehmen.

Prüfstand dieses Aufbaus: Paketprüfung aller 15 HTML-Pakete bestanden (bei A4
mit `requirePrint`); 32 kopierte Quellen per SHA-256 geprüft, Mittag-MP4
bytegleich. Autoroberfläche 6/6 Tests, Playbackvertrag 14/14, Typecheck und
`git diff --check` grün. Gesamtdurchlauf bestanden: alle 13 Materialien geladen,
Mittag lokal und nur im Room mit Play/Pause/Seek/Vollbildbefehl, Übergabe erhält
Position, Auflösung und Formular in beide Richtungen, 13 Materialclips/Objekte
nach Reload erhalten. Originale Dreipaketregression ebenfalls erneut bestanden.
Browser-Vollbild bestätigt tatsächlich geöffnet oder meldet die reguläre
Gestenblockade; der bereits separat native geprüfte D-285-Pfad bleibt derselbe.
Keine neue native Vollbild-/Beamer-/Audiofreigabe nur durch diesen Browserlauf.
Die komplette Stunde wurde in der separaten Mac-Test-App geöffnet, Room gestartet;
die zusätzliche Sicht-/Bedienprobe des Mittag-Films dort bleibt noch offen.

**Remote-Anschluss 0.1.70:** Der eingefrorene Teilnehmerbuild und Sitzungsdienst
wurden als `app-20261022-0170` bereitgestellt und nach erneut bestätigtem `idle`
aktiviert. Kein laufender Unterricht unterbrochen; feste Einladung erhalten.
17 Diensttests/Typprüfung, öffentlicher HTTPS-/WSS-Smoke mit zwei synthetischen
Teilnehmern, HTML-Zustand, Clips, Reconnect, Kick und Ende grün. Treffpunkt danach
wieder `idle`, beide Dienste `Running`. Öffentlicher Einstieg samt drei direkt
referenzierten JS/CSS-Assets bytegleich zum eingefrorenen Build. Kein Hostbuild,
Archiv oder echtes Material übertragen; keine neue Remote-Mediensteuerung.
Der historische öffentliche Smoke-Client deklarierte noch kein `supportsPatches`
und wurde bei HTML korrekt als veraltet abgewiesen. Nur dessen Auth-Fähigkeit
wurde an D-133 angepasst; keine Servervalidierung gelockert. Unveränderter
Folgelauf vollständig grün. Diese nach dem Appbuild korrigierte QA-Hilfe ist
separat nachgewiesen; signierte Appartefakte bleiben unverändert.
