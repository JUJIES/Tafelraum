# 10. Öffentliche Ansichten, Teilen und spätere Schülerarbeit

## 10.1 Drei getrennte Ausgabemodi

### Lokale Tafelansicht

- Smartboard/externer Bildschirm im Raum;
- synchron zur konkreten Unterrichtssituation;
- durch `onAirViewport`, Revision und LIVE/GEHALTEN gesteuert;
- kann bei freigegebenem Modus Touch-/Stifteingabe erlauben.

### Remote-Live-Sitzung – später

- temporärer accountloser Link, QR-Code oder kurzer Teilnahmecode;
- nur während aktiver Session;
- folgt öffentlicher Kamera und freigegebenen Änderungen;
- zunächst read-only;
- keine eigene Audio-/Videokonferenz.

### Dauerhafte Veröffentlichung – später

- bewusst erzeugte, bereinigte Release;
- unabhängig von aktiver Session;
- einzelne Stunde oder Reihe;
- zunächst read-only und accountlos.

Diese Lebenszyklen dürfen weder in UX noch Datenmodell vermischt werden.

## 10.2 Grundsatz: bereinigte öffentliche Daten

Öffentliche Clients erhalten niemals das private Lesson-Dokument:

```text
private Lesson
→ Public Projection / Publish Compiler
→ bereinigter Payload
→ Tafel, Live-Session oder Publication
```

Entfernt werden unter anderem:

- private Lehrernotizen;
- nicht freigegebene Lösungen;
- interne Regie-Overlays;
- sensible Evidence;
- ausgeschlossene Assets und Metadaten.

Das ist server-/payloadseitige Trennung, nicht CSS-Verstecken.

## 10.3 Lokale Tafel

Die lokale Tafel verwendet den in `06_TAFELREGIE_LIVE_HOLD.md` beschriebenen Presentation-State. Sie ist Teil der frühen Produktthese, während Remote-Live und Publications später folgen.

Sie ist die öffentliche Bühne im Klassenraum und nicht mit einer persönlichen Schüleransicht gleichzusetzen:

- eigener Client auf dem erweiterten Bildschirm;
- bereinigter öffentlicher Payload statt gespiegeltem Mac-Bildschirm;
- eigener Viewport und eigener Werkzeugzustand;
- standardmäßig inhaltszentriert und ohne sichtbare Editorleiste;
- reduzierte Tafelwerkzeuge nur nach ausdrücklicher Interaktionsfreigabe;
- Werkzeugwahl und Toolbarposition wirken nicht auf die Lehrer-Shell am Mac.

Wenn die Lehrkraft die öffentliche Tafel bewusst vom Mac steuert, kann ein flüchtiger öffentlicher Zeiger Orientierung geben. Ein bewusster Klick kann an derselben Position einen kurzen kreisförmigen Aufmerksamkeitsimpuls auslösen. Zeiger, Impuls und freigegebene Tafelwerkzeuge dürfen gleichzeitig sichtbar sein. Normale Mausbewegungen und private Bearbeitung bleiben unsichtbar.

Die sichtbare Tafelwerkzeugleiste kann über einen eigenen Griff direkt verschoben werden. Während des Ziehens folgt sie der Eingabe frei; beim Loslassen rastet sie in eine grobe Dockingzone oben, unten, links oder rechts ein. Ihre Position und Werkzeugauswahl bleiben lokaler Zustand des Tafelclients.

## 10.4 Remote-Live-Sitzungen

Produktseitig ist dies eine gemeinsame **Live-Teilnahme**: Ob ein Teilnehmer im Klassenraum oder außerhalb sitzt, verändert weder Viewer noch Anfrage-/Freigabelogik. `Remote-Live` bezeichnet vor allem den serververmittelten Transport und den temporären Sessionlebenszyklus.

Zielablauf:

1. Host startet Session.
2. Anwendung erzeugt schwer erratbaren temporären Link, QR-Code und optional kurzen Teilnahmecode.
3. Teilnehmer öffnen ihn ohne Konto und geben einen Anzeigenamen ein.
4. Sie sehen eine reduzierte öffentliche Boardansicht.
5. Viewpoint, Schritte und freigegebene Änderungen folgen live.
6. Host beendet die Session; Link verliert seine Gültigkeit.

Erste Stufe:

- read-only;
- Fullscreen oder normales Browserfenster;
- parallel zu vorhandener Videokonferenz nutzbar;
- keine Desktopübertragung;
- keine private Kamera, Menüs oder anderen Programme.

Später:

- Schüler und andere Zuschauer können von einem Gerät im Klassenraum oder außerhalb auf dieselbe Weise teilnehmen;
- Teilnehmer können mit `Mitarbeit anfragen` eine Bearbeitungsanfrage senden;
- nur die Lehrkraft kann eine Anfrage freigeben, ablehnen oder eine laufende Freigabe beenden;
- reduzierte Werkzeuge mit sichtbarer Werkzeugübergabe;
- klare Moderationsrechte;
- Teilnehmerbeiträge in isoliertem Session-Layer;
- kanonisches Lehreroriginal wird nicht unkontrolliert verändert.

