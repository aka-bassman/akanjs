import { usePage } from "@apps/akan/client";
import {
  Code,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type LinkGridItem,
  type MatrixGroup,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const termRows: IntroItem[] = [
    {
      name: "full model",
      desc: l.trans({
        en: "The complete model class, such as `cnst.Ticket`, with every field the constant declares.",
        ko: "`cnst.Ticket`처럼 constant가 선언한 필드를 모두 가진 완전한 모델 클래스입니다.",
      }),
    },
    {
      name: "light model",
      desc: l.trans({
        en: "A slimmer class, such as `cnst.LightTicket`, holding only the fields a list needs.",
        ko: "`cnst.LightTicket`처럼 목록에 필요한 필드만 담은 가벼운 클래스입니다.",
      }),
    },
    {
      name: "view payload",
      desc: l.trans({
        en: "What `fetch.viewTicket(id)` returns as `ticketView`: one record as plain data.",
        ko: "`fetch.viewTicket(id)`가 `ticketView`로 돌려주는 값으로, 레코드 하나를 순수 데이터로 담습니다.",
      }),
    },
    {
      name: "hydrate",
      desc: l.trans({
        en: "Filling the client store with data the server already fetched, so no second request is sent.",
        ko: "서버가 이미 가져온 데이터로 클라이언트 store를 채우는 일입니다. 같은 요청을 다시 보내지 않습니다.",
      }),
    },
  ];

  const overviewCards = [
    {
      title: l.trans({ en: "Takes the full model", ko: "full 모델을 받습니다" }),
      code: "ticket: cnst.Ticket",
      desc: l.trans({
        en: "Every field is there, including long text and nested data that a list leaves out.",
        ko: "목록에서는 빠지는 긴 본문과 중첩 데이터까지 모든 필드가 들어 있습니다.",
      }),
    },
    {
      title: l.trans({ en: "Only draws", ko: "그리기만 합니다" }),
      code: "Ticket.Util.* · Ticket.Unit.*",
      desc: l.trans({
        en: "It may render Units, Utils, Zones and its own subcomponents. Saving and deciding happen elsewhere.",
        ko: "Unit, Util, Zone과 자체 하위 컴포넌트를 조합할 수 있습니다. 저장과 판단은 다른 파일에서 합니다.",
      }),
    },
    {
      title: l.trans({ en: "Exports General", ko: "General을 export합니다" }),
      code: "Ticket.View.General",
      desc: l.trans({
        en: (
          <span>
            <code>General</code> is the main export. A long screen adds named sections beside it.
          </span>
        ),
        ko: (
          <span>
            주 export는 <code>General</code>입니다. 화면이 길면 이름 붙인 섹션을 옆에 더 둡니다.
          </span>
        ),
      }),
    },
    {
      title: l.trans({ en: "Drawn through a Zone", ko: "Zone을 거쳐 그려집니다" }),
      code: "renderView={(ticket) => …}",
      desc: l.trans({
        en: (
          <span>
            A detail Zone hands the model from the server to it through <code>Load.View</code>.
          </span>
        ),
        ko: (
          <span>
            상세 Zone이 서버에서 받은 모델을 <code>Load.View</code>로 넘겨 줍니다.
          </span>
        ),
      }),
    },
  ];

  const aspectLabels = {
    model: l.trans({ en: "Model", ko: "받는 모델" }),
    export: l.trans({ en: "Export", ko: "대표 export" }),
    props: l.trans({ en: "Props", ko: "props 타입" }),
    drawnBy: l.trans({ en: "Drawn by", ko: "그리는 쪽" }),
  };
  const comparisonCards = [
    {
      name: "View",
      title: l.trans({ en: "one record in full", ko: "레코드 하나를 자세히" }),
      desc: l.trans({
        en: "For one detail page or detail section.",
        ko: "상세 page나 상세 섹션 하나에 씁니다.",
      }),
      aspects: [
        { label: aspectLabels.model, code: "cnst.Ticket" },
        { label: aspectLabels.export, code: "Ticket.View.General" },
        { label: aspectLabels.props, code: "GeneralProps" },
        { label: aspectLabels.drawnBy, code: "Load.View → renderView" },
      ],
    },
    {
      name: "Unit",
      title: l.trans({ en: "one item of many", ko: "여럿 중 하나" }),
      desc: l.trans({
        en: "For list rows, cards and compact summaries.",
        ko: "목록의 행, 카드, 짧은 요약에 씁니다.",
      }),
      aspects: [
        { label: aspectLabels.model, code: "cnst.LightTicket" },
        { label: aspectLabels.export, code: "Ticket.Unit.Card" },
        { label: aspectLabels.props, code: 'ModelProps<"ticket", cnst.LightTicket>' },
        { label: aspectLabels.drawnBy, code: "Load.Units → renderItem" },
      ],
    },
  ];

  const storeKeyRows: IntroItem[] = [
    {
      name: "<model>",
      desc: l.trans({
        en: "The full model instance, built from the payload's `<model>Obj`.",
        ko: "payload의 `<model>Obj`로 만든 full 모델 인스턴스입니다.",
      }),
      example: "ticket: new cnst.Ticket().set(ticketObj)",
    },
    {
      name: "<model>Loading",
      desc: l.trans({
        en: "Set to `false`, so the View draws right away with no loading state.",
        ko: "`false`로 두어 View가 로딩 상태 없이 바로 그려지게 합니다.",
      }),
      example: "ticketLoading: false",
    },
    {
      name: "<model>Modal",
      desc: l.trans({
        en: 'Set to `"view"`, so a modal wrapper opens the record to read, not its edit form.',
        ko: '`"view"`로 두어 모달 래퍼가 편집 폼이 아닌 보기 화면을 열게 합니다.',
      }),
      example: 'ticketModal: "view"',
    },
    {
      name: "<model>ViewAt",
      desc: l.trans({
        en: "The `Date` the server stamped on the payload, used to compare it with the store.",
        ko: "서버가 payload에 찍은 `Date`로, store에 든 값과 어느 쪽이 최신인지 비교할 때 씁니다.",
      }),
      example: "ticketViewAt: ticketView.ticketViewAt",
    },
  ];

  const ruleColumns = [
    { key: "view", label: "View", caption: "*.View.tsx" },
    { key: "util", label: "Util", caption: "*.Util.tsx" },
    { key: "zone", label: "Zone", caption: "*.Zone.tsx" },
    { key: "page", label: "page", caption: "page/**" },
  ];
  const inView = { view: true, util: false, zone: false, page: false };
  const inClient = { view: false, util: true, zone: true, page: false };

  const ruleGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "Drawing — the View's job", ko: "그리기 — View의 일" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "fields and markup", ko: "필드와 마크업" })}</span>,
          desc: l.trans({
            en: "Titles, body text, nested data and formatted numbers from the full model.",
            ko: "full 모델의 제목, 본문, 중첩 데이터, 형식을 맞춘 숫자를 그립니다.",
          }),
          marks: inView,
        },
        {
          name: "l() · l.trans()",
          desc: l.trans({
            en: "Field names, enum values and headings come from the dictionary.",
            ko: "필드 이름, enum 값, 제목은 dictionary에서 가져옵니다.",
          }),
          marks: inView,
        },
        {
          name: "General · Discord",
          desc: l.trans({
            en: (
              <span>
                A large View splits into named sections, as <code>User.View</code> does, not one giant{" "}
                <code>General</code>.
              </span>
            ),
            ko: (
              <span>
                큰 View는 거대한 <code>General</code> 하나 대신 <code>User.View</code>처럼 이름 붙인 섹션으로 나눕니다.
              </span>
            ),
          }),
          marks: inView,
        },
        {
          name: "<Model>.Unit · <Model>.Util",
          desc: l.trans({
            en: "A View may render Units, Utils and Zones; each keeps its own job.",
            ko: "View 안에서 Unit, Util, Zone을 그려도 됩니다. 각자 자기 일을 그대로 합니다.",
          }),
          marks: inView,
        },
      ],
    },
    {
      label: l.trans({ en: "Behaviour — another file", ko: "동작 — 다른 파일의 일" }),
      rows: [
        {
          name: "onClick · submit",
          desc: l.trans({
            en: (
              <span>
                A button or action is a Util the View renders, such as <code>User.Util.ChangePassword</code>.
              </span>
            ),
            ko: (
              <span>
                버튼과 동작은 View가 그려 주는 Util입니다. <code>User.Util.ChangePassword</code>가 그 예입니다.
              </span>
            ),
          }),
          marks: { view: false, util: true, zone: false, page: false },
        },
        {
          name: "useState · useEffect",
          desc: l.trans({
            en: "Hooks need the browser, so they live in a Util or a Zone.",
            ko: "hook은 브라우저가 필요하므로 Util이나 Zone에 둡니다.",
          }),
          marks: inClient,
        },
        {
          name: "st.use · st.do",
          desc: l.trans({
            en: "Store reads and writes. The store, signal and service do the actual mutation.",
            ko: "store를 읽고 씁니다. 실제 변경은 store, signal, service가 맡습니다.",
          }),
          marks: inClient,
        },
        {
          name: "Load.View",
          desc: l.trans({
            en: "Hydrates the store from the view payload and hands the model to the View.",
            ko: "view payload로 store를 hydrate하고 모델을 View에 넘깁니다.",
          }),
          marks: { view: false, util: false, zone: true, page: false },
        },
        {
          name: "fetch.view<Model>",
          desc: l.trans({
            en: "Called in the route, so the query starts before the first byte is sent.",
            ko: "route에서 부르므로 첫 바이트가 나가기 전에 query가 시작됩니다.",
          }),
          marks: { view: false, util: false, zone: false, page: true },
        },
      ],
    },
  ];

  const relatedLinks: LinkGridItem[] = [
    {
      href: "/conventions/module/unit",
      title: "Model.Unit.tsx",
      desc: l.trans({
        en: "The light-model counterpart, for list rows and cards.",
        ko: "목록의 행과 카드를 그리는, light 모델 쪽 짝입니다.",
      }),
    },
    {
      href: "/conventions/module/util",
      title: "Model.Util.tsx",
      desc: l.trans({
        en: "Where the buttons and actions inside a View live.",
        ko: "View 안의 버튼과 동작이 사는 곳입니다.",
      }),
    },
    {
      href: "/conventions/module/zone#load-view-zone",
      title: "Model.Zone.tsx",
      desc: l.trans({
        en: "The detail Zone, with every prop of Load.View.",
        ko: "상세 Zone과 Load.View의 모든 prop을 다룹니다.",
      }),
    },
    {
      href: "/docs/arch/frontend#file-roles",
      title: l.trans({ en: "UI Architecture", ko: "UI 아키텍처" }),
      desc: l.trans({
        en: "Why each UI file role runs on the server or the client.",
        ko: "UI 파일 역할마다 서버와 클라이언트 중 어디서 실행되는지 설명합니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title="Model.View.tsx">
        <Docs.Title>Model.View.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A View file draws one record in full: the body of a detail page or a detail section. It takes the full model as a prop and only draws it.",
              ko: "View 파일은 레코드 하나를 빠짐없이 그립니다. 상세 page나 상세 섹션의 본문이 바로 View입니다. full 모델을 prop으로 받아 그리기만 합니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {overviewCards.map((card) => (
              <div key={card.code} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{card.title}</div>
                <code className={chip}>{card.code}</code>
                <div className="mt-2 text-foreground/70 text-sm">{card.desc}</div>
              </div>
            ))}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="comparison" title={l.trans({ en: "View vs Unit", ko: "View와 Unit의 차이" })}>
        <Docs.Title>{l.trans({ en: "View vs Unit", ko: "View와 Unit의 차이" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Both files only draw a model. They differ in how much of the model they get and in the role they play on the page.",
              ko: "두 파일 모두 모델을 그리기만 합니다. 다른 점은 모델을 얼마나 받는지, 그리고 page에서 어떤 역할을 하는지입니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {comparisonCards.map((card) => (
              <div key={card.name} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">
                  <code>{card.name}</code> · {card.title}
                </div>
                <div className="mt-1 text-foreground/70 text-sm">{card.desc}</div>
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-border/60 border-t pt-3 text-sm">
                  {card.aspects.flatMap(({ label, code }) => [
                    <dt key={`${label}-label`} className="text-foreground/50 text-xs leading-5">
                      {label}
                    </dt>,
                    <dd key={`${label}-code`} className="wrap-anywhere font-mono text-foreground text-xs leading-5">
                      {code}
                    </dd>,
                  ])}
                </dl>
              </div>
            ))}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>One record in detail is a View.</strong> It needs fields such as a long body, so it takes
                    the full model.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>레코드 하나를 자세히 보여 주면 View입니다.</strong> 긴 본문 같은 필드가 필요하므로 full
                    모델을 받습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The same shape repeated is a Unit.</strong> A list sends many records at once, so each row
                    gets the light model.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>같은 모양이 반복되면 Unit입니다.</strong> 목록은 레코드를 한꺼번에 많이 보내므로 행마다
                    light 모델을 받습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="standard-view-shape"
        title={l.trans({ en: "Standard View Shape", ko: "View 파일의 기본 형태" })}
      >
        <Docs.Title>{l.trans({ en: "Standard View Shape", ko: "View 파일의 기본 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every View file starts from the same skeleton. Here is the whole file for a ticket:",
              ko: "View 파일은 모두 같은 뼈대에서 시작합니다. 티켓의 View 파일 전체입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/ticket/Ticket.View.tsx"
            code={`import { type cnst, usePage } from "@apps/koyo/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  ticket: cnst.Ticket;
}

export const General = ({ className, ticket }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <h1>{ticket.title}</h1>
      <div>
        {l("ticket.status")}: {l(\`ticketStatus.\${ticket.status}\`)}
      </div>
      <p>{ticket.content}</p>
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
                      The main export is <code>General</code>.
                    </strong>{" "}
                    Pages and Zones reach it as <code>Ticket.View.General</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      주 export는 <code>General</code>입니다.
                    </strong>{" "}
                    page와 Zone은 <code>Ticket.View.General</code>로 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Props are the full model plus a class name.</strong> <code>GeneralProps</code> sits right
                    above the component, <code>className</code> first, then <code>ticket: cnst.Ticket</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>props는 full 모델과 className입니다.</strong> <code>GeneralProps</code>는 컴포넌트 바로 위에
                    두고, <code>className</code>을 먼저, 이어서 <code>ticket: cnst.Ticket</code>을 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The caller's class goes last.</strong> <code>cn("…", className)</code> lets the page or Zone
                    adjust width and spacing.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>호출한 쪽의 클래스는 마지막에 합칩니다.</strong> <code>cn("…", className)</code>으로 page나
                    Zone이 너비와 간격을 조정할 수 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Every label goes through the dictionary.</strong> A field name is{" "}
                    <code>l("ticket.status")</code>. An enum value is keyed by the enum's name, so <code>"active"</code>{" "}
                    reads <code>l("ticketStatus.active")</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>라벨은 모두 dictionary를 거칩니다.</strong> 필드 이름은 <code>l("ticket.status")</code>로
                    가져옵니다. enum 값의 키는 enum 이름으로 시작하므로, <code>"active"</code>는{" "}
                    <code>l("ticketStatus.active")</code>로 읽습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="detail-patterns"
        title={l.trans({ en: "Full Model Detail Patterns", ko: "full 모델을 그리는 패턴" })}
      >
        <Docs.Title>{l.trans({ en: "Full Model Detail Patterns", ko: "full 모델을 그리는 패턴" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A View receives the full model, not the light summary, so it can draw any field the constant declares on it. Plain text fields go straight into the markup:",
              ko: "View는 light 요약이 아니라 full 모델을 받으므로, constant가 full 모델에 선언한 필드는 무엇이든 그릴 수 있습니다. 평범한 텍스트 필드는 마크업에 그대로 넣습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/blog/lib/article/Article.View.tsx"
            code={`import type { cnst } from "@apps/blog/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  article: cnst.Article;
}

export const General = ({ className, article }: GeneralProps) => {
  return (
    <article className={cn("flex flex-col gap-2", className)}>
      <h1>{article.title}</h1>
      <p>{article.description}</p>
    </article>
  );
};`}
          />
          <div>
            {l.trans({
              en: "An enum goes through its dictionary label, and a number is formatted where it is drawn:",
              ko: "enum은 dictionary 라벨을 거치고, 숫자는 그리는 자리에서 형식을 맞춥니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/order/Order.View.tsx"
            code={`import { type cnst, usePage } from "@apps/koyo/client";

interface GeneralProps {
  className?: string;
  order: cnst.Order;
}

export const General = ({ className, order }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={className}>
      <span>{l(\`orderStatus.\${order.status}\`)}</span>
      <div>{order.totalPrice.toLocaleString()}</div>
    </div>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Shared display logic goes on the Light model.</strong> A one-off{" "}
                    <code>toLocaleString()</code> stays in the View. A format a Unit needs too becomes a method on{" "}
                    <code>LightOrder</code>, which the full model inherits.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>함께 쓰는 표시 로직은 Light 모델에 둡니다.</strong> 한 번만 쓰는{" "}
                    <code>toLocaleString()</code>은 View에 둡니다. Unit에서도 필요한 형식이라면 full 모델이 물려받는{" "}
                    <code>LightOrder</code>의 메서드로 만듭니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A long screen gets named sections.</strong> <code>User.View</code> in{" "}
                    <code>libs/shared</code> exports <code>General</code> and <code>Discord</code> instead of one giant
                    component.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>긴 화면은 이름 붙인 섹션으로 나눕니다.</strong> <code>libs/shared</code>의{" "}
                    <code>User.View</code>는 거대한 컴포넌트 하나 대신 <code>General</code>과 <code>Discord</code>를
                    export합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A button inside is a Util.</strong> <code>User.View.General</code> renders{" "}
                    <code>User.Util.ChangePassword</code>; the View places it, the Util owns the click.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>안에 든 버튼은 Util입니다.</strong> <code>User.View.General</code>은{" "}
                    <code>User.Util.ChangePassword</code>를 그립니다. 자리는 View가 잡고, 클릭은 Util이 처리합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="using-view-pages" title={l.trans({ en: "Using View In Pages", ko: "page에서 View 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Using View In Pages", ko: "page에서 View 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A detail page starts the request with <code>fetch.view&lt;Model&gt;(id)</code> and gives the view
                  payload to a Zone. Whether you await the call decides when the section arrives:
                </span>
              ),
              ko: (
                <span>
                  상세 page는 <code>fetch.view&lt;Model&gt;(id)</code>로 요청을 시작하고 view payload를 Zone에 넘깁니다.
                  호출을 await하느냐에 따라 섹션이 도착하는 시점이 달라집니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Destructure — streamed", ko: "구조 분해 — 스트리밍" })}
              </div>
              <code className={chip}>{"const { ticketView } = fetch.viewTicket(id)"}</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "The page markup is sent while the query runs. The section fills in behind its own boundary.",
                  ko: "query가 실행되는 동안 page 마크업이 먼저 나갑니다. 섹션은 자기만의 boundary 뒤에서 채워집니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "await — part of the shell", ko: "await — 셸에 넣기" })}
              </div>
              <code className={chip}>await Promise.all([fetch.viewTicket(id)])</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "For when the page itself reads the model: a title, an id for a link, or a redirect decision.",
                  ko: "page가 모델을 직접 읽을 때 씁니다. 제목, 링크를 만들 id, redirect 판단이 그렇습니다.",
                })}
              </div>
            </div>
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Streamed", ko: "스트리밍" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The usual detail page does not await, and hands the promise across as it is:",
              ko: "보통의 상세 page는 await하지 않고 promise를 그대로 넘깁니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/ticket/[ticketId]/_index.tsx"
            code={`import { fetch, Ticket } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("ticketId", ID)
  .render(({ ticketId }) => {
    const { ticketView } = fetch.viewTicket(ticketId);
    return <Ticket.Zone.View view={ticketView} />;
  });`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      No <code>async</code>, no <code>await</code>.
                    </strong>{" "}
                    The render callback is <code>async</code> only when its body awaits.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>async</code>도 <code>await</code>도 없습니다.
                    </strong>{" "}
                    render callback은 본문이 await할 때만 <code>async</code>를 붙입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The Zone takes the promise.</strong> <code>ClientView</code> accepts a payload or its
                    promise, and <code>Load.View</code> shows a skeleton until it lands.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>Zone은 promise를 그대로 받습니다.</strong> <code>ClientView</code>는 payload와 그 promise를
                    모두 받고, <code>Load.View</code>는 도착할 때까지 스켈레톤을 보여 줍니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Awaited", ko: "await하기" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  When the page needs the record itself, await the call. It resolves to an object holding{" "}
                  <code>ticket</code> and <code>ticketView</code>:
                </span>
              ),
              ko: (
                <span>
                  page가 레코드를 직접 써야 하면 호출을 await합니다. 결과는 <code>ticket</code>과{" "}
                  <code>ticketView</code>를 담은 객체입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/ticket/[ticketId]/_index.tsx"
            code={`import { fetch, Ticket, usePage } from "@apps/koyo/client"; // [!code collapse:4]
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { buttonRecipe, Link } from "akanjs/ui";

export default page()
  .param("ticketId", ID)
  .render(async ({ ticketId }) => {
    const { l } = usePage();
    const [{ ticket, ticketView }] = await Promise.all([
      fetch.viewTicket(ticketId),
    ]);
    return (
      <div className="flex flex-col gap-4">
        <Ticket.Zone.View view={ticketView} />
        <Link className={buttonRecipe()} href={\`/ticket/\${ticket.id}/edit\`}>
          {l("base.updateModel", { model: l("ticket.modelName") })}
        </Link>
      </div>
    );
  });`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>ticketView</code> still goes to the Zone.
                    </strong>{" "}
                    Already resolved, it renders in the first HTML with no loading state.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>ticketView</code>는 여전히 Zone에 넘깁니다.
                    </strong>{" "}
                    이미 도착한 값이므로 로딩 상태 없이 첫 HTML에 그려집니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>ticket</code> stays in the page.
                    </strong>{" "}
                    It is the hydrated model, for the link, a title or a redirect.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>ticket</code>은 page 안에서만 씁니다.
                    </strong>{" "}
                    hydrate된 모델 인스턴스로, 링크나 제목, redirect 판단에 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      The page does not call <code>Load.View</code> itself.
                    </strong>{" "}
                    <code>renderView</code> is a function, and a server page cannot pass a function to a client
                    component. The Zone sits between them for that reason.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      page가 <code>Load.View</code>를 직접 부르지는 않습니다.
                    </strong>{" "}
                    <code>renderView</code>는 함수인데, 서버 page는 클라이언트 컴포넌트에 함수를 넘길 수 없습니다.
                    그래서 둘 사이에 Zone을 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Pass <code>ticketView</code> to a Zone, never <code>ticket</code>.
                  </strong>{" "}
                  <code>ticket</code> is a class instance, and React Flight refuses a class instance as a client prop.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    Zone에는 <code>ticket</code>이 아니라 <code>ticketView</code>를 넘깁니다.
                  </strong>{" "}
                  <code>ticket</code>은 클래스 인스턴스이고, React Flight는 클래스 인스턴스를 클라이언트 prop으로 받지
                  않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="load-view"
        title={l.trans({ en: "Load.View And Store Hydration", ko: "Load.View로 store hydrate하기" })}
      >
        <Docs.Title>{l.trans({ en: "Load.View And Store Hydration", ko: "Load.View로 store hydrate하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Load.View</code> puts the record from the view payload into the client store, then calls your{" "}
                  <code>renderView</code> with the full model. A detail Zone is little more than this one call:
                </span>
              ),
              ko: (
                <span>
                  <code>Load.View</code>는 view payload의 레코드를 클라이언트 store에 넣은 뒤, full 모델로{" "}
                  <code>renderView</code>를 호출합니다. 상세 Zone은 사실상 이 호출 하나입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/ticket/Ticket.Zone.tsx"
            code={`"use client"; // [!code collapse:4]
import { type cnst, Ticket } from "@apps/koyo/client";
import type { ClientView } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface ViewProps {
  className?: string;
  view: ClientView<"ticket", cnst.Ticket>;
}
export const View = ({ className, view }: ViewProps) => {
  return (
    <Load.View
      className={className}
      view={view}
      renderView={(ticket) => <Ticket.View.General ticket={ticket} />}
    />
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Use it wherever server-fetched view data meets the store.</strong> A detail Zone, a tab
                    layout or a reusable section all wrap the View this way.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>서버에서 가져온 view 데이터를 store에 넣어야 하는 곳이면 씁니다.</strong> 상세 Zone, 탭
                    레이아웃, 재사용 섹션 모두 이렇게 View를 감쌉니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Waiting and empty states are built in.</strong> A pending promise shows <code>loading</code>
                    , a skeleton by default; an empty payload shows <code>empty</code>, an <code>{"<Empty />"}</code> by
                    default.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>대기와 빈 상태는 이미 들어 있습니다.</strong> 기다리는 동안은 <code>loading</code>(기본은
                    스켈레톤)을, payload가 비어 있으면 <code>empty</code>(기본은 <code>{"<Empty />"}</code>)를 보여
                    줍니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "What it writes to the store", ko: "store에 쓰는 값" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Before the View renders, <code>Load.View</code> sets four keys for the model:
                </span>
              ),
              ko: (
                <span>
                  View를 그리기 전에 <code>Load.View</code>는 모델에 대해 키 네 개를 설정합니다:
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Store key", ko: "store 키" })} items={storeKeyRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Newer store data wins.</strong> If the store already holds this record with a later{" "}
                    <code>&lt;model&gt;ViewAt</code>, <code>Load.View</code> keeps the store's copy instead of the older
                    payload.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>store 쪽이 더 최신이면 store 값을 씁니다.</strong> store가 이 레코드를 더 나중의{" "}
                    <code>&lt;model&gt;ViewAt</code>으로 이미 들고 있으면, <code>Load.View</code>는 오래된 payload로
                    덮어쓰지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Going back after a save loads the record again.</strong> If the navigation cache replays a
                    payload from before the save, <code>Load.View</code> fetches the record again with{" "}
                    <code>st.do.view&lt;Model&gt;(id)</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>저장한 뒤 뒤로 가면 레코드를 다시 불러옵니다.</strong> 탐색 캐시가 저장 전 payload를 다시
                    꺼내면, <code>Load.View</code>가 <code>st.do.view&lt;Model&gt;(id)</code>로 레코드를 새로
                    가져옵니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "What belongs in a View, and which file takes everything else:",
              ko: "View에 두는 것과, 나머지를 맡는 파일을 한눈에 정리했습니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "The work", ko: "할 일" })}
            columns={ruleColumns}
            groups={ruleGroups}
            markLabel={l.trans({ en: "Belongs here", ko: "여기에 둡니다" })}
            emptyLabel={l.trans({ en: "Not here", ko: "여기에 두지 않습니다" })}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>A View is a server file, and lint checks it.</strong> In a <code>*.View.tsx</code>, a{" "}
                  <code>{'"use client"'}</code> line, a React hook import such as <code>useState</code>, or an{" "}
                  <code>st</code> import each fail <code>akan lint</code>.
                </span>
              ),
              ko: (
                <span>
                  <strong>View는 서버 파일이고, lint가 이를 검사합니다.</strong> <code>*.View.tsx</code>에{" "}
                  <code>{'"use client"'}</code> 줄, <code>useState</code> 같은 React hook import, <code>st</code> import
                  중 하나라도 있으면 <code>akan lint</code>가 실패합니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.SubSubTitle>{l.trans({ en: "Related pages", ko: "함께 볼 페이지" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={relatedLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
