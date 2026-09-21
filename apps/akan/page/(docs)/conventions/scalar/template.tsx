import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="template-overview" title="scalar.Template.tsx">
        <Docs.Title>scalar.Template.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar Template is a small reusable form component for editing a scalar value inside a parent domain form.",
              ko: "scalar Template은 상위 domain form 안에서 scalar 값을 편집하기 위한 작은 재사용 form component입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Use it when several parent modules edit the same value shape. For example, Product, Order, and Invoice can all reuse `Price.Template`.",
              ko: "여러 상위 module이 같은 값 형태를 편집할 때 사용합니다. 예를 들어 Product, Order, Invoice가 모두 `Price.Template`을 재사용할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-shape" title={l.trans({ en: "File Shape", ko: "파일 형태" })}>
        <Docs.Title>{l.trans({ en: "File Shape", ko: "파일 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Place the Template beside the scalar. The component is usually a client component because it receives a value and calls `onChange` when an input changes.",
              ko: "Template은 scalar 옆에 둡니다. input이 바뀔 때 value를 받고 `onChange`를 호출하므로 보통 client component입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          language="bash"
          code={`lib/
└── __scalar/
    └── price/
        ├── price.constant.ts
        └── Price.Template.tsx`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scalar-template" title={l.trans({ en: "Scalar Template Example", ko: "Scalar Template 예시" })}>
        <Docs.Title>{l.trans({ en: "Scalar Template Example", ko: "Scalar Template 예시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The scalar Template receives `value` and `onChange`. It does not load data or submit the parent form. It only edits the scalar value.",
              ko: "scalar Template은 `value`와 `onChange`를 받습니다. 데이터를 load하거나 상위 form을 submit하지 않고, scalar 값만 편집합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Price.Template.tsx"
          code={`"use client";

import { cnst, usePage } from "@apps/myapp/client";
import { Field } from "@libs/shared/ui";

interface GeneralProps {
  value: cnst.Price;
  onChange: (price: cnst.Price) => void;
}

export const General = ({ value, onChange }: GeneralProps) => {
  const { l } = usePage();
  const patch = (next: Partial<cnst.Price>) => onChange(new cnst.Price().set(value).set(next));

  return (
    <div className="space-y-4">
      <Field.Number label={l("price.amount")} value={value.amount} onChange={(amount) => patch({ amount })} />
      <Field.Text label={l("price.currency")} value={value.currency} onChange={(currency) => patch({ currency })} />
    </div>
  );
};`}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <span>
                Copy the scalar with <code>new cnst.Price().set(value)</code>, never <code>&#123;...value&#125;</code>.
                A model instance keeps its <code>Date</code> fields behind prototype accessors, so a spread and{" "}
                <code>Object.keys</code> both miss them and the copy silently loses every date.
              </span>
            ),
            ko: (
              <span>
                scalar 복사는 <code>&#123;...value&#125;</code>가 아니라 <code>new cnst.Price().set(value)</code>로
                합니다. model instance는 <code>Date</code> field를 prototype accessor 뒤에 두므로 spread와{" "}
                <code>Object.keys</code>가 모두 그 field를 빠뜨리고, 복사본은 모든 날짜를 조용히 잃습니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="parent-usage" title={l.trans({ en: "Use From Parent Form", ko: "상위 form에서 사용" })}>
        <Docs.Title>{l.trans({ en: "Use From Parent Form", ko: "상위 form에서 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The parent module keeps its normal form state. It passes the embedded scalar value to the scalar Template and uses the generated setter to store the changed value.",
              ko: "상위 module은 기존 form state를 그대로 유지합니다. embedded scalar 값을 scalar Template에 넘기고, 변경된 값은 generated setter로 저장합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Product.Template.tsx"
          code={`"use client";

import { Price, st, usePage } from "@apps/myapp/client";
import { Field } from "@libs/shared/ui";

export const General = () => {
  const { l } = usePage();
  const productForm = st.use.productForm();

  return (
    <div className="space-y-6">
      <Field.Text label={l("product.name")} value={productForm.name} onChange={st.do.setNameOnProduct} />
      <Price.Template.General value={productForm.price} onChange={st.do.setPriceOnProduct} />
    </div>
  );
};`}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <span>
                Pass the generated setter by reference. An inline arrow such as{" "}
                <code>onChange=&#123;(v) =&gt; st.do.setNameOnProduct(v)&#125;</code> runs identically but emits no{" "}
                <code>data-akan-action</code>, so the field publishes no agent tool and no E2E selector —{" "}
                <code>no-unpublished-form-setter</code> rejects it. A wrapper that genuinely transforms the value, as{" "}
                <code>patch</code> does above, stays legal.
              </span>
            ),
            ko: (
              <span>
                generated setter는 reference로 넘깁니다.{" "}
                <code>onChange=&#123;(v) =&gt; st.do.setNameOnProduct(v)&#125;</code> 같은 inline arrow는 동작은 같지만{" "}
                <code>data-akan-action</code>을 내보내지 않아 agent tool도 E2E selector도 게시되지 않습니다.{" "}
                <code>no-unpublished-form-setter</code>가 이를 거부합니다. 위의 <code>patch</code>처럼 값을 실제로
                변환하는 wrapper는 그대로 허용됩니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="custom-ui" title={l.trans({ en: "Field Or Custom UI", ko: "Field 또는 custom UI" })}>
        <Docs.Title>{l.trans({ en: "Field Or Custom UI", ko: "Field 또는 custom UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use a Field component for every scalar field — a bare input is never right for one, because Field is what carries the label, the validation surface and the data-akan-action annotation. When the scalar needs an interaction no Field covers, build an app-specific component that takes value and onChange the same way.",
              ko: "scalar field에는 항상 Field component를 사용합니다. label, validation surface, data-akan-action 주석을 싣는 것이 Field이므로 맨 input은 적절하지 않습니다. Field가 다루지 못하는 interaction이 필요하다면 value와 onChange를 같은 방식으로 받는 app 전용 component를 만드세요.",
            })}
          </div>
          <div>
            {l.trans({
              en: "For example, `Address.Template` might use normal text fields, while `Coordinate.Template` might use a map picker.",
              ko: "예를 들어 `Address.Template`은 일반 text field를 사용하고, `Coordinate.Template`은 map picker를 사용할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
