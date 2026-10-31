# 5. Board, Touch und Stundenpfad

## 5.1 Reversible Canvasentscheidung

Die Canvas-Engine ist austauschbare Infrastruktur. Sie besitzt weder Activities noch LessonFlow, Materialrollen oder Public-Projection-Regeln. Diese Grenze ist wichtiger als die konkrete Bibliothekswahl.

Excalidraw bleibt der lizenzoffene Baseline-Kandidat. Es passt durch:

- Doodle-Look;
- Text, Formen, Pfeile und Freihand;
- offene, editierbare Elemente;
- React-Komponente und programmatische Elementerzeugung;
- optionale `customData` an Elementen;
- MIT-Lizenz und offenes JSON-Format;
- passende Verbindung zur visuellen Sprache der Erklärvideos.

Seit Version 1.4 wird tldraw als ernsthafter Gegenkandidat geprüft. Es ist besonders stark bei eigenen Shape-Typen, Tools, Bindings, persistierbaren Records, Migrationen und strukturierter Agenteninteraktion. Das könnte später relevant werden, wenn Activity-Karten, Medienobjekte oder andere Unterrichtsobjekte direkt auf dem Board ein eigenes Verhalten benötigen.

Der Nachteil ist eine wesentlich stärkere Produkt- und Lizenzabhängigkeit: Produktive tldraw-Nutzung benötigt nach dem aktuellen Lizenzmodell einen gültigen Trial-, Commercial- oder Hobby-Key. Die Hobby-Lizenz ist nur auf Antrag und diskretionär verfügbar und zeigt ein Wasserzeichen. Diese Abhängigkeit gehört in die Architekturentscheidung, nicht nur in eine spätere Einkaufsfrage.

**Starke Empfehlung:** Excalidraw zunächst als Baseline einbetten und denselben kleinen Vertikalschnitt zeitlich begrenzt mit tldraw prüfen. Erst danach wird eine Engine für den Grundlagenbuild festgelegt. Ein Excalidraw-Fork oder eine eigene Canvas-Engine sind keine frühen Optionen.

Verglichen werden mindestens:

- Stift, Freihand, Text, Form, Auswahl und Finger-Pan auf echter Hardware;
- Bild und scharf gerenderte PDF-Seite;
- getrennte Annotationen;
- stabile Referenz von Boardelement zu Activity und Asset;
- Speicherung, Reload und Schemaentwicklung;
- private Lehreransicht und bereinigte Public Projection;
- unabhängige Teacher-/On-Air-Viewports;
- Integrationsaufwand, Performance, Portabilität und Lizenzfolgen.

Die Entscheidung lautet nicht „welche Demo gefällt besser?“, sondern „welche Engine trägt den realen Unterrichtsworkflow mit weniger langfristiger Sonderlogik?“

Ein Fork könnte später notwendig werden, wenn Touchverhalten, öffentliche Kamera, private/public-Payloads, eigene Overlays oder Performance nicht ausreichend über die öffentliche Integration kontrollierbar sind.

## 5.2 Freies Board statt Phasenframes

Standard:

- potenziell unendliche Arbeitsfläche;
- freie Zoom- und Pan-Navigation;
- räumlich lose Inhaltsinseln;
- kein verpflichtendes Seiten-, Folien-, Frame- oder Phasenmodell;
- pragmatische Anordnung ist legitim.

Technische Engine-Frames oder Gruppen dürfen intern oder für bestimmte Visualisierungen verwendet werden, sind aber nicht automatisch Schritte oder didaktische Abschnitte.

Boardelemente und gespeicherte Viewpoints dürfen optional auf Activities aus der semantischen Lesson-Schicht verweisen. Freie, nicht zugeordnete Elemente bleiben vollständig zulässig. Engine-interne Records oder `customData` sind dafür nur Referenzträger; die Activity selbst bleibt Teil des Lesson-Dokuments.

## 5.3 Stundenpfad-Panel

Das ein- und ausblendbare Panel zeigt:

- Abschnitte und Schritte;
- frei editierbare Namen;
- Reihenfolge;
- aktuellen Schritt;
- kleine Vorschau, sofern technisch sinnvoll.

Interaktionen:

- Klick auf Schritt → zur gespeicherten Ansicht navigieren und öffentlichen Kamerabefehl auslösen;
- Drag-and-drop → nur logische Reihenfolge ändern;
- freie Navigation → Pfad bleibt unverändert;
- „zurück zum Schritt“ → gespeicherten Viewpoint wiederherstellen;
- Klick auf Abschnitt → Verhalten noch offen.

Das Panel darf eingeklappt werden, damit die Arbeitsfläche ruhig bleibt.

## 5.4 Schritt schnell speichern

Zielablauf:

1. Lehrkraft navigiert zu einer Inhaltsinsel.
2. Sie positioniert den farbigen Schülerausschnitt.
3. Eine kurze Aktion wie `Als Schritt speichern` legt den Viewpoint an.
4. Der Name wird inline vergeben oder später geändert.
5. Optional entsteht ein Thumbnail.

