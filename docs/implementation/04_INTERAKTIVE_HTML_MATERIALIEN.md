# Lokale interaktive HTML-Materialien

**Releasefortschreibung 22.10.2026:** Der vollständige HTML-Medien-/Room-/native Vollbildpfad ist mit 0.1.70 signiert veröffentlicht. Die heutige direkte Autorsteuerleiste einschließlich bestätigtem Scrubbing bleibt paketlokal (D-286); vorbereitete Pakete verwenden denselben veröffentlichten Appvertrag. Keine automatische Materialinstallation, Produktivmigration oder Remote-Videosteuerung. Frühere Beschränkungen auf die separate Test-App sind für den Programmcode historisch. Prüfgrenzen und Belege: Desktop-Updatedokument und `output/release-0.1.70/`.

**Stand:** 9. September 2026
**Status:** lokaler Paketslice und synchronisierter Live-Zustand umgesetzt; iPad-/Touchprüfung offen

## Zweck und Grenze

### HTML auf beiden Flächen, echtes Video als Ausnahme (D-295,28.10.2026)

Lokale HTML-Materialien bleiben im Room-Modus auf Lehrerfläche und Room als echte
bedienbare HTML-Instanzen sichtbar. Fachzustand wird über den vorhandenen
`tafelraumLive.getState()/applyState`-Vertrag gekoppelt; Fokus und Scrollposition
bleiben fensterlokal. Kein Videostream, DOM-Replay oder zweiter Archivzustand.
Das gilt auch für programmierte HTML-Animationen und Erklärungen.

HTML mit `playback: {protocol: "room-v1", initialState: {...}}` verwendet denselben
Originaleinstieg. `teacherView: shared` ist kein nötiges Opt-in mehr und wird beim
Lesen als Standard normalisiert. `controllerEntry` bleibt lediglich lesbare
Altmetadaten: seine Steuerdatei wird weder geladen noch benötigt. Es gibt keine
automatische Ersetzung eines HTML-Inhalts durch eine Fernsteuerung.

`window.tafelraumPlayback.getStatus()/execute(command)` steuert flüchtige Wiedergabe;
Status enthält Titel, Position/Dauer, playing, Navigation und Lautstärke. Derselbe
lokale Room-Kanal, Generation, sichtbare Instanz und erneuerte Output-Lease bleiben
verbindlich. Room ist bei deklariertem Playback die einzige hörbare Ausgabe. Ohne
Room läuft der Originalplayer lokal. Ohne deklarierte Playbackfähigkeit bleiben
normale HTML-Zustände gekoppelt; Room/vorschau sind stumm und Ton bleibt am Lehrer.
Die Sandbox und lokale Paketgrenze bleiben erhalten; Playback-Pakete sind weiter
nicht für Remote Canvas freigegeben.

Die gemeinsame injizierte Mirror-Brücke liefert `getStatus()/command(command,state?)`
und `tafelraum:mirror-change`. Native Paketadapter (z.B. der gemeinsame Video-Lab-
Player) folgen damit ihrer eigenen bestehenden Zeitachse. Andere vorhandene
getStatus/execute-Player werden zentral über dieselbe API gekoppelt: bewusste
Bedienung meldet Zustand und Wiedergabeabsicht, bestätigte Statusänderungen führen
die stumme Lehreransicht nach. Ein lokaler Spiegelungsschritt unterdrückt nur den
Rücktransport seiner eigenen Medienposition; keine Paketereignisse oder echten
Eingaben werden abgefangen. Frühe Befehle warten höchstens2,5s und begrenzt auf vier
Einträge auf den bestätigten Output; Verlust der Bestätigung pausiert die Ansicht.
DOM-Audio/Video und WebAudio sind im stillen Kontext gesperrt/stumm; keine zweite
hörbare Wiedergabe. Pakete müssen weiterhin fachliche Interaktionen korrekt über
die Zustandsbrücke melden; die App errät keinen privaten JavaScript-Spielzustand.

Zustand wird vor einem Wiedergabebefehl übernommen; Ausgabe wartet einen DOM-/React-
Commit ab und prüft danach Lease/Sequenz erneut. Native Adapter können zusätzlich
`execute(command,state?)` implementieren. Gleiches Zustands-ACK darf nicht erneut
pausieren. Start/Ende übergeben pausierten Zustand weiterhin über den bestehenden
Handshake; Wiederherstellung startet nichts automatisch. Laufzeitstatus und
Medienuhr gehören nicht ins Archiv.

**Ausnahme sind native Materialobjekte `video` (MP4) und `youtube`:** Im Room-Modus
wird der Lehrerdecoder/Anbieterframe entfernt und durch gemeinsame Controls ersetzt.
Genau ein hörbarer Player läuft im Room. Nummerierte Play/Pause/Seek/Volume-Befehle
und bestätigter Status mit Generation/Ziel/Revision/Sequenz benutzen den vorhandenen
lokalen Room-Kanal. Seek benennt die gewünschte Play/Pause-Lage ausdrücklich;
Volume verursacht keinen Seek. Rückmeldungen sind keine neuen Playbefehle. Eine
2,5s-Output-Lease begrenzt Verbindungsverlust, Zielwechsel pausiert alte Ausgabe,
Wiederverbinden/Room-Ende starten nicht automatisch. Passive Vorschauen laden keinen
weiteren Videodecoder. Clip-/Vollbildziel, Geometrie und Archivpfade bleiben bestehen.
Audio-Material allein bleibt am Lehrer und ändert kein Room-Ziel. Anbieter-Apps
mit eigener Brücke (z.B. Lerndeck) bleiben ihr eigener ausdrücklich begrenzter Vertrag.

