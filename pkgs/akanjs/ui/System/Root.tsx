"use client";
import type { ReactNode } from "react";

/**
 * @deprecated Renders `children` and ignores `st`. It predates the generated client, which wires the store
 * without a wrapper — render the children directly.
 */
export interface RootProps {
  children: ReactNode;
  st: unknown;
}
export const Root = ({ children, st }: RootProps) => {
  return <>{children}</>;
};
