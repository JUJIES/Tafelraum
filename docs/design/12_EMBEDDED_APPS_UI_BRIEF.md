# UI Brief – eingebettete Unterrichts-Apps

**Stand:** 28. Oktober 2026
**Status:** verbindlich für den Lerndeck-Pilot in Surface Lab

## Kontext

- **Oberfläche/Zustand:** App-Auswahl in der dockbaren Werkzeugleiste und eine platzierte fremde App auf der Lehrerfläche
- **Zielnutzer:** Lehrkraft in Vorbereitung und Unterricht
- **Nutzungssituation:** Die Lehrkraft möchte eine von Tafelraum ausdrücklich freigegebene Web-App verwenden, ohne das Tafelraum-Fenster zu verlassen.
- **Eine primäre Handlung:** `Lerndeck` auswählen und als bedienbare App auf der aktuellen Canvasfläche platzieren.
- **Eine zu prüfende Designfrage:** Ist eine globale App klar von stundenbezogenem Material getrennt, obwohl ihre platzierte Oberfläche dieselbe Canvasgeometrie verwendet?

## Scope

### Muss sichtbar oder erreichbar sein

- `Apps` als eigene Aktion in der bestehenden Aktionsgruppe der Werkzeugleiste;
- ein kompaktes, an der Aktion verankertes Popover mit den ausschließlich durch die Entwicklung registrierten Apps;
- im Pilot genau eine Auswahl `Lerndeck` mit dem originalen Lerndeck-Icon vor dem Namen;
- Klick auf `Lerndeck` platziert eine responsive App-Instanz mittig im sichtbaren Canvas;
- rahmenloser Appinhalt mit derselben abgerundeten Kante wie lokales HTML; keine dauerhafte Titelleiste;
- nur bei Auswahl die vorhandene Browseröffnung; Verschieben am neutralen Hintergrund oder ausgewählten Außenrahmen, keine externe Inhaltszoomleiste;
- neutralen Apphintergrund mit Auswahl antippen und ziehen wie lokales HTML; Controls, Textauswahl, Scrollleisten und Lernkartengesten bleiben bei Lerndeck; vollständige Übergabe an Tafelraum bei Stift, Marker, Radierer und Text;
- dieselben passenden äußeren Materialaktionen wie bei interaktivem HTML: zentrieren, fokussieren und abdecken;
- normaler Canvas-Verlauf für Platzierung, Geometrie, Löschen und Abdeckung;
- Lerndecks eigener Login und eigener dauerhafter Sitzungszustand innerhalb der App.

### Darf nicht erscheinen

- freie URL-Eingabe oder Installation durch Lehrkräfte;
- Bezeichnung `Material`, `Connector`, `Plugin` oder `Erweiterung`;
- Druckaktion, Tafelraum-Speicheraktion oder Zurücksetzen des fremden App-Zustands;
- Passwort-, Token- oder Kontospeicherung im Tafelraum-Archiv, Canvasobjekt, Local Storage oder IndexedDB;
- App-Inhalt im Remote Canvas oder auf Teilnehmergeräten; der ausdrücklich beauftragte lokale Room bleibt davon getrennt;
- allgemeiner Websiteimport oder ein universeller Iframe-Renderer.

## Exakter UI-Text

- `Apps`
- `Lerndeck`
- nur als zugänglicher Name der App-Auswahl: `Lerndeck auf der Fläche öffnen`

Die bestehenden zustandsabhängigen Materialaktionen behalten ihre vorhandenen zugänglichen Namen für Zentrieren, Fokus und Abdeckung.

## Inhalt und Referenzen

- **Reale Inhalte/Assets:** `https://lerndeck.jujies.app/teacher?embed=tafelraum` und das vorhandene Lerndeck-App-Icon
- **Visuelle Referenz:** bestehende einzelne Materialkante und äußere Auswahlaktionen des lokalen interaktiven HTML
- **Relevanter Produktflow:** `Apps → Lerndeck → anmelden → Lernsets sehen → Stunde wechseln → Lerndeck erneut einfügen → Sitzung bleibt erhalten`

## Vergleich und Invarianten

- **Gezielt veränderte Variable:** neue globale App-Quelle und fremde authentifizierte Oberfläche
- **Muss zwischen Varianten identisch bleiben:** Canvasgeometrie, Werkzeugwechsel, Fokus, Abdeckung, Hell/Dunkel, Undo/Redo und Toolbar-Docking; Bewegung verändert weder innere Layoutgröße noch Inhaltszoom
- **Nicht durch Desktop oder Mockup validierbar:** Touch-/Stiftwirkung, Passwortmanager im Iframe und Verhalten auf späterer Zielhardware

