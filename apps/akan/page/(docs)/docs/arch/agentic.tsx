import { usePage } from "@apps/akan/client";
import { AgentVisualDemo, Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="agent-overview" title={l.trans({ en: "In-Page Agent", ko: "인페이지 에이전트" })}>
        <Docs.Title>{l.trans({ en: "In-Page Agent", ko: "인페이지 에이전트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every Akan app can host a chat agent that reads the rendered screen and drives it — the assistant on this page is one. What it may do is what a component declared, and what it may read is what a component subscribed. A store class publishes nothing on its own: an agent presses the controls the screen already offers the user, and never a lever the screen does not have.",
              ko: "모든 Akan 앱은 렌더된 화면을 읽고 조작하는 채팅 에이전트를 품을 수 있습니다. 지금 이 페이지의 어시스턴트가 바로 그것입니다. 에이전트가 할 수 있는 일은 컴포넌트가 선언한 것이고, 읽을 수 있는 것은 컴포넌트가 구독한 것입니다. 스토어 클래스만으로는 아무것도 발행되지 않습니다. 에이전트는 화면이 이미 사용자에게 주는 컨트롤을 누를 뿐, 화면에 없는 레버는 당기지 않습니다.",
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: l.trans({ en: "One mount", ko: "한 줄 마운트" }),
                desc: l.trans({
                  en: "<Agent.Chat /> in a layout is the whole integration — launcher, transcript, approval card, and a streaming loop.",
                  ko: "레이아웃의 <Agent.Chat /> 한 줄이 통합의 전부입니다. 런처, 대화창, 승인 카드, 스트리밍 루프까지.",
                }),
              },
              {
                title: l.trans({ en: "Tools run in the browser", ko: "툴은 브라우저에서 실행" }),
                desc: l.trans({
                  en: "The server is a stateless relay that never executes a tool. Every action runs in the caller's own session, gated by guards and the approval card.",
                  ko: "서버는 툴을 절대 실행하지 않는 무상태 릴레이입니다. 모든 액션은 호출자 자신의 세션에서, 가드와 승인 카드를 거쳐 실행됩니다.",
                }),
              },
              {
                title: l.trans({ en: "Framework built-in", ko: "프레임워크 내장" }),
                desc: l.trans({
                  en: "The relay endpoint, two LLM adaptors, and the chat UI all ship with akanjs — no extra library to mount.",
                  ko: "릴레이 엔드포인트, LLM 어댑터 두 개, 채팅 UI가 모두 akanjs에 내장돼 있어 추가로 마운트할 라이브러리가 없습니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-bold text-foreground">{title}: </span>
                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <div className={panelRecipe({ radius: "2xl", padding: "lg" })}>
            <div className="mb-4 font-bold text-foreground">{l.trans({ en: "Runtime Map", ko: "런타임 지도" })}</div>
            <div className="space-y-1">
              {[
                {
                  title: "Screen",
                  desc: l.trans({
                    en: "Mounted st.use / st.sel / st.ref keys, hook tools, and Agent.Guide text.",
                    ko: "마운트된 st.use / st.sel / st.ref 키, 훅 툴, Agent.Guide 문구.",
                  }),
                },
                {
                  title: "Agent.Chat",
                  desc: l.trans({
                    en: "The loop, the approval card, and its own /new · /retry · /compact · /copy · /help · /tools — the only slash commands it lists.",
                    ko: "대화 루프, 승인 카드, 자체 커맨드(/new · /retry · /compact · /copy · /help · /tools). 메뉴에 오르는 slash command는 이것이 전부입니다.",
                  }),
                },
                {
                  title: "runAgentTurn",
                  desc: l.trans({
                    en: "A stateless HTTP relay. It spends the LLM key and never runs a tool.",
                    ko: "무상태 HTTP 릴레이입니다. LLM 키만 쓰고 툴은 실행하지 않습니다.",
                  }),
                },
                {
                  title: "LlmAdaptor.chat",
                  desc: l.trans({
                    en: "The whole transcript in, one assistant answer out. OpenaiLlm is the default and speaks the chat-completions dialect to whatever host is named; AnthropicLlm ships beside it for the Messages API.",
                    ko: "전체 대화가 들어가고 어시스턴트 응답 하나가 나옵니다. 기본값은 OpenaiLlm이고, host가 가리키는 곳에 chat-completions 방언으로 말합니다. Messages API용 AnthropicLlm이 함께 들어 있습니다.",
                  }),
                },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-border bg-muted px-4 py-2">
                  <span className="font-mono font-semibold text-primary">{title}: </span>
                  <span className="text-foreground/70 text-sm">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: "External agents that call your domain over HTTP use the MCP server instead — a different catalogue, derived from signal guards.",
              ko: "HTTP로 도메인을 호출하는 외부 agent는 MCP 서버를 씁니다. 다른 카탈로그이며, signal guard에서 파생됩니다.",
            })}{" "}
            <Link href="/cheatsheet/interface/mcp" className="text-primary">
              {l.trans({ en: "MCP Server", ko: "MCP 서버" })}
            </Link>
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-mount" title={l.trans({ en: "Mount and Secure", ko: "마운트와 보안" })}>
        <Docs.Title>{l.trans({ en: "Mount and Secure", ko: "마운트와 보안" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Mount the chat once in a layout. The framework serves runAgentTurn on every app. option.setLlm gives it a key; AKAN_AGENT=false removes the whole surface.",
              ko: "레이아웃에 채팅을 한 번 마운트하세요. 프레임워크가 모든 앱에 runAgentTurn을 기본 제공합니다. option.setLlm으로 키를 주고, AKAN_AGENT=false로 표면 전체를 내립니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  This page is the surface a component declares. The panel itself — its controlled <code>open</code>{" "}
                  pair, the twelve <code>_overrides.tsx</code> slots it is assembled from, card tools, the{" "}
                  <code>@</code> menu, the queue and the transcript store — is on{" "}
                  <Link href="/cheatsheet/interface/agent-chat" className="text-primary">
                    Agent Chat
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  이 페이지는 컴포넌트가 선언하는 표면을 다룹니다. 패널 자체 — controlled <code>open</code> 쌍, 이것을
                  조립하는 <code>_overrides.tsx</code> 슬롯 열두 개, card 툴, <code>@</code> 메뉴, 대기열, 대화 보관 —
                  는{" "}
                  <Link href="/cheatsheet/interface/agent-chat" className="text-primary">
                    Agent Chat
                  </Link>
                  에 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts"
          code={`// page/_layout.tsx
<Agent.Chat persist />

// lib/option.ts — the key lives in env, which is gitignored
import { SignedIn } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess(SignedIn);`}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: "AgentRelayAccess refuses every call until a guard is registered — the same answer None gives. Without one the chat cannot spend the LLM key. A product with accounts names its own guard in the same option.ts, as it would on any other endpoint.",
            ko: "AgentRelayAccess는 가드 등록 전까지 모든 호출을 None과 같이 거절합니다. 가드가 없으면 채팅이 LLM 키를 쓸 수 없습니다. 계정이 있는 제품은 다른 엔드포인트와 똑같이 같은 option.ts에서 자기 가드를 지정합니다.",
          })}
        </Docs.Alert>
        <div className="space-y-1">
          {[
            {
              title: "persist",
              desc: l.trans({
                en: 'Keeps the transcript across reloads in sessionStorage. Pass { storage: "local" } to outlive the tab. Off by default.',
                ko: '새로고침을 견디도록 대화를 sessionStorage에 보존합니다. { storage: "local" }이면 탭을 닫아도 유지됩니다. 기본값은 꺼짐입니다.',
              }),
            },
            {
              title: "streaming",
              desc: l.trans({
                en: "The same endpoint answers text/event-stream. Assistant text arrives as it is generated, with zero app code.",
                ko: "같은 엔드포인트가 text/event-stream도 답합니다. 어시스턴트 텍스트가 생성되는 대로 도착하며 앱 코드는 필요 없습니다.",
              }),
            },
            {
              title: "instructions",
              desc: l.trans({
                en: "App-global framing on Agent.Chat. Route-scoped guidance layers on through mounted Agent.Guide.",
                ko: "Agent.Chat의 앱 전역 프레이밍입니다. 라우트 범위 지침은 마운트된 Agent.Guide가 겹칩니다.",
              }),
            },
            {
              title: "attach",
              desc: l.trans({
                en: "The composer attaches images and text files on its own; attach is where an app reads what needs a parser, like a PDF's text, or uploads the file and answers a url. Nothing is stored — the bytes ride one turn's request, and a reloaded transcript keeps the name without the content. The ceilings are the message's rather than the file's — 4 MB per file, 8 MB and five files per message, and the same file twice refused by name — because what a provider refuses is the sum, and a request that cannot be sent is one the user has to empty the composer to escape. They are measured on what attach produced, so a url costs nothing, and attachLimits raises them for a provider that carries more.",
                ko: "작성창은 이미지와 텍스트 파일을 스스로 첨부합니다. PDF 본문처럼 파서가 필요한 것, 또는 업로드하고 url로 답하는 것은 앱이 attach에서 합니다. 저장은 하지 않습니다 — 바이트는 한 턴의 요청에만 실리고, 새로고침된 대화는 내용 없이 이름만 남깁니다. 상한은 파일 하나가 아니라 메시지 단위입니다 — 파일당 4MB, 메시지당 8MB와 5개, 같은 파일은 이름을 밝히며 거절합니다. 프로바이더가 거절하는 것은 합계이고, 보낼 수 없는 요청에서 빠져나오려면 작성창을 비우는 수밖에 없기 때문입니다. 상한은 attach가 만들어낸 결과를 기준으로 재므로 url은 비용이 0이고, 더 큰 요청을 받는 프로바이더라면 attachLimits로 올립니다.",
              }),
            },
            {
              title: "voice",
              desc: l.trans({
                en: "A press-to-talk microphone whose transcript lands in the composer to be corrected, and a reply read aloud one sentence at a time — but only when the ask itself came in by voice, so a typed question never turns the speakers on. useSpeech from @libs/util/webkit is the engine: the browser's own recognition on the web, Capacitor plugins in a WebView, which has neither.",
                ko: "눌러서 말하는 마이크입니다. 전사는 작성창에 들어가 고칠 수 있고, 응답은 문장 단위로 읽어줍니다. 단 음성으로 물었을 때만 읽으므로 타이핑한 질문이 스피커를 켜는 일은 없습니다. 엔진은 @libs/util/webkit의 useSpeech — 웹은 브라우저 내장 인식, WebView는 둘 다 없으므로 Capacitor 플러그인입니다.",
              }),
            },
            {
              title: "a client wrapper",
              desc: l.trans({
                en: "attach and voice carry functions, and a function cannot cross the RSC boundary — so a server layout cannot pass either. Mount the chat from a small client component in ui/ that calls the hook, the way apps/akan/ui/DocsAgentChat.tsx does.",
                ko: "attach와 voice는 함수를 담고 있고 함수는 RSC 경계를 넘지 못합니다. 그래서 서버 레이아웃에서는 둘 다 넘길 수 없습니다. ui/에 훅을 호출하는 작은 클라이언트 컴포넌트를 두고 거기서 채팅을 마운트하세요 — apps/akan/ui/DocsAgentChat.tsx가 그 예입니다.",
              }),
            },
          ].map(({ title, desc }) => (
            <div key={title} className={panelRecipe({ padding: "row" })}>
              <span className="font-mono font-semibold text-primary">{title}: </span>
              <span className="text-foreground/70 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-surface" title={l.trans({ en: "The Declared Surface", ko: "선언하는 표면" })}>
        <Docs.Title>{l.trans({ en: "The Declared Surface", ko: "선언하는 표면" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "st.tool publishes one action and hands back the callable you wire to onClick, so the agent and the user press the same handler. st.use, st.sel, and st.ref make one store key readable while the component reading it is mounted. Unmount and both withdraw on the next turn.",
              ko: "st.tool은 액션 하나를 발행하고 onClick에 연결할 callable을 돌려줍니다. 에이전트와 사용자가 같은 핸들러를 누르는 셈입니다. st.use·st.sel·st.ref는 그 키를 읽는 컴포넌트가 마운트된 동안 스토어 키 하나를 읽을 수 있게 합니다. 언마운트되면 다음 턴부터 둘 다 철회됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Six tools are on every screen whatever it declares. Five come from the store surface, so builtins narrows them; askUser is the session's own and stays whatever you pass:",
              ko: "화면이 무엇을 선언하든 항상 실리는 툴이 여섯 있습니다. 그중 다섯은 store surface가 싣는 것이라 builtins로 줄일 수 있고, askUser는 session 자신의 것이라 builtins에 무엇을 넘기든 남습니다.",
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: "navigate",
                desc: l.trans({
                  en: "Internal paths only, the same router Link rides.",
                  ko: "내부 경로 전용입니다. Link가 타는 같은 라우터입니다.",
                }),
              },
              {
                title: "goBack",
                desc: l.trans({
                  en: "The previous page in this session's history. Global like navigate, because history is not a control a page owns — a page that draws no back link is not a page you may not leave.",
                  ko: "이 세션 히스토리의 이전 페이지. navigate처럼 전역입니다 — 히스토리는 페이지가 소유한 컨트롤이 아니고, 뒤로가기 링크를 그리지 않은 페이지가 떠날 수 없는 페이지는 아니니까요.",
                }),
              },
              {
                title: "readScreen(section?, images?)",
                desc: l.trans({
                  en: "The rendered DOM as compact text. Headings carry their anchor and a truncated read names the sections below the cut, so a long screen stays reachable: pass one of those names — or a heading's own text — as section. Every image is named whether or not it has an alt; images: true appends each one's address, off by default because a gallery is one long URL per thumbnail.",
                  ko: "렌더된 DOM을 압축 텍스트로. 제목에 앵커가 붙고, 잘린 읽기는 잘린 아래쪽 섹션 이름을 알려줍니다. 그래서 긴 화면도 닿을 수 있습니다 — 그 이름이나 제목 텍스트를 section으로 넘기면 됩니다. 이미지는 alt가 없어도 자리를 남기고, images: true를 주면 주소까지 붙습니다. 갤러리 하나가 썸네일 수만큼의 긴 URL이 되므로 기본값은 꺼짐입니다.",
                }),
              },
              {
                title: "readState(key)",
                desc: l.trans({ en: "One masked store key.", ko: "마스킹된 스토어 키 하나." }),
              },
              {
                title: "highlight(target)",
                desc: l.trans({
                  en: "Scrolls one thing into view and flashes it once the scroll lands, so the agent can show the user where a thing is instead of describing where it is. The target is a tool name, a state key, a scope path, an anchor, or a heading's text. Nothing hidden ever resolves.",
                  ko: "대상을 화면으로 스크롤한 뒤, 스크롤이 멈추면 깜빡입니다. 어디 있는지 설명하는 대신 직접 가리킵니다. 대상은 툴 이름·상태 키·스코프 경로·앵커·제목 텍스트이고, 숨겨진 것은 절대 잡히지 않습니다.",
                }),
              },
              {
                title: "askUser(question, choices?)",
                desc: l.trans({
                  en: "Hands a decision back to the user. The turn parks on the question card until they pick an option or write their own answer; dismissing it is an error the agent reads, never a silent empty answer.",
                  ko: "결정을 사용자에게 되돌립니다. 턴은 질문 카드에서 멈추고, 사용자가 보기를 고르거나 직접 답할 때까지 기다립니다. 건너뛰면 조용한 빈 답이 아니라 에이전트가 읽는 오류가 됩니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>
                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "A tool that changes the screen waits for the screen before it answers: router.push returns while the payload is still in flight, so navigate — and the session, after every tool that did not declare itself a read — waits for the DOM to hold still before reporting; the reading built-ins declare it, so a turn that only looks around pays nothing. One turn carries every call the model made in it: they run in order and come back as one tool message, so a batch costs one model round trip where the same calls chained one per turn cost a round trip and a resend of the whole transcript each. And the turn cap is a question rather than a dead end: at maxTurns the agent asks whether to keep going, and what the user types instead rides as their own turn.",
              ko: "화면을 바꾸는 툴은 화면이 정착한 뒤에 답합니다. router.push는 페이로드가 아직 오는 중에 반환되므로, navigate는 (그리고 세션은 스스로 읽기라고 선언하지 않은 모든 툴 뒤에서) DOM이 멈출 때까지 기다린 다음 변경을 보고합니다. 읽기 빌트인은 그렇게 선언하므로, 둘러보기만 하는 턴은 아무 대가도 치르지 않습니다. 한 턴은 모델이 그 턴에 만든 호출을 전부 실어 나릅니다. 호출은 순서대로 실행되어 하나의 tool 메시지로 돌아오므로, 묶어 보낸 배치는 모델 왕복 한 번이고, 같은 호출을 턴당 하나씩 이어 붙이면 호출마다 왕복 한 번에 트랜스크립트 전체를 다시 올리는 값을 냅니다. 턴 상한도 막다른 길이 아니라 질문입니다 — maxTurns에 닿으면 계속할지 묻고, 사용자가 대신 입력한 말은 그 사용자의 턴으로 들어갑니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Long work is awaited, not polled. The session awaits a tool's own promise, so a .exec that awaits the store action finishing the job simply makes the turn take that long — and the change report that follows carries whatever landed, so the model needs no second call to read it. A tool that returns early leaves the agent to ask again and again, one round trip per look, which burns the whole maxTurns budget in seconds on a job measured in minutes. Say so in the desc. For the job a tool cannot await — one started in an earlier turn, or by a person clicking the button — declare a waiting tool of your own beside the control that starts the work: a general built-in wait was tried and removed, because a tool reachable on every screen with no idea what any key means gets spent on whatever key looks promising, parking turns nobody asked to park. Stop reaches a tool that is still running: the session races every call against its abort signal, and the signal itself arrives through AgentAbort.current, the same module slot AgentProgress is. Honouring it is optional, since the race lands whatever the tool does; what it buys is the tool's own cleanup. Import both from akanjs/store — an app may not reach use-agentic directly. A stopped turn answers the calls it never ran: every provider dialect refuses an assistant message whose tool_calls have no results, on that turn and on every later one, so Stop landing between a call and its result would otherwise leave a transcript nothing can be sent from.",
              ko: "긴 작업은 폴링이 아니라 await 합니다. 세션은 툴의 promise를 기다리므로, 작업을 끝내는 스토어 액션을 await 하는 .exec은 그냥 턴이 그만큼 걸리게 만듭니다. 그리고 뒤따르는 변경 보고가 그 사이 도착한 것을 실어 나르므로, 모델은 결과를 읽기 위해 두 번째 호출을 할 필요가 없습니다. 일찍 반환하는 툴은 에이전트에게 계속 되묻게 만들고, 한 번 볼 때마다 모델 왕복이 한 번이라, 분 단위 작업에서 maxTurns 예산을 몇 초 만에 태웁니다. 그 사실을 desc에 적으세요. 툴이 기다릴 수 없는 작업 — 이전 턴에서, 또는 사용자가 버튼을 눌러 시작된 작업 — 은 그 작업을 시작하는 컨트롤 옆에 기다리는 툴을 직접 선언하세요. 범용 대기 빌트인은 만들었다가 제거했습니다. 모든 화면에서 닿을 수 있으면서 어떤 키가 무슨 뜻인지는 모르는 툴은 그럴듯해 보이는 키에 아무렇게나 쓰이고, 아무도 부탁하지 않은 대기로 턴을 세워 둡니다. Stop은 아직 돌고 있는 툴에도 닿습니다. 세션이 모든 호출을 abort 시그널과 레이스시키고, 시그널 자체는 AgentProgress와 같은 모듈 슬롯인 AgentAbort.current로 옵니다. 레이스가 어떤 툴이든 멈춰 세우므로 시그널을 존중하는 것은 선택입니다. 존중해서 얻는 것은 툴 자신의 정리입니다. 둘 다 akanjs/store에서 가져오세요 — 앱은 use-agentic에 직접 닿을 수 없습니다. 중지된 턴은 실행하지 못한 호출에 대신 답을 채웁니다. 모든 프로바이더 방언은 결과 없는 tool_calls를 가진 assistant 메시지를 거절하며, 그 턴뿐 아니라 이후 모든 턴에서 거절합니다. 그래서 호출과 결과 사이에 Stop이 떨어지면 아무것도 보낼 수 없는 트랜스크립트가 남게 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The chat answers six commands of its own, and they are the whole / menu: /new (/clear), /retry, /compact, /copy, /help and /tools. An app writes none of them and cannot add one — there is no app-defined slash command in the in-page chat. A screen a model should read is published from its page instead, with page().prompt(), and reaches MCP clients as a prompt rather than this menu. /new and /copy work mid-turn and ahead of the question card, so /new ends the turn it is clearing instead of being answered into it as text. A command's output is a local message — rendered in the transcript, withheld from the wire, because the transcript is the model's history and text appended plainly would come back next turn as something the assistant believes it said. /copy exists because nothing else keeps the transcript: the relay is stateless, so an export is the one path a wrong answer has to whoever could fix it. And ↑ walks back through what was sent, ↓ forward — seeded from the transcript, so a persisted chat does not lose only what was just typed — while the / menu takes those keys whenever it is open: Enter picks the highlighted row, Tab completes its name, and Escape closes the menu and then the panel.",
              ko: "채팅은 자체 커맨드 여섯 개를 가지며, / 메뉴는 그것이 전부입니다 — /new(/clear), /retry, /compact, /copy, /help, /tools. 앱은 이 중 아무것도 작성하지 않고 추가할 수도 없습니다. 인페이지 채팅에는 앱이 정의하는 slash command가 없습니다. 모델이 읽어야 할 화면은 대신 그 페이지에서 page().prompt()로 공개되며, 이 메뉴가 아니라 MCP 클라이언트에 prompt로 전달됩니다. /new와 /copy는 턴 중에도, 그리고 질문 카드보다 앞서 동작합니다. 그래서 /new는 질문에 대한 답변 텍스트로 삼켜지는 대신 비우려는 턴을 끝냅니다. 커맨드의 출력은 local 메시지입니다 — 트랜스크립트에는 렌더되고 와이어에는 실리지 않습니다. 트랜스크립트가 곧 모델의 히스토리라서, 그냥 붙이면 다음 턴에 모델이 자기가 한 말로 받아들입니다. /copy가 있는 이유는 트랜스크립트를 보관하는 곳이 달리 없기 때문입니다 — 릴레이는 stateless이므로, 잘못된 답이 고칠 수 있는 사람에게 닿는 유일한 경로가 내보내기입니다. 그리고 ↑는 보낸 것들을 거슬러 가고 ↓는 되돌아옵니다 — 트랜스크립트에서 시작되므로 persist된 대화가 방금 입력한 것만 잃는 일은 없습니다. / 메뉴가 열려 있는 동안에는 그 키들을 메뉴가 가져갑니다. Enter는 선택된 줄을 실행하고, Tab은 이름을 완성하며, Escape는 메뉴를 닫고 한 번 더 누르면 패널을 닫습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A long conversation summarizes itself, because nothing else keeps it inside the model's window: the loop runs in the browser and the relay holds no session, so an uncompacted chat grows until the provider refuses the whole request. Past compact.at estimated tokens the history above the last keep messages becomes one message standing in for it — before the turn that would have overflowed, since a provider answers an over-long request with a refusal rather than a shorter answer. The cut only ever lands on a user message, so the kept half never opens with a tool result whose call was summarized away. The summarizing turn carries no tools and no screen context, and is fed a bounded digest rather than the transcript itself, which is the one thing already known not to fit. compact={{ at, keep }} on Agent.Chat tunes it per provider, { at: 0 } turns it off, and /compact does the same on demand keeping nothing.",
              ko: "긴 대화는 스스로를 요약합니다. 루프는 브라우저에서 돌고 릴레이는 세션을 갖지 않으므로, 대화를 모델의 컨텍스트 창 안에 붙잡아 두는 것이 달리 없습니다 — 압축하지 않으면 프로바이더가 요청 전체를 거절할 때까지 자랍니다. 추정 토큰이 compact.at을 넘으면 마지막 keep개 위의 히스토리가 그것을 대신하는 메시지 하나가 됩니다. 넘칠 턴이 나가기 전에 그렇게 합니다. 프로바이더는 너무 긴 요청에 짧은 답이 아니라 거절로 답하기 때문입니다. 자르는 지점은 언제나 user 메시지입니다. 그래서 남는 쪽이 호출은 요약돼 사라지고 결과만 남은 tool 메시지로 시작하는 일이 없습니다. 요약 턴은 툴도 화면 컨텍스트도 싣지 않고, 트랜스크립트 자체가 아니라 길이가 제한된 요약본을 받습니다. 트랜스크립트는 이미 들어가지 않는다고 알려진 바로 그것이니까요. Agent.Chat의 compact={{ at, keep }}로 프로바이더에 맞게 조절하고, { at: 0 }으로 끄고, /compact로 언제든 남기는 것 없이 같은 일을 시킵니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Reading is per key, not per store: a key the screen does not read stays unreadable even while a sibling key of the same store is live, and every read is masked by the model that key declares. hidden and secret fields never cross the boundary. Readability is opt-out, not opt-in: a subscribed key joins the surface unless the read says otherwise, and base-store plumbing says otherwise — routing, the caller's credential and the UI operation are all subscribed with `{ agent: false }`. A component that wants an agent to read a base key writes a plain read, as ThemeToggle does for theme.",
              ko: "읽기는 스토어 단위가 아니라 키 단위입니다. 같은 스토어의 형제 키가 live여도 화면이 읽지 않는 키는 읽히지 않고, 모든 읽기는 그 키가 선언한 모델로 마스킹됩니다. hidden·secret 필드는 경계를 넘지 않습니다. 읽기는 옵트인이 아니라 옵트아웃입니다. 구독한 키는 따로 막지 않는 한 표면에 올라가며, base 스토어의 plumbing은 그것을 막습니다 — 라우팅, 호출자의 자격증명, UI operation은 모두 `{ agent: false }`로 구독합니다. 에이전트가 읽어야 하는 base 키는 ThemeToggle의 theme처럼 그냥 평범하게 읽으면 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Return what answers the question, not the record. One tool result is capped at 20,000 characters — past that the JSON is clipped mid-structure and a note tells the model what happened — and once it is in the transcript it rides every later turn, which compaction cannot save because it summarizes what is above the cut and a result arrives below it. A field that is bulky and useless to a model is fixed once at the model rather than in every tool that touches it: field.visual keeps it stored, searchable, formable and rendered on the page, and strips it from every agent read and every MCP result. It is cost, not secrecy — nothing is refused over one.",
              ko: "레코드가 아니라 질문의 답을 돌려주세요. 툴 결과 하나는 20,000자에서 잘리고 — 그 너머는 JSON이 구조 중간에서 끊기며, 무슨 일이 있었는지 알려주는 note가 붙습니다 — 한 번 대화에 들어가면 이후 모든 턴에 함께 실립니다. 압축도 이것은 구하지 못합니다. 압축은 자른 지점 위를 요약하는데 결과는 그 아래에 도착하기 때문입니다. 덩치가 크고 모델에게는 쓸모없는 필드는 그것을 만지는 모든 툴이 아니라 모델에서 한 번에 처리합니다. field.visual은 저장·검색·폼·페이지 렌더를 그대로 두고, 모든 에이전트 읽기와 모든 MCP 결과에서만 값을 벗겨냅니다. 비밀이 아니라 비용의 문제이고, 그것 때문에 거절되는 것은 없습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="<Model>.Zone.tsx — the tool and the button are one declaration"
          code={`const waypointList = st.use.waypointList();
const publish = st.tool("publishPlan")
  .desc("Publish the flight plan being edited.")
  .exec(() => st.do.publishPlan());
const focusWaypoint = st.tool("focusWaypoint")
  .desc("Center the map on one waypoint.")
  .arg("waypointId", ID)
  .opt("zoom", Int)
  .exec((waypointId, zoom) => st.do.selectWaypoint(waypointId, zoom));

st.expose("selectedWaypointId", ID)
  .desc("The waypoint the map is centered on.")
  .value(selected?.id ?? null);

<Button onClick={publish}>{l("plan.publishPlan")}</Button>
<Agent.Guide instructions="This screen edits the weekly flight plan. Focus a waypoint before editing it." />`}
        />
        <div className="space-y-1">
          {[
            {
              title: "st.tool(name).desc(…).arg(…).opt(…).exec(fn)",
              desc: l.trans({
                en: 'The only way an action reaches an agent. desc is required and comes first; arg is what the caller must pass and opt what it may — an opt the caller omits arrives null. Both take a scalar, an enum, or one array level of either — [String], [TaskStatus] — so a list never has to be taught as a string format, and a third argument narrows the value set at render time: .arg("branch", String, { oneOf: branchCodes }) is the runtime half of enumOf, for values only known once the component has its data. Returns the callable to wire to onClick.',
                ko: '액션이 에이전트에게 닿는 유일한 경로입니다. desc는 필수이고 맨 앞에 옵니다. arg는 호출자가 반드시 넘겨야 하는 인자, opt는 생략할 수 있는 인자이며 생략된 opt는 null로 들어옵니다. 둘 다 스칼라·enum, 그리고 그 배열 한 겹까지 받습니다 — [String], [TaskStatus] — 그래서 목록을 문자열 포맷으로 가르칠 일이 없습니다. 세 번째 인자는 렌더 시점에 값 집합을 좁힙니다. .arg("branch", String, { oneOf: branchCodes })는 enumOf의 런타임 쪽 짝으로, 컴포넌트가 데이터를 받은 뒤에야 알 수 있는 값에 씁니다. onClick에 연결할 callable을 돌려줍니다.',
              }),
            },
            {
              title: "st.tool(name, { confirm, settle })",
              desc: l.trans({
                en: "confirm parks the call on the approval card before it runs — true always, or a function of the arguments for the calls that deserve it. A remove* name confirms by default, destructiveness read off the key the way MCP hints are, so declaring { confirm: false } is how one opts out. settle: false says the call is a read that returns what is already there, so the turn does not wait for the DOM to hold still before reporting; the default waits, because a write may still be landing when exec resolves.",
                ko: "confirm은 호출을 실행 전에 승인 카드에 세웁니다. true로 항상, 또는 인자를 받는 함수로 그럴 만한 호출에만. remove* 이름은 기본으로 승인을 받습니다 — MCP 힌트가 그러듯 파괴성을 이름에서 읽습니다 — 그래서 빠지려면 { confirm: false }를 적습니다. settle: false는 이 호출이 이미 있는 것을 돌려주는 읽기라는 선언이라, 턴은 DOM이 멎기를 기다리지 않고 보고합니다. 기본값이 기다리는 쪽인 이유는 exec이 resolve된 뒤에도 쓰기가 아직 착지 중일 수 있기 때문입니다.",
              }),
            },
            {
              title: 'st.tool(canRefund && "refundOrder")',
              desc: l.trans({
                en: "A falsy name declares the tool without publishing it: the callable still drives the click a person makes, and nothing reaches the agent. Every chain ends in a hook, so a conditional surface withholds the name rather than skipping the declaration — and the name follows the render, so a control that appears later publishes and one that goes away stops. An argument nothing can describe withdraws the whole tool the same way, reported on the console rather than thrown, because a page must not lose its render over an agent-tooling mistake.",
                ko: "falsy한 이름은 툴을 선언하되 발행하지는 않습니다. callable은 사람이 누르는 클릭을 그대로 처리하고, 에이전트에게는 아무것도 가지 않습니다. 모든 체인은 훅으로 끝나므로, 조건부 표면은 선언을 건너뛰는 대신 이름을 비웁니다. 이름은 렌더를 따라가므로 나중에 나타난 컨트롤은 발행되고 사라진 컨트롤은 발행을 멈춥니다. 설명할 수 없는 타입의 인자도 같은 방식으로 툴 전체를 거둬들이며, 던지지 않고 콘솔에 보고합니다. 에이전트 도구화의 실수 때문에 페이지가 렌더를 잃어서는 안 되기 때문입니다.",
              }),
            },
            {
              title: "st.expose(name, Type).desc(…).value(v) · st.useState(name, Type).desc(…).init(v)",
              desc: l.trans({
                en: "Derived values and local state. Each ends in its own one hook: .value() takes the value the component already holds — a thunk when it is assembled out of a ref the children fill in — and .init() is useState, returning the same pair. The declared type typechecks what you hand over and masks how it reads: a model class strips its own hidden, secret and visual fields; Any passes untouched. Read-only unless set: true, which publishes a set<Name> tool writing that same type. { report: false } keeps a key out of post-call diff reports, for a value that changes on its own every second.",
                ko: "파생 값과 로컬 상태입니다. 각각 자기 훅 하나로 끝납니다. .value()는 컴포넌트가 이미 쥐고 있는 값을 받고 — 자식이 채우는 ref에서 조립되는 값이라면 thunk를 받습니다 — .init()은 useState 그 자체라 같은 쌍을 돌려줍니다. 선언한 타입이 넘기는 값을 typecheck하고 읽히는 형태를 결정합니다. 모델 클래스는 그 모델의 hidden·secret·visual을 벗겨내고, Any는 그대로 통과시킵니다. set: true 전에는 읽기 전용이며, set: true는 같은 타입을 쓰는 set<Name> 툴을 발행합니다. { report: false }는 그 키를 호출 후 변경 보고에서 빼냅니다. 초마다 저절로 바뀌는 값을 위한 것입니다.",
              }),
            },
            {
              title: "agentAttrs(handler, key)",
              desc: l.trans({
                en: "The data-akan-* attributes for a handler passed by reference, and {} for an inline arrow — a closure the caller wrote says nothing about what it does, and a guessed annotation is worse than none. Every akanjs/ui control already spreads it, so an app writes it only on a control of its own. key names which of several namesake controls this one is, in the same vocabulary the call's argument uses: a tab's menus share one tool, and without the key the page can say what the agent did but never where, so the pointer draws nothing rather than ringing the wrong row.",
                ko: "레퍼런스로 넘긴 핸들러의 data-akan-* 속성이고, 인라인 화살표에는 {}입니다. 호출자가 그 자리에서 쓴 클로저는 자기가 무엇을 하는지 말해주지 않고, 추측한 표식은 표식이 없는 것보다 나쁩니다. akanjs/ui의 모든 컨트롤이 이미 펼쳐 넣으므로, 앱은 자기가 만든 컨트롤에만 적습니다. key는 같은 이름의 컨트롤 여럿 중 어느 것인지를, 호출 인자와 같은 어휘로 말합니다. 탭의 메뉴들은 툴 하나를 공유하므로, key가 없으면 페이지는 에이전트가 무엇을 했는지는 말해도 어디서 했는지는 말하지 못합니다. 그래서 포인터는 엉뚱한 행에 링을 거는 대신 아무것도 그리지 않습니다.",
              }),
            },
            {
              title: "st.use.x({ agent: false })",
              desc: l.trans({
                en: "Subscribes without joining the surface. There is no store-level exposure switch — a store class says nothing about agents.",
                ko: "구독하되 표면에는 넣지 않습니다. 스토어 단위 노출 스위치는 없습니다. 스토어 클래스는 에이전트에 대해 아무것도 말하지 않습니다.",
              }),
            },
          ].map(({ title, desc }) => (
            <div key={title} className={panelRecipe({ padding: "row" })}>
              <span className="font-mono font-semibold text-primary">{title}: </span>
              <span className="text-foreground/70 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-zones" title={l.trans({ en: "Zone Agents", ko: "Zone 에이전트" })}>
        <Docs.Title>{l.trans({ en: "Zone Agents", ko: "Zone 에이전트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Wrap a section in Agent.Zone and everything mounted inside — subscriptions, hook tools, guides — belongs to that zone's own conversation as well as to the root agent. Zones are views of the screen, never walls between its parts. A zone's readScreen reads only its own container, and an Agent.Chat mounted inside binds to the zone session automatically.",
              ko: "구획을 Agent.Zone으로 감싸면 그 안에 마운트된 모든 것(구독, 훅 툴, 가이드)이 그 zone의 대화에 속하면서 root 에이전트에도 그대로 보입니다. zone은 화면의 뷰이지 벽이 아닙니다. zone의 readScreen은 자기 컨테이너만 읽고, 안에 마운트된 Agent.Chat은 자동으로 그 zone의 세션에 바인딩됩니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="two zones, two parallel conversations"
          code={`<Agent.Zone id="comments" label="Comment management" instructions="Moderate the comment queue." persist>
  <Comment.Zone.Board init={commentInit} />
  <Agent.Chat inline />
</Agent.Zone>

<Agent.Zone id="posts" label="Post management">
  <Post.Zone.Editor init={postInit} />
  <Agent.Chat inline />
</Agent.Zone>`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "Guides follow the layout cascade: a zone reads its ancestors' guidance plus its own, and never a sibling's. The root chat outside the zones keeps seeing the whole screen, so wrapping a section costs the root agent nothing.",
              ko: "가이드는 레이아웃 캐스케이드를 따릅니다. zone은 조상의 지침과 자신의 지침을 읽고, 형제 zone의 것은 절대 읽지 않습니다. zone 밖의 root 채팅은 화면 전체를 계속 보므로, 구획을 감싸도 root 에이전트가 잃는 것은 없습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-skip" title={l.trans({ en: "Skipping A Region", ko: "읽지 않을 영역" })}>
        <Docs.Title>{l.trans({ en: "Skipping A Region", ko: "읽지 않을 영역" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "readScreen reads the whole rendered screen, and a footer, a cookie banner, or a nav that repeats on every route costs the same tokens as the content — on that read and on every later turn, since the read stays in the transcript. Agent.Skip leaves a region out of the default read.",
              ko: "readScreen은 렌더된 화면 전체를 읽고, 푸터·쿠키 배너·모든 라우트에 반복되는 내비게이션도 본문과 같은 토큰을 씁니다. 그 읽기에서 한 번, 그리고 이후 모든 턴에서 다시 — 읽은 결과가 트랜스크립트에 남기 때문입니다. Agent.Skip은 그 영역을 기본 읽기에서 빼냅니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="a region marked, and what the read prints instead"
          code={`<Agent.Skip label="site footer">
  <Footer />
</Agent.Skip>

// Or on the element the page already renders, where a wrapper div would move a flex or grid layout:
<footer id="footer" data-agent-skip="site footer">…</footer>

// readScreen then prints this in place of the whole region:
// [skipped: site footer (#footer)]`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "What stands in its place is a named marker, never nothing. A deleted region reads as an absent one — an agent asked about the footer would answer that the page has none. The name in the marker is a section, so naming it reads the region after all: the marker is what the default read leaves out, not a wall.",
              ko: "그 자리에는 이름 붙은 표시가 남습니다. 아무것도 남기지 않으면 지워진 영역이 없는 영역으로 읽힙니다 — 푸터에 대해 물으면 에이전트는 이 페이지에 푸터가 없다고 답하게 됩니다. 표시의 이름은 그대로 section이므로, 이름을 넘기면 결국 읽을 수 있습니다. 표시는 기본 읽기가 빼놓은 것이지 벽이 아닙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "It hides text, not behaviour. Tools and state keys are declarations rather than markup, so an st.tool declared inside is published exactly as before and highlight still reaches a control in there. This is field.visual one layer up: cost, not secrecy.",
              ko: "감추는 것은 텍스트이지 동작이 아닙니다. 툴과 상태 키는 마크업이 아니라 선언이므로, 안에서 선언한 st.tool은 그대로 발행되고 highlight도 그 안의 컨트롤에 여전히 닿습니다. field.visual과 같은 이야기를 한 층 위에서 하는 것입니다 — 비밀이 아니라 비용입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Reach for it second. A read is scoped from the other side too: Agent.Zone and readScreen({ section }) narrow to one container, which beats blocklisting five regions on a screen that is mostly chrome. And a footer is last in the document, so on a page long enough to truncate it was already past the cut — the regions worth marking are the ones above the content.",
              ko: "먼저 꺼낼 도구는 아닙니다. 읽기는 반대쪽에서도 좁힐 수 있습니다. Agent.Zone과 readScreen({ section })은 컨테이너 하나로 범위를 줄이고, 화면 대부분이 크롬인 경우엔 영역 다섯 개를 하나씩 빼는 것보다 그 편이 낫습니다. 그리고 푸터는 문서의 마지막이므로, 잘릴 만큼 긴 페이지에서는 이미 컷 뒤에 있었습니다 — 표시할 값이 있는 영역은 본문 위쪽에 있는 것들입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-visual" title={l.trans({ en: "Showing the Work", ko: "작업을 보여주기" })}>
        <Docs.Title>{l.trans({ en: "Showing the Work", ko: "작업을 보여주기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The transcript says what the agent did, and it is behind a panel that is closed as often as it is open. So the page says it too: the control a call was published from is ringed where it stands, scrolled to first when it is off screen, and a pointer travels to it and presses it. It costs an app nothing for the same reason data-akan-action does. The onChange={st.do.setTitleOnTask} reference that publishes the tool is what annotates the control, and the annotation is what makes it findable, so an inline arrow silently costs three things at once.",
              ko: "대화창은 에이전트가 무엇을 했는지 말해 주지만, 그 패널은 열려 있는 만큼이나 닫혀 있습니다. 그래서 페이지도 같이 말합니다. 호출이 발행된 컨트롤에 그 자리에서 링이 걸리고, 화면 밖이면 먼저 스크롤하며, 포인터가 그리로 이동해 누릅니다. data-akan-action이 그렇듯 앱이 쓸 코드는 없습니다. 툴을 발행하는 onChange={st.do.setTitleOnTask} 레퍼런스가 컨트롤에 표식을 남기고, 그 표식이 컨트롤을 찾을 수 있게 만듭니다. 인라인 화살표 함수 하나가 세 가지를 한꺼번에 조용히 잃게 하는 이유입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The pointer's unit is the turn, not the call. A model's calls arrive with its own writing between them — seconds each — so a pointer that lived for the length of a call spent every turn vanishing and coming back. It stays for as long as the turn runs: it appears at the first control it presses, drifts clear of it and waits there as a spinner, and fades when the turn ends. Clearing the control is the whole of that gesture — a person clicks and takes the hand away, and a spinner left sitting on the button covers the very change it caused. A turn that drove no control draws no pointer at all, which is the honest answer: an agent that only answered a question was never on the screen. While a reveal scrolls the page to the next control, the pointer holds still the way a person's does, and carries a chevron pointing the way the view is travelling — stillness over a sliding page otherwise reads as a pointer that has come loose rather than as the one doing the scrolling.",
              ko: "포인터의 단위는 호출이 아니라 턴입니다. 모델의 호출들 사이에는 모델이 글을 쓰는 시간이 몇 초씩 끼어 있어서, 호출 길이만큼만 사는 포인터는 턴마다 사라졌다 다시 나타나기를 반복했습니다. 이제는 턴이 도는 동안 머뭅니다. 처음 누르는 컨트롤에서 등장하고, 그 컨트롤을 살짝 벗어난 자리로 물러나 스피너로 기다리다가, 턴이 끝나면 사라집니다. 벗어나는 것이 그 동작의 핵심입니다. 사람은 누르고 나면 손을 치우고, 누른 버튼 위에 그대로 남은 스피너는 자기가 일으킨 변화를 가려 버리니까요. 아무 컨트롤도 몰지 않은 턴은 포인터를 아예 그리지 않습니다. 질문에 답만 한 에이전트는 애초에 화면에 있지 않았으니까요. 다음 컨트롤로 화면을 스크롤하는 동안 포인터는 사람의 포인터가 그렇듯 제자리를 지키되, 화면이 가는 방향으로 셰브론을 답니다. 그렇지 않으면 미끄러지는 페이지 위에 가만히 있는 포인터가 스크롤하는 주체가 아니라 화면에서 떨어져 나온 것처럼 읽힙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "What it refuses to draw is the point. A name several rows answer to rings nothing unless the call's own argument names which one — a tab's menus share one tool, so each menu carries its key and the pointer picks the one that was switched to. A call an approval or a guard turned back is never drawn at all, a control the screen is not actually showing is not pointed at — under a modal's backdrop, inside a drawer that has slid off, faded to nothing — and a backgrounded tab draws nothing. A ring on the wrong element is worse than no ring: it is the screen telling the user something untrue about what just happened. Almost nothing is waited on either — the call starts the moment the effect is handed its event, because an animation that held a call would make the agent slower for a decoration.",
              ko: "그리지 않기로 한 것들이 핵심입니다. 여러 컨트롤이 같은 이름을 가지면, 호출의 인자가 그중 어느 것인지 짚어 주지 않는 한 추측하느니 아무것도 그리지 않습니다. 탭의 메뉴들은 툴 하나를 공유하므로 각 메뉴가 자기 키를 달고 있고, 포인터는 실제로 전환된 그 메뉴를 고릅니다. 승인이나 가드가 되돌린 호출은 애초에 그려지지 않고, 화면이 실제로 보여 주고 있지 않은 컨트롤에는 포인터가 가지 않으며(모달 뒤, 밀려난 서랍 안, 투명해진 것), 백그라운드 탭에서는 아무 일도 하지 않습니다. 엉뚱한 요소에 걸린 링은 링이 없는 것보다 나쁩니다. 방금 무슨 일이 있었는지에 대해 화면이 사용자에게 거짓을 말하는 것이기 때문입니다. 거의 아무것도 기다리지 않습니다. 이벤트를 넘겨받는 순간 호출은 이미 시작돼 있습니다. 연출 때문에 에이전트가 느려지면 안 되니까요.",
            })}
          </div>
          <div>
            {l.trans({
              en: "It draws where the change landed and nowhere else. A call that reaches no control on screen draws nothing at all — navigate mostly included, since the router is not an element and a bar across the top of the page read as chrome the page had grown rather than as the agent doing something. But a destination the screen already offers as a link is an element, and that one is pressed: when exactly one visible link goes where the navigation is going, the pointer travels to it and clicks it before the route moves. That is the only call the runtime waits for, capped at 600ms, because a click drawn on a tree the router has already replaced is no click at all. Link presence decides what is drawn, never what is allowed — the agent may go anywhere the user could type.",
              ko: "변화가 떨어진 자리에만 그리고 그 밖에는 그리지 않습니다. 화면의 어떤 컨트롤에도 닿지 않는 호출은 아무것도 그리지 않습니다. navigate도 대체로 그렇습니다. 라우터는 요소가 아니고, 페이지 상단에 걸었던 바는 에이전트가 무언가 하고 있다는 신호가 아니라 페이지가 늘린 크롬처럼 읽혔습니다. 다만 목적지를 화면이 이미 링크로 내어주고 있다면 그건 요소입니다. 그리로 가는 보이는 링크가 정확히 하나일 때, 포인터가 거기로 이동해 라우팅보다 먼저 누릅니다. 런타임이 기다려 주는 유일한 호출이고 상한은 600ms입니다. 라우터가 이미 갈아치운 트리에 그린 클릭은 클릭이 아니니까요. 링크의 유무는 무엇을 그릴지를 정할 뿐 무엇을 허용할지를 정하지 않습니다. 에이전트는 사용자가 주소창에 칠 수 있는 곳이면 어디든 갑니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Below is the thing itself. Both buttons hand their st.tool callable straight to Button's onClick, which is the whole of what makes them findable — ask the agent to count up three times and reset, and watch where it presses.",
              ko: "아래가 그 자체입니다. 두 버튼 모두 st.tool이 돌려준 callable을 Button의 onClick에 그대로 넘기며, 그것만으로 찾을 수 있는 컨트롤이 됩니다. 에이전트에게 세 번 올린 뒤 초기화해 달라고 하고 어디를 누르는지 보세요.",
            })}
          </div>
        </Docs.Description>
        <AgentVisualDemo />
        <Code.Snippet
          className="w-full"
          title="apps/<app>/page/_layout.tsx"
          code={`<Agent.Chat visual={false} />

<Agent.Chat visual={{ cursor: false }} />`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-llm" title={l.trans({ en: "Swapping the Model", ko: "모델 교체" })}>
        <Docs.Title>{l.trans({ en: "Swapping the Model", ko: "모델 교체" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Everything the model needs is declared in option.ts, never in the environment. setLlm fills apiKey, model, host, accepts and maxTokens for whichever adaptor holds LlmAdaptorRole, so the settings survive a provider swap — and it keeps whatever else it is handed, so an adaptor you wrote reads its own fields from the same place with use<MyLlmOption>(). Two adaptors ship, one per wire. OpenaiLlm is the default and speaks the chat-completions dialect to whatever host names: OpenAI, DeepSeek, Groq, OpenRouter, Ollama. AnthropicLlm is the Messages API and reads a PDF as well as a picture. Both require a model, since a default would age into a 404 and would decide the vision claim for the app. accepts overrides what the configured model reads, because an adaptor answers for an API and one API serves models that differ. With no apiKey the app still boots and the chat says no model is configured; a refusal the provider explained is thrown instead of swallowed, so the chat prints that reason in the user's language.",
              ko: "모델에 필요한 설정은 환경변수가 아니라 option.ts에 선언합니다. setLlm은 LlmAdaptorRole을 차지한 어댑터에 apiKey·model·host·accepts·maxTokens를 채우므로, 프로바이더를 바꿔도 설정은 그대로입니다. 그리고 건네받은 나머지 필드도 그대로 실어 나르므로, 직접 쓴 어댑터는 use<MyLlmOption>()으로 자기 설정을 같은 자리에서 읽습니다. 어댑터는 와이어당 하나씩 둘이 들어 있습니다. 기본값 OpenaiLlm은 host가 가리키는 곳에 chat-completions 방언으로 말합니다. OpenAI, DeepSeek, Groq, OpenRouter, Ollama가 모두 여기에 해당합니다. AnthropicLlm은 Messages API이고 사진뿐 아니라 PDF도 읽습니다. 둘 다 model이 필수인데, 기본값을 두면 언젠가 404가 되고 비전 여부를 앱 대신 정해버리기 때문입니다. accepts는 설정한 모델이 무엇을 읽는지 덮어씁니다 — 어댑터는 API 하나를 대변하고, 한 API가 서로 다른 모델을 섬기기 때문입니다. apiKey가 없어도 앱은 기동하고, 채팅은 모델이 설정되지 않았다고 답합니다. 프로바이더가 이유를 밝힌 거절은 삼키지 않고 던지므로, 채팅이 그 이유를 사용자의 언어로 보여줍니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/option.ts"
          code={`import { LlmAdaptorRole } from "akanjs/service";
import { MyLlm } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .applyAdaptor(LlmAdaptorRole, MyLlm);`}
        />
        <Code.Snippet
          className="w-full"
          title="akanjs/service — LlmAdaptor"
          code={`export interface LlmAdaptor {
  chat(request: LlmTurnRequest, onDelta?: (delta: string) => void): Promise<LlmTurnAnswer | null>;
}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "An adaptor implements one method — chat(request, onDelta?). The whole transcript goes in, one assistant answer comes out. Rebind the role the way applyMiddleware rebinds middleware: last writer wins.",
              ko: "어댑터가 구현할 것은 chat(request, onDelta?) 하나입니다. 전체 대화가 들어가고 어시스턴트 응답 하나가 나옵니다. 롤 다시 묶기는 applyMiddleware와 같습니다. 마지막에 쓴 쪽이 이깁니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
