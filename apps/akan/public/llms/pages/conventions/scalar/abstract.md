# scalar.abstract.md

- Source: /conventions/scalar/abstract
- Mirror: /llms/pages/conventions/scalar/abstract.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.abstract.md (#scalar-abstract)
- Replace The Scaffold (#scaffold)

## Content

scalar.abstract.md

A scalar is a value somebody else stores, so the question it has to answer is not what it is but what may be assumed about it. Coordinate holds two numbers in an array — and the order is longitude first, which is the opposite of how almost everybody says it out loud.

Three parts, and there is no fourth. Seventeen scalar abstracts in this workspace are written this way and not one of them has a workflow section — a value object embedded in something else has no lifecycle of its own to describe.

one title line carrying the scalar name as the folder spells it

One declarative sentence

what this value represents and, when it matters, who holds it

two to five bullets — a fixed value, a field order, a unit, a lifetime, the arithmetic a static implements

Four bullets, and every one of them is a thing a caller would otherwise get wrong. The type field is pinned rather than open. The array order is the GeoJSON order and not the spoken one. The distance is spherical rather than planar, and the three-dimensional form adds altitude. The map helpers need a list and answer nothing for an empty one.

Replace The Scaffold

A new scalar arrives with six headings and no content. It is a prompt rather than a template, and for a scalar the first real edit deletes all six — the title line and one sentence replace them.

Purpose becomes the sentence under the title. Domain Rules becomes ## Rules. Data Meaning belongs next to the field it describes, as a trailing comment in the constant file. Workflows, Agent Notes and Related Modules go, and nothing replaces them.

What earns a bullet here:

A unit or an order the type cannot carry — kilometres rather than metres, longitude before latitude, an array whose positions correspond to another array's.

A lifetime or a consumption rule, when the value is held rather than merely stored — a code that lives sixty seconds and is consumed on first exchange whether or not that exchange succeeds.

What a static on the class actually computes, when a caller could reasonably expect something else.

Never the field list, never the types, and never a note that the scalar is reusable — every scalar is.

Read it before changing validation meaning or public behavior, and update it when one of those changes. Do not touch it for a formatting, import or style change — akan quality scan warns once an abstract passes 300 lines, and the longest scalar abstract in this workspace is twelve.

## Code Examples

### libs/util/lib/__scalar/coordinate/coordinate.abstract.md

```markdown
# coordinate Abstract
GeoJSON Point 좌표와 고도를 표현하고 거리/방위 계산을 제공한다.

## Rules
- type은 `Point`로 고정된다.
- coordinates는 longitude, latitude 순서를 따른다.
- 거리 계산은 지구 반지름 기반 구면 거리이며 3D 계산은 altitude 차이를 더한다.
- 지도 표시용 bounds, center, zoom 계산은 좌표 목록이 있을 때만 가능하다.
```

### pkgs/@akanjs/cli/templates/__scalar/__model__/__model__.abstract.md

```markdown
# Scalar Abstract

## Purpose // [!code --]

Describe the embedded value object or reusable data concept this scalar owns. // [!code --]

## Domain Rules // [!code --]

- Keep durable validation and meaning rules here.
- Avoid repeating field types that are already clear in the constant file. // [!code --]

## Data Meaning // [!code --]

Explain the meaning of the scalar fields and when this scalar should be used. // [!code --]

## Workflows // [!code --]

Describe lifecycle or normalization behavior when relevant. // [!code --]

## Agent Notes // [!code --]

- Read this abstract before changing the scalar. // [!code --]
- Update this file when validation meaning, public behavior, or reuse rules change. // [!code --]
- Do not update this file for formatting-only, import-only, or style-only changes. // [!code --]

## Related Modules // [!code --]

- None yet. // [!code --]
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

