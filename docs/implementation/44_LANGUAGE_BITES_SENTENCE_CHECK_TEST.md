# Language Bites: lokale KI-Satzprüfung · 27.10.2026

**Aktueller Stand: D-289, direkter persönlicher Prüfer; Abschnitt unten. D-288 beschreibt den historischen Companion-Anschluss.**

## Auftrag und Grenze
Expliziter Auftrag, den bestehenden Language Bite einschließlich KI-Satzprüfung in Tafelraum anzuschließen. D-288 ist ausschließlich ein lokaler Materialanschluss, kein allgemeiner KI-Assistent, kein KI-Schülerkonto und kein neuer Cloud-/Archivdienst. Produktives Archiv und installierte Desktop-App 0.1.70 bleiben unverändert. Der neue Appcode ist gebaut und in einer getrennten Testbasis geprüft, noch nicht nativ installiert/veröffentlicht.

## Datenfluss

`Check im HTML-Paket → injizierte tafelraumSentenceCheck.check → quellgebundene Lehrer-/Room-Framebrücke → POST im lokalen Archivserver → vorhandenes Video-Lab /api/assessment → bestehender OpenAI-Prüfer → correct/feedback zurück`.

Manifestfähigkeit:
```json
"sentenceCheck": {"protocol":"video-lab-v1","projectId":"words-in-context-01"}
```

Das vorbereitete Bite-Paket deklariert zusätzlich den bestehenden `playback.protocol=room-v1`-Vertrag samt semantischem Anfangszustand. Ohne Room läuft der lokale Lehrerplayer, mit Room genau ein tatsächlicher Ausgabeplayer und die vorhandene leichte Lehrersteuerung. Zwei gleichzeitig laufende Remotion-Instanzen dürfen sich nicht gegenseitig pausierte Positionen zurückmelden. Es entsteht kein neuer Playbackvertrag.

Private optionale Konfiguration `sentence-check.json` neben `unterrichtsarchiv/` (im Test neben `test-archive/`):
```json
{"version":1,"origin":"http://127.0.0.1:4174","projects":["words-in-context-01"]}
```
Kein API-Key in dieser Datei oder im Paket. Schlüssel und kanonische Aufgaben-/Modellregeln bleiben ausschließlich im vorhandenen Video-Lab-Backend. Kein Import aus einem persönlichen Quellpfad ins App-Bundle und keine doppelte Prüflogik. Video Lab muss lokal laufen, Internet für dessen vorhandene Modellanfrage verfügbar sein. Ohne Verbindung Fehler statt Lernbewertung. Keine automatische Dienstinstallation/Startfunktion.

## Grenzen und Invarianten
- Nur deklarierte Pakete, Projekt-ID aus dem Manifest und privater Projekt-Allowlist. Canonical Video Lab vergleicht Aufgaben-ID und Zielformen; veraltetes Paket kann keine neuen freien Prompts übergeben.
- Fester deklarierter Literal-Loopback-Ursprung, ausschließlich `/api/assessment`; keine mitgelieferte URL, Weiterleitung, Zugangsdaten oder beliebige Serveranfrage aus einem Material.
- Archivroute fordert gleiche lokale Origin, JSON und höchstens4096 Bytes; ein Satz höchstens500 Zeichen. Nur zwei parallele Vermittlungen, begrenzte Laufzeit und8192-Byte-Ergebnislimit. Antwort nur `correct`/`feedback`.
- Iframekommunikation an konkretes `contentWindow` und dessen unveränderte lokale Paketquelle gebunden; Unmount, Quellenwechsel und Vollabdeckung räumen auf. Abbruch/alte Antwort dürfen keinen neuen Satz überschreiben. Kein allgemeines CORS, kein `connect-src`-Loch, kein Same-Origin für das Sandboxpaket.
- Lehrer und tatsächlicher lokaler Room-Ausgabeframe nutzen dieselbe Brücke. Passive Raumvorschau und Remote-Teilnehmer erhalten keinen Zugriff. Remote-Publikation solcher Pakete wird abgewiesen.
- Fachliche Werte und fertige Rückmeldungen im vorhandenen `tafelraumLive`-JSON; keine laufenden Requests/Abortcontroller im Archiv. Video Lab verwirft veraltete Checks bei Restore. Eigene Hostbestätigung darf die Erfolgsstimme/automatische Fortsetzung nicht pausieren.
- Nur ausdrückliches Check startet den Prüfvorgang; Neuladen/Wiederherstellen erzeugt keine neue Modellanfrage. Keine neuen Satzlogs im Gateway. Bereits vorhandene Tafelraum-Behalten-Funktion kann Eingaben/Rückmeldungen in der Stunde speichern.

