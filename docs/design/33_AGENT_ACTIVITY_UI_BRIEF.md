# Agentenaktivität in der Lehreransicht

Gemeinsame Produktfunktion für persönliche und öffentliche lokale Fassung. Der
[Stand vom 5. November](#gemeinsame-weiterentwicklung--05112026) ersetzt die
abweichenden Anzeige- und Abschlussregeln der folgenden Entwurfs- und
Entwicklungsnotizen. Ausgangspunkt sind die [Agentenverbindung](31_AGENT_CONNECTION_UI_BRIEF.md), die [Unterrichtsnavigation](03_ARCHIVE_PLANNING_SIDEBAR_UI_BRIEF.md), der [Canvasvertrag](../implementation/45_CANVAS_AGENT.md) und die [Unterrichtsorganisation](../implementation/47_TEACHING_AGENT.md).

## Was die Lehrkraft sieht

Die Lehrkraft arbeitet in A, während ein lokaler Agent Material für B vorbereitet. Nur die sichtbare Zeile von B zeigt während eines tatsächlichen Schreibauftrags eine kleine Aktivitätsanzeige. Ein Klick auf die Zeile führt wie bisher in die Stunde. Eine zugeklappte Reihe bleibt zu. Bei der Anlage einer neuen Stunde kann ihre Zeile erst erscheinen, sobald der Katalog den Eintrag bestätigt. Keine Platzhalterstunde vorwegnehmen.

In der geöffneten Zielstunde steht das vorhandene Bot-Symbol aus „Agent verbinden“ neben einer kurzen Tätigkeit am Stundentitel. Währenddessen bleibt der Titel lesbar. Für die Stundenzeile die vorhandene sekundäre Textfarbe und einen kompakten Ring nutzen. Datum und Zeilenhöhe bleiben stabil. Der Ring ist Teil der bestehenden Schaltfläche, kein zweites Klickziel. Bei knapper Breite zuerst den Statustext verkürzen oder visuell ausblenden. Der zugängliche Name bleibt erhalten. Eine höfliche Statusansage pro Arbeitsschritt genügt. Die Liste soll Screenreadern keine zweite identische Meldung vorlesen.

| Ereignis | Deutsch | Englisch |
| --- | --- | --- |
| Materialimport läuft | Fügt Material hinzu | Adding material |
| Neues Material bestätigt | Material hinzugefügt | Material added |
| Zwei neue Bilder werden platziert | Platziert zwei Bilder | Placing two images |
| Gemischter Canvasauftrag läuft | Ordnet den Canvas | Arranging the canvas |
| Canvas geändert, Speichern fehlgeschlagen | Änderung noch nicht gespeichert | Changes not yet saved |

Anzahl und Materialart nur nennen, wenn sie aus validierten Operationen feststehen. Bei sehr kurzen Schritten direkt das Ergebnis zeigen. Als Startwerte für den Browsertest den Spinner nach 180 ms zeigen, die Erfolgsmeldung nach ca. 1,5 s ausblenden. Fehler dürfen nicht als Erfolg ausklingen. Dafür den bestehenden Speicher-/Fehlerzustand nutzen.

## Wo die Umsetzung ansetzt

1. **Aktivität eindeutig zuordnen.** Die Lehrer-Shell hält flüchtige Einträge pro Zielstunden-ID und Auftrag. Ein Eintrag enthält einen erlaubten Tätigkeitstyp, Phase und Ablaufzeit. Der Transportkontext trennt Archiv und Lehrersitzung. Gleichnamige Stunden, zwei Fenster und überlappende Aufträge müssen getrennt bleiben. Ein verspätetes Ende darf einen neueren Auftrag nicht löschen. Bei Sitzungsende, Verbindungsabbruch oder Ablauf aufräumen. Keine Daten im Snapshot, Agentenprompts oder freien Dateipfade im Status.
2. **Archivarbeit im Hintergrund sichtbar machen.** Heute schreibt das Organisations-CLI zuerst und sendet anschließend ein generisches `refresh`. Das reicht für die aktualisierte Liste, aber die App erfährt weder Beginn noch Ziel des Imports. Den bestehenden Organisationskanal um eine validierte, optionale Aktivitätsmeldung vor und nach einer Mutation ergänzen. Dieselbe Korrelations-ID über Beginn, Ergebnis und Refresh führen. Für die Anzeige keinen zweiten Broker und keinen Dateiwächter anlegen. Ein alter Host oder fehlender Anzeigeempfänger darf einen gültigen Import nicht blockieren. Der Agent darf bei verlorenem Anzeige-ACK den Import nicht wiederholen. Bei Duplikaten keinen Neuzugang animieren. Ein Archivcommit mit fehlgeschlagener Aktualisierung gilt als gespeichert, aber noch nicht sichtbar.
3. **Canvasauftrag in der offenen Zielstunde beobachten.** Der Canvas-Port gehört zur aktuell geöffneten Stunde. An den vorhandenen Apply-Pfad anbinden. Inspect, Validierung und bloße Agentenverbindung bleiben still. Bei einem Stundenwechsel die alte Portgeneration verwerfen. In geschlossenen Stunden kann der Agent Material archivieren. Für Canvasplatzierung muss die Zielstunde geöffnet sein. Ein Hintergrundimport darf keinen Stundenwechsel auslösen. Offene Geste, Präsentation und ungespeicherte Eingaben behalten die bisherigen Schutzregeln.
4. **Bewegung lokal rendern.** Die betroffene Gruppe einmal ca. 200 ms lang gemeinsam einblenden. Am lokalen Übernahmezeitpunkt die tatsächlich erzeugten Objekt-IDs verwenden. Die zurückgegebenen IDs nach dem Speicherabschluss kommen für einen echten Erstauftritt zu spät. Vor dem Bau prüfen, ob Canvasrenderer und HTML-Projektion einen gemeinsamen lokalen ersten Zeichenzeitpunkt erlauben. Bei HTML insbesondere den bestehenden Iframe erhalten. Niemals persistierte Deckkraft ändern, Material neu mounten oder einen zweiten Player überlagern. Ist ein echtes Fade auf der gerasterten Fläche nur mit Eingriffen in die Szene möglich, im ersten Slice stattdessen eine kurze lokale Kontur um die neue Gruppe einblenden. Diese Variante ist optisch abzunehmen. Bei reduzierter Bewegung unmittelbar anzeigen. Zoom, Auswahl, Hit-Testing, Undo und Schülerprojektion folgen weiter ausschließlich der fachlichen Szene.
5. **Öffnen mitten im Auftrag.** Vorhandene Inhalte sofort vollständig anzeigen. Nur neue, nach dem Laden in dieser Ansicht übernommene Elemente animieren. Bei außerhalb des Bildausschnitts eingefügten Objekten reicht der Text am Titel. Weder Kamera noch Fokus versetzen.

## Reihenfolge und Abnahme

- **Erster Durchstich:** In einem synthetischen Archiv A öffnen, über die echten Agentenwerkzeuge ein Bild nach B importieren. In A bleibt alles bedienbar. B zeigt den Status. B per Klick öffnen und zwei Bilder mit einem Apply platzieren. Der Titel benennt den Schritt, die Bilder erscheinen zusammen. Anschließend speichern, neu laden und die unveränderte Szene ohne Wiederholungsanimation prüfen.
- **Fehlerprüfung:** langsamer Import, sehr schneller Import, identischer Retry, doppelte Materialdatei, fehlgeschlagener Refresh nach Commit, Apply mit fehlgeschlagenem Flush, Uhrzeitablauf, zwei Fenster und Stundenwechsel während des Imports. Spinner und Erfolgsmeldung dürfen weder hängen bleiben noch zur falschen Stunde wandern.
- **Designabnahme:** Beide lokalen Profile, Deutsch/Englisch, helles/dunkles Theme, schmaler Viewport mit langem Stundentitel und Datum, Tastatur, Reduced Motion und Room-Fenster. Mit geöffnetem interaktivem HTML Fokus, Eingabewert und Playerlaufzeit kontrollieren. Desktop-Screenshots belegen keine Touch- oder Projektorlesbarkeit.
- **Auslieferung:** Gemeinsame Quelldateien in der persönlichen Basis pflegen, öffentlichen Kandidaten über den bestehenden Export erzeugen und die Übereinstimmung der betroffenen Pfade prüfen. Entwicklertest und Film nutzen eine lokal gestartete öffentliche Testinstanz. Die statische Webdemo hat keine Agentensitzung. Installation, Kollegenupdate und GitHub-Veröffentlichung sind separate Entscheidungen.

## Erster Entwicklungsprototyp · 1. November 2026

Import, Link und HTML-Installation melden Beginn und Ende über die ausgewählte Organisationssitzung. Flüchtige Meldungen laufen im vorhandenen Longpoll getrennt von der exklusiven Befehlswarteschlange. Der normale Refresh bestätigt weiterhin die Ansichtsaktualisierung. Canvas-Apply und Clipbefehle nutzen die tatsächlich geöffnete Lehrerfläche. Bei neu erzeugten Objekten blendet eine lokale Kontur um die Gruppe ein und aus (560 ms). Die vorhandene gerasterte Szene und interaktive Player behalten ihren Zustand. Angezeigte Texte sind lokalisiert. Kein Release. Browserbeleg im Onboardingtest mit synthetischem Archiv, verzögertem Refresh und regulären CLI-Befehlen.

### Materialprüfung · 01.11.2026

Der Onboardingtest importiert ein zweitseitiges PDF und ein synthetisches MP4 gemeinsam in eine bereits ausgefüllte HTML-Stunde. Er prüft beide Seiten, Wiedergabe während eines weiteren Agentenauftrags, dieselbe Playerinstanz und die gespeicherte Antwort nach Reload. Die lokalen Testdateien unter scripts/fixtures/agent-media enthalten zwei gezeichnete Rechtecke und einen generierten blauen Videoframe. Der Entwicklungsserver liefert den PDF-Modulworker ohne Vite-Client aus. Der Videoplayer setzt seine Quelle beim Start jedes Effekts und gibt sie beim Abbau wieder frei. Lokale Hostregistrierungen werden auch beim Verlassen der Seite und nach verspäteter Registrierungsantwort freigegeben. Echte Projektor-/Tonhardware, externe YouTube-Verfügbarkeit, große PDF-Stapel und die Druckausgabe bleiben eigene Prüfungen.

Offene Browsergrenze: In zwei Zusatzläufen mit installiertem Google Chrome im Headless-Modus erreichte der automatisierte Klick auf A im Lehrer-Embed nach Start von Room und Wahl von Materialclip 3 das HTML-Feld nicht. Das Testprotokoll meldet einen vom body abgefangenen Klick. Der reguläre Chromium- und WebKit-Lauf bestand. Eine Gegenprobe mit sichtbaren Fenstern muss zwischen Browserautomatisierung und tatsächlichem Eingabefehler unterscheiden.

### Platzhalter während der Materialvorbereitung · 01.11.2026

Ein validierter Platzierungsauftrag zeigt an seinen bekannten Canvaspositionen kleine, nicht bearbeitbare Vorschaukarten mit Materialtyp, Dateiname und „Wird vorbereitet“. Die endgültige Größe wird erst beim Laden ermittelt, daher sind die Karten Anker und keine maßstabstreuen Vorschauen. Sie bleiben ausschließlich in der Lehreransicht und werden weder gespeichert noch projiziert. Pannen, Zoomen und Größenänderungen führen die Anker mit. Nach der Auftragsausführung, bei Fehler, Stundenwechsel oder Ablauf werden sie entfernt. Nach bestätigter Speicherung lautet der kurze Status „Fertig“. Dies bestätigt den Canvasauftrag, nicht die Abspielbereitschaft externer Medien.

Bereits fertige Inhalte bleiben über ihren vorhandenen Renderer bedienbar. Die Karten sind selbst inert. Konkurrierende Bearbeitung vorhandener Objekte wird weiterhin durch Gesten-/Revisionsprüfungen abgefangen. Der Slice implementiert neue Materialplatzierungen. Der nachfolgend dokumentierte Ausbau ergänzt den ausdrücklichen Anfang-/Endevertrag für mehrere Agentenbefehle. Das Sperren vorhandener Objekte bleibt außerhalb dieses Slices. Vor einer bekannten Platzierungsposition gibt es allein die Aktivität an der Stundenzeile. Die normale gezielte Aktualisierung ersetzt eine vollständige Seitenerneuerung, damit vorhandene HTML-Antworten und Playerzustände erhalten bleiben.

### Fehler- und Ablaufzustände · 01.11.2026

Aktivität und Materialplatzhalter verwenden dieselbe Auftragsfrist. Laufende Archivimporte erneuern ihre flüchtige Anzeige alle zehn Sekunden. Bei ausbleibender Bestätigung endet der Spinner mit „Ergebnis unbestätigt“. Fehler bleiben bis zur nächsten Arbeit derselben Stunde sichtbar; bestätigter Erfolg verschwindet nach 1,8 Sekunden. Bereits übernommene, aber nicht gespeicherte Canvasänderungen heißen ausdrücklich „Übernommen · noch nicht gespeichert“. Ein bestätigter Archivimport ohne erfolgreichen Ansichtsrefresh heißt „Gespeichert · Ansicht nicht aktualisiert“. Keine automatische Wiederholung der Mutation.

Der bestehende Broker unterscheidet abgelaufene, noch nicht zugestellte Aufträge (`expired`) von zugestellten Aufträgen ohne Bestätigung (`unconfirmed`). Beide geben den Warteschlangenplatz frei. Nach unbestätigter Ausführung sind neue Schreibaufträge bis zu erfolgreichem `inspect`/`context` gesperrt. Refresh bleibt möglich, hebt diese Sperre jedoch nicht auf. Auftrags-IDs bleiben während der Sitzung erhalten; verspätete Ergebnisse werden angenommen. Materialabrufe verwenden die Auftragsfrist als Abbruchsignal. Der nachfolgende Ausbau ergänzt Arbeitsphasen über mehrere Befehle; Objektsperren bleiben außerhalb.

Prüfungen: Broker-/CLI-Tests decken Ablauf vor/nach Zustellung, Inspektionspflicht, verspätete Bestätigung und identische Wiederholung ab. Der Browsertest ergänzt fehlendes Material sowie einen gezielten Archivspeicherfehler nach Canvasübernahme mit anschließender Speicherung ohne Wiederholung. Bestehende HTML-/Room-, PDF-, MP4- und Reload-Prüfungen bleiben Bestandteil desselben Laufs. Nur lokale Quelländerung in persönlicher und öffentlicher Fassung; keine Installation, kein Update und kein GitHub-Push.

### Zusammenhängende Arbeitsphase · beauftragter Ausbau 01.11.2026

Eine ausdrücklich gestartete, UUID-gebundene Arbeitsphase pro Zielstunde überbrückt einzelne Befehle. Sie verwendet dieselbe Stundenzeile und Titelanzeige, ohne Panel oder weitere Animation. Zwischen echten Arbeitsschritten steht „Bereitet Materialien vor“ (Preparing materials); laufende Befehle zeigen ihre bestehende konkrete Tätigkeit. Ein Lebenszeichen spätestens alle 30 Sekunden verlängert die Frist auf 120 Sekunden. Ohne Lebenszeichen erscheint „Ergebnis unbestätigt“. Abbruch heißt „Vorbereitung abgebrochen“ (Preparation cancelled), erfolgreicher Abschluss „Unterrichtsfläche vorbereitet“ (Lesson canvas prepared). Keine Aussage über didaktische Qualität oder externe Medienbereitschaft.

Start, Lebenszeichen, Abschluss und Abbruch laufen als bestätigte Befehle durch den vorhandenen Organisationskanal. Die Phase wechselt keine Stunde und sperrt keine Objekte. Eine neue UUID kann eine beendete Phase ersetzen; alte IDs werden in der laufenden Shell nicht wiederbelebt. Fehler während einer Phase bleiben für deren Abschluss maßgeblich, auch wenn später ein anderer Schritt gelingt. Abbruch beendet die Anzeigephase, rollt aber nichts zurück und stoppt keinen bereits zugestellten Schreibauftrag. Abschluss erfordert die geöffnete Zielstunde, keine laufende Präsentation/Geste, keine offenen oder fehlerhaften beobachteten Schritte und einen erfolgreichen Flush bei unveränderter Szene. Nach Reload/Hostverbindungswechsel keine automatische Wiederaufnahme. Der Agent darf Abschluss nur melden, wenn auch seine außerhalb der App ausgeführten Arbeiten bestätigt sind.

Abnahme des Ausbaus: WebKit (persönliche Quelle) und Chromium (öffentlicher Checkout) prüfen dieselbe echte CLI-Pipeline in getrennten synthetischen Archiven. Sichtbelege zeigen Vorbereitung zwischen Schritten und bestätigten Gesamtabschluss an Titel/Stundenzeile. Fehlerhafte Schritte einschließlich Speicherfehler verhindern den Abschluss auch nach späterem Erfolg. Zeitvorlauf prüft ausbleibende Lebenszeichen. Typechecks und gezielte Tracker-/Broker-/CLI-/Agentenpakettests ergänzen die Prüfung. Keine Touch-/Projektor- oder native Abnahme. Laufende Exportvorschau auf5174 weiterhin älter; kein Umschalten, Installieren oder Veröffentlichen.
## Gemeinsame Weiterentwicklung · 05.11.2026

Ein kompakter Status unter den Canvas-Aktionen zeigt den tatsächlichen
Agentenschritt auch bei geschlossener Navigation. In einer anderen Stunde
nennt er das Ziel und ein Pfeil kennzeichnet den Wechsel per Klick. Der
Status folgt der Position der Canvas-Aktionen. Das vorhandene Layout
berücksichtigt seine Höhe bei der Materialablage. Der Ring an
der Zielzeile bleibt eine sekundäre Anzeige. Der Status verwendet Bot,
Häkchen und Warnsymbol. Nur die Buchstaben des laufenden Arbeitsschritts
bekommen einen schmalen silbrigen Lichtstreifen von links nach rechts.
Die Box blendet in 180 ms ein und in 220 ms aus. Schritte innerhalb eines
Auftrags wechseln ohne erneutes Einblenden. Ausblendende Ziele sind sofort
inaktiv. Bei reduzierter Bewegung erscheinen und verschwinden Meldungen
unmittelbar, mit statischem Text. Neue Objekte behalten die bestehende
kurze Kontur in der Lehreransicht. Erfolgsstatus bleibt sechs Sekunden,
Fehler bleiben bis zur bisherigen fachlichen Auflösung sichtbar.

Materialphasen können mit geprüftem Materialbestand in einer geschlossenen
Stunde abschließen. Canvasphasen behalten die bisherigen Speicherprüfungen.
Die Anzeige wechselt beim tatsächlichen Canvascommit zu „Speichert den Canvas“.
Die Vorbereitungskarte endet mit dem Sichtbarwerden des platzierten Materials.
Bildanzahlen stammen aus den aufgelösten Platzierungen beziehungsweise den
gespeicherten Objekten. Die lokale Arbeitsphase bleibt anbieterunabhängig.
