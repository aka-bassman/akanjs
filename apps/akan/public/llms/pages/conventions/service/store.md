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

Four of the eight service modules in this workspace have a store, and two of those four are empty. That ratio is the first thing to know about this file: it is the only one in the folder you are expected not to need.

A model store is generated: declare a slice and you get list state, form state, pagination and the CRUD actions without writing any of them. A service store is bound to a name rather than a model, so none of that arrives. What you declare is what exists.

Two comments, and they stay. They are the empty scaffold marking where each half goes — state inside the factory, actions in the class body — and deleting them costs the next reader the one thing the file was telling them.

State The Screen Shares

The state that earns a place here is the state more than one component reads. A map's viewport is the clearest case: the map draws it, a control panel edits it, a list filters by it, and none of them owns it.

Every key in the factory becomes a subscription: st.use.mapZoom() in a client component re-renders it when the value changes, and nothing else does. The derived work is a static on the scalar — Coordinate.getBounds lives on the constant, where the server can call it too, and the store only decides when to run it.

An Action Returns Nothing

Every method on a store class is dispatched through st.do.<action>(), and that dispatch is typed void. A value you return is not narrowed, not wrapped, and not delivered — it is unreachable. Write it into state with this.set({ ... }) instead; a lint rule refuses the return, and a bare return; guard clause stays fine.

the only way a value leaves an action. Partial — name the keys that changed

reads current state when the value may be missing. this.pick(key) when it must exist

a bare guard clause, a return inside a nested callback, a getter and a static helper are all still legal

An action does not try/catch either. A fetch that throws an Err is already a toast the framework raises with the dictionary's own wording, and a catch that swallows it replaces a translated message with silence. Client-side validation failure is msg.error("<key>") plus an early return, never a throw.

Calling The Endpoint

A store is the one client file that calls fetch.*. A component never does: it reads with st.use.* and writes with st.do.*, and the round trip in between belongs here so that two components clicking the same button cannot disagree about what happens.

Three lines and a navigation: call the endpoint, write the result into state, tell the router. That is the whole shape of a store action, and a body much longer than this one is usually a decision the service should have made.

One more boundary: a store is a client file, so it may not import a service, a signal, a document, a dictionary, or anything under srvkit/. It reaches the server only through the generated fetch, and it may not call fetch.init* at all — that one is a hydration snapshot the route resolves before the first byte.

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

### A service store action

```ts
async refreshNotiPermission() {
  const notiPermission = await requestNotiPermission();
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
import { fetch } from "../useClient";

export class SharedStore extends store("shared" as const, () => ({
  // state
})) {
  async logout() {
    const { jwt } = await fetch.signoutUser();
    setAuth({ jwt });
    this.set({ me: new cnst.Admin(), self: new cnst.User() });
    router.refresh();
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

