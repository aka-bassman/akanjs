# Model.Zone.tsx

- Source: /conventions/module/zone
- Mirror: /llms/pages/conventions/module/zone.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.Zone.tsx (#zone-overview)
- File Convention And Props (#file-convention)
- List Zone With Load.Units (#load-units-zone)
- View Zone With Load.View (#load-view-zone)
- Section Orchestration Zones (#orchestration-zones)
- Live And Dashboard Zones (#live-dashboard-zones)
- When To Use Zone (#when-to-use)
- Practical Rules (#practical-rules)

## Content

Model.Zone.tsx

required

The `<model>Init<Suffix>` field of `fetch.init<Model><Suffix>()`: a `ClientInit`, awaited or not.

The `<model>View` field of `fetch.view<Model>(id)`: one record as a `ClientView`, awaited or not.

Copy a server payload into the client store, so the screen and the store hold the same data.

Tells a wrapper or control which model and which list it works with.

A spot that shows a fallback until its promise lands, without holding up the rest of the page.

Path

Database and service modules may have one. Scalar modules may not.

First Line

Always, on line 1 above the imports.

List Props

View Props

The list payload or its promise, handed down from the page.

Draws one row; required unless you pass `renderList`.

Draws the whole list, for grouping, tabs, boards or a custom order.

Draws the no-rows state; `false` with `renderList` draws the empty list instead.

A ready-made no-rows placeholder that wins over `renderEmpty`.

Shown while a promised `init` is pending and while the list reloads.

Adds a pager on desktop and infinite scroll on mobile.

Classes for the wrapping div, such as a grid layout.

The detail payload or its promise, handed down from the page.

Draws the full model, usually as `<Model>.View.General`.

Shown while a promised `view` is pending.

Shown when the record came back empty.

Classes for the wrapping div.

Renders `renderView` without the wrapping div.

Server

Client

Fetches or draws

The route shell that reads params, starts `fetch.*` and passes the results down.

Draws one row or card from a light model.

Draws the full detail of one record.

Holds state or an action

Composes a page section: Load wrappers, store reads and modals.

Form fields and form fragments, each bound to the store.

Small actions, toolboxes and helpers, such as a filter or a remove button.

State and actions, shipped only in the client bundle.

Mistake, then the fix

Do this

Fetch in the route and pass the result down as `init` or `view`.

Lint rejects it in a client file; reload with `st.do.initXInY()` instead.

Pass the field, not the whole handle: `init={xInitInY}`.

`xListInY` holds model instances a client prop refuses, so pass `xInitInY`.

Lint rejects a model prop, so read it with `st.use.self()` or take an id.

Switch modes with `Tab` in the page or a View, so each panel stays server-rendered.

Use the `loading` and `empty` props of `Load.Units` and `Load.View`.

model.Zone.tsx

A Zone is the client part of a page section. The page fetches the data; the Zone puts it into the store and hands each record to a Unit or View that draws it.

Open this file when a page gets a new list or detail section, or when a section needs a modal or live updates. One section comes together in four steps:

Words used on this page

Term

File Convention And Props

List Zone With Load.Units

The page starts the query and passes the promise down without awaiting it:

Load.Units props

View Zone With Load.View

A pending view promise gets its own boundary, so a slow detail never holds up the layout around it:

Load.View props

Section Orchestration Zones

Some Zones assemble a whole section: a filter, the list, a create button and a modal. The Zone only wires them together; each piece still lives in its own file.

A board with renderList

Cards that open a modal

Live And Dashboard Zones

A Zone can also be a dashboard or a live section, when the whole section follows store state, a subscription or a client-only layout.

A live section subscribes in an effect and unsubscribes in the effect's cleanup:

When To Use Zone

Every piece of a screen has one home. Reach for a Zone when a section needs the store; anything that only draws stays on the server.

File

Runs here

Not here

Practical Rules

Five rules keep a Zone small:

Common mistakes

## Code Examples

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx

```ts
"use client";
import { type cnst, IcecreamOrder } from "@apps/koyo/client";
import type { ClientInit, ClientView } from "akanjs/fetch";
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
        <IcecreamOrder.Unit.Card
          key={icecreamOrder.id}
          icecreamOrder={icecreamOrder}
        />
      )}
    />
  );
};

interface ViewProps {
  className?: string;
  view: ClientView<"icecreamOrder", cnst.IcecreamOrder>;
}
export const View = ({ className, view }: ViewProps) => {
  return (
    <Load.View
      className={className}
      view={view}
      renderView={(icecreamOrder) => (
        <IcecreamOrder.View.General icecreamOrder={icecreamOrder} />
      )}
    />
  );
};
```

### apps/koyo/page/devApp/[devAppId]/dbBackup.tsx

```ts
import { DbBackup, fetch } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("devAppId", ID)
  .render(({ devAppId }) => {
    const { dbBackupInitInDevApp } = fetch.initDbBackupInDevApp(devAppId);
    return (
      <DbBackup.Zone.Card init={dbBackupInitInDevApp} devAppId={devAppId} />
    );
  });
```

### apps/koyo/lib/dbBackup/DbBackup.Zone.tsx

```ts
"use client"; // [!code collapse:4]
import { type cnst, DbBackup, fetch, usePage } from "@apps/koyo/client";
import type { ClientInit } from "akanjs/fetch";
import { buttonRecipe, Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"dbBackup", cnst.LightDbBackup>;
  devAppId: string;
}
export const Card = ({ className, init, devAppId }: CardProps) => {
  const { l } = usePage();
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderEmpty={() => (
          <Model.NewWrapper
            partial={{ devAppId }}
            slice={fetch.slice.dbBackupInDevApp}
          >
            <button className={buttonRecipe({ variant: "secondary" })}>
              {l("base.new")}
            </button>
          </Model.NewWrapper>
        )}
        renderItem={(dbBackup) => (
          <DbBackup.Unit.Card key={dbBackup.id} dbBackup={dbBackup} />
        )}
      />
      <Model.EditModal slice={fetch.slice.dbBackupInDevApp}>
        <DbBackup.Template.General />
      </Model.EditModal>
    </>
  );
};
```

### apps/koyo/lib/ticket/Ticket.Zone.tsx

```ts
"use client"; // [!code collapse:4]
import { type cnst, st, Ticket } from "@apps/koyo/client";
import type { ClientView } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface ViewProps {
  className?: string;
  view: ClientView<"ticket", cnst.Ticket>;
}
export const View = ({ className, view }: ViewProps) => {
  const self = st.use.self();
  return (
    <Load.View
      className={className}
      view={view}
      renderView={(ticket) => (
        <Ticket.View.General ticket={ticket} self={self} />
      )}
    />
  );
};
```

### apps/koyo/lib/ticket/Ticket.Zone.tsx

```ts
export const Kanban = ({
  className,
  init,
  projectId,
  slice = fetch.slice.ticketInProject,
}: KanbanProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderEmpty={false}
      renderList={(ticketList) => (
        <>
          <Ticket.Util.QueryMakerInSelf slice={slice} />
          <div className="grid grid-cols-3 gap-4">
            {cnst.TicketStatus.values.map((status) => (
              <div key={status} className="flex flex-col gap-2">
                {ticketList
                  .filter((ticket) => ticket.status === status)
                  .map((ticket) => (
                    <Ticket.Unit.Card key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            ))}
          </div>
          <Model.New slice={slice} partial={{ project: projectId }}>
            <Ticket.Template.General />
          </Model.New>
        </>
      )}
    />
  );
};
```

### apps/koyo/lib/dessert/Dessert.Zone.tsx

```ts
export const Card = ({ className, init }: CardProps) => {
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderItem={(dessert) => (
          <Model.ViewWrapper
            key={dessert.id}
            modelId={dessert.id}
            slice={fetch.slice.dessert}
          >
            <Dessert.Unit.Card dessert={dessert} />
          </Model.ViewWrapper>
        )}
      />
      <Model.ViewEditModal
        slice={fetch.slice.dessert}
        renderView={(dessert) => <Dessert.View.General dessert={dessert} />}
        renderTemplate={() => <Dessert.Template.General />}
      />
    </>
  );
};
```

### apps/koyo/lib/summary/Summary.Zone.tsx

```ts
export const Dashboard = ({ view }: DashboardProps) => {
  return (
    <Load.View
      view={view}
      renderView={(summary) => <Summary.View.General summary={summary} />}
    />
  );
};
```

### apps/koyo/lib/chatRoom/ChatRoom.Zone.tsx

```ts
export const Room = ({ className, roomId, init }: RoomProps) => {
  useEffect(() => {
    st.do.readChat(roomId);
    const unsubscribe = fetch.subscribeChatAdded(roomId, (chat) => {
      st.do.chatAdded(roomId, chat);
    });
    return () => unsubscribe();
  }, [roomId]);
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(chat) => <Chat.Unit.Card key={chat.id} chat={chat} />}
    />
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

