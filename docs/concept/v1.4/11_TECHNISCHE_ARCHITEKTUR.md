# 11. Vorläufige technische Architektur

## 11.1 Zielbild

```text
Teacher Web                         Public Client
    │                         (lokal, später remote)
    ├── Lesson Path                       │
    ├── Teacher Camera                    ├── Public Projection
    └── Private Overlays                  └── Presentation Camera
                 \                        /
                  └── Lesson Runtime ────┘
                       ├── Lesson Document
                       ├── Activity / Flow Model
                       ├── Command Layer
                       ├── Presentation State
                       ├── Canvas Adapter
                       └── Asset Service      # später erweitert
```

Dokumentzustand, öffentliche Kamera und flüchtige Sessionevents sind getrennt.

## 11.2 Plausibler Stack mit Entscheidungsgates

Früher Kern:

- TypeScript;
- React;
- browserbasierte, installierbare Web-App/PWA als erste Laufzeit;
- `canvas-port` mit Excalidraw als lizenzoffenem Baseline-Kandidaten;
- zeitlich begrenzter tldraw-Gegenspike vor Festlegung der Canvas-Engine;
- Node-Backend;
- versioniertes Lesson-Dokument mit Runtime-Validierung;
- Dateispeicher für Originalassets und Renditions;
- SQLite als mögliche Startlösung für Index, Revisionen, Suche und Jobs, nicht als einziger rekonstruierbarer Unterrichtsspeicher;
- Beelink als kanonischer Server und Primärspeicher;
- IndexedDB, Outbox und Service Worker für Local-first-light;
- ein gemeinsames Presentation-Protokoll mit lokalem und serververmitteltem Transport;
- frühe Bild- und PDF-Assetpipeline mit PDF.js als Baseline für den Rendering-Spike.

Spätere Module:

- Video-/Remotion-Player;
- Lesson-Pack-ZIP;
- Remote-Session-Transport;
- KI- und Job-Infrastruktur.

Technologien werden durch Spikes bestätigt, nicht durch dieses Konzept endgültig festgelegt. React/TypeScript, browser-first, die Domänengrenzen und die Portabilitätsziele sind stabiler als die konkrete Canvas-, Datenbank- oder Transportbibliothek.

Ein Desktop-Wrapper wie Tauri oder Electron ist kein früher Bestandteil des Stacks. Er wird nur erwogen, wenn reale Browsergrenzen bei Fensterplatzierung, Dateizugriff, Stift/Touch oder Offlinebetrieb den Unterrichtsablauf nachweislich behindern.

## 11.3 Modulgrenzen

Konzeptionell:

```text
lesson-schema
lesson-commands
lesson-activities
lesson-path
canvas-port
canvas-adapter-excalidraw
canvas-adapter-tldraw        # nur Gegenspike, bis entschieden
presentation-camera
public-projection
presentation-runtime
storage-adapter
asset-model
mirror-import

# später
video-integration
lessonpack
remote-live-session
student-publication
ai-tools
```

Eine Block-Registry und ein Plugin-System sind keine frühe Architekturvorgabe.

`mirror-import` ist zunächst ein schmaler lokaler Adapter. Er liest Reihenspiegel, Materialmanifest und optionale Mirror-JSON-Dateien und erzeugt daraus validierbare Importvorschläge. Er benötigt keine OneNote-API, OCR oder generative KI.

## 11.4 Canvas-Port und Engine-Adapter

Der gemeinsame `canvas-port` beschreibt nur die Fähigkeiten, die die Unterrichts-App tatsächlich benötigt. Ein konkreter Engine-Adapter:

- übersetzt Commands in Engine-Elemente beziehungsweise Records;
- liest Bounds und Selektion;
- verwaltet stabile Element- und Assetreferenzen;
- kapselt Engine-Versionen und deren Migrationen;
- trennt private App-Overlays von der Szene;
- verhindert direkte Agentenmanipulation interner JSON-Strukturen.

Der Canvas-Adapter kennt Darstellungen. Er ist nicht Eigentümer von Activities, Materialrollen oder Unterrichtsfluss. Diese bleiben in der Lesson-Domäne und können auch für andere Views verwendet werden. Engine-Metadaten dürfen stabile `activityId`, `assetId` oder andere Referenzen tragen, aber keine zweite fachliche Wahrheit erzeugen.

Der frühe Port muss nicht jede Funktion beider Bibliotheken abstrahieren. Er umfasst nur den validierten Slice aus Erzeugen/Ändern/Löschen, Selektion, Bounds, Viewport, Assetreferenzen, Import/Export des Boardzustands und öffentlicher Projektion. Engine-spezifische Erweiterungen bleiben außerhalb des Ports, bis ihr Produktnutzen belegt ist.

## 11.5 Lesson Path und Kamera

`lesson-path` verwaltet:

- Sections/Steps und Reihenfolge;
- gespeicherte Viewpoints;
- Rückkehr zum Schritt;
- optional Thumbnails.

