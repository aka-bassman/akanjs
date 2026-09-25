# scalar.abstract.md

- Source: /conventions/scalar/abstract
- Mirror: /llms/pages/conventions/scalar/abstract.md
- Section: conventions
- Category: Scalar
- Priority: P1

## Headings

- scalar.abstract.md (#scalar-abstract)
- Writing The Rules (#rules)
- Fill In The Scaffold (#scaffold)

## Content

scalar.abstract.md

One title line with the scalar name spelled the way its folder spells it.

One sentence

What the value represents and, when it matters, who holds it, with no heading above.

Two to five bullets: a fixed value, a field order, a unit, a lifetime, what a static computes.

The rule says

Without it, a caller assumes

`type` is always `Point`.

That `type` is open and could hold another GeoJSON shape.

`coordinates` is longitude, then latitude.

The spoken order, with latitude first.

Distance is spherical, and the 3D form folds in the altitude difference.

A flat-plane distance, or one that ignores altitude.

Bounds, center and zoom need a list of coordinates.

That an empty list works, but `computeCenterAndZoomFromLocations` returns `null`.

Write

Leave out

What the type cannot carry

A unit

Kilometres rather than metres: `getDistanceKm` and `getDistanceM` differ only by unit.

An order

Longitude before latitude in `coordinate`.

A match by position

Each `fileMeta` lines up with the uploaded file at the same index.

A lifetime or a consumption rule

For a held value: an `oauthGrant` lives 60 seconds and is spent on first exchange, pass or fail.

What a static computes

Only when a caller could reasonably expect something else, such as a flat distance.

What the code already says

The field list

The constant file already lists every field.

The types

Each `field(...)` declaration already states its type.

That it is reusable

Every scalar is reusable, so saying so tells the reader nothing.

Scaffold

Becomes

Written for you from the folder name. Keep it.

Replaced by the value this scalar holds and what embeds it, stated as fact.

Stays. Both placeholder bullets become what a caller may assume about the value, two to five in all.

A field's meaning

Not here: a trailing comment beside the field in `price.constant.ts`.

Workflow

None: a value embedded in something else has no lifecycle of its own.

Update

Leave

When what callers rely on changes

Validation meaning

What counts as a valid value, such as the 1 to 5 satisfaction range in `leaveInfo`.

Public behavior

What callers can observe, such as what a static returns.

Reuse rules

How it combines with other scalars, as `accessLog` stores its location as a `coordinate`.

When only how the code looks changes

Formatting

Whitespace and line breaks the formatter decides.

Imports

Adding, removing or reordering imports.

Style

A code style change that alters no behavior.

What May Be Assumed

What The Constant File Shows

What Only The Abstract Says

Longitude comes first, the opposite of how almost everyone says a position out loud.

The Three Parts

A scalar abstract has three parts, and there is no fourth:

<one sentence: what this value represents, and who holds it>

<something a caller would otherwise get wrong>

<two to five bullets in all>

Part

Writing The Rules

A bullet belongs in Rules only if a caller would get something wrong without it. One real abstract shows what that looks like.

A Real Example

Four bullets, and each one is something a caller would otherwise get wrong:

What Earns A Bullet

Examples from the scalars in this repository, sorted by whether they belong in Rules:

Content

Do this

Not this

Fill In The Scaffold

What each line becomes:

Keeping It Current

Read it before changing the scalar, and update it only when something callers rely on changes:

Change

## Code Examples

### apps/koyo/lib/__scalar/price/price.abstract.md

```markdown
# price Abstract
${l.trans({ en: "<one sentence: what this value represents, and who holds it>", ko: "<이 값이 무엇을 나타내고 누가 들고 있는지 한 문장으로>" })}

## Rules
- ${l.trans({ en: "<something a caller would otherwise get wrong>", ko: "<적혀 있지 않으면 호출자가 틀릴 것>" })}
- ${l.trans({ en: "<two to five bullets in all>", ko: "<항목은 모두 두 개에서 다섯 개>" })}
```

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

### apps/koyo/lib/__scalar/price/price.abstract.md

```markdown
# price Abstract

<One sentence: the value this scalar holds, and what embeds it.>

## Rules

- <What a caller may assume about the value that the constant file cannot say: an order, a unit, a fixed value.>
- <Two to five of them. A single field's meaning goes in a trailing comment beside it in the constant file.>
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

