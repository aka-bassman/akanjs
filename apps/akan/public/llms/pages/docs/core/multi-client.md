# Multi Client

- Source: /docs/core/multi-client
- Mirror: /llms/pages/docs/core/multi-client.md
- Section: docs
- Category: Core Concepts
- Priority: P0

## Headings

- When To Split (#when-to-use)
- Multi Client (#multi-client)
- Route Config (#route-config)
- Page Structure (#page-structure)
- Local And Production (#local-production)
- CSR And Mobile Builds (#csr-mobile)

## Content

Multi Client

When To Split

Your app has grown a second audience. The storefront and the admin console want different domains, different first screens, maybe different mobile packages — but the same products, the same orders, the same permissions. Creating a second app would duplicate all of that. Splitting the pages with basePath does not.

The test is whether the surfaces are sold, deployed, or reached as separate products. If they are, split them; if one is a section of the other, a route group is enough:

Situation

normal routing

Akan can serve multiple web clients from one app by splitting pages with basePath. Every route sits under the locale, so locally a client is the segment right after it — /en/store — but in production the matching domain hides that segment and serves the client as a separate site.

Multi web

Each basePath can behave like its own website.

Single backend

All clients still share the same app server, domain modules, and services.

Separate builds

CSR web and mobile apps can be prepared per basePath.

Route Config

Define clients in akan.config.ts with routes. The basePath names the client, and domains decide which production host should open that client.

The client this route opens, and the first page folder its routes live under. For basePath store, pages live under page/store. Akan strips the slashes, so /store/ and store are the same value.

Hosts that open this basePath, keyed by deployment branch. main, develop, and debug always exist, and naming any other key adds that branch. When the host matches, users see the site without the basePath segment.

Page Structure

When routes define base paths, every page file must be placed under one of those first folders. Pages directly under page/ are invalid because Akan cannot assign them to a client.

In local development, you open each client with the locale followed by its basePath, such as /en/store or /ko/admin. After deployment, a configured domain can open that same client without showing the basePath in the URL.

Rule: once basePath is declared, pages outside page/basePath/ are not allowed. Akan raises an error instead of routing them.

Local And Production

The same app can feel different depending on where it runs. Locally, basePath is visible so developers can move between clients in one web server. In production, domains can map directly to each client.

Local development

Production domains

partner declares no domain of its own, and still has one. Akan derives <basePath>-<branch>.<serveDomain> for every basePath on every branch it knows, so partner-main.example.com and partner-develop.example.com exist without being written down.

Locally the site root has no page of its own, so Akan answers it with a list of every basePath in the build instead of a 404. Deployed hosts never see that list; the matching domain opens its client directly.

CSR And Mobile Builds

When the app is built, Akan can prepare CSR web output per basePath. Mobile targets can also point to a basePath, so Android and iOS apps can open the right client from the same backend.

A target's basePath must name one the routes declared. An unknown value fails the config load rather than building a package that opens nothing.

This is the main idea: multi web and multi app clients, but one Akan app, one server runtime, and one backend domain model.

## Code Examples

### apps/myapp/akan.config.ts

```ts
const config = {
  routes: [
    { domains: { main: ["store.example.com"] }, basePath: "store" },
    { domains: { main: ["admin.example.com"] }, basePath: "admin" },
    { domains: {}, basePath: "partner" },
    { domains: {}, basePath: "demo" },
  ],
};
```

### page/

```bash
page/
├── store/
│   ├── _layout.tsx
│   ├── _index.tsx
│   └── products/
│       └── _index.tsx
├── admin/
│   ├── _layout.tsx
│   └── users.tsx
└── partner/
    ├── _layout.tsx
    └── (public)/
        └── signin.tsx
```

### Code

```bash
http://localhost:8282/en/store
http://localhost:8282/en/admin
http://localhost:8282/en/partner
```

### Code

```bash
https://store.example.com  -> store
https://admin.example.com  -> admin
https://partner-main.example.com -> partner
```

### Mobile targets

```ts
const config = {
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
      store: {
        basePath: "store",
        appName: "Example Store",
        appId: "com.example.store",
      },
      admin: {
        basePath: "admin",
        appName: "Example Admin",
        appId: "com.example.admin",
      },
    },
  },
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

