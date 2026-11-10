---
name: tafelraum-unterricht-organisieren
description: "Find or create Tafelraum lessons and manage their archived materials from any chat. Use for requests such as add this worksheet to lesson XYZ, füge hinzu, open that lesson, or organize its materials; also resolve the target before requested canvas preparation. Does not author worksheets or replace their existing validation pipeline."
---

# Unterricht organisieren

Verbinde den Auftrag mit der richtigen Tafelraum-Stunde. Ein Chat ist eine
Kontextquelle, keine feste Klassen-, Reihen- oder Stundenbindung. Materialquelle
und Zielstunde dürfen aus unterschiedlichen Zusammenhängen stammen.

## Einstieg und Ziel

Die Wurzel des geöffneten Tafelraum-Checkouts oder des von der App genannten
Agentenpakets bestimmen (`README.md`, beim Paket zusätzlich `agent-kit.json`).
Pfade in diesem Skill beziehen sich darauf; keine persönliche Plugininstallation
voraussetzen. Die App nennt im Startauftrag ihre Adresse und Node-Laufzeit.
Bei jedem Verbindungsbefehl diese Adresse ausdrücklich als `--url` mitgeben.
Helfer von dieser Wurzel ausführen:
`node scripts/tafelraum-unterricht.mjs --help`.
Vertrag und Befehle bei Bedarf:
[Unterricht organisieren](../../../docs/implementation/47_TEACHING_AGENT.md).
Vor produktiven Schreibschritten die Regeln in [AGENTS.md](../../../AGENTS.md)
beachten, auch wenn der Chat außerhalb dieses Repositorys liegt.
Die laufende Desktop-App liefert die aktive Archivbasis; kein stiller Rückfall
auf `data/unterrichtsarchiv`, einen Chatordner oder ein anderes Archiv.

1. Eine im aktuellen Auftrag genannte Zielstunde hat Vorrang. Sonst ein im
   Gespräch eindeutig festgelegtes Ziel übernehmen, auch bei „füg hinzu“ oder
   „bereite jetzt den Canvas vor“. Ein Reihenchat allein bezeichnet keine Stunde.
   Die offene App-Stunde ist nur dann Ziel, wenn der Nutzer darauf Bezug nimmt
   oder die Zuordnung im Gespräch eindeutig ist. Sie ersetzt kein genanntes Ziel.
2. Mit `find --query "…"` und optional Klasse/Fach/Reihe im realen Archiv suchen.
   Anschließend `resolve --lesson "Titel oder ID"` verwenden. Die Antwort enthält
   stabile IDs und den vollständigen Pfad Klasse → Fach → Reihe → Stunde.
   Für Folgebefehle die bestätigte ID benutzen; bei ausdrücklicher Zieländerung
   neu auflösen. Keine dauerhafte Chatzuordnungsdatei anlegen.
3. Bei mehreren Treffern nur die fehlende Unterscheidung erfragen und konkrete
   Kandidaten mit Klasse/Reihe nennen. Eine unbekannte Stunde nicht ohne Auftrag
   neu anlegen. Bei einer klaren Zuordnung keine zusätzliche Bestätigung verlangen.
4. Unabhängig davon das gemeinte Material bestimmen: zuletzt besprochene/geprüfte
   Fassung oder ausdrücklich genannte Datei. Nicht den ganzen Ausgabeordner
   importieren. Bei mehreren plausiblen Fassungen nur diese Auswahl klären.

## Autorisierten Schritt ausführen

Die vorhandene Arbeitsblattpipeline bleibt zuständig für Inhalt, Gestaltung,
Lösungen, HTML-/Room-Vertrag und Druckabnahme. `tafelraum-unterrichtsmaterial`
und bei HTML `tafelraum-interactive-html` weiter verwenden. Dieser Skill ergänzt
die Organisation danach; er erzeugt weder eine zweite Pipeline noch zusätzliche
Gestaltungsregeln.

- **Erstellen/überarbeiten:** allein ein Materialauftrag; weiterhin im
  Ausgabebereich arbeiten. Keine automatische Stunde, Archivierung oder Platzierung.
- **„Füg hinzu“ / „ins Materialarchiv“:** bei eindeutigem Gesprächsbezug gültiger
  Archivauftrag. Die Lehrkraft muss Klasse/Stunde und Freigabe nicht wiederholen.
  Bereits erteilte Aufträge bleiben gültig; mehrere Schritte dürfen gemeinsam
  beauftragt sein. Keine künstlichen Bestätigungspausen dazwischen.
- **Stunde anlegen:** `create` mit eindeutig aufgelöster vorhandener Reihe und
  Titel. Datum nur bei bekanntem Termin. Der bestehende Anlagepfad erkennt
  gleichen Titel/Termin; kein ungefragtes Duplikat.
- **Datei/Link hinzufügen:** `import` bzw. `link` mit Ziel-ID. Upload ist additiv
  und nutzt den normalen Materialimport. Er verändert keinen Canvas.
- **HTML hinzufügen:** `install-html --mode worksheet` für ABs/Hybridmaterial;
  nutzt unverändert den vorhandenen Installer mit `require-print`. `digital`
  nur für digitale Tools oder eine ausdrückliche rein digitale Fassung. Keine
  Umdeklaration, um Prüfungen zu umgehen. Die tatsächliche Druckabnahme bleibt
  separat verbindlich. Geänderte bestehende Pakete werden nicht überschrieben.
