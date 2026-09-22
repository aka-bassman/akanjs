import type { CodeAgentMcpServerRef } from "akanjs/common";

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

interface JsonRpcResponse {
  id?: number;
  result?: { tools?: McpToolInfo[]; content?: unknown; isError?: boolean };
  error?: { code: number; message: string };
}

const protocolVersion = "2025-06-18";

/**
 * A server that answered correctly and asked who is calling.
 *
 * Its own class because the caller has to tell it apart from every other connect failure: this one is fixed by
 * signing in, and reporting it as "unavailable" sends someone to debug a server that is working.
 */
export class McpUnauthorized extends Error {
  /** The `WWW-Authenticate` value, which names the resource metadata discovery starts from. */
  readonly challenge: string;

  constructor(name: string, challenge: string) {
    super(`MCP server "${name}" requires authentication`);
    this.name = "McpUnauthorized";
    this.challenge = challenge;
  }
}

/**
 * A client for one MCP server, over stdio or streamable HTTP.
 *
 * **Every failure is non-fatal.** A server that will not start, answers nothing, or dies mid-session costs its
 * own tools and nothing else: an agent that cannot finish a turn because an unrelated integration is down is
 * worse than one with fewer tools.
 */
export class McpClient {
  readonly ref: CodeAgentMcpServerRef;
  #proc: Bun.Subprocess<"pipe", "pipe", "ignore"> | undefined;
  #nextId = 0;
  #buffer = "";
  readonly #pending = new Map<number, (response: JsonRpcResponse) => void>();
  #sessionId: string | undefined;
  readonly #token: string | undefined;

  constructor(ref: CodeAgentMcpServerRef, token?: string) {
    this.ref = ref;
    this.#token = token;
  }

  async connect() {
    if (this.ref.transport === "stdio") this.#spawn();
    const initialize = await this.#call("initialize", {
      protocolVersion,
      capabilities: {},
      clientInfo: { name: "akan-code", version: "1" },
    });
    if (initialize.error) throw new Error(initialize.error.message);
    await this.#notify("notifications/initialized");
    return this;
  }

  async listTools(): Promise<McpToolInfo[]> {
    const response = await this.#call("tools/list", {});
    if (response.error) throw new Error(response.error.message);
    return response.result?.tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown>) {
    const response = await this.#call("tools/call", { name, arguments: args });
    if (response.error) return { text: response.error.message, isError: true };
    return { text: McpClient.#renderContent(response.result?.content), isError: !!response.result?.isError };
  }

  close() {
    this.#proc?.kill();
    this.#proc = undefined;
    for (const resolve of this.#pending.values()) resolve({ error: { code: -1, message: "MCP server closed" } });
    this.#pending.clear();
  }

  #spawn() {
    if (!this.ref.command) throw new Error(`MCP server "${this.ref.name}" declares no command`);
    this.#proc = Bun.spawn([this.ref.command, ...(this.ref.args ?? [])], {
      stdin: "pipe",
      stdout: "pipe",
      // A server's diagnostics belong in its own stderr, never mixed into the JSON-RPC stream.
      stderr: "ignore",
      env: { ...process.env, ...this.ref.env },
    });
    void this.#readStdout();
  }

  async #readStdout() {
    const decoder = new TextDecoder();
    for await (const chunk of this.#proc?.stdout ?? []) {
      this.#buffer += decoder.decode(chunk as Uint8Array, { stream: true });
      let index = this.#buffer.indexOf("\n");
      while (index >= 0) {
        const line = this.#buffer.slice(0, index).trim();
        this.#buffer = this.#buffer.slice(index + 1);
        if (line) this.#receive(line);
        index = this.#buffer.indexOf("\n");
      }
    }
  }

  #receive(line: string) {
    try {
      const message = JSON.parse(line) as JsonRpcResponse;
      if (typeof message.id !== "number") return;
      this.#pending.get(message.id)?.(message);
      this.#pending.delete(message.id);
    } catch {
      // A server that writes anything but JSON-RPC on stdout is misbehaving; dropping the line keeps us alive.
    }
  }

  async #call(method: string, params: unknown): Promise<JsonRpcResponse> {
    this.#nextId += 1;
    const id = this.#nextId;
    const request = { jsonrpc: "2.0", id, method, params };
    if (this.ref.transport === "http") return await this.#post(request);
    this.#proc?.stdin.write(`${JSON.stringify(request)}\n`);
    return await new Promise<JsonRpcResponse>((resolve) => {
      this.#pending.set(id, resolve);
      setTimeout(() => {
        if (!this.#pending.delete(id)) return;
        resolve({ error: { code: -2, message: `MCP server "${this.ref.name}" timed out on ${method}` } });
      }, 30_000);
    });
  }

  async #notify(method: string) {
    const request = { jsonrpc: "2.0", method };
    if (this.ref.transport === "http") await this.#post(request);
    else this.#proc?.stdin.write(`${JSON.stringify(request)}\n`);
  }

  async #post(body: unknown): Promise<JsonRpcResponse> {
    if (!this.ref.url) throw new Error(`MCP server "${this.ref.name}" declares no url`);
    const response = await fetch(this.ref.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Streamable HTTP lets a server answer either way; a client that omits the SSE type gets a 406.
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": protocolVersion,
        ...this.ref.headers,
        ...(this.#token ? { authorization: `Bearer ${this.#token}` } : {}),
        ...(this.#sessionId ? { "mcp-session-id": this.#sessionId } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    // Raised rather than returned as a JSON-RPC error: a 401 carries no body worth reading, and the whole of
    // what the caller needs is in the header that came with it.
    if (response.status === 401)
      throw new McpUnauthorized(this.ref.name, response.headers.get("www-authenticate") ?? "");
    this.#sessionId = response.headers.get("mcp-session-id") ?? this.#sessionId;
    const text = await response.text();
    if (!text.trim()) return {};
    // An SSE answer to a single request carries one `data:` line holding the whole JSON-RPC response.
    const payload = text.startsWith("event:") || text.startsWith("data:") ? McpClient.#firstSseData(text) : text;
    return payload ? (JSON.parse(payload) as JsonRpcResponse) : {};
  }

  static #firstSseData(text: string) {
    return text
      .split("\n")
      .find((line) => line.startsWith("data:"))
      ?.slice(5)
      .trim();
  }

  static #renderContent(content: unknown) {
    if (!Array.isArray(content)) return typeof content === "string" ? content : JSON.stringify(content ?? null);
    return content
      .map((part: { type?: string; text?: string }) =>
        part.type === "text" ? (part.text ?? "") : JSON.stringify(part),
      )
      .join("\n");
  }
}
