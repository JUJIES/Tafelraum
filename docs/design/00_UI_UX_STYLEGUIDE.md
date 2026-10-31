# Tafelraum – verbindlicher UI/UX-Styleguide

**Stand:** 30. August 2026  
**Status:** verbindlich für GUI-Konzeption, Mockups, Prototypen und spätere Produktoberflächen  
**Gilt für:** Lehreransicht, Schüleransicht, öffentliche Ansicht, ImageGen-Mockups und implementierte UI

## 1. Ziel

Tafelraum soll unter Unterrichtsdruck ohne lange Erklärungen verständlich sein. Die Oberfläche ist ruhig, minimalistisch und in ihrer Hierarchie eindeutig. Sie unterstützt die aktuelle Handlung und tritt hinter Unterrichtsinhalt und Arbeitsfläche zurück.

Minimalismus bedeutet nicht, wichtige Funktionen zu verstecken. Er bedeutet:

- nur aktuell benötigte Informationen zeigen;
- vertraute Interaktionen verwenden;
- eindeutige Rückmeldung geben;
- Wiederholung und dekorative UI vermeiden;
- seltene Optionen erst im passenden Kontext öffnen.

Im Zweifel gilt:

> Erst die Oberfläche verständlicher machen, dann über erklärenden Text nachdenken.

## 2. Verbindliche Grundsätze

### 2.1 Inhalt vor Oberfläche

- Canvas, Unterrichtsmaterial und Schülerinhalt dominieren die Wahrnehmung.
- App-Shell und Navigation bleiben visuell ruhig.
- UI-Flächen werden nicht angelegt, um Leere dekorativ zu füllen.
- Keine Dashboard-Karten, Panels oder Sektionen ohne konkrete Aufgabe.

### 2.2 Nur Informationen für die aktuelle Handlung

- Ein Element wird nur angezeigt, wenn es für die aktuelle Entscheidung oder Aktion benötigt wird.
- Kontextoptionen erscheinen erst beim passenden Werkzeug oder Objekt.
- Spätere Funktionen werden nicht als deaktivierte Vorschau in frühe Oberflächen aufgenommen.
- Technische Details bleiben in einem klar getrennten Development-/Diagnosemodus.

### 2.3 Progressive Offenlegung

- Häufige Kernaktionen sind direkt erreichbar.
- Seltene, riskante oder technische Aktionen liegen eine Ebene tiefer.
- Eine Oberfläche zeigt nicht gleichzeitig alle möglichen Optionen.
- Einstellungen werden dort angeboten, wo ihre Wirkung verständlich ist.

### 2.4 Wiedererkennen statt Erinnern

- Kernfunktionen behalten stabile Positionen.
- Vertraute Symbole und kurze Begriffe werden bevorzugt.
- Das aktive Werkzeug und der aktuelle Zustand sind klar erkennbar.
- Kernaktionen dürfen weder Hover noch eine nicht erklärte Geste voraussetzen.

### 2.5 Eine klare Hierarchie

- Pro Bereich gibt es höchstens eine visuell dominante Hauptaktion.
- Sekundäre Aktionen sind erkennbar, konkurrieren aber nicht mit der Hauptaktion.
- Destruktive Aktionen werden nicht als beiläufige Primäraktionen angeboten.
- Mehrere gleich stark hervorgehobene Buttons sind zu begründen.

### 2.6 Direkt, vorhersehbar und reversibel

- Aktionen wirken möglichst unmittelbar am gewählten Objekt oder Ort.
- Rückmeldung ist kurz und erscheint nahe am relevanten Zustand.
- Undo wird gegenüber unnötigen Sicherheitsdialogen bevorzugt.
- Bestätigungen sind für schwer umkehrbare oder folgenreiche Aktionen reserviert.

### 2.7 Ruhige Konsistenz

- Gleiche Aktionen sehen gleich aus, heißen gleich und verhalten sich gleich.
- Lehrer- und Schüleransicht verwenden dieselbe visuelle Sprache, aber unterschiedliche Funktionsumfänge.
- Vorbereitung, Lehreransicht in der Durchführung und lokale Tafelansicht verwenden dieselbe visuelle Sprache, aber eigenständige Shells und Werkzeugzustände.
- Die lokale Tafelansicht ist eine öffentliche Raumansicht. Sie wird nicht als persönliche Schüleransicht oder als Spiegelung der Mac-Oberfläche gestaltet.
- Neue Sondermuster benötigen einen nachweisbaren Produktnutzen.
- Animation dient Orientierung und Zustandswechseln, nicht Dekoration.

