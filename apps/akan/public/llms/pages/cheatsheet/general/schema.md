# Schema Design

- Source: /cheatsheet/general/schema
- Mirror: /llms/pages/cheatsheet/general/schema.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- Schema Design (#overview)
- Start From The Screen (#query-first)
- Relationship Size (#relationship-size)
- Reference Or Copy (#denormalize)
- The Five Model Classes (#layers)
- Design Checklist (#tips)

## Content

Schema Design

One stored record of a model, such as one post.

A field typed as another model, which stores only the id and is loaded by the server.

A value object declared under `lib/__scalar/` and stored inside the document.

The few fields of a model that one list row shows, such as `LightPost`.

A model whose documents point back at a parent, like comments at a post.

Screen

Lands in

Ask first

List page

What small fields should every row show?

Detail page

What full data should load together?

Form

Which values does the user type in?

Child list

What can grow forever, like comments or logs, and needs its own model?

One to few

Embed a scalar array in the document, as for a user's few links or a post's small settings.

One to many

Keep an array of relations, which stores only ids, as for selected files or assigned users.

One to squillions

Make a child model that points back at its parent, as for comments, logs, events or telemetry.

Reference

Copy

When the list is read

Same response

Either way, the list page sends no second request.

Always current

The server looks the user up each time it builds a response.

No lookup on read

The copied values are read exactly as stored.

When the post is written

Stores only the id

The post keeps the user's id and nothing else about them.

Updated by your code

A copy changes only when your code writes it again.

Fields a user can submit through a form.

`<Model>Input` plus fields the server manages, such as a status or a counter.

The small shape for list rows and relations, which also holds display methods like `isNew()`.

The full document: everything in `<Model>Object` and `Light<Model>`.

Summary numbers for dashboards, always including `count`.

Every field type, option and rule of the constant file.

Cascade Remove

Which side of a relation is removed along with the other.

Scalar Tutorial

Build a scalar and embed it in a model, step by step.

One simple rule settles most cases:

Keep It Together

Small data that is read together stays inside one document.

Split It Out

Data that keeps growing moves to a model of its own.

Words used on this page

Term

Start From The Screen

Before adding fields, picture the list page, the detail page and the form. The schema should make those everyday reads easy.

Relationship Size

When one thing has many children, first ask how many there will be. The answer picks the schema.

How many

Store it as

Comments can grow without limit, so they get a model of their own that points back at the post:

Reference Or Copy

A post list usually shows the author's name and picture next to each post. Both schemas below put them in the same response, so the list page needs no extra request.

What you get

Yes

No

Declaring each one

A copy first needs a scalar that holds the snapshot:

Then the post keeps a field of that type:

The Five Model Classes

Class

Design Checklist

Run through these before you add a field.

Read next

## Code Examples

### apps/myapp/lib/post/post.constant.ts

```ts
export class LightPost extends via(
  PostObject,
  ["title", "author", "thumbnail", "status"] as const,
  (resolve) => ({}),
) {}
```

### apps/myapp/lib/comment/comment.constant.ts

```ts
import { ID } from "akanjs/base";
import { via } from "akanjs/constant";

export class CommentInput extends via((field) => ({
  post: field(ID, { ref: "post", cascade: "removeWith" }),
  content: field(String),
})) {}
```

### apps/myapp/lib/post/post.constant.ts

```ts
export class PostInput extends via((field) => ({
  title: field(String),
  thumbnail: field(File).optional(),
})) {}

export class PostObject extends via(PostInput, (field) => ({
  author: field(LightUser),
})) {}
```

### apps/myapp/lib/__scalar/authorCard/authorCard.constant.ts

```ts
import { via } from "akanjs/constant";

export class AuthorCard extends via((field) => ({
  nickname: field(String),
  imageUrl: field(String).optional(),
})) {}
```

### apps/myapp/lib/post/post.constant.ts

```ts
export class PostObject extends via(PostInput, (field) => ({
  authorCard: field(AuthorCard),
})) {}
```

### apps/myapp/lib/post/post.constant.ts

```ts
import { enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

export class PostStatus extends enumOf("postStatus", [
  "draft",
  "published",
] as const) {}

export class PostInput extends via((field) => ({
  title: field(String),
})) {}

export class PostObject extends via(PostInput, (field) => ({
  status: field(PostStatus, { default: "draft" }),
})) {}

export class LightPost extends via(
  PostObject,
  ["title", "status"] as const,
  (resolve) => ({}),
) {}

export class Post extends via(PostObject, LightPost, (resolve) => ({})) {}

export class PostInsight extends via(Post, (field) => ({})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

