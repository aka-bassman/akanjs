---
"akanjs": patch
---

An upload control reaches an agent, the way a relation picker already does

`useFileFieldTool(onChange, { read, label, max, min })` is the counterpart to `useRelationFieldTool` for the other
half of *"a relation is picked or uploaded"*: the control hands the files it is holding and gets
`load<Field>OptionsOn<Model>` — the name the relation picker already publishes, so one spelling serves a form that
draws both — plus the field's own `set<Field>On<Model>`, with `add`/`sub` besides on an array field. Before this an
agent could see an attached picture and read the form, and had no way to put one in the other.

The array pair is not the convenience it is for a list of ids elsewhere. A picker's candidates are the whole
resolvable set, so rewriting the array is always expressible; an upload control's are what this conversation
brought, and a field that already holds older files cannot be rewritten without ids the guard has never heard of.
`max` / `min` are passed rather than derived, since `arrDepth` says a value is a list and not how long a legal one
is, and they reach the description as well as the guard — a cap an agent can only learn by tripping the server is
the round trip the listing tool exists to spare it. `read` omitted publishes nothing, so a shared control can
forward an optional tray without every call site growing a tool that refuses every id.
