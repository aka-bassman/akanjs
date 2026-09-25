# Scalar.Template.tsx

- Source: /conventions/scalar/template
- Mirror: /llms/pages/conventions/scalar/template.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- Scalar.Template.tsx (#template-overview)
- File Shape (#file-shape)
- Scalar Template Example (#scalar-template)
- Use From Parent Form (#parent-usage)
- Field Or Custom UI (#custom-ui)

## Content

Scalar.Template.tsx

Scalar

Parent

Shell

Editing the value

One control per scalar field, labelled from the scalar's dictionary.

Builds the changed value and hands it to `onChange`.

Keeping and saving it

Reads the parent's draft, where the price is one field.

Writes the whole changed price back into that draft.

load · open · submit

An edit shell such as `Load.Edit` does this around the parent Template.

scalar

A small value object stored inside another model, such as `Price` with `amount` and `currency`.

parent form

The Template of the model that holds the scalar, such as `Product.Template`.

The store's draft of the record being edited, such as `productForm`.

The setter the store generates for each field, such as `setPriceOnProduct`.

Path

In the scalar's own folder, beside its constant file.

First Line

Always. Its fields handle input events, which only run in the browser.

Exports

Named arrow components, each taking `value` and `onChange`.

Used As

The parent form imports `Price` from `@apps/<app>/client`.

Control

Note

Plain number and text fields, as in the example above.

Text fields, or `Postcode` for a Kakao address search that also returns a coordinate.

A map picker from `@libs/shared/ui` that sets the point where you click.

Anything else

Your own component taking `value` and `onChange`, built on `Input` from `akanjs/ui` if needed.

Scalar Overview

When a value should be a scalar, and which files its folder holds.

The display half: how a parent card shows the same scalar.

The parent form, its generated setters and the edit shells that open it.

Form Controls

Every `Field` member and `Input`, with their props and defaults.

It edits the value and nothing else. Reading the draft, saving it and submitting the form happen elsewhere:

The work

Done here

Not here

Words used on this page

Term

File Shape

Scalar Template Example

Use From Parent Form

The parent Template stays an ordinary store-driven form. It passes the embedded scalar to the scalar Template and stores what comes back with the generated setter:

Field Or Custom UI

Common mistakes

Read next

## Code Examples

### apps/koyo

```bash
lib/
└── __scalar/
    └── price/
        ├── price.abstract.md
        ├── price.constant.ts
        ├── price.dictionary.ts
        ├── price.document.ts
        ├── Price.Template.tsx
        └── Price.Unit.tsx
```

### apps/koyo/lib/__scalar/price/Price.Template.tsx

```ts
"use client";
import { cnst, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  value: cnst.Price;
  onChange: (price: cnst.Price) => void;
}
export const General = ({ className, value, onChange }: GeneralProps) => {
  const { l } = usePage();
  const patch = (next: Partial<cnst.Price>) => onChange(new cnst.Price().set(value).set(next));
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Field.Number label={l("price.amount")} value={value.amount} onChange={(amount) => patch({ amount })} />
      <Field.Text label={l("price.currency")} value={value.currency} onChange={(currency) => patch({ currency })} />
    </div>
  );
};
```

### apps/koyo/lib/product/Product.Template.tsx

```ts
"use client";
import { Price, st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const productForm = st.use.productForm();
  return (
    <Layout.Template className={className}>
      <Field.Text label={l("product.name")} value={productForm.name} onChange={st.do.setNameOnProduct} />
      <Price.Template.General value={productForm.price} onChange={st.do.setPriceOnProduct} />
    </Layout.Template>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

