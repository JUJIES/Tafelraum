# Apphärtung: Speicherung, Projektion und optionale Dienste

Stand29.10.2026, D-325. Auftrag: die Befunde aus dem Performance-/Stabilitätsreview
gezielt umsetzen, ohne neue Architektur, Dependencies oder parallele Datenmodelle.
**Arbeitsbaumstand; keine Installation oder Veröffentlichung.** Lokale0.1.88 und
öffentliche0.1.85 bleiben die zuletzt bestätigten Auslieferungen.

## Speichervertrag

Das Dateiarchiv bleibt kanonisch. `canvas-persistence.ts` verwendet den vorhandenen
IndexedDB-Snapshotstore zusätzlich für eine kleine Hülle: Snapshot, Schreibsequenz,
Bestätigungsstatus und zugrunde liegende Archivrevision. Keine neue Datenbank,
Archivstruktur oder zusätzliche Outbox. Rohe Cachewerte älterer Apps bleiben lesbar.

- Ausstehender Entwurf mit gleicher Archivbasis wird nach Neustart wieder geladen.
  Vor dem nächsten Boardcommit werden seine vorhandenen gecachten Bildbytes über
  die bestehende Assetqueue bestätigt. Große Wiederaufnahmen werden in begrenzte
  Requests aufgeteilt; unbestätigte Batches bleiben für Retry erhalten.
- Bei abweichender Archivrevision verlangt die Lehreransicht eine Wahl. Ein
  Hintergrundkopiervorgang trifft diese Wahl nicht selbst. „Archiv öffnen“ verwirft
  den Entwurf; „Entwurf wiederherstellen“ behält die aktuelle Archivfassung in der
  bestehenden Historie, auch innerhalb des normalen Historienintervalls. `If-Match`
  gilt unverändert: eine weitere konkurrierende Änderung wird erneut abgewiesen.
- Ältere rohe Cachewerte haben keinen Bestätigungsnachweis. Unterscheiden sie sich,
  erfolgt einmalig dieselbe Rückfrage; identische Archivbytes bestätigen auch einen
  verlorenen ACK ohne falschen Konflikt. Zeitstempel allein entscheiden nie.
- Späte ACKs bestätigen nur die gesendete Sequenz und führen die Basisrevision eines
  neueren Entwurfs nach. Sie ersetzen keinen neueren Cachewert. Fehlgeschlagene
  Boards bleiben auch nach erfolgreichen anderen Requests sichtbar ungespeichert.
- Ein nicht verfügbarer Browsercache blockiert intakte Archivlese-/Schreibwege nicht.
  Ohne Cache wartet Speichern auf den tatsächlichen Archivcommit. Fallen beide Wege
  aus, wird der Fehler weitergereicht und angezeigt. Auch der Aufräumpfad nach
  fehlgeschlagener Kopie führt seinen Archivabschluss unabhängig vom Cache aus.

Ein harter Prozessabbruch innerhalb des noch nicht ausgeführten Canvas-Debounces
ist keine garantierte Speicherung. Ein Konflikt wird nicht automatisch gemischt.
Ein neues Browserprofil besitzt die originlokalen Entwürfe des alten Profils nicht.
Vollbackups bleiben unabhängig erforderlich; siehe [Backupvertrag03](03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md).

## Geordnetes Beenden und Aktualisieren

Tauri hält Schließen/Beenden zurück und fordert einen eindeutigen Speicherauftrag
von `main` an. Der vorhandene Canvas-Port liefert den letzten Stand; Notizen warten
auch auf bereits laufende Autosaves und deren neueren Folgeauftrag. Die bestehenden
Archivqueues und ein noch ausstehender Katalogentwurf werden mitgeprüft.

Ein modaler Speicherzustand beendet Textfokus und sperrt neue Lehrereingaben. Room
wird vor dem letzten Snapshot beendet, damit vorne keine neuen Eingaben eintreffen.
Unspeicherbar geschaltete HTML-Eingaben behalten ihre bewusste Verwerfbestätigung.
Nur das passende positive ACK erlaubt Exit; veraltete/zweite ACKs gelten nicht.
Fehler oder30-Sekunden-Timeout lassen die App offen. Ein bereits beendetes Room-
Fenster startet dabei nicht automatisch erneut. Der lokale Dienst endet erst mit
wirklichem Exit, nicht schon bei `ExitRequested`.

Updates laden zuerst ihre Bytes, schließen dann das Speichern ab und installieren
anschließend. Während eines Downloads bleibt geordnetes Beenden möglich; tatsächlicher
Speicherabschluss und Installation sind gegen paralleles Beenden gesperrt. Fehler
geben die Eingabe wieder frei. Keine Änderung von Signaturprüfung/Updatekanal.
Die Browserwarnung berücksichtigt zusätzlich ausstehende Canvasänderungen.

## Performance ohne abweichende Projektionslogik

Room und Remote verwenden denselben `SceneChangeTracker`: Versions-/Geometrie-
merkmale und exakte numerische Punkt-/Druckkopien ersetzen die wiederholte große
JSON-Signatur. Auch direkt mutierte native Punktarrays werden erkannt; keine Hash-
Kollisionen oder Vertrauen allein auf Versionszähler. Nur veränderte Elemente
ersetzen ihre Vergleichskopie. Das ist flüchtige Änderungsdetektion, kein zweiter
fachlicher Szenenstand. Sichere öffentliche Projektion und Wire-Verträge bleiben.