Die bestehende native Vollbildaktivierung D-283/D-285 bleibt für deklarierte HTML-
Ausgabe-/lokale Player aktiv; Quellen-/Token-/Sequenzprüfung und Timeout bleiben.
HTML-Inhalt und Videos innerhalb eines HTML-Pakets werden nicht anhand von Titel,
Dateiname oder einzelnen Tags in neue Materialtypen umklassifiziert. Native MP4/
YouTube-Fernsteuerung betrifft die angehängten Videoobjekte der App.

Prüfungen: `scripts/generic-html-shared-browser-test.mjs`,
`scripts/language-bites-shared-browser-test.mjs` und
`scripts/room-video-controller-browser-test.mjs` mit Playwright-Modulpfad.
Belege `output/all-html-shared/`; native Installation separat im Desktopdokument09.

Ein geeigneter Agent kann kleine offlinefähige HTML-Interaktionen als normales Stundenmaterial erzeugen. Tafelraum listet das Paket im Materialbereich unter `Interaktiv`, platziert es über den bestehenden Canvas-Port und stellt es nach Reload aus derselben Canvasgeometrie wieder her. Das ist kein allgemeiner Webbrowser, kein beliebiger ZIP-Upload und keine zweite Materialbibliothek.

## Kanonisches Paket

```text
material/interaktiv/<id>/
  manifest.json
  index.html
  assets/
```

`<id>` muss dem Manifest entsprechen. Ein Minimalmanifest lautet:

```json
{
  "format": "tafelraum-interactive-html",
  "schemaVersion": 1,
  "id": "physik-antrieb-zuordnung",
  "title": "Was passt zusammen? – Motoren und Energie",
  "entry": "index.html",
  "live": { "state": "v1" },
  "defaultViewport": { "width": 1200, "height": 760 }
}
```

Ein HTML-Arbeitsblatt kann unabhängig von `live` und Inhaltsspeicherung eine druckbare A4-Vorlage deklarieren:

```json
"print": {
  "entry": "index.html",
  "page": "A4",
  "orientation": "portrait",
  "mode": "template"
}
```

`entry` verweist auf eine vorhandene lokale HTML-Datei im Paket. `orientation` ist `portrait` oder `landscape`. Dieselbe explizite Fähigkeit legt den sichtbaren Materialframe auf dem Lehrercanvas auf die vollständige A4-Proportion in dieser Ausrichtung fest; wenig genutzter Platz bleibt dadurch als Blattfläche sichtbar, statt das Material scheinbar ins Querformat zu stauchen. Der Vorlagenmodus lädt beim Drucken bewusst eine frische, skriptfreie Paketdarstellung: Eingaben, Quizstände und gespeicherter Canvas-Instanzzustand werden nicht übernommen. Tafelraum öffnet synchron eine eigene Druckansicht, sperrt dort Paketskripte und Netzverbindungen und startet aus dieser Ansicht den Systemdialog; bleibt dessen automatischer Start browserbedingt aus, ist dieselbe Ansicht mit einer direkten Druckaktion bedienbar. Spiele und andere Materialien ohne sinnvolle Papierausgabe lassen `print` weg und erhalten weder Druckbutton noch Papierformatzwang. Bildschirm- und Drucklayout trennt das Paket weiterhin über `@media print` und `@page`; auf dem Bildschirm füllt es den von Tafelraum vorgegebenen vollständigen Blattrahmen responsiv und randlos. Mehrseitige Vorlagen sind erlaubt; das Paket setzt dafür stabile Seitengrenzen und wird im echten Systemdialog auf beabsichtigte Seitenzahl, fehlende Leerblätter und abgeschnittene Inhalte geprüft. Tafelraum errät oder erzeugt keine fachlichen Seitenumbrüche. Im Safari-/Mac-Hauptdokument-Druckpfad werden ausschließlich für das Druckmedium die feste Canvas-Dokumenthöhe und ihre Überlaufbegrenzung aufgehoben (D-241). Sonst können korrekt deklarierte Folgeseiten abgeschnitten werden. Paket-Seitenränder und Seitengrenzen bleiben maßgeblich.

Erlaubt sind lokale HTML-, CSS-, JavaScript-, JSON-, Markdown-/TXT-, Bild-, Webfont-, browserfähige Audio- sowie MP4-/WebM-Videodateien. Versteckte Dateien, Symlinks, Pfadtraversal und unbekannte Dateitypen bleiben gesperrt. D-277 begrenzt lokale Pakete auf 256 Dateien, 64 MiB Nichtmedien plus 512 MiB Audio/Video; Medien laufen mit Byte-Ranges innerhalb derselben HTML-Sandbox. Remote Canvas bleibt unabhängig davon auf 64 MiB insgesamt und ausdrücklich deklarierte Live-Fähigkeit begrenzt. Keine automatische Veröffentlichung lokaler Medien. Prüfstand einschließlich D-278s Room-only-Wiedergabe: [43_HTML_MEDIA_INTEGRATION_TEST.md](43_HTML_MEDIA_INTEGRATION_TEST.md).

## Verbindlicher technischer Autorvertrag

Alle lokalen HTML-Materialien verwenden denselben Pakettyp. `Arbeitsblatt`, `Quiz`, `Spiel` oder `Simulation` sind keine technischen Archivklassen und erzeugen keine eigenen Renderer. Unterschiede werden ausschließlich über Paketinhalt und ausdrücklich deklarierte Fähigkeiten abgebildet.

Verbindlich sind Paketvalidität, Offlinefähigkeit, lokale Assets, Sandboxkompatibilität, responsive Bildschirmdarstellung, Tafelraums alleinige Canvasgeometrie sowie die Verträge deklarierter `print`- und `live`-Fähigkeiten. Frei bleiben Fach, Sprache, Didaktik, visuelle Gestaltung, Interaktionsform, Seitenzahl und innere Komponentenstruktur. Empfehlungen werden nicht zu technischen Fehlern hochgestuft, solange sie keinen bestehenden Produktvertrag verletzen.

