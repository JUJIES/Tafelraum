# 6. Tafelregie: unabhängige Kameras, LIVE und GEHALTEN

## 6.1 Unterrichtsproblem

Während Schüler arbeiten, soll ein Auftrag stabil auf dem großen Bildschirm stehen. Gleichzeitig möchte die Lehrkraft auf dem Mac:

- privat navigieren;
- eine spontane Idee ergänzen;
- den nächsten Abschnitt vorbereiten;
- Lösungen und Notizen sehen;
- einen neuen Tafelausschnitt festlegen.

Schüler sollen weder Suchbewegungen noch Menüs, unfertige Inhalte oder private Elemente sehen.

## 6.2 Primärer Betrieb

**Bestätigte Leitplanke:** macOS bleibt im erweiterten Bildschirmmodus.

```text
Mac / Lehreransicht
→ vollständiges Board, private Inhalte, Stundenpfad und Regie

Smartboard / öffentliche Ansicht
→ bereinigtes Board im kontrollierten Tafelausschnitt
```

Zu Beginn wird der Presenter-Tab einmal auf den zweiten Bildschirm gezogen und in Vollbild versetzt. Danach steuert die Anwendung den öffentlichen Inhalt; häufiges Umschalten zwischen Spiegeln und Erweitern entfällt.

Vorbereitung und Durchführung verwenden dabei unterschiedliche Oberflächenzustände:

- **Vorbereitung:** nur private Lehreransicht am Mac, ohne gestartete Tafelansicht;
- **Durchführung am Mac:** private Lehreransicht mit Regie, vollständigem Lesson-Zugriff und eigener Lehrerkamera;
- **Lokale Tafelansicht:** eigener öffentlicher Client auf dem erweiterten Bildschirm mit bereinigtem Payload und eigener öffentlicher Kamera;
- **Interaktive Tafelansicht:** derselbe öffentliche Client mit ausdrücklich freigegebener, reduzierter Werkzeugleiste.

Diese Zustände sind keine getrennten Lesson-Daten oder konkurrierenden Editoren. Sie sind unterschiedliche Shells und Capability-Sets auf derselben fachlichen Grundlage.

Ein Ein-Bildschirm-/Spiegelmodus kann später als reduzierter Fallback existieren, ist aber nicht primär.

## 6.3 Zwei unabhängige Kameras

### Lehrerkamera

- frei zoombar und navigierbar;
- zeigt bei Bedarf gesamtes Board und private Elemente;
- verändert die Schüleransicht nicht.

### Öffentliche Kamera

- bestimmt den Tafelausschnitt;
- bewegt sich nur durch bewusste Regieaktion;
- folgt einem Schritt oder frei gesetzten Ziel;
- erhält ausschließlich öffentliche Daten.

Das System überträgt nicht den Mac-Bildschirm als Pixelstream. Der Presenter rendert den freigegebenen Lesson-Zustand passend zu seinem Seitenverhältnis.

## 6.4 Farbiger Tafelausschnitt

Der aktuelle `onAirViewport` erscheint in der Lehreransicht als privater farbiger Rahmen. Die Lehrkraft kann:

- sehen, was Schüler gerade sehen;
- den Rahmen an eine neue Stelle ziehen;
- währenddessen weiter den alten öffentlichen Ausschnitt halten;
- beim Loslassen das Ziel veröffentlichen oder als `preparedViewport` vormerken.

Der Rahmen gehört nicht zur Lesson-Szene und nicht zu Exports.

## 6.5 Ein Kamerabefehl, mehrere Auslöser

Folgende Aktionen verwenden dieselbe Ziel- und Übergangslogik:

- `Weiter`;
- direkter Klick auf einen Schritt;
- Klick auf einen Abschnitt, sobald dessen Verhalten entschieden ist;
- freies Verschieben des Tafelausschnitts;
- erneutes Zeigen des aktuellen Schritts.

Dadurch entsteht nur eine Regielogik statt mehrerer konkurrierender Navigationssysteme.

## 6.6 LIVE und GEHALTEN

### LIVE

- freigegebene Dokumentänderungen am öffentlichen Bereich können sichtbar werden;
- bewusste Kamerawechsel werden ausgeführt;
- gemeinsame Arbeit am Board ist möglich;
- private Lehrerkamera bleibt trotzdem unabhängig.

### GEHALTEN

- öffentliche Ansicht bleibt auf `onAirRevision` und `onAirViewport`;
- Lehrkraft navigiert und editiert privat;
- ein neues Ziel kann vorbereitet werden;
- im ersten Presenter-Slice ist Bearbeitung am Smartboard während GEHALTEN zunächst deaktiviert beziehungsweise read-only;
- vorbereitete Änderungen erfolgen zunächst am Lehrergerät;
- erst eine bewusste Freigabe ändert die Tafel.

