# Word-Dateien als PDF importieren

18. Oktober 2026 · beauftragter lokaler DOCX-Import.

- **Handlung:** Zugeschicktes DOCX ohne Officeinstallation genauso wie PDF nutzen.
- **Eingänge:** `Vom Gerät`, externe Datei-Drag-and-drop und persönliche QR-Abgabe.
- **Darstellung:** Ein PDF-Materialeintrag und bestehende PDF-Seitenprojektion; kein
  Word-Editor, neuer Canvasrenderer oder zusätzliche Quellenzeile. Die DOCX-Quelle
  liegt mit dem PDF in einem normalen stundenlokalen Unterordner.
- **Status:** Während der Desktopkonvertierung `Word wird umgewandelt …` an der
  vorhandenen Importaktion. Fehler konkret, keine scheinbar gespeicherte Datei.
- **Mobil:** DOCX nur für einen entsprechend fähigen Mac-Empfänger anbieten.
  Word-Dateien erhalten einen `Word`-Platzhalter, keine Bildvorschau. `Gespeichert`
  erst nach Konvertierung und Archivcommit. Mischlisten/Einzelretry bleiben.
- **Konverter:** Mitgelieferte lokale LibreOffice-Laufzeit und Schriften. Kein
  Account, manuelle Officeinstallation, Netzwerkzugriff oder Beelink-Konvertieren.
- **Grenzen:** DOCX bis 20 MiB; beschädigte/verschlüsselte, aktive oder extern
  geladene Dokumentinhalte mit verständlichem Fehler ablehnen. Legacy DOC nicht
  automatisch als DOCX behandeln. Komplexe Layouts vor Übernahme praktisch prüfen.
- **Abnahme:** Mehrseitiges Dokument mit Tabellen, Bildern, Kopf-/Fußzeilen;
  Dateidialog, Drop, QR-Mischliste, Doppelimport, Fehler, Quellenerhalt und Reload.
  Layoutvergleich ist keine Garantie für jedes Word-Dokument oder fremde Schriften.
