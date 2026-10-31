# Room-Video-Regie — Prüfstand vom 5. Oktober 2026

## Produktentscheidung und Änderung

D-245: Lehrerplayer bleibt die hörbare und bedienbare Instanz; Room zeigt dasselbe Video stumm. Play erhält einen Materialclip des Videos oder einen Ausschnittclip mit sichtbarem Videoanteil. Außerhalb davon öffnet ein neuer Start die Materialansicht. Laufende alte Positionsberichte dürfen eine ausdrücklich neue Clipwahl nicht ersetzen.

Der Tafelraum-Vollbildknopf arbeitet für MP4 und YouTube gleich. Lehrerplayer bleibt gemountet; Room projiziert vorübergehend das ganze Material über dem unveränderten Basisziel. Escape/Exit führt zurück. Keine neue Clipfolge, Wiedergabepersistenz oder Remote-Änderung. Room kann den temporären Zustand per Escape/Exit beenden; die primäre Bedienung bleibt am Lehrergerät.

## Umgebung

- macOS, ARM64, gebautes Tauri/WKWebView-Paket mit aktivierter bestehender nativer Fullscreen-Fähigkeit.
- Separates Profil `app.jujies.tafelraum.videoregieqa`, eigener lokaler Port und Testarchiv. Produktives Archiv und parallel laufende Druckprüfung unberührt.
- MP4: kontrollierte Kopie des gemeldeten lokalen Trailers; YouTube: öffentliches Entwickler-Testvideo `M7lc1UVf-VE`. Beide Cliparten im Teststand vorhanden.
- Zusätzlicher Browser-Kernflow mit echtem `CanvasSurface`, `RoomCanvasHost`, `RoomView` und `BroadcastChannel` über die bestehende `clip.browser.html?inlineRoom`-Fixture; eigener Entwicklungsserver mit Testarchiv.

## Beobachtung / Ergebnis

| Aufgabe | Ergebnis |
| --- | --- |
| Nativer MP4-Ausschnittclip → Play | Clip 2 bleibt aktiv; kein Wechsel zur Materialansicht |
| Nativer MP4-Ausschnittclip → Vollbild → Escape | Video bildschirmfüllend, danach Lehrerfläche mit Clip 2; Wiedergabe läuft weiter |
| Nativer MP4-Materialclip → Vollbild → Escape | Derselbe lokale Player; Rückkehr zum ausgewählten Materialclip auch im pausierten Zustand |
| Nativer YouTube-Ausschnittclip → Play → Vollbild → Escape | Clip 4 bleibt aktiv, Video-Vollbild innerhalb der App, Rückkehr ohne neue Wiedergabeinstanz |
| Nativer YouTube-Materialclip → Vollbild → Escape | Rückkehr zu Clip 3; kein Browserwechsel |
| Browser: beide lokalen MP4-Player, Play/Seek/Pause | Room stumm, Lehrer hörbar; Play und Pause übertragen, Positionssprung übertragen |
| Browser: temporäres Vollbild und Rückkehr | Room bekommt `is-video-fullscreen`, Basisclip bleibt erhalten; nach Exit normale Room-Ansicht und laufende Wiedergabe |
| Automatisierter Hostflow | Teilweise Videoüberschneidung, kein Audioziel, Fullscreen/Return, Pauseposition, neue Clipwahl, alte Playback-Berichte, veraltete Escape-Generation und Stundenwechsel geprüft |

Positionsstichproben im Browser: laufend Lehrer/Room `5,704 / 5,797 s`; nach +10 s `24,735 / 24,739 s`; pausiert `24,809 / 24,803 s`; nach Vollbildrückkehr `12,330 / 12,394 s`. Das sind einzelne lokale Stichproben mit aufeinanderfolgenden Messungen, keine belastbare maximale Audio-/Videolatenz. Room war jeweils `muted=true`, Lehrer `muted=false`.

## Checks

- App-Typprüfung und Live-Typprüfung bestanden.
- 268 App-Tests und 85 Live-/Room-Tests bestanden; darunter zwei neue Prüfungen in `room-media-presentation.test.ts` mit echtem Host und isolierter Render-/Engine-Grenze.
- Desktop-Ressourcen, App-/Teilnehmerbuild und separater nativer ARM64-Build bestanden. Bestehende Warnung zu großen Frontend-Chunks bleibt.
- Native Bedienung und visuelle Gegenprobe wie oben; tatsächlich erweitertes Display, Touch und Bluetooth-Ausgabe nicht verfügbar.

## Offen / Freigabegrenze

Die semantische lokale Kopplung ist geprüft. Reale Legamaster-Ausgabe mit zwei Bildschirmen und Bluetooth-Box benötigt noch einen kurzen Hardwaretest: Play, hörbare Sprache/Lippensynchronität, Pause, Seek, Vollbild/Escape und erneuter Clipaufruf. YouTube puffert unabhängig; bildgenauer Gleichlauf und Bluetooth-Latenz können nicht garantiert werden. Bei mehreren Videos im selben Ausschnitt ist aktuell genau ein Video die aktive Room-Medienprojektion.

Seit 8. Oktober 2026 in App-Update 0.1.43 veröffentlicht. Releaseprüfungen und öffentliche Hash-/Signaturprüfung stehen in [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md#update-0143-room-schreibposition-und-video-regie). Die genannten Hardwaregrenzen bleiben offen.
