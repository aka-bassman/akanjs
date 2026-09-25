import { usePage } from "@apps/akan/client";
import {
  Code,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type MatrixGroup,
  panelRecipe,
  type TableColumn,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const cardTitle = "font-semibold text-primary";
  const cardBody = "mt-1 text-foreground/70 text-sm";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const partRows: IntroItem[] = [
    {
      name: "# <model> Abstract",
      desc: l.trans({
        en: "One title line with the module name spelled as in its file name.",
        ko: "파일 이름에 쓴 그대로의 모듈 이름을 담은 제목 한 줄입니다.",
      }),
      example: "# user Abstract",
    },
    {
      name: <span className="font-sans">{l.trans({ en: "One sentence", ko: "한 문장" })}</span>,
      desc: l.trans({
        en: "What the module owns, stated as fact, right under the title with no heading.",
        ko: "모듈이 맡는 일을 제목 바로 아래에 소제목 없이 사실로 적습니다.",
      }),
    },
    {
      name: "## Rules",
      desc: l.trans({
        en: "Two to five bullets, each an invariant a reader could not derive from the code.",
        ko: "두 개에서 다섯 개의 항목으로, 각각 코드에서 유추할 수 없는 불변식입니다.",
      }),
    },
    {
      name: "## Workflow",
      desc: l.trans({
        en: "Optional: a list under this heading, or one arrow chain with no heading at all.",
        ko: "선택 사항이며, 이 소제목 아래 목록이나 소제목 없는 화살표 한 줄로 적습니다.",
      }),
      example: "authorize -> pending -> approved | denied -> code -> token -> refresh -> revoked",
    },
  ];

  const scaffoldColumns: TableColumn[] = [
    { key: "heading", label: l.trans({ en: "Scaffold", ko: "스캐폴드" }), code: true },
    { key: "becomes", label: l.trans({ en: "Becomes", ko: "바뀌는 모습" }) },
  ];

  const scaffoldRows = [
    {
      heading: "# project Abstract",
      becomes: l.trans({
        en: "Written for you, spelled as in the file name. Keep it.",
        ko: "파일 이름 그대로 미리 적혀 있습니다. 그대로 둡니다.",
      }),
    },
    {
      heading: "Project represents …",
      becomes: l.trans({
        en: "Rewritten as what the module owns, stated as fact.",
        ko: "모듈이 맡는 일을 사실로 적은 문장으로 고쳐 씁니다.",
      }),
    },
    {
      heading: "## Rules",
      becomes: l.trans({
        en: "Stays, and grows to the module's real invariants, two to five in all.",
        ko: "그대로 두고, 모듈의 실제 불변식으로 채워 모두 두 개에서 다섯 개가 되게 합니다.",
      }),
    },
    {
      heading: "- Anyone may read a project; …",
      becomes: l.trans({
        en: "Mirrors the scaffolded slice guards; rewrite it whenever you change them.",
        ko: "스캐폴드 슬라이스의 가드를 옮긴 문장이므로, 가드를 바꿀 때마다 함께 고칩니다.",
      }),
    },
    {
      heading: "- Removal is soft: …",
      becomes: l.trans({
        en: "Stays: removal of a model is always soft.",
        ko: "그대로 둡니다. 모델 삭제는 언제나 soft delete입니다.",
      }),
    },
    {
      heading: "## Workflow",
      becomes: l.trans({
        en: "Not written by the scaffold; add it, or one arrow chain, once the module has a flow.",
        ko: "스캐폴드에는 없습니다. 모듈에 흐름이 생기면 이 소제목이나 화살표 한 줄로 더합니다.",
      }),
    },
  ];

  const keepColumns = [
    { key: "update", label: l.trans({ en: "Update", ko: "갱신" }) },
    { key: "leave", label: l.trans({ en: "Leave", ko: "그대로" }) },
  ];
  const update = { update: true };
  const leave = { leave: true };

  const keepGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "When the module's meaning changes", ko: "모듈의 의미가 바뀔 때" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "A business invariant", ko: "비즈니스 불변식" })}</span>,
          desc: l.trans({
            en: "A rule that must always hold, such as the uniqueness rule above.",
            ko: "위의 유일성 규칙처럼 항상 참이어야 하는 규칙입니다.",
          }),
          marks: update,
        },
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "A workflow or state transition", ko: "workflow나 상태 전이" })}
            </span>
          ),
          desc: l.trans({
            en: "How a record moves, such as from `prepare` to `active`.",
            ko: "`prepare`에서 `active`로 가는 것처럼 레코드가 움직이는 방식입니다.",
          }),
          marks: update,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "A permission", ko: "권한" })}</span>,
          desc: l.trans({
            en: "Who may do what, such as an admin adjusting a restriction.",
            ko: "관리자가 제한을 조정하는 것처럼 누가 무엇을 할 수 있는지입니다.",
          }),
          marks: update,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Public behavior", ko: "공개 동작" })}</span>,
          desc: l.trans({
            en: "What callers of the module can observe.",
            ko: "모듈을 쓰는 쪽에서 관찰할 수 있는 동작입니다.",
          }),
          marks: update,
        },
      ],
    },
    {
      label: l.trans({ en: "When only how the code looks changes", ko: "코드 모양만 바뀔 때" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Formatting", ko: "포맷팅" })}</span>,
          desc: l.trans({
            en: "Whitespace and line breaks the formatter decides.",
            ko: "포매터가 정하는 공백과 줄바꿈입니다.",
          }),
          marks: leave,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Imports", ko: "import" })}</span>,
          desc: l.trans({
            en: "Adding, removing or reordering imports.",
            ko: "import를 추가하거나 지우거나 정렬하는 일입니다.",
          }),
          marks: leave,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Style", ko: "스타일" })}</span>,
          desc: l.trans({
            en: "A code style change that alters no behavior.",
            ko: "동작을 바꾸지 않는 코드 스타일 변경입니다.",
          }),
          marks: leave,
        },
      ],
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="module-abstract" title="model.abstract.md">
        <Docs.Title>model.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Every database module keeps one <code>{"lib/<model>/<model>.abstract.md"}</code>: a few lines of
                  markdown stating the rules the module obeys but its code cannot say. Read it before changing the
                  module, and update it when one of those rules changes.
                </span>
              ),
              ko: (
                <span>
                  database 모듈은 모두 <code>{"lib/<model>/<model>.abstract.md"}</code> 파일을 하나 둡니다. 모듈이
                  지키고 있지만 코드로는 드러나지 않는 규칙을 몇 줄의 markdown으로 적는 곳입니다. 모듈을 고치기 전에
                  읽고, 그 규칙이 바뀌면 함께 고칩니다.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "What The Code Cannot Say", ko: "코드가 말하지 못하는 것" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Take the <code>user</code> module in <code>libs/shared</code>. Its constant file and its abstract say
                  different things about the same two fields.
                </span>
              ),
              ko: (
                <span>
                  <code>libs/shared</code>의 <code>user</code> 모듈을 보면, constant 파일과 abstract가 같은 두 필드에
                  대해 서로 다른 것을 말합니다.
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className={cardTitle}>
                {l.trans({ en: "What The Constant File Shows", ko: "constant 파일이 보여 주는 것" })}
              </div>
              <div className={cardBody}>
                {l.trans({
                  en: (
                    <span>
                      <code>accountId</code> and <code>phone</code> are secret, optional strings.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>accountId</code>와 <code>phone</code>은 secret이고, 없어도 되는 문자열입니다.
                    </span>
                  ),
                })}
              </div>
              <code className={chip}>accountId: field.secret(String).optional()</code>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className={cardTitle}>
                {l.trans({ en: "What Only The Abstract Says", ko: "abstract만 말하는 것" })}
              </div>
              <div className={cardBody}>
                {l.trans({
                  en: "Neither may repeat across active, dormant and restricted accounts, but both may repeat once an account has left.",
                  ko: "두 값은 active·dormant·restricted 계정끼리는 겹칠 수 없지만, 탈퇴한 계정과는 겹쳐도 됩니다.",
                })}
              </div>
            </div>
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Nothing else states it.</strong> No field or type says it, and <code>user.document.ts</code>{" "}
                    repeats the check in several methods without ever naming it as a rule.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>다른 곳에는 적혀 있지 않습니다.</strong> 필드와 type 어디에도 없고,{" "}
                    <code>user.document.ts</code>는 여러 메서드에서 같은 검사를 되풀이할 뿐 규칙으로 밝히지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Missing it breaks sign-up.</strong> A uniqueness index added without knowing the rule stops
                    everyone who ever deleted an account from signing up again.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>모르면 가입이 깨집니다.</strong> 이 규칙을 모른 채 유일성 인덱스를 추가하면, 계정을 한
                    번이라도 지운 사용자는 누구도 다시 가입하지 못합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>That is the abstract's job.</strong> It holds the invariants the module obeys but cannot
                    state (rules that must always hold), and nothing the constant file already says.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>abstract가 하는 일이 바로 이것입니다.</strong> 모듈이 지키지만 코드로 말하지 못하는 불변식,
                    즉 항상 참이어야 하는 규칙을 담고, constant 파일이 이미 하는 말은 담지 않습니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "The Four Parts", ko: "네 부분" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Every abstract has four parts, and only the last is optional:",
              ko: "abstract는 네 부분으로 되어 있고, 마지막 부분만 선택입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/ticket/ticket.abstract.md"
            language="markdown"
            code={`# ticket Abstract
${l.trans({ en: "<one sentence: what this module owns>", ko: "<이 모듈이 맡는 일을 한 문장으로>" })}

## Rules
- ${l.trans({ en: "<an invariant the code cannot show>", ko: "<코드로는 보이지 않는 불변식>" })}
- ${l.trans({ en: "<two to five bullets in all>", ko: "<항목은 모두 두 개에서 다섯 개>" })}

## Workflow
- ${l.trans({ en: "<optional: how a ticket moves from state to state>", ko: "<선택: ticket이 어떤 상태를 거쳐 움직이는지>" })}`}
          />
          <Docs.IntroTable type={l.trans({ en: "Part", ko: "부분" })} items={partRows} />
          <div>
            {l.trans({
              en: (
                <span>
                  In the Akan.js repository, 31 of the 33 abstracts are written with these parts, and six carry a{" "}
                  <code>## Workflow</code> list. The other two belong to the app root services <code>_akan</code> and{" "}
                  <code>_minimal</code>, which still hold the generated scaffold unedited.
                </span>
              ),
              ko: (
                <span>
                  Akan.js 저장소의 abstract 33개 중 31개가 이 구성으로 쓰여 있고, 그중 여섯 개에{" "}
                  <code>## Workflow</code> 목록이 있습니다. 나머지 둘은 app 루트 service인 <code>_akan</code>과{" "}
                  <code>_minimal</code>의 것으로, 자동 생성된 초안을 손대지 않은 채 들고 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="worked-example" title={l.trans({ en: "A Real Example", ko: "실제 예시" })}>
        <Docs.Title>{l.trans({ en: "A Real Example", ko: "실제 예시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The whole of <code>libs/shared/lib/user/user.abstract.md</code> is thirteen lines, for a module with
                  constant, document, service, signal and store files and five components:
                </span>
              ),
              ko: (
                <span>
                  <code>libs/shared/lib/user/user.abstract.md</code>의 전문입니다. constant, document, service, signal,
                  store 파일과 컴포넌트 다섯 개를 가진 모듈이지만 abstract는 열세 줄입니다:
                </span>
              ),
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
              en: "Read it next to the code and notice what is and is not there:",
              ko: "코드와 나란히 읽으면서 무엇이 있고 무엇이 없는지 보세요:",
            })}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No types.</strong> Not one bullet names a field type, a class or a method signature.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>type이 없습니다.</strong> 필드 type, 클래스, 메서드 시그니처를 부르는 항목이 하나도
                    없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Only constraints and couplings.</strong> Each rule is a constraint the database cannot
                    express on its own, or a coupling between this module and another.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>제약과 결합만 있습니다.</strong> 모든 규칙이 데이터베이스 혼자서는 표현할 수 없는
                    제약이거나, 이 모듈과 다른 모듈 사이의 결합입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The last rule is one you would otherwise learn by breaking it.</strong> Restriction,
                    dormancy, leaving and activation all move together with the <code>summary</code> aggregate.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>마지막 규칙은 적혀 있지 않으면 깨뜨려 보고서야 알게 됩니다.</strong> 제한, 휴면, 탈퇴,
                    활성화는 모두 <code>summary</code> 집계와 함께 움직입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>One language per file.</strong> Korean is common in this repository and English is just as
                    normal, but a language switch inside one file is not.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파일 하나에 언어 하나.</strong> 이 저장소에서는 한국어 abstract가 흔하고 영어도 똑같이
                    괜찮지만, 한 파일 안에서 언어를 바꾸지는 않습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scaffold" title={l.trans({ en: "Replace The Scaffold", ko: "스캐폴드 바꿔 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Replace The Scaffold", ko: "스캐폴드 바꿔 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>akan create-module</code> writes the first abstract for you, called the scaffold. It already has
                  the house shape: a title, one sentence and a <code>## Rules</code> list with two starting rules. The
                  first real edit rewrites those lines to say what this module owns.
                </span>
              ),
              ko: (
                <span>
                  <code>akan create-module</code>은 첫 abstract를 대신 만들어 줍니다. 이 초안을 스캐폴드라고 부르며,
                  제목 한 줄, 문장 하나, 시작 규칙 두 개가 담긴 <code>## Rules</code> 목록으로 이미 정해진 모양을
                  갖췄습니다. 처음 제대로 고칠 때 이 줄들을 이 모듈이 맡는 내용으로 바꿔 씁니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  What <code>akan create-module project</code> writes in an app that mounts <code>libs/shared</code>:
                </span>
              ),
              ko: (
                <span>
                  <code>libs/shared</code>를 쓰는 앱에서 <code>akan create-module project</code>가 만드는 파일입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/project/project.abstract.md"
            language="markdown"
            code={`# project Abstract
Project represents a project workspace or business initiative managed by the app.

## Rules
- Anyone may read a project; only an admin creates, updates or removes one.
- Removal is soft: a removed project keeps its row with \`removedAt\` set.`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Without <code>libs/shared</code>, the first rule is closed.
                    </strong>{" "}
                    It reads that nobody creates, updates or removes a project until the slice names a guard, matching
                    the scaffolded <code>None</code> guards.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>libs/shared</code>가 없으면 첫 규칙이 닫혀 있습니다.
                    </strong>{" "}
                    슬라이스가 가드를 정할 때까지 아무도 project를 만들거나 고치거나 지우지 못한다고 적히며, 스캐폴드의{" "}
                    <code>None</code> 가드와 맞습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <div>{l.trans({ en: "Where each line goes:", ko: "줄마다 바뀌는 모습:" })}</div>
          <Docs.Table columns={scaffoldColumns} rows={scaffoldRows} />

          <Docs.SubSubTitle>{l.trans({ en: "Keeping It Current", ko: "최신으로 유지하기" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Read it before changing the constant, document, service, signal, store or any component of the same module. Update it only when what the module means changes:",
              ko: "같은 모듈의 constant, document, service, signal, store, 컴포넌트를 고치기 전에 먼저 읽습니다. 갱신은 모듈의 의미가 바뀔 때만 합니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Change", ko: "변경" })}
            columns={keepColumns}
            groups={keepGroups}
            markLabel={l.trans({ en: "Do this", ko: "이렇게 합니다" })}
            emptyLabel={l.trans({ en: "Not this", ko: "하지 않습니다" })}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
