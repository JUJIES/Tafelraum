# 12. Entscheidungsregister und offene Fragen

Dieses Dokument ist das maßgebliche Register. Andere Kapitel erklären die Punkte, ändern ihren Status aber nicht.

Aktuelle Fortschreibung D-329 (29.10.2026): Der allgemeine Agentenzugang ist
modell- und anbieterunabhängig. Codex, Claude und andere geeignete lokale oder
angebundenen Agenten verwenden dieselben validierten Fähigkeiten und Material-
verträge. Kein KI-Anbieter ist Voraussetzung für den lokalen Kern. Kleine
Einrichtungsadapter dürfen keine getrennten fachlichen Modelle erzeugen.
Eine persönliche OpenAI-Pilotfunktion ersetzt diese Leitplanke nicht. Aktueller
Vertrag: [Agenten-Workflow](../../AGENT_WORKFLOW.md). Einzelabnahmen stehen noch aus.

## 12.1 Bestätigte Leitplanken

### Produkt und Board

1. Reibungsarme kreative Arbeitsfläche statt verpflichtender Planung.
2. Interne Formel: **Frei erstellen. Später strukturieren. Bewusst zeigen.**
3. Freies, potenziell unendliches Board.
4. Keine verpflichtenden Seiten, Phasen oder pädagogischen Kategorien.
5. Räumliche Lage und Unterrichtsreihenfolge sind getrennt.
6. Optionaler Stundenpfad.
7. Abschnitte und Schritte sind frei benennbar; Abschnitte dürfen fehlen.
8. Schritt speichert einen lebendigen öffentlichen Viewpoint, keinen statischen Screenshot.
9. Einklappbares Stundenpfad-Panel.
10. Ein-Klick-nahe Speicherung eines Viewpoints als Schritt.
11. Drag-and-drop ändert Reihenfolge, nicht Boardposition.
12. Freie Abweichung und schnelle Rückkehr zum gespeicherten Schritt.
13. Touch und großer Bildschirm sind zentrale Nutzungsszenarien.
14. Die Canvas-Engine bleibt hinter einer Adaptergrenze; Excalidraw ist der lizenzoffene Baseline-Kandidat, tldraw wird vor der Festlegung im selben kleinen Vertikalschnitt als Gegenkandidat geprüft.

### Tafelregie

15. Erweiterter Zwei-Bildschirm-Modus ist primär.
16. Lehrer- und öffentliche Kamera sind unabhängig.
17. Farbig markierter öffentlicher Viewpoint erscheint nur in der Lehreransicht.
18. Öffentliche Kamera bewegt sich nur durch bewusste Aktion.
19. Beim Ziehen bleibt die Tafel ruhig; Übergang erst beim Loslassen.
20. LIVE und GEHALTEN bleiben Kernzustände.
21. Private Lehrernotizen dürfen nur in bereinigten Lehrer-Payloads existieren.
22. Normale Maus bleibt privat.
23. Öffentliches Zeigewerkzeug wird bewusst aktiviert, ist nur im Tafelausschnitt sichtbar und flüchtig.
24. Reconnect darf nie auf einen privaten Draft springen.

**Ergänzung D-123:** Im Live-Canvas-POC ist ein Clip eine begrenzte öffentliche Kamera auf einer bereinigten Szene, keine Vertraulichkeitsgrenze. Nicht aktuell gezeigter, aber grundsätzlich öffentlicher Canvasinhalt darf für flüssige Wechsel im Client vorliegen; private Lehrerdaten, Archivquellen und sicher abgedeckte Pixel dürfen das nicht.

### Scope

