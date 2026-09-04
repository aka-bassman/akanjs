import { recipe, tv } from "akanjs/ui";

/**
 * Range slider — `<input type="range">`. daisyUI's `.range` drew the track and thumb through vendor
 * pseudo-elements, which is the one shape a utility recipe has to spell out per browser: `::-webkit-*`
 * and `::-moz-*` do not merge into one selector, so every rule appears twice.
 *
 * `-webkit-slider-runnable-track` needs an explicit height or Chrome falls back to the intrinsic
 * control height and the thumb floats off the line.
 *
 * Server-safe: never add "use client" here.
 */
const track = "[&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:rounded-full";
const thumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-none [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none";

export const rangeRecipe = recipe(
  tv({
    base: `w-full cursor-pointer appearance-none bg-transparent outline-none ${track} ${thumb} [&::-webkit-slider-runnable-track]:bg-muted [&::-moz-range-track]:bg-muted disabled:cursor-not-allowed disabled:opacity-50`,
    variants: {
      size: {
        xs: "h-3 [&::-webkit-slider-runnable-track]:h-1 [&::-moz-range-track]:h-1 [&::-webkit-slider-thumb]:size-3 [&::-moz-range-thumb]:size-3 [&::-webkit-slider-thumb]:-mt-1",
        sm: "h-4 [&::-webkit-slider-runnable-track]:h-1.5 [&::-moz-range-track]:h-1.5 [&::-webkit-slider-thumb]:size-4 [&::-moz-range-thumb]:size-4 [&::-webkit-slider-thumb]:-mt-[0.3125rem]",
        md: "h-6 [&::-webkit-slider-runnable-track]:h-2 [&::-moz-range-track]:h-2 [&::-webkit-slider-thumb]:size-6 [&::-moz-range-thumb]:size-6 [&::-webkit-slider-thumb]:-mt-2",
        lg: "h-8 [&::-webkit-slider-runnable-track]:h-3 [&::-moz-range-track]:h-3 [&::-webkit-slider-thumb]:size-8 [&::-moz-range-thumb]:size-8 [&::-webkit-slider-thumb]:-mt-2.5",
      },
      tone: {
        default: "[&::-webkit-slider-thumb]:bg-foreground [&::-moz-range-thumb]:bg-foreground",
        primary: "[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary",
        secondary: "[&::-webkit-slider-thumb]:bg-secondary [&::-moz-range-thumb]:bg-secondary",
        accent: "[&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:bg-accent",
        success: "[&::-webkit-slider-thumb]:bg-success [&::-moz-range-thumb]:bg-success",
        warning: "[&::-webkit-slider-thumb]:bg-warning [&::-moz-range-thumb]:bg-warning",
        error: "[&::-webkit-slider-thumb]:bg-destructive [&::-moz-range-thumb]:bg-destructive",
      },
    },
    defaultVariants: { size: "md", tone: "default" },
  }),
);
export type RangeVariants = NonNullable<Parameters<typeof rangeRecipe>[0]>;
