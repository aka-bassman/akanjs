import { usePage } from "@apps/akan/client";
import { cn } from "akanjs/client";

interface StageRailProps {
  className?: string;
}
export const StageRail = ({ className }: StageRailProps) => {
  const { l } = usePage();
  const ticks = [
    l.trans({ en: "Engine", ko: "엔진" }),
    l.trans({ en: "Airframe", ko: "기체" }),
    l.trans({ en: "Wings", ko: "주익" }),
    l.trans({ en: "Cockpit", ko: "조종석" }),
    l.trans({ en: "Ready", ko: "완성" }),
  ];
  return (
    <div className={cn("pointer-events-none flex flex-col items-end gap-3 font-hud text-[10px] uppercase", className)}>
      <p className="flt-pct mb-2 text-line/80 tracking-[0.2em]">{l.trans({ en: "Assembly ", ko: "조립 " })}</p>
      {ticks.map((label, idx) => (
        <div className="flex items-center gap-3" key={label}>
          <span className="flt-rail-label text-foreground tracking-[0.18em]" data-tick={idx + 1}>
            {String(idx + 1).padStart(2, "0")} {label}
          </span>
          <span className="flt-rail-tick block h-px w-4" data-tick={idx + 1} />
        </div>
      ))}
    </div>
  );
};
