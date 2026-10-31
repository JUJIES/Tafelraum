# Unterrichtsworkflow in Tafelraum

**Stand:** 29. Oktober 2026 (D-331; frühere Fachentscheidungen behalten ihren Umfang)
**Status:** Integrationsvertrag; keine Verallgemeinerung fachlicher oder gestalterischer Unterrichtsregeln

## Gemeinsamer Einstieg und eigene Unterrichtsregeln

Dieser Workflow und die Format-/Archivverträge sind die gemeinsame Grundlage.
Ein frischer Checkout und ein neu angelegtes Archiv benötigen keine persönlichen
Regeldateien, Fallkarten oder früheren Unterrichtsstände. Der aktuelle Auftrag
liefert Zielgruppe, Lernhandlung und Ausgabeformat; fehlende fachlich notwendige
Angaben klären, keine frühere Reihe oder Unterrichtspraxis erfinden.

Eigene Regeln bleiben maßgeblich in ihrem benannten Geltungsbereich:

- Die aktive Archivbasis über `node scripts/tafelraum-unterricht.mjs status`
  bestimmen (für einen Testserver ausdrücklich `--url` verwenden). Darin
  vorhandene `_rules/source/ARBEITSWEISE_UNTERRICHT.md` und
  `_rules/source/SPIEGELMODELL_V0_1.md` vor entsprechender Unterrichtsarbeit
  vollständig lesen. Weitere ausdrücklich benannte eigene Regeln ebenso beachten.
- Im persönlichen Entwicklungsbestand vorhandene Herkunftskopien unter
  `data/unterrichtsarchiv/_rules/source/` gelten weiterhin für die dazugehörige
  Unterrichtsarbeit. Das ist eine lokale Kontextquelle, kein Rückfallziel für
  Archivbefehle und keine öffentliche Installationsvoraussetzung.
- Vorhandene reihenlokale Dokumente wie `reihenspiegel.md`, `README.md`, Reflexionen
  und Feedback nur für die betreffende Reihe und in ihrem benannten Umfang lesen.
  Ohne solche Dokumente aus Auftrag und tatsächlichem Archivbestand weiterarbeiten;
  weder einen Reihenspiegel als Voraussetzung anlegen noch vergangenen Unterricht
  rekonstruieren oder als gehalten ausgeben.
- Fehlende **optionale** Dateien sind ein normaler Erstzustand. Eine ausdrücklich
  vorausgesetzte, aber fehlende Regel oder ein Lesefehler ist dagegen zu klären;
  vorhandene Regeln nicht still ignorieren. Private Dateien nicht aus einem
  anderen Profil/Archiv beschaffen oder in den öffentlichen Quellstand kopieren.

Unveränderte Herkunftskopien bleiben Herkunftsnachweise; einzelne Entscheidungen
werden durch ihre Ablage nicht zu allgemeinen Produktregeln. Die technischen
Tafelraum-Vorgaben unten gelten unabhängig davon, einschließlich Druckfreigabe
und D-259 für neue hybride HTML-Arbeitsblätter.

## Regeln sind kein heimliches Template

Der technische Tafelraum-Vertrag soll zuverlässige Einbettung, Speicherung, Live-Übertragung und gegebenenfalls Druck sicherstellen. Er legt damit nicht automatisch Didaktik, Aufgabenform, Seitenaufbau, Farbwelt, Illustrationsmenge oder Interaktionsidee fest.

- Bestehende Stunden und Materialien sind Anschauung und Erfahrungswissen, keine Standardvorlage für die nächste Arbeit.
- Ein reihenlokaler Hinweis gilt nur für diese Reihe, sofern er nicht ausdrücklich weiter gefasst ist.
- Empfehlungen sind Möglichkeiten. Ein Agent darf daraus weder still ein Muss noch aus nicht genannten Varianten ein Verbot machen.
- Wiederverwendet werden technische Fähigkeiten und nachweislich hilfreiche Produktmuster. Inhalt und Gestaltung dürfen je Auftrag bewusst anders gelöst werden.
- Soll aus einer Beobachtung eine allgemeine Regel werden, muss die neue Reichweite ausdrücklich benannt und als Produktentscheidung bestätigt werden.

Damit bleibt die technische Integration einheitlich, ohne dass organisch entstandene Beispiele spätere Ergebnisse unbemerkt vereinheitlichen.

