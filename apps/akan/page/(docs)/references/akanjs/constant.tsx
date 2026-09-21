import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const symbols = [
    {
      name: "via",
      desc: l.trans({
        en: "Builds every Akan constant class. It is an overloaded function, not a namespace — there is no `via.model` or `via.scalar`. Which of its five forms you get is decided by the arguments: a lone builder callback is an input or a scalar, an input class plus a builder is the object, a model plus a builder is the insight, a model plus a field-name tuple plus a resolver is the Light class, and an object plus a Light class plus a resolver is the full model.",
        ko: "모든 Akan constant class를 만듭니다. namespace가 아니라 overloaded function이므로 `via.model`이나 `via.scalar`는 없습니다. 어떤 형태가 되는지는 argument가 결정합니다. builder callback 하나면 input 또는 scalar, input class와 builder면 object, model과 builder면 insight, model과 field name tuple과 resolver면 Light class, object와 Light class와 resolver면 full model입니다.",
      }),
      code: `import { dayjs, enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

import { File } from "../file/file.constant";

export class BannerStatus extends enumOf("bannerStatus", ["active", "displaying"] as const) {}

export class BannerInput extends via((field) => ({
  title: field(String, { text: "title" }).optional(),
  image: field(File, { text: "thumb" }).optional(),
  href: field(String),
  from: field(Date, { default: dayjs() }),
})) {}

export class BannerObject extends via(BannerInput, (field) => ({
  status: field(BannerStatus, { default: "active", text: "filter" }),
})) {}

export class LightBanner extends via(BannerObject, ["title", "image", "href", "status"] as const, (resolve) => ({})) {}

export class Banner extends via(BannerObject, LightBanner, (resolve) => ({})) {}

export class BannerInsight extends via(Banner, (field) => ({})) {}`,
    },
    {
      name: "field",
      desc: l.trans({
        en: "The builder handed to every `via` callback. It declares one stored property: the value type comes first, options come second, and `.optional()` makes the property nullable. An array field is the type in brackets, a relation is the other model's class, and an enum is an `enumOf` class.",
        ko: "모든 `via` callback에 전달되는 builder입니다. stored property 하나를 선언합니다. value type이 먼저 오고 option이 뒤에 오며 `.optional()`이 property를 nullable로 만듭니다. array field는 type을 bracket으로 감싸고, relation은 상대 model의 class, enum은 `enumOf` class입니다.",
      }),
      code: `import { Any, Int } from "akanjs/base";
import { via } from "akanjs/constant";

import { File } from "../file/file.constant";

export class ProductInput extends via((field) => ({
  name: field(String, { minlength: 2, maxlength: 80, text: "title" }),
  price: field(Int, { default: 0, min: 0 }),
  tags: field([String], { text: "tag" }),
  cover: field(File, { cascade: "removeRef" }).optional(),
  status: field(ProductStatus, { default: "draft" }),
  spec: field<{ weightG: number }>(Any, { default: {} }),
})) {}`,
    },
    {
      name: "field.visual / field.hidden / field.secret",
      desc: l.trans({
        en: "Three narrowings of the same builder. `field.visual` stays an ordinary stored property and is stripped only where a value is masked for an AI caller, so it is about cost rather than secrecy. `field.hidden` and `field.secret` never leave the server: the response builder skips them and hydration writes `null` over the key, so the value reads `null` on the client behind a type that still promises a string. Guard it with `??` or `== null` — `=== undefined`, a destructuring default and an optional parameter default all sail past a present-but-null key.",
        ko: "같은 builder를 세 가지로 좁힌 것입니다. `field.visual`은 평범한 stored property로 남고 AI caller를 위해 값을 masking하는 지점에서만 제거되므로 secrecy가 아니라 cost 문제입니다. `field.hidden`과 `field.secret`은 server를 벗어나지 않습니다. response builder가 건너뛰고 hydration이 key에 `null`을 덮어쓰므로, string을 약속하는 type 뒤에서 client는 `null`을 읽습니다. `??` 또는 `== null`로 방어하세요. `=== undefined`, destructuring default, optional parameter default는 key가 존재하면서 null인 경우를 모두 지나칩니다.",
      }),
      code: `import { via } from "akanjs/constant";

export class ProfileInput extends via((field) => ({
  nickname: field(String, { text: "title" }),
  renderedBio: field.visual(String).optional(),
  loginProvider: field.hidden(String),
  password: field.secret(String, { type: "password", minlength: 8 }).optional(),
})) {}

const passwordLabel = profile.password ?? "(not set)";`,
    },
    {
      name: "resolve",
      desc: l.trans({
        en: "A separate top-level builder, handed to the resolver callback of the Light and full `via` forms. It declares a derived field rather than a stored property: nothing is persisted, and the value is computed per response by a `resolveField` entry of the same name in the module's `*.signal.ts` Internal class, which receives the parent record as its argument. Declaring one without that entry throws when the field is first returned, which is why most modules leave both resolver callbacks returning an empty object.",
        ko: "별도의 top-level builder로, Light와 full `via` 형태의 resolver callback에 전달됩니다. stored property가 아니라 derived field를 선언합니다. 저장되지 않으며, 값은 module의 `*.signal.ts` Internal class에 있는 같은 이름의 `resolveField` 항목이 응답마다 계산합니다. 이 항목은 parent record를 argument로 받습니다. 해당 항목 없이 선언하면 field를 처음 반환할 때 throw하므로 대부분의 module은 두 resolver callback을 빈 object로 둡니다.",
      }),
      code: `import { Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class Order extends via(OrderObject, LightOrder, (resolve) => ({
  totalPrice: resolve(Int),
})) {}`,
    },
    {
      name: "getDefault",
      desc: l.trans({
        en: "Builds a default object from a field object, respecting primitive defaults, nullable fields, arrays, maps, and field-level default callbacks. Model classes expose the same result through `Model.getDefault()`.",
        ko: "field object에서 default object를 만듭니다. primitive default, nullable field, array, map, field-level default callback을 반영하며 model class는 같은 결과를 `Model.getDefault()`로 제공합니다.",
      }),
      code: `import { FIELD_META } from "akanjs/base";
import { getDefault } from "akanjs/constant";

const defaults = User.getDefault();
const schemaDefaults = getDefault(User[FIELD_META]);`,
    },
    {
      name: "DocumentModel / DefaultOf / QueryOf",
      desc: l.trans({
        en: "Public type helpers used by documents, stores, and tests. `DocumentModel` maps relations to ids, `DefaultOf` describes default state, and `QueryOf` is used for query-shaped inputs.",
        ko: "document, store, test에서 사용하는 public type helper입니다. `DocumentModel`은 relation을 id로 매핑하고, `DefaultOf`는 default state를 설명하며, `QueryOf`는 query-shaped input에 사용합니다.",
      }),
      code: `import type { DefaultOf, DocumentModel, QueryOf } from "akanjs/constant";

type UserDoc = DocumentModel<User>;
type UserDefault = DefaultOf<User>;
type UserQuery = QueryOf<UserDoc>;`,
    },
    {
      name: "crystalize / purify",
      desc: l.trans({
        en: "Framework internals rather than authoring API. `crystalize` converts raw values into model-friendly values such as dayjs and nested constants, and `purify` converts class instances back into plain serializable objects for API and persistence boundaries.",
        ko: "authoring API가 아니라 framework internal입니다. `crystalize`는 raw value를 dayjs나 nested constant 같은 model-friendly value로 변환하고, `purify`는 API와 persistence boundary를 위해 class instance를 plain serializable object로 되돌립니다.",
      }),
      code: `import { crystalize, purify } from "akanjs/constant";

const model = crystalize(User, rawUser);
const plain = purify(User, model);`,
    },
    {
      name: "serialize / deserialize",
      desc: l.trans({
        en: "Serialization helpers for document and transport boundaries. They convert constant model values, dates, enums, maps, arrays, and nested models between runtime values and persisted payloads.",
        ko: "document와 transport boundary를 위한 serialization helper입니다. constant model value, date, enum, map, array, nested model을 runtime value와 persisted payload 사이에서 변환합니다.",
      }),
      code: `import { deserialize, serialize } from "akanjs/constant";

const payload = serialize(User, user);
const restored = deserialize(User, payload);`,
    },
    {
      name: "ConstantRegistry",
      desc: l.trans({
        en: "Runtime registry for scalar/database constant metadata. Framework internals use it to resolve ref names, model classes, scalar metadata, enum metadata, and generated document model contracts.",
        ko: "scalar/database constant metadata를 위한 runtime registry입니다. framework internal은 ref name, model class, scalar metadata, enum metadata, generated document model contract를 resolve할 때 사용합니다.",
      }),
      code: `import { ConstantRegistry } from "akanjs/constant";

const refName = ConstantRegistry.getRefName(User);
const modelName = ConstantRegistry.getModelName(User);`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-constant" title="akanjs/constant">
        <Docs.Title>akanjs/constant</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/constant` defines Akan's schema layer. Every `.constant.ts` file in a workspace is built from two of its exports — `via`, which declares a class, and the `field` builder `via` hands to it — and everything else on this page is support around those two.",
              ko: "`akanjs/constant`는 Akan의 schema layer를 정의합니다. workspace의 모든 `.constant.ts` 파일은 이 package의 export 두 개, 즉 class를 선언하는 `via`와 `via`가 넘겨 주는 `field` builder로 만들어집니다. 이 페이지의 나머지는 모두 그 둘을 둘러싼 지원 도구입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A module declares five classes in a fixed order — Input, Object, Light, full, Insight — and writes the Insight class even when it is empty. The later entries here are type helpers and conversion internals you read rather than call.",
              ko: "module은 Input, Object, Light, full, Insight 다섯 class를 고정된 순서로 선언하며 Insight class는 비어 있어도 작성합니다. 뒤쪽 항목은 직접 호출하기보다는 읽게 되는 type helper와 변환 internal입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {symbols.map((symbol) => (
        <Scroll.Slide key={symbol.name} id={symbol.name} title={symbol.name}>
          <Docs.Title>{symbol.name}</Docs.Title>
          <Docs.Description>
            <div>{symbol.desc}</div>
          </Docs.Description>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Usage", ko: "사용 예시" })}
            language="typescript"
            code={symbol.code}
          />
        </Scroll.Slide>
      ))}
      <DocsToc />
    </Scroll>
  );
});