### 2.8 Touch und Zugänglichkeit vor dekorativer Eleganz

- Touchrelevante Ziele sind groß und besitzen ausreichenden Abstand.
- Kein Kernflow ist von Hover abhängig.
- Aktive, deaktivierte und fokussierte Zustände werden nicht nur durch Farbe vermittelt.
- Kontrast, Lesbarkeit und erkennbare Fokuszustände dürfen nicht einem subtilen Look geopfert werden.

## 3. Regel für sichtbaren Text

Vor jedem dauerhaft sichtbaren Text müssen UI-Entwurf und Review diese Fragen beantworten:

1. Braucht der Nutzer diese Information genau jetzt?
2. Hilft sie bei einer Entscheidung oder Handlung?
3. Ist sie bereits durch Position, Symbol, Zustand oder Buttonbezeichnung verständlich?
4. Wiederholt sie Überschrift, Umgebung oder Aktion?
5. Erklärt sie eine Oberfläche, die besser gestaltet werden sollte?
6. Gehört sie stattdessen in Tooltip, Hilfe oder eine einmalige Einführung?
7. Beschreibt sie eine relevante Folge, Gefahr oder Einschränkung?

Wenn Frage 1 und 2 mit `nein` beantwortet werden, wird der Text entfernt. Sicherheits-, Datenschutz- und Verlusthinweise dürfen nicht aus Minimalismusgründen entfallen.

## 4. UI-Texte und Benennung

### 4.1 Verbindliche Copy-Regeln

- Kurze, konkrete Begriffe verwenden.
- Verben für Aktionen verwenden: `Material hinzufügen`, `Inhalt finden`, `Zurücksetzen`.
- Zustände knapp benennen: `Gespeichert`, `Wird gespeichert`, `Nicht gespeichert`.
- Keine Begrüßungs-, Marketing- oder Motivationstexte in Arbeitsoberflächen.
- Keine Unterzeile, die nur Überschrift oder Button umformuliert.
- Keine Erklärung direkt unter jedem Button.
- Keine technischen Begriffe, wenn die Lehrkraft deren Modell nicht kennen muss.
- Gleiche Aktion erhält überall dieselbe Benennung.
- Keine komplett großgeschriebenen UI-Texte.

### 4.2 Bevorzugte Muster

Selbsterklärender direkter Einstieg:

```text
[Material hinzufügen]
```

Kein redundantes Muster:

```text
Material hinzufügen
Fügen Sie hier Material zu Ihrer Stunde hinzu.
[Material hinzufügen]
```

Destruktive Bestätigung:

```text
Unterricht in den Papierkorb verschieben?
Canvas und Materialien bleiben wiederherstellbar.

[Abbrechen] [Verschieben]
```

Ein Dialog enthält nur dann erklärenden Fließtext, wenn die Folge aus Titel und Aktion nicht ausreichend hervorgeht.

## 5. Icons, Labels und Bedienelemente

- Implementierte Produktoberflächen verwenden `lucide-react` als gemeinsames Standard-Iconsystem für Shell und kontextuelle Aktionen. Die dockbare Surface-Lab-Hauptwerkzeugleiste ist eine bewusst geschlossene Ausnahme und verwendet ausschließlich offizielle Microsoft Fluent System Icons in der jeweiligen 24-Pixel-Geometrie.
- Innerhalb einer Bedieneinheit wird kein Iconset gemischt. Für vorhandene Standardsymbole werden keine selbst gezeichneten SVG-Pfade angelegt; abweichende semantische Farben dürfen nur bereits vom Original getrennte Flächen beziehungsweise unveränderte Originalmasken belegen.
- Ein eigenes produktspezifisches Icon ist nur zulässig, wenn Lucide kein verständliches Symbol bietet und die Abweichung im UI-Review begründet wurde.
- Primäre Unterrichtswerkzeuge verwenden in horizontalen Werkzeugleisten zunächst Icon plus kurzes Label. In schmalen vertikalen Leisten dürfen vertraute Icons desselben festgelegten Sets ohne sichtbares Label erscheinen, wenn Tooltip, zugänglicher Name und eindeutig erkennbarer aktiver Zustand erhalten bleiben.
- Icon-only ist nur für sehr bekannte Aktionen wie Undo, Redo oder Vollbild zulässig und benötigt Tooltip sowie zugänglichen Namen.
- Ungewohnte oder produktspezifische Symbole dürfen nicht ohne Label verwendet werden.
- Ein konsistentes Icon-System verwenden; keine Mischung aus Emojis, gefüllten und filigranen Fremdstilen.
- Icons auf großen Displays dürfen nicht zu fein oder kontrastarm sein.
- Nicht jedes Bedienelement wird als Pill, Karte oder schwebende Fläche gestaltet.
- Buttonform und visuelles Gewicht zeigen Hierarchie, nicht Dekoration.

