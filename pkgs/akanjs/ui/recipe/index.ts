// Server-safe, never "use client". Re-exports only: the recipe scanner skips index.ts, so a recipe here goes unindexed.
export { type BadgeVariants, badgeRecipe } from "./badgeRecipe";
export { type ButtonVariants, buttonRecipe } from "./buttonRecipe";
export { recipe, tv } from "./factory";
export { type InputSurfaceVariants, inputRecipe } from "./inputRecipe";
