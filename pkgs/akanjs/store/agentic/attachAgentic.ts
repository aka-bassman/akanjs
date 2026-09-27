import type { AgentFieldType } from "./AgentValue";
import type { StExposeMeta } from "./StExposeBuilder";
import { StExposeDraft } from "./StExposeDraft";
import type { StStateMeta } from "./StStateBuilder";
import { StStateDraft } from "./StStateDraft";
import type { StToolMeta } from "./StToolBuilder";
import { StToolDraft } from "./StToolDraft";

export interface StAgentic {
  /** Agent-readable local state: `.desc()` then `.init()` (the hook). Agent writes need `set: true`. */
  useState: <T extends AgentFieldType>(name: string | null, type: T, meta?: StStateMeta) => StStateDraft<T>;
  /** A read-only derived value the agent can read while the component is mounted: `.desc()` then `.value()`. */
  expose: <T extends AgentFieldType>(name: string | null, type: T, meta?: StExposeMeta) => StExposeDraft<T>;
  /** `.desc()`, `.arg()`/`.opt()`, then the hook `.exec()` or `.card()`. A falsy name declares without publishing. */
  tool: (name: string | null, meta?: StToolMeta) => StToolDraft;
}

const stAgentic: StAgentic = {
  useState: (name, type, meta) => new StStateDraft(name, type, meta),
  expose: (name, type, meta) => new StExposeDraft(name, type, meta),
  tool: (name, meta) => new StToolDraft(name, meta),
};

/** Idempotent — `StoreRegistry.build` runs once per merged root, always onto the one instance. */
export const attachAgentic = <T extends object>(instance: T): T & StAgentic => Object.assign(instance, stAgentic);
