---
"akanjs": minor
"@akanjs/cli": minor
"@akanjs/devkit": minor
"create-akan-workspace": minor
---

Improve the mobile Capacitor workflow:

- Auto-declare default Capacitor plugins in the app package.json before iOS/Android launch
- Expand mobile runtime peer dependencies and workspace-root preflight installs
- Derive repo-scoped default bundle ids to avoid Apple portal collisions
- Add `akan doctor --ios` to flag placeholder bundle identifiers
- Add `--device` to `akan start ios` for non-interactive simulator/device selection
- Prefer newer iOS runtimes and warn on SwiftUICore-incompatible simulators
- Detect SwiftUICore dyld failures with actionable guidance
- Select a routable LAN host for mobile live reload with override support
- Raise Android minSdkVersion to 26 for bundled Capacitor plugins
- Include `@capacitor-community/fcm` in push notification runtime packages
- Resolve client port from `window.location` on the browser client
