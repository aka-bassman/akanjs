import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="agent-overview" title={l.trans({ en: "In-Page Agent", ko: "인페이지 에이전트" })}>
        <Docs.Title>{l.trans({ en: "In-Page Agent", ko: "인페이지 에이전트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every Akan app can host a chat agent that reads the rendered screen and drives it — the assistant on this very page is one. Tools, state, and context are derived from what is actually on screen, not declared by hand: a store joins the agent's surface only while a mounted component is reading one of its keys, so most screens publish a complete surface with zero agent code.",
              ko: "모든 Akan 앱은 렌더된 화면을 읽고 조작하는 채팅 에이전트를 품을 수 있습니다. 지금 이 페이지의 어시스턴트가 바로 그것입니다. 툴·상태·컨텍스트는 손으로 선언하는 게 아니라 실제 화면에서 파생됩니다. 마운트된 컴포넌트가 스토어 키를 읽고 있는 동안에만 그 스토어가 에이전트 표면에 실리므로, 대부분의 화면은 에이전트 코드 0줄로 완전한 표면을 발행합니다.",
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
                <span className="text-foreground/70">{desc}</span>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-mount" title={l.trans({ en: "Mount and Secure", ko: "마운트와 보안" })}>
        <Docs.SubTitle>{l.trans({ en: "Mount and Secure", ko: "마운트와 보안" })}</Docs.SubTitle>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Mount the chat once in a layout. The relay endpoint runAgentTurn is served by the framework on every app (option.setLlm gives it a key; AKAN_AGENT=false removes the whole surface). Its guard AgentRelayAccess allows everyone until a policy is registered — a product with accounts locks it in the same option.ts, or anonymous visitors can spend the LLM key.",
              ko: "레이아웃에 채팅을 한 번 마운트하세요. 릴레이 엔드포인트 runAgentTurn은 프레임워크가 모든 앱에 기본 제공합니다(option.setLlm으로 키를 주고, AKAN_AGENT=false로 표면 전체 제거). 가드 AgentRelayAccess는 정책 등록 전까지 전원 허용이므로, 계정이 있는 제품은 같은 option.ts에서 잠가야 합니다. 잠그지 않으면 익명 방문자가 LLM 키로 과금을 태울 수 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts"
            code={`
// page/_layout.tsx — the whole integration
<Agent.Chat persist />

// lib/option.ts — give the relay a key, and lock it for a product with accounts
export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess((context) => !!context.get("account"));
`}
          />
          <div>
            {l.trans({
              en: 'The same endpoint answers streaming: the chat negotiates text/event-stream, so assistant text arrives as it is generated with zero app code. persist keeps the transcript across reloads in sessionStorage ({ storage: "local" } to outlive the tab); it is off by default.',
              ko: '같은 엔드포인트가 스트리밍도 답합니다. 채팅이 text/event-stream을 협상하므로 어시스턴트 텍스트가 생성되는 대로 도착하며 앱 코드는 필요 없습니다. persist는 대화 내용을 sessionStorage에 보존해 새로고침을 견디게 합니다({ storage: "local" }이면 탭을 닫아도 유지). 기본값은 꺼짐입니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-surface" title={l.trans({ en: "The Derived Surface", ko: "파생되는 표면" })}>
        <Docs.SubTitle>{l.trans({ en: "The Derived Surface", ko: "파생되는 표면" })}</Docs.SubTitle>
        <Docs.Description>
          <div>
            {l.trans({
              en: 'While a mounted component reads a store key through st.use, st.sel, or st.ref, that store\'s catalogued actions and state are published to the agent. Leave the screen and they withdraw on the next turn. Three built-ins ride every surface: navigate (internal paths only), readScreen (the rendered DOM as compact text — what answers "summarize this page"), and readState(key) (one masked store key).',
              ko: '마운트된 컴포넌트가 st.use·st.sel·st.ref로 스토어 키를 읽는 동안 그 스토어의 카탈로그된 액션과 상태가 에이전트에 발행됩니다. 화면을 떠나면 다음 턴부터 철회됩니다. 모든 표면에는 내장 3종이 실립니다: navigate(내부 경로 전용), readScreen(렌더된 DOM을 압축 텍스트로 — "이 페이지 요약해줘"를 담당), readState(key)(마스킹된 스토어 키 읽기).',
            })}
          </div>
          <div>
            {l.trans({
              en: "Exposure is the store author's to trim: static agent = false takes a whole store off the surface, static agent = { exclude: [...] } withholds named entries, and st.use.x({ agent: false }) subscribes without counting. hidden and secret fields never cross the boundary — a value with no model to mask by is refused at read.",
              ko: "노출 다듬기는 스토어 작성자의 몫입니다. static agent = false는 스토어 전체를 표면에서 내리고, static agent = { exclude: [...] }는 지정 항목을 감추며, st.use.x({ agent: false })는 구독하되 집계에서 뺍니다. hidden·secret 필드는 경계를 절대 넘지 않습니다. 마스킹할 모델이 없는 값은 읽기 자체가 거절됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="lib/<model>/<model>.store.ts · component hooks"
            code={`
// A store trims its own exposure
export class MapStore extends store(cnst.map, () => ({ ... })) {
  static override agent = { exclude: ["setMapBounds", "mapCamera"] };
}

// A component publishes screen-only levers — .exec() is the one hook in the chain
st.expose("selectedWaypointId", selected?.id ?? null);
st.tool("focusWaypoint", { desc: "Center the map on one waypoint." })
  .arg("waypointId", ID)
  .exec((waypointId) => focusOn(waypointId));

// Route-scoped guidance — the render tree is the cascade
<Agent.Guide instructions="This screen edits the weekly flight plan. Prefer updateWaypoint over raw setters." />
`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="agent-zones" title={l.trans({ en: "Zone Agents", ko: "Zone 에이전트" })}>
        <Docs.SubTitle>{l.trans({ en: "Zone Agents", ko: "Zone 에이전트" })}</Docs.SubTitle>
        <Docs.Description>
          <div>
            {l.trans({
              en: "One screen can run several agents in parallel. Wrap a section in Agent.Zone and everything mounted inside — subscriptions, hook tools, guides — belongs to that zone's own conversation as well as to the root agent: zones are views of the screen, never walls between its parts. A zone's readScreen reads only its own container, and an Agent.Chat mounted inside binds to the zone session automatically.",
              ko: "한 화면에서 여러 에이전트를 병렬로 운영할 수 있습니다. 구획을 Agent.Zone으로 감싸면 그 안에 마운트된 모든 것(구독, 훅 툴, 가이드)이 그 zone의 대화에 속하면서 root 에이전트에도 그대로 보입니다. zone은 화면의 '뷰'이지 벽이 아닙니다. zone의 readScreen은 자기 컨테이너만 읽고, 안에 마운트된 Agent.Chat은 자동으로 그 zone의 세션에 바인딩됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="two zones, two parallel conversations"
            code={`
<Agent.Zone id="comments" label="Comment management" instructions="Moderate the comment queue." persist>
  <Comment.Zone.Board init={commentInit} />
  <Agent.Chat className="static" />
</Agent.Zone>

<Agent.Zone id="posts" label="Post management">
  <Post.Zone.Editor init={postInit} />
  <Agent.Chat className="static" />
</Agent.Zone>
`}
          />
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
        <Docs.SubTitle>{l.trans({ en: "Swapping the Model", ko: "모델 교체" })}</Docs.SubTitle>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Everything the model needs is declared in option.ts, never in the environment: setLlm fills apiKey, model, and host for whichever adaptor holds the role, so the settings survive a provider swap. DeepSeek is the built-in default. Any other provider is one adaptor away: implement LlmAdaptor as an adapt() class and rebind the role in the same file — the one-line pattern applyMiddleware uses.",
              ko: "모델에 필요한 설정은 전부 환경변수가 아니라 option.ts에 선언합니다. setLlm은 롤을 차지한 어댑터에 apiKey·model·host를 채우므로, 프로바이더를 바꿔도 설정은 그대로입니다. 기본값은 DeepSeek입니다. 다른 프로바이더는 어댑터 하나 거리입니다. LlmAdaptor를 adapt() 클래스로 구현하고 같은 파일에서 롤을 다시 바인딩하세요. applyMiddleware와 같은 한 줄 패턴입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/<app>/lib/option.ts"
            code={`
import { LlmAdaptorRole } from "akanjs/service";
import { ClaudeLlm } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  // The key belongs in the app's own env object, which is gitignored — never in this file.
  .setLlm((options) => ({ ...options.llm, model: "claude-sonnet-5" }))
  .applyAdaptor(LlmAdaptorRole, ClaudeLlm);
`}
          />
          <div>
            {l.trans({
              en: "An adaptor implements one method — chat(request, onDelta?) — the whole transcript in, one assistant answer out. Ignore onDelta and the chat still works; report deltas and streaming lights up for free.",
              ko: "어댑터가 구현할 것은 chat(request, onDelta?) 하나입니다. 전체 대화가 들어가고 어시스턴트 응답 하나가 나옵니다. onDelta를 무시해도 채팅은 동작하고, 델타를 보고하면 스트리밍이 공짜로 켜집니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
}
