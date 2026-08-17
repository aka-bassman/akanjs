import { type BaseEnv, ENDPOINT_META } from "akanjs/base";
import { Logger } from "akanjs/common";
import { DictionaryLookup } from "akanjs/dictionary";
import { NoDocumentError } from "akanjs/document";
import type { InjectRegistry, LiveRegistry } from "akanjs/service";
import type { Endpoint, EndpointCls } from "../../signal/endpoint";
import type { EndpointInfo } from "../../signal/endpointInfo";
import type { GuardCls } from "../../signal/guard";
import {
  McpDocument,
  McpErrorCode,
  type McpExposedEndpoint,
  type McpToolResult,
  type PromptMessage,
} from "../../signal/mcp";
import type { MiddlewareCls } from "../../signal/middleware";
import { SignalContext } from "../../signal/signalContext";
import { McpExecutionContext } from "./McpExecutionContext";

/** Raised when the caller presented no credential at all, so the client should be told to authenticate. */
export class McpAuthRequiredError extends Error {}

/**
 * A prompt failure whose message has already been through `#message` and is safe to put on the wire.
 *
 * It carries its JSON-RPC code because a prompt has no `isError` result to put a refusal in, so the code is the
 * only place left to say whose fault it was. Without it a mistyped argument reads as `-32603 internal error`,
 * while the *missing*-argument check `prompts/get` does itself answers `-32602` — the same mistake, two codes.
 */
export class McpPromptError extends Error {
  readonly code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

interface McpDispatcherProps {
  registry: InjectRegistry;
  env: BaseEnv;
  live: LiveRegistry;
  middleware: Map<string, MiddlewareCls>;
  /** The one language error text is resolved in, matching the catalogue the client was handed. */
  language?: string;
}

/** Executes one MCP tool call or resource read through the ordinary signal pipeline. */
export class McpDispatcher {
  static readonly logger = new Logger("McpDispatcher");

  readonly #props: McpDispatcherProps;
  #endpoints: Map<string, { endpointInfo: EndpointInfo; endpoint: Endpoint }> | null = null;
  /**
   * Built on first use and then held: the merge behind it is not free, a server whose calls all succeed never
   * needs it, and a caller that types an argument wrong drives that path as often as it likes.
   *
   * Not deferred for the reason the endpoint index below is. Dictionaries register at module evaluation, before
   * any route exists — `McpRouter` builds one at boot to resolve the catalogue's own text — so a lookup made in
   * the constructor would be correct, just paid for by every process whether or not a call ever fails.
   */
  #lookup: DictionaryLookup | null = null;

  constructor(props: McpDispatcherProps) {
    this.#props = props;
  }

