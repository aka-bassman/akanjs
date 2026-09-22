import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="module-abstract" title="model.abstract.md">
        <Docs.Title>model.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Open user.constant.ts and you can see that accountId and phone are secret strings. What you cannot see is that they may not repeat across active, dormant and restricted accounts — but may repeat once an account has left. No field, type or method says that, and the first person to write a uniqueness index without knowing it breaks sign-up for everyone who ever deleted an account.",
              ko: "user.constant.ts를 열면 accountId와 phone이 secret 문자열이라는 것은 보입니다. 보이지 않는 것은, 그 값들이 active·dormant·restricted 계정 사이에서는 겹칠 수 없지만 계정이 떠난 뒤에는 겹쳐도 된다는 사실입니다. 어떤 field도 type도 method도 그 말을 하지 않고, 그것을 모른 채 유일성 index를 먼저 적는 사람이 한 번이라도 계정을 지운 모든 사용자의 가입을 막게 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "That sentence is what the abstract is for. It holds the invariants the module obeys and cannot state, and it holds nothing the constant file already says. Four parts, and the last one is optional.",
              ko: "abstract는 그 문장을 위해 있습니다. module이 지키고 있지만 말하지 못하는 불변식을 담고, constant 파일이 이미 하는 말은 담지 않습니다. 네 부분이고 마지막 하나는 선택입니다.",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">📛</span>
              <div>
                <strong>{"# <model> Abstract"}</strong>:{" "}
                {l.trans({
                  en: "one title line carrying the module name as the folder spells it",
                  ko: "folder가 쓰는 그대로의 module 이름을 담은 제목 한 줄",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📝</span>
              <div>
                <strong>{l.trans({ en: "One declarative sentence", ko: "선언문 한 문장" })}</strong>:{" "}
                {l.trans({
                  en: "what this module owns, stated as fact, with no heading above it",
                  ko: "이 module이 무엇을 소유하는지를 사실로 적고, 위에 heading을 두지 않습니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📏</span>
              <div>
                <strong>## Rules</strong>:{" "}
                {l.trans({
                  en: "two to five bullets, each an invariant a reader could not derive from the code",
                  ko: "두 개에서 다섯 개의 항목. 각각 코드에서 유추할 수 없는 불변식입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">➡️</span>
              <div>
                <strong>{l.trans({ en: "A workflow", ko: "workflow" })}</strong>:{" "}
                {l.trans({
                  en: "optional. Six model abstracts here write it as a ## Workflow list; the shortest form is a bare arrow chain with no heading at all",
                  ko: "선택입니다. 이곳의 model abstract 여섯 개는 ## Workflow 목록으로 적고, 가장 짧은 형태는 heading 없는 화살표 한 줄입니다",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "Thirty-one of the thirty-three abstracts in this workspace are written this way. The two that are not have never been written at all — they are empty root containers still carrying the scaffold.",
              ko: "이 워크스페이스의 abstract 33개 중 31개가 이렇게 쓰여 있습니다. 그렇지 않은 둘은 애초에 쓰인 적이 없는 것들로, 스캐폴드를 그대로 들고 있는 빈 루트 컨테이너입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="worked-example" title={l.trans({ en: "A Real One", ko: "실물 하나" })}>
        <Docs.Title>{l.trans({ en: "A Real One", ko: "실물 하나" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "libs/shared/lib/user/user.abstract.md in full, for a module with a constant file, a document file, a service, a signal, a store and five components. Thirteen lines.",
              ko: "constant, document, service, signal, store와 component 다섯 개를 가진 module에 대한 libs/shared/lib/user/user.abstract.md 전문입니다. 열세 줄입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/user/user.abstract.md"
            language="markdown"
            code={`# user Abstract
사용자 가입, 인증, 프로필 심사, 상태 전이를 관리한다.

## Rules
- active/dormant/restricted 계정의 accountId와 phone은 중복될 수 없다.
- prepare 사용자는 인증 단계가 끝난 뒤 active로 전환된다.
- password, phone code, SSO, refresh session은 cache와 security service로 검증한다.
- 제한, 휴면, 탈퇴, 활성화는 summary 집계와 함께 움직인다.

## Workflow
- prepare user 생성 후 nickname/profile/auth 정보를 채우고 activate한다.
- 로그인은 access token과 refresh token session을 발급한다.
- 관리자는 역할, 제한, 계정 정보, 프로필 상태를 조정할 수 있다.`}
          />
          <div>
            {l.trans({
              en: "Read it against the code and notice what is missing. Not one bullet names a field type, a class or a method signature. Every one is either a constraint the database cannot express on its own or a coupling between this module and another — and the last one, that restriction and dormancy move together with the summary aggregate, is the kind of fact a reader would otherwise find by breaking it.",
              ko: "코드와 나란히 읽으면서 무엇이 없는지 보세요. field type, class, method 시그니처를 이름으로 부르는 항목이 하나도 없습니다. 전부 데이터베이스가 혼자서는 표현할 수 없는 제약이거나 이 module과 다른 module 사이의 결합입니다. 마지막 항목, 즉 제한과 휴면이 summary 집계와 함께 움직인다는 것은 적혀 있지 않으면 깨뜨려 보고서야 알게 되는 종류의 사실입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Korean is normal in an abstract and common here; English is normal too. What is never normal is a language split inside one file.",
              ko: "abstract를 한국어로 쓰는 것은 정상이고 이곳에서 흔합니다. 영어도 마찬가지로 정상입니다. 정상이 아닌 것은 파일 하나 안에서 언어가 갈리는 것입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scaffold" title={l.trans({ en: "Replace The Scaffold", ko: "스캐폴드는 대체한다" })}>
        <Docs.Title>{l.trans({ en: "Replace The Scaffold", ko: "스캐폴드는 대체한다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A new module arrives with six headings and no content. That file is a prompt rather than a template: the first real edit deletes five of the six.",
              ko: "새 module은 heading 여섯 개와 내용 없음으로 시작합니다. 그 파일은 template이 아니라 질문지입니다. 처음 제대로 손대는 순간 여섯 중 다섯이 사라집니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="pkgs/@akanjs/cli/templates/module/__model__.abstract.md"
            language="markdown"
            code={`# Module Abstract

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

- None yet. // [!code --]`}
          />
          <div>
            {l.trans({
              en: "Purpose becomes the one sentence under the title. Domain Rules becomes ## Rules. Workflows keeps its content and loses its plural. Data Meaning belongs next to the field it describes, as a trailing comment in constant.ts. Agent Notes and Related Modules say nothing this guide does not already say to every module, so they go and nothing replaces them.",
              ko: "Purpose는 제목 아래의 문장 하나가 됩니다. Domain Rules는 ## Rules가 됩니다. Workflows는 내용을 유지하고 복수형만 잃습니다. Data Meaning은 그것이 설명하는 field 옆, constant.ts의 꼬리 주석에 있어야 할 내용입니다. Agent Notes와 Related Modules는 이 가이드가 이미 모든 module에 하는 말을 반복할 뿐이므로, 지우고 아무것도 채우지 않습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">{l.trans({ en: "Keeping it:", ko: "유지하기:" })}</div>
            <DocsList>
              <li>
                {l.trans({
                  en: "Read it before changing constant, document, service, signal, store or a component in the same module.",
                  ko: "같은 module의 constant, document, service, signal, store, component를 수정하기 전에 먼저 읽습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Update it when a business invariant, a workflow, a permission, a state transition or public behavior changes.",
                  ko: "business invariant, workflow, permission, state transition, public behavior가 바뀌면 갱신합니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Do not update it for a formatting, import or style change. akan quality scan warns once an abstract passes 300 lines, and the way a file gets there is one restated field at a time.",
                  ko: "formatting, import, style만 바뀌는 변경에서는 갱신하지 않습니다. akan quality scan은 abstract가 300줄을 넘으면 경고하고, 그 지경에 이르는 길은 언제나 field를 하나씩 다시 적는 것입니다.",
                })}
              </li>
            </DocsList>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
