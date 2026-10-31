# Lokaler DOCX-Import als PDF

18. Oktober 2026 · D-272 · 0.1.66, persönlicher Mac-Pilot.

## Produkt und Datenfluss

- Dateiauswahl und externer Dateidrop verwenden `App.importMaterialFiles` →
  `uploadLessonMaterial` → bestehendes `PUT …/materials/file`. Der mobile Empfänger
  benutzt exakt dieselbe API und ihre Material-Schreibqueue.
- `.docx` wird vor Archivveröffentlichung lokal nach PDF konvertiert. Der Ordner
  `<Titel> – Word/` enthält `<Titel>.docx` unverändert und `<Titel>.pdf`. Der bestehende
  rekursive Materialkatalog listet nur das PDF, kein neuer Word-Materialtyp oder
  Renderer. Canvas, Druck, Annotationen und Live/Room verwenden den PDF-Rasterpfad.
- Das Frontend lädt nach Word-Upload die erzeugten PDF-Bytes aus dem Archiv. DOCX-
  Bytes werden niemals bloß als PDF umbenannt. Desktopimport platziert wie bisher
  PDF-Seiten; mobile Übernahme bleibt ausschließlich Archivimport.
- Staging bleibt versteckt; erst das vollständige Paar wird per Ordner-Rename
  veröffentlicht. Gleiche Quelle unter gleichem Namen liefert das bestehende PDF
  ohne neue Konvertierung; andere Quelle erhält einen Kopieordner. Kein Überschreiben.
- Quelle und PDF liegen im bestehenden Archivbaum und werden beim Kopieren einer
  Stunde mitgenommen. Entfernen bleibt der bestehende reversible Materialpfad;
  es gibt keine automatische Quellenbereinigung oder zweite Assetdatenbank.
- Bei einer langen Konvertierung werden Zielbasis und Papierkorbstatus vor
  Veröffentlichung erneut geprüft. Abbruch/Fehler verwirft Staging und Arbeitsordner.

## Konverter und Auslieferung

- Offizielles, unverändertes LibreOffice **26.8.1**; Downloadquelle und feste
  SHA-256-Werte für arm64/x64 in `office-import/runtime.json`.
- `scripts/prepare-office-runtime.mjs` lädt/verifiziert die Build-Abhängigkeit unter
  ignoriertem `local-data/office-runtime/`. Signatur und Architektur der Cache-App
  werden bei erneuter Verwendung geprüft. Quellenlink, NOTICE und Lizenztexte bleiben
  erhalten. Keine geänderte Codex-LibreOffice-Version als Produktabhängigkeit.
- `prepare-desktop-resources.sh` kopiert Laufzeit einschließlich Schriften nach
  `runtime/libreoffice/LibreOffice.app`. Der ausgelieferte Server findet sie relativ
  zu sich; kein PATH, Homebrew, Word, Konto oder Codex-Pfad auf dem Zielgerät nötig.
  Nur Entwicklung verwendet den expliziten Repository-Cache als Alternative.
- Separates Profil/Arbeitsverzeichnis pro Auftrag, kein sichtbares Officefenster.
  macOS-Sandbox blockiert IP-Netzwerkzugriffe und Schreibzugriffe ins Konverter-
  Bundle. Betriebssystemlokale Unix-/Mach-Kommunikation bleibt nötig. Das ist keine
  vollständige Dateisystemisolation und keine allgemeine Office-Sandboxgarantie.
- Pythonbytecode wird unterdrückt beziehungsweise in den Arbeitsordner umgeleitet.
  Ein früher Probeaufruf ohne diese Einstellungen erzeugte `__pycache__` im Vendor-
  Bundle und verletzte dessen Signatur; dieser Cache wurde aus dem geprüften DMG
  frisch hergestellt. Konvertierung verändert das signierte Produktbundle nicht.
- Die bestehende native Tafelraum-Auslieferung bleibt **ARM64** (macOS ≥12).
  Der Konverter-Download kennt Intel, aber ein Intel-Tafelraum-Paket und dessen
  Hardwareabnahme sind nicht implementiert. Keine Zusage „auf jedem alten Mac“.

## Grenzen und Fehler

