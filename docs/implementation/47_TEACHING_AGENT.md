# Unterricht organisieren – D-304

Stand: 29.10.2026. Lokaler Skill und Befehlszugang, kein zweites Archivmodell.
Ein geeigneter Agent kann Material in beliebigen Chats erstellen und einer ausdrücklich
bezeichneten Stunde zuordnen. Der Chat ist keine feste Reihenbindung.

## Zuständigkeiten

- `tafelraum-unterrichtsmaterial`: Inhalt und didaktische Prüfung.
- `tafelraum-interactive-html`: unveränderte Paket-, Room- und Druckpipeline.
- `tafelraum-unterricht-organisieren`: Ziel finden, Stunde anlegen, Material
  hinzufügen/benennen/sortieren, Appbestand aktualisieren und Ziel öffnen.
- `tafelraum-canvas-vorbereiten`: lebende Szene und Clips nach D-301.

Aktueller Auftrag vor eindeutigem Gesprächsziel. Reihenchat und geöffnete Stunde
sind Hinweise, kein Default für Schreibvorgänge. Materialquelle unabhängig vom
Ziel auflösen. Nur bei tatsächlicher Mehrdeutigkeit nachfragen. Kurze Folgeaufträge
übernehmen ein bereits eindeutiges Ziel und die vorhandene Beauftragung. Keine
Chatzuordnungsdatenbank und keine neue Materialkategorie.

## CLI

Von der Wurzel des geöffneten Tafelraum-Checkouts:

```sh
node scripts/tafelraum-unterricht.mjs status
node scripts/tafelraum-unterricht.mjs find --query "Agenten-Probe"
node scripts/tafelraum-unterricht.mjs resolve --lesson "Agenten-Probe" --class "Meine Klasse"
node scripts/tafelraum-unterricht.mjs materials --lesson LESSON_ID
node scripts/tafelraum-unterricht.mjs create --series SERIES_ID --title "Neue Stunde"
node scripts/tafelraum-unterricht.mjs import --lesson LESSON_ID --file /absolut/material.pdf
node scripts/tafelraum-unterricht.mjs link --lesson LESSON_ID --link https://example.org/video
node scripts/tafelraum-unterricht.mjs install-html --lesson LESSON_ID --source-dir /absolut/paket --mode worksheet
node scripts/tafelraum-unterricht.mjs rename --lesson LESSON_ID --path material.pdf --name "Listening" --previous-name material.pdf
node scripts/tafelraum-unterricht.mjs order --lesson LESSON_ID --file /absolut/reihenfolge.json
node scripts/tafelraum-unterricht.mjs open --lesson LESSON_ID
node scripts/tafelraum-unterricht.mjs context
node scripts/tafelraum-unterricht.mjs refresh
```

`order` liest `{paths:[...],previousPaths:[...]}`. Namen/IDs lassen sich bei
Suche/Auflösung durch `--class`, `--subject`, `--series` eingrenzen. `find` darf
Teiltexte finden; Schreibbefehle verlangen einen exakten Titel oder eine ID und
einen einzigen aktiven Treffer. Verborgene Stunden, Papierkorb und gelöschte
Eltern werden ausgeschlossen. Ein Titel wird niemals automatisch angelegt.

Standardserver ist `http://127.0.0.1:49317`; Tests über `--url`. Nur Loopback-HTTP,
keine Weiterleitungen. `/api/archive/status` liefert die tatsächliche Basis;
`--archive-root` ist optional eine zusätzliche Gleichheitsprüfung. Kein stiller
Offline-/Dateifallback. Das historische `create-archive-lesson.mjs` bleibt für
explizite Migration/Offlinearbeit erhalten, ist aber nicht der neue Agentstandard.

Stundenanlage, Datei-/DOCX-Import, Links, Benennung und Reihenfolge nutzen die
vorhandenen Archiv-APIs und Schreibqueues. HTML nutzt exakt den vorhandenen
additiven Installer, gebunden an die Basis des laufenden Servers. `worksheet`
setzt zwingend `requirePrint`; fehlende Moduswahl wird abgelehnt. Druckfähigkeit
ersetzt keine Sichtprüfung der Prüf-PDF aus dem Ziel-Druckdialog. Kein Überschreiben
abweichender Paketbytes, keine automatische Canvasplatzierung, kein Löschen.

Import und Aktualisierung der offenen Ansicht werden getrennt bestätigt:
`persisted:true` mit `view.refreshed:false` ist ein erfolgreicher Archivcommit.
Danach ausschließlich die Ansicht aktualisieren. Bei Transportabbruch keine
Erfolgsmeldung; aktuellen Bestand prüfen. Anlage/Import/Installer behalten ihre
bisherige Deduplizierung. Namens-/Reihenfolgeänderungen benutzen Vorbedingungen.

## Verbindung zur Lehreransicht

`/api/teaching-agent/*` verwendet denselben RAM-Broker wie der Canvas-Agent, mit
eigenem Parser und Protokoll `tafelraum-teaching-agent-v1`. Origin-/Hostprüfung,
Hosttoken, Lease, Auftragsgrenzen und requestId-Semantik bleiben identisch.
Kein neuer persistenter Transport, kein Room-/Remote-/HTML-Agentzugang.

