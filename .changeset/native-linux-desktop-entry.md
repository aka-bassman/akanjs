---
"@akanjs/devkit": patch
"akanjs": patch
---

A Linux desktop app's window is named after its app id (X11 `WM_CLASS`, Wayland `app_id`), so a dock or task bar finds its `<app id>.desktop` and shows that entry's name and icon instead of a generic one; the dock plugin's badge and progress name the same entry. The AppImage `build-desktop --installer true` makes carries `<app id>.desktop` with `StartupWMClass=<app id>` and `<app id>.png`, so the entry AppImageLauncher or appimaged installs under another file name still matches the window. The hidden entry that handles the app's deep links now shows the app's icon (installed as `~/.local/share/icons/hicolor/256x256/apps/<app id>.png`), and from an AppImage it starts the AppImage itself (`$APPIMAGE`) rather than the mount point it ran from, which is gone once the app quits, so a link opened after quitting the app no longer fails.
