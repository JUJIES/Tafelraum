# Bildoptimierungen vergleichen

Separater lokaler Versuch vom 17. Oktober 2026. Keine Änderung an App, Upload,
Archiv, Paket oder Updatekanal. Eine unveränderte bereits gerasterte Seite wird
einmal in RGB decodiert, EXIF-orientiert und mit denselben Abmessungen verarbeitet.

- **A:** exakt `enhanceScanPixels` aus dem aktuellen Produktionscode über Node,
  keine Python-Nachbildung.
- **B:** OpenCV-Preset `opencv-paper-light-v1`: LAB-Helligkeit,
  Hintergrundschätzung auf höchstens 1200 Pixel Kantenlänge (morphologisches
  Closing 31, Gaussian Sigma 10), begrenzte lokale Aufhellung (Ziel 245,
  Faktor höchstens 1,65, Mischung 0,8), danach 15 % CLAHE (Clip 1,5, Raster 8×8).
  Keine Dokumenterkennung, Geometrieänderung oder Schwarzweißausgabe.
- **C:** echtes Leptonica `pixCleanBackgroundToWhite`, dokumentierte Parameter
  Gamma 1,0 / Schwarz 70 / Weiß 190. Das ist eine bewusst kräftigere Referenz;
  Papierlinien, blasse Striche und Farben auf möglichen Verlust prüfen.

Das sind konkrete Presets, kein Beweis für den allgemein besten Algorithmus oder
die optimale Einstellung jeder Bibliothek. Kein KI-Modell in diesem Dreiervergleich.
Der erste Dreiervergleich bleibt erhalten. Auf Folgeauftrag kann ein echter
DocRes-Lauf als vierte Fassung D ergänzt werden, siehe unten.

## Start

Python mit Pillow/NumPy/OpenCV, Node >=22 mit Type-Stripping sowie eine vorhandene
Leptonica-Bibliothek. Persönliche Laufzeit hier getrennt unter
`local-data/scan-enhancement-compare/venv`; OpenCV Headless 4.13.0.92 und Leptonica
1.87.0 wurden für den ersten Lauf verwendet. Keine App-Runtime-Dependency hinzufügen.

```sh
python scripts/scan-enhancement-compare/compare.py \
  --input /pfad/zum/bild.png \
  --output output/scan-enhancement-compare/mein-vergleich \
  --source-url https://example.org/original.jpg \
  --source-credit 'Bildquelle' \
  --node /pfad/zu/node \
  --leptonica /opt/homebrew/lib/libleptonica.dylib
node scripts/scan-enhancement-compare/serve.mjs output/scan-enhancement-compare/mein-vergleich
```

Der Lauf verweigert bestehende Zielordner und Ziele außerhalb von `output/`.
Persönliche Eingaben und Ausgaben bleiben ignoriert. Server nur auf Loopback,
explizite Datei-Allowlist, keine Archiv-API und kein Verzeichnislisting.

`comparison.json` hält Quellenhash, Parameter, tatsächlich verwendete Versionen,
Dateihashes und unveränderte Pixelmaße fest. Die Laufzeiten haben bewusst benannte
unterschiedliche Messumfänge und sind **kein** Geschwindigkeitsranking. Der Versuch
misst keinen Peak-Speicher und bestätigt weder OpenCV.js-/WASM- noch native
Produktintegration. Keine automatische Auswertung wählt einen Gewinner.

## DocRes als vierte Fassung

`docres.py` erweitert einen bestehenden unveränderten A/B/C-Bericht in einen
**neuen** Ordner. Original und A/B/C werden bytegleich übernommen und geprüft.
Die Bildausgabe D nutzt das tatsächliche Restormer-Modell mit streng geladenem
Checkpoint (`torch.load(..., weights_only=True)`). Kein Ersatzfilter.

Getrennte Versuchsumgebung: zusätzlich `torch==2.14.1`, `einops==0.8.2`.
Offiziellen Code lokal unter `local-data/scan-enhancement-compare/DocRes` auf
Commit `d3e3a18c7c7ad10e4615ca2eb6a10f83128d8560` halten. Der Adapter prüft
Commit und sämtliche getrackten Quellen; ungetrackte Import-Bytecodecaches sind
keine Quellenänderungen. Architektur und Schattenfunktionen werden direkt aus
dem eingefrorenen Quellstand geladen, ohne die unbenutzten MBD-/CUDA-Importe.

