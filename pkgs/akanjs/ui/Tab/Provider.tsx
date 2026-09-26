"use client";
import { Any } from "akanjs/base";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import { st } from "akanjs/store";
import { type ReactNode, useRef, useState } from "react";

import { TabContext } from "./context";

export interface ProviderProps {
  className?: string;
  defaultMenu?: string | null;
  /** Names the tab for the in-page agent; omitted, it publishes nothing (two tabs would share a name). */
  namespace?: string;
  children?: ReactNode;
}
export const Provider = ({ className, defaultMenu = null, namespace, children }: ProviderProps) => {
  const menus = useRef(new Map<string, boolean>());
  const [menu, setMenu] = useState<string | null>(defaultMenu);
  const suffix = namespace ? capitalize(namespace) : "";
  st.expose(namespace ? `tabsIn${suffix}` : null, Any)
    .desc("The menus this tab offers and the one it shows.")
    // A thunk, not a value: the children fill `menus` after this render, so a value built here is empty.
    .value(() => ({
      current: menu,
      menus: [...menus.current].map(([key, disabled]) => (disabled ? { menu: key, disabled } : { menu: key })),
    }));
  // A call-time guard, not a static `oneOf`: the children fill `menus` after this render.
  const switchTab = st
    .tool(namespace ? `switchTabIn${suffix}` : null, {
      guard: ({ menu }) => {
        const disabled = menus.current.get(menu as string);
        if (disabled === undefined)
          return `No menu "${String(menu)}" on this tab. It offers: ${[...menus.current.keys()].join(", ")}.`;
        return disabled ? `The menu "${String(menu)}" is disabled.` : true;
      },
    })
    .desc(`Show one menu of the ${namespace ?? ""} tab. Read tabsIn${suffix} for the menus it offers.`)
    .arg("menu", String)
    .exec((next) => {
      setMenu(next);
    });
  return (
    <TabContext.Provider value={{ defaultMenu, menu, setMenu, menus, switchTab }}>
      <div data-menu={menu} className={cn(className, "group/tab")}>
        {children}
      </div>
    </TabContext.Provider>
  );
};
