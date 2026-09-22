# Scalar.Unit.tsx

- Source: /conventions/scalar/unit
- Mirror: /llms/pages/conventions/scalar/unit.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.Unit.tsx (#unit-overview)
- File Shape (#file-shape)
- Scalar Unit Example (#scalar-unit)
- Use From Parent Unit (#parent-usage)
- Small Variants (#variants)

## Content

Scalar.Unit.tsx

scalar.Unit.tsx

A scalar Unit is a small reusable display component for a scalar value. It is used inside a parent domain card, row, detail page, or table cell.

Use it when the same scalar should look the same across several parent modules. For example, Product, Order, and Invoice can all reuse `Price.Unit.Label`.

File Shape

Place the Unit beside the scalar. Export small variants by display purpose, such as `Label`, `Summary`, or `Badge`.

Scalar Unit Example

The scalar Unit receives a scalar value and renders it. It should not load data, manage a list, or trigger model actions.

Use From Parent Unit

A parent module Unit can import the scalar Unit and pass the embedded scalar value from its model. This keeps display formatting reusable while the parent card still decides the surrounding layout.

Small Variants

Add variants only when the same scalar needs different display sizes. Keep each variant focused on rendering the scalar value.

## Code Examples

### Code

```bash
lib/
└── __scalar/
    └── price/
        ├── price.constant.ts
        └── Price.Unit.tsx
```

### Price.Unit.tsx

```ts
import { cnst } from "@apps/myapp/client";

interface LabelProps {
  price: cnst.Price;
  className?: string;
}

export const Label = ({ price, className }: LabelProps) => (
  <span className={className}>
    {price.amount.toLocaleString()} {price.currency}
  </span>
);
```

### Product.Unit.tsx

```ts
import { cnst, Price } from "@apps/myapp/client";
import { Layout } from "akanjs/ui";

interface CardProps {
  product: cnst.Product;
}
export const Card = ({ product }: CardProps) => (
  <Layout.Unit className="rounded-xl border border-border p-4">
    <div className="font-bold">{product.name}</div>
    <Price.Unit.Label price={product.price} className="text-foreground/70" />
  </Layout.Unit>
);
```

### Price.Unit.tsx

```ts
import { cnst, usePage } from "@apps/myapp/client";

interface CompactProps {
  price: cnst.Price;
}
export const Compact = ({ price }: CompactProps) => <span>{price.amount.toLocaleString()}</span>;

interface DetailProps {
  price: cnst.Price;
}
export const Detail = ({ price }: DetailProps) => {
  const { l } = usePage();
  return (
    <div>
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

