# model.constant.ts

- Source: /conventions/module/constant
- Mirror: /llms/pages/conventions/module/constant.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.constant.ts (#constant-overview)
- Field Options (#field-options)
- Hidden, Secret, Visual (#masking)
- The Instance And Its Logic (#instance-and-helpers)
- Text Search Fields (#text-search-fields)
- Cascade Remove Fields (#cascade-fields)
- Resolved Fields (#resolve-fields)
- Extending Library Models (#generated-extension)
- Practical Rules (#practical-rules)

## Content

model.constant.ts

One stored record of a model, such as one ticket.

A field whose type is another model, like `File`. It stores the id and loads the model.

A value object declared under `lib/__scalar/`, stored inside the document, not as its own row.

Turning fetched plain data back into a model instance, with its methods and `Dayjs` dates.

A read option naming extra fields to load, such as `{ secret: true }`.

An AI caller: the in-page agent or an MCP client.

Fields a user fills in when creating or editing the model.

Input plus stored fields that the system or a service manages.

The few fields a list, a relation or a card returns. Server and client both hold it.

The full model: Object and Light combined. Collection helpers go here as statics.

Counters for dashboards. It always has `count`, and you write it even when it is empty.

JavaScript globals, so no import. A `Date` field reads back as a `Dayjs`.

Whole and decimal numbers from `akanjs/base`. `Number` does not typecheck as a field type.

Another document's id. Name the model it points at with the `ref` option.

A free-form payload. Use it only when the content really is open.

An `enumOf` class. The stored value must be one of its values.

An array of any type on this list. It defaults to `[]`.

A string-keyed map. The `of` option names the value type and is required.

A scalar class: a value object embedded in the document.

A model class, which makes the field a relation. It stores the id.

Never a model field. Store bytes by referencing the `File` model instead.

[] for an array, else null

A literal for a plain value, a thunk such as `() => dayjs()` for anything constructed.

The model an `ID` field points at, when you store an id instead of a relation.

The field holding a polymorphic owner's model name: an `enumOf`, or a `String` for `removeWithAny`.

scalar or model class

The value type of a `Map` field. Required for a Map.

A label for the kind of relation, shown in the schema docs. It changes no behavior.

Adds the field to the full-text index under this role. See Text Search Fields.

Which side of the relation is removed along with the other. See Cascade Remove Fields.

The page renders it and an agent never sees it. `field.visual(T)` is the short form.

Runs when a document is created or saved, and `false` refuses it. `null` and `undefined` skip it.

Changing it in a document save throws. Query-level writes skip the check.

A lower bound for the schema docs and `sampleOf()`. Enforce it with `validate`.

An upper bound, used the same way.

A length lower bound shown in the schema docs. On an array, the store checks the item count.

A length upper bound, handled the same way.

A sample value for the schema docs and the API explorer's example request and response.

Makes `sampleOf()` produce a realistic email, password or URL. It does not validate.

query object

Insight fields only: the condition this counter counts. `{}` counts every match.

Plain

An ordinary stored property. Every side gets it.

Secrecy: the value stays on the server

Stored and read by the server, never sent to a client. Always nullable.

Like hidden, and even the server's default read skips it until a projection asks.

Cost: only the agent skips it

Sent to the page as usual; stripped from agent reads, MCP results and the MCP schema.

Methods about one record: display text and predicates.

Helpers about a list of records.

Math that belongs to the value itself, not to whoever stored it.

The one line a person scans for, like a name or a headline.

A keyword list, such as a category or labels.

Prose, like a body or a description.

`String`, `ID`, relation

A scoping value such as status, role or owner. It matches but never outranks a title.

Kept so a hit can be drawn. It is not indexed and never matches.

The owner's own relation

When this document is removed, what the field points at is removed too.

The child's reference to its owner

When the owner is removed, this document is removed too.

The child's reference, when the owner can be any model

When the owner is removed, whatever its model, this document is removed too.

Write `field(Int)` or `field(Float)`. `Number` does not typecheck.

Write `enumOf("ticketStatus", [...] as const)`. A TypeScript `enum` is not a field type.

Write `default: () => dayjs()`. A bare `dayjs()` runs once, so every row shares that moment.

Write `ticket.isOverdue()` on `LightTicket`, which both server and client hold.

Write `new cnst.User().set(user)`. A spread drops every `Date` field.

Write `field(File)`. Bytes are not storable in a document; a `File` is.

Write `user.phone ?? ""`. A hidden or secret value arrives as `null`, not `undefined`.

This one file describes the shape of one business object. The storage schema, the generated CRUD, form state, the API contract, the admin explorer and the schema an AI agent reads all come from it, so no other file in the module restates the fields.

Open it whenever a field is added, changed or removed, and whenever the model needs display or predicate logic.

Words Used On This Page

Term

Five Classes, Always In This Order

Class

Here is the complete file for a support ticket:

Field Options

Types

Type

Values And References

Search, Cascade And Agents

Validation

Samples And Counters

Not In The Options Object

Hidden, Secret, Visual

Declaration

Server default read

Page

AI agent

Gets the value

Left out

The Instance And Its Logic

Put display and predicate logic on the Light class as methods. Server and client both hold a Light, so one method there works in a page, a card, a store action and a service.

Put it on

Logic about

The board model shows the first two in one file:

Copying An Instance

Date Fields Go Missing

These read own properties only, so the dates are missing.

Date Fields Are There

These walk the prototype too, so the dates are there.

Text Search Fields

Role

Weight

Accepts

What it holds

Cascade Remove Fields

Value

Declared on

Meaning

removeRef: On The Owner

Story owns its images

Story is removed

the File it points at

is removed too

points at

Declare it on the relation the owner holds, arrays included:

removeWith: On The Child

A session takes its chats with it

AgentSession is removed

every SessionChat naming it

by its id

removeWithAny: An Owner Of Any Model

What Every Cascade Shares

Resolved Fields

Some values belong to the record and the person looking at it: whether this user liked a story, how many times they read it, whether they may edit it. Storing those on the document would mean one row per viewer.

The Constant Names And Types It

An Internal Signal Computes It

Runs on every request, with whatever caller context it asks for.

The story's Light declares two resolved fields:

Extending Library Models

Practical Rules

Check these before you commit a constant file.

Common Mistakes

Instead of

Write

## Code Examples

### apps/koyo/lib/ticket/ticket.constant.ts

```ts
import { dayjs, enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class TicketStatus extends enumOf("ticketStatus", [
  "active",
  "opened",
  "inProgress",
  "completed",
] as const) {}

export class TicketInput extends via((field) => ({
  title: field(String),
  content: field(String, { default: "" }),
  type: field(String, { default: "shared" }),
})) {}

export class TicketObject extends via(TicketInput, (field) => ({
  status: field(TicketStatus, { default: "active" }),
  due: field(Date, { default: () => dayjs().hour(19) }), // shop closes at 7pm
})) {}

export class LightTicket extends via(
  TicketObject,
  ["title", "status", "due"] as const,
  (resolve) => ({}),
) {}

export class Ticket extends via(
  TicketObject,
  LightTicket,
  (resolve) => ({}),
) {}

export class TicketInsight extends via(Ticket, (field) => ({
  activeCount: field(Int, { default: 0, accumulate: { status: "active" } }),
})) {}
```

### libs/shared/lib/file/file.constant.ts

```ts
export class FileInput extends via((field) => ({
  filename: field(String, { text: "title" }),
  mimetype: field.hidden(String),
  encoding: field.hidden(String),
  imageSize: field<[number, number]>([Int], { default: [0, 0] }),
  url: field(String, { default: "" }),
  abstractData: field.visual(String).optional(),
  size: field(Int, { default: 0 }),
  origin: field.hidden(String).optional(),
})) {}
```

### libs/shared/lib/user/user.constant.ts

```ts
export class UserObject extends via(UserInput, (field) => ({
  accountId: field.secret(String).optional(),
  password: field.secret(String).optional(),
  phone: field.secret(String).optional(),
  notiInfo: field.secret(NotiInfo),
  restrictInfo: field.secret(RestrictInfo).optional(),
  roles: field([UserRole], { default: ["user"], text: "filter" }),
})) {}
```

### apps/koyo/lib/board/board.constant.ts

```ts
export class LightBoard extends via(
  BoardObject,
  ["name", "policy", "roles"] as const,
  (resolve) => ({}),
) {
  isPrivate() {
    return this.policy.includes("private");
  }

  canWrite(user?: { roles: string[] }) {
    return !!user && this.roles.some((role) => user.roles.includes(role));
  }
}

export class Board extends via(BoardObject, LightBoard, (resolve) => ({})) {
  static getBoard(boardList: LightBoard[], boardId: string) {
    return boardList.find((board) => board.id === boardId);
  }
}
```

### libs/shared/lib/banner/banner.constant.ts

```ts
export class BannerInput extends via((field) => ({
  category: field(String, { text: "tag" }).optional(),
  title: field(String, { text: "title" }).optional(),
  content: field(String, { text: "desc" }).optional(),
  image: field(File, { text: "thumb" }).optional(),
  href: field(String),
})) {}

export class BannerObject extends via(BannerInput, (field) => ({
  status: field(BannerStatus, { default: "active", text: "filter" }),
})) {}
```

### apps/koyo/lib/story/story.constant.ts

```ts
export class StoryInput extends via((field) => ({
  title: field(String, { text: "title" }),
  thumbnail: field(File, { text: "thumb", cascade: "removeRef" }).optional(),
  images: field([File], { cascade: "removeRef" }),
})) {}
```

### apps/koyo/lib/sessionChat/sessionChat.constant.ts

```ts
export class SessionChatInput extends via((field) => ({
  agentSession: field(ID, { ref: "agentSession", cascade: "removeWith" }),
  content: field(String, { default: "", text: "desc" }),
})) {}
```

### apps/koyo/lib/reaction/reaction.constant.ts

```ts
export class ReactionParent extends enumOf("reactionParent", [
  "icecreamOrder",
  "story",
] as const) {}

export class ReactionInput extends via((field) => ({
  parent: field(ID, { refPath: "parentType", cascade: "removeWith" }),
  parentType: field(ReactionParent, { default: "icecreamOrder" }),
  emoji: field(String, { default: "" }),
})) {}
```

### apps/koyo/lib/comment/comment.constant.ts

```ts
export class CommentInput extends via((field) => ({
  parent: field(ID, { refPath: "parentType", cascade: "removeWithAny" }),
  parentType: field(String),
  content: field(String, { default: "", text: "desc" }),
})) {}
```

### apps/koyo/lib/story/story.constant.ts

```ts
export class LightStory extends via(
  StoryObject,
  ["root", "user", "title", "totalStat", "status"] as const,
  (resolve) => ({
    view: resolve(Int),
    like: resolve(Int),
  }),
) {
  setLike() {
    if (this.like > 0) return false;
    this.totalStat.likes += 1;
    this.like = 1;
    return true;
  }
}
```

### apps/koyo/lib/story/story.signal.ts

```ts
export class StoryInternal extends internal(
  srv.story.with(srv.actionLog),
  ({ resolveField }) => ({
    like: resolveField(Int)
      .with(Self, { nullable: true })
      .exec(async function (story, self) {
        if (!self) return 0;
        return await this.actionLogService.countByTarget(
          "like",
          story.id,
          self.id,
        );
      }),
  }),
) {}
```

### apps/koyo/lib/user/user.constant.ts

```ts
import { via } from "akanjs/constant";
import { user } from "../__lib/lib.constant";

export class UserInput extends via((field) => ({}), ...user.inputs) {}

export class UserObject extends via(
  UserInput,
  (field) => ({
    favoriteFlavor: field(String, { default: "" }),
  }),
  ...user.objects,
) {}

export class LightUser extends via(
  UserObject,
  ["roles"] as const,
  (resolve) => ({}),
  ...user.lights,
) {}

export class User extends via(
  UserObject,
  LightUser,
  (resolve) => ({}),
  ...user.models,
) {}

export class UserInsight extends via(
  User,
  (field) => ({}),
  ...user.insights,
) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

