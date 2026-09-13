"use client";
import { st } from "@libs/shared/client";
import type { ReactNode } from "react";

interface WebProps {
  children: ReactNode;
  type?: "unmount" | "hidden";
}

export const Web = ({ children, type = "unmount" }: WebProps) => {
  const innerWidth = st.use.innerWidth();
  return innerWidth > 768 ? children : type === "hidden" ? <div className="hidden">{children}</div> : null;
};