  async call(exposed: McpExposedEndpoint, args: Record<string, unknown>, req: Request): Promise<McpToolResult> {
    const found = this.#index().get(exposed.key);
    if (!found) return McpDispatcher.#failure(`Tool "${exposed.key}" is declared but not mounted on this server.`);
    try {
      const value = await this.#exec(exposed.key, found, args, req);
      const structuredContent = McpDocument.structuredContent(exposed.endpoint, value);
      return {
        content: [{ type: "text", text: McpDispatcher.#text(structuredContent, value) }],
        ...(structuredContent === undefined ? {} : { structuredContent }),
        isError: false,
      };
    } catch (error) {
      const status = McpDispatcher.#statusOf(error);
      // Only the client can fix a missing credential, and only if it is told to authenticate. A refusal of a
      // credential that *was* presented goes back as a tool error instead: that is a failure the model can act
      // on by asking the user or choosing another tool.
      if ((status === 401 || status === 403) && !req.headers.get("authorization")) throw new McpAuthRequiredError();
      return McpDispatcher.#failure(this.#message(error, status, exposed.refName));
    }
  }

  /**
   * A prompt is user-chosen, not model-chosen, so a failure has nowhere to go but the JSON-RPC error — there is
   * no `isError` result the model could read and recover from. Errors propagate to the router unchanged.
   *
   * The messages arrive already normalized: `SignalContext` does that for every `prompt`, so this route and the
   * plain HTTP one return the same shape.
   */
  async prompt(exposed: McpExposedEndpoint, args: Record<string, unknown>, req: Request): Promise<PromptMessage[]> {
    const found = this.#index().get(exposed.key);
    if (!found)
      throw new McpPromptError(
        `Prompt "${exposed.key}" is declared but not mounted on this server.`,
        McpErrorCode.internal,
      );
    try {
      return (await this.#exec(exposed.key, found, args, req)) as PromptMessage[];
    } catch (error) {
      const status = McpDispatcher.#statusOf(error);
      if ((status === 401 || status === 403) && !req.headers.get("authorization")) throw new McpAuthRequiredError();
      throw new McpPromptError(this.#message(error, status, exposed.refName), McpDispatcher.#codeOf(status));
    }
  }

  /**
   * Drops catalogue entries whose account-scoped guards refuse this caller — an anonymous agent should not be
   * offered a shelf of admin tools it can only fail at. Entries with no such guard are kept and stopped at call
   * time instead, so the listing is a UX filter and never the access decision.
   *
   * The context is deliberately not `init()`-ed: parsing arguments that a listing does not have would throw,
   * and a resource guard reached here reads `undefined` and fails closed, which is the behaviour we want.
   */
  async filterForAccount<T extends { name: string }>(items: T[], req: Request): Promise<T[]> {
    const index = this.#index();
    // One verdict per distinct set of account guards rather than per entry. `canListForAccount` runs the whole
    // global middleware chain, and `AccountMiddleware` verifies the bearer token inside it — so a hundred-entry
    // catalogue otherwise costs a hundred JWT verifications, three times over for the three listings. Sound
    // because an account guard reads the caller and nothing about the entry; one that read `context.key` would
    // be a resource guard mismarked, and those are not evaluated here at all.
    const ids = new Map<GuardCls, number>();
    const idOf = (GuardCls: GuardCls) => {
      const id = ids.get(GuardCls);
      if (id !== undefined) return id;
      ids.set(GuardCls, ids.size);
      return ids.size - 1;
    };
    const cached = new Map<string, Promise<boolean>>();
    const verdicts = await Promise.all(
      items.map(async (item) => {
        const found = index.get(item.name);
        if (!found) return true;
        const guards = (found.endpointInfo.signalOption.guards ?? []).filter(
          (GuardCls) => GuardCls.scope === "account",
        );
        if (!guards.length) return true;
        const key = guards
          .map(idOf)
          .sort((a, b) => a - b)
          .join(",");
        const verdict =
          cached.get(key) ??
          new SignalContext(item.name, req as Bun.BunRequest, {
            ...this.#props,
            endpointInfo: found.endpointInfo,
            adaptor: found.endpoint,
            ctx: new McpExecutionContext(req, {}),
          }).canListForAccount();
        cached.set(key, verdict);
        return await verdict;
      }),
    );
    return items.filter((_item, idx) => verdicts[idx]);
  }

  async #exec(
    key: string,
    { endpointInfo, endpoint }: { endpointInfo: EndpointInfo; endpoint: Endpoint },
    args: Record<string, unknown>,
    req: Request,
  ) {
    // Deliberately not wrapped in `SignalContext.try`: that helper puts the stack trace into its 500 body, and
    // a stack is the last thing to hand an agent that will quote it back into a transcript.
    const context = await new SignalContext(key, req as Bun.BunRequest, {
      ...this.#props,
      endpointInfo,
      adaptor: endpoint,
      ctx: new McpExecutionContext(req, args),
    }).init();
    return (await context.exec()) as unknown;
  }

  /**
   * Built on first use and kept: nothing before a `tools/call` needs it, and a router constructed to answer one
   * request — which tests and tooling do — should not walk the whole registry to do it. Not an ordering
   * workaround; DI has finished filling the registry long before any route is created.
   *
   * Keyed by endpoint key, which is globally unique and is what MCP names a tool by.
   */
  #index() {
    if (this.#endpoints) return this.#endpoints;
    const endpoints = new Map<string, { endpointInfo: EndpointInfo; endpoint: Endpoint }>();
    for (const [endpointCls, endpoint] of this.#props.registry.endpoint.entries()) {
      const meta = (endpointCls as EndpointCls)[ENDPOINT_META] as { [key: string]: EndpointInfo };
      for (const [key, endpointInfo] of Object.entries(meta)) endpoints.set(key, { endpointInfo, endpoint });
    }
    this.#endpoints = endpoints;
    return endpoints;
  }

  #message(error: unknown, status: number | undefined, refName: string): string {
    // `NoDocumentError` carries the wording internal callers match on — `No Document (user): 6712ab…`, a shape
    // and an echoed id that say nothing an agent can act on. Restated once here rather than at the throw site,
    // which has to keep the message it has.
    if (error instanceof NoDocumentError) return `No ${refName} found for the arguments given.`;
    if (status && status < 500) {
      const raw = error instanceof Error ? error.message : String(error);
      // A domain `Err` carries its dictionary key as the message; anything else is already prose.
      this.#lookup ??= new DictionaryLookup(this.#props.language);
      const text = this.#lookup.text(raw);
      if (text) return text;
      // What is left in this band at 401/403 is the framework's own refusal, `Access denied by guard: Admin` —
      // the private authorization structure named to the one caller not allowed to see it, which is what the
      // shared "unknown tool" message exists to keep off the wire. A domain error resolved above and keeps its
      // own words; all this one leaves an agent to act on is that it may not, which is all it may know.
      if (status === 401 || status === 403) return "You are not permitted to perform this action.";
      return raw;
    }
    // An unexpected failure is logged in full and described in one flat sentence: the detail an agent would
    // quote back into a transcript is the same detail an attacker would read.
    McpDispatcher.logger.error(`MCP call failed: ${error instanceof Error ? (error.stack ?? error.message) : error}`);
    return "The server failed to complete this request.";
  }

  /**
   * Anything without a status is treated as a crash, so the two failures an agent can trigger at will carry one:
   * `McpArgumentError` (400) and `NoDocumentError` (404). Without them a mistyped id logged a stack and answered
   * "the server failed", which is both a lie and a log-spam path any caller could drive.
   */
  static #statusOf(error: unknown): number | undefined {
    const status = (error as { statusCode?: unknown } | null)?.statusCode;
    return typeof status === "number" ? status : undefined;
  }

  /**
   * The same split `#message` makes, in the currency a prompt reports failures in. `-32602` covers a not-found
   * as well as a bad argument: this revision retired `-32002` and points resource-does-not-exist at invalid
   * params, so the two caller mistakes share one code by the spec's own choice rather than for want of another.
   */
  static #codeOf(status: number | undefined) {
    return status && status < 500 ? McpErrorCode.invalidParams : McpErrorCode.internal;
  }

  /**
   * The text block every result carries, whether or not a structured one goes with it.
   *
   * A structured result is mirrored as its JSON, which is what the spec asks for so a client with no structured
   * support still reads the payload. A scalar return has no structured half to mirror, and encoding one as JSON
   * spent the block on syntax: a tool returning an id answered `"507f…"`, quotes included, which a model then has
   * to know to strip. Numbers and booleans read the same either way; only a string differs.
   *
   * `JSON.stringify(undefined)` is `undefined` rather than a string, so a void return would otherwise ship a
   * content block with no `text` at all.
   */
  static #text(structuredContent: unknown, value: unknown) {
    if (structuredContent === undefined && typeof value === "string") return value;
    return JSON.stringify(structuredContent ?? value) ?? "null";
  }

  static #failure(message: string): McpToolResult {
    return { content: [{ type: "text", text: message }], isError: true };
  }
}