- **Benennen/sortieren:** zuerst `materials` lesen, dann `rename` mit bisherigem
  Namen bzw. `order` mit bisheriger vollständiger Pfadliste. Vorhandene
  Konfliktprüfung erhalten. Löschen, Verschieben, Duplizieren und Paketupdates
  gehören noch nicht zum neuen Befehlsumfang; nicht über Dateimanipulation emulieren.

Vor produktiven Änderungen die bestehenden Sicherungsregeln in `AGENTS.md`
beachten. Reine Code-/Prüfarbeit und additive neue Materialdateien benötigen
kein Vollbackup; bestehende produktive Katalog-/Materialänderungen entsprechend
der dortigen Regel sichern. Dieser Skill führt keine neue Bestätigungspflicht ein.

## Sichtbare Arbeitsphase in Tafelraum

Bei jedem beauftragten Canvas-Schreibauftrag sowie bei mehrstufiger
Unterrichtsvorbereitung mit Archiv- oder Canvasübernahme die vorhandene
Arbeitsphase als Teil des Auftrags führen. Sobald Zielstunde und Lehreransicht
feststehen, vor der ersten eigentlichen Vorbereitung mit
`work-start --lesson ID --work-id UUID` beginnen. Ist Materialerstellung samt
Übernahme beauftragt und das Ziel bereits bekannt, startet die Phase vor der
Materialerstellung. Die Anlage einer neuen Stunde selbst geht der Phase voraus.
Für reine Entwürfe ohne bestätigte Zielstunde gelten die normalen Chat-Updates.

- Eindeutige Lehreransicht, lokales `--url`, geprüfte `--archive-root` und dieselbe
  `--work-id` durchgängig verwenden. Bei mehreren Fenstern die betroffene
  Organisationssitzung explizit wählen. Die Canvas-Sitzungs-ID ist separat.
- Spätestens alle 30 Sekunden aktiver Arbeit `work-heartbeat` senden, auch
  während längerer Materialerstellung, Prüfungen und getrennt laufender Befehle.
  Bei längeren Tools früh zurückkehren und zwischen den Prüfungen das nächste
  Lebenszeichen senden. Die App zeigt konkrete Import- und Canvasaktionen aus
  den echten Befehlen und zwischen ihnen „Bereitet Materialien vor“.
- `work-finish` erst nach Bestätigung aller beauftragten Schritte verwenden.
  Bei Canvasarbeit muss die Zielstunde geöffnet und gespeichert sein. Bei Abbruch
  `work-cancel` senden und bei unbestätigtem Schreiben den vorhandenen
  Auftragsstatus prüfen. Kein Lebenszeichen nach Ende des Auftrags senden.
- Für reine Materialerstellung mit Archivübernahme `--work-scope archive` bei
  `work-start` und dieselbe `--work-id` auch bei jedem Import, Link oder
  HTML-Installer angeben. Die App bestätigt den Abschluss anhand des
  Materialbestands auch in einer geschlossenen Zielstunde. Unterstützt ein
  älterer Host den Archivabschluss noch nicht, verwende den regulären
  Importstatus und melde die Anzeigegrenze. Für die Statusanzeige die
  laufende Stunde oder Präsentation nicht wechseln.
- Fehlende, abgelaufene oder nicht eindeutig zuordenbare Anzeige als solche
  benennen. Archiv-/Canvasbestätigung und Sichtbarkeit getrennt behandeln.
  Eine fehlende Anzeige ist kein Grund, bestätigte Schreibbefehle zu wiederholen.

Der [Organisationsvertrag](../../../docs/implementation/47_TEACHING_AGENT.md#continuous-lesson-preparation-local-development)
beschreibt Lebensdauer und Abschlussbedingungen.

## Canvas und Präsentation

Bei „bereite den Canvas vor“ oder „clippe die Materialien“ dieselbe Zielregel
anwenden, Materialbestand lesen und die Zielstunde mit `open` öffnen, wenn nötig.
Dann `tafelraum-canvas-vorbereiten` verwenden. Vorhandene Objekte und Clips prüfen,
statt Materialien erneut zu platzieren. Die Lernhandlung bestimmt Anordnung und
Clipfolge; Lösungen nicht ungefragt in eine Schüler-Präsentationsfolge aufnehmen.

Der Organisationsanschluss bestätigt den geladenen Zielcanvas. Er beendet keine
laufende Präsentation und verwirft keine ungespeicherten HTML-Eingaben. Wenn die
App deshalb einen Wechsel ablehnt, den konkreten Zustand erklären; Archivarbeit
an der anderen Stunde kann unabhängig fortgesetzt werden. Präsentationsstart
ist kein Bestandteil der Vorbereitung.

## Abschluss und Fehler

`materials` bestätigt Bestand und Zuordnung. Eine Importantwort mit
`persisted:true` und `view.refreshed:false` bedeutet: archiviert, aber die offene
Liste nicht aktualisiert. Nur `refresh` wiederholen, nicht den Import.
Bei unbestätigten Aufträgen zuerst `job` mit derselben Sitzung/requestId lesen;
kein blinder Retry und kein App-/Cache-/Outbox-Reset.

Kurz berichten, was erreicht wurde, einschließlich Zielpfad. Archiviert, Canvas
vorbereitet und tatsächlich präsentiert sind unterschiedliche Zustände. Eine
geplante Stunde nicht als gehalten dokumentieren. Nur bei fachlicher Ablaufänderung
einen vorhandenen, für diesen Unterricht vereinbarten Reihenspiegel/Stundenstand
aktualisieren. Ein frisches Archiv braucht keine privaten Regeln, Fallkarten oder
Spiegeldateien; dafür den gemeinsamen Unterrichtsworkflow lesen. Kein zweites Planungsmodell.
