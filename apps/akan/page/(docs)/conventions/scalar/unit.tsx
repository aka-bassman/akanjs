import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const roleColumns = [
    { key: "scalar", label: l.trans({ en: "Scalar Unit", ko: "스칼라 Unit" }), caption: "Price.Unit" },
    { key: "parent", label: l.trans({ en: "Parent Unit", ko: "상위 Unit" }), caption: "Product.Unit" },
    { key: "elsewhere", label: l.trans({ en: "Elsewhere", ko: "다른 곳" }), caption: "page · Zone · Util" },
  ];
  const byScalar = { scalar: true };
  const byParent = { parent: true };
  const byElsewhere = { elsewhere: true };

  const roleGroups = [
    {
      label: l.trans({ en: "Drawing the value", ko: "값 그리기" }),
      rows: [
        {
          name: "price.amount · price.currency",
          desc: l.trans({
            en: "Formats the value the same way on every screen that shows it.",
            ko: "값을 보여 주는 모든 화면에서 같은 형식으로 표시합니다.",
          }),
          marks: byScalar,
        },
        {
          name: 'l("price.amount")',
          desc: l.trans({
            en: "Labels each field from the scalar's own dictionary.",
            ko: "각 필드의 라벨을 스칼라 자신의 dictionary에서 가져옵니다.",
          }),
          marks: byScalar,
        },
      ],
    },
    {
      label: l.trans({ en: "Around the value", ko: "값 주변" }),
      rows: [
        {
          name: "product.price",
          desc: l.trans({
            en: "Picks the scalar field off the parent model and passes it down.",
            ko: "상위 모델에서 스칼라 필드를 꺼내 아래로 넘깁니다.",
          }),
          marks: byParent,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "card · title · link", ko: "카드 · 제목 · 링크" })}</span>,
          desc: l.trans({
            en: "The surrounding layout, the model's other fields and its `href`.",
            ko: "주변 레이아웃, 모델의 다른 필드, `href`입니다.",
          }),
          marks: byParent,
        },
      ],
    },
    {
      label: l.trans({ en: "Never inside a Unit", ko: "Unit 안에서는 하지 않는 일" }),
      rows: [
        {
          name: "fetch.*",
          desc: l.trans({
            en: "The page loads the data and passes it down as props.",
            ko: "데이터는 page가 불러와 props로 내려보냅니다.",
          }),
          marks: byElsewhere,
        },
        {
          name: "Load.Units",
          desc: l.trans({
            en: "A Zone or page renders the list and draws one Unit per row.",
            ko: "목록은 Zone이나 page가 그리고, 행마다 Unit을 하나씩 씁니다.",
          }),
          marks: byElsewhere,
        },
        {
          name: "st.do.*",
          desc: l.trans({
            en: "A model action is a control in a Util, not part of the display.",
            ko: "모델 동작은 표시가 아니라 Util 안의 컨트롤이 맡습니다.",
          }),
          marks: byElsewhere,
        },
      ],
    },
  ];

  const termRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "scalar", ko: "스칼라" })}</span>,
      href: "/conventions/scalar/overview",
      desc: l.trans({
        en: "A small value object stored inside another model, such as `Price` with `amount` and `currency`.",
        ko: "다른 모델 안에 저장되는 작은 값 객체입니다. `amount`와 `currency`를 가진 `Price`가 그 예입니다.",
      }),
    },
    {
      name: "Unit",
      href: "/conventions/module/unit",
      desc: l.trans({
        en: "A server component that draws one thing as a card, row or table cell.",
        ko: "무언가 하나를 카드, 행, 표의 셀로 그리는 서버 컴포넌트입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "parent Unit", ko: "상위 Unit" })}</span>,
      desc: l.trans({
        en: "The Unit of the model that holds the scalar, such as `Product.Unit`.",
        ko: "스칼라를 필드로 가진 모델의 Unit입니다. 예를 들면 `Product.Unit`입니다.",
      }),
    },
    {
      name: "cnst.Light<Model>",
      href: "/conventions/module/unit#modelprops-light",
      desc: l.trans({
        en: "The lighter model a list hands to each Unit. It holds only the fields its constant picks.",
        ko: "목록이 Unit마다 넘겨주는 가벼운 모델입니다. constant가 고른 필드만 들어 있습니다.",
      }),
    },
  ];

  const fileCards = [
    {
      title: l.trans({ en: "Path", ko: "경로" }),
      code: "apps/<app>/lib/__scalar/<scalar>/<Scalar>.Unit.tsx",
      desc: l.trans({
        en: "In the scalar's own folder, beside its constant file.",
        ko: "스칼라 자신의 폴더에, constant 파일 옆에 둡니다.",
      }),
    },
    {
      title: l.trans({ en: "First Line", ko: "첫 줄" }),
      code: 'import type { cnst } from "@apps/<app>/client";',
      desc: l.trans({
        en: 'Imports, never "use client". A Unit is a server component.',
        ko: 'import로 시작하고 "use client"는 쓰지 않습니다. Unit은 서버 컴포넌트입니다.',
      }),
    },
    {
      title: l.trans({ en: "Exports", ko: "export" }),
      code: "Label · Summary · Badge",
      desc: l.trans({
        en: "Small arrow components named by display purpose, each taking the value as a prop.",
        ko: "표시 목적대로 이름 붙인 작은 화살표 함수 컴포넌트이고, 각각 값을 prop으로 받습니다.",
      }),
    },
    {
      title: l.trans({ en: "Used As", ko: "사용 예" }),
      code: "<Price.Unit.Label price={…} />",
      desc: l.trans({
        en: "The parent imports `Price` from `@apps/<app>/client`.",
        ko: "상위 Unit은 `@apps/<app>/client`에서 `Price`를 가져옵니다.",
      }),
    },
  ];

  const variantItems: IntroItem[] = [
    {
      name: "Label",
      desc: l.trans({
        en: "For a line in a card, showing the amount and currency in one span.",
        ko: "카드 안의 한 줄에 쓰며, 금액과 통화를 span 하나로 보여 줍니다.",
      }),
    },
    {
      name: "Compact",
      desc: l.trans({
        en: "For a narrow table cell, showing the amount only.",
        ko: "좁은 표 셀에 쓰며, 금액만 보여 줍니다.",
      }),
    },
    {
      name: "Detail",
      desc: l.trans({
        en: "For a detail View, showing each field on its own labelled line.",
        ko: "상세 View에 쓰며, 필드마다 라벨을 붙여 한 줄씩 보여 줍니다.",
      }),
    },
  ];

  const nextLinks = [
    {
      href: "/conventions/scalar/overview",
      title: l.trans({ en: "Scalar Overview", ko: "스칼라 개요" }),
      desc: l.trans({
        en: "When a value should be a scalar, and which files its folder holds.",
        ko: "어떤 값을 스칼라로 만들지, 스칼라 폴더에 어떤 파일이 들어가는지 다룹니다.",
      }),
    },
    {
      href: "/conventions/scalar/template",
      title: "Scalar.Template.tsx",
      desc: l.trans({
        en: "The editing half: how a parent form changes the same scalar.",
        ko: "편집을 맡는 짝입니다. 상위 폼이 같은 스칼라를 어떻게 바꾸는지 다룹니다.",
      }),
    },
    {
      href: "/conventions/module/unit",
      title: "Model.Unit.tsx",
      desc: l.trans({
        en: "The parent Unit: `ModelProps`, Light models and list rendering.",
        ko: "상위 Unit을 다룹니다. `ModelProps`, Light 모델, 목록 렌더링을 설명합니다.",
      }),
    },
    {
      href: "/conventions/scalar/dictionary",
      title: "scalar.dictionary.ts",
      desc: l.trans({
        en: "Where the labels a Detail variant reads are defined.",
        ko: "Detail 변형이 읽는 라벨을 정의하는 곳입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="unit-overview" title="Scalar.Unit.tsx">
        <Docs.Title>Scalar.Unit.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A scalar Unit is a small display component for one scalar value, used inside a parent's card, row,
                  detail page or table cell. Write one when several models should show the same value the same way:
                  Product, Order and Invoice can all reuse <code>Price.Unit.Label</code>.
                </span>
              ),
              ko: (
                <span>
                  스칼라 Unit은 스칼라 값 하나를 보여 주는 작은 표시용 컴포넌트로, 상위 모델의 카드, 행, 상세 페이지, 표
                  셀 안에서 씁니다. 여러 모델이 같은 값을 같은 모습으로 보여 줘야 할 때 만듭니다. 예를 들어 Product,
                  Order, Invoice가 모두 <code>Price.Unit.Label</code>을 재사용할 수 있습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "It draws the value and nothing else. The parent Unit decides the layout around it, and loading happens elsewhere:",
              ko: "이 파일은 값을 그리는 일만 합니다. 주변 레이아웃은 상위 Unit이 정하고, 데이터를 불러오는 일은 다른 곳이 맡습니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "The work", ko: "할 일" })}
            columns={roleColumns}
            groups={roleGroups}
            markLabel={l.trans({ en: "Done here", ko: "여기서 합니다" })}
            emptyLabel={l.trans({ en: "Not here", ko: "여기서 하지 않습니다" })}
          />
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-shape" title={l.trans({ en: "File Shape", ko: "파일 위치와 모양" })}>
        <Docs.Title>{l.trans({ en: "File Shape", ko: "파일 위치와 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The Unit sits in the scalar's own folder under <code>lib/__scalar/</code>, next to the constant that
                  defines the value:
                </span>
              ),
              ko: (
                <span>
                  Unit은 <code>lib/__scalar/</code> 아래 스칼라 자신의 폴더에 둡니다. 값을 정의하는 constant와 나란히
                  놓입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo"
            language="bash"
            showLineNumbers={false}
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
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {fileCards.map((card) => (
              <div key={card.code} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{card.title}</div>
                <code className={chip}>{card.code}</code>
                <div className="mt-2 text-foreground/70 text-sm">
                  <Docs.CodeText>{card.desc}</Docs.CodeText>
                </div>
              </div>
            ))}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Name the file after its folder.</strong> The <code>price/</code> folder holds{" "}
                    <code>Price.Unit.tsx</code>, with the first letter capitalized, and its exports are reached as{" "}
                    <code>{"Price.Unit.<Name>"}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파일 이름은 폴더 이름을 따릅니다.</strong> <code>price/</code> 폴더에는 첫 글자만 대문자로
                    바꾼 <code>Price.Unit.tsx</code>를 두고, 그 export는 <code>{"Price.Unit.<Name>"}</code>으로 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A scalar has two UI files at most.</strong> <code>{"<Scalar>.Template.tsx"}</code> edits the
                    value and <code>{"<Scalar>.Unit.tsx"}</code> displays it. A scalar folder has no Zone, View or Util.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>스칼라의 UI 파일은 많아야 두 개입니다.</strong> <code>{"<Scalar>.Template.tsx"}</code>는
                    값을 편집하고 <code>{"<Scalar>.Unit.tsx"}</code>는 값을 보여 줍니다. 스칼라 폴더에는 Zone, View,
                    Util이 없습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scalar-unit" title={l.trans({ en: "Scalar Unit Example", ko: "스칼라 Unit 예시" })}>
        <Docs.Title>{l.trans({ en: "Scalar Unit Example", ko: "스칼라 Unit 예시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar Unit receives a scalar value and renders it. It loads no data, manages no list and triggers no model action:",
              ko: "스칼라 Unit은 스칼라 값을 받아 그립니다. 데이터를 불러오지 않고, 목록을 관리하지 않으며, 모델 동작을 실행하지도 않습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/__scalar/price/Price.Unit.tsx"
            code={`import type { cnst } from "@apps/koyo/client";

interface LabelProps {
  className?: string;
  price: cnst.Price;
}
export const Label = ({ className, price }: LabelProps) => {
  return (
    <span className={className}>
      {price.amount.toLocaleString()} {price.currency}
    </span>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Declare your own props.</strong> <code>ModelProps</code> needs a model with an{" "}
                    <code>id</code>, and a scalar has none. Write <code>LabelProps</code> with the value as{" "}
                    <code>price: cnst.Price</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>props 타입은 직접 선언합니다.</strong> <code>ModelProps</code>는 <code>id</code>가 있는
                    모델을 요구하는데, 스칼라에는 <code>id</code>가 없습니다. 값을 <code>price: cnst.Price</code>로 받는{" "}
                    <code>LabelProps</code>를 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Take <code>className</code>, first in the interface.
                    </strong>{" "}
                    The parent picks the color and size; the Unit owns only the format.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>className</code>을 받고, 인터페이스 맨 앞에 둡니다.
                    </strong>{" "}
                    색과 크기는 상위 Unit이 정하고, 스칼라 Unit은 표시 형식만 책임집니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>import type</code> is enough here.
                    </strong>{" "}
                    <code>cnst</code> is only used as a type in this file. Beside a value import it becomes{" "}
                    <code>type cnst</code>, as in the parent example below.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      여기서는 <code>import type</code>이면 충분합니다.
                    </strong>{" "}
                    이 파일에서 <code>cnst</code>는 타입으로만 쓰입니다. 값 import와 함께 쓸 때는 아래 상위 Unit
                    예시처럼 <code>type cnst</code>로 적습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>A Unit is a server component, so it never starts with "use client".</strong> Lint rejects the
                  directive, React hooks such as <code>useState</code>, and an <code>st</code> import in every{" "}
                  <code>*.Unit.tsx</code>, scalar Units included. <code>usePage()</code> and <code>l()</code> still work
                  here.
                </span>
              ),
              ko: (
                <span>
                  <strong>Unit은 서버 컴포넌트이므로 "use client"로 시작하지 않습니다.</strong> 스칼라 Unit을 포함한
                  모든 <code>*.Unit.tsx</code>에서 이 지시문, <code>useState</code> 같은 React hook, <code>st</code>{" "}
                  import는 lint 오류입니다. <code>usePage()</code>와 <code>l()</code>은 여기서도 그대로 씁니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="parent-usage" title={l.trans({ en: "Use From Parent Unit", ko: "상위 Unit에서 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Use From Parent Unit", ko: "상위 Unit에서 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A parent Unit imports the scalar Unit and passes it the scalar field of its model. The format is reused, while the parent card still decides the layout around it:",
              ko: "상위 Unit은 스칼라 Unit을 가져와 자기 모델의 스칼라 필드를 넘깁니다. 표시 형식은 재사용하고, 주변 레이아웃은 여전히 상위 카드가 정합니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/product/Product.Unit.tsx"
            code={`import { type cnst, Price } from "@apps/koyo/client";
import { cn, type ModelProps } from "akanjs/client";
import { Layout } from "akanjs/ui";

export const Card = ({ className, product, href }: ModelProps<"product", cnst.LightProduct>) => {
  return (
    <Layout.Unit className={cn("rounded-xl border", className)} href={href}>
      <div className="font-bold">{product.name}</div>
      <Price.Unit.Label price={product.price} className="text-foreground/70" />
    </Layout.Unit>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>product.price</code> is the value.
                    </strong>{" "}
                    The scalar lives inside the parent model as one field.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>product.price</code>가 넘겨줄 값입니다.
                    </strong>{" "}
                    스칼라는 상위 모델 안에 필드 하나로 들어 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The Light model has to carry the field.</strong> <code>cnst.LightProduct</code> holds only
                    the fields its constant picks, so list <code>"price"</code> there:{" "}
                    <code>{'via(ProductObject, ["name", "price"] as const, …)'}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>Light 모델에 그 필드가 있어야 합니다.</strong> <code>cnst.LightProduct</code>에는 constant가
                    고른 필드만 있으므로, 거기에 <code>"price"</code>를 넣습니다:{" "}
                    <code>{'via(ProductObject, ["name", "price"] as const, …)'}</code>.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>Price</code> comes from <code>@apps/koyo/client</code>,
                    </strong>{" "}
                    the same import that gives you <code>cnst</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>Price</code>는 <code>@apps/koyo/client</code>에서 가져옵니다.
                    </strong>{" "}
                    <code>cnst</code>와 같은 import 한 줄입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The parent styles the value from outside.</strong>{" "}
                    <code>{'className="text-foreground/70"'}</code> changes its color; the format stays the scalar's.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>값의 스타일은 상위 Unit이 바깥에서 정합니다.</strong>{" "}
                    <code>{'className="text-foreground/70"'}</code>로 색을 바꿔도 표시 형식은 스칼라 Unit의 것
                    그대로입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="variants" title={l.trans({ en: "Small Variants", ko: "작은 변형" })}>
        <Docs.Title>{l.trans({ en: "Small Variants", ko: "작은 변형" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Add a variant only when the same scalar needs a different display size. Each one still renders just the value:",
              ko: "변형은 같은 스칼라를 다른 크기로 보여 줘야 할 때만 추가합니다. 어느 변형이든 값을 그리는 일만 합니다:",
            })}
          </div>
          <Docs.IntroTable type="export" items={variantItems} />
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Compact</code> and <code>Detail</code> sit in the same file as <code>Label</code>:
                </span>
              ),
              ko: (
                <span>
                  <code>Compact</code>와 <code>Detail</code>은 <code>Label</code>과 같은 파일에 둡니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/__scalar/price/Price.Unit.tsx"
            code={`import { type cnst, usePage } from "@apps/koyo/client";

interface CompactProps {
  className?: string;
  price: cnst.Price;
}
export const Compact = ({ className, price }: CompactProps) => {
  return <span className={className}>{price.amount.toLocaleString()}</span>;
};

interface DetailProps {
  className?: string;
  price: cnst.Price;
}
export const Detail = ({ className, price }: DetailProps) => {
  const { l } = usePage();
  return (
    <div className={className}>
      <div>
        {l("price.amount")}: {price.amount.toLocaleString()}
      </div>
      <div>
        {l("price.currency")}: {price.currency}
      </div>
    </div>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Name a variant by its purpose, not by the model.</strong> Write <code>Compact</code>, never{" "}
                    <code>PriceCompact</code>: the call site already reads <code>Price.Unit.Compact</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>변형 이름은 모델이 아니라 용도로 짓습니다.</strong> <code>PriceCompact</code>가 아니라{" "}
                    <code>Compact</code>로 씁니다. 쓰는 쪽에서 이미 <code>Price.Unit.Compact</code>로 읽히기 때문입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Labels come from the scalar's dictionary.</strong> <code>{'l("price.amount")'}</code> reads
                    the <code>price.dictionary.ts</code> in the same folder.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>라벨은 스칼라의 dictionary에서 가져옵니다.</strong> <code>{'l("price.amount")'}</code>는
                    같은 폴더의 <code>price.dictionary.ts</code>를 읽습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>usePage()</code> is legal here.
                    </strong>{" "}
                    Translation runs on the server, so <code>Detail</code> stays a server component.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>usePage()</code>는 여기서 써도 됩니다.
                    </strong>{" "}
                    번역은 서버에서도 동작하므로 <code>Detail</code>은 서버 컴포넌트로 남습니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Common mistakes", ko: "자주 하는 실수" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Formatting the value inline in each parent.</strong> Three cards with their own{" "}
                    <code>toLocaleString()</code> drift apart; one <code>Price.Unit.Label</code> does not.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>상위 카드마다 값 형식을 직접 쓰기.</strong> 카드 세 개가 각자 <code>toLocaleString()</code>
                    을 쓰면 모양이 조금씩 달라집니다. <code>Price.Unit.Label</code> 하나로 모읍니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Adding a variant for a color change.</strong> Pass <code>className</code> instead; a variant
                    is for a different size or amount of detail.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>색만 바꾸려고 변형 추가하기.</strong> 대신 <code>className</code>을 넘깁니다. 변형은 크기나
                    보여 줄 내용의 양이 다를 때 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Typing the props with <code>ModelProps</code>.
                    </strong>{" "}
                    A scalar has no <code>id</code>, so write a plain props interface.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      props를 <code>ModelProps</code>로 쓰기.
                    </strong>{" "}
                    스칼라에는 <code>id</code>가 없으므로 평범한 props 인터페이스를 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Loading or acting inside the Unit.</strong> <code>fetch.*</code> belongs in the page and{" "}
                    <code>st.do.*</code> in a Util; the Unit only draws what it receives.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>Unit 안에서 불러오거나 동작 실행하기.</strong> <code>fetch.*</code>는 page에,{" "}
                    <code>st.do.*</code>는 Util에 둡니다. Unit은 받은 값을 그리기만 합니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "이어서 읽기" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={nextLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
