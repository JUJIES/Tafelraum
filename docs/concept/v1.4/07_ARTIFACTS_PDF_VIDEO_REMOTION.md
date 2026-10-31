# 7. Assets: frühe Bilder/PDFs und spätere Videos

## 7.1 Scope

Bild- und PDF-Import gehören verbindlich in den ersten technischen Build. Video, YouTube, Remotion, OCR und Transkription folgen später.

Trotzdem muss das Domänenmodell später generische Assets aufnehmen können, ohne von einem Erzeugungssystem abhängig zu sein.

## 7.2 Minimales Asset

Verpflichtend:

- stabile ID;
- Medientyp;
- Originaldatei oder Originalquelle.

Optional:

- Titel und didaktische Rolle;
- Herkunft;
- Thumbnails/Renditions;
- extrahierter Text;
- OCR, Beschreibung oder Transkript;
- Generierungs- oder Rendererinformationen;
- Sensitivität und Publication-Policy.
- Verfügbarkeit, Herkunftsseite und Migrationsstatus;
- Rechte-/Weitergabestatus und Materialbeziehungen.

Abgeleitete Daten fehlen dürfen, ohne das Asset unbenutzbar zu machen.

Für Migration und Spiegelung werden lokale Datei und externe Quelle getrennt geführt. Ein Asset kann daher `local`, `external-link`, `onenote-only`, `source-export-only`, `missing` oder `unknown` sein. Ein Quellenexport kann den sichtbaren Zustand sichern, ohne dass das eingebettete Originalasset bereits einzeln vorliegt.

## 7.3 PDF

Früher Zielablauf:

1. Original-PDF importieren.
2. Sofort eine brauchbare Vorschau oder Seitenwahl anzeigen.
3. Seiten als Referenzen auf dem Board platzieren.
4. Text, Stift, Marker und Formen als getrenntes Overlay speichern.
5. Thumbnails beziehungsweise Renderings fehlertolerant erzeugen; Textschicht und OCR bleiben optionale spätere Ableitungen.

Leitplanken:

- Original-PDF bleibt unverändert und kanonisch.
- OCR ersetzt niemals Original oder vorhandene Textschicht.
- Annotationen referenzieren Asset, Seite und Board-/Seitenkoordinaten.
- PDF darf später direkt Bestandteil eines Lesson Packs sein.
- fehlende OCR blockiert Unterricht und Export nicht.

Für den ersten Build zu testen:

- alle Seiten, Auswahl oder Seitenstapel als Standard;
- PDF.js und genaue Renderingstrategie;
- Schärfe auf 4K-/75-Zoll-Displays;
- durchblätterbares Element versus einzelne Seiten;
- Rückexport mit Annotationen.

## 7.4 SheetifyIMG

Ein SheetifyIMG-Ergebnis ist zunächst ein normales Bild- oder PDF-Asset.

Optionaler Erweiterungsblock:

- Arbeitsblattkonzept;
- ImageSpec;
- Soll-Text;
- QC/OCR;
- Generierungsmetadaten.

Diese Daten dürfen spätere KI-Analyse verbessern, sind aber weder Pflicht noch Teil des generischen Workspace-Schemas.

## 7.5 Bilder

Mögliche Daten:

- Original;
- Board-Rendition;
- Thumbnail;
- optionale Beschreibung/OCR;
- optionale Provenienz.

Bildgenerierung ist ein späterer, ortsbezogener Hintergrundjob. Eine frühe Material- oder Doodle-Bausteinbibliothek wird nicht als Produktstrategie festgelegt.

## 7.6 Video

Ein Video funktioniert zunächst generisch über:

- lokale Datei oder Link;
- Thumbnail;
- optional Titel/Dauer;
- optional Transkript, Untertitel, Skript und Szeneninformationen.

Später muss der Wechsel `Board → Video → exakt zurück zum Board` zuverlässig sein. Wiedergabe- und LIVE/GEHALTEN-Verhalten werden durch einen eigenen Spike entschieden.

## 7.7 Remotion

Die Remotion-Pipeline ist noch in Entwicklung. Deshalb existiert kein verpflichtendes Workspace-Format wie festes `video-spec.json` oder bestimmtes Rendererlayout.

Später mögliche optionale Daten:

- Skript;
- Untertitel;
- Szenenstruktur;
- Remotion-Spezifikation;
- Renderer-Version;
- Quellcode;
- verwendete Assets.

Ein normales MP4- oder Linkvideo muss ohne diese Informationen funktionieren.

## 7.8 Hintergrundjobs

Spätere Verarbeitung kann umfassen:

- Thumbnail/Rendition;
- Textschicht/OCR;
- Bildbeschreibung;
- Transkript;
- technische Prüfung;
- Suchindex.

Grundregel:

> Das Asset erscheint möglichst sofort; Ableitungen laufen fehlertolerant im Hintergrund und blockieren die manuelle Boardarbeit nie.

Mehrere Jobs können parallel laufen. Fehler sind am betreffenden Asset sichtbar, nicht als globaler Workflow-Blocker.

## 7.9 Asset-Identität

**Starke Empfehlung:**

- Originaldateien unveränderlich speichern;
- Inhalts-Hash für Deduplizierung;
- Referenzen statt Base64-Duplikate im Canvas;
- mehrere Renditions;
- neue Version bei echtem Austausch;
- Nutzung desselben Assets in mehreren Stunden erlauben.

Der Beelink ist der konkrete Primärspeicher für Originalassets und Renditions. Browsercache und lokale Renditions dienen der Ausfallsicherheit und Performance. Optionale externe Backups oder Exporte ändern die Asset-Identität nicht.

Die Asset-ID und das portable Manifest bleiben unabhängig von Hostname, Mountpoint oder konkreter Beelink-Installation. Dadurch kann der Bestand später ohne Modellbruch auf einen anderen Speicher verschoben oder wiederhergestellt werden.
