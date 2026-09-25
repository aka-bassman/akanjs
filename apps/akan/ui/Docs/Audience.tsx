import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";
import { LuBot, LuUserRound } from "react-icons/lu";

export type Audience = "human" | "both" | "agent";

const audiences = ["human", "both", "agent"] as const;

const audienceColors: { [key in Audience]: string } = {
  human: "text-accent",
  both: "text-primary",
  agent: "text-foreground/35",
} as const;

interface AkanMarkProps {
  className?: string;
}
const AkanMark = ({ className }: AkanMarkProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3.1 21 11.2 2.3 20.4 21.3 2.3 12.3 21.9 3.3" />
    </svg>
  );
};

const audienceIcons = { human: LuUserRound, both: AkanMark, agent: LuBot } as const;

const useAudienceText = () => {
  const { l } = usePage();
  return {
    human: {
      label: l.trans({ en: "You", ko: "사람" }),
      desc: l.trans({
        en: "Business rules and flows you own. Read these yourself.",
        ko: "직접 정하고 책임지는 비즈니스 규칙과 흐름. 직접 읽어보세요.",
      }),
    },
    both: {
      label: l.trans({ en: "Both", ko: "함께" }),
      desc: l.trans({
        en: "Know the idea; your agent follows the details.",
        ko: "개념은 알아두고, 세부 규칙은 에이전트가 따릅니다.",
      }),
    },
    agent: {
      label: l.trans({ en: "Agent", ko: "에이전트" }),
      desc: l.trans({
        en: "Conventions and references your agent follows. Look up as needed.",
        ko: "에이전트가 따르는 규칙과 레퍼런스. 필요할 때 찾아보세요.",
      }),
    },
  };
};

interface AudienceIconProps {
  className?: string;
  audience: Audience;
}
export const AudienceIcon = ({ className, audience }: AudienceIconProps) => {
  const text = useAudienceText()[audience];
  const Icon = audienceIcons[audience];
  return (
    <span role="img" aria-label={text.label} title={text.desc} className="flex shrink-0">
      <Icon className={cn("size-3.5", audienceColors[audience], className)} />
    </span>
  );
};

interface AudienceLegendProps {
  className?: string;
}
export const AudienceLegend = ({ className }: AudienceLegendProps) => {
  const text = useAudienceText();
  return (
    <details className={cn("group rounded-xl border border-foreground/10 px-3 py-2 text-xs", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-3 text-foreground/60 [&::-webkit-details-marker]:hidden">
        {audiences.map((audience) => (
          <span key={audience} className="flex items-center gap-1">
            <AudienceIcon audience={audience} />
            {text[audience].label}
          </span>
        ))}
        <span className="ml-auto text-foreground/40 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-2 space-y-1.5 break-keep border-foreground/10 border-t pt-2 text-foreground/60 leading-snug">
        {audiences.map((audience) => (
          <div key={audience} className="flex gap-2">
            <AudienceIcon audience={audience} className="mt-px" />
            <span>
              <span className="font-semibold text-foreground/80">{text[audience].label}</span> — {text[audience].desc}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
};
