import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows = [
    {
      name: "label",
      desc: l.trans({
        en: 'The text a user reads for one name, written once per language: `t(["Title", "제목"])`.',
        ko: '이름 하나에 대해 사용자가 읽는 문구입니다. 언어마다 한 번씩 씁니다: `t(["Title", "제목"])`.',
      }),
    },
    {
      name: "desc",
      desc: l.trans({
        en: "A longer explanation added with `.desc([en, ko])`. Forms show it as a tooltip.",
        ko: "`.desc([en, ko])`로 덧붙이는 긴 설명입니다. 폼에서는 툴팁으로 보입니다.",
      }),
    },
    {
      name: "key",
      desc: l.trans({
        en: "The dotted path code uses to read a label, such as `ticket.title`.",
        ko: "코드가 레이블을 꺼낼 때 쓰는, 점으로 이은 경로입니다. `ticket.title` 같은 모양입니다.",
      }),
    },
    {
      name: l.trans({ en: "language tuple", ko: "언어 배열" }),
      desc: l.trans({
        en: 'One entry per language, in the order the builder was given: `["Title", "제목"]`.',
        ko: '언어마다 항목 하나씩, builder에 넘긴 언어 순서대로 적은 배열입니다: `["Title", "제목"]`.',
      }),
    },
    {
      name: l.trans({ en: "stage", ko: "단계" }),
      desc: l.trans({
        en: "One call in the chain, such as `.model()` or `.error()`. Each labels one kind of name.",
        ko: "체인의 호출 하나입니다. `.model()`, `.error()`처럼 한 종류의 이름을 맡습니다.",
      }),
    },
  ];

  const stageRows = [
    {
      name: ".of()",
      desc: l.trans({ en: "The module itself.", ko: "모듈 자체의 이름과 설명입니다." }),
      example: "ticket.modelName\nticket.modelDesc",
    },
    {
      name: ".model()",
      desc: l.trans({
        en: "Every model field. `id`, `createdAt`, `updatedAt` and `removedAt` come labelled.",
        ko: "모델의 모든 필드입니다. `id`, `createdAt`, `updatedAt`, `removedAt`은 이미 레이블이 있습니다.",
      }),
      example: "ticket.title\nticket.title.desc",
    },
    {
      name: ".insight()",
      desc: l.trans({
        en: "Every insight field. The built-in `count` comes labelled.",
        ko: "모든 insight 필드입니다. 기본 제공되는 `count`는 이미 레이블이 있습니다.",
      }),
      example: "ticket.insight.activeCount",
    },
    {
      name: ".query()",
      desc: l.trans({
        en: "Every filter query and its arguments. The built-in `any` comes labelled.",
        ko: "모든 filter query와 그 인자입니다. 기본 제공되는 `any`는 이미 레이블이 있습니다.",
      }),
      example: "ticket.query.inProject\nticket.query.inProject.arg.project",
    },
    {
      name: ".sort()",
      desc: l.trans({
        en: "Every sort order. `latest`, `oldest` and `relevance` come labelled.",
        ko: "모든 정렬 순서입니다. `latest`, `oldest`, `relevance`는 이미 레이블이 있습니다.",
      }),
      example: "ticket.sort.due",
    },
    {
      name: ".enum()",
      desc: l.trans({
        en: "Every value of one `enumOf`. The key starts with the enum's name, not the model's.",
        ko: "`enumOf` 하나의 모든 값입니다. key는 모델 이름이 아니라 enum 이름으로 시작합니다.",
      }),
      example: "ticketStatus.inProgress",
    },
    {
      name: ".slice()",
      desc: l.trans({
        en: "Every named slice, as a list key and an insight key. The root slice comes labelled.",
        ko: "이름 있는 모든 slice입니다. list key와 insight key가 하나씩 생기고, root slice는 이미 레이블이 있습니다.",
      }),
      example: "ticket.signal.ticketListInProject\nticket.signal.ticketInsightInProject",
    },
    {
      name: ".endpoint()",
      desc: l.trans({
        en: "Every custom endpoint and its arguments. Generated CRUD such as `createTicket` comes labelled.",
        ko: "모든 커스텀 endpoint와 그 인자입니다. `createTicket` 같은 생성 CRUD는 이미 레이블이 있습니다.",
      }),
      example: "ticket.signal.openTicket\nticket.signal.openTicket.arg.due",
    },
    {
      name: ".error()",
      desc: l.trans({
        en: "Error messages, written as plain language tuples.",
        ko: "에러 메시지입니다. 언어 배열을 그대로 적습니다.",
      }),
      example: "ticket.error.cannotOpen",
    },
    {
      name: ".translate()",
      desc: l.trans({
        en: "Any other phrase the module shows, such as toasts and button text.",
        ko: "토스트, 버튼 문구처럼 모듈이 보여주는 그 밖의 문구입니다.",
      }),
      example: "ticket.openTicketLoading",
    },
  ];

  const helperRows = [
    {
      name: "l(key)",
      desc: l.trans({
        en: "A label on screen, in a server or client component. Get `l` from `usePage()`.",
        ko: "server와 client component 어디서든 화면에 보일 레이블을 꺼냅니다. `l`은 `usePage()`에서 얻습니다.",
      }),
      example: 'l("ticket.title")',
    },
    {
      name: "new Err(key)",
      desc: l.trans({
        en: "An error thrown in a document or service. Import `Err` from `../dict`.",
        ko: "document나 service에서 던지는 에러입니다. `Err`는 `../dict`에서 import합니다.",
      }),
      example: 'throw new Err("ticket.error.cannotOpen");',
    },
    {
      name: "msg.success(key)",
      desc: l.trans({
        en: "A toast from a store action. Import `msg` from `../useClient`.",
        ko: "store 액션이 띄우는 토스트입니다. `msg`는 `../useClient`에서 import합니다.",
      }),
      example: 'msg.success("ticket.openTicketSuccess");',
    },
  ];

  const builderColumns = [
    { key: "model", label: l.trans({ en: "Model", ko: "모델" }), caption: "modelDictionary" },
    { key: "scalar", label: l.trans({ en: "Scalar", ko: "스칼라" }), caption: "scalarDictionary" },
    { key: "service", label: l.trans({ en: "Service", ko: "서비스" }), caption: "serviceDictionary" },
  ];
  const allBuilders = { model: true, scalar: true, service: true };
  const modelAndScalar = { model: true, scalar: true, service: false };
  const modelOnly = { model: true, scalar: false, service: false };
  const builderGroups = [
    {
      label: l.trans({ en: "Name the module and its values", ko: "모듈과 값의 이름" }),
      rows: [
        { name: ".of()", marks: modelAndScalar },
        { name: ".model()", marks: modelAndScalar },
        { name: ".enum()", marks: modelAndScalar },
      ],
    },
    {
      label: l.trans({ en: "Name what the database answers", ko: "데이터베이스 조회의 이름" }),
      rows: [
        { name: ".insight()", marks: modelOnly },
        { name: ".query()", marks: modelOnly },
        { name: ".sort()", marks: modelOnly },
      ],
    },
    {
      label: l.trans({ en: "Name the API", ko: "API의 이름" }),
      rows: [
        { name: ".slice()", marks: modelOnly },
        { name: ".endpoint()", marks: { model: true, scalar: false, service: true } },
      ],
    },
    {
      label: l.trans({ en: "Messages", ko: "메시지" }),
      rows: [
        { name: ".error()", marks: allBuilders },
        { name: ".translate()", marks: allBuilders },
      ],
    },
  ];

  const mistakeColumns = [
    { key: "wrong", label: l.trans({ en: "Instead of", ko: "이렇게 쓰지 말고" }) },
    { key: "fix", label: l.trans({ en: "Write", ko: "이렇게 씁니다" }) },
  ];
  const mistakeRows = [
    {
      wrong: '`l("ticket.status.active")`',
      fix: l.trans({
        en: 'Enum keys start with the enum\'s name: `l("ticketStatus.active")`.',
        ko: 'enum key는 enum 이름으로 시작합니다: `l("ticketStatus.active")`.',
      }),
    },
    {
      wrong: l.trans({ en: "Text typed straight into JSX", ko: "JSX에 직접 적은 문구" }),
      fix: l.trans({
        en: 'Every visible string goes through `l("ticket.modelName")` or `l.trans({ en, ko })`.',
        ko: '보이는 문구는 모두 `l("ticket.modelName")`이나 `l.trans({ en, ko })`를 거칩니다.',
      }),
    },
    {
      wrong: l.trans({ en: "Deleting a stage that has nothing in it", ko: "비어 있는 단계를 지우기" }),
      fix: l.trans({
        en: "Keep it empty, such as `.insight<TicketInsight>((t) => ({}))`.",
        ko: "`.insight<TicketInsight>((t) => ({}))`처럼 빈 채로 둡니다.",
      }),
    },
    {
      wrong: l.trans({ en: "An endpoint label with no `.desc()`", ko: "`.desc()` 없는 endpoint 레이블" }),
      fix: l.trans({
        en: "Write one. AI agents choose a tool by the endpoint's description.",
        ko: "설명을 적습니다. AI 에이전트는 endpoint 설명을 보고 툴을 고릅니다.",
      }),
    },
  ];

  const nextLinks = [
    {
      href: "/conventions/module/constant",
      title: "model.constant.ts",
      desc: l.trans({
        en: "The fields and enums the dictionary labels.",
        ko: "dictionary가 레이블을 붙이는 필드와 enum입니다.",
      }),
    },
    {
      href: "/conventions/module/store",
      title: "model.store.ts",
      desc: l.trans({
        en: "Store actions that show loading and success toasts.",
        ko: "로딩, 성공 토스트를 띄우는 store 액션입니다.",
      }),
    },
    {
      href: "/conventions/scalar/dictionary",
      title: "scalar.dictionary.ts",
      desc: l.trans({ en: "The dictionary of an embedded value.", ko: "내장 값(scalar)의 dictionary입니다." }),
    },
    {
      href: "/conventions/applib/config#i18n",
      title: "akan.config.ts · i18n",
      desc: l.trans({
        en: "Which languages the app serves, and its default.",
        ko: "앱이 제공하는 언어와 기본 언어를 정합니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="dictionary-overview" title="model.dictionary.ts">
        <Docs.Title>model.dictionary.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>{"<model>.dictionary.ts"}</code> is the module's language layer. It gives every name a user
                  reads a label in each language: fields, insight values, filters, sort orders, enum values, slices,
                  endpoints, errors and the module's own UI text.
                </span>
              ),
              ko: (
                <span>
                  <code>{"<model>.dictionary.ts"}</code>는 모듈의 언어 레이어입니다. 필드, insight 값, filter, 정렬
                  순서, enum 값, slice, endpoint, 에러, 모듈 전용 UI 문구까지 사용자가 읽는 모든 이름에 언어별 레이블을
                  붙입니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Code never writes that text itself; it asks for it by key, such as <code>l("ticket.title")</code>. The
                  keys are typed against the constant, filter, slice and endpoint, so adding a field without a label is
                  a compile error.
                </span>
              ),
              ko: (
                <span>
                  코드는 문구를 직접 쓰지 않고 <code>l("ticket.title")</code>처럼 key로 꺼내 씁니다. key는 constant,
                  filter, slice, endpoint의 타입을 따르므로, 레이블 없이 필드를 추가하면 컴파일 에러가 납니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="model-dictionary-pattern"
        title={l.trans({ en: "Model Dictionary Pattern", ko: "modelDictionary 기본 형태" })}
      >
        <Docs.Title>{l.trans({ en: "Model Dictionary Pattern", ko: "modelDictionary 기본 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A database module uses <code>modelDictionary</code>. The stage order is fixed, and a stage with
                  nothing to label is still written, empty, so every dictionary reads the same way.
                </span>
              ),
              ko: (
                <span>
                  데이터베이스 모듈은 <code>modelDictionary</code>를 씁니다. 단계 순서는 고정이고, 붙일 레이블이 없는
                  단계도 빈 채로 적어서 모든 dictionary가 같은 모양으로 읽히게 합니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "Here is the complete file for the ticket module from the constant and document pages:",
              ko: "constant, document 문서에 나온 ticket 모듈의 dictionary 전체입니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/ticket/ticket.dictionary.ts"
          code={`import { modelDictionary } from "akanjs/dictionary";

import type { Ticket, TicketInsight, TicketStatus } from "./ticket.constant";
import type { TicketFilter } from "./ticket.document";
import type { TicketEndpoint, TicketSlice } from "./ticket.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Ticket", "티켓"]).desc(["A support request from a customer", "고객이 남긴 지원 요청"]))
  .model<Ticket>((t) => ({
    title: t(["Title", "제목"]).desc(["Title of the ticket", "티켓 제목"]),
    content: t(["Content", "내용"]).desc(["Body of the ticket", "티켓 본문"]),
    type: t(["Type", "유형"]).desc(["Type of the ticket", "티켓 유형"]),
    status: t(["Status", "상태"]).desc(["Current status of the ticket", "티켓의 현재 상태"]),
    due: t(["Due Date", "기한"]).desc(["When the ticket must be handled", "티켓을 처리해야 하는 기한"]),
  }))
  .insight<TicketInsight>((t) => ({
    activeCount: t(["Active Tickets", "활성 티켓"]).desc(["Number of active tickets", "활성 티켓 개수"]),
  }))
  .query<TicketFilter>((fn) => ({
    inProject: fn(["In Project", "프로젝트별 조회"]).arg((t) => ({
      project: t(["Project", "프로젝트"]).desc(["Project to look in", "조회할 프로젝트"]),
    })),
  }))
  .sort<TicketFilter>((t) => ({
    due: t(["Due Date", "기한순"]).desc(["Earliest due date first", "기한이 빠른 순"]),
  }))
  .enum<TicketStatus>("ticketStatus", (t) => ({
    active: t(["Active", "활성"]).desc(["Waiting to be opened", "열리기를 기다리는 상태"]),
    opened: t(["Opened", "열림"]).desc(["Opened with a due date", "기한을 정해 연 상태"]),
    inProgress: t(["In Progress", "진행 중"]).desc(["Someone is working on it", "처리 중인 상태"]),
    completed: t(["Completed", "완료"]).desc(["Handled and closed", "처리를 마친 상태"]),
  }))
  .slice<TicketSlice>((fn) => ({
    inProject: fn(["Tickets In Project", "프로젝트의 티켓"]).arg((t) => ({
      projectId: t(["Project", "프로젝트"]).desc(["Project to list tickets of", "티켓을 불러올 프로젝트"]),
    })),
  }))
  .endpoint<TicketEndpoint>((fn) => ({
    openTicket: fn(["Open Ticket", "티켓 열기"])
      .desc(["Opens an active ticket and sets its due date", "활성 티켓을 열고 기한을 정합니다"])
      .arg((t) => ({
        ticketId: t(["Ticket ID", "티켓 아이디"]).desc(["Ticket to open", "열 티켓"]),
        due: t(["Due Date", "기한"]).desc(["When the ticket must be handled", "처리 기한"]),
      })),
  }))
  .error({
    cannotOpen: ["Only an active ticket can be opened", "활성 상태인 티켓만 열 수 있습니다."],
  })
  .translate({
    openTicketLoading: ["Opening the ticket…", "티켓을 여는 중입니다."],
    openTicketSuccess: ["Ticket opened", "티켓을 열었습니다."],
  });`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>t</code> makes a label; <code>fn</code> makes one with arguments.
                    </strong>{" "}
                    <code>.query()</code>, <code>.slice()</code> and <code>.endpoint()</code> hand you <code>fn</code>,
                    whose <code>.arg()</code> names every argument the filter or signal declares.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>t</code>는 레이블을, <code>fn</code>은 인자가 있는 레이블을 만듭니다.
                    </strong>{" "}
                    <code>.query()</code>, <code>.slice()</code>, <code>.endpoint()</code>는 <code>fn</code>을 주고, 그{" "}
                    <code>.arg()</code>로 filter나 signal이 선언한 인자마다 레이블을 붙입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Nothing can be skipped.</strong> Each stage must cover every field, query, value, slice or
                    endpoint its type declares, including <code>skip</code>, <code>limit</code> and <code>sort</code>{" "}
                    when a custom endpoint takes them. A missing one is a type error.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>빠뜨릴 수 없습니다.</strong> 각 단계는 타입이 선언한 필드, query, 값, slice, endpoint를
                    하나도 빠짐없이 채워야 하고, 커스텀 endpoint가 받는 <code>skip</code>, <code>limit</code>,{" "}
                    <code>sort</code>도 포함됩니다. 하나라도 빠지면 타입 에러입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Give nearly every label a <code>.desc()</code>,
                    </strong>{" "}
                    even when it repeats the label. Forms show it as a tooltip, and API docs and AI agents read an
                    endpoint's description.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      레이블에는 거의 항상 <code>.desc()</code>를 붙입니다.
                    </strong>{" "}
                    레이블을 되풀이하는 설명이어도 괜찮습니다. 폼은 툴팁으로 보여주고, API 문서와 AI 에이전트는 endpoint
                    설명을 읽습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "What each stage labels", ko: "단계별 레이블과 key" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Each stage writes its labels under a fixed key. The example column shows the keys from the file above:",
              ko: "단계마다 레이블이 들어가는 key 자리가 정해져 있습니다. 예시 칸은 위 파일에서 생기는 key입니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Stage", ko: "단계" })}
            descLabel={l.trans({ en: "What it labels", ko: "레이블 대상" })}
            items={stageRows}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="using-dictionary" title={l.trans({ en: "Using Dictionaries", ko: "dictionary 꺼내 쓰기" })}>
        <Docs.Title>{l.trans({ en: "Using Dictionaries", ko: "dictionary 꺼내 쓰기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Code reads the dictionary through three helpers. Each takes a key, and the user reads the text in their own language.",
              ko: "코드는 헬퍼 세 개로 dictionary를 읽습니다. 셋 모두 key를 받고, 사용자는 그 문구를 자기 언어로 읽습니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Helper", ko: "헬퍼" })} items={helperRows} />

          <Docs.SubSubTitle>{l.trans({ en: "On screen", ko: "화면에서" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  A Template reads a field's label by its key, and the description by that key plus <code>.desc</code>:
                </span>
              ),
              ko: (
                <span>
                  Template은 필드의 레이블을 key로 읽고, 설명은 그 key에 <code>.desc</code>를 붙여 읽습니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          language="tsx"
          title="apps/koyo/lib/ticket/Ticket.Template.tsx"
          code={`"use client";
import { st, usePage } from "@apps/koyo/client";
import { Field, Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const ticketForm = st.use.ticketForm();
  const { l } = usePage();
  return (
    <Layout.Template className={className}>
      <Field.Text
        label={l("ticket.title")}
        desc={l("ticket.title.desc")}
        value={ticketForm.title}
        onChange={st.do.setTitleOnTicket}
      />
    </Layout.Template>
  );
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>usePage()</code> works on the server too,
                    </strong>{" "}
                    so translated text never needs <code>{'"use client"'}</code>. This Template has it for the store.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>usePage()</code>는 서버에서도 동작합니다.
                    </strong>{" "}
                    번역 때문에 <code>{'"use client"'}</code>를 달 일은 없습니다. 이 Template에 붙은 것은 store
                    때문입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>desc</code> becomes a help icon
                    </strong>{" "}
                    beside the label, with the description as its tooltip.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>desc</code>는 도움말 아이콘이 됩니다.
                    </strong>{" "}
                    레이블 옆에 붙고, 설명은 툴팁으로 뜹니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>l()</code> accepts only keys that exist,
                    </strong>{" "}
                    so a typo is a type error. <code>{'l("key", { name })'}</code> fills a <code>{"{name}"}</code>{" "}
                    placeholder in the text.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>l()</code>은 존재하는 key만 받으므로
                    </strong>{" "}
                    오타는 타입 에러가 됩니다. <code>{'l("key", { name })'}</code>은 문구의 <code>{"{name}"}</code>{" "}
                    자리를 채웁니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "In server code", ko: "서버 코드에서" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A document method throws the error by key when a state change is not allowed:",
              ko: "document 메서드는 허용되지 않는 상태 변경을 만나면 key로 에러를 던집니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/ticket/ticket.document.ts"
          code={`import { by } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class Ticket extends by(cnst.Ticket) {
  // active -> opened
  open() {
    if (this.status !== "active") throw new Err("ticket.error.cannotOpen");
    this.status = "opened";
    return this;
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The key travels, not the sentence.</strong> The client receives the key and its data, so
                    each user reads the message in their own language.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>문장이 아니라 key가 전달됩니다.</strong> 클라이언트는 key와 데이터를 받으므로, 사용자마다
                    자기 언어로 메시지를 읽습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The second argument fills placeholders:</strong>{" "}
                    <code>{'new Err("ticket.error.overdue", { days })'}</code> puts the number into{" "}
                    <code>{"{days}"}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>두 번째 인자는 자리 표시자를 채웁니다.</strong>{" "}
                    <code>{'new Err("ticket.error.overdue", { days })'}</code>는 <code>{"{days}"}</code> 자리에 숫자를
                    넣습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A subclass sets the HTTP status.</strong> <code>Err</code> answers 400;{" "}
                    <code>Err.BadRequest</code>, <code>Err.Unauthorized</code>, <code>Err.Forbidden</code>,{" "}
                    <code>Err.NotFound</code> and <code>Err.Conflict</code> answer 400, 401, 403, 404 and 409.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>하위 클래스로 HTTP 상태를 고릅니다.</strong> <code>Err</code>는 400이고,{" "}
                    <code>Err.BadRequest</code>, <code>Err.Unauthorized</code>, <code>Err.Forbidden</code>,{" "}
                    <code>Err.NotFound</code>, <code>Err.Conflict</code>는 각각 400, 401, 403, 404, 409로 응답합니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "In a store", ko: "store에서" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A store action wraps the call in a loading toast and a success toast:",
              ko: "store 액션은 호출 앞뒤로 로딩 토스트와 성공 토스트를 띄웁니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/ticket/ticket.store.ts"
          code={`import type { Dayjs } from "akanjs/base";
import { store } from "akanjs/store";

import { fetch, msg, sig } from "../useClient";

export class TicketStore extends store(sig.ticket, () => ({})) {
  async openTicket(id: string, due: Dayjs) {
    msg.loading("ticket.openTicketLoading", { key: "openTicket" });
    this.setTicket(await fetch.openTicket(id, due));
    msg.success("ticket.openTicketSuccess", { key: "openTicket" });
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      The same <code>key</code> swaps one toast for the next,
                    </strong>{" "}
                    so the success toast replaces the loading one instead of stacking under it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      같은 <code>key</code>를 쓰면 토스트가 바뀝니다.
                    </strong>{" "}
                    성공 토스트가 로딩 토스트 아래에 쌓이지 않고 그 자리를 대신합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>msg.error</code> also takes an <code>.error()</code> key.
                    </strong>{" "}
                    For a check that stops before calling the server, write{" "}
                    <code>{'msg.error("ticket.error.cannotOpen")'}</code> and return early.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>msg.error</code>는 <code>.error()</code> key도 받습니다.
                    </strong>{" "}
                    서버를 부르기 전에 막는 검사라면 <code>{'msg.error("ticket.error.cannotOpen")'}</code>를 띄우고 바로
                    return합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Two more options:</strong> <code>duration</code> in seconds (3 by default) and{" "}
                    <code>data</code> for placeholders.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>옵션이 두 개 더 있습니다.</strong> 초 단위 <code>duration</code>(기본값 3)과 자리 표시자를
                    채우는 <code>data</code>입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="generated-extension"
        title={l.trans({ en: "Extending A Library Model", ko: "라이브러리 모델 확장하기" })}
      >
        <Docs.Title>{l.trans({ en: "Extending A Library Model", ko: "라이브러리 모델 확장하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  An app can extend a model a lib already ships, such as <code>user</code> from <code>libs/shared</code>
                  . Its dictionary then starts from the lib's, and the app writes only what it adds.
                </span>
              ),
              ko: (
                <span>
                  앱은 <code>libs/shared</code>의 <code>user</code>처럼 라이브러리가 이미 가진 모델을 확장할 수
                  있습니다. 이때 dictionary는 라이브러리의 것에서 출발하고, 앱은 자기가 더한 것만 적습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Pass the lib's dictionaries to <code>modelDictionary</code>, right after the language list:
                </span>
              ),
              ko: (
                <span>
                  라이브러리의 dictionary를 <code>modelDictionary</code>의 언어 목록 바로 뒤에 넘깁니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/user/user.dictionary.ts"
          code={`import { modelDictionary } from "akanjs/dictionary";

import { user } from "../__lib/lib.dictionary";
import type { User } from "./user.constant";

export const dictionary = modelDictionary(["en", "ko"], ...user.dictionaries)
  .model<User>((t) => ({
    githubInfo: t(["Github Info", "깃허브 정보"]).desc(["Github info of the user", "유저의 깃허브 정보"]),
  }))
  .translate({});`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>user.dictionaries</code> comes from a generated file.
                    </strong>{" "}
                    <code>../__lib/lib.dictionary</code> exports one entry for each model the app shares with a lib.
                    Import it; never edit it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>user.dictionaries</code>는 생성 파일에서 옵니다.
                    </strong>{" "}
                    <code>../__lib/lib.dictionary</code>는 앱과 라이브러리가 함께 가진 모델마다 항목 하나를
                    export합니다. import만 하고 수정하지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The lib's labels stay.</strong> Its fields, queries, errors and <code>translate()</code>{" "}
                    entries remain, so <code>{".model<User>()"}</code> asks only for fields the lib did not label, like{" "}
                    <code>githubInfo</code> here.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>라이브러리의 레이블은 그대로 남습니다.</strong> 필드, query, 에러, <code>translate()</code>{" "}
                    항목이 유지되므로, <code>{".model<User>()"}</code>는 여기 있는 <code>githubInfo</code>처럼
                    라이브러리가 붙이지 않은 필드만 요구합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="scalar-service-dictionaries"
        title={l.trans({ en: "Scalar And Service Dictionaries", ko: "scalar와 service dictionary" })}
      >
        <Docs.Title>{l.trans({ en: "Scalar And Service Dictionaries", ko: "scalar와 service dictionary" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Pick the builder by the kind of module. Each builder offers only the stages that fit it, so a scalar has no queries and a service has no fields.",
              ko: "builder는 모듈의 종류로 고릅니다. builder마다 어울리는 단계만 있어서, scalar에는 query가 없고 service에는 필드가 없습니다.",
            })}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>modelDictionary</code>
                    </strong>{" "}
                    for a database module in <code>{"lib/<model>/"}</code>, which can use every stage.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>modelDictionary</code>
                    </strong>
                    는 <code>{"lib/<model>/"}</code>의 데이터베이스 모듈에 씁니다. 모든 단계를 쓸 수 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>scalarDictionary</code>
                    </strong>{" "}
                    for an embedded value in <code>{"lib/__scalar/<name>/"}</code>. It usually needs only fields, enum
                    values, errors and a little text.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>scalarDictionary</code>
                    </strong>
                    는 <code>{"lib/__scalar/<name>/"}</code>의 내장 값에 씁니다. 보통 필드, enum 값, 에러, 약간의 문구면
                    충분합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>serviceDictionary</code>
                    </strong>{" "}
                    for a service module in <code>{"lib/_<name>/"}</code>, or for app-level text that belongs to no
                    model.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>serviceDictionary</code>
                    </strong>
                    는 <code>{"lib/_<name>/"}</code>의 service 모듈이나, 어느 모델에도 속하지 않는 앱 수준 문구에
                    씁니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Matrix
            type={l.trans({ en: "Stage", ko: "단계" })}
            columns={builderColumns}
            groups={builderGroups}
            markLabel={l.trans({ en: "Available", ko: "쓸 수 있음" })}
            emptyLabel={l.trans({ en: "Not available", ko: "없음" })}
            countTemplate={l.trans({ en: "{num} stages", ko: "{num}단계" })}
          />
          <div>
            {l.trans({
              en: "A scalar labels its own fields and enum values:",
              ko: "scalar는 자기 필드와 enum 값에 레이블을 붙입니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="libs/util/lib/__scalar/coordinate/coordinate.dictionary.ts"
          code={`import { scalarDictionary } from "akanjs/dictionary";

import type { Coordinate, CoordinateType } from "./coordinate.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Coordinate", "좌표"]).desc(["Geographic coordinate information", "지리적 좌표 정보"]))
  .model<Coordinate>((t) => ({
    type: t(["Type", "타입"]).desc(["Coordinate type", "좌표 타입"]),
    coordinates: t(["Coordinates", "좌표"]).desc(["Longitude and latitude values", "경도와 위도 값"]),
    altitude: t(["Altitude", "고도"]).desc(["Altitude in meters", "미터 단위 고도"]),
  }))
  .enum<CoordinateType>("coordinateType", (t) => ({
    Point: t(["Point", "포인트"]).desc(["Point coordinate type", "포인트 좌표 타입"]),
  }));`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service module with no endpoints of its own can hold nothing but shared UI text:",
              ko: "자기 endpoint가 없는 service 모듈은 공용 UI 문구만 담을 수도 있습니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="libs/util/lib/_util/util.dictionary.ts"
          code={`import { serviceDictionary } from "akanjs/dictionary";

export const dictionary = serviceDictionary(["en", "ko"]).translate({
  home: ["Home", "홈"],
  back: ["Back", "뒤로가기"],
  next: ["Next", "다음"],
});`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A service's endpoints are labelled the same way</strong> with{" "}
                    <code>{".endpoint<OauthEndpoint>()"}</code>, and their keys sit under{" "}
                    <code>{"<service>.signal.<endpoint>"}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>service의 endpoint도 같은 방식으로</strong> <code>{".endpoint<OauthEndpoint>()"}</code>에
                    레이블을 붙이고, key는 <code>{"<service>.signal.<endpoint>"}</code> 아래에 생깁니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="errors-language-rules"
        title={l.trans({ en: "Errors, UI Text, And Languages", ko: "에러, UI 문구, 언어 목록" })}
      >
        <Docs.Title>{l.trans({ en: "Errors, UI Text, And Languages", ko: "에러, UI 문구, 언어 목록" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>.error()</code> holds messages about something that went wrong, and <code>.translate()</code>{" "}
                  holds every other phrase the module shows. Both take plain language tuples, with no <code>t()</code>{" "}
                  and no <code>.desc()</code>.
                </span>
              ),
              ko: (
                <span>
                  <code>.error()</code>에는 무언가 잘못됐을 때의 메시지를, <code>.translate()</code>에는 모듈이 보여주는
                  그 밖의 문구를 담습니다. 둘 다 <code>t()</code>나 <code>.desc()</code> 없이 언어 배열을 그대로
                  받습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "A word in braces is a placeholder, filled from the data passed along with the key:",
              ko: "중괄호로 감싼 단어는 자리 표시자이고, key와 함께 넘긴 데이터로 채워집니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/ticket/ticket.dictionary.ts"
          code={`.error({
  cannotOpen: [
    "Only an active ticket can be opened",
    "활성 상태인 티켓만 열 수 있습니다.",
  ],
  overdue: [
    "The ticket is {days} days overdue",
    "티켓 기한이 {days}일 지났습니다.",
  ],
})
.translate({
  openTicketLoading: ["Opening the ticket…", "티켓을 여는 중입니다."],
  openTicketSuccess: ["Ticket opened", "티켓을 열었습니다."],
})`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Where the keys land:</strong> an error under <code>error</code>, as{" "}
                    <code>ticket.error.overdue</code>; a phrase right under the module, as{" "}
                    <code>ticket.openTicketLoading</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>key 위치:</strong> 에러는 <code>error</code> 아래(<code>ticket.error.overdue</code>), 문구는
                    모듈 바로 아래(<code>ticket.openTicketLoading</code>)에 생깁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>How labels are written:</strong> English in Title Case, Korean as the plain domain term, and
                    every Korean <code>.error()</code> sentence ends in <code>다.</code>
                  </span>
                ),
                ko: (
                  <span>
                    <strong>표기 규칙:</strong> 영어 레이블은 Title Case로, 한국어는 평소 쓰는 도메인 용어로 씁니다.
                    한국어 <code>.error()</code> 문장은 <code>다.</code>로 끝냅니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "The language list", ko: "언어 목록" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The array passed to the builder is the language list, and every tuple follows its order. A dictionary can declare more than two:",
              ko: "builder에 넘기는 배열이 언어 목록이고, 모든 언어 배열은 그 순서를 따릅니다. 언어는 두 개보다 많아도 됩니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/lib/_koyo/koyo.dictionary.ts"
          code={`import { serviceDictionary } from "akanjs/dictionary";

export const dictionary = serviceDictionary(["en", "ko", "zhChs", "zhCht"])
  .translate({
    menuGallery: ["Gallery", "갤러리", "画廊", "畫廊"],
  });`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The compiler checks the length, not the order.</strong> <code>{'["제목", "Title"]'}</code>{" "}
                    compiles and shows Korean to English readers.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>컴파일러는 개수만 검사하고 순서는 검사하지 않습니다.</strong>{" "}
                    <code>{'["제목", "Title"]'}</code>도 컴파일되고, 영어 사용자에게 한국어가 보입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The app decides which languages it serves.</strong>{" "}
                    <code>{"i18n: { defaultLocale, locales }"}</code> in <code>akan.config.ts</code> lists them; the
                    default is <code>en</code> out of <code>{'["en", "ko"]'}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>어떤 언어를 제공할지는 앱이 정합니다.</strong> <code>akan.config.ts</code>의{" "}
                    <code>{"i18n: { defaultLocale, locales }"}</code>에 적고, 기본값은 <code>{'["en", "ko"]'}</code> 중{" "}
                    <code>en</code>입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A missing language falls back.</strong> A language the dictionary does not declare reads the
                    default language's text, and a key no language has shows as the key itself.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>없는 언어는 기본 언어로 대신합니다.</strong> dictionary가 선언하지 않은 언어는 기본 언어
                    문구를 보여주고, 어느 언어에도 없는 key는 key 문자열이 그대로 보입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Rules At A Glance", ko: "한눈에 보는 규칙" })}>
        <Docs.Title>{l.trans({ en: "Rules At A Glance", ko: "한눈에 보는 규칙" })}</Docs.Title>
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Keys follow the types.</strong> Keep them aligned with the constant, filters, slices and
                    endpoints rather than inventing free-form strings.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>key는 타입을 따릅니다.</strong> 임의의 문자열을 만들지 말고 constant, filter, slice,
                    endpoint에 맞춥니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Labels are for people.</strong> "Due Date" reads better than the variable name{" "}
                    <code>due</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>레이블은 사람이 읽습니다.</strong> 변수 이름 <code>due</code>보다 "기한"이 낫습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Add <code>.desc()</code>
                    </strong>{" "}
                    wherever a label can reach forms, tooltips, API docs or an AI agent.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>.desc()</code>를 붙입니다.
                    </strong>{" "}
                    레이블이 폼, 툴팁, API 문서, AI 에이전트 중 한 곳에라도 보일 수 있다면 필요합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>One helper per place:</strong> <code>l()</code> from <code>usePage()</code> in UI,{" "}
                    <code>Err</code> in server logic, <code>msg</code> in stores.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>자리마다 헬퍼가 정해져 있습니다.</strong> UI는 <code>usePage()</code>의 <code>l()</code>,
                    서버 로직은 <code>Err</code>, store는 <code>msg</code>를 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Extend before you add.</strong> A model a lib already has starts from{" "}
                    <code>...model.dictionaries</code>, then adds the app's own labels.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>더하기 전에 확장합니다.</strong> 라이브러리에 이미 있는 모델은{" "}
                    <code>...model.dictionaries</code>에서 출발한 뒤 앱의 레이블을 더합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Every tuple follows the language list,</strong> in both order and length.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>언어 배열은 언어 목록을 따릅니다.</strong> 순서도 개수도 같아야 합니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Common mistakes", ko: "자주 하는 실수" })}</Docs.SubSubTitle>
          <Docs.Table columns={mistakeColumns} rows={mistakeRows} stacked />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Never <code>throw new Error</code>.
                  </strong>{" "}
                  Throw <code>{'new Err("<module>.error.<key>")'}</code> and register the key in that module's{" "}
                  <code>.error()</code>. A raw <code>Error</code> fails lint, and lint failures break the build.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>throw new Error</code>는 쓰지 않습니다.
                  </strong>{" "}
                  <code>{'new Err("<module>.error.<key>")'}</code>를 던지고, 그 key를 해당 모듈의 <code>.error()</code>
                  에 등록합니다. 그냥 <code>Error</code>를 던지면 lint에 걸리고, lint 실패는 빌드를 깨뜨립니다.
                </span>
              ),
            })}
          </Docs.Alert>

          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "이어서 읽기" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={nextLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
