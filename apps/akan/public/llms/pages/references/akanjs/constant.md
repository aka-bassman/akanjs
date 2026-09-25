# akanjs/constant

- Source: /references/akanjs/constant
- Mirror: /llms/pages/references/akanjs/constant.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/constant (#akanjs-constant)
- via (#via)
- field (#field)
- field.visual / field.hidden / field.secret (#field.visual / field.hidden / field.secret)
- resolve (#resolve)
- getDefault (#getDefault)
- DocumentModel / DefaultOf / QueryOf (#DocumentModel / DefaultOf / QueryOf)
- crystalize / purify (#crystalize / purify)
- serialize / deserialize (#serialize / deserialize)
- ConstantRegistry (#ConstantRegistry)

## Content

akanjs/constant

Declares every constant class. What you pass decides which class it is.

The builder `via` hands you. Each call declares one stored field.

Variants of `field` that keep a value away from agents, the client, or default reads.

Declares a field the server computes for each response instead of storing it.

Builds the blank object a new record or form starts from.

Types for the stored shape, the default shape, a query, a purified value, and a file.

Turn raw data into model values, and a model back into a checked plain object.

Convert values to and from the payload that crosses a boundary.

Finds model classes, refNames and enums at runtime.

The camelCase name a module is registered under, such as `banner`.

A value object with no table of its own. Other documents embed it whole.

A field whose type is another database model. It stores that document's id.

A read option that names the fields to load, such as `{ password: true }`.

The fields a caller sends to create or update a banner.

The Input plus fields the server keeps, and `id`, `createdAt`, `updatedAt`, `removedAt`.

Only the fields a list needs. Display and predicate methods live here.

The full model: every field, plus the ones `resolve` computes.

Numbers about a whole list. It starts with `count` and is written even when empty.

Arguments

Declares

`BannerInput`, or a scalar. A lone builder callback is either one.

`BannerObject`: the Input's fields plus the ones you add.

`LightBanner`: only the named fields, plus any `resolve` fields.

`Banner`: Object and Light merged, plus any `resolve` fields.

`BannerInsight`: `count` plus the fields you add.

Write

One value: `String`, `Boolean`, `Date`, `ID`, `Int`, `Float` or `Any`.

An array. Brackets nest up to three deep, as in `[[Float]]`.

A relation to another model's document, stored as its id.

A scalar, embedded whole inside this document.

An enum class declared with `enumOf`.

A map with string keys. `of` names the value type and is required.

An open value. The type argument keeps it typed in TypeScript.

The starting value. A function runs again for every record.

Your own check, run by `purify` and on every document save. `false` rejects the value.

Changing it in a document save throws. Query-level writes skip the check.

The value type of a `Map` field, such as `String` or a scalar. Required for `Map`.

The same as declaring it with `field.visual`.

query object

Insight fields only: the condition this counter counts. `{}` counts every match.

Adds the field to full-text search in that role. `thumb` is kept for display, never matched.

Removes related documents together. The value says which side follows which.

The refName an `ID` field points at, as in `{ ref: "org", cascade: "removeWith" }`.

The field naming which model the id points at: an `enumOf`, or a `String` with `removeWithAny`.

A lower bound shown in the schema docs. `sampleOf()` uses it as the sample.

An upper bound, used the same way as `min`.

A shortest length for the schema docs. On an array, `purify` does check the item count.

A longest length, handled the same way as `minlength`.

Makes `sampleOf()` produce a realistic email, password or URL.

A sample value for the schema docs and the API explorer's example requests.

A label the schema docs show on a relation.

Allows `null`. Without a `default`, the field starts at `null`.

Attaches free-form metadata. A summary counter uses it to name the list it counts.

Read

Page

Agent

Draft

Search

Sent to the page

An ordinary field. Every side reads it.

Drawn on the page, stripped from everything an agent reads.

Kept on the server

Server code reads it. The client gets `null`.

Read only through a projection that names it.

Field

Starts at

`null`, always.

What the function returns, run again on each call.

An array field

A fresh copy of its `default`, or `[]` without one.

Any other `default`

That value itself, shared by every object built from it.

`.optional()` with no `default`

An embedded scalar

That scalar's own default object.

A relation

Any other type

The type's empty value, such as `""`, `0` or `false`.

The stored shape. Relations become id strings, and a list of them `string[]`.

What `getDefault()` returns. Methods are dropped, and relation fields may be `null`.

An opaque query descriptor, typed `any`. A slice's `exec` returns one.

What `purify` returns. Relations become ids; dates keep the `Dayjs` type.

The shape of a `File` and a `LightFile`, for UI code that takes a file prop.

Default `type` is `"object"`; `"input"` sends relations as ids. `opts` is `{ nullable?, key? }`.

`opts` is `{ nullable?, key?, enum?, convertFn? }`. With `enum`, a value outside it throws.

The short form, `(ref, value, nullable?)`. Takes a primitive, `Map` or model; `[Ref]` for a list.

The model's refName. Throws for an unknown class unless `{ allowEmpty: true }` is given.

The class name for its role, such as `BannerInput` or `LightBanner`.

The class for a refName and role. With no role it finds a primitive such as `"Int"`.

A module's registered entry: its five classes, or a scalar's one. Throws unless `allowEmpty`.

Whether the class is registered.

Which role a class plays.

The short forms from the `serialize` / `deserialize` section above.

Export

Words Used on This Page

Term

The Five Classes of a Module

A database module declares these five classes, always in this order. The banner module is the example throughout this page:

Class

via

field

Types

A product input that uses most of them:

Options

Value and Checks

Search and Relations

Docs and Samples Only

Chained Methods

Method

field.visual / field.hidden / field.secret

The value can reach it

Never reaches it

A profile with one of each:

resolve

Declare it on the model:

getDefault

Both ways of calling it, in a test:

DocumentModel / DefaultOf / QueryOf

Type helpers that documents, stores and tests use to name a model's other shapes. Import them as types only:

Type

crystalize / purify

These two move a value between raw data and a model instance, in opposite directions. You reach them through the model rather than by name.

crystalize — raw to model

purify — model to plain

In practice you build with the constructor and check with the model's purify:

serialize / deserialize

These convert between runtime values and the payload that crosses a document or transport boundary.

serialize — runtime to payload

deserialize — payload to runtime

Call

A date on its way out and back:

ConstantRegistry

Static method

## Code Examples

### libs/shared/lib/banner/banner.constant.ts

```typescript
import { dayjs, enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

import { File } from "../file/file.constant";

export class BannerStatus extends enumOf("bannerStatus", ["active", "displaying"] as const) {}

export class BannerInput extends via((field) => ({
  title: field(String, { text: "title" }).optional(),
  image: field(File, { text: "thumb" }).optional(),
  href: field(String),
  from: field(Date, { default: () => dayjs() }),
})) {}

export class BannerObject extends via(BannerInput, (field) => ({
  status: field(BannerStatus, { default: "active", text: "filter" }),
})) {}

export class LightBanner extends via(
  BannerObject,
  ["title", "image", "href", "status"] as const,
  (resolve) => ({}),
) {}

export class Banner extends via(BannerObject, LightBanner, (resolve) => ({})) {}

export class BannerInsight extends via(Banner, (field) => ({})) {}
```

### apps/myapp/lib/product/product.constant.ts

```typescript
import { Any, enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

import { File } from "../file/file.constant";

export class ProductStatus extends enumOf("productStatus", ["draft", "onSale"] as const) {}

export class ProductInput extends via((field) => ({
  name: field(String, { minlength: 2, maxlength: 80, text: "title" }),
  price: field(Int, {
    default: 0,
    min: 0,
    validate: (price) => (price ?? 0) >= 0,
  }),
  tags: field([String], { text: "tag" }),
  cover: field(File, { cascade: "removeRef" }).optional(),
  status: field(ProductStatus, { default: "draft" }),
  spec: field<{ weightG: number }>(Any, { default: () => ({ weightG: 0 }) }),
})) {}
```

### apps/myapp/lib/profile/profile.constant.ts

```typescript
import { via } from "akanjs/constant";

export class ProfileInput extends via((field) => ({
  nickname: field(String, { text: "title" }),
  renderedBio: field.visual(String).optional(),
  loginProvider: field.hidden(String),
  password: field.secret(String, { type: "password", minlength: 8 }).optional(),
})) {}
```

### apps/myapp/lib/order/order.constant.ts

```typescript
import { Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class Order extends via(OrderObject, LightOrder, (resolve) => ({
  totalPrice: resolve(Int),
})) {}
```

### apps/myapp/lib/order/order.signal.ts

```typescript
import { Int } from "akanjs/base";
import { internal } from "akanjs/signal";

import * as srv from "../srv";

export class OrderInternal extends internal(srv.order, ({ resolveField }) => ({
  totalPrice: resolveField(Int).exec(function (order) {
    return order.unitPrice * order.quantity;
  }),
})) {}
```

### libs/shared/lib/banner/banner.test.ts

```typescript
import { expect, test } from "bun:test";
import { FIELD_META } from "akanjs/base";
import { getDefault } from "akanjs/constant";

import * as cnst from "../cnst";

test("a new banner starts active", () => {
  expect(cnst.Banner.getDefault().status).toBe("active");
  expect(getDefault<cnst.Banner>(cnst.Banner[FIELD_META]).status).toBe("active");
});
```

### libs/shared/lib/banner/banner.test.ts

```typescript
import { expect, test } from "bun:test";
import { dayjs } from "akanjs/base";

import * as cnst from "../cnst";

test("a banner needs an href to purify", () => {
  const banner = new cnst.BannerInput({ from: dayjs() });
  expect(cnst.BannerInput.purify(banner)).toBeNull();
  banner.set({ href: "/sale" });
  expect(cnst.BannerInput.purify(banner)?.href).toBe("/sale");
});
```

### libs/shared/lib/banner/banner.test.ts

```typescript
import { expect, test } from "bun:test";
import { dayjs } from "akanjs/base";
import { ConstantRegistry } from "akanjs/constant";

test("a date crosses as Date and comes back as Dayjs", () => {
  const sent = ConstantRegistry.serialize(Date, dayjs("2026-09-24"));
  expect(sent instanceof Date).toBe(true);
  expect(dayjs.isDayjs(ConstantRegistry.deserialize(Date, sent))).toBe(true);
});
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

