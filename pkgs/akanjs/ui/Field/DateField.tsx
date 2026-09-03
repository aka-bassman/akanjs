"use client";
import { type Dayjs, dayjs } from "akanjs/base";
import { cn } from "akanjs/client";
import { actionTagOf, tagAction, useFieldTool } from "akanjs/store";
import { agentAttrs } from "../agentAttrs";
import { inputRecipe } from "../recipe";
import { Label } from "./Label";

interface DateProps<Nullable extends boolean> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  nullable?: boolean;
  className?: string;
  min?: Dayjs;
  max?: Dayjs;
  value: Nullable extends true ? Dayjs | null : Dayjs;
  showTime?: boolean;
  onChange: (value: Dayjs) => void;
  dateClassName?: string;
}
export const Date = <Nullable extends boolean>({
  className,
  labelClassName,
  nullable,
  label,
  desc,
  value,
  min,
  max,
  onChange,
  showTime,
  dateClassName,
}: DateProps<Nullable>) => {
  useFieldTool(onChange);
  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <input
        type={showTime ? "datetime-local" : "date"}
        className={inputRecipe({}, [
          // `user-invalid` replaces daisyUI's `.validator`, which coloured the border off the same
          // pseudo-class. The native date input reports its own min/max violations through it.
          "user-invalid:border-destructive text-xs outline-none duration-200 focus-within:outline-none focus:outline-none",
          dateClassName,
        ])}
        min={min ? (showTime ? dayjs(min).format("YYYY-MM-DDTHH:mm") : dayjs(min).format("YYYY-MM-DD")) : undefined}
        max={max ? (showTime ? dayjs(max).format("YYYY-MM-DDTHH:mm") : dayjs(max).format("YYYY-MM-DD")) : undefined}
        value={value ? (showTime ? dayjs(value).format("YYYY-MM-DDTHH:mm") : dayjs(value).format("YYYY-MM-DD")) : ""}
        onChange={(e) => {
          onChange(dayjs(e.target.value));
        }}
      />
    </div>
  );
};

interface DateRangeProps<Nullable extends boolean> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  nullable?: Nullable;
  className?: string;
  min?: Dayjs;
  max?: Dayjs;
  from: Nullable extends true ? Dayjs | null : Dayjs;
  to: Nullable extends true ? Dayjs | null : Dayjs;
  showTime?: boolean;
  onChangeFrom: (value: Dayjs) => void;
  onChangeTo: (value: Dayjs) => void;
  /** The whole range after either end moves. Fires only once both ends are set — nobody can query a half-open one. */
  onChange?: (from: Dayjs, to: Dayjs) => void;
}
export const DateRange = <Nullable extends boolean>({
  className,
  labelClassName,
  nullable,
  label,
  desc,
  from,
  to,
  min,
  max,
  onChangeFrom,
  onChangeTo,
  onChange,
  showTime,
}: DateRangeProps<Nullable>) => {
  /**
   * Adds the pair callback to one endpoint setter, carrying that setter's own tag onto the wrapper.
   *
   * The wrapper really does run the setter, so the tag stays a true statement — and wiring `onChange` then costs
   * the endpoint neither its agent tool nor its `data-akan-action`, which a plain closure would both drop.
   */
  const withPair = (setter: (value: Dayjs) => void, pair: (value: Dayjs) => [Dayjs | null, Dayjs | null]) => {
    if (!onChange) return setter;
    const wrapped = (value: Dayjs) => {
      setter(value);
      const [nextFrom, nextTo] = pair(value);
      if (nextFrom && nextTo) onChange(nextFrom, nextTo);
    };
    const tag = actionTagOf(setter);
    return tag ? tagAction(wrapped, tag) : wrapped;
  };
  const changeFrom = withPair(onChangeFrom, (value) => [value, to]);
  const changeTo = withPair(onChangeTo, (value) => [from, value]);
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}

      <div className="relative flex w-full flex-col items-start gap-2 pt-2 text-center md:flex-row md:items-center">
        <div className="relative flex w-full flex-col items-start justify-start">
          <div className="absolute -top-2 left-2 z-10 bg-background px-2 font-light text-xs">From</div>
          <Date
            className="w-full"
            dateClassName="w-full"
            showTime={showTime}
            value={from}
            max={max}
            min={min}
            onChange={changeFrom}
          />
        </div>
        <div className="relative flex w-full flex-col items-start gap-2 text-center md:flex-row md:items-center">
          <div className="absolute -top-2 left-2 z-10 bg-background px-2 font-light text-xs">To</div>
          <Date
            className="w-full"
            dateClassName="w-full"
            showTime={showTime}
            value={to}
            max={max}
            min={min}
            onChange={changeTo}
          />
        </div>
      </div>
    </div>
  );
};