## Reproduktion ohne produktives Archiv
1. Aktuellen Video-Lab-Export mit neuem Satzclient erzeugen.
2. `node scripts/prepare-language-bites-test.mjs <frischer HTML-Export>` erzeugt staged Paket und ausschließlich `output/language-bites-integration/test-archive/`. Bestehende Testbasis benötigt die feste testPurpose-Kennung.
3. Oberfläche bauen, `createDesktopServer` mit dieser Testbasis, separatem Notesordner und `prototypes/surface-shell-a-b/dist` starten (Prüfung Port4977).
4. In der Teststunde Paket einfügen, Kapitel14 öffnen und einen Satz prüfen. Room Canvas getrennt starten und dort einen zweiten Satz eingeben.

## Belegter Prüfstand
- Neuer Gateway-/Capability-/Opaque-Bridge-/Route-/Endpointtest: Typ-/Projekt-/Hostbindung, fehlende Konfiguration, kein Fremdnetz, Body-/Ergebnislimit, Cancel, Rate-Limit, falsche Ergebnisse und nicht deklarierte Pakete.
- Vollständige Tafelraum-Appsuite:378 Tests grün, vorgelagerte14 HTML-Playbacktests grün; Typecheck/Build bestanden, bekannte Bundlegrößenwarnung.
- Erster Lauf mit Node aus dem Video-Lab-Pfad mit Leerzeichen: ein bestehender Document-Image-Fixture-Test scheitert am ausführbaren Worker-Shebang; beim normalen Tafelraum-Systemruntime-Lauf alle377 grün. Keine Änderung/Lockerung dieses Tests.
- Reales Browserpaket in unverändert opaker Tafelraum-Sandbox: `She assess the risks.` → Hinweis auf `assesses`; korrigiertes `She assesses the risks.` → akzeptiert.
- Room Canvas übernimmt denselben Satz samt Rückmeldung. Eingabe `The assessment was useful.` vorne über Check akzeptiert und auf Lehrerfläche gespiegelt. Keine zweite Modellanfrage durch Zustandsübertragung.
- Lehrer-Reload erhält beide Texte und fertige Bewertungen.
- Nach ACK-Korrektur zwei weitere korrekte experience-Sätze geprüft, Erfolgsablauf wechselt automatisch zum Rückblick.

## Noch offen
Native App-Build-/Installations-/Neustartabnahme und physisches Room-/Audio-/Touchgerät. Keine produktive Paketinstallation oder öffentliche Veröffentlichung in diesem Auftrag vorgenommen. Signiertes Appupdate und autorisierte Materialübernahme sind getrennte Schritte; ein HTML-Neuexport allein kann den alten nativen Server nicht erweitern.


## Ergänzender finaler Browserlauf
Nach Aktivierung des bereits vorhandenen `room-v1`-Vertrags im Testpaket: Lehrerfläche zeigt ausschließlich die bestehende leichte Fernsteuerung, Room genau den Bite-Player. Direkte Kapitelwahl und Wiederherstellung funktionieren ohne gegeneinander laufende Player. Im tatsächlichen Room-Ausgabeframe `An assessment useful.` → „Add a verb, such as is, after assessment.“; korrigierte Fassung erneut geprüft. Screenshotnachweise unter `output/language-bites-integration/evidence/` (korrekte Antworten und Fehlerrückmeldung). Prüfdienst ausgeschaltet → Verbindungshinweis, danach gestartet → erfolgreiche erneute Prüfung. Kein Fehler als falsche Lernantwort gespeichert. Tafelraum-Testserver4977 und Video-Lab-Dienst4174 bleiben getrennte lokale Prozesse.

