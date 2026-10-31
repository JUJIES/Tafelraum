# Native YouTube-Vollbildprobe

**Datum:** 3. Oktober 2026 · D-243

## Gerät und Aufgabe

Mac, macOS 26.2, gebaute ARM64-Tauri-App mit getrenntem neutralem Profil `app.jujies.tafelraum.printqa`, lokalem Dienst auf 49327. Produktionsarchiv und installierte App bleiben unangetastet. Testvideo: offizielles YouTube-Entwicklerbeispiel `M7lc1UVf-VE`.

1. YouTube-Link auf die Arbeitsfläche einfügen.
2. Player aktivieren, vollständig in die sichtbare Fläche holen und Werkzeugleiste schließen.
3. Originalen YouTube-Vollbildknopf betätigen.
4. Escape betätigen und Canvas/Wiedergabe prüfen.

## Befund

- Unveränderte 0.1.41-Laufzeit: Video lädt und spielt, Vollbildknopf führt nicht ins Vollbild.
- Nur Cargo-Feature gesetzt: Tauri-CLI entfernt es erneut, weil der entsprechende Appkonfigurationsschalter fehlt; damit kein wirksamer Gegenbuild.
- Beide Schalter gesetzt: Originaler YouTube-Knopf öffnet die native bildschirmfüllende Medienansicht innerhalb der App. Escape führt zur unveränderten Arbeitsfläche zurück; das Video läuft weiter.
- Wiederholte automatisierte Bedienung nach dem macOS-Fensterwechsel war wegen unzuverlässiger Fensterbindung nicht eindeutig auswertbar; sie zählt nicht als bestätigter Wiederholungstest. Kein Workaround dafür in der App.

## Ursache und Umsetzung

`src-tauri/Cargo.toml`: `tauri` mit `macos-private-api`.
`src-tauri/tauri.conf.json`: `app.macOSPrivateApi: true`.

