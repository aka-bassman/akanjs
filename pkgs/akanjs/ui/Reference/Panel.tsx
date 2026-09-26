import { cn } from "akanjs/client";
import type { ReactNode, RefObject } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { BiChevronDown } from "react-icons/bi";
import { buttonRecipe } from "../Button";
import { Copy } from "../Copy";
import { docBorder, docDash, docUi } from "./docUi";

interface PanelProps {
  className?: string;
  bodyClassName?: string;
  label?: string;
  meta?: ReactNode;
  tone?: Parameters<typeof docBorder>[0];
  overlay?: ReactNode;
  children: ReactNode;
}

export const Panel = ({ className, bodyClassName, label, meta, tone = "muted", overlay, children }: PanelProps) => (
  <div
    className={cn(
      "relative flex min-w-0 flex-col overflow-hidden border transition-colors",
      docUi.panel,
      docBorder(tone),
      className,
    )}
  >
    {label || meta ? (
      <div className="flex items-center gap-2 border-border/70 border-b bg-muted/40 px-3 py-1.5">
        <span className={docUi.sectionLabel}>{label}</span>
        <div className="ml-auto flex items-center gap-1.5">{meta}</div>
      </div>
    ) : null}
    <div className={cn("scrollbar-thin max-h-96 overflow-auto p-3", bodyClassName)}>{children}</div>
    {overlay}
  </div>
);

interface DocTableProps {
  className?: string;
  head: ReactNode;
  children: ReactNode;
}

export const DocTable = ({ className, head, children }: DocTableProps) => (
  <div className={cn(docUi.tablePanel, className)}>
    <table className={docUi.tableClass}>
      <thead>
        <tr>{head}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

interface CodeProps {
  className?: string;
  label?: string;
  code: string;
  tone?: PanelProps["tone"];
  meta?: ReactNode;
  placeholder?: string;
  bodyRef?: RefObject<HTMLPreElement | null>;
  overlay?: ReactNode;
}

// A `<pre>`, not a `<textarea>`: nothing reads what is typed, so a caret would promise an edit that never lands.
export const Code = ({ className, label, code, tone, meta, placeholder = "—", bodyRef, overlay }: CodeProps) => (
  <Panel
    bodyClassName="max-h-none overflow-visible p-0"
    className={className}
    label={label}
    meta={
      <>
        {meta}
        <Copy text={code}>
          <button className={buttonRecipe({ variant: "ghost", size: "xs" }, "text-foreground/50")} type="button">
            <AiOutlineCopy />
          </button>
        </Copy>
      </>
    }
    overlay={overlay}
    tone={tone}
  >
    <pre
      className="scrollbar-thin max-h-96 min-h-16 overflow-auto p-3 font-mono text-foreground/85 text-xs leading-relaxed"
      ref={bodyRef}
    >
      {code || <span className={docDash}>{placeholder}</span>}
    </pre>
  </Panel>
);

interface CollapseProps {
  className?: string;
  contentClassName?: string;
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
}

// Native `<details>`, not a stateful collapse: opening and closing ships no client JS.
export const Collapse = ({ summary, children, open, className, contentClassName }: CollapseProps) => (
  <details
    className={cn(docUi.card, "group overflow-hidden transition-colors hover:border-foreground/20", className)}
    open={open}
  >
    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
      <div className="min-w-0 flex-1">{summary}</div>
      <BiChevronDown className="mt-1 shrink-0 text-foreground/30 transition-transform group-open:rotate-180" />
    </summary>
    <div className={cn("flex w-full flex-col gap-4 border-border/70 border-t p-4", contentClassName)}>{children}</div>
  </details>
);

interface SummaryCardProps {
  className?: string;
  label: string;
  value: number | string;
}

export const SummaryCard = ({ className, label, value }: SummaryCardProps) => (
  <div className={cn(docUi.card, "px-4 py-3", className)}>
    <div className={docUi.sectionLabel}>{label}</div>
    <div className="font-bold text-2xl">{value}</div>
  </div>
);

interface SummaryGridProps {
  className?: string;
  children: ReactNode;
}

export const SummaryGrid = ({ className, children }: SummaryGridProps) => (
  <div className={cn("grid grid-cols-2 gap-2 md:grid-cols-4", className)}>{children}</div>
);

interface ToolbarProps {
  className?: string;
  children: ReactNode;
}

export const Toolbar = ({ className, children }: ToolbarProps) => (
  <div className={cn(docUi.card, "flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3", className)}>{children}</div>
);

interface ToolbarFieldProps {
  className?: string;
  label: string;
  children: ReactNode;
}

export const ToolbarField = ({ className, label, children }: ToolbarFieldProps) => (
  <div className={cn("flex min-w-0 items-center gap-2", className)}>
    <span className={docUi.sectionLabel}>{label}</span>
    {children}
  </div>
);

interface SectionProps {
  className?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const Section = ({ className, title, action, children }: SectionProps) => (
  <section className={cn("flex flex-col gap-3", className)}>
    <div className="flex items-center gap-3">
      <h2 className={docUi.sectionTitle}>{title}</h2>
      <div className="h-px flex-1 bg-border" />
      {action}
    </div>
    {children}
  </section>
);
