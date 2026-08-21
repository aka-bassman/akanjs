export interface AgentWireToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AgentWireToolResult {
  id: string;
  name: string;
  result?: unknown;
  changes?: unknown[];
  error?: string;
}

/**
 * One transcript message of the in-page agent wire (`use-agentic`'s WIRE.md), typed at both ends independently —
 * the wire is the contract, so the server never imports the client package.
 */
export interface AgentWireMessage {
  role: "user" | "assistant" | "tool";
  text?: string;
  toolCalls?: AgentWireToolCall[];
  toolResults?: AgentWireToolResult[];
  error?: string;
}

export interface AgentWireTool {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  effect?: string;
  needsConfirm?: boolean;
}

export interface AgentWireContext {
  kind: string;
  [key: string]: unknown;
}

export interface LlmTurnRequest {
  messages: AgentWireMessage[];
  tools: AgentWireTool[];
  context: AgentWireContext[];
  instructions?: string;
}

export interface LlmTurnAnswer {
  text?: string;
  toolCalls?: AgentWireToolCall[];
  stop: "end" | "toolUse";
}

/**
 * The provider seam for one stateless agent turn: the whole transcript in, one assistant answer out. The server
 * relays — it never executes a client tool — so this is the only surface a provider integration fills. An
 * implementation is an `adapt()` class in a lib's `srvkit/` and follows the adapter convention: failures are
 * logged and answered as `null`, and the calling service decides what that means.
 */
export interface LlmAdaptor {
  /**
   * `onDelta` opts into streaming: the adapter reports assistant text as it arrives and still resolves the full
   * answer. An adapter may ignore it — the caller treats zero reported deltas as "answered whole".
   */
  chat(request: LlmTurnRequest, onDelta?: (delta: string) => void): Promise<LlmTurnAnswer | null>;
}

/**
 * Settings for whichever adaptor fills `LlmAdaptorRole`, registered with `option.setLlm(...)` and injected as the
 * `llmOption` use. It belongs to the role rather than to one provider: swapping the default for another `adapt()`
 * class re-reads the same three fields under that provider's own defaults.
 */
export interface LlmOption {
  apiKey?: string;
  model?: string;
  host?: string;
}
