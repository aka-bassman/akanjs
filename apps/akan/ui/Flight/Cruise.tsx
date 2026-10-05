import { usePage } from "@apps/akan/client";
import { Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";
import { flightButtonRecipe } from "../Recipe";
import { Film } from "./Film";
import { FlightStart } from "./FlightStart";
import { SheetLabel } from "./SheetLabel";

const linkClassName =
  "flex items-center gap-2 font-hud text-[11px] text-foreground/65 uppercase tracking-[0.16em] hover:text-foreground";

export const Cruise = () => {
  const { l } = usePage();
  return (
    <section id="start" className="flt-day flt-dawn relative scroll-mt-16">
      <div className="relative h-[72svh] min-h-[26rem] overflow-hidden">
        <Film
          className="absolute inset-0 size-full object-cover [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_70%,transparent)]"
          poster="/flight/flyaway-first.webp"
          src="/flight/flyaway.mp4"
          wideSrc="/flight/flyaway-1080.mp4"
        />
        <p className="absolute right-6 bottom-[18%] font-hud text-[10px] text-foreground/55 uppercase tracking-[0.2em] sm:right-10">
          {l.trans({ en: "Cruise · climbing into daylight", ko: "순항 · 햇빛 속으로 상승" })}
        </p>
      </div>
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-4 pb-28 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-14 xl:px-20">
        <div>
          <SheetLabel className="text-line" sheet="13">
            {l.trans({
              en: "The TypeScript framework, agents included.",
              ko: "에이전트까지 들어 있는 TypeScript 프레임워크.",
            })}
          </SheetLabel>
          <h2 className="mt-6 text-balance font-black text-5xl leading-[1.02] sm:text-7xl">
            <span className="block">{l.trans({ en: "Start with one line.", ko: "한 줄로 시작하세요." })}</span>
            <span className="block text-burn">{l.trans({ en: "Cleared for takeoff.", ko: "이륙을 허가합니다." })}</span>
          </h2>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg leading-8">
            {l.trans({
              en: "Hand one prompt to your coding agent, or run one command yourself, and the workspace is ready. The next line you write ships to web, iOS, Android, desktop, your server and database — and to every agent your users talk to.",
              ko: "코딩 에이전트에게 프롬프트 하나를 건네거나 명령어 한 줄을 직접 실행하면 워크스페이스가 준비됩니다. 그다음 당신이 쓰는 한 줄이 웹, iOS, Android, 데스크톱, 서버와 DB, 그리고 사용자가 쓰는 모든 에이전트에게 닿습니다.",
            })}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/docs/intro/quickstart" className={flightButtonRecipe({ tone: "day", size: "lg" })}>
              {l.trans({ en: "Get started", ko: "시작하기" })} <BsArrowRight />
            </Link>
            <Link href="/cheatsheet/interface/agent-chat" className={linkClassName}>
              {l.trans({ en: "In-page agent", ko: "인페이지 에이전트" })} <BsArrowRight />
            </Link>
            <Link href="/cheatsheet/interface/mcp" className={linkClassName}>
              MCP <BsArrowRight />
            </Link>
            <Link href="/cases" className={linkClassName}>
              {l.trans({ en: "Case Studies", ko: "적용사례" })} <BsArrowRight />
            </Link>
          </div>
          <p className="mt-12 font-bold text-foreground/75">
            {l.trans({ en: "Read for humans.", ko: "읽는 건 사람이," })}{" "}
            <span className="text-burn">{l.trans({ en: "Write for agents.", ko: "쓰는 건 에이전트가." })}</span>
          </p>
        </div>
        <FlightStart className="lg:pt-16" />
      </div>
    </section>
  );
};
