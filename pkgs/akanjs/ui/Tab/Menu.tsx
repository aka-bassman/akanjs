"use client";
import { cn } from "akanjs/client";
import { type ReactNode, useContext, useEffect } from "react";

import { Tooltip } from "../Tooltip";
import { TabContext } from "./context";

export interface MenuProps {
  className?: string;
  activeClassName?: string;
  disabledClassName?: string;
  disabled?: boolean;
  menu: string;
  children: ReactNode;
  scrollToTop?: boolean;
  tooltip?: string;
}
export const Menu = ({
  className,
  activeClassName = "",
  disabledClassName = "",
  disabled = false,
  menu,
  children,
  scrollToTop,
  tooltip,
}: MenuProps) => {
  const { menu: currentMenu, setMenu, menuSet } = useContext(TabContext);
  useEffect(() => {
    if (!menuSet.current) return;
    menuSet.current.add(menu);
  }, [menu]);
  useEffect(() => {
    if (!disabled || !menuSet.current) return;
    if (currentMenu === menu) setMenu([...menuSet.current.values()].find((m) => m !== menu) ?? null);
  }, [disabled]);

  const active = menu === currentMenu;
  return (
    <Tooltip content={tooltip}>
      <button
        aria-selected={active}
        className={cn(
          "rounded-field px-3 py-1.5 font-medium text-sm transition-colors",
          !active && !disabled && "cursor-pointer text-foreground/55 hover:bg-muted/60 hover:text-foreground/80",
          active && "bg-muted text-foreground",
          disabled && "cursor-not-allowed opacity-50",
          className,
          active && activeClassName,
          disabled && disabledClassName,
        )}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setMenu(menu);
          if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        role="tab"
        type="button"
      >
        {children}
      </button>
    </Tooltip>
  );
};
