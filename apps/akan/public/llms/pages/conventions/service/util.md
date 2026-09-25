# Service.Util.tsx

- Source: /conventions/service/util
- Mirror: /llms/pages/conventions/service/util.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- Service.Util.tsx (#service-util)
- The Shape, If You Write One (#shape)
- Two Component Roles (#allowlist)

## Content

Service.Util.tsx

A `lib/_<name>` folder with no model: a service, a signal, a dictionary and often a store.

A `lib/<model>` folder built around one stored model. Its Util acts on that model's records.

The file role for a small control, such as a button, that runs an endpoint.

A file that starts with "use client". It arrives as HTML, then again as JS the browser re-runs.

The app or lib folder for components that render JSX and are not bound to one model.

Model Module: Verb And Noun

A Util is named for the endpoint verb minus the noun: Serve, Refund, Complete. The button runs the module's own endpoint on the module's own record, so it belongs there.

Service Module: Verb Only

It has endpoints but no model, so there is no record for the control to belong to. The control usually belongs to the screen that offers it, not to the capability behind it.

Usually

Not bound to one model

A disconnect button, a permission prompt, a map control. The service store only drives it.

A screen of its own

The OAuth consent screen is a route in `libs/shared/page/oauth`, not a component.

Rarely

Meaningless outside this module

It reads this store and calls this endpoint. In `ui/` it would import the module back in.

Line 1, above the imports, in every `.Util.tsx`. A Util is always a client component.

The endpoint `printReceipt` minus its noun. Callers write `<Receipt.Util.Print>`.

Sits right above the component with `className` first, and is not exported.

An id, not the order. A `cnst` model prop arrives on the client as a plain object, methods stripped.

Publishes the button to the in-page agent, so a click and the agent run one handler.

The label comes from the module's dictionary, never from a string literal.

Roles that need a model

Binds to a model's form state.

Renders one light model, such as a list card.

Renders one full model, such as a detail screen.

Roles that need no model

One client control.

One client section a page drops in whole.

The other component role, for a whole section.

The common case: a control bound to one model's records.

Where most service-driven controls actually live.

The store keys and actions a Util reads and calls.

This page explains why the file is rare, where the control goes instead, and what it takes for yours to be the exception.

Words used on this page

Term

Why it is rare

Where the control goes

The control is

Goes here

Not here

The Shape, If You Write One

The rules in the file

Part

Two Component Roles

Role

Allowed

Not allowed

Related pages

## Code Examples

### apps/koyo/lib/_receipt/Receipt.Util.tsx

```ts
"use client";

import { st, usePage } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { Button } from "akanjs/ui";

interface PrintProps {
  className?: string;
  icecreamOrderId: string;
}
export const Print = ({ className, icecreamOrderId }: PrintProps) => {
  const { l } = usePage();
  const isPrinting = st.use.isPrinting();
  const print = st
    .tool("printReceipt")
    .desc("Print the receipt of one ice cream order.")
    .arg("icecreamOrderId", ID)
    .exec((id) => st.do.printReceipt(id));
  return (
    <Button
      className={className}
      disabled={isPrinting}
      onClick={() => print(icecreamOrderId)}
    >
      {l("receipt.print")}
    </Button>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