## Material zuerst: verbindliche Autorisierungsstufen

Unterrichtsmaterial wird standardmäßig zunächst ausschließlich im Ausgabebereich erstellt, geprüft und mit der Lehrkraft abgestimmt. Ein Auftrag wie `erstelle`, `überarbeite`, `bereite vor` oder `prüfe das Material` autorisiert deshalb weder die Anlage einer Stunde noch die Übernahme in ein Stundenarchiv oder auf eine Unterrichtsfläche.

Die drei Stufen sind getrennt:

1. **Ausgabebereich:** Materialentwurf, lokale Vorschau, technische Prüfung und Überarbeitung;
2. **Materialarchiv:** ausdrücklich angeforderte additive Übernahme in eine vorhandene Stunde;
3. **Canvas:** ausdrücklich angeforderte Platzierung des archivierten Materials auf der Fläche.

Die Lehrkraft kann mehrere Stufen bereits im Ausgangsauftrag freigeben. Ohne eine solche Angabe endet Materialerstellung nach Stufe 1. Eine reine Archivfreigabe endet nach Stufe 2 und verändert den Canvas nicht. Dadurch bleiben typische drei- oder viermalige Überarbeitungen schnell, und zustandsreiche UI-Aktionen werden erst ausgeführt, wenn das Material fachlich und visuell hinreichend geklärt ist.

## Zielstunde aus jedem Chat (D-304)

Der gewählte Agent unterstützt die Vorbereitung; Tafelraum hält das kanonische Archiv und dient der
Präsentation sowie dem gemeinsamen Unterricht. Ein Chat ist keine feste
Reihenzuordnung. Aktueller ausdrücklicher Zielauftrag hat Vorrang vor einem
bisherigen Gesprächsziel; die offene App-Stunde ersetzt kein genanntes Ziel.
Materialquelle und Zielstunde unabhängig auflösen. Der neue lokale Skill
`tafelraum-unterricht-organisieren` nutzt `scripts/tafelraum-unterricht.mjs`,
findet reale aktive Stunden und nennt Klasse → Fach → Reihe → Stunde.
Nur bei tatsächlicher Mehrdeutigkeit nachfragen.

„Gut, füge hinzu“ autorisiert bei eindeutigem Bezug die Archivierung des
besprochenen Materials. „Bereite den Canvas vor“ und „clippe die Materialien“
autorisieren die entsprechenden Schritte für das bekannte Ziel. Mehrere Stufen
können im selben Auftrag beauftragt sein; bekannte Angaben oder Freigaben nicht
wiederholt abfragen. Materialerstellung allein bleibt Stufe 1. Inhalt, Gestaltung,
HTML-/Room-Prüfung und Druckfreigabe bleiben vollständig in der bisherigen Pipeline.

Der Agentstandard bindet Anlage und Import an den laufenden Archivserver, ohne
stille Dateifallbacks. Der ältere Archivbefehl unten bleibt für explizite
Offline-/Migrationsarbeit dokumentiert. Aktueller Vertrag und Beispiele:
[Unterricht organisieren](../implementation/47_TEACHING_AGENT.md).

## Verbindliche Druckbarkeit von Arbeitsblättern

Nutzerentscheidung vom 7. Oktober 2026: Ein Auftrag für ein `Arbeitsblatt`, `AB` oder `Hybrid-Arbeitsblatt` umfasst grundsätzlich eine druckbare Ausgabe. Bei HTML muss das Paket eine echte `print`-Fähigkeit mit A4-Vorlage besitzen. Ausnahme: ausdrücklich bestellte rein digitale Fassung oder anderes Ausgabeformat. Aktuelle Canvas-Nutzung, ein früherer digitaler Bogen oder vorläufig kein geplanter Ausdruck sind keine stillschweigende Ausnahme. Ausgabeweg, Soll-Seitenzahl und eine bewusste Ausnahme mit Nutzerquelle werden vor Erstellung im Brief festgehalten.

Für HTML-Arbeitsblätter sind `check-interactive-material.mjs --require-print` und bei freigegebener Übernahme `install-interactive-material.mjs --require-print` verbindlich. Der gemeinsame Paketleser bricht bei fehlender Druckfähigkeit ab und prüft deklarierte A4-Einstellungen sowie die lokale Einstiegsdatei. Der bisherige Basischeck bleibt für digitale Tools und ausdrücklich digitale Arbeitsblätter nutzbar; sein Erfolg allein belegt keine Arbeitsblattfreigabe. Keine Titel-/Ordnerheuristik und keine neue Materialkategorie im Manifest.

