# UI Brief – lokaler Archiv- und Planungsslice

**Explizite Erweiterung D-302 (29.10.2026):** Die bisher ausgeschlossenen Schülerdaten sind ausschließlich als kleine lokale Kursnamensliste mit privaten Stundennotizen freigegeben. Keine allgemeine Schüler-/Klassenverwaltung. Kursaktion und Details in [Brief30](30_STUDENT_NOTES_UI_BRIEF.md).

**Stand:** 30. August 2026  
**Status:** verbindlich für den bewusst vorgezogenen lokalen Planungstest vor dem ersten Unterrichtseinsatz

## Kontext

- **Oberfläche/Zustand:** bestehende Surface-Lab-Arbeitsfläche mit einklappbarer Unterrichtsnavigation
- **Zielnutzer:** Lehrkraft bei der Vorbereitung einer konkreten Englischstunde am Mac
- **Nutzungssituation:** lokale Vorbereitung am Vorabend; mit dateibasiertem lokalem Archiv, noch ohne Beelink, automatischen OneNote-Import oder Mehrbenutzerbetrieb
- **Eine primäre Handlung:** eine Stunde innerhalb der geöffneten Fach-/Reihenstruktur öffnen oder direkt dort neu anlegen
- **Eine zu prüfende Designfrage:** Bleibt die links einklappbare Hierarchie ruhig und eindeutig, wenn Fach und Reihe als farbige Ordner erscheinen und nur die jeweils passende Plus-Aktion anbieten?

### Aktuelle Desktop-Iteration: Reihenfolge ändern

- **Eine primäre Handlung:** einen sichtbaren Ordner oder Unterricht mit der Maus an eine andere Position derselben Liste ziehen
- **Eine zu prüfende Designfrage:** Reicht eine ruhige Einfügemarkierung aus, um die neue Position eindeutig vorherzusagen, ohne zusätzliche Griffe oder dauerhafte Sortieraktionen einzublenden?

### Aktuelle Desktop-Iteration: mehrere Fächer gemeinsam ordnen

- **Eine primäre Handlung:** mehrere Fächer derselben Klasse per `⌘/Strg` oder `Shift` auswählen und durch Ziehen eines gewählten Fachs gemeinsam neu positionieren
- **Eine zu prüfende Designfrage:** Vermitteln eine ruhige Akzentfläche und die bestehende Einfügelinie die Gruppenauswahl eindeutig genug, ohne Auswahlmodus, Checkboxen oder zusätzliche Aktionsleiste?

### Aktuelle Desktop-Iteration: klassenübergreifend kopieren

- **Eine primäre Handlung:** eine Stunde, Reihe oder ein Fach über das Kontextmenü kopieren und an einem fachlich passenden Ziel einfügen
- **Eine zu prüfende Designfrage:** Reicht eine feine wandernde gestrichelte Kontur direkt an der Kopierquelle, um den laufenden Kopiervorgang ohne zusätzliche Statusfläche verständlich zu machen?

### Aktuelle Desktop-Iteration: direkt duplizieren

- **Eine primäre Handlung:** aus einer vorhandenen Stunde, Reihe oder einem Fach ohne Zielauswahl direkt eine Arbeitskopie daneben erzeugen
- **Eine zu prüfende Designfrage:** Ist `Duplizieren` im bestehenden Kontextmenü eindeutig genug, wenn die Kopie ohne zusätzlichen Dialog unmittelbar unter der Quelle erscheint?

### Aktuelle Desktop-Iteration: umbenennen und reversibel entfernen

- **Eine primäre Handlung:** Fach, Reihe oder Unterricht am Objekt umbenennen beziehungsweise in den Papierkorb verschieben und bei Bedarf wiederherstellen
- **Eine zu prüfende Designfrage:** Bleibt die Navigation ruhig, wenn der Papierkorb erst bei Inhalt erscheint und die Umbenennung ohne zusätzliche Dialogfläche direkt in der Ordner- oder Stundenzeile erfolgt?

### Aktuelle Desktop-Iteration: Ordneraufbau

