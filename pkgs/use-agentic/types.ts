export type JsonSchema = Record<string, unknown>;

export type ToolEffect = "state" | "query" | "mutation";

/** `true` asks with a default message, a string is the message, a function decides from the arguments. */
export type ToolConfirm = boolean | string | ((args: Record<string, unknown>) => string | boolean);

/** Re-checked at the moment of execution; a string is the refusal reason the agent reads. */
export type ToolGuard = (args: Record<string, unknown>) => true | string;

export interface ToolEntry {
  name: string;
  description?: string;
  parameters?: JsonSchema;
  effect?: ToolEffect;
  confirm?: ToolConfirm;
  guard?: ToolGuard;
  run: (args: Record<string, unknown>) => unknown;
}

/** One call an agent made through the surface, in the order it made them. */
export interface AgentCall {
  name: string;
  args: Record<string, unknown>;
  at: Date;
  error?: string;
}

export interface ResourceEntry {
  name: string;
  description?: string;
  /** `false` keeps it out of post-call diff reports — for values that change on their own every second. */
  report?: boolean;
  read: () => unknown;
}

export interface ScopeEntry {
  id: string;
  label?: string;
  kind?: string;
}

/**
 * A bulk contributor of entries whose names are already full — how a host store joins the surface. `view` is the
 * scope path a zone session reads through; a source that ignores it contributes the same entries to every view.
 */
export interface SurfaceSource {
  tools?: (view?: string[]) => ToolEntry[];
  resources?: (view?: string[]) => ResourceEntry[];
  subscribe?: (listener: () => void) => () => void;
}

/**
 * The reading half of a surface — what a session consumes. `AgenticSurface` is one; `surface.view(path)` answers a
 * zone-scoped one over the same registry, so zones are views of the screen, never walls between its parts.
 */
export interface SurfaceView {
  snapshot(): SurfaceSnapshot;
  tool(name: string): ToolEntry | null;
  call(name: string, args?: Record<string, unknown>): Promise<unknown>;
  read(name: string): unknown;
  diffSince(before: SurfaceSnapshot): ResourceDiff[];
  subscribe(listener: () => void): () => void;
}

export interface PublishedTool {
  name: string;
  description?: string;
  parameters?: JsonSchema;
  effect?: ToolEffect;
  needsConfirm: boolean;
}

export interface PublishedResource {
  name: string;
  description?: string;
  value?: unknown;
  error?: string;
}

export interface PublishedScope {
  path: string;
  label?: string;
  kind?: string;
}

export interface SurfaceSnapshot {
  tools: PublishedTool[];
  resources: PublishedResource[];
  scopes: PublishedScope[];
  /** Standing guidance texts, in registration order. Folded into the turn's instructions, not into context. */
  guides: string[];
}

export interface ResourceDiff {
  name: string;
  value?: unknown;
  error?: string;
  removed?: boolean;
}

export type ChatRole = "user" | "assistant" | "tool";

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolCallResult {
  id: string;
  name: string;
  /** What `run` returned. Must be JSON-serializable — it rides the wire back to the model. */
  result?: unknown;
  /** What the call changed on the surface — the whole report for a tool that returns nothing. */
  changes?: ResourceDiff[];
  error?: string;
}

export interface ChatMessage {
  role: ChatRole;
  text?: string;
  toolCalls?: ToolCallRequest[];
  toolResults?: ToolCallResult[];
  /** A failed or capped turn, recorded in the transcript rather than thrown past it. */
  error?: string;
}

/** One block of screen context the host assembles per turn. `kind` is the host's vocabulary; the wire forwards it verbatim. */
export interface ContextBlock {
  kind: string;
  [key: string]: unknown;
}

export type RunnerEvent =
  | { type: "text"; delta: string }
  | { type: "toolCall"; id: string; name: string; args: Record<string, unknown> }
  | { type: "done"; stop: "end" | "toolUse" }
  | { type: "error"; message: string };

export interface RunnerRequest {
  messages: ChatMessage[];
  tools: PublishedTool[];
  context: ContextBlock[];
  instructions?: string;
  signal: AbortSignal;
}

/** One model turn: request in, streamed events out. Where the loop runs is the implementation's business. */
export interface AgentRunner {
  run: (request: RunnerRequest) => AsyncIterable<RunnerEvent>;
}