Finale Checks:378 App-,14 vorgelagerte Playback- und113 Live-Tests grün; beide Tafelraum-Typprüfungen/Build bestanden. Video Lab verify95 Tests grün.89 Paketdateien zusätzlich byteweise gegen den lokal geladenen privaten Key geprüft, kein Treffer. Kein Keywert ausgegeben. Paketprüfung samt expliziter Fähigkeiten bestanden. Der finale Room-only-Ausgabeweg prüft auch fehlerhafte/korrigierte Nomen-Sätze; nach korrekter Fassung fährt der vorhandene Erfolgsablauf fort.

## D-289: direkter Betrieb ohne Video Lab (27.10.2026)

D-288 oben ist der historische erste Anschluss. Der neue beauftragte Weg:
`Bite → gleiche Framebrücke → lokale Satzroute → Tafelraum-Providerkern → OpenAI`.
Manifest `sentenceCheck: {protocol: "tafelraum-v1", projectId: "words-in-context-01"}`.
`sentence-check-tasks.mjs` enthält ausschließlich die sechs abgenommenen Zielregeln
(transfer-prescribe/verb+noun, transfer/verb+noun, transfer-experience/noun+adjective).
Paket darf keine neuen Ziele, Prompts, Modelle oder Endpunkte einschleusen.
Kein Provideraufruf beim Laden, Restore, Statuslesen oder Speichern des Keys.

### Persönliche Konfiguration

Einstellungen → KI-Anschluss → OpenAI-API-Key → Speichern. Einmaliger fester
macOS-Schlüsselbund-Service `app.jujies.tafelraum.openai`, Account `personal-api-key`.
`security` wird ohne Shell gestartet; der validierte Key kommt über private stdin,
nie argv/env/Datei. Read-Key bleibt ausschließlich serverintern; HTTP-Settings
geben nur supported/configured zurück. PUT/DELETE sind streng same-origin/loopback,
opaque Sandbox-Origins abgewiesen. Entfernen lässt den Key nicht in einer
Fallback-Datei/Umgebung weiterwirken. Kein Keycache und keine Klartextalternative
auf anderen Plattformen. Ein Appupdate verändert den Schlüsselbund nicht.

Für den beauftragten lokalen Versuch wurde der vorhandene Video-Lab-Key einmal
serverintern übernommen, ohne Ausgabe/Clienttransport; Video Lab selbst unverändert.
Die Settings erlauben danach unabhängig Ersetzen/Entfernen. Credentials liegen
weder im QA-Archiv noch im staged Paket oder in Desktop-Ressourcen.

### Gemeinsamer Prüfer und Abhängigkeiten

`prototypes/surface-shell-a-b/sentence-assessment-core.mjs` ist kanonischer
Providerkern. Video Lab enthält eine generierte bytegleiche Kopie; Synchronisierung
mit dessen `scripts/sync-sentence-core.mjs <kanonischer-Pfad>`. Beide Apps bleiben
zur Laufzeit eigenständig; keine persönlichen Quellpfade im Bundle. Hostadapter
lösen weiterhin ihre eigenen kanonischen Aufgaben und Credentials auf.
Das OS-Werkzeug ist Teil von macOS; keine zusätzliche Paketabhängigkeit.

### Prüfung / Reproduktion

- Echte isolierte Schlüsselbund-Probe mit synthetischem Testservice: speichern,
  lesen, ersetzen, löschen, anschließend tatsächlich nicht mehr vorhanden.
- Settings-Route: Präsenz ohne Key; lokale Änderung, fremde/opaque Origin,
  Zusatzfelder und Größenlimit geprüft. UI zeigt gespeicherten Key nie an;
  ungültige Eingabe wird abgewiesen und leert sich ohne bestehenden Key zu ändern.
- Direkter Gateway: kanonische Aufgabe vor Key-/Netzzugriff; keine freien Prompts,
  höchstens zwei Checks; Abbruch/Timeout, leere Credentials, Providerfehler,
  ungültige/zu große Antworten und Secret-Echo werden nicht als Lernantwort gewertet.
