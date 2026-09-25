import { DraftStore } from "akanjs/store";

/**
 * How an edit shell's `draft` prop becomes a scope, or nothing.
 *
 * The scope is built here rather than in the store action because this is where the *raw* seed is: `new<Model>`
 * merges its argument into `default<Model>` first, and a `default: () => dayjs()` in that merge would give the
 * same form a different key every time it opened.
 */
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
