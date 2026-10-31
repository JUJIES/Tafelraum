# 1. Ausgangslage und Vision

## 1.1 Reale Ausgangslage

Der Nutzer ist Lehrer und arbeitet regelmäßig mit:

- Mac;
- großem Touchscreen beziehungsweise Smartboard;
- Schüler-iPads;
- PDFs, Arbeitsblättern und Bildern;
- YouTube- oder eigenen Erklärvideos;
- OneNote als heutiger Ablage- und Unterrichtsumgebung.

In OneNote werden Materialien abgelegt und durch Überschriften, kurze Texte, Icons, Videos, Ablaufhinweise und handschriftliche Ergänzungen zu einer Stunde verbunden. Cloudzugriff, Fächer-/Reihenablage und Wiederauffindbarkeit sind praktisch.

Die Grenzen zeigen sich besonders live:

- Die Mac-Version bietet keinen überzeugenden Vollbild-/Unterrichtsmodus.
- Bedienung und Trefferflächen sind nicht touch-first.
- Scrollen, Zoomen und Suchen auf der großen Fläche werden für Schüler sichtbar und erzeugen Unruhe.
- Vorbereitung, private Notizen, Lösungen und Tafelbild sind nicht zuverlässig getrennt.
- Mac und zweiter Bildschirm lassen sich nicht als Regieraum und ruhige Bühne führen.
- Eine gesamte Stunde ist nicht als portables, maschinenlesbares Objekt erfasst.

## 1.2 Zielbild

Langfristig entsteht eine browserbasierte Unterrichtsumgebung, die:

- auf Mac, großem Touchscreen, Smartboard und Tablet funktioniert;
- ohne verpflichtende Planungsmaske sofort benutzbar ist;
- Text, Formen und Zeichnungen sehr schnell erzeugt;
- freie räumliche Arbeit und eine optionale zeitliche Struktur trennt;
- eine kontrollierte lokale Tafelansicht bereitstellt;
- zuverlässig speichert und wieder öffnet;
- Fach-, Reihen- und Stundenarchiv langfristig selbst übernimmt;
- später Materialien, KI, Sharing und Analyse ergänzt;
- schrittweise erweiterbar bleibt, ohne zur Tool-Sammlung zu werden.

Das Produkt soll nicht „Whiteboard plus möglichst viele Widgets“ sein. Es ist eine Unterrichtsoberfläche, in der Vorbereitung, Durchführung und spätere Wiederverwendung zusammenfinden.

## 1.3 Freie Inhaltsinseln und logischer Stundenpfad

Die Lehrkraft kann Inhalte pragmatisch dort anlegen, wo Platz ist. Diese **Inhaltsinseln** müssen auf dem Gesamtboard keine schöne lineare Komposition bilden.

Die räumliche Lage wird deshalb von der zeitlichen Unterrichtslogik getrennt:

```text
freies Board mit Inhaltsinseln
→ gewünschte Schülerausschnitte speichern
→ optional als Schritte ordnen
→ Schritte bei Bedarf in Abschnitte gruppieren
→ kontrolliert auf der Tafel zeigen
```

Dieser Stundenpfad macht eine Stunde schnell erfassbar, ohne die freie Erstellung durch Folien, Seiten oder vorgeschriebene didaktische Phasen einzuengen.

Seit Version 1.3 gilt ergänzend: Räumliche Boardelemente sind eine Darstellung der Stunde. Der fachliche Zusammenhang kann zusätzlich durch optionale Aktivitäten, Materialrollen und einen Unterrichtsfluss beschrieben werden. Diese semantische Ebene darf aus einem Spiegel importiert, von einer KI vorgeschlagen oder vollständig weggelassen werden; sie erzwingt keine Planungsmaske.

## 1.4 Nicht prompt-first und nicht formular-first

Eine Stunde kann mit einem Arbeitsblatt, einem Video, einer Quelle, einem Bild, einer spontanen Idee oder schlicht einem leeren Board beginnen. Es gibt keinen vorgeschriebenen Startpunkt.

Langfristig bleibt der reale Material-Workflow wichtig:

```text
vorhandenes oder erzeugtes Material
→ auf dem Board einordnen
→ erklären, bearbeiten und ergänzen
→ im Stundenpfad verorten
```

Das bedeutet **materialnah**, nicht **PDF-pflichtig**. KI kann später helfen, sie ist weder Eingangstor noch Voraussetzung.

## 1.5 Regieraum und Bühne

