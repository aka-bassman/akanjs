# model.abstract.md

- Source: /conventions/module/abstract
- Mirror: /llms/pages/conventions/module/abstract.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.abstract.md (#module-abstract)
- A Real Example (#worked-example)
- Replace The Scaffold (#scaffold)

## Content

model.abstract.md

One title line with the module name spelled as in its file name.

One sentence

What the module owns, stated as fact, right under the title with no heading.

Two to five bullets, each an invariant a reader could not derive from the code.

Optional: a list under this heading, or one arrow chain with no heading at all.

Scaffold

Becomes

Written for you, spelled as in the file name. Keep it.

Rewritten as what the module owns, stated as fact.

Stays, and grows to the module's real invariants, two to five in all.

Mirrors the scaffolded slice guards; rewrite it whenever you change them.

Stays: removal of a model is always soft.

Not written by the scaffold; add it, or one arrow chain, once the module has a flow.

Update

Leave

When the module's meaning changes

A business invariant

A rule that must always hold, such as the uniqueness rule above.

A workflow or state transition

How a record moves, such as from `prepare` to `active`.

A permission

Who may do what, such as an admin adjusting a restriction.

Public behavior

What callers of the module can observe.

When only how the code looks changes

Formatting

Whitespace and line breaks the formatter decides.

Imports

Adding, removing or reordering imports.

Style

A code style change that alters no behavior.

What The Code Cannot Say

What The Constant File Shows

What Only The Abstract Says

Neither may repeat across active, dormant and restricted accounts, but both may repeat once an account has left.

The Four Parts

Every abstract has four parts, and only the last is optional:

<one sentence: what this module owns>

<an invariant the code cannot show>

<two to five bullets in all>

<optional: how a ticket moves from state to state>

Part

A Real Example

Read it next to the code and notice what is and is not there:

Replace The Scaffold

Where each line goes:

Keeping It Current

Read it before changing the constant, document, service, signal, store or any component of the same module. Update it only when what the module means changes:

Change

Do this

Not this

## Code Examples

### apps/koyo/lib/ticket/ticket.abstract.md

```markdown
# ticket Abstract
${l.trans({ en: "<one sentence: what this module owns>", ko: "<이 모듈이 맡는 일을 한 문장으로>" })}

## Rules
- ${l.trans({ en: "<an invariant the code cannot show>", ko: "<코드로는 보이지 않는 불변식>" })}
- ${l.trans({ en: "<two to five bullets in all>", ko: "<항목은 모두 두 개에서 다섯 개>" })}

## Workflow
- ${l.trans({ en: "<optional: how a ticket moves from state to state>", ko: "<선택: ticket이 어떤 상태를 거쳐 움직이는지>" })}
```

### libs/shared/lib/user/user.abstract.md

```markdown
# user Abstract
사용자 가입, 인증, 프로필 심사, 상태 전이를 관리한다.

## Rules
- active/dormant/restricted 계정의 accountId와 phone은 중복될 수 없다.
- prepare 사용자는 인증 단계가 끝난 뒤 active로 전환된다.
- password, phone code, SSO, refresh session은 cache와 security service로 검증한다.
- 제한, 휴면, 탈퇴, 활성화는 summary 집계와 함께 움직인다.

## Workflow
- prepare user 생성 후 nickname/profile/auth 정보를 채우고 activate한다.
- 로그인은 access token과 refresh token session을 발급한다.
- 관리자는 역할, 제한, 계정 정보, 프로필 상태를 조정할 수 있다.
```

### apps/koyo/lib/project/project.abstract.md

```markdown
# project Abstract
Project represents a project workspace or business initiative managed by the app.

## Rules
- Anyone may read a project; only an admin creates, updates or removes one.
- Removal is soft: a removed project keeps its row with `removedAt` set.
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