`READY/BEREIT` ist **kein eigener Zustand**. Es ist ausschließlich ein abgeleiteter Hinweis innerhalb von `GEHALTEN`:

- `HELD` plus abweichender `preparedViewport`; oder
- `HELD` plus vorbereitete Dokumentänderung.

Die Zustandsmaschine bleibt damit bei `LIVE` und `HELD`. Die Oberfläche kann beispielsweise `Änderungen bereit` anzeigen.

### Spätere Prüfung gepufferter Smartboard-Eingaben

Ein unsichtbarer vorbereiteter Smartboard-Draft bleibt eine mögliche spätere Erweiterung, ist aber keine frühe bestätigte Produktentscheidung mehr. Das Smartboard ist zugleich Eingabegerät und öffentliche Fläche: sichtbare digitale Tinte wäre bereits veröffentlicht, unsichtbare Tinte hätte kaum brauchbare Rückmeldung.

Erst nach einem funktionierenden LIVE/GEHALTEN-Grundablauf wird geprüft:

- ob einzelne diskrete Aktionen sinnvoll gepuffert werden können;
- ob vorbereitete Handschrift ausschließlich am Mac sichtbar sein kann;
- ob ein klarer Wechsel zu LIVE für handschriftliche Arbeit die verständlichere Lösung bleibt.

## 6.7 Freigabeaktionen

Plausible Aktionen:

- **Jetzt zeigen:** vorbereiteten öffentlichen Zustand atomar anzeigen und anschließend gehalten bleiben;
- **Zeigen und live:** vorbereiteten Zustand anzeigen und zu LIVE wechseln.

Bezeichnungen und genaue Wirkung auf Dokumentänderungen müssen im Prototyp getestet werden. Kamerafreigabe und Veröffentlichung privater Inhalte sind getrennte Prüfungen.

## 6.8 Drag-and-release

Beim Verschieben des Zielrahmens:

1. Lehrkraft zieht privat.
2. Tafel bleibt unverändert.
3. Beim Loslassen entsteht ein Kameraziel.
4. In LIVE beginnt ein ruhiger Übergang; in GEHALTEN wird das Ziel vorbereitet.

Rohe Mausbewegungen oder hektisches Pan/Zoom werden nie gespiegelt.

## 6.9 Ruhige Übergänge

Bestätigte Anforderungen:

- erst nach bewusster Aktion;
- nachvollziehbar und nicht hektisch;
- große Distanzen dürfen verkürzt oder überblendet werden;
- private beziehungsweise spätere Inhaltsinseln dürfen unterwegs nicht sichtbar werden.

Mögliche, aber nicht beschlossene Richtung:

```text
leicht herauszoomen
→ sicher zum Ziel repositionieren
→ hineinzoomen
```

Der konkrete Algorithmus, Übergangsdauer und Umgang mit sehr großen Distanzen sind Spike-Fragen.

## 6.10 Öffentlicher Pointer

Wenn das Zeigewerkzeug aktiv ist:

- Zeigerposition wird als flüchtiges Sessionevent übertragen;
- nur Koordinaten innerhalb des aktuellen öffentlichen Viewpoints werden gerendert;
- normale Maus und Lehrercursor bleiben privat;
- wenn die Lehrkraft die Tafel bewusst vom Mac aus steuert, erscheint für die Dauer dieser öffentlichen Steuerung ein klar erkennbarer Zeiger;
- bei einer öffentlichen Objektmanipulation kann der Zeiger die Bewegung begleiten, ohne Mac-Auswahlrahmen, Handles oder Werkzeugpaletten zu übertragen;
- der Pointer wird weder gespeichert noch publiziert.

Ein bewusster Klick innerhalb des öffentlichen Ausschnitts kann zusätzlich einen kurzen, dezenten Aufmerksamkeitsimpuls auslösen: wenige kreisförmige Wellen breiten sich an der Klickposition aus und verschwinden wieder. Der Zeiger bleibt dabei erhalten. Der Effekt ersetzt hektisches Hin-und-her-Bewegen, darf aber weder blinken noch Unterrichtsinhalt längere Zeit überdecken. Er wird nur während bewusster öffentlicher Steuerung übertragen und ist flüchtiger Session-State.

Öffentlicher Zeiger, Klickimpuls und eine freigegebene Tafelwerkzeugleiste schließen sich nicht gegenseitig aus. Dadurch kann die Lehrkraft vom Mac zeigen, während eine Person an der Tafel weiterhin direkten Zugriff auf die freigegebenen Werkzeuge besitzt.

