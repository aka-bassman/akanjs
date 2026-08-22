import { capitalize } from "akanjs/common";
import type { MaskModel, ParamFieldType } from "akanjs/constant";
import type { Dispatch, SetStateAction } from "react";
import { useAgentState } from "use-agentic";
import { readableValue } from "./readableValue";
import { StToolBuilder } from "./StToolBuilder";

export interface StStateMeta<T> {
  desc?: string;
  /** The model whose `hidden`/`secret` fields a read strips. An object value with no `mask` and no `serialize` is refused. */
  mask?: MaskModel;
  serialize?: (value: T) => unknown;
  report?: boolean;
  /** The scalar or enum an agent may write through the generated `set<Name>` tool. Read-only without it. */
  set?: ParamFieldType;
}

export const useStState = <T>(
  name: string | null,
  initial: T | (() => T),
  meta: StStateMeta<T> = {},
): [T, Dispatch<SetStateAction<T>>] => {
  const set = meta.set;
  return useAgentState<T>(name, initial, {
    description: meta.desc,
    report: meta.report,
    serialize: meta.serialize ?? ((value) => readableValue(name ?? "", value, meta.mask)),
    ...(set
      ? {
          set: StToolBuilder.schemaOf(set),
          parse: (value) => StToolBuilder.checkedValue(`set${capitalize(name ?? "")}`, "value", set, value) as T,
        }
      : {}),
  });
};
