import { type CodeTranscriptPart, codeAgentClip } from "akanjs/common";
import { type CodeTuiLine, CodeTuiLines, type CodeTuiRow, type CodeTuiSpan } from "./CodeTuiLines";
import { CodeTuiMarkdown } from "./CodeTuiMarkdown";

export interface CodeTuiPartsOptions {
  /** Whether reasoning is drawn in full. Folded to one line otherwise. */
  thinking?: boolean;
}

/**
 * Transcript parts as terminal rows.
 *
 * The shape follows what a coding agent's terminal has settled on: a filled bullet opens a tool call and its
 * result hangs under it on an elbow, reasoning is folded away behind one dim line, and the assistant's own
 * prose is the only thing rendered at full width with no marker — because it is the thing being read.
 */
export class CodeTuiParts {
  /** How much reasoning stays on screen. The whole of it is in the transcript; this is the part worth watching. */
  static readonly thinkingLines = 6;
  /** Lines of a failed call's output. Enough to name the failure, not enough to become the screen. */
  static readonly outputLines = 4;

  static lines(parts: readonly CodeTranscriptPart[], width: number, options: CodeTuiPartsOptions = {}): CodeTuiLine[] {
    const lines: CodeTuiLine[] = [];
    parts.forEach((part, at) => {
      const rows = CodeTuiParts.rows(part, width, options);
      for (const line of CodeTuiLines.rows(rows, width, `${part.id}:${at}`)) lines.push(line);
    });
    return lines;
  }

  static rows(part: CodeTranscriptPart, width = 80, options: CodeTuiPartsOptions = {}): CodeTuiRow[] {
    switch (part.kind) {
      case "user":
        return [
          { prefix: { text: "› ", color: "cyan", bold: true }, spans: [{ text: part.text, color: "cyan" }] },
          ...(part.images
            ? [
                {
                  prefix: { text: "  ", dim: true },
                  spans: [{ text: `⧉ ${part.images} image${part.images > 1 ? "s" : ""}`, dim: true }],
                },
              ]
            : []),
        ];
      case "assistant":
        return CodeTuiParts.#assistant(part, width);
      case "thinking":
        return options.thinking ? CodeTuiParts.#thinking(part.text) : CodeTuiParts.#folded(part.text);
      case "tool":
        return CodeTuiParts.#tool(part);
      case "notice":
        return part.text.split("\n").map((line, at) => ({
          prefix: { text: at === 0 && part.level !== "info" ? "! " : "  ", ...CodeTuiParts.#noticeStyle(part.level) },
          spans: CodeTuiMarkdown.spans(line, CodeTuiParts.#noticeStyle(part.level)),
        }));
      case "question":
        return CodeTuiParts.#question(part);
      case "approval":
        return [
          { prefix: { text: "? ", color: "yellow" }, spans: [{ text: part.request.summary, color: "yellow" }] },
          ...(part.approved === undefined
            ? []
            : [{ prefix: { text: "  " }, spans: [{ text: part.approved ? "approved" : "denied", dim: true }] }]),
        ];
      case "host":
        return [{ prefix: { text: "  ", dim: true }, spans: [{ text: `${part.hostKind} ${part.text}`, dim: true }] }];
      default:
        return [];
    }
  }

  static #assistant(part: Extract<CodeTranscriptPart, { kind: "assistant" }>, width: number): CodeTuiRow[] {
    // Rendered while it streams, not only once settled. Half-arrived markdown is the state a reader spends
    // most of the answer looking at, and the scanner is stable there — measured: an unterminated fence scans
    // as `code` from its opening line, so the block it becomes is the block it started as.
    const rows = CodeTuiMarkdown.rows(part.text, width);
    if (!part.truncated) return rows;
    return [
      ...rows,
      { spans: [{ text: "… the answer stopped at the model's output limit — ask it to continue", color: "yellow" }] },
    ];
  }

  /**
   * Reasoning, folded — the default, because it is the model talking to itself.
   *
   * Drawn as a marked one-liner rather than dropped: reasoning arrives before the first token of an answer and
   * before the first tool call, so a turn that opens with a long think would otherwise be a blank screen, and
   * a reader who wants it has no way to learn it is there.
   */
  static #folded(text: string): CodeTuiRow[] {
    const count = text.split("\n").filter((line) => line.trim()).length;
    return [
      {
        prefix: { text: "✻ ", dim: true },
        spans: [{ text: `thinking · ${count} line${count === 1 ? "" : "s"} · /thinking to show`, dim: true }],
      },
    ];
  }

