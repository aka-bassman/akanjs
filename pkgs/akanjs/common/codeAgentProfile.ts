/**
 * What a code agent is allowed to be, as one value.
 *
 * The profile is read by both the host and the core, so it lives here rather than in the CLI. Most of it is
 * applied at **assembly time** — a tool outside `tools` is never constructed, so the model cannot call it and
 * it costs no prompt tokens either. The runtime hooks (`approval`, `paths`, `limits`) are the second gate, for
 * the things assembly cannot decide in advance.
 */

export type CodeAgentBuiltinTool = "read" | "write" | "edit" | "ls" | "grep" | "find" | "bash";

/** `never` trusts the environment, `all` trusts nothing. The middle two are the useful ones. */
export type CodeAgentApprovalPolicy = "never" | "writes" | "commands" | "all";

/**
 * How the core behaves while a human is being asked something.
 *
 * `await` holds the turn open until the answer arrives. `suspend` resolves the request with a sentinel, ends the
 * turn, and expects the host to reopen one carrying the answer — which is the only form that survives a process
 * restart and does not hold a shared workspace for the minutes or days a person may take to answer.
 */
export type CodeAgentInteractionMode = "await" | "suspend";

export interface CodeAgentMcpServerRef {
  name: string;
  transport: "stdio" | "http";
  /** stdio: the executable and its argv. http: the endpoint. */
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/**
 * One declared MCP server, as the session found it.
 *
 * A server that answered and one that was never reachable are both here: an integration that is silently
 * absent is indistinguishable from one the model simply chose not to use, and the tool names are the only
 * evidence of which of the two happened.
 */
export interface CodeAgentMcpStatus {
  name: string;
  transport: "stdio" | "http";
  /** The command line or the url — what tells two entries of the same shape apart without opening the file. */
  target: string;
  /** Published tool names, already prefixed with the server the way the model sees them. */
  tools: string[];
  /** Why it published none, when it published none. */
  error?: string;
}

export interface CodeAgentSubagentBudget {
  maxDepth: number;
  maxConcurrent: number;
  /** Tokens a whole subagent tree may spend before the `task` tool refuses to open another. */
  budget: number;
}

export interface CodeAgentProfile {
  name: string;
  tools: {
    builtin: CodeAgentBuiltinTool[];
    /** Workflow, context and self-verification tools built on devkit. */
    akan: boolean;
    /**
     * `"off"` reaches no server at all. An array turns discovery on: the workspace's `.akan/code/mcp.json`
     * plus whatever the array names, so the common case is an empty array.
     */
    mcp: "off" | CodeAgentMcpServerRef[];
    subagent: false | CodeAgentSubagentBudget;
    web: { fetch: boolean; search: boolean };
  };
  approval: CodeAgentApprovalPolicy;
  paths: { root: string; allow?: string[]; deny?: string[] };
  session: { store: "file" | "memory" | "remote"; crossSession: boolean };
  interaction: { question: CodeAgentInteractionMode; approval: CodeAgentInteractionMode };
  network: { allowHosts?: string[]; proxyBaseUrl?: string };
  /** Whether the host can answer a question at all. A pod has nobody in front of it. */
  ui: { canPrompt: boolean };
  limits: {
    turnMs: number;
    toolOutputBytes: number;
    contextTokens: number;
    /** How many times one turn-end plugin may reopen a turn with the same finding before it gives up. */
    feedback: number;
  };
  context: {
    /** The repo's `AGENTS.md` is ~26k tokens; a read-only reviewer does not need it. */
    projectFiles: boolean;
    /**
     * The akan skill set — the scaffolding chain, the store surface, the validation loop.
     *
     * Only each skill's one-line description sits in the window; the body is read when a task matches. That
     * makes it the cheapest context of the three, and the most valuable to a profile carrying no `AGENTS.md`.
     */
    skills: boolean;
  };
}

const allBuiltins: CodeAgentBuiltinTool[] = ["read", "write", "edit", "ls", "grep", "find", "bash"];
/** The builtins that cannot change anything, which is what a profile is narrowed to when it must not. */
export const codeAgentReadOnlyBuiltins: CodeAgentBuiltinTool[] = ["read", "ls", "grep", "find"];

const baseLimits = { turnMs: 900_000, toolOutputBytes: 200_000, contextTokens: 0, feedback: 2 };

/** Paths no profile may read, whatever its allowlist says. */
export const codeAgentDeniedPaths = ["**/.env", "**/.env.*", "**/secrets/**", "**/*.pem", "**/*.key"];

export const codeAgentPresets = {
  local: (root: string): CodeAgentProfile => ({
    name: "local",
    tools: {
      builtin: allBuiltins,
      akan: true,
      mcp: [],
      subagent: { maxDepth: 2, maxConcurrent: 3, budget: 200_000 },
      web: { fetch: true, search: true },
    },
    approval: "never",
    paths: { root, deny: codeAgentDeniedPaths },
    session: { store: "file", crossSession: true },
    interaction: { question: "await", approval: "await" },
    network: {},
    ui: { canPrompt: true },
    limits: baseLimits,
    context: { projectFiles: true, skills: true },
  }),
  /**
   * An isolated container. Everything is on because the container is the boundary, but nobody is watching it:
   * a question that waits for an answer would hang the pod, so both interactions suspend. MCP is off because
   * a pod's egress goes through a proxy and a stdio server started inside it is a process nobody vetted.
   */
  pod: (root: string): CodeAgentProfile => ({
    name: "pod",
    tools: {
      builtin: allBuiltins,
      akan: true,
      mcp: "off",
      subagent: { maxDepth: 2, maxConcurrent: 3, budget: 200_000 },
      web: { fetch: true, search: true },
    },
    approval: "never",
    paths: { root, deny: codeAgentDeniedPaths },
    session: { store: "remote", crossSession: true },
    interaction: { question: "suspend", approval: "suspend" },
    network: {},
    ui: { canPrompt: false },
    limits: baseLimits,
    context: { projectFiles: true, skills: true },
  }),
  /** A reviewer reads the repo and nothing else, so it reaches no external service. */
  review: (root: string): CodeAgentProfile => ({
    name: "review",
    tools: {
      builtin: codeAgentReadOnlyBuiltins,
      akan: true,
      mcp: "off",
      subagent: { maxDepth: 1, maxConcurrent: 4, budget: 120_000 },
      web: { fetch: false, search: false },
    },
    approval: "never",
    paths: { root, deny: codeAgentDeniedPaths },
    session: { store: "memory", crossSession: false },
    interaction: { question: "await", approval: "await" },
    network: {},
    ui: { canPrompt: true },
    limits: baseLimits,
    context: { projectFiles: false, skills: true },
  }),
  /** Isolation and approval are different axes: a pod is safe and its user may still want to be asked. */
  web: (root: string): CodeAgentProfile => ({
    name: "web",
    tools: {
      builtin: allBuiltins,
      akan: true,
      mcp: [],
      subagent: { maxDepth: 2, maxConcurrent: 3, budget: 200_000 },
      web: { fetch: true, search: true },
    },
    approval: "writes",
    paths: { root, deny: codeAgentDeniedPaths },
    session: { store: "file", crossSession: true },
    interaction: { question: "suspend", approval: "suspend" },
    network: {},
    ui: { canPrompt: true },
    limits: baseLimits,
    context: { projectFiles: true, skills: true },
  }),
} as const;

export type CodeAgentPresetName = keyof typeof codeAgentPresets;

export const isCodeAgentPresetName = (name: string): name is CodeAgentPresetName => name in codeAgentPresets;