### Gemeinsamer Werkzeugmodus

Für den ersten interaktiven Teilnahme-Slice besitzt die Session genau einen aktiven Werkzeughalter. Das ist kein freies gleichzeitiges Mehrbenutzer-Canvas:

1. Alle Teilnehmer befinden sich zunächst im Zustand `Folgen` und sehen dieselbe öffentliche Präsentation.
2. Lisa wählt `Mitarbeit anfragen`.
3. In der Lehreransicht erscheint knapp `Lisa möchte mitarbeiten` mit der primären Aktion `Freigeben`.
4. Nach der Freigabe wählt Lisa ein erlaubtes Werkzeug oder eine freigegebene interaktive Aufgabe.
5. Lehreransicht, lokale Tafel und Teilnehmerclients zeigen den aktiven Zustand, etwa `Lisa · Stift`.
6. Nur Lisa darf in diesem Moment öffentliche Bearbeitungs-Commands senden; alle anderen bleiben im Zustand `Folgen`.
7. Die Lehrkraft kann mit `Beenden` die Freigabe jederzeit sofort entziehen oder selbst übernehmen.
8. Für eine Person an der lokalen Tafel bleibt die getrennte Tafel-Interaktionsfreigabe maßgeblich; persönliche Teilnehmergeräte dürfen die Kontrolle niemals selbstständig übernehmen.
9. Bei Inaktivität, Verbindungsabbruch, Sessionende oder aufgehobener Freigabe endet die Werkzeugberechtigung.

Die Werkzeugübergabe ist ein serverseitig validierter, kurzlebiger Sessionzustand. Eine Anfrage erzeugt noch keine Schreibberechtigung; ausschließlich ein Host-Command erteilt den Werkzeug-Lease. Er darf nicht durch konkurrierende Clientmeldungen oder `last write wins` entstehen. Für den ersten Slice gilt außerdem: Teilnehmerwerkzeuge sind nur in `LIVE` aktiv; `GEHALTEN` unterbricht die Eingabeberechtigung, ohne die Session zu beenden.

Ein Anzeigename wie `Lisa` ist bei einem accountlosen Link eine selbst gewählte Sitzungsbezeichnung und keine geprüfte Identität. Intern verwendet die Session zusätzlich eine nicht sichtbare eindeutige Teilnehmer-ID. Wenn belastbare Identität oder Anwesenheitsnachweis nötig werden, braucht es später Zugangscodes oder Anmeldung.

QR-Code beziehungsweise allgemeiner Teilnahmecode identifizieren nur die Session. Für einen Gerätewechsel ohne Konto kann Tafelraum optional einen persönlichen, zeitlich begrenzten Wiederaufnahmecode ausgeben. Dieser ist ein übertragbares Geheimnis und erlaubt keine verlässliche Feststellung, welche reale Person ihn verwendet. Ein dauerhaft über mehrere Stunden verwendbarer Schülercode wäre bereits ein pseudonymes Kontomodell und wird nicht nebenbei eingeführt.

Beiträge werden mit Teilnehmer-ID, Anzeigename, Zeitpunkt und Werkzeug im LessonRun beziehungsweise Session-Layer referenziert. Sie überschreiben nicht automatisch die wiederverwendbare LessonDefinition. Umfang von Undo, spätere Übernahme in die Vorbereitung und Moderation einzelner Beiträge bleiben eigene Entscheidungen.

### Interaktive Aufgaben und Tabellen

Ein Teilnehmer kann nach Freigabe dieselben reduzierten Zeichen-, Text- und Auswahlwerkzeuge verwenden, soweit die öffentliche Aufgabe sie erlaubt. Zwei technische Fälle bleiben getrennt:

- Eine Tabelle als Bild oder PDF kann mit Stift beziehungsweise Text überlagert werden. Die vermeintlichen Zellen sind dabei keine semantisch editierbaren Felder.
- Direktes Anklicken, Ausfüllen und späteres Auswerten einzelner Zellen benötigt ein strukturiertes Tabellen- oder Aufgabenobjekt mit stabilen Zell-IDs und begrenzten Commands wie `setCellAnswer`.

Das strukturierte Objekt liegt in der Lesson-/Activity-Domäne und wird nur durch die Canvas-Engine dargestellt. Eine Bearbeitungsfreigabe kann auf die gesamte öffentliche Fläche, einen Bereich, ein Objekt oder einzelne erlaubte Felder begrenzt werden. Der erste Teilnahme-Spike beginnt mit Annotation und Text; echte Zelleingabe folgt nur, wenn der Unterrichtstest ihren zusätzlichen Nutzen bestätigt.

