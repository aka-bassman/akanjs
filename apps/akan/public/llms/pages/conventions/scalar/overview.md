# Overview

- Source: /conventions/scalar/overview
- Mirror: /llms/pages/conventions/scalar/overview.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- Scalar Overview (#scalar-overview)
- When To Use A Scalar (#when-to-use)
- Scalar Files (#file-map)
- Small Example (#small-example)

## Content

Overview

value object

A value defined only by its fields, like a price or an address, with no `id` of its own.

embed

Putting a scalar inside another model as a field, so it is saved with that model.

parent model

The model that holds the scalar, such as `Product` holding a `Price`.

database module

A model with its own table, service, endpoints and screens, under `lib/<model>/`.

Scalar

Database module

A scalar fits

lives inside another record

Saved and loaded with its parent, with no `id` or `createdAt` of its own.

the same fields repeat

One group of fields appears in several models, like a price in products and orders.

an endpoint's input or result

A shape with no table behind it, like the `DocPage` list this docs app returns.

It needs a database module

its own list page

People browse, search or page through the records.

its own permissions

Guards decide who may read or change each record.

its own service methods

Business operations such as `approve()` or `cancel()` run on it.

an independent lifecycle

It is created and removed on its own, not together with a parent.

What the value means, its validation intent and reuse rules, plus notes for agents.

One class with the fields, any enums, and helper methods both server and client can call.

A label and a description for every field and enum value, written with `scalarDictionary`.

The server-side class, usually just `by(cnst.Price)`, while helpers live on the constant.

A client editor for the value inside a parent form, starting with "use client".

A server component that shows the value inside a parent card or detail page.

Scalar Overview

A scalar is a small, named group of fields that lives inside other models. Define it once, then embed it wherever the same fields repeat.

Words used on this page

Term

When To Use A Scalar

Ask whether the value only exists inside another record. If it does, it is a scalar; if it needs its own list, permissions or lifecycle, it is a database module.

When the value…

Use this one

Not this one

Good Scalars

Good Database Modules

Each has its own list, permissions and lifecycle, so each gets its own module.

Scalar Files

The four core files

File

Optional UI files

Small Example

A scalar should make sense on its own. It defines only the value's shape; the parent module decides how to save, load and render it.

The dictionary labels each field, and the document wraps the constant for the server:

Common mistakes

## Code Examples

### apps/<app>/lib/product/product.constant.ts

```ts
import { via } from "akanjs/constant";
import { Price } from "../__scalar/price/price.constant";

export class ProductInput extends via((field) => ({
  name: field(String),
  price: field(Price),
})) {}
```

### apps/<app>/lib/

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

### apps/<app>/lib/__scalar/price/price.constant.ts

```ts
import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
})) {}
```

### apps/<app>/lib/__scalar/price/price.dictionary.ts · price.document.ts

```ts
// price.dictionary.ts
import { scalarDictionary } from "akanjs/dictionary";

import type { Price } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Amount and currency", "금액과 통화"]))
  .model<Price>((t) => ({
    amount: t(["Amount", "금액"]).desc(["Amount of money", "금액"]),
    currency: t(["Currency", "통화"]).desc(["Currency code", "통화 코드"]),
  }));

// price.document.ts
import { by } from "akanjs/document";

import * as cnst from "./price.constant";

export class Price extends by(cnst.Price) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

