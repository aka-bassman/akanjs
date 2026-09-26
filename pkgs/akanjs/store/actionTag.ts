import { ACTION_TAG } from "akanjs/base";

/** Which module declared an action. The dictionary node its words live in is named after it. */
export interface ActionOwner {
  refName: string;
}

export interface ActionTag {
  action: string;
  /** The state path it writes, when it writes exactly one — `userForm.name` for a field setter. */
  state?: string;
}

/** Tags a dispatcher (non-enumerable) so a control handed it by reference can emit `data-akan-*`. */
export const tagAction = <T extends (...args: never[]) => unknown>(fn: T, tag: ActionTag): T => {
  Object.defineProperty(fn, ACTION_TAG, { value: tag, configurable: true });
  return fn;
};

export const actionTagOf = (value: unknown): ActionTag | undefined => {
  if (typeof value !== "function") return undefined;
  const tag = (value as unknown as { [key: symbol]: unknown })[ACTION_TAG];
  return tag && typeof tag === "object" ? (tag as ActionTag) : undefined;
};
