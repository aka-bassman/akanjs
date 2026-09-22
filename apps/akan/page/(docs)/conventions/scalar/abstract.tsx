import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="scalar-abstract" title="scalar.abstract.md">
        <Docs.Title>scalar.abstract.md</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar is a value somebody else stores, so the question it has to answer is not what it is but what may be assumed about it. Coordinate holds two numbers in an array — and the order is longitude first, which is the opposite of how almost everybody says it out loud.",
              ko: "scalar는 다른 무언가가 저장하는 값입니다. 그래서 이 파일이 답해야 하는 질문은 그것이 무엇인가가 아니라, 그것에 대해 무엇을 가정해도 되는가입니다. Coordinate는 배열에 숫자 둘을 담는데, 순서가 longitude 먼저입니다. 거의 모든 사람이 입으로 말하는 순서와 반대입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Three parts, and there is no fourth. Seventeen scalar abstracts in this workspace are written this way and not one of them has a workflow section — a value object embedded in something else has no lifecycle of its own to describe.",
              ko: "세 부분이고 넷째는 없습니다. 이 워크스페이스의 scalar abstract 열일곱 개가 이렇게 쓰여 있고 그중 workflow 절을 가진 것은 하나도 없습니다. 다른 것 안에 박히는 value object에는 설명할 자기 생애주기가 없습니다.",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">📛</span>
              <div>
                <strong>{"# <scalar> Abstract"}</strong>:{" "}
                {l.trans({
                  en: "one title line carrying the scalar name as the folder spells it",
                  ko: "folder가 쓰는 그대로의 scalar 이름을 담은 제목 한 줄",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📝</span>
              <div>
                <strong>{l.trans({ en: "One declarative sentence", ko: "선언문 한 문장" })}</strong>:{" "}
                {l.trans({
                  en: "what this value represents and, when it matters, who holds it",
                  ko: "이 값이 무엇을 표현하는지, 그리고 중요하다면 누가 그것을 들고 있는지",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📏</span>
              <div>
                <strong>## Rules</strong>:{" "}
                {l.trans({
                  en: "two to five bullets — a fixed value, a field order, a unit, a lifetime, the arithmetic a static implements",
                  ko: "두 개에서 다섯 개의 항목. 고정된 값, field 순서, 단위, 유효 기간, static이 구현한 산술 같은 것들입니다",
                })}
              </div>
            </div>
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
              en: "Four bullets, and every one of them is a thing a caller would otherwise get wrong. The type field is pinned rather than open. The array order is the GeoJSON order and not the spoken one. The distance is spherical rather than planar, and the three-dimensional form adds altitude. The map helpers need a list and answer nothing for an empty one.",
              ko: "항목 넷이고, 네 개 모두 그것이 없으면 호출자가 틀리게 될 것들입니다. type field는 열려 있지 않고 고정되어 있습니다. 배열 순서는 입으로 말하는 순서가 아니라 GeoJSON 순서입니다. 거리는 평면이 아니라 구면이고, 3차원 형태는 고도를 더합니다. 지도 helper는 목록이 있어야 하고 빈 목록에는 아무것도 답하지 않습니다.",
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
              en: "A new scalar arrives with six headings and no content. It is a prompt rather than a template, and for a scalar the first real edit deletes all six — the title line and one sentence replace them.",
              ko: "새 scalar는 heading 여섯 개와 내용 없음으로 시작합니다. template이 아니라 질문지이고, scalar에서는 처음 제대로 손대는 순간 여섯 개가 전부 사라집니다. 제목 한 줄과 문장 하나가 그 자리를 대신합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="pkgs/@akanjs/cli/templates/__scalar/__model__/__model__.abstract.md"
            language="markdown"
            code={`# Scalar Abstract

## Purpose // [!code --]

Describe the embedded value object or reusable data concept this scalar owns. // [!code --]

## Domain Rules // [!code --]

- Keep durable validation and meaning rules here.
- Avoid repeating field types that are already clear in the constant file. // [!code --]

## Data Meaning // [!code --]

Explain the meaning of the scalar fields and when this scalar should be used. // [!code --]

## Workflows // [!code --]

Describe lifecycle or normalization behavior when relevant. // [!code --]

## Agent Notes // [!code --]

- Read this abstract before changing the scalar. // [!code --]
- Update this file when validation meaning, public behavior, or reuse rules change. // [!code --]
- Do not update this file for formatting-only, import-only, or style-only changes. // [!code --]

## Related Modules // [!code --]

- None yet. // [!code --]`}
          />
          <div>
            {l.trans({
              en: "Purpose becomes the sentence under the title. Domain Rules becomes ## Rules. Data Meaning belongs next to the field it describes, as a trailing comment in the constant file. Workflows, Agent Notes and Related Modules go, and nothing replaces them.",
              ko: "Purpose는 제목 아래의 문장이 됩니다. Domain Rules는 ## Rules가 됩니다. Data Meaning은 그것이 설명하는 field 옆, constant 파일의 꼬리 주석에 있어야 할 내용입니다. Workflows, Agent Notes, Related Modules는 지우고 아무것도 채우지 않습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "What earns a bullet here:", ko: "여기서 항목이 될 자격:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "A unit or an order the type cannot carry — kilometres rather than metres, longitude before latitude, an array whose positions correspond to another array's.",
                  ko: "타입이 담지 못하는 단위나 순서. 미터가 아니라 킬로미터, latitude보다 앞선 longitude, 다른 배열의 위치와 대응하는 배열 같은 것입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A lifetime or a consumption rule, when the value is held rather than merely stored — a code that lives sixty seconds and is consumed on first exchange whether or not that exchange succeeds.",
                  ko: "그저 저장되는 것이 아니라 보관되는 값이라면 유효 기간이나 소비 규칙. 60초를 살고 첫 교환에서 소비되며 그 교환의 성공 여부와 무관한 code 같은 것입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "What a static on the class actually computes, when a caller could reasonably expect something else.",
                  ko: "class의 static이 실제로 무엇을 계산하는지. 호출자가 다른 것을 기대할 법할 때 적습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Never the field list, never the types, and never a note that the scalar is reusable — every scalar is.",
                  ko: "field 목록, type, 그리고 이 scalar가 재사용 가능하다는 말은 적지 않습니다. 모든 scalar가 그렇습니다.",
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: "Read it before changing validation meaning or public behavior, and update it when one of those changes. Do not touch it for a formatting, import or style change — akan quality scan warns once an abstract passes 300 lines, and the longest scalar abstract in this workspace is twelve.",
              ko: "검증 의미나 공개 동작을 바꾸기 전에 읽고, 그것들이 바뀌면 갱신합니다. formatting, import, style만 바뀐 변경에서는 건드리지 않습니다. akan quality scan은 abstract가 300줄을 넘으면 경고하는데, 이 워크스페이스에서 가장 긴 scalar abstract가 열두 줄입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
