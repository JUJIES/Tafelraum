# 16. Architektur, Stack und Canvasentscheidung

## 16.1 Status dieses Kapitels

Dieses Kapitel trennt drei Ebenen:

1. bereits tragfähige Produkt- und Domänenarchitektur;
2. plausible Umsetzungsrichtung für die ersten Builds;
3. Entscheidungen, die erst ein reproduzierbarer Spike festlegt.

Es ist kein vollständiger Produktionsbauplan. Bibliotheken werden nicht allein wegen einer umfangreichen Featureliste gewählt.

## 16.2 Stabiler Architekturkern

Unabhängig vom konkreten Stack gelten:

- Das Lesson-Dokument ist die fachliche Quelle der Wahrheit.
- Activities, LessonFlow, Views, PresentationSteps, Assets und LessonRun bleiben unterscheidbar.
- Das Board ist eine wichtige View, aber nicht das gesamte Unterrichtsmodell.
- Originalassets liegen außerhalb der Canvas-Payload.
- Dauerhafte Änderungen laufen über validierte Commands.
- Öffentliche Clients erhalten eine bereinigte Projektion, nicht das private Dokument.
- Viewpoints und Clips dürfen diese bereinigte Projektion als Kamera begrenzen, ohne für jede Bewegung eine neue Projektion zu erzeugen. Das ist keine Datenschutzgrenze; echte private Inhalte und Abdeckungen müssen vor der Übertragung entfernt beziehungsweise sicher gerastert sein.
- Beelink ist primärer Betriebs- und Speicherort; Datenidentität bleibt portabel.
- Canvas, Speicher, Transport und spätere KI liegen hinter klaren Ports beziehungsweise Diensten.

Ein Bibliothekswechsel darf diese Regeln nicht verändern.

D-329 präzisiert die Agentenports: Die Befehls-/Materialschicht bleibt unabhängig
von Modell, KI-Anbieter und Agentenprogramm. Gemeinsame Arbeitsanleitungen sind
kanonisch; Erkennung/Einrichtung konkreter Agenten liegt in dünnen Adaptern.
Optionaler anbietergebundener Pilotcode wird nicht zur Voraussetzung des Kerns.
Siehe [Agenten-Workflow](../../AGENT_WORKFLOW.md). Das ist eine Architekturregel,
keine behauptete fertige Einrichtung für jeden Agenten.

## 16.3 Vorläufiger Stack für die Spikes

```text
Teacher Web/PWA                         Public Window/Client
        │                                      │
        ├── React + TypeScript                 ├── bereinigte Projection
        ├── Lesson Runtime                     └── Presentation Viewport
        ├── IndexedDB + Outbox                          │
        └── canvas-port                                 │
              └── Engine-Adapter                        │
                       \                                /
                        Presentation Protocol
                                  │
                         Node/TypeScript Backend
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     versionierte Lesson     SQLite-Index/       Asset-Dateien
        Dokumente              Revisionen       und Renditions
                                  │
                         Beelink-Primärspeicher
```

Vorläufige Komponenten:

- React und TypeScript für App-Shell und gemeinsame Verträge;
- installierbare Web-App/PWA als erste Laufzeit;
- Node/TypeScript für API, Persistenz, Authentifizierung und Jobs;
- versionierte Lesson-Dokumente mit Runtime-Validierung;
- SQLite für Index, Revisionen, Suche und Jobstatus;
- Dateispeicher für Originalassets und abgeleitete Renditions;
- IndexedDB plus Outbox für aktive Stunde und kurze Ausfälle;
- PDF.js als Baseline für seitenweises PDF-Rendering;
- Same-Origin-Kanal für lokale Fenster und WebSocket-Adapter für getrennte Geräte/Reconnect;
- Playwright für kritische Browserflüsse plus verpflichtende reale Hardwarechecks.

Nicht festgelegt sind das konkrete Node-Webframework, UI-Kit, Query-Tool oder die Jobbibliothek. Diese Entscheidungen erzeugen vor den Spikes keinen hinreichenden Produktnutzen.

## 16.4 Laufzeit und Zweitbildschirm

Browser-first ist die Startentscheidung. Dadurch können Mac, Smartboard und später weitere Clients dieselbe Anwendung verwenden, ohne früh mehrere native Apps zu pflegen.

Der verlässliche Basisablauf lautet:

1. Lehreransicht öffnen.
2. Tafelansicht bewusst in einem zweiten Fenster öffnen.
3. Fenster bei Bedarf manuell auf den zweiten Bildschirm verschieben.
4. Vollbild aktivieren.
5. Bei Reconnect letzten sicheren On-Air-State wiederherstellen.

Automatische Fensterplatzierung über Browser-APIs ist nur progressive Verbesserung. Ein Desktop-Wrapper wird erst geprüft, wenn reale Hardwaretests einen nicht vertretbaren Browserblocker zeigen.

## 16.5 Canvas-Port

