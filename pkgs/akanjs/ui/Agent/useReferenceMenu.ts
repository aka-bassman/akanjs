"use client";
import { type AgentFieldType, AgentValue } from "akanjs/store";
import { useEffect, useRef, useState } from "react";
import { type AgentSession, Reference } from "use-agentic";
import type { MenuRow } from "./Menu";

/** One row the `@` menu offers: a document of its source's model, named the way the screen names it. */
export interface ReferenceCandidate {
  refId: string;
  label: string;
  description?: string;
}

/**
 * A kind of document the `@` menu can point at.
 *
 * `type` is the whole decision about what leaves the browser, in `st.expose`'s vocabulary — a model class masks by
 * that model. **Name the class that actually carries the fields somebody is pointing at**: a `Light<Model>` is
 * usually not it, and a reference masked by one arrives without the field that was the reason for pointing.
 *
 * `search` is the app's own query, because which documents a person may point at is the app's answer and not the
 * framework's; the signal is aborted when the query moves on. `resolve` is called once, when a row is picked.
 */
export interface ReferenceSource<T extends AgentFieldType = AgentFieldType> {
  refName: string;
  /** What this group of rows is called in the menu. */
  label: string;
  type: T;
  search: (query: string, signal: AbortSignal) => Promise<ReferenceCandidate[]>;
  resolve: (refId: string) => Promise<unknown>;
}

interface ReferenceMenuSetup {
  draft: string;
  sources: readonly ReferenceSource[];
  session: AgentSession;
  l: (key: string, param?: Record<string, string | number>) => string;
  onWrite: (text: string) => void;
}

/**
 * Only a word being typed at the end of the draft opens the menu. A `@` mid-sentence is left alone because the
 * draft is the only thing this can read — a textarea's caret is not in React state — and a completed token always
 * ends in a space, so the menu never reopens onto one it just wrote.
 */
const atQuery = /(^|\s)@([^\s@[\]()]*)$/;

/** Long enough that typing a name is one query rather than one per letter, short enough to feel like a menu. */
const searchDelay = 150;

export const useReferenceMenu = ({ draft, sources, session, l, onWrite }: ReferenceMenuSetup) => {
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hidden, setHidden] = useState(false);
  // Held in a ref because a host builds this array inline: depending on its identity would re-run the search on
  // every render, and depending on nothing would search against a stale closure.
  const held = useRef(sources);
  held.current = sources;
  const match = hidden ? null : atQuery.exec(draft);

  const query = match ? match[2] : null;
  const write = (candidate: ReferenceCandidate, source: ReferenceSource) => {
    const reference = { refName: source.refName, refId: candidate.refId, label: candidate.label };
    // The token first, the value when it lands: `resolve` is the app's own fetch, and a menu that freezes until it
    // answers is a menu. A value that never arrives leaves the pointer, which already reads as "go and read it".
    onWrite(`${draft.slice(0, match?.index ?? 0)}${match?.[1] ?? ""}${Reference.token(reference)} `);
    void source
      .resolve(candidate.refId)
      .then((value) => session.stage({ ...reference, value: AgentValue.serialize(source.type, value) }))
      .catch(() => session.note(l("base.agentReferenceFailed", { label: candidate.label })));
  };
  useEffect(() => {
    if (query === null || !held.current.length) {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const current = held.current;
      void Promise.all(
        current.map((source) => source.search(query, controller.signal).catch(() => [] as ReferenceCandidate[])),
      ).then((found) => {
        if (controller.signal.aborted) return;
        setCursor(0);
        setRows(
          found.flatMap((candidates, at) =>
            candidates.map((candidate) => ({
              name: candidate.label,
              description: candidate.description ?? current[at].label,
              pick: () => write(candidate, current[at]),
            })),
          ),
        );
      });
    }, searchDelay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, draft]);
  const selected = Math.min(cursor, Math.max(rows.length - 1, 0));
  return {
    rows: query === null ? [] : rows,
    selected,
    reopen: () => setHidden(false),
    hide: () => setHidden(true),
    move: (delta: number) => setCursor(Math.max(0, Math.min(selected + delta, rows.length - 1))),
    at: () => (query === null ? undefined : rows[selected]),
  };
};
