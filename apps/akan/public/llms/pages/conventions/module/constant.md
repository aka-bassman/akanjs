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
- Extending Generated Models (#generated-extension)
- Practical Rules (#practical-rules)

## Content

model.constant.ts

Fields accepted when creating or editing the model.

Input plus stored fields controlled by the system or service.

The small view a list, a relation and a card query return. Both sides hold this one, so shared logic belongs here.

Object and Light combined. Collection-level helpers go here as statics.

Aggregated counters for dashboards. Write the class even when it is empty.

A literal for a scalar, a thunk for anything constructed — () => dayjs() is evaluated per document, while a dayjs() written directly is one moment shared by every row ever created. An array default is copied per call rather than handed out by reference.

Names the model an ID field points at, for a reference stored as an id rather than declared as a relation.

Names an enumOf field holding the owner's model name, for a polymorphic reference. Required when cascade is removeWithAny, and the two are paired in the type so the widening cannot be declared apart from the direction it widens.

Joins the field to the full-text index. There is no separate index file and no per-model switch. A compile error on field.hidden, field.secret and resolve.

Which end of the relation goes away with the other. The two directions read identically on the same field shape, so the value names the direction — and getting it wrong is a data loss.

A stored property the page renders and an agent never sees. field.visual(T) is the short spelling of the same thing.

A sample value. It reaches the API explorer and the MCP input schema, which is where an agent reads it to guess the shape it should send.

A predicate run on write. A false verdict refuses the write; the value is skipped when it is null or undefined, so a validator never doubles as a required check.

Numeric bounds carried into the generated schema document.

String length bounds, the same way.

Marks the field write-once in the generated schema document and the API explorer. The sqlite-backed store does not refuse a later write, so read it as documentation rather than as a constraint.

On an Insight field only: which rows this counter counts. An empty object counts everything the query matched.

Required for a Map field — the class build throws without it, because a Map has no declared value type to infer.

A field preset, which is what the generated form control reads to pick its input type.

One file describes the shape of a business object, and everything downstream is derived from it: the storage schema, the generated CRUD, the form state, the API contract, the admin explorer, and the schema an AI agent reads before calling anything. Nothing else in the module restates those fields.

Five classes, always in this order, always all five — write the Insight class even when it is empty. Each builds a different view of the same object with via(), and the later files reuse those generated types by name.

Two as const markers are load-bearing. The one on the enumOf array is what turns the values into a union type instead of string[]; the one on the Light tuple is what tells via() which keys the light view actually has. Never use the TypeScript enum keyword — enumOf is the vocabulary, and its value union is reached as TicketStatus["value"].

Field Options

field(Type, options) takes one object, and what is not in it is as informative as what is. Optional is not an option — it is the chained .optional(), because it widens the declared type as well as the stored one. Nullable, select, enum and the field kind are all set for you by the call you made.

Give any field whose business meaning is not obvious a short trailing comment, the way due carries one above. That comment is the field's meaning and belongs beside it — not in the abstract, which holds invariants rather than a field list.

Hidden, Secret, Visual

Three entry points beside field(), and they answer two different questions. The first two are about secrecy: the value must not leave the server. The third is about cost: the value may leave, it just must not ride in an AI agent's context, where it would be hundreds of tokens per record that answer nothing.

Stored and read by the server, never serialized to a client. Nullable is forced on. For internal state such as an admin memo that the document carries but no screen shows.

The same, plus select: false — so the server's own read omits it too unless a projection names it. A password hash, a phone number, a token. pickById(id, { secret: true }) is the only way to read one back.

An ordinary stored property everywhere except an AI caller: stripped from every in-page-agent read, from every MCP result, and from the MCP readable schema so the two agree. Persistence, search, forms and the page response are untouched. A blur placeholder, a rendered HTML body, a serialized geometry.

A projection widens the server's read, never the response. If a screen needs the value, the field is neither hidden nor secret. If it only needs to be cheap for a model rather than unseen, that is field.visual — and nothing is ever refused over one.

The Instance And Its Logic

Display and predicate logic belongs on the Light class. It is the one both server and client hold, so a method written there is callable from a page, from a card, from a store action and from a service — and this is the rule most often missed in this codebase, which is how util modules full of ticketIsOverdue(ticket) get started.

Instance helpers sit on Light; anything about a collection of them is a static on the full model. A scalar under lib/__scalar/ follows the same split — Coordinate carries its distance and bounds maths as statics, because that arithmetic belongs to the value rather than to whoever stored it.

Text Search Fields

A field joins the full-text index by declaring a text role, and that declaration is the whole configuration. Pick the role by what the value is, because the roles are weighted differently when results are ranked.

The one line a human scans for. Weighted highest, by a wide margin.

A keyword list. Weighted above prose and below the title.

Prose. Weighted lowest of the roles that match at all.

A scoping value such as status, role or owner is filter: matchable but weighted zero, so it never outranks a real title hit. thumb is mirrored so a hit can be rendered and is never indexed — do not expect it to match.

A role works on a File reference and on an array field. An array of objects is indexed by leaf key, including a leaf that is itself an array. A field inside a Map is not indexed, because there is no fixed path to read it from.

A secret, hidden or resolved field carrying a text role is a compile error at the call site and throws while the class is being built as a backstop. The same refusal covers a role declared underneath one of them — field.secret(Noti) is rejected when Noti carries a role of its own, because the stored document holds that subtree in plaintext too. The search mirror stores plaintext, so indexing a secret would leak it through search. Treat the error as the rule working, not as something to route around.

Cascade Remove Fields

Both actions can sit on the same field shape, so the value never means related — it means one of exactly two directions, and swapping them is a data loss rather than a bug you notice.

Which end goes away

removeRef goes on the relation an owner holds, arrays included. Only a relation accepts it: a String, an ID or a scalar throws while the class is being built, because none of them names a document to remove.

removeWith goes on the child's own reference to its owner, so the owner never learns its children exist and a lib model can be extended by an app's. It takes a relation, an ID with ref, or an ID with refPath for a polymorphic owner — and that refPath must name an enumOf field, because a free-form owner type is unknowable at build time.

removeWithAny buys that sweep on purpose, for a child whose owner may be any model in the app. The lookup is one indexed probe, because the declaration creates the same reverse index — but one wildcard edge turns every cascade in the app back to one document at a time, and the boot log names the edges in one info line.

The removal runs through the target's service, so the target's own _postRemove runs with it — that is how a File cascade also deletes the stored object. When the target provably has no removal side effect, the boot-time plan collapses it into one query instead.

Nothing checks for other references to the same target. Declaring removeRef asserts that this field owns its target exclusively — and File in particular is deduped by origin, so two parents can share one row. Query-level removal fires no hooks and therefore no cascade.

Removal is soft — the row is stamped rather than deleted — but the storage delete a _postRemove performs is not. A cascade is not restorable, and reviving the owner does not revive what went with it.

Resolved Fields

Some values are not properties of the record, they are properties of the record and whoever is looking at it. Whether this user liked this story, how many times they read it, whether they may edit it — storing any of those on the document would mean storing one row per viewer.

A resolved field is declared in the constant with the resolve helper and computed per request by an internal signal. The constant names it and types it; the signal says how to work it out and what caller context it needs.

A resolved field takes no text role, for the same reason a secret one does not: there is no stored value for the search mirror to copy.

Extending Generated Models

An app that mounts a library model extends it rather than redeclaring it. Spread the library's inputs, objects, lights, models and insights into via() at the end of each call, and the app's own fields sit beside the inherited ones in the same class.

Practical Rules

Write all five layers in order, including an empty Insight class, and put as const on every enumOf array and every Light tuple.

Put display and predicate logic on Light<Model>, collection helpers as statics on the full model, and nothing in a util module.

Never use a non-null assertion. Narrow with ?., an early return, or a type predicate — and remember that a hidden or secret value is null rather than undefined.

Give any field whose business meaning is not obvious a short trailing comment, and nothing else a comment at all.

Import another module's constant from its direct file path rather than through a barrel, which is the sanctioned exception to the deep-import rule.

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
  due: field(Date, { default: () => dayjs().set("hour", 19) }), // the shop closes at 7pm
})) {}

