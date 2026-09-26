import type { ContextBlock, SurfaceView } from "use-agentic";
import type { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import type { AgentBridge } from "./AgentBridge";
import { ensureStoreSurface } from "./StoreSurfaceSource";

/** A turn's default context: route, on-screen scopes, and live keys (small primitives inline, the rest by name). */
export class AgentContext {
  static of(): AgentContext {
    return new AgentContext(StoreRegistry.instance, ensureStoreSurface().bridge);
  }

  readonly #instance: StoreInstance;
  readonly #bridge: AgentBridge;

  constructor(instance: StoreInstance, bridge: AgentBridge) {
    this.#instance = instance;
    this.#bridge = bridge;
  }

  blocks(surface: SurfaceView, view: string[] = []): ContextBlock[] {
    const state = this.#instance.get();
    const { scopes, resources } = surface.snapshot();
    return [
      {
        kind: "route",
        path: String(state.pathname ?? ""),
        params: state.params ?? {},
        searchParams: state.searchParams ?? {},
      },
      ...(scopes.length || resources.length ? [{ kind: "screen", scopes, resources }] : []),
      ...this.#liveBlock(view.join(".")),
    ];
  }

  #liveBlock(viewKey: string): ContextBlock[] {
    const live = this.#bridge.readableKeys(viewKey).map((key) => this.#liveEntry(key));
    return live.length ? [{ kind: "state", live, note: "Call readState(key) to read a value." }] : [];
  }

  #liveEntry(key: string) {
    const meta = this.#bridge.state[key];
    const value = AgentContext.#inlineValue(this.#instance.get()[key]);
    return {
      key,
      ...(meta?.refName ? { model: meta.refName } : {}),
      ...(meta ? { type: meta.type } : {}),
      ...(value !== undefined ? { value } : {}),
    };
  }

  static #inlineValue(value: unknown): unknown {
    if (value === null) return null;
    switch (typeof value) {
      case "string":
        return value.length <= 200 ? value : `${value.slice(0, 200)}…`;
      case "number":
      case "boolean":
        return value;
      default:
        return undefined;
    }
  }
}
