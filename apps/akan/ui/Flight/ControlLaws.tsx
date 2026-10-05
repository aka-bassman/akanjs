import { usePage } from "@apps/akan/client";
import { flightPanelRecipe } from "../Recipe";
import { SheetLabel } from "./SheetLabel";

type Verdict = "yes" | "ask" | "off";

interface LawRow {
  action: string;
  endpoint: string;
  guards: string;
  verdicts: Verdict[];
}

export const ControlLaws = () => {
  const { l } = usePage();
  const crews = [
    { label: l.trans({ en: "Person", ko: "사람" }), short: l.trans({ en: "Person", ko: "사람" }) },
    {
      label: l.trans({ en: "In-page agent", ko: "인페이지 에이전트" }),
      short: l.trans({ en: "Agent", ko: "에이전트" }),
    },
    { label: l.trans({ en: "AI over MCP", ko: "MCP로 부르는 AI" }), short: "MCP" },
  ];
  const rows: LawRow[] = [
    {
      action: l.trans({ en: "Place an order", ko: "주문하기" }),
      endpoint: "createIcecreamOrder",
      guards: "[Every]",
      verdicts: ["yes", "ask", "yes"],
    },
    {
      action: l.trans({ en: "Serve an order", ko: "서빙 처리" }),
      endpoint: "serveIcecreamOrder",
      guards: "[Admin]",
      verdicts: ["yes", "yes", "yes"],
    },
    {
      action: l.trans({ en: "See today's sales", ko: "오늘 매출 보기" }),
      endpoint: "icecreamOrderSummary",
      guards: "[Admin]",
      verdicts: ["yes", "yes", "yes"],
    },
    {
      action: l.trans({ en: "Refund an order", ko: "환불하기" }),
      endpoint: "refundIcecreamOrder",
      guards: "[Every, Person]",
      verdicts: ["yes", "yes", "off"],
    },
    {
      action: l.trans({ en: "Remove an order", ko: "주문 삭제" }),
      endpoint: "removeIcecreamOrder",
      guards: "[Admin]",
      verdicts: ["yes", "ask", "yes"],
    },
  ];
  const verdictView = {
    yes: (
      <span className="inline-flex items-center gap-1.5 font-hud text-[11px] text-hud uppercase tracking-[0.12em]">
        <span className="size-1.5 bg-hud" />
        <span className="max-sm:sr-only">{l.trans({ en: "cleared", ko: "허가" })}</span>
      </span>
    ),
    ask: (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-caution/12 px-1.5 py-0.5 font-hud text-[10px] text-caution uppercase tracking-[0.1em] ring-1 ring-caution/40 ring-inset sm:px-2 sm:text-[11px] sm:tracking-[0.12em]">
        <span className="sm:hidden">{l.trans({ en: "ask", ko: "묻기" })}</span>
        <span className="max-sm:hidden">{l.trans({ en: "asks first", ko: "먼저 묻기" })}</span>
      </span>
    ),
    off: (
      <span className="inline-flex items-center gap-1.5 font-hud text-[11px] text-foreground/40 uppercase tracking-[0.12em]">
        <span className="h-px w-3 bg-foreground/40" />
        <span className="max-sm:sr-only">{l.trans({ en: "not on the shelf", ko: "목록에 없음" })}</span>
      </span>
    ),
  };
  const placards = [
    {
      title: l.trans({ en: "Refusals give nothing away", ko: "거절은 아무것도 드러내지 않습니다" }),
      body: l.trans({
        en: "A tool an agent may not use answers exactly like one that doesn't exist, so the shelf leaks nothing.",
        ko: "에이전트가 쓸 수 없는 툴은 처음부터 없는 툴과 똑같이 답하므로, 목록이 아무것도 흘리지 않습니다.",
      }),
    },
    {
      title: l.trans({ en: "Rate-limited per caller", ko: "호출자마다 속도 제한" }),
      body: l.trans({
        en: "MCP calls are capped at 120 a minute and 8 at once for each caller.",
        ko: "MCP 호출은 호출자마다 분당 120번, 동시에 8개로 묶입니다.",
      }),
    },
    {
      title: l.trans({ en: "Secrets stay home", ko: "비밀은 밖으로 나가지 않습니다" }),
      body: l.trans({
        en: "Hidden and secret fields are stripped before anything reaches a model.",
        ko: "hidden·secret 필드는 모델에 닿기 전에 빠집니다.",
      }),
    },
    {
      title: l.trans({ en: "Connections end when you say", ko: "연결은 언제든 끝낼 수 있습니다" }),
      body: l.trans({
        en: "Revoke a connection and its next call is refused. The chat relay keeps no session and no transcript.",
        ko: "연결을 해지하면 다음 호출부터 거절됩니다. 채팅 릴레이는 세션도 대화도 남기지 않습니다.",
      }),
    },
  ];
  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div>
            <SheetLabel sheet="08">
              {l.trans({ en: "Flight control laws · Guard → everyone", ko: "비행 제어 법칙 · 가드 → 모두" })}
            </SheetLabel>
            <h2 className="mt-6 text-balance font-black text-4xl leading-tight sm:text-6xl">
              {l.trans({ en: "One rule. Three kinds of users.", ko: "규칙은 하나, 사용자는 셋." })}
            </h2>
            <p className="mt-6 max-w-xl text-foreground/65 leading-7 sm:text-lg sm:leading-8">
              {l.trans({
                en: "You write a guard once per endpoint. Like fly-by-wire limits, it holds the same envelope whoever is flying — a person on the screen, the agent in their tab, or an AI calling over MCP.",
                ko: "가드는 엔드포인트마다 한 번 씁니다. 플라이바이와이어의 비행 한계처럼, 누가 조종하든 같은 한계를 지킵니다. 화면 앞의 사람이든, 그 사람 탭 안의 에이전트든, MCP로 부르는 AI든.",
              })}
            </p>
          </div>
          <div className="flt-reveal">
            <div className={flightPanelRecipe({ tone: "sheet", padding: "none", ticks: true }, "overflow-x-auto")}>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-line/15 border-b font-hud text-[10px] text-line/70 uppercase tracking-[0.16em]">
                    <th className="py-3 pr-2 pl-4 font-normal sm:px-5">{l.trans({ en: "Action", ko: "동작" })}</th>
                    {crews.map(({ label, short }) => (
                      <th className="px-2 py-3 font-normal sm:px-3" key={label}>
                        <span className="sm:hidden">{short}</span>
                        <span className="max-sm:hidden">{label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ action, endpoint, guards, verdicts }) => (
                    <tr className="border-line/8 border-b last:border-b-0" key={endpoint}>
                      <td className="py-3.5 pr-2 pl-4 sm:px-5">
                        <p className="font-semibold">{action}</p>
                        <p className="mt-0.5 break-all font-hud text-[10px] text-foreground/45 sm:text-[10.5px]">
                          {endpoint} <span className="whitespace-nowrap text-burn/80">{guards}</span>
                        </p>
                      </td>
                      {verdicts.map((verdict, idx) => (
                        <td className="px-2 py-3.5 sm:px-3" key={crews[idx]?.label}>
                          {verdictView[verdict]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-hud text-[10.5px] text-foreground/45 leading-5">
              {l.trans({
                en: "asks first — the in-page tool waits on an approval card · not on the shelf — the endpoint never reaches MCP",
                ko: "먼저 묻기 — 인페이지 툴이 승인 카드에서 기다립니다 · 목록에 없음 — 엔드포인트가 MCP에 올라가지 않습니다",
              })}
            </p>
          </div>
        </div>
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {placards.map(({ title, body }, idx) => (
            <li className={flightPanelRecipe({ tone: "glass", padding: "md" }, "flt-reveal")} key={title}>
              <p className="flex items-center justify-between font-hud text-[10px] text-line/60 uppercase tracking-[0.18em]">
                <span>
                  {l.trans({ en: "Placard", ko: "표지" })} 08-{String.fromCharCode(65 + idx)}
                </span>
                <span className="flt-hatch h-2 w-10" />
              </p>
              <p className="mt-4 font-bold">{title}</p>
              <p className="mt-2 text-foreground/60 text-sm leading-6">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
