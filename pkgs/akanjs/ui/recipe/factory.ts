import type { ClassNameValue as ClassValue } from "tailwind-merge";
import { cn } from "../../client/cn";

//? `lite` joins without merging: the full build inlines its own tailwind-merge copy (~30 KB) beside the one `cn`
//? already ships, and `recipe` merges once through `cn`, which also knows akan's tokens.
export { tv } from "tailwind-variants/lite";

/** `className` takes arrays and falsy values and is merged inside, so never wrap it in `cn()`. */
export const recipe =
  <P extends object>(styles: (props?: P) => string) =>
  (variants?: Omit<P, "class" | "className">, className?: ClassValue): string =>
    cn(styles(variants as P), className);
