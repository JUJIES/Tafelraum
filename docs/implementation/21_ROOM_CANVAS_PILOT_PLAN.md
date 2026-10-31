# Room Canvas – geprüfter Umsetzungsplan

**Stand:** 25. September 2026  
**Status:** erster Room-Pilot implementiert und 0.1.20 lokal installiert; D-205 erweitert den lokalen Quellstand um Medienclips, noch ohne nativen Release oder Hardwareabnahme. Sichtprüfung der installierten Oberfläche und echte Beamerabnahme siehe Testprotokoll 0.1.20.  
**Ziel:** am Montag, 28. September, mit vorhandenen Clips auf einem erweiterten Bildschirm präsentieren. Maßgeblich für die tatsächliche Verfügbarkeit sind Release und Installation, nicht dieser Plan allein.

**Folgestand D-206/D-210:** Der ursprüngliche Pilot unten beschreibt die zunächst lesende Ausgabe. Die lokal installierte Version 0.1.23 ergänzt eine kleine Hand-/Stift-/Markerleiste im Room-Fenster. Raumgesten werden im Hauptfenster in dieselbe Stunde übernommen; Room erhält keine eigene Archivpersistenz. HTML-Zustand und Inhaltszoom bleiben lehrergesteuert; Room erhält eigenständiges lokales Touch-/Mausradscrollen. Die Oberfläche, Grenzen und Abnahme stehen in [Room-Eingabe](../design/20_ROOM_CANVAS_INPUT_UI_BRIEF.md) und [Teststand](23_ROOM_CANVAS_INPUT_TEST.md).

## Tatsächlicher Stand des ersten Piloten

Die lokale Steuerung verwendet ein Anzeigeziel `Canvas`, `Clip` oder `Material` und einen eigenen Room-Empfänger. Die native App öffnet ein zweites Fenster über denselben lokalen Server und überträgt bereinigte Szenen, Bildassets, HTML-Zustand, Root-Scroll und bewussten Zeiger per `BroadcastChannel`. Room speichert keine zweite Stunde. Ein bestätigter Stand wird in der Raumvorschau gezeigt. Cliprahmen bleiben während der Präsentation auf der Lehrerfläche erreichbar; die manuelle Host-Umschaltung `Frei`/`Clip` entfällt. Remote verwendet weiter seine freie Teilnehmerkamera und bestehende Zugriffsregeln.

Der lokale HTML-Pfad lädt auch gültige Pakete ohne `live.state = v1`. Standardfelder und Paketzustand wurden mit einem vorhandenen Formular im Browser verglichen. Beliebige JavaScript-Effekte und innere Scrollbereiche sind nicht automatisch synchron. Im ersten veröffentlichten Pilot waren Audio, Video und YouTube noch Platzhalter. D-205 schloss sie lokal im Room-Materialclip an. D-240 nimmt Audio aus diesem Anzeigeweg: Es läuft am Lehrergerät, ohne das Room-Ziel zu ändern; Video und YouTube behalten den Anschluss; Apps und fremde Websites bleiben ausgeschlossen. `Material zeigen` ist in diesem ersten Schnitt lokal für Room verfügbar, bei Remote noch nicht. Der saubere Abschlussstand und die offenen Hardwaretests stehen in [Testprotokoll 0.1.20](22_NATIVE_APP_UPDATE_0_1_20_ROOM_CANVAS.md).

## Kritische Befunde

Die Erweiterung passt zur bestehenden Trennung von Lehrerkamera und öffentlicher Ansicht. Ein separates Fenster ist dafür richtig. Der erste Plan unterschätzte vier Stellen:

- `Frei` war auf dem Raumbildschirm nicht eindeutig definiert.
- Der Viewer vermischt Teilnehmer- und Vorschauverhalten über `previewAssets`. Ein neues Fenster darf nicht durch diesen Nebeneffekt zur Raumansicht werden.
- `boundedCamera` passt den Clip ein und begrenzt Navigation. Eine gemeinsame sichtbare Schnittkante für Canvas, HTML, Anmerkungen und Zeiger außerhalb des Clips ist im Viewer bisher nicht erkennbar. Ein gezielter Randtest muss verhindern, dass Nachbarinhalt bei abweichenden Bildschirmformaten erscheint.
- Die HTML-Bridge erfasst Standardfelder oder einen expliziten Paketzustand, aber keine beliebigen JavaScript-Effekte. Scrollposition, Inhaltszoom, Layout und Anmerkungen sind zusätzlich zu behandeln. Statisches HTML ohne Zustands-API muss trotzdem laden.

