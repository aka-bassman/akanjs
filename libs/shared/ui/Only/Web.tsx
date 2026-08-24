"use client";
import { st } from "@libs/shared/client";
import type { ReactNode } from "react";

interface WebProps {
  children: ReactNode;
}

export const Web = ({ children }: WebProps) => {
  const innerWidth = st.use.innerWidth();
  return innerWidth > 768 ? children : null;
};
