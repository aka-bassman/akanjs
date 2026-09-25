import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";
import { type CodeAgentProfile, type CodeAgentSubagent, codeAgentReadOnlyBuiltins } from "akanjs/common";
import { Type } from "typebox";
import type { Workspace } from "../../commandDecorators";

export interface SubagentPoolOptions {
  workspace: Workspace;
  cwd: string;
  parent: CodeAgentProfile;
  depth: number;
  /** Progress and refusals reach the parent's host through this rather than through a new event kind. */
  onNotice?: (message: string) => void;
  /** The running children, whole, for a host that draws them as a rail beside the prompt. */
  onAgents?: (agents: CodeAgentSubagent[]) => void;
}

const maxResultChars = 8_000;

/**
 * How often the running children are re-reported while none of them starts or finishes.
 *
 * A child spends tokens for minutes between the two frames its lifetime would otherwise produce, and the
 * number that decides whether to let it keep going is the one climbing in between. One frame a second for at
 * most a handful of rows is far below what a single streaming turn already puts on the wire.
 */
const tickMs = 1_000;

export type SubagentKind = keyof typeof SubagentPool.kinds;

/**
 * The `task` tool: run a narrowed copy of the agent on one question and bring back a summary.
 *
 * **Only the summary crosses back.** A subagent's whole transcript in the parent's context is the fastest way
 * to spend a window, and the reason to spawn one is precisely that its reading should not become the parent's
 * reading.
 *
 * **The budget is not optional.** Depth, concurrency and token ceilings are checked before a child exists,
 * because a recursive `task` with no ceiling is a fork bomb that bills per token.
 */
export class SubagentPool {
  /**
   * What a sub-agent is allowed to be, and the only axis that matters: whether it can change the tree.
   *
   * A reader can be spawned for anything — the worst it costs is tokens. A writer works unwatched on the same
   * checkout as its parent, so it is the one the parent has to ask for by name rather than get by default.
   */
  static readonly kinds = {
    explore: {
      readOnly: true,
      desc: "reads, searches and reports back. It cannot write a file or run a command.",
    },
    code: {
      readOnly: false,
      desc: "makes the change itself, with the same tools as this session.",
    },
  } as const;

  static readonly defaultKind: SubagentKind = "explore";

  readonly #options: SubagentPoolOptions;
  /** Keyed by the `task` call that opened each child. `agent` lands once it exists, and reports live tokens. */
  readonly #children = new Map<
    string,
    { kind: SubagentKind; description: string; startedAt: number; agent?: { tokensUsed: number } }
  >();
  #running = 0;
  #spent = 0;
  #ticker: ReturnType<typeof setInterval> | null = null;

  constructor(options: SubagentPoolOptions) {
    this.#options = options;
  }

  static extensionFor(options: SubagentPoolOptions): InlineExtension | undefined {
    if (!options.parent.tools.subagent) return undefined;
    if (options.depth >= options.parent.tools.subagent.maxDepth) return undefined;
    const pool = new SubagentPool(options);
    return { name: "akan-subagent", factory: (pi: ExtensionAPI) => pool.#register(pi) };
  }

  static readonly toolName = "task";

  #register(pi: ExtensionAPI) {
    pi.registerTool({
      name: SubagentPool.toolName,
      label: "Task",
      description:
        "Run a focused sub-agent on one self-contained question and get back its answer. Use it for searching and reading that would otherwise fill this conversation — the sub-agent's own reading does not come back, only its answer. Give it everything it needs: it cannot see this conversation.",
      promptSnippet: "task: run a sub-agent on one self-contained question and get back only its answer",
      parameters: Type.Object({
        description: Type.String({ description: "Three to five words naming the task, for the activity log." }),
        prompt: Type.String({
          description: "The complete instruction. The sub-agent sees nothing of this conversation.",
        }),
        type: Type.Optional(
          Type.Union(
            Object.entries(SubagentPool.kinds).map(([kind, spec]) => Type.Literal(kind, { description: spec.desc })),
            { description: `What the sub-agent may do. Defaults to ${SubagentPool.defaultKind}.` },
          ),
        ),
      }),
      execute: async (id, params, signal) => {
        const kind = (params.type ?? SubagentPool.defaultKind) as SubagentKind;
        const refusal = this.#refuse();
        if (refusal) return { content: [{ type: "text", text: refusal }], details: undefined, isError: true };
        this.#running += 1;
        this.#children.set(id, { kind, description: params.description, startedAt: Date.now() });
        this.#report();
        // Said before it starts, not only when it ends: a turn that goes quiet for a minute while a child
        // reads the repo is otherwise indistinguishable from a turn that has stopped responding.
        this.#options.onNotice?.(`${kind} sub-agent · ${params.description}`);
        try {
          const text = await this.#run(id, kind, params.prompt, signal);
          return { content: [{ type: "text", text }], details: undefined };
        } finally {
          this.#running -= 1;
          this.#children.delete(id);
          this.#report();
        }
      },
    });
  }

