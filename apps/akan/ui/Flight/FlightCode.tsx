import { cn } from "akanjs/client";
import type { BundledLanguage } from "shiki";
import { Code } from "../Code";

interface FlightCodeProps {
  className?: string;
  title: string;
  code: string;
  language?: BundledLanguage;
}
export const FlightCode = ({ className, title, code, language = "typescript" }: FlightCodeProps) => {
  return (
    <figure className={cn("flt-code flt-ticks overflow-hidden border border-line/15 bg-deep/80", className)}>
      <figcaption className="flex items-center justify-between gap-3 border-line/15 border-b bg-line/5 px-4 py-2.5 font-hud text-[11px] uppercase tracking-[0.16em]">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="size-1.5 shrink-0 bg-burn" />
          <span className="truncate text-foreground/85 normal-case tracking-normal">{title}</span>
        </span>
        <span className="shrink-0 text-line/60">src</span>
      </figcaption>
      <div className="overflow-x-auto text-[12.5px] leading-6 sm:text-[13px]">
        <Code.Raw className="px-2 py-4" code={code.trim()} language={language} showLineNumbers />
      </div>
    </figure>
  );
};
