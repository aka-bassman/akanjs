"use client";
import { cn, usePage } from "akanjs/client";
import { useFieldTool } from "akanjs/store";
import type { ReactNode } from "react";
import { agentAttrs } from "../agentAttrs";
import { Input } from "../Input";
import { Label } from "./Label";

export interface NumberProps {
  label?: string;
  desc?: string;
  className?: string;
  value: number | null;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  cache?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  labelClassName?: string;
  inputClassName?: string;
  onChange: (value: number) => void;
  transform?: (value: number) => number;
  validate?: (text: number) => boolean | string;
  onPressEnter?: () => void;
  formatter?: (value: string) => string;
  parser?: (value: string) => string;
}
export const Number = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  nullable,
  disabled,
  min,
  max,
  cache,
  transform = (v) => v,
  validate,
  onPressEnter,
  inputClassName,
  unit,
  formatter,
  parser,
}: NumberProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} unit={unit} /> : null}
      <Input.Number
        {...agentAttrs(onChange)}
        min={min}
        max={max}
        cacheKey={cache ? `${label}-${desc}-number` : undefined}
        value={value}
        nullable={nullable}
        formatter={formatter}
        parser={parser}
        placeholder={placeholder}
        onChange={(value) => {
          onChange(transform(value ?? 0));
        }}
        disabled={disabled}
        className={cn("w-full", "")}
        inputClassName={cn("w-full", inputClassName)}
        validate={(value) => {
          //수정여지
          if (min !== undefined && (value as number) < min) return l("base.numberTooSmallError", { min });
          else if (max !== undefined && (value as number) > max) return l("base.numberTooBigError", { max });
          else return validate?.(value as number) ?? true;
        }}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

export interface DoubleNumberProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: [number, number] | null;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  min?: [number, number] | null;
  max?: [number, number] | null;
  separator?: ReactNode | string;
  cache?: boolean;
  onChange: (value: [number, number]) => void;
  transform?: (value: number) => number;
  validate?: (text: number) => boolean | string;
  onPressEnter?: () => void;
}
export const DoubleNumber = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  placeholder,
  nullable,
  disabled,
  min,
  max,
  inputClassName,
  cache,
  separator,
  onChange,
  transform = (v) => v,
  validate,
  onPressEnter,
}: DoubleNumberProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <div className="flex items-center gap-2">
        <Input.Number
          value={value ? value[0] : 0}
          nullable={nullable}
          cacheKey={cache ? `${label}-${desc}-number-[0]` : undefined}
          placeholder={placeholder}
          onChange={(num) => {
            if (num === null) return;
            onChange([transform(num), value ? value[1] : 0]);
          }}
          disabled={disabled}
          className={cn("w-full", "")}
          inputClassName={cn("w-full focus:border-primary", inputClassName)}
          validate={(value) => {
            if (min && (value as number) < min[0]) return l("base.numberTooSmallError", { min: min[0] });
            else if (max && (value as number) > max[0]) return l("base.numberTooBigError", { max: max[0] });
            else return validate?.(value as number) ?? true;
          }}
          onPressEnter={onPressEnter}
        />
        {separator}
        <Input.Number
          cacheKey={cache ? `${label}-${desc}-number-[1]` : undefined}
          value={value ? value[1] : 0}
          nullable={nullable}
          placeholder={placeholder}
          onChange={(num) => {
            onChange([value ? value[0] : 0, transform(num ?? 0)]);
          }}
          disabled={disabled}
          className={cn("w-full", "")}
          inputClassName={cn("w-full focus:border-primary", inputClassName)}
          validate={(value) => {
            if (min && (value as number) < min[1]) return l("base.numberTooSmallError", { min: min[1] });
            else if (max && (value as number) > max[1]) return l("base.numberTooBigError", { max: max[1] });
            else return validate?.(value as number) ?? true;
          }}
          onPressEnter={onPressEnter}
        />
      </div>
    </div>
  );
};
