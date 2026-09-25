# Schema Docs

- Source: /cheatsheet/dev/constants
- Mirror: /llms/pages/cheatsheet/dev/constants.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Constant Schema Docs (#overview)
- Generated Schema (#schema-doc)
- Printable Definition (#print-schema-doc)

## Content

Schema Docs

A model's name in code, such as `user` or `bizContract`. You pick models by it.

One of the five classes a model declares: Input, Object, Light, Full and Insight.

A value object stored inside another model, declared under `lib/__scalar/`.

A fixed list of allowed values, declared with `enumOf(...)`.

An explorer for the screen, with search, a table or diagram view and a tab per variant.

Everything expanded on one long page, ready to print or save as a PDF.

One model or scalar as a collapsible panel, picked by `refName`.

Every registered enum in one table, with its values and the fields that use it.

all

Database models to show, by `refName`, in the order you list them.

Scalar models to show, by `refName`.

Enums to show: the class name, first letter lowercased (`BizContractStatus` → `bizContractStatus`).

Opens every model and scalar panel. `Doc.Print` is always fully open and ignores it.

Part

What it does

Summary cards

Counts of database models, scalar models, enums and relations.

Search

Filters models and scalars by `refName`, and enums by name.

Switches between field tables and a graph of how models point at each other.

Shows one variant of a model at a time. `Full` opens first.

Opens one field's full settings as JSON, including `ref`, `example` and `meta`.

The field type. `!` marks a required field, and a model or scalar type is highlighted.

`property`, `hidden`, `secret` or `resolve`, with `select:false` and `immutable` badges.

The declared default. A function default reads `[function]`.

`min`, `max`, `minlength`, `maxlength`, the `text:` search role, `custom validate`, `accumulate`.

The allowed values when the field is an enum.

Browsing on screen

Relation diagram

Variant tabs

One variant at a time.

Collapsible panels

`openAll` opens them all.

Field detail modal

Printing

All five variants at once

Printed one after another per model.

Field details in the table

`ref`, `refPath`, `example` and `meta` inline, in place of the modal.

Enum value labels

Written in a column. `Doc.Zone` shows them only on hover.

Page breaks

Each database model gets its own page, and scalars and enums start on a new one.

Print colors

Switches to black text on white when printed, even from dark mode.

Constant Schema Docs

Words used on this page

Term

The parts

Component

Put it on a page

Give each one a route of its own.

First, the client component:

Then a route renders the component, and the route stays a server page:

Generated Schema

What is on screen

Reading a field row

Column

What it shows

Live on this site

Printable Definition

Feature

has it

does not

To keep a copy as a PDF:

## Code Examples

### apps/myapp/ui/SchemaDocs.tsx

```ts
"use client";

import "@apps/myapp/lib/cnst";

import { Constant } from "akanjs/ui";

export const SchemaDocs = () => {
  return <Constant.Doc.Zone models={["user", "bizContract"]} openAll />;
};

export const PrintableSchemaDocs = () => {
  return <Constant.Doc.Print models={["user", "bizContract"]} />;
};
```

### apps/myapp/page/(admin)/schema/_index.tsx

```ts
import { SchemaDocs } from "@apps/myapp/ui";
import { page } from "akanjs/client";

export default page().render(() => <SchemaDocs />);
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

