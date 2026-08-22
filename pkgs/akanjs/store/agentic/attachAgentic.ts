import type { Dispatch, SetStateAction } from "react";
import { StToolBuilder, type StToolMeta } from "./StToolBuilder";
import { type StExposeMeta, useStExpose } from "./useStExpose";
import { type StStateMeta, useStState } from "./useStState";

export interface StAgentic {
  /** Local state the in-page agent can read. Writes need a `set` type and go through a named setter tool. */
  useState: <T>(name: string | null, initial: T | (() => T), meta?: StStateMeta<T>) => [T, Dispatch<SetStateAction<T>>];
  /** A read-only derived value the agent can read while the component is mounted. */
  expose: (name: string | null, value: unknown, meta?: StExposeMeta) => void;
  /**
   * A component tool: `.arg("id", ID)` chained onto one `.exec()` hook.
   *
   * A falsy name declares the tool without publishing it — the callable still drives the click a person makes.
   * Every one of these is a hook, so a conditional surface withholds the name rather than skipping the call.
   */
  tool: (name: string | null, meta?: StToolMeta) => StToolBuilder;
}

const stAgentic: StAgentic = {
  useState: useStState,
  expose: useStExpose,
  tool: (name, meta) => new StToolBuilder(name, meta),
};

/** Idempotent — `StoreRegistry.build` runs once per merged root, always onto the one instance. */
export const attachAgentic = <T extends object>(instance: T): T & StAgentic => Object.assign(instance, stAgentic);
