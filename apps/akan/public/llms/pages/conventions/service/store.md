# service.store.ts

- Source: /conventions/service/store
- Mirror: /llms/pages/conventions/service/store.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.store.ts (#service-store)
- State The Screen Shares (#state)
- An Action Returns Nothing (#actions)
- Calling The Endpoint (#fetch)

## Content

service.store.ts

A value the store holds. A component that reads a key re-renders when that key changes.

A method of the store class. Components call it as `st.do.<action>()`.

How a client component reads a key (`st.use.<key>()`) and runs an action (`st.do.<action>()`).

A store bound to a model's signal, `store(sig.<model>, …)`. Lists, forms and CRUD are generated.

A store bound to a plain name, `store("<name>" as const, …)`. Nothing is generated from a model.

The map viewport and the notification permission, plus two map actions.

No state. Only the `login` and `logout` actions.

The empty scaffold.

Generated from the model's slices

A list and its insight for every slice.

Pagination state for every slice.

The edit form, with one setter per field.

CRUD actions that call the generated endpoints.

Comes with every key you declare

Subscribes a component to that one key.

A setter for the key, unless the key is `search`/`computed` or an action has that name.

Written by you

Methods in the class body. Besides the key setters, a service store has no other actions.

The only way a value leaves an action. An object merges shallowly; a function edits an immer draft.

Returns the current state. Use it when a value may be missing.

Returns keys that must exist, and throws if one is `null`, `undefined` or `""`.

Allowed

Lint error

Inside a store class

A value returned from an action. No caller can ever read it.

A bare guard clause that ends the action early.

A return that belongs to a nested callback.

A getter is not an action.

A static method is not an action either.

Client-safe

The generated client from `"../useClient"`, and the store's only way to the server.

Model classes, `router`, `setAuth` and other browser-side helpers.

Erased before bundling, so a type from a server file is fine.

Server-side or route-only

Server modules. One value import drags their whole graph into the browser bundle.

Server-only folders and barrels, plus `option`, `useServer` and any `server` entrypoint.

Loaded by the route before the first byte. The client reloads via `st.do.init<Model><Suffix>()`.

The `persist`, `session`, `search` and `computed` builders, and the state a model store generates.

Declares the endpoints that `fetch.*` calls.

The client component that reads this store's keys.

The control that runs one of this store's actions.

Fill it only when several components share a value, or a screen needs an action that calls the module's endpoint.

Words used on this page

Term

How many service modules have one

Four of the eight service modules in this workspace have a store, and two of those four are still the empty scaffold:

Service module

What its store holds

What a service store does not get

A model store is built from its signal's slices, so list, form and CRUD state arrive without code. A service store is bound to a name instead of a model, so it has only what you declare, plus a reader and a setter for each key.

What exists

Exists

Not there

The skeleton

State The Screen Shares

A key earns a place here when more than one component reads it. A map's viewport is the clearest case: the map draws it, a control panel edits it, a list filters by it, and none of them owns it.

The util library keeps its viewport in its service store:

An Action Returns Nothing

The first action below shows the mistake and its fix. The second is a real action from the same store:

Reading and writing inside an action

Method

Which returns are allowed

Return

Applies

Does not apply

Errors: let the framework show them

The server refused

A client check failed

Calling The Endpoint

The shared library's logout action is the whole shape:

Almost every store action follows the same three steps:

A body much longer than this is usually a decision the service should have made.

What a store may reach

Import or call

Related pages

## Code Examples

### apps/minimal/lib/_minimal/minimal.store.ts

```ts
import { store } from "akanjs/store";

export class MinimalStore extends store("minimal" as const, () => ({
  // state
})) {
  // action
}
```

### libs/util/lib/_util/util.store.ts

```ts
import { store } from "akanjs/store";

import * as cnst from "../cnst";

export class UtilStore extends store("util" as const, () => ({
  notiPermission: "default" as NotificationPermission,
  mapCenter: { type: "Point", coordinates: [127.0016985, 37.5642135] } as cnst.Coordinate,
  mapZoom: 8,
  mapBounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
  mapPanControl: true,
})) {
  fitToScreenByCoordinate(...coordinates: cnst.Coordinate[]) {
    this.set({ mapBounds: cnst.Coordinate.getBounds(...coordinates) });
  }
}
```

### libs/util/lib/_util/util.store.ts

```ts
async refreshNotiPermission() {
  const notiPermission = await Notification.requestPermission();
  this.set({ notiPermission }); // [!code ++]
  return notiPermission; // [!code --]
}

fitToScreenThroughCenterAndZoom(locations: cnst.Coordinate[], explicitZoom?: number) {
  const result = cnst.Coordinate.computeCenterAndZoomFromLocations(locations);
  if (!result) return;
  this.set({ mapCenter: result.center, mapZoom: explicitZoom ?? result.zoom });
}
```

### libs/shared/lib/_shared/shared.store.ts

```ts
import { router, setAuth } from "akanjs/client";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import type { RootStore } from "../st";
import { fetch } from "../useClient";

export class SharedStore extends store("shared" as const, () => ({
  // state
})) {
  async logout() {
    const { jwt } = await fetch.signoutUser();
    setAuth({ jwt });
    (this as unknown as RootStore).set({ me: new cnst.Admin(), self: new cnst.User() });
    void (this as unknown as RootStore).getSelf({ jwt });
    router.refresh();
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

