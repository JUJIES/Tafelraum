# Umfang des ersten öffentlichen Quellstands

Dieser Abgleich gilt für den bereinigten **Quellrepository-Kandidaten**. Er
enthält keine fertige Desktop-App, `node_modules`, Cargo-Caches, LibreOffice,
privaten Pythonlaufzeiten, Modellgewichte oder Unterrichtsarchive.

## Tatsächlich mitgelieferte Drittbestandteile

| Gruppe | Originalbedingungen / Nachweis | Einordnung |
| --- | --- | --- |
| Fluent-SVG-Geometrien in den Iconkomponenten | Vollständiger MIT-Text samt Copyright in `src/icons/NOTICE.md` | Originalgeometrien behalten MIT; eigene Hostlogik wird davon getrennt behandelt. |
| Excalidraw-/Fluent-/rrweb-Notices und Schrifttexte | Originaltexte und Herkunftsmanifeste unter `public/licenses/` | Der Quellstand enthält die Notice-Dateien, keine kopierte Excalidraw-Fontbibliothek. Die späteren Webbuilds beziehen Fonts aus der gepinnten npm-Abhängigkeit. |
| Liberation-Originalquellen | GPL-v2-/Ausnahmetexte, SFD-Quellarchiv, Debianpatch und Deskriptor | Unveränderte Quellen und Texte bleiben unter ihren eigenen Bedingungen. Herkunft und Vergleich in Prüfstand54; keine zusätzliche Verkaufseinschränkung auf diese Quellen. |
| PDF.js-/WASM-Notices | Sieben Originaltexte mit Versions-/Hashmanifest | Keine PDF.js-/WASM-Binaries im Quellrepository; die Buildprüfungen kontrollieren die spätere Einbindung. |
| Node-Runtimelizenz | Vollständiger Originaltext unter `runtime-licenses/node/` | Der Node-Binärprozess wird nicht im Quellrepository mitgeliefert. |
| LibreOffice-/DocRes-Hinweise | Gepinnte Runtime-Provenienz bzw. ursprünglicher MIT-Text | Fremde Programme/Modelle bleiben außerhalb dieses Quellumfangs; ein späteres Apppaket hat zusätzliche Pflichten. |

Die konkret mitgegebenen 33 Datei-/Text-/Quellnachweise sind in
[source-distribution.json](third-party/source-distribution.json) mit SHA-256
erfasst. `node scripts/check-source-distribution.mjs` prüft sie lesend und läuft
auch vor den beiden Webbuilds. Zusammen mit den bestehenden PDF-/Web-/Projekt-
Lizenzchecks schützt dies Originaltexte und die konkrete Herkunftszuordnung.
Das zentrale [Inventar](THIRD_PARTY_NOTICES.md) führt zu den vollständigen Texten.

## Abhängigkeiten und Lizenzgrenzen

Die npm-Lockfiles und `Cargo.lock` verweisen auf die aufgelösten Abhängigkeiten.
Deren Bibliotheksquellen/Binaries sind nicht in diesen Quellkandidaten kopiert.
Ein bloßer MPL-/LGPL-Eintrag in einer Abhängigkeit ist deshalb kein Nachweis,
dass der Quellrepository-Upload diese Bibliothek unter den eigenen Bedingungen
verteilen würde. Eigene MIT-/Commons-Clause-Bedingungen ersetzen keine Fremdlizenz.

Für spätere gebaute Apps und Webbundles ist die tatsächlich ausgelieferte
Zusammensetzung erneut maßgeblich. Beispielsweise bleiben MPL-Dateien unter MPL;
bei gebauten MPL-Anteilen ist der geforderte Quellzugang zu berücksichtigen.
Siehe die [Mozilla-FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/). Die vorhandenen
Notices sind kein pauschaler Abschluss jeder künftigen Binärdistribution.

## Eigene Assets und Dokumentauswahl

Die eigenen Icons und das neutrale Demo sind in [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md)
zugeordnet. Das alte `desktop-shell/icon.png` ist bytegleich zum bereits erfassten
192px-Webicon. Native Plattformicons sind bestehende Tauri-Ableitungen des
kanonischen eigenen Motivs; keine zusätzliche fremde Bildgruppe wurde gefunden.

`public-source.json` legt die öffentliche Dokumentauswahl fest. Allgemeine
Anleitungen, Bereichsverträge, UI-Briefe und technische Entscheidungshistorie
bleiben enthalten. Persönliche Unterrichtsfallkarten sind ausgeschlossen;
Installationschronik und ausgewählte alte Einzelabnahmen erhalten klar bezeichnete
öffentliche Kurzfassungen. Das private Original bleibt im Arbeitsbaum erhalten.

Dieser konkrete Quellabgleich hat keinen zusätzlichen ungeklärten mitkopierten
Fremdcode-/Bildbestand ergeben. Er ist eine begrenzte technische und dokumentierte
Prüfung des ausgewählten Umfangs, keine Garantie für unbekannte Rechte Dritter.
Ein späterer Upload braucht den ausdrücklichen Auftrag; diese Vorbereitung
legt kein GitHub-Repository an und verändert die bisherige private Historie nicht.

D-330: Der öffentliche Export enthält keine persönliche Lerndeck-/KI-Anbindung,
keinen Remote-Dienst/Viewer und keinen JUJIES-Updatekanal. Gemeinsame Room-/
Materialverträge bleiben enthalten. Funktionsauswahl und Nachweise beschreibt
[Vertrag61](docs/implementation/61_DISTRIBUTION_BOUNDARY.md).
