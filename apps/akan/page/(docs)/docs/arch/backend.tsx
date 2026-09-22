import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide
        id="business-service-overview"
        title={l.trans({ en: "Business Service Architecture", ko: "비즈니스 서비스 아키텍처" })}
      >
        <Docs.Title>{l.trans({ en: "Business Service Architecture", ko: "비즈니스 서비스 아키텍처" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A customer taps Order on the kiosk, and that one button has to do four things: refuse the order when the mango has run out, write the order down, hand back a receipt now, and put the ticket on the kitchen screen before the customer turns away. None of that is drawing a screen.",
              ko: "고객이 키오스크에서 주문 버튼을 누르면, 그 버튼 하나가 네 가지 일을 해야 합니다. 망고가 떨어졌으면 주문을 거절하고, 주문을 기록하고, 지금 영수증을 돌려주고, 고객이 돌아서기 전에 주방 화면에 티켓을 띄우는 일입니다. 어느 것도 화면을 그리는 일이 아닙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "That work — the request action, the business rule, the background job it starts, and the change other screens must be told about — is the business service. Three files split it, and the split never changes. Traffic arrives at the API port, signal decides whether this caller may ask at all, service decides what should happen, and document owns how the record is stored and which state changes it will accept.",
              ko: "요청 액션, 비즈니스 규칙, 그 액션이 시작하는 백그라운드 작업, 다른 화면에 알려야 하는 변경 — 이 네 가지가 비즈니스 서비스입니다. 이 일을 파일 세 개가 나눠 갖고, 나누는 기준은 바뀌지 않습니다. 트래픽이 API 포트에 도착하고, signal이 이 호출자가 물어봐도 되는지 판단하고, service가 무엇이 일어나야 하는지 결정하며, document는 기록이 어떻게 저장되는지와 어떤 상태 전이를 허용할지를 소유합니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One module, right to left", ko: "모듈 하나, 오른쪽에서 왼쪽으로" })}
            highlightNodes={["service"]}
            chart={`flowchart LR
  caller["Browser · mobile app · agent"] --> api["API port<br/>8282/api"]
  api --> signal["icecreamOrder.signal.ts<br/>endpoint · slice · internal"]
  signal --> service["icecreamOrder.service.ts<br/>rules · other services · external APIs"]
  service --> document["icecreamOrder.document.ts<br/>schema · filters · chain methods"]
  document --> stored[("Stored data")]`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "The layers are not a formality. A rule written into the kiosk screen ships once per client and drifts; the same rule on the service is one answer for the kiosk, the admin console, the mobile app and an AI agent, because all four arrive through the same endpoint.",
              ko: "이 계층 분리는 형식이 아닙니다. 키오스크 화면에 적어 넣은 규칙은 클라이언트마다 한 벌씩 배포되고 서로 어긋나기 시작합니다. 같은 규칙을 service에 두면 키오스크, 관리자 콘솔, 모바일 앱, AI 에이전트에게 하나의 답이 됩니다. 넷 다 같은 endpoint로 들어오기 때문입니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="two-actions" title={l.trans({ en: "Two Actions, End To End", ko: "두 액션, 처음부터 끝까지" })}>
        <Docs.Title>{l.trans({ en: "Two Actions, End To End", ko: "두 액션, 처음부터 끝까지" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Start from the counter. Creating an order is generated CRUD, so no endpoint is written for it; what is written is the rule that an order takes stock out of today's inventory, and the mutation a staff member uses to move that order to the next status.",
              ko: "카운터에서 시작합니다. 주문 생성은 생성된 CRUD라 endpoint를 따로 쓰지 않습니다. 직접 쓰는 것은 주문이 오늘 재고를 차감한다는 규칙과, 직원이 그 주문을 다음 상태로 옮길 때 쓰는 mutation입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts"
            code={`import { Admin, Every } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, () => ({})) {}

export class IcecreamOrderSlice extends slice(
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: Every } },
  (init) => ({
    byStatuses: init()
      .search("statuses", [cnst.IcecreamOrderStatus])
      .exec(function (statuses) {
        return this.icecreamOrderService.queryByStatuses(statuses);
      }),
  }),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  processIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Admin] })
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.icecreamOrderService.processIcecreamOrder(icecreamOrderId);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "The endpoint is one line of delegation, because the decision is not its to make. The service is where the order meets a second module — inventory — and where the two documents are loaded before either is saved:",
              ko: "endpoint는 위임 한 줄입니다. 판단은 endpoint의 몫이 아니기 때문입니다. 주문이 두 번째 모듈인 inventory와 만나는 자리, 그리고 두 document를 모두 불러온 뒤에야 저장하는 자리가 service입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.service.ts"
            code={`import { serve } from "akanjs/service";

import * as db from "../db";
import type * as srv from "../srv";

export class IcecreamOrderService extends serve(db.icecreamOrder, ({ service }) => ({
  inventoryService: service<srv.InventoryService>(),
})) {
  override async _preCreate(data: db.IcecreamOrderInput) {
    await this.inventoryService.useStocks([
      { type: "yogurtIcecream", quantity: data.size },
      ...data.toppings.map((topping) => ({ type: topping, quantity: 1 })),
    ]);
    return data;
  }
  async processIcecreamOrder(icecreamOrderId: string) {
    const icecreamOrder = await this.getIcecreamOrder(icecreamOrderId);
    return await icecreamOrder.process().save();
  }
}`}
          />
          <div>
            {l.trans({
              en: "The manager's half is the mirror image: the same three files, a different guard, and no state machine — refilling today's inventory is allowed whenever an admin asks. Each layer keeps its own kind of decision:",
              ko: "관리자의 몫은 거울상입니다. 같은 파일 세 개, 다른 guard, 그리고 상태 기계가 없습니다. 오늘 재고 보충은 admin이 요청하면 언제든 허용되기 때문입니다. 각 계층은 자기 종류의 결정만 붙듭니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">☎️</span>
                <strong className="text-primary">signal</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The phone operator. Takes the call, refuses the ones that should never reach the floor, and hands valid work to the right service.",
                  ko: "전화 상담원입니다. 연락을 받고, 현장까지 가서는 안 될 요청을 돌려보내고, 유효한 일을 알맞은 service에 넘깁니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧑‍🍳</span>
                <strong className="text-primary">service</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The business owner. Stock rules, payment status, reservation conflicts and external APIs are combined here into one meaningful action.",
                  ko: "업무 담당자입니다. 재고 규칙, 결제 상태, 예약 충돌, 외부 API 연동이 여기서 하나의 의미 있는 액션으로 합쳐집니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🗄️</span>
                <strong className="text-primary">document</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The archive and its rulebook. The stored form, the query filters, and the state changes a record will accept. A chain method mutates and returns this; the caller saves.",
                  ko: "문서고와 그 처리 규칙입니다. 저장 형태, query filter, 그리고 레코드가 받아들일 상태 전이를 정합니다. chain method는 값을 바꾸고 this를 돌려주며, 저장은 호출한 쪽이 합니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "The rule of thumb is short: if the code answers a business question, it belongs in service logic. If it only draws a screen or holds temporary UI state, it stays on the UI side.",
              ko: "기준은 짧습니다. 코드가 비즈니스 질문에 답한다면 service 로직에 두고, 화면을 그리거나 임시 UI 상태만 다룬다면 UI 쪽에 둡니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="signal-shapes"
        title={l.trans({ en: "Endpoint, Slice, Internal", ko: "Endpoint, Slice, Internal" })}
      >
        <Docs.Title>{l.trans({ en: "Endpoint, Slice, Internal", ko: "Endpoint, Slice, Internal" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model's signal file exports exactly three classes, and every module declares all three even when two of them are empty. Which one you reach for is decided by who starts the call.",
              ko: "모델의 signal 파일은 클래스 셋을 내보내고, 둘이 비어 있더라도 모든 모듈이 셋을 모두 선언합니다. 어느 것을 쓸지는 누가 그 호출을 시작하느냐가 결정합니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Class", ko: "클래스" })}
            items={[
              {
                name: "endpoint",
                desc: l.trans({
                  en: (
                    <span>
                      Called by a user, through <code>fetch.*</code> — the actions you expose on the API surface.
                      Request-response work is <code>query</code> / <code>mutation</code>; an open connection is{" "}
                      <code>message</code> / <code>pubsub</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      사용자가 <code>fetch.*</code>로 호출합니다. API surface에 노출하는 액션입니다. 요청-응답 작업은{" "}
                      <code>query</code> / <code>mutation</code>이고, 열린 연결은 <code>message</code> /{" "}
                      <code>pubsub</code>입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "slice",
                desc: l.trans({
                  en: (
                    <span>
                      Called by a screen. The route calls <code>fetch.initXInY(...)</code>, <code>Load.Units</code> /{" "}
                      <code>Load.View</code> seed the store from the result, and the client reloads through{" "}
                      <code>st.do.initXInY()</code>. One slice binds guards, params, searches and a document filter into
                      one named view.
                    </span>
                  ),
                  ko: (
                    <span>
                      화면이 호출합니다. 라우트가 <code>fetch.initXInY(...)</code>를 부르면 <code>Load.Units</code> /{" "}
                      <code>Load.View</code>가 그 결과로 store를 채우고, 클라이언트는 <code>st.do.initXInY()</code>로
                      다시 불러옵니다. slice 하나가 guard, param, search, document filter를 이름 붙은 뷰 하나로
                      묶습니다.
                    </span>
                  ),
                }),
              },
              {
                name: "internal",
                desc: l.trans({
                  en: (
                    <span>
                      Called by the server itself — <code>cron</code>, <code>interval</code>, <code>timeout</code>,{" "}
                      <code>initialize</code>, <code>destroy</code> and queued <code>process</code> jobs. Never exposed
                      as a public action.
                    </span>
                  ),
                  ko: (
                    <span>
                      서버 자신이 호출합니다. <code>cron</code>, <code>interval</code>, <code>timeout</code>,{" "}
                      <code>initialize</code>, <code>destroy</code>와 queue에 들어가는 <code>process</code> 작업입니다.
                      공개 액션으로는 노출되지 않습니다.
                    </span>
                  ),
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "Start from the product behavior, not from the class list. Does the user need an answer now, a live conversation, a broadcast to many screens, or a job that finishes later?",
              ko: "클래스 목록이 아니라 제품 동작에서 시작하세요. 사용자가 지금 답을 받아야 하는지, 열린 연결로 대화해야 하는지, 여러 화면에 알려야 하는지, 나중에 끝나는 작업인지에 따라 고릅니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Signal shape choice", ko: "Signal 형태 선택" })}
            chart={`flowchart TB
  need["What does the screen need?"] --> now["Answer now"]
  need --> live["Keep talking while open"]
  need --> many["Notify many screens"]
  need --> later["Finish later"]
  now --> api["Use query or mutation"]
  live --> message["Use message"]
  many --> pubsub["Use pubsub"]
  later --> internal["Use process or schedule"]`}
          />
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">↩️</span>
              <div>
                <strong>query / mutation</strong>:{" "}
                {l.trans({
                  en: "the screen asks once and expects one result — load a list, save a form, approve a request, add stock.",
                  ko: "화면이 한 번 묻고 한 번의 결과를 기대합니다. 목록 불러오기, 폼 저장, 요청 승인, 재고 추가입니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">💬</span>
              <div>
                <strong>message</strong>:{" "}
                {l.trans({
                  en: "an open screen keeps a websocket conversation going — device control, a live operation panel, a guided workflow.",
                  ko: "열린 화면이 websocket 대화를 이어갑니다. 장비 제어, 실시간 운영 패널, 단계형 작업 흐름입니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📡</span>
              <div>
                <strong>pubsub</strong>:{" "}
                {l.trans({
                  en: "one business change is pushed into a room that many screens, dashboards, devices or users subscribe to.",
                  ko: "하나의 비즈니스 변경을 여러 화면, 대시보드, 장비, 사용자가 구독하는 room으로 밀어줍니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">⏱️</span>
              <div>
                <strong>process / cron / interval</strong>:{" "}
                {l.trans({
                  en: "the work is queued, scheduled, repeated, or tied to the server lifecycle rather than to a caller.",
                  ko: "작업이 queue에 들어가거나, 예약되거나, 반복되거나, 호출자가 아니라 서버 생명주기에 묶입니다.",
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-options" title={l.trans({ en: "Bounding A Call", ko: "호출에 경계 두기" })}>
        <Docs.Title>{l.trans({ en: "Bounding A Call", ko: "호출에 경계 두기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every endpoint takes an option object, and guards is only the first field in it. Here is the manager's half of the shift — a read the whole shop shares, and a write only an admin may make and that a stock provider can make slow.",
              ko: "모든 endpoint는 option 객체를 받고, guards는 그중 첫 번째 필드일 뿐입니다. 아래는 관리자의 몫입니다. 가게 전체가 공유하는 읽기 하나와, admin만 할 수 있고 재고 공급처 사정으로 느려질 수 있는 쓰기 하나입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/inventory/inventory.signal.ts"
            code={`import { Admin } from "@libs/shared/srvkit";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class InventoryInternal extends internal(srv.inventory, () => ({})) {}

export class InventorySlice extends slice(
  srv.inventory,
  { guards: { root: Admin, get: Public, cru: Admin } },
  (init) => ({
    inPublic: init().exec(function () {
      return this.inventoryService.queryAny();
    }),
  }),
) {}

export class InventoryEndpoint extends endpoint(srv.inventory, ({ query, mutation }) => ({
  getTodaysInventory: query(cnst.Inventory, { guards: [Public], cache: 1000 }).exec(async function () { // [!code highlight]
    return await this.inventoryService.getTodaysInventory();
  }),
  refillTodaysInventory: mutation(cnst.Inventory, { guards: [Admin], timeout: 60_000 }).exec(async function () { // [!code highlight]
    return await this.inventoryService.refillTodaysInventory();
  }),
})) {}`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "guards",
                type: "GuardCls[]",
                desc: l.trans({
                  en: (
                    <span>
                      Who may call this. An endpoint that names none runs zero checks — the loop iterates{" "}
                      <code>guards ?? []</code>, which is not a default policy.
                    </span>
                  ),
                  ko: (
                    <span>
                      누가 호출할 수 있는지입니다. 아무것도 적지 않은 endpoint는 검사를 하나도 하지 않습니다. 루프는{" "}
                      <code>guards ?? []</code>를 순회하고, 그것은 기본 정책이 아닙니다.
                    </span>
                  ),
                }),
              },
              {
                key: "timeout",
                type: "number",
                default: "30000 (client)",
                desc: l.trans({
                  en: (
                    <span>
                      Milliseconds this call may take. It bounds both ends: the <code>Timeout</code> middleware rejects
                      with <code>base.error.gatewayTimeout</code>, and the same value is serialized to the client as
                      that call&apos;s request budget.
                    </span>
                  ),
                  ko: (
                    <span>
                      이 호출이 쓸 수 있는 밀리초입니다. 양쪽 끝을 모두 묶습니다. <code>Timeout</code> middleware가{" "}
                      <code>base.error.gatewayTimeout</code>으로 거절하고, 같은 값이 클라이언트에 직렬화되어 그 호출의
                      요청 예산이 됩니다.
                    </span>
                  ),
                }),
              },
              {
                key: "cache",
                type: "number",
                desc: l.trans({
                  en: (
                    <span>
                      Milliseconds the answer may be reused. <strong>Only a query taking no internal argument</strong>{" "}
                      may carry one; anything else is named in the log and left uncached. Guards still run on every hit.
                    </span>
                  ),
                  ko: (
                    <span>
                      응답을 재사용할 수 있는 밀리초입니다. <strong>internal argument가 없는 query만</strong> 가질 수
                      있고, 나머지는 로그에 이름이 남은 채 캐시되지 않습니다. guard는 캐시 적중 시에도 매번 실행됩니다.
                    </span>
                  ),
                }),
              },
              {
                key: "mcp",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: (
                    <span>
                      Whether this endpoint belongs on an agent&apos;s shelf. <code>false</code> takes it out of the MCP
                      catalogue without touching its guards — curation, not authorization.
                    </span>
                  ),
                  ko: (
                    <span>
                      이 endpoint를 에이전트의 선반에 올릴지입니다. <code>false</code>는 guard를 건드리지 않고 MCP
                      카탈로그에서만 내립니다. 권한 부여가 아니라 큐레이션입니다.
                    </span>
                  ),
                }),
              },
              {
                key: "method",
                type: '"POST" | "PATCH" | "PUT" | "DELETE"',
                default: '"POST"',
                desc: l.trans({
                  en: (
                    <span>
                      The HTTP verb a <code>mutation</code> answers on. Reach for it only when a foreign wire protocol
                      forces the verb; two endpoints on the same path and verb fail the boot.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>mutation</code>이 응답할 HTTP verb입니다. 바꿀 수 없는 외부 와이어 프로토콜이 verb를 강제할
                      때만 씁니다. 같은 경로와 같은 verb를 주장하는 endpoint 둘은 부팅에 실패합니다.
                    </span>
                  ),
                }),
              },
            ]}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  An endpoint that declares no <code>timeout</code> still dies at <strong>30 seconds</strong> — that is
                  the client&apos;s own default, and the transport error it raises does not say whether the server ever
                  received the call. Provisioning, a firmware flow, an external orchestration: declare one.{" "}
                  <strong>Losing the race does not cancel the work</strong> — the handler runs to completion with nobody
                  holding its result, so a deadline is an answer to the caller, not an undo.
                </span>
              ),
              ko: (
                <span>
                  <code>timeout</code>을 적지 않은 endpoint도 <strong>30초</strong>에 끊깁니다. 클라이언트 자체
                  기본값이고, 그때 나는 전송 에러는 서버가 호출을 받기라도 했는지 말해주지 않습니다. 프로비저닝, 펌웨어
                  절차, 외부 오케스트레이션이라면 직접 적으세요.{" "}
                  <strong>경주에서 져도 작업은 취소되지 않습니다.</strong> handler는 결과를 받을 사람 없이 끝까지
                  돌아갑니다. 마감 시한은 호출자에게 주는 답이지 되돌리기가 아닙니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="beyond-the-request"
        title={l.trans({ en: "Work That Outlives The Request", ko: "요청보다 오래 사는 작업" })}
      >
        <Docs.Title>{l.trans({ en: "Work That Outlives The Request", ko: "요청보다 오래 사는 작업" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Some work has no caller waiting for it. Served ice cream melts on its own schedule, and orders nobody collected have to be closed out overnight. Both are internal signals, and the batch replica is what runs them — while the pubsub room below is an endpoint nobody calls, because the server is what publishes into it.",
              ko: "호출자가 기다리지 않는 작업도 있습니다. 내어준 아이스크림은 자기 일정대로 녹고, 아무도 찾아가지 않은 주문은 밤사이 정리해야 합니다. 둘 다 internal signal이고, 이를 실제로 돌리는 것은 batch replica입니다. 아래의 pubsub room은 아무도 호출하지 않는 endpoint입니다. 그곳에 publish하는 것은 서버이기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts"
            code={`import { Admin, Every } from "@libs/shared/srvkit"; // [!code collapse:6]
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, ({ cron, interval }) => ({
  warnIcecreamMeltingAll: interval(10000).exec(async function () { // [!code ++:6]
    await this.icecreamOrderService.warnIcecreamMeltingAll();
  }),
  cancelStaleOrders: cron("0 4 * * *", { serverMode: "batch", operationMode: ["cloud"] }).exec(async function () {
    await this.icecreamOrderService.cancelStaleOrders();
  }),
})) {}

export class IcecreamOrderSlice extends slice( // [!code collapse:11]
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: Every } },
  (init) => ({
    byStatuses: init()
      .search("statuses", [cnst.IcecreamOrderStatus])
      .exec(function (statuses) {
        return this.icecreamOrderService.queryByStatuses(statuses);
      }),
  }),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation, pubsub }) => ({
  processIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Admin] }) // [!code collapse:5]
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.icecreamOrderService.processIcecreamOrder(icecreamOrderId);
    }),
  icecreamOrderEntered: pubsub(cnst.LightIcecreamOrder, { guards: [Admin] }) // [!code ++:3]
    .room("status", cnst.IcecreamOrderStatus)
    .exec(() => undefined),
})) {}`}
          />
          <div>
            {l.trans({
              en: "A kitchen screen is already open when an order moves to processing, and nobody is going to press refresh. The service reaches its own signal through an injected field and publishes the saved order into the room named by its new status, so every screen subscribed to that status appends the ticket:",
              ko: "주문이 processing으로 넘어갈 때 주방 화면은 이미 열려 있고, 아무도 새로고침을 누르지 않습니다. service는 주입받은 필드로 자기 signal에 닿아, 저장된 주문을 새 상태 이름의 room으로 publish합니다. 그 상태를 구독하는 화면마다 티켓이 덧붙습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.service.ts"
            code={`import { serve } from "akanjs/service"; // [!code collapse:5]

