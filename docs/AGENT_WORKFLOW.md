# Unterricht mit einem eigenen Agenten vorbereiten

Stand30.10.2026. Gemeinsamer lokaler Einstieg und mitgelieferte Pipeline;
kein vollständig abgenommener Ein-Klick-Anschluss für beliebige Agenten.

## Einstieg aus der App: Agent verbinden

1. `Einstellungen → Agent verbinden` öffnen und den Startauftrag kopieren.
2. Ihn einem Agenten mit lokalem Datei-/Werkzeugzugriff geben. Der Auftrag nennt
   die richtige Appadresse, Node-Laufzeit und das mitgelieferte Agentenpaket.
3. Der Agent liest dessen Einstieg und prüft zunächst nur Archiv und Verbindung.
   Du verbindest keine zweite Archivkopie: Die laufende App bleibt zuständig und
   meldet ihre tatsächliche Datenbasis. Eine unklare Zielstunde wird danach geklärt.
4. Anschließend beispielsweise beauftragen: „Erstelle ein Arbeitsblatt für die
   Stunde …“. Nach Prüfung kannst du Archivübernahme und Canvas-/Clipvorbereitung
   beauftragen; diese Schritte dürfen auch in einem gemeinsamen Auftrag stehen.

**„Agent verbinden“ bedeutet hier: einen Startauftrag an deinen lokalen Agenten
übergeben.** Die App meldet Paketpfad, Appadresse und Node-Laufzeit passend zu
dieser Installation; der Agent ermittelt den Archivpfad anschließend über `status`.
Pfade aus fremden Beispielen sollen deshalb nicht übernommen werden. Der Dialog
meldet dich bei keinem KI-Anbieter an und installiert keine Erweiterung.

Das Paket enthält die vier lokalen Projekt-Skills, dieselben HTML-Prüfer und
Archiv-/Canvashelfer, zwei technische Minimalbeispiele und
[13 vollständige Layoutreferenzen](agent-references/README.md). Bei neuen
Arbeitsblättern führt die gemeinsame Layoutanleitung zur Auswahl und Sichtung
passender Vorlagen. Kein persönliches Plugin nötig.
Arbeitsblätter behalten ihre Druckprüfung; ein technisches Beispiel ersetzt
keine fachliche oder tatsächliche Druckfreigabe. Material in einem eigenen
Arbeitsordner erstellen, nicht im Paketordner des Appbundles.

Für lokale Agenten braucht dieser Weg keinen Quellcheckout und kein globales
npm-/Skillpaket, sofern die App ihre Ressourcen mitliefert. Ein Cloudchat ohne
Zugriff auf den Rechner erreicht die lokale App weiterhin nicht automatisch.
Die bestehende installierte App wird durch Quelländerungen nicht aktualisiert.
[Vertrag und Prüfstand63](implementation/63_BUNDLED_AGENT_KIT.md).

## Verbindliches Produktprinzip: modell- und anbieterunabhängig

D-329, ausdrückliche Nutzerklärung29.10.2026: Bring Your Own Agent ist ein
Grundprinzip. Tafelraum soll mit geeigneten Agenten und Modellen verschiedener
Anbieter sowie lokal betriebenen Modellen verwendbar sein. Codex ist eine
bisherige Arbeits-/Prüfumgebung, keine Produktvoraussetzung oder bevorzugte
fachliche Implementierung.

Dafür gelten drei gemeinsame Ebenen:

1. **Tafelraum-Fähigkeiten:** einheitliche validierte Befehle, Materialformate,
   Archivzuordnung und Canvasoperationen. Kein Anbieterfeld und kein KI-Account
   als Voraussetzung für den lokalen Kern oder den allgemeinen Agentenzugang.
2. **Arbeitsabläufe:** zentrale, anbieterneutrale Anleitungen für Erstellen,
   Prüfen, Archivieren und Vorbereiten. Keine fachlich auseinanderlaufenden
   Kopien je Agent; private Plugin-/Regeldateien sind keine allgemeine Voraussetzung.
3. **Zugänge:** agentenspezifische Einrichtung oder kleine Adapter für Skill-
   Erkennung und Werkzeugaufruf. Der aktuelle Weg verwendet lokale CLIs und
   mitgelieferte Markdownanleitungen; MCP ist dafür nicht erforderlich.
   Zugänge dürfen die lokale Berechtigungsgrenze nicht umgehen.

