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
  // An undescribable `set` costs the write, not the read and not the render: the key stays readable and the page
  // still renders, which is what a bad type on an agent-tooling option is worth. Same trade as `st.tool`'s `.arg`.
  const set = name && meta.set ? writable(name, meta.set) : null;
  return useAgentState<T>(name, initial, {
    description: meta.desc,
    report: meta.report,
    serialize: meta.serialize ?? ((value) => readableValue(name ?? "", value, meta.mask)),
    ...(set
      ? {
          set: set.schema,
          parse: (value) => StToolBuilder.checkedValue(`set${capitalize(name ?? "")}`, "value", set.type, value) as T,
        }
      : {}),
  });
};

const writable = (name: string, type: ParamFieldType) => {
  try {
    return { schema: StToolBuilder.schemaOf(type), type };
  } catch (error) {
    console.error(
      `st.useState("${name}") stays read-only: its "set" type is ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
};