import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class IcecreamOrderService extends serve(db.icecreamOrder, ({ service, signal }) => ({
  inventoryService: service<srv.InventoryService>(),
  icecreamOrderSignal: signal<sig.IcecreamOrder>(), // [!code ++]
})) {
  async processIcecreamOrder(icecreamOrderId: string) {
    const icecreamOrder = await this.getIcecreamOrder(icecreamOrderId);
    const processed = await icecreamOrder.process().save(); // [!code ++:3]
    await this.icecreamOrderSignal.icecreamOrderEntered(processed.status, processed);
    return processed;
  }
}`}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "A heavy job uses all three at once:", ko: "무거운 작업은 셋을 한꺼번에 씁니다:" })}
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "A mutation starts the monthly settlement report and returns the queued record immediately.",
                  ko: "mutation이 월간 정산 리포트를 시작하고, queue에 올라간 레코드를 즉시 돌려줍니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "An internal process, reached from the service through an injected signal, builds the file.",
                  ko: "주입된 signal을 통해 service가 부르는 internal process가 파일을 만듭니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A slice lets the screen read progress, status, and the download result as the record changes.",
                  ko: "slice는 레코드가 바뀌는 동안 화면이 진행률, 상태, 다운로드 결과를 읽게 합니다.",
                })}
              </li>
            </ol>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="service-dependencies"
        title={l.trans({ en: "What A Service Is Handed", ko: "Service가 건네받는 것" })}
      >
        <Docs.Title>{l.trans({ en: "What A Service Is Handed", ko: "Service가 건네받는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service never constructs the things it needs. It declares them in the builder argument of serve(), and the container resolves each one before any handler runs — which is what lets a payment provider, a cache backend or a whole sibling module be swapped without editing the business method that uses it.",
              ko: "service는 필요한 것을 직접 만들지 않습니다. serve()의 builder 인자에 선언하면, handler가 하나라도 돌기 전에 컨테이너가 전부 해결합니다. 덕분에 결제 제공자, 캐시 백엔드, 옆 모듈 전체를 그것을 쓰는 업무 method를 고치지 않고 교체할 수 있습니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "service",
                type: "<T extends Service>() => T",
                desc: l.trans({
                  en: (
                    <span>
                      Another module&apos;s service. The field name must end in <code>Service</code> — the injector
                      strips the suffix to derive the registry key, so <code>inventoryService</code> resolves{" "}
                      <code>inventory</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      다른 모듈의 service입니다. 필드 이름은 반드시 <code>Service</code>로 끝나야 합니다. 주입기가
                      접미사를 떼어 레지스트리 키를 만들기 때문에 <code>inventoryService</code>는 <code>inventory</code>
                      로 풀립니다.
                    </span>
                  ),
                }),
                example: "inventoryService: service<srv.InventoryService>()",
              },
              {
                key: "plug",
                type: "(adaptor: AdaptorCls) => Adaptor",
                desc: l.trans({
                  en: (
                    <span>
                      An adaptor singleton — an <code>adapt()</code> class directly, or a role such as{" "}
                      <code>StorageAdaptorRole</code>. Which implementation a role resolves to is decided once by{" "}
                      <code>option.applyAdaptor(role, TheClass)</code>, not here.
                    </span>
                  ),
                  ko: (
                    <span>
                      adaptor 싱글턴입니다. <code>adapt()</code> 클래스를 직접 주거나, <code>StorageAdaptorRole</code>{" "}
                      같은 role을 줍니다. role이 어떤 구현으로 연결될지는 여기가 아니라{" "}
                      <code>option.applyAdaptor(role, TheClass)</code>가 한 번 결정합니다.
                    </span>
                  ),
                }),
                example: "posTerminal: plug(PosTerminal)",
              },
              {
                key: "signal",
                type: "<S>() => S",
                desc: l.trans({
                  en: (
                    <span>
                      The module&apos;s own server signal, so service logic can publish a <code>pubsub</code> room or
                      enqueue a <code>process</code>. The field name must end in <code>Signal</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      그 모듈의 server signal입니다. service 로직이 <code>pubsub</code> room에 publish하거나{" "}
                      <code>process</code>를 큐에 넣을 때 씁니다. 필드 이름은 <code>Signal</code>로 끝나야 합니다.
                    </span>
                  ),
                }),
                example: "icecreamOrderSignal: signal<sig.IcecreamOrder>()",
              },
              {
                key: "env",
                type: "(fn: (env) => T) => T",
                desc: l.trans({
                  en: "A value read out of the backend environment at wiring time, so no configuration has to be threaded through every function that needs it.",
                  ko: "배선 시점에 백엔드 환경에서 읽는 값입니다. 설정을 필요한 함수마다 인자로 넘겨줄 필요가 없어집니다.",
                }),
                example: "pos: env((option: PosTerminalOptions) => option.pos)",
              },
              {
                key: "memory",
                type: "(ref, opts?) => Store",
                desc: l.trans({
                  en: (
                    <span>
                      Service-owned runtime state, held through the cache adaptor so every replica sees it. It takes a
                      scalar or a model class, not only a primitive — never hand-encode JSON into a <code>String</code>{" "}
                      memory.
                    </span>
                  ),
                  ko: (
                    <span>
                      service가 소유하는 런타임 상태입니다. cache adaptor를 통해 보관되므로 모든 replica가 같은 값을
                      봅니다. 원시값뿐 아니라 스칼라나 모델 클래스도 받습니다. <code>String</code> memory에 JSON을 직접
                      인코딩하지 마세요.
                    </span>
                  ),
                }),
                example: "openTickets: memory(Map, { of: String })",
              },
              {
                key: "use",
                type: "<T>() => T",
                desc: l.trans({
                  en: (
                    <span>
                      Legacy. Reaches a constructor-style singleton registered in <code>lib/option.ts</code>. Recognise
                      it; write new adapters as <code>adapt()</code> classes instead.
                    </span>
                  ),
                  ko: (
                    <span>
                      legacy입니다. <code>lib/option.ts</code>에 등록된 생성자 방식 싱글턴을 가져옵니다. 알아보기만
                      하고, 새 adapter는 <code>adapt()</code> 클래스로 쓰세요.
                    </span>
                  ),
                }),
                example: "alarmApi: use<AlarmApi>()",
              },
            ]}
          />
          <div>
            {l.trans({
              en: "An adaptor is the unit you plug. It is a class built on adapt(), it self-registers under the name it is given, and it takes the same injectors minus service and signal — so an adaptor can hold config, another adaptor, and shared state, but not business logic:",
              ko: "plug의 단위는 adaptor입니다. adapt()로 만든 클래스이고, 주어진 이름으로 스스로 등록하며, service와 signal을 뺀 같은 주입기를 받습니다. 그래서 adaptor는 설정, 다른 adaptor, 공유 상태를 가질 수 있지만 비즈니스 로직은 갖지 않습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/srvkit/posTerminal.ts"
            code={`import { adapt } from "akanjs/service";

