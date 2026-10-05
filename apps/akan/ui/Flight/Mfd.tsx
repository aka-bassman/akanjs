import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";

const softKeyClassName =
  "flex h-7 items-center justify-center bg-deep px-1.5 font-hud text-[9px] text-line/70 uppercase tracking-[0.14em] ring-1 ring-line/20 ring-inset";

interface MfdProps {
  className?: string;
}
export const Mfd = ({ className }: MfdProps) => {
  const { l } = usePage();
  const tools = [
    { name: "setToppingsOnIcecreamOrder", args: "toppings", kind: l.trans({ en: "field", ko: "필드" }) },
    { name: "fillIcecreamOrderForm", args: "patch", kind: l.trans({ en: "form", ko: "폼" }) },
    { name: "createIcecreamOrder", args: "", kind: "confirm" },
  ];
  return (
    <div className={cn("bg-deep p-3 shadow-[0_30px_80px_-40px_black] ring-1 ring-line/20 sm:p-4", className)}>
      <div className="grid grid-cols-4 gap-2 pb-3">
        {["Tools", "State", "Log", "Guard"].map((key) => (
          <span className={softKeyClassName} key={key}>
            {key}
          </span>
        ))}
      </div>
      <div className="flt-seq relative overflow-hidden bg-screen px-4 py-4 font-hud text-[11.5px] leading-6 ring-1 ring-line/15 sm:px-5 sm:text-xs">
        <div className="flt-scanlines absolute inset-0" />
        <p className="relative flex justify-between text-line/70 uppercase tracking-[0.16em]">
          <span>{l.trans({ en: "Bus · icecream order", ko: "버스 · 아이스크림 주문" })}</span>
          <span>{l.trans({ en: "3 tools", ko: "툴 3개" })}</span>
        </p>
        <ul className="relative mt-3 space-y-1 border-line/15 border-y py-3">
          {tools.map(({ name, args, kind }) => (
            <li className="flex items-center gap-2" key={name}>
              <span className="text-line/50">▸</span>
              <span className="flt-phosphor truncate">
                {name}
                <span className="text-hud/50">({args})</span>
              </span>
              {kind === "confirm" ? (
                <span className="ml-auto shrink-0 bg-caution/15 px-1.5 text-[10px] text-caution uppercase tracking-[0.12em] ring-1 ring-caution/40">
                  confirm
                </span>
              ) : (
                <span className="ml-auto shrink-0 text-[10px] text-line/50 uppercase tracking-[0.12em]">{kind}</span>
              )}
            </li>
          ))}
        </ul>
        <ol className="relative mt-3 space-y-1">
          <li className="flt-seq-item text-foreground/85 [--i:0]">
            <span className="text-line/50">{"> "}</span>
            {l.trans({
              en: '"Two scoops, add sprinkles, and order it."',
              ko: '"두 스쿱에 스프링클 올려서 주문해 줘."',
            })}
          </li>
          <li className="flt-seq-item flt-phosphor [--i:1]">
            ▸ setToppingsOnIcecreamOrder(["sprinkles"]) <span className="text-hud">✓</span>
          </li>
          <li className="flt-seq-item text-caution [--i:2]">
            ▸ createIcecreamOrder() <span className="flt-blink">▍</span>
            {l.trans({ en: " waiting for a yes", ko: " 승인 대기" })}
          </li>
          <li className="flt-seq-item flt-phosphor [--i:3]">
            ✓ {l.trans({ en: "approved — same handler, same guards", ko: "승인됨 — 같은 핸들러, 같은 가드" })}
          </li>
        </ol>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-3">
        {["Screen", "Agent", "MCP", "Ack"].map((key) => (
          <span className={softKeyClassName} key={key}>
            {key}
          </span>
        ))}
      </div>
    </div>
  );
};
