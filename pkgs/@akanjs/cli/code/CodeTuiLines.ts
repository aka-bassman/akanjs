import stringWidth from "string-width";

export interface CodeTuiStyle {
  color?: string;
  dim?: boolean;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  inverse?: boolean;
}

export type CodeTuiSpan = CodeTuiStyle & { text: string };

/** Exactly one terminal row. Styling is per span because a sentence carries bold and code inside it. */
export interface CodeTuiLine {
  key: string;
  spans: CodeTuiSpan[];
}

/** A row before wrapping: its content, the marker on its first line, and the indent its later lines carry. */
export interface CodeTuiRow {
  spans: CodeTuiSpan[];
  prefix?: CodeTuiSpan;
  /** Continuation indent. Defaults to blanks as wide as `prefix`, which is what a hanging list item wants. */
  hang?: string;
}

/**
 * Wraps styled rows into terminal lines.
 *
 * Width is measured with the same `string-width` Ink truncates by, not `String.length`. A Hangul syllable
 * occupies two columns and one code unit, so a length-based wrap puts Korean text past the right edge and Ink
 * then truncates it somewhere the wrap did not expect.
 *
 * Wrapping happens here rather than in Ink because the transcript pane has a fixed height and scrolls:
 * `wrap="wrap"` would make one paragraph occupy a number of rows nothing upstream knows, and the window
 * arithmetic — how many rows above, how many below — would be computed against the wrong total.
 */
export class CodeTuiLines {
  static width(text: string) {
    return stringWidth(text);
  }

  static rows(rows: CodeTuiRow[], width: number, keyBase: string): CodeTuiLine[] {
    const lines: CodeTuiLine[] = [];
    rows.forEach((row, idx) => {
      for (const line of CodeTuiLines.#row(row, Math.max(8, width), `${keyBase}:${idx}`)) lines.push(line);
    });
    return lines;
  }

  static #row(row: CodeTuiRow, width: number, key: string): CodeTuiLine[] {
    const prefix = row.prefix;
    const head = prefix ? CodeTuiLines.width(prefix.text) : 0;
    const hang = row.hang ?? " ".repeat(head);
    const body = width - Math.max(head, CodeTuiLines.width(hang));
    const wrapped = CodeTuiLines.#wrap(row.spans, Math.max(4, body));
    if (!wrapped.length) wrapped.push([]);
    return wrapped.map((spans, at) => ({
      key: `${key}:${at}`,
      spans: [...(at === 0 ? (prefix ? [prefix] : []) : hang ? [{ text: hang } satisfies CodeTuiSpan] : []), ...spans],
    }));
  }

  /**
   * Word wrap over a styled run, breaking mid-word only for a token wider than the line — a path, a base64
   * blob, or CJK text, which carries no spaces to break at.
   */
  static #wrap(spans: CodeTuiSpan[], width: number): CodeTuiSpan[][] {
    const lines: CodeTuiSpan[][] = [];
    let line: CodeTuiSpan[] = [];
    let used = 0;
    // True only after an overflow break. Leading whitespace is dropped there — it is the space the break
    // replaced — but kept after an explicit newline, where it is the writer's own indentation and dropping it
    // reflows code that a language parses by column.
    let soft = false;
    const push = (fromWrap: boolean) => {
      lines.push(line);
      line = [];
      used = 0;
      soft = fromWrap;
    };
    for (const span of spans) {
      const { text, ...style } = span;
      for (const piece of text.split("\n").flatMap((part, at) => (at ? [null, part] : [part]))) {
        if (piece === null) {
          push(false);
          continue;
        }
        for (const word of CodeTuiLines.#words(piece)) {
          const size = CodeTuiLines.width(word);
          if (!word.trim() && !used && soft) continue;
          if (used && used + size > width) push(true);
          if (size > width) {
            for (const chunk of CodeTuiLines.#chunks(word, width)) {
              if (used) push(true);
              line.push({ ...style, text: chunk });
              used = CodeTuiLines.width(chunk);
              if (used >= width) push(true);
            }
            continue;
          }
          line.push({ ...style, text: word });
          used += size;
        }
      }
    }
    if (line.length) lines.push(line);
    return lines;
  }

  /** Words with their trailing space attached, so a break never loses or doubles the separator. */
  static #words(text: string) {
    return text.match(/\S+\s*|\s+/g) ?? [];
  }

  static #chunks(word: string, width: number) {
    const chunks: string[] = [];
    let chunk = "";
    for (const char of word) {
      if (CodeTuiLines.width(chunk + char) > width) {
        chunks.push(chunk);
        chunk = char;
      } else chunk += char;
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  }

  /** The plain text of a line, for a test or a width check. */
  static text(line: CodeTuiLine) {
    return line.spans.map((span) => span.text).join("");
  }
}
