# Textbox-Skalierung — D-232

**Datum:** 30. September 2026. **Gerät:** Mac, In-App-Browser, Maus. **Material:** synthetische lange Textbox, keine produktiven Unterrichtsdaten.

## Aufgabe und Befund

In `src/live/clip.browser.html` legt `Lange Textbox` einen formatierten Text mit 420 Einheiten Breite und 24 Schriftgröße an. Ein kleiner Eckzug (20 × 10 Bildschirmkoordinaten) ließ die Breite vor der Korrektur auf 993,32 anwachsen. Native Schriftgröße: 56,76, semantische Spanngröße weiterhin 24. Der sichtbare Text wurde dadurch breiter umbrochen, ohne mitzuwachsen.

## Korrigierter Flow

Derselbe Zug ergibt 445,36 Breite, 175,60 Höhe und 25,45 in nativer und semantischer Schriftgröße. Undo stellt 420 / 165,60 / 24 wieder her; Redo stellt den vergrößerten Stand wieder her. Nach abgeschlossener Speicherung enthält der isolierte Board-Snapshot dieselbe Breite und Schriftgröße; ein Reload stellt 445,36 / 175,60 / 25,45 wieder her. Screenshot: `output/text-resize/fixed.png`.

Die Fixture unterstützt `?mixedText` für 36/24-Spannen; die Szenentests prüfen einheitliche Skalierung, ältere Schriftbaselines, Formatierungsänderungen und Seitenresize. Der reine Spanntest prüft Rückskalierung, Stil-/Text-/Absatzerhalt und gemeinsam angewandte Größenlimits. 258 App-Tests, 82 Tests im Live-/Room-Lauf, beide Typprüfungen und Produktionsbuild bestanden.

## Grenzen

Die Änderung betrifft die lokale Textgeometrie und denselben bestehenden Rich-Text-Abgleich. Kein produktives Archiv verändert. Finger/Stift am Board und native WebView sind noch nicht praktisch geprüft. Noch kein neues App-Paket veröffentlicht.


## 30. September 2026 — D-236: Absatzweise Ausrichtung

- Mac-Browser, isolierte synthetische Textbox mit Überschrift und zwei Absätzen. Markierte Überschrift zentriert, übrige Absätze linksbündig; Markierung blieb erhalten. Drei Zeichen im zweiten Absatz markiert und rechts ausgerichtet: nur dieser Absatz änderte sich. Danach Markierung auf Einfügemarke reduziert und Links gewählt: alle drei Absätze linksbündig.
- Bei gemischter Ausrichtung und ohne Zeichenmarkierung war keine Ausrichtungstaste aktiv. Tooltips wechselten zwischen markierten Absätzen und ganzer Textbox. Absatzstarts und Zeichengrößen blieben unverändert. Screenshot: `output/paragraph-alignment/heading-only.png`.
- Beide Typprüfungen, 261 App- und 83 Live-/Room-Tests bestanden; Regression prüft Bereichsgrenzen, Teilmarkierung, gemischten Zustand, leere Schlussabsätze und JSON-Roundtrip. Keine produktiven Archivänderungen. Touch-/native WebView-Abnahme und App-Veröffentlichung stehen aus.


## Veröffentlichung 0.1.36

D-232 und D-236 sind im signierten und veröffentlichten App-Paket 0.1.36 enthalten. Releaseprüfungen, Paket-Smoke-Test und öffentliche Hash-/Signaturprüfung stehen in [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md).


## 30. September 2026 — D-237: Textfarben und Themewechsel

- Mac, In-App-Browser, isoliertes Fixturearchiv; keine produktiven Unterrichtsdaten. `clip.browser.html?theme=dark` startet dunkel, `Theme wechseln` wechselt die echte CanvasSurface.
- Reproduktion: Nach Markerwahl wurde eingefügter externer Text gelb und halbtransparent. Eine bloße asynchrone Änderung der Engine-Werkzeugfarbe im Pastecallback genügte nicht: Der native Pastepfad las noch den alten Werkzeugzustand. Die Defaults werden deshalb vor der nativen Erstellung synchron bestätigt.
- Nach Korrektur: Paste nach Marker ist dunkel auf heller und hell auf dunkler Fläche, jeweils voll deckend. Beim Hin-/Rückwechsel folgen neuer nativer Text und vorhandener unterstrichener Rich Text. Absatzstruktur, Schriftgröße und Unterstreichung bleiben erhalten. Undo entfernt nur den eingefügten Text; Redo stellt ihn korrekt wieder her. Reload liest den formatierten Text passend zum aktuellen Theme. Die kurz beim Neuladen einer Rendition sichtbare Engine-Bildvorschau verschwindet nach dem Laden. Screenshots: `output/text-theme/light.png`, `output/text-theme/dark.png`.
- Regressionen prüfen externe Texte gegenüber Canvaskopien/Tabellen sowie neutrale Altfarben, Akzentfarberhalt, Idempotenz und JSON-Roundtrip. Beide Typprüfungen, 263 App- und 83 Live-/Room-Tests sowie Hauptbuild bestanden. Native WebView und Touch nicht geprüft. Änderung noch nicht veröffentlicht.

### Veröffentlichung 0.1.37

D-237 ist im signierten und veröffentlichten Paket 0.1.37 enthalten. Der gebündelte Dienst und die daraus geladene Hauptoberfläche bestanden Paste nach Marker und den automatischen Hell-/Dunkel-Farbwechsel. Öffentlicher Download, Hash und Updater-Signatur wurden erneut geprüft; Details unter [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md).
