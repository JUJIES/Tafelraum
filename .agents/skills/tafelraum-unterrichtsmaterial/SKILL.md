---
name: tafelraum-unterrichtsmaterial
description: Develop or revise teaching materials for a Tafelraum class, lesson, or series across formats such as images, PDFs, audio, interactive HTML, and printable worksheets. Use for concrete classroom-material work; not for Tafelraum app UI or archive inventory alone.
---

# Unterrichtsmaterial im Reihenkontext entwickeln

Dieser Skill verbindet einen laufenden Unterrichtschat mit dem kanonischen
Unterrichtsarchiv und gegebenenfalls vorhandenen Unterrichtsbeispielen. Er bestimmt weder Format
noch Stil vorab. Der aktuelle Auftrag der Lehrkraft hat Vorrang.

Ein ausdrücklich im aktuellen Auftrag genanntes Ziel hat Vorrang vor dem bisherigen
Chatkontext. Ein Chat ist keine feste Reihenbindung. Materialquelle und Zielstunde
können verschieden sein; zur Archivzuordnung `tafelraum-unterricht-organisieren`
verwenden, ohne Inhalt, Format oder Qualitätsprüfungen dieser Pipeline zu ändern.

## Bei einem neuen Materialauftrag

Wenn Erstellung und Übernahme in eine konkrete Stunde zusammen beauftragt
sind, die [sichtbare Arbeitsphase](../tafelraum-unterricht-organisieren/SKILL.md#sichtbare-arbeitsphase-in-tafelraum)
vor der Erstellung nach den dortigen Ziel- und Anschlussregeln beginnen.

1. Kläre aus Auftrag und Gespräch Zielgruppe, Lernhandlung und gewünschtes Format.
   Lies [Unterrichtsworkflow](../../../docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md)
   für gemeinsame Regeln und den Umgang mit eigenen Unterrichtsvorgaben.
   Die aktive Archivbasis über die laufende App bestimmen, nicht aus einem
   persönlichen Rechnerpfad ableiten. Vorhandene einschlägige eigene Regeln und
   Reihen-/Stundennotizen berücksichtigen; ein frisches Archiv benötigt weder
   private `_rules/source`-Dateien noch einen Reihenspiegel. Bei fehlendem
   optionalem Kontext aus dem Auftrag weiterarbeiten; ausdrücklich vorausgesetzte
   fehlende Quellen oder Lesefehler klären. Vorbereitet, verwendet und bestätigt
   unterscheiden; keine Unterrichtshistorie erfinden.
2. Für neue oder wesentlich neu gestaltete Arbeitsblätter die gemeinsame
   [Layoutorientierung](../../../docs/agent-references/LAYOUT.md) und den
   [Referenzindex](../../../docs/agent-references/README.md) verwenden. Die dortigen
   13 vollständigen Pakete sind in Checkout und Agentenpaket enthalten. Bei
   kleinen Revisionen den vorhandenen Materialstand erhalten. Zusätzlich, falls
   `docs/unterricht/beispiele/README.md` konkrete passende Beispiele enthält,
   einen relevanten Fall samt nötigem Feedback lesen. Ein Index ohne Fallkarten
   oder fehlende private Beispiele blockiert die Arbeit nicht. Keine privaten
   Referenzsets beschaffen oder einen Fall als Template übernehmen. Begründungen
   und Prüffragen aus vergleichbaren Fällen nutzen, konkrete Gestaltung und
   Ausgabeweg aus dem aktuellen Auftrag entscheiden.
3. Entwickle Inhalt, Arbeitsauftrag, Medium und Umfang aus dem konkreten
   Unterrichtsziel und dem Feedback im Chat. Übernimm aus Beispielen vor allem
   Begründungen und Prüffragen; Layout, Farbwelt, Bildmenge, Aufgabenfolge,
   Schwierigkeitsstufen und Formulierungen werden neu entschieden. Prüfe, ob
   Hilfen die beabsichtigte Schülerhandlung erleichtern oder ungewollt lösen.
   Prüfe bei seitengebundenem Material nach dem sicheren Seitenumbruch auch die
   Flächennutzung: Größere Schrift, ruhigerer Zeilenabstand und mehr echter
   Schreibraum sind oft hilfreicher als ein großes ungenutztes unteres Drittel.
   Fülle eine Seite aber nicht mechanisch; freie Fläche darf der Gliederung und
   Ruhe dienen, wenn zusätzlicher Raum die Lernhandlung nicht verbessert.
4. Prüfe vor der visuellen Freigabe alle Arbeitsaufträge einmal als
   zusammenhängenden Schülerweg. Jeder Bezug muss an der betreffenden Stelle
   verständlich sein: Benenne vorausgesetzte Zwischenergebnisse, Sozialform und
   Wechsel zwischen Einzel-, Partner- und Plenumsarbeit ausdrücklich. Vergleiche
   Auftrag, bereitgestelltes Material und erwartete Eingabe auf Widersprüche oder
   gedankliche Lücken. Prüfkriterien müssen zur tatsächlichen Lernhandlung
   passen; Kriterien für Mediation, freie Textproduktion oder Präsentation
   werden nicht automatisch auf Übersetzung oder andere Aufgaben übertragen.
5. Bei `Arbeitsblatt`, `AB` oder `hybrid` ist Druckbarkeit verbindlich, sofern die Lehrkraft nicht ausdrücklich nur eine digitale Fassung oder ein anderes Format bestellt. Die aktuelle Canvas-Nutzung, ein früherer rein digitaler Bogen oder „heute nicht ausdrucken“ begründen keine Ausnahme. Ausgabeweg, geplante Seitenzahl und eine ausdrücklich gewünschte Ausnahme samt Herkunft im Brief festhalten. Für HTML bei Prüfung und freigegebener Installation zwingend `--require-print` verwenden; eine grüne Basisprüfung ohne diesen Schalter genügt für ein Arbeitsblatt nicht. Die technische Fähigkeit ersetzt nicht die nachfolgende Druckfreigabe. Für neue hybride HTML-Arbeitsblätter gilt zusätzlich D-259 als Standard: gemeinsame initiale A4-Seiten für Lehrer-/Room Canvas und Druck (`print.layout = shared-pages`, gleicher Entry, explizite Seitenabschnitte). Digital dürfen Antwortfelder anschließend vertikal wachsen und scrollen; die frische leere Druckvorlage bleibt unverändert. Die Lehrkraft muss dafür keinen zusätzlichen technischen Layoutprompt schreiben. Zugehörige Lösungsblätter, ausgefüllte Fassungen und Musterantworten übernehmen standardmäßig den Ausgabe-/Layoutmodus des zugehörigen Materials: bei Hybrid-HTML ebenfalls gemeinsame A4-Seiten, dieselbe Orientierung und ein korrespondierendes Grundlayout mit gleichen Aufgabennummern/-bezügen. Die Lösung wird nicht still als responsive Digitalfassung erzeugt. Eine Lösung zu einem ausdrücklich digitalen Tool erhält dagegen nicht automatisch Papierformat. Digitale Tools und ausdrücklich andere Ausgabeformen behalten ihren passenden Formatworkflow.
6. Verwende den spezialisierten Format-Workflow, sobald das Ergebnis feststeht:
   `tafelraum-interactive-html` für lokale HTML-Pakete, passende Bild-, PDF-,
   Dokument- oder Audio-Werkzeuge/Skills für deren jeweilige Ausgaben, soweit
   verfügbar. Keine persönliche Plugininstallation oder einen bestimmten
   Modellanbieter voraussetzen; bei fehlenden nötigen Werkzeugen die konkrete
   Ausgabe-/Prüfgrenze benennen. Prüfe das Ergebnis
   im tatsächlichen Nutzungskontext, zum Beispiel am Whiteboard oder auf A4.
   Für druckbare Materialien ist die [Druckfreigabe](../../../docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md#verbindliche-druckfreigabe-für-unterrichtsmaterial)
   verbindlich: Ziel-Druckdialog verwenden, daraus die aktuelle Prüf-PDF
   erzeugen und alle Seiten visuell prüfen. Bildschirmansicht und alternative
   Prüfrender ersetzen diese Abnahme nicht; einen fehlenden Zieltest offenhalten.

## Ablage und Kontinuität

- Für beauftragte Stundenanlage oder Archivübernahme den lokalen Skill
  `tafelraum-unterricht-organisieren` verwenden. „Füg hinzu“ gilt bei eindeutigem
  Gesprächsbezug als Auftrag; bekannte Zielstunde/Beauftragung nicht erneut abfragen.
  Erstellung allein bleibt ein Materialentwurf.

- Für ausdrücklich beauftragtes Einrichten/Anordnen auf dem Canvas nach der Materialvorbereitung `tafelraum-canvas-vorbereiten` verwenden; dort gelten die laufende Lehrerinstanz, Live-Revision und bestätigte Speicherung.

- Folge den drei Autorisierungsstufen in
  `docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md`: Entwurf im `output/`,
  Materialarchiv und Canvas sind getrennte Schritte. Ein vorhandener
  Unterrichtschat oder Arbeitsordner allein beauftragt keine Archivänderung.
- Halte nur den tatsächlich erreichten neuen Unterrichtsstand im passenden
  vorhandenen Reihenspiegel fest, wenn der Auftrag Planung oder Durchführung
  verändert und eine solche Dokumentation vereinbart ist. Ohne Spiegel keine
  zusätzliche Planungsdatei allein für diesen Skill anlegen.
  Dokumentiere einen Materialentwurf nicht zusätzlich an mehreren Orten.
- Das Beispielarchiv unter `docs/unterricht/beispiele/` sammelt bewusst
  ausgewählte Fälle. Ein neues Material wird dadurch nicht automatisch zum
  Best-Practice-Fall. Bei ausdrücklichem Aufnahmeauftrag gilt
  `docs/unterricht/beispiele/AUFNAHME.md`, sofern vorhanden. Fehlt ein vereinbarter
  Aufnahmeweg, diesen klären; keine Fallaufnahme als Materialpflicht behandeln.
  Eine reine Fallaufnahme verändert
  das Unterrichtsarchiv nicht.

Die Beispiele wachsen mit unterschiedlichen Materialformen. Ihre Häufigkeit
macht keine Gestaltung zur Regel; der Chat und die konkrete Lerngruppe bleiben
für jede neue Entscheidung maßgeblich.


## Gemeinsame Pipeline statt Pluginvarianten

Der Einstieg ist der geöffnete Checkout oder das von Tafelraum angegebene lokale
Agentenpaket (`README.md`, `agent-kit.json`). Das Paket enthält dieselben vier
Projekt-Skills, CLIs und HTML-Prüfer; die App nennt Adresse und Node-Laufzeit.
Paketdateien im Appbundle bleiben unverändert. In einem eigenen beschreibbaren
Arbeitsordner entwerfen, dann beauftragte Archiv-/Canvasschritte ausführen.

`docs/agent-examples/README.md` liefert neutrale technische Beispiele ohne private
Unterrichtsdaten. Die Layoutreferenzen unter `docs/agent-references/` ergänzen die ausgearbeiteten
Arbeitsblattmuster. Aus den technischen Minimalbeispielen
keine didaktischen oder visuellen Pflichten ableiten. Separat veröffentlichte
Arbeitsblatt-/MCP-Plugins sind andere Zugänge und dürfen nicht still diese lokale
Pipeline ersetzen. Ihre globalen Skills müssen nicht installiert sein.