Die technische Prüfung bestätigt keine brauchbaren Seitenumbrüche oder ausreichenden Schreibraum. Dafür gilt weiterhin die Druckfreigabe aus dem tatsächlichen Ziel-Druckdialog und dessen vollständig gesichteter Prüf-PDF. Ist dieser Test in der freigegebenen Stufe nicht erreichbar, bleibt der Bogen ein vorgeprüfter Entwurf mit offener Druckfreigabe; keine automatische Installation oder Canvasplatzierung.

## Standard für neue hybride HTML-Arbeitsblätter (D-259)

Die Nutzerentscheidung vom 14. Oktober 2026 gilt standardmäßig für neue Hybrid-ABs im Tafelraum-HTML-Workflow. Die Lehrkraft muss die technischen Layoutdetails nicht bei jedem Materialauftrag erneut angeben. Sie legt Inhalt, Lernziel und gegebenenfalls Ausgabeformat fest; die Standardpipeline übernimmt den Papier-/Interaktionsvertrag.

- `tafelraum-unterrichtsmaterial` führt in den Reihenkontext und übergibt HTML an `tafelraum-interactive-html`. Das ist der gemeinsame Einstieg, keine dritte Materialpipeline.
- Neue hybride HTML-Pakete deklarieren `print.layout = shared-pages`, denselben Bildschirm-/Druck-Entry und vollständige `data-tafelraum-page`-Abschnitte. Initial sind Seitenproportionen, Aufgabenanordnung und Seitenumbrüche in Lehrer-/Room Canvas und Druck gleich. Die erste vollständige A4-Seite bildet den Ausgangsviewport; weitere Seiten scrollen im Dokument.
- Zugehörige Lösungsblätter, ausgefüllte Fassungen und Musterantworten übernehmen diesen Modus automatisch: ebenfalls gemeinsame A4-Seiten, dieselbe Orientierung, korrespondierendes Grundlayout und gleiche Aufgabenbezüge. Keine gesonderte responsive Lösungsansicht. Falls längere Musterantworten mehr Platz brauchen, Fortsetzungsseiten bewusst planen und druckprüfen, statt Inhalte abzuschneiden oder kleinzuskalieren. Lösungen zu ausdrücklich digitalen Tools bleiben im passenden digitalen Modus.
- Der äußere Blattträger wird proportional am Eckgriff skaliert. Digitale Antwortfelder dürfen anschließend manuell nach unten wachsen und innen scrollen. Folgeaufgaben dürfen dadurch digital nach unten rücken; Papier-Schreibraum, Druckseiten und frische leere Vorlage bleiben unverändert. Mehr digitaler Platz ersetzt keine ausreichende Handschriftkapazität im Ausdruck.
- Farben, Typografie, Aufgabenformen, Seitenzahl und Randgestaltung bleiben materialabhängig. Die Referenz-CSS ist ein technisches Beispiel, keine fachübergreifende Designvorlage. Ein ausdrücklich rein digitales Tool oder anderes Ausgabeformat erhält seinen passenden Vertrag.
- `--require-print` und die tatsächliche Ziel-Druckabnahme bleiben verbindlich. Nach freigegebener Archivinstallation den **installierten** Manifeststand prüfen; nach freigegebener Canvasplatzierung das echte Archiv-Einfügen prüfen: komplette erste Seite, proportionaler Eckgriff, keine alte Inhaltszoomleiste. Ein Output-Entwurf oder ein Appupdate allein aktiviert keine Materialvorlage. Ohne produktive Platzierungsfreigabe in einer getrennten QA-Basis testen und den produktiven Einfügecheck offen dokumentieren.
- Bestehende responsive Pakete bleiben lesbar. Ihre Umstellung benötigt eine eigene Materialrevision und gegebenenfalls Sicherung; gespeicherte Altinstanzen werden nicht still neu gesetzt. App-Unterstützung besteht seit 0.1.50; neue hybride Pakete erst in einer unterstützenden installierten App aktivieren. Native Querformatdruckorientierung benötigt weiterhin eine eigene Ziel-Druckabnahme.

## Erprobte Best Practices für hybride Arbeitsblätter

