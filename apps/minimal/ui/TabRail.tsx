"use client";
import { st, usePage } from "@apps/minimal/client";
import { cn } from "akanjs/client";
import { Link } from "akanjs/ui";
import type { ReactNode } from "react";

interface TabRailProps {
  className?: string;
  brand: ReactNode;
  tabs: { name: ReactNode; href: string; icon: ReactNode }[];
}
export const TabRail = ({ className, brand, tabs }: TabRailProps) => {
  const { lang } = usePage();
  const path = st.use.path({ agent: false });
  const localePath = path.startsWith(`/${lang}`) ? path.slice(lang.length + 1) || "/" : path;
  return (
    <nav
      className={cn(
        "sticky top-0 h-screen w-64 shrink-0 flex-col gap-1 border-foreground/10 border-r px-4 py-8",
        className,
      )}
    >
      <div className="mb-8 px-3">{brand}</div>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          replace
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
            localePath.startsWith(tab.href)
              ? "bg-primary/15 font-semibold text-primary"
              : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.name}
        </Link>
      ))}
    </nav>
  );
};
