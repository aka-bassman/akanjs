"use client";
import { SessionContext } from "use-agentic";
// Through the `"use client"` shim, not `react` — see `StToolBuilder`.
import { useContext } from "../hooks";
import { type AgentFieldType, AgentValue, type AgentValueOf } from "./AgentValue";

/**
 * What a component hands over when the user points at data it is already drawing.
 *
 * The pointer and the value are declared apart on purpose. `refName`/`refId`/`path` say *what was pointed at*, and
 * travel so the agent can read it again later; `type` and `value` say *what is being shown to the model now*, and
 * the component supplies the value it already holds, so there is no round trip. They come apart because the two
 * are genuinely different in the case this exists for: a rich-text field stored as `field(Any)` is an editor
 * document at its path and a paragraph of prose to a reader, and the model wants the paragraph.
 *
 * `type` is `st.expose`'s vocabulary, not a second one. It decides what leaves the browser — a model class masks
 * by that model, a scalar passes, `Any` passes untouched — so naming a `Light` class that does not carry the field
 * is how a reference arrives empty.
 */
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

/**
 * Points the enclosing agent session at data, from anywhere that draws it.
 *
 * No-ops outside a session rather than throwing, the same call `AgentValue.publishable` makes: a card carrying a
 * reference button is mounted on whatever routes render it, and a route that happens to host no agent must not
 * lose its render over it.
 */
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
