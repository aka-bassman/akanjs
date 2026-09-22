import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="service-util" title="Service.Util.tsx">
        <Docs.Title>Service.Util.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Not one of the eight service modules in this workspace has this file. That is the most useful thing this page can tell you, and it is not an oversight waiting to be corrected — the rest of the page is about why the file is rare, and what it takes for yours to be the exception.",
              ko: "이 워크스페이스의 service module 여덟 중 이 파일을 가진 것은 하나도 없습니다. 이 문서가 해 줄 수 있는 가장 쓸모 있는 말이고, 언젠가 고쳐야 할 누락이 아닙니다. 이 문서의 나머지는 왜 이 파일이 드문지, 그리고 당신의 것이 예외가 되려면 무엇이 필요한지에 대한 이야기입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A model module's Util is the verb minus the noun: Serve, Refund, Complete. It belongs to the module because the button it wraps is the module's own endpoint and the record it acts on is the module's own model. A service module has the verb and no noun — so the control usually belongs to the screen that offers it, not to the capability behind it.",
              ko: "model module의 Util은 동사에서 명사를 뺀 이름입니다. Serve, Refund, Complete 같은 것입니다. 감싸는 버튼이 그 module의 endpoint이고 작용하는 레코드가 그 module의 model이기 때문에 module에 속합니다. service module에는 동사만 있고 명사가 없습니다. 그래서 그 control은 보통 뒤에 있는 능력이 아니라 그것을 내미는 화면에 속합니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📦</span>
                <strong className="text-primary">{l.trans({ en: "Put it in ui/", ko: "ui/에 두기" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The component renders JSX and is not bound to one model — which is the admission test for ui/ verbatim. A disconnect button, a permission prompt, a map control: all of them are ui/ components the service store happens to drive.",
                  ko: "component가 JSX를 그리고 model 하나에 묶이지 않는다면, 그것이 ui/의 입장 조건 그대로입니다. 연결 끊기 버튼, 권한 요청, 지도 컨트롤 전부 service store가 몰고 있을 뿐인 ui/ component입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📄</span>
                <strong className="text-primary">{l.trans({ en: "Put it in page/", ko: "page/에 두기" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "The capability has a screen of its own rather than a section inside somebody else's. The OAuth consent page is a route in libs/shared/page/oauth, which is why _oauth ships ten endpoints and no component.",
                  ko: "그 능력이 남의 화면 안 구획이 아니라 자기 화면을 가진 경우입니다. OAuth 동의 화면은 libs/shared/page/oauth의 route이고, 그래서 _oauth는 endpoint 열 개와 component 영 개를 배포합니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧰</span>
                <strong className="text-primary">{l.trans({ en: "Put it here", ko: "여기에 두기" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Only when the control is meaningless outside this module — it reads this store, calls this endpoint, and moving it to ui/ would mean importing the module back in. Then it is a Util, and only then.",
                  ko: "이 module 밖에서는 의미가 없는 control일 때만입니다. 이 store를 읽고 이 endpoint를 호출하며, ui/로 옮기면 module을 도로 import해야 하는 경우입니다. 그럴 때에만 Util입니다.",
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="shape" title={l.trans({ en: "The Shape, If You Write One", ko: "쓰게 된다면, 그 모양" })}>
        <Docs.Title>{l.trans({ en: "The Shape, If You Write One", ko: "쓰게 된다면, 그 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: 'A Util is always a client component, mechanically: "use client" on line 1, above the imports, in every .Util.tsx there is. Exports are role names, and for a service module the role is the endpoint verb.',
              ko: '.Util.tsx는 기계적으로 언제나 client component입니다. import 위, 1행에 "use client"를 적습니다. export는 역할 이름이고, service module에서 그 역할은 endpoint의 동사입니다.',
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/_receipt/Receipt.Util.tsx"
            code={`"use client";

import { st, usePage } from "@apps/koyo/client";
import { Button } from "akanjs/ui";

interface PrintProps {
  className?: string;
  icecreamOrderId: string;
}
export const Print = ({ className, icecreamOrderId }: PrintProps) => {
  const { l } = usePage();
  const printing = st.use.printing();
  return (
    <Button className={className} disabled={printing} onClick={() => st.do.printReceipt(icecreamOrderId)}>
      {l("receipt.print")}
    </Button>
  );
};`}
          />
          <div>
            {l.trans({
              en: "Three rules are load-bearing in those sixteen lines. The props interface sits immediately above the component with className first and is not exported. The prop is an id string rather than the order itself — a cnst model on a Util prop is a lint error, because the server would have to hand a class instance across the boundary and the methods do not survive the trip. And the label comes from the dictionary, never from a literal.",
              ko: "그 열여섯 줄에서 규칙 셋이 하중을 받고 있습니다. props interface는 component 바로 위에 className을 먼저 두고 붙어 있으며 export하지 않습니다. prop은 주문 객체가 아니라 id 문자열입니다. Util의 prop에 cnst model을 쓰면 lint 에러입니다. server가 class instance를 경계 너머로 건네야 하는데 method는 그 여행에서 살아남지 못하기 때문입니다. 그리고 label은 리터럴이 아니라 dictionary에서 옵니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A <code>Util</code> renders markup, and markup in a client file ships twice — once as HTML and once as
                  bundled JS the browser re-runs. Keep it to the control and the one line of text it needs. A panel, a
                  layout, a list of anything: those are server work, and they belong in a server component this one
                  takes as <code>children</code>.
                </span>
              ),
              ko: (
                <span>
                  <code>Util</code>은 markup을 그리고, client 파일의 markup은 두 번 전송됩니다. HTML로 한 번, 브라우저가
                  다시 실행하는 bundle JS로 한 번입니다. control과 거기 필요한 한 줄의 문구까지만 두세요. 패널,
                  레이아웃, 무언가의 목록은 server의 일이고, 이 component가 <code>children</code>으로 받는 server
                  component에 속합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="allowlist" title={l.trans({ en: "What Sync Will Accept", ko: "Sync가 받아 주는 것" })}>
        <Docs.Title>{l.trans({ en: "What Sync Will Accept", ko: "Sync가 받아 주는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service module folder has exactly two component roles: Service.Util.tsx and Service.Zone.tsx. There is no Template, no Unit and no View. akan sync will happily collect a file that ignores that — the rule is carried by akan quality scan, which asks for predictable module UI filenames and names service modules as Util and Zone only.",
              ko: "service module folder의 component 역할은 정확히 둘입니다. Service.Util.tsx와 Service.Zone.tsx입니다. Template도 Unit도 View도 없습니다. 그것을 무시한 파일이 있어도 akan sync는 그냥 수집합니다. 이 규칙은 akan quality scan이 들고 있고, module UI 파일 이름을 예측 가능하게 유지하라고 하면서 service module은 Util과 Zone뿐이라고 적습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Those three missing roles are the three that would need a model. Template binds to a model's form state, Unit renders one light model, View renders one full model — none of which a service module has. What is left is one client control and one client section, and the framework agrees that is all there should be: the SSR scanner exempts every lib/_ folder from the rule that warns when a module renders only from client files, because a service module owns no model to render on the server.",
              ko: "빠진 세 역할은 전부 model이 있어야 하는 것들입니다. Template은 model의 form state에 묶이고, Unit은 light model 하나를 그리고, View는 full model 하나를 그립니다. service module에는 그중 무엇도 없습니다. 남는 것은 client control 하나와 client section 하나이고, framework도 그것이 전부여야 한다고 봅니다. SSR 스캐너는 module이 client 파일에서만 그릴 때 경고하는 규칙에서 모든 lib/_ folder를 면제합니다. service module에는 server에서 그릴 model이 없기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            showLineNumbers={false}
            code={`akan quality scan   # names a Template, Unit or View under lib/_<service>
akan quality ssr    # lib/_<service> is exempt from akan.ssr.module-missing-server-view`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
