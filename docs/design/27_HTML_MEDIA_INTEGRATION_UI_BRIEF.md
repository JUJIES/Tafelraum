# HTML-Medien im vorhandenen Canvasrahmen

21.10.2026 · ausschließlich isolierte gLT-Teststunden; kein neuer UI-Importer.

**Bedarf:** Filmszenen, Wiki-Erklärvideo und Auflösung aus derselben Materialliste
einsetzen und im HTML-Kontext bedienen. Keine einzelne Videoauskopplung.

**Hypothese:** Vorhandene HTML-Geometrie und Zustandsaktionen reichen. Fehlend
sind lokale Mediendateien/Range-Auslieferung sowie die Paketadapter. Kein neues
Materialmodell oder zweiter Renderer. Keine Unterrichtsinhalte ändern.

**Darstellung:** Ruhige bestehende Vorfolien beibehalten. Der Wiki-Player zeigt
im Embed keinen zweiten Außenrahmen, Schatten oder dunklen Vorschaurand.
Seine Arbeitsbogenführung nutzt denselben Original-Snapshot und dieselben
Remotion-Marker. Die Filmfolge erhält im Embed eine begrenzte Viewporthöhe:
intrinsische Videomaße dürfen weder Navigation verdrängen noch darüber liegen.
Paketnavigation bleibt direkt bedienbar, Canvas-Annotationen bleiben an die
native Materialgeometrie gebunden.

**Review:** Reale lokale Archivliste, Canvasinsertion, Steuerungen, Geometrie,
Abdecken/Zurücksetzen, Behalten/Reload und semantische Aktionen in beide
Room-Richtungen. Screenshot allein genügt nicht. Keine Druckänderung, deshalb
keine neue Druckfreigabe. Keine Behauptung nativer Beamer-/Audioabnahme.

**Fortschreibung D-278:** Nur Room spielt/rendert aktiv, Lehrerfenster steuert
ohne zweiten Player. Opt-in-Vertrag und Ausfallverhalten: [UI-Brief 28](28_ROOM_HTML_PLAYBACK_UI_BRIEF.md).
Ton über Systemausgabe; Hardwaretest vor Unterrichtsfreigabe.

**Review-Ergebnis:** Browser-Integration bedingt bereit: drei reale Pakete,
Interaktion in beide Room-Richtungen, ursprüngliche Seitenverhältnisse,
Behalten/Reload, Reset/Abdeckung und acht Standbilder geprüft. Native
Desktop-Auslieferung und echter erweiterter Bildschirm offen. Room-only-Playback
einschließlich Lehrersteuerung und Ausfall-Pause zusätzlich im Browser geprüft.
