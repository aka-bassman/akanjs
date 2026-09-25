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

A `lib/_<name>` folder with no model: a service, a signal, a dictionary and often a store.

The file role for a section a page drops in whole. It is always a client component.

A file without "use client". It runs on the server and arrives as HTML.

A file that starts with "use client". It arrives as HTML, then again as JS the browser re-runs.

A `ReactNode` prop such as `header`. The page renders its content on the server and passes it in.

Not a Zone

A screen of its own

A route, like the OAuth consent screen in `libs/shared/page/oauth`.

One button in another screen

A `ui/` component the service store drives, or rarely a `Service.Util.tsx`.

A section on exactly one route

It is that route. Write it in the page itself.

A Zone

A section reused on several routes

Several controls that share store state, laid out together.

Server data needed at once

Await it in the page and pass it down as a prop.

Server data the section can wait for

Hand the unawaited promise to `<Load.Stream of={…}>`. It resolves behind its own boundary.

Anything a click asks for

A store action, called through `st.do.*`.

Consent screen

A route: `libs/shared/page/oauth/consent/_index.tsx`.

Approve and deny buttons

A plain `<form method="post">` that the cookie session authenticates.

Connected-apps list

An endpoint, `listOAuthConnections`, for the app's own page to call.

What the module ships

Ten endpoints and zero components.

Every lib the app depends on that ships a `page` folder.

Exactly the libs listed.

The default. No lib routes.

A Zone is a section a page drops in whole, such as a search console, an upload panel or a device dashboard. Most service modules never need one: of the eight in this workspace, none has a Zone, and none has a Util either.

The reason is that a service module has no records to list. Its UI is usually a screen of its own or one button inside another screen, not a section.

Words used on this page

Term

Where each kind of UI goes

The UI is

Goes here

Not here

A section earns a Zone only when all three of these hold:

Hold No Markup

Keep the boundary small

Seed It From The Route

Instead, the page fetches and awaits, and the Zone takes the result as a prop:

Where the data comes from

Data

How it reaches the Zone

Or Just Write The Page

What _oauth needed

How it got it

Routes can live in a lib

syncPageLibs value

Brings in

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
  templates: string[];
}
export const Console = ({ className, header, templates }: ConsoleProps) => {
  const preview = st.use.receiptPreview();
  const printing = st.use.printing();
  return (
    <section className={className}>
      {header}
      <ReceiptPreview
        preview={preview}
        templates={templates}
        disabled={printing}
      />
    </section>
  );
};
```

### apps/koyo/page/receipt/_index.tsx

```ts
import { fetch, Receipt, usePage } from "@apps/koyo/client";
import { getSelf } from "@libs/shared/webkit";
import { page } from "akanjs/client";

export default page().render(async () => {
  const { l } = usePage();
  getSelf({ unauthorize: "/signin" });
  const [templates] = await Promise.all([fetch.listReceiptTemplates()]);
  return (
    <Receipt.Zone.Console
      header={<h1 className="font-bold text-2xl">{l("receipt.console")}</h1>}
      templates={templates}
    />
  );
});
```

### apps/koyo/akan.config.ts

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

