# akanjs/constant

- Source: /references/akanjs/constant
- Mirror: /llms/pages/references/akanjs/constant.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/constant (#akanjs-constant)

## Content

akanjs/constant

Builds every Akan constant class. It is an overloaded function, not a namespace — there is no `via.model` or `via.scalar`. Which of its five forms you get is decided by the arguments: a lone builder callback is an input or a scalar, an input class plus a builder is the object, a model plus a builder is the insight, a model plus a field-name tuple plus a resolver is the Light class, and an object plus a Light class plus a resolver is the full model.

The builder handed to every `via` callback. It declares one stored property: the value type comes first, options come second, and `.optional()` makes the property nullable. An array field is the type in brackets, a relation is the other model's class, and an enum is an `enumOf` class.

Three narrowings of the same builder. `field.visual` stays an ordinary stored property and is stripped only where a value is masked for an AI caller, so it is about cost rather than secrecy. `field.hidden` and `field.secret` never leave the server: the response builder skips them and hydration writes `null` over the key, so the value reads `null` on the client behind a type that still promises a string. Guard it with `??` or `== null` — `=== undefined`, a destructuring default and an optional parameter default all sail past a present-but-null key.

A separate top-level builder, handed to the resolver callback of the Light and full `via` forms. It declares a derived field rather than a stored property: nothing is persisted, and the value is computed per response by a `resolveField` entry of the same name in the module's `*.signal.ts` Internal class, which receives the parent record as its argument. Declaring one without that entry throws when the field is first returned, which is why most modules leave both resolver callbacks returning an empty object.

Builds a default object from a field object, respecting primitive defaults, nullable fields, arrays, maps, and field-level default callbacks. Model classes expose the same result through `Model.getDefault()`.

Public type helpers used by documents, stores, and tests. `DocumentModel` maps relations to ids, `DefaultOf` describes default state, and `QueryOf` is used for query-shaped inputs.

Framework internals rather than authoring API. `crystalize` converts raw values into model-friendly values such as dayjs and nested constants, and `purify` converts class instances back into plain serializable objects for API and persistence boundaries.

Serialization helpers for document and transport boundaries. They convert constant model values, dates, enums, maps, arrays, and nested models between runtime values and persisted payloads.

Runtime registry for scalar/database constant metadata. Framework internals use it to resolve ref names, model classes, scalar metadata, enum metadata, and generated document model contracts.

`akanjs/constant` defines Akan's schema layer. Every `.constant.ts` file in a workspace is built from two of its exports — `via`, which declares a class, and the `field` builder `via` hands to it — and everything else on this page is support around those two.

A module declares five classes in a fixed order — Input, Object, Light, full, Insight — and writes the Insight class even when it is empty. The later entries here are type helpers and conversion internals you read rather than call.

Usage

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

