---
"akanjs": minor
---

Web push has one owner, and it draws once

`/firebase-messaging-sw.js` was a framework route that built the worker in memory from `env.client.ts` on every
request. It matched ahead of the static fallback, so an app's own `public/firebase-messaging-sw.js` was never
served and there was no way to turn it off — including the one the push plugin's `syncAssets` had already written
there, which meant editing that file changed nothing a browser ever saw. The route is gone. The plugin owns the
worker, `akan sync` writes it, and the static fallback serves it.

Because the plugin writes a file rather than answering a request, it now rewrites a worker whose body has changed
instead of skipping any file that exists — otherwise a fix here would never reach an app that had synced once. The
file opens with a banner; remove that line and sync leaves the file alone, which is how an app takes the worker
over.

The worker itself had four bugs, all of them the kind that only show up with a real device in hand:

- **It never activated on time.** With no `install`/`activate` handlers a visitor who already had a worker got the
  new one on the visit *after* their next one. It now calls `skipWaiting()` and `clients.claim()`.
- **One push arrived as two notifications.** firebase-js-sdk draws a payload carrying a `notification` block
  itself and *then* calls `onBackgroundMessage`, so drawing there unconditionally doubled it — visible as a
  duplicate without a `tag`, and as a re-alert with one. The handler is now data-only.
- **Every click opened a new tab**, and a full reload rather than a route change. It now focuses an open window
  and hands the path over; `openWindow` is the fallback, not the default.
- **A badge count in `data.badgeCount` went nowhere.** The worker applies it through `setAppBadge`, guarded —
  Firefox and desktop Safari ship no such method and an unguarded call is a synchronous `TypeError`.

`AkanSyncContext` gained `readFile`, the pair of the `fileExists`/`writeFile` it already had, so a plugin can tell
what it is about to overwrite.

The app-side half ships in `libs/util`, which is where the worker and the hook now live. FCM hands a payload to
the page instead of the worker whenever a visible window client exists, and `usePushNotification` listened only in
the worker — so a push sent while the app was on screen was dropped outright, with FCM reporting the send as
delivered, which is what makes that one expensive to diagnose. The hook now installs `onMessage` and draws through
the worker's registration, receives the worker's click handover, and routes it through `router.enterDeepLink`.
