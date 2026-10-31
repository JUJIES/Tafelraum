# UI Brief – portable Mac-App und Updates

**Stand:** 13. Oktober 2026
**Status:** verbindlich für den ersten Kolleg:innen-Pilot

## Kontext

- **Oberfläche/Zustand:** bestehende Surface-Lab-Shell innerhalb einer portablen macOS-App
- **Zielnutzer:** Lehrkraft auf einem verwalteten Apple-Silicon-Mac ohne Administratorrechte
- **Nutzungssituation:** lokaler Unterricht; Internet ist nur optional für Updateprüfung vorhanden
- **Eine primäre Handlung:** Tafelraum starten und mit dem lokalen Unterrichtsarchiv weiterarbeiten
- **Eine zu prüfende Designfrage:** Bleiben Version und Updateprüfung jederzeit auffindbar, ohne die Unterrichtsfläche dauerhaft zu belasten?

## Scope

### Muss sichtbar oder erreichbar sein

- `Nach Updates suchen …` und `Lokalen Datenordner öffnen` im normalen macOS-App-Menü;
- ein ruhiges Info-Symbol in der vorhandenen rechten Kopfzeilengruppe; es öffnet ein kleines Versionsfenster mit installierter Version und derselben manuellen Updateprüfung;
- ein ruhiger Menüstatus `Update <Version> verfügbar …`, wenn der stille Check eine neue Version findet;
- ein verfügbares Update ersetzt am Kopfzeileneinstieg das Info-Symbol durch ein Download-Symbol und benennt die verfügbare Version im geöffneten Fenster;
- beim ersten Fund einer neuen Version lenken drei kurze, lokale Lichtimpulse die Aufmerksamkeit auf dieses Download-Symbol. Solange die Version noch nicht geöffnet wurde, wiederholt sich dieselbe kurze Sequenz nach zwei Minuten Pause. Öffnen beendet die Bewegung und weitere Erinnerungen für diese Version bis zum nächsten Appstart. Bei reduzierter Systembewegung ersetzt ein kurz eingeblendeter ruhiger Ring die Impulse;
- ab 0.1.45 ein automatisch geöffnetes bestehendes Versionsfenster bei einem Updatefund, mit `Später` und `Jetzt aktualisieren …`; während Room oder Remote Canvas läuft, erst nach Präsentationsende;
- ein nativer Ja/Nein-Dialog erst nach der bewussten Updateaktion oder bei einem dadurch festgestellten konkreten Fehler;
- bewusste Bestätigung vor Download, Installation und Neustart;
- eine knappe Ladeansicht, bis der lokale Dienst bereit ist.

### Darf nicht erscheinen

- permanent ausgeschriebene Versionsnummer, technischer Pfad oder großes Update-Badge in der Unterrichtsfläche;
- Pulsieren ohne lange Ruhephase, Springen oder eine Animation der übrigen Kopfzeile;
- automatische Installation während der Nutzung;
- Login, Serverdatenablage oder Live-Canvas-Konfiguration im Erststart;
- Unterrichtsdaten oder persönliche Notizen im ZIP beziehungsweise Updatepaket.

## Exakter UI-Text

- `Tafelraum wird geöffnet …`
- `Nach Updates suchen …`
- `Suche nach Updates …`
- `Update <Version> verfügbar …`
- `Update wird installiert …`
- `Lokalen Datenordner öffnen`
- `Jetzt installieren und neu starten?`
- native `Ja`-/`Nein`-Aktionen gemäß Systemsprache
- `Tafelraum ist auf dem neuesten Stand.`
- `Jetzt aktualisieren …`
- `Später`
- `Version <Version>`
- `Du kannst jederzeit nach einer neuen Version suchen.`

Fehlermeldungen benennen Updateprüfung, Installation oder lokalen Start sowie die nächste sinnvolle Handlung.

## Abnahme

- Die Surface-Lab-Kopfzeile erhält ausschließlich den kleinen Versionseinstieg in der vorhandenen Utility-Gruppe; Titel, Live-Regie, Notizen, Einstellungen und Vollbild bleiben unverändert.
- Das Versionsfenster zeigt die tatsächlich laufende Bundle-Version und startet denselben nativen Updateablauf wie das App-Menü; es gibt keinen zweiten Updater.
- Das App-Menü öffnet den lokalen Datenordner und startet eine manuelle Updateprüfung.
- Die stille Startprüfung installiert nichts und öffnet keinen nativen Aktionsdialog. Ein Fund öffnet höchstens einmal pro laufender Oberfläche das vorhandene Versionsfenster; `Später` schließt es, der Menüweg bleibt erhalten. Installation beginnt erst nach Updateaktion und `Ja`.
- Während Room oder Remote Canvas läuft, erscheint das automatische Versionsfenster nicht; nach Präsentationsende wird ein ausstehender Fund angeboten.
- Während Prüfung, Entscheidung und Installation kann kein zweiter Updatevorgang gestartet werden. Nach `Nein` bleibt der verfügbare Menüeintrag sichtbar.
- Der Updatehinweis bewegt ausschließlich den Versionseinstieg für ungefähr drei Sekunden. Ohne Reaktion darf dieselbe Sequenz frühestens nach zwei Minuten erneut erscheinen. Nach Öffnen startet sie für dieselbe Version in der laufenden App nicht erneut; Symbol, zugänglicher Name und statische Akzentfläche tragen den Zustand unabhängig von Farbe und Bewegung.
- Ein nicht erreichbarer Update-Server blockiert weder Start noch Unterricht.
- Touch- und Stiftverhalten der Unterrichtsfläche bleibt gesondert auf Zielhardware zu prüfen.