Die Organisationssitzung lebt mit der App, nicht mit dem Canvas-Port. Dadurch
überlebt die Bestätigung eines Stundenwechsels dessen Portwechsel. Mehrere
Lehreransichten verlangen `--session ID`. Aufträge `context`, `refresh` und
`openLesson` akzeptieren weder beliebige Engineobjekte noch Dateipfade oder Code.

`context` liefert aktive Lesson-ID, Canvasrevision, Bereit-/Busy-Zustand und
Speicherstatus, keine Antworten, privaten Stundennotizen oder Schülerliste.
`refresh` liest den kanonischen Katalog und aktualisiert den vorhandenen Cache
und Materialzähler. Kein Katalog-PUT; ungespeicherte oder während des Lesens
veränderte lokale Navigation verhindert die Übernahme.

`openLesson` verlangt Ziel-ID sowie erwartete Ausgangsstunde und Canvasrevision.
Der Host löst das Ziel frisch im Archiv auf und verwendet `openLesson` der App
inklusive Notiz-/Canvasflush. Laufende Gesten, Import, Präsentation, ausstehende
Remote-Wechselbestätigung oder nicht gespeicherte HTML-Eingaben verhindern den
automatischen Wechsel. Nach asynchronen Schritten erneut Revision/Frist prüfen.
Der CLI bestätigt erst, wenn die Zielstunde einen bereiten Canvas-Port meldet.
Danach frische Canvas-Agent-Sitzung/Revision verwenden. Kein Präsentationsstart.

## Auffindbarkeit und Pflege

Repository-Skill unter `.agents/skills/tafelraum-unterricht-organisieren/`;
auf dem lokalen Test-Mac zusätzlich über einen Link in `~/.codex/skills/` auffindbar,
damit auch Chats außerhalb des Repositorys den Einstieg erhalten. Keine zweite
Skillkopie. Andere Agenten können dieselbe Markdownanleitung und denselben CLI
nutzen, müssen den Skill aber in ihrem jeweiligen Suchpfad verfügbar machen.

Neue Fähigkeiten im Protokoll, CLI, Skill und diesem Vertrag gemeinsam pflegen.
Die bestehenden Autorisierungsstufen bleiben erhalten, gelten aber auf Basis
des gesamten Gesprächs statt einer Pflicht zur wiederholten Bestätigung.

## Prüfung und Aktivierung

419 App-Tests (einschließlich vier neuer Organisationsprüfungen), 15 Playback-
und 115 Live-/Room-Tests, beide Typprüfungen, Webbuild und Skillvalidator bestanden.
Bestehende Bundlegrößenwarnung unverändert. Reale Archivtests prüfen mehrdeutige
Ziele/gelöschte Eltern, falsche Archivbasis, additive Anlage/Importwiederholung,
Namens-/Reihenfolgekonflikte und den unveränderten Worksheet-Druck-/Paketupdate-
Schutz. Protokolltest prüft fremde Origins, ungültige Befehle und requestId.

Getrennte gebaute Lehreransicht auf Port49328 mit synthetischem Archiv:
Stunde anlegen → HTML archivieren → offene Liste/Katalog aktualisieren → Ziel
öffnen → über D-301 platzieren/clippen. Reale HTML-Antwort eingegeben, zur anderen
Stunde und zurück gewechselt, danach neu geladen: Antwort, Objekte und Clip
bleiben erhalten. Veraltete Revision und Stundenwechsel bei laufendem Room werden
abgewiesen. Keine echte Unterrichtsstunde für Schreibtests verwendet. Synthetisches
HTML ist eine technische Prüfvorrichtung, kein druckfreigegebenes Unterrichts-AB.

Die parallel abgeschlossene Installation0.1.84 enthält bereits exakt diese
Runtimeänderungen. Neun einschlägige Quell-/Builddateien gegen deren isolierten
Buildstand verglichen; installierte Servermodule bytegleich. Der native
Organisationsanschluss bestätigt die tatsächlich offene Präsentationsstunde und
keine ausstehenden Writes. Die unabhängige Auflösung von `lesson-five-drug-stories`
liefert gleichzeitig eine andere Zielstunde mit vollständig richtigem Pfad.
Kein weiterer Appaustausch und keine produktive Datenänderung durch diesen Auftrag.
Native schreibende Organisationsbefehle/Touchhardware nicht gesondert geprüft;
Schreibabläufe in der getrennten gebauten Browser-Lehreransicht abgenommen.

Interne Belege: `output/teaching-agent/`; Installation/Quellstand0.1.84 unter
`output/local-install-0.1.84/` aus dem parallelen Installationsauftrag.
Kein öffentlicher Updatekanal-/Remote-Upload aus diesem Auftrag.


D-331: Ein leeres Fremdarchiv benötigt keine privaten Regeln, Reihenspiegel oder
Fallkarten. Vorhandene einschlägige eigene Vorgaben bleiben gültig; Anleitung
und neutraler durchgängiger CLI-/Browserlauf in [Erstlauf62](62_AGENT_FIRST_RUN.md).
Keine globale Skill-/Plugininstallation als Voraussetzung. Historische lokale
Aktivierungsbelege oben sind keine universelle Agenten-/Plattformabnahme.