HTML und registrierte Apps teilen pro Inspektion einen flüchtigen Element-/Gruppen-
index. Z-Reihenfolge, Textabdeckungen, vorläufige Striche und bewegte Annotationen
bleiben erhalten. Rotationen werden pro Annotation zusammengesetzt statt pro Punkt
zweimal berechnet. Der Index wird pro Inspektion neu aufgebaut und kann daher keine
veralteten Engineobjekte über Frames hinweg festhalten.

Synthetischer Vorher-/Nachher-Vergleich im selben Node24-Lauf,20 Materialien,
100 Punkte je Strich,20 Messungen nach Warm-up; Median in Millisekunden:

| Striche | Änderungsprüfung vorher → nachher | HTML-Projektion vorher → nachher |
| --- | --- | --- |
| 250 | 1,88 → 0,64 | 1,29 → 1,09 |
| 1.000 | 7,63 → 2,54 | 4,94 → 3,56 |
| 3.000 | 24,52 → 7,54 | 16,16 → 12,92 |

Bei3.000 Strichen entfallen rund8,6MB temporärer Signaturtext je Prüfung. Die
Zahlen betreffen diese CPU-Teilpfade; keine zugesicherte Browser-FPS, Speicherquote
oder native Touchlatenz. Beleg: `output/app-hardening-2026-10-29/performance.jsonl`.

## Optionale Anschlüsse und öffentliche Vorbereitung

- Lerndeck bleibt die einzige registrierte externe App der persönlichen Fassung.
  Seit dem Nutzerauftrag vom31.10.2026 laden platzierte und wiederhergestellte
  Instanzen direkt; Gerätefreigabe, Verbindungsschalter und Platzhalter entfallen.
  Die frühere originlokale Präferenz wird nicht mehr ausgewertet. Ein leerer
  Canvas lädt den Anbieter weiterhin nicht. Registrierung/Allowlist bleibt die
  Distributionsgrenze; öffentlich ist sie leer. Träger, Annotationen und
  Anbieteranmeldung bleiben unverändert.
- Remote liest die bestehende `/api/live/config`-Auskunft beim Öffnen der Regie.
  Fehlende Einrichtung deaktiviert Remote; Fehler lassen sich erneut prüfen.
  Ein vorhandener berechtigter Sitzungsstand und Room bleiben unabhängig bedienbar.
- Capture, Remote, lokale Modelle, direkte KI und offizieller Updatekanal sind in
  der [README-Matrix](../../README.md#lokaler-kern-und-optionale-dienste) getrennt.
  Keine Ersatzserver-URLs, private Konfigurationskopien oder neue Credentialablage.
  Der separate Lerndeck-Anbieter und ein externer Codex-/MCP-Pluginserver werden
  durch dieses Repository nicht mitimplementiert.

Die bestehenden Export-/Prune-Werkzeuge bleiben maßgeblich. Kein pauschales Löschen
von Builds, Daten, Historie oder parallel bearbeiteten Dateien. Öffentlicher
Dokuumfang und konkrete Verteilungsbedingungen bleiben vor Upload abzugrenzen.

## Prüfung und verbleibende Freigabe

- App-Tests460 plus15 Playback-Tests; Live-/Room-Tests116; vier Rusttests.
- Typprüfung und Webbuild inklusive Lizenz-/Assetguards.
- Browser-Kernsuite: echter IndexedDB-Ausfall, fehlgeschlagene Board-/Assetwrites,
  Reload, beide Konfliktentscheidungen, Altcache, verlorener/später ACK, Kopieren und
  ursprüngliche Material-/Stundenwechselregressionen. Synthetische Datenbasis.
- Chromium/WebKit: leeres Profil ohne externe Requests; direktes Lerndeckladen bei Platzierung und Reload,
  Abschalten und Reload; tatsächliche StrictMode-Canvaswiederherstellung;
  Remote-Einrichtung, Fehler/Retry; Desktop-IPC mit laufendem
  Write, negativem ACK, Freigabe und verspätetem Abschluss eines abgelaufenen Auftrags.
  Fremdanbieter ist eine lokale Testantwort; kein Login/produktiver Dienstkontakt.
- Entwicklerstart aus eigenständiger Quellkopie: Build, Dev/Preview, Navigation,
  Materialpersistenz und vorhandene Dependencyregressionen.

Automatisch wiederholbar über `npm test`, `npm run test:live`, `npm run test:browser`
und `cargo test --manifest-path src-tauri/Cargo.toml --lib` im Appverzeichnis.
Die Kernsuite installiert/prüft jetzt Chromium **und** WebKit. Belege in
`output/app-hardening-2026-10-29/`, `output/app-hardening-regression/`,
`output/storage-material-regression/` und `output/developer-onboarding/`.

**Freigabegrenze:** Ein signierter neuer Desktopbuild samt echtem Quit-/Update-
Neustart, erweitertem Room-Bildschirm und realer Touch-/Stiftprüfung steht noch aus.
Cargo und simulierte IPC bestätigen diesen nativen Betriebsablauf nicht allein.
Keine Änderungen an produktivem Archiv, installierter App oder Dienstbereitstellung.
