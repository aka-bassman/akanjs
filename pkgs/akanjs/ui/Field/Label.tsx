"use client";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import { BiHelpCircle } from "react-icons/bi";
import { Tooltip } from "../Tooltip";

export interface LabelProps {
  className?: string;
  label: string;
  desc?: string;
  unit?: string;
  nullable?: boolean;
  mode?: "view" | "edit";
}
export const Label = ({ className, label, desc, unit, nullable, mode = "edit" }: LabelProps) => {
  return (
    <span className={cn("flex shrink-0 items-center gap-1", className)}>
      {/* {!nullable && mode === "edit" ? <span>* </span> : null} */}
      {capitalize(label)}
      {unit ? <span className="animate-fadeIn"> ({unit})</span> : null}
      {desc ? (
        <Tooltip content={desc} variant="info" side="right">
          <span>
            <BiHelpCircle />
          </span>
        </Tooltip>
      ) : null}
      {nullable ? <span className="text-muted-foreground text-sm">{"(optional)"}</span> : null}
    </span>
  );
};