- **Eine primäre Handlung:** ein Fach oder eine Reihe öffnen und die darunterliegenden Reihen beziehungsweise Stunden sofort erfassen.
- **Eine zu prüfende Designfrage:** Verbinden rechtwinklige, zurückhaltende Linien Fach → Reihe → Stunde lesbar, ohne Icons, Text oder Kreuzungen zu überlagern?
- **Bewegungsgrenze:** Nur beim bewussten Öffnen, nicht beim Laden, Sortieren oder Kopieren. Die vertikalen Linien erscheinen zuerst; die Seitenarme wachsen mit den gestaffelt einblendenden Reihen und Stunden. Reihen und Stunden bleiben an ihrer festen Position, damit die 90°-Anschlüsse nicht wandern. Der Fach-Reihen-Stamm endet am Knick zur letzten Reihe ohne unteren Überstand. Kein Canvas- oder Archivdatum ändert sich. Schnelles erneutes Schalten bleibt möglich; bei reduzierter Bewegung erscheint der Inhalt unmittelbar.
- **Geometriepräzisierung:** Beide vertikalen Stämme liegen exakt unter der Mitte ihres Eltern-Ordnericons und beginnen an dessen Unterkante. Der Fach-Reihen-Arm endet vor der Reihenzeile; der Stundenarm beginnt exakt am Reihen-Stamm. Beide Arme sind gleich lang und lassen acht CSS-Pixel Abstand zum nächsten sichtbaren Icon beziehungsweise Text. Die Einrückung wird aus halber Iconbreite, Armlänge und Abstand abgeleitet, nicht für jede Ebene unabhängig geschätzt. Browserzoom und mehrzeilige Stundentitel dürfen diese Anschlüsse nicht verschieben.

## Scope

### Muss sichtbar oder erreichbar sein

