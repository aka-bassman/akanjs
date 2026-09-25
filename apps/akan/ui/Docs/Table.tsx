import { cn } from "akanjs/client";
import { Fragment, type ReactNode } from "react";

import { CodeText } from "./CodeText";

export interface TableColumn {
  key: string;
  label: ReactNode;
  code?: boolean;
}

interface TableProps {
  className?: string;
  columns: TableColumn[];
  rows: Record<string, ReactNode>[];
  stacked?: boolean;
}

export const Table = ({ className, columns, rows, stacked }: TableProps) => {
  const heads = stacked ? columns.slice(0, -1) : columns;
  const below = stacked ? columns.at(-1) : undefined;
  return (
    <div className={cn("my-4 overflow-x-auto border-border border-y", className)}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-border border-b">
            {heads.map((column, colIdx) => (
              <th
                key={column.key}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 font-semibold text-foreground/50 text-xs",
                  colIdx === heads.length - 1 && "w-full",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
          {below ? (
            <tr className="border-border border-b">
              <th colSpan={heads.length} className="px-3 pb-1.5 font-semibold text-foreground/40 text-xs">
                ↳ {below.label}
              </th>
            </tr>
          ) : null}
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <Fragment key={idx}>
              <tr className={cn("align-top", !below && "border-border/60 border-b last:border-b-0")}>
                {heads.map((column, colIdx) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 leading-relaxed",
                      below ? "pt-2 pb-0.5" : "py-2",
                      column.code
                        ? "wrap-break-word font-mono text-foreground sm:whitespace-nowrap"
                        : "min-w-28 text-foreground/80 sm:min-w-48",
                      colIdx === 0 && "font-semibold",
                    )}
                  >
                    {column.code ? row[column.key] : <CodeText>{row[column.key]}</CodeText>}
                  </td>
                ))}
              </tr>
              {below ? (
                <tr className="border-border/60 border-b last:border-b-0">
                  <td
                    colSpan={heads.length}
                    className={cn(
                      "px-3 pb-2 leading-relaxed",
                      below.code ? "font-mono text-foreground" : "text-foreground/80",
                    )}
                  >
                    {below.code ? row[below.key] : <CodeText>{row[below.key]}</CodeText>}
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
