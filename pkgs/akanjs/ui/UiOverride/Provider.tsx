"use client";
import { type ReactNode, useContext, useMemo } from "react";

import { type AkanUiOverrideManifest, UiOverrideContext } from "./context";

export interface UiOverrideProviderProps {
  value?: AkanUiOverrideManifest;
  children?: ReactNode;
}

/** Merges `value` over the inherited overrides (closest wins; `recipes` merges per slot). */
export const UiOverrideProvider = ({ value, children }: UiOverrideProviderProps) => {
  const parent = useContext(UiOverrideContext);
  const merged = useMemo(
    () => ({ ...parent, ...value, recipes: { ...parent.recipes, ...value?.recipes } }),
    [parent, value],
  );
  return <UiOverrideContext.Provider value={merged}>{children}</UiOverrideContext.Provider>;
};
