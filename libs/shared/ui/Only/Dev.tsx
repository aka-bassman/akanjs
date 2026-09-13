"use client";
import { st } from "@libs/shared/client";
import type { ReactNode } from "react";

interface DevProps {
  children: ReactNode;
  type?: "unmount" | "hidden";
}

export const Dev = ({ children, type = "unmount" }: DevProps) => {
  const devMode = st.use.devMode();
  return devMode ? children : type === "hidden" ? <div className="hidden">{children}</div> : null;
};
