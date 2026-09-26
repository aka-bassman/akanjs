import type { SliceStateKey } from "../state";

export interface SerializedStoreState {
  /** Read off the live value — stores declare no types — so a `null`-initialized key says nothing. */
  type: "string" | "number" | "boolean" | "date" | "list" | "map" | "object" | "unknown";
  /** The model a read of this key is masked by. */
  refName?: string;
  modelType?: "input" | "full" | "light" | "insight";
  /** A `search()` or `computed()` key; writing it throws. */
  derived: boolean;
  role?: SliceStateKey;
}
