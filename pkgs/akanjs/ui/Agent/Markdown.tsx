"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { type MarkdownBlock, MarkdownBlocks, type MarkdownItem } from "./markdownBlocks";
import { spans } from "./markdownSpans";
import type { Align, TableBlock } from "./markdownTable";

const alignClass: { [key in Align]: string } = { left: "text-left", center: "text-center", right: "text-right" };

interface ListProps {
  className?: string;
  items: MarkdownItem[];
}

/** Folds the scanner's flat depth-scored items back into real nested lists, so a nested run carries its own
 *  marker and leaves the outer numbering alone — a hidden `li` still advances an `ol`'s counter. */
const List = ({ className, items }: ListProps) => {
  const rows: ReactNode[] = [];
  for (let at = 0; at < items.length; ) {
    const item = items[at];
    const nested: MarkdownItem[] = [];
    for (at += 1; at < items.length && items[at].depth > item.depth; at += 1) nested.push(items[at]);
    rows.push(
      <li key={at}>
        {spans(item.text)}
        {nested.length ? <List className="pl-4" items={nested} /> : null}
      </li>,
    );
  }
  const [first] = items;
  return first.ordered ? (
    <ol className={cn("list-inside list-decimal", className)} start={first.num}>
      {rows}
    </ol>
  ) : (
    <ul className={cn("list-inside list-disc", className)}>{rows}</ul>
  );
};

interface TableProps {
  block: TableBlock;
}

const Table = ({ block }: TableProps) => {
  const cellClass = block.head.map((_, idx) => {
    const align = block.aligns[idx];
    return align ? alignClass[align] : "";
  });
  return (
    // The panel is narrower than most tables a model writes, so the overflow is the table's own rather than the
    // bubble's, and `min-w-full` lets columns size to content before they start wrapping.
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-muted/40">
            {block.head.map((cell, idx) => (
              <th className={cn("border-border border-b px-2 py-1 text-left", cellClass[idx])} key={idx}>
                {spans(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, idx) => (
                <td className={cn("border-border/60 border-b px-2 py-1 text-left", cellClass[idx])} key={idx}>
                  {spans(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface BlockProps {
  block: MarkdownBlock;
}

const Block = ({ block }: BlockProps) => {
  switch (block.kind) {
    case "code":
      return (
        <pre className="overflow-x-auto rounded-field bg-muted p-2 font-mono text-[11px] leading-tight">
          {block.text}
        </pre>
      );
    // A heading renders as weighted text, not as `h1`-`h6`: model output would otherwise write its own outline
    // into the host page's heading structure, which assistive technology reads as the page's own.
    case "heading":
      return <p className={cn("font-semibold", block.level <= 2 && "text-base")}>{spans(block.text)}</p>;
    case "list":
      return <List items={block.items} />;
    case "table":
      return <Table block={block} />;
    case "quote":
      return (
        <blockquote className="border-foreground/20 border-l-2 pl-2 text-foreground/70">{spans(block.text)}</blockquote>
      );
    case "rule":
      return <hr className="border-foreground/10" />;
    default:
      return <p>{spans(block.text)}</p>;
  }
};

interface MarkdownProps {
  className?: string;
  children: string;
}

/**
 * The chat's own markdown renderer: React elements, never `dangerouslySetInnerHTML`, and no parser dependency.
 * `Bun.markdown` is the obvious candidate and cannot serve this — it is a runtime API the bundler passes through
 * verbatim, so it is undefined in the browser, and assistant text arrives here as SSE deltas the client accrues.
 */
export default function Markdown({ className, children }: MarkdownProps) {
  return (
    <div className={cn("flex flex-col gap-2 break-words", className)}>
      {MarkdownBlocks.of(children).map((block, idx) => (
        <Block block={block} key={idx} />
      ))}
    </div>
  );
}