Die endgültige Buttonbenennung ist offen. Bestätigt ist, dass die häufige Aktion nahezu ein Klick sein soll.

Ein gespeicherter Viewpoint bleibt stabil, bis die Lehrkraft ausdrücklich `Ansicht aktualisieren` ausführt.

## 5.5 Öffentlicher Ausschnitt als privates Overlay

Die Lehreransicht zeigt auf Wunsch einen farbigen Rahmen:

- markiert `onAirViewport`;
- hilft beim Herauszoomen, ohne Blick zum Smartboard;
- ist kein Boardelement;
- erscheint weder öffentlich noch im Export;
- kann verschoben werden.

Während des Ziehens bleibt die Tafel unverändert. Erst Loslassen beziehungsweise eine bewusste Bestätigung setzt das Kameraziel. Im Zustand GEHALTEN kann das Ziel nur vorbereitet werden.

## 5.6 Touch- und Stiftverhalten

Gewünschtes Grundmuster:

- Stift schreibt/zeichnet;
- Finger verschiebt und navigiert;
- Auswahlwerkzeug bewegt Elemente;
- Marker hebt hervor;
- Radierer löscht;
- Handballenerkennung erzeugt keine zufälligen Aktionen.

Früh auf echter Hardware prüfen:

- Pointer-Events der vorhandenen Touchscreens;
- aktiver Stift versus generischer Touch;
- Mac-Browser, Board-Browser und iPad;
- Palm Rejection;
- Latenz;
- sinnvolle Ziel- und Werkzeuggrößen auf 75-Zoll-/4K-Flächen;
- Vollbild und Browsergesten.

## 5.7 Touchgerechte Oberfläche

Im Unterricht:

- fast unsichtbare App-Shell;
- große Buttons;
- Stift, Marker, Radierer, Auswahl und Undo schnell erreichbar;
- Stundenpfad vor/zurück;
- LIVE/GEHALTEN klar erkennbar;
- öffentlicher Ausschnitt schnell setzbar;
- Zeigewerkzeug bewusst aktivierbar.

Die Vorbereitungsansicht darf mehr Funktionen zeigen, soll aber ebenfalls reibungsarm bleiben.

## 5.8 Zeigewerkzeug

Der Laserpointer ist getrennt von Maus und Markierstift:

- normale Maus ist immer privat;
- Zeigewerkzeug per Button, Shortcut oder gehaltenem Taster aktivieren;
- nur innerhalb des aktuell öffentlichen Viewpoints sichtbar;
- außerhalb dieses Ausschnitts kein öffentlicher Cursor;
- flüchtiger Presentation-State;
- nach Deaktivierung nicht gespeichert.

Farbe, Größe und Shortcut sind offen. Fokus-Dimming, Spotlight-Systeme und umfangreiche Reveal-Regie sind nicht bestätigt.

## 5.9 Materialien

Bild- und PDF-Import gehören in den ersten technischen Build, weil reale Stunden wesentlich von vorhandenen Materialien ausgehen. Video wird modular später ergänzt. Details stehen in `07_ARTIFACTS_PDF_VIDEO_REMOTION.md`.

Der frühe Mindestumfang umfasst:

- Bilder per Drag-and-drop beziehungsweise Dateiauswahl importieren;
- Bilder platzieren, skalieren und wieder öffnen;
- PDFs unverändert als Originalasset speichern;
- mindestens einzelne PDF-Seiten auswählen und scharf auf dem Board platzieren;
- Stift, Marker, Text und Formen als getrennte Annotationsebene verwenden.

Von Anfang an gilt:

- Board sofort weiter benutzbar;
- Hintergrundverarbeitung blockiert nicht;
- Originalassets außerhalb der Canvas-Szene;
- passende Thumbnails/Renditions statt unnötig großer Payloads.

Eine Vorlagen- oder Bausteinbibliothek wird nicht früh geplant. Sie darf erst aus realer Nutzung heraus entstehen.

Später ergänzt `Bild erzeugen` den Import als feste Materialfunktion für eingeloggte Lehrkräfte. Generierungsjobs laufen außerhalb des Canvas-Adapters, erscheinen nach Fertigstellung in einer Materialablage und werden erst durch bewusste Übernahme zu normalen Bildassets. Ein oder mehrere Ergebnisse lassen sich anschließend wie importierte Bilder per Drag-and-drop platzieren, skalieren und wiederverwenden.

## 5.10 Visuelle Kohärenz

Langfristig können Arbeitsblätter, Videos und Board dieselbe visuelle Sprache teilen:

- kompatible Farbpalette;
- Doodle-Formen;
- ähnliche Typografie;
- Rough-Notation-Hervorhebungen;
- GPT-Image-Illustrationen als Bildassets;
- die gewählte Canvas-Engine für live editierbare Struktur.

Das ist Stilrichtung, keine technische Abhängigkeit zwischen den Systemen.