- Kontrollprobe bei nicht laufendem4174: zehn Sätze, zehn erwartete Urteile (acht Providerprüfungen und zwei lokale Wortform-Vorabhinweise; Begriff am28.10.2026 präzisiert),
  einschließlich aller drei Familien und falscher Wortform/Verbendung/Satzfragment.
  Synthetische Satzbelege: `output/language-bites-integration/direct-assessment-evidence.json`.
- Browser: `She assess the risks.` erhält Endungshinweis, korrigierter Satz wird
  angenommen und vorhandene Erfolgsstimme/Autofortsetzung bleibt wirksam.
- 384 App-Tests,14 Playback-Vortests,113 Live-Tests, beide Typprüfungen/Build grün.
  Video Lab95 Tests und Build grün, generierte Kernkopie bytegleich geprüft.

Getrennte Desktop-Testbasis: `scripts/prepare-language-bites-native-test.mjs`.
Eigenes App-ID/Profil, Port49678, ausschließlich markiertes QA-Archiv. Keine
produktive Materialinstallation, Veröffentlichung oder Änderung der normalen0.1.70.
Weitere native/Room-Vollbildbelege werden nach tatsächlicher Prüfung ergänzt.

### Native Abnahme D-289 / Vollbild

Separate ARM64-App `Tafelraum Language Bites Test.app` gebaut, lokal ad-hoc
signiert und `codesign --verify --deep --strict` bestanden. Bundled Servermodule
bytegleich zum Quellstand geprüft; keine Video-Lab-Quellpfade oder Dienststarts.
Die persönliche Schlüsselbund-Präsenz ist in der frisch gestarteten nativen App
sichtbar, Feld bleibt leer. Keine produktive App ersetzt.

- Tatsächlicher lokaler Player: `She has many experience.` wird mit Hinweis auf
  `experiences` nach `many` abgelehnt; nativer Screenshot `evidence/native-direct-assessment.png`.
- Room übernimmt dieselben Antworten/fertigen Rückmeldungen. Korrektur direkt
  vorne zu `She has many experiences.` wird geprüft und akzeptiert; bestehender
  Ablauf führt zur Zusammenfassung. Lehrer bleibt der leichte Controller.
- Vollbildtaste innerhalb des Bites ohne Room: nur Bite wird groß, ursprüngliches
  Fenster/Canvas und unveränderte Aufgabenwerte erscheinen beim Verlassen wieder.
- Derselbe native Vollbild-/Exit-Pfad im Room bestanden, kein neuer Player und
  Rückkehr zur vorherigen Ausgabe; `evidence/native-room-fullscreen.png`.
- Zusätzliche Browser-Geometrieprobe: Embed vor und nach Vollbild identisch
  (x=-12.005208, y=308.723938, Breite1000, Höhe625), kein Canvas-Zoom nötig.
- Persönlicher Key weder in90 Paketdateien noch Server-/Web-Ressourcen:311
  Dateien byteweise gegen den tatsächlichen Key geprüft, kein Treffer; kein
  Schlüsselwert ausgegeben.

Port4174 bleibt bei allen direkten Modell-/Browser-/nativen Prüfungen ohne
laufenden Dienst. Erweiterter Beamer/Touch, Langzeitbetrieb und der gesonderte
Lehrer-Fernaufruf der Room-Vollbildtaste sind hier nicht erneut hardwareabgenommen.

Native Neustartprobe ebenfalls bestanden: Test-App beendet, frisch gestartet;
„Hinterlegt“ bleibt sichtbar, Passwortfeld bleibt leer. Kein erneutes Hinterlegen
und kein laufender Video-Lab-Dienst notwendig.

## Benennung KI-Anschluss

Bereich/Dialog und zugänglicher Schließen-Name wurden auf „KI-Anschluss“ geändert.
Sicherheits-/Übertragungshinweis beschreibt freigegebene KI-Funktionen allgemein.
Schlüsselbund-Service, Account, Settings-Route und Satzprüfungsfähigkeit bleiben
unverändert. Kein erneutes Hinterlegen nötig. Gemeinsame Schlüsselverwendung für
künftige HTML-/Widget-Funktionen in Dokument04 und D-289 festgehalten; sie ist
noch keine Implementierung/Freigabe weiterer KI-Funktionen.

