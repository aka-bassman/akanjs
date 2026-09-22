import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const members = [
    {
      name: "Agent.Chat",
      desc: l.trans({
        en: "The chat panel itself — launcher, transcript, composer, approval card. Mount it once.",
        ko: "채팅 패널 자체입니다. 런처, 대화창, 입력창, 승인 카드를 포함하며 한 번만 마운트합니다.",
      }),
    },
    {
      name: "Agent.Zone",
      desc: l.trans({
        en: "One subtree with its own conversation over a scoped view of the same surface.",
        ko: "같은 surface의 좁혀진 뷰 위에서 자기 대화를 갖는 subtree 하나입니다.",
      }),
    },
    {
      name: "Agent.Guide",
      desc: l.trans({
        en: "Standing instructions for a route subtree. Renders nothing.",
        ko: "route subtree에 상시 적용되는 지침입니다. 아무것도 렌더하지 않습니다.",
      }),
    },
    {
      name: "Agent.History",
      desc: l.trans({
        en: "Puts the enclosing session's transcript wherever the app keeps it. Renders nothing.",
        ko: "감싸고 있는 session의 transcript를 앱이 보관하는 곳에 연결합니다. 아무것도 렌더하지 않습니다.",
      }),
    },
    {
      name: "Agent.Skip",
      desc: l.trans({
        en: "A region the default screen read leaves out, named so it can still be asked for.",
        ko: "기본 화면 읽기에서 제외되는 영역입니다. 이름이 있어서 필요하면 따로 요청할 수 있습니다.",
      }),
    },
    {
      name: "Agent.Scope",
      desc: l.trans({
        en: "Namespaces every tool and state key below it, without opening a conversation.",
        ko: "대화를 새로 열지 않고, 아래에서 등록되는 tool과 state key에 namespace만 붙입니다.",
      }),
    },
    {
      name: "Agent.Dock",
      desc: l.trans({
        en: "The development inspector: tools, readable state, withheld keys, transcript.",
        ko: "개발용 inspector입니다. tool, 읽을 수 있는 state, 보류된 key, transcript를 보여줍니다.",
      }),
    },
    {
      name: "Agent.Context · Section · StateKey · Tool · Transcript",
      desc: l.trans({
        en: "The dock's own parts, exported so an app can assemble an inspector of its own.",
        ko: "dock을 이루는 부품입니다. 앱이 자체 inspector를 조립할 수 있도록 공개되어 있습니다.",
      }),
    },
  ];

  const dockParts = [
    {
      key: "Agent.Dock",
      type: "{ className?, bridge?, surface?, open? }",
      desc: l.trans({
        en: "The whole panel. `bridge` names the store keys and their masking, `surface` where the declared tools live — pass a zone's own to inspect just that zone. `open` opens the Tools section on mount. Renders nothing when `AKAN_PUBLIC_ENV=main`.",
        ko: "패널 전체입니다. `bridge`는 store key와 masking을, `surface`는 선언된 tool이 사는 곳을 지정합니다 — zone의 surface를 넘기면 그 zone만 들여다봅니다. `open`은 마운트 시 Tools 섹션을 펼칩니다. `AKAN_PUBLIC_ENV=main`에서는 아무것도 렌더하지 않습니다.",
      }),
    },
    {
      key: "Agent.Context",
      type: "{ className? }",
      desc: l.trans({
        en: "An Assemble button that prints exactly what a turn would carry: the published tool names, the mounted guides, and the assembled context blocks. This is where a zone-prefixed tool name becomes visible.",
        ko: "턴이 실어 나를 내용을 그대로 찍어 보여주는 Assemble 버튼입니다. 공개된 tool 이름, 마운트된 guide, 조립된 context block이 나옵니다. zone prefix가 붙은 tool 이름을 눈으로 확인하는 곳입니다.",
      }),
    },
    {
      key: "Agent.Section",
      type: "{ className?, title, count, children, open? }",
      desc: l.trans({
        en: "One collapsible `<details>` group with a count beside its title. The dock draws five of them.",
        ko: "제목 옆에 개수가 붙는 접이식 `<details>` 그룹입니다. dock은 이것을 다섯 개 그립니다.",
      }),
    },
    {
      key: "Agent.StateKey",
      type: "{ className?, bridge, name, entry, live? }",
      desc: l.trans({
        en: "One readable state key, read on demand rather than rendered with the rest. Masking happens at read, so a key holding an object no model claims refuses here instead of in the catalogue.",
        ko: "읽을 수 있는 state key 하나입니다. 나머지와 함께 렌더되지 않고 요청할 때 읽습니다. masking이 읽는 시점에 일어나므로, 어떤 model도 주장하지 않는 객체를 담은 key는 목록이 아니라 여기서 거절됩니다.",
      }),
    },
    {
      key: "Agent.Tool",
      type: "{ className?, surface, tool, onRun }",
      desc: l.trans({
        en: "One declared tool with its arguments as JSON, and a Run button that calls it in the running app. Deliberately not a generated form — that is the API explorer's job.",
        ko: "선언된 tool 하나를 인자 JSON과 함께 보여주고, Run 버튼으로 실행 중인 앱에서 호출합니다. 인자별 form을 만들지 않는 것은 의도된 선택이며, 그쪽은 API explorer의 몫입니다.",
      }),
    },
    {
      key: "Agent.Transcript",
      type: "{ className?, calls }",
      desc: l.trans({
        en: "What the agent did, newest last, so a user can check it against what they saw the page do. There is no undo here.",
        ko: "에이전트가 한 일을 오래된 것부터 보여주어, 사용자가 화면에서 본 것과 대조할 수 있게 합니다. 되돌리기는 없습니다.",
      }),
    },
  ];

  const components: UiComponentReference[] = [
    {
      name: "Chat",
      desc: l.trans({
        en: "The user-facing half of the in-page agent: one floating chat wired to the surface this screen declared. Mount it once, in a layout. The conversation loop runs in this browser session — every tool call executes here, gated by the approval card — and the relay endpoint never executes a tool. The session lives in a ref, so it survives reopening the panel and dies with the page unless `persist` keeps it. An enclosing `Agent.Zone` or `AgentProvider` session wins, and then every session option below belongs to whoever built that one.",
        ko: "인페이지 에이전트의 사용자 쪽 절반입니다. 이 화면이 선언한 surface에 연결된 떠 있는 채팅 하나이며, layout에서 한 번만 마운트합니다. 대화 루프는 이 브라우저 세션에서 돌고 — 모든 tool 호출이 여기서, 승인 카드를 거쳐 실행됩니다 — relay endpoint는 tool을 실행하지 않습니다. session은 ref에 살아서 패널을 닫았다 열어도 유지되고, `persist`가 없으면 페이지와 함께 사라집니다. 감싸는 `Agent.Zone`이나 `AgentProvider`의 session이 우선하며, 그때는 아래의 session option이 모두 그 session을 만든 쪽의 것입니다.",
      }),
      props: [
        {
          name: "className",
          type: "string",
          desc: l.trans({
            en: "Reaches whichever surface is showing — the launcher while closed, the panel while open.",
            ko: "지금 보이는 surface에 적용됩니다. 닫혀 있으면 launcher, 열려 있으면 panel입니다.",
          }),
        },
        {
          name: "title",
          type: "string",
          desc: l.trans({ en: "Panel heading.", ko: "패널 제목입니다." }),
        },
        {
          name: "instructions",
          type: "string",
          desc: l.trans({
            en: "App-global framing. Route-scoped guidance layers on top of it through mounted `Agent.Guide`s.",
            ko: "앱 전역 framing입니다. route 범위 지침은 마운트된 `Agent.Guide`가 그 위에 겹칩니다.",
          }),
        },
        {
          name: "runner",
          type: "AgentRunner",
          desc: l.trans({
            en: "Swaps the transport. The default drives the app's own `runAgentTurn` endpoint; `httpRunner` and `fetchRunner` are the two shipped alternatives.",
            ko: "transport를 교체합니다. 기본값은 앱의 `runAgentTurn` endpoint를 사용하며, `httpRunner`와 `fetchRunner`가 함께 제공되는 대안입니다.",
          }),
        },
        {
          name: "maxTurns",
          type: "number",
          desc: l.trans({
            en: "How many model round trips one ask may spend before the loop stops.",
            ko: "질문 하나가 쓸 수 있는 모델 왕복 횟수입니다. 넘으면 루프가 멈춥니다.",
          }),
        },
        {
          name: "compact",
          type: "CompactOptions",
          desc: l.trans({
            en: "When the conversation summarizes itself to stay inside the model's window — `at` estimated tokens, `keep` messages left verbatim below the summary. `{ at: 0 }` turns it off.",
            ko: "대화가 모델 context 창 안에 머물도록 스스로를 요약하는 시점입니다. `at`은 추정 토큰 수, `keep`은 요약 아래에 그대로 남길 메시지 수입니다. `{ at: 0 }`이면 끕니다.",
          }),
        },
        {
          name: "builtins",
          type: "BuiltinOption",
          desc: l.trans({
            en: "Which of the runtime's own tools this chat gets — all by default, `false` none, an array exactly the ones it names. A chat that must not leave its screen drops `navigate` and `goBack`.",
            ko: "런타임 기본 tool 중 무엇을 줄지 정합니다. 기본은 전부, `false`면 없음, 배열이면 나열한 것만입니다. 화면을 벗어나면 안 되는 채팅은 `navigate`와 `goBack`을 뺍니다.",
          }),
        },
        {
          name: "onCompact",
          type: "(replaced, summary) => void",
          desc: l.trans({
            en: "Called after a compaction replaced messages with one summary — where a host syncs its own watermark.",
            ko: "압축이 메시지들을 요약 하나로 대체한 뒤 호출됩니다. host가 자기 watermark를 맞추는 자리입니다.",
          }),
        },
        {
          name: "defaultOpen / open / onOpenChange",
          type: "boolean / boolean / (open) => void",
          desc: l.trans({
            en: "Uncontrolled start state, or controlled open state driven from the app's own control. Given `open` without `onOpenChange` the panel cannot close itself, so it draws no close button at all — and that is also what keeps a controlled chat assemblable by a server component, since `onOpenChange` is the only function among these.",
            ko: "uncontrolled 시작 상태이거나, 앱의 자체 control이 모는 controlled open 상태입니다. `onOpenChange` 없이 `open`만 주면 패널이 스스로 닫을 수 없으므로 닫기 버튼을 아예 그리지 않습니다. 여기서 함수는 `onOpenChange` 하나뿐이라, 이것을 빼면 controlled 채팅을 server component에서도 조립할 수 있습니다.",
          }),
        },
        {
          name: "visual",
          type: "boolean | AgentVisualOption",
          desc: l.trans({
            en: "What the page itself draws while the agent drives it: the control a call was published from is ringed where it stands, and a pointer presses it. On by default. `false` draws nothing; `{ cursor: false }` keeps the ring, `{ reveal: false }` keeps the pointer.",
            ko: "에이전트가 화면을 조작하는 동안 페이지가 직접 그리는 연출입니다. 호출이 공개된 control에 링이 생기고 포인터가 그것을 누릅니다. 기본으로 켜져 있으며, `false`면 아무것도 그리지 않고 `{ cursor: false }`는 링만, `{ reveal: false }`는 포인터만 남깁니다.",
          }),
        },
        {
          name: "launcher",
          type: "boolean",
          desc: l.trans({
            en: "`false` draws no launcher, for an app that opens the panel from a control of its own.",
            ko: "`false`면 launcher를 그리지 않습니다. 자체 control로 패널을 여는 앱을 위한 것입니다.",
          }),
        },
        {
          name: "persist",
          type: "PersistOption | SessionHistory",
          desc: l.trans({
            en: 'Keeps the transcript across reloads — sessionStorage by default, `{ storage: "local" }` to outlive the tab, or a `SessionHistory` of the app\'s own to keep it anywhere else, a server included.',
            ko: '새로고침을 넘어 transcript를 유지합니다. 기본은 sessionStorage, `{ storage: "local" }`이면 탭보다 오래 남고, 앱이 만든 `SessionHistory`를 주면 서버를 포함한 어디에든 보관할 수 있습니다.',
          }),
        },
        {
          name: "inline",
          type: "boolean",
          desc: l.trans({
            en: "Renders in the page flow instead of floating above it — a zone chat that lives inside its own section.",
            ko: "떠 있지 않고 페이지 흐름 안에 렌더합니다. 자기 구획 안에 사는 zone 채팅을 위한 것입니다.",
          }),
        },
        {
          name: "shortcut",
          type: "boolean",
          desc: l.trans({
            en: "`false` gives the browser its own Cmd/Ctrl+L back, for an app whose shell already spends that chord.",
            ko: "`false`면 Cmd/Ctrl+L을 브라우저에 돌려줍니다. 그 단축키를 이미 쓰고 있는 앱을 위한 것입니다.",
          }),
        },
        {
          name: "launcherClassName / panelClassName",
          type: "string",
          desc: l.trans({
            en: "One surface each, where `className` reaches both.",
            ko: "각각 한 surface씩 지정합니다. `className`은 둘 모두에 닿습니다.",
          }),
        },
        {
          name: "intro",
          type: "ReactNode",
          desc: l.trans({
            en: "Shown in place of the intro line while the transcript is empty — where starter questions go.",
            ko: "transcript가 비어 있는 동안 기본 안내 문구 대신 보여줍니다. 시작 질문을 놓는 자리입니다.",
          }),
        },
        {
          name: "header / chrome",
          type: "ReactNode / boolean",
          desc: l.trans({
            en: "Extra header controls, left of the built-in clear and close buttons. `chrome={false}` draws no header bar at all — for an `inline` chat inside a panel the app already titles — and takes the extra controls with it; the clear action stays reachable as the `/new` command.",
            ko: "기본 clear·close 버튼 왼쪽에 놓이는 추가 header control입니다. `chrome={false}`면 header bar를 아예 그리지 않고 — 앱이 이미 제목을 붙인 패널 안의 `inline` 채팅을 위한 것입니다 — 추가 control도 함께 사라집니다. clear는 `/new` 명령으로 계속 쓸 수 있습니다.",
          }),
        },
        {
          name: "defaultDraft",
          type: "string",
          desc: l.trans({
            en: "The composer's opening text, read once at mount — where a `?prompt=` lands without sending it.",
            ko: "마운트 시 한 번 읽는 입력창 초기 문구입니다. `?prompt=`가 전송되지 않은 채 들어오는 자리입니다.",
          }),
        },
        {
          name: "attach / attachLimits",
          type: "AttachReader / AttachLimits",
          desc: l.trans({
            en: "Reads a user-attached file into an attachment, or answers `null` to leave it to the built-in reader. A `url` is handed to the provider as the address it will fetch, so answer `data` — or both — whenever the provider cannot reach it. `attachLimits` raises or lowers what the composer accepts per file, per message, and how many.",
            ko: "사용자가 첨부한 파일을 attachment로 읽습니다. `null`을 반환하면 기본 reader에 맡깁니다. `url`은 provider가 직접 가져갈 주소로 전달되므로, provider가 닿을 수 없는 곳이면 `data`를, 또는 둘 다를 반환하세요. `attachLimits`는 파일당·메시지당 크기와 개수 한도를 조절합니다.",
          }),
        },
        {
          name: "reference / mentions",
          type: "ReferenceSource[] / boolean",
          desc: l.trans({
            en: "What the composer's `@` menu can point at — one entry per kind of document a user may name, each carrying its own `search`. `mentions` draws each pointer as the name it points at rather than as the token that carries it; on wherever `reference` sources are declared.",
            ko: "입력창의 `@` 메뉴가 가리킬 수 있는 대상입니다. 사용자가 이름을 댈 만한 document 종류마다 하나씩이고, 각자 자기 `search`를 가집니다. `mentions`는 포인터를 원시 token이 아니라 가리키는 이름으로 그리며, `reference`를 선언한 곳에서는 기본으로 켜집니다.",
          }),
        },
        {
          name: "voice",
          type: "VoiceEngine",
          desc: l.trans({
            en: "Speech in and out. The engine listens and speaks; the chat decides when — a press-to-talk microphone whose transcript lands in the composer for the user to correct, and a reply read aloud only when the ask itself came in by voice.",
            ko: "음성 입출력입니다. 듣고 말하는 것은 engine이고, 언제 할지는 채팅이 정합니다. 눌러서 말하는 마이크의 결과는 사용자가 고칠 수 있도록 입력창에 들어가고, 답을 소리 내어 읽는 것은 질문 자체가 음성으로 들어온 경우뿐입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`attach` and `voice` carry functions, and a function cannot cross the RSC boundary — so a server layout can pass neither. Mount the chat from a small client component in `ui/` that calls the hook, the way `apps/akan/ui/DocsAgentChat.tsx` does.",
          ko: "`attach`와 `voice`는 함수를 담고 있고 함수는 RSC 경계를 넘지 못하므로, server layout에서는 둘 다 넘길 수 없습니다. `ui/`에 훅을 호출하는 작은 client component를 두고 거기서 채팅을 마운트하세요 — `apps/akan/ui/DocsAgentChat.tsx`가 그 예입니다.",
        }),
        l.trans({
          en: "The panel is a `lazy(..., { ssr: false })` boundary, so the chunk loads after hydration and the launcher appearing post-mount is normal. The whole surface is configured server-side in `lib/option.ts` — `option.setLlm({ apiKey, model, host })` and `option.setAgentAccess(SignedIn)` — never through the environment.",
          ko: "패널은 `lazy(..., { ssr: false })` 경계라서 chunk가 hydration 이후에 로드되고, launcher가 마운트 뒤에 나타나는 것은 정상입니다. surface 전체 설정은 서버 쪽 `lib/option.ts`에서 합니다 — `option.setLlm({ apiKey, model, host })`와 `option.setAgentAccess(SignedIn)` — 환경 변수로는 하지 않습니다.",
        }),
      ],
      code: `import { Agent } from "akanjs/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    {children}
    <Agent.Chat
      title="Assistant"
      instructions="Help the operator schedule flights. Confirm before submitting a plan."
      persist
      compact={{ at: 120_000, keep: 8 }}
    />
  </>
));`,
    },
    {
      name: "Zone",
      desc: l.trans({
        en: "One subtree with its own conversation over a scoped view of the same surface. Everything mounted inside — hook tools, `st.use` subscriptions, guides — belongs to this zone's session and to the root agent both: zones are views, never walls. An `Agent.Chat` mounted inside binds to this session automatically, so two zones on one screen run two conversations in parallel, each seeing only its own subtree.",
        ko: "같은 surface의 좁혀진 뷰 위에서 자기 대화를 갖는 subtree 하나입니다. 안에 마운트된 것 — hook tool, `st.use` 구독, guide — 은 이 zone의 session에도, root 에이전트에도 함께 속합니다. zone은 뷰이지 벽이 아닙니다. 안에 마운트된 `Agent.Chat`은 자동으로 이 session에 묶이므로, 한 화면의 zone 둘이 각자 자기 subtree만 보며 두 대화를 나란히 돌립니다.",
      }),
      props: [
        {
          name: "id",
          type: "string",
          desc: l.trans({
            en: "Names the zone. The scope id and the `data-agent-zone` container both derive from it.",
            ko: "zone의 이름입니다. scope id와 `data-agent-zone` container가 모두 여기서 파생됩니다.",
          }),
        },
        {
          name: "label",
          type: "string",
          desc: l.trans({
            en: "Human-readable name for the scope, shown wherever the surface is listed.",
            ko: "scope의 사람이 읽는 이름입니다. surface가 나열되는 곳에 표시됩니다.",
          }),
        },
        {
          name: "instructions",
          type: "string",
          desc: l.trans({
            en: "Zone-scoped guidance, mounted as a `Guide` — so the root agent reads it too by the ancestor rule, and a sibling zone never does.",
            ko: "zone 범위 지침이며 `Guide`로 마운트됩니다. 조상 규칙에 따라 root 에이전트도 읽고, 형제 zone은 읽지 않습니다.",
          }),
        },
        {
          name: "runner / maxTurns / compact / builtins / persist / onCompact / visual",
          type: "session options",
          desc: l.trans({
            en: 'Same contracts as the chat\'s own, applied to this zone\'s session and read once at mount. `builtins={["readScreen", "readState"]}` is how a zone that must not leave the screen stops being able to: the tools are withheld, not discouraged, so a prompt cannot talk the model past it.',
            ko: '채팅과 같은 계약이며 이 zone의 session에 적용되고 마운트 시 한 번 읽습니다. `builtins={["readScreen", "readState"]}`는 화면을 벗어나면 안 되는 zone이 실제로 벗어날 수 없게 만드는 방법입니다. 권고가 아니라 tool 자체를 주지 않으므로 prompt로 우회할 수 없습니다.',
          }),
        },
        {
          name: "session",
          type: "AgentSession",
          desc: l.trans({
            en: "Runs this zone on a session the app built instead of one of its own, and the app then owns it: unmounting the zone leaves it running.",
            ko: "zone이 자체 session을 만드는 대신 앱이 만든 session 위에서 돕니다. 그 session의 소유권은 앱에 있어서, zone을 unmount해도 계속 살아 있습니다.",
          }),
        },
        {
          name: "onSession",
          type: "(session) => void",
          desc: l.trans({
            en: "Hands the session out once it exists, for a page or store that wants to send into it or watch it.",
            ko: "session이 만들어지면 밖으로 건네줍니다. 메시지를 보내거나 지켜보려는 page나 store를 위한 것입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Everything a zone publishes is named `<id>.<name>`. Instructions that name a tool must carry the prefix — a bare name is a tool that does not exist, and the model calling it spends a turn on `Unknown tool`. Build the name from the id rather than writing it twice, and read `Agent.Context`'s Assemble to see the published list.",
          ko: "zone이 공개하는 것은 모두 `<id>.<name>`으로 이름이 붙습니다. tool 이름을 적는 지침에는 prefix가 반드시 들어가야 합니다. prefix 없는 이름은 존재하지 않는 tool이고, 모델은 `Unknown tool`로 턴 하나를 버립니다. 이름을 두 번 쓰지 말고 id에서 조립하세요. 공개된 목록은 `Agent.Context`의 Assemble로 확인합니다.",
        }),
      ],
      code: `import { Agent } from "akanjs/ui";

export const CommentZone = ({ children }) => (
  <Agent.Zone
    id="comments"
    label="Comment management"
    instructions="Moderate the comment queue. Call comments.approveComment to accept one."
    builtins={["readScreen", "readState"]}
    persist
  >
    {children}
    <Agent.Chat inline chrome={false} />
  </Agent.Zone>
);`,
    },
    {
      name: "Guide",
      desc: l.trans({
        en: "Standing agent guidance scoped to a route subtree: render it from a `_layout.tsx` or a page and the text joins the turn's instructions while that subtree is mounted. The render tree is the cascade — each mounted Guide contributes its block, and navigating away withdraws it. Renders nothing.",
        ko: "route subtree에 상시 적용되는 지침입니다. `_layout.tsx`나 page에서 렌더하면 그 subtree가 마운트되어 있는 동안 그 문구가 턴의 지침에 합쳐집니다. cascade의 기준은 render tree입니다. 마운트된 Guide마다 자기 block을 더하고, 벗어나면 회수됩니다. 아무것도 렌더하지 않습니다.",
      }),
      props: [
        {
          name: "instructions",
          type: "string",
          desc: l.trans({
            en: "The text. English, always — this is model-facing, so the `l()` rule for user-facing strings does not apply.",
            ko: "지침 문구입니다. 항상 영어로 씁니다. 모델이 읽는 문자열이므로 사용자용 문자열에 적용되는 `l()` 규칙의 대상이 아닙니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Route guidance is a component, not a route-chain stage: there is no `instructions` field on `page()` or `pageConfig`. `*.abstract.md` is never served to agents either.",
          ko: "route 지침은 route chain의 stage가 아니라 component입니다. `page()`나 `pageConfig`에 `instructions` 필드는 없습니다. `*.abstract.md`도 에이전트에게 제공되지 않습니다.",
        }),
      ],
      code: `import { Agent } from "akanjs/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    <Agent.Guide instructions="This section edits the weekly flight plan. Focus a waypoint before editing it." />
    {children}
  </>
));`,
    },
    {
      name: "History",
      desc: l.trans({
        en: "Puts the enclosing zone's transcript wherever the app keeps it, as a mounted component rather than a prop. `persist` does the same thing and has to be passed to whoever builds the session, which makes every ancestor up to that point a client component — a function cannot cross the server/client boundary as a prop. Mounted here instead, the only client module an app needs is this leaf. Renders nothing.",
        ko: "감싸고 있는 zone의 transcript를 앱이 보관하는 곳에 연결합니다. prop이 아니라 마운트되는 component 형태입니다. `persist`도 같은 일을 하지만 session을 만드는 쪽에 넘겨야 하고, 그러면 거기까지의 조상이 전부 client component가 됩니다 — 함수는 server/client 경계를 prop으로 넘지 못하기 때문입니다. 여기서 마운트하면 client module은 이 leaf 하나면 됩니다. 아무것도 렌더하지 않습니다.",
      }),
      props: [
        {
          name: "load / save / clear",
          type: 'SessionHistory["load" | "save" | "clear"]',
          desc: l.trans({
            en: "The three sides of the store. Written inline is fine — they are read through a ref, so a fresh closure per render does not re-attach and re-fetch.",
            ko: "저장소의 세 면입니다. 인라인으로 적어도 됩니다. ref를 통해 읽으므로 렌더마다 새 closure가 생겨도 다시 붙이거나 다시 불러오지 않습니다.",
          }),
        },
        {
          name: "onCompact",
          type: "(replaced, summary) => void",
          desc: l.trans({
            en: "Where a host with its own server-side summary moves its watermark.",
            ko: "서버 쪽 요약을 따로 가진 host가 자기 watermark를 옮기는 자리입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Restoring follows the session's one rule: it lands only while nothing has happened to the conversation yet, so mounting with the zone restores and mounting later saves from there on.",
          ko: "복원은 session의 한 가지 규칙을 따릅니다. 대화에 아직 아무 일도 일어나지 않은 동안에만 적용되므로, zone과 함께 마운트하면 복원되고 나중에 마운트하면 그 시점부터 저장만 합니다.",
        }),
        l.trans({
          en: "The store is attached for exactly as long as this is mounted. A zone's own session dies with it, but a session the app handed in outlives this and its saving stops on unmount. A host that wants the store to outlive the view calls `session.setHistory` itself, which also takes the slot, so a later unmount here leaves it alone.",
          ko: "저장소는 이 component가 마운트되어 있는 동안만 붙어 있습니다. zone이 만든 session은 zone과 함께 죽지만, 앱이 건넨 session은 이보다 오래 살고 저장만 unmount 시점에 멈춥니다. 뷰보다 저장소가 오래 남기를 원하는 host는 `session.setHistory`를 직접 호출합니다. 그 호출이 slot을 차지하므로 이후의 unmount가 건드리지 않습니다.",
        }),
      ],
      code: `import { Agent } from "akanjs/ui";

export const ThreadZone = ({ threadId, children }) => (
  <Agent.Zone id="thread" label="Thread assistant">
    <Agent.History
      load={() => loadThreadMessages(threadId)}
      save={(messages) => saveThreadMessages(threadId, messages)}
      clear={() => clearThreadMessages(threadId)}
    />
    {children}
  </Agent.Zone>
);`,
    },
    {
      name: "Skip",
      desc: l.trans({
        en: 'A region the default screen read leaves out, for chrome that costs the agent tokens and answers nothing — a footer, a cookie banner, a repeated nav. What stands in its place is `[skipped: <label>]`, so an agent asked about the footer says it did not read one instead of reporting that the page has none, and `section: "<label>"` reads it on request.',
        ko: '기본 화면 읽기에서 빠지는 영역입니다. 토큰만 쓰고 답에는 기여하지 않는 chrome — 푸터, 쿠키 배너, 반복되는 내비게이션 — 을 위한 것입니다. 자리에는 `[skipped: <label>]`이 남으므로, 푸터를 묻는 질문에 에이전트는 페이지에 푸터가 없다고 답하는 대신 읽지 않았다고 답하고, `section: "<label>"`으로 필요할 때 읽습니다.',
      }),
      props: [
        {
          name: "label",
          type: "string",
          desc: l.trans({
            en: "What the read prints in place of the region, and the name `section` takes to read it anyway. Required — an unnamed marker tells the agent a region exists and nothing about it.",
            ko: "읽기 결과에서 그 영역을 대신해 찍히는 문구이자, `section`으로 그 영역을 읽을 때 쓰는 이름입니다. 필수입니다. 이름 없는 표시는 영역이 있다는 사실만 알리고 그 이상은 알리지 않습니다.",
          }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "The region itself.", ko: "영역 자체입니다." }),
        },
      ],
      notes: [
        l.trans({
          en: "This hides text, not behaviour. Tools and state keys are declarations, not markup: an `st.tool` inside here is published exactly as before, and `highlight` still reaches a control in here.",
          ko: "숨기는 것은 텍스트이지 동작이 아닙니다. tool과 state key는 markup이 아니라 선언이므로, 여기 안의 `st.tool`도 평소대로 공개되고 `highlight`도 여기 안의 control에 닿습니다.",
        }),
        l.trans({
          en: 'It renders a wrapper element, so where a div between a flex container and its children would move the layout, put the attribute on the element the page already renders — `<footer data-agent-skip="site footer">`.',
          ko: 'wrapper element를 하나 그립니다. flex container와 자식 사이에 div가 끼면 레이아웃이 흔들리는 자리라면, 페이지가 이미 그리는 element에 속성을 직접 붙이세요 — `<footer data-agent-skip="site footer">`.',
        }),
      ],
      code: `import { Agent } from "akanjs/ui";

export const SiteFooter = () => (
  <Agent.Skip label="site footer">
    <footer className="border-border border-t px-6 py-10 text-foreground/60">
      <LegalLinks />
    </footer>
  </Agent.Skip>
);`,
    },
    {
      name: "Scope",
      desc: l.trans({
        en: "Namespaces every tool and resource registered below it, so list items can reuse local names. It opens no conversation and holds no session — that is `Agent.Zone`, which wraps this. Reach for `Scope` when a repeated subtree needs distinct tool names but shares the screen's one agent.",
        ko: "아래에서 등록되는 tool과 resource에 namespace를 붙여, 목록 항목들이 같은 지역 이름을 재사용할 수 있게 합니다. 대화를 열지도, session을 갖지도 않습니다 — 그쪽은 이것을 감싸는 `Agent.Zone`입니다. 반복되는 subtree가 tool 이름만 구분되면 되고 에이전트는 화면 하나를 공유해도 될 때 `Scope`를 씁니다.",
      }),
      props: [
        {
          name: "id",
          type: "string",
          desc: l.trans({
            en: "The prefix. Everything below is published as `<id>.<name>`, nested scopes joining with dots.",
            ko: "prefix입니다. 아래의 모든 것이 `<id>.<name>`으로 공개되며, 중첩된 scope는 점으로 이어집니다.",
          }),
        },
        {
          name: "label",
          type: "string",
          desc: l.trans({ en: "Human-readable name for the scope.", ko: "scope의 사람이 읽는 이름입니다." }),
        },
        {
          name: "kind",
          type: "string",
          desc: l.trans({
            en: 'What sort of scope this is. `Agent.Zone` opens its own with `kind="zone"`.',
            ko: 'scope의 종류입니다. `Agent.Zone`은 `kind="zone"`으로 자기 scope를 엽니다.',
          }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "The subtree the prefix applies to.", ko: "prefix가 적용되는 subtree입니다." }),
        },
      ],
      code: `import { Agent } from "akanjs/ui";

export const WaypointRow = ({ waypoint }) => (
  <Agent.Scope id={waypoint.id} label={waypoint.name}>
    <WaypointEditor waypoint={waypoint} />
  </Agent.Scope>
);`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="agent-ui" title={l.trans({ en: "Agent UI", ko: "Agent UI" })}>
        <Docs.Title>{l.trans({ en: "Agent UI", ko: "Agent UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You have a screen full of controls a person can operate, and you would like an assistant on it that can operate the same ones. Not a separate API for robots — the buttons that are already there, pressed under the same guards, with the person watching.",
              ko: "사람이 조작할 수 있는 control로 가득 찬 화면이 있고, 그 화면 위에 같은 control을 조작할 수 있는 도우미를 두고 싶습니다. 로봇용 별도 API가 아니라, 이미 거기 있는 버튼을, 같은 guard 아래에서, 사람이 지켜보는 채로 누르는 쪽입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The `Agent` namespace is that surface. One `Agent.Chat` in a layout is the whole integration; everything else on this page narrows it — a subtree with its own conversation, standing guidance for a route, a region the read skips, and a development dock that shows what this screen actually published.",
              ko: "`Agent` namespace가 그 표면입니다. layout에 `Agent.Chat` 하나를 두면 통합은 끝이고, 이 페이지의 나머지는 그것을 좁히는 도구들입니다. 자기 대화를 갖는 subtree, route에 상시 적용되는 지침, 읽기에서 빠지는 영역, 그리고 이 화면이 실제로 무엇을 공개했는지 보여주는 개발용 dock.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert>
          {l.trans({
            en: "The relay endpoint never executes a tool. Every call runs in the caller's own browser session, gated by the app's guards and the approval card — so a tool exists only where a component declared one, and a lever the screen does not offer the user is not one an agent may pull in their place.",
            ko: "relay endpoint는 tool을 실행하지 않습니다. 모든 호출은 호출자 자신의 브라우저 세션에서, 앱의 guard와 승인 카드를 거쳐 실행됩니다. 따라서 tool은 component가 선언한 곳에만 존재하고, 화면이 사용자에게 제공하지 않는 조작은 에이전트도 대신 할 수 없습니다.",
          })}
        </Docs.Alert>
        <Docs.Description>
          <div>
            {l.trans({
              en: "This page is the API surface — every member and its props. The concepts behind it live elsewhere:",
              ko: "이 페이지는 API 표면입니다. 모든 member와 props를 다룹니다. 그 뒤의 개념은 다른 곳에 있습니다:",
            })}
          </div>
        </Docs.Description>
        <div className="my-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-primary">🧭</span>
            <div>
              <Link href="/docs/arch/agentic" className="font-bold text-primary hover:underline">
                /docs/arch/agentic
              </Link>
              {": "}
              {l.trans({
                en: "how the loop, the surface, the approval gate, and compaction fit together.",
                ko: "루프, surface, 승인 게이트, 압축이 어떻게 맞물리는지 설명합니다.",
              })}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">⚡</span>
            <div>
              <Link href="/cheatsheet/interface/agent-chat" className="font-bold text-primary hover:underline">
                /cheatsheet/interface/agent-chat
              </Link>
              {": "}
              {l.trans({
                en: "the short version — mount, configure, declare a tool, ship.",
                ko: "짧은 버전입니다. 마운트하고, 설정하고, tool을 선언하고, 내보냅니다.",
              })}
            </div>
          </div>
        </div>
        <Docs.IntroTable type={l.trans({ en: "Member", ko: "Member" })} items={members} />
      </Scroll.Slide>
      <Divider />
      {components.map((component) => (
        <UiComponentSlide key={component.name} component={component} />
      ))}
      <Divider />

      <Scroll.Slide id="agent-dock" title={l.trans({ en: "Development Dock", ko: "개발용 Dock" })}>
        <Docs.Title>{l.trans({ en: "Development Dock", ko: "개발용 Dock" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A component declares its own agent surface, which means the source of one file never tells you what the whole screen published. `Agent.Dock` is the answer: mount it in development and it lists the tools this screen declared, the state keys an agent may read, the keys that were withheld and why, and what has been called so far.",
              ko: "에이전트 표면은 component가 각자 선언하므로, 파일 하나의 소스만 봐서는 화면 전체가 무엇을 공개했는지 알 수 없습니다. `Agent.Dock`이 그 답입니다. 개발 중에 마운트해 두면 이 화면이 선언한 tool, 에이전트가 읽을 수 있는 state key, 보류된 key와 그 이유, 지금까지 호출된 내역을 보여줍니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The dock and its parts render nothing when `AKAN_PUBLIC_ENV=main`, so leaving one mounted costs a production visitor nothing. The parts are exported individually because an app that wants a dock of its own shape should compose these rather than re-read the surface.",
              ko: "dock과 그 부품들은 `AKAN_PUBLIC_ENV=main`에서 아무것도 렌더하지 않으므로, 마운트한 채로 두어도 프로덕션 방문자에게는 비용이 없습니다. 부품을 따로 공개하는 이유는, 자기 모양의 dock을 원하는 앱이 surface를 다시 읽는 대신 이것들을 조합하도록 하기 위해서입니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.OptionTable items={dockParts} />
        <Code.Snippet
          className="w-full"
          title="apps/koyo/page/_layout.tsx"
          code={`import { Agent } from "akanjs/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    {children}
    <Agent.Chat persist />
    <Agent.Dock open />
  </>
));`}
        />
        <div className={panelRecipe({ radius: "lg" }, "my-4")}>
          <div className="mb-2 font-semibold text-primary">
            {l.trans({ en: "What each section answers:", ko: "각 섹션이 답하는 것:" })}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
            <li>
              {l.trans({
                en: "Tools — did this screen publish what its author thought it did, under the names the instructions use?",
                ko: "Tools — 이 화면이 작성자가 생각한 대로, 지침에 적힌 이름으로 공개했는가?",
              })}
            </li>
            <li>
              {l.trans({
                en: "State — which keys are readable right now, and what does one actually return when read?",
                ko: "State — 지금 읽을 수 있는 key는 무엇이고, 실제로 읽으면 무엇이 나오는가?",
              })}
            </li>
            <li>
              {l.trans({
                en: "Withheld — which keys were refused, and for what reason.",
                ko: "Withheld — 어떤 key가 거절되었고, 그 이유는 무엇인가.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Transcript — what the agent has already done to this page.",
                ko: "Transcript — 에이전트가 이 페이지에 이미 무엇을 했는가.",
              })}
            </li>
          </ul>
        </div>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Eleven of the chat's own parts are override slots — `AgentBubble`, `AgentComposer`, `AgentSteps`, `AgentToolCard`, and the rest — so an app re-skins the transcript or the composer without re-implementing the loop. The full slot list is on the Customization page.",
              ko: "채팅을 이루는 부품 중 11개가 override slot입니다 — `AgentBubble`, `AgentComposer`, `AgentSteps`, `AgentToolCard` 등 — 덕분에 앱은 루프를 다시 구현하지 않고 대화창이나 입력창만 다시 스킨할 수 있습니다. 전체 slot 목록은 커스터마이즈 페이지에 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>

      <DocsToc />
    </Scroll>
  );
});
