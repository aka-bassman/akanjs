"use client";
import { SessionContext } from "use-agentic";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useContext } from "../hooks";
import { type AgentFieldType, AgentValue, type AgentValueOf } from "./AgentValue";

/** `refName`/`refId`/`path` say what was pointed at; `value` is what the model is shown now, masked by `type`. */
export interface AgentReferenceInput<T extends AgentFieldType> {
  refName: string;
  refId: string;
  /** What the chip draws and what the token in the draft spells. */
  label: string;
  /** A dotted path into the document, in `pathSet`'s vocabulary. Absent points at the whole of it. */
  path?: string;
  type: T;
  value: AgentValueOf<T>;
}

/** Stages a reference in the enclosing agent session; outside one it warns and does nothing. */
export const useAgentReference = () => {
  const session = useContext(SessionContext);
  return <T extends AgentFieldType>({ type, value, ...pointer }: AgentReferenceInput<T>) => {
    const owner = `reference ${pointer.refName}/${pointer.refId}`;
    if (!session) {
      console.warn(`${owner} was not staged: this component is not inside an <Agent.Chat /> or <Agent.Zone />.`);
      return;
    }
    if (!AgentValue.publishable(owner, type)) return;
    session.refer({ ...pointer, value: AgentValue.serialize(type, value) });
  };
};