Offen:

- Reconnect und kurze Nachlaufzeit;
- Session-Persistenz;
- Darstellung und Reihenfolge mehrerer Bearbeitungsanfragen;
- Moderationsmodell und Undo-Grenze;
- maximale Teilnehmerzahl;
- Einbindung eines Live-Pointers;
- ob temporäre Beiträge in einen LessonRun übernommen werden können.

## 10.5 Dauerhafte Publications

```text
Private Lesson Revision
→ Publish Compiler
→ Release 1 / Release 2 / …
→ stabiler Share-Link
```

Änderungen erscheinen erst nach bewusster Aktualisierung der veröffentlichten Release.

### Einzelstunde

- Stundenpfad mit Abschnitten und Schritten;
- freigegebene Boardausschnitte;
- später PDFs/Videos/Downloads;
- touchgerechter Tablet-Viewer.

### Reihe

- geordnete veröffentlichte Stunden;
- neue Stunden nur nach Freigabe;
- optional gemeinsame Materialien.

## 10.6 Publication-Viewer

Dieser read-only Viewer gehört zu dauerhaft veröffentlichten Stunden und ist nicht der interaktive Participant-Client einer Live-Session.

Leichte eigene App-Shell:

- große Navigation;
- Stundenpfad statt Editorleisten;
- Zoom und Vollbild;
- später Medienwiedergabe;
- keine KI-, Lehrer- oder Bearbeitungsfunktionen;
- gute iPad-Performance.

Ob Abschnitts-/Schrittnamen und eine Fortschrittsanzeige öffentlich sichtbar sind, ist offen.

## 10.7 Accountlose Links

Für read-only:

- langer, nicht erratbarer Token;
- optional PIN/Ablaufdatum;
- widerrufbar;
- optional Downloadrechte.

Ein Secret Link kann weitergegeben werden und ist keine geprüfte Identität.

Auch ein zusätzlich eingegebener Anzeigename belegt keine Identität. Er dient zunächst nur dazu, die aktuelle Werkzeugübergabe und Beiträge innerhalb der Session verständlich zuzuordnen.

Der allgemeine Teilnahmecode berechtigt nur zum Beitritt im Zustand `Folgen`. Schreibrechte entstehen ausschließlich durch die konkrete Freigabe einer Anfrage. Ein persönlicher Wiederaufnahmecode kann eine pseudonyme Sessionidentität auf einem anderen Gerät fortsetzen, bleibt aber ein weitergebbares Geheimnis.

## 10.8 Capabilities

Später präziser als `editable: true/false`:

- `view`;
- `play-media`;
- `download-materials`;
- `annotate`;
- `fill`;
- `save-progress`;
- `submit`;
- `collaborate`;
- `duplicate`.

Lokale Tafel, Live-Session und Publication verwenden unterschiedliche Capability-Sets.

Auch innerhalb der lokalen Tafel werden Anzeige und Interaktion getrennt: `view` ist immer erforderlich, `annotate` oder das Bewegen freigegebener Elemente werden nur bewusst aktiviert. Diese Freigabe verändert nicht die Berechtigungen oder das aktive Werkzeug der Lehreransicht.

In einer interaktiven Remote-Live-Sitzung wird `annotate` nicht pauschal an alle Viewer verteilt. Teilnehmer dürfen nur eine Bearbeitung anfragen. Konkrete Commands akzeptiert der Server erst nach Hostfreigabe und nur vom aktuellen Werkzeughalter innerhalb des freigegebenen Bereichs beziehungsweise Objekts.

## 10.9 Spätere isolierte Schülerarbeit

Eine veröffentlichte Vorlage kann später pro Schüler eine reduzierte, isolierte Instanz erzeugen:

```text
Publication
└── AssignmentTemplate
    ├── StudentInstance A
    └── StudentInstance B
```

Mögliche Werkzeuge:

- Stift, Text, Marker, Radierer;
- freigegebene Elemente bewegen;
- Bilder ergänzen;
- Ergebnis speichern oder abgeben.

Ohne Konto benötigt Persistenz entweder Browserlokalspeicher, einen individuellen geheimen Link oder einen pseudonymen Zugangscode. Geräteübergreifende Wiederaufnahme ohne irgendeine anonyme Identität ist nicht möglich.

## 10.10 Datenschutz

- keine sensiblen Schülerergebnisse in allgemeinen Reihenlinks;
- Share-Vorschau;
- private Assets ohne öffentliche Direkt-URL;
- serverseitige Capability-Prüfung;
- Widerruf von Links;
- Namen-/Gesichtswarnung vor Veröffentlichungen;
- Teilnehmerbeiträge getrennt vom Lehreroriginal.

Replay, vollständige Lernanalytics und kollaborative Klassenräume sind nicht Teil des frühen Scopes.
