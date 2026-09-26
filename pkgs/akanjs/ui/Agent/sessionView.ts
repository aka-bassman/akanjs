import { StoreSurfaceSource } from "akanjs/store";
import type { AgenticSurface, SurfaceView } from "use-agentic";

/** A tool the akan runtime contributes to every screen, whatever that screen declares. */
export type AgentBuiltin = (typeof StoreSurfaceSource.builtins)[number];

/** `true` (the default) takes all of them, `false` none, an array exactly the ones it names. */
export type BuiltinOption = boolean | AgentBuiltin[];

// Narrowed per session (the source is shared), and from `call` too: a tool reachable by guessing is not withheld.
export const sessionView = (surface: AgenticSurface, path: string[], builtins?: BuiltinOption): SurfaceView => {
  const scoped = path.length ? surface.view(path) : surface;
  if (builtins === undefined || builtins === true) return scoped;
  const kept = new Set<string>(builtins === false ? [] : builtins);
  const names = StoreSurfaceSource.builtins as readonly string[];
  const shown = (name: string) => kept.has(name) || !names.includes(name) || surface.declares(name, path);
  return {
    snapshot: () => {
      const snapshot = scoped.snapshot();
      return { ...snapshot, tools: snapshot.tools.filter((tool) => shown(tool.name)) };
    },
    tool: (name) => (shown(name) ? scoped.tool(name) : null),
    call: async (name, args) => {
      if (!shown(name)) throw new Error(`Unknown tool: ${name}`);
      return await scoped.call(name, args);
    },
    read: (name) => scoped.read(name),
    diffSince: (before) => scoped.diffSince(before),
    subscribe: (listener) => scoped.subscribe(listener),
  };
};