25. Der erste technische Build ist ein kleiner Grundlagenprototyp für GUI, Board, Touch, zentrale Materialien und Persistenz.
26. Bildimport und PDF-Import gehören verbindlich in diesen ersten Build.
27. PDF wird als Originalasset gespeichert; einzelne Seiten müssen früh scharf platzier- und getrennt annotierbar sein.
28. Beelink-Speicherung und Wiederöffnung gehören in den ersten Build.
29. Stundenpfad, zwei Kameras und LIVE/GEHALTEN folgen als früher Presenter-Slice, nicht zwingend im ersten technischen Build.
30. Ein eng validierter YouTube-Link-Player und ein stundenlokaler MP4-Player sind als akute Unterrichtsblocker in den ersten Build vorgezogen. Lokale Videos bleiben Originalassets der konkreten Stunde; YouTube bleibt kanonisches Linkmaterial. Videoeditor, Video-Download, weitere Provider, beliebige Web-Embeds, Remotion, OCR, KI und Spracheingabe bleiben außerhalb.
31. Lesson-Pack-Oberfläche, `AI_CONTEXT.md`, Schülerlinks und Remote-Live sind nicht Bestandteil des ersten Builds.
32. Vorlagen-/Bausteinbibliothek und Generalprobenmodus werden nicht früh geplant.
33. Der erste Build muss OneNote noch nicht vollständig ersetzen; die langfristige Ablösung bleibt verbindliches Produktziel.

### Archiv, Betrieb und Datenhoheit

34. Das Teaching Workspace soll den relevanten OneNote-Workflow langfristig einschließlich Fach-/Reihenarchiv, Materialablage, Vorbereitung und Live-Unterricht ablösen.
35. OneNote ist Übergangssystem beziehungsweise mögliche Altdatenquelle, nicht dauerhaft gleichberechtigte kanonische Ablage.
36. Der private Beelink im Zuhause ist Primärspeicher und kanonische Serverablage.
37. Die Trennung von schulischer beziehungsweise arbeitgeberseitiger Infrastruktur ist bewusst gewollt.
38. Browsercache/IndexedDB dient der lokalen Ausfallsicherheit, ersetzt aber nicht die kanonische Beelink-Ablage.
39. OneDrive kann später optional für Export, Backup oder Adapterwege genutzt werden; es ist nicht Quelle der Wahrheit.
40. Die Identität der Lesson- und Assetdaten bleibt durch stabile IDs, relative Referenzen und portable Manifeste unabhängig von einer bestimmten Beelink-Installation.

### Später

41. PDF bleibt Originalasset; Textschicht/OCR sind optional und ersetzen es nicht.
42. SheetifyIMG-Interna sind optionale Erweiterungsdaten.
43. Video ist generisch; kein festes Remotion-Schema ist beschlossen.
44. Ortsbezogene Spracheingabe und optionale Textglättung sind gewünscht.
45. Ortsbezogene Bildgenerierung arbeitet mit Platzhalter und parallelen Hintergrundjobs.
46. KI-/Netzwerkjobs blockieren die manuelle Arbeit nicht.
47. Mensch und spätere KI verwenden dieselbe validierte Command-Schicht.
48. Gesamte digital sichtbare/dokumentierte Stunde und später Reihe sollen maschinenlesbar werden.
49. Nicht dokumentierte mündliche Aussagen gehören nicht automatisch zum Kontext.
50. Lokale Tafel, temporäre Remote-Live-Sitzung und dauerhafte Publication sind getrennt.
51. Remote-Live später accountlos und read-only zuerst.
52. Dauerhafte Einzelstunden-/Reihenlinks später accountlos und read-only zuerst.
53. Spätere Schülerarbeitskopien sind isoliert und reduziert.

### Tafelregie – frühe Detailentscheidungen

54. `BEREIT` ist kein dritter Zustand; `Änderungen bereit` ist ein abgeleiteter Hinweis innerhalb von `GEHALTEN`.
55. Im ersten Presenter-Slice ist das Smartboard während `GEHALTEN` zunächst read-only; vorbereitete Änderungen erfolgen am Lehrergerät.
56. Gepufferte Smartboard-Eingaben während `GEHALTEN` sind eine mögliche spätere Erweiterung und müssen erst nach dem Grundablauf prototypisch geprüft werden.
57. Vorbereitung läuft ohne öffentliche Tafelansicht; in der Durchführung sind private Lehreransicht am Mac und lokale Tafelansicht auf dem erweiterten Bildschirm getrennte Clients.
58. Die lokale Tafel ist eine öffentliche Raumansicht und keine persönliche Schüleransicht. Sie besitzt eine eigene, standardmäßig verborgene Werkzeug-Shell.
59. Lehrer- und Tafelclient besitzen voneinander unabhängige Werkzeug-, Auswahl- und Toolbarzustände.
60. Der normale Mac-Cursor bleibt privat. Bei bewusster öffentlicher Steuerung erscheint ein flüchtiger öffentlicher Zeiger, ohne die Mac-Oberfläche zu spiegeln.
61. Öffentlicher Zeiger und freigegebene Tafelwerkzeugleiste können gleichzeitig sichtbar sein.
62. Ein bewusster Klick während öffentlicher Steuerung kann einen kurzen kreisförmigen Aufmerksamkeitsimpuls an der öffentlichen Zeigerposition auslösen; der Effekt ist flüchtig und wird nicht gespeichert.
63. Die Tafelwerkzeugleiste folgt einer direkten Drag-Geste und rastet beim Loslassen in eine grobe Randposition oben, unten, links oder rechts ein.