import { Err } from "../lib/dict";

export interface PosTerminalOptions {
  pos: { endpoint: string; storeId: string };
}

export class PosTerminal extends adapt("posTerminal" as const, ({ env, memory }) => ({
  pos: env((option: PosTerminalOptions) => option.pos),
  openTickets: memory(Map, { of: String }),
})) {
  override async onInit() {
    await this.openTickets.clear();
  }

  async charge(icecreamOrderId: string, amount: number) {
    const ticket = await this.#api<{ ticketId: string }>("/charge", {
      method: "POST",
      body: JSON.stringify({ storeId: this.pos.storeId, amount }),
    });
    await this.openTickets.set(icecreamOrderId, ticket.ticketId);
    return ticket.ticketId;
  }

  async #api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.pos.endpoint}\${path}\`, {
      ...init,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Err("koyo.error.posUnavailable");
    return (await response.json()) as T;
  }
}`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  A database-backed service also receives its own model as <code>this.&lt;refName&gt;Model</code>{" "}
                  without declaring anything — <code>serve(db.inventory, …)</code> is what adds it. The worked walk
                  through each injector, including how a role is bound, is on{" "}
                  <Link href="/cheatsheet/observability/di" className="text-primary">
                    Dependency Injection
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  데이터베이스 기반 service는 자기 모델을 <code>this.&lt;refName&gt;Model</code>로 아무것도 선언하지
                  않고 받습니다. <code>serve(db.inventory, …)</code>가 붙여주기 때문입니다. 주입기별 상세한 사용법과
                  role을 묶는 방법은{" "}
                  <Link href="/cheatsheet/observability/di" className="text-primary">
                    의존성 주입
                  </Link>
                  에 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="error-placement" title={l.trans({ en: "Where An Error Belongs", ko: "에러가 놓일 자리" })}>
        <Docs.Title>{l.trans({ en: "Where An Error Belongs", ko: "에러가 놓일 자리" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Refusing an order out of mango and refusing an order from a customer who is not signed in are not the same refusal, and they are not written in the same file. Each layer throws what only it can know.",
              ko: "망고가 없어서 주문을 거절하는 것과 로그인하지 않은 고객의 주문을 거절하는 것은 같은 거절이 아니고, 같은 파일에 쓰지도 않습니다. 각 계층은 자기만 알 수 있는 것을 던집니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Which layer refuses", ko: "어느 계층이 거절하는가" })}
            highlightNodes={["document"]}
            chart={`flowchart TB
  call["A call arrives"] --> guard["signal.ts guards<br/>may this caller do this at all?"]
  guard -->|"no"| denied["401 or 403 · the guard returns false"]
  guard -->|"yes"| service["service.ts<br/>does another document forbid it?"]
  service --> document["document.ts<br/>is this record in a state that allows it?"]
  document --> saved["chain method mutates · caller saves"]
  service -.->|"throw new Err"| dict["dictionary .error key<br/>translated for the caller"]
  document -.->|"throw new Err"| dict`}
          />
          <div>
            {l.trans({
              en: "A chain method is the smallest version of this: it validates, mutates, and returns this — never saving, so that chains compose and the caller decides when the write happens.",
              ko: "chain method가 이 규칙의 가장 작은 형태입니다. 검증하고, 값을 바꾸고, this를 돌려줍니다. 저장은 하지 않습니다. 그래야 chain이 이어 붙고, 쓰기 시점은 호출한 쪽이 정합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.document.ts"
            code={`import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class IcecreamOrderFilter extends from(cnst.IcecreamOrder, (filter) => ({ // [!code collapse:10]
  query: {
    byStatuses: filter()
      .opt("statuses", [cnst.IcecreamOrderStatus])
      .query((statuses, q) => ({
        ...(statuses?.length ? { status: q.oneOf(statuses) } : {}),
      })),
  },
  sort: {},
})) {}