Die vorhandene Tauri-/Wry-Laufzeit aktiviert damit ihre Medien-Fullscreen-Unterstützung in WKWebView. Keine neue Abhängigkeit, kein eigener Player und keine Canvasdatenänderung. Die Wry-Implementierung nutzt eine private WKPreferences-API; App-Store-Kompatibilität wird damit nicht zugesichert. [Offizielle Wry-Dokumentation](https://github.com/tauri-apps/wry#feature-flags).

## Checks und Grenzen

- App-Typprüfung bestanden.
- Sechs vorhandene YouTube-Tests und ein Rust-Test bestanden.
- Separates natives ARM64-App-Bundle gebaut und signiert.
- Erstwechsel und Escape-Rückkehr im nativen Bundle bestätigt.
- Wiederholte Bedienung von Hand, Zweitdisplay/Room und reales Legamaster-Touchdisplay stehen aus. Keine neue Remote-Freigabe.
- Korrektur am 3. Oktober 2026 im kombinierten Update 0.1.42 veröffentlicht; öffentlicher Hash und Signatur geprüft.


## Rückmeldung zur Abdeckung – 5. Oktober 2026

Nutzer meldet erneut eine nicht funktionierende YouTube-Abdeckung; genauer Ablauf und betroffene Lehrer-/Room-Ansicht noch offen. Gegenprobe im bestehenden getrennten nativen ARM64-Testbundle mit demselben Vollbild- und Frontendstand wie 0.1.42 (Testversionslabel 0.1.41), neutralem Video `M7lc1UVf-VE`, Maus auf macOS:

- Auswahl und `Abdeckung hinzufügen` über laufendem YouTube: vollständige opake graue Fläche, Bearbeitungsgriffe sichtbar.
- Abdeckung entfernen, YouTube-Vollbild öffnen, mit Escape zurück, Abdeckung erneut hinzufügen: weiterhin vollständige graue Fläche.
- Obere Abdeckungskante bis zur Mitte ziehen: obere Videohälfte sichtbar, untere Hälfte grau; Teilabdeckung reagiert.

Damit ist eine generelle Regression der Lehrer-Abdeckung durch die Vollbildfreigabe bislang nicht reproduziert. Keine Codeänderung auf Verdacht. Room, konkretes Nutzervideo und realer Touchablauf wurden in dieser Gegenprobe nicht geprüft; weitere Eingrenzung benötigt die konkrete Fehlerwirkung.

**Präzisierung derselben Rückmeldung:** Lehreransicht, wiederholte Klicks auf `Abdeckung hinzufügen` unmittelbar nach dem Videoimport, keine sichtbare Abdeckung. Ergänzende native Probe: Linkpaste erzeugt eine neue YouTube-Canvasinstanz, ohne vorheriges Play oder Reload; direktes Betätigen ihrer Abdeckungsaktion erzeugt die vollständige graue Fläche samt Griffen. Fehler weiterhin nicht reproduziert. Konkreter YouTube-Link und Eingabeart (Maus/Trackpad/Touch) angefragt.

## Korrektur der Materialzuordnung: lokales Video – 5. Oktober 2026

Die Nutzeraufnahme identifiziert den betroffenen Player als lokales MP4 `Ben-is-Back-Trailer-English.mp4`, nicht als YouTube. Mit einer Kopie dieser Datei ausschließlich im getrennten QA-Archiv lässt sich der Fehler im bisherigen nativen Build reproduzieren: Die angebotene Aktion `Abdeckung hinzufügen` bleibt ausgeschaltet und erzeugt keine Abdeckung.

**Ursache:** `CanvasSurface.isCoverTarget` berücksichtigt YouTube, aber keine lokalen Videoelemente. `toggleImageCover` verwirft das lokale Video dadurch vor der Anlage. Derselbe Guard begrenzt auch die spätere Abdeckungsbearbeitung. Die vorhandene Video-Projektion und ihr Abdeckungs-Layer unterstützen bereits beide Videoarten.

**Korrektur:** Der zentrale Guard verwendet den vorhandenen gemeinsamen `isVideoMaterialElement`-Prüfer. Lokale Videos erhalten dieselbe Abdeckungsgeometrie, Bearbeitung, Bindung und Persistenz wie YouTube; keine neue Darstellung oder Datenstruktur.

**Native Gegenprobe:** Neu gebautes und signiertes ARM64-Tauri-Bundle, macOS 26.2, Maus, getrenntes Profil auf Port 49327. Erster Klick erzeugt die vollständige graue Fläche samt Griffen; Ziehen der oberen Kante öffnet die obere Videohälfte. Rückgängig entfernt die Abdeckung, Wiederholen stellt die Teilabdeckung wieder her. Nach App-Neustart bleibt dieselbe Teilabdeckung sichtbar; Entfernen gibt den Player einschließlich Play und Controls wieder frei. Produktionsarchiv unverändert, Testdatei wird nicht ausgeliefert.

**Checks:** App-Typprüfung und Frontend-/Live-Build im Desktop-Vorbereitungspfad bestanden; 55 bestehende Tests zu Abdeckungsgeometrie, Zielzuordnung, Annotationen, lokalen Videos und YouTube bestanden. Native ARM64-Bundle erfolgreich gebaut. Reales Touchdisplay und Room wurden in dieser Gegenprobe nicht geprüft. Korrektur noch nicht veröffentlicht.

## Vollbild bei aktiven Clips – 5. Oktober 2026

**Aufgabe:** Bei aktivem Material- oder Ausschnittclip lokales MP4 beziehungsweise YouTube im Lehrerplayer auf Vollbild stellen und nach Escape denselben Clip behalten. Native ARM64-App mit der oben beschriebenen lokalen Abdeckungskorrektur, getrenntes QA-Archiv, macOS 26.2, Maus. Room-Sitzung läuft im zweiten lokalen Fenster; für die Lehrerbedienung wird dieses auf dem einzelnen Testdisplay minimiert. Keine reale Zweitdisplay-/Touchabnahme.

| Ablauf | Beobachtung |
| --- | --- |
| Lokales MP4, Materialclip 1, pausiert → Vollbild → Escape | Native Medienansicht öffnet; danach Materialclip 1 weiterhin aktiv. |
| Lokales MP4, Ausschnittclip 2, pausiert → Vollbild → Escape | Native Medienansicht öffnet; danach Ausschnittclip 2 weiterhin aktiv. |
| Lokales MP4, Ausschnittclip 2 → Play | Room-Ziel wechselt sofort zu `Material`; Clip 2 wird inaktiv. |
| YouTube, Materialclip 3 → Play → Anbieter-Vollbild → Escape | Native Medienansicht öffnet; Materialclip 3 bleibt aktiv. |
| YouTube, Ausschnittclip 4 → Play → Anbieter-Vollbild → Escape | Bereits Play ersetzt Clip 4 durch `Material`; Escape kehrt zu diesem Materialziel zurück, nicht zu Clip 4. |

**Fachliche Ursache:** `useLiveCanvas.materialControls.playback` ruft beim Abspielen eines anderen Ziels ausdrücklich `room.showMaterial` auf. Das ist die bisherige Regel aus D-205/D-240, kein Verlust der gespeicherten Clipgeometrie durch Vollbild. Weder lokaler Player noch YouTube-Vollbild melden einen temporären Präsentationswechsel oder ein Rückkehrziel an Room. Vollbild betrifft nur die native Lehreransicht; daraus folgt keine neue Video-Vollbildregie im Room-Fenster. Room-Medien besitzen selbst keine Front-Playercontrols.

**Offene Produktentscheidung:** Gewünschter durchgängiger Ausschnittclip-Ablauf kollidiert mit dem bisherigen automatischen Materialzeigen bei Play. Kleinste sinnvolle Änderung wäre, Play innerhalb eines bereits passenden Ausschnittclips dessen Ziel erhalten zu lassen; außerhalb dieses Clips bleibt das bestehende spontane Materialzeigen. Falls auch Room während Lehrer-Vollbild temporär das einzelne Video einpassen soll, braucht es einen ausdrücklichen flüchtigen Präsentationsübergang samt Rückkehr zum vorherigen Clip. Kein automatischer Rücksprung nach beliebiger Wiedergabe und kein neues gespeichertes Clipmodell. In dieser Prüfung keine Codeänderung.

**Testgrenze:** Wiederholte native Fensterwechsel liefern zeitweise veraltete Automationsbindungen beziehungsweise `noWindowsAvailable`; diese fehlgeschlagenen Eingabeversuche zählen nicht als Appfehler. Die oben bestätigten Abläufe wurden anhand frischer Accessibility-Zustände und nativer Vollbilddialoge bewertet. YouTube direkt pausiert im Ausschnittclip ohne vorherige Play-Aktion sowie reale Ausgabe auf dem erweiterten Bildschirm bleiben offen. Keine neue Typprüfung erforderlich, da ausschließlich dieser Prüfstand ergänzt wurde.
