# Deep Links

- Source: /cheatsheet/mobile/links
- Mirror: /llms/pages/cheatsheet/mobile/links.md
- Section: cheatsheet
- Category: Mobile
- Priority: P2

## Headings

- Deep Link Setup (#deep-link-setup)
- The deepLinks Block (#deep-link-fields)

## Content

Deep Links

Scheme link

An app-only link. It needs no verification, so it is the easy one to test during development.

Domain link

Works like a normal web link but needs iOS and Android verification. Best for sharing, email and push URLs.

Scheme link. `orders` becomes the first path segment, so it opens `/orders/1`.

Domain link. The path is used as is and opens `/orders/1`.

A tapped push notification. It opens `/orders/1` the same way.

App-only URL schemes, such as `shop` in `shop://orders/1`.

Hosts whose HTTPS links open the app once iOS and Android verify them.

Your Apple Developer Team ID. iOS uses it to verify `domains`.

SHA-256 fingerprints of the certificates that sign the app. Android uses them to verify `domains`.

Scheme links

Domain links

Deep Link Setup

Two Kinds Of Link

Declare It

Where A Link Lands

Incoming link

What it opens

Mobile Config

Mobile targets and the rest of the `mobile` block.

Push Notifications

Sending a `url` so a tap lands on a screen.

The deepLinks Block

Every field is optional. Each platform reads only what it needs, so declare only what your link style requires:

What Each Link Style Needs

Scheme links need one field. Domain links need three, and each platform reads its own part:

Field

Read by this platform

Not read

Domain Verification

A domain link opens the app only after the platform confirms that the app belongs to the domain. It checks a file served from that domain:

Platform Docs

Open Apple Universal Links docs

Open Android App Links docs

Getting The Android Fingerprint

The surest way is to ask Gradle. It prints the SHA-256 of the key each build variant actually signs with:

You can also read it straight from a keystore. The default Android debug keystore already exists on any machine set up for Android development:

## Code Examples

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  mobile: {
    targets: {
      default: {
        deepLinks: {
          schemes: ["shop"],
          domains: ["shop.example.com"],
          ios: {
            teamId: "TEAMID",
          },
          android: {
            sha256CertFingerprints: ["AA:BB:CC:DD:..."],
          },
        },
      },
    },
  },
};

export default config;
```

### Terminal

```bash
cd apps/myapp/android
./gradlew signingReport
```

### Terminal

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