  static #thinking(text: string): CodeTuiRow[] {
    const all = text.split("\n").filter((line) => line.trim());
    const shown = all.slice(-CodeTuiParts.thinkingLines);
    const hidden = all.length - shown.length;
    return [
      ...(hidden
        ? [{ prefix: { text: "· ", dim: true }, spans: [{ text: `(${hidden} earlier lines)`, dim: true }] }]
        : []),
      ...shown.map((line) => ({
        prefix: { text: "· ", dim: true },
        spans: [{ text: line, dim: true, italic: true }] satisfies CodeTuiSpan[],
      })),
    ];
  }

  static #tool(part: Extract<CodeTranscriptPart, { kind: "tool" }>): CodeTuiRow[] {
    const running = part.outcome === undefined;
    const mark = running ? "◐" : part.outcome === "ok" ? "⏺" : part.outcome === "blocked" ? "⦸" : "⏺";
    const color = running ? "cyan" : part.outcome === "ok" ? "green" : part.outcome === "blocked" ? "yellow" : "red";
    const head: CodeTuiRow = {
      prefix: { text: `${mark} `, color },
      hang: "  ",
      spans: CodeTuiParts.#title(part.tool.name, part.tool.title),
    };
    const detail = CodeTuiParts.#detail(part);
    if (!detail.length) return [head];
    return [
      head,
      ...detail.map((line, at) => ({
        prefix: { text: at === 0 ? "  ⎿ " : "    ", dim: true },
        hang: "    ",
        spans: [{ text: line, dim: true }] satisfies CodeTuiSpan[],
      })),
    ];
  }

  /** The tool's name reads as a name, and its arguments recede — the name is what is scanned for. */
  static #title(name: string, title: string): CodeTuiSpan[] {
    if (!title.startsWith(name)) return [{ text: title, bold: true }];
    return [
      { text: name, bold: true },
      { text: title.slice(name.length), dim: true },
    ];
  }

  static #detail(part: Extract<CodeTranscriptPart, { kind: "tool" }>) {
    if (part.outcome === undefined) return part.progress ? [part.progress] : [];
    // A successful call's output is already in the model's context and says nothing a person needs; a failed
    // or refused one is the only reason the row is worth reading past its name.
    if (part.outcome === "ok") return [];
    return (part.output ?? "")
      .split("\n")
      .filter((line) => line.trim())
      .slice(0, CodeTuiParts.outputLines)
      .map((line) => codeAgentClip(line.trim(), 200));
  }

  static #question(part: Extract<CodeTranscriptPart, { kind: "question" }>): CodeTuiRow[] {
    return [
      { prefix: { text: "? ", color: "yellow" }, spans: [{ text: part.question.prompt, color: "yellow" }] },
      ...(part.question.options ?? []).map((option) => ({
        prefix: { text: "  · ", dim: true },
        spans: [{ text: `${option.label}${option.recommended ? " (recommended)" : ""}`, dim: true }],
      })),
      ...(part.rendered === undefined
        ? []
        : [{ prefix: { text: "  = ", color: "green" }, spans: [{ text: part.rendered, color: "green" }] }]),
    ];
  }

  static #noticeStyle(level: "info" | "warning" | "error") {
    if (level === "error") return { color: "red" };
    if (level === "warning") return { color: "yellow" };
    return { dim: true };
  }
}
