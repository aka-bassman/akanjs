import { usePage } from "@apps/akan/client";
import { Link, System } from "akanjs/ui";
import { BsArrowUpRight, BsList } from "react-icons/bs";
import { FaGithub } from "react-icons/fa";
import { flightButtonRecipe } from "../Recipe";
import { FlightMark } from "./FlightMark";

const links = [
  { href: "/docs", label: { en: "Docs", ko: "문서" } },
  { href: "/blog", label: { en: "Blog", ko: "블로그" } },
  { href: "/cases", label: { en: "Case Studies", ko: "적용사례" } },
  { href: "/roadmap", label: { en: "Roadmap", ko: "로드맵" } },
  { href: "https://cloud.akanjs.com", label: { en: "Deploy", ko: "배포" }, target: "_blank" },
] as const;

const navLinkClassName =
  "flex items-center gap-1 px-3 py-2 font-hud text-[11px] text-foreground/70 uppercase tracking-[0.18em] transition hover:text-foreground";

export const FlightHeader = () => {
  const { l } = usePage();
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="flex h-14 items-center gap-4 border-line/12 border-b bg-navy/72 px-4 backdrop-blur-xl backdrop-saturate-150 sm:h-16 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <FlightMark className="size-6 text-burn" />
          <span className="font-bold font-tech text-xl uppercase tracking-[0.1em]">Akan.js</span>
          <span className="hidden px-1.5 py-0.5 font-hud text-[10px] text-line ring-1 ring-line/30 ring-inset sm:inline">
            AK-3
          </span>
        </Link>
        <nav className="ml-4 hidden items-center lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={"target" in link ? link.target : undefined}
              className={navLinkClassName}
            >
              {l.trans(link.label)}
              {"target" in link ? <BsArrowUpRight className="size-2.5" /> : null}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <System.SelectLanguage className="font-hud" languages={["en", "ko"]} />
          <Link
            href="https://github.com/akan-team/akanjs"
            target="_blank"
            aria-label="GitHub"
            className="hidden p-2 text-foreground/70 text-lg transition hover:text-foreground sm:block"
          >
            <FaGithub />
          </Link>
          <Link
            href="/docs/intro/quickstart"
            className={flightButtonRecipe({ tone: "burn", size: "md" }, "hidden h-9 px-4 text-xs sm:inline-flex")}
          >
            {l.trans({ en: "Get started", ko: "시작하기" })}
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex cursor-pointer list-none items-center p-2 text-2xl text-foreground/80 [&::-webkit-details-marker]:hidden">
              <BsList />
            </summary>
            <nav className="absolute top-full right-0 mt-3 flex w-56 flex-col border border-line/15 bg-navy/95 py-2 backdrop-blur-xl">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={"target" in link ? link.target : undefined}
                  className={navLinkClassName}
                >
                  {l.trans(link.label)}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
};
