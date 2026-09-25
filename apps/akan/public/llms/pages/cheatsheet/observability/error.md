# Error Handling

- Source: /cheatsheet/observability/error
- Mirror: /llms/pages/cheatsheet/observability/error.md
- Section: cheatsheet
- Category: Observability
- Priority: P2

## Headings

- Error Handling (#overview)
- Declare Errors (#declare-errors)
- Throw Err (#throw-err)
- Choose Status (#choose-status)
- Use Data (#use-data)
- Client Handling (#client-handling)
- Response Shape (#response-shape)
- Tips (#tips)

## Content

Error Handling

1. Declare: register each error sentence as an `[en, ko]` pair in `.error({})`.

2. Throw: when a business rule fails, throw `new Err("order.error.notDraft")`.

3. Send: the server answers with the untranslated key, a status code and `data`.

4. Show: fetch restores it as `Err`, and the store action shows it as a translated toast.

A precondition on the document's own state, such as only a draft order being editable.

A rule that loads or compares other documents, such as the product having to exist.

Who may call the endpoint at all, such as only the order's owner, written as a guard.

Server files import it from the module's `dict` barrel.

UI files import it from the app's client entry; a lib uses `@libs/<lib>/client`.

No import path for `Err` exists here, so keep throwing code out of these folders.

The default: a business rule rejected the request.

The same 400, named explicitly.

The caller has not signed in or proven who they are.

The user is known but may not do this action.

The requested record does not exist.

The current state cannot accept this action.

The dictionary key you threw, never a translated sentence.

400 by default or the helper's status, and the HTTP response carries the same one.

The placeholder values, present only when you passed them.

Extra debugging detail, present only when set.

The endpoint path, sent over HTTP only and never in a websocket error frame.

When the server answered, as an ISO string.

Answered with its own `statusCode`, and `error` holds the dictionary key.

Answered as 500, and a deployed build sets `error` to `Internal Server Error`.

An order that is already paid cannot be edited, and the user should hear why in their own language. In Akan the server throws a dictionary key, and the client translates that key and shows it.

One error travels through four steps:

Where

What happens

Declare Errors

The snippet leaves out the other stages of the chain:

Throw Err

Only a draft order can change its title:

Where each rule lives

Rule

Where to import Err

File

How

Choose Status

In a service, the order's state and the product's existence pick different statuses:

Use Data

Client Handling

The store action calls the endpoint and handles success only:

The button knows nothing about failure. It calls the action and lets the wrapper answer:

Response Shape

HTTP and websocket errors carry almost the same fields. You rarely build this by hand, but knowing it makes debugging easier.

Field

When a plain Error escapes

Thrown

What the caller gets

Tips

When a store needs a custom action, and how to write one.

Logging

## Code Examples

### apps/myapp/lib/order/order.dictionary.ts

```ts
import { modelDictionary } from "akanjs/dictionary";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Order", "주문"]).desc(["Order description", "주문 설명"]))
  .error({
    notDraft: ["Only draft orders can be edited", "초안 주문만 수정할 수 있습니다."],
    productNotFound: ["Product not found", "상품을 찾을 수 없습니다."],
    stockNotEnough: [
      "{productName} needs {quantity} items",
      "{productName} 재고가 {quantity}개 필요합니다.",
    ],
  })
  .translate({
    addItemSuccess: ["Item added", "상품을 담았습니다."],
  });
```

### apps/myapp/lib/order/order.document.ts

```ts
import { by } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class Order extends by(cnst.Order) {
  editTitle(title: string) {
    if (this.status !== "draft") throw new Err("order.error.notDraft");
    this.title = title;
    return this;
  }
}
```

### apps/myapp/lib/order/order.service.ts

```ts
async addItem(orderId: string, productId: string, quantity: number) {
  const order = await this.getOrder(orderId);
  if (order.status !== "draft") throw new Err.Conflict("order.error.notDraft");

  const product = await this.productService.loadProduct(productId);
  if (!product) throw new Err.NotFound("order.error.productNotFound");

  return await order.addItem(product, quantity).save();
}
```

### apps/myapp/lib/order/order.document.ts

```ts
addItem(product: cnst.Product, quantity: number) {
  if (product.stock < quantity) {
    throw new Err("order.error.stockNotEnough", {
      productName: product.name,
      quantity,
    });
  }

  this.items = [...this.items, { product: product.id, quantity }];
  return this;
}
```

### apps/myapp/lib/order/order.store.ts

```ts
import { store } from "akanjs/store";
import { fetch, msg, sig } from "../useClient";

export class OrderStore extends store(sig.order, () => ({
  // state
})) {
  // action
  async addItemToOrder(orderId: string, productId: string, quantity: number) {
    const order = await fetch.addItemToOrder(orderId, productId, quantity);
    this.setOrder(order);
    msg.success("order.addItemSuccess");
  }
}
```

### apps/myapp/lib/order/Order.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/myapp/client";
import { buttonRecipe } from "akanjs/ui";

interface AddItemProps {
  className?: string;
  orderId: string;
  productId: string;
}
export const AddItem = ({ className, orderId, productId }: AddItemProps) => {
  const { l } = usePage();
  return (
    <button
      className={buttonRecipe({ variant: "primary" }, className)}
      onClick={() => st.do.addItemToOrder(orderId, productId, 3)}
      type="button"
    >
      {l("order.signal.addItemToOrder")}
    </button>
  );
};
```

### Code

```json
{
  "error": "order.error.stockNotEnough",
  "statusCode": 400,
  "data": {
    "productName": "Yogurt Icecream",
    "quantity": 3
  },
  "path": "/addItemToOrder",
  "timestamp": "2026-05-25T00:00:00.000Z"
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

