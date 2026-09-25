import { type MarkdownBlock, MarkdownBlocks, type MarkdownSpan, MarkdownSpans, type TableBlock } from "akanjs/common";
import { CodeTuiLines, type CodeTuiRow, type CodeTuiSpan, type CodeTuiStyle } from "./CodeTuiLines";

/**
 * Renders a model's markdown for a terminal, from the same scanner `Agent.Chat` renders for a browser.
 *
 * The scanner lives in `akanjs/common` precisely so there is one of it: which links are refused, and the
 * decision not to treat `_` as emphasis because snake_case is everywhere in this content, are not rendering
 * decisions and must not be made twice.
 *
 * What differs is only the ink. A terminal has no `<h1>`, so a heading is bold and a rule is a line of dashes;
 * a fenced block gets a left bar instead of a background, because a background colour across a wrapped block
 * fights whatever theme the terminal already has.
 */
export class CodeTuiMarkdown {
  static readonly bullet = "•";

  /** Columns a table needs between itself and the pane edge before it is worth drawing as a grid. */
  static readonly minColumn = 6;

  static rows(source: string, width = 80): CodeTuiRow[] {
    const rows: CodeTuiRow[] = [];
    const blocks = MarkdownBlocks.of(source);
    blocks.forEach((block, at) => {
      if (at) rows.push({ spans: [] });
      for (const row of CodeTuiMarkdown.#block(block, width)) rows.push(row);
    });
    return rows;
  }

  static #block(block: MarkdownBlock, width: number): CodeTuiRow[] {
    switch (block.kind) {
      case "heading":
        return [
          {
            spans: CodeTuiMarkdown.spans(block.text, { bold: true, ...(block.level <= 2 ? { color: "cyan" } : {}) }),
          },
        ];
      case "code":
        return CodeTuiMarkdown.#code(block.lang, block.text);
      case "quote":
        return block.text.split("\n").map((line) => ({
          prefix: { text: "▌ ", dim: true },
          spans: CodeTuiMarkdown.spans(line, { dim: true }),
        }));
      case "rule":
        return [{ spans: [{ text: "─".repeat(24), dim: true }] }];
      case "list":
        return block.items.map((item) => {
          const indent = "  ".repeat(item.depth);
          const marker = item.ordered ? `${item.num}. ` : `${CodeTuiMarkdown.bullet} `;
          return {
            prefix: { text: `${indent}${marker}`, dim: true },
            spans: CodeTuiMarkdown.spans(item.text),
          };
        });
      case "table":
        return CodeTuiMarkdown.#table(block, width);
      default:
        return [{ spans: CodeTuiMarkdown.spans(block.text) }];
    }
  }

