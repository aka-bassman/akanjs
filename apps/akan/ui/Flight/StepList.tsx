import { cn } from "akanjs/client";
import type { ReactNode } from "react";

interface FlightStep {
  title: string;
  body: string;
  note?: ReactNode;
}

interface StepListProps {
  className?: string;
  sheet: string;
  steps: FlightStep[];
}
export const StepList = ({ className, sheet, steps }: StepListProps) => {
  return (
    <ol className={cn("relative space-y-9 border-line/20 border-l pl-8", className)}>
      {steps.map(({ title, body, note }, idx) => (
        <li className="flt-reveal relative" key={title}>
          <span className="absolute top-1 -left-[2.35rem] flex size-3 items-center justify-center bg-navy ring-1 ring-burn">
            <span className="size-1 bg-burn" />
          </span>
          <p className="font-hud text-[11px] text-burn tracking-[0.18em]">
            {sheet}.{idx + 1}
          </p>
          <h3 className="mt-1.5 font-bold text-xl leading-snug sm:text-2xl">{title}</h3>
          <p className="mt-2 max-w-xl text-[0.9375rem] text-foreground/65 leading-7">{body}</p>
          {note ? <div className="mt-3">{note}</div> : null}
        </li>
      ))}
    </ol>
  );
};
