import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Authorization", ko: "권한 부여" })}>
        <Docs.Title>{l.trans({ en: "Authorization", ko: "권한 부여" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You are shipping the order list for a shop that has more than one branch. The page renders, every row on screen belongs to the right branch, and it all looks correct — because the branch id came out of the URL. Then a customer edits the URL, and the same endpoint hands them somebody else's orders.",
              ko: "지점이 여러 개인 가게의 주문 목록 화면을 배포하려는 참입니다. 페이지는 잘 그려지고, 화면의 모든 행은 맞는 지점의 것이며, 전부 정상으로 보입니다. 지점 id를 URL에서 꺼냈기 때문입니다. 그러다 고객이 URL을 고치면, 같은 endpoint가 남의 주문을 그대로 내어줍니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Authorization answers two questions in front of every endpoint: who is calling, and may they do this? Middleware reads the caller off the request, guards decide, and internal arguments hand the handler values the client never typed. The same three steps run whether the call arrived over HTTP, a websocket frame, or the MCP endpoint.",
              ko: "권한 부여는 모든 endpoint 앞에서 두 가지 질문에 답합니다. 누가 호출했는가, 그리고 그 사람이 이 일을 해도 되는가입니다. middleware가 요청에서 호출자를 읽고, guard가 판정하며, internal argument가 클라이언트가 입력한 적 없는 값을 handler에 넣어줍니다. HTTP로 왔든 websocket 프레임으로 왔든 MCP endpoint로 왔든 같은 세 단계를 거칩니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One call, from the door to the handler", ko: "호출 하나, 문에서 handler까지" })}
            highlightNodes={["guards"]}
            chart={`flowchart TB
  req["Request<br/>HTTP · websocket · MCP"] --> args["Arguments parsed"]
  args --> mw["Middleware<br/>Account · Logging · Timeout · Cache"]
  mw --> guards["guards array<br/>in declaration order"]
  guards --> internal["Internal arguments<br/>.with(Self) · .with(Me)"]
  internal --> handler["exec() handler"]
  handler --> resolve["resolveReturn<br/>hidden and secret fields masked"]
  guards -.->|"first false"| denied["403 Forbidden"]`}
          />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  An endpoint that names no <code>guards</code> array runs <strong>zero</strong> checks. The guard loop
                  iterates <code>guards ?? []</code>, and an empty list is a loop body that never runs — not a default
                  policy. A <code>mutation</code> with no guards is callable by anyone who can reach the route, and
                  nothing anywhere asks them to sign in first.
                </span>
              ),
              ko: (
                <span>
                  <code>guards</code> 배열을 적지 않은 endpoint는 검사를 <strong>하나도</strong> 하지 않습니다. guard
                  루프는 <code>guards ?? []</code>를 순회하고, 빈 배열은 한 번도 돌지 않는 루프일 뿐 기본 정책이
                  아닙니다. guard 없는 <code>mutation</code>은 그 라우트에 닿을 수 있는 누구나 호출할 수 있고,
                  어디에서도 로그인을 먼저 요구하지 않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="guards" title={l.trans({ en: "The Guards That Ship", ko: "기본 제공되는 Guard" })}>
        <Docs.Title>{l.trans({ en: "The Guards That Ship", ko: "기본 제공되는 Guard" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A guard is a class with one method. Two places ship them: akanjs/signal carries the two that decide nothing about identity, and @libs/shared/srvkit carries the role ladder every app mounting libs/shared inherits. Name them in the slice guards map and in every custom endpoint's own guards array.",
              ko: "guard는 메서드 하나짜리 클래스입니다. 기본 제공처는 두 곳입니다. akanjs/signal은 신원에 대해 아무 판단도 하지 않는 두 개를 담고, @libs/shared/srvkit은 libs/shared를 마운트한 모든 앱이 물려받는 role 사다리를 담습니다. slice의 guards 맵과, 모든 커스텀 endpoint의 guards 배열에 직접 이름을 적습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts"
            code={`import { Admin, Every, Self, SelfOrAdmin } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, () => ({})) {}

export class IcecreamOrderSlice extends slice(
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: SelfOrAdmin } },
  () => ({}),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  serveIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .with(Self)
    .exec(async function (icecreamOrderId, self) {
      return await this.icecreamOrderService.serve(icecreamOrderId, self.id);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Every slice() takes an explicit guards map as its second argument and root: is always Admin — the root slice is an admin API that takes a query key and its arguments. A custom endpoint never inherits the slice default; it names its own array, and an empty one is the hole above. Here is what is on the shelf:",
              ko: "모든 slice()는 두 번째 인자로 guards 맵을 명시하고, root:는 언제나 Admin입니다. root slice는 query key와 그 인자를 받는 관리자 API이기 때문입니다. 커스텀 endpoint는 slice의 기본값을 물려받지 않습니다. 자기 배열을 직접 적으며, 그 배열이 비어 있으면 위에서 말한 구멍이 됩니다. 선반에 있는 것들은 다음과 같습니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Guard", ko: "Guard" })}
            items={[
              {
                name: "Public",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — passes everyone, an anonymous caller included. Belongs on a slice{" "}
                      <code>get:</code>, never on a mutation.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — 익명 호출자를 포함해 전부 통과시킵니다. slice의 <code>get:</code>에 쓰고,
                      mutation에는 쓰지 않습니다.
                    </span>
                  ),
                }),
              },
              {
                name: "None",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — refuses everyone. The explicit way to close a generated endpoint that the
                      model does not want exposed at all.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — 전부 거부합니다. 모델이 아예 열고 싶지 않은 생성 endpoint를 명시적으로 닫는
                      방법입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "Every",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — any signed-in caller: <code>user</code>, <code>admin</code>, or{" "}
                      <code>superAdmin</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — 로그인한 호출자 전부입니다. <code>user</code>, <code>admin</code>,{" "}
                      <code>superAdmin</code>.
                    </span>
                  ),
                }),
              },
              {
                name: "User",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — the <code>user</code> role only. An admin who is not also a user does not
                      pass.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — <code>user</code> role만입니다. user를 겸하지 않은 admin은 통과하지
                      못합니다.
                    </span>
                  ),
                }),
              },
              {
                name: "Admin",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — <code>admin</code> or <code>superAdmin</code>. The admin-console guard, and
                      the mandatory <code>root:</code> of every slice.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — <code>admin</code> 또는 <code>superAdmin</code>입니다. 관리자 콘솔용
                      guard이자, 모든 slice의 <code>root:</code>에 반드시 들어가는 값입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "SuperAdmin",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — <code>superAdmin</code> only.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — <code>superAdmin</code>만입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "Owner",
                desc: l.trans({
                  en: (
                    <span>
                      <code>resource</code> — admits the same roles as <code>Every</code>, but is marked{" "}
                      <code>resource</code>, so an agent listing never evaluates it and the call is judged at call time.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>resource</code> — 허용하는 role은 <code>Every</code>와 같지만 <code>resource</code>로
                      표시되어 있어, agent listing에서는 평가되지 않고 호출 시점에 판정됩니다.
                    </span>
                  ),
                }),
              },
              {
                name: "SelfOrAdmin",
                desc: l.trans({
                  en: (
                    <span>
                      <code>resource</code> — the caller is the user named by the call's <code>userId</code> argument,
                      or is an admin. A missing argument is <code>false</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>resource</code> — 호출자가 그 호출의 <code>userId</code> 인자가 가리키는 사용자이거나
                      admin이어야 합니다. 인자가 없으면 <code>false</code>입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "Person",
                desc: l.trans({
                  en: (
                    <span>
                      <code>account</code> — passes a person and refuses a model. Says nothing about who the person is,
                      so it rides beside a role guard: <code>guards: [Every, Person]</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>account</code> — 사람은 통과시키고 모델은 거부합니다. 그 사람이 누구인지는 말하지 않으므로
                      role guard와 함께 씁니다. <code>guards: [Every, Person]</code>.
                    </span>
                  ),
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "The role guards share one helper, and it separates the two refusals a caller can hit: no identity at all answers 401, which is the status an MCP client reads as “obtain a token”, and a signed-in caller who merely lacks the role answers 403 naming the roles required and the roles held. Keep the array beside the endpoint so a reader can see who may call it without opening another file.",
              ko: "role guard들은 helper 하나를 공유하며, 호출자가 맞을 수 있는 두 거절을 나눕니다. 신원이 아예 없으면 401이고, 이는 MCP 클라이언트가 “토큰을 받아오라”로 읽는 상태 코드입니다. 로그인은 했지만 role이 없으면 필요한 role과 가진 role을 함께 적은 403입니다. 누가 이 API를 호출할 수 있는지 다른 파일을 열지 않고 보이도록, 배열은 endpoint 옆에 둡니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scope" title={l.trans({ en: "Declare The Scope", ko: "Scope 선언하기" })}>
        <Docs.Title>{l.trans({ en: "Declare The Scope", ko: "Scope 선언하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every guard class also declares static scope: GuardScope, and it is required with no default. The value says what the guard needs in order to answer, which is what lets an agent catalogue evaluate some guards before a call exists.",
              ko: "모든 guard 클래스는 static scope: GuardScope도 선언하며, 기본값 없이 반드시 적어야 합니다. 이 값은 guard가 판정하는 데 무엇이 필요한지를 말하고, 그 덕분에 agent 카탈로그가 호출이 생기기 전에 일부 guard를 미리 평가할 수 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/srvkit/guards.ts"
            code={`import type { Guard, GuardScope, SignalContext } from "akanjs/signal";

export class SignedIn implements Guard {
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "SignedIn";
  static scope: GuardScope = "account"; // [!code highlight]

  canPass(context: SignalContext): boolean {
    return !!context.get<{ self?: { id: string } }>("account")?.self;
  }
}`}
          />
          <div>
            {l.trans({
              en: "Two values, and the difference is what the method touches:",
              ko: "값은 두 개이고, 차이는 메서드가 무엇을 만지느냐입니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">👤</span>
                <strong className="text-primary">{'scope = "account"'}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The verdict reads the caller and nothing about the call, so it can be evaluated with no arguments. That is what lets an agent listing hide what this caller certainly cannot use.",
                  ko: "판정이 호출자만 읽고 호출 내용은 보지 않으므로 인자 없이 평가할 수 있습니다. agent listing이 이 호출자가 확실히 쓸 수 없는 항목을 숨길 수 있는 근거입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📄</span>
                <strong className="text-primary">{'scope = "resource"'}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "It reads the call's arguments through context.getArg() and fails closed without them, so it is never evaluated for a listing. The entry stays visible and the call is stopped at call time.",
                  ko: "context.getArg()로 호출의 인자를 읽고, 인자가 없으면 닫히는 쪽으로 실패하므로 listing에서는 아예 평가되지 않습니다. 항목은 보이는 채로 두고, 호출 시점에 막습니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "Getting it wrong is not a type error. Both strings satisfy GuardScope on any guard, and nothing in the type system knows whether canPass reaches for an argument — so the compiler accepts either marking on either kind of guard. The two mistakes fail differently, and neither one looks like a mistake from the call site.",
              ko: "잘못 적어도 타입 에러가 아닙니다. 두 문자열 모두 어떤 guard에서든 GuardScope를 만족하고, canPass가 인자를 읽는지 여부는 타입 시스템이 알지 못합니다. 그래서 컴파일러는 어느 guard에 어느 표시를 달아도 받아줍니다. 두 실수는 서로 다르게 실패하고, 호출 지점에서는 둘 다 실수처럼 보이지 않습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "⚠️ The two failure modes:", ko: "⚠️ 두 가지 실패 양상:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: 'A resource guard marked "account" throws when a listing evaluates it with no arguments. The entry is hidden from every caller and the guard is named once per endpoint in the boot log as mismarked.',
                  ko: 'resource guard에 "account"를 달면, listing이 인자 없이 평가할 때 예외가 납니다. 항목은 모든 호출자에게서 숨겨지고, guard는 endpoint마다 한 번씩 잘못 표시됨으로 부팅 로그에 이름이 남습니다.',
                })}
              </li>
              <li>
                {l.trans({
                  en: 'An account guard marked "resource" filters nothing. The endpoint is listed to every caller, including one it will refuse, and is only stopped at call time.',
                  ko: 'account guard에 "resource"를 달면 아무것도 걸러내지 못합니다. 거부할 호출자에게까지 endpoint가 목록에 실리고, 호출 시점에야 막힙니다.',
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: 'The rule of thumb is short: SignedIn, Admin and every role check are "account"; every Can<Verb><Model> is "resource".',
              ko: '기준은 간단합니다. SignedIn, Admin, 모든 role 검사는 "account"이고, 모든 Can<Verb><Model>은 "resource"입니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="resource-guard"
        title={l.trans({ en: "Resource Guards Fail Closed", ko: "리소스 Guard는 닫히며 실패한다" })}
      >
        <Docs.Title>{l.trans({ en: "Resource Guards Fail Closed", ko: "리소스 Guard는 닫히며 실패한다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A role guard answers who you are; it cannot answer whether this record is yours. That is a Can<Verb><Model> class in srvkit/guards.ts, and it loads the record the call names before it decides.",
              ko: "role guard는 당신이 누구인지를 답할 뿐, 이 레코드가 당신 것인지는 답하지 못합니다. 그 판단은 srvkit/guards.ts의 Can<Verb><Model> 클래스가 하며, 호출이 지목한 레코드를 직접 불러온 뒤 판정합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/srvkit/guards.ts"
            code={`import { Logger } from "akanjs/common"; // [!code ++]
import type { Guard, GuardScope, SignalContext } from "akanjs/signal";
import type * as srv from "../lib/srv"; // [!code ++]

export class SignedIn implements Guard { // [!code collapse:9]
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "SignedIn";
  static scope: GuardScope = "account";

  canPass(context: SignalContext): boolean {
    return !!context.get<{ self?: { id: string } }>("account")?.self;
  }
}

export class CanServeIcecreamOrder implements Guard { // [!code ++:21]
  static name = "CanServeIcecreamOrder";
  static scope: GuardScope = "resource";
  static #logger = new Logger("CanServeIcecreamOrder");

  async canPass(context: SignalContext): Promise<boolean> {
    const account = context.get<{ self?: { id: string }; me?: { id: string } }>("account");
    if (account?.me) return true;
    const selfId = account?.self?.id;
    const icecreamOrderId = context.getArg<string>("icecreamOrderId");
    if (!selfId || !icecreamOrderId) return false;
    try {
      const service = context.getService<srv.IcecreamOrderService>("icecreamOrder");
      const icecreamOrder = await service.getIcecreamOrder(icecreamOrderId);
      return icecreamOrder.owner === selfId;
    } catch (error) {
      CanServeIcecreamOrder.#logger.warn(\`serve guard could not load \${icecreamOrderId}: \${String(error)}\`);
      return false;
    }
  }
}`}
          />
          <div>
            {l.trans({
              en: "Four things in that body are the pattern, not this model's details:",
              ko: "이 본문에서 네 가지는 이 모델의 사정이 아니라 패턴입니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🛡️</span>
              <div>
                <strong>{l.trans({ en: "Admin bypass goes first", ko: "Admin 우회를 맨 앞에" })}</strong>:{" "}
                {l.trans({
                  en: "an admin never owns the record, so an ownership test placed above the bypass locks the admin console out of its own data",
                  ko: "admin은 레코드를 소유하지 않으므로, 소유권 검사를 우회보다 위에 두면 관리자 콘솔이 자기 데이터에서 잠깁니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🚫</span>
              <div>
                <strong>{l.trans({ en: "No resource named ⇒ false", ko: "지목된 리소스가 없으면 false" })}</strong>:{" "}
                {l.trans({
                  en: "a missing argument is the one case where returning true would pass every call that forgot to send one",
                  ko: "인자가 없을 때 true를 돌려주면, 인자를 빠뜨린 모든 호출이 그대로 통과합니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">⚠️</span>
              <div>
                <strong>
                  {l.trans({ en: "A load that throws ⇒ warn, then false", ko: "로드 실패는 warn 후 false" })}
                </strong>
                :{" "}
                {l.trans({
                  en: "a database hiccup must not read as permission granted, and the warn is what tells you the guard is refusing for the wrong reason",
                  ko: "데이터베이스가 한 번 흔들린 것이 권한 허용으로 읽혀서는 안 되고, warn은 guard가 엉뚱한 이유로 거부 중임을 알려주는 유일한 흔적입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🏷️</span>
              <div>
                <strong>static name</strong>:{" "}
                {l.trans({
                  en: "it looks like dead code next to the class name, but fetch serializes guard names onto every endpoint and the API explorer filters on them — deleting it breaks that UI",
                  ko: "클래스 이름 옆이라 죽은 코드처럼 보이지만, fetch가 guard 이름을 모든 endpoint에 직렬화하고 API explorer가 그 값으로 필터링합니다. 지우면 그 UI가 깨집니다",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "Guards ship with the library that owns the model and are imported by that library's own signals, so an app that mounts the library inherits the authorization and cannot forget it. The service then re-checks ownership even though the guard already gated the call — two independent gates, because a service method is also reachable from another service, a cron trigger, and a queue job, none of which passed through a guard.",
              ko: "guard는 모델을 소유한 라이브러리와 함께 배포되고 그 라이브러리의 signal이 직접 import하므로, 라이브러리를 마운트한 앱은 권한 부여를 물려받고 잊을 수가 없습니다. 그리고 guard가 이미 막아준 호출이라도 service는 소유권을 한 번 더 확인합니다. 독립된 두 개의 문입니다. service 메서드는 다른 service, cron trigger, queue job에서도 닿을 수 있고, 그 경로들은 guard를 지나오지 않기 때문입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="acting-user"
        title={l.trans({ en: "The Acting User Comes From The Server", ko: "행위자는 서버가 정한다" })}
      >
        <Docs.Title>
          {l.trans({ en: "The Acting User Comes From The Server", ko: "행위자는 서버가 정한다" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A guard decides whether the call runs at all. An internal argument tells the handler who is running it, and it never comes off the wire: .with(...) resolves the value from the account the middleware already verified, after the guards have passed.",
              ko: "guard는 호출이 실행될지 말지를 정합니다. internal argument는 누가 실행 중인지를 handler에 알려주며, 그 값은 절대 통신선에서 오지 않습니다. .with(...)는 guard를 통과한 뒤, middleware가 이미 검증해 둔 account에서 값을 꺼냅니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts"
            code={`import { AgentCall, Every, Me, Self, User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import { Err } from "../dict";
import * as srv from "../srv";

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ query, mutation }) => ({
  listMyIcecreamOrders: query([cnst.LightIcecreamOrder], { guards: [User] })
    .with(Self) // [!code highlight]
    .exec(async function (self) {
      return await this.icecreamOrderService.listByOwner(self.id);
    }),
  refundIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .with(Me, { nullable: true }) // [!code highlight]
    .with(AgentCall)
    .exec(async function (icecreamOrderId, me, isAgentCall) {
      if (isAgentCall) throw new Err("koyo.error.refundNeedsPerson");
      return await this.icecreamOrderService.refund(icecreamOrderId, !!me);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Four internal arguments ship from @libs/shared/srvkit, and an app adds its own in srvkit/ when it needs a narrower shape:",
              ko: "@libs/shared/srvkit에서 네 개가 기본 제공되고, 더 좁은 형태가 필요하면 앱이 srvkit/에 자기 것을 추가합니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🙋</span>
              <div>
                <strong>.with(Self)</strong>:{" "}
                {l.trans({
                  en: "the signed-in user, or null. This is the one to reach for in a user-facing endpoint.",
                  ko: "로그인한 사용자, 없으면 null입니다. 사용자용 endpoint에서 기본으로 집는 것입니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🧑‍💼</span>
              <div>
                <strong>.with(Me)</strong>:{" "}
                {l.trans({
                  en: "the signed-in admin, or null. Self and Me are separate identities on one account, not two roles on one identity.",
                  ko: "로그인한 admin, 없으면 null입니다. Self와 Me는 한 account 위의 서로 다른 신원이지 한 신원의 두 role이 아닙니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🗂️</span>
              <div>
                <strong>.with(Account)</strong>:{" "}
                {l.trans({
                  en: "the whole account object, for a handler that has to branch on both identities at once.",
                  ko: "account 객체 전체입니다. 두 신원을 한꺼번에 봐야 하는 handler에서 씁니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🤖</span>
              <div>
                <strong>.with(AgentCall)</strong>:{" "}
                {l.trans({
                  en: "a boolean — is a model driving this call, rather than a person. Narrows what the call sets in motion without changing who may make it.",
                  ko: "boolean입니다. 사람이 아니라 모델이 이 호출을 몰고 있는지 알려줍니다. 누가 호출할 수 있는지는 그대로 두고, 그 호출이 무엇을 일으킬지만 좁힙니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🆔</span>
              <div>
                <strong>CurrentUserId</strong>:{" "}
                {l.trans({
                  en: "the app scaffold writes this one into srvkit/ for handlers that only need the id. Write your own the same way — a class with one getArg(context).",
                  ko: "id만 필요한 handler를 위해 앱 스캐폴드가 srvkit/에 넣어주는 것입니다. 직접 만들 때도 같은 모양입니다. getArg(context) 하나를 가진 클래스입니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Never take the acting user as a body or param. A <code>userId</code> the client typed is a value the
                  client chose — the handler cannot tell it apart from the caller's own id, and a guard that already
                  passed says nothing about it. An internal argument that resolves to <code>null</code> raises{" "}
                  <code>Unauthorized</code> unless it was declared <code>{"{ nullable: true }"}</code>, which is the
                  behaviour you want by default.
                </span>
              ),
              ko: (
                <span>
                  행위자를 body나 param으로 받지 마세요. 클라이언트가 적어 보낸 <code>userId</code>는 클라이언트가 고른
                  값입니다. handler는 그것을 호출자 자신의 id와 구분할 수 없고, 이미 통과한 guard도 그 값에 대해서는
                  아무 말을 하지 않습니다. internal argument가 <code>null</code>로 풀리면{" "}
                  <code>{"{ nullable: true }"}</code>를 붙이지 않는 한 <code>Unauthorized</code>가 납니다. 기본값으로
                  바람직한 동작입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="agent-exposure"
        title={l.trans({ en: "Guards Are Also The Agent Decision", ko: "Guard가 곧 에이전트 노출 결정" })}
      >
        <Docs.Title>
          {l.trans({ en: "Guards Are Also The Agent Decision", ko: "Guard가 곧 에이전트 노출 결정" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every signal is served to AI agents as an MCP server on POST /mcp, mounted by default. There is no per-endpoint opt-in and nothing extra to write: the guards are already the authorization decision, so a second switch would say nothing they do not — while guaranteeing that every endpoint added later is invisible to agents until somebody remembers it.",
              ko: "모든 signal은 기본 마운트되는 POST /mcp에서 MCP 서버로 AI agent에게 제공됩니다. endpoint별 opt-in도, 따로 적을 것도 없습니다. guard가 이미 권한 부여 결정이므로, 스위치를 하나 더 두어봐야 guard가 하지 않는 말을 하지는 못하면서, 나중에 추가되는 모든 endpoint는 누군가 기억해 낼 때까지 agent에게 보이지 않게 될 뿐입니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "What the guards decide for agents:", ko: "Guard가 에이전트에 대해 정하는 것:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "An endpoint that declares a real guard is published. An endpoint that declares none is refused, and the boot log names it: write guards: [Public] if anonymous access is the intent.",
                  ko: "실질 guard를 선언한 endpoint는 게시됩니다. 아무것도 선언하지 않은 endpoint는 거부되고 부팅 로그에 이름이 남습니다. 익명 접근이 의도라면 guards: [Public]이라고 적으라는 안내와 함께입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A mutation whose only guard is Public is refused too — [Public] on a mutation is having no guard, spelled out.",
                  ko: "guard가 Public뿐인 mutation도 거부됩니다. mutation에 붙은 [Public]은 guard가 없다는 말을 적어 놓은 것과 같습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A guard that admits no model at all — Person — declares static agents = false, and the catalogue then refuses every endpoint it guards outright, so the act is absent from the document rather than hidden per caller.",
                  ko: "모델을 아예 통과시키지 않는 guard인 Person은 static agents = false를 선언하고, 카탈로그는 그 guard가 지키는 endpoint를 통째로 거부합니다. 호출자별로 숨기는 것이 아니라 문서에서 사라집니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "mcp: false takes an endpoint off the shelf without touching its guards. That is curation, not authorization — HTTP serves it exactly as before.",
                  ko: "mcp: false는 guard를 건드리지 않고 endpoint를 선반에서만 내립니다. 권한 부여가 아니라 큐레이션이며, HTTP는 이전과 똑같이 제공합니다.",
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A refused endpoint answers the <em>same</em> unknown-tool error as one that does not exist, and a
                  guard's refusal is generalized on the way out. Never make either message more helpful: the difference
                  between “no such tool” and “you may not call that tool” is exactly what enumerates your private
                  surface. The rest of the wire — resource URIs, OAuth metadata, rate limits — is on{" "}
                  <Link href="/cheatsheet/interface/mcp" className="text-primary">
                    MCP Server
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  거부된 endpoint는 존재하지 않는 endpoint와 <em>같은</em> unknown tool 에러를 돌려주고, guard의 거절은
                  나가는 길에 일반화됩니다. 두 메시지를 더 친절하게 만들지 마세요. “그런 tool은 없다”와 “그 tool은 부를
                  수 없다”의 차이가 바로 비공개 표면을 열거해 주는 단서입니다. resource URI, OAuth 메타데이터, rate
                  limit 같은 나머지 와이어 이야기는{" "}
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
