import type { SerializedArg } from "akanjs/signal";
import type { SliceStateKey } from "./state";

export type SliceActionKey =
  | "initModel"
  | "refreshModel"
  | "selectModel"
  | "setPageOfModel"
  | "loadMoreOfModel"
  | "setLimitOfModel"
  | "setQueryArgsOfModel"
  | "setSortOfModel"
  | "applyLiveModel"
  | "watchLiveModel";

/** Recorded while the key is built: reversing the splice is ambiguous (`setPageOfPage` on a model named `page`). */
export interface SliceActionRole {
  role: SliceActionKey;
  refName: string;
  sliceName: string;
  /** The slice's own arguments, which the `initModel` and `setQueryArgsOfModel` roles take positionally. */
  args: SerializedArg[];
}

export interface SliceStateRole {
  role: SliceStateKey;
  refName: string;
  sliceName: string;
}
