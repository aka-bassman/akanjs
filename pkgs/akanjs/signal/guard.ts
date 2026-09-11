import type { Cls, PromiseOrObject } from "akanjs/base";
import type { SignalContext } from "./signalContext";

export interface Guard {
  canPass(context: SignalContext): PromiseOrObject<boolean>;
}

/**
 * What a guard needs in order to answer. `account` reads the caller and nothing else, so it can be evaluated
 * with no arguments — which is what lets a catalogue hide what the caller certainly cannot use. `resource` needs
 * the call's arguments and fails closed without them, so evaluating one early would erase legitimate entries.
 *
 * Required, with no default. Exposure is decided by a guard rather than by an opt-in, so an unmarked guard would
 * silently take the `resource` path and list its endpoint to every caller — the whole guarded surface's names,
 * refused only at call time. There is no safe guess here, so the author states it.
 */
export type GuardScope = "account" | "resource";

/**
 * A guard that admits no model — one that refuses every MCP call and every call on an agent's token — says so with
 * `static agents = false`. The MCP catalogue then refuses every endpoint it guards outright, the way `mcp: false`
 * does, instead of publishing an entry that every agent would only ever be refused. Optional, unlike `scope`: the
 * default (agents may pass, subject to the verdict) is the one almost every guard means.
 */
export type GuardCls<Name extends string = string> = Cls<
  Guard,
  { readonly name: Name; readonly scope: GuardScope; readonly agents?: boolean }
>;

/** Whether any guard in the list admits no agent at all — the fact the serializer stamps on an endpoint as `agents: false`. */
export const refusesAgents = (guards: readonly GuardCls[] | undefined): boolean =>
  !!guards?.some((GuardCls) => GuardCls.agents === false);

/** Creates a named guard base class for signal access checks. */
export const guard = <T extends string>(name: T): GuardCls<T> => {
  return class Guard {
    static name = name;
    static scope: GuardScope = "account";
    canPass(context: SignalContext): PromiseOrObject<boolean> {
      return true;
    }
  };
};

/**
 * Guards read everything from the context they are handed and are already required to be side-effect free and
 * safe to re-run — `SignalResolver.revalidateWsRooms` re-runs them outside of any request — so one instance per
 * class serves every call instead of one per guard per request. Built on first use, not at registration: a guard
 * may be declared long before the container it reads from is up.
 */
const instances = new WeakMap<GuardCls, Guard>();
export const guardOf = (GuardCls: GuardCls): Guard => {
  const cached = instances.get(GuardCls);
  if (cached) return cached;
  const guard = new GuardCls();
  instances.set(GuardCls, guard);
  return guard;
};
