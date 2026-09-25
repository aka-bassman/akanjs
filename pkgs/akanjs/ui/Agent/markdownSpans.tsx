"use client";
import { type MarkdownSpan, MarkdownSpans } from "akanjs/common";
import type { ReactNode } from "react";

/** The browser rendering of {@link MarkdownSpans}; the scanner, and which hrefs are refused, live there. */
export const spans = (text: string): ReactNode[] => MarkdownSpans.of(text).map((span, at) => node(span, at));

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