## 6. Layout und Informationsdichte

- Die zentrale Arbeitsfläche erhält den größtmöglichen zusammenhängenden Raum.
- Werkzeuge werden nach Aufgabe gruppiert; Werkzeugwahl und globale Aktionen sind visuell unterscheidbar.
- Häufige Werkzeuge bleiben direkt erreichbar.
- Farbe, Strichstärke und ähnliche Optionen erscheinen nur für das aktive Werkzeug.
- Reset, Diagnose und seltene Einstellungen gehören nicht in die primäre Werkzeuggruppe.
- Panels werden nur eingeführt, wenn ein realer Workflow sie benötigt.
- Weißraum strukturiert; zusätzliche Trennlinien, Karten und Überschriften sind kein Ersatz für klare Gruppierung.

## 7. Touch-, Stift- und Desktopregeln

Die Zielhardware ist noch nicht vollständig dokumentiert. Deshalb sind exakte Größen bis zum Hardwaretest vorläufig. Als verbindliche Untergrenze für touchrelevante Prototyp-Bedienelemente gilt zunächst:

- mindestens `48 × 48 CSS-Pixel` aktive Fläche;
- klarer Abstand zwischen benachbarten Hauptaktionen;
- kein ausschließlich über Hover erreichbarer Zustand;
- keine filigranen Drag-Handles als einzige Bedienmöglichkeit;
- sichtbare Rückmeldung für Auswahl, aktives Werkzeug und laufende Speicherung.

Für große Smartboards dürfen Ziele größer werden. Die endgültige Größe und Platzierung werden am Legamaster und später an dokumentierter Zielhardware geprüft. Desktopbeobachtungen bestätigen keine Touch- oder Stiftannahme.

## 8. Visuelle Sprache

Die visuelle Richtung ist ruhig, professionell, leicht warm und zurückhaltend. „Apple-artig“ bezeichnet Qualitätsprinzipien, keine Kopie einer Apple-Oberfläche.

### Verbindlich

- klare Typografie und deutliche Hierarchie;
- großzügiger, funktionaler Weißraum;
- überwiegend neutrale Flächen;
- helle und dunkle Grundfläche verwenden dieselben semantischen Farben, Komponenten und Hierarchien; es entstehen keine getrennten Designs;
- Originalbilder, PDFs und fachliche Farben werden beim Themewechsel nicht automatisch invertiert oder umgefärbt;
- eine sparsam verwendete Akzentfarbe;
- ruhige, konsistente Ecken, Linien und Schatten;
- Unterrichtsinhalt bleibt farblich wichtiger als App-Chrome;
- keine visuelle Unruhe durch permanente Badges, Verläufe oder Dekoration.

### Nicht verwenden

- starke Glas-/Blur-Effekte auf zentralen Bedienelementen;
- sehr helle oder dünne Icons mit schwachem Kontrast;
- dekorative Kartenraster ohne Informationsbedarf;
- mehrere konkurrierende Akzentfarben;
- große Hero-Texte oder werbliche Leerräume in Arbeitsansichten;
- verspielte Animationen im Unterrichtsflow.

### Noch vorläufig

- konkrete Farbwerte;
- Standardtheme je Nutzungssituation und Platzierung der späteren Themeeinstellung;
- endgültige Schriftgrößen;
- Radius- und Schattenwerte;
- genaue Toolbar-Dimensionen;
- endgültige Abstände auf der Zielhardware.

Diese Tokens werden erst nach Mockupvergleich und Hardwaretest stabilisiert.

## 9. Feedback, Fehler und leere Zustände

- Erfolgsmeldungen nur anzeigen, wenn die erfolgreiche Wirkung nicht bereits sichtbar ist.
- Speicherung wird durch einen knappen Status gezeigt, nicht durch wiederkehrende Toasts.
- Fehler benennen das Problem und die nächste sinnvolle Handlung.
- Leere Zustände enthalten höchstens eine kurze Orientierung und eine primäre Aktion.
- Keine Fehlercodes ohne verständliche Bedeutung.
- Keine dauerhaften Warnbanner für Zustände, die direkt behoben oder kontextuell gezeigt werden können.
- Flüchtige Aufmerksamkeitsanimationen bleiben kurz, lokal, unterbrechbar und in ihrer Bewegung ruhig. Sie dürfen Inhalt nicht länger verdecken und benötigen eine reduzierte Bewegungsvariante.

