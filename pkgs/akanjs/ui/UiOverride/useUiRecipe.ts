"use client";
import { useContext } from "react";

import { type AkanUiRecipes, UiOverrideContext } from "./context";

/** The active recipe swap for `name` in this route subtree, or `undefined`. */
export const useUiRecipe = <K extends keyof AkanUiRecipes>(name: K): AkanUiRecipes[K] | undefined => {
  const { recipes } = useContext(UiOverrideContext);
  return recipes?.[name];
};
