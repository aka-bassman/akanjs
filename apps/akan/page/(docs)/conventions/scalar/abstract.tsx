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
      name: "# <scalar> Abstract",
      desc: l.trans({
        en: "One title line with the scalar name spelled the way its folder spells it.",
        ko: "폴더 이름에 쓴 그대로의 scalar 이름을 담은 제목 한 줄입니다.",
      }),
      example: "# coordinate Abstract",
    },
    {
      name: <span className="font-sans">{l.trans({ en: "One sentence", ko: "한 문장" })}</span>,
      desc: l.trans({
        en: "What the value represents and, when it matters, who holds it, with no heading above.",
        ko: "이 값이 무엇을 나타내는지, 그리고 중요하다면 누가 들고 있는지를 소제목 없이 적습니다.",
      }),
    },
    {
      name: "## Rules",
      desc: l.trans({
        en: "Two to five bullets: a fixed value, a field order, a unit, a lifetime, what a static computes.",
        ko: "두 개에서 다섯 개의 항목입니다. 고정된 값, field 순서, 단위, 유효 기간, static이 계산하는 것을 적습니다.",
      }),
    },
  ];

  const coordinateColumns: TableColumn[] = [
    { key: "rule", label: l.trans({ en: "The rule says", ko: "규칙이 말하는 것" }) },
    { key: "without", label: l.trans({ en: "Without it, a caller assumes", ko: "없으면 호출자가 하는 착각" }) },
  ];

  const coordinateRows = [
    {
      rule: l.trans({ en: "`type` is always `Point`.", ko: "`type`은 항상 `Point`입니다." }),
      without: l.trans({
        en: "That `type` is open and could hold another GeoJSON shape.",
        ko: "`type`이 열려 있어 다른 GeoJSON 모양도 담을 수 있다고 여깁니다.",
      }),
    },
    {
      rule: l.trans({
        en: "`coordinates` is longitude, then latitude.",
        ko: "`coordinates`는 longitude, latitude 순서입니다.",
      }),
      without: l.trans({
        en: "The spoken order, with latitude first.",
        ko: "입으로 말하는 순서대로 latitude가 먼저라고 여깁니다.",
      }),
    },
    {
      rule: l.trans({
        en: "Distance is spherical, and the 3D form folds in the altitude difference.",
        ko: "거리는 구면 거리이고, 3D 계산은 altitude 차이를 함께 반영합니다.",
      }),
      without: l.trans({
        en: "A flat-plane distance, or one that ignores altitude.",
        ko: "평면 거리이거나, altitude를 무시한 거리라고 여깁니다.",
      }),
    },
    {
      rule: l.trans({
        en: "Bounds, center and zoom need a list of coordinates.",
        ko: "bounds, center, zoom 계산에는 좌표 목록이 있어야 합니다.",
      }),
      without: l.trans({
        en: "That an empty list works, but `computeCenterAndZoomFromLocations` returns `null`.",
        ko: "빈 목록도 된다고 여기지만, `computeCenterAndZoomFromLocations`는 `null`을 돌려줍니다.",
      }),
    },
  ];

  const bulletColumns = [
    { key: "write", label: l.trans({ en: "Write", ko: "적는다" }) },
    { key: "skip", label: l.trans({ en: "Leave out", ko: "적지 않는다" }) },
  ];
  const write = { write: true };
  const skip = { skip: true };

  const bulletGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "What the type cannot carry", ko: "타입이 담지 못하는 것" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "A unit", ko: "단위" })}</span>,
          desc: l.trans({
            en: "Kilometres rather than metres: `getDistanceKm` and `getDistanceM` differ only by unit.",
            ko: "미터가 아니라 킬로미터 같은 것입니다. `getDistanceKm`과 `getDistanceM`은 단위만 다릅니다.",
          }),
          marks: write,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "An order", ko: "순서" })}</span>,
          desc: l.trans({
            en: "Longitude before latitude in `coordinate`.",
            ko: "`coordinate`에서 latitude보다 앞서는 longitude 같은 것입니다.",
          }),
          marks: write,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "A match by position", ko: "위치로 맞물리는 배열" })}</span>,
          desc: l.trans({
            en: "Each `fileMeta` lines up with the uploaded file at the same index.",
            ko: "`fileMeta` 하나하나는 같은 순서에 있는 업로드 파일과 짝을 이룹니다.",
          }),
          marks: write,
        },
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "A lifetime or a consumption rule", ko: "유효 기간이나 소비 규칙" })}
            </span>
          ),
          desc: l.trans({
            en: "For a held value: an `oauthGrant` lives 60 seconds and is spent on first exchange, pass or fail.",
            ko: "보관되는 값일 때 적습니다. `oauthGrant`는 60초를 살고, 첫 교환에서 성공 여부와 관계없이 소비됩니다.",
          }),
          marks: write,
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "What a static computes", ko: "static이 계산하는 것" })}</span>
          ),
          desc: l.trans({
            en: "Only when a caller could reasonably expect something else, such as a flat distance.",
            ko: "평면 거리처럼 호출자가 다른 것을 기대할 만할 때만 적습니다.",
          }),
          marks: write,
        },
      ],
    },
    {
      label: l.trans({ en: "What the code already says", ko: "코드가 이미 말하는 것" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "The field list", ko: "field 목록" })}</span>,
          desc: l.trans({
            en: "The constant file already lists every field.",
            ko: "constant 파일이 이미 모든 field를 나열합니다.",
          }),
          marks: skip,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "The types", ko: "type" })}</span>,
          desc: l.trans({
            en: "Each `field(...)` declaration already states its type.",
            ko: "`field(...)` 선언마다 type이 이미 적혀 있습니다.",
          }),
          marks: skip,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "That it is reusable", ko: "재사용 가능하다는 말" })}</span>,
          desc: l.trans({
            en: "Every scalar is reusable, so saying so tells the reader nothing.",
            ko: "모든 scalar가 재사용 가능하므로, 적어도 알려 주는 것이 없습니다.",
          }),
          marks: skip,
        },
      ],
    },
  ];

  const scaffoldColumns: TableColumn[] = [
    { key: "heading", label: l.trans({ en: "Scaffold", ko: "스캐폴드" }), code: true },
    { key: "becomes", label: l.trans({ en: "Becomes", ko: "바뀌는 모습" }) },
  ];

  const scaffoldRows = [
    {
      heading: "# price Abstract",
      becomes: l.trans({
        en: "Written for you from the folder name. Keep it.",
        ko: "폴더 이름으로 미리 적혀 있습니다. 그대로 둡니다.",
      }),
    },
    {
      heading: "<One sentence …>",
      becomes: l.trans({
        en: "Replaced by the value this scalar holds and what embeds it, stated as fact.",
        ko: "이 scalar가 담는 값과 그 값을 담는 곳을 사실로 적은 문장으로 바꿉니다.",
      }),
    },
    {
      heading: "## Rules",
      becomes: l.trans({
        en: "Stays. Both placeholder bullets become what a caller may assume about the value, two to five in all.",
        ko: "그대로 둡니다. 자리표시 항목 두 개를 호출자가 값에 대해 가정해도 되는 것 2~5개로 바꿉니다.",
      }),
    },
    {
      heading: <span className="font-sans">{l.trans({ en: "A field's meaning", ko: "field의 의미" })}</span>,
      becomes: l.trans({
        en: "Not here: a trailing comment beside the field in `price.constant.ts`.",
        ko: "여기가 아니라 `price.constant.ts`에서 해당 field 옆의 꼬리 주석으로 씁니다.",
      }),
    },
    {
      heading: <span className="font-sans">{l.trans({ en: "Workflow", ko: "workflow" })}</span>,
      becomes: l.trans({
        en: "None: a value embedded in something else has no lifecycle of its own.",
        ko: "없습니다. 다른 것 안에 담기는 값에는 따로 설명할 수명 주기가 없습니다.",
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
      label: l.trans({ en: "When what callers rely on changes", ko: "호출자가 기대는 것이 바뀔 때" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Validation meaning", ko: "검증 의미" })}</span>,
          desc: l.trans({
            en: "What counts as a valid value, such as the 1 to 5 satisfaction range in `leaveInfo`.",
            ko: "`leaveInfo`의 만족도가 1부터 5까지인 것처럼, 어떤 값이 유효한지입니다.",
          }),
          marks: update,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Public behavior", ko: "공개 동작" })}</span>,
          desc: l.trans({
            en: "What callers can observe, such as what a static returns.",
            ko: "static이 무엇을 돌려주는지처럼, 쓰는 쪽에서 관찰할 수 있는 동작입니다.",
          }),
          marks: update,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Reuse rules", ko: "재사용 규칙" })}</span>,
          desc: l.trans({
            en: "How it combines with other scalars, as `accessLog` stores its location as a `coordinate`.",
            ko: "`accessLog`가 위치를 `coordinate`로 담는 것처럼, 다른 scalar와 어떻게 함께 쓰는지입니다.",
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
      <Scroll.Slide id="scalar-abstract" title="scalar.abstract.md">
        <Docs.Title>scalar.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Every scalar keeps one <code>{"lib/__scalar/<scalar>/<scalar>.abstract.md"}</code>: a few lines of
                  markdown about the value. A scalar is a value that something else holds, usually a model's field, so
                  this file answers not what the value is, but what may be assumed about it.
                </span>
              ),
              ko: (
                <span>
                  scalar마다 <code>{"lib/__scalar/<scalar>/<scalar>.abstract.md"}</code> 파일이 하나 있습니다. scalar는
                  대개 모델의 field처럼 다른 무언가가 들고 있는 값이라서, 이 파일은 값이 무엇인지보다 그 값에 대해
                  무엇을 가정해도 되는지를 몇 줄의 markdown으로 답합니다.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "What May Be Assumed", ko: "무엇을 가정해도 되는가" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Take <code>coordinate</code> in <code>libs/util</code>. Its constant file and its abstract say
                  different things about the same array.
                </span>
              ),
              ko: (
                <span>
                  <code>libs/util</code>의 <code>coordinate</code>를 보면, constant 파일과 abstract가 같은 배열에 대해
                  서로 다른 것을 말합니다.
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
                      <code>coordinates</code> is an array of two floats.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>coordinates</code>는 실수 두 개를 담는 배열입니다.
                    </span>
                  ),
                })}
              </div>
              <code className={chip}>coordinates: field([Float], {"{ default: [0, 0] }"})</code>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className={cardTitle}>
                {l.trans({ en: "What Only The Abstract Says", ko: "abstract만 말하는 것" })}
              </div>
              <div className={cardBody}>
                {l.trans({
                  en: "Longitude comes first, the opposite of how almost everyone says a position out loud.",
                  ko: "longitude가 먼저입니다. 거의 모든 사람이 위치를 입으로 말하는 순서와 반대입니다.",
                })}
              </div>
              <code className={chip}>[127.114367, 37.497114] → [longitude, latitude]</code>
            </div>
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "The Three Parts", ko: "세 부분" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A scalar abstract has three parts, and there is no fourth:",
              ko: "scalar abstract는 세 부분으로 되어 있고, 넷째 부분은 없습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/__scalar/price/price.abstract.md"
            language="markdown"
            code={`# price Abstract
${l.trans({ en: "<one sentence: what this value represents, and who holds it>", ko: "<이 값이 무엇을 나타내고 누가 들고 있는지 한 문장으로>" })}

## Rules
- ${l.trans({ en: "<something a caller would otherwise get wrong>", ko: "<적혀 있지 않으면 호출자가 틀릴 것>" })}
- ${l.trans({ en: "<two to five bullets in all>", ko: "<항목은 모두 두 개에서 다섯 개>" })}`}
          />
          <Docs.IntroTable type={l.trans({ en: "Part", ko: "부분" })} items={partRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No workflow section.</strong> All 17 scalar abstracts in the Akan.js repository have these
                    three parts, and none has a workflow. That is where a scalar differs from{" "}
                    <code>model.abstract.md</code>, whose optional fourth part is <code>## Workflow</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>workflow 절은 없습니다.</strong> Akan.js 저장소의 scalar abstract 17개가 모두 이 세 부분으로
                    되어 있고, workflow를 가진 것은 하나도 없습니다. 선택 항목으로 <code>## Workflow</code>를 두는{" "}
                    <code>model.abstract.md</code>와 다른 점입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A value has no lifecycle of its own.</strong> It is embedded in something else, so there is
                    no flow of its own to describe.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>값에는 자기만의 수명 주기가 없습니다.</strong> 다른 것 안에 담기는 값이라, 따로 설명할
                    흐름이 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A state change still fits in one rule.</strong> When a held value does move between states,
                    as <code>oauthRequest</code> does, it is one <code>## Rules</code> bullet:{" "}
                    <code>{"pending -> approved | denied"}</code>, never back.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>상태 변화가 있어도 규칙 한 줄이면 됩니다.</strong> <code>oauthRequest</code>처럼 보관되는
                    값이 상태를 오가더라도 절을 따로 만들지 않고, <code>## Rules</code> 항목 하나에{" "}
                    <code>{"pending -> approved | denied"}</code>이며 되돌아가지 않는다고 적습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="rules" title={l.trans({ en: "Writing The Rules", ko: "Rules 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Writing The Rules", ko: "Rules 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A bullet belongs in Rules only if a caller would get something wrong without it. One real abstract shows what that looks like.",
              ko: "Rules에는 적혀 있지 않으면 호출자가 틀리게 될 것만 적습니다. 실제 abstract 하나를 보면 어떤 모습인지 알 수 있습니다.",
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "A Real Example", ko: "실제 예시" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The whole of <code>coordinate.abstract.md</code> is eight lines, for a class with fourteen static
                  helpers:
                </span>
              ),
              ko: (
                <span>
                  <code>coordinate.abstract.md</code>의 전문입니다. static helper가 열네 개인 class이지만 abstract는
                  여덟 줄입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/__scalar/coordinate/coordinate.abstract.md"
            language="markdown"
            code={`# coordinate Abstract
GeoJSON Point 좌표와 고도를 표현하고 거리/방위 계산을 제공한다.

## Rules
- type은 \`Point\`로 고정된다.
- coordinates는 longitude, latitude 순서를 따른다.
- 거리 계산은 지구 반지름 기반 구면 거리이며 3D 계산은 altitude 차이를 더한다.
- 지도 표시용 bounds, center, zoom 계산은 좌표 목록이 있을 때만 가능하다.`}
          />
          <div>
            {l.trans({
              en: "Four bullets, and each one is something a caller would otherwise get wrong:",
              ko: "항목은 넷이고, 모두 적혀 있지 않으면 호출자가 틀리게 될 것들입니다:",
            })}
          </div>
          <Docs.Table columns={coordinateColumns} rows={coordinateRows} stacked />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Nothing the declaration already says.</strong> No bullet lists the fields or their types;
                    each one says what <code>coordinate.constant.ts</code> cannot.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>선언이 이미 하는 말은 없습니다.</strong> field나 type을 나열하는 항목은 하나도 없고, 모두{" "}
                    <code>coordinate.constant.ts</code>가 말하지 못하는 것만 적습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>One language per file.</strong> Korean and English abstracts sit side by side in this
                    repository (the <code>oauth*</code> scalars are English), but a language switch inside one file is
                    not.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파일 하나에 언어 하나.</strong> 이 저장소에는 한국어와 영어 abstract가 함께 있지만(
                    <code>oauth*</code> scalar는 영어입니다), 한 파일 안에서 언어를 바꾸지는 않습니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "What Earns A Bullet", ko: "항목이 될 자격" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Examples from the scalars in this repository, sorted by whether they belong in Rules:",
              ko: "이 저장소의 scalar에서 가져온 예시를 Rules에 적을지 여부로 나눴습니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Content", ko: "내용" })}
            columns={bulletColumns}
            groups={bulletGroups}
            markLabel={l.trans({ en: "Do this", ko: "이렇게 합니다" })}
            emptyLabel={l.trans({ en: "Not this", ko: "하지 않습니다" })}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scaffold" title={l.trans({ en: "Fill In The Scaffold", ko: "스캐폴드 채우기" })}>
        <Docs.Title>{l.trans({ en: "Fill In The Scaffold", ko: "스캐폴드 채우기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>akan create-scalar</code> writes the first abstract for you, called the scaffold. It already has
                  the house shape: the title, a placeholder sentence and two placeholder rules. Every line in angle
                  brackets is a prompt, and none of them survives the first real edit.
                </span>
              ),
              ko: (
                <span>
                  <code>akan create-scalar</code>는 첫 abstract를 대신 만들어 줍니다. 이 초안을 스캐폴드라고 부르며,
                  제목, 자리표시 문장 하나, 자리표시 규칙 두 개로 이미 정해진 모양을 갖췄습니다. 꺾쇠괄호로 된 줄은 모두
                  질문이라서, 처음 제대로 고칠 때 하나도 남지 않습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  What <code>akan create-scalar price</code> writes:
                </span>
              ),
              ko: (
                <span>
                  <code>akan create-scalar price</code>가 만드는 파일입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/__scalar/price/price.abstract.md"
            language="markdown"
            code={`# price Abstract

<One sentence: the value this scalar holds, and what embeds it.>

## Rules

- <What a caller may assume about the value that the constant file cannot say: an order, a unit, a fixed value.>
- <Two to five of them. A single field's meaning goes in a trailing comment beside it in the constant file.>`}
          />
          <div>{l.trans({ en: "What each line becomes:", ko: "줄마다 바뀌는 모습:" })}</div>
          <Docs.Table columns={scaffoldColumns} rows={scaffoldRows} stacked />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Field meaning lives beside the field.</strong> A trailing comment is where the next reader
                    of that field looks, as in <code>oauthGrant.constant.ts</code>:
                  </span>
                ),
                ko: (
                  <span>
                    <strong>field의 의미는 field 옆에 둡니다.</strong> 그 field를 다음에 읽는 사람이 보는 곳이 꼬리
                    주석이기 때문입니다. <code>oauthGrant.constant.ts</code>가 이렇게 씁니다:
                  </span>
                ),
              })}
              <code className={chip}>
                codeHash: field(String), {"// sha256 of the code; the code itself travels once, in the redirect"}
              </code>
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Keeping It Current", ko: "최신으로 유지하기" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Read it before changing the scalar, and update it only when something callers rely on changes:",
              ko: "scalar를 고치기 전에 먼저 읽고, 갱신은 호출자가 기대는 것이 바뀔 때만 합니다:",
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
