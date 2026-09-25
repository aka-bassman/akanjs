import { cn } from "akanjs/client";
import { Link } from "akanjs/ui";
import type { ReactNode } from "react";

import { panelRecipe } from "../Recipe";
import { CodeText } from "./CodeText";

export interface LinkGridItem {
  href: string;
  title: ReactNode;
  desc: ReactNode;
}

interface LinkGridProps {
  className?: string;
  items: LinkGridItem[];
}

export const LinkGrid = ({ className, items }: LinkGridProps) => {
  return (
    <div className={cn("my-4 grid gap-2 md:grid-cols-2", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={panelRecipe({ radius: "lg", padding: "sm" }, "group transition-colors hover:border-primary")}
        >
          <div className="font-semibold text-primary text-sm">
            {item.title}
            <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </div>
          <div className="mt-0.5 text-foreground/70 text-sm leading-snug">
            <CodeText>{item.desc}</CodeText>
          </div>
        </Link>
      ))}
    </div>
  );
};
