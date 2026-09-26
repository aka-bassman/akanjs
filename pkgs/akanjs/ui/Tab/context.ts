"use client";
import type { RefObject } from "react";
import { sharedContext } from "../../client/sharedContext";

interface TabContextType {
  defaultMenu: string | null;
  menu: string | null;
  setMenu: (value: string | null) => void;
  /** Mounted menu key → disabled. */
  menus: RefObject<Map<string, boolean>>;
  switchTab: (menu: string) => void;
}

export const TabContext = sharedContext<TabContextType>("tab", {
  defaultMenu: null,
  menu: null,
  setMenu: (value: string | null) => null,
  menus: null as unknown as RefObject<Map<string, boolean>>,
  switchTab: (menu: string) => null,
});