Für Agentenarbeit ist `.agents/skills/tafelraum-interactive-html/SKILL.md` der fachunabhängige Erstellungs- und Prüfweg. Der Skill verweist auf diese kanonische Dokumentation, statt Regeln in einzelnen Fächern oder Paketen zu duplizieren.

## Agenten-Workflow

Die Arbeit besitzt drei getrennte Autorisierungsstufen:

1. **Ausgabebereich:** Material erzeugen, überarbeiten, validieren und zur Prüfung bereitstellen;
2. **Materialarchiv:** ein fertiges Paket additiv in eine ausdrücklich benannte Stunde installieren;
3. **Canvas:** ein bereits installiertes Material auf einer Unterrichtsfläche platzieren.

Ein Auftrag zum Erstellen, Anpassen, Vorbereiten oder Prüfen eines Materials umfasst standardmäßig nur Stufe 1. Er autorisiert weder eine neue Stunde noch Stufe 2 oder 3. Materialarchiv und Canvas folgen nur, wenn die Lehrkraft die jeweilige Stufe ausdrücklich verlangt; eine bereits zu Beginn entsprechend formulierte Bitte darf ohne zusätzliche Zwischenfreigabe vollständig ausgeführt werden.

Der Ablauf lautet daher:

1. Interaktion unter `output/interactive-materials/<id>/` erzeugen und dort im Browser prüfen.
2. Manifest ergänzen; externe CDNs, Tracking, Webfonts und Netzrequests vermeiden.
3. Ohne Archivänderung gegen denselben Parser wie Tafelraum prüfen. Für Arbeitsblätter ist `--require-print` verpflichtend; digitale Tools und ausdrücklich digital-only bestellte Arbeitsblätter verwenden die Basisprüfung ohne diesen Schalter:

```sh
node scripts/check-interactive-material.mjs \
  --source-dir <paketordner> --require-print
```

4. Nur auf ausdrücklichen Wunsch additiv in die Zielstunde einspielen:

```sh
node scripts/tafelraum-unterricht.mjs install-html \
  --lesson <lesson-id> --source-dir <paketordner> --mode worksheet \
  --url <app-adresse> --archive-root <durch-status-bestaetigter-pfad>
```

Die Organisations-CLI bindet den bestehenden Installer an die tatsächliche Archivbasis der laufenden App. Für Arbeitsblätter erzwingt `--mode worksheet` dessen `--require-print`-Prüfung; `digital` gilt nur für digitale Tools oder eine ausdrücklich rein digitale Fassung. Der direkte Installer bleibt für ausdrücklich beauftragte Offline-/Migrationsarbeit mit expliziter Archivwurzel erhalten, sein historischer Default ist keine normale Zielwahl. Der gemeinsame Paketleser lehnt damit eine fehlende Druckfähigkeit vor jeder Installation ab; die vorhandene Manifest-/Dateiprüfung bleibt maßgeblich. Die technische Prüfung bestätigt keine visuelle Druckfreigabe. Keine neue Laufzeitklassifikation oder Änderung an Altmaterialien.

Der Installer liest die stundenspezifische `materialBasis`, validiert das gesamte Paket und kopiert es atomar nach `material/interaktiv/<id>/`. Eine bytegleiche Wiederholung ist idempotent. Abweichender Inhalt unter derselben ID wird nicht überschrieben. Für ein bewusstes Update gilt daher zuerst die Archiv-Backupregel; anschließend werden Quelle und kanonisches Paket gemeinsam aktualisiert und erneut geprüft.

5. Eine Canvasplatzierung bleibt auch nach erfolgreicher Installation eine eigene, ausdrücklich beauftragte Handlung. Reine Archivinstallation endet mit dem sichtbaren Materialeintrag und verändert die Unterrichtsfläche nicht.

## Autorungsregeln

