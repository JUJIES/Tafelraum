# UI Brief – Bildoptimierung vergleichen

17. Oktober 2026. Separates lokales Vergleichswerkzeug, kein App-Feature.

- **Handlung:** Die lokale Lehrkraft vergleicht tatsächlich berechnete Fassungen derselben Seite mit dem Original und wählt eine Richtung. Der erste Dreiervergleich wird auf Folgeauftrag um D · DocRes ergänzt.
- **Designfrage:** Werden Handschrift, Korrekturen, Farben und feine Linien besser lesbar, ohne wichtige Details zu verlieren?
- **Inhalt:** Auf Nutzerwunsch ein Internetfoto eines abfotografierten Dokuments: `input/for_deshadowing.jpg` aus dem offiziellen DocRes-Repository. Handschrift, viele Stiftfarben und ein deutlicher Schatten. Quellenlink und Herkunft bleiben sichtbar; Eingabe und Ergebnisse ausschließlich unter ignoriertem `output/`, keine Veröffentlichung.
- **Varianten:** A ruft die bestehende Produktionsfunktion auf. B ist ein dokumentierter OpenCV-Preset. C verwendet Leptonicas `pixCleanBackgroundToWhite`. D verwendet echte DocRes-Gewichte und gezielte Schattenentfernung ohne Entzerrung. A/B/C bleiben bytegleich zum ersten Versuch. Keine KI-Ausgabe vortäuschen.
- **Ansicht:** Original und gewählte Fassung gleich groß nebeneinander; vorhandene Umschalter um D ergänzen, Einpassen oder 100 %, synchrones Scrollen bei 100 %. Ein neuer Bericht startet mit D, der alte bleibt mit A/B/C lesbar. Quellenwechsel nur, falls ein weiterer Vergleichslauf erzeugt wird.
- **Kerntexte:** `Bildoptimierung vergleichen`, `Original`, `A · Bisherig`, `B · OpenCV`, `C · Leptonica`, `D · DocRes`, `Ganzes Blatt`, `100 %`, `Vergleichsansicht · noch nicht in Tafelraum übernommen`.
- **Invarianten:** Gleiche Pixelabmessungen und Orientierung, kein Zuschneiden, keine zusätzliche Schärfung für einzelne Vorschauen, gleiche Darstellungsskala. Laufzeit ist kein Qualitätsranking.
- **Abnahme:** Vier unterschiedliche, decodierbare Dateien im erweiterten Bericht; Original- und A/B/C-Hashes erhalten; Auswahl, 100-%-Ansicht und synchrones Scrollen im echten Browser geprüft. Initiales D ist die neue Testfassung, keine automatische Favoritenwahl oder Installation.
- **Statische Alternative:** Eine gleichmäßig skalierte Vergleichsgrafik darf Original und A/B/C/D gemeinsam zeigen; gleiche Vorschauverkleinerung, keine zusätzlichen Bildfilter. Bei gesperrter Browserprüfung diese Datei prüfen und die neue Browserabnahme ausdrücklich offenlassen.
- **Offen:** Entscheidung des Nutzers, neue Handyfotos mit Schatten, Bleistift/Farbmarker, Laufzeit und Speicher im späteren tatsächlichen App-Pfad. Desktopansicht bestätigt keine Touchprüfung.