„Mit allen“ ist das Kompatibilitätsziel. Praktisch braucht der jeweilige Agent
Datei-/Werkzeugzugriff oder einen freigegebenen Connector zur lokalen App. Der
Modellname allein stellt diesen Zugriff nicht her. Abnahmen werden pro konkretem
Agentenweg dokumentiert; Architekturziel und getesteter Einrichtungsstand bleiben
unterscheidbar. Die gemeinsame Referenzaufgabe ist für alle gleich: ein neutrales
Material erstellen/prüfen, einer Teststunde zuordnen, auf dem Canvas anordnen,
Clips vorbereiten und die bestätigte Speicherung prüfen.

Die persönliche OpenAI-Satzprüfung ist eine getrennte, derzeit anbieterspezifische
Pilotfunktion. Sie begründet keine OpenAI-Abhängigkeit des Agentenzugangs. Wird
sie allgemein weiterentwickelt, muss ihre fachliche Fähigkeit von konkreten
Providerimplementierungen getrennt werden. Bestehende Schlüssel und Materialien
bleiben erhalten; ein Providerwechsel darf keinen neuen Archiv-/Canvasvertrag
voraussetzen. Diese Anforderung ist noch keine implementierte Mehranbieterprüfung.

## Die Idee

Die Lehrkraft bringt einen Agenten mit, der Dateien lesen, Material erstellen
und lokale Werkzeuge ausführen kann. Tafelraum organisiert die Stunde, hält
das Materialarchiv und speichert die Arbeitsfläche. Der Agent verwendet dafür
die vorhandenen validierenden Befehle. Ein persönlicher Modellanschluss für HTML ist davon unabhängig. Die öffentliche
Distribution besitzt keinen solchen Key-Einstieg und benötigt ihn dafür nicht.

Ein vollständiger Auftrag kann diese Schritte verbinden:

1. **Ziel klären:** Lerngruppe, Reihe, Stunde und gewünschtes Material bestimmen.
2. **Material erstellen:** Der Agent erzeugt beispielsweise Text, ein Bild, ein
   PDF oder ein lokales interaktives HTML-Paket in einem Arbeitsordner.
3. **Prüfen:** Inhalt und Darstellung prüfen; HTML validieren, druckbares Material
   zusätzlich über den vorgesehenen Druckweg abnehmen. Ungeprüfte Entwürfe bleiben
   als solche kenntlich.
4. **Zuordnen:** Die ausdrücklich beauftragte Zielstunde auflösen und das Material
   über den vorhandenen Archivimport zuordnen.
5. **Canvas vorbereiten:** Auf ausdrücklichen Auftrag die richtige Stunde in der
   Lehreransicht öffnen, vorhandene Objekte prüfen, Material anordnen und Clips
   vorbereiten. Die App bestätigt ihre eigene Speicherung.
6. **Durchführen:** Die Lehrkraft entscheidet, wann sie präsentiert. Ein erstelltes
   Material ist noch nicht archiviert; eine vorbereitete Stunde ist noch nicht gehalten.

Beispiel für einen verbundenen Auftrag: „Erstelle das besprochene Material,
prüfe es, ordne es meiner Teststunde zu und bereite dort die Arbeitsfläche mit
zwei passenden Clips vor. Starte die Präsentation noch nicht.“ Fehlende Ziele
werden geklärt, bereits eindeutige Ziele und Freigaben nicht erneut abgefragt.

## Was bereits mitgeliefert wird

| Skill | Zuständigkeit |
| --- | --- |
| [Unterricht organisieren](../.agents/skills/tafelraum-unterricht-organisieren/SKILL.md) | Stunden finden/anlegen, Material zuordnen und Zielstunde öffnen |
| [Canvas vorbereiten](../.agents/skills/tafelraum-canvas-vorbereiten/SKILL.md) | Native Texte/Formen/Materialien anordnen und Clips vorbereiten |
| [Unterrichtsmaterial](../.agents/skills/tafelraum-unterrichtsmaterial/SKILL.md) | Materialauftrag und Unterrichtskontext zusammenführen |
| [Interaktives HTML](../.agents/skills/tafelraum-interactive-html/SKILL.md) | Paketvertrag, Zustand, Darstellung, Prüfung und optionale Druckfähigkeit |

Zusätzlich liegt ein UI-Review-Skill für Entwicklungs-/Darstellungsprüfungen bei.
Diese Dateien befinden sich unter `.agents/skills/` im Quellrepository und werden
für das lokale Agentenpaket gezielt daraus übernommen. Sie sind
kein nur in der persönlichen Codex-Installation des Entwicklers vorhandenes Paket.