Abnahme der Umbenennung: Browserdialog „KI-Anschluss“ mit Status „Hinterlegt“ und
leerem Keyfeld sichtbar geprüft; Screenshot `evidence/ai-connection-settings.png`.
Build/Typprüfung, drei bestehende Schlüsselbund-/Settings-Tests und Diffcheck
bestanden. QA-Desktop-Webressourcen aktualisiert; normale installierte App und
produktives Archiv unverändert. Kein Provideraufruf für diese reine UI-Änderung.

## Lokale Aktivierung27.10.2026 · 0.1.71

Auf ausdrücklichen Nutzerauftrag jetzt in der normalen Desktop-App am bisherigen
Ort `~/Desktop/Tafelraum.app` installiert, nativ gestartet und Version
0.1.71 in der UI geprüft. Quelle und Ziel17.694 Bundle-Dateien bytegleich,
Codesign/Updatersignatur geprüft; bisherige Desktop-App0.1.69 unter den bestehenden
App-Rückfallkopien erhalten. Vorher tatsächlich laufende Instanz kam aus dem
0.1.70-Buildordner; sie wurde regulär beendet. Kein öffentlicher Updatekanal
verändert oder neuer Remote-Build veröffentlicht.

Vor Katalogergänzung vollständige produktive Archiv-Sicherung erstellt und erneut
getrennt wiederhergestellt/geprüft. Neue Stunde `lesson-language-bite-i-wordfamilies`
„Language Bite I: Wordfamilies“ in9/10 B-Kurs → Englisch → BiB über vorhandene
Archiv-Domänenfunktion angelegt. Bite plus Translation Drill und Lösung additiv
über validierenden Installer übernommen (AB jeweils --require-print); Materialliste
in der normalen App bestätigt. Keine Canvasplatzierung oder QA-Antworten übernommen.

Gemeinsamer KI-Anschluss zeigt den bereits hinterlegten Schlüssel. Zwei echte
Checks durch die tatsächlich installierte Paketroute: `She assess the risks.`
abgelehnt, `She assesses the risks.` angenommen. Port4174 ohne Dienst, kein
laufendes Video Lab. Native Room/Vollbild zuvor am gleichen Funktionsstand in
separater Test-App geprüft; keine erneute produktive Canvasbestückung nur für QA.

384 App-,14 Playback-,113 Live-Tests, Typprüfungen/Build und Rusttests bestanden.
Sechs synthetische Update-Dateien bei .69→.71 bytegleich.14.682 Bestandsdateien
kontrolliert: keine gelöscht; Katalog ergänzt. Beim nativen Öffnen folgt ein
bestehender freier neutraler Text gemäß D-275 der dunklen Fläche (#111111→#f4f3ef,
plus native Versionsfelder). Inhalte, Antworten und Geometrien aller bestehenden
Stunden unverändert; daher kein pauschaler Bytegleichheitsanspruch für dieses Board.
Reihenspiegel gezielt fortgeschrieben; neue Stunden-/Materialnotizen hinzugefügt.
Belege unter `output/local-install-0.1.71/`, Hardware/Klassenpraxistest weiterhin offen.

## Reguläre Veröffentlichung0.1.71 – D-290

Auf ausdrücklichen Folgeauftrag27.10.2026 in den bestehenden öffentlichen
App-Updatekanal übernommen. Derselbe eingefrorene und lokal getestete Build,
kein erneuter Materialimport oder Appaustausch. `latest.json` meldet0.1.71;
öffentlicher Download ist bytegleich im SHA-256 und seine Updatersignatur wurde
gegen den eingebauten öffentlichen Schlüssel geprüft. SHA-256:
`22222f71e2c5cb55dd7d8cdeac9f5a9269d4b6189a446cc80de15ecf5a97dfda`.

Ausgeliefert werden Programmcode und kanonische Zielregeln der ersten Satzprüfung.
Kein persönlicher Key, kein Unterrichtsarchiv, keine Bite-Medien oder AB-Pakete,
keine privaten Laufzeitkonfigurationen.221 Server-/Webdateien gegen den tatsächlichen
persönlichen Key geprüft:0 Treffer; ZIP ohne private Datenpfade. Andere Installationen
hinterlegen ihren eigenen Key unter KI-Anschluss. HTML/Widgets erhalten ihn nie.