### Semantik, Spiegel und Migration

64. Unterrichtsinhalt beziehungsweise Activities, Unterrichtsfluss und Darstellungen bleiben unterscheidbare Ebenen.
65. Das freie Board bleibt zentral, ist aber eine View und nicht die alleinige semantische Beschreibung einer Lesson.
66. Semantische Angaben wie Zweck, Arbeitsauftrag oder Phase bleiben optional und erzeugen keine verpflichtende Planungsmaske.
67. Der lokale Reihenspiegel dient als inkrementelle Übergangs- und Rekonstruktionsschicht aus OneNote.
68. Quellenbeleg, semantischer Spiegel und portabler Materialbestand werden getrennt dokumentiert.
69. Materialverfügbarkeit unterscheidet mindestens lokal, externer Link, nur OneNote, nur Quellenexport, fehlend und unbekannt.
70. Eine vorhandene reale Reihe dient als frühes Import- und Vertikaltestkorpus.
71. OneNote-Migration erfolgt nach Bedarf; eine vollständige Big-Bang-Migration ist kein Ziel.

### Spätere KI-Materialerstellung

72. `Bild erzeugen` ist als feste spätere Vorbereitungsfunktion für eingeloggte Lehrkräfte bestätigt, bleibt aber außerhalb von Prototyp 0.1 bis 0.3 und der frühen Presenter-Slices.
73. Die Bildgenerierung ist direkt und kompakt erreichbar; ein generischer KI-Chat ist nicht ihre Hauptoberfläche.
74. Mehrere Generierungen und Varianten laufen als nicht blockierende Jobs. Fertige Ergebnisse erscheinen in einer Ergebnis- beziehungsweise Materialablage und werden erst bei bewusster Übernahme zu Lesson-Assets.
75. Ergebnisse können einzeln oder mehrfach per Drag-and-drop auf die Arbeitsfläche gezogen werden; eine ortsgebundene Platzhaltervariante bleibt als zweiter Einstieg möglich.
76. Kontextuelle Aktionen wie `Illustration vorschlagen` verwenden nur die aktuelle Auswahl und ausdrücklich freigegebene Assets. Sie zeigen die Grundlage knapp an und starten keine kostenpflichtige Generierung ohne Bestätigung.
77. Generierte Originale, aufbereitete Renditions, Jobstatus und Provenienz bleiben getrennte Verantwortlichkeiten. Die Canvas-Engine verwaltet weder Provideraufrufe noch Jobwarteschlangen.
78. OpenAI Responses API mit Bildgenerierung beziehungsweise eine Image-Generation-API ist ein plausibler Provideradapter, aber keine Bindung des kanonischen Lesson- oder Assetformats.

### Spätere hybride Unterrichtsinteraktion

