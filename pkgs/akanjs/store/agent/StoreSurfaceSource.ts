import { router } from "akanjs/client";
import type { SurfaceSource, ToolEntry } from "use-agentic";
import { AgentBridge } from "./AgentBridge";
import { ScreenReader } from "./ScreenReader";

/**
 * The three tools every akan screen has whatever it declares: where it can go, what it is rendering, and what one
 * of the store keys it reads holds. Everything else an agent may do is a component's own `st.tool` declaration —
 * the store contributes no actions, because a method on a store class is not something the screen offers the user.
 *
 * Per zone view: a zone's `readState` reaches the keys its own subtree subscribes, and its `readScreen` reads its
 * own `data-agent-zone` container rather than the whole document. A page can shadow any of the three by
 * registering a hook tool of the same name — hook entries win over a source's.
 */
export class StoreSurfaceSource implements SurfaceSource {
  #bridge: AgentBridge | null;
  readonly #builtins = new Map<string, ToolEntry[]>();

  /** Lazy by default: `AgentBridge.of()` walks the whole store, so it waits for the first enumeration. */
  constructor(bridge?: AgentBridge) {
    this.#bridge = bridge ?? null;
  }

  tools = (view: string[] = []): ToolEntry[] => {
    const viewKey = view.join(".");
    let builtins = this.#builtins.get(viewKey);
    if (!builtins) {
      builtins = [StoreSurfaceSource.#navigate(), StoreSurfaceSource.#readScreen(viewKey), this.#readState(viewKey)];
      this.#builtins.set(viewKey, builtins);
    }
    return builtins;
  };

  /** Screen-driving is client navigation, so the agent gets the same router `Link` rides. */
  static #navigate(): ToolEntry {
    return {
      name: "navigate",
      description: "Navigate this page to an internal path of this app, e.g. /docs/intro/quickstart.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
        additionalProperties: false,
      },
      effect: "state",
      // An absolute or scheme-relative URL would send the user off-site; the agent only ever drives this app.
      guard: (args) =>
        typeof args.path === "string" && args.path.startsWith("/") && !args.path.startsWith("//")
          ? true
          : "path must be an internal path starting with /.",
      run: (args) => {
        const path = String(args.path);
        router.push(path);
        return `Navigating to ${path}.`;
      },
    };
  }

  /** What the user is looking at, read from the rendered DOM — the store never held it, so no key can answer it. */
  static #readScreen(viewKey: string): ToolEntry {
    return {
      name: "readScreen",
      description: viewKey
        ? "Read what is currently rendered in this zone — headings, prose, links, buttons, and form values. Use it when the user asks about what this zone shows."
        : "Read what is currently rendered on this page — headings, prose, links, buttons, and form values. Use it when the user asks about the current page or screen.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
      effect: "query",
      run: () => ScreenReader.read(StoreSurfaceSource.#zoneRoot(viewKey)),
    };
  }

  /** The pull half of the state context block: keys are listed there, values arrive masked through this. */
  #readState(viewKey: string): ToolEntry {
    return {
      name: "readState",
      description: "Read one store state key of this page. Keys are listed in the state context block.",
      parameters: {
        type: "object",
        properties: { key: { type: "string" } },
        required: ["key"],
        additionalProperties: false,
      },
      effect: "state",
      run: (args: Record<string, unknown>) => {
        this.#bridge ??= AgentBridge.of();
        return this.#bridge.read(String(args.key), viewKey);
      },
    };
  }

  static #zoneRoot(viewKey: string): HTMLElement | undefined {
    if (!viewKey || typeof document === "undefined") return undefined;
    return document.querySelector<HTMLElement>(`[data-agent-zone="${CSS.escape(viewKey)}"]`) ?? undefined;
  }
}