- Die Interaktion muss ohne Netzwerk funktionieren und auf einen echten veränderlichen Viewport reflowen.
- `Digital-interaktiv` und `Hybrid-Arbeitsblatt` sind Autorungsmodi, keine neue persistierte Materialtaxonomie. Ein ohne Druckwunsch angefordertes interaktives Element, Tool, Spiel, Quiz oder eine Simulation folgt einer kompakten App-Logik für den Canvas: selbsterklärend, fokussiert und touchbedienbar, aber weder an A4 noch an Arbeitsaufträge oder eine Arbeitsblattstruktur gebunden.
- Wird ohne anderes Ausgabeformat ein `Arbeitsblatt` oder `AB` verlangt, ist eine druckbare Hybrid-Ausgabe verbindlich: dasselbe HTML-Paket ist auf dem Canvas ausfüllbar und als leere A4-Vorlage druckbar. Bildschirm und Druck dürfen responsiv anders anordnen, behalten aber dieselbe Inhaltshierarchie, Aufgabenfolge, Formulierung und Zuordnung der Antwortfelder. Der Ausdruck ist bei Konflikten die strengere Abnahmebedingung. Ein ausdrücklicher Wunsch nach `digital-only`, Word, PDF, statischem ImageGen-Blatt oder einem anderen Format hat Vorrang.
- `Hybrid` bezeichnet bei Arbeitsblättern im üblichen Projektgebrauch ein einzelnes HTML-Paket, das am Bildschirm ausfüllbar ist und zugleich eine frische A4-Druckvorlage deklariert. Eine zusätzliche PDF-Datei ist ein weiteres Ausgabeformat, nicht die Voraussetzung für Hybridität, und wird nur bei entsprechendem Auftrag erzeugt.
- Aktuelle Canvas-Nutzung, frühere digital-only Beispiele oder heute kein geplanter Ausdruck sind keine ausdrückliche Ausnahme von der Druckfähigkeit; Nutzerquelle einer gewünschten rein digitalen Fassung im Brief festhalten. Bei Prüfung und freigegebener Installation von Arbeitsblättern immer `--require-print` verwenden.
- Vor dem Seitenaufbau wird ausdrücklich zwischen `digital-only` und `hybrid` unterschieden. Ein rein digitales Material darf Reflow, Scrollen und wachsende beziehungsweise vergrößerbare Eingabefelder nutzen und deklariert keine Druckfähigkeit. Bei einem hybriden Arbeitsblatt muss die Papierfassung unabhängig davon vollständig bearbeitbar bleiben; digitales Autowachstum ist kein Druckraum.
- Für offene schriftliche Antworten sind großzügige umrandete Schreibblöcke ein bewährter Ausgangspunkt für Tastatur, Stift und Papier. Schreiblinien bleiben möglich, werden aber nicht ohne fachlichen oder ausdrücklich genannten Grund zum Standard.
- Die feste Druckhöhe eines Antwortfelds folgt dem erwarteten handschriftlichen Umfang. Als Ausgangswerte dienen ungefähr `10–12 mm` für Begriff oder Kurzphrase, `20–25 mm` für einen Satz, `35–50 mm` für zwei bis drei Sätze und `45–60 mm` für mehrsätzige Notizen; Lerngruppe, Handschrift und Aufgabe dürfen bewusst davon abweichen. Vor Freigabe wird die leere A4-Fassung mit einer repräsentativen Antwort auf tatsächliche Schreibkapazität geprüft. Freier Platz an anderer Stelle der Seite gleicht ein zu kleines Feld nicht aus.
- Ein randloser PDF-Render belegt noch keinen sicheren Ausdruck. Die Vorlage deklariert realistische Seitenränder und wird über den tatsächlichen Browser- beziehungsweise Tafelraum-Druckpfad bei `100 %` auf Beschnitt an allen Seiten geprüft. Reichen Antwortkapazität und sichere Ränder nicht bequem auf eine Seite, wird eine bewusste zweite Seite angelegt; automatische Druckerskalierung ist kein Layoutbestandteil.
- Hilfen werden gegen die beabsichtigte Lernhandlung geprüft: Sollen Lernende Begriffe selbst finden, markieren, ordnen, beschriften oder erschließen, dürfen Fettdruck, Wortlisten, Überschriften oder Bildlabels das Ergebnis nicht unbeabsichtigt vorwegnehmen. Gezielte Scaffolds für andere Lernziele bleiben ausdrücklich möglich.
- Die sichtbare Bildschirmoberfläche reicht bis an den Paketviewport. Pakete erzeugen keinen zweiten Browser-Vorschauboden, Außenrand oder dekorativen Außenschatten um ihren gesamten Inhalt; Radius, Clip und Materialschatten gehören dem Tafelraum-Frame. Bei deklarierter A4-Druckfähigkeit besitzt dieser Frame schon auf dem Canvas die vollständige Papierproportion, während das Paket die Fläche randlos und responsiv füllt.
- Primäre Touchziele sollen mindestens 48 CSS-Pixel besitzen; Drag erhält einen gleichwertigen Tipp- oder Tastaturweg.
- Wichtige Karten und Ziele sollen bei der vorgesehenen Manifestgröße möglichst gleichzeitig sichtbar sein. Viele Paare besser in kurze Runden teilen als lange Dragwege erzwingen.
- Rein visuelle Hover- und Auswahlzustände bleiben flüchtig. Semantische Eingaben und Spielstände einer konkreten Canvas-Instanz werden dagegen standardmäßig über die materialnahe Speicheraktion im bestehenden Stunden-Snapshot gehalten. Die Lehrkraft kann dies für die laufende Instanz bewusst ausschalten; echte Änderungen gegenüber dem erfassten Startzustand lösen dann vor Stundenwechsel, Reload oder Schließen eine Verlustwarnung aus. Komplexe Pakete verwenden dafür denselben Zustandsvertrag wie `manifest.live.state = v1`; einfache `input`-, `textarea`-, `select`- und `contenteditable`-Felder werden ohne Paketanpassung durch die injizierte Bridge erfasst. Paket-`localStorage`, Framezustand und vollständiges HTML werden weiterhin nicht zur Unterrichtswahrheit.
- Druckbarkeit ist eine ausdrücklich deklarierte technische Fähigkeit, keine aus Titel, Ordner oder vermeintlichem Materialtyp erratene Klassifikation. Der Druckpfad läuft im selben restriktiven Paketvertrag und verändert weder Canvas noch Instanzzustand.
- Semantische HTML-Controls, Links, Eingabefelder und Elemente mit `draggable="true"` bleiben im Handmodus automatisch interaktiv. Eigene Pointer-, Drag- oder Dropflächen, die nicht als solches Element erkennbar sind, erhalten `data-tafelraum-interactive`; neutrale Überschriften, Texte und Layoutflächen dürfen das Attribut nicht pauschal erben, damit sie weiterhin Canvas-Pan ermöglichen.
- Bildbögen dürfen zur sparsamen Erzeugung mehrere Motive enthalten; das fertige Paket verwendet daraus lokale, passend zugeschnittene Assets.
- ImageGen darf bedarfsgerecht vollständige Illustrationen, einzelne freigestellte Objekte, kleine inhaltliche Piktogramme, Vignetten oder Texturen erzeugen. Freisteller werden mit echter Transparenz erzeugt beziehungsweise per Hintergrundentfernung aufbereitet und anschließend als lokale Paketassets abgelegt. Generierte Rastericons ersetzen keine Tafelraum-Bedienicons oder zugänglichen HTML-Beschriftungen; exakte Wörter, Zahlen und lösungsrelevante Labels bleiben möglichst HTML-Text. Bildgenerierung ist eine optionale Autorentscheidung und keine Voraussetzung für HTML-Material.
- App-Chrome, technische Pfade und Sandboxhinweise gehören nicht in das Unterrichtsmaterial.

