# UI Brief – zusammengehörige Teaching Surfaces

**Stand:** 30. August 2026  
**Status:** verbindliche Grundlage für Konzeptmockups; keine Erweiterung des Implementierungsumfangs von Prototyp 0.1

## Kontext

Die überarbeitete Mockupserie zeigt drei zusammengehörige Oberflächen derselben Lesson und derselben visuellen Sprache:

1. **Vorbereitung am Mac:** Lehrkraft arbeitet allein im vollständigen Editor; keine Tafelansicht ist geöffnet.
2. **Durchführung am Mac:** private Lehreransicht mit öffentlichem Tafelausschnitt, LIVE-Zustand und bewusster Tafelsteuerung.
3. **Lokale Tafel mit öffentlicher Steuerung und Interaktion:** öffentlicher Client auf dem erweiterten Bildschirm; freigegebener Unterrichtsinhalt, öffentlicher Zeiger, Klickimpuls und reduzierte Werkzeugleiste dürfen gleichzeitig sichtbar sein.

Die lokale Tafel ist die öffentliche Raumansicht für die Klasse. Sie ist weder eine Spiegelung des Mac noch eine persönliche Schüleransicht.

## Gemeinsame Designfrage

Ist ohne erklärenden Text sofort erkennbar, welche Oberfläche privat vorbereitet, welche öffentlich zeigt und welche direkt am Board bedient werden kann?

## Gemeinsame Invarianten

- identische Lesson `Means of transport`;
- identische Leitfrage `Which means of transport is best for a holiday?`;
- identisches reales Bildasset `test-materials/means-of-transport/assets/transport_set.png`;
- ruhige gemeinsame visuelle Sprache aus warmer Präzision und flachem Editorial-Studio;
- in der hellen Baseline neutrale Flächen, Graphit, sparsames Blau und funktionales Markergelb;
- keine Glasoptik, Verläufe, Kartenlandschaft oder dekorative App-Flächen;
- direkte App-Screenshots im Seitenverhältnis 16:9 ohne Geräte- oder Browserrahmen.

## Explorationsrunde – freundliches Dunkeldesign

Die Dunkelrunde verändert ausschließlich die Grundhelligkeit und Materialwirkung. Aufbau, Größen, Werkzeuge, Texte, aktive Zustände, Tafelausschnitt, Zeiger, Klickimpuls und Toolbarposition bleiben gegenüber Runde 2 unverändert.

Visuelle Leitplanken:

- warmes Graphit und entsättigtes dunkles Blau-Grau statt reinem Schwarz;
- leicht abgestufte dunkle Flächen ohne Glas, Glow oder starke Verläufe;
- gebrochenes Weiß statt grellem Reinweiß für Text und Icons;
- ruhiges, weiches Blau für aktive Zustände und Zeiger;
- Gelb weiterhin nur funktional für den Marker;
- Unterrichtsinhalt bleibt farblich wichtiger als App-Chrome;
- keine künstliche Gaming-, Kino- oder Neonästhetik.

Helle Originalmaterialien bleiben eine eigene Produktfrage: Bilder, PDFs und Arbeitsblätter dürfen nicht ungefragt invertiert oder umgefärbt werden. Die Mockups dürfen eine dunkle, hintergrundkompatible Rendition als visuelle Hypothese zeigen; Originalbytes und fachliche Farben bleiben in einer späteren Umsetzung unverändert. Zu prüfen ist, ob helle Materialien auf einer dunklen Fläche als bewusst begrenzte Papierobjekte oder über separat erzeugte Renditions dargestellt werden.

## Mockup A – Vorbereitung am Mac

### Primäre Handlung

Unterrichtsinhalt auswählen, anordnen und ergänzen.

### Muss sichtbar sein

- vollständige ruhige Lehrer-Shell mit Titel und Speicherstatus;
- freie Canvasfläche;
- Hand, Auswahl, Stift, Marker, Radierer, Text und Form;
- Undo/Redo, Bild hinzufügen und Inhalt finden;
- ausgewähltes Transportbild mit zurückhaltendem Auswahlrahmen und Handles;
- keine öffentliche Kamera, kein LIVE und keine Tafelwerkzeugleiste.

### Sichtbarer UI-Text

`Means of transport`, `Lokal gespeichert`, `Hand`, `Auswahl`, `Stift`, `Marker`, `Radierer`, `Text`, `Form`, `Bild hinzufügen`, `Inhalt finden`

## Mockup B – Durchführung am Mac

### Primäre Handlung

Die öffentliche Tafel bewusst steuern und gleichzeitig privat arbeitsfähig bleiben.

### Muss sichtbar sein

