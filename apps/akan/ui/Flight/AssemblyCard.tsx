import type { ReactNode } from "react";
import { flightPanelRecipe } from "../Recipe";

interface AssemblyCardProps {
  className?: string;
  sheet: string;
  system: string;
  tag: string;
  title: string;
  body: string;
  children?: ReactNode;
}
export const AssemblyCard = ({ className, sheet, system, tag, title, body, children }: AssemblyCardProps) => {
  return (
    <div className="flex min-h-svh items-end px-4 pb-6 sm:px-10 lg:items-center lg:px-14 lg:pb-0 xl:px-20">
      <article
        className={flightPanelRecipe({ tone: "sheet", padding: "lg", ticks: true }, ["w-full max-w-md", className])}
      >
        <p className="flex items-center gap-3 font-hud text-[11px] uppercase tracking-[0.2em]">
          <span className="bg-burn px-1.5 py-0.5 font-semibold text-primary-foreground">{sheet}</span>
          <span className="text-line">{system}</span>
          <span className="ml-auto text-foreground/45">{tag}</span>
        </p>
        <h2 className="mt-5 text-balance font-black text-[1.75rem] leading-tight sm:text-4xl">{title}</h2>
        <p className="mt-3 text-[0.9375rem] text-foreground/68 leading-7 sm:text-base">{body}</p>
        {children ? <div className="mt-6">{children}</div> : null}
      </article>
    </div>
  );
};
