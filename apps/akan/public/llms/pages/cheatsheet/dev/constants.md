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

Constant Schema Docs

Akan can render schema definition tables and model relationship diagrams directly from ConstantRegistry.

Each one then gets a route of its own, and the route stays a server page:

Generated Schema

Printable Definition

`Constant.Doc.Print` renders every selected variant and field inline, without tabs, collapse panels, modals, or diagram interactions.

## Code Examples

### apps/myapp/ui/SchemaDocs.tsx

```ts
"use client";

import "@apps/myapp/lib/cnst";

import { Constant } from "akanjs/ui";

export const SchemaDocs = () => <Constant.Doc.Zone models={["user", "bizContract"]} openAll />;

export const PrintableSchemaDocs = () => <Constant.Doc.Print models={["user", "bizContract"]} />;
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

