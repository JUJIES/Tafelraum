# Gemeinsamer lokaler Agenteneinstieg und HTML-Pipeline

30.10.2026. Gemeinsame Entwicklung für `personal` und `public`; keine neue
Installation oder Veröffentlichung allein aus dieser Umsetzung.

## Produkt und Grenze

`Einstellungen → Agent verbinden` liefert einen Startauftrag für einen Agenten
mit lokalem Datei-/Werkzeugzugriff. Die App kennt ihren passenden Paketpfad,
ihre Node-Laufzeit und tatsächliche HTTP-Adresse. Der Agent liest das Paket und
prüft zuerst das aktive Archiv (`status`) und Lehreransichten (`sessions`).
Es wird kein Archiv als zweite Kopie angebunden, kein App-Key hinterlegt und
kein Cloud-/MCP-Zugang eingerichtet. Archivwahl bleibt bei der laufenden App.
Ein reiner Cloudchat benötigt weiterhin einen geeigneten gesonderten Zugang.

Die vier Projekt-Skills sind kanonisch für diesen Weg. Die parallelen persönlichen
Arbeitsblatt-/OpenAI-/MCP-Plugins und globalen Skills werden nicht eingelesen,
zusammengeführt, ersetzt oder geändert. Agentenspezifische Erkennung bleibt ein
Adapter; Markdown lesen und normale lokale CLIs ausführen genügt technisch.

## Ein Paket aus bestehenden Quellen

`scripts/prepare-agent-kit.mjs` verwendet eine feste kleine Dateiauswahl:
vier Skills, zugehörige Referenzen, bestehende Organisations-/Canvas-CLIs,
HTML-Prüfer/Installer samt ihren Laufzeitimports, Backuphelfer, gemeinsame
Produkt-/Materialverträge und zwei neutrale eigene technische Beispiele sowie den ausgewählten
Korpus aus 13 aktuellen Arbeitsblattreferenzen.
Root-README und AGENTS werden aus `docs/agent-kit/` übernommen; dadurch enthält
das Benutzerpaket keine privaten Entwicklerregeln. Es enthält keine Archive,
Namenslisten, Notizen, Schlüssel, globalen Plugins oder privaten Unterrichtsverläufe.
Nicht mitgelieferte optionale Vertiefungslinks werden im Paket als solche markiert.
Die kanonischen Quelldokumente bleiben dabei unverändert.

`agent-kit.json` hält Format `tafelraum-agent-kit-v1`, Appversion, Inhaltsrevision
und Datei-SHA256. Die Helfer bleiben bytegleich mit den Quellhelfern. Keine zweite
Validierungs-/Archivlogik und keine zusätzliche npm-Abhängigkeit im Paket.
Erzeugen ersetzt ausschließlich einen bereits markierten generierten Paketordner;
unbekannte Ordner und Symlinkziele bleiben erhalten.

## App-Laufzeiten

- Vite-Dev, Preview und Build erzeugen `agent-kit/` neben `dist/` aus den aktuellen
  Quellen; ignorierte Ausgabe, niemals eigene Materialablage.
- `prepare-desktop-resources.sh` erzeugt denselben Paketsatz unter
  `desktop-resources/agent-kit/` und übernimmt `agent-kit-server.mjs` in den Server.
  Der native Host liefert Ressourcen wie bisher über seinen gebündelten Node-Dienst.
- Der Desktop-/Quellserver erwartet `agent-kit/` neben seinem `webRoot`.
  Ohne Paket bleibt die App verwendbar, der Einstieg liefert einen klaren Fehler.
- `/api/agent-kit` ist ausschließlich lesend und nutzt Loopback-Host, exakten
  Origin oder CLI ohne Origin, `X-Tafelraum-Agent: 1`, keine Cross-/Same-Site-
  Freigabe und kein CORS. Es liefert keine Unterrichtsinhalte oder Credentials
  und bietet weder beliebige Dateizugriffe noch Schreib-/Uploadoperationen.

Das Paket im Appbundle bleibt unverändert. Agenten schreiben Entwürfe in einen
eigenen beschreibbaren Arbeitsordner. Der vorhandene HTML-Installer erhält seine
Archivwurzel ausschließlich aus dem bestätigten Live-Status; Materialauftrag,
Archivübernahme und Canvasvorbereitung behalten ihre getrennte Beauftragung.
Arbeitsblätter behalten `--require-print` und die tatsächliche Druckabnahme.

## Beispiele und Prüfgrenzen

`docs/agent-examples/` enthält ein Formular-Arbeitsblatt mit gemeinsamer A4-
Druckfähigkeit und ein digitales Auswahlelement mit explizitem Room-Zustandsadapter.
Es sind technische Beispiele ohne private Daten oder externe Assets; keine
universellen Unterrichtstemplates und keine tatsächliche Druckfreigabe.

