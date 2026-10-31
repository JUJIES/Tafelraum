# Sprache der Oberfläche

30.10.2026. Gemeinsame persönliche Codebasis → öffentlicher Quellkandidat.
Keine Installation, Versionsanhebung, Veröffentlichung oder Änderung am Archiv.
UI-Vertrag: [Brief32](../design/32_UI_LANGUAGE_UI_BRIEF.md).

## Produktregel

Der Eintrag `Sprache` bietet ein natives Dropdown `Deutsch 🇩🇪` / `English 🇬🇧`
im Darstellungsblock direkt unter `Design`. Es teilt dessen48-px-Geometrie.
Deutsch bleibt die bisherige Voreinstellung. Die Auswahl gilt für diese lokale
Browser-/App-Origin, wird unter `tafelraum-ui-language-v1` gespeichert und wirkt
sofort. Blockierter Local Storage verhindert den Wechsel im Fenster nicht.
Andere geöffnete Fenster derselben Origin (insbesondere Room) übernehmen die
Wahl über das normale `storage`-Ereignis. Kein Reload/Remount der Canvasinstanz,
kein Szenen-, Archiv-, Undo- oder Präsentationsbefehl beim Wechsel.

Oberflächentexte, Tooltips, zugängliche Namen, Engine-Sprache, Datumsanzeige,
Material-/Wiedergabesteuerung und Timer folgen der Wahl. Bestehende Tastenkürzel
ändern sich nicht. Dokument-`lang` folgt der UI. Das verknüpfte Label und der native Auswahlwert
tragen den zugänglichen Zustand; Optionsnamen lauten `Deutsch`/`English` ohne
Flagge. Namen stehen sichtbar vor der Flagge, damit die native Buchstabenauswahl
funktioniert. Diese Nutzerpräzisierung ersetzt die früheren reinen Flaggenbuttons.


Titel/Namen im Archiv, Stundennotizen, Canvastexte, Dateinamen, HTML-Pakete und
fremde Anbieterinhalte sind Inhalte und werden nicht übersetzt. Ein bei der
Anlage erzeugter Name bleibt später normaler gespeicherter Inhalt. Native
System-/Druckdialoge folgen weiterhin dem Betriebssystem; eigene native
Menüeinträge verwenden denselben Katalog. Unbekannte externe
oder technische Fehlermeldungen bleiben im Original lesbar.

## Ein gemeinsamer Pfad

- `src/i18n/locale.ts`: begrenzte Werte `de|en`, originlokale Präferenz,
  fehlertoleranter Zugriff und gemeinsames Fensterabonnement.
- `src/i18n/en.json`: englischer Katalog mit überprüfbaren deutschen Quelltexten
  als Schlüsseln. Keine neue Abhängigkeit oder generische DOM-Übersetzung.
- `src/i18n/translate.ts`: `t(Quelltext, ...Werte)` mit positionsgebundenen
  `{0}`-Platzhaltern. Werte sind Daten und werden nicht erneut übersetzt.
  Unbekannte Schlüssel bleiben unverändert; nur eigene Katalogschlüssel lesen.
- `src/i18n/index.ts`: `useUiLocale()` bindet jede lokalisierte React-Komponente
  an die Präferenz, auch Portale/Room und unabhängig von Eltern-Rerenders.
  Bestehende Arrays mit Tool-/Farb-/Designlabels behalten Quelltexte;
  bei der Anzeige übersetzen. Keine Übersetzung beim Modulimport einfrieren.
- `NativeUiLanguage.tsx` reicht die Wahl ausschließlich aus der Lehreransicht
  an den begrenzten Tauri-Befehl `set_ui_language` weiter. Native Menüs und
  eigene Statusdialoge lesen denselben beim Kompilieren eingebetteten Katalog.
  Keine zweite persistierte Sprachwahl, kein Neustart oder Menü-Neuaufbau.
- `LanguageSettings.tsx` bleibt in den gemeinsamen Einstellungen, außerhalb
  des persönlichen Distributionsadapters. Beide Profile haben dieselbe Sprache.
- Die Engine erhält den aktuellen `en-GB`/`de-DE`-Code; das Stundenformat baut
  seinen Datumformatter mit derselben Sprache. Keine globale Engine-/Datenkopie.

