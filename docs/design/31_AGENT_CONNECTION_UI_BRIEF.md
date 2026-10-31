# UI Brief – lokalen Agenten verbinden

30.10.2026. Gemeinsamer Einstieg in persönlicher und öffentlicher Distribution.

- Handlung: Lehrkraft findet in `Einstellungen` die sekundäre Aktion
  `Agent verbinden` und kopiert einen Startauftrag in ihren eigenen Agenten.
- Bestehendes Dialogmuster verwenden. Kein KI-Key, Anbieterpicker, globaler
  Skillinstaller oder automatischer Archiv-/Canvasauftrag.
- Dialog `Agent verbinden`, schließbar mit X/Escape. Er nennt knapp den nötigen
  lokalen Datei-/Werkzeugzugriff und das mitgelieferte Paket.
- Nach Öffnen liest die App `/api/agent-kit` mit bestehender lokaler Agentengrenze.
  Lade-/Fehlerzustand sichtbar; kopierbarer schreibgeschützter Startauftrag und
  `Startauftrag kopieren`, nach Erfolg `Kopiert`. Bei fehlender Clipboardfreigabe
  Text auswählen und manuelles Kopieren ermöglichen.
- Startauftrag enthält Paketpfad, passende Node-Laufzeit und die tatsächliche
  Appadresse. Er beauftragt nur lesendes `status`/`sessions`, keinen Zugriff auf
  private Schülernotizen, keinen Materialimport und keine Präsentation.
- Ein reiner Cloudchat erreicht den Rechner nicht automatisch. Die UI behauptet
  keine fertige universelle Agenten-/MCP-Verbindung.
- Bekannte Tafelraum-Dialogflächen, Schrift und Tokens, 48-Pixel-Aktionen,
  begrenzte Breite und scrollbar auf kleinen Fenstern. Kein weiterer Hauptbutton
  auf dem Canvas. Persönlicher KI-Anschluss bleibt eigener unveränderter Pilot.
- Prüfen: echter Paketpfad und URL im Browserdialog, Schließen, Fehler ohne Paket,
  beide Distributionsprofile; Tastatur/lesbarer Text. Reale Touchhardware separat.
