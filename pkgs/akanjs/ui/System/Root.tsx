"use client";
import type { ReactNode } from "react";

/** @deprecated Renders `children` and ignores `st`; the generated client wires the store without a wrapper. */
export interface RootProps {
  children: ReactNode;
  st: unknown;
}
export const Root = ({ children, st }: RootProps) => {
  return <>{children}</>;
};
