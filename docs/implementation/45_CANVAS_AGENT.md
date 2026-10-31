# Lokaler Canvas-Agent – D-301

Stand: 29.10.2026; lokal in 0.1.82 installiert. Versionierter lokaler Vorbereitungsslice. Der Agent steuert
**eine geöffnete Lehreransicht**. Servertransport hält nur flüchtige Aufträge;
Canvas-Port, Engine und bestehende Archivschreibqueue bleiben kanonisch.
Kein zweites Canvas-/Material-/Planungsmodell, kein Remote- oder Room-Agent.

## Anschluss und Zuständigkeit

`canvas-agent-server.mjs` ist derselbe RAM-Broker im Desktopserver und Vite.
Nur Loopback-Host, exakte gleichursprüngliche Origin (oder CLI ohne Origin) und
`X-Tafelraum-Agent: 1`; fremde/opaque Origins, Cross-/Same-Site und Formrequests
werden abgewiesen. Kein CORS. Keine beliebigen Dateipfade, Skripte oder Engine-
Payloads. Token für Hostpoll/Bestätigung bleibt flüchtig in dessen Closure und
erscheint nicht in der Sitzungsliste. Es gibt keinen Cloudzugang oder KI-Key.

`useCanvasAgent` ist ausschließlich in App.tsx montiert. Beim Stunden-/Portwechsel
wird die Verbindung verworfen. Mehrere Lehreransichten sind getrennte Sitzungen;
der CLI wählt nur bei genau einer automatisch. Ein Neustart erzeugt neue IDs.

Die Schnittstelle erweitert den vorhandenen Canvas-Port um `inspectAgentCanvas`
und `executeAgentCommand`. Objektfabriken und Materialtransformationen werden mit
der normalen Bedienung geteilt. Materialpfade werden gegen den aktuellen
Stundenbestand aufgelöst; Bilder/PDFs nutzen den vorhandenen Rasterimport,
Originale/Assets und HTML-Zustände bleiben in ihren bestehenden Speichern.

## Agent bedienen

Vom Repository-Root:

```sh
node scripts/tafelraum-canvas-agent.mjs sessions
node scripts/tafelraum-canvas-agent.mjs inspect --session SESSION
node scripts/tafelraum-canvas-agent.mjs validate --file work/auftrag.json
node scripts/tafelraum-canvas-agent.mjs apply --session SESSION --request-id AUFTRAG --file work/auftrag.json
node scripts/tafelraum-canvas-agent.mjs job --session SESSION --request-id AUFTRAG
```

Standardadresse: `http://127.0.0.1:49317`; Entwicklung/QA mit `--url`.
`inspect` liefert lebende Revision, Objekte inkl. IDs/Bounds/Text/Materialpfad,
Auswahl, Kamera, Clips, Busy-/Speicherstatus und verfügbare Archivmaterialien.
HTML-Antworten gehören nicht in diese lesende Agentprojektion, fließen aber in
die Konflikterkennung ein. `persistence.pending` berücksichtigt beide Saveebenen;
`archiveRevision` stammt aus der normalen ETag-Verwaltung.

Beispiel nach einem frischen Inspect; Szeneinheiten, x/y links oben, Winkel Radiant:

```json
{
  "type": "apply",
  "expectedRevision": "REVISION-AUS-INSPECT",
  "operations": [
    {"type":"text","key":"question","x":100,"y":150,"fontSize":32,"text":"How did it start?"},
    {"type":"shape","key":"answer","x":650,"y":130,"width":550,"height":150,"shape":"rectangle","color":"#758e95"},
    {"type":"material","key":"video","path":"Videos/beispiel.mp4","x":100,"y":400}
  ],
  "viewport":{"scrollX":40,"scrollY":50,"zoom":0.7}
}
```

Weitere Operationen: `setText {elementId,text}` für freien unformatierten Text;
`transform {elementId,x,y,width,height,angle?}` nutzt den bestehenden Verbundpfad.
Material-/Papierproportionen und Sperren gelten weiter. Freier Text wird hier nur
proportional skaliert; formatierter/gebundener Text und Verbünde mit Rich Text
werden vorerst abgewiesen statt ihre Formatierung zu beschädigen. Für Umbruch
bestehende Textgriffe verwenden. Neue Texte verwenden Nunito und warten vor der
Messung auf die geladene Schrift. Keine Antwortfeld-/Arbeitsblattgenerierung.

