# Lokale Backups und Wiederherstellung

## Zweck

Seit D-189 ist `~/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv/` die aktive fachliche Wahrheit dieses Arbeitsplatzes. `data/unterrichtsarchiv/` bleibt eine geprüfte Migrations- und Entwicklungsreferenz. Stundenspezifische `.history/`-Dateien helfen bei einzelnen Fehlständen, schützen aber weder das ganze Archiv noch vor einem Ausfall des Arbeitsordners. Vollbackups liegen deshalb getrennt unter `data/unterrichtsarchiv-backups/` und werden niemals als Materialbasis gelesen.

Der Archivserver schützt normale App-Speicherungen zusätzlich mit einer Dateirevision. Ein Tab darf nur den Boardstand ersetzen, den er selbst geladen hat. Hat ein anderer Tab inzwischen gespeichert, bleibt dessen neuerer Stand erhalten und der veraltete Schreibversuch wird als Konflikt abgewiesen.

Katalogspeicherungen sind semantisch no-op-sicher: Ein unveränderter Katalog erhält keinen neuen Zeitstempel und erzeugt keine Archivhistorie. Ändert sich nur eine Stunde, bleiben die materialisierten Dokumente unberührter Fächer, Reihen und Stunden einschließlich ihres jeweiligen `updatedAt` bytegleich. Historien bleiben damit Wiederherstellungsstände echter Änderungen und kein Protokoll bloßen Öffnens oder Abgleichens.

## Bestätigte Canvas-Bildspeicherung (D-303)

Canvasbilder werden weiterhin zuerst im bestehenden IndexedDB-Cache und dann
über die Archiv-Assetroute gespeichert. Netzwerk- und Serverfehler werden bis
zum aufrufenden Import/Kopiervorgang weitergegeben; ohne Archivbestätigung wird
kein neues Bild auf der Fläche übernommen. Eine erfolgreiche andere Speicherung
oder ein erfolgreicher Katalogabruf darf die Assetwarnung nicht aufheben.

Ausstehende Bilddaten werden je Stunde in der laufenden Sitzung seriell erneut
übertragen: beim nächsten Assetaufruf, vor dem Board-Schreiben und beim expliziten
Flush (auch ohne wartenden Snapshot). Bestätigungen entfernen nur die tatsächlich
gesendete Dateifassung. Kopieren und der vorhandene Cache-Abgleich speichern
Bilddaten vor dem zugehörigen Snapshot. Erfolgreiches Entfernen der Canvasassets
verwirft auch ihre ausstehenden Uploads, damit ein späterer Flush sie nicht
wiederherstellt. Archivpfade, Dateiformat und IndexedDB-Schema bleiben unverändert.

D-325 ergänzt die Wiederaufnahme nach Neustart über Metadaten im bestehenden
Browsercache. Ausstehender Entwurf und bestätigte Archivrevision werden gemeinsam
gespeichert; abweichende Archivfassung verlangt eine Wahl. Ältere rohe Cachewerte
werden bei Abweichung vorsichtig als mögliche Entwürfe behandelt. Wiederherstellen
sichert die konkurrierende Archivfassung trotz Historienintervall; Revisionen
bleiben zwingend. Cacheausfall blockiert keine intakte Archivspeicherung.
Vollständiger Ablauf und Grenzen in [Prüfstand56](56_APP_STABILITY_AND_PERFORMANCE.md).
Regressionstests und reproduzierbarer Browserlauf stehen bei D-303 im Decision Log.

## Archiv prüfen, ohne es zu verändern

Vor einer Bereinigung oder wenn die Zuordnung von Katalog, Stundenpfaden und HTML-Paketen unklar ist:

```bash
node scripts/archive-doctor.mjs --archive "$HOME/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv"
```

Optional prüft `--archive /absoluter/pfad` einen anderen Archivstand; `--json` liefert maschinenlesbare Ergebnisse. Der Doctor verwendet für interaktive HTML-Pakete denselben Laufzeitparser wie die App und meldet objektive Fehler, prüfenswerte Alt-/Testbestände, `_unassigned`-Reste und ungewöhnlich große Historien. Er schreibt, verschiebt, repariert und löscht nichts. Warnungen sind Prüfhinweise und keine Löschfreigabe; echte Änderungen am Archiv folgen weiterhin dem Backup-Ablauf.

## Verbindlicher Codex-Ablauf

Vor direkten Codex-Operationen, die vorhandene Archivdateien überschreiben, verschieben oder strukturell verändern:

```bash
node scripts/create-archive-backup.mjs \
  --archive-root "$HOME/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv" \
  --output-dir data/unterrichtsarchiv-backups \
  --label vor-ler-umbau
node scripts/verify-archive-backup.mjs /absoluter/pfad/zum/ausgegebenen-backup.tar.gz
```

