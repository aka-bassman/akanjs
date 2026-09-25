# Setup

- Source: /cheatsheet/mobile/setup
- Mirror: /llms/pages/cheatsheet/mobile/setup.md
- Section: cheatsheet
- Category: Mobile
- Priority: P2

## Headings

- Mobile Setup Flow (#overview)
- Mobile Config (#mobile-config)
- Capacitor Plugins (#capacitor-plugins)
- Android Setup (#android-setup)
- iOS Setup (#ios-setup)
- Verify Setup (#verify)

## Content

Setup

The native shell that runs your web app in a WebView and reaches device APIs through plugins.

CSR bundle

The single-page build of your app. The native app ships it, so keep `web.csr` on.

One native app built from your Akan app. Its key in `mobile.targets` is the `--target` value.

The app's permanent ID: the package name on Android and the bundle ID on iOS.

The Android Studio and Xcode projects, created inside the app folder on the first run.

plugin

A native module such as camera or push. It works only when the app's `package.json` lists it.

1. Mobile config

2. Capacitor plugins

Install the toolchains, run the app on a device, then set up signing and store builds.

4. Verify

Check each feature on a real device instead of stopping at a green build.

app name

Name under the home-screen icon. A store listing may show a different name.

Android package name and iOS bundle ID. Console and Firebase registrations must match it.

The version users see: Android `versionName` and iOS `MARKETING_VERSION`.

Store build number: Android `versionCode`, iOS build. Raise it for every store upload.

One entry per native app. The key is the name `--target` takes.

Device features to prepare. Only `camera`, `contacts`, `location`, `push` and `speech` exist.

Home route. A deep link opens on top of it, and Android back returns to it before exiting.

The client to open in a multi-client app. It must be a `basePath` declared in `routes`.

Copies app files into the native project. Key: a path in `ios/` or `android/`. Value: the source.

Per-target override, like `appName`, `version`, `buildNum`. A different `appId` is a separate app.

Camera and photo library usage text

`READ_MEDIA_IMAGES`, storage read and write

Contacts usage text

Location usage text, for always and while in use

Remote-notification background mode, `aps-environment`, Firebase in `AppDelegate`

Speech recognition and microphone usage text

Added for you

Add by hand

Used by the app shell itself

The Capacitor runtime itself.

Android back button, deep-link events and app exit.

Reads the platform and device language at startup.

Reports the keyboard height so the screen can move with it.

Haptic feedback, loaded at startup.

Reads the notch and home-indicator insets at startup.

On-device storage, where the sign-in token is kept.

Opens an external `Link` in the system browser.

Per feature

Camera and photo picker. Pair with `camera`.

Current location. Pair with `location`.

The OS push bridge. Pair with `push`.

Shows web pages inside the app.

The FCM token for native push. Pair with `push`.

Address book access. Pair with `contacts`.

Voice input. Pair with `speech`.

Spoken output. Pair with `speech`.

Runs on an emulator or phone. `--release` ships the web build instead of the dev server.

A release APK, to check that the project builds.

An APK or an AAB (`--assemble-type`) for the Play Store.

Runs on a simulator or phone. `--release` ships the web build instead of the dev server.

Builds the iOS app with Capacitor, to check that the project builds.

The same build against the `main` backend, for an App Store release.

Command

Default --env

What you get

A key of `mobile.targets`, or `all`. With a single target it is picked for you.

The backend the app talks to. The default differs per command, as in the table above.

Run a bundled web build, so no dev server is needed.

Also open the native project in Android Studio or Xcode.

Delete and recreate the native project. Hand edits in `android/` or `ios/` are lost.

`aab` for a Play Store upload, `apk` to install the file directly.

Allow `--env local` in a release build. For local testing only.

For a phone, pick your team under Signing & Capabilities and check provisioning.

Run on a simulator first, then move to a phone for device-only features.

Add the plugin to `apps/myapp/package.json`, then rerun `start-ios` or `start-android`.

Blank screen on a phone

The phone cannot reach your dev server. Use the same Wi-Fi, or set `AKAN_PUBLIC_CLIENT_HOST=<ip>`.

No permission prompt, or an iOS crash on first use

Add the feature to `permissions` and rerun, so the native entries are written.

A native file is missing

A `files` key is a path inside `android/` or `ios/`, not inside the app folder.

A notification tap opens the wrong screen

Send `url: "/some/path"` in the data and check that the tap opens that CSR route.

Android push

The package name matches the Android app registered in Firebase.

The notification permission is granted on the phone.

The Firebase project is the one the server sends with.

iOS push

You test on a real device.

The APNs key is uploaded to Firebase, and the provisioning profile allows push.

Push Notifications

Firebase, APNs and the client API, per platform.

Deep Links

Custom URL schemes and verified HTTPS app links.

Every Mobile Field

Icons, splash images and passthrough Capacitor config.

CLI Reference

Every flag of the mobile commands.

Mobile Setup Flow

An Akan mobile app is your CSR web app running inside a Capacitor shell for Android and iOS. The web app owns the pages and business logic. The shell owns the package ID, device permissions, plugin linking, native files, signing and store builds.

Words used on this page

Term

Four steps

Push notifications and deep links are optional. Set them up after this page, and only if the app needs them.

Mobile Config

What each permission adds

A permission writes that feature's native settings on the next run. It does not install the plugin; that is the next section.

Permission

Several native apps from one app

Capacitor Plugins

Package

Yes

No

Beyond the default set, add only the plugins the app actually calls. Native push, for example, needs the FCM plugin next to the push plugin:

Android Setup

Prerequisites

Android Studio with the Android SDK.

Open the Android Studio download

JDK 21, reachable from your shell.

Open Homebrew openjdk@21

Open the Android application ID docs

Run on a device

Point your shell at JDK 21 and the Android SDK:

In a second terminal, run the app on an emulator or a connected phone:

Commands and store builds

Open the Android app signing docs

Mobile command flags

iOS Setup

This prepares the Xcode project: bundle ID, signing, simulator runs and store builds. Run on a simulator first, then on a phone for device-only features.

Xcode.

Open the Xcode download

Open the Apple bundle ID docs

An Apple developer team, for phone runs and releases.

Open the Apple signing docs

Xcode checks

Verify Setup

A green build is not the finish line. On a real device, check that plugins load, native files are in place, permission prompts appear, and push arrives and opens the right screen.

Symptom

What to check

Push on each platform

Next

## Code Examples

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  mobile: {
    appName: "Acme Shop",
    appId: "com.acme.shop",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      default: {
        permissions: ["camera"],
      },
    },
  },
};

export default config;
```

### apps/myapp/akan.config.ts

```ts
const config: AppConfig = {
  routes: [
    { basePath: "shop", domains: { main: ["shop.acme.com"] } },
    { basePath: "partner", domains: { main: ["partner.acme.com"] } },
  ],
  mobile: {
    appName: "Acme Shop",
    appId: "com.acme.shop",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      shop: { basePath: "shop" },
      partner: {
        basePath: "partner",
        appName: "Acme Partner",
        appId: "com.acme.partner",
      },
    },
  },
};
```

### apps/myapp/package.json

```json
{
  "dependencies": {
    "@capacitor/push-notifications": "*",
    "@capacitor-community/fcm": "*"
  }
}
```

### Terminal

```bash
brew install openjdk@21
JDK_PREFIX="$(brew --prefix openjdk@21)"
export JAVA_HOME="$JDK_PREFIX/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

### Terminal

```bash
akan start myapp
```

### Terminal

```bash
akan start-android myapp
```

### Terminal

```bash
akan build-android myapp --target default
akan release-android myapp --target default --env main --assemble-type aab
```

### apps/myapp/android/gradle.properties

```yaml
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_STORE_PASSWORD=<store password>
MYAPP_RELEASE_KEY_ALIAS=upload
MYAPP_RELEASE_KEY_PASSWORD=<key password>
```

### Terminal

```bash
akan start-ios myapp
akan start-ios myapp --device "iPhone 16"
```

### Terminal

```bash
akan build-ios myapp --target default
akan release-ios myapp --target default --env main
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