Clips sind ein eigenständiger Befehl über den bestehenden ClipLayer-Verlauf:

```json
{"type":"clip","expectedRevision":"REVISION","number":1,"rect":{"x":0,"y":0,"width":1300,"height":800}}
```

Oder `elementId` statt `rect` für einen zulässigen Materialclip. Belegte Nummern
nur mit `replace:true` ersetzen. Erzeugen zeigt keinen Clip und startet keine
Präsentation. Native Objektbatches sind ein Engine-Undo-Schritt; Clips nutzen
weiterhin die separate vorhandene Clip-Rücknahme. Keine neue Verlaufsdatenbank.

## Revision, Persistenz und Fehler

Die flüchtige Live-Revision ist an die konkrete Portinstanz gebunden und umfasst
Elementversionen, Clipfolge und gespeicherte HTML-Zustände. Kamera und Auswahl
allein lösen keinen Inhaltskonflikt aus. Laufende Gesten/Texteingaben werden als
busy abgewiesen. Vor und nach asynchronem Vorbereiten wird der Stand erneut
geprüft. Alle Operationen werden zuerst in einem Entwurf validiert; anschließend
wird einmal mit `CaptureUpdateAction.IMMEDIATELY` übernommen. Eine reine
Kameraänderung erzeugt keinen Objekt-Verlaufsschritt.

Vor dem Commit wird die bestehende Speicherung vollständig geflusht. Ein externer
Board-PUT mit neuer ETag führt dadurch zum Fehler **vor** der Agentänderung.
Nach dem Commit wird der aktuelle Enginezustand inkl. Clips/HTML-State über die
bestehende IndexedDB-Outbox und If-Match-Archivqueue gespeichert. Fehlgeschlagene
Archivwrites bleiben pending; ein fehlender Server darf keine Erfolgsmeldung
liefern. `ok:true, applied:true, persisted:true` ist der bestätigte Abschluss.
Ein Fehler nach Commit liefert `applied:true, persisted:false`; niemals blind
nochmals neue Objekte hinzufügen. Kein automatisches Überschreiben/Neuladen.

Transport: Hosts pollen mit 20s-Longpoll, 45s-Lease; Aufträge dürfen vor Ausführung
höchstens 30s alt sein. Eine requestId pro Sitzung bezeichnet unveränderlich genau
einen Auftrag. Zustellung wird nie automatisch wiederholt. Bis 256 IDs werden
in einer Sitzung gehalten, danach neue Aufträge abgewiesen. Bei verlorener
Antwort Status derselben ID lesen; ein abgelaufener Host bedeutet unbestätigten
Ausgang, keine Erlaubnis zur Wiederholung mit neuer ID. Maximal acht Hosts und
100 Operationen pro Batch. Hostresultate sind flüchtig; kein Archiv-Commandlog.

## Dateien und Pflege

- Skill: `.agents/skills/tafelraum-canvas-vorbereiten/` (lokal auffindbar im Repo).
- Protokoll: `canvas-agent-protocol.mjs` + `.d.mts`, von Server/Host geteilt.
- Transport: `canvas-agent-server.mjs`, Desktop- und Vite-Anschluss.
- Host: `src/canvas-agent-client.ts`, `src/canvas/canvas-agent.ts`,
  `src/canvas/agent-materials.ts`, vorhandener Canvas-Port/ClipLayer.
- Helfer: `scripts/tafelraum-canvas-agent.mjs`.

Schema/Capabilities und Skillreferenz gemeinsam pflegen. Fachliche Layoutbeispiele
bleiben im Skill, technische Invarianten hier. Keine Kopien dieses Vertrags in
AGENTS.md. Produktive Archivänderungen folgen den dortigen Sicherungsregeln.

## Prüfung

