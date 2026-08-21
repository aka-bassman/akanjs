"use client";
import { useEffect, useRef } from "react";
import { AgenticSurface, useSurface } from "use-agentic";

export interface ScreenScopeItem {
  id: string;
  label?: string;
}

interface ScreenScopeOptions {
  id: string;
  kind: string;
  label?: string;
  items?: () => ScreenScopeItem[];
}

const ITEM_CAP = 100;

/**
 * Announces what a component has on screen: one scope for its mounted lifetime, plus an `<id>.items` resource
 * naming what it currently renders. `Load.Units`/`Load.View` call this, so every list and detail view is visible
 * to the in-page agent with no app code. Items are capped and the cap is declared — a truncated list must never
 * read as the whole one.
 */
export const useScreenScope = ({ id, kind, label, items }: ScreenScopeOptions) => {
  const surface = useSurface();
  const live = useRef(items);
  live.current = items;
  useEffect(() => {
    const closeScope = surface.openScope([], { id, kind, label });
    const closeItems = live.current
      ? surface.registerResource(AgenticSurface.childPath([], id), {
          name: "items",
          read: () => {
            const list = live.current?.() ?? [];
            return {
              total: list.length,
              items: list.slice(0, ITEM_CAP),
              ...(list.length > ITEM_CAP ? { truncated: true } : {}),
            };
          },
        })
      : null;
    return () => {
      closeItems?.();
      closeScope();
    };
  }, [surface, id, kind, label]);
};
