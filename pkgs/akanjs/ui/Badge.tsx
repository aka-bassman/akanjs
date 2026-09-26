"use client";
import type { HTMLAttributes } from "react";
import { type BadgeVariants, badgeRecipe } from "./recipe";
import { createOverridable, useUiRecipe } from "./UiOverride";

export { type BadgeVariants, badgeRecipe };

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & BadgeVariants;

const DefaultBadge = ({ className, variant, size, outline, ...rest }: BadgeProps) => {
  const recipe = useUiRecipe("badge") ?? badgeRecipe;
  return <span className={recipe({ variant, size, outline }, className)} {...rest} />;
};

export const Badge = createOverridable("Badge", DefaultBadge);