`agent-kit.test.mjs` prüft Selbstständigkeit, bytegleiche Prüfer, Druckgate,
additive Installation in eine normal erzeugte Teststunde und lokale Zugriffsgrenze.
`test:agent-onboarding` liest das Paket aus der realen App, verwendet dessen
CLIs und prüft weiterhin Archiv-/Canvas-/Clip-/Reloadablauf in Chromium/WebKit;
zusätzlich den Dialog, technische AB-Prüfung und HTML-Archivübernahme.

Modell-/Agentenprogramme werden dadurch nicht automatisch eingerichtet. Der
Referenzlauf prüft Fähigkeiten ohne Modellaufruf; insbesondere keine separate
Claude-/lokale-Modell-Abnahme, keine didaktische Qualitätsgarantie und keine
native Installation. Eine bereits installierte ältere App erhält dieses Paket
erst durch einen ausdrücklich beauftragten neuen Build und Appaustausch.


## Erstlaufbefunde

Der neue reale HTML-Durchlauf fand einen StrictMode-Lebenszyklusfehler:
verzögertes Cleanup einer älteren Frame-Registrierung konnte bei demselben Iframe
die neuere Registrierung entfernen. Registrierung und asynchroner Deskriptor-
Callback sind nun an die konkrete Entry-Instanz gebunden. Kein Abschalten von
StrictMode und kein Lockern der Zustands-/Persistenzprüfung.

Der Referenzlauf platziert das Beispiel über die Kit-CLI, legt einen Materialclip
an und prüft echte Lehrer→Room-/Room→Lehrer-Eingaben sowie den bestätigten
Archivzustand und Reload. Er wartet auf die tatsächliche asynchrone API-Antwort,
nicht auf die Existenz eines Browser-Promise. Technisches Druckgate bleibt von
der weiterhin offenen realen Druckabnahme getrennt. Der Discovery-Einstieg prüft
Dateigrößen und SHA256 des Pakets vor Ausgabe des Startauftrags.


## Lokaler Prüfstand

- Persönlicher Stand: Typprüfung, 477 App-Tests plus 15 Playbacktests und 117
  Room-/Projektionsprüfungen bestanden; tatsächlicher Kit-/HTML-/Room-/Reloadlauf
  in Chromium und WebKit bestanden.
- Öffentlicher Stand: normales `npm ci` ohne besondere Modulpfade, 459 App-Tests
  plus 15 Playbacktests, 85 Room-/Projektionsprüfungen, Typprüfung und vollständige
  Browser-Kernsuite bestanden. Technische AB-Prüfung ist keine Druckfreigabe.
- Öffentlicher Ressourcenbau einschließlich Webbuild, Lizenz-/Schriftnachweisen,
  Node und Office erfolgreich. Der tatsächlich gebündelte Server und seine
  Node-Laufzeit liefern das Paket und führen dessen CLI gegen ein getrenntes
  Probe-Archiv aus; kein Entwickler-Checkout oder globaler Skill nötig.
- Keine neue native App kompiliert/geöffnet/installiert, kein Updatekanal,
  Git-Remote, Commit oder Upload. Vorschau verwendet eine getrennte Testbasis;
  vorhandene Browserentwürfe bleiben unangetastet. Keine Modellanbieterabnahme.

## Arbeitsblattreferenzen (30.10.2026)

Der gemeinsame Agenteneinstieg enthält jetzt 13 vollständige HTML-/CSS-Referenzen
mit lokalen Assets und zentraler Layoutorientierung. Herkunft und gesonderte
Bild-/Iconlizenzen stehen im [Referenznachweis](../agent-references/PROVENANCE.md).
Eigene Inhalte folgen der Projektlizenz; CC-BY-SA-/ISC-Fremdanteile behalten
ihre jeweiligen Bedingungen. Technische Beispiele bleiben separat.

Prüfung des Referenznachtrags: alle 13 ausgelieferten Pakete durch denselben
Prüfer mit `--require-print` validiert; reale additive Archivübernahme einer
bebilderten Referenz und idempotente Wiederholung im isolierten Testarchiv.
Alle 19 Bildschirmseiten in Chromium gerendert und in der Übersicht gesichtet;
alle Bilder geladen, keine Ressourcen-/JavaScriptfehler. Referenzdateien bleiben
bytegleich zur ausgewählten Herkunft. Keine neue native Druckfreigabe und keine
Modell-/Agentenabnahme aus dieser Integration.

## Sprache des Startauftrags (30.10.2026)

Der kompatible `prompt` bleibt erhalten. Zusätzlich liefert Discovery den
kanonischen `promptTemplate` mit `promptValues`; der Dialog zeigt denselben
Auftrag über den gemeinsamen DE-/EN-Katalog an. Sprache verändert weder Pfade,
Zugriff noch Auftrag. Die ausführlichen Markdown-Anleitungen bleiben deutsch.
[Sprachvertrag64](64_UI_LANGUAGE.md).
