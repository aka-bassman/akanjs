import type { SerializedArg } from "akanjs/signal";
import type { SliceActionKey } from "../sliceRole";
import type { SliceStateKey } from "../state";

/** Which generated form-setter a store key is, when it is one. */
export type FormSetterRole = "set" | "add" | "sub" | "addOrSub";

/** What calling a store action reaches. `state` never leaves the browser. */
export type StoreActionEffect = "state" | "query" | "mutation";

export interface SerializedStoreAction {
  args: SerializedArg[];
  effect: StoreActionEffect;
  /** The model this key belongs to, when the key identifies one. */
  refName?: string;
  /** The endpoint whose arguments it borrows, when it is named after one. */
  endpoint?: string;
  /**
   * The framework made this one, so it has no words of its own and borrows the model's.
   *
   * Absent on an action a module wrote itself, which is the only kind a `.store()` entry is ever needed for.
   */
  generated?: boolean;
  /** The generated role, absent on an action a module wrote itself. */
  role?: SliceActionKey | FormSetterRole;
  /** The model field it writes, on a form setter. */
  field?: string;
}

export interface SerializedStoreState {
  /**
   * What the live value is. A store declares no types — `STATE_META` holds initial values — so this is read off the
   * value the store is holding, and a key initialized to `null` or `[]` says nothing about what may go into it.
   */
  type: "string" | "number" | "boolean" | "date" | "list" | "map" | "object" | "unknown";
  /** The model this key holds, when it holds one. What a read of it is masked by. */
  refName?: string;
  /** Which of the model's five classes, which is what decides the fields a read may carry. */
  modelType?: "input" | "full" | "light" | "insight";
  /** Materialized from a computation, the URL, or storage. Writing one throws, so it is read-only by construction. */
  derived: boolean;
  role?: SliceStateKey;
}

/**
 * One store instance described for an agent: every key it can read and every action it may call.
 *
 * Flat rather than grouped by model, because that is what the store is — `st.use.x` and `st.do.y` are one namespace,
 * so a key means the same thing to every reader and two models cannot both claim one. It is the store's answer to
 * `SerializedSignal`, and it is derived on the client from the built store rather than shipped from the server: the
 * store classes are in the bundle already, and a second copy over the wire is a second thing to keep in step.
 */
export interface SerializedStore {
  state: { [key: string]: SerializedStoreState };
  action: { [key: string]: SerializedStoreAction };
}
