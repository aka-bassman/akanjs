import type { Workspace } from "@akanjs/devkit/commandDecorators";
import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";
import type { CodeAgentProfile } from "akanjs/common";
import { Type } from "typebox";

export interface SubagentPoolOptions {
  workspace: Workspace;
  cwd: string;
  parent: CodeAgentProfile;
  depth: number;
  /** Progress and refusals reach the parent's host through this rather than through a new event kind. */
  onNotice?: (message: string) => void;
}

const maxResultChars = 8_000;

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
  readonly #options: SubagentPoolOptions;
  #running = 0;
  #spent = 0;

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
      }),
      execute: async (_id, params, signal) => {
        const refusal = this.#refuse();
        if (refusal) return { content: [{ type: "text", text: refusal }], details: undefined, isError: true };
        this.#running += 1;
        try {
          return { content: [{ type: "text", text: await this.#run(params.prompt, signal) }], details: undefined };
        } finally {
          this.#running -= 1;
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
   * The child is the parent profile **narrowed** and never widened: one level less depth, in-memory sessions so
   * nothing it does shows up in the workspace's session tree, and no ability to ask a human — there is nobody
   * on the other end of a nested turn.
   */
  async #run(prompt: string, signal: AbortSignal | undefined) {
    const { CodeAgent } = await import("./CodeAgent");
    const parent = this.#options.parent;
    const budget = parent.tools.subagent;
    const child: CodeAgentProfile = {
      ...parent,
      name: `${parent.name}:sub`,
      tools: { ...parent.tools, subagent: budget ? { ...budget, maxDepth: budget.maxDepth } : false },
      session: { store: "memory", crossSession: false },
      ui: { canPrompt: false },
      // No `AGENTS.md` — a sub-agent is asked one narrow question and the guide is 26k tokens of its budget —
      // but the skills stay: they are descriptions until one is needed, and the child writes code too.
      context: { projectFiles: false, skills: parent.context.skills },
    };
    const agent = await CodeAgent.create({
      workspace: this.#options.workspace,
      cwd: this.#options.cwd,
      profile: child,
      apps: [],
      depth: this.#options.depth + 1,
    });
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
      this.#options.onNotice?.(`sub-agent finished, ${agent.tokensUsed} tokens (${this.#spent} of ${ceiling} spent)`);
      return answer.length > maxResultChars
        ? `${answer.slice(0, maxResultChars)}\n…(truncated)`
        : answer || "(no answer)";
    } finally {
      signal?.removeEventListener("abort", abort);
      agent.dispose();
    }
  }
}