- die geöffnete Unterrichtsnavigation belegt als eigene ruhige Fläche die volle Höhe der App-Shell ab dem oberen Fensterrand; die Kopfzeile beginnt erst rechts daneben und verwendet dieselbe Grundfläche wie der Canvas-Hauptbereich, damit die Navigation als durchgehende vertikale Ebene lesbar bleibt; im eingeklappten Zustand nutzt die Kopfzeile wieder die volle Breite;
- ein einzelner persistenter, mindestens 48 Pixel großer und flächenloser Archivschalter: geöffnet sitzt er rechts in der festen oberen Zeile der Navigation, geschlossen links in der globalen Kopfzeile; beim Umschalten gleitet dasselbe fokussierte Bedienelement synchron mit der Shell zwischen beiden Positionen und wechselt sein Icon dezent, statt durch zwei neu montierte Buttons zu springen; Hover verändert ausschließlich die Iconfarbe, der Tastaturfokusring bleibt sichtbar;
- der aktive Stundentitel mittig und einzeilig in der Kopfzeile als reine Anzeige derselben Lesson-Titelquelle; Umbenennen bleibt im Archiv;
- Klassen-/Kursauswahl als flächenloser aktiver Name mit Chevron; Popover für Wechsel, lokale Anlage und Umbenennung gemäß [Brief 17](17_CLASS_PICKER_UI_BRIEF.md). Die früheren zwei festen Reiter sind ersetzt;
- im aktiven B-Kurs die Hierarchie `Englisch` → `Means of transport` → Stunden;
- die inhaltlichen Stundentitel `Wortfeld und Bewertung` und `Private and public transport` mit jeweils sekundär sichtbarem Unterrichtsdatum;
- der vorbereitete Stand `Language support & Transport Challenge` mit dem Metadatum `31. Aug. 2026` als vorausgewählte Arbeitsfläche;
- eindeutiger aktiver Zustand für Klasse und Stunde;
- getrennte lokale Canvas-, Titel- und Metadatenstände pro Stunde;
- der vorhandene knappe Speicherstatus zeigt ohne zusätzliche Bannerfläche `Archiv wird geprüft`, `Wird gespeichert`, `Archiv gespeichert`, `Nur im Browser` oder `Nicht gespeichert`; nur `Archiv gespeichert` bestätigt die dateibasierte Ablage;
- das Unterrichtsdatum sekundär im Archiveintrag und neben dem geöffneten Stundentitel, ohne Teil des editierbaren Titels zu sein;
- bei einer von Codex angelegten Stunde ohne bekannten Termin weder eine leere Datumszeile noch Ersatztext oder Badge anzeigen; Titel, Auswahlzustand und Kartenhöhe bleiben ausreichend eindeutig;
- Fach und Reihen als aufklappbare Ordner mit ruhigen, pastelligen Lucide-Icons `Folder` im geschlossenen und `FolderOpen` im geöffneten Zustand; ein zusätzlicher Chevron erscheint nicht;
- auf der Klassenebene eine ruhige, mindestens 48 Pixel hohe Plus-Aktion `Fach anlegen`; sie ist auch in einer leeren Klasse unmittelbar sichtbar;
- am Fach ein zugänglicher Plus-Schalter `Neue Reihe`, an jeder Reihe ein Plus-Schalter `Neuer Unterricht`;
- beim neuen Unterricht sofort eine normale, aktiv markierte Stundenkarte mit rahmenloser Inline-Titeleingabe; Enter oder Fokusverlust übernimmt, Escape bricht ab;
- Rechtsklick beziehungsweise Kontextmenütaste auf Fach, Reihe oder Unterricht öffnet ein kleines Menü mit `Umbenennen` und `Löschen`;
- Umbenennen ersetzt den Namen direkt in derselben Ordnerzeile beziehungsweise Unterrichtskarte durch eine ruhige Inline-Eingabe;
- Löschen fordert eine knappe Bestätigung und verschiebt nur das gewählte Objekt in den lokalen Papierkorb; untergeordnete Katalogdaten, Canvasstände und lokal importierte Materialien bleiben unverändert erhalten;
- der einklappbare Bereich `Papierkorb` erscheint nur, wenn mindestens ein Objekt darin liegt, benennt dessen Typ sekundär und bietet direkt `Wiederherstellen`;
- neue Fächer, Reihen und Stunden als lokale, reload-feste Ergänzungen des Testkatalogs; neue Stunden öffnen sofort eine leere Arbeitsfläche;
- Fachordner innerhalb derselben Klasse, Reihenordner innerhalb desselben Fachs und Unterrichtskarten innerhalb derselben Reihe lassen sich auf dem Desktop über ihre gesamte Zeile neu anordnen;
- `⌘/Strg`-Klick ergänzt oder entfernt einzelne Fachordner aus einer flüchtigen Mehrfachauswahl; `Shift`-Klick wählt den zusammenhängenden Bereich ab dem letzten Auswahlanker;
- zieht die Lehrkraft eines der ausgewählten Fächer, werden alle ausgewählten Fächer in ihrer bisherigen relativen Reihenfolge als gemeinsamer Block innerhalb derselben Klasse verschoben;
- ausgewählte Fachzeilen erhalten eine ruhige Akzentfläche plus seitliche Akzentkante; es erscheinen weder Checkboxen noch eine dauerhafte Auswahl- oder Aktionsleiste;
- während des Ziehens zeigt eine einzelne Akzentlinie die konkrete Einfügeposition vor oder nach dem Ziel; das gezogene Element bleibt als solches erkennbar;
- die geänderte Reihenfolge wird im lokalen Katalog-Overlay gespeichert und nach Reload wiederhergestellt;
- Rechtsklick auf Fach, Reihe und Unterricht bietet `Kopieren`; die gewählte Quelle erhält direkt eine feine animierte gestrichelte Kontur und der Kopiermodus bleibt beim Klassenwechsel aktiv;
- Rechtsklick auf ein kompatibles Ziel bietet `Hier einfügen`: Fach in Klasse, Reihe in Fach und Unterricht in Reihe;
- Rechtsklick auf Fach, Reihe und Unterricht bietet `Duplizieren`; die vollständige unabhängige Kopie erscheint ohne Kopiermodus und Zielauswahl unmittelbar unter der Quelle im selben Elternordner;
- eine Kopie erhält auf jeder Ebene neue IDs und übernimmt darunterliegende Reihen, Stunden, Canvasstände und lokal importierte Materialien vollständig;
- Namen bleiben klassenübergreifend unverändert; nur bei einer Namenskollision im Ziel wird `– Kopie`, anschließend eine laufende Nummer ergänzt;
- `Escape` oder `Kopieren beenden` im Kontextmenü der Quelle beendet den Modus; ein Reload beendet ihn ebenfalls, während bereits eingefügte Kopien lokal erhalten bleiben;
- bei reduzierter Bewegung bleibt die gestrichelte Kontur statisch; eine normale Kopierstatuszeile oder ein zusätzliches Banner erscheint nicht;
- ruhiges Ein- und Ausklappen ohne Veränderung der Lesson- oder Canvasdaten.

### Darf nicht erscheinen