Der `canvas-port` soll klein bleiben. Er benötigt zunächst Fähigkeiten für:

- Element erzeugen, ändern und löschen;
- Text, Form, Freihand und Marker;
- Auswahl und Bounds;
- Teacher-Viewport lesen und setzen;
- Engine-Snapshot laden und speichern;
- Bild-/Rendition-Referenzen platzieren;
- validierte externe Linkmaterialien als Canvasgeometrie mit getrennter DOM-Projektion platzieren;
- lokale Medienoriginale als Canvasgeometrie mit getrennter DOM-Projektion platzieren;
- stabile Referenzen zu Activity, Asset und Linkmaterial tragen;
- relevante Elemente für eine öffentliche Projektion bestimmen;
- Boardregion beziehungsweise Viewpoint exportieren oder rendern.

Der Port besitzt ausdrücklich nicht:

- Activities oder LessonFlow;
- Materialrollen;
- LIVE/HELD-Regeln;
- Publication- oder Sensitivity-Policy;
- Assetbytes;
- Providererkennung, URL-Normalisierung oder Linkarchivierung;
- Agentenprompts.

Der Port wird aus dem realen Slice abgeleitet. Er ist kein vorsorgliches Universal-Whiteboard-Framework.

Interaktive Materialtypen folgen zusätzlich dem verbindlichen [Einbettungsvertrag für Material und interaktive Inhalte](../../implementation/02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md). Sie teilen Canvasgeometrie, Provenienz und Eingabegrundsätze, aber nicht blind denselben Renderer: Rastermaterial bleibt im Bildpfad, Tafelraum-eigenes HTML wird als kontrollierte DOM-Oberfläche projiziert, fremde feste Player verwenden eine schärfeerhaltende Iframe-Projektion und scrollbare Websites benötigen einen eigenen Interaktions- und Sicherheitsvertrag. Diese Auswahl liegt außerhalb der Canvas-Engine.

## 16.6 Excalidraw als Baseline

Stärken für den aktuellen Grundlagenbuild:

- schneller React-Embed;
- Text, Formen, Pfeile, Freihand, Bilder und offene Szenendaten;
- zusätzliche Referenzen über `customData`;
- Doodle-Look passend zur bisherigen visuellen Sprache;
- MIT-Lizenz und geringe kommerzielle Abhängigkeit.

Zu prüfen:

- Stift/Finger/Palm Rejection auf echter Zielhardware;
- saubere Abbildung eigener Overlays und Viewports;
- stabile Referenzen und Migrationen bei Engine-Updates;
- Performance mit materialreichen Stunden;
- Grenzen der öffentlichen API, insbesondere bei programmatischer Elementerzeugung;
- ob eigene Unterrichtsobjekte zu viel Sonderlogik außerhalb der Engine erzeugen.

Excalidraw gewinnt nicht automatisch durch den Status quo. Es gewinnt, wenn es den Slice mit weniger Risiko und ausreichender Erweiterbarkeit trägt.

## 16.7 tldraw als Gegenkandidat

Stärken für die langfristige Produktidee:

- eigene Shape-Typen, Tools und Bindings;
- persistierbare Custom Records mit Validierung und Migrationen;
- klarer Store für Dokument-, Session- und Presence-Daten;
- austauschbare Asset-Speicher;
- weitreichende UI- und Sichtbarkeitsanpassung;
- aktuelle Muster für Agenten mit visuellen und strukturierten Canvasdaten.

Möglicher Produktnutzen:

- Activity-, Medien- oder Aufgabenobjekte könnten echtes Verhalten auf dem Board besitzen;
- spätere KI könnte strukturierte Objekte gezielter lesen und ändern;
- Schemaentwicklung und Beziehungen zwischen Canvasobjekten könnten weniger eigene Infrastruktur benötigen.

Risiken:

- produktiver Einsatz benötigt nach aktuellem Modell einen gültigen Lizenz-Key;
- Hobby-Lizenz ist nur auf Antrag und diskretionär verfügbar und zeigt ein Wasserzeichen;
- stärkere Bindung an Store, Shape-System und Migrationsmodell eines Anbieters;
- der technische Funktionsumfang kann dazu verleiten, Lesson-Domäne und Canvas-Store wieder zu vermischen.

tldraw gewinnt nur, wenn die verringerte Sonderlogik die Lizenz- und Lock-in-Kosten im realen Unterrichtsslice klar überwiegt.

## 16.8 Nicht empfohlene frühe Alternativen

### BlockSuite

Das gemeinsame Dokument-/Edgeless-Modell ist für spätere Mehrfachansichten interessant. Für den Grundlagenbuild ist BlockSuite jedoch zu groß, zu stark dokumentzentriert und nach eigener Projektbeschreibung noch in Verfeinerung. Es bleibt Architektur- und UX-Referenz, nicht erster Engine-Kandidat.

### Eigene Low-Level-Canvas-Engine

