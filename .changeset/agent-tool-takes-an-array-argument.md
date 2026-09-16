---
"akanjs": patch
---

`st.tool` describes one array level of a scalar or an enum

`.arg("bodies", [String])` and `.opt("modes", [TaskStatus])` publish `{ type: "array", items }` and check every
element, with `oneOf` narrowing the elements rather than the list. It is the schema `fill<Model>Form` already
built for an array field, so the same shape reaching an agent through a form and not through a component tool was
an oversight — a tool that could not say "a list of these" taught the format in prose, and the app then owned a
parser for it.
