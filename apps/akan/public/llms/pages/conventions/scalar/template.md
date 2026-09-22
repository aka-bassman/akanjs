# Scalar.Template.tsx

- Source: /conventions/scalar/template
- Mirror: /llms/pages/conventions/scalar/template.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.Template.tsx (#template-overview)
- File Shape (#file-shape)
- Scalar Template Example (#scalar-template)
- Use From Parent Form (#parent-usage)
- Field Or Custom UI (#custom-ui)

## Content

Scalar.Template.tsx

scalar.Template.tsx

A scalar Template is a small reusable form component for editing a scalar value inside a parent domain form.

Use it when several parent modules edit the same value shape. For example, Product, Order, and Invoice can all reuse `Price.Template`.

File Shape

Place the Template beside the scalar. The component is usually a client component because it receives a value and calls `onChange` when an input changes.

Scalar Template Example

The scalar Template receives `value` and `onChange`. It does not load data or submit the parent form. It only edits the scalar value.

Use From Parent Form

The parent module keeps its normal form state. It passes the embedded scalar value to the scalar Template and uses the generated setter to store the changed value.

Field Or Custom UI

Use a Field component for every scalar field — a bare input is never right for one, because Field is what carries the label, the validation surface and the data-akan-action annotation. When the scalar needs an interaction no Field covers, build an app-specific component that takes value and onChange the same way.

For example, `Address.Template` might use normal text fields, while `Coordinate.Template` might use a map picker.

## Code Examples

### Code

```bash
lib/
└── __scalar/
    └── price/
        ├── price.constant.ts
        └── Price.Template.tsx
```

### Price.Template.tsx

```ts
"use client";

import { cnst, usePage } from "@apps/myapp/client";
import { Field } from "@libs/shared/ui";

interface GeneralProps {
  value: cnst.Price;
  onChange: (price: cnst.Price) => void;
}

export const General = ({ value, onChange }: GeneralProps) => {
  const { l } = usePage();
  const patch = (next: Partial<cnst.Price>) => onChange(new cnst.Price().set(value).set(next));

  return (
    <div className="space-y-4">
      <Field.Number label={l("price.amount")} value={value.amount} onChange={(amount) => patch({ amount })} />
      <Field.Text label={l("price.currency")} value={value.currency} onChange={(currency) => patch({ currency })} />
    </div>
  );
};
```

### Product.Template.tsx

```ts
"use client";

import { Price, st, usePage } from "@apps/myapp/client";
import { Field } from "@libs/shared/ui";

export const General = () => {
  const { l } = usePage();
  const productForm = st.use.productForm();

  return (
    <div className="space-y-6">
      <Field.Text label={l("product.name")} value={productForm.name} onChange={st.do.setNameOnProduct} />
      <Price.Template.General value={productForm.price} onChange={st.do.setPriceOnProduct} />
    </div>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

