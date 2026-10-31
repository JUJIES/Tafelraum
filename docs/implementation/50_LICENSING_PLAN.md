# Projektlizenz: MIT mit Commons Clause1.0

Stand29.10.2026, D-324. Die zuvor vorbereitete Richtung ist auf ausdrücklichen
Nutzerauftrag lokal eingesetzt: [LICENSE](../../LICENSE), öffentlicher Auftritt
JUJIES und Kontakt `mail@jujies.app`. [Prüfstand55](55_PROJECT_LICENSE_AND_PUBLIC_IDENTITY.md)
hält Umsetzung, Originalquellen und Prüfgrenzen fest. Kein Upload oder neuer
Apprelease aus dieser Entscheidung.

## Gewählte Bedingungen

Nutzer sollen den Code sehen, installieren, beruflich nutzen, verändern und
zusammen entwickeln können. Die zusätzliche
[Commons Clause1.0](https://commonsclause.com/) begrenzt den Verkauf wesentlich
auf der Software beruhender Produkte/Dienste. Sie kann auch bezahltes Hosting,
Support und Beratung erfassen. Der Originaltext wird nicht auf ein reines
Appkopien-Verkaufsverbot verkürzt. Die Kombination heißt **Source Available**,
kein unverändertes MIT und kein Open Source nach OSI-Definition.

Die Root-Lizenz erfasst eigene Code-, Doku-, Skript-, Skill- und Assetanteile,
soweit entsprechende Rechte bestehen. Fremdcode, Original-Lizenztexte,
Schriften, Quellarchive und andere Drittbestandteile behalten ihre Bedingungen.
Persönliche Unterrichtsmaterialien und separat konfigurierte Laufzeiten werden
nicht dadurch zur Weitergabe freigegeben.

## Entscheidungen und Umsetzung

| Punkt | Aktueller Stand |
| --- | --- |
| Öffentliche Identität | Nutzer hat JUJIES gewählt; verbundenes GitHub-Konto bestätigt. Keine private Kontoadresse übernommen. |
| Projektlizenz | Root-Lizenz mit MIT und unveränderter Commons Clause1.0; Platzhalter für Tafelraum/JUJIES gefüllt. |
| Eigene Assets | ImageGen-Herkunft vom Projektinhaber bestätigt; [konkrete Zuordnung und Grenzen](../../ASSET_PROVENANCE.md), zehn Quelldateihashes. Kein unabhängiger Herkunfts-/Exklusivitätsbeweis behauptet. |
| Paketangaben | Drei npm-Pakete und Cargo verweisen auf die vollständige Root-Lizenz. |
| Zusammenarbeit | [CONTRIBUTING](../../CONTRIBUTING.md): eigene Beiträge unter gleichen Bedingungen; keine Rechteabtretung oder automatische Zustimmung zur späteren Umlizenzierung. |
| Auslieferung | Bytegleiche Projektlizenz und Manifest in beiden Webbuilds; lesender Buildguard und Regressionen. |
| Drittbestandteile | Metadateninventar und originale Notices vorhanden; konkrete Kombination und Verteilung weiter fachlich prüfen. |

## Drittbestandteile und Prüfung

Ausgangspunkt ist [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
Alle412 npm-Lockeinträge und518 Cargo-Pakete sind technisch erfasst. Die frühere
Cargo-Metadatenlücke ist geschlossen. Das ist keine vollständige juristische
Einordnung jedes späteren Appbundles.

Unter anderem sind Lightning CSS und mehrere Cargo-Crates unter MPL-2.0;
DOMPurify bietet MPL-2.0 oder Apache-2.0. Die
[Mozilla-FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) erläutert die Kombination
mit anders lizenzierten Dateien. Datei-/Quellenpflichten für die tatsächliche
Einbindung erfüllen; die eigene Verkaufseinschränkung gilt nicht für diese
MPL-Dateien. Ein Paketname allein belegt keinen Konflikt.

Schriften haben unabhängige Bedingungen. Insbesondere ist die semantisch
zugeordnete Liberation1.05-Schrift mit ihren ursprünglichen GPL-v2-/Ausnahmetexten
und passenden Originalquellen verteilt, siehe
[Prüfstand54](54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md). Die Schrift wird
nicht unter die Tafelraum-Bedingungen umdeklariert.

## Quellrepository und Appdownload getrennt prüfen

Der Quellkandidat enthält keine gebündelte LibreOffice-Laufzeit oder privaten
Modellgewichte. Eine Desktop-App enthält dagegen Node, Webressourcen,
Office-Konverter und weitere Fremdteile. Vollständige Originaltexte und nötigen
Quellzugang der konkret gebündelten Version erhalten; die eigene Lizenz ersetzt
diese Pflichten nicht. Bestehende technische Nachweise in Prüfstand51/52.

Die Entscheidung und lokale Umsetzung sind erfolgt. Vor Veröffentlichung
verbleiben die konkrete Drittanbieter-/Verteilungsprüfung, der endgültige
öffentliche Dokuumfang und der Uploadauftrag. Eine fachliche lizenzrechtliche
Durchsicht bleibt sinnvoll; sie wird hier nicht als bereits erfolgt behauptet.
Windows-/Linux-Portierung ist davon unabhängig und keine Voraussetzung für
einen ehrlichen ersten Mac-Entwicklungsstand.
