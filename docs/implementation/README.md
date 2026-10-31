# Implementierung und Produktverträge

Dieser Index führt zu den heute maßgeblichen Verträgen. Für Setup und erste
Codeänderungen beginnt man im [Entwicklerleitfaden](../../CONTRIBUTING.md).
[AGENTS.md](../../AGENTS.md) beschreibt die verbindlichen Arbeitsregeln.

## Welche Quelle beantwortet welche Frage?

| Frage | Einstieg |
| --- | --- |
| Was ist das Produkt und welcher Stand ist installiert? | [Haupt-README](../../README.md) |
| Wie starte und prüfe ich den Arbeitsbaum? | [Entwicklerleitfaden](../../CONTRIBUTING.md), [App-README](../../prototypes/surface-shell-a-b/README.md) |
| Wie bereite ich den ausgewählten öffentlichen Quellstand vor? | [Abschluss und Generalprobe58](58_PUBLIC_SOURCE_CANDIDATE.md), [ursprünglicher Exportweg](49_PUBLIC_SOURCE_PREPARATION.md) |
| Wo stehen Produktbeschreibung und letzter Einstiegsreview? | [Review59](59_PUBLIC_PRESENTATION_REVIEW.md), [Repositorybeschreibung](../GITHUB_DESCRIPTION.md), [Erste Schritte](../GETTING_STARTED.md) |
| Wo stehen zugeordnete Schriftquelle und letzter Sweep? | [Quellkorrespondenz, HTTP-Notices und Auditabschluss](54_SOURCE_CORRESPONDENCE_AND_FINAL_SWEEP.md) |
| Welche Nachweise gibt es für Schriften, Laufzeiten und Icons? | [Auslieferungsnachweise und Assetmatrix](52_DISTRIBUTION_NOTICES_AND_ASSETS.md) |
| Wie werden Dependency-/Lizenznachweise aktualisiert? | [Inventar und Buildprüfungen](51_LICENSE_EVIDENCE.md) |
| Welche Projektbedingungen und öffentliche Identität gelten? | [JUJIES, Lizenz und Assetbestätigung](55_PROJECT_LICENSE_AND_PUBLIC_IDENTITY.md), [Lizenzumfang und verbleibende Prüfung](50_LICENSING_PLAN.md) |
| Welche Drittanbieter-/Assethinweise sind vorhanden? | [Zentrales Inventar](../../THIRD_PARTY_NOTICES.md) |
| Welche Stabilitäts-/Performancehärtung ist noch nicht ausgeliefert? | [Speicherabschluss, Entwürfe und optionale Dienste](56_APP_STABILITY_AND_PERFORMANCE.md) |
| Was ergab der neue Quell-/Dependency-Sweep? | [Profilpfade, Sicherheitsupdates und Restbefunde](53_PUBLIC_SOURCE_SECURITY_SWEEP.md) |
| Was muss vor einem GitHub-Upload geklärt werden? | [Uploadaudit: Daten, Schlüssel, Lizenzen](48_GITHUB_UPLOAD_AUDIT.md) |
| Was prüft CI automatisch? | [GitHub-Actions-Workflow](../../.github/workflows/ci.yml), [Einrichtung und Grenzen](../../CONTRIBUTING.md) |
| Wie laufen die Browsertests? | [Browser-Testsetup und Fachprüfungen](../../scripts/BROWSER_TESTS.md) |
| Welche Hilfsprogramme sind allgemein nutzbar, welche gehören zum Betrieb? | [Skriptkatalog: Zweck, Voraussetzungen und Schreibwirkung](../../scripts/README.md) |
| Welcher Quellstand und welche Umgebung sind gemeint, wann muss der Agent fragen? | [Standregister und Zielklärung](../WORKING_STATES.md), verbindlich über AGENTS.md |
| Welche Regeln gelten für eine Änderung? | [AGENTS.md](../../AGENTS.md), aktueller Bereichsvertrag und UI-Brief |
| Warum wurde etwas entschieden? | [Decision Log](DECISION_LOG.md), einschließlich späterer Fortschreibungen |
| Was wurde tatsächlich gebaut/installiert/veröffentlicht? | [Desktop-App und Updates](09_DESKTOP_APP_UND_UPDATES.md) |
| Wie soll das Produkt langfristig wachsen? | [Konzeptpaket 1.4](../concept/v1.4/00_README.md) – Zielbild, keine aktuelle Stackbeschreibung |

Nummerierte Prüfprotokolle halten den Stand einer konkreten Abnahme fest.
Eine dort offene Aktivierung oder ältere Bedienregel gilt nicht automatisch
weiter, wenn eine spätere Entscheidung oder Installation sie ersetzt hat.
Der [ursprüngliche Surface-Lab-Plan](00_IMPLEMENTIERUNGSPLAN_PROTOTYP_0_1.md)
erklärt die Baseline und ihre späteren Ergänzungen; er ist keine aktuelle
Featureliste und keine Installationsanleitung.

## Daten, Material und Speicherung

- [Materialprojektion und Enginegrenze](02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md).
- [Dateiarchiv, Revisionen, Backups und Wiederherstellung](03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md).
- [Lokale HTML-Pakete, Sandbox und Zustand](04_INTERAKTIVE_HTML_MATERIALIEN.md).
- [Gemeinsame digitale/Druckseiten](30_SHARED_A4_PAGES_TEST.md).
- [DOCX-Import über den vorhandenen PDF-Pfad](39_DOCX_IMPORT_TEST.md).
- [Materialreihenfolge](40_MATERIAL_ORDER_TEST.md).
- [Private Kursnamen und Stundennotizen](46_STUDENT_NOTES.md).