79. Derselbe Teilnahmeclient und Presentation-State unterstützt Personen im Klassenraum und außerhalb; der Aufenthaltsort erzeugt keine getrennte Produktoberfläche.
80. Der Beitritt erfolgt später über temporären Link, QR-Code oder Teilnahmecode. Accountlose Teilnehmer geben einen Anzeigenamen ein; dieser ist eine Sitzungsbezeichnung und keine geprüfte Identität.
81. Alle persönlichen Teilnehmergeräte starten im Zustand `Folgen`. Eine Person kann `Mitarbeit anfragen`, erhält dadurch aber noch keine Bearbeitungsrechte.
82. Ausschließlich die Lehrkraft kann eine Anfrage freigeben, ablehnen oder eine laufende Bearbeitung mit `Beenden` entziehen.
83. Der erste interaktive Teilnahme-Slice besitzt genau einen aktiven Werkzeughalter. Freie gleichzeitige Mehrbenutzerbearbeitung und frühes CRDT sind nicht Teil dieser Funktion.
84. Lehreransicht, lokale Tafel und Teilnehmerclients zeigen knapp Person und aktives Werkzeug, beispielsweise `Lisa · Stift`; eine Übergabe wird auf allen öffentlichen Clients sichtbar.
85. Persönliche Teilnehmergeräte können die Kontrolle nicht selbstständig übernehmen. Die getrennte Interaktionsfreigabe der physischen Tafel bleibt bestehen.
86. Werkzeugfreigabe, aktueller Halter, Bearbeitungsumfang und Ablauf sind serverseitig validierter Sessionzustand. Bei `GEHALTEN`, Inaktivität, Disconnect, Entzug oder Sessionende werden Teilnehmer-Eingaben ausgesetzt beziehungsweise beendet.
87. Teilnehmerbeiträge gehören zunächst zum LessonRun beziehungsweise Session-Layer und überschreiben die wiederverwendbare LessonDefinition nicht automatisch.
88. Der allgemeine Teilnahmecode identifiziert nur die Session. Ein optionaler persönlicher, zeitlich begrenzter Wiederaufnahmecode darf die pseudonyme Teilnahme auf einem anderen Gerät fortsetzen, ist aber ebenfalls kein Identitätsnachweis.
89. Tabellen als Bild oder PDF können annotiert werden. Semantisches Anklicken und Ausfüllen einzelner Zellen benötigt ein strukturiertes Tabellen-/Activity-Objekt außerhalb der Canvas-Engine.

## 12.2 Starke Empfehlungen

1. Excalidraw als Baseline einbetten und zeitlich begrenzt gegen tldraw prüfen; weder Fork noch Canvas-Neuentwicklung vor einem nachgewiesenen Blocker.
2. Lesson-Dokument als kanonische Einheit.
3. Ein Hauptboard pro Stunde als Standard; mehrere Boards nur bei Bedarf.
4. Commands als dauerhafte Mutationsschnittstelle.
5. `canvas-port` kapselt die tatsächlich benötigten Fähigkeiten; Engine-Adapter kapseln Excalidraw beziehungsweise den tldraw-Gegenspike.
6. Originalassets getrennt von Canvas-Payloads.
7. Sichtbarkeit, Reveal, Publication-Policy und Sensitivität getrennt modellieren.
8. Öffentliche Clients erhalten bereinigte Payloads, keine CSS-versteckten Privatdaten.
9. LessonDefinition und LessonRun trennen.
10. `.lessonpack` später als offener ZIP-Container.
11. Local-first-light ohne frühes CRDT.
12. React/TypeScript und eine browserbasierte installierbare Web-App/PWA als plausible gemeinsame Basis; Desktop-Wrapper erst bei nachgewiesenem Browserblocker.
13. Produktmodell und Speicherbackend durch Adapter trennen.
14. Versioniertes Lesson-Dokument und stabile Assetreferenzen müssen unabhängig von SQLite und Canvas-Engine rekonstruierbar bleiben; SQLite ist nicht der einzige portable Unterrichtsspeicher.
15. PDF.js als Baseline für den PDF-Rendering-Spike, ohne die Viewer-Oberfläche ungeprüft zu übernehmen.
16. Derselbe semantische Presentation-State für lokale und spätere Remote-Clients.
17. Lokaler Same-Origin-Transport und serververmittelter WebSocket-Transport verwenden dasselbe Presentation-Protokoll.
18. Remote-Teilnehmerbeiträge später in isoliertem Session-Layer.
19. Activities und LessonFlow liegen außerhalb des Canvas-Adapters.
20. Mirror- und Materialmanifest-Schemas bleiben zunächst versionierte Importhilfen, keine vorschnell festgelegte Produktionsdatenbank.
21. Eine führende Runtime-/Schemaquelle erzeugt nach Möglichkeit Typen und portable Validierung; parallele manuell gepflegte Schemawahrheiten werden vermieden.
22. Beiträge aus der lokalen Tafelinteraktion zunächst einem LessonRun beziehungsweise Session-Layer zuordnen und nicht stillschweigend in die wiederverwendbare LessonDefinition zurückschreiben.
23. Die Tafelwerkzeugleiste während des Ziehens direkt der Eingabe folgen lassen und beim Loslassen an groben Randzonen oben, unten, links oder rechts einrasten. Exakte Schwellen, Abstände und Animation erst am Legamaster festlegen.