export class IcecreamOrder extends by(cnst.IcecreamOrder) {
  process() {
    if (this.status !== "active") throw new Err("icecreamOrder.error.onlyActiveCanBeProcessed");
    this.status = "processing";
    return this;
  }
  serve() {
    if (this.status !== "processing") throw new Err("icecreamOrder.error.onlyProcessingCanBeServed");
    this.status = "served";
    return this;
  }
}

export class IcecreamOrderModel extends into(IcecreamOrder, IcecreamOrderFilter, cnst.icecreamOrder, () => ({})) {}`}
          />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Never <code>throw new Error</code>. A raw error is generalized to <code>Internal Server Error</code>{" "}
                  on the way out, so the customer is told nothing and the log is told no key. Throw{" "}
                  <code>new Err(&quot;&lt;module&gt;.error.&lt;key&gt;&quot;)</code> and register the key as an{" "}
                  <code>[en, ko]</code> pair in that module&apos;s dictionary <code>.error(&#123;&#125;)</code> stage —
                  that is what makes the refusal readable in the caller&apos;s own language.
                </span>
              ),
              ko: (
                <span>
                  <code>throw new Error</code>는 쓰지 마세요. 날것의 에러는 나가는 길에{" "}
                  <code>Internal Server Error</code>로 일반화되므로, 고객은 아무것도 듣지 못하고 로그에도 키가 남지
                  않습니다. <code>new Err(&quot;&lt;module&gt;.error.&lt;key&gt;&quot;)</code>를 던지고, 그 키를 해당
                  모듈 dictionary의 <code>.error(&#123;&#125;)</code> 단계에 <code>[en, ko]</code> 쌍으로 등록하세요.
                  거절이 호출자의 언어로 읽히는 이유가 그것입니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: "Best-effort code does not throw at all. An adaptor that cannot reach a provider logs and returns null, a guard that cannot load a record warns and returns false, and the caller decides whether that is an error. There are no Result wrappers anywhere in the stack.",
              ko: "최선을 다하는 정도의 코드는 아예 던지지 않습니다. 제공처에 닿지 못한 adaptor는 로그를 남기고 null을 돌려주고, 레코드를 불러오지 못한 guard는 warn 후 false를 돌려주며, 그것이 에러인지는 호출한 쪽이 정합니다. 이 스택 어디에도 Result 래퍼는 없습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="agent-shelf"
        title={l.trans({ en: "The Same Endpoints, For Agents", ko: "같은 Endpoint, 에이전트에게는" })}
      >
        <Docs.Title>
          {l.trans({ en: "The Same Endpoints, For Agents", ko: "같은 Endpoint, 에이전트에게는" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every signal is also served to AI agents as an MCP server on POST /mcp, mounted by default. There is no per-endpoint opt-in and nothing extra to write in a signal file: exposure follows the guards, because the guards are already the authorization decision and a second switch would only guarantee that endpoints added later are invisible until somebody remembers them.",
              ko: "모든 signal은 기본 마운트되는 POST /mcp에서 MCP 서버로 AI 에이전트에게도 제공됩니다. endpoint별 opt-in도 없고 signal 파일에 따로 적을 것도 없습니다. 노출은 guard를 따릅니다. guard가 이미 권한 부여 결정이고, 스위치를 하나 더 두면 나중에 추가되는 endpoint가 누군가 기억해 낼 때까지 보이지 않게 될 뿐이기 때문입니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "What the guards decide for agents:", ko: "Guard가 에이전트에 대해 정하는 것:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "An endpoint that declares a real guard is published; one that declares none is refused, and the boot log names it. So a missing guards array now costs visibility as well as authorization.",
                  ko: "실질 guard를 선언한 endpoint는 게시되고, 아무것도 선언하지 않은 endpoint는 거부되며 부팅 로그에 이름이 남습니다. guards 배열을 빠뜨리면 권한뿐 아니라 노출까지 잃습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A mutation whose only guard is Public is refused too, and so are pubsub, message, file uploads, and any endpoint returning Any or Binary.",
                  ko: "guard가 Public뿐인 mutation도 거부되고, pubsub, message, 파일 업로드, Any나 Binary를 반환하는 endpoint도 마찬가지입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "mcp: false takes an endpoint off the shelf without touching its guards — the right answer for a step of a UI-driven state machine that is perfectly guarded and still no business of a model.",
                  ko: "mcp: false는 guard를 건드리지 않고 endpoint를 선반에서만 내립니다. guard는 완벽하지만 모델이 건드릴 일은 아닌, UI가 이끄는 상태 기계의 한 단계에 맞는 답입니다.",
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  The business service you already wrote is therefore the agent surface too — the same guards, the same{" "}
                  <code>Err</code>, the same service method. What changes is the cost of the catalogue and who may be on
                  the other end. The wire, the OAuth metadata, the rate limits and the <code>Person</code> guard are on{" "}
                  <Link href="/cheatsheet/interface/mcp" className="text-primary">
                    MCP Server
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  그래서 이미 작성한 비즈니스 서비스가 곧 에이전트 표면입니다. 같은 guard, 같은 <code>Err</code>, 같은
                  service method입니다. 달라지는 것은 카탈로그의 비용과 반대편에 누가 있을 수 있는가입니다. 와이어,
                  OAuth 메타데이터, rate limit, <code>Person</code> guard 이야기는{" "}
                  <Link href="/cheatsheet/interface/mcp" className="text-primary">
                    MCP 서버
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
