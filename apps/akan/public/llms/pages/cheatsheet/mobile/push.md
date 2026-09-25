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
- Send And Retire Dead Tokens (#token-lifecycle)

## Content

Push Notifications

Firebase Cloud Messaging. Akan sends to web, Android and iOS through it.

Apple's push service. FCM hands iOS messages to it, so Firebase needs an Apple key.

push token

The address of one app install. `register()` returns it, and the server sends to it.

VAPID key

The web push key pair. Its public half goes in the client env as `vapidKey`.

service account

The Firebase Admin credential the server sends with. It never reaches the client.

The iOS entitlement that picks the APNs development or production path.

Web

In the consoles

Firebase app

One Firebase project, with a web, Android or iOS app registered in it.

A Web Push certificate key pair, generated in Firebase's Cloud Messaging settings.

APNs auth key (.p8)

Created in Apple Developer, then uploaded to Firebase for development and production.

In the app folder

The public Firebase web config and `vapidKey`, under `firebase`.

The Android Firebase config, copied into the native project by `mobile.files`.

The iOS Firebase config, copied the same way.

`@capacitor/push-notifications` and `@capacitor-community/fcm` as app dependencies.

Turns on native push for the mobile target in `akan.config.ts`.

On the server

`pushNoti.firebase`: the service account the server sends with, for every platform.

The OS push bridge: permission, native registration, click and action listeners, delivered notifications and Android channels.

Firebase token access. It keeps Android and iOS on the same Firebase Admin send({ token }) contract.

Asks for permission when needed and returns a `PushToken`, or `undefined`.

Returns the current token without asking for permission.

Reads the current permission state.

Shows the permission prompt and returns the answer.

Tells whether push can work in this runtime.

Routes notification clicks. The hook already runs it on mount.

required

The notification title.

The notification body.

One device's push token. Send either `token` or `topic`.

An FCM topic. Every device subscribed to it receives the message.

Where a click lands. It arrives in the message as `data.url`.

An image shown in the notification.

Extra key-value pairs delivered with the message.

Push Setup

The browser prompt appears, a token comes back, and the server logs a successful send. Nothing arrives on the phone.

Words used on this page

Term

What you prepare

Item

Needed

Not needed

Why Two Plugins

Akan uses FCM as its push provider, so a native app needs two Capacitor plugins: one for the OS push bridge and one for the FCM token.

Web Push

Web push needs no native project at all. Register a Firebase web app and copy its public config into the client env.

Create or open a web app in Firebase Console.

Open Firebase Console

Open Firebase web config docs

Open Firebase web push credentials docs

The client env file then looks like this:

Android Push

Open Firebase Console and select the project.

Add an Android app.

Open Firebase Android setup docs

Open google-services.json docs

Android Notification Details

Android can need display settings beyond token registration. Three of them are yours to decide:

Open Capacitor push notification channel docs

iOS Push

iOS push is the same Firebase registration plus an Apple credential, and it is where most silent failures live. What you own is which APNs credential Firebase holds.

Open Firebase iOS setup docs

Open GoogleService-Info.plist docs

Copy it into the generated App target and confirm its target membership in Xcode.

Open Apple push notification registration docs

Open Firebase APNs certificate docs

Upload APNs credentials for both development and production. Development serves simulator and debug builds; production serves TestFlight and the App Store.

Copy the plist the same way Android copies its file:

Which APNs Environment You Built

Command

Used for

Local simulator and device runs, through the APNs sandbox.

A local run in release mode.

Release build generation.

Store and TestFlight releases.

Client Registration

What usePushNotification() returns

Method

Store The Token

Each device's token is yours to keep, not Akan's. This section shows one way to store tokens in the database and send only to active ones; shape yours to fit your app.

Push token lifecycle

Client: register()

Server: registerPushToken

Server: load active tokens

Server: send(token)

User device

Invalid?

Server: retire the token

yes

Two filters find one token and a user's live devices:

The store action is the ordinary one: call the endpoint, then toast. Nothing here is push-specific; the token is just an argument.

Send And Retire Dead Tokens

Server credential

Open Firebase Admin setup docs

The service registers, retires and sends, and turns FCM's dead-token answer into a retirement:

What send() takes

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

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  secrets: ["secrets/**"],
  mobile: {
    appId: "com.myapp.app",
    targets: {
      default: {
        permissions: ["push"],
        files: {
          android: {
            "app/google-services.json": "secrets/google-services.json",
          },
        },
      },
    },
  },
};

export default config;
```

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  secrets: ["secrets/**"],
  mobile: {
    targets: {
      default: {
        permissions: ["push"],
        files: {
          ios: {
            "App/App/GoogleService-Info.plist": "secrets/GoogleService-Info.plist",
          },
        },
      },
    },
  },
};

export default config;
```

### apps/myapp/lib/userDevice/UserDevice.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/myapp/client";
import { usePushNotification } from "@libs/util/webkit";
import { buttonRecipe } from "akanjs/ui";