Codex findet laut [offizieller Dokumentation](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)
repository-lokale Skills im geöffneten Arbeitsbereich bis zur Repositorywurzel.
Der Quellweg kann vom geöffneten Tafelraum-Quellordner ausgehen. Die App liefert
zusätzlich das oben beschriebene lokale Paket; sie installiert dessen Skills nicht
automatisch global in einem beliebigen Chat. Gleichnamige globale und lokale Skills
werden nicht automatisch zusammengeführt; keine unnötige Doppelinstallation.

## Welche zusätzlichen Werkzeuge nötig sind

Ein Skill beschreibt einen Ablauf; er liefert nicht automatisch Bild-/Audiomodelle,
einen Browser, einen PDF-Renderer oder Anbieterzugänge. Ein geeigneter Coding-Agent
kann lokale Dateien und HTML erzeugen und die mitgelieferten Node-Helfer aufrufen.
Für Bilder, Sprache, Dokumentausgaben und Sichtprüfungen braucht er die jeweils
passenden verfügbaren Werkzeuge. Die persönlichen Plugins des Entwicklers sind
keine automatisch mitgelieferten Tafelraum-Abhängigkeiten.

Die Werkzeuge richten sich nach dem Material. Ein bestimmter privater
Arbeitsblatt-/Audioanbieter ist nicht Bestandteil des allgemeinen Paket- oder
Archivvertrags. Fehlt ein nötiges Werkzeug, muss die Prüfung beziehungsweise
Ausgabe offenbleiben; keine fertige Qualität oder Installation vortäuschen.

Die CLI-Einstiege sind `scripts/tafelraum-unterricht.mjs` und
`scripts/tafelraum-canvas-agent.mjs`. Zum lesenden Einstieg ihre `--help`-Ausgaben
verwenden. Sie haben standardmäßig die native Appadresse; ein Vite-Testserver
braucht die ausdrücklich passende `--url`. Canvasbefehle benötigen eine geöffnete
Lehreransicht. Details in [Vertrag45](implementation/45_CANVAS_AGENT.md) und
[Vertrag47](implementation/47_TEACHING_AGENT.md).

## Einstieg mit einem frischen Checkout

1. Nach [CONTRIBUTING](../CONTRIBUTING.md) `npm ci` ausführen, eine eigene leere
   Archivbasis initialisieren und die Lehreransicht starten. Die installierte
   persönliche App und ihre Daten sind kein Testziel. Für den dokumentierten
   Browserstart lautet die Adresse `http://127.0.0.1:5173`.
2. Im gewählten Agenten den Repositoryordner öffnen. Falls er Skills nicht
   automatisch erkennt, die oben verlinkten `SKILL.md`-Dateien gezielt lesen lassen.
   Diese Markdownanleitungen und Node-CLIs sind die gemeinsame Grundlage;
   `agents/openai.yaml` ist lediglich optionale Codex-Metadaten, kein Laufzeitbedarf.
3. Vom Repository-Root beide Hilfen lesen. Sie brauchen keine laufende App:

   ```sh
   node scripts/tafelraum-unterricht.mjs --help
   node scripts/tafelraum-canvas-agent.mjs --help
   ```

4. Die ausdrücklich gewählte Testadresse bei **jedem** Verbindungsbefehl mitgeben:

   ```sh
   node scripts/tafelraum-unterricht.mjs status --url http://127.0.0.1:5173
   node scripts/tafelraum-canvas-agent.mjs sessions --url http://127.0.0.1:5173
   ```

   `status` muss die eigene Testbasis melden. Bei mehreren Lehreransichten die
   gewünschte Sitzung explizit auswählen. Reihen-/Stunden-IDs aus dem tatsächlichen
   Katalog verwenden; ein Chatname oder die offene Stunde ist kein Ersatz.
5. Beispielsweise beauftragen: „Lege in der Testreihe eine Stunde Agenten-Probe an,
   bereite das mitgelieferte Demobild als Testmaterial vor, prüfe und archiviere es.
   Öffne diese Stunde, ergänze eine Überschrift und einen Notizbereich auf dem
   Canvas und bereite zwei Clips vor. Bestätige die Speicherung; starte keine
   Präsentation.“ Je nach Material braucht der Agent passende lokale Werkzeuge.

