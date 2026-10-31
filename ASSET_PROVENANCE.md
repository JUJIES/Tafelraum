# Eigene Projektassets

Stand 29.10.2026, D-324. Der Projektinhaber hat im Arbeitsauftrag bestätigt,
dass die eigenen Projekticons mit ImageGen erstellt wurden, und ihre Aufnahme
in den gewählten öffentlichen Projektstand freigegeben. Öffentlicher Auftritt:
[JUJIES](https://github.com/JUJIES), Kontakt: [mail@jujies.app](mailto:mail@jujies.app).

## Zuordnung

| Assetgruppe | Konkrete Quelle | Herkunftsnachweis |
| --- | --- | --- |
| Native Tafelraum-App | `prototypes/surface-shell-a-b/src-tauri/app-icon.png` | ImageGen-Herkunft vom Projektinhaber bestätigt. Die vorhandenen Plattformfassungen unter `src-tauri/icons/` werden über Tauri daraus erzeugt; kein neues Motiv in D-324. |
| Web-/Teilnehmericon | `prototypes/surface-shell-a-b/public/tafelraum-icon.svg` und sechs PNGs unter `public/icons/` | Eigene Projekticons gemäß Bestätigung des Projektinhabers. Frühere Erzeugungs-/Vektorisierungsschritte wurden nicht rekonstruiert. |
| Lerndeck-Signet der Appauswahl | `prototypes/surface-shell-a-b/public/apps/lerndeck.svg` | In der bestätigten Gruppe eigener Projekticons erfasst; keine Aussage über fremde Markenrechte. |
| Neutrales Transport-Demo | `prototypes/surface-shell-a-b/src/assets/demo/transport-set.png` | Separat aufgezeichnete ImageGen-Erstellung ohne Referenzbild; [Originalprompt und Funktion](prototypes/surface-shell-a-b/src/assets/demo/README.md). |

Die zehn konkreten Quelldateien sind mit SHA-256 im
[öffentlichen Herkunftsmanifest](prototypes/surface-shell-a-b/public/licenses/tafelraum/provenance.json)
erfasst. Die technische Buildprüfung verhindert, dass ein ersetztes Motiv
unbemerkt den bisherigen Nachweis weiterverwendet.

## Geltungsbereich und Grenzen

Für die eigenen Projektassets gelten die [Projektbedingungen](LICENSE), soweit
entsprechende Rechte bestehen. Die ImageGen-Angabe dokumentiert eine Erklärung
des Projektinhabers; sie behauptet weder einen unabhängigen Herkunftsbeweis
noch exklusive Urheberrechte an KI-erzeugten Bildern. Historische Prompts,
Referenzeingaben und ursprüngliche Generierungssitzungen der Projekticons
liegen nicht als wiedergefundene Belege vor.

Fluent-/Lucide-Bediensymbole, Bibliotheksassets, Schriften und sonstige
Drittbestandteile behalten ihre eigenen Bedingungen; siehe
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Persönliche Unterrichtsbilder,
alte Unterrichtsmockups und archivierte Materialien gehören nicht zu dieser
Freigabe. Die Projektlizenz ist keine Markenregistrierung und erteilt keine
Rechte an fremden Namen oder Logos.

## Arbeitsblattreferenzen (30.10.2026)

Der gemeinsame Agenteneinstieg enthält jetzt 13 vollständige HTML-/CSS-Referenzen
mit lokalen Assets und zentraler Layoutorientierung. Herkunft und gesonderte
Bild-/Iconlizenzen stehen im [Referenznachweis](docs/agent-references/PROVENANCE.md).
Eigene Inhalte folgen der Projektlizenz; CC-BY-SA-/ISC-Fremdanteile behalten
ihre jeweiligen Bedingungen. Technische Beispiele bleiben separat.

## Public preview lessons

The eclipse diagram, survey map and harbour illustration are original inline SVGs drawn in [the preview lesson source](preview/lessons/illustrations.mjs). The routes, records and teaching prompts are invented examples. The README screenshots were captured from the public preview's teacher and Room windows with [the browser check](preview/check.mjs). They contain only the bundled sample lessons.

The preview's starter images are original vector scenes from [pictures.mjs](preview/lessons/pictures.mjs). They appear as ordinary image objects on the board. The optional NASA Space Place video is streamed from its original [YouTube publication](https://www.youtube.com/watch?v=hyf5JF_VxwM) after activation. No video bytes or third-party thumbnails are bundled.
