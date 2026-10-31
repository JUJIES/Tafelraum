# Materialarchiv: bestätigte Entfernung – D-242

**Datum:** 3. Oktober 2026. Update 0.1.41; Veröffentlichungsnachweis unten.

## Aufgabe / Produktlogik

Rotes Lucide-X in der Materialzeile → Dialog mit Abbrechen/Entfernen. Archiv-Entfernung beseitigt Quelle und sämtliche davon abhängigen Canvasinstanzen, gebundene Annotationen, Abdeckungen, HTML-Zustände und Materialclips. Unabhängige Inhalte und Ausschnittclips bleiben. Canvas-Undo darf keine fehlende Quelle wiederherstellen.

## Automatische Prüfung

- Archivserver: Datei-, Link- und HTML-Paketentfernung, Quellenhistorie, Pfadabwehr, referenzierende zweite Stunde, bewahrter unabhängiger Text/Ausschnittclip, alte Board-Schreibversuche, Reimport.
- Gemeinsame Bereinigung: Rich-Text-Rendition gebundener Annotationen, unabhängige Benutzergruppe, stundenbezogene Objekt-IDs, Clip-only-Undo.
- Vollständige App-/Live-Tests, beide Typprüfungen, Hauptbuild; 268 App-Tests und 83 Live-/Room-Tests bestanden; Hauptbuild und beide Typprüfungen bestanden. Desktop-Ressourcen erzeugt; gebündelter Server liefert Oberfläche, Materialliste und Entfernungsvertrag mit HTTP 200.
- Schnelle Mutationen belegten eine bestehende Historien-Kollision innerhalb derselben Millisekunde. Historien-Dateinamen erhalten zusätzlich eine UUID, die vorhandene Historienstruktur bleibt bestehen.

## Manuelle Browserprobe

- Isolierte Vite-Testbasis `/tmp/tafelraum-material-removal-qa/archive`, Port 49329; keine produktiven Materialien bearbeitet.
- Neutraler Unterricht mit `Testaudio.mp3` und `Behalten.png`; Material einfügen, rotes X öffnen, Abbrechen prüfen, erneut öffnen und bestätigen.
- Echter modaler Dialog: Fokus zuerst auf Abbrechen, benannte Quelle und Löschfolgen sichtbar. Kleines rotes X neben Plus, ruhige bestehende Dialoggestaltung im hellen Theme.
- Abbrechen erhält Audio auf dem Canvas und in der Liste. Bestätigung entfernt Audio und Kartenzeile; anderes Material bleibt. Canvas-Undo stellt Audio nicht wieder her. Reload behält bereinigten Stand. Zweite Probe mit gültigem neutralem PNG und Materialclip 1: Bildinstanzen und Cliprahmen verschwinden gemeinsam; Undo bringt weder Clip noch Bild zurück. Ein zunächst ungültiges Test-PNG wurde durch eine gültige neutrale PNG-Fixture ersetzt.

## Grenzen

Native WKWebView mit Maus geprüft; Legamaster-Touch nicht getestet. Andere schon geöffnete Lehrerfenster besitzen keine neue Mehrbenutzer-Synchronisierung; gespeicherte Boards und spätere Loads werden kanonisch bereinigt. Historische Quellen und Rasterassets sind Rückfallartefakte, kein aktiver Bestand; keine neue Restore-Oberfläche.


## Native Prüfung vor Release 0.1.41

Ein separates ARM64-Testbundle mit eigenem Profil `app.jujies.tafelraum.printqa` und Port 49327 wurde aus dem aktuellen Rust-Stand und denselben gebauten Frontend-/Server-Ressourcen erzeugt. Nur Bundle-ID, Name und Port unterscheiden sich; das produktive Profil blieb unangetastet.

Ein additives neutrales 1-Sekunden-WAV wurde auf dem Canvas platziert. Rotes X öffnet in WKWebView einen echten Modal-Dialog mit Initialfokus auf Abbrechen. Abbrechen erhält Player und Materialzeile. Bestätigen entfernt beide; Canvas-Undo stellt sie nicht wieder her. Vorhandenes HTML-Arbeitsblatt und anderes Rastermaterial bleiben erhalten. Test-App anschließend beendet.

Signiertes Releasepaket 0.1.41: 268 App-Tests, 83 Live-/Room-Tests, ein Rust-Test, beide Typprüfungen und Builds bestanden. Portable ZIP-Datenfreiheit, macOS-Codesign und kryptografische Updaterprüfung bestanden. Unveränderter gebündelter Server lieferte mit neutralem Profil Haupt-/Room-Seite und Material-Entfernungsvertrag mit HTTP 200; Oberfläche und Bundle melden 0.1.41.

**Veröffentlicht:** 0.1.41 am 3. Oktober 2026 atomar über den Beelink. Öffentlicher HTTPS-Download bytegleich zum lokalen Release, SHA-256 `548b054e054a878e9c25a757b4d04219667b97af99224793054cc2bf8cdf3d1f`; Updater-Signatur nach dem Download erneut gültig. Installierte produktive App und produktives Archiv nicht ersetzt beziehungsweise bearbeitet.


## Dialoghöhe korrigiert – 3. Oktober 2026

Nutzerbefund: In der Mac-App streckte sich die Bestätigung samt Buttons fast über die gesamte Fensterhöhe. Chromium zeigte beim selben DOM bereits etwa 198 px Dialoghöhe und 40 px Buttons; die bisherige Browserprobe war deshalb keine ausreichende native Layoutabnahme.

Der bestehende Dialog erhält ausdrücklich `height: fit-content`, inhaltshohe Rasterzeilen, `align-content: start` und eine begrenzte, bei Bedarf scrollbare Viewporthöhe. Breite, Gestaltung, Text und Entfernungslogik bleiben unverändert.

- Browserprobe mit neutralem Link: kompakter Dialog, Abbrechen erhält Material und Canvas.
- Neues separates ARM64-Testbundle: dunkles Theme, längerer Dateiname, etwa 430 × 217 px Bestätigung und 40 px Buttons. Initialfokus auf Abbrechen, Escape schließt; das Material bleibt in der Liste.
- Desktop-Vorbereitung einschließlich Typprüfung und Hauptbuild bestanden; vorhandene Materialtests bestanden.
- UI-Brief und Decision Log aktualisiert. Keine neue Produkt- oder Datenregel; kein zusätzlicher Renderer.
- Seit 3. Oktober 2026 im kombinierten Update 0.1.42 veröffentlicht. Reale Touchbedienung bleibt offen; die bestehende 48-px-Regel für grobe Zeiger bleibt erhalten.
