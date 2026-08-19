---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

feat(lint): ban `cnst` model types in `*.Util.tsx` / `*.Zone.tsx` props

`Util` and `Zone` are always client components, so a `cnst.Banner` / `cnst.LightBanner` prop is a hydrated class
instance the server has to hand across the boundary — the functions are stripped on the way and what arrives is a
plain object wearing the model's type. `no-model-type-in-util-zone.grit` reports it and points at the two shapes
that work: take `bannerId: string` and read the model from the store, or take the payload the framework already
serializes.

Two exemptions, because neither is an instance. `cnst.<Enum>["value"]` is an indexed access that resolves to a
string union, which is how every enum prop in the codebase is already written (`roles: cnst.AdminRole["value"][]`).
A `ClientInit` / `ClientView` / `ClientEdit` type argument is mapped through `GetStateObject<…>` before it reaches
a prop, which is the sanctioned server-to-client handoff. Any *other* indexed access is still reported —
`cnst.Banner["image"]` is a `File`.

The rule keys on the `cnst.` qualifier in a type position, so it never touches a value expression, and it is scoped
to those two filename suffixes: `Unit` and `View` are server components and keep taking the model itself.