Das erste Skript erzeugt ein vollständiges komprimiertes Archiv sowie eine gleichnamige `.json`-Metadatendatei mit Größe und SHA-256-Prüfsumme. Seit D-284 führt es selbst die vollständige Wiederherstellungsprüfung aus: Größe/Prüfsumme prüfen, getrennt temporär entpacken und `archive.json` lesen. Der zweite Befehl bleibt für eine unabhängige spätere Prüfung gültig. Das aktive Archiv wird dabei nicht verändert; die JSON-Ausgabe des Erzeugers bleibt mit bestehenden Migrationsaufrufern kompatibel.

## Begrenzte lokale Aufbewahrung (D-284)

Im repository-lokalen `data/unterrichtsarchiv-backups/` bleiben **die fünf neuesten Vollbackups je Quellpfad (`archiveRoot`)** erhalten. Produktivarchiv und frühere Migrationsquelle werden getrennt behandelt. Nach erfolgreicher Erstellung prüft der Erzeuger vor einer Bereinigung sämtliche verbleibenden Sicherungen vollständig mit dem bestehenden Restore-Prüfer. Scheitert eine Prüfung, wird kein altes Backup gelöscht. Archiv und zugehörige Metadaten werden als Paar entfernt; unbekannte Dateien, Quellen und stundenlokale Historien sind kein Bereinigungsziel. Ein Verzeichnis-Lock verhindert parallele Aufbewahrungsbereinigungen.

Manuelle Vorschau und Anwendung derselben Regel:

```bash
node scripts/prune-archive-backups.mjs
node scripts/prune-archive-backups.mjs --apply
```

Andere Ausgabeziele werden beim Erstellen zwar geprüft, aber **nicht automatisch ausgedünnt**; eine bewusste Anwendung dort benötigt `--output-dir /absoluter/pfad --apply`. Abgebrochene/unbekannte Dateien bleiben zur manuellen Prüfung liegen. Ein verwaister `.retention-lock` nach einem Prozessabbruch darf erst nach Prüfung auf noch laufende Sicherungsprozesse entfernt werden.

Normales Kompilieren und Programmupdates erzeugen keine Unterrichts-Vollbackups. Die Sicherungspflicht betrifft direkte Codex-Eingriffe in bestehende Unterrichtsdaten, nicht Code-, Dokumentations- oder reine Buildarbeiten. Additive Materialien benötigen weiterhin kein Vollbackup. Die lokale Aufbewahrung begrenzt die Zahl der Stände, nicht die Größe des aktiven Unterrichtsarchivs. Externe Gerätesicherung bleibt notwendig.

Alte Appkopien und erzeugte Builddateien besitzen seit D-305 eine getrennte
[begrenzte Buildablage](09_DESKTOP_APP_UND_UPDATES.md#begrenzte-buildablage-d-305).
Dieser Ablauf liest oder bereinigt keine Unterrichts-Vollbackups und ersetzt
deren fünf Stände je Quellarchiv nicht.

Rein additive Arbeit — etwa ein neu erzeugtes Material in einem neuen Dateinamen — benötigt kein Vollbackup. Vor dem Ersetzen eines bestehenden Boards, Katalogdokuments, Materials oder vor einer Migration ist es Pflicht. Diese Regel steht zusätzlich in `AGENTS.md`, damit sie auch für neu gestartete Codex-Chats gilt.

## Wiederherstellung

1. Tafelraum und schreibende Browserfenster schließen.
2. Gewünschtes Backup mit `verify-archive-backup.mjs` prüfen.
3. Backup in einen neuen, getrennten Ordner extrahieren; niemals direkt über das aktive App-Archiv.
4. `archive.json`, betroffene Stunde und benötigte Materialien im extrahierten Bestand prüfen.
5. Erst nach expliziter Freigabe entweder einzelne nachweislich benötigte Dateien zurückkopieren oder das aktive Archiv kontrolliert austauschen. Vor dem Austausch erneut ein Backup des aktuellen Stands anlegen.

## Schutzgrenze

Die Standardablage `data/unterrichtsarchiv-backups/` liegt auf demselben Gerät. Sie schützt gegen fehlerhafte Codex-Änderungen, versehentliches Überschreiben und beschädigte aktuelle Stände, aber nicht gegen Verlust oder Defekt des Macs. Für echte Gerätesicherheit muss derselbe Befehl regelmäßig mit `--output-dir` auf ein extern gesichertes Ziel zeigen, zum Beispiel ein Time-Machine- oder synchronisiertes Laufwerk. Ein solches Ziel wird nicht ohne bewusste Auswahl als zweite aktive Materialquelle verwendet.


### Private Stundennotizen (D-302)

Vollständige Archivbackups müssen `_private/student-notes/` einschließlich der
Personenlisten, Stundennotizen und Historien erhalten. Bei Wiederherstellung
zusammen mit derselben `archive.json` restaurieren; keine einzelnen Notizdateien
in einen anderen Kurs übertragen. Canvas-/Materialkopien und Exporte enthalten
diese privaten Daten absichtlich nicht. Unbestätigte Browserentwürfe sind eine
originlokale Outbox, kein Bestandteil des bestätigten Archivbackups. Details in
[Vertrag46](46_STUDENT_NOTES.md).
