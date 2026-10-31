# UI Brief – Grundfunktionen im Desktop-Update 0.1.10

## Kontext

Lehrkräfte sollen vorhandene Werkzeuge zuverlässig bedienen und deren Tastenkürzel bei Bedarf nachschlagen. Primäre Handlung der neuen Oberfläche: ein passendes Kürzel finden. Bestehende Werkzeuge, Dateispeicherung und Unterrichtsstruktur bleiben unverändert.

## Änderungen und Invarianten

- Einstellungen erhält `Tastenkürzel` mit Tastaturicon. Ein ruhiger, scrollbar begrenzter Dialog gruppiert Werkzeuge, Bearbeiten und Ansicht. Native Dialogfokussierung, Escape, Schließen und Fokus-Rückkehr. Kein dauerhaftes Hilfepanel, kein Onboarding, keine frei belegbaren Kürzel.
- Kürzel stammen aus dem tatsächlichen Werkzeugvertrag; plattformabhängig `⌘` bzw. `Strg`. Temporäre Werkzeuge ausdrücklich mit `halten`, Clipnummern nur mit ihrem Kontext.
- Freier Text bleibt beim Tippen auch außerhalb von 100 % Zoom am gesetzten Ursprung. Die Mindestbreite für die Aktionsgruppe darf die Engine-Transformation des Textfelds nicht verändern. D-164s breite native Schreiblinie wird zugunsten stabiler Eingabe durch native Textbreite ersetzt; Buttons bleiben außerhalb des Texts.
- HTML-Annotationen werden am festen Inhaltsrechteck unterhalb der Griff-/Zoomleiste beschnitten, auch bei Scrollen, Rotation und Inhaltszoom. Kein neues Datenmodell; vorhandene Striche bleiben gespeichert. Die Leiste bleibt bedienbar.
- `Kopieren` und `⌘/Strg C` liefern für Bildauswahl an das Betriebssystem ausschließlich PNG. Die laufende Tafelraum-App ordnet exakt dieses PNG flüchtig der editierbaren Canvasrepräsentation zu; andere Apps sehen keinen technischen Text. Externe oder veränderte Bilder gehen beim Einfügen weiter durch den normalen Archivimport. Texteingabe und HTML-eigene Zwischenablage bleiben bei ihrem jeweiligen Editor. Diese Korrektur ersetzt den dualen Clipboard-Eintrag aus 0.1.10.

## Abnahme

Sichtprüfung Hell/Dunkel und enger Desktop; Dialog öffnen, scrollen, schließen und Kürzel praktisch ausführen. Text bei 80/100/120 % erstellen und bearbeiten. Striche in HTML über die obere Inhaltskante bewegen/scrollen; Zoomcontrols weiter anklickbar. Bild aus externer Zwischenablage importieren, wieder als echtes Bild exportieren und intern kopieren; zugeschnittenes Bild prüfen. Gebautes natives Bundle zusätzlich mit PDF, Drag-and-drop und Vollbild prüfen. Reale Touch-/Stifthardware bleibt separate Abnahme.
