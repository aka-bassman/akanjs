import type { CodeAgentSubagent } from "akanjs/common";
import { type CodeTuiLine, CodeTuiLines, type CodeTuiSpan } from "./CodeTuiLines";

/**
 * The rail under the prompt: this session, then a row per sub-agent running right now.
 *
 * A `task` call is one tool row that stays open for minutes while a child reads the repo, so the transcript
 * says a sub-agent started and then nothing until it is over. The rail is the part that moves — how long each
 * child has been going and what it has spent — and it belongs beside the prompt rather than in the scrollback,
 * because a row that scrolls away is not a status.
 *
 * Every row is built to exactly one terminal line and never wrapped: the frame's height arithmetic counts
 * these rows before they are drawn, and a wrapped one would draw over the rule beneath it.
 */
export class CodeTuiAgents {
  /** Width of the `  ◯ ` marker each child row carries, and of the `❯ ⏺ ` the session row does. */
  static readonly markWidth = 4;
  /** Below this there is no room for a description, so the meta column is dropped rather than truncated. */
  static readonly minDescription = 12;

  static rows(agents: CodeAgentSubagent[], session: string, width: number, now = Date.now()): CodeTuiLine[] {
    if (!agents.length) return [];
    const kindColumn = Math.max(...agents.map((agent) => CodeTuiLines.width(agent.kind))) + 2;
    return [
      {
        key: "agents:self",
        spans: [{ text: "❯ ", color: "cyan" }, { text: "⏺ ", color: "green" }, { text: session }],
      },
      ...agents.map((agent, at) => ({
        key: `agents:${agent.id || at}`,
        spans: CodeTuiAgents.#row(agent, kindColumn, width, now),
      })),
    ];
  }

  static #row(agent: CodeAgentSubagent, kindColumn: number, width: number, now: number): CodeTuiSpan[] {
    const meta = `${CodeTuiAgents.elapsed(now - agent.startedAt)} · ↓ ${CodeTuiAgents.tokens(agent.tokens)} tokens`;
    const head = CodeTuiAgents.markWidth + kindColumn;
    const room = width - head - CodeTuiLines.width(meta) - 2;
    const spans: CodeTuiSpan[] = [{ text: "  ◯ ", color: "yellow" }, { text: agent.kind.padEnd(kindColumn) }];
    if (room < CodeTuiAgents.minDescription)
      return [...spans, { text: CodeTuiAgents.#clip(agent.description, Math.max(1, width - head)) }];
    const description = CodeTuiAgents.#clip(agent.description, room);
    // Padded by columns rather than with `padEnd`, which counts code units: a Korean description would push
    // the meta column off the right edge by exactly the number of Hangul syllables in it.
    const pad = " ".repeat(Math.max(0, room - CodeTuiLines.width(description)));
    return [...spans, { text: `${description}${pad}` }, { text: `  ${meta}`, dim: true }];
  }

  /** `47s`, `12m 30s`, `1h 2m` — the unit a person reads at that scale, never a bare second count past an hour. */
  static elapsed(ms: number) {
    const total = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /** `842`, `12.4k`, `1.3M` — one decimal, because the digit that moves is the one being watched. */
  static tokens(count: number) {
    if (count < 1_000) return `${Math.max(0, Math.round(count))}`;
    if (count < 1_000_000) return `${(count / 1_000).toFixed(1)}k`;
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  /** Clipped by terminal columns, not code units: one Hangul syllable is two columns and one unit. */
  static #clip(text: string, width: number) {
    if (CodeTuiLines.width(text) <= width) return text;
    let clipped = "";
    for (const char of text) {
      if (CodeTuiLines.width(clipped + char) > width - 1) break;
      clipped += char;
    }
    return `${clipped}…`;
  }
}
