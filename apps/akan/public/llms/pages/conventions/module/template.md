# Model.Template.tsx

- Source: /conventions/module/template
- Mirror: /llms/pages/conventions/module/template.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.Template.tsx (#template-overview)
- File Convention (#file-convention)
- Standard Form Template (#standard-form-template)
- Field Patterns (#field-patterns)
- Split Components (#split-components)
- Opening A Template (#template-usage)
- Rules At A Glance (#practical-rules)

## Content

Model.Template.tsx

The store's draft of the record being edited, such as `ticketForm`.

The setter the store generates for each field, such as `setTitleOnTicket`.

Tells a Field or a shell which model and which list it works with.

edit shell

A wrapper such as `Load.Edit` or `Model.Edit` that loads, opens and submits the form.

Elsewhere

Drawing the form

Labelled controls, each bound to one field of the form draft.

submit button · step · preview

Small interaction pieces that belong to one form.

Labels and help text from the module dictionary.

Deciding and saving

business rule

Validation and state transitions go in constant, document and service.

access check

Who may save is decided by the guards in the signal.

A server call and its toasts go in a store action.

open · load · submit

An edit shell does this around the Template.

Path

Database and scalar modules may have one. Service modules may not.

First Line

Always, on line 1 above the imports.

Exports

Named arrow components. General is the model's main form.

Used As

Pages and shells reach it through the model namespace from @apps/<app>/client.

Model field

Note

`TextArea`, `Email`, `Phone` and `Password` are variants for special text.

`DoubleNumber` holds two numbers in one row, such as a range.

A labelled on/off toggle.

`showTime` adds the time of day, and `DateRange` takes a from/to pair.

Each value gets a translated label, and `MultiToggleSelect` takes an array.

`TextList` keeps the order and lets the user drag rows.

relation to a model

`Children` takes an array, and `ParentId` / `ChildrenId` take `ID` fields.

`Imgs` takes `[File]` and `File` / `Files` take other files, all from `@libs/shared/ui`.

rich text

A rich-text editor with attachments, from `@libs/shared/ui`.

embedded objects

You render one row; the field draws the add and remove buttons.

Shell

Use it when

What it draws

A page already holds the record to edit, or a partial new form.

The form in the page, in a modal, or as bare fields, chosen by `type`.

A list row, a dropdown or a Unit needs an edit button.

An Edit button, or your `trigger`, plus the edit modal.

A screen needs a button that creates a record.

A New button, or your `trigger`, plus the form modal.

Any element, such as an empty-list call to action, should open a new form.

Only the trigger, so pair it with a `Model.EditModal`.

State key

Given an edit object

Given a partial form

Left as it was.

The full model, built from the edit object.

An editable copy of the model.

The default values merged with `edit`.

The `modal` prop, or `"edit"`.

When the server read the record, used to re-read a stale one.

Form Controls

Every Field member with its props and defaults.

Where the form draft and the generated setters come from.

The page section that hosts buttons which open a Template.

In-Page Agent

Why a setter passed by reference becomes a tool the agent can call.

model.Template.tsx

A Template only connects the screen to the store. Anything that needs a decision lives somewhere else:

The work

Belongs here

Not here

Words used on this page

Term

File Convention

Standard Form Template

A standard form reads the draft from the store, takes its labels from the dictionary, and writes each field through a generated setter:

Field Patterns

Split Components

Opening A Template

A Template only draws fields. An edit shell around it fills the form state, opens the form and submits it. Pick the shell by where the form opens:

Load.Edit in a page

Before the Template renders, Load.Edit writes these keys into the store:

Model.Edit for an edit modal

Model.NewWrapper to open a new form

Rules At A Glance

Everything above, as a checklist to run before you finish a Template:

Read next

## Code Examples

### apps/koyo/lib/ticket/Ticket.Template.tsx

```ts
"use client";
import { st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const ticketForm = st.use.ticketForm();
  return (
    <Layout.Template className={className}>
      <Field.Text
        label={l("ticket.title")}
        desc={l("ticket.title.desc")}
        value={ticketForm.title}
        onChange={st.do.setTitleOnTicket}
      />
    </Layout.Template>
  );
};
```

### apps/koyo/lib/ticket/Ticket.Template.tsx

```ts
"use client";
import { cnst, fetch, st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const ticketForm = st.use.ticketForm();
  return (
    <Layout.Template className={className}>
      <Field.Text
        label={l("ticket.title")}
        value={ticketForm.title}
        onChange={st.do.setTitleOnTicket}
      />
      <Field.Parent // [!code ++:7]
        label={l("ticket.project")}
        slice={fetch.slice.projectInSelf}
        value={ticketForm.project}
        onChange={st.do.setProjectOnTicket}
        renderOption={(project) => project.name}
      />
      <Field.ToggleSelect // [!code ++:6]
        label={l("ticket.type")}
        items={cnst.TicketType}
        value={ticketForm.type}
        onChange={st.do.setTypeOnTicket}
      />
      <Field.Img // [!code ++:7]
        label={l("ticket.image")}
        slice={fetch.slice.ticket}
        value={ticketForm.image}
        onChange={st.do.setImageOnTicket}
        nullable
      />
      <Field.Rich // [!code ++:8]
        label={l("ticket.content")}
        slice={fetch.slice.ticket}
        valuePath="content"
        value={ticketForm.content}
        onChange={st.do.setContentOnTicket}
        addFile={st.do.addContentFilesOnTicket}
      />
    </Layout.Template>
  );
};
```

### libs/shared/lib/user/User.Template.tsx

```ts
"use client";
import { st, usePage } from "@libs/shared/client";
import { isPhoneNumber } from "akanjs/common";
import { buttonRecipe, Input } from "akanjs/ui";

interface PhoneProps {
  userId?: string;
  redirect?: string;
}
export const Phone = ({ userId, redirect }: PhoneProps) => {
  const phone = st.use.phone();
  return (
    <Input
      type="tel"
      value={phone}
      onChange={st.do.setPhone}
      onPressEnter={() => {
        if (!userId || !isPhoneNumber(phone)) return;
        void st.do.setPhoneInPrepareUser(userId, phone, { redirect });
      }}
    />
  );
};

interface SubmitPhoneProps {
  userId: string;
  redirect: string;
}
export const SubmitPhone = ({ userId, redirect }: SubmitPhoneProps) => {
  const { l } = usePage();
  const phone = st.use.phone();
  return (
    <button
      className={buttonRecipe({ variant: "primary" })}
      disabled={!isPhoneNumber(phone)}
      onClick={() => {
        void st.do.setPhoneInPrepareUser(userId, phone, { redirect });
      }}
    >
      {l("user.sendPhoneCode")}
    </button>
  );
};
```

### apps/koyo/page/ticket/new.tsx

```ts
import { cnst, fetch, Ticket } from "@apps/koyo/client";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page().render(() => {
  const ticketForm: Partial<cnst.Ticket> = {};
  return (
    <Load.Edit
      slice={fetch.slice.ticket}
      edit={ticketForm}
      type="form"
      onCancel="back"
      onSubmit="/ticket/[ticketId]"
    >
      <Ticket.Template.General />
    </Load.Edit>
  );
});
```

### apps/koyo/page/ticket/[ticketId]/edit.tsx

```ts
import { fetch, Ticket } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page()
  .param("ticketId", ID)
  .render(async ({ ticketId }) => {
    const [{ ticketEdit }] = await Promise.all([fetch.editTicket(ticketId)]);
    return (
      <Load.Edit
        slice={fetch.slice.ticket}
        edit={ticketEdit}
        type="form"
        onSubmit="back"
      >
        <Ticket.Template.General />
      </Load.Edit>
    );
  });
```

### apps/koyo/lib/ticket/Ticket.Util.tsx

```ts
"use client";
import { fetch, Ticket } from "@apps/koyo/client";
import { Model } from "akanjs/ui";

interface EditProps {
  ticketId: string;
}
export const Edit = ({ ticketId }: EditProps) => {
  return (
    <Model.Edit
      renderTitle="title"
      slice={fetch.slice.ticket}
      modelId={ticketId}
    >
      <Ticket.Template.General />
    </Model.Edit>
  );
};
```

### apps/koyo/lib/ticket/Ticket.Zone.tsx

```ts
<>
  <Model.NewWrapper
    partial={{ project }}
    slice={fetch.slice.ticketInProject}
  >
    <button className={buttonRecipe({ variant: "secondary" })}>
      {l("ticket.newTicket")}
    </button>
  </Model.NewWrapper>
  <Model.EditModal
    renderTitle="title"
    slice={fetch.slice.ticketInProject}
  >
    <Ticket.Template.General />
  </Model.EditModal>
</>
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