Neue UI-Texte direkt mit `t` ausgeben und den Katalog ergänzen. Zusammengesetzte
Sätze als einen Quelltext mit Platzhaltern pflegen, keine Wort-für-Wort-Ersetzung.
Eigene Fehlerzustände möglichst als Quelltext speichern und bei der Anzeige
übersetzen; Fehlerdetails/Daten nicht als UI-Schlüssel behandeln. Fachliche
Inhalte nie wegen ihres Textes als übersetzbar einstufen.

Der Agenteneinstieg liefert zusätzlich zum kompatiblen fertigen `prompt` einen
`promptTemplate` und `promptValues`. Derselbe kanonische Startauftrag wird im
Dialog übersetzt; Pfad, Node-Laufzeit, Appadresse und lesender Auftrag bleiben
identisch. Keine Sprachroute, zusätzliche Zugriffsrechte oder Paketkopie.
Die mitgelieferten ausführlichen Arbeitsanleitungen bleiben derzeit deutsch.

## Prüfweg und Grenzen

- `npm test`: Präferenz einschließlich blockiertem Speicher, Fensterereignis,
  unbekannten Werten und Platzhalterkonsistenz; vorhandene App-/Archivprüfungen.
- `npm run test:ui-language`: echte Lehrer-/Room-Oberflächen in Chromium und
  WebKit mit eigenem leeren Archiv und neutralen Fixtures. Enthält unmittelbaren
  Wechsel, Namen die UI-Schlüsseln gleichen, Datum, Agentenprompt, Tooltips,
  Hell/Dunkel, Shortcuts, Stiftpalette, unveränderten archivierten Strich,
  bereits geöffnetes Room-Fenster, Reload, Tastatur, 48-px-Sprachziele und die
  native Sprachbrücke mit isoliertem Tauri-Adapter.
  Bestandteil von `test:browser`; keine privaten APIs/Daten/Modelle erforderlich.
- Screenshots/Report unter `output/ui-language-browser/`; öffentlicher Export
  und dessen eigene Prüfbelege unter `output/ui-language-public/`.
- Typprüfungen für App/Live, App-/Room-Tests und Webbuild vor Übergabe durchführen.
  Der öffentliche Export wird mit seinen festen Ausschlüssen separat geprüft.
- `cargo test --lib` prüft auch die native Menücopy aus dem gemeinsamen Katalog
  in beide Richtungen. Keine native App geöffnet oder installiert; Sichtabnahme
  der Menüleiste im neuen nativen Paket bleibt separat.

Desktopbelege bestätigen keine native Neuinstallation, reale Touch-/Stiftabnahme,
Druckabnahme oder Übersetzung von Unterrichtsmaterialien. Die installierte 0.1.88
und der öffentliche Updatekanal bleiben eigenständige geprüfte Stände.

## Quellenabgleich beim Abschluss

Die parallel beauftragte gemeinsame UI-Bereinigung entfernt ausschließlich den
ungenutzten `dismiss_24_regular.svg`-Import samt `toolbarClose`-Einträgen aus
`FluentToolbarIcon.tsx`. Keine neue Geometrie oder Änderung der verbliebenen
Originalpfade. Nach genauem Vergleich ist der Hash dieses Hostmoduls im bestehenden
`third-party/source-distribution.json` aktualisiert; Originalnotice und sämtliche
übrigen 32 Herkunftsnachweise bleiben erhalten. Kein Abschalten des Buildchecks.

Der spätere Nutzerauftrag ersetzt reine Flaggen und geteilte Versionszeile
durch den eigenen Dropdown-Eintrag `Sprache`, wie oben beschrieben.
Sprachwahl und Version besitzen wieder jeweils eine vollständige Menüzeile.

### Sprachwahl und Versionsanzeige trennen

Die Sprachwahl steht als eigene Zeile unter `Design` im Darstellungsblock.
Die bisherige Nachbarschaft zu `Version` vermittelte fälschlich eine Wahl
zwischen Programmversionen. Version öffnet weiterhin ausschließlich die
Versionsinformationen; Deutsch/Englisch verändert weiterhin nur die UI-Sprache.
Kein neuer Zustand, kein anderer Distributions- oder Speicherpfad.
