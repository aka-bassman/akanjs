export type Align = "left" | "center" | "right";

export interface TableBlock {
  kind: "table";
  aligns: (Align | null)[];
  head: string[];
  rows: string[][];
}

const cellSplit = /(?<!\\)\|/;
const delimiter = /^:?-+:?$/;

export class MarkdownTable {
  static at(lines: string[], at: number): { block: TableBlock; next: number } | null {
    const header = lines[at];
    const aligns = MarkdownTable.#aligns(lines[at + 1]);
    if (!header?.includes("|") || !aligns) return null;
    const head = MarkdownTable.#cells(header);
    const rows: string[][] = [];
    let next = at + 2;
    for (; next < lines.length; next += 1) {
      const line = lines[next];
      if (!line.trim() || !line.includes("|")) break;
      const cells = MarkdownTable.#cells(line);
      // GFM sizes every row to the header: a short row is padded, a long one truncated.
      rows.push(head.map((_, idx) => cells[idx] ?? ""));
    }
    return { block: { kind: "table", aligns, head, rows }, next };
  }

  static #cells(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/(?<!\\)\|$/, "")
      .split(cellSplit)
      .map((cell) => cell.trim().replace(/\\\|/g, "|"));
  }

  // The pipe is required of the delimiter row, not the header: that is what tells a table from a rule's `---`.
  static #aligns(line: string | undefined): (Align | null)[] | null {
    if (!line?.includes("|")) return null;
    const cells = MarkdownTable.#cells(line);
    if (!cells.every((cell) => delimiter.test(cell))) return null;
    return cells.map((cell) => {
      const closed = cell.endsWith(":");
      if (cell.startsWith(":")) return closed ? "center" : "left";
      return closed ? "right" : null;
    });
  }
}
