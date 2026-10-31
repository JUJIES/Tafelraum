# Unterricht mit dem Tafelraum-Agentenpaket

Dieses Paket dient der Materialvorbereitung und Unterrichtsorganisation, nicht
der Appentwicklung. `README.md` ist der Einstieg. Die Produktverträge und vier
Skills im Paket sind die gemeinsame Grundlage für alle Agenten. Persönliche
OpenAI-/MCP-/Arbeitsblattplugins sind optionale getrennte Werkzeuge, keine
maßgebliche Variante dieser Pipeline.

- Paketordner nur lesen. Ein eigenes beschreibbares Arbeitsverzeichnis wählen.
- Auftrag und tatsächlicher Archivkatalog bestimmen Ziel und Umfang. Vorhandene
  ausdrücklich vereinbarte fachliche Regeln der Lehrkraft berücksichtigen; keine
  fehlenden privaten Regeldateien oder historischen Unterrichtsfälle nachfordern.
- Materialentwurf, Archivübernahme und Canvasplatzierung sind getrennte Schritte.
  Mehrere Schritte dürfen gemeinsam beauftragt sein. Bekannte Freigaben nicht
  wiederholt erfragen, aber aus einer Materialidee keine Archivänderung ableiten.
- Für HTML denselben mitgelieferten Prüfer verwenden; bei Arbeitsblättern
  `--require-print`, sofern nicht ausdrücklich anders bestellt. Technische Prüfung,
  visuelle Prüfung und tatsächliche Druckfreigabe unterscheiden.
- Die laufende App nennt das Archiv. Nie direkt an Canvas-/Boarddateien schreiben;
  Organisation und Canvas über die validierten CLIs und deren normale Speicherwege.
- Beispiele erklären Technik. Fach, Aufgaben, Layout und Schwierigkeitsgrad anhand
  des Auftrags entwickeln. Keine zusätzlichen generellen Gestaltungspflichten erfinden.
- Vorhandene Materialien/Quellen, private Notizen und Schlüssel erhalten. Kein
  Dienst-/Plugin-Upload, keine Appinstallation und kein Präsentationsstart aus
  einem Materialauftrag ableiten.

Vor Operationen, die bestehende produktive Katalog-, Stunden-, Board- oder
Materialdateien überschreiben, verschieben oder umfangreich umstrukturieren,
zuerst den vorhandenen Backupweg verwenden und prüfen. Die mitgelieferten
`scripts/create-archive-backup.mjs` und `scripts/verify-archive-backup.mjs` dienen
dafür; Archivwurzel aus `status` und einen eigenen beschreibbaren Ausgabeordner
explizit angeben. Rein additive neue Materialdateien benötigen kein Vollbackup.
Ein Backup ist Rückfallartefakt und nie Materialquelle. Details im mitgelieferten
`docs/implementation/03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md`.