## Projektion und Sicherheit

Das native transparente Canvasobjekt besitzt Position, Größe, Drehung, Auswahl, Verlauf und Archivprovenienz. `InteractiveHtmlCanvasFrame` leitet daraus einen isolierten Iframe ab. Die 48-Pixel-Griffleiste gehört Tafelraum und verschiebt den vollständigen Materialverbund. Im Handmodus bleiben semantische Controls und deklarierte Pointerflächen beim Frame; ein Drag auf neutralem Inhaltshintergrund verschiebt dagegen die Canvas-Kamera. Auswahl gibt den vollständigen Frame direkt frei. Unmodifiziertes Scrollen bleibt beim Inhalt, solange dessen getroffener Scrollbereich in Gestenrichtung noch bewegt werden kann. Am Rand oder ohne internen Überlauf übernimmt der vorhandene Canvas-Panpfad dieselbe Geste. `Ctrl`/`⌘` plus Rad/Trackpad nutzt unabhängig davon die punktzentrierte Canvas-Zoomrechnung. Die Sandbox meldet außerdem nur den aktuellen Root-Dokument-Scrollstand an den Elternframe. Eine neu über dem HTML erzeugte Canvasannotation merkt sich diesen Stand als materialgebundenen Anker; ihre sichtbare SVG-Projektion gleicht spätere Dokumentbewegungen flüchtig aus. Es entsteht keine zweite Positionswahrheit. Beim direkten Auswählen einer solchen Projektion übernimmt der Canvas wieder den Tastaturfokus, sodass Rücktaste beziehungsweise Entf, Undo und Redo denselben nativen Pfad wie bei Bild- und PDF-Annotationen verwenden.

Der Frame läuft mit `sandbox="allow-scripts"` ohne `allow-same-origin`, `no-referrer`, gesperrten Geräteberechtigungen und restriktiver CSP. Der Server liefert ausschließlich validierte Paketpfade, setzt `nosniff` und zeigt bei fehlendem Paket eine echte Fehlerfläche. Beliebige fremde HTML-Inhalte gelten damit nicht automatisch als sicher oder unterstützt.

## Lokaler Inhaltszustand

Nach Auswahl eines HTML-Materials schaltet das Speicher-Icon die lokale Inhaltspersistenz dieser Instanz ein oder aus. Sie ist beim Bereitwerden einer Instanz standardmäßig aktiv. Der Zustand wird nach Element-ID als höchstens 64 KiB großes JSON im normalen Stunden-Snapshot geführt; Eingaben lösen keinen Excalidraw-Verlaufsschritt aus. Ausschalten entfernt den gespeicherten Stand, ohne die laufende Instanz zu leeren. Solange der sichtbare Zustand danach vom beim Laden erfassten Startzustand abweicht, blockiert eine bestätigbare Warnung den Stundenwechsel; Reload und Schließen verwenden die native Browserwarnung. Unveränderte Instanzen warnen nicht. Das Zurücksetzen-Icon verlangt eine Bestätigung und wendet anschließend den Startzustand an. Dasselbe Paket kann deshalb mehrfach mit voneinander unabhängigen Ständen auf der Fläche liegen.

In Room Canvas kann dieselbe Materialinstanz zusätzlich im zweiten Fenster bearbeitet werden. Beide Eingaben laufen über die vorhandene fachliche Zustandsbrücke und denselben Stunden-Snapshot. Für Standardfelder verbindet der Host Änderungen je Feld; bei eigener Paket-API ist der JSON-Pfad die kleinste generische Konflikteinheit. Paket-`applyState` soll bei unveränderten Feldern den aktiven Textcursor nicht versetzen. Room-Scrollstand und Eingabefokus sind fensterlokal. Remote Canvas behält seine separate Freigabelogik.

D-247 ergänzt den bestehenden lokalen Lehrerfokus: Beim gemeinsamen Ausfüllen zeigt Room den blinkenden Schreibstrich oder die gewählte Textspanne des aktiven Lehrerfelds. Die injizierte Brücke misst Textgeometrie für auswählbare Standard-Textfelder, Textareas und `contenteditable`; Room projiziert sie am entsprechenden Feld, ohne dessen Fokus oder DOM-Auswahl zu setzen. Feldinhalt und sichtbare Textgeometrie müssen zusammenpassen. Eigene Room-Eingabe behält ihren nativen Cursor; das bestehende `Lehrkraft`-Label bleibt als Feldhinweis erhalten. Passwortfelder und Controls ohne lesbare Textauswahl erhalten keine Textprojektion. Der Dokument-Scroll bleibt fensterlokal; nur der innere Textviewport eines gerade nicht vorne bedienten Felds darf der Lehrereingabe folgen. Diese begrenzte Präsenz gehört ausschließlich in den lokalen Room-Kanal, nie in Paket-API, Stunden-Snapshot, Remote-Wire oder Raumvorschau. Neue Materialpakete benötigen dafür keine Anpassung.

Eigene JavaScript-Abläufe wie Quizrunde, Aufdeckstufe, Prüfrückmeldung oder Spielstand gehören ebenfalls in diesen semantischen Paketvertrag: `window.tafelraumLive.getState()`, `applyState(value)` und `tafelraum:statechange` nach jeder fachlichen Änderung. Die automatische Formularbrücke kann interne JavaScript-Variablen nicht erkennen. Dieser Room-Vertrag gilt auch ohne `manifest.live.state = v1`; dessen Deklaration würde die Paketdateien zusätzlich an Remote-Teilnehmer ausliefern und ist für lehrerseitige Lösungen ungeeignet. Vor der Übernahme eines solchen Pakets beide Klickrichtungen mit der konkreten Interaktion prüfen.