`presentation-camera` verwaltet:

- `onAirViewport`;
- optional `preparedViewport`;
- Viewpoint-Übergänge;
- Seitenverhältnis/Fit;
- Drag-and-release;
- Reconnect-sicheren öffentlichen Zustand.

Der lokale Presenter und spätere Remote-Clients sollen dieselbe semantische Public Projection rendern können. Sie dürfen unterschiedliche Transporte nutzen.

## 11.6 Zustandskanäle

### Dokumentzustand

- Boardelemente;
- Stundenpfad;
- Sichtbarkeitsdaten;
- Revisionen.

### Presentation-State

- `onAirRevision`;
- `onAirViewport`;
- LIVE/HELD;
- aktiver Schritt;
- optional vorbereitetes Ziel.

### Flüchtige Events

- Public Pointer;
- Verbindungsstatus;
- Übergangsfortschritt;
- später Teilnehmerpräsenz, Werkzeuganforderung und sichtbare Übergabe;
- später temporäre Remote-Beiträge.

Der letzte sichere On-Air-State wird gespeichert. Cursorstreams und Animationstakte müssen nicht dauerhaft persistiert werden.

## 11.7 Presentation-Protokoll und Transport

Presentation-State und Transport bleiben getrennt. Derselbe semantische Zustand kann zunächst über unterschiedliche Adapter verteilt werden:

- `BroadcastChannel` oder vergleichbarer Same-Origin-Kanal für Lehrer- und Presenterfenster auf demselben Gerät;
- WebSocket beziehungsweise serververmittelter Kanal für ein separates Smartboard, Reconnect und spätere Remote-Clients.

Die Veröffentlichung von `onAirRevision` und `onAirViewport` muss atomar erscheinen. Ein Transportwechsel darf keine neue LIVE/HELD-Logik erzeugen.

Für den ersten interaktiven Teilnahme-Slice verwaltet der serververmittelte Sessionkanal eine Anfragewarteschlange und einen exklusiven Werkzeug-Lease. Teilnehmer können nur anfragen; ausschließlich ein autorisierter Host-Command erteilt die Bearbeitung. Nur Commands des aktuellen Halters innerhalb des freigegebenen Bereichs beziehungsweise Objekts werden akzeptiert. Host, Inaktivität, Disconnect, `GEHALTEN` oder Sessionende können den Lease kontrolliert beenden. Anzeigename und Clientzustand sind keine Autorisierung: Teilnehmer-ID, Sessiontoken, Hostfreigabe und aktueller Lease werden bei jedem schreibenden Command serverseitig geprüft.

Geräte im Klassenraum und außerhalb verwenden denselben Participant-Client und dasselbe Presentation-Protokoll. Ein allgemeiner QR-/Teilnahmecode öffnet nur die Session. Ein optionaler persönlicher Wiederaufnahmecode stellt eine pseudonyme Sessionteilnahme auf einem anderen Gerät wieder her, ist aber kein Identitätsnachweis. Echte Tabellenzellen oder andere ausfüllbare Aufgaben benötigen domänenspezifische Commands; ihre Fachlogik darf nicht als zufällige Engine-Metadaten implementiert werden.

Automatische Platzierung eines Presenterfensters auf einem zweiten Bildschirm ist progressive Verbesserung, keine Voraussetzung. Der Grundablauf muss mit bewusst geöffnetem Fenster, manuellem Verschieben und Vollbild funktionieren. Browser- und Berechtigungsgrenzen werden auf der Zielhardware geprüft.

## 11.8 Öffentliche Projektion

Eine eigene Projektion/Compiler-Schicht erzeugt aus dem privaten Dokument eine erlaubte öffentliche Datenmenge. Sie:

- entfernt teacher-only Inhalte;
- respektiert Reveal-, Sharing- und Sensitivity-Regeln;
- liefert nur benötigte Boardelemente und Assets;
- wird für lokale Tafel, Remote-Live und Publications mit unterschiedlichen Policies wiederverwendet.

## 11.9 Persistenz und Speicheranbindung

**Starke Empfehlung:** Produktmodell und Speicherbackend trennen.

Empfohlene Verantwortungsverteilung für den ersten Vertikalschnitt:

- lokale Änderung sofort in IndexedDB;
- lokale Outbox/Write-Ahead Queue mit Basisrevision;
- Hintergrundsync;
- aktive Stunde lokal cachen;
- serverseitig versioniertes Lesson-Dokument;
- Originalassets und Renditions als Dateien mit stabilen IDs;
- SQLite für Index, Revisionen, Suche und Hintergrundjobs;
- regelmäßige Backups und Restore-Test.

Für den Single-Teacher-MVP gilt zunächst eine aktive Schreibsession pro Lesson. Der Server vergibt Revisionen und lehnt einen stillen Überschreibversuch auf veralteter Basisrevision ab. Eine konkrete Konflikt-UX wird im Persistenzspike festgelegt; „last write wins“ ohne sichtbare Prüfung ist kein sicherer Standard.

