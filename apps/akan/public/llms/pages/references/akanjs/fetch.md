# akanjs/fetch

- Source: /references/akanjs/fetch
- Mirror: /llms/pages/references/akanjs/fetch.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/fetch (#akanjs-fetch)
- InitHandle / ViewHandle / EditHandle (#InitHandle / ViewHandle / EditHandle)
- ClientInit (#ClientInit)
- ClientView / ClientEdit (#ClientView / ClientEdit)
- SliceMeta (#SliceMeta)
- FetchInitForm (#FetchInitForm)
- Account (#Account)
- FetchClient (#FetchClient)
- getRequest / headers / cookies (#getRequest / headers / cookies)

## Content

akanjs/fetch

What `fetch.init*`, `fetch.view*` and `fetch.edit*` return. Await it, or read one field off it.

Plain data a Zone receives, such as `userInitInOrg`. It can cross from server to client.

A model class instance such as `cnst.User` or a `DataList`. It stays in server components.

A named list query of one model. The `inOrg` slice of `user` gives `fetch.initUserInOrg`.

A module's client component. It fills the store from a payload and renders it.

What `fetch.init*`, `fetch.view*` and `fetch.edit*` return: awaitable, or split per field.

Type of a Zone's `init` prop: a list payload or its promise.

Types of a Zone's `view` and `edit` props for one record.

The same three payloads, already resolved instead of a promise.

Names the slice a component works on: `refName`, `sliceName` and `argLength`.

Options for loading a list: page, limit, sort, insight, default values and invalidate.

`{ queryKey, args }`: the filter a root-slice list component runs.

The account data a sign-in token carries.

The runtime client behind every app's `fetch`.

Read the request a page is being rendered for. Server only.

Everything else

`HttpClient`, `WsClient`, `AgentTurn`, request helpers like `getRequestTheme`, and client types.

Handle

Returned by

Fields

Server

Plain payload

The list payload. Pass it to the Zone's `init` prop.

One record's payload. Pass it to the Zone's `view` or `edit` prop.

Hydrated instances

A `DataList` of Light models, such as a list to count.

The aggregate as an Insight model instance.

The full model instance of one record.

The model's ref name, such as `"user"`. The payload's keys are named after it.

The Light model each row is, such as `cnst.LightUser`.

The Insight model of the aggregate.

The slice's argument tuple.

The model's filter class. It types the sort key.

Which slice the list came from: the same three fields as `SliceMeta`.

The rows, as plain objects.

The aggregate as a plain object. `null` when loaded with `insight: false`.

The current page, the page size, and the last page worked out from the count.

Whether another batch exists, read off the batch size rather than the count.

The arguments and the sort key the list was loaded with.

When the list was loaded.

Type

Handle field

Consumed by

The `view` prop of `Load.View`.

The `edit` prop of `Load.Edit`.

The model's ref name.

The record, as a plain object.

When the record was loaded. The edit payload uses this same key.

The model's ref name, such as `"ticket"`.

Ref name plus slice suffix, such as `ticketInProject`. The root slice's is the ref name itself.

How many query arguments the slice takes.

The page to load, counted from 1.

Rows per page.

One of the filter's sort keys. `latest`, `oldest` and `relevance` always exist.

`false` skips the aggregate query, so `<model>ObjInsight` is `null` and there is no total.

Values the slice's form starts from, and returns to after each save.

`false` reuses a list already loaded with the same arguments, page, limit and sort.

Builds a client for an API origin such as `getEnv().serverHttpUri`, prefix included.

Sends this token with every later call, over HTTP and WebSocket. `null` clears it.

A copy with the same endpoints, for another origin or user. `connect` defaults to `true`.

Budget for calls whose endpoint and caller name none: 30 seconds by default, `false` for no limit.

Open or close the WebSocket that `pubsub` and `message` endpoints use.

The `FetchClient` inside an app's `fetch` proxy.

Build an app's `fetch` in the generated `lib/sig.ts` and `lib/useClient.ts`.

The request being rendered.

The request headers, keys in lower case. A new Map on every call.

The parsed `Cookie` header. A `j:` value is decoded as JSON.

The whole per-request store: the request, its theme and its query cache.

`akanjs/fetch` holds the types that carry fetched data from a route to its components, and the client that sends those calls. Zone files import its types with `import type`.

Words Used On This Page

Term

Exports

InitHandle / ViewHandle / EditHandle

A route's `fetch.init*`, `fetch.view*` and `fetch.edit*` calls return a handle. Await it and you get the same object these helpers always gave; read a field off it and you get that field's own promise.

So each section renders as soon as its own data lands, and the page never waits for the slowest query.

Three Handles

Splitting A Page

Destructure the handle instead of awaiting it, and hand each field to the section that renders it:

Where Each Field Goes

Field

hand it here

not here

The Load Shells

How `Load.Units`, `Load.View` and `Load.Stream` render a handle's fields.

Zone Props

How a Zone takes `init`, `view` and `slice`.

ClientInit

`ClientInit` is the type of a Zone's `init` prop. It takes the resolved list payload or the `<model>Init<Suffix>` promise from the init handle; a pending promise renders behind the Zone's own Suspense boundary.

A list Zone declares it like this:

Type Parameters

Two are usually enough: the ref name and the Light model. The other three default to `any`.

What The Payload Holds

Every key but the first three is named after the model. For `user`, the rows are `userObjList`:

ClientView / ClientEdit

`ClientView` and `ClientEdit` are the Zone prop types for one record. Each takes the resolved payload or the promise the view or edit handle hands out.

Both payloads have the same three keys:

A Zone that shows a ticket and edits it:

SliceMeta

`SliceMeta` names the slice a component works on. `Model.*` and `Data.*` components take it as their `slice` prop, to know which store and which list to update after a save.

Read one off `fetch.slice`, and let a component take it as an optional prop:

FetchInitForm

`FetchInitForm` is the option object for loading a list: which page, how many rows, what order, and whether to count. It is the last argument of `fetch.init<Model><Suffix>()` and `st.do.init<Model><Suffix>()`.

Its type arguments, `Input` and `Filter`, type `default` and `sort`. Fields tagged `st.do.init*` are read by the store only. The defaults above apply to `fetch.init*`; `st.do.init*` keeps the list's current `page`, `limit` and `sort` when you leave them out.

A member list that shows no total loads without the count:

Account

`Account` is the account data a sign-in token carries. It always has `appName` and `environment`, and its type argument adds the app's own claims.

Read the current account with `getAccount()` from `akanjs/client`, in a page render or in the browser:

FetchClient

`FetchClient` turns the app's signal metadata into typed HTTP and WebSocket functions. The `fetch` an app imports is a proxy around one instance, so its instance methods are callable on `fetch` itself.

Member

Signal tests use `clone` to call the server as a signed-in user:

getRequest / headers / cookies

These read the request a page is being rendered for. `akanjs/fetch` pulls in no client code, so a server component can import them freely.

A page can read them while it renders:

## Code Examples

### apps/myapp/page/org/[orgId]/_index.tsx

```tsx
import { fetch, Org, User } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page()
  .param("orgId", ID)
  .render(({ orgId }) => {
    const { userInitInOrg, userListInOrg } = fetch.initUserInOrg(orgId);
    const { orgView } = fetch.viewOrg(orgId);
    return (
      <>
        <Org.Zone.View view={orgView} />
        <Load.Stream of={userListInOrg}>
          {(userList) => <User.Unit.Total count={userList.length} />}
        </Load.Stream>
        <User.Zone.Card init={userInitInOrg} />
      </>
    );
  });
```

### apps/myapp/lib/user/User.Zone.tsx

```tsx
"use client";
import { type cnst, User } from "@apps/myapp/client";
import type { ClientInit } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"user", cnst.LightUser>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(user) => <User.Unit.Card key={user.id} user={user} />}
    />
  );
};
```

### apps/myapp/lib/ticket/Ticket.Zone.tsx

```tsx
"use client";
import { type cnst, fetch, Ticket } from "@apps/myapp/client";
import type { ClientEdit, ClientView } from "akanjs/fetch";
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

interface EditProps {
  className?: string;
  edit: ClientEdit<"ticket", cnst.Ticket>;
}
export const Edit = ({ className, edit }: EditProps) => {
  return (
    <Load.Edit
      className={className}
      slice={fetch.slice.ticket}
      edit={edit}
      type="form"
    >
      <Ticket.Template.General />
    </Load.Edit>
  );
};
```

### apps/myapp/lib/ticket/Ticket.Util.tsx

```tsx
"use client";
import { fetch, Ticket } from "@apps/myapp/client";
import type { SliceMeta } from "akanjs/fetch";
import { Model } from "akanjs/ui";

interface EditProps {
  ticketId: string;
  slice?: SliceMeta;
}
export const Edit = ({
  ticketId,
  slice = fetch.slice.ticketInProject,
}: EditProps) => {
  return (
    <Model.Edit slice={slice} modelId={ticketId}>
      <Ticket.Template.General />
    </Model.Edit>
  );
};
```

### apps/myapp/page/org/[orgId]/member.tsx

```tsx
import { fetch, User } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("orgId", ID)
  .render(({ orgId }) => {
    const { userInitInOrg } = fetch.initUserInOrg(orgId, {
      limit: 50,
      sort: "oldest",
      insight: false,
    });
    return <User.Zone.Card init={userInitInOrg} />;
  });
```

### apps/myapp/webkit/cookie.ts

```ts
import { getAccount } from "akanjs/client";
import type { Account } from "akanjs/fetch";

interface SelfClaim {
  self?: { id: string };
}

export const getSelfId = () => {
  const account: Account<SelfClaim> = getAccount<SelfClaim>();
  return account.self?.id;
};
```

### apps/myapp/lib/user/user.signal.spec.ts

```ts
import { getOrSetupSignalTestFetch } from "akanjs/test";

import type { fetch as appFetch } from "../useServer";

type AppFetch = typeof appFetch;

export const getUserFetch = async (jwt: string): Promise<AppFetch> => {
  const fetch = await getOrSetupSignalTestFetch<AppFetch>();
  return fetch.clone({ jwt }) as AppFetch;
};
```

### apps/myapp/page/_index.tsx

```tsx
import { Promo } from "@apps/myapp/client";
import { page } from "akanjs/client";
import { cookies, getRequest, headers } from "akanjs/fetch";

export default page().render(() => {
  const referer = headers().get("referer") ?? getRequest()?.url;
  const campaign = cookies().get("campaign")?.value;
  return <Promo.Zone.Banner referer={referer} campaign={campaign} />;
});
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