Die folgenden Punkte sind bewährte Ausgangsfragen, aber keine verpflichtende Seiten-, Aufgaben- oder Gestaltungsvorlage:

- Zwei Autorungsmodi lenken den Entwurf, ohne eine neue App-Kategorie zu bilden: `digital-interaktiv` meint ein fokussiertes, selbsterklärendes und touchgerechtes Canvas-Werkzeug ohne notwendige Arbeitsblatt-, Aufgaben- oder A4-Logik. `Hybrid-Arbeitsblatt` meint dieselbe ausfüllbare HTML-Oberfläche für gemeinsame Sicherung am Canvas und als leere A4-Druckfassung.
- Die Begriffe `Arbeitsblatt` und `AB` führen ohne abweichende Formatangabe standardmäßig zum Hybrid-Arbeitsblatt. Ausdrückliche Wünsche wie `nur digital`, Word, PDF, statisches ImageGen-Blatt oder keine Eingabemöglichkeit gehen vor.
- Neue hybride HTML-Blätter starten mit den gemeinsamen Papierproportionen gemäß D-259. Nachträgliches digitales Feldwachstum bleibt möglich; Inhaltshierarchie, Aufgabenfolge, Formulierungen und Antwortbezüge bleiben erkennbar dasselbe Blatt. Responsive Bestandsblätter bleiben kompatibel.
- `Hybrid` meint im üblichen Arbeitsblattkontext ein einziges HTML-Material, das digital ausfüllbar und als frische leere A4-Vorlage druckbar ist. HTML plus separate PDF sind zwei Ausgaben und werden nur auf Wunsch erzeugt.
- Vor dem Layout wird festgelegt, ob ein Material nur digital oder wirklich hybrid genutzt wird. Digital-only darf auf Reflow, Scrollen und wachsende Felder setzen; hybrid muss auch ausgedruckt ohne digitale Größenänderung vollständig bearbeitbar sein.
- Für offene Antworten funktionieren großzügige umrandete Schreibblöcke häufig besser über Tastatur, Stift und Ausdruck hinweg als vorgegebene Schreiblinien. Linien bleiben eine begründbare Option.
- Bei hybriden Blättern wird die Druckhöhe aus der erwarteten Handschrift abgeleitet: als grobe Ausgangswerte etwa `10–12 mm` für einen Begriff, `20–25 mm` für einen Satz, `35–50 mm` für zwei bis drei Sätze und `45–60 mm` für mehrsätzige Notizen. Entscheidend ist die Prüfung mit einer realistischen Beispielantwort; ungenutzter Platz am Seitenende hilft nicht, wenn das konkrete Antwortfeld zu klein ist.
- Für druckbare Materialien gilt die verbindliche Druckfreigabe unten. Wenn sichere Ränder und ausreichender Handschriftraum nicht entspannt auf eine Seite passen, ist eine geplante zweite Seite besser als verkleinerte Schrift oder automatische Druckerskalierung.
- Vor der Fertigstellung wird geprüft, ob Gestaltung die eigentliche Lernhandlung vorwegnimmt. Wenn Begriffe gefunden, markiert, geordnet, beschriftet oder erschlossen werden sollen, können Fettdruck, Wortlisten oder fertige Labels die Aufgabe ungewollt lösen. Bei einem anderen Lernziel dürfen genau diese Hilfen weiterhin sinnvoll sein.

## Verbindliche Druckfreigabe für Unterrichtsmaterial

Diese Regel gilt fachübergreifend für druckbare Materialien, insbesondere für HTML-Arbeitsblätter mit `print`-Fähigkeit. Sie legt keine Gestaltung oder Seitenzahl fest. Die Lehrkraft hat am 5. Oktober 2026 ausdrücklich bestätigt: **Der tatsächliche Ausgabeweg entscheidet über die Druckfreigabe.**