Node-Tests prüfen Eingabegrenzen, Origin-/Hostschutz, falsche Stunde, eindeutige
Aufträge, einmalige Zustellung, Tokenisolation und Ablauf. Browser-/native
Prüfstand und Aktivierung werden nach tatsächlicher Durchführung unten ergänzt.

### Abnahme und lokale Aktivierung – 29.10.2026

398 App-Tests einschließlich Protokoll/Broker und echter Archivschreibqueue,
15 HTML-Playback-,115 Live-/Room- und2 Rusttests bestanden; beide Typprüfungen,
Frontend-/ARM64-Build, Codesign und Updatersignatur erfolgreich. Skillvalidator
bestanden. Neue Tests hängen am regulären npm-test-Lauf.

Isoliertes Archiv und echte gebaute Lehreroberfläche unter127.0.0.1:49327:
17 native Objekte/Archivmaterial in einem Auftrag angelegt; vollständige Texte
nach Schriftladeprüfung sichtbar; ein echter Undo-Klick entfernt den ganzen
Batch. Unveränderliche requestId liefert dieselbe Bestätigung ohne Duplikat;
veraltete Live-Revision und ungültige letzte Operation erzeugen keine Änderung.
Papierproportionen geschützt; Ausschnitt-/Materialclip gespeichert; belegte
Nummer ohne replace abgewiesen. Echte HTML-Antwort eingetragen und Material
verschoben: Antwort/Objekt-ID erhalten. Nach bestätigter Speicherung neu geladen:
17 Objekte,zwei Clips und HTML-Antwort erhalten. Absichtlicher externer Board-PUT
im Testarchiv führt zur Ablehnung vor Agentmutation; externen Stand bytegleich
geprüft. Fehler-/Offline-Queue behält pending Snapshot für sicheren Retry.
Ein unmittelbar nach UI-Redo ausgeführter Browserreload kann dagegen den noch
unbestätigten UI-Debounce überholen; die Agentfreigabe wartet ausdrücklich auf
persisted=true. Kein Cache-/Outbox-Reset verwendet.

Normale Desktop-App am bisherigen Ort aktualisiert, native Version0.1.82 und
lesender Agentanschluss an die vom Nutzer zuletzt geöffnete Präsentationsstunde
bestätigt, gespeicherter Zustand ohne pending Writes. Produktive Stunde nicht
für Schreibtests verändert. Ausführende Befehle im isolierten gebauten Browserhost
geprüft; keine zusätzliche native Schreib-/Room-/Touchhardwareabnahme behauptet.
15.479 bestehende Archiv-/Notiz-/Konfigurationsdateien nach Neustart bytegleich;
synthetischer Serverwechsel0.1.81→0.1.82 erhält6/6 Dateien. Installiertes Bundle
bytegleich zum signierten Build. Rückfallkopie0.1.81 unter
`~/Library/Application Support/Tafelraum Release/app-backups/` erhalten.

Belege:`output/local-install-0.1.82/`, Task-Arbeitsordner `work/canvas-agent-qa/`
und sichtbare Probe im Task-Ausgabebereich `Canvas-Agent/Canvas-Test.png`.
Keine öffentliche Updatekanal-/Remote-Veröffentlichung aus diesem Auftrag.


### Anschluss an die Unterrichtsorganisation (D-304)

Zielauflösung, Archivimport, Aktualisierung der Lehreransicht und Stundenwechsel
liegen im Organisationsskill und Vertrag47. Nach einem Wechsel eine neue
Canvas-Agent-Sitzung/Revision lesen. Die Canvasbefehle, Materialfactorys und
Arbeitsblattzustände bleiben unverändert.


D-331 ergänzt den öffentlichen Erstlauf: Canvas-CLI-Hilfe ohne Appverbindung,
unter StrictMode erst beim Commit aktivierte Portidentität und vorhandene lokale
Laufzeitschriften. Agentenbefehle behalten Revision, Frist, Busy- und If-Match-
Schutz. [Erstlauf62](62_AGENT_FIRST_RUN.md) prüft die echte Befehls-/Browserkette
mit leerem Archiv; keine zusätzliche Desktopinstallation aus diesem Auftrag.
