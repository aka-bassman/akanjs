import { cn } from "akanjs/client";
import type { ReactNode } from "react";

interface SheetLabelProps {
  className?: string;
  sheet: string;
  children: ReactNode;
}
export const SheetLabel = ({ className, sheet, children }: SheetLabelProps) => {
  return (
    <p className={cn("flex items-center gap-3 font-hud text-[11px] text-line uppercase tracking-[0.2em]", className)}>
      <span className="bg-burn px-1.5 py-0.5 font-semibold text-primary-foreground">{sheet}</span>
      <span className="h-px w-6 bg-line/40" />
      <span>{children}</span>
    </p>
  );
};
