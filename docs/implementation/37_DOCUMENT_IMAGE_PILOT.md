# Lokale DocRes-Aufbereitung mit korrigierbarem Zuschnitt

17. Oktober 2026 · D-267 · persönlicher Apple-Silicon-Pilot, 0.1.60.

**Historischer Stand 0.1.60:** Die rechteckige Scanbedienung wird ab 0.1.61 durch
vier unabhängige Ecken mit Perspektivvorschau ergänzt (D-268). Aktueller Vertrag
und zusätzliche drei Dateireferenzen: [Prüfstand 38](38_DOCUMENT_PERSPECTIVE_TEST.md).

## Produkt und Datenfluss

Bestehendes Bild auswählen → **Scan optimieren** → lokale Verarbeitung mit
Spinner/Abbrechen → **Original / Verbessert**, Ausschnittrahmen und Randfelder →
**Vorschau ansehen** → **Anwenden**. Der Blattrahmen ist ein Vorschlag, keine
Garantie vollständiger Schrift. `Ganzes Foto` verwirft den Vorschlag. Ein engerer
Textausschnitt lässt sich ebenfalls manuell einstellen. Fehlende Kamerapixel
werden nicht rekonstruiert.

DocRes-Task `appearance`, MPS/FP16, internes Limit 1024, vollständige Ausgabegröße.
Zuvor MBD/FP32 mit 448er Eingabe; äußeres Rechteck über alle Maskenpixel plus 2 %
Rand je Bildachse. Kein neuronales Dewarping: an beiden Testfotos ging dabei
Schrift verloren (Prüfstand 36). Rechteckiger Zuschnitt entfernt bei schiefem
Papier nicht jeden Tischwinkel. Perspektivische oder gekrümmte Entzerrung ist
ausdrücklich nicht implementiert.

Original und Ergebnis behalten dieselben Pixelmaße. Ein bestätigter Ausschnitt
nutzt den vorhandenen nativen Image-Crop, bleibt am bisherigen Canvasmittelpunkt
und kann später über das vorhandene Zuschneidewerkzeug geändert werden. Die
Quelldatei wird nicht beschnitten oder überschrieben. Bild mit vorhandenem Crop,
Spiegelung, fremder Gruppe, gebundener Annotation oder Abdeckung: nur Aufbereitung,
keine Geometrieänderung; Vorschau zeigt den bestehenden Ausschnitt einschließlich
Spiegelung. Eine alleinstehende eigene Annotationsgruppe ist kein Hindernis.

`docres-appearance-v1` ergänzt `scan-contrast-v1` im bestehenden Enhancement-Vertrag.
Abgeleitete PNG und ursprüngliche File-ID laufen durch `saveCanvasFiles` und den
vorhandenen Snapshot-/Archivpfad. Originalreferenz bleibt beim Laden, Kopieren und
Export erreichbar. `Originaldarstellung verwenden` stellt Originalpixel innerhalb
des aktuellen Zuschnitts dar; Undo/Redo behandelt Aufbereitung und Zuschnitt als
einen Schritt. Keine automatische Archivmaterial-Dublette, kein Canvas-Autoplace.

## Betrieb

`document-image-server.mjs` bedient ausschließlich die Loopback-API
`/api/document-image/status` und `/process` auf demselben Origin. Fremde, opaque
und andere lokale Origins sowie fremde Site-Kontexte werden abgewiesen; POST
benötigt JSON und eigenen Header. Keine Dateipfade aus Requests. Ein Prozess je
Serverinstanz; Reservierung bis zum tatsächlichen Prozessende. Abbruch beendet
Python (TERM/KILL), Timeout 120 s, Eingang höchstens 24 MB JSON / 16 Megapixel /
10000 Pixel je Kante, begrenzte Ausgabe. Kein Bild auf dem Beelink, keine
temporären Bilddateien oder Bild-/Pfadlogs im Dienst.

Stundenwechsel/Unmount bricht ab. Zielrevision, File-ID und Existenz werden nach
asynchronen Schritten geprüft; neue Annotationen verhindern einen geometrischen
Commit. Späte Ergebnisse dürfen keine gelöschten/geänderten Bilder wiederbeleben.
Eine bereits gespeicherte, danach verworfene PNG kann als unreferenziertes Asset
zurückbleiben; kein zweiter Speicherpfad und keine unsichere automatische Löschung.

