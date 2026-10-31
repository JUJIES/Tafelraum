# Bildoptimierung – lokaler Vergleich A–D

17. Oktober 2026. **Versuch fertig, Nutzerentscheidung offen.** Kein Release und
keine Änderung am produktiven Bild-, Material- oder QR-Empfangspfad.

## Auftrag und Grenze

Die lokale Lehrkraft möchte vor einer Übernahme in die vorhandene Bildoptimierung drei echte
Ergebnisse am selben abfotografierten Dokument beurteilen. Auf ausdrücklichen
Wunsch stammt das Foto aus dem Internet, nicht aus dem persönlichen Archiv.
Das Original bleibt erhalten. Weder automatische Optimierung beim Upload noch
ein weiterer Archivspeicher oder eine neue Scannerbedienung werden eingeführt.

Werkzeug und Parameter: [`scripts/scan-enhancement-compare/`](../../scripts/scan-enhancement-compare/README.md).
Ansichtsvertrag: [UI Brief 24](../design/24_SCAN_COMPARISON_UI_BRIEF.md).

## Eingabe und Ergebnisse

- Quelle: offizielles [DocRes-Repository, `input/for_deshadowing.jpg`](https://github.com/ZZZHANG-jx/DocRes/blob/master/input/for_deshadowing.jpg), abgerufen am 17. Oktober 2026.
- Handschrift und gedruckte Farbnamen mit vielen Stiftfarben; deutlicher Schatten
  über der linken Blatthälfte. Das Ausgangsfoto schneidet am rechten Rand bereits
  Beschriftung ab; der Versuch beschneidet nichts zusätzlich.
- JPEG-SHA-256: `0fb3ed825ecd17cd08b91d78e15c8f13f2a87f3121688008c20d280684d041d4`.
- Gemeinsame EXIF-Orientierung/RGB-Decodierung, danach überall **2093 × 2634** Pixel.
- Ignorierte lokale Artefakte:
  `output/scan-enhancement-compare/2026-10-17-document-photo/` mit Original-PNG,
  A/B/C-PNGs, `comparison.json`, Vergleichsseite und Browsernachweis.
  Ursprungs-JPEG unter `output/scan-enhancement-compare/sources/`.
- Der Berichtserver bindet nur an Loopback; Startbefehl im Skript-README.
  Die jeweils ausgegebene Adresse gilt nur während des laufenden Prozesses.

| Fassung | Tatsächliche Implementierung | Beobachtung an diesem Foto |
| --- | --- | --- |
| A · Bisherig | Exakte Produktionsfunktion `enhanceScanPixels` via Node 24.19.0 | Schatten bleibt fast unverändert; kein Beleuchtungsausgleich. |
| B · OpenCV | `opencv-paper-light-v1`, Python/OpenCV 4.13.0, LAB-Beleuchtungsschätzung und vorsichtiges CLAHE | Helle Bereiche und Schrift heller; kräftiger Schatten bleibt deutlich. |
| C · Leptonica | Leptonica 1.87.0, `pixCleanBackgroundToWhite(1.0, 70, 190)` | Papier deutlich weißer, aber vertikale Streifen und Verlust in blassen Farbstrichen sichtbar. |

Alle Presetparameter, Versionen und Datei-/Quellhashes stehen in `comparison.json`.
Die Resultate wurden tatsächlich mit den angegebenen Bibliotheken berechnet.
Kein KI-Modell enthalten; der Herkunftsname DocRes bedeutet hier nicht, dass sein
Modell ausgeführt wurde. Keine allgemeine Rangliste aus einem einzelnen Foto
ableiten. Laufzeiten haben unterschiedliche Messumfänge und sind kein Benchmark.

## Prüfung

- Vollständiger echter Bildlauf erfolgreich: drei unterschiedliche,
  decodierbare RGB-PNGs, identische Maße/Orientierung, Quellenhash unverändert.
  Alpha der Baseline blieb vollständig deckend.
- Alle vier Bilder einzeln visuell gesichtet. Keine verdeckte Nachbearbeitung
  der Vorschaubilder und keine automatische Favoritenwahl.
- Echter Browser: A/B/C-Auswahl, passende Bilddatei/Titel/gedrückter Zustand,
  Einpassen, 100 % und gemeinsames Scrollen geprüft. Bei 100 % beide Bilder
  2093 × 2634; nach `PageDown` beide Paneele am gleichen Scrolloffset.
- Desktop bei 900/1280 Pixel Breite und schmale Darstellung bei 390 Pixel Breite
  geprüft. Schmal keine horizontale Seitenüberbreite; Bilder vollständig und
  proportional untereinander. Temporäre Größenüberschreibung zurückgesetzt.
- Browser meldete keine Warnungen/Fehler. Nachweis `comparison-desktop.png` im
  Artefaktordner. Reale Touchbedienung und App-Einbettung nicht geprüft.
- Statischer Server: acht erlaubte Pfade und HEAD erreichbar; unbekannte Pfade,
  POST, Cross-Site-Anfragen und fremder Host abgewiesen. Hostprüfung über
  `node:http` getestet, da Node-Fetch einen gesetzten `Host`-Header nicht übernimmt.
- Syntaxprüfung der JS-Dateien, Python-Parser und `git diff --check` erfolgreich.
  Keine App-Regressionstests erforderlich: kein Appcode in diesem Versuch geändert.

## Nächster Schritt

Die lokale Lehrkraft nennt ihre bevorzugte Fassung oder die gewünschte Kombination der
Eigenschaften. Erst danach die kleinste geeignete Integration in den bestehenden
Optimierungspfad festlegen. Vor Veröffentlichung mindestens reale Unterrichtsfotos
mit Bleistift, Markierungen, Schatten und farbigen Zeichnungen sowie Laufzeit und
Speicher im tatsächlichen App-Pfad prüfen. Die Python-Ausgabe bestätigt keine
OpenCV.js-/WASM- oder native App-Integration.

Keine neue Produktentscheidung im Decision Log: Der Vergleich ist ein begrenzter
Prüfstand, und ein Verfahren wurde noch nicht ausgewählt.

## Erweiterung: echter DocRes-Test (17. Oktober 2026)

Auf ausdrücklichen Folgeauftrag wurde D · DocRes tatsächlich lokal berechnet.
Der obige Dreierlauf bleibt unverändert; Aussagen über fehlende KI gelten für
diesen historischen ersten Lauf. Neue Artefakte:
`output/scan-enhancement-compare/2026-10-17-docres-1024/`, einschließlich
`images/d.png`, unverändertem Original/A/B/C, erweitertem `comparison.json` und
visuell gesichteter Übersicht `comparison-all.png`. Laufprotokoll:
`output/scan-enhancement-docres-1024-run.log`.

### Ausführung und Herkunft

- Neuer Adapter `scripts/scan-enhancement-compare/docres.py`; Viewer und
  Datei-Allowlist unterstützen denselben Vertrag mit A/B/C oder A/B/C/D.
- Offizieller unveränderter Quellstand
  `d3e3a18c7c7ad10e4615ca2eb6a10f83128d8560`, tatsächlich 15.203.680 Parameter.
  Code wird ausschließlich im lokalen Experiment geladen; kein Engine-/Appcode.
- Checkpoint aus dokumentiertem Hugging-Face-Mirror, 183.260.711 Bytes,
  SHA-256 `1d6a89d754fe1e58ffd1865eab0ef3f03344798d39197b2d9a77ce4fbc8c02fd`.
  Nicht direkt vom Autorenhost verifiziert. Sicherer Tensor-Loader und strikter
  Zustandsabgleich erfolgreich. Genauere Herkunft/Startbefehle im Skript-README.
- macOS auf Mac16,12 mit 16 GiB gemeinsamem Speicher. Python 3.12.14,
  PyTorch 2.14.1, einops 0.8.2, OpenCV 4.13.0; separate ignorierte Testumgebung.
- MPS/FP16, gezielte `deshadowing`-Funktion des offiziellen Codes, interne
  Inferenz **1024 × 1024**. Genau diese Referenzkonstante wurde für den Test
  abgesenkt; die ursprüngliche Grenze ist 1600. Offizielle vollauflösende
  Schattenkarten-Rekonstruktion, Ausgabe weiterhin **2093 × 2634**.
  Keine Entzerrung, zusätzliche Appearance-Passage oder Nachschärfung.
- Ein vorheriger 1600-Lauf war nach der Arbeitsunterbrechung nicht mehr aktiv
  und hatte kein fertiges Ergebnis/Abschlussprotokoll. Keine belegte Ursache und
  kein bestandenes 1600-Benchmark. Ein weiterer Start wurde zunächst durch einen
  automatisch erzeugten ungetrackten Python-Cache abgewiesen; die Quellenprüfung
  berücksichtigt nun getrackte Quellen statt erzeugter Importcaches.

### Gemessener erfolgreicher Einzelbildlauf

| Messwert | Wert | Reichweite |
| --- | --- | --- |
| Modell laden/übertragen | 0,15 s | Gewichte waren bereits lokal verfügbar |
| Schattenverarbeitung | **7,79 s** | Decodierung, Prompt, Transfer, Inferenz, Rekonstruktion; MPS synchronisiert, ohne PNG-Speicherung |
| Gesamter Python-Prozess | **10,98 s** | Einmaliger Kaltlauf einschließlich Imports und PNG-Speicherung |
| Maximaler Prozess-RSS | 0,88 GB | Kein Maß für den gesamten Metal-/RAM-Bedarf |
| Metal-Treiberbelegung nach Inferenz | 9,33 GB | Einschließlich reservierter/allokierter Treiberpuffer; kein gemessener Peak |
| Peak Memory Footprint | **10,53 GB** | Externer macOS-Wert von `/usr/bin/time -l` für den ganzen Prozess |

Dezimale GB. Messgrößen nicht addieren. Ein einzelner Test bestätigt weder
warmen Dauerbetrieb noch Verhalten parallel zum Unterricht oder auf Beelink.
Der kleine Parameterbestand bedeutet hier ausdrücklich keinen kleinen
Laufzeitspeicherbedarf. Für eine Appintegration muss der hohe Footprint reduziert
beziehungsweise mit einem begrenzten Ausführungspfad geprüft werden.

### Ergebnis und Prüfung

Optisch auf diesem Beispiel klar überzeugender als A/B/C: großer Schatten
weitgehend entfernt, Stiftfarben sichtbar erhalten, keine vertikalen Streifen
wie in C. Papier bleibt natürlich grau statt vollständig weiß. Das ist eine
visuelle Einzelbeobachtung ohne schattenfreie Ground Truth; kein Beweis für
pixelgetreue Erhaltung jeder blassen Schrift oder beliebige Schülerarbeiten.

- NN-Ausgabe bereits vor Bildkonvertierung auf endliche Werte geprüft.
- Vollständige D-Ausgabe decodiert und visuell gesichtet; identische RGB-Maße.
  Original und A/B/C im neuen Bericht sind **bytegleich** zum alten Bericht.
- Alle vier Ergebnisdateien gegen Manifesthashes geprüft und die vollständige
  Vergleichsgrafik visuell gesichtet. Keine weiteren Filter in der Vorschau.
- Statische Dateien und vier Bildpfade gegen Manifest/Dateihashes geprüft;
  Syntax-/Parserprüfung und `git diff --check` erfolgreich. Der neue Server wurde
  gestartet, seine neue HTTP-/Browseroberfläche nach der Richtlinienblockade
  nicht über einen Ersatzweg inspiziert. Frühere HTTP-Prüfungen oben gelten
  ausschließlich dem ersten Dreierlauf.
- **Neue Browserbedienung nicht automatisch abgenommen:** Nach der
  Arbeitsunterbrechung hatten die bisherigen Tabs Fehlerseiten; Browserzugriffe
  wurden durch die URL-/Browser-Sicherheitsrichtlinie blockiert. Kein Umgehen der
  Sperre. Die lokalen PNGs und die Vergleichsgrafik sind unabhängig davon geprüft.
  Frühere Browserbeobachtungen oben beziehen sich allein auf A/B/C.
- UI Brief 24, Skript-README und Haupt-README aktualisiert. Kein Update,
  Produktivarchivzugriff oder neuer Produktentscheid im Decision Log.

## Zwei reale Archivfotos mit Handschrift (17. Oktober 2026)

Auf Nutzerauftrag zwei zuvor visuell bestätigte Fotos aus dem aktiven lokalen
Unterrichtsarchiv geprüft: längerer grauer handschriftlicher Text mit Korrekturen
auf liniertem Papier (1224 × 677) und kurze blaue Handschrift auf Papier vor
Holztisch (1663 × 1247). Beide Originale blieben bytegleich im Archiv.
Private Quellpfade und Quellhashes stehen ausschließlich in der ignorierten
`output/scan-enhancement-compare/2026-10-17-archive-handwriting/provenance.json`.
Keine Archivimporte, kein Upload und keine Veränderung einer Stunde.

### Verfahren und Wiederholung

Bestehenden Vergleichsrunner wiederverwendet: je Foto eine neue A/B/C-Basis,
dann DocRes auf deren gemeinsamer Original-PNG-Decodierung. Zunächst dieselbe
Schattenentfernung wie beim Internetfoto. Da deren Nutzen bei diesen weniger
verschatteten Seiten klein war, zusätzlich **`appearance`** aus dem offiziellen
Code als eigene Alternative getestet, nicht mit `deshadowing` verkettet.
Der Adapter erhält dafür nur `--task deshadowing|appearance`; Standard bleibt
`deshadowing`. Beide Aufgaben nutzen denselben eingefrorenen Quellstand,
Checkpoint, MPS/FP16 und internes Limit 1024. Keine Bildgeometrieänderung.

Ergebnisse und Logs im genannten Ordner:

- `photo-1-baseline/`, `photo-2-baseline/`: bestehende Referenzverfahren.
- `photo-1-docres/`, `photo-2-docres/`: reine Schattenentfernung.
- `photo-1-appearance/`, `photo-2-appearance/`: separate Dokumentaufbereitung.
- Je Ergebnis `comparison.json` mit Quell-/Ergebnishashes, konkretem Task,
  Versionen und externer Profilierung; Einzelprotokolle daneben.
- `results.json`: vier Messungen. `both-before-after.png` zeigt Schattenkorrektur,
  `both-appearance-before-after.png` die Dokumentaufbereitung, jeweils Original
  links und Ergebnis rechts. Entsprechende Einzelpaare mit `photo-1-`/`photo-2-`.

| Foto / Modus | Verarbeitung | Ganzer Prozess | Peak Memory Footprint |
| --- | --- | --- | --- |
| 1 / Schattenentfernung | 4,92 s | 7,42 s | 10,67 GB |
| 2 / Schattenentfernung | 4,14 s | 6,06 s | 10,77 GB |
| 1 / Dokumentaufbereitung | **3,85 s** | 5,69 s | **10,20 GB** |
| 2 / Dokumentaufbereitung | **4,01 s** | 5,66 s | **10,30 GB** |

Je ein eigener kalter Prozess, streng nacheinander; keine gleichzeitigen
Modellläufe. Dieselben Messumfänge und Grenzen wie beim Internettest, dezimale GB.
Unterschiede sind keine belastbare Geschwindigkeitsrangliste der Aufgaben.

### Visuelles Urteil und Grenzen

- Reine Schattenkorrektur: Foto 1 nahezu unverändert; Foto 2 etwas gleichmäßigeres
  Papier, aber deutlich sichtbare gelbliche/posterisierte Flächen auf dem Holz.
- **Dokumentaufbereitung ist für diese beiden Beispiele die geeignetere Fassung:**
  Papier deutlich weißer, Schrift kontrastreicher. Im ersten Foto bleiben die
  sichtbaren Durchstreichungen, Linien und der blasse Titel erkennbar; im zweiten
  Foto bleibt die blaue Handschrift sichtbar. Kein behaupteter OCR-/Zeichenbeweis.
- Das umgebende Holz wird stark aufgehellt/umgefärbt und zeigt einzelne Artefakte.
  Der Modus optimiert die Dokumenterscheinung, nicht die Fotofarben des ganzen
  Motivs. Kein automatischer Zuschnitt oder verdecktes Entfernen dieses Befunds.
- Bereits unscharfe Schrift wird nicht zuverlässig scharf; blasse Papier-/Rückseiten-
  spuren werden unterdrückt. Keine pauschale Freigabe für Bleistift und Zeichnungen.
- Alle vier DocRes-Ausgaben und beide Vorher-nachher-Grafiken visuell gesichtet.
  NN-Ausgaben vor Konvertierung endlich, Ausgaben vollständig decodierbar und
  maßgleich. Originalhashes nach allen Läufen erneut geprüft. Ergebnis-/Profil-
  hashes sowie unveränderte Referenzdateien geprüft. Syntax und Diff geprüft.
- Kein neuer Browser-Test nötig: reine lokale Bildversuche und statische
  Vergleichsgrafiken; keine neue App-/Vergleichs-UI umgesetzt. Aufnahmen blieben
  lokal; keine Paket-, Archiv-, Release- oder Runtime-Dependency-Änderung der App.

Die Beobachtung präzisiert die vorläufige Empfehlung: Für scanähnliche Darstellung
dieser Handschriften `appearance` weiterprüfen; für harte Schatten bleibt der
getrennte `deshadowing`-Versuch relevant. Hoher Speicherbedarf weiterhin offen.
Kein verbindlicher Produktentscheid oder automatisches Umschalten der App.

## Dewarping an denselben Archivfotos (17. Oktober 2026)

Nach Nutzerhinweis auf die GitHub-Abbildung den **offiziellen `dewarping`-Pfad**
separat geprüft. Die früheren `appearance`- und `deshadowing`-Läufe verwenden
diesen Modus ausdrücklich nicht. Dewarping nutzt zusätzlich die offizielle
MBD-Blattsegmentierung und ein vom Modell vorhergesagtes Koordinatenfeld.
MBD-Eingabe 448 × 448, DocRes-Eingabe 256 × 256, MPS/FP32 entsprechend dem
offiziellen Dewarping-Code; keine nachträgliche Aufbereitung verkettet.

MBD-Checkpoint: 712.981.585 Bytes, SHA-256
`7c2dc15a6b0e613adf7c3a794891f44caef544b92c5898ac610ae689e9cd9085`,
aus dem festgehaltenen
[Mirrorstand](https://huggingface.co/DaVinciCode/doctra-docres-mbd/tree/915b8af52e726378d1a490d4e62dec73993b839b).
Dieselbe Einschränkung der Checkpoint-Herkunft wie beim DocRes-Mirror.
Adapter `scripts/scan-enhancement-compare/mbd.py` lädt nur die benötigte offizielle
DeepLab-Architektur, keine unbeteiligten Trainingsmodelle. Sichere Torch-Ladung
(`weights_only=True`), strikte Schlüsselprüfung und endliche NN-Ausgabe.

Ergebnisse `photo-1-dewarping/` und `photo-2-dewarping/` neben den bisherigen
Versuchen, jeweils Original/A/B/C unverändert, D als Dewarping, dazu Blattmaske
`images/mask.png`, Manifest und externes Prozessprotokoll. Statischer Vergleich
`both-dewarping-before-after.png` zeigt Original links, Dewarping rechts.

| Foto | Verarbeitung einschließlich MBD | Ganzer Prozess | Peak Memory Footprint |
| --- | --- | --- | --- |
| 1 | 4,37 s | 6,02 s | 3,22 GB |
| 2 | 1,81 s | 2,99 s | 3,47 GB |

Einmalige kalte Prozesse nacheinander, keine belastbare Geschwindigkeitsrangliste.
Beide vollständigen Ausgaben visuell geprüft: Foto 1 verliert links und oben
sichtbare Schrift und verformt die Linien, an Ecken entstehen schwarze Bereiche.
Foto 2 entfernt den Tisch, verliert aber rechts Teile der ersten Textzeile.
Gleiche Ausgabemaße bedeuten hier keine vollständige Inhaltserhaltung.

**Befund:** DocRes besitzt die beworbene Fähigkeit; diese zwei randangeschnittenen
Aufnahmen bestehen jedoch die Nutzeranforderung „nichts abschneiden“ nicht.
Kein automatisches Anwenden des ungeprüften neuronalen Dewarping-Ergebnisses.
Für eine Umsetzung korrigierbaren Blatt-/Ausschnittvorschlag mit Sicherheitsrand
und unabhängiger `appearance`-Aufbereitung prüfen; UI-Entwurf in
`docs/design/25_DOCUMENT_IMAGE_UI_BRIEF.md`. Der Test selbst verändert weder
Archiv noch Release. Der nachfolgend ausdrücklich beauftragte Einbau von
`appearance` mit korrigierbarem rechteckigem Crop ist separat in
`37_DOCUMENT_IMAGE_PILOT.md` dokumentiert (D-267, 0.1.60 lokal installiert).
