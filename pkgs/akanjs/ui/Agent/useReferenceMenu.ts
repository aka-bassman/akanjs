"use client";
import { type AgentFieldType, AgentValue } from "akanjs/store";
import { useEffect, useRef, useState } from "react";
import { type AgentSession, Reference } from "use-agentic";
import type { MenuRow } from "./Menu";

export interface ReferenceCandidate {
  refId: string;
  label: string;
  description?: string;
}

export interface ReferenceSource<T extends AgentFieldType = AgentFieldType> {
  refName: string;
  /** What this group of rows is called in the menu. */
  label: string;
  /** Masks what leaves the browser: name the class carrying the pointed-at fields, which a `Light<Model>` rarely is. */
  type: T;
  /** The signal aborts when the query moves on. */
  search: (query: string, signal: AbortSignal) => Promise<ReferenceCandidate[]>;
  /** Called once, when a row is picked. */
  resolve: (refId: string) => Promise<unknown>;
}

interface ReferenceMenuSetup {
  draft: string;
  sources: readonly ReferenceSource[];
  session: AgentSession;
  l: (key: string, param?: Record<string, string | number>) => string;
  onWrite: (text: string) => void;
}

// Only a word at the draft's end opens the menu: a textarea's caret is not in React state.
const atQuery = /(^|\s)@([^\s@[\]()]*)$/;

const searchDelay = 150;

export const useReferenceMenu = ({ draft, sources, session, l, onWrite }: ReferenceMenuSetup) => {
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hidden, setHidden] = useState(false);
  // A host builds `sources` inline, so its identity would re-run the search on every render.
  const held = useRef(sources);
  held.current = sources;
  const match = hidden ? null : atQuery.exec(draft);

  const query = match ? match[2] : null;
  const write = (candidate: ReferenceCandidate, source: ReferenceSource) => {
    const reference = { refName: source.refName, refId: candidate.refId, label: candidate.label };
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