384 App-/14 Playback-/113 Live-Tests, Rust/Typen/Build und native Prüfungen stammen
vom unverändert veröffentlichten Stand. Regulärer Publisher prüfte zusätzlich
öffentlichen Versionsstand, vollständigen Downloadhash und kryptografische Signatur.
Belege: `output/release-0.1.71/publication-proof.json`, `publish.log`,
`credential-scan.json`, `runtime-equality.json`, `source-fingerprint.json` und
zugehöriger Quellsnapshot. Lokale Materialaktivierung bleibt separat im Prüfstand44
und `output/local-install-0.1.71/` dokumentiert. Kein Remote-Dienst-/Teilnehmerupdate.

## Paketlokales Feedback-Layout / Typ-Effekt –28.10.2026

Nutzerauftrag aus Screenshot: Rückmeldung auf Höhe von Check und wie getippt
aufbauen. Nur Video-Lab-Projekt `words-in-context-01`, Renderer
`scenes/WordsInContext.tsx`, geändert; keine neue Tafelraum-/Provider-API oder
Apprelease. Feedback links und Check rechts teilen eine Gridzeile mit vertikaler
Mitte und reserviertem Platz. Vollständiger Text wird vorab layoutet; neue
Rückmeldung erhält einen kurzen CSS-Buchstabenaufbau (max.ca.1,2s), kein echtes
Provider-Streaming. Diese ausdrücklich gewünschte asynchrone UI-Rückmeldung ist
in Video-Lab-AGENTS/Architektur als enge Ausnahme dokumentiert; Remotion bleibt
alleinige Szenen-/Audiouhr. Keine Typ-Zustände im Archiv oder Room-Wire.

Screenreader bekommen den vollständigen Hinweis einmal; reduzierte Bewegung
zeigt ihn sofort. Bereits bekannte Hinweise bei Szenenbesuch/Restore ohne
Typ-Effekt. Antwortvalidierung, Erfolgsaudio und Freigaben bleiben unverändert.

Browserprobe mit echtem Check: „Assess is a word.“ abgelehnt, Rückmeldung auf
Buttonmitte (Differenz0px); zu Beginn69 von71 Buchstaben noch unsichtbar, danach
vollständig. Room übernimmt vorhandene Ergebnisse ohne neue Animation. Neuer
korrekter Satz „She assesses the risks.“ erhält den Typ-Effekt; vertikale
Abweichung unter0,000021px. Automatische Fortsetzung bis Zusammenfassung beobachtet.
Nativer Layout-Screenshot bestätigt dieselbe Zeile, ohne Überlappung.95 Video-Lab-
Tests, Typprüfung/Build und frischer Export/Paketcheck bestanden.
Belege: `output/material-checks/language-bites-feedback/browser-proof.json`,
`native-layout.png`, `install-proof.json` sowie verifizierte Archiv-Vollsicherung.

Geprüfte Fassung in der normalen Stunde „Language Bite I: Wordfamilies“ nur als
Paket ersetzt; Manifest-ID, Entries/Fähigkeiten und Boardzustand unverändert.
Vorfassung separat erhalten, Arbeitsblatt/Lösung nicht verändert. Laufende
Iframe-Instanzen nicht zwangsweise neu geladen; Bite zum Laden der neuen
Darstellung einmal neu öffnen. Klassenpraxistest weiterhin getrennt.

## Herkunft der Rückmeldungen geprüft –28.10.2026

Nutzerzweifel wegen sehr ähnlicher Rückmeldungen. Laufende normale App auf49317
mit tatsächlich installiertem Servercode geprüft; Status meldet hinterlegten Key.
Sechs synthetische Sätze über die normale stunden-/paketgebundene Satzroute:
fünf gelangen in den Providerzweig, einer ohne zulässige Zielform wird lokal
beantwortet. Alle sechs erwarteten Urteile bestätigt. Keine Schülerdaten benutzt
und keine Antworten/Boards im Produktivarchiv geändert.

