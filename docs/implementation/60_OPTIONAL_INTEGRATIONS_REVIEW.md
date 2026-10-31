# Persönliche Anschlüsse und erster öffentlicher Einstieg

Fortschreibung D-330: Die beauftragte Trennung ist in [Vertrag61](61_DISTRIBUTION_BOUNDARY.md) umgesetzt.
Die folgende Tabelle hält den ursprünglichen persönlichen Befund fest, nicht den
öffentlichen Funktionsumfang. Persönlicher Nachtrag31.10.2026: Lerndeck lädt
bei Platzierung/Reload direkt, ohne Gerätefreigabe oder Verbindungsschalter;
dies ersetzt den entsprechenden historischen Tabellenbefund.

29.10.2026. Befund auf Nutzerfrage, keine implementierte Funktionsfreigabe oder
Entfernung. Der bisherige Quellkandidat ist technisch geprüft; die verständliche
öffentliche Erstnutzung persönlicher/experimenteller Anschlüsse ist ein zusätzlicher
Produktpunkt. Kein Upload, externer Login, Schlüsselabruf oder Eingriff in Nutzerdaten.

## Tatsächlicher Stand

| Anschluss | Verhalten ohne persönliche Einrichtung | Einordnung für den öffentlichen Start |
| --- | --- | --- |
| Lerndeck | Fest registrierter externer Anbieter. Auf neuem Profil keine automatische Verbindung; Appauswahl und „Lerndeck verbinden“ sind dennoch sichtbar. | Anbieter und gesondertes Agenten-/MCP-Plugin werden nicht mitgeliefert. Nutzerfreigabe ist keine Zugangsberechtigung. Der noch nicht veröffentlichte eigene Dienst ist kein allgemein verfügbarer Standardbestandteil. |
| KI-Anschluss | Einstellung ist sichtbar; ohne eigenen Key keine direkte Satzprüfung. Speicherung bisher nur im macOS-Schlüsselbund. | Aktuell ausschließlich eng freigegebene Word-Families-Satzprüfungen für kompatible HTML-Pakete. Keine allgemeine KI, kein Chat und keine Freischaltung des externen Canvas-Agenten. |
| Remote Canvas | Ohne lokale Live-Konfiguration deaktiviert; Dienstcode ist enthalten. | Öffentlich nach eigener Einrichtung nutzbare optionale Erweiterung, kein automatischer Zugang zum Dienst des Entwicklers. |
| Handyimport | Ohne Aufnahme-Konfiguration verborgen; Relaycode ist enthalten. | Optionaler eigener HTTPS-Dienst; nicht automatisch Bestandteil des lokalen Kerns. |
| Erweiterte Bildaufbereitung | Ohne private Modell-/Python-Konfiguration bleibt die bisherige Kontrastfunktion. | Basisfunktion nutzbar, DocRes/MBD-Ausbau persönlicher Pilot mit separater Laufzeit. |
| Video-Lab-Satzprüfungsbrücke | Nur für ausdrücklich deklarierte alte Pakete und eigene Loopback-Konfiguration. | Kompatibilitätsweg für vorhandene persönliche Inhalte; kein allgemeines öffentliches KI-Backend. |
| Externer Canvas-/Unterrichtsagent | Lokale CLI/Skills vorhanden; Canvasvorbereitung braucht geöffnete Lehreransicht. | Eigener, dokumentierter Anschluss. Einrichtung nicht automatisch und unabhängig vom OpenAI-Key in den App-Einstellungen. |
| Native Updates | Tauri-Konfiguration zeigt auf den offiziellen JUJIES-Kanal. Native Starts und spätere Prüfereignisse fragen ihn ab. | Aktuell auch bei selbst gebauten nativen Apps. Updateprüfung und Installation unterscheiden; eine bewusste Build-/Vertriebsgrenze fehlt noch. |

## Konkrete Lücken

