# Auslieferungsnachweise: Schriften, Laufzeiten und eigene Assets

Stand 29.10.2026, D-321. Technische Fortsetzung von
[Prüfstand51](51_LICENSE_EVIDENCE.md). Originaltexte und belegbare Herkunft
ergänzen; keine Tafelraum-Lizenz einsetzen oder fremde Bestandteile umlizenzieren.
Fortschreibung: [Passende Liberation-Quelle, HTTP-Abruf und Abschluss54](54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md).

Fortschreibung D-324: [Prüfstand55](55_PROJECT_LICENSE_AND_PUBLIC_IDENTITY.md)
setzt die gewählten Projektbedingungen und den JUJIES-Kontakt um. Eigene
Iconherkunft ist vom Projektinhaber als ImageGen bestätigt; Original-
Fremdbedingungen und deren Verteilungsprüfung bleiben eigenständig.

## Webschriften und Icons

Excalidraw0.18.1 enthält234 WOFF2-Dateien in neun Familien. Alle234 lokalen
Dateien stimmen über Git-Blob-Hashes mit dem offiziellen Commit
`a2ec2889babf7d2295469c6d90ebe77fae57df84` (Tag `v0.18.1`) überein.
Der Lehrerbuild bündelt derzeit vier Assistant-Dateien; die anderen
Excalidraw-Schriften lädt dieser bestehende Laufzeitpfad bei Bedarf vom CDN.
Der Teilnehmerbuild liefert234 Dateien unter `fonts/` sowie die vier über CSS
eingebundenen Assistant-Assets lokal aus. Dieser Auftrag ändert keinen Ladepfad.

| Familie | Version aus der Schrift | Beleg |
| --- | --- | --- |
| Assistant |3.000 | OFL-Text von Google Fonts; Copyright entspricht eingebetteten Namen. |
| Cascadia Code |2005.150 | OFL-Original aus Microsofts Tag `v2005.15`; generischer Microsoft-Text im Namensfeld wird zusätzlich erhalten. |
| Comic Shanns |1.3.0 | Vollständiger MIT-Text einschließlich aller fünf Copyrightzeilen im ursprünglichen Excalidraw-Fontkommentar. |
| Excalifont |1.000 | Vollständiger OFL-Text und Copyright im ursprünglichen Excalidraw-Fontkommentar. |
| Liberation Sans |1.05 | Original-`License.txt` und GPL-v2-`COPYING` aus dem inzwischen zugeordneten1.04.93-Quellpaket, keine pauschale OFL-Zuordnung. |
| Lilita One |1.002 | OFL-Original von Google Fonts; ursprüngliche Reserved-Font-Name-Angabe zusätzlich in den eingebetteten Namen erhalten. |
| Nunito |3.602 | OFL-Original von Google Fonts, passende Projekt-Copyrightzeile. |
| Virgil |001.001 | OFL-Original des Virgil-Projekts und vollständige eingebettete Lizenz-/Copyrightangaben. |
| Xiaolai |3.11 | OFL-Original des Kose-/Xiaolai-Projekts und ursprüngliche eingebettete Copyrightangabe. |

Unter `public/licenses/excalidraw/` liegen Texte und die tatsächlich ausgelesenen
Namensfelder. Das Paket-MIT und der originale Fluent-System-Icons-MIT-Text
liegen ebenfalls im öffentlichen Ressourcenpfad. Zunächst13 Nachweisdateien; seit D-323 insgesamt17 einschließlich der passenden Quellpaketdateien.
[web-provenance.json](../../prototypes/surface-shell-a-b/public/licenses/web-provenance.json)
enthält Paketversionen, Quellen/Blob-IDs, Texthashes und jede konkrete Schriftdatei.
Textzeilenenden sind auf LF normalisiert; Wortlaut und Copyrights bleiben
erhalten. Bei Comic Shanns und Excalifont ist der vollständige ursprüngliche
Metadatenkommentar als Auszug gekennzeichnet, nicht als eigenständige Originaldatei.