Das Lesson-Dokument und seine Assetreferenzen müssen auch ohne eine proprietäre Canvas- oder Datenbankinstallation rekonstruierbar bleiben. Ob versioniertes JSON, ein aus einer Runtime-Schemaquelle erzeugtes JSON-Schema oder ein vergleichbarer Mechanismus die führende technische Repräsentation bildet, ist vor dem ersten dauerhaften Schema zu entscheiden. Mehrere manuell gepflegte Schemawahrheiten sind zu vermeiden.

**Bestätigt:** Der private Beelink ist Primärspeicher und kanonische Serverablage. OneDrive beziehungsweise Microsoft Cloud ist weder Voraussetzung noch Quelle der Wahrheit. Spätere Backup-, Export- oder Storage-Adapter bleiben möglich, müssen aber die Beelink-Identität und Portabilität der Lesson-Daten erhalten.

Präzisierung ab Version 1.3: Der Beelink ist der bestätigte primäre Betriebs- und Speicherort. Stabile IDs, Manifeste und relative Referenzen bilden jedoch die portable Datenidentität. Ein Serverwechsel darf keine neue Unterrichtsdomäne erzeugen.

Diese Architekturentscheidung soll die Anwendung bewusst von schulischer beziehungsweise arbeitgeberseitiger Infrastruktur trennen. Vor produktivem Einsatz personenbezogener Daten sind Datenschutz, Verschlüsselung, Backup, Zugriffskontrolle und organisatorische Zulässigkeit gesondert zu klären.

Ein vollständiges CRDT ist für den Single-Teacher-MVP nicht erforderlich.

## 11.10 Sicherheit

- Teacher-Bereich authentifiziert;
- Presenter-Token ohne administrative Rechte;
- Public Projection statt vollständigem privaten Dokument;
- private Assets nicht öffentlich adressierbar;
- Tokens eng begrenzt;
- Tunnelzugang und App-Berechtigung getrennt;
- sichere Standardwerte bei Reconnect und Fehlern.

## 11.11 Tests der frühen Builds

Kritische E2E-Flows:

1. freie Stunde öffnen, Elemente anlegen, speichern, neu öffnen;
2. Touch/Stift/Finger-Pan auf realer Hardware;
3. Bild per Drag-and-drop importieren, platzieren, skalieren und erneut öffnen;
4. PDF importieren, Seite platzieren, scharf darstellen und getrennt annotieren;
5. Originalasset, Boardreferenz und Annotation nach Reload korrekt rekonstruieren;
6. Beelink-Speicherung plus lokaler Cache überstehen kurzen Verbindungsausfall.
7. vorhandenen gespiegelten Reihenordner lesen, Materialstatus anzeigen und mindestens eine Lesson importieren.

Im anschließenden Presenter-Slice:

8. Lehrer- und Presenterfenster zeigen dasselbe Dokument mit getrennten Viewports;
9. Lehrerkamera navigiert, Tafel bleibt unverändert;
10. Tafelausschnitt ziehen, erst beim Loslassen veröffentlichen;
11. Schritt aus Viewpoint speichern und wieder aufrufen;
12. Reihenfolge ändern, Boardposition bleibt;
13. private Elemente werden nie übertragen;
14. LIVE/GEHALTEN, vorbereitete Änderungen am Lehrergerät und Reconnect;
15. Smartboard ist während GEHALTEN im ersten Slice read-only;
16. Public Pointer erscheint nur im sichtbaren Tafelausschnitt.

Video-, Lesson-Pack-, Remote- und KI-Tests folgen später.

## 11.12 Noch offene technische Entscheidungen

- Excalidraw versus tldraw nach identischem, zeitlich begrenztem Gegenspike;
- genaue `canvas-port`-Oberfläche;
- Embed versus späterer Engine-Fork nur bei nachgewiesenem Blocker;
- führende Runtime-/Schemaquelle und daraus abgeleitete Typen;
- genaue Rolle von SQLite gegenüber versionierten Lesson-Dokumenten;
- Serverrevision, Outbox, Single-Writer-Regel und Konflikt-UX;
- genaue Viewpoint-Repräsentation;
- BroadcastChannel-/Same-Origin-Transport versus Server/WebSocket und deren gemeinsames Protokoll;
- browserbasierte Fensterplatzierung, manueller Zweitbildschirm-Fallback und möglicher späterer Desktop-Wrapper;
- Snapshot-/Patchstrategie;
- sichere und performante Public Projection;
- Offline-Tiefe;
- konkrete Beelink-Backup-/Restore-Strategie;
- Asset- und PDF-Renderingstrategie;
- Browser-/Hardwarematrix.

Die genaue Wahl eines Node-Webframeworks, eines UI-Kits oder einer Jobbibliothek ist vor diesen Entscheidungen nicht architekturkritisch und wird nicht vorsorglich festgeschrieben.
