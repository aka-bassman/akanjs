// `tools` applies at assembly time (an unlisted tool is never built); `approval`, `paths`, `limits` gate at runtime.

export type CodeAgentBuiltinTool = "read" | "write" | "edit" | "ls" | "grep" | "find" | "bash";

/** `never` trusts the environment, `all` trusts nothing. */
export type CodeAgentApprovalPolicy = "never" | "writes" | "commands" | "all";

/** `await` holds the turn open; `suspend` ends it and the host reopens one carrying the answer (survives a restart). */
export type CodeAgentInteractionMode = "await" | "suspend";

export interface CodeAgentModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  /** The model the session is running on. */
  current: boolean;
}

export interface CodeAgentProviderInfo {
  id: string;
  name: string;
  authorized: boolean;
  models: CodeAgentModelInfo[];
}

export interface CodeAgentMcpServerRef {
  name: string;
  transport: "stdio" | "http";
  /** stdio: the executable and its argv. http: the endpoint. */
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  /** For a server that answers `401` and whose OAuth client or scopes cannot be discovered. */
  oauth?: { clientId?: string; clientSecret?: string; scope?: string };
}

/** `required` is not a failure: the server answered correctly and said who may talk to it. */
export type CodeAgentMcpAuthState = "none" | "authorized" | "required";

/** One declared MCP server; one that was never reachable is listed too, with its `error`. */
export interface CodeAgentMcpStatus {
  name: string;
  transport: "stdio" | "http";
  /** The command line or the url. */
  target: string;
  /** Published tool names, already prefixed with the server the way the model sees them. */
  tools: string[];
  /** Why it published none, when it published none. */
  error?: string;
  auth?: CodeAgentMcpAuthState;
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
    /** `"off"` reaches no server; an array discovers `.akan/code/mcp.json` plus the servers it names. */
    mcp: "off" | CodeAgentMcpServerRef[];
    subagent: false | CodeAgentSubagentBudget;
    web: { fetch: boolean; search: boolean };
  };
  approval: CodeAgentApprovalPolicy;
  paths: { root: string; allow?: string[]; deny?: string[] };
  session: { store: "file" | "memory" | "remote"; crossSession: boolean };
  interaction: { question: CodeAgentInteractionMode; approval: CodeAgentInteractionMode };
  network: { allowHosts?: string[]; proxyBaseUrl?: string };
  ui: { canPrompt: boolean };
  limits: {
    turnMs: number;
    toolOutputBytes: number;
    contextTokens: number;
    /** How many times one turn-end plugin may reopen a turn with the same finding before it gives up. */
    feedback: number;
  };
  context: {
    /** Whether the repo's `AGENTS.md` is loaded. */
    projectFiles: boolean;
    /** The akan skill set: only each skill's one-line description sits in the window until a task matches. */
    skills: boolean;
  };
}

const allBuiltins: CodeAgentBuiltinTool[] = ["read", "write", "edit", "ls", "grep", "find", "bash"];
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
  // Nobody watches a pod, so both interactions suspend; MCP is off because a stdio server started inside is unvetted.
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