Originalquellen:
[Excalidraw-Fonts im geprüften Commit](https://github.com/excalidraw/excalidraw/tree/a2ec2889babf7d2295469c6d90ebe77fae57df84/packages/excalidraw/fonts),
[Google Fonts](https://github.com/google/fonts),
[Cascadia-Lizenz](https://github.com/microsoft/cascadia-code/blob/v2005.15/LICENSE),
[Virgil](https://github.com/excalidraw/virgil/blob/main/LICENSE.md),
[Xiaolai](https://github.com/lxgw/kose-font/blob/master/OFL.txt),
[Fluent](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE).

**Quellzuordnung seit D-323:** Der passende1.04.93-Quellstand ist anhand aller675
Glyphen, Hintprogramme, Zeichenbelegung und Metriken der enthaltenen1.05-Schrift
zugeordnet. Originalquellen, Distributionspatch und Deskriptor liegen bei den
Notices. Ausführliche Grenzen und Wiederholung in
[Prüfstand54](54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md). Der frühere offene
Quellzugang ist damit technisch konkret ergänzt; Originalbedingungen und
Gesamtlizenzprüfung bleiben eigenständig.

## Wiederholbarer Buildschutz

```sh
node scripts/check-web-license-notices.mjs
node scripts/check-web-license-notices.mjs --built app
node scripts/check-web-license-notices.mjs --built live
```

Der Helfer liest nur. Er prüft Paketversionen, vollständige Schrift-/Familienliste,
zugeordnete Notices und Texthashes. Nach dem Build müssen Manifest und alle17
Nachweis-/Quelldateien unverändert vorliegen. Jede tatsächlich gebündelte WOFF2-Datei benötigt
einen bekannten Hash; Remote zusätzlich alle234 vereinbarten lokalen Dateien.
`npm run build` und `npm run build:live` führen die passenden Vor-/Nachprüfungen
automatisch aus. Direkte Vite-Aufrufe umgehen npm-Hooks. Der Teilnehmerplugin
kopiert gezielt diese Notices, nicht das gesamte Lehrer-`public/`-Verzeichnis.

Die Prüfung bestätigt Vorhandensein und Integrität, keine juristische Freigabe.
Bei einem bewussten Versions-/Schriftwechsel Originale neu prüfen und Manifest
gezielt fortschreiben; der Build generiert seine eigenen Belege nicht neu.

## Gebündelte Laufzeiten

- **Public Mac Node22.23.4:** Der vollständige originale
  [LICENSE-Text einschließlich Unterkomponenten](https://github.com/nodejs/node/blob/v22.23.4/LICENSE)
  liegt unter `runtime-licenses/node/`. Er ist der tatsächlich vorbereiteten
  Desktop-Nodeversion zugeordnet, nicht automatisch einer beliebigen PATH-Version.
- **Public Windows Node24.22.2:** Der Plattformadapter übernimmt die vollständige
  originale LICENSE aus dem anhand des offiziellen SHA256 geprüften Node-ZIP und
  dokumentiert die tatsächlich gebündelten Binär-/Lizenzhashes. Die bewusst
  getrennten Plattformpins stehen in `scripts/desktop-node-runtime.json`.
  Mac bleibt wegen seiner bestehenden Mindestversion auf Node22 LTS; Node24
  benötigt dort macOS13.5. Persönliche bereits ausgelieferte Pakete werden durch
  diese öffentliche Buildvorbereitung nicht verändert.
- **LibreOffice26.8.1 ARM64:** Im vorhandenen Apppaket liegen `Resources/LICENSE`,
  `Resources/LICENSE.html` und `Resources/NOTICE` bereits vollständig. Die App
  enthält außerdem62 lizenzbenannte Dateien und128 TTF-/OTF-Dateien. Diese Zählung
  ist kein vollständiger Rechteabgleich. Die bestehenden verschachtelten Texte
  bleiben durch die unveränderte vollständige Appkopie erhalten.

`runtime-licenses/*/provenance.json` hält Quellen, Versionen und die geprüften
Roottexthashes fest. `prepare-desktop-resources.sh` ruft nach dem bestehenden
Laufzeitkopieren `prepare-runtime-notices.mjs` auf. Dieser prüft die tatsächliche
Nodeversion und den Node-Lizenztext, Office-Spezifikation und die drei kopierten
Office-Roottexte; danach ergänzt er `runtime/licenses/NODE-LICENSE` und die
Nachweise. Versionswechsel oder fehlende/veränderte Texte brechen ab.

Historischer Beleg des ursprünglichen Roottext-Auftrags: Die drei Office-Texte
wurden aus dem damaligen Originalpaket separat geprüft; damals wurde keine neue
native App gebaut und Node blieb22.18.0. Die aktuelle öffentliche Laufzeitwahl
steht oben und in der Plattformpin-Datei. Weitere Binär-/Quellpflichten von
LibreOffice, Rust und Modelllaufzeiten sind keine durch diese Rootprüfung
erteilte Freigabe.

## Eigene Bilder und Markenassets

| Assetgruppe | Belegbarer Stand | Noch offen |
| --- | --- | --- |
| Neutrales Transport-Demo | Erzeugungsprompt und Herkunft in [Asset-README](../../prototypes/surface-shell-a-b/src/assets/demo/README.md). | Seit D-324 unter den eigenen Projektbedingungen, soweit entsprechende Rechte bestehen. |
| Native Appicons | `src-tauri/app-icon.png` ist die kanonische Quelle; Tauri erzeugt die Plattformfassungen. Auswahl des Motivs ist durch D-197/D-199 und die Abnahmen16/17 belegt. | ImageGen-Herkunft seit D-324 vom Projektinhaber bestätigt; konkrete Datei und Grenze der Bestätigung in ASSET_PROVENANCE.md. |
| Web-SVG und Web-PNGs | `public/tafelraum-icon.svg` und `public/icons/` liegen im ersten Quellimport vor. SVG-Pfade sind sichtbar. | Eigene Projekticons nach Bestätigung des Projektinhabers; kein unabhängig rekonstruierter Generierungs-/Vektorisierungsverlauf. |
| Lerndeck-SVG | Drei vorhandene Zeichenpfade unter `public/apps/lerndeck.svg`; seit erstem Quellimport vorhanden. | In der seit D-324 bestätigten Gruppe eigener Projekticons erfasst; Bestätigung und konkrete Datei dokumentiert, keine Fremdmarkenrechte daraus ableiten. |
| Frühere Unterrichtsmockups | Bereits aus aktuellem Quellkandidaten ausgeschlossen. | Bestehende private Git-Historie weiterhin nicht ungeprüft hochladen. |

Der bestehende Gitverlauf beginnt für diese Icondateien mit dem gemeinsamen
Initialimport. Seit D-324 liegt zusätzlich die Erklärung des Projektinhabers vor;
[ASSET_PROVENANCE.md](../../ASSET_PROVENANCE.md) hält sie mit Hashes fest.
Keine frühere Erstellungshistorie erfunden, keine Fremdrechte zu eigenen erklärt
und kein Motiv neu entworfen oder ausgetauscht.

## Lokaler Quellkandidat und Prüfgrenzen

Der vorhandene [Exportweg](49_PUBLIC_SOURCE_PREPARATION.md) bleibt maßgeblich.
Ein neuer Kandidat unter `output/public-readiness-next/source/` enthält neue
Notices und Quellcode, keine installierten Abhängigkeiten, Archive, Laufzeiten
oder private Git-Historie. Für einen echten Checkout-Test wird eine getrennte
Verifikationskopie lokal initialisiert und mit `npm ci` eingerichtet; der
unveränderte Kandidat bleibt ohne `.git` und ohne Remote.

Der anschließende [Security-Sweep53](53_PUBLIC_SOURCE_SECURITY_SWEEP.md) ergänzt
Profilpfade mit Leerzeichen, gezielte Dependencyupdates und den neuen Auditstand.

Prüfberichte/Logs liegen ignoriert unter `output/public-readiness-next/`.
Die fünf neuen Regressionen prüfen Verlust von Buildtexten, Paket-/Fontwechsel,
falsche Familienzuordnung und fehlende Laufzeittexte; `npm test` führt sie mit aus.
Zusätzlich sind Webbuilds, Browser-Kernsuite, lokaler Secret-Scan und Manifest-
Hashabgleich vorgesehen. Ein Secret-Scanner belegt keine vollständige Anonymität.
Projektbedingungen, öffentlicher JUJIES-Auftritt und eigene Iconherkunft sind
mit D-324 umgesetzt. Abschließende konkrete Lizenzkombinations-/Verteilungsprüfung
und endgültiger öffentlicher Dokuumfang bleiben getrennte Aufgaben.