1. Zielumfang und Druckweg festhalten. Für die native Tafelraum-App ist `Material drucken` in der laufenden App maßgeblich; bei ausdrücklich anderer Nutzung der entsprechende Druckdialog. Paketvalidierung, Bildschirmansicht und Headless-/Chromium-PDFs sind Vorprüfungen, kein Ersatz für diesen Zielweg. Ein Safari-Dialog allein bestätigt keine Tafelraum-Druckfreigabe.
2. Die aktuelle Fassung im Ziel-Druckdialog bei `100 %`, passendem Papierformat und realistischen Rändern prüfen. Browserkopf/-fußzeilen bewusst einstellen und dokumentieren. Tatsächliche Seitenzahl mit dem vorgesehenen Umfang vergleichen; keine automatische Verkleinerung verwenden, um Überlauf zu verbergen.
3. **Aus genau diesem Dialog eine Prüf-PDF erzeugen** (`Als PDF sichern` oder `In Vorschau öffnen` und lokal sichern). Unter `output/material-checks/<id>/` außerhalb des Materialpakets und Unterrichtsarchivs ablegen. Diese PDF dient der Qualitätssicherung und ist kein zusätzlich bestelltes Unterrichtsmaterial.
4. **Alle Seiten dieser Druck-PDF rendern und visuell ansehen.** Seitenzahl allein genügt nicht. Prüfen: vollständiger Text, passende Abschnitts-/Aufgabenumbrüche, keine Leer-/Überlaufseiten, abgeschnittenen Felder oder Überlagerungen, lesbare Schrift und Grafiken, sichere Ränder und ausreichende Antwortkapazität anhand einer Beispielantwort. Die Bildschirmansicht wird ergänzend für digitale Bedienung und Reflow geprüft.
5. Bei Abweichungen Layout korrigieren und erneut durch denselben Ziel-Druckdialog ausgeben. Nach der letzten druckrelevanten Änderung muss die aktuelle Fassung geprüft sein; eine PDF einer früheren Version genügt nicht.
6. In der Materialnotiz kurz Ziel-App/Version, Druckeinstellungen, Soll-/Ist-Seitenzahl, Pfad der tatsächlich erzeugten Prüf-PDF und Ergebnis der Seitensichtung festhalten. Nur diesen belegten Stand als „druckgeprüft“ melden; physischer Ausdruck und Unterrichtserprobung bleiben getrennte Nachweise.

Die Autorisierungsstufen bleiben erhalten. Wenn der Zielweg ohne noch nicht freigegebene Archivinstallation oder Canvasplatzierung nicht erreichbar ist, darf der Entwurf weiter vorbereitet und vorgeprüft werden; die abschließende Druckfreigabe bleibt ausdrücklich offen. Nicht still installieren, neue Stunden anlegen oder produktive Flächen verändern, um einen Test zu ermöglichen. Technische Paketvalidierung bestätigt keine visuelle Druckfreigabe.

## Gestaltungsbeispiele als Orientierung

Für neue oder wesentlich neu gestaltete Arbeitsblätter sind die
[gemeinsamen Layoutreferenzen](../agent-references/README.md) der erste
Orientierungsweg. Auswahl und Sichtvergleich stehen zentral in
[LAYOUT.md](../agent-references/LAYOUT.md); sie gelten in Checkout und Agentenpaket.
Die folgenden persönlichen Fallkarten ergänzen Unterrichtskontext und Feedback.
Bei kleinen Revisionen keine neue Referenzrunde erzwingen.

Unter [`beispiele/README.md`](beispiele/README.md) entsteht ein Fallarchiv
konkreter Unterrichtsmaterialien. Es enthält sowohl geprüfte Beispiele als
auch ausdrücklich gekennzeichnete Kandidaten, damit Entstehung und Feedback
früh gesichert werden können. Es ergänzt Regeln und Reihendokumente, ohne
selbst verbindliche Vorgaben zu erzeugen.

Bei einem neuen Materialauftrag in einem laufenden Reihenchat wird zuerst der
aktuelle Auftrag mit dem vorhandenen einschlägigen Reihenkontext verbunden.
Ohne Spiegel oder private Beispiele aus dem Auftrag weiterarbeiten. Ein vorhandener
Beispielindex wird nur bei Bedarf gelesen: Nur bei
vergleichbarer Lernhandlung oder Gestaltungsfrage werden Fallkarte und bei
Bedarf Feedbackverlauf gelesen. Das gilt formatübergreifend für Bilder, PDFs,
Audio, interaktive Materialien und Arbeitsblätter. Es ist kein Auftrag, die
Beispiele nachzubauen oder jedes neue Material ins Beispielarchiv aufzunehmen.
Der Skill [`tafelraum-unterrichtsmaterial`](../../.agents/skills/tafelraum-unterrichtsmaterial/SKILL.md)
beschreibt diesen Einstieg; Format-Skills übernehmen die jeweilige technische
Erstellung und Prüfung.

