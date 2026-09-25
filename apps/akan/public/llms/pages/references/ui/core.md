# Core

- Source: /references/ui/core
- Mirror: /llms/pages/references/ui/core.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Core UI (#core-ui)
- Link (#Link)
- Image (#Image)
- Layout (#Layout)
- Load (#Load)
- Model (#Model)

## Content

Core

Moves between internal routes. Every internal link is a `Link`.

Draws an uploaded file or a URL, resized by Akan's image optimizer.

The page frame: content containers, top and bottom chrome, a header and drawers.

Turns a fetch result into a list, a detail, a form, or any awaited value.

Create, edit, view and remove shells wired to a model's generated store.

A named list query of a model, such as `productInShop`. Components take it as `fetch.slice.<name>`.

What `fetch.init*`, `fetch.view*` and `fetch.edit*` return: the data plus what the store needs.

Write server data into the client store, so generated actions such as paging work on it.

A fallback that covers one section while its data loads, without holding the rest of the page.

Bars fixed above or below the scrolling body, such as a navbar or a bottom tab bar.

The element a user clicks to open a modal or a confirmation.

A form's unsaved input, kept on the device and offered back when the form reopens.

Destination route. When empty, Link renders its children inside a plain `div`.

Blocks navigation and renders the same `div`, so the layout does not move.

Class added while the current path starts with `href`.

Adds `activeClassName` only on the exact path, not on its sub-paths.

Scrolls to the top after client-side navigation.

Replaces the current history entry instead of adding one.

Meant to bypass the route cache, but neither renderer reads it yet.

Pass through to `<a>` on server-rendered pages. The CSR bundle drops them.

Calls `router.back()` on click. It is a plain `div`, so it wraps any mark you give it.

Calls `window.close()` on click, for a route opened in its own tab such as an OAuth popup.

Calls `router.setLang(lang)` on click, swapping only the locale segment of the current route.

Direct image URL. It wins over `file.url`.

A `File` model value, or any object with `url` and `imageSize`.

Rendered size. A missing value comes from `file.imageSize`.

Alternative text. Pass a real description; the default is just the word image.

Low-quality preview data. It overrides `file.abstractData`.

Quality the optimizer encodes at.

Loads eagerly at high priority, and preloads the image on server-rendered pages.

Skips the optimizer and serves the original URL.

Vertical form container with the spacing a module `Template` expects.

List or card item. With `href`, the whole unit becomes one `Link`.

Detail page container, capped at `max-w-5xl`.

Section container for zones and page blocks, with the same width cap.

Portals `children` into the top inset. `back` is `true` for the default chevron, or your node.

Top chrome that is not a navbar. `estimatedHeight` is the space reserved for it.

The inset's top-left corner, where the navbar's `back` lands. Other corner controls go here.

Bottom chrome. `keyboardSticky` rides above the keyboard; `role` is chrome or keyboard accessory.

The app's bottom tab bar. Each tab is `{ name, icon, activeIcon?, notiCount?, href }`.

Fixed web header. `hide` slides it away on scroll down from `md` width up; `static` keeps it.

Drawer that owns its open state and closes on route change; `trigger`, `header`, `close` swap parts.

Controlled left drawer. `close={false}` draws no close control.

Controlled right drawer, with a `title` slot the left one lacks.

Renders a slice's list and hydrates the store, so generated paging and refresh keep working.

Hydrates one full model and draws it with `renderView`; `noDiv` drops the wrapper element.

`edit` takes an edit payload, its promise, or a new-record seed. `type`: `modal`, `form`, `empty`.

A standalone pager on a list's `init`. It draws nothing while every row fits on one page.

Awaits one promise behind its own Suspense boundary and hands the value to `children`.

Route-level loader for SSR and CSR: `of` is the component CSR mounts, `loader` the shared fetch.

One of the two is required: draw each row, or the whole list at once.

Shown when the list has no rows. `empty` wins when both are given.

Fallback while `init` is pending and while a refetch runs.

A pager on desktop, infinite scroll on mobile. Turn it off to place `Load.Pagination` yourself.

How old seeded data may be before a mount refetches; `0` always refetches.

Slice the rows `renderItem` draws, without refetching.

Filter, sort and reverse the rows already loaded, on the client.

Page

server

Takes a render function

`renderItem` and `renderList` are functions, so a server page cannot pass them.

`renderView` is a function too.

Takes only data

`edit`, `slice`, strings and `children` all cross the boundary.

Takes `init` and one flag.

Carries no "use client", so its `children` function runs wherever it is rendered.

Route-level

`of`, `loader` and `render` are the function props a page may pass.

`false` turns recovery off; a string names the scope yourself.

`children` is the form body, `partial` seeds it, `trigger` replaces the default New button.

The same pair for one record; `trigger` defaults to the framework's Edit button.

Opens the create form on click. `resets` lists models whose `reset<Model>()` runs on open.

Opens one record in the edit form.

Opens one record in the detail view.

Asks in a small confirm popover, then removes the record.

The edit shell with no trigger. `onSubmit` / `onCancel`: `"back"`, `"reset"`, a path, or a callback.

The detail view in a modal, with title and action slots.

One modal that flips between view and form; `menu={false}` drops the kebab and its remove entry.

The store-side `Load.View`: loaded, loading or empty from one model. Pass the store's loading flag.

A whole admin screen built from the generated `Unit`, `Template` and `View` namespaces.

Seed the client store from a fetch result and render nothing.

`children` opens a confirmation modal. A custom `action` must do the removal itself.

Heavier removal: `typeNameToRemove` keeps the button locked until the user retypes `name`.

Core UI

Component

Words used on this page

Term

Link

Example

A product card that links to its page and stays highlighted while that page is open:

Image

A 48px avatar from the image the user uploaded:

Layout

The page frame. Pick a member by where it goes: inside a module file, above or below the scrolling body, or over the page.

Content containers

Top and bottom chrome

Navbar, TopInset, BottomInset and BottomTab register their height with the route, so the scrolling body is never hidden behind them.

Header and drawers

These four draw over the page and register no height.

A detail page with a back button and an edit link in the navbar:

A list row that opens the order when tapped:

Load

Members

Load.Units options

Where each member goes

Member

Works here

Not here

Example: a page and its Zone

The page starts every query and hands out the promises:

The Zone holds the two members that take a render function:

Form drafts

Model

A trigger and its modal in one line

Wrappers: your element becomes the trigger

Modals and bodies with no trigger

Removal

Edit and remove buttons for one product, and a create button with its own label:

## Code Examples

### apps/shop/lib/product/Product.Unit.tsx

```ts
import type { cnst } from "@apps/shop/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ product }: ModelProps<"product", cnst.LightProduct>) => {
  return (
    <Link
      href={`/product/${product.id}`}
      className="block rounded-xl border p-4"
      activeClassName="border-primary"
    >
      {product.name}
    </Link>
  );
};
```

### apps/shop/lib/user/User.Unit.tsx

```ts
import type { cnst } from "@apps/shop/client";
import type { ModelProps } from "akanjs/client";
import { Image } from "akanjs/ui";

export const Avatar = ({ user }: ModelProps<"user", cnst.LightUser>) => {
  return (
    <Image file={user.image} alt={user.nickname} width={48} height={48} className="rounded-full" />
  );
};
```

### apps/shop/page/order/[orderId]/_index.tsx

```ts
import { fetch, Order, usePage } from "@apps/shop/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Layout, Link } from "akanjs/ui";

export default page()
  .param("orderId", ID)
  .render(async ({ orderId }) => {
    const { l } = usePage();
    const [{ order, orderView }] = await Promise.all([
      fetch.viewOrder(orderId),
    ]);
    return (
      <>
        <Layout.Navbar back>
          <div className="flex w-full items-center justify-between">
            <div className="font-bold">{order.name}</div>
            <Link href={`/order/${orderId}/edit`}>{l("base.edit")}</Link>
          </div>
        </Layout.Navbar>
        <Order.Zone.View view={orderView} />
      </>
    );
  });
```

### apps/shop/lib/order/Order.Unit.tsx

```ts
import type { cnst } from "@apps/shop/client";
import type { ModelProps } from "akanjs/client";
import { Layout } from "akanjs/ui";

export const Card = ({ order }: ModelProps<"order", cnst.LightOrder>) => {
  return (
    <Layout.Unit href={`/order/${order.id}`}>
      <div className="font-bold">{order.name}</div>
    </Layout.Unit>
  );
};
```

### apps/shop/page/shop/[shopId]/product/[productId]/_index.tsx

```ts
import { fetch, Product } from "@apps/shop/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load, Loading } from "akanjs/ui";

export default page()
  .param("shopId", ID)
  .param("productId", ID)
  .render(({ shopId, productId }) => {
    const { productView } = fetch.viewProduct(productId);
    const { productInitInShop, productListInShop } =
      fetch.initProductInShop(shopId);
    return (
      <>
        <Product.Zone.View view={productView} />
        <Product.Zone.Card init={productInitInShop} />
        <Load.Stream
          of={productListInShop}
          fallback={<Loading.Skeleton active />}
        >
          {(productList) => <Product.Unit.Total count={productList.length} />}
        </Load.Stream>
      </>
    );
  });
```

### apps/shop/lib/product/Product.Zone.tsx

```ts
"use client";
import { type cnst, Product } from "@apps/shop/client";
import type { ClientInit, ClientView } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"product", cnst.LightProduct>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        pagination={false}
        renderItem={(product) => (
          <Product.Unit.Card key={product.id} product={product} />
        )}
      />
      <Load.Pagination init={init} scrollToTop />
    </>
  );
};

interface ViewProps {
  className?: string;
  view: ClientView<"product", cnst.Product>;
}
export const View = ({ className, view }: ViewProps) => {
  return (
    <Load.View
      className={className}
      view={view}
      renderView={(product) => <Product.View.General product={product} />}
    />
  );
};
```

### apps/shop/lib/product/Product.Util.tsx

```ts
"use client";
import { fetch, Product, usePage } from "@apps/shop/client";
import { cn } from "akanjs/client";
import { buttonRecipe, Model } from "akanjs/ui";

interface ManageProps {
  className?: string;
  productId: string;
  name: string;
}
export const Manage = ({ className, productId, name }: ManageProps) => {
  return (
    <div className={cn("flex gap-2", className)}>
      <Model.Edit slice={fetch.slice.product} modelId={productId}>
        <Product.Template.General />
      </Model.Edit>
      <Model.SureToRemove
        slice={fetch.slice.product}
        modelId={productId}
        name={name}
        typeNameToRemove
      />
    </div>
  );
};

export const Create = () => {
  const { l } = usePage();
  return (
    <Model.New
      slice={fetch.slice.product}
      partial={{ status: "draft" }}
      trigger={
        <button className={buttonRecipe({ variant: "outline" })}>
          {l.trans({ en: "Add product", ko: "상품 추가" })}
        </button>
      }
    >
      <Product.Template.General />
    </Model.New>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