## 12.3 Verbindlich herabgestuft oder entfernt

Keine bestätigten Leitplanken mehr:

- PDF-/Video-first als gesamte Produktlogik; einfacher Bild-/PDF-Import bleibt dennoch verbindlicher Bestandteil des ersten technischen Builds;
- verpflichtende Phase/Frame-Struktur;
- feste pädagogische Phasen;
- pixelgenaues „Tafel folgt meiner Lehrerkamera“;
- SheetifyIMG-ImageSpec/QC als Pflichtdaten;
- festes Remotion-Packformat;
- `AI_CONTEXT.md` als frühe Pflichtdatei;
- Vorlagen-/Bausteinbibliothek als frühe Strategie;
- eigener Generalprobenmodus;
- automatische Phasen-KI;
- gepufferte Smartboard-Eingaben während `GEHALTEN` als bereits feststehende frühe Produktentscheidung;
- Spotlight-/Dimming-System über den Pointer hinaus;
- mobile Schnellerfassung, ausführliches Post-Run-Dashboard oder lückenloses Replay;
- frühes Plugin-System, Canvas-Neuentwicklung oder eigenes Videokonferenzsystem.

## 12.4 Offene Produktfragen – jetzt relevant

### Q1: Abschnittsklick

- springt zum ersten Schritt; oder
- Abschnitt kann optional eigenen Viewpoint besitzen.

### Q2: Sichtbarkeit in LIVE

Welche Dokumentänderungen werden in LIVE automatisch sichtbar, welche benötigen zusätzlich eine Freigabe?

### Q3: Rückmeldung für gepufferte Smartboard-Eingaben

Soll es nach dem ersten Presenter-Slice überhaupt gepufferte Smartboard-Eingaben während `GEHALTEN` geben? Falls ja: Welche diskreten Aktionen sind ohne sichtbare Rückmeldung verständlich? Der frühe Slice startet bewusst mit read-only Smartboard im gehaltenen Zustand.

### Q4: Öffentliche Pfadinformation

Sollen Abschnitts-/Schrittnamen, Farben oder Fortschritt auf der Schüleransicht sichtbar sein?

### Q5: Buttonbegriffe

- `Als Schritt speichern`;
- `Ansicht merken`;
- `Tafelausschnitt speichern`.

Und für Hold/Release: `Tafel halten`, `Anzeige halten`, `Jetzt zeigen`, `Zeigen und live`.

### Q6: Kameraübergang

Animation, Dauer, Überblendung und Schutz vor sichtbaren privaten Inseln müssen prototypisch entschieden werden.

### Q7: Ein-Bildschirm-Fallback

Welche reduzierte UX gilt ohne erweiterten Bildschirm?

### Q8: Canvas-Engine

Besteht Excalidraw den identischen Unterrichts- und Hardware-Slice oder reduziert tldraw die notwendige Sonderlogik so deutlich, dass Lizenz- und Produktabhängigkeit gerechtfertigt sind? Bewertet werden Touch/Stift, Bild/PDF, Annotation, stabile Activity-/Assetreferenzen, Persistenz/Migration, Public Projection, Viewports, Performance, Portabilität und Integrationsaufwand.

### Q9: Lokale Schreib- und Konfliktregel

Wie wird eine aktive Schreibsession pro Lesson technisch erzwungen oder sichtbar gemacht? Welche UX gilt bei einer veralteten Basisrevision, einem zweiten Lehrerfenster oder einer lange offline bearbeiteten Stunde?

Für den akuten lokalen Einbenutzerslice beantwortet D-056 den Datensicherheitsanteil: Boardwrites verwenden eine Basisrevision und veraltete Schreiber werden abgewiesen. Die spätere Konflikt-UX, Zusammenführung lange offline bearbeiteter Stände und ein echter Mehrbenutzervertrag bleiben offen.

### Q10: Öffentliche Steuerung vom Mac

Wird `Tafel steuern` bewusst als Werkzeug aktiviert oder während einer öffentlichen Objektmanipulation temporär automatisch eingeschaltet? Der normale Mac-Cursor bleibt in beiden Fällen privat.