## Abnahme

- `Apps` ist ohne Erklärung von `Material hinzufügen` unterscheidbar.
- Nur die registrierte App ist auswählbar; eine beliebige URL kann nicht eingebettet werden.
- Nach einmaliger Lerndeck-Anmeldung öffnet eine neue Instanz im selben Browserprofil ohne erneute Anmeldung.
- Die App bleibt innerhalb einer einzelnen Materialkante scharf, responsiv und direkt bedienbar.
- Eine niedrigere App-Geometrie zeigt weniger Inhalt und lässt ihn scrollen, statt die innere Oberfläche automatisch zu verkleinern; alte gespeicherte Inhaltszoomwerte bleiben für Darstellung und Reload lesbar.
- Zeichenwerkzeuge schreiben über der App; Auswahlrahmen und äußere Aktionen bleiben erreichbar.
- Blockierte Quelle, Netzfehler und abgelaufene Sitzung werden nicht als funktionierende App vorgetäuscht.


## Bestandsgeometrie und Betrieb (28.10.2026)

Die bestehende HTML-Geometrienormalisierung entfernt auch bei alten Appträgern
einmalig die frühere 48-Pixel-Titelzone. Sichtbarer Inhaltsbeginn, Annotationen
und partielle Abdeckungen behalten ihre Szenenposition; Inhaltszoom bleibt
erhalten. Neue Apps verwenden direkt Inhaltsgeometrie. Die vorhandene
`interactiveHtmlFrameLayout: content`-Markierung verhindert wiederholte Anpassung.
Lade-/Verbindungsfehler erscheinen nur während dieses Zustands am Inhalt.

Lerndecks explizite `frame-ancestors`-Betriebskonfiguration muss den nativen
Ursprung `http://127.0.0.1:49317` zusätzlich zu den bisherigen Entwicklungs-
Ursprüngen erlauben. Keine Wildcard; normale Lehrerseiten bleiben gesperrt.


## Lokale Room-Spiegelung – Auftrag28.10.2026

Gewünschter Flow: Canvas in Room zeigen; Set am Mac wählen; in derselben eingebetteten
Instanz Lernen öffnen; Room folgt Menü, Editor, Eingaben und Lernansicht. Canvas-
ansicht, Ausschnittclip und App-Materialclip verwenden dieselbe bestehende Geometrie/
Clipfolge. `Material zeigen` isoliert Lerndeck über die vorhandene Room-Aktion.
Vorne bleibt die App lesend; Bedienung und einzige Anmeldung bleiben am Mac.

Technischer Vertrag: ausschließlich registriertes Lerndeck liefert auf explizite
flüchtige Room-Anfrage eine begrenzte visuelle DOM-Ereignisfolge. rrweb2.2.0 ist
beidseitig gepinnt; statt handgeschriebener paralleler Lerndeck-Zustandsmodelle
rekonstruiert dessen skriptgesperrter Replayer die Darstellung. Kein Session-Replay-
Cloudanbieter, kein HTTP-Upload, kein Frameinhalt im Archiv oder Remote-Wire.
Passwort-/Hiddenfelder werden bereits beim Anbieter blockiert/maskiert. Cookies
und Sitzungstokens verlassen Lerndeck nicht. Quelle/Origin/App-ID plus flüchtige
Instanzcapability, Sequenz und Mengenbudgets sind verbindlich. Receiver-Leases
enden nach Schließen/Roomende; Navigation fordert einen neuen vollständigen Stand.
Die Room-Kopie darf weder Anbieter-JavaScript noch Formulare ausführen.
Bilder behalten ihre vorhandenen Anbieteradressen; keine Base64-Kopie aller
sichtbaren/versteckten Vorschaubilder im Ereignispaket. Der lokale Browser lädt
diese Bilder im bestehenden Kontext, ohne einen zweiten App-Login.

Abnahme: echte freie Auswahl/Bewegung samt Undo; Eingabefelder bleiben bedienbar;
Menü→Set→Lernen im bestehenden Frame; Karten-/Eingabewerte und Scrollposition;
beide Cliparten; später Receiver/Neustart/Roomende; Passwortprobe, keine Streams
im gespeicherten Träger oder Remote-Payload. Großes referenziertes Bild über2MiB muss bei unveränderter Paketquote sichtbar
bleiben (Chrome und WebKit). Touch-/native Abnahme gesondert.

