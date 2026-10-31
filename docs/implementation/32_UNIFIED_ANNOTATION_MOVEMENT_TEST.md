# Einheitliche Annotationbewegung – D-264

## Auftrag und Produktlogik

15. Oktober 2026: Text ohne Formcontainer, Stift und Marker im Lehrer- und Room Canvas einheitlich auf einem Blatt bewegen, bewusst herauslösen, zurücklegen und auf ein anderes Blatt übertragen. Das Blatt nimmt gebundene Inhalte mit; bloßes Unterschieben erzeugt keine Bindung. Der sichtbare Mittelpunkt entscheidet beim Abschluss. Zeiger und Pfeiltasten verwenden dieselbe Regel. Gewöhnliche Mehrfachgruppen und Formannotation bleiben erhalten.

## Technischer Pfad

- `annotation-move.ts` / `image-annotation-selection.ts`: gemeinsame Eignung, sichtbare HTML-Scrolltransformation und Bindungsabschluss; direkte Einzelauswahl ohne Blattgruppenrahmen auch für Ink.
- `CanvasSurface.tsx`: freies Ink erreicht denselben unabhängigen Drag; Pfeiltasten wenden dieselbe Geometrie/Zuordnung an. HTML ergänzt bewegte Ink-Annotationen schon bei Kantenüberlappung.
- `eraser-policy.ts` / `image-annotation-groups.ts`: reine kanonische und Engine-Lesesichten; native Toolwechsel erhalten den bestehenden Adapter, Room-Mutationen denselben fachlichen Versionsstand.
- `room-canvas-host.ts` / `room-object-edit.ts`: Generation/Revision/Objektversion und sichtbare lokale HTML-Scrollquellen prüfen, kanonisch bewegen/radieren/zurücknehmen, erst beim Enginecommit temporär adaptieren. Echte Sperren bleiben wirksam; keine Zuweisung auf unsichtbare Materialziele.
- `public-projection.ts` / `interactive-html-live.ts`: auch HTML-Ink/-Text besitzt einen opaken lokalen Room-Auswahlbezug und minimale abgeleitete Rendergeometrie. Diese lokalen Seiteninformationen werden nicht über Remote Canvas übertragen.
- `room-object-preview.ts` / `room-main.tsx` / `RoomObjectInput.tsx` / `LiveViewerCanvas.tsx`: flüchtige Vorschau mit vorhandener nativer/geclippter HTML-Darstellung; gemeinsamer Commit bei Pfeiltastenfreigabe, Aufräumen bei Bestätigung/Abbruch/Ablehnung. Ein kosmetischer Framecommit darf die aktive Geste nicht aushängen. Null-Vorschau löst kein erneutes Rendern aus.
- `canvas-persistence.ts`: Stunden-Datei/Cache/Outbox bleiben frei von temporären Radierergruppen und Sperren. Kein neues Schema oder automatischer Reparaturpfad für Altstände.

## Automatische Prüfung

336 App-/Archivtests und 106 Live-/Room-Tests einschließlich neuem echten Room-Host-Befehlstest bestanden. Beide Typprüfungen und Desktopbuild bestanden. Die vorher nur für Text geltende Drop-/Gruppenrahmenerwartung wurde entsprechend dem ausdrücklich erweiterten Produktvertrag geändert; keine Prüfung abgeschwächt, um einen Fehler zu verdecken.

Regressionen: alle drei Objektarten innen/außen/zurück/anderes Blatt; erhaltene Formgruppen; laufende Randprojektion ohne neue Bindung; unterschiedliche Scrollstände und gedrehte sichtbare Geometrie; horizontale/vertikale Stiftzüge; echte Sperren und begrenzte Scrollbefehle; kanonische Blattbewegung bei aktivem Lehrer-Radierer; gemeinsamer Positions-/Bindungs-Undo; stale Befehle unverändert abweisen; bestehende Vorschau beim Radieren wirklich entfernen; kein Duplikat oder Mutation der bestätigten Szene durch Vorschau.

## Bedienprüfung

Eigene native ARM64-App-ID `app.jujies.tafelraum.qa-marker-recovery`, Port 49524, neutrales Archiv mit zwei HTML-Blättern und je einer Text-/Marker-/Stiftannotation. Produktives Profil unverändert.

