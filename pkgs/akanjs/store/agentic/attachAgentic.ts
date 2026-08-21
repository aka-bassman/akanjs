import type { Dispatch, SetStateAction } from "react";
import { StToolBuilder, type StToolMeta } from "./StToolBuilder";
import { type StExposeMeta, useStExpose } from "./useStExpose";
import { type StStateMeta, useStState } from "./useStState";

export interface StAgentic {
  /** Local state the in-page agent can read. Writes need a `set` type and go through a named setter tool. */
  useState: <T>(name: string, initial: T | (() => T), meta?: StStateMeta<T>) => [T, Dispatch<SetStateAction<T>>];
  /** A read-only derived value the agent can read while the component is mounted. */
  expose: (name: string, value: unknown, meta?: StExposeMeta) => void;
  /** A component tool: `.arg("id", ID)` chained onto one `.exec()` hook. */
  tool: (name: string, meta?: StToolMeta) => StToolBuilder;
}

const stAgentic: StAgentic = {
  useState: useStState,
  expose: useStExpose,
  tool: (name, meta) => new StToolBuilder(name, meta),
};

/** Idempotent — `StoreRegistry.build` runs once per merged root, always onto the one instance. */
export const attachAgentic = <T extends object>(instance: T): T & StAgentic => Object.assign(instance, stAgentic);
