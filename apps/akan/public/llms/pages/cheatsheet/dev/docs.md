# Documentation

- Source: /cheatsheet/dev/docs
- Mirror: /llms/pages/cheatsheet/dev/docs.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- API Documentation (#overview)
- Render A Zone (#zone)
- Try An Endpoint (#try-api)
- Auth And Guards (#auth)
- Tips (#tips)

## Content

Documentation

required

The file that declares a module's endpoints. One signal becomes one API document.

Your app's typed API client from `@apps/<app>/client`. The explorer reads endpoints from it.

A class that decides who may call an endpoint, such as `Public`, `User` or `Admin`.

A sign-in token. Paste one to call guarded endpoints as that account.

The two WebSocket kinds: a subscription the server pushes to, and a message answered on a listener.

Summary

Counts of all endpoints, REST, WebSocket, and those published as MCP tools.

Toolbar

Shows the Base URL and sets the guard filter, the JWT and an endpoint search.

Every query and mutation, generated CRUD and slice reads included. Each row has Reference and Try it.

A pubsub row subscribes and shows frames as they land. A message row listens and sends.

The signal to document: `base`, or a module name such as `product`.

The app's own `fetch`. A signal the app does not mount shows as unregistered.

optional

Opens every endpoint row. Leave it off for a signal with many endpoints.

One signal's whole document: summary, toolbar, REST and WebSocket lists.

The toolbar alone. Pass `search` and `onSearch` to add the search box.

Every signal the app mounts, one collapsible row each, with REST endpoints only.

One signal's REST endpoints, or only those named in `endpoints`. The `ping` demo below uses it.

The method badge: GET for a query, POST for a mutation.

guard badges

The guards the endpoint declares. An endpoint with none shows no badge.

MCP badge

Whether agents can call it as an MCP tool. A refused row says why underneath.

The arguments (path, query, body, form data), the return type and an example response.

Inputs filled with example values, the request path to copy, and a Send Request button.

No arguments. Returns `"ping"`.

Takes a path parameter `id` and returns `pingParam: <id>`.

Takes a query-string `id` and returns `pingQuery: <id>`.

Takes a body field `data` and returns `pingBody: <data>`.

Press Listen, then Send. The reply `wsPing: <data>` appears in the stream.

A room to try Subscribe and Unsubscribe on.

The server the explorer calls. Click it to copy.

Filters by any of the guards your signals declare. A guardless endpoint counts as `Public`.

Reads Anonymous or Authorized, and opens the JWT window.

Filters the rows by endpoint name or path.

Signal Components

Every Signal part and its members.

MCP Server

Why an endpoint is published to agents or refused.

Authorization

The guards an endpoint can declare.

Testing

Automated tests for your signals.

API Documentation

Words used on this page

Term

What one document shows

Render A Zone

Render that component from a route.

First, the client component:

Then render it from a route:

Other parts

Component

Try An Endpoint

Reading a row

Part

The rest of the base signal

Endpoint · Kind

What to try

Auth And Guards

The toolbar

Field

Tips

Read next

## Code Examples

### apps/myapp/ui/ApiDocs.tsx

```ts
"use client";
import { fetch } from "@apps/myapp/client";
import { Signal } from "akanjs/ui";

export const ApiDocs = () => {
  return <Signal.Doc.Zone refName="base" fetch={fetch} openAll />;
};
```

### apps/myapp/page/(admin)/api/_index.tsx

```ts
import { ApiDocs } from "@apps/myapp/ui";
import { page } from "akanjs/client";

export default page()
  .config({ devOnly: true })
  .render(() => <ApiDocs />);
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

