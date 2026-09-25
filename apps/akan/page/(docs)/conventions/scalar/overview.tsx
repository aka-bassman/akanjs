import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const chip = "mt-2 block rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs leading-relaxed";
  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows = [
    {
      name: <span className="font-sans">{l.trans({ en: "value object", ko: "값 객체" })}</span>,
      desc: l.trans({
        en: "A value defined only by its fields, like a price or an address, with no `id` of its own.",
        ko: "가격이나 주소처럼 필드 값만으로 정해지고 자체 `id`가 없는 값입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "embed", ko: "임베드" })}</span>,
      desc: l.trans({
        en: "Putting a scalar inside another model as a field, so it is saved with that model.",
        ko: "스칼라를 다른 모델의 필드로 넣어 그 모델과 함께 저장하는 것입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "parent model", ko: "상위 모델" })}</span>,
      desc: l.trans({
        en: "The model that holds the scalar, such as `Product` holding a `Price`.",
        ko: "`Price`를 필드로 가진 `Product`처럼, 스칼라를 담고 있는 모델입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "database module", ko: "데이터베이스 모듈" })}</span>,
      desc: l.trans({
        en: "A model with its own table, service, endpoints and screens, under `lib/<model>/`.",
        ko: "`lib/<model>/` 아래에서 자체 테이블, 서비스, 엔드포인트, 화면을 갖는 모델입니다.",
      }),
    },
  ];

  const choiceColumns = [
    { key: "scalar", label: l.trans({ en: "Scalar", ko: "스칼라" }), caption: "lib/__scalar/" },
    { key: "module", label: l.trans({ en: "Database module", ko: "데이터베이스 모듈" }), caption: "lib/<model>/" },
  ];

  const choiceGroups = [
    {
      label: l.trans({ en: "A scalar fits", ko: "스칼라가 맞는 경우" }),
      rows: [
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "lives inside another record", ko: "다른 레코드 안에 있음" })}
            </span>
          ),
          desc: l.trans({
            en: "Saved and loaded with its parent, with no `id` or `createdAt` of its own.",
            ko: "자체 `id`나 `createdAt` 없이 상위 레코드와 함께 저장되고 불러와집니다.",
          }),
          marks: { scalar: true },
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "the same fields repeat", ko: "같은 필드가 반복됨" })}</span>
          ),
          desc: l.trans({
            en: "One group of fields appears in several models, like a price in products and orders.",
            ko: "상품과 주문의 가격처럼, 같은 필드 묶음이 여러 모델에 나옵니다.",
          }),
          marks: { scalar: true },
        },
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "an endpoint's input or result", ko: "엔드포인트의 입력이나 결과" })}
            </span>
          ),
          desc: l.trans({
            en: "A shape with no table behind it, like the `DocPage` list this docs app returns.",
            ko: "이 문서 앱이 돌려주는 `DocPage` 목록처럼, 뒤에 테이블이 없는 데이터 모양입니다.",
          }),
          marks: { scalar: true },
        },
      ],
    },
    {
      label: l.trans({ en: "It needs a database module", ko: "데이터베이스 모듈이 필요한 경우" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "its own list page", ko: "자체 목록 페이지" })}</span>,
          desc: l.trans({
            en: "People browse, search or page through the records.",
            ko: "사람들이 레코드를 둘러보고, 검색하고, 페이지를 넘깁니다.",
          }),
          marks: { module: true },
        },
        {
          name: <span className="font-sans">{l.trans({ en: "its own permissions", ko: "자체 권한" })}</span>,
          desc: l.trans({
            en: "Guards decide who may read or change each record.",
            ko: "가드가 레코드마다 누가 읽고 바꿀 수 있는지 정합니다.",
          }),
          marks: { module: true },
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "its own service methods", ko: "자체 서비스 메서드" })}</span>
          ),
          desc: l.trans({
            en: "Business operations such as `approve()` or `cancel()` run on it.",
            ko: "`approve()`나 `cancel()` 같은 비즈니스 동작이 이 모델을 대상으로 실행됩니다.",
          }),
          marks: { module: true },
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "an independent lifecycle", ko: "독립된 수명 주기" })}</span>
          ),
          desc: l.trans({
            en: "It is created and removed on its own, not together with a parent.",
            ko: "상위 레코드와 함께가 아니라 따로 생성되고 삭제됩니다.",
          }),
          marks: { module: true },
        },
      ],
    },
  ];

  const coreFileRows = [
    {
      name: "price.abstract.md",
      href: "/conventions/scalar/abstract",
      desc: l.trans({
        en: "What the value means, its validation intent and reuse rules, plus notes for agents.",
        ko: "값의 의미, 검증 의도, 재사용 규칙, 그리고 에이전트를 위한 메모를 적습니다.",
      }),
    },
    {
      name: "price.constant.ts",
      href: "/conventions/scalar/constant",
      desc: l.trans({
        en: "One class with the fields, any enums, and helper methods both server and client can call.",
        ko: "필드와 enum, 그리고 서버와 클라이언트가 모두 부를 수 있는 helper 메서드를 담은 클래스 하나입니다.",
      }),
    },
    {
      name: "price.dictionary.ts",
      href: "/conventions/scalar/dictionary",
      desc: l.trans({
        en: "A label and a description for every field and enum value, written with `scalarDictionary`.",
        ko: "`scalarDictionary`로 쓰는, 모든 필드와 enum 값의 라벨과 설명입니다.",
      }),
    },
    {
      name: "price.document.ts",
      href: "/conventions/scalar/document",
      desc: l.trans({
        en: "The server-side class, usually just `by(cnst.Price)`, while helpers live on the constant.",
        ko: "서버 쪽 클래스로 보통 `by(cnst.Price)` 한 줄이며, helper 메서드는 constant 클래스에 둡니다.",
      }),
    },
  ];

  const uiFileRows = [
    {
      name: "Price.Template.tsx",
      href: "/conventions/scalar/template",
      desc: l.trans({
        en: 'A client editor for the value inside a parent form, starting with "use client".',
        ko: '상위 폼 안에서 값을 편집하는 에디터로, 첫 줄이 "use client"입니다.',
      }),
    },
    {
      name: "Price.Unit.tsx",
      href: "/conventions/scalar/unit",
      desc: l.trans({
        en: "A server component that shows the value inside a parent card or detail page.",
        ko: "상위 카드나 상세 화면 안에서 값을 보여 주는 서버 컴포넌트입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="scalar-overview" title={l.trans({ en: "Scalar Overview", ko: "스칼라 개요" })}>
        <Docs.Title>{l.trans({ en: "Scalar Overview", ko: "스칼라 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar is a small, named group of fields that lives inside other models. Define it once, then embed it wherever the same fields repeat.",
              ko: "스칼라는 다른 모델 안에 들어가는 작은 필드 묶음에 이름을 붙인 것입니다. 한 번 정의해 두고, 같은 필드가 반복되는 곳마다 넣어 씁니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  For example, a product, an order and an invoice all need a price. Instead of writing{" "}
                  <code>amount</code> and <code>currency</code> three times, define a <code>Price</code> scalar once and
                  embed it in all three.
                </span>
              ),
              ko: (
                <span>
                  예를 들어 상품, 주문, 청구서에는 모두 가격이 필요합니다. <code>amount</code>와 <code>currency</code>를
                  세 번 쓰는 대신 <code>Price</code> 스칼라를 한 번 정의해 세 곳에 모두 넣습니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="when-to-use" title={l.trans({ en: "When To Use A Scalar", ko: "스칼라를 쓰는 경우" })}>
        <Docs.Title>{l.trans({ en: "When To Use A Scalar", ko: "스칼라를 쓰는 경우" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Ask whether the value only exists inside another record. If it does, it is a scalar; if it needs its own list, permissions or lifecycle, it is a database module.",
              ko: "이 값이 다른 레코드 안에서만 쓰이는지 먼저 따져 봅니다. 그렇다면 스칼라이고, 자체 목록이나 권한, 수명 주기가 필요하다면 데이터베이스 모듈입니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "When the value…", ko: "이 값이…" })}
            columns={choiceColumns}
            groups={choiceGroups}
            markLabel={l.trans({ en: "Use this one", ko: "이쪽을 씁니다" })}
            emptyLabel={l.trans({ en: "Not this one", ko: "해당 없음" })}
          />
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">{l.trans({ en: "Good Scalars", ko: "좋은 스칼라 예" })}</div>
              <code className={chip}>Price · Address · ContactInfo · Coordinate · FileMeta</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      <code>Coordinate</code> in <code>libs/util</code> and <code>FileMeta</code> in{" "}
                      <code>libs/shared</code> are real ones you can open.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>libs/util</code>의 <code>Coordinate</code>와 <code>libs/shared</code>의{" "}
                      <code>FileMeta</code>는 직접 열어 볼 수 있는 실제 스칼라입니다.
                    </span>
                  ),
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Good Database Modules", ko: "좋은 데이터베이스 모듈 예" })}
              </div>
              <code className={chip}>Product · Order · User · Post · Ticket</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "Each has its own list, permissions and lifecycle, so each gets its own module.",
                  ko: "각각 자체 목록, 권한, 수명 주기가 있으므로 모듈을 따로 둡니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Embedding looks like any other field. Import the scalar class and pass it to <code>field()</code>:
                </span>
              ),
              ko: (
                <span>
                  넣는 방법은 다른 필드와 같습니다. 스칼라 클래스를 import해서 <code>field()</code>에 넘깁니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/product/product.constant.ts"
          code={`import { via } from "akanjs/constant";
import { Price } from "../__scalar/price/price.constant";

export class ProductInput extends via((field) => ({
  name: field(String),
  price: field(Price),
})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Import by relative path.</strong> A constant file may import another module's constant
                    directly, as in <code>../__scalar/price/price.constant</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>상대 경로로 import합니다.</strong> constant 파일은 다른 모듈의 constant를{" "}
                    <code>../__scalar/price/price.constant</code>처럼 직접 import할 수 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No default needed.</strong> <code>field(Price)</code> starts filled with the defaults
                    declared in <code>Price</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>기본값을 따로 적지 않아도 됩니다.</strong> <code>field(Price)</code>는 <code>Price</code>에
                    정해 둔 기본값으로 채워진 채 시작합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Lists and empty values work as usual.</strong> <code>field([Price])</code> holds several,
                    and <code>field(Price).optional()</code> starts as <code>null</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>목록과 빈 값도 평소처럼 씁니다.</strong> <code>field([Price])</code>는 여러 개를 담고,{" "}
                    <code>field(Price).optional()</code>은 <code>null</code>로 시작합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A scalar can hold another scalar.</strong> <code>AccessLog</code> in <code>libs/util</code>{" "}
                    embeds a <code>Coordinate</code> as its <code>location</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>스칼라 안에 스칼라를 넣을 수도 있습니다.</strong> <code>libs/util</code>의{" "}
                    <code>AccessLog</code>는 <code>location</code> 필드에 <code>Coordinate</code>를 넣습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-map" title={l.trans({ en: "Scalar Files", ko: "스칼라 파일" })}>
        <Docs.Title>{l.trans({ en: "Scalar Files", ko: "스칼라 파일" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Each scalar is one folder, <code>{"lib/__scalar/<scalarName>/"}</code>.{" "}
                  <code>akan create-scalar price</code> writes the four core files; add UI files only when the value
                  needs reusable UI.
                </span>
              ),
              ko: (
                <span>
                  스칼라마다 <code>{"lib/__scalar/<scalarName>/"}</code> 폴더를 하나씩 둡니다.{" "}
                  <code>akan create-scalar price</code>가 기본 파일 네 개를 만들고, UI 파일은 여러 곳에서 같은 UI가
                  필요할 때만 추가합니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          language="bash"
          showLineNumbers={false}
          title="apps/<app>/lib/"
          code={`lib/
└── __scalar/
    └── price/
        ├── price.abstract.md
        ├── price.constant.ts
        ├── price.dictionary.ts
        ├── price.document.ts
        ├── Price.Template.tsx
        └── Price.Unit.tsx`}
        />
        <Docs.Description>
          <Docs.SubSubTitle>{l.trans({ en: "The four core files", ko: "기본 파일 네 개" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={coreFileRows} />
          <Docs.SubSubTitle>{l.trans({ en: "Optional UI files", ko: "선택: UI 파일" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={uiFileRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No service, signal or store.</strong> A scalar has no endpoint or client state of its own;
                    the parent module loads and saves it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>service, signal, store 파일은 없습니다.</strong> 스칼라에는 자체 엔드포인트나 클라이언트
                    상태가 없고, 불러오고 저장하는 일은 상위 모듈이 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No View, Zone or Util.</strong> Template and Unit are the only UI roles a scalar has.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>View, Zone, Util도 없습니다.</strong> 스칼라가 가질 수 있는 UI 역할은 Template과
                    Unit뿐입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Keep all three .ts files.</strong> The document stays beside the constant and dictionary
                    even when it is only <code>by(cnst.Price)</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>.ts 파일 세 개를 모두 둡니다.</strong> document가 <code>by(cnst.Price)</code> 한 줄뿐이어도
                    constant, dictionary와 함께 남겨 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="small-example" title={l.trans({ en: "Small Example", ko: "작은 예시" })}>
        <Docs.Title>{l.trans({ en: "Small Example", ko: "작은 예시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar should make sense on its own. It defines only the value's shape; the parent module decides how to save, load and render it.",
              ko: "스칼라는 그 자체로 이해되어야 합니다. 값의 모양만 정하고, 저장하고 불러오고 그리는 방식은 상위 모듈에 맡깁니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  The constant is one class. <code>amount</code> uses <code>Float</code> because money has decimals:
                </span>
              ),
              ko: (
                <span>
                  constant는 클래스 하나입니다. 금액에는 소수점이 있으므로 <code>amount</code>는 <code>Float</code>를
                  씁니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/__scalar/price/price.constant.ts"
          code={`import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
})) {}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The dictionary labels each field, and the document wraps the constant for the server:",
              ko: "dictionary는 각 필드에 라벨을 달고, document는 서버에서 쓸 수 있게 constant를 감쌉니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/__scalar/price/price.dictionary.ts · price.document.ts"
          code={`// price.dictionary.ts
import { scalarDictionary } from "akanjs/dictionary";

import type { Price } from "./price.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Price", "가격"]).desc(["Amount and currency", "금액과 통화"]))
  .model<Price>((t) => ({
    amount: t(["Amount", "금액"]).desc(["Amount of money", "금액"]),
    currency: t(["Currency", "통화"]).desc(["Currency code", "통화 코드"]),
  }));

// price.document.ts
import { by } from "akanjs/document";

import * as cnst from "./price.constant";

export class Price extends by(cnst.Price) {}`}
        />
        <Docs.Description>
          <Docs.SubSubTitle>{l.trans({ en: "Common mistakes", ko: "자주 하는 실수" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Writing <code>Number</code>.
                    </strong>{" "}
                    It is not a field type. Use <code>Float</code> for decimals and <code>Int</code> for counts.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>Number</code>를 쓰는 것.
                    </strong>{" "}
                    필드 타입이 아닙니다. 소수에는 <code>Float</code>, 개수에는 <code>Int</code>를 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Giving a scalar a life of its own.</strong> If it needs a list page, endpoints or its own
                    permissions, make it a database module instead.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>스칼라를 독립된 데이터처럼 다루는 것.</strong> 목록 페이지, 엔드포인트, 자체 권한이
                    필요하다면 데이터베이스 모듈로 만듭니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Writing five classes.</strong> A scalar is one <code>{"via((field) => ({ … }))"}</code>{" "}
                    class, not the Input, Object, Light, full and Insight set a database model has.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>클래스를 다섯 개 쓰는 것.</strong> 스칼라는 <code>{"via((field) => ({ … }))"}</code> 클래스
                    하나입니다. 데이터베이스 모델처럼 Input, Object, Light, full, Insight를 모두 쓰지 않습니다.
                  </span>
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
