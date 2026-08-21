import type { BackendEnv, PromiseOrObject } from "akanjs/base";
import type { Adaptor, AdaptorCls, LlmOption } from "akanjs/service";
import type { AgentRelayPolicy, MiddlewareCls } from "akanjs/signal";
import type { McpServerOption } from "./akanServer";
import type { WebProxyRegistration } from "./proxy";
import { HostBasePathWebProxy, LocaleWebProxy } from "./proxy";

export interface AdaptorOverride {
  role: AdaptorCls;
  adaptor: AdaptorCls;
}

/**
 * App/library server option builder: use objects, signal middleware, adaptor overrides, web proxies, and the
 * server settings an app owns — MCP, the agent relay's access policy, and the LLM the relay speaks to.
 */
export class AkanOption<Env extends BackendEnv = BackendEnv> {
  readonly #getUses: ((env: Env) => Record<string, PromiseOrObject<unknown>>)[];
  readonly #middlewares: MiddlewareCls[] = [];
  readonly #adaptorOverrides: AdaptorOverride[] = [];
  readonly #webProxies: WebProxyRegistration[] = [];
  readonly #getLlms: ((env: Env) => LlmOption)[] = [];
  #mcp: boolean | McpServerOption | undefined;
  #agentAccess: AgentRelayPolicy | null | undefined;
  constructor() {
    this.#getUses = [];
  }
  use(fnOrObject: ((env: Env) => Record<string, PromiseOrObject<unknown>>) | Record<string, PromiseOrObject<unknown>>) {
    if (typeof fnOrObject === "function")
      this.#getUses.push(fnOrObject as (env: Env) => Record<string, PromiseOrObject<unknown>>);
    else this.#getUses.push(() => fnOrObject);
    return this;
  }
  applyMiddleware(...middlewares: MiddlewareCls[]) {
    this.#middlewares.push(...middlewares);
    return this;
  }
  /** Rebinds a predefined adaptor role (e.g. `LlmAdaptorRole`) to the app's own implementation. Last writer wins. */
  applyAdaptor<T extends Adaptor>(role: AdaptorCls<T>, adaptor: AdaptorCls<T>) {
    this.#adaptorOverrides.push({ role: role as AdaptorCls, adaptor: adaptor as AdaptorCls });
    return this;
  }
  applyWebProxy(...proxies: WebProxyRegistration[]) {
    this.#webProxies.push(...proxies);
    return this;
  }
  /**
   * MCP server settings for the app mounting this option, merged over the `AKAN_MCP_*` environment and under an
   * option the server is constructed with. The app's own `option.ts` is the last lib the server reads, so it wins
   * over every library it depends on.
   */
  setMcp(mcp: boolean | McpServerOption = true) {
    this.#mcp = mcp;
    return this;
  }
  /**
   * Who may spend the LLM key through the `runAgentTurn` relay. With no policy the call is refused — the same
   * answer `None` gives — because the framework has no account model to gate on. `null` clears the policy.
   */
  setAgentAccess(policy: AgentRelayPolicy | null) {
    this.#agentAccess = policy;
    return this;
  }
  /** Settings for whichever adaptor fills `LlmAdaptorRole`, injected into it as the `llmOption` use. */
  setLlm(llmOrFn: LlmOption | ((env: Env) => LlmOption)) {
    if (typeof llmOrFn === "function") this.#getLlms.push(llmOrFn);
    else this.#getLlms.push(() => llmOrFn);
    return this;
  }
  getUses(env: Env): Record<string, PromiseOrObject<unknown>> {
    const uses = this.#getUses.map((fn) => fn(env));
    return Object.assign({}, ...uses);
  }
  getMiddlewares(): MiddlewareCls[] {
    return this.#middlewares;
  }
  getAdaptorOverrides(): AdaptorOverride[] {
    return this.#adaptorOverrides;
  }
  getWebProxies(): WebProxyRegistration[] {
    return this.#webProxies;
  }
  getMcp(): boolean | McpServerOption | undefined {
    return this.#mcp;
  }
  getAgentAccess(): AgentRelayPolicy | null | undefined {
    return this.#agentAccess;
  }
  getLlm(env: Env): LlmOption {
    return Object.assign({}, ...this.#getLlms.map((fn) => fn(env)));
  }
}

export function createDefaultAkanOption() {
  return new AkanOption().applyWebProxy(LocaleWebProxy, HostBasePathWebProxy);
}
