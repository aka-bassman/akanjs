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
 * Unmarked means `resource`. That is the safe default for listing (the entry stays visible and is stopped at
 * call time), and it is why the marker can be retrofitted one guard at a time.
 */
export type GuardScope = "account" | "resource";

export type GuardCls<Name extends string = string> = Cls<Guard, { readonly name: Name; readonly scope?: GuardScope }>;

/** Creates a named guard base class for signal access checks. */
export const guard = <T extends string>(name: T): GuardCls<T> => {
  return class Guard {
    static name = name;
    canPass(context: SignalContext): PromiseOrObject<boolean> {
      return true;
    }
  };
};
