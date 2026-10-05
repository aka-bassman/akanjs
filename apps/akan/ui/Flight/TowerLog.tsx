import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";

const seqDelay = {
  0: "[--i:0]",
  1: "[--i:1]",
  2: "[--i:2]",
  3: "[--i:3]",
  4: "[--i:4]",
  5: "[--i:5]",
  6: "[--i:6]",
  7: "[--i:7]",
} as const;

const toneClassName = {
  out: "text-foreground/85",
  in: "text-line",
  ok: "text-hud",
  deny: "text-caution",
} as const;

interface TowerLine {
  time: string;
  from: string;
  to: string;
  text: string;
  tone: keyof typeof toneClassName;
}

interface TowerLogProps {
  className?: string;
}
export const TowerLog = ({ className }: TowerLogProps) => {
  const { l } = usePage();
  const lines: TowerLine[] = [
    { time: "09:10:02", from: "CLAUDE", to: "TWR", text: "initialize · https://your.app/mcp", tone: "out" },
    {
      time: "09:10:02",
      from: "TWR",
      to: "CLAUDE",
      text: l.trans({ en: "401 · sign in on your.app (OAuth 2.1)", ko: "401 · your.app에서 로그인 (OAuth 2.1)" }),
      tone: "in",
    },
    {
      time: "09:10:14",
      from: "OWNER",
      to: "",
      text: l.trans({ en: "consent ✓ · this account only, revocable", ko: "동의 ✓ · 이 계정만, 언제든 해지" }),
      tone: "ok",
    },
    {
      time: "09:10:15",
      from: "TWR",
      to: "CLAUDE",
      text: l.trans({ en: "cleared · tools/list → 4 tools", ko: "허가 · tools/list → 툴 4개" }),
      tone: "in",
    },
    { time: "09:10:31", from: "CLAUDE", to: "TWR", text: 'serveIcecreamOrder { id: "A-102" }', tone: "out" },
    {
      time: "09:10:31",
      from: "TWR",
      to: "CLAUDE",
      text: l.trans({ en: "ok · the open board updates live", ko: "완료 · 열려 있는 보드가 실시간으로 갱신" }),
      tone: "in",
    },
    { time: "09:10:44", from: "CLAUDE", to: "TWR", text: "refundIcecreamOrder { … }", tone: "out" },
    { time: "09:10:44", from: "TWR", to: "CLAUDE", text: "unknown tool", tone: "deny" },
  ];
  return (
    <div className={cn("flt-seq bg-screen ring-1 ring-line/20", className)}>
      <p className="flex items-center justify-between border-line/15 border-b px-4 py-2.5 font-hud text-[11px] text-line/70 uppercase tracking-[0.16em]">
        <span className="flex items-center gap-2">
          <span className="flt-blink size-1.5 rounded-full bg-hud" />
          {l.trans({ en: "Comms · tower /mcp", ko: "교신 · 관제탑 /mcp" })}
        </span>
        <span>POST /mcp</span>
      </p>
      <ol className="space-y-1.5 overflow-x-auto px-4 py-4 font-hud text-[11px] leading-5 sm:text-xs">
        {lines.map(({ time, from, to, text, tone }, idx) => (
          <li
            className={cn(
              "flt-seq-item grid grid-cols-[4.25rem_7rem_1fr] gap-2 whitespace-nowrap",
              seqDelay[idx as keyof typeof seqDelay],
            )}
            key={`${time}-${idx}`}
          >
            <span className="text-foreground/30">{time}</span>
            <span className="text-foreground/50">
              {from}
              {to ? <span className="text-foreground/30"> → {to}</span> : null}
            </span>
            <span className={toneClassName[tone]}>{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
