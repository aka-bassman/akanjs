---
"@akanjs/devkit": patch
---

fix(lint): `non-scalar-props-restricted` covers `*.Unit.tsx` and `*.View.tsx`

The guide has always said a server component may not hand a function prop across the client boundary in a page, a
Unit or a View, but the rule was scoped to `page/**` only. Units and Views are always server components, so a
function prop there fails at the boundary at runtime; lint now says so first.
