import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type OptionItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const layers = [
    {
      title: "Input",
      desc: l.trans({
        en: "Fields accepted when creating or editing the model.",
        ko: "model을 생성하거나 수정할 때 받는 field입니다.",
      }),
    },
    {
      title: "Object",
      desc: l.trans({
        en: "Input plus stored fields controlled by the system or service.",
        ko: "Input에 system 또는 service가 관리하는 저장 field를 더합니다.",
      }),
    },
    {
      title: "Light",
      desc: l.trans({
        en: "The small view a list, a relation and a card query return. Both sides hold this one, so shared logic belongs here.",
        ko: "list, relation, card query가 돌려주는 작은 view입니다. 양쪽이 모두 들고 있는 것이라, 공유 로직은 여기에 둡니다.",
      }),
    },
    {
      title: "Model",
      desc: l.trans({
        en: "Object and Light combined. Collection-level helpers go here as statics.",
        ko: "Object와 Light를 합친 것입니다. collection 단위 helper는 여기에 static으로 둡니다.",
      }),
    },
    {
      title: "Insight",
      desc: l.trans({
        en: "Aggregated counters for dashboards. Write the class even when it is empty.",
        ko: "대시보드용 집계 카운터입니다. 비어 있어도 class는 씁니다.",
      }),
    },
  ];

  const fieldOptions: OptionItem[] = [
    {
      key: "default",
      type: "T | (doc) => T",
      default: "[] for an array, else null",
      desc: l.trans({
        en: "A literal for a scalar, a thunk for anything constructed — () => dayjs() is evaluated per document, while a dayjs() written directly is one moment shared by every row ever created. An array default is copied per call rather than handed out by reference.",
        ko: "scalar에는 리터럴, 생성되는 값에는 thunk를 씁니다. () => dayjs()는 document마다 평가되지만, 직접 쓴 dayjs()는 이후 만들어지는 모든 행이 공유하는 한 순간입니다. 배열 기본값은 참조로 건네지 않고 호출마다 복사됩니다.",
      }),
    },
    {
      key: "ref",
      type: "string",
      default: "—",
      desc: l.trans({
        en: "Names the model an ID field points at, for a reference stored as an id rather than declared as a relation.",
        ko: "relation으로 선언하지 않고 id로 저장하는 참조에서, 그 ID field가 가리키는 model의 이름입니다.",
      }),
    },
    {
      key: "refPath",
      type: "string",
      default: "—",
      desc: l.trans({
        en: "Names an enumOf field holding the owner's model name, for a polymorphic reference. Required when cascade is removeWithAny, and the two are paired in the type so the widening cannot be declared apart from the direction it widens.",
        ko: "다형 참조에서 소유자 model의 이름을 담은 enumOf field를 지목합니다. cascade가 removeWithAny이면 필수이며, 타입에서 둘이 짝지어져 있어 확장을 그것이 확장하는 방향과 떼어 선언할 수 없습니다.",
      }),
    },
    {
      key: "text",
      type: '"title" | "desc" | "tag" | "thumb" | "filter"',
      default: "—",
      desc: l.trans({
        en: "Joins the field to the full-text index. There is no separate index file and no per-model switch. A compile error on field.hidden, field.secret and resolve.",
        ko: "이 field를 전문 검색 index에 넣습니다. 별도의 index 파일도, model 단위 스위치도 없습니다. field.hidden, field.secret, resolve에서는 컴파일 에러입니다.",
      }),
    },
    {
      key: "cascade",
      type: '"removeRef" | "removeWith" | "removeWithAny"',
      default: "—",
      desc: l.trans({
        en: "Which end of the relation goes away with the other. The two directions read identically on the same field shape, so the value names the direction — and getting it wrong is a data loss.",
        ko: "관계의 어느 쪽이 다른 쪽과 함께 사라지는지를 정합니다. 두 방향은 같은 모양의 field에서 똑같이 읽히므로 값이 방향을 말합니다. 잘못 적으면 데이터 손실입니다.",
      }),
    },
    {
      key: "visual",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "A stored property the page renders and an agent never sees. field.visual(T) is the short spelling of the same thing.",
        ko: "page는 그리고 agent는 절대 보지 못하는 저장 property입니다. field.visual(T)가 같은 것의 짧은 표기입니다.",
      }),
    },
    {
      key: "example",
      type: "T",
      default: "—",
      desc: l.trans({
        en: "A sample value. It reaches the API explorer and the MCP input schema, which is where an agent reads it to guess the shape it should send.",
        ko: "예시 값입니다. API explorer와 MCP input schema에 실리고, agent는 거기서 그 값을 읽어 보낼 모양을 짐작합니다.",
      }),
    },
    {
      key: "validate",
      type: "(value, doc) => boolean",
      default: "—",
      desc: l.trans({
        en: "A predicate run on write. A false verdict refuses the write; the value is skipped when it is null or undefined, so a validator never doubles as a required check.",
        ko: "쓰기 시점에 실행되는 판정식입니다. false면 쓰기를 거부합니다. 값이 null이나 undefined면 건너뛰므로, validator가 필수 여부 검사를 겸하지는 않습니다.",
      }),
    },
    {
      key: "min · max",
      type: "number",
      default: "—",
      desc: l.trans({
        en: "Numeric bounds carried into the generated schema document.",
        ko: "생성된 schema 문서로 이어지는 수치 범위입니다.",
      }),
    },
    {
      key: "minlength · maxlength",
      type: "number",
      default: "—",
      desc: l.trans({
        en: "String length bounds, the same way.",
        ko: "문자열 길이 범위이며 동작 방식은 같습니다.",
      }),
    },
    {
      key: "immutable",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "Marks the field write-once in the generated schema document and the API explorer. The sqlite-backed store does not refuse a later write, so read it as documentation rather than as a constraint.",
        ko: "생성된 schema 문서와 API explorer에서 이 field를 write-once로 표시합니다. sqlite 기반 store는 이후의 쓰기를 거부하지 않으므로, 제약이 아니라 문서로 읽으세요.",
      }),
    },
    {
      key: "accumulate",
      type: "query object",
      default: "—",
      desc: l.trans({
        en: "On an Insight field only: which rows this counter counts. An empty object counts everything the query matched.",
        ko: "Insight field에만 씁니다. 이 카운터가 무엇을 세는지 정합니다. 빈 객체는 그 query가 맞춘 전부를 셉니다.",
      }),
    },
    {
      key: "of",
      type: "scalar or model class",
      default: "—",
      desc: l.trans({
        en: "Required for a Map field — the class build throws without it, because a Map has no declared value type to infer.",
        ko: "Map field에는 필수입니다. 없으면 class 빌드가 예외를 냅니다. Map에는 추론할 값 타입 선언이 없기 때문입니다.",
      }),
    },
    {
      key: "type",
      type: '"email" | "password" | "url"',
      default: "—",
      desc: l.trans({
        en: "A field preset, which is what the generated form control reads to pick its input type.",
        ko: "field preset입니다. 생성된 form control이 input 종류를 고를 때 읽는 값입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="constant-overview" title="model.constant.ts">
        <Docs.Title>model.constant.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "One file describes the shape of a business object, and everything downstream is derived from it: the storage schema, the generated CRUD, the form state, the API contract, the admin explorer, and the schema an AI agent reads before calling anything. Nothing else in the module restates those fields.",
              ko: "파일 하나가 비즈니스 객체의 모양을 설명하고, 그 아래의 모든 것이 거기에서 파생됩니다. 저장 schema, 생성된 CRUD, form state, API 계약, 관리자 explorer, 그리고 AI agent가 무언가를 호출하기 전에 읽는 schema입니다. module의 다른 어떤 파일도 그 field들을 다시 적지 않습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Five classes, always in this order, always all five — write the Insight class even when it is empty. Each builds a different view of the same object with via(), and the later files reuse those generated types by name.",
              ko: "class 다섯 개를 언제나 이 순서로, 언제나 다섯 개 모두 씁니다. Insight class는 비어 있어도 씁니다. 각각이 via()로 같은 객체의 서로 다른 view를 만들고, 이후의 파일들은 그 생성된 type을 이름으로 재사용합니다.",
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {layers.map(({ title, desc }) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/ticket/ticket.constant.ts"
            code={`import { dayjs, enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class TicketStatus extends enumOf("ticketStatus", [
  "active",
  "opened",
  "inProgress",
  "completed",
] as const) {}

export class TicketInput extends via((field) => ({
  title: field(String),
  content: field(String, { default: "" }),
  type: field(String, { default: "shared" }),
})) {}

export class TicketObject extends via(TicketInput, (field) => ({
  status: field(TicketStatus, { default: "active" }),
  due: field(Date, { default: () => dayjs().set("hour", 19) }), // the shop closes at 7pm
})) {}

export class LightTicket extends via(TicketObject, ["title", "status", "due"] as const, (resolve) => ({})) {}

export class Ticket extends via(TicketObject, LightTicket, (resolve) => ({})) {}

export class TicketInsight extends via(Ticket, (field) => ({
  activeCount: field(Int, { default: 0, accumulate: { status: "active" } }),
})) {}`}
          />
          <div>
            {l.trans({
              en: 'Two as const markers are load-bearing. The one on the enumOf array is what turns the values into a union type instead of string[]; the one on the Light tuple is what tells via() which keys the light view actually has. Never use the TypeScript enum keyword — enumOf is the vocabulary, and its value union is reached as TicketStatus["value"].',
              ko: '두 개의 as const가 하중을 받습니다. enumOf 배열의 것은 값들을 string[]이 아니라 union type으로 만들고, Light tuple의 것은 light view가 실제로 어떤 key를 가지는지 via()에 알려 줍니다. TypeScript enum 키워드는 쓰지 않습니다. 어휘는 enumOf이고, 값 union은 TicketStatus["value"]로 닿습니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="field-options" title={l.trans({ en: "Field Options", ko: "Field 옵션" })}>
        <Docs.Title>{l.trans({ en: "Field Options", ko: "Field 옵션" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "field(Type, options) takes one object, and what is not in it is as informative as what is. Optional is not an option — it is the chained .optional(), because it widens the declared type as well as the stored one. Nullable, select, enum and the field kind are all set for you by the call you made.",
              ko: "field(Type, options)는 객체 하나를 받고, 그 안에 없는 것이 있는 것만큼이나 많은 것을 말해 줍니다. optional은 옵션이 아니라 체인 메서드 .optional()입니다. 저장 타입뿐 아니라 선언된 타입도 넓히기 때문입니다. nullable, select, enum, field 종류는 당신이 한 호출이 대신 정해 줍니다.",
            })}
          </div>
          <Docs.OptionTable items={fieldOptions} />
          <div>
            {l.trans({
              en: "Give any field whose business meaning is not obvious a short trailing comment, the way due carries one above. That comment is the field's meaning and belongs beside it — not in the abstract, which holds invariants rather than a field list.",
              ko: "비즈니스 의미가 뻔하지 않은 field에는 짧은 꼬리 주석을 답니다. 위의 due가 그렇습니다. 그 주석은 field의 의미이고 field 옆에 있어야 합니다. abstract는 field 목록이 아니라 불변식을 담는 곳입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="masking" title={l.trans({ en: "Hidden, Secret, Visual", ko: "hidden, secret, visual" })}>
        <Docs.Title>{l.trans({ en: "Hidden, Secret, Visual", ko: "hidden, secret, visual" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Three entry points beside field(), and they answer two different questions. The first two are about secrecy: the value must not leave the server. The third is about cost: the value may leave, it just must not ride in an AI agent's context, where it would be hundreds of tokens per record that answer nothing.",
              ko: "field() 옆의 진입점 셋이고, 서로 다른 두 질문에 답합니다. 앞의 둘은 비밀에 대한 것입니다. 값이 서버를 떠나서는 안 됩니다. 셋째는 비용에 대한 것입니다. 값이 나가도 되지만, 레코드마다 수백 토큰이면서 아무 질문에도 답하지 못하는 채로 AI agent의 컨텍스트에 실려 다녀서는 안 됩니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🙈</span>
                <strong className="text-primary">field.hidden(T)</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Stored and read by the server, never serialized to a client. Nullable is forced on. For internal state such as an admin memo that the document carries but no screen shows.",
                  ko: "서버는 저장하고 읽지만 클라이언트로는 직렬화되지 않습니다. nullable이 강제됩니다. document가 들고 있지만 어떤 화면도 보여주지 않는 관리자 메모 같은 내부 상태에 씁니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🔐</span>
                <strong className="text-primary">field.secret(T)</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The same, plus select: false — so the server's own read omits it too unless a projection names it. A password hash, a phone number, a token. pickById(id, { secret: true }) is the only way to read one back.",
                  ko: "위와 같고 select: false가 더해집니다. projection이 지목하지 않으면 서버 자신의 읽기에서도 빠집니다. password hash, 전화번호, token이 그 대상입니다. pickById(id, { secret: true })가 값을 되읽는 유일한 방법입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🖼️</span>
                <strong className="text-primary">field.visual(T)</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "An ordinary stored property everywhere except an AI caller: stripped from every in-page-agent read, from every MCP result, and from the MCP readable schema so the two agree. Persistence, search, forms and the page response are untouched. A blur placeholder, a rendered HTML body, a serialized geometry.",
                  ko: "AI 호출자에게만 다르고 나머지 모든 곳에서는 평범한 저장 property입니다. 인페이지 agent의 모든 읽기, 모든 MCP 결과, 그리고 둘이 어긋나지 않도록 MCP readable schema에서도 제거됩니다. 저장, 검색, form, page 응답은 그대로입니다. blur placeholder, 렌더된 HTML 본문, 직렬화된 도형이 그 예입니다.",
                })}
              </div>
            </div>
          </div>
          <div className={cardGridRecipe()}>
            <Code.Snippet
              className="w-full"
              title="libs/shared/lib/file/file.constant.ts"
              code={`export class FileInput extends via((field) => ({
  filename: field(String, { text: "title" }),
  mimetype: field.hidden(String),
  encoding: field.hidden(String),
  imageSize: field<[number, number]>([Int], { default: [0, 0] }),
  url: field(String, { default: "" }),
  abstractData: field.visual(String).optional(),
  size: field(Int, { default: 0 }),
  origin: field.hidden(String).optional(),
})) {}`}
            />
            <Code.Snippet
              className="w-full"
              title="libs/shared/lib/user/user.constant.ts"
              code={`  accountId: field.secret(String).optional(),
  password: field.secret(String).optional(),
  phone: field.secret(String).optional(),
  notiInfo: field.secret(NotiInfo),
  restrictInfo: field.secret(RestrictInfo).optional(),`}
            />
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  A <code>hidden</code> or <code>secret</code> value reads <code>null</code> on the client, and the type
                  still declares it as a <code>string</code>. The endpoint's response builder skips the key entirely,
                  and hydration then writes <code>null</code> over it — ahead of the field's own default, so even a
                  declared default never arrives. Every use of it typechecks, and the failure lands wherever the value
                  is finally dereferenced instead of where it was read. Guard with <code>??</code> or{" "}
                  <code>== null</code>: <code>=== undefined</code>, a destructuring default and an optional parameter
                  default all catch only a missing key and sail straight past this one.
                </span>
              ),
              ko: (
                <span>
                  <code>hidden</code>이나 <code>secret</code> 값은 클라이언트에서 <code>null</code>로 읽히고, 타입은
                  여전히 <code>string</code>이라고 말합니다. endpoint의 응답 빌더가 그 key를 아예 건너뛰고, hydration이
                  그 위에 <code>null</code>을 씁니다. field 자신의 기본값보다 먼저이므로 기본값을 적어 두어도 도착하지
                  않습니다. 그 값을 쓰는 모든 코드가 typecheck를 통과하고, 실패는 읽은 자리가 아니라 마지막으로 역참조한
                  자리에서 납니다. <code>??</code> 또는 <code>== null</code>로 막으세요. <code>=== undefined</code>,
                  구조분해 기본값, 선택 매개변수 기본값은 전부 key가 없는 경우만 잡고 이 경우는 그대로 지나갑니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: "A projection widens the server's read, never the response. If a screen needs the value, the field is neither hidden nor secret. If it only needs to be cheap for a model rather than unseen, that is field.visual — and nothing is ever refused over one.",
              ko: "projection은 서버의 읽기를 넓힐 뿐 응답을 넓히지 않습니다. 화면이 그 값을 필요로 한다면 그 field는 hidden도 secret도 아닙니다. 보이지 않아야 하는 것이 아니라 모델에게만 저렴하면 되는 것이라면 field.visual이고, visual 때문에 거부되는 일은 없습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="instance-and-helpers"
        title={l.trans({ en: "The Instance And Its Logic", ko: "인스턴스와 그 로직" })}
      >
        <Docs.Title>{l.trans({ en: "The Instance And Its Logic", ko: "인스턴스와 그 로직" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Display and predicate logic belongs on the Light class. It is the one both server and client hold, so a method written there is callable from a page, from a card, from a store action and from a service — and this is the rule most often missed in this codebase, which is how util modules full of ticketIsOverdue(ticket) get started.",
              ko: "표시와 판정 로직은 Light class에 둡니다. server와 client가 함께 들고 있는 것이 Light이므로, 거기에 쓴 method는 page에서도, card에서도, store action에서도, service에서도 호출할 수 있습니다. 이 코드베이스에서 가장 자주 놓치는 규칙이고, ticketIsOverdue(ticket)으로 가득한 util module이 생기는 경로입니다.",
            })}
          </div>
          <div className={cardGridRecipe()}>
            <Code.Snippet
              className="w-full"
              title="apps/koyo/lib/board/board.constant.ts"
              code={`export class LightBoard extends via(BoardObject, ["name", "policy", "roles"] as const, (resolve) => ({})) {
  isPrivate() {
    return this.policy.includes("private");
  }

  canWrite(user?: { roles: string[] }) {
    return !!user && this.roles.some((role) => user.roles.includes(role));
  }
}`}
            />
            <Code.Snippet
              className="w-full"
              title="apps/koyo/lib/board/board.constant.ts"
              code={`export class Board extends via(BoardObject, LightBoard, (resolve) => ({})) {
  static getBoard(boardList: LightBoard[], boardId: string) {
    return boardList.find((board) => board.id === boardId);
  }
}`}
            />
          </div>
          <div>
            {l.trans({
              en: "Instance helpers sit on Light; anything about a collection of them is a static on the full model. A scalar under lib/__scalar/ follows the same split — Coordinate carries its distance and bounds maths as statics, because that arithmetic belongs to the value rather than to whoever stored it.",
              ko: "instance helper는 Light에 두고, 그것들의 모음에 대한 것은 full model의 static에 둡니다. lib/__scalar/ 아래의 scalar도 같은 구분을 따릅니다. Coordinate는 거리와 bounds 계산을 static으로 들고 있는데, 그 산술은 값을 저장한 쪽이 아니라 값 자체에 속하기 때문입니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A <code>Date</code> field on a hydrated instance is a <strong>prototype accessor</strong>, not an own
                  property. The instance holds a native <code>Date</code> under a symbol and builds the{" "}
                  <code>Dayjs</code> its type promises on first read. So <code>Object.keys(user)</code> and{" "}
                  <code>&#123;...user&#125;</code> do <strong>not</strong> include it, while{" "}
                  <code>"createdAt" in user</code>, <code>for...in</code>, <code>JSON.stringify(user)</code>,{" "}
                  <code>plainFieldsOf</code>, <code>immerify</code> and <code>deepObjectify</code> all do. To copy a
                  model write <code>new cnst.User().set(user)</code> — never a spread.
                </span>
              ),
              ko: (
                <span>
                  hydrate된 instance의 <code>Date</code> field는 own property가 아니라{" "}
                  <strong>prototype accessor</strong>입니다. instance는 native <code>Date</code>를 symbol 아래에 들고
                  있다가 처음 읽을 때 타입이 약속한 <code>Dayjs</code>를 만듭니다. 그래서 <code>Object.keys(user)</code>
                  와 <code>&#123;...user&#125;</code>에는 <strong>들어가지 않고</strong>,{" "}
                  <code>"createdAt" in user</code>, <code>for...in</code>, <code>JSON.stringify(user)</code>,{" "}
                  <code>plainFieldsOf</code>, <code>immerify</code>, <code>deepObjectify</code>에는 들어갑니다. model을
                  복사할 때는 spread가 아니라 <code>new cnst.User().set(user)</code>를 씁니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="text-search-fields" title={l.trans({ en: "Text Search Fields", ko: "텍스트 검색 field" })}>
        <Docs.Title>{l.trans({ en: "Text Search Fields", ko: "텍스트 검색 field" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A field joins the full-text index by declaring a text role, and that declaration is the whole configuration. Pick the role by what the value is, because the roles are weighted differently when results are ranked.",
              ko: "field에 text 역할을 선언하면 전문 검색 index에 들어가고, 그 선언이 설정의 전부입니다. 결과 순위를 매길 때 역할마다 가중치가 다르므로, 값의 성격에 맞는 역할을 고르세요.",
            })}
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {[
              {
                title: 'text: "title"',
                desc: l.trans({
                  en: "The one line a human scans for. Weighted highest, by a wide margin.",
                  ko: "사람이 눈으로 훑는 그 한 줄입니다. 가중치가 큰 차이로 가장 높습니다.",
                }),
              },
              {
                title: 'text: "tag"',
                desc: l.trans({
                  en: "A keyword list. Weighted above prose and below the title.",
                  ko: "키워드 목록입니다. 본문보다 높고 제목보다 낮습니다.",
                }),
              },
              {
                title: 'text: "desc"',
                desc: l.trans({
                  en: "Prose. Weighted lowest of the roles that match at all.",
                  ko: "본문입니다. 실제로 매치되는 역할 중 가중치가 가장 낮습니다.",
                }),
              },
              {
                title: 'text: "filter" · text: "thumb"',
                desc: l.trans({
                  en: "A scoping value such as status, role or owner is filter: matchable but weighted zero, so it never outranks a real title hit. thumb is mirrored so a hit can be rendered and is never indexed — do not expect it to match.",
                  ko: "status, role, owner처럼 범위를 좁히는 값은 filter입니다. 매치는 되지만 가중치가 0이라 실제 제목 매치를 이기지 못합니다. thumb은 결과를 그릴 수 있도록 함께 저장될 뿐 색인되지 않습니다. 매치를 기대하면 안 됩니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ radius: "xl" })}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70">{desc}</div>
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/user/user.constant.ts"
            code={`export class UserInput extends via((field) => ({
  nickname: field(String, { default: "", text: "title" }),
  bio: field(String, { default: "", text: "desc" }),
  playing: field([String], { text: "tag" }),
  image: field(File, { text: "thumb" }).optional(),
  status: field(UserStatus, { default: "prepare", text: "filter" }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "A role works on a File reference and on an array field. An array of objects is indexed by leaf key, including a leaf that is itself an array. A field inside a Map is not indexed, because there is no fixed path to read it from.",
              ko: "File 참조와 배열 field에도 역할을 붙일 수 있습니다. 객체 배열은 leaf key 기준으로 색인되며 leaf 자체가 배열이어도 됩니다. Map 안의 field는 읽어올 고정 경로가 없어 색인되지 않습니다.",
            })}
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: "A secret, hidden or resolved field carrying a text role is a compile error at the call site and throws while the class is being built as a backstop. The same refusal covers a role declared underneath one of them — field.secret(Noti) is rejected when Noti carries a role of its own, because the stored document holds that subtree in plaintext too. The search mirror stores plaintext, so indexing a secret would leak it through search. Treat the error as the rule working, not as something to route around.",
              ko: "secret, hidden, resolve field에 text 역할을 붙이면 호출 지점에서 컴파일 에러이고, 최후 방어선으로 class를 만드는 시점에도 예외가 납니다. 그 아래에 선언된 역할도 같이 막습니다. Noti 자체가 역할을 들고 있으면 field.secret(Noti)도 거부되는데, 저장된 document는 그 하위 트리도 평문으로 담기 때문입니다. 검색 미러는 평문을 저장하므로 secret을 색인하면 검색을 통해 새어나갑니다. 우회할 대상이 아니라 규칙이 동작하는 것으로 보세요.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="cascade-fields" title={l.trans({ en: "Cascade Remove Fields", ko: "캐스케이드 삭제 field" })}>
        <Docs.Title>{l.trans({ en: "Cascade Remove Fields", ko: "캐스케이드 삭제 field" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Both actions can sit on the same field shape, so the value never means related — it means one of exactly two directions, and swapping them is a data loss rather than a bug you notice.",
              ko: "두 동작이 같은 모양의 field에 붙을 수 있으므로, 이 값은 결코 관련이라는 뜻이 아닙니다. 정확히 두 방향 중 하나를 뜻하고, 둘을 바꿔 적으면 알아차릴 버그가 아니라 데이터 손실입니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Which end goes away", ko: "어느 쪽이 사라지는가" })}
            chart={`flowchart LR
  subgraph rr["cascade: removeRef — on the owner's own relation"]
    direction LR
    user["User is removed"] -->|"the field names one document"| file["the File it points at<br/>is removed too"]
  end
  subgraph rw["cascade: removeWith — on the child's reference to its owner"]
    direction LR
    session["AgentSession is removed"] -->|"a reverse-index sweep"| chat["every SessionChat<br/>naming it is removed too"]
  end`}
          />
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "removeRef goes on the relation an owner holds, arrays included. Only a relation accepts it: a String, an ID or a scalar throws while the class is being built, because none of them names a document to remove.",
                ko: "removeRef는 소유 모델이 들고 있는 관계 field에 붙이며 배열도 됩니다. 관계 field에만 붙일 수 있습니다. String·ID·scalar는 클래스 빌드 중에 throw합니다. 셋 다 삭제할 문서를 가리키지 않기 때문입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "removeWith goes on the child's own reference to its owner, so the owner never learns its children exist and a lib model can be extended by an app's. It takes a relation, an ID with ref, or an ID with refPath for a polymorphic owner — and that refPath must name an enumOf field, because a free-form owner type is unknowable at build time.",
                ko: "removeWith는 자식이 자기 소유자를 가리키는 field에 붙습니다. 소유자는 자식의 존재를 몰라도 되고, lib 모델을 앱 모델이 확장할 수 있습니다. 관계 field, ref를 단 ID, 다형 소유자를 위한 refPath를 단 ID를 받습니다. 그 refPath는 enumOf field를 가리켜야 합니다. 자유 문자열 소유자 타입은 빌드 시점에 알 수 없기 때문입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "removeWithAny buys that sweep on purpose, for a child whose owner may be any model in the app. The lookup is one indexed probe, because the declaration creates the same reverse index — but one wildcard edge turns every cascade in the app back to one document at a time, and the boot log names the edges in one info line.",
                ko: "removeWithAny는 그 훑기를 의도적으로 사는 선언입니다. 소유자가 앱의 어떤 모델이든 될 수 있는 자식에 씁니다. 같은 역인덱스가 걸리므로 조회는 색인 프로브 한 번이지만, 와일드카드 edge 하나가 앱 전체의 캐스케이드를 다시 문서 단위로 되돌립니다. 부팅 로그가 그 edge들을 info 한 줄로 알려줍니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The removal runs through the target's service, so the target's own _postRemove runs with it — that is how a File cascade also deletes the stored object. When the target provably has no removal side effect, the boot-time plan collapses it into one query instead.",
                ko: "삭제는 대상의 service를 거치므로 대상의 _postRemove도 함께 실행됩니다. File 캐스케이드가 저장된 객체까지 삭제하는 것이 이 때문입니다. 대상에 삭제 부수효과가 없다는 것이 증명되면 부팅 시점 계획이 한 번의 쿼리로 접습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Nothing checks for other references to the same target. Declaring removeRef asserts that this field owns its target exclusively — and File in particular is deduped by origin, so two parents can share one row. Query-level removal fires no hooks and therefore no cascade.",
                ko: "같은 대상을 참조하는 다른 문서가 있는지는 검사하지 않습니다. removeRef 선언은 이 field가 대상을 단독으로 소유한다는 뜻입니다. 특히 File은 origin으로 중복 제거되므로 부모 둘이 한 행을 공유할 수 있습니다. 쿼리 단위 삭제는 훅을 태우지 않으므로 캐스케이드도 돌지 않습니다.",
              })}
            </li>
          </ul>
          <div className={cardGridRecipe()}>
            <Code.Snippet
              title="libs/shared/lib/user/user.constant.ts"
              code={`export class UserInput extends via((field) => ({
  image: field(File, { text: "thumb", cascade: "removeRef" }).optional(),
  images: field([File], { cascade: "removeRef" }),
})) {}`}
            />
            <Code.Snippet
              title="apps/koyo/lib/sessionChat/sessionChat.constant.ts"
              code={`export class SessionChatInput extends via((field) => ({
  agentSession: field(ID, { ref: "agentSession", cascade: "removeWith" }),
  content: field(String, { default: "", text: "desc" }),
})) {}`}
            />
            <Code.Snippet
              title="apps/koyo/lib/reaction/reaction.constant.ts"
              code={`export class ReactionInput extends via((field) => ({
  parent: field(ID, { refPath: "parentType", cascade: "removeWithAny" }),
  parentType: field(ParentType, { default: "icecreamOrder" }),
  emoji: field(String, { default: "" }),
})) {}`}
            />
          </div>
          <div>
            {l.trans({
              en: "Removal is soft — the row is stamped rather than deleted — but the storage delete a _postRemove performs is not. A cascade is not restorable, and reviving the owner does not revive what went with it.",
              ko: "삭제는 soft입니다. 행은 지워지지 않고 표시만 됩니다. 하지만 _postRemove가 수행하는 저장소 삭제는 soft가 아닙니다. 캐스케이드는 되돌릴 수 없고, 소유자를 되살려도 함께 사라진 것들은 돌아오지 않습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="resolve-fields" title={l.trans({ en: "Resolved Fields", ko: "Resolve field" })}>
        <Docs.Title>{l.trans({ en: "Resolved Fields", ko: "Resolve field" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Some values are not properties of the record, they are properties of the record and whoever is looking at it. Whether this user liked this story, how many times they read it, whether they may edit it — storing any of those on the document would mean storing one row per viewer.",
              ko: "어떤 값은 레코드의 속성이 아니라 레코드와 그것을 보는 사람의 속성입니다. 이 사용자가 이 story에 like를 눌렀는지, 몇 번 읽었는지, 수정할 수 있는지 같은 것들입니다. 그런 값을 document에 저장한다면 조회자마다 행 하나씩을 저장하는 셈입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A resolved field is declared in the constant with the resolve helper and computed per request by an internal signal. The constant names it and types it; the signal says how to work it out and what caller context it needs.",
              ko: "resolved field는 constant에서 resolve helper로 선언하고 internal signal이 요청마다 계산합니다. constant는 이름과 타입을 정하고, signal은 어떻게 구하는지와 어떤 호출자 컨텍스트가 필요한지를 말합니다.",
            })}
          </div>
          <div className={cardGridRecipe()}>
            <Code.Snippet
              className="w-full"
              title="apps/koyo/lib/story/story.constant.ts"
              code={`export class LightStory extends via(
  StoryObject,
  ["root", "user", "title", "totalStat", "status"] as const,
  (resolve) => ({
    view: resolve(Int),
    like: resolve(Int),
  }),
) {
  setLike() {
    if (this.like > 0) return false;
    this.totalStat.likes += 1;
    this.like = 1;
    return true;
  }
}`}
            />
            <Code.Snippet
              className="w-full"
              title="apps/koyo/lib/story/story.signal.ts"
              code={`export class StoryInternal extends internal(srv.story.with(srv.actionLog), ({ resolveField }) => ({
  like: resolveField(Int)
    .with(Self, { nullable: true })
    .exec(async function (story, self) {
      if (!self) return 0;
      return (await this.actionLogService.queryLoad({ action: "like", target: story.id, user: self.id }))?.value ?? 0;
    }),
})) {}`}
            />
          </div>
          <div>
            {l.trans({
              en: "A resolved field takes no text role, for the same reason a secret one does not: there is no stored value for the search mirror to copy.",
              ko: "resolved field에는 text 역할을 붙일 수 없습니다. secret과 같은 이유입니다. 검색 미러가 복사해 갈 저장된 값이 없습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="generated-extension"
        title={l.trans({ en: "Extending Generated Models", ko: "Generated model 확장" })}
      >
        <Docs.Title>{l.trans({ en: "Extending Generated Models", ko: "Generated model 확장" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "An app that mounts a library model extends it rather than redeclaring it. Spread the library's inputs, objects, lights, models and insights into via() at the end of each call, and the app's own fields sit beside the inherited ones in the same class.",
              ko: "라이브러리 model을 마운트한 앱은 그것을 다시 선언하지 않고 확장합니다. 각 호출의 끝에 라이브러리의 inputs, objects, lights, models, insights를 via()로 spread하면, 앱 자신의 field가 물려받은 field와 같은 class에 나란히 놓입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/user/user.constant.ts"
            code={`import { via } from "akanjs/constant";
import { user } from "../__lib/lib.constant";

export class UserInput extends via((field) => ({}), ...user.inputs) {}

export class UserObject extends via(
  UserInput,
  (field) => ({
    favoriteFlavor: field(String, { default: "" }),
  }),
  ...user.objects,
) {}

export class LightUser extends via(UserObject, ["roles"] as const, (resolve) => ({}), ...user.lights) {}

export class User extends via(UserObject, LightUser, (resolve) => ({}), ...user.models) {}

export class UserInsight extends via(User, (field) => ({}), ...user.insights) {}`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-1">
            {[
              l.trans({
                en: "Write all five layers in order, including an empty Insight class, and put as const on every enumOf array and every Light tuple.",
                ko: "다섯 계층을 순서대로, 비어 있는 Insight class까지 포함해 모두 씁니다. 모든 enumOf 배열과 모든 Light tuple에는 as const를 답니다.",
              }),
              l.trans({
                en: "Put display and predicate logic on Light<Model>, collection helpers as statics on the full model, and nothing in a util module.",
                ko: "표시와 판정 로직은 Light<Model>에, collection helper는 full model의 static에 두고, util module에는 아무것도 두지 않습니다.",
              }),
              l.trans({
                en: "Never use a non-null assertion. Narrow with ?., an early return, or a type predicate — and remember that a hidden or secret value is null rather than undefined.",
                ko: "non-null 단언은 쓰지 않습니다. ?., 이른 return, type predicate로 좁히세요. hidden이나 secret 값은 undefined가 아니라 null이라는 것도 함께 기억합니다.",
              }),
              l.trans({
                en: "Give any field whose business meaning is not obvious a short trailing comment, and nothing else a comment at all.",
                ko: "비즈니스 의미가 뻔하지 않은 field에만 짧은 꼬리 주석을 달고, 그 밖에는 주석을 달지 않습니다.",
              }),
              l.trans({
                en: "Import another module's constant from its direct file path rather than through a barrel, which is the sanctioned exception to the deep-import rule.",
                ko: "다른 module의 constant는 barrel이 아니라 직접 파일 경로에서 import합니다. deep import 규칙의 허용된 예외입니다.",
              }),
            ].map((rule) => (
              <div key={rule} className={panelRecipe({ padding: "row" }, "text-foreground/70")}>
                {rule}
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
