"use client";
import { createContext, type RefObject } from "react";

interface TabContextType {
  defaultMenu: string | null;
  menu: string | null;
  setMenu: (value: string | null) => void;
  /** Every mounted menu key against whether it is disabled — the tab's own vocabulary, for the agent and for the disabled fallback. */
  menus: RefObject<Map<string, boolean>>;
  switchTab: (menu: string) => void;
}

export const TabContext = createContext<TabContextType>({
  defaultMenu: null,
  menu: null,
  setMenu: (value: string | null) => null,
  menus: null as unknown as RefObject<Map<string, boolean>>,
  switchTab: (menu: string) => null,
});
