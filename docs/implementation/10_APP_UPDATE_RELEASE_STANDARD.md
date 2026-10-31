# Gemeinsamer Releasevertrag für lokale Schul-Apps

**Stand:** 21. September 2026  
**Gilt für:** Tafelraum, Sternekonto, Wochenauswertung und EZSport

## Gemeinsames Modell

Alle vier Produkte werden zunächst als portables Apple-Silicon-ZIP ohne Installer verteilt. Die App kann in einem benutzerbeschreibbaren Ordner liegen. Danach lädt ausschließlich der eingebaute Tauri-Updater signierte Programmstände über den Beelink Update Hub.

Der Beelink ist eine read-only Verteilungsstrecke für öffentliche Programmartefakte. Er speichert keine Unterrichts-, Klassen-, Wochen-, Sportjahr-, Notiz- oder Sicherungsdaten und keinen privaten Schlüssel.

## Dauerhafte Kompatibilitätswerte

Eine bereits verteilte App behält dauerhaft:

- ihre Bundle-ID und ihren lokalen App-Datenordner;
- ihren festen `latest.json`-Endpunkt;
- den in der App eingebauten öffentlichen Updaterschlüssel;
- ihre eigene Versionsfolge und ihren unveränderlichen Releasepfad.

Sternekonto, Wochenauswertung und EZSport behalten den bereits eingebauten gemeinsamen öffentlichen Schlüssel. Tafelraum verwendet seinen eigenen Schlüssel. Eine spätere Schlüsseltrennung der bereits verteilten Apps benötigt einen geplanten Übergang und darf nicht durch einen normalen Release erfolgen.

## Verbindlicher Erzeugungsweg

Jedes Release-Skript prüft vor der Freigabe:

1. dieselbe Version in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` und `src-tauri/tauri.conf.json`;
2. vorhandene Release Notes für genau diese Version;
3. die projektspezifischen Tests und den Rust-Build;
4. dass das portable ZIP die Installationsanleitung, aber keine Laufzeit- oder Sicherungsdaten enthält;
5. das entpackte App-Bundle mit macOS `codesign --verify --deep --strict`;
6. das erzeugte Updaterarchiv kryptografisch gegen den öffentlichen Schlüssel der gebauten App;
7. SHA-256-Prüfsummen aller Verteilungsartefakte.

Das portable ZIP dient der Erstinstallation. Das `.app.tar.gz` dient ausschließlich dem eingebauten Updater.

## Verbindlicher Veröffentlichungsweg

Alle App-Kanäle verwenden auf dem Beelink `Publish-AppUpdate.ps1` mit einer expliziten App-ID. Der Publisher validiert Version, Kanal, Manifest und Signaturbezug, schreibt zuerst den unveränderlichen Versionsordner und ersetzt `latest.json` zuletzt atomar.

Nach der Veröffentlichung lädt das lokale Publish-Skript Manifest und Archiv über die öffentliche HTTPS-Adresse erneut. Es prüft:

- die veröffentlichte Versionsnummer;
- SHA-256-Gleichheit mit dem lokalen Archiv;
- die kryptografische Signatur gegen den öffentlichen Schlüssel der jeweiligen App.

Eine bereits veröffentlichte Versionsnummer wird nie mit anderem Inhalt wiederverwendet.

## Daten und Sicherungen

Ein Programmupdate ersetzt das App-Bundle und lässt den app-eigenen Datenordner unangetastet. Fachliche Datenmigrationen gehören der jeweiligen App und laufen getrennt vom allgemeinen Updatervertrag.

Tafelraum erstellt bei normalen Programmupdates kein Vollbackup seines wachsenden Unterrichtsarchivs. Eine spätere Änderung seines Datenformats muss die tatsächlich betroffenen Dateien gezielt und transaktional sichern. Bestehende, produktspezifische Sicherungsregeln anderer Apps bleiben gültig, darunter Sternekontos automatische Sicherung vor dem In-App-Update.

## Abnahme

Vor einer neuen Kolleg:innen-Verteilung wird das ZIP auf einem zweiten verwalteten Mac geprüft. Vor einem breiteren Update wird mindestens ein bestehender Datenbestand mit der vorherigen App-Version angelegt, aktualisiert und anschließend fachlich verglichen. Hash- und Signaturprüfung ersetzen diesen Datenerhaltstest nicht.