- Lehrer: alle drei vom Blatt B/A in den freien Zwischenraum und auf das jeweils andere Blatt gezogen. Einzelrahmen bleibt am Objekt. Marker per Shift+Pfeil über die Kante gelöst und wieder gebunden (`native-teacher-detach.json`, `native-keyboard-out.json`).
- Room: Text, Marker und Stift einzeln von B gelöst und auf A gelegt; Marker auch per Shift+Pfeil verschoben. Lehrer-Radierer war während dieser nativen Room-Prüfung aktiv.
- Room bewegt A über den Blattgrund: alle drei gebundenen Objekte bewegen sich mit. Room-Undo/Redo stellt den gesamten Verbund wieder her (`native-room-bundle.png/.json`).
- Room radiert gezielt Marker; sein Undo stellt ihn auf dem Blatt wieder her (`native-room-restored.png`). Datei während aktivem Lehrer-Radierer enthält nur echte entsperrte Bindungen, keine Adapterfelder.
- Native Version 0.1.56 dokumentiert (`native-version.png`). Getrennte Browser-Gegenprüfung über Port 5192 bestätigt dieselben drei Hin-/Rück-/Wechselgesten, Marker-Pfeiltasten über die Kante, Blattverbund bei Lehrer-Radierer, Room-Radieren und Undo/Redo (`browser-room-*.json/.png`).

Bei der Prüfung wurde ein potenziell rekursiver Aktualisierungspfad beim Aushängen der Eingabeschicht erkannt. Null-Vorschau wurde idempotent und die Eingabeschicht bleibt während kosmetischer nativer Commits bestehen. Anschließend beide nativen und Browserflüsse erneut erfolgreich. Die native UI-Automation erreichte das neu geöffnete Room-Fenster zunächst nicht zuverlässig; explizites Aktivieren des Testbundles über Finder erlaubte die tatsächliche native Bedienprüfung. Kein Produktions-Fenster/Archiv dafür verändert.

## Release und Grenzen

0.1.56 wurde am 15. Oktober 2026 signiert und atomar veröffentlicht. Finale Paket-/Signatur-/Datenerhaltsprüfung erfolgreich; Details in Protokoll 09. Die 207 Ressourcen der abschließenden nativen QA sind bytegleich zum portablen Paket. Alle sechs synthetischen Bestandsdateien bleiben von 0.1.55 auf 0.1.56 bytegleich. Keine automatische Installation in die produktive App. Realer Touch/Stift und Zweitdisplaybetrieb bleiben Hardwareabnahme; Drag-Zwischengeometrie und Scrollrotation sind zusätzlich geometrisch geprüft. Bestandsreparatur der historischen 17 Drug-harm-Marker war bereits separat abgeschlossen (Protokoll 31) und ist keine Update-Migration.


### Finales Paket

Die finale native QA wurde nach dem Build erneut mit den 207 bytegleichen Paketressourcen durchgeführt. Reload, Pan und Canvaszoom 90 → 80 %, Markerwechsel und Lehrer-Undo/Redo erfolgreich. Room-Bindungswechsel aller drei Arten erneut bestätigt; danach B mit gebundenem Text/Stift bei aktivem Lehrer-Radierer bewegt, Room-Undo/Redo sowie Stift-Radieren/Undo geprüft. Beim schnellen Wechsel zwischen nahe liegenden Objekten wurde einmal der sichtbare Drehgriff getroffen; vor der separaten Textprobe explizit abgewählt. Die Textprobe wurde danach sichtbar bestätigt, der unbeabsichtigte Drehvorgang nicht als Textbewegung gewertet. Native Schlussdatei: fünf lebende entsperrte Objekte, je eine Materialgruppe, keine Radierer-Hilfsfelder. Finale Belege unter `output/release-0.1.56/`.

### Nachtrag 16. Oktober 2026

Die Bewegungsabnahme deckte Text-Griffgesten nicht ab. Nutzerbefund und Korrektur einschließlich gespeicherter nativer Größenänderungen sind unter `33_TEXT_RESIZE_HANDLES_TEST.md` dokumentiert; als 0.1.57 veröffentlicht. Die D-264-Bindungsregeln bleiben unverändert.