Die gemeinsame Eingangsprüfung weist neue HTML-Pakete mit ausführbarem Skript ohne `window.tafelraumLive.getState()` und `applyState(value)` ab. Sie gilt sowohl für `check-interactive-material.mjs` als auch für die Archivinstallation; bereits vorhandene Pakete bleiben beim Laden lesbar. Eine gesonderte Room-Einstellung im Manifest gibt es nicht. Diese Quellprüfung erkennt das Fehlen der Schnittstelle, aber nicht eine vergessene `tafelraum:statechange`-Meldung nach einer konkreten Aktion. Deshalb bleibt der Browsercheck `Lehrer klickt → Room folgt; Room klickt → Lehrer folgt` für jedes neue Skriptpaket verpflichtend. Pakete ohne Skript und mit gewöhnlichen Formularfeldern verwenden weiter die automatische Formularbrücke.

## Prüfen

Für jedes neue oder geänderte Arbeitsblatt zuerst die verpflichtende Druckfähigkeitsprüfung ausführen; digitale Tools und ausdrücklich rein digitale Arbeitsblätter prüfen denselben Vertrag ohne `--require-print`:

```sh
node scripts/check-interactive-material.mjs --source-dir <paketordner> --require-print
```

```sh
cd prototypes/surface-shell-a-b
npm run typecheck
npm test
npm run build
```

