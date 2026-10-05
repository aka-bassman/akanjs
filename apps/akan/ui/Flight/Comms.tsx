import { usePage } from "@apps/akan/client";
import { Clipboard, Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";
import { flightButtonRecipe, flightPanelRecipe } from "../Recipe";
import { SheetLabel } from "./SheetLabel";

const mcpUrl = "https://akanjs.com/mcp";

export const Comms = () => {
  const { l } = usePage();
  return (
    <section className="flt-dusk relative px-6 pt-28 pb-[38svh] sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto max-w-7xl">
        <SheetLabel sheet="12">{l.trans({ en: "In flight · This site", ko: "비행 중 · 이 사이트" })}</SheetLabel>
        <h2 className="mt-6 text-balance font-black text-4xl leading-tight sm:text-5xl">
          {l.trans({ en: "These docs run on it, too.", ko: "이 문서도 같은 방식으로 돕니다." })}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className={flightPanelRecipe({ tone: "glass", padding: "lg" }, "flt-reveal flex flex-col bg-deep/40")}>
            <p className="font-hud text-[10.5px] text-line uppercase tracking-[0.18em]">
              {l.trans({ en: "Channel 1 · in-page agent", ko: "채널 1 · 인페이지 에이전트" })}
            </p>
            <p className="mt-4 font-black text-2xl">{l.trans({ en: "Ask the docs", ko: "문서에게 물어보기" })}</p>
            <p className="mt-3 text-foreground/70 leading-7">
              {l.trans({
                en: "Every docs page carries the in-page agent. Ask about a topic; it searches the docs and opens the page for you.",
                ko: "모든 문서 페이지에 인페이지 에이전트가 있습니다. 주제를 물으면 문서를 검색해 해당 페이지를 열어 줍니다.",
              })}
            </p>
            <Link href="/docs/intro/quickstart" className={flightButtonRecipe({ tone: "line" }, "mt-8 w-fit")}>
              {l.trans({ en: "Open the docs", ko: "문서 열기" })} <BsArrowRight />
            </Link>
          </div>
          <div className={flightPanelRecipe({ tone: "glass", padding: "lg" }, "flt-reveal flex flex-col bg-deep/40")}>
            <p className="font-hud text-[10.5px] text-line uppercase tracking-[0.18em]">
              {l.trans({ en: "Channel 2 · MCP", ko: "채널 2 · MCP" })}
            </p>
            <p className="mt-4 font-black text-2xl">{l.trans({ en: "Connect your AI", ko: "내 AI 연결하기" })}</p>
            <p className="mt-3 text-foreground/70 leading-7">
              {l.trans({
                en: "akanjs.com answers MCP. Point Claude Code or Cursor at it, and your AI reads these docs while it writes your code.",
                ko: "akanjs.com은 MCP에 응답합니다. Claude Code나 Cursor에 연결하면 AI가 코드를 쓰면서 이 문서를 읽습니다.",
              })}
            </p>
            <div className="mt-8 flex w-fit max-w-full items-center gap-3 bg-screen py-1.5 pr-1.5 pl-4 font-hud text-sm ring-1 ring-line/20 ring-inset">
              <span className="flt-phosphor select-none text-[11px] uppercase tracking-[0.16em]">Freq</span>
              <span className="truncate text-foreground/90">{mcpUrl}</span>
              <Clipboard className="relative shrink-0" text={mcpUrl} />
            </div>
            <p className="mt-4 font-hud text-[10.5px] text-foreground/50">
              listDocPages · searchDocPages · readDocPage
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
