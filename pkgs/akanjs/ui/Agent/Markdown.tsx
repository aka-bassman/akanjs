"use client";
import { cn } from "akanjs/client";
import type { Align, MarkdownBlock, MarkdownItem, MarkdownSpan, TableBlock } from "akanjs/common";
import { MarkdownBlocks, MarkdownSpans } from "akanjs/common";
import type { ReactNode } from "react";
import { createOverridable } from "../UiOverride";

const spans = (text: string): ReactNode[] => MarkdownSpans.of(text).map((span, at) => node(span, at));

const node = (span: MarkdownSpan, at: number): ReactNode => {
  switch (span.kind) {
    case "link":
      return (
        <a className="underline" href={span.href} key={at} rel="noreferrer" target="_blank">
          {spans(span.text)}
        </a>
      );
    case "code":
      return (
        <code className="rounded-field bg-muted px-1 font-mono text-[11px]" key={at}>
          {span.text}
        </code>
      );
    case "strong":
      return (
        <strong className="font-semibold" key={at}>
          {spans(span.text)}
        </strong>
      );
    case "em":
      return <em key={at}>{spans(span.text)}</em>;
    case "del":
      return (
        <del className="opacity-60" key={at}>
          {span.text}
        </del>
      );
    default:
      return span.text;
  }
};

const alignClass: { [key in Align]: string } = { left: "text-left", center: "text-center", right: "text-right" };

interface ListProps {
  className?: string;
  items: MarkdownItem[];
}

// Real nested lists, not hidden rows: a hidden `li` still advances an `ol`'s counter.
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

export interface CodeProps {
  className?: string;
  /** The fence's info word. */
  lang?: string;
  text: string;
}

export const DefaultCode = ({ className, lang, text }: CodeProps) => (
  <pre
    className={cn("overflow-x-auto rounded-field bg-muted p-2 font-mono text-[11px] leading-tight", className)}
    data-lang={lang}
  >
    {text}
  </pre>
);

const Code = createOverridable("AgentCode", DefaultCode);

interface BlockProps {
  block: MarkdownBlock;
}

const Block = ({ block }: BlockProps) => {
  switch (block.kind) {
    case "code":
      return <Code lang={block.lang} text={block.text} />;
    // Not `h1`-`h6`: model output would otherwise join the host page's outline, which assistive technology reads.
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

export interface MarkdownProps {
  className?: string;
  children: string;
}

/** React elements, never `dangerouslySetInnerHTML`; not `Bun.markdown`, which is undefined in the browser. */
export const DefaultMarkdown = ({ className, children }: MarkdownProps) => (
  <div className={cn("flex flex-col gap-2 break-words", className)}>
    {MarkdownBlocks.of(children).map((block, idx) => (
      <Block block={block} key={idx} />
    ))}
  </div>
);

export default createOverridable("AgentMarkdown", DefaultMarkdown);
