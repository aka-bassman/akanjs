"use client";
import { st } from "@libs/shared/client";
import type { ReactNode } from "react";

interface MobileProps {
  children: ReactNode;
  type?: "unmount" | "hidden";
}

export const Mobile = ({ children, type = "unmount" }: MobileProps) => {
  const innerWidth = st.use.innerWidth();
  return innerWidth && innerWidth < 768 ? (
    children
  ) : type === "hidden" ? (
    <div className="hidden">{children}</div>
  ) : null;
};