Beispiele: „They assessed the fountain, but the results was strange.“ bekommt
„With ‘results,’ use ‘were,’ not ‘was.’“; „The experienced guide have two maps of
Mars.“ bekommt einen has/have-Hinweis. Dies sind keine festen Satzlösungen.

Zusätzlicher Kontrollaufruf durch denselben installierten Gateway und dieselbe
Schlüsselbund-Anbindung, Requestadapter reicht unverändert an echten fetch weiter:
OpenAI Responses, HTTP200, Modell gpt-6-luna, Response completed, echte Request-/
Response-ID und781 Tokens bestätigt. Keine Credentials im Bericht. Der normale
Appstart verwendet fetch als Standard, keine injizierte Testantwort.
Details `output/material-checks/language-bites-model-audit/report.json`.

Erklärung der Gleichförmigkeit:
- Fehlende erlaubte Wortform → fester lokaler Hinweis „Use the … form of …“;
  dafür findet kein Modellaufruf statt. Frühere pauschale Bezeichnung aller
  Rückmeldungen als Modellantworten war ungenau; Zehnerprobe oben präzisiert.
- Erfolgsfeedback ist im Prompt ausdrücklich auf „That's right!“/„Good job!“
  beschränkt. Auch echte Modellantworten wirken dadurch sehr ähnlich.
- Fehlerhinweise sollen A2–B1, kurz, mit konkretem Wort/Endungshinweis und
  vorgegebenen Stilbeispielen sein; ähnliche Fehlertypen erzeugen ähnliche Hinweise.
- Unveränderte bereits geprüfte Eingaben werden clientseitig nicht erneut geprüft;
  Restore zeigt ihre gespeicherte Rückmeldung. Typ-Effekt ist nur Darstellung
  und kein Beleg für echtes Provider-Streaming.

Nur diagnostisch geprüft/dokumentiert; keine Prüflogik, Promptvorgaben oder
Speicher-/Sandboxrechte im Rahmen dieses Auftrags geändert.

## Nutzerbeobachtung: „Assess in a sentence“ akzeptiert –28.10.2026

Lehrkraft berichtet positives Urteil für „Assess in a sentence“ in der
Verbaufgabe. Das erfüllt den beabsichtigten eigenen Beispielsatz nicht und ist
als Fehlurteil zu behandeln. Die Beobachtung bleibt gültiger Fehlerbeleg;
erfolgreiche Kontrollaufrufe widerlegen einen einzelnen Modellfehler nicht.

Aktuelle Nachprüfung über die tatsächlich laufende normale Paketroute: genau
„Assess in a sentence“ dreimal neu angefragt, dreimal false mit Hinweis auf das
fehlende bewertete Objekt. „Use assess in a sentence.“ ebenfalls abgelehnt.
Positive Gegenproben „Assess the risks before you begin.“ und „Assessing the
risks takes time.“ angenommen. Der gemeldete positive Ausgang wurde dabei
nicht reproduziert. Keine zuverlässige globale Ausschlussgarantie daraus ableiten.
Belege: `output/material-checks/language-bites-model-audit/meta-sentence-before.json`.

Grammatisch mögliche Imperative allein sind kein Ausschlussgrund; zu unterscheiden
sind wirkliche Verwendung (z.B. Assess the risks) und Metaaufforderung zur
Sprachaufgabe. Die aktuelle Anweisung deckt Wortnennung ab, enthält aber noch
keinen ausdrücklichen Kontrast für diesen genauen Metaaufforderungsfall.
In diesem Diagnoseauftrag keine nachträgliche Phrase hartcodiert oder ein
bereits gespeichertes positives Ergebnis als repariert ausgegeben.

## Korrektur mit eigenem Aufgabenbezug –28.10.2026 (D-293)

Der Screenshot mit Punkt ist ein bestätigter Fehlurteil-Beleg, auch wenn drei
frische Vorher-Aufrufe mit exakt diesem Text false ergaben (period-before.json).
Zusätzliches taskUse trennt den Aufgabenbezug ausdrücklich von der möglichen
Imperativgrammatik. Vier Kriterien müssen positiv sein; kein Regex-Verbot.

