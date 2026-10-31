# Agenteneinstieg mit leerem Archiv

29.10.2026, D-331. Gemeinsame Quellbasis für den öffentlichen Einstieg; keine
Installation, kein Commit, Upload oder Dienstdeployment. Die installierte App
und persönliche Unterrichtsregeln bleiben unverändert.

## Gemeinsame und persönliche Regeln

Der kanonische Einstieg ist [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md), ergänzt
durch die vorhandenen vier Organisations-/Material-/Canvas-Skills. Die
Anleitungen gelten für geeignete Agenten mit Datei-, Node- und Browserwerkzeugen.
Persönliche Plugins, API-Keys und globale Codex-Skills sind keine Voraussetzung.
Agentenspezifische Metadaten bleiben von der fachlichen Anleitung getrennt.

Der [Unterrichtsworkflow](../unterricht/00_ARBEITSWEISE_UNTERRICHT.md) verlangt
vorhandene eigene Regeln nur in ihrem Geltungsbereich. Die aktive Basis kommt
vom ausdrücklich gewählten lokalen Archivserver. Ein leeres Archiv benötigt
keine privaten `_rules/source`-Dateien, Reihenspiegel oder Fallkarten. Ein fehlendes
optional vorhandenes Dokument ist ein normaler Erstzustand; eine ausdrücklich
benötigte fehlende Quelle oder ein Lesefehler bleibt zu klären. Vorhandene eigene
Regeln werden weder gelöscht noch umgeschrieben. Materialerstellung, Archivierung,
Canvasvorbereitung und Präsentationsstart bleiben getrennte Beauftragungen.

## Wiederholbare Referenz

Nach `npm ci` und Installation der Testbrowser im Appverzeichnis:

```sh
npm run test:agent-onboarding
```

`scripts/agent-onboarding-browser-test.mjs` verwendet eine frische Quellkopie und
exakt die dokumentierte Archivinitialisierung aus CONTRIBUTING. Keine Daten oder
Regeln aus einer persönlichen Installation kopieren. Testmaterial ist eine
vorbereitete, unveränderte Kopie des mitgelieferten neutralen Demo-PNGs, keine
neu generierte Unterrichtseinheit und kein druckfreigegebenes Arbeitsblatt.

In Chromium und WebKit über die echte Vite-Konfiguration, Lehreroberfläche und
als Kindprozesse ausgeführte CLIs:

1. Hilfen ohne Appkontakt lesen; die eigene Archivbasis bestätigen.
2. Stunde in der neutralen Startreihe anlegen, finden und eindeutig auflösen.
   Wiederholung darf keine zweite Stunde erzeugen.
3. PNG-Abmessungen/-Signatur prüfen, gezielt importieren und Quell-/Archivbytes
   vergleichen. Wiederholung darf kein zweites Material erzeugen.
4. Zielstunde über den Organisationsanschluss öffnen; frische Canvas-Sitzung und
   Live-Revision lesen. Ein Materialimport allein lässt den Canvas leer.
5. Überschrift, archiviertes Bild und native Form mit einem validierten Auftrag
   platzieren. Zwei Clips anlegen. Für jeden Schreibauftrag `persisted:true`
   verlangen. Replay derselben ID erzeugt keine Duplikate; eine alte Revision
   muss vor Änderung abgewiesen werden.
6. Bestätigten Archivstand lesen, neu laden und nach dem normalen Lade-/Saveabschluss
   Objekt-IDs, Inhalt, Geometrie, Materialbezug und Clipdaten vergleichen. Nur
   äquivalente Leerwerte (`boundElements:null/[]`, fehlende/leere HTML-State-Map)
   normalisieren; andere Abweichungen bleiben Fehler. Keine Präsentation starten.

Fremdrequests sind blockiert und führen zum Fehler. Keine produktiven Schreibpfade,
Board-PUT-Fallbacks, Cachelöschung oder künstlichen Hostbestätigungen im Test.
Ausgaben unter `output/agent-onboarding/`: Verlauf/Status in `verification.json`,
Screenshots nach Vorbereitung und Reload. Der Lauf ist Teil von `test:browser`
und wird damit von der vorbereiteten CI automatisch mitgeprüft.

## Im Erstlauf gefundene Hürden

- Canvas-CLI-Hilfe war an eine laufende App gebunden. `--help`/`help` liefern jetzt
  vor jeder Sitzungssuche die lokale Hilfe; Unit-Tests prüfen das gegen einen
  unerreichbaren Loopback-Port. Auch `validate` bleibt lokal.
- `CanvasSurface` änderte die Agenteninstanz während `useMemo`. React StrictMode
  konnte dadurch den tatsächlich verwendeten Port als veraltet markieren.
  Die Portidentität wird jetzt erst im Layout-Commit veröffentlicht und beim
  Ablösen widerrufen. Revisions-, Busy-, Frist- und Speicherschutz bleiben intakt.
  Der echte Dev-Erstlauf ist die Regression; keine Abschaltung von StrictMode.
- Excalidraw suchte beim ersten nativen Agententext seine Laufzeitschrift extern.
  Lehrer, Room und Teilnehmerbuild teilen jetzt einen lokalen Font-Pluginpfad:
  vorhandene gepinnte Original-WOFF2-Dateien für Dev und Build sowie ein lokaler
  Assetpfad vor Modulstart. Keine neue Schrift/Dependency; Originalnotices bleiben
  unverändert. Der Buildwächter verlangt den vollständigen vorhandenen Fontsatz
  auch im Lehrerbuild, nicht nur dessen CSS-Teilmengen.

## Prüfgrenzen

Die Referenz prüft die gemeinsame Befehls-/Browserkette in konkreten Engines,
keine automatische Einrichtung jedes Agenten, Modellqualität, Claude-Ausführung,
native Hardware, Windows/Linux oder Arbeitsblattdruck. Produktive Archive,
private Schlüssel und installierte App sind keine Testziele. Ein öffentlicher
Quellkandidat muss mit den aktualisierten Dateien neu erzeugt und geprüft werden;
frühere ZIPs und Testbelege werden nicht still ersetzt.


## Lokaler Abschluss29.10.2026

- Persönliche Quellbasis:471 App- und15 Playbacktests,117 Room-/Projektionstests,
  beide Typprüfungen, Lehrer-/Teilnehmer-Webbuild und vollständige Browser-Kernsuite
  einschließlich neuem Erstlauf bestanden.
- Ausgewählter öffentlicher Quellstand: normales `npm ci` in eigener Prüfkopie,
 453 App- und15 Playbacktests,85 Room-/Projektionstests, beide Typprüfungen und die
  vollständige Browser-Kernsuite einschließlich Quellenbuild bestanden.
- Der Referenzlauf bestätigt in beiden Profilen und Chromium/WebKit je eine
  neutrale Zielstunde, ein bytegleich archiviertes Bild, drei native Objekte und
  zwei Clips nach Reload. Keine Fremdrequests oder Browserfehler.
- Vier überarbeitete Repository-Skills mit dem Skillvalidator geprüft. Original-
  Lizenz-/Assetnachweise bleiben aktiv; beide Webbuilds enthalten238 nachgewiesene
  Fontdateien (234 Laufzeitdateien plus vorhandene CSS-Teilmengen).

Prüfbelege und neuer öffentlicher Export unter `output/agent-entry-public/`;
kein GitHub-Lauf, Upload oder installierter neuer Desktopbuild. Die Prüfkopie hat
nur ein leeres lokales Git für vorhandene Quellkopie-Testhelfer, keine Commits oder
Remotes. Frühere Kandidaten unter `output/distribution-split/` bleiben unverändert.