Die Lehreransicht ist die vollständige Arbeits- und Regieumgebung. Die öffentliche Ansicht ist eine bewusst gesteuerte Bühne:

- Lehrerkamera und öffentliche Kamera sind unabhängig.
- Normale Mausbewegungen und private Navigation bleiben privat.
- Schüler sehen nur bereinigte öffentliche Daten.
- Kamerabewegungen erfolgen erst nach einer bewussten Aktion.
- Im gehaltenen Zustand bleibt die Tafel ruhig, während die Lehrkraft weiterarbeitet.

Der primäre Betrieb ist ein erweiterter Zwei-Bildschirm-Modus, nicht pixelgenaue Spiegelung.

## 1.6 Bestehende Produktionswege

SheetifyIMG und die Remotion-Erklärvideo-Pipeline bleiben wichtige angrenzende Systeme. Das Teaching Workspace soll ihre Ergebnisse später aufnehmen, aber nicht von ihren internen Formaten abhängen.

Das gemeinsame Ziel ist eine visuell zusammenhängende Unterrichtswelt:

- Arbeitsblätter und Illustrationen können image-first entstehen;
- Erklärvideos können KI → Code → Video nutzen;
- das Workspace hält die live editierbare Unterrichtsstruktur und Tafelregie.

## 1.7 Langfristiger Wert

Langfristig kann eine digital sichtbare und dokumentierte Stunde zu einem wiederverwendbaren Kontextobjekt werden:

- vorbereitete Inhalte;
- Stundenpfad und Viewpoints;
- gezeigter Endzustand;
- ausgewählte Durchführungsergebnisse;
- Reflexionsnotizen;
- Originalassets und ihre Verwendung.

Nicht digital festgehaltene mündliche Aussagen gehören nicht automatisch dazu. Transkription wäre eine spätere bewusste Funktion.

## 1.8 Verhältnis zu OneNote

**Bestätigt:** Das Teaching Workspace soll OneNote langfristig für den relevanten Unterrichtsworkflow ablösen. Dazu gehören Materialablage, Fach-/Reihenarchiv, Vorbereitung, Live-Unterricht und spätere Wiederverwendung. OneNote ist während der Entwicklung ein Übergangssystem, aber kein dauerhaft gleichberechtigtes Archiv und keine kanonische Datenquelle.

Der erste technische Build muss dieses Ziel noch nicht vollständig erfüllen. Er validiert zunächst GUI, Board, Touch, Bild/PDF und Persistenz. Die langfristige Ablösung ist Produktziel, kein Abnahmekriterium des ersten Prototyps.

Der Übergang erfolgt inkrementell:

```text
OneNote-Seite und Quellenexport
→ semantischer Reihenspiegel
→ Materialinventar mit lokalem Verfügbarkeitsstatus
→ importierbare LessonDefinition
→ neue Board- und Präsentationsdarstellungen
```

Dabei wird nicht versucht, jedes historische Tafelbild geometrisch identisch nachzubauen. Rekonstruktionswert, Materialien, Ablauf und Quellenbezug sind wichtiger als die ursprünglichen OneNote-Koordinaten. Details stehen in `15_MIGRATION_SPIEGEL_UND_UNTERRICHTSSPEICHERMODELL.md`.

## 1.9 Datenhoheit und privater Beelink

**Bestätigt:** Der Beelink im privaten Zuhause ist Primärspeicher und kanonische Serverablage. Die bewusste Trennung von schulischer beziehungsweise arbeitgeberseitiger IT ist gewollt. Der Workspace soll dadurch nicht von OneNote, OneDrive oder einem dienstlichen Microsoft-Konto abhängig sein.

Technisch bleiben Speicheradapter sinnvoll, aber sie ändern die betriebliche Hierarchie nicht:

```text
Beelink = primäre, kanonische Ablage
Browsercache = lokale Ausfallsicherheit für aktive Arbeit
OneDrive/Export/Backup = optional und nachrangig
```

Die Datenidentität darf dennoch nicht an eine bestimmte Beelink-Installation gekoppelt sein. Kanonisch ist ein versioniertes, portables Unterrichtsformat mit stabilen IDs und Originalassets; der Beelink ist dessen bestätigter primärer Speicherort.

Datenschutz, Zugriffsrechte, Verschlüsselung, Backups und die organisatorische Zulässigkeit personenbezogener Unterrichtsdaten auf privater Infrastruktur müssen vor produktivem Einsatz gesondert geklärt werden.
