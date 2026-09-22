import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="service-zone" title="Service.Zone.tsx">
        <Docs.Title>Service.Zone.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Like the Util beside it, none of the eight service modules in this workspace has one. A Zone is the section a page drops in whole — and a capability with no records to list usually has no section, it has a screen, or it has one button inside somebody else's.",
              ko: "옆의 Util과 마찬가지로, 이 워크스페이스의 service module 여덟 중 이 파일을 가진 것은 없습니다. Zone은 page가 통째로 끼워 넣는 구획인데, 나열할 레코드가 없는 능력은 보통 구획이 아니라 화면을 갖거나, 남의 화면 안 버튼 하나를 갖습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "When one is right, it is because the section is real: several controls that share store state, arranged together, reused on more than one route. A search console, an upload panel, a device dashboard. If it appears on exactly one route, it is that route.",
              ko: "Zone이 맞는 경우는 그 구획이 실재할 때입니다. store state를 공유하는 control 여럿이 함께 배치되고, route 하나 이상에서 재사용되는 경우입니다. 검색 콘솔, 업로드 패널, 장비 대시보드 같은 것입니다. 정확히 한 route에만 나타난다면, 그것은 그 route입니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A Zone is a client component — <code>use client</code> on line 1, mechanically, in every{" "}
                  <code>.Zone.tsx</code> there is. That is a cost, not a licence: every JSX element left inside it ships
                  twice, as HTML and as bundled JS the browser re-runs. The server share of the app is measured, and{" "}
                  <code>akan quality ssr</code> reports a falling one as a regression.
                </span>
              ),
              ko: (
                <span>
                  Zone은 client component입니다. 존재하는 모든 <code>.Zone.tsx</code>는 기계적으로 1행에{" "}
                  <code>use client</code>를 답니다. 그것은 허가가 아니라 비용입니다. 안에 남은 JSX element는 전부 두 번
                  전송됩니다. HTML로 한 번, 브라우저가 다시 실행하는 bundle JS로 한 번입니다. 앱의 server 비율은
                  측정되고, <code>akan quality ssr</code>은 그 값이 떨어지면 회귀로 보고합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="no-markup" title={l.trans({ en: "Hold No Markup", ko: "Markup을 들지 않는다" })}>
        <Docs.Title>{l.trans({ en: "Hold No Markup", ko: "Markup을 들지 않는다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model module's Zone reads the store and delegates to a View, which is a server component in the same folder. A service module has no View — so the server component it delegates to lives in ui/, and the Zone hands it the state as props or takes it back as children.",
              ko: "model module의 Zone은 store를 읽고 View에 위임합니다. 같은 folder의 server component입니다. service module에는 View가 없습니다. 그래서 위임할 server component는 ui/에 있고, Zone은 state를 prop으로 건네거나 children으로 돌려받습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/_receipt/Receipt.Zone.tsx"
            code={`"use client";

import { st } from "@apps/koyo/client";
import { ReceiptPreview } from "@apps/koyo/ui";
import type { ReactNode } from "react";

interface ConsoleProps {
  className?: string;
  header: ReactNode;
}
export const Console = ({ className, header }: ConsoleProps) => {
  const preview = st.use.receiptPreview();
  const printing = st.use.printing();
  return (
    <section className={className}>
      {header}
      <ReceiptPreview preview={preview} disabled={printing} />
    </section>
  );
};`}
          />
          <div>
            {l.trans({
              en: "Two store reads, one wrapper element, and everything a person actually looks at is a server component. The header arrives as a ReactNode slot rather than as children, because a slot lets the page compose server content in a named position instead of one anonymous one — Layout.Navbar takes five of them for exactly this reason.",
              ko: "store 읽기 둘, wrapper element 하나, 그리고 사람이 실제로 보는 것은 전부 server component입니다. header는 children이 아니라 ReactNode slot으로 들어옵니다. slot이 있으면 page가 익명 자리 하나가 아니라 이름 붙은 자리에 server 콘텐츠를 배치할 수 있기 때문입니다. Layout.Navbar가 그런 이유로 다섯 개를 받습니다.",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🧱</span>
              <div>
                <strong>
                  {l.trans({ en: "Wrap the interaction, not the UI", ko: "UI가 아니라 상호작용을 감싼다" })}
                </strong>
                :{" "}
                {l.trans({
                  en: "the smallest useful client component adds one behaviour and renders children untouched, so the markup inside never reaches the bundle",
                  ko: "쓸모 있는 가장 작은 client component는 동작 하나를 더하고 children을 건드리지 않고 그립니다. 그러면 안쪽 markup은 bundle에 닿지 않습니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🍃</span>
              <div>
                <strong>{l.trans({ en: "Push the boundary to the leaf", ko: "경계를 잎까지 내린다" })}</strong>:{" "}
                {l.trans({
                  en: "a Zone that reads three keys and renders forty elements is a Zone that reads three keys and a server component that renders forty",
                  ko: "key 셋을 읽고 element 마흔 개를 그리는 Zone은, key 셋을 읽는 Zone과 마흔 개를 그리는 server component입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🆔</span>
              <div>
                <strong>{l.trans({ en: "Take an id, not a model", ko: "model이 아니라 id를 받는다" })}</strong>:{" "}
                {l.trans({
                  en: "a cnst model on a Zone prop is a lint error — the class instance loses its methods crossing the boundary and arrives as a plain object wearing the model's type",
                  ko: "Zone의 prop에 cnst model을 쓰면 lint 에러입니다. class instance는 경계를 넘으며 method를 잃고, model의 타입을 걸친 평범한 객체로 도착합니다",
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="seed-from-route" title={l.trans({ en: "Seed It From The Route", ko: "Route에서 채운다" })}>
        <Docs.Title>{l.trans({ en: "Seed It From The Route", ko: "Route에서 채운다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The reflex to resist is loading on mount. A useEffect with an empty dependency array renders an empty shell, hydrates, then asks the server a question the server could have answered before the first byte — and akan quality ssr reports it as akan.ssr.client-mount-load.",
              ko: "참아야 할 반사 행동은 mount 시점의 로딩입니다. dependency 배열이 빈 useEffect는 빈 껍데기를 그리고, hydrate한 뒤, server가 첫 바이트 이전에 답할 수 있었던 질문을 server에 던집니다. akan quality ssr은 이것을 akan.ssr.client-mount-load로 보고합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/receipt/_index.tsx"
            code={`export default page().render(async () => {
  const { l } = usePage();
  getSelf({ unauthorize: "/signin" });
  const [templates] = await Promise.all([fetch.listReceiptTemplates()]);
  return <Receipt.Zone.Console header={<h1 className="font-bold text-2xl">{l("receipt.console")}</h1>} templates={templates} />;
});`}
          />
          <div>
            {l.trans({
              en: "The page fetches, the page awaits, and the Zone takes the resolved value as a prop. A client component never calls fetch.* at all, and fetch.init* is refused there by a lint rule of its own — that one is a hydration snapshot whose only consumer is a Load.* init prop, so from the client it is two extra round trips landing in a value nothing reads.",
              ko: "page가 fetch하고, page가 await하며, Zone은 해소된 값을 prop으로 받습니다. client component는 fetch.*를 아예 호출하지 않고, fetch.init*은 전용 lint 규칙이 그곳에서 거부합니다. 그것은 Load.*의 init prop만이 소비하는 hydration 스냅샷이라, client에서 부르면 아무도 읽지 않는 값에 도착하는 왕복 두 번입니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Where the data comes from:", ko: "데이터가 오는 곳:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "Server data the section needs immediately — await it in the page and pass it down as a prop.",
                  ko: "구획이 곧바로 필요로 하는 server 데이터는 page에서 await하고 prop으로 내려보냅니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Server data the section can render around — hand the unawaited promise to <Load.Stream of={…}> and let it resolve behind its own boundary.",
                  ko: "구획이 없어도 그려지는 server 데이터는 await하지 않은 promise를 <Load.Stream of={…}>에 건네 자기 경계 뒤에서 해소되게 합니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Anything a click asks for — a store action, called through st.do.*. An interaction-driven fetch is not a mount load and is not flagged.",
                  ko: "클릭이 요청하는 것은 store action이고 st.do.*로 호출합니다. 상호작용이 일으킨 fetch는 mount 로딩이 아니라 보고 대상이 아닙니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="or-a-page" title={l.trans({ en: "Or Just Write The Page", ko: "아니면 그냥 page를 쓴다" })}>
        <Docs.Title>{l.trans({ en: "Or Just Write The Page", ko: "아니면 그냥 page를 쓴다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "_oauth needed a consent screen, an approve button, a deny button and a connected-apps list. It has none of these two files. The screen is a route in libs/shared/page/oauth, the buttons are a plain form post that the cookie session authenticates, and the module ships ten endpoints and no component at all.",
              ko: "_oauth에는 동의 화면, 승인 버튼, 거부 버튼, 연결된 앱 목록이 필요했습니다. 그런데 이 두 파일 중 무엇도 없습니다. 화면은 libs/shared/page/oauth의 route이고, 버튼은 cookie session이 인증하는 평범한 form post이며, module은 endpoint 열 개와 component 영 개를 배포합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "That is worth copying rather than working around. A form post needs no script, so the consent page ships as HTML and works before any bundle arrives — which for a screen that authorizes another application to act as you is the point, not an optimization.",
              ko: "우회할 것이 아니라 따라 할 만한 방식입니다. form post에는 script가 필요 없으므로 동의 화면은 HTML로 전송되고 어떤 bundle이 도착하기도 전에 동작합니다. 다른 애플리케이션이 나로서 행동하도록 인가하는 화면이라면, 그것은 최적화가 아니라 핵심입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A lib may own routes as well as modules: libs/<lib>/page follows the same rules as an app's, and an app opts in with syncPageLibs in akan.config.ts. The routes are then linked into apps/<app>/page/(libs)/(<lib>), which is generated and gitignored — edit the lib source, never the link.",
              ko: "라이브러리는 module뿐 아니라 route도 소유할 수 있습니다. libs/<lib>/page는 앱의 page와 같은 규칙을 따르고, 앱은 akan.config.ts의 syncPageLibs로 참여합니다. 그러면 route가 apps/<app>/page/(libs)/(<lib>)로 링크되는데, 생성물이고 gitignore 대상입니다. 링크가 아니라 lib 소스를 고치세요.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/akan/akan.config.ts"
            language="typescript"
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  syncPageLibs: ["shared"],
};

export default config;`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
