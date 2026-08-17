---
"akanjs": minor
---

feat(dictionary): describe custom store actions with a `.store()` stage, and warn where the description is missing

A store is the surface an in-page agent drives — state through `st.use.*`, actions through `st.do.*` — but unlike
a signal it carries no description of what any of it does. A signal has builder metadata and a dictionary entry
per endpoint; a store has neither, and it cannot grow one in source: the conventions ban JSDoc, and every string
a person reads goes through `l()`. So the dictionary is the only legal channel, and it had no stage for stores.

`.store()` is that stage. It sits between `.endpoint()` and `.error()` and takes labels and `.desc()` only — no
`.arg()`, because a class's parameter names are not in its type the way an endpoint builder's are, and an action
mostly takes none anyway: its data comes from the form state the user already filled in.

```ts
.endpoint<UserEndpoint>((fn) => ({ … }))
.store<UserStore>((t) => ({
  signinWithPhoneCode: t(["Sign In", "로그인"])
    .desc(["Signs in with the phone code in the form", "폼에 입력된 인증번호로 로그인한다"]),
}))
.error({ … })
```

Entry keys are checked against the store class, which needs no marker to read: an action returns nothing —
`st.do.<action>()` is typed `void` — so the void-returning methods are exactly the actions, and `get` / `pick` /
`slice` fall out on their own. Labels resolve under their own `<model>.store.<action>` node rather than beside
`signal`, because a store action and the endpoint it wraps are named the same on purpose.

**The stage is optional, and the only one that is — omit it rather than writing it empty.** Most actions need no
entry: one named after the endpoint it calls already reads as that endpoint's `.desc()`, which is what the naming
rule (`st.do.X` reads like `fetch.X`) buys. One new warning names the rest:

- `akan.agent.missing-store-description` — a custom action that calls `fetch.*` under a *different* name and has
  neither its own `.store()` entry nor a same-named `.endpoint()` one.

Quiet by design on the three cases where a description would be noise: generated actions (their wording derives
from the model's labels), actions that call no `fetch.*` (they never leave the client), and actions named after
the endpoint they call. What is left is where inheriting would be actively wrong — nine `getSummaryListIn*`
actions calling one `summaryListInPeriod`, or `logout` over `signoutUser`, where the store name is the verb a
user would say and the endpoint name is the verb the API has.

New warning scope `agent`, alongside `ssr` and `mcp`.
