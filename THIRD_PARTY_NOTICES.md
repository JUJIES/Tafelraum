# Drittanbieter und Assetherkunft

Stand: 29.10.2026. Zentrales Einstiegsinventar für den vorhandenen Quellstand.
Die Angaben unten wurden aus den installierten Paketmetadaten, Lockfiles und
vorhandenen Notices übernommen. Sie vergeben keine Lizenz für Tafelraum selbst.
Für eigene Anteile gilt [MIT mit Commons Clause1.0](LICENSE).
[Eigene Assetherkunft](ASSET_PROVENANCE.md) und Fremdbedingungen bleiben getrennt.

## Direkte npm-Abhängigkeiten

`dependencies` werden von App bzw. Live-Dienst genutzt; `devDependencies` dienen
Entwicklung, Build und Prüfung. Die vollständigen Auflösungen stehen in den
[App-](prototypes/surface-shell-a-b/package-lock.json) und
Dienst-Lockfiles (persönlicher Bestandteil, nicht im öffentlichen Quellstand).
Der Aufnahme-Relay besitzt keine externen npm-Abhängigkeiten.

| Paket | Geprüfte Version | Lizenz laut Paket | Verwendung |
| --- | --- | --- | --- |
| [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | 0.18.1 | MIT | App, dependencies |
| [@fluentui/svg-icons](https://github.com/microsoft/fluentui-system-icons) | 1.1.339 | MIT | App, dependencies |
| [@tauri-apps/api](https://github.com/tauri-apps/tauri) | 2.11.1 | Apache-2.0 OR MIT | App, dependencies |
| [lucide-react](https://github.com/lucide-icons/lucide) | 1.37.0 | ISC | App, dependencies |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | 6.3.289 | Apache-2.0 | App, dependencies |
| `polygon-clipping` | 0.15.7 | MIT | App, dependencies |
| `qrcode` | 1.5.4 | MIT | App, dependencies |
| [react](https://github.com/react/react) | 19.2.8 | MIT | App, dependencies |
| [react-dom](https://github.com/react/react) | 19.2.8 | MIT | App, dependencies |
| `rrweb` | 2.2.0 | MIT | App, dependencies |
| [@tauri-apps/cli](https://github.com/tauri-apps/tauri) | 2.11.4 | Apache-2.0 OR MIT | App, devDependencies |
| [@types/qrcode](https://github.com/DefinitelyTyped/DefinitelyTyped) | 1.5.6 | MIT | App, devDependencies |
| [@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped) | 19.2.18 | MIT | App, devDependencies |
| [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped) | 19.2.5 | MIT | App, devDependencies |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 6.1.1 | MIT | App, devDependencies |
| [playwright](https://github.com/microsoft/playwright) | 1.64.1 | Apache-2.0 | App, devDependencies |
| [typescript](https://github.com/microsoft/TypeScript) | 7.0.2 | Apache-2.0 | App, devDependencies |
| [vite](https://github.com/vitejs/vite) | 8.2.4 | MIT | App, devDependencies |
| [ws](https://github.com/websockets/ws) | 8.21.3 | MIT | Live-Dienst, dependencies |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped) | 24.13.3 | MIT | Live-Dienst, devDependencies |
| [@types/ws](https://github.com/DefinitelyTyped/DefinitelyTyped) | 8.18.1 | MIT | Live-Dienst, devDependencies |
| [typescript](https://github.com/microsoft/TypeScript) | 5.9.3 | Apache-2.0 | Live-Dienst, devDependencies |

## Übernommene und mitgelieferte Teile

| Teil | Herkunft / vorhandener Hinweis | Noch zu beachten |
| --- | --- | --- |
| Fluent-Icongeometrie | [NOTICE samt vollständigem MIT-Text](prototypes/surface-shell-a-b/src/icons/NOTICE.md) | Bei Quell-/Bundleübernahme erhalten. |
| rrweb | [MIT-Text im öffentlichen Ressourcenpfad](prototypes/surface-shell-a-b/public/licenses/rrweb-2.2.0-MIT.txt) | Die hier eingebundene Version ist 2.2.0. |
| DocRes-Adapter | [Mitgelieferter MIT-Text](prototypes/surface-shell-a-b/document-image/LICENSE.DocRes), [Upstream](https://github.com/ZZZHANG-jx/DocRes) | Private Pythonlaufzeit und Modellgewichte werden nicht vom Quellrepository mitgeliefert; deren Weitergabe separat prüfen. |
| Neues Transport-Demo | [Herkunft und ImageGen-Prompt](prototypes/surface-shell-a-b/src/assets/demo/README.md) | Eigene Projektbedingungen gelten, soweit Rechte bestehen; keine Freigabe des alten Motivs daraus ableiten. |
| App-/Webicons und Lerndeck-SVG | [Getrennte Herkunfts-/Rechtematrix](docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md) | ImageGen-Herkunft vom Projektinhaber bestätigt; konkrete Dateien und Grenzen in [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md). |
| Excalidraw-Fonts und PDF.js-WASM | [Schriftnachweise/Originaltexte](docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md), [PDF.js-Notices](docs/implementation/51_LICENSE_EVIDENCE.md) | 234 Schriftdateien zu neun Familien belegt; Originaltexte im Lehrer-/Teilnehmerbuild geprüft. Passende Originalquellen der Liberation1.05-Schrift sind jetzt beigefügt; Gesamtlizenzprüfung bleibt eigenständig. |
| LibreOffice-Konverter | [Gepinnte Quelle/Hashes](prototypes/surface-shell-a-b/office-import/runtime.json), [Betrieb](docs/implementation/39_DOCX_IMPORT_TEST.md) | Laufzeit liegt außerhalb von Git. Bundle enthält fremde Komponenten und deren Lizenzen; nicht unter die künftige Tafelraum-Lizenz umdeklarieren. |

## Native und transitive Abhängigkeiten

Die nativen direkten Abhängigkeiten und Versionsauflösungen stehen in
[Cargo.toml](prototypes/surface-shell-a-b/src-tauri/Cargo.toml) und
[Cargo.lock](prototypes/surface-shell-a-b/src-tauri/Cargo.lock). Der bisherige
[Uploadaudit](docs/implementation/48_GITHUB_UPLOAD_AUDIT.md) hält den Umfang der
lokal geprüften Rust-Metadaten und deren Lücken fest.

Dieses Inventar ist keine vollständige Liste aller transitiven Lizenzen oder
aller in einer fertigen App enthaltenen Schriften, WASM-Dateien und Laufzeiten.
Quellrepository und Binärdistribution getrennt prüfen. Die vorhandenen
Originaltexte bleiben maßgeblich; Lizenztexte nicht durch diese Übersicht ersetzen.

Bei bewussten Dependencyupdates Version/Lizenz dieser Übersicht und betroffene
Original-Notices überprüfen. Bei neuen kopierten Assets Quelle und Lizenz direkt
am Asset dokumentieren und hier verlinken. Keine ungeklärten Unterrichtsmaterialien
als technische Fixtures übernehmen.


MIT mit Commons Clause1.0 ist für eigene Anteile lokal eingesetzt.
Der [Lizenzplan](docs/implementation/50_LICENSING_PLAN.md) hält den Geltungsbereich
und die verbleibende Prüfung fest. Fremdcode wird dadurch nicht umgelizenziert.


## Technische Evidenz fortgeschrieben

Der [Evidenzworkflow](docs/implementation/51_LICENSE_EVIDENCE.md) erfasst jetzt
412 npm-Lockfileeinträge und alle 518 Cargo-Drittanbieterpakete. Die frühere
Cargo-Metadatenlücke ist geschlossen; vollständige rechtliche Einordnung bleibt
offen. Sieben originale [PDF.js-/WASM-Lizenztexte](prototypes/surface-shell-a-b/public/licenses/pdfjs-dist/provenance.json)
werden mit der App-Weboberfläche ausgeliefert. Der normale Appbuild prüft
Version, Vollständigkeit und unveränderte Texte vor und nach dem Build.

## Schriften und native Laufzeiten fortgeschrieben

[Prüfstand52](docs/implementation/52_DISTRIBUTION_NOTICES_AND_ASSETS.md) hält
die ursprünglich13 Webnachweisdateien, die konkret zugeordneten234 Fonts und die
Buildprüfungen fest. Liberation Sans1.05 wird mit GPL-v2-/Ausnahmetexten erfasst,
nicht pauschal als OFL. Quellzugang inzwischen nach Prüfstand54 konkret ergänzt; Weitergabebedingungen separat beachten.
Der vollständige Node22.18.0-Lizenztext wird künftig mit den Desktopressourcen
kopiert; vorhandene LibreOffice26.8.1-Roottexte werden gegen Hashbelege geprüft.
Dies ergänzt Notices, ersetzt keine vollständige Lizenzkombinationsprüfung
und ersetzt keine Gesamtprüfung der Drittanbieter-Verteilungsbedingungen.

[Prüfstand53](docs/implementation/53_PUBLIC_SOURCE_SECURITY_SWEEP.md) dokumentiert
die gezielten Dependency-Sicherheitsupdates, versionsspezifische Overrides
und die damaligen niedrigen Audit-Einträge.

[Prüfstand54](docs/implementation/54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md)
ordnet den genauen Liberation-Quellstand zu und liefert ihn samt Patch/Deskriptor
mit aus.17 Webnachweis-/Quelldateien werden im Build geprüft und über den lokalen
Teilnehmerdienst getestet. Ein KaTeX0.18.2-Override beseitigt die zuletzt vier
niedrigen Audit-Einträge; aktuelle Auflösung0 Einträge. Projektbedingungen
anschließend mit [D-324](docs/implementation/55_PROJECT_LICENSE_AND_PUBLIC_IDENTITY.md) eingesetzt.


## Eigene Projektbedingungen

[Prüfstand55](docs/implementation/55_PROJECT_LICENSE_AND_PUBLIC_IDENTITY.md)
hält die Entscheidung für JUJIES, die Projektadresse und MIT mit Commons Clause
fest. Die drei npm-Pakete und Cargo verweisen auf die vollständige Root-Lizenz.
Beide Webbuilds liefern unter `licenses/tafelraum/` dieselben Bedingungen und
den Herkunftsnachweis eigener Assets aus. Der eigene Buildcheck prüft die
Bytegleichheit; Fremdtexte und deren Verteilungsbedingungen bleiben eigenständig.


## Abschluss für den ersten Quellkandidaten

[SOURCE_DISTRIBUTION.md](SOURCE_DISTRIBUTION.md) grenzt den konkret ausgewählten
Quellumfang von späteren Binärpaketen ab.33 mitgelieferte Drittdateien/-Nachweise
sind mit Hashes erfasst; die Bibliotheksquellen aus npm/Cargo werden nicht in den
Quellkandidaten kopiert. Der Abgleich und die öffentliche Dokumentauswahl sind
für diesen Umfang ausgeführt; [Prüfstand58](docs/implementation/58_PUBLIC_SOURCE_CANDIDATE.md)
führt die konkrete Generalprobe. Weitere Binär-/Runtimefreigaben werden dadurch
nicht vorweggenommen.

## Arbeitsblattreferenzen (30.10.2026)

Der gemeinsame Agenteneinstieg enthält jetzt 13 vollständige HTML-/CSS-Referenzen
mit lokalen Assets und zentraler Layoutorientierung. Herkunft und gesonderte
Bild-/Iconlizenzen stehen im [Referenznachweis](docs/agent-references/PROVENANCE.md).
Eigene Inhalte folgen der Projektlizenz; CC-BY-SA-/ISC-Fremdanteile behalten
ihre jeweiligen Bedingungen. Technische Beispiele bleiben separat.