- DOCX ≤20 MiB, ZIP-Verzeichnis ≤4096 Einträge, deklarierte Entpackgröße ≤120 MiB,
  ≤40 MiB je Eintrag. ZIP64, verschlüsselte, aktive/eingebettete Officeobjekte,
  externe Dokumentteile und externe Feldfunktionen werden abgelehnt; gewöhnliche
  Webhyperlinks bleiben möglich. Explizit **kein** `.doc`, `.docm`, `.dotx` oder RTF.
- Ein Konverter innerhalb der bestehenden Materialqueue, maximal 60 Sekunden je
  Konvertierung, PDF ≤100 MiB. Bestehender PDF-Seitenimport bleibt auf 20 Seiten begrenzt.
- Bei Fehler kein Erfolg; Desktop zeigt die konkrete Meldung. Mobile zeigt
  „Nicht bestätigt“ und verweist bei abgelehnter Datei auf Datei/Mac-Fehlermeldung;
  der Empfänger behält den konkreten Archivfehler lokal. Keine Fehlermeldungen oder
  Dateinamen unverschlüsselt an den Relay senden.
- Mobile DOCX-Auswahl erst mit verschlüsseltem `target.acceptsDocx=true`. Alte
  Desktopempfänger bleiben bei ihren bisherigen Bild-/PDF-Formaten. Optionaler
  verschlüsselter DOCX-Quellenname; fester Transfername hält Wiederholung stabil.
- Fehlende Fremdschriften und komplexe Wordlayouts können abweichen. Im generierten
  Negativfall einer breiten Tabelle innerhalb einer Spalte reichte die Tabelle über
  den Seitenrand. Die Quelle bleibt erhalten; keine automatische Neugestaltung oder
  behauptete pixelgenaue Wordkompatibilität. Ohne Word-Gegenreferenz ist dieser Fall
  kein Beleg, wie dieselbe überbreite Vorlage in Word selbst dargestellt wird.

## Prüfung

- Drei automatisierte Office-/Archivgruppen: Format/ZIP-Grenzen, aktive/externe
  Inhalte, Abbruch/Fehlerbereinigung, Quelldatei bytegleich, genau ein PDF-Eintrag,
  echter PDF-Download, gleiche Quelle dedupliziert, andere Quelle kollisionsfrei,
  erfolgreiche Wiederholung nach Konverterfehler.
- Bestehende Capture-/Archivtests und zusätzliche Wire-/Senderfälle für DOCX-
  Signatur/Quellenname, Pfadablehnung, fähigen/alten Empfänger und Wordplatzhalter.
- Neutral erzeugte Layoutdateien aus `scripts/create-office-import-fixtures.py`:
  A4 mit Tabellen, eingebetteter Grafik, Umlauten, Kopf/Fuß/PAGE und expliziter zweiter
  Seite; Querformat mit zwei Spalten und passend begrenzter Tabelle. Alle drei
  positiven PDF-Seiten mit Poppler gerendert und vollständig visuell geprüft.
  Seitenzahlen/Formate/Textenden geprüft. Kalte Einzelaufrufe hier ungefähr 1 s;
  keine allgemeine Laufzeitgarantie. Separater Negativfall mit überbreiter Tabelle.
- Browser, getrenntes temporäres Archiv: `Vom Gerät` wählt echtes zweitseitiges DOCX,
  Status `Word wird umgewandelt …`, danach genau ein PDF-Material und zwei Canvasbilder.
  Mobile Auswahl mischt echtes DOCX und PNG; erst nach Konvertierung/Archivcommit
  je `Gespeichert`, Empfänger meldet `2 gespeichert`. Keine produktiven Testuploads.
- Drag-and-drop führt unverändert dieselbe externe `File[]` in denselben Import-
  handler; Pfad im Code geprüft. Ein realer Finder-Drop und Android-/iPad-Dateipicker
  sind noch gesonderte Geräte-/Gestenprüfung, nicht durch Browser-Filechooser ersetzt.
- Belege im ignorierten `output/office-import-qa/`: Quellfixtures, gerenderte Seiten,
  `layout-proof.json`, `desktop-docx-import.png`, `mobile-word-saved.png`.

## Paketprüfung

