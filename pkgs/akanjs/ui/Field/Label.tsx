"use client";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import type { ReactNode } from "react";
import { BiHelpCircle } from "react-icons/bi";
import { Tooltip } from "../Tooltip";

interface LabelProps {
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

export interface FieldProps {
  /** Additional classes for the outer field wrapper. */
  className?: string;
  /** Additional classes for the children container. */
  containerClassName?: string;
  /** Additional classes for the label row. */
  labelClassName?: string;
  /** Field label shown above the control. */
  label?: string;
  /** Optional help text shown in the label tooltip. */
  desc?: string;
  /** Marks the field as optional in the label. */
  nullable?: boolean;
  /** Field control content. */
  children?: ReactNode;
}
export const Field = ({
  className,
  containerClassName,
  labelClassName,
  label,
  desc,
  nullable,
  children,
}: FieldProps) => {
  return (
    <div className={cn("w-full", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <div className={cn("mt-2 flex w-full flex-col gap-4 px-4", containerClassName)}>{children}</div>
    </div>
  );
};