- [Releaseprobe und tatsächliche Abnahmegrenzen](57_RELEASE_PROBE.md).

## Präsentation und Eingaben

- [Remote Canvas: Betrieb, Wire-Fähigkeiten und Abnahme](06_LIVE_CANVAS_BETRIEB_UND_TEST.md).
- [Room Canvas: lokaler Zweitbildschirm](21_ROOM_CANVAS_PILOT_PLAN.md).
- [Room: Eingaben und gemeinsamer Stundenstand](23_ROOM_CANVAS_INPUT_TEST.md).
- [Touch-/Canvas-Beobachtungen und Hardwaregrenzen](01_TESTPROTOKOLL_TOUCH_CANVAS.md).
- [Gemeinsame Annotationsbewegung](32_UNIFIED_ANNOTATION_MOVEMENT_TEST.md).

## Optionale lokale Anschlüsse

- [Agenten-Workflow, mitgelieferte Skills und öffentliche Einstiegslücken](../AGENT_WORKFLOW.md).

- [Öffentliche Verfügbarkeit, persönliche Piloten und offene UI-Punkte](60_OPTIONAL_INTEGRATIONS_REVIEW.md).

- [Verschlüsselte Handyaufnahme](35_MOBILE_CAPTURE_PILOT.md).
- [Bildverbesserung](37_DOCUMENT_IMAGE_PILOT.md) und [Perspektivkorrektur](38_DOCUMENT_PERSPECTIVE_TEST.md).
- [HTML-Medien und Wiedergabe](43_HTML_MEDIA_INTEGRATION_TEST.md).
- [KI-Anschluss und deklarierte Satzprüfung](44_LANGUAGE_BITES_SENTENCE_CHECK_TEST.md).
- [Canvasvorbereitung durch Agenten](45_CANVAS_AGENT.md).
- [Unterricht finden, anlegen und Material zuordnen](47_TEACHING_AGENT.md).

## Gestaltung, Unterricht und Auslieferung

- [Verbindlicher Styleguide](../design/00_UI_UX_STYLEGUIDE.md) und der passende
  [UI-Brief](../design/).
- [Unterrichtsworkflow und Materialabnahme](../unterricht/00_ARBEITSWEISE_UNTERRICHT.md).
- [Native App, Profil, Buildablage und Installationshistorie](09_DESKTOP_APP_UND_UPDATES.md).
- [Gemeinsamer Releasevertrag](10_APP_UPDATE_RELEASE_STANDARD.md) und
  [Releasebefehle der App](../../prototypes/surface-shell-a-b/RELEASE.md).

## Historische Belege und heutige Anleitung auseinanderhalten

| Dokumentart | Verwendung |
| --- | --- |
| README, CONTRIBUTING, Skript-/Browserkatalog | Heutiger Einstieg und wiederholbare Befehle. |
| Bereichsvertrag und passender UI-Brief | Aktuelle Regeln für den betroffenen Bereich; spätere ausdrücklich dokumentierte Entscheidungen beachten. |
| Desktopprotokoll 09 | Fortlaufende Installations-/Releasebelege. Für den Stand den neuesten bestätigten Eintrag lesen, nicht einen alten Zwischenstand. |
| Nummerierte Einzelabnahme | Nachweis für die dort genannte Version, Aufgabe und Umgebung. Keine pauschale aktuelle Installationsanleitung. |
| Konzeptpaket und ursprünglicher Plan 00 | Zielbild bzw. Baseline; spätere Erweiterungen sind keine stillschweigende Freigabe aller Zukunftspläne. |

Gezielte historische Einstiege:

- [Performanceaudit vom 05.09.](07_PERFORMANCE_AUDIT_2026-09-05.md) und
  [damaliger Verbesserungsplan](08_PERFORMANCE_VERBESSERUNGSPLAN.md).
- Native Einzelabnahmen von [0.1.9](11_NATIVE_APP_SMOKE_TEST_0_1_9.md) bis
  [0.1.18](20_NATIVE_APP_UPDATE_0_1_18_LINKS.md), die
  [Sidebar-Abnahme 0.1.19](21_NATIVE_APP_UPDATE_0_1_19_SIDEBAR.md) und die
  [erste Room-Installation 0.1.20](22_NATIVE_APP_UPDATE_0_1_20_ROOM_CANVAS.md).

Einige spätere `*_TEST.md` enthalten zugleich den bislang einzigen gepflegten
Bereichsvertrag, etwa DOCX-Import39 oder HTML-Medien43. Deshalb sind sie oben
weiter als Bereichseinstiege verlinkt: aktuelle Produktregeln und datierte
Abnahme dort getrennt lesen. Eine alte offene Aktivierung wird nicht allein
durch ihren Eintrag wieder zur heutigen Einschränkung.

Belege und ihre Pfade bleiben erhalten. Neue Entscheidungen gehören in das
vorhandene Decision Log; keine zweite Releasechronik in AGENTS.md oder README.

- [61 – Persönliche und öffentliche Distribution](61_DISTRIBUTION_BOUNDARY.md): Profile, entfernte öffentliche Anschlüsse, gemeinsamer Kern und Prüfweg.

- [62 – Agenteneinstieg mit leerem Archiv](62_AGENT_FIRST_RUN.md): optionale eigene Regeln, neutrale CLI-/Browserreferenz und konkrete Kompatibilitätsgrenzen.

- [Mitgeliefertes lokales Agentenpaket und gemeinsame HTML-Pipeline](63_BUNDLED_AGENT_KIT.md).

- [64 – Sprache der Oberfläche](64_UI_LANGUAGE.md): DE/EN-Präferenz,
  Textkatalog, Datenabgrenzung und gemeinsamer Lehrer-/Room-Prüfweg.