Konva, Fabric, Pixi oder reine Canvas-/SVG-Eigenentwicklung würden Kontrolle erhöhen, aber frühe Produktzeit in Texteditierung, Auswahl, Stift, Undo/Redo, Export, Touch und Geometrie binden. Das widerspricht dem Ziel, zuerst den Unterrichtsworkflow zu validieren.

### Früher Engine-Fork

Ein Fork vervielfacht Upgrade- und Wartungsrisiko. Er ist erst vertretbar, wenn ein reproduzierbarer, produktkritischer Blocker über öffentliche APIs nicht lösbar ist.

## 16.9 Einheitlicher Vergleichsslice

Beide Engine-Kandidaten erhalten dieselbe Aufgabe:

```text
reale gespiegelte Stunde öffnen
→ Text, Form, Freihand und Marker verwenden
→ Bild und eine PDF-Seitenrendition platzieren
→ getrennt annotieren
→ Elemente mit Activity und Asset referenzieren
→ speichern und neu laden
→ Teacher- und Public-Payload trennen
→ unabhängige Viewports darstellen
→ auf Zielhardware mit Stift und Finger bedienen
```

Entscheidungskriterien:

- Unterrichtsfluss und Bediengeschwindigkeit;
- Touch-/Stiftverhalten;
- API-Klarheit und notwendige Sonderlogik;
- Performance und Speicherbedarf;
- Persistenz und Migrationsfähigkeit;
- sichere Public Projection;
- Portabilität und Wiederherstellbarkeit;
- Lizenz, Betriebskosten und Lock-in;
- Eignung für spätere semantische Unterrichtsobjekte und Agenten.

Das Ergebnis wird in `CANVAS_ENGINE_DECISION.md` als kurze ADR festgehalten. Der Gegenspike ist zeitlich begrenzt; er baut nicht zweimal die Anwendung.

## 16.10 Speichervertrag vor dauerhaftem Schema

Vor dem ersten dauerhaften Lesson-Schema werden festgelegt:

1. führende Runtime-/Schemaquelle;
2. stabile Lesson-, View-, Element- und Asset-IDs;
3. serverseitige Revisionsnummer und Basisrevision lokaler Änderungen;
4. Outbox- und Retry-Regel;
5. Verhalten bei zweiter Schreibsession oder veralteter Revision;
6. Rolle von SQLite gegenüber Lesson-Dokumenten;
7. Assetlayout, Hash/Integritätsprüfung und relative Referenzen;
8. Backup- und getesteter Restoreweg;
9. minimale Schema- und Datenmigration.

Empfohlene Leitregel:

> Eine Lesson muss mit ihren versionierten Daten, Assets und externen Linkreferenzen rekonstruierbar bleiben, ohne dass eine bestimmte Canvas-Engine oder einzelne SQLite-Installation die einzige lesbare Quelle ist.

## 16.11 Offene Gates

### Vor Spike A

- Zielhardware und Browsermatrix;
- reale Teststunde, Bilder und PDFs;
- maximaler Umfang des tldraw-Gegenspikes;
- grundsätzliche Akzeptanz oder Ablehnung einer tldraw-Produktionslizenz;
- minimale Testauthentifizierung.

### Vor dem ersten dauerhaften Vertikalschnitt

- Canvas-Engine und bestätigter Port;
- führende Schema-/Runtimequelle;
- Lesson-/Asset-Speichervertrag;
- Revision, Outbox und Konfliktregel;
- PDF-Seiten- und Annotationskoordinaten;
- minimale Backup-/Restore-Regel.

### Erst vor dem Presenter-Slice

- genaue Viewpoint-Repräsentation;
- gemeinsames Presentation-Protokoll;
- Same-Origin- und WebSocket-Adapter;
- Zweitbildschirm-Fallback;
- atomare Veröffentlichung von Revision und Viewport.

### Bewusst später

- Desktop-Wrapper;
- CRDT/Mehrbenutzerbearbeitung;
- Remote-Live;
- Videozustände;
- KI-Provider und Agentenruntime;
- Plugin-System.

## 16.12 Aktuelle Quellenbasis, Stand 30. August 2026

- Excalidraw React/API: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/
- Excalidraw programmatische Elemente: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton
- Excalidraw Lizenz: https://github.com/excalidraw/excalidraw/blob/master/LICENSE
- tldraw Store: https://tldraw.dev/sdk-features/store
- tldraw Shapes: https://tldraw.dev/sdk-features/shapes
- tldraw Assets: https://tldraw.dev/sdk-features/assets
- tldraw Agent Starter: https://tldraw.dev/starter-kits/agent
- tldraw Lizenz-Key: https://tldraw.dev/sdk-features/license-key
- BlockSuite Architektur: https://github.com/toeverything/blocksuite/blob/main/README.md
- PDF.js: https://mozilla.github.io/pdf.js/getting_started/
- Window Management: https://w3c.github.io/window-management/

Vor einer späteren Produktionsentscheidung werden veränderliche Lizenz- und Browserangaben erneut geprüft.
