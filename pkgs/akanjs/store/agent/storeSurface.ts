import { AgenticSurface } from "use-agentic";
import { AgentBridge } from "./AgentBridge";
import { StoreSurfaceSource } from "./StoreSurfaceSource";

export interface StoreSurface {
  bridge: AgentBridge;
  source: StoreSurfaceSource;
  surface: AgenticSurface;
}

const SURFACE_KEY = Symbol.for("akanjs.store.agentSurface");

/** Once per runtime, lazily; never attached on the server, where one global surface would span requests. */
export const ensureStoreSurface = (): StoreSurface => {
  const holder = globalThis as typeof globalThis & { [SURFACE_KEY]?: StoreSurface };
  if (!holder[SURFACE_KEY]) {
    const bridge = AgentBridge.of();
    const source = new StoreSurfaceSource(bridge);
    const surface = AgenticSurface.shared;
    if (typeof window !== "undefined") surface.addSource(source);
    holder[SURFACE_KEY] = { bridge, source, surface };
  }
  return holder[SURFACE_KEY];
};