### Auswahlrahmen statt Verschiebegriff (D-297)

Registrierte Apps nutzen dieselben äußeren Auswahlrahmen-Trefferflächen wie HTML.
Der separate Griff samt Appicon entfällt; Inhaltszoom und Browseröffnung bleiben.
Neutrale Hintergrundgesten kommen weiterhin ausschließlich aus der expliziten
Anbieterbridge, Controls/Text und Lernkartengesten behalten dort Vorrang.

## D-298 – Inhaltszoom gehört bei Bedarf ins Embed

28.10.2026, ausdrücklicher Folgeauftrag: Die äußeren Minus/Prozent/Plus-Controls
entfallen bei lokalem HTML, registrierten Apps und Remote-HTML gleichermaßen.
Tafelraum bietet dafür auch keine App-Zoomkürzel oder schreibende
app-content-zoom-Brücke mehr. Der deutsche Browser-Plus-Tastenschutz gegen die
Excalidraw-Ebenenaktion bleibt; er ist keine Inhaltszoomfunktion.

Neue Platzierungen verwenden weiterhin ihre normale responsive Layoutfläche mit
Inhaltsskala1. Alte interactiveHtmlContentZoom/embeddedAppContentZoom-Werte bleiben
rein lesbare Darstellungskompatibilität für vorhandene Geometrie, Annotationen,
Room und Reload; kein Reset/Migration, kein neuer Speicherpfad. Room übernimmt
weiterhin die vorhandene bestätigte Projektion, Remote behält seine logische
Layoutbreite ohne lokale Inhaltszoom-UI. Externe Anbieter können eine frühere
Brückennachricht weiter senden; sie verändert keinen Tafelraumzustand mehr.

Inhaltseigene Zoom-/Darstellungsfunktionen können künftig vom Embed selbst
angeboten werden. Canvaszoom, Materialfokus und Clips bleiben unverändert für
Präsentation und Ausschnitte. HTML erhält keine leere äußere Leiste. Apps behalten
Browseröffnung, gesperrte Objekte die vorhandene Entsperraktion. D-297s gemeinsame
Auswahl/Rahmenbewegung und der Timer bleiben erhalten. Diese Regel ersetzt ältere
Griff-/Inhaltszoom-UI-Aussagen in den Briefen05/12 und im HTML-Vertrag.

Entwicklungsstand, kein Desktop-/Remote-Deployment oder öffentlicher Release.

## Persönliche Verbindung (31.10.2026)

Lerndeck ist in der persönlichen Fassung standardmäßig verfügbar. Platzierte und
wiederhergestellte Instanzen laden den registrierten Anbieter direkt; kein
Verbindungsschalter oder Freigabeplatzhalter. Die frühere Gerätepräferenz hat
keine Wirkung mehr. Ohne Instanz wird keine Anbieteranforderung ausgelöst.
Canvasreferenzen, Geometrie, Annotationen, Anbieteranmeldung und bestehende
Lade-/Fehleranzeige bleiben erhalten. Die bestehende Anbieter-Allowlist bleibt
verbindlich; öffentlich ist sie leer. Keine beliebigen URLs oder zweite App-Liste.
Abnahme: leeres Profil ohne Anbieterrequest, direktes Laden bei Platzierung,
Reload auch mit alter deaktivierter Präferenz und Einstellungen ohne Schalter.


## Distributionsumfang D-330 (29.10.2026)

Die persönlichen Funktionen dieses Briefs bleiben im persönlichen Build erhalten.
Der öffentliche Export bietet keine Appauswahl/Lerndeck-Verbindung, keinen
KI-Anschluss und keine Remote-Auswahl/-Einrichtung. Präsentieren bietet weiterhin
Room Canvas mit denselben Clip-, Material- und Eingabepfaden. Die Versionsanzeige
heißt dort `Version` und bietet keine Updateprüfung. Keine leeren/deaktivierten
Vorschauen dieser entfernten Anschlüsse; kein neuer Erklärtext auf der Arbeitsfläche.
Browserabnahme in Hell/Dunkel; Hardwareabnahmen bleiben separat. Umfang und
Prüfweg in [Vertrag61](../implementation/61_DISTRIBUTION_BOUNDARY.md).
