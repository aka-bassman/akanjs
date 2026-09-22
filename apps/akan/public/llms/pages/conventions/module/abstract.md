# model.abstract.md

- Source: /conventions/module/abstract
- Mirror: /llms/pages/conventions/module/abstract.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.abstract.md (#module-abstract)
- A Real One (#worked-example)
- Replace The Scaffold (#scaffold)

## Content

model.abstract.md

Open user.constant.ts and you can see that accountId and phone are secret strings. What you cannot see is that they may not repeat across active, dormant and restricted accounts — but may repeat once an account has left. No field, type or method says that, and the first person to write a uniqueness index without knowing it breaks sign-up for everyone who ever deleted an account.

That sentence is what the abstract is for. It holds the invariants the module obeys and cannot state, and it holds nothing the constant file already says. Four parts, and the last one is optional.

one title line carrying the module name as the folder spells it

One declarative sentence

what this module owns, stated as fact, with no heading above it

two to five bullets, each an invariant a reader could not derive from the code

A workflow

optional. Six model abstracts here write it as a ## Workflow list; the shortest form is a bare arrow chain with no heading at all

Thirty-one of the thirty-three abstracts in this workspace are written this way. The two that are not have never been written at all — they are empty root containers still carrying the scaffold.

A Real One

libs/shared/lib/user/user.abstract.md in full, for a module with a constant file, a document file, a service, a signal, a store and five components. Thirteen lines.

Read it against the code and notice what is missing. Not one bullet names a field type, a class or a method signature. Every one is either a constraint the database cannot express on its own or a coupling between this module and another — and the last one, that restriction and dormancy move together with the summary aggregate, is the kind of fact a reader would otherwise find by breaking it.

Korean is normal in an abstract and common here; English is normal too. What is never normal is a language split inside one file.

Replace The Scaffold

A new module arrives with six headings and no content. That file is a prompt rather than a template: the first real edit deletes five of the six.

Purpose becomes the one sentence under the title. Domain Rules becomes ## Rules. Workflows keeps its content and loses its plural. Data Meaning belongs next to the field it describes, as a trailing comment in constant.ts. Agent Notes and Related Modules say nothing this guide does not already say to every module, so they go and nothing replaces them.

Keeping it:

Read it before changing constant, document, service, signal, store or a component in the same module.

Update it when a business invariant, a workflow, a permission, a state transition or public behavior changes.

Do not update it for a formatting, import or style change. akan quality scan warns once an abstract passes 300 lines, and the way a file gets there is one restated field at a time.

## Code Examples

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

### pkgs/@akanjs/cli/templates/module/__model__.abstract.md

```markdown
# Module Abstract

## Purpose // [!code --]

Describe the business concept this module owns. // [!code --]

## Domain Rules // [!code --]

- Keep durable business invariants here.
- Avoid repeating field types that are already clear in the constant file. // [!code --]

## Data Meaning // [!code --]

Explain the meaning of important data only when the code does not make the intent obvious. // [!code --]

## Workflows // [!code --]

Describe create, update, approval, deletion, or state transition flows.

## Agent Notes // [!code --]

- Read this abstract before changing the module. // [!code --]
- Update this file when business invariants, workflows, or public behavior change. // [!code --]
- Do not update this file for formatting-only, import-only, or style-only changes. // [!code --]

## Related Modules // [!code --]

- None yet. // [!code --]
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