Codegrundlage: `src/live/LiveCanvasControls.tsx`, `live-host.ts`, `LiveViewerCanvas.tsx`, `viewer-camera.ts`, `LiveInteractiveMaterialLayer.tsx`, `src/canvas/InteractiveHtmlCanvasFrame.tsx` und `interactive-html-state-bridge.mjs` unter `prototypes/surface-shell-a-b/`.

## Bedienvertrag für die Umsetzung

Ein gemeinsamer Einstieg **Präsentieren** bietet **Room Canvas** und **Remote Canvas**. Vor dem Start wird die Ausgabe gewählt. Im ersten Schnitt läuft genau eine Ausgabe; zum Wechsel wird sie bewusst beendet. Panelöffnen allein startet, beendet oder übernimmt keine Sitzung. Eine laufende Remote-Sitzung wird nicht durch eine neue Standardauswahl verdrängt.

Beide Ausgaben verwenden dieselben Cliprahmen, Nummern und dieselbe Start-/Endaktion. Die zusätzliche manuelle Umschaltung `Frei`/`Clip` entfällt. Es gibt genau ein aktuelles Anzeigeziel: **Canvas**, **Clip** oder **Material**. Die jeweilige Handlung setzt dieses Ziel unmittelbar. **Starten** beginnt in der normalen Canvasansicht und öffnet bei Room Canvas genau ein öffentliches App-Fenster. Bei genau zwei erweiterten Bildschirmen startet es automatisch im Vollbild auf dem Bildschirm ohne Lehrerfenster. Ohne eindeutiges Ziel bleibt die manuelle Platzierung mit Vollbildaktion erhalten. **Fenster anzeigen** fokussiert das vorhandene Fenster; spätere Clipaktionen stehlen den Fokus nicht.

| Handlung | Zielverhalten |
| --- | --- |
| Clip anlegen | Rahmen speichern, ohne die öffentliche Ansicht zu wechseln. |
| Clipnummer oder 1–9 | Direkt diesen Clip zeigen; Lehrerkamera bleibt frei. Erneuter Aufruf setzt die Clipansicht zurück. |
| Material zeigen | Direkt nur dieses Material samt zugehörigen Anmerkungen und Abdeckungen zeigen. Canvasposition und benachbarte Objekte beeinflussen die eingepasste Materialansicht nicht. |
| Anderes Material oder andere Clipnummer | Aktuelles Anzeigeziel direkt ersetzen; kein Zwischenwechsel zur Canvasansicht. |
| × am aktuellen Anzeigeziel | Zur normalen Canvasansicht zurückkehren; die Präsentation läuft weiter. Der Button am bereits gezeigten Material zeigt nur dessen aktiven Zustand. |
| Aktiven Rahmen bewegen/vergrößern | Öffentliche Kamera bewegt sich wie bisher mit. Escape und Rückgängig korrigieren beide Ansichten. |
| Abweichendes Bildschirmformat | Clip vollständig und unverzerrt einpassen; freie Ränder zeigen neutralen Hintergrund ohne Nachbarinhalt. |
| Normale Canvasansicht in Room | Saubere öffentliche Ansicht folgt dem aktuellen Lehrerausschnitt auch bei offener Raumwerkzeugleiste. Handgesten lösen keine eigene Raumkamerabewegung aus. |
| Rückkehr zur Canvasansicht in Room | Empfohlener Rückweg: Lehrer und Publikum zum zuletzt gemeinsam gezeigten Canvas-Ausschnitt zurückbringen, dann Kamerafolgen fortsetzen. Private Vorbereitung wird dadurch nicht unbeabsichtigt zum Rückkehrziel. |
| Normale Canvasansicht in Remote | Bestehende freie Teilnehmernavigation beibehalten. Alle zu mir bleibt ein einmaliger Rückruf; die entfernte Moduswahl führt nicht still einen Remote-Kameralock ein. |
| Aktives Ziel gelöscht oder vorübergehend nicht verfügbar | Ausgabe neutral halten und der Lehrkraft das fehlende Ziel melden. Keine automatische Freigabe der gesamten Fläche; × kehrt bewusst zur Canvasansicht zurück. |
| Inhalt im gezeigten Ausschnitt bearbeiten | Änderungen erscheinen laufend. Kein zusätzlicher Halten-/Entwurfsmodus im Pilot. |
| Beenden oder Room-Fenster schließen | Room-Ausgabe beenden; Hauptfenster und Unterricht bleiben benutzbar. |
| Erneut starten | Genau ein Fenster mit vollständigem aktuellem Stand. |
| Stundenwechsel | Bewusste Wechselbestätigung wiederverwenden. Alte Generation und Zielreferenzen verwerfen. Nach vollständiger Übergabe in der normalen Canvasansicht der bestätigten neuen Stunde beginnen. |

