# Layoutreferenzen für Arbeitsblätter

13 vollständige HTML-Pakete aus neun ausgewählten Unterrichtsfällen. Diese
Referenzen gehören zur gemeinsamen lokalen Tafelraum-Pipeline und werden im
Agentenpaket mitgeliefert. Die zwei technischen Beispiele unter
`docs/agent-examples/` erklären ergänzend die minimale Integration.

![Übersicht über die 19 Referenzseiten](overview.png)

Bei neuen oder wesentlich neu gestalteten Arbeitsblättern zuerst die
[Layoutorientierung](LAYOUT.md) lesen. Zwei bis drei passende unterschiedliche
Referenzen auswählen, deren Manifesteinstieg, CSS und Bilder lesen und die
tatsächliche Darstellung ansehen. Bei kleinen Revisionen genügt der bestehende
Materialstand. Nicht alle Referenzen laden. Eigene Entwürfe außerhalb dieses
Ordners erstellen, mit neuer Paket-ID und nur benötigten lokalen Assets.

| Referenz | Orientierung und Grenze |
| --- | --- |
| [Transport Announcements](transport-announcements-listening/pages.html) | Nummerierte Hauptaufträge, Vorbereitung und zwei Hörtasks; Hörgrundlage separat, kein Audio enthalten. |
| [A seaside bike tour](hamburg-city-bikes-listening/pages.html) | Ein hervorgehobener Gesamtauftrag und kurze Antwortfelder; für längere Erklärungen mehr Platz einplanen. |
| [Opioide](bio-opioide-einstieg/pages.html) | Eigenständig ausgebbare Lese-/Aufgabenteile, eigene Seitenzählung; historische Statistik, fachliche Aktualität neu prüfen. |
| [Immer Richtung Süden](immer-richtung-sueden-lesebegleitung/pages.html) | Gemeinsames Lesen und selbstständiges Weiterlesen; Buch separat erforderlich, keine Buchauszüge enthalten. |
| [Ottomotor: Bauteile](ottomotor-bauteile-funktionen/pages.html) und [vier Takte](ottomotor-vier-takte/pages.html) | Bild und Eingabe verbinden; Begriffe und Prozess aufeinander aufbauen. Bildlizenzen erhalten. |
| [Drug Harm: Lesetext](english-drug-harm-reading/pages.html), [Aufgaben](english-drug-harm-comprehension/pages.html), [Lösungen](english-drug-harm-comprehension-solutions/pages.html) | Lesetext, Aufgaben und Lösungen getrennt; vorausgesetztes Diagramm nicht enthalten. |
| [Madeira: Reading to Speaking](unusual-transport-madeira-reading-to-speaking/pages.html) | Text/Bild, Auswahl von Informationen und vier Planungsfelder für einen Vortrag. |
| [Translation Bridge 1](transport-language-bridge-1/pages.html) und [2](transport-language-bridge-2/pages.html) | Satzbreite, klare Sozialformen, Entwurfs-/Endfassungsflächen. |
| [Filmbeobachtung](on-her-own-nordkap-vorbereitung/pages.html) | Wenige offene Beobachtungsfragen und großzügige Notizflächen; Film separat. |

Jeder Paketordner enthält `manifest.json`; aktueller Bildschirm-/Druckeinstieg
ist `pages.html` mit `shared-pages`. Die Pakete dienen als Gestaltungsreferenzen,
nicht als vollständiger Lehrgang oder automatisch fachlich passende Aufgaben.
Eine übernommene Gestaltung muss mit neuem Inhalt erneut geprüft werden.
Technische Prüfung: `node scripts/check-interactive-material.mjs --source-dir
docs/agent-references/PAKET --require-print` vom Checkout-/Agentenpaket-Root.
Tatsächliche Druckfreigabe bleibt eine gesonderte Prüfung im Ziel-Druckdialog.

[Herkunft, Rechte und Pflege](PROVENANCE.md). Die Auswahl wird über `files.json`
begrenzt; neue Dateien müssen bewusst dort aufgenommen und geprüft werden.