Ein Agent zieht die Sammlung nur heran, wenn ein Beispiel zur aktuellen
Materialfunktion, Lerngruppe oder Nutzungssituation passt. Er übernimmt daraus
zuerst Begründungen und Prüffragen. Farben, Raster, Seitenzahl, Aufgabenfolge
und Formulierungen werden nicht automatisch kopiert. Widersprechen sich mehrere
gute Beispiele, entscheidet der konkrete Unterrichtsauftrag.

Ein realer Materialstand kann schon vor der Unterrichtserprobung als Kandidat
aufgenommen werden. Fehlendes Feedback oder ausstehende Prüfungen werden
kenntlich gemacht, nicht ergänzt oder als Erfolg ausgegeben. Der ausführliche
Entstehungs- und Feedbackverlauf liegt im Beispielarchiv neben der kurzen
Fallkarte; kanonisches Material und vorhandene Materialnotizen werden verlinkt,
für eine reine Fallaufnahme aber nicht verändert. Der Aufnahmeablauf (lokaler Beleg, nicht im öffentlichen Quellstand)
beschreibt, wie verfügbarer Chatkontext, typische Nachsteuerungen, Grenzen und
Originalartefakte dafür festgehalten werden.

## Aktuelles positives Referenzset: variabel weiterentwickeln