Cliprahmen und Nummern müssen auf der Lehrerfläche während der Präsentation in allen Anzeigezuständen erreichbar sein; ihre Sichtbarkeit hängt nicht mehr am bisherigen Clipmodus. D-208, D-209 und D-216 präzisieren den aktuellen Stand: Die Rahmen bleiben auch bei der Vorbereitung sichtbar, `Clip aufnehmen` unterscheidet Materialtipp und Ausschnittzug, die Nummer bleibt am aktiven Rahmen stehen, und jedes Material besitzt höchstens eine Clipnummer. Anlegen und Bearbeiten eines inaktiven Rahmens zeigen ihn nicht automatisch. Der zuletzt gewählte Clip bleibt beim spontanen Materialzeigen gemerkt; Nummerierung und Reihenfolge ändern sich nicht.

Die Raumansicht besitzt weiterhin keine Presenter-Regie. HTML kann gemäß D-215 auch vorne direkt bedient werden; die Lehrkraft kann dasselbe Material im Hauptfenster bearbeiten. Die alte lokale Abdunkelfunktion darf gemäß Nutzerentscheidung durch die ausdrückliche Aktion Material zeigen ersetzt werden. Gewöhnliche Auswahlklicks wechseln niemals das Anzeigeziel. Eine bewusst aufgerufene Room-Vorschau verwendet das echte Bildschirmformat und den bestätigten Ausgabestand, keine Tablet-Voreinstellung. Ein bewusst ausgelöster Wechsel von Clip, Material oder Canvas bewegt ausschließlich den neuen, bereiten Room-Inhalt kurz und räumlich; reduzierte Bewegung zeigt ihn unmittelbar. Die Projektion und ihre Bestätigung bleiben unverändert.

## Kleinste saubere Architektur