### Q11: Position der Tafelwerkzeugleiste

Welche Einrastschwellen, Abstände, Orientierungswechsel und Animation fühlen sich am realen Legamaster direkt, ruhig und angenehm an? Die groben Dockingzonen oben, unten, links und rechts sind bestätigt; konkrete Bewegungsparameter nicht.

### Q12: Öffentlicher Aufmerksamkeitsimpuls

Welche Dauer, Größe, Farbe und Deckkraft der kreisförmigen Wellen lenkt den Blick zuverlässig, ohne zu blinken, Inhalt zu verdecken oder bei häufiger Nutzung unruhig zu wirken?

### Q13: Bildgenerierung und Ergebnisablage

Wie kompakt kann `Bild erzeugen` in der Vorbereitungs-Shell bleiben? Zu testen sind Anzahl gleichzeitig sichtbarer Jobs, Variantenwahl, Lebensdauer nicht übernommener Ergebnisse, transparentes Freistellen beziehungsweise Hintergrundentfernung und die Schwelle, ab der ein Ergebnis als dauerhaftes Asset gespeichert wird.

### Q14: Kontext, Kosten und Freigabe

Welche ausgewählten Texte, Boardausschnitte oder Assets sind für `Illustration vorschlagen` wirklich nötig? Vor der Umsetzung müssen verständliche Kontextvorschau, Kosten-/Kontingentregel, Datenschutz, Inhaltsprüfung und Fehlerbehandlung festgelegt werden.

### Q15: Werkzeugübergabe in Hybrid-Sessions

Teilnehmer müssen die Bearbeitung anfragen; die Lehrkraft entscheidet. Offen bleiben Darstellung und Reihenfolge mehrerer Anfragen, Dauer eines inaktiven Werkzeug-Lease und die notwendige Rückmeldung beim Beenden oder Wechsel.

### Q16: Remote-Undo und Beitragsübernahme

Darf ein Teilnehmer nur eigene Aktionen seit der letzten Werkzeugübernahme rückgängig machen? Welche Beiträge bleiben ausschließlich im LessonRun und welche kann die Lehrkraft später bewusst in die wiederverwendbare Vorbereitung übernehmen?

### Q17: Teilnahmecode und Gerätewechsel

Reicht pro Unterrichtssession ein allgemeiner QR-/Teilnahmecode plus persönlicher Wiederaufnahmecode? Welche Laufzeit, Fehlversuche und Widerrufsregeln verhindern Missbrauch, ohne für Schülerkonten eine verfrühte Benutzerverwaltung einzuführen?

### Q18: Strukturierte Tabelleninteraktion

Welche reale Unterrichtsaufgabe rechtfertigt ein semantisches Tabellen-/Feldobjekt gegenüber einfacher Stift- und Textannotation? Zu prüfen sind Zellfokus, Tablet-Tastatur, Handschrift, gleichzeitige öffentliche Darstellung, Korrektur und Übernahme der Antwort in den LessonRun.

## 12.5 Offene Fragen – später

- Standard-Sichtbarkeit neuer Sprachnotizen;
- Look/Shortcut des Zeigewerkzeugs;
- Tiefe von LessonRun und On-Air-Ereignissen;
- PDF-Seitenmodell und Export;
- Videozustand bei LIVE/GEHALTEN;
- Lesson-Pack-Selbstständigkeit und Größenlimits;
- Remote-Moderation, Teilnehmerzahl und Session-Persistenz;
- Publication-PIN, Ablaufdatum und Downloads;
- anonyme Persistenz für Schülerinstanzen;
- Datenschutz-/Aufbewahrungsregeln;
- Verschlüsselungs-, Backup- und organisatorische Freigaberegeln für personenbezogene Daten auf dem privaten Beelink;
- genaue Aufteilung zwischen versioniertem Lesson-Dokument, SQLite-Index, Revisionen und Asset-Dateispeicher;
- möglicher Desktop-Wrapper, falls echte Browser-/Hardwaretests ihn begründen;
- konkrete KI-Provider, Kosten und Memory.

## 12.6 Entscheidungsregel

Offene Fragen werden bevorzugt durch kleine Tests am realen Unterrichtsablauf gelöst. Keine Option wird nur deshalb festgeschrieben, weil sie technisch elegant wirkt.
