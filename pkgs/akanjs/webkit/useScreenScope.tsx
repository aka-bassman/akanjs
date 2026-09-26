"use client";
import { useEffect, useRef } from "react";
import { AgenticSurface, useScopePath, useSurface } from "use-agentic";

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

/** Opens a scope under the ambient one, plus an `<id>.items` resource capped at 100 and marked `truncated` past it.
 * Returns the path the caller sets as `data-agent-scope`, which `readScreen({ section })` and `highlight` resolve. */
export const useScreenScope = ({ id, kind, label, items }: ScreenScopeOptions) => {
  const surface = useSurface();
  const parent = useScopePath();
  const live = useRef(items);
  live.current = items;
  const parentKey = parent.join(".");
  const path = AgenticSurface.childPath(parent, id).join(".");
  useEffect(() => {
    const closeScope = surface.openScope(parent, { id, kind, label });
    const closeItems = live.current
      ? surface.registerResource(AgenticSurface.childPath(parent, id), {
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
  }, [surface, parentKey, id, kind, label]);
  return path;
};
