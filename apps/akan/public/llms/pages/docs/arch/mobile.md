# Mobile App Architecture

- Source: /docs/arch/mobile
- Mirror: /llms/pages/docs/arch/mobile.md
- Section: docs
- Category: Architecture
- Priority: P0

## Headings

- Mobile App Architecture (#mobile-overview)
- Mobile Targets (#mobile-targets)
- CSR Runtime (#csr-runtime)
- Native Bridge (#native-bridge)

## Content

Mobile App Architecture

Client-side rendering: the app draws every screen itself from JavaScript on the device.

An open-source runtime that wraps a web app in a real Android and iOS project.

The Android and iOS project around your web client. It holds the app icon, ID and signing.

A Capacitor package that exposes one device feature to JavaScript. This is the native bridge.

One native package built from an Akan app, with its own name and app ID.

One UI surface

Written once, shared with the web

Web and mobile share the same Akan page tree, client router, generated fetch calls, dictionaries, and UI components.

Native shell boundary

The Capacitor project

Native code owns packaging, signing, app capabilities, plugin linking, and store distribution.

Shared backend

The server you already run

Android, iOS, and web clients call the same Akan services and can share auth, permission, database rules, and app-level domains.

Controls CSR page motion so mobile navigation can feel closer to native apps.

Handles OS system areas such as notches, home indicators, and Android system bars.

Reserves room in px for app chrome such as navbars, tabs and fixed actions; true reserves 48px.

Permissions describe which native capabilities a mobile target intends to use.

Native config files such as Firebase config live in the app folder.

Native schemes, universal links, and app links enter the Akan CSR router as normalized routes.

Push delivery uses Firebase/FCM setup, while click routing uses a standard data.url field.

Akan ships the same product to the web and to the app stores, and you do not write a second app for mobile. The screens you already built for the web run inside a thin native app; only the parts that truly need the phone, such as packaging, signing and device features, are native.

Concretely, Akan mobile apps are CSR web clients running inside a Capacitor native shell. The product screen is still built with Akan page, UI, state, and service patterns; Capacitor supplies the native project, app identity, store package, and device bridge.

Akan mobile architecture

The Akan app builds a CSR client that runs inside the Capacitor native shell, which is packaged for Android and iOS and talks to the shared Akan backend.

Words used on this page

Term

Who owns what

Mobile Targets

Sometimes one product is really two apps in the store, such as a customer app and a staff app. Each needs its own name and app ID, yet both should run on the same backend. Mobile targets are for exactly that.

A mobile target is one native package built from an Akan app. A single Akan app can publish multiple mobile packages by pointing each target at a different basePath while reusing the same backend modules.

One app, two store packages

One Akan app builds two store packages, a store app and an admin app, each opening its own basePath, and both talk to the same backend.

— each basePath gets its own domain.

— the app's name, app ID, version and build number.

— one entry per package, each with its own basePath, display name and app ID.

Give each basePath its own host: the server resolves an incoming host to exactly one basePath, so two basePaths sharing a domain leave one of them unreachable.

Use targets when packages need different app IDs, display names, entry surfaces, permissions, deep links, or store release tracks.

CSR Runtime

An app feels native because of small things: screens slide in, content stays clear of the notch, the tab bar stays put, and the keyboard does not cover the input. You get all of them without rewriting any UI in native code.

The mobile page frame

A phone screen split from top to bottom into the safe area around the notch, the top inset for the navbar, the page content, and the bottom inset for tabs above the home indicator.

Inside the native shell, Akan uses the CSR router and mobile page frame. Page transitions, safe area, navbar/bottom inset layers, keyboard accessories, and page cache are handled at the client runtime layer instead of requiring a native UI rewrite. A page declares them with the .config() stage of its page() chain.

The frame settings a page can declare in .config():

Native Bridge

Web code alone cannot reach the camera, push notifications or the file system. Device capabilities are accessed through Capacitor plugins, and Akan keeps the app-level API small. Using one takes three steps:

Declare the native capability the app needs.

Sync and build the native project.

Call the matching client hook or plugin wrapper from the CSR app.

What the bridge covers

Setup, step by step

The concrete setup steps live in the mobile cheatsheets:

Setup

Mobile config, Capacitor plugins, and the Android and iOS projects.

Page transitions, the back gesture, the frame config and the keyboard inset.

Custom schemes, universal links and app links.

Firebase/FCM setup, registering the device and storing its token.

## Code Examples

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  routes: [
    { domains: { main: ["store.example.com"] }, basePath: "store" },
    { domains: { main: ["admin.example.com"] }, basePath: "admin" },
  ],
  mobile: {
    appName: "Example App",
    appId: "com.example.app",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      store: { basePath: "store", appName: "Example Store", appId: "com.example.store" },
      admin: { basePath: "admin", appName: "Example Admin", appId: "com.example.admin" },
    },
  },
};

export default config;
```

### page/store/product/[productId].tsx

```ts
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Layout } from "akanjs/ui";

export default page()
  .param("productId", ID, { desc: "The product to show." })
  .config({ transition: "stack" })
  .render(({ productId }) => {
    return (
      <>
        <Layout.Navbar back>Product detail</Layout.Navbar>
        <div>Product {productId}</div>
      </>
    );
  });
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