Der größere Dateibestand deckte einen Fehler im bisherigen Release-Shellcheck auf:
`grep -q` schloss die lange ZIP-Dateiliste vorzeitig; `print` erhielt SIGPIPE und
`pipefail` meldete fälschlich eine fehlende Installationsanleitung. Beide Prüfungen
lesen jetzt die ganze Liste; Anleitung und Ausschluss privater Daten bleiben
verbindlich. Keine Abhängigkeit aktualisiert; ein versehentlich beim Versionswechsel
geänderter `iana-time-zone`-Lockeintrag wurde vor dem erfolgreichen Neubau auf den
bestehenden Wert zurückgesetzt.


## Abschlussabnahme 0.1.66

- 357 App-/Archivtests, elf Relay-/Sendergruppen sowie Rust, Typprüfung und Build
  bestanden. Portables ZIP enthält Anleitung und keine privaten Daten; Codesign
  und kryptografische Updatersignatur gültig. ZIP 366 MiB, Updater etwa 346 MiB.
- `scripts/office-import-package-qa.mjs` lief mit **gebündeltem Node** gegen den
  **gebündelten Konverter** und ein ausschließlich temporäres Archiv. Zwei Seiten,
  vollständiger letzter Text, Original bytegleich, ein PDF-Eintrag, Wiederholung
  ohne Doppelmaterial, ungültige Datei abgelehnt. Alle 17.684 Ressourcendateien vor/
  nach dem Lauf bytegleich; Bundle-Signatur weiterhin gültig. `package-proof.json`,
  `package-output.pdf`. Die gemessenen rund 3,9 s enthalten Folgeprüfungen/Dateihashes
  und sind kein isolierter Konverterbenchmark.
- Geräteimport im Browser und mobile Mischabgabe hinterließen zwei PDFs und ein
  Bild; beide DOCX-Originale bytegleich. Nur die zwei Seiten des Desktopimports im
  Canvas, mobile Dateien unverlangt nicht platziert. Reload bestätigt Material und
  Canvas; Belege `archive-proof.json`, `desktop-docx-reload.png`.
- Echte öffentliche HTTPS-DOCX-Abgabe über den Beelink in ein anderes temporäres
  Testarchiv bestätigt PDF und bytegleiche Quelle. Öffentliche Web-/Protokolldateien
  sind bytegleich zum geprüften Stand (`2026-10-18-capture-docx-01`, Health 200).
  `public-proof.json`, `deployment.json`, `public-word-saved.png`; Testzugang widerrufen.
- Normale Desktop-App regulär beendet, geprüftes Paket am bisherigen Desktop-Ort
  installiert und nativ gestartet, Bundleversion .66. Alle 17.684 kopierten Dateien
  bytegleich; vorherige .65 unter den bestehenden App-Rückfallkopien gesichert.
  Kein Testimport ins produktive Archiv und keine Archivmigration/Cachebereinigung.
  Kein pauschaler Bytegleichheitsanspruch für produktive Boards während normaler
  Nutzerbedienung/Autosave. Öffentlicher Desktopupdatekanal bleibt .59.
- Offen bleiben Intel-App-Paket/Hardware, reale Finder-Dropgeste und neue DOCX-
  Dateipicker auf Android/iPad. Browser-Filechooser und gemeinsame Codepfade sind
  ausdrücklich kein Ersatz für diese Geräteprüfung.

### Nachprüfung der macOS-Absturzmeldung

Die vom Nutzer gezeigte `soffice`-Meldung wurde anhand der Diagnoseberichte geprüft:
vier Berichte vom 18.10.2026 zwischen 07:59 und 08:04, passend zu den verworfenen,
zu restriktiven Sandbox-Proben vor Installation der normalen .66-App (08:10).
Der Pakettest wurde anschließend mit Node und Konverter aus
`~/Desktop/Tafelraum.app` erneut erfolgreich ausgeführt: PDF erzeugt,
Original bytegleich, Deduplizierung und Fehlerfall korrekt, alle 17.684 Ressourcen
unverändert und Codesign gültig. Kein neuer `soffice`-Diagnosebericht nach diesem
Lauf. Der Dialog allein belegt daher keinen Absturz des installierten Importwegs;
die historischen Probeabstürze bleiben als solche dokumentiert.
