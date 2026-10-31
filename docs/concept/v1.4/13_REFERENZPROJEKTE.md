# 13. Recherchierte Referenzprojekte

## 13.1 Gesamtergebnis

Kein einzelnes untersuchtes Open-Source-Projekt vereint:

- freies Unterrichtsboard;
- optionalen Stundenpfad;
- unabhängige öffentliche Kamera;
- touchgerechte Tafelregie;
- später Material-, KI-, Sharing- und Lesson-Pack-Funktionen.

Die Projekte dienen daher als Referenzen für Teilprobleme, nicht als vollständige Produktbasis.

## 13.2 OpenBoard

Repository: https://github.com/OpenBoard-org/OpenBoard

Relevant für:

- Unterrichts-/Tafel-UX;
- PDF-Annotation;
- Medien, Vollbild und zweiter Bildschirm;
- versteckte Inhalte und Dokumentorganisation.

Native Qt-Anwendung; eher UX-Referenz als Webbasis.

## 13.3 Excalidraw

Repository: https://github.com/excalidraw/excalidraw  
Dokumentation: https://docs.excalidraw.com/

Relevant für:

- Doodle-Look;
- editierbare Shapes/Text/Stift/Pfeile;
- React-Integration;
- programmatische Elementerzeugung;
- `customData` für zusätzliche Referenzen an Elementen;
- offene Szenendaten;
- MIT-Lizenz.

Die eigene Differenzierung muss in App-Shell, Unterrichtsmodell, Stundenpfad und Präsentationskamera entstehen. Die vereinfachte API zur programmatischen Elementerzeugung ist nach aktueller Dokumentation noch Beta; direkte Abhängigkeiten davon bleiben hinter dem Canvas-Adapter.

Aktuelle Quellen:

- https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/
- https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton
- https://github.com/excalidraw/excalidraw/blob/master/LICENSE

## 13.4 Obsidian Excalidraw

Repository: https://github.com/zsviczian/obsidian-excalidraw-plugin  
Automation: https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/master/AutomateHowTo.md

Relevant für Archiv, Embeds, Verknüpfungen und programmatische Zeichnungserzeugung. Templates sind als technische Referenz interessant, aber keine aktuell geplante Produktfunktion.

## 13.5 tldraw SDK und Agent Template

Repository: https://github.com/tldraw/agent-template  
Dokumentation: https://tldraw.dev/sdk-features/store

Relevant für:

- eigene Shapes, Tools und Bindings;
- persistierbare Custom Records und Migrationen;
- Trennung von Dokument-, Session- und Presence-Daten;
- austauschbare Asset-Speicher;
- Screenshot plus strukturierte Shape-Daten;
- Auswahl/Viewport als Kontext;
- Agentenaktionen über definierte Werkzeuge.

tldraw ist seit Version 1.4 nicht nur KI-Referenz, sondern technischer Gegenkandidat zu Excalidraw. Der identische Grundlagen-Slice entscheidet, ob die Erweiterbarkeit einen realen Vorteil für Unterrichtsobjekte, Public Projection und spätere Agenten bietet.

Die Lizenz ist ein Architekturparameter: Seit tldraw SDK 4.0 benötigt produktive Nutzung einen gültigen Trial-, Commercial- oder beantragten Hobby-Key. Die Hobby-Lizenz zeigt ein Wasserzeichen. Das SDK ist source-available, aber nicht permissiv lizenziert.

Aktuelle Quellen:

- https://tldraw.dev/sdk-features/shapes
- https://tldraw.dev/sdk-features/store
- https://tldraw.dev/sdk-features/assets
- https://tldraw.dev/starter-kits/agent
- https://tldraw.dev/sdk-features/license-key

## 13.6 AI Math Tutor

Repository: https://github.com/zicojiao/ai-math-tutor

Relevant für gemeinsamen Mensch-/Agent-Canvas, Voice-Kontext und getrennte KI-Anmerkungen. KI bleibt im Teaching Workspace jedoch eine spätere Schicht.

## 13.7 AFFiNE und BlockSuite

Repository: https://github.com/toeverything/AFFiNE  
BlockSuite: https://blocksuite.io/

Relevant für local-first Workspace, Dokument/Edgeless-Canvas und mehrere Ansichten auf gemeinsamen Daten. Das gemeinsame Modell aus Blockbaum und Surface Elements ist konzeptionell interessant. BlockSuite bezeichnet Komponenten und Erweiterungsfähigkeit selbst weiterhin als in Verfeinerung. Für den ersten Build ist es zu groß und würde das eigene Lesson-Modell unnötig mit einem fremden Dokumentmodell koppeln.

## 13.8 Rnote

Repository: https://github.com/flxzt/rnote

Relevant für Stift, Touch, PDF/Bildimport, Canvasmodi und Autosave. Native Rust-/GTK-App; UX-/Performance-Referenz.

## 13.9 Channelize Whiteboard

Repository: https://github.com/ChannelizeIO/Channelize-Whiteboard-SDK

Relevant für browserbasierten Bildungswhiteboard-, PDF.js- und Annotationsworkflow. Projektstand alt; nur Referenz.

## 13.10 302 AI Whiteboard

Repository: https://github.com/302ai/302_whiteboard

Relevant für:

- Excalidraw-Fork;
- Text → Mermaid;
- Mermaid → bearbeitbare Excalidraw-Elemente;
- KI → strukturierte, weiter editierbare Szene.

Es liefert keine Lesson-, Stundenpfad- oder Tafelregie-Architektur.

## 13.11 Korrigierte Ableitung

```text
Excalidraw
→ lizenzoffener Baseline-Editor

tldraw
→ erweiterbarer Canvas-Gegenkandidat und spätere Agentenreferenz

OpenBoard + Rnote
→ Unterrichts-, Touch- und spätere PDF-UX

AFFiNE/BlockSuite + Obsidian Excalidraw
→ Dokument-, Archiv- und Verknüpfungsdenken

tldraw Agent Template + AI Math Tutor + 302 AI Whiteboard
→ spätere gemeinsame Mensch-/KI-Werkzeuge
```

Die zentrale eigene Produktidee ist jedoch:

```text
freies Board
+ optionaler Stundenpfad
+ unabhängige öffentliche Kamera
+ bewusste Tafelregie
```

Das Produkt soll weder Miro-, Prezi- noch Slide-Klon werden.

Die Recherche begründet keine Bibliotheksentscheidung allein. Maßgeblich ist der identische, hardwaregetestete Unterrichts-Slice aus `14_NAECHSTE_SCHRITTE.md`.
