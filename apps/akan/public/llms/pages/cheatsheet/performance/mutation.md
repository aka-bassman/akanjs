# Mutating

- Source: /cheatsheet/performance/mutation
- Mirror: /llms/pages/cheatsheet/performance/mutation.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Mutating Data (#overview)
- Two Write Styles (#styles)
- Counters And Sets (#counters)
- Upsert (#upsert)
- How It Becomes SQL (#sql)
- Tips And Pitfalls (#tips)

## Content

Mutating

Document Path

Loads the document, changes it and saves it, so hooks run and a removal takes its cascade.

Query Write

Sends one atomic SQL statement and loads nothing. Fast and safe under races, but no hook runs.

Schema hooks, registered in `_onSchema`. They run whenever a document is saved or removed.

Service hooks. Only the service's `create<Model>`, `update<Model>` and `remove<Model>` run them.

A removal declared on a field: documents linked to the removed one go with it.

Schema hooks

Service hooks

Document path: load, change, save

Generated on the service. The default choice for one record.

Generated on the service. Soft-removes the document, then runs the cascade.

On the model: pick, set, save. `pickOneAndWrite(query, data)` picks by query.

The same thing, spelled out, when you already hold the document.

Query write: one SQL statement, nothing loaded

Change the newest match, or every match.

Soft-remove the newest match, or every match.

The same query writes, narrowed to one id.

Generated per filter, like `remove<Filter>`, `updateOne<Filter>` and `removeOne<Filter>`.

A list of `updateOne` operations, run one after another.

Object

You only assign values. A bare value means `set`.

Builder

You need `inc`, `addToSet` or another operator.

Plain values in the filter are copied in. Conditions such as `q.oneOf()` are not.

Operators apply to an empty value, so `total` starts at 1.

Written on this insert only. An update that finds a match ignores it.

result

`upsertedId` holds the new id, and `matchedCount` is 0.

plain value

Sets the field. The short form of `set`.

Sets the field.

Removes the field.

Adds `by`. A missing field counts as 0.

Multiplies by `by`. A missing field counts as 0.

Keeps the smaller of the stored value and `value`.

Keeps the larger of the stored value and `value`.

Appends to the array. A missing array starts empty.

Appends only when no equal element is there yet.

Removes every element equal to `value`.

Sets the field only when an upsert inserts a new row.

no SQL; applied only to the upsert insert

nested path

A dotted key writes inside an object field.

combined

Several operators nest into one expression.

`true` once the statement ran.

Rows the filter matched. 0 when an upsert inserted instead.

Rows the write changed, counting an upsert's insert.

The new row's id when an upsert inserted; otherwise `null` or absent.

Mutating Data

You need to bump a view counter, archive a batch of rows, or edit the one record a user opened. There are two ways to write, and the choice decides whether your hooks run.

Which one runs what

If a hook or a cascade must run for each document, take a document path. The table uses three words:

Term

Method

Runs

Does not run

A query write fires no hooks, and therefore no cascade.

Two Write Styles

Every query write takes a filter first, then the change. Write the change as a plain object or as a builder function:

Form

When

Example

In a model class, the two look like this:

Counters And Sets

Numeric and array operators run inside the database. Two requests that bump the same counter at once both count, and neither overwrites the other:

Upsert

When nothing matches, each part of the call ends up here:

Part of the call

In the new row

How It Becomes SQL

Operator

What it does · SQL

Tips And Pitfalls

What a write returns

Read next

Querying

Schema Hooks

Service Hooks

Cascade Remove

## Code Examples

### apps/myapp/lib/post/post.document.ts

```ts
export class PostModel extends into(Post, PostFilter, cnst.post, () => ({})) {
  async publish(postId: string) {
    const { modifiedCount } = await this.Post.updateOne(
      { id: postId },
      { status: "published", pinned: true },
    );
    return !!modifiedCount;
  }
  async markHot(postId: string) {
    const { modifiedCount } = await this.Post.updateOne(
      { id: postId },
      ({ inc, addToSet }) => ({ viewNum: inc(1), tags: addToSet("hot") }),
    );
    return !!modifiedCount;
  }
}
```

### apps/myapp/lib/post/post.document.ts

```ts
export class PostModel extends into(Post, PostFilter, cnst.post, () => ({})) {
  async addViewToPublished() {
    const { modifiedCount } = await this.Post.updateMany(
      { status: "published" },
      ({ inc }) => ({ viewNum: inc(1) }),
    );
    return modifiedCount;
  }
  async addTag(postId: string, tag: string) {
    const { modifiedCount } = await this.Post.updateOne(
      { id: postId },
      ({ addToSet }) => ({ tags: addToSet(tag) }),
    );
    return !!modifiedCount;
  }
  async subTag(postId: string, tag: string) {
    const { modifiedCount } = await this.Post.updateOne(
      { id: postId },
      ({ pull }) => ({ tags: pull(tag) }),
    );
    return !!modifiedCount;
  }
}
```

### apps/myapp/lib/stat/stat.document.ts

```ts
export class StatModel extends into(Stat, StatFilter, cnst.stat, () => ({})) {
  async addDailyVisit() {
    const { modifiedCount } = await this.Stat.updateOne(
      { key: "daily-visits" },
      ({ inc, setOnInsert }) => ({
        total: inc(1),
        status: setOnInsert("active"),
      }),
      { upsert: true },
    );
    return !!modifiedCount;
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

