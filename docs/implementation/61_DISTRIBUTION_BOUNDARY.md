# Persönlicher Entwicklungsweg und öffentlicher Quellstand

29.10.2026, D-330. Lokale Vorbereitung; kein Commit, Upload, Desktopaustausch oder
Update veröffentlicht. Die installierte App und ihre Daten werden nicht geändert.

## Produktgrenze

| Bestandteil | Persönliche Entwicklung / Kollegenpaket | Öffentlicher Quellstand |
| --- | --- | --- |
| Canvas, Archiv, Materialien, Notizen, lokale HTML-Pakete | enthalten | enthalten |
| Room Canvas, Clips, lokale Eingaben und Präsentation | enthalten | enthalten |
| Modellunabhängiger lokaler Agentenzugang | enthalten | enthalten; keine Abhängigkeit von einem KI-Key oder persönlichen Plugin |
| Lerndeck | bestehende Registrierung, direkt beim Öffnen verfügbar | keine Registrierung, Appauswahl oder Verbindungseinstellung; Icon ausgeschlossen |
| Experimenteller Modellanschluss für HTML | bestehende Keyverwaltung, Provider und freigegebene Satzprüfung | keine Keyverwaltung/-UI, Providerimplementierung oder aktive HTML-Modellbrücke |
| Remote Canvas | bestehender persönlicher Weg | keine Auswahl, Einrichtung oder Wiederverbindung; kein Remote-Dienst/Teilnehmerbuild |
| Official desktop updater | Existing signed colleagues channel | Manual by default; official Public Mac packages use a separate signed GitHub channel (contract65) |

Die Satzprüfung war ein erster Test des persönlichen Modellanschlusses für
HTML-Embeds, keine allgemeine KI-Funktion. Ein späterer öffentlicher Anschluss
benötigt einen eigenen anbieterunabhängigen Vertrag. BYOA bleibt davon getrennt.
Handyaufnahme und lokale Bildaufbereitung sind weiterhin optional und brauchen
eigene Einrichtung; ihr Umfang wird durch diese Entscheidung nicht erweitert.

## Eine gemeinsame App, kleine Distributionsadapter

`prototypes/surface-shell-a-b/distribution.json` beschreibt den geprüften Umfang.
Der gemeinsame Arbeitsbaum bleibt `personal`. Der öffentliche Export übernimmt
sechs kleine Adapter aus `distribution/public/`: Profil, persönliche Einstellungen,
serverseitige Einstellungsanbindung, Remote-Provisionierung, Modelllaufzeit und
HTML-Modellbrücke.
`selectPublicDistribution` in `scripts/public-distribution.mjs` führt eine feste,
reviewbare Auswahl aus; keine beliebigen Codeersetzungen aus einer Konfigdatei.

Lerndecks konkrete Registrierung liegt im persönlichen Profil. Die generische
Allowlist und vorhandene Objektmetadaten bleiben gemeinsam. Die öffentliche
Liste ist leer; gespeicherte Objekte berechtigen nie zu Anbieterrequests. Alte
Appträger werden nicht gelöscht oder migriert; ohne Anbieterregistrierung steht
ihre eingebettete Oberfläche dort nicht zur Verfügung. Generische Geometrie und
Referenzen bleiben im Snapshot. Seit31.10.2026 entfällt persönlich die Gerätefreigabe; die Anbieteranmeldung bleibt
unverändert; Schlüsselbund-Service und Account werden nicht geändert.

Das öffentliche HTML behält bestehende Manifestvalidierung und Sandbox.
Experimentelle `sentenceCheck`-Metadaten bleiben lesbar, aktivieren aber keinen
Provider: kein injizierter Modellclient, keine Frame-Requestbrücke und keine
Credentialroute; direkte Satzanfragen scheitern mit503. Normale HTML-Eingaben,
Wiedergabe, Druck, Materialzuordnung und Room-Projektion bleiben unverändert.

Remote wird auch hinter der UI gesperrt: keine Konfigurationsabfrage bei Öffnen,
keine Übernahme einer alten Hostsession, kein Einladungsaufbau und keine lokalen
Provisionierungsrouten. Der separate Dienst, Viewer und dessen Buildkommando
fehlen im Export. Die für Room benötigten gemeinsamen Projektions-, Clip-,
Protokoll- und Geometriedateien bleiben enthalten. Der historische Name
`test:live` umfasst deshalb weiterhin lokale Room-/Projektionsprüfungen.

Native Updatebefehle prüfen das beim Kompilieren eingebettete Profil vor jeder
Aktion. Official native builds register the updater for their own channel; default
public source builds remain manual. Signature verification and orderly save
completion remain shared. No user-facing switch between product editions.

## Verbindliche Arbeitsregel je Repository (D-331, ergänzt31.10.2026)

[Standregister und Zielklärung](../WORKING_STATES.md) ist der kanonische Vertrag
für alle Agentenchats. [AGENTS.md](../../AGENTS.md) verpflichtet vor Änderungen
zum Lesen und zur Rückfrage bei mehrdeutigem Ziel. Änderungsziel
(Vollfassung/öffentlich/beide), tatsächliche Quellbasis, Prüfumgebung und
Auslieferung werden separat aufgelöst und im Start/Abschluss genannt.

