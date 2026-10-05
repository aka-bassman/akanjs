import { usePage } from "@apps/akan/client";
import { Link } from "akanjs/ui";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { FlightMark } from "./FlightMark";

const socialClassName =
  "flex size-11 items-center justify-center text-foreground/70 text-xl ring-1 ring-border ring-inset transition hover:bg-foreground hover:text-background";

export const FlightFooter = () => {
  const { l } = usePage();
  return (
    <footer className="flt-day relative bg-background px-6 pt-6 pb-8 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 border-border border-t pt-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <FlightMark className="size-6 text-burn" />
            <span className="font-bold font-tech text-xl uppercase tracking-[0.1em]">Akan.js</span>
          </Link>
          <p className="mt-3 text-muted-foreground text-sm">
            {l.trans({ en: "Released under the MIT License", ko: "MIT 라이선스 하에 배포되었습니다." })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="https://github.com/akan-team/akanjs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={socialClassName}
          >
            <FaGithub />
          </Link>
          <Link
            href="https://discord.gg/pc228BhWmM"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className={socialClassName}
          >
            <FaDiscord />
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 font-hud text-[10px] text-muted-foreground uppercase tracking-[0.16em] md:flex-row md:justify-between">
        <span>
          {l.trans({
            en: "Copyright © 2026 Akan.js All rights reserved.",
            ko: "Copyright © 2026 Akan.js 모든 권리 보유.",
          })}
        </span>
        <span>
          {l.trans({ en: "System managed by", ko: "시스템 관리자" })}
          <Link href="https://github.com/aka-bassman" target="_blank" rel="noopener noreferrer">
            <span className="ml-1 font-bold text-burn hover:underline">bassman</span>
          </Link>
        </span>
        <span>DWG AK-3 · {l.trans({ en: "End of manual", ko: "교범 끝" })}</span>
      </div>
    </footer>
  );
};