## 10. Einführung und Hilfe

- Eine verständliche Kernoberfläche darf keine Einführung voraussetzen.
- Seltene oder neuartige Konzepte können später einmalig, kurz und überspringbar eingeführt werden.
- Einführungen erklären Handlungen, nicht Produktmarketing.
- Ein Hinweis erscheint bevorzugt im Nutzungskontext und nicht dauerhaft.
- Hilfe bleibt später gezielt aufrufbar; sie belegt nicht permanent Arbeitsfläche.
- Ein Tutorial darf unklare Produktlogik nicht kaschieren.

## 11. Regeln für Prototyp 0.1 „Surface Lab“

- Surface Lab ist eine bewusst vereinfachte Ein-Client-Test-Shell für Canvas, Werkzeuge, Touch und Stift. Sie ist keine endgültige Vorbereitung-, Regie-, Tafel- oder Schüleroberfläche.
- Eine zentrale Arbeitsoberfläche, keine Start-, Archiv- oder Dashboardseite.
- Unterrichtsdatum und lokaler Speicherstatus bleiben knapp; der bereits im Archiv sichtbare Stundentitel wird in der Kopfzeile nicht wiederholt.
- Primäre Werkzeuge: Hand, Auswahl, Stift, Marker, Radierer, Text und Form.
- Werkzeugoptionen erscheinen nur bei Bedarf.
- Undo/Redo, Material hinzufügen, Inhalt finden und Vollbild bleiben klar erreichbar.
- Reset und Development-Diagnose sind von Unterrichtswerkzeugen getrennt.
- Die Werkzeugleiste lässt sich über einen ausreichend großen Drag-Griff an der oberen, rechten, unteren oder linken Seite derselben Shell andocken; es entstehen keine getrennten Apps.
- Oben und unten zeigt die Werkzeugleiste Icon plus Kurzlabel; links und rechts reduziert sie sich platzsparend auf eine einzelne Icon-Spalte mit Tooltips und zugänglichen Namen.
- Hell und Dunkel sind Themezustände derselben Shell; beide bleiben von der ersten Implementierung an testbar.
- Das Toolbar-Docking ist eine Surface-Lab-Testfunktion und keine spätere Produktnavigation.
- Ohne reale Zielhardware fällt keine endgültige Entscheidung über die Werkzeugposition.
- Arbeitsvollbild ist dieselbe Arbeitsoberfläche ohne Browserchrome, kein Presenter- oder Schülermodus.

Konzeptmockups für spätere Oberflächenfamilien benötigen einen eigenen UI Brief und dürfen nicht stillschweigend den Implementierungsumfang von 0.1 erweitern.

## 12. Verbindliche Regeln für ImageGen-Mockups

ImageGen-Mockups werden als `ui-mockup` erzeugt und prüfen eine benannte Frage. Für jeden Prompt gilt:

- vor der Generierung liegt ein UI Brief nach `docs/design/UI_BRIEF_TEMPLATE.md` vor;
- nur im freigegebenen Scope liegende Funktionen darstellen;
- keine zusätzlichen Karten, Erklärtexte, Badges oder Menüs erfinden;
- sichtbare Texte vorab wörtlich festlegen;
- Toolbarzustände mit identischem Inhalt, Stil und Canvas vergleichen;
- keine Designrichtung durch zusätzliche Features attraktiver machen;
- Development-Schalter klar von der Produktoberfläche trennen;
- große, realistisch bedienbare Touchziele zeigen;
- keine Schüler-, Presenter-, KI- oder Archivfunktionen in Mockups für 0.1;
- generierte Texte auf Redundanz und fehlerhafte Beschriftung prüfen;
- Mockups sind Diskussionsartefakte, keine ungeprüfte Pixel-Spezifikation.

Ein ausgewähltes Mockup darf anschließend als visuelle Referenz dienen. Es ersetzt weder den UI Brief noch die Regeln dieses Styleguides. Nicht ausgewählte Varianten werden nicht zu parallelen Designwahrheiten.

## 13. Pflichtcheck für KI-Agenten

Vor jeder GUI-Änderung muss ein Agent prüfen:

