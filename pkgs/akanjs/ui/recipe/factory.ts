import type { ClassNameValue as ClassValue } from "tailwind-merge";
import { createTV } from "tailwind-variants";
import { colorTokens, radiusTokens } from "../../client/cn";

// tv carries its own tailwind-merge; without akan's tokens it would not merge them the way `cn` does.
export const tv = createTV({ twMergeConfig: { extend: { theme: { color: colorTokens, radius: radiusTokens } } } });

/** `className` takes arrays and falsy values and is merged inside, so never wrap it in `cn()`. */
export const recipe =
  <P extends object>(styles: (props?: P) => string) =>
  (variants?: Omit<P, "class" | "className">, className?: ClassValue): string =>
    styles({ ...variants, class: className } as unknown as P);
