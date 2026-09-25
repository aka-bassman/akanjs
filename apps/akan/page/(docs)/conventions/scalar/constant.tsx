import { usePage } from "@apps/akan/client";
import {
  Code,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type LinkGridItem,
  type OptionItem,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "scalar", ko: "스칼라" })}</span>,
      desc: l.trans({
        en: "A small value object saved inside another model, such as a price, an address or a coordinate.",
        ko: "가격, 주소, 좌표처럼 다른 모델 안에 함께 저장되는 작은 값 객체입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "parent model", ko: "상위 모델" })}</span>,
      desc: l.trans({
        en: "The model that embeds the scalar, such as a `Product` holding a `Price`.",
        ko: "`Price`를 가진 `Product`처럼, 스칼라를 품고 있는 모델입니다.",
      }),
    },
    {
      name: "via()",
      desc: l.trans({
        en: "Turns a list of fields into a class, imported from `akanjs/constant`.",
        ko: "필드 목록을 클래스로 만들어 주며, `akanjs/constant`에서 가져옵니다.",
      }),
    },
    {
      name: "field(Type)",
      desc: l.trans({
        en: "Declares one value and its type, plus options such as a default.",
        ko: "값 하나와 그 타입을 선언하고, 기본값 같은 옵션도 여기에 붙입니다.",
      }),
    },
    {
      name: "enumOf()",
      desc: l.trans({
        en: "Declares a fixed list of allowed values, imported from `akanjs/base`.",
        ko: "허용하는 값의 고정 목록을 선언하며, `akanjs/base`에서 가져옵니다.",
      }),
    },
  ];

  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const kindCards = [
    {
      title: "model.constant.ts",
      path: "lib/<model>/<model>.constant.ts",
      facts: [
        l.trans({
          en: (
            <>
              Five classes: <code>XInput → XObject → LightX → X → XInsight</code>.
            </>
          ),
          ko: (
            <>
              클래스 다섯 개: <code>XInput → XObject → LightX → X → XInsight</code>
            </>
          ),
        }),
        l.trans({
          en: (
            <>
              Gets the base fields <code>id</code>, <code>createdAt</code>, <code>updatedAt</code> and{" "}
              <code>removedAt</code>.
            </>
          ),
          ko: (
            <>
              <code>id</code>, <code>createdAt</code>, <code>updatedAt</code>, <code>removedAt</code> 기본 필드가
              붙습니다.
            </>
          ),
        }),
        l.trans({ en: "Saved as a record of its own.", ko: "독립된 레코드로 저장됩니다." }),
      ],
    },
    {
      title: "scalar.constant.ts",
      path: "lib/__scalar/<scalar>/<scalar>.constant.ts",
      facts: [
        l.trans({
          en: (
            <>
              One <code>via()</code> class, plus its enums.
            </>
          ),
          ko: (
            <>
              <code>via()</code> 클래스 하나와 그 enum이 전부입니다.
            </>
          ),
        }),
        l.trans({ en: "No base fields at all.", ko: "기본 필드가 없습니다." }),
        l.trans({ en: "Saved as part of the parent model's record.", ko: "상위 모델 레코드의 일부로 저장됩니다." }),
      ],
    },
  ];

  const shapeNotes = [
    l.trans({
      en: (
        <>
          <strong>The class is the folder name in PascalCase.</strong> <code>__scalar/price/</code> exports{" "}
          <code>Price</code>, and <code>__scalar/contactInfo/</code> exports <code>ContactInfo</code>.
        </>
      ),
      ko: (
        <>
          <strong>클래스 이름은 폴더 이름을 PascalCase로 바꾼 것입니다.</strong> <code>__scalar/price/</code>는{" "}
          <code>Price</code>를, <code>__scalar/contactInfo/</code>는 <code>ContactInfo</code>를 export합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Name the value, not the model that uses it.</strong> <code>Price</code> fits a product, an order and
          an invoice alike; <code>ProductPrice</code> would tie it to one of them.
        </>
      ),
      ko: (
        <>
          <strong>쓰는 모델이 아니라 값 자체에 이름을 붙입니다.</strong> <code>Price</code>는 상품, 주문, 청구서
          어디에나 맞지만, <code>ProductPrice</code>는 그중 하나에 묶여 버립니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>via</code> comes from <code>akanjs/constant</code>; <code>Int</code>, <code>Float</code>,{" "}
            <code>ID</code>, <code>Any</code> and <code>enumOf</code> from <code>akanjs/base</code>.
          </strong>{" "}
          <code>String</code>, <code>Boolean</code> and <code>Date</code> are globals and need no import.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>via</code>는 <code>akanjs/constant</code>에서, <code>Int</code>, <code>Float</code>, <code>ID</code>,{" "}
            <code>Any</code>, <code>enumOf</code>는 <code>akanjs/base</code>에서 가져옵니다.
          </strong>{" "}
          <code>String</code>, <code>Boolean</code>, <code>Date</code>는 전역이라 import가 필요 없습니다.
        </>
      ),
    }),
  ];

  const typeRows: IntroItem[] = [
    {
      name: ["String", "Boolean", "Date"],
      desc: l.trans({
        en: "Text, true or false, and a point in time.",
        ko: "문자열, 참/거짓, 날짜와 시각입니다.",
      }),
    },
    {
      name: "Int",
      desc: l.trans({ en: "Whole numbers such as counts and quantities.", ko: "개수나 수량 같은 정수입니다." }),
    },
    {
      name: "Float",
      desc: l.trans({
        en: "Numbers with decimals, such as an amount or a longitude.",
        ko: "금액이나 경도처럼 소수가 있는 수입니다.",
      }),
    },
    {
      name: "ID",
      desc: l.trans({ en: "The id of another record, such as `fileId`.", ko: "`fileId`처럼 다른 레코드의 id입니다." }),
    },
    {
      name: "Any",
      desc: l.trans({
        en: "A truly open payload, for when explicit fields cannot describe it.",
        ko: "모양이 정말로 정해지지 않은 값으로, 필드로 적을 수 없을 때만 씁니다.",
      }),
    },
    {
      name: "Map",
      desc: l.trans({
        en: "String keys to values, with the value type named in a required `{ of: String }`.",
        ko: "문자열 key로 값을 찾는 맵이며, 값 타입을 `{ of: String }`처럼 꼭 적습니다.",
      }),
    },
    {
      name: "Currency",
      desc: l.trans({
        en: "An `enumOf()` class from the same file: one of a fixed set of values.",
        ko: "같은 파일의 `enumOf()` 클래스로, 정해진 값 중 하나입니다.",
      }),
    },
    {
      name: "Coordinate",
      desc: l.trans({
        en: "Another scalar, imported from its own constant and nested as a value.",
        ko: "다른 스칼라로, 그 constant 파일에서 가져와 값으로 품습니다.",
      }),
    },
  ];

  const defaultNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>currency</code> defaults to an everyday value, <code>"KRW"</code>,
          </strong>{" "}
          so a new price starts filled in.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>currency</code>의 기본값은 흔히 쓰는 값인 <code>"KRW"</code>입니다.
          </strong>{" "}
          그래서 새 가격은 채워진 채로 시작합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>memo</code> is optional
          </strong>{" "}
          because not every price needs a note.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>memo</code>는 선택 필드입니다.
          </strong>{" "}
          모든 가격에 메모가 필요하지는 않기 때문입니다.
        </>
      ),
    }),
  ];

  const startRows: OptionItem[] = [
    {
      key: "field(String)",
      default: '""',
      desc: l.trans({
        en: "Required, so the parent model's form will not save while it is empty.",
        ko: "필수라서, 비어 있으면 상위 모델의 폼이 저장되지 않습니다.",
      }),
    },
    {
      key: "field(Float)",
      default: "0",
      desc: l.trans({
        en: "Required, but `0` counts as a value and saves, and `field(Int)` works the same way.",
        ko: "필수지만 `0`도 값이라 그대로 저장되며, `field(Int)`도 같습니다.",
      }),
    },
    {
      key: "field(Boolean)",
      default: "false",
      desc: l.trans({
        en: "Required, but `false` counts as a value and saves.",
        ko: "필수지만 `false`도 값이라 그대로 저장됩니다.",
      }),
    },
    {
      key: 'field(String, { default: "KRW" })',
      default: '"KRW"',
      desc: l.trans({
        en: "Required, but it starts filled, and clearing it blocks the save.",
        ko: "필수지만 채워진 채로 시작하고, 지우면 저장이 막힙니다.",
      }),
    },
    {
      key: "field(String).optional()",
      default: "null",
      desc: l.trans({
        en: "Optional, and an empty string is saved as `null`.",
        ko: "선택 필드이며, 빈 문자열은 `null`로 저장됩니다.",
      }),
    },
    {
      key: "field([String])",
      default: "[]",
      desc: l.trans({
        en: "An empty list is valid, so it saves.",
        ko: "빈 목록도 올바른 값이라 그대로 저장됩니다.",
      }),
    },
  ];

  const startNotes = [
    l.trans({
      en: (
        <>
          <strong>A literal for a plain value, a function for anything built.</strong> Write <code>default: 0</code> as
          is, but <code>{"default: () => dayjs()"}</code> for a date, so each new value gets its own time.
        </>
      ),
      ko: (
        <>
          <strong>단순한 값은 그대로, 만들어야 하는 값은 함수로 씁니다.</strong> <code>default: 0</code>은 그대로 쓰고,
          날짜는 <code>{"default: () => dayjs()"}</code>로 써서 새 값마다 자기 시각을 갖게 합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>{'default: ""'}</code> makes a String field optional too.
          </strong>{" "}
          <code>{'note: field(String, { default: "" })'}</code> accepts an empty note.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>{'default: ""'}</code>를 주면 String 필드도 선택 필드가 됩니다.
          </strong>{" "}
          <code>{'note: field(String, { default: "" })'}</code>는 빈 메모를 받아들입니다.
        </>
      ),
    }),
  ];

  const arrayNotes = [
    l.trans({
      en: (
        <>
          <strong>
            An array starts as <code>[]</code>.
          </strong>{" "}
          A new <code>ContactInfo</code> has an empty <code>emails</code> list, never <code>null</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            배열은 <code>[]</code>로 시작합니다.
          </strong>{" "}
          새 <code>ContactInfo</code>의 <code>emails</code>는 <code>null</code>이 아니라 빈 목록입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Any field type can be an array</strong> — <code>[Int]</code>, an enum such as <code>[Currency]</code>,
          or another scalar such as <code>[Coordinate]</code>.
        </>
      ),
      ko: (
        <>
          <strong>어떤 필드 타입이든 배열로 만들 수 있습니다.</strong> <code>[Int]</code>, <code>[Currency]</code> 같은
          enum, <code>[Coordinate]</code> 같은 다른 스칼라도 됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Bound the count with <code>minlength</code> and <code>maxlength</code>.
          </strong>{" "}
          On an array they limit how many items the parent model's form may save.
        </>
      ),
      ko: (
        <>
          <strong>
            개수는 <code>minlength</code>와 <code>maxlength</code>로 제한합니다.
          </strong>{" "}
          배열에서는 상위 모델의 폼이 저장할 수 있는 항목 수를 제한합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Need several of the scalar itself? Put the array on the parent.</strong> The parent model writes{" "}
          <code>contacts: field([ContactInfo])</code>, and the scalar stays one contact.
        </>
      ),
      ko: (
        <>
          <strong>스칼라 자체가 여러 개라면 배열은 상위 모델 쪽에 둡니다.</strong> 상위 모델이{" "}
          <code>contacts: field([ContactInfo])</code>로 쓰고, 스칼라는 연락처 하나로 남습니다.
        </>
      ),
    }),
  ];

  const enumNotes = [
    l.trans({
      en: (
        <>
          <strong>Name the enum after its class, in camelCase.</strong> <code>Currency</code> is <code>"currency"</code>
          , and <code>LeaveType</code> in <code>libs/shared</code> is <code>"leaveType"</code>.
        </>
      ),
      ko: (
        <>
          <strong>enum 이름은 클래스 이름을 camelCase로 씁니다.</strong> <code>Currency</code>는 <code>"currency"</code>
          , <code>libs/shared</code>의 <code>LeaveType</code>은 <code>"leaveType"</code>입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>The dictionary repeats that name.</strong> <code>price.dictionary.ts</code> labels the values in{" "}
          <code>{'.enum<Currency>("currency", …)'}</code>, where a different string is a type error.
        </>
      ),
      ko: (
        <>
          <strong>dictionary가 이 이름을 그대로 씁니다.</strong> <code>price.dictionary.ts</code>는{" "}
          <code>{'.enum<Currency>("currency", …)'}</code>에서 값마다 레이블을 붙이고, 다른 문자열을 쓰면 타입
          에러입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Keep it short, stable and unique.</strong> Components read labels as{" "}
          <code>{'l("currency.KRW")'}</code>, so renaming it breaks them, and no other model or enum should share it.
        </>
      ),
      ko: (
        <>
          <strong>짧고, 바뀌지 않고, 겹치지 않게 짓습니다.</strong> 컴포넌트가 <code>{'l("currency.KRW")'}</code>로
          레이블을 읽으므로 이름을 바꾸면 깨지고, 다른 모델이나 enum과 같은 이름을 써서도 안 됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            End the value list with <code>as const</code>.
          </strong>{" "}
          Without it every value widens to <code>string</code>, and <code>{'default: "KRW"'}</code> is no longer checked
          against the list.
        </>
      ),
      ko: (
        <>
          <strong>
            값 목록 끝에는 <code>as const</code>를 붙입니다.
          </strong>{" "}
          빠지면 모든 값이 <code>string</code>으로 넓어져, <code>{'default: "KRW"'}</code>가 목록에 있는 값인지 검사하지
          못합니다.
        </>
      ),
    }),
  ];

  const helperNotes = [
    l.trans({
      en: (
        <>
          <strong>An instance method reads one value.</strong> A scalar inside a model instance is built as its class,
          so <code>product.price.isFree()</code> works.
        </>
      ),
      ko: (
        <>
          <strong>인스턴스 메서드는 값 하나를 다룹니다.</strong> 모델 인스턴스 안의 스칼라도 자기 클래스로 만들어지므로{" "}
          <code>product.price.isFree()</code>처럼 부를 수 있습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            A <code>static</code> method works across several values.
          </strong>{" "}
          <code>Coordinate.getDistanceKm(a, b)</code> in <code>libs/util</code> measures between two coordinates.
        </>
      ),
      ko: (
        <>
          <strong>
            여러 값을 함께 다루면 <code>static</code> 메서드로 둡니다.
          </strong>{" "}
          <code>libs/util</code>의 <code>Coordinate.getDistanceKm(a, b)</code>는 두 좌표 사이 거리를 잽니다.
        </>
      ),
    }),
  ];

  const bannedRows: IntroItem[] = [
    {
      name: 'import dayjs from "dayjs"',
      desc: l.trans({
        en: "A third-party package, so import a re-export instead, such as `dayjs` from `akanjs/base`.",
        ko: "외부 패키지이므로, `akanjs/base`의 `dayjs`처럼 re-export된 것을 가져옵니다.",
      }),
    },
    {
      name: ["*.service.ts", "*.document.ts", "srvkit/", "db"],
      desc: l.trans({
        en: "Server-only code, whose work belongs in the service.",
        ko: "서버 전용 코드이며, 그 일은 service에 맡깁니다.",
      }),
    },
    {
      name: ["*.store.ts", "ui/", "st"],
      desc: l.trans({
        en: "Client-only code, whose work belongs in the store and components.",
        ko: "클라이언트 전용 코드이며, 그 일은 store와 컴포넌트에 맡깁니다.",
      }),
    },
    {
      name: "#private",
      desc: l.trans({
        en: "Not allowed in a constant file, so write a TypeScript `private` method instead.",
        ko: "constant 파일에서는 쓸 수 없으니 TypeScript의 `private` 메서드로 씁니다.",
      }),
    },
    {
      name: "//!",
      desc: l.trans({
        en: "The comment ships to the browser inside the bundle, so write `// FIXME:` instead.",
        ko: "이 주석은 번들에 실려 브라우저까지 가므로, 대신 `// FIXME:`를 씁니다.",
      }),
    },
  ];

  const nextLinks: LinkGridItem[] = [
    {
      href: "/conventions/scalar/dictionary",
      title: "scalar.dictionary.ts",
      desc: l.trans({
        en: "Label every field and enum value you declared here.",
        ko: "여기서 선언한 필드와 enum 값마다 레이블을 붙입니다.",
      }),
    },
    {
      href: "/references/akanjs/constant#field",
      title: l.trans({ en: "Every field option", ko: "필드 옵션 전체" }),
      desc: l.trans({
        en: "`min`, `max`, `example`, `validate` and the rest, in the `akanjs/constant` reference.",
        ko: "`min`, `max`, `example`, `validate` 등은 `akanjs/constant` 레퍼런스에 있습니다.",
      }),
    },
    {
      href: "/conventions/scalar/overview",
      title: l.trans({ en: "Scalar Overview", ko: "스칼라 개요" }),
      desc: l.trans({
        en: "When a value should be a scalar and when a model of its own.",
        ko: "값을 스칼라로 둘지, 독립된 모델로 둘지 정하는 법입니다.",
      }),
    },
    {
      href: "/conventions/module/constant",
      title: "model.constant.ts",
      desc: l.trans({
        en: "The five-class constant a stored model uses.",
        ko: "따로 저장되는 모델이 쓰는, 클래스 다섯 개짜리 constant입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="constant-overview" title="scalar.constant.ts">
        <Docs.Title>scalar.constant.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A scalar constant declares the shape of a small value that other models embed, such as a price or an address. You open it when that value gains, loses or changes a field.",
              ko: "스칼라 constant는 가격이나 주소처럼 다른 모델 안에 들어가는 작은 값의 모양을 선언합니다. 그 값에 필드를 더하거나 빼거나 바꿀 때 이 파일을 엽니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Keep it simple enough to read without opening a service, signal or store. Most need only{" "}
                  <code>via()</code>, <code>field()</code>, a few defaults and optional fields, and sometimes one small
                  enum.
                </span>
              ),
              ko: (
                <span>
                  service, signal, store 파일을 열지 않아도 읽힐 만큼 단순하게 유지합니다. 대부분은 <code>via()</code>,{" "}
                  <code>field()</code>, 기본값과 선택 필드 몇 개, 가끔 작은 enum 하나면 충분합니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>
            {l.trans({ en: "One class, not five", ko: "클래스는 다섯 개가 아니라 하나" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A module constant declares five classes because its model keeps records of its own. A scalar keeps none, so its file is one class plus its enums:",
              ko: "모듈 constant는 레코드를 따로 저장하는 모델을 위한 것이라 클래스를 다섯 개 선언합니다. 스칼라는 따로 저장되는 레코드가 없으니 클래스 하나와 그 enum이면 됩니다:",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {kindCards.map((card) => (
              <div key={card.title} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{card.title}</div>
                <code className={chip}>{card.path}</code>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/70 text-sm">
                  {card.facts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="basic-shape" title={l.trans({ en: "Basic Shape", ko: "기본 형태" })}>
        <Docs.Title>{l.trans({ en: "Basic Shape", ko: "기본 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Pass <code>via()</code> a function that returns one <code>field(Type)</code> per value, then extend
                  the result as an exported class:
                </span>
              ),
              ko: (
                <span>
                  <code>via()</code>에 값마다 <code>field(Type)</code>을 하나씩 돌려주는 함수를 넘기고, 그 결과를 상속한
                  클래스를 export합니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.constant.ts"
          code={`import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float),
  currency: field(String),
})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {shapeNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Field types", ko: "필드 타입" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Pick the type by what the value is. The last two rows are classes from your own code:",
              ko: "타입은 값이 무엇인지에 맞춰 고릅니다. 마지막 두 줄은 직접 만든 클래스입니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Type", ko: "타입" })}
            descLabel={l.trans({ en: "Use for", ko: "용도" })}
            items={typeRows}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    <code>Number</code> and <code>Binary</code> are not field types.
                  </strong>{" "}
                  Write numbers as <code>Int</code> or <code>Float</code>, because <code>field(Number)</code> does not
                  typecheck. Bytes cannot be stored in a field, so reference the <code>File</code> model instead.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>Number</code>와 <code>Binary</code>는 필드 타입이 아닙니다.
                  </strong>{" "}
                  숫자는 <code>Int</code>나 <code>Float</code>로 씁니다. <code>field(Number)</code>는 타입 검사를
                  통과하지 못합니다. 바이트는 필드에 저장할 수 없으니 <code>File</code> 모델을 참조합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="defaults-optional"
        title={l.trans({ en: "Defaults And Optional Fields", ko: "기본값과 선택 필드" })}
      >
        <Docs.Title>{l.trans({ en: "Defaults And Optional Fields", ko: "기본값과 선택 필드" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Give a field a default when it needs a sensible starting value. Mark it <code>.optional()</code> when
                  the parent model is complete without it:
                </span>
              ),
              ko: (
                <span>
                  알맞은 시작 값이 있어야 하는 필드에는 기본값을 줍니다. 상위 모델이 그 필드 없이도 완전하다면{" "}
                  <code>.optional()</code>을 붙입니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/price/price.constant.ts"
          code={`import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
  memo: field(String).optional(),
})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {defaultNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "What a new value starts as", ko: "새 값의 시작 값" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  A field with neither a default nor <code>.optional()</code> is required. How you write a field decides
                  what a new value starts as and whether the parent model saves with it empty:
                </span>
              ),
              ko: (
                <span>
                  기본값도 <code>.optional()</code>도 없는 필드는 필수입니다. 필드를 어떻게 쓰느냐에 따라 새 값의 시작
                  값과, 비워 둔 채 상위 모델을 저장할 수 있는지가 정해집니다:
                </span>
              ),
            })}
          </div>
          <Docs.OptionTable items={startRows} />
          <ul className={bulletList}>
            {startNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="arrays" title={l.trans({ en: "Array Fields", ko: "배열 필드" })}>
        <Docs.Title>{l.trans({ en: "Array Fields", ko: "배열 필드" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Wrap the type in brackets when the value naturally holds a repeated item. A small example: a contact
                  can have several emails, so <code>emails</code> is <code>field([String])</code>:
                </span>
              ),
              ko: (
                <span>
                  값이 원래 같은 항목을 여러 개 담는다면 타입을 대괄호로 감쌉니다. 작은 예로, 연락처 하나에는 이메일이
                  여러 개일 수 있으므로 <code>emails</code>는 <code>field([String])</code>입니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/__scalar/contactInfo/contactInfo.constant.ts"
          code={`import { via } from "akanjs/constant";

export class ContactInfo extends via((field) => ({
  name: field(String),
  emails: field([String]),
})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {arrayNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="enum-fields" title={l.trans({ en: "Enum Fields", ko: "enum 필드" })}>
        <Docs.Title>{l.trans({ en: "Enum Fields", ko: "enum 필드" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Use <code>enumOf()</code> when a field may hold only one of a fixed set of values. Declare the enum in
                  the same file, above the scalar:
                </span>
              ),
              ko: (
                <span>
                  필드에 정해진 값 중 하나만 들어가야 한다면 <code>enumOf()</code>를 씁니다. enum은 같은 파일의 스칼라
                  클래스 위에 선언합니다:
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
          <ul className={bulletList}>
            {enumNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="helper-methods" title={l.trans({ en: "Small Helpers", ko: "작은 헬퍼 메서드" })}>
        <Docs.Title>{l.trans({ en: "Small Helpers", ko: "작은 헬퍼 메서드" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A small method can live on the class when the behavior belongs to the value itself. Keep it pure: no server request, no database call, no external service.",
              ko: "동작이 값 자체에 속한다면 작은 메서드를 클래스에 둘 수 있습니다. 서버 요청, 데이터베이스 호출, 외부 서비스 없이 순수하게 유지합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The whole file, with the enum and one helper:",
              ko: "enum과 헬퍼 하나까지 넣은 파일 전체입니다:",
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
})) {
  isFree() {
    return this.amount === 0;
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {helperNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>
            {l.trans({ en: "What a constant file cannot contain", ko: "constant 파일에 쓸 수 없는 것" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The same file runs on the server and in the browser, so lint holds it to the rules of both:",
              ko: "이 파일은 서버와 브라우저 양쪽에서 실행되므로, lint는 양쪽 규칙을 모두 적용합니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Not allowed", ko: "쓸 수 없는 것" })}
            descLabel={l.trans({ en: "Why, and what to write", ko: "이유와 대신 쓸 것" })}
            items={bannedRows}
          />
          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "다음에 읽을 곳" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={nextLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
