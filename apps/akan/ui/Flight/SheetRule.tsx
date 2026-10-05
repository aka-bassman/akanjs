import { cn } from "akanjs/client";

interface SheetRuleProps {
  className?: string;
  sheet: string;
}
export const SheetRule = ({ className, sheet }: SheetRuleProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative mx-auto flex max-w-7xl items-center gap-3 px-6 font-hud text-[10px] text-line/45 uppercase tracking-[0.2em] sm:px-10 lg:px-14 xl:px-20",
        className,
      )}
    >
      <span className="h-3 w-px bg-line/35" />
      <span className="h-px flex-1 bg-[repeating-linear-gradient(to_right,var(--line)_0_18px,transparent_18px_24px,var(--line)_24px_27px,transparent_27px_33px)] opacity-25" />
      <span>DWG AK-3</span>
      <span className="text-burn/80">{sheet} / 13</span>
      <span className="h-3 w-px bg-line/35" />
    </div>
  );
};