interface RegisterPushTokenProps {
  className?: string;
}
export const RegisterPushToken = ({ className }: RegisterPushTokenProps) => {
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
import { enumOf, ID } from "akanjs/base";
import { via } from "akanjs/constant";

export class PushProvider extends enumOf("pushProvider", ["fcm"] as const) {}
export class PushPlatform extends enumOf(
  "pushPlatform",
  ["web", "android", "ios"] as const,
) {}

export class UserDeviceInput extends via((field) => ({
  token: field(String),
  platform: field(PushPlatform),
  provider: field(PushProvider),
  deviceId: field(String).optional(),
})) {}

export class UserDeviceObject extends via(UserDeviceInput, (field) => ({
  userId: field(ID, { ref: "user" }),
  disabledAt: field(Date).optional(), // set when FCM rejects the token
})) {}

export class LightUserDevice extends via(
  UserDeviceObject,
  ["platform", "disabledAt"] as const,
  (resolve) => ({}),
) {}

export class UserDevice extends via(
  UserDeviceObject,
  LightUserDevice,
  (resolve) => ({}),
) {}

export class UserDeviceInsight extends via(UserDevice, (field) => ({})) {}
```

### apps/myapp/lib/userDevice/userDevice.document.ts

```ts
import { ID } from "akanjs/base";
import { by, from, into } from "akanjs/document";
import * as cnst from "../cnst";

export class UserDeviceFilter extends from(cnst.UserDevice, (filter) => ({
  query: {
    byToken: filter()
      .arg("token", String)
      .query((token) => ({ token })),
    ofUser: filter()
      .arg("userId", ID)
      .query((userId, q) => q.all({ userId }, q.empty("disabledAt"))),
  },
  sort: {},
})) {}

export class UserDevice extends by(cnst.UserDevice) {}

export class UserDeviceModel extends into(
  UserDevice,
  UserDeviceFilter,
  cnst.userDevice,
  () => ({}),
) {}
```

### apps/myapp/lib/userDevice/userDevice.signal.ts

```ts
import { Admin, Self, User } from "@libs/shared/srvkit";
import { endpoint, internal, slice } from "akanjs/signal";
import * as cnst from "../cnst";
import * as srv from "../srv";

export class UserDeviceInternal extends internal(srv.userDevice, () => ({})) {}

export class UserDeviceSlice extends slice(
  srv.userDevice,
  { guards: { root: Admin, get: Admin, cru: Admin } },
  () => ({}),
) {}

export class UserDeviceEndpoint extends endpoint(
  srv.userDevice,
  ({ mutation }) => ({
    registerPushToken: mutation(Boolean, { guards: [User] })
      .body("pushToken", cnst.UserDeviceInput)
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
  }),
) {}
```

### apps/myapp/lib/userDevice/userDevice.store.ts

```ts
import { msg } from "@apps/myapp/client";
import type { PushToken } from "@libs/util/webkit";
import { store } from "akanjs/store";
import { fetch, sig } from "../useClient";

export class UserDeviceStore extends store(sig.userDevice, () => ({
  // state
})) {
  // action
  async registerPushToken(pushToken: PushToken) {
    await fetch.registerPushToken(pushToken);
    msg.success("userDevice.pushTokenRegistered");
  }
}
```

### apps/myapp/env/env.server.local.ts

```ts
import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  pushNoti: {
    firebase: {
      type: "service_account",
      project_id: "...",
      private_key_id: "...",
      private_key: "...",
      client_email: "...",
    },
  },
};
```

### apps/myapp/lib/userDevice/userDevice.service.ts

```ts
import { PushNotificationServer } from "@libs/util/srvkit";
import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";
import * as db from "../db";

interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

export class UserDeviceService extends serve(db.userDevice, ({ plug }) => ({
  pushNotificationServer: plug(PushNotificationServer),
})) {
  async registerPushToken(userId: string, pushToken: db.UserDeviceInput) {
    const { token } = pushToken;
    const userDevice = await this.userDeviceModel.findByToken(token);
    if (userDevice) return await userDevice.set({ userId }).save();
    return await this.userDeviceModel.createUserDevice({
      ...pushToken,
      userId,
    });
  }
  async invalidatePushToken(token: string) {
    await this.userDeviceModel
      .updateByToken(token)
      .set({ disabledAt: dayjs() });
  }
  async notifyUser(userId: string, message: PushMessage) {
    const userDevices = await this.userDeviceModel.listOfUser(userId);
    return await Promise.all(
      userDevices.map((userDevice) => this.notify(userDevice.token, message)),
    );
  }
  async notify(token: string, message: PushMessage) {
    try {
      return await this.pushNotificationServer.send({ token, ...message });
    } catch (error) {
      // FCM answers a token the device dropped with this code, forever.
      const { code } = error as { code?: string };
      if (code !== "messaging/registration-token-not-registered") throw error;
      await this.invalidatePushToken(token);
      return null;
    }
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

