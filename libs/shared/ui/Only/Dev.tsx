"use client";
import { st } from "@libs/shared/client";
import type { ReactNode } from "react";

interface DevProps {
  children: ReactNode;
}

export const Dev = ({ children }: DevProps) => {
  const devMode = st.use.devMode();
  return devMode ? children : null;
};
