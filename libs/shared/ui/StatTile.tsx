import { cardRecipe } from "@libs/util/ui";
import { cn } from "akanjs/client";
import { Tooltip } from "akanjs/ui";
import type { ReactNode } from "react";
import { BiHelpCircle } from "react-icons/bi";

interface StatTileProps {
  className?: string;
  label: string;
  value: number;
  desc?: string;
}

export const StatTile = ({ className, label, value, desc }: StatTileProps) => (
  <div className={cardRecipe({ surface: "bordered", size: "sm" }, ["gap-1 px-4 py-3", className])}>
    <span className="flex items-center gap-1 text-muted-foreground text-xs">
      <span className="truncate">{label}</span>
      {desc ? (
        <Tooltip content={desc} variant="info" side="top">
          <span className="shrink-0">
            <BiHelpCircle />
          </span>
        </Tooltip>
      ) : null}
    </span>
    <span className="font-semibold text-2xl text-foreground">{value.toLocaleString()}</span>
  </div>
);

interface StatSectionProps {
  className?: string;
  title: string;
  children: ReactNode;
}

export const StatSection = ({ className, title, children }: StatSectionProps) => (
  <section className={cn("flex flex-col gap-2", className)}>
    <h3 className="font-medium text-muted-foreground text-sm">{title}</h3>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">{children}</div>
  </section>
);
