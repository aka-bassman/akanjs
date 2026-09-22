import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const slots = [
    {
      name: "AgentChat",
      fallback: "—",
      en: "The whole panel — launcher, transcript, cards and composer. The only slot with no Default export: a replacement is the loop, so there is nothing to compose. Reach for it last.",
      ko: "패널 전체입니다. launcher, 대화, 카드, 작성창까지. Default export가 없는 유일한 슬롯입니다. 교체하는 것이 루프 자체라 겹칠 대상이 없습니다. 가장 마지막에 꺼내세요.",
    },
    {
      name: "AgentLauncher",
      fallback: "DefaultLauncher",
      en: "The closed-state button. Takes label, hotkey and unread, so a badge for messages that arrived while the panel was shut costs nothing.",
      ko: "닫힌 상태의 버튼입니다. label·hotkey·unread를 받으므로, 패널이 닫힌 사이 도착한 메시지 뱃지는 따로 만들 일이 없습니다.",
    },
    {
      name: "AgentBubble",
      fallback: "DefaultBubble",
      en: "One message. Bind a memo()'d component here — the transcript re-renders on every streamed delta.",
      ko: "메시지 하나입니다. 여기에는 memo()를 씌운 컴포넌트를 묶으세요. 대화는 스트리밍 delta마다 다시 그려집니다.",
    },
    {
      name: "AgentSteps",
      fallback: "DefaultSteps",
      en: "One agent turn — every message between two user messages — plus isRunning. The default adds no element at all.",
      ko: "에이전트 턴 하나입니다. user 메시지 두 개 사이의 모든 메시지와 isRunning을 받습니다. 기본 구현은 요소를 하나도 더하지 않습니다.",
    },
    {
      name: "AgentComposer",
      fallback: "DefaultComposer",
      en: "The input row: draft, staged files, reference chips, the microphone, Send and Stop. It resolves its field shell through the input recipe slot.",
      ko: "입력 줄입니다. draft, 첨부 대기 파일, reference chip, 마이크, Send와 Stop. 필드 셸은 input recipe 슬롯을 통해 풀립니다.",
    },
    {
      name: "AgentApproval",
      fallback: "DefaultApproval",
      en: "The confirm gate parked above the composer. Gets the call's arguments and two callbacks; a remove* tool reaches it by default.",
      ko: "작성창 위에 서는 확인 관문입니다. 호출 인자와 콜백 두 개를 받습니다. remove* 툴은 기본으로 여기에 닿습니다.",
    },
    {
      name: "AgentQuestion",
      fallback: "DefaultQuestion",
      en: "askUser's card. Choices only — free text is answered in the composer below, so the panel never grows a second input meaning the same thing.",
      ko: "askUser의 카드입니다. 보기만 그립니다. 자유 입력은 아래 작성창이 받으므로, 같은 뜻의 입력창이 패널에 둘 생기지 않습니다.",
    },
    {
      name: "AgentQueued",
      fallback: "DefaultQueued",
      en: "The message parked while a turn is still running, with the two ways out of it — take it back into the composer, or drop it.",
      ko: "턴이 도는 동안 대기 중인 메시지입니다. 빠져나오는 길 두 개를 함께 그립니다. 작성창으로 되찾아 오거나, 버리거나.",
    },
    {
      name: "AgentMenu",
      fallback: "DefaultAgentMenu",
      en: "The completion list under the composer — / commands and prompts, or the @ menu's reference rows. One component for both.",
      ko: "작성창 아래 완성 목록입니다. / 커맨드와 prompt, 또는 @ 메뉴의 reference 행. 둘 다 이 컴포넌트 하나입니다.",
    },
    {
      name: "AgentMarkdown",
      fallback: "DefaultMarkdown",
      en: "Assistant text. The framework's own renderer builds React elements and never dangerouslySetInnerHTML.",
      ko: "어시스턴트 텍스트입니다. 프레임워크 렌더러는 React 요소를 만들 뿐 dangerouslySetInnerHTML을 쓰지 않습니다.",
    },
    {
      name: "AgentCode",
      fallback: "DefaultCode",
      en: "A fenced block inside that text, and the seam a syntax highlighter binds to — lang carries the fence's info word.",
      ko: "그 텍스트 안의 코드 펜스이자, 신택스 하이라이터를 붙이는 이음매입니다. lang이 펜스의 언어 표시를 실어 나릅니다.",
    },
    {
      name: "AgentToolCard",
      fallback: "DefaultToolCard",
      en: "The frame around a card tool's own component. The frame draws its own dismiss even when the app's component does not.",
      ko: "card 툴이 그리는 앱 컴포넌트를 감싸는 틀입니다. 앱 컴포넌트가 닫기를 그리지 않아도 틀이 대신 그립니다.",
    },
  ];

  const commands = [
    {
      name: "/new · /clear",
      en: "Starts a new conversation. Works mid-turn and ahead of a question card, so it ends the turn it is clearing instead of being answered into it as text.",
      ko: "새 대화를 시작합니다. 턴 중에도, 질문 카드보다 앞서서도 동작하므로, 답변 텍스트로 삼켜지는 대신 비우려는 턴을 끝냅니다.",
    },
    {
      name: "/retry",
      en: "Sends the trailing user message again and leaves everything above it in place, so a prompt's own preamble is not sent twice.",
      ko: "마지막 user 메시지만 다시 보내고 그 위는 그대로 둡니다. prompt의 서두가 두 번 실려 가지 않습니다.",
    },
    {
      name: "/compact",
      en: "Summarizes the conversation on demand, keeping nothing verbatim — somebody asking for a summary is asking about the whole of it.",
      ko: "요청 시점에 대화를 요약하며, 원문은 하나도 남기지 않습니다. 요약을 부탁하는 사람은 대화 전체를 두고 묻는 것이니까요.",
    },
    {
      name: "/copy",
      en: "Puts the transcript on the clipboard as markdown, with the route and the timestamp. Local notes are left out — they are the chat talking to itself.",
      ko: "대화를 markdown으로 클립보드에 넣습니다. 라우트와 시각이 함께 붙습니다. local 노트는 빠집니다. 채팅이 혼잣말한 것이니까요.",
    },
    {
      name: "/help",
      en: "Lists the commands. Its output is a local message: rendered here, withheld from the wire.",
      ko: "커맨드 목록입니다. 출력은 local 메시지입니다. 여기에는 그려지고 와이어에는 실리지 않습니다.",
    },
    {
      name: "/tools",
      en: "Lists what this screen published, read off the session's own surface — so a zone chat lists its zone's view and nothing else.",
      ko: "이 화면이 발행한 것을 세션 자신의 surface에서 읽어 보여줍니다. zone 채팅은 그 zone의 뷰만 나열합니다.",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="one-turn" title={l.trans({ en: "Where A Turn Runs", ko: "턴은 어디서 도는가" })}>
        <Docs.Title>{l.trans({ en: "Where A Turn Runs", ko: "턴은 어디서 도는가" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You put a chat on the order screen, and a customer types “refund the last one”. A moment later the order is refunded. Now answer the question your security reviewer is going to ask first: which machine ran that refund, and what stopped the model from running it on somebody else's order?",
              ko: "주문 화면에 채팅을 올렸고, 고객이 “마지막 주문 환불해줘”라고 씁니다. 잠시 뒤 주문이 환불됩니다. 이제 보안 검토자가 가장 먼저 물을 질문에 답해야 합니다. 그 환불은 어느 기계에서 돌았고, 모델이 남의 주문에 그것을 하지 못하게 막은 것은 무엇입니까?",
            })}
          </div>
          <div>
            {l.trans({
              en: "The server ran nothing. runAgentTurn is a stateless relay: it forwards the transcript and the tool descriptions to the provider and hands back one answer. Every tool executes in the browser tab that asked, through the same handler the button beside it calls — so the call carries that user's own credential, passes the same guards any other call passes, and stops at the approval card in front of them.",
              ko: "서버는 아무것도 실행하지 않았습니다. runAgentTurn은 stateless 릴레이입니다. 대화와 툴 설명을 프로바이더에 전달하고 응답 하나를 돌려줄 뿐입니다. 모든 툴은 질문을 던진 바로 그 브라우저 탭에서, 옆에 있는 버튼이 부르는 것과 같은 핸들러로 실행됩니다. 그래서 호출은 그 사용자의 자격증명을 싣고, 다른 호출과 같은 guard를 지나며, 사용자 앞의 승인 카드에서 멈춥니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One turn, end to end", ko: "턴 하나의 처음과 끝" })}
            highlightNodes={["run"]}
            chart={`flowchart TB
  screen["Screen<br/>st.tool declarations · subscribed keys"] --> chat["Agent.Chat<br/>the transcript lives in this tab"]
  chat --> relay["POST runAgentTurn<br/>guarded by AgentRelayAccess"]
  relay --> llm["LLM provider<br/>named in option.setLlm"]
  llm --> calls["The tool calls the model asked for"]
  calls --> gate["Approval card<br/>confirm and guard"]
  gate --> run["The tool runs in this browser<br/>the handler the button calls"]
  run --> report["Change report<br/>what moved on screen"]
  report --> chat
  relay -.->|"holds no session, runs no tool"| nothing["Nothing is stored server-side"]`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  The relay fails closed. <code>AgentRelayAccess</code> refuses every caller until the app names a
                  policy — <code>option.setAgentAccess(SignedIn)</code> in <code>lib/option.ts</code>, the same guards
                  any other endpoint would name, ANDed when there are several. Boot is silent about it, so a chat that
                  answers <em>Access denied by guard: AgentRelayAccess</em> is an app that never named one, not a
                  misconfigured key.
                </span>
              ),
              ko: (
                <span>
                  릴레이는 닫히는 쪽으로 실패합니다. <code>AgentRelayAccess</code>는 앱이 정책을 지정하기 전까지 모든
                  호출자를 거절합니다. <code>lib/option.ts</code>의 <code>option.setAgentAccess(SignedIn)</code>이 그
                  지정이고, 다른 endpoint에 적는 것과 같은 guard이며 여러 개를 적으면 AND입니다. 부팅 로그는 이에 대해
                  아무 말도 하지 않으므로, <em>Access denied by guard: AgentRelayAccess</em>로 답하는 채팅은 키가 잘못된
                  앱이 아니라 정책을 한 번도 지정하지 않은 앱입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="mount" title={l.trans({ en: "Mounting The Chat", ko: "채팅 마운트하기" })}>
        <Docs.Title>{l.trans({ en: "Mounting The Chat", ko: "채팅 마운트하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Mount it once, in the layout that wraps every screen the agent should reach. Conditional mounting is not a substitute for closing it — unmounting aborts the session and throws the conversation away — so an app that opens the chat from its own control passes the controlled pair instead.",
              ko: "에이전트가 닿아야 할 모든 화면을 감싸는 레이아웃에 한 번만 마운트하세요. 조건부 마운트는 닫기의 대체재가 아닙니다. 언마운트는 세션을 중단시키고 대화를 버립니다. 그래서 자기 컨트롤로 채팅을 여는 앱은 controlled 쌍을 넘깁니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/(shop)/_layout.tsx"
            code={`import { usePage } from "@apps/koyo/client";
import { layout } from "akanjs/client";
import { Agent } from "akanjs/ui";

export default layout().render(({ children }) => {
  const { l } = usePage();
  return (
    <>
      {children}
      <Agent.Chat
        title={l("koyo.assistant")}
        instructions="This is a Korean-style yogurt ice cream shop. An order moves draft -> paid -> served."
        intro={<p className="py-6 text-center text-foreground/50 text-sm">{l("koyo.assistantIntro")}</p>}
        persist
      />
    </>
  );
});`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  <code>instructions</code> is read by the model, so it is English — always, whatever language the shop
                  sells in. The same rule covers every <code>.desc()</code> and every <code>Agent.Guide</code>;{" "}
                  <code>l()</code> is for the strings a <em>person</em> reads, which is why <code>title</code> and{" "}
                  <code>intro</code> go through it and <code>instructions</code> does not.
                </span>
              ),
              ko: (
                <span>
                  <code>instructions</code>는 모델이 읽으므로 가게가 어느 언어로 장사하든 영어입니다. 모든{" "}
                  <code>.desc()</code>와 <code>Agent.Guide</code>도 같은 규칙입니다. <code>l()</code>은 <em>사람</em>이
                  읽는 문자열의 것이고, 그래서 <code>title</code>과 <code>intro</code>는 그것을 거치고{" "}
                  <code>instructions</code>는 거치지 않습니다.
                </span>
              ),
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "open",
                type: "boolean",
                default: "—",
                desc: l.trans({
                  en: "Controlled open state. Pass it with onOpenChange to drive the panel from a header button or a menu item. Left off, the panel owns the state.",
                  ko: "controlled 열림 상태입니다. onOpenChange와 함께 넘기면 헤더 버튼이나 메뉴 항목이 패널을 엽니다. 넘기지 않으면 패널이 스스로 관리합니다.",
                }),
              },
              {
                key: "onOpenChange",
                type: "(open: boolean) => void",
                default: "—",
                desc: l.trans({
                  en: "Left off while open is controlled, the panel cannot close itself — so it draws no close button rather than an inert one.",
                  ko: "open만 주고 이것을 주지 않으면 패널은 스스로 닫을 수 없으므로, 동작하지 않는 버튼 대신 닫기 버튼을 아예 그리지 않습니다.",
                }),
              },
              {
                key: "launcher",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "false draws no floating button, for an app whose shell already has an entry point.",
                  ko: "false면 떠 있는 버튼을 그리지 않습니다. 이미 자기 진입점을 가진 셸을 위한 것입니다.",
                }),
              },
              {
                key: "intro",
                type: "ReactNode",
                default: "—",
                desc: l.trans({
                  en: "Stands in for the empty-state line while the transcript is empty. Where starter questions go.",
                  ko: "대화가 비어 있는 동안 기본 안내 문구 자리에 들어갑니다. 예시 질문을 두는 자리입니다.",
                }),
              },
              {
                key: "header",
                type: "ReactNode",
                default: "—",
                desc: l.trans({
                  en: "Extra controls in the header bar, left of the built-in clear and close buttons.",
                  ko: "헤더 바에 컨트롤을 더합니다. 기본 제공되는 비우기·닫기 버튼 왼쪽입니다.",
                }),
              },
              {
                key: "chrome",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "false draws no header bar at all — for an inline chat inside a panel the app already titles. The header prop goes with it, and clearing stays reachable as /new.",
                  ko: "false면 헤더 바 자체를 그리지 않습니다. 앱이 이미 제목을 붙인 패널 안의 inline 채팅용입니다. header prop도 함께 사라지고, 비우기는 /new로 남습니다.",
                }),
              },
              {
                key: "defaultDraft",
                type: "string",
                default: '""',
                desc: l.trans({
                  en: "The composer's opening text, read once at mount — where a ?prompt= search value lands without being sent.",
                  ko: "마운트 시 한 번 읽는 작성창 초기 텍스트입니다. ?prompt= 검색값이 전송되지 않은 채 들어오는 자리입니다.",
                }),
              },
              {
                key: "inline",
                type: "boolean",
                default: "false",
                desc: l.trans({
                  en: "Renders in the page flow instead of floating above it — a zone chat that lives inside its own section.",
                  ko: "떠 있는 대신 페이지 흐름 안에 그립니다. 자기 구획 안에 사는 zone 채팅입니다.",
                }),
              },
              {
                key: "shortcut",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "Cmd+L on Apple platforms, Ctrl+L elsewhere. false gives the browser its own location-bar chord back.",
                  ko: "Apple 플랫폼은 Cmd+L, 그 외는 Ctrl+L입니다. false면 브라우저 주소창 단축키를 돌려줍니다.",
                }),
              },
              {
                key: "panelClassName",
                type: "string",
                default: "—",
                desc: l.trans({
                  en: "One surface each, where className reaches both: launcherClassName is the closed button, panelClassName the open panel.",
                  ko: "className이 둘 다에 닿는 자리에서, 각각 한 면씩입니다. launcherClassName은 닫힌 버튼, panelClassName은 열린 패널입니다.",
                }),
              },
              {
                key: "builtins",
                type: "boolean | AgentBuiltin[]",
                default: "true",
                desc: l.trans({
                  en: "Which of the runtime's own tools this chat's agent gets. Withheld, not discouraged — a withheld name answers the same unknown-tool error a name that was never registered gets.",
                  ko: "런타임이 기본 제공하는 툴 중 이 채팅의 에이전트가 무엇을 받을지입니다. 권하지 않는 것이 아니라 아예 빼는 것이라, 뺀 이름은 등록된 적 없는 이름과 같은 unknown tool 오류로 답합니다.",
                }),
              },
              {
                key: "persist",
                type: "PersistOption | SessionHistory",
                default: "—",
                desc: l.trans({
                  en: "Keeps the transcript across reloads. See the last slide.",
                  ko: "새로고침을 넘겨 대화를 보존합니다. 마지막 슬라이드에서 다룹니다.",
                }),
              },
            ]}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "The five built-ins, and only five:", ko: "빌트인은 다섯 개, 딱 다섯 개:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: 'navigate and goBack drive the router. builtins={["readScreen", "readState", "highlight"]} is how a chat that must not leave the screen stops being able to.',
                  ko: 'navigate와 goBack이 라우터를 움직입니다. 화면을 떠나면 안 되는 채팅은 builtins={["readScreen", "readState", "highlight"]}로 떠날 수 없게 만듭니다.',
                })}
              </li>
              <li>
                {l.trans({
                  en: "readScreen, readState and highlight look and point. A tool the screen declared under one of these names is the screen's, not the runtime's, so withholding a built-in never withholds a tool a component published on purpose.",
                  ko: "readScreen·readState·highlight는 보고 가리킵니다. 화면이 같은 이름으로 선언한 툴은 런타임의 것이 아니라 화면의 것이므로, 빌트인을 빼도 컴포넌트가 일부러 발행한 툴은 빠지지 않습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "There is no general wait. One was built and removed: a tool reachable on every screen with no idea what any key means gets spent on whatever key looks promising, parking turns nobody asked to park. Declare a waiting tool beside the control that starts the work instead.",
                  ko: "범용 대기 툴은 없습니다. 만들었다가 제거했습니다. 모든 화면에서 닿으면서 어떤 키가 무슨 뜻인지는 모르는 툴은 그럴듯해 보이는 키에 아무렇게나 쓰이고, 아무도 부탁하지 않은 대기로 턴을 세워 둡니다. 대신 그 작업을 시작하는 컨트롤 옆에 기다리는 툴을 직접 선언하세요.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="slots" title={l.trans({ en: "Every Part Is A Slot", ko: "모든 부분이 슬롯" })}>
        <Docs.Title>{l.trans({ en: "Every Part Is A Slot", ko: "모든 부분이 슬롯" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A brand rarely wants the framework's bubble and always wants the framework's approval gate. So the chat is not one component to replace: twelve slots bind in a page/**/_overrides.tsx manifest and cascade down the route tree like layouts, and eleven of them export the default beside them so a replacement composes the one it is replacing.",
              ko: "브랜드가 프레임워크의 말풍선을 그대로 쓰고 싶은 경우는 드물고, 프레임워크의 승인 관문을 직접 다시 만들고 싶은 경우는 없습니다. 그래서 채팅은 통째로 교체하는 컴포넌트가 아닙니다. 슬롯 열두 개가 page/**/_overrides.tsx 매니페스트에 묶이고 레이아웃처럼 라우트 트리를 따라 내려오며, 그중 열한 개는 기본 구현을 함께 내보내므로 교체본이 원본을 겹쳐 쓸 수 있습니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Slot", ko: "슬롯" })}
            items={slots.map(({ name, fallback, en, ko }) => ({
              name,
              desc: l.trans({
                en: (
                  <span>
                    <code>{fallback}</code> — {en}
                  </span>
                ),
                ko: (
                  <span>
                    <code>{fallback}</code> — {ko}
                  </span>
                ),
              }),
            }))}
          />
          <div>
            {l.trans({
              en: "AgentSteps is the one that is not a re-skin. A turn — everything the agent said and did between one user message and the next — is the grain a chat needs to fold its steps into a details and stand the final answer outside them, and it is the one boundary no per-message slot can see, because neither message on either side of it knows it is at an edge.",
              ko: "AgentSteps만은 껍데기 교체가 아닙니다. 턴, 즉 user 메시지 하나와 다음 하나 사이에 에이전트가 말하고 행한 전부는 채팅이 단계들을 details로 접고 최종 답변만 밖에 세우기 위해 필요한 단위이며, 메시지 단위 슬롯으로는 볼 수 없는 유일한 경계입니다. 경계 양쪽의 메시지 중 어느 쪽도 자기가 끝에 있다는 것을 모르기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/ui/KoyoTurn.tsx"
            code={`"use client";
import { DefaultSteps, type StepsProps } from "akanjs/ui";

export const KoyoTurn = ({ messages, isRunning, progress, results }: StepsProps) => {
  const answer = messages.at(-1);
  const steps = isRunning ? messages : messages.slice(0, -1);
  return (
    <div className="flex flex-col gap-1">
      <details open={isRunning}>
        <summary className="cursor-pointer text-foreground/50 text-xs">
          {isRunning ? "working…" : \`\${steps.length} steps\`}
        </summary>
        <DefaultSteps isRunning={isRunning} messages={steps} progress={progress} results={results} />
      </details>
      {isRunning || !answer ? null : <DefaultSteps isRunning={false} messages={[answer]} results={results} />}
    </div>
  );
};`}
          />
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/(shop)/_overrides.tsx"
            code={`import { KoyoBubble, KoyoTurn } from "@apps/koyo/ui";
import { override } from "akanjs/ui";

export default override({ AgentBubble: KoyoBubble, AgentSteps: KoyoTurn });`}
          />
          <div>
            {l.trans({
              en: "Two things the slot list is deliberate about:",
              ko: "슬롯 목록이 일부러 이렇게 되어 있는 지점이 둘 있습니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🧠</span>
              <div>
                <strong>isRunning</strong>:{" "}
                {l.trans({
                  en: "only ever true of the last turn of a transcript the session is working on. Without it the same messages read the same whether the agent is mid-step or finished, and a scaffold cannot tell a live progress line from a completed turn's header.",
                  ko: "세션이 작업 중인 대화의 마지막 턴에서만 true입니다. 이것이 없으면 같은 메시지가 진행 중인지 끝났는지 구분되지 않고, 접는 UI는 살아 있는 진행 줄과 완료된 턴의 머리글을 구별할 수 없습니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🧩</span>
              <div>
                <strong>{l.trans({ en: "The default adds nothing", ko: "기본 구현은 아무것도 더하지 않음" })}</strong>:{" "}
                {l.trans({
                  en: "DefaultSteps draws the same flat bubbles into a Fragment rather than a box, so it takes no className and no existing layout can tell the component is between the transcript and its bubbles.",
                  ko: "DefaultSteps는 박스가 아니라 Fragment에 같은 말풍선을 평평하게 그리므로 className을 받지 않고, 기존 레이아웃은 이 컴포넌트가 대화와 말풍선 사이에 끼었는지 알 수 없습니다.",
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="card" title={l.trans({ en: "A Tool The User Answers", ko: "사용자가 답하는 툴" })}>
        <Docs.Title>{l.trans({ en: "A Tool The User Answers", ko: "사용자가 답하는 툴" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Some arguments are not the model's to supply. A delivery address, a phone number, a date somebody has to look up — a model that fills those in has answered its own question, and no amount of prompting reliably stops it. So a tool chain has a second ending: .card() parks the call in the chat and renders the app's own form there.",
              ko: "어떤 인자는 모델이 채울 것이 아닙니다. 배달 주소, 전화번호, 누군가 확인해 봐야 아는 날짜 — 모델이 이런 것을 채우면 자기 질문에 자기가 답한 셈이고, 프롬프트로는 그것을 안정적으로 막지 못합니다. 그래서 툴 체인에는 두 번째 끝이 있습니다. .card()는 호출을 채팅에 세워 두고 앱의 폼을 그 자리에 그립니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx"
            code={`"use client";
import { IcecreamOrder, st, usePage } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { Button } from "akanjs/ui";

interface DeliveryProps {
  className?: string;
  icecreamOrderId: string;
}

export const Delivery = ({ className, icecreamOrderId }: DeliveryProps) => {
  const { l } = usePage();
  const address = st.use.deliveryAddress();
  st.tool("collectDeliveryAddress")
    .desc("Ask the customer for the address this order goes to. Never write an address the customer did not give.")
    .arg("icecreamOrderId", ID)
    .card(({ submit, cancel }, orderId) => (
      <IcecreamOrder.Template.Address
        icecreamOrderId={orderId}
        onCancel={() => cancel("the customer closed the address form")}
        onSubmit={submit}
      />
    ));
  const deliver = st.tool("deliverIcecreamOrder")
    .desc("Deliver this order to the address already on it.")
    .exec(() => st.do.deliverIcecreamOrder(icecreamOrderId));
  return (
    <div className={className}>
      <Button disabled={!address} onClick={deliver}>
        {l("icecreamOrder.deliverIcecreamOrder")}
      </Button>
    </div>
  );
};`}
          />
          <div>
            {l.trans({
              en: "Four things separate a card from an exec, and each of them is a decision rather than a detail:",
              ko: "card와 exec을 가르는 것이 넷 있고, 각각은 세부 사항이 아니라 결정입니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📝</span>
                <strong className="text-primary">{"submit(value)"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "What the form submits is the call's result — what the model reads back. cancel(reason) is the error it reads instead, so a dismissed card is something the agent can respond to rather than a silent empty answer.",
                  ko: "폼이 제출한 값이 곧 호출의 결과이고, 모델이 읽는 것입니다. cancel(reason)은 그 자리에 들어가는 오류이므로, 닫힌 카드는 조용한 빈 답이 아니라 에이전트가 반응할 수 있는 것이 됩니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🚦</span>
                <strong className="text-primary">
                  {l.trans({ en: "Arguments are checked first", ko: "인자는 먼저 검사됩니다" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Before the card is parked, never while it renders. A bad argument has to reach the model as a refusal it can correct; a throw inside your component would take the chat panel down with it.",
                  ko: "카드를 세우기 전에 검사하고, 렌더 중에는 하지 않습니다. 잘못된 인자는 모델이 고칠 수 있는 거절로 닿아야 합니다. 여러분의 컴포넌트 안에서 던진 예외는 채팅 패널까지 함께 무너뜨립니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🔓</span>
                <strong className="text-primary">
                  {l.trans({ en: "It waits outside the tool queue", ko: "툴 큐 밖에서 기다립니다" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A form parked in front of somebody is not work. Holding the execution lock across it would freeze every other agent on the page behind one unanswered card.",
                  ko: "사람 앞에 세워 둔 폼은 작업이 아닙니다. 그 동안 실행 락을 쥐고 있으면 답하지 않은 카드 하나 뒤에 페이지의 다른 모든 에이전트가 멈춰 섭니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🙅</span>
                <strong className="text-primary">{"confirm"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Not read for a card at all — the card in front of the user is already the asking. The frame draws its own dismiss even when your component does not, so a turn can never park on something the user cannot get out of.",
                  ko: "card에서는 아예 읽지 않습니다. 사용자 앞의 카드가 이미 묻는 행위이기 때문입니다. 여러분의 컴포넌트가 닫기를 그리지 않아도 틀이 대신 그리므로, 사용자가 빠져나올 수 없는 것 위에 턴이 세워지는 일은 없습니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "The screen is still snapshotted around the wait, so a card that writes what it collected into the store reports what moved like any other call.",
              ko: "기다리는 동안에도 화면은 앞뒤로 스냅샷됩니다. 그래서 수집한 값을 스토어에 쓰는 카드는 다른 호출과 똑같이 무엇이 움직였는지 보고합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="reference" title={l.trans({ en: "Pointing At Data", ko: "데이터를 가리키기" })}>
        <Docs.Title>{l.trans({ en: "Pointing At Data", ko: "데이터를 가리키기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "“Why was this one refunded?” is only answerable if the chat knows which one. Typing an id is not it, and letting the agent search for the order the user is already looking at spends a turn on a lookup they could have pointed at. The composer's @ menu is that pointer, and which documents it may offer is the app's answer, not the framework's — so a ReferenceSource brings its own query.",
              ko: "“이건 왜 환불됐어요?”는 그 이건이 무엇인지 채팅이 알아야 답할 수 있습니다. id를 타이핑하는 것은 답이 아니고, 사용자가 이미 보고 있는 주문을 에이전트가 검색하게 두는 것은 가리키기만 하면 될 일에 턴 하나를 쓰는 것입니다. 작성창의 @ 메뉴가 그 가리키기이고, 어떤 문서를 내어줄지는 프레임워크가 아니라 앱이 답할 문제입니다. 그래서 ReferenceSource는 자기 쿼리를 들고 옵니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/ui/KoyoAgentChat.tsx"
            code={`"use client";
import { cnst, fetch } from "@apps/koyo/client";
import { Agent } from "akanjs/ui";

export const KoyoAgentChat = () => (
  <Agent.Chat
    persist
    reference={[
      {
        refName: "icecreamOrder",
        label: "Order",
        type: cnst.IcecreamOrder,
        search: async (query, signal) => {
          const orders = await fetch.listIcecreamOrderBySearch(query);
          if (signal.aborted) return [];
          return orders.map((order) => ({ refId: order.id, label: order.code, description: order.status }));
        },
        resolve: async (refId) => (await fetch.viewIcecreamOrder(refId)).icecreamOrder,
      },
    ]}
  />
);`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  <code>type</code> is the whole decision about what leaves the browser, in <code>st.expose</code>'s
                  vocabulary: the value is masked by the model class you name, so its <code>hidden</code>,{" "}
                  <code>secret</code> and <code>visual</code> fields never travel. Name the class that actually carries
                  the fields somebody points at — a <code>Light</code> class usually is not it, and a reference masked
                  by one arrives without the field that was the reason for pointing.
                </span>
              ),
              ko: (
                <span>
                  <code>type</code>이 브라우저 밖으로 무엇이 나가는지를 전부 정하며, 어휘는 <code>st.expose</code>와
                  같습니다. 값은 여러분이 지목한 모델 클래스로 마스킹되므로 그 모델의 <code>hidden</code>·
                  <code>secret</code>·<code>visual</code> 필드는 절대 나가지 않습니다. 누군가 가리키는 필드를 실제로
                  담고 있는 클래스를 지목하세요. <code>Light</code> 클래스는 대개 그것이 아니고, 그것으로 마스킹된
                  reference는 가리킨 이유였던 필드 없이 도착합니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "A field inside a document is the other entry point. The component drawing it already holds the value, so useAgentReference() hands that over with no round trip — and it is the only thing that knows a rich-text field stored as field(Any) reads as a paragraph rather than as the editor document it is stored as.",
              ko: "문서 안의 필드 하나는 다른 진입점입니다. 그것을 그리는 컴포넌트가 이미 값을 쥐고 있으므로 useAgentReference()는 왕복 없이 그대로 건넵니다. 그리고 field(Any)로 저장된 리치 텍스트가 에디터 문서가 아니라 한 문단의 산문으로 읽힌다는 사실을 아는 것은 그 컴포넌트뿐입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Util.tsx"
            code={`"use client";
import { usePage } from "@apps/koyo/client";
import { Button, useAgentReference } from "akanjs/ui";

interface ReferMemoProps {
  className?: string;
  icecreamOrderId: string;
  code: string;
  memo: string;
}

export const ReferMemo = ({ className, icecreamOrderId, code, memo }: ReferMemoProps) => {
  const { l } = usePage();
  const refer = useAgentReference();
  return (
    <Button
      className={className}
      onClick={() =>
        refer({
          refName: "icecreamOrder",
          refId: icecreamOrderId,
          label: code,
          path: "memo",
          type: String,
          value: memo,
        })
      }
      size="xs"
      variant="ghost"
    >
      {l("icecreamOrder.referMemo")}
    </Button>
  );
};`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A reference is a <strong>snapshot</strong>, and it is capped at <strong>20,000 characters</strong> —
                  past that the JSON is clipped mid-structure and a note tells the model so. Unlike a tool result, which
                  answers one turn, a reference rides <em>every</em> turn after the message that carried it, and it is
                  the last thing compaction folds. The token in the draft is what carries it: deleting the token by hand
                  drops the reference exactly as removing the chip does, and a token pasted out of an earlier message
                  travels as a pointer with no value at all.
                </span>
              ),
              ko: (
                <span>
                  reference는 <strong>스냅샷</strong>이고 <strong>20,000자</strong>에서 잘립니다. 그 너머는 JSON이 구조
                  중간에서 끊기며, 그렇게 됐다는 사실을 모델에게 알려주는 note가 붙습니다. 한 턴에 답하고 마는 툴 결과와
                  달리 reference는 그것을 실은 메시지 이후 <em>모든</em> 턴에 함께 실리고, 압축이 가장 마지막에 접는
                  대상입니다. 그것을 실어 나르는 것은 작성창의 토큰입니다. 토큰을 직접 지우면 chip을 지운 것과 똑같이
                  reference가 빠지고, 이전 메시지에서 복사해 붙인 토큰은 값 없는 포인터로만 갑니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: (
                <span>
                  Where sources are declared, the composer draws each pointer as the name it points at rather than as
                  the raw <code>@[label](mention:…)</code> token, in a Lexical editor loaded as its own chunk.{" "}
                  <code>mentions={"{false}"}</code> keeps the plain textarea — for an app that overrides the composer,
                  or one that would rather see the tokens it is sending. The draft string is identical either way.
                </span>
              ),
              ko: (
                <span>
                  source를 선언한 곳에서는 작성창이 각 포인터를 원시 <code>@[label](mention:…)</code> 토큰이 아니라
                  가리키는 대상의 이름으로 그립니다. 별도 청크로 로드되는 Lexical 에디터가 그 일을 합니다.{" "}
                  <code>mentions={"{false}"}</code>는 평범한 textarea를 유지합니다. 작성창을 override한 앱이나, 보내는
                  토큰을 그대로 보고 싶은 앱을 위한 것입니다. draft 문자열은 어느 쪽이든 동일합니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="queue" title={l.trans({ en: "The Queue And The Slash Menu", ko: "대기열과 슬래시 메뉴" })}>
        <Docs.Title>{l.trans({ en: "The Queue And The Slash Menu", ko: "대기열과 슬래시 메뉴" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A turn takes seconds, and a user who thinks of the next thing halfway through should not have to wait to type it. Enter during a turn parks the message and sends it the moment the turn ends. There is one slot: a second send joins the first on a new line, so the model is handed one user message rather than two.",
              ko: "턴 하나는 몇 초가 걸리고, 그 중간에 다음 할 말이 떠오른 사용자가 입력을 기다려야 할 이유는 없습니다. 턴 중의 Enter는 메시지를 세워 두었다가 턴이 끝나는 순간 보냅니다. 자리는 하나입니다. 두 번째로 보낸 것은 첫 번째 아래 줄에 붙으므로, 모델은 메시지 두 개가 아니라 하나를 받습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "It is shown rather than silently held, on the AgentQueued card above the composer. A send that vanished from the composer and has not appeared in the transcript reads as lost, and taking it back or dropping it needs somewhere to click. Stop hands a parked message back to the composer rather than opening the next turn with it — Stop means stop.",
              ko: "조용히 들고 있지 않고 작성창 위 AgentQueued 카드에 보여줍니다. 작성창에서는 사라졌는데 대화에는 나타나지 않은 전송은 잃어버린 것처럼 읽히고, 되찾거나 버리려면 누를 곳이 있어야 합니다. Stop은 세워 둔 메시지로 다음 턴을 열지 않고 작성창으로 돌려줍니다. Stop은 멈추라는 뜻입니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Command", ko: "커맨드" })}
            items={commands.map(({ name, en, ko }) => ({ name, desc: l.trans({ en, ko }) }))}
          />
          <div>
            {l.trans({
              en: "These six are the whole / menu, beside whatever page().prompt() declarations the app publishes. An app writes none of them and cannot add one: the extension point for a product's own command is a prompt, which is guarded and server-side. A built-in wins a name collision, deliberately — a component's st.tool may shadow a built-in it means to replace, but no library's prompt may take /new away from the user who typed it.",
              ko: "이 여섯이 / 메뉴의 전부이고, 옆에는 앱이 발행한 page().prompt() 선언들이 섭니다. 앱은 이 중 아무것도 작성하지 않으며 추가할 수도 없습니다. 제품 고유의 커맨드를 위한 확장점은 prompt이고, 그것은 guard가 걸린 서버 쪽 선언입니다. 이름이 겹치면 빌트인이 이깁니다. 의도된 것입니다. 컴포넌트의 st.tool은 대체하려는 빌트인을 가릴 수 있지만, 어떤 라이브러리의 prompt도 /new를 입력한 사용자에게서 /new를 빼앗을 수는 없습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Three session calls behind the menu:", ko: "메뉴 뒤의 세션 호출 셋:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "session.note(text) writes a local message: rendered in the transcript, withheld from the wire. The transcript is the model's history, so /help text appended plainly would come back next turn as something the assistant believes it said.",
                  ko: "session.note(text)는 local 메시지를 씁니다. 대화에는 그려지고 와이어에는 실리지 않습니다. 대화가 곧 모델의 히스토리이므로, /help 출력을 그냥 붙이면 다음 턴에 어시스턴트가 자기가 한 말로 받아들입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "session.report(error) is where a host-side failure lands — a command that threw, a reference whose resolve never answered. Same local shape, read as an error.",
                  ko: "session.report(error)는 호스트 쪽 실패가 떨어지는 자리입니다. 예외를 던진 커맨드, 끝내 응답하지 않은 reference의 resolve 같은 것들입니다. 같은 local 형태이고 오류로 읽힙니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "session.retry() replays only the trailing user message and leaves everything above it in place. ↑ and ↓ in the composer walk what was sent, seeded from the transcript, and the half-written draft they were walked away from comes back at the bottom of the walk.",
                  ko: "session.retry()는 마지막 user 메시지만 다시 보내고 그 위는 그대로 둡니다. 작성창의 ↑·↓는 보낸 것들을 오가며, 시작점은 대화 자체입니다. 그리고 그러느라 밀려났던 쓰다 만 draft는 목록 끝에서 되돌아옵니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="transcript" title={l.trans({ en: "Keeping The Transcript", ko: "대화를 보관하기" })}>
        <Docs.Title>{l.trans({ en: "Keeping The Transcript", ko: "대화를 보관하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: 'The relay holds no session, so the conversation exists in one browser tab and nowhere else. persist is the one-word answer: sessionStorage by default, because surviving a refresh is the whole ask and a transcript that dies with the tab never lingers on a shared machine. { storage: "local" } is the explicit opt-up.',
              ko: '릴레이는 세션을 갖지 않으므로, 대화는 브라우저 탭 하나에만 있고 다른 어디에도 없습니다. persist가 한 단어짜리 답입니다. 기본은 sessionStorage인데, 새로고침을 견디는 것이 요구의 전부이고 탭과 함께 사라지는 대화는 공용 컴퓨터에 남지 않기 때문입니다. { storage: "local" }이 명시적인 확장입니다.',
            })}
          </div>
          <div>
            {l.trans({
              en: "Keeping it on a server is a SessionHistory — three functions — and a function cannot cross the RSC boundary as a prop, which would make every ancestor up to whoever builds the session a client component. So it mounts instead, as a leaf, in the shape Agent.Guide already uses.",
              ko: "서버에 보관하려면 함수 세 개짜리 SessionHistory가 필요한데, 함수는 prop으로 RSC 경계를 넘지 못합니다. 그러면 세션을 만드는 지점까지의 모든 조상이 클라이언트 컴포넌트가 됩니다. 그래서 prop 대신 Agent.Guide와 같은 모양의 잎 컴포넌트로 마운트합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx"
            code={`"use client";
import { fetch } from "@apps/koyo/client";
import { Agent } from "akanjs/ui";
import type { ReactNode } from "react";

interface DeskProps {
  className?: string;
  children: ReactNode;
}

export const Desk = ({ className, children }: DeskProps) => (
  <Agent.Zone className={className} id="orderDesk" instructions="Work the order desk." label="Order desk">
    <Agent.History
      clear={() => void fetch.clearIcecreamOrderChat()}
      load={async () => (await fetch.loadIcecreamOrderChat()).messages}
      save={(messages) => void fetch.saveIcecreamOrderChat(messages)}
    />
    {children}
    <Agent.Chat chrome={false} inline />
  </Agent.Zone>
);`}
          />
          <div>
            {l.trans({
              en: "Four rules the store follows whichever backing you pick:",
              ko: "어느 저장소를 고르든 보관이 따르는 규칙이 넷 있습니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">⏱️</span>
              <div>
                <strong>{l.trans({ en: "Restoring lands once", ko: "복원은 한 번만" })}</strong>:{" "}
                {l.trans({
                  en: "only while nothing has happened to the conversation yet. Mounting with the zone restores; mounting later saves from there on, and the store is never asked for a transcript that would be discarded.",
                  ko: "대화에 아직 아무 일도 없을 때만 복원합니다. zone과 함께 마운트하면 복원하고, 나중에 마운트하면 그때부터 저장만 합니다. 버려질 대화를 저장소에 요청하는 일은 없습니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📎</span>
              <div>
                <strong>{l.trans({ en: "Content never reaches storage", ko: "내용은 저장되지 않음" })}</strong>:{" "}
                {l.trans({
                  en: "an attachment keeps its name, type and url; a reference keeps its pointer and a note saying to read it again with a tool. Web storage is a few megabytes and one screenshot fills a chunk of it, so persisting the bytes would quietly stop persisting the transcript.",
                  ko: "첨부는 이름·타입·url만, reference는 포인터와 “툴로 다시 읽으라”는 note만 남습니다. 웹 스토리지는 몇 메가바이트뿐이고 스크린샷 하나가 그 상당 부분을 채우므로, 바이트까지 보관하면 대화 보관 자체가 조용히 멈춥니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✂️</span>
              <div>
                <strong>{l.trans({ en: "The cap is applied before repair", ko: "상한을 먼저, 복구를 나중에" })}</strong>
                :{" "}
                {l.trans({
                  en: "web storage keeps the newest 50 messages, and that window can start between a tool call and the result answering it — a transcript restored in that state is refused by the provider on its first turn, so the pairing is repaired after the cut rather than before it.",
                  ko: "웹 스토리지는 최근 50개를 남기는데, 그 구간이 툴 호출과 그 결과 사이에서 시작될 수 있습니다. 그 상태로 복원된 대화는 첫 턴부터 프로바이더가 거절하므로, 짝 맞추기는 자르기 이전이 아니라 이후에 수행합니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🧷</span>
              <div>
                <strong>onCompact</strong>:{" "}
                {l.trans({
                  en: "called after a compaction replaced messages with one summary — where a host with its own server-side summary moves its watermark.",
                  ko: "압축이 메시지들을 요약 하나로 바꾼 뒤 호출됩니다. 서버 쪽에 자체 요약을 두는 호스트가 기준점을 옮기는 자리입니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  What the chat can <em>do</em> on any of these screens is a separate subject: a component declares one
                  action with <code>st.tool</code> and makes one store key readable by reading it, and nothing is
                  derived from a store class.{" "}
                  <Link href="/docs/arch/agentic" className="text-primary">
                    In-Page Agent
                  </Link>{" "}
                  covers that surface, zones, and the LLM adaptors.
                </span>
              ),
              ko: (
                <span>
                  이 화면들에서 채팅이 무엇을 <em>할 수 있는지</em>는 별개의 주제입니다. 컴포넌트가 <code>st.tool</code>
                  로 액션 하나를 선언하고, 스토어 키는 읽는 것만으로 읽을 수 있게 되며, 스토어 클래스에서 유도되는 것은
                  아무것도 없습니다. 그 표면과 zone, LLM 어댑터는{" "}
                  <Link href="/docs/arch/agentic" className="text-primary">
                    인페이지 에이전트
                  </Link>
                  에 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