Zusätzlich im lokalen Browser: Materialfilter, Einfügen, direkter Tipp/Drag, Hand-Pan auf neutralem Inhaltshintergrund, unveränderte Control- und Dropinteraktion, Griffleistenbewegung, Größenänderung/Reflow, internes Scrollen, stabile Dokumentbindung einer zuvor erzeugten Annotation beim Vor- und Zurückscrollen, Mausradübergabe an den Canvas an beiden Scrollgrenzen, direkte Annotationsauswahl mit Rücktaste/Entf, Undo, Reload, Hell/Dunkel und fehlendes Paket. Bei deklarierter Druckfähigkeit gilt zusätzlich die [verbindliche Druckfreigabe](../unterricht/00_ARBEITSWEISE_UNTERRICHT.md#verbindliche-druckfreigabe-für-unterrichtsmaterial): echte Tafelraum-Druckaktion bei mindestens zwei unterschiedlichen Canvas- oder Inhaltszoomstufen prüfen, die aktuelle Druckfassung aus diesem Systemdialog als Prüf-PDF ausgeben und jede Seite gerendert visuell ansehen. Orientierung, tatsächliche Seitenzahl, lokale Assets, Antwortkapazität, Beschnitt und Leer-/Überlaufseiten anhand dieser Druckausgabe kontrollieren. Ein Headless-PDF oder ein anderer Browser genügt nicht als native Druckfreigabe. Modifizierter Trackpadzoom sowie Touch-, Stift- und Mehrpersonenbedienung bleiben auf der Zielhardware zu bestätigen.

## Referenzmaterialien und Mehrpakettest

### Gemeinsamer Live-Zustand (D-124; ersetzt D-109/D-122 für HTML)

- Nur Pakete mit `"live": { "state": "v1" }` dürfen als ausführbares HTML in Live Canvas erscheinen. Sie stellen `window.tafelraumLive.getState()` und `applyState(value)` bereit und melden fachliche Änderungen mit `tafelraum:statechange` oder einer gleichwertigen Subscription.
- Der Zustand ist JSON, höchstens 64 KiB und wird zusätzlich vom Paket fachlich validiert. Zufallsreihenfolgen gehören in den Zustand, damit Host und Teilnehmer tatsächlich dieselbe Aufgabe sehen. Verborgene Lösungen dürfen nicht allein durch den öffentlichen Zustand offengelegt werden.
- Das validierte Paket wird einmal pro Live-Generation über den Host in den flüchtigen Sitzungsdienst geladen. Teilnehmer erhalten eine eigene opake `sandbox="allow-scripts"`-Instanz aus einer nicht erratbaren Bundle-Adresse. Das Archiv, lokale Pfade und das rohe Canvasdokument bleiben getrennt. Paketdateien werden bei Stundenwechsel, Ende oder fehlender Szenenreferenz widerrufen.
- Lehreränderungen gehen als revisionsgebundener `material`-Patch an alle Teilnehmer. Der Dienst übernimmt einen gültigen Patch in den kanonischen Raumstand, sodass Reconnect und langsame Empfänger denselben Zustand im vollständigen Snapshot erhalten. Bei Freigabe sendet ein Teilnehmer seinen gewünschten nächsten Zustand an den Dienst; dieser prüft Generation, Revision und Berechtigung und leitet ihn an den Host. Erst der vom Host angewandte und gepatchte Zustand ist autoritativ. `supportsPatches` verhindert gemeinsam mit `supportsInteractiveMaterials` eine unvollständige Auslieferung an alte Clients.
- Zugriff verwendet pro Material `locked`, `all` oder `participants` mit Teilnehmer-IDs. Die aktuelle UI schaltet nur `locked` und `all`; die dritte Form ist die gemeinsame Grundlage für spätere Einzelzuweisung und kein zweites Rechtemodell.
- Der frühere DOM→SVG→PNG-Capture, dessen Polling und HTML-Bildcache sind entfernt. Native Bilder/PDF-Seiten behalten den sicheren Rasterpfad. Audio und YouTube bleiben unverändert.
- Teilnehmer können den Layoutviewport eines Materials lokal von 50 bis 200 Prozent vergrößern oder verkleinern. Dieser flüchtige Darstellungszustand wird weder als fachlicher HTML-Zustand noch über Live Canvas synchronisiert. Canvas-Pinch verändert weiterhin die räumliche Kamera; nur die sichtbaren `− / Prozent / +`-Controls lösen den materialinternen Reflow aus. Die Controls bleiben auch bei gesperrter Fachinteraktion erreichbar.
- Grenzen: Das Paket selbst ist für Teilnehmer technisch abrufbar, solange es in der Live-Szene verwendet wird. Deshalb dürfen Live-Pakete keine geheimen Lösungen oder privaten Daten enthalten. Gleicher semantischer Zustand bedeutet nicht garantiert pixelidentische Schriftmetrik zwischen Chromium und Safari. Echte iPad-Abnahme bleibt erforderlich.

### Bisheriger lokaler Mehrpakettest

Der erste Vertrag wurde in derselben Physikstunde mit drei bewusst unterschiedlichen Interaktionsmustern geprüft:

- `physik-antrieb-zuordnung`: zehn Bild-Text-Paare mit Pointer-Drag und gleichwertigem Antippweg;
- `physik-motoren-quiz`: fünf Einzelfragen mit sofortiger fachlicher Rückmeldung;
- `physik-viertakt-ordnen`: vier Karten auf nummerierte Positionen legen, tauschen und gemeinsam prüfen.

Alle drei Pakete wurden parallel aus dem Materialbereich eingefügt und blieben nach einem Board-Reload als getrennte Canvasobjekte erhalten; der flüchtige Spielstand startete wie vorgesehen neu. Quiz und Ablaufaufgabe reflowen in der ersten erzeugten Framegröße von ungefähr `600 × 370` ohne internen Überlauf. Der Mehrpakettest erzeugte keine Browserwarnungen oder Konsolenfehler.

Der Test deckte zwei paketlokale Fehler auf und führte zu begrenzten Materialkorrekturen: ein durch CSS überschriebenes `hidden` im Quiz sowie browsernatives Drag-and-drop in der Ablaufaufgabe. Letzteres verwendet nun Pointer-Events mit Bewegungsschwelle, sichtbarer Ziehkarte, geometrischem Dropziel und dokumentweitem Pointerabschluss. Daraus entsteht keine neue Tafelraum-Sonderlogik und keine neue Produktentscheidung; alle Pakete bleiben unverändert Nutzer desselben D-060-Vertrags.

## Druckgleiche Arbeitsblattseiten – D-259

Neue hybride A4-Arbeitsblätter verwenden gemeinsame feste Seiten in Bildschirm und Druck: `print.layout: "shared-pages"`, gleicher Entry, explizite `data-tafelraum-page`-Abschnitte. Aufgaben, Typografie, Zeilen und Seitenzuordnung bleiben gleich; editierbare Felder behalten den auf Papier vorhandenen Schreibraum. Formularzustand bleibt im bestehenden Bridge-/Stundenpfad. Objektgröße skaliert die Seite, kein innerer responsiver Umbruch. Spiele und rein digitale Werkzeuge behalten ihren responsiven Vertrag.

Die beigefügte `shared-pages.css` ist ein technisches Muster mit 12-mm-Rand für die konkret geprüften Drug-Harm-Blätter, keine allgemeine Gestaltungsvorgabe. Andere Vorlagen dürfen andere sichere Ränder verwenden, müssen Bildschirm-Innenabstand und Print-`@page`-Rand miteinander abstimmen. Vollständige Seitenboxen im Bildschirm, normale Fragmenthöhe mit explizitem Umbruch im Druck verhindern zusätzliche Leerseiten. Hoch-/Querformat, Seite-zu-Seite-Scrollen, Eingabe, Marker/Abdeckung und tatsächlicher Druckdialog sind abzunehmen. Bei Altvorlagen die alten Entries/Styles für vorhandene Instanzen erhalten; Aktivierung erst mit unterstützender App. Prüfstand: `30_SHARED_A4_PAGES_TEST.md`.

**Präzisierung D-259:** Druckgleiche Proportionen gelten für die Ausgangsdarstellung. Digitale Eingabeflächen dürfen weiterhin manuell vertikal wachsen und scrollen. Der innere Bildschirmabschnitt kann dadurch länger werden; der äußere A4-Träger bleibt proportional. Drucken lädt weiterhin eine frische Vorlage, ohne DOM-Größen, Feldscrollbalken oder Canvas-Instanzzustand.


## Lokale Satzprüfung für Video Lab – D-288 (Entwicklungsstand 27.10.2026)

Explizite optionale Manifestfähigkeit `sentenceCheck: {protocol: "video-lab-v1", projectId: "..."}`. Ausschließlich ein Satz mit kanonischen Aufgabenreferenzen, keine freie Modell-/Prompt-/URL-API. `window.tafelraumSentenceCheck.check(payload,{signal})` wird in deklarierte HTML-Pakete injiziert; der konkrete Lehrer-/Room-Ausgabeframe vermittelt an die lokale Archivroute. Sandbox und `connect-src 'none'` bleiben bestehen. Schlüssel/Prüflogik verbleiben im vorhandenen lokalen Video-Lab-Dienst. Private `sentence-check.json` neben der Archivbasis erlaubt feste Loopback-Origin und Projekte. Kein Anschluss für Remote oder passive Raumvorschau; Remote-Publikation wird abgewiesen. Antworten/Rückmeldungen über denselben semantischen Zustand, Requests nicht persistieren. Noch nicht in der installierten0.1.70 aktiviert. [Betrieb, Tests und Grenzen](44_LANGUAGE_BITES_SENTENCE_CHECK_TEST.md).

## Persönlicher direkter Satzprüfer – D-289

`sentenceCheck: {protocol: "tafelraum-v1", projectId: "words-in-context-01"}`
verwendet dieselbe isolierte Framebrücke und lokale Satzroute. Ausschließlich die
sechs appseitig freigegebenen Word-Families-Aufgaben; Browserdaten werden mit
kanonischen Wortart-/Formregeln verglichen. Providerkern/Modell/Prompt bleiben
Hostcode, persönlicher Schlüssel bleibt im macOS-Schlüsselbund. Einstellungen
liefern nur Präsenz und erlauben explizites Speichern/Entfernen. Kein Key im
Paket, Archiv, Browserstore oder Update, keine freie Netz-API. `connect-src 'none'`
und Remote-Ausschluss unverändert. Kein laufendes Video Lab erforderlich;
Internet wird nur für explizite Satzchecks benötigt. Der alte `video-lab-v1`-Weg
bleibt separat kompatibel, wird nicht automatisch gewählt. Prüfstand44 enthält
Betrieb, Entwicklungs-/Aktivierungsgrenzen und Tests.

### Gemeinsamer persönlicher KI-Anschluss

Der persönliche OpenAI-Key gehört zu Tafelraum, nicht zu einer Aufgabe, einem
HTML-Paket oder Widget. Einstellungen → **KI-Anschluss** verwaltet diesen einen
Schlüssel im bestehenden macOS-Schlüsselbund-Eintrag. Die Satzprüfung ist die
erste und aktuell einzige angeschlossene Funktion.

Künftige HTML-Embeds und Widgets können denselben Key über ausdrücklich
implementierte Hostfähigkeiten verwenden. Sie erhalten weder den Key selbst
noch eine allgemeine Provider-/HTTP-API. Der Ablauf bleibt:
`Material/Widget → freigegebene Funktion mit geprüften Eingaben → Tafelraum-Dienst
→ Provider → begrenztes fachliches Ergebnis zurück`.

Jede neue Funktion braucht einen eigenen klaren Vertrag für Fähigkeit, Eingaben,
zulässige Ziele/Regeln, Ergebnis, Größen-/Parallelitätsgrenzen, Abbruch und Fehler.
HTML nutzt eine quellgebundene Hostbrücke, eingebaute Widgets den passenden
Hostport; niemals Credentials in Rendercode, postMessage, Canvaszustand, Export,
Archiv, Browserstore oder Update kopieren. Nur die zur freigegebenen Funktion
gehörenden Eingaben an den Provider senden. Der Host löst Schlüssel und
Providerkonfiguration auf; Materialien liefern keine freien URLs oder Prompts.
Neue Fähigkeiten werden einzeln implementiert/geprüft. Diese gemeinsame
Schlüsselverwendung aktiviert keine weiteren Embeds, Widgets oder Remote-Rechte.

Die bisherigen technischen Namen (`/api/settings/sentence-check`,
`app.jujies.tafelraum.openai`, Account `personal-api-key`) bleiben kompatibel.
Der Routenname ist historisch, keine Bindung des Schlüssels an Satzprüfungen;
kein zweiter Credentialstore und keine Schlüssel-Migration für die Umbenennung.


## Historisch: erste gemeinsame HTML-Wiedergabeansicht (D-293, durch D-295 vereinheitlicht)

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

### Asynchroner Start und Wiedergabe-Restore (D-296)

Nach einem Wiedergabeinstanzwechsel bleibt HTML bis zur bestätigten Wiederherstellung
der gespeicherten semantischen Werte inert. Wird die Paket-API erst nach Iframe-load
bereit, wiederholt der Host auf ihre erste Zustandsmeldung denselben offenen Apply
mit identischer ID. Uninitialisierte Erstwerte werden dabei nicht übernommen; erst
die passende Bestätigung entsperrt. Keine zeitbasierte Freigabe ohne Datenerhalt.

### Materialbewegung (D-297)

Auswahlmodus: neutralen Hintergrund direkt zum Wählen/Ziehen verwenden; alternativ
den ausgewählten Außenrahmen ziehen. Separate HTML-/App-Griffaktion entfernt.
Inhaltstreffer bleiben vor dem vorhandenen Materialgestenpfad geschützt. Native
Hostevents übernehmen die gleiche laufende Geste beim Verlassen des Iframes;
neutraler Touchstart verhindert nur für diese Geste natives Scroll-Cancel.
Keine Paket-/Archivänderung. Bedienvertrag und Nachweise: UI-Brief05/D-297.

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

## Room-Eingabe nach Hostbestätigung (30.10.2026)

Der lokale Host meldet `input-ready: false` bei einem Übergang und bestätigt
`input-ready: true` erst nach akzeptiertem `shown` für seine aktuelle Generation
und Revision. Room prüft beim Freigeben dieselbe Generation/Revision; alte
Bestätigungen schalten eine neue Ansicht nicht frei. Hostseitige Schreibprüfung
und Datenzusammenführung bleiben verbindlich. Normale Zustandsprojektionen
sperren eine bereits bestätigte Ansicht nicht bei jedem Tastendruck.

Die Materialoberfläche ist bis zur Freigabe `inert`; die bestehende isolierte
HTML-Brücke übernimmt zusätzlich einen ausschließlich vom Elternfenster
akzeptierten `tafelraum:interactive-input-enabled`-Befehl. Sie sperrt das
Paketdokument und beendet alten Fokus. Dadurch bleibt auch ein zuvor fokussiertes
Iframe-Feld für Tastatur gesperrt. Bestehende Manifest-/Paket-APIs ändern sich
nicht; normale Lehrer-/Remote-Frames erhalten diesen lokalen Befehl nicht.