1. Welche konkrete Handlung wird verbessert?
2. Muss dafür ein neues sichtbares Element entstehen?
3. Kann eine vorhandene Aktion oder ein vorhandenes Muster verwendet werden?
4. Ist jeder neue Text für die aktuelle Entscheidung notwendig?
5. Wiederholt Text eine Überschrift, ein Label oder einen bereits sichtbaren Zustand?
6. Bleibt die zentrale Arbeitsfläche dominant?
7. Ist die Kernaktion ohne Hover, Tutorial oder technische Erklärung auffindbar?
8. Sind Touchziel, Abstand, Kontrast, Fokus und aktiver Zustand ausreichend?
9. Wurde eine spätere Funktion unbemerkt in den aktuellen Scope gezogen?
10. Wurde die Änderung mit dem realen Kernflow statt nur als Screenshot beurteilt?

Ein Agent darf zusätzliche erklärende Texte nicht als Standardlösung für Unklarheit einsetzen. Er soll zuerst Benennung, Gruppierung, Position, Zustand und direkte Rückmeldung verbessern.

## 14. Abnahmeregel für UI-Änderungen

Eine UI-Änderung ist erst akzeptabel, wenn:

- ihre Funktion ohne begleitenden Absatz verständlich ist;
- kein sichtbarer Text redundant ist;
- Haupt- und Nebenaktionen klar unterscheidbar sind;
- sie keine spätere Produktfunktion vorwegnimmt;
- sie auf Desktop nicht fälschlich als Touchvalidierung bewertet wird;
- sie gegen die festgelegte Testaufgabe geprüft wurde;
- verbleibende Hardwareannahmen ausdrücklich als unvalidiert dokumentiert sind.

## 15. UI Brief vor neuer Oberfläche

Vor dem ersten Mockup oder der Implementierung einer neuen Oberfläche beziehungsweise eines wesentlich neuen Zustands wird ein kurzer UI Brief erstellt. Er hält mindestens fest:

- Zielnutzer und Nutzungssituation;
- eine primäre Handlung;
- eine zu prüfende Designfrage;
- erforderliche und verbotene Elemente;
- exakte sichtbare UI-Texte;
- reale Inhalte und Referenzen;
- gezielt veränderte Variable und Invarianten;
- Abnahmekriterien und noch unvalidierte Hardwareannahmen.

Der Brief soll möglichst auf eine Seite passen. Er ist keine neue Produktkonzeption und darf fehlenden Scope nicht durch erfundene Funktionen füllen. Vorlage: `docs/design/UI_BRIEF_TEMPLATE.md`.

## 16. Visueller Iterationsrhythmus

Nach Auswahl einer visuellen Richtung gilt:

```text
eine konkrete visuelle Beobachtung
→ eine fokussierte Änderung
→ Browserprüfung desselben Zustands
→ nächste Beobachtung
```

- Nicht mehrere unabhängige Designhypothesen in einer Änderung vermischen.
- Bestehende Inhalte, Datenflüsse und nicht betroffene Gestaltung erhalten.
- Browser-Screenshots dienen als prüfbare visuelle Evidenz.
- Ein ausgewähltes Referenzmockup kann projektintern gespeichert werden; erst dann entsteht eine verbindliche visuelle Referenz.
- Mockup und Screenshot bestätigen keine Touch-, Stift- oder Erreichbarkeitsannahme.
- Automatisierte Screenshotvergleiche und Accessibility-Checks werden erst mit dem funktionalen Scaffold eingeführt, wenn sie reale Zustände schützen können.


## Gemeinsame neutrale Buttonzustände (31.10.2026)

`src/button-states.css` wird von Lehrer- und Room-UI geteilt. Normale Shell-,
Werkzeug-, Einstellungs- und Dialogbuttons zeigen bei Hover und Tastaturfokus
dieselbe ruhige Fläche `--button-hover-bg` innerhalb ihrer bestehenden Geometrie.
Der gemeinsame Token mischt `--toolbar-strong` mit12% Textfarbe, damit Fokus und
Hover auch auf bereits hinterlegten Buttons sichtbar bleiben.
Kein äußerer blauer Ring und kein zusätzlicher Fokusabstand; auch automatisch
fokussierte Dialog-Schließbuttons erhalten keinen Ring. Tastaturfokus bleibt
sichtbar. Aktive Auswahlfarben, destruktive Aktionen, Eingabefelder und spezielle
Canvasgriffe behalten ihre fachlich begründeten Zustände. Neue neutrale Controls
nutzen diese gemeinsame Regel statt eigener Fokus-/Hoverringe.
