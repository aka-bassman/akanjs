"use client";
import type { ReactNode } from "react";

export interface RootProps {
  children: ReactNode;
  st: unknown;
}
/** @deprecated Renders `children` and ignores `st`; the generated client wires the store without a wrapper. */
export const Root = ({ children, st }: RootProps) => {
  return <>{children}</>;
};
