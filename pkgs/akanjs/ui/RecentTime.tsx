import { type Dayjs, dayjs } from "akanjs/base";
import { usePage } from "akanjs/client";
import relativeTime from "dayjs/plugin/relativeTime";

import { Tooltip } from "./Tooltip";

dayjs.extend(relativeTime);

export type RecentTimeRelativeUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
export type RecentTimeRelativeStyle = "fromNow" | "always" | "auto";

export interface RecentTimeRelative {
  unit: RecentTimeRelativeUnit;
  /** Signed count in `unit`. Negative is past, positive is future, `0` is now. */
  count: number;
  date: Dayjs;
  now: Dayjs;
  defaultLabel: string;
}

export type RecentTimeRelativeFormat = RecentTimeRelativeStyle | ((relative: RecentTimeRelative) => string);

export interface RecentTimeProps {
  /** Null renders nothing; an epoch placeholder renders --:--. */
  date: Date | Dayjs | null;
  /** The unit past which a formatted date replaces the relative label. */
  breakUnit?: Intl.RelativeTimeFormatUnit;
  /** `"full"` always includes date and time. */
  format?: "full" | "auto";
  /** `"fromNow"` (default) keeps dayjs locale strings (`하루 전`); `"always"` / `"auto"` use `Intl.RelativeTimeFormat`
   *  (`1일 전` vs `어제`); a function replaces the label, returning `defaultLabel` to keep it. */
  relative?: RecentTimeRelativeFormat;
  className?: string;
}

const resolveRecentTimeUnit = (date: Dayjs, now: Dayjs): Pick<RecentTimeRelative, "unit" | "count"> => {
  const ms = date.valueOf() - now.valueOf();
  if (ms === 0) return { unit: "second", count: 0 };
  const sign = ms > 0 ? 1 : -1;
  if (date.isSame(now, "day")) {
    const secs = Math.abs(now.diff(date, "second"));
    if (secs < 60) return { unit: "second", count: sign * secs };
    const mins = Math.abs(now.diff(date, "minute"));
    if (mins < 60) return { unit: "minute", count: sign * mins };
    return { unit: "hour", count: sign * Math.abs(now.diff(date, "hour")) };
  }
  const days = Math.abs(now.startOf("day").diff(date.startOf("day"), "day"));
  if (days < 7) return { unit: "day", count: sign * days };
  const months = Math.abs(now.startOf("month").diff(date.startOf("month"), "month"));
  if (months < 1) return { unit: "week", count: sign * Math.max(1, Math.floor(days / 7)) };
  if (months < 12) return { unit: "month", count: sign * months };
  return { unit: "year", count: sign * Math.max(1, Math.abs(now.startOf("year").diff(date.startOf("year"), "year"))) };
};

const formatRelativeLabel = (date: Dayjs, now: Dayjs, lang: string, relative: RecentTimeRelativeFormat) => {
  const defaultLabel = date.fromNow();
  if (relative === "fromNow") return defaultLabel;
  const { unit, count } = resolveRecentTimeUnit(date, now);
  if (typeof relative === "function") return relative({ unit, count, date, now, defaultLabel });
  if (count === 0) return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(0, "second");
  return new Intl.RelativeTimeFormat(lang, { numeric: relative }).format(count, unit);
};

const relativeLimits = [
  ["second", 1000, 60],
  ["minute", 1000 * 60, 60],
  ["hour", 1000 * 3600, 24],
  ["day", 1000 * 3600 * 24, 7],
  ["week", 1000 * 3600 * 24 * 7, 4],
  ["month", 1000 * 3600 * 24 * 30, 12],
] as const;

const isRelativeDisplay = (diffMs: number, breakUnit?: Intl.RelativeTimeFormatUnit) => {
  for (const [unit, unitMs, limit] of relativeLimits) {
    if (breakUnit === unit) return false;
    if (Math.abs(Math.floor(diffMs / unitMs)) < limit) return true;
  }
  return breakUnit !== "year";
};

export const RecentTime = ({ date, breakUnit, format = "auto", relative = "fromNow", className }: RecentTimeProps) => {
  const { lang } = usePage();
  if (!date) return null;
  if (dayjs(0).isSame(date) || dayjs(-1).isSame(date)) return <span>--:--</span>;

  const now = dayjs();
  const datejs = dayjs(date).locale(lang);
  const dateFormat =
    format === "full"
      ? "YY-MM-DD HH:mm"
      : now.year() !== datejs.year()
        ? "YYYY-MM-DD"
        : now.month() !== datejs.month() || now.date() !== datejs.date()
          ? "MM-DD"
          : "HH:mm";
  const tip = breakUnit === "second" ? datejs.format("YYYY-MM-DD HH:mm:ss") : datejs.format("YYYY-MM-DD HH:mm");
  const label = isRelativeDisplay(now.diff(datejs), breakUnit)
    ? formatRelativeLabel(datejs, now, lang, relative)
    : datejs.format(dateFormat);

  return (
    <Tooltip content={tip}>
      <span className={className}>{label}</span>
    </Tooltip>
  );
};