Nutzerpräferenz vom 5. Oktober 2026: Das [positive Referenzset](beispiele/README.md#positives-referenzset-für-ruhige-hybridblätter) soll bei vergleichbaren Arbeitsblattaufträgen als Gestaltungsorientierung dienen. Neue Blätter entwickeln diese Sammlung weiter; sie folgen keinem festen Template. Übertragbar sind vor allem die begründeten Eigenschaften: erkennbare Überschrift, Trennlinie, ruhiger Abstand zum deutlich hervorgehobenen Auftrag und zur Antwort passende Flächen. Farbwelt, Typografie, Dichte und Umfang bleiben Entscheidungen des konkreten Auftrags.

Wenn Lesetext/Material und Aufgaben getrennt ausgegeben werden, bevorzugt die Lehrkraft **eigenständige Teile mit eigener Seitenzählung**: zum Beispiel Lesetext 1/2–2/2 und Aufgaben 1/2–2/2. Jeder Teil beginnt mit einem eigenständigen Auftaktkopf; seine Fortsetzungsseiten dürfen kompakter sein. Bei vergleichbaren mehrteiligen Bögen den vorgesehenen Ausgabeweg im Brief festhalten und diese Präferenz berücksichtigen. Das verlangt weder getrennte HTML-Pakete noch zusätzliche PDF-Dateien, ändert keine App-Datenmodelle und ist keine Pflicht für Spiele, einseitige Übungen oder bewusst anders entworfene Materialien. Headergestaltung selbst bleibt eine sich entwickelnde Referenz, kein Standard.

## Neue Verbindung zur Anwendung

Wenn ein Agent ausdrücklich beauftragt ist, eine neue Unterrichtsstunde für eine bereits vorhandene Klasse, ein Fach und eine Reihe anzulegen, entsteht gleichzeitig ein echter Tafelraum-Unterricht:

```text
Unterrichtsauftrag mit ausdrücklich freigegebener Stundenanlage
→ bestehende Klasse, Fach und Reihe im Archiv eindeutig auflösen
→ Lesson-Eintrag mit stabiler ID anlegen
→ eigener Stundenordner mit `material/` für die Originalartefakte anlegen
→ Canvas und technische Renditions getrennt in `board/` und `assets/` halten
→ bisherige Spiegel-, Material- und Reflexionsarbeit fortführen
```

Ein vorhandener Reihenspiegel bleibt die lesbare inhaltliche Kontinuität; seine Anlage ist keine Voraussetzung für einen Tafelraum-Eintrag. `archive.json` und `lesson.json` machen dieselbe Stunde in der Anwendung sichtbar und adressierbar.

## Verbindlicher Agentenablauf

1. Die tatsächliche Archivbasis über `scripts/tafelraum-unterricht.mjs status`
   lesen; für Entwicklung die ausdrücklich getrennte Serveradresse verwenden.
   Zielklasse, Fach, Reihe und Stunde eindeutig auflösen. Kein stiller Wechsel
   zum persönlichen Desktoparchiv oder zur Entwicklungsreferenz unter `data/`.
2. Den passenden Kontext über die aufgelöste Hierarchie und `materialBasis`
   bestimmen. Einschlägige vorhandene eigene Regeln und Reihendokumente gemäß
   dem Einstieg oben lesen. Fehlende optionale Altdateien blockieren kein neues Archiv.
3. Eine ausdrücklich beauftragte neue Stunde mit `tafelraum-unterricht.mjs create`
   und der bestätigten Reihen-ID anlegen. Titel aus dem Auftrag; Datum nur bei
   bekanntem Termin, kein erfundener Termin. Beispiele/Befehle stehen in
   [Unterrichtsorganisation47](../implementation/47_TEACHING_AGENT.md).
4. Material im Ausgabebereich erstellen und prüfen. Bei beauftragter Übernahme
   `import`, `link` beziehungsweise `install-html` mit ausdrücklicher Ziel-ID
   verwenden; sie nutzen die bestehende additive Archivpipeline. Ein Import ist
   noch keine Canvasplatzierung. Worksheet-/Druckregeln gelten unverändert.
5. Bei beauftragter Canvasvorbereitung die Stunde mit `open` öffnen, frische
   Canvas-Agent-Sitzung/Revision lesen und den Canvas-Skill verwenden.
   Bestätigte Archivierung, bestätigte Canvas-Speicherung und Präsentation
   getrennt berichten. Ein Cacheeintrag allein ist keine Archivbestätigung.
6. Einen vorhandenen vereinbarten Reihenspiegel/Stundenstand nur mit dem
   tatsächlich erreichten Stand aktualisieren; Beobachtung, Nutzerbestätigung,
   Rekonstruktion und Planung unterscheiden. Ohne eigene Spiegeldatei kein
   zweites Planungsmodell für den Agentenzugang anlegen.

Das historische `create-archive-lesson.mjs` bleibt ein explizites Migrations-/
Offlinewerkzeug; der normale Agenteneinstieg verwendet den laufenden lokalen
Archivserver gemäß Vertrag47. Dessen CLI-Defaults sind kein allgemeines Schreibziel.

## Historischer Offline-/Migrationsbefehl

- Er verändert ausschließlich die Tafelraum-Dateibasis.
- Er löst Namen nur innerhalb der angegebenen Hierarchie auf; bei Mehrdeutigkeit verlangt er eine stabile ID.
- Er erzeugt eine eigene `materialBasis` unter `stunden/<lesson-id>/material/`; neue Stunden teilen keinen stillen Reihenpool.
- Er legt `lesson.json`, den stabilen Stundenordner und den Materialordner an. Ein Canvas darf zunächst leer beziehungsweise noch nicht vorhanden sein.
- Derselbe Titel mit demselben Termin in derselben Reihe wird bei einer Wiederholung als vorhandene Stunde erkannt. Nur `--allow-duplicate` erzeugt bewusst eine weitere Stunde.
- Schreibvorgänge sind atomar und bewahren den vorherigen Archivstand in `_history/`.
- Mit explizitem `--api` verwendet der Befehl bei passender Archivbasis den serialisierten Pfad des laufenden Servers (Desktop: 49317). Andernfalls schreibt er direkt und atomar in die ausdrücklich angegebene Dateibasis. Die älteren CLI-Defaults zeigen auf die Entwicklungsreferenz und Port 5175; sie sind keine produktive Archivwahl.

## Grenze dieser Entscheidung

Damit ist keine Unterrichtsmethodik, Arbeitsblattgestaltung oder allgemeine Generierungsregel neu festgelegt. Bestätigt ist nur:

> Eine durch einen Agenten neu angelegte Stunde wird nicht mehr ausschließlich als Spiegel- oder Materialzustand geführt, sondern gleichzeitig als reale Tafelraum-Lesson derselben Reihe.

Persönlicher historischer Migrationsstand: Die Portierung des früheren Ordners `<frueherer-unterrichtsordner>` ist abgeschlossen. Er ist keine Arbeitsquelle mehr. Neue Spiegel, Materialien, Arbeitsblätter und Reflexionen entstehen ausschließlich im Tafelraum-Unterrichtsarchiv; ein unveränderlicher Rückfall-Snapshot bleibt nur zur Wiederherstellung erhalten.
