# scalar.constant.ts

- Source: /conventions/scalar/constant
- Mirror: /llms/pages/conventions/scalar/constant.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.constant.ts (#constant-overview)
- Basic Shape (#basic-shape)
- Defaults And Optional Fields (#defaults-optional)
- Array Fields (#arrays)
- Enum Fields (#enum-fields)
- Small Helpers (#helper-methods)

## Content

scalar.constant.ts

scalar

A small value object saved inside another model, such as a price, an address or a coordinate.

parent model

The model that embeds the scalar, such as a `Product` holding a `Price`.

Turns a list of fields into a class, imported from `akanjs/constant`.

Declares one value and its type, plus options such as a default.

Declares a fixed list of allowed values, imported from `akanjs/base`.

Saved as a record of its own.

No base fields at all.

Saved as part of the parent model's record.

Text, true or false, and a point in time.

Whole numbers such as counts and quantities.

Numbers with decimals, such as an amount or a longitude.

The id of another record, such as `fileId`.

A truly open payload, for when explicit fields cannot describe it.

String keys to values, with the value type named in a required `{ of: String }`.

An `enumOf()` class from the same file: one of a fixed set of values.

Another scalar, imported from its own constant and nested as a value.

Required, so the parent model's form will not save while it is empty.

Required, but `0` counts as a value and saves, and `field(Int)` works the same way.

Required, but `false` counts as a value and saves.

Required, but it starts filled, and clearing it blocks the save.

Optional, and an empty string is saved as `null`.

An empty list is valid, so it saves.

A third-party package, so import a re-export instead, such as `dayjs` from `akanjs/base`.

Server-only code, whose work belongs in the service.

Client-only code, whose work belongs in the store and components.

Not allowed in a constant file, so write a TypeScript `private` method instead.

The comment ships to the browser inside the bundle, so write `// FIXME:` instead.

Label every field and enum value you declared here.

Every field option

`min`, `max`, `example`, `validate` and the rest, in the `akanjs/constant` reference.

Scalar Overview

When a value should be a scalar and when a model of its own.

The five-class constant a stored model uses.

A scalar constant declares the shape of a small value that other models embed, such as a price or an address. You open it when that value gains, loses or changes a field.

Words used on this page

Term

One class, not five

A module constant declares five classes because its model keeps records of its own. A scalar keeps none, so its file is one class plus its enums:

Basic Shape

Field types

Pick the type by what the value is. The last two rows are classes from your own code:

Type

Use for

Defaults And Optional Fields

What a new value starts as

Array Fields

Enum Fields

Small Helpers

A small method can live on the class when the behavior belongs to the value itself. Keep it pure: no server request, no database call, no external service.

The whole file, with the enum and one helper:

What a constant file cannot contain

The same file runs on the server and in the browser, so lint holds it to the rules of both:

Not allowed

Why, and what to write

Read next

## Code Examples

### apps/myapp/lib/__scalar/price/price.constant.ts

```ts
import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float),
  currency: field(String),
})) {}
```

### apps/myapp/lib/__scalar/price/price.constant.ts

```ts
import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
  memo: field(String).optional(),
})) {}
```

### apps/myapp/lib/__scalar/contactInfo/contactInfo.constant.ts

```ts
import { via } from "akanjs/constant";

export class ContactInfo extends via((field) => ({
  name: field(String),
  emails: field([String]),
})) {}
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

### apps/myapp/lib/__scalar/price/price.constant.ts

```ts
import { enumOf, Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Currency extends enumOf("currency", ["KRW", "USD"] as const) {}

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(Currency, { default: "KRW" }),
})) {
  isFree() {
    return this.amount === 0;
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

