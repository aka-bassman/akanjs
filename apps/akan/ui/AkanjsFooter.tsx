import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { Clipboard, Link } from "akanjs/ui";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { AkanLogo } from "./AkanLogo";

const mcpUrl = "https://akanjs.com/mcp";

const socialClassName =
  "jelly tint-secondary squish flex size-11 items-center justify-center rounded-full text-secondary-foreground text-xl hover:tint-primary hover:text-primary-foreground";

interface AkanjsFooterProps {
  className?: string;
}
export const AkanjsFooter = ({ className }: AkanjsFooterProps) => {
  const { l } = usePage();
  return (
    <footer className={cn("relative z-10 px-4 pt-12 pb-6 md:px-6", className)}>
      <div className="jelly-glass mx-auto flex max-w-7xl flex-col gap-8 rounded-4xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href="/" className="text-2xl">
              <AkanLogo />
            </Link>
            <p className="text-foreground/55 text-sm">
              {l.trans({ en: "Released under the MIT License", ko: "MIT 라이선스 하에 배포되었습니다." })}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="font-bold text-foreground/70 text-sm">
              {l.trans({ en: "Connect your AI to these docs", ko: "내 AI에 이 문서 연결하기" })}
            </p>
            <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-foreground/6 py-1 pr-1 pl-4 font-mono text-xs">
              <span className="select-none font-bold text-primary">MCP</span>
              <span className="truncate text-foreground/80">{mcpUrl}</span>
              <Clipboard className="relative shrink-0" text={mcpUrl} />
            </div>
          </div>
          <div className="flex gap-3">
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
        <div className="flex flex-col items-center gap-x-6 gap-y-1.5 border-foreground/8 border-t pt-6 text-center text-foreground/50 text-xs md:flex-row md:flex-wrap md:justify-between md:text-sm">
          <span className="hidden">
            {l.trans({ en: "Official Akan.js Consulting on", ko: "Akan.js 공식 컨설팅 서비스" })}
            <Link href="https://soft.akanjs.com" target="_blank" rel="noopener noreferrer">
              <span className="ml-1 font-bold text-primary hover:underline">Akansoft</span>
            </Link>
          </span>
          <span>
            {l.trans({
              en: "Copyright © 2026 Akan.js All rights reserved.",
              ko: "Copyright © 2026 Akan.js 모든 권리 보유.",
            })}
          </span>
          <span>
            {l.trans({ en: "System managed by", ko: "시스템 관리자" })}
            <Link href="https://github.com/aka-bassman" target="_blank" rel="noopener noreferrer">
              <span className="ml-1 font-bold text-primary hover:underline">bassman</span>
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
};