`distribution.json` belegt das Quellprofil, nicht die Absicht des Nutzers.
Eindeutige Folgeaufträge übernehmen ihr Ziel; offene Tabs, gleiche Versionen
und lokale Exporte autorisieren weder Profilwechsel noch Installation oder
Veröffentlichung. Lokale Umgebungszuordnungen werden, soweit vorhanden, in
`local-data/development-environments.json` erfasst und live geprüft. Fehlende
Rechnerdateien sind keine Voraussetzung öffentlicher Checkouts.

Die private Entwicklung bleibt führend; gemeinsame Logik wird einmal gepflegt,
gezielte Änderungen dürfen beide oder nur eine Variante betreffen. Öffentliche
Kandidaten entstehen aktuell weiterhin über den festen Export, auch beim gezielten Entwicklungsabgleich mit `refresh public`. Zwei unabhängige
Repositorys sind noch nicht eingerichtet. Persönliche Konfigurationen/Daten und
bestehende Installationen bleiben außerhalb einer reinen Quelländerung.

## Arbeits- und Freigabeweg

1. Kleine nachvollziehbare Änderungen im privaten Entwicklungsstand prüfen und
   künftig regelmäßig lokal versionieren. Ein lokaler Commit ist kein Upload.
2. Für persönliche Installation einen geprüften Build einfrieren und lokal
   abnehmen. Kollegen können nach gesondertem Auftrag genau dieses Paket über
   den bestehenden Updatekanal erhalten; kein Neubuild beim Hochladen.
3. Für GitHub Änderungen aus einem festgehaltenen, geprüften Quellstand bewusst
   auswählen, einen neuen öffentlichen Export
   erstellen und **diesen** prüfen. Private Historie nicht mitübernehmen.
4. Nach dem ersten Upload eine fortlaufende öffentliche Historie pflegen;
   weder private Commits blind pushen noch bei jeder Aktualisierung neu beginnen.

Dies richtet keine Branches oder Remotes ein und ersetzt noch keinen späteren
Workflow für öffentliche Beiträge. Die Profilgrenze wählt nur den genannten
Funktionsumfang; weitere Featureauswahl bleibt eine bewusste Quellentscheidung.
Der bisherige Updatekanal ist öffentlich erreichbar, kein zugangsgeschützter
Kollegenbereich. Private Schlüssel, Unterricht und persönliche Konfigurationen
werden weiterhin nie exportiert.

## Prüfen und Exportieren

Vom Repository-Root mit Node24:

```sh
node scripts/check-distribution.mjs
node --test scripts/prepare-public-source.test.mjs
node scripts/prepare-public-source.mjs output/<neuer-auftrag>/source
node output/<neuer-auftrag>/source/scripts/check-distribution.mjs
```

Der Export verweigert bestehende Ziele und führt ein Manifest über Adapter,
Ausschlüsse und Dateihashes. `check-distribution.mjs` prüft vor Tests/Builds und
in CI, dass Profil, Quellumfang und native Konfiguration übereinstimmen. Die
Lizenz-/Herkunftswächter bleiben aktiv; nur der Nachweis des tatsächlich nicht
mitkopierten Lerndeck-Icons entfällt im Export.

Im öffentlichen Appverzeichnis normal `npm ci`, `npm test`, `npm run test:live`,
beide Typprüfungen, `npm run build` und `npm run test:browser` ausführen. CI prüft
den enthaltenen Umfang; der entfernte Remote-Dienst und dessen eigene Tests sind
keine öffentlichen Projektbestandteile. Die persönlichen Tests bleiben im
Arbeitsbaum erhalten. Öffentliche Abwesenheitsprüfungen testen echte Desktop-
API404, ausbleibenden Credential-/Netzzugriff und gesperrte Hostwiederaufnahme.

Konkrete lokale Läufe und Grenzen werden unter `output/distribution-split/`
aufgezeichnet. Browser-/Rusttests ersetzen keinen signierten nativen Installations-
oder Updateversuch, keine echte Stift-/Zweitbildschirmabnahme und keinen
Windows-/Linux-Nachweis. Keine solche Installation ist hier beauftragt.


## Gemeinsame UI-Pflege (30.10.2026)

Room-Einklappen und Versionseinstieg werden in den gemeinsamen Komponenten
gepflegt und unverändert exportiert. Einstellungen zeigen je Profil
`Version und Updates` oder `Version`; nur persönlich gibt es Updatehinweis und
-befehle. `npm run test:ui-settings` prüft beide Profile mit demselben Browserflow.
Der lokale Kandidat unter `output/ui-settings-public-final/source/` enthält
diese Änderungen; kein Git-Remote, Upload oder installierter Appaustausch.


## Superseding updater boundary (2026-11-02)

The earlier blanket ban on public updating is superseded by
[contract65](65_DESKTOP_RELEASE_CHANNELS.md). Public default builds remain manual;
the official public desktop build enables its own GitHub updater. The colleagues
key, endpoint and identity must never be used for a public update.
