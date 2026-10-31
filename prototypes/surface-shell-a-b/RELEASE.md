# Eigene Desktopfassung bauen

Dieser öffentliche Quellstand enthält keinen offiziellen JUJIES-Updatekanal,
keine persönlichen Integrationen und keinen Remote-Dienst/Teilnehmerbuild.
Room Canvas und der lokale Kern bleiben enthalten. Der Maintainer-Build und
sein Kollegen-Updatekanal haben einen getrennten Umfang; diese Anleitung
veröffentlicht oder installiert nichts.

Für Browserstart und Tests zuerst `CONTRIBUTING.md` im Repository-Root verwenden.
Der bisherige native Ressourcenweg ist macOS/ARM64-spezifisch. Windows/Linux
benötigen eigene Paket-/Laufzeitabnahmen, keine zugesagte Plattformunterstützung.
Rust/Tauri, Xcode-Werkzeuge und die versionierten lokalen Laufzeiten sind für
native Builds zusätzlich erforderlich.

Aus dem Appverzeichnis:

```sh
node ../../scripts/check-distribution.mjs
npm ci
npm run prepare:desktop
cd src-tauri
cargo test --locked --lib
```

`prepare:desktop` baut das Webbundle und stellt den lokalen Node-Dienst sowie
LibreOffice mit Original-Lizenzen bereit. Fehlende LibreOffice-Buildabhängigkeiten
werden aus der gepinnten offiziellen Quelle bezogen; persönliche Dienste oder
Schlüssel sind nicht erforderlich. Der derzeit nachgewiesene Bundle-Node ist22.18.0;
ein anderer Node benötigt zunächst aktualisierte vollständige Lizenznachweise.
Die Testbefehle verwenden Node24 gemäß Entwicklerleitfaden.

Mit vorbereiteten Voraussetzungen kann die Tauri-CLI anschließend ein eigenes
Appbundle bauen. Erst einen getrennten Testbuild mit eigener Appkennung, Port
und Archiv prüfen; die produktive Maintainerinstallation ist kein Testziel.
Eigenes Signieren/Verteilen und eine eigene Updateinfrastruktur sind separate
Entscheidungen. Hier sind keine persönlichen Publisher oder Signaturschlüssel
enthalten. Unsignierte Eigenbauten sind keine offiziellen JUJIES-Pakete.

`docs/implementation/61_DISTRIBUTION_BOUNDARY.md`
und `THIRD_PARTY_NOTICES.md` im Repository-Root beschreiben Umfang und Grenzen.
