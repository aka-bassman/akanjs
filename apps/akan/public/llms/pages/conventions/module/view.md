# Model.View.tsx

- Source: /conventions/module/view
- Mirror: /llms/pages/conventions/module/view.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- Model.View.tsx (#overview)
- View vs Unit (#comparison)
- Standard View Shape (#standard-view-shape)
- Full Model Detail Patterns (#detail-patterns)
- Using View In Pages (#using-view-pages)
- Load.View And Store Hydration (#load-view)
- Practical Rules (#practical-rules)

## Content

Model.View.tsx

The complete model class, such as `cnst.Ticket`, with every field the constant declares.

A slimmer class, such as `cnst.LightTicket`, holding only the fields a list needs.

What `fetch.viewTicket(id)` returns as `ticketView`: one record as plain data.

Filling the client store with data the server already fetched, so no second request is sent.

Takes the full model

Every field is there, including long text and nested data that a list leaves out.

Only draws

It may render Units, Utils, Zones and its own subcomponents. Saving and deciding happen elsewhere.

Exports General

Drawn through a Zone

Model

Export

Props

Drawn by

one record in full

For one detail page or detail section.

one item of many

For list rows, cards and compact summaries.

The full model instance, built from the payload's `<model>Obj`.

Set to `false`, so the View draws right away with no loading state.

Set to `"view"`, so a modal wrapper opens the record to read, not its edit form.

The `Date` the server stamped on the payload, used to compare it with the store.

Drawing — the View's job

fields and markup

Titles, body text, nested data and formatted numbers from the full model.

Field names, enum values and headings come from the dictionary.

A View may render Units, Utils and Zones; each keeps its own job.

Behaviour — another file

Hooks need the browser, so they live in a Util or a Zone.

Store reads and writes. The store, signal and service do the actual mutation.

Hydrates the store from the view payload and hands the model to the View.

Called in the route, so the query starts before the first byte is sent.

The light-model counterpart, for list rows and cards.

Where the buttons and actions inside a View live.

The detail Zone, with every prop of Load.View.

UI Architecture

Why each UI file role runs on the server or the client.

A View file draws one record in full: the body of a detail page or a detail section. It takes the full model as a prop and only draws it.

Words used on this page

Term

View vs Unit

Both files only draw a model. They differ in how much of the model they get and in the role they play on the page.

Standard View Shape

Every View file starts from the same skeleton. Here is the whole file for a ticket:

Full Model Detail Patterns

A View receives the full model, not the light summary, so it can draw any field the constant declares on it. Plain text fields go straight into the markup:

An enum goes through its dictionary label, and a number is formatted where it is drawn:

Using View In Pages

Destructure — streamed

The page markup is sent while the query runs. The section fills in behind its own boundary.

await — part of the shell

For when the page itself reads the model: a title, an id for a link, or a redirect decision.

Streamed

The usual detail page does not await, and hands the promise across as it is:

Awaited

Load.View And Store Hydration

What it writes to the store

Store key

Practical Rules

What belongs in a View, and which file takes everything else:

The work

Belongs here

Not here

Related pages

## Code Examples

### apps/koyo/lib/ticket/Ticket.View.tsx

```ts
import { type cnst, usePage } from "@apps/koyo/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  ticket: cnst.Ticket;
}

export const General = ({ className, ticket }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <h1>{ticket.title}</h1>
      <div>
        {l("ticket.status")}: {l(`ticketStatus.${ticket.status}`)}
      </div>
      <p>{ticket.content}</p>
    </div>
  );
};
```

### apps/blog/lib/article/Article.View.tsx

```ts
import type { cnst } from "@apps/blog/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  article: cnst.Article;
}

export const General = ({ className, article }: GeneralProps) => {
  return (
    <article className={cn("flex flex-col gap-2", className)}>
      <h1>{article.title}</h1>
      <p>{article.description}</p>
    </article>
  );
};
```

### apps/koyo/lib/order/Order.View.tsx

```ts
import { type cnst, usePage } from "@apps/koyo/client";

interface GeneralProps {
  className?: string;
  order: cnst.Order;
}

export const General = ({ className, order }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={className}>
      <span>{l(`orderStatus.${order.status}`)}</span>
      <div>{order.totalPrice.toLocaleString()}</div>
    </div>
  );
};
```

### apps/koyo/page/ticket/[ticketId]/_index.tsx

```ts
import { fetch, Ticket } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("ticketId", ID)
  .render(({ ticketId }) => {
    const { ticketView } = fetch.viewTicket(ticketId);
    return <Ticket.Zone.View view={ticketView} />;
  });
```

### apps/koyo/page/ticket/[ticketId]/_index.tsx

```ts
import { fetch, Ticket, usePage } from "@apps/koyo/client"; // [!code collapse:4]
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { buttonRecipe, Link } from "akanjs/ui";

export default page()
  .param("ticketId", ID)
  .render(async ({ ticketId }) => {
    const { l } = usePage();
    const [{ ticket, ticketView }] = await Promise.all([
      fetch.viewTicket(ticketId),
    ]);
    return (
      <div className="flex flex-col gap-4">
        <Ticket.Zone.View view={ticketView} />
        <Link className={buttonRecipe()} href={`/ticket/${ticket.id}/edit`}>
          {l("base.updateModel", { model: l("ticket.modelName") })}
        </Link>
      </div>
    );
  });
```

### apps/koyo/lib/ticket/Ticket.Zone.tsx

```ts
"use client"; // [!code collapse:4]
import { type cnst, Ticket } from "@apps/koyo/client";
import type { ClientView } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface ViewProps {
  className?: string;
  view: ClientView<"ticket", cnst.Ticket>;
}
export const View = ({ className, view }: ViewProps) => {
  return (
    <Load.View
      className={className}
      view={view}
      renderView={(ticket) => <Ticket.View.General ticket={ticket} />}
    />
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

