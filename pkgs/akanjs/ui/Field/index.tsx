"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { memo } from "react";
import { MultiToggleSelect, Switch, ToggleSelect } from "./Choice";
import { List, Tags, TextList } from "./Collection";
import { Date, DateRange } from "./DateField";
import { Label } from "./Label";
import { DoubleNumber, Number } from "./NumberField";
import { Children, ChildrenId, Parent, ParentId } from "./Relation";
import { Email, Password, Phone, Text, TextArea } from "./Text";

export interface FieldProps {
  className?: string;
  /** Wrapper around the field controls. */
  containerClassName?: string;
  labelClassName?: string;
  /** Section label shown above the controls. */
  label?: string;
  /** Optional help text shown in the label tooltip. */
  desc?: string;
  /** Marks the field as optional in the label. */
  nullable?: boolean;
  /** Field control content. */
  children?: ReactNode;
}
const FieldSection = ({
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

/**
 * The form-field namespace. `Object.assign` rather than `Field.X = X` per file, because the members now live
 * beside each other by kind — the assignment form only works where the function and every member are one file,
 * which is how this reached 1600 lines.
 */
export const Field = Object.assign(FieldSection, {
  Label,
  List,
  Text: memo(Text),
  TextArea: memo(TextArea),
  Switch,
  ToggleSelect,
  MultiToggleSelect,
  TextList,
  Tags,
  Date,
  DateRange,
  Number,
  DoubleNumber,
  Email,
  Phone,
  Password,
  Parent,
  ParentId,
  Children,
  ChildrenId,
});