Der [gemeinsame Unterrichtsworkflow](unterricht/00_ARBEITSWEISE_UNTERRICHT.md)
unterscheidet technische Produktregeln und eigene fachliche Regeln. Vorhandene
vereinbarte Regeln bleiben maßgeblich; private `_rules/source`-Dateien,
Reihenspiegel und Fallkarten sind **keine Voraussetzung** eines neuen Archivs.
Keine private Beispiel-/Plugininstallation nachfordern, um den Erstlauf zu starten.

## Wiederholbarer neutraler Referenzlauf

Aus dem Appverzeichnis mit Node24 und installierten Chromium-/WebKit-Testbrowsern:

```sh
npm run test:agent-onboarding
```

Der Lauf gehört auch zu `npm run test:browser` und damit zur vorbereiteten CI.
Er erstellt eine eigene Quellkopie ohne Daten, private Regeln oder Fallbeispiele,
initialisiert das dokumentierte leere Archiv und verwendet die echte Lehreransicht
und beide CLIs. Er prüft Stundenanlage/-auflösung, ein vorbereitetes öffentliches
Demobild, additive Archivierung, native Objekte, zwei Clips, bestätigte Speicherung
und Reload. Wiederholung derselben Auftrags-ID darf keine Duplikate erzeugen;
veraltete Revisionen müssen abgewiesen werden. Fremdrequests sind blockiert.
Prüfumfang und Grenzen: [Erstlauf62](implementation/62_AGENT_FIRST_RUN.md).

## Kompatibilitätsgrenzen

| Bereich | Aktueller Nachweis |
| --- | --- |
| Codex | Vom Projektentwickler im eigenen Unterrichtsworkflow genutzt. |
| Gemeinsame lokale Pipeline | Automatisierter Referenzlauf mit echten CLIs, Lehreransicht, HTML, Room Canvas und bestätigtem Reload in Chromium und WebKit; ohne Modellaufruf. |
| Claude Code und andere lokale Agenten, auch mit lokalen Modellen | Vorgesehener Zugang bei geeigneten Datei-/Werkzeugrechten; konkrete Einrichtung und Ergebnisqualität noch nicht erprobt. |

- Die gemeinsame Befehls-/Browserkette ist prüfbar unabhängig von einem Modellkey
  und persönlich installierten Plugins. Der Referenzlauf ist ein technischer
  Agentenablauf, keine Qualitätsabnahme generierter Unterrichtsinhalte.
- Codex ist eine bisher verwendete Agentenumgebung. Automatische Einrichtung,
  Werkzeugfreigaben und Skill-Erkennung konkreter anderer Agenten benötigen
  separate Abnahmen. Insbesondere wird hier keine Claude-Ausführung behauptet.
- Ein Appdownload installiert keine globalen Skills. Das lokale Paket unterstützt
  Arbeit außerhalb des Repositorys; der Agent braucht weiterhin passende Datei-/
  Werkzeugrechte. Bestehende ältere Installationen besitzen diesen Einstieg noch nicht.
- Druckbare Arbeitsblätter behalten ihre technische und tatsächliche Druckabnahme.
  Das digitale Demobild des Referenzlaufs ist keine Arbeitsblatt-Druckfreigabe.

Die Modell-/Anbieterunabhängigkeit ist das Produktprinzip. Die dokumentierten
Prüfungen beschreiben konkrete Werkzeuge und Abläufe, keine Zusage für jedes
Modell, jede Agentenoberfläche oder jede Plattform.

Du nutzt Claude Code oder einen anderen lokalen Agenten? Rückmeldungen zum
Startauftrag, zur Einrichtung und zum Materialworkflow sind willkommen. Bitte
Agent/Version, Betriebssystem, ausgeführten Schritt und Ergebnis nennen; dabei
keine privaten Unterrichtsdaten, lokalen Personenpfade oder Zugangsdaten teilen.

## Lokale Speicherung und Agentenzugriff

Tafelraum speichert den Unterricht lokal. Ein Agent mit Dateirechten kann im
Rahmen seiner Berechtigungen auch lokale Inhalte lesen. Bei einem Cloudmodell
können gelesene Inhalte an dessen Anbieter übermittelt werden. Die Lehrkraft
wählt deshalb Arbeitsordner, Berechtigungen und freigegebene Inhalte ihres
Agenten bewusst; lokale Appspeicherung macht diesen Datenweg nicht automatisch lokal.
