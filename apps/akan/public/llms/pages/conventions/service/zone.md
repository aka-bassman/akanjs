# Service.Zone.tsx

- Source: /conventions/service/zone
- Mirror: /llms/pages/conventions/service/zone.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- Service.Zone.tsx (#service-zone)
- Hold No Markup (#no-markup)
- Seed It From The Route (#seed-from-route)
- Or Just Write The Page (#or-a-page)

## Content

Service.Zone.tsx

Like the Util beside it, none of the eight service modules in this workspace has one. A Zone is the section a page drops in whole — and a capability with no records to list usually has no section, it has a screen, or it has one button inside somebody else's.

When one is right, it is because the section is real: several controls that share store state, arranged together, reused on more than one route. A search console, an upload panel, a device dashboard. If it appears on exactly one route, it is that route.

Hold No Markup

A model module's Zone reads the store and delegates to a View, which is a server component in the same folder. A service module has no View — so the server component it delegates to lives in ui/, and the Zone hands it the state as props or takes it back as children.

Two store reads, one wrapper element, and everything a person actually looks at is a server component. The header arrives as a ReactNode slot rather than as children, because a slot lets the page compose server content in a named position instead of one anonymous one — Layout.Navbar takes five of them for exactly this reason.

Wrap the interaction, not the UI

the smallest useful client component adds one behaviour and renders children untouched, so the markup inside never reaches the bundle

Push the boundary to the leaf

a Zone that reads three keys and renders forty elements is a Zone that reads three keys and a server component that renders forty

Take an id, not a model

a cnst model on a Zone prop is a lint error — the class instance loses its methods crossing the boundary and arrives as a plain object wearing the model's type

Seed It From The Route

The reflex to resist is loading on mount. A useEffect with an empty dependency array renders an empty shell, hydrates, then asks the server a question the server could have answered before the first byte — and akan quality ssr reports it as akan.ssr.client-mount-load.

The page fetches, the page awaits, and the Zone takes the resolved value as a prop. A client component never calls fetch.* at all, and fetch.init* is refused there by a lint rule of its own — that one is a hydration snapshot whose only consumer is a Load.* init prop, so from the client it is two extra round trips landing in a value nothing reads.

Where the data comes from:

Server data the section needs immediately — await it in the page and pass it down as a prop.

Server data the section can render around — hand the unawaited promise to <Load.Stream of={…}> and let it resolve behind its own boundary.

Anything a click asks for — a store action, called through st.do.*. An interaction-driven fetch is not a mount load and is not flagged.

Or Just Write The Page

_oauth needed a consent screen, an approve button, a deny button and a connected-apps list. It has none of these two files. The screen is a route in libs/shared/page/oauth, the buttons are a plain form post that the cookie session authenticates, and the module ships ten endpoints and no component at all.

That is worth copying rather than working around. A form post needs no script, so the consent page ships as HTML and works before any bundle arrives — which for a screen that authorizes another application to act as you is the point, not an optimization.

A lib may own routes as well as modules: libs/<lib>/page follows the same rules as an app's, and an app opts in with syncPageLibs in akan.config.ts. The routes are then linked into apps/<app>/page/(libs)/(<lib>), which is generated and gitignored — edit the lib source, never the link.

## Code Examples

### apps/koyo/lib/_receipt/Receipt.Zone.tsx

```ts
"use client";

import { st } from "@apps/koyo/client";
import { ReceiptPreview } from "@apps/koyo/ui";
import type { ReactNode } from "react";

interface ConsoleProps {
  className?: string;
  header: ReactNode;
}
export const Console = ({ className, header }: ConsoleProps) => {
  const preview = st.use.receiptPreview();
  const printing = st.use.printing();
  return (
    <section className={className}>
      {header}
      <ReceiptPreview preview={preview} disabled={printing} />
    </section>
  );
};
```

### apps/koyo/page/receipt/_index.tsx

```ts
export default page().render(async () => {
  const { l } = usePage();
  getSelf({ unauthorize: "/signin" });
  const [templates] = await Promise.all([fetch.listReceiptTemplates()]);
  return <Receipt.Zone.Console header={<h1 className="font-bold text-2xl">{l("receipt.console")}</h1>} templates={templates} />;
});
```

### apps/akan/akan.config.ts

```typescript
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  syncPageLibs: ["shared"],
};

export default config;
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

