import { DraftStore } from "akanjs/store";

// Scoped here, off the raw seed, not in the store action: `new<Model>` merges into `default<Model>` first, where a
// `default: () => dayjs()` would key the same form differently on every open.
export type DraftProp = boolean | string;

export const editDraftScope = (draft: DraftProp | undefined, modelId: string | undefined): string | undefined => {
  if (draft === false || !modelId) return undefined;
  return typeof draft === "string" ? draft : DraftStore.editScope(modelId);
};

interface NewDraftScopeInput {
  seed: object | undefined;
  modal: string;
  sliceName: string;
  routePath: string;
}

export const newDraftScope = (draft: DraftProp | undefined, input: NewDraftScopeInput): string | undefined => {
  if (draft === false) return undefined;
  return typeof draft === "string" ? draft : DraftStore.newScope(input);
};