`LIVE` allein veröffentlicht nicht jede Mausbewegung. Öffentliche Dokumentänderungen und öffentlicher Zeiger bleiben getrennte Zustände. Der genaue Auslöser für `Tafel steuern` und ein mögliches automatisches Aktivieren während einer öffentlichen Manipulation werden im Presenter-Prototyp geprüft.

## 6.11 Reconnect und Fehlerverhalten

Wiederherstellbar:

- geöffnete Lesson;
- `onAirRevision`;
- `onAirViewport`;
- `LIVE`/`HELD`;
- aktiver Schritt;
- optional vorbereitetes Ziel.

Ein Presenter-Reconnect darf nie auf den privaten Draft springen. Ohne neue gültige Daten bleibt der letzte sichere öffentliche Zustand sichtbar.

## 6.12 Priorisierte offene Fragen

- Soll es nach dem ersten Presenter-Slice überhaupt gepufferte Smartboard-Eingaben geben, und für welche diskreten Aktionen wären sie verständlich?
- Welche Änderungen werden in LIVE unmittelbar öffentlich, welche benötigen zusätzlich Freigabe?
- Wie sieht der sichere Kameraübergang aus?
- Wie werden unterschiedliche Seitenverhältnisse behandelt?
- Welcher Fallback gilt bei nur einem Bildschirm?
- Welche Benennung versteht die Lehrkraft am schnellsten?
- Soll eine öffentliche Objektmanipulation den öffentlichen Zeiger automatisch für die Dauer der Aktion aktivieren?
- Welche Einrastschwelle, Animation und Ruheposition fühlt sich beim Verschieben der Tafelwerkzeugleiste auf der realen Hardware direkt und angenehm an?
- Welche Dauer, Größe und Deckkraft des Aufmerksamkeitsimpulses lenkt den Blick, ohne abzulenken?

Videoverhalten während LIVE/GEHALTEN wird erst mit der späteren Videointegration entschieden.

## 6.13 Tafelwerkzeuge und Eingabefreigabe

Die lokale Tafel besitzt einen eigenen Werkzeugzustand. Er ist vollständig von Auswahl, aktivem Werkzeug und sichtbaren Panels der Lehreransicht getrennt.

Grundablauf:

1. Die öffentliche Tafel zeigt zunächst nur den Unterrichtsinhalt.
2. Die Lehrkraft gibt Interaktion bewusst frei.
3. Ein kleiner, gut erreichbarer Griff macht die reduzierte Tafelwerkzeugleiste auf Wunsch sichtbar.
4. Stift, Marker, Radierer und ein klar begrenztes Undo wirken auf die freigegebene Unterrichtsinteraktion.
5. Die Leiste folgt dem Griff während des Ziehens unmittelbar und rastet beim Loslassen in eine grobe Position oben, unten, links oder rechts ein.
6. Beim Wechsel zwischen horizontaler und vertikaler Kante passt sich die Werkzeuganordnung ruhig an.
7. Verbergen oder Verschieben der Leiste verändert die Mac-Oberfläche nicht.

Das Ziehen soll direkt, unterbrechbar und ohne spürbare Verzögerung wirken. Eine kurze magnetische Vorschau darf die Zielkante anzeigen; das Einrasten bleibt ruhig und funktional statt verspielt. Die letzte Dockingzone kann pro Tafelclient gemerkt werden. Exakte Schwellen, Abstände, Animation, Werkzeugmenge, Undo-Grenze und automatische Ausblendung werden auf dem Legamaster geprüft. Beiträge aus der Tafelinteraktion gehören zunächst zur konkreten Durchführung beziehungsweise einem Session-Layer; die wiederverwendbare Vorbereitung wird nicht unkontrolliert überschrieben.

Eine spätere Teilnahme-Session kann dieselben reduzierten öffentlichen Werkzeuge für Geräte im Klassenraum und außerhalb verwenden. Im ersten interaktiven Slice schreibt jedoch genau eine Person gleichzeitig. Teilnehmer senden `Mitarbeit anfragen`; erst ein Host-Command erteilt den flüchtigen Werkzeug-Token. Dieser benennt den aktuellen Halter und das aktive Werkzeug, etwa `Lisa · Stift`. Die Lehrkraft kann mit `Beenden` jederzeit entziehen oder selbst übernehmen; bei `GEHALTEN`, Verbindungsabbruch oder aufgehobener Freigabe wird die Berechtigung ausgesetzt beziehungsweise beendet. Die Lehrer-Shell behält davon unabhängig ihre privaten Werkzeuge.
