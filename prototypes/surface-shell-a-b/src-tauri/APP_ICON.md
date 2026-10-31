# Tafelraum app icon

`app-icon.png` is the square source image for the native app icon. Generate the platform-specific files under `icons/` from this image:

```sh
npx tauri icon src-tauri/app-icon.png
```

The icon contains no lesson or runtime data. It is part of the program bundle. Lesson materials and notes live outside the bundle.
