# UI Brief – Live Canvas Clip-Modus

**Aktuelle Host-UI ab D-203/D-208/D-209:** `Clip aufnehmen` nimmt per Materialtipp oder Ausschnittzug auf; Clipnummern und 1–9 zeigen direkt, × führt zur Canvasansicht. Gespeicherte Ausschnitt- und Materialrahmen bleiben auf der Lehrerfläche auch ohne Präsentation sichtbar; die Nummer bleibt beim aktiven Rahmen stehen. Die unten beschriebene manuelle Host-Umschaltung `Frei`/`Clip`, automatische Aktivierung beim Aufziehen, Ausblendung der Rahmen in `Frei` und Ersatz der Nummer durch `Live` sind historisch. Clipgeometrie, begrenzte Remote-Teilnehmerkamera und Rückruf durch erneute Nummer gelten weiter. [Room-UI-Brief](19_ROOM_CANVAS_PILOT_UI_BRIEF.md).

Stand: 5. September 2026. Umgesetzt und als `poc-20260905-clips-01` bereitgestellt; keine Teilnehmerbearbeitung. Prüfstand und Hardwaregrenzen in [Betrieb/Test](../implementation/06_LIVE_CANVAS_BETRIEB_UND_TEST.md).

## Handlung und Hypothese

Die Lehrkraft zieht auf dem Canvas einen nummerierten Clip auf und zeigt ihn durch Klick auf seine Nummer oder mit 1–9. Ihre eigene Kamera bleibt frei. Schüler erkennen ohne Moduswahl, dass sie nur den gezeigten Bereich erkunden können.

## Oberfläche

- `Clip` in der bestehenden Werkzeugleiste mit vorhandenem Fluent Scan-Dash-Symbol startet eine einmalige Rechteckgeste; Escape bricht ab. Die Werkzeugwahl allein ändert den Live-Modus nicht und benötigt keinen Hinweis `Clip aufziehen`. Erst ein tatsächlich aufgezogener gültiger Rahmen wechselt automatisch zu `Clip`, ohne ihn bereits öffentlich zu zeigen. Der Inhalt bleibt außerhalb der Erstellgeste bedienbar.
- Genau ein Rahmen pro Clip. Nummer aktiviert einen gespeicherten Clip; erst bei bestätigter Freigabe ersetzt `Live` die sichtbare Nummer. Beim Wechsel bekommt der vorherige Clip seine Nummer zurück. Tastenkürzel 1–9 und zugängliche Clipnummer bleiben erhalten; erneutes Aktivieren ruft alle zur Gesamtansicht zurück.
- Der geschlossene Live-Canvas-Einstieg zeigt `Clip`, solange ein Ausschnitt gewählt ist, und `Clip wählen`, solange der Modus noch keine Freigabe besitzt. So bleibt die aktuelle Regieentscheidung während der Durchführung unmittelbar erkennbar.
- Nummer beziehungsweise `Live` sitzt als eigenständiger, rundum abgerundeter Status links oben. Verschieben und Löschen liegen ohne vorgeschalteten Bearbeiten-Modus direkt rechts oben; ein zusätzliches Vorschau-Auge am Live-Rahmen entfällt als redundanter Zustands-/Einstiegshinweis. Die Schülervorschau bleibt im Live-Canvas-Menü erreichbar. Größenänderung bleibt am vorhandenen unteren Griff. Eine 8 Sekunden sichtbare Rückgängig-Aktion korrigiert den letzten Eingriff. Der aktive Live-Rahmen verschiebt und vergrößert den gezeigten Ausschnitt bereits während der Geste; `Live` bleibt sichtbar, `Noch nicht gezeigt` entfällt. Inaktive Clips bleiben privat. Escape/Pointercancel setzt die laufende Geste zurück; Rückgängig führt auch die öffentliche Ansicht zurück. Keine separate Ansichtenliste.
- `Frei` / `Clip` stehen direkt im Live-Canvas-Panel und bleiben während Live erreichbar. Der bewusste Klick auf `Frei` schaltet unmittelbar auf die Vollflächenfreigabe zurück und blendet sämtliche gespeicherten Cliprahmen samt Clipaktionen auf der Lehrerfläche aus. Die Rahmen bleiben stundenlokal gespeichert und erscheinen beim nächsten Wechsel zu `Clip` unverändert wieder. Während einer neuen Rechteckgeste ist in `Frei` ausschließlich der entstehende Entwurf sichtbar. Im laufenden freien Modus ruft `Alle zu mir` einmalig zur aktuellen Lehrerkamera; eine Freigabecheckbox und ein dauerhafter Folgezustand entfallen.
- Clip-Modus ohne gewählten Clip zeigt keine ganze Fläche als Ersatz. Rahmenanlage ist Vorbereitung, keine automatische Präsentation. Auswahl und bestätigte öffentliche Ansicht werden unterschieden.
- Teilnehmer: Im Modus `Frei` sind Pan/Zoom immer selbstständig; `Zur Lehrkraft` übernimmt das aktuelle Hostziel einmal. Clip erlaubt Pan/Pinch ausschließlich innerhalb der Grenze. Gemäß D-104 kein dauerhaftes `Ganzer Clip`, kein Ersatzbutton und kein erklärender Hinweis; die Lehrkraft ruft bei Bedarf dieselbe Clipnummer erneut auf. Keine Werkzeugleiste oder Clipauswahl.

