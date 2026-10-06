---
"@akanjs/devkit": minor
"akanjs": minor
---

The macOS dmg `build-desktop --installer true` makes opens on a drag-to-Applications window: no toolbar, sidebar or status bar, 128 pt icons of the app and the Applications link on a background with an arrow between them (1x and 2x in one multi-resolution TIFF), and the app's icon on the mounted disk (`.VolumeIcon.icns`). Its own files (`.background`, `.VolumeIcon.icns`, `.DS_Store`, `.fseventsd`) are hidden. The window is a `.DS_Store` written directly while a read-write image is mounted, never through Finder or AppleScript, so a headless CI builds the same image; the compressed image is made afterwards and is what gets signed, notarized and stapled. `native.desktop.dmg` (a target's too) replaces the background (`background`, `background2x`, or `false`) and moves the window and the icons (`window`, `iconSize`, `textSize`, `app`, `applications`, in points); the default background lines up with the default positions only.
