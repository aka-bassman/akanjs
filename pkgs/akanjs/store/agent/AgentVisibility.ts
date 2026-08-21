import { STATE_META } from "akanjs/base";
import { StoreRegistry } from "../storeRegistry";
import type { StoreAgentExposure } from "../types";

/**
 * Which stores the agent surface may show, derived from the registry: every registered store's state keys name
 * their owner, and a store's `static agent` declaration is its own exposure decision. Liveness rides on top —
 * `liveOwners` maps the subscribed keys back to store refNames, so the published surface follows the rendered
 * screen instead of the whole bundle.
 */
export class AgentVisibility {
  #owners: Map<string, string> | null = null;
  #ownersSize = -1;

  /** State key → owning store refName. First registration wins where a lib mixin shares a key. */
  #stateOwners(): Map<string, string> {
    const stores = StoreRegistry.stores;
    if (this.#owners && this.#ownersSize === stores.size) return this.#owners;
    const owners = new Map<string, string>();
    for (const [refName, cls] of stores)
      for (const key of Object.keys(cls[STATE_META] ?? {})) if (!owners.has(key)) owners.set(key, refName);
    this.#owners = owners;
    this.#ownersSize = stores.size;
    return owners;
  }

  stateOwner(key: string): string | undefined {
    return this.#stateOwners().get(key);
  }

  /** The stores that declared an exposure of their own, for the catalogue's refusal lines. */
  declaredExposures(): Map<string, StoreAgentExposure> {
    const declared = new Map<string, StoreAgentExposure>();
    for (const [refName, cls] of StoreRegistry.stores) if (cls.agent !== undefined) declared.set(refName, cls.agent);
    return declared;
  }

  #exposure(refName: string | undefined): StoreAgentExposure | undefined {
    return refName ? StoreRegistry.get(refName)?.agent : undefined;
  }

  visibleKey(key: string): boolean {
    const exposure = this.#exposure(this.stateOwner(key));
    if (exposure === false) return false;
    return !exposure?.exclude.includes(key);
  }

  visibleAction(name: string, ownerRefName?: string): boolean {
    const exposure = this.#exposure(ownerRefName);
    if (exposure === false) return false;
    return !exposure?.exclude.includes(name);
  }

  /**
   * The stores the rendered screen is reading right now: owners of the subscribed, still-visible keys. A key no
   * registered store owns has no module to activate, and an action with no owner stays published — only fabricated
   * stores outside the registry produce either.
   */
  liveOwners(liveKeys: ReadonlyMap<string, number>): Set<string> {
    const owners = new Set<string>();
    for (const key of liveKeys.keys()) {
      if (!this.visibleKey(key)) continue;
      const owner = this.stateOwner(key);
      if (owner) owners.add(owner);
    }
    return owners;
  }
}
