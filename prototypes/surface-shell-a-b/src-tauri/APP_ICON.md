# Tafelraum-App-Icon

`app-icon.png` ist die kanonische quadratische Quelldatei für das native App-Icon.

Die plattformspezifischen Dateien unter `icons/` werden ausschließlich daraus erzeugt:

```bash
npx tauri icon src-tauri/app-icon.png
```

Die Quelle enthält keine Laufzeit- oder Unterrichtsdaten. Ein Programmupdate ersetzt das Icon zusammen mit dem App-Bundle; lokale Unterrichte, Materialien und Notizen bleiben außerhalb des Bundles erhalten.
