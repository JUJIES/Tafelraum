# 9. Spätere KI-Architektur

## 9.1 Grundsatz

KI ist Assistenz innerhalb eines bereits guten manuellen Produkts. Sie ist nicht Phase 1, kein Startdialog und kein generischer Chat als Hauptoberfläche.

Ein nicht-generativer Spiegelimport darf trotzdem früh stattfinden. Er liest vorhandene lokale Strukturen und Materialien; er ist keine automatische Stundenplanung und benötigt kein Modell im Produktbetrieb.

Sie soll:

- am ausgewählten Ort arbeiten;
- normale editierbare Elemente erzeugen;
- bestehende Auswahl gezielt verändern;
- die Lehrkraft nicht aus dem Boardflow herausziehen;
- private/sensible Daten nur nach bewusster Freigabe verwenden;
- nie die manuelle Arbeit durch Wartezeit oder Fehler blockieren.

## 9.2 Interaktionslogik

```text
freien Raum auswählen
→ etwas Neues an dieser Stelle erzeugen

Objekt oder Gruppe auswählen
→ genau diese Auswahl verändern
```

Der Kontext besteht aus Ort, Auswahl, sichtbarem Viewpoint, strukturierten Elementen und ausdrücklich freigegebenen Assets – nicht automatisch aus der gesamten privaten Stunde.

## 9.3 Ortsgebundene Spracheingabe

Späterer Ablauf:

1. Mikrofonwerkzeug aktivieren.
2. Stelle auf dem Board anklicken.
3. Aufnahme starten.
4. transkribierten Rohtext dort als Notiz/Textobjekt anlegen.
5. optional mit einer Aktion glätten, etwa zu Arbeitsauftrag, Frage oder schülergerechter Erklärung.

Offen ist, ob neue Sprachnotizen standardmäßig privat sind oder die Sichtbarkeit beim Anlegen gewählt wird.

## 9.4 Ortsgebundene Bildgenerierung

Bildgenerierung ist als feste spätere Materialfunktion für eingeloggte Lehrkräfte bestätigt. Sie soll in der Vorbereitung direkt erreichbar sein und nicht hinter einem allgemeinen KI-Chat liegen. Die genaue Position in der oberen App-Shell wird erst mit einem eigenen UI Brief und Mockup getestet.

Basisablauf:

1. `Bild erzeugen` öffnen.
2. In einem kompakten Feld den Bildwunsch tippen oder später sprechen.
3. Optional Anzahl beziehungsweise Varianten wählen und Auftrag starten.
4. Auftrag erscheint in einer nicht blockierenden Warteschlange; die Lehrkraft arbeitet weiter.
5. Fertige Bilder erscheinen in einer temporären Ergebnis- beziehungsweise Materialablage.
6. Ein oder mehrere Ergebnisse per Drag-and-drop auf die Arbeitsfläche ziehen.
7. Erst durch Übernahme werden sie normale Bildassets der Lesson.

Zusätzlich bleibt eine ortsgebundene Abkürzung möglich: Ort klicken oder Zielbereich aufziehen → Bildwunsch eingeben → Platzhalter dort anlegen → Ergebnis nach Fertigstellung einsetzen. Beide Einstiege verwenden dieselbe Job- und Assetpipeline.

Die Ausgabe wird für die Boardnutzung aufbereitet, etwa mit passender Rendition, Thumbnail, transparenter Variante oder sinnvoller Begrenzung. Das Originalergebnis bleibt als Asset erhalten; die Aufbereitung verändert nicht stillschweigend dessen fachliche Aussage.

OpenAI Responses API mit Bildgenerierung beziehungsweise eine Image-Generation-API ist ein plausibler späterer Provideradapter. Eine Codex-`imagegen`-Skill ist Entwicklungswerkzeug und kein Bestandteil der Tafelraum-Produktoberfläche. Lesson-, Job- und Assetmodell bleiben providerunabhängig.

### Kontextuelle Unterstützung

