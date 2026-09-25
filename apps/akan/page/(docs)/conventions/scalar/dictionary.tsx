import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type IntroItem, type MatrixGroup } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "label", ko: "레이블" })}</span>,
      desc: l.trans({
        en: 'The name a person reads, one string per language: `t(["Amount", "금액"])`.',
        ko: '사람이 읽는 이름으로, `t(["Amount", "금액"])`처럼 언어마다 하나씩 적습니다.',
      }),
    },
    {
      name: ".desc()",
      desc: l.trans({
        en: "A one-sentence explanation chained after a label.",
        ko: "레이블 뒤에 이어 붙이는 한 문장짜리 설명입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "language tuple", ko: "언어 배열" })}</span>,
      desc: l.trans({
        en: 'One string per language, in the order `scalarDictionary(["en", "ko"])` lists them.',
        ko: '`scalarDictionary(["en", "ko"])`에 적은 언어 순서대로 문자열을 하나씩 담은 배열입니다.',
      }),
    },
    {
      name: "key",
      desc: l.trans({
        en: "The dotted path code reads a label by, such as `price.amount`.",
        ko: "코드가 레이블을 꺼낼 때 쓰는 점 경로로, `price.amount` 같은 모양입니다.",
      }),
    },
  ];

  const kindColumns = [
    { key: "model", label: "model", code: true, caption: "modelDictionary" },
    { key: "scalar", label: "scalar", code: true, caption: "scalarDictionary" },
    { key: "service", label: "service", code: true, caption: "serviceDictionary" },
  ];
  const kindGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "What a scalar labels", ko: "scalar가 붙이는 레이블" }),
      rows: [
        {
          name: ".of()",
          desc: l.trans({ en: "The name of the scalar or model itself.", ko: "scalar나 model 자체의 이름입니다." }),
          marks: { model: true, scalar: true },
        },
        {
          name: ".model()",
          desc: l.trans({ en: "One label per field of the constant.", ko: "constant의 필드마다 레이블 하나입니다." }),
          marks: { model: true, scalar: true },
        },
        {
          name: ".enum()",
          desc: l.trans({
            en: "One label per value of an `enumOf()` enum.",
            ko: "`enumOf()`로 만든 enum의 값마다 레이블 하나입니다.",
          }),
          marks: { model: true, scalar: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Messages every kind has", ko: "모든 종류에 있는 메시지" }),
      rows: [
        {
          name: ".error()",
          desc: l.trans({ en: "Error messages thrown with `new Err()`.", ko: "`new Err()`로 던지는 에러 문구입니다." }),
          marks: { model: true, scalar: true, service: true },
        },
        {
          name: ".translate()",
          desc: l.trans({ en: "Any other short text.", ko: "그 밖의 짧은 문구입니다." }),
          marks: { model: true, scalar: true, service: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Only for a stored list or an API", ko: "저장된 목록이나 API가 있을 때만" }),
      rows: [
        {
          name: ".insight()",
          desc: l.trans({
            en: "Summary numbers of a list, such as its count.",
            ko: "개수 같은 목록의 요약 수치입니다.",
          }),
          marks: { model: true },
        },
        {
          name: ".query() · .sort()",
          desc: l.trans({ en: "The filters and sort orders of a list.", ko: "목록의 필터와 정렬 방식입니다." }),
          marks: { model: true },
        },
        {
          name: ".slice()",
          desc: l.trans({
            en: "The data views a client store loads.",
            ko: "클라이언트 store가 불러오는 데이터 뷰입니다.",
          }),
          marks: { model: true },
        },
        {
          name: ".endpoint()",
          desc: l.trans({
            en: "Signal endpoints and their arguments.",
            ko: "signal endpoint와 그 인자입니다.",
          }),
          marks: { model: true, service: true },
        },
      ],
    },
  ];

  const stageRows: IntroItem[] = [
    {
      name: ".of()",
      desc: l.trans({
        en: "The scalar itself: its name and its description.",
        ko: "scalar 자체의 이름과 설명입니다.",
      }),
      example: 'l("price.modelName")\nl("price.modelDesc")',
    },
    {
      name: ".model<Price>()",
      desc: l.trans({
        en: "Every field of the constant, and leaving one out is a type error.",
        ko: "constant의 모든 필드이며, 하나라도 빠지면 타입 에러입니다.",
      }),
      example: 'l("price.amount")\nl("price.amount.desc")',
    },
    {
      name: '.enum<Currency>("currency")',
      desc: l.trans({
        en: "Every value of one enum, under the enum's own name.",
        ko: "enum 하나의 모든 값이며, key는 enum 자신의 이름 아래에 생깁니다.",
      }),
      example: 'l("currency.KRW")\nl("currency.KRW.desc")',
    },
    {
      name: ".error({})",
      desc: l.trans({
        en: "Error messages thrown with `new Err()`, rarely needed in a scalar.",
        ko: "`new Err()`로 던지는 에러 문구로, scalar에서는 드물게 씁니다.",
      }),
      example: 'new Err("price.error.<key>")',
    },
    {
      name: ".translate({})",
      desc: l.trans({
        en: "Any other short text that belongs to the scalar.",
        ko: "scalar에 속한 그 밖의 짧은 문구입니다.",
      }),
      example: 'l("price.free")',
    },
  ];

  const languageRows: IntroItem[] = [
    {
      name: '"en"',
      desc: l.trans({
        en: 'First in every tuple: `"Price"` and `"Price value"`.',
        ko: '모든 배열의 첫 번째 자리입니다: `"Price"`, `"Price value"`.',
      }),
    },
    {
      name: '"ko"',
      desc: l.trans({
        en: 'Second in every tuple: `"가격"` and `"가격 값"`.',
        ko: '모든 배열의 두 번째 자리입니다: `"가격"`, `"가격 값"`.',
      }),
    },
  ];

  const enumPlaceRows: IntroItem[] = [
    {
      name: 'enumOf("currency", …)',
      desc: l.trans({
        en: "Declares the enum and its name in `price.constant.ts`.",
        ko: "`price.constant.ts`에서 enum과 그 이름을 선언합니다.",
      }),
    },
    {
      name: '.enum<Currency>("currency", …)',
      desc: l.trans({
        en: "Labels every value under the same name in `price.dictionary.ts`.",
        ko: "`price.dictionary.ts`에서 같은 이름 아래 모든 값에 레이블을 붙입니다.",
      }),
    },
    {
      name: 'l("currency.KRW")',
      desc: l.trans({
        en: "Reads the label of one value in a component.",
        ko: "컴포넌트에서 값 하나의 레이블을 읽습니다.",
      }),
    },
    {
      name: "items={cnst.Currency}",
      desc: l.trans({
        en: "`Field.ToggleSelect` labels its buttons from the same keys, with no extra code.",
        ko: "`Field.ToggleSelect`는 같은 key로 버튼 이름을 붙이므로 따로 쓸 코드가 없습니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="dictionary-overview" title="scalar.dictionary.ts">
        <Docs.Title>scalar.dictionary.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar dictionary gives a scalar its labels in every language: the scalar's name, each field, and each enum value. Open it whenever you add a field or an enum value to the scalar's constant.",
              ko: "scalar dictionary는 scalar에 언어별 레이블을 붙입니다. scalar 이름, 각 필드, 각 enum 값이 대상입니다. scalar의 constant에 필드나 enum 값을 추가할 때마다 이 파일도 함께 엽니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>
            {l.trans({ en: "Smaller than a module dictionary", ko: "module dictionary보다 작은 builder" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  A scalar is a value embedded in a model, so it has no list or API of its own to label.{" "}
                  <code>scalarDictionary</code> therefore has no query, sort, slice, or endpoint stage at all.
                </span>
              ),
              ko: (
                <span>
                  scalar는 model 안에 들어가는 값이라, 레이블을 붙일 자기만의 목록이나 API가 없습니다. 그래서{" "}
                  <code>scalarDictionary</code>에는 query, sort, slice, endpoint 단계가 아예 없습니다.
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Stage", ko: "단계" })}
            columns={kindColumns}
            groups={kindGroups}
            markLabel={l.trans({ en: "has this stage", ko: "이 단계가 있음" })}
            emptyLabel={l.trans({ en: "no such stage", ko: "이 단계가 없음" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Pick the builder by module kind.</strong> <code>modelDictionary</code> for{" "}
                    <code>{"lib/<model>"}</code>, <code>scalarDictionary</code> for{" "}
                    <code>{"lib/__scalar/<scalar>"}</code>, <code>serviceDictionary</code> for{" "}
                    <code>{"lib/_<service>"}</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>builder는 모듈 종류에 맞춰 고릅니다.</strong> <code>{"lib/<model>"}</code>에는{" "}
                    <code>modelDictionary</code>, <code>{"lib/__scalar/<scalar>"}</code>에는{" "}
                    <code>scalarDictionary</code>, <code>{"lib/_<service>"}</code>에는 <code>serviceDictionary</code>를
                    씁니다.
                  </>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="basic-pattern" title={l.trans({ en: "Basic Pattern", ko: "기본 패턴" })}>
        <Docs.Title>{l.trans({ en: "Basic Pattern", ko: "기본 패턴" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Start from <code>{'scalarDictionary(["en", "ko"])'}</code> and chain one stage per kind of label. A
                  scalar with one enum and one extra phrase looks like this:
                </span>
              ),
              ko: (
                <span>
                  <code>{'scalarDictionary(["en", "ko"])'}</code>로 시작해 레이블 종류마다 단계를 하나씩 이어 붙입니다.
                  enum 하나와 추가 문구 하나가 있는 scalar는 이렇게 생겼습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.dictionary.ts"
          code={`import { scalarDictionary } from "akanjs/dictionary";

import type { Currency, Price } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Price value", "가격 값"]))
  .model<Price>((t) => ({
    amount: t(["Amount", "금액"]).desc(["Price amount", "가격 금액"]),
    currency: t(["Currency", "통화"]).desc(["Currency code", "통화 코드"]),
  }))
  .enum<Currency>("currency", (t) => ({
    KRW: t(["KRW", "원"]).desc(["Korean won", "한국 원"]),
    USD: t(["USD", "달러"]).desc(["US dollar", "미국 달러"]),
  }))
  .translate({
    free: ["Free", "무료"],
  });`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      Export one const named <code>dictionary</code>.
                    </strong>{" "}
                    Every model, scalar and service dictionary in the workspace uses this name.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      <code>dictionary</code>라는 이름의 const 하나를 export합니다.
                    </strong>{" "}
                    workspace의 model, scalar, service dictionary가 모두 이 이름을 씁니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      Import the constant with <code>import type</code>.
                    </strong>{" "}
                    The dictionary uses the constant only as type arguments, so a type-only import is all it needs.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      constant는 <code>import type</code>으로 가져옵니다.
                    </strong>{" "}
                    dictionary는 constant를 타입 인자로만 쓰므로 타입만 가져오면 충분합니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      Give every label a <code>.desc()</code>, even one that repeats it.
                    </strong>{" "}
                    English labels are Title Case; Korean labels are the plain domain term.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      레이블과 같은 말이 되더라도 모든 레이블에 <code>.desc()</code>를 붙입니다.
                    </strong>{" "}
                    영어 레이블은 Title Case로, 한국어 레이블은 평소 쓰는 도메인 용어로 씁니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      No enum and no extra text? Stop after <code>.model()</code>.
                    </strong>{" "}
                    <code>libs/shared/lib/__scalar/restrictInfo/restrictInfo.dictionary.ts</code> is exactly{" "}
                    <code>.of()</code> and <code>.model()</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      enum도 추가 문구도 없다면 <code>.model()</code>에서 끝냅니다.
                    </strong>{" "}
                    <code>libs/shared/lib/__scalar/restrictInfo/restrictInfo.dictionary.ts</code>는 <code>.of()</code>와{" "}
                    <code>.model()</code>만으로 이루어져 있습니다.
                  </>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="builder-order" title={l.trans({ en: "Builder Order", ko: "Builder 순서" })}>
        <Docs.Title>{l.trans({ en: "Builder Order", ko: "Builder 순서" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Write the stages in this order and skip the ones you have nothing for. Each stage fills one set of
                  keys that components read with <code>l()</code>.
                </span>
              ),
              ko: (
                <span>
                  단계는 이 순서로 쓰고, 담을 것이 없는 단계는 건너뜁니다. 각 단계는 컴포넌트가 <code>l()</code>로 읽는
                  key 묶음을 하나씩 채웁니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Stage", ko: "단계" })} items={stageRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>The order is a convention, not a check.</strong> Every stage returns the same builder, so
                    any order compiles. Keep this one so a reader finds each stage where they expect it.
                  </>
                ),
                ko: (
                  <>
                    <strong>순서는 관례이지 검사 대상이 아닙니다.</strong> 모든 단계가 같은 builder를 돌려주므로 어떤
                    순서든 컴파일됩니다. 읽는 사람이 기대하는 자리에서 각 단계를 찾도록 이 순서를 지킵니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Enum labels live under the enum's name.</strong> Read <code>{'l("currency.KRW")'}</code>,
                    not <code>{'l("price.currency.KRW")'}</code>. The latter is not a key, so it fails to typecheck.
                  </>
                ),
                ko: (
                  <>
                    <strong>enum 레이블은 enum 이름 아래에 있습니다.</strong> <code>{'l("price.currency.KRW")'}</code>가
                    아니라 <code>{'l("currency.KRW")'}</code>로 읽습니다. 앞의 것은 없는 key라 타입 에러가 납니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Some labels show up with no code of yours.</strong> The <code>Constant.Doc</code> model
                    explorer shows the <code>.of()</code> description and each field's <code>.desc()</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>직접 코드를 쓰지 않아도 보이는 레이블이 있습니다.</strong> 모델 탐색기{" "}
                    <code>Constant.Doc</code>은 <code>.of()</code>의 설명과 각 필드의 <code>.desc()</code>를 보여
                    줍니다.
                  </>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="language-order" title={l.trans({ en: "Language Order", ko: "언어 순서" })}>
        <Docs.Title>{l.trans({ en: "Language Order", ko: "언어 순서" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The array passed to <code>scalarDictionary()</code> sets the order of every language tuple in the
                  file. With <code>{'["en", "ko"]'}</code>, write English first and Korean second, everywhere:
                </span>
              ),
              ko: (
                <span>
                  <code>scalarDictionary()</code>에 넘긴 배열이 파일 안 모든 언어 배열의 순서를 정합니다.{" "}
                  <code>{'["en", "ko"]'}</code>로 시작했다면 모든 곳에서 영어를 먼저, 한국어를 두 번째로 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.dictionary.ts"
          code={`export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Price value", "가격 값"]));`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "Each position in a tuple belongs to one language:",
              ko: "배열의 자리마다 언어가 하나씩 정해져 있습니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Language", ko: "언어" })} items={languageRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      Every dictionary here uses <code>{'["en", "ko"]'}</code>.
                    </strong>{" "}
                    Model, scalar and service dictionaries in this workspace all put English first.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      이 workspace의 dictionary는 모두 <code>{'["en", "ko"]'}</code>를 씁니다.
                    </strong>{" "}
                    model, scalar, service dictionary 모두 영어가 먼저입니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>A swapped tuple is not an error.</strong> Both entries are strings, so{" "}
                    <code>{'["가격", "Price"]'}</code> compiles and shows Korean on the English page.
                  </>
                ),
                ko: (
                  <>
                    <strong>순서가 뒤바뀐 배열은 에러가 나지 않습니다.</strong> 둘 다 문자열이라{" "}
                    <code>{'["가격", "Price"]'}</code>도 컴파일되고, 영어 페이지에 한국어가 나옵니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>A language you did not write falls back.</strong> A locale missing from the array reads the
                    app's default locale, then the bare key. With no argument, <code>scalarDictionary()</code> is
                    English only.
                  </>
                ),
                ko: (
                  <>
                    <strong>배열에 없는 언어는 기본 언어로 대신합니다.</strong> 배열에 없는 locale은 앱의 기본 locale
                    문구를, 그것도 없으면 key 문자열을 보여 줍니다. 인자 없이 부른 <code>scalarDictionary()</code>는
                    영어 하나뿐입니다.
                  </>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="enum-matching" title={l.trans({ en: "Enum Name Matching", ko: "Enum 이름 맞추기" })}>
        <Docs.Title>{l.trans({ en: "Enum Name Matching", ko: "Enum 이름 맞추기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  An enum the constant declares with <code>enumOf()</code> gets its labels from <code>.enum()</code>,
                  and the two names must match exactly. Here the constant declares <code>currency</code> and uses it for
                  a field:
                </span>
              ),
              ko: (
                <span>
                  constant가 <code>enumOf()</code>로 선언한 enum은 <code>.enum()</code>에서 레이블을 받고, 두 호출의
                  이름은 정확히 같아야 합니다. 아래 constant는 <code>currency</code>를 선언하고 필드에 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.constant.ts"
          code={`import { enumOf, Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Currency extends enumOf("currency", ["KRW", "USD"] as const) {}

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(Currency, { default: "KRW" }),
})) {}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: <span>The dictionary labels it under the same name, with the enum class as the type argument:</span>,
              ko: <span>dictionary는 같은 이름으로 레이블을 붙이고, enum class를 타입 인자로 넘깁니다.</span>,
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.dictionary.ts"
          code={`import { scalarDictionary } from "akanjs/dictionary";

import type { Currency } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .enum<Currency>("currency", (t) => ({
    KRW: t(["KRW", "원"]).desc(["Korean won", "한국 원"]),
    USD: t(["USD", "달러"]).desc(["US dollar", "미국 달러"]),
  }));`}
        />
        <Docs.Description>
          <Docs.SubSubTitle>{l.trans({ en: "One name, four places", ko: "이름 하나, 쓰이는 곳 넷" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Where", ko: "위치" })} items={enumPlaceRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      One <code>.enum()</code> call per enum.
                    </strong>{" "}
                    <code>apps/akan/lib/__scalar/docPage/docPage.dictionary.ts</code> chains two, for{" "}
                    <code>docSection</code> and <code>docPriority</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      enum 하나에 <code>.enum()</code> 호출 하나입니다.
                    </strong>{" "}
                    <code>apps/akan/lib/__scalar/docPage/docPage.dictionary.ts</code>는 <code>docSection</code>과{" "}
                    <code>docPriority</code>를 위해 두 번 이어 붙입니다.
                  </>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <>
                  <strong>Always pass the enum class as the type argument.</strong> With{" "}
                  <code>{'.enum<Currency>("currency", …)'}</code>, a misspelled name or a missing value is a type error.
                  Without it, a misspelled name compiles, the labels land under it, and the screen shows{" "}
                  <code>currency.KRW</code> as is.
                </>
              ),
              ko: (
                <>
                  <strong>enum class는 항상 타입 인자로 넘깁니다.</strong>{" "}
                  <code>{'.enum<Currency>("currency", …)'}</code>로 쓰면 이름 오타나 빠진 값이 타입 에러가 됩니다. 타입
                  인자가 없으면 오타 난 이름도 그대로 컴파일되어 레이블이 그 이름 아래에 등록되고, 화면에는{" "}
                  <code>currency.KRW</code>가 그대로 나옵니다.
                </>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="custom-text" title={l.trans({ en: "Small Custom Text", ko: "짧은 전용 문구" })}>
        <Docs.Title>{l.trans({ en: "Small Custom Text", ko: "짧은 전용 문구" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>.translate()</code> holds short text that belongs to the scalar itself. Text that belongs to a
                  page or an action stays in the parent module's dictionary. Add each phrase as a key and a language
                  tuple:
                </span>
              ),
              ko: (
                <span>
                  <code>.translate()</code>에는 scalar 자체에 속한 짧은 문구만 둡니다. 페이지나 동작에 속한 문구는 상위
                  module의 dictionary에 둡니다. 문구마다 key와 언어 배열을 하나씩 적습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.dictionary.ts"
          code={`export const dictionary = scalarDictionary(["en", "ko"])
  .translate({
    free: ["Free", "무료"],
  });`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "Components read it by the scalar's name, the same way as a field label:",
              ko: "컴포넌트는 필드 레이블과 똑같이 scalar 이름으로 이 문구를 읽습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/ui/PriceLabel.tsx"
          code={`import { usePage } from "@apps/myapp/client";

export const PriceLabel = () => {
  const { l } = usePage();

  return (
    <div>
      <div>{l("price.amount")}</div>
      <div>{l("price.free")}</div>
    </div>
  );
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Keys sit beside the field labels.</strong> <code>free</code> is read as{" "}
                    <code>price.free</code>, just like <code>price.amount</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>key는 필드 레이블과 같은 자리에 놓입니다.</strong> <code>free</code>는{" "}
                    <code>price.amount</code>와 같은 방식으로 <code>price.free</code>로 읽습니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Pick a key no field uses.</strong> <code>{".translate({ amount: … })"}</code> would replace
                    the <code>amount</code> field label, because both are <code>price.amount</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>어느 필드도 쓰지 않는 key를 고릅니다.</strong> <code>{".translate({ amount: … })"}</code>는{" "}
                    <code>amount</code> 필드 레이블을 덮어씁니다. 둘 다 <code>price.amount</code>이기 때문입니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Reading a label adds no client boundary.</strong> <code>usePage()</code> works in a server
                    component, so <code>PriceLabel</code> needs no <code>{'"use client"'}</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>레이블을 읽는다고 클라이언트 경계가 생기지 않습니다.</strong> <code>usePage()</code>는 서버
                    컴포넌트에서도 동작하므로 <code>PriceLabel</code>에 <code>{'"use client"'}</code>가 필요 없습니다.
                  </>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