## Freigabe und Persistenz

Ein Ausschnittclip auf einem scrollbaren HTML-Dokument folgt in der Lehreransicht
der Textstelle. Das Raumfenster erhält die gespeicherte Aufnahmegeometrie samt
Dokument-Scrollstand. Absichtliches Ziehen des Rahmens bleibt eine Änderung
des gezeigten Ausschnitts. Mehrseitige PDFs bestehen auf dem Canvas aus
einzelnen Seitenbildern. Ein eindeutig auf einer Seite liegender Ausschnitt
folgt deren Verschiebung und beim Pannen der Lehreransicht dem Blatt.

D-306 präzisiert ausschließlich Materialcliprahmen: Ihre sichtbare Kontur übernimmt Rundung und Drehung des referenzierten Materials im aktuellen Canvaszoom. Nummer/Bedienung bleiben am bisherigen Begrenzungsrahmen. Ausschnittrechtecke, Kamerabegrenzung, Clipdaten und öffentliche Projektion bleiben unverändert. Aktuelle Darstellung und Prüfstand im Room-UI-Brief19 und Decision Log.

D-311: Ausschnitt- und Materialclipnummern verwenden dieselbe sichtbare Kachel:
bei 100 Prozent Canvaszoom 48 × 48 px mit 24-px-Ziffer, darüber keine weitere
Vergrößerung. Unter 100 Prozent schrumpfen Ziffer, Hintergrund und Innenabstand
proportional zum Canvaszoom. Die unsichtbare Trefferfläche bleibt 48 × 48 px;
Hover erzeugt keine größere Hintergrundkachel. Aktivzustand, Tastaturfokus,
Zeigen und Nummernmenü bleiben am vorhandenen Button. Reine Lehreranzeige,
keine gespeicherte Nummerngröße oder Änderung der Clipgeometrie.

Clips sind optionale stundenlokale Rechtecke im bestehenden Canvas-Snapshot, keine Engineelemente oder zweite Materialwahrheit. Live-Modus und aktive Ansicht bleiben Sitzungszustand. Gemäß D-123/D-127 verwenden Frei und Clip dieselbe bereinigte öffentliche Szene; der Clip begrenzt ausschließlich die Teilnehmerkamera. Ein anderer Clip, ein Moduswechsel sowie Bewegung/Skalierung des aktiven Rahmens übertragen nur die neue Präsentationsgeometrie und lösen keine neue Rasterung aus. Clip ohne Auswahl bleibt leer; ein Stundenwechsel beginnt eine neue Generation. Während einer Rahmenbewegung wird der neue Clip vollständig eingepasst; normale Inhaltsänderungen erhalten weiterhin den individuellen Schülerzoom. Die gewöhnliche Maus bleibt privat. Gemäß D-129 liegen Abdeckungen als opake öffentliche Aufmerksamkeitsobjekte über bereits geladenem Material. Archiv, lokale Pfade und private Metadaten werden nicht übertragen. Außerhalb des Clips oder unter Abdeckungen liegende Inhalte der bereinigten Szene können technisch im Teilnehmerclient vorliegen; beides ist keine Vertraulichkeitsgrenze. D-102 ergänzt bewusstes Zeigen über Y/Toolbar innerhalb des Clips, eine öffentliche Schülervorschau und kurze Übergänge: [ergänzender UI Brief](08_LIVE_CANVAS_MOTION_PREVIEW_POINTER_UI_BRIEF.md).

## Abnahme

**Bewegung D-123/D-129 / Bildschärfe D-108:** Clipbewegung ist reine, per `requestAnimationFrame` geglättete Kamerabewegung auf derselben Szene. Abdeckungsänderungen wechseln nur Vektorgeometrie und lokalen Wisch, nicht die Bildraster. Keine neuen Controls. Der erste Stand zeigt den ganzen Clip, spätere Inhaltsänderungen erhalten den Schülerzoom. Bilddichte richtet sich in Frei und Clip nach vorhandenen Quellpixeln, Zuschnitt und Platzierungsgröße bis 4x innerhalb bestehender Budgets. Starke Detailvergrößerung bleibt eine Qualitäts-/Hardwaregrenze.

Synthetische Stunde mit zwei Arbeitsblättern und späterem Inhalt: Clips anlegen, erneut laden, zeigen, lokal weiter navigieren, Schülerzoom, Rückruf, schneller Clipwechsel, `Frei`, `Zur Lehrkraft`, `Alle zu mir`, Reconnect, Stundenwechsel, Ende. Tastenkürzel greifen nie in Text-/Materialeingaben. Kameraeinschränkung, stabile opake Abdeckungen ohne neue Assetabrufe, fehlende private Metadaten und veraltete Clients gezielt prüfen. Mac-/Tabletviewport visuell prüfen; echte iPad-Pinch-, Stift- und Schulnetzabnahme bleibt gesondert erforderlich.
