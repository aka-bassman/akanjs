# UI Composition

- Source: /docs/arch/ui-composition
- Mirror: /llms/pages/docs/arch/ui-composition.md
- Section: docs
- Category: Architecture
- Priority: P0

## Headings

- UI Composition (#ui-composition)
- The Shape Of A Model Screen (#screen-flow)
- The Load Shells (#load-shells)
- The CRUD Modals (#model-shells)
- Forms Are Store-Driven (#forms-and-fields)
- One Vocabulary, Many Screens (#i18n)

## Content

UI Composition

The three data shells. Each takes the matching fetch handle, seeds the client store from it, and renders loading, empty and list states for you.

Awaits one promise behind its own Suspense boundary. A resolved value renders in the shell with no boundary at all, so the same call site works either way.

The three CRUD workflows as modals, wired to the generated store actions. Model.EditModal, Model.ViewModal and Model.AdminPanel cover the composed variants.

Every model field control: Text, TextArea, Number, Date, DateRange, Switch, ToggleSelect, Tags, Email, Phone, Password, Parent, Children and more. Never a bare input for a model field.

The composition primitives. Tab splits into four small shells so panel bodies stay on the server, Link handles locale-prefixed internal navigation, and Empty is the bare placeholder.

From akanjs/client, not akanjs/ui. Token-aware tailwind-merge, and the only class-combining function — no clsx, no raw twMerge, no object syntax. Merge the caller's className last.

One function per signal endpoint, plus the generated init, view and edit handles per slice. Routes and server components call it; client components do not.

Read with st.use.*, write with st.do.*. State and the CRUD actions are generated, so most stores need no hand-written action at all.

The namespace a module exports: Unit, View, Zone, Template and Util. The model comes from the namespace, so a component is named for its role — IcecreamOrder.Unit.Card, never IcecreamOrderCard.

l, l.trans and the page context. It reads request-scoped server context, so it is legal in a server component and never forces a client boundary.

init from fetch.init<Model><Suffix>. renderItem draws one row, renderList takes the whole DataList when the layout is a carousel or a table, renderEmpty replaces the empty state, and pagination, filter, sort and staleTime tune the rest.

view from fetch.view<Model>. renderView is required and receives the full model; empty is the placeholder for a view whose model came back empty.

edit from fetch.edit<Model>, or a plain partial for a new record. slice is required; type picks modal, form or empty; draft controls form recovery.

of is any promise or resolved value, children is a function of the value, and fallback shows only while a thenable is pending. This is the one that takes the x<Model>List<Suffix> promise a slice hands out.

The paging control on its own, and the shared SSR/CSR page loader wrapper.

Your order list needs a skeleton while it loads, a placeholder when it is empty, a page control at the bottom, a modal for a new order, a second modal for editing one, and a confirmation before anything is deleted. That is six states around one array, and none of them is your product.

akanjs/ui ships all six, wired to the generated store. You write the row and the detail view; the shells around them handle loading, empty, paging, refresh and the CRUD modals. This page is the inventory and the composition rules — the client boundary itself is the previous page's subject.

Export

What you write splits the same way. Anything bound to one model lives in that model's folder under lib/, so the module owns its own row, detail view, form and actions; anything reusable across models and not bound to one goes in the app's ui/. A component that needs both is two components.

The Shape Of A Model Screen

A model almost always produces the same four screens. Users scan a list, create a record, open one, and come back to edit it. Each arrow below is a shell that already exists, so the four screens are four small files rather than four workflows.

Index, new, view, edit

Index pages are for discovery: search, scan, page, choose. New and edit pages are controlled input through one Template and a submit action. View pages present one record clearly and then offer the follow-up actions. Underneath all four, the same stack runs in the same order:

From the route to the database

The route reaches fetch directly and a client component reaches it only through a store action, which is the one rule that keeps the two paths from drifting. Four generated helpers are the whole daily surface:

Helper

The Load Shells

Never hand-roll a loading, empty or list state. A Load shell takes the handle the route fetched, seeds the client store from it so the generated pagination, query, sort and refresh actions keep working after hydration, and renders the three states around your row component.

Shell

The route destructures the handle instead of awaiting it, hands the init field to a Zone and any leftover list promise to a Load.Stream. Both render behind their own boundary as their own data lands, so the page never waits for the slowest query:

The CRUD Modals

Creating, editing and removing a record are three workflows every model needs and no model should implement. Each shell takes the slice it operates on, opens the module's own Template, and calls the generated store action on submit.

A Util export is named for the endpoint verb minus the model noun, so this file exports New and Remove rather than NewIcecreamOrder. Three things about these shells are worth knowing before you reach for one:

Replaces the default button that opens the modal. On Model.New and Model.Edit children is the form body handed to the modal, not the label, and neither takes a className; Model.SureToRemove takes no children at all, so its trigger is the whole control.

Form recovery, on by default. The shell saves the whole form as the user types and offers it back on the next open, scoped to the record id for an edit and to the seed plus the route for a new form, per signed-in user. Secret and hidden values are never saved.

Model.SureToRemove shows this in the confirmation, and with typeNameToRemove it also makes the user type it back before the delete button enables.

Never persist form values yourself. The old per-field cache and cacheKey props are deprecated and store nothing: they covered five control types, keyed on the translated label, and restored over server data. draft={false} turns recovery off and draft="<scope>" names the scope when the context is in neither the id nor the seed.

Forms Are Store-Driven

A Template holds no state of its own. Every control reads one key of <model>Form and writes it through the generated setter, which is why a Template contains zero useState and why a draft can be restored into it at all.

Nested rows are written with st.do.writeOnIcecreamOrder("toppings.3.name", value) plus the generated add<Field>OnX and sub<Field>OnX actions. An image or file field is a relation to the File model, and the store generates upload<Field>On<Model>(fileList) for it — never hand-roll a data-URL fallback.

A store action returns nothing. Every method of a store class dispatches through st.do.<action>() and is typed void, so a returned value is unreachable — write it into state with this.set({ ... }) instead. And do not catch inside one: let the framework toast the Err. Its whole job is to read state, call fetch, and update loading, list and form state; the password, permission, stock and payment rules stay in the service, never duplicated here.

One Vocabulary, Many Screens

Every string a user reads goes through the module's dictionary. Field labels, enum values, error messages and the model's own name are declared once as [en, ko] pairs, and the components read them by key — so the vocabulary lives next to the model rather than scattered through the components that happen to display it.

A component then renders l("icecreamOrder.size") for a field label, l("icecreamOrder.modelName") for the model, and l.trans({ en, ko }) for a one-off sentence that belongs to no model. usePage() resolves all three on both sides, so a fully localized screen never needs a client boundary for its text.

## Code Examples

### apps/koyo/page/(public)/icecreamOrder/_index.tsx

```ts
import { fetch, IcecreamOrder } from "@apps/koyo/client";
import { page } from "akanjs/client";
import { Load, Loading } from "akanjs/ui";

export default page().render(() => {
  const { icecreamOrderInitInPublic, icecreamOrderListInPublic } = fetch.initIcecreamOrderInPublic();
  return (
    <>
      <Load.Stream of={icecreamOrderListInPublic} fallback={<Loading.Skeleton active />}>
        {(icecreamOrderList) => <IcecreamOrder.Unit.Total count={icecreamOrderList.length} />}
      </Load.Stream>
      <IcecreamOrder.Zone.Card init={icecreamOrderInitInPublic} />
    </>
  );
});
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Util.tsx

```ts
"use client";
import { fetch, usePage } from "@apps/koyo/client";
import { Model } from "akanjs/ui";
import { BiPlus, BiTrash } from "react-icons/bi";

export const New = () => {
  const { l } = usePage();
  return (
    <Model.New slice={fetch.slice.icecreamOrder}>
      <BiPlus /> {l("base.create")}
    </Model.New>
  );
};

interface RemoveProps {
  icecreamOrderId: string;
}
export const Remove = ({ icecreamOrderId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.SureToRemove
      modelId={icecreamOrderId}
      name={l("icecreamOrder.modelName")}
      slice={fetch.slice.icecreamOrder}
      redirect="/icecreamOrder"
      trigger={
        <button type="button">
          <BiTrash /> {l("base.remove")}
        </button>
      }
    />
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Template.tsx

```ts
"use client";
import { cnst, st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const icecreamOrderForm = st.use.icecreamOrderForm();
  const { l } = usePage();
  return (
    <Layout.Template className={className}>
      <Field.Number
        label={l("icecreamOrder.size")}
        desc={l("icecreamOrder.size.desc")}
        value={icecreamOrderForm.size}
        onChange={st.do.setSizeOnIcecreamOrder}
      />
      <Field.MultiToggleSelect
        label={l("icecreamOrder.toppings")}
        desc={l("icecreamOrder.toppings.desc")}
        value={icecreamOrderForm.toppings}
        items={cnst.Topping}
        onChange={st.do.setToppingsOnIcecreamOrder}
      />
    </Layout.Template>
  );
};
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.dictionary.ts

```ts
import { modelDictionary } from "akanjs/dictionary"; // [!code collapse:4]

import type { IcecreamOrder, IcecreamOrderInsight, IcecreamOrderStatus } from "./icecreamOrder.constant";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Icecream Order", "아이스크림 주문"]).desc(["One customer order", "고객 주문 한 건"]))
  .model<IcecreamOrder>((t) => ({
    size: t(["Size", "사이즈"]).desc(["Cup size in millilitres", "컵 용량, 밀리리터"]),
    toppings: t(["Toppings", "토핑"]).desc(["Toppings on the order", "주문에 올린 토핑"]),
    status: t(["Status", "상태"]).desc(["Current order status", "현재 주문 상태"]),
  }))
  .insight<IcecreamOrderInsight>((t) => ({}))
  .enum<IcecreamOrderStatus>("icecreamOrderStatus", (t) => ({
    active: t(["Active", "접수됨"]).desc(["Created and waiting", "생성되어 대기 중"]),
    served: t(["Served", "제공됨"]).desc(["Handed to the customer", "고객에게 전달됨"]),
  }))
  .error({
    alreadyServed: ["This order has already been served", "이미 제공된 주문입니다."],
  });
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