Der offizielle OneDrive-Link ließ sich hier nicht abrufen. Verwendeter
[Gewichte-Mirror, festgehaltener Stand](https://huggingface.co/DaVinciCode/doctra-docres-main/blob/bda6419b1ccb2a63f1f34de2adfc237986587205/docres.pkl):
183.260.711 Bytes, SHA-256
`1d6a89d754fe1e58ffd1865eab0ef3f03344798d39197b2d9a77ce4fbc8c02fd`.
Zwei veröffentlichte Mirrors nennen diesen Hash; ein unabhängiger Hash des
Autorenhosts ist nicht nachgewiesen. Gewichte bleiben ignoriert lokal, nicht in
Git oder im App-Bundle. Der MIT-Hinweis des Mirrors ersetzt keine spätere Prüfung
für eine Weiterverteilung im Produkt.

```sh
/usr/bin/time -l python scripts/scan-enhancement-compare/docres.py \
  --base output/scan-enhancement-compare/2026-10-17-document-photo \
  --output output/scan-enhancement-compare/mein-docres-vergleich \
  --repo local-data/scan-enhancement-compare/DocRes \
  --weights local-data/scan-enhancement-compare/docres.pkl \
  --device mps --max-size 1024
node scripts/scan-enhancement-compare/serve.mjs output/scan-enhancement-compare/mein-docres-vergleich
```

Optional `--task appearance` für die separate Dokumentaufbereitung statt der
standardmäßigen Schattenentfernung (`--task deshadowing`). Ein eigener Lauf pro
Task mit frischem Ausgabeordner; keine Verkettung und keine Geometrieänderung.
Beide offiziellen Taskfunktionen werden aus demselben eingefrorenen Quellstand
geladen. An zwei echten Archivfotos geprüft; Details in
[`36_SCAN_ENHANCEMENT_COMPARISON.md`](../../docs/implementation/36_SCAN_ENHANCEMENT_COMPARISON.md#zwei-reale-archivfotos-mit-handschrift-17-oktober-2026).

Der erfolgreiche Mac-Test nutzt MPS/FP16 und **1024 × 1024 interne Inferenz**
statt des Referenzlimits 1600 × 1600. Die offizielle Schattenkarten-Rekonstruktion
erhält die volle Ausgabegröße; keine Entzerrung, keine verkettete weitere Task-
oder Schärfungspassage. Das ist ein expliziter Testparameter, keine bereits
validierte App-Einstellung. CPU/FP32 ist im Adapter vorgesehen, aber ungetestet.
Der vorherige 1600-Lauf blieb ohne Abschluss/Resultat; keine Ursache behaupten.

Manifest erfasst Gewichte-/Quellhashes, Parameterzahl, Gerät, Präzision, interne
Auflösung, synchrone Einzelbildlaufzeit und Prozess-RSS. Unter macOS zeigen die
zusätzlich protokollierten `/usr/bin/time -l`-Werte den hohen Memory Footprint:
**RSS, Metal-Treiberbelegung und Footprint sind unterschiedliche Messgrößen**.
Nicht den kleinen RSS-Wert als gesamten GPU-/RAM-Bedarf ausgeben. Externe
Profilmessung wurde im Testmanifest separat mit Loghash ergänzt.

Der Viewer liest drei oder vier Methoden aus demselben Manifestvertrag.
Bestehende Dreierberichte starten mit A; der erweiterte Bericht startet mit der
neuen Testfassung D. Das ist keine automatische Favoritenwahl. Die neue
Browserbedienung konnte wegen einer Browser-URL-Richtlinienblockade nicht
erneut automatisch abgenommen werden. Die lokale Grafik `comparison-all.png`
zeigt die vier Ergebnisse und das Original unabhängig vom Browser; alle Bilder
sind visuell gesichtet und die übertragenen A/B/C-Dateien bytegleich geprüft.

## Quellen

Der erste Vergleich verwendet auf ausdrücklichen Nutzerwunsch das Internetfoto
[`input/for_deshadowing.jpg` aus DocRes](https://github.com/ZZZHANG-jx/DocRes/blob/master/input/for_deshadowing.jpg).
Abruf am 17. Oktober 2026. Die Herkunft bleibt in Manifest und Ansicht erhalten.
Die MIT-Lizenz des Codes ist keine gesonderte Klärung der Bildrechte; die
Beispielbilder werden nicht ins Repository oder App-Bundle aufgenommen.

- [OpenCV-Morphologie](https://docs.opencv.org/4.x/d4/d76/tutorial_js_morphological_ops.html)
- [OpenCV-Beleuchtungsausgleich](https://opencv.org/blog/shadow-correction-using-opencv/)
- [Leptonica-Implementierung und Parameter](https://github.com/DanBloomberg/leptonica/blob/master/src/adaptmap.c)
- [Offizieller DocRes-Code](https://github.com/ZZZHANG-jx/DocRes)