Persönliche `document-image.json` neben `unterrichtsarchiv/` enthält absolute Pfade
`python`, `repo`, `weights`, `mbdWeights`. Ohne Konfiguration bleibt die bisherige
Kontrastfunktion verfügbar. Bei konfiguriertem, fehlschlagendem DocRes kein stilles
Ersatzverfahren. Keine automatische Installation oder Modell-Downloads in der App.
Der Worker prüft offiziellen Git-Commit und unveränderte getrackte Quellen sowie
beide Checkpoint-Hashes, lädt Torch mit `weights_only=True` und prüft endliche
Vorhersagen vor der Bildkonvertierung. Herkunft/Hash-Einschränkungen siehe Prüfstand
36; Modellgewichte stammen aus dokumentierten Mirrors.

`scripts/provision-document-image.mjs` kopiert die bereits geprüfte Pythonbasis,
Umgebung, Quellen und Checkpoints in eine eigenständige private Laufzeit außerhalb
von Repository, Codex-Cache und Bundle. Parameter:
`--python-env`, `--repo`, `--weights`, `--mbd-weights`, `--destination`, `--config`.
Vorhandene Ziele/Konfiguration werden nicht überschrieben. Apple-Silicon/macOS,
APFS-Klonkopie; kein allgemeiner Installer für andere Rechner. Aktuell Python
3.12.14, Torch 2.14.1, OpenCV 4.13.0, einops 0.8.2, NumPy 2.3.5, Pillow 12.3.0.
MBD und DocRes laufen nacheinander, Metal-Cache dazwischen geleert. Der weiterhin
hohe DocRes-RAM-Bedarf aus Prüfstand 36 bleibt relevant. Große Fotos und
Hardwarebedienung benötigen weitere Praxisbeobachtung.

Vite verwendet `local-data/document-image.json` oder
`TAFELRAUM_DOCUMENT_IMAGE_CONFIG_PATH`. Desktop liest die Konfiguration neben dem
Archiv. Bundle enthält nur Middleware, drei Python-/Lizenzdateien; keine private
Konfiguration, Pythonumgebung oder Checkpoints. Packprüfung schließt diese Daten
aus. UI-Brief 25 ist verbindlich.

## Prüfung

- Beide echten Fotos im Worker: Ausgabe gegen bisherige `appearance`-Resultate
  pixelgleich bestätigt; kanonische Originale anhand ihrer Hashes unverändert.
- Eigenständige private Laufzeit: Foto 2 einschließlich Maskenrechteck identisch
  zum Entwicklungsworker; alle vier Pfade außerhalb Repository/Cache.
- Isolierte echte App unter `scripts/document-image-qa.mjs`: Spinner, Vorschlag,
  Randfeldkorrektur, Eckgriff per Pfeiltaste, Vergleich, Vorschau, Anwenden,
  gemeinsame Undo/Redo-Aktion, Reload, Originalumschaltung, Abbrechen geprüft.
  Produktives Archiv nicht als Testziel verwenden.
- 350 App-Tests einschließlich neuer Origin-/Serialisierungs-/Abbruchtests und
  Crop-/Zielrevisions-/Originalreferenztests; 113 Live-/Room-Tests, Rust-Test und
  Typprüfung/Build grün. Randfeld-Enter darf nicht übernehmen; modale Portal-
  Ereignisse sind von den Capture-Handlern der Canvaswerkzeuge ausgeschlossen.
- Signierter lokaler Build 0.1.60, Paket-Datenfreiheit und Updater-Signatur geprüft.
  Veröffentlichung ist ein separater Nutzerauftrag; derzeit kein Beelink-Update.

Native 0.1.60 am normalen Desktop-App-Ort installiert und regulär gestartet;
vorherige 0.1.59 als Rückfallkopie außerhalb des Desktop-Orts erhalten. Codesign
und vier neue Paketressourcen bytegleich geprüft. Native Versionsanzeige 0.1.60,
Prozessor konfiguriert; echter Durchlauf über installierte Desktop-API, gebündelten
Worker und private Laufzeit liefert identisches Foto-2-Ergebnis. Kein Testcommit
in eine produktive Stunde. Katalog und alle 49 Boarddateien nach Start bytegleich.
Alle 213 Paketressourcen der endgültigen lokalen Installation bytegleich zum
geprüften Build. Finale Vorschau mit allen Aktionen im Desktopviewport gesichtet;
Zeigergeste und Pfeiltasten ändern den Rahmen. Belege `output/document-image-*.json`,
`output/document-image-preview.png` und `output/document-image-release-build-final.log`.
Die private Laufzeit ist unabhängig von Codex-Cache und Repositorypfad.
Touch/Stift bleibt reale Hardwareabnahme.
