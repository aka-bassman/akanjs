# scalar.document.ts

- Source: /conventions/scalar/document
- Mirror: /llms/pages/conventions/scalar/document.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.document.ts (#document-overview)
- The Whole File (#basic-wrapper)
- Helpers Go On The Constant (#helper-example)
- When You Use It (#when-to-use)

## Content

scalar.document.ts

The constant class that server and browser both load: fields, defaults and helpers.

Builds a server-side class with the same fields as the constant class.

The value's type in server code: its stored fields, without methods.

The value itself, for server and browser

Fields and defaults

The value's shape, such as `amount: field(Float, { default: 0 })`.

Enum classes such as `Currency`, declared above the scalar class.

Helper methods

Display, predicate and small calculation methods such as `getLabel()`.

Labels

Labels and descriptions

An `[en, ko]` label and description for every field and enum value.

Server only

The one-line wrapper that gives server code the `db.Price` type.

When you need…

File

Example

A service method that takes or returns the value

One price label reused in product cards, order summaries and invoices

An address summary built from `city` and `street`

A calculation across two values, such as a distance

Loading other records or calling a backend service

Where helper methods live, with instance and `static` examples.

A database module's document, where chain methods do belong.

Words used on this page

Name

The Whole File

Helpers Go On The Constant

A helper that reads the scalar's fields, such as a label, a flag or a small calculation, belongs on the constant class. The document class keeps only the wrapper.

What you write

Lives in this file

Not here

When You Use It

Where each need goes

Reach for a helper when the same display or calculation shows up in several places. Anything that loads data stays in a service.

Common mistakes

Read next

## Code Examples

### apps/<app>/lib/__scalar/price/price.document.ts

```ts
import { by } from "akanjs/document";

import * as cnst from "./price.constant";

export class Price extends by(cnst.Price) {}
```

### apps/<app>/lib/__scalar/price/price.constant.ts

```ts
import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
})) {
  getLabel() {
    return `${this.amount.toLocaleString()} ${this.currency}`;
  }
}
```

### libs/shared/lib/user/user.service.ts

```ts
import { serve } from "akanjs/service";

import * as db from "../db";

export class UserService extends serve(db.user, () => ({})) {
  async setLeaveInfo(userId: string, leaveInfo: db.LeaveInfo) {
    const user = await this.userModel.getUser(userId);
    return await user.set({ leaveInfo }).save();
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

