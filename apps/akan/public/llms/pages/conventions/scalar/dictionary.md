# scalar.dictionary.ts

- Source: /conventions/scalar/dictionary
- Mirror: /llms/pages/conventions/scalar/dictionary.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.dictionary.ts (#dictionary-overview)
- Basic Pattern (#basic-pattern)
- Builder Order (#builder-order)
- Language Order (#language-order)
- Enum Name Matching (#enum-matching)
- Small Custom Text (#custom-text)

## Content

scalar.dictionary.ts

label

The name a person reads, one string per language: `t(["Amount", "금액"])`.

A one-sentence explanation chained after a label.

language tuple

One string per language, in the order `scalarDictionary(["en", "ko"])` lists them.

The dotted path code reads a label by, such as `price.amount`.

What a scalar labels

The name of the scalar or model itself.

One label per field of the constant.

One label per value of an `enumOf()` enum.

Messages every kind has

Error messages thrown with `new Err()`.

Any other short text.

Only for a stored list or an API

Summary numbers of a list, such as its count.

The filters and sort orders of a list.

The data views a client store loads.

Signal endpoints and their arguments.

The scalar itself: its name and its description.

Every field of the constant, and leaving one out is a type error.

Every value of one enum, under the enum's own name.

Error messages thrown with `new Err()`, rarely needed in a scalar.

Any other short text that belongs to the scalar.

First in every tuple: `"Price"` and `"Price value"`.

Second in every tuple: `"가격"` and `"가격 값"`.

Declares the enum and its name in `price.constant.ts`.

Labels every value under the same name in `price.dictionary.ts`.

Reads the label of one value in a component.

`Field.ToggleSelect` labels its buttons from the same keys, with no extra code.

A scalar dictionary gives a scalar its labels in every language: the scalar's name, each field, and each enum value. Open it whenever you add a field or an enum value to the scalar's constant.

Words used on this page

Term

Smaller than a module dictionary

Stage

has this stage

no such stage

Basic Pattern

Builder Order

Language Order

Each position in a tuple belongs to one language:

Language

Enum Name Matching

One name, four places

Where

Small Custom Text

Components read it by the scalar's name, the same way as a field label:

## Code Examples

### apps/myapp/lib/__scalar/price/price.dictionary.ts

```ts
import { scalarDictionary } from "akanjs/dictionary";

import type { Currency, Price } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Price value", "가격 값"]))
  .model<Price>((t) => ({
    amount: t(["Amount", "금액"]).desc(["Price amount", "가격 금액"]),
    currency: t(["Currency", "통화"]).desc(["Currency code", "통화 코드"]),
  }))
  .enum<Currency>("currency", (t) => ({
    KRW: t(["KRW", "원"]).desc(["Korean won", "한국 원"]),
    USD: t(["USD", "달러"]).desc(["US dollar", "미국 달러"]),
  }))
  .translate({
    free: ["Free", "무료"],
  });
```

### apps/myapp/lib/__scalar/price/price.dictionary.ts

```ts
export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Price value", "가격 값"]));
```

### apps/myapp/lib/__scalar/price/price.constant.ts

```ts
import { enumOf, Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Currency extends enumOf("currency", ["KRW", "USD"] as const) {}

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(Currency, { default: "KRW" }),
})) {}
```

### apps/myapp/lib/__scalar/price/price.dictionary.ts

```ts
import { scalarDictionary } from "akanjs/dictionary";

import type { Currency } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .enum<Currency>("currency", (t) => ({
    KRW: t(["KRW", "원"]).desc(["Korean won", "한국 원"]),
    USD: t(["USD", "달러"]).desc(["US dollar", "미국 달러"]),
  }));
```

### apps/myapp/lib/__scalar/price/price.dictionary.ts

```ts
export const dictionary = scalarDictionary(["en", "ko"])
  .translate({
    free: ["Free", "무료"],
  });
```

### apps/myapp/ui/PriceLabel.tsx

```ts
import { usePage } from "@apps/myapp/client";

export const PriceLabel = () => {
  const { l } = usePage();

  return (
    <div>
      <div>{l("price.amount")}</div>
      <div>{l("price.free")}</div>
    </div>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