1. **Native Machbarkeit zuerst.** Ein zweites Tauri-Fenster samt lokalem Kanal, Bild, Paketassets, Vollbild und beiden Schließwegen im gebauten Bundle prüfen. Danach genau einen Transportweg festlegen; keine zwei ungeprüften Alternativen bis zum Release mitschleppen.
2. **Gemeinsame Regie begrenzt herauslösen.** Genau ein Anzeigeziel (Canvas, Clipreferenz oder Materialreferenz) und Kamerabefehle gehören in eine kleine lokale Präsentationssteuerung. UI-Zustand und Ausgabe werden daraus abgeleitet, statt drei unabhängige Modusflags zu pflegen. Zugangsdaten, Remote-ACKs und Recovery bleiben in `LiveHost`. Keine Kopie des Hosts oder allgemeine neue Sitzungsplattform. Clipgeometrie bleibt im vorhandenen Stunden-Snapshot. Neue Materialprojektion muss beim Remote-Anschluss ausdrücklich unterstützt werden; interne Room-Daten dürfen nicht ungeprüft in den bestehenden Wire-Vertrag gelangen.
3. **Gemeinsame Darstellung mit ausdrücklicher Ausgaberolle.** Vorhandene Raster-, Kamera-, Cover- und Zeigerhelfer nutzen. Assetbereitstellung darf nicht implizit das Kameraverhalten bestimmen. Die sichtbare Clipmaske umfasst sämtliche Schichten. Kameraänderungen lösen keine erneute Rasterung aus.
4. **Ein Autor.** Das Hauptfenster liefert den Stand. Room lädt weder Archivnavigation noch Autosave/Outbox und schreibt keine Stunde. Unveränderte Bildassets werden bei kleinen Änderungen nicht erneut übertragen. Bei geschlossener Ausgabe läuft keine Room-Projektion weiter.
5. **Empfänger bestätigt Bereitschaft.** Öffnen → Verbindung → vollständiger Stand → Assets und HTML bereit → angezeigten Stand bestätigen. Erst dann gilt der Clip als gezeigt. Generation und Revision verhindern, dass verspätete Ergebnisse einen neueren Stand überschreiben. Inhalt, Kamera und HTML haben getrennte Änderungssignale innerhalb eines Zustandsmodells.
6. **Lebenszyklus behandeln.** Beim ersten Laden und Quellenwechsel bleibt die Ausgabe bis zum vollständigen Stand neutral. Bei kurzem Ausfall innerhalb derselben Stunde bleibt der letzte vollständige Stand mit Unterbrechungsanzeige erhalten; die Lehrerkontrolle meldet die Störung. Reconnect fordert einen vollständigen Stand an. Ende räumt Fenster, Assets und Listener auf. Hauptfensterverlust darf keine scheinbar aktuelle verwaiste Präsentation hinterlassen; App-Ende schließt beide Fenster.

Room Canvas benötigt weder Beelink noch Internet. Lokale Paket-URLs und Room-Darstellungsdaten dürfen nicht in den Remote-Wire-Vertrag geraten. Fenster und laufende Präsentationszustände bilden keine zweite persistierte Unterrichtswahrheit.

## HTML ohne Bindung an eine bestimmte Stunde

Jedes gültige lokale Paket muss laden können, auch ohne Remote-Fähigkeit `live.state = v1`. Dafür dient der lokale Paket-/Bridgepfad; die Remote-Freigabeprüfung bleibt bestehen.

- **Statisches HTML:** benötigt keinen erfundenen Leerzustand und wartet nicht vergeblich auf eine Zustands-API.
- **Standardformular:** vorhandene Bridge überträgt Werte. Abhängige Validierung, Ergebnisanzeigen und JavaScript-Effekte werden zusätzlich geprüft; das bloße Setzen eines Feldwerts beweist deren Gleichlauf nicht.
- **Eigene Interaktion:** Paket-API beziehungsweise Subscription muss alle fachlichen Änderungen einschließlich Zufallszustand ausdrücken. Ohne diese Quelle ist die exakte Übernahme beliebiger JavaScript-Zustände nicht garantiert. Die Umsetzung darf diese Grenze nicht mit „alle HTMLs synchron“ verdecken.
- **Darstellung:** Room übernimmt logische Framegröße, Inhaltszoom sowie Root- und innere Scrollpositionen. Der HTML-Inhalt beginnt wie auf der Lehrerfläche unter der 48 Canvaspixel hohen Material-Titelleiste; Room und Raumvorschau zeigen dafür nur einen nicht bedienbaren Titel. Die Bildschirmgröße skaliert die Ausgabe, sie erzeugt keinen anderen Aufgaben-Umbruch. Anmerkungen bleiben an derselben Dokumentstelle und werden korrekt beschnitten. Room-Darstellungswerte bleiben flüchtig; individuelle Remote-Ansichten werden nicht global umgestellt.

Vor Pilotfreigabe den vorhandenen Paketbestand lesend nach Zustandsfähigkeit sichten und repräsentative statische Materialien, Formulare, eigene Interaktionen und scrollende Dokumente prüfen. Die Lehrkraft muss keine Stunde vorab benennen. Fehlende Paketverträge konkret dokumentieren und bei beauftragter Materialänderung nach der Archiv-Backupregel ergänzen. Ein Paketcheck kann deklarierte Fähigkeiten prüfen, aber die Vollständigkeit beliebiger JavaScript-Zustände nicht automatisch beweisen.

## Reihenfolge bis zur nutzbaren App