- Dashboard, Suche, globale Materialbibliothek oder Dateimanager; ausgenommen ist der eigene unterrichtsgebundene Material-Slice aus `04_LESSON_MATERIAL_DRAWER_UI_BRIEF.md`;
- produktiver OneNote-Import, Beelink-Sync oder eine zweite Archivkopie;
- Klassenverwaltung, Schülerdaten, Stundenplan oder LMS-Funktionen;
- endgültiges Löschen, Leeren des Papierkorbs, Verschieben in ein anderes Fach oder eine andere Reihe, freie Verschachtelung oder allgemeine Ordnerverwaltung;
- Betriebssystem-Zwischenablage, Ausschneiden, Verknüpfen statt Kopieren oder Überschreiben des Ziels;
- PDF-Rendering, Presenter-, LIVE-/GEHALTEN-, KI- oder Sharing-Funktionen;
- erklärende Absätze innerhalb der Navigation;
- neue Pflichtfelder für Planung oder Unterrichtsphasen.

## Exakter UI-Text

- `Unterricht öffnen`
- `Unterricht schließen`
- `9/10 B-Kurs`
- `Dinos`
- `Englisch`
- `Means of transport`
- `Wortfeld und Bewertung`
- `Private and public transport`
- `Language support & Transport Challenge`
- `24. Aug. 2026`
- `27. Aug. 2026`
- `31. Aug. 2026`
- `Fach anlegen`
- `Name des Fachs`
- `Neue Reihe`
- `Neuer Unterricht`
- `Name der Reihe`
- `Titel des Unterrichts`
- `Anlegen`
- `Abbrechen`
- `Umbenennen`
- `Löschen`
- `Papierkorb`
- `Wiederherstellen`
- `Kopieren`
- `Duplizieren`
- `Hier einfügen`
- `Kopieren beenden`
- `Einfügen fehlgeschlagen`
- `Archiv wird geprüft`
- `Wird gespeichert`
- `Archiv gespeichert`
- `Nur im Browser`
- `Nicht gespeichert`

Die bestehenden Surface-Lab-Texte bleiben unverändert. Klassen-, Fach-, Reihen- und Stundennamen sind reale Inhaltsdaten und keine App-Erklärung.

## Inhalt und Referenzen

- **Reale Inhalte/Assets:** aktive kanonische Ablage der installierten App unter `~/Library/Application Support/app.jujies.tafelraum/unterrichtsarchiv/`; Repository-Referenz unter `data/unterrichtsarchiv/`; stillgelegte Herkunft nur als geprüfter Snapshot unter `_migration/retired-source-snapshots/`; kontrolliertes Testasset in `test-materials/means-of-transport`
- **Visuelle Referenz:** vertraute, gleichmäßige Hierarchie ähnlich einer ruhigen OneNote-Navigation, ohne deren Ribbon- oder Seitenchrome zu kopieren
- **Relevanter Produktflow:** Klasse wählen → Fach/Reihe erkennen → Stunde öffnen oder per Plus inline benennen → unmittelbar auf der freien Fläche planen

## Vergleich und Invarianten

- **Gezielt veränderte Variable:** Navigation geschlossen oder als 304 Pixel breite linke Spalte geöffnet
- **Muss zwischen Varianten identisch bleiben:** Lesson-Inhalt, Canvaszustand, Werkzeugreihenfolge, Toolbar-Docking, Theme, Undo/Redo und lokale Speicherung; die Kopfzeile liegt bei geöffneter Navigation niemals über dieser, sondern bildet mit ihr zwei nebeneinanderliegende Shellbereiche
- **Nicht durch Desktop oder Mockup validierbar:** Touch-Erreichbarkeit, geeignete Breite am Legamaster und Zusammenspiel mit links angedockter Tafelwerkzeugleiste

## Abnahme

