import { ACTION_TAG } from "akanjs/base";

/**
 * Where an action came from.
 *
 * `generated` is stamped by `store()`, which runs before any subclass body exists; the class body `register()` walks
 * afterwards is exactly the module's own. The distinction is what keeps `createX` / `setFieldOnX` / `submitX` out of
 * the description accounting: a generated action has no words of its own to write and borrows the model's, so
 * demanding a dictionary entry for one would be demanding text nobody reads.
 */
export interface ActionOwner {
  refName: string;
  generated: boolean;
}

export interface ActionTag {
  /** The `st.do` key this function is. */
  action: string;
  /** The state path it writes, when it writes exactly one — `userForm.name` for a field setter. */
  state?: string;
}

/**
 * Marks a dispatcher with what it does, so a component handed one by reference can say so in the DOM.
 *
 * `onChange={st.do.setNameOnUser}` is the house form for every model field, which means the component already holds
 * everything an annotation needs — it just has no way to read it off a function. This is that way, and it is why
 * `data-akan-*` costs an app no code at all: nobody writes the attribute, the setter carries its own name.
 *
 * Non-enumerable, so it survives neither `{...fn}` nor `JSON.stringify` and shows up in no spread.
 */
export const tagAction = <T extends (...args: never[]) => unknown>(fn: T, tag: ActionTag): T => {
  Object.defineProperty(fn, ACTION_TAG, { value: tag, configurable: true });
  return fn;
};

export const actionTagOf = (value: unknown): ActionTag | undefined => {
  if (typeof value !== "function") return undefined;
  const tag = (value as unknown as { [key: symbol]: unknown })[ACTION_TAG];
  return tag && typeof tag === "object" ? (tag as ActionTag) : undefined;
};
