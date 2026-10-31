# Mit Tafelraum arbeiten: Bring Your Own Agent

Du arbeitest mit dem lokalen Agentenpaket der laufenden Tafelraum-App. Das Paket
ist eine lesbare Momentaufnahme der Projektanleitungen und derselben Prüfer/
Befehle, kein eigenes Plugin, kein MCP-Dienst und keine zweite Materialpipeline.
Keine global installierte Arbeitsblatt-Pluginvariante voraussetzen oder mischen.
Die Lehrkraft bringt ihren Agenten und dessen Werkzeuge mit.

Der Startauftrag nennt die tatsächlichen Paket-/Laufzeitpfade und die Appadresse
dieser Installation; den Archivpfad danach über `status` ermitteln. „Verbinden“
übergibt diese Orientierung an einen lokalen Agenten mit Datei-/Werkzeugrechten.
Es meldet keinen KI-Account an und installiert keine Erweiterung. Die gemeinsame
Pipeline verwendet lokale CLIs; MCP wird dafür nicht benötigt.

## Zuerst verbinden, noch nichts verändern

1. `AGENTS.md` und `agent-kit.json` in diesem Paket lesen. Die App zeigt den
   Paketordner, ihre Adresse und die verwendbare Node-Laufzeit im Startauftrag.
   Ein beliebiger Chat ohne lokalen Datei-/Werkzeugzugriff kann diesen Weg nicht nutzen.
2. Im Paketordner beide CLIs mit `--help` lesen. Sie benötigen weder npm-Pakete
   noch persönliche Plugins. Außerhalb eines Checkouts kann die im Startauftrag
   angegebene gebündelte Node-Laufzeit statt eines globalen `node` verwendet werden.
3. `scripts/tafelraum-unterricht.mjs status --url APP_ADRESSE` ausführen.
   Die Antwort liefert das tatsächlich geöffnete Archiv. Kein anderes Archiv
   still auswählen, erstellen, synchronisieren oder direkt umschreiben.
   Für spätere Befehle `--archive-root` mit diesem bestätigten Pfad als zusätzliche
   Zielprüfung verwenden und die Appadresse bei jedem Aufruf angeben.
4. `scripts/tafelraum-canvas-agent.mjs sessions --url APP_ADRESSE` lesen.
   Canvasvorbereitung braucht eine geöffnete Lehreransicht. Bei mehreren
   Sitzungen die gewünschte auswählen; fehlende App-/Werkzeugberechtigungen offen benennen.
5. Erst den Auftrag der Lehrkraft ausführen. Beispiel: „Erstelle ein Arbeitsblatt
   für meine Stunde …“. Lernziel, Lerngruppe, Materialgrundlage und Ausgabeform
   klären, soweit sie noch fehlen. Ein Erstellungsauftrag schreibt kein Archiv.

## Anleitungen passend zur Aufgabe laden

- Material entwickeln: `.agents/skills/tafelraum-unterrichtsmaterial/SKILL.md`.
- HTML-Arbeitsblatt, Quiz oder anderes Embed:
  `.agents/skills/tafelraum-interactive-html/SKILL.md`.
- Stunden suchen/anlegen und Material zuordnen:
  `.agents/skills/tafelraum-unterricht-organisieren/SKILL.md`.
- Canvas und Clips vorbereiten:
  `.agents/skills/tafelraum-canvas-vorbereiten/SKILL.md`.

`docs/agent-references/README.md` erschließt 13 vollständige Arbeitsblattreferenzen.
Bei neuen Blättern deren Layoutanleitung lesen und passende Beispiele tatsächlich
ansehen; die beiden Materialskills führen durch denselben Auswahlweg.
`docs/agent-examples/README.md` erklärt ergänzend zwei technische Minimalbeispiele.
Private Fallarchive und zusätzliche Modellanbieter sind keine Voraussetzung.
Spezielle Bild-, Audio-, PDF- oder Browserwerkzeuge hängen vom Agenten ab;
fehlende Prüfwerkzeuge nicht durch eine behauptete Freigabe ersetzen.

## Eine gemeinsame Pipeline

Material in einem eigenen beschreibbaren Arbeitsordner entwickeln. Dieses
Paket kann im signierten Appbundle liegen: Es ist kein Ausgabe- oder Archivziel.
Neue Paket-ID wählen; Beispiele vor Änderungen in den Arbeitsordner kopieren.

HTML durch `scripts/check-interactive-material.mjs --source-dir PAKET` prüfen.
Bei Arbeitsblättern ist zusätzlich `--require-print` verbindlich, sofern nicht
ausdrücklich rein digital oder ein anderes Ausgabeformat bestellt wurde.
Danach Inhalt und Browserdarstellung prüfen. Die deklarierte Druckfähigkeit
ersetzt keine Prüfung der tatsächlichen Druckausgabe.

Nur nach beauftragter Archivübernahme `scripts/tafelraum-unterricht.mjs
install-html --lesson STUNDE --source-dir PAKET --mode worksheet|digital`
mit Appadresse und geprüftem Archivpfad verwenden. Der bestehende additive
Installer und dieselben Manifest-/Room-Prüfungen bleiben zuständig.
Canvasplatzierung und Clipanlage sind ein weiterer beauftragbarer Schritt.
Nach jedem Schritt den tatsächlich bestätigten Stand melden; Präsentation
nicht ungefragt starten.

## Daten und Grenzen

Das Paket enthält keine Unterrichtsdaten und keine privaten Regeln. Es eröffnet
keinen Fernzugriff. Namenslisten und private Stundennotizen sind kein Teil des
normalen Organisations-/Canvas-Inspect. Ein Agent mit Dateirechten kann aber
lokale Dateien lesen; die Lehrkraft bestimmt dessen Berechtigungen und welche
Daten an einen externen Modellanbieter gehen. Modellunabhängigkeit bedeutet
keine automatische Einrichtung oder Qualitätsgarantie für jedes Agentenprogramm.

Codex wird im eigenen Unterrichtsworkflow des Projektentwicklers genutzt. Die
gemeinsamen CLIs und der HTML-/Room-/Speicherablauf sind automatisiert in Chromium
und WebKit geprüft, ohne Modellaufruf. Die Einrichtung mit Claude Code, anderen
Agenten und lokalen Modellen ist vorgesehen, aber noch nicht separat erprobt.
