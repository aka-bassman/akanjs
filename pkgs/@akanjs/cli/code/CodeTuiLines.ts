import { codeAgentClip } from "akanjs/common";
import type { CodeTranscriptPart } from "./CodeTranscript";

export interface CodeTuiLine {
  key: string;
  text: string;
  color?: string;
  dim?: boolean;
  bold?: boolean;
}

/**
 * Renders transcript parts as terminal rows.
 *
 * Wrapping happens here rather than in Ink because the pane has a fixed height and scrolls: `wrap="wrap"`
 * would make one part occupy a number of rows nothing upstream knows, and the window arithmetic — how many
 * rows are above, how many below — would be computed against the wrong total.
 */
export class CodeTuiLines {
  /** Enough to say what failed without turning a stack trace into the whole screen. */
  static readonly outputLines = 3;

  static of(parts: readonly CodeTranscriptPart[], width: number): CodeTuiLine[] {
    const lines: CodeTuiLine[] = [];
    for (const part of parts) for (const line of CodeTuiLines.#part(part, Math.max(20, width))) lines.push(line);
    return lines;
  }

  static #part(part: CodeTranscriptPart, width: number): CodeTuiLine[] {
    switch (part.kind) {
      case "user":
        return CodeTuiLines.#block(part.id, part.text, width, { prefix: "› ", color: "cyan", bold: true });
      case "assistant": {
        const body = CodeTuiLines.#block(part.id, part.text, width, {});
        if (!part.truncated) return body;
        return [
          ...body,
          {
            key: `${part.id}:cut`,
            text: "… the answer stopped at the model's output limit — ask it to continue",
            color: "yellow",
          },
        ];
      }
      case "thinking":
        return CodeTuiLines.#block(part.id, part.text, width, { prefix: "· ", dim: true });
      case "tool":
        return CodeTuiLines.#tool(part, width);
      case "notice":
        return CodeTuiLines.#block(part.id, part.text, width, {
          prefix: part.level === "info" ? "" : `${part.level}: `,
          color: part.level === "error" ? "red" : part.level === "warning" ? "yellow" : undefined,
          dim: part.level === "info",
        });
      case "question":
        return CodeTuiLines.#question(part, width);
      case "approval":
        return [
          ...CodeTuiLines.#block(part.id, `approve? ${part.request.summary}`, width, { color: "yellow" }),
          ...(part.approved === undefined
            ? []
            : [{ key: `${part.id}:r`, text: part.approved ? "  approved" : "  denied", dim: true }]),
        ];
      case "host":
        return CodeTuiLines.#block(part.id, `${part.hostKind} ${part.text}`, width, { dim: true });
      default:
        return [];
    }
  }

  static #tool(part: Extract<CodeTranscriptPart, { kind: "tool" }>, width: number): CodeTuiLine[] {
    const mark = part.outcome === "ok" ? "✓" : part.outcome === "error" ? "✗" : part.outcome === "blocked" ? "⦸" : "→";
    const color =
      part.outcome === "ok"
        ? "green"
        : part.outcome === "error"
          ? "red"
          : part.outcome === "blocked"
            ? "yellow"
            : "cyan";
    const head = CodeTuiLines.#block(part.id, `${mark} ${part.tool.title}`, width, { color });
    // A successful call's output is already in the model's context and says nothing a person needs; a failed
    // or refused one is the only reason the row is worth reading.
    if (part.outcome === "ok" || part.outcome === undefined)
      return part.progress && part.outcome === undefined
        ? [...head, { key: `${part.id}:p`, text: `  ${codeAgentClip(part.progress, width - 2)}`, dim: true }]
        : head;
    const body = (part.output ?? "")
      .split("\n")
      .filter((line) => line.trim())
      .slice(0, CodeTuiLines.outputLines);
    return [
      ...head,
      ...body.map((line, idx) => ({
        key: `${part.id}:o${idx}`,
        text: `  ${codeAgentClip(line, width - 2)}`,
        dim: true,
      })),
    ];
  }

  static #question(part: Extract<CodeTranscriptPart, { kind: "question" }>, width: number): CodeTuiLine[] {
    const head = CodeTuiLines.#block(part.id, `? ${part.question.prompt}`, width, { color: "yellow" });
    const options = (part.question.options ?? []).map((option, idx) => ({
      key: `${part.id}:o${idx}`,
      text: `  ${option.label}${option.recommended ? " (recommended)" : ""}`,
      dim: true,
    }));
    if (part.rendered === undefined) return [...head, ...options];
    return [...head, ...options, { key: `${part.id}:a`, text: `  = ${part.rendered}`, color: "green" }];
  }

  static #block(
    id: string,
    text: string,
    width: number,
    style: { prefix?: string; color?: string; dim?: boolean; bold?: boolean },
  ): CodeTuiLine[] {
    const prefix = style.prefix ?? "";
    const indent = " ".repeat(prefix.length);
    const rows: string[] = [];
    for (const paragraph of text.split("\n"))
      for (const row of CodeTuiLines.#wrap(paragraph, width - prefix.length)) rows.push(row);
    if (!rows.length) rows.push("");
    return rows.map((row, idx) => ({
      key: `${id}:${idx}`,
      text: `${idx === 0 ? prefix : indent}${row}`,
      ...(style.color ? { color: style.color } : {}),
      ...(style.dim ? { dim: true } : {}),
      ...(style.bold ? { bold: true } : {}),
    }));
  }

  /** Word wrap, breaking mid-word only for a token longer than the pane — a path or a base64 blob. */
  static #wrap(text: string, width: number): string[] {
    if (width <= 0) return [text];
    if (text.length <= width) return [text];
    const rows: string[] = [];
    let row = "";
    for (const word of text.split(" ")) {
      if (!row.length && word.length > width) {
        for (let at = 0; at < word.length; at += width) rows.push(word.slice(at, at + width));
        row = rows.pop() ?? "";
        continue;
      }
      if (row.length && `${row} ${word}`.length > width) {
        rows.push(row);
        row = word;
        continue;
      }
      row = row.length ? `${row} ${word}` : word;
    }
    if (row.length) rows.push(row);
    return rows;
  }
}