- private Lehrer-Shell mit Titel;
- klarer, aber nicht dominanter Zustand `LIVE`;
- öffentlicher Tafelausschnitt als blau umrandetes privates Overlay innerhalb des größeren Boards;
- Aktion `Tafel halten`;
- aktives Werkzeug `Tafel steuern`;
- reduzierter Zugriff auf Auswahl, Stift, Marker, Radierer und Undo;
- private Inhalte oder weiterer Boardraum außerhalb des Tafelausschnitts dürfen sichtbar sein, aber keine sensiblen Daten enthalten;
- keine Tafelwerkzeugleiste innerhalb der Lehrer-Shell.

### Sichtbarer UI-Text

`Means of transport`, `LIVE`, `Tafel halten`, `Tafel steuern`, `Auswahl`, `Stift`, `Marker`, `Radierer`, `Tafelausschnitt`

## Mockup C – Lokale Tafel mit Zeiger, Impuls und Interaktion

### Primäre Handlung

Eine Person arbeitet direkt am Legamaster, während die Klasse gleichzeitig die bewusste Lehrersteuerung vom Mac räumlich nachvollziehen kann.

### Muss sichtbar sein

- ausschließlich der bereinigte Tafelausschnitt im Vollbild;
- Leitfrage und Transportbild;
- ein klarer öffentlicher Zeiger auf einem relevanten Inhalt;
- wenige dezente kreisförmige Wellen um die aktuelle Klickposition als Momentaufnahme des flüchtigen Aufmerksamkeitsimpulses;
- reduzierte große Tafelwerkzeugleiste mit Stift, Marker, Radierer und Undo;
- Stift als klar aktiver Zustand;
- gut greifbare Drag-Zone ohne erklärenden Text;
- Leiste für diesen Entwurf vertikal rechts angedockt, um den Wechsel zwischen horizontaler und vertikaler Randposition sichtbar zu machen;
- keine Lehreraktionen, kein Materialimport, keine Auswahl komplexer Lesson-Objekte und keine private Navigation.

### Sichtbarer UI-Text

`Stift`, `Marker`, `Radierer`

Undo verwendet ein vertrautes Icon ohne sichtbares Label.

Interaktionsregel für die spätere Umsetzung: Während des Ziehens folgt die Leiste direkt. Beim Loslassen rastet sie oben, unten, links oder rechts ein und ordnet Werkzeuge passend zur Kante horizontal oder vertikal an. Zeiger, Klickimpuls und Werkzeugleiste bleiben voneinander unabhängige Zustände.

## Darf in keinem Mockup erscheinen

- Timer, Spotlight, Vorhang oder Fokus-Dimming;
- Stundenpfad, Archiv, Dashboard oder Fachnavigation;
- PDF, Video, KI, Login oder Einstellungen;
- persönliche Schülerkonten oder Remote-Live;
- erklärende Absätze, Tutorials oder Funktionshinweise;
- gespiegelte Mac-Menüs, Browserchrome oder Betriebssystemelemente;
- sichtbare Development-Schalter.

## Abnahme und offene Hardwarefragen

Die Serie ist für die Diskussion geeignet, wenn Vorbereitung, private Durchführung und öffentliche Tafel ohne Begleittext unterscheidbar sind und die Tafelwerkzeuge keine Wirkung auf die Lehrer-Shell behaupten.

Erst am Legamaster zu entscheiden:

- Größe und Kontrast des öffentlichen Zeigers;
- Dauer, Größe und Deckkraft des Aufmerksamkeitsimpulses;
- Touchzielgrößen und Abstände;
- Griff zum Einblenden der Werkzeugleiste;
- Einrastschwellen, Abstände, Bewegungsgefühl und automatische Ausblendung;
- sinnvoller Umfang und Grenze von Tafel-Undo.

## Generierte Diskussionsartefakte

Die aktuelle Serie liegt unter [mockups/teaching-surfaces-2026-08-30-v2](mockups/teaching-surfaces-2026-08-30-v2/README.md). Sie kombiniert öffentlichen Zeiger, Klickimpuls und vertikal angedockte Tafelwerkzeugleiste. Die [erste Serie](mockups/teaching-surfaces-2026-08-30/README.md) bleibt als Iterationshistorie erhalten. Beide sind Diskussionsartefakte, keine Pixel-Spezifikation oder Touchvalidierung.

Die zusätzliche [Dunkelrunde „Calm Dusk“](mockups/teaching-surfaces-2026-08-30-dark/README.md) vergleicht dieselben drei Oberflächen ohne funktionale oder strukturelle Änderungen. Sie ist eine explorative Theme-Variante, keine vorweggenommene Designentscheidung.


Fortschreibung 29.10.2026: Die verlinkten Serien enthalten weiterhin ihre
Textentscheidungen. PNG-Mockups mit ungeklärtem Unterrichtsmotiv wurden nach
lokaler Sicherung aus dem aktuellen Quellstand entfernt; keine Änderung am
UI-Vertrag. [Bereinigungssweep](../implementation/49_PUBLIC_SOURCE_PREPARATION.md).
