# UI Architecture

- Source: /docs/arch/frontend
- Mirror: /llms/pages/docs/arch/frontend.md
- Section: docs
- Category: Architecture
- Priority: P0

## Headings

- UI Architecture (#ui-overview)
- How A Page Reaches The Browser (#server-side-rendering)
- What Earns A Client Component (#client-boundary)
- In Domain UI The Rule Is Mechanical (#file-roles)
- Splitting One Screen (#splitting-a-screen)
- Measuring The Split (#quality-ssr)

## Content

UI Architecture

Server. One row, one card, one tile. Takes the model as a prop and renders it. Never carries the directive.

Server. The detail surface for one record. Takes the full model as a prop. Never carries the directive.

Client. The composed page section that reads the store and hydrates from an init or view prop. Always "use client" on line 1, and it should hold almost no markup of its own.

Client. The form. Every field is bound to the store, so a Template contains zero useState. Always "use client" on line 1.

Client. One domain action as a control — Serve, Refund, Remove. Always "use client" on line 1, and it takes ids rather than model instances.

The directive is there but the file uses no client-only capability at all. Delete it.

A component in a client file renders four or more JSX elements with zero client-only capability. It is server-renderable markup sitting in the bundle.

Ten or more JSX elements wrapped around one or two client-only touches. Split it: the touch stays client, the subtree goes server.

A useEffect with an empty dependency array loads server data. The route can fetch it before the first byte. A reactive effect with real dependencies is not flagged.

A module renders only from Template, Zone and Util and declares no Unit or View at all, so every consumer pays for hydration just to display the model.

A Template holds form state in useState instead of the store. Bind the field with value={xForm.field} and onChange={st.do.setFieldOnX}.

You add "use client" to a file because one button in it has an onClick. The file is two hundred lines of product markup and one handler, and now all two hundred lines ship twice: once as the HTML the server already rendered, and again as JavaScript the browser has to download, parse and re-run before that one button works.

Akan is SSR-first. Every element that renders on the server ships as markup and costs nothing to hydrate, so the default is server and the directive is a cost you justify per component rather than a habit. This page is about where that line falls, why it is mechanical rather than a judgment call, and how to see where your app currently sits.

How A Page Reaches The Browser

Server-side rendering means the server prepares the first visible HTML before the browser has finished loading the app. A customer reads the order list, the price and the policy text while the filter and the submit button are still arriving. Viewing and interacting do not have to happen at the same moment.

One request, end to end

How quickly the user can read something meaningful: order titles, sizes, prices, the first rows, the policy text. Server rendering is what moves this.

How quickly the user can type, click, filter or receive a live update. Only the hydrated islands move this, and every element you keep on the server makes them smaller.

The shell does not have to wait for every query. fetch.init<Model><Suffix>, fetch.view<Model> and fetch.edit<Model> are awaitable and destructurable: destructuring hands out one promise per field with both queries already in flight, so a route can send the shell and give each section its own promise. Awaiting instead keeps that section in the shell, which is what SEO snapshots, prerendering and pre-hydration E2E read — so await what the page needs immediately and stream the rest.

The heading is server markup. The Zone is the only thing in the tree that hydrates, and it receives the unawaited promise rather than an awaited value, so the heading is on the wire while the slice query is still running. A promise that no Zone consumes goes to a Load.Stream instead, which the composition page covers.

What Earns A Client Component

There are exactly five capabilities that require the browser. Everything else on a screen — including all the markup around them — is server work. This is the whole decision, and it is the same table akan quality ssr reads when it decides whether a directive was earned.

Capability

In Domain UI The Rule Is Mechanical

Inside a domain module you never make the call above. The file role decides it: Template, Zone and Util always carry the directive on line 1, and Unit and View never do. If a file's role and its directive disagree, one of the two is wrong.

File

The pair below is the shape the rule produces. The Zone is client because it hydrates the store from init; it holds no markup of its own and delegates every row to a server Unit.

The Unit takes the model as a prop and renders it. No directive, no import of st, nothing to hydrate — a hundred rows on screen cost the bundle exactly one component, the Zone.

Splitting One Screen

Outside a domain module — an app shell, a marketing section, a dashboard — you place the boundary yourself. Push it down until it sits on the leaf that actually needs the browser, and let everything above and inside it stay server markup:

Wrap, do not absorb

A client component that adds one behaviour and renders children untouched keeps its whole subtree on the server.

Split compound components

Tab, Tab.Menus, Tab.Menu and Tab.Panel are four small client shells; the panel bodies arrive as children and never enter the bundle. One client file with a mode useState and every panel inlined is the opposite.

Use named slots

Layout.Navbar takes title, back, left, right and children, so a client shell composes server content in five places instead of absorbing it.

Derive on the server

Display and predicate logic belongs on Light<Model>, which both sides hold; enum-to-class lookups belong in a module-scope as const map.

Keep the heavy island late

A map, an editor or a chart goes behind the ui/<Folder>/index_.tsx and lazy() pair, with a server-safe index.tsx beside it. Collapsing the pair into one file breaks RSC.

That file is the whole client cost of a copy button: one handler and one children pass-through. The label, the icon and the receipt block around it are written in the page and stay server markup, however large they grow.

Measuring The Split

None of the above is a style preference, so it is measured rather than reviewed. akan quality ssr counts JSX elements per side and reports the share each app and lib keeps on the server, plus the six findings below. It reads the .tsx files under ui/ and lib/ in every app and lib — page/ and webkit/ are outside the measurement, so moving markup into a route neither helps nor hurts the number.

Rule

Three things are deliberately not flagged. A client-only third-party package and an index_.tsx lazy() boundary are legitimate reasons for the directive; a Zone, Template or Util inside a module is exempt because its role requires the directive whether or not today's body uses it; and an interaction-driven fetch — a lookup inside an onClick — is work the server could not have done. Only mount-time loads are findings.

Run it before and after any change that touches .tsx, and treat --format json as the hook for CI. With the boundary settled, the next page is about what fills the space on either side of it: the akanjs/ui shells that render a list, a detail view and a form without you writing a loading state, and the generated helpers underneath them.

## Code Examples

### apps/koyo/page/(public)/icecreamOrder/_index.tsx

```ts
import { fetch, IcecreamOrder, usePage } from "@apps/koyo/client";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const { icecreamOrderInitInPublic } = fetch.initIcecreamOrderInPublic();
  return (
    <div className="p-4">
      <h1 className="font-bold text-2xl">{l("icecreamOrder.modelName")}</h1>
      <IcecreamOrder.Zone.Card init={icecreamOrderInitInPublic} />
    </div>
  );
});
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx

```ts
"use client";
import { IcecreamOrder, type cnst } from "@apps/koyo/client";
import type { ClientInit } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"icecreamOrder", cnst.LightIcecreamOrder>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(icecreamOrder) => (
        <IcecreamOrder.Unit.Card key={icecreamOrder.id} icecreamOrder={icecreamOrder} />
      )}
    />
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Unit.tsx

```ts
import type { cnst } from "@apps/koyo/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ icecreamOrder, href }: ModelProps<"icecreamOrder", cnst.LightIcecreamOrder>) => {
  return (
    <Link href={href} className="flex w-full rounded-lg shadow-sm hover:shadow-lg">
      <div>{icecreamOrder.size}</div>
      <div>{icecreamOrder.status}</div>
    </Link>
  );
};
```

### apps/koyo/ui/CopyOrderId.tsx

```ts
"use client";
import type { ReactNode } from "react";

interface CopyOrderIdProps {
  className?: string;
  orderId: string;
  children: ReactNode;
}
export const CopyOrderId = ({ className, orderId, children }: CopyOrderIdProps) => {
  return (
    <button type="button" className={className} onClick={() => void navigator.clipboard.writeText(orderId)}>
      {children}
    </button>
  );
};
```

### Terminal

```bash
$ akan quality ssr

Akan SSR Balance Scan
scanned files: 827
ssr warnings: 14

Server render share (component files, JSX elements rendered per side):

  apps/koyo: 43% server (163 of 381 JSX elements, 218 client)  <- below the 50% target
  libs/shared: 62% server (460 of 742 JSX elements, 282 client)

Warnings:

apps/koyo/ui/OrderPanel.tsx:189:1 - warning akan.ssr.client-static-markup: Client component
"OrderPanel" renders 16 JSX elements around only 1 client-only touch (onClick). Most of this
subtree does not need the client bundle.
  fix: Keep the interactive element in the client component and hoist the static subtree into a
  server component, then accept it as `children` or render it through a Unit/View reference.
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

