import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { Link } from "akanjs/ui";

export default function Page() {
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
                  en: "The relay endpoint, the DeepSeek adaptor, and the chat UI all ship with akanjs — no extra library to mount.",
                  ko: "릴레이 엔드포인트, DeepSeek 어댑터, 채팅 UI가 모두 akanjs에 내장돼 있어 추가로 마운트할 라이브러리가 없습니다.",
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
                    en: "The loop, the approval card, and slash commands from prompt() endpoints.",
                    ko: "대화 루프, 승인 카드, prompt() 엔드포인트에서 온 slash command.",
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
                    en: "The whole transcript in, one assistant answer out. DeepSeek is the default.",
                    ko: "전체 대화가 들어가고 어시스턴트 응답 하나가 나옵니다. 기본값은 DeepSeek입니다.",
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
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts"
          code={`// page/_layout.tsx
<Agent.Chat persist />

// lib/option.ts — the key lives in env, which is gitignored
export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess((context) => !!context.get("account"));`}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: "AgentRelayAccess refuses every call until a policy is registered — the same answer None gives. Without a policy the chat cannot spend the LLM key. A product with accounts locks it in the same option.ts.",
            ko: "AgentRelayAccess는 정책 등록 전까지 모든 호출을 None과 같이 거절합니다. 정책이 없으면 채팅이 LLM 키를 쓸 수 없습니다. 계정이 있는 제품은 같은 option.ts에서 잠급니다.",
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
              en: "Six tools are on every screen whatever it declares:",
              ko: "화면이 무엇을 선언하든 항상 실리는 툴이 여섯 있습니다.",
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
                title: "readScreen(section?)",
                desc: l.trans({
                  en: "The rendered DOM as compact text. Headings carry their anchor and a truncated read names the sections below the cut, so a long screen stays reachable: pass one of those names — or a heading's own text — as section.",
                  ko: "렌더된 DOM을 압축 텍스트로. 제목에 앵커가 붙고, 잘린 읽기는 잘린 아래쪽 섹션 이름을 알려줍니다. 그래서 긴 화면도 닿을 수 있습니다 — 그 이름이나 제목 텍스트를 section으로 넘기면 됩니다.",
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
              en: "A tool that changes the screen waits for the screen before it answers: router.push returns while the payload is still in flight, so navigate — and the session, after every non-query tool — waits for the DOM to hold still before reporting. A slow tool reports its own progress with AgentProgress.report, shown on that call's row. And the turn cap is a question rather than a dead end: at maxTurns the agent asks whether to keep going, and what the user types instead rides as their own turn.",
              ko: "화면을 바꾸는 툴은 화면이 정착한 뒤에 답합니다. router.push는 페이로드가 아직 오는 중에 반환되므로, navigate는 (그리고 세션은 query가 아닌 모든 툴 뒤에서) DOM이 멈출 때까지 기다린 다음 변경을 보고합니다. 느린 툴은 AgentProgress.report로 자기 진행을 알리고, 그 호출의 행에 표시됩니다. 턴 상한도 막다른 길이 아니라 질문입니다 — maxTurns에 닿으면 계속할지 묻고, 사용자가 대신 입력한 말은 그 사용자의 턴으로 들어갑니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Reading is per key, not per store: a key the screen does not read stays unreadable even while a sibling key of the same store is live, and every read is masked by the model that key declares. hidden and secret fields never cross the boundary. Base-store plumbing is subscribed with `{ agent: false }` so routing and the caller's credential stay off the surface; a component that wants an agent to read a base key opts it in, as ThemeToggle does for theme.",
              ko: "읽기는 스토어 단위가 아니라 키 단위입니다. 같은 스토어의 형제 키가 live여도 화면이 읽지 않는 키는 읽히지 않고, 모든 읽기는 그 키가 선언한 모델로 마스킹됩니다. hidden·secret 필드는 경계를 넘지 않습니다. base 스토어의 plumbing은 `{ agent: false }`로 구독해서 라우팅과 호출자의 자격증명이 표면에 올라가지 않게 하고, 에이전트가 읽어야 하는 키는 ThemeToggle의 theme처럼 옵트인합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="<Model>.Zone.tsx — the tool and the button are one declaration"
          code={`const waypointList = st.use.waypointList();
const publish = st.tool("publishPlan", { desc: "Publish the flight plan being edited." })
  .exec(() => st.do.publishPlan());
const focusWaypoint = st.tool("focusWaypoint", { desc: "Center the map on one waypoint." })
  .arg("waypointId", ID)
  .exec((waypointId) => st.do.selectWaypoint(waypointId));

st.expose("selectedWaypointId", selected?.id ?? null);

<Button onClick={publish}>{l("plan.publishPlan")}</Button>
<Agent.Guide instructions="This screen edits the weekly flight plan. Focus a waypoint before editing it." />`}
        />
        <div className="space-y-1">
          {[
            {
              title: "st.tool(name).arg(…).exec(fn)",
              desc: l.trans({
                en: "The only way an action reaches an agent. Returns the callable to wire to onClick; a remove* name confirms by default.",
                ko: "액션이 에이전트에게 닿는 유일한 경로입니다. onClick에 연결할 callable을 돌려주고, remove* 이름은 기본으로 승인을 받습니다.",
              }),
            },
            {
              title: "st.useState · st.expose",
              desc: l.trans({
                en: "Local state and derived values, read-only unless set: names a type.",
                ko: "로컬 상태와 파생 값입니다. set:으로 타입을 주기 전에는 읽기 전용입니다.",
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

      <Scroll.Slide id="agent-llm" title={l.trans({ en: "Swapping the Model", ko: "모델 교체" })}>
        <Docs.Title>{l.trans({ en: "Swapping the Model", ko: "모델 교체" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Everything the model needs is declared in option.ts, never in the environment. setLlm fills apiKey, model, and host for whichever adaptor holds LlmAdaptorRole, so the settings survive a provider swap. DeepSeek is the built-in default — deepseek-v4-flash at https://api.deepseek.com. With no apiKey the app still boots and the chat answers llmUnavailable.",
              ko: "모델에 필요한 설정은 환경변수가 아니라 option.ts에 선언합니다. setLlm은 LlmAdaptorRole을 차지한 어댑터에 apiKey·model·host를 채우므로, 프로바이더를 바꿔도 설정은 그대로입니다. 기본값은 DeepSeek입니다. deepseek-v4-flash, https://api.deepseek.com. apiKey가 없어도 앱은 기동하고 채팅은 llmUnavailable로 답합니다.",
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
}
