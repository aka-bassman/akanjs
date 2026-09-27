import { useAgentResource } from "use-agentic";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useRef } from "../hooks";
import { type AgentFieldType, AgentValue, type AgentValueOf } from "./AgentValue";

export interface StExposeMeta {
  /** `false` keeps the key out of post-call diff reports — for values that change on their own every second. */
  report?: boolean;
}

/** `.value()` is the hook; the declared type, not the value's class, decides what the read masks. */
export class StExposeBuilder<T extends AgentFieldType> {
  readonly #name: string | null;
  readonly #type: T;
  readonly #desc: string;
  readonly #meta: StExposeMeta;

  constructor(name: string | null, type: T, desc: string, meta: StExposeMeta = {}) {
    this.#name = name;
    this.#type = type;
    this.#desc = desc;
    this.#meta = meta;
  }

  /** A thunk is evaluated when the agent reads, not at render. */
  value(value: AgentValueOf<T> | (() => AgentValueOf<T>) | null | undefined): void {
    const declared = useRef<{ key: string | null; name: string | null } | null>(null);
    // Re-resolved on a name change, not frozen: a withheld name that appears later must publish, and vice versa.
    if (declared.current?.key !== this.#name)
      declared.current = {
        key: this.#name,
        name: this.#name && AgentValue.publishable(`st.expose("${this.#name}")`, this.#type) ? this.#name : null,
      };
    useAgentResource(declared.current.name, value, {
      description: this.#desc,
      report: this.#meta.report,
      serialize: (current) =>
        AgentValue.serialize(this.#type, typeof current === "function" ? (current as () => unknown)() : current),
    });
  }
}