- Klassenumschalter, Hierarchie und aktiver Unterricht sind ohne Erklärung erkennbar.
- Inhaltsname und Unterrichtsdatum sind auf einen Blick gemeinsam erfassbar, bleiben aber visuell und fachlich getrennt.
- Bei geschlossenem Archiv bleibt die aktive Stunde über den mittigen Kopfzeilentitel eindeutig erkennbar; eine Umbenennung im Archiv aktualisiert ihn ohne zweiten Bearbeitungszustand.
- Der Schließen-Schalter bleibt beim Scrollen innerhalb der Navigation sichtbar; nach dem Schließen ist `Unterricht öffnen` ohne Hover oben an der linken Canvas-Kante erreichbar. Tastaturfokus wechselt jeweils auf den neu sichtbaren Gegenpart.
- Das Öffnen einer anderen Stunde lädt deren eigenen lokalen Zustand; Rückkehr stellt den vorherigen Zustand wieder her.
- Plus-Aktionen sind ohne Hover erreichbar und beziehen sich eindeutig auf ihre Hierarchieebene: Klasse erzeugt Fach, Fach erzeugt Reihe, Reihe erzeugt Unterricht.
- Ein neu angelegtes Fach bleibt in der aktuellen Klasse, eine neue Reihe im aktuellen Fach; ein neuer Unterricht bleibt in der aktuellen Reihe, öffnet sofort und überlebt einen Reload.
- Ziehen und Ablegen ändert nur die Reihenfolge innerhalb derselben Hierarchieebene und verändert weder IDs noch Lesson-, Canvas- oder Materialdaten.
- Die Einfügemarkierung unterscheidet klar zwischen einer Position vor und nach dem Ziel; Ablegen auf dem gezogenen Element bleibt folgenlos.
- Klick, Auf-/Zuklappen, Plus-Aktionen und Rechtsklickmenü funktionieren nach einer Sortierung unverändert.
- Beim Öffnen erscheinen die Führungslinien vor den gestaffelten Reihen beziehungsweise Stunden; der Fach-Reihen-Knick endet an der letzten Reihe ohne Überstand, die Stundenarme enden vor dem Stundentext. Kreuzungen bleiben ohne dunkle Überlagerung. Tastaturöffnung, sofortiges Zuklappen und erneutes Öffnen bleiben bedienbar.
- Die neue Reihenfolge von Fächern, Reihen und Stunden überlebt einen Reload.
- Die Mehrfachauswahl ist flüchtig und endet mit `Escape`, einem normalen Fachklick oder dem Klassenwechsel; die daraus gespeicherte Reihenfolge bleibt erhalten.
- Ein Gruppendrag kann nicht auf einem Fach innerhalb derselben Auswahl abgelegt werden und verändert weder die relative Reihenfolge des Blocks noch dessen Unterbäume.
- Der Kopiermodus bleibt über einen Klassenwechsel erhalten und bietet Einfügen ausschließlich am kompatiblen Zieltyp an.
- Solange die Kopierquelle sichtbar ist, markiert nur ihre wandernde gestrichelte Kontur den laufenden Modus; sie verändert weder Zeilenhöhe noch Hierarchie.
- Eingefügte Fächer, Reihen und Stunden sind unabhängige Kopien mit neuen IDs; spätere Änderungen wirken nicht auf die Quelle zurück.
- Direkt duplizierte Fächer, Reihen und Stunden stehen unmittelbar unter ihrer Quelle, verwenden denselben vollständigen Kopierpfad und überleben einen Reload.
- Canvas und lokale Materialien einer kopierten Stunde öffnen nach Reload unter der neuen Lesson-ID.
- Bei einem Fehler wird der Katalog nicht teilweise sichtbar erweitert; der Modus bleibt mit knapper Fehlermeldung aktiv.
- Die Titelzeile verändert beim Anlegen oder Umbenennen weder Breite noch Kartenhierarchie und zeigt keinen zusätzlichen Formularrahmen.
- Nach bestätigtem Löschen verschwindet das Fach, die Reihe oder der Unterricht aus dem Baum und erscheint im Papierkorb; beim Löschen eines Ordners verschwindet der vollständige sichtbare Teilbaum, ohne seine Kinddaten zusätzlich zu verändern.
- Wiederherstellen entfernt nur die Papierkorbmarkierung und bringt dadurch das Objekt mitsamt seinem erhaltenen Teilbaum, Canvas und Material zurück; der Zustand überlebt einen Reload.
- In geschlossenem Zustand erhält die Arbeitsfläche wieder die volle Breite.
- Der Test beobachtet insbesondere, ob Klasse, Fach, Reihe und Stunde als zu viele Ebenen erlebt werden.
- Breite, Animation und Touchzielwirkung bleiben bis zum Hardwaretest vorläufig.
- Drag-and-drop ist in dieser Iteration ausdrücklich für Mausbedienung am Desktop optimiert; Touch- und Tastatursortierung bleiben unvalidiert beziehungsweise offen.
