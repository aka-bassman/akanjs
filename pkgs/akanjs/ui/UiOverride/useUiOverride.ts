"use client";
import { useContext } from "react";

import { type AkanUiOverrides, UiOverrideContext } from "./context";

/** The active override for `name` in this route subtree, or `undefined`. */
export const useUiOverride = <K extends keyof AkanUiOverrides>(name: K): AkanUiOverrides[K] | undefined => {
  // Untyped read: materializing `Partial<AkanUiOverrides>[K]` over the generic slots trips TS2590.
  const overrides = useContext(UiOverrideContext) as Record<string, unknown>;
  return overrides[name] as AkanUiOverrides[K] | undefined;
};
