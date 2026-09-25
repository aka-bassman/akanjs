# Scalar.Unit.tsx

- Source: /conventions/scalar/unit
- Mirror: /llms/pages/conventions/scalar/unit.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- Scalar.Unit.tsx (#unit-overview)
- File Shape (#file-shape)
- Scalar Unit Example (#scalar-unit)
- Use From Parent Unit (#parent-usage)
- Small Variants (#variants)

## Content

Scalar.Unit.tsx

Scalar Unit

Parent Unit

Elsewhere

Drawing the value

Formats the value the same way on every screen that shows it.

Labels each field from the scalar's own dictionary.

Around the value

Picks the scalar field off the parent model and passes it down.

card · title · link

The surrounding layout, the model's other fields and its `href`.

Never inside a Unit

The page loads the data and passes it down as props.

A Zone or page renders the list and draws one Unit per row.

A model action is a control in a Util, not part of the display.

scalar

A small value object stored inside another model, such as `Price` with `amount` and `currency`.

A server component that draws one thing as a card, row or table cell.

parent Unit

The Unit of the model that holds the scalar, such as `Product.Unit`.

The lighter model a list hands to each Unit. It holds only the fields its constant picks.

Path

In the scalar's own folder, beside its constant file.

First Line

Imports, never "use client". A Unit is a server component.

Exports

Small arrow components named by display purpose, each taking the value as a prop.

Used As

The parent imports `Price` from `@apps/<app>/client`.

For a line in a card, showing the amount and currency in one span.

For a narrow table cell, showing the amount only.

For a detail View, showing each field on its own labelled line.

Scalar Overview

When a value should be a scalar, and which files its folder holds.

The editing half: how a parent form changes the same scalar.

The parent Unit: `ModelProps`, Light models and list rendering.

Where the labels a Detail variant reads are defined.

It draws the value and nothing else. The parent Unit decides the layout around it, and loading happens elsewhere:

The work

Done here

Not here

Words used on this page

Term

File Shape

Scalar Unit Example

A scalar Unit receives a scalar value and renders it. It loads no data, manages no list and triggers no model action:

Use From Parent Unit

A parent Unit imports the scalar Unit and passes it the scalar field of its model. The format is reused, while the parent card still decides the layout around it:

Small Variants

Add a variant only when the same scalar needs a different display size. Each one still renders just the value:

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

### apps/koyo/lib/__scalar/price/Price.Unit.tsx

```ts
import type { cnst } from "@apps/koyo/client";

interface LabelProps {
  className?: string;
  price: cnst.Price;
}
export const Label = ({ className, price }: LabelProps) => {
  return (
    <span className={className}>
      {price.amount.toLocaleString()} {price.currency}
    </span>
  );
};
```

### apps/koyo/lib/product/Product.Unit.tsx

```ts
import { type cnst, Price } from "@apps/koyo/client";
import { cn, type ModelProps } from "akanjs/client";
import { Layout } from "akanjs/ui";

export const Card = ({ className, product, href }: ModelProps<"product", cnst.LightProduct>) => {
  return (
    <Layout.Unit className={cn("rounded-xl border", className)} href={href}>
      <div className="font-bold">{product.name}</div>
      <Price.Unit.Label price={product.price} className="text-foreground/70" />
    </Layout.Unit>
  );
};
```

### apps/koyo/lib/__scalar/price/Price.Unit.tsx

```ts
import { type cnst, usePage } from "@apps/koyo/client";

interface CompactProps {
  className?: string;
  price: cnst.Price;
}
export const Compact = ({ className, price }: CompactProps) => {
  return <span className={className}>{price.amount.toLocaleString()}</span>;
};

interface DetailProps {
  className?: string;
  price: cnst.Price;
}
export const Detail = ({ className, price }: DetailProps) => {
  const { l } = usePage();
  return (
    <div className={className}>
      <div>
        {l("price.amount")}: {price.amount.toLocaleString()}
      </div>
      <div>
        {l("price.currency")}: {price.currency}
      </div>
    </div>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