`AiConnectionSettings.tsx` benennt Speicherung und Anbieter, erklärt aber den
derzeit einzigen Verwendungszweck nicht. Das Eintragen eines Keys macht
gewöhnliche Materialien nicht KI-fähig. `sentence-check-tasks.mjs` und
`createDirectSentenceGateway` erlauben feste Aufgaben und prüfen deren Ziele.
Die passenden persönlichen Unterrichtspakete sind nicht im Quellkandidaten.

`embedded-apps.ts` enthält eine feste Lerndeck-URL. Die vorhandene boolesche
Verbindungsfreigabe schützt neue Profile vor automatischen Anbieterrequests,
behebt aber die sichtbare Erwartung „hier ist eine verwendbare App“ nicht.
App-Registry, iframe-Einbettung und externer Lerndeck-/Plugin-Dienst sind zu trennen.

`tauri.conf.json` und `check_for_updates` verwenden den offiziellen Updatekanal;
`RunEvent::Ready` startet eine Prüfung. Das ist keine automatische Installation,
aber eine tatsächliche Netzverbindung eines nativen Eigenbaus. Der bisherige
Browser-Fresh-Profile-Test ist kein Beleg für das Netzwerkverhalten von Tauri.

Private Schlüssel, Anbieteranmeldungen und persönliche Konfigurationen sind
kein Bestandteil des geprüften Quellkandidaten. Die Lücken betreffen vor allem
Verfügbarkeit, verständliche Bedienung und klar getrennte Nutzungspfade.

## Empfohlener nächster Produktschritt – noch nicht umgesetzt

1. Den lokalen Kern normal anbieten. Unveröffentlichte persönliche Anschlüsse
   wie Lerndeck standardmäßig aus den normalen Einstiegen herausnehmen und nur
   nach bewusster lokaler Experimentfreigabe anbieten.
2. KI-Anschluss ebenfalls als begrenztes Experiment einordnen. Vor Keyeingabe
   Verwendungszweck, notwendige Pakete, eigenen API-Zugang und Datenübermittlung
   verständlich erklären. Den vorhandenen Key und dessen Ablage erhalten.
3. Remote/Handyimport als optionale selbst einzurichtende Dienste anbieten;
   fehlende Einrichtung eindeutig erklären. Keine Ersatzverbindung zu privaten
   Servern einsetzen.
4. Offiziellen Updater nur für bewusst dafür gebaute Vertriebsfassungen aktivieren;
   Quell-Eigenbauten sollen nicht still in diesen Vertriebspfad wechseln.

Die Umsetzung braucht kleine, explizite Verfügbarkeitsregeln entlang der
vorhandenen Konfiguration. Nicht durch Löschen unbekannter Canvasobjekte oder
Umschreiben alter Stunden lösen. Bestehende Lerndeck-Träger/Anmeldungen und
KI-Schlüssel müssen erhalten bleiben; deaktivierte Träger benötigen eine
verständliche Darstellung ohne Anbieterrequest. Die persönliche Installation
und der öffentliche Standard sollen dieselben Produktpfade verwenden.

Vor UI-Änderungen Styleguide und passende Briefs lesen. Verifizieren: leeres
Profil ohne private Dienste, sichtbare/verborgene Einstiege, Wiederöffnung alter
Lerndeck-Träger, Keyerhalt sowie fehlende Updateanfragen bei einem Eigenbau.
Danach einen neuen öffentlichen Kandidaten prüfen. Screenshots und README allein
ersetzen diese Produktklarheit nicht.


## Ergänzung: Mitgelieferte Skills und öffentlicher Agentenstart

[AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md) trennt die fünf bereits im Repository
vorhandenen Skills von persönlich installierten Plugins und Werkzeugen. Der
Agentenanschluss hat eine konkrete lokale Basis. Die öffentlichen Material-
Anleitungen sind dennoch noch an private `_rules/source`-Dateien gekoppelt;
auch diese Hürde muss vor einer einfachen Erstnutzungszusage aufgelöst werden.
Keine persönlichen globalen Skills oder deren Installation wurden hier verändert.
