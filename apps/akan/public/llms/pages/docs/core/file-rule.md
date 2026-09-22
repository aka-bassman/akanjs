# File Rule

- Source: /docs/core/file-rule
- Mirror: /llms/pages/docs/core/file-rule.md
- Section: docs
- Category: Core Concepts
- Priority: P0

## Headings

- File Rule (#file-rule)
- Module Files (#module-files)
- Naming Rule (#naming-rule)
- Facet Files And Barrels (#facet-files)
- Module Differences (#module-differences)
- Codegen And Choices (#workflow)

## Content

File Rule

Folder names tell Akan what business area a file belongs to. File names tell Akan what role the file plays inside that business area. For example, product.document.ts describes stored product data, while Product.View.tsx describes how product data is shown on screen.

Think of a module as a small business department. A product module may know what fields a product has, how to save it, how users request it, and how it is shown in the admin screen. Each file handles one of those jobs.

Business meaning

A file suffix explains what kind of work the file does for the model.

Scanner friendly

Akan scans these suffixes and connects models, services, signals, and UI pieces.

Start small

You do not need every file. Add files only when the business feature needs them.

You can start with only one or two files. For example, a simple read-only catalog may only need product.document.ts and Product.View.tsx at first.

Module Files

These files describe the data, server logic, API surface, and state around a business model. If you are building products, orders, users, invoices, or reservations, these are the files you will touch most often.

The abstract file is not only for LLMs. It keeps domain knowledge beside the code, so people and agents can understand business invariants before changing implementation files.

The five UI suffixes are not five sizes of component either. Each one answers a different question: how the user edits one record, how one record looks in a list, how one record looks on its own page, how a page section is assembled, and what extra action the model offers. The first column of each row is which side of the client boundary the file lives on:

File

The client boundary follows the suffix, not your judgment. Template, Zone, and Util always carry "use client" on line 1; Unit and View never do, so they render on the server and ship no JavaScript.

Naming Rule

Akan file names use two patterns. Business core files use the model name in lower camel case. UI files use the model name in PascalCase.

This makes a module easy to scan with your eyes. When you open lib/product/, every product.* file is business logic and every Product.* file is UI. You can immediately tell where to add a new query, screen component, or server action.

Business files

UI files

Do not declare arbitrary files inside a module folder outside these rules. For example, product.helper.ts or ProductComponents.tsx should be moved into the closest allowed role such as product.service.ts, Product.Util.tsx, or Product.Unit.tsx.

The suffix is not just style. Akan scans these suffixes to understand what files exist in each module.

Facet Files And Barrels

Files under ui/ and webkit/ are usually exported through barrel files such as @apps/myapp/ui or @libs/shared/webkit. To keep imports predictable and easy to optimize, prefer one main export per file and make the file name match the export name.

This convention is especially helpful when a business grows. A storefront, admin app, and partner app can all import the same ProductCard without knowing where the implementation lives.

✅ Recommended

❌ Avoid

Use this for reusable visual components. Example: ProductCard.tsx should export ProductCard.

Use this for browser/client hooks and helpers. Example: usePaymentStatus.tsx should export usePaymentStatus.

A barrel file re-exports many files from one entry point. Akan can analyze configured barrel imports and rewrite imports to the exact source file, so importing from @apps/myapp/ui can stay convenient without always pulling the entire barrel into the bundle.

In day-to-day product work, this means your page can import by business name instead of deep file path. You write a clean import, and Akan keeps the build focused on the exact files that are used.

This is why one file, one main export is recommended. It helps the barrel analyzer map ProductCard to ui/ProductCard.tsx clearly.

Module Differences

Not every folder type uses every file type. Database modules can have the full set. Service modules focus on behavior. Scalar modules focus on reusable value definitions.

Choose the file set by the business role of the folder. product is a thing you store, so it can have document and store files. _payment is something you do, so it usually focuses on service and signal files. money is a reusable value shape, so it stays small and definition-oriented.

A file the column marks with a dash is not merely unusual there — akan sync refuses it by name, so a Product.View.tsx placed in lib/__scalar/money/ fails the scan rather than being quietly ignored. The abstract file is the one whose name changes: a service module drops the folder's underscore, so lib/_payment/ holds payment.abstract.md.

Codegen And Choices

Akan scans module files and generates helper indexes around them. This lets application code import model features through stable module exports instead of manually wiring every file.

For a product team, this removes repeated wiring work. When a module grows from a document into views, units, and zones, Akan can keep the module entry organized as long as the file names follow the convention.

This is why naming matters. If Product.View.tsx is renamed randomly, Akan cannot recognize it as the View file for the Product module.

Common Choices

When you are not sure which file to create, start from the business question you are trying to answer.

For example, 'Can the customer see the order?' points to View. 'Can the customer cancel the order?' points to signal and service. 'What fields does an order save?' points to document.

Question

## Code Examples

### lib/product/

```bash
lib/product/
├── product.abstract.md
├── product.constant.ts
├── product.dictionary.ts
├── product.document.ts
├── product.service.ts
├── product.signal.ts
├── product.store.ts
├── Product.Template.tsx
├── Product.Unit.tsx
├── Product.Util.tsx
├── Product.View.tsx
└── Product.Zone.tsx
```

### Code

```bash
product.abstract.md
product.constant.ts
product.dictionary.ts
product.document.ts
product.service.ts
product.signal.ts
product.store.ts
```

### Code

```bash
Product.Template.tsx
Product.Unit.tsx
Product.Util.tsx
Product.View.tsx
Product.Zone.tsx
```

### Code

```ts
// ui/ProductCard.tsx
export const ProductCard = () => {
  return <div>Product</div>;
}

// webkit/usePaymentStatus.tsx
export const usePaymentStatus() {
  return { status: "ready" };
}
```

### Code

```ts
// ui/components.tsx
export const ProductCard = () => {}
export const OrderBadge = () => {}
export const PriceText = () => {}

// hard to know which import belongs to which file
```

### barrel import

```ts
// ui/index.ts
export * from "./ProductCard";
export * from "./OrderBadge";

// page/store/products.tsx
import { ProductCard } from "@apps/myapp/ui";
```

### Generated UI index idea

```ts
import * as Unit from "./Product.Unit";
import * as Util from "./Product.Util";
import * as View from "./Product.View";
import * as Zone from "./Product.Zone";

export const Product = { Unit, Util, View, Zone };
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