  /** A fence keeps its own line breaks — reflowing code is how an indentation-sensitive language stops parsing. */
  static #code(lang: string | undefined, text: string): CodeTuiRow[] {
    const label = lang?.trim();
    const bar: CodeTuiSpan = { text: "│ ", dim: true };
    return [
      ...(label ? [{ spans: [{ text: label, dim: true, italic: true } satisfies CodeTuiSpan] }] : []),
      ...text.split("\n").map((line) => ({ prefix: bar, hang: "│ ", spans: [{ text: line, color: "green" }] })),
    ];
  }

  /**
   * A table as a grid that holds its columns.
   *
   * Every column is measured and wrapped in display cells, so a Korean cell claims the two columns it draws in
   * — padding by `String.length` puts every later column of that row one place left of its header. A table
   * wider than the pane is **narrowed**, not left to overflow: a cell that wraps back to the margin turns the
   * grid into prose, which is the one thing a table was chosen to avoid.
   *
   * Inline markers inside a cell are stripped rather than styled. Wrapping styled runs per column would mean
   * re-splitting spans at every column edge, and a grid that lines up is worth more in a table than a bold word.
   */
  static #table(block: TableBlock, width: number): CodeTuiRow[] {
    const columns = block.head.length;
    const grid = [block.head, ...block.rows].map((row) =>
      Array.from({ length: columns }, (_, col) => MarkdownSpans.plain(row[col] ?? "")),
    );
    const widths = CodeTuiMarkdown.#columns(grid, columns, width);
    const rule: CodeTuiRow = { spans: [{ text: widths.map((size) => "─".repeat(size)).join("  "), dim: true }] };
    const [head, ...body] = grid;
    return [
      ...CodeTuiMarkdown.#gridRow(head ?? [], widths, block.aligns, { bold: true }),
      rule,
      ...body.flatMap((row) => CodeTuiMarkdown.#gridRow(row, widths, block.aligns, {})),
    ];
  }

  /**
   * Natural widths, narrowed to fit.
   *
   * A column's floor is its longest **unbreakable** token, not a share of the pane: shrinking a column of file
   * paths proportionally splits `minimal.service.ts` across two lines, and a path broken mid-name is no longer
   * searchable or copyable. Prose columns give up the room instead, which is what they can afford.
   */
  static #columns(grid: string[][], columns: number, width: number) {
    const natural = Array.from({ length: columns }, (_, col) =>
      Math.max(1, ...grid.map((row) => CodeTuiLines.width(row[col] ?? ""))),
    );
    const gaps = 2 * Math.max(0, columns - 1);
    const room = Math.max(columns * CodeTuiMarkdown.minColumn, width - gaps);
    const total = natural.reduce((sum, size) => sum + size, 0);
    if (total <= width - gaps) return natural;
    const floors = natural.map((size, col) =>
      Math.min(size, Math.max(CodeTuiMarkdown.minColumn, CodeTuiMarkdown.#longestWord(grid, col))),
    );
    const held = floors.reduce((sum, size) => sum + size, 0);
    if (held > room) return natural.map((size) => Math.max(1, Math.floor((size * room) / total)));
    const want = natural.map((size, col) => size - (floors[col] ?? 0));
    const wanted = want.reduce((sum, size) => sum + size, 0) || 1;
    const slack = room - held;
    return floors.map((size, col) => size + Math.floor((slack * (want[col] ?? 0)) / wanted));
  }

  static #longestWord(grid: string[][], col: number) {
    return Math.max(1, ...grid.flatMap((row) => (row[col] ?? "").split(/\s+/).map((word) => CodeTuiLines.width(word))));
  }

  /** One logical row as the physical rows its tallest cell needs; shorter cells pad out to keep the grid. */
  static #gridRow(cells: string[], widths: number[], aligns: TableBlock["aligns"], style: CodeTuiStyle) {
    const wrapped = widths.map((size, col) => CodeTuiMarkdown.#cell(cells[col] ?? "", size));
    const height = Math.max(1, ...wrapped.map((lines) => lines.length));
    return Array.from({ length: height }, (_, line) => ({
      spans: widths.flatMap((size, col): CodeTuiSpan[] => {
        const text = wrapped[col]?.[line] ?? "";
        const fill = " ".repeat(Math.max(0, size - CodeTuiLines.width(text)));
        const align = aligns[col];
        const lead = align === "right" ? fill : align === "center" ? " ".repeat(Math.floor(fill.length / 2)) : "";
        const tail = fill.slice(lead.length);
        return [{ text: lead }, { ...style, text }, { text: `${tail}${col === widths.length - 1 ? "" : "  "}` }];
      }),
    }));
  }

  static #cell(text: string, width: number) {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      if (line && CodeTuiLines.width(line + word) > width) {
        lines.push(line.trimEnd());
        line = word.trim() ? word : "";
        continue;
      }
      line += word;
    }
    if (line.trim() || !lines.length) lines.push(line.trimEnd());
    return lines.flatMap((entry) =>
      CodeTuiLines.width(entry) <= width ? [entry] : CodeTuiMarkdown.#hardSplit(entry, width),
    );
  }

  static #hardSplit(text: string, width: number) {
    const chunks: string[] = [];
    let chunk = "";
    for (const char of text) {
      if (CodeTuiLines.width(chunk + char) > width) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += char;
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  }

  /** Inline markers as terminal styling, with `base` applied under whatever the markers add. */
  static spans(text: string, base: CodeTuiStyle = {}): CodeTuiSpan[] {
    return MarkdownSpans.of(text).flatMap((span): CodeTuiSpan[] => {
      // A terminal cannot hide a url behind its label, and a label alone is unfollowable — there is nothing to
      // click. Both are shown, which is also what a person copying the link out of the scrollback needs.
      if (span.kind === "link")
        return [
          { ...base, underline: true, text: span.text },
          { ...base, dim: true, text: ` (${span.href})` },
        ];
      return [{ ...base, ...CodeTuiMarkdown.#span(span), text: span.text }];
    });
  }

  static #span(span: MarkdownSpan): CodeTuiStyle {
    switch (span.kind) {
      case "code":
        return { color: "yellow" };
      case "strong":
        return { bold: true };
      case "em":
        return { italic: true };
      case "del":
        return { strikethrough: true };
      default:
        return {};
    }
  }
}
