# Nativer Bilddruck – City Bikes

## Stand: 1. Oktober 2026, D-238

**Gerät:** Mac, macOS 26.2, ARM64, gebaute Tauri/WKWebView-App.
**Isolation:** Eigener Bundle-Identifier `app.jujies.tafelraum.printqa`, lokaler Port 49327 und eigener Testarchivordner. Nur eine Kopie von `StadtRAD_Hamburg_Infoflyer_A4.png` aus City Bikes wurde platziert. Die produktive Stunde und ihr Archiv wurden nicht verändert.

## Aufgabe und Beobachtung

1. PNG auf die Testfläche legen und `Material drucken` auslösen.
2. macOS-Druckvorschau auf vollständiges Blatt und Seitenzahl prüfen.
3. `Cancel` wählen, dieselbe Druckaktion erneut auslösen und nochmals abbrechen.

**Vor Korrektur:** Native WKWebView wurde nicht als Hauptdokumentstrategie erkannt; der vorhandene Bildpfad wartete auf ein unsichtbares Frame. Eine erste Umstellung auf den nativen Befehl öffnete den Dialog, hing beim zweiten Versuch aber noch in der Bildschirm-Paint-Wartephase.

**Nach Korrektur:** Zwei aufeinanderfolgende native Systemdialoge zeigen das vollständige StadtRAD-Blatt, `Page 1 of 1`. Nach beiden Abbrüchen verschwindet die flüchtige Druckansicht und `Material drucken` ist wieder verfügbar. Native Bilddruckvorbereitung benötigt keine Bildschirm-Animationsframes.

Lokaler Screenshot des zweiten Dialogs: `output/image-print/native-stadtrad-repeat.png` (nicht als Unterrichtsmaterial oder öffentliche Demo veröffentlichen).

## Automatische Checks

- App- und Live-Typprüfung; Hauptbuild einschließlich Desktop-Ressourcen.
- 266 App-Tests und 83 Live-/Room-Tests bestanden.
- Drucktests prüfen Native-Erkennung ohne Safari-Token, gemeinsame native Befehlsnutzung, Fehlerweitergabe, zweimalige Vorbereitung ohne Animation sowie Aufräumen bei Abbruch und Befehlsfehler.
- Bestehende Geometrietests erhalten direkten Rasterdruck und Rendition bei Drehung, Spiegelung oder Zuschnitt.

## Grenzen

Kein physischer Druckauftrag gesendet. Update 0.1.38 ist seit 1. Oktober 2026 veröffentlicht; Paket-Codesign, öffentliche Bytegleichheit und Updater-Signatur bestanden. Der unveränderte gebündelte Dienst startete mit neutralem Testprofil; Haupt- und Room-Seite lieferten HTTP 200 und die Oberfläche zeigte 0.1.38. Die laufende Desktop-App wurde nicht aktualisiert. HTML erhält nur denselben gemeinsamen Dialogaufruf; sein Paket-/Vorlagenpfad bleibt unverändert. Browserstrategien sind automatisch geprüft; Safari-/Chromium-Systemdialoge wurden in dieser Iteration nicht erneut manuell geöffnet.


## Folgeprüfung: A4-Seitennutzung (D-239)

Nutzer-Screenshot nach Installation von 0.1.38: Das StadtRAD-Blatt erschien verkleinert als schattierte Karte. Zwei 10-mm-Ränder (Seitenrand und Innenpadding) und vererbte Bildschirmdekoration waren die Ursache. Der Druckstil nutzt nun allein den 10-mm-Seitenrand, proportional volle Bildfläche und weißen Hintergrund; er entfernt Padding, Gap, Schatten, Rahmen und Rundung. Originalmaterial und Bildschirmvorschau bleiben unverändert.

Im gebauten isolierten nativen Bundle wurde `Material drucken → PDF` ausgeführt. Quartz meldet genau eine Seite mit 595,276 × 841,89 pt (A4). Die eingebettete Bildfläche liegt horizontal bei 10 bis 200 mm und misst etwa 190 × 269 mm. Die vollständige Fußzeile bleibt sichtbar; kein Schatten oder zusätzliches Kartenlayout. Lokale Prüfdateien liegen unter `output/image-print/tafelraum-a4-final.pdf` und `tafelraum-a4-final.png`. Build/Typprüfung, Live-Typprüfung und elf Drucktests bestanden. Kein physischer Druckauftrag gesendet. Folgekorrektur seit 1. Oktober 2026 in Update 0.1.39 veröffentlicht: 266 App-Tests, 83 Live-/Room-Tests, Rust-Test, Typprüfungen, Haupt-/Live-Build, Datenfreiheit- und Codesignprüfung sowie lokale und öffentliche Updater-Signaturprüfung bestanden. Der gebündelte Dienst startete mit neutralem Testprofil; Oberfläche und Bundle meldeten 0.1.39. Die Desktop-App wurde nicht aktualisiert.
