"use client";
import { cn, usePage } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import { st } from "akanjs/store";

import { Link } from "../Link";
import { dictLabel, formatStat } from "./dataText";

export interface DashboardProps<T extends string, State> {
  className?: string;
  summary: Record<string, unknown>;
  slice: SliceMeta;
  /** Columns that narrow the listing when clicked. A column absent from the map renders as a plain tile. */
  queryMap?: Record<string, unknown>;
  columns?: string[];
  presents?: string[];
  hidePresents?: boolean;
}

const tileClassName = "flex min-w-40 flex-1 flex-col gap-1 rounded-box border px-4 py-3 text-left";

export default function Dashboard<T extends string, State>({
  className,
  summary,
  slice,
  queryMap,
  columns,
  presents,
  hidePresents,
}: DashboardProps<T, State>) {
  const { refName } = slice;
  const { l } = usePage();
  const searchParams = st.use.searchParams({ agent: false });
  const filter = Array.isArray(searchParams.filter) ? searchParams.filter[0] : searchParams.filter;
  const shownColumns = (columns ?? []).filter((column) => summary[column] !== undefined);
  const shownPresents = hidePresents ? [] : (presents ?? []).filter((column) => summary[column] !== undefined);
  if (!shownColumns.length && !shownPresents.length) return null;
  return (
    <div className={cn("mb-4 flex flex-wrap gap-2", className)}>
      {[...shownColumns, ...shownPresents].map((column) => {
        const linkable = queryMap?.[column] !== undefined;
        return (
          <Link
            key={column}
            disabled={!linkable}
            href={`/admin?topMenu=data&subMenu=${refName}&filter=${column}`}
            className={cn(
              tileClassName,
              "bg-card",
              linkable && "transition hover:border-primary/50",
              filter === column && linkable ? "border-primary" : "border-border",
            )}
          >
            <span className="truncate text-muted-foreground text-xs">
              {dictLabel(l._, `summary.${column}`, column)}
            </span>
            <span className="truncate font-semibold text-2xl text-primary tabular-nums">
              {formatStat(summary[column])}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
