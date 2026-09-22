# Push Notifications

- Source: /cheatsheet/mobile/push
- Mirror: /llms/pages/cheatsheet/mobile/push.md
- Section: cheatsheet
- Category: Mobile
- Priority: P2

## Headings

- Push Setup (#push-setup)
- Why Two Plugins (#push-plugins)
- Web Push (#web-push)
- Android Push (#android-push)
- iOS Push (#ios-push)
- Which APNs Environment You Built (#apns-environment)
- Client Registration (#client-registration)
- Store The Token (#token-store)
- Retire A Dead Token (#token-lifecycle)

## Content

Push Notifications

Push Setup

You wire up notifications, the browser prompt appears, a token comes back, and your server reports a successful send. Nothing arrives on the phone. Push is one client call and three separate platform surfaces behind it, and a send that succeeds against the wrong credential looks exactly like one that worked.

Push setup has three separate surfaces: web push, Android push, and iOS push. Akan gives one client API, usePushNotification(), but the platform setup is still different.

Akan automates

Writing public/firebase-messaging-sw.js on akan sync, so the static fallback serves your own copy.

Android POST_NOTIFICATIONS permission when target.permissions includes push.

iOS aps-environment, remote-notification background mode, and Capacitor AppDelegate bridge.

You provide

App package dependencies for Capacitor push and FCM.

Firebase web config, google-services.json, and GoogleService-Info.plist.

Firebase Console app registration and APNs credentials.

Why Two Plugins

@capacitor/push-notifications handles the OS push bridge: permission, native registration, notification click events, and Android channels. @capacitor-community/fcm handles Firebase-specific token access such as FCM.getToken(). Akan uses FCM as the provider, so native apps need both.

Use for notification permission, native registration, notification action/click listener, delivered notifications, and Android notification channels.

Use for Firebase Messaging token access. This keeps Android and iOS server delivery on the same Firebase Admin send({ token }) contract.

Both belong in apps/myapp/package.json, not only in the workspace root — Capacitor links native plugins from the app package. Setup covers the dependency block itself.

Web Push

Web push needs no native project at all. Register a Firebase web app, copy its public config into the client env, and the push plugin writes the service worker for you on sync.

Web push

Create or open a Firebase web app in Firebase Console.

Copy the public Firebase web config into env.client.*.

Create a Web Push certificate key pair and put the VAPID public key in vapidKey.

The push plugin generates public/firebase-messaging-sw.js from the client Firebase config on akan sync.

Android Push

Android push is a Firebase registration whose package name has to match mobile.appId exactly, plus one config file copied into the generated native project.

Android push

Open Firebase Console and select the project.

Add an Android app.

Enter the same package name as mobile.appId.

Download google-services.json.

Place it at apps/myapp/public/google-services.json.

google-services.json is a client/native Firebase config file. It is not the Firebase Admin service account JSON. Server credentials belong in env.server.*.

Android notification details

Android can require extra notification behavior outside token registration. Create channels when you need stable categories such as order updates or chat messages, set the default icon/color in the native project if the launcher icon is not appropriate, and decide foreground presentation behavior in app code.

iOS Push

iOS push is the same Firebase registration plus an Apple credential, and it is where most silent failures live. Akan writes the entitlement and the AppDelegate bridge; what you own is which APNs credential Firebase holds.

iOS push

Register an iOS app in Firebase using the same bundle id as mobile.appId.

Download GoogleService-Info.plist.

Copy it into the generated App target and confirm target membership in Xcode.

Add permissions: ["push"] to the mobile target. Akan writes the iOS push entitlement, remote-notification background mode, and the AppDelegate bridge needed by Capacitor.

In Apple Developer, prefer creating an APNs auth key from Keys and upload the .p8 key in Firebase Console > Cloud Messaging. If you are in Certificates and only see Apple Push Notification service SSL, that is the certificate-based APNs setup instead.

Upload APNs credentials for both development and production in Firebase. Development is required for simulator/debug delivery; production is required for TestFlight and App Store delivery.

Keep GoogleService-Info.plist in the app folder, then copy it into the generated iOS project with mobile.files. If Firebase Console sends to a token but nothing arrives while simctl push works, check the APNs development/production credential that matches the built aps-environment.

Do not add firebase-ios-sdk directly in Xcode when using @capacitor-community/fcm. Direct Firebase Swift Package products can conflict with the plugin's Firebase dependency version.

Which APNs Environment You Built

You never write aps-environment. Akan writes it into the entitlement from the command that produced the build, and that one string decides which of the two APNs credentials in Firebase can reach the device. A build signed for one and sent through the other fails silently on Apple's side.

Command

That is why Firebase wants both credentials uploaded rather than whichever one you are testing with today: the same project serves a simulator run and a TestFlight build, and they reach Apple through different doors.

Client Registration

Call register() from a user-facing action such as a settings toggle or an enable-notifications button. It may ask for permission. After it returns a PushToken, immediately pass that token to your app's storage API.

registerPushToken is not an Akan built-in API. It is the app-level API shown below. Name it and shape it to match your user/device domain.

Requests permission when needed and returns a PushToken containing token, platform, provider, and optional deviceId.

Store the returned PushToken through an app-level user/device API. Akan does not decide where your user domain keeps device credentials.

Send a url field from the server. Akan normalizes it into data.url so notification clicks can enter the CSR router.

Store The Token

Each device's token is managed at the app level, not by Akan. This section explains how to store and manage tokens in a database and how to send notifications using active tokens.

The methods described in this section are examples. Manage tokens in a way that matches your app's structure.

Retire A Dead Token

The store action is the ordinary three lines — call the endpoint, then toast. Nothing here is push-specific; the token is just another value the form already holds.

The service is where a device that uninstalled the app gets cleaned up. FCM answers one specific error code for a token the device no longer holds, and it keeps answering it forever, so a send loop that does not retire the token grows a permanent share of guaranteed failures.

## Code Examples

### apps/myapp/env/env.client.local.ts

```ts
export const env = {
  firebase: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    vapidKey: "...",
  },
};
```

### Android push file copy

```ts
const config: AppConfig = {
  mobile: {
    targets: {
      default: {
        permissions: ["push"],
        files: {
          android: {
            "app/google-services.json": "public/google-services.json",
          },
        },
      },
    },
  },
};
```

### iOS push file copy

```ts
const config: AppConfig = {
  mobile: {
    targets: {
      default: {
        permissions: ["push"],
        files: {
          ios: {
            "App/GoogleService-Info.plist": "public/GoogleService-Info.plist",
          },
        },
      },
    },
  },
};
```

### apps/myapp/lib/userDevice/UserDevice.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/myapp/client";
import { usePushNotification } from "@libs/util/webkit";
import { buttonRecipe } from "akanjs/ui";

interface EnablePushProps {
  className?: string;
}
export const EnablePush = ({ className }: EnablePushProps) => {
  const { l } = usePage();
  const push = usePushNotification();
  return (
    <button
      className={buttonRecipe({ variant: "primary" }, className)}
      onClick={async () => {
        const pushToken = await push.register();
        if (pushToken) await st.do.registerPushToken(pushToken);
      }}
      type="button"
    >
      {l("userDevice.signal.registerPushToken")}
    </button>
  );
};
```

### apps/myapp/lib/userDevice/userDevice.constant.ts

```ts
export class PushProvider extends enumOf("pushProvider", ["fcm"] as const) {}
export class PushPlatform extends enumOf("pushPlatform", ["web", "android", "ios"] as const) {}

export class UserDeviceToken extends via((field) => ({
  userId: field(ID, { ref: "user" }),
  token: field(String),
  platform: field(PushPlatform),
  provider: field(PushProvider),
  deviceId: field(String).optional(),
  disabledAt: field(Date).optional(),
})) {}
```

### apps/myapp/lib/userDevice/userDevice.signal.ts

```ts
export class UserDeviceEndpoint extends endpoint(srv.userDevice, ({ mutation }) => ({
  registerPushToken: mutation(Boolean, { guards: [User] })
    .body("pushToken", cnst.UserDeviceToken)
    .with(Self)
    .exec(async function (pushToken, self) {
      await this.userDeviceService.registerPushToken(self.id, pushToken);
      return true;
    }),
  invalidatePushToken: mutation(Boolean, { guards: [Admin] })
    .body("token", String)
    .exec(async function (token) {
      await this.userDeviceService.invalidatePushToken(token);
      return true;
    }),
})) {}
```

### apps/myapp/lib/userDevice/userDevice.store.ts

```ts
import { msg } from "@apps/myapp/client";
import type { PushToken } from "@libs/util/webkit";
import { store } from "akanjs/store";
import { fetch, sig } from "../useClient";

export class UserDeviceStore extends store(sig.userDevice, () => ({})) {
  async registerPushToken(pushToken: PushToken) {
    await fetch.registerPushToken(pushToken);
    msg.success("userDevice.pushTokenRegistered");
  }
}
```

### apps/myapp/lib/userDevice/userDevice.service.ts

```ts
import { PushNotificationServer } from "@libs/util/srvkit";
import { serve } from "akanjs/service";
import * as db from "../db";

export class UserDeviceService extends serve(db.userDevice, ({ plug }) => ({
  pushNotificationServer: plug(PushNotificationServer),
})) {
  async notify(token: string, title: string, body: string, url: string) {
    try {
      return await this.pushNotificationServer.send({ token, title, body, url });
    } catch (error) {
      // FCM answers a token the device no longer holds with this code, and keeps answering it forever.
      if ((error as { code?: string }).code !== "messaging/registration-token-not-registered") throw error;
      await this.invalidatePushToken(token);
      return null;
    }
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