  #refuse() {
    const budget = this.#options.parent.tools.subagent;
    if (!budget) return "Sub-agents are disabled by this profile.";
    if (this.#running >= budget.maxConcurrent)
      return `Too many sub-agents are already running (limit ${budget.maxConcurrent}). Wait for one to finish.`;
    if (this.#spent >= budget.budget)
      return `The sub-agent token budget (${budget.budget}) is spent. Do the rest of this work yourself.`;
    return undefined;
  }

  /**
   * The child is the parent profile **narrowed** and never widened: in-memory sessions so nothing it does
   * shows up in the workspace's session tree, no `AGENTS.md` — a sub-agent is asked one narrow question and
   * the guide is 26k tokens of its budget — and no ability to ask a human, there being nobody on the other
   * end of a nested turn. The skills stay: they are descriptions until one is needed, and the child writes
   * code too.
   */
  static childOf(parent: CodeAgentProfile, kind: SubagentKind): CodeAgentProfile {
    const budget = parent.tools.subagent;
    return {
      ...parent,
      name: `${parent.name}:${kind}`,
      tools: {
        ...parent.tools,
        // Filtered rather than replaced, so a kind can only ever take tools away from the parent: a child of
        // a read-only session must not become the one thing in the tree that can write.
        builtin: SubagentPool.kinds[kind].readOnly
          ? parent.tools.builtin.filter((tool) => codeAgentReadOnlyBuiltins.includes(tool))
          : parent.tools.builtin,
        subagent: budget ? { ...budget, maxDepth: budget.maxDepth } : false,
      },
      session: { store: "memory", crossSession: false },
      ui: { canPrompt: false },
      context: { projectFiles: false, skills: parent.context.skills },
    };
  }

  /**
   * The running children as a list, and the ticker that keeps it moving.
   *
   * The ticker is owned by the report rather than by the tool call: two children overlapping must not each
   * start one, and the last one to finish is what stops it. It is unref'd because a pool with a child still
   * registered is a bug that should end the process, not hold it open.
   */
  #report() {
    const onAgents = this.#options.onAgents;
    if (!onAgents) return;
    onAgents(
      [...this.#children].map(([id, child]) => ({
        id,
        kind: child.kind,
        description: child.description,
        startedAt: child.startedAt,
        tokens: child.agent?.tokensUsed ?? 0,
      })),
    );
    if (this.#children.size && !this.#ticker) {
      this.#ticker = setInterval(() => this.#report(), tickMs);
      this.#ticker.unref?.();
    } else if (!this.#children.size && this.#ticker) {
      clearInterval(this.#ticker);
      this.#ticker = null;
    }
  }

  async #run(id: string, kind: SubagentKind, prompt: string, signal: AbortSignal | undefined) {
    const { CodeAgent } = await import("./CodeAgent");
    const budget = this.#options.parent.tools.subagent;
    const child = SubagentPool.childOf(this.#options.parent, kind);
    const agent = await CodeAgent.create({
      workspace: this.#options.workspace,
      cwd: this.#options.cwd,
      profile: child,
      apps: [],
      depth: this.#options.depth + 1,
    });
    const running = this.#children.get(id);
    if (running) running.agent = agent;
    const abort = () => void agent.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      let answer = "";
      agent.on((event) => {
        if (event.type === "message" && event.role === "assistant") answer = event.text;
      });
      await agent.prompt(prompt);
      await agent.waitForIdle();
      this.#spent += agent.tokensUsed;
      const ceiling = budget ? budget.budget : 0;
      this.#options.onNotice?.(
        `${kind} sub-agent finished, ${agent.tokensUsed} tokens (${this.#spent} of ${ceiling} spent)`,
      );
      return answer.length > maxResultChars
        ? `${answer.slice(0, maxResultChars)}\n…(truncated)`
        : answer || "(no answer)";
    } finally {
      signal?.removeEventListener("abort", abort);
      agent.dispose();
    }
  }
}
