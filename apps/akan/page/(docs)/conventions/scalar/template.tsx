import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const roleColumns = [
    { key: "scalar", label: l.trans({ en: "Scalar", ko: "스칼라" }), caption: "Price.Template" },
    { key: "parent", label: l.trans({ en: "Parent", ko: "상위 폼" }), caption: "Product.Template" },
    { key: "shell", label: l.trans({ en: "Shell", ko: "편집 셸" }), caption: "Load.Edit" },
  ];
  const byScalar = { scalar: true };
  const byParent = { parent: true };
  const byShell = { shell: true };

  const roleGroups = [
    {
      label: l.trans({ en: "Editing the value", ko: "값 편집" }),
      rows: [
        {
          name: "Field.*",
          desc: l.trans({
            en: "One control per scalar field, labelled from the scalar's dictionary.",
            ko: "스칼라 필드마다 컨트롤을 하나씩 그리고, 라벨은 스칼라 dictionary에서 가져옵니다.",
          }),
          marks: byScalar,
        },
        {
          name: "new cnst.Price().set(value)",
          desc: l.trans({
            en: "Builds the changed value and hands it to `onChange`.",
            ko: "바뀐 값을 새로 만들어 `onChange`로 넘깁니다.",
          }),
          marks: byScalar,
        },
      ],
    },
    {
      label: l.trans({ en: "Keeping and saving it", ko: "값 보관과 저장" }),
      rows: [
        {
          name: "st.use.productForm()",
          desc: l.trans({
            en: "Reads the parent's draft, where the price is one field.",
            ko: "상위 폼의 초안을 읽습니다. price는 그 안의 필드 하나입니다.",
          }),
          marks: byParent,
        },
        {
          name: "st.do.setPriceOnProduct",
          desc: l.trans({
            en: "Writes the whole changed price back into that draft.",
            ko: "바뀐 price 전체를 그 초안에 다시 씁니다.",
          }),
          marks: byParent,
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "load · open · submit", ko: "불러오기 · 열기 · 제출" })}</span>
          ),
          desc: l.trans({
            en: "An edit shell such as `Load.Edit` does this around the parent Template.",
            ko: "`Load.Edit` 같은 편집 셸이 상위 Template을 감싸서 맡습니다.",
          }),
          marks: byShell,
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
      name: <span className="font-sans">{l.trans({ en: "parent form", ko: "상위 폼" })}</span>,
      desc: l.trans({
        en: "The Template of the model that holds the scalar, such as `Product.Template`.",
        ko: "스칼라를 필드로 가진 모델의 Template입니다. 예를 들면 `Product.Template`입니다.",
      }),
    },
    {
      name: "<model>Form",
      desc: l.trans({
        en: "The store's draft of the record being edited, such as `productForm`.",
        ko: "store가 들고 있는, 편집 중인 레코드의 초안입니다. 예를 들면 `productForm`입니다.",
      }),
    },
    {
      name: "st.do.set<Field>On<Model>",
      desc: l.trans({
        en: "The setter the store generates for each field, such as `setPriceOnProduct`.",
        ko: "store가 필드마다 자동으로 만드는 setter입니다. 예를 들면 `setPriceOnProduct`입니다.",
      }),
    },
  ];

  const fileCards = [
    {
      title: l.trans({ en: "Path", ko: "경로" }),
      code: "apps/<app>/lib/__scalar/<scalar>/<Scalar>.Template.tsx",
      desc: l.trans({
        en: "In the scalar's own folder, beside its constant file.",
        ko: "스칼라 자신의 폴더에, constant 파일 옆에 둡니다.",
      }),
    },
    {
      title: l.trans({ en: "First Line", ko: "첫 줄" }),
      code: '"use client";',
      desc: l.trans({
        en: "Always. Its fields handle input events, which only run in the browser.",
        ko: "언제나 씁니다. 필드의 입력 이벤트 처리는 브라우저에서만 실행되기 때문입니다.",
      }),
    },
    {
      title: l.trans({ en: "Exports", ko: "export" }),
      code: "General",
      desc: l.trans({
        en: "Named arrow components, each taking `value` and `onChange`.",
        ko: "이름 있는 화살표 함수 컴포넌트이고, 각각 `value`와 `onChange`를 받습니다.",
      }),
    },
    {
      title: l.trans({ en: "Used As", ko: "쓰는 모양" }),
      code: "<Price.Template.General value={…} onChange={…} />",
      desc: l.trans({
        en: "The parent form imports `Price` from `@apps/<app>/client`.",
        ko: "상위 폼은 `@apps/<app>/client`에서 `Price`를 가져옵니다.",
      }),
    },
  ];

  const controlColumns = [
    { key: "scalar", label: l.trans({ en: "Scalar", ko: "스칼라" }) },
    { key: "control", label: l.trans({ en: "Control", ko: "컨트롤" }), code: true },
    { key: "note", label: l.trans({ en: "Note", ko: "참고" }) },
  ];
  const controlRows = [
    {
      scalar: "`Price`",
      control: "Field.Number · Field.Text",
      note: l.trans({
        en: "Plain number and text fields, as in the example above.",
        ko: "위 예시처럼 평범한 숫자 필드와 텍스트 필드입니다.",
      }),
    },
    {
      scalar: "`Address`",
      control: "Field.Text · Field.Postcode",
      note: l.trans({
        en: "Text fields, or `Postcode` for a Kakao address search that also returns a coordinate.",
        ko: "텍스트 필드를 쓰거나, 좌표까지 함께 돌려주는 카카오 주소 검색 `Postcode`를 씁니다.",
      }),
    },
    {
      scalar: "`Coordinate`",
      control: "Field.Coordinate",
      note: l.trans({
        en: "A map picker from `@libs/shared/ui` that sets the point where you click.",
        ko: "`@libs/shared/ui`에 있는 지도 선택기로, 지도를 클릭한 곳이 좌표가 됩니다.",
      }),
    },
    {
      scalar: l.trans({ en: "Anything else", ko: "그 밖의 값" }),
      control: "<YourComponent>",
      note: l.trans({
        en: "Your own component taking `value` and `onChange`, built on `Input` from `akanjs/ui` if needed.",
        ko: "`value`와 `onChange`를 받는 앱 전용 컴포넌트를 만들고, 필요하면 `akanjs/ui`의 `Input`을 씁니다.",
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
      href: "/conventions/scalar/unit",
      title: "Scalar.Unit.tsx",
      desc: l.trans({
        en: "The display half: how a parent card shows the same scalar.",
        ko: "표시를 맡는 짝입니다. 상위 카드가 같은 스칼라를 어떻게 보여 주는지 다룹니다.",
      }),
    },
    {
      href: "/conventions/module/template",
      title: "Model.Template.tsx",
      desc: l.trans({
        en: "The parent form, its generated setters and the edit shells that open it.",
        ko: "상위 폼과 자동 생성 setter, 그 폼을 여는 편집 셸을 다룹니다.",
      }),
    },
    {
      href: "/references/ui/forms",
      title: l.trans({ en: "Form Controls", ko: "폼 컨트롤" }),
      desc: l.trans({
        en: "Every `Field` member and `Input`, with their props and defaults.",
        ko: "모든 `Field` 멤버와 `Input`의 prop, 기본값을 정리했습니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="template-overview" title="Scalar.Template.tsx">
        <Docs.Title>Scalar.Template.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A scalar Template is a small form piece that edits one scalar value inside a parent model's form.
                  Write one when several models hold the same value: Product, Order and Invoice can all reuse{" "}
                  <code>Price.Template</code>.
                </span>
              ),
              ko: (
                <span>
                  스칼라 Template은 상위 모델의 폼 안에서 스칼라 값 하나를 편집하는 작은 폼 조각입니다. 여러 모델이 같은
                  값을 가질 때 만듭니다. 예를 들어 Product, Order, Invoice가 모두 <code>Price.Template</code>을 재사용할
                  수 있습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "It edits the value and nothing else. Reading the draft, saving it and submitting the form happen elsewhere:",
              ko: "이 파일은 값을 편집하는 일만 합니다. 초안을 읽고, 저장하고, 폼을 제출하는 일은 다른 곳이 맡습니다:",
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
                  The Template sits in the scalar's own folder under <code>lib/__scalar/</code>, next to the constant
                  that defines the value and the dictionary that labels it:
                </span>
              ),
              ko: (
                <span>
                  Template은 <code>lib/__scalar/</code> 아래 스칼라 자신의 폴더에 둡니다. 값을 정의하는 constant, 라벨을
                  담은 dictionary와 나란히 놓입니다:
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
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Name the file after its folder.</strong> The <code>price/</code> folder holds{" "}
                    <code>Price.Template.tsx</code>, with the first letter capitalized.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파일 이름은 폴더 이름을 따릅니다.</strong> <code>price/</code> 폴더에는 첫 글자만 대문자로
                    바꾼 <code>Price.Template.tsx</code>를 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scalar-template" title={l.trans({ en: "Scalar Template Example", ko: "스칼라 Template 예시" })}>
        <Docs.Title>{l.trans({ en: "Scalar Template Example", ko: "스칼라 Template 예시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A scalar Template receives <code>value</code> and <code>onChange</code> and edits only that value. It
                  loads no data and never submits the parent form:
                </span>
              ),
              ko: (
                <span>
                  스칼라 Template은 <code>value</code>와 <code>onChange</code>를 받아 그 값만 편집합니다. 데이터를
                  불러오지 않고, 상위 폼을 제출하지도 않습니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/__scalar/price/Price.Template.tsx"
            code={`"use client";
import { cnst, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  value: cnst.Price;
  onChange: (price: cnst.Price) => void;
}
export const General = ({ className, value, onChange }: GeneralProps) => {
  const { l } = usePage();
  const patch = (next: Partial<cnst.Price>) => onChange(new cnst.Price().set(value).set(next));
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Field.Number label={l("price.amount")} value={value.amount} onChange={(amount) => patch({ amount })} />
      <Field.Text label={l("price.currency")} value={value.currency} onChange={(currency) => patch({ currency })} />
    </div>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>value</code> comes in, <code>onChange</code> goes out.
                    </strong>{" "}
                    The parent owns the value, so the Template keeps no <code>useState</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>value</code>로 받고 <code>onChange</code>로 돌려줍니다.
                    </strong>{" "}
                    값의 주인은 상위 폼이므로 Template에는 <code>useState</code>가 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>patch</code> hands back a whole <code>Price</code>.
                    </strong>{" "}
                    It copies <code>value</code>, applies the one changed field and passes the result to{" "}
                    <code>onChange</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>patch</code>는 <code>Price</code> 전체를 돌려줍니다.
                    </strong>{" "}
                    <code>value</code>를 복사하고, 바뀐 필드 하나만 적용한 결과를 <code>onChange</code>에 넘깁니다.
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
                    <strong>The inner fields are not agent tools.</strong> <code>patch</code> is a closure, so they emit
                    no <code>data-akan-action</code>. An agent sets the price through the parent's{" "}
                    <code>fillProductForm</code> instead.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>안쪽 필드는 에이전트 툴이 되지 않습니다.</strong> <code>patch</code>는 클로저라서{" "}
                    <code>data-akan-action</code>이 붙지 않습니다. 에이전트는 대신 상위 폼의{" "}
                    <code>fillProductForm</code>으로 price를 채웁니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Copy the scalar with <code>new cnst.Price().set(value)</code>, never <code>{"{...value}"}</code>.
                  </strong>{" "}
                  A model instance keeps its <code>Date</code> fields behind prototype accessors, so a spread and{" "}
                  <code>Object.keys</code> both miss them and the copy silently loses every date.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    스칼라는 <code>{"{...value}"}</code>가 아니라 <code>new cnst.Price().set(value)</code>로 복사합니다.
                  </strong>{" "}
                  모델 인스턴스는 <code>Date</code> 필드를 prototype accessor 뒤에 두므로, spread와{" "}
                  <code>Object.keys</code> 모두 그 필드를 빠뜨립니다. 그러면 복사본은 아무 경고 없이 날짜를 전부
                  잃습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="parent-usage" title={l.trans({ en: "Use From Parent Form", ko: "상위 폼에서 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Use From Parent Form", ko: "상위 폼에서 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The parent Template stays an ordinary store-driven form. It passes the embedded scalar to the scalar Template and stores what comes back with the generated setter:",
              ko: "상위 Template은 store로 움직이는 평범한 폼 그대로입니다. 안에 든 스칼라 값을 스칼라 Template에 넘기고, 돌아온 값은 자동 생성된 setter로 저장합니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/product/Product.Template.tsx"
            code={`"use client";
import { Price, st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const productForm = st.use.productForm();
  return (
    <Layout.Template className={className}>
      <Field.Text label={l("product.name")} value={productForm.name} onChange={st.do.setNameOnProduct} />
      <Price.Template.General value={productForm.price} onChange={st.do.setPriceOnProduct} />
    </Layout.Template>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>productForm.price</code> is the value.
                    </strong>{" "}
                    The price lives in the parent's draft as one field.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>productForm.price</code>가 넘겨줄 값입니다.
                    </strong>{" "}
                    price는 상위 폼 초안 안에 필드 하나로 들어 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>st.do.setPriceOnProduct</code> receives the whole new <code>Price</code>.
                    </strong>{" "}
                    The store generates a setter for every field, scalar fields included.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>st.do.setPriceOnProduct</code>는 새 <code>Price</code> 전체를 받습니다.
                    </strong>{" "}
                    store는 스칼라 필드를 포함한 모든 필드에 setter를 만들어 둡니다.
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
                    the same import that gives you <code>st</code> and <code>usePage</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>Price</code>는 <code>@apps/koyo/client</code>에서 가져옵니다.
                    </strong>{" "}
                    <code>st</code>, <code>usePage</code>와 같은 import 한 줄입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Pass the generated setter by reference.</strong> An inline arrow such as{" "}
                  <code>{"onChange={(v) => st.do.setNameOnProduct(v)}"}</code> runs the same but emits no{" "}
                  <code>data-akan-action</code>, so the field publishes no agent tool and no E2E selector, and lint
                  rejects it (<code>no-unpublished-form-setter</code>). A wrapper that really transforms the value, as{" "}
                  <code>patch</code> does above, stays legal.
                </span>
              ),
              ko: (
                <span>
                  <strong>자동 생성 setter는 참조로 넘깁니다.</strong>{" "}
                  <code>{"onChange={(v) => st.do.setNameOnProduct(v)}"}</code> 같은 인라인 화살표 함수는 똑같이
                  동작하지만 <code>data-akan-action</code>을 내보내지 않아, 그 필드는 에이전트 툴도 E2E selector도 되지
                  못하고 lint 규칙 <code>no-unpublished-form-setter</code>에도 걸립니다. 위의 <code>patch</code>처럼
                  값을 실제로 바꾸는 wrapper는 그대로 허용됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="custom-ui" title={l.trans({ en: "Field Or Custom UI", ko: "Field 또는 직접 만든 UI" })}>
        <Docs.Title>{l.trans({ en: "Field Or Custom UI", ko: "Field 또는 직접 만든 UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Give every scalar field a <code>Field.*</code> control, never a bare <code>{"<input>"}</code>. A Field
                  brings the label, the validation and, when handed a store setter, the <code>data-akan-action</code>{" "}
                  attribute. Pick the control by the value's shape:
                </span>
              ),
              ko: (
                <span>
                  스칼라 필드에는 언제나 <code>Field.*</code> 컨트롤을 쓰고, <code>{"<input>"}</code>을 직접 쓰지
                  않습니다. Field가 라벨과 검증을, store setter를 받으면 <code>data-akan-action</code> 속성까지 붙여
                  주기 때문입니다. 컨트롤은 값의 모양에 따라 고릅니다:
                </span>
              ),
            })}
          </div>
          <Docs.Table columns={controlColumns} rows={controlRows} stacked />
          <div>
            {l.trans({
              en: (
                <span>
                  When no Field covers the interaction, build an app component that takes <code>value</code> and{" "}
                  <code>onChange</code> the same way, so the scalar Template can use it like a Field.
                </span>
              ),
              ko: (
                <span>
                  맞는 Field가 없으면 <code>value</code>와 <code>onChange</code>를 같은 방식으로 받는 앱 전용 컴포넌트를
                  만듭니다. 그러면 스칼라 Template에서 Field처럼 쓸 수 있습니다.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Common mistakes", ko: "자주 하는 실수" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Copying with a spread.</strong> <code>{"{...value}"}</code> drops every <code>Date</code>{" "}
                    field. Build the copy with <code>new cnst.Price().set(value)</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>spread로 복사하기.</strong> <code>{"{...value}"}</code>는 <code>Date</code> 필드를 모두
                    빠뜨립니다. 복사본은 <code>new cnst.Price().set(value)</code>로 만듭니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Keeping the value in <code>useState</code>.
                    </strong>{" "}
                    The parent's draft already holds it, and the Template only forwards changes.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      값을 <code>useState</code>에 두기.
                    </strong>{" "}
                    값은 이미 상위 폼의 초안에 있고, Template은 바뀐 값을 넘겨주기만 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Loading or saving inside the scalar Template.</strong> Server calls go in a store action,
                    and the edit shell around the parent submits the form.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>스칼라 Template 안에서 불러오거나 저장하기.</strong> 서버 호출은 store 액션에 두고, 폼
                    제출은 상위 폼을 감싼 편집 셸이 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Wrapping the parent's setter in an arrow.</strong> Hand <code>st.do.setPriceOnProduct</code>{" "}
                    over as it is.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>상위 폼의 setter를 화살표 함수로 감싸기.</strong> <code>st.do.setPriceOnProduct</code>를
                    그대로 넘깁니다.
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
