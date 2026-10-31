# UI Brief: Interaktives HTML im Live Canvas

**Stand:** 5. September 2026  
**Status:** D-124/D-128 umgesetzt; reale iPad-Abnahme offen

## Aufgabe

Die Lehrkraft bedient ein interaktives HTML-Material auf ihrer Fläche. Alle Teilnehmer sehen denselben fachlichen Zustand unmittelbar in einer eigenen, responsiven Materialinstanz. Pro Material entscheidet die Lehrkraft, ob Teilnehmer nur zusehen oder selbst eingreifen dürfen.

## Lehreroberfläche

- Das ausgewählte HTML-Material erhält in seiner vorhandenen äußeren Aktionsgruppe eine vierte Aktion mit `Lock` beziehungsweise `LockOpen`.
- Standard ist **gesperrt**. Tooltip und zugänglicher Name lauten `Für Schüler freigeben` beziehungsweise `Für Schüler sperren`.
- Die offene Sperre verwendet die vorhandene Akzentfläche. Es entsteht kein zusätzliches Live-Menü und kein dauerhafter Hinweis auf der Arbeitsfläche.
- Die Aktion ändert nur die flüchtige Live-Berechtigung. Canvasgeometrie, lokaler Aufgabenstand und Archivpersistenz bleiben davon unberührt.

## Teilnehmeroberfläche

- Das Material erscheint an derselben Canvasposition und skaliert mit der gemeinsamen oder begrenzten Kamera.
- Gesperrt liegt eine transparente Eingabesperre über dem Material; oben rechts zeigt ein ruhiges, kontrastreiches Badge `Nur ansehen` mit Schloss. Der fachliche Inhalt bleibt vollständig sichtbar.
- Freigegeben verschwindet die Sperre. Touch, Tipp und Drag gehen direkt an das Material. Eine bestätigte Änderung wird über den Host an alle Instanzen verteilt.
- Oben links am Material liegt eine ruhige Zoomgruppe mit `−`, Prozentwert und `+`. Jedes Ziel ist 48 px groß; der Prozentwert setzt direkt auf 100 % zurück. Der Bereich reicht von 50 bis 200 % in 10-%-Schritten.
- Unterhalb von 420 px sichtbarer Materialbreite reduziert sich die Gruppe auf eine 68 × 48 px große Prozenttaste unter dem Material. Ein Tipp öffnet die vollständige Gruppe; der Prozentwert setzt zurück und schließt sie wieder. Der Sperrstatus bleibt getrennt oberhalb des Materials.
- Dieser Inhaltszoom gehört dem jeweiligen Tablet und bleibt auch im gesperrten Zustand bedienbar. Er verändert weder Lehrer- noch Peeransicht, fachlichen Zustand oder Berechtigung. Canvas-Pinch bleibt die räumliche Navigation; es gibt keine zweite unsichtbare Pinch-Geste im HTML.
- Reconnect und spätes Beitreten beginnen mit dem aktuellen Hostzustand. Ein lokal zufällig erzeugter Startzustand darf den Hostzustand nie überschreiben.

## Zustände und Rechte

| Zustand | Anzeige | Eingabe |
| --- | --- | --- |
| Gesperrt | Material plus `Nur ansehen` | blockiert |
| Für alle frei | Material ohne Badge | alle verbundenen Teilnehmer |
| Einzelne Teilnehmer | spätere UI-Erweiterung | Protokollmodell bereits vorbereitet |

Die spätere Einzelzuweisung verwendet dieselbe Zugriffsregel mit Teilnehmer-IDs. Sie benötigt eine eigene geprüfte Interaktion im Teilnehmerbereich; die jetzige Oberfläche bietet bewusst nur gesperrt oder für alle frei.

## Bewegung und Qualität

HTML wird nicht mehr als Bildfolge gerastert. Paketdateien werden einmal je Live-Generation geladen; Interaktionen übertragen nur kleine, validierte Zustände. Übergänge stammen aus dem Material selbst. Kein zusätzlicher Folienwechsel, Ladebild oder spielerischer Effekt.

## Abnahme

- Lehreraktion ist außerhalb des Materials erreichbar und auf Touch mindestens 48 px groß.
- Gesperrtes iPad kann keine Materialaktion auslösen; freigegebenes iPad kann Tipp und Drag auslösen.
- Lehreraktion erscheint auf iPad und Schülervorschau; iPad-Aktion erscheint beim Lehrer und weiteren Teilnehmern.
- Kamera, Clipbewegung, Reconnect und spätes Beitreten behalten Geometrie und Zustand.
- Inhaltszoom lässt sich gesperrt und freigegeben bedienen, erreicht 200 %, setzt auf 100 % zurück und hält alle drei Touchziele bei mindestens 44 × 44 px. Eingaben treffen bei 200 % weiterhin das richtige HTML-Ziel.
- Prüfung in Desktop-Chromium und iPad Safari; reduzierter Bewegungsmodus verändert keine Rechte.