export class LightTicket extends via(TicketObject, ["title", "status", "due"] as const, (resolve) => ({})) {}

export class Ticket extends via(TicketObject, LightTicket, (resolve) => ({})) {}

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
accountId: field.secret(String).optional(),
  password: field.secret(String).optional(),
  phone: field.secret(String).optional(),
  notiInfo: field.secret(NotiInfo),
  restrictInfo: field.secret(RestrictInfo).optional(),
```

### apps/koyo/lib/board/board.constant.ts

```ts
export class LightBoard extends via(BoardObject, ["name", "policy", "roles"] as const, (resolve) => ({})) {
  isPrivate() {
    return this.policy.includes("private");
  }

  canWrite(user?: { roles: string[] }) {
    return !!user && this.roles.some((role) => user.roles.includes(role));
  }
}
```

### apps/koyo/lib/board/board.constant.ts

```ts
export class Board extends via(BoardObject, LightBoard, (resolve) => ({})) {
  static getBoard(boardList: LightBoard[], boardId: string) {
    return boardList.find((board) => board.id === boardId);
  }
}
```

### libs/shared/lib/user/user.constant.ts

```ts
export class UserInput extends via((field) => ({
  nickname: field(String, { default: "", text: "title" }),
  bio: field(String, { default: "", text: "desc" }),
  playing: field([String], { text: "tag" }),
  image: field(File, { text: "thumb" }).optional(),
  status: field(UserStatus, { default: "prepare", text: "filter" }),
})) {}
```

### libs/shared/lib/user/user.constant.ts

```ts
export class UserInput extends via((field) => ({
  image: field(File, { text: "thumb", cascade: "removeRef" }).optional(),
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
export class ReactionInput extends via((field) => ({
  parent: field(ID, { refPath: "parentType", cascade: "removeWithAny" }),
  parentType: field(ParentType, { default: "icecreamOrder" }),
  emoji: field(String, { default: "" }),
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
export class StoryInternal extends internal(srv.story.with(srv.actionLog), ({ resolveField }) => ({
  like: resolveField(Int)
    .with(Self, { nullable: true })
    .exec(async function (story, self) {
      if (!self) return 0;
      return (await this.actionLogService.queryLoad({ action: "like", target: story.id, user: self.id }))?.value ?? 0;
    }),
})) {}
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

export class LightUser extends via(UserObject, ["roles"] as const, (resolve) => ({}), ...user.lights) {}

export class User extends via(UserObject, LightUser, (resolve) => ({}), ...user.models) {}

export class UserInsight extends via(User, (field) => ({}), ...user.insights) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

