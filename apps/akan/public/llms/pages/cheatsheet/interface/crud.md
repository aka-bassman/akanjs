# CRUD

- Source: /cheatsheet/interface/crud
- Mirror: /llms/pages/cheatsheet/interface/crud.md
- Section: cheatsheet
- Category: Interface
- Priority: P2

## Headings

- CRUD With Less Code (#overview)
- Start With A Slice (#slice)
- List And Open (#list)
- Create And Edit (#create-edit)
- Remove In Util (#remove)
- Tips (#tips)

## Content

CRUD

The slice. It decides which records this screen can read and edit.

Draws the form fields. Create and edit use the same one.

Connects the slice to UI behaviour with the `Load` and `Model` components.

Task

Store key or action

Component

List

Open

Create

Edit

Remove

The root slice `initPost(queryKey, args)`, which can run any filter, so it is always `Admin`.

The single-record read `fetch.post(id)`, which `viewPost` and `editPost` also use.

`createPost`, `updatePost`, `removePost`; the `create`, `update`, `remove` keys override one each.

A named slice's own list, which the `guards` map above never reaches.

Goes on a page of its own, such as `new.tsx`; the form is open as soon as the route is.

Goes anywhere and draws its own New button; a click calls `st.do.newPost()`.

Goes anywhere and draws its own Edit button; a click calls `st.do.editPost(id)`.

Goes beside a list in a Zone; the Edit button in its detail view opens the form.

Forms

The Template, the create and edit pages, and every shell option in detail.

Slices, guards and the fetch names each slice key produces.

How a Zone hydrates the store and hands rows to Unit and View.

One domain action as a control, such as `Remove` or `Publish`.

CRUD With Less Code

CRUD is usually the first screen you build: list records, open one, create one, edit it and remove it. In Akan the store actions and components for all five already exist, so you write the three pieces below and the pages that place them.

What you write

Each task maps to the components and generated store actions that do it:

Start With A Slice

1. Declare the filter

2. Expose it as a slice

Then list it in the signal, one key per screen:

Who may call what

Key

What it guards

List And Open

1. Load in the page

The page starts the slice query and hands the promise to the Zone:

2. Draw it in a Zone

Each card opens its post, and one modal shows whichever post is open:

Create And Edit

Pick the shell by where the form should appear:

Shell

Where it goes and what opens it

Create page

A create page seeds the form with the values a new post starts with:

Edit page

An edit page loads the record on the server and hands it to the same shell:

Edit in a modal

Remove In Util

Tips

Read next

## Code Examples

### apps/blog/lib/post/post.document.ts

```ts
import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";

export class PostFilter extends from(cnst.Post, (filter) => ({
  query: {
    inPublic: filter().query(() => ({ status: "published" })),
  },
  sort: {},
})) {}

export class Post extends by(cnst.Post) {}

export class PostModel extends into(Post, PostFilter, cnst.post, () => ({})) {}
```

### apps/blog/lib/post/post.signal.ts

```ts
import { Admin } from "@libs/shared/srvkit"; // [!code collapse:5]
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as srv from "../srv";

export class PostInternal extends internal(srv.post, () => ({})) {}

export class PostSlice extends slice(
  srv.post,
  { guards: { root: Admin, get: Public, cru: Admin } },
  (init) => ({
    inPublic: init({ guards: [Public] }).exec(function () {
      return this.postService.queryInPublic();
    }),
    inAdmin: init({ guards: [Admin] }).exec(function () {
      return this.postService.queryAny();
    }),
  }),
) {}

export class PostEndpoint extends endpoint(srv.post, () => ({})) {}
```

### apps/blog/page/admin/post/_index.tsx

```tsx
import { fetch, Post } from "@apps/blog/client";
import { page } from "akanjs/client";

export default page().render(() => {
  const { postInitInAdmin } = fetch.initPostInAdmin();
  return <Post.Zone.Card init={postInitInAdmin} />;
});
```

### apps/blog/lib/post/Post.Zone.tsx

```tsx
"use client"; // [!code collapse:4]
import { type cnst, fetch, Post } from "@apps/blog/client";
import type { ClientInit } from "akanjs/fetch";
import { Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"post", cnst.LightPost>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderItem={(post) => (
          <Model.ViewWrapper
            key={post.id}
            slice={fetch.slice.postInAdmin}
            modelId={post.id}
          >
            <Post.Unit.Card post={post} />
          </Model.ViewWrapper>
        )}
      />
      <Model.ViewEditModal
        slice={fetch.slice.postInAdmin}
        renderView={(post) => <Post.View.General post={post} />}
        renderTemplate={() => <Post.Template.General />}
      />
    </>
  );
};
```

### apps/blog/page/admin/post/new.tsx

```tsx
import { type cnst, fetch, Post } from "@apps/blog/client";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page().render(() => {
  const postForm: Partial<cnst.Post> = { status: "draft" };
  return (
    <Load.Edit
      slice={fetch.slice.postInAdmin}
      edit={postForm}
      type="form"
      onSubmit="/admin/post"
    >
      <Post.Template.General />
    </Load.Edit>
  );
});
```

### apps/blog/page/admin/post/[postId]/edit.tsx

```tsx
import { fetch, Post } from "@apps/blog/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page()
  .param("postId", ID)
  .render(async ({ postId }) => {
    const [{ postEdit }] = await Promise.all([fetch.editPost(postId)]);
    return (
      <Load.Edit
        slice={fetch.slice.postInAdmin}
        edit={postEdit}
        type="form"
        onSubmit="/admin/post"
      >
        <Post.Template.General />
      </Load.Edit>
    );
  });
```

### apps/blog/lib/post/Post.Util.tsx

```tsx
"use client";
import { fetch, Post } from "@apps/blog/client";
import { Model } from "akanjs/ui";

interface EditProps {
  postId: string;
}
export const Edit = ({ postId }: EditProps) => {
  return (
    <Model.Edit
      slice={fetch.slice.postInAdmin}
      modelId={postId}
      renderTitle="title"
    >
      <Post.Template.General />
    </Model.Edit>
  );
};
```

### apps/blog/lib/post/Post.Util.tsx

```tsx
"use client";
import { fetch, usePage } from "@apps/blog/client";
import { Model } from "akanjs/ui";

interface RemoveProps {
  postId: string;
}
export const Remove = ({ postId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={postId} slice={fetch.slice.post}>
      {l("base.remove")}
    </Model.Remove>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