Die Oberfläche darf kontextbezogene Einstiege anbieten, beispielsweise `Illustration vorschlagen`, wenn eine Aufgabe, ein Text oder ein Zielbereich ausgewählt ist. Dabei gilt:

- Kontext wird vor dem Start knapp und verständlich angezeigt;
- nur die aktuelle Auswahl und ausdrücklich freigegebene Assets werden übertragen;
- ein Vorschlag startet nicht automatisch eine kostenpflichtige Generierung;
- Prompt und vorgeschlagene Richtung bleiben vor dem Start editierbar;
- private Notizen, Lösungen oder die gesamte Reihe werden nicht implizit mitgesendet.

Mehrere Aufträge und Varianten dürfen parallel laufen. Status, Fehler, Wiederholen und Entfernen werden in derselben ruhigen Warteschlange behandelt. Wartezeit, Netzfehler oder Providerlimit blockieren weder Board noch Speichern.

## 9.5 Gemeinsame Command-Schicht

UI und spätere KI verwenden dieselben validierten Aktionen, beispielsweise:

```text
createText
createShape
createArrow
moveElement
resizeElement
groupElements
setAudience
setRevealState
createSection
createStep
saveStepViewpoint
updateStepViewpoint
insertAsset
createActivity
linkAssetToActivity
setMaterialRole
setLessonFlow
recordRunOutcome
createReflection
```

Der Agent schreibt weder beliebiges Engine-JSON noch unvalidierte Unterrichtsdatensätze. Eine Lesson-/Activity-/Canvas-API schützt Validierung, Undo/Redo, Provenienz und Sichtbarkeit.

## 9.6 Vorschau und Freigabe

- kleine, eindeutige Änderungen können direkt und undo-fähig erfolgen;
- größere Aktionen entstehen in Vorschau oder separater Revision;
- Lehrkraft akzeptiert alles oder ausgewählte Teile;
- angenommene Ergebnisse werden normale Elemente.

## 9.7 Kontext und Datenschutz

Je nach Aufgabe:

- aktuelle Auswahl;
- Boardausschnitt/Screenshot;
- strukturierte Elementdaten;
- zugehöriger Schritt/Abschnitt;
- freigegebene Assets;
- relevante Lesson-Zusammenfassung.

Nicht automatisch:

- private Notizen;
- sensible Evidence;
- gesamte Reihe;
- andere vorbereitete Lösungen.

## 9.8 Provenienz

Optional speichern:

- Agentenaktion;
- Zeit;
- verwendete Quellen;
- Modell/Provider, soweit relevant;
- ursprüngliche und nachbearbeitete Version.

Provenienz soll verfügbar sein, aber die UI nicht dauerhaft überfrachten.

## 9.9 Spätere Funktionsgruppen

### Erstellung

- Text, Diagramm oder einzelne Illustration am gewählten Ort;
- ein oder mehrere Bilder über eine kompakte Warteschlange erzeugen und als normale Assets übernehmen;
- für eine bewusste Auswahl eine editierbare Illustrationsidee vorschlagen;
- Auswahl umformulieren oder vereinfachen;
- Material in editierbare Struktur übertragen.

### Analyse

- Lesson Run reflektieren;
- Schülerantworten clustern;
- nächste Stunde oder Reihe vorbereiten.

### Integration

- später Erklärvideo anfordern;
- Assets erzeugen und verknüpfen;
- Lesson Pack beziehungsweise freigegebenen Export analysieren.

Automatische pädagogische Phasen, Template-Vokabular und vollständige Stundenplanung sind keine bestätigten frühen Roadmap-Punkte.

## 9.10 Anbieterunabhängigkeit

Kanonische Lesson-Daten und Commands bleiben unabhängig von:

- konkretem Modell;
- Cloudanbieter;
- lokalem Modell;
- ChatGPT;
- späterer Agentenmemory.

Modelle, Abrechnung, BYOK, Vektordatenbank und Voice-Agent werden erst bei realem Bedarf entschieden.
