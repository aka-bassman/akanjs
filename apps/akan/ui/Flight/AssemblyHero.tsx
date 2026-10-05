import { usePage } from "@apps/akan/client";
import { Link } from "akanjs/ui";
import { BsArrowDown, BsArrowRight } from "react-icons/bs";
import { flightButtonRecipe } from "../Recipe";
import { FlightCopy } from "./FlightCopy";
import { SheetLabel } from "./SheetLabel";
import { SpecSheet } from "./SpecSheet";

export const AssemblyHero = () => {
  const { l } = usePage();
  return (
    <div className="relative flex min-h-svh flex-col justify-end px-6 pt-[calc(4.5rem+min(112vw,64svh)*0.86)] pb-10 sm:px-10 lg:justify-center lg:px-14 lg:pt-24 lg:pb-16 xl:px-20">
      <div className="pointer-events-none absolute inset-x-0 top-[calc(4.5rem+min(112vw,64svh)*0.62)] bottom-0 bg-linear-to-b from-transparent via-25% via-navy/90 to-navy [mask-image:linear-gradient(to_bottom,black_82%,transparent)] lg:hidden" />
      <div className="relative max-w-xl lg:max-w-[30rem] xl:max-w-[32rem] 2xl:max-w-[36rem]">
        <Link
          href="/blog/v3release"
          className="flt-intro inline-flex items-center gap-2.5 bg-line/8 px-3 py-1.5 font-hud text-[11px] text-foreground/85 ring-1 ring-line/25 ring-inset transition hover:bg-line/14"
        >
          <span className="flt-blink size-1.5 rounded-full bg-burn" />
          {l.trans({
            en: "New · Akan.js v3 — agents join the full stack",
            ko: "New · Akan.js v3 — 풀스택에 에이전트까지",
          })}
          <BsArrowRight />
        </Link>
        <SheetLabel className="flt-intro mt-7 [--intro-delay:80ms]" sheet="01">
          {l.trans({ en: "AK-3 flight manual · Powerplant", ko: "AK-3 비행 교범 · 동력장치" })}
        </SheetLabel>
        <h1 className="mt-4">
          <span className="flt-intro block font-bold font-tech text-[clamp(4.25rem,10vw,8.75rem)] uppercase leading-[0.86] tracking-[-0.01em] [--intro-delay:140ms]">
            Akan<span className="text-burn">.</span>js
          </span>
          <span className="flt-intro mt-4 block font-black text-[2rem] leading-[1.08] tracking-[-0.03em] [--intro-delay:220ms] sm:text-5xl">
            {l.trans({ en: "One line. Full thrust.", ko: "한 줄로, 최대 추력." })}
          </span>
        </h1>
        <p className="flt-intro mt-5 max-w-lg text-[0.9375rem] text-foreground/70 leading-7 [--intro-delay:300ms] sm:text-lg sm:leading-8">
          {l.trans({
            en: "Every jet is built around its engine. In Akan.js the engine is the line you write — and the database, API, screens, apps and the tools agents use are assembled around it.",
            ko: "모든 전투기는 엔진을 중심으로 조립됩니다. Akan.js의 엔진은 당신이 쓰는 한 줄이고, DB와 API, 화면과 앱, 에이전트가 쓰는 도구까지 모두 그 둘레에 조립됩니다.",
          })}
        </p>
        <div className="flt-intro mt-8 flex flex-col gap-3 [--intro-delay:380ms] sm:flex-row sm:items-center">
          <Link href="/docs/intro/quickstart" className={flightButtonRecipe({ tone: "burn", size: "lg" })}>
            {l.trans({ en: "Get started", ko: "시작하기" })} <BsArrowRight />
          </Link>
          <FlightCopy />
        </div>
        <p className="flt-intro mt-4 text-foreground/50 text-sm leading-6 [--intro-delay:440ms]">
          {l.trans({
            en: "Paste it into Claude Code or Codex, and it sets up the workspace and starts your app.",
            ko: "Claude Code나 Codex에 붙여 넣으면 워크스페이스를 만들고 앱까지 띄워 줍니다.",
          })}{" "}
          <a
            href="#start"
            className="font-semibold text-foreground/75 underline-offset-4 hover:text-foreground hover:underline"
          >
            {l.trans({ en: "See the prompt or the terminal command", ko: "프롬프트와 터미널 명령 보기" })} ↓
          </a>
        </p>
      </div>
      <SpecSheet className="flt-intro absolute top-28 right-10 hidden w-72 [--intro-delay:520ms] 2xl:right-16 min-[1400px]:block" />
      <p className="flt-intro relative mt-10 flex items-center gap-3 font-hud text-[11px] text-line/80 uppercase tracking-[0.24em] [--intro-delay:600ms] lg:absolute lg:bottom-10 lg:left-14 xl:left-20">
        <BsArrowDown className="flt-blink" />
        {l.trans({ en: "Scroll to assemble", ko: "스크롤하면 조립됩니다" })}
      </p>
    </div>
  );
};
