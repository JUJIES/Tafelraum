# Desktop-App und lokale Entwicklung

Tafelraum verwendet Tauri, eine React-/Excalidraw-Oberfläche und einen gebündelten
lokalen Node-Dienst. Unterrichtsdaten liegen im Benutzerprofil außerhalb des Bundles.
Programmupdates und Archivdaten haben getrennte Lebenszyklen.

Für den Einstieg [CONTRIBUTING.md](../../CONTRIBUTING.md) und den
[Dokumentationsindex](../../docs/implementation/README.md) lesen. Die native App
ist bisher auf macOS/Apple Silicon geprüft; andere Plattformen benötigen eigene
Abnahmen. Der Arbeitsbaum kann über installierte und veröffentlichte Builds
hinausgehen. Eine Versionsnummer ist kein Installationsnachweis.

Browserentwicklung verwendet eine eigene leere Testbasis. Das produktive Profil
ist kein Testziel. Native Testapps brauchen eine getrennte Kennung, einen eigenen
Port und ein eigenes Archiv. Persönliche Signaturschlüssel und Konfigurationen
gehören nicht in Git. Der öffentliche Quellstand enthält keinen JUJIES-Updater und kein Remote Canvas.
Room Canvas bleibt enthalten. Die Versionsinfo steht unter `Einstellungen → Version`;
Room-Werkzeuge werden wie die Lehrerleiste über einen neutralen Chevron ausgeblendet. Persönliche/Kollegenpakete haben einen eigenen
Umfang; [Vertrag61](../implementation/61_DISTRIBUTION_BOUNDARY.md) beschreibt die Grenze.

Build-/Releasebefehle stehen in `prototypes/surface-shell-a-b/RELEASE.md`, der
Vertrag in `docs/implementation/10_APP_UPDATE_RELEASE_STANDARD.md`. Ein eigener
Build, eine lokale Installation und eine öffentliche Veröffentlichung sind
getrennte Schritte. Die Abhängigkeiten und Laufzeiten behalten ihre eigenen
Bedingungen; insbesondere ist der Quellrepository-Abgleich keine Freigabe eines
beliebigen nativen Binärpakets.

Diese öffentliche Kurzfassung enthält keine persönliche Installationschronik,
Archivbestandszählungen oder privaten Prüfartefakte. Die lokalen Originalbelege
bleiben beim Maintainer erhalten.