Echte Keychain-/Providerprüfungen: task-use-after.json12/12 passend.
Erweiterte Gegenprobe task-use-regression.json zunächst6/7: „Assess my sentence.“
zu streng abgelehnt. Promptkontrast präzisiert; task-use-final-contrast.json6/6,
inklusive zweimal korrekter Annahme dieses sinnvollen Imperativs und Ablehnung
von „Assess in a sentence.“/„Use assess in a sentence.“. Keine globale Garantie
für künftige Modellurteile. Auditdateien enthalten keine Schlüssel.

Explizite erneute Checks unveränderter Eingaben sind jetzt möglich, auch nach
altem gespeichertem grünem Urteil; Laden/Restore löst weiter keinen Request aus.
Dieser Absatz ersetzt die frühere Diagnosebeschreibung „unverändert = kein
erneuter Aufruf“ für die neue Paketfassung. Fehlende Zielwortform bleibt der
bestehende lokale Vorcheck. Erfolgstexte bleiben absichtlich kurz/begrenzt.

Prüfung: Tafelraum391/391 Tests im finalen Build, direkter Gateway4/4; Video Lab95/95 und
Typecheck/Build bestanden. Paketprüfung90 Dateien, digitales Material ohne
Druckdeklaration. Translation Drill und Lösungsbogen unverändert.

### Lokale Aktivierung0.1.73

Normale Desktop-App lokal ersetzt,0.1.72 als Rückfallkopie außerhalb des Archivs
behalten.17.694 Bundle-Dateien bytegleich zur geprüften Quelle; Codesign gültig.
Vollbackup mit45 Stunden/50 Boardständen separat verifiziert, synthetische
Update-Datenerhaltung6/6 bytegleich. Bitepaket unter gleicher ID/bytegleichem
Manifest atomar ersetzt; bisheriges Paket im Auditordner erhalten. Kein öffentlicher
Updatekanal verändert (öffentlich bleibt0.1.72).

Native App startet als0.1.73, vorhandener Schlüsselbundstatus configured:true.
Genau die gespeicherte grüne Eingabe „Assess in a sentence.“ wurde ohne Änderung
über den nun aktiven Check-Button erneut angefragt: danach false mit konkretem
Hinweis, Check bleibt erneut verfügbar. Andere Felder/Translation Drill erhalten.
Beleg native-recheck-0173.png; echte installierte Route zusätzlich dokumentiert
in native-0173-route.json:3/3 erwartete Urteile (Metaaufforderung false, zwei
sinnvolle Imperative true). Kein Video-Lab-Companion für diese Prüfung nötig.

Hinweis zum gemeinsamen Arbeitsverzeichnis: Der lokale Vollbuild enthält den
zum Buildzeitpunkt vorhandenen Appstand, einschließlich der parallel entwickelten
Timer-Ringbedienung (D-291). Keine isolierte öffentliche Freigabe anderer laufender
Arbeiten durch diese lokale Installation; keine Veröffentlichung0.1.73.

### Regulärer Updatekanal –28.10.2026

Auf Folgeauftrag ist derselbe0.1.73-Appstand nun regulär veröffentlicht. Der
vorherige „nicht veröffentlicht/öffentlich0.1.72“-Vermerk beschreibt die lokale
Aktivierungsphase. Öffentliches Manifest, vollständiger Rückdownloadhash und
kryptografische Signatur bestätigt; `output/release-0.1.73/` enthält die Belege.
Keine erneute Archiv-/Appinstallation oder Keyübertragung. Der paketlokale
Wiedercheck bleibt im bereits aktualisierten persönlichen Bite, nicht im Updater.

## D-293 – Gemeinsame Ansichten,0.1.76 lokal

Der frühere Room-only-Vermerk für die Lehreransicht ist für dieses ausdrücklich freigegebene Paket abgelöst: `playback.teacherView: shared`, ursprünglicher Inhalt auf beiden Seiten, Room als einzige Tonquelle. Satzprüfbrücke, Keyablage und Einzelanfragen unverändert. Vorhandene Paketinhalte/Medien bleiben bytegleich; nur Manifest und generischer Player aktualisiert. Browserabnahme und lokale Installation in Desktopdokument09; öffentliche Remote-Publikation weiter ausgeschlossen.