| Schritt | Fertig, wenn … |
| --- | --- |
| 1. Nativer Fenster-Spike | Zweites Fenster, lokaler Kanal, Assetladen, Vollbild und Schließwege im Bundle funktionieren. |
| 2. Anzeigeziele | Canvas → Clip 1 → Material → Clip 2 → × funktioniert ohne Modusschalter. Clipanlage wechselt die Ausgabe nicht; Nummern bleiben erreichbar. Room-Kamerafolgen gilt nur in Canvas. Farbige Nachbarobjekte bleiben außerhalb des Clips beziehungsweise der isolierten Materialansicht unsichtbar. |
| 3. HTML und laufender Inhalt | Statisches HTML, Formular, Paket-API, Inhaltszoom, Scroll und Anmerkungen stimmen überein. Stift/Marker und Zeiger bleiben flüssig; Clipwechsel lädt HTML nicht neu. |
| 4. Recovery und Regression | Schließen/Öffnen, Stundenwechsel, verzögerte Assets, verspätete Updates und Kanalunterbrechung sind geprüft. Remote besteht seinen bisherigen Kernflow. |
| 5. Gebaute App abnehmen | Derselbe Flow am echten erweiterten Display; Offlinebetrieb, Auflösungen, Fokus und eine durchgehende Präsentationsprobe mit vielen Clipwechseln. |
| 6. Geprüften Stand installieren | Releasevertrag erfüllen und genau das abgenommene Artefakt installieren. Danach Kernflow in der installierten App öffnen. Spätere Änderungen erfordern die betroffenen Checks erneut. |

Typprüfung, relevante Canvas-/Live-Tests, gezielte Synchronisations-/Generationstests, Host-/Teilnehmerbuild und Rust-Prüfung gehören zum Abschluss. Browserprüfung allein bedeutet nicht „montagsbereit“. Ohne echtes zweites Display bleibt genau diese Abnahme offen und wird so berichtet.

## Umfang und Dokumentation

Zielumfang: Room-Fenster, durch direkte Aktionen bestimmte Canvas-/Clip-/Materialansicht, Rasterinhalte, HTML-Anzeige/Zustand, Zeiger und verlässlicher Fensterlebenszyklus. Die zusätzliche Materialansicht ist ein eigener Implementierungs- und Abnahmeschritt und darf nicht ohne Prüfung als für Montag verfügbar gelten. D-204 führt die gemeinsame Nummerierung ein; D-205 erweitert sie auf Audio, lokales Video und YouTube ausschließlich in Room Canvas. Der Lehrerplayer ist die hörbare Quelle am Mac. Das zweite Fenster zeigt stummes Video beziehungsweise den Audiostand und gleicht Play, Pause und Sprünge laufend ab. Die beiden YouTube-Player können unterschiedlich puffern. D-224 ergänzt die automatische Bildschirmwahl bei genau zwei erweiterten Displays. Gleichzeitige Room-/Remote-Ausgabe, Einzelrechte, eigene Arbeitskopien und Remote-Medienfreigaben folgen erst nach eigener Produktentscheidung. Fremd-Apps und Websites bleiben ausgeschlossen; Ladefehler dürfen nicht als erfolgreich präsentierter Inhalt erscheinen.

[UI Brief](../design/19_ROOM_CANVAS_PILOT_UI_BRIEF.md) und dieser Plan dokumentieren die Zielumsetzung. Nach Implementierung README, Desktop-Testprotokoll, Live-Dokumente und Decision Log auf den tatsächlich geprüften Stand bringen. Historische Entscheidungen und Hardwaregrenzen bleiben nachvollziehbar.


### Audio bleibt bei der gewählten Ansicht (D-240)

Audio startet, pausiert und springt am Lehrergerät, ohne Canvas, Ausschnitt- oder Materialclip zu wechseln. Neue Audio-Materialclips entfallen. Vorhandene Audio-Referenzen bleiben im Snapshot lesbar und am alten Rahmen entfernbar; sie werden weder migriert noch automatisch gelöscht und lassen sich nicht mehr zeigen. Video und YouTube behalten ihren bestehenden Play-zu-Material-Ablauf.
