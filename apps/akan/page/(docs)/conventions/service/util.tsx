import { usePage } from "@apps/akan/client";
import {
  Code,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type LinkGridItem,
  type MatrixColumn,
  type MatrixGroup,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows: IntroItem[] = [
    {
      name: "service module",
      href: "/conventions/service/overview",
      desc: l.trans({
        en: "A `lib/_<name>` folder with no model: a service, a signal, a dictionary and often a store.",
        ko: "자기 model 없이 service, signal, dictionary, 그리고 흔히 store로 이루어진 `lib/_<name>` 폴더입니다.",
      }),
    },
    {
      name: "model module",
      href: "/conventions/module/overview",
      desc: l.trans({
        en: "A `lib/<model>` folder built around one stored model. Its Util acts on that model's records.",
        ko: "저장되는 model 하나를 중심으로 한 `lib/<model>` 폴더입니다. 이 module의 Util은 그 model의 레코드를 다룹니다.",
      }),
    },
    {
      name: "Util",
      href: "/conventions/module/util",
      desc: l.trans({
        en: "The file role for a small control, such as a button, that runs an endpoint.",
        ko: "버튼처럼 endpoint를 실행하는 작은 컨트롤을 맡는 파일 역할입니다.",
      }),
    },
    {
      name: "client component",
      href: "/docs/arch/frontend#client-boundary",
      desc: l.trans({
        en: 'A file that starts with "use client". It arrives as HTML, then again as JS the browser re-runs.',
        ko: '첫 줄이 "use client"인 파일입니다. HTML로 한 번, 브라우저가 다시 실행하는 JS로 한 번 더 도착합니다.',
      }),
    },
    {
      name: "ui/",
      href: "/conventions/applib/ui",
      desc: l.trans({
        en: "The app or lib folder for components that render JSX and are not bound to one model.",
        ko: "JSX를 그리되 model 하나에 묶이지 않는 컴포넌트를 두는 app·lib의 폴더입니다.",
      }),
    },
  ];

  const whyCards = [
    {
      title: l.trans({ en: "Model Module: Verb And Noun", ko: "model module: 동사와 명사" }),
      desc: l.trans({
        en: "A Util is named for the endpoint verb minus the noun: Serve, Refund, Complete. The button runs the module's own endpoint on the module's own record, so it belongs there.",
        ko: "Util 이름은 Serve, Refund, Complete처럼 endpoint의 동사에서 명사를 뺀 것입니다. 버튼이 이 module의 endpoint를 이 module의 레코드에 실행하므로 module 안에 둡니다.",
      }),
    },
    {
      title: l.trans({ en: "Service Module: Verb Only", ko: "service module: 동사만" }),
      desc: l.trans({
        en: "It has endpoints but no model, so there is no record for the control to belong to. The control usually belongs to the screen that offers it, not to the capability behind it.",
        ko: "endpoint는 있지만 model이 없어서, 컨트롤이 속할 레코드가 없습니다. 그래서 컨트롤은 보통 그 뒤의 기능이 아니라 컨트롤을 보여 주는 화면에 속합니다.",
      }),
    },
  ];

  const placeColumns: MatrixColumn[] = [
    { key: "ui", label: "ui/", code: true },
    { key: "page", label: "page/", code: true },
    { key: "util", label: ".Util.tsx", code: true },
  ];

  const placeGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "Usually", ko: "대부분" }),
      rows: [
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "Not bound to one model", ko: "model 하나에 묶이지 않음" })}
            </span>
          ),
          desc: l.trans({
            en: "A disconnect button, a permission prompt, a map control. The service store only drives it.",
            ko: "연결 끊기 버튼, 권한 요청, 지도 컨트롤입니다. service store는 이를 움직일 뿐입니다.",
          }),
          marks: { ui: true },
        },
        {
          name: <span className="font-sans">{l.trans({ en: "A screen of its own", ko: "자기만의 화면" })}</span>,
          desc: l.trans({
            en: "The OAuth consent screen is a route in `libs/shared/page/oauth`, not a component.",
            ko: "OAuth 동의 화면은 컴포넌트가 아니라 `libs/shared/page/oauth`의 route입니다.",
          }),
          marks: { page: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Rarely", ko: "드물게" }),
      rows: [
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "Meaningless outside this module", ko: "이 module 밖에서는 의미 없음" })}
            </span>
          ),
          desc: l.trans({
            en: "It reads this store and calls this endpoint. In `ui/` it would import the module back in.",
            ko: "이 store를 읽고 이 endpoint를 부릅니다. `ui/`에 두면 module을 도로 import해야 합니다.",
          }),
          marks: { util: true },
        },
      ],
    },
  ];

  const fileRuleRows: IntroItem[] = [
    {
      name: '"use client"',
      desc: l.trans({
        en: "Line 1, above the imports, in every `.Util.tsx`. A Util is always a client component.",
        ko: "모든 `.Util.tsx`의 1행, import 위에 둡니다. Util은 언제나 클라이언트 컴포넌트입니다.",
      }),
    },
    {
      name: "Print",
      desc: l.trans({
        en: "The endpoint `printReceipt` minus its noun. Callers write `<Receipt.Util.Print>`.",
        ko: "endpoint `printReceipt`에서 명사를 뺀 동사입니다. 쓰는 쪽에서는 `<Receipt.Util.Print>`로 부릅니다.",
      }),
    },
    {
      name: "interface PrintProps",
      desc: l.trans({
        en: "Sits right above the component with `className` first, and is not exported.",
        ko: "컴포넌트 바로 위에 두고 `className`을 첫 prop으로 쓰며, export하지 않습니다.",
      }),
    },
    {
      name: "icecreamOrderId: string",
      desc: l.trans({
        en: "An id, not the order. A `cnst` model prop arrives on the client as a plain object, methods stripped.",
        ko: "주문 객체가 아니라 id를 받습니다. `cnst` model을 prop으로 넘기면 method가 모두 빠진 평범한 객체로 도착합니다.",
      }),
    },
    {
      name: 'st.tool("printReceipt")',
      href: "/docs/arch/agentic#agent-surface",
      desc: l.trans({
        en: "Publishes the button to the in-page agent, so a click and the agent run one handler.",
        ko: "버튼을 인페이지 에이전트에 공개합니다. 사용자의 클릭과 에이전트가 같은 핸들러를 실행합니다.",
      }),
    },
    {
      name: 'l("receipt.print")',
      href: "/conventions/service/dictionary",
      desc: l.trans({
        en: "The label comes from the module's dictionary, never from a string literal.",
        ko: "라벨은 문자열 리터럴이 아니라 module의 dictionary에서 가져옵니다.",
      }),
    },
  ];

  const roleColumns: MatrixColumn[] = [
    { key: "model", label: "model module", caption: "lib/<model>" },
    { key: "service", label: "service module", caption: "lib/_<name>" },
  ];

  const roleGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "Roles that need a model", ko: "model이 있어야 하는 역할" }),
      rows: [
        {
          name: ".Template.tsx",
          desc: l.trans({ en: "Binds to a model's form state.", ko: "model의 form state에 묶입니다." }),
          marks: { model: true },
        },
        {
          name: ".Unit.tsx",
          desc: l.trans({
            en: "Renders one light model, such as a list card.",
            ko: "목록 카드처럼 light model 하나를 그립니다.",
          }),
          marks: { model: true },
        },
        {
          name: ".View.tsx",
          desc: l.trans({
            en: "Renders one full model, such as a detail screen.",
            ko: "상세 화면처럼 full model 하나를 그립니다.",
          }),
          marks: { model: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Roles that need no model", ko: "model이 없어도 되는 역할" }),
      rows: [
        {
          name: ".Util.tsx",
          desc: l.trans({ en: "One client control.", ko: "클라이언트 컨트롤 하나입니다." }),
          marks: { model: true, service: true },
        },
        {
          name: ".Zone.tsx",
          desc: l.trans({
            en: "One client section a page drops in whole.",
            ko: "page가 통째로 끼워 넣는 클라이언트 구획 하나입니다.",
          }),
          marks: { model: true, service: true },
        },
      ],
    },
  ];

  const relatedLinks: LinkGridItem[] = [
    {
      href: "/conventions/service/zone",
      title: "Service.Zone.tsx",
      desc: l.trans({
        en: "The other component role, for a whole section.",
        ko: "구획 하나를 통째로 맡는 나머지 컴포넌트 역할입니다.",
      }),
    },
    {
      href: "/conventions/module/util",
      title: "Model.Util.tsx",
      desc: l.trans({
        en: "The common case: a control bound to one model's records.",
        ko: "흔한 경우인, model 하나의 레코드에 묶인 컨트롤입니다.",
      }),
    },
    {
      href: "/conventions/applib/ui",
      title: "ui/",
      desc: l.trans({
        en: "Where most service-driven controls actually live.",
        ko: "service store가 움직이는 컨트롤 대부분이 실제로 놓이는 곳입니다.",
      }),
    },
    {
      href: "/conventions/service/store",
      title: "service.store.ts",
      desc: l.trans({
        en: "The store keys and actions a Util reads and calls.",
        ko: "Util이 읽는 store key와 부르는 액션입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-util" title="Service.Util.tsx">
        <Docs.Title>Service.Util.tsx</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Service.Util.tsx</code> holds a small client control, such as a button, that runs one of a
                  service module's endpoints. Not one of the eight service modules in this workspace has this file, and
                  that is by design, not a gap waiting to be filled.
                </span>
              ),
              ko: (
                <span>
                  <code>Service.Util.tsx</code>는 service module의 endpoint 하나를 실행하는 버튼 같은 작은 클라이언트
                  컨트롤을 담습니다. 이 워크스페이스의 service module 여덟 개 중 이 파일을 가진 것은 하나도 없습니다.
                  언젠가 채워야 할 빈칸이 아니라 의도된 결과입니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "This page explains why the file is rare, where the control goes instead, and what it takes for yours to be the exception.",
              ko: "이 문서는 이 파일이 왜 드문지, 대신 컨트롤을 어디에 두는지, 그리고 예외가 되려면 무엇이 필요한지를 다룹니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

          <Docs.SubSubTitle>{l.trans({ en: "Why it is rare", ko: "왜 드문가" })}</Docs.SubSubTitle>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {whyCards.map((card, idx) => (
              <div key={idx} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{card.title}</div>
                <div className="mt-1 text-foreground/70 text-sm">{card.desc}</div>
              </div>
            ))}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Where the control goes", ko: "컨트롤을 둘 곳" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Start from what the control is bound to. Most controls land in <code>ui/</code> or <code>page/</code>,
                  and only the last row earns a Util:
                </span>
              ),
              ko: (
                <span>
                  컨트롤이 무엇에 묶여 있는지부터 봅니다. 대부분은 <code>ui/</code>나 <code>page/</code>로 가고, 마지막
                  줄만 Util이 됩니다:
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "The control is", ko: "컨트롤의 성격" })}
            columns={placeColumns}
            groups={placeGroups}
            markLabel={l.trans({ en: "Goes here", ko: "여기에 둡니다" })}
            emptyLabel={l.trans({ en: "Not here", ko: "여기가 아닙니다" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>ui/</code> is the default.
                    </strong>{" "}
                    Rendering JSX without being bound to one model is the <code>ui/</code> admission test, word for
                    word. The map in <code>libs/util/ui/MapView</code> reads the <code>_util</code> store this way.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      기본 자리는 <code>ui/</code>입니다.
                    </strong>{" "}
                    model 하나에 묶이지 않고 JSX를 그린다는 것이 <code>ui/</code>에 들어갈 조건 그대로입니다.{" "}
                    <code>libs/util/ui/MapView</code>의 지도가 이렇게 <code>_util</code> store를 읽습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A screen of its own is a route.</strong> <code>_oauth</code> ships ten endpoints and zero
                    components, because its one screen is the consent route.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>자기 화면이 있으면 route입니다.</strong> <code>_oauth</code>는 endpoint 열 개를 내보내지만
                    컴포넌트는 하나도 없습니다. 유일한 화면이 동의 route이기 때문입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A Util only when all three hold.</strong> It reads this store, calls this endpoint, and
                    moving it to <code>ui/</code> would mean importing the module back in.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>세 가지가 모두 맞을 때만 Util입니다.</strong> 이 store를 읽고, 이 endpoint를 부르며,{" "}
                    <code>ui/</code>로 옮기면 module을 도로 import해야 하는 경우입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="shape" title={l.trans({ en: "The Shape, If You Write One", ko: "직접 쓴다면, 이런 모양" })}>
        <Docs.Title>{l.trans({ en: "The Shape, If You Write One", ko: "직접 쓴다면, 이런 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A Util is always a client component, so <code>{'"use client"'}</code> goes on line 1, above the
                  imports. Its export is a role name, and in a service module that role is the endpoint's verb.
                </span>
              ),
              ko: (
                <span>
                  Util은 언제나 클라이언트 컴포넌트이므로 import 위 1행에 <code>{'"use client"'}</code>를 적습니다.
                  export는 역할 이름이고, service module에서 그 역할은 endpoint의 동사입니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A receipt module's print button, which runs the <code>printReceipt</code> endpoint:
                </span>
              ),
              ko: (
                <span>
                  영수증 module의 인쇄 버튼입니다. <code>printReceipt</code> endpoint를 실행합니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/_receipt/Receipt.Util.tsx"
            code={`"use client";

import { st, usePage } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { Button } from "akanjs/ui";

interface PrintProps {
  className?: string;
  icecreamOrderId: string;
}
export const Print = ({ className, icecreamOrderId }: PrintProps) => {
  const { l } = usePage();
  const isPrinting = st.use.isPrinting();
  const print = st
    .tool("printReceipt")
    .desc("Print the receipt of one ice cream order.")
    .arg("icecreamOrderId", ID)
    .exec((id) => st.do.printReceipt(id));
  return (
    <Button
      className={className}
      disabled={isPrinting}
      onClick={() => print(icecreamOrderId)}
    >
      {l("receipt.print")}
    </Button>
  );
};`}
          />
          <Docs.SubSubTitle>{l.trans({ en: "The rules in the file", ko: "파일에 담긴 규칙" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Part", ko: "부분" })} items={fileRuleRows} />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Keep a Util to the control and the one line of text it needs.</strong> Markup in a client file
                  ships twice, as HTML and again as bundled JS the browser re-runs. A panel, a layout or a list is
                  server work: put it in a server component and take it as <code>children</code>.
                </span>
              ),
              ko: (
                <span>
                  <strong>Util에는 컨트롤과 거기 필요한 한 줄 문구만 둡니다.</strong> 클라이언트 파일의 마크업은 HTML로
                  한 번, 브라우저가 다시 실행하는 번들 JS로 한 번, 모두 두 번 전송됩니다. 패널, 레이아웃, 목록은 서버의
                  일이니 서버 컴포넌트로 만들어 <code>children</code>으로 받으세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="allowlist" title={l.trans({ en: "Two Component Roles", ko: "컴포넌트 역할은 둘뿐" })}>
        <Docs.Title>{l.trans({ en: "Two Component Roles", ko: "컴포넌트 역할은 둘뿐" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A service module folder has exactly two component roles: <code>Service.Util.tsx</code> and{" "}
                  <code>Service.Zone.tsx</code>. There is no Template, no Unit and no View.
                </span>
              ),
              ko: (
                <span>
                  service module 폴더의 컴포넌트 역할은 <code>Service.Util.tsx</code>와 <code>Service.Zone.tsx</code> 딱
                  둘입니다. Template, Unit, View는 없습니다.
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Role", ko: "역할" })}
            columns={roleColumns}
            groups={roleGroups}
            markLabel={l.trans({ en: "Allowed", ko: "둘 수 있음" })}
            emptyLabel={l.trans({ en: "Not allowed", ko: "둘 수 없음" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The missing three all need a model.</strong> A service module has no form state to bind and
                    no light or full model to render.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>빠진 세 역할은 모두 model이 있어야 합니다.</strong> service module에는 묶일 form state도,
                    그릴 light model이나 full model도 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Both remaining roles are client components.</strong> What is left is one client control and
                    one client section, each with <code>{'"use client"'}</code> on line 1.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>남은 두 역할은 모두 클라이언트 컴포넌트입니다.</strong> 클라이언트 컨트롤 하나와 클라이언트
                    구획 하나가 남고, 둘 다 1행에 <code>{'"use client"'}</code>가 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Related pages", ko: "함께 볼 페이지" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={relatedLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
