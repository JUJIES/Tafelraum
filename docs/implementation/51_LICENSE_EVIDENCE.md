# Wiederholbare Lizenzevidenz und PDF.js-Notices

Stand 29.10.2026. Drei technische Vorarbeiten zur gewünschten Lizenzrichtung.
Keine neue Projektlizenz, keine Kompatibilitäts- oder Veröffentlichungsfreigabe.
Fortsetzung: [Schriften, Runtime-Notices und Assetmatrix52](52_DISTRIBUTION_NOTICES_AND_ASSETS.md).

## 1. Vollständige Metadaten statt einer Cargo-Cache-Stichprobe

Vom Root, mit Node >=22.18, Cargo und installierten npm-Abhängigkeiten:

```sh
mkdir -p output/license-review
cargo metadata --locked --format-version 1 \
  --manifest-path prototypes/surface-shell-a-b/src-tauri/Cargo.toml \
  > output/license-review/cargo-metadata.json
node scripts/audit-dependency-licenses.mjs \
  output/license-review/cargo-metadata.json output/license-review/inventory.json
```

Cargo darf fehlende gepinnte Pakete herunterladen; `--locked` verhindert eine
stille Lockfileänderung. Rohmetadaten enthalten lokale Cachepfade und bleiben
unter ignoriertem `output/`. Der Inventarhelfer liest beide npm-Lockfiles und die
vollständig aufgelösten Cargo-Metadaten. Das Berichtziel darf nicht existieren.
Er ändert keine Abhängigkeiten, Lizenztexte oder Projektkonfiguration.

Aktuelle Auflösung: **412 npm-Lockfileeinträge und 518 Cargo-Drittanbieterpakete**.
Alle 518 Cargo-Pakete besitzen nun eine Lizenzexpression. Die frühere Lücke der
205 nicht lokal vorhandenen Metadaten ist damit geschlossen. Das umfasst auch
andere Zielplattformen und Entwicklungsabhängigkeiten, nicht nur die Mac-App.

Bei npm fehlen zwei maschinenlesbare Expressions: `fuzzy` und `khroma`.
Ihre lokalen Original-Lizenzdateien sind vorhanden; der Helfer erfindet dafür
keine SPDX-Angabe. Der frühere Audit hat die Texte als MIT eingeordnet. Insgesamt
besitzen 174 Einträge keine vom Helfer gefundenen lokalen Root-Lizenzdokumente;
dazu gehören u.a. nicht installierte optionale Plattformpakete. Die Zahl ist
kein Befund „174 unlizenzierte Pakete“. Metadaten, tatsächliche Dateien und
Rechteprüfung bleiben getrennte Größen.

Der Bericht enthält Namen, Versionen, deklarierte Lizenzen, npm-Flags und
Hashes gefundener Root-Lizenzdateien. Keine absoluten Cachepfade oder Textkopien
in den Metadaten. Eine nicht passende installierte Paketversion wird nicht als
Lizenzquelle für einen anderen Lockfileeintrag verwendet. Workspace-eigener
Code wird nicht als Drittanbieter-Crate gezählt.

## 2. Originaltexte der ausgelieferten PDF.js-WASM-Komponenten

Unter `prototypes/surface-shell-a-b/public/licenses/pdfjs-dist/` liegen sieben
bytegleich aus `pdfjs-dist` 6.3.289 übernommene Texte: Haupt-`LICENSE` sowie
`LICENSE_JBIG2`, `LICENSE_OPENJPEG`, `LICENSE_QCMS` und die drei zugehörigen
`LICENSE_PDFJS_*`-Dateien. Keine Texte gekürzt oder unter Tafelraum-Bedingungen
gestellt. `provenance.json` hält Paketversion, Originalpfad und SHA-256 fest.

Vite übernimmt sie über den vorhandenen `public/`-Pfad ins Lehrer-/Room-Webbundle.
Der bestehende Desktop-Ressourcenbau kopiert dieses `dist/` vollständig weiter;
kein neuer Renderer oder zusätzlicher Speicherpfad. Es wurde keine normale
Desktop-App neu gebaut/installiert. Das sind nur diese PDF.js-Notices, kein
vollständiges Lizenzpaket aller Bibliotheken, Fonts oder Office-Komponenten.

## 3. Vor und nach jedem normalen Appbuild prüfen

`npm run build` führt jetzt automatisch aus:

- `prebuild`: installierte PDF.js-Version, vollständige Notice-Liste und Hashes
  gegen die Originaldateien prüfen;
- bestehende Typprüfung und Vite-Build;
- `postbuild`: dieselben Nachweise gegen die tatsächlichen `dist/`-Dateien prüfen.

```sh
node scripts/check-pdf-license-notices.mjs
node scripts/check-pdf-license-notices.mjs --built
```

Ein fehlender, geänderter oder unvollständig deklarierter Text oder ein
Versionswechsel bricht ab. Nach einem bewussten PDF.js-Update neue Originaltexte
vollständig prüfen/kopieren und Provenienz aktualisieren. Keine automatische
Änderung der Evidenz während des Builds. Direkte `vite build`-Aufrufe umgehen
npm-Hooks; der dokumentierte Buildweg bleibt `npm run build`.

Der reine Teilnehmerbuild hat keinen PDF.js-WASM-Ladepfad; die Prüfung behauptet
keine Abdeckung seiner mitgelieferten Fonts. CI und Browser-Kernsuite verwenden
für die App bereits `npm run build` und erhalten beide Prüfungen automatisch.

## Prüfung und Grenzen

Drei neue Node-Tests decken fehlende Lizenzmetadaten, Versionsfehlzuordnung,
Pfadfreiheit/Determinismus des Inventars sowie Original-/Buildkopien,
fehlende/veränderte Texte, Versionswechsel und eine unvollständige Liste ab.
Die Tests sind in der App-Testliste. Aktueller Webbuild und Browser-Kernsuite
prüfen den realen Paket-/Buildpfad; Belege `output/license-readiness/`.

Als nächster fachlicher Schritt bleiben Einordnung von Lizenzkombinationen,
verwendeten Plattformen und ausgelieferten Dateien sowie Assetrechte. Die
MPL-Crates und die zusätzlichen Cargo-Lizenzvarianten sind damit sichtbar,
nicht automatisch rechtlich freigegeben. Siehe [Lizenzplan](50_LICENSING_PLAN.md)
und [Drittanbieter-Inventar](../../THIRD_PARTY_NOTICES.md).
