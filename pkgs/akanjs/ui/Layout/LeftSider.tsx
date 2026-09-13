"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { BiX } from "react-icons/bi";
import { buttonRecipe } from "../Button";

export interface LeftSiderProps {
  className?: string;
  children: ReactNode;
  open: boolean;
  width?: number | string;
  /** Element that closes the drawer. `false` draws none. */
  close?: ReactNode | false;
  onCancel: () => void;
}
export const LeftSider = ({ className, children, open, width, close, onCancel }: LeftSiderProps) => {
  return (
    <div
      className={cn(
        "absolute top-0 border-muted border-r bg-background transition-all duration-150",
        open ? "translate-x-0" : "translate-x-[-100%]",
        className,
      )}
      style={{ width }}
    >
      {children}
      {close === false ? null : (
        <div
          className="absolute top-0 right-0"
          onClick={() => {
            onCancel();
          }}
        >
          {close ?? (
            <button className={buttonRecipe({ variant: "ghost", size: "icon" })}>
              <BiX />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
