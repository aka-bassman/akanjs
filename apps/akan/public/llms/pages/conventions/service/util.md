# Service.Util.tsx

- Source: /conventions/service/util
- Mirror: /llms/pages/conventions/service/util.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- Service.Util.tsx (#service-util)
- The Shape, If You Write One (#shape)
- What Sync Will Accept (#allowlist)

## Content

Service.Util.tsx

Not one of the eight service modules in this workspace has this file. That is the most useful thing this page can tell you, and it is not an oversight waiting to be corrected — the rest of the page is about why the file is rare, and what it takes for yours to be the exception.

A model module's Util is the verb minus the noun: Serve, Refund, Complete. It belongs to the module because the button it wraps is the module's own endpoint and the record it acts on is the module's own model. A service module has the verb and no noun — so the control usually belongs to the screen that offers it, not to the capability behind it.

Put it in ui/

The component renders JSX and is not bound to one model — which is the admission test for ui/ verbatim. A disconnect button, a permission prompt, a map control: all of them are ui/ components the service store happens to drive.

Put it in page/

The capability has a screen of its own rather than a section inside somebody else's. The OAuth consent page is a route in libs/shared/page/oauth, which is why _oauth ships ten endpoints and no component.

Put it here

Only when the control is meaningless outside this module — it reads this store, calls this endpoint, and moving it to ui/ would mean importing the module back in. Then it is a Util, and only then.

The Shape, If You Write One

A Util is always a client component, mechanically: "use client" on line 1, above the imports, in every .Util.tsx there is. Exports are role names, and for a service module the role is the endpoint verb.

Three rules are load-bearing in those sixteen lines. The props interface sits immediately above the component with className first and is not exported. The prop is an id string rather than the order itself — a cnst model on a Util prop is a lint error, because the server would have to hand a class instance across the boundary and the methods do not survive the trip. And the label comes from the dictionary, never from a literal.

What Sync Will Accept

A service module folder has exactly two component roles: Service.Util.tsx and Service.Zone.tsx. There is no Template, no Unit and no View. akan sync will happily collect a file that ignores that — the rule is carried by akan quality scan, which asks for predictable module UI filenames and names service modules as Util and Zone only.

Those three missing roles are the three that would need a model. Template binds to a model's form state, Unit renders one light model, View renders one full model — none of which a service module has. What is left is one client control and one client section, and the framework agrees that is all there should be: the SSR scanner exempts every lib/_ folder from the rule that warns when a module renders only from client files, because a service module owns no model to render on the server.

## Code Examples

### apps/koyo/lib/_receipt/Receipt.Util.tsx

```ts
"use client";

import { st, usePage } from "@apps/koyo/client";
import { Button } from "akanjs/ui";

interface PrintProps {
  className?: string;
  icecreamOrderId: string;
}
export const Print = ({ className, icecreamOrderId }: PrintProps) => {
  const { l } = usePage();
  const printing = st.use.printing();
  return (
    <Button className={className} disabled={printing} onClick={() => st.do.printReceipt(icecreamOrderId)}>
      {l("receipt.print")}
    </Button>
  );
};
```

### Terminal

```bash
akan quality scan   # names a Template, Unit or View under lib/_<service>
akan quality ssr    # lib/_<service> is exempt from akan.ssr.module-missing-server-view
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

